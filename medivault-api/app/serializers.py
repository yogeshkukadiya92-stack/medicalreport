"""Convert ORM models into the JSON shapes the frontend expects.

Field names mirror medivault-web/src/lib/types.ts exactly.
"""
from datetime import date, datetime
from typing import Any, Optional

from .models import (
    ExtractedValue,
    FamilyMember,
    MedicalReport,
    UploadedFile,
    User,
    UserProfile,
)


def _iso(value: Optional[datetime | date]) -> Optional[str]:
    if value is None:
        return None
    if isinstance(value, datetime):
        return value.isoformat() + "Z"
    return value.isoformat()


def _age_from_dob(dob: Optional[date]) -> Optional[int]:
    if not dob:
        return None
    today = date.today()
    return today.year - dob.year - ((today.month, today.day) < (dob.month, dob.day))


def serialize_user(user: User, profile: Optional[UserProfile] = None) -> dict[str, Any]:
    full_name = profile.full_name if profile else (user.profile.full_name if user.profile else "")
    return {
        "id": user.id,
        "phone": user.phone,
        "full_name": full_name,
        "created_at": _iso(user.created_at),
    }


def serialize_profile(profile: UserProfile) -> dict[str, Any]:
    return {
        "id": profile.id,
        "full_name": profile.full_name,
        "date_of_birth": _iso(profile.date_of_birth),
        "gender": profile.gender,
        "blood_group": profile.blood_group,
        "known_conditions": profile.known_conditions or [],
        "emergency_contact_name": profile.emergency_contact_name,
        "emergency_contact_phone": profile.emergency_contact_phone,
    }


def serialize_family_member(member: FamilyMember, report_count: int = 0) -> dict[str, Any]:
    age = member.age if member.age is not None else _age_from_dob(member.date_of_birth)
    return {
        "id": member.id,
        "full_name": member.full_name,
        "relation": member.relation,
        "age": age,
        "gender": member.gender,
        "blood_group": member.blood_group,
        "known_conditions": member.known_conditions or [],
        "is_default": member.is_default,
        "report_count": report_count,
        "created_at": _iso(member.created_at),
    }


def serialize_extracted_value(ev: ExtractedValue) -> dict[str, Any]:
    return {
        "id": ev.id,
        "parameter_name": ev.parameter_name,
        "value": ev.value,
        "unit": ev.unit,
        "reference_range_low": ev.reference_range_low,
        "reference_range_high": ev.reference_range_high,
        "reference_range_text": ev.reference_range_text,
        "status": ev.status or "normal",
        "is_user_verified": ev.is_user_verified,
        "is_user_edited": ev.is_user_edited,
        "original_ai_value": ev.original_ai_value,
        "confidence_score": ev.confidence_score,
    }


def serialize_file(f: UploadedFile) -> dict[str, Any]:
    return {
        "id": f.id,
        "original_filename": f.original_filename,
        "mime_type": f.mime_type,
        "file_size_bytes": f.file_size_bytes,
        "page_number": f.page_number,
        "upload_status": f.upload_status,
    }


def serialize_report(report: MedicalReport, detail: bool = False) -> dict[str, Any]:
    data: dict[str, Any] = {
        "id": report.id,
        "family_member_id": report.family_member_id,
        "family_member_name": report.family_member.full_name if report.family_member else "",
        "report_type": report.report_type,
        "report_title": report.report_title,
        "report_date": _iso(report.report_date),
        "lab_name": report.lab_name,
        "doctor_name": report.doctor_name,
        "notes": report.notes,
        "source": report.source,
        "processing_status": report.processing_status,
        "ai_confidence_score": report.ai_confidence_score,
        "is_starred": report.is_starred,
        "tags": report.tags or [],
        "created_at": _iso(report.created_at),
    }
    if detail:
        data["extracted_values"] = [
            serialize_extracted_value(ev)
            for ev in sorted(report.extracted_values, key=lambda e: e.display_order)
        ]
        data["files"] = [serialize_file(f) for f in report.files]
    return data
