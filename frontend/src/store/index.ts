import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Report, Notification, Language, Theme, MapFilters } from '@/types'

interface AppState {
  // Auth
  user: User | null
  setUser: (user: User | null) => void

  // Theme & Language
  theme: Theme
  setTheme: (theme: Theme) => void
  language: Language
  setLanguage: (lang: Language) => void
  highContrast: boolean
  setHighContrast: (v: boolean) => void
  largeText: boolean
  setLargeText: (v: boolean) => void

  // Reports
  reports: Report[]
  setReports: (reports: Report[]) => void
  addReport: (report: Report) => void
  updateReport: (id: string, partial: Partial<Report>) => void

  // Map Filters
  mapFilters: MapFilters
  setMapFilters: (filters: Partial<MapFilters>) => void

  // Notifications
  notifications: Notification[]
  addNotification: (n: Notification) => void
  markNotificationRead: (id: string) => void
  clearNotifications: () => void

  // UI State
  sidebarOpen: boolean
  setSidebarOpen: (open: boolean) => void
  offlineDrafts: Partial<Report>[]
  addOfflineDraft: (draft: Partial<Report>) => void
  removeOfflineDraft: (index: number) => void
}

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      // Auth
      user: null,
      setUser: (user) => set({ user }),

      // Theme & Language
      theme: 'system',
      setTheme: (theme) => set({ theme }),
      language: 'en',
      setLanguage: (language) => set({ language }),
      highContrast: false,
      setHighContrast: (highContrast) => set({ highContrast }),
      largeText: false,
      setLargeText: (largeText) => set({ largeText }),

      // Reports
      reports: [],
      setReports: (reports) => set({ reports }),
      addReport: (report) => set((s) => ({ reports: [report, ...s.reports] })),
      updateReport: (id, partial) =>
        set((s) => ({
          reports: s.reports.map((r) => (r.id === id ? { ...r, ...partial } : r)),
        })),

      // Map Filters
      mapFilters: {
        time: 'today',
        pollutionType: 'all',
        severity: 'all',
      },
      setMapFilters: (filters) =>
        set((s) => ({ mapFilters: { ...s.mapFilters, ...filters } })),

      // Notifications
      notifications: [],
      addNotification: (n) =>
        set((s) => ({ notifications: [n, ...s.notifications].slice(0, 50) })),
      markNotificationRead: (id) =>
        set((s) => ({
          notifications: s.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        })),
      clearNotifications: () => set({ notifications: [] }),

      // UI
      sidebarOpen: false,
      setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
      offlineDrafts: [],
      addOfflineDraft: (draft) =>
        set((s) => ({ offlineDrafts: [...s.offlineDrafts, draft] })),
      removeOfflineDraft: (index) =>
        set((s) => ({ offlineDrafts: s.offlineDrafts.filter((_, i) => i !== index) })),
    }),
    {
      name: 'cleanair-store',
      partialize: (s) => ({
        theme: s.theme,
        language: s.language,
        highContrast: s.highContrast,
        largeText: s.largeText,
        offlineDrafts: s.offlineDrafts,
      }),
    }
  )
)
