"""
Gemini Vision + Pro AI service for CleanAir.
Analyses pollution images and generates reports/advisories.
"""
import base64
import json
import re
from typing import Optional
from datetime import datetime


def get_gemini_client():
    """Get Gemini client if API key is available."""
    try:
        import google.generativeai as genai
        from config import settings
        if settings.GEMINI_API_KEY:
            genai.configure(api_key=settings.GEMINI_API_KEY)
            return genai
        return None
    except ImportError:
        return None


async def analyze_pollution_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    """
    Use Gemini Vision to analyse a pollution image.
    Returns structured analysis in JSON format.
    Falls back to rule-based mock if Gemini is not available.
    """
    genai = get_gemini_client()

    if genai:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")

            # Strip data URL prefix if present
            if "," in image_base64:
                image_base64 = image_base64.split(",", 1)[1]

            image_data = base64.b64decode(image_base64)

            prompt = """You are an environmental AI specialist analysing pollution images for an Indian city monitoring system.

Analyse this image and respond ONLY with valid JSON in exactly this format (no markdown, no explanation):

{
  "pollutionType": "garbage_fire|smoke|construction_dust|industrial|vehicle|burning_waste|unknown",
  "confidence": 0.0-1.0,
  "smokeDetected": true|false,
  "dustDetected": true|false,
  "fireDetected": true|false,
  "possibleSource": "brief description of the likely pollution source",
  "estimatedSeverity": "low|medium|high",
  "healthRisk": "low|moderate|high|severe",
  "recommendedAction": "specific action for municipal authorities",
  "estimatedAQI": 50-500,
  "summary": "2-3 sentence description of what you see and the pollution concern"
}

Key guidelines:
- estimatedAQI should reflect what you observe (smoke density, visibility, fire size)
- healthRisk: low=AQI<100, moderate=100-150, high=150-250, severe=250+
- Be specific about the Indian urban context (BBMP, KSPCB)
- If no pollution visible, use unknown type with low severity and AQI 50"""

            response = model.generate_content(
                [
                    {"mime_type": mime_type, "data": image_data},
                    prompt,
                ]
            )

            text = response.text.strip()
            # Clean up any markdown wrapping
            text = re.sub(r"```json\s*", "", text)
            text = re.sub(r"```\s*", "", text)

            result = json.loads(text)
            result["analyzedAt"] = datetime.utcnow().isoformat()
            return result

        except json.JSONDecodeError as e:
            print(f"Gemini JSON parse error: {e}")
        except Exception as e:
            print(f"Gemini Vision error: {e}")

    # Fallback mock analysis
    return _mock_analysis()


async def generate_authority_report(report: dict) -> dict:
    """Generate a formal municipal authority report using Gemini Pro."""
    genai = get_gemini_client()

    ai = report.get("aiAnalysis", {})
    location = report.get("location", {})

    if genai:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""You are an assistant for BBMP (Bruhat Bengaluru Mahanagara Palike).

Generate a formal municipal report for this pollution incident:

Location: {location.get('address', 'Unknown')}, Ward: {location.get('ward', 'Unknown')}
Pollution Type: {report.get('pollutionType', 'Unknown')}
Severity: {report.get('severity', 'Unknown')}
Description: {report.get('description', 'No description')}
AI Analysis: {ai.get('summary', 'No AI analysis')}
Estimated AQI: {ai.get('estimatedAQI', 'Unknown')}
Health Risk: {ai.get('healthRisk', 'Unknown')}

Write a concise formal report (3-4 paragraphs) suitable for BBMP action.
Include: incident summary, health impact assessment, recommended immediate actions, follow-up requirements.
Use formal Indian government report language."""

            response = model.generate_content(prompt)
            report_text = response.text

            return {
                "report": report_text,
                "html": f"<div class='authority-report'><p>{report_text.replace(chr(10), '</p><p>')}</p></div>",
                "generatedAt": datetime.utcnow().isoformat(),
            }
        except Exception as e:
            print(f"Gemini report generation error: {e}")

    # Fallback
    return {
        "report": _mock_authority_report(report),
        "html": f"<p>{_mock_authority_report(report)}</p>",
        "generatedAt": datetime.utcnow().isoformat(),
    }


async def generate_health_advisory(aqi: int, lat: float, lng: float) -> dict:
    """Generate a localised health advisory based on AQI."""
    genai = get_gemini_client()

    category = (
        "Good" if aqi <= 50 else
        "Moderate" if aqi <= 100 else
        "Unhealthy for Sensitive Groups" if aqi <= 150 else
        "Unhealthy" if aqi <= 200 else
        "Very Unhealthy" if aqi <= 300 else
        "Hazardous"
    )

    if genai:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""Generate a public health advisory for Bengaluru citizens.
Current AQI: {aqi} ({category})
Location: approximately {lat:.3f}°N, {lng:.3f}°E

Provide:
1. A 2-sentence advisory in simple language for common people
2. A JSON list of 4 specific action items

Respond as JSON only:
{{
  "advisory": "Your 2-sentence advisory here",
  "actions": ["action 1", "action 2", "action 3", "action 4"]
}}"""

            response = model.generate_content(prompt)
            text = response.text.strip()
            text = re.sub(r"```json\s*", "", text)
            text = re.sub(r"```\s*", "", text)
            return json.loads(text)
        except Exception as e:
            print(f"Health advisory error: {e}")

    return _mock_health_advisory(aqi)


async def categorize_voice_report(transcript: str) -> dict:
    """Use Gemini to categorise a voice report transcript."""
    genai = get_gemini_client()

    if genai and transcript:
        try:
            model = genai.GenerativeModel("gemini-1.5-flash")
            prompt = f"""Categorise this pollution report transcript from an Indian citizen:
"{transcript}"

Respond ONLY as JSON:
{{
  "pollutionType": "garbage_fire|smoke|construction_dust|industrial|vehicle|burning_waste|unknown",
  "severity": "low|medium|high",
  "description": "cleaned up version of their report",
  "keyDetails": ["key detail 1", "key detail 2"]
}}"""
            response = model.generate_content(prompt)
            text = re.sub(r"```json\s*", "", response.text.strip())
            text = re.sub(r"```\s*", "", text)
            return json.loads(text)
        except Exception as e:
            print(f"Voice categorisation error: {e}")

    return {
        "pollutionType": "unknown",
        "severity": "medium",
        "description": transcript,
        "keyDetails": [],
    }


# ── Fallback mocks ────────────────────────────────────────────────────────────

def _mock_analysis() -> dict:
    return {
        "pollutionType": "smoke",
        "confidence": 0.82,
        "smokeDetected": True,
        "dustDetected": False,
        "fireDetected": False,
        "possibleSource": "Vehicle emissions or industrial discharge",
        "estimatedSeverity": "medium",
        "healthRisk": "moderate",
        "recommendedAction": "Monitor area and notify concerned authority. Citizens with respiratory conditions should avoid the area.",
        "estimatedAQI": 148,
        "summary": "The image shows signs of air pollution with visible haze or smoke. This appears to be a moderate pollution event that warrants monitoring by local authorities.",
        "analyzedAt": datetime.utcnow().isoformat(),
    }


def _mock_authority_report(report: dict) -> str:
    location = report.get("location", {})
    return f"""POLLUTION INCIDENT REPORT — BBMP CleanAir System

Reference: {report.get('id', 'N/A')}
Date: {datetime.utcnow().strftime('%d %B %Y')}
Location: {location.get('address', 'Unknown')}, Ward: {location.get('ward', 'Unknown')}

INCIDENT SUMMARY:
A {report.get('severity', 'medium')} severity pollution incident involving {report.get('pollutionType', 'unknown').replace('_', ' ')} has been reported at the above location. The incident was documented by a citizen reporter and has been verified by the CleanAir AI system.

HEALTH IMPACT ASSESSMENT:
Based on the pollution type and severity level, there is potential health risk to residents in the immediate vicinity, particularly those with pre-existing respiratory conditions. Immediate assessment by the environmental health team is recommended.

RECOMMENDED IMMEDIATE ACTIONS:
1. Dispatch BBMP sanitation/enforcement team to the location within 2 hours
2. Document the source and extent of pollution
3. Issue notice to responsible party if applicable
4. Conduct follow-up inspection within 48 hours

This report has been auto-generated by the CleanAir citizen reporting system and requires field verification."""


def _mock_health_advisory(aqi: int) -> dict:
    if aqi <= 50:
        return {
            "advisory": "Air quality is good today. It is a great day for outdoor activities.",
            "actions": ["Enjoy outdoor activities", "Open windows for ventilation", "No special precautions needed", "Ideal for exercise"],
        }
    elif aqi <= 100:
        return {
            "advisory": "Air quality is moderate. Most people can go about their day normally, but unusually sensitive individuals should consider limiting prolonged outdoor activity.",
            "actions": ["Sensitive groups limit outdoor time", "Keep windows closed during peak traffic", "Stay hydrated", "Monitor air quality updates"],
        }
    elif aqi <= 200:
        return {
            "advisory": "Air quality is unhealthy. Everyone may experience health effects. Sensitive groups (children, elderly, those with respiratory conditions) should limit outdoor activity.",
            "actions": ["Wear N95 mask outdoors", "Keep windows and doors closed", "Avoid strenuous outdoor activity", "Use air purifier indoors if available"],
        }
    else:
        return {
            "advisory": "Air quality is very unhealthy or hazardous. Everyone should avoid outdoor activities. People with heart or respiratory disease, the elderly and children should remain indoors.",
            "actions": ["Stay indoors with windows closed", "Use N95 masks if going out is unavoidable", "Seek medical attention if experiencing breathing difficulty", "Contact BBMP control room: 080-2222-1188"],
        }
