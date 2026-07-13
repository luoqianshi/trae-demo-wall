import { useEffect, useMemo, useRef, useState } from 'react'
import { Image as ImageIcon, Loader2, PanelLeftClose, Play, Plus, X, ZoomIn } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type ComfyWorkflow, comfyuiApi, type ComfyParam, type LocalWorkflow, parseParams } from '../api/comfyui-api'
import { useProjectId } from '../context/ProjectIdContext'

export interface EditSlotImage {
  /** 已上传到 ComfyUI 的 input 文件名 */
  filename?: string
  /** 用于展示的本地预览 URL（File 转 ObjectURL 或远程 URL） */
  previewUrl?: string
  /** 引用来源（远程 URL）或本地文件名 */
  source?: string
  uploading?: boolean
}

export interface EditPanelImageSlot {
  paramKey: string
  param: ComfyParam
  image?: EditSlotImage
}

export interface EditVersion {
  id: string
  prompt: string
  urls: string[]
  workflowName: string
  inputs: { paramKey: string; source?: string }[]
  createdAt: number
  sourceUrl?: string
}

interface ImageEditPanelProps {
  workflows: ComfyWorkflow[]
  localWorkflows?: LocalWorkflow[]
  collapsed: boolean
  onToggle: () => void
  /** 来自 AssetNode 的"待编辑图片"请求：选中后填入首个图片插槽 */
  pendingImage?: { url: string; assetId: string; assetName?: string } | null
  onPendingHandled?: () => void
  /** 编辑生成的结果回调（追加为新版本） */
  onEdited?: (assetId: string | undefined, version: EditVersion) => void
  /** 自动导入工作流后刷新外层已导入列表 */
  onAfterImport?: () => void
  /** 当前正在被编辑的 AssetNode（提供版本历史） */
  editingAsset?: {
    id: string
    name: string
    baselineUrls: string[]
    versions: EditVersion[]
    activeVersionId?: string
  }
  /** 用户在面板里点击某版本 → 应用到画布节点 */
  onSelectVersion?: (assetId: string, versionId: string | undefined) => void
  /** 放大预览（复用画布的弹窗机制） */
  onPreview?: (url: string) => void
}

/** 过滤掉 ComfyUI PreviewImage 的临时副本文件（兼容旧版本数据，新数据已在后端过滤） */
function filterDisplayUrls(urls: string[]): string[] {
  return urls.filter((u) => !/_temp_/i.test(u))
}

/**
 * 左侧"图片编辑"面板：选择图生图/编辑类工作流，填入多张图片+提示词，运行并把结果作为新版本回写。
 */
export function ImageEditPanel({
  workflows,
  localWorkflows = [],
  collapsed,
  onToggle,
  pendingImage,
  onPendingHandled,
  onEdited,
  onAfterImport,
  editingAsset,
  onSelectVersion,
  onPreview,
}: ImageEditPanelProps) {
  const projectId = useProjectId()
  const [selectedId, setSelectedId] = useState<string>('')
  const [imageSlots, setImageSlots] = useState<EditPanelImageSlot[]>([])
  const [promptKey, setPromptKey] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [running, setRunning] = useState(false)
  const [importing, setImporting] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeSlotIndex = useRef<number>(-1)
  const boundAssetIdRef = useRef<string | undefined>(undefined)
  const [boundAssetName, setBoundAssetName] = useState<string | undefined>(undefined)
  // 选中态：editingAsset 切换时清空；点击版本只更新高亮，点"应用"才下发 onSelectVersion
  const [pendingVersionId, setPendingVersionId] = useState<string | undefined>(undefined)
  const [pendingVersionInitialized, setPendingVersionInitialized] = useState(false)
  useEffect(() => {
    if (editingAsset) {
      setPendingVersionId(editingAsset.activeVersionId)
      setPendingVersionInitialized(true)
    } else {
      setPendingVersionId(undefined)
      setPendingVersionInitialized(false)
    }
    // 仅在切换 AssetNode 时重置选中态；同节点内 activeVersionId 改变不应清空 pending
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editingAsset?.id])
  // 应用后 editingAsset.activeVersionId 会更新，但 pendingVersionId 已与之一致；不再触发循环

  const selectedWorkflow = useMemo(() => workflows.find((w) => w.id === selectedId), [workflows, selectedId])

  // 未导入的本地工作流（按名称去重，与已导入列表对比）
  const importedNameSet = useMemo(() => new Set(workflows.map((w) => w.name)), [workflows])
  const unimportedLocal = useMemo(
    () => localWorkflows.filter((lw) => !importedNameSet.has(lw.name.replace(/\.json$/i, ''))),
    [localWorkflows, importedNameSet]
  )

  // 选择"本地未导入"项时，自动导入再选中；选择"已导入"项时，重新导入以刷新最新 schema 规则
  async function handleSelectChange(value: string) {
    if (value.startsWith('local::')) {
      const path = value.replace(/^local::/, '')
      const lw = localWorkflows.find((x) => x.path === path)
      if (!lw) return
      setImporting(true)
      try {
        const imported = await comfyuiApi.importWorkflow(lw.path)
        onAfterImport?.()
        setSelectedId(imported.id)
        toast.success(`已导入：${imported.name}`)
      } catch (e) {
        toast.error(`导入工作流失败：${e instanceof Error ? e.message : '未知错误'}`)
      } finally {
        setImporting(false)
      }
      return
    }
    setSelectedId(value)
  }

  // 工作流变更时，解析 params 并初始化插槽与提示词
  useEffect(() => {
    if (!selectedWorkflow) {
      setImageSlots([])
      setPromptKey('')
      setPrompt('')
      return
    }
    const params = parseParams(selectedWorkflow.paramSchema)
    // 收集所有 image 类型的参数
    const allImageParams = params.filter((p) => p.type === 'image')
    // 是否存在"非 LoadImage 的 image 输入"（即 subgraph 实例 / 其它自定义节点）
    const hasNonLoadImage = allImageParams.some((p) => p.nodeType !== 'LoadImage')
    // 过滤规则：
    // - 若同时存在 subgraph image 与 LoadImage：只保留 subgraph（后端会自动用虚拟 LoadImage 覆盖到内部链路），避免重复上传
    // - 否则（普通工作流只有 LoadImage 输入）：保留 LoadImage，否则会显示"没有图片输入节点"误伤
    const slots = allImageParams
      .filter((p) => (hasNonLoadImage ? p.nodeType !== 'LoadImage' : true))
      .map<EditPanelImageSlot>((p) => ({ paramKey: `${p.nodeId}.${p.paramName}`, param: p }))
    setImageSlots(slots)

    // 取第一个文本 widget 作为"提示词"
    const textParam = params.find(
      (p) =>
        p.type === 'string' &&
        (p.nodeType === 'CLIPTextEncode' ||
          p.nodeType === 'PrimitiveStringMultiline' ||
          /prompt|提示/i.test(p.label) ||
          /prompt|提示/i.test(p.title))
    )
    if (textParam) {
      setPromptKey(`${textParam.nodeId}.${textParam.paramName}`)
      setPrompt(String(textParam.value ?? ''))
    } else {
      setPromptKey('')
      setPrompt('')
    }
  }, [selectedWorkflow])

  // 处理外部传入的待编辑图片：填入第一个空插槽（或第一个插槽）
  useEffect(() => {
    if (!pendingImage || imageSlots.length === 0) return
    boundAssetIdRef.current = pendingImage.assetId
    setBoundAssetName(pendingImage.assetName)
    // 首插槽始终代表"被编辑的源图"
    void handleUrlIntoSlot(0, pendingImage.url)
    onPendingHandled?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingImage, imageSlots.length])

  async function handleUrlIntoSlot(idx: number, url: string) {
    setImageSlots((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        image: { previewUrl: url, source: url, uploading: true },
      }
      return next
    })
    try {
      const r = await comfyuiApi.uploadImageFromUrl(url)
      setImageSlots((prev) => {
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          image: { previewUrl: url, source: url, filename: r.name, uploading: false },
        }
        return next
      })
    } catch (e) {
      setImageSlots((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], image: undefined }
        return next
      })
      toast.error(`图片上传失败：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  async function handleFileIntoSlot(idx: number, file: File) {
    const previewUrl = URL.createObjectURL(file)
    setImageSlots((prev) => {
      const next = [...prev]
      next[idx] = {
        ...next[idx],
        image: { previewUrl, source: file.name, uploading: true },
      }
      return next
    })
    try {
      const r = await comfyuiApi.uploadImage(file, undefined, projectId)
      setImageSlots((prev) => {
        const next = [...prev]
        next[idx] = {
          ...next[idx],
          image: { previewUrl, source: file.name, filename: r.name, uploading: false },
        }
        return next
      })
    } catch (e) {
      setImageSlots((prev) => {
        const next = [...prev]
        next[idx] = { ...next[idx], image: undefined }
        return next
      })
      toast.error(`图片上传失败：${e instanceof Error ? e.message : '未知错误'}`)
    }
  }

  const triggerPick = (idx: number) => {
    activeSlotIndex.current = idx
    fileInputRef.current?.click()
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    const idx = activeSlotIndex.current
    if (file && idx >= 0) {
      void handleFileIntoSlot(idx, file)
    }
    e.target.value = ''
  }

  const removeSlotImage = (idx: number) => {
    setImageSlots((prev) => {
      const next = [...prev]
      next[idx] = { ...next[idx], image: undefined }
      return next
    })
  }

  const canRun = useMemo(() => {
    if (!selectedWorkflow || running) return false
    const slotsReady = imageSlots.every((s) => !!s.image?.filename)
    return slotsReady && imageSlots.length > 0
  }, [selectedWorkflow, running, imageSlots])

  async function handleRun() {
    if (!selectedWorkflow || !canRun) return
    setRunning(true)
    setProgressPercent(0)
    try {
      const paramValues: Record<string, unknown> = {}
      imageSlots.forEach((s) => {
        if (s.image?.filename) paramValues[s.paramKey] = s.image.filename
      })
      if (promptKey) paramValues[promptKey] = prompt

      const taskId = await comfyuiApi.submit(selectedWorkflow.id, paramValues)
      let urls: string[] = []
      for (;;) {
        await new Promise((r) => setTimeout(r, 800))
        const p = await comfyuiApi.progress(taskId)
        if (p.status === 'running') {
          setProgressPercent(p.percent)
        } else if (p.status === 'done') {
          urls = p.urls ?? []
          break
        } else {
          throw new Error(p.message || '生成失败')
        }
      }

      const version: EditVersion = {
        id: `v-${Date.now()}`,
        prompt,
        urls,
        workflowName: selectedWorkflow.name,
        inputs: imageSlots.map((s) => ({ paramKey: s.paramKey, source: s.image?.source })),
        createdAt: Date.now(),
      }
      onEdited?.(boundAssetIdRef.current, version)
    } catch (e) {
      toast.error(`图片编辑失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setRunning(false)
      setProgressPercent(0)
    }
  }

  if (collapsed) {
    return (
      <div className="flex w-12 shrink-0 flex-col items-center border-r border-neutral-200 bg-white py-3">
        <button
          onClick={onToggle}
          title="图片编辑"
          className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-neutral-900 to-neutral-700 text-white transition-transform hover:scale-105"
        >
          <ImageIcon size={16} />
        </button>
      </div>
    )
  }

  return (
    <aside className="flex w-80 shrink-0 flex-col border-r border-neutral-200 bg-white">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <ImageIcon size={15} className="text-neutral-800" />
        <div className="flex min-w-0 flex-1 flex-col">
          <span className="truncate text-sm font-semibold text-neutral-800">图片编辑</span>
          {boundAssetName && (
            <span className="truncate text-[10px] text-neutral-500" title={boundAssetName}>
              正在编辑：{boundAssetName}
            </span>
          )}
        </div>
        <button
          onClick={onToggle}
          title="收起"
          className="flex size-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <PanelLeftClose size={15} />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">编辑工作流</Label>
            <Select value={selectedId} onValueChange={handleSelectChange} disabled={importing}>
              <SelectTrigger className="h-9 text-xs">
                <SelectValue placeholder={importing ? '导入中…' : '选择工作流（如 qwen 图片编辑）'} />
              </SelectTrigger>
              <SelectContent>
                {workflows.length > 0 && (
                  <>
                    {workflows.map((w) => (
                      <SelectItem key={w.id} value={w.id} className="text-xs">
                        {w.name}
                      </SelectItem>
                    ))}
                  </>
                )}
                {unimportedLocal.length > 0 && (
                  <>
                    <div className="px-2 pt-1 text-[10px] font-semibold text-neutral-400">本地工作流（选择后自动导入）</div>
                    {unimportedLocal.map((lw) => (
                      <SelectItem key={lw.path} value={`local::${lw.path}`} className="text-xs">
                        {lw.name.replace(/\.json$/i, '')}
                      </SelectItem>
                    ))}
                  </>
                )}
              </SelectContent>
            </Select>
            {workflows.length === 0 && unimportedLocal.length === 0 && (
              <p className="text-[10px] text-neutral-400">没有可用工作流。请确认 ComfyUI workflow-dir 配置或先拖入一个工作流。</p>
            )}
          </div>

          {selectedWorkflow && imageSlots.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              该工作流没有图片输入节点（LoadImage）。请选择支持图片输入的工作流。
            </div>
          )}

          {imageSlots.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs font-medium text-neutral-600">输入图片（{imageSlots.length}）</Label>
              <div className="grid grid-cols-3 gap-2">
                {imageSlots.map((slot, idx) => {
                  const isSource = idx === 0 && !!boundAssetIdRef.current
                  return (
                    <div
                      key={slot.paramKey}
                      className={cn(
                        'relative aspect-square overflow-hidden rounded-lg border border-dashed border-neutral-300 bg-neutral-50',
                        slot.image && 'border-solid border-neutral-200',
                        isSource && 'ring-2 ring-violet-400 ring-offset-1'
                      )}
                    >
                      {slot.image?.previewUrl ? (
                        <>
                          <img src={slot.image.previewUrl} alt="" className="size-full object-cover" />
                          {slot.image.uploading && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                              <Loader2 size={16} className="animate-spin text-white" />
                            </div>
                          )}
                          {!isSource && (
                            <button
                              onClick={() => removeSlotImage(idx)}
                              className="absolute right-1 top-1 flex size-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
                            >
                              <X size={11} />
                            </button>
                          )}
                          {isSource && (
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-violet-600/90 to-violet-600/0 px-1 py-1 text-center text-[9px] font-medium text-white">
                              源图
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          onClick={() => triggerPick(idx)}
                          className="flex size-full flex-col items-center justify-center gap-1 text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
                        >
                          <Plus size={18} />
                          <span className="text-[10px]">图 {idx + 1}</span>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>
              <p className="text-[10px] text-neutral-400">点击空槽位上传本地图片；点击画布素材节点的"编辑"按钮可自动填入</p>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />
            </div>
          )}

          {promptKey && (
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-neutral-600">提示词</Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="描述你想要的编辑效果..."
                className="min-h-[80px] resize-y text-xs"
              />
            </div>
          )}

          {selectedWorkflow && (
            <Button onClick={handleRun} disabled={!canRun} className="w-full">
              {running ? (
                <>
                  <Loader2 size={14} className="mr-1 animate-spin" />
                  生成中 {progressPercent}%
                </>
              ) : (
                <>
                  <Play size={14} className="mr-1" />
                  生成
                </>
              )}
            </Button>
          )}

          {editingAsset && (editingAsset.versions.length > 0 || editingAsset.baselineUrls.length > 0) && (
            <div className="space-y-2 border-t border-neutral-100 pt-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-neutral-600">
                  版本历史（{editingAsset.versions.length + 1}）
                </Label>
                {pendingVersionInitialized && pendingVersionId !== editingAsset.activeVersionId && (
                  <Button
                    size="sm"
                    onClick={() => onSelectVersion?.(editingAsset.id, pendingVersionId)}
                    className="h-7 px-2 text-[11px]"
                  >
                    应用所选版本
                  </Button>
                )}
              </div>
              <div className="space-y-2">
                {editingAsset.versions.map((v, i) => {
                  const isPending = pendingVersionId === v.id
                  const isApplied = editingAsset.activeVersionId === v.id
                  const displayUrls = filterDisplayUrls(v.urls)
                  return (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setPendingVersionId(v.id)}
                      className={cn(
                        'w-full rounded-lg border p-2 text-left transition-colors',
                        isPending
                          ? 'border-violet-400 bg-violet-50/60 ring-1 ring-violet-300'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-neutral-500">
                          v{editingAsset.versions.length - i} · {v.workflowName}
                        </span>
                        {isApplied && (
                          <span className="ml-auto rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            已应用
                          </span>
                        )}
                        {!isApplied && isPending && (
                          <span className="ml-auto rounded bg-violet-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            待应用
                          </span>
                        )}
                      </div>
                      {v.prompt && (
                        <div className="mb-1.5 line-clamp-2 text-[11px] text-neutral-600" title={v.prompt}>
                          {v.prompt}
                        </div>
                      )}
                      {displayUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-1">
                          {displayUrls.map((u) => (
                            <div key={u} className="group relative aspect-square">
                              <img
                                src={u}
                                alt=""
                                className="size-full rounded border border-neutral-100 object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPreview?.(u)
                                }}
                                title="放大预览"
                                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100"
                              >
                                <span className="flex size-6 items-center justify-center rounded-full bg-black/70 text-white">
                                  <ZoomIn size={11} />
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}

                {/* V0 原图（始终在最底） */}
                {(() => {
                  const isPending = !pendingVersionId
                  const isApplied = !editingAsset.activeVersionId
                  const displayUrls = filterDisplayUrls(editingAsset.baselineUrls)
                  return (
                    <button
                      type="button"
                      onClick={() => setPendingVersionId(undefined)}
                      className={cn(
                        'w-full rounded-lg border p-2 text-left transition-colors',
                        isPending
                          ? 'border-violet-400 bg-violet-50/60 ring-1 ring-violet-300'
                          : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                      )}
                    >
                      <div className="mb-1 flex items-center gap-1">
                        <span className="text-[10px] font-semibold text-neutral-500">v0 · 原图（默认）</span>
                        {isApplied && (
                          <span className="ml-auto rounded bg-emerald-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            已应用
                          </span>
                        )}
                        {!isApplied && isPending && (
                          <span className="ml-auto rounded bg-violet-500 px-1.5 py-0.5 text-[9px] font-semibold text-white">
                            待应用
                          </span>
                        )}
                      </div>
                      {displayUrls.length > 0 && (
                        <div className="grid grid-cols-3 gap-1">
                          {displayUrls.map((u) => (
                            <div key={u} className="group relative aspect-square">
                              <img
                                src={u}
                                alt=""
                                className="size-full rounded border border-neutral-100 object-cover"
                              />
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onPreview?.(u)
                                }}
                                title="放大预览"
                                className="absolute inset-0 flex items-center justify-center bg-black/0 opacity-0 transition-all hover:bg-black/40 hover:opacity-100"
                              >
                                <span className="flex size-6 items-center justify-center rounded-full bg-black/70 text-white">
                                  <ZoomIn size={11} />
                                </span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })()}
              </div>
            </div>
          )}
        </div>
      </ScrollArea>
    </aside>
  )
}
