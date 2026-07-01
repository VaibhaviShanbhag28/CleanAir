import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardHeader, CardTitle, CardContent, StatCard, Badge, Skeleton } from '@/components/ui';
import { getAQIColor, getAQILabel, getPollutionIcon, formatTimeAgo } from '@/lib/utils';
import type { AnalyticsOverview, Report } from '@/types';

const AQI_COLORS: Record<string, string> = {
  garbage_fire:'#FF3D00', smoke:'#607D8B', construction_dust:'#FF9100',
  vehicle:'#7B1FA2', burning_waste:'#E65100', illegal_dumping:'#795548', unknown:'#9E9E9E'
};

interface Insights {
  headline?: string;
  insights?: { title: string; description: string; priority: string; category: string }[];
  environmental_score?: number;
  trend?: string;
}

interface Horoscope {
  title?: string; forecast?: string; emoji?: string;
  eco_tip_of_day?: string; outdoor_rating?: string;
  mask_tip?: string; best_time_outdoor?: string;
}

export default function Dashboard() {
  const { currentAQI, setCurrentAQI, setAnalytics, setReports } = useAppStore();
  const [analytics, setLocalAnalytics] = useState<AnalyticsOverview | null>(null);
  const [reports, setLocalReports] = useState<Report[]>([]);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [horoscope, setHoroscope] = useState<Horoscope | null>(null);
  const [weather, setWeather] = useState<{ temperature?: number; humidity?: number; description?: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  useEffect(() => {
    const loadCore = async () => {
      try {
        const [ana, reps, wx] = await Promise.allSettled([
          api.analytics.overview() as Promise<AnalyticsOverview>,
          api.reports.list({ limit: '8', time_filter: 'all' }) as Promise<Report[]>,
          api.weather.current(),
        ]);

        if (ana.status === 'fulfilled') {
          setLocalAnalytics(ana.value);
          setAnalytics(ana.value);
        }
        if (reps.status === 'fulfilled') {
          setLocalReports(reps.value);
          setReports(reps.value);
        }
        if (wx.status === 'fulfilled') {
          const wxData = wx.value as { weather?: { temperature?: number; humidity?: number; description?: string }; aqi?: number };
          setWeather(wxData.weather ?? null);
          if (wxData.aqi) setCurrentAQI(wxData.aqi);
        }
      } catch (e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };

    const loadAI = async () => {
      setAiLoading(true);
      try {
        const [ins, hor] = await Promise.allSettled([
          api.analytics.aiInsights(),
          api.ai.horoscope(currentAQI),
        ]);

        if (ins.status === 'fulfilled' && ins.value) {
          // Backend returns either {aiInsights: {...}} or flat object
          const raw = ins.value as Record<string, unknown>;
          const parsed = raw.aiInsights ? raw.aiInsights as Insights : raw as Insights;
          setInsights(parsed);
        }
        if (hor.status === 'fulfilled' && hor.value) {
          setHoroscope(hor.value as Horoscope);
        }
      } catch (e) {
        console.error('AI load error:', e);
      } finally {
        setAiLoading(false);
      }
    };

    loadCore();
    loadAI();
  }, []);

  const aqiColor = getAQIColor(currentAQI);
  const monthlyData = analytics?.monthlyStats ?? [];
  const typeData = Object.entries(analytics?.typeDistribution ?? {}).map(([k, v]) => ({
    name: k.replace(/_/g, ' '), value: v as number, color: AQI_COLORS[k] ?? '#888'
  }));

  if (loading) return (
    <div className="p-2 space-y-6">
      <Skeleton className="h-32 rounded-2xl" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28" />)}
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64" />)}
      </div>
    </div>
  );

  return (
    <div className="space-y-6 page-enter">
      {/* Hero */}
      <div className="gradient-green rounded-2xl p-6 text-white relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 80% 50%, white 0%, transparent 60%)' }} />
        <div className="relative flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Space Grotesk' }}>🌿 CleanAir Dashboard</h1>
            <p className="text-white/80 text-sm">Bengaluru Environmental Monitoring — Live</p>
            {weather && (
              <p className="text-white/70 text-sm mt-1">
                🌤 {weather.temperature?.toFixed(1)}°C · {weather.humidity}% humidity · {weather.description}
              </p>
            )}
          </div>
          <div className="flex flex-col items-center bg-white/20 backdrop-blur rounded-2xl px-6 py-3">
            <span className="text-4xl font-black" style={{ color: currentAQI > 150 ? '#FFD600' : 'white' }}>{currentAQI}</span>
            <span className="text-white/90 text-xs font-medium mt-0.5">AQI · {getAQILabel(currentAQI)}</span>
            <span className="w-2 h-2 rounded-full mt-2 animate-pulse" style={{ backgroundColor: aqiColor }} />
          </div>
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { to: '/report', icon: '📸', label: 'Report Issue', color: 'bg-red-500' },
          { to: '/tools?tab=waste', icon: '♻️', label: 'Classify Waste', color: 'bg-blue-500' },
          { to: '/tools?tab=carbon', icon: '🌍', label: 'Carbon Calc', color: 'bg-purple-500' },
          { to: '/community', icon: '🌱', label: 'Join Event', color: 'bg-green-600' },
        ].map(a => (
          <Link key={a.to} to={a.to} className={`${a.color} text-white rounded-xl p-4 flex flex-col items-center gap-2 hover:opacity-90 transition-all active:scale-95 shadow-sm`}>
            <span className="text-2xl">{a.icon}</span>
            <span className="text-xs font-semibold text-center">{a.label}</span>
          </Link>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Total Reports" value={analytics?.totalReports ?? 0} icon="📊" color="blue" subtitle="All time" trend={12} />
        <StatCard title="Resolved" value={analytics?.resolvedReports ?? 0} icon="✅" color="green"
          subtitle={`${analytics && analytics.totalReports > 0 ? Math.round(analytics.resolvedReports / analytics.totalReports * 100) : 0}% rate`} trend={8} />
        <StatCard title="Pending" value={analytics?.pendingReports ?? 0} icon="⏳" color="orange" subtitle="Awaiting action" />
        <StatCard title="People Affected" value={(analytics?.estimatedPeopleAffected ?? 0).toLocaleString('en-IN')} icon="👥" color="purple" subtitle="Est. citizens impacted" />
      </div>

      {/* AI Horoscope — only render if data exists */}
      {!aiLoading && horoscope && horoscope.title && (
        <Card className="border-l-4 border-l-primary bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/10">
          <CardContent className="p-4 flex flex-wrap items-start gap-4">
            <div className="text-4xl">{horoscope.emoji ?? '🌤'}</div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-primary">{horoscope.title}</p>
              <p className="text-sm text-muted-foreground mt-0.5">{horoscope.forecast}</p>
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-muted-foreground">
                {horoscope.best_time_outdoor && <span>🕐 Best time: {horoscope.best_time_outdoor}</span>}
                {horoscope.mask_tip && <span>😷 {horoscope.mask_tip}</span>}
                {horoscope.outdoor_rating && <span>⭐ {horoscope.outdoor_rating}</span>}
              </div>
            </div>
            {horoscope.eco_tip_of_day && (
              <div className="bg-green-100 dark:bg-green-900/30 rounded-xl px-3 py-2 text-xs text-green-700 dark:text-green-400 font-medium max-w-xs">
                💡 {horoscope.eco_tip_of_day}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      {aiLoading && (
        <Skeleton className="h-24 rounded-2xl" />
      )}

      {/* AI Insights — only render if data exists */}
      {!aiLoading && insights && insights.headline && (
        <Card>
          <CardHeader><CardTitle>🧠 AI Environmental Insights</CardTitle></CardHeader>
          <CardContent>
            <p className="text-sm font-medium text-orange-600 dark:text-orange-400 mb-3">⚡ {insights.headline}</p>
            <div className="grid sm:grid-cols-3 gap-3">
              {(insights.insights ?? []).map((ins, i) => (
                <div key={i} className={`rounded-xl p-3 border ${
                  ins.priority === 'high' ? 'border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/10'
                  : ins.priority === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-900/10'
                  : 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/10'}`}>
                  <p className="font-semibold text-sm mb-1">{ins.title}</p>
                  <p className="text-xs text-muted-foreground">{ins.description}</p>
                  <Badge variant={ins.priority === 'high' ? 'danger' : ins.priority === 'medium' ? 'warning' : 'success'} className="mt-2 capitalize">{ins.priority}</Badge>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center gap-3">
              <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                <div className="h-full rounded-full bg-primary transition-all duration-1000" style={{ width: `${insights.environmental_score ?? 60}%` }} />
              </div>
              <span className="text-sm font-bold text-primary">{insights.environmental_score ?? 60}/100</span>
              {insights.trend && (
                <Badge variant={insights.trend === 'improving' ? 'success' : insights.trend === 'worsening' ? 'danger' : 'info'} className="capitalize">{insights.trend}</Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
      {aiLoading && <Skeleton className="h-48 rounded-xl" />}

      {/* Charts */}
      <div className="grid lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle>📈 Monthly Reports Trend</CardTitle></CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={monthlyData}>
                  <defs>
                    <linearGradient id="colR" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#1B5E20" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#1B5E20" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="colG" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#00C853" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#00C853" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  <Area type="monotone" dataKey="reports" stroke="#1B5E20" fill="url(#colR)" strokeWidth={2} name="Reports" />
                  <Area type="monotone" dataKey="resolved" stroke="#00C853" fill="url(#colG)" strokeWidth={2} name="Resolved" />
                </AreaChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No monthly data yet</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>🏷️ Pollution Types</CardTitle></CardHeader>
          <CardContent>
            {typeData.length > 0 ? (
              <>
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie data={typeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} paddingAngle={3} dataKey="value">
                      {typeData.map((e, i) => <Cell key={i} fill={e.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 space-y-1">
                  {typeData.slice(0, 4).map((t, i) => (
                    <div key={i} className="flex items-center gap-2 text-xs">
                      <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: t.color }} />
                      <span className="text-muted-foreground capitalize truncate flex-1">{t.name}</span>
                      <span className="font-medium">{t.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">No data yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Ward rankings + Recent reports */}
      <div className="grid lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader><CardTitle>🏆 Most Polluted Wards</CardTitle></CardHeader>
          <CardContent>
            {(analytics?.wardRankings ?? []).length === 0 ? (
              <p className="text-center text-muted-foreground py-6 text-sm">No ward data yet</p>
            ) : (
              <div className="space-y-2.5">
                {(analytics?.wardRankings ?? []).slice(0, 6).map((w, i) => {
                  const max = analytics?.wardRankings?.[0]?.count ?? 1;
                  return (
                    <div key={w.ward} className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i < 3 ? 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' : 'bg-muted text-muted-foreground'}`}>{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="font-medium truncate">{w.ward}</span>
                          <span className="text-muted-foreground ml-2 flex-shrink-0">{w.count}</span>
                        </div>
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(w.count / max) * 100}%` }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>📋 Recent Reports</CardTitle>
            <Link to="/map" className="text-xs text-primary hover:underline">View all →</Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {reports.length === 0 ? (
                <p className="text-center text-muted-foreground text-sm py-8">No reports yet. Be the first to report!</p>
              ) : reports.slice(0, 5).map(r => (
                <div key={r.id} className="flex items-start gap-3 p-2.5 rounded-lg hover:bg-accent transition-colors">
                  <span className="text-2xl flex-shrink-0 mt-0.5">{getPollutionIcon(r.pollutionType)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-medium capitalize">{r.pollutionType.replace(/_/g, ' ')}</span>
                      <Badge variant={r.severity === 'high' ? 'danger' : r.severity === 'medium' ? 'warning' : 'success'} className="capitalize">{r.severity}</Badge>
                      <Badge variant={r.status === 'resolved' ? 'success' : r.status === 'in_progress' ? 'info' : 'default'} className="capitalize">{r.status.replace(/_/g, ' ')}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">{r.location?.ward} · {formatTimeAgo(r.createdAt)}</p>
                    <p className="text-xs text-muted-foreground truncate">{r.description?.slice(0, 80)}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AQI bar chart */}
      {monthlyData.length > 0 && (
        <Card>
          <CardHeader><CardTitle>📊 Average AQI by Month</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 12 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
                <Bar dataKey="avgAQI" name="Avg AQI" radius={[4, 4, 0, 0]}>
                  {monthlyData.map((e, i) => <Cell key={i} fill={getAQIColor(e.avgAQI)} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
