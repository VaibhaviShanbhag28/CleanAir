"""
Onboarding & profile router: role selection + Aadhaar verification.
Complements the existing /auth/verify in analytics.py (unchanged).
"""
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from config import settings
from deps import current_user
from services import aadhaar, database

onboarding_router = APIRouter(prefix="/auth", tags=["auth"])
municipalities_router = APIRouter(prefix="/municipalities", tags=["auth"])


class OnboardRequest(BaseModel):
    role: str = Field(pattern="^(citizen|authority|admin)$")
    aadhaarNumber: str
    fullName: str = Field(min_length=3, max_length=80)
    ward: Optional[str] = None            # citizens
    municipalityId: Optional[str] = None  # officials
    departmentId: Optional[str] = None
    designation: Optional[str] = None
    employeeId: Optional[str] = None


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
        "verifiedName": profile.get("verifiedName"),
        "aadhaarLast4": profile.get("aadhaarLast4"),
        "ward": profile.get("ward"),
        "municipalityId": profile.get("municipalityId"),
        "municipalityName": profile.get("municipalityName"),
        "departmentId": profile.get("departmentId"),
        "departmentName": profile.get("departmentName"),
        "designation": profile.get("designation"),
        "employeeId": profile.get("employeeId"),
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

    ok, reason = aadhaar.validate_number(body.aadhaarNumber)
    if not ok:
        raise HTTPException(status_code=422, detail=reason)

    # Placeholder eKYC name check: entered name vs Google account name
    reference_name = user["name"] or ""
    if reference_name and not aadhaar.name_matches(body.fullName, reference_name):
        raise HTTPException(
            status_code=422,
            detail="Full name does not match the Aadhaar holder's name on record",
        )

    a_hash = aadhaar.hash_aadhaar(body.aadhaarNumber, settings.AADHAAR_SALT)
    dup = await database.find_user_by_aadhaar(a_hash)
    if dup and dup.get("uid") != user["uid"]:
        raise HTTPException(status_code=409, detail="This Aadhaar is already registered to another account")

    profile = {
        "email": user["email"],
        "displayName": user["name"] or body.fullName,
        "role": body.role,
        "aadhaarHash": a_hash,
        "aadhaarLast4": aadhaar.last4(body.aadhaarNumber),
        "verifiedName": body.fullName.strip(),
        "verifiedAt": __import__("datetime").datetime.utcnow().isoformat(),
    }

    if body.role == "citizen":
        if body.ward:
            profile["ward"] = body.ward
    elif body.role == "admin":
        pass  # admins oversee every municipality -- no ward/department to assign
    else:  # authority
        munis = await database.get_municipalities()
        muni = next((m for m in munis if m["id"] == body.municipalityId), None)
        if not muni:
            raise HTTPException(status_code=422, detail="Select a valid municipality")
        dept = next((d for d in muni["departments"] if d["id"] == body.departmentId), None)
        if not dept:
            raise HTTPException(status_code=422, detail="Select a valid department")
        if not (body.designation or "").strip():
            raise HTTPException(status_code=422, detail="Designation is required for officials")
        profile.update({
            "municipalityId": muni["id"], "municipalityName": muni["name"],
            "departmentId": dept["id"], "departmentName": dept["name"],
            "designation": body.designation.strip(),
            "employeeId": (body.employeeId or "").strip() or None,
        })

    saved = await database.upsert_user_profile(user["uid"], profile)

    # Custom claim so future ID tokens carry the role (no-op without Firebase Admin)
    try:
        import firebase_admin.auth as fb_auth
        fb_auth.set_custom_user_claims(user["uid"], {"role": body.role})
    except Exception:
        pass

    return {"onboarded": True, "role": saved["role"], "verifiedName": saved["verifiedName"],
            "aadhaarLast4": saved["aadhaarLast4"]}


@municipalities_router.get("")
async def list_municipalities():
    return await database.get_municipalities()
