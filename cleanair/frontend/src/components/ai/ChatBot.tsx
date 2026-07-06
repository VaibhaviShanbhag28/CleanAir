import React, { useState, useRef, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';

const T = {
  navy:      '#0A2240',
  navyDark:  '#071829',
  green:     '#1A6B3C',
  border:    '#DDE2EA',
  surface:   '#F5F7FA',
  textPrimary:'#0D1B2A',
  textMuted: '#4A5568',
  card:      '#FFFFFF',
};

interface Msg { role: 'user' | 'assistant'; content: string; }

const SUGGESTIONS = [
  'What is a safe AQI for outdoor jogging?',
  'How do I report a garbage fire?',
  'How do I earn Karma points?',
  'Which Bengaluru wards have the best air quality?',
];

const Icon = {
  Send: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/>
      <polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  X: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  Robot: () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="10" width="20" height="11" rx="2"/>
      <path d="M12 10V6"/>
      <circle cx="12" cy="4" r="2"/>
      <circle cx="8" cy="15" r="1.5" fill="white" stroke="none"/>
      <circle cx="16" cy="15" r="1.5" fill="white" stroke="none"/>
      <path d="M8.5 18.5h7"/>
      <path d="M2 13.5H0.5"/><path d="M23.5 13.5H22"/>
    </svg>
  ),
  Bot: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2"/>
      <path d="M12 11V7"/>
      <circle cx="12" cy="5" r="2"/>
      <circle cx="8.5" cy="15.5" r="1.5" fill="white" stroke="none"/>
      <circle cx="15.5" cy="15.5" r="1.5" fill="white" stroke="none"/>
      <path d="M8 19h8"/>
      <path d="M3 14h1"/><path d="M20 14h1"/>
    </svg>
  ),
};

export default function ChatBot() {
  const [open, setOpen]         = useState(false);
  const [messages, setMessages] = useState<Msg[]>([
    { role: 'assistant', content: 'Hello. I\'m the CleanAir AI Assistant. Ask me about pollution levels, reporting incidents, eco tips, or how to use this platform.' }
  ]);
  const [input, setInput]       = useState('');
  const [loading, setLoading]   = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);
  const { currentAQI } = useAppStore();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const send = async (text: string) => {
    if (!text.trim() || loading) return;
    const userMsg: Msg = { role: 'user', content: text };
    setMessages(m => [...m, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const res = await api.ai.chat(
        [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        'Bengaluru',
        `Current AQI: ${currentAQI}`
      );
      setMessages(m => [...m, { role: 'assistant', content: res.reply }]);
    } catch {
      setMessages(m => [...m, { role: 'assistant', content: 'Connection error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* ── Floating trigger button ── */}
      <button
        data-tour="chatbot"
        onClick={() => setOpen(o => !o)}
        title={open ? 'Close assistant' : 'Open AI Assistant'}
        style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 50,
          width: 52, height: 52, borderRadius: 8,
          background: T.navy, color: 'white', border: 'none',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', boxShadow: '0 4px 16px rgba(10,34,64,0.35)',
          transition: 'all 0.2s',
          fontFamily: 'inherit',
        }}
        onMouseEnter={e => { e.currentTarget.style.background = T.navyDark; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(10,34,64,0.4)'; }}
        onMouseLeave={e => { e.currentTarget.style.background = T.navy; e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(10,34,64,0.35)'; }}
      >
        {open ? <Icon.X /> : <Icon.Robot />}
      </button>

      {/* ── Chat window ── */}
      {open && (
        <div style={{
          position: 'fixed', bottom: 90, right: 24, zIndex: 50,
          width: 360, height: 500,
          background: T.card, border: `1px solid ${T.border}`,
          borderRadius: 8, boxShadow: '0 16px 48px rgba(0,0,0,0.14)',
          display: 'flex', flexDirection: 'column',
          overflow: 'hidden',
          animation: 'chatFadeIn 0.2s ease-out',
          fontFamily: "'DM Sans','Inter',sans-serif",
        }}>

          {/* Header */}
          <div style={{
            background: T.navy, padding: '0.875rem 1rem',
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <div style={{
              width: 32, height: 32, borderRadius: 6,
              background: 'rgba(255,255,255,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Icon.Bot />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontWeight: 700, color: 'white', fontSize: '0.875rem', margin: 0 }}>CleanAir AI Assistant</p>
              <p style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.55)', margin: 0 }}>Powered by AI · Bengaluru</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ADE80', display: 'inline-block' }} />
              <span style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.6)' }}>Online</span>
            </div>
          </div>

          {/* Messages */}
          <div style={{
            flex: 1, overflowY: 'auto', padding: '1rem',
            display: 'flex', flexDirection: 'column', gap: '0.75rem',
          }}>
            {messages.map((m, i) => (
              <div key={i} style={{ display: 'flex', gap: 8, justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {m.role === 'assistant' && (
                  <div style={{
                    width: 26, height: 26, borderRadius: 4, flexShrink: 0,
                    background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon.Bot />
                  </div>
                )}
                <div style={{
                  maxWidth: '78%',
                  padding: '0.5rem 0.75rem',
                  borderRadius: m.role === 'user' ? '8px 8px 2px 8px' : '8px 8px 8px 2px',
                  background: m.role === 'user' ? T.navy : T.surface,
                  color: m.role === 'user' ? 'white' : T.textPrimary,
                  fontSize: '0.8125rem', lineHeight: 1.55,
                  border: m.role === 'user' ? 'none' : `1px solid ${T.border}`,
                }}>
                  {m.content}
                </div>
              </div>
            ))}

            {/* Loading dots */}
            {loading && (
              <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-start' }}>
                <div style={{ width: 26, height: 26, borderRadius: 4, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon.Bot />
                </div>
                <div style={{ padding: '0.625rem 0.875rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: '8px 8px 8px 2px', display: 'flex', gap: 4, alignItems: 'center' }}>
                  {[0, 1, 2].map(i => (
                    <span key={i} style={{
                      width: 6, height: 6, borderRadius: '50%', background: T.navy,
                      display: 'inline-block', opacity: 0.4,
                      animation: `dotBounce 1.2s ${i * 0.2}s ease-in-out infinite`,
                    }} />
                  ))}
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Suggestions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 0.875rem 0.625rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => send(s)} style={{
                  padding: '0.25rem 0.625rem',
                  border: `1px solid ${T.border}`, borderRadius: 4,
                  background: 'white', color: T.textMuted,
                  fontSize: '0.72rem', cursor: 'pointer',
                  transition: 'all 0.15s', fontFamily: 'inherit',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.color = T.navy; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div style={{ padding: '0.75rem', borderTop: `1px solid ${T.border}`, display: 'flex', gap: '0.5rem' }}>
            <input
              ref={inputRef}
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && send(input)}
              placeholder="Ask about pollution, AQI, reports..."
              style={{
                flex: 1, padding: '0.5rem 0.75rem',
                border: `1.5px solid ${T.border}`, borderRadius: 4,
                fontSize: '0.8125rem', color: T.textPrimary,
                background: T.surface, outline: 'none',
                fontFamily: 'inherit', transition: 'border-color 0.15s',
              }}
              onFocus={e => (e.target.style.borderColor = T.navy)}
              onBlur={e => (e.target.style.borderColor = T.border)}
            />
            <button
              onClick={() => send(input)}
              disabled={!input.trim() || loading}
              style={{
                width: 36, height: 36, flexShrink: 0, borderRadius: 4,
                background: (!input.trim() || loading) ? '#9CA3AF' : T.navy,
                color: 'white', border: 'none',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: (!input.trim() || loading) ? 'not-allowed' : 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {loading
                ? <span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                : <Icon.Send />}
            </button>
          </div>
        </div>
      )}

      {/* Keyframe animations */}
      <style>{`
        @keyframes chatFadeIn {
          from { opacity: 0; transform: translateY(12px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes dotBounce {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30%            { transform: translateY(-5px); opacity: 1; }
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  );
}