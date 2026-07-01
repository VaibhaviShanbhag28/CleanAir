import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Skeleton, StatCard, toast } from '@/components/ui';
import { getStatusColor, getPollutionIcon, formatTimeAgo, getSeverityColor } from '@/lib/utils';
import { cn } from '@/lib/utils';
import type { Report, AnalyticsOverview } from '@/types';

type Tab = 'overview'|'pending'|'flagged'|'resolve';

export default function MunicipalPage() {
  const [tab, setTab] = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [pending, setPending] = useState<Report[]>([]);
  const [flagged, setFlagged] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string,string>>({});

  useEffect(() => {
    Promise.all([
      api.analytics.overview() as Promise<AnalyticsOverview>,
      api.reports.list({ status:'pending', limit:'50', time_filter:'all' }) as Promise<Report[]>,
      api.reports.flagged() as Promise<Report[]>,
    ]).then(([a,p,f]) => { setAnalytics(a); setPending(p); setFlagged(f); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const acknowledge = async (id: string) => {
    try {
      await api.reports.acknowledge(id);
      setPending(p => p.map(r => r.id===id ? {...r, status:'acknowledged' as const} : r));
      toast('Report acknowledged', 'success');
    } catch { toast('Failed', 'error'); }
  };

  const resolve = async (id: string) => {
    setResolving(id);
    try {
      await api.reports.resolve(id, resolutionNotes[id] || 'Issue resolved by BBMP team.');
      setPending(p => p.filter(r => r.id !== id));
      toast('✅ Report resolved! Citizen notified.', 'success');
    } catch { toast('Failed to resolve', 'error'); }
    finally { setResolving(''); }
  };

  const generateReport = async (report: Report) => {
    try {
      const result = await api.ai.report(report) as {report:string};
      const blob = new Blob([result.report], { type:'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `BBMP_Report_${report.id}.txt`; a.click();
      URL.revokeObjectURL(url);
      toast('Authority report downloaded!', 'success');
    } catch { toast('Failed to generate report', 'error'); }
  };

  const TABS: {key:Tab;label:string;icon:string}[] = [
    {key:'overview',label:'Overview',icon:'📊'},
    {key:'pending',label:`Pending (${pending.length})`,icon:'⏳'},
    {key:'flagged',label:`Flagged (${flagged.length})`,icon:'🚩'},
    {key:'resolve',label:'Resolve Cases',icon:'✅'},
  ];

  if (loading) return <div className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-96" /></div>;

  return (
    <div className="space-y-5 page-enter">
      <div>
        <h1 className="text-2xl font-bold">🏛️ Municipal Authority Dashboard</h1>
        <p className="text-sm text-muted-foreground">BBMP CleanAir Management Console · Bengaluru</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={analytics?.totalReports||0} icon="📊" color="blue" />
        <StatCard title="Resolved" value={analytics?.resolvedReports||0} icon="✅" color="green" />
        <StatCard title="Pending" value={analytics?.pendingReports||0} icon="⏳" color="orange" />
        <StatCard title="Avg Response" value={`${analytics?.avgResponseTimeHours||0}h`} icon="⏱️" color="purple" />
      </div>

      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', tab===t.key?'bg-background shadow text-foreground':'text-muted-foreground hover:text-foreground')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Overview */}
      {tab==='overview' && (
        <div className="grid sm:grid-cols-2 gap-4">
          <Card>
            <CardHeader><CardTitle>🏆 Ward Rankings</CardTitle></CardHeader>
            <CardContent>
              {(analytics?.wardRankings||[]).slice(0,8).map((w,i) => (
                <div key={w.ward} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                  <span className="w-6 text-sm font-bold text-muted-foreground text-center">{i+1}</span>
                  <span className="flex-1 text-sm font-medium">{w.ward}</span>
                  <Badge variant={i<3?'danger':i<6?'warning':'success'}>{w.count} reports</Badge>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>📊 Quick Stats</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Resolution Rate</span><span className="font-bold text-green-600">{analytics?.totalReports ? Math.round(analytics.resolvedReports/analytics.totalReports*100) : 0}%</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Most Polluted Area</span><span className="font-bold">{analytics?.mostPollutedArea}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Most Improved Area</span><span className="font-bold text-green-600">{analytics?.mostImprovedArea}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Top Pollution Type</span><span className="font-bold capitalize">{analytics?.topPollutionType?.replace(/_/g,' ')}</span></div>
              <div className="flex justify-between text-sm"><span className="text-muted-foreground">Citizens Affected</span><span className="font-bold">{(analytics?.estimatedPeopleAffected||0).toLocaleString('en-IN')}</span></div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Pending */}
      {tab==='pending' && (
        <div className="space-y-3">
          {pending.length===0 ? <Card><CardContent className="py-12 text-center"><div className="text-4xl mb-3">🎉</div><p className="font-semibold">No pending reports!</p></CardContent></Card>
          : pending.map(r => (
            <Card key={r.id}>
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getPollutionIcon(r.pollutionType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-2 items-center mb-1">
                      <span className="font-semibold capitalize">{r.pollutionType.replace(/_/g,' ')}</span>
                      <Badge variant={r.severity==='high'?'danger':r.severity==='medium'?'warning':'success'} className="capitalize">{r.severity}</Badge>
                      <Badge className={cn('border text-xs', getStatusColor(r.status))}>{r.status}</Badge>
                      <span className="text-xs text-muted-foreground">#{r.id}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">📍 {r.location?.ward} · {formatTimeAgo(r.createdAt)}</p>
                    <p className="text-sm mt-1">{r.description}</p>
                  </div>
                </div>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => acknowledge(r.id)} disabled={r.status==='acknowledged'}>
                    {r.status==='acknowledged'?'✅ Acknowledged':'Acknowledge'}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => generateReport(r)}>📄 Generate Report</Button>
                  <Button size="sm" onClick={() => { setTab('resolve'); }} className="ml-auto">Resolve →</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Flagged */}
      {tab==='flagged' && (
        <div className="space-y-3">
          <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-xl p-4 text-sm text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-800">
            ⚠️ These reports were flagged by AI for review — possible fake or suspicious content.
          </div>
          {flagged.length===0 ? <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground">No flagged reports</p></CardContent></Card>
          : flagged.map(r => (
            <Card key={r.id} className="border-yellow-200 dark:border-yellow-800">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-3xl">{getPollutionIcon(r.pollutionType)}</span>
                  <div className="flex-1">
                    <div className="flex gap-2 flex-wrap mb-1">
                      <span className="font-semibold capitalize">{r.pollutionType.replace(/_/g,' ')}</span>
                      <Badge variant="warning">🚩 Flagged</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{r.location?.ward} · {formatTimeAgo(r.createdAt)}</p>
                    <p className="text-sm mt-1">{r.description}</p>
                    {r.validation?.reason && <p className="text-xs text-red-500 mt-1">⚠️ {String(r.validation.reason)}</p>}
                  </div>
                </div>
                <div className="flex gap-2 mt-3">
                  <Button size="sm" variant="outline" onClick={() => api.reports.update(r.id, {status:'acknowledged'}).then(() => toast('Approved','success'))}>Approve</Button>
                  <Button size="sm" variant="destructive" onClick={() => api.reports.update(r.id, {status:'flagged'}).then(() => toast('Rejected','info'))}>Reject</Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Resolve */}
      {tab==='resolve' && (
        <div className="space-y-3">
          {pending.filter(r=>r.status==='acknowledged').length===0 ? (
            <Card><CardContent className="py-12 text-center"><p className="text-muted-foreground text-sm">Acknowledge reports first from the Pending tab.</p></CardContent></Card>
          ) : pending.filter(r=>r.status==='acknowledged').map(r => (
            <Card key={r.id}>
              <CardContent className="p-4 space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{getPollutionIcon(r.pollutionType)}</span>
                  <div>
                    <p className="font-semibold capitalize">{r.pollutionType.replace(/_/g,' ')}</p>
                    <p className="text-sm text-muted-foreground">📍 {r.location?.ward} · #{r.id}</p>
                  </div>
                </div>
                <textarea
                  value={resolutionNotes[r.id]||''}
                  onChange={e => setResolutionNotes(n => ({...n, [r.id]: e.target.value}))}
                  placeholder="Enter resolution note (what action was taken)..."
                  className="w-full p-3 text-sm rounded-lg border bg-background focus:outline-none focus:ring-2 focus:ring-primary resize-none"
                  rows={3}
                />
                <Button className="w-full" onClick={() => resolve(r.id)} loading={resolving===r.id}>✅ Mark as Resolved</Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
