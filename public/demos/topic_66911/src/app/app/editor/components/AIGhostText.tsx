'use client'

import { Plugin, PluginKey, EditorState, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'

/* ========== Imports ========== */
import { getAIConfig } from '../../../../lib/editor-api'

/* ========== Types ========== */
interface GhostState {
  suggestion: string | null
  from: number
  decorationId: string | null
  loading: boolean
  candidates: string[]
  candidateIndex: number
}

export interface GhostPluginOptions {
  enabled: boolean
  persona: WritingPersona
}

export type WritingPersona = 'academic' | 'general' | 'admin'

/* ========== Sentence-ending punctuation (triggers after these) ========== */
const SENTENCE_END = /[。！？.!?]$/

/* ========== List markers (triggers after these) ========== */
const LIST_START = /^(\d+[.、)] |[-·•] )/

/* ========== Plugin Key ========== */
export const ghostTextPluginKey = new PluginKey<GhostState>('ai-ghost-text')

/* ========== System Prompts by Persona ========== */
const PERSONA_PROMPTS: Record<WritingPersona, string> = {
  academic: `你是一个学术论文写作智能补全引擎。基于前文语境，预测用户接下来会写什么，给出精确的1-3句续写。
- 风格: 正式、逻辑严密、符合学术规范，与前文浑然一体
- 禁止: 复述前文、解释说明、输出"以下是续写"等废话
- 只输出续写文本本身，不带引号前缀，不带换行
- 示例输入"研究表明" → 输出"人工智能在医疗领域的应用前景广阔，特别是在影像诊断和药物研发方面。"`,

  general: `你是一个智能写作补全引擎。基于前文预测用户接下来会写什么，给出1-2句自然续写。
- 风格: 通顺自然，与前文风格一致
- 禁止: 重复前文、输出解释
- 只输出续写文本`,

  admin: `你是一个公文写作补全引擎。基于前文预测规范公文的下一句，给出1-2句续写。
- 风格: 严谨规范、条理清晰，符合公文措辞
- 禁止: 输出解释、偏离主题
- 只输出续写文本`,
}

/* ========== Get context before cursor ========== */
function getContextBeforeCursor(state: EditorState, maxChars = 1200): { text: string; position: number } {
  const { $from } = state.selection
  const start = Math.max(0, $from.pos - maxChars)
  return {
    text: state.doc.textBetween(start, $from.pos, '\n'),
    position: $from.pos,
  }
}

/* ========== Determine debounce timing by trigger reason ========== */
type TriggerReason = 'sentence_end' | 'newline' | 'list_start' | 'continuous' | 'manual'

function getDebounceForTrigger(reason: TriggerReason): number {
  switch (reason) {
    case 'sentence_end': return 800   // 句子结束 → 稍等
    case 'newline': return 1000  // 新段落 → 更长等待
    case 'list_start': return 800   // 列举开始 → 稍等
    case 'continuous': return 1500  // 连续输入 → 大幅延迟
    case 'manual': return 0     // 手动 → 立即
  }
}

function classifyTrigger(text: string): TriggerReason {
  if (SENTENCE_END.test(text.trimEnd())) return 'sentence_end'
  if (text.endsWith('\n') || text.endsWith('\n\n')) return 'newline'
  // Check if last line looks like a list item start
  const lastLine = text.split('\n').pop() || ''
  if (LIST_START.test(lastLine) || /^\d+[.、)]$/.test(lastLine.trim())) return 'list_start'
  return 'continuous'
}

/* ========== Fetch AI completion stream ========== */
async function fetchGhostCompletion(
  context: string,
  persona: WritingPersona,
  abortSignal: AbortSignal,
): Promise<string[]> {
  const config = getAIConfig()
  if (!config) return []

  const systemPrompt = PERSONA_PROMPTS[persona]

  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-ai-config': JSON.stringify(config) },
      body: JSON.stringify({
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: context },
        ],
      }),
      signal: abortSignal,
    })

    const text = await res.text()
    // Parse SSE stream generically (NOT Vercel SDK-specific "0:" format).
    // Standard SSE uses "data:" prefix; fallback to raw text if no data lines found.
    const lines = text.split('\n')
    let result = ''
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') continue
        try { result += JSON.parse(payload).content || JSON.parse(payload) }
        catch { result += payload }
      }
    }
    // Fallback: if no data: lines found, treat entire response as plain text
    if (!result) result = text
    return result ? [result.trim()] : []
  } catch (e: any) {
    if (e.name === 'AbortError') return []
    console.error('Ghost text fetch failed:', e)
    return []
  }
}

/* ========== Apply ghost text suggestion to editor ========== */
function applyGhostSuggestion(
  view: EditorView,
  from: number,
  candidates: string[],
): void {
  if (candidates.length === 0 || !candidates[0]) {
    view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
      suggestion: null, decorationId: null, loading: false, candidates: [], candidateIndex: -1,
    }))
    return
  }
  view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
    suggestion: candidates[0],
    from,
    decorationId: `ghost-${from}-${Date.now()}`,
    loading: false,
    candidates,
    candidateIndex: 0,
  }))
}

/* ========== Create Ghost Text Plugin ========== */
export function createGhostTextPlugin(options: GhostPluginOptions): { plugin: Plugin<GhostState>; updatePersona: (p: WritingPersona) => void; updateEnabled: (enabled: boolean) => void } {
  // 通过 ref 动态读取状态，避免因状态变化而重新创建插件
  const enabledRef: { current: boolean } = { current: options.enabled }
  const personaRef: { current: WritingPersona } = { current: options.persona }

  function updatePersona(p: WritingPersona) {
    personaRef.current = p
  }

  function updateEnabled(enabled: boolean) {
    enabledRef.current = enabled
    if (!enabled) {
      cancelPending()
    }
  }

  // Shared mutable state for timers and controllers
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  let abortController: AbortController | null = null
  let lastTriggerReason: TriggerReason = 'continuous'
  let isProcessing = false

  function cancelPending() {
    if (debounceTimer) { clearTimeout(debounceTimer); debounceTimer = null }
    if (abortController) { abortController.abort(); abortController = null }
  }

  function getPersona(): WritingPersona {
    return personaRef.current
  }

  function isEnabled(): boolean {
    return enabledRef.current
  }

  /** 核心: 发起一次 AI 预测请求 (带 debounce) */
  function schedulePrediction(
    view: EditorView,
    reason: TriggerReason,
    forceMs?: number,
  ) {
    if (!isEnabled()) return

    const delay = forceMs ?? getDebounceForTrigger(reason)
    const state = view.state
    const ctx = getContextBeforeCursor(state, 1200)

    if (!ctx.text.trim() || ctx.text.length < 20) return

    if (isProcessing) {
      cancelPending()
      debounceTimer = setTimeout(() => {
        schedulePrediction(view, reason, forceMs)
      }, delay * 2)
      return
    }

    cancelPending()
    debounceTimer = setTimeout(async () => {
      isProcessing = true
      abortController = new AbortController()
      try {
        const candidates = await fetchGhostCompletion(ctx.text, getPersona(), abortController.signal)
        if (abortController?.signal.aborted) return
        applyGhostSuggestion(view, ctx.position, candidates)
      } finally {
        isProcessing = false
      }
    }, delay)
  }

  const plugin = new Plugin<GhostState>({
    key: ghostTextPluginKey,

    state: {
      init(): GhostState {
        return { suggestion: null, from: 0, decorationId: null, loading: false, candidates: [], candidateIndex: -1 }
      },
      apply(tr, prev, _oldState, newState): GhostState {
        const meta = tr.getMeta(ghostTextPluginKey) as Partial<GhostState> | undefined
        if (meta) return { ...prev, ...meta }

        // User typed or moved cursor → clear ghost text
        if (tr.docChanged) {
          cancelPending()
          if (prev.suggestion) {
            return { ...prev, suggestion: null, decorationId: null, candidates: [], candidateIndex: -1 }
          }
          return prev
        }
        return prev
      },
    },

    view() {
      return {
        // When plugin is attached to view, store ref for manual trigger
        update(view, prevState) {
          // This is handled by appendTransaction for typing triggers
        },
      }
    },

    props: {
      decorations(state): DecorationSet {
        const gs = ghostTextPluginKey.getState(state) as GhostState
        if (!gs?.suggestion) return DecorationSet.empty

        const widget = Decoration.widget(gs.from, () => {
          const container = document.createElement('span')
          container.className = 'ai-ghost-text-container'
          container.style.transition = 'opacity 0.3s ease'

          const span = document.createElement('span')
          span.className = 'ai-ghost-text'
          span.textContent = gs.suggestion!
          span.setAttribute('data-ghost-id', gs.decorationId || '')
          // Inline styles as fallback (primary from globals.css)
          span.style.color = 'var(--color-ink-light, #B5A99A)'
          span.style.fontStyle = 'italic'
          span.style.opacity = '0.65'
          span.style.pointerEvents = 'none'
          span.style.userSelect = 'none'
          container.appendChild(span)

          // 多候选指示器
          if (gs.candidates.length > 1) {
            const indicator = document.createElement('span')
            indicator.style.fontSize = '10px'
            indicator.style.color = 'rgba(138, 126, 116, 0.4)'
            indicator.style.marginLeft = '4px'
            indicator.style.pointerEvents = 'none'
            indicator.style.userSelect = 'none'
            indicator.textContent = `${gs.candidateIndex + 1}/${gs.candidates.length}`
            container.appendChild(indicator)
          }

          return container
        }, { side: 1, ignoreSelection: true })

        return DecorationSet.create(state.doc, [widget])
      },

      handleKeyDown(view, event): boolean {
        const gs = ghostTextPluginKey.getState(view.state) as GhostState

        // ---- No ghost text visible → check for manual trigger ----
        if (!gs?.suggestion) {
          // Alt + \ : 手动触发预测 (VS Code Copilot 风格)
          if (event.altKey && event.key === '\\') {
            event.preventDefault()
            schedulePrediction(view, 'manual', 0)
            return true
          }
          return false
        }

        // ---- Ghost text IS visible ----

        // Tab or ArrowRight: accept suggestion
        if (event.key === 'Tab' || event.key === 'ArrowRight') {
          event.preventDefault()
          const { tr } = view.state
          tr.insertText(gs.suggestion!, gs.from)
          // After accepting, immediately schedule next prediction
          const toPos = gs.from + gs.suggestion!.length
          const resolvedPos = tr.doc.resolve(Math.min(toPos, tr.doc.content.size))
          tr.setSelection(TextSelection.near(resolvedPos))
          view.dispatch(tr)
          // Trigger next round after a short pause
          setTimeout(() => {
            if (view.hasFocus()) schedulePrediction(view, 'sentence_end', 400)
          }, 300)
          return true
        }

        // Escape: dismiss
        if (event.key === 'Escape') {
          event.preventDefault()
          cancelPending()
          view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
            suggestion: null, decorationId: null, candidates: [], candidateIndex: -1
          }))
          return true
        }

        // Alt + ArrowDown: cycle candidates
        if (event.altKey && event.key === 'ArrowDown') {
          event.preventDefault()
          if (gs.candidates.length > 1) {
            const nextIndex = (gs.candidateIndex + 1) % gs.candidates.length
            view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
              suggestion: gs.candidates[nextIndex],
              candidateIndex: nextIndex,
            }))
          }
          return true
        }

        // ==== 逐字匹配采纳 (Char Match Acceptance) ====
        // 用户输入的字符恰好等于灰字第1个字符 → 自动跳过该字符并更新灰字
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
          const typedChar = event.key
          const firstChar = gs.suggestion!.charAt(0)

          if (typedChar === firstChar) {
            // User typed the matching char → auto-accept that one char
            event.preventDefault()
            // Insert the matching character
            view.dispatch(view.state.tr.insertText(typedChar, gs.from))
            // Advance ghost text by 1 char (or clear if at end)
            const remaining = gs.suggestion!.slice(1)
            if (remaining) {
              view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
                suggestion: remaining,
                from: gs.from + 1,
                decorationId: `ghost-${gs.from + 1}-${Date.now()}`,
              }))
            } else {
              view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
                suggestion: null, decorationId: null, candidates: [], candidateIndex: -1,
              }))
              // All consumed → schedule next prediction
              setTimeout(() => {
                if (view.hasFocus()) schedulePrediction(view, 'continuous', 400)
              }, 200)
            }
            return true
          }

          // Typed char doesn't match → dismiss ghost text and let typing proceed
          view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
            suggestion: null, decorationId: null, candidates: [], candidateIndex: -1
          }))
          return false // don't preventDefault, let the character through
        }

        // Backspace / Delete: dismiss
        if (event.key === 'Backspace' || event.key === 'Delete') {
          view.dispatch(view.state.tr.setMeta(ghostTextPluginKey, {
            suggestion: null, decorationId: null, candidates: [], candidateIndex: -1
          }))
          return false
        }

        return false
      },
    },

    appendTransaction(transactions, _oldState, newState): any {
      if (!isEnabled()) return

      const changed = transactions.some(tr => tr.docChanged)
      if (!changed) return

      const view = (this as any).view as EditorView | undefined
      if (!view?.hasFocus?.()) return

      // Analyze what the user just typed to determine trigger reason
      const ctx = getContextBeforeCursor(newState, 1200)
      if (!ctx.text.trim()) return

      const reason = classifyTrigger(ctx.text)
      lastTriggerReason = reason

      // Schedule prediction (will auto-cancel previous one via cancelPending)
      schedulePrediction(view, reason)
    },

    destroy() {
      cancelPending()
    },
  })

  return { plugin, updatePersona, updateEnabled }
}
