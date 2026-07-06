import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore } from '@/store';

const T = {
  navy:      '#0A2240',
  border:    '#DDE2EA',
  surface:   '#F5F7FA',
  textPrimary:'#0D1B2A',
  textMuted: '#4A5568',
  card:      '#FFFFFF',
  greenDark: '#166534',
};

interface TourStep {
  title:    string;
  desc:     string;
  target:   string;   // CSS selector of highlighted element
  position: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const STEPS: TourStep[] = [
  {
    title:    'Welcome to CleanAir',
    desc:     'This is your command centre for Bengaluru environmental monitoring. Let\'s take a quick tour.',
    target:   '',
    position: 'center',
  },
  {
    title:    'Live AQI',
    desc:     'The AQI pill in the navbar shows Bengaluru\'s real-time air quality. Green is good, red means wear your N95.',
    target:   '',
    position: 'center',
  },
  {
    title:    'Submit a Report',
    desc:     'Spotted garbage burning, illegal dumping, or industrial smoke? Hit "Report" to file an incident in 5 steps. AI verifies your photo automatically.',
    target:   '',
    position: 'center',
  },
  {
    title:    'Incident Registry',
    desc:     'All citizen reports are logged here with status tracking. Filter by severity, ward, or pollution type.',
    target:   '',
    position: 'center',
  },
  {
    title:    'Earn Karma Points',
    desc:     'Every verified report, diary entry, and eco action earns Karma. Climb from Seedling to Planet Protector on the city leaderboard.',
    target:   '',
    position: 'center',
  },
  {
    title:    'Community Hub',
    desc:     'Join cleanup drives, plantation events, and submit confidential tips about violations -- your identity stays fully protected.',
    target:   '',
    position: 'center',
  },
  {
    title:    'AI Intelligence Suite',
    desc:     'Six AI tools: waste classifier, carbon calculator, official notice generator, air advisory, seasonal forecast, and cleanup verifier.',
    target:   '',
    position: 'center',
  },
  {
    title:    'Ask CleanAir AI',
    desc:     'The AI assistant in the bottom-right corner knows everything about this platform, Bengaluru\'s air quality, BBMP processes, and eco tips. Ask it anything.',
    target:   '',
    position: 'center',
  },
];

const TOUR_KEY = 'cleanair_tour_done';

export default function OnboardingTour() {
  const { user } = useAppStore();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [step, setStep]     = useState(0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show tour only on dashboard, only if not already seen
    if (location.pathname !== '/') return;
    const done = localStorage.getItem(TOUR_KEY);
    if (!done) {
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, [location.pathname]);

  const dismiss = () => {
    localStorage.setItem(TOUR_KEY, '1');
    setVisible(false);
  };

  const next = () => {
    if (step < STEPS.length - 1) {
      setStep(s => s + 1);
    } else {
      dismiss();
      navigate('/');
    }
  };

  const prev = () => {
    if (step > 0) setStep(s => s - 1);
  };

  if (!visible) return null;

  const current = STEPS[step];
  const isLast  = step === STEPS.length - 1;
  const isFirst = step === 0;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={dismiss}
        style={{
          position: 'fixed', inset: 0, zIndex: 200,
          background: 'rgba(10,34,64,0.55)',
          backdropFilter: 'blur(3px)',
          animation: 'fadeIn 0.2s ease',
        }}
      />

      {/* Centered tooltip card */}
      <div style={{
        position: 'fixed', zIndex: 201,
        top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        width: 380, maxWidth: 'calc(100vw - 32px)',
        background: T.card,
        border: `1px solid ${T.border}`,
        borderRadius: 10,
        boxShadow: '0 24px 64px rgba(0,0,0,0.22)',
        overflow: 'hidden',
        animation: 'slideUp 0.25s ease',
        fontFamily: "'DM Sans','Inter',sans-serif",
      }}>
        {/* Header bar */}
        <div style={{
          background: T.navy, padding: '1rem 1.25rem',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* CleanAir logo mark */}
            <div style={{
              width: 30, height: 30, borderRadius: 6,
              background: 'rgba(255,255,255,0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 8C8 10 5.9 16.17 3.82 22.2"/>
                <path d="M21 4a20 20 0 0 1-3 0c-3.41-.17-6.78-1-10-3 0 7 4 12 8 13"/>
              </svg>
            </div>
            <span style={{ fontWeight: 700, color: 'white', fontSize: '0.9rem' }}>Platform Tour</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{
              padding: '0.15rem 0.6rem', borderRadius: 3,
              background: 'rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)',
              fontSize: '0.72rem', fontWeight: 700,
            }}>
              {step + 1} / {STEPS.length}
            </span>
            <button onClick={dismiss} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: 'rgba(255,255,255,0.6)', fontSize: '1rem', lineHeight: 1,
              padding: '2px 4px',
            }}>
              ✕
            </button>
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 3, background: T.border }}>
          <div style={{
            height: '100%',
            width: `${((step + 1) / STEPS.length) * 100}%`,
            background: T.navy,
            transition: 'width 0.3s ease',
          }} />
        </div>

        {/* Content */}
        <div style={{ padding: '1.5rem 1.25rem 1.25rem' }}>
          {/* Step icon */}
          <div style={{
            width: 44, height: 44, borderRadius: 8,
            background: `${T.navy}0F`, color: T.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            marginBottom: '0.875rem', fontSize: '1.375rem',
          }}>
            {['🌿','💨','📸','🗺️','⭐','🌱','🤖','💬'][step]}
          </div>

          <h2 style={{
            fontWeight: 800, fontSize: '1.0625rem', color: T.textPrimary,
            margin: '0 0 8px', letterSpacing: '-0.01em',
          }}>
            {current.title}
          </h2>
          <p style={{
            fontSize: '0.875rem', color: T.textMuted,
            lineHeight: 1.6, margin: 0,
          }}>
            {current.desc}
          </p>
        </div>

        {/* Step dots */}
        <div style={{
          display: 'flex', justifyContent: 'center', gap: 5,
          paddingBottom: '0.5rem',
        }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => setStep(i)}
              style={{
                width: i === step ? 20 : 7,
                height: 7, borderRadius: 4, border: 'none',
                background: i === step ? T.navy : T.border,
                cursor: 'pointer', padding: 0,
                transition: 'all 0.2s ease',
              }}
            />
          ))}
        </div>

        {/* Footer */}
        <div style={{
          padding: '0.875rem 1.25rem',
          borderTop: `1px solid ${T.border}`,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          gap: '0.75rem',
        }}>
          <button
            onClick={dismiss}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              fontSize: '0.8125rem', color: T.textMuted,
              fontFamily: 'inherit', padding: '0.375rem 0',
            }}
          >
            Skip tour
          </button>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {!isFirst && (
              <button onClick={prev} style={{
                padding: '0.5rem 1rem',
                border: `1.5px solid ${T.border}`, borderRadius: 4,
                background: 'white', color: T.textPrimary,
                fontWeight: 600, fontSize: '0.8125rem',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Back
              </button>
            )}
            <button onClick={next} style={{
              padding: '0.5rem 1.25rem',
              border: 'none', borderRadius: 4,
              background: T.navy, color: 'white',
              fontWeight: 700, fontSize: '0.8125rem',
              cursor: 'pointer', fontFamily: 'inherit',
              minWidth: 90,
            }}>
              {isLast ? 'Go to Dashboard' : 'Next'}
            </button>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
        @keyframes slideUp { from { opacity:0; transform:translate(-50%,-48%) } to { opacity:1; transform:translate(-50%,-50%) } }
      `}</style>
    </>
  );
}