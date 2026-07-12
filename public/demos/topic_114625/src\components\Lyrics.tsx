import { useRef, useEffect } from 'react'
import { usePlayerStore } from '@/store/playerStore'

export default function Lyrics() {
  const lyrics = usePlayerStore((s) => s.lyrics)
  const currentLyricIndex = usePlayerStore((s) => s.currentLyricIndex)
  const lyricsContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (lyricsContainerRef.current && currentLyricIndex >= 0) {
      const activeElement = lyricsContainerRef.current.children[currentLyricIndex] as HTMLElement
      if (activeElement) {
        activeElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }
  }, [currentLyricIndex])

  if (lyrics.length === 0) {
    return (
      <div className="h-20 flex items-center justify-center">
        <p className="text-sm text-gray-400">暂无歌词</p>
      </div>
    )
  }

  return (
    <div ref={lyricsContainerRef} className="h-24 overflow-y-auto text-center">
      {lyrics.map((line, index) => (
        <p
          key={index}
          className={`py-1.5 text-sm transition-all duration-300 ${
            index === currentLyricIndex
              ? 'text-gray-900 font-medium scale-105'
              : 'text-gray-400'
          }`}
        >
          {line.text}
        </p>
      ))}
    </div>
  )
}
