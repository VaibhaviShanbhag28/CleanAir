import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Skeleton, toast } from '@/components/ui';
import { getAQIColor, formatTimeAgo } from '@/lib/utils';
import type { Report } from '@/types';

const T = {
  navy: '#0A2240', green: '#1A6B3C', greenDark: '#166534',
  surface: '#F5F7FA', border: '#DDE2EA',
  textPrimary: '#0D1B2A', textMuted: '#4A5568',
  danger: '#991B1B', warning: '#92400E', card: '#FFFFFF',
};

const POLL_COLORS: Record<string, string> = {
  garbage_fire:'#B91C1C', smoke:'#374151', construction_dust:'#B45309',
  vehicle:'#6D28D9', burning_waste:'#C2410C', illegal_dumping:'#78350F',
  water_pollution:'#0891B2', noise_pollution:'#6B7280',
  chemical_dumping:'#065F46', sewage_leakage:'#1E40AF', unknown:'#6B7280',
};

const Icon = {
  List: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
      <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
    </svg>
  ),
  Map: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/>
      <line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Filter: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/>
    </svg>
  ),
  ThumbsUp: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  Brain: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24A3 3 0 0 1 2 10a3 3 0 0 1 3-3 2.5 2.5 0 0 1 4.5-5z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24A3 3 0 0 0 22 10a3 3 0 0 0-3-3 2.5 2.5 0 0 0-4.5-5z"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  X: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ChevronDown: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  ),
  ChevronUp: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15"/>
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
    resolved:     { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Resolved' },
    in_progress:  { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'In Progress' },
    acknowledged: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Acknowledged' },
    pending:      { bg: '#F9FAFB', color: '#4A5568', border: '#DDE2EA', label: 'Pending' },
    flagged:      { bg: '#FFF5F5', color: '#991B1B', border: '#FECACA', label: 'Flagged' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span style={{ padding: '0.1rem 0.45rem', background: c.bg, color: c.color, border: `1px solid ${c.border}`, borderRadius: 3, fontSize: '0.7rem', fontWeight: 700 }}>
      {c.label}
    </span>
  );
}

const selectStyle: React.CSSProperties = {
  padding: '0.4375rem 0.75rem', border: `1.5px solid ${T.border}`,
  borderRadius: 4, fontSize: '0.8125rem', color: T.textPrimary,
  background: 'white', outline: 'none', appearance: 'none',
  fontFamily: 'inherit', cursor: 'pointer',
};

export default function MapPage() {
  const [reports, setReports]   = useState<Report[]>([]);
  const [filter, setFilter]     = useState({ status: '', severity: '', type: '', time: 'all' });
  const [loading, setLoading]   = useState(true);
  const [selected, setSelected] = useState<Report | null>(null);
  const [view, setView]         = useState<'list' | 'map'>('list');
  const [upvoting, setUpvoting] = useState('');

  useEffect(() => {
    setLoading(true);
    const params: Record<string, string> = { limit: '200', time_filter: filter.time };
    if (filter.status)   params.status        = filter.status;
    if (filter.severity) params.severity      = filter.severity;
    if (filter.type)     params.pollution_type = filter.type;
    api.reports.list(params)
      .then(r => { setReports(r as Report[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [filter]);

  const upvote = async (id: string) => {
    setUpvoting(id);
    try {
      await api.reports.upvote(id);
      setReports(rs => rs.map(r => r.id === id ? { ...r, upvotes: (r.upvotes || 0) + 1 } : r));
      toast('Report upvoted.', 'success');
    } catch { toast('Failed to upvote.', 'error'); }
    finally { setUpvoting(''); }
  };

  const activeFilters = [filter.status, filter.severity, filter.time !== 'all' ? filter.time : ''].filter(Boolean).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                <Icon.Map />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
                Incident Registry
              </h1>
            </div>
            <p style={{ color: T.textMuted, fontSize: '0.875rem', margin: 0 }}>
              {reports.length} incidents recorded across Bengaluru
            </p>
          </div>
          {/* View toggle */}
          <div style={{ display: 'flex', border: `1.5px solid ${T.border}`, borderRadius: 4, overflow: 'hidden' }}>
            {(['list', 'map'] as const).map((v, i) => (
              <button key={v} onClick={() => setView(v)} style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 1rem',
                background: view === v ? T.navy : 'white',
                color: view === v ? 'white' : T.textMuted,
                border: 'none', borderLeft: i > 0 ? `1.5px solid ${T.border}` : 'none',
                fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer', transition: 'all 0.15s',
              }}>
                {v === 'list' ? <Icon.List /> : <Icon.Map />}
                {v === 'list' ? 'List' : 'Map'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ── Filters ── */}
      <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, padding: '0.875rem 1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.75rem' }}>
          <span style={{ color: T.textMuted }}><Icon.Filter /></span>
          <span style={{ fontWeight: 600, fontSize: '0.75rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Filters {activeFilters > 0 && <span style={{ background: T.navy, color: 'white', borderRadius: 10, padding: '0 5px', fontSize: '0.65rem', marginLeft: 4 }}>{activeFilters}</span>}
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.625rem' }}>
          <select style={selectStyle} value={filter.status} onChange={e => setFilter(f => ({ ...f, status: e.target.value }))}
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
            <option value="">All Status</option>
            <option value="pending">Pending</option>
            <option value="acknowledged">Acknowledged</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <select style={selectStyle} value={filter.severity} onChange={e => setFilter(f => ({ ...f, severity: e.target.value }))}
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
            <option value="">All Severity</option>
            <option value="high">High Severity</option>
            <option value="medium">Medium Severity</option>
            <option value="low">Low Severity</option>
          </select>
          <select style={selectStyle} value={filter.time} onChange={e => setFilter(f => ({ ...f, time: e.target.value }))}
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
          </select>
          {activeFilters > 0 && (
            <button onClick={() => setFilter({ status: '', severity: '', type: '', time: 'all' })} style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '0.4375rem 0.75rem', border: `1.5px solid ${T.border}`,
              borderRadius: 4, background: 'white', color: T.textMuted,
              fontSize: '0.8125rem', fontWeight: 500, cursor: 'pointer',
              transition: 'all 0.15s',
            }}>
              <Icon.X /> Clear
            </button>
          )}
        </div>
      </div>

      {/* ── Map view ── */}
      {view === 'map' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ height: 480, background: '#EFF6FF', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
            {/* Grid lines for map feel */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: `repeating-linear-gradient(0deg,${T.border} 0,${T.border} 1px,transparent 1px,transparent 48px),repeating-linear-gradient(90deg,${T.border} 0,${T.border} 1px,transparent 1px,transparent 48px)`, opacity: 0.4 }} />
            <div style={{ textAlign: 'center', position: 'relative', zIndex: 1 }}>
              <div style={{ width: 56, height: 56, borderRadius: 8, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', color: 'white' }}>
                <Icon.Map />
              </div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, marginBottom: 4 }}>Interactive Heatmap</p>
              <p style={{ fontSize: '0.8125rem', color: T.textMuted, maxWidth: 320, lineHeight: 1.5, marginBottom: 8 }}>
                Add your Google Maps API key in <code style={{ background: T.surface, padding: '1px 5px', borderRadius: 3, border: `1px solid ${T.border}` }}>.env.local</code> to enable the live incident heatmap
              </p>
              <code style={{ fontSize: '0.75rem', color: T.textMuted }}>VITE_GOOGLE_MAPS_KEY=your-key-here</code>
            </div>
            {/* Simulated pins */}
            {reports.slice(0, 14).map((r, i) => {
              const col = r.severity === 'high' ? T.danger : r.severity === 'medium' ? '#B45309' : T.greenDark;
              return (
                <button key={r.id} onClick={() => setSelected(s => s?.id === r.id ? null : r)}
                  style={{
                    position: 'absolute',
                    left: `${10 + i * 6}%`, top: `${15 + Math.sin(i * 1.3) * 30 + 20}%`,
                    width: 18, height: 18, borderRadius: '50%',
                    background: col, border: '2px solid white',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
                    cursor: 'pointer', transition: 'transform 0.15s',
                    zIndex: selected?.id === r.id ? 10 : 2,
                    transform: selected?.id === r.id ? 'scale(1.5)' : 'scale(1)',
                  }}
                  title={r.pollutionType.replace(/_/g, ' ')}
                />
              );
            })}
          </div>
          {selected && (
            <div style={{ padding: '1rem 1.25rem', borderTop: `1px solid ${T.border}`, background: T.surface }}>
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: 4 }}>
                <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, textTransform: 'capitalize' }}>{selected.pollutionType.replace(/_/g, ' ')}</span>
                <SeverityBadge severity={selected.severity} />
                <StatusBadge status={selected.status} />
              </div>
              <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: '0 0 4px', display: 'flex', alignItems: 'center', gap: 4 }}><Icon.MapPin /> {selected.location?.ward} · {formatTimeAgo(selected.createdAt)}</p>
              <p style={{ fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>{selected.description}</p>
            </div>
          )}
        </div>
      )}

      {/* ── List view ── */}
      {view === 'list' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
          {loading ? (
            [...Array(5)].map((_, i) => <Skeleton key={i} className="h-20" />)
          ) : reports.length === 0 ? (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, padding: '4rem', textAlign: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: T.textMuted }}>
                <Icon.Filter />
              </div>
              <p style={{ fontWeight: 700, color: T.textPrimary, marginBottom: 4 }}>No Incidents Found</p>
              <p style={{ fontSize: '0.875rem', color: T.textMuted }}>Try adjusting your filters to see more results.</p>
            </div>
          ) : reports.map(r => {
            const isSelected = selected?.id === r.id;
            const dotColor = POLL_COLORS[r.pollutionType] ?? '#6B7280';
            return (
              <div key={r.id} style={{
                border: `1px solid ${isSelected ? T.navy : T.border}`,
                borderLeft: `4px solid ${dotColor}`,
                borderRadius: 6, background: T.card,
                overflow: 'hidden', transition: 'all 0.15s',
                boxShadow: isSelected ? `0 0 0 1px ${T.navy}` : 'none',
                cursor: 'pointer',
              }}
                onMouseEnter={e => { if (!isSelected) e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)'; }}
                onMouseLeave={e => { if (!isSelected) e.currentTarget.style.boxShadow = 'none'; }}
                onClick={() => setSelected(s => s?.id === r.id ? null : r)}
              >
                {/* Main row */}
                <div style={{ padding: '0.875rem 1.125rem', display: 'flex', alignItems: 'flex-start', gap: '0.875rem' }}>
                  {/* Type dot */}
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: dotColor, flexShrink: 0, marginTop: 5 }} />

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, textTransform: 'capitalize' }}>
                        {r.pollutionType.replace(/_/g, ' ')}
                      </span>
                      <SeverityBadge severity={r.severity} />
                      <StatusBadge status={r.status} />
                      {(r.upvotes || 0) > 0 && (
                        <span style={{ fontSize: '0.75rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                          <Icon.ThumbsUp /> {r.upvotes}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.8rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icon.MapPin /> {r.location?.ward}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: T.border }}>·</span>
                      <span style={{ fontSize: '0.8rem', color: T.textMuted }}>{formatTimeAgo(r.createdAt)}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: isSelected ? 'normal' : 'nowrap' }}>
                      {r.description}
                    </p>
                  </div>

                  {/* AQI pill + expand toggle */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
                    {r.aiAnalysis?.estimatedAQI && (
                      <div style={{ textAlign: 'center', padding: '0.375rem 0.625rem', border: `1px solid ${T.border}`, borderRadius: 4, background: T.surface }}>
                        <p style={{ fontWeight: 800, fontSize: '1rem', color: getAQIColor(r.aiAnalysis.estimatedAQI), margin: 0, lineHeight: 1 }}>{r.aiAnalysis.estimatedAQI}</p>
                        <p style={{ fontSize: '0.65rem', color: T.textMuted, margin: '2px 0 0', textTransform: 'uppercase', letterSpacing: '0.04em' }}>AQI</p>
                      </div>
                    )}
                    <span style={{ color: T.textMuted }}>{isSelected ? <Icon.ChevronUp /> : <Icon.ChevronDown />}</span>
                  </div>
                </div>

                {/* Expanded detail */}
                {isSelected && (
                  <div style={{ padding: '0 1.125rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', borderTop: `1px solid ${T.border}`, paddingTop: '0.875rem' }}>
                    {r.aiAnalysis && (
                      <div style={{ padding: '0.875rem', background: `${T.navy}06`, border: `1px solid ${T.navy}18`, borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
                          <span style={{ color: T.navy }}><Icon.Brain /></span>
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: T.navy }}>AI Analysis</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: '0 0 8px', lineHeight: 1.5 }}>{r.aiAnalysis.summary}</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.375rem' }}>
                          <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>Recommended Action</p>
                            <p style={{ fontSize: '0.8125rem', color: T.textPrimary, margin: 0 }}>{r.aiAnalysis.recommendedAction}</p>
                          </div>
                          <div>
                            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>Health Risk</p>
                            <p style={{ fontSize: '0.8125rem', color: T.textPrimary, margin: 0, textTransform: 'capitalize' }}>{r.aiAnalysis.healthRisk}</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {r.resolutionNote && (
                      <div style={{ padding: '0.875rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                          <span style={{ color: T.greenDark }}><Icon.CheckCircle /></span>
                          <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: T.greenDark }}>Resolution Note</span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>{r.resolutionNote}</p>
                      </div>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <button
                        onClick={e => { e.stopPropagation(); upvote(r.id); }}
                        disabled={upvoting === r.id}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 5,
                          padding: '0.4375rem 0.875rem',
                          border: `1.5px solid ${T.border}`, borderRadius: 4,
                          background: 'white', color: T.textMuted,
                          fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                          opacity: upvoting === r.id ? 0.6 : 1, transition: 'all 0.15s',
                        }}
                      >
                        <Icon.ThumbsUp /> Upvote
                      </button>
                      <span style={{ fontSize: '0.75rem', color: T.textMuted }}>
                        Incident ID: <code style={{ background: T.surface, padding: '1px 5px', borderRadius: 3, border: `1px solid ${T.border}` }}>{r.id}</code>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}