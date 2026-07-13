import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { FileVideo, Image as ImageIcon, Loader2, Music, Play, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'
import type { ComfyParam } from '../api/comfyui-api'

export interface ScilWorkflowNodeData {
  name: string
  outputType: 'image' | 'video' | 'audio'
  params?: ComfyParam[]
  running?: boolean
  progress?: number | null
  stage?: string
  onRun?: () => void
  [key: string]: unknown
}

function ScilWorkflowNodeComponent({ data, selected }: NodeProps) {
  const d = data as ScilWorkflowNodeData
  const isMultiSelect = useMultiSelect()
  const isVideo = d.outputType === 'video'
  const isAudio = d.outputType === 'audio'
  const Icon = isVideo ? FileVideo : isAudio ? Music : ImageIcon

  return (
    <div
      className={cn(
        'comfy-asset-node relative w-[280px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.10)]',
        selected && isMultiSelect && 'ring-2 ring-neutral-900/70'
      )}
    >
      <Handle type="source" position={Position.Right} className="comfy-handle comfy-handle-center" />

      <div className="relative overflow-hidden bg-neutral-950 px-3.5 py-2 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-2">
          <Workflow size={14} className="shrink-0 opacity-90" />
          <span className="flex-1 truncate text-xs font-semibold tracking-tight">{d.name}</span>
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
            {isVideo ? '视频' : isAudio ? '音频' : '图片'}
          </span>
        </div>
      </div>

      <div className="space-y-2.5 p-2.5">
        <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
          <div className="mb-2 flex items-center justify-between text-[10px] font-medium text-neutral-500">
            <span>输入参数</span>
            <span>{d.params?.length ?? 0} 项</span>
          </div>
          <div className="line-clamp-2 text-[11px] leading-relaxed text-neutral-600">
            {(d.params ?? []).slice(0, 3).map((param) => param.label).join('、') || '无可配置参数'}
          </div>
        </div>

        <div className="rounded-lg border border-neutral-100 bg-neutral-50 px-3 py-2">
          <div className="flex items-center justify-between text-[10px] font-medium text-neutral-500">
            <span>输出</span>
            <span className="flex items-center gap-1 rounded-full border bg-white px-2 py-0.5 text-[10px] text-neutral-600">
              <Icon size={11} />
              {isVideo ? 'video' : 'image'}
            </span>
          </div>
        </div>

        {d.onRun && (
          <Button
            onClick={d.onRun}
            disabled={d.running}
            className="nodrag h-8 w-full rounded-lg bg-neutral-950 text-xs font-semibold text-white hover:bg-neutral-800"
          >
            {d.running ? (
              <>
                <Loader2 size={13} className="mr-1.5 animate-spin" />
                {(d.stage as string) || '运行中'}
                {typeof d.progress === 'number' && d.progress > 0 ? ` ${d.progress}%` : ''}
              </>
            ) : (
              <>
                <Play size={13} className="mr-1.5" />
                运行工作流
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  )
}

export const ScilWorkflowNode = memo(ScilWorkflowNodeComponent)
