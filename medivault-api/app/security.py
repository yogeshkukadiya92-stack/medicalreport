"""JWT verification and auth dependency.

Priority:
1. If SUPABASE_JWT_SECRET is set  → verify Supabase-issued JWT (production).
2. Otherwise                      → verify our own JWT (dev/test fallback).

Supabase tokens carry the user's UUID in `sub`, phone in `phone`, and
email in `email`. On first request the user row is auto-created so the
rest of the app never needs to handle missing users.
"""
import logging
from datetime import datetime, timedelta

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jose import JWTError, jwt
from sqlalchemy.orm import Session

from .config import settings
from .database import get_db
from .models import User

logger = logging.getLogger("medivault.security")
bearer_scheme = HTTPBearer(auto_error=False)


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

def _decode_supabase_token(token: str) -> dict:
    """Verify a Supabase JWT using the project's JWT Secret (HS256).

    Supabase payload shape:
      sub   → user UUID
      phone → "+91..."  (phone auth)
      email → "x@y.z"  (email auth)
      aud   → "authenticated"
      role  → "authenticated"
    """
    return jwt.decode(
        token,
        settings.supabase_jwt_secret,
        algorithms=["HS256"],
        options={"verify_aud": False},  # aud value is "authenticated", not our API
    )


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
            # SUPABASE_JWT_SECRET not configured — try own JWT.
            # If this also fails the token is likely a Supabase JWT sent to a
            # backend that hasn't been configured yet.
            try:
                payload = _decode_own_token(creds.credentials)
            except JWTError:
                logger.error(
                    "JWT verification failed. "
                    "If you are using Supabase auth, set the SUPABASE_JWT_SECRET "
                    "environment variable on your backend service."
                )
                raise HTTPException(
                    status_code=status.HTTP_401_UNAUTHORIZED,
                    detail="Invalid or expired token. Backend may be missing SUPABASE_JWT_SECRET.",
                )
        user_id: str | None = payload.get("sub")
    except JWTError:
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
