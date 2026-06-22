"""Consent log endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ConsentLog, User
from ..responses import ok
from ..schemas import ConsentGrant
from ..security import get_current_user

router = APIRouter(prefix="/consents", tags=["consents"])


@router.get("")
def list_consents(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consents = (
        db.query(ConsentLog)
        .filter(ConsentLog.user_id == current_user.id)
        .order_by(ConsentLog.created_at.desc())
        .all()
    )
    # Latest state per consent_type
    seen: dict[str, dict] = {}
    for c in consents:
        if c.consent_type in seen:
            continue
        seen[c.consent_type] = {
            "consent_type": c.consent_type,
            "consent_version": c.consent_version,
            "is_granted": c.is_granted,
            "granted_at": c.granted_at.isoformat() + "Z" if c.granted_at else None,
        }
    return ok(list(seen.values()))


@router.post("")
def grant_consent(
    payload: ConsentGrant,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consent = ConsentLog(
        user_id=current_user.id,
        consent_type=payload.consent_type,
        consent_version=payload.consent_version,
        is_granted=payload.is_granted,
        granted_at=datetime.utcnow() if payload.is_granted else None,
    )
    db.add(consent)
    db.commit()
    return ok(message="Consent recorded")


@router.post("/revoke")
def revoke_consent(
    payload: ConsentGrant,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    consent = ConsentLog(
        user_id=current_user.id,
        consent_type=payload.consent_type,
        consent_version=payload.consent_version,
        is_granted=False,
        revoked_at=datetime.utcnow(),
    )
    db.add(consent)
    db.commit()
    return ok(message="Consent revoked")
