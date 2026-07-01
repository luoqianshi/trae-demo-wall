/**
 * Agentic RAG 思考过程面板
 *
 * 企业级技术降维：DeepSeek-R1 / OpenAI o3 的 reasoning 展示 → 个人 AI 助手思考过程
 *
 * 在聊天界面中实时展示 AI 的检索规划、执行、评估、补充检索等步骤
 * 让用户看到 AI "是怎么想的"，而不是只看到一个加载动画
 */

import { useState, useEffect, useRef } from 'react'
import {
  Brain, Search, CheckCircle2, RefreshCw, Network,
  Sparkles, ChevronDown, ChevronUp, Clock, Loader2,
} from 'lucide-react'
import type { AgentStep, AgentStepType } from '../lib/agenticRAG'

// ─── 步骤图标映射 ──────────────────────────────────────────
const STEP_ICONS: Record<AgentStepType, typeof Brain> = {
  plan: Brain,
  retrieve: Search,
  evaluate: CheckCircle2,
  supplement: RefreshCw,
  graph_expand: Network,
  synthesize: Sparkles,
  done: CheckCircle2,
}

// ─── 步骤颜色映射 ──────────────────────────────────────────
const STEP_COLORS: Record<AgentStepType, { text: string; bg: string; border: string }> = {
  plan: { text: 'text-zen-indigo', bg: 'bg-zen-indigo/10', border: 'border-zen-indigo/30' },
  retrieve: { text: 'text-zen-sage', bg: 'bg-zen-sage/10', border: 'border-zen-sage/30' },
  evaluate: { text: 'text-zen-amber', bg: 'bg-zen-amber/10', border: 'border-zen-amber/30' },
  supplement: { text: 'text-zen-terracotta', bg: 'bg-zen-terracotta/10', border: 'border-zen-terracotta/30' },
  graph_expand: { text: 'text-zen-indigo', bg: 'bg-zen-indigo/10', border: 'border-zen-indigo/30' },
  synthesize: { text: 'text-zen-sage', bg: 'bg-zen-sage/10', border: 'border-zen-sage/30' },
  done: { text: 'text-zen-sage', bg: 'bg-zen-sage/10', border: 'border-zen-sage/30' },
}

const STEP_LABELS: Record<AgentStepType, string> = {
  plan: '规划',
  retrieve: '检索',
  evaluate: '评估',
  supplement: '补充检索',
  graph_expand: '图谱扩展',
  synthesize: '综合',
  done: '完成',
}

// ─── 组件 Props ─────────────────────────────────────────────
interface AgenticThinkingPanelProps {
  steps: AgentStep[]
  isRunning: boolean
  thoughtProcess?: string
  totalDuration?: number
  iterations?: number
}

// ─── 主组件 ─────────────────────────────────────────────────
export function AgenticThinkingPanel({
  steps,
  isRunning,
  thoughtProcess,
  totalDuration,
  iterations,
}: AgenticThinkingPanelProps) {
  const [expanded, setExpanded] = useState(true)
  const [showThoughts, setShowThoughts] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  // 新步骤出现时自动滚动到底部
  useEffect(() => {
    if (scrollRef.current && expanded) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [steps, expanded])

  // 运行中自动展开
  useEffect(() => {
    if (isRunning) setExpanded(true)
  }, [isRunning])

  if (steps.length === 0) return null

  const completedCount = steps.filter(s => s.status === 'completed').length
  const progress = isRunning ? Math.round((completedCount / Math.max(steps.length, 7)) * 100) : 100

  return (
    <div className="bg-surface border border-ink-muted/10 rounded-2xl rounded-bl-md overflow-hidden">
      {/* === 头部：标题 + 进度 === */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3.5 py-2.5 hover:bg-canvas-warm/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
            isRunning ? 'bg-zen-indigo/15' : 'bg-zen-sage/15'
          }`}>
            {isRunning ? (
              <Loader2 className="w-3.5 h-3.5 text-zen-indigo animate-spin" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-zen-sage" />
            )}
          </div>
          <div className="text-left">
            <span className="text-xs font-medium text-ink-primary">
              {isRunning ? '衡舟正在思考...' : '思考过程'}
            </span>
            <span className="text-2xs text-ink-tertiary ml-1.5">
              {completedCount}/{steps.length} 步
              {iterations && iterations > 1 && ` · ${iterations}轮迭代`}
              {totalDuration != null && ` · ${(totalDuration / 1000).toFixed(1)}s`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* 进度条 */}
          {isRunning && (
            <div className="w-16 h-1 rounded-full bg-ink-muted/15 overflow-hidden">
              <div
                className="h-full bg-zen-indigo rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
          {expanded ? (
            <ChevronUp className="w-3.5 h-3.5 text-ink-muted" />
          ) : (
            <ChevronDown className="w-3.5 h-3.5 text-ink-muted" />
          )}
        </div>
      </button>

      {/* === 步骤列表 === */}
      {expanded && (
        <div ref={scrollRef} className="max-h-[280px] overflow-y-auto px-3.5 pb-3 space-y-0">
          {/* 时间线 */}
          <div className="relative">
            {/* 竖线 */}
            <div className="absolute left-[11px] top-2 bottom-2 w-px bg-ink-muted/15" />

            {steps.map((step, idx) => {
              const Icon = STEP_ICONS[step.type] || Brain
              const colors = STEP_COLORS[step.type] || STEP_COLORS.plan
              const isLast = idx === steps.length - 1
              const isRunningStep = step.status === 'running'

              return (
                <div
                  key={idx}
                  className="relative pl-7 pb-2.5 last:pb-0"
                  style={{
                    animation: `agent-step-fadein 0.3s ease-out both`,
                    animationDelay: `${idx * 50}ms`,
                  }}
                >
                  {/* 节点 */}
                  <div
                    className={`absolute left-0 top-0.5 w-6 h-6 rounded-full flex items-center justify-center border ${colors.bg} ${colors.border}`}
                  >
                    {isRunningStep ? (
                      <Loader2 className={`w-3 h-3 ${colors.text} animate-spin`} />
                    ) : (
                      <Icon className={`w-3 h-3 ${colors.text}`} />
                    )}
                  </div>

                  {/* 内容 */}
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-2xs font-medium text-ink-secondary">
                        {STEP_LABELS[step.type]}
                      </span>
                      <span className="text-2xs text-ink-tertiary">·</span>
                      <span className="text-2xs text-ink-tertiary truncate">
                        {step.title}
                      </span>
                      {step.duration != null && step.duration > 0 && (
                        <span className="text-2xs text-ink-muted flex items-center gap-0.5 flex-shrink-0">
                          <Clock className="w-2.5 h-2.5" />
                          {(step.duration / 1000).toFixed(1)}s
                        </span>
                      )}
                    </div>

                    {/* 描述 */}
                    <p className="text-2xs text-ink-tertiary mt-0.5 leading-relaxed">
                      {step.description}
                    </p>

                    {/* 结果 */}
                    {step.result && (
                      <p className={`text-2xs mt-0.5 ${colors.text} font-medium`}>
                        → {step.result}
                      </p>
                    )}

                    {/* 详情列表 */}
                    {step.details && step.details.length > 0 && (
                      <ul className="mt-1 space-y-0.5">
                        {step.details.map((detail, i) => (
                          <li
                            key={i}
                            className="text-2xs text-ink-muted leading-relaxed pl-2 border-l border-ink-muted/10"
                          >
                            {detail}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* === 思考过程展开 === */}
          {thoughtProcess && !isRunning && (
            <div className="mt-2 pt-2 border-t border-ink-muted/10">
              <button
                onClick={() => setShowThoughts(!showThoughts)}
                className="flex items-center gap-1 text-2xs text-zen-indigo hover:text-zen-indigo/80 transition-colors"
              >
                <Brain className="w-3 h-3" />
                {showThoughts ? '收起思考过程' : '查看完整思考过程'}
                {showThoughts ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
              {showThoughts && (
                <pre className="mt-1.5 p-2.5 rounded-lg bg-canvas-warm text-2xs text-ink-secondary whitespace-pre-wrap leading-relaxed font-sans max-h-[200px] overflow-y-auto">
                  {thoughtProcess}
                </pre>
              )}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes agent-step-fadein {
          0% { opacity: 0; transform: translateX(-4px); }
          100% { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  )
}
