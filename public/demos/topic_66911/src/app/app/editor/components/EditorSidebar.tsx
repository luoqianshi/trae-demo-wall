'use client'

import { useState, useEffect, useMemo } from 'react'
import type { OutlineItem } from '../../../../lib/editor-types'
import AnimatedNumber from '../../../../components/ui/AnimatedNumber'
import {
  ChevronDown,
  ChevronRight,
  FileText,
  Hash,
  ListTree,
  PanelLeftClose,
  PanelLeftOpen,
  BookOpen
} from 'lucide-react'

interface EditorSidebarProps {
  content: string
  onHeadingClick: (text: string) => void
  collapsed?: boolean
  onToggleCollapse?: () => void
}

export default function EditorSidebar({ content, onHeadingClick, collapsed = false, onToggleCollapse }: EditorSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [activeHeadingId, setActiveHeadingId] = useState<string | null>(null)

  const outline = useMemo(() => {
    const items: OutlineItem[] = []
    const regex = /<h([1-3])[^>]*>(.*?)<\/h\1>/gi
    let match
    let id = 0

    while ((match = regex.exec(content)) !== null) {
      const level = parseInt(match[1])
      const text = match[2].replace(/<[^>]*>/g, '')
      if (text.trim()) {
        items.push({
          id: `heading-${id++}`,
          level,
          text: text.trim(),
          children: [],
        })
      }
    }
    return items
  }, [content])

  const toggleExpand = (id: string) => {
    setExpandedItems(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  // Auto-expand all items
  useEffect(() => {
    const allIds = new Set(outline.map(item => item.id))
    setExpandedItems(allIds)
  }, [outline.length])

  if (collapsed) {
    return (
      <div className="w-10 border-r border-ochre/10 bg-paper flex flex-col items-center py-3">
        <button
          onClick={onToggleCollapse}
          className="p-1.5 text-ink-muted hover:text-ochre hover:bg-ochre/5 rounded-[10px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          title="展开大纲"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>
        <div className="mt-4">
          <ListTree className="w-4 h-4 text-ink-light" />
        </div>
      </div>
    )
  }

  return (
    <div className="w-64 border-r border-ochre/10 bg-paper flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 flex items-center justify-between relative">
        <div className="flex items-center gap-2 text-sm font-semibold text-ink">
          <ListTree className="w-4 h-4 text-ochre" />
          <span className="font-display text-ochre">章节大纲</span>
        </div>
        {/* Ink divider decoration */}
        <div className="absolute bottom-0 left-4 right-4 ink-divider" />
        <button
          onClick={onToggleCollapse}
          className="p-1 text-ink-muted hover:text-ochre hover:bg-ochre/5 rounded-[8px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          title="收起大纲"
        >
          <PanelLeftClose className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Outline content */}
      <div className="flex-1 overflow-y-auto py-2">
        {outline.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <div className="w-12 h-12 bg-ink/5 rounded-[14px] flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-6 h-6 text-ink-light" />
            </div>
            <p className="text-xs text-ink-light font-medium">暂无章节</p>
            <p className="text-xs text-ink-light mt-1">使用标题样式创建大纲</p>
          </div>
        ) : (
          <div className="space-y-0.5 px-2">
            {outline.map((item, index) => (
              <div key={item.id} className="group">
                <button
                  onClick={() => {
                    setActiveHeadingId(item.id)
                    onHeadingClick(item.text)
                  }}
                  className={`w-full flex items-center gap-2 px-2 py-1.5 rounded-[10px] text-left transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] font-serif relative ${
                    activeHeadingId === item.id
                      ? 'bg-ochre/5 text-ochre font-medium'
                      : 'hover:bg-ochre/5'
                  }`}
                  style={{ paddingLeft: `${(item.level - 1) * 14 + 8}px` }}
                >
                  {/* Level indent with ochre vertical line */}
                  {item.level > 1 && (
                    <div
                      className="absolute left-0 top-0 bottom-0 border-l-2 border-ochre/10"
                      style={{
                        left: `${(item.level - 2) * 14 + 16}px`,
                      }}
                    />
                  )}
                  <Hash
                    className={`w-3 h-3 flex-shrink-0 ${
                      item.level === 1
                        ? 'text-ochre'
                        : item.level === 2
                          ? 'text-indigo'
                          : 'text-ink-light'
                    }`}
                  />
                  <span
                    className={`text-xs truncate flex-1 ${
                      activeHeadingId === item.id
                        ? 'font-medium text-ochre'
                        : item.level === 1
                          ? 'font-semibold text-ink'
                          : item.level === 2
                            ? 'font-medium text-ink-secondary'
                            : 'text-ink-muted'
                    }`}
                  >
                    {item.text}
                  </span>
                  {item.level === 1 && (
                    <span className="text-[10px] text-ink-light bg-ink/5 px-1.5 py-0.5 rounded-full">
                      {index + 1}
                    </span>
                  )}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Document stats */}
      <div className="px-4 py-3 ink-divider">
        <div className="text-xs text-ink-muted space-y-2">
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <BookOpen className="w-3 h-3" />
              章节数
            </span>
            <span className="font-medium text-ink-secondary bg-ink/5 px-2 py-0.5 rounded-full text-[10px]">
              <AnimatedNumber value={outline.length} duration={800} format={false} />
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              一级标题
            </span>
            <span className="font-medium text-ink-secondary bg-ink/5 px-2 py-0.5 rounded-full text-[10px]">
              <AnimatedNumber value={outline.filter(i => i.level === 1).length} duration={800} format={false} />
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="flex items-center gap-1.5">
              <Hash className="w-3 h-3" />
              二级标题
            </span>
            <span className="font-medium text-ink-secondary bg-ink/5 px-2 py-0.5 rounded-full text-[10px]">
              <AnimatedNumber value={outline.filter(i => i.level === 2).length} duration={800} format={false} />
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
