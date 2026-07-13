import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export interface WorkflowTab {
  workflowId: string
  projectId: string
  projectName: string
  workflowName: string
}

interface WorkflowTabsState {
  tabs: WorkflowTab[]
  activeTabId: string | null

  addTab: (tab: WorkflowTab) => void
  removeTab: (workflowId: string) => void
  setActiveTab: (workflowId: string | null) => void
  updateTabName: (workflowId: string, name: string) => void
  clearTabs: () => void
}

// 根据项目 ID 生成浅色背景
const projectColors = [
  { bg: '#eff6ff', border: '#93c5fd', text: '#1d4ed8', dot: '#60a5fa' },   // blue
  { bg: '#f5f3ff', border: '#c4b5fd', text: '#6d28d9', dot: '#a78bfa' },   // violet
  { bg: '#ecfdf5', border: '#6ee7b7', text: '#047857', dot: '#34d399' },   // emerald
  { bg: '#fffbeb', border: '#fcd34d', text: '#b45309', dot: '#fbbf24' },   // amber
  { bg: '#fff1f2', border: '#fda4af', text: '#be123c', dot: '#fb7185' },   // rose
  { bg: '#ecfeff', border: '#67e8f9', text: '#0e7490', dot: '#22d3ee' },   // cyan
  { bg: '#fff7ed', border: '#fdba74', text: '#c2410c', dot: '#fb923c' },   // orange
  { bg: '#f0fdfa', border: '#5eead4', text: '#0f766e', dot: '#2dd4bf' },   // teal
]

// 项目 ID → 颜色索引的稳定映射
const colorCache = new Map<string, number>()

export function getProjectColor(projectId: string) {
  if (!colorCache.has(projectId)) {
    // 使用确定性哈希 + 顺序分配混合策略
    let hash = 0
    for (let i = 0; i < projectId.length; i++) {
      hash = ((hash << 5) - hash + projectId.charCodeAt(i)) | 0
    }
    const index = Math.abs(hash) % projectColors.length
    colorCache.set(projectId, index)
  }
  return projectColors[colorCache.get(projectId)!]
}

export const useWorkflowTabsStore = create<WorkflowTabsState>()(
  persist(
    (set, get) => ({
      tabs: [],
      activeTabId: null,

      addTab: (tab) => {
        const { tabs } = get()
        const exists = tabs.some((t) => t.workflowId === tab.workflowId)
        if (!exists) {
          set({ tabs: [...tabs, tab], activeTabId: tab.workflowId })
        } else {
          // 已存在时更新 tab 信息（projectId 可能之前是错的）
          set({
            tabs: tabs.map((t) => t.workflowId === tab.workflowId ? tab : t),
            activeTabId: tab.workflowId,
          })
        }
      },

      removeTab: (workflowId) => {
        const { tabs, activeTabId } = get()
        const idx = tabs.findIndex((t) => t.workflowId === workflowId)
        const newTabs = tabs.filter((t) => t.workflowId !== workflowId)

        let newActiveId = activeTabId
        if (activeTabId === workflowId) {
          if (newTabs.length > 0) {
            const nextIdx = Math.min(idx, newTabs.length - 1)
            newActiveId = newTabs[nextIdx].workflowId
          } else {
            newActiveId = null
          }
        }

        set({ tabs: newTabs, activeTabId: newActiveId })
      },

      setActiveTab: (workflowId) => {
        set({ activeTabId: workflowId })
      },

      updateTabName: (workflowId, name) => {
        const { tabs } = get()
        set({
          tabs: tabs.map((t) => t.workflowId === workflowId ? { ...t, workflowName: name } : t),
        })
      },

      clearTabs: () => {
        set({ tabs: [], activeTabId: null })
      },
    }),
    {
      name: 'workflow-tabs-v2',
      version: 2,
    }
  )
)
