"""File metadata endpoints.

NOTE: This MVP stores file *metadata* only (no S3/GCS yet). The two-step
presigned-URL flow is stubbed so the frontend contract works end-to-end.
Wire real object storage (S3/GCS) here when ready.
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import UploadedFile, User
from ..responses import ok
from ..schemas import ConfirmUploadRequest, UploadURLRequest
from ..security import get_current_user

router = APIRouter(prefix="/files", tags=["files"])

ALLOWED_MIME = {"application/pdf", "image/jpeg", "image/png", "image/webp"}
MAX_SIZE = 20 * 1024 * 1024  # 20 MB


@router.post("/upload-url")
def get_upload_url(
    payload: UploadURLRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    if payload.mime_type not in ALLOWED_MIME:
        raise HTTPException(status_code=415, detail="File type not allowed")
    if payload.file_size_bytes <= 0 or payload.file_size_bytes > MAX_SIZE:
        raise HTTPException(status_code=413, detail="File size exceeds 20 MB limit")

    file = UploadedFile(
        user_id=current_user.id,
        original_filename=payload.filename,
        mime_type=payload.mime_type,
        file_size_bytes=payload.file_size_bytes,
        upload_status="pending",
    )
    db.add(file)
    db.commit()
    db.refresh(file)

    return ok(
        {
            "file_id": file.id,
            # Placeholder. Replace with a real S3/GCS presigned PUT URL.
            "upload_url": f"/v1/files/{file.id}/direct-upload",
            "upload_method": "PUT",
            "expires_in_seconds": 600,
        }
    )


@router.post("/{file_id}/confirm")
def confirm_upload(
    file_id: str,
    payload: ConfirmUploadRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file = (
        db.query(UploadedFile)
        .filter(UploadedFile.id == file_id, UploadedFile.user_id == current_user.id)
        .first()
    )
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    file.upload_status = "completed"
    file.checksum_sha256 = payload.checksum_sha256
    db.commit()
    return ok(
        {
            "file_id": file.id,
            "upload_status": file.upload_status,
            "file_size_bytes": file.file_size_bytes,
            "mime_type": file.mime_type,
        },
        message="File upload confirmed",
    )


@router.get("/{file_id}/url")
def get_file_url(
    file_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    file = (
        db.query(UploadedFile)
        .filter(UploadedFile.id == file_id, UploadedFile.user_id == current_user.id)
        .first()
    )
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    return ok(
        {
            # Placeholder signed URL. Replace with real storage signed URL.
            "download_url": f"/v1/files/{file.id}/download",
            "expires_in_seconds": 900,
        }
    )
