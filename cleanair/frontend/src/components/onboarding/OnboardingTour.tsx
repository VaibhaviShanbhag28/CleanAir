import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Sparkles, Rss, FileEdit, Map, Trophy, Users, Wrench, MessageCircle, Building2,
  ChevronLeft, ChevronRight, Check, X, type LucideIcon,
} from 'lucide-react';
import { useAppStore } from '@/store';

const T = {
  navy: '#0A2240', navyDark: '#071829', green: '#166534', border: '#DDE2EA',
  textPrimary: '#0D1B2A', textMuted: '#4A5568', card: '#FFFFFF',
};

interface TourStep {
  selector: string | null;
  title: string;
  body: string;
  icon: LucideIcon;
  accent: string;
}

const CITIZEN_STEPS: TourStep[] = [
  { selector: null, icon: Sparkles, accent: '#0A2240', title: 'Welcome to CleanAir 👋', body: 'Here\'s a 30-second tour of what you can do here.' },
  { selector: '[data-tour="dashboard-feed"]', icon: Rss, accent: '#1E40AF', title: 'Community Feed', body: 'Every report from citizens and municipality staff shows up here, live.' },
  { selector: '[data-tour="nav-report"]', icon: FileEdit, accent: '#B91C1C', title: 'Submit a Report', body: 'Spotted pollution? Tap here to report it with a photo and instant AI analysis.' },
  { selector: '[data-tour="nav-map"]', icon: Map, accent: '#6D28D9', title: 'Live Incident Map', body: 'See every reported incident plotted on a map of the city.' },
  { selector: '[data-tour="nav-karma"]', icon: Trophy, accent: '#B45309', title: 'Karma & Leaderboard', body: 'Earn points for reporting and resolving issues, and climb the leaderboard.' },
  { selector: '[data-tour="nav-community"]', icon: Users, accent: '#166534', title: 'Community', body: 'Join local cleanup drives and environmental challenges.' },
  { selector: '[data-tour="nav-tools"]', icon: Wrench, accent: '#0369A1', title: 'AI Tools', body: 'Handy AI tools for waste sorting, carbon footprint, and more.' },
  { selector: '[data-tour="chatbot"]', icon: MessageCircle, accent: '#0A2240', title: 'Ask CleanAir AI', body: 'Stuck? Our assistant is one click away, anytime.' },
];

const MUNICIPALITY_STEPS: TourStep[] = [
  { selector: null, icon: Sparkles, accent: '#0A2240', title: 'Welcome to CleanAir 👋', body: 'Here\'s a 30-second tour of your municipality dashboard.' },
  { selector: '[data-tour="nav-municipal"]', icon: Building2, accent: '#0A2240', title: 'Municipal Dashboard', body: 'Review every report submitted by citizens and act on them from here.' },
  { selector: '[data-tour="nav-map"]', icon: Map, accent: '#6D28D9', title: 'Live Incident Map', body: 'See every reported incident plotted on a map of the city.' },
  { selector: '[data-tour="nav-community"]', icon: Users, accent: '#166534', title: 'Community', body: 'See cleanup drives and challenges happening across the city.' },
  { selector: '[data-tour="nav-tools"]', icon: Wrench, accent: '#0369A1', title: 'AI Tools', body: 'Handy AI tools to help draft notices and analyse reports.' },
  { selector: '[data-tour="chatbot"]', icon: MessageCircle, accent: '#0A2240', title: 'Ask CleanAir AI', body: 'Stuck? Our assistant is one click away, anytime.' },
];

const TOOLTIP_WIDTH = 336;
const SPOTLIGHT_PAD = 8;
const ARROW_SIZE = 11;

function useTargetRect(selector: string | null, active: boolean) {
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!active || !selector) { setRect(null); return; }
    const update = () => {
      const el = document.querySelector(selector);
      setRect(el ? el.getBoundingClientRect() : null);
    };
    update();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    const interval = setInterval(update, 300); // catches layout shifts as data loads
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
      clearInterval(interval);
    };
  }, [selector, active]);

  return rect;
}

function hexToRgba(hex: string, alpha: number): string {
  const n = parseInt(hex.replace('#', ''), 16);
  const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}

export default function OnboardingTour() {
  const { user, authReady } = useAppStore();
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [closing, setClosing] = useState(false);
  const skipRef = useRef<() => void>(() => {});

  const steps = useMemo(
    () => (user?.role === 'authority' || user?.role === 'admin' ? MUNICIPALITY_STEPS : CITIZEN_STEPS),
    [user?.role],
  );

  useEffect(() => {
    if (!authReady || !user || !user.onboarded) return;
    const key = `cleanair.tourSeen.${user.uid}`;
    if (localStorage.getItem(key)) return;
    setStepIndex(0);
    const t = setTimeout(() => setActive(true), 700); // let the dashboard finish rendering first
    return () => clearTimeout(t);
  }, [authReady, user]);

  const step = steps[stepIndex];
  const rect = useTargetRect(step?.selector ?? null, active);

  const finish = () => {
    setClosing(true);
    setTimeout(() => {
      if (user) localStorage.setItem(`cleanair.tourSeen.${user.uid}`, '1');
      setActive(false);
      setClosing(false);
    }, 200);
  };
  skipRef.current = finish;

  const next = () => {
    if (stepIndex < steps.length - 1) { setDirection(1); setStepIndex((i) => i + 1); }
    else finish();
  };
  const prev = () => { setDirection(-1); setStepIndex((i) => Math.max(0, i - 1)); };

  // Keyboard navigation while the tour is active
  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') skipRef.current();
      if (e.key === 'ArrowRight' || e.key === 'Enter') next();
      if (e.key === 'ArrowLeft') prev();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, stepIndex]);

  if (!active || !step) return null;

  const accent = step.accent;
  const spaceBelow = rect ? window.innerHeight - rect.bottom : 0;
  const placeAbove = !!rect && spaceBelow < 240;
  const tooltipTop = rect
    ? placeAbove ? rect.top - SPOTLIGHT_PAD - 16 : rect.bottom + SPOTLIGHT_PAD + 16
    : window.innerHeight / 2;
  const tooltipLeft = rect
    ? Math.min(Math.max(rect.left + rect.width / 2 - TOOLTIP_WIDTH / 2, 16), window.innerWidth - TOOLTIP_WIDTH - 16)
    : window.innerWidth / 2 - TOOLTIP_WIDTH / 2;
  const arrowLeft = rect
    ? Math.min(Math.max(rect.left + rect.width / 2 - tooltipLeft - ARROW_SIZE / 2, 18), TOOLTIP_WIDTH - 18 - ARROW_SIZE)
    : null;

  const Icon = step.icon;
  const progressPct = ((stepIndex + 1) / steps.length) * 100;
  const slideAnim = closing
    ? 'cleanair-tour-out 0.2s ease forwards'
    : `cleanair-tour-${direction === 1 ? 'in-right' : 'in-left'} 0.3s cubic-bezier(.22,1,.36,1)`;

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 300 }}>
      {/* Blocks interaction with the rest of the app while the tour is active.
          Deliberately has no onClick -- an in-progress tour should only be
          dismissed via Skip/Finish/Escape, not an accidental background click. */}
      <div style={{ position: 'fixed', inset: 0 }} />

      {/* Spotlight / backdrop (purely visual, sits above the blocker) */}
      {rect ? (
        <>
          <div
            style={{
              position: 'fixed',
              top: rect.top - SPOTLIGHT_PAD,
              left: rect.left - SPOTLIGHT_PAD,
              width: rect.width + SPOTLIGHT_PAD * 2,
              height: rect.height + SPOTLIGHT_PAD * 2,
              borderRadius: 12,
              boxShadow: `0 0 0 9999px rgba(6,16,32,0.68), 0 0 0 2px ${hexToRgba(accent, 0.9)}`,
              transition: 'top 0.4s cubic-bezier(.22,1,.36,1), left 0.4s cubic-bezier(.22,1,.36,1), width 0.4s, height 0.4s',
              pointerEvents: 'none',
            }}
          />
          {/* Soft pulsing glow ring to draw the eye to the target */}
          <div
            key={`pulse-${stepIndex}`}
            style={{
              position: 'fixed',
              top: rect.top - SPOTLIGHT_PAD,
              left: rect.left - SPOTLIGHT_PAD,
              width: rect.width + SPOTLIGHT_PAD * 2,
              height: rect.height + SPOTLIGHT_PAD * 2,
              borderRadius: 12,
              border: `2px solid ${accent}`,
              pointerEvents: 'none',
              animation: 'cleanair-pulse-ring 1.8s cubic-bezier(.4,0,.6,1) infinite',
            }}
          />
        </>
      ) : (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'radial-gradient(circle at 50% 42%, rgba(10,34,64,0.55), rgba(4,10,20,0.78))',
          backdropFilter: 'blur(2px)',
          transition: 'opacity 0.3s', pointerEvents: 'none',
        }} />
      )}

      {/* Tooltip arrow */}
      {rect && arrowLeft !== null && (
        <div style={{
          position: 'fixed',
          top: placeAbove ? tooltipTop + 16 - ARROW_SIZE / 2 + 1 : tooltipTop - ARROW_SIZE / 2 + 1,
          left: tooltipLeft + arrowLeft,
          width: ARROW_SIZE, height: ARROW_SIZE,
          background: T.card,
          transform: 'rotate(45deg)',
          borderRadius: 2,
          boxShadow: placeAbove ? '4px 4px 6px rgba(0,0,0,0.06)' : '-2px -2px 4px rgba(0,0,0,0.04)',
          transition: 'top 0.4s cubic-bezier(.22,1,.36,1), left 0.4s cubic-bezier(.22,1,.36,1)',
        }} />
      )}

      {/* Tooltip card */}
      <div
        key={stepIndex}
        style={{
          position: 'fixed',
          top: tooltipTop,
          left: tooltipLeft,
          width: TOOLTIP_WIDTH,
          transform: rect ? 'none' : 'translateY(-50%)',
          background: T.card, borderRadius: 14,
          boxShadow: '0 24px 60px rgba(0,0,0,0.28), 0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          fontFamily: "'DM Sans','Inter',sans-serif",
          transition: 'top 0.4s cubic-bezier(.22,1,.36,1), left 0.4s cubic-bezier(.22,1,.36,1)',
          animation: slideAnim,
        }}
      >
        {/* Gradient accent bar + progress */}
        <div style={{ height: 4, background: T.border, position: 'relative' }}>
          <div style={{
            position: 'absolute', inset: 0, width: `${progressPct}%`,
            background: `linear-gradient(90deg, ${accent}, ${hexToRgba(accent, 0.6)})`,
            transition: 'width 0.35s cubic-bezier(.22,1,.36,1)',
          }} />
        </div>

        <div style={{ padding: '1.125rem 1.25rem 1rem' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 4 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10, flexShrink: 0,
              background: hexToRgba(accent, 0.12), color: accent,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Icon size={19} strokeWidth={2.25} />
            </div>
            <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>{step.title}</p>
                <span style={{
                  fontSize: '0.6875rem', fontWeight: 700, color: T.textMuted,
                  background: '#F5F7FA', border: `1px solid ${T.border}`,
                  borderRadius: 20, padding: '0.1rem 0.5rem', flexShrink: 0, whiteSpace: 'nowrap',
                }}>
                  {stepIndex + 1} / {steps.length}
                </span>
              </div>
              <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: '4px 0 0', lineHeight: 1.55 }}>{step.body}</p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, gap: 8 }}>
            <div style={{ display: 'flex', gap: 4 }}>
              {steps.map((_, i) => (
                <span key={i} style={{
                  width: i === stepIndex ? 18 : 6, height: 6, borderRadius: 3,
                  background: i === stepIndex ? accent : T.border,
                  transition: 'all 0.3s cubic-bezier(.22,1,.36,1)',
                }} />
              ))}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <button onClick={finish} style={ghostBtnStyle} title="Skip tour (Esc)">
                <X size={13} /> Skip
              </button>
              {stepIndex > 0 && (
                <button onClick={prev} style={iconBtnStyle} title="Previous (←)">
                  <ChevronLeft size={15} />
                </button>
              )}
              <button
                onClick={next}
                style={{ ...primaryBtnStyle, background: accent }}
                onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.12)')}
                onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
                title={stepIndex === steps.length - 1 ? 'Finish' : 'Next (→)'}
              >
                {stepIndex === steps.length - 1 ? (<><Check size={14} /> Finish</>) : (<>Next <ChevronRight size={14} /></>)}
              </button>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes cleanair-tour-in-right {
          from { opacity: 0; transform: translateX(14px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes cleanair-tour-in-left {
          from { opacity: 0; transform: translateX(-14px) scale(0.98); }
          to   { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes cleanair-tour-out {
          from { opacity: 1; transform: scale(1); }
          to   { opacity: 0; transform: scale(0.96); }
        }
        @keyframes cleanair-pulse-ring {
          0%   { opacity: 0.9; transform: scale(1); }
          70%  { opacity: 0; transform: scale(1.06); }
          100% { opacity: 0; transform: scale(1.06); }
        }
      `}</style>
    </div>
  );
}

const ghostBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 4,
  border: 'none', background: 'transparent', color: T.textMuted,
  fontSize: '0.75rem', fontWeight: 600, cursor: 'pointer', padding: '0.4rem 0.5rem',
  fontFamily: 'inherit', borderRadius: 5, transition: 'background 0.15s',
};

const iconBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  border: `1.5px solid ${T.border}`, background: 'white', color: T.textPrimary,
  cursor: 'pointer', padding: '0.35rem', borderRadius: 6, width: 28, height: 28,
  fontFamily: 'inherit',
};

const primaryBtnStyle: React.CSSProperties = {
  display: 'flex', alignItems: 'center', gap: 5,
  border: 'none', color: 'white', borderRadius: 7,
  fontSize: '0.8125rem', fontWeight: 700, cursor: 'pointer', padding: '0.45rem 0.95rem',
  fontFamily: 'inherit', transition: 'filter 0.15s', boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
};
