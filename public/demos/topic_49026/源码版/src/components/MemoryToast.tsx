import { useEffect, useState, useRef } from 'react'
import { Sparkles, X, ChevronRight } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { useUIStore } from '../stores/useUIStore'

export function MemoryToast() {
  const pendingMemories = useDataStore((s) => s.pendingMemories)
  const loadPendingMemories = useDataStore((s) => s.loadPendingMemories)
  const setMemoryConfirmOpen = useUIStore((s) => s.setMemoryConfirmOpen)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  // FIX P0-4: 使用 ref 避免 hovered 变化触发 useEffect 依赖数组变化
  const hoveredRef = useRef(false)
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([])

  const registerTimer = (timer: ReturnType<typeof setTimeout>) => {
    timersRef.current.push(timer)
    return timer
  }

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout)
    timersRef.current = []
  }

  useEffect(() => {
    return () => clearAllTimers()
  }, [])

  // 事件驱动：监听新记忆事件，秒级响应
  useEffect(() => {
    const check = () => {
      loadPendingMemories()
    }
    check() // 初始检查

    // 监听新记忆事件 — 记忆提取完成后立即触发
    const onNewMemory = () => {
      // 800ms 延迟确保 DB 写入完成
      setTimeout(() => loadPendingMemories(), 800)
    }
    window.addEventListener('hengzhou-new-memory', onNewMemory)

    // 降级兜底：60秒轮询（防止事件遗漏）
    const interval = setInterval(check, 60000)

    return () => {
      window.removeEventListener('hengzhou-new-memory', onNewMemory)
      clearInterval(interval)
    }
  }, [loadPendingMemories])

  // 当有待确认记忆时显示
  // FIX P0-4: 移除 hovered 依赖，使用 ref 检查，保持依赖数组稳定
  useEffect(() => {
    if (pendingMemories.length > 0 && !dismissed) {
      setVisible(true)
      // hover 时不自动隐藏，给用户足够时间点击
      if (!hoveredRef.current) {
        const timer = setTimeout(() => {
          setVisible(false)
        }, 5000)
        return () => clearTimeout(timer)
      }
      return () => {}
    } else {
      setVisible(false)
    }
    return () => {}
  }, [pendingMemories.length, dismissed])

  if (!visible || pendingMemories.length === 0) return null

  const handleView = () => {
    setMemoryConfirmOpen(true)
    setVisible(false)
    setDismissed(true)
    // 5分钟后重置dismissed状态
    registerTimer(setTimeout(() => setDismissed(false), 300000))
  }

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    registerTimer(setTimeout(() => setDismissed(false), 300000))
  }

  // 取前3条记忆预览
  const preview = pendingMemories.slice(0, 3)

  return (
    <div
      className="fixed bottom-20 md:bottom-6 right-6 z-50 animate-in slide-in-from-bottom-4 fade-in duration-300"
      onMouseEnter={() => { hoveredRef.current = true }}
      onMouseLeave={() => { hoveredRef.current = false }}
    >
      <div className="bg-surface rounded-xl border border-ink-muted/20 shadow-lg p-4 w-80 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-zen-amber/10 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5 text-zen-amber" />
            </div>
            <span className="text-sm font-medium text-ink-primary">我记住了{pendingMemories.length}件事</span>
          </div>
          <button
            onClick={handleDismiss}
            className="w-5 h-5 rounded flex items-center justify-center text-ink-muted hover:text-ink-secondary"
            aria-label="关闭"
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        <div className="space-y-1.5">
          {preview.map((mem) => (
            <div key={mem.id} className="text-xs text-ink-secondary leading-relaxed line-clamp-2 pl-2 border-l-2 border-zen-amber/30">
              {mem.content}
            </div>
          ))}
        </div>

        <button
          onClick={handleView}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-lg bg-zen-amber/10 text-zen-amber text-xs font-medium hover:bg-zen-amber/20 transition-colors"
        >
          查看并确认
          <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
