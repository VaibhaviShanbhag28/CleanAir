const BASE = import.meta.env.VITE_API_URL || '/api';

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw err;
  }
  return res.json();
}

// ── Reports ──────────────────────────────────────────────────────────────────
export const api = {
  reports: {
    list: (params?: Record<string, string>) => {
      const q = params ? '?' + new URLSearchParams(params).toString() : '';
      return req<unknown[]>(`/reports${q}`);
    },
    get: (id: string) => req<unknown>(`/reports/${id}`),
    create: (data: unknown) => req<unknown>('/reports', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: unknown) => req<unknown>(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    resolve: (id: string, note: string, imageUrl?: string) =>
      req<unknown>(`/reports/${id}/resolve`, { method: 'POST', body: JSON.stringify({ note, resolved_image_url: imageUrl }) }),
    upvote: (id: string) => req<unknown>(`/reports/${id}/upvote`, { method: 'POST' }),
    acknowledge: (id: string, assignedTo?: string) =>
      req<unknown>(`/reports/${id}/acknowledge`, { method: 'POST', body: JSON.stringify({ assigned_to: assignedTo }) }),
    heatmap: (timeFilter = 'today') => req<unknown[]>(`/reports/heatmap?time_filter=${timeFilter}`),
    flagged: () => req<unknown[]>('/reports/flagged'),
  },

  ai: {
    analyze: (image: string, mimeType: string, pollutionType: string, description: string, hasGps: boolean) =>
      req<unknown>('/ai/analyze', {
        method: 'POST',
        body: JSON.stringify({ image, mime_type: mimeType, pollution_type: pollutionType, description, has_gps: hasGps }),
      }),
    chat: (messages: {role:string;content:string}[], userLocation?: string, context?: string) =>
      req<{reply:string;timestamp:string}>('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ messages, userLocation, context }),
      }),
    notice: (noticeType: string, topic: string, ward?: string, details?: string, language = 'english') =>
      req<unknown>('/ai/notice', {
        method: 'POST',
        body: JSON.stringify({ noticeType, topic, ward, details, language }),
      }),
    horoscope: (aqi: number) => req<unknown>(`/ai/horoscope?aqi=${aqi}`),
    advisory: (aqi: number) => req<unknown>(`/ai/advisory?aqi=${aqi}`),
    report: (report: unknown) => req<unknown>('/ai/report', { method: 'POST', body: JSON.stringify(report) }),
    verifyCleanup: (beforeImageBase64: string, afterImageBase64: string) =>
      req<unknown>('/ai/cleanup/verify', {
        method: 'POST',
        body: JSON.stringify({ beforeImageBase64, afterImageBase64 }),
      }),
    classifyWaste: (imageBase64: string) =>
      req<unknown>('/ai/waste/classify', { method: 'POST', body: JSON.stringify({ imageBase64 }) }),
    carbon: (data: unknown) => req<unknown>('/ai/carbon', { method: 'POST', body: JSON.stringify(data) }),
    diarySummary: (entries: unknown[]) =>
      req<unknown>('/ai/diary/summary', { method: 'POST', body: JSON.stringify({ entries }) }),
    insights: (analytics: unknown) =>
      req<unknown>('/ai/insights', { method: 'POST', body: JSON.stringify(analytics) }),
    seasonal: (month: number) => req<unknown>(`/ai/seasonal/${month}`),
  },

  weather: {
    current: (lat = 12.9716, lng = 77.5946) => req<unknown>(`/weather/current?lat=${lat}&lng=${lng}`),
    predict: (lat = 12.9716, lng = 77.5946) => req<unknown[]>(`/weather/predict?lat=${lat}&lng=${lng}`),
  },

  analytics: {
    overview: () => req<unknown>('/analytics/overview'),
    ward: (ward: string) => req<unknown>(`/analytics/ward/${ward}`),
    ranking: () => req<unknown[]>('/analytics/wards/ranking'),
    aiInsights: () => req<unknown>('/analytics/ai-insights'),
  },

  karma: {
    get: (userId: string) => req<unknown>(`/karma/${userId}`),
    add: (userId: string, action: string, points?: number, description?: string) =>
      req<unknown>(`/karma/${userId}/add?action=${action}${points ? `&points=${points}` : ''}${description ? `&description=${encodeURIComponent(description)}` : ''}`, { method: 'POST' }),
    cityLeaderboard: (limit = 20) => req<unknown[]>(`/karma/leaderboard/city?limit=${limit}`),
    wardLeaderboard: (ward: string) => req<unknown[]>(`/karma/leaderboard/ward/${encodeURIComponent(ward)}`),
  },

  community: {
    events: () => req<unknown[]>('/community/events'),
    createEvent: (data: unknown) => req<unknown>('/community/events', { method: 'POST', body: JSON.stringify(data) }),
    joinEvent: (id: string, userId: string) =>
      req<unknown>(`/community/events/${id}/join?user_id=${userId}`, { method: 'POST' }),
    challenges: (status?: string) => req<unknown[]>(`/community/challenges${status ? `?status=${status}` : ''}`),
    createChallenge: (data: unknown) =>
      req<unknown>('/community/challenges', { method: 'POST', body: JSON.stringify(data) }),
    voteChallenge: (id: string) =>
      req<unknown>(`/community/challenges/${id}/vote`, { method: 'POST' }),
    diary: (userId: string) => req<unknown[]>(`/community/diary/${userId}`),
    createDiary: (data: unknown) =>
      req<unknown>('/community/diary', { method: 'POST', body: JSON.stringify(data) }),
    tips: () => req<unknown[]>('/community/tips'),
    submitTip: (data: unknown) =>
      req<unknown>('/community/tips', { method: 'POST', body: JSON.stringify(data) }),
    streetScore: (ward: string) => req<unknown>(`/community/street-score/${encodeURIComponent(ward)}`),
  },

  notifications: {
    get: (userId: string) => req<unknown[]>(`/notifications/${userId}`),
  },

  health: () => req<unknown>('/health'),
};
