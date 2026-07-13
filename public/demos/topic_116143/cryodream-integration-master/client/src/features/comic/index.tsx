import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  ChevronDown,
  Download,
  FolderOpen,
  Grid2X2,
  Layers,
  MessageSquare,
  Redo2,
  Rows3,
  Square,
  SquareStack,
  Trash2,
  Type,
  Undo2,
  Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { ComicProjectBar } from './components/ComicProjectBar'
import { LayerPanel } from './components/LayerPanel'
import { PropertyPanel } from './components/PropertyPanel'
import { AssetLibraryPanel } from './components/AssetLibraryPanel'
import { PageThumbnailBar } from './components/PageThumbnailBar'
import { ExportDialog } from './components/ExportDialog'
import { TextEditDialog } from './components/TextEditDialog'
import { ComicStage, type ComicStageHandle } from './konva/ComicStage'
import {
  useComicWorkspaceStore,
  useCurrentPage,
  useSelectedLayer,
  useSelectedPanel,
} from './stores/comic-workspace-store'
import type { ComicAsset, ComicLayer, SpeechBubbleLayer, TextLayer } from './types'
import { exportComicAsPDF, exportPageAsPNG } from './utils/exporter'
import { buildFittedImageLayer } from './utils/imageFit'
import {
  BUBBLE_OPTIONS,
  TEXT_KINDS,
  buildBubbleLayer,
  buildTextLayer,
} from './utils/layerFactories'

const COMIC_LAST_PROJECT_STORAGE_KEY = 'comic-last-project-id'

function getStoredComicProjectId(): string | null {
  if (typeof window === 'undefined') return null
  try {
    const value = window.localStorage.getItem(COMIC_LAST_PROJECT_STORAGE_KEY)?.trim()
    return value || null
  } catch {
    return null
  }
}

function setStoredComicProjectId(projectId: string) {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.setItem(COMIC_LAST_PROJECT_STORAGE_KEY, projectId)
  } catch {
    return
  }
}

function removeStoredComicProjectId() {
  if (typeof window === 'undefined') return
  try {
    window.localStorage.removeItem(COMIC_LAST_PROJECT_STORAGE_KEY)
  } catch {
    return
  }
}

interface ComicPageProps {
  projectId?: string
}

export function ComicPage({ projectId }: ComicPageProps) {
  const projects = useComicWorkspaceStore((s) => s.projects)
  const currentProjectId = useComicWorkspaceStore((s) => s.currentProjectId)
  const currentProject = useComicWorkspaceStore((s) => s.currentProject)
  const comicData = useComicWorkspaceStore((s) => s.comicData)
  const currentPageId = useComicWorkspaceStore((s) => s.currentPageId)
  const selectedPanelId = useComicWorkspaceStore((s) => s.selectedPanelId)
  const selectedLayerId = useComicWorkspaceStore((s) => s.selectedLayerId)
  const saving = useComicWorkspaceStore((s) => s.saving)
  const undoStackLen = useComicWorkspaceStore((s) => s.undoStack.length)
  const redoStackLen = useComicWorkspaceStore((s) => s.redoStack.length)

  const loadProjects = useComicWorkspaceStore((s) => s.loadProjects)
  const createProject = useComicWorkspaceStore((s) => s.createProject)
  const openProject = useComicWorkspaceStore((s) => s.openProject)
  const deleteProject = useComicWorkspaceStore((s) => s.deleteProject)
  const renameCurrent = useComicWorkspaceStore((s) => s.renameCurrent)
  const saveCurrent = useComicWorkspaceStore((s) => s.saveCurrent)
  const setCurrentPage = useComicWorkspaceStore((s) => s.setCurrentPage)
  const addPage = useComicWorkspaceStore((s) => s.addPage)
  const removePage = useComicWorkspaceStore((s) => s.removePage)
  const applyPanelTemplate = useComicWorkspaceStore((s) => s.applyPanelTemplate)
  const removePanel = useComicWorkspaceStore((s) => s.removePanel)
  const addLayer = useComicWorkspaceStore((s) => s.addLayer)
  const replaceImageLayer = useComicWorkspaceStore((s) => s.replaceImageLayer)
  const updateLayer = useComicWorkspaceStore((s) => s.updateLayer)
  const removeLayer = useComicWorkspaceStore((s) => s.removeLayer)
  const reorderLayers = useComicWorkspaceStore((s) => s.reorderLayers)
  const updatePanel = useComicWorkspaceStore((s) => s.updatePanel)
  const selectPanel = useComicWorkspaceStore((s) => s.selectPanel)
  const selectLayer = useComicWorkspaceStore((s) => s.selectLayer)
  const undo = useComicWorkspaceStore((s) => s.undo)
  const redo = useComicWorkspaceStore((s) => s.redo)

  const page = useCurrentPage()
  const selectedPanel = useSelectedPanel()
  const selected = useSelectedLayer()
  const selectedLayer = selected?.layer ?? null
  const assets = useComicWorkspaceStore((s) => s.comicData.assets ?? [])
  const addAsset = useComicWorkspaceStore((s) => s.addAsset)
  const removeAsset = useComicWorkspaceStore((s) => s.removeAsset)
  const assetGroups = useComicWorkspaceStore((s) => s.comicData.assetGroups ?? [])
  const addAssetGroup = useComicWorkspaceStore((s) => s.addAssetGroup)
  const renameAssetGroup = useComicWorkspaceStore((s) => s.renameAssetGroup)
  const removeAssetGroup = useComicWorkspaceStore((s) => s.removeAssetGroup)
  const moveAssetToGroup = useComicWorkspaceStore((s) => s.moveAssetToGroup)

  const stageRef = useRef<ComicStageHandle>(null)
  const canvasContainerRef = useRef<HTMLDivElement>(null)
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 })
  const navigate = useNavigate()

  const [exportOpen, setExportOpen] = useState(false)
  const [textEdit, setTextEdit] = useState<{
    open: boolean
    layerId: string
    panelId: string
    initialText: string
    title: string
  } | null>(null)

  // 自动保存 debounce
  const saveTimerRef = useRef<number | null>(null)
  const dataDirtyRef = useRef(false)

  const canvasWidth = currentProject?.canvasWidth ?? 1200
  const canvasHeight = currentProject?.canvasHeight ?? 1600

  useEffect(() => {
    loadProjects().catch((e) => toast.error(`加载漫画项目列表失败: ${(e as Error).message}`))
  }, [loadProjects])

  // 初始化项目：URL 参数优先 → localStorage 兜底 → 都没有则不打开
  const initialResolvedRef = useRef(false)
  useEffect(() => {
    if (initialResolvedRef.current) return
    if (projectId) {
      // 用 URL 参数打开
      if (projectId !== currentProjectId) {
        openProject(projectId)
          .then(() => setStoredComicProjectId(projectId))
          .catch((e) => {
            toast.error(`打开漫画项目失败: ${(e as Error).message}`)
            removeStoredComicProjectId()
          })
      }
      initialResolvedRef.current = true
      return
    }
    // 无 URL 参数：尝试用 localStorage 恢复
    const stored = getStoredComicProjectId()
    if (stored && stored !== currentProjectId) {
      openProject(stored)
        .then(() => {
          void navigate({
            to: '/canvas/comic',
            search: { project: stored },
            replace: true,
          })
        })
        .catch(() => {
          // localStorage 里的项目可能已被删，清除
          removeStoredComicProjectId()
        })
    }
    initialResolvedRef.current = true
  }, [projectId, currentProjectId, openProject, navigate])

  // 监听容器尺寸
  useEffect(() => {
    const el = canvasContainerRef.current
    if (!el) return
    const update = () => setContainerSize({ width: el.clientWidth, height: el.clientHeight })
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [currentProjectId])

  // 快捷键：撤销/重做/删除/ESC
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault()
        undo()
      } else if ((e.ctrlKey || e.metaKey) && (e.key.toLowerCase() === 'y' || (e.shiftKey && e.key.toLowerCase() === 'z'))) {
        e.preventDefault()
        redo()
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedLayerId && selected) {
          removeLayer(selected.panel.id, selectedLayerId)
        } else if (selectedPanelId) {
          removePanel(selectedPanelId)
        }
      } else if (e.key === 'Escape') {
        selectLayer(null)
        selectPanel(null)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [selectedLayerId, selectedPanelId, selected, removeLayer, removePanel, selectLayer, selectPanel, undo, redo])

  // 自动保存
  useEffect(() => {
    dataDirtyRef.current = true
    if (!currentProjectId) return
    if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    saveTimerRef.current = window.setTimeout(() => {
      if (dataDirtyRef.current) {
        saveCurrent()
          .then(() => {
            dataDirtyRef.current = false
          })
          .catch(() => undefined)
      }
    }, 2000)
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current)
    }
  }, [comicData, currentProjectId, saveCurrent])

  const handleCreate = async (name: string) => {
    try {
      const created = await createProject({ name })
      setStoredComicProjectId(created.id)
      void navigate({ to: '/canvas/comic', search: { project: created.id }, replace: true })
      toast.success(`已创建漫画项目「${name}」`)
    } catch (e) {
      toast.error(`创建失败: ${(e as Error).message}`)
    }
  }

  const handleOpen = async (id: string) => {
    try {
      await openProject(id)
      setStoredComicProjectId(id)
      void navigate({ to: '/canvas/comic', search: { project: id }, replace: true })
    } catch (e) {
      toast.error(`打开失败: ${(e as Error).message}`)
    }
  }

  const handleSave = async () => {
    try {
      await saveCurrent()
      toast.success('已保存')
    } catch (e) {
      toast.error(`保存失败: ${(e as Error).message}`)
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await deleteProject(id)
      // 如果删除的是当前项目，同步清理 localStorage 和 URL
      if (id === currentProjectId || id === getStoredComicProjectId()) {
        removeStoredComicProjectId()
        void navigate({ to: '/canvas/comic', search: {}, replace: true })
      }
      toast.success('已删除')
    } catch (e) {
      toast.error(`删除失败: ${(e as Error).message}`)
    }
  }

  const handleRename = async (name: string) => {
    try {
      await renameCurrent(name)
    } catch (e) {
      toast.error(`重命名失败: ${(e as Error).message}`)
    }
  }

  /** 添加图层：需要选中的分格 */
  const handleAddLayer = useCallback(
    (layer: ComicLayer): boolean => {
      const state = useComicWorkspaceStore.getState()
      const panelId = state.selectedPanelId ?? state.comicData.pages.find((p) => p.id === state.currentPageId)?.panels[0]?.id
      if (!panelId) {
        toast.warning('请先创建或选中一个分格')
        return false
      }
      addLayer(panelId, layer)
      return true
    },
    [addLayer]
  )

  /** 添加图片素材：自动加载图片、按分格 cover 模式适配，替换分格中已有的图片图层 */
  const handleAddImageAsset = useCallback(
    async (asset: ComicAsset) => {
      const state = useComicWorkspaceStore.getState()
      const page = state.comicData.pages.find((p) => p.id === state.currentPageId)
      if (!page) {
        toast.warning('请先创建页面并添加分格')
        return
      }
      const targetPanelId =
        state.selectedPanelId ?? page.panels[0]?.id
      const targetPanel = page.panels.find((pn) => pn.id === targetPanelId)
      if (!targetPanel) {
        toast.warning('请先创建或选中一个分格')
        return
      }
      try {
        // 默认自适应画格（contain：完整显示，不裁切）
        const layer = await buildFittedImageLayer(
          asset.url,
          asset.name,
          targetPanel,
          'contain',
          asset.id
        )
        replaceImageLayer(targetPanel.id, layer)
        toast.success(`已添加图片「${asset.name}」到分格`)
      } catch (e) {
        toast.error(`添加图片失败: ${(e as Error).message}`)
      }
    },
    [replaceImageLayer]
  )

  const handleExport = async ({
    format,
    pixelRatio,
    scope,
  }: {
    format: 'png' | 'pdf'
    pixelRatio: number
    scope: 'current' | 'all'
  }) => {
    const name = currentProject?.name ?? 'comic'
    try {
      if (format === 'png') {
        if (scope === 'current' && page) {
          await exportPageAsPNG(page, canvasWidth, canvasHeight, pixelRatio, name)
          toast.success('PNG 已导出')
        } else {
          for (let i = 0; i < comicData.pages.length; i++) {
            await exportPageAsPNG(
              comicData.pages[i],
              canvasWidth,
              canvasHeight,
              pixelRatio,
              `${name}-P${i + 1}`
            )
          }
          toast.success(`已导出 ${comicData.pages.length} 页 PNG`)
        }
      } else {
        await exportComicAsPDF(comicData, canvasWidth, canvasHeight, pixelRatio, name)
        toast.success('PDF 已导出')
      }
    } catch (e) {
      toast.error(`导出失败: ${(e as Error).message}`)
    }
  }

  const openTextEdit = (layer: TextLayer | SpeechBubbleLayer, panelId: string) => {
    setTextEdit({
      open: true,
      layerId: layer.id,
      panelId,
      initialText: layer.text,
      title: layer.type === 'text' ? '编辑文字' : '编辑对话框文字',
    })
  }

  const currentLayers = useMemo(() => selectedPanel?.layers ?? [], [selectedPanel])

  return (
    <div className='flex h-full flex-col bg-neutral-50'>
      <ComicProjectBar
        projects={projects}
        currentProjectId={currentProjectId}
        currentProjectName={currentProject?.name ?? ''}
        saving={saving}
        onCreate={handleCreate}
        onOpen={handleOpen}
        onSave={handleSave}
        onDelete={handleDelete}
        onRenameCurrent={handleRename}
      />

      {/* 工具二级栏（顶部粗一点的分割线，让菜单栏和工具栏视觉分离更强） */}
      {currentProjectId && (
        <div className='flex items-center gap-2 border-b-2 border-neutral-200 bg-neutral-50/80 px-3 py-1.5 shadow-[inset_0_1px_0_rgba(15,23,42,0.02)]'>
          <span className='text-xs text-neutral-500'>快速布局：</span>
          <TemplateBtn onClick={() => applyPanelTemplate('single')} icon={<Square size={14} />} label='1格' />
          <TemplateBtn onClick={() => applyPanelTemplate('1x2')} icon={<Rows3 size={14} />} label='上下' />
          <TemplateBtn onClick={() => applyPanelTemplate('1x3')} icon={<Rows3 size={14} />} label='三行' />
          <TemplateBtn onClick={() => applyPanelTemplate('2x2')} icon={<Grid2X2 size={14} />} label='2×2' />
          <TemplateBtn onClick={() => applyPanelTemplate('2x3')} icon={<SquareStack size={14} />} label='2×3' />

          <Separator orientation='vertical' className='mx-1 h-5' />

          <span className='text-xs text-neutral-500'>插入：</span>

          {/* 气泡下拉 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-7 gap-1 text-xs'
                title='插入对话气泡'
              >
                <MessageSquare size={14} />
                <span className='hidden md:inline'>气泡</span>
                <ChevronDown size={12} className='opacity-60' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-40'>
              <DropdownMenuLabel className='text-xs'>气泡风格</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {BUBBLE_OPTIONS.map((b) => (
                <DropdownMenuItem
                  key={b.value}
                  onClick={() => handleAddLayer(buildBubbleLayer(b.value))}
                  className='gap-2 text-xs'
                >
                  <MessageSquare size={12} className='text-neutral-500' />
                  {b.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* 文字下拉 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant='outline'
                size='sm'
                className='h-7 gap-1 text-xs'
                title='插入文字'
              >
                <Type size={14} />
                <span className='hidden md:inline'>文字</span>
                <ChevronDown size={12} className='opacity-60' />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align='start' className='w-40'>
              <DropdownMenuLabel className='text-xs'>文字类型</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {TEXT_KINDS.map((t) => (
                <DropdownMenuItem
                  key={t.value}
                  onClick={() => handleAddLayer(buildTextLayer(t.value))}
                  className='gap-2 text-xs'
                >
                  {t.value === 'effect' ? (
                    <Zap size={12} className='text-amber-500' />
                  ) : (
                    <Type size={12} className='text-neutral-500' />
                  )}
                  <span className='flex-1'>{t.label}</span>
                  <span className='text-[10px] text-neutral-400'>{t.sample}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <div className='ml-auto flex items-center gap-1'>
            <Button variant='ghost' size='icon' onClick={undo} disabled={undoStackLen === 0} title='撤销 Ctrl+Z'>
              <Undo2 size={14} />
            </Button>
            <Button variant='ghost' size='icon' onClick={redo} disabled={redoStackLen === 0} title='重做 Ctrl+Y'>
              <Redo2 size={14} />
            </Button>
            <Button variant='outline' size='sm' onClick={() => setExportOpen(true)} className='gap-1'>
              <Download size={14} /> 导出
            </Button>
          </div>
        </div>
      )}

      <div className='flex min-h-0 flex-1'>
        {/* 左侧面板：素材 / 角色 tab 切换 */}
        {currentProjectId && (
          <AssetLibraryPanel
            projectId={currentProjectId}
            assets={assets}
            assetGroups={assetGroups}
            selectedLayer={selectedLayer}
            onAddAsset={addAsset}
            onAddImageAsset={handleAddImageAsset}
            onRemoveAsset={(asset) => removeAsset(asset.id)}
            onAddGroup={addAssetGroup}
            onRenameGroup={renameAssetGroup}
            onRemoveGroup={removeAssetGroup}
            onMoveAssetToGroup={moveAssetToGroup}
          />
        )}

        {/* 中央画布 */}
        <div ref={canvasContainerRef} className='relative flex min-h-0 min-w-0 flex-1'>
          {!currentProjectId ? (
            <div className='flex flex-1 flex-col items-center justify-center gap-3 text-neutral-400'>
              <FolderOpen size={48} />
              <p className='text-sm'>请先新建或打开一个漫画项目</p>
            </div>
          ) : containerSize.width > 0 ? (
            <ComicStage
              ref={stageRef}
              containerSize={containerSize}
              canvasWidth={canvasWidth}
              canvasHeight={canvasHeight}
              onTextEditRequest={openTextEdit}
            />
          ) : null}
        </div>

        {/* 右侧图层 + 属性 */}
        {currentProjectId && (
          <aside className='flex w-64 flex-col border-l border-neutral-200 bg-white'>
            <div className='flex items-center justify-between border-b border-neutral-100 px-3 py-2'>
              <span className='text-xs font-semibold text-neutral-700 flex items-center gap-1'>
                <Layers size={12} /> 图层
              </span>
              {selectedPanel && (
                <Button
                  variant='ghost'
                  size='icon'
                  onClick={() => {
                    if (window.confirm('删除此分格及其所有图层？')) removePanel(selectedPanel.id)
                  }}
                  title='删除分格'
                  className='size-6 text-rose-400 hover:text-rose-600'
                >
                  <Trash2 size={12} />
                </Button>
              )}
            </div>
            <div className={cn('border-b border-neutral-100', currentLayers.length > 0 ? 'max-h-48' : 'h-24')}>
              <LayerPanel
                panelId={selectedPanel?.id ?? null}
                layers={currentLayers}
                selectedLayerId={selectedLayerId}
                onSelect={(id) => selectLayer(id)}
                onReorder={(ids) => selectedPanel && reorderLayers(selectedPanel.id, ids)}
                onToggleVisible={(id, visible) => selectedPanel && updateLayer(selectedPanel.id, id, { visible })}
                onToggleLocked={(id, locked) => selectedPanel && updateLayer(selectedPanel.id, id, { locked })}
                onRename={(id, name) => selectedPanel && updateLayer(selectedPanel.id, id, { name })}
                onDelete={(id) => selectedPanel && removeLayer(selectedPanel.id, id)}
              />
            </div>
            <div className='flex-1 overflow-y-auto'>
              <PropertyPanel
                selectedPanel={selectedPanel}
                selectedLayer={selectedLayer}
                onPanelChange={(patch) => selectedPanel && updatePanel(selectedPanel.id, patch)}
                onLayerChange={(patch) => selected && updateLayer(selected.panel.id, selected.layer.id, patch)}
              />
            </div>
          </aside>
        )}
      </div>

      {/* 底部页面缩略图 */}
      {currentProjectId && (
        <PageThumbnailBar
          pages={comicData.pages}
          currentPageId={currentPageId}
          onSelect={setCurrentPage}
          onAdd={addPage}
          onRemove={removePage}
        />
      )}

      {/* 导出对话框 */}
      <ExportDialog
        open={exportOpen}
        onOpenChange={setExportOpen}
        onExport={handleExport}
        hasMultiplePages={comicData.pages.length > 1}
      />

      {/* 文字编辑对话框 */}
      {textEdit && (
        <TextEditDialog
          open={textEdit.open}
          initialText={textEdit.initialText}
          title={textEdit.title}
          onOpenChange={(open) => setTextEdit((prev) => (prev ? { ...prev, open } : prev))}
          onSave={(text) => {
            updateLayer(textEdit.panelId, textEdit.layerId, { text })
          }}
        />
      )}
    </div>
  )
}

function TemplateBtn({
  onClick,
  icon,
  label,
}: {
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button variant='outline' size='sm' onClick={onClick} className='h-7 gap-1 text-xs' title={label}>
      {icon}
      <span className='hidden md:inline'>{label}</span>
    </Button>
  )
}
