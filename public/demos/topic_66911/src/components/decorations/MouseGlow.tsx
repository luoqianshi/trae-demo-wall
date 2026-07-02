'use client'

import { useState, useEffect } from 'react'
import { useMouseGlow } from '../../lib/animation-utils'

/* ============================================================
   MouseGlow -- 鼠标跟随暖金色光晕
   ============================================================ */

interface MouseGlowProps {
  className?: string
  color?: string
  size?: number
  opacity?: number
}

export default function MouseGlow({
  className = '',
  color = 'rgba(196, 168, 130, 0.06)',
  size = 400,
}: MouseGlowProps) {
  const { x, y } = useMouseGlow()
  const [isMobile, setIsMobile] = useState(true) // 默认 true 避免水合不匹配

  useEffect(() => {
    setIsMobile(window.matchMedia('(max-width: 768px)').matches)
  }, [])

  if (isMobile) return null

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 ${className}`}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          transform: 'translate3d(0, 0, 0)',
          willChange: 'transform',
          transition: 'none',
        }}
      />
    </div>
  )
}
