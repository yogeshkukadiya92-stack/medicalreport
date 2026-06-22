"""User profile endpoints."""
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import FamilyMember, User, UserProfile
from ..responses import ok
from ..schemas import ProfileCreate, ProfileUpdate
from ..security import get_current_user
from ..serializers import serialize_profile

router = APIRouter(prefix="/profile", tags=["profile"])


@router.get("")
def get_profile(current_user: User = Depends(get_current_user)):
    if not current_user.profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    return ok(serialize_profile(current_user.profile))


@router.post("", status_code=status.HTTP_201_CREATED)
def create_profile(
    payload: ProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if current_user.profile:
        raise HTTPException(status_code=409, detail="Profile already exists")

    profile = UserProfile(
        user_id=current_user.id,
        full_name=payload.full_name,
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        blood_group=payload.blood_group,
        known_conditions=payload.known_conditions,
        emergency_contact_name=payload.emergency_contact_name,
        emergency_contact_phone=payload.emergency_contact_phone,
    )
    db.add(profile)

    # Side effect: auto-create the "self" family member.
    self_member = FamilyMember(
        user_id=current_user.id,
        full_name=payload.full_name,
        relation="self",
        date_of_birth=payload.date_of_birth,
        gender=payload.gender,
        blood_group=payload.blood_group,
        known_conditions=payload.known_conditions,
        is_default=True,
    )
    db.add(self_member)
    db.commit()
    db.refresh(profile)
    return ok(serialize_profile(profile), message="Profile created successfully")


@router.patch("")
def update_profile(
    payload: ProfileUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    profile = current_user.profile
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(profile, field, value)
    db.commit()
    db.refresh(profile)
    return ok(serialize_profile(profile), message="Profile updated successfully")
