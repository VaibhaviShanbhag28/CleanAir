import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell,
} from 'recharts';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Skeleton } from '@/components/ui';
import { getAQIColor, getAQILabel, formatTimeAgo } from '@/lib/utils';
import type { AnalyticsOverview, Report } from '@/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  navy:        '#0A2240',
  green:       '#1A6B3C',
  greenDark:   '#166534',
  surface:     '#F5F7FA',
  border:      '#DDE2EA',
  textPrimary: '#0D1B2A',
  textMuted:   '#4A5568',
  danger:      '#991B1B',
  warning:     '#92400E',
  card:        '#FFFFFF',
};

const POLL_COLORS: Record<string, string> = {
  garbage_fire: '#B91C1C', smoke: '#374151', construction_dust: '#B45309',
  vehicle: '#6D28D9', burning_waste: '#C2410C', illegal_dumping: '#78350F', unknown: '#6B7280',
};

interface Insights {
  headline?: string;
  insights?: { title: string; description: string; priority: string; category: string }[];
  environmental_score?: number;
  trend?: string;
}
interface AirAdvisory {
  title?: string; forecast?: string;
  eco_tip_of_day?: string; outdoor_rating?: string;
  mask_tip?: string; best_time_outdoor?: string;
}

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  AlertCircle: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  FileText: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
  Clock: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
    </svg>
  ),
  Users: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Brain: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24A3 3 0 0 1 2 10a3 3 0 0 1 3-3 2.5 2.5 0 0 1 4.5-5z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24A3 3 0 0 0 22 10a3 3 0 0 0-3-3 2.5 2.5 0 0 0-4.5-5z"/>
    </svg>
  ),
  Wind: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Report: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Recycle: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 22.2"/><path d="M21 4a20 20 0 0 1-3 0c-3.41-.17-6.78-1-10-3 0 7 4 12 8 13"/>
    </svg>
  ),
  Globe: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
};

// ── Stat card ─────────────────────────────────────────────────────────────────
function StatCard({ title, value, subtitle, icon, accentColor, trend }: {
  title: string; value: string | number; subtitle?: string;
  icon: React.ReactNode; accentColor: string; trend?: number;
}) {
  return (
    <div style={{
      background: T.card, border: `1px solid ${T.border}`,
      borderTop: `3px solid ${accentColor}`,
      borderRadius: 6, padding: '1.125rem 1.25rem',
      transition: 'box-shadow 0.15s',
    }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>
            {title}
          </p>
          <p style={{ fontSize: '1.75rem', fontWeight: 700, color: T.textPrimary, letterSpacing: '-0.02em', lineHeight: 1 }}>
            {value}
          </p>
          {subtitle && <p style={{ fontSize: '0.75rem', color: T.textMuted, marginTop: 4 }}>{subtitle}</p>}
          {trend !== undefined && (
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: trend >= 0 ? T.greenDark : T.danger, marginTop: 4 }}>
              {trend >= 0 ? '+' : ''}{trend}% vs last week
            </p>
          )}
        </div>
        <div style={{
          width: 38, height: 38, borderRadius: 6,
          background: accentColor + '14',
          color: accentColor,
          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusPill({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; label: string }> = {
    resolved:    { bg: '#F0FDF4', color: '#166534', label: 'Resolved' },
    in_progress: { bg: '#EFF6FF', color: '#1E40AF', label: 'In Progress' },
    acknowledged:{ bg: '#FFFBEB', color: '#92400E', label: 'Acknowledged' },
    pending:     { bg: '#F9FAFB', color: '#4A5568', label: 'Pending' },
    flagged:     { bg: '#FFF5F5', color: '#991B1B', label: 'Flagged' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem',
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}30`,
      borderRadius: 3, fontSize: '0.7rem', fontWeight: 600,
    }}>{c.label}</span>
  );
}

function SeverityPill({ severity }: { severity: string }) {
  const cfg: Record<string, { bg: string; color: string }> = {
    high:   { bg: '#FFF5F5', color: '#991B1B' },
    medium: { bg: '#FFFBEB', color: '#92400E' },
    low:    { bg: '#F0FDF4', color: '#166534' },
  };
  const c = cfg[severity] ?? cfg.low;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem',
      background: c.bg, color: c.color,
      border: `1px solid ${c.color}30`,
      borderRadius: 3, fontSize: '0.7rem', fontWeight: 600, textTransform: 'capitalize',
    }}>{severity}</span>
  );
}

// ── Quick action card ─────────────────────────────────────────────────────────
function ActionCard({ to, icon, label, desc, color }: { to: string; icon: React.ReactNode; label: string; desc: string; color: string }) {
  return (
    <Link to={to} style={{ textDecoration: 'none' }}>
      <div style={{
        border: `1px solid ${T.border}`, borderLeft: `4px solid ${color}`,
        borderRadius: 6, padding: '1rem', background: T.card,
        display: 'flex', alignItems: 'center', gap: '0.875rem',
        transition: 'all 0.15s', cursor: 'pointer',
      }}
        onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)'; e.currentTarget.style.transform = 'translateY(-1px)'; }}
        onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none'; e.currentTarget.style.transform = 'none'; }}
      >
        <div style={{ width: 40, height: 40, borderRadius: 6, background: color + '14', color, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          {icon}
        </div>
        <div style={{ minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>{label}</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>{desc}</p>
        </div>
        <div style={{ marginLeft: 'auto', color: T.textMuted, flexShrink: 0 }}><Icon.ArrowRight /></div>
      </div>
    </Link>
  );
}

// ── Tooltip styles ────────────────────────────────────────────────────────────
const chartTooltipStyle = {
  borderRadius: 4, border: `1px solid ${T.border}`,
  background: T.card, fontSize: 12, color: T.textPrimary,
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
};

// ── Main component ────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { currentAQI, setCurrentAQI, setAnalytics, setReports } = useAppStore();
  const [analytics, setLocalAnalytics] = useState<AnalyticsOverview | null>(null);
  const [reports, setLocalReports]     = useState<Report[]>([]);
  const [insights, setInsights]        = useState<Insights | null>(null);
  const [advisory, setAdvisory]        = useState<AirAdvisory | null>(null);
  const [weather, setWeather]          = useState<{ temperature?: number; humidity?: number; description?: string } | null>(null);
  const [loading, setLoading]          = useState(true);
  const [aiLoading, setAiLoading]      = useState(true);

  useEffect(() => {
    const loadCore = async (): Promise<number> => {
      let liveAQI = currentAQI;
      try {
        const [ana, reps, wx] = await Promise.allSettled([
          api.analytics.overview() as Promise<AnalyticsOverview>,
          api.reports.list({ limit: '8', time_filter: 'all' }) as Promise<Report[]>,
          api.weather.current(),
        ]);
        if (ana.status === 'fulfilled') { setLocalAnalytics(ana.value); setAnalytics(ana.value); }
        if (reps.status === 'fulfilled') { setLocalReports(reps.value); setReports(reps.value); }
        if (wx.status === 'fulfilled') {
          const wxData = wx.value as { weather?: { temperature?: number; humidity?: number; description?: string }; aqi?: number };
          setWeather(wxData.weather ?? null);
          if (wxData.aqi) { setCurrentAQI(wxData.aqi); liveAQI = wxData.aqi; }
        }
      } catch (e) { console.error(e); }
      finally { setLoading(false); }
      return liveAQI;
    };

    // Advisory must use the freshly-fetched AQI, not the store's stale mount-time
    // default -- calling it in parallel with loadCore captured whatever currentAQI
    // was before the real weather/AQI fetch resolved.
    const loadAI = async (aqi: number) => {
      try {
        const [ins, adv] = await Promise.allSettled([
          api.analytics.aiInsights(),
          api.ai.horoscope(aqi),
        ]);
        if (ins.status === 'fulfilled' && ins.value) {
          const raw = ins.value as Record<string, unknown>;
          setInsights((raw.aiInsights ? raw.aiInsights : raw) as Insights);
        }
        if (adv.status === 'fulfilled' && adv.value) setAdvisory(adv.value as AirAdvisory);
      } catch (e) { console.error(e); }
      finally { setAiLoading(false); }
    };

    loadCore().then(loadAI);
  }, []);

  const aqiColor    = getAQIColor(currentAQI);
  const monthlyData = analytics?.monthlyStats ?? [];
  const typeData    = Object.entries(analytics?.typeDistribution ?? {}).map(([k, v]) => ({
    name: k.replace(/_/g, ' '), value: v as number, color: POLL_COLORS[k] ?? '#6B7280',
  }));
  const resolutionRate = analytics && analytics.totalReports > 0
    ? Math.round((analytics.resolvedReports / analytics.totalReports) * 100) : 0;

  if (loading) return (
    <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <Skeleton className="h-36" />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: '1rem' }}>
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {[...Array(2)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* ── Command header ── */}
      <div style={{
        background: T.navy, borderRadius: 8,
        padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden',
      }}>
        {/* Subtle grid texture */}
        <div style={{
          position: 'absolute', inset: 0, opacity: 0.04,
          backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)',
        }} />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
              <span style={{
                display: 'inline-block', padding: '0.15rem 0.6rem',
                background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)',
                border: '1px solid rgba(255,255,255,0.15)',
                borderRadius: 3, fontSize: '0.7rem', fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase',
              }}>
                BBMP — Bruhat Bengaluru Mahanagara Palike
              </span>
            </div>
            <h1 style={{ fontWeight: 800, fontSize: '1.625rem', color: '#FFFFFF', letterSpacing: '-0.025em', margin: '0.375rem 0 0.25rem' }}>
              CleanAir Command Centre
            </h1>
            <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: 0 }}>
              Environmental Monitoring &amp; Citizen Reporting — Bengaluru Urban District
            </p>
            {weather && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.625rem' }}>
                <span style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Icon.Wind /> {weather.temperature?.toFixed(1)}°C &nbsp;·&nbsp; {weather.humidity?.toFixed(0)}% RH &nbsp;·&nbsp; {weather.description}
                </span>
              </div>
            )}
          </div>

          {/* AQI meter */}
          <div style={{
            background: 'rgba(255,255,255,0.08)',
            border: '1px solid rgba(255,255,255,0.12)',
            borderRadius: 8, padding: '1rem 1.5rem',
            display: 'flex', flexDirection: 'column', alignItems: 'center', minWidth: 140,
          }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 600, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Live AQI</p>
            <p style={{ fontSize: '3rem', fontWeight: 800, color: aqiColor, margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>
              {currentAQI}
            </p>
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: aqiColor, marginTop: 4 }}>
              {getAQILabel(currentAQI)}
            </p>
            <div style={{ width: '100%', height: 3, background: 'rgba(255,255,255,0.1)', borderRadius: 2, marginTop: 10, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.min(100, (currentAQI / 300) * 100)}%`, background: aqiColor, borderRadius: 2, transition: 'width 1s ease' }} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '1rem' }}>
        <StatCard title="Total Reports" value={analytics?.totalReports ?? 0}
          subtitle="All time" accentColor={T.navy} icon={<Icon.FileText />} trend={12} />
        <StatCard title="Resolved" value={analytics?.resolvedReports ?? 0}
          subtitle={`${resolutionRate}% resolution rate`} accentColor={T.greenDark} icon={<Icon.CheckCircle />} trend={8} />
        <StatCard title="Pending Review" value={analytics?.pendingReports ?? 0}
          subtitle="Awaiting authority action" accentColor={T.warning} icon={<Icon.Clock />} />
        <StatCard title="Citizens Affected" value={(analytics?.estimatedPeopleAffected ?? 0).toLocaleString('en-IN')}
          subtitle="Est. population impacted" accentColor="#6D28D9" icon={<Icon.Users />} />
      </div>

      {/* ── Quick actions ── */}
      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '0.75rem' }}>
          Quick Actions
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.75rem' }}>
          <ActionCard to="/report"          icon={<Icon.Report />}  color={T.danger}   label="Submit Report"    desc="Flag a pollution incident" />
          <ActionCard to="/tools?tab=waste" icon={<Icon.Recycle />} color="#1E40AF"    label="Classify Waste"  desc="AI waste segregation guide" />
          <ActionCard to="/tools?tab=carbon" icon={<Icon.Globe />}  color="#6D28D9"    label="Carbon Footprint" desc="Calculate your impact" />
          <ActionCard to="/community"       icon={<Icon.Leaf />}    color={T.greenDark} label="Community Events" desc="Join cleanup drives" />
        </div>
      </div>

      {/* ── Air advisory (replaces horoscope) ── */}
      {!aiLoading && advisory && advisory.title && (
        <div style={{
          border: `1px solid ${T.border}`, borderLeft: `4px solid ${T.navy}`,
          borderRadius: 6, background: T.card, padding: '1.125rem 1.25rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.5rem' }}>
            <div style={{ color: T.navy }}><Icon.Wind /></div>
            <span style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Daily Air Quality Advisory
            </span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'flex-start' }}>
            <div style={{ flex: 1, minWidth: 220 }}>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, marginBottom: 4 }}>{advisory.title}</p>
              <p style={{ fontSize: '0.875rem', color: T.textMuted, lineHeight: 1.6 }}>{advisory.forecast}</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', marginTop: '0.625rem' }}>
                {advisory.best_time_outdoor && <span style={{ fontSize: '0.8125rem', color: T.textMuted }}>Best outdoor time: <strong style={{ color: T.textPrimary }}>{advisory.best_time_outdoor}</strong></span>}
                {advisory.outdoor_rating && <span style={{ fontSize: '0.8125rem', color: T.textMuted }}>Rating: <strong style={{ color: T.textPrimary }}>{advisory.outdoor_rating}</strong></span>}
                {advisory.mask_tip && <span style={{ fontSize: '0.8125rem', color: T.textMuted }}>Protection: <strong style={{ color: T.textPrimary }}>{advisory.mask_tip}</strong></span>}
              </div>
            </div>
            {advisory.eco_tip_of_day && (
              <div style={{
                padding: '0.75rem 1rem', background: '#F0FDF4',
                border: '1px solid #BBF7D0', borderRadius: 6, maxWidth: 280,
              }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: T.greenDark, textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>
                  Eco Tip
                </p>
                <p style={{ fontSize: '0.8125rem', color: '#166534', lineHeight: 1.5, margin: 0 }}>{advisory.eco_tip_of_day}</p>
              </div>
            )}
          </div>
        </div>
      )}
      {aiLoading && <Skeleton className="h-24" style={{ borderRadius: 6 }} />}

      {/* ── AI Insights ── */}
      {!aiLoading && insights && insights.headline && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          {/* Header */}
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ color: T.navy }}><Icon.Brain /></div>
            <span style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary }}>AI Environmental Intelligence</span>
          </div>
          <div style={{ padding: '1.125rem 1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Headline alert */}
            <div style={{
              padding: '0.625rem 0.875rem',
              background: '#FFFBEB', border: '1px solid #FCD34D', borderRadius: 4,
              fontSize: '0.875rem', fontWeight: 600, color: '#92400E',
            }}>
              {insights.headline}
            </div>
            {/* Insight cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem' }}>
              {(insights.insights ?? []).map((ins, i) => {
                const priorityCfg = {
                  high:   { border: '#FECACA', bg: '#FFF5F5', badge: '#991B1B', badgeBg: '#FEE2E2' },
                  medium: { border: '#FDE68A', bg: '#FFFBEB', badge: '#92400E', badgeBg: '#FEF3C7' },
                  low:    { border: '#BBF7D0', bg: '#F0FDF4', badge: '#166534', badgeBg: '#D1FAE5' },
                }[ins.priority] ?? { border: T.border, bg: T.surface, badge: T.textMuted, badgeBg: '#F5F7FA' };
                return (
                  <div key={i} style={{
                    padding: '0.875rem', border: `1px solid ${priorityCfg.border}`,
                    borderRadius: 6, background: priorityCfg.bg,
                  }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>{ins.title}</p>
                      <span style={{
                        padding: '0.1rem 0.45rem', background: priorityCfg.badgeBg,
                        color: priorityCfg.badge, border: `1px solid ${priorityCfg.badge}30`,
                        borderRadius: 3, fontSize: '0.68rem', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.04em', flexShrink: 0,
                      }}>{ins.priority}</span>
                    </div>
                    <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: 0, lineHeight: 1.5 }}>{ins.description}</p>
                  </div>
                );
              })}
            </div>
            {/* Score bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <p style={{ fontSize: '0.75rem', color: T.textMuted, flexShrink: 0 }}>Environmental Score</p>
              <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ height: '100%', width: `${insights.environmental_score ?? 60}%`, background: T.navy, borderRadius: 3, transition: 'width 1s ease' }} />
              </div>
              <span style={{ fontWeight: 700, fontSize: '0.875rem', color: T.navy, flexShrink: 0 }}>{insights.environmental_score ?? 60}/100</span>
              {insights.trend && (
                <span style={{
                  padding: '0.15rem 0.5rem', borderRadius: 3, fontSize: '0.75rem', fontWeight: 600,
                  textTransform: 'capitalize', flexShrink: 0,
                  ...(insights.trend === 'improving'
                    ? { background: '#F0FDF4', color: '#166534', border: '1px solid #BBF7D0' }
                    : insights.trend === 'worsening'
                    ? { background: '#FFF5F5', color: '#991B1B', border: '1px solid #FECACA' }
                    : { background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE' }),
                }}>{insights.trend}</span>
              )}
            </div>
          </div>
        </div>
      )}
      {aiLoading && <Skeleton className="h-52" style={{ borderRadius: 6 }} />}

      {/* ── Charts ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
        {/* Monthly trend */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Monthly Incident Trend</p>
            <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>Reports submitted vs resolved by month</p>
          </div>
          <div style={{ padding: '1rem' }}>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="gR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.navy} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={T.navy} stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="gG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={T.green} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={T.green} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                  <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                  <Tooltip contentStyle={chartTooltipStyle} />
                  <Area type="monotone" dataKey="reports" stroke={T.navy} fill="url(#gR)" strokeWidth={2} name="Reports" />
                  <Area type="monotone" dataKey="resolved" stroke={T.green} fill="url(#gG)" strokeWidth={2} name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: '0.875rem' }}>
                No data recorded yet
              </div>
            )}
          </div>
        </div>

        {/* Pollution type breakdown */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Incident Breakdown</p>
            <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>By pollution category</p>
          </div>
          <div style={{ padding: '1rem' }}>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={150}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={38} outerRadius={65} paddingAngle={2} dataKey="value">
                      {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={chartTooltipStyle} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {typeData.slice(0, 5).map((t, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 10, height: 10, borderRadius: 2, background: t.color, flexShrink: 0, display: 'inline-block' }} />
                      <span style={{ fontSize: '0.75rem', color: T.textMuted, flex: 1, textTransform: 'capitalize', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</span>
                      <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textPrimary }}>{t.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div style={{ height: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: '0.875rem' }}>No data yet</div>
            )}
          </div>
        </div>
      </div>

      {/* ── Ward rankings + Recent reports ── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>

        {/* Ward rankings */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Ward Pollution Index</p>
            <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>Ranked by incident count</p>
          </div>
          <div style={{ padding: '0.75rem 1.25rem' }}>
            {(analytics?.wardRankings ?? []).length === 0 ? (
              <p style={{ textAlign: 'center', color: T.textMuted, padding: '2rem 0', fontSize: '0.875rem' }}>No ward data available</p>
            ) : (analytics?.wardRankings ?? []).slice(0, 7).map((w, i) => {
              const max = analytics?.wardRankings?.[0]?.count ?? 1;
              const pct = Math.round((w.count / max) * 100);
              return (
                <div key={w.ward} style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', borderBottom: i < 6 ? `1px solid ${T.border}` : 'none' }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 700,
                    background: i < 3 ? '#FFF5F5' : T.surface,
                    color: i < 3 ? T.danger : T.textMuted,
                    border: `1px solid ${i < 3 ? '#FECACA' : T.border}`,
                  }}>{i + 1}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.textPrimary, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.ward}</span>
                      <span style={{ fontSize: '0.75rem', color: T.textMuted, flexShrink: 0, marginLeft: 8 }}>{w.count}</span>
                    </div>
                    <div style={{ height: 4, background: T.border, borderRadius: 2, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: i < 3 ? T.danger : T.navy, borderRadius: 2 }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Recent reports */}
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Recent Incidents</p>
              <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>Latest citizen reports</p>
            </div>
            <Link to="/map" style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.navy, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              View all <Icon.ArrowRight />
            </Link>
          </div>
          <div>
            {reports.length === 0 ? (
              <p style={{ textAlign: 'center', color: T.textMuted, padding: '2rem', fontSize: '0.875rem' }}>No incidents reported yet</p>
            ) : reports.slice(0, 5).map((r, i) => (
              <div key={r.id} style={{
                padding: '0.75rem 1.25rem',
                borderBottom: i < Math.min(reports.length, 5) - 1 ? `1px solid ${T.border}` : 'none',
                transition: 'background 0.1s',
              }}
                onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
                  {/* Type indicator */}
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', marginTop: 6, flexShrink: 0,
                    background: POLL_COLORS[r.pollutionType] ?? '#6B7280',
                  }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 3 }}>
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: T.textPrimary, textTransform: 'capitalize' }}>
                        {r.pollutionType.replace(/_/g, ' ')}
                      </span>
                      <SeverityPill severity={r.severity} />
                      <StatusPill status={r.status} />
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ fontSize: '0.75rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Icon.MapPin /> {r.location?.ward}
                      </span>
                      <span style={{ fontSize: '0.7rem', color: T.border }}>·</span>
                      <span style={{ fontSize: '0.75rem', color: T.textMuted }}>{formatTimeAgo(r.createdAt)}</span>
                    </div>
                    {r.description && (
                      <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '3px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.description.slice(0, 80)}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── AQI bar chart ── */}
      {monthlyData.length > 0 && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Average AQI by Month</p>
            <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>Historical air quality index — Bengaluru</p>
          </div>
          <div style={{ padding: '1rem' }}>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData} barSize={28}>
                <CartesianGrid strokeDasharray="3 3" stroke={T.border} />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: T.textMuted }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={chartTooltipStyle} />
                <Bar dataKey="avgAQI" name="Avg AQI" radius={[3, 3, 0, 0]}>
                  {monthlyData.map((e, i) => <Cell key={i} fill={getAQIColor(e.avgAQI)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

    </div>
  );
}