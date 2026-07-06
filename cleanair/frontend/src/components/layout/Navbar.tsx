import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';
import { getAQIColor, getAQILabel } from '@/lib/utils';

const T = {
  navy:        '#0A2240',
  navyLight:   '#0D2D56',
  border:      '#DDE2EA',
  textPrimary: '#0D1B2A',
  textMuted:   '#4A5568',
  surface:     '#F5F7FA',
  danger:      '#991B1B',
  card:        '#FFFFFF',
};

const NAV = [
  { to: '/',          label: 'Dashboard',   tour: 'nav-dashboard'  },
  { to: '/report',    label: 'Report',      tour: 'nav-report'     },
  { to: '/map',       label: 'Incidents',   tour: 'nav-map'        },
  { to: '/karma',     label: 'Karma',       tour: 'nav-karma'      },
  { to: '/community', label: 'Community',   tour: 'nav-community'  },
  { to: '/diary',     label: 'Field Diary'                          },
  { to: '/tools',     label: 'AI Tools',    tour: 'nav-tools'      },
  { to: '/municipal', label: 'Municipal',   tour: 'nav-municipal'  },
];

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Leaf: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="0">
      <path d="M17 8C8 10 5.9 16.17 3.82 22.2"/>
      <path d="M21 4a20 20 0 0 1-3 0c-3.41-.17-6.78-1-10-3 0 7 4 12 8 13" fill="rgba(255,255,255,0.9)"/>
    </svg>
  ),
  Sun: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="5"/>
      <line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
      <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
      <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
      <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
    </svg>
  ),
  Moon: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
    </svg>
  ),
  Bell: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  ),
  User: () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Star: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  ),
  Book: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
    </svg>
  ),
  LogOut: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
      <polyline points="16 17 21 12 16 7"/>
      <line x1="21" y1="12" x2="9" y2="12"/>
    </svg>
  ),
  Menu: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/>
    </svg>
  ),
  X: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
};

export default function Navbar() {
  const { user, darkMode, toggleDarkMode, currentAQI, notifications } = useAppStore();
  const [menuOpen, setMenuOpen]   = useState(false);
  const [scrolled, setScrolled]   = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const location  = useLocation();
  const navigate  = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    if (!userMenuOpen) return;
    const handler = () => setUserMenuOpen(false);
    window.addEventListener('click', handler);
    return () => window.removeEventListener('click', handler);
  }, [userMenuOpen]);

  const handleAuth = async () => {
    if (user) { await signOutUser(); useAppStore.getState().setUser(null); setUserMenuOpen(false); }
    else { try { await signInWithGoogle(); } catch (e) { console.error(e); } }
  };

  const aqiColor = getAQIColor(currentAQI);
  const aqiLabel = getAQILabel(currentAQI);
  const unread   = (notifications as { read?: boolean }[]).filter(n => !n.read).length;
  const initials = (user?.displayName || user?.email || 'U')[0].toUpperCase();

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 40,
      background: scrolled ? 'rgba(255,255,255,0.96)' : T.card,
      borderBottom: `1px solid ${T.border}`,
      backdropFilter: scrolled ? 'blur(12px)' : 'none',
      boxShadow: scrolled ? '0 1px 8px rgba(0,0,0,0.07)' : 'none',
      transition: 'all 0.2s',
      fontFamily: "'DM Sans','Inter',sans-serif",
    }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.25rem', height: 60, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>

        {/* ── Logo ── */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 8,
            background: T.navy,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0,
          }}>
            {/* Leaf SVG inline */}
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 8C8 10 5.9 16.17 3.82 22.2"/>
              <path d="M21 4a20 20 0 0 1-3 0c-3.41-.17-6.78-1-10-3 0 7 4 12 8 13"/>
            </svg>
          </div>
          <div style={{ display: 'none' }} className="sm-show">
            <p style={{ fontWeight: 800, fontSize: '1rem', color: T.navy, margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>CleanAir</p>
            <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0, fontWeight: 500 }}>Bengaluru</p>
          </div>
          <div style={{ display: 'block' }}>
            <p style={{ fontWeight: 800, fontSize: '1rem', color: T.navy, margin: 0, lineHeight: 1.1, letterSpacing: '-0.01em' }}>CleanAir</p>
            <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0, fontWeight: 500 }}>Bengaluru</p>
          </div>
        </Link>

        {/* ── Desktop nav ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, justifyContent: 'center' }}
          className="desktop-nav">
          {NAV.map(n => {
            const active = location.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} data-tour={n.tour} style={{
                display: 'flex', alignItems: 'center',
                padding: '0.4rem 0.75rem',
                borderRadius: 4,
                textDecoration: 'none',
                fontSize: '0.8125rem',
                fontWeight: active ? 700 : 500,
                color: active ? T.navy : T.textMuted,
                background: active ? `${T.navy}0D` : 'transparent',
                borderBottom: active ? `2px solid ${T.navy}` : '2px solid transparent',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.color = T.textPrimary; e.currentTarget.style.background = T.surface; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.color = T.textMuted; e.currentTarget.style.background = 'transparent'; } }}
              >
                {n.label}
              </Link>
            );
          })}
        </div>

        {/* ── Right controls ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>

          {/* AQI chip */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 6,
            padding: '0.3rem 0.75rem',
            border: `1.5px solid ${aqiColor}30`,
            borderRadius: 4, background: aqiColor + '0F',
          }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: aqiColor, display: 'inline-block', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 700, color: aqiColor, letterSpacing: '0.03em' }}>
              AQI {currentAQI}
            </span>
            <span style={{ fontSize: '0.68rem', color: T.textMuted, fontWeight: 500 }}>{aqiLabel}</span>
          </div>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDarkMode}
            title={darkMode ? 'Light mode' : 'Dark mode'}
            style={{
              width: 34, height: 34, borderRadius: 4, border: `1.5px solid ${T.border}`,
              background: 'white', color: T.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.color = T.navy; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            {darkMode ? <Icon.Sun /> : <Icon.Moon />}
          </button>

          {/* Notifications */}
          <button
            onClick={() => navigate('/notifications')}
            title="Notifications"
            style={{
              width: 34, height: 34, borderRadius: 4, border: `1.5px solid ${T.border}`,
              background: 'white', color: T.textMuted,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', position: 'relative', transition: 'all 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.borderColor = T.navy; e.currentTarget.style.color = T.navy; }}
            onMouseLeave={e => { e.currentTarget.style.borderColor = T.border; e.currentTarget.style.color = T.textMuted; }}
          >
            <Icon.Bell />
            {unread > 0 && (
              <span style={{
                position: 'absolute', top: 4, right: 4,
                width: 8, height: 8, borderRadius: '50%',
                background: T.danger, border: '1.5px solid white',
              }} />
            )}
          </button>

          {/* Auth */}
          {user ? (
            <div style={{ position: 'relative' }}>
              <button
                onClick={e => { e.stopPropagation(); setUserMenuOpen(o => !o); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '0.3rem 0.625rem 0.3rem 0.3rem',
                  border: `1.5px solid ${T.border}`, borderRadius: 4,
                  background: 'white', cursor: 'pointer', transition: 'all 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = T.navy)}
                onMouseLeave={e => (e.currentTarget.style.borderColor = T.border)}
              >
                <div style={{
                  width: 26, height: 26, borderRadius: 4,
                  background: T.navy, color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 800, fontSize: '0.8rem', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.textPrimary, maxWidth: 80, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.displayName?.split(' ')[0] || 'Account'}
                </span>
              </button>

              {/* Dropdown */}
              {userMenuOpen && (
                <div style={{
                  position: 'absolute', right: 0, top: 'calc(100% + 6px)',
                  width: 200, background: T.card,
                  border: `1px solid ${T.border}`, borderRadius: 6,
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                  zIndex: 100, overflow: 'hidden',
                }}>
                  <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}`, background: T.surface }}>
                    <p style={{ fontWeight: 700, fontSize: '0.875rem', color: T.textPrimary, margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.displayName}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {user.email}
                    </p>
                  </div>
                  {[
                    { to: '/karma',  label: 'My Karma Score', icon: <Icon.Star /> },
                    { to: '/diary',  label: 'Field Diary',    icon: <Icon.Book /> },
                  ].map(item => (
                    <Link key={item.to} to={item.to} onClick={() => setUserMenuOpen(false)} style={{
                      display: 'flex', alignItems: 'center', gap: 10,
                      padding: '0.625rem 1rem', textDecoration: 'none',
                      fontSize: '0.875rem', color: T.textPrimary,
                      borderBottom: `1px solid ${T.border}`, transition: 'background 0.1s',
                    }}
                      onMouseEnter={e => (e.currentTarget.style.background = T.surface)}
                      onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                    >
                      <span style={{ color: T.textMuted }}>{item.icon}</span>{item.label}
                    </Link>
                  ))}
                  <button onClick={handleAuth} style={{
                    display: 'flex', alignItems: 'center', gap: 10, width: '100%',
                    padding: '0.625rem 1rem', border: 'none',
                    background: 'transparent', color: T.danger,
                    fontSize: '0.875rem', fontWeight: 600, cursor: 'pointer',
                    textAlign: 'left', transition: 'background 0.1s', fontFamily: 'inherit',
                  }}
                    onMouseEnter={e => (e.currentTarget.style.background = '#FFF5F5')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <Icon.LogOut /> Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <button
              onClick={handleAuth}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0.4rem 1rem',
                background: T.navy, color: 'white',
                border: 'none', borderRadius: 4,
                fontWeight: 700, fontSize: '0.8125rem',
                cursor: 'pointer', transition: 'opacity 0.15s',
                fontFamily: 'inherit',
              }}
              onMouseEnter={e => (e.currentTarget.style.opacity = '0.88')}
              onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
            >
              <Icon.User /> Sign In
            </button>
          )}

          {/* Mobile hamburger */}
          <button
            onClick={() => setMenuOpen(m => !m)}
            className="mobile-menu-btn"
            style={{
              width: 34, height: 34, borderRadius: 4, border: `1.5px solid ${T.border}`,
              background: 'white', color: T.textMuted,
              display: 'none', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            {menuOpen ? <Icon.X /> : <Icon.Menu />}
          </button>
        </div>
      </div>

      {/* ── Mobile menu ── */}
      {menuOpen && (
        <div style={{
          borderTop: `1px solid ${T.border}`,
          background: T.card,
          boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
        }}>
          {NAV.map((n, i) => {
            const active = location.pathname === n.to;
            return (
              <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} style={{
                display: 'flex', alignItems: 'center',
                padding: '0.75rem 1.25rem',
                textDecoration: 'none',
                fontSize: '0.9rem', fontWeight: active ? 700 : 500,
                color: active ? T.navy : T.textPrimary,
                background: active ? `${T.navy}08` : 'transparent',
                borderLeft: active ? `3px solid ${T.navy}` : '3px solid transparent',
                borderBottom: i < NAV.length - 1 ? `1px solid ${T.border}` : 'none',
                transition: 'all 0.1s',
              }}>
                {n.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Responsive styles injected */}
      <style>{`
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: flex !important; }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </nav>
  );
}