import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Textarea, Badge, Modal, toast } from '@/components/ui';
import { cn } from '@/lib/utils';
import type { DiaryEntry } from '@/types';

const MOODS = [
  { value:'great', emoji:'😊', label:'Great' },
  { value:'good', emoji:'🙂', label:'Good' },
  { value:'neutral', emoji:'😐', label:'Neutral' },
  { value:'concerned', emoji:'😟', label:'Concerned' },
  { value:'upset', emoji:'😠', label:'Upset' },
];

const ECO_HABITS = ['Carpooled','Used metro','Cycled','Walked','Planted tree','Reduced plastic','Composted','Saved water','Recycled','Used less AC'];

export default function DiaryPage() {
  const { user } = useAppStore();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [aiSummary, setAiSummary] = useState<{summary?:string;insights?:string[];suggestions?:string[];ecoScore?:number;topConcern?:string;monthlyTrend?:string} | null>(null);
  const [newModal, setNewModal] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState({ title:'', content:'', mood:'neutral', location:'', ecoHabits:[] as string[], tags:'' });
  const uid = user?.uid || 'user01';

  useEffect(() => {
    api.community.diary(uid).then(d => { setEntries(d as DiaryEntry[]); setLoading(false); }).catch(() => setLoading(false));
  }, [uid]);

  const getAISummary = async () => {
    if (entries.length === 0) { toast('Add some diary entries first!', 'info'); return; }
    setSummaryLoading(true);
    try {
      const summary = await api.ai.diarySummary(entries) as typeof aiSummary;
      setAiSummary(summary);
    } catch { toast('Failed to get AI summary', 'error'); }
    finally { setSummaryLoading(false); }
  };

  const submitEntry = async () => {
    if (!form.title || !form.content) { toast('Title and content required', 'error'); return; }
    setSubmitting(true);
    try {
      const entry = await api.community.createDiary({
        userId: uid,
        title: form.title,
        content: form.content,
        mood: form.mood,
        location: form.location,
        ecoHabits: form.ecoHabits,
        tags: form.tags.split(',').map(t=>t.trim()).filter(Boolean),
      }) as DiaryEntry;
      setEntries(e => [entry, ...e]);
      setNewModal(false);
      setForm({ title:'', content:'', mood:'neutral', location:'', ecoHabits:[], tags:'' });
      toast('📔 Diary entry saved! +3 karma', 'success');
    } catch { toast('Failed to save entry', 'error'); }
    finally { setSubmitting(false); }
  };

  const toggleHabit = (h: string) => setForm(f => ({ ...f, ecoHabits: f.ecoHabits.includes(h) ? f.ecoHabits.filter(x=>x!==h) : [...f.ecoHabits, h] }));

  return (
    <div className="space-y-5 page-enter">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">📔 Pollution Diary</h1>
          <p className="text-sm text-muted-foreground">Your personal environmental journal</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={getAISummary} loading={summaryLoading}>🧠 AI Summary</Button>
          <Button size="sm" onClick={() => setNewModal(true)}>+ New Entry</Button>
        </div>
      </div>

      {/* AI Summary */}
      {aiSummary && (
        <Card className="border-primary/30 bg-gradient-to-r from-green-50 to-transparent dark:from-green-900/10">
          <CardHeader><CardTitle>🧠 AI Environmental Summary</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">{aiSummary.summary}</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {aiSummary.insights && aiSummary.insights.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">💡 Insights</p>
                  <ul className="space-y-1">{aiSummary.insights.map((ins,i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-primary mt-0.5">•</span>{ins}</li>)}</ul>
                </div>
              )}
              {aiSummary.suggestions && aiSummary.suggestions.length > 0 && (
                <div>
                  <p className="font-semibold text-sm mb-2">🎯 Suggestions</p>
                  <ul className="space-y-1">{aiSummary.suggestions.map((s,i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-green-600 mt-0.5">→</span>{s}</li>)}</ul>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-3 items-center">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Eco Score:</span>
                <span className="font-bold text-primary">{aiSummary.ecoScore}/100</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Top concern:</span>
                <Badge variant="warning" className="capitalize">{aiSummary.topConcern}</Badge>
              </div>
              <Badge variant={aiSummary.monthlyTrend==='improving'?'success':aiSummary.monthlyTrend==='worsening'?'danger':'info'} className="capitalize">{aiSummary.monthlyTrend}</Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Entries */}
      {loading ? (
        <div className="space-y-3">{[...Array(3)].map((_,i) => <div key={i} className="h-32 skeleton rounded-xl" />)}</div>
      ) : entries.length === 0 ? (
        <Card>
          <CardContent className="py-14 text-center">
            <div className="text-5xl mb-4">📔</div>
            <h2 className="font-bold text-lg mb-2">Start Your Eco Diary</h2>
            <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">Log your daily environmental observations, eco-habits, and pollution sightings. Earn 3 karma per entry!</p>
            <Button onClick={() => setNewModal(true)}>Write First Entry</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {entries.map(e => (
            <Card key={e.id} className="card-hover">
              <CardContent className="p-5">
                <div className="flex items-start gap-3">
                  <div className="text-2xl">{MOODS.find(m=>m.value===e.mood)?.emoji || '😐'}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <h3 className="font-bold">{e.title}</h3>
                      <span className="text-xs text-muted-foreground">{new Date(e.createdAt).toLocaleDateString('en-IN', {day:'numeric',month:'short',year:'numeric'})}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{e.content}</p>
                    {e.location && <p className="text-xs text-muted-foreground mt-1">📍 {e.location}</p>}
                    {e.ecoHabits?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {e.ecoHabits.map(h => <Badge key={h} variant="success" className="text-xs">{h}</Badge>)}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* New Entry Modal */}
      <Modal open={newModal} onClose={() => setNewModal(false)} title="📔 New Diary Entry" size="lg">
        <div className="space-y-4">
          <div><label className="text-sm font-medium mb-1 block">Title *</label><Input value={form.title} onChange={e => setForm(f=>({...f,title:e.target.value}))} placeholder="Today's observation..." /></div>
          <div><label className="text-sm font-medium mb-1 block">Mood</label>
            <div className="flex gap-2">{MOODS.map(m => (
              <button key={m.value} onClick={() => setForm(f=>({...f,mood:m.value}))} className={cn('flex flex-col items-center gap-1 p-2 rounded-xl border-2 text-xs transition-all', form.mood===m.value?'border-primary bg-primary/5':'border-border hover:border-primary/40')}>
                <span className="text-2xl">{m.emoji}</span>{m.label}
              </button>
            ))}</div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">What did you observe? *</label><Textarea value={form.content} onChange={e => setForm(f=>({...f,content:e.target.value}))} rows={4} placeholder="Describe your environmental observations today..." /></div>
          <div><label className="text-sm font-medium mb-1 block">Location</label><Input value={form.location} onChange={e => setForm(f=>({...f,location:e.target.value}))} placeholder="Where were you?" /></div>
          <div><label className="text-sm font-medium mb-2 block">Today's Eco Habits ✅</label>
            <div className="flex flex-wrap gap-2">{ECO_HABITS.map(h => (
              <button key={h} onClick={() => toggleHabit(h)} className={cn('px-3 py-1.5 rounded-full text-xs font-medium border transition-all', form.ecoHabits.includes(h)?'bg-green-100 border-green-400 text-green-700 dark:bg-green-900/30 dark:border-green-600 dark:text-green-400':'border-border hover:border-primary/50 text-muted-foreground')}>
                {form.ecoHabits.includes(h)?'✓ ':''}{h}
              </button>
            ))}</div>
          </div>
          <div><label className="text-sm font-medium mb-1 block">Tags (comma separated)</label><Input value={form.tags} onChange={e => setForm(f=>({...f,tags:e.target.value}))} placeholder="air quality, recycling, commute..." /></div>
          <Button className="w-full" onClick={submitEntry} loading={submitting} disabled={!form.title||!form.content}>Save Entry +3 Karma</Button>
        </div>
      </Modal>
    </div>
  );
}
