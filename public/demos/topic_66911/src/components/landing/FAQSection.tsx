'use client'

import { useState } from 'react'

const faqs = [
  {
    q: '彩笺寄支持哪些论文格式？',
    a: '我们支持 LaTeX（.tex 文件夹）、Markdown 和纯文本格式。LaTeX 项目会自动识别 main.tex 和项目结构。',
  },
  {
    q: '我的论文内容会被上传到服务器吗？',
    a: '不会。所有处理都在本地完成，你的论文永远不会离开你的电脑。我们使用 Ollama 在本地运行 AI 模型，确保学术隐私。',
  },
  {
    q: '需要安装什么软件吗？',
    a: '只需要安装 Ollama（用于运行本地 AI 模型）和彩笺寄桌面应用。详细的安装指南可以在我们的文档中找到。',
  },
  {
    q: '支持哪些 AI 模型？',
    a: '彩笺寄支持主流的开源模型，如 Llama 3、Qwen、Mistral 等。你可以根据硬件配置选择合适的模型。',
  },
  {
    q: '可以离线使用吗？',
    a: '可以。只要你已经在本地部署了 AI 模型，彩笺寄完全可以离线工作，非常适合需要保密的学术环境。',
  },
  {
    q: '如何获取技术支持？',
    a: '你可以通过 GitHub Issues 提交问题，或者加入我们的用户社区。我们会尽快回复你的问题。',
  },
]

interface FAQ {
  q: string
  a: string
}

function FAQItem({ faq, index, isOpen, onToggle }: { faq: FAQ; index: number; isOpen: boolean; onToggle: (index: number) => void }) {
  return (
    <div
      className="relative transition-all duration-300"
      style={{
        borderBottom: index < faqs.length - 1 ? '1px solid rgba(28,24,22,0.06)' : 'none',
      }}
    >
      <button
        className="w-full px-6 py-6 flex items-center justify-between gap-4 cursor-pointer text-left"
        onClick={() => onToggle(index)}
      >
        <div className="flex items-center gap-4">
          <span
            className="text-[16px] flex-shrink-0"
            style={{
              fontFamily: 'Ma Shan Zheng, cursive',
              color: '#8B5E3C',
            }}
          >
            {['壹', '贰', '叁', '肆', '伍', '陆'][index]}
          </span>
          <span
            className="text-[15px] md:text-[16px]"
            style={{
              color: '#1C1816',
              fontFamily: 'Noto Serif SC, serif',
            }}
          >
            {faq.q}
          </span>
        </div>
        <span
          className="text-[20px] transition-transform duration-300 flex-shrink-0"
          style={{
            color: '#8B5E3C',
            transform: isOpen ? 'rotate(45deg)' : 'rotate(0deg)',
            fontFamily: 'Ma Shan Zheng, cursive',
          }}
        >
          +
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-400 ${isOpen ? 'max-h-60' : 'max-h-0'}`}
      >
        <div className="px-6 pb-6 pl-14">
          <p
            className="text-[14px] md:text-[15px] leading-[2.1]"
            style={{ color: '#7A7068', fontFamily: 'Noto Serif SC, serif' }}
          >
            {faq.a}
          </p>
        </div>
      </div>
    </div>
  )
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="relative py-24 md:py-36 px-6 md:px-12"
      style={{ backgroundColor: '#FDFBF6' }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />
      <div className="absolute inset-0 ink-wash-section pointer-events-none" />

      <div className="relative z-10 text-center mb-20 md:mb-28">
        <div className="flex justify-center mb-8">
          <svg className="w-24 md:w-32" viewBox="0 0 100 4" preserveAspectRatio="none">
            <path
              d="M0,2 Q25,0 50,2 T100,2"
              stroke="rgba(28,24,22,0.08)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4,2"
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
          解惑
        </h2>

        <p
          className="text-[14px] md:text-[16px] tracking-[0.4em]"
          style={{ color: '#8A8A8A' }}
        >
          学者常问之事
        </p>

        <div className="flex justify-center mt-8">
          <svg className="w-24 md:w-32" viewBox="0 0 100 4" preserveAspectRatio="none">
            <path
              d="M0,2 Q25,4 50,2 T100,2"
              stroke="rgba(28,24,22,0.08)"
              strokeWidth="1"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="4,2"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 max-w-2xl mx-auto">
        <div
          className="glass-card-hover rounded-2xl overflow-hidden"
          style={{
            backgroundColor: 'rgba(255,255,255,0.8)',
          }}
        >
          {faqs.map((faq, index) => (
            <FAQItem
              key={index}
              faq={faq}
              index={index}
              isOpen={openIndex === index}
              onToggle={setOpenIndex}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
