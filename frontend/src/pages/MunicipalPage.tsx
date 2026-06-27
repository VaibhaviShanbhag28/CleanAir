import { useState, useEffect } from 'react'
import {
  Shield, CheckCircle2, Clock, AlertTriangle, Filter,
  Eye, Loader2, MapPin, Brain, Phone, Mail, Download,
  ChevronDown, Search, SortAsc, Users, BarChart3,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/index'
import { Button } from '@/components/ui/button'
import { Input, Badge, Skeleton, Progress } from '@/components/ui/index'
import { AQIBadge } from '@/components/ui/AQIBadge'
import { ReportCard } from '@/components/reports/ReportCard'
import { useStore } from '@/store'
import { DEMO_REPORTS, DEMO_ANALYTICS } from '@/lib/mockData'
import { POLLUTION_LABELS, POLLUTION_ICONS, formatRelativeTime, formatDateTime } from '@/lib/utils'
import type { Report, ReportStatus } from '@/types'
import { cn } from '@/lib/utils'

const STATUS_TABS: { key: ReportStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: 'All', color: 'bg-muted text-muted-foreground' },
  { key: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' },
  { key: 'acknowledged', label: 'Acknowledged', color: 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' },
  { key: 'in_progress', label: 'In Progress', color: 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' },
  { key: 'resolved', label: 'Resolved', color: 'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300' },
]

export default function MunicipalPage() {
  const { user, reports: storeReports, updateReport } = useStore()
  const [activeTab, setActiveTab] = useState<ReportStatus | 'all'>('all')
  const [search, setSearch] = useState('')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)
  const [resolveNote, setResolveNote] = useState('')
  const [resolving, setResolving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [showStats, setShowStats] = useState(false)

  const allReports = [...storeReports, ...DEMO_REPORTS].reduce<Report[]>((acc, r) => {
    if (!acc.find((a) => a.id === r.id)) acc.push(r)
    return acc
  }, [])

  useEffect(() => {
    setTimeout(() => setLoading(false), 600)
  }, [])

  // Auth gate for non-authority users
  const isMunicipal = user?.role === 'authority' || user?.role === 'admin' || !user // demo: allow all
  if (!isMunicipal) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <div className="text-center max-w-sm">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-bold mb-2">Authority Access Only</h2>
          <p className="text-muted-foreground text-sm">This dashboard is restricted to BBMP and KSPCB officials.</p>
        </div>
      </div>
    )
  }

  const filteredReports = allReports.filter((r) => {
    if (activeTab !== 'all' && r.status !== activeTab) return false
    if (search) {
      const q = search.toLowerCase()
      return (
        r.location.address?.toLowerCase().includes(q) ||
        r.location.ward?.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        POLLUTION_LABELS[r.pollutionType].toLowerCase().includes(q)
      )
    }
    return true
  })

  const statusCounts = allReports.reduce<Record<string, number>>((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1
    acc.all = (acc.all || 0) + 1
    return acc
  }, {})

  const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
    updateReport(reportId, { status, updatedAt: new Date() })
    if (selectedReport?.id === reportId) {
      setSelectedReport((r) => r ? { ...r, status } : null)
    }
  }

  const handleResolve = async () => {
    if (!selectedReport || !resolveNote.trim()) return
    setResolving(true)
    await new Promise((r) => setTimeout(r, 800)) // simulate API call
    updateReport(selectedReport.id, {
      status: 'resolved',
      resolvedAt: new Date(),
      resolutionNote: resolveNote,
      updatedAt: new Date(),
    })
    setSelectedReport(null)
    setResolveNote('')
    setResolving(false)
  }

  const exportCSV = () => {
    const rows = [
      ['ID', 'Type', 'Severity', 'Status', 'Ward', 'AQI', 'Date'],
      ...filteredReports.map((r) => [
        r.id,
        POLLUTION_LABELS[r.pollutionType],
        r.severity,
        r.status,
        r.location.ward || '',
        r.aiAnalysis?.estimatedAQI || '',
        r.createdAt.toLocaleDateString('en-IN'),
      ]),
    ]
    const csv = rows.map((r) => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cleanair-reports-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-muted/20">
      {/* Header banner */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-700 text-white px-4 py-4 sm:px-6">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-bold text-lg">Municipal Authority Dashboard</h1>
              <p className="text-slate-300 text-xs">BBMP · CleanAir Integration · Bengaluru</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={() => setShowStats(!showStats)}>
              <BarChart3 className="h-4 w-4" />
              Analytics
            </Button>
            <Button size="sm" variant="ghost" className="text-white hover:bg-white/10" onClick={exportCSV}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6">
        {/* ── Stats Cards ─────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => <Card key={i}><CardContent className="p-4"><Skeleton className="h-16" /></CardContent></Card>)
          ) : ([
            { label: 'Total Reports', value: DEMO_ANALYTICS.totalReports, icon: AlertTriangle, color: 'text-slate-600', bg: 'bg-slate-100 dark:bg-slate-900' },
            { label: 'Pending Action', value: statusCounts.pending || 0, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100 dark:bg-amber-950' },
            { label: 'In Progress', value: statusCounts.in_progress || 0, icon: Loader2, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-950' },
            { label: 'Resolved Today', value: statusCounts.resolved || 0, icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-950' },
          ].map(({ label, value, icon: Icon, color, bg }) => (
            <Card key={label}>
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${bg}`}>
                  <Icon className={`h-5 w-5 ${color}`} />
                </div>
                <div>
                  <p className={`text-2xl font-bold font-mono ${color}`}>{value}</p>
                  <p className="text-xs text-muted-foreground">{label}</p>
                </div>
              </CardContent>
            </Card>
          )))}
        </div>

        {/* ── Response time KPI ───────────────────────────────────────── */}
        {showStats && (
          <Card className="mb-6 animate-fade-in">
            <CardContent className="p-4">
              <div className="grid sm:grid-cols-3 gap-6">
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Average Response Time</p>
                  <p className="text-2xl font-bold font-mono">{DEMO_ANALYTICS.avgResponseTimeHours}h</p>
                  <p className="text-xs text-green-600 mt-1">↓ 2h better than last month</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Resolution Rate</p>
                  <Progress
                    value={Math.round(DEMO_ANALYTICS.resolvedReports / DEMO_ANALYTICS.totalReports * 100)}
                    color="#2E7D32"
                    className="h-3"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {Math.round(DEMO_ANALYTICS.resolvedReports / DEMO_ANALYTICS.totalReports * 100)}% resolved
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">People Protected</p>
                  <p className="text-2xl font-bold font-mono text-green-600">
                    ~{(DEMO_ANALYTICS.estimatedPeopleAffected / 1000).toFixed(0)}K
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">Estimated reach of resolved reports</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-5 gap-6">
          {/* ── Reports List ─────────────────────────────────────────── */}
          <div className="lg:col-span-3 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by ward, type, or description..."
                  className="pl-9"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Status tabs */}
            <div className="flex flex-wrap gap-2">
              {STATUS_TABS.map(({ key, label, color }) => (
                <button
                  key={key}
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold transition-all',
                    activeTab === key ? color : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  {label}
                  {statusCounts[key] != null && (
                    <span className="rounded-full bg-black/10 dark:bg-white/10 px-1.5">{statusCounts[key]}</span>
                  )}
                </button>
              ))}
            </div>

            {/* Report rows */}
            {loading ? (
              Array(5).fill(0).map((_, i) => (
                <Card key={i}><CardContent className="p-4"><Skeleton className="h-20" /></CardContent></Card>
              ))
            ) : filteredReports.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="h-10 w-10 mx-auto mb-3 opacity-30" />
                <p>No reports match your filter.</p>
              </div>
            ) : (
              filteredReports.map((report) => (
                <MunicipalReportRow
                  key={report.id}
                  report={report}
                  selected={selectedReport?.id === report.id}
                  onClick={() => setSelectedReport(report === selectedReport ? null : report)}
                  onStatusChange={(status) => handleStatusUpdate(report.id, status)}
                />
              ))
            )}
          </div>

          {/* ── Detail Panel ──────────────────────────────────────────── */}
          <div className="lg:col-span-2">
            {selectedReport ? (
              <div className="sticky top-20 space-y-4 animate-fade-in">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Report Detail
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Image */}
                    {selectedReport.imageUrl && (
                      <img
                        src={selectedReport.imageUrl}
                        alt="Report evidence"
                        className="w-full h-40 object-cover rounded-lg"
                      />
                    )}

                    {/* Header */}
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-xl">{POLLUTION_ICONS[selectedReport.pollutionType]}</span>
                        <span className="font-semibold">{POLLUTION_LABELS[selectedReport.pollutionType]}</span>
                        <span className={cn(
                          'rounded-full px-2 py-0.5 text-xs font-medium',
                          selectedReport.severity === 'high' ? 'severity-high' :
                          selectedReport.severity === 'medium' ? 'severity-medium' : 'severity-low'
                        )}>
                          {selectedReport.severity}
                        </span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {selectedReport.location.address}
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Reported {formatDateTime(selectedReport.createdAt)}
                      </p>
                    </div>

                    <p className="text-sm text-muted-foreground">{selectedReport.description}</p>

                    {/* AI Analysis */}
                    {selectedReport.aiAnalysis && (
                      <div className="rounded-lg bg-primary/5 border border-primary/10 p-3 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-primary">
                          <Brain className="h-3.5 w-3.5" />
                          Gemini AI Analysis
                        </div>
                        <p className="text-xs text-muted-foreground">{selectedReport.aiAnalysis.summary}</p>
                        <div className="flex items-center gap-2">
                          <AQIBadge value={selectedReport.aiAnalysis.estimatedAQI} size="sm" />
                          <span className="text-xs text-muted-foreground">
                            {Math.round(selectedReport.aiAnalysis.confidence * 100)}% confidence
                          </span>
                        </div>
                        <div className="text-xs font-medium text-destructive">
                          ⚠️ {selectedReport.aiAnalysis.recommendedAction}
                        </div>
                      </div>
                    )}

                    {/* Reporter */}
                    <div className="rounded-lg bg-muted p-3 text-xs space-y-1">
                      <p className="font-medium">Reporter</p>
                      <p className="text-muted-foreground">
                        {selectedReport.isAnonymous ? 'Anonymous report' : selectedReport.userDisplayName || 'Registered user'}
                      </p>
                      <p className="text-muted-foreground">👍 {selectedReport.upvotes} upvotes</p>
                    </div>

                    {/* Action buttons */}
                    <div className="grid grid-cols-2 gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedReport.id, 'acknowledged')}
                        disabled={selectedReport.status === 'acknowledged' || selectedReport.status === 'resolved'}
                      >
                        <Eye className="h-3.5 w-3.5" />
                        Acknowledge
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleStatusUpdate(selectedReport.id, 'in_progress')}
                        disabled={selectedReport.status === 'in_progress' || selectedReport.status === 'resolved'}
                      >
                        <Loader2 className="h-3.5 w-3.5" />
                        Assign Team
                      </Button>
                    </div>

                    {/* Resolve */}
                    {selectedReport.status !== 'resolved' && (
                      <div className="space-y-2">
                        <textarea
                          className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:ring-1 focus-visible:ring-ring resize-none"
                          rows={3}
                          placeholder="Resolution note (required to mark as resolved)..."
                          value={resolveNote}
                          onChange={(e) => setResolveNote(e.target.value)}
                        />
                        <Button
                          className="w-full"
                          variant="success"
                          onClick={handleResolve}
                          loading={resolving}
                          disabled={!resolveNote.trim()}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark Resolved
                        </Button>
                      </div>
                    )}

                    {selectedReport.status === 'resolved' && (
                      <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm">
                        <p className="font-medium text-green-700 dark:text-green-400 mb-1">✓ Resolved</p>
                        {selectedReport.resolutionNote && (
                          <p className="text-muted-foreground text-xs">{selectedReport.resolutionNote}</p>
                        )}
                        {selectedReport.resolvedAt && (
                          <p className="text-xs text-muted-foreground mt-1">{formatDateTime(selectedReport.resolvedAt)}</p>
                        )}
                      </div>
                    )}

                    {/* Contact authority shortcuts */}
                    <div className="border-t border-border pt-3 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground">Quick Contact</p>
                      <div className="flex gap-2">
                        <a href="tel:+918022221188" className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs hover:bg-muted/80 transition-colors">
                          <Phone className="h-3 w-3" /> BBMP Control
                        </a>
                        <a href="mailto:bbmp@karnataka.gov.in" className="flex items-center gap-1 rounded-lg bg-muted px-2.5 py-1.5 text-xs hover:bg-muted/80 transition-colors">
                          <Mail className="h-3 w-3" /> Email
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              <div className="sticky top-20">
                <Card className="border-dashed">
                  <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <Eye className="h-8 w-8 mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">Select a report to view details and take action</p>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// Compact row for municipal list
function MunicipalReportRow({
  report, selected, onClick, onStatusChange,
}: {
  report: Report
  selected: boolean
  onClick: () => void
  onStatusChange: (s: ReportStatus) => void
}) {
  return (
    <Card
      className={cn(
        'cursor-pointer transition-all',
        selected ? 'border-primary ring-1 ring-primary/30' : 'hover:border-border/80',
        report.severity === 'high' && !selected && 'border-destructive/30'
      )}
      onClick={onClick}
      tabIndex={0}
      role="button"
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <span className="text-xl shrink-0 mt-0.5">{POLLUTION_ICONS[report.pollutionType]}</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span className="font-medium text-sm">{POLLUTION_LABELS[report.pollutionType]}</span>
              <span className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                report.severity === 'high' ? 'severity-high' :
                report.severity === 'medium' ? 'severity-medium' : 'severity-low'
              )}>
                {report.severity}
              </span>
              {report.aiAnalysis && (
                <AQIBadge value={report.aiAnalysis.estimatedAQI} size="sm" showLabel={false} />
              )}
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3 shrink-0" />
              <span className="truncate">{report.location.ward || report.location.address}</span>
              <span className="shrink-0">· {formatRelativeTime(report.createdAt)}</span>
            </div>
          </div>

          {/* Status dropdown */}
          <div onClick={(e) => e.stopPropagation()}>
            <select
              className={cn(
                'rounded-full px-2.5 py-1 text-xs font-semibold border-0 cursor-pointer focus:ring-1 focus:ring-ring',
                report.status === 'pending' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                report.status === 'acknowledged' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
                report.status === 'in_progress' ? 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300' :
                'bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-300'
              )}
              value={report.status}
              onChange={(e) => onStatusChange(e.target.value as ReportStatus)}
              aria-label="Update report status"
            >
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
