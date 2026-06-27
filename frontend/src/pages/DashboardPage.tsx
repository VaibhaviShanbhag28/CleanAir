import React, { useEffect, useState } from 'react'
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, LineChart, Line,
} from 'recharts'
import {
  TrendingUp, TrendingDown, Users, CheckCircle2, Clock,
  AlertTriangle, MapPin, BarChart3, Wind, Droplets, Thermometer,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@/components/ui/index'
import { AQIGauge, AQIBadge } from '@/components/ui/AQIBadge'
import { useStore } from '@/store'
import { DEMO_ANALYTICS, DEMO_REPORTS, generateDemoAQIPrediction } from '@/lib/mockData'
import { getAQIColor } from '@/lib/utils'
import type { AQIPrediction } from '@/types'

const CURRENT_AQI = 158
const WEATHER = { temp: 28, humidity: 62, windSpeed: 12, desc: 'Hazy' }

export default function DashboardPage() {
  const [predictions, setPredictions] = useState<AQIPrediction[]>([])
  const [loading, setLoading] = useState(true)
  const { reports: storeReports } = useStore()

  const allReports = [...storeReports, ...DEMO_REPORTS]
  const analytics = DEMO_ANALYTICS

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setPredictions(generateDemoAQIPrediction())
      setLoading(false)
    }, 800)
    return () => clearTimeout(timer)
  }, [])

  const predictionData = predictions.slice(0, 12).map((p) => ({
    time: `${p.hour}:00`,
    aqi: p.predictedAQI,
    confidence: Math.round(p.confidence * 100),
  }))

  const pollutionTypeData = Object.entries(
    allReports.reduce<Record<string, number>>((acc, r) => {
      acc[r.pollutionType] = (acc[r.pollutionType] || 0) + 1
      return acc
    }, {})
  ).map(([name, count]) => ({ name: name.replace('_', ' '), count }))
    .sort((a, b) => b.count - a.count)

  const wardData = allReports.reduce<Record<string, number>>((acc, r) => {
    const ward = r.location.ward || 'Unknown'
    acc[ward] = (acc[ward] || 0) + 1
    return acc
  }, {})

  const topWards = Object.entries(wardData)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)

  return (
    <div className="min-h-screen bg-muted/20 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold">Impact Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Real-time pollution insights and AQI predictions for Bengaluru
          </p>
        </div>

        {/* ── KPI Row ──────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {loading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i}><CardContent className="p-4 space-y-2"><Skeleton className="h-8 w-20" /><Skeleton className="h-4 w-28" /></CardContent></Card>
            ))
          ) : (
            <>
              <StatCard
                label="Total Reports"
                value={analytics.totalReports}
                icon={BarChart3}
                trend="+12% this month"
                up
              />
              <StatCard
                label="Resolved"
                value={`${analytics.resolvedReports} (${Math.round(analytics.resolvedReports / analytics.totalReports * 100)}%)`}
                icon={CheckCircle2}
                trend="+8% improvement"
                up
                valueClass="text-green-600"
              />
              <StatCard
                label="People Affected"
                value={`~${(analytics.estimatedPeopleAffected / 1000).toFixed(0)}K`}
                icon={Users}
                trend="-5% from last week"
                up={false}
                valueClass="text-orange-600"
              />
              <StatCard
                label="Avg Response"
                value={`${analytics.avgResponseTimeHours}h`}
                icon={Clock}
                trend="-2h improvement"
                up
                valueClass="text-purple-600"
              />
            </>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* ── Left col ───────────────────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-6">
            {/* AQI Prediction Chart */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">24-Hour AQI Forecast</CardTitle>
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                    AI-powered · updates every 30min
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <AreaChart data={predictionData} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <defs>
                        <linearGradient id="aqiGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF3D00" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF3D00" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="time" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" domain={[0, 350]} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                        formatter={(v: number) => [`AQI ${v}`, 'Predicted']}
                      />
                      {/* AQI threshold lines */}
                      {[50, 100, 150, 200].map((y) => (
                        <Line
                          key={y}
                          type="monotone"
                          dataKey={() => y}
                          stroke={getAQIColor(y)}
                          strokeWidth={0.5}
                          strokeDasharray="3 3"
                          dot={false}
                        />
                      ))}
                      <Area
                        type="monotone"
                        dataKey="aqi"
                        stroke="#FF3D00"
                        strokeWidth={2}
                        fill="url(#aqiGrad)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
                <div className="flex flex-wrap gap-3 mt-3">
                  {[
                    { color: '#00C853', label: 'Good' },
                    { color: '#FFD600', label: 'Moderate' },
                    { color: '#FF9100', label: 'Sensitive' },
                    { color: '#FF3D00', label: 'Unhealthy' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-1">
                      <div className="h-2 w-6 rounded-full" style={{ backgroundColor: color }} />
                      <span className="text-xs text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly trend */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Monthly Report Trend</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={analytics.monthlyStats} margin={{ top: 5, right: 10, bottom: 0, left: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="reports" fill="#607D8B" radius={[4, 4, 0, 0]} name="Total" />
                      <Bar dataKey="resolved" fill="#2E7D32" radius={[4, 4, 0, 0]} name="Resolved" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Pollution by type */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Reports by Pollution Type</CardTitle>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <Skeleton className="h-40 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={pollutionTypeData} layout="vertical" margin={{ top: 0, right: 10, bottom: 0, left: 80 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis type="number" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" width={80} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: 12,
                        }}
                      />
                      <Bar dataKey="count" fill="#1B5E20" radius={[0, 4, 4, 0]} name="Reports" />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── Right col ──────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Current AQI */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current AQI — Bengaluru</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-4">
                {loading ? (
                  <Skeleton className="h-32 w-32 rounded-full" />
                ) : (
                  <>
                    <AQIGauge value={CURRENT_AQI} size={140} />
                    <div className="w-full grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-muted p-2">
                        <Thermometer className="h-4 w-4 mx-auto mb-1 text-orange-500" />
                        <p className="text-xs text-muted-foreground">Temp</p>
                        <p className="text-sm font-semibold">{WEATHER.temp}°C</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <Droplets className="h-4 w-4 mx-auto mb-1 text-blue-500" />
                        <p className="text-xs text-muted-foreground">Humidity</p>
                        <p className="text-sm font-semibold">{WEATHER.humidity}%</p>
                      </div>
                      <div className="rounded-lg bg-muted p-2">
                        <Wind className="h-4 w-4 mx-auto mb-1 text-cyan-500" />
                        <p className="text-xs text-muted-foreground">Wind</p>
                        <p className="text-sm font-semibold">{WEATHER.windSpeed}km/h</p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top hotspot wards */}
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-destructive" />
                  Top Pollution Wards
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {loading ? (
                  Array(5).fill(0).map((_, i) => <Skeleton key={i} className="h-8" />)
                ) : (
                  topWards.map(([ward, count], i) => (
                    <div key={ward} className="flex items-center gap-3">
                      <span className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                        i === 0 ? 'bg-destructive text-white' :
                        i === 1 ? 'bg-orange-500 text-white' :
                        i === 2 ? 'bg-amber-500 text-white' :
                        'bg-muted text-muted-foreground'
                      }`}>{i + 1}</span>
                      <span className="flex-1 text-sm">{ward}</span>
                      <span className="text-sm font-semibold">{count}</span>
                    </div>
                  ))
                )}
              </CardContent>
            </Card>

            {/* Impact summary */}
            <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
              <CardContent className="p-4 space-y-3">
                <h3 className="font-semibold text-sm">Environmental Impact</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">AQI Reduction</span>
                    <span className="text-sm font-semibold text-green-600 flex items-center gap-1">
                      <TrendingDown className="h-3 w-3" />
                      {analytics.reductionPercent}%
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Most Polluted</span>
                    <span className="text-xs font-medium text-destructive">{analytics.mostPollutedArea}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Most Improved</span>
                    <span className="text-xs font-medium text-green-600">{analytics.mostImprovedArea}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">Resolution Rate</span>
                    <span className="text-xs font-medium">
                      {Math.round(analytics.resolvedReports / analytics.totalReports * 100)}%
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Next 6h prediction */}
            {predictions.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-sm">Next 6 Hours</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {predictions.slice(0, 6).map((p, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground w-10">{p.hour}:00</span>
                        <div className="flex-1 h-5 rounded-full bg-muted overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all"
                            style={{
                              width: `${(p.predictedAQI / 350) * 100}%`,
                              backgroundColor: getAQIColor(p.predictedAQI),
                            }}
                          />
                        </div>
                        <AQIBadge value={p.predictedAQI} size="sm" showLabel={false} />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function StatCard({
  label, value, icon: Icon, trend, up, valueClass = '',
}: {
  label: string
  value: string | number
  icon: React.ComponentType<{ className?: string }>
  trend: string
  up: boolean
  valueClass?: string
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-muted">
            <Icon className="h-4 w-4 text-muted-foreground" />
          </div>
          <span className={`flex items-center gap-0.5 text-xs font-medium ${up ? 'text-green-600' : 'text-orange-600'}`}>
            {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend}
          </span>
        </div>
        <p className={`text-2xl font-bold font-mono mt-2 ${valueClass}`}>{value}</p>
        <p className="text-xs text-muted-foreground mt-0.5">{label}</p>
      </CardContent>
    </Card>
  )
}
