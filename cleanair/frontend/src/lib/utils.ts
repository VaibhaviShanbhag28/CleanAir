import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getAQIColor(aqi: number): string {
  if (aqi <= 50) return '#00C853';
  if (aqi <= 100) return '#FFD600';
  if (aqi <= 150) return '#FF9100';
  if (aqi <= 200) return '#FF3D00';
  if (aqi <= 300) return '#7B1FA2';
  return '#4E0000';
}

export function getAQILabel(aqi: number): string {
  if (aqi <= 50) return 'Good';
  if (aqi <= 100) return 'Moderate';
  if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
  if (aqi <= 200) return 'Unhealthy';
  if (aqi <= 300) return 'Very Unhealthy';
  return 'Hazardous';
}

export function getSeverityColor(severity: string): string {
  if (severity === 'high') return 'text-red-500 bg-red-50';
  if (severity === 'medium') return 'text-orange-500 bg-orange-50';
  return 'text-green-600 bg-green-50';
}

export function getStatusColor(status: string): string {
  if (status === 'resolved') return 'text-green-600 bg-green-50 border-green-200';
  if (status === 'in_progress') return 'text-blue-600 bg-blue-50 border-blue-200';
  if (status === 'acknowledged') return 'text-yellow-600 bg-yellow-50 border-yellow-200';
  if (status === 'flagged') return 'text-purple-600 bg-purple-50 border-purple-200';
  return 'text-gray-600 bg-gray-50 border-gray-200';
}

export function getPollutionIcon(type: string): string {
  const icons: Record<string, string> = {
    garbage_fire: '🔥', smoke: '💨', construction_dust: '🏗️',
    industrial: '🏭', vehicle: '🚗', burning_waste: '♻️',
    water_pollution: '💧', noise_pollution: '🔊', chemical_dumping: '⚗️',
    illegal_dumping: '🗑️', tree_cutting: '🌳', sewage_leakage: '🚧',
    unknown: '⚠️',
  };
  return icons[type] || '⚠️';
}

export function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export function imageToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const BENGALURU_WARDS = [
  'Koramangala', 'Indiranagar', 'Whitefield', 'Hebbal',
  'Jayanagar', 'Banashankari', 'HSR Layout', 'Marathahalli',
  'Electronic City', 'Yelahanka', 'BTM Layout', 'JP Nagar',
  'Rajajinagar', 'Malleshwaram', 'Basavanagudi', 'Shivajinagar',
  'MG Road', 'Vijayanagar', 'RT Nagar', 'Ulsoor',
];

export const POLLUTION_TYPES = [
  { value: 'garbage_fire', label: 'Garbage Fire', icon: '🔥' },
  { value: 'smoke', label: 'Smoke / Haze', icon: '💨' },
  { value: 'construction_dust', label: 'Construction Dust', icon: '🏗️' },
  { value: 'industrial', label: 'Industrial Emission', icon: '🏭' },
  { value: 'vehicle', label: 'Vehicle Emission', icon: '🚗' },
  { value: 'burning_waste', label: 'Burning Waste', icon: '♻️' },
  { value: 'water_pollution', label: 'Water Pollution', icon: '💧' },
  { value: 'illegal_dumping', label: 'Illegal Dumping', icon: '🗑️' },
  { value: 'sewage_leakage', label: 'Sewage Leakage', icon: '🚧' },
  { value: 'tree_cutting', label: 'Tree Cutting', icon: '🌳' },
  { value: 'noise_pollution', label: 'Noise Pollution', icon: '🔊' },
  { value: 'chemical_dumping', label: 'Chemical Dumping', icon: '⚗️' },
  { value: 'unknown', label: 'Other', icon: '⚠️' },
];
