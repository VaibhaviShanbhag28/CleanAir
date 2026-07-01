export interface GeoLocation {
  lat: number;
  lng: number;
  address?: string;
  ward?: string;
  district?: string;
}

export interface AIAnalysis {
  pollutionType: string;
  confidence: number;
  smokeDetected: boolean;
  dustDetected: boolean;
  fireDetected: boolean;
  possibleSource: string;
  estimatedSeverity: string;
  healthRisk: string;
  recommendedAction: string;
  estimatedAQI: number;
  summary: string;
  immediateSteps?: string[];
  affectedRadius?: string;
  analyzedAt?: string;
}

export interface ValidationResult {
  status: 'genuine' | 'suspicious' | 'fake' | 'no_image' | 'error';
  confidence: number;
  detected_content: string;
  pollution_type_match: boolean;
  should_block: boolean;
  review_flag: boolean;
  reason: string;
}

export interface Report {
  id: string;
  userId?: string;
  userDisplayName?: string;
  isAnonymous: boolean;
  location: GeoLocation;
  pollutionType: string;
  severity: 'low' | 'medium' | 'high';
  description: string;
  imageUrl?: string;
  videoUrl?: string;
  voiceUrl?: string;
  aiAnalysis?: AIAnalysis;
  validation?: ValidationResult;
  status: 'pending' | 'acknowledged' | 'in_progress' | 'resolved' | 'flagged';
  upvotes: number;
  assignedTo?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  resolvedImageUrl?: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export interface KarmaEntry {
  userId: string;
  displayName: string;
  score: number;
  badge: string;
  reportsCount: number;
  resolvedCount: number;
  streak: number;
  ward: string;
  history?: { action: string; points: number; description: string; timestamp: string }[];
  joinedAt: string;
}

export interface CommunityEvent {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  location: string;
  lat?: number;
  lng?: number;
  date: string;
  time: string;
  maxVolunteers: number;
  volunteers: number;
  category: string;
  createdAt: string;
}

export interface DiaryEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  ecoHabits: string[];
  mood: string;
  location?: string;
  imageUrl?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CleanupChallenge {
  id: string;
  userId: string;
  title: string;
  location: string;
  beforeImageBase64?: string;
  afterImageBase64?: string;
  description?: string;
  votes: number;
  status: 'pending' | 'verified' | 'rejected';
  aiResult?: Record<string, unknown>;
  createdAt: string;
}

export interface AnalyticsOverview {
  totalReports: number;
  resolvedReports: number;
  pendingReports: number;
  inProgressReports: number;
  avgResponseTimeHours: number;
  estimatedPeopleAffected: number;
  mostPollutedArea: string;
  mostImprovedArea: string;
  topPollutionType: string;
  reductionPercent: number;
  wardRankings: { ward: string; count: number }[];
  typeDistribution: Record<string, number>;
  monthlyStats: { month: string; reports: number; resolved: number; avgAQI: number }[];
}

export interface WeatherData {
  temperature: number;
  humidity: number;
  windSpeed: number;
  windDirection: number;
  description: string;
  icon: string;
  pressure: number;
  visibility: number;
}

export interface StreetScore {
  ward: string;
  overallScore: number;
  cleanliness: number;
  aqiScore: number;
  wasteCollection: number;
  greenCover: number;
  waterQuality: number;
  citizenParticipation: number;
  totalReports: number;
  resolvedReports: number;
  resolutionRate: number;
  trend: string;
}

export type PollutionType =
  | 'garbage_fire' | 'smoke' | 'construction_dust' | 'industrial'
  | 'vehicle' | 'burning_waste' | 'water_pollution' | 'noise_pollution'
  | 'chemical_dumping' | 'illegal_dumping' | 'tree_cutting' | 'sewage_leakage'
  | 'unknown';

export type UserRole = 'citizen' | 'authority' | 'field_worker' | 'admin';

export interface User {
  uid: string;
  email?: string;
  displayName?: string;
  photoURL?: string;
  role: UserRole;
  ward?: string;
  karmaScore?: number;
}
