import { useCountUp } from '@/utils/useCountUp'

interface Props {
  score: number
  size?: number
}

export default function TrustScoreRing({ score, size = 80 }: Props) {
  const animatedScore = useCountUp(score, 1200)
  const strokeW = size >= 80 ? 5 : 4
  const radius = (size - strokeW * 2) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (animatedScore / 100) * circumference

  const isHigh = score >= 80
  const isMid = score >= 50 && !isHigh
  const color = isHigh ? '#00A870' : isMid ? '#D97706' : '#DC2626'
  const gradId = `trust-grad-${isHigh ? 'high' : isMid ? 'mid' : 'low'}`

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={isHigh ? '#00A870' : isMid ? '#F59E0B' : '#EF4444'} />
            <stop offset="100%" stopColor={isHigh ? '#34D399' : isMid ? '#FBBF24' : '#F87171'} />
          </linearGradient>
          {isHigh && (
            <filter id={`glow-${gradId}`}>
              <feGaussianBlur stdDeviation="2" result="coloredBlur" />
              <feMerge>
                <feMergeNode in="coloredBlur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          )}
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="var(--border-subtle)"
          strokeWidth={strokeW}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradId})`}
          strokeWidth={strokeW}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          filter={isHigh ? `url(#glow-${gradId})` : undefined}
          style={{ transition: 'stroke-dashoffset 0.1s linear' }}
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span
          className="font-bold tabular-nums"
          style={{
            color,
            fontSize: size >= 80 ? 24 : 18,
            lineHeight: 1,
            letterSpacing: '-0.03em',
          }}
        >
          {animatedScore}
        </span>
        <span
          className="mt-0.5 font-medium"
          style={{ color: 'var(--text-muted)', fontSize: size >= 80 ? 10 : 9 }}
        >
          可信分
        </span>
      </div>
    </div>
  )
}
