import { useRef, useEffect, useState } from 'react'
import { usePlayerStore } from '@/store/playerStore'

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, '0')}`
}

export default function ProgressBar({ audioRef, compact }: { audioRef: React.RefObject<HTMLAudioElement | null>; compact?: boolean }) {
  const duration = usePlayerStore((s) => s.duration)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  
  const barRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const rafId = useRef(0)
  const [displayTime, setDisplayTime] = useState(0)

  useEffect(() => {
    const tick = () => {
      if (!isDragging.current) {
        const audio = audioRef.current
        if (audio) {
          setDisplayTime(audio.currentTime)
          setCurrentTime(audio.currentTime)
        }
      }
      rafId.current = requestAnimationFrame(tick)
    }
    rafId.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafId.current)
  }, [audioRef, setCurrentTime])

  const setProgress = useRef((clientX: number) => {
    const bar = barRef.current
    const audio = audioRef.current
    if (!bar || !audio || duration <= 0) return
    
    const rect = bar.getBoundingClientRect()
    const width = rect.width
    let clickX = clientX - rect.left
    
    if (clickX < 0) clickX = 0
    if (clickX > width) clickX = width
    
    const percent = clickX / width
    const newTime = percent * duration
    
    audio.currentTime = newTime
    setDisplayTime(newTime)
    setCurrentTime(newTime)
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    setProgress.current(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault()
      setProgress.current(e.clientX)
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    setProgress.current(e.touches[0].clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging.current) {
      e.preventDefault()
      setProgress.current(e.touches[0].clientX)
    }
  }

  const handleTouchEnd = () => {
    isDragging.current = false
  }

  useEffect(() => {
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    window.addEventListener('touchend', handleTouchEnd)
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('touchmove', handleTouchMove)
      window.removeEventListener('touchend', handleTouchEnd)
    }
  }, [])

  const progress = duration > 0 ? (displayTime / duration) * 100 : 0

  return (
    <div className={`w-full select-none ${compact ? '' : 'space-y-2'}`}>
      <div className="relative group">
        <div
          ref={barRef}
          className="w-full h-1.5 cursor-pointer rounded-full bg-gray-200 relative overflow-hidden"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
        >
          <div
            className="h-full bg-gray-900 rounded-full transition-all"
            style={{ width: `${progress}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-gray-900 rounded-full shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ left: `calc(${progress}% - 8px)` }}
          />
        </div>
      </div>
      {!compact && (
        <div className="flex justify-between text-xs text-gray-500">
          <span>{formatTime(displayTime)}</span>
          <span>{duration > 0 ? formatTime(duration) : '--:--'}</span>
        </div>
      )}
    </div>
  )
}
