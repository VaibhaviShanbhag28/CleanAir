import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Skeleton, toast } from '@/components/ui';
import { formatTimeAgo } from '@/lib/utils';
import type { Report, AnalyticsOverview } from '@/types';

const T = {
  navy: '#0A2240', green: '#1A6B3C', greenDark: '#166534',
  surface: '#F5F7FA', border: '#DDE2EA',
  textPrimary: '#0D1B2A', textMuted: '#4A5568',
  danger: '#991B1B', warning: '#92400E', card: '#FFFFFF',
};

const POLL_COLORS: Record<string, string> = {
  garbage_fire:'#B91C1C', smoke:'#374151', construction_dust:'#B45309',
  vehicle:'#6D28D9', burning_waste:'#C2410C', illegal_dumping:'#78350F', unknown:'#6B7280',
};

type Tab = 'overview' | 'pending' | 'flagged' | 'resolve';

const Icon = {
  Building: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
      <path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/>
      <path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/>
      <path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
    </svg>
  ),
  FileText: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Download: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
      <polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
};

function SeverityBadge({ severity }: { severity: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    high:   { bg: '#FFF5F5', color: '#991B1B', border: '#FECACA' },
    medium: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    low:    { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
  };
  const c = cfg[severity] ?? cfg.low;
  return (
    <span style={{ padding: '0.1rem 0.45rem', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 3, fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
      {severity}
    </span>
  );
}

function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
    pending:      { bg: '#F9FAFB', color: '#4A5568', border: '#DDE2EA', label: 'Pending' },
    acknowledged: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Acknowledged' },
    in_progress:  { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'In Progress' },
    resolved:     { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Resolved' },
    flagged:      { bg: '#FFF5F5', color: '#991B1B', border: '#FECACA', label: 'Flagged' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span style={{ padding: '0.1rem 0.45rem', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 3, fontSize: '0.7rem', fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

const primaryBtn = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '0.4375rem 0.875rem', background: disabled ? '#9CA3AF' : T.navy,
  color: 'white', border: 'none', borderRadius: 4,
  fontWeight: 600, fontSize: '0.8125rem',
  cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
});
const outlineBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '0.4375rem 0.875rem', background: 'white',
  color: T.navy, border: `1.5px solid ${T.navy}`,
  borderRadius: 4, fontWeight: 600, fontSize: '0.8125rem',
  cursor: 'pointer', transition: 'all 0.15s',
};
const dangerBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 5,
  padding: '0.4375rem 0.875rem', background: T.danger,
  color: 'white', border: 'none', borderRadius: 4,
  fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s',
};

export default function MunicipalPage() {
  const [tab, setTab]           = useState<Tab>('overview');
  const [analytics, setAnalytics] = useState<AnalyticsOverview | null>(null);
  const [pending, setPending]   = useState<Report[]>([]);
  const [flagged, setFlagged]   = useState<Report[]>([]);
  const [loading, setLoading]   = useState(true);
  const [resolving, setResolving] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    Promise.all([
      api.analytics.overview() as Promise<AnalyticsOverview>,
      api.reports.list({ status: 'pending', limit: '50', time_filter: 'all' }) as Promise<Report[]>,
      api.reports.flagged() as Promise<Report[]>,
    ]).then(([a, p, f]) => { setAnalytics(a); setPending(p); setFlagged(f); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const acknowledge = async (id: string) => {
    try {
      await api.reports.acknowledge(id);
      setPending(p => p.map(r => r.id === id ? { ...r, status: 'acknowledged' as const } : r));
      toast('Report acknowledged.', 'success');
    } catch { toast('Action failed. Please retry.', 'error'); }
  };

  const resolve = async (id: string) => {
    setResolving(id);
    try {
      await api.reports.resolve(id, resolutionNotes[id] || 'Issue resolved by BBMP field team.');
      setPending(p => p.filter(r => r.id !== id));
      toast('Incident marked as resolved. Citizen notified.', 'success');
    } catch { toast('Failed to resolve. Please retry.', 'error'); }
    finally { setResolving(''); }
  };

  const generateReport = async (report: Report) => {
    try {
      const result = await api.ai.report(report) as { report: string };
      const blob = new Blob([result.report], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = `BBMP_Incident_${report.id}.txt`; a.click();
      URL.revokeObjectURL(url);
      toast('Authority report downloaded.', 'success');
    } catch { toast('Failed to generate report.', 'error'); }
  };

  const resolutionRate = analytics && analytics.totalReports > 0
    ? Math.round((analytics.resolvedReports / analytics.totalReports) * 100) : 0;

  const TABS: { key: Tab; label: string; icon: React.ReactNode; count?: number }[] = [
    { key: 'overview', label: 'Overview',      icon: <Icon.BarChart /> },
    { key: 'pending',  label: 'Pending',        icon: <Icon.Clock />,         count: pending.length },
    { key: 'flagged',  label: 'Flagged',        icon: <Icon.AlertTriangle />, count: flagged.length },
    { key: 'resolve',  label: 'Resolve Cases',  icon: <Icon.CheckCircle /> },
  ];

  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <Skeleton className="h-36" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24" />)}
      </div>
      <Skeleton className="h-64" />
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ background: T.navy, borderRadius: 8, padding: '1.25rem 1.75rem', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)' }} />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: 'rgba(255,255,255,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Icon.Building />
              </div>
              <h1 style={{ fontSize: '1.375rem', fontWeight: 800, color: 'white', letterSpacing: '-0.02em', margin: 0 }}>
                Municipal Authority Console
              </h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.55)', fontSize: '0.875rem', margin: 0 }}>
              BBMP CleanAir Management System · Bengaluru Urban District
            </p>
          </div>
          <div style={{ display: 'flex', gap: '1.25rem' }}>
            {[
              { label: 'Resolution Rate', value: `${resolutionRate}%`, color: resolutionRate > 60 ? '#4ADE80' : '#FCD34D' },
              { label: 'Open Incidents',  value: (analytics?.pendingReports ?? 0).toString(), color: '#FCD34D' },
            ].map(s => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color, margin: 0, lineHeight: 1 }}>{s.value}</p>
                <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', margin: '3px 0 0', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.875rem' }}>
        {[
          { label: 'Total Reports',   value: analytics?.totalReports ?? 0,    color: T.navy,    icon: <Icon.FileText /> },
          { label: 'Resolved',        value: analytics?.resolvedReports ?? 0,  color: T.greenDark, icon: <Icon.CheckCircle /> },
          { label: 'Pending Review',  value: analytics?.pendingReports ?? 0,   color: '#B45309', icon: <Icon.Clock /> },
          { label: 'Avg Response',    value: `${analytics?.avgResponseTimeHours ?? 0}h`, color: '#6D28D9', icon: <Icon.BarChart /> },
        ].map(s => (
          <div key={s.label} style={{ border: `1px solid ${T.border}`, borderTop: `3px solid ${s.color}`, borderRadius: 6, padding: '1rem 1.125rem', background: T.card }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: '1.625rem', fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab nav ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.625rem 1.125rem', border: 'none',
            borderBottom: tab === t.key ? `2px solid ${T.navy}` : '2px solid transparent',
            background: 'transparent', color: tab === t.key ? T.navy : T.textMuted,
            fontWeight: tab === t.key ? 700 : 500, fontSize: '0.875rem',
            cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s', whiteSpace: 'nowrap',
          }}>
            <span style={{ color: tab === t.key ? T.navy : T.textMuted }}>{t.icon}</span>
            {t.label}
            {t.count !== undefined && t.count > 0 && (
              <span style={{ background: t.key === 'flagged' ? T.danger : T.warning, color: 'white', borderRadius: 10, padding: '0 6px', fontSize: '0.68rem', fontWeight: 700, minWidth: 18, textAlign: 'center' }}>{t.count}</span>
            )}
          </button>
        ))}
      </div>

      {/* ── Overview ── */}
      {tab === 'overview' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
          {/* Ward rankings */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: T.navy }}><Icon.BarChart /></span>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Ward Incident Rankings</p>
            </div>
            <div style={{ padding: '0.5rem 1.25rem' }}>
              {(analytics?.wardRankings ?? []).slice(0, 8).map((w, i) => (
                <div key={w.ward} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < 7 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700,
                    background: i < 3 ? '#FFF5F5' : T.surface,
                    color: i < 3 ? T.danger : T.textMuted,
                    border: `1px solid ${i < 3 ? '#FECACA' : T.border}`,
                  }}>{i + 1}</span>
                  <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.ward}</span>
                  <span style={{
                    padding: '0.1rem 0.45rem',
                    background: i < 3 ? '#FFF5F5' : T.surface,
                    color: i < 3 ? T.danger : T.textMuted,
                    border: `1px solid ${i < 3 ? '#FECACA' : T.border}`,
                    borderRadius: 3, fontSize: '0.75rem', fontWeight: 700,
                  }}>{w.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Quick stats */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Performance Summary</p>
            </div>
            <div style={{ padding: '0.5rem 1.25rem' }}>
              {[
                { label: 'Resolution Rate',   value: `${resolutionRate}%`,                             color: resolutionRate > 60 ? T.greenDark : T.warning },
                { label: 'Most Polluted Area', value: analytics?.mostPollutedArea ?? '—',             color: T.danger },
                { label: 'Most Improved Area', value: analytics?.mostImprovedArea ?? '—',             color: T.greenDark },
                { label: 'Top Incident Type', value: (analytics?.topPollutionType ?? '—').replace(/_/g, ' '), color: T.textPrimary },
                { label: 'Citizens Affected', value: (analytics?.estimatedPeopleAffected ?? 0).toLocaleString('en-IN'), color: '#6D28D9' },
              ].map((s, i) => (
                <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.625rem 0', borderBottom: i < 4 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{ fontSize: '0.875rem', color: T.textMuted }}>{s.label}</span>
                  <span style={{ fontWeight: 700, fontSize: '0.875rem', color: s.color, textTransform: 'capitalize' }}>{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Pending ── */}
      {tab === 'pending' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pending.length === 0 ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, padding: '4rem', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: T.greenDark }}>
                <Icon.CheckCircle />
              </div>
              <p style={{ fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>All Clear</p>
              <p style={{ fontSize: '0.875rem', color: T.textMuted }}>No pending reports at this time.</p>
            </div>
          ) : pending.map(r => (
            <div key={r.id} style={{ border: `1px solid ${T.border}`, borderLeft: `4px solid ${POLL_COLORS[r.pollutionType] ?? '#6B7280'}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, textTransform: 'capitalize' }}>
                    {r.pollutionType.replace(/_/g, ' ')}
                  </span>
                  <SeverityBadge severity={r.severity} />
                  <StatusBadge status={r.status} />
                  <span style={{ fontSize: '0.75rem', color: T.textMuted, marginLeft: 'auto' }}>#{r.id}</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.MapPin /> {r.location?.ward} · {formatTimeAgo(r.createdAt)}
                </p>
                <p style={{ fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>{r.description}</p>
              </div>
              <div style={{ padding: '0.75rem 1.25rem', borderTop: `1px solid ${T.border}`, background: T.surface, display: 'flex', gap: '0.625rem', flexWrap: 'wrap' }}>
                <button style={outlineBtn} onClick={() => acknowledge(r.id)} disabled={r.status === 'acknowledged'}>
                  {r.status === 'acknowledged' ? 'Acknowledged' : 'Acknowledge'}
                </button>
                <button style={outlineBtn} onClick={() => generateReport(r)}>
                  <Icon.Download /> Generate Report
                </button>
                <button style={{ ...primaryBtn(), marginLeft: 'auto' }} onClick={() => setTab('resolve')}>
                  Resolve <Icon.ArrowRight />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Flagged ── */}
      {tab === 'flagged' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <div style={{ padding: '0.75rem 1rem', background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8, fontSize: '0.875rem', color: '#92400E' }}>
            <span style={{ flexShrink: 0, marginTop: 1 }}><Icon.AlertTriangle /></span>
            AI flagged these reports as potentially suspicious or inaccurate. Review before taking action.
          </div>
          {flagged.length === 0 ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.875rem', color: T.textMuted }}>No flagged reports at this time.</p>
            </div>
          ) : flagged.map(r => (
            <div key={r.id} style={{ border: `1px solid #FDE68A`, borderLeft: `4px solid #B45309`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem' }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center', marginBottom: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, textTransform: 'capitalize' }}>
                    {r.pollutionType.replace(/_/g, ' ')}
                  </span>
                  <span style={{ padding: '0.1rem 0.45rem', background: '#FFFBEB', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 3, fontSize: '0.7rem', fontWeight: 700 }}>Flagged by AI</span>
                </div>
                <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: '0 0 6px', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.MapPin /> {r.location?.ward} · {formatTimeAgo(r.createdAt)}
                </p>
                <p style={{ fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>{r.description}</p>
                {r.validation?.reason && (
                  <p style={{ fontSize: '0.8125rem', color: T.danger, margin: '6px 0 0', fontWeight: 500 }}>
                    Reason: {String(r.validation.reason)}
                  </p>
                )}
              </div>
              <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid #FDE68A', background: '#FFFBEB', display: 'flex', gap: '0.625rem' }}>
                <button style={outlineBtn} onClick={() => api.reports.update(r.id, { status: 'acknowledged' }).then(() => toast('Report approved.', 'success'))}>
                  Approve
                </button>
                <button style={dangerBtn} onClick={() => api.reports.update(r.id, { status: 'flagged' }).then(() => toast('Report rejected.', 'info'))}>
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Resolve ── */}
      {tab === 'resolve' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {pending.filter(r => r.status === 'acknowledged').length === 0 ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, padding: '3rem', textAlign: 'center' }}>
              <p style={{ fontWeight: 600, color: T.textPrimary, marginBottom: 6 }}>No Acknowledged Reports</p>
              <p style={{ fontSize: '0.875rem', color: T.textMuted }}>
                Go to the Pending tab to acknowledge reports before resolving them.
              </p>
            </div>
          ) : pending.filter(r => r.status === 'acknowledged').map(r => (
            <div key={r.id} style={{ border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.greenDark}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
              <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
                <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, textTransform: 'capitalize' }}>
                    {r.pollutionType.replace(/_/g, ' ')}
                  </span>
                  <SeverityBadge severity={r.severity} />
                  <span style={{ fontSize: '0.8125rem', color: T.textMuted, marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Icon.MapPin /> {r.location?.ward} · #{r.id}
                  </span>
                </div>
              </div>
              <div style={{ padding: '1rem 1.25rem' }}>
                <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: T.textPrimary, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                  Resolution Notes <span style={{ color: T.danger }}>*</span>
                </label>
                <textarea
                  value={resolutionNotes[r.id] || ''}
                  onChange={e => setResolutionNotes(n => ({ ...n, [r.id]: e.target.value }))}
                  placeholder="Describe the action taken — team deployed, issue fixed, materials removed..."
                  style={{
                    width: '100%', padding: '0.625rem 0.875rem',
                    border: `1.5px solid ${T.border}`, borderRadius: 4,
                    fontSize: '0.875rem', color: T.textPrimary,
                    background: 'white', outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.6,
                    boxSizing: 'border-box', minHeight: 80,
                  }}
                  rows={3}
                  onFocus={e => (e.target.style.borderColor = T.navy)}
                  onBlur={e => (e.target.style.borderColor = T.border)}
                />
                <button
                  style={{ ...primaryBtn(resolving === r.id || !resolutionNotes[r.id]?.trim()), marginTop: '0.75rem', width: '100%', padding: '0.625rem', fontSize: '0.9rem', fontWeight: 700, justifyContent: 'center' }}
                  onClick={() => resolve(r.id)}
                  disabled={resolving === r.id || !resolutionNotes[r.id]?.trim()}
                >
                  {resolving === r.id
                    ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Resolving...</>
                    : <><Icon.CheckCircle /> Mark as Resolved</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}