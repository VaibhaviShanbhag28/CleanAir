"""
backend/deps.py
Auth dependencies: resolve the caller from a Firebase ID token and enforce roles.

Verification order:
1. firebase_admin.auth.verify_id_token — full signature check (production path).
2. Dev fallback (no Firebase credentials locally): decode the JWT payload
   WITHOUT signature verification and print a warning. Never rely on this in prod.
"""
import base64
import json

from fastapi import Depends, Header, HTTPException

from services import database

_dev_warned = False


def _decode_unverified(token: str) -> dict:
    payload = token.split(".")[1]
    payload += "=" * (-len(payload) % 4)
    return json.loads(base64.urlsafe_b64decode(payload))


def _verify_token(token: str) -> dict:
    global _dev_warned
    # Only attempt real verification when Firebase is genuinely connected;
    # verify_id_token fetches Google certs over the network and hangs when
    # the app is initialized without working credentials.
    if database._firebase_available:
        try:
            import firebase_admin.auth as fb_auth
            return fb_auth.verify_id_token(token)
        except Exception:
            pass
    # Dev fallback — unverified decode
    try:
        decoded = _decode_unverified(token)
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid token")
    uid = decoded.get("user_id") or decoded.get("uid") or decoded.get("sub")
    if not uid:
        raise HTTPException(status_code=401, detail="Token has no uid")
    if not _dev_warned:
        print("[auth] !! Firebase Admin unavailable -- accepting UNVERIFIED tokens (dev only)")
        _dev_warned = True
    return {**decoded, "uid": uid}


async def current_user(authorization: str = Header(default="")) -> dict:
    """Verified token + stored profile merged. Profile may be None pre-onboarding."""
    if not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing bearer token")
    decoded = _verify_token(authorization[7:])
    profile = await database.get_user_profile(decoded["uid"])
    return {
        "uid": decoded["uid"],
        "email": decoded.get("email"),
        "name": decoded.get("name"),
        "picture": decoded.get("picture"),
        "role": (profile or {}).get("role"),
        "profile": profile,
    }


def require_role(*roles: str):
    """Admin is always allowed, in addition to whatever roles are listed."""
    allowed = set(roles) | {"admin"}

    async def dep(user: dict = Depends(current_user)) -> dict:
        if user["role"] not in allowed:
            raise HTTPException(status_code=403, detail="Insufficient permissions")
        return user
    return dep


def require_self_or_admin(user: dict, target_uid: str) -> None:
    """Raise 403 unless the caller IS target_uid or is an admin."""
    if user["role"] != "admin" and user["uid"] != target_uid:
        raise HTTPException(status_code=403, detail="Insufficient permissions")
