'use client'

import { useEffect, useRef, useState } from 'react'
import { FileSearch, Layout, PenTool, Sparkles } from 'lucide-react'

interface Step {
  icon: typeof FileSearch
  step: string
  title: string
  description: string
}

const steps: Step[] = [
  {
    icon: FileSearch,
    step: '壹',
    title: '选题',
    description: '探索研究方向，确定论文主题',
  },
  {
    icon: Layout,
    step: '贰',
    title: '谋篇',
    description: '构建大纲，规划文章结构',
  },
  {
    icon: PenTool,
    step: '叁',
    title: '撰写',
    description: '逐段撰写，AI 辅助润色',
  },
  {
    icon: Sparkles,
    step: '肆',
    title: '定稿',
    description: '反复推敲，完成学术创作',
  },
]

function InkSeparator() {
  return (
    <div className="hidden md:block flex-shrink-0 mx-4">
      <svg className="w-6 h-32" viewBox="0 0 24 128" preserveAspectRatio="none">
        <path
          d="M12,0 Q16,16 12,32 Q8,48 12,64 Q16,80 12,96 Q8,112 12,128"
          stroke="rgba(28,24,22,0.06)"
          strokeWidth="1"
          fill="none"
          strokeLinecap="round"
          strokeDasharray="4,4"
        />
      </svg>
    </div>
  )
}

function StepItem({ step, index }: { step: Step; index: number }) {
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

  const Icon = step.icon

  return (
    <div
      ref={ref}
      className="flex flex-col items-center text-center md:text-left md:flex-row gap-5"
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.6s cubic-bezier(0.22, 1, 0.36, 1) ${index * 0.15}s`,
      }}
    >
      <div className="relative">
        <div
          className="w-20 h-20 md:w-24 md:h-24 flex items-center justify-center rounded-full"
          style={{
            backgroundColor: 'rgba(139,99,92,0.03)',
            border: '1px solid rgba(139,99,92,0.1)',
          }}
        >
          <Icon className="w-7 h-7 md:w-8 md:h-8" style={{ color: '#8B5E3C' }} />
        </div>
        <span
          className="absolute -top-1 -right-1 w-7 h-7 flex items-center justify-center rounded-full text-[10px] font-bold"
          style={{
            backgroundColor: '#B54A3A',
            color: '#FFFFFF',
            fontFamily: 'Ma Shan Zheng, cursive',
          }}
        >
          {step.step}
        </span>
      </div>

      <div className="flex-1 min-w-0">
        <h3
          className="text-[28px] md:text-[32px] mb-2"
          style={{
            fontFamily: 'Ma Shan Zheng, cursive',
            color: '#1C1816',
          }}
        >
          {step.title}
        </h3>
        <p
          className="text-[14px] md:text-[15px]"
          style={{ color: '#7A7068', lineHeight: '1.9' }}
        >
          {step.description}
        </p>
      </div>

      <InkSeparator />
    </div>
  )
}

export default function WorkflowSection() {
  return (
    <section
      className="relative py-20 md:py-32 px-6 md:px-12"
      style={{ backgroundColor: '#FDFBF6' }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16 md:mb-24">
          <span
            className="text-[12px] tracking-[0.5em] block mb-4"
            style={{ color: '#8A8A8A' }}
          >
            创作流程
          </span>

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
            四步成章
          </h2>

          <p
            className="text-[14px] md:text-[15px] max-w-xl mx-auto"
            style={{ color: '#7A7068', lineHeight: '2' }}
          >
            从选题到定稿，循序渐进，让学术写作不再困难
          </p>
        </div>

        <div className="relative">
          <div
            className="hidden md:block absolute top-12 bottom-12 left-1/2 w-px"
            style={{
              background: 'linear-gradient(to bottom, rgba(139,99,92,0.1), rgba(139,99,92,0.03))',
              transform: 'translateX(-50%)',
            }}
          />

          <div className="grid md:grid-cols-2 gap-8 md:gap-12">
            {steps.map((step, index) => (
              <StepItem key={step.step} step={step} index={index} />
            ))}
          </div>
        </div>

        <div className="flex justify-center mt-16">
          <svg className="w-32 md:w-44" viewBox="0 0 160 8" preserveAspectRatio="none">
            <path
              d="M0,4 Q40,1 80,4 T160,4"
              stroke="rgba(28,24,22,0.06)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="6,3"
            />
          </svg>
        </div>
      </div>
    </section>
  )
}
