import React from 'react';
import { Link } from 'react-router-dom';

const T = {
  navy: '#0A2240', greenDark: '#166534',
  surface: '#F5F7FA', border: '#DDE2EA',
  textPrimary: '#0D1B2A', textMuted: '#4A5568',
};

export default function NotFoundPage() {
  return (
    <div style={{
      minHeight: '60vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', textAlign: 'center',
      padding: '2rem', fontFamily: "'DM Sans','Inter',sans-serif", gap: '1.25rem',
    }}>
      <div style={{
        width: 72, height: 72, borderRadius: 12,
        background: T.surface, border: `1px solid ${T.border}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        color: T.navy,
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          <line x1="11" y1="8" x2="11" y2="11"/><line x1="11" y1="14" x2="11.01" y2="14"/>
        </svg>
      </div>

      <div>
        <p style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>
          404 — Page Not Found
        </p>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.025em', margin: '0 0 8px' }}>
          This Page Does Not Exist
        </h1>
        <p style={{ color: T.textMuted, fontSize: '0.9375rem', maxWidth: 380, lineHeight: 1.6, margin: '0 auto' }}>
          The page you're looking for has been moved or removed. Return to the dashboard to continue using CleanAir.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem' }}>
        <Link to="/" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.625rem 1.375rem', background: T.navy,
            color: 'white', border: 'none', borderRadius: 4,
            fontWeight: 700, fontSize: '0.875rem', cursor: 'pointer',
            fontFamily: 'inherit',
          }}>
            Go to Dashboard
          </button>
        </Link>
        <Link to="/report" style={{ textDecoration: 'none' }}>
          <button style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '0.625rem 1.375rem', background: 'white',
            color: T.navy, border: `1.5px solid ${T.navy}`,
            borderRadius: 4, fontWeight: 600, fontSize: '0.875rem',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            Report an Incident
          </button>
        </Link>
      </div>
    </div>
  );
}