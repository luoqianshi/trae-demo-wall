'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

function RedSeal({ text }: { text: string }) {
  return (
    <div
      className="border-2 flex items-center justify-center"
      style={{
        width: '56px',
        height: '56px',
        borderColor: '#B8956E',
        backgroundColor: 'rgba(184,149,110,0.08)',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: 'Ma Shan Zheng, cursive',
          color: '#B8956E',
          fontSize: '16px',
          letterSpacing: '0.15em',
        }}
      >
        {text}
      </span>
    </div>
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

function GlowRing({ size, opacity, delay }: { size: number; opacity: number; delay: number }) {
  return (
    <div
      className="absolute rounded-full"
      style={{
        width: `${size}px`,
        height: `${size}px`,
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        border: '1px solid rgba(184,149,110,0.1)',
        opacity: opacity,
        animation: `glowPulse ${5 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}

export default function CTASection() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  return (
    <section
      className="relative py-24 md:py-40 px-6 overflow-hidden"
      style={{ backgroundColor: '#1C1816' }}
    >
      <div className="absolute inset-0">
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 0%, rgba(184,149,110,0.1) 0%, transparent 50%)',
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            background: 'radial-gradient(ellipse at 50% 100%, rgba(139,99,92,0.08) 0%, transparent 45%)',
          }}
        />
      </div>

      <GlowRing size={500} opacity={mounted ? 0.4 : 0} delay={0} />
      <GlowRing size={700} opacity={mounted ? 0.25 : 0} delay={1.5} />
      <GlowRing size={900} opacity={mounted ? 0.12 : 0} delay={3} />

      <div className="relative z-10 max-w-4xl mx-auto text-center">
        <div
          className="flex justify-center mb-12"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.8s ease 0.2s',
          }}
        >
          <RedSeal text="启程" />
        </div>

        <div
          className="mb-10"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.4s',
          }}
        >
          <VerticalText
            className="text-[48px] md:text-[72px] lg:text-[88px] mx-auto"
            style={{
              background: 'linear-gradient(180deg, #D4B996 0%, #B8956E 40%, #8B5E3C 100%)',
              WebkitBackgroundClip: 'text',
              backgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.15em',
            }}
          >
            开启学术之旅
          </VerticalText>
        </div>

        <p
          className="text-[14px] md:text-[16px] max-w-xl mx-auto mb-16"
          style={{
            color: '#A09890',
            lineHeight: '2.2',
            fontFamily: 'Noto Serif SC, serif',
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.6s',
          }}
        >
          AI 辅助，让学术写作不再困难。本地运行，保护您的隐私。
        </p>

        <div
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
          style={{
            opacity: mounted ? 1 : 0,
            transform: mounted ? 'translateY(0)' : 'translateY(30px)',
            transition: 'all 1s cubic-bezier(0.22, 1, 0.36, 1) 0.8s',
          }}
        >
          <Link
            href="/login"
            className="btn-gold"
          >
            <span>立即体验</span>
          </Link>
          <Link
            href="#features"
            className="btn-outline-light"
          >
            <span>了解更多</span>
          </Link>
        </div>

        <div
          className="flex justify-center gap-12 mt-20 md:mt-28"
          style={{
            opacity: mounted ? 1 : 0,
            transition: 'opacity 1s ease 1s',
          }}
        >
          {['简洁', '智能', '安全'].map((item) => (
            <div key={item} className="text-center">
              <span
                className="text-[12px] tracking-[0.3em] block mb-2"
                style={{ color: '#6A6560' }}
              >
                核心价值
              </span>
              <span
                className="text-[18px]"
                style={{
                  fontFamily: 'Ma Shan Zheng, cursive',
                  color: '#B8956E',
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(184,149,110,0.2), transparent)',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(184,149,110,0.2), transparent)',
        }}
      />
    </section>
  )
}
