import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileVideo, ImageOff } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'

export interface VideoOutputNodeData {
  name: string
  urls: string[]
  onPreview?: (url: string) => void
  [key: string]: unknown
}

function VideoOutputNodeComponent({ data, selected }: NodeProps) {
  const d = data as VideoOutputNodeData
  const isMultiSelect = useMultiSelect()
  const nodeWidth = Math.max(280, d.urls.length > 0 ? d.urls.length * 236 + 20 : 280)

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
          <FileVideo size={14} className="shrink-0 opacity-90" />
          <span className="flex-1 truncate text-xs font-semibold tracking-tight">{d.name}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
            {d.urls.length} 个视频
          </span>
        </div>
      </div>

      <div className="p-2.5">
        {d.urls.length > 0 ? (
          <div className="nodrag flex gap-2">
            {d.urls.map((url, index) => (
              <div key={`${url}-${index}`} className="group relative h-[180px] w-56 shrink-0 overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                <video src={url} controls muted playsInline className="h-full w-full object-contain" />
                <div className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
                  视频 {index + 1}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex h-36 flex-col items-center justify-center gap-2 text-neutral-300">
            <ImageOff size={26} />
            <span className="text-xs">连接视频工作流输出</span>
          </div>
        )}
      </div>
    </div>
  )
}

export const VideoOutputNode = memo(VideoOutputNodeComponent)
