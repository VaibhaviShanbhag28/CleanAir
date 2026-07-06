import { auth } from '@/lib/firebase';
import type { Municipality, OnboardPayload, User } from '@/types';

const BASE = import.meta.env.VITE_API_URL || '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }
  return res.json();
}

/** Authenticated request — attaches the current Firebase ID token. */
async function authedReq<T>(path: string, options?: RequestInit): Promise<T> {
  const token = await auth.currentUser?.getIdToken();
  if (!token) throw { detail: 'Not signed in' };
  return req<T>(path, {
    ...options,
    headers: { Authorization: `Bearer ${token}`, ...options?.headers },
  });
}

// ── Reports ──────────────────────────────────────────────────────────────────
export const api = {
  auth: {
    me: () => authedReq<User & { onboarded: boolean }>('/auth/me'),
    onboard: (payload: OnboardPayload) =>
      authedReq<{ onboarded: boolean; role: string }>(
        '/auth/onboard', { method: 'POST', body: JSON.stringify(payload) }),
    municipalities: () => authedReq<Municipality[]>('/municipalities'),
    adminEligible: () => authedReq<{ eligible: boolean }>('/auth/admin-eligible'),
  },

  reports: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return authedReq<unknown[]>(`/reports${q}`);
    },
    get: (id: string) => authedReq<unknown>(`/reports/${id}`),
    create: (data: unknown) => authedReq<unknown>('/reports', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => authedReq<unknown>(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    resolve: (id: string, note: string, imageUrl?: string) =>
      authedReq<unknown>(`/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ note, resolved_image_url: imageUrl }) }),
    upvote: (id: string) => authedReq<unknown>(`/reports/${id}/upvote`, { method: 'POST' }),
    acknowledge: (id: string, assignedTo?: string) =>
      authedReq<unknown>(`/reports/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ assigned_to: assignedTo }) }),
    heatmap: (timeFilter = 'today') => authedReq<unknown[]>(`/reports/heatmap?time_filter=${timeFilter}`),
    flagged: () => authedReq<unknown[]>('/reports/flagged'),
  },

  ai: {
    analyze: (image: string, mimeType: string, pollutionType: string, description: string, hasGps: boolean) =>
      authedReq<unknown>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ image, mime_type: mimeType, pollution_type: pollutionType, description, has_gps: hasGps }),
      }),
    chat: (messages: {role:string;content:string}[], userLocation?: string, context?: string) =>
      authedReq<{reply:string;timestamp:string}>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, userLocation, context }),
      }),
    notice: (noticeType: string, topic: string, ward?: string, details?: string, language = 'english') =>
      authedReq<unknown>('/ai/notice', {
        method: 'POST',
        body: JSON.stringify({ noticeType, topic, ward, details, language }),
      }),
    horoscope: (aqi: number) => authedReq<unknown>(`/ai/horoscope?aqi=${aqi}`),
    advisory: (aqi: number) => authedReq<unknown>(`/ai/advisory?aqi=${aqi}`),
    report: (report: unknown) => authedReq<unknown>('/ai/report', { method: 'POST', body: JSON.stringify(report) }),
    verifyCleanup: (beforeImageBase64: string, afterImageBase64: string) =>
      authedReq<unknown>('/ai/cleanup/verify', {
        method: 'POST',
        body: JSON.stringify({ beforeImageBase64, afterImageBase64 }),
      }),
    classifyWaste: (imageBase64: string) =>
      authedReq<unknown>('/ai/waste/classify', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
    carbon: (data: unknown) => authedReq<unknown>('/ai/carbon', { method: 'POST', body: JSON.stringify(data) }),
    diarySummary: (entries: unknown[]) =>
      authedReq<unknown>('/ai/diary/summary', { method: 'POST', body: JSON.stringify({ entries }) }),
    insights: (analytics: unknown) =>
      authedReq<unknown>('/ai/insights', { method: 'POST', body: JSON.stringify(analytics) }),
    seasonal: (month: number) => authedReq<unknown>(`/ai/seasonal/${month}`),
  },

  weather: {
    current: (lat = 12.9716, lng = 77.5946) => authedReq<unknown>(`/weather/current?lat=${lat}&lng=${lng}`),
    predict: (lat = 12.9716, lng = 77.5946) => authedReq<unknown[]>(`/weather/predict?lat=${lat}&lng=${lng}`),
  },

  analytics: {
    overview: () => authedReq<unknown>('/analytics/overview'),
    ward: (ward: string) => authedReq<unknown>(`/analytics/ward/${ward}`),
    ranking: () => authedReq<unknown[]>('/analytics/wards/ranking'),
    aiInsights: () => authedReq<unknown>('/analytics/ai-insights'),
  },

  karma: {
    get: (userId: string) => authedReq<unknown>(`/karma/${userId}`),
    add: (userId: string, action: string, points?: number, description?: string) =>
      authedReq<unknown>(`/karma/${userId}/add?action=${action}${points ? `&points=${points}` : ''}${description ? `&description=${encodeURIComponent(description)}` : ''}`, { method: 'POST' }),
    cityLeaderboard: (limit = 20) => authedReq<unknown[]>(`/karma/leaderboard/city?limit=${limit}`),
    wardLeaderboard: (ward: string) => authedReq<unknown[]>(`/karma/leaderboard/ward/${encodeURIComponent(ward)}`),
  },

  community: {
    events: () => authedReq<unknown[]>('/community/events'),
    createEvent: (data: unknown) => authedReq<unknown>('/community/events', { method: 'POST', body: JSON.stringify(data) }),
    joinEvent: (id: string, userId: string) =>
      authedReq<unknown>(`/community/events/${id}/join?user_id=${userId}`, { method: 'POST' }),
    challenges: (status?: string) => authedReq<unknown[]>(`/community/challenges${status ? `?status=${status}` : ''}`),
    createChallenge: (data: unknown) =>
      authedReq<unknown>('/community/challenges', { method: 'POST', body: JSON.stringify(data) }),
    voteChallenge: (id: string) =>
      authedReq<unknown>(`/community/challenges/${id}/vote`, { method: 'POST' }),
    diary: (userId: string) => authedReq<unknown[]>(`/community/diary/${userId}`),
    createDiary: (data: unknown) =>
      authedReq<unknown>('/community/diary', { method: 'POST', body: JSON.stringify(data) }),
    tips: () => authedReq<unknown[]>('/community/tips'),
    submitTip: (data: unknown) =>
      authedReq<unknown>('/community/tips', { method: 'POST', body: JSON.stringify(data) }),
    streetScore: (ward: string) => authedReq<unknown>(`/community/street-score/${encodeURIComponent(ward)}`),
  },

  notifications: {
    get: (userId: string) => authedReq<unknown[]>(`/notifications/${userId}`),
  },

  health: () => req<unknown>('/health'),
};
