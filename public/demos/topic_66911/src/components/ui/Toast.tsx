'use client'

import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
} from 'react'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type ToastType = 'success' | 'error' | 'warning' | 'info'

interface ToastItem {
  id: string
  type: ToastType
  message: string
  duration?: number
  exiting?: boolean
}

interface ToastContextValue {
  toast: (type: ToastType, message: string, duration?: number) => string
  success: (message: string, duration?: number) => string
  error: (message: string, duration?: number) => string
  warning: (message: string, duration?: number) => string
  info: (message: string, duration?: number) => string
}

const ToastContext = createContext<ToastContextValue | null>(null)

/* ------------------------------------------------------------------ */
/*  Config per type                                                    */
/* ------------------------------------------------------------------ */

const typeConfig: Record<
  ToastType,
  { icon: React.ElementType; borderColor: string; iconColor: string; bgTint: string }
> = {
  success: {
    icon: CheckCircle,
    borderColor: 'border-l-ochre',
    iconColor: 'text-green-600',
    bgTint: 'bg-green-50/60',
  },
  error: {
    icon: AlertCircle,
    borderColor: 'border-l-cinnabar',
    iconColor: 'text-red-600',
    bgTint: 'bg-red-50/60',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-l-amber-500',
    iconColor: 'text-amber-600',
    bgTint: 'bg-amber-50/60',
  },
  info: {
    icon: Info,
    borderColor: 'border-l-indigo',
    iconColor: 'text-ochre',
    bgTint: 'bg-ochre-bg/60',
  },
}

/* ------------------------------------------------------------------ */
/*  useToast hook                                                      */
/* ------------------------------------------------------------------ */

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    // Safe fallback: return no-op functions when ToastProvider is not available
    // This handles SSR, hydration mismatches, and edge cases
    const noop = () => ''
    return {
      toast: (_type: ToastType, _message: string, _duration?: number) => '',
      success: noop,
      error: noop,
      warning: noop,
      info: noop,
    } as ToastContextValue
  }
  return ctx
}

/* ------------------------------------------------------------------ */
/*  ToastItem component                                                 */
/* ------------------------------------------------------------------ */

function ToastItemRow({
  item,
  onClose,
  index,
}: {
  item: ToastItem
  onClose: (id: string) => void
  index: number
}) {
  const config = typeConfig[item.type]
  const Icon = config.icon

  return (
    <div
      className={`
        flex items-start gap-3 w-80 max-w-[calc(100vw-2rem)] p-4 rounded-[10px]
        bg-white border border-border border-l-[3px] ${config.borderColor}
        shadow-lg shadow-ink/8
        ${item.exiting ? 'animate-toast-out' : 'animate-toast-in'}
      `}
      style={{ animationDelay: item.exiting ? '0ms' : `${index * 80}ms`, animationFillMode: 'both' }}
    >
      <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${config.iconColor}`} />
      <p className="flex-1 text-sm text-ink leading-relaxed">
        {item.message}
      </p>
      <button
        onClick={() => onClose(item.id)}
        className="shrink-0 p-0.5 rounded-full hover:bg-paper-dark transition-colors"
      >
        <X className="w-4 h-4 text-ink-muted" />
      </button>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  ToastProvider                                                      */
/* ------------------------------------------------------------------ */

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map())

  /* 清理所有定时器 */
  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t))
    }
  }, [])

  const removeToast = useCallback((id: string) => {
    /* 先播放退出动画 */
    setToasts((prev) =>
      prev.map((t) => (t.id === id ? { ...t, exiting: true } : t))
    )
    /* 动画结束后真正移除 */
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
      const timer = timersRef.current.get(id)
      if (timer) {
        clearTimeout(timer)
        timersRef.current.delete(id)
      }
    }, 300)
  }, [])

  const addToast = useCallback(
    (type: ToastType, message: string, duration = 3000): string => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
      const item: ToastItem = { id, type, message, duration }

      setToasts((prev) => [...prev.slice(-4), item]) // 最多堆叠5条

      if (duration > 0) {
        const timer = setTimeout(() => removeToast(id), duration)
        timersRef.current.set(id, timer)
      }

      return id
    },
    [removeToast],
  )

  const toast = useCallback(
    (type: ToastType, message: string, duration?: number) =>
      addToast(type, message, duration),
    [addToast],
  )

  const success = useCallback(
    (message: string, duration?: number) => addToast('success', message, duration),
    [addToast],
  )
  const error = useCallback(
    (message: string, duration?: number) => addToast('error', message, duration),
    [addToast],
  )
  const warning = useCallback(
    (message: string, duration?: number) => addToast('warning', message, duration),
    [addToast],
  )
  const info = useCallback(
    (message: string, duration?: number) => addToast('info', message, duration),
    [addToast],
  )

  return (
    <ToastContext.Provider value={{ toast, success, error, warning, info }}>
      {children}

      {/* Toast 容器 - 固定右下角 */}
      <div className="fixed bottom-6 right-6 z-[9999] flex flex-col-reverse gap-3 pointer-events-none">
        {toasts.map((item, index) => (
          <div key={item.id} className="pointer-events-auto">
            <ToastItemRow item={item} onClose={removeToast} index={index} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
