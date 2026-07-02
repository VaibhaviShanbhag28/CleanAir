from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    APP_NAME:    str = "CleanAir API"
    APP_VERSION: str = "2.0.0"
    DEBUG:       bool = True

    CORS_ORIGINS: list[str] = [
        "http://localhost:5173",
        "http://localhost:4173",
        "https://cleanair-app-build.web.app",
        "https://cleanair-app-build.firebaseapp.com",
    ]

    # Firebase
    FIREBASE_PROJECT_ID:          Optional[str] = None
    FIREBASE_SERVICE_ACCOUNT_KEY: Optional[str] = None

    # AI - OpenRouter (preferred) or raw Gemini key as fallback
    OPENROUTER_API_KEY: Optional[str] = None
    GEMINI_API_KEY:     Optional[str] = None   # used as fallback key

    # Maps / Weather
    GOOGLE_MAPS_KEY:       Optional[str] = None
    OPENWEATHER_API_KEY:   Optional[str] = None

    # Cloudinary
    CLOUDINARY_CLOUD_NAME: Optional[str] = None
    CLOUDINARY_API_KEY:    Optional[str] = None
    CLOUDINARY_API_SECRET: Optional[str] = None

    # Security
    SECRET_KEY:                 str = "cleanair-secret-change-in-prod"
    ALGORITHM:                  str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "ignore"


settings = Settings()
