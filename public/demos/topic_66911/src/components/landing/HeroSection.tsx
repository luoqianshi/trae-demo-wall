'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'

function RedSeal({ text, size = 'default' }: { text: string; size?: 'small' | 'default' | 'large' }) {
  const sizes = {
    small: { width: '32px', height: '32px', fontSize: '10px' },
    default: { width: '48px', height: '48px', fontSize: '14px' },
    large: { width: '72px', height: '72px', fontSize: '20px' },
  }
  const s = sizes[size]

  return (
    <div
      className="border-2 flex items-center justify-center"
      style={{
        width: s.width,
        height: s.height,
        borderColor: '#B54A3A',
        backgroundColor: 'rgba(181,74,58,0.06)',
        boxShadow: '0 2px 12px rgba(181,74,58,0.15)',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: 'Ma Shan Zheng, cursive',
          color: '#B54A3A',
          fontSize: s.fontSize,
          letterSpacing: '0.15em',
        }}
      >
        {text}
      </span>
    </div>
  )
}

function BrushStroke({ className = '', color = 'rgba(28,24,22,0.08)' }) {
  return (
    <svg className={`w-full ${className}`} viewBox="0 0 400 8" preserveAspectRatio="none">
      <path
        d="M0,4 Q60,1 120,4 T240,4 T360,4 T400,4"
        stroke={color}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeDasharray="6,3"
      />
    </svg>
  )
}

function InkCircle({ size = 200, opacity = 0.04, position = 'top-left' }: { size?: number; opacity?: number; position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center' }) {
  const positions: Record<string, React.CSSProperties> = {
    'top-left': { top: '8%', left: '3%' },
    'top-right': { top: '12%', right: '8%' },
    'bottom-left': { bottom: '15%', left: '12%' },
    'bottom-right': { bottom: '8%', right: '3%' },
    center: { top: '50%', left: '50%', transform: 'translate(-50%, -50%)' },
  }
  const pos = positions[position]

  return (
    <div
      className="absolute rounded-full"
      style={{
        ...pos,
        width: size,
        height: size,
        background: `radial-gradient(circle, rgba(28,24,22,${opacity * 2.5}) 0%, rgba(139,99,92,${opacity}) 40%, transparent 70%)`,
      }}
    />
  )
}

function VerticalText({ children, className = '', style = {} }: { children: React.ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`font-calligraphy ${className}`}
      style={{
        ...style,
        writingMode: 'vertical-rl',
        textOrientation: 'mixed',
      }}
    >
      {children}
    </span>
  )
}

function Particle({ delay }: { delay: number }) {
  const colors = ['#8B5E3C', '#B54A3A', '#5A6B52', '#B8956E', '#B54A3A']
  const color = colors[Math.floor(Math.random() * colors.length)]
  const size = 2 + Math.random() * 2

  return (
    <div
      className="absolute rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        backgroundColor: color,
        bottom: '-8px',
        left: `${Math.random() * 100}%`,
        animation: `particleFloat ${7 + Math.random() * 5}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
        opacity: 0.4,
        boxShadow: `0 0 ${size * 2}px ${color}`,
      }}
    />
  )
}

function GlowRing({ size, opacity, delay }: { size: number; opacity: number; delay: number }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        background: `radial-gradient(circle, transparent 0%, transparent 85%, rgba(181,74,58,${0.03 * opacity}) 100%)`,
        border: `${1 + Math.floor(size / 400)}px solid rgba(181,74,58,${0.08 * opacity})`,
        boxShadow: `inset 0 0 ${size / 4}px rgba(181,74,58,${0.02 * opacity}), 0 0 ${size / 8}px rgba(181,74,58,${0.04 * opacity})`,
        opacity: opacity,
        animation: `glowPulse ${5 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    setMounted(true)
    const handleMouseMove = (e: MouseEvent) => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect()
        setMousePosition({
          x: (e.clientX - rect.left - rect.width / 2) / 40,
          y: (e.clientY - rect.top - rect.height / 2) / 40,
        })
      }
    }
    window.addEventListener('mousemove', handleMouseMove)
    return () => window.removeEventListener('mousemove', handleMouseMove)
  }, [])

  return (
    <section
      ref={containerRef}
      className="relative min-h-screen flex flex-col items-center justify-center px-6 py-24 overflow-hidden"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />
      <div className="absolute inset-0 ink-wash-hero pointer-events-none" />

      <InkCircle size={600} opacity={0.15} position="top-left" />
      <InkCircle size={480} opacity={0.12} position="top-right" />
      <InkCircle size={520} opacity={0.14} position="bottom-right" />
      <InkCircle size={380} opacity={0.12} position="bottom-left" />
      <InkCircle size={300} opacity={0.08} position="center" />

      <GlowRing size={700} opacity={mounted ? 0.7 : 0} delay={0} />
      <GlowRing size={1000} opacity={mounted ? 0.55 : 0} delay={1.5} />
      <GlowRing size={1300} opacity={mounted ? 0.4 : 0} delay={3} />

      {mounted && Array.from({ length: 25 }).map((_, i) => (
        <Particle key={i} delay={i * 0.3} />
      ))}

      {/* Ink wash decorative elements */}
      <svg
        className="absolute top-8 left-4 w-40 md:w-60 opacity-25"
        viewBox="0 0 200 100"
        style={{
          filter: 'blur(1.5px)',
          animation: 'float 12s ease-in-out infinite',
        }}
      >
        <path
          d="M0,20 Q30,5 60,20 Q90,35 120,20 Q150,5 200,20"
          stroke="rgba(139,99,92,0.45)"
          strokeWidth="1.2"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M20,40 Q50,30 80,45 Q110,60 140,45 Q170,30 200,45"
          stroke="rgba(181,74,58,0.35)"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M0,65 Q40,50 80,65 Q120,80 160,65 Q200,50 200,65"
          stroke="rgba(90,107,82,0.25)"
          strokeWidth="0.6"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      <svg
        className="absolute bottom-20 right-8 w-48 md:w-72 opacity-22"
        viewBox="0 0 200 100"
        style={{
          filter: 'blur(1.5px)',
          animation: 'float 15s ease-in-out infinite reverse',
        }}
      >
        <path
          d="M0,60 Q40,45 80,70 Q120,95 160,70 Q200,45 200,60"
          stroke="rgba(90,107,82,0.40)"
          strokeWidth="1.0"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M10,80 Q50,65 90,85 Q130,105 170,85 Q200,65 200,80"
          stroke="rgba(184,149,110,0.30)"
          strokeWidth="0.7"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M0,35 Q50,20 100,40 Q150,60 200,35"
          stroke="rgba(139,99,92,0.25)"
          strokeWidth="0.5"
          fill="none"
          strokeLinecap="round"
        />
      </svg>

      {/* Floating ink drops */}
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '180px',
          height: '180px',
          top: '12%',
          right: '8%',
          background: 'radial-gradient(circle, rgba(181,74,58,0.25) 0%, rgba(139,99,92,0.15) 50%, transparent 75%)',
          animation: 'float 18s ease-in-out infinite',
          opacity: 0.35,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '250px',
          height: '250px',
          bottom: '15%',
          left: '3%',
          background: 'radial-gradient(circle, rgba(90,107,82,0.22) 0%, rgba(184,149,110,0.12) 50%, transparent 80%)',
          animation: 'float 22s ease-in-out infinite reverse',
          opacity: 0.3,
        }}
      />
      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '140px',
          height: '140px',
          top: '40%',
          left: '12%',
          background: 'radial-gradient(circle, rgba(139,99,92,0.18) 0%, transparent 70%)',
          animation: 'float 16s ease-in-out infinite',
          opacity: 0.28,
        }}
      />

      <div
        className="absolute rounded-full pointer-events-none"
        style={{
          width: '900px',
          height: '900px',
          top: '50%',
          left: '50%',
          transform: `translate(-50%, -50%) translate(${mousePosition.x}px, ${mousePosition.y}px)`,
          background: 'radial-gradient(circle, rgba(181,74,58,0.08) 0%, rgba(139,99,92,0.05) 40%, transparent 70%)',
          transition: 'transform 0.4s ease-out',
        }}
      />

      <div
        className="absolute top-0 bottom-0 w-8 md:w-16 z-20"
        style={{
          left: 0,
          background: 'linear-gradient(to right, rgba(139,99,92,0.12), rgba(139,99,92,0.03), transparent)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      />
      <div
        className="absolute top-0 bottom-0 w-8 md:w-16 z-20"
        style={{
          right: 0,
          background: 'linear-gradient(to left, rgba(139,99,92,0.12), rgba(139,99,92,0.03), transparent)',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 1s ease',
        }}
      />

      <div
        className="relative z-10 max-w-5xl mx-auto"
        style={{
          clipPath: mounted ? 'inset(0 0 0 0)' : 'inset(0 50% 0 50%)',
          transition: 'clip-path 1.3s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        {/* 左侧装饰文字 */}
        <div
          className="absolute -left-16 md:-left-28 top-1/3 hidden lg:block"
          style={{
            opacity: mounted ? 0.2 : 0,
            transform: mounted ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s',
          }}
        >
          <VerticalText className="text-[14px] md:text-[16px]" style={{ color: '#8B5E3C' }}>
            笔墨春秋
          </VerticalText>
        </div>

        {/* 右侧装饰文字 */}
        <div
          className="absolute -right-16 md:-right-28 top-1/3 hidden lg:block"
          style={{
            opacity: mounted ? 0.2 : 0,
            transform: mounted ? 'translateX(0)' : 'translateX(20px)',
            transition: 'all 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.8s',
          }}
        >
          <VerticalText className="text-[14px] md:text-[16px]" style={{ color: '#8B5E3C' }}>
            源远流长
          </VerticalText>
        </div>

        {/* 主内容区域 - 左对齐布局 */}
        <div className="flex flex-col items-start text-left pl-4 md:pl-12">
          <div
            className="mb-12"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.3s',
            }}
          >
            <RedSeal text="彩笺寄" size="large" />
          </div>

          <div
            className="mb-8"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(40px)',
              transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.5s',
            }}
          >
            <VerticalText
              className="text-[52px] md:text-[76px] lg:text-[96px]"
              style={{
                background: 'linear-gradient(180deg, #1C1816 0%, #8B5E3C 55%, #B54A3A 100%)',
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.1em',
              }}
            >
              彩笺寄
            </VerticalText>
          </div>

          <div
            className="w-20 md:w-28 mb-10"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateX(0)' : 'translateX(-30px)',
              transition: 'all 0.8s cubic-bezier(0.22, 1, 0.36, 1) 0.7s',
            }}
          >
            <BrushStroke />
          </div>

          <div
            className="mb-14 max-w-xl"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.9s',
            }}
          >
            <p
              className="text-[16px] md:text-[18px] tracking-[0.4em] mb-6"
              style={{
                fontFamily: 'Noto Serif SC, serif',
                color: '#4A4A4A',
                fontWeight: 500,
              }}
            >
              以墨香古韵，助学术耕耘
            </p>
            <div className="w-16 h-px mb-6" style={{ background: 'linear-gradient(90deg, rgba(181,74,58,0.4), transparent)' }} />
            <p
              className="text-[14px] md:text-[15px] leading-[2]"
              style={{
                fontFamily: 'Noto Serif SC, serif',
                color: '#7A7068',
                fontWeight: 300,
              }}
            >
              AI 学术写作规划，让长周期学术写作有章可循。
              <br />
              本地运行，保护隐私。
            </p>
          </div>

          <div
            className="flex flex-col sm:flex-row items-start gap-5"
            style={{
              opacity: mounted ? 1 : 0,
              transform: mounted ? 'translateY(0)' : 'translateY(30px)',
              transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 1.1s',
            }}
          >
            <Link href="/login" className="btn-cinnabar">
              <span>开启书卷</span>
            </Link>
            <Link href="#features" className="btn-calligraphy">
              <span>了解更多</span>
            </Link>
          </div>
        </div>

        {/* 右下角装饰 */}
        <div
          className="absolute bottom-8 right-8 md:right-12 hidden md:flex flex-col items-end gap-2"
          style={{
            opacity: mounted ? 0.15 : 0,
            transition: 'opacity 1.5s ease 1.5s',
          }}
        >
          <span
            className="text-[10px] tracking-[0.2em]"
            style={{ color: '#8B5E3C', fontFamily: 'Noto Serif SC, serif' }}
          >
            学术之道
          </span>
          <span
            className="text-[10px] tracking-[0.2em]"
            style={{ color: '#8B5E3C', fontFamily: 'Noto Serif SC, serif' }}
          >
            始于笔墨
          </span>
        </div>

        {/* 底部居中的滚动提示 */}
        <div
          className="absolute -bottom-16 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 1s ease 1.5s',
          }}
        >
          <span
            className="text-[11px] tracking-[0.3em]"
            style={{ color: '#8A8A8A', fontFamily: 'Noto Serif SC, serif' }}
          >
            向下滚动
          </span>
          <div
            className="w-px h-10"
            style={{
              background: 'linear-gradient(to bottom, rgba(28,24,22,0.15), transparent)',
              animation: 'float 2.5s ease-in-out infinite',
            }}
          />
        </div>
      </div>
    </section>
  )
}
