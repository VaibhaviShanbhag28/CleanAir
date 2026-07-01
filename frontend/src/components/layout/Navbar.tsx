import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/store';
import { signInWithGoogle, signOutUser } from '@/lib/firebase';
import { Avatar, Button, Badge } from '@/components/ui';
import { cn } from '@/lib/utils';
import { getAQIColor, getAQILabel } from '@/lib/utils';

const NAV = [
  { to: '/', label: 'Dashboard', icon: '🏠' },
  { to: '/report', label: 'Report', icon: '📸' },
  { to: '/map', label: 'Live Map', icon: '🗺️' },
  { to: '/karma', label: 'Karma', icon: '⭐' },
  { to: '/community', label: 'Community', icon: '🌱' },
  { to: '/diary', label: 'Diary', icon: '📔' },
  { to: '/tools', label: 'AI Tools', icon: '🤖' },
  { to: '/municipal', label: 'Municipal', icon: '🏛️' },
];

export default function Navbar() {
  const { user, darkMode, toggleDarkMode, currentAQI, notifications, toggleSidebar } = useAppStore();
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const handleAuth = async () => {
    if (user) { await signOutUser(); useAppStore.getState().setUser(null); }
    else { try { await signInWithGoogle(); } catch (e) { console.error(e); } }
  };

  const aqiColor = getAQIColor(currentAQI);
  const unread = (notifications as {read?:boolean}[]).filter(n => !n.read).length;

  return (
    <nav className={cn('fixed top-0 left-0 right-0 z-40 transition-all duration-300', scrolled ? 'glass shadow-md' : 'bg-card/95 border-b border-border')}>
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl gradient-green flex items-center justify-center shadow-md">
            <span className="text-xl">🌿</span>
          </div>
          <div className="hidden sm:block">
            <span className="font-bold text-lg text-primary leading-tight block" style={{fontFamily:'Space Grotesk'}}>CleanAir</span>
            <span className="text-xs text-muted-foreground -mt-1 block">Bengaluru</span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden lg:flex items-center gap-1 flex-1 justify-center">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} className={cn('flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium transition-all', location.pathname === n.to ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:text-foreground hover:bg-accent')}>
              <span>{n.icon}</span>{n.label}
            </Link>
          ))}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2 flex-shrink-0">
          {/* AQI pill */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-xs font-bold" style={{ borderColor: aqiColor, color: aqiColor, backgroundColor: aqiColor + '15' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: aqiColor }} />
            AQI {currentAQI}
          </div>

          {/* Dark mode */}
          <button onClick={toggleDarkMode} className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            {darkMode ? '☀️' : '🌙'}
          </button>

          {/* Notifications */}
          <button onClick={() => navigate('/notifications')} className="relative p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground">
            🔔
            {unread > 0 && <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">{unread}</span>}
          </button>

          {/* Auth */}
          {user ? (
            <div className="relative group">
              <button className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors">
                <Avatar name={user.displayName || user.email} size="sm" />
              </button>
              <div className="absolute right-0 top-full mt-1 w-48 bg-card border rounded-xl shadow-xl py-1 hidden group-hover:block z-50">
                <div className="px-3 py-2 border-b">
                  <p className="text-sm font-medium truncate">{user.displayName}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
                <Link to="/karma" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">⭐ My Karma</Link>
                <Link to="/diary" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-accent">📔 My Diary</Link>
                <button onClick={handleAuth} className="flex items-center gap-2 px-3 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 w-full">🚪 Sign Out</button>
              </div>
            </div>
          ) : (
            <Button size="sm" onClick={handleAuth}>Sign In</Button>
          )}

          {/* Mobile hamburger */}
          <button onClick={() => setMenuOpen(m => !m)} className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors">
            {menuOpen ? '✕' : '☰'}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="lg:hidden bg-card border-t shadow-lg">
          {NAV.map(n => (
            <Link key={n.to} to={n.to} onClick={() => setMenuOpen(false)} className={cn('flex items-center gap-3 px-5 py-3 text-sm font-medium border-b border-border/50 transition-colors', location.pathname === n.to ? 'text-primary bg-primary/5' : 'text-foreground hover:bg-accent')}>
              <span className="text-lg">{n.icon}</span>{n.label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}
