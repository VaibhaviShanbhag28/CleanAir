"""
backend/routers/ai_router.py
All AI endpoints - Gemini Vision, chatbot, horoscope, tools, etc.
"""
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional, List

from services import ai_service
from services.validation_service import validate_image_base64
from config import settings

router = APIRouter(prefix="/ai", tags=["ai"])


# --- Request models ----------------------------------------------------------

class AnalyzeRequest(BaseModel):
    image:          str
    mime_type:      str = "image/jpeg"
    pollution_type: Optional[str] = "unknown"
    description:    Optional[str] = ""
    has_gps:        Optional[bool] = False


class ChatMessage(BaseModel):
    role:    str   # "user" or "assistant"
    content: str


class ChatRequest(BaseModel):
    messages:     List[ChatMessage]
    userLocation: Optional[str] = "Bengaluru"
    context:      Optional[str] = ""


class NoticeRequest(BaseModel):
    noticeType: str = "public_notice"
    topic:      str
    ward:       Optional[str] = ""
    details:    Optional[str] = ""
    language:   str = "english"


class CleanupVerifyRequest(BaseModel):
    beforeImageBase64: str
    afterImageBase64:  str


class WasteClassifyRequest(BaseModel):
    imageBase64: str


class CarbonRequest(BaseModel):
    transportMode:      str = "bus"
    distanceKm:         float = 10
    electricityKwh:     float = 100
    lpgCylinders:       float = 1
    meatMealsPerWeek:   int = 3
    flightsPerYear:     int = 1


class DiarySummaryRequest(BaseModel):
    entries: list


# --- Endpoints ---------------------------------------------------------------

@router.post("/analyze")
async def analyze_image(body: AnalyzeRequest):
    """AI pollution image analysis + fake detection in parallel."""
    try:
        ai_result, val_result = await asyncio.gather(
            ai_service.analyze_pollution_image(body.image, body.mime_type),
            validate_image_base64(
                image_base64   = body.image,
                mime_type      = body.mime_type,
                pollution_type = body.pollution_type or "unknown",
                description    = body.description    or "",
                has_gps        = body.has_gps        or False,
                api_key        = settings.GEMINI_API_KEY,
            ),
        )
    except Exception as e:
        print(f"[ai_router] analyze error: {e}")
        raise HTTPException(status_code=500, detail="AI analysis failed")
    return {**ai_result, "validation": val_result.to_dict()}


@router.post("/chat")
async def chatbot(body: ChatRequest):
    """Environmental AI chatbot powered by Gemini."""
    msgs = [{"role": m.role, "content": m.content} for m in body.messages]
    reply = await ai_service.generate_chatbot_reply(msgs, body.userLocation or "Bengaluru", body.context or "")
    from datetime import datetime
    return {"reply": reply, "timestamp": datetime.now().isoformat()}


@router.post("/notice")
async def generate_notice(body: NoticeRequest):
    """Generate official BBMP notice/circular."""
    result = await ai_service.generate_notice(body.noticeType, body.topic, body.ward or "", body.details or "", body.language)
    return result


@router.get("/horoscope")
async def aqi_horoscope(aqi: int = 150):
    """Daily AQI horoscope for Bengaluru."""
    return await ai_service.generate_horoscope(aqi)


@router.get("/advisory")
async def health_advisory(aqi: int, lat: float = 12.9716, lng: float = 77.5946):
    """Get localised health advisory for a given AQI."""
    return await ai_service.generate_health_advisory(aqi, lat, lng)


@router.post("/report")
async def authority_report(report: dict):
    """Generate formal authority report for a pollution case."""
    return await ai_service.generate_authority_report(report)


@router.post("/cleanup/verify")
async def cleanup_verify(body: CleanupVerifyRequest):
    """Verify before/after cleanup photos with AI."""
    return await ai_service.verify_cleanup(body.beforeImageBase64, body.afterImageBase64)


@router.post("/waste/classify")
async def waste_classify(body: WasteClassifyRequest):
    """Classify household waste from image."""
    return await ai_service.classify_waste(body.imageBase64)


@router.post("/carbon")
async def carbon_footprint(body: CarbonRequest):
    """Calculate personal carbon footprint."""
    return await ai_service.calculate_carbon(body.dict())


@router.post("/diary/summary")
async def diary_summary(body: DiarySummaryRequest):
    """Generate AI summary of eco-diary entries."""
    return await ai_service.generate_diary_summary(body.entries)


@router.post("/insights")
async def dashboard_insights(analytics: dict):
    """POST endpoint for AI dashboard insights (from dashboard AI summary button)."""
    return await ai_service.generate_dashboard_insights(analytics)


@router.get("/seasonal/{month}")
async def seasonal_forecast(month: int):
    """Seasonal pollution forecast for a given month (1-12)."""
    return await ai_service.seasonal_prediction(month)
