import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Check, FileVideo, Grid2x2, Image as ImageIcon, ImageOff, Lock, Pencil, Square, Sparkles, Trash2, Unlock, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'

export interface AssetParamItem {
  label: string
  value: string
}

function isVideoUrl(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(clean)
}

export interface AssetNodeData {
  name: string
  urls: string[]
  /** V0 原始 urls 快照（首次编辑前的基线）。仅在第一次编辑时被记录。 */
  baselineUrls?: string[]
  /** 当前显示的版本 id；空表示显示 baseline/原图 */
  activeVersionId?: string
  displayMode: 'single' | 'multi'
  /**
   * 媒体类型。若明确指定则按此渲染 <img>/<video>/<audio>；
   * 若未指定则根据 URL 后缀自动判断（向后兼容）。
   * 服务端 outputSlot.mediaKind 会透传到这里，保证多输出场景语义精确。
   */
  mediaKind?: 'image' | 'video' | 'audio'
  /** 关联的 outputSlot key（=ComfyUI SaveXxx 节点 id），供 handleRun 精确分派使用 */
  slotKey?: string
  locked?: boolean
  elapsedMs?: number
  prompt?: string
  aspectRatio?: string
  params?: AssetParamItem[]
  editVersions?: unknown[]
  imageEditStates?: Record<string, unknown>
  onRename: (name: string) => void
  onToggleMode: () => void
  onToggleLock: () => void
  onPreview: (url: string) => void
  onEditImage: (url: string) => void
  onDelete: () => void
  [key: string]: unknown
}

function AssetNodeComponent({ data, selected }: NodeProps) {
  const d = data as AssetNodeData
  const isMultiSelect = useMultiSelect()
  const isMulti = d.displayMode === 'multi'
  const shownUrls = isMulti ? d.urls : d.urls.slice(-1)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(d.name)

  const commitRename = () => {
    d.onRename(draft.trim() || d.name)
    setEditing(false)
  }

  return (
    <div
      className={cn(
        'comfy-asset-node w-[280px] overflow-hidden rounded-2xl border bg-white shadow-[0_8px_30px_rgb(0,0,0,0.10)]',
        d.locked ? 'border-amber-400/80' : 'border-neutral-200/80',
        selected && isMultiSelect && 'ring-2 ring-neutral-900/70'
      )}
    >
      <Handle type="target" position={Position.Left} className="comfy-handle" />

      <div className="flex items-center gap-2 bg-gradient-to-r from-neutral-700 via-neutral-800 to-neutral-900 px-3.5 py-2 text-white">
        <ImageIcon size={14} className="shrink-0 opacity-90" />
        {editing ? (
          <input
            autoFocus
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onBlur={commitRename}
            onKeyDown={(e) => {
              if (e.key === 'Enter') commitRename()
              if (e.key === 'Escape') {
                setDraft(d.name)
                setEditing(false)
              }
            }}
            className="nodrag h-6 flex-1 rounded border border-white/30 bg-white/10 px-1.5 text-xs text-white outline-none"
          />
        ) : (
          <span className="flex-1 truncate text-xs font-semibold tracking-tight">{d.name}</span>
        )}
        {editing ? (
          <button onClick={commitRename} className="nodrag shrink-0 text-white/80 hover:text-white" title="确认">
            <Check size={13} />
          </button>
        ) : (
          <>
            <button
              onClick={() => {
                setDraft(d.name)
                setEditing(true)
              }}
              className="nodrag shrink-0 text-white/60 hover:text-white"
              title="重命名"
            >
              <Pencil size={12} />
            </button>
            <button
              onClick={() => d.onToggleLock()}
              className={cn(
                'nodrag shrink-0 transition-colors',
                d.locked ? 'text-amber-300 hover:text-amber-200' : 'text-white/60 hover:text-white'
              )}
              title={d.locked ? '已锁定：再次生图将新建输出节点' : '锁定：保护此输出，再次生图新建节点'}
            >
              {d.locked ? <Lock size={12} /> : <Unlock size={12} />}
            </button>
            <button
              onClick={() => d.onDelete()}
              className="nodrag shrink-0 text-white/60 transition-colors hover:text-red-300"
              title="删除输出节点和本地图片"
            >
              <Trash2 size={12} />
            </button>
            {d.urls.length > 1 && (
              <button
                onClick={() => d.onToggleMode()}
                className="nodrag flex shrink-0 items-center gap-1 rounded-md border border-white/20 bg-white/10 px-1.5 py-0.5 text-[10px] text-white/90 transition-colors hover:bg-white/20"
                title={isMulti ? '切换为单图' : '切换为多图'}
              >
                {isMulti ? <Grid2x2 size={11} /> : <Square size={11} />}
                {isMulti ? '多图' : '单图'}
              </button>
            )}
          </>
        )}
      </div>

      <div className="p-2.5">
        {shownUrls.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-neutral-300">
            <ImageOff size={26} />
            <span className="text-xs">连接生成节点输出</span>
          </div>
        ) : (
          <div className={cn(isMulti ? 'grid grid-cols-2 gap-2' : 'space-y-2')}>
            {shownUrls.map((url) => {
              // 媒体类型判定：优先使用 slot 声明的 mediaKind，否则按 URL 后缀猜（兼容旧数据）
              const kind = d.mediaKind ?? (isVideoUrl(url) ? 'video' : 'image')
              const isVideo = kind === 'video'
              const isAudio = kind === 'audio'
              return (
                <div
                  key={url}
                  className="nodrag group relative block w-full overflow-hidden rounded-lg border border-neutral-100"
                >
                  {isVideo ? (
                    <video src={url} controls muted playsInline className="w-full object-contain" />
                  ) : isAudio ? (
                    <div className='flex w-full items-center gap-2 bg-neutral-50 px-3 py-2'>
                      <FileVideo size={18} className='shrink-0 text-neutral-500' />
                      <audio src={url} controls className='min-w-0 flex-1' />
                    </div>
                  ) : (
                    <img
                      src={url}
                      alt={d.name}
                      className="w-full object-contain"
                      onLoad={() => console.log('[AssetNode] img 加载成功:', url)}
                      onError={(e) => {
                        console.error('[AssetNode] img 加载失败:', url, e.currentTarget.naturalWidth)
                        e.currentTarget.style.background = 'linear-gradient(135deg, #fef2f2, #fee2e2)'
                        e.currentTarget.style.minHeight = '80px'
                      }}
                    />
                  )}
                  <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                    <button
                      onClick={() => d.onPreview(url)}
                      title={isVideo ? '预览视频' : '放大预览'}
                      className="flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
                    >
                      {isVideo ? <FileVideo size={16} /> : <ZoomIn size={16} />}
                    </button>
                    {!isVideo && (
                      <button
                        onClick={() => d.onEditImage(url)}
                        title="编辑此图"
                        className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white shadow-md backdrop-blur-sm transition-transform hover:scale-105"
                      >
                        <Sparkles size={16} />
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Right} className="comfy-handle" />
    </div>
  )
}

export const AssetNode = memo(AssetNodeComponent)
