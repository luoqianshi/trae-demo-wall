import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface ActionItem {
  id: string
  title: string
  description: string
  onAction: () => void
}

interface SwipeableActionCardsProps {
  actions: ActionItem[]
}

export function SwipeableActionCards({ actions }: SwipeableActionCardsProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [dismissed, setDismissed] = useState(false)
  const startXRef = useRef<number | null>(null)

  if (dismissed || actions.length === 0) return null

  const current = actions[currentIndex]

  const handleStart = (e: React.TouchEvent) => {
    startXRef.current = e.touches[0].clientX
  }

  const handleEnd = (e: React.TouchEvent) => {
    if (startXRef.current === null) return
    const deltaX = e.changedTouches[0].clientX - startXRef.current
    startXRef.current = null
    if (deltaX < -50 && currentIndex < actions.length - 1) {
      setCurrentIndex(currentIndex + 1)
    } else if (deltaX > 50 && currentIndex > 0) {
      setCurrentIndex(currentIndex - 1)
    }
  }

  return (
    <div className="mx-3 my-2" onTouchStart={handleStart} onTouchEnd={handleEnd}>
      <div className="flex items-center gap-2">
        <button onClick={() => currentIndex > 0 && setCurrentIndex(currentIndex - 1)} className="p-1 text-ink-muted" disabled={currentIndex === 0}>
          <ChevronLeft size={16} />
        </button>
        <div className="flex-1 p-3 bg-zen-indigo/10 rounded-xl">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="text-sm font-medium text-ink-primary">{current.title}</div>
              <div className="text-xs text-ink-secondary mt-0.5">{current.description}</div>
            </div>
            <button onClick={() => setDismissed(true)} className="p-0.5 text-ink-muted">
              <X size={14} />
            </button>
          </div>
          <button onClick={current.onAction} className="mt-2 px-3 py-1 text-xs text-zen-indigo bg-surface rounded-full">
            执行
          </button>
        </div>
        <button onClick={() => currentIndex < actions.length - 1 && setCurrentIndex(currentIndex + 1)} className="p-1 text-ink-muted" disabled={currentIndex === actions.length - 1}>
          <ChevronRight size={16} />
        </button>
      </div>
      {actions.length > 1 && (
        <div className="flex justify-center gap-1 mt-1">
          {actions.map((_, i) => (
            <div key={i} className={`w-1 h-1 rounded-full ${i === currentIndex ? 'bg-zen-indigo' : 'bg-ink-muted'}`} />
          ))}
        </div>
      )}
    </div>
  )
}
