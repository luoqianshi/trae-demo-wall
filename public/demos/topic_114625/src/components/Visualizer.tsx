import { useEffect, useRef } from 'react'

let sharedCtx: AudioContext | null = null
let sharedAnalyser: AnalyserNode | null = null
let sharedInitDone = false

function initShared(audio: HTMLAudioElement): boolean {
  if (sharedInitDone && sharedAnalyser) return true
  try {
    if (sharedCtx?.state === 'closed') {
      sharedCtx = null
      sharedInitDone = false
    }
    if (!sharedCtx) {
      sharedCtx = new AudioContext()
      const analyser = sharedCtx.createAnalyser()
      analyser.fftSize = 256
      const source = sharedCtx.createMediaElementSource(audio)
      source.connect(analyser)
      analyser.connect(sharedCtx.destination)
      sharedAnalyser = analyser
      sharedInitDone = true
    }
    return !!sharedAnalyser
  } catch {
    return !!sharedAnalyser
  }
}

export default function Visualizer({ audioRef }: { audioRef: React.RefObject<HTMLAudioElement | null> }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = canvas.offsetWidth * window.devicePixelRatio
      canvas.height = canvas.offsetHeight * window.devicePixelRatio
      ctx.scale(window.devicePixelRatio, window.devicePixelRatio)
    }

    resize()
    window.addEventListener('resize', resize)

    const draw = () => {
      const audio = audioRef.current
      if (!audio) {
        animationRef.current = requestAnimationFrame(draw)
        return
      }

      if (!sharedAnalyser) {
        initShared(audio)
      }

      const width = canvas.offsetWidth
      const height = canvas.offsetHeight
      ctx.clearRect(0, 0, width, height)

      const barCount = 40
      const barWidth = (width / barCount) * 0.8
      const gap = (width / barCount) * 0.2

      if (sharedAnalyser) {
        const dataArray = new Uint8Array(sharedAnalyser.frequencyBinCount)
        sharedAnalyser.getByteFrequencyData(dataArray)

        const step = Math.floor(dataArray.length / barCount)

        for (let i = 0; i < barCount; i++) {
          const dataIndex = i * step
          const value = dataArray[dataIndex] || 0
          const barHeight = (value / 255) * height * 0.8

          const gradient = ctx.createLinearGradient(0, height - barHeight, 0, height)
          gradient.addColorStop(0, '#6b7280')
          gradient.addColorStop(1, '#9ca3af')

          ctx.fillStyle = gradient
          ctx.beginPath()
          ctx.roundRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight, 2)
          ctx.fill()
        }
      } else {
        for (let i = 0; i < barCount; i++) {
          const t = audio.currentTime * 0.002 + (i * 0.1)
          const barHeight = Math.sin(t) * height * 0.3 + height * 0.4

          ctx.fillStyle = '#d1d5db'
          ctx.beginPath()
          ctx.roundRect(i * (barWidth + gap), height - barHeight, barWidth, barHeight, 2)
          ctx.fill()
        }
      }

      animationRef.current = requestAnimationFrame(draw)
    }

    draw()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animationRef.current)
    }
  }, [audioRef])

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-12 rounded-lg bg-gray-100/50"
    />
  )
}
