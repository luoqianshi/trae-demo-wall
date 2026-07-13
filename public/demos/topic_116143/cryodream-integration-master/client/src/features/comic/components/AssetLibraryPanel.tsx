import { useEffect, useMemo, useRef, useState } from 'react'
import {
  Check,
  Download,
  FolderPlus,
  Image as ImageIcon,
  Loader2,
  Maximize2,
  MoveRight,
  Pencil,
  Trash2,
  Upload,
  X,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { comfyuiApi } from '@/features/comfyui/api/comfyui-api'
import type { AssetGroup, ComicAsset, ComicLayer } from '../types'
import { ImageEditSection } from './ImageEditSection'
import { ImportFromCanvasDialog } from './ImportFromCanvasDialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

interface Props {
  projectId?: string
  assets: ComicAsset[]
  assetGroups: AssetGroup[]
  /** 当前画布选中的图层，用于 AI 编辑自动读取图片 */
  selectedLayer?: ComicLayer | null
  onAddAsset: (asset: ComicAsset) => void
  onAddImageAsset: (asset: ComicAsset) => void
  onRemoveAsset?: (asset: ComicAsset) => void
  onAddGroup: (name: string) => AssetGroup
  onRenameGroup: (groupId: string, name: string) => void
  onRemoveGroup: (groupId: string, deleteAssets?: boolean) => void
  onMoveAssetToGroup: (assetId: string, groupId: string | null) => void
}

/**
 * 分组特殊标识：'all' = 全部素材；null = 未分组；其它为具体分组 id
 */
type GroupFilter = 'all' | string | null

/**
 * 素材面板：支持分组管理，本地上传图片 + 已上传素材列表，下方集成 AI 图片编辑区域。
 * 单击素材：仅选中（用于 AI 编辑参考）；双击素材：加入到画格并自适应大小。
 * 上传 / AI 生成的图片会自动落到当前选中分组中。
 */
export function AssetLibraryPanel({
  projectId,
  assets,
  assetGroups,
  selectedLayer,
  onAddAsset,
  onAddImageAsset,
  onRemoveAsset,
  onAddGroup,
  onRenameGroup,
  onRemoveGroup,
  onMoveAssetToGroup,
}: Props) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [previewAsset, setPreviewAsset] = useState<ComicAsset | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // 当前选中分组：'all' | null (未分组) | groupId
  const [activeGroup, setActiveGroup] = useState<GroupFilter>('all')

  // 分组重命名 / 新建输入态
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')
  const [renamingGroupId, setRenamingGroupId] = useState<string | null>(null)
  const [renamingName, setRenamingName] = useState('')

  // 从画布导入弹窗
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // Esc 关闭预览
  useEffect(() => {
    if (!previewAsset) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setPreviewAsset(null)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [previewAsset])

  // 当分组被删除时，若当前选中的正是该分组，回退到「全部」
  useEffect(() => {
    if (activeGroup && activeGroup !== 'all' && activeGroup !== null) {
      if (!assetGroups.some((g) => g.id === activeGroup)) {
        setActiveGroup('all')
      }
    }
  }, [assetGroups, activeGroup])

  /** 新上传 / AI 生成的图片默认落到的分组 id（null 表示未分组） */
  const targetGroupId = useMemo<string | null>(() => {
    if (activeGroup === 'all') return null
    return activeGroup
  }, [activeGroup])

  /** 根据 activeGroup 过滤要展示的素材 */
  const visibleAssets = useMemo(() => {
    if (activeGroup === 'all') return assets
    if (activeGroup === null) return assets.filter((a) => !a.groupId)
    return assets.filter((a) => a.groupId === activeGroup)
  }, [assets, activeGroup])

  const currentGroupName = useMemo(() => {
    if (activeGroup === 'all') return '全部'
    if (activeGroup === null) return '未分组'
    return assetGroups.find((g) => g.id === activeGroup)?.name ?? '未知分组'
  }, [activeGroup, assetGroups])

  const uploadFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件')
      return
    }
    setUploading(true)
    try {
      const result = await comfyuiApi.uploadImage(file, undefined, projectId)
      const url = result.url ?? `/api/comfyui-output/${result.name}`
      const asset: ComicAsset = {
        id: crypto.randomUUID(),
        url,
        name: file.name,
        groupId: targetGroupId ?? undefined,
      }
      onAddAsset(asset)
      toast.success(`已上传「${file.name}」`)
    } catch (e) {
      toast.error(`上传失败:${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setUploading(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      for (const file of Array.from(files)) {
        void uploadFile(file)
      }
    }
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const files = e.dataTransfer.files
    if (files) {
      for (const file of Array.from(files)) {
        void uploadFile(file)
      }
    }
  }

  /** AI 编辑完成:将结果图片添加到素材库（同样归到当前分组） */
  const handleAiEdited = (urls: string[]) => {
    for (const url of urls) {
      const name = `AI编辑_${Date.now()}.png`
      onAddAsset({
        id: crypto.randomUUID(),
        url,
        name,
        groupId: targetGroupId ?? undefined,
      })
    }
  }

  /** 删除素材:同步删除后端 / 本地文件夹中的文件（无二次确认） */
  const handleDeleteAsset = async (e: React.MouseEvent, asset: ComicAsset) => {
    e.stopPropagation()
    if (deletingId) return
    setDeletingId(asset.id)
    try {
      onRemoveAsset?.(asset)
      try {
        await comfyuiApi.deleteOutputImage(asset.url)
      } catch (err) {
        console.warn('[AssetLibrary] 后端删除文件失败（可忽略）:', err)
      }
      if (selectedAssetId === asset.id) setSelectedAssetId(null)
      toast.success(`已删除「${asset.name}」`)
    } catch (err) {
      toast.error(`删除失败:${err instanceof Error ? err.message : '未知错误'}`)
    } finally {
      setDeletingId(null)
    }
  }

  const handleCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name) {
      setCreatingGroup(false)
      setNewGroupName('')
      return
    }
    const g = onAddGroup(name)
    setActiveGroup(g.id)
    setCreatingGroup(false)
    setNewGroupName('')
  }

  const handleSubmitRename = () => {
    if (!renamingGroupId) return
    const name = renamingName.trim()
    if (name) onRenameGroup(renamingGroupId, name)
    setRenamingGroupId(null)
    setRenamingName('')
  }

  return (
    <div className='flex h-full w-[28rem] flex-col border-r border-neutral-200 bg-white'>
      <div className='flex items-center justify-between border-b border-neutral-100 px-3 py-2'>
        <div className='flex items-center gap-1.5 text-xs font-semibold text-neutral-700'>
          <ImageIcon size={12} className='text-fuchsia-500' /> 图片素材
        </div>
        <div className='flex items-center gap-1'>
          {/* 从画布项目导入图片 */}
          <button
            type='button'
            onClick={() => setImportDialogOpen(true)}
            className='flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-100 hover:text-fuchsia-600'
            title='从画布项目导入图片'
          >
            <Download size={12} />
            画布导入
          </button>
          {/* 上传图标：紧凑触发器，替代大块虚线框 */}
          <button
            type='button'
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={handleDrop}
            disabled={uploading}
            className={cn(
              'flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] transition-colors',
              dragOver
                ? 'bg-blue-50 text-blue-600'
                : 'text-neutral-500 hover:bg-neutral-100 hover:text-fuchsia-600',
              uploading && 'opacity-60'
            )}
            title={
              activeGroup === 'all'
                ? '上传图片（可拖拽）'
                : `上传图片到「${currentGroupName}」（可拖拽）`
            }
          >
            {uploading ? (
              <Loader2 size={12} className='animate-spin' />
            ) : (
              <Upload size={12} />
            )}
            上传
          </button>
          <button
            type='button'
            onClick={() => {
              setCreatingGroup(true)
              setNewGroupName('')
            }}
            className='flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] text-neutral-500 hover:bg-neutral-100 hover:text-fuchsia-600'
            title='新建分组'
          >
            <FolderPlus size={12} />
            新建分组
          </button>
        </div>
      </div>

      {/* 分组 Tabs */}
      <div className='border-b border-neutral-100 bg-neutral-50/60 px-2 py-1.5'>
        <div className='flex flex-wrap gap-1'>
          <GroupChip
            active={activeGroup === 'all'}
            onClick={() => setActiveGroup('all')}
            label='全部'
            count={assets.length}
          />
          <GroupChip
            active={activeGroup === null}
            onClick={() => setActiveGroup(null)}
            label='未分组'
            count={assets.filter((a) => !a.groupId).length}
          />
          {assetGroups.map((g) => {
            const count = assets.filter((a) => a.groupId === g.id).length
            const isRenaming = renamingGroupId === g.id
            if (isRenaming) {
              return (
                <div
                  key={g.id}
                  className='flex items-center gap-0.5 rounded-full border border-fuchsia-300 bg-white px-1.5 py-0.5'
                >
                  <input
                    autoFocus
                    value={renamingName}
                    onChange={(e) => setRenamingName(e.target.value)}
                    onBlur={handleSubmitRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleSubmitRename()
                      if (e.key === 'Escape') {
                        setRenamingGroupId(null)
                        setRenamingName('')
                      }
                    }}
                    className='w-20 border-0 bg-transparent p-0 text-[11px] outline-none'
                  />
                  <button
                    type='button'
                    onClick={handleSubmitRename}
                    className='rounded p-0.5 text-fuchsia-600 hover:bg-fuchsia-50'
                    title='保存'
                  >
                    <Check size={10} />
                  </button>
                </div>
              )
            }
            return (
              <div
                key={g.id}
                className={cn(
                  'group/tab flex items-center gap-0.5 rounded-full border px-2 py-0.5 text-[11px] transition-colors',
                  activeGroup === g.id
                    ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700'
                    : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
                )}
              >
                <button
                  type='button'
                  onClick={() => setActiveGroup(g.id)}
                  className='truncate max-w-[6rem]'
                  title={g.name}
                >
                  {g.name}
                  <span className='ml-1 text-[9px] text-neutral-400'>{count}</span>
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    setRenamingGroupId(g.id)
                    setRenamingName(g.name)
                  }}
                  className='rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:text-fuchsia-600 group-hover/tab:opacity-100'
                  title='重命名'
                >
                  <Pencil size={9} />
                </button>
                <button
                  type='button'
                  onClick={(e) => {
                    e.stopPropagation()
                    if (window.confirm(`删除分组「${g.name}」？组内素材将变为未分组（不会删除文件）。`)) {
                      onRemoveGroup(g.id, false)
                      if (activeGroup === g.id) setActiveGroup('all')
                    }
                  }}
                  className='rounded p-0.5 text-neutral-400 opacity-0 transition-opacity hover:text-rose-500 group-hover/tab:opacity-100'
                  title='删除分组（素材保留）'
                >
                  <Trash2 size={9} />
                </button>
              </div>
            )
          })}
          {creatingGroup && (
            <div className='flex items-center gap-0.5 rounded-full border border-fuchsia-300 bg-white px-1.5 py-0.5'>
              <input
                autoFocus
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onBlur={handleCreateGroup}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleCreateGroup()
                  if (e.key === 'Escape') {
                    setCreatingGroup(false)
                    setNewGroupName('')
                  }
                }}
                placeholder='分组名'
                className='w-20 border-0 bg-transparent p-0 text-[11px] outline-none'
              />
              <button
                type='button'
                onClick={handleCreateGroup}
                className='rounded p-0.5 text-fuchsia-600 hover:bg-fuchsia-50'
                title='创建'
              >
                <Check size={10} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          'relative min-h-0 flex-1 overflow-y-auto transition-colors',
          dragOver && 'bg-blue-50/60'
        )}
        onDragOver={(e) => {
          e.preventDefault()
          setDragOver(true)
        }}
        onDragLeave={(e) => {
          // 仅当离开外容器时才清除高亮
          if (e.currentTarget === e.target) setDragOver(false)
        }}
        onDrop={(e) => {
          setDragOver(false)
          handleDrop(e)
        }}
      >
        {dragOver && (
          <div className='pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-lg border-2 border-dashed border-blue-400 bg-white/60 text-xs text-blue-600 backdrop-blur-sm'>
            松开鼠标上传到「{currentGroupName}」
          </div>
        )}
        {/* 隐藏的文件选择输入 */}
        <input
          ref={fileInputRef}
          type='file'
          accept='image/*'
          multiple
          className='hidden'
          onChange={handleFileChange}
        />

        {/* 素材列表 */}
        {visibleAssets.length === 0 ? (
          <div className='flex flex-col items-center gap-2 py-8 text-center text-xs text-neutral-400'>
            <ImageIcon size={24} />
            <span>「{currentGroupName}」暂无图片素材</span>
            <button
              type='button'
              onClick={() => fileInputRef.current?.click()}
              className='mt-1 flex items-center gap-1 rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600 hover:border-fuchsia-300 hover:text-fuchsia-600'
            >
              <Upload size={12} />
              上传图片
            </button>
            <span className='text-[10px] text-neutral-300'>或拖拽图片到此区域</span>
          </div>
        ) : (
          <div className='grid grid-cols-4 gap-1.5 px-2 pb-2 pt-2'>
            {visibleAssets.map((a) => {
              const isSelected = selectedAssetId === a.id
              const isDeleting = deletingId === a.id
              return (
                <div
                  key={a.id}
                  onClick={() => setSelectedAssetId(a.id)}
                  onDoubleClick={() => {
                    setSelectedAssetId(a.id)
                    onAddImageAsset(a)
                  }}
                  className={cn(
                    'group relative flex cursor-pointer flex-col overflow-hidden rounded border bg-white transition-all',
                    isSelected
                      ? 'border-fuchsia-400 shadow ring-1 ring-fuchsia-200'
                      : 'border-neutral-200 hover:border-blue-400 hover:shadow'
                  )}
                  title={`${a.name}\n单击选中 · 双击加入画格`}
                >
                  <div className='aspect-square w-full bg-neutral-100'>
                    <img
                      src={a.url}
                      alt={a.name}
                      className='h-full w-full object-cover'
                      draggable={false}
                    />
                  </div>
                  <span className='truncate px-1 py-0.5 text-[10px] text-neutral-600'>{a.name}</span>

                  {/* 悬浮操作按钮组:放大 + 移动到 + 删除 */}
                  <div className='absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100'>
                    <button
                      type='button'
                      onClick={(e) => {
                        e.stopPropagation()
                        setPreviewAsset(a)
                      }}
                      className='flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-blue-500'
                      title='放大查看'
                    >
                      <Maximize2 size={10} />
                    </button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type='button'
                          onClick={(e) => e.stopPropagation()}
                          className='flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-fuchsia-500'
                          title='移动到分组'
                        >
                          <MoveRight size={10} />
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end' className='w-40'>
                        <DropdownMenuLabel className='text-xs'>移动到</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation()
                            onMoveAssetToGroup(a.id, null)
                          }}
                          className='text-xs'
                        >
                          未分组
                        </DropdownMenuItem>
                        {assetGroups.map((g) => (
                          <DropdownMenuItem
                            key={g.id}
                            onClick={(e) => {
                              e.stopPropagation()
                              onMoveAssetToGroup(a.id, g.id)
                            }}
                            className='text-xs'
                            disabled={g.id === a.groupId}
                          >
                            {g.name}
                            {g.id === a.groupId && (
                              <Check size={10} className='ml-auto text-fuchsia-500' />
                            )}
                          </DropdownMenuItem>
                        ))}
                        {assetGroups.length === 0 && (
                          <DropdownMenuItem disabled className='text-xs text-neutral-400'>
                            暂无分组
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <button
                      type='button'
                      onClick={(e) => handleDeleteAsset(e, a)}
                      disabled={isDeleting}
                      className={cn(
                        'flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-500 disabled:opacity-50',
                        isDeleting && '!opacity-100'
                      )}
                      title='删除（本地文件同步删除）'
                    >
                      {isDeleting ? (
                        <Loader2 size={10} className='animate-spin' />
                      ) : (
                        <Trash2 size={10} />
                      )}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* AI 编辑区域（底部，可折叠） */}
      <ImageEditSection
        projectId={projectId}
        selectedLayer={selectedLayer}
        selectedAssetUrl={assets.find((a) => a.id === selectedAssetId)?.url ?? null}
        onEdited={handleAiEdited}
      />

      {/* 从画布项目导入图片弹窗 */}
      <ImportFromCanvasDialog
        open={importDialogOpen}
        onClose={() => setImportDialogOpen(false)}
        existingAssets={assets}
        assetGroups={assetGroups}
        defaultGroupId={targetGroupId}
        onImport={(newAssets) => {
          newAssets.forEach((a) => onAddAsset(a))
        }}
        onCreateGroup={onAddGroup}
      />

      {/* 放大预览 Modal */}
      {previewAsset && (
        <div
          className='fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 p-8'
          onClick={() => setPreviewAsset(null)}
        >
          <button
            type='button'
            onClick={(e) => {
              e.stopPropagation()
              setPreviewAsset(null)
            }}
            className='absolute right-4 top-4 flex size-9 items-center justify-center rounded-full bg-white/10 text-white backdrop-blur transition-colors hover:bg-white/20'
            title='关闭 (Esc)'
          >
            <X size={18} />
          </button>
          <div
            className='flex max-h-full max-w-full flex-col items-center gap-3'
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={previewAsset.url}
              alt={previewAsset.name}
              className='max-h-[85vh] max-w-[90vw] rounded-lg object-contain shadow-2xl'
              draggable={false}
            />
            <div className='rounded-full bg-black/40 px-3 py-1 text-xs text-white/90 backdrop-blur'>
              {previewAsset.name}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function GroupChip({
  active,
  onClick,
  label,
  count,
}: {
  active: boolean
  onClick: () => void
  label: string
  count: number
}) {
  return (
    <button
      type='button'
      onClick={onClick}
      className={cn(
        'rounded-full border px-2 py-0.5 text-[11px] transition-colors',
        active
          ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700'
          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300'
      )}
    >
      {label}
      <span className='ml-1 text-[9px] text-neutral-400'>{count}</span>
    </button>
  )
}
