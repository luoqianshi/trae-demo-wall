interface ProgressProps {
  value: number
  max?: number
  className?: string
  barClassName?: string
  showLabel?: boolean
}

export function Progress({ value, max = 100, className, barClassName, showLabel = false }: ProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  
  return (
    <div className={`w-full ${className || ''}`}>
      <div className="h-2 bg-border-light rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] progress-animated-fill ${barClassName || 'bg-gradient-to-r from-ochre to-cinnabar'}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && (
        <div className="flex justify-between mt-1">
          <span className="text-xs text-ink-muted">{percentage.toFixed(0)}%</span>
          <span className="text-xs text-ink-muted">{value}/{max}</span>
        </div>
      )}
    </div>
  )
}

interface CircularProgressProps {
  value: number
  max?: number
  size?: number
  strokeWidth?: number
  className?: string
}

export function CircularProgress({ 
  value, 
  max = 100, 
  size = 120, 
  strokeWidth = 8,
  className 
}: CircularProgressProps) {
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100)
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className={`relative inline-flex items-center justify-center ${className || ''}`} style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--color-border)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#progressGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
        <defs>
          <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--color-ochre)" />
            <stop offset="100%" stopColor="var(--color-cinnabar)" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-ink">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  )
}
