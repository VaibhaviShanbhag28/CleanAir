"""Community, Karma, Diary, Events, Tips, Street Score endpoints."""
from fastapi import APIRouter, Depends, Query
from typing import Optional
from services import database
from deps import current_user, require_self_or_admin

community_router = APIRouter(prefix="/community", tags=["community"])
karma_router     = APIRouter(prefix="/karma",     tags=["karma"])


# -- Events --------------------------------------------------------------------
@community_router.get("/events")
async def get_events(_user: dict = Depends(current_user)):
    return await database.get_events()

@community_router.post("/events")
async def create_event(data: dict, _user: dict = Depends(current_user)):
    return await database.create_event(data)

@community_router.post("/events/{event_id}/join")
async def join_event(event_id: str, user_id: str = Query(...), user: dict = Depends(current_user)):
    require_self_or_admin(user, user_id)
    return await database.join_event(event_id, user_id)


# -- Challenges ----------------------------------------------------------------
@community_router.get("/challenges")
async def get_challenges(status: Optional[str] = Query(None), _user: dict = Depends(current_user)):
    return await database.get_challenges(status=status)

@community_router.post("/challenges")
async def create_challenge(data: dict, _user: dict = Depends(current_user)):
    return await database.create_challenge(data)

@community_router.post("/challenges/{challenge_id}/vote")
async def vote_challenge(challenge_id: str, _user: dict = Depends(current_user)):
    return await database.vote_challenge(challenge_id)


# -- Tips ----------------------------------------------------------------------
@community_router.get("/tips")
async def get_tips(_user: dict = Depends(current_user)):
    return await database.get_tips()

@community_router.post("/tips")
async def submit_tip(data: dict, _user: dict = Depends(current_user)):
    return await database.submit_tip(data)


# -- Diary ---------------------------------------------------------------------
@community_router.get("/diary/{user_id}")
async def get_diary(user_id: str, user: dict = Depends(current_user)):
    require_self_or_admin(user, user_id)
    return await database.get_diary(user_id)

@community_router.post("/diary")
async def create_diary(data: dict, user: dict = Depends(current_user)):
    require_self_or_admin(user, data.get("userId") or "")
    return await database.create_diary_entry(data)


# -- Street / Ward Score -------------------------------------------------------
@community_router.get("/street-score/{ward}")
async def street_score(ward: str, _user: dict = Depends(current_user)):
    return await database.get_street_score(ward)


# -- Karma ---------------------------------------------------------------------
@karma_router.get("/{user_id}")
async def get_karma(user_id: str, _user: dict = Depends(current_user)):
    return await database.get_karma(user_id)

@karma_router.post("/{user_id}/add")
async def add_karma(user_id: str, action: str = Query(...),
                    points: Optional[int] = Query(None),
                    description: Optional[str] = Query(None),
                    user: dict = Depends(current_user)):
    require_self_or_admin(user, user_id)
    return await database.add_karma(user_id, action, points, description)

@karma_router.get("/leaderboard/city")
async def city_leaderboard(limit: int = Query(20, le=100), _user: dict = Depends(current_user)):
    return await database.get_city_leaderboard(limit)

@karma_router.get("/leaderboard/ward/{ward}")
async def ward_leaderboard(ward: str, _user: dict = Depends(current_user)):
    return await database.get_ward_leaderboard(ward)
