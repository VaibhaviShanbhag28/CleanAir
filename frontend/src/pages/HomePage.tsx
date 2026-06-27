import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  Wind, MapPin, Camera, Mic, Shield, TrendingUp, Users,
  ArrowRight, Zap, Globe2, ChevronRight, Star,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/index'
import { AQIBadge, AQIGauge } from '@/components/ui/AQIBadge'
import { ReportCard } from '@/components/reports/ReportCard'
import { useStore } from '@/store'
import { useTranslation } from '@/lib/i18n'
import { DEMO_REPORTS, DEMO_ANALYTICS } from '@/lib/mockData'
import { formatRelativeTime } from '@/lib/utils'

const LIVE_AQI = 158 // Would come from API in production

export default function HomePage() {
  const { language } = useStore()
  const { t } = useTranslation(language)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [statsVisible, setStatsVisible] = useState(false)

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => setStatsVisible(true), 300)
    return () => clearTimeout(timer)
  }, [])

  const recentReports = DEMO_REPORTS.slice(0, 3)

  return (
    <div className="min-h-screen">
      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-br from-background via-background to-primary/5 border-b border-border">
        {/* Background decoration */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-20 right-10 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute -bottom-10 left-20 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
        </div>

        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:py-28 sm:px-6">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Copy */}
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-sm text-primary font-medium">
                <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                Real time air quality monitoring of Bengaluru
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight tracking-tight">
                Clean Air Starts{' '}
                <span className="text-primary">With You</span>
              </h1>

              <p className="text-lg text-muted-foreground max-w-md leading-relaxed">
                See smoke, dust, or garbage burning near you? Snap a photo and report it in seconds. Our AI identifies the problem instantly and notifies the right authorities . So your city gets cleaner, faster.
              </p>

              <div className="flex flex-wrap gap-3">
                <Button size="lg" asChild>
                  <Link to="/report">
                    <Camera className="h-5 w-5" />
                    Report Pollution Now
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link to="/map">
                    <MapPin className="h-5 w-5" />
                    View Live Heatmap
                  </Link>
                </Button>
                <Button size="sm" variant="ghost" asChild>
                  <Link to="/report?anonymous=true">
                    🕵️ Report Anonymously (no account needed)
                  </Link>
                </Button>
              </div>

              {/* Trust signals */}
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground pt-2">
                <span className="flex items-center gap-1.5">
                  <Shield className="h-4 w-4 text-primary" />
                  BBMP & KSPCB Integrated
                </span>
                <span className="flex items-center gap-1.5">
                  <Zap className="h-4 w-4 text-primary" />
                  Gemini AI Analysis
                </span>
                <span className="flex items-center gap-1.5">
                  <Globe2 className="h-4 w-4 text-primary" />
                  English
                </span>
              </div>
            </div>

            {/* Right: Live AQI card */}
            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm">
                <Card className="shadow-2xl border-2 border-border">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Live Air Quality Index</p>
                        <p className="text-sm font-semibold">Bengaluru, Karnataka</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          {currentTime.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {currentTime.toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-center my-4">
                      <AQIGauge value={LIVE_AQI} size={140} />
                    </div>

                    <div className="grid grid-cols-3 gap-3 mt-4">
                      {[
                        { label: 'PM2.5', value: '85 μg/m³' },
                        { label: 'PM10', value: '142 μg/m³' },
                        { label: 'NO₂', value: '38 ppb' },
                      ].map(({ label, value }) => (
                        <div key={label} className="text-center rounded-lg bg-muted p-2">
                          <p className="text-xs text-muted-foreground">{label}</p>
                          <p className="text-sm font-semibold font-mono">{value}</p>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                      ⚠️ Air quality is unhealthy. Children, elderly, and those with asthma should stay indoors.
                    </div>

                    {/* Recent hotspot count */}
                    <div className="mt-3 flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">🔴 Active pollution reports today</span>
                      <span className="font-bold text-destructive">
                        {DEMO_REPORTS.filter(r => r.status === 'pending').length} hotspots
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats row ───────────────────────────────────────────────────── */}
      <section className="border-b border-border bg-muted/30">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <div
            className={`grid grid-cols-2 sm:grid-cols-4 gap-6 transition-all duration-700 ${
              statsVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
            }`}
          >
            {[
              { label: 'Pollution Reports Filed', value: DEMO_ANALYTICS.totalReports.toLocaleString(), icon: Camera, color: 'text-blue-600' },
              { label: 'Issues Resolved', value: DEMO_ANALYTICS.resolvedReports.toLocaleString(), icon: Shield, color: 'text-green-600' },
              { label: 'Citizens Protected', value: `${(DEMO_ANALYTICS.estimatedPeopleAffected / 1000).toFixed(0)}K+`, icon: Users, color: 'text-orange-600' },
              { label: 'Avg. Authority Response', value: `${DEMO_ANALYTICS.avgResponseTimeHours}h`, icon: TrendingUp, color: 'text-purple-600' },
            ].map(({ label, value, icon: Icon, color }) => (
              <div key={label} className="text-center">
                <div className={`text-3xl font-bold font-mono mb-1 ${color}`}>{value}</div>
                <div className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
                  <Icon className={`h-3.5 w-3.5 ${color}`} />
                  {label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-3">How CleanAir Works</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Anyone can make Bengaluru cleaner. 
              Here's how it works in 3 simple steps!! No technical knowledge needed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                step: '01',
                icon: Camera,
                title: 'Spot & Report',
                description: 'See smoke, dust, or garbage? Take a photo or record a voice note. Your GPS location is captured automatically.',
                color: 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800',
                iconColor: 'text-blue-600',
              },
              {
                step: '02',
                icon: Zap,
                title: 'AI Analyses It Instantly',
                description: 'Google\'s Gemini AI scans your photo in seconds and identifies pollution type, severity, and health risk. No guesswork, just facts.',
                color: 'bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800',
                iconColor: 'text-purple-600',
              },
              {
                step: '03',
                icon: Shield,
                title: 'Authorities Take Action',
                description: 'BBMP and KSPCB teams get an instant alert with your report. They assign a response team, track progress, and mark it resolved. You can follow along live.',
                color: 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800',
                iconColor: 'text-green-600',
              },
            ].map(({ step, icon: Icon, title, description, color, iconColor }) => (
              <div key={step} className={`rounded-2xl border p-6 ${color} transition-all hover:shadow-md`}>
                <div className="flex items-center gap-3 mb-4">
                  <span className="text-4xl font-bold font-mono text-muted-foreground/30">{step}</span>
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-black/20 shadow-sm`}>
                    <Icon className={`h-5 w-5 ${iconColor}`} />
                  </div>
                </div>
                <h3 className="font-bold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features Grid ────────────────────────────────────────────────── */}
      <section className="py-16 px-4 sm:px-6 bg-muted/20 border-y border-border">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-2xl font-bold mb-8 text-center">Platform Features</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { icon: '🗺️', title: 'Live Heatmap', desc: 'Real-time pollution hotspots on Google Maps with satellite view' },
              { icon: '🤖', title: 'Gemini AI Analysis', desc: 'Instant smoke, dust, and fire detection from photos' },
              { icon: '📊', title: '24h AQI Forecast', desc: 'ML-powered predictions using weather and historical data' },
              { icon: '🔔', title: 'Authority Alerts', desc: 'Instant email and SMS notifications to municipal bodies' },
              { icon: '🎙️', title: 'Voice Reporting', desc: 'Report pollution hands-free using speech-to-text' },
              { icon: '🌐', title: 'Multilingual', desc: 'Available in English, Hindi, and Kannada in future' },
              { icon: '♿', title: 'Accessible', desc: 'WCAG 2.1 AA compliant with keyboard navigation' },
              { icon: '📱', title: 'Works Offline', desc: 'Save drafts offline and sync when connected' },
            ].map(({ icon, title, desc }) => (
              <Card key={title} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <span className="text-2xl mb-2 block">{icon}</span>
                  <h3 className="font-semibold text-sm mb-1">{title}</h3>
                  <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ── Recent Reports ───────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold">Recent Reports</h2>
              <p className="text-muted-foreground text-sm mt-1">Latest citizen-submitted pollution incidents</p>
            </div>
            <Button variant="outline" asChild>
              <Link to="/map">
                View all <ChevronRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {recentReports.map((report) => (
              <ReportCard
                key={report.id}
                report={report}
                onViewDetails={() => {/* navigate to detail */}}
              />
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="py-20 px-4 sm:px-6 bg-primary text-primary-foreground">
        <div className="mx-auto max-w-3xl text-center">
          <Wind className="h-12 w-12 mx-auto mb-4 opacity-80" />
          <h2 className="text-3xl font-bold mb-4">Your City, Your Air</h2>
          <p className="text-primary-foreground/80 mb-8 text-lg">
            Every Report you file brings Bengaluru one step closer to cleaner streets. 
            It takes 30 seconds and it matters. Join thousands of citizens already making a difference.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button size="xl" variant="secondary" asChild>
              <Link to="/signup">Create Free Account</Link>
            </Button>
            <Button size="xl" variant="ghost" className="text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10" asChild>
              <Link to="/report?anonymous=true">
                <Mic className="h-5 w-5" />
                Report Without Signing Up
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-8 px-4 sm:px-6 text-sm text-muted-foreground">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Wind className="h-4 w-4 text-primary" />
            <span className="font-semibold text-foreground">CleanAir</span>
            <span>Making Bengaluru breathe easier, One report at a time.</span>
          </div>
          <div className="flex gap-6">
            <Link to="/map" className="hover:text-foreground transition-colors">Map</Link>
            <Link to="/report" className="hover:text-foreground transition-colors">Report</Link>
            <Link to="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link>
            <Link to="/municipal" className="hover:text-foreground transition-colors">Municipal</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
