import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Button, Card, CardContent, Input, Textarea, Select, Badge, Modal, Spinner, toast } from '@/components/ui';
import { imageToBase64, POLLUTION_TYPES, BENGALURU_WARDS, getPollutionIcon } from '@/lib/utils';
import { cn } from '@/lib/utils';

type Step = 'type' | 'location' | 'photo' | 'details' | 'review';

export default function ReportPage() {
  const { user, addReport } = useAppStore();
  const navigate = useNavigate();
  const [step, setStep] = useState<Step>('type');
  const [isAnonymous, setIsAnonymous] = useState(!user);
  const [pollutionType, setPollutionType] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [ward, setWard] = useState('');
  const [address, setAddress] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [aiResult, setAiResult] = useState<Record<string,unknown> | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [reportId, setReportId] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const STEPS: Step[] = ['type', 'location', 'photo', 'details', 'review'];
  const stepIdx = STEPS.indexOf(step);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setImageFile(f);
    const b64 = await imageToBase64(f);
    setImagePreview(b64);
    setImageBase64(b64);
  };

  const analyzeImage = async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    try {
      const result = await api.ai.analyze(imageBase64, imageFile?.type || 'image/jpeg', pollutionType, description, !!ward);
      setAiResult(result as Record<string,unknown>);
      const r = result as {estimatedSeverity?:string; pollutionType?:string};
      if (r.estimatedSeverity) setSeverity(r.estimatedSeverity);
      toast('✅ AI analysis complete!', 'success');
    } catch { toast('AI analysis failed — proceeding without it', 'warning'); }
    finally { setAnalyzing(false); }
  };

  const handleSubmit = async () => {
    if (!ward || !pollutionType || !description) { toast('Please fill all required fields', 'error'); return; }
    setSubmitting(true);
    try {
      const validation = aiResult ? (aiResult as {validation?:Record<string,unknown>}).validation : undefined;
      const payload = {
        userId: user?.uid || 'anonymous',
        userDisplayName: isAnonymous ? 'Anonymous' : (user?.displayName || 'Citizen'),
        isAnonymous,
        location: { lat: 12.9716 + Math.random()*0.1-0.05, lng: 77.5946 + Math.random()*0.1-0.05, address: address || `Near ${ward}`, ward, district: 'Bengaluru Urban' },
        pollutionType, severity, description,
        aiAnalysis: aiResult ? { ...aiResult, validation: undefined } : undefined,
        validation,
        tags: [],
      };
      const res = await api.reports.create(payload) as {id:string};
      setReportId(res.id);
      addReport(res as Parameters<typeof addReport>[0]);
      if (user?.uid) await api.karma.add(user.uid, 'report_submitted');
      setSuccessModal(true);
    } catch (e: unknown) {
      const err = e as {detail?:{blocked?:boolean;reason?:string}};
      if (err?.detail?.blocked) toast(`Report blocked: ${err.detail.reason}`, 'error');
      else toast('Submission failed. Try again.', 'error');
    }
    finally { setSubmitting(false); }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-5 page-enter">
      <div>
        <h1 className="text-2xl font-bold">📸 Report Pollution</h1>
        <p className="text-muted-foreground text-sm mt-1">Help make Bengaluru cleaner — every report matters</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-1">
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all', i <= stepIdx ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
              {i < stepIdx ? '✓' : i + 1}
            </div>
            {i < STEPS.length - 1 && <div className={cn('flex-1 h-0.5 rounded transition-all', i < stepIdx ? 'bg-primary' : 'bg-muted')} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step: Type */}
      {step === 'type' && (
        <Card>
          <CardContent className="pt-5">
            <h2 className="font-semibold mb-4">What type of pollution? <span className="text-red-500">*</span></h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {POLLUTION_TYPES.map(t => (
                <button key={t.value} onClick={() => setPollutionType(t.value)} className={cn('flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-sm font-medium', pollutionType === t.value ? 'border-primary bg-primary/5 text-primary' : 'border-border hover:border-primary/50 hover:bg-accent')}>
                  <span className="text-2xl">{t.icon}</span>{t.label}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3 mt-5 p-3 bg-muted rounded-xl">
              <button onClick={() => setIsAnonymous(a => !a)} className={cn('w-10 h-6 rounded-full transition-all relative', isAnonymous ? 'bg-primary' : 'bg-muted-foreground/30')}>
                <span className={cn('absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all', isAnonymous ? 'left-5' : 'left-1')} />
              </button>
              <div>
                <p className="text-sm font-medium">Anonymous report {isAnonymous ? '🕵️' : '👤'}</p>
                <p className="text-xs text-muted-foreground">{isAnonymous ? 'Your identity will be hidden' : 'Report as ' + (user?.displayName || 'Citizen')}</p>
              </div>
            </div>
            <Button className="w-full mt-4" onClick={() => setStep('location')} disabled={!pollutionType}>Next →</Button>
          </CardContent>
        </Card>
      )}

      {/* Step: Location */}
      {step === 'location' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold">📍 Where is it? <span className="text-red-500">*</span></h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Ward / Area <span className="text-red-500">*</span></label>
              <Select value={ward} onChange={e => setWard(e.target.value)}>
                <option value="">Select ward...</option>
                {BENGALURU_WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </Select>
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Nearby landmark / address</label>
              <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="e.g. Near Koramangala Bus Stop" />
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('type')}>← Back</Button>
              <Button className="flex-1" onClick={() => setStep('photo')} disabled={!ward}>Next →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Photo */}
      {step === 'photo' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold">📷 Add Photo (optional but recommended)</h2>
            <div onClick={() => fileRef.current?.click()} className={cn('border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all', imagePreview ? 'border-primary' : 'border-border hover:border-primary/60')}>
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="max-h-48 mx-auto rounded-lg object-cover" />
              ) : (
                <div className="space-y-2">
                  <div className="text-4xl">📸</div>
                  <p className="font-medium text-sm">Click to upload photo</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG — max 10MB</p>
                </div>
              )}
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImage} />
            </div>

            {imagePreview && (
              <Button variant="outline" className="w-full" onClick={analyzeImage} disabled={analyzing}>
                {analyzing ? <><Spinner size="sm" /> Analyzing with AI...</> : '🤖 Analyze with Gemini AI'}
              </Button>
            )}

            {aiResult && (
              <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-4 border border-green-200 dark:border-green-800 space-y-2">
                <p className="font-semibold text-green-700 dark:text-green-400 text-sm">✅ AI Analysis Complete</p>
                <div className="grid grid-cols-2 gap-2 text-xs text-green-800 dark:text-green-300">
                  <span>Type: <b className="capitalize">{(aiResult as {pollutionType?:string}).pollutionType?.replace(/_/g,' ')}</b></span>
                  <span>AQI Impact: <b>{(aiResult as {estimatedAQI?:number}).estimatedAQI}</b></span>
                  <span>Health Risk: <b className="capitalize">{(aiResult as {healthRisk?:string}).healthRisk}</b></span>
                  <span>Confidence: <b>{Math.round(((aiResult as {confidence?:number}).confidence || 0)*100)}%</b></span>
                </div>
                <p className="text-xs text-green-700 dark:text-green-300">{(aiResult as {summary?:string}).summary}</p>
              </div>
            )}

            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('location')}>← Back</Button>
              <Button className="flex-1" onClick={() => setStep('details')}>Next →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Details */}
      {step === 'details' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold">📝 Additional Details</h2>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Description <span className="text-red-500">*</span></label>
              <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Describe what you see — more detail helps authorities respond faster..." rows={4} />
            </div>
            <div>
              <label className="text-sm font-medium mb-1.5 block">Severity</label>
              <div className="grid grid-cols-3 gap-2">
                {(['low','medium','high'] as const).map(s => (
                  <button key={s} onClick={() => setSeverity(s)} className={cn('py-2 px-4 rounded-lg border-2 text-sm font-medium capitalize transition-all', severity===s ? (s==='high'?'border-red-500 bg-red-50 text-red-600 dark:bg-red-900/20':s==='medium'?'border-orange-500 bg-orange-50 text-orange-600 dark:bg-orange-900/20':'border-green-500 bg-green-50 text-green-600 dark:bg-green-900/20') : 'border-border hover:border-primary/50')}>
                    {s==='high'?'🔴':s==='medium'?'🟡':'🟢'} {s}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('photo')}>← Back</Button>
              <Button className="flex-1" onClick={() => setStep('review')} disabled={!description.trim()}>Review →</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Step: Review */}
      {step === 'review' && (
        <Card>
          <CardContent className="pt-5 space-y-4">
            <h2 className="font-semibold">✅ Review & Submit</h2>
            <div className="rounded-xl border divide-y">
              {[
                { label:'Type', value: `${getPollutionIcon(pollutionType)} ${pollutionType.replace(/_/g,' ')}` },
                { label:'Location', value: `${ward}${address ? ' · ' + address : ''}` },
                { label:'Severity', value: severity },
                { label:'Description', value: description },
                { label:'Submitted as', value: isAnonymous ? '🕵️ Anonymous' : `👤 ${user?.displayName || 'Citizen'}` },
              ].map(({ label, value }) => (
                <div key={label} className="flex gap-4 px-4 py-3 text-sm">
                  <span className="text-muted-foreground w-24 flex-shrink-0">{label}</span>
                  <span className="font-medium capitalize">{value}</span>
                </div>
              ))}
              {imagePreview && <div className="px-4 py-3"><img src={imagePreview} alt="Report" className="h-28 rounded-lg object-cover" /></div>}
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-3 text-xs text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
              ℹ️ This report will be sent to BBMP authorities and community members. False reports reduce your Karma score.
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => setStep('details')}>← Back</Button>
              <Button className="flex-1" onClick={handleSubmit} loading={submitting}>🚀 Submit Report</Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success Modal */}
      <Modal open={successModal} onClose={() => { setSuccessModal(false); navigate('/'); }} title="">
        <div className="text-center space-y-4 py-4">
          <div className="text-6xl">🎉</div>
          <h2 className="text-xl font-bold">Report Submitted!</h2>
          <p className="text-muted-foreground text-sm">Your report #{reportId} has been received. Authorities will review it shortly.</p>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-sm text-green-700 dark:text-green-400 font-medium">+10 Karma Points earned! ⭐</div>
          <div className="flex gap-3">
            <Button variant="outline" className="flex-1" onClick={() => { setSuccessModal(false); navigate('/'); }}>Go Home</Button>
            <Button className="flex-1" onClick={() => { setSuccessModal(false); setStep('type'); setPollutionType(''); setDescription(''); setImagePreview(''); setAiResult(null); }}>Report Another</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
