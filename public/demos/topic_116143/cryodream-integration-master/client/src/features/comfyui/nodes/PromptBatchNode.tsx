import { memo } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Grid2x2, Image as ImageIcon, ImageOff, Loader2, Play, Square, ZoomIn } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'

export interface PromptBatchNodeData {
  name: string
  prompts: string
  urls: string[]
  displayMode: 'single' | 'multi'
  running: boolean
  progress?: number | null
  stage?: string
  onChangePrompts: (prompts: string) => void
  onRun: () => void
  onToggleMode: () => void
  onPreview: (url: string) => void
  [key: string]: unknown
}

function PromptBatchNodeComponent({ data, selected }: NodeProps) {
  const d = data as PromptBatchNodeData
  const isMultiSelect = useMultiSelect()
  const promptCount = d.prompts
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean).length
  const shownUrls = d.displayMode === 'multi' ? d.urls : d.urls.slice(-1)

  return (
    <div
      className={cn(
        'w-[320px] overflow-hidden rounded-[18px] border border-blue-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.10)]',
        selected && isMultiSelect && 'ring-2 ring-blue-500/70'
      )}
    >
      <Handle type="target" position={Position.Left} className="comfy-handle" />

      <div className="flex items-center gap-2 bg-gradient-to-br from-blue-700 via-sky-700 to-cyan-600 px-4 py-3 text-white">
        <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
          <Grid2x2 size={14} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-[13px] font-semibold tracking-tight">{d.name}</div>
          <div className="text-[10px] text-white/70">自动调用画布中的 Z-image 文生图</div>
        </div>
        <span className="rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium">
          {promptCount} 条
        </span>
      </div>

      <div className="space-y-2.5 px-4 py-3.5">
        <Textarea
          value={d.prompts}
          onChange={(e) => d.onChangePrompts(e.target.value)}
          rows={5}
          className="nodrag min-h-[110px] resize-y rounded-lg border-blue-100 bg-blue-50/40 text-xs leading-relaxed focus-visible:ring-blue-500/20"
          placeholder="每行一个提示词，例如：\n一只白猫坐在窗边\n赛博朋克城市夜景\n森林里的发光蘑菇"
        />

        <div className="flex items-center gap-2">
          <Button
            onClick={d.onRun}
            disabled={d.running || promptCount === 0}
            className="h-9 flex-1 rounded-lg bg-blue-700 text-xs font-semibold text-white shadow-sm transition-all hover:bg-blue-800"
          >
            {d.running ? (
              <>
                <Loader2 size={14} className="mr-1.5 animate-spin" />
                {(d.stage as string) || '批量生成中'}
                {typeof d.progress === 'number' && d.progress > 0 ? ` ${d.progress}%` : ''}
              </>
            ) : (
              <>
                <Play size={14} className="mr-1.5" /> 批量生成
              </>
            )}
          </Button>
          {d.urls.length > 1 && (
            <button
              onClick={d.onToggleMode}
              className="nodrag flex h-9 shrink-0 items-center gap-1 rounded-lg border border-blue-100 bg-blue-50 px-2 text-[11px] text-blue-700 transition-colors hover:bg-blue-100"
              title={d.displayMode === 'multi' ? '切换为单图' : '切换为多图'}
            >
              {d.displayMode === 'multi' ? <Grid2x2 size={13} /> : <Square size={13} />}
              {d.displayMode === 'multi' ? '多图' : '单图'}
            </button>
          )}
        </div>

        {d.running && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-blue-50">
            {typeof d.progress === 'number' && d.progress > 0 ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-500 to-blue-700 transition-all duration-300"
                style={{ width: `${d.progress}%` }}
              />
            ) : (
              <div className="comfy-indeterminate h-full w-2/5 rounded-full bg-gradient-to-r from-sky-400 to-blue-700" />
            )}
          </div>
        )}
      </div>

      <div className="border-t border-blue-50 p-2.5">
        {shownUrls.length === 0 ? (
          <div className="flex h-32 flex-col items-center justify-center gap-2 text-blue-200">
            <ImageOff size={24} />
            <span className="text-xs">批量结果会显示在这里</span>
          </div>
        ) : (
          <div className={cn(d.displayMode === 'multi' ? 'grid grid-cols-2 gap-2' : 'space-y-2')}>
            {shownUrls.map((url, index) => (
              <div key={`${url}-${index}`} className="nodrag group relative overflow-hidden rounded-lg border border-blue-50">
                <img src={url} alt={`${d.name}-${index + 1}`} className="w-full object-contain" />
                <div className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all group-hover:bg-black/30 group-hover:opacity-100">
                  <button
                    onClick={() => d.onPreview(url)}
                    className="flex size-9 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm transition-transform hover:scale-105"
                    title="放大预览"
                  >
                    <ZoomIn size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-1.5 border-t border-blue-50 px-4 py-1.5 text-[10px] text-blue-300">
        <ImageIcon size={11} />
        多提示词输出
      </div>
    </div>
  )
}

export const PromptBatchNode = memo(PromptBatchNodeComponent)
