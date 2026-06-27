import { cn, getAQICategory, getAQIColor } from '@/lib/utils'

interface AQIBadgeProps {
  value: number
  size?: 'sm' | 'md' | 'lg' | 'xl'
  showLabel?: boolean
  className?: string
}

export function AQIBadge({ value, size = 'md', showLabel = true, className }: AQIBadgeProps) {
  const category = getAQICategory(value)
  const color = getAQIColor(value)

  const sizeStyles = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5 font-semibold',
    xl: 'text-2xl px-5 py-2 font-bold',
  }

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full font-medium',
        sizeStyles[size],
        className
      )}
      style={{ backgroundColor: color, color: value <= 100 && value > 50 ? '#111' : 'white' }}
      aria-label={`AQI ${value} - ${category}`}
    >
      <span className="font-mono">{value}</span>
      {showLabel && <span>{category}</span>}
    </span>
  )
}

interface AQIGaugeProps {
  value: number
  size?: number
  className?: string
}

export function AQIGauge({ value, size = 120, className }: AQIGaugeProps) {
  const color = getAQIColor(value)
  const category = getAQICategory(value)
  const pct = Math.min(100, (value / 500) * 100)
  const circumference = 2 * Math.PI * 45
  const dashOffset = circumference * (1 - pct / 100)

  return (
    <div className={cn('relative flex items-center justify-center', className)} style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox="0 0 100 100" className="-rotate-90">
        <circle cx="50" cy="50" r="45" fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
        <circle
          cx="50" cy="50" r="45"
          fill="none"
          stroke={color}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold font-mono" style={{ color }}>{value}</span>
        <span className="text-[10px] text-muted-foreground font-medium">{category}</span>
      </div>
    </div>
  )
}
