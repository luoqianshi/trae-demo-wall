'use client'

import { useState } from 'react'

const showcases = [
  {
    id: 'outline',
    title: '大纲规划',
    description: '智能生成论文大纲，结构清晰',
    content: (
      <div className="h-full flex flex-col justify-center px-6 py-8">
        <div className="space-y-4">
          {['摘要', '引言', '文献综述', '研究方法', '实验结果', '讨论', '结论'].map((item, i) => (
            <div
              key={item}
              className="flex items-center gap-4 p-3 rounded-lg"
              style={{
                backgroundColor: 'rgba(139,99,92,0.03)',
                borderLeft: '2px solid rgba(139,99,92,0.15)',
                animation: `fadeInLeft 0.4s ease-out ${i * 0.1}s both`,
              }}
            >
              <span
                className="text-[10px] w-6 h-6 flex items-center justify-center rounded-full"
                style={{
                  backgroundColor: '#8B5E3C',
                  color: '#FFFFFF',
                  fontFamily: 'Ma Shan Zheng, cursive',
                }}
              >
                {i + 1}
              </span>
              <span
                className="text-[15px]"
                style={{
                  fontFamily: 'Noto Serif SC, serif',
                  color: '#4A4A4A',
                }}
              >
                {item}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'writing',
    title: 'AI 撰写',
    description: '逐段辅助，文采斐然',
    content: (
      <div className="h-full flex flex-col justify-center px-6 py-8">
        <div className="space-y-3">
          {[
            { label: '输入主题', value: '基于深度学习的图像识别研究' },
            { label: 'AI 建议', value: '建议从卷积神经网络的发展历程入手，结合Transformer架构的最新进展...' },
            { label: '生成段落', value: '近年来，深度学习技术在计算机视觉领域取得了突破性进展...' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-lg"
              style={{
                backgroundColor: 'rgba(181,74,58,0.03)',
                animation: `fadeInRight 0.4s ease-out ${i * 0.15}s both`,
              }}
            >
              <span
                className="text-[11px] tracking-[0.2em] block mb-2"
                style={{ color: '#8B5E3C' }}
              >
                {item.label}
              </span>
              <p
                className="text-[14px] leading-[1.8]"
                style={{
                  fontFamily: 'Noto Serif SC, serif',
                  color: '#5A5A5A',
                }}
              >
                {item.value}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
  {
    id: 'review',
    title: '文献检索',
    description: 'arXiv 实时检索',
    content: (
      <div className="h-full flex flex-col justify-center px-6 py-8">
        <div className="space-y-4">
          {[
            { title: 'Attention Is All You Need', year: '2017', authors: 'Vaswani et al.' },
            { title: 'BERT: Pre-training of Deep Bidirectional Transformers...', year: '2018', authors: 'Devlin et al.' },
            { title: 'Vision Transformer', year: '2021', authors: 'Dosovitskiy et al.' },
          ].map((item, i) => (
            <div
              key={i}
              className="p-4 rounded-lg border"
              style={{
                backgroundColor: '#FFFFFF',
                borderColor: 'rgba(28,24,22,0.06)',
                animation: `fadeInUp 0.4s ease-out ${i * 0.12}s both`,
              }}
            >
              <div className="flex items-center gap-3 mb-2">
                <span
                  className="text-[10px] px-2 py-0.5 rounded"
                  style={{
                    backgroundColor: 'rgba(184,149,110,0.1)',
                    color: '#8B5E3C',
                  }}
                >
                  {item.year}
                </span>
                <span
                  className="text-[12px]"
                  style={{ color: '#8A8A8A' }}
                >
                  {item.authors}
                </span>
              </div>
              <p
                className="text-[14px] leading-[1.7]"
                style={{
                  fontFamily: 'Noto Serif SC, serif',
                  color: '#3A3A3A',
                }}
              >
                {item.title}
              </p>
            </div>
          ))}
        </div>
      </div>
    ),
  },
]

export default function ShowcaseSection() {
  const [activeTab, setActiveTab] = useState('outline')

  const activeShowcase = showcases.find(s => s.id === activeTab)

  return (
    <section
      className="relative py-20 md:py-32 px-6 md:px-12"
      style={{ backgroundColor: '#FAFAF8' }}
    >
      <div className="absolute inset-0 paper-texture pointer-events-none" />

      <div className="relative z-10 max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <span
            className="text-[12px] tracking-[0.5em] block mb-4"
            style={{ color: '#8A8A8A' }}
          >
            功能展示
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
            预览
          </h2>

          <p
            className="text-[14px] md:text-[15px] max-w-xl mx-auto"
            style={{ color: '#7A7068', lineHeight: '2' }}
          >
            体验 AI 学术写作的核心功能
          </p>
        </div>

        <div className="flex justify-center gap-4 md:gap-6 mb-10">
          {showcases.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-6 py-3 rounded-full text-[14px] tracking-[0.2em] transition-all duration-300 ${activeTab === tab.id
                  ? 'bg-ink text-white'
                  : 'bg-white/60 text-ink-soft border border-ink-light hover:bg-white/80'
                }`}
            >
              {tab.title}
            </button>
          ))}
        </div>

        <div
          className="glass-card-hover rounded-2xl overflow-hidden"
          style={{
            minHeight: '360px',
            backgroundColor: 'rgba(255,255,255,0.9)',
          }}
        >
          <div
            className="flex items-center px-6 py-4 border-b"
            style={{
              borderColor: 'rgba(28,24,22,0.06)',
              backgroundColor: 'rgba(139,99,92,0.02)',
            }}
          >
            <div className="flex gap-2">
              {['#1C1816', '#8B5E3C', '#B54A3A'].map((color, i) => (
                <div
                  key={i}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: color }}
                />
              ))}
            </div>
            <span
              className="ml-4 text-[13px]"
              style={{ color: '#8A8A8A', fontFamily: 'Noto Serif SC, serif' }}
            >
              {activeShowcase?.description}
            </span>
          </div>

          <div className="min-h-[300px]">
            {activeShowcase?.content}
          </div>
        </div>
      </div>
    </section>
  )
}
