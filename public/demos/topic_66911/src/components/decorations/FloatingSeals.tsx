'use client'

/* ============================================================
   FloatingSeals -- 浮动印章装饰组件
   3-5 个半透明古风印章在背景缓慢浮动
   ============================================================ */

interface FloatingSealsProps {
  className?: string
  count?: number
}

const SEAL_CHARS = ['書', '墨', '文', '學', '筆']

export default function FloatingSeals({ className = '', count = 4 }: FloatingSealsProps) {
  const seals = Array.from({ length: Math.min(count, 5) }, (_, i) => ({
    char: SEAL_CHARS[i % SEAL_CHARS.length],
    size: 40 + (i * 15) % 30,
    top: `${10 + (i * 17) % 70}%`,
    left: `${5 + (i * 23) % 85}%`,
    delay: `${i * 1.5}s`,
    rotation: -15 + (i * 12) % 30,
    opacity: 0.03 + (i % 3) * 0.01,
  }))

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`} aria-hidden="true">
      {seals.map((seal, i) => (
        <div
          key={i}
          className="absolute animate-float-gentle"
          style={{
            top: seal.top,
            left: seal.left,
            animationDelay: seal.delay,
            opacity: seal.opacity,
            transform: `rotate(${seal.rotation}deg)`,
          }}
        >
          <div
            className="font-display text-ink-secondary border border-ochre/20 rounded-sm flex items-center justify-center"
            style={{
              width: seal.size,
              height: seal.size,
              fontSize: seal.size * 0.5,
              lineHeight: 1,
            }}
          >
            {seal.char}
          </div>
        </div>
      ))}
    </div>
  )
}
