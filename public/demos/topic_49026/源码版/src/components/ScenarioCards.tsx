import { useState, useEffect } from 'react'
import { Briefcase, Compass, HeartPulse, Network, ChevronRight, Sparkles, Brain, Users, BookOpen } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'

/**
 * 痛点场景卡片
 * 4 个场景直达用户核心痛点，展示衡舟的企业级技术降维能力
 */

interface ScenarioCard {
  id: string
  icon: typeof Briefcase
  title: string
  question: string
  tags: string[]
  color: string
  techBadge?: string // 企业级技术亮点标识
}

const SCENARIOS: ScenarioCard[] = [
  {
    id: 'workplace',
    icon: Briefcase,
    title: '职场冲突',
    question: '王思亮上周在会上说运营数据不够亮眼，我该怎么应对？',
    tags: ['RAG检索', '多人物上下文'],
    color: 'from-zen-amber to-zen-sage',
  },
  {
    id: 'relationship-chain',
    icon: Network,
    title: '人脉推理',
    question: '我想找杭州云启科技的技术负责人，通过谁可以搭上关系？',
    tags: ['GraphRAG', '知识图谱', '3跳推理'],
    color: 'from-zen-sage to-zen-amber',
    techBadge: 'GraphRAG',
  },
  {
    id: 'decision',
    icon: Compass,
    title: '人生抉择',
    question: '张伟华又催我创业了，但我怕时机不对，帮我分析下',
    tags: ['Agentic RAG', '多维信息综合', '盲区识别'],
    color: 'from-zen-amber to-zen-sage',
    techBadge: 'Agentic RAG',
  },
  {
    id: 'relationship',
    icon: HeartPulse,
    title: '关系诊断',
    question: '最近跟晓薇的关系好像有点疏远，帮我看看是怎么回事',
    tags: ['因果推理链', '关系温度计', '轨迹预测'],
    color: 'from-zen-sage to-zen-amber',
    techBadge: '因果分析',
  },
]

interface ScenarioCardsProps {
  onSelect: (question: string) => void
  visible: boolean
}

export function ScenarioCards({ onSelect, visible }: ScenarioCardsProps) {
  const [mounted, setMounted] = useState(false)
  const memories = useDataStore((s) => s.memories)
  const persons = useDataStore((s) => s.persons)
  const diaries = useDataStore((s) => s.diaries)

  useEffect(() => {
    if (visible) {
      const timer = setTimeout(() => setMounted(true), 100)
      return () => clearTimeout(timer)
    } else {
      setMounted(false)
    }
  }, [visible])

  if (!visible) return null

  // 过滤掉 SELF 人物
  const realPersonCount = persons.filter((p) => p.id !== 'p-self').length

  return (
    <div className="space-y-2.5 px-2" data-guide="scenario-cards">
      <div className="text-center mb-3">
        <div className="w-14 h-14 rounded-full bg-gradient-to-br from-zen-amber to-zen-sage flex items-center justify-center mb-3 shadow-sm mx-auto">
          <span className="text-xl text-white font-serif">舟</span>
        </div>
        <p className="text-sm text-ink-secondary mb-0.5">你好，我是衡舟</p>
        <p className="text-xs text-ink-muted">试试这些场景，感受"被记住"的力量</p>
        {/* 数据概览 — 让评委立刻感知"这不是空壳" */}
        <div className={`inline-flex items-center gap-2.5 mt-2 px-3 py-1 rounded-full bg-surface/80 border border-ink-muted/10 transition-all duration-500 ${mounted ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}>
          <span className="inline-flex items-center gap-1 text-2xs text-ink-secondary">
            <Brain className="w-2.5 h-2.5 text-zen-terracotta" />
            {memories.length} 条记忆
          </span>
          <span className="text-ink-muted/30">·</span>
          <span className="inline-flex items-center gap-1 text-2xs text-ink-secondary">
            <Users className="w-2.5 h-2.5 text-zen-indigo" />
            {realPersonCount} 个人物
          </span>
          <span className="text-ink-muted/30">·</span>
          <span className="inline-flex items-center gap-1 text-2xs text-ink-secondary">
            <BookOpen className="w-2.5 h-2.5 text-zen-sage" />
            {diaries.length} 篇日记
          </span>
        </div>
      </div>

      {SCENARIOS.map((scenario, index) => {
        const Icon = scenario.icon
        return (
          <button
            key={scenario.id}
            onClick={() => onSelect(scenario.question)}
            className={`w-full text-left p-3 rounded-xl bg-surface border border-ink-muted/15 hover:border-zen-sage/40 hover:shadow-sm transition-all duration-300 group ${
              mounted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
            }`}
            style={{
              transitionDelay: mounted ? `${index * 100}ms` : '0ms',
            }}
          >
            <div className="flex items-start gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${scenario.color} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                <Icon className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-xs font-semibold text-ink-primary">{scenario.title}</span>
                  {scenario.techBadge && (
                    <span className="text-[10px] px-1 py-0.5 rounded bg-zen-indigo/10 text-zen-indigo font-medium flex items-center gap-0.5">
                      <Sparkles className="w-2 h-2" />
                      {scenario.techBadge}
                    </span>
                  )}
                  <ChevronRight className="w-3 h-3 text-ink-muted group-hover:text-zen-sage group-hover:translate-x-0.5 transition-all ml-auto" />
                </div>
                <p className="text-xs text-ink-secondary leading-relaxed mb-1.5 line-clamp-2">
                  {scenario.question}
                </p>
                <div className="flex gap-1 flex-wrap">
                  {scenario.tags.map(tag => (
                    <span
                      key={tag}
                      className="text-[10px] px-1.5 py-0.5 rounded bg-zen-sage/10 text-zen-sage font-medium"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </button>
        )
      })}
    </div>
  )
}
