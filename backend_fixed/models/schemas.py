from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime
from enum import Enum


class PollutionType(str, Enum):
    garbage_fire = "garbage_fire"
    smoke = "smoke"
    construction_dust = "construction_dust"
    industrial = "industrial"
    vehicle = "vehicle"
    burning_waste = "burning_waste"
    unknown = "unknown"


class SeverityLevel(str, Enum):
    low = "low"
    medium = "medium"
    high = "high"


class ReportStatus(str, Enum):
    pending = "pending"
    acknowledged = "acknowledged"
    in_progress = "in_progress"
    resolved = "resolved"


class GeoLocation(BaseModel):
    lat: float
    lng: float
    address: Optional[str] = None
    ward: Optional[str] = None
    district: Optional[str] = None


class AIAnalysis(BaseModel):
    pollutionType: PollutionType
    confidence: float
    smokeDetected: bool
    dustDetected: bool
    fireDetected: bool
    possibleSource: str
    estimatedSeverity: SeverityLevel
    healthRisk: Literal["low", "moderate", "high", "severe"]
    recommendedAction: str
    estimatedAQI: int
    summary: str
    analyzedAt: datetime = Field(default_factory=datetime.utcnow)


class ReportCreate(BaseModel):
    userId: Optional[str] = None
    userDisplayName: Optional[str] = None
    isAnonymous: bool = False
    location: GeoLocation
    pollutionType: PollutionType
    severity: SeverityLevel
    description: str
    imageUrl: Optional[str] = None
    videoUrl: Optional[str] = None
    voiceUrl: Optional[str] = None
    aiAnalysis: Optional[AIAnalysis] = None


class ReportUpdate(BaseModel):
    status: Optional[ReportStatus] = None
    assignedTo: Optional[str] = None
    resolutionNote: Optional[str] = None
    resolvedImageUrl: Optional[str] = None


class Report(ReportCreate):
    id: str
    status: ReportStatus = ReportStatus.pending
    upvotes: int = 0
    assignedTo: Optional[str] = None
    resolvedAt: Optional[datetime] = None
    resolutionNote: Optional[str] = None
    resolvedImageUrl: Optional[str] = None
    createdAt: datetime = Field(default_factory=datetime.utcnow)
    updatedAt: datetime = Field(default_factory=datetime.utcnow)


class ResolveRequest(BaseModel):
    note: str
    resolved_image_url: Optional[str] = None


class ImageAnalysisRequest(BaseModel):
    image: str  # base64
    mime_type: str = "image/jpeg"


class HealthAdvisoryRequest(BaseModel):
    aqi: int
    lat: float
    lng: float


class AuthorityReportRequest(BaseModel):
    report_id: str


class AnalyticsOverview(BaseModel):
    totalReports: int
    resolvedReports: int
    pendingReports: int
    avgResponseTimeHours: float
    estimatedPeopleAffected: int
    mostPollutedArea: str
    mostImprovedArea: str
    topPollutionType: str
    reductionPercent: int
    monthlyStats: list[dict]


class HeatmapPoint(BaseModel):
    lat: float
    lng: float
    weight: float


class TokenVerifyRequest(BaseModel):
    id_token: str
