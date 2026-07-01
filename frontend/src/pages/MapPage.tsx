import React, { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, Badge, Button, Select, Skeleton } from '@/components/ui';
import { getAQIColor, getPollutionIcon, formatTimeAgo, getSeverityColor, getStatusColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Report } from '@/types';

export default function MapPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [filter, setFilter] = useState({ status: '', severity: '', type: '', time: 'all' });
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [view, setView] = useState<'list'|'map'>('list');

  useEffect(() => {
    setLoading(true);
    const params: Record<string,string> = { limit: '200', time_filter: filter.time };
    if (filter.status) params.status = filter.status;
    if (filter.severity) params.severity = filter.severity;
    if (filter.type) params.pollution_type = filter.type;
    api.reports.list(params).then(r => { setReports(r as Report[]); setLoading(false); }).catch(() => setLoading(false));
  }, [filter]);

  const filtered = reports;

  return (
    <div className="space-y-4 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🗺️ Live Pollution Map</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} reports across Bengaluru</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('list')} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', view==='list'?'bg-primary text-primary-foreground':'bg-muted hover:bg-accent')}>📋 List</button>
          <button onClick={() => setView('map')} className={cn('px-4 py-2 rounded-lg text-sm font-medium transition-all', view==='map'?'bg-primary text-primary-foreground':'bg-muted hover:bg-accent')}>🗺️ Map</button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Select value={filter.status} onChange={e => setFilter(f => ({...f, status: e.target.value}))}>
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </Select>
            <Select value={filter.severity} onChange={e => setFilter(f => ({...f, severity: e.target.value}))}>
              <option value="">All Severity</option>
              <option value="high">🔴 High</option>
              <option value="medium">🟡 Medium</option>
              <option value="low">🟢 Low</option>
            </Select>
            <Select value={filter.time} onChange={e => setFilter(f => ({...f, time: e.target.value}))}>
              <option value="all">All Time</option>
              <option value="today">Today</option>
              <option value="week">This Week</option>
            </Select>
            <Button variant="outline" onClick={() => setFilter({status:'',severity:'',type:'',time:'all'})}>Clear Filters</Button>
          </div>
        </CardContent>
      </Card>

      {view === 'map' ? (
        <Card>
          <CardContent className="p-0 overflow-hidden rounded-xl">
            <div className="h-[500px] bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10 flex items-center justify-center relative">
              <div className="text-center space-y-3">
                <div className="text-6xl">🗺️</div>
                <p className="font-semibold">Interactive Map</p>
                <p className="text-sm text-muted-foreground max-w-xs">Add your Google Maps API key in <code className="bg-muted px-1 rounded">.env.local</code> to enable the live heatmap</p>
                <p className="text-xs text-muted-foreground">VITE_GOOGLE_MAPS_KEY=your-key-here</p>
              </div>
              {/* Simulated pins */}
              {reports.slice(0,12).map((r, i) => (
                <button key={r.id} onClick={() => setSelected(r)} className="absolute w-8 h-8 rounded-full border-2 border-white shadow-lg flex items-center justify-center text-sm hover:scale-125 transition-transform" style={{ left:`${15+i*6}%`, top:`${20+Math.sin(i)*30}%`, backgroundColor: r.severity==='high'?'#FF3D00':r.severity==='medium'?'#FF9100':'#00C853' }}>
                  {getPollutionIcon(r.pollutionType)}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {loading ? [...Array(5)].map((_,i) => <Skeleton key={i} className="h-24" />) :
          filtered.length === 0 ? (
            <Card><CardContent className="py-12 text-center"><div className="text-4xl mb-3">🔍</div><p className="text-muted-foreground">No reports found</p></CardContent></Card>
          ) : filtered.map(r => (
            <Card key={r.id} className={cn('card-hover cursor-pointer', selected?.id===r.id?'border-primary shadow-md':'')} onClick={() => setSelected(s => s?.id===r.id ? null : r)}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl flex-shrink-0">{getPollutionIcon(r.pollutionType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-sm capitalize">{r.pollutionType.replace(/_/g,' ')}</span>
                      <Badge variant={r.severity==='high'?'danger':r.severity==='medium'?'warning':'success'} className="capitalize">{r.severity}</Badge>
                      <Badge className={cn('capitalize border text-xs', getStatusColor(r.status))}>{r.status.replace(/_/g,' ')}</Badge>
                      {r.upvotes > 0 && <span className="text-xs text-muted-foreground">👍 {r.upvotes}</span>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">📍 {r.location?.ward} · {formatTimeAgo(r.createdAt)}</p>
                    <p className="text-sm mt-1 line-clamp-2">{r.description}</p>
                  </div>
                  {r.aiAnalysis?.estimatedAQI && (
                    <div className="flex flex-col items-center flex-shrink-0 bg-muted rounded-lg p-2">
                      <span className="text-lg font-bold" style={{color:getAQIColor(r.aiAnalysis.estimatedAQI)}}>{r.aiAnalysis.estimatedAQI}</span>
                      <span className="text-xs text-muted-foreground">AQI</span>
                    </div>
                  )}
                </div>

                {selected?.id === r.id && (
                  <div className="mt-4 pt-4 border-t space-y-3">
                    {r.aiAnalysis && (
                      <div className="bg-accent rounded-xl p-3 text-sm space-y-1.5">
                        <p className="font-semibold text-primary">🤖 AI Analysis</p>
                        <p className="text-muted-foreground">{r.aiAnalysis.summary}</p>
                        <p className="text-xs"><b>Recommended action:</b> {r.aiAnalysis.recommendedAction}</p>
                        <p className="text-xs"><b>Health risk:</b> <span className="capitalize">{r.aiAnalysis.healthRisk}</span></p>
                      </div>
                    )}
                    {r.resolutionNote && (
                      <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-sm">
                        <p className="font-semibold text-green-700 dark:text-green-400">✅ Resolution Note</p>
                        <p className="text-muted-foreground mt-1">{r.resolutionNote}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => api.reports.upvote(r.id)}>👍 Upvote</Button>
                      <span className="text-xs text-muted-foreground self-center">ID: {r.id}</span>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
