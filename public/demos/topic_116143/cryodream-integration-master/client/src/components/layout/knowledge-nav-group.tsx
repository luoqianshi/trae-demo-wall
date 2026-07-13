import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { X } from 'lucide-react'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { KnowledgeBase } from './api/knowledge-api'

const STORAGE_KEY = 'sidebar-knowledge-bases'

interface KnowledgeNavGroupProps {
  knowledgeBases: KnowledgeBase[]
  currentKnowledgeBase: KnowledgeBase | null
}

export function KnowledgeNavGroup({ knowledgeBases, currentKnowledgeBase }: KnowledgeNavGroupProps) {
  const { setOpenMobile } = useSidebar()
  const location = useLocation()
  
  // 从 URL 中提取 kbId
  const getActiveKbId = () => {
    const pathname = location.pathname
    const kbMatch = pathname.match(/^\/knowledge-base\/([^/]+)/)
    if (kbMatch) return kbMatch[1]
    return null
  }
  
  const activeKbId = getActiveKbId()

  const [storedKbIds, setStoredKbIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // 当 currentKnowledgeBase 变化时，自动添加到侧边栏
  useEffect(() => {
    if (!currentKnowledgeBase) return
    if (storedKbIds.includes(currentKnowledgeBase.id)) return

    const newIds = [currentKnowledgeBase.id, ...storedKbIds]
    setStoredKbIds(newIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds))
  }, [currentKnowledgeBase]) // eslint-disable-line react-hooks/exhaustive-deps

  // 关闭知识库
  const handleCloseKb = useCallback((kbId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newIds = storedKbIds.filter((id) => id !== kbId)
    setStoredKbIds(newIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds))
  }, [storedKbIds])

  // 过滤出侧边栏中应该显示的知识库（按 storedKbIds 顺序）
  const sidebarKbs = storedKbIds
    .map((id) => {
      const found = knowledgeBases.find((kb) => kb.id === id)
      if (found) return found
      if (currentKnowledgeBase?.id === id) return currentKnowledgeBase
      return undefined
    })
    .filter((kb): kb is KnowledgeBase => kb !== undefined)

  if (sidebarKbs.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>知识库</SidebarGroupLabel>
      <SidebarMenu>
        {sidebarKbs.map((kb) => (
          <SidebarMenuItem
            key={kb.id}
            className="group/kb-item relative"
          >
            <SidebarMenuButton
              asChild
              isActive={activeKbId === kb.id}
              tooltip={kb.name}
            >
              <Link
                to="/knowledge-base/$kbId"
                params={{ kbId: kb.id }}
                onClick={() => setOpenMobile(false)}
              >
                <span>{kb.name}</span>
              </Link>
            </SidebarMenuButton>
            <button
              onClick={(e) => handleCloseKb(kb.id, e)}
              className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full opacity-0 transition-opacity group-hover/kb-item:opacity-100 hover:bg-destructive/10 hover:text-destructive cursor-pointer flex items-center justify-center"
              title="从侧边栏移除"
            >
              <X className="size-3" />
            </button>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
