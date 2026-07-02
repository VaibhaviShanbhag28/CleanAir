import React from 'react';
import { cn } from '@/lib/utils';

const T = {
  navy:      '#0A2240',
  border:    '#DDE2EA',
  surface:   '#F5F7FA',
  textPrimary:'#0D1B2A',
  textMuted: '#4A5568',
  danger:    '#991B1B',
  greenDark: '#166534',
  card:      '#FFFFFF',
};

// ── Button ────────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, style, ...props }, ref) => {
    const base: React.CSSProperties = {
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
      fontWeight: 600, borderRadius: 4, cursor: disabled || loading ? 'not-allowed' : 'pointer',
      opacity: disabled || loading ? 0.55 : 1, transition: 'all 0.15s',
      fontFamily: "'DM Sans','Inter',sans-serif", border: 'none', letterSpacing: '0.01em',
    };
    const variants: Record<string, React.CSSProperties> = {
      default:     { background: T.navy, color: 'white' },
      outline:     { background: 'white', color: T.navy, border: `1.5px solid ${T.navy}` },
      ghost:       { background: 'transparent', color: T.textMuted },
      destructive: { background: T.danger, color: 'white' },
      secondary:   { background: T.surface, color: T.textPrimary, border: `1px solid ${T.border}` },
    };
    const sizes: Record<string, React.CSSProperties> = {
      sm:   { padding: '0.375rem 0.875rem', fontSize: '0.8125rem' },
      md:   { padding: '0.5rem 1.125rem',   fontSize: '0.875rem'  },
      lg:   { padding: '0.625rem 1.5rem',   fontSize: '0.9375rem' },
      icon: { padding: '0.5rem',            fontSize: '0.875rem', width: 34, height: 34 },
    };
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        style={{ ...base, ...variants[variant], ...sizes[size], ...style }}
        {...props}
      >
        {loading && <span style={{ width: 14, height: 14, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Card ──────────────────────────────────────────────────────────────────────
export const Card = ({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 6, ...style }}
    className={className}
    {...props}
  >{children}</div>
);
export const CardHeader = ({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={{ padding: '0.875rem 1.25rem', borderBottom: `1px solid ${T.border}`, ...style }} className={className} {...props}>{children}</div>
);
export const CardTitle = ({ className, children, style, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 style={{ fontWeight: 700, fontSize: '0.9375rem', color: T.textPrimary, margin: 0, ...style }} className={className} {...props}>{children}</h3>
);
export const CardContent = ({ className, children, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div style={{ padding: '1.25rem', ...style }} className={className} {...props}>{children}</div>
);

// ── Badge ─────────────────────────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}
export const Badge = ({ className, variant = 'default', children, style, ...props }: BadgeProps) => {
  const variants: Record<string, React.CSSProperties> = {
    default: { background: T.surface,   color: T.textMuted,  border: `1px solid ${T.border}` },
    success: { background: '#F0FDF4',   color: '#166534',    border: '1px solid #BBF7D0'     },
    warning: { background: '#FFFBEB',   color: '#92400E',    border: '1px solid #FDE68A'     },
    danger:  { background: '#FFF5F5',   color: '#991B1B',    border: '1px solid #FECACA'     },
    info:    { background: '#EFF6FF',   color: '#1E40AF',    border: '1px solid #BFDBFE'     },
    purple:  { background: '#F5F3FF',   color: '#6D28D9',    border: '1px solid #DDD6FE'     },
  };
  return (
    <span
      style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '0.125rem 0.5rem', borderRadius: 3, fontSize: '0.7rem', fontWeight: 700, letterSpacing: '0.03em', ...variants[variant], ...style }}
      className={className}
      {...props}
    >{children}</span>
  );
};

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1.5px solid ${T.border}`, borderRadius: 4, fontSize: '0.875rem', color: T.textPrimary, background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', transition: 'border-color 0.15s', ...style }}
      className={className}
      onFocus={e => { e.target.style.borderColor = T.navy; props.onFocus?.(e); }}
      onBlur={e => { e.target.style.borderColor = T.border; props.onBlur?.(e); }}
      {...props}
    />
  )
);
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, style, ...props }, ref) => (
    <textarea
      ref={ref}
      style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1.5px solid ${T.border}`, borderRadius: 4, fontSize: '0.875rem', color: T.textPrimary, background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', lineHeight: 1.6, resize: 'vertical', minHeight: 80, transition: 'border-color 0.15s', ...style }}
      className={className}
      onFocus={e => { e.target.style.borderColor = T.navy; props.onFocus?.(e); }}
      onBlur={e => { e.target.style.borderColor = T.border; props.onBlur?.(e); }}
      {...props}
    />
  )
);
Textarea.displayName = 'Textarea';

// ── Select ────────────────────────────────────────────────────────────────────
export const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, style, ...props }, ref) => (
    <select
      ref={ref}
      style={{ width: '100%', padding: '0.5rem 0.75rem', border: `1.5px solid ${T.border}`, borderRadius: 4, fontSize: '0.875rem', color: T.textPrimary, background: 'white', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', appearance: 'none', cursor: 'pointer', transition: 'border-color 0.15s', ...style }}
      className={className}
      onFocus={e => { e.target.style.borderColor = T.navy; props.onFocus?.(e); }}
      onBlur={e => { e.target.style.borderColor = T.border; props.onBlur?.(e); }}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// ── Skeleton ──────────────────────────────────────────────────────────────────
export const Skeleton = ({ className, style, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div
    style={{ background: 'linear-gradient(90deg,#f0f0f0 25%,#e4e4e4 50%,#f0f0f0 75%)', backgroundSize: '200% 100%', animation: 'shimmer 1.5s infinite', borderRadius: 6, ...style }}
    className={className}
    {...props}
  />
);

// ── Progress ──────────────────────────────────────────────────────────────────
export const Progress = ({ value, className, color, style }: { value: number; className?: string; color?: string; style?: React.CSSProperties }) => (
  <div style={{ width: '100%', height: 5, background: T.border, borderRadius: 3, overflow: 'hidden', ...style }} className={className}>
    <div style={{ height: '100%', width: `${Math.min(100, value)}%`, background: color || T.navy, borderRadius: 3, transition: 'width 0.6s ease' }} />
  </div>
);

// ── Spinner ───────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className }: { size?: 'sm'|'md'|'lg'; className?: string }) => {
  const dims: Record<string, React.CSSProperties> = { sm: { width: 14, height: 14 }, md: { width: 22, height: 22 }, lg: { width: 36, height: 36 } };
  return (
    <span style={{ display: 'inline-block', border: `2px solid ${T.border}`, borderTopColor: T.navy, borderRadius: '50%', animation: 'spin 0.7s linear infinite', ...dims[size] }} className={className} />
  );
};

// ── Avatar ────────────────────────────────────────────────────────────────────
export const Avatar = ({ name, size = 'md', className }: { name?: string; size?: 'sm'|'md'|'lg'; className?: string }) => {
  const dims: Record<string, React.CSSProperties> = { sm: { width: 28, height: 28, fontSize: '0.75rem' }, md: { width: 36, height: 36, fontSize: '0.875rem' }, lg: { width: 48, height: 48, fontSize: '1.125rem' } };
  const letter = (name || 'U')[0].toUpperCase();
  return (
    <div style={{ borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center', background: T.navy, color: 'white', fontWeight: 800, flexShrink: 0, ...dims[size] }} className={className}>
      {letter}
    </div>
  );
};

// ── Modal ─────────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl';
}) => {
  if (!open) return null;
  const maxWidths: Record<string, number> = { sm: 400, md: 500, lg: 720, xl: 960 };
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }} onClick={onClose}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }} />
      <div
        style={{ position: 'relative', background: T.card, borderRadius: 8, boxShadow: '0 24px 64px rgba(0,0,0,0.18)', width: '100%', maxWidth: maxWidths[size], maxHeight: '90vh', overflowY: 'auto', animation: 'modalIn 0.2s ease-out', fontFamily: "'DM Sans','Inter',sans-serif" }}
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem 1.25rem', borderBottom: `1px solid ${T.border}` }}>
            <h2 style={{ fontWeight: 700, fontSize: '1rem', color: T.textPrimary, margin: 0 }}>{title}</h2>
            <button onClick={onClose} style={{ width: 28, height: 28, borderRadius: 4, border: `1px solid ${T.border}`, background: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: T.textMuted, fontSize: '0.875rem' }}>✕</button>
          </div>
        )}
        <div style={{ padding: '1.25rem' }}>{children}</div>
      </div>
      <style>{`
        @keyframes modalIn { from { opacity:0; transform:translateY(12px) scale(0.97); } to { opacity:1; transform:none; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
      `}</style>
    </div>
  );
};

// ── Toast ─────────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';
let toastFn: ((msg: string, type?: ToastType) => void) | null = null;
export const toast = (msg: string, type: ToastType = 'info') => toastFn?.(msg, type);

export const ToastProvider = () => {
  const [toasts, setToasts] = React.useState<{ id: number; msg: string; type: ToastType }[]>([]);
  React.useEffect(() => {
    toastFn = (msg, type = 'info') => {
      const id = Date.now();
      setToasts(p => [...p, { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };
  }, []);
  const cfg: Record<ToastType, { bg: string; border: string; color: string; icon: string }> = {
    success: { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534', icon: '✓' },
    error:   { bg: '#FFF5F5', border: '#FECACA', color: '#991B1B', icon: '✕' },
    info:    { bg: '#EFF6FF', border: '#BFDBFE', color: '#1E40AF', icon: 'i' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E', icon: '!' },
  };
  return (
    <div style={{ position: 'fixed', bottom: 80, right: 16, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8, pointerEvents: 'none' }}>
      {toasts.map(t => {
        const c = cfg[t.type];
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '0.75rem 1rem', minWidth: 260, maxWidth: 380,
            background: c.bg, border: `1px solid ${c.border}`,
            borderLeft: `4px solid ${c.color}`,
            borderRadius: 6, boxShadow: '0 4px 16px rgba(0,0,0,0.1)',
            pointerEvents: 'auto', animation: 'modalIn 0.2s ease-out',
            fontFamily: "'DM Sans','Inter',sans-serif",
          }}>
            <span style={{ width: 20, height: 20, borderRadius: '50%', background: c.color, color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 800, flexShrink: 0 }}>{c.icon}</span>
            <span style={{ fontSize: '0.875rem', fontWeight: 600, color: c.color, flex: 1 }}>{t.msg}</span>
          </div>
        );
      })}
    </div>
  );
};

// ── Label ─────────────────────────────────────────────────────────────────────
export const Label = ({ className, children, style, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.75rem', color: T.textPrimary, textTransform: 'uppercase', letterSpacing: '0.05em', ...style }} className={className} {...props}>{children}</label>
);

// ── Tabs ──────────────────────────────────────────────────────────────────────
export const Tabs = ({ children, value, onChange, className }: { children: React.ReactNode; value: string; onChange: (v: string) => void; className?: string }) => (
  <div className={className}>{children}</div>
);
export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div style={{ display: 'flex', borderBottom: `1px solid ${T.border}` }} className={className}>{children}</div>
);
export const TabsTrigger = ({ value, current, onClick, children, className }: { value: string; current: string; onClick: () => void; children: React.ReactNode; className?: string }) => (
  <button
    onClick={onClick}
    style={{ padding: '0.5rem 1rem', border: 'none', borderBottom: value === current ? `2px solid ${T.navy}` : '2px solid transparent', background: 'transparent', color: value === current ? T.navy : T.textMuted, fontWeight: value === current ? 700 : 500, fontSize: '0.875rem', cursor: 'pointer', marginBottom: -1, transition: 'all 0.15s', fontFamily: 'inherit' }}
    className={className}
  >{children}</button>
);

// ── StatCard ──────────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, subtitle, icon, color = 'blue', trend }: {
  title: string; value: string | number; subtitle?: string; icon: string; color?: string; trend?: number;
}) => {
  const accentColors: Record<string, string> = { blue: '#1E40AF', green: '#166534', orange: '#B45309', red: '#991B1B', purple: '#6D28D9' };
  const accent = accentColors[color] ?? '#1E40AF';
  return (
    <div style={{ border: `1px solid ${T.border}`, borderTop: `3px solid ${accent}`, borderRadius: 6, padding: '1rem 1.125rem', background: T.card, transition: 'box-shadow 0.15s' }}
      onMouseEnter={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.07)')}
      onMouseLeave={e => (e.currentTarget.style.boxShadow = 'none')}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.7rem', fontWeight: 700, color: T.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' }}>{title}</p>
          <p style={{ fontSize: '1.625rem', fontWeight: 800, color: T.textPrimary, margin: 0, letterSpacing: '-0.02em', lineHeight: 1 }}>{value}</p>
          {subtitle && <p style={{ fontSize: '0.75rem', color: T.textMuted, margin: '4px 0 0' }}>{subtitle}</p>}
          {trend !== undefined && (
            <p style={{ fontSize: '0.75rem', fontWeight: 600, color: trend >= 0 ? '#166534' : '#991B1B', margin: '4px 0 0' }}>
              {trend >= 0 ? '+' : ''}{trend}% vs last week
            </p>
          )}
        </div>
        <div style={{ width: 36, height: 36, borderRadius: 6, background: accent + '14', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '1.125rem' }}>
          {icon}
        </div>
      </div>
    </div>
  );
};