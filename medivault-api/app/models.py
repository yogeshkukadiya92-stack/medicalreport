"""SQLAlchemy ORM models.

Portable across SQLite (local dev) and PostgreSQL (production):
- UUIDs stored as String(36)
- list/array fields stored as JSON
"""
import uuid
from datetime import datetime

from sqlalchemy import (
    Boolean,
    Column,
    Date,
    DateTime,
    Float,
    ForeignKey,
    Integer,
    JSON,
    String,
    Text,
)
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid() -> str:
    return str(uuid.uuid4())


def utcnow() -> datetime:
    return datetime.utcnow()


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    phone = Column(String(255), unique=True, nullable=True, index=True)
    email = Column(String(255), unique=True, nullable=True)
    is_active = Column(Boolean, nullable=False, default=True)
    role = Column(String(20), nullable=False, default="user")
    last_login_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    profile = relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")
    family_members = relationship("FamilyMember", back_populates="user", cascade="all, delete-orphan")
    consents = relationship("ConsentLog", back_populates="user", cascade="all, delete-orphan")


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), unique=True, nullable=False)
    full_name = Column(String(150), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    gender = Column(String(10), nullable=True)
    blood_group = Column(String(5), nullable=True)
    known_conditions = Column(JSON, nullable=False, default=list)
    emergency_contact_name = Column(String(150), nullable=True)
    emergency_contact_phone = Column(String(15), nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)

    user = relationship("User", back_populates="profile")


class FamilyMember(Base):
    __tablename__ = "family_members"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    full_name = Column(String(150), nullable=False)
    relation = Column(String(30), nullable=False)
    date_of_birth = Column(Date, nullable=True)
    age = Column(Integer, nullable=True)
    gender = Column(String(10), nullable=True)
    blood_group = Column(String(5), nullable=True)
    known_conditions = Column(JSON, nullable=False, default=list)
    is_default = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    deleted_at = Column(DateTime, nullable=True)

    user = relationship("User", back_populates="family_members")
    reports = relationship("MedicalReport", back_populates="family_member")


class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    family_member_id = Column(String(36), ForeignKey("family_members.id"), nullable=False, index=True)
    report_type = Column(String(50), nullable=True)
    report_title = Column(String(255), nullable=True)
    report_date = Column(Date, nullable=True)
    lab_name = Column(String(200), nullable=True)
    doctor_name = Column(String(200), nullable=True)
    notes = Column(Text, nullable=True)
    source = Column(String(20), nullable=False, default="document")
    processing_status = Column(String(30), nullable=False, default="completed")
    ai_confidence_score = Column(Float, nullable=True)
    is_starred = Column(Boolean, nullable=False, default=False)
    tags = Column(JSON, nullable=False, default=list)
    created_at = Column(DateTime, nullable=False, default=utcnow)
    updated_at = Column(DateTime, nullable=False, default=utcnow, onupdate=utcnow)
    deleted_at = Column(DateTime, nullable=True)

    family_member = relationship("FamilyMember", back_populates="reports")
    extracted_values = relationship("ExtractedValue", back_populates="report", cascade="all, delete-orphan")
    files = relationship("UploadedFile", back_populates="report", cascade="all, delete-orphan")


class ExtractedValue(Base):
    __tablename__ = "extracted_values"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    report_id = Column(String(36), ForeignKey("medical_reports.id", ondelete="CASCADE"), nullable=False, index=True)
    parameter_name = Column(String(100), nullable=False)
    value = Column(String(50), nullable=False)
    unit = Column(String(30), nullable=True)
    reference_range_low = Column(Float, nullable=True)
    reference_range_high = Column(Float, nullable=True)
    reference_range_text = Column(String(100), nullable=True)
    status = Column(String(20), nullable=True)
    is_user_verified = Column(Boolean, nullable=False, default=False)
    is_user_edited = Column(Boolean, nullable=False, default=False)
    original_ai_value = Column(String(50), nullable=True)
    confidence_score = Column(Float, nullable=True)
    display_order = Column(Integer, nullable=False, default=0)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    report = relationship("MedicalReport", back_populates="extracted_values")


class UploadedFile(Base):
    __tablename__ = "uploaded_files"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    report_id = Column(String(36), ForeignKey("medical_reports.id"), nullable=True, index=True)
    original_filename = Column(String(255), nullable=False)
    mime_type = Column(String(50), nullable=False)
    file_size_bytes = Column(Integer, nullable=False, default=0)
    checksum_sha256 = Column(String(64), nullable=True)
    page_number = Column(Integer, nullable=False, default=1)
    upload_status = Column(String(20), nullable=False, default="pending")
    created_at = Column(DateTime, nullable=False, default=utcnow)

    report = relationship("MedicalReport", back_populates="files")


class ConsentLog(Base):
    __tablename__ = "consent_logs"

    id = Column(String(36), primary_key=True, default=gen_uuid)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    consent_type = Column(String(50), nullable=False)
    consent_version = Column(String(20), nullable=False)
    is_granted = Column(Boolean, nullable=False, default=True)
    granted_at = Column(DateTime, nullable=True)
    revoked_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, nullable=False, default=utcnow)

    user = relationship("User", back_populates="consents")
