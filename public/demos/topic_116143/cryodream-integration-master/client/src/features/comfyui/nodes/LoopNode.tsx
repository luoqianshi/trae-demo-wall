import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { Brackets, ChevronDown, ChevronLeft, ChevronRight, Dice5, FileVideo, GitBranch, Image, Layers2, Loader2, Music, PackageCheck, Play, Sparkles, Workflow } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useMultiSelect } from '../index'
import type { ComfyParam } from '../api/comfyui-api'
import { ImageField, VideoField } from '../components/AdvancedParams'

export type ParamMappingMode = 'fixed' | 'array' | 'random'

export interface ParamMapping {
  mode: ParamMappingMode
  fixedValue?: unknown
  arrayField?: string
}

export interface LoopNodeData {
  name: string
  prompts: string
  inputCount?: number
  inputSourceName?: string
  inputItems?: string[]
  inputPreviewIndex?: number
  inputArrayMode?: 'text' | 'table'
  inputArrayFields?: string[]
  childWorkflowId?: string
  childWorkflowName?: string
  childWorkflowParamCount?: number
  childWorkflowBackendId?: string
  childWorkflowOutputType?: 'image' | 'video' | 'audio'
  childWorkflowParams?: unknown[]
  childWorkflowValues?: Record<string, unknown>
  loopParamKey?: string
  loopParamOptions?: Array<{ key: string; label: string; type?: string }>
  paramMappings?: Record<string, ParamMapping>
  running: boolean
  progress?: number | null
  stage?: string
  onChangePrompts: (prompts: string) => void
  onChangeLoopParam: (key: string) => void
  onChangeParamMapping: (paramKey: string, mapping: ParamMapping) => void
  onChangeInputPreviewIndex: (index: number) => void
  onRun: () => void
  [key: string]: unknown
}

function isSeedParam(label: string): boolean {
  return /seed|种子/i.test(label)
}

function isImageParam(p: ComfyParam): boolean {
  return p.type === 'image'
}

function isVideoParam(p: ComfyParam): boolean {
  return p.type === 'video'
}

function LoopNodeComponent({ data, selected }: NodeProps) {
  const d = data as LoopNodeData
  const isMultiSelect = useMultiSelect()
  const [mappingExpanded, setMappingExpanded] = useState(false)

  const inputItems = d.inputItems ?? []
  const inputCount = inputItems.length
  const currentPreviewIndex = inputCount > 0 ? Math.min(Math.max(d.inputPreviewIndex ?? 0, 0), inputCount - 1) : 0
  const loopParamOptions = d.loopParamOptions ?? []
  const paramMappings = d.paramMappings ?? {}
  const arrayFields = d.inputArrayFields ?? []
  const isArrayTable = d.inputArrayMode === 'table'

  // 旧兼容：如果没有 paramMappings 但有 loopParamKey，生成一个
  const effectiveMappings: Record<string, ParamMapping> = {}
  for (const opt of loopParamOptions) {
    if (paramMappings[opt.key]) {
      effectiveMappings[opt.key] = paramMappings[opt.key]
    } else if (opt.key === d.loopParamKey) {
      effectiveMappings[opt.key] = { mode: 'array', arrayField: isArrayTable ? (arrayFields[0] ?? opt.label) : 'item' }
    } else {
      effectiveMappings[opt.key] = { mode: 'fixed' }
    }
  }

  const hasChildWorkflow = !!d.childWorkflowName
  const params = (d.childWorkflowParams as ComfyParam[] | undefined) ?? []
  const values = d.childWorkflowValues ?? {}

  // 分离：跟随数组的 vs 其余的
  const arrayMappedItems = params.filter((p) => {
    const paramKey = `${p.nodeId}.${p.paramName}`
    const mapping = effectiveMappings[paramKey]
    return mapping?.mode === 'array'
  })
  const otherParams = params.filter((p) => {
    const paramKey = `${p.nodeId}.${p.paramName}`
    const mapping = effectiveMappings[paramKey]
    return mapping?.mode !== 'array'
  })

  return (
    <div
      className={cn(
        'w-[340px] max-w-[340px] overflow-hidden rounded-2xl border border-neutral-200/80 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.10)]',
        selected && isMultiSelect && 'ring-2 ring-neutral-900/70'
      )}
    >
      <Handle type="target" position={Position.Left} className="comfy-handle comfy-handle-center" />
      <Handle type="source" position={Position.Right} className="comfy-handle comfy-handle-center" />

      <div className="relative overflow-hidden bg-neutral-950 p-4 pb-3 text-white">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
        <div className="relative flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white">
            <GitBranch size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold">{d.name}</div>
          </div>
          <span className="rounded-full border border-white/15 bg-white/10 px-2 py-0.5 text-[10px] font-medium text-white/80">
            {inputCount} 次
          </span>
        </div>
        <div className="relative mt-2 text-[11px] leading-relaxed text-white/65">
          接收数组输入，逐项写入指定参数并执行内部工作流。
        </div>
      </div>

      <div className="border-t border-neutral-200" />

      <div className="space-y-3 p-4">
        {/* 入参数组 */}
        <div className="rounded-xl border border-neutral-200 bg-background px-3 py-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500">
              <Brackets size={11} />
              入参数组
            </div>
            <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-neutral-600">
              {isArrayTable ? 'object[]' : 'string[]'}
            </span>
          </div>
          <div className="mt-1 text-xs text-neutral-700">
            {inputCount > 0 ? `${d.inputSourceName ?? '数组节点'} · ${inputCount} 项` : '连接数组节点作为循环输入'}
          </div>
          <div className="mt-2 rounded-lg border border-neutral-200 bg-muted/30 p-2">
            {inputCount > 0 ? (
              <>
                <div className="mb-2 flex items-center justify-between gap-2 text-[10px] text-neutral-600">
                  <button
                    type="button"
                    onClick={() => d.onChangeInputPreviewIndex(Math.max(currentPreviewIndex - 1, 0))}
                    disabled={currentPreviewIndex <= 0}
                    className="nodrag flex size-6 items-center justify-center rounded-md border bg-background text-neutral-700 transition-colors hover:bg-muted disabled:opacity-40"
                    title="上一个"
                  >
                    <ChevronLeft size={13} />
                  </button>
                  <span className="font-medium">Item {currentPreviewIndex + 1} / {inputCount}</span>
                  <button
                    type="button"
                    onClick={() => d.onChangeInputPreviewIndex(Math.min(currentPreviewIndex + 1, inputCount - 1))}
                    disabled={currentPreviewIndex >= inputCount - 1}
                    className="nodrag flex size-6 items-center justify-center rounded-md border bg-background text-neutral-700 transition-colors hover:bg-muted disabled:opacity-40"
                    title="下一个"
                  >
                    <ChevronRight size={13} />
                  </button>
                </div>
                <div className="max-h-24 overflow-auto break-all rounded-md bg-background px-2 py-1.5 text-[11px] leading-relaxed text-neutral-700">
                  {inputItems[currentPreviewIndex]}
                </div>
              </>
            ) : (
              <div className="py-3 text-center text-[11px] text-neutral-400">等待连接数组节点</div>
            )}
          </div>
        </div>

        {/* 内部工作流 */}
        <div className="rounded-xl border border-neutral-200 bg-background px-3 py-2">
          <div className="flex items-center justify-between gap-2 text-[10px] font-medium text-neutral-500">
            <span>内部工作流</span>
            {typeof d.childWorkflowParamCount === 'number' && (
              <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] text-neutral-600">
                {d.childWorkflowParamCount} 参数
              </span>
            )}
          </div>
          <div className="mt-1 flex items-center gap-2 text-xs text-neutral-700">
            <Workflow size={12} className="shrink-0 text-neutral-400" />
            <span className="min-w-0 truncate">
              {d.childWorkflowName ? d.childWorkflowName : '把任意工作流拖到循环节点内部'}
            </span>
          </div>
        </div>

        {/* 参数映射表 — 默认收缩，只显示跟随数组的项 */}
        {hasChildWorkflow && loopParamOptions.length > 0 && (
          <div className="rounded-xl border border-neutral-200 bg-background px-3 py-2">
            {/* 标题栏 + 展开/收缩 */}
            <button
              type="button"
              onClick={() => setMappingExpanded(!mappingExpanded)}
              className="nodrag flex w-full items-center justify-between"
            >
              <div className="flex items-center gap-1.5 text-[10px] font-medium text-neutral-500">
                <Layers2 size={11} />
                参数映射
              </div>
              <div className="flex items-center gap-1.5">
                {arrayMappedItems.length > 0 && !mappingExpanded && (
                  <span className="rounded-full bg-violet-100 px-1.5 py-0.5 text-[9px] font-semibold text-violet-700">
                    {arrayMappedItems.length} 跟随数组
                  </span>
                )}
                <ChevronDown
                  size={12}
                  className={cn(
                    'text-neutral-400 transition-transform duration-200',
                    mappingExpanded && 'rotate-180'
                  )}
                />
              </div>
            </button>

            {/* 收缩态：只显示跟随数组的映射项 */}
            {!mappingExpanded && arrayMappedItems.length > 0 && (
              <div className="mt-2 space-y-1">
                {arrayMappedItems.map((p) => {
                  const paramKey = `${p.nodeId}.${p.paramName}`
                  const opt = loopParamOptions.find((o) => o.key === paramKey)
                  if (!opt) return null
                  const mapping = effectiveMappings[paramKey]
                  return (
                    <div key={paramKey} className="flex min-w-0 items-center gap-2 rounded-lg border border-violet-100 bg-violet-50/50 px-2 py-1">
                      <Sparkles size={9} className="shrink-0 text-violet-400" />
                      <span
                        className="min-w-0 flex-1 truncate text-[10px] font-medium text-violet-700"
                        title={opt.label}
                      >
                        {p.label || p.paramName}
                      </span>
                      <span className="shrink-0 text-[9px] text-violet-400">←</span>
                      <span
                        className="max-w-[90px] shrink-0 truncate text-[10px] text-violet-600"
                        title={isArrayTable ? (mapping?.arrayField ?? '') : 'item'}
                      >
                        {isArrayTable ? (mapping?.arrayField ?? '') : 'item'}
                      </span>
                    </div>
                  )
                })}
              </div>
            )}

            {/* 展开态：显示全部参数映射 */}
            {mappingExpanded && (
              <div className="mt-2 space-y-1.5">
                {params.map((p) => {
                  const paramKey = `${p.nodeId}.${p.paramName}`
                  const opt = loopParamOptions.find((o) => o.key === paramKey)
                  if (!opt) return null
                  const mapping = effectiveMappings[paramKey] ?? { mode: 'fixed' as ParamMappingMode }
                  const isSeed = isSeedParam(opt.label)
                  const isImg = isImageParam(p)
                  const isVid = isVideoParam(p)
                  const isMedia = isImg || isVid
                  const currentFixedValue = mapping.fixedValue ?? values[paramKey] ?? p.value ?? ''
                  const isArray = mapping.mode === 'array'

                  return (
                    <div
                      key={paramKey}
                      className={cn(
                        'rounded-lg border px-2 py-1.5',
                        isArray
                          ? 'border-violet-100 bg-violet-50/50'
                          : 'border-neutral-100 bg-white'
                      )}
                    >
                      {/* 顶部：参数名 + 模式选择 */}
                      <div className="flex min-w-0 items-center gap-1.5">
                        <div
                          className="min-w-0 flex-1 truncate text-[10px] text-neutral-600"
                          title={opt.label}
                        >
                          {isImg && <Image size={10} className="mr-0.5 inline" />}
                          {p.label || p.paramName}
                        </div>

                        <select
                          value={mapping.mode}
                          onChange={(e) => {
                            const newMode = e.target.value as ParamMappingMode
                            const newMapping: ParamMapping = { ...mapping, mode: newMode }
                            if (newMode === 'array' && !newMapping.arrayField) {
                              newMapping.arrayField = isArrayTable ? (arrayFields[0] ?? '') : 'item'
                            }
                            d.onChangeParamMapping(paramKey, newMapping)
                          }}
                          className="nodrag h-6 max-w-[80px] shrink-0 rounded border border-neutral-200 bg-neutral-50 px-1 text-[10px] text-neutral-700 outline-none"
                        >
                          <option value="fixed">固定</option>
                          {!isMedia && <option value="array">跟随数组</option>}
                          {isSeed && <option value="random">随机</option>}
                        </select>
                      </div>

                      {/* 下方：值/字段/上传（占满整行） */}
                      {mapping.mode === 'array' && (
                        <select
                          value={mapping.arrayField ?? ''}
                          onChange={(e) => d.onChangeParamMapping(paramKey, { ...mapping, arrayField: e.target.value })}
                          className="nodrag mt-1.5 h-6 w-full rounded border border-violet-200 bg-violet-50 px-1.5 text-[10px] text-violet-700 outline-none"
                        >
                          {isArrayTable ? (
                            arrayFields.map((f) => (
                              <option key={f} value={f}>{f}</option>
                            ))
                          ) : (
                            <option value="item">item</option>
                          )}
                        </select>
                      )}
                      {mapping.mode === 'random' && (
                        <div className="mt-1.5 flex items-center gap-1 rounded border border-neutral-100 bg-neutral-50 px-2 py-1 text-[10px] text-neutral-500">
                          <Dice5 size={10} />
                          每次自动生成随机值
                        </div>
                      )}
                      {mapping.mode === 'fixed' && !isMedia && (
                        <input
                          value={String(currentFixedValue)}
                          onChange={(e) => d.onChangeParamMapping(paramKey, { ...mapping, fixedValue: e.target.value })}
                          title={String(currentFixedValue)}
                          className="nodrag mt-1.5 w-full rounded border border-neutral-200 px-1.5 py-1 text-[11px] text-neutral-800 outline-none focus:border-neutral-400"
                        />
                      )}
                      {mapping.mode === 'fixed' && isImg && (
                        <div className="nodrag mt-1.5">
                          <ImageField
                            param={p}
                            value={String(currentFixedValue)}
                            onChange={(v) => d.onChangeParamMapping(paramKey, { ...mapping, fixedValue: v })}
                          />
                        </div>
                      )}
                      {mapping.mode === 'fixed' && isVid && (
                        <div className="nodrag mt-1.5">
                          <VideoField
                            param={p}
                            value={String(currentFixedValue)}
                            onChange={(v) => d.onChangeParamMapping(paramKey, { ...mapping, fixedValue: v })}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 工作流容器状态 */}
        <div
          className={cn(
            'relative overflow-hidden rounded-xl border px-3 py-3 text-center',
            d.childWorkflowName
              ? 'border-emerald-200 bg-gradient-to-br from-emerald-50/80 via-white to-violet-50/60'
              : 'border-dashed border-neutral-300 bg-muted/20'
          )}
        >
          {d.childWorkflowName && (
            <>
              {/* 装饰渐变线 */}
              <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl bg-gradient-to-b from-violet-400 via-fuchsia-400 to-emerald-400" />
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-emerald-300 to-transparent" />
            </>
          )}
          <div className="relative flex items-center justify-center gap-1.5">
            {d.childWorkflowName ? (
              <>
                <PackageCheck size={13} className="text-emerald-500" />
                <span className="text-[10px] font-medium text-emerald-700">已装入</span>
                <span className="flex items-center gap-1 rounded-full bg-white/70 px-2 py-0.5 shadow-sm">
                  {d.childWorkflowOutputType === 'video' ? (
                    <FileVideo size={10} className="text-blue-500" />
                  ) : d.childWorkflowOutputType === 'audio' ? (
                    <Music size={10} className="text-fuchsia-500" />
                  ) : (
                    <Image size={10} className="text-violet-500" />
                  )}
                  <span className="text-[10px] font-medium text-neutral-700">{d.childWorkflowName}</span>
                </span>
              </>
            ) : (
              <>
                <Workflow size={13} className="text-neutral-400" />
                <span className="text-[10px] text-neutral-500">拖入任意工作流节点到此区域</span>
              </>
            )}
          </div>
        </div>

        <Button
          onClick={d.onRun}
          disabled={d.running || inputCount === 0 || !d.childWorkflowBackendId}
          className="nodrag h-9 w-full rounded-lg bg-neutral-950 text-xs font-semibold text-white hover:bg-neutral-800"
        >
          {d.running ? (
            <>
              <Loader2 size={14} className="mr-1.5 animate-spin" />
              {(d.stage as string) || '循环执行中'}
              {typeof d.progress === 'number' && d.progress > 0 ? ` ${d.progress}%` : ''}
            </>
          ) : (
            <>
              <Play size={14} className="mr-1.5" /> 执行循环
            </>
          )}
        </Button>

        {d.running && (
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-neutral-100">
            <div
              className="h-full rounded-full bg-neutral-950 transition-all duration-300"
              style={{ width: `${typeof d.progress === 'number' ? d.progress : 0}%` }}
            />
          </div>
        )}
      </div>

      <div className="border-t border-neutral-200" />

      <div className="bg-muted/30 p-4">
        <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wide text-neutral-500">
          <span>输出</span>
          <span className="rounded-full border bg-background px-2 py-0.5 text-[10px] normal-case text-neutral-600">result[]</span>
        </div>
      </div>
    </div>
  )
}

export const LoopNode = memo(LoopNodeComponent)
