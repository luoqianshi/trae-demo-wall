'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

/* ============================================================
   useMouseGlow -- 鼠标跟随光效
   返回 { x, y } 用于设置 CSS 变量
   ============================================================ */

export function useMouseGlow() {
  const [pos, setPos] = useState({ x: -200, y: -200 })
  const rafRef = useRef<number>()
  const targetRef = useRef({ x: -200, y: -200 })

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      targetRef.current = { x: e.clientX, y: e.clientY }
    }

    const animate = () => {
      const target = targetRef.current
      setPos(prev => ({
        x: prev.x + (target.x - prev.x) * 0.12,
        y: prev.y + (target.y - prev.y) * 0.12,
      }))
      rafRef.current = requestAnimationFrame(animate)
    }

    window.addEventListener('mousemove', handleMove)
    rafRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('mousemove', handleMove)
      if (rafRef.current) cancelAnimationFrame(rafRef.current)
    }
  }, [])

  return pos
}

/* ============================================================
   useParallax -- 视差滚动
   返回 { ref, offset } -- offset 为 translateY 偏移量
   ============================================================ */

export function useParallax(speed: number = 0.1) {
  const ref = useRef<HTMLDivElement>(null)
  const [offset, setOffset] = useState(0)

  useEffect(() => {
    const handleScroll = () => {
      if (!ref.current) return
      const rect = ref.current.getBoundingClientRect()
      const centerY = rect.top + rect.height / 2
      const viewCenter = window.innerHeight / 2
      setOffset((centerY - viewCenter) * speed)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()
    return () => window.removeEventListener('scroll', handleScroll)
  }, [speed])

  return { ref, offset }
}

/* ============================================================
   useCountUp -- 数字滚动动画
   ============================================================ */

export function useCountUp(target: number, duration: number = 2000) {
  const [value, setValue] = useState(0)
  const [hasStarted, setHasStarted] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasStarted) {
          setHasStarted(true)
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [hasStarted])

  useEffect(() => {
    if (!hasStarted) return
    const start = performance.now()
    const animate = (now: number) => {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      // quartic ease-out
      const eased = 1 - Math.pow(1 - progress, 4)
      setValue(Math.round(target * eased))
      if (progress < 1) requestAnimationFrame(animate)
    }
    requestAnimationFrame(animate)
  }, [hasStarted, target, duration])

  return { value, ref }
}

/* ============================================================
   useStagger -- 列表交错入场
   ============================================================ */

export function useStagger(baseDelay: number = 80) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!ref.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1 }
    )
    observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const getDelay = useCallback(
    (index: number) => (visible ? index * baseDelay : 0),
    [visible, baseDelay]
  )

  return { visible, ref, getDelay }
}

/* ============================================================
   useInkCursor -- 古风墨迹光标效果（仅桌面端）
   ============================================================ */

export function useInkCursor(maxDots: number = 20) {
  const dotsRef = useRef<HTMLDivElement[]>([])
  const lastPosRef = useRef({ x: 0, y: 0 })
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const isMobile = window.matchMedia('(max-width: 768px)').matches
    if (isMobile) return

    let lastTime = 0
    const throttleMs = 60

    const handleMove = (e: MouseEvent) => {
      const now = Date.now()
      if (now - lastTime < throttleMs) return
      lastTime = now

      const dx = e.clientX - lastPosRef.current.x
      const dy = e.clientY - lastPosRef.current.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 20) return

      lastPosRef.current = { x: e.clientX, y: e.clientY }

      const dot = document.createElement('div')
      dot.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        width: ${4 + Math.random() * 6}px;
        height: ${4 + Math.random() * 6}px;
        border-radius: 50%;
        background: rgba(139, 94, 60, ${0.08 + Math.random() * 0.08});
        pointer-events: none;
        z-index: 9999;
        transform: translate(-50%, -50%);
        animation: ink-cursor-fade 1.2s ease-out forwards;
      `
      document.body.appendChild(dot)
      dotsRef.current.push(dot)

      // 回收多余节点
      while (dotsRef.current.length > maxDots) {
        const old = dotsRef.current.shift()
        old?.remove()
      }

      // 自动移除
      setTimeout(() => {
        dot.remove()
        const idx = dotsRef.current.indexOf(dot)
        if (idx > -1) dotsRef.current.splice(idx, 1)
      }, 1200)
    }

    window.addEventListener('mousemove', handleMove)
    return () => {
      window.removeEventListener('mousemove', handleMove)
      dotsRef.current.forEach(d => d.remove())
      dotsRef.current = []
    }
  }, [maxDots])

  return containerRef
}
