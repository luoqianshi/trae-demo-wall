import { useEffect } from 'react'
import { X, Check, Sparkles, Bot } from 'lucide-react'
import { useUIStore } from '../stores/useUIStore'
import { useDataStore } from '../stores/useDataStore'

export function MemoryConfirmModal() {
  const memoryConfirmOpen = useUIStore((s) => s.memoryConfirmOpen)
  const setMemoryConfirmOpen = useUIStore((s) => s.setMemoryConfirmOpen)

  const pendingMemories = useDataStore((s) => s.pendingMemories)
  const loadPendingMemories = useDataStore((s) => s.loadPendingMemories)
  const confirmMemory = useDataStore((s) => s.confirmMemory)
  const ignoreMemory = useDataStore((s) => s.ignoreMemory)

  const isOpen = memoryConfirmOpen

  useEffect(() => {
    if (isOpen) {
      loadPendingMemories()
    }
  }, [isOpen, loadPendingMemories])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-ink-primary/30 backdrop-blur-sm"
        onClick={() => setMemoryConfirmOpen(false)}
      />

      {/* 弹窗 */}
      <div className="relative bg-surface rounded-2xl shadow-xl w-full max-w-lg max-h-[80vh] overflow-hidden flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-ink-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-serif font-semibold text-ink-primary">
                {pendingMemories.length > 0 ? '我记住了这些' : '暂无新记忆'}
              </h2>
              <p className="text-xs text-ink-tertiary mt-0.5">
                {pendingMemories.length > 0
                  ? '你看看对不对，不对的我就忘掉'
                  : '继续和衡舟聊天，它会自动提取有价值的信息'}
              </p>
            </div>
            <button
              onClick={() => setMemoryConfirmOpen(false)}
              className="w-8 h-8 rounded-lg flex items-center justify-center text-ink-tertiary hover:bg-canvas-warm transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 内容 - 对话气泡风格 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {pendingMemories.length === 0 ? (
            <div className="text-center py-10">
              <Sparkles className="w-8 h-8 text-ink-muted mx-auto mb-3" />
              <p className="text-sm text-ink-secondary">暂无待确认的记忆</p>
              <p className="text-xs text-ink-tertiary mt-1">
                聊得越多，衡舟越懂你
              </p>
            </div>
          ) : (
            pendingMemories.map((memory, idx) => (
              <div key={memory.id} className="flex gap-3">
                {/* 衡舟头像 */}
                <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 bg-zen-terracotta/10 text-zen-terracotta text-xs">
                  <Bot className="w-3.5 h-3.5" />
                </div>

                <div className="flex-1 space-y-2">
                  {/* 记忆气泡 */}
                  <div className="bg-canvas border border-ink-muted/20 rounded-2xl rounded-tl-sm px-4 py-3">
                    <p className="text-sm text-ink-primary leading-relaxed">{memory.content}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs px-1.5 py-0.5 rounded bg-zen-amber/10 text-zen-amber">
                        {typeLabel(memory.type)}
                      </span>
                      <span className="text-xs text-ink-tertiary">
                        {idx === 0 ? '刚刚' : `${idx}分钟前`} · {confidenceLabel(memory.confidence)}可信度
                      </span>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex items-center gap-2 pl-2">
                    <button
                      onClick={() => confirmMemory(memory.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-zen-sage/10 text-zen-sage text-xs font-medium hover:bg-zen-sage/20 transition-colors"
                    >
                      <Check className="w-3 h-3" />
                      对的
                    </button>
                    <button
                      onClick={() => ignoreMemory(memory.id)}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-ink-muted/10 text-ink-tertiary text-xs hover:bg-ink-muted/20 transition-colors"
                    >
                      <X className="w-3 h-3" />
                      不对
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* 底部 */}
        <div className="px-6 py-4 border-t border-ink-muted/20 bg-gradient-to-r from-zen-terracotta/5 to-zen-sage/5">
          <p className="text-xs text-ink-tertiary text-center leading-relaxed">
            你确认的内容会存入记忆库。聊得越多，衡舟的建议会越贴心 ❤️
          </p>
        </div>
      </div>
    </div>
  )
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    preference: '偏好',
    commitment: '承诺',
    event: '事件',
    insight: '洞察',
    emotion: '情绪',
  }
  return map[type] || type
}

function confidenceLabel(c: string): string {
  const map: Record<string, string> = {
    high: '高',
    medium: '中',
    low: '低',
  }
  return map[c] || c
}