import React from 'react';
import { cn } from '@/lib/utils';

// ── Button ─────────────────────────────────────────────────────────────────
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'outline' | 'ghost' | 'destructive' | 'secondary';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'md', loading, children, disabled, ...props }, ref) => {
    const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95';
    const variants = {
      default: 'bg-primary text-primary-foreground hover:opacity-90 shadow-sm',
      outline: 'border border-primary text-primary hover:bg-accent',
      ghost: 'hover:bg-accent hover:text-accent-foreground',
      destructive: 'bg-destructive text-destructive-foreground hover:opacity-90',
      secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
    };
    const sizes = { sm: 'px-3 py-1.5 text-sm', md: 'px-4 py-2 text-sm', lg: 'px-6 py-3 text-base', icon: 'p-2' };
    return (
      <button ref={ref} disabled={disabled || loading} className={cn(base, variants[variant], sizes[size], className)} {...props}>
        {loading ? <span className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : null}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';

// ── Card ───────────────────────────────────────────────────────────────────
export const Card = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('bg-card text-card-foreground rounded-xl border shadow-sm', className)} {...props}>{children}</div>
);
export const CardHeader = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('flex flex-col space-y-1 p-5 pb-0', className)} {...props}>{children}</div>
);
export const CardTitle = ({ className, children, ...props }: React.HTMLAttributes<HTMLHeadingElement>) => (
  <h3 className={cn('text-lg font-semibold leading-tight', className)} {...props}>{children}</h3>
);
export const CardContent = ({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('p-5', className)} {...props}>{children}</div>
);

// ── Badge ──────────────────────────────────────────────────────────────────
interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple';
}
export const Badge = ({ className, variant = 'default', children, ...props }: BadgeProps) => {
  const variants = {
    default: 'bg-secondary text-secondary-foreground',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    purple: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
  };
  return (
    <span className={cn('inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-medium rounded-full', variants[variant], className)} {...props}>
      {children}
    </span>
  );
};

// ── Input ──────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input ref={ref} className={cn('flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors', className)} {...props} />
  )
);
Input.displayName = 'Input';

// ── Textarea ───────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn('flex min-h-[80px] w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50 transition-colors', className)} {...props} />
  )
);
Textarea.displayName = 'Textarea';

// ── Select ─────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
}
export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn('flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring disabled:cursor-not-allowed disabled:opacity-50', className)} {...props}>
      {children}
    </select>
  )
);
Select.displayName = 'Select';

// ── Skeleton ───────────────────────────────────────────────────────────────
export const Skeleton = ({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) => (
  <div className={cn('skeleton rounded-lg', className)} {...props} />
);

// ── Progress ───────────────────────────────────────────────────────────────
export const Progress = ({ value, className, color }: { value: number; className?: string; color?: string }) => (
  <div className={cn('w-full bg-muted rounded-full h-2 overflow-hidden', className)}>
    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, value)}%`, backgroundColor: color || 'hsl(var(--primary))' }} />
  </div>
);

// ── Spinner ────────────────────────────────────────────────────────────────
export const Spinner = ({ size = 'md', className }: { size?: 'sm'|'md'|'lg'; className?: string }) => {
  const s = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
  return <div className={cn('border-2 border-primary border-t-transparent rounded-full animate-spin', s[size], className)} />;
};

// ── Avatar ─────────────────────────────────────────────────────────────────
export const Avatar = ({ name, size = 'md', className }: { name?: string; size?: 'sm'|'md'|'lg'; className?: string }) => {
  const s = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-14 h-14 text-lg' };
  const letter = (name || 'U')[0].toUpperCase();
  const colors = ['bg-green-600', 'bg-blue-600', 'bg-purple-600', 'bg-orange-500', 'bg-pink-600'];
  const color = colors[letter.charCodeAt(0) % colors.length];
  return (
    <div className={cn('rounded-full flex items-center justify-center text-white font-bold flex-shrink-0', s[size], color, className)}>
      {letter}
    </div>
  );
};

// ── Modal ──────────────────────────────────────────────────────────────────
export const Modal = ({ open, onClose, title, children, size = 'md' }: {
  open: boolean; onClose: () => void; title?: string; children: React.ReactNode; size?: 'sm'|'md'|'lg'|'xl';
}) => {
  if (!open) return null;
  const sizes = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div className={cn('relative bg-card rounded-2xl shadow-2xl w-full max-h-[90vh] overflow-y-auto animate-fade-in', sizes[size])} onClick={e => e.stopPropagation()}>
        {title && (
          <div className="flex items-center justify-between p-5 border-b">
            <h2 className="text-lg font-semibold">{title}</h2>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-accent transition-colors text-muted-foreground">✕</button>
          </div>
        )}
        <div className="p-5">{children}</div>
      </div>
    </div>
  );
};

// ── Toast ──────────────────────────────────────────────────────────────────
type ToastType = 'success' | 'error' | 'info' | 'warning';
let toastFn: ((msg: string, type?: ToastType) => void) | null = null;
export const toast = (msg: string, type: ToastType = 'info') => toastFn?.(msg, type);

export const ToastProvider = () => {
  const [toasts, setToasts] = React.useState<{id:number;msg:string;type:ToastType}[]>([]);
  React.useEffect(() => {
    toastFn = (msg, type = 'info') => {
      const id = Date.now();
      setToasts(p => [...p, { id, msg, type }]);
      setTimeout(() => setToasts(p => p.filter(t => t.id !== id)), 3500);
    };
  }, []);
  const colors = { success: 'bg-green-600', error: 'bg-red-600', info: 'bg-blue-600', warning: 'bg-yellow-500' };
  const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={cn('flex items-center gap-3 px-4 py-3 rounded-xl text-white shadow-xl min-w-64 max-w-sm animate-fade-in pointer-events-auto', colors[t.type])}>
          <span className="font-bold">{icons[t.type]}</span>
          <span className="text-sm font-medium">{t.msg}</span>
        </div>
      ))}
    </div>
  );
};

// ── Label ──────────────────────────────────────────────────────────────────
export const Label = ({ className, children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn('text-sm font-medium leading-none text-foreground', className)} {...props}>{children}</label>
);

// ── Tabs ───────────────────────────────────────────────────────────────────
export const Tabs = ({ children, value, onChange, className }: {
  children: React.ReactNode; value: string; onChange: (v: string) => void; className?: string;
}) => <div className={className} data-value={value} data-onchange={onChange}>{children}</div>;

export const TabsList = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className={cn('inline-flex bg-muted rounded-lg p-1 gap-1', className)}>{children}</div>
);

export const TabsTrigger = ({ value, current, onClick, children, className }: {
  value: string; current: string; onClick: () => void; children: React.ReactNode; className?: string;
}) => (
  <button onClick={onClick} className={cn('px-4 py-2 rounded-md text-sm font-medium transition-all', value === current ? 'bg-background text-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground', className)}>
    {children}
  </button>
);

// ── StatCard ───────────────────────────────────────────────────────────────
export const StatCard = ({ title, value, subtitle, icon, color = 'green', trend }: {
  title: string; value: string | number; subtitle?: string; icon: string; color?: string; trend?: number;
}) => (
  <Card className="card-hover">
    <CardContent className="p-5">
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-muted-foreground font-medium truncate">{title}</p>
          <p className="text-2xl font-bold mt-1 text-foreground">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1 truncate">{subtitle}</p>}
          {trend !== undefined && (
            <p className={cn('text-xs font-medium mt-1', trend >= 0 ? 'text-green-600' : 'text-red-500')}>
              {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}% vs last week
            </p>
          )}
        </div>
        <div className={cn('w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0 ml-3', {
          'bg-green-100 dark:bg-green-900/30': color === 'green',
          'bg-blue-100 dark:bg-blue-900/30': color === 'blue',
          'bg-orange-100 dark:bg-orange-900/30': color === 'orange',
          'bg-red-100 dark:bg-red-900/30': color === 'red',
          'bg-purple-100 dark:bg-purple-900/30': color === 'purple',
        })}>
          {icon}
        </div>
      </div>
    </CardContent>
  </Card>
);
