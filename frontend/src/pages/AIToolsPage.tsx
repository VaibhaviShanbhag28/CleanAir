import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Card, CardContent, CardHeader, CardTitle, Button, Input, Select, Textarea, Badge, Spinner, toast } from '@/components/ui';
import { imageToBase64 } from '@/lib/utils';
import { cn } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

type Tool = 'waste'|'carbon'|'notice'|'horoscope'|'seasonal'|'cleanup';

export default function AIToolsPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = (searchParams.get('tab') as Tool) || 'waste';
  const [tool, setTool] = useState<Tool>(defaultTab);
  const { currentAQI } = useAppStore();

  return (
    <div className="space-y-5 page-enter">
      <div>
        <h1 className="text-2xl font-bold">🤖 AI Tools</h1>
        <p className="text-sm text-muted-foreground">Powered by Gemini AI via OpenRouter</p>
      </div>

      {/* Tool selector */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
        {([
          { key:'waste' as Tool, icon:'♻️', label:'Waste Classifier' },
          { key:'carbon' as Tool, icon:'🌍', label:'Carbon Calc' },
          { key:'notice' as Tool, icon:'📄', label:'Notice Gen' },
          { key:'horoscope' as Tool, icon:'🌤', label:'Air Horoscope' },
          { key:'seasonal' as Tool, icon:'📅', label:'Seasonal Forecast' },
          { key:'cleanup' as Tool, icon:'💪', label:'Cleanup Verify' },
        ] as {key:Tool;icon:string;label:string}[]).map(t => (
          <button key={t.key} onClick={() => setTool(t.key)} className={cn('flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 text-xs font-medium transition-all', tool===t.key?'border-primary bg-primary/5 text-primary':'border-border hover:border-primary/50 text-muted-foreground')}>
            <span className="text-2xl">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {tool === 'waste' && <WasteClassifier />}
      {tool === 'carbon' && <CarbonCalculator />}
      {tool === 'notice' && <NoticeGenerator />}
      {tool === 'horoscope' && <AQIHoroscope aqi={currentAQI} />}
      {tool === 'seasonal' && <SeasonalForecast />}
      {tool === 'cleanup' && <CleanupVerifier />}
    </div>
  );
}

// ── Waste Classifier ──────────────────────────────────────────────────────────
function WasteClassifier() {
  const [image, setImage] = useState('');
  const [preview, setPreview] = useState('');
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    const b64 = await imageToBase64(f);
    setPreview(b64); setImage(b64); setResult(null);
  };

  const classify = async () => {
    if (!image) return;
    setLoading(true);
    try { setResult(await api.ai.classifyWaste(image) as Record<string,unknown>); }
    catch { toast('Classification failed', 'error'); }
    finally { setLoading(false); }
  };

  const BIN_COLORS: Record<string,string> = { green:'bg-green-500', blue:'bg-blue-500', red:'bg-red-500', black:'bg-gray-800' };

  return (
    <Card>
      <CardHeader><CardTitle>♻️ Household Waste Segregation AI</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Upload a photo of waste and AI will tell you how to segregate it properly.</p>
        <div onClick={() => fileRef.current?.click()} className="border-2 border-dashed rounded-xl p-8 text-center cursor-pointer hover:border-primary/60 transition-all">
          {preview ? <img src={preview} alt="waste" className="max-h-48 mx-auto rounded-lg object-cover" /> : <><div className="text-4xl mb-2">🗑️</div><p className="text-sm font-medium">Click to upload waste photo</p></>}
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
        </div>
        {preview && <Button className="w-full" onClick={classify} disabled={loading}>{loading ? <><Spinner size="sm"/> Classifying...</> : '🤖 Classify Waste'}</Button>}
        {result && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className={cn('w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg', BIN_COLORS[(result as {bin_color?:string}).bin_color||'blue']||'bg-blue-500')}>
                {(result as {bin_color?:string}).bin_color?.[0]?.toUpperCase()||'B'}
              </div>
              <div>
                <p className="font-semibold capitalize">{(result as {primary_category?:string}).primary_category} Waste</p>
                <p className="text-sm text-muted-foreground">{(result as {bin_color?:string}).bin_color} bin</p>
              </div>
              <Badge variant={(result as {is_recyclable?:boolean}).is_recyclable?'success':'warning'} className="ml-auto">{(result as {is_recyclable?:boolean}).is_recyclable?'♻️ Recyclable':'⚠️ Non-recyclable'}</Badge>
            </div>
            <div className="bg-accent rounded-xl p-4">
              <p className="font-medium text-sm mb-2">📋 Segregation Guide</p>
              <p className="text-sm text-muted-foreground">{(result as {segregation_tip?:string}).segregation_tip}</p>
            </div>
            {(result as {items?:{name:string;category:string;disposal:string}[]}).items?.map((item,i) => (
              <div key={i} className="flex gap-3 p-3 border rounded-xl text-sm">
                <span className="font-medium flex-1">{item.name}</span>
                <Badge variant="info" className="capitalize">{item.category}</Badge>
                <span className="text-muted-foreground text-xs self-center">{item.disposal}</span>
              </div>
            ))}
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-sm text-green-700 dark:text-green-400">🌍 {(result as {environmental_note?:string}).environmental_note}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Carbon Calculator ─────────────────────────────────────────────────────────
function CarbonCalculator() {
  const [form, setForm] = useState({ transportMode:'bus', distanceKm:10, electricityKwh:100, lpgCylinders:1, meatMealsPerWeek:3, flightsPerYear:1 });
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    setLoading(true);
    try { setResult(await api.ai.carbon(form) as Record<string,unknown>); }
    catch { toast('Calculation failed', 'error'); }
    finally { setLoading(false); }
  };

  const RATING_COLORS: Record<string,string> = { excellent:'text-green-600', good:'text-emerald-600', average:'text-yellow-600', high:'text-orange-600', very_high:'text-red-600' };

  return (
    <Card>
      <CardHeader><CardTitle>🌍 Personal Carbon Footprint Calculator</CardTitle></CardHeader>
      <CardContent className="space-y-5">
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium mb-1.5 block">🚗 Daily Transport Mode</label>
            <Select value={form.transportMode} onChange={e=>setForm(f=>({...f,transportMode:e.target.value}))}>
              <option value="walk">🚶 Walk</option><option value="cycle">🚲 Cycle</option>
              <option value="metro">🚇 Metro</option><option value="bus">🚌 Bus</option>
              <option value="auto">🛺 Auto</option><option value="bike">🏍 Bike</option>
              <option value="car">🚗 Car</option>
            </Select>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">📏 Daily Distance (km)</label>
            <Input type="number" value={form.distanceKm} onChange={e=>setForm(f=>({...f,distanceKm:+e.target.value}))} min={0} />
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">⚡ Monthly Electricity (kWh)</label>
            <Input type="number" value={form.electricityKwh} onChange={e=>setForm(f=>({...f,electricityKwh:+e.target.value}))} min={0} />
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">🔥 LPG Cylinders/month</label>
            <Input type="number" value={form.lpgCylinders} onChange={e=>setForm(f=>({...f,lpgCylinders:+e.target.value}))} min={0} step={0.5} />
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">🥩 Meat Meals/week</label>
            <Input type="number" value={form.meatMealsPerWeek} onChange={e=>setForm(f=>({...f,meatMealsPerWeek:+e.target.value}))} min={0} />
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">✈️ Flights/year</label>
            <Input type="number" value={form.flightsPerYear} onChange={e=>setForm(f=>({...f,flightsPerYear:+e.target.value}))} min={0} />
          </div>
        </div>
        <Button className="w-full" onClick={calc} loading={loading}>Calculate My Carbon Footprint</Button>
        {result && (
          <div className="space-y-4">
            <div className="text-center p-5 bg-accent rounded-2xl">
              <div className={cn('text-5xl font-black', RATING_COLORS[(result as {rating?:string}).rating||'average'])}>{((result as {totalCO2?:number}).totalCO2||0).toLocaleString()}</div>
              <div className="text-muted-foreground mt-1">kg CO₂ per year</div>
              <Badge variant={(result as {rating?:string}).rating==='excellent'||result.rating==='good'?'success':result.rating==='high'||result.rating==='very_high'?'danger':'warning'} className="mt-2 capitalize">{(result as {rating?:string}).rating} footprint</Badge>
              <p className="text-sm text-muted-foreground mt-2">{(result as {comparison?:string}).comparison}</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-sm">📊 Breakdown</p>
              {Object.entries((result as {breakdown?:Record<string,number>}).breakdown||{}).map(([k,v]) => (
                <div key={k} className="flex gap-3 items-center">
                  <span className="text-sm text-muted-foreground capitalize w-24">{k}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{width:`${Math.min(100,(v/((result as {totalCO2?:number}).totalCO2||1))*100)}%`}} />
                  </div>
                  <span className="text-sm font-medium w-16 text-right">{v.toFixed(0)} kg</span>
                </div>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 space-y-2">
              <p className="font-semibold text-green-700 dark:text-green-400 text-sm">💡 AI Tips</p>
              {((result as {tips?:string[]}).tips||[]).map((tip,i) => <p key={i} className="text-sm text-green-700 dark:text-green-300 flex gap-2"><span>→</span>{tip}</p>)}
            </div>
            <div className="text-center text-sm text-muted-foreground">🌳 Plant <b>{(result as {trees_to_offset?:number}).trees_to_offset}</b> trees to offset your annual footprint</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Notice Generator ──────────────────────────────────────────────────────────
function NoticeGenerator() {
  const [form, setForm] = useState({ noticeType:'public_notice', topic:'', ward:'', details:'', language:'english' });
  const [result, setResult] = useState<{content?:string;reference?:string} | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.topic) { toast('Please enter a topic', 'error'); return; }
    setLoading(true);
    try { setResult(await api.ai.notice(form.noticeType, form.topic, form.ward, form.details, form.language) as typeof result); }
    catch { toast('Generation failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>📄 AI Official Notice Generator</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Generate professional BBMP notices, circulars, press releases and social media content instantly.</p>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className="text-sm font-medium mb-1.5 block">Notice Type</label>
            <Select value={form.noticeType} onChange={e=>setForm(f=>({...f,noticeType:e.target.value}))}>
              <option value="public_notice">📢 Public Notice</option>
              <option value="circular">📋 Office Circular</option>
              <option value="warning_letter">⚠️ Warning Letter</option>
              <option value="awareness_campaign">📣 Awareness Campaign</option>
              <option value="press_release">📰 Press Release</option>
              <option value="social_media">📱 Social Media Captions</option>
            </Select>
          </div>
          <div><label className="text-sm font-medium mb-1.5 block">Language</label>
            <Select value={form.language} onChange={e=>setForm(f=>({...f,language:e.target.value}))}>
              <option value="english">English</option>
              <option value="hindi">हिंदी</option>
              <option value="kannada">ಕನ್ನಡ</option>
            </Select>
          </div>
        </div>
        <div><label className="text-sm font-medium mb-1.5 block">Topic / Subject *</label><Input value={form.topic} onChange={e=>setForm(f=>({...f,topic:e.target.value}))} placeholder="e.g. Garbage burning ban in residential areas" /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Ward (optional)</label><Input value={form.ward} onChange={e=>setForm(f=>({...f,ward:e.target.value}))} placeholder="e.g. Koramangala" /></div>
        <div><label className="text-sm font-medium mb-1.5 block">Additional Details</label><Textarea value={form.details} onChange={e=>setForm(f=>({...f,details:e.target.value}))} rows={3} placeholder="Any specific details, fine amounts, deadlines..." /></div>
        <Button className="w-full" onClick={generate} loading={loading}>⚡ Generate Notice</Button>
        {result && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Badge variant="info">Ref: {result.reference}</Badge>
              <button onClick={() => { navigator.clipboard.writeText(result.content||''); toast('Copied!', 'success'); }} className="text-xs text-primary hover:underline">📋 Copy</button>
            </div>
            <div className="bg-accent rounded-xl p-5 whitespace-pre-wrap text-sm font-mono leading-relaxed border">{result.content}</div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── AQI Horoscope ─────────────────────────────────────────────────────────────
function AQIHoroscope({ aqi }: { aqi: number }) {
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setResult(await api.ai.horoscope(aqi) as Record<string,unknown>); }
    catch { toast('Failed to fetch horoscope', 'error'); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetch(); }, []);

  return (
    <Card>
      <CardHeader><CardTitle>🌤 Daily Air Quality Horoscope</CardTitle></CardHeader>
      <CardContent>
        {loading ? <div className="flex justify-center py-12"><Spinner size="lg" /></div> : !result ? (
          <div className="text-center py-8"><Button onClick={fetch}>Load Horoscope</Button></div>
        ) : (
          <div className="space-y-5">
            <div className="text-center py-4">
              <div className="text-6xl mb-3">{(result as {emoji?:string}).emoji}</div>
              <h2 className="text-xl font-bold mb-2">{(result as {title?:string}).title}</h2>
              <p className="text-muted-foreground">{(result as {forecast?:string}).forecast}</p>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { icon:'⭐', label:'Outdoor Rating', value:(result as {outdoor_rating?:string}).outdoor_rating },
                { icon:'😷', label:'Mask', value:(result as {mask_tip?:string}).mask_tip },
                { icon:'🕐', label:'Best Time Outside', value:(result as {best_time_outdoor?:string}).best_time_outdoor },
                { icon:'🏃', label:'Exercise', value:(result as {exercise_tip?:string}).exercise_tip },
                { icon:'🍀', label:'Lucky Color', value:(result as {lucky_color?:string}).lucky_color },
                { icon:'📅', label:'3-Day Trend', value:(result as {weekly_trend?:string}).weekly_trend },
              ].map(({ icon, label, value }) => (
                <div key={label} className="flex gap-3 p-3 bg-accent rounded-xl">
                  <span className="text-xl">{icon}</span>
                  <div><p className="text-xs text-muted-foreground">{label}</p><p className="text-sm font-medium mt-0.5">{value}</p></div>
                </div>
              ))}
            </div>
            <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 text-center">
              <p className="text-sm font-medium text-green-700 dark:text-green-400">💡 Eco Tip of the Day</p>
              <p className="text-sm text-green-600 dark:text-green-300 mt-1">{(result as {eco_tip_of_day?:string}).eco_tip_of_day}</p>
            </div>
            <Button variant="outline" className="w-full" onClick={fetch} loading={loading}>🔄 Refresh Horoscope</Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Seasonal Forecast ─────────────────────────────────────────────────────────
function SeasonalForecast() {
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetch = async () => {
    setLoading(true);
    try { setResult(await api.ai.seasonal(month) as Record<string,unknown>); }
    catch { toast('Failed to fetch forecast', 'error'); }
    finally { setLoading(false); }
  };

  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  return (
    <Card>
      <CardHeader><CardTitle>📅 Seasonal Pollution Forecast</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-3">
          <Select value={month} onChange={e => setMonth(+e.target.value)} className="flex-1">
            {MONTHS.map((m,i) => <option key={i} value={i+1}>{m}</option>)}
          </Select>
          <Button onClick={fetch} loading={loading}>Predict</Button>
        </div>
        {result && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="bg-accent rounded-xl p-3">
                <p className="text-2xl font-bold text-primary">{(result as {aqi_prediction?:{average?:number}}).aqi_prediction?.average}</p>
                <p className="text-xs text-muted-foreground">Avg AQI</p>
              </div>
              <div className="bg-accent rounded-xl p-3">
                <p className="font-bold text-sm">{(result as {green_cover_status?:string}).green_cover_status}</p>
                <p className="text-xs text-muted-foreground">Green Cover</p>
              </div>
              <div className="bg-accent rounded-xl p-3">
                <p className="font-bold text-sm capitalize">{(result as {waste_generation_trend?:string}).waste_generation_trend}</p>
                <p className="text-xs text-muted-foreground">Waste Trend</p>
              </div>
            </div>
            <div><p className="font-semibold text-sm mb-2">⚠️ Main Concerns</p>
              <div className="flex flex-wrap gap-2">{((result as {main_concerns?:string[]}).main_concerns||[]).map((c,i) => <Badge key={i} variant="warning">{c}</Badge>)}</div>
            </div>
            {(result as {festival_impact?:string}).festival_impact && <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-3 text-sm"><p className="font-medium text-orange-700 dark:text-orange-400">🎉 Festival Impact</p><p className="text-muted-foreground mt-1">{(result as {festival_impact?:string}).festival_impact}</p></div>}
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-sm"><p className="font-medium text-blue-700 dark:text-blue-400">🌧 Weather Impact</p><p className="text-muted-foreground mt-1">{(result as {weather_impact?:string}).weather_impact}</p></div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-sm"><p className="font-medium text-red-700 dark:text-red-400">🏥 Health Alert</p><p className="text-muted-foreground mt-1">{(result as {health_alert?:string}).health_alert}</p></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ── Cleanup Verifier ──────────────────────────────────────────────────────────
function CleanupVerifier() {
  const [before, setBefore] = useState('');
  const [after, setAfter] = useState('');
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview] = useState('');
  const [result, setResult] = useState<Record<string,unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, which: 'before'|'after') => {
    const f = e.target.files?.[0]; if (!f) return;
    const b64 = await imageToBase64(f);
    if (which==='before') { setBefore(b64); setBeforePreview(b64); }
    else { setAfter(b64); setAfterPreview(b64); }
  };

  const verify = async () => {
    if (!before||!after) { toast('Upload both images first', 'error'); return; }
    setLoading(true);
    try { setResult(await api.ai.verifyCleanup(before, after) as Record<string,unknown>); }
    catch { toast('Verification failed', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <Card>
      <CardHeader><CardTitle>💪 Before & After Cleanup Verifier</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">Upload before and after photos — AI will verify your cleanup and award karma points!</p>
        <div className="grid sm:grid-cols-2 gap-4">
          {(['before','after'] as const).map(which => (
            <div key={which} onClick={() => (which==='before'?beforeRef:afterRef).current?.click()} className="border-2 border-dashed rounded-xl p-6 text-center cursor-pointer hover:border-primary/60 transition-all">
              {(which==='before'?beforePreview:afterPreview) ? (
                <img src={which==='before'?beforePreview:afterPreview} alt={which} className="max-h-40 mx-auto rounded-lg object-cover" />
              ) : (
                <><div className="text-3xl mb-2">{which==='before'?'📸':'🌟'}</div><p className="text-sm font-medium capitalize">{which} Photo</p><p className="text-xs text-muted-foreground mt-1">Click to upload</p></>
              )}
              <input ref={which==='before'?beforeRef:afterRef} type="file" accept="image/*" className="hidden" onChange={e=>handleFile(e,which)} />
            </div>
          ))}
        </div>
        <Button className="w-full" onClick={verify} disabled={!before||!after||loading} loading={loading}>🤖 Verify Cleanup with AI</Button>
        {result && (
          <div className="space-y-3">
            <div className={cn('rounded-xl p-4 text-center', (result as {verified?:boolean}).verified?'bg-green-50 dark:bg-green-900/20':'bg-red-50 dark:bg-red-900/20')}>
              <div className="text-3xl mb-2">{(result as {verified?:boolean}).verified?'✅':'❌'}</div>
              <p className="font-bold">{(result as {verified?:boolean}).verified?'Cleanup Verified!':'Improvement Not Detected'}</p>
              <p className="text-sm text-muted-foreground mt-1">{(result as {message?:string}).message}</p>
              {(result as {verified?:boolean}).verified && <p className="text-lg font-bold text-green-600 mt-2">+{(result as {points_awarded?:number}).points_awarded} Karma Points!</p>}
            </div>
            <div className="grid sm:grid-cols-2 gap-3 text-sm">
              <div className="bg-accent rounded-xl p-3"><p className="font-medium mb-1">Before</p><p className="text-muted-foreground">{(result as {before_description?:string}).before_description}</p></div>
              <div className="bg-accent rounded-xl p-3"><p className="font-medium mb-1">After</p><p className="text-muted-foreground">{(result as {after_description?:string}).after_description}</p></div>
            </div>
            <div className="bg-accent rounded-xl p-3">
              <p className="font-medium text-sm mb-2">🔍 Changes Detected</p>
              <ul className="space-y-1">{((result as {changes_observed?:string[]}).changes_observed||[]).map((c,i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="text-green-600">✓</span>{c}</li>)}</ul>
            </div>
            <div className="text-center text-sm font-medium">Improvement Score: <span className="text-primary text-xl font-black">{(result as {improvement_score?:number}).improvement_score}/100</span></div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
