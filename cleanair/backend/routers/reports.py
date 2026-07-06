"""
backend/routers/reports.py
Reports router - CRUD + heatmap + upvote + fake-report detection
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from typing import Optional
from pydantic import BaseModel
from models.schemas import ReportCreate, ReportUpdate, ResolveRequest
from services import database, ai_service
from deps import current_user, require_role


class AcknowledgeRequest(BaseModel):
    assigned_to: Optional[str] = None

router = APIRouter(prefix="/reports", tags=["reports"])
municipal_only = require_role("authority", "admin")


@router.get("")
async def list_reports(
    status: Optional[str] = Query(None),
    pollution_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    time_filter: Optional[str] = Query("today"),
    limit: int = Query(100, le=500),
    _user: dict = Depends(current_user),
):
    return await database.get_reports(
        status=status,
        pollution_type=pollution_type,
        severity=severity,
        time_filter=time_filter,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_report(data: ReportCreate, _user: dict = Depends(current_user)):
    report_dict = data.model_dump()

    # -- Fake-report gate: block before touching Firestore ---------------------
    validation = report_dict.get("validation") or {}
    if validation.get("should_block"):
        raise HTTPException(
            status_code=422,
            detail={
                "blocked":          True,
                "reason":           validation.get("reason", "Image not valid."),
                "detected_content": validation.get("detected_content", ""),
                "confidence":       validation.get("confidence", 0),
            },
        )
    # -------------------------------------------------------------------------

    report = await database.create_report(report_dict)
    await database.notify_authorities(report)
    return report


@router.get("/flagged")
async def get_flagged_reports(limit: int = Query(50, le=200), _user: dict = Depends(municipal_only)):
    """
    Reports where validation.review_flag == True.
    Used by MunicipalPage 'Needs Review' tab.
    """
    return await database.get_flagged_reports(limit=limit)


@router.get("/heatmap")
async def get_heatmap(time_filter: str = Query("today"), _user: dict = Depends(current_user)):
    return await database.get_heatmap_data(time_filter=time_filter)


@router.get("/{report_id}")
async def get_report(report_id: str, _user: dict = Depends(current_user)):
    report = await database.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.patch("/{report_id}")
async def update_report(report_id: str, data: ReportUpdate, _user: dict = Depends(municipal_only)):
    report = await database.update_report(report_id, data.model_dump(exclude_none=True))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/resolve")
async def resolve_report(report_id: str, body: ResolveRequest, _user: dict = Depends(municipal_only)):
    from datetime import datetime
    update_data = {
        "status": "resolved",
        "resolutionNote": body.note,
        "resolvedAt": datetime.utcnow().isoformat(),
    }
    if body.resolved_image_url:
        update_data["resolvedImageUrl"] = body.resolved_image_url
    report = await database.update_report(report_id, update_data)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/acknowledge")
async def acknowledge_report(report_id: str, body: AcknowledgeRequest = AcknowledgeRequest(), _user: dict = Depends(municipal_only)):
    report = await database.acknowledge_report(report_id, assigned_to=body.assigned_to)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/upvote")
async def upvote_report(report_id: str, _user: dict = Depends(current_user)):
    upvotes = await database.upvote_report(report_id)
    return {"upvotes": upvotes}