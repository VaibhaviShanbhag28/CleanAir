import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Modal, toast } from '@/components/ui';
import type { CommunityEvent, CleanupChallenge } from '@/types';

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

type Tab = 'events' | 'challenges' | 'tips' | 'street';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Users: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/>
      <path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>
    </svg>
  ),
  Shield: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
    </svg>
  ),
  BarChart: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/><line x1="2" y1="20" x2="22" y2="20"/>
    </svg>
  ),
  Award: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="8" r="7"/><polyline points="8.21 13.89 7 23 12 20 17 23 15.79 13.88"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  MapPin: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  ThumbsUp: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
      <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
    </svg>
  ),
  AlertTriangle: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
      <line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/>
    </svg>
  ),
  Leaf: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 8C8 10 5.9 16.17 3.82 22.2"/><path d="M21 4a20 20 0 0 1-3 0c-3.41-.17-6.78-1-10-3 0 7 4 12 8 13"/>
    </svg>
  ),
};

// ── Shared input styles ───────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
  border: `1.5px solid ${T.border}`, borderRadius: 4,
  fontSize: '0.875rem', color: T.textPrimary,
  background: 'white', outline: 'none', boxSizing: 'border-box',
  fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.75rem',
  color: T.textPrimary, marginBottom: '0.375rem',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};
const primaryBtn = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0.5625rem 1.25rem', background: disabled ? '#9CA3AF' : T.navy,
  color: 'white', border: 'none', borderRadius: 4,
  fontWeight: 600, fontSize: '0.8125rem', cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s', letterSpacing: '0.01em', whiteSpace: 'nowrap' as const,
});
const outlineBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0.5rem 1rem', background: 'white',
  color: T.navy, border: `1.5px solid ${T.navy}`,
  borderRadius: 4, fontWeight: 600, fontSize: '0.8125rem',
  cursor: 'pointer', transition: 'all 0.15s',
};

// ── Category badge ────────────────────────────────────────────────────────────
function CatBadge({ cat }: { cat: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string; label: string }> = {
    cleanup:    { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0', label: 'Cleanup Drive' },
    plantation: { bg: '#EFF6FF', color: '#1E40AF', border: '#BFDBFE', label: 'Plantation' },
    awareness:  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Awareness' },
  };
  const c = cfg[cat] ?? cfg.awareness;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.6rem',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 3, fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.05em',
    }}>{c.label}</span>
  );
}

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const cfg: Record<string, { bg: string; color: string; border: string }> = {
    verified: { bg: '#F0FDF4', color: '#166534', border: '#BBF7D0' },
    pending:  { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    rejected: { bg: '#FFF5F5', color: '#991B1B', border: '#FECACA' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span style={{
      display: 'inline-block', padding: '0.15rem 0.5rem',
      background: c.bg, color: c.color, border: `1px solid ${c.border}`,
      borderRadius: 3, fontSize: '0.7rem', fontWeight: 700,
      textTransform: 'uppercase', letterSpacing: '0.04em',
    }}>{status}</span>
  );
}

// ── Metric bar ────────────────────────────────────────────────────────────────
function MetricBar({ label, value, color = T.navy }: { label: string; value: number; color?: string }) {
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: '0.8125rem', color: T.textMuted }}>{label}</span>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.textPrimary }}>{value?.toFixed(0)}</span>
      </div>
      <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, value ?? 0)}%`, background: color, borderRadius: 3, transition: 'width 0.8s ease' }} />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function CommunityPage() {
  const { user } = useAppStore();
  const [tab, setTab]                           = useState<Tab>('events');
  const [events, setEvents]                     = useState<CommunityEvent[]>([]);
  const [challenges, setChallenges]             = useState<CleanupChallenge[]>([]);
  const [streetWard, setStreetWard]             = useState('Koramangala');
  const [streetScore, setStreetScore]           = useState<Record<string, unknown> | null>(null);
  const [loadingStreet, setLoadingStreet]       = useState(false);
  const [createEventModal, setCreateEventModal] = useState(false);
  const [tipModal, setTipModal]                 = useState(false);
  const [eventForm, setEventForm] = useState({
    title: '', description: '', location: '', date: '',
    time: '07:00', maxVolunteers: '50', category: 'cleanup',
  });
  const [tipForm, setTipForm] = useState({ category: 'illegal_dumping', description: '', location: '' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading]       = useState(true);

  useEffect(() => {
    Promise.all([
      api.community.events() as Promise<CommunityEvent[]>,
      api.community.challenges() as Promise<CleanupChallenge[]>,
    ]).then(([ev, ch]) => { setEvents(ev); setChallenges(ch); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const fetchStreet = async () => {
    setLoadingStreet(true);
    try { setStreetScore(await api.community.streetScore(streetWard) as Record<string, unknown>); }
    catch { toast('Unable to fetch ward score. Please try again.', 'error'); }
    finally { setLoadingStreet(false); }
  };

  const submitEvent = async () => {
    if (!eventForm.title || !eventForm.location || !eventForm.date) {
      toast('Title, location and date are required.', 'error'); return;
    }
    setSubmitting(true);
    try {
      const ev = await api.community.createEvent({
        ...eventForm,
        organizerId: user?.uid || 'anonymous',
        maxVolunteers: parseInt(eventForm.maxVolunteers),
      }) as CommunityEvent;
      setEvents(e => [ev, ...e]);
      setCreateEventModal(false);
      setEventForm({ title: '', description: '', location: '', date: '', time: '07:00', maxVolunteers: '50', category: 'cleanup' });
      toast('Event created successfully.', 'success');
    } catch { toast('Failed to create event. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  const submitTip = async () => {
    if (!tipForm.description.trim()) { toast('Description is required.', 'error'); return; }
    setSubmitting(true);
    try {
      await api.community.submitTip({ ...tipForm, contactEmail: user?.email });
      setTipModal(false);
      setTipForm({ category: 'illegal_dumping', description: '', location: '' });
      toast('Tip submitted. Your identity is protected.', 'success');
    } catch { toast('Failed to submit tip. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  const joinEvent = async (id: string) => {
    try {
      await api.community.joinEvent(id, user?.uid || 'anonymous');
      setEvents(ev => ev.map(e => e.id === id ? { ...e, volunteers: e.volunteers + 1 } : e));
      toast('Registered for event. +30 Karma awarded.', 'success');
    } catch { toast('Failed to register for event.', 'error'); }
  };

  const TABS: { key: Tab; label: string; icon: React.ReactNode }[] = [
    { key: 'events',     label: 'Community Events',   icon: <Icon.Users /> },
    { key: 'challenges', label: 'Cleanup Challenges',  icon: <Icon.Award /> },
    { key: 'tips',       label: 'Confidential Tips',   icon: <Icon.Shield /> },
    { key: 'street',     label: 'Ward Score',          icon: <Icon.BarChart /> },
  ];

  const ss = streetScore as Record<string, number & string> | null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
              <div style={{ width: 36, height: 36, borderRadius: 6, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}>
                <Icon.Users />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
                Citizen Community Portal
              </h1>
            </div>
            <p style={{ color: T.textMuted, fontSize: '0.875rem', margin: 0 }}>
              Organise events, report violations, and monitor ward health scores
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            <button style={outlineBtn} onClick={() => setTipModal(true)}>
              <Icon.Lock /> Confidential Tip
            </button>
            <button style={primaryBtn()} onClick={() => setCreateEventModal(true)}>
              <Icon.Plus /> Create Event
            </button>
          </div>
        </div>
      </div>

      {/* ── Tab navigation ── */}
      <div style={{ display: 'flex', gap: '0.25rem', borderBottom: `1px solid ${T.border}`, overflowX: 'auto' }}>
        {TABS.map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '0.625rem 1.125rem',
              border: 'none', borderBottom: tab === t.key ? `2px solid ${T.navy}` : '2px solid transparent',
              background: 'transparent',
              color: tab === t.key ? T.navy : T.textMuted,
              fontWeight: tab === t.key ? 700 : 500,
              fontSize: '0.875rem', cursor: 'pointer',
              whiteSpace: 'nowrap', transition: 'all 0.15s',
              marginBottom: -1,
            }}
          >
            <span style={{ color: tab === t.key ? T.navy : T.textMuted }}>{t.icon}</span>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── Events ── */}
      {tab === 'events' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {loading
            ? [...Array(4)].map((_, i) => (
                <div key={i} style={{ height: 220, background: T.surface, borderRadius: 6, animation: 'pulse 1.5s infinite' }} />
              ))
            : events.length === 0 ? (
                <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: T.textMuted }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: T.navy }}>
                    <Icon.Users />
                  </div>
                  <p style={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, marginBottom: 6 }}>No Events Scheduled</p>
                  <p style={{ fontSize: '0.875rem', color: T.textMuted, marginBottom: '1.25rem' }}>Create the first community event to get started.</p>
                  <button style={primaryBtn()} onClick={() => setCreateEventModal(true)}>
                    <Icon.Plus /> Create Event
                  </button>
                </div>
              )
            : events.map(e => {
                const pct = Math.min(100, Math.round((e.volunteers / e.maxVolunteers) * 100));
                const full = e.volunteers >= e.maxVolunteers;
                return (
                  <div
                    key={e.id}
                    style={{
                      border: `1px solid ${T.border}`, borderRadius: 6,
                      background: T.card, overflow: 'hidden',
                      transition: 'box-shadow 0.15s',
                    }}
                    onMouseEnter={el => (el.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
                    onMouseLeave={el => (el.currentTarget.style.boxShadow = 'none')}
                  >
                    {/* Top accent by category */}
                    <div style={{ height: 3, background: e.category === 'cleanup' ? T.greenDark : e.category === 'plantation' ? '#1E40AF' : T.warning }} />
                    <div style={{ padding: '1rem 1.125rem' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.625rem', gap: 8 }}>
                        <CatBadge cat={e.category} />
                        <span style={{ fontSize: '0.75rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <Icon.Calendar /> {e.date} · {e.time}
                        </span>
                      </div>
                      <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, marginBottom: 4 }}>{e.title}</h3>
                      <p style={{ fontSize: '0.8125rem', color: T.textMuted, lineHeight: 1.5, marginBottom: '0.625rem' }}>{e.description}</p>
                      <p style={{ fontSize: '0.8125rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.875rem' }}>
                        <Icon.MapPin /> {e.location}
                      </p>

                      {/* Volunteer progress */}
                      <div style={{ marginBottom: '0.75rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontSize: '0.75rem', color: T.textMuted }}>Volunteers registered</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textPrimary }}>
                            {e.volunteers} / {e.maxVolunteers}
                          </span>
                        </div>
                        <div style={{ height: 5, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{
                            height: '100%', width: `${pct}%`, borderRadius: 3,
                            background: full ? T.danger : T.greenDark,
                            transition: 'width 0.6s ease',
                          }} />
                        </div>
                      </div>

                      <button
                        onClick={() => joinEvent(e.id)}
                        disabled={full}
                        style={primaryBtn(full)}
                      >
                        {full ? 'Registration Full' : 'Register to Attend'}
                      </button>
                    </div>
                  </div>
                );
              })
          }
        </div>
      )}

      {/* ── Challenges ── */}
      {tab === 'challenges' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(300px,1fr))', gap: '1rem' }}>
          {challenges.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0' }}>
              <div style={{ width: 48, height: 48, borderRadius: 8, background: T.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem', color: T.navy }}>
                <Icon.Award />
              </div>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, marginBottom: 6 }}>No Active Challenges</p>
              <p style={{ fontSize: '0.875rem', color: T.textMuted }}>
                Clean an area, photograph the before and after, and submit a cleanup challenge.
              </p>
            </div>
          ) : challenges.map(c => (
            <div
              key={c.id}
              style={{
                border: `1px solid ${T.border}`, borderRadius: 6,
                background: T.card, padding: '1rem 1.125rem',
                transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={el => (el.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
              onMouseLeave={el => (el.currentTarget.style.boxShadow = 'none')}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.5rem' }}>
                <StatusBadge status={c.status} />
                <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <Icon.ThumbsUp /> {c.votes}
                </span>
              </div>
              <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, marginBottom: 4 }}>{c.title}</h3>
              <p style={{ fontSize: '0.8125rem', color: T.textMuted, lineHeight: 1.5, marginBottom: '0.5rem' }}>{c.description}</p>
              <p style={{ fontSize: '0.8125rem', color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4, marginBottom: '0.875rem' }}>
                <Icon.MapPin /> {c.location}
              </p>
              <button
                style={outlineBtn}
                onClick={() => api.community.voteChallenge(c.id)
                  .then(() => toast('Vote recorded.', 'success'))
                  .catch(() => toast('Failed to vote.', 'error'))}
              >
                <Icon.ThumbsUp /> Upvote
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ── Confidential Tips ── */}
      {tab === 'tips' && (
        <div style={{
          border: `1px solid ${T.border}`, borderRadius: 6,
          background: T.card, padding: '3rem 2rem', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8, background: '#EFF6FF',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1.25rem', color: '#1E40AF',
          }}>
            <Icon.Shield />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: T.textPrimary, marginBottom: '0.5rem' }}>
            Confidential Violation Reporting
          </h2>
          <p style={{ color: T.textMuted, fontSize: '0.875rem', maxWidth: 480, margin: '0 auto 0.75rem', lineHeight: 1.6 }}>
            Report illegal dumping, environmental violations, or government negligence. All submissions are fully anonymised — no personal information is stored or traceable.
          </p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.4rem 0.875rem', background: '#EFF6FF',
            border: '1px solid #BFDBFE', borderRadius: 4,
            fontSize: '0.8125rem', color: '#1E40AF', fontWeight: 600,
            marginBottom: '1.5rem',
          }}>
            <Icon.Lock /> End-to-end anonymised — no identity stored
          </div>
          <div>
            <button style={primaryBtn()} onClick={() => setTipModal(true)}>
              Submit Confidential Tip
            </button>
          </div>
        </div>
      )}

      {/* ── Ward Score ── */}
      {tab === 'street' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Search bar */}
          <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, padding: '1.25rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, marginBottom: '0.75rem' }}>Ward Health Score Lookup</p>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <input
                value={streetWard}
                onChange={e => setStreetWard(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && fetchStreet()}
                placeholder="Enter ward name (e.g. Koramangala)"
                style={{ ...inputStyle, flex: 1 }}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
              <button style={primaryBtn(loadingStreet)} onClick={fetchStreet} disabled={loadingStreet}>
                {loadingStreet ? 'Loading...' : 'Check Score'}
              </button>
            </div>
          </div>

          {ss && (
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
              {/* Score header */}
              <div style={{ background: T.navy, padding: '1.25rem 1.5rem' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>
                  Ward Health Index
                </p>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '3.5rem', fontWeight: 800, color: 'white', letterSpacing: '-0.03em', lineHeight: 1 }}>
                    {ss.overallScore}
                  </span>
                  <div>
                    <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.875rem', margin: 0 }}>/ 100 — {ss.ward}</p>
                    <span style={{
                      display: 'inline-block', marginTop: 4,
                      padding: '0.15rem 0.5rem',
                      background: ss.trend === 'improving' ? '#F0FDF4' : ss.trend === 'worsening' ? '#FFF5F5' : '#EFF6FF',
                      color: ss.trend === 'improving' ? '#166534' : ss.trend === 'worsening' ? '#991B1B' : '#1E40AF',
                      border: `1px solid ${ss.trend === 'improving' ? '#BBF7D0' : ss.trend === 'worsening' ? '#FECACA' : '#BFDBFE'}`,
                      borderRadius: 3, fontSize: '0.75rem', fontWeight: 700, textTransform: 'capitalize',
                    }}>{ss.trend as string}</span>
                  </div>
                </div>
              </div>

              <div style={{ padding: '1.25rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {/* Metrics */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '0.875rem' }}>
                  <MetricBar label="Cleanliness Index"        value={ss.cleanliness as number}          color={T.greenDark} />
                  <MetricBar label="Air Quality Score"        value={ss.aqiScore as number}              color={T.navy} />
                  <MetricBar label="Waste Collection Rate"    value={ss.wasteCollection as number}       color="#1E40AF" />
                  <MetricBar label="Green Cover Density"      value={ss.greenCover as number}            color={T.greenDark} />
                  <MetricBar label="Water Quality"            value={ss.waterQuality as number}          color="#0891B2" />
                  <MetricBar label="Citizen Participation"    value={ss.citizenParticipation as number}  color="#6D28D9" />
                </div>

                {/* Summary stats */}
                <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '1rem', display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem', textAlign: 'center' }}>
                  {[
                    { label: 'Total Reports',  value: ss.totalReports,    color: T.navy },
                    { label: 'Resolved',       value: ss.resolvedReports, color: T.greenDark },
                    { label: 'Resolution Rate',value: `${ss.resolutionRate}%`, color: '#1E40AF' },
                  ].map(m => (
                    <div key={m.label} style={{ background: T.surface, borderRadius: 6, padding: '0.875rem 0.5rem', border: `1px solid ${T.border}` }}>
                      <p style={{ fontSize: '1.5rem', fontWeight: 800, color: m.color as string, margin: 0, letterSpacing: '-0.02em' }}>{m.value}</p>
                      <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '3px 0 0', fontWeight: 500 }}>{m.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Create Event Modal ── */}
      <Modal open={createEventModal} onClose={() => setCreateEventModal(false)} title="Create Community Event" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <label style={labelStyle}>Event Title <span style={{ color: T.danger }}>*</span></label>
            <input style={inputStyle} value={eventForm.title} onChange={e => setEventForm(f => ({ ...f, title: e.target.value }))}
              placeholder="e.g. Koramangala Ward Cleanup Drive"
              onFocus={e => (e.target.style.borderColor = T.navy)}
              onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <div>
            <label style={labelStyle}>Description</label>
            <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.5 }}
              value={eventForm.description} rows={3}
              onChange={e => setEventForm(f => ({ ...f, description: e.target.value }))}
              placeholder="What will participants do? What to bring?"
              onFocus={e => (e.target.style.borderColor = T.navy)}
              onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <div>
            <label style={labelStyle}>Meeting Location <span style={{ color: T.danger }}>*</span></label>
            <input style={inputStyle} value={eventForm.location} onChange={e => setEventForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Exact address or landmark"
              onFocus={e => (e.target.style.borderColor = T.navy)}
              onBlur={e => (e.target.style.borderColor = T.border)} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Date <span style={{ color: T.danger }}>*</span></label>
              <input type="date" style={inputStyle} value={eventForm.date} onChange={e => setEventForm(f => ({ ...f, date: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
            <div>
              <label style={labelStyle}>Time</label>
              <input type="time" style={inputStyle} value={eventForm.time} onChange={e => setEventForm(f => ({ ...f, time: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
            <div>
              <label style={labelStyle}>Category</label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={eventForm.category} onChange={e => setEventForm(f => ({ ...f, category: e.target.value }))}>
                <option value="cleanup">Cleanup Drive</option>
                <option value="plantation">Tree Plantation</option>
                <option value="awareness">Awareness Campaign</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Max Volunteers</label>
              <input type="number" style={inputStyle} value={eventForm.maxVolunteers} onChange={e => setEventForm(f => ({ ...f, maxVolunteers: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
          </div>
          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '0.75rem' }}>
            <button
              style={{ ...primaryBtn(!eventForm.title || !eventForm.location || !eventForm.date || submitting), width: '100%', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 700 }}
              onClick={submitEvent}
              disabled={submitting || !eventForm.title || !eventForm.location || !eventForm.date}
            >
              {submitting ? 'Creating...' : 'Create Event'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Confidential Tip Modal ── */}
      <Modal open={tipModal} onClose={() => setTipModal(false)} title="Submit Confidential Tip">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '0.75rem', background: '#EFF6FF',
            border: '1px solid #BFDBFE', borderRadius: 6,
          }}>
            <span style={{ color: '#1E40AF', flexShrink: 0, marginTop: 1 }}><Icon.Lock /></span>
            <p style={{ fontSize: '0.8125rem', color: '#1E40AF', margin: 0, lineHeight: 1.5 }}>
              This report is fully anonymised. No IP address, login, or personal information is stored or transmitted.
            </p>
          </div>

          <div>
            <label style={labelStyle}>Violation Type</label>
            <select style={{ ...inputStyle, appearance: 'none' }} value={tipForm.category} onChange={e => setTipForm(f => ({ ...f, category: e.target.value }))}>
              <option value="illegal_dumping">Illegal Waste Dumping</option>
              <option value="corruption">Government Negligence</option>
              <option value="chemical_dumping">Hazardous Chemical Disposal</option>
              <option value="tree_cutting">Unauthorised Tree Removal</option>
              <option value="other">Other Environmental Violation</option>
            </select>
          </div>

          <div>
            <label style={labelStyle}>Incident Description <span style={{ color: T.danger }}>*</span></label>
            <textarea
              value={tipForm.description}
              onChange={e => setTipForm(f => ({ ...f, description: e.target.value }))}
              rows={5}
              placeholder="Describe what you witnessed — include date, time, and any identifying details about the violators if known..."
              style={{ ...inputStyle, minHeight: 120, resize: 'vertical', lineHeight: 1.6 }}
              onFocus={e => (e.target.style.borderColor = T.navy)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </div>

          <div>
            <label style={labelStyle}>Location <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.textMuted }}>(optional)</span></label>
            <input
              value={tipForm.location}
              onChange={e => setTipForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Ward, area, or nearest landmark"
              style={inputStyle}
              onFocus={e => (e.target.style.borderColor = T.navy)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
          </div>

          <div style={{ borderTop: `1px solid ${T.border}`, paddingTop: '0.75rem' }}>
            <button
              style={{ ...primaryBtn(!tipForm.description.trim() || submitting), width: '100%', padding: '0.75rem', fontSize: '0.9375rem', fontWeight: 700 }}
              onClick={submitTip}
              disabled={submitting || !tipForm.description.trim()}
            >
              {submitting ? 'Submitting...' : 'Submit Anonymously'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}