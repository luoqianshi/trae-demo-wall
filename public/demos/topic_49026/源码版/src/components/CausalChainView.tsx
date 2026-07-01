/**
 * 因果推理链可视化
 *
 * 企业级技术降维：IT 运维根因分析（RCA）→ 个人关系降温归因
 *
 * 展示关系温度变化的因果链：
 * - 时间线上的事件序列（正面/负面/中性）
 * - 根因事件高亮
 * - 转折点标记
 * - 累积分数曲线
 * - 修复建议
 */

import {
  AlertTriangle, Lightbulb, ArrowRight, TrendingDown,
  TrendingUp, Minus, Flag, Target,
} from 'lucide-react'
import type { CausalChain, TimelineNode, EventSentiment } from '../lib/causalChain'
import { warmthToColor, warmthLabel, warmthBgGradient } from '../lib/warmthColor'

// ─── 情绪样式 ───────────────────────────────────────────────
const SENTIMENT_STYLES: Record<EventSentiment, { color: string; bg: string; icon: typeof TrendingUp }> = {
  positive: { color: 'text-zen-sage', bg: 'bg-zen-sage/15', icon: TrendingUp },
  negative: { color: 'text-zen-rose', bg: 'bg-zen-rose/15', icon: TrendingDown },
  neutral: { color: 'text-ink-muted', bg: 'bg-ink-muted/10', icon: Minus },
}

// ─── 趋势标签 ───────────────────────────────────────────────
function TrendBadge({ trend }: { trend: 'rising' | 'falling' | 'stable' }) {
  if (trend === 'rising') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-zen-sage/15 text-zen-sage">
        <TrendingUp className="w-3 h-3" />
        温度上升
      </span>
    )
  }
  if (trend === 'falling') {
    return (
      <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-zen-rose/15 text-zen-rose">
        <TrendingDown className="w-3 h-3" />
        温度下降
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-ink-muted/10 text-ink-muted">
      <Minus className="w-3 h-3" />
      保持稳定
    </span>
  )
}

// ─── 时间线节点 ─────────────────────────────────────────────
function TimelineEvent({ node, index }: { node: TimelineNode; index: number }) {
  const style = SENTIMENT_STYLES[node.sentiment]
  const SentimentIcon = style.icon
  const temp = Math.max(0, Math.min(100, node.cumulativeScore))

  return (
    <div
      className="relative pl-7 pb-3 last:pb-0"
      style={{
        animation: `causal-fadein 0.4s ease-out ${index * 80}ms both`,
      }}
    >
      {/* 节点 */}
      <div
        className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center ${style.bg} ${
          node.isRootCause ? 'ring-2 ring-zen-rose/40' : node.isTurningPoint ? 'ring-2 ring-zen-amber/40' : ''
        }`}
      >
        <SentimentIcon className={`w-3 h-3 ${style.color}`} />
      </div>

      {/* 标签 */}
      {(node.isRootCause || node.isTurningPoint) && (
        <div className="flex items-center gap-1 mb-0.5">
          {node.isRootCause && (
            <span className="inline-flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded bg-zen-rose/15 text-zen-rose font-medium">
              <Target className="w-2.5 h-2.5" />
              根因
            </span>
          )}
          {node.isTurningPoint && (
            <span className="inline-flex items-center gap-0.5 text-2xs px-1.5 py-0.5 rounded bg-zen-amber/15 text-zen-amber font-medium">
              <Flag className="w-2.5 h-2.5" />
              转折点
            </span>
          )}
        </div>
      )}

      {/* 日期 + 事件 */}
      <div className="flex items-center gap-1.5 mb-0.5">
        <span className="text-2xs text-ink-muted">{node.date}</span>
        <span className="text-2xs text-ink-muted">·</span>
        <span
          className="text-2xs font-medium"
          style={{ color: warmthToColor(temp) }}
        >
          {warmthLabel(temp)}
        </span>
      </div>
      <p className="text-xs text-ink-secondary leading-relaxed">{node.event}</p>

      {/* 影响分数 */}
      <div className="flex items-center gap-1 mt-0.5">
        <span className="text-2xs text-ink-muted">影响</span>
        <span className={`text-2xs font-medium ${style.color}`}>
          {node.impact > 0 ? '+' : ''}{node.impact}
        </span>
      </div>
    </div>
  )
}

// ─── 主组件 ─────────────────────────────────────────────────
interface CausalChainViewProps {
  chain: CausalChain
}

export function CausalChainView({ chain }: CausalChainViewProps) {
  const currentTemp = Math.max(0, Math.min(100, chain.currentSentiment))
  const prevTemp = chain.previousSentiment != null
    ? Math.max(0, Math.min(100, chain.previousSentiment))
    : null

  return (
    <div className="space-y-3">
      {/* === 概要 === */}
      <div
        className="rounded-xl p-3 border border-ink-muted/10"
        style={{ background: warmthBgGradient(currentTemp, 0.35) }}
      >
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-ink-primary">{chain.personName}</span>
            <TrendBadge trend={chain.trend} />
          </div>
          <div className="flex items-center gap-1.5">
            {prevTemp != null && (
              <>
                <span
                  className="text-xs"
                  style={{ color: warmthToColor(prevTemp) }}
                >
                  {warmthLabel(prevTemp)}
                </span>
                <ArrowRight className="w-3 h-3 text-ink-muted" />
              </>
            )}
            <span
              className="text-sm font-medium"
              style={{ color: warmthToColor(currentTemp) }}
            >
              {warmthLabel(currentTemp)}
            </span>
          </div>
        </div>

        {/* 因果描述 */}
        <p className="text-xs text-ink-secondary leading-relaxed relative z-10">
          {chain.chainDescription}
        </p>
      </div>

      {/* === 因果时间线 === */}
      {chain.visualTimeline.length > 0 && (
        <div className="bg-surface border border-ink-muted/10 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-3">
            <AlertTriangle className="w-3.5 h-3.5 text-zen-amber" />
            <span className="text-xs font-medium text-ink-secondary">因果归因时间线</span>
          </div>

          <div className="relative">
            {/* 竖线 */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-muted/15" />
            {chain.visualTimeline.map((node, idx) => (
              <TimelineEvent key={idx} node={node} index={idx} />
            ))}
          </div>
        </div>
      )}

      {/* === 根因分析 === */}
      {chain.rootCause && (
        <div className="bg-zen-rose/5 border border-zen-rose/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Target className="w-3.5 h-3.5 text-zen-rose" />
            <span className="text-xs font-medium text-zen-rose">根因分析</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            <span className="text-ink-muted">{new Date(chain.rootCause.timestamp).toLocaleDateString('zh-CN')}</span>
            {' — '}
            {chain.rootCause.description}
          </p>
        </div>
      )}

      {/* === 修复建议 === */}
      {chain.recommendation && (
        <div className="bg-zen-sage/5 border border-zen-sage/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-zen-sage" />
            <span className="text-xs font-medium text-zen-sage">修复建议</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">{chain.recommendation}</p>
        </div>
      )}

      <style>{`
        @keyframes causal-fadein {
          0% { opacity: 0; transform: translateX(-4px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
