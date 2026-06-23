"""Auth endpoints — phone OTP (dev mode) + JWT."""
import random
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..config import settings
from ..database import get_db
from ..models import ConsentLog, FamilyMember, User
from ..responses import ok
from ..schemas import OTPSendRequest, OTPVerifyRequest
from ..security import create_access_token, get_current_user
from ..serializers import serialize_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/config-status")
def config_status():
    """Public endpoint to verify backend configuration (no auth required)."""
    secret = settings.supabase_jwt_secret.strip()
    return {
        "supabase_jwt_configured": settings.using_supabase,
        "supabase_jwt_secret_length": len(secret),
        "database_configured": not settings.sqlalchemy_url.startswith("sqlite"),
        "environment": settings.environment,
    }

# In-memory OTP store (dev). For production use Redis with TTL.
_otp_store: dict[str, str] = {}


@router.post("/otp/send")
def send_otp(payload: OTPSendRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    if settings.otp_mode == "dev":
        code = settings.otp_dev_code
    else:
        code = f"{random.randint(100000, 999999)}"
    _otp_store[phone] = code

    user = db.query(User).filter(User.phone == phone).first()
    is_new_user = user is None

    data = {
        "phone": phone,
        "otp_expiry_seconds": 300,
        "is_new_user": is_new_user,
    }
    # In dev mode, return the OTP so the app can be tested without SMS.
    if settings.otp_mode == "dev":
        data["dev_otp"] = code
    return ok(data, message="OTP sent successfully")


@router.post("/otp/verify")
def verify_otp(payload: OTPVerifyRequest, db: Session = Depends(get_db)):
    phone = payload.phone.strip()
    expected = _otp_store.get(phone)

    # Dev fallback: always accept the configured dev code.
    valid = payload.otp == expected or (
        settings.otp_mode == "dev" and payload.otp == settings.otp_dev_code
    )
    if not valid:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP",
        )
    _otp_store.pop(phone, None)

    user = db.query(User).filter(User.phone == phone).first()
    is_new_user = user is None
    if is_new_user:
        user = User(phone=phone, last_login_at=datetime.utcnow())
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.last_login_at = datetime.utcnow()
        db.commit()

    has_profile = user.profile is not None
    has_consent = (
        db.query(ConsentLog)
        .filter(ConsentLog.user_id == user.id, ConsentLog.is_granted.is_(True))
        .first()
        is not None
    )

    token = create_access_token(user.id, user.phone, user.role)
    return ok(
        {
            "access_token": token,
            "user": serialize_user(user),
            "is_new_user": is_new_user,
            "has_profile": has_profile,
            "has_consent": has_consent,
        },
        message="Login successful",
    )


@router.post("/logout")
def logout(current_user: User = Depends(get_current_user)):
    # Stateless JWT — client just discards the token.
    return ok(message="Logged out successfully")


@router.get("/me")
def me(current_user: User = Depends(get_current_user)):
    return ok(serialize_user(current_user))
