import { useRef, useEffect } from 'react'
import { Volume2, VolumeX } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'

export default function VolumeControl({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const volume = usePlayerStore((s) => s.volume)
  const setVolume = usePlayerStore((s) => s.setVolume)
  const barRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)

  const setVolumeLevel = useRef((clientX: number) => {
    const bar = barRef.current
    const audio = audioRef.current
    if (!bar || !audio) return
    
    const rect = bar.getBoundingClientRect()
    const width = rect.width
    let x = clientX - rect.left
    
    if (x < 0) x = 0
    if (x > width) x = width
    
    const vol = x / width
    audio.volume = vol
    setVolume(vol)
  })

  const handleMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    setVolumeLevel.current(e.clientX)
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging.current) {
      e.preventDefault()
      setVolumeLevel.current(e.clientX)
    }
  }

  const handleMouseUp = () => {
    isDragging.current = false
  }

  const handleTouchStart = (e: React.TouchEvent) => {
    isDragging.current = true
    setVolumeLevel.current(e.touches[0].clientX)
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging.current) {
      e.preventDefault()
      setVolumeLevel.current(e.touches[0].clientX)
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

  const toggleMute = () => {
    if (!audioRef.current) return
    if (volume > 0) {
      audioRef.current.volume = 0
      setVolume(0)
    } else {
      audioRef.current.volume = 0.7
      setVolume(0.7)
    }
  }

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={toggleMute}
        className="text-gray-500 hover:text-gray-700 transition-colors rounded-md p-1.5 hover:bg-gray-100"
      >
        {volume === 0 ? <VolumeX size={16} /> : <Volume2 size={16} />}
      </button>
      <div
        ref={barRef}
        className="relative h-1 w-20 cursor-pointer rounded-full bg-gray-200 group overflow-hidden"
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div
          className="absolute left-0 top-0 h-full bg-gray-900 rounded-full transition-all"
          style={{ width: `${volume * 100}%` }}
        />
        <div
          className="absolute top-1/2 -translate-y-1/2 h-3 w-3 bg-gray-900 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
          style={{ left: `calc(${volume * 100}% - 6px)` }}
        />
      </div>
    </div>
  )
}
