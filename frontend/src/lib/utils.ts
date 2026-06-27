import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { AQICategory, AQIData, PollutionType, SeverityLevel } from '@/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// ─── AQI Helpers ──────────────────────────────────────────────────────────────
export function getAQICategory(value: number): AQICategory {
  if (value <= 50) return 'Good'
  if (value <= 100) return 'Moderate'
  if (value <= 150) return 'Sensitive'
  if (value <= 200) return 'Unhealthy'
  if (value <= 300) return 'Very Unhealthy'
  return 'Hazardous'
}

export function getAQIColor(value: number): string {
  if (value <= 50) return '#00C853'
  if (value <= 100) return '#FFD600'
  if (value <= 150) return '#FF9100'
  if (value <= 200) return '#FF3D00'
  if (value <= 300) return '#7B1FA2'
  return '#4E0000'
}

export function getAQIData(value: number): AQIData {
  return {
    value,
    category: getAQICategory(value),
    color: getAQIColor(value),
  }
}

// ─── Pollution Type Helpers ────────────────────────────────────────────────────
export const POLLUTION_LABELS: Record<PollutionType, string> = {
  garbage_fire: 'Garbage Fire',
  smoke: 'Smoke / Haze',
  construction_dust: 'Construction Dust',
  industrial: 'Industrial Pollution',
  vehicle: 'Vehicle Emission',
  burning_waste: 'Burning Waste',
  unknown: 'Unknown',
}

export const POLLUTION_ICONS: Record<PollutionType, string> = {
  garbage_fire: '🔥',
  smoke: '💨',
  construction_dust: '🏗️',
  industrial: '🏭',
  vehicle: '🚗',
  burning_waste: '♻️',
  unknown: '❓',
}

export const POLLUTION_COLORS: Record<PollutionType, string> = {
  garbage_fire: '#FF3D00',
  smoke: '#607D8B',
  construction_dust: '#FF9100',
  industrial: '#7B1FA2',
  vehicle: '#1565C0',
  burning_waste: '#BF360C',
  unknown: '#757575',
}

// ─── Severity Helpers ──────────────────────────────────────────────────────────
export const SEVERITY_LABELS: Record<SeverityLevel, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
}

export const SEVERITY_WEIGHTS: Record<SeverityLevel, number> = {
  low: 0.3,
  medium: 0.6,
  high: 1.0,
}

// ─── Date Helpers ──────────────────────────────────────────────────────────────
export function formatRelativeTime(date: Date): string {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return 'Just now'
  if (diffMins < 60) return `${diffMins}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return date.toLocaleDateString('en-IN')
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

// ─── Location Helpers ──────────────────────────────────────────────────────────
export function getCurrentLocation(): Promise<GeolocationPosition> {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation not supported'))
      return
    }
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    })
  })
}

export async function reverseGeocode(
  lat: number,
  lng: number,
  apiKey: string
): Promise<{ address: string; ward: string; district: string }> {
  try {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${apiKey}`
    )
    const data = await res.json()
    if (data.results?.[0]) {
      const result = data.results[0]
      const components = result.address_components || []

      const getComponent = (type: string) =>
        components.find((c: { types: string[]; long_name: string }) => c.types.includes(type))?.long_name || ''

      return {
        address: result.formatted_address,
        ward: getComponent('sublocality_level_1') || getComponent('sublocality'),
        district: getComponent('administrative_area_level_2') || getComponent('locality'),
      }
    }
  } catch (e) {
    console.error('Geocoding error', e)
  }
  return { address: `${lat.toFixed(4)}, ${lng.toFixed(4)}`, ward: 'Unknown', district: 'Unknown' }
}

// ─── File Helpers ──────────────────────────────────────────────────────────────
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`
}

// ─── Mock data generators ──────────────────────────────────────────────────────
export function generateId(): string {
  return Math.random().toString(36).slice(2, 11)
}
