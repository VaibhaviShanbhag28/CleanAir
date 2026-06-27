import { useState } from 'react'
import { MapPin, Clock, ThumbsUp, Brain, CheckCircle2, AlertCircle, Loader, Eye } from 'lucide-react'
import type { Report } from '@/types'
import { POLLUTION_LABELS, POLLUTION_ICONS, SEVERITY_LABELS, formatRelativeTime } from '@/lib/utils'
import { Card, CardContent, Badge } from '@/components/ui/index'
import { Button } from '@/components/ui/button'
import { AQIBadge } from '@/components/ui/AQIBadge'
import { cn } from '@/lib/utils'

interface ReportCardProps {
  report: Report
  onUpvote?: (id: string) => void
  onViewDetails?: (report: Report) => void
  compact?: boolean
}

export function ReportCard({ report, onUpvote, onViewDetails, compact = false }: ReportCardProps) {
  const [upvoted, setUpvoted] = useState(false)
  const [localUpvotes, setLocalUpvotes] = useState(report.upvotes)

  const handleUpvote = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!upvoted) {
      setUpvoted(true)
      setLocalUpvotes((p) => p + 1)
      onUpvote?.(report.id)
    }
  }

  const statusConfig = {
    pending: { icon: AlertCircle, label: 'Pending', className: 'text-amber-600 bg-amber-50 dark:bg-amber-950/30' },
    acknowledged: { icon: Eye, label: 'Acknowledged', className: 'text-blue-600 bg-blue-50 dark:bg-blue-950/30' },
    in_progress: { icon: Loader, label: 'In Progress', className: 'text-purple-600 bg-purple-50 dark:bg-purple-950/30' },
    resolved: { icon: CheckCircle2, label: 'Resolved', className: 'text-green-600 bg-green-50 dark:bg-green-950/30' },
  }

  const status = statusConfig[report.status]
  const StatusIcon = status.icon

  return (
    <Card
      className={cn(
        'report-card cursor-pointer overflow-hidden',
        report.severity === 'high' && 'border-destructive/30',
        compact && 'shadow-none'
      )}
      onClick={() => onViewDetails?.(report)}
      tabIndex={0}
      role="article"
      aria-label={`Pollution report: ${POLLUTION_LABELS[report.pollutionType]} at ${report.location.address}`}
      onKeyDown={(e) => e.key === 'Enter' && onViewDetails?.(report)}
    >
      {/* Image strip if available */}
      {report.imageUrl && !compact && (
        <div className="relative h-40 overflow-hidden">
          <img
            src={report.imageUrl}
            alt={`Pollution report - ${POLLUTION_LABELS[report.pollutionType]}`}
            className="w-full h-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          {report.aiAnalysis && (
            <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-xs text-white">
              <Brain className="h-3 w-3 text-green-400" />
              <span>AI: {Math.round(report.aiAnalysis.confidence * 100)}% confident</span>
            </div>
          )}
          {report.aiAnalysis?.estimatedAQI && (
            <div className="absolute bottom-2 right-2">
              <AQIBadge value={report.aiAnalysis.estimatedAQI} size="sm" />
            </div>
          )}
        </div>
      )}

      <CardContent className={cn('p-4', compact && 'p-3')}>
        {/* Header row */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-lg" aria-hidden="true">{POLLUTION_ICONS[report.pollutionType]}</span>
            <span className="font-semibold text-sm">{POLLUTION_LABELS[report.pollutionType]}</span>
            <span
              className={cn(
                'rounded-full px-2 py-0.5 text-xs font-medium',
                report.severity === 'high' ? 'severity-high' :
                report.severity === 'medium' ? 'severity-medium' : 'severity-low'
              )}
            >
              {SEVERITY_LABELS[report.severity]}
            </span>
          </div>
          <span
            className={cn('flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium shrink-0', status.className)}
          >
            <StatusIcon className="h-3 w-3" />
            {status.label}
          </span>
        </div>

        {/* Description */}
        {!compact && (
          <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
            {report.description}
          </p>
        )}

        {/* AI Summary */}
        {report.aiAnalysis && !compact && (
          <div className="mb-3 rounded-lg bg-primary/5 border border-primary/10 p-2.5">
            <div className="flex items-center gap-1 mb-1">
              <Brain className="h-3.5 w-3.5 text-primary" />
              <span className="text-xs font-semibold text-primary">AI Analysis</span>
            </div>
            <p className="text-xs text-muted-foreground line-clamp-2">{report.aiAnalysis.summary}</p>
          </div>
        )}

        {/* Location & time */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          <span className="flex items-center gap-1 truncate">
            <MapPin className="h-3 w-3 shrink-0" />
            <span className="truncate">{report.location.ward || report.location.address}</span>
          </span>
          <span className="flex items-center gap-1 shrink-0">
            <Clock className="h-3 w-3" />
            {formatRelativeTime(report.createdAt)}
          </span>
        </div>

        {/* Footer */}
        <div className="mt-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {report.isAnonymous ? (
              <Badge variant="outline" className="text-xs">Anonymous</Badge>
            ) : (
              <span className="text-xs text-muted-foreground">{report.userDisplayName}</span>
            )}
          </div>
          <button
            onClick={handleUpvote}
            disabled={upvoted}
            className={cn(
              'flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-all',
              upvoted
                ? 'bg-primary/10 text-primary'
                : 'hover:bg-muted text-muted-foreground'
            )}
            aria-label={`Upvote this report (${localUpvotes} upvotes)`}
          >
            <ThumbsUp className="h-3 w-3" />
            {localUpvotes}
          </button>
        </div>
      </CardContent>
    </Card>
  )
}

// Skeleton loader for report card
export function ReportCardSkeleton() {
  return (
    <Card className="overflow-hidden">
      <div className="skeleton h-40 rounded-none" />
      <CardContent className="p-4 space-y-3">
        <div className="flex gap-2">
          <div className="skeleton h-5 w-5 rounded-full" />
          <div className="skeleton h-5 w-32" />
          <div className="skeleton h-5 w-16 rounded-full" />
        </div>
        <div className="skeleton h-4 w-full" />
        <div className="skeleton h-4 w-3/4" />
        <div className="flex gap-3">
          <div className="skeleton h-3 w-24" />
          <div className="skeleton h-3 w-16" />
        </div>
      </CardContent>
    </Card>
  )
}
