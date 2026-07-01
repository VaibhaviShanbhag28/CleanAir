import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, Badge, Button, Modal, Input, Textarea, Select, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { CommunityEvent, CleanupChallenge } from '@/types';

type Tab = 'events' | 'challenges' | 'tips' | 'street';

export default function CommunityPage() {
  const { user } = useAppStore();
  const [tab, setTab] = useState<Tab>('events');
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [challenges, setChallenges] = useState<CleanupChallenge[]>([]);
  const [streetWard, setStreetWard] = useState('Koramangala');
  const [streetScore, setStreetScore] = useState<Record<string,unknown> | null>(null);
  const [loadingStreet, setLoadingStreet] = useState(false);
  const [createEventModal, setCreateEventModal] = useState(false);
  const [tipModal, setTipModal] = useState(false);
  const [eventForm, setEventForm] = useState({ title:'', description:'', location:'', date:'', time:'07:00', maxVolunteers:'50', category:'cleanup' });
  const [tipForm, setTipForm] = useState({ category:'illegal_dumping', description:'', location:'' });
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.community.events() as Promise<CommunityEvent[]>,
      api.community.challenges() as Promise<CleanupChallenge[]>,
    ]).then(([ev, ch]) => { setEvents(ev); setChallenges(ch); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const fetchStreet = async () => {
    setLoadingStreet(true);
    try { setStreetScore(await api.community.streetScore(streetWard) as Record<string,unknown>); }
    catch { toast('Failed to fetch street score', 'error'); }
    finally { setLoadingStreet(false); }
  };

  const submitEvent = async () => {
    setSubmitting(true);
    try {
      const ev = await api.community.createEvent({ ...eventForm, organizerId: user?.uid || 'anonymous', maxVolunteers: parseInt(eventForm.maxVolunteers) }) as CommunityEvent;
      setEvents(e => [ev, ...e]);
      setCreateEventModal(false);
      setEventForm({ title:'', description:'', location:'', date:'', time:'07:00', maxVolunteers:'50', category:'cleanup' });
      toast('Event created!', 'success');
    } catch { toast('Failed to create event', 'error'); }
    finally { setSubmitting(false); }
  };

  const submitTip = async () => {
    setSubmitting(true);
    try {
      await api.community.submitTip({ ...tipForm, contactEmail: user?.email });
      setTipModal(false);
      setTipForm({ category:'illegal_dumping', description:'', location:'' });
      toast('Anonymous tip submitted!', 'success');
    } catch { toast('Failed to submit tip', 'error'); }
    finally { setSubmitting(false); }
  };

  const joinEvent = async (id: string) => {
    try {
      await api.community.joinEvent(id, user?.uid || 'anonymous');
      setEvents(ev => ev.map(e => e.id===id ? {...e, volunteers: e.volunteers+1} : e));
      toast('🎉 Joined event! +30 karma earned', 'success');
    } catch { toast('Failed to join event', 'error'); }
  };

  const TABS: {key: Tab; label: string; icon: string}[] = [
    { key:'events', label:'Events', icon:'🌱' },
    { key:'challenges', label:'Cleanup Challenges', icon:'💪' },
    { key:'tips', label:'Anonymous Tips', icon:'🕵️' },
    { key:'street', label:'Street Score', icon:'🏘️' },
  ];

  return (
    <div className="space-y-5 page-enter">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">🌱 Community Hub</h1>
          <p className="text-sm text-muted-foreground">Events, challenges & collective action</p>
        </div>
        <div className="flex gap-2">
          <Button size="sm" onClick={() => setCreateEventModal(true)}>+ Create Event</Button>
          <Button size="sm" variant="outline" onClick={() => setTipModal(true)}>🕵️ Submit Tip</Button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-muted rounded-xl p-1 overflow-x-auto scrollbar-hide">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)} className={cn('flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all', tab===t.key?'bg-background shadow text-foreground':'text-muted-foreground hover:text-foreground')}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {/* Events Tab */}
      {tab === 'events' && (
        <div className="grid sm:grid-cols-2 gap-4">
          {loading ? [...Array(4)].map((_,i) => <div key={i} className="h-48 skeleton rounded-xl" />) :
          events.length === 0 ? (
            <div className="sm:col-span-2 text-center py-12 text-muted-foreground">No events yet. Create the first one! 🌱</div>
          ) : events.map(e => (
            <Card key={e.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <Badge variant={e.category==='cleanup'?'success':e.category==='plantation'?'info':'warning'} className="capitalize">{e.category}</Badge>
                  <span className="text-xs text-muted-foreground">📅 {e.date} at {e.time}</span>
                </div>
                <h3 className="font-bold text-base mb-1">{e.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{e.description}</p>
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                  <span>📍 {e.location}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="text-sm">
                    <span className="font-medium text-primary">{e.volunteers}</span>
                    <span className="text-muted-foreground"> / {e.maxVolunteers} volunteers</span>
                  </div>
                  <Button size="sm" onClick={() => joinEvent(e.id)} disabled={e.volunteers >= e.maxVolunteers}>
                    {e.volunteers >= e.maxVolunteers ? 'Full' : '+ Join'}
                  </Button>
                </div>
                <div className="mt-2 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all" style={{width:`${Math.min(100, (e.volunteers/e.maxVolunteers)*100)}%`}} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Challenges Tab */}
      {tab === 'challenges' && (
        <div className="space-y-4">
          <div className="grid sm:grid-cols-2 gap-4">
            {challenges.length === 0 ? (
              <div className="sm:col-span-2 text-center py-12">
                <div className="text-4xl mb-3">💪</div>
                <p className="font-semibold mb-2">No challenges yet!</p>
                <p className="text-sm text-muted-foreground">Clean an area and post a before/after to start a challenge</p>
              </div>
            ) : challenges.map(c => (
              <Card key={c.id} className="card-hover">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Badge variant={c.status==='verified'?'success':c.status==='rejected'?'danger':'warning'} className="capitalize">{c.status}</Badge>
                    <span className="text-xs text-muted-foreground">👍 {c.votes}</span>
                  </div>
                  <h3 className="font-bold mb-1">{c.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{c.description}</p>
                  <p className="text-xs text-muted-foreground">📍 {c.location}</p>
                  <Button size="sm" variant="outline" className="mt-3 w-full" onClick={() => api.community.voteChallenge(c.id)}>
                    👍 Upvote Challenge
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tips Tab */}
      {tab === 'tips' && (
        <Card>
          <CardContent className="p-8 text-center">
            <div className="text-5xl mb-4">🕵️</div>
            <h2 className="text-xl font-bold mb-2">Anonymous Tips Portal</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-md mx-auto">Submit confidential tips about illegal dumping, corruption, or environmental violations. Your identity is completely protected.</p>
            <Button onClick={() => setTipModal(true)}>Submit Anonymous Tip</Button>
          </CardContent>
        </Card>
      )}

      {/* Street Score Tab */}
      {tab === 'street' && (
        <div className="space-y-4">
          <Card>
            <CardContent className="p-5">
              <h2 className="font-semibold mb-4">🏘️ Check Ward Score</h2>
              <div className="flex gap-3">
                <Input value={streetWard} onChange={e => setStreetWard(e.target.value)} placeholder="Enter ward name..." className="flex-1" />
                <Button onClick={fetchStreet} loading={loadingStreet}>Check Score</Button>
              </div>
            </CardContent>
          </Card>
          {streetScore && (
            <Card>
              <CardHeader><CardTitle>📊 {(streetScore as {ward?:string}).ward} Street Score</CardTitle></CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="text-5xl font-black text-primary">{(streetScore as {overallScore?:number}).overallScore}</div>
                  <div>
                    <p className="font-semibold">/100 Overall Score</p>
                    <Badge variant={(streetScore as {trend?:string}).trend==='improving'?'success':(streetScore as {trend?:string}).trend==='worsening'?'danger':'info'} className="capitalize mt-1">{(streetScore as {trend?:string}).trend}</Badge>
                  </div>
                </div>
                {[
                  { label:'Cleanliness', key:'cleanliness', icon:'🧹' },
                  { label:'AQI Score', key:'aqiScore', icon:'💨' },
                  { label:'Waste Collection', key:'wasteCollection', icon:'♻️' },
                  { label:'Green Cover', key:'greenCover', icon:'🌿' },
                  { label:'Water Quality', key:'waterQuality', icon:'💧' },
                  { label:'Citizen Participation', key:'citizenParticipation', icon:'👥' },
                ].map(({ label, key, icon }) => (
                  <div key={key}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{icon} {label}</span>
                      <span className="font-medium">{(streetScore as Record<string,number>)[key]?.toFixed(1)}</span>
                    </div>
                    <div className="bg-muted rounded-full h-2 overflow-hidden">
                      <div className="h-full rounded-full bg-primary transition-all" style={{width:`${(streetScore as Record<string,number>)[key]}%`}} />
                    </div>
                  </div>
                ))}
                <div className="grid grid-cols-3 gap-3 pt-2 text-center text-sm">
                  <div className="bg-accent rounded-xl p-3"><p className="text-2xl font-bold text-primary">{(streetScore as {totalReports?:number}).totalReports}</p><p className="text-muted-foreground text-xs">Reports</p></div>
                  <div className="bg-accent rounded-xl p-3"><p className="text-2xl font-bold text-green-600">{(streetScore as {resolvedReports?:number}).resolvedReports}</p><p className="text-muted-foreground text-xs">Resolved</p></div>
                  <div className="bg-accent rounded-xl p-3"><p className="text-2xl font-bold text-blue-600">{(streetScore as {resolutionRate?:number}).resolutionRate}%</p><p className="text-muted-foreground text-xs">Rate</p></div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Create Event Modal */}
      <Modal open={createEventModal} onClose={() => setCreateEventModal(false)} title="🌱 Create Community Event" size="lg">
        <div className="space-y-4">
          <div><label className="text-sm font-medium mb-1 block">Title *</label><Input value={eventForm.title} onChange={e => setEventForm(f=>({...f,title:e.target.value}))} placeholder="e.g. Koramangala Green Sunday" /></div>
          <div><label className="text-sm font-medium mb-1 block">Description</label><Textarea value={eventForm.description} onChange={e => setEventForm(f=>({...f,description:e.target.value}))} rows={3} placeholder="What will you do?" /></div>
          <div><label className="text-sm font-medium mb-1 block">Location *</label><Input value={eventForm.location} onChange={e => setEventForm(f=>({...f,location:e.target.value}))} placeholder="Meeting point address" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Date *</label><Input type="date" value={eventForm.date} onChange={e => setEventForm(f=>({...f,date:e.target.value}))} /></div>
            <div><label className="text-sm font-medium mb-1 block">Time</label><Input type="time" value={eventForm.time} onChange={e => setEventForm(f=>({...f,time:e.target.value}))} /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium mb-1 block">Category</label>
              <Select value={eventForm.category} onChange={e => setEventForm(f=>({...f,category:e.target.value}))}>
                <option value="cleanup">🧹 Cleanup Drive</option>
                <option value="plantation">🌳 Plantation</option>
                <option value="awareness">📢 Awareness</option>
              </Select>
            </div>
            <div><label className="text-sm font-medium mb-1 block">Max Volunteers</label><Input type="number" value={eventForm.maxVolunteers} onChange={e => setEventForm(f=>({...f,maxVolunteers:e.target.value}))} /></div>
          </div>
          <Button className="w-full" onClick={submitEvent} loading={submitting} disabled={!eventForm.title||!eventForm.location||!eventForm.date}>Create Event</Button>
        </div>
      </Modal>

      {/* Anonymous Tip Modal */}
      <Modal open={tipModal} onClose={() => setTipModal(false)} title="🕵️ Submit Anonymous Tip">
        <div className="space-y-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300">🔒 Your identity is completely protected. No personal information is stored.</div>
          <div><label className="text-sm font-medium mb-1 block">Category</label>
            <Select value={tipForm.category} onChange={e => setTipForm(f=>({...f,category:e.target.value}))}>
              <option value="illegal_dumping">🗑️ Illegal Dumping</option>
              <option value="corruption">💰 Government Negligence</option>
              <option value="chemical_dumping">⚗️ Chemical Dumping</option>
              <option value="tree_cutting">🌳 Illegal Tree Cutting</option>
              <option value="other">⚠️ Other Violation</option>
            </Select>
          </div>
          <div><label className="text-sm font-medium mb-1 block">Description *</label><Textarea value={tipForm.description} onChange={e => setTipForm(f=>({...f,description:e.target.value}))} rows={4} placeholder="Describe what you witnessed..." /></div>
          <div><label className="text-sm font-medium mb-1 block">Location (optional)</label><Input value={tipForm.location} onChange={e => setTipForm(f=>({...f,location:e.target.value}))} placeholder="Area or landmark" /></div>
          <Button className="w-full" onClick={submitTip} loading={submitting} disabled={!tipForm.description.trim()}>Submit Anonymous Tip</Button>
        </div>
      </Modal>
    </div>
  );
}
