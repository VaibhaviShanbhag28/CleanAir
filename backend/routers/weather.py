from fastapi import APIRouter, Query
from services import weather_service

router = APIRouter(prefix="/weather", tags=["weather"])


@router.get("/current")
async def current_weather(
    lat: float = Query(12.9716, description="Latitude"),
    lng: float = Query(77.5946, description="Longitude"),
):
    return await weather_service.get_weather_and_aqi(lat, lng)


@router.get("/predict")
async def predict_aqi(
    lat: float = Query(12.9716),
    lng: float = Query(77.5946),
):
    return await weather_service.predict_aqi_24h(lat, lng)
