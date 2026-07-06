from fastapi import APIRouter, Depends, Query
from services import weather_service
from deps import current_user

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current")
async def current_weather(
    lat: float = Query(12.9716, description="Latitude"),
    lng: float = Query(77.5946, description="Longitude"),
    _user: dict = Depends(current_user),
):
    return await weather_service.get_weather_and_aqi(lat, lng)


@router.get("/predict")
async def predict_aqi(
    lat: float = Query(12.9716),
    lng: float = Query(77.5946),
    _user: dict = Depends(current_user),
):
    return await weather_service.predict_aqi_24h(lat, lng)
