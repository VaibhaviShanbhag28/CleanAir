import { useState, useEffect } from 'react'
import { MapPin, List, X } from 'lucide-react'
import { HeatmapMap } from '@/components/map/HeatmapMap'
import { ReportCard } from '@/components/reports/ReportCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/index'
import { AQIBadge } from '@/components/ui/AQIBadge'
import { useStore } from '@/store'
import { DEMO_REPORTS } from '@/lib/mockData'
import type { Report } from '@/types'
import { cn } from '@/lib/utils'

export default function MapPage() {
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const [reports, setReports] = useState<Report[]>(DEMO_REPORTS)
  const { reports: storeReports } = useStore()

  // Merge local reports with demo data
  useEffect(() => {
    const merged = [...storeReports, ...DEMO_REPORTS].reduce<Report[]>((acc, r) => {
      if (!acc.find((a) => a.id === r.id)) acc.push(r)
      return acc
    }, [])
    setReports(merged)
  }, [storeReports])

  return (
    <div className="relative flex h-[calc(100vh-4rem)] overflow-hidden">
      {/* ── Sidebar ───────────────────────────────────────────────────── */}
      <div
        className={cn(
          'flex flex-col border-r border-border bg-background transition-all duration-300 shrink-0',
          sidebarOpen ? 'w-80 xl:w-96' : 'w-0 overflow-hidden'
        )}
      >
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div>
            <h2 className="font-semibold text-sm">Active Reports</h2>
            <p className="text-xs text-muted-foreground">{reports.length} incidents</p>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {reports.map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              onViewDetails={(r) => setSelectedReport(r)}
              compact
            />
          ))}
        </div>
      </div>

      {/* ── Map Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 relative">
        {/* Toggle sidebar button */}
        {!sidebarOpen && (
          <button
            onClick={() => setSidebarOpen(true)}
            className="absolute top-4 left-4 z-10 flex items-center gap-2 rounded-lg bg-card border border-border px-3 py-2 text-sm shadow-md hover:bg-muted transition-all"
          >
            <List className="h-4 w-4" />
            Reports ({reports.length})
          </button>
        )}

        <HeatmapMap
          reports={reports}
          onReportClick={setSelectedReport}
          className="h-full"
        />
      </div>

      {/* ── Report Detail Panel ────────────────────────────────────────── */}
      {selectedReport && (
        <div className="absolute inset-0 z-20 flex items-end sm:items-center justify-center sm:justify-end p-4 pointer-events-none">
          <div className="pointer-events-auto w-full sm:w-96 max-h-[80vh] overflow-y-auto">
            <Card className="shadow-2xl">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h3 className="font-semibold text-sm">Report Details</h3>
                <button
                  onClick={() => setSelectedReport(null)}
                  className="h-7 w-7 flex items-center justify-center rounded-lg hover:bg-muted"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <CardContent className="p-0">
                <ReportCard
                  report={selectedReport}
                  onViewDetails={() => {}}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  )
}
