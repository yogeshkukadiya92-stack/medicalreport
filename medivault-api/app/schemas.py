"""Pydantic request/response schemas."""
from datetime import date
from typing import Any, Optional

from pydantic import BaseModel, Field


# ---------- Auth ----------
class OTPSendRequest(BaseModel):
    phone: str = Field(..., min_length=8, max_length=15)


class OTPVerifyRequest(BaseModel):
    phone: str
    otp: str


# ---------- Profile ----------
class ProfileCreate(BaseModel):
    full_name: str
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    known_conditions: list[str] = []
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


class ProfileUpdate(BaseModel):
    full_name: Optional[str] = None
    date_of_birth: Optional[date] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    known_conditions: Optional[list[str]] = None
    emergency_contact_name: Optional[str] = None
    emergency_contact_phone: Optional[str] = None


# ---------- Family Members ----------
class FamilyMemberCreate(BaseModel):
    full_name: str
    relation: str
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    known_conditions: list[str] = []


class FamilyMemberUpdate(BaseModel):
    full_name: Optional[str] = None
    relation: Optional[str] = None
    age: Optional[int] = None
    gender: Optional[str] = None
    blood_group: Optional[str] = None
    known_conditions: Optional[list[str]] = None


# ---------- Reports ----------
class ExtractedValueInput(BaseModel):
    parameter_name: str
    value: str
    unit: Optional[str] = None
    reference_range_low: Optional[float] = None
    reference_range_high: Optional[float] = None
    reference_range_text: Optional[str] = None
    status: Optional[str] = None
    confidence_score: Optional[float] = None


class ReportCreate(BaseModel):
    family_member_id: str
    report_type: Optional[str] = None
    report_title: Optional[str] = None
    report_date: Optional[date] = None
    lab_name: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    source: str = "document"
    tags: list[str] = []
    extracted_values: list[ExtractedValueInput] = []


class ReportUpdate(BaseModel):
    report_type: Optional[str] = None
    report_title: Optional[str] = None
    report_date: Optional[date] = None
    lab_name: Optional[str] = None
    doctor_name: Optional[str] = None
    notes: Optional[str] = None
    is_starred: Optional[bool] = None
    tags: Optional[list[str]] = None


# ---------- Consents ----------
class ConsentGrant(BaseModel):
    consent_type: str
    consent_version: str = "1.0"
    is_granted: bool = True


# ---------- Files ----------
class UploadURLRequest(BaseModel):
    filename: str
    mime_type: str
    file_size_bytes: int


class ConfirmUploadRequest(BaseModel):
    checksum_sha256: Optional[str] = None
