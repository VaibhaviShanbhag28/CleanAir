"""
Onboarding & profile router: simple role selection (citizen / municipality / admin).
Complements the existing /auth/verify in analytics.py (unchanged).
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from config import settings
from deps import current_user
from services import database

onboarding_router = APIRouter(prefix="/auth", tags=["auth"])
municipalities_router = APIRouter(prefix="/municipalities", tags=["auth"])


class OnboardRequest(BaseModel):
    role: str = Field(pattern="^(citizen|authority|admin)$")
    ward: Optional[str] = None            # citizens
    municipalityId: Optional[str] = None  # municipality staff


@onboarding_router.get("/me")
async def me(user: dict = Depends(current_user)):
    profile = user["profile"] or {}
    return {
        "uid": user["uid"],
        "email": user["email"],
        "displayName": profile.get("displayName") or user["name"],
        "photoURL": user["picture"],
        "role": profile.get("role"),
        "onboarded": bool(profile.get("role")),
        "ward": profile.get("ward"),
        "municipalityId": profile.get("municipalityId"),
        "municipalityName": profile.get("municipalityName"),
    }


@onboarding_router.get("/admin-eligible")
async def admin_eligible(user: dict = Depends(current_user)):
    """Lets the frontend know (without ever shipping the allowlist itself)
    whether the signed-in account is permitted to onboard as admin."""
    email = (user["email"] or "").strip().lower()
    return {"eligible": bool(email) and email in settings.admin_emails}


@onboarding_router.post("/onboard")
async def onboard(body: OnboardRequest, user: dict = Depends(current_user)):
    existing = user["profile"] or {}
    if existing.get("role"):
        raise HTTPException(status_code=409, detail="Profile already onboarded")

    if body.role == "admin":
        email = (user["email"] or "").strip().lower()
        if not email or email not in settings.admin_emails:
            raise HTTPException(status_code=403, detail="This account is not authorised for the admin role")

    profile = {
        "email": user["email"],
        "displayName": user["name"] or (user["email"] or "").split("@")[0],
        "role": body.role,
    }

    if body.role == "citizen":
        if body.ward:
            profile["ward"] = body.ward
    elif body.role == "authority":
        munis = await database.get_municipalities()
        muni = next((m for m in munis if m["id"] == body.municipalityId), None)
        if not muni:
            raise HTTPException(status_code=422, detail="Select a valid municipality")
        profile.update({"municipalityId": muni["id"], "municipalityName": muni["name"]})
    # admin: oversees every municipality -- nothing extra to assign

    saved = await database.upsert_user_profile(user["uid"], profile)

    # Custom claim so future ID tokens carry the role (no-op without Firebase Admin)
    try:
        import firebase_admin.auth as fb_auth
        fb_auth.set_custom_user_claims(user["uid"], {"role": body.role})
    except Exception:
        pass

    return {"onboarded": True, "role": saved["role"]}


@municipalities_router.get("")
async def list_municipalities(_user: dict = Depends(current_user)):
    return await database.get_municipalities()
