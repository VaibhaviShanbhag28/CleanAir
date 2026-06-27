import { useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { signOut } from 'firebase/auth'
import {
  Wind, Map, Plus, BarChart3, Shield, Bell, Settings,
  Menu, X, Sun, Moon, Globe, LogOut, User, ChevronDown, AlertTriangle,
} from 'lucide-react'
import { auth } from '@/lib/firebase'
import { useStore } from '@/store'
import { useTranslation } from '@/lib/i18n'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { Language, Theme } from '@/types'

export function Navbar() {
  const { user, theme, setTheme, language, setLanguage, notifications } = useStore()
  const { t } = useTranslation(language)
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const unreadCount = notifications.filter((n) => !n.read).length

  const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)

  const toggleTheme = () => {
    const next: Theme = isDark ? 'light' : 'dark'
    setTheme(next)
    document.documentElement.classList.toggle('dark', next === 'dark')
  }

  const cycleLanguage = () => {
    const langs: Language[] = ['en', 'hi', 'kn']
    const idx = langs.indexOf(language)
    setLanguage(langs[(idx + 1) % langs.length])
  }

  const handleLogout = async () => {
    await signOut(auth)
    useStore.getState().setUser(null)
    navigate('/')
  }

  const navLinks = [
    { to: '/map', label: t('view_map'), icon: Map },
    { to: '/report', label: t('report_pollution'), icon: Plus },
    { to: '/dashboard', label: t('dashboard'), icon: BarChart3 },
    ...(user?.role === 'authority' || user?.role === 'admin'
      ? [{ to: '/municipal', label: 'Municipal', icon: Shield }]
      : []),
  ]

  const isActive = (to: string) => location.pathname === to || location.pathname.startsWith(to + '/')

  return (
    <nav className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" aria-label="CleanAir Home">
            <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm group-hover:shadow-md transition-shadow">
              <Wind className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500" />
              </span>
            </div>
            <div className="flex flex-col leading-none">
              <span className="font-display font-bold text-base text-foreground">{t('app_name')}</span>
              <span className="text-[10px] text-muted-foreground font-medium tracking-wide hidden sm:block">CLEAR STREETS</span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-all',
                  isActive(to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </div>

          {/* Right side actions */}
          <div className="flex items-center gap-2">
            {/* Language toggle */}
            <button
              onClick={cycleLanguage}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              aria-label="Change language"
              title="Change language"
            >
              <Globe className="h-4 w-4" />
              <span className="hidden sm:block uppercase">{language}</span>
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              className="flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
              aria-label="Toggle theme"
            >
              {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Notifications */}
            {user && (
              <Link
                to="/notifications"
                className="relative flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-all"
                aria-label={`Notifications (${unreadCount} unread)`}
              >
                <Bell className="h-4 w-4" />
                {unreadCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-white">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </Link>
            )}

            {/* User menu / Auth */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-muted transition-all"
                  aria-expanded={profileOpen}
                  aria-label="User menu"
                >
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                    {user.displayName?.[0] || user.email?.[0] || 'U'}
                  </div>
                  <ChevronDown className={cn('h-3 w-3 text-muted-foreground transition-transform', profileOpen && 'rotate-180')} />
                </button>
                {profileOpen && (
                  <div className="absolute right-0 mt-2 w-52 rounded-xl border border-border bg-card shadow-lg py-1 z-50 animate-fade-in">
                    <div className="px-3 py-2 border-b border-border">
                      <p className="text-sm font-medium truncate">{user.displayName || 'User'}</p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <Link to="/my-reports" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                      <User className="h-4 w-4" /> {t('my_reports')}
                    </Link>
                    <Link to="/settings" className="flex items-center gap-2 px-3 py-2 text-sm hover:bg-muted transition-colors" onClick={() => setProfileOpen(false)}>
                      <Settings className="h-4 w-4" /> {t('settings')}
                    </Link>
                    <button className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors" onClick={handleLogout}>
                      <LogOut className="h-4 w-4" /> {t('logout')}
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden md:flex items-center gap-2">
                <Button variant="ghost" size="sm" asChild>
                  <Link to="/login">{t('login')}</Link>
                </Button>
                <Button size="sm" asChild>
                  <Link to="/signup">{t('signup')}</Link>
                </Button>
              </div>
            )}

            {/* Mobile menu button */}
            <button
              className="flex md:hidden h-9 w-9 items-center justify-center rounded-lg hover:bg-muted transition-all"
              onClick={() => setMobileOpen(!mobileOpen)}
              aria-label="Toggle menu"
              aria-expanded={mobileOpen}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden border-t border-border pb-4 pt-2 animate-fade-in">
            {navLinks.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                className={cn(
                  'flex items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-all',
                  isActive(to)
                    ? 'bg-primary/10 text-primary'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )}
                onClick={() => setMobileOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {label}
              </Link>
            ))}
            {!user && (
              <div className="mt-3 flex flex-col gap-2 px-3">
                <Button variant="outline" asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/login">{t('login')}</Link>
                </Button>
                <Button asChild onClick={() => setMobileOpen(false)}>
                  <Link to="/signup">{t('signup')}</Link>
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Critical alert banner */}
      <div className="bg-destructive/90 px-4 py-1.5 hidden" id="alert-banner">
        <div className="mx-auto max-w-7xl flex items-center gap-2 text-sm text-white">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>Severe pollution detected in Hebbal. Authorities have been notified.</span>
        </div>
      </div>
    </nav>
  )
}
