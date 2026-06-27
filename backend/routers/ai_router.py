from fastapi import APIRouter, HTTPException
from models.schemas import ImageAnalysisRequest, HealthAdvisoryRequest
from services import ai_service, database

router = APIRouter(prefix="/ai", tags=["ai"])


@router.post("/analyze")
async def analyze_image(req: ImageAnalysisRequest):
    """Analyse a pollution image using Gemini Vision."""
    try:
        result = await ai_service.analyze_pollution_image(req.image, req.mime_type)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/generate-report/{report_id}")
async def generate_authority_report(report_id: str):
    """Generate a formal municipal authority report for a specific incident."""
    report = await database.get_report(report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    result = await ai_service.generate_authority_report(report)
    return result


@router.post("/health-advisory")
async def get_health_advisory(req: HealthAdvisoryRequest):
    """Generate a localised health advisory based on current AQI."""
    result = await ai_service.generate_health_advisory(req.aqi, req.lat, req.lng)
    return result
