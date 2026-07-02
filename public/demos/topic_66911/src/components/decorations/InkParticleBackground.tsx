'use client'

import { useEffect, useRef, useCallback } from 'react'

/* ============================================================
   InkParticleBackground -- 轻量水墨粒子背景
   优化：减少粒子数、移除 blur filter、降低帧率
   ============================================================ */

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  size: number
  opacity: number
  opacityDir: number
  color: string
  rotation: number
  rotSpeed: number
  shape: number[]
}

const COLORS = [
  'rgba(139, 94, 60,',
  'rgba(44, 36, 32,',
  'rgba(74, 107, 138,',
  'rgba(196, 168, 130,',
]

function createParticle(w: number, h: number): Particle {
  const color = COLORS[Math.floor(Math.random() * COLORS.length)]
  const size = 2 + Math.random() * 8
  const points = 3 + Math.floor(Math.random() * 3)
  const shape: number[] = []
  for (let i = 0; i < points; i++) {
    shape.push(0.5 + Math.random() * 0.5)
  }
  return {
    x: Math.random() * w,
    y: h + Math.random() * 100,
    vx: (Math.random() - 0.5) * 0.2,
    vy: -(0.1 + Math.random() * 0.25),
    size,
    opacity: 0.02 + Math.random() * 0.06,
    opacityDir: Math.random() > 0.5 ? 1 : -1,
    color,
    rotation: Math.random() * Math.PI * 2,
    rotSpeed: (Math.random() - 0.5) * 0.003,
    shape,
  }
}

interface InkParticleBackgroundProps {
  className?: string
  dark?: boolean
  density?: number
}

export default function InkParticleBackground({
  className = '',
  dark = false,
  density = 0.6,
}: InkParticleBackgroundProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const particlesRef = useRef<Particle[]>([])
  const rafRef = useRef<number>()
  const isVisibleRef = useRef(true)
  const frameCountRef = useRef(0)

  const drawParticle = useCallback((ctx: CanvasRenderingContext2D, p: Particle) => {
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(p.rotation)
    ctx.globalAlpha = p.opacity

    ctx.beginPath()
    const points = p.shape.length
    for (let i = 0; i <= points; i++) {
      const angle = (i / points) * Math.PI * 2
      const r = p.size * p.shape[i % points]
      const px = Math.cos(angle) * r
      const py = Math.sin(angle) * r
      if (i === 0) ctx.moveTo(px, py)
      else ctx.lineTo(px, py)
    }
    ctx.closePath()
    ctx.fillStyle = p.color + '1)'
    ctx.fill()

    ctx.restore()
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d', { alpha: true })
    if (!ctx) return

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2) // cap DPR
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      ctx.scale(dpr, dpr)
    }

    const initParticles = () => {
      const rect = canvas.getBoundingClientRect()
      const count = Math.floor((12 + rect.width / 80) * density) // reduced count
      particlesRef.current = Array.from({ length: count }, () =>
        createParticle(rect.width, rect.height)
      )
    }

    const handleVisibility = () => {
      isVisibleRef.current = !document.hidden
    }

    resize()
    initParticles()

    window.addEventListener('resize', resize)
    document.addEventListener('visibilitychange', handleVisibility)

    // 30fps throttle via frame skipping
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate)

      if (!isVisibleRef.current) return

      frameCountRef.current++
      if (frameCountRef.current % 2 !== 0) return // skip every other frame

      const rect = canvas.getBoundingClientRect()
      ctx.clearRect(0, 0, rect.width, rect.height)

      particlesRef.current.forEach(p => {
        p.vx *= 0.995
        p.vy *= 0.995
        p.x += p.vx
        p.y += p.vy
        p.rotation += p.rotSpeed

        p.opacity += p.opacityDir * 0.0003
        if (p.opacity > 0.08) { p.opacity = 0.08; p.opacityDir = -1 }
        if (p.opacity < 0.01) { p.opacity = 0.01; p.opacityDir = 1 }

        if (p.y < -20) {
          p.y = rect.height + 10
          p.x = Math.random() * rect.width
        }
        if (p.x < -20) p.x = rect.width + 10
        if (p.x > rect.width + 20) p.x = -10

        drawParticle(ctx, p)
      })
    }

    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resize)
      document.removeEventListener('visibilitychange', handleVisibility)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [density, drawParticle])

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full pointer-events-none ${className}`}
      aria-hidden="true"
    />
  )
}
