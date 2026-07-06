import React, { useState, useRef } from 'react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Modal, toast } from '@/components/ui';
import { imageToBase64 } from '@/lib/utils';
import { useSearchParams } from 'react-router-dom';

// ── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  navy:        '#0A2240',
  green:       '#1A6B3C',
  greenDark:   '#166534',
  surface:     '#F5F7FA',
  border:      '#DDE2EA',
  textPrimary: '#0D1B2A',
  textMuted:   '#4A5568',
  danger:      '#991B1B',
  warning:     '#92400E',
  card:        '#FFFFFF',
};

type Tool = 'waste' | 'carbon' | 'notice' | 'advisory' | 'seasonal' | 'cleanup';

// ── SVG Icons ─────────────────────────────────────────────────────────────────
const Icon = {
  Recycle: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1 4 1 10 7 10"/><polyline points="23 20 23 14 17 14"/>
      <path d="M20.49 9A9 9 0 0 0 5.64 5.64L1 10m22 4l-4.64 4.36A9 9 0 0 1 3.51 15"/>
    </svg>
  ),
  Globe: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
    </svg>
  ),
  FileText: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/>
    </svg>
  ),
  Wind: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"/>
    </svg>
  ),
  Calendar: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  ),
  Camera: () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
      <circle cx="12" cy="13" r="4"/>
    </svg>
  ),
  Upload: () => (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/>
      <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
    </svg>
  ),
  Check: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  ),
  X: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  ),
  ArrowRight: () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
    </svg>
  ),
  Copy: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2"/>
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
    </svg>
  ),
  RefreshCw: () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="23 4 23 10 17 10"/>
      <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/>
    </svg>
  ),
  Brain: () => (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.46 2.5 2.5 0 0 1-1.96-3 2.5 2.5 0 0 1-1.32-4.24A3 3 0 0 1 2 10a3 3 0 0 1 3-3 2.5 2.5 0 0 1 4.5-5z"/>
      <path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.46 2.5 2.5 0 0 0 1.96-3 2.5 2.5 0 0 0 1.32-4.24A3 3 0 0 0 22 10a3 3 0 0 0-3-3 2.5 2.5 0 0 0-4.5-5z"/>
    </svg>
  ),
};

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.5rem 0.75rem',
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
  padding: '0.5625rem 1.25rem',
  background: disabled ? '#9CA3AF' : T.navy,
  color: 'white', border: 'none', borderRadius: 4,
  fontWeight: 600, fontSize: '0.8125rem',
  cursor: disabled ? 'not-allowed' : 'pointer',
  transition: 'all 0.15s', letterSpacing: '0.01em',
  width: '100%',
});
const outlineBtn: React.CSSProperties = {
  display: 'inline-flex', alignItems: 'center', gap: 6,
  padding: '0.5rem 1rem', background: 'white',
  color: T.navy, border: `1.5px solid ${T.navy}`,
  borderRadius: 4, fontWeight: 600, fontSize: '0.8125rem',
  cursor: 'pointer', transition: 'all 0.15s',
};
const sectionCard: React.CSSProperties = {
  border: `1px solid ${T.border}`, borderRadius: 6,
  background: T.card, overflow: 'hidden',
};
const sectionHeader: React.CSSProperties = {
  padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`,
  display: 'flex', alignItems: 'center', gap: 8,
};
const sectionBody: React.CSSProperties = { padding: '1.25rem' };

// ── Spinner ───────────────────────────────────────────────────────────────────
const Spin = () => (
  <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid white', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
);

// ── Upload zone ───────────────────────────────────────────────────────────────
function UploadZone({ preview, label, onClick }: { preview: string; label: string; onClick: () => void }) {
  return (
    <div
      onClick={onClick}
      style={{
        border: `1.5px dashed ${preview ? T.navy : T.border}`,
        borderRadius: 6, padding: '1.5rem', textAlign: 'center',
        cursor: 'pointer', transition: 'all 0.15s',
        background: preview ? `${T.navy}05` : T.surface,
      }}
      onMouseEnter={e => { if (!preview) e.currentTarget.style.borderColor = T.navy; }}
      onMouseLeave={e => { if (!preview) e.currentTarget.style.borderColor = T.border; }}
    >
      {preview ? (
        <img src={preview} alt={label} style={{ maxHeight: 160, margin: '0 auto', borderRadius: 4, objectFit: 'cover', display: 'block' }} />
      ) : (
        <>
          <div style={{ color: T.textMuted, marginBottom: 8 }}><Icon.Upload /></div>
          <p style={{ fontWeight: 600, fontSize: '0.875rem', color: T.textPrimary, marginBottom: 2 }}>{label}</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted }}>Click to select file</p>
        </>
      )}
    </div>
  );
}

// ── Info row ──────────────────────────────────────────────────────────────────
function InfoRow({ label, value }: { label: string; value?: string }) {
  return value ? (
    <div style={{ display: 'flex', gap: '1rem', padding: '0.5rem 0', borderBottom: `1px solid ${T.border}` }}>
      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', width: 140, flexShrink: 0 }}>{label}</span>
      <span style={{ fontSize: '0.875rem', color: T.textPrimary }}>{value}</span>
    </div>
  ) : null;
}

// ── Metric bar ────────────────────────────────────────────────────────────────
function MetricBar({ label, value, total, color = T.navy }: { label: string; value: number; total: number; color?: string }) {
  const pct = Math.min(100, Math.round((value / (total || 1)) * 100));
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
      <span style={{ fontSize: '0.8125rem', color: T.textMuted, width: 120, flexShrink: 0 }}>{label}</span>
      <div style={{ flex: 1, height: 5, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 3, transition: 'width 0.7s ease' }} />
      </div>
      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: T.textPrimary, width: 48, textAlign: 'right', flexShrink: 0 }}>{value.toFixed(0)} kg</span>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function AIToolsPage() {
  const [searchParams] = useSearchParams();
  const defaultTab = (searchParams.get('tab') as Tool) || 'waste';
  const [tool, setTool] = useState<Tool>(defaultTab);
  const { currentAQI } = useAppStore();

  const TOOLS: { key: Tool; icon: React.ReactNode; label: string; desc: string }[] = [
    { key: 'waste',    icon: <Icon.Recycle />,  label: 'Waste Classifier',   desc: 'AI waste segregation' },
    { key: 'carbon',   icon: <Icon.Globe />,    label: 'Carbon Footprint',   desc: 'Calculate your impact' },
    { key: 'notice',   icon: <Icon.FileText />, label: 'Notice Generator',   desc: 'Official BBMP notices' },
    { key: 'advisory', icon: <Icon.Wind />,     label: 'Air Advisory',       desc: 'Daily AQI guidance' },
    { key: 'seasonal', icon: <Icon.Calendar />, label: 'Seasonal Forecast',  desc: 'Monthly predictions' },
    { key: 'cleanup',  icon: <Icon.Camera />,   label: 'Cleanup Verifier',   desc: 'Before & after AI check' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontFamily: "'DM Sans','Inter',sans-serif" }}>

      {/* ── Page header ── */}
      <div style={{ borderBottom: `1px solid ${T.border}`, paddingBottom: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
          <div style={{ width: 36, height: 36, borderRadius: 6, background: T.navy, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
            <Icon.Brain />
          </div>
          <h1 style={{ fontSize: '1.5rem', fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.02em', margin: 0 }}>
            AI Intelligence Suite
          </h1>
        </div>
        <p style={{ color: T.textMuted, fontSize: '0.875rem', margin: 0 }}>
          Environmental analysis tools powered by AI — waste classification, carbon audit, official notice generation and more
        </p>
      </div>

      {/* ── Tool selector ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: '0.625rem' }}>
        {TOOLS.map(t => (
          <button
            key={t.key}
            onClick={() => setTool(t.key)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '0.75rem 1rem', textAlign: 'left',
              border: `1.5px solid ${tool === t.key ? T.navy : T.border}`,
              borderRadius: 6, background: tool === t.key ? `${T.navy}08` : 'white',
              color: tool === t.key ? T.navy : T.textPrimary,
              cursor: 'pointer', transition: 'all 0.15s',
            }}
          >
            <div style={{ color: tool === t.key ? T.navy : T.textMuted, flexShrink: 0 }}>{t.icon}</div>
            <div>
              <p style={{ fontWeight: 700, fontSize: '0.8125rem', margin: 0 }}>{t.label}</p>
              <p style={{ fontSize: '0.7rem', color: T.textMuted, margin: 0 }}>{t.desc}</p>
            </div>
          </button>
        ))}
      </div>

      {/* ── Tool panels ── */}
      {tool === 'waste'    && <WasteClassifier />}
      {tool === 'carbon'   && <CarbonCalculator />}
      {tool === 'notice'   && <NoticeGenerator />}
      {tool === 'advisory' && <AirAdvisory aqi={currentAQI} />}
      {tool === 'seasonal' && <SeasonalForecast />}
      {tool === 'cleanup'  && <CleanupVerifier />}
    </div>
  );
}

// ── Waste Classifier ──────────────────────────────────────────────────────────
// ── Waste Classifier ──────────────────────────────────────────────────────────
function WasteClassifier() {
  const [image, setImage]     = useState('');
  const [preview, setPreview] = useState('');
  const [result, setResult]   = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    const b64 = await imageToBase64(f);
    setPreview(b64);
    setImage(b64);
    setResult(null);
    setError('');
  };

  const classify = async () => {
    if (!image) return;
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const res = await api.ai.classifyWaste(image) as Record<string, unknown>;
      setResult(res);
    } catch (e) {
      setError('Classification failed. Please try again.');
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const r = result as {
    bin_color?: string;
    primary_category?: string;
    is_recyclable?: boolean;
    segregation_tip?: string;
    environmental_note?: string;
    confidence?: number;
    items?: { name: string; category: string; disposal: string }[];
  } | null;

  const BIN_HEX: Record<string, string> = {
    green: '#166534',
    blue:  '#1E40AF',
    red:   '#991B1B',
    black: '#111827',
  };

  return (
    <div style={sectionCard}>
      <div style={sectionHeader}>
        <div style={{ color: T.navy }}><Icon.Recycle /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>
            Waste Segregation Classifier
          </p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>
            Upload a photo -- AI identifies the waste type and correct disposal bin
          </p>
        </div>
      </div>

      <div style={{ ...sectionBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>

        {/* Upload zone */}
        <div
          onClick={() => fileRef.current?.click()}
          style={{
            border: `1.5px dashed ${preview ? T.navy : T.border}`,
            borderRadius: 6,
            padding: '1.5rem',
            textAlign: 'center',
            cursor: 'pointer',
            background: preview ? `${T.navy}05` : T.surface,
            transition: 'all 0.15s',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Waste preview"
              style={{
                maxHeight: 200,
                maxWidth: '100%',
                borderRadius: 4,
                objectFit: 'contain',
                display: 'block',
              }}
            />
          ) : (
            <>
              <div style={{ color: T.textMuted }}><Icon.Upload /></div>
              <p style={{ fontWeight: 600, fontSize: '0.875rem', color: T.textPrimary, margin: 0 }}>
                Click to upload waste photo
              </p>
              <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>
                JPG, PNG -- max 10 MB
              </p>
            </>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            style={{ display: 'none' }}
            onChange={handleFile}
          />
        </div>

        {/* Classify button -- always visible when image selected */}
        {preview && (
          <button
            onClick={classify}
            disabled={loading}
            style={{
              ...primaryBtn(loading),
              padding: '0.625rem 1.25rem',
              fontSize: '0.9rem',
              width: '100%',
            }}
          >
            {loading ? (
              <>
                <span style={{
                  width: 16, height: 16,
                  border: '2px solid white',
                  borderTopColor: 'transparent',
                  borderRadius: '50%',
                  display: 'inline-block',
                  animation: 'spin 0.7s linear infinite',
                }} />
                Classifying...
              </>
            ) : (
              'Run AI Classification'
            )}
          </button>
        )}

        {/* Error */}
        {error && (
          <div style={{
            padding: '0.75rem 1rem',
            background: '#FFF5F5',
            border: '1px solid #FECACA',
            borderRadius: 6,
            fontSize: '0.875rem',
            color: '#991B1B',
          }}>
            {error}
          </div>
        )}

        {/* Results */}
        {r && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>

            {/* Bin result header */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
              padding: '1rem',
              background: T.surface,
              border: `1px solid ${T.border}`,
              borderRadius: 6,
            }}>
              <div style={{
                width: 52,
                height: 52,
                borderRadius: 8,
                flexShrink: 0,
                background: BIN_HEX[r.bin_color || 'blue'] || '#1E40AF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontWeight: 800,
                fontSize: '1.25rem',
              }}>
                {(r.bin_color || 'B')[0].toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  color: T.textPrimary,
                  margin: '0 0 3px',
                  textTransform: 'capitalize',
                }}>
                  {r.primary_category} Waste
                </p>
                <p style={{ fontSize: '0.8125rem', color: T.textMuted, margin: 0, textTransform: 'capitalize' }}>
                  Dispose in the <strong>{r.bin_color}</strong> bin
                </p>
                {r.confidence !== undefined && (
                  <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '2px 0 0' }}>
                    Confidence: {Math.round((r.confidence || 0) * 100)}%
                  </p>
                )}
              </div>
              <span style={{
                padding: '0.2rem 0.65rem',
                borderRadius: 3,
                fontSize: '0.75rem',
                fontWeight: 700,
                background: r.is_recyclable ? '#F0FDF4' : '#FFFBEB',
                color:      r.is_recyclable ? '#166534' : '#92400E',
                border:     `1px solid ${r.is_recyclable ? '#BBF7D0' : '#FDE68A'}`,
                flexShrink: 0,
              }}>
                {r.is_recyclable ? 'Recyclable' : 'Non-recyclable'}
              </span>
            </div>

            {/* Segregation tip */}
            {r.segregation_tip && (
              <div style={{
                padding: '0.875rem',
                background: '#EFF6FF',
                border: '1px solid #BFDBFE',
                borderRadius: 6,
              }}>
                <p style={{
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  color: '#1E40AF',
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  margin: '0 0 4px',
                }}>
                  Disposal Guidance
                </p>
                <p style={{ fontSize: '0.875rem', color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>
                  {r.segregation_tip}
                </p>
              </div>
            )}

            {/* Items detected */}
            {r.items && r.items.length > 0 && (
              <div style={{
                border: `1px solid ${T.border}`,
                borderRadius: 6,
                overflow: 'hidden',
              }}>
                <div style={{
                  padding: '0.5rem 0.875rem',
                  background: T.surface,
                  borderBottom: `1px solid ${T.border}`,
                }}>
                  <p style={{
                    fontWeight: 600,
                    fontSize: '0.75rem',
                    color: T.textMuted,
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                    margin: 0,
                  }}>
                    Items Detected
                  </p>
                </div>
                {r.items.map((item, i) => (
                  <div key={i} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.625rem 0.875rem',
                    borderBottom: i < r.items!.length - 1 ? `1px solid ${T.border}` : 'none',
                  }}>
                    <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: T.textPrimary }}>
                      {item.name}
                    </span>
                    <span style={{
                      fontSize: '0.75rem',
                      padding: '0.1rem 0.45rem',
                      background: '#EFF6FF',
                      color: '#1E40AF',
                      border: '1px solid #BFDBFE',
                      borderRadius: 3,
                      textTransform: 'capitalize',
                    }}>
                      {item.category}
                    </span>
                    <span style={{ fontSize: '0.75rem', color: T.textMuted }}>
                      {item.disposal}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Environmental note */}
            {r.environmental_note && (
              <div style={{
                padding: '0.75rem',
                background: '#F0FDF4',
                border: '1px solid #BBF7D0',
                borderRadius: 6,
                fontSize: '0.875rem',
                color: '#166534',
                lineHeight: 1.5,
              }}>
                {r.environmental_note}
              </div>
            )}

            {/* Try another */}
            <button
              onClick={() => { setPreview(''); setImage(''); setResult(null); setError(''); }}
              style={{
                background: 'none',
                border: `1.5px solid ${T.border}`,
                borderRadius: 4,
                padding: '0.5rem 1rem',
                fontSize: '0.8125rem',
                color: T.textMuted,
                cursor: 'pointer',
                fontFamily: 'inherit',
                alignSelf: 'flex-start',
              }}
            >
              Classify another image
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


function CarbonCalculator() {
  const [form, setForm] = useState({ transportMode: 'bus', distanceKm: 10, electricityKwh: 100, lpgCylinders: 1, meatMealsPerWeek: 3, flightsPerYear: 1 });
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const calc = async () => {
    setLoading(true);
    try { setResult(await api.ai.carbon(form) as Record<string, unknown>); }
    catch { toast('Calculation failed. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  const r = result as { totalCO2?: number; rating?: string; comparison?: string; breakdown?: Record<string, number>; tips?: string[]; trees_to_offset?: number } | null;
  const ratingColor: Record<string, string> = { excellent: '#166534', good: '#1A6B3C', average: '#92400E', high: '#B45309', very_high: '#991B1B' };

  return (
    <div style={sectionCard}>
      <div style={sectionHeader}>
        <div style={{ color: T.navy }}><Icon.Globe /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Personal Carbon Footprint Audit</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>Calculate your annual CO₂ emissions based on lifestyle inputs</p>
        </div>
      </div>
      <div style={{ ...sectionBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.875rem' }}>
          {[
            { label: 'Daily Transport', key: 'transportMode', type: 'select', options: [['walk','Walk'],['cycle','Cycle'],['metro','Metro'],['bus','Bus'],['auto','Auto Rickshaw'],['bike','Motorcycle'],['car','Car']] },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <select style={{ ...inputStyle, appearance: 'none' }}
                value={(form as Record<string,unknown>)[f.key] as string}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              >
                {f.options?.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          ))}
          {[
            { label: 'Daily Distance (km)', key: 'distanceKm' },
            { label: 'Monthly Electricity (kWh)', key: 'electricityKwh' },
            { label: 'LPG Cylinders / Month', key: 'lpgCylinders' },
            { label: 'Meat Meals / Week', key: 'meatMealsPerWeek' },
            { label: 'Flights / Year', key: 'flightsPerYear' },
          ].map(f => (
            <div key={f.key}>
              <label style={labelStyle}>{f.label}</label>
              <input type="number" min={0} style={inputStyle}
                value={(form as Record<string,unknown>)[f.key] as number}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: +e.target.value }))}
                onFocus={e => (e.target.style.borderColor = T.navy)}
                onBlur={e => (e.target.style.borderColor = T.border)}
              />
            </div>
          ))}
        </div>

        <button style={primaryBtn(loading)} onClick={calc} disabled={loading}>
          {loading ? <><Spin /> Calculating...</> : 'Calculate Annual Footprint'}
        </button>

        {r && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Score panel */}
            <div style={{ background: T.navy, borderRadius: 6, padding: '1.25rem', textAlign: 'center' }}>
              <p style={{ fontSize: '0.7rem', fontWeight: 700, color: 'rgba(255,255,255,0.5)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 8 }}>Annual CO₂ Emissions</p>
              <p style={{ fontSize: '3.5rem', fontWeight: 800, color: ratingColor[r.rating || 'average'] || 'white', margin: 0, lineHeight: 1, letterSpacing: '-0.03em' }}>
                {(r.totalCO2 || 0).toLocaleString()}
              </p>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '0.875rem', margin: '4px 0 12px' }}>kg CO₂ per year</p>
              <span style={{
                display: 'inline-block', padding: '0.25rem 0.75rem',
                background: ratingColor[r.rating || 'average'] + '25',
                color: ratingColor[r.rating || 'average'] || 'white',
                border: `1px solid ${ratingColor[r.rating || 'average'] || 'white'}50`,
                borderRadius: 4, fontSize: '0.8125rem', fontWeight: 700, textTransform: 'capitalize',
              }}>{r.rating} footprint</span>
              <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.8125rem', marginTop: 8 }}>{r.comparison}</p>
            </div>

            {/* Breakdown */}
            {r.breakdown && Object.keys(r.breakdown).length > 0 && (
              <div style={{ border: `1px solid ${T.border}`, borderRadius: 6, overflow: 'hidden' }}>
                <div style={{ padding: '0.625rem 1rem', background: T.surface, borderBottom: `1px solid ${T.border}` }}>
                  <p style={{ fontWeight: 600, fontSize: '0.75rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Emissions Breakdown</p>
                </div>
                <div style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {Object.entries(r.breakdown).map(([k, v]) => (
                    <MetricBar key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={v} total={r.totalCO2 || 1} />
                  ))}
                </div>
              </div>
            )}

            {/* Tips */}
            {r.tips && r.tips.length > 0 && (
              <div style={{ padding: '1rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                <p style={{ fontWeight: 700, fontSize: '0.75rem', color: T.greenDark, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.625rem' }}>Reduction Recommendations</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {r.tips.map((tip, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: '#166534' }}>
                      <span style={{ flexShrink: 0, marginTop: 2 }}><Icon.ArrowRight /></span>{tip}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {r.trees_to_offset && (
              <div style={{ textAlign: 'center', padding: '0.75rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6, fontSize: '0.875rem', color: T.textMuted }}>
                Plant <strong style={{ color: T.textPrimary }}>{r.trees_to_offset}</strong> trees to fully offset your annual carbon footprint
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Notice Generator ──────────────────────────────────────────────────────────
function NoticeGenerator() {
  const [form, setForm] = useState({ noticeType: 'public_notice', topic: '', ward: '', details: '', language: 'english' });
  const [result, setResult] = useState<{ content?: string; reference?: string } | null>(null);
  const [loading, setLoading] = useState(false);

  const generate = async () => {
    if (!form.topic) { toast('Subject / topic is required.', 'error'); return; }
    setLoading(true);
    try { setResult(await api.ai.notice(form.noticeType, form.topic, form.ward, form.details, form.language) as typeof result); }
    catch { toast('Generation failed. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  return (
    <div style={sectionCard}>
      <div style={sectionHeader}>
        <div style={{ color: T.navy }}><Icon.FileText /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Official Notice Generator</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>Generate BBMP-grade notices, circulars, warning letters, and press releases instantly</p>
        </div>
      </div>
      <div style={{ ...sectionBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div>
            <label style={labelStyle}>Document Type</label>
            <select style={{ ...inputStyle, appearance: 'none' }} value={form.noticeType} onChange={e => setForm(f => ({ ...f, noticeType: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
              <option value="public_notice">Public Notice</option>
              <option value="circular">Office Circular</option>
              <option value="warning_letter">Warning Letter</option>
              <option value="awareness_campaign">Awareness Campaign</option>
              <option value="press_release">Press Release</option>
              <option value="social_media">Social Media Bulletin</option>
            </select>
          </div>
          <div>
            <label style={labelStyle}>Language</label>
            <select style={{ ...inputStyle, appearance: 'none' }} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
              onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
              <option value="english">English</option>
              <option value="hindi">Hindi</option>
              <option value="kannada">Kannada</option>
            </select>
          </div>
        </div>
        <div>
          <label style={labelStyle}>Subject / Topic <span style={{ color: T.danger }}>*</span></label>
          <input style={inputStyle} value={form.topic} onChange={e => setForm(f => ({ ...f, topic: e.target.value }))}
            placeholder="e.g. Prohibition of garbage burning in residential areas"
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)} />
        </div>
        <div>
          <label style={labelStyle}>Ward <span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, color: T.textMuted }}>(optional)</span></label>
          <input style={inputStyle} value={form.ward} onChange={e => setForm(f => ({ ...f, ward: e.target.value }))}
            placeholder="e.g. Koramangala, Whitefield"
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)} />
        </div>
        <div>
          <label style={labelStyle}>Additional Context</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical', lineHeight: 1.6 }} rows={3}
            value={form.details} onChange={e => setForm(f => ({ ...f, details: e.target.value }))}
            placeholder="Fine amounts, deadlines, contact details, specific regulations..."
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)} />
        </div>
        <button style={primaryBtn(loading || !form.topic)} onClick={generate} disabled={loading || !form.topic}>
          {loading ? <><Spin /> Generating...</> : 'Generate Document'}
        </button>

        {result && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: T.textMuted }}>REF: {result.reference}</span>
              <button
                style={{ ...outlineBtn, padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                onClick={() => { navigator.clipboard.writeText(result.content || ''); toast('Copied to clipboard.', 'success'); }}
              >
                <Icon.Copy /> Copy
              </button>
            </div>
            <div style={{
              padding: '1.25rem', background: T.surface,
              border: `1px solid ${T.border}`, borderRadius: 6,
              whiteSpace: 'pre-wrap', fontSize: '0.875rem',
              fontFamily: "'Courier New',monospace", lineHeight: 1.7, color: T.textPrimary,
            }}>
              {result.content}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Air Advisory (replaces AQI Horoscope) ────────────────────────────────────
function AirAdvisory({ aqi }: { aqi: number }) {
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchAdvisory = async () => {
    setLoading(true);
    try { setResult(await api.ai.horoscope(aqi) as Record<string, unknown>); }
    catch { toast('Failed to load advisory. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  React.useEffect(() => { fetchAdvisory(); }, []);

  const r = result as { title?: string; forecast?: string; outdoor_rating?: string; mask_tip?: string; best_time_outdoor?: string; exercise_tip?: string; weekly_trend?: string; eco_tip_of_day?: string } | null;

  return (
    <div style={sectionCard}>
      <div style={sectionHeader}>
        <div style={{ color: T.navy }}><Icon.Wind /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Daily Air Quality Advisory</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>AI-generated health and activity guidance based on current AQI ({aqi})</p>
        </div>
      </div>
      <div style={sectionBody}>
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 0', color: T.textMuted }}>
            <div style={{ width: 32, height: 32, border: `3px solid ${T.border}`, borderTopColor: T.navy, borderRadius: '50%', animation: 'spin 0.7s linear infinite', margin: '0 auto 12px' }} />
            <p style={{ fontSize: '0.875rem' }}>Loading advisory...</p>
          </div>
        ) : !r ? (
          <div style={{ textAlign: 'center', padding: '2rem 0' }}>
            <button style={{ ...outlineBtn, margin: '0 auto' }} onClick={fetchAdvisory}>Load Advisory</button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Headline */}
            <div style={{ padding: '1rem', background: T.navy, borderRadius: 6 }}>
              <p style={{ fontWeight: 700, fontSize: '1rem', color: 'white', margin: '0 0 4px' }}>{r.title}</p>
              <p style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.7)', margin: 0, lineHeight: 1.5 }}>{r.forecast}</p>
            </div>

            {/* Advisory grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '0.75rem' }}>
              {[
                { label: 'Outdoor Activity Rating', value: r.outdoor_rating },
                { label: 'Mask Recommendation',     value: r.mask_tip },
                { label: 'Best Time Outdoors',      value: r.best_time_outdoor },
                { label: 'Exercise Guidance',       value: r.exercise_tip },
                { label: '3-Day Air Trend',         value: r.weekly_trend },
              ].filter(item => item.value).map(item => (
                <div key={item.label} style={{ padding: '0.875rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}>
                  <p style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>{item.label}</p>
                  <p style={{ fontSize: '0.875rem', fontWeight: 600, color: T.textPrimary, margin: 0 }}>{item.value}</p>
                </div>
              ))}
            </div>

            {r.eco_tip_of_day && (
              <div style={{ padding: '0.875rem', background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: 6 }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, color: T.greenDark, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>Eco Action of the Day</p>
                <p style={{ fontSize: '0.875rem', color: '#166534', margin: 0, lineHeight: 1.5 }}>{r.eco_tip_of_day}</p>
              </div>
            )}

            <button style={{ ...outlineBtn, justifyContent: 'center', width: '100%' }} onClick={fetchAdvisory}>
              <Icon.RefreshCw /> Refresh Advisory
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Seasonal Forecast ─────────────────────────────────────────────────────────
function SeasonalForecast() {
  const [month, setMonth]   = useState(new Date().getMonth() + 1);
  const [result, setResult] = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchForecast = async () => {
    setLoading(true);
    try { setResult(await api.ai.seasonal(month) as Record<string, unknown>); }
    catch { toast('Forecast unavailable. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];
  const r = result as { aqi_prediction?: { average?: number; min?: number; max?: number }; green_cover_status?: string; waste_generation_trend?: string; main_concerns?: string[]; festival_impact?: string; weather_impact?: string; health_alert?: string; recommended_actions?: string[] } | null;

  return (
    <div style={sectionCard}>
      <div style={sectionHeader}>
        <div style={{ color: T.navy }}><Icon.Calendar /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Seasonal Pollution Forecast</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>AI prediction of pollution levels and environmental conditions by month</p>
        </div>
      </div>
      <div style={{ ...sectionBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <select style={{ ...inputStyle, flex: 1, appearance: 'none' }} value={month} onChange={e => setMonth(+e.target.value)}
            onFocus={e => (e.target.style.borderColor = T.navy)} onBlur={e => (e.target.style.borderColor = T.border)}>
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <button style={{ ...primaryBtn(loading), width: 'auto', padding: '0.5rem 1.25rem' }} onClick={fetchForecast} disabled={loading}>
            {loading ? <Spin /> : 'Predict'}
          </button>
        </div>

        {r && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* AQI summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '0.75rem' }}>
              {[
                { label: 'Avg AQI',      value: r.aqi_prediction?.average },
                { label: 'Green Cover',  value: r.green_cover_status },
                { label: 'Waste Trend',  value: r.waste_generation_trend },
              ].map(m => (
                <div key={m.label} style={{ textAlign: 'center', padding: '0.875rem', background: T.surface, border: `1px solid ${T.border}`, borderRadius: 6 }}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 800, color: T.navy, margin: 0, letterSpacing: '-0.02em' }}>{m.value}</p>
                  <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '4px 0 0', textTransform: 'capitalize' }}>{m.label}</p>
                </div>
              ))}
            </div>

            {/* Concerns */}
            {r.main_concerns && r.main_concerns.length > 0 && (
              <div style={{ padding: '0.875rem', border: `1px solid #FDE68A`, background: '#FFFBEB', borderRadius: 6 }}>
                <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Primary Concerns</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {r.main_concerns.map((c, i) => (
                    <span key={i} style={{ padding: '0.15rem 0.6rem', background: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A', borderRadius: 3, fontSize: '0.8125rem', fontWeight: 600 }}>{c}</span>
                  ))}
                </div>
              </div>
            )}

            {r.festival_impact && (
              <div style={{ padding: '0.875rem', border: `1px solid #DDE2EA`, background: T.surface, borderRadius: 6 }}>
                <p style={{ fontWeight: 700, fontSize: '0.75rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Festival / Event Impact</p>
                <p style={{ fontSize: '0.875rem', color: T.textPrimary, margin: 0, lineHeight: 1.5 }}>{r.festival_impact}</p>
              </div>
            )}
            {r.weather_impact && (
              <div style={{ padding: '0.875rem', border: '1px solid #BFDBFE', background: '#EFF6FF', borderRadius: 6 }}>
                <p style={{ fontWeight: 700, fontSize: '0.75rem', color: '#1E40AF', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Meteorological Impact</p>
                <p style={{ fontSize: '0.875rem', color: '#1E3A8A', margin: 0, lineHeight: 1.5 }}>{r.weather_impact}</p>
              </div>
            )}
            {r.health_alert && (
              <div style={{ padding: '0.875rem', border: '1px solid #FECACA', background: '#FFF5F5', borderRadius: 6 }}>
                <p style={{ fontWeight: 700, fontSize: '0.75rem', color: T.danger, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Health Advisory</p>
                <p style={{ fontSize: '0.875rem', color: '#7F1D1D', margin: 0, lineHeight: 1.5 }}>{r.health_alert}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── Cleanup Verifier ──────────────────────────────────────────────────────────
function CleanupVerifier() {
  const [before, setBefore]             = useState('');
  const [after, setAfter]               = useState('');
  const [beforePreview, setBeforePreview] = useState('');
  const [afterPreview, setAfterPreview]   = useState('');
  const [result, setResult]             = useState<Record<string, unknown> | null>(null);
  const [loading, setLoading]           = useState(false);
  const beforeRef = useRef<HTMLInputElement>(null);
  const afterRef  = useRef<HTMLInputElement>(null);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>, which: 'before' | 'after') => {
    const f = e.target.files?.[0]; if (!f) return;
    const b64 = await imageToBase64(f);
    if (which === 'before') { setBefore(b64); setBeforePreview(b64); }
    else { setAfter(b64); setAfterPreview(b64); }
  };

  const verify = async () => {
    if (!before || !after) { toast('Both images are required.', 'error'); return; }
    setLoading(true);
    try { setResult(await api.ai.verifyCleanup(before, after) as Record<string, unknown>); }
    catch { toast('Verification failed. Please try again.', 'error'); }
    finally { setLoading(false); }
  };

  const r = result as { verified?: boolean; message?: string; points_awarded?: number; before_description?: string; after_description?: string; changes_observed?: string[]; improvement_score?: number } | null;

  return (
    <div style={sectionCard}>
      <div style={sectionHeader}>
        <div style={{ color: T.navy }}><Icon.Camera /></div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0 }}>Cleanup Impact Verifier</p>
          <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: 0 }}>Upload before and after photos — AI assesses cleanup effectiveness and awards Karma</p>
        </div>
      </div>
      <div style={{ ...sectionBody, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.875rem' }}>
          <div>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>Before Photo</label>
            <UploadZone preview={beforePreview} label="Before Cleanup" onClick={() => beforeRef.current?.click()} />
            <input ref={beforeRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, 'before')} />
          </div>
          <div>
            <label style={{ ...labelStyle, marginBottom: '0.5rem' }}>After Photo</label>
            <UploadZone preview={afterPreview} label="After Cleanup" onClick={() => afterRef.current?.click()} />
            <input ref={afterRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleFile(e, 'after')} />
          </div>
        </div>

        <button style={primaryBtn(!before || !after || loading)} onClick={verify} disabled={!before || !after || loading}>
          {loading ? <><Spin /> Verifying...</> : 'Verify with AI'}
        </button>

        {r && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
            {/* Result banner */}
            <div style={{
              padding: '1.25rem', borderRadius: 6, textAlign: 'center',
              background: r.verified ? '#F0FDF4' : '#FFF5F5',
              border: `1px solid ${r.verified ? '#BBF7D0' : '#FECACA'}`,
            }}>
              <div style={{ width: 40, height: 40, borderRadius: '50%', margin: '0 auto 10px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: r.verified ? '#166534' : '#991B1B', color: 'white' }}>
                {r.verified ? <Icon.Check /> : <Icon.X />}
              </div>
              <p style={{ fontWeight: 800, fontSize: '1rem', color: r.verified ? '#166534' : '#991B1B', margin: '0 0 4px' }}>
                {r.verified ? 'Cleanup Verified' : 'Insufficient Improvement Detected'}
              </p>
              <p style={{ fontSize: '0.875rem', color: T.textMuted, margin: 0 }}>{r.message}</p>
              {r.verified && r.points_awarded && (
                <p style={{ fontWeight: 800, fontSize: '1.25rem', color: '#166534', marginTop: 8 }}>+{r.points_awarded} Karma Points Awarded</p>
              )}
            </div>

            {/* Before / After */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              {[{ label: 'Before', desc: r.before_description }, { label: 'After', desc: r.after_description }].map(p => (
                <div key={p.label} style={{ padding: '0.875rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}>
                  <p style={{ fontWeight: 700, fontSize: '0.75rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{p.label}</p>
                  <p style={{ fontSize: '0.8125rem', color: T.textPrimary, margin: 0, lineHeight: 1.5 }}>{p.desc}</p>
                </div>
              ))}
            </div>

            {/* Changes */}
            {r.changes_observed && r.changes_observed.length > 0 && (
              <div style={{ padding: '0.875rem', border: `1px solid ${T.border}`, borderRadius: 6 }}>
                <p style={{ fontWeight: 600, fontSize: '0.75rem', color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>Observed Changes</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
                  {r.changes_observed.map((c, i) => (
                    <div key={i} style={{ display: 'flex', gap: 8, fontSize: '0.875rem', color: T.textPrimary }}>
                      <span style={{ color: T.greenDark, flexShrink: 0 }}><Icon.Check /></span>{c}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {r.improvement_score !== undefined && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem', padding: '0.75rem', border: `1px solid ${T.border}`, borderRadius: 6, background: T.surface }}>
                <span style={{ fontSize: '0.875rem', color: T.textMuted, flexShrink: 0 }}>Improvement Score</span>
                <div style={{ flex: 1, height: 6, background: T.border, borderRadius: 3, overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${r.improvement_score}%`, background: T.navy, borderRadius: 3, transition: 'width 0.8s ease' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: '1.125rem', color: T.navy, flexShrink: 0 }}>{r.improvement_score}/100</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}