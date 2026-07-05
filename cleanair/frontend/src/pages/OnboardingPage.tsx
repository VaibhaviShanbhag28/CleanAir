import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Landmark, ShieldCheck, ChevronLeft, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Button, Card, Input, Label, Select, toast } from '@/components/ui';
import type { Municipality, OnboardPayload } from '@/types';

const T = {
  navy: '#0A2240', border: '#DDE2EA', surface: '#F5F7FA',
  textPrimary: '#0D1B2A', textMuted: '#4A5568', green: '#166534',
};

/**
 * FastAPI sends `detail` as a plain string for our own HTTPExceptions, but as
 * an array of {type, loc, msg, ...} objects for raw Pydantic body-validation
 * errors -- passing either shape straight into a JSX text node crashes React
 * ("Objects are not valid as a React child"), so normalise to a string here.
 */
function errorMessage(e: unknown): string {
  const detail = (e as { detail?: unknown })?.detail;
  if (typeof detail === 'string') return detail;
  if (Array.isArray(detail)) {
    const parts = detail.map((d) => {
      if (typeof d === 'string') return d;
      if (d && typeof d === 'object' && 'msg' in d) return String((d as { msg: unknown }).msg);
      return '';
    }).filter(Boolean);
    return parts.join('; ') || 'Verification failed. Please check your details.';
  }
  return 'Verification failed. Please check your details.';
}

type Role = 'citizen' | 'authority' | 'admin';

// ── Step 1: "Continue as" role cards ─────────────────────────────────────────
function RoleSelect({ role, onSelect, onNext, adminEligible }: {
  role: Role | null; onSelect: (r: Role) => void; onNext: () => void; adminEligible: boolean;
}) {
  const options: { value: Role; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      value: 'citizen', icon: <UserIcon size={26} />, title: 'Citizen',
      desc: 'Report garbage, drainage, and pollution issues in your area and track them to resolution.',
    },
    {
      value: 'authority', icon: <Landmark size={26} />, title: 'Municipality Official',
      desc: 'Manage assigned reports, log work progress, and resolve citizen complaints.',
    },
    ...(adminEligible ? [{
      value: 'admin' as Role, icon: <ShieldCheck size={26} />, title: 'Administrator',
      desc: 'Full platform oversight across every municipality. Restricted to authorised accounts.',
    }] : []),
  ];
  return (
    <div>
      <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: T.textPrimary, margin: 0, textAlign: 'center' }}>
        Continue as
      </h1>
      <p style={{ color: T.textMuted, fontSize: '0.875rem', textAlign: 'center', marginTop: 6, marginBottom: 28 }}>
        Choose how you'll use CleanAir. This cannot be changed later.
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
        {options.map((o) => {
          const selected = role === o.value;
          return (
            <button
              key={o.value}
              onClick={() => onSelect(o.value)}
              style={{
                textAlign: 'left', cursor: 'pointer', background: 'white',
                border: selected ? `2px solid ${T.navy}` : `1.5px solid ${T.border}`,
                borderRadius: 8, padding: '1.5rem 1.25rem', transition: 'all 0.15s',
                boxShadow: selected ? '0 4px 14px rgba(10,34,64,0.12)' : 'none',
                transform: selected ? 'translateY(-2px)' : 'none', fontFamily: 'inherit',
              }}
            >
              <div style={{
                width: 48, height: 48, borderRadius: 8, display: 'flex', alignItems: 'center',
                justifyContent: 'center', marginBottom: 14,
                background: selected ? T.navy : T.surface, color: selected ? 'white' : T.navy,
                transition: 'all 0.15s',
              }}>{o.icon}</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, display: 'flex', alignItems: 'center', gap: 8 }}>
                {o.title}
                {selected && <CheckCircle2 size={16} color={T.green} />}
              </div>
              <div style={{ fontSize: '0.8125rem', color: T.textMuted, marginTop: 6, lineHeight: 1.5 }}>{o.desc}</div>
            </button>
          );
        })}
      </div>
      <Button size="lg" style={{ width: '100%', marginTop: 24 }} disabled={!role} onClick={onNext}>
        Continue
      </Button>
    </div>
  );
}

// ── Step 2: Aadhaar verification ─────────────────────────────────────────────
function AadhaarStep({ form, setForm, onBack, onNext, submitting }: {
  form: OnboardPayload; setForm: (f: OnboardPayload) => void; onBack: () => void; onNext: () => void;
  submitting: boolean;
}) {
  const digits = form.aadhaarNumber.replace(/\D/g, '');
  const formatted = digits.replace(/(\d{4})(?=\d)/g, '$1 ').trim();
  const numberOk = digits.length === 12 && !['0', '1'].includes(digits[0]);
  const nameOk = form.fullName.trim().length >= 3;

  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: T.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={22} color={T.green} /> Identity Verification
      </h1>
      <p style={{ color: T.textMuted, fontSize: '0.8125rem', marginTop: 6, marginBottom: 24, lineHeight: 1.5 }}>
        Verify your identity with Aadhaar. Your Aadhaar number is never stored — only a
        secure fingerprint of it is kept.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Label>Aadhaar Number</Label>
          <Input
            inputMode="numeric" placeholder="XXXX XXXX XXXX" value={formatted} maxLength={14}
            onChange={(e) => setForm({ ...form, aadhaarNumber: e.target.value.replace(/\D/g, '').slice(0, 12) })}
          />
          {digits.length === 12 && !numberOk && (
            <div style={{ color: '#991B1B', fontSize: '0.75rem', marginTop: 4 }}>
              Aadhaar numbers never start with 0 or 1
            </div>
          )}
        </div>
        <div>
          <Label>Full Name (as on Aadhaar)</Label>
          <Input
            placeholder="e.g. Rajesh Kumar" value={form.fullName}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
          <div style={{ color: T.textMuted, fontSize: '0.75rem', marginTop: 4 }}>
            Must match the name on your account
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Button variant="secondary" size="lg" onClick={onBack} style={{ flex: '0 0 auto' }}>
          <ChevronLeft size={16} /> Back
        </Button>
        <Button size="lg" style={{ flex: 1 }} disabled={!numberOk || !nameOk} loading={submitting} onClick={onNext}>
          {form.role === 'authority' ? 'Continue' : 'Verify & Finish'}
        </Button>
      </div>
    </div>
  );
}

// ── Step 3 (officials only): department details ──────────────────────────────
function OfficialStep({ form, setForm, munis, onBack, onSubmit, submitting }: {
  form: OnboardPayload; setForm: (f: OnboardPayload) => void; munis: Municipality[];
  onBack: () => void; onSubmit: () => void; submitting: boolean;
}) {
  const muni = munis.find((m) => m.id === form.municipalityId);
  const ready = form.municipalityId && form.departmentId && (form.designation || '').trim().length >= 3;
  return (
    <div>
      <h1 style={{ fontSize: '1.375rem', fontWeight: 700, color: T.textPrimary, margin: 0, display: 'flex', alignItems: 'center', gap: 10 }}>
        <Landmark size={22} color={T.navy} /> Official Details
      </h1>
      <p style={{ color: T.textMuted, fontSize: '0.8125rem', marginTop: 6, marginBottom: 24 }}>
        These details appear on every complaint you work on and on completion certificates.
      </p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <Label>Municipality</Label>
          <Select
            value={form.municipalityId || ''}
            onChange={(e) => setForm({ ...form, municipalityId: e.target.value, departmentId: undefined })}
          >
            <option value="" disabled>Select your municipality</option>
            {munis.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Department</Label>
          <Select
            value={form.departmentId || ''} disabled={!muni}
            onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
          >
            <option value="" disabled>Select your department</option>
            {(muni?.departments || []).map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
          </Select>
        </div>
        <div>
          <Label>Designation</Label>
          <Input
            placeholder="e.g. Sanitation Inspector" value={form.designation || ''}
            onChange={(e) => setForm({ ...form, designation: e.target.value })}
          />
        </div>
        <div>
          <Label>Employee ID <span style={{ color: T.textMuted, fontWeight: 400 }}>(optional)</span></Label>
          <Input
            placeholder="e.g. BBMP-4521" value={form.employeeId || ''}
            onChange={(e) => setForm({ ...form, employeeId: e.target.value })}
          />
        </div>
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <Button variant="secondary" size="lg" onClick={onBack} style={{ flex: '0 0 auto' }}>
          <ChevronLeft size={16} /> Back
        </Button>
        <Button size="lg" style={{ flex: 1 }} disabled={!ready} loading={submitting} onClick={onSubmit}>
          Verify & Finish
        </Button>
      </div>
    </div>
  );
}

// ── Wizard shell ──────────────────────────────────────────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  const [step, setStep] = useState(0);
  const [munis, setMunis] = useState<Municipality[]>([]);
  const [adminEligible, setAdminEligible] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState<OnboardPayload>({
    role: 'citizen', aadhaarNumber: '', fullName: user?.displayName || '',
  });

  const totalSteps = form.role === 'authority' ? 3 : 2;

  useEffect(() => {
    api.auth.municipalities().then(setMunis).catch(() => {});
    api.auth.adminEligible().then((r) => setAdminEligible(r.eligible)).catch(() => {});
  }, []);

  // Already onboarded or signed out — nothing to do here
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
    else if (user.onboarded) navigate(user.role === 'authority' || user.role === 'admin' ? '/municipal' : '/', { replace: true });
  }, [user, navigate]);

  const submit = async () => {
    setSubmitting(true);
    try {
      const res = await api.auth.onboard(form);
      const fresh = await api.auth.me();
      setUser({ ...user!, ...fresh, role: (fresh.role as never) || 'citizen', onboarded: true });
      toast(`Welcome${res.verifiedName ? ', ' + res.verifiedName.split(' ')[0] : ''}! Identity verified.`, 'success');
      navigate(res.role === 'authority' || res.role === 'admin' ? '/municipal' : '/', { replace: true });
    } catch (e: unknown) {
      toast(errorMessage(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const stepDots = useMemo(() => (
    <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 28 }}>
      {Array.from({ length: totalSteps }).map((_, i) => (
        <div key={i} style={{
          width: i === step ? 22 : 8, height: 8, borderRadius: 4,
          background: i <= step ? T.navy : T.border, transition: 'all 0.25s',
        }} />
      ))}
    </div>
  ), [step, totalSteps]);

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <Card style={{ width: '100%', maxWidth: 560, padding: '2.25rem 2rem', borderRadius: 10 }}>
        {stepDots}
        {step === 0 && (
          <RoleSelect
            role={form.role}
            onSelect={(role) => setForm({ ...form, role })}
            onNext={() => setStep(1)}
            adminEligible={adminEligible}
          />
        )}
        {step === 1 && (
          <AadhaarStep
            form={form} setForm={setForm} submitting={submitting}
            onBack={() => setStep(0)}
            onNext={() => (form.role === 'authority' ? setStep(2) : submit())}
          />
        )}
        {step === 2 && form.role === 'authority' && (
          <OfficialStep
            form={form} setForm={setForm} munis={munis}
            onBack={() => setStep(1)} onSubmit={submit} submitting={submitting}
          />
        )}
      </Card>
    </div>
  );
}
