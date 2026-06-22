"""Medical reports endpoints — CRUD, list/filter, health summary, trends."""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import ExtractedValue, FamilyMember, MedicalReport, User
from ..responses import ok, paginated
from ..schemas import ReportCreate, ReportUpdate
from ..security import get_current_user
from ..serializers import serialize_extracted_value, serialize_report

router = APIRouter(prefix="/reports", tags=["reports"])


def _base_query(db: Session, user: User):
    return db.query(MedicalReport).filter(
        MedicalReport.user_id == user.id,
        MedicalReport.deleted_at.is_(None),
    )


def _get_report(db: Session, user: User, report_id: str) -> MedicalReport:
    report = _base_query(db, user).filter(MedicalReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


# ---- Health summary (must be before /{report_id}) ----
@router.get("/health-summary")
def health_summary(
    family_member_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = _base_query(db, current_user)
    member_name = "All Members"
    if family_member_id:
        q = q.filter(MedicalReport.family_member_id == family_member_id)
        member = db.query(FamilyMember).filter(FamilyMember.id == family_member_id).first()
        if member:
            member_name = member.full_name

    reports = q.order_by(MedicalReport.report_date.desc().nullslast()).all()
    total_reports = len(reports)

    report_ids = [r.id for r in reports]
    attention_values = []
    if report_ids:
        attention_values = (
            db.query(ExtractedValue)
            .filter(
                ExtractedValue.report_id.in_(report_ids),
                ExtractedValue.status.in_(["high", "low", "critical", "borderline"]),
            )
            .all()
        )

    latest_date = None
    for r in reports:
        if r.report_date:
            latest_date = r.report_date
            break

    return ok(
        {
            "family_member_name": member_name,
            "total_reports": total_reports,
            "values_needing_attention": len(attention_values),
            "latest_report_date": latest_date.isoformat() if latest_date else None,
            "attention_items": [serialize_extracted_value(v) for v in attention_values[:10]],
            "recent_reports": [serialize_report(r) for r in reports[:3]],
        }
    )


# ---- Parameter trends ----
@router.get("/trends/{parameter_name}")
def trends(
    parameter_name: str,
    family_member_id: str | None = Query(None),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = _base_query(db, current_user)
    if family_member_id:
        q = q.filter(MedicalReport.family_member_id == family_member_id)
    reports = q.all()
    report_ids = [r.id for r in reports]
    date_by_report = {r.id: r.report_date for r in reports}

    points = []
    if report_ids:
        values = (
            db.query(ExtractedValue)
            .filter(
                ExtractedValue.report_id.in_(report_ids),
                ExtractedValue.parameter_name == parameter_name,
            )
            .all()
        )
        for v in values:
            d = date_by_report.get(v.report_id)
            points.append(
                {
                    "date": d.isoformat() if d else None,
                    "value": v.value,
                    "status": v.status or "normal",
                }
            )
        points.sort(key=lambda p: p["date"] or "")
    return ok(points)


# ---- List ----
@router.get("")
def list_reports(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=50),
    family_member_id: str | None = Query(None),
    report_type: str | None = Query(None),
    processing_status: str | None = Query(None),
    is_starred: bool | None = Query(None),
    search: str | None = Query(None),
    sort_by: str = Query("created_at"),
    sort_order: str = Query("desc"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    q = _base_query(db, current_user)
    if family_member_id:
        q = q.filter(MedicalReport.family_member_id == family_member_id)
    if report_type:
        q = q.filter(MedicalReport.report_type == report_type)
    if processing_status:
        q = q.filter(MedicalReport.processing_status == processing_status)
    if is_starred is not None:
        q = q.filter(MedicalReport.is_starred.is_(is_starred))
    if search:
        like = f"%{search}%"
        q = q.filter(
            or_(
                MedicalReport.report_title.ilike(like),
                MedicalReport.lab_name.ilike(like),
                MedicalReport.doctor_name.ilike(like),
            )
        )

    sort_col = {
        "created_at": MedicalReport.created_at,
        "report_date": MedicalReport.report_date,
        "report_title": MedicalReport.report_title,
    }.get(sort_by, MedicalReport.created_at)
    q = q.order_by(sort_col.asc() if sort_order == "asc" else sort_col.desc())

    total = q.count()
    items = q.offset((page - 1) * per_page).limit(per_page).all()
    return paginated(
        [serialize_report(r) for r in items], page, per_page, total
    )


# ---- Detail ----
@router.get("/{report_id}")
def get_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_report(db, current_user, report_id)
    return ok(serialize_report(report, detail=True))


# ---- Create ----
@router.post("", status_code=status.HTTP_201_CREATED)
def create_report(
    payload: ReportCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    member = (
        db.query(FamilyMember)
        .filter(
            FamilyMember.id == payload.family_member_id,
            FamilyMember.user_id == current_user.id,
        )
        .first()
    )
    if not member:
        raise HTTPException(status_code=404, detail="Family member not found")

    report = MedicalReport(
        user_id=current_user.id,
        family_member_id=payload.family_member_id,
        report_type=payload.report_type,
        report_title=payload.report_title,
        report_date=payload.report_date,
        lab_name=payload.lab_name,
        doctor_name=payload.doctor_name,
        notes=payload.notes,
        source=payload.source,
        tags=payload.tags,
        processing_status="completed",
    )
    db.add(report)
    db.flush()

    for i, ev in enumerate(payload.extracted_values):
        db.add(
            ExtractedValue(
                report_id=report.id,
                parameter_name=ev.parameter_name,
                value=ev.value,
                unit=ev.unit,
                reference_range_low=ev.reference_range_low,
                reference_range_high=ev.reference_range_high,
                reference_range_text=ev.reference_range_text,
                status=ev.status,
                confidence_score=ev.confidence_score,
                display_order=i,
            )
        )
    db.commit()
    db.refresh(report)
    return ok(serialize_report(report, detail=True), message="Report created")


# ---- Update ----
@router.patch("/{report_id}")
def update_report(
    report_id: str,
    payload: ReportUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_report(db, current_user, report_id)
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(report, field, value)
    db.commit()
    db.refresh(report)
    return ok(serialize_report(report, detail=True), message="Report updated")


# ---- Confirm ----
@router.post("/{report_id}/confirm")
def confirm_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_report(db, current_user, report_id)
    report.processing_status = "completed"
    db.commit()
    return ok(message="Report confirmed")


# ---- Delete ----
@router.delete("/{report_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_report(
    report_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    report = _get_report(db, current_user, report_id)
    report.deleted_at = datetime.utcnow()
    db.commit()
    return None
