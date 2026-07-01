import { useEffect, useState } from 'react'
import { AlertCircle, Clock, CheckCircle, GitBranch, Sparkles, Bot, User } from 'lucide-react'
import { workplaceService, type DecisionItem } from '../services/workplaceService'
import { runReviewPipeline, type ReviewResult, AGENTS } from '../lib/reviewPipeline'
import type { ReviewStep } from '../types'
import { chat } from '../lib/ai'

type LoadingState = 'idle' | 'loading-decisions' | 'loading-review'

const urgencyConfig = {
  high: { icon: AlertCircle, color: 'text-red-500', bg: 'bg-red-500/10', label: '紧急' },
  medium: { icon: Clock, color: 'text-amber-500', bg: 'bg-amber-500/10', label: '中等' },
  low: { icon: CheckCircle, color: 'text-green-500', bg: 'bg-green-500/10', label: '低' },
}

function formatStepContent(content: string): string {
  return content.trim()
}

function isPassedStep(step: ReviewStep): boolean {
  return step.verdict === 'pass' || step.verdict === undefined
}

export function DecisionAdvisorPanel() {
  const [decisions, setDecisions] = useState<DecisionItem[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>('loading-decisions')
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null)
  const [reviewError, setReviewError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    setLoadingState('loading-decisions')

    workplaceService
      .getPendingDecisions()
      .then((items) => {
        if (cancelled) return
        setDecisions(items)
      })
      .catch((err) => {
        if (cancelled) return
        console.error('[DecisionAdvisorPanel] getPendingDecisions failed:', err)
        setDecisions([])
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingState('idle')
        }
      })

    return () => {
      cancelled = true
    }
  }, [])

  const selectedDecision = decisions.find((d) => d.id === selectedId) ?? null

  useEffect(() => {
    if (!selectedDecision) {
      setReviewResult(null)
      setReviewError(null)
      return
    }

    let cancelled = false
    setLoadingState('loading-review')
    setReviewResult(null)
    setReviewError(null)

    const userRequest = `决策主题：${selectedDecision.topic}\n决策描述：${selectedDecision.description}\n相关人：${selectedDecision.stakeholders.join('、') || '无'}`

    runReviewPipeline(userRequest)
      .then((result) => {
        if (cancelled) return
        setReviewResult(result)
      })
      .catch((err) => {
        if (cancelled) return
        console.warn('[DecisionAdvisorPanel] runReviewPipeline failed, falling back to chat():', err)

        // Fallback: 使用 chat() 生成多角度建议
        return chat([
          {
            role: 'system',
            content: `你是决策参谋助手。请从多个角度（风险、关系、心理、可行性、批判性）分析以下决策，给出简洁可执行的建议。语气温暖，结构清晰。`,
          },
          {
            role: 'user',
            content: `请帮我分析这个决策：\n${userRequest}`,
          },
        ])
          .then((text) => {
            if (cancelled) return
            const fallbackResult: ReviewResult = {
              taskId: `fallback-${Date.now()}`,
              steps: [
                {
                  step: 1,
                  agentId: 'host',
                  agentName: '决策参谋',
                  action: 'final',
                  content: text,
                  verdict: 'pass',
                  metadata: { sources: [], confidence: 0.8, reasoning: 'chat fallback' },
                },
              ],
              finalDraft: text,
              totalTokens: Math.ceil(text.length / 2),
              revisionCount: 0,
            }
            setReviewResult(fallbackResult)
          })
          .catch((fallbackErr) => {
            if (cancelled) return
            console.error('[DecisionAdvisorPanel] fallback chat failed:', fallbackErr)
            setReviewError('决策建议生成失败，请稍后重试。')
          })
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingState('idle')
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedDecision])

  const isDecisionsLoading = loadingState === 'loading-decisions'
  const isReviewLoading = loadingState === 'loading-review'

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-full min-h-[400px]">
      {/* 左栏：决策列表 */}
      <div className="lg:col-span-1 flex flex-col gap-3 min-h-0">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-ink-secondary">待决策事项</span>
          <span className="text-2xs text-ink-tertiary">{decisions.length} 条</span>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pr-1">
          {isDecisionsLoading && (
            <>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="bg-surface border border-ink-muted/10 rounded-xl p-4 space-y-2"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-ink-muted/20 animate-pulse flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 w-2/3 rounded bg-ink-muted/20 animate-pulse" />
                      <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
                      <div className="h-3 w-1/2 rounded bg-ink-muted/20 animate-pulse" />
                    </div>
                  </div>
                </div>
              ))}
            </>
          )}

          {!isDecisionsLoading && decisions.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center bg-surface border border-ink-muted/10 rounded-xl">
              <div className="w-12 h-12 rounded-full bg-zen-indigo/10 flex items-center justify-center mb-3">
                <GitBranch className="w-6 h-6 text-zen-indigo" />
              </div>
              <p className="text-sm text-ink-secondary">暂无待决策事项</p>
              <p className="text-2xs text-ink-tertiary mt-1 max-w-xs px-4">
                在对话或日记中记录需要做出的决定，这里会自动识别并汇总
              </p>
            </div>
          )}

          {!isDecisionsLoading &&
            decisions.map((decision) => {
              const config = urgencyConfig[decision.urgency]
              const Icon = config.icon
              const isSelected = selectedId === decision.id

              return (
                <button
                  key={decision.id}
                  type="button"
                  onClick={() => setSelectedId(decision.id)}
                  className={`w-full text-left bg-surface border rounded-xl p-4 transition-all hover:shadow-sm ${
                    isSelected
                      ? 'border-zen-terracotta ring-1 ring-zen-terracotta/20'
                      : 'border-ink-muted/10'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${config.bg}`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="text-sm font-medium text-ink-primary truncate">
                          {decision.topic}
                        </h4>
                        <span
                          className={`text-2xs px-1.5 py-0.5 rounded-full ${config.bg} ${config.color}`}
                        >
                          {config.label}
                        </span>
                      </div>
                      <p className="text-xs text-ink-secondary line-clamp-2 leading-relaxed">
                        {decision.description || '暂无描述'}
                      </p>
                      {decision.stakeholders.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {decision.stakeholders.map((name) => (
                            <span
                              key={name}
                              className="inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full bg-canvas-warm text-ink-secondary"
                            >
                              <User className="w-3 h-3" />
                              {name}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </button>
              )
            })}
        </div>
      </div>

      {/* 右栏：审核结果 */}
      <div className="lg:col-span-2 flex flex-col min-h-0">
        {!selectedDecision && !isDecisionsLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-surface border border-ink-muted/10 rounded-xl">
            <Sparkles className="w-6 h-6 text-ink-muted mb-2" />
            <p className="text-sm text-ink-secondary">请选择左侧决策开始参谋</p>
            <p className="text-2xs text-ink-tertiary mt-1">
              点击任意待决策事项，调用多 Agent 审核管道生成建议
            </p>
          </div>
        )}

        {isReviewLoading && (
          <div className="flex-1 space-y-4 bg-surface border border-ink-muted/10 rounded-xl p-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
              <Bot className="w-3.5 h-3.5 text-zen-terracotta" />
              正在生成多 Agent 审核意见...
            </div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-2">
                <div className="h-4 w-1/4 rounded bg-ink-muted/20 animate-pulse" />
                <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
                <div className="h-3 w-2/3 rounded bg-ink-muted/20 animate-pulse" />
              </div>
            ))}
          </div>
        )}

        {reviewError && !isReviewLoading && (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-surface border border-ink-muted/10 rounded-xl">
            <AlertCircle className="w-6 h-6 text-zen-rose mb-2" />
            <p className="text-sm text-ink-secondary">{reviewError}</p>
          </div>
        )}

        {reviewResult && !isReviewLoading && (
          <div className="flex-1 overflow-y-auto bg-surface border border-ink-muted/10 rounded-xl p-5 space-y-5">
            <div className="flex items-center gap-1.5 text-xs font-medium text-ink-secondary">
              <Bot className="w-3.5 h-3.5 text-zen-terracotta" />
              多 Agent 审核结果
            </div>

            {/* 最终建议 */}
            <div className="bg-canvas-warm/50 rounded-xl p-4 border border-ink-muted/10">
              <h5 className="text-sm font-medium text-ink-primary mb-2">最终建议</h5>
              <div className="text-xs text-ink-secondary leading-relaxed whitespace-pre-wrap">
                {reviewResult.finalDraft}
              </div>
            </div>

            {/* 审核摘要 */}
            <div className="space-y-2">
              <h5 className="text-xs font-medium text-ink-secondary">审核过程摘要</h5>
              <div className="space-y-2">
                {reviewResult.steps.map((step) => {
                  const agent = AGENTS.find((a) => a.id === step.agentId)
                  const passed = isPassedStep(step)

                  return (
                    <div
                      key={`${step.step}-${step.agentId}`}
                      className="flex gap-3 text-xs border-l-2 border-ink-muted/20 pl-3 py-1"
                    >
                      <div
                        className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                          passed ? 'bg-zen-sage' : 'bg-zen-rose'
                        }`}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink-primary">
                            {agent?.name ?? step.agentName}
                          </span>
                          <span className="text-2xs text-ink-tertiary capitalize">
                            {step.action}
                          </span>
                        </div>
                        <p className="text-ink-secondary mt-0.5 line-clamp-3">
                          {formatStepContent(step.content)}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {/* 元信息 */}
            <div className="flex flex-wrap gap-3 text-2xs text-ink-tertiary pt-2 border-t border-ink-muted/10">
              <span>Token 估算：{reviewResult.totalTokens}</span>
              <span>修订轮次：{reviewResult.revisionCount}</span>
              <span>任务 ID：{reviewResult.taskId}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
