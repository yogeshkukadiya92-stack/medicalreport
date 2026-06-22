"""Family members endpoints."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FamilyMember, MedicalReport, User
from ..responses import ok
from ..schemas import FamilyMemberCreate, FamilyMemberUpdate
from ..security import get_current_user
from ..serializers import serialize_family_member

router = APIRouter(prefix="/family-members", tags=["family"])

MAX_MEMBERS = 10


def _report_count(db: Session, member_id: str) -> int:
    return (
        db.query(MedicalReport)
        .filter(
            MedicalReport.family_member_id == member_id,
            MedicalReport.deleted_at.is_(None),
        )
        .count()
    )


def _get_member(db: Session, user: User, member_id: str) -> FamilyMember:
    member = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.id == member_id,
            FamilyMember.user_id == user.id,
            FamilyMember.deleted_at.is_(None),
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")
    return member


@router.get("")
def list_members(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    members = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.deleted_at.is_(None),
        )
        .order_by(FamilyMember.is_default.desc(), FamilyMember.created_at.asc())
        .all()
    )
    return ok(
        [serialize_family_member(m, _report_count(db, m.id)) for m in members]
    )


@router.post("", status_code=status.HTTP_201_CREATED)
def add_member(
    payload: FamilyMemberCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    count = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.user_id == current_user.id,
            FamilyMember.deleted_at.is_(None),
        )
        .count()
    )
    if count >= MAX_MEMBERS:
        raise HTTPException(status_code=422, detail="Maximum 10 family members allowed")

    member = FamilyMember(
        user_id=current_user.id,
        full_name=payload.full_name,
        relation=payload.relation,
        age=payload.age,
        gender=payload.gender,
        blood_group=payload.blood_group,
        known_conditions=payload.known_conditions,
        is_default=False,
    )
    db.add(member)
    db.commit()
    db.refresh(member)
    return ok(serialize_family_member(member, 0), message="Family member added")


@router.patch("/{member_id}")
def update_member(
    member_id: str,
    payload: FamilyMemberUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _get_member(db, current_user, member_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(member, field, value)
    db.commit()
    db.refresh(member)
    return ok(
        serialize_family_member(member, _report_count(db, member.id)),
        message="Family member updated",
    )


@router.delete("/{member_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_member(
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _get_member(db, current_user, member_id)
    if member.relation == "self":
        raise HTTPException(
            status_code=422,
            detail="Cannot delete your own profile. Use account deletion instead.",
        )
    member.deleted_at = datetime.utcnow()
    db.commit()
    return None


@router.patch("/{member_id}/set-default")
def set_default(
    member_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = _get_member(db, current_user, member_id)
    db.query(FamilyMember).filter(
        FamilyMember.user_id == current_user.id
    ).update({FamilyMember.is_default: False})
    member.is_default = True
    db.commit()
    db.refresh(member)
    return ok(
        serialize_family_member(member, _report_count(db, member.id)),
        message="Default member set",
    )
