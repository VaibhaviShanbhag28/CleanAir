import type { Report, AQIPrediction, Analytics, AIAnalysis, Notification } from '@/types'

const BASE = import.meta.env.VITE_API_URL || '/api'

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const token = localStorage.getItem('cleanair_token')
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    },
    ...options,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Network error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

// ─── Reports ──────────────────────────────────────────────────────────────────
export const reportsApi = {
  list: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<Report[]>(`/reports${qs}`)
  },
  get: (id: string) => request<Report>(`/reports/${id}`),
  create: (data: Record<string, unknown>) =>
    request<Report>('/reports', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  update: (id: string, data: Partial<Report>) =>
    request<Report>(`/reports/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    }),
  resolve: (id: string, note: string, imageUrl?: string) =>
    request<Report>(`/reports/${id}/resolve`, {
      method: 'POST',
      body: JSON.stringify({ note, resolved_image_url: imageUrl }),
    }),
  upvote: (id: string) => request<{ upvotes: number }>(`/reports/${id}/upvote`, { method: 'POST' }),
  heatmap: (params?: Record<string, string>) => {
    const qs = params ? '?' + new URLSearchParams(params).toString() : ''
    return request<Array<{ lat: number; lng: number; weight: number }>>(`/reports/heatmap${qs}`)
  },
}

// ─── AI Analysis ──────────────────────────────────────────────────────────────
export const aiApi = {
  analyzeImage: (imageBase64: string, mimeType = 'image/jpeg') =>
    request<AIAnalysis>('/ai/analyze', {
      method: 'POST',
      body: JSON.stringify({ image: imageBase64, mime_type: mimeType }),
    }),
  generateReport: (reportId: string) =>
    request<{ report: string; html: string }>(`/ai/generate-report/${reportId}`),
  healthAdvisory: (aqi: number, lat: number, lng: number) =>
    request<{ advisory: string; actions: string[] }>('/ai/health-advisory', {
      method: 'POST',
      body: JSON.stringify({ aqi, lat, lng }),
    }),
}

// ─── AQI Prediction ───────────────────────────────────────────────────────────
export const weatherApi = {
  current: (lat: number, lng: number) =>
    request<{ weather: unknown; aqi: number }>(`/weather/current?lat=${lat}&lng=${lng}`),
  predict: (lat: number, lng: number) =>
    request<AQIPrediction[]>(`/weather/predict?lat=${lat}&lng=${lng}`),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  overview: () => request<Analytics>('/analytics/overview'),
  ward: (ward: string) => request<Analytics>(`/analytics/ward/${ward}`),
}

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  verifyToken: (idToken: string) =>
    request<{ uid: string; email: string | null; access_token: string }>('/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ id_token: idToken }),
    }),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: () => request<Notification[]>('/notifications'),
  markRead: (id: string) => request<void>(`/notifications/${id}/read`, { method: 'POST' }),
}
