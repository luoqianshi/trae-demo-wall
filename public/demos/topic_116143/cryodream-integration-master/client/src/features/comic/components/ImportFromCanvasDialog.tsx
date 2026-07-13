import { useEffect, useMemo, useState } from 'react'
import { Check, ImageIcon, Loader2, Search, X } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { comfyuiProjectApi, type ComfyProject } from '@/features/comfyui/api/project-api'
import { comicProjectApi } from '../api/comic-api'
import type { AssetGroup, ComicAsset } from '../types'

interface CanvasAsset {
  id: string
  name: string
  url: string
}

interface Props {
  open: boolean
  onClose: () => void
  /** 当前漫画项目的现有素材（用于去重展示） */
  existingAssets: ComicAsset[]
  /** 可用分组列表（供选择导入到哪个分组） */
  assetGroups: AssetGroup[]
  /** 默认落入的分组 id；'all' → 未分组，其它 → 指定分组 */
  defaultGroupId: string | null
  /** 导入图片：会以 asset 形式追加到素材库 */
  onImport: (assets: ComicAsset[]) => void
  /** 允许现场新建分组 */
  onCreateGroup?: (name: string) => AssetGroup
}

/**
 * 从画布项目导入图片弹窗：
 * - 左侧：画布项目列表
 * - 右侧：所选项目下的图片按原始宽高比自适应展开（不裁剪），可多选后导入到当前漫画的素材库
 */
export function ImportFromCanvasDialog({
  open,
  onClose,
  existingAssets,
  assetGroups,
  defaultGroupId,
  onImport,
  onCreateGroup,
}: Props) {
  const [loadingProjects, setLoadingProjects] = useState(false)
  const [projects, setProjects] = useState<ComfyProject[]>([])
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null)
  const [loadingAssets, setLoadingAssets] = useState(false)
  const [assets, setAssets] = useState<CanvasAsset[]>([])
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [searchKeyword, setSearchKeyword] = useState('')
  const [targetGroupId, setTargetGroupId] = useState<string | null>(defaultGroupId)
  const [creatingGroup, setCreatingGroup] = useState(false)
  const [newGroupName, setNewGroupName] = useState('')

  const existingUrls = useMemo(() => new Set(existingAssets.map((a) => a.url)), [existingAssets])

  useEffect(() => {
    if (!open) return
    setTargetGroupId(defaultGroupId)
    setSelectedIds(new Set())
    setSearchKeyword('')
    void loadProjects()
  }, [open, defaultGroupId])

  useEffect(() => {
    if (!open) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  const loadProjects = async () => {
    setLoadingProjects(true)
    try {
      const data = await comfyuiProjectApi.list()
      setProjects(data)
      if (data.length > 0) {
        const firstId = data[0].id
        setActiveProjectId(firstId)
        void loadAssets(firstId)
      } else {
        setActiveProjectId(null)
        setAssets([])
      }
    } catch (e) {
      toast.error(`加载画布项目失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setLoadingProjects(false)
    }
  }

  const loadAssets = async (projectId: string) => {
    setLoadingAssets(true)
    setAssets([])
    setSelectedIds(new Set())
    try {
      const data = await comicProjectApi.listComfyuiAssets(projectId)
      setAssets(data)
    } catch (e) {
      toast.error(`加载画布图片失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setLoadingAssets(false)
    }
  }

  const filteredAssets = useMemo(() => {
    const kw = searchKeyword.trim().toLowerCase()
    if (!kw) return assets
    return assets.filter(
      (a) => a.name.toLowerCase().includes(kw) || a.url.toLowerCase().includes(kw)
    )
  }, [assets, searchKeyword])

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAll = () => {
    setSelectedIds(new Set(filteredAssets.map((a) => a.id)))
  }

  const clearSelection = () => setSelectedIds(new Set())

  const handleImport = () => {
    if (selectedIds.size === 0) {
      toast.warning('请先选择要导入的图片')
      return
    }
    const picked = assets.filter((a) => selectedIds.has(a.id))
    const groupId = targetGroupId ?? undefined
    const newAssets: ComicAsset[] = picked.map((a) => ({
      id: crypto.randomUUID(),
      url: a.url,
      name: a.name,
      groupId,
    }))
    onImport(newAssets)
    toast.success(`已导入 ${newAssets.length} 张图片`)
    onClose()
  }

  const handleCreateGroup = () => {
    const name = newGroupName.trim()
    if (!name || !onCreateGroup) {
      setCreatingGroup(false)
      setNewGroupName('')
      return
    }
    const g = onCreateGroup(name)
    setTargetGroupId(g.id)
    setCreatingGroup(false)
    setNewGroupName('')
  }

  if (!open) return null

  return (
    <div
      className='fixed inset-0 z-[1200] flex items-center justify-center bg-black/60 p-6'
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className='flex h-[90vh] w-[90vw] max-w-[1400px] flex-col overflow-hidden rounded-xl bg-white shadow-2xl'
      >
        {/* Header */}
        <div className='flex items-center justify-between border-b border-neutral-100 px-4 py-3'>
          <div>
            <h3 className='text-sm font-semibold text-neutral-800'>从画布项目导入图片</h3>
            <p className='mt-0.5 text-[11px] text-neutral-500'>
              选择画布项目，勾选需要导入的图片素材，将按原始宽高比展示
            </p>
          </div>
          <button
            type='button'
            onClick={onClose}
            className='flex size-8 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
            title='关闭 (Esc)'
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className='flex min-h-0 flex-1'>
          {/* 左：项目列表 */}
          <aside className='flex w-64 shrink-0 flex-col border-r border-neutral-100 bg-neutral-50/60'>
            <div className='border-b border-neutral-100 px-3 py-2 text-[11px] font-semibold text-neutral-500'>
              画布项目（{projects.length}）
            </div>
            <div className='min-h-0 flex-1 overflow-y-auto'>
              {loadingProjects ? (
                <div className='flex items-center justify-center gap-2 py-8 text-xs text-neutral-400'>
                  <Loader2 size={14} className='animate-spin' /> 加载中
                </div>
              ) : projects.length === 0 ? (
                <div className='px-3 py-8 text-center text-xs text-neutral-400'>
                  暂无画布项目
                </div>
              ) : (
                <ul>
                  {projects.map((p) => (
                    <li key={p.id}>
                      <button
                        type='button'
                        onClick={() => {
                          setActiveProjectId(p.id)
                          void loadAssets(p.id)
                        }}
                        className={cn(
                          'flex w-full flex-col items-start gap-0.5 border-l-2 px-3 py-2 text-left text-[12px] transition-colors',
                          activeProjectId === p.id
                            ? 'border-fuchsia-500 bg-white text-fuchsia-700'
                            : 'border-transparent text-neutral-600 hover:bg-white hover:text-neutral-900'
                        )}
                      >
                        <span className='w-full truncate font-medium'>{p.name}</span>
                        {p.updateTime && (
                          <span className='text-[10px] text-neutral-400'>{p.updateTime}</span>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </aside>

          {/* 右：图片瀑布 */}
          <section className='flex min-w-0 flex-1 flex-col'>
            {/* 工具栏 */}
            <div className='flex flex-wrap items-center gap-2 border-b border-neutral-100 px-3 py-2'>
              <div className='flex items-center gap-1.5 rounded-md border border-neutral-200 bg-white px-2 py-1'>
                <Search size={12} className='text-neutral-400' />
                <input
                  type='text'
                  value={searchKeyword}
                  onChange={(e) => setSearchKeyword(e.target.value)}
                  placeholder='搜索图片名称...'
                  className='w-40 border-0 bg-transparent p-0 text-[11px] outline-none placeholder:text-neutral-400'
                />
              </div>
              <div className='flex items-center gap-1 text-[11px] text-neutral-500'>
                <span>共 {filteredAssets.length} 张</span>
                <span className='mx-1 text-neutral-300'>·</span>
                <span>已选 {selectedIds.size}</span>
              </div>
              <button
                type='button'
                onClick={selectAll}
                disabled={filteredAssets.length === 0}
                className='rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600 hover:border-fuchsia-300 hover:text-fuchsia-600 disabled:opacity-50'
              >
                全选
              </button>
              <button
                type='button'
                onClick={clearSelection}
                disabled={selectedIds.size === 0}
                className='rounded border border-neutral-200 bg-white px-2 py-1 text-[11px] text-neutral-600 hover:border-fuchsia-300 hover:text-fuchsia-600 disabled:opacity-50'
              >
                清空
              </button>

              {/* 目标分组选择 */}
              <div className='ml-auto flex items-center gap-1.5 text-[11px]'>
                <span className='text-neutral-500'>导入到</span>
                <div className='flex flex-wrap items-center gap-1'>
                  <GroupChip
                    active={targetGroupId === null}
                    onClick={() => setTargetGroupId(null)}
                    label='未分组'
                  />
                  {assetGroups.map((g) => (
                    <GroupChip
                      key={g.id}
                      active={targetGroupId === g.id}
                      onClick={() => setTargetGroupId(g.id)}
                      label={g.name}
                    />
                  ))}
                  {onCreateGroup &&
                    (creatingGroup ? (
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
                        >
                          <Check size={10} />
                        </button>
                      </div>
                    ) : (
                      <button
                        type='button'
                        onClick={() => setCreatingGroup(true)}
                        className='rounded-full border border-dashed border-neutral-300 px-2 py-0.5 text-neutral-500 hover:border-fuchsia-300 hover:text-fuchsia-600'
                      >
                        + 新建
                      </button>
                    ))}
                </div>
              </div>
            </div>

            {/* 图片区域 */}
            <div className='min-h-0 flex-1 overflow-y-auto bg-neutral-50/40 p-4'>
              {loadingAssets ? (
                <div className='flex items-center justify-center gap-2 py-8 text-xs text-neutral-400'>
                  <Loader2 size={14} className='animate-spin' /> 加载图片中
                </div>
              ) : filteredAssets.length === 0 ? (
                <div className='flex flex-col items-center gap-2 py-16 text-center text-xs text-neutral-400'>
                  <ImageIcon size={40} />
                  <span>
                    {assets.length === 0
                      ? '该画布项目暂无图片素材'
                      : '当前筛选条件下无匹配图片'}
                  </span>
                </div>
              ) : (
                <div className='flex flex-wrap gap-4'>
                  {filteredAssets.map((a) => {
                    const selected = selectedIds.has(a.id)
                    const duplicated = existingUrls.has(a.url)
                    return (
                      <div
                        key={a.id}
                        onClick={() => toggle(a.id)}
                        className={cn(
                          'group relative flex cursor-pointer flex-col overflow-hidden rounded-lg border-2 bg-white transition-all',
                          selected
                            ? 'border-fuchsia-500 shadow-lg'
                            : duplicated
                              ? 'border-amber-200 hover:border-amber-400'
                              : 'border-neutral-200 hover:border-fuchsia-300 hover:shadow'
                        )}
                        style={{ maxWidth: 320 }}
                        title={a.name}
                      >
                        <div className='bg-neutral-100'>
                          <img
                            src={a.url}
                            alt={a.name}
                            draggable={false}
                            /* 保持图片原始宽高比：max 尺寸约束，不裁剪 */
                            className='block h-auto max-h-[320px] w-auto max-w-[320px] object-contain'
                          />
                        </div>
                        <div className='flex items-center justify-between gap-1 px-2 py-1'>
                          <span
                            className='truncate text-[10px] text-neutral-600'
                            title={a.name}
                          >
                            {a.name}
                          </span>
                          {duplicated && !selected && (
                            <span className='rounded-full bg-amber-100 px-1.5 py-0.5 text-[9px] text-amber-700'>
                              已存在
                            </span>
                          )}
                        </div>

                        {/* 选中角标 */}
                        <div
                          className={cn(
                            'absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border-2 shadow transition-all',
                            selected
                              ? 'border-white bg-fuchsia-500 text-white'
                              : 'border-white/80 bg-white/70 text-transparent group-hover:border-fuchsia-400 group-hover:text-neutral-400'
                          )}
                        >
                          <Check size={12} />
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className='flex items-center justify-between border-t border-neutral-100 px-4 py-3'>
          <div className='text-[11px] text-neutral-500'>
            {selectedIds.size > 0 && (
              <>
                将把 <span className='font-medium text-fuchsia-600'>{selectedIds.size}</span> 张图片导入到「
                {targetGroupId
                  ? assetGroups.find((g) => g.id === targetGroupId)?.name ?? '未知分组'
                  : '未分组'}
                」
              </>
            )}
          </div>
          <div className='flex items-center gap-2'>
            <button
              type='button'
              onClick={onClose}
              className='rounded border border-neutral-200 bg-white px-3 py-1.5 text-xs text-neutral-600 hover:bg-neutral-50'
            >
              取消
            </button>
            <button
              type='button'
              onClick={handleImport}
              disabled={selectedIds.size === 0}
              className='rounded bg-fuchsia-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm hover:bg-fuchsia-700 disabled:cursor-not-allowed disabled:opacity-40'
            >
              导入 {selectedIds.size > 0 && `(${selectedIds.size})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

function GroupChip({
  active,
  onClick,
  label,
}: {
  active: boolean
  onClick: () => void
  label: string
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
    </button>
  )
}
