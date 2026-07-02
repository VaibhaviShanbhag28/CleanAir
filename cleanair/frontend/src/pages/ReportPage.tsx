import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Modal, toast } from '@/components/ui';
import { imageToBase64, POLLUTION_TYPES, BENGALURU_WARDS } from '@/lib/utils';

const T = {
  navy: '#0A2240', green: '#1A6B3C', greenDark: '#166534',
  surface: '#F5F7FA', border: '#DDE2EA',
  textPrimary: '#0D1B2A', textMuted: '#4A5568',
  danger: '#991B1B', warning: '#92400E', card: '#FFFFFF',
};

type Step = 'type' | 'location' | 'photo' | 'details' | 'review';
const STEPS: Step[] = ['type', 'location', 'photo', 'details', 'review'];
const STEP_LABELS = ['Incident Type', 'Location', 'Evidence', 'Details', 'Review'];

const Icon = {
  Upload: () => (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Brain: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24A3 3 0 0 1 2 10a3 3 0 0 1 3-3 2.5 2.5 0 0 1 4.5-5z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24A3 3 0 0 0 22 10a3 3 0 0 0-3-3 2.5 2.5 0 0 0-4.5-5z"/>
    </svg>
  ),
  Check: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  ChevronLeft: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6"/>
    </svg>
  ),
  ChevronRight: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="9 18 15 12 9 6"/>
    </svg>
  ),
  Send: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>
    </svg>
  ),
  Home: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  ),
  Plus: () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  ),
  Lock: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  ),
  User: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
    </svg>
  ),
  Info: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  ),
  CheckCircle: () => (
    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/>
    </svg>
  ),
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5625rem 0.875rem',
  border: `1.5px solid ${T.border}`, borderRadius: 4,
  fontSize: '0.875rem', color: T.textPrimary,
  background: 'white', outline: 'none',
  boxSizing: 'border-box', fontFamily: 'inherit',
};
const labelStyle: React.CSSProperties = {
  display: 'block', fontWeight: 600, fontSize: '0.75rem',
  color: T.textPrimary, marginBottom: '0.375rem',
  textTransform: 'uppercase', letterSpacing: '0.05em',
};
const primaryBtn = (disabled = false): React.CSSProperties => ({
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0.625rem 1.375rem',
  background: disabled ? '#9CA3AF' : T.navy,
  color: 'white', border: 'none', borderRadius: 4,
  fontWeight: 700, fontSize: '0.875rem',
  cursor: disabled ? 'not-allowed' : 'pointer', transition: 'all 0.15s',
});
const outlineBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
  padding: '0.625rem 1.125rem',
  background: 'white', color: T.navy,
  border: `1.5px solid ${T.navy}`, borderRadius: 4,
  fontWeight: 600, fontSize: '0.875rem', cursor: 'pointer', transition: 'all 0.15s',
};

const POLL_TYPES_CLEAN = POLLUTION_TYPES.map(t => ({ ...t, icon: undefined }));

// Map label to professional short display names
const TYPE_LABELS: Record<string, string> = {
  garbage_fire: 'Garbage Fire', smoke: 'Smoke / Haze',
  construction_dust: 'Construction Dust', industrial: 'Industrial Emission',
  vehicle: 'Vehicle Emission', burning_waste: 'Waste Burning',
  water_pollution: 'Water Pollution', illegal_dumping: 'Illegal Dumping',
  sewage_leakage: 'Sewage Leakage', tree_cutting: 'Illegal Tree Felling',
  noise_pollution: 'Noise Pollution', chemical_dumping: 'Chemical Dumping',
  unknown: 'Other / Unknown',
};

// Small colored squares per type (no emoji)
const TYPE_COLORS: Record<string, string> = {
  garbage_fire: '#B91C1C', smoke: '#374151', construction_dust: '#B45309',
  industrial: '#6D28D9', vehicle: '#1E40AF', burning_waste: '#C2410C',
  water_pollution: '#0891B2', illegal_dumping: '#78350F',
  sewage_leakage: '#065F46', tree_cutting: '#166534',
  noise_pollution: '#6B7280', chemical_dumping: '#7C3AED', unknown: '#9CA3AF',
};

export default function ReportPage() {
  const { user, addReport } = useAppStore();
  const navigate = useNavigate();
  const [step, setStep]               = useState<Step>('type');
  const [isAnonymous, setIsAnonymous] = useState(!user);
  const [pollutionType, setPollutionType] = useState('');
  const [severity, setSeverity]       = useState('medium');
  const [ward, setWard]               = useState('');
  const [address, setAddress]         = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile]     = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [imageBase64, setImageBase64] = useState('');
  const [aiResult, setAiResult]       = useState<Record<string, unknown> | null>(null);
  const [analyzing, setAnalyzing]     = useState(false);
  const [submitting, setSubmitting]   = useState(false);
  const [successModal, setSuccessModal] = useState(false);
  const [reportId, setReportId]       = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const stepIdx = STEPS.indexOf(step);

  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    setImageFile(f);
    const b64 = await imageToBase64(f);
    setImagePreview(b64); setImageBase64(b64);
  };

  const analyzeImage = async () => {
    if (!imageBase64) return;
    setAnalyzing(true);
    try {
      const result = await api.ai.analyze(imageBase64, imageFile?.type || 'image/jpeg', pollutionType, description, !!ward);
      setAiResult(result as Record<string, unknown>);
      const r = result as { estimatedSeverity?: string };
      if (r.estimatedSeverity) setSeverity(r.estimatedSeverity);
      toast('AI analysis complete.', 'success');
    } catch { toast('AI analysis unavailable — you can continue without it.', 'warning'); }
    finally { setAnalyzing(false); }
  };

  const handleSubmit = async () => {
    if (!ward || !pollutionType || !description) { toast('All required fields must be completed.', 'error'); return; }
    setSubmitting(true);
    try {
      const validation = aiResult ? (aiResult as { validation?: Record<string, unknown> }).validation : undefined;
      const payload = {
        userId: user?.uid || 'anonymous',
        userDisplayName: isAnonymous ? 'Anonymous Citizen' : (user?.displayName || 'Citizen'),
        isAnonymous,
        location: { lat: 12.9716 + Math.random() * 0.1 - 0.05, lng: 77.5946 + Math.random() * 0.1 - 0.05, address: address || `Near ${ward}`, ward, district: 'Bengaluru Urban' },
        pollutionType, severity, description,
        aiAnalysis: aiResult ? { ...aiResult, validation: undefined } : undefined,
        validation, tags: [],
      };
      const res = await api.reports.create(payload) as { id: string };
      setReportId(res.id);
      addReport(res as Parameters<typeof addReport>[0]);
      if (user?.uid) await api.karma.add(user.uid, 'report_submitted');
      setSuccessModal(true);
    } catch (e: unknown) {
      const err = e as { detail?: { blocked?: boolean; reason?: string } };
      if (err?.detail?.blocked) toast(`Report blocked: ${err.detail.reason}`, 'error');
      else toast('Submission failed. Please try again.', 'error');
    } finally { setSubmitting(false); }
  };

  const resetForm = () => {
    setStep('type'); setPollutionType(''); setDescription('');
    setImagePreview(''); setImageBase64(''); setAiResult(null);
    setSeverity('medium'); setWard(''); setAddress('');
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* ── Header ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '1.25rem' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: '0 0 4px' }}>
          Submit Pollution Incident
        </h1>
        <p style={{ color: T.textMuted, fontSize: '0.875rem', margin: 0 }}>
          Report environmental violations to BBMP — every verified report earns +10 Karma
        </p>
      </div>

      {/* ── Step progress ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
        {STEPS.map((s, i) => (
          <React.Fragment key={s}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 4,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < stepIdx ? T.greenDark : i === stepIdx ? T.navy : T.surface,
                color: i <= stepIdx ? 'white' : T.textMuted,
                fontWeight: 700, fontSize: '0.75rem',
                border: `1.5px solid ${i < stepIdx ? T.greenDark : i === stepIdx ? T.navy : T.border}`,
                transition: 'all 0.2s',
              }}>
                {i < stepIdx ? <Icon.Check /> : i + 1}
              </div>
              <span style={{ fontSize: '0.65rem', fontWeight: 600, color: i === stepIdx ? T.navy : T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                {STEP_LABELS[i]}
              </span>
            </div>
            {i < STEPS.length - 1 && (
              <div style={{ flex: 1, height: 1.5, background: i < stepIdx ? T.greenDark : T.border, margin: '0 4px 18px', transition: 'background 0.3s' }} />
            )}
          </React.Fragment>
        ))}
      </div>

      {/* ── Step 1: Incident Type ── */}
      {step === 'type' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Select Incident Type <span style={{ color: T.danger }}>*</span></p>
          </div>
          <div style={{ padding: '1.25rem' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(175px,1fr))', gap: '0.625rem' }}>
              {POLLUTION_TYPES.map(t => (
                <button key={t.value} onClick={() => setPollutionType(t.value)} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '0.75rem 0.875rem', textAlign: 'left',
                  border: `1.5px solid ${pollutionType === t.value ? T.navy : T.border}`,
                  borderLeft: `4px solid ${TYPE_COLORS[t.value] ?? '#9CA3AF'}`,
                  borderRadius: 4,
                  background: pollutionType === t.value ? `${T.navy}08` : 'white',
                  cursor: 'pointer', transition: 'all 0.15s',
                }}>
                  <div style={{ width: 10, height: 10, borderRadius: '50%', background: TYPE_COLORS[t.value] ?? '#9CA3AF', flexShrink: 0 }} />
                  <span style={{ fontWeight: pollutionType === t.value ? 700 : 500, fontSize: '0.8125rem', color: pollutionType === t.value ? T.navy : T.textPrimary }}>
                    {TYPE_LABELS[t.value] ?? t.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Anonymous toggle */}
            <div style={{ marginTop: '1.25rem', padding: '0.875rem 1rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <button onClick={() => setIsAnonymous(a => !a)} style={{
                width: 40, height: 22, borderRadius: 11, flexShrink: 0,
                background: isAnonymous ? T.navy : T.border,
                border: 'none', cursor: 'pointer', position: 'relative', transition: 'background 0.2s',
              }}>
                <span style={{
                  position: 'absolute', top: 3, width: 16, height: 16, borderRadius: '50%',
                  background: 'white', transition: 'left 0.2s',
                  left: isAnonymous ? 21 : 3, boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                }} />
              </button>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span style={{ color: isAnonymous ? T.navy : T.textMuted }}>{isAnonymous ? <Icon.Lock /> : <Icon.User />}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>
                    {isAnonymous ? 'Submit Anonymously' : `Submit as ${user?.displayName || 'Citizen'}`}
                  </p>
                  <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>
                    {isAnonymous ? 'Your identity will not be disclosed' : 'Your name will be visible to authorities'}
                  </p>
                </div>
              </div>
            </div>

            <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'flex-end' }}>
              <button style={primaryBtn(!pollutionType)} disabled={!pollutionType} onClick={() => setStep('location')}>
                Continue <Icon.ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Location ── */}
      {step === 'location' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Incident Location <span style={{ color: T.danger }}>*</span></p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Ward / Area <span style={{ color: T.danger }}>*</span></label>
              <select style={{ ...inputStyle, appearance: 'none' }} value={ward} onChange={e => setWard(e.target.value)}
                onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
                <option value="">Select ward...</option>
                {BENGALURU_WARDS.map(w => <option key={w} value={w}>{w}</option>)}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Landmark / Nearest Address</label>
              <input style={inputStyle} value={address} onChange={e => setAddress(e.target.value)}
                placeholder="e.g. Near Koramangala 5th Block water tank"
                onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)} />
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
              <button style={outlineBtn} onClick={() => setStep('type')}>
                <Icon.ChevronLeft /> Back
              </button>
              <button style={primaryBtn(!ward)} disabled={!ward} onClick={() => setStep('photo')}>
                Continue <Icon.ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 3: Evidence (Photo) ── */}
      {step === 'photo' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Photographic Evidence</p>
            <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>Optional but strongly recommended — photos are verified by AI</p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div onClick={() => fileRef.current?.click()} style={{
              border: `1.5px dashed ${imagePreview ? T.navy : T.border}`,
              borderRadius: 6, padding: '2rem', textAlign: 'center', cursor: 'pointer',
              background: imagePreview ? `${T.navy}04` : T.surface, transition: 'all 0.15s',
            }}
              onMouseEnter={e => { if (!imagePreview) e.currentTarget.style.borderColor = T.navy; }}
              onMouseLeave={e => { if (!imagePreview) e.currentTarget.style.borderColor = T.border; }}
            >
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" style={{ maxHeight: 200, margin: '0 auto', borderRadius: 4, objectFit: 'cover', display: 'block' }} />
              ) : (
                <>
                  <div style={{ color: T.textMuted, marginBottom: 10 }}><Icon.Upload /></div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', color: T.textPrimary, marginBottom: 4 }}>Click to upload photo</p>
                  <p style={{ fontSize: '0.75rem', color: T.textMuted }}>JPG, PNG — max 10 MB</p>
                </>
              )}
              <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImage} />
            </div>

            {imagePreview && (
              <button
                style={{ ...outlineBtn, justifyContent: 'center', opacity: analyzing ? 0.7 : 1 }}
                onClick={analyzeImage} disabled={analyzing}
              >
                {analyzing
                  ? <><span style={{ width: 14, height: 14, border: `2px solid ${T.navy}`, borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Analysing with AI...</>
                  : <><Icon.Brain /> Run AI Analysis</>}
              </button>
            )}

            {aiResult && (
              <div style={{ padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: '0.625rem' }}>
                  <span style={{ color: T.greenDark }}><Icon.Check /></span>
                  <span style={{ fontWeight: 700, fontSize: '0.8125rem', color: T.greenDark }}>AI Analysis Complete</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', marginBottom: '0.5rem' }}>
                  {[
                    { label: 'Detected Type', value: ((aiResult as {pollutionType?:string}).pollutionType ?? '—').replace(/_/g, ' ') },
                    { label: 'AQI Impact',    value: String((aiResult as {estimatedAQI?:number}).estimatedAQI ?? '—') },
                    { label: 'Health Risk',   value: (aiResult as {healthRisk?:string}).healthRisk ?? '—' },
                    { label: 'Confidence',    value: `${Math.round(((aiResult as {confidence?:number}).confidence ?? 0) * 100)}%` },
                  ].map(f => (
                    <div key={f.label}>
                      <p style={{ fontSize: '0.7rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase', letterSpacing: '0.05em', margin: '0 0 2px' }}>{f.label}</p>
                      <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#15803D', margin: 0, textTransform: 'capitalize' }}>{f.value}</p>
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: '0.8125rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>{(aiResult as {summary?:string}).summary}</p>
              </div>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
              <button style={outlineBtn} onClick={() => setStep('location')}><Icon.ChevronLeft /> Back</button>
              <button style={primaryBtn()} onClick={() => setStep('details')}>Continue <Icon.ChevronRight /></button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 4: Details ── */}
      {step === 'details' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Incident Details</p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label style={labelStyle}>Description <span style={{ color: T.danger }}>*</span></label>
              <textarea
                value={description} rows={4}
                onChange={e => setDescription(e.target.value)}
                placeholder="Describe the incident — what you observed, approximate time, affected area, number of people impacted. More detail enables faster authority response."
                style={{ ...inputStyle, minHeight: 100, resize: 'vertical', lineHeight: 1.6 }}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
            </div>

            <div>
              <label style={labelStyle}>Severity Assessment</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.625rem' }}>
                {([['low','Low — Minor nuisance','#166534','#F0FDF4','#BBF7D0'],['medium','Medium — Health concern','#92400E','#FFFBEB','#FDE68A'],['high','High — Immediate action needed','#991B1B','#FFF5F5','#FECACA']] as const).map(([s, desc, color, bg, border]) => (
                  <button key={s} onClick={() => setSeverity(s)} style={{
                    padding: '0.75rem 0.625rem', textAlign: 'center',
                    border: `1.5px solid ${severity === s ? color : T.border}`,
                    borderRadius: 4,
                    background: severity === s ? bg : 'white',
                    cursor: 'pointer', transition: 'all 0.15s',
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: color, margin: '0 auto 5px' }} />
                    <p style={{ fontWeight: 700, fontSize: '0.8125rem', color: severity === s ? color : T.textPrimary, margin: '0 0 2px', textTransform: 'capitalize' }}>{s}</p>
                    <p style={{ fontSize: '0.68rem', color: T.textMuted, margin: 0, lineHeight: 1.3 }}>{desc}</p>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
              <button style={outlineBtn} onClick={() => setStep('photo')}><Icon.ChevronLeft /> Back</button>
              <button style={primaryBtn(!description.trim())} disabled={!description.trim()} onClick={() => setStep('review')}>
                Review <Icon.ChevronRight />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 5: Review ── */}
      {step === 'review' && (
        <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, background: T.card, overflow: 'hidden' }}>
          <div style={{ padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Review & Submit</p>
          </div>
          <div style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Summary table */}
            <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
              {[
                { label: 'Incident Type', value: (TYPE_LABELS[pollutionType] ?? pollutionType).replace(/_/g, ' ') },
                { label: 'Location',      value: `${ward}${address ? ' — ' + address : ''}` },
                { label: 'Severity',      value: severity },
                { label: 'Description',   value: description },
                { label: 'Submitted As',  value: isAnonymous ? 'Anonymous Citizen' : (user?.displayName || 'Citizen') },
              ].map(({ label, value }, i) => (
                <div key={label} style={{ display: 'flex', gap: '1rem', padding: '0.625rem 1rem', background: i % 2 === 0 ? T.surface : 'white', borderBottom: `1px solid ${T.border}` }}>
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', width: 110, flexShrink: 0 }}>{label}</span>
                  <span style={{ fontSize: '0.875rem', color: T.textPrimary, fontWeight: 500, textTransform: 'capitalize' }}>{value}</span>
                </div>
              ))}
              {imagePreview && (
                <div style={{ padding: '0.75rem 1rem', borderBottom: `1px solid ${T.border}` }}>
                  <img src={imagePreview} alt="Evidence" style={{ height: 100, borderRadius: 4, objectFit: 'cover' }} />
                </div>
              )}
            </div>

            {/* Disclaimer */}
            <div style={{ padding: '0.75rem 1rem', background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: 6, display: 'flex', alignItems: 'flex-start', gap: 8 }}>
              <span style={{ color: '#1E40AF', flexShrink: 0, marginTop: 1 }}><Icon.Info /></span>
              <p style={{ fontSize: '0.8125rem', color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>
                This report will be forwarded to BBMP authorities for review. Submitting false or misleading reports will reduce your Karma score and may result in account restrictions.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'space-between' }}>
              <button style={outlineBtn} onClick={() => setStep('details')}><Icon.ChevronLeft /> Back</button>
              <button style={{ ...primaryBtn(submitting), flex: 1, maxWidth: 220 }} disabled={submitting} onClick={handleSubmit}>
                {submitting
                  ? <><span style={{ width: 14, height: 14, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite', display: 'inline-block' }} /> Submitting...</>
                  : <><Icon.Send /> Submit Report</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Success Modal ── */}
      <Modal open={successModal} onClose={() => { setSuccessModal(false); navigate('/'); }} title="">
        <div style={{ textAlign: 'center', padding: '1rem 0.5rem' }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#F0FDF4', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem', color: T.greenDark }}>
            <Icon.CheckCircle />
          </div>
          <h2 style={{ fontWeight: 800, fontSize: '1.25rem', color: T.textPrimary, marginBottom: '0.375rem' }}>Report Submitted</h2>
          <p style={{ fontSize: '0.875rem', color: T.textMuted, marginBottom: '1rem', lineHeight: 1.5 }}>
            Incident <code style={{ background: T.surface, padding: '1px 5px', borderRadius: 3, border: `1px solid ${T.border}` }}>#{reportId}</code> has been received. BBMP authorities will review it shortly.
          </p>
          <div style={{ padding: '0.75rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6, marginBottom: '1.25rem' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: T.greenDark, margin: 0 }}>+10 Karma Points credited to your account</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            <button style={{ ...outlineBtn, flex: 1 }} onClick={() => { setSuccessModal(false); navigate('/'); }}>
              <Icon.Home /> Dashboard
            </button>
            <button style={{ ...primaryBtn(), flex: 1 }} onClick={() => { setSuccessModal(false); resetForm(); }}>
              <Icon.Plus /> Submit Another
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}