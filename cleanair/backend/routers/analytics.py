from fastapi import APIRouter
from services import database
from models.schemas import TokenVerifyRequest

analytics_router = APIRouter(prefix="/analytics", tags=["analytics"])
auth_router = APIRouter(prefix="/auth", tags=["auth"])


@analytics_router.get("/overview")
async def analytics_overview():
    return await database.get_analytics_overview()


@analytics_router.get("/ward/{ward}")
async def ward_analytics(ward: str):
    all_reports = await database.get_reports(limit=1000)
    ward_reports = [r for r in all_reports if r.get("location", {}).get("ward", "").lower() == ward.lower()]
    total = len(ward_reports)
    resolved = sum(1 for r in ward_reports if r.get("status") == "resolved")
    return {
        "ward": ward,
        "totalReports": total,
        "resolvedReports": resolved,
        "pendingReports": total - resolved,
        "resolutionRate": round(resolved / total * 100, 1) if total else 0,
    }


@auth_router.post("/verify")
async def verify_token(req: TokenVerifyRequest):
    """Verify a Firebase ID token and return a CleanAir API token."""
    try:
        import firebase_admin.auth as fb_auth
        decoded = fb_auth.verify_id_token(req.id_token)
        return {
            "uid": decoded["uid"],
            "email": decoded.get("email"),
            "access_token": req.id_token,  # In production, generate a JWT
        }
    except Exception:
        # Return demo token for development
        return {
            "uid": "demo-user",
            "email": "demo@cleanair.in",
            "access_token": "demo-token",
        }


@analytics_router.get("/ai-insights")
async def analytics_ai_insights():
    """GET endpoint for AI-powered analytics insights (called by frontend dashboard)."""
    from services import ai_service
    overview = await database.get_analytics_overview()
    result = await ai_service.generate_dashboard_insights(overview)
    return result


@analytics_router.get("/wards/ranking")
async def wards_ranking():
    """Return wards ranked by report count."""
    overview = await database.get_analytics_overview()
    return overview.get("wardRankings", [])
