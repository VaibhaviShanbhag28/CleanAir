import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Skeleton, toast } from '@/components/ui';
import type { KarmaEntry } from '@/types';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  navy:      '#0A2240',
  green:     '#1A6B3C',
  greenDark: '#166534',
  surface:   '#F5F7FA',
  border:    '#DDE2EA',
  textPrimary:'#0D1B2A',
  textMuted:  '#4A5568',
  danger:    '#991B1B',
  warning:   '#92400E',
  card:      '#FFFFFF',
};

// ── Rank tiers ────────────────────────────────────────────────────────────────
const TIERS = [
  { label: 'Seedling',        min: 0,    color: '#166534', bg: '#F0FDF4', border: '#BBF7D0' },
  { label: 'Sapling',         min: 100,  color: '#0F766E', bg: '#F0FDFA', border: '#99F6E4' },
  { label: 'Grove Keeper',    min: 500,  color: '#1E40AF', bg: '#EFF6FF', border: '#BFDBFE' },
  { label: 'Eco Warrior',     min: 1000, color: '#6D28D9', bg: '#F5F3FF', border: '#DDD6FE' },
  { label: 'City Guardian',   min: 2000, color: '#B45309', bg: '#FFFBEB', border: '#FDE68A' },
  { label: 'Planet Protector',min: 5000, color: '#991B1B', bg: '#FFF5F5', border: '#FECACA' },
];

// ── Eco actions ───────────────────────────────────────────────────────────────
const ACTIONS = [
  { action: 'report_submitted',     label: 'Submit Pollution Report', desc: 'File a new pollution incident',          points: 10, accentColor: '#991B1B' },
  { action: 'report_verified',      label: 'Verified Report',         desc: 'Your report confirmed by authority',     points: 25, accentColor: '#1E40AF' },
  { action: 'tree_planted',         label: 'Plant a Tree',            desc: 'Document a tree plantation',            points: 20, accentColor: '#166534' },
  { action: 'cleanup_participated', label: 'Join Cleanup Drive',      desc: 'Attend a community cleanup event',      points: 30, accentColor: '#0A2240' },
  { action: 'eco_transport',        label: 'Eco Transport Used',      desc: 'Commuted by metro, cycle, or on foot',  points: 5,  accentColor: '#0F766E' },
  { action: 'diary_entry',          label: 'Log Field Diary Entry',   desc: 'Record an environmental observation',   points: 3,  accentColor: '#6D28D9' },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Star: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Award: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Zap: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/>
    </svg>
  ),
  Trophy: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="8 22 12 17 16 22"/>
      <path d="M7 2h10v10a5 5 0 0 1-10 0V2z"/>
      <path d="M7 7H3a2 2 0 0 0 0 4h4"/><path d="M17 7h4a2 2 0 0 1 0 4h-4"/>
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
  Leaf: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 22.2"/>
      <path d="M21 4a20 20 0 0 1-3 0c-3.41-.17-6.78-1-10-3 0 7 4 12 8 13"/>
    </svg>
  ),
  Users: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Bike: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="5.5" cy="17.5" r="3.5"/><circle cx="18.5" cy="17.5" r="3.5"/>
      <path d="M15 6a1 1 0 0 0-1 1v5.91a1 1 0 0 0 .5.87l3 1.73"/>
      <polyline points="15 6 11 2 8 2 8 6"/>
    </svg>
  ),
  Book: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
};

const ACTION_ICONS: Record<string, React.ReactNode> = {
  report_submitted:     <Icon.FileText />,
  report_verified:      <Icon.CheckCircle />,
  tree_planted:         <Icon.Leaf />,
  cleanup_participated: <Icon.Users />,
  eco_transport:        <Icon.Bike />,
  diary_entry:          <Icon.Book />,
};

type Tab = 'my' | 'city' | 'earn';

export default function KarmaPage() {
  const { user } = useAppStore();
  const [karma, setKarma]           = useState<KarmaEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<KarmaEntry[]>([]);
  const [tab, setTab]               = useState<Tab>('my');
  const [loading, setLoading]       = useState(true);
  const [logging, setLogging]       = useState('');

  const uid = user?.uid || 'user01';

  useEffect(() => {
    Promise.all([
      api.karma.get(uid) as Promise<KarmaEntry>,
      api.karma.cityLeaderboard(20) as Promise<KarmaEntry[]>,
    ]).then(([k, lb]) => { setKarma(k); setLeaderboard(lb); setLoading(false); })
      .catch(() => setLoading(false));
  }, [uid]);

  const logAction = async (action: string) => {
    setLogging(action);
    try {
      const updated = await api.karma.add(uid, action) as KarmaEntry;
      setKarma(updated);
      const lb = await api.karma.cityLeaderboard(20) as KarmaEntry[];
      setLeaderboard(lb);
      toast('Action recorded. Karma updated.', 'success');
    } catch { toast('Failed to log action.', 'error'); }
    finally { setLogging(''); }
  };

  const score      = karma?.score ?? 0;
  const currentTier = [...TIERS].reverse().find(t => score >= t.min) ?? TIERS[0];
  const nextTier    = TIERS.find(t => t.min > score);
  const progress    = nextTier ? Math.min(100, Math.round((score / nextTier.min) * 100)) : 100;
  const myRank      = leaderboard.findIndex(l => l.userId === uid) + 1;

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

      {/* ── Page header ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Icon.Star />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            Citizen Karma Score
          </h1>
        </div>
        <p style={{ color: T.textMuted, fontSize: '0.875rem', margin: 0 }}>
          Your cumulative environmental contribution index for Bengaluru
        </p>
      </div>

      {/* ── Score hero panel ── */}
      <div style={{ background: T.navy, borderRadius: 8, padding: '1.5rem 2rem', position: 'relative', overflow: 'hidden' }}>
        {/* Grid texture */}
        <div style={{ position: 'absolute', inset: 0, opacity: 0.04, backgroundImage: 'repeating-linear-gradient(0deg,#fff 0,#fff 1px,transparent 1px,transparent 32px),repeating-linear-gradient(90deg,#fff 0,#fff 1px,transparent 1px,transparent 32px)' }} />
        <div style={{ position: 'relative', display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '2rem' }}>
          {/* Score */}
          <div style={{ textAlign: 'center', minWidth: 120 }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Karma Score</p>
            <p style={{ fontSize: '4rem', fontWeight: 800, color: 'white', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>{score.toLocaleString()}</p>
            <span style={{
              display: 'inline-block', marginTop: 8,
              padding: '0.2rem 0.625rem',
              background: currentTier.bg, color: currentTier.color,
              border: `1px solid ${currentTier.border}`,
              borderRadius: 3, fontSize: '0.75rem', fontWeight: 700,
            }}>{currentTier.label}</span>
          </div>

          {/* Progress to next tier */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <p style={{ fontWeight: 700, fontSize: '1rem', color: 'white', margin: '0 0 2px' }}>
              {karma?.badge || currentTier.label}
            </p>
            <p style={{ fontSize: '0.8125rem', color: 'rgba(255,255,255,0.55)', margin: '0 0 12px' }}>
              Ward: {karma?.ward || 'Not assigned'}
            </p>
            {nextTier && (
              <>
                <div style={{ height: 5, background: 'rgba(255,255,255,0.12)', borderRadius: 3, overflow: 'hidden', marginBottom: 6 }}>
                  <div style={{ height: '100%', width: `${progress}%`, background: 'white', borderRadius: 3, transition: 'width 1s ease' }} />
                </div>
                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)', margin: 0 }}>
                  {(nextTier.min - score).toLocaleString()} points to <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{nextTier.label}</strong>
                </p>
              </>
            )}
            {!nextTier && (
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', margin: 0 }}>Maximum tier achieved</p>
            )}
          </div>
        </div>
      </div>

      {/* ── KPI strip ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '0.875rem' }}>
        {[
          { label: 'Reports Filed',  value: karma?.reportsCount ?? 0,   color: T.navy,    icon: <Icon.FileText /> },
          { label: 'Resolved',       value: karma?.resolvedCount ?? 0,   color: T.greenDark, icon: <Icon.CheckCircle /> },
          { label: 'Activity Streak',value: `${karma?.streak ?? 0} days`, color: '#B45309', icon: <Icon.Zap /> },
          { label: 'City Rank',      value: myRank > 0 ? `#${myRank}` : '—', color: '#6D28D9', icon: <Icon.Trophy /> },
        ].map(s => (
          <div key={s.label} style={{
            border: `1px solid ${T.border}`, borderTop: `3px solid ${s.color}`,
            borderRadius: 6, padding: '1rem 1.125rem', background: T.card,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: 0 }}>{s.label}</p>
              <span style={{ color: s.color }}>{s.icon}</span>
            </div>
            <p style={{ fontSize: '1.625rem', fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em' }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* ── Tab nav ── */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }}>
        {([['my', 'My Profile', <Icon.Star />], ['city', 'City Leaderboard', <Icon.BarChart />], ['earn', 'Log Actions', <Icon.Plus />]] as const).map(([v, l, ic]) => (
          <button key={v} onClick={() => setTab(v as Tab)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.625rem 1.125rem', border: 'none',
              borderBottom: tab === v ? `2px solid ${T.navy}` : '2px solid transparent',
              background: 'transparent', color: tab === v ? T.navy : T.textMuted,
              fontWeight: tab === v ? 700 : 500, fontSize: '0.875rem',
              cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s',
            }}
          >
            <span style={{ color: tab === v ? T.navy : T.textMuted }}>{ic}</span>
            {l}
          </button>
        ))}
      </div>

      {/* ── My Profile ── */}
      {tab === 'my' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>

          {/* Tier progression */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: T.navy }}><Icon.Award /></span>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Tier Progression</p>
            </div>
            <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(120px,1fr))', gap: '0.625rem' }}>
              {TIERS.map(t => {
                const earned = score >= t.min;
                return (
                  <div key={t.label} style={{
                    padding: '0.875rem 0.5rem', textAlign: 'center',
                    border: `1.5px solid ${earned ? t.border : T.border}`,
                    borderRadius: 6, background: earned ? t.bg : T.surface,
                    opacity: earned ? 1 : 0.45, transition: 'all 0.2s',
                  }}>
                    <div style={{
                      width: 36, height: 36, borderRadius: '50%', margin: '0 auto 8px',
                      background: earned ? t.color : T.border,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <span style={{ color: 'white', fontSize: '0.875rem' }}><Icon.Award /></span>
                    </div>
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: earned ? t.color : T.textMuted, margin: '0 0 2px' }}>{t.label}</p>
                    <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0 }}>{t.min.toLocaleString()} pts</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Activity history */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
            <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ color: T.navy }}><Icon.Zap /></span>
              <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Recent Activity</p>
            </div>
            {(karma?.history ?? []).length === 0 ? (
              <div style={{ padding: '3rem', textAlign: 'center', color: T.textMuted }}>
                <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: T.textPrimary, marginBottom: 4 }}>No Activity Yet</p>
                <p style={{ fontSize: '0.875rem' }}>Log eco actions or submit reports to begin earning Karma.</p>
              </div>
            ) : (
              <div>
                {(karma?.history ?? []).slice(0, 10).map((h, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: '0.875rem',
                    padding: '0.75rem 1.25rem',
                    borderBottom: i < Math.min((karma?.history ?? []).length, 10) - 1 ? `1px solid ${T.border}` : 'none',
                    transition: 'background 0.1s',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <div style={{
                      width: 32, height: 32, borderRadius: 6,
                      background: T.navy + '12', color: T.navy,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      <Icon.Zap />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{h.description}</p>
                      <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>
                        {new Date(h.timestamp).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    <span style={{
                      fontWeight: 800, fontSize: '0.9375rem', flexShrink: 0,
                      color: h.points > 0 ? T.greenDark : T.danger,
                    }}>
                      {h.points > 0 ? '+' : ''}{h.points}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── City Leaderboard ── */}
      {tab === 'city' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ color: T.navy }}><Icon.Trophy /></span>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>City Leaderboard</p>
            <span style={{ fontSize: '0.75rem', color: T.textMuted, marginLeft: 4 }}>Top {leaderboard.length} citizens</span>
          </div>
          <div>
            {leaderboard.map((l, i) => {
              const isMe = l.userId === uid;
              const rankColor = i === 0 ? '#B45309' : i === 1 ? '#374151' : i === 2 ? '#92400E' : T.textMuted;
              const rankBg    = i === 0 ? '#FFFBEB' : i === 1 ? '#F9FAFB' : i === 2 ? '#FFF7ED' : T.surface;
              return (
                <div key={l.userId} style={{
                  display: 'flex', alignItems: 'center', gap: '0.875rem',
                  padding: '0.75rem 1.25rem',
                  borderBottom: i < leaderboard.length - 1 ? `1px solid ${T.border}` : 'none',
                  background: isMe ? `${T.navy}08` : 'transparent',
                  borderLeft: isMe ? `3px solid ${T.navy}` : '3px solid transparent',
                  transition: 'background 0.1s',
                }}>
                  {/* Rank */}
                  <div style={{
                    width: 28, height: 28, borderRadius: 4, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: rankBg, color: rankColor,
                    fontSize: i < 3 ? '0.875rem' : '0.75rem',
                    fontWeight: 800, border: `1px solid ${rankColor}30`,
                  }}>
                    {i + 1}
                  </div>

                  {/* Avatar initial */}
                  <div style={{
                    width: 36, height: 36, borderRadius: 6, flexShrink: 0,
                    background: T.navy, color: 'white',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontWeight: 800, fontSize: '0.9375rem',
                  }}>
                    {(l.displayName || 'U')[0].toUpperCase()}
                  </div>

                  {/* Name + badge */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {l.displayName}
                      </p>
                      {isMe && (
                        <span style={{ padding: '0.1rem 0.45rem', background: `${T.navy}12`, color: T.navy, border: `1px solid ${T.navy}30`, borderRadius: 3, fontSize: '0.68rem', fontWeight: 700 }}>
                          You
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>
                      {l.badge} &nbsp;·&nbsp; {l.ward} &nbsp;·&nbsp; {l.reportsCount} reports
                    </p>
                  </div>

                  {/* Score */}
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <p style={{ fontWeight: 800, fontSize: '1rem', color: T.navy, margin: 0, letterSpacing: '-0.01em' }}>
                      {l.score.toLocaleString()}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0 }}>pts</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Log Actions ── */}
      {tab === 'earn' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
          <div style={{ padding: '0.875rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, fontSize: '0.875rem', color: '#1E3A8A' }}>
            Log verified eco-friendly actions to earn Karma points. Points are added instantly to your score and leaderboard rank.
          </div>
          {ACTIONS.map(a => (
            <div key={a.action} style={{
              border: `1px solid ${T.border}`, borderLeft: `4px solid ${a.accentColor}`,
              borderRadius: 6, background: T.card, padding: '1rem 1.25rem',
              display: 'flex', alignItems: 'center', gap: '1rem',
              transition: 'box-shadow 0.15s',
            }}
              onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
              onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
            >
              {/* Icon */}
              <div style={{
                width: 40, height: 40, borderRadius: 6, flexShrink: 0,
                background: a.accentColor + '12', color: a.accentColor,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                {ACTION_ICONS[a.action]}
              </div>

              {/* Label */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: T.textPrimary, margin: 0 }}>{a.label}</p>
                <p style={{ fontSize: '0.8rem', color: T.textMuted, margin: '2px 0 0' }}>{a.desc}</p>
              </div>

              {/* Points badge + button */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span style={{
                  padding: '0.25rem 0.625rem',
                  background: a.accentColor + '12', color: a.accentColor,
                  border: `1px solid ${a.accentColor}30`,
                  borderRadius: 4, fontSize: '0.8125rem', fontWeight: 800,
                }}>+{a.points} pts</span>
                <button
                  onClick={() => logAction(a.action)}
                  disabled={logging === a.action}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 5,
                    padding: '0.5rem 1rem',
                    background: logging === a.action ? '#9CA3AF' : T.navy,
                    color: 'white', border: 'none', borderRadius: 4,
                    fontWeight: 600, fontSize: '0.8125rem',
                    cursor: logging === a.action ? 'not-allowed' : 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {logging === a.action
                    ? <span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} />
                    : <Icon.Plus />}
                  Log
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}