import hashlib
import time
import httpx
from config import settings

CLOUD_NAME = settings.CLOUDINARY_CLOUD_NAME
API_KEY = settings.CLOUDINARY_API_KEY
API_SECRET = settings.CLOUDINARY_API_SECRET


def _sign(params: dict) -> str:
    """Generate Cloudinary API signature (SHA-1 of sorted params + secret)."""
    to_sign = "&".join(f"{k}={v}" for k, v in sorted(params.items()))
    to_sign += API_SECRET
    return hashlib.sha1(to_sign.encode("utf-8")).hexdigest()


async def upload_image_from_base64(base64_data: str, public_id: str = None) -> str:
    """Upload a base64 image to Cloudinary using authenticated upload and return the URL."""
    if not CLOUD_NAME or not API_KEY or not API_SECRET:
        return ""

    timestamp = int(time.time())
    params = {"folder": "cleanair", "timestamp": timestamp}
    if public_id:
        params["public_id"] = public_id

    signature = _sign(params)

    payload = {
        **params,
        "file": base64_data,
        "api_key": API_KEY,
        "signature": signature,
    }

    async with httpx.AsyncClient() as client:
        resp = await client.post(
            f"https://api.cloudinary.com/v1_1/{CLOUD_NAME}/image/upload",
            data=payload,
            timeout=30,
        )
        if resp.status_code == 200:
            return resp.json()["secure_url"]
    return ""
