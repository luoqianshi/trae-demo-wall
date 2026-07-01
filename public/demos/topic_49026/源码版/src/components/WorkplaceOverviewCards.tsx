import { TrendingUp, Users, CheckSquare, GitBranch } from 'lucide-react'
import type { WorkplaceOverviewStats } from '../services/workplaceService'

interface WorkplaceOverviewCardsProps {
  stats: WorkplaceOverviewStats | null
  loading: boolean
}

export function WorkplaceOverviewCards({ stats, loading }: WorkplaceOverviewCardsProps) {
  const cards = [
    {
      label: '直属领导关系温度',
      value: stats?.leaderSentiment ?? 0,
      unit: '分',
      icon: TrendingUp,
      tone: 'text-zen-terracotta',
      bg: 'bg-zen-terracotta/10',
    },
    {
      label: '冷却人脉',
      value: stats?.coolConnectionsCount ?? 0,
      unit: '人',
      icon: Users,
      tone: 'text-zen-indigo',
      bg: 'bg-zen-indigo/10',
    },
    {
      label: '未闭环承诺',
      value: stats?.openCommitmentsCount ?? 0,
      unit: '项',
      icon: CheckSquare,
      tone: 'text-zen-amber',
      bg: 'bg-zen-amber/10',
    },
    {
      label: '待决策事项',
      value: stats?.pendingDecisionsCount ?? 0,
      unit: '项',
      icon: GitBranch,
      tone: 'text-zen-sage',
      bg: 'bg-zen-sage/10',
    },
  ]

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {cards.map((card) => (
        <div
          key={card.label}
          className="bg-surface border border-ink-muted/10 rounded-xl p-4 flex items-start gap-3"
        >
          <div className={`w-9 h-9 rounded-lg ${card.bg} flex items-center justify-center flex-shrink-0`}>
            <card.icon className={`w-4.5 h-4.5 ${card.tone}`} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-2xs text-ink-tertiary mb-1 truncate">{card.label}</p>
            {loading ? (
              <div className="h-6 w-16 rounded bg-ink-muted/20 animate-pulse" />
            ) : (
              <p className="text-lg font-semibold text-ink-primary">
                {card.value}
                <span className="text-xs font-normal text-ink-tertiary ml-1">{card.unit}</span>
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
