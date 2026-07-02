"""
CleanAir Backend v2 - BBMP Bengaluru Environmental Platform
"""
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
from routers.community_router import community_router, karma_router
from routers.notifications_router import notifications_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    print(f"- Starting {settings.APP_NAME} v{settings.APP_VERSION}")
    init_firebase(
        project_id=settings.FIREBASE_PROJECT_ID,
        service_account_key=settings.FIREBASE_SERVICE_ACCOUNT_KEY,
    )
    key = getattr(settings, "OPENROUTER_API_KEY", None) or settings.GEMINI_API_KEY
    if not key:
        print("--  No AI key found - set OPENROUTER_API_KEY in .env (free at openrouter.ai)")
    else:
        print(f"- AI key loaded ({key[:12]}...)")
    if not settings.OPENWEATHER_API_KEY:
        print("--  OPENWEATHER_API_KEY not set - using synthetic weather data")
    if not settings.GOOGLE_MAPS_KEY:
        print("--  GOOGLE_MAPS_KEY not set - map features limited")
    print("- CleanAir Platform v2 API ready at http://localhost:8000/api/docs")
    yield
    print("- CleanAir API shutting down")


app = FastAPI(
    title="CleanAir API - BBMP Bengaluru",
    description="Environmental monitoring and citizen reporting platform for Bengaluru.",
    version="2.0.0",
    docs_url="/api/docs",
    redoc_url="/api/redoc",
    lifespan=lifespan,
)

app.add_middleware(CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True, allow_methods=["*"], allow_headers=["*"])
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Register all routers
for router in [reports_router, ai_router, weather_router,
               analytics_router, auth_router,
               community_router, karma_router, notifications_router]:
    app.include_router(router, prefix="/api")


@app.get("/api/health", tags=["system"])
async def health():
    key = getattr(settings, "OPENROUTER_API_KEY", None) or settings.GEMINI_API_KEY
    return {
        "status": "healthy", "version": "2.0.0",
        "services": {
            "firebase":     bool(settings.FIREBASE_PROJECT_ID),
            "ai":           bool(key),
            "openweather":  bool(settings.OPENWEATHER_API_KEY),
            "google_maps":  bool(settings.GOOGLE_MAPS_KEY),
            "cloudinary":   bool(settings.CLOUDINARY_CLOUD_NAME),
        },
    }


@app.get("/", tags=["system"])
async def root():
    return {"name": "CleanAir API", "version": "2.0.0", "docs": "/api/docs"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True, log_level="info")
