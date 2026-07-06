from fastapi import APIRouter, Depends
from services import database
from deps import current_user, require_self_or_admin

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])

@notifications_router.get("/{user_id}")
async def get_notifications(user_id: str, user: dict = Depends(current_user)):
    require_self_or_admin(user, user_id)
    return await database.get_notifications(user_id)
