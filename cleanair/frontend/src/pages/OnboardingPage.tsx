import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User as UserIcon, Landmark, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAppStore } from '@/store';
import { Button, Card, Select, toast } from '@/components/ui';
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
    return parts.join('; ') || 'Something went wrong. Please try again.';
  }
  return 'Something went wrong. Please try again.';
}

type Role = 'citizen' | 'authority' | 'admin';

// ── Wizard shell: a single "choose your role" screen ─────────────────────────
export default function OnboardingPage() {
  const navigate = useNavigate();
  const { user, setUser } = useAppStore();
  const [munis, setMunis] = useState<Municipality[]>([]);
  const [adminEligible, setAdminEligible] = useState(false);
  const [role, setRole] = useState<Role | null>(null);
  const [municipalityId, setMunicipalityId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.auth.municipalities().then(setMunis).catch(() => {});
    api.auth.adminEligible().then((r) => setAdminEligible(r.eligible)).catch(() => {});
  }, []);

  // Already onboarded or signed out — nothing to do here
  useEffect(() => {
    if (!user) navigate('/', { replace: true });
    else if (user.onboarded) navigate(user.role === 'authority' || user.role === 'admin' ? '/municipal' : '/', { replace: true });
  }, [user, navigate]);

  const options: { value: Role; icon: React.ReactNode; title: string; desc: string }[] = [
    {
      value: 'citizen', icon: <UserIcon size={26} />, title: 'Citizen',
      desc: 'Report pollution issues in your area and track them to resolution.',
    },
    {
      value: 'authority', icon: <Landmark size={26} />, title: 'Municipality',
      desc: 'View and resolve reports submitted by citizens in your municipality.',
    },
    ...(adminEligible ? [{
      value: 'admin' as Role, icon: <ShieldCheck size={26} />, title: 'Administrator',
      desc: 'Full oversight across every municipality.',
    }] : []),
  ];

  const ready = role === 'authority' ? !!municipalityId : !!role;

  const submit = async () => {
    if (!role) return;
    setSubmitting(true);
    try {
      const payload: OnboardPayload = { role };
      if (role === 'authority') payload.municipalityId = municipalityId;
      const res = await api.auth.onboard(payload);
      const fresh = await api.auth.me();
      setUser({ ...user!, ...fresh, role: (fresh.role as never) || 'citizen', onboarded: true });
      toast('Welcome to CleanAir!', 'success');
      navigate(res.role === 'authority' || res.role === 'admin' ? '/municipal' : '/', { replace: true });
    } catch (e: unknown) {
      toast(errorMessage(e), 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 0' }}>
      <Card style={{ width: '100%', maxWidth: 560, padding: '2.25rem 2rem', borderRadius: 10 }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 700, color: T.textPrimary, margin: 0, textAlign: 'center' }}>
          Welcome to CleanAir
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
                onClick={() => setRole(o.value)}
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

        {role === 'authority' && (
          <div style={{ marginTop: 20 }}>
            <label style={{ fontSize: '0.8125rem', fontWeight: 600, color: T.textPrimary, display: 'block', marginBottom: 6 }}>
              Your municipality
            </label>
            <Select value={municipalityId} onChange={(e) => setMunicipalityId(e.target.value)}>
              <option value="" disabled>Select your municipality</option>
              {munis.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </Select>
          </div>
        )}

        <Button size="lg" style={{ width: '100%', marginTop: 24 }} disabled={!ready} loading={submitting} onClick={submit}>
          Continue to Dashboard
        </Button>
      </Card>
    </div>
  );
}
