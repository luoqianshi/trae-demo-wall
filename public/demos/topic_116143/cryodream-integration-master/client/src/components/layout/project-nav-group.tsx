import { useState, useEffect, useCallback } from 'react'
import { Link, useLocation } from '@tanstack/react-router'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar'
import type { FlowProject } from '@/features/projects'

const STORAGE_KEY = 'sidebar-projects'

interface ProjectNavGroupProps {
  projects: FlowProject[]
  currentProject: FlowProject | null
}

export function ProjectNavGroup({ projects, currentProject }: ProjectNavGroupProps) {
  const { t } = useTranslation()
  const { setOpenMobile } = useSidebar()
  const location = useLocation()
  
  // 从 URL 中提取 projectId（支持 /flow?projectId=xxx 和 /projects/xxx）
  const getActiveProjectId = () => {
    const pathname = location.pathname
    // /projects/xxx 格式
    const projectMatch = pathname.match(/^\/projects\/([^/]+)/)
    if (projectMatch) return projectMatch[1]
    // /flow 页面 - 从 href 中提取 projectId 参数
    const hrefMatch = location.href.match(/[?&]projectId=([^&]+)/)
    if (hrefMatch) return hrefMatch[1]
    return null
  }
  
  const activeProjectId = getActiveProjectId()

  const [storedProjectIds, setStoredProjectIds] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  })

  // 当 currentProject 变化时，自动添加到侧边栏
  useEffect(() => {
    if (!currentProject) return
    if (storedProjectIds.includes(currentProject.id)) return

    const newIds = [currentProject.id, ...storedProjectIds]
    setStoredProjectIds(newIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds))
  }, [currentProject]) // eslint-disable-line react-hooks/exhaustive-deps

  // 关闭项目
  const handleCloseProject = useCallback((projectId: string, e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const newIds = storedProjectIds.filter((id) => id !== projectId)
    setStoredProjectIds(newIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newIds))
  }, [storedProjectIds])

  // 过滤出侧边栏中应该显示的项目（按 storedProjectIds 顺序）
  // 如果 currentProject 不在 projects 数组中，也要显示它
  const sidebarProjects = storedProjectIds
    .map((id) => {
      const found = projects.find((p) => p.id === id)
      if (found) return found
      if (currentProject?.id === id) return currentProject
      return undefined
    })
    .filter((p): p is FlowProject => p !== undefined)

  if (sidebarProjects.length === 0) {
    return null
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{t('项目')}</SidebarGroupLabel>
      <SidebarMenu>
        {sidebarProjects.map((project) => (
          <SidebarMenuItem
            key={project.id}
            className="group/project-item relative"
          >
            <SidebarMenuButton
              asChild
              isActive={activeProjectId === project.id}
              tooltip={project.name}
            >
              <Link
                to="/projects/$projectId"
                params={{ projectId: project.id }}
                onClick={() => setOpenMobile(false)}
              >
                <span>{project.name}</span>
              </Link>
            </SidebarMenuButton>
            <button
              onClick={(e) => handleCloseProject(project.id, e)}
              className="absolute right-1 top-1/2 -translate-y-1/2 size-5 rounded-full opacity-0 transition-opacity group-hover/project-item:opacity-100 hover:bg-destructive/10 hover:text-destructive cursor-pointer flex items-center justify-center"
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
