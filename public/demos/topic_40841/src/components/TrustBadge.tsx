import { ShieldCheck, AlertCircle, ShieldAlert } from 'lucide-react'
import type { TrustLevel } from '@/types'

interface Props {
  level: TrustLevel
  size?: 'sm' | 'md'
}

const config: Record<TrustLevel, { text: string; className: string; icon: typeof ShieldCheck }> = {
  verified: { text: '已核实', className: 'trust-badge--verified', icon: ShieldCheck },
  pending: { text: '待核实', className: 'trust-badge--pending', icon: AlertCircle },
  risk: { text: '有风险', className: 'trust-badge--risk', icon: ShieldAlert },
}

export default function TrustBadge({ level, size = 'sm' }: Props) {
  const c = config[level]
  const Icon = c.icon
  const sizeClass = size === 'md' ? 'trust-badge--md' : ''

  return (
    <span className={`trust-badge ${c.className} ${sizeClass}`}>
      <Icon size={size === 'md' ? 13 : 11} strokeWidth={2.2} />
      {c.text}
    </span>
  )
}
