import { useEffect, useMemo } from 'react'
import { useLocation } from '@tanstack/react-router'
import { useLayout } from '@/context/layout-provider'
import { getProject, listProjects, useProjectContextStore } from '@/features/projects'
import { knowledgeBaseApi, useKnowledgeContextStore } from '@/features/knowledge'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from './data/sidebar-data'
import { NavGroup } from './nav-group'
import { NavUser } from './nav-user'
import { TeamSwitcher } from './team-switcher'
import { ProjectNavGroup } from './project-nav-group'
import { KnowledgeNavGroup } from './knowledge-nav-group'
import type { NavGroup as NavGroupType } from './types'

const getProjectIdFromLocation = (pathname: string, search: Record<string, unknown>) => {
  if (typeof search.projectId === 'string' && search.projectId) {
    return search.projectId
  }
  const match = pathname.match(/^\/projects\/([^/?#]+)/)
  return match?.[1]
}

const getKbIdFromLocation = (pathname: string) => {
  const match = pathname.match(/^\/knowledge-base\/([^/?#]+)/)
  return match?.[1]
}

export function AppSidebar() {
  const { collapsible, variant } = useLayout()
  const location = useLocation()
  const projects = useProjectContextStore((state) => state.projects)
  const currentProject = useProjectContextStore((state) => state.currentProject)
  const setProjects = useProjectContextStore((state) => state.setProjects)
  const setCurrentProject = useProjectContextStore((state) => state.setCurrentProject)
  const knowledgeBases = useKnowledgeContextStore((state) => state.knowledgeBases)
  const currentKnowledgeBase = useKnowledgeContextStore((state) => state.currentKnowledgeBase)
  const setKnowledgeBases = useKnowledgeContextStore((state) => state.setKnowledgeBases)
  const setCurrentKnowledgeBase = useKnowledgeContextStore((state) => state.setCurrentKnowledgeBase)
  const projectId = getProjectIdFromLocation(location.pathname, location.search)
  const kbId = getKbIdFromLocation(location.pathname)

  // 每次路由变化时重新加载项目列表
  useEffect(() => {
    listProjects()
      .then((page) => setProjects(page.records))
      .catch(() => setProjects([]))
  }, [location.pathname, setProjects])

  useEffect(() => {
    if (!projectId) {
      if (currentProject) setCurrentProject(null)
      return
    }

    const project = projects.find((item) => item.id === projectId)
    if (project) {
      if (currentProject?.id !== project.id) setCurrentProject(project)
      return
    }

    if (currentProject?.id === projectId) return

    getProject(projectId)
      .then(setCurrentProject)
      .catch(() => setCurrentProject(null))
  }, [currentProject, currentProject?.id, projectId, projects, setCurrentProject])

  // 每次路由变化时重新加载知识库列表
  useEffect(() => {
    knowledgeBaseApi.list({ current: 1, pageSize: 100 })
      .then((result) => setKnowledgeBases(result.list))
      .catch(() => setKnowledgeBases([]))
  }, [location.pathname, setKnowledgeBases])

  useEffect(() => {
    if (!kbId) {
      if (currentKnowledgeBase) setCurrentKnowledgeBase(null)
      return
    }

    const kb = knowledgeBases.find((item) => item.id === kbId)
    if (kb) {
      if (currentKnowledgeBase?.id !== kb.id) setCurrentKnowledgeBase(kb)
      return
    }

    if (currentKnowledgeBase?.id === kbId) return

    knowledgeBaseApi.get(kbId)
      .then(setCurrentKnowledgeBase)
      .catch(() => setCurrentKnowledgeBase(null))
  }, [currentKnowledgeBase, currentKnowledgeBase?.id, kbId, knowledgeBases, setCurrentKnowledgeBase])

  const navGroups = useMemo(() => {
    const groups: NavGroupType[] = [...sidebarData.navGroups]
    return groups
  }, [])

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {navGroups.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
        {projects.length > 0 && <ProjectNavGroup projects={projects} currentProject={currentProject} />}
        {knowledgeBases.length > 0 && <KnowledgeNavGroup knowledgeBases={knowledgeBases} currentKnowledgeBase={currentKnowledgeBase} />}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={sidebarData.user} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
