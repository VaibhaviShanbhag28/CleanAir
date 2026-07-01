"""
CleanAir Backend — FastAPI Application
Pollution hotspot detection and reporting system for Indian cities.
"""
import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from contextlib import asynccontextmanager
from dotenv import load_dotenv

load_dotenv()

from config import settings
from services.database import init_firebase
from routers.reports import router as reports_router
from routers.ai_router import router as ai_router
from routers.weather import router as weather_router
from routers.analytics import analytics_router, auth_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    print(f"🌿 Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_firebase(
        project_id=settings.FIREBASE_PROJECT_ID,
        service_account_key=settings.FIREBASE_SERVICE_ACCOUNT_KEY,
    )
    if not settings.GEMINI_API_KEY:
        print("⚠️  GEMINI_API_KEY not set — using mock AI responses")
    if not settings.OPENWEATHER_API_KEY:
        print("⚠️  OPENWEATHER_API_KEY not set — using synthetic weather")
    print("✅ CleanAir API ready")
    yield
    # Shutdown
    print("👋 CleanAir API shutting down")


app = FastAPI(
    title="CleanAir API",
    description="Pollution hotspot detection and reporting API for Indian cities. Built for Hack2Skill 2024.",
    version="1.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

# ── Middleware ─────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# ── Routers ────────────────────────────────────────────────────────────────────
app.include_router(reports_router, prefix="/api")
app.include_router(ai_router, prefix="/api")
app.include_router(weather_router, prefix="/api")
app.include_router(analytics_router, prefix="/api")
app.include_router(auth_router, prefix="/api")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/api/health", tags=["system"])
async def health_check():
    return {
        "status": "healthy",
        "version": settings.APP_VERSION,
        "services": {
            "firebase": bool(settings.FIREBASE_PROJECT_ID),
            "gemini": bool(settings.GEMINI_API_KEY),
            "openweather": bool(settings.OPENWEATHER_API_KEY),
            "maps": bool(settings.GOOGLE_MAPS_KEY),
        },
    }


@app.get("/", tags=["system"])
async def root():
    return {
        "name": "CleanAir API",
        "version": "1.0.0",
        "docs": "/api/docs",
        "health": "/api/health",
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info",
    )
