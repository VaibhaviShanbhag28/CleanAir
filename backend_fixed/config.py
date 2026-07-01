from pydantic_settings import BaseSettings
from typing import Optional
import os


class Settings(BaseSettings):
    # App
    APP_NAME: str = "CleanAir API"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = True
    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://cleanair-app.web.app",
        "https://cleanair-app.firebaseapp.com",
    ]

    # Firebase
    FIREBASE_PROJECT_ID: Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_KEY: Optional[str] = None  # JSON string or path

    # Google / Gemini
    GEMINI_API_KEY: Optional[str] = None
    GOOGLE_MAPS_KEY: Optional[str] = None

    # OpenWeather
    OPENWEATHER_API_KEY: Optional[str] = None

    # Cloudinary (image uploads)
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY: Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # JWT (for non-Firebase token exchange)
    SECRET_KEY: str = "changeme-in-production"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


settings = Settings()
