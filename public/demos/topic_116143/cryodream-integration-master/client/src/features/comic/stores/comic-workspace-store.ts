import { create } from 'zustand'
import { useMemo } from 'react'
import { comicProjectApi, type ComicProjectCreatePayload } from '../api/comic-api'
import {
  createEmptyComicData,
  parseComicData,
  type AssetGroup,
  type ComicAsset,
  type ComicData,
  type ComicLayer,
  type ComicPage,
  type ComicPanel,
  type ComicProject,
} from '../types'

export type EditorTool = 'select' | 'panel'

interface HistoryEntry {
  data: ComicData
  currentPageId: string | null
}

const HISTORY_LIMIT = 50

interface ComicWorkspaceState {
  // 项目
  projects: ComicProject[]
  currentProjectId: string | null
  currentProject: ComicProject | null
  loadingList: boolean
  loadingProject: boolean
  saving: boolean

  // 数据
  comicData: ComicData
  currentPageId: string | null
  selectedPanelId: string | null
  selectedLayerId: string | null

  // 工具
  tool: EditorTool

  // 历史
  undoStack: HistoryEntry[]
  redoStack: HistoryEntry[]

  // 项目操作
  loadProjects: () => Promise<void>
  createProject: (payload: ComicProjectCreatePayload) => Promise<ComicProject>
  openProject: (id: string) => Promise<void>
  deleteProject: (id: string) => Promise<void>
  renameCurrent: (name: string) => Promise<void>
  saveCurrent: (extra?: { thumbnailUrl?: string }) => Promise<void>

  // 工具切换
  setTool: (tool: EditorTool) => void

  // 页面
  setCurrentPage: (pageId: string) => void
  addPage: () => void
  removePage: (pageId: string) => void
  movePage: (fromId: string, toIndex: number) => void

  // 选中
  selectPanel: (panelId: string | null) => void
  selectLayer: (layerId: string | null) => void

  // 分格
  addPanel: (panel: ComicPanel) => void
  updatePanel: (panelId: string, patch: Partial<ComicPanel>) => void
  removePanel: (panelId: string) => void
  applyPanelTemplate: (template: 'single' | '1x2' | '2x2' | '2x3' | '1x3') => void

  // 图层
  addLayer: (panelId: string, layer: ComicLayer) => void
  replaceImageLayer: (panelId: string, layer: ComicLayer) => void
  updateLayer: (panelId: string, layerId: string, patch: Partial<ComicLayer>) => void
  removeLayer: (panelId: string, layerId: string) => void
  reorderLayers: (panelId: string, orderedIds: string[]) => void

  // 素材
  addAsset: (asset: ComicAsset) => void
  removeAsset: (assetId: string) => void
  moveAssetToGroup: (assetId: string, groupId: string | null) => void

  // 素材分组
  addAssetGroup: (name: string) => AssetGroup
  renameAssetGroup: (groupId: string, name: string) => void
  removeAssetGroup: (groupId: string, deleteAssets?: boolean) => void

  // 历史
  pushHistory: () => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean

  // 通用
  updateComicData: (updater: (data: ComicData) => ComicData) => void
}

function cloneData(data: ComicData): ComicData {
  return JSON.parse(JSON.stringify(data)) as ComicData
}

function getFirstPageId(data: ComicData): string | null {
  return data.pages.length > 0 ? data.pages[0].id : null
}

function updatePageInData(
  data: ComicData,
  pageId: string | null,
  mutator: (page: ComicPage) => ComicPage
): ComicData {
  if (!pageId) return data
  return {
    ...data,
    pages: data.pages.map((p) => (p.id === pageId ? mutator(p) : p)),
  }
}

export const useComicWorkspaceStore = create<ComicWorkspaceState>((set, get) => ({
  projects: [],
  currentProjectId: null,
  currentProject: null,
  loadingList: false,
  loadingProject: false,
  saving: false,

  comicData: createEmptyComicData(),
  currentPageId: null,
  selectedPanelId: null,
  selectedLayerId: null,

  tool: 'select',

  undoStack: [],
  redoStack: [],

  loadProjects: async () => {
    set({ loadingList: true })
    try {
      const projects = await comicProjectApi.list()
      set({ projects, loadingList: false })
    } catch (e) {
      set({ loadingList: false })
      throw e
    }
  },

  createProject: async (payload) => {
    const created = await comicProjectApi.create(payload)
    set((s) => ({ projects: [created, ...s.projects] }))
    await get().openProject(created.id)
    return created
  },

  openProject: async (id) => {
    set({ loadingProject: true })
    try {
      const project = await comicProjectApi.get(id)
      const data = parseComicData(project.comicData)
      set({
        currentProjectId: project.id,
        currentProject: project,
        comicData: data,
        currentPageId: getFirstPageId(data),
        selectedPanelId: null,
        selectedLayerId: null,
        loadingProject: false,
        undoStack: [],
        redoStack: [],
      })
    } catch (e) {
      set({ loadingProject: false })
      throw e
    }
  },

  deleteProject: async (id) => {
    await comicProjectApi.delete(id)
    set((s) => {
      const projects = s.projects.filter((p) => p.id !== id)
      if (s.currentProjectId === id) {
        return {
          projects,
          currentProjectId: null,
          currentProject: null,
          comicData: createEmptyComicData(),
          currentPageId: null,
          selectedPanelId: null,
          selectedLayerId: null,
          undoStack: [],
          redoStack: [],
        }
      }
      return { projects }
    })
  },

  renameCurrent: async (name) => {
    const { currentProject } = get()
    if (!currentProject) return
    await comicProjectApi.save({ id: currentProject.id, name })
    set((s) => ({
      currentProject: s.currentProject ? { ...s.currentProject, name } : s.currentProject,
      projects: s.projects.map((p) => (p.id === currentProject.id ? { ...p, name } : p)),
    }))
  },

  saveCurrent: async (extra) => {
    const { currentProject, comicData } = get()
    if (!currentProject) return
    set({ saving: true })
    try {
      await comicProjectApi.save({
        id: currentProject.id,
        comicData: JSON.stringify(comicData),
        ...(extra?.thumbnailUrl ? { thumbnailUrl: extra.thumbnailUrl } : {}),
      })
    } finally {
      set({ saving: false })
    }
  },

  setTool: (tool) => set({ tool }),

  setCurrentPage: (pageId) => set({ currentPageId: pageId, selectedPanelId: null, selectedLayerId: null }),

  addPage: () => {
    get().pushHistory()
    const newPage: ComicPage = {
      id: crypto.randomUUID(),
      order: get().comicData.pages.length,
      panels: [] as ComicPanel[],
    }
    set((s) => ({
      comicData: { ...s.comicData, pages: [...s.comicData.pages, newPage] },
      currentPageId: newPage.id,
      selectedPanelId: null,
      selectedLayerId: null,
    }))
  },

  removePage: (pageId) => {
    if (get().comicData.pages.length <= 1) return
    get().pushHistory()
    set((s) => {
      const pages = s.comicData.pages.filter((p) => p.id !== pageId).map((p, i) => ({ ...p, order: i }))
      const shouldResetCurrent = s.currentPageId === pageId
      return {
        comicData: { ...s.comicData, pages },
        currentPageId: shouldResetCurrent ? pages[0].id : s.currentPageId,
        selectedPanelId: shouldResetCurrent ? null : s.selectedPanelId,
        selectedLayerId: shouldResetCurrent ? null : s.selectedLayerId,
      }
    })
  },

  movePage: (fromId, toIndex) => {
    get().pushHistory()
    set((s) => {
      const pages = [...s.comicData.pages]
      const fromIndex = pages.findIndex((p) => p.id === fromId)
      if (fromIndex === -1) return {}
      const [moved] = pages.splice(fromIndex, 1)
      pages.splice(Math.max(0, Math.min(toIndex, pages.length)), 0, moved)
      return { comicData: { ...s.comicData, pages: pages.map((p, i) => ({ ...p, order: i })) } }
    })
  },

  selectPanel: (panelId) => set({ selectedPanelId: panelId, selectedLayerId: null }),
  selectLayer: (layerId) => set({ selectedLayerId: layerId }),

  addPanel: (panel) => {
    get().pushHistory()
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: [...p.panels, panel],
            })),
            selectedPanelId: panel.id,
          }
        : {}
    )
  },

  updatePanel: (panelId, patch) => {
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.map((pn) => (pn.id === panelId ? { ...pn, ...patch } : pn)),
            })),
          }
        : {}
    )
  },

  removePanel: (panelId) => {
    get().pushHistory()
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.filter((pn) => pn.id !== panelId),
            })),
            selectedPanelId: s.selectedPanelId === panelId ? null : s.selectedPanelId,
          }
        : {}
    )
  },

  applyPanelTemplate: (template) => {
    const { currentProject, currentPageId } = get()
    if (!currentProject || !currentPageId) return
    get().pushHistory()
    const width = currentProject.canvasWidth
    const height = currentProject.canvasHeight
    const padding = 40
    const gap = 20
    const usableW = width - padding * 2
    const usableH = height - padding * 2

    const panels: ComicPanel[] = []
    const defaultPanel = (x: number, y: number, w: number, h: number): ComicPanel => ({
      id: crypto.randomUUID(),
      x,
      y,
      width: w,
      height: h,
      borderColor: '#94a3b8',
      borderWidth: 1.5,
      cornerRadius: 20,
      clipContent: true,
      layers: [],
      style: 'soft',
    })

    if (template === 'single') {
      panels.push(defaultPanel(padding, padding, usableW, usableH))
    } else if (template === '1x2') {
      const h = (usableH - gap) / 2
      panels.push(defaultPanel(padding, padding, usableW, h))
      panels.push(defaultPanel(padding, padding + h + gap, usableW, h))
    } else if (template === '1x3') {
      const h = (usableH - gap * 2) / 3
      for (let i = 0; i < 3; i++) {
        panels.push(defaultPanel(padding, padding + i * (h + gap), usableW, h))
      }
    } else if (template === '2x2') {
      const w = (usableW - gap) / 2
      const h = (usableH - gap) / 2
      for (let r = 0; r < 2; r++) {
        for (let c = 0; c < 2; c++) {
          panels.push(defaultPanel(padding + c * (w + gap), padding + r * (h + gap), w, h))
        }
      }
    } else if (template === '2x3') {
      const w = (usableW - gap) / 2
      const h = (usableH - gap * 2) / 3
      for (let r = 0; r < 3; r++) {
        for (let c = 0; c < 2; c++) {
          panels.push(defaultPanel(padding + c * (w + gap), padding + r * (h + gap), w, h))
        }
      }
    }

    set((s) => ({
      comicData: updatePageInData(s.comicData, currentPageId, (p) => ({ ...p, panels })),
      selectedPanelId: null,
      selectedLayerId: null,
    }))
  },

  addLayer: (panelId, layer) => {
    get().pushHistory()
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.map((pn) =>
                pn.id === panelId ? { ...pn, layers: [...pn.layers, layer] } : pn
              ),
            })),
            selectedPanelId: panelId,
            selectedLayerId: layer.id,
          }
        : {}
    )
  },

  /** 替换分格中已有的图片图层（保留其他图层）：如果没有图片图层则直接添加。
   *  新图片始终插入到图层栈的底部（index 0），保证在文字/气泡下方。 */
  replaceImageLayer: (panelId, layer) => {
    get().pushHistory()
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.map((pn) => {
                if (pn.id !== panelId) return pn
                // 移除所有已有的图片图层
                const nonImageLayers = pn.layers.filter((l) => l.type !== 'image')
                return { ...pn, layers: [layer, ...nonImageLayers] }
              }),
            })),
            selectedPanelId: panelId,
            selectedLayerId: layer.id,
          }
        : {}
    )
  },

  updateLayer: (panelId, layerId, patch) => {
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.map((pn) =>
                pn.id === panelId
                  ? {
                      ...pn,
                      layers: pn.layers.map((l) =>
                        l.id === layerId ? ({ ...l, ...patch } as ComicLayer) : l
                      ),
                    }
                  : pn
              ),
            })),
          }
        : {}
    )
  },

  removeLayer: (panelId, layerId) => {
    get().pushHistory()
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.map((pn) =>
                pn.id === panelId ? { ...pn, layers: pn.layers.filter((l) => l.id !== layerId) } : pn
              ),
            })),
            selectedLayerId: s.selectedLayerId === layerId ? null : s.selectedLayerId,
          }
        : {}
    )
  },

  reorderLayers: (panelId, orderedIds) => {
    get().pushHistory()
    set((s) =>
      s.currentPageId
        ? {
            comicData: updatePageInData(s.comicData, s.currentPageId, (p) => ({
              ...p,
              panels: p.panels.map((pn) => {
                if (pn.id !== panelId) return pn
                const map = new Map(pn.layers.map((l) => [l.id, l]))
                const layers = orderedIds.map((id) => map.get(id)!).filter(Boolean)
                return { ...pn, layers }
              }),
            })),
          }
        : {}
    )
  },

  addAsset: (asset) => {
    set((s) => ({
      comicData: { ...s.comicData, assets: [...(s.comicData.assets ?? []), asset] },
    }))
  },

  removeAsset: (assetId) => {
    set((s) => ({
      comicData: {
        ...s.comicData,
        assets: (s.comicData.assets ?? []).filter((a) => a.id !== assetId),
      },
    }))
  },

  moveAssetToGroup: (assetId, groupId) => {
    set((s) => ({
      comicData: {
        ...s.comicData,
        assets: (s.comicData.assets ?? []).map((a) =>
          a.id === assetId ? { ...a, groupId: groupId ?? undefined } : a
        ),
      },
    }))
  },

  addAssetGroup: (name) => {
    const group: AssetGroup = { id: crypto.randomUUID(), name: name.trim() || '未命名分组' }
    set((s) => ({
      comicData: {
        ...s.comicData,
        assetGroups: [...(s.comicData.assetGroups ?? []), group],
      },
    }))
    return group
  },

  renameAssetGroup: (groupId, name) => {
    const trimmed = name.trim()
    if (!trimmed) return
    set((s) => ({
      comicData: {
        ...s.comicData,
        assetGroups: (s.comicData.assetGroups ?? []).map((g) =>
          g.id === groupId ? { ...g, name: trimmed } : g
        ),
      },
    }))
  },

  removeAssetGroup: (groupId, deleteAssets = false) => {
    set((s) => {
      const assets = (s.comicData.assets ?? [])
        .filter((a) => (deleteAssets ? a.groupId !== groupId : true))
        .map((a) => (a.groupId === groupId ? { ...a, groupId: undefined } : a))
      return {
        comicData: {
          ...s.comicData,
          assetGroups: (s.comicData.assetGroups ?? []).filter((g) => g.id !== groupId),
          assets,
        },
      }
    })
  },

  pushHistory: () => {
    set((s) => ({
      undoStack: [
        ...s.undoStack.slice(-HISTORY_LIMIT + 1),
        { data: cloneData(s.comicData), currentPageId: s.currentPageId },
      ],
      redoStack: [],
    }))
  },

  undo: () => {
    const { undoStack, comicData, currentPageId } = get()
    if (undoStack.length === 0) return
    const prev = undoStack[undoStack.length - 1]
    set((s) => ({
      undoStack: s.undoStack.slice(0, -1),
      redoStack: [...s.redoStack, { data: cloneData(comicData), currentPageId }],
      comicData: prev.data,
      currentPageId: prev.currentPageId,
      selectedPanelId: null,
      selectedLayerId: null,
    }))
  },

  redo: () => {
    const { redoStack, comicData, currentPageId } = get()
    if (redoStack.length === 0) return
    const next = redoStack[redoStack.length - 1]
    set((s) => ({
      redoStack: s.redoStack.slice(0, -1),
      undoStack: [...s.undoStack, { data: cloneData(comicData), currentPageId }],
      comicData: next.data,
      currentPageId: next.currentPageId,
      selectedPanelId: null,
      selectedLayerId: null,
    }))
  },

  canUndo: () => get().undoStack.length > 0,
  canRedo: () => get().redoStack.length > 0,

  updateComicData: (updater) => set((s) => ({ comicData: updater(s.comicData) })),
}))

/** 便捷选择器：获取当前页面（拆开订阅，避免返回新对象导致无限循环） */
export function useCurrentPage(): ComicPage | null {
  const currentPageId = useComicWorkspaceStore((s) => s.currentPageId)
  const pages = useComicWorkspaceStore((s) => s.comicData.pages)
  return useMemo(() => {
    if (!currentPageId) return null
    return pages.find((p) => p.id === currentPageId) ?? null
  }, [currentPageId, pages])
}

/** 便捷选择器：获取当前选中分格 */
export function useSelectedPanel(): ComicPanel | null {
  const currentPageId = useComicWorkspaceStore((s) => s.currentPageId)
  const selectedPanelId = useComicWorkspaceStore((s) => s.selectedPanelId)
  const pages = useComicWorkspaceStore((s) => s.comicData.pages)
  return useMemo(() => {
    if (!currentPageId || !selectedPanelId) return null
    const page = pages.find((p) => p.id === currentPageId)
    return page?.panels.find((pn) => pn.id === selectedPanelId) ?? null
  }, [currentPageId, selectedPanelId, pages])
}

/** 便捷选择器：获取当前选中图层及其所属分格 */
export function useSelectedLayer(): { panel: ComicPanel; layer: ComicLayer } | null {
  const currentPageId = useComicWorkspaceStore((s) => s.currentPageId)
  const selectedLayerId = useComicWorkspaceStore((s) => s.selectedLayerId)
  const pages = useComicWorkspaceStore((s) => s.comicData.pages)
  return useMemo(() => {
    if (!currentPageId || !selectedLayerId) return null
    const page = pages.find((p) => p.id === currentPageId)
    if (!page) return null
    for (const panel of page.panels) {
      const layer = panel.layers.find((l) => l.id === selectedLayerId)
      if (layer) return { panel, layer }
    }
    return null
  }, [currentPageId, selectedLayerId, pages])
}
