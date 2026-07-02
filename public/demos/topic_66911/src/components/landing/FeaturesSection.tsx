'use client'

import { useEffect, useRef, useState } from 'react'
import { Sparkles, BookOpen, MessageSquare, FileText, GitBranch, Shield } from 'lucide-react'

interface Feature {
  icon: typeof Sparkles
  title: string
  subtitle: string
  description: string
  seal: string
}

const features: Feature[] = [
  {
    icon: Sparkles,
    title: '丹青妙笔',
    subtitle: '智能润色',
    description: 'AI 驱动的学术语言润色，使文章文采斐然',
    seal: '妙',
  },
  {
    icon: BookOpen,
    title: '经史子集',
    subtitle: '文献综述',
    description: 'arXiv 实时检索，海量学术文献尽在掌握',
    seal: '博',
  },
  {
    icon: MessageSquare,
    title: '论道',
    subtitle: 'AI 对话',
    description: '多模型协同，深入探讨学术问题',
    seal: '智',
  },
  {
    icon: FileText,
    title: '成文',
    subtitle: '论文写作',
    description: '从大纲到正文，AI 辅助撰写',
    seal: '成',
  },
  {
    icon: GitBranch,
    title: '溯源',
    subtitle: '版本控制',
    description: '智能版本追踪，回溯每一次修改',
    seal: '迹',
  },
  {
    icon: Shield,
    title: '守秘',
    subtitle: '隐私保护',
    description: '本地运行，数据永不离开您的设备',
    seal: '安',
  },
]

function RedSeal({ text }: { text: string }) {
  return (
    <div
      className="border-2 flex items-center justify-center"
      style={{
        width: '36px',
        height: '36px',
        borderColor: '#B54A3A',
        backgroundColor: 'rgba(181,74,58,0.06)',
        boxShadow: '0 2px 8px rgba(181,74,58,0.1)',
      }}
    >
      <span
        className="font-bold"
        style={{
          fontFamily: 'Ma Shan Zheng, cursive',
          color: '#B54A3A',
          fontSize: '12px',
          letterSpacing: '0.1em',
        }}
      >
        {text}
      </span>
    </div>
  )
}

function FeatureItem({ feature, index }: { feature: Feature; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { threshold: 0.15 }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  const Icon = feature.icon

  return (
    <div
      ref={ref}
      className="glass-card-hover rounded-2xl p-6 md:p-8 h-full flex flex-col"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.8s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.12}s`,
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-start gap-4">
          <div
            className="flex-shrink-0 w-14 h-14 flex items-center justify-center rounded-xl"
            style={{
              backgroundColor: 'rgba(139,99,92,0.06)',
              border: '1px solid rgba(139,99,92,0.1)',
              boxShadow: '0 4px 20px rgba(139,99,92,0.08)',
            }}
          >
            <Icon className="w-6 h-6" style={{ color: '#8B5E3C' }} />
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <h3
              className="text-[28px] md:text-[34px] whitespace-nowrap"
              style={{
                fontFamily: 'Ma Shan Zheng, cursive',
                color: '#1C1816',
              }}
            >
              {feature.title}
            </h3>
            <span
              className="text-[10px] tracking-[0.3em] px-3 py-1 rounded-full"
              style={{
                color: '#B54A3A',
                border: '1px solid rgba(181,74,58,0.2)',
                backgroundColor: 'rgba(181,74,58,0.04)',
                width: 'fit-content',
              }}
            >
              {feature.subtitle}
            </span>
          </div>
        </div>

        <div className="flex-shrink-0">
          <RedSeal text={feature.seal} />
        </div>
      </div>

      <p
        className="text-[14px] md:text-[15px] leading-[2.2] flex-1"
        style={{ color: '#5A5A5A' }}
      >
        {feature.description}
      </p>
    </div>
  )
}

export default function FeaturesSection() {
  return (
    <section
      id="features"
      className="relative py-20 md:py-32 px-6 md:px-12"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />
      <div className="absolute inset-0 ink-wash-section pointer-events-none" />

      <div className="relative z-10 text-center mb-16 md:mb-24">
        <div className="flex justify-center mb-8">
          <svg className="w-20 md:w-28" viewBox="0 0 100 6" preserveAspectRatio="none">
            <path
              d="M0,3 Q25,0 50,3 T100,3"
              stroke="rgba(28,24,22,0.08)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5,3"
            />
          </svg>
        </div>

        <h2
          className="text-[36px] md:text-[52px] lg:text-[60px] mb-6"
          style={{
            fontFamily: 'Ma Shan Zheng, cursive',
            background: 'linear-gradient(135deg, #1C1816 0%, #8B5E3C 55%, #B54A3A 100%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          六艺
        </h2>

        <p
          className="text-[14px] md:text-[15px] tracking-[0.4em]"
          style={{ color: '#8A8A8A' }}
        >
          六种技艺，助您完成学术创作
        </p>

        <div className="flex justify-center mt-8">
          <svg className="w-20 md:w-28" viewBox="0 0 100 6" preserveAspectRatio="none">
            <path
              d="M0,3 Q25,6 50,3 T100,3"
              stroke="rgba(28,24,22,0.08)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="5,3"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <FeatureItem key={feature.title} feature={feature} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
