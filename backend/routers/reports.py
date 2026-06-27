"""
Reports router — CRUD + heatmap + upvote
"""
from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from models.schemas import ReportCreate, ReportUpdate, ResolveRequest
from services import database, ai_service

router = APIRouter(prefix="/reports", tags=["reports"])


@router.get("")
async def list_reports(
    status: Optional[str] = Query(None),
    pollution_type: Optional[str] = Query(None),
    severity: Optional[str] = Query(None),
    time_filter: Optional[str] = Query("today"),
    limit: int = Query(100, le=500),
):
    return await database.get_reports(
        status=status,
        pollution_type=pollution_type,
        severity=severity,
        time_filter=time_filter,
        limit=limit,
    )


@router.post("", status_code=201)
async def create_report(data: ReportCreate):
    report_dict = data.model_dump()
    report = await database.create_report(report_dict)
    # Notify authorities for high severity reports
    await database.notify_authorities(report)
    return report


@router.get("/heatmap")
async def get_heatmap(time_filter: str = Query("today")):
    return await database.get_heatmap_data(time_filter=time_filter)


@router.get("/{report_id}")
async def get_report(report_id: str):
    report = await database.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.patch("/{report_id}")
async def update_report(report_id: str, data: ReportUpdate):
    report = await database.update_report(report_id, data.model_dump(exclude_none=True))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


@router.post("/{report_id}/resolve")
async def resolve_report(report_id: str, body: ResolveRequest):
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


@router.post("/{report_id}/upvote")
async def upvote_report(report_id: str):
    upvotes = await database.upvote_report(report_id)
    return {"upvotes": upvotes}
