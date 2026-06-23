"""JWT verification and auth dependency.

Supports two Supabase JWT modes automatically:
 - Legacy HS256: verified with SUPABASE_JWT_SECRET
 - New JWT Signing Keys (ES256/RS256): verified via JWKS at SUPABASE_URL/.well-known/jwks.json

Set SUPABASE_JWT_SECRET (always) and SUPABASE_URL (for new signing keys).
"""
import json
import logging
import urllib.request
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwk, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

logger = logging.getLogger("medivault.security")
bearer_scheme = HTTPBearer(auto_error=False)

# In-process JWKS cache (refreshed every 12 h)
_jwks_cache: dict | None = None
_jwks_cached_at: datetime | None = None
_JWKS_TTL = timedelta(hours=12)


# ---------- Our own JWT (dev fallback) ----------

def create_access_token(user_id: str, phone: str, role: str = "user") -> str:
    expire = datetime.utcnow() + timedelta(minutes=settings.jwt_access_token_expire_minutes)
    payload = {
        "sub": user_id,
        "phone": phone,
        "role": role,
        "iat": datetime.utcnow(),
        "exp": expire,
    }
    return jwt.encode(payload, settings.jwt_secret_key, algorithm=settings.jwt_algorithm)


def _decode_own_token(token: str) -> dict:
    return jwt.decode(token, settings.jwt_secret_key, algorithms=[settings.jwt_algorithm])


# ---------- Supabase JWT ----------

def _fetch_jwks() -> dict:
    """Fetch and cache the JWKS from Supabase (for new JWT Signing Keys)."""
    global _jwks_cache, _jwks_cached_at
    now = datetime.utcnow()
    if _jwks_cache is not None and _jwks_cached_at and (now - _jwks_cached_at) < _JWKS_TTL:
        return _jwks_cache
    url = f"{settings.supabase_url.rstrip('/')}/.well-known/jwks.json"
    logger.info("Fetching JWKS from %s", url)
    with urllib.request.urlopen(url, timeout=10) as resp:
        data = json.loads(resp.read())
    _jwks_cache = data
    _jwks_cached_at = now
    return data


def _decode_supabase_token(token: str) -> dict:
    """Verify a Supabase JWT — auto-detects HS256 (legacy) vs RS256/ES256 (new keys)."""
    try:
        header = jwt.get_unverified_header(token)
    except JWTError:
        raise

    alg = header.get("alg", "HS256")
    logger.debug("Supabase JWT alg=%s kid=%s", alg, header.get("kid"))

    if alg == "HS256":
        # Legacy JWT secret path
        secret = settings.supabase_jwt_secret.strip()
        return jwt.decode(token, secret, algorithms=["HS256"], options={"verify_aud": False})

    # New JWT Signing Keys — verify via JWKS
    if not settings.supabase_url.strip():
        raise JWTError(
            f"JWT uses {alg} but SUPABASE_URL is not configured. "
            "Set SUPABASE_URL on the backend to enable JWKS verification."
        )

    kid = header.get("kid")
    jwks = _fetch_jwks()
    candidates = [k for k in jwks.get("keys", []) if not kid or k.get("kid") == kid]
    if not candidates:
        raise JWTError(f"No JWKS key found matching kid={kid!r}")

    last_err: Exception = JWTError("No keys tried")
    for key_data in candidates:
        try:
            public_key = jwk.construct(key_data, algorithm=alg)
            return jwt.decode(token, public_key, algorithms=[alg], options={"verify_aud": False})
        except JWTError as exc:
            last_err = exc
    raise last_err


# ---------- FastAPI dependency ----------

def get_current_user(
    creds: HTTPAuthorizationCredentials = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if creds is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required",
        )

    try:
        if settings.using_supabase:
            payload = _decode_supabase_token(creds.credentials)
        else:
            try:
                payload = _decode_own_token(creds.credentials)
            except JWTError:
                logger.error(
                    "JWT verification failed and SUPABASE_JWT_SECRET is not set. "
                    "Add SUPABASE_JWT_SECRET to Railway backend variables."
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid token. Set SUPABASE_JWT_SECRET on the backend.",
                )
        user_id: str | None = payload.get("sub")
    except JWTError as exc:
        logger.warning("JWT decode failed: %s", exc)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
        )

    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token payload")

    user = db.query(User).filter(User.id == user_id).first()

    if user is None:
        # Auto-create on first authenticated request (Supabase user sync).
        phone = payload.get("phone") or None
        email = payload.get("email") or None
        user = User(id=user_id, phone=phone, email=email, last_login_at=datetime.utcnow())
        db.add(user)
        try:
            db.commit()
        except Exception:
            db.rollback()
            user = db.query(User).filter(User.id == user_id).first()
            if user is None:
                raise HTTPException(status_code=500, detail="User sync failed")
        db.refresh(user)

    if not user.is_active:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Account deactivated")

    return user
