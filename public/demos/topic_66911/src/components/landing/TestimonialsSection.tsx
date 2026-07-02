'use client'

import { useEffect, useRef, useState } from 'react'

interface Testimonial {
  quote: string
  author: string
  title: string
  avatar: string
}

const testimonials: Testimonial[] = [
  {
    quote: '彩笺寄让我摆脱了繁琐的参考文献管理，真正的学术写作神器',
    author: '张明远',
    title: '清华大学 · 博士研究生',
    avatar: 'zm',
  },
  {
    quote: 'arXiv 实时检索和 AI 润色结合，让我的综述写作效率提升三倍',
    author: '李思源',
    title: '北京大学 · 计算机科学',
    avatar: 'ls',
  },
  {
    quote: '本地运行保护隐私，这是学术工具最重要的特性',
    author: '王雅文',
    title: '复旦大学 · 教授',
    avatar: 'wy',
  },
]

function RedSeal({ text }: { text: string }) {
  return (
    <div
      className="border-2 flex items-center justify-center"
      style={{
        width: '28px',
        height: '28px',
        borderColor: '#B54A3A',
        backgroundColor: 'rgba(181,74,58,0.06)',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: 'Ma Shan Zheng, cursive',
          color: '#B54A3A',
          fontSize: '10px',
          letterSpacing: '0.1em',
        }}
      >
        {text}
      </span>
    </div>
  )
}

function BrushStrokeDivider() {
  return (
    <div className="flex justify-center my-12">
      <svg className="w-24 md:w-32" viewBox="0 0 100 4" preserveAspectRatio="none">
        <path
          d="M0,2 Q25,0 50,2 T100,2"
          stroke="rgba(28,24,22,0.06)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="5,3"
        />
      </svg>
    </div>
  )
}

function TestimonialItem({ testimonial, index }: { testimonial: Testimonial; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.2 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  // 交错布局 - 奇数左对齐，偶数右对齐
  const isLeft = index % 2 === 0
  const isLarge = index === 1 // 中间那个卡片更大

  return (
    <div
      ref={ref}
      className={`relative p-8 ${isLarge ? 'lg:scale-105' : ''}`}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible
          ? isLeft ? 'translateY(0) translateX(0)' : 'translateY(0)'
          : isLeft ? 'translateY(30px) translateX(-15px)' : 'translateY(30px) translateX(15px)',
        transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.15}s`,
      }}
    >
      <div
        className="glass-card-hover rounded-2xl p-8 md:p-10 h-full"
        style={{
          backgroundColor: isLarge ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.6)',
          border: isLarge ? '1px solid rgba(181,74,58,0.12)' : '1px solid rgba(139,99,92,0.08)',
        }}
      >
        <div className={`flex flex-col ${isLarge ? 'md:flex-row' : ''} items-center gap-6`}>
          <div className="flex-shrink-0">
            <div
              className="w-14 h-14 md:w-16 md:h-16 flex items-center justify-center text-[14px] md:text-[16px] font-bold rounded-full"
              style={{
                backgroundColor: 'rgba(139,99,92,0.06)',
                color: '#B54A3A',
                border: '2px solid rgba(181,74,58,0.2)',
                fontFamily: 'Ma Shan Zheng, cursive',
              }}
            >
              {testimonial.avatar.toUpperCase()}
            </div>
          </div>

          <div className="flex-1 text-center md:text-left">
            <p
              className="text-[15px] md:text-[16px] lg:text-[17px] leading-[2.2] tracking-wide mb-6"
              style={{
                color: '#4A4A4A',
                fontFamily: 'Noto Serif SC, serif',
              }}
            >
              「{testimonial.quote}」
            </p>

            <div className={`flex items-center ${isLeft ? 'md:flex-row' : 'md:flex-row-reverse'} gap-4`}>
              <div className="flex-1">
                <div className="w-12 h-px mb-4" style={{
                  background: isLeft
                    ? 'linear-gradient(90deg, rgba(181,74,58,0.3), transparent)'
                    : 'linear-gradient(90deg, transparent, rgba(181,74,58,0.3))'
                }} />
                <p
                  className="text-[15px] font-medium"
                  style={{ color: '#1C1816', fontFamily: 'Noto Serif SC, serif' }}
                >
                  {testimonial.author}
                </p>
                <p className="text-[12px] mt-1" style={{ color: '#8A8A8A' }}>
                  {testimonial.title}
                </p>
              </div>
              <RedSeal text="言" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function TestimonialsSection() {
  return (
    <section
      id="testimonials"
      className="relative py-24 md:py-36 px-6 md:px-12"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />
      <div className="absolute inset-0 ink-wash-bg pointer-events-none" />

      <div className="relative z-10 text-center mb-20 md:mb-28">
        <div className="flex justify-center mb-8">
          <svg className="w-24 md:w-32" viewBox="0 0 100 4" preserveAspectRatio="none">
            <path
              d="M0,2 Q25,0 50,2 T100,2"
              stroke="rgba(28,24,22,0.08)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5,3"
            />
          </svg>
        </div>

        <h2
          className="text-[36px] md:text-[48px] lg:text-[56px] mb-6"
          style={{
            fontFamily: 'Ma Shan Zheng, cursive',
            background: 'linear-gradient(135deg, #1C1816 0%, #8B5E3C 55%, #B54A3A 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          学者心声
        </h2>

        <p
          className="text-[14px] md:text-[16px] tracking-[0.4em]"
          style={{ color: '#8A8A8A' }}
        >
          他们用彩笺寄完成了学术突破
        </p>

        <div className="flex justify-center mt-8">
          <svg className="w-24 md:w-32" viewBox="0 0 100 4" preserveAspectRatio="none">
            <path
              d="M0,2 Q25,4 50,2 T100,2"
              stroke="rgba(28,24,22,0.08)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5,3"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {testimonials.map((testimonial, index) => (
            <TestimonialItem key={testimonial.author} testimonial={testimonial} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
