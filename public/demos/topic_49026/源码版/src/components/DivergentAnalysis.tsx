import { useState, useCallback } from 'react'
import { Brain, Target, Sparkles } from 'lucide-react'
import { useConversationStore } from '../stores/useConversationStore'
import { runDivergentAnalysis, type AnalysisBranch } from '../lib/divergentAnalysis'
import { chat } from '../lib/ai'
import { track } from '../lib/analytics'
import { getModel } from '../lib/config'

export function DivergentAnalysis() {
  const messages = useConversationStore((s) => s.messages)
  const [combinedThought, setCombinedThought] = useState('')
  const [loading, setLoading] = useState(false)
  const [analyzedMsgId, setAnalyzedMsgId] = useState<string | null>(null)
  const [showDetails, setShowDetails] = useState(false)
  const [branches, setBranches] = useState<AnalysisBranch[]>([])

  const handleAnalyze = useCallback(async () => {
    const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
    if (!lastUserMsg || loading) return

    track.action('click_divergent_analysis')

    setLoading(true)
    setAnalyzedMsgId(lastUserMsg.id)
    setCombinedThought('')
    setShowDetails(false)

    const startTime = Date.now()
    let results: AnalysisBranch[] = []

    try {
      // 后台仍然并行分析4个角度
      results = await runDivergentAnalysis(lastUserMsg.content)
      setBranches(results)

      // 将4个角度整合成一段自然语言推理
      const allThoughts = results
        .map((b) => `【${b.agentName}（${b.perspective}角度）】\n${b.thoughts.join('\n')}`)
        .join('\n\n')

      const combinedResult = await chat([
        {
          role: 'system',
          content: '你是衡舟，用户的AI生活伴侣。请将下面多角度的分析思考整合为一段自然流畅的内心独白（150-200字）。要求：像一个人在自言自语地思考问题，不要分点、不要用标题、不要用"从X角度看"这样的表述。语气自然温暖。直接输出思考内容，不要加前缀。',
        },
        {
          role: 'user',
          content: `用户的问题被我从多个角度分析后，得到了这些思考要点：\n\n${allThoughts}\n\n请整合成一段自然的思考过程：`,
        },
      ], { temperature: 0.7, maxTokens: 400 })

      setCombinedThought(combinedResult.trim())
      track.llm('divergent_analysis', { model: getModel(), success: true }, Date.now() - startTime)
    } catch (e: any) {
      track.llm('divergent_analysis', { model: getModel(), success: false }, Date.now() - startTime)
      console.error('Divergent analysis error:', e)
      // 降级：直接用原始结果拼接
      if (results.length > 0) {
        const allThoughts = results.map((b) => b.thoughts.join('，')).join('。').slice(0, 300)
        setCombinedThought(allThoughts)
      }
    } finally {
      setLoading(false)
    }
  }, [messages, loading])

  const lastUserMsg = messages.filter((m) => m.role === 'user').pop()
  const isCurrentAnalyzed = !!lastUserMsg && analyzedMsgId === lastUserMsg.id

  if (!lastUserMsg) return null

  return (
    <div className="bg-gradient-to-br from-canvas to-zen-terracotta/[0.03] rounded-2xl border border-ink-muted/10 p-5 space-y-3">
      {!isCurrentAnalyzed && !loading && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-ink-tertiary">
            <Brain className="w-4 h-4 text-zen-terracotta" />
            <span>让衡舟多想想...</span>
          </div>
          <button
            onClick={handleAnalyze}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zen-terracotta/10 text-zen-terracotta text-xs font-medium hover:bg-zen-terracotta/20 transition-colors"
          >
            <Target className="w-3.5 h-3.5" />
            从多个角度想想
          </button>
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-3 py-2">
          <div className="flex gap-1">
            <span className="w-2 h-2 rounded-full bg-zen-terracotta/60 animate-bounce" style={{ animationDelay: '0ms' }} />
            <span className="w-2 h-2 rounded-full bg-zen-terracotta/60 animate-bounce" style={{ animationDelay: '150ms' }} />
            <span className="w-2 h-2 rounded-full bg-zen-terracotta/60 animate-bounce" style={{ animationDelay: '300ms' }} />
          </div>
          <span className="text-sm text-ink-tertiary animate-pulse">衡舟正在从多个角度思考...</span>
        </div>
      )}

      {isCurrentAnalyzed && !loading && combinedThought && (
        <div className="space-y-3">
          {/* 思考气泡 - 仿内心独白风格 */}
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-zen-terracotta/10 text-zen-terracotta text-xs">
              💭
            </div>
            <div className="flex-1">
              <div className="text-xs text-ink-tertiary mb-1.5 font-medium">衡舟在想...</div>
              <div className="bg-canvas border border-ink-muted/10 rounded-2xl rounded-tl-sm px-4 py-3 text-sm text-ink-secondary leading-relaxed italic">
                "{combinedThought}"
              </div>
            </div>
          </div>

          {/* 查看详细分析/重新分析 */}
          <div className="flex items-center justify-center gap-3 pt-1">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="text-xs text-ink-tertiary hover:text-ink-secondary transition-colors flex items-center gap-1"
            >
              <Sparkles className="w-3 h-3" />
              {showDetails ? '收起详细分析' : '查看详细分析'}
            </button>
            <button
              onClick={handleAnalyze}
              className="text-xs text-ink-tertiary hover:text-ink-secondary transition-colors"
            >
              重新想想
            </button>
          </div>

          {/* 展开的详细分析（默认为收起） */}
          {showDetails && (
            <div className="space-y-2 pt-1 border-t border-ink-muted/10">
              {branches.map((branch) => (
                <div key={branch.id} className="flex items-start gap-2 px-3 py-2 rounded-lg bg-canvas/50">
                  <span className="text-sm flex-shrink-0">{branch.agentIcon}</span>
                  <div>
                    <span className="text-xs font-medium text-ink-tertiary">{branch.agentName} </span>
                    <span className="text-xs text-ink-muted">({branch.perspective})</span>
                    <p className="text-xs text-ink-secondary mt-0.5">{branch.thoughts.join('，')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}