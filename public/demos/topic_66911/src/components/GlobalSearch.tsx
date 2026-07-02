'use client'

import { useState, useEffect, useRef } from 'react'
import { registerShortcut, unregisterShortcut, formatShortcut } from '../lib/keyboard-shortcuts'
import { Search, FileText, BookOpen, Lightbulb, Target, MessageCircle, X } from 'lucide-react'
import { ChineseBorder } from './ui/ChineseBorder'
import { EmptyState } from './ui/EmptyState'
import { AncientSeal } from './ui/AncientSeal'

/* ------------------------------------------------------------------ */
/*  Mock 数据                                                          */
/* ------------------------------------------------------------------ */

interface SearchResult {
  id: string
  title: string
  description: string
  category: SearchCategory
}

type SearchCategory = 'doc' | 'paper' | 'knowledge' | 'plan' | 'chat'

const CATEGORY_CONFIG: Record<SearchCategory, { label: string; icon: typeof FileText }> = {
  doc: { label: '文档', icon: FileText },
  paper: { label: '文献', icon: BookOpen },
  knowledge: { label: '知识', icon: Lightbulb },
  plan: { label: '计划', icon: Target },
  chat: { label: '聊天', icon: MessageCircle },
}

const MOCK_RESULTS: SearchResult[] = [
  // 文档
  { id: 'doc-1', title: '论文写作指南 - 第三章', description: '研究方法与实验设计部分的草稿', category: 'doc' },
  { id: 'doc-2', title: '项目需求文档 v2.1', description: '创意大赛项目需求规格说明书', category: 'doc' },
  { id: 'doc-3', title: '会议纪要 2024-06-20', description: '产品评审会议记录与行动项', category: 'doc' },
  { id: 'doc-4', title: '技术架构设计稿', description: '系统架构与模块划分方案', category: 'doc' },
  // 文献
  { id: 'paper-1', title: 'Attention Is All You Need', description: 'Transformer 架构的原始论文', category: 'paper' },
  { id: 'paper-2', title: 'Large Language Models: A Survey', description: '大语言模型综述，涵盖 GPT/BERT 系列', category: 'paper' },
  { id: 'paper-3', title: 'RAG 检索增强生成技术综述', description: '检索增强生成方法的最新进展', category: 'paper' },
  // 知识
  { id: 'know-1', title: '水墨画风格设计规范', description: '项目设计系统的色彩与排版规范', category: 'knowledge' },
  { id: 'know-2', title: 'Next.js 14 App Router 笔记', description: '服务端组件、路由组与布局模式', category: 'knowledge' },
  { id: 'know-3', title: 'Prompt Engineering 最佳实践', description: '提示词工程技巧与模板集合', category: 'knowledge' },
  { id: 'know-4', title: 'Tailwind CSS 自定义主题配置', description: '古风配色方案与自定义工具类', category: 'knowledge' },
  // 计划
  { id: 'plan-1', title: 'Q3 产品迭代计划', description: '第三季度功能规划与里程碑', category: 'plan' },
  { id: 'plan-2', title: '创意大赛参赛计划', description: '比赛准备、作品提交与答辩安排', category: 'plan' },
  { id: 'plan-3', title: '技术债务清理 Sprint', description: '代码重构与性能优化任务列表', category: 'plan' },
  // 聊天
  { id: 'chat-1', title: '与 AI 讨论论文结构', description: '关于引言部分逻辑的对话', category: 'chat' },
  { id: 'chat-2', title: '代码审查反馈讨论', description: '关于编辑器组件优化的建议', category: 'chat' },
  { id: 'chat-3', title: '设计方案头脑风暴', description: '古风 UI 组件的创意讨论', category: 'chat' },
]

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<SearchCategory | 'all'>('all')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  // 注册 Cmd+K 快捷键
  useEffect(() => {
    const shortcut = {
      key: 'k',
      meta: true,
      description: '全局搜索',
      action: () => setIsOpen(prev => !prev),
    }
    registerShortcut(shortcut)
    return () => unregisterShortcut('k', true)
  }, [])

  // 打开时聚焦输入框 & 重置状态
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setActiveCategory('all')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // 过滤结果
  const filteredResults = query.trim()
    ? MOCK_RESULTS.filter(r => {
        const q = query.toLowerCase()
        return (
          r.title.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          CATEGORY_CONFIG[r.category].label.includes(q)
        )
      })
    : MOCK_RESULTS

  const displayedResults =
    activeCategory === 'all'
      ? filteredResults
      : filteredResults.filter(r => r.category === activeCategory)

  // 键盘导航
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setSelectedIndex(prev => Math.min(prev + 1, displayedResults.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setSelectedIndex(prev => Math.max(prev - 1, 0))
    } else if (e.key === 'Enter' && displayedResults[selectedIndex]) {
      e.preventDefault()
      // Mock: 直接关闭并显示选中结果
      setIsOpen(false)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      setIsOpen(false)
    }
  }

  // 分类标签
  const categories: (SearchCategory | 'all')[] = ['all', 'doc', 'paper', 'knowledge', 'plan', 'chat']

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] p-4"
      role="dialog"
      aria-modal="true"
      aria-label="全局搜索"
    >
      {/* 遮罩 */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-md animate-fade-in"
        onClick={() => setIsOpen(false)}
        aria-hidden="true"
      />

      {/* 搜索面板 */}
      <div className="relative w-full max-w-2xl animate-modal-appear">
        <ChineseBorder padding="p-0" className="glass-card overflow-hidden">
          {/* 搜索框 */}
          <div className="flex items-center gap-3 px-5 py-4 border-b border-border-light">
            <Search className="w-5 h-5 text-ink-muted shrink-0" aria-hidden="true" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={e => {
                setQuery(e.target.value)
                setSelectedIndex(0)
              }}
              onKeyDown={handleKeyDown}
              placeholder="搜索文档、文献、知识、计划..."
              className="input border-0 bg-transparent px-0 py-0 focus:ring-0 focus:shadow-none text-base"
              aria-label="搜索内容"
            />
            <button
              onClick={() => setIsOpen(false)}
              className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-paper-dark transition-all active:scale-90 shrink-0"
              aria-label="关闭搜索"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* 分类标签 */}
          <div className="flex items-center gap-1 px-5 py-2.5 border-b border-border-light overflow-x-auto scrollbar-hide">
            {categories.map(cat => {
              const isActive = activeCategory === cat
              const label = cat === 'all' ? '全部' : CATEGORY_CONFIG[cat].label
              return (
                <button
                  key={cat}
                  onClick={() => {
                    setActiveCategory(cat)
                    setSelectedIndex(0)
                  }}
                  className={`
                    px-3 py-1.5 rounded-full text-xs font-medium transition-all whitespace-nowrap
                    ${isActive
                      ? 'bg-ochre text-white shadow-sm'
                      : 'text-ink-muted hover:text-ink hover:bg-paper-dark'
                    }
                  `}
                >
                  {label}
                </button>
              )
            })}
          </div>

          {/* 搜索结果 */}
          <div className="max-h-[360px] overflow-y-auto">
            {displayedResults.length > 0 ? (
              <ul className="py-2" role="listbox">
                {displayedResults.map((result, idx) => {
                  const isSelected = idx === selectedIndex
                  const catConfig = CATEGORY_CONFIG[result.category]
                  const Icon = catConfig.icon
                  return (
                    <li
                      key={result.id}
                      role="option"
                      aria-selected={isSelected}
                      onClick={() => setIsOpen(false)}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`
                        flex items-start gap-3 px-5 py-3 cursor-pointer transition-colors
                        ${isSelected ? 'bg-ochre/5' : 'hover:bg-ochre/5'}
                      `}
                    >
                      <div className={`
                        w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5
                        ${isSelected ? 'bg-ochre/10' : 'bg-paper-dark'}
                      `}>
                        <Icon className={`w-4 h-4 ${isSelected ? 'text-ochre' : 'text-ink-muted'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-medium truncate ${isSelected ? 'text-ochre' : 'text-ink'}`}>
                          {result.title}
                        </div>
                        <div className="text-xs text-ink-muted mt-0.5 truncate">
                          {result.description}
                        </div>
                      </div>
                      <span className={`
                        text-[10px] px-2 py-0.5 rounded-full shrink-0 mt-1
                        ${isSelected ? 'bg-ochre/10 text-ochre' : 'bg-paper-dark text-ink-muted'}
                      `}>
                        {catConfig.label}
                      </span>
                    </li>
                  )
                })}
              </ul>
            ) : (
              <div className="relative py-8">
                <EmptyState
                  illustration="search"
                  title="未找到匹配结果"
                  description={`没有与"${query}"相关的内容`}
                  showDecoration={false}
                />
                {/* AncientSeal 装饰 */}
                <div className="absolute bottom-2 right-4 opacity-20">
                  <AncientSeal text="无果" size={48} />
                </div>
              </div>
            )}
          </div>

          {/* 底部提示 */}
          <div className="flex items-center justify-between px-5 py-2.5 border-t border-border-light text-[11px] text-ink-muted">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-paper-dark border border-border rounded text-[10px] font-mono">
                  ↑↓
                </kbd>
                导航
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-paper-dark border border-border rounded text-[10px] font-mono">
                  ↵
                </kbd>
                选择
              </span>
              <span className="flex items-center gap-1">
                <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 bg-paper-dark border border-border rounded text-[10px] font-mono">
                  esc
                </kbd>
                关闭
              </span>
            </div>
            <span>{displayedResults.length} 条结果</span>
          </div>
        </ChineseBorder>
      </div>
    </div>
  )
}
