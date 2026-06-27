import { useEffect, useRef, useState, useCallback } from 'react'
import { Loader } from '@googlemaps/js-api-loader'
import { Filter, Layers, ZoomIn, ZoomOut, Locate } from 'lucide-react'
import type { Report, MapFilters } from '@/types'
import { POLLUTION_COLORS, SEVERITY_WEIGHTS, getCurrentLocation } from '@/lib/utils'
import { useStore } from '@/store'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { DEMO_REPORTS } from '@/lib/mockData'

const MAPS_KEY = import.meta.env.VITE_GOOGLE_MAPS_KEY || ''

// Default center: Bengaluru
const DEFAULT_CENTER = { lat: 12.9716, lng: 77.5946 }

interface HeatmapMapProps {
  reports?: Report[]
  onReportClick?: (report: Report) => void
  className?: string
}

export function HeatmapMap({ reports = DEMO_REPORTS, onReportClick, className }: HeatmapMapProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const googleMapRef = useRef<google.maps.Map | null>(null)
  const heatmapRef = useRef<google.maps.visualization.HeatmapLayer | null>(null)
  const markersRef = useRef<google.maps.Marker[]>([])
  const [loading, setLoading] = useState(true)
  const [mapType, setMapType] = useState<'roadmap' | 'satellite' | 'hybrid'>('roadmap')
  const [showFilters, setShowFilters] = useState(false)
  const { mapFilters, setMapFilters, theme } = useStore()

  const filterReports = useCallback((reps: Report[], filters: MapFilters): Report[] => {
    const now = new Date()
    return reps.filter((r) => {
      // Time filter
      const age = now.getTime() - r.createdAt.getTime()
      if (filters.time === 'last_hour' && age > 3600000) return false
      if (filters.time === 'today' && age > 86400000) return false
      if (filters.time === 'this_week' && age > 604800000) return false

      // Pollution type filter
      if (filters.pollutionType !== 'all' && r.pollutionType !== filters.pollutionType) return false

      // Severity filter
      if (filters.severity !== 'all' && r.severity !== filters.severity) return false

      return true
    })
  }, [])

  const updateMapData = useCallback(
    (map: google.maps.Map, reps: Report[]) => {
      const filtered = filterReports(reps, mapFilters)

      // Clear old markers
      markersRef.current.forEach((m) => m.setMap(null))
      markersRef.current = []

      // Heatmap data
      const heatData = filtered.map((r) => ({
        location: new google.maps.LatLng(r.location.lat, r.location.lng),
        weight: SEVERITY_WEIGHTS[r.severity] * (r.upvotes + 1),
      }))

      if (heatmapRef.current) {
        ;(heatmapRef.current as any).setData(heatData)
      }

      // Custom markers
      filtered.forEach((report) => {
        const color = POLLUTION_COLORS[report.pollutionType]
        const size = report.severity === 'high' ? 14 : report.severity === 'medium' ? 11 : 8

        const marker = new google.maps.Marker({
          position: { lat: report.location.lat, lng: report.location.lng },
          map,
          title: `${report.pollutionType} - ${report.severity}`,
          icon: {
            path: google.maps.SymbolPath.CIRCLE,
            scale: size,
            fillColor: color,
            fillOpacity: 0.85,
            strokeColor: '#fff',
            strokeWeight: 2,
          },
          zIndex: report.severity === 'high' ? 3 : report.severity === 'medium' ? 2 : 1,
        })

        marker.addListener('click', () => onReportClick?.(report))
        markersRef.current.push(marker)
      })
    },
    [mapFilters, filterReports, onReportClick]
  )

  useEffect(() => {
    if (!mapRef.current) return

    const loader = new Loader({
      apiKey: MAPS_KEY,
      version: 'weekly',
      libraries: ['visualization', 'places'],
    })

    loader.load().then((google) => {
      const isDark = theme === 'dark'
      const map = new google.maps.Map(mapRef.current!, {
        center: DEFAULT_CENTER,
        zoom: 12,
        mapTypeId: mapType,
        styles: isDark ? darkMapStyles : [],
        disableDefaultUI: true,
        zoomControl: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: false,
        clickableIcons: false,
      })

      googleMapRef.current = map

      // Heatmap layer
      const heatmap = new (google.maps.visualization as any).HeatmapLayer({
        data: [],
        map,
        radius: 40,
        opacity: 0.7,
        gradient: [
          'rgba(0, 200, 83, 0)',
          'rgba(0, 200, 83, 1)',
          'rgba(255, 214, 0, 1)',
          'rgba(255, 145, 0, 1)',
          'rgba(255, 61, 0, 1)',
          'rgba(123, 31, 162, 1)',
        ],
      })

      heatmapRef.current = heatmap
      updateMapData(map, reports)
      setLoading(false)
    }).catch(() => {
      // Fallback: render a static placeholder when no API key
      setLoading(false)
    })
  }, []) // only run once

  // Re-render markers when filters or reports change
  useEffect(() => {
    if (googleMapRef.current) {
      updateMapData(googleMapRef.current, reports)
    }
  }, [mapFilters, reports, updateMapData])

  const handleLocateMe = async () => {
    try {
      const pos = await getCurrentLocation()
      googleMapRef.current?.panTo({ lat: pos.coords.latitude, lng: pos.coords.longitude })
      googleMapRef.current?.setZoom(14)
    } catch (e) {
      console.error('Location error', e)
    }
  }

  const toggleMapType = () => {
    const types: Array<'roadmap' | 'satellite' | 'hybrid'> = ['roadmap', 'satellite', 'hybrid']
    const next = types[(types.indexOf(mapType) + 1) % types.length]
    setMapType(next)
    googleMapRef.current?.setMapTypeId(next)
  }

  const filteredCount = filterReports(reports, mapFilters).length

  return (
    <div className={cn('relative w-full h-full rounded-xl overflow-hidden', className)}>
      {/* Loading state */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-sm text-muted-foreground">Loading map...</p>
          </div>
        </div>
      )}

      {/* Map container */}
      <div ref={mapRef} className="w-full h-full" />

      {/* No API key fallback */}
      {!MAPS_KEY && !loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-muted/50">
          <div className="text-center p-6 bg-card rounded-xl shadow-lg max-w-sm">
            <Layers className="h-10 w-10 mx-auto mb-3 text-primary" />
            <h3 className="font-semibold mb-1">Map Preview</h3>
            <p className="text-sm text-muted-foreground">
              Add <code className="bg-muted px-1 rounded">VITE_GOOGLE_MAPS_KEY</code> to enable the interactive heatmap.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {filteredCount} pollution reports active in Bengaluru
            </p>
          </div>
        </div>
      )}

      {/* Map controls overlay */}
      <div className="absolute top-3 right-3 flex flex-col gap-2">
        <button
          onClick={() => googleMapRef.current?.setZoom((googleMapRef.current.getZoom() || 12) + 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-md hover:bg-muted border border-border transition-all"
          aria-label="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={() => googleMapRef.current?.setZoom((googleMapRef.current.getZoom() || 12) - 1)}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-md hover:bg-muted border border-border transition-all"
          aria-label="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleLocateMe}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-md hover:bg-muted border border-border transition-all"
          aria-label="My location"
        >
          <Locate className="h-4 w-4" />
        </button>
        <button
          onClick={toggleMapType}
          className="flex h-9 w-9 items-center justify-center rounded-lg bg-card shadow-md hover:bg-muted border border-border transition-all"
          aria-label="Toggle map type"
          title={`Current: ${mapType}`}
        >
          <Layers className="h-4 w-4" />
        </button>
      </div>

      {/* Filter panel */}
      <div className="absolute top-3 left-3">
        <Button
          size="sm"
          variant="outline"
          onClick={() => setShowFilters(!showFilters)}
          className="bg-card shadow-md gap-2"
        >
          <Filter className="h-3.5 w-3.5" />
          Filter
          <span className="rounded-full bg-primary text-primary-foreground text-xs px-1.5">{filteredCount}</span>
        </Button>

        {showFilters && (
          <div className="mt-2 w-56 rounded-xl bg-card border border-border shadow-lg p-3 space-y-3 animate-fade-in">
            <div>
              <label className="text-xs font-medium text-muted-foreground">Time Range</label>
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                value={mapFilters.time}
                onChange={(e) => setMapFilters({ time: e.target.value as MapFilters['time'] })}
              >
                <option value="last_hour">Last Hour</option>
                <option value="today">Today</option>
                <option value="this_week">This Week</option>
                <option value="this_month">This Month</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Pollution Type</label>
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                value={mapFilters.pollutionType}
                onChange={(e) => setMapFilters({ pollutionType: e.target.value as MapFilters['pollutionType'] })}
              >
                <option value="all">All Types</option>
                <option value="garbage_fire">🔥 Garbage Fire</option>
                <option value="smoke">💨 Smoke / Haze</option>
                <option value="construction_dust">🏗️ Construction Dust</option>
                <option value="industrial">🏭 Industrial</option>
                <option value="vehicle">🚗 Vehicle</option>
                <option value="burning_waste">♻️ Burning Waste</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground">Severity</label>
              <select
                className="mt-1 w-full rounded-lg border border-input bg-background px-2 py-1.5 text-sm"
                value={mapFilters.severity}
                onChange={(e) => setMapFilters({ severity: e.target.value as MapFilters['severity'] })}
              >
                <option value="all">All Severities</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <button
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setMapFilters({ time: 'today', pollutionType: 'all', severity: 'all' })}
            >
              Reset filters
            </button>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="absolute bottom-3 left-3 rounded-xl bg-card/90 backdrop-blur-sm border border-border shadow-md p-3">
        <p className="text-xs font-semibold mb-2 text-foreground">AQI Legend</p>
        <div className="flex flex-col gap-1">
          {[
            { color: '#00C853', label: 'Good (0-50)' },
            { color: '#FFD600', label: 'Moderate (51-100)' },
            { color: '#FF9100', label: 'Sensitive (101-150)' },
            { color: '#FF3D00', label: 'Unhealthy (151-200)' },
            { color: '#7B1FA2', label: 'Very Unhealthy (201-300)' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="h-3 w-3 rounded-sm shrink-0" style={{ backgroundColor: color }} />
              <span className="text-[10px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

// Dark mode map styles
const darkMapStyles: google.maps.MapTypeStyle[] = [
  { elementType: 'geometry', stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1a2035' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#746855' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#d59563' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#38414e' }] },
  { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#212a37' }] },
  { featureType: 'road', elementType: 'labels.text.fill', stylers: [{ color: '#9ca5b3' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#17263c' }] },
]
