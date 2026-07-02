'use client'

import { useEffect, useRef, useState } from 'react'

/* ============================================================
   InkDividerAnimated -- 动态水墨分割线
   SVG path 动画模拟毛笔横扫，IntersectionObserver 触发
   ============================================================ */

interface InkDividerAnimatedProps {
  className?: string
  color?: string
  width?: string
  showSeal?: boolean
  sealText?: string
}

export default function InkDividerAnimated({
  className = '',
  color = 'rgba(139, 94, 60, 0.3)',
  width = '100%',
  showSeal = false,
  sealText = '印',
}: InkDividerAnimatedProps) {
  const pathRef = useRef<SVGPathElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      { threshold: 0.3 }
    )
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  // 使用确定性值避免 SSR/CSR 水合不匹配
  const pathD = 'M 0 10 L 5 11.5 L 10 12.8 L 15 11.2 L 20 9 L 25 8.5 L 30 10.3 L 35 12 L 40 11.5 L 45 9.8 L 50 8.7 L 55 9.5 L 60 11 L 65 12.3 L 70 11 L 75 9.2 L 80 8.8 L 85 10.5 L 90 11.8 L 95 10.2 L 100 10'

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
      style={{ width }}
      aria-hidden="true"
    >
      <svg
        viewBox="0 0 100 20"
        preserveAspectRatio="none"
        className="w-full h-3"
        style={{ overflow: 'visible' }}
      >
        {/* 主笔触 */}
        <path
          ref={pathRef}
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray="200"
          strokeDashoffset={isVisible ? '0' : '200'}
          style={{
            transition: 'stroke-dashoffset 2s cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        />
        {/* 墨迹晕染 */}
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth="3"
          strokeLinecap="round"
          strokeDasharray="200"
          strokeDashoffset={isVisible ? '0' : '200'}
          opacity="0.15"
          style={{
            filter: 'blur(2px)',
            transition: 'stroke-dashoffset 2.2s cubic-bezier(0.32, 0.72, 0, 1)',
            transitionDelay: '0.3s',
          }}
        />
      </svg>

      {/* 中间印章装饰 */}
      {showSeal && (
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            opacity: isVisible ? 0.15 : 0,
            transition: 'opacity 1s ease 1.5s',
          }}
        >
          <div
            className="w-8 h-8 rounded-sm border border-ochre/30 flex items-center justify-center font-display text-ochre/40 text-xs"
            style={{ transform: 'rotate(-8deg)' }}
          >
            {sealText}
          </div>
        </div>
      )}
    </div>
  )
}
