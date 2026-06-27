// ─── User Types ───────────────────────────────────────────────────────────────
export interface User {
  uid: string
  email: string | null
  displayName: string | null
  photoURL: string | null
  role: 'citizen' | 'authority' | 'admin'
  ward?: string
  district?: string
  createdAt: Date
}

// ─── Report Types ─────────────────────────────────────────────────────────────
export type PollutionType =
  | 'garbage_fire'
  | 'smoke'
  | 'construction_dust'
  | 'industrial'
  | 'vehicle'
  | 'burning_waste'
  | 'unknown'

export type SeverityLevel = 'low' | 'medium' | 'high'

export type ReportStatus = 'pending' | 'acknowledged' | 'in_progress' | 'resolved'

export interface GeoLocation {
  lat: number
  lng: number
  address?: string
  ward?: string
  district?: string
}

export interface AIAnalysis {
  pollutionType: PollutionType
  confidence: number
  smokeDetected: boolean
  dustDetected: boolean
  fireDetected: boolean
  possibleSource: string
  estimatedSeverity: SeverityLevel
  healthRisk: 'low' | 'moderate' | 'high' | 'severe'
  recommendedAction: string
  estimatedAQI: number
  summary: string
  analyzedAt: Date
}

export interface Report {
  id: string
  userId: string | null // null for anonymous
  userDisplayName: string | null
  isAnonymous: boolean

  // Location
  location: GeoLocation

  // Content
  pollutionType: PollutionType
  severity: SeverityLevel
  description: string
  imageUrl?: string
  videoUrl?: string
  voiceUrl?: string

  // AI Analysis
  aiAnalysis?: AIAnalysis

  // Status
  status: ReportStatus
  assignedTo?: string
  resolvedAt?: Date
  resolvedImageUrl?: string
  resolutionNote?: string

  // Metadata
  deviceInfo?: string
  createdAt: Date
  updatedAt: Date

  // Derived
  upvotes: number
}

// ─── Heatmap Types ────────────────────────────────────────────────────────────
export interface HeatmapPoint {
  lat: number
  lng: number
  weight: number
}

export type TimeFilter = 'last_hour' | 'today' | 'this_week' | 'this_month'
export type PollutionFilter = PollutionType | 'all'
export type SeverityFilter = SeverityLevel | 'all'

export interface MapFilters {
  time: TimeFilter
  pollutionType: PollutionFilter
  severity: SeverityFilter
  ward?: string
}

// ─── AQI Types ────────────────────────────────────────────────────────────────
export type AQICategory =
  | 'Good'
  | 'Moderate'
  | 'Sensitive'
  | 'Unhealthy'
  | 'Very Unhealthy'
  | 'Hazardous'

export interface AQIData {
  value: number
  category: AQICategory
  color: string
  pm25?: number
  pm10?: number
  no2?: number
  so2?: number
  co?: number
  o3?: number
}

export interface WeatherData {
  temperature: number
  humidity: number
  windSpeed: number
  windDirection: number
  description: string
  icon: string
  pressure: number
  visibility: number
}

export interface AQIPrediction {
  hour: number
  timestamp: Date
  predictedAQI: number
  confidence: number
  factors: {
    weather: number
    historical: number
    current: number
  }
}

// ─── Analytics Types ──────────────────────────────────────────────────────────
export interface Analytics {
  totalReports: number
  resolvedReports: number
  pendingReports: number
  avgResponseTimeHours: number
  estimatedPeopleAffected: number
  mostPollutedArea: string
  mostImprovedArea: string
  topPollutionType: PollutionType
  reductionPercent: number
  monthlyStats: MonthlyStats[]
}

export interface MonthlyStats {
  month: string
  reports: number
  resolved: number
  avgAQI: number
}

// ─── Notification Types ───────────────────────────────────────────────────────
export interface Notification {
  id: string
  type: 'severe_pollution' | 'report_resolved' | 'authority_alert' | 'system'
  title: string
  message: string
  reportId?: string
  read: boolean
  createdAt: Date
}

// ─── UI State Types ───────────────────────────────────────────────────────────
export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

export type Language = 'en' | 'hi' | 'kn'
export type Theme = 'light' | 'dark' | 'system'
