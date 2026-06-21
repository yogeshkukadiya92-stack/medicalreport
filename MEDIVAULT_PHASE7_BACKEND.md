# MediVault Phase 7 — Real Backend Implementation

**Status:** Implementation Ready
**Duration:** 8-10 weeks
**Team Size:** 3-4 backend developers + DevOps

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Project Structure](#2-project-structure)
3. [Database Setup](#3-database-setup)
4. [Authentication](#4-authentication)
5. [Core Services](#5-core-services)
6. [API Endpoints](#6-api-endpoints)
7. [Background Jobs](#7-background-jobs)
8. [File Storage](#8-file-storage)
9. [Error Handling](#9-error-handling)
10. [Testing](#10-testing)
11. [Sprint Breakdown](#11-sprint-breakdown)
12. [Deployment](#12-deployment)

---

## 1. Tech Stack

```
Framework: FastAPI 0.104+
Language: Python 3.10+
Database: PostgreSQL 14+
ORM: SQLAlchemy 2.0+
Async: asyncio + aiofiles
Task Queue: Celery 5.3+
Message Broker: Redis 7+
File Storage: AWS S3 or Google Cloud Storage
Authentication: JWT + Refresh Tokens
API Documentation: OpenAPI/Swagger
Testing: pytest + pytest-asyncio
Deployment: Docker + Kubernetes
Monitoring: Prometheus + Grafana
Logging: ELK Stack or Datadog
```

---

## 2. Project Structure

```
medivault-backend/
│
├── app/
│   ├── __init__.py
│   ├── main.py                     # FastAPI app entry
│   ├── core/
│   │   ├── config.py              # Settings & environment
│   │   ├── security.py            # JWT, encryption
│   │   ├── constants.py           # App constants
│   │   ├── exceptions.py          # Custom exceptions
│   │   └── logger.py              # Logging setup
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── user.py                # User model
│   │   ├── family_member.py
│   │   ├── medical_report.py
│   │   ├── extracted_value.py
│   │   ├── audit_log.py
│   │   └── analytics.py
│   │
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user_schema.py         # Pydantic schemas
│   │   ├── report_schema.py
│   │   ├── response_schema.py
│   │   └── auth_schema.py
│   │
│   ├── database/
│   │   ├── __init__.py
│   │   ├── base.py               # Base model
│   │   ├── session.py            # DB session
│   │   ├── migrations/           # Alembic migrations
│   │   │   ├── env.py
│   │   │   ├── script.py.mako
│   │   │   └── versions/
│   │   │       ├── 0001_initial.py
│   │   │       ├── 0002_add_analytics.py
│   │   │       └── ...
│   │   └── seeds.py              # Initial data
│   │
│   ├── api/
│   │   ├── __init__.py
│   │   ├── v1/
│   │   │   ├── __init__.py
│   │   │   ├── dependencies.py   # Shared dependencies
│   │   │   ├── auth.py           # Auth routes
│   │   │   ├── users.py          # User routes
│   │   │   ├── reports.py        # Report routes
│   │   │   ├── family.py         # Family routes
│   │   │   ├── files.py          # File routes
│   │   │   ├── analytics.py      # Analytics routes
│   │   │   ├── extraction.py     # Extraction routes
│   │   │   └── health.py         # Health check
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── auth_service.py       # Auth logic
│   │   ├── user_service.py
│   │   ├── report_service.py
│   │   ├── extraction_service.py
│   │   ├── analytics_service.py
│   │   ├── file_service.py
│   │   ├── notification_service.py
│   │   └── email_service.py
│   │
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base_repository.py
│   │   ├── user_repository.py
│   │   ├── report_repository.py
│   │   └── analytics_repository.py
│   │
│   ├── workers/
│   │   ├── __init__.py
│   │   ├── celery_app.py        # Celery config
│   │   └── tasks/
│   │       ├── extraction.py     # OCR/AI tasks
│   │       ├── email.py          # Email tasks
│   │       ├── notifications.py  # Notification tasks
│   │       └── cleanup.py        # Maintenance tasks
│   │
│   ├── utils/
│   │   ├── __init__.py
│   │   ├── validators.py
│   │   ├── formatters.py
│   │   ├── enums.py
│   │   └── helpers.py
│   │
│   └── middleware/
│       ├── __init__.py
│       ├── error_handler.py
│       ├── cors.py
│       └── rate_limit.py
│
├── tests/
│   ├── __init__.py
│   ├── conftest.py               # Pytest config
│   ├── unit/
│   │   ├── test_auth.py
│   │   ├── test_services.py
│   │   └── test_utils.py
│   ├── integration/
│   │   ├── test_auth_flow.py
│   │   ├── test_report_flow.py
│   │   └── test_extraction.py
│   └── fixtures/
│       └── data.py
│
├── docker/
│   ├── Dockerfile
│   ├── Dockerfile.worker         # Celery worker
│   └── docker-compose.yml
│
├── kubernetes/
│   ├── deployment.yaml
│   ├── service.yaml
│   ├── ingress.yaml
│   ├── configmap.yaml
│   └── secrets.yaml
│
├── scripts/
│   ├── init_db.sh               # Database setup
│   ├── run_migrations.sh
│   ├── seed_data.sh
│   └── deploy.sh
│
├── requirements.txt             # Dependencies
├── alembic.ini                  # Alembic config
├── .env.example                 # Environment template
├── pytest.ini                   # Pytest config
├── README.md
└── setup.py
```

---

## 3. Database Setup

### PostgreSQL Installation

```bash
# Using Docker
docker run --name postgres \
  -e POSTGRES_PASSWORD=medivault123 \
  -e POSTGRES_DB=medivault \
  -p 5432:5432 \
  -d postgres:15

# Connection string
DATABASE_URL=postgresql://postgres:medivault123@localhost:5432/medivault
```

### Alembic Setup

```bash
# Initialize Alembic
alembic init alembic

# Create migration
alembic revision --autogenerate -m "Add users table"

# Run migrations
alembic upgrade head
```

### Database Models

```python
# app/models/user.py

from sqlalchemy import Column, String, DateTime, Boolean
from sqlalchemy.dialects.postgresql import UUID
from datetime import datetime
import uuid

from app.database.base import Base

class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    phone = Column(String(20), unique=True, index=True, nullable=False)
    email = Column(String(255), unique=True, nullable=True, index=True)
    name = Column(String(255), nullable=True)
    
    # Security
    password_hash = Column(String(255), nullable=True)  # For password login
    is_email_verified = Column(Boolean, default=False)
    is_phone_verified = Column(Boolean, default=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    is_admin = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Relationships
    family_members = relationship("FamilyMember", back_populates="user", cascade="all, delete-orphan")
    medical_reports = relationship("MedicalReport", back_populates="user", cascade="all, delete-orphan")
    audit_logs = relationship("AuditLog", back_populates="user")

# app/models/medical_report.py

class MedicalReport(Base):
    __tablename__ = "medical_reports"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False, index=True)
    family_member_id = Column(UUID(as_uuid=True), ForeignKey("family_members.id"), nullable=False)
    
    # Report details
    report_type = Column(String(50), nullable=False)  # blood_test, thyroid, etc
    report_date = Column(DateTime, nullable=False)
    lab_name = Column(String(255), nullable=True)
    doctor_name = Column(String(255), nullable=True)
    
    # File
    file_id = Column(String(255), nullable=False)
    file_url = Column(String(500), nullable=False)
    
    # Status
    confirmation_status = Column(String(50), default="pending")  # pending, confirmed
    extraction_draft_id = Column(UUID(as_uuid=True), nullable=True)
    
    # Quality metrics
    extraction_confidence = Column(Float, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    confirmed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="medical_reports")
    extracted_values = relationship("ExtractedValue", back_populates="report", cascade="all, delete-orphan")

# app/models/extracted_value.py

class ExtractedValue(Base):
    __tablename__ = "extracted_values"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    report_id = Column(UUID(as_uuid=True), ForeignKey("medical_reports.id"), nullable=False, index=True)
    
    # Parameter details
    parameter_name = Column(String(200), nullable=False, index=True)
    standardized_name = Column(String(200), nullable=True)
    
    # Value details
    value = Column(String(100), nullable=True)
    unit = Column(String(50), nullable=True)
    
    # Reference range
    reference_range_low = Column(Float, nullable=True)
    reference_range_high = Column(Float, nullable=True)
    
    # Status
    status = Column(String(50), nullable=True)  # normal, high, low
    confidence = Column(Float, nullable=False)
    
    # Metadata
    is_user_edited = Column(Boolean, default=False)
    user_corrected_value = Column(String(100), nullable=True)
    
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    report = relationship("MedicalReport", back_populates="extracted_values")
```

---

## 4. Authentication

### JWT Implementation

```python
# app/core/security.py

from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from passlib.context import CryptContext

class JWTHandler:
    def __init__(self):
        self.secret_key = settings.SECRET_KEY
        self.algorithm = "HS256"
        self.access_token_expire_minutes = 30
        self.refresh_token_expire_days = 7

    def create_tokens(self, user_id: str) -> dict:
        access_token = self._create_access_token(user_id)
        refresh_token = self._create_refresh_token(user_id)
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

    def _create_access_token(self, user_id: str) -> str:
        expire = datetime.utcnow() + timedelta(minutes=self.access_token_expire_minutes)
        to_encode = {"sub": user_id, "exp": expire}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def _create_refresh_token(self, user_id: str) -> str:
        expire = datetime.utcnow() + timedelta(days=self.refresh_token_expire_days)
        to_encode = {"sub": user_id, "exp": expire, "type": "refresh"}
        encoded_jwt = jwt.encode(to_encode, self.secret_key, algorithm=self.algorithm)
        return encoded_jwt

    def verify_token(self, token: str) -> Optional[str]:
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            user_id = payload.get("sub")
            if user_id is None:
                return None
            return user_id
        except JWTError:
            return None
```

### Auth Endpoints

```python
# app/api/v1/auth.py

from fastapi import APIRouter, Depends, HTTPException, status
from app.core.security import JWTHandler
from app.services.auth_service import AuthService
from app.schemas.auth_schema import OTPRequest, OTPVerifyRequest, LoginResponse

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/otp/send", status_code=200)
async def send_otp(request: OTPRequest, auth_service: AuthService = Depends()):
    """Send OTP to phone number"""
    try:
        await auth_service.send_otp(request.phone)
        return {"message": "OTP sent successfully"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/otp/verify", response_model=LoginResponse)
async def verify_otp(
    request: OTPVerifyRequest,
    auth_service: AuthService = Depends()
):
    """Verify OTP and get JWT tokens"""
    user = await auth_service.verify_otp(request.phone, request.otp)
    if not user:
        raise HTTPException(status_code=401, detail="Invalid OTP")
    
    jwt_handler = JWTHandler()
    tokens = jwt_handler.create_tokens(str(user.id))
    
    return LoginResponse(
        access_token=tokens["access_token"],
        refresh_token=tokens["refresh_token"],
        user=user
    )

@router.post("/refresh")
async def refresh_token(
    token: str,
    auth_service: AuthService = Depends()
):
    """Refresh access token"""
    jwt_handler = JWTHandler()
    user_id = jwt_handler.verify_token(token)
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid refresh token")
    
    tokens = jwt_handler.create_tokens(user_id)
    return tokens

@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user (client-side: clear tokens)"""
    return {"message": "Logged out successfully"}
```

---

## 5. Core Services

### Auth Service

```python
# app/services/auth_service.py

from app.repositories.user_repository import UserRepository
from app.utils.validators import validate_phone, validate_otp
from app.core.logger import logger

class AuthService:
    def __init__(self, db_session):
        self.user_repo = UserRepository(db_session)
        self.otp_service = OTPService()  # Twilio or similar

    async def send_otp(self, phone: str) -> bool:
        """Send OTP to phone number"""
        if not validate_phone(phone):
            raise ValueError("Invalid phone number")
        
        otp = self.otp_service.generate_otp()
        
        try:
            await self.otp_service.send_sms(phone, otp)
            # Cache OTP for 5 minutes
            await self.cache_otp(phone, otp)
            return True
        except Exception as e:
            logger.error(f"Failed to send OTP: {e}")
            raise

    async def verify_otp(self, phone: str, otp: str) -> Optional[User]:
        """Verify OTP and return/create user"""
        if not validate_otp(otp):
            raise ValueError("Invalid OTP format")
        
        # Verify OTP
        cached_otp = await self.get_cached_otp(phone)
        if cached_otp != otp:
            raise ValueError("Invalid OTP")
        
        # Get or create user
        user = await self.user_repo.get_by_phone(phone)
        if not user:
            user = await self.user_repo.create({
                "phone": phone,
                "is_phone_verified": True
            })
        
        # Clear cache
        await self.clear_cached_otp(phone)
        return user

    async def cache_otp(self, phone: str, otp: str):
        """Cache OTP in Redis for 5 minutes"""
        await redis.setex(f"otp:{phone}", 300, otp)

    async def get_cached_otp(self, phone: str) -> Optional[str]:
        """Get cached OTP"""
        return await redis.get(f"otp:{phone}")
```

### Report Service

```python
# app/services/report_service.py

class ReportService:
    def __init__(self, db_session):
        self.report_repo = ReportRepository(db_session)
        self.file_service = FileService()
        self.extraction_service = ExtractionService()

    async def upload_report(self, user_id: str, file: UploadFile, family_member_id: str):
        """Upload medical report and start extraction"""
        
        # Validate file
        if file.content_type not in ["application/pdf", "image/jpeg", "image/png"]:
            raise ValueError("Invalid file type")
        
        # Store file
        file_id = await self.file_service.upload_to_s3(file, user_id)
        
        # Create report record
        report = await self.report_repo.create({
            "user_id": user_id,
            "family_member_id": family_member_id,
            "file_id": file_id,
            "file_url": await self.file_service.get_signed_url(file_id),
            "status": "uploaded"
        })
        
        # Queue extraction job
        await self.extraction_service.queue_extraction(report.id, file_id)
        
        return report

    async def get_reports(self, user_id: str, limit: int = 50, offset: int = 0):
        """Get user's medical reports with pagination"""
        return await self.report_repo.get_by_user(
            user_id=user_id,
            skip=offset,
            limit=limit,
            filters={"confirmation_status": "confirmed"}
        )

    async def get_report_detail(self, user_id: str, report_id: str):
        """Get full report with extracted values"""
        report = await self.report_repo.get_by_id(report_id)
        if not report or report.user_id != user_id:
            raise ValueError("Report not found")
        
        extracted_values = await self.report_repo.get_extracted_values(report_id)
        
        return {
            "report": report,
            "extracted_values": extracted_values
        }

    async def confirm_report(self, user_id: str, report_id: str, corrections: dict = None):
        """User confirms report (with optional corrections)"""
        report = await self.report_repo.get_by_id(report_id)
        if not report or report.user_id != user_id:
            raise ValueError("Report not found")
        
        # Apply corrections if any
        if corrections:
            await self._apply_corrections(report_id, corrections)
        
        # Update status
        await self.report_repo.update(report_id, {
            "confirmation_status": "confirmed",
            "confirmed_at": datetime.utcnow()
        })
        
        # Log audit
        await audit_service.log_action(
            user_id=user_id,
            action="report_confirmed",
            resource_type="medical_report",
            resource_id=report_id
        )
```

---

## 6. API Endpoints

### FastAPI App Setup

```python
# app/main.py

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.v1 import auth, users, reports, analytics, extraction
from app.core.config import settings

app = FastAPI(
    title="MediVault API",
    description="Medical Report Storage & Analytics API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(users.router, prefix="/users")
app.include_router(reports.router, prefix="/reports")
app.include_router(analytics.router, prefix="/analytics")
app.include_router(extraction.router, prefix="/extraction")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Complete Endpoint List

```
# Auth
POST   /auth/otp/send           - Send OTP
POST   /auth/otp/verify         - Verify OTP
POST   /auth/refresh            - Refresh token
POST   /auth/logout             - Logout

# Users
GET    /users/profile           - Get user profile
PUT    /users/profile           - Update profile
GET    /users/me                - Get current user

# Reports
GET    /reports                 - List reports (paginated)
POST   /reports/upload          - Upload report
GET    /reports/{id}            - Get report detail
PUT    /reports/{id}            - Update report
DELETE /reports/{id}            - Delete report
POST   /reports/{id}/confirm    - Confirm report

# Family Members
GET    /family                  - List family members
POST   /family                  - Add family member
PUT    /family/{id}             - Update family member
DELETE /family/{id}             - Delete family member

# Analytics
GET    /analytics/dashboard     - Dashboard summary
GET    /analytics/timeline      - Medical timeline
GET    /analytics/parameters    - Parameter stats
GET    /analytics/parameter/{name}/trend  - Parameter trends
GET    /analytics/compare-reports         - Compare reports
GET    /analytics/attention-values        - Values needing attention
GET    /analytics/family-summary          - Family health overview
GET    /analytics/health-tracking-score   - Health tracking score

# Extraction
POST   /extraction/start        - Start extraction
GET    /extraction/{id}/status  - Check status
GET    /extraction/{id}/draft   - Get draft data
POST   /extraction/{id}/correct - Submit corrections
POST   /extraction/{id}/confirm - Confirm final data
POST   /extraction/{id}/retry   - Retry failed

# Files
POST   /files/upload            - Get upload URL
GET    /files/{id}              - Download file
```

---

## 7. Background Jobs

### Celery Tasks

```python
# app/workers/tasks/extraction.py

from celery import shared_task
from app.services.extraction_service import ExtractionService
from app.core.logger import logger

@shared_task(bind=True, max_retries=3)
def extract_report_worker(self, report_id: str, file_id: str):
    """Main extraction task with retries"""
    try:
        service = ExtractionService()
        result = service.extract_medical_data(report_id, file_id)
        return {
            "status": "completed",
            "report_id": report_id,
            "confidence": result.confidence
        }
    except Exception as exc:
        logger.error(f"Extraction failed: {exc}")
        # Retry with exponential backoff
        raise self.retry(exc=exc, countdown=60 * (2 ** self.request.retries))

@shared_task
def send_notification_email(user_id: str, report_id: str):
    """Send notification email"""
    email_service = EmailService()
    email_service.send_extraction_complete(user_id, report_id)

@shared_task
def cleanup_old_caches():
    """Cleanup expired cache entries"""
    # Run daily
    cache_service = CacheService()
    cache_service.cleanup_expired()
```

### Celery Configuration

```python
# app/workers/celery_app.py

from celery import Celery
from app.core.config import settings

app = Celery(
    'medivault',
    broker=settings.CELERY_BROKER_URL,
    backend=settings.CELERY_RESULT_BACKEND_URL
)

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
    timezone='UTC',
    enable_utc=True,
    task_track_started=True,
    task_time_limit=30 * 60,  # 30 minutes hard limit
    task_soft_time_limit=25 * 60,  # 25 minutes soft limit
)

app.conf.beat_schedule = {
    'cleanup-cache-every-day': {
        'task': 'app.workers.tasks.cleanup_old_caches',
        'schedule': crontab(hour=2, minute=0),  # 2 AM daily
    },
    'sync-analytics-every-hour': {
        'task': 'app.workers.tasks.sync_analytics',
        'schedule': crontab(minute=0),  # Every hour
    },
}
```

---

## 8. File Storage

### AWS S3 Integration

```python
# app/services/file_service.py

import boto3
from botocore.exceptions import ClientError

class FileService:
    def __init__(self):
        self.s3_client = boto3.client('s3')
        self.bucket = settings.S3_BUCKET

    async def upload_to_s3(self, file: UploadFile, user_id: str) -> str:
        """Upload file to S3 and return file_id"""
        import uuid
        
        file_id = str(uuid.uuid4())
        key = f"reports/{user_id}/{file_id}"
        
        try:
            self.s3_client.upload_fileobj(
                file.file,
                self.bucket,
                key,
                ExtraArgs={
                    "ServerSideEncryption": "AES256",
                    "ContentType": file.content_type
                }
            )
            return file_id
        except ClientError as e:
            logger.error(f"S3 upload failed: {e}")
            raise

    async def get_signed_url(self, file_id: str, user_id: str, expires_in: int = 3600) -> str:
        """Generate signed URL for file download (1 hour default)"""
        key = f"reports/{user_id}/{file_id}"
        
        try:
            url = self.s3_client.generate_presigned_url(
                'get_object',
                Params={'Bucket': self.bucket, 'Key': key},
                ExpiresIn=expires_in
            )
            return url
        except ClientError as e:
            logger.error(f"Failed to generate signed URL: {e}")
            raise

    async def delete_file(self, file_id: str, user_id: str) -> bool:
        """Delete file from S3"""
        key = f"reports/{user_id}/{file_id}"
        
        try:
            self.s3_client.delete_object(Bucket=self.bucket, Key=key)
            return True
        except ClientError as e:
            logger.error(f"Failed to delete file: {e}")
            raise
```

---

## 9. Error Handling

### Global Exception Handler

```python
# app/middleware/error_handler.py

from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={"detail": exc.errors()},
    )

@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception: {exc}")
    return JSONResponse(
        status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
        content={"detail": "Internal server error"},
    )

class CustomException(Exception):
    def __init__(self, message: str, status_code: int = 400):
        self.message = message
        self.status_code = status_code

@app.exception_handler(CustomException)
async def custom_exception_handler(request: Request, exc: CustomException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"detail": exc.message},
    )
```

---

## 10. Testing

### Pytest Configuration

```python
# tests/conftest.py

import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from app.main import app
from app.database.base import Base

SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

@pytest.fixture(scope="session")
def db():
    engine = create_engine(
        SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False}
    )
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    yield db
    db.close()

@pytest.fixture
def client(db):
    def override_get_db():
        yield db
    
    app.dependency_overrides[get_db] = override_get_db
    return TestClient(app)

# tests/unit/test_auth.py

def test_send_otp_valid_phone(client):
    response = client.post("/auth/otp/send", json={"phone": "+919876543210"})
    assert response.status_code == 200

def test_verify_otp_invalid(client):
    response = client.post("/auth/otp/verify", json={"phone": "+919876543210", "otp": "000000"})
    assert response.status_code == 401

# tests/integration/test_auth_flow.py

def test_complete_auth_flow(client):
    # Send OTP
    response = client.post("/auth/otp/send", json={"phone": "+919876543210"})
    assert response.status_code == 200
    
    # Verify OTP
    response = client.post("/auth/otp/verify", json={"phone": "+919876543210", "otp": "123456"})
    assert response.status_code == 200
    assert "access_token" in response.json()
```

---

## 11. Sprint Breakdown

### Sprint 1: Project Setup & Database (1.5 weeks)
- [ ] FastAPI project setup
- [ ] PostgreSQL setup & connection
- [ ] SQLAlchemy models (all tables)
- [ ] Alembic migrations
- [ ] Environment configuration
- [ ] Logging setup

### Sprint 2: Authentication (1.5 weeks)
- [ ] JWT implementation
- [ ] OTP service (Twilio)
- [ ] Auth endpoints (send/verify)
- [ ] Token refresh
- [ ] Auth middleware
- [ ] Tests for auth

### Sprint 3: User & Profile Management (1 week)
- [ ] User endpoints
- [ ] Profile CRUD
- [ ] Family member endpoints
- [ ] User repository
- [ ] Tests

### Sprint 4: File Upload & Storage (1 week)
- [ ] S3 integration
- [ ] File upload endpoint
- [ ] Signed URL generation
- [ ] File service
- [ ] Tests

### Sprint 5: Reports API (1.5 weeks)
- [ ] Report CRUD endpoints
- [ ] Report repository
- [ ] List with pagination & filters
- [ ] Report detail with extracted values
- [ ] Confirm endpoint
- [ ] Tests

### Sprint 6: Celery & Background Jobs (1 week)
- [ ] Celery setup
- [ ] Redis setup
- [ ] Extraction tasks
- [ ] Email tasks
- [ ] Task monitoring
- [ ] Tests

### Sprint 7: Analytics Endpoints (1.5 weeks)
- [ ] Analytics queries
- [ ] Dashboard endpoint
- [ ] Timeline endpoint
- [ ] Parameter trend endpoint
- [ ] Health score endpoint
- [ ] Tests

### Sprint 8: Error Handling & Middleware (1 week)
- [ ] Global exception handler
- [ ] CORS setup
- [ ] Rate limiting
- [ ] Request logging
- [ ] Error logging
- [ ] Tests

### Sprint 9: API Documentation & Testing (1 week)
- [ ] Swagger/OpenAPI docs
- [ ] Postman collection
- [ ] Integration tests (end-to-end)
- [ ] Load testing
- [ ] Documentation

### Sprint 10: Deployment Preparation (1 week)
- [ ] Docker setup
- [ ] Docker Compose
- [ ] Environment management
- [ ] Deployment scripts
- [ ] Monitoring setup
- [ ] Security checklist

---

## 12. Deployment

### Docker Setup

```dockerfile
# Dockerfile

FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Docker Compose

```yaml
# docker-compose.yml

version: '3.8'

services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_DB: medivault
      POSTGRES_PASSWORD: medivault123
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7
    ports:
      - "6379:6379"

  api:
    build: .
    ports:
      - "8000:8000"
    environment:
      DATABASE_URL: postgresql://postgres:medivault123@postgres:5432/medivault
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

  worker:
    build: .
    command: celery -A app.workers.celery_app worker --loglevel=info
    environment:
      DATABASE_URL: postgresql://postgres:medivault123@postgres:5432/medivault
      REDIS_URL: redis://redis:6379
    depends_on:
      - postgres
      - redis

volumes:
  postgres_data:
```

### requirements.txt

```
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
alembic==1.12.1
psycopg2-binary==2.9.9
python-jose==3.3.0
passlib==1.7.4
python-multipart==0.0.6
pydantic==2.5.0
pydantic-settings==2.1.0
celery==5.3.4
redis==5.0.1
boto3==1.29.7
aiofiles==23.2.1
httpx==0.25.1
pytest==7.4.3
pytest-asyncio==0.21.1
```

---

**Status:** Ready for Implementation
**Estimated Duration:** 8-10 weeks
**Team Size:** 3-4 backend developers
**Next Phase:** Phase 8 - AI/OCR Integration
