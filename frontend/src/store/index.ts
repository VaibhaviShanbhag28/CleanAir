import { create } from 'zustand';
import { Report, User, AnalyticsOverview, KarmaEntry } from '@/types';

interface AppState {
  user: User | null;
  reports: Report[];
  analytics: AnalyticsOverview | null;
  karma: KarmaEntry | null;
  currentAQI: number;
  darkMode: boolean;
  language: 'en' | 'hi' | 'kn';
  notifications: unknown[];
  sidebarOpen: boolean;

  setUser: (user: User | null) => void;
  setReports: (reports: Report[]) => void;
  setAnalytics: (a: AnalyticsOverview) => void;
  setKarma: (k: KarmaEntry) => void;
  setCurrentAQI: (aqi: number) => void;
  toggleDarkMode: () => void;
  setLanguage: (lang: 'en' | 'hi' | 'kn') => void;
  setNotifications: (n: unknown[]) => void;
  toggleSidebar: () => void;
  addReport: (r: Report) => void;
}

export const useAppStore = create<AppState>((set) => ({
  user: null,
  reports: [],
  analytics: null,
  karma: null,
  currentAQI: 155,
  darkMode: false,
  language: 'en',
  notifications: [],
  sidebarOpen: false,

  setUser: (user) => set({ user }),
  setReports: (reports) => set({ reports }),
  setAnalytics: (analytics) => set({ analytics }),
  setKarma: (karma) => set({ karma }),
  setCurrentAQI: (currentAQI) => set({ currentAQI }),
  toggleDarkMode: () => set((s) => ({ darkMode: !s.darkMode })),
  setLanguage: (language) => set({ language }),
  setNotifications: (notifications) => set({ notifications }),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
  addReport: (r) => set((s) => ({ reports: [r, ...s.reports] })),
}));
