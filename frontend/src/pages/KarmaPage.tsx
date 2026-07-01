import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, Badge, Skeleton, Progress, StatCard } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { KarmaEntry } from '@/types';

const BADGES_INFO = [
  { name:'🌱 Seedling', min:0, color:'text-green-600 bg-green-50' },
  { name:'🌿 Sapling', min:100, color:'text-emerald-600 bg-emerald-50' },
  { name:'🌳 Tree', min:500, color:'text-teal-600 bg-teal-50' },
  { name:'🏅 Eco Warrior', min:1000, color:'text-blue-600 bg-blue-50' },
  { name:'🏆 City Guardian', min:2000, color:'text-purple-600 bg-purple-50' },
  { name:'🌍 Planet Protector', min:5000, color:'text-orange-600 bg-orange-50' },
];

const ACTIONS = [
  { action:'report_submitted', label:'Submit Report', points:10, icon:'📸' },
  { action:'report_verified', label:'Report Verified', points:25, icon:'✅' },
  { action:'tree_planted', label:'Plant a Tree', points:20, icon:'🌳' },
  { action:'cleanup_participated', label:'Join Cleanup', points:30, icon:'🧹' },
  { action:'eco_transport', label:'Use Eco Transport', points:5, icon:'🚲' },
  { action:'diary_entry', label:'Log Diary Entry', points:3, icon:'📔' },
];

export default function KarmaPage() {
  const { user } = useAppStore();
  const [karma, setKarma] = useState<KarmaEntry | null>(null);
  const [leaderboard, setLeaderboard] = useState<KarmaEntry[]>([]);
  const [tab, setTab] = useState<'my'|'city'|'earn'>('my');
  const [loading, setLoading] = useState(true);
  const [logging, setLogging] = useState('');

  const uid = user?.uid || 'user01';

  useEffect(() => {
    Promise.all([
      api.karma.get(uid) as Promise<KarmaEntry>,
      api.karma.cityLeaderboard(20) as Promise<KarmaEntry[]>,
    ]).then(([k, lb]) => { setKarma(k); setLeaderboard(lb); setLoading(false); }).catch(() => setLoading(false));
  }, [uid]);

  const logAction = async (action: string) => {
    setLogging(action);
    try {
      const updated = await api.karma.add(uid, action) as KarmaEntry;
      setKarma(updated);
      const lb = await api.karma.cityLeaderboard(20) as KarmaEntry[];
      setLeaderboard(lb);
    } catch (e) { console.error(e); }
    finally { setLogging(''); }
  };

  const nextBadge = BADGES_INFO.find(b => b.min > (karma?.score || 0));
  const progress = nextBadge ? Math.min(100, ((karma?.score || 0) / nextBadge.min) * 100) : 100;

  if (loading) return (
    <div className="space-y-4"><div className="grid grid-cols-2 gap-4">{[...Array(4)].map((_,i) => <Skeleton key={i} className="h-28" />)}</div><Skeleton className="h-64" /></div>
  );

  return (
    <div className="space-y-5 page-enter">
      <div>
        <h1 className="text-2xl font-bold">⭐ Pollution Karma Score</h1>
        <p className="text-muted-foreground text-sm">Your environmental impact in Bengaluru</p>
      </div>

      {/* Hero score */}
      <Card className="gradient-green text-white overflow-hidden relative">
        <div className="absolute inset-0 opacity-10" style={{backgroundImage:'radial-gradient(circle at 20% 80%, white 0%, transparent 50%)'}} />
        <CardContent className="p-6 relative">
          <div className="flex items-center gap-5">
            <div className="text-center">
              <div className="text-6xl font-black">{karma?.score || 0}</div>
              <div className="text-white/80 text-sm mt-1">Karma Points</div>
            </div>
            <div className="flex-1">
              <div className="text-xl font-bold mb-1">{karma?.badge}</div>
              <div className="text-white/80 text-sm mb-3">Ward: {karma?.ward || 'Unknown'}</div>
              {nextBadge && (
                <>
                  <Progress value={progress} className="bg-white/20" color="white" />
                  <p className="text-white/70 text-xs mt-1">{nextBadge.min - (karma?.score || 0)} points to {nextBadge.name}</p>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard title="Reports" value={karma?.reportsCount || 0} icon="📊" color="blue" />
        <StatCard title="Resolved" value={karma?.resolvedCount || 0} icon="✅" color="green" />
        <StatCard title="Day Streak" value={karma?.streak || 0} icon="🔥" color="orange" subtitle="days" />
        <StatCard title="City Rank" value={`#${leaderboard.findIndex(l=>l.userId===uid)+1 || '–'}`} icon="🏆" color="purple" />
      </div>

      {/* Tabs */}
      <div className="flex bg-muted rounded-xl p-1 gap-1">
        {([['my','My Profile'],['city','City Leaderboard'],['earn','Earn Points']] as const).map(([v,l]) => (
          <button key={v} onClick={() => setTab(v)} className={cn('flex-1 py-2 rounded-lg text-sm font-medium transition-all', tab===v?'bg-background shadow text-foreground':'text-muted-foreground hover:text-foreground')}>{l}</button>
        ))}
      </div>

      {/* My Profile Tab */}
      {tab === 'my' && (
        <div className="space-y-4">
          {/* Badge progression */}
          <Card>
            <CardHeader><CardTitle>🏅 Badge Journey</CardTitle></CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                {BADGES_INFO.map(b => {
                  const earned = (karma?.score || 0) >= b.min;
                  return (
                    <div key={b.name} className={cn('rounded-xl p-3 text-center text-xs font-medium border-2 transition-all', earned ? b.color + ' border-current' : 'bg-muted text-muted-foreground border-transparent opacity-50')}>
                      <div className="text-2xl mb-1">{b.name.split(' ')[0]}</div>
                      <div>{b.name.split(' ').slice(1).join(' ')}</div>
                      <div className="text-xs opacity-70">{b.min}pts</div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* History */}
          <Card>
            <CardHeader><CardTitle>📜 Recent Activity</CardTitle></CardHeader>
            <CardContent>
              {(karma?.history || []).length === 0 ? (
                <p className="text-center text-muted-foreground py-6 text-sm">No activity yet. Start earning karma!</p>
              ) : (
                <div className="space-y-2">
                  {(karma?.history || []).slice(0, 10).map((h, i) => (
                    <div key={i} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-sm">⚡</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{h.description}</p>
                        <p className="text-xs text-muted-foreground">{new Date(h.timestamp).toLocaleDateString('en-IN')}</p>
                      </div>
                      <span className={cn('font-bold text-sm', h.points>0?'text-green-600':'text-red-500')}>{h.points>0?'+':''}{h.points}</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* City Leaderboard Tab */}
      {tab === 'city' && (
        <Card>
          <CardHeader><CardTitle>🏆 City Leaderboard</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {leaderboard.map((l, i) => (
                <div key={l.userId} className={cn('flex items-center gap-3 p-3 rounded-xl transition-all', l.userId===uid?'bg-primary/10 border border-primary':'hover:bg-accent')}>
                  <div className={cn('w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm', i===0?'bg-yellow-100 text-yellow-700':i===1?'bg-gray-100 text-gray-600':i===2?'bg-orange-100 text-orange-700':'bg-muted text-muted-foreground')}>
                    {i===0?'🥇':i===1?'🥈':i===2?'🥉':i+1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{l.displayName} {l.userId===uid && <Badge variant="info" className="ml-1">You</Badge>}</p>
                    <p className="text-xs text-muted-foreground">{l.badge} · {l.ward}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{l.score.toLocaleString()}</p>
                    <p className="text-xs text-muted-foreground">{l.reportsCount} reports</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Earn Points Tab */}
      {tab === 'earn' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">Log your eco-friendly actions to earn karma points:</p>
          {ACTIONS.map(a => (
            <Card key={a.action} className="card-hover">
              <CardContent className="p-4 flex items-center gap-4">
                <span className="text-3xl">{a.icon}</span>
                <div className="flex-1">
                  <p className="font-medium">{a.label}</p>
                  <p className="text-xs text-muted-foreground">+{a.points} karma points</p>
                </div>
                <button onClick={() => logAction(a.action)} disabled={logging===a.action} className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 flex items-center gap-2">
                  {logging===a.action ? <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : null}
                  +{a.points}pts
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
