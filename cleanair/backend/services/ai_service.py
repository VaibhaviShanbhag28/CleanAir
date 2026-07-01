"""
backend/services/ai_service.py
Gemini Vision via OpenRouter API — works with sk-or-v1-... keys.
Uses google/gemini-2.5-flash:free (free model with vision support).
"""
import base64
import json
import re
import httpx
from datetime import datetime

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
# Free models confirmed live on OpenRouter (verified June 2026)
VISION_MODEL    = "nvidia/nemotron-nano-12b-v2-vl:free"      # vision-language, free
TEXT_MODEL      = "meta-llama/llama-3.3-70b-instruct:free"   # strong text model, free
FALLBACK_VISION = "google/gemma-4-26b-a4b-it:free"           # text fallback (no vision but won't 404)
FALLBACK_TEXT   = "google/gemma-4-31b-it:free"               # text fallback
LAST_RESORT     = "openrouter/auto"                          # OpenRouter auto-routes to a working model


def _get_key() -> str:
    try:
        from config import settings
        # Check OPENROUTER_API_KEY first, fall back to GEMINI_API_KEY
        key = getattr(settings, "OPENROUTER_API_KEY", None) or settings.GEMINI_API_KEY or ""
        return key
    except Exception:
        return ""


async def _call_openrouter(messages: list, max_tokens: int = 600, use_vision: bool = False) -> str | None:
    """Call OpenRouter with automatic fallback through multiple free models."""
    key = _get_key()
    if not key:
        print("[ai_service] No API key found")
        return None

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://cleanair.app",
        "X-Title":       "CleanAir Bengaluru",
    }

    # Try vision-capable models first if images are in messages, else text models
    has_image = any(
        isinstance(m.get("content"), list) and
        any(c.get("type") == "image_url" for c in m.get("content", []))
        for m in messages
    )
    if has_image or use_vision:
        model_chain = [VISION_MODEL, TEXT_MODEL, FALLBACK_TEXT, FALLBACK_VISION, LAST_RESORT]
    else:
        model_chain = [TEXT_MODEL, FALLBACK_TEXT, FALLBACK_VISION, VISION_MODEL, LAST_RESORT]

    for model in model_chain:
        payload = {"model": model, "messages": messages, "max_tokens": max_tokens, "temperature": 0.4}
        try:
            async with httpx.AsyncClient(timeout=45.0) as client:
                r = await client.post(OPENROUTER_URL, json=payload, headers=headers)
            if r.status_code == 200:
                text = r.json()["choices"][0]["message"]["content"]
                print(f"[ai_service] ✅ OK with {model}")
                return text
            elif r.status_code in (404, 429):
                print(f"[ai_service] {r.status_code} on {model} — trying next")
                continue
            else:
                print(f"[ai_service] ❌ {r.status_code} ({model}): {r.text[:150]}")
                return None
        except Exception as e:
            print(f"[ai_service] ⚠️  {model} failed: {e} — trying next")
            continue

    print("[ai_service] ❌ All models exhausted — returning None")
    return None


async def analyze_pollution_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """Analyse a pollution image using Gemini Vision via OpenRouter."""

    # Strip data URL prefix if present
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    prompt = """You are an environmental AI specialist analysing pollution images for Bengaluru, India.

Analyse this specific image carefully. Respond ONLY with valid JSON — no markdown, nothing outside the braces.

{
  "pollutionType": "garbage_fire|smoke|construction_dust|industrial|vehicle|burning_waste|unknown",
  "confidence": 0.0-1.0,
  "smokeDetected": true|false,
  "dustDetected": true|false,
  "fireDetected": true|false,
  "possibleSource": "exactly what you see in this image causing pollution",
  "estimatedSeverity": "low|medium|high",
  "healthRisk": "low|moderate|high|severe",
  "recommendedAction": "specific BBMP municipal authority action",
  "estimatedAQI": 50-500,
  "summary": "2-3 sentences describing exactly what you see in THIS specific image"
}

Critical rules:
- If this is NOT a pollution image (selfie, food, poster, ad, banner, indoor, graphic, cartoon, person) set pollutionType=unknown, confidence=0.05, estimatedAQI=50, summary must describe what you actually see
- Never return generic descriptions — describe this exact image specifically
- AQI guide: clear sky=50, light haze=80-120, visible smoke=150-200, heavy smoke=250-350, fire=350-500"""

    messages = [
        {
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {
                        "url": f"data:{mime_type};base64,{image_base64}"
                    },
                },
                {
                    "type": "text",
                    "text": prompt,
                },
            ],
        }
    ]

    text = await _call_openrouter(messages, max_tokens=600)

    if text:
        try:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            result = json.loads(cleaned)
            result["analyzedAt"] = datetime.utcnow().isoformat()
            print(f"[ai_service] type={result.get('pollutionType')} aqi={result.get('estimatedAQI')} confidence={result.get('confidence')}")
            return result
        except Exception as e:
            print(f"[ai_service] JSON parse error: {e} | raw: {text[:200]}")

    print("[ai_service] Using mock — OpenRouter call failed")
    return _mock_analysis()


# Alias used by ai_router.py
analyze_image = analyze_pollution_image


async def generate_authority_report(report: dict) -> dict:
    ai       = report.get("aiAnalysis", {})
    location = report.get("location", {})

    prompt = f"""Generate a formal BBMP (Bruhat Bengaluru Mahanagara Palike) municipal report:

Location: {location.get('address', 'Unknown')}, Ward: {location.get('ward', 'Unknown')}
Pollution Type: {report.get('pollutionType', 'Unknown')}
Severity: {report.get('severity', 'Unknown')}
Citizen Description: {report.get('description', 'None provided')}
AI Analysis: {ai.get('summary', 'None')}
Estimated AQI: {ai.get('estimatedAQI', 'Unknown')}
Health Risk: {ai.get('healthRisk', 'Unknown')}

Write a concise formal report (3-4 paragraphs) suitable for BBMP action.
Include: incident summary, health impact assessment, recommended immediate actions, follow-up.
Use formal Indian government report language."""

    messages = [{"role": "user", "content": prompt}]
    text = await _call_openrouter(messages, max_tokens=800)

    if text:
        return {
            "report":      text,
            "html":        f"<div><p>{text.replace(chr(10), '</p><p>')}</p></div>",
            "generatedAt": datetime.utcnow().isoformat(),
        }
    return {
        "report":      _mock_authority_report(report),
        "html":        f"<p>{_mock_authority_report(report)}</p>",
        "generatedAt": datetime.utcnow().isoformat(),
    }


async def generate_health_advisory(aqi: int, lat: float, lng: float) -> dict:
    category = (
        "Good" if aqi <= 50 else "Moderate" if aqi <= 100 else
        "Unhealthy for Sensitive Groups" if aqi <= 150 else
        "Unhealthy" if aqi <= 200 else
        "Very Unhealthy" if aqi <= 300 else "Hazardous"
    )

    prompt = f"""Generate a public health advisory for Bengaluru citizens.
Current AQI: {aqi} ({category})
Respond ONLY as JSON (no markdown):
{{"advisory": "2 sentences in simple English for common people", "actions": ["action 1", "action 2", "action 3", "action 4"]}}"""

    messages = [{"role": "user", "content": prompt}]
    text = await _call_openrouter(messages, max_tokens=300)

    if text:
        try:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            return json.loads(cleaned)
        except Exception:
            pass

    return _mock_health_advisory(aqi)


async def categorize_voice_report(transcript: str) -> dict:
    if not transcript:
        return {"pollutionType": "unknown", "severity": "medium", "description": transcript, "keyDetails": []}

    prompt = f"""Categorise this pollution report from an Indian citizen: "{transcript}"
Respond ONLY as JSON (no markdown):
{{"pollutionType": "garbage_fire|smoke|construction_dust|industrial|vehicle|burning_waste|unknown", "severity": "low|medium|high", "description": "cleaned version", "keyDetails": ["detail1", "detail2"]}}"""

    messages = [{"role": "user", "content": prompt}]
    text = await _call_openrouter(messages, max_tokens=300)

    if text:
        try:
            cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
            return json.loads(cleaned)
        except Exception:
            pass

    return {"pollutionType": "unknown", "severity": "medium", "description": transcript, "keyDetails": []}


# ── Mocks ─────────────────────────────────────────────────────────────────────

def _mock_analysis() -> dict:
    return {
        "pollutionType":     "unknown",
        "confidence":        0.0,
        "smokeDetected":     False,
        "dustDetected":      False,
        "fireDetected":      False,
        "possibleSource":    "AI analysis unavailable — check OPENROUTER_API_KEY in .env",
        "estimatedSeverity": "low",
        "healthRisk":        "low",
        "recommendedAction": "Set OPENROUTER_API_KEY in backend/.env and restart",
        "estimatedAQI":      50,
        "summary":           "AI analysis unavailable. Please set OPENROUTER_API_KEY in your .env file. Get a free key at openrouter.ai",
        "analyzedAt":        datetime.utcnow().isoformat(),
    }


def _mock_authority_report(report: dict) -> str:
    location = report.get("location", {})
    return f"""POLLUTION INCIDENT REPORT — BBMP CleanAir
Reference: {report.get('id', 'N/A')} | Date: {datetime.utcnow().strftime('%d %B %Y')}
Location: {location.get('address', 'Unknown')}, Ward: {location.get('ward', 'Unknown')}
Type: {report.get('pollutionType', 'unknown').replace('_', ' ')} | Severity: {report.get('severity', 'unknown')}
Immediate field verification and action recommended."""


def _mock_health_advisory(aqi: int) -> dict:
    if aqi <= 50:
        return {"advisory": "Air quality is good today. Safe for all activities.", "actions": ["Enjoy outdoor activities", "Open windows for ventilation", "No special precautions needed", "Good day for exercise"]}
    elif aqi <= 100:
        return {"advisory": "Air quality is moderate. Sensitive individuals should limit prolonged outdoor exposure.", "actions": ["Sensitive groups limit outdoor time", "Stay hydrated", "Close windows during peak hours", "Monitor air quality updates"]}
    elif aqi <= 200:
        return {"advisory": "Air quality is unhealthy. Everyone may experience health effects. Wear masks outdoors.", "actions": ["Wear N95 mask outdoors", "Keep windows and doors closed", "Avoid strenuous outdoor activity", "Use air purifier indoors"]}
    else:
        return {"advisory": "Air quality is hazardous. Stay indoors and avoid all outdoor activity.", "actions": ["Stay indoors with windows closed", "Wear N95 mask if going out is unavoidable", "Seek medical help if experiencing breathing difficulty", "Call BBMP control room: 080-2222-1188"]}

# ─── NEW v2 AI FUNCTIONS ──────────────────────────────────────────────────────

async def generate_chatbot_reply(messages: list, user_location: str = "Bengaluru", context: str = "") -> str:
    """Environmental AI chatbot."""
    system = f"""You are CleanAir Assistant, an expert AI for Bengaluru environmental monitoring.
Help citizens with pollution reports, AQI, eco-tips, karma system, and BBMP processes.
Location context: {user_location}. {context}
Be concise, friendly, and practical. Answer in 2-4 sentences max."""

    chat = [{"role": "system", "content": system}] + [
        {"role": m["role"], "content": m["content"]} for m in messages[-10:]
    ]
    text = await _call_openrouter(chat, max_tokens=300)
    return text or "I'm having trouble connecting right now. Please try again in a moment."


async def generate_notice(notice_type: str, topic: str, ward: str = "", details: str = "", language: str = "english") -> dict:
    """Generate official BBMP notice/circular."""
    ref = f"BBMP/CleanAir/{notice_type.upper()[:3]}/{datetime.now().strftime('%Y%m%d')}/{hash(topic) % 9999:04d}"
    prompt = f"""Generate a professional BBMP {notice_type.replace('_', ' ')} in {language} about: {topic}.
Ward: {ward or 'All Wards of Bengaluru'}. Additional details: {details or 'N/A'}.
Include proper header, reference number {ref}, date, formal body, and signature block.
Make it authoritative and complete. Return only the notice text."""
    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=800)
    return {
        "reference": ref,
        "type": notice_type,
        "language": language,
        "content": text or f"BBMP Notice\nRef: {ref}\nDate: {datetime.now().strftime('%d %B %Y')}\n\nRegarding {topic} in {ward or 'Bengaluru'}.\n\nAction required per BBMP regulations.\n\nCommissioner, BBMP",
        "generated_at": datetime.now().isoformat()
    }


async def generate_horoscope(aqi: int) -> dict:
    """Generate a fun daily AQI horoscope."""
    prompt = f"""You are an environmental astrologer. Today's Bengaluru AQI is {aqi}.
Write a fun but informative daily air quality horoscope. Return ONLY valid JSON:
{{"title":"catchy title","forecast":"2-3 sentence forecast","emoji":"single emoji","outdoor_rating":"X/5 stars","mask_tip":"mask advice","best_time_outdoor":"time range","exercise_tip":"advice","eco_tip_of_day":"actionable tip","lucky_color":"a color","weekly_trend":"improving/stable/worsening"}}"""
    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=400)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        return json.loads(text)
    except Exception:
        lvl = "Good" if aqi <= 50 else "Moderate" if aqi <= 100 else "Unhealthy"
        return {
            "title": f"AQI {aqi} — {lvl} Air Day",
            "forecast": f"Today's AQI of {aqi} signals {lvl.lower()} conditions across Bengaluru. Plan outdoor activities accordingly.",
            "emoji": "🌤" if aqi <= 100 else "😷",
            "outdoor_rating": f"{max(1, 5 - aqi // 50)}/5 stars",
            "mask_tip": "N95 recommended" if aqi > 150 else "Mask optional",
            "best_time_outdoor": "6–8 AM",
            "exercise_tip": "Morning walks preferred" if aqi <= 100 else "Indoor exercise recommended",
            "eco_tip_of_day": "Use public transport today to reduce your carbon footprint!",
            "lucky_color": "Green",
            "weekly_trend": "stable"
        }


async def verify_cleanup(before_b64: str, after_b64: str) -> dict:
    """Verify before/after cleanup using Gemini Vision."""
    if "," in before_b64:
        before_b64 = before_b64.split(",", 1)[1]
    if "," in after_b64:
        after_b64 = after_b64.split(",", 1)[1]

    messages = [{"role": "user", "content": [
        {"type": "text", "text": """Compare these two images (before and after a cleanup attempt).
Return ONLY valid JSON:
{"verified":true/false,"before_description":"what you see","after_description":"what you see",
"changes_observed":["list","of","changes"],"improvement_score":0-100,"message":"verdict message","points_awarded":0}
Set points_awarded to 50 if verified=true, else 0."""},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{before_b64}"}},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{after_b64}"}},
    ]}]
    text = await _call_openrouter(messages, max_tokens=500)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        return json.loads(text)
    except Exception:
        return {"verified": False, "before_description": "Could not analyze", "after_description": "Could not analyze",
                "changes_observed": [], "improvement_score": 0, "message": "Analysis unavailable", "points_awarded": 0}


async def classify_waste(image_b64: str) -> dict:
    """Classify household waste from image."""
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]
    messages = [{"role": "user", "content": [
        {"type": "text", "text": """Classify this waste image for Bengaluru BBMP segregation.
Return ONLY valid JSON:
{"primary_category":"wet/dry/hazardous/e-waste/medical","bin_color":"green/blue/red/black",
"is_recyclable":true/false,"items":[{"name":"item","category":"category","disposal":"how"}],
"segregation_tip":"specific tip","environmental_note":"impact note","confidence":0.0-1.0}"""},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
    ]}]
    text = await _call_openrouter(messages, max_tokens=500)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        return json.loads(text)
    except Exception:
        return {"primary_category": "dry", "bin_color": "blue", "is_recyclable": True,
                "items": [], "segregation_tip": "When in doubt, put in dry waste bin.",
                "environmental_note": "Proper segregation helps BBMP process waste efficiently.", "confidence": 0.5}


async def calculate_carbon(data: dict) -> dict:
    """Calculate personal carbon footprint."""
    prompt = f"""Calculate annual carbon footprint for this Bengaluru resident:
Transport: {data.get('transportMode','bus')} {data.get('distanceKm',10)}km/day
Electricity: {data.get('electricityKwh',100)}kWh/month, LPG: {data.get('lpgCylinders',1)} cylinders/month
Meat meals: {data.get('meatMealsPerWeek',3)}/week, Flights: {data.get('flightsPerYear',1)}/year

Return ONLY valid JSON (all numbers in kg CO2/year):
{{"totalCO2":0,"breakdown":{{"transport":0,"electricity":0,"cooking":0,"diet":0,"aviation":0}},
"rating":"excellent/good/average/high/very_high","comparison":"vs average Indian",
"tips":["tip1","tip2","tip3"],"trees_to_offset":0}}"""
    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=500)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        return json.loads(text)
    except Exception:
        total = round((data.get('distanceKm',10) * 365 * 0.1) + (data.get('electricityKwh',100) * 12 * 0.82) + (data.get('lpgCylinders',1) * 12 * 15))
        return {"totalCO2": total, "breakdown": {"transport": round(total*0.4), "electricity": round(total*0.35), "cooking": round(total*0.15), "diet": round(total*0.08), "aviation": round(total*0.02)},
                "rating": "average", "comparison": "Similar to average Indian (1.9t CO2/year)", "tips": ["Switch to metro/bus", "Use LED lights", "Reduce AC usage"], "trees_to_offset": max(1, total // 22)}


async def generate_diary_summary(entries: list) -> dict:
    """Summarize eco-diary entries with AI insights."""
    if not entries:
        return {"summary": "No entries yet.", "insights": [], "suggestions": [], "ecoScore": 50, "topConcern": "none", "monthlyTrend": "stable"}
    sample = entries[:5]
    prompt = f"""Summarize these {len(entries)} eco-diary entries from a Bengaluru citizen:
{json.dumps(sample, indent=2, default=str)[:2000]}
Return ONLY valid JSON:
{{"summary":"2-3 sentence summary","insights":["insight1","insight2","insight3"],
"suggestions":["suggestion1","suggestion2","suggestion3"],"ecoScore":0-100,
"topConcern":"main environmental concern","monthlyTrend":"improving/stable/worsening"}}"""
    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=500)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        return json.loads(text)
    except Exception:
        return {"summary": f"You have {len(entries)} diary entries showing environmental awareness.",
                "insights": ["Regular monitoring helps track improvement"], "suggestions": ["Continue logging daily"],
                "ecoScore": 65, "topConcern": "air quality", "monthlyTrend": "stable"}


async def seasonal_prediction(month: int) -> dict:
    """Predict pollution patterns for a given month in Bengaluru."""
    month_names = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"]
    month_name = month_names[(month - 1) % 12]
    prompt = f"""Predict pollution patterns for Bengaluru in {month_name}.
Return ONLY valid JSON:
{{"month":"{month_name}","aqi_prediction":{{"average":0,"min":0,"max":0,"worst_day":"weekday"}},"main_concerns":["concern1","concern2","concern3"],
"festival_impact":"if any festivals affect pollution","weather_impact":"monsoon/winter/summer impact",
"green_cover_status":"status","waste_generation_trend":"increasing/stable/decreasing",
"health_alert":"key health advisory","recommended_actions":["action1","action2"]}}"""
    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=500)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        return json.loads(text)
    except Exception:
        avg_aqi = [120,115,130,145,155,90,75,70,85,160,150,125][month - 1]
        return {"month": month_name, "aqi_prediction": {"average": avg_aqi, "min": avg_aqi - 30, "max": avg_aqi + 50, "worst_day": "Friday"},
                "main_concerns": ["Vehicle emissions", "Construction dust", "Industrial pollution"],
                "festival_impact": "Diwali (Oct/Nov) typically causes AQI spikes of 50-80 points.",
                "weather_impact": "Monsoon (Jun-Sep) helps wash pollutants; Winter (Nov-Jan) traps pollution.",
                "green_cover_status": "Moderate", "waste_generation_trend": "stable",
                "health_alert": "Sensitive groups should limit outdoor exposure on high-AQI days.",
                "recommended_actions": ["Check AQI before morning walks", "Wear N95 mask when AQI > 150"]}


async def generate_dashboard_insights(analytics: dict) -> dict:
    """Generate AI insights for the dashboard from analytics data."""
    prompt = f"""Analyse these Bengaluru pollution analytics and provide actionable insights:
Total reports: {analytics.get('totalReports', 0)}, Resolved: {analytics.get('resolvedReports', 0)}
Most polluted area: {analytics.get('mostPollutedArea', 'unknown')}, Top type: {analytics.get('topPollutionType', 'unknown')}
Ward rankings: {json.dumps(analytics.get('wardRankings', [])[:5])}

Return ONLY valid JSON:
{{"headline":"1 urgent alert headline","insights":[
  {{"title":"title","description":"description","priority":"high/medium/low","category":"health/waste/air/water"}},
  {{"title":"title","description":"description","priority":"high/medium/low","category":"health/waste/air/water"}},
  {{"title":"title","description":"description","priority":"high/medium/low","category":"health/waste/air/water"}}
],"environmental_score":0-100,"trend":"improving/stable/worsening"}}"""
    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=600)
    try:
        text = re.sub(r"```(?:json)?|```", "", text or "").strip()
        result = json.loads(text)
        return {"aiInsights": result}
    except Exception:
        total = analytics.get('totalReports', 0)
        resolved = analytics.get('resolvedReports', 0)
        rate = round(resolved / total * 100) if total else 0
        return {"aiInsights": {
            "headline": f"⚡ {total - resolved} reports need immediate attention across Bengaluru",
            "insights": [
                {"title": "High pending count", "description": f"{total - resolved} reports await action — focus on high-severity cases first.", "priority": "high", "category": "waste"},
                {"title": f"Resolution rate: {rate}%", "description": "Target 80%+ resolution rate for citizen satisfaction.", "priority": "medium", "category": "air"},
                {"title": "Top polluted area", "description": f"{analytics.get('mostPollutedArea', 'Unknown')} needs priority intervention.", "priority": "high", "category": "health"},
            ],
            "environmental_score": min(100, rate),
            "trend": "improving" if rate > 60 else "stable"
        }}
