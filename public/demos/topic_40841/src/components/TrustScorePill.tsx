interface Props {
  score: number
  size?: 'sm' | 'md'
}

function tier(score: number) {
  if (score >= 80) return 'high'
  if (score >= 50) return 'mid'
  return 'low'
}

export default function TrustScorePill({ score, size = 'sm' }: Props) {
  const t = tier(score)
  const sizeClass = size === 'md' ? 'trust-score-pill--md' : ''

  return (
    <div className={`trust-score-pill trust-score-pill--${t} ${sizeClass}`}>
      <span className="trust-score-pill__num">{score}</span>
      <span className="trust-score-pill__unit">分</span>
    </div>
  )
}
