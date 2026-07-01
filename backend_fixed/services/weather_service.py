"""
Weather data and AQI prediction service.
Uses OpenWeatherMap API with fallback to synthetic data.
"""
import math
import random
from datetime import datetime, timedelta
from typing import Optional
import httpx
from config import settings


async def get_current_weather(lat: float, lng: float) -> dict:
    """Fetch current weather from OpenWeatherMap."""
    if settings.OPENWEATHER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/weather",
                    params={
                        "lat": lat,
                        "lon": lng,
                        "appid": settings.OPENWEATHER_API_KEY,
                        "units": "metric",
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    return {
                        "temperature": data["main"]["temp"],
                        "humidity": data["main"]["humidity"],
                        "windSpeed": data["wind"]["speed"] * 3.6,  # m/s to km/h
                        "windDirection": data["wind"].get("deg", 0),
                        "description": data["weather"][0]["description"].title(),
                        "icon": data["weather"][0]["icon"],
                        "pressure": data["main"]["pressure"],
                        "visibility": data.get("visibility", 10000) / 1000,
                    }
        except Exception as e:
            print(f"Weather API error: {e}")

    # Synthetic Bengaluru weather
    hour = datetime.now().hour
    return {
        "temperature": 24 + 6 * math.sin((hour - 6) * math.pi / 12),
        "humidity": 55 + 15 * math.cos((hour - 14) * math.pi / 12),
        "windSpeed": 8 + random.uniform(-3, 5),
        "windDirection": 220,
        "description": "Partly Cloudy",
        "icon": "02d",
        "pressure": 1013,
        "visibility": 8.5,
    }


async def get_current_aqi_openweather(lat: float, lng: float) -> Optional[int]:
    """Get current AQI from OpenWeatherMap Air Pollution API."""
    if settings.OPENWEATHER_API_KEY:
        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(
                    "https://api.openweathermap.org/data/2.5/air_pollution",
                    params={
                        "lat": lat,
                        "lon": lng,
                        "appid": settings.OPENWEATHER_API_KEY,
                    },
                )
                if resp.status_code == 200:
                    data = resp.json()
                    components = data["list"][0]["components"]
                    # Convert to Indian NAQI (National Air Quality Index)
                    pm25 = components.get("pm2_5", 0)
                    pm10 = components.get("pm10", 0)
                    return _pm_to_aqi(pm25, pm10)
        except Exception as e:
            print(f"AQI API error: {e}")
    return None


def _pm_to_aqi(pm25: float, pm10: float) -> int:
    """Convert PM2.5 to AQI using Indian standard breakpoints."""
    # Indian NAQI PM2.5 breakpoints
    breakpoints = [
        (0, 30, 0, 50),
        (30, 60, 51, 100),
        (60, 90, 101, 200),
        (90, 120, 201, 300),
        (120, 250, 301, 400),
        (250, 500, 401, 500),
    ]
    for c_low, c_high, i_low, i_high in breakpoints:
        if c_low <= pm25 <= c_high:
            aqi = ((i_high - i_low) / (c_high - c_low)) * (pm25 - c_low) + i_low
            return round(aqi)
    return 500


async def predict_aqi_24h(lat: float, lng: float) -> list[dict]:
    """
    Predict AQI for the next 24 hours.
    Uses weather data + historical patterns + current AQI.
    
    In production this would use a trained ML model (Vertex AI).
    Here we use a physics-informed heuristic.
    """
    weather = await get_current_weather(lat, lng)
    current_aqi = await get_current_aqi_openweather(lat, lng) or 155

    predictions = []
    base_aqi = current_aqi

    for i in range(24):
        future_hour = (datetime.now() + timedelta(hours=i)).hour
        timestamp = datetime.now() + timedelta(hours=i)

        # Diurnal variation: worse at peak traffic hours (8-10am, 6-8pm)
        traffic_factor = (
            1.3 if 7 <= future_hour <= 10 else
            1.2 if 17 <= future_hour <= 20 else
            0.8 if 0 <= future_hour <= 5 else
            1.0
        )

        # Wind dispersion: higher wind = lower AQI
        wind_factor = max(0.6, 1.0 - (weather["windSpeed"] / 30))

        # Humidity trap: high humidity traps particles
        humidity_factor = 1.0 + (weather["humidity"] - 50) / 200

        # Temperature inversion (morning/evening): traps pollutants
        inversion_factor = 1.15 if (6 <= future_hour <= 9 or 18 <= future_hour <= 22) else 1.0

        predicted = base_aqi * traffic_factor * wind_factor * humidity_factor * inversion_factor
        predicted = max(30, min(500, predicted + random.uniform(-10, 10)))

        confidence = max(0.5, 0.97 - i * 0.018)

        predictions.append({
            "hour": future_hour,
            "timestamp": timestamp.isoformat(),
            "predictedAQI": round(predicted),
            "confidence": round(confidence, 3),
            "factors": {
                "weather": round(wind_factor * humidity_factor, 3),
                "historical": round(traffic_factor, 3),
                "current": round(inversion_factor, 3),
            },
        })

    return predictions


async def get_weather_and_aqi(lat: float, lng: float) -> dict:
    """Combined weather + AQI endpoint."""
    weather = await get_current_weather(lat, lng)
    aqi = await get_current_aqi_openweather(lat, lng) or 155
    return {"weather": weather, "aqi": aqi}
