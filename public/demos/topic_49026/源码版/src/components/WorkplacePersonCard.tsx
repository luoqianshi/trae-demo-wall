import { TrendingUp, Clock, MessageSquare } from 'lucide-react'
import type { Person } from '../types'

interface WorkplacePersonCardProps {
  person: Person
  lastInteractionAt: number
  onClick?: () => void
}

const RELATIONSHIP_LABELS: Record<Person['relationship'], string> = {
  spouse: '伴侣',
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  leader: '领导',
  mentor: '导师',
  subordinate: '下属',
  client: '客户',
  rival: '对手',
  other: '其他',
}

function getDaysSince(timestamp: number): string {
  const days = Math.floor((Date.now() - timestamp) / (1000 * 60 * 60 * 24))
  if (days < 0) return '未来'
  if (days === 0) return '今天'
  if (days === 1) return '1天前'
  return `${days}天前`
}

function getSentimentTone(sentiment: number): string {
  if (sentiment >= 70) return 'text-zen-sage'
  if (sentiment >= 40) return 'text-zen-amber'
  if (sentiment >= 0) return 'text-zen-terracotta'
  return 'text-zen-rose'
}

export function WorkplacePersonCard({ person, lastInteractionAt, onClick }: WorkplacePersonCardProps) {
  const interactionCount = person.interactionStats?.totalCount ?? 0
  const sentiment = person.sentiment ?? 0

  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full text-left bg-surface border border-ink-muted/10 rounded-xl p-4 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-zen-terracotta/10 text-zen-terracotta flex items-center justify-center flex-shrink-0 text-sm font-medium">
          {person.name.charAt(0)}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2 mb-1">
            <h4 className="text-sm font-medium text-ink-primary truncate">{person.name}</h4>
            <span className="text-2xs px-1.5 py-0.5 rounded bg-canvas text-ink-tertiary flex-shrink-0">
              {RELATIONSHIP_LABELS[person.relationship]}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-2xs text-ink-tertiary">
            <span className={`flex items-center gap-1 ${getSentimentTone(sentiment)}`}>
              <TrendingUp className="w-3 h-3" />
              温度 {sentiment}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {getDaysSince(lastInteractionAt)}
            </span>
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {interactionCount} 次互动
            </span>
          </div>
        </div>
      </div>
    </button>
  )
}
