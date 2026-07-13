import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileVideo, Grid2x2, ImageOff, Sparkles, ZoomIn } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'

function isVideoUrl(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(clean)
}

export interface MultiImageOutputNodeData {
  name: string
  urls: string[]
  displayMode: 'single' | 'multi'
  onToggleMode: () => void
  onPreview: (url: string) => void
  onEditImage: (url: string) => void
  imageEditStates?: Record<string, unknown>
  [key: string]: unknown
}

function MultiImageOutputNodeComponent({ data, selected }: NodeProps) {
  const d = data as MultiImageOutputNodeData
  const isMultiSelect = useMultiSelect()
  const shownUrls = d.displayMode === 'multi' ? d.urls : d.urls.slice(-1)
  const nodeWidth = Math.max(280, shownUrls.length > 0 ? shownUrls.length * 156 + 20 : 280)

  return (
    <div
      className={cn(
        'comfy-asset-node relative overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.10)]',
        selected && isMultiSelect && 'ring-2 ring-neutral-900/70'
      )}
      style={{ width: nodeWidth }}
    >
      <Handle type="target" position={Position.Left} className="comfy-handle comfy-handle-center" />

      <div className="relative overflow-hidden bg-neutral-950 px-3.5 py-2 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-2">
          <Grid2x2 size={14} className="shrink-0 opacity-90" />
          <span className="flex-1 truncate text-xs font-semibold tracking-tight">{d.name}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
            {d.urls.length} 张
          </span>
        </div>
      </div>

      <div className="p-2.5">
        {shownUrls.length === 0 ? (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-neutral-300">
            <ImageOff size={26} />
            <span className="text-xs">连接循环节点输出</span>
          </div>
        ) : (
          <div className="nodrag flex gap-2">
            {shownUrls.map((url, index) => {
              const isVideo = isVideoUrl(url)
              return (
                <div
                  key={`${url}-${index}`}
                  className="group relative h-[180px] w-36 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50"
                >
                  {isVideo ? (
                    <video src={url} controls muted playsInline className="h-full w-full object-contain" />
                  ) : (
                    <img src={url} alt={`${d.name}-${index + 1}`} className="h-full w-full object-contain" />
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
    </div>
  )
}

export const MultiImageOutputNode = memo(MultiImageOutputNodeComponent)
