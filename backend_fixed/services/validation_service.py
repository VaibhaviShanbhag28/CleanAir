"""
backend/services/validation_service.py
Fake-report detection using Gemini Vision via OpenRouter.
"""
import json
import re
import httpx
from dataclasses import dataclass, asdict
from enum import Enum
from typing import Optional

OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions"
VISION_MODEL   = "google/gemini-2.0-flash-exp:free"


def _get_key() -> str:
    try:
        from config import settings
        return getattr(settings, "OPENROUTER_API_KEY", None) or settings.GEMINI_API_KEY or ""
    except Exception:
        return ""


class VStatus(str, Enum):
    GENUINE    = "genuine"
    SUSPICIOUS = "suspicious"
    FAKE       = "fake"
    NO_IMAGE   = "no_image"
    ERROR      = "error"


@dataclass
class ValidationResult:
    status:               VStatus
    confidence:           float
    detected_content:     str
    pollution_type_match: bool
    should_block:         bool
    review_flag:          bool
    reason:               str

    def to_dict(self) -> dict:
        d = asdict(self)
        d["status"] = self.status.value
        return d


_PROMPT = """\
You are a pollution-report image validator for a civic app in Bengaluru, India.
A citizen claims this photo shows: {pollution_type}.
Their description: "{description}"

Analyse ONLY what is visible in the image.
Reply with ONLY valid JSON — no markdown fences, no text outside the braces.

Check these fraud signals:
1. Is outdoor pollution visible? (smoke, dust, garbage fire, construction dust, industrial emissions, burning waste)
2. Is this a stock photo, watermarked image, or internet download?
3. Is this a screenshot of another app, news article, or video?
4. Is this an indoor scene, selfie, food photo, poster, advertisement, or completely unrelated image?
5. Does the claimed pollution type match what is actually visible?

Return exactly this JSON:
{{
  "is_outdoor_pollution_visible": true_or_false,
  "confidence": 0.0_to_1.0,
  "detected_content": "one sentence describing exactly what you see",
  "pollution_type_match": true_or_false,
  "is_stock_photo": true_or_false,
  "is_screenshot": true_or_false,
  "is_irrelevant_scene": true_or_false,
  "recommended_action": "accept" or "review" or "reject",
  "user_facing_reason": "one friendly sentence — only fill if rejecting"
}}"""


async def validate_image_base64(
    image_base64:   str,
    mime_type:      str,
    pollution_type: str,
    description:    str,
    has_gps:        bool,
    api_key:        str,          # kept for backward compat — we use _get_key() internally
) -> ValidationResult:
    """
    Called from ai_router.py. Never blocks if AI fails.
    """
    if not image_base64:
        return ValidationResult(
            status=VStatus.NO_IMAGE, confidence=1.0,
            detected_content="none", pollution_type_match=True,
            should_block=False, review_flag=not has_gps, reason="",
        )

    key = _get_key()
    if not key:
        return _error_result(has_gps)

    prompt = _PROMPT.format(
        pollution_type=pollution_type,
        description=description or "No description provided",
    )

    # Strip data URL prefix
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    payload = {
        "model": VISION_MODEL,
        "messages": [{
            "role": "user",
            "content": [
                {
                    "type": "image_url",
                    "image_url": {"url": f"data:{mime_type};base64,{image_base64}"},
                },
                {"type": "text", "text": prompt},
            ],
        }],
        "max_tokens":  400,
        "temperature": 0.1,
    }

    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            r = await client.post(
                OPENROUTER_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {key}",
                    "Content-Type":  "application/json",
                    "HTTP-Referer":  "https://cleanair.app",
                    "X-Title":       "CleanAir Bengaluru",
                },
            )
            if r.status_code == 200:
                text = r.json()["choices"][0]["message"]["content"]
                cleaned = re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())
                raw = json.loads(cleaned)
                print(f"[validation_service] success: {raw.get('recommended_action')} confidence={raw.get('confidence')}")
                return _interpret(raw, has_gps)
            else:
                print(f"[validation_service] OpenRouter error {r.status_code}: {r.text[:150]}")
    except Exception as e:
        print(f"[validation_service] error: {e}")

    return _error_result(has_gps)


def _interpret(g: dict, has_gps: bool) -> ValidationResult:
    action       = g.get("recommended_action", "accept")
    confidence   = float(g.get("confidence", 0.5))
    is_pollution = g.get("is_outdoor_pollution_visible", True)
    is_stock     = g.get("is_stock_photo", False)
    is_scrshot   = g.get("is_screenshot", False)
    is_irrel     = g.get("is_irrelevant_scene", False)
    type_match   = g.get("pollution_type_match", True)
    detected     = g.get("detected_content", "unknown content")
    user_reason  = g.get("user_facing_reason", "")

    block = (
        (action == "reject"  and confidence >= 0.85)
        or (is_stock         and confidence >= 0.85)
        or (is_scrshot       and confidence >= 0.88)
        or (is_irrel and not is_pollution and confidence >= 0.90)
    )
    review = not block and (
        action == "review" or not type_match
        or not is_pollution or not has_gps or confidence < 0.55
    )

    if block:
        status = VStatus.FAKE
        if not user_reason:
            user_reason = (
                "The photo doesn't appear to show outdoor pollution. "
                "Please take a clear photo of the smoke, dust, garbage, or fire."
            )
    else:
        status = VStatus.SUSPICIOUS if review else VStatus.GENUINE
        user_reason = ""

    return ValidationResult(
        status=status, confidence=round(confidence, 2),
        detected_content=detected, pollution_type_match=type_match,
        should_block=block, review_flag=review, reason=user_reason,
    )


def _error_result(has_gps: bool) -> ValidationResult:
    return ValidationResult(
        status=VStatus.ERROR, confidence=0.0,
        detected_content="unknown", pollution_type_match=True,
        should_block=False, review_flag=True, reason="",
    )