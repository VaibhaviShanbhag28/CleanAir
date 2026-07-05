"""
backend/services/ai_service.py
AI via OpenRouter with 5-model fallback chain.
Vision models: nvidia/nemotron-nano-12b-v2-vl:free, openrouter/auto
Text models: meta-llama/llama-3.3-70b-instruct:free, google/gemma-4-31b-it:free
"""
import json
import re
import httpx
from datetime import datetime

OPENROUTER_URL  = "https://openrouter.ai/api/v1/chat/completions"

# Verified live free models on OpenRouter (checked against /api/v1/models, July 2026).
# Each free model has its own independent daily quota, so trying several in a row
# before ever touching a paid model dramatically cuts how often a request falls
# back to canned text -- this account has no purchased credits, so the paid
# entries at the end of each chain will 402 until credits are added.
VISION_CHAIN = [
    "nvidia/nemotron-nano-12b-v2-vl:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
    "google/gemini-2.5-flash-lite",   # paid fallback -- needs OpenRouter credits
    "openrouter/auto",                # paid fallback -- needs OpenRouter credits
]
TEXT_CHAIN = [
    "meta-llama/llama-3.3-70b-instruct:free",
    "google/gemma-4-31b-it:free",
    "google/gemma-4-26b-a4b-it:free",
    "openai/gpt-oss-20b:free",
    "qwen/qwen3-next-80b-a3b-instruct:free",
    "nvidia/nemotron-nano-9b-v2:free",
    "nousresearch/hermes-3-llama-3.1-405b:free",
    "openrouter/auto",                # paid fallback -- needs OpenRouter credits
]


# -- Key resolution ------------------------------------------------------------

def _get_key() -> str:
    try:
        from config import settings
        return (
            getattr(settings, "OPENROUTER_API_KEY", None)
            or getattr(settings, "GEMINI_API_KEY", None)
            or ""
        )
    except Exception:
        return ""


# -- Core OpenRouter caller ----------------------------------------------------

async def _call_openrouter(messages: list, max_tokens: int = 600) -> str | None:
    text, _ = await _call_openrouter_detailed(messages, max_tokens)
    return text


async def _call_openrouter_detailed(messages: list, max_tokens: int = 600) -> tuple[str | None, bool]:
    """
    Call OpenRouter with automatic fallback through the model chain.
    Detects vision requests automatically from message content.
    Always ends with openrouter/auto which never 404s.

    Returns (text, quota_exhausted). quota_exhausted=True means every model in
    the chain was rejected specifically for OpenRouter's account-wide daily
    free-tier cap ("free-models-per-day") rather than a transient per-model
    rate limit -- callers can surface an honest "try again tomorrow or add
    credits" message instead of a generic "AI unavailable" one.
    """
    key = _get_key()
    if not key:
        print("[ai] No API key -- set OPENROUTER_API_KEY in .env")
        return None, False

    headers = {
        "Authorization": f"Bearer {key}",
        "Content-Type":  "application/json",
        "HTTP-Referer":  "https://cleanair.bbmp.gov.in",
        "X-Title":       "CleanAir Bengaluru -- BBMP",
    }

    has_image = any(
        isinstance(m.get("content"), list)
        and any(c.get("type") == "image_url" for c in m.get("content", []))
        for m in messages
    )

    chain = VISION_CHAIN if has_image else TEXT_CHAIN
    # True if ANY model reported OpenRouter's account-wide daily free-tier cap --
    # other models in the same chain often fail for an unrelated reason (their
    # own independent global rate limit), so requiring *all* of them to show
    # this exact message under-detects the case that's actually fixable by
    # adding credits.
    daily_quota_hit = False

    for model in chain:
        payload = {
            "model":       model,
            "messages":    messages,
            "max_tokens":  max_tokens,
            "temperature": 0.3,
        }
        try:
            import json as _json
            payload_bytes = _json.dumps(payload, ensure_ascii=True).encode("utf-8")
            req_headers = {**headers, "Content-Type": "application/json; charset=utf-8"}
            async with httpx.AsyncClient(timeout=60.0) as client:
                r = await client.post(OPENROUTER_URL, content=payload_bytes, headers=req_headers)

            if r.status_code == 200:
                text = r.json()["choices"][0]["message"]["content"]
                print(f"[ai]   {model} ({len(text)} chars)")
                return text, False

            if "free-models-per-day" in r.text:
                daily_quota_hit = True

            # Any upstream error: log and try the next model in the chain
            print(f"[ai] {r.status_code} on {model}: {r.text[:120]} -- trying next")
            continue

        except Exception as e:
            print(f"[ai]     {model}: {e} -- trying next")
            continue

    print(f"[ai]   All models exhausted (daily quota hit: {daily_quota_hit})")
    return None, daily_quota_hit


def _clean_json(text: str | None) -> str:
    """
    Strip markdown fences and leading/trailing whitespace from JSON.
    Raises on empty input so callers' `except: <fallback>` blocks actually
    fire when every model in the chain failed (text is None) -- returning
    "{}" here would parse successfully and silently skip the fallback.
    """
    if not text:
        raise ValueError("empty AI response")
    return re.sub(r"^```(?:json)?\s*|\s*```$", "", text.strip())


# -- Pollution image analysis --------------------------------------------------

async def analyze_pollution_image(image_base64: str, mime_type: str = "image/jpeg") -> dict:
    if "," in image_base64:
        image_base64 = image_base64.split(",", 1)[1]

    prompt = """\
You are an AI environmental analyst for BBMP (Bruhat Bengaluru Mahanagara Palike), Bengaluru, India.
Analyse this image carefully and respond ONLY with valid JSON -- no markdown, no extra text.

{
  "pollutionType": "garbage_fire|smoke|construction_dust|industrial|vehicle|burning_waste|water_pollution|illegal_dumping|sewage_leakage|noise_pollution|chemical_dumping|unknown",
  "confidence": 0.0-1.0,
  "smokeDetected": true|false,
  "dustDetected": true|false,
  "fireDetected": true|false,
  "possibleSource": "specific source visible in this image",
  "estimatedSeverity": "low|medium|high",
  "healthRisk": "low|moderate|high|severe",
  "recommendedAction": "specific BBMP action required",
  "estimatedAQI": 30-500,
  "affectedRadius": "estimated radius in metres",
  "immediateSteps": ["step1", "step2"],
  "summary": "2-3 sentences describing exactly what you see in THIS image"
}

Rules:
- If this is NOT a pollution image (selfie, food, text, cartoon, indoor scene, person portrait) set pollutionType=unknown, confidence=0.05, estimatedAQI=35
- Describe only what is actually visible -- no assumptions
- AQI guide: clear=35-60, light haze=70-110, visible smoke=130-180, heavy smoke=200-300, fire/chemical=300-500"""

    messages = [{"role": "user", "content": [
        {"type": "image_url", "image_url": {"url": f"data:{mime_type};base64,{image_base64}"}},
        {"type": "text", "text": prompt},
    ]}]

    text = await _call_openrouter(messages, max_tokens=700)
    if text:
        try:
            result = json.loads(_clean_json(text))
            result["analyzedAt"] = datetime.utcnow().isoformat()
            return result
        except Exception as e:
            print(f"[ai] JSON parse error: {e} | raw: {text[:200]}")
    return _mock_analysis()


analyze_image = analyze_pollution_image  # alias


# -- Authority report ----------------------------------------------------------

async def generate_authority_report(report: dict) -> dict:
    ai  = report.get("aiAnalysis", {})
    loc = report.get("location", {})
    now = datetime.now().strftime("%d %B %Y")
    ref = f"BBMP/CA/{datetime.now().strftime('%Y%m%d')}/{report.get('id','N/A')}"

    prompt = f"""\
Generate a formal BBMP environmental incident report in official Indian government language.

INCIDENT DETAILS
Reference: {ref}
Date: {now}
Ward: {loc.get('ward','Unknown')}, Bengaluru Urban
Address: {loc.get('address','Unknown')}
Coordinates: {loc.get('lat','N/A')}, {loc.get('lng','N/A')}
Pollution Type: {report.get('pollutionType','Unknown').replace('_',' ').title()}
Severity: {report.get('severity','Unknown').upper()}
AI Estimated AQI: {ai.get('estimatedAQI','N/A')}
Health Risk: {ai.get('healthRisk','N/A').upper()}
Citizen Description: {report.get('description','None provided')}
AI Analysis: {ai.get('summary','None')}
Recommended Action: {ai.get('recommendedAction','Verify and take appropriate action')}

Write a formal 4-paragraph report:
1. Executive Summary (incident overview)
2. Environmental & Health Impact Assessment
3. Immediate Actions Required (numbered list)
4. Follow-up and Monitoring Plan

Use formal BBMP report language. Include reference number {ref}."""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=900)
    content = text or _mock_authority_report(report)
    return {
        "report":      content,
        "reference":   ref,
        "html":        "<p>" + content.replace("\n\n", "</p><p>").replace("\n", "<br>") + "</p>",
        "generatedAt": datetime.utcnow().isoformat(),
    }


# -- Health advisory -----------------------------------------------------------

async def generate_health_advisory(aqi: int, lat: float, lng: float) -> dict:
    categories = {
        (0,   50):  ("Good",                          "green",  "Safe for all. Enjoy outdoor activities freely."),
        (51,  100): ("Moderate",                       "yellow", "Sensitive groups should reduce prolonged outdoor exertion."),
        (101, 150): ("Unhealthy for Sensitive Groups", "orange", "Children, elderly, and those with respiratory conditions should limit outdoor time."),
        (151, 200): ("Unhealthy",                      "red",    "Everyone may experience health effects. Wear N95 mask outdoors."),
        (201, 300): ("Very Unhealthy",                 "purple", "Health alert. Avoid outdoor activity. Use air purifier indoors."),
        (301, 500): ("Hazardous",                      "maroon", "Emergency. Stay indoors with windows sealed. Call BBMP: 080-2222-1188."),
    }
    category, color, default_advisory = "Moderate", "yellow", "Monitor air quality."
    for (lo, hi), (cat, col, adv) in categories.items():
        if lo <= aqi <= hi:
            category, color, default_advisory = cat, col, adv
            break

    prompt = f"""\
Generate a public health advisory for Bengaluru citizens. AQI: {aqi} ({category}).
Return ONLY valid JSON:
{{"advisory":"2 plain-English sentences suitable for common citizens","category":"{category}","color":"{color}",
"actions":["specific action 1","specific action 2","specific action 3","specific action 4"],
"groups_at_risk":["group1","group2"],"bbmp_helpline":"080-2222-1188"}}"""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=350)
    if text:
        try:
            return json.loads(_clean_json(text))
        except Exception:
            pass
    return {"advisory": default_advisory, "category": category, "color": color,
            "actions": ["Wear N95 mask", "Stay hydrated", "Avoid peak traffic hours", "Monitor AQI updates"],
            "groups_at_risk": ["Children", "Elderly", "Asthma patients"], "bbmp_helpline": "080-2222-1188"}


# -- Chatbot -------------------------------------------------------------------

async def generate_chatbot_reply(messages: list, user_location: str = "Bengaluru", context: str = "") -> str:
    system = f"""\
You are the CleanAir AI Assistant -- the official AI for the CleanAir environmental platform \
operated by BBMP (Bruhat Bengaluru Mahanagara Palike), Government of Karnataka.

## YOUR ROLE
Help Bengaluru citizens with: pollution reporting, AQI guidance, platform navigation, \
BBMP processes, eco-habits, waste management, and environmental queries. \
Respond like a knowledgeable, professional government assistant.

## PLATFORM FEATURES

### Submitting a Pollution Report
5 steps: Incident Type -> Location -> Photo Evidence -> Details -> Review & Submit
- Anonymous submission available (identity protected)
- AI analyses uploaded photos (Gemini Vision) -- detects type, severity, AQI impact, health risk
- Fake/malicious reports are auto-blocked before submission
- Earns +10 Karma on submission

### Bengaluru Pollution Types Supported
Garbage Fire, Smoke/Haze, Construction Dust, Industrial Emission, Vehicle Emission, \
Waste Burning, Water Pollution, Illegal Dumping, Sewage Leakage, Illegal Tree Felling, \
Noise Pollution, Chemical Dumping

### Karma & Rewards System
Actions -> Points:
- Submit Report: +10 pts  |  Verified Report: +25 pts
- Plant Tree: +20 pts     |  Join Cleanup: +30 pts
- Eco Transport: +5 pts   |  Diary Entry: +3 pts

Tiers: Seedling (0) -> Sapling (100) -> Grove Keeper (500) -> Eco Warrior (1,000) -> \
City Guardian (2,000) -> Planet Protector (5,000)

### AQI Scale (Indian NAQI Standard)
0-50   Good                           -> All activities safe
51-100  Moderate                       -> Sensitive groups take care
101-150 Unhealthy for Sensitive Groups -> Children/elderly limit outdoor time
151-200 Unhealthy                      -> Everyone affected; wear N95 mask
201-300 Very Unhealthy                 -> Avoid outdoor activity; use air purifier
301-500 Hazardous                      -> Emergency; stay indoors; call BBMP 080-2222-1188
Best outdoor time: 5-7 AM (lowest AQI due to less traffic)

### BBMP Waste Segregation (Bengaluru Rules)
Green bin  -> Wet/organic waste (kitchen scraps, garden waste)
Blue bin   -> Dry/recyclable waste (paper, plastic, glass, metal)
Red bin    -> Hazardous waste (batteries, medicines, chemicals, syringes)
Black bin  -> E-waste and sanitary waste

### AI Tools on This Platform
1. Waste Classifier -- photo -> identifies waste type + correct bin colour
2. Carbon Footprint Calculator -- lifestyle inputs -> annual CO  in kg + reduction tips
3. Official Notice Generator -- BBMP notices/circulars in English, Hindi, Kannada
4. Air Quality Advisory -- daily health guidance based on live AQI
5. Seasonal Forecast -- monthly pollution predictions for Bengaluru
6. Cleanup Impact Verifier -- before/after photos -> AI verifies cleanup + awards Karma

### Community Features
- Community Events: cleanup drives, plantation drives, awareness campaigns (+30 Karma to join)
- Cleanup Challenges: document your cleanup for community recognition
- Confidential Tips: anonymously report violations (identity never stored)
- Ward Health Score: 0-100 index covering cleanliness, AQI, waste, green cover, water, participation

### Field Diary
Log daily environmental observations. Each entry +3 Karma. AI generates monthly eco summary.

### Municipal Dashboard (BBMP Staff)
- Manage all reports: acknowledge, assign to field teams, resolve with notes
- Download AI-generated formal authority reports per incident
- Ward pollution rankings and resolution rate tracking

### Emergency Contacts -- Bengaluru
BBMP Control Room: 080-2222-1188
KSPCB Helpline: 1800-425-1900
BBMP Solid Waste: 1800-425-0243
Emergency (Police): 100  |  Ambulance: 108  |  Fire: 101

### Key Bengaluru Pollution Facts
- Worst pollution hours: 8-10 AM and 6-8 PM (peak traffic)
- Most polluted corridors: Outer Ring Road, Bannerghatta Road, Hebbal Flyover, KR Puram
- Major pollution sources: vehicle exhaust (40%), construction dust (25%), garbage burning (20%)
- Monsoon (Jun-Sep) improves AQI by 30-40% due to rain washout
- Post-Diwali AQI typically spikes 50-80 points above baseline

## CURRENT CONTEXT
Location: {user_location}
{context}

## RESPONSE RULES
- Be precise and factual. This is an official government-affiliated platform.
- For medical emergencies always direct to emergency services (108) and a doctor
- Keep responses to 3-5 sentences unless detailed explanation is specifically requested
- Always point to the most relevant platform feature when applicable
- Do not invent data -- say "check the live Dashboard" for real-time figures
- Respond in the same language the user writes in (English/Kannada/Hindi)
- Professional but warm and accessible tone"""

    chat = [{"role": "system", "content": system}] + [
        {"role": m["role"], "content": m["content"]} for m in messages[-14:]
    ]
    text, quota_exhausted = await _call_openrouter_detailed(chat, max_tokens=550)
    if text:
        return text
    if quota_exhausted:
        return (
            "The AI assistant has used up today's free quota on our AI provider. "
            "It resets automatically -- please try again in a few hours, or ask "
            "the platform admin to add OpenRouter credits for uninterrupted service. "
            "For urgent environmental issues, call BBMP Control Room: 080-2222-1188."
        )
    return (
        "I'm having trouble connecting to the AI service right now. "
        "For urgent environmental issues please call BBMP Control Room: 080-2222-1188. "
        "You can also check the live Dashboard for current AQI data."
    )


# -- Notice generator ----------------------------------------------------------

async def generate_notice(notice_type: str, topic: str, ward: str = "", details: str = "", language: str = "english") -> dict:
    ref = f"BBMP/ENV/{notice_type.upper()[:3]}/{datetime.now().strftime('%Y%m%d%H%M')}"
    lang_map = {"english": "English", "hindi": "Hindi (Devanagari script)", "kannada": "Kannada (Kannada script)"}
    lang_display = lang_map.get(language, "English")

    prompt = f"""\
Generate an official BBMP (Bruhat Bengaluru Mahanagara Palike) {notice_type.replace('_', ' ')} in {lang_display}.

Topic: {topic}
Ward: {ward or 'All Wards of Bengaluru Urban District'}
Reference Number: {ref}
Date: {datetime.now().strftime('%d %B %Y')}
Additional Details: {details or 'As per applicable BBMP and KSPCB regulations'}

Requirements:
- Include proper official header with BBMP letterhead details
- Reference number {ref}
- Formal body with specific directives and legal basis
- Penalty/fine amounts where applicable (BBMP Act 2020)
- Official closing and signature block (Commissioner, BBMP)
- Use formal Indian government administrative language
Return only the notice text, no explanations."""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=1000)
    return {
        "reference":    ref,
        "type":         notice_type,
        "language":     language,
        "content":      text or _mock_notice(ref, topic, ward, notice_type),
        "generated_at": datetime.now().isoformat(),
    }


# -- AQI advisory / horoscope --------------------------------------------------

async def generate_horoscope(aqi: int) -> dict:
    """Daily air quality advisory (renamed from horoscope for professional framing)."""
    level = ("Good" if aqi <= 50 else "Moderate" if aqi <= 100 else
             "Poor" if aqi <= 150 else "Unhealthy" if aqi <= 200 else
             "Very Unhealthy" if aqi <= 300 else "Hazardous")

    prompt = f"""\
You are the CleanAir AI for BBMP Bengaluru. Today's AQI is {aqi} ({level}).
Generate a practical daily air quality advisory. Return ONLY valid JSON:
{{"title":"professional advisory title (max 10 words)",
"forecast":"2-3 sentence practical advice for Bengaluru citizens today",
"outdoor_rating":"{max(1,5-aqi//60)}/5",
"mask_tip":"specific N95/mask guidance based on AQI {aqi}",
"best_time_outdoor":"specific time window when AQI is lowest",
"exercise_tip":"specific exercise guidance",
"eco_tip_of_day":"one actionable eco tip for Bengaluru citizens",
"weekly_trend":"improving/stable/worsening",
"emoji":"one relevant emoji"}}"""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=450)
    try:
        return json.loads(_clean_json(text))
    except Exception:
        return {
            "title":            f"Bengaluru AQI {aqi} -- {level} Air Quality",
            "forecast":         f"Today's AQI of {aqi} indicates {level.lower()} air quality across Bengaluru. {'Wear an N95 mask and limit outdoor time.' if aqi > 150 else 'Morning outdoor activities are generally safe.'}",
            "outdoor_rating":   f"{max(1,5-aqi//60)}/5",
            "mask_tip":         "N95 mask strongly recommended" if aqi > 150 else "Surgical mask sufficient" if aqi > 100 else "Mask optional today",
            "best_time_outdoor":"5:30 AM - 7:00 AM",
            "exercise_tip":     "Avoid outdoor exercise; use gym or indoor space" if aqi > 150 else "Morning walks and cycling are fine before 8 AM",
            "eco_tip_of_day":   "Carpool or use BMTC/Namma Metro today to reduce vehicle emissions on Bengaluru roads.",
            "weekly_trend":     "stable",
            "emoji":            " " if aqi > 150 else " " if aqi <= 100 else " ",
        }


# -- Cleanup verifier ----------------------------------------------------------

async def verify_cleanup(before_b64: str, after_b64: str) -> dict:
    if "," in before_b64:
        before_b64 = before_b64.split(",", 1)[1]
    if "," in after_b64:
        after_b64 = after_b64.split(",", 1)[1]

    prompt = """\
You are a BBMP cleanup verification AI. Compare the BEFORE (first image) and AFTER (second image) of a cleanup.
Return ONLY valid JSON:
{"verified":true/false,"before_description":"describe the before image specifically",
"after_description":"describe the after image specifically",
"changes_observed":["specific change 1","specific change 2","specific change 3"],
"improvement_score":0-100,
"message":"official verification verdict (1-2 sentences)",
"points_awarded":0}
Set points_awarded=50 if verified=true and genuine improvement is clear. Otherwise 0."""

    messages = [{"role": "user", "content": [
        {"type": "text", "text": prompt},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{before_b64}"}},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{after_b64}"}},
    ]}]
    text = await _call_openrouter(messages, max_tokens=600)
    try:
        return json.loads(_clean_json(text))
    except Exception:
        return {"verified": False, "before_description": "Analysis unavailable", "after_description": "Analysis unavailable",
                "changes_observed": [], "improvement_score": 0, "message": "AI verification failed. Please try again.", "points_awarded": 0}


# -- Waste classifier ----------------------------------------------------------

async def classify_waste(image_b64: str) -> dict:
    if "," in image_b64:
        image_b64 = image_b64.split(",", 1)[1]

    prompt = """\
You are a BBMP (Bengaluru) waste classification AI. Analyse this image and classify the waste.
Return ONLY valid JSON following Bengaluru's 4-bin segregation system:
{"primary_category":"wet/dry/hazardous/e-waste/sanitary",
"bin_color":"green/blue/red/black",
"is_recyclable":true/false,
"items":[{"name":"item name","category":"wet/dry/hazardous/e-waste","disposal":"specific disposal method"}],
"segregation_tip":"specific BBMP segregation guidance for this waste",
"environmental_note":"environmental impact if disposed correctly vs incorrectly",
"confidence":0.0-1.0}

Bengaluru Bin Guide:
Green = Wet/organic waste (kitchen scraps, garden waste, food)
Blue  = Dry/recyclable (paper, plastic, glass, metal, cardboard)
Red   = Hazardous/medical (batteries, chemicals, medicines, syringes, paint)
Black = E-waste + sanitary (electronics, mobile phones, menstrual waste)"""

    messages = [{"role": "user", "content": [
        {"type": "text",      "text": prompt},
        {"type": "image_url", "image_url": {"url": f"data:image/jpeg;base64,{image_b64}"}},
    ]}]
    text = await _call_openrouter(messages, max_tokens=600)
    try:
        return json.loads(_clean_json(text))
    except Exception:
        return {"primary_category": "dry", "bin_color": "blue", "is_recyclable": True,
                "items": [], "segregation_tip": "Place in blue dry waste bin. Rinse containers before disposal.",
                "environmental_note": "Proper segregation reduces landfill load and enables BBMP recycling.", "confidence": 0.5}


# -- Carbon footprint ----------------------------------------------------------

async def calculate_carbon(data: dict) -> dict:
    transport  = data.get("transportMode", "bus")
    distance   = data.get("distanceKm", 10)
    elec       = data.get("electricityKwh", 100)
    lpg        = data.get("lpgCylinders", 1)
    meat       = data.get("meatMealsPerWeek", 3)
    flights    = data.get("flightsPerYear", 1)

    prompt = f"""\
Calculate the annual carbon footprint for a Bengaluru, India resident.
Use Indian emission factors: electricity 0.82 kgCO2/kWh (Karnataka grid), \
LPG 2.98 kgCO2/kg (14.2kg cylinder), petrol car 0.192 kgCO2/km, \
metro 0.031 kgCO2/km, bus 0.089 kgCO2/km, two-wheeler 0.113 kgCO2/km.

Input data:
- Transport: {transport}, {distance} km/day
- Electricity: {elec} kWh/month
- LPG: {lpg} cylinders/month (14.2 kg each)
- Meat meals: {meat}/week
- Flights: {flights}/year (avg 2-hour domestic flight)

Return ONLY valid JSON with exact calculations:
{{"totalCO2":calculated_value,"breakdown":{{"transport":val,"electricity":val,"cooking":val,"diet":val,"aviation":val}},
"rating":"excellent/good/average/high/very_high",
"comparison":"compare to India average (1.9 tCO2/yr) and global average (4.7 tCO2/yr)",
"tips":["specific Bengaluru tip 1","tip 2","tip 3","tip 4"],
"trees_to_offset":calculated_value,
"equivalent":"relatable comparison (e.g. driving X km)"}}"""

    # Compute deterministically -- free LLMs are unreliable at arithmetic
    # (observed totalCO2 not matching the sum of their own breakdown), so the
    # numeric fields are always authoritative; only qualitative text is AI-generated.
    t_factors = {"walk":0,"cycle":0,"metro":0.031,"bus":0.089,"auto":0.1,"bike":0.113,"car":0.192}
    t_co2  = round(t_factors.get(transport, 0.089) * distance * 365)
    e_co2  = round(elec * 12 * 0.82)
    lpg_co2= round(lpg * 12 * 2.98 * 14.2)
    d_co2  = round(meat * 52 * 3.3)
    a_co2  = round(flights * 255)
    total  = t_co2 + e_co2 + lpg_co2 + d_co2 + a_co2
    rating = "excellent" if total<800 else "good" if total<1500 else "average" if total<2500 else "high" if total<4000 else "very_high"
    computed = {
        "totalCO2": total,
        "breakdown": {"transport":t_co2,"electricity":e_co2,"cooking":lpg_co2,"diet":d_co2,"aviation":a_co2},
        "rating": rating,
        "comparison": f"India average: 1,900 kg/yr | Global average: 4,700 kg/yr | Your footprint: {total} kg/yr",
        "tips": ["Switch to Namma Metro/BMTC for daily commute",
                 "Install solar panels (BESCOM offers subsidies up to Rs78,000)",
                 "Use induction cooktop instead of LPG",
                 "Reduce meat consumption to 1-2 meals/week"],
        "trees_to_offset": max(1, total // 22),
        "equivalent": f"Driving {round(total/0.192):,} km by car",
    }

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=600)
    try:
        ai = json.loads(_clean_json(text))
        # Keep the AI's qualitative writing, but never trust its arithmetic.
        computed["tips"] = ai.get("tips") or computed["tips"]
        computed["equivalent"] = ai.get("equivalent") or computed["equivalent"]
    except Exception:
        pass
    return computed


# -- Diary summary -------------------------------------------------------------

async def generate_diary_summary(entries: list) -> dict:
    if not entries:
        return {"summary": "No diary entries yet.", "insights": [], "suggestions": [],
                "ecoScore": 50, "topConcern": "none", "monthlyTrend": "stable"}

    sample = entries[:8]
    moods  = [e.get("mood", "neutral") for e in sample]
    habits = [h for e in sample for h in (e.get("ecoHabits") or [])]

    prompt = f"""\
Analyse these {len(entries)} eco-diary entries from a Bengaluru citizen and generate an environmental summary.
Sample entries: {json.dumps(sample, default=str)[:2500]}
Mood distribution: {moods}
Eco habits logged: {habits}

Return ONLY valid JSON:
{{"summary":"3-4 sentence personalised summary of their environmental journey",
"insights":["specific insight 1","insight 2","insight 3"],
"suggestions":["actionable Bengaluru-specific suggestion 1","suggestion 2","suggestion 3"],
"ecoScore":0-100,
"topConcern":"their most observed environmental concern",
"monthlyTrend":"improving/stable/worsening",
"habitStreak":"most consistently logged eco habit"}}"""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=600)
    try:
        return json.loads(_clean_json(text))
    except Exception:
        return {"summary": f"You have recorded {len(entries)} environmental observations. Keep logging to build your eco profile.",
                "insights": ["Regular observation helps identify local pollution patterns"],
                "suggestions": ["Try logging at different times of day to capture AQI variations"],
                "ecoScore": 60, "topConcern": "air quality", "monthlyTrend": "stable", "habitStreak": "walking"}


# -- Seasonal prediction -------------------------------------------------------

# Real Bengaluru AQI seasonal data (CPCB historical averages)
BENGALURU_SEASONAL_AQI = {
    1:  {"avg": 118, "min": 75,  "max": 175, "season": "Winter",  "concerns": ["Vehicle exhaust", "Construction dust", "Fog-trapped pollutants"]},
    2:  {"avg": 112, "min": 70,  "max": 160, "season": "Winter",  "concerns": ["Vehicle exhaust", "Open burning", "Industrial emissions"]},
    3:  {"avg": 128, "min": 80,  "max": 185, "season": "Summer",  "concerns": ["Construction dust", "Forest fires (outskirts)", "Pre-monsoon heat"]},
    4:  {"avg": 140, "min": 90,  "max": 200, "season": "Summer",  "concerns": ["Construction dust", "Heat waves", "Dust storms"]},
    5:  {"avg": 152, "min": 100, "max": 215, "season": "Summer",  "concerns": ["Peak heat", "Construction activity", "Pre-monsoon burning"]},
    6:  {"avg": 88,  "min": 45,  "max": 130, "season": "Monsoon", "concerns": ["Waterlogging", "Sewage overflow", "Construction mud"]},
    7:  {"avg": 72,  "min": 38,  "max": 110, "season": "Monsoon", "concerns": ["Flooding", "Dengue risk from stagnant water", "Road dust washed"]},
    8:  {"avg": 68,  "min": 35,  "max": 105, "season": "Monsoon", "concerns": ["Humidity-related mold", "Waterborne diseases", "Reduced visibility"]},
    9:  {"avg": 82,  "min": 45,  "max": 125, "season": "Post-Monsoon", "concerns": ["Recovering dust", "Agricultural burning (northern Karnataka)"]},
    10: {"avg": 158, "min": 110, "max": 250, "season": "Post-Monsoon", "concerns": ["Diwali fireworks", "Crop burning smoke", "Winter onset"]},
    11: {"avg": 145, "min": 95,  "max": 220, "season": "Winter",  "concerns": ["Post-Diwali pollution", "Temperature inversion", "Vehicle emissions"]},
    12: {"avg": 122, "min": 78,  "max": 178, "season": "Winter",  "concerns": ["Cold weather inversion", "Fog events", "Year-end construction rush"]},
}

BENGALURU_FESTIVALS = {
    1:  "Sankranti (Jan 14-15): Kite flying and bonfires cause localised AQI spikes of 20-40 points.",
    2:  "No major pollution-causing festivals in February.",
    3:  "Holi (March): Colour smoke/chemicals cause brief AQI spikes in residential areas.",
    4:  "Ugadi/Tamil New Year: Minimal pollution impact.",
    5:  "No major festivals; summer construction peaks.",
    6:  "No major festivals; monsoon begins.",
    7:  "No major festivals; cleanest month of year.",
    8:  "Independence Day: Minor fireworks. Ganesh Chaturthi (some years): idol immersion affects lake water quality.",
    9:  "Ganesh Chaturthi / Navratri: Idol immersions impact Ulsoor and Hebbal lake water quality.",
    10: "DIWALI (Major Impact): AQI spikes 60-120 points above baseline for 3-5 days. PM2.5 can exceed 300  g/m3.",
    11: "Post-Diwali recovery takes 1-2 weeks. Kannada Rajyotsava (Nov 1): minimal pollution.",
    12: "Christmas/New Year: Minimal fireworks. Year-end construction rush.",
}


async def seasonal_prediction(month: int) -> dict:
    month = max(1, min(12, month))
    month_names = ["January","February","March","April","May","June",
                   "July","August","September","October","November","December"]
    month_name = month_names[month - 1]
    data = BENGALURU_SEASONAL_AQI[month]

    prompt = f"""\
Generate a detailed seasonal pollution forecast for Bengaluru, India for {month_name}.
Use these verified historical data points:
- Average AQI: {data['avg']}, Range: {data['min']}-{data['max']}
- Season: {data['season']}
- Known concerns: {', '.join(data['concerns'])}
- Festival context: {BENGALURU_FESTIVALS[month]}

Return ONLY valid JSON:
{{"month":"{month_name}","season":"{data['season']}",
"aqi_prediction":{{"average":{data['avg']},"min":{data['min']},"max":{data['max']},"worst_day":"Friday evening or Saturday"}},
"main_concerns":{json.dumps(data['concerns'])},
"festival_impact":"{BENGALURU_FESTIVALS[month]}",
"weather_impact":"describe specific {data['season']} weather effects on Bengaluru AQI",
"green_cover_status":"{'Dense and fresh' if month in [6,7,8] else 'Moderate' if month in [9,10] else 'Dry and sparse' if month in [3,4,5] else 'Moderate'}",
"waste_generation_trend":"{'increasing due to festivals' if month in [10,11] else 'stable'}",
"health_alert":"specific health guidance for {month_name} in Bengaluru",
"recommended_actions":["specific action 1 for {month_name}","specific action 2","specific action 3"],
"best_areas":["Cubbon Park area","Jayanagar","Banashankari"],
"worst_corridors":["Outer Ring Road","Bannerghatta Road","KR Puram"]}}"""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=700)
    try:
        return json.loads(_clean_json(text))
    except Exception:
        return {
            "month": month_name, "season": data["season"],
            "aqi_prediction": {"average": data["avg"], "min": data["min"], "max": data["max"], "worst_day": "Friday evening"},
            "main_concerns": data["concerns"],
            "festival_impact": BENGALURU_FESTIVALS[month],
            "weather_impact": f"{data['season']} conditions in Bengaluru typically {'improve' if month in range(6,10) else 'worsen'} air quality.",
            "green_cover_status": "Dense and active" if month in [6,7,8] else "Moderate" if month in [9,10,11] else "Dry",
            "waste_generation_trend": "Increasing due to festivals" if month in [10,11] else "Stable",
            "health_alert": f"AQI averaging {data['avg']} in {month_name}. {'Wear N95 mask daily.' if data['avg']>150 else 'Morning activities are generally safe.'}",
            "recommended_actions": ["Check AQI on CleanAir dashboard before going out",
                                    "Wear N95 mask when AQI > 150",
                                    "Report pollution incidents via the CleanAir app"],
            "best_areas": ["Cubbon Park", "Lalbagh Botanical Garden", "Jayanagar 4th Block"],
            "worst_corridors": ["Outer Ring Road (ORR)", "Bannerghatta Road", "Hebbal Flyover"],
        }


# -- Dashboard insights --------------------------------------------------------

async def generate_dashboard_insights(analytics: dict) -> dict:
    total    = analytics.get("totalReports", 0)
    resolved = analytics.get("resolvedReports", 0)
    pending  = analytics.get("pendingReports", 0)
    rate     = round(resolved / total * 100) if total else 0
    top_area = analytics.get("mostPollutedArea", "Unknown")
    top_type = analytics.get("topPollutionType", "unknown").replace("_", " ")
    ward_list= analytics.get("wardRankings", [])[:5]

    prompt = f"""\
Analyse these Bengaluru CleanAir platform analytics and provide actionable intelligence for BBMP officials.
Total reports: {total} | Resolved: {resolved} ({rate}%) | Pending: {pending}
Most polluted area: {top_area} | Top incident type: {top_type}
Top 5 wards by incidents: {json.dumps(ward_list)}

Return ONLY valid JSON:
{{"headline":"1 urgent actionable alert for BBMP officials (max 15 words)",
"insights":[
  {{"title":"title","description":"specific actionable description","priority":"high/medium/low","category":"health/waste/air/water/infrastructure"}},
  {{"title":"title","description":"description","priority":"high/medium/low","category":"category"}},
  {{"title":"title","description":"description","priority":"high/medium/low","category":"category"}}
],
"environmental_score":{rate},
"trend":"improving/stable/worsening",
"priority_ward":"{top_area}",
"recommended_deployment":"suggested field team deployment"}}"""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=700)
    try:
        result = json.loads(_clean_json(text))
        return {"aiInsights": result}
    except Exception:
        return {"aiInsights": {
            "headline": f"{pending} incidents pending immediate BBMP field action",
            "insights": [
                {"title": "High pending backlog", "description": f"{pending} reports unresolved. Prioritise high-severity cases in {top_area}.", "priority": "high", "category": "infrastructure"},
                {"title": f"Resolution rate: {rate}%", "description": "BBMP target is 80%+. Deploy additional field teams to top 3 wards.", "priority": "medium", "category": "waste"},
                {"title": f"Top incident: {top_type}", "description": f"{top_type.title()} is the leading complaint. Focus enforcement in {top_area}.", "priority": "high", "category": "air"},
            ],
            "environmental_score": rate,
            "trend": "improving" if rate > 70 else "stable" if rate > 50 else "worsening",
            "priority_ward": top_area,
            "recommended_deployment": f"Deploy 2 field teams to {top_area} for immediate {top_type} mitigation.",
        }}


# -- Voice report categoriser --------------------------------------------------

async def categorize_voice_report(transcript: str) -> dict:
    if not transcript:
        return {"pollutionType": "unknown", "severity": "medium", "description": "", "keyDetails": []}

    prompt = f"""\
Categorise this pollution report voice transcript from a Bengaluru citizen:
"{transcript}"

Return ONLY valid JSON:
{{"pollutionType":"garbage_fire|smoke|construction_dust|industrial|vehicle|burning_waste|water_pollution|illegal_dumping|sewage_leakage|noise_pollution|chemical_dumping|unknown",
"severity":"low|medium|high",
"description":"cleaned grammatically correct version of the report",
"keyDetails":["key detail 1","key detail 2"],
"suggestedWard":"inferred ward/area if mentioned"}}"""

    text = await _call_openrouter([{"role": "user", "content": prompt}], max_tokens=350)
    try:
        return json.loads(_clean_json(text))
    except Exception:
        return {"pollutionType": "unknown", "severity": "medium", "description": transcript, "keyDetails": [], "suggestedWard": ""}


# -- Mock fallbacks ------------------------------------------------------------

def _mock_analysis() -> dict:
    return {
        "pollutionType": "unknown", "confidence": 0.0,
        "smokeDetected": False, "dustDetected": False, "fireDetected": False,
        "possibleSource": "AI analysis unavailable -- set OPENROUTER_API_KEY in backend/.env",
        "estimatedSeverity": "low", "healthRisk": "low",
        "recommendedAction": "Configure OPENROUTER_API_KEY in .env (free key at openrouter.ai)",
        "estimatedAQI": 50, "affectedRadius": "N/A",
        "immediateSteps": ["Set OPENROUTER_API_KEY in .env", "Restart the backend server"],
        "summary": "AI analysis unavailable. Get a free API key at openrouter.ai and set OPENROUTER_API_KEY in backend/.env",
        "analyzedAt": datetime.utcnow().isoformat(),
    }


def _mock_authority_report(report: dict) -> str:
    loc = report.get("location", {})
    now = datetime.now().strftime("%d %B %Y")
    ref = f"BBMP/CA/{datetime.now().strftime('%Y%m%d')}/{report.get('id','N/A')}"
    return f"""BRUHAT BENGALURU MAHANAGARA PALIKE
ENVIRONMENTAL INCIDENT REPORT

Reference: {ref}
Date: {now}
Ward: {loc.get('ward','Unknown')}, Bengaluru Urban District

INCIDENT SUMMARY
A {report.get('severity','medium').upper()} severity {report.get('pollutionType','pollution').replace('_',' ')} incident has been reported at {loc.get('address','the above location')}.

RECOMMENDED ACTION
Immediate field verification required. Assign BBMP environmental team within 24 hours.

Commissioner, BBMP
Environment & Solid Waste Management Division"""


def _mock_notice(ref: str, topic: str, ward: str, notice_type: str) -> str:
    now = datetime.now().strftime("%d %B %Y")
    return f"""BRUHAT BENGALURU MAHANAGARA PALIKE
OFFICE OF THE COMMISSIONER
Reference: {ref}
Date: {now}

{notice_type.replace('_',' ').upper()}

Subject: {topic}
Ward: {ward or 'All Wards of Bengaluru Urban District'}

This notice is issued under the provisions of the BBMP Act 2020 and Karnataka Solid Waste Management Rules 2016 regarding the above subject.

All concerned citizens, establishments, and agencies are hereby directed to comply immediately.

Non-compliance shall attract penalties under Section 321 of the BBMP Act 2020.

Commissioner
Bruhat Bengaluru Mahanagara Palike
Contact: 080-2222-1188"""
