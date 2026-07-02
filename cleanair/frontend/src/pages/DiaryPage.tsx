import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Badge, Modal, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { DiaryEntry } from '@/types';

const MOODS = [
  { value: 'great',     label: 'Excellent',  dot: '#166534' },
  { value: 'good',      label: 'Good',       dot: '#1A6B3C' },
  { value: 'neutral',   label: 'Neutral',    dot: '#4A5568' },
  { value: 'concerned', label: 'Concerned',  dot: '#92400E' },
  { value: 'upset',     label: 'Critical',   dot: '#991B1B' },
];

const ECO_HABITS = [
  'Carpooled', 'Used Metro', 'Cycled', 'Walked',
  'Planted Tree', 'Reduced Plastic', 'Composted',
  'Saved Water', 'Recycled Waste', 'Reduced AC Usage',
];

const MOOD_COLORS: Record<string, string> = {
  great: 'border-l-[#166534] bg-[#F0FDF4]',
  good: 'border-l-[#1A6B3C] bg-[#F0FDF4]',
  neutral: 'border-l-[#4A5568] bg-[#F8FAFC]',
  concerned: 'border-l-[#92400E] bg-[#FFFBEB]',
  upset: 'border-l-[#991B1B] bg-[#FFF5F5]',
};

const TREND_CONFIG = {
  improving: { label: 'Improving', color: '#166534', bg: '#F0FDF4' },
  stable:    { label: 'Stable',    color: '#1E40AF', bg: '#EFF6FF' },
  worsening: { label: 'Worsening', color: '#991B1B', bg: '#FFF5F5' },
};

// ── Inline SVG icons ──────────────────────────────────────────────────────────
const BookIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
  </svg>
);
const BrainIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24A3 3 0 0 1 2 10a3 3 0 0 1 3-3 2.5 2.5 0 0 1 4.5-5z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24A3 3 0 0 0 22 10a3 3 0 0 0-3-3 2.5 2.5 0 0 0-4.5-5z"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);
const MapPinIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>
  </svg>
);
const CheckIcon = () => (
  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12"/>
  </svg>
);
const ArrowRightIcon = () => (
  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
  </svg>
);

export default function DiaryPage() {
  const { user } = useAppStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [aiSummary, setAiSummary] = useState<{
    summary?: string; insights?: string[]; suggestions?: string[];
    ecoScore?: number; topConcern?: string; monthlyTrend?: string;
  } | null>(null);
  const [newModal, setNewModal]       = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [loading, setLoading]         = useState(true);
  const [form, setForm] = useState({
    title: '', content: '', mood: 'neutral',
    location: '', ecoHabits: [] as string[], tags: '',
  });

  const uid = user?.uid || 'user01';

  useEffect(() => {
    api.community.diary(uid)
      .then(d => { setEntries(d as DiaryEntry[]); setLoading(false); })
      .catch(() => setLoading(false));
  }, [uid]);

  const getAISummary = async () => {
    if (entries.length === 0) { toast('Add diary entries first.', 'info'); return; }
    setSummaryLoading(true);
    try {
      const summary = await api.ai.diarySummary(entries) as typeof aiSummary;
      setAiSummary(summary);
    } catch { toast('AI summary unavailable. Please try again.', 'error'); }
    finally { setSummaryLoading(false); }
  };

  const submitEntry = async () => {
    if (!form.title || !form.content) { toast('Title and content are required.', 'error'); return; }
    setSubmitting(true);
    try {
      const entry = await api.community.createDiary({
        userId: uid,
        title: form.title,
        content: form.content,
        mood: form.mood,
        location: form.location,
        ecoHabits: form.ecoHabits,
        tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
      }) as DiaryEntry;
      setEntries(e => [entry, ...e]);
      setNewModal(false);
      setForm({ title: '', content: '', mood: 'neutral', location: '', ecoHabits: [], tags: '' });
      toast('Entry recorded. +3 Karma awarded.', 'success');
    } catch { toast('Failed to save entry. Please try again.', 'error'); }
    finally { setSubmitting(false); }
  };

  const toggleHabit = (h: string) =>
    setForm(f => ({
      ...f,
      ecoHabits: f.ecoHabits.includes(h)
        ? f.ecoHabits.filter(x => x !== h)
        : [...f.ecoHabits, h],
    }));

  const trend = (aiSummary?.monthlyTrend || 'stable') as keyof typeof TREND_CONFIG;
  const trendCfg = TREND_CONFIG[trend] ?? TREND_CONFIG.stable;

  return (
    <div className="space-y-6 page-enter" style={{ fontFamily: "'DM Sans', 'Inter', sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ borderBottom: '1px solid #DDE2EA', paddingBottom: '1.25rem' }}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <div className="flex items-center gap-2.5 mb-1">
              <div style={{
                width: 36, height: 36, borderRadius: 6,
                background: '#0A2240', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', flexShrink: 0,
              }}>
                <BookIcon />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#0D1B2A', letterSpacing: '-0.02em', margin: 0 }}>
                Environmental Field Diary
              </h1>
            </div>
            <p style={{ color: '#4A5568', fontSize: '0.875rem', margin: 0 }}>
              Record daily observations, habits, and pollution sightings. Each entry earns +3 Karma.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={getAISummary}
              disabled={summaryLoading}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 1rem', border: '1.5px solid #0A2240',
                borderRadius: 4, background: 'white', color: '#0A2240',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                opacity: summaryLoading ? 0.6 : 1, transition: 'all 0.15s',
              }}
            >
              <BrainIcon />
              {summaryLoading ? 'Analysing...' : 'AI Analysis'}
            </button>
            <button
              onClick={() => setNewModal(true)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.5rem 1.125rem', border: 'none',
                borderRadius: 4, background: '#0A2240', color: 'white',
                fontSize: '0.8125rem', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              <PlusIcon />
              New Entry
            </button>
          </div>
        </div>
      </div>

      {/* ── AI Summary Panel ── */}
      {aiSummary && (
        <div style={{
          border: '1px solid #DDE2EA', borderLeft: '4px solid #0A2240',
          borderRadius: 8, background: '#F5F7FA', padding: '1.25rem',
        }}>
          <div className="flex items-center gap-2 mb-3">
            <div style={{ color: '#0A2240' }}><BrainIcon /></div>
            <span style={{ fontWeight: 700, color: '#0D1B2A', fontSize: '0.9375rem' }}>
              AI Environmental Analysis
            </span>
          </div>
          <p style={{ color: '#4A5568', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '1rem' }}>
            {aiSummary.summary}
          </p>

          <div className="grid sm:grid-cols-2 gap-5">
            {aiSummary.insights && aiSummary.insights.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Key Insights
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {aiSummary.insights.map((ins, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: '#4A5568' }}>
                      <span style={{ color: '#0A2240', flexShrink: 0, marginTop: 2 }}>
                        <ArrowRightIcon />
                      </span>
                      {ins}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {aiSummary.suggestions && aiSummary.suggestions.length > 0 && (
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Recommendations
                </p>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {aiSummary.suggestions.map((s, i) => (
                    <li key={i} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: '#4A5568' }}>
                      <span style={{ color: '#1A6B3C', flexShrink: 0, marginTop: 2 }}>
                        <ArrowRightIcon />
                      </span>
                      {s}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* Score row */}
          <div style={{
            marginTop: '1rem', paddingTop: '1rem',
            borderTop: '1px solid #DDE2EA',
            display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center',
          }}>
            <div>
              <p style={{ fontSize: '0.75rem', color: '#4A5568', marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Eco Score</p>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: '1.75rem', fontWeight: 700, color: '#0A2240' }}>{aiSummary.ecoScore}</span>
                <span style={{ fontSize: '0.875rem', color: '#4A5568' }}>/100</span>
              </div>
            </div>
            {aiSummary.topConcern && (
              <div>
                <p style={{ fontSize: '0.75rem', color: '#4A5568', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Primary Concern</p>
                <span style={{
                  display: 'inline-block', padding: '0.2rem 0.6rem',
                  background: '#FFFBEB', color: '#92400E', border: '1px solid #FCD34D',
                  borderRadius: 4, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize',
                }}>
                  {aiSummary.topConcern}
                </span>
              </div>
            )}
            <div>
              <p style={{ fontSize: '0.75rem', color: '#4A5568', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Monthly Trend</p>
              <span style={{
                display: 'inline-block', padding: '0.2rem 0.6rem',
                background: trendCfg.bg, color: trendCfg.color,
                border: `1px solid ${trendCfg.color}40`,
                borderRadius: 4, fontSize: '0.8125rem', fontWeight: 600, textTransform: 'capitalize',
              }}>
                {trendCfg.label}
              </span>
            </div>
            {/* Eco score bar */}
            <div style={{ flex: 1, minWidth: 120 }}>
              <div style={{ height: 6, background: '#DDE2EA', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${aiSummary.ecoScore ?? 0}%`,
                  background: '#0A2240', borderRadius: 3, transition: 'width 1s ease',
                }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Entry List ── */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {[...Array(3)].map((_, i) => (
            <div key={i} style={{ height: 100, background: '#F5F7FA', borderRadius: 8, animation: 'pulse 1.5s infinite' }} />
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div style={{
          border: '1px solid #DDE2EA', borderRadius: 8,
          background: 'white', padding: '4rem 2rem', textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, borderRadius: 8, background: '#F5F7FA',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 1rem', color: '#0A2240',
          }}>
            <BookIcon />
          </div>
          <h2 style={{ fontWeight: 700, fontSize: '1.125rem', color: '#0D1B2A', marginBottom: '0.5rem' }}>
            No Entries Recorded
          </h2>
          <p style={{ color: '#4A5568', fontSize: '0.875rem', maxWidth: 360, margin: '0 auto 1.5rem' }}>
            Begin documenting your environmental observations. Each entry contributes to your eco profile and earns Karma points.
          </p>
          <button
            onClick={() => setNewModal(true)}
            style={{
              padding: '0.625rem 1.5rem', background: '#0A2240', color: 'white',
              border: 'none', borderRadius: 4, fontWeight: 600,
              fontSize: '0.875rem', cursor: 'pointer',
            }}
          >
            Record First Entry
          </button>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {entries.map(e => {
            const moodCfg = MOODS.find(m => m.value === e.mood) ?? MOODS[2];
            const cardStyle = MOOD_COLORS[e.mood] ?? MOOD_COLORS.neutral;
            return (
              <div
                key={e.id}
                className={cardStyle}
                style={{
                  border: '1px solid #DDE2EA',
                  borderLeft: `4px solid ${moodCfg.dot}`,
                  borderRadius: 8, background: 'white', padding: '1rem 1.25rem',
                  transition: 'box-shadow 0.15s',
                }}
                onMouseEnter={e2 => (e2.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)')}
                onMouseLeave={e2 => (e2.currentTarget.style.boxShadow = 'none')}
              >
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {/* Title row */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '0.375rem' }}>
                      <h3 style={{ fontWeight: 700, color: '#0D1B2A', fontSize: '0.9375rem', margin: 0 }}>{e.title}</h3>
                      <span style={{
                        display: 'inline-block', padding: '0.125rem 0.5rem',
                        background: '#F5F7FA', color: '#4A5568', border: '1px solid #DDE2EA',
                        borderRadius: 4, fontSize: '0.75rem', fontWeight: 500,
                      }}>
                        {moodCfg.label}
                      </span>
                    </div>
                    <p style={{ color: '#4A5568', fontSize: '0.875rem', lineHeight: 1.6, marginBottom: '0.5rem' }}>
                      {e.content}
                    </p>
                    {e.location && (
                      <p style={{ display: 'flex', alignItems: 'center', gap: 4, color: '#4A5568', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                        <MapPinIcon /> {e.location}
                      </p>
                    )}
                    {e.ecoHabits?.length > 0 && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem', marginTop: '0.5rem' }}>
                        {e.ecoHabits.map(h => (
                          <span key={h} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 4,
                            padding: '0.15rem 0.5rem', background: '#F0FDF4',
                            color: '#166534', border: '1px solid #BBF7D0',
                            borderRadius: 4, fontSize: '0.75rem', fontWeight: 500,
                          }}>
                            <CheckIcon /> {h}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <span style={{ color: '#4A5568', fontSize: '0.75rem', flexShrink: 0, whiteSpace: 'nowrap' }}>
                    {new Date(e.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ── New Entry Modal ── */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="Record New Entry" size="lg">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.125rem' }}>

          {/* Title */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Entry Title <span style={{ color: '#991B1B' }}>*</span>
            </label>
            <input
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              placeholder="Summarise today's observation..."
              style={{
                width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #DDE2EA',
                borderRadius: 4, fontSize: '0.875rem', color: '#0D1B2A',
                background: 'white', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#0A2240')}
              onBlur={e => (e.target.style.borderColor = '#DDE2EA')}
            />
          </div>

          {/* Mood */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Environmental Mood
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              {MOODS.map(m => (
                <button
                  key={m.value}
                  onClick={() => setForm(f => ({ ...f, mood: m.value }))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '0.4rem 0.875rem',
                    border: `1.5px solid ${form.mood === m.value ? m.dot : '#DDE2EA'}`,
                    borderRadius: 4,
                    background: form.mood === m.value ? m.dot + '12' : 'white',
                    color: form.mood === m.value ? m.dot : '#4A5568',
                    fontSize: '0.8125rem', fontWeight: form.mood === m.value ? 600 : 500,
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}
                >
                  <span style={{ width: 8, height: 8, borderRadius: '50%', background: m.dot, display: 'inline-block', flexShrink: 0 }} />
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Observation */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Observation Details <span style={{ color: '#991B1B' }}>*</span>
            </label>
            <textarea
              value={form.content}
              onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
              rows={4}
              placeholder="Describe what you observed — pollution type, severity, location context, affected area..."
              style={{
                width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #DDE2EA',
                borderRadius: 4, fontSize: '0.875rem', color: '#0D1B2A',
                background: 'white', outline: 'none', resize: 'vertical',
                boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6,
              }}
              onFocus={e => (e.target.style.borderColor = '#0A2240')}
              onBlur={e => (e.target.style.borderColor = '#DDE2EA')}
            />
          </div>

          {/* Location */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Location
            </label>
            <input
              value={form.location}
              onChange={e => setForm(f => ({ ...f, location: e.target.value }))}
              placeholder="Area, ward, or landmark"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #DDE2EA',
                borderRadius: 4, fontSize: '0.875rem', color: '#0D1B2A',
                background: 'white', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#0A2240')}
              onBlur={e => (e.target.style.borderColor = '#DDE2EA')}
            />
          </div>

          {/* Eco Habits */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.5rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Eco Actions Today
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {ECO_HABITS.map(h => {
                const selected = form.ecoHabits.includes(h);
                return (
                  <button
                    key={h}
                    onClick={() => toggleHabit(h)}
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '0.3rem 0.75rem',
                      border: `1.5px solid ${selected ? '#1A6B3C' : '#DDE2EA'}`,
                      borderRadius: 4,
                      background: selected ? '#F0FDF4' : 'white',
                      color: selected ? '#166534' : '#4A5568',
                      fontSize: '0.8125rem', fontWeight: selected ? 600 : 500,
                      cursor: 'pointer', transition: 'all 0.15s',
                    }}
                  >
                    {selected && <CheckIcon />}
                    {h}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Tags */}
          <div>
            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.8125rem', color: '#0D1B2A', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              Tags
              <span style={{ fontWeight: 400, textTransform: 'none', color: '#4A5568', marginLeft: 6, letterSpacing: 0 }}>
                (comma separated)
              </span>
            </label>
            <input
              value={form.tags}
              onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
              placeholder="e.g. air quality, open burning, drainage"
              style={{
                width: '100%', padding: '0.5rem 0.75rem', border: '1.5px solid #DDE2EA',
                borderRadius: 4, fontSize: '0.875rem', color: '#0D1B2A',
                background: 'white', outline: 'none', boxSizing: 'border-box',
              }}
              onFocus={e => (e.target.style.borderColor = '#0A2240')}
              onBlur={e => (e.target.style.borderColor = '#DDE2EA')}
            />
          </div>

          {/* Divider */}
          <div style={{ borderTop: '1px solid #DDE2EA' }} />

          {/* Submit */}
          <button
            onClick={submitEntry}
            disabled={submitting || !form.title || !form.content}
            style={{
              width: '100%', padding: '0.75rem',
              background: (!form.title || !form.content) ? '#4A5568' : '#0A2240',
              color: 'white', border: 'none', borderRadius: 4,
              fontWeight: 700, fontSize: '0.9375rem', cursor: (!form.title || !form.content) ? 'not-allowed' : 'pointer',
              opacity: submitting ? 0.7 : 1, transition: 'all 0.15s',
              letterSpacing: '0.01em',
            }}
          >
            {submitting ? 'Saving...' : 'Save Entry  —  +3 Karma'}
          </button>
        </div>
      </Modal>
    </div>
  );
}