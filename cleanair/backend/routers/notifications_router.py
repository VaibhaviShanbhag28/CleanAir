from fastapi import APIRouter
from services import database

notifications_router = APIRouter(prefix="/notifications", tags=["notifications"])

@notifications_router.get("/{user_id}")
async def get_notifications(user_id: str):
    return await database.get_notifications(user_id)
