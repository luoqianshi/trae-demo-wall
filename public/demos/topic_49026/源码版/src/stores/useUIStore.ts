import { create } from 'zustand'

export type ActiveNav = '对话' | '提醒' | '记忆' | '关系' | '日记' | '设置'

export type SidebarTab = 'people' | 'memory' | 'diary'

interface UIState {
  activeNav: ActiveNav
  setActiveNav: (nav: ActiveNav) => void

  sidebarTab: SidebarTab
  setSidebarTab: (tab: SidebarTab) => void

  selectedPerson: string | null
  setSelectedPerson: (id: string | null) => void

  lastRetrievalInfo: {
    method: string
    memoryCount: number
    diaryCount: number
    peopleCount: number
    people: { id: string; name: string }[]
  } | null
  setLastRetrievalInfo: (info: UIState['lastRetrievalInfo']) => void

  isSidebarOpen: boolean
  toggleSidebar: () => void
  closeSidebar: () => void
  openSidebar: () => void

  memoryConfirmOpen: boolean
  setMemoryConfirmOpen: (open: boolean) => void
}

export const useUIStore = create<UIState>((set) => ({
  activeNav: '对话',
  setActiveNav: (activeNav) => set({ activeNav }),

  sidebarTab: 'people',
  setSidebarTab: (sidebarTab) => set({ sidebarTab }),

  selectedPerson: null,
  setSelectedPerson: (selectedPerson) => set({ selectedPerson }),

  lastRetrievalInfo: null,
  setLastRetrievalInfo: (lastRetrievalInfo) => set({ lastRetrievalInfo }),

  isSidebarOpen: false,
  toggleSidebar: () => set((s) => ({ isSidebarOpen: !s.isSidebarOpen })),
  closeSidebar: () => set({ isSidebarOpen: false }),
  openSidebar: () => set({ isSidebarOpen: true }),

  memoryConfirmOpen: false,
  setMemoryConfirmOpen: (memoryConfirmOpen) => set({ memoryConfirmOpen }),
}))
