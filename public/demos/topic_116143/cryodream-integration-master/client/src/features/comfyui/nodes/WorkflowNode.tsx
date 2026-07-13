import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { ChevronDown, ChevronRight, FileVideo, ImageIcon, Loader2, Music, Play, Wand2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'
import { type ComfyParam } from '../api/comfyui-api'
import { paramLabel } from '../config/nodeMeta'
import { DimensionPicker } from '../components/DimensionPicker'
import { AdvancedParams, ImageField, VideoField } from '../components/AdvancedParams'

export interface WorkflowNodeData {
  nodeId: string
  backendId: string
  name: string
  outputType: 'image' | 'video'
  /**
   * 多输出插槽。工作流拖入时后端 detectOutputSlots 生成，透传到节点上。
   * 若为空，画布退化到单一 source handle（老工作流兼容）。
   */
  outputSlots?: Array<{ key: string; label: string; mediaKind: 'image' | 'video' | 'audio' }>
  params: ComfyParam[]
  values: Record<string, unknown>
  running: boolean
  progress?: number | null
  stage?: string
  onChangeValue: (key: string, value: unknown) => void
  onRun: (nodeId: string) => void
  [key: string]: unknown
}

function paramKey(p: ComfyParam) {
  return `${p.nodeId}.${p.paramName}`
}

function WorkflowNodeComponent({ data, selected }: NodeProps) {
  const d = data as WorkflowNodeData
  const isMultiSelect = useMultiSelect()
  const [showParams, setShowParams] = useState(false)
  const [showNegative, setShowNegative] = useState(false)

  // Prompt params: multiline string or known prompt node types
  const promptParams = d.params.filter((p) => {
    if (p.advanced === true) return false
    if (p.type === 'string' && p.multiline) return true
    return p.type === 'string' && (p.nodeType === 'CLIPTextEncode' || p.nodeType === 'PrimitiveStringMultiline')
  })
  const isNegative = (p: ComfyParam) => /负面|negative/i.test(p.title) || /负面|negative/i.test(p.label)
  const positivePrompts = promptParams.filter((p) => !isNegative(p))
  const negativePrompts = promptParams.filter(isNegative)

  // Image/video params shown as core inputs
  const imageParams = d.params.filter((p) => p.advanced !== true && p.type === 'image')
  const videoParams = d.params.filter((p) => p.advanced !== true && p.type === 'video')

  const widthParam = d.params.find((p) => p.paramName === 'width')
  const heightParam = d.params.find((p) => p.paramName === 'height')
  const hasDimension = !!widthParam && !!heightParam
  const advancedParams = d.params.filter(
    (p) =>
      !promptParams.includes(p) &&
      !imageParams.includes(p) &&
      !videoParams.includes(p) &&
      p.paramName !== 'width' &&
      p.paramName !== 'height'
  )

  const getVal = (p: ComfyParam) => String(d.values[paramKey(p)] ?? '')
  const outputLabel = d.outputType === 'video' ? '视频' : d.outputType === 'audio' ? '音频' : '图片'
  const OutputIcon = d.outputType === 'video' ? FileVideo : d.outputType === 'audio' ? Music : ImageIcon
  const renderPrompt = (p: ComfyParam) => (
    <div key={paramKey(p)} className="space-y-1">
      <Label className="text-[11px] font-medium text-neutral-500">{paramLabel(p)}</Label>
      <Textarea
        value={getVal(p)}
        onChange={(e) => d.onChangeValue(paramKey(p), e.target.value)}
        rows={2}
        className="nodrag h-[52px] max-h-[52px] resize-none overflow-y-auto rounded-lg border-neutral-200 bg-neutral-50 text-xs leading-snug focus-visible:ring-neutral-900/20"
        placeholder="输入提示词..."
      />
    </div>
  )

  return (
    <div
      className={cn(
        'comfy-node w-[290px] overflow-hidden rounded-[18px] border border-neutral-200/70 bg-white/95 backdrop-blur transition-all',
        selected && isMultiSelect
          ? 'shadow-[0_12px_40px_rgb(0,0,0,0.16)] ring-2 ring-neutral-900'
          : 'shadow-[0_6px_24px_rgb(0,0,0,0.08)] hover:shadow-[0_10px_32px_rgb(0,0,0,0.12)]'
      )}
    >
      <div className="relative flex items-center gap-2 px-4 py-3 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-900 via-neutral-800 to-neutral-600" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex size-7 items-center justify-center rounded-lg bg-white/15 ring-1 ring-white/20">
          <Wand2 size={14} />
        </div>
        <span className="relative flex-1 truncate text-[13px] font-semibold tracking-tight">{d.name}</span>
        <span className="relative rounded-full border border-white/20 bg-white/10 px-2 py-0.5 text-[10px] font-medium">
          {outputLabel}
        </span>
      </div>

      <div className="space-y-2.5 px-4 py-3.5">
        {imageParams.map((p) => (
          <ImageField key={paramKey(p)} param={p} value={getVal(p)} onChange={(v) => d.onChangeValue(paramKey(p), v)} />
        ))}

        {videoParams.map((p) => (
          <VideoField key={paramKey(p)} param={p} value={getVal(p)} onChange={(v) => d.onChangeValue(paramKey(p), v)} />
        ))}

        {positivePrompts.map(renderPrompt)}

        {negativePrompts.length > 0 && (
          <>
            {showNegative && negativePrompts.map(renderPrompt)}
            <button
              onClick={() => setShowNegative((v) => !v)}
              className="flex items-center gap-1 text-[10px] font-medium text-neutral-400 transition-colors hover:text-neutral-700"
            >
              {showNegative ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
              {showNegative ? '隐藏负面提示词' : '负面提示词'}
            </button>
          </>
        )}

        {hasDimension && (
          <DimensionPicker
            width={Number(d.values[paramKey(widthParam)] ?? widthParam.value ?? 0)}
            height={Number(d.values[paramKey(heightParam)] ?? heightParam.value ?? 0)}
            onChange={(w, h) => {
              d.onChangeValue(paramKey(widthParam), w)
              d.onChangeValue(paramKey(heightParam), h)
            }}
          />
        )}

        {advancedParams.length > 0 && (
          <div className="rounded-lg border border-neutral-100 bg-neutral-50/50">
            <button
              onClick={() => setShowParams((v) => !v)}
              className="flex w-full items-center gap-1 px-2.5 py-1.5 text-[11px] font-medium text-neutral-500 transition-colors hover:text-neutral-800"
            >
              {showParams ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
              高级参数（{advancedParams.length}）
            </button>
            {showParams && (
              <div className="px-2.5 pb-2.5">
                <AdvancedParams params={advancedParams} values={d.values} onChange={d.onChangeValue} />
              </div>
            )}
          </div>
        )}

        <Button
          onClick={() => d.onRun(d.nodeId)}
          disabled={d.running}
          className="mt-1 h-9 w-full rounded-lg bg-neutral-900 text-xs font-semibold text-white shadow-sm transition-all hover:bg-black"
        >
          {d.running ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              {(d.stage as string) || '生成中'}
              {typeof d.progress === 'number' && d.progress > 0 ? ` ${d.progress}%` : ''}
            </>
          ) : (
            <>
              <Play size={14} className="mr-1.5" /> 生成{outputLabel}
            </>
          )}
        </Button>

        {d.running && (
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            {typeof d.progress === 'number' && d.progress > 0 ? (
              <div
                className="h-full rounded-full bg-gradient-to-r from-neutral-700 to-neutral-900 transition-all duration-300"
                style={{ width: `${d.progress}%` }}
              />
            ) : (
              <div className="comfy-indeterminate h-full w-2/5 rounded-full bg-gradient-to-r from-neutral-400 to-neutral-800" />
            )}
          </div>
        )}
      </div>

      {/* 输出栏：多 slot 时逐个展示；单 slot 或无 slot 时退化为原来的样子 */}
      {(() => {
        const slots = d.outputSlots ?? []
        if (slots.length > 1) {
          return (
            <div className='flex flex-col border-t border-neutral-100'>
              {slots.map((s) => {
                const SlotIcon =
                  s.mediaKind === 'video' ? FileVideo : s.mediaKind === 'audio' ? Music : ImageIcon
                return (
                  <div
                    key={s.key}
                    className='relative flex items-center gap-1.5 px-4 py-1.5 text-[10px] text-neutral-500'
                  >
                    <SlotIcon size={11} />
                    <span className='truncate'>{s.label}</span>
                  </div>
                )
              })}
            </div>
          )
        }
        return (
          <div className='flex items-center gap-1.5 border-t border-neutral-100 px-4 py-1.5 text-[10px] text-neutral-400'>
            <OutputIcon size={11} />
            输出 {outputLabel}
          </div>
        )
      })()}

      {/* Handle：多 slot 时每个 slot 一个（垂直排列），单 slot 时兼容原逻辑（不带 id） */}
      {(() => {
        const slots = d.outputSlots ?? []
        if (slots.length > 1) {
          // 平均分布在右侧，从上到下
          return slots.map((s, i) => (
            <Handle
              key={s.key}
              type='source'
              position={Position.Right}
              id={s.key}
              className='comfy-handle'
              style={{ top: `${((i + 1) / (slots.length + 1)) * 100}%` }}
            />
          ))
        }
        // 单输出：兼容旧连线（handle 无 id）
        return <Handle type='source' position={Position.Right} className='comfy-handle' />
      })()}
    </div>
  )
}

export const WorkflowNode = memo(WorkflowNodeComponent)
