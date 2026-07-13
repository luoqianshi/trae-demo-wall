import { useEffect, useMemo, useRef, useState } from 'react'
import { Loader2, Play, Plus, Sparkles, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  comfyuiApi,
  type ComfyParam,
  type ComfyWorkflow,
  parseParams,
} from '@/features/comfyui/api/comfyui-api'
import { DIMENSION_PRESETS } from '@/features/comfyui/config/nodeMeta'
import { PromptHistoryPopover } from './PromptHistoryPopover'
import { usePromptHistory } from '../hooks/use-prompt-history'
import type { ComicLayer } from '../types'

type EditMode = 'single' | 'double' | 'text'

interface EditSlotImage {
  filename?: string
  previewUrl?: string
  source?: string
  uploading?: boolean
  /** 是否来自画布选中图层（自动填充） */
  fromCanvas?: boolean
}

interface ImageSlot {
  paramKey: string
  param: ComfyParam
  image?: EditSlotImage
}

interface ImageEditSectionProps {
  projectId?: string
  /** 当前画布选中图层：若为 image 类型，将自动填充到第一个图片插槽 */
  selectedLayer?: ComicLayer | null
  /** 当前素材面板选中的素材 URL（单击选中时同步填充到第一个图片插槽） */
  selectedAssetUrl?: string | null
  /** 编辑完成回调：返回结果图片 URL 列表 */
  onEdited: (urls: string[]) => void
}

/**
 * AI 图片编辑区域（内嵌式）：选择 ComfyUI 图片编辑工作流，
 * 优先使用画布上选中的图片作为输入源；未选中时回退到素材面板选中的素材；
 * 也支持手动上传补充其他插槽。
 */
export function ImageEditSection({ projectId, selectedLayer, selectedAssetUrl, onEdited }: ImageEditSectionProps) {
  const [workflows, setWorkflows] = useState<ComfyWorkflow[]>([])
  const [editMode, setEditMode] = useState<EditMode>('single')
  const [imageSlots, setImageSlots] = useState<ImageSlot[]>([])
  const [promptKey, setPromptKey] = useState<string>('')
  const [prompt, setPrompt] = useState('')
  const [negativePromptKey, setNegativePromptKey] = useState<string>('')
  const [negativePrompt, setNegativePrompt] = useState('')
  const [seedKey, setSeedKey] = useState<string>('')
  const [widthKey, setWidthKey] = useState<string>('')
  const [heightKey, setHeightKey] = useState<string>('')
  const [dimension, setDimension] = useState<{ width: number; height: number }>({
    width: 1024,
    height: 1024,
  })
  const [running, setRunning] = useState(false)
  const [progressPercent, setProgressPercent] = useState(0)
  const [progressMessage, setProgressMessage] = useState('')
  const [loadingWorkflows, setLoadingWorkflows] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const activeSlotIndex = useRef<number>(-1)
  const cancelRef = useRef<boolean>(false)

  // 提示词历史 & 收藏
  const { pushHistory } = usePromptHistory()

  // 提取当前输入图片源：优先画布选中的图层，其次素材面板选中的素材
  const selectedImageSrc = useMemo(() => {
    if (selectedLayer && selectedLayer.type === 'image' && selectedLayer.src) {
      return selectedLayer.src
    }
    if (selectedAssetUrl) return selectedAssetUrl
    return null
  }, [selectedLayer, selectedAssetUrl])

  useEffect(() => {
    void loadWorkflows()
  }, [])

  const loadWorkflows = async () => {
    setLoadingWorkflows(true)
    try {
      const data = await comfyuiApi.list()
      // 保留所有工作流，由后续 selectedWorkflow 按当前 tab 匹配
      setWorkflows(data)
    } catch (e) {
      toast.error(`加载工作流失败：${e instanceof Error ? e.message : '未知错误'}`)
    } finally {
      setLoadingWorkflows(false)
    }
  }

  /**
   * 根据模式匹配工作流：
   * - single：图片输入插槽数为 1 的工作流（优先名称含"单图"）
   * - double：图片输入插槽数 ≥ 2 的工作流（优先名称含"双图"）
   * - text：0 图输入（文生图），优先名称含 Z-image / 文生图 / text-to-image
   */
  const selectedWorkflow = useMemo(() => {
    if (workflows.length === 0) return null
    const withSlotCount = workflows.map((w) => {
      const params = parseParams(w.paramSchema)
      // 计算"有效图片输入数"：与 slots 建立规则保持一致，避免 subgraph + LoadImage 双计导致把单图工作流误判为双图
      const allImageParams = params.filter((p) => p.type === 'image')
      const hasNonLoadImage = allImageParams.some((p) => p.nodeType !== 'LoadImage')
      const imageCount = allImageParams.filter((p) => (hasNonLoadImage ? p.nodeType !== 'LoadImage' : true)).length
      return { w, imageCount }
    })
    // 调试：打印各 tab 匹配到的候选工作流
    // eslint-disable-next-line no-console
    console.log('[ImageEditSection] editMode=', editMode, 'workflows=', withSlotCount.map(x => ({ name: x.w.name, imageCount: x.imageCount })))
    if (editMode === 'single') {
      const byName = withSlotCount.find((x) => x.imageCount === 1 && /单图/.test(x.w.name))
      if (byName) return byName.w
      const bySlot = withSlotCount.find((x) => x.imageCount === 1)
      return bySlot?.w ?? null
    } else if (editMode === 'double') {
      const byName = withSlotCount.find((x) => x.imageCount >= 2 && /双图|多图|two|double/i.test(x.w.name))
      if (byName) return byName.w
      const bySlot = withSlotCount.find((x) => x.imageCount >= 2)
      return bySlot?.w ?? null
    } else {
      // text: 文生图 —— 只要 0 图输入即可作为候选；优先名称匹配 z-image / 文生图 / t2i
      const byName = withSlotCount.find(
        (x) => x.imageCount === 0 && /z.?image|文生图|文生|text.?to.?image|t2i|turbo/i.test(x.w.name)
      )
      if (byName) return byName.w
      const bySlot = withSlotCount.find((x) => x.imageCount === 0)
      return bySlot?.w ?? null
    }
  }, [workflows, editMode])

  // 工作流变更时，解析参数并初始化插槽
  useEffect(() => {
    if (!selectedWorkflow) {
      setImageSlots([])
      setPromptKey('')
      setPrompt('')
      setNegativePromptKey('')
      setNegativePrompt('')
      setSeedKey('')
      setWidthKey('')
      setHeightKey('')
      return
    }
    const params = parseParams(selectedWorkflow.paramSchema)
    // 收集所有 image 参数：
    // - 若同时存在 subgraph image 与内部 LoadImage（同一张图的两种暴露方式），只保留 subgraph 端口
    //   （后端会用虚拟 LoadImage 覆盖到内部链路，避免要求用户重复上传同一张图）
    // - 否则保留 LoadImage（普通工作流的唯一图片输入）
    const allImageParams = params.filter((p) => p.type === 'image')
    const hasNonLoadImage = allImageParams.some((p) => p.nodeType !== 'LoadImage')
    const slots = allImageParams
      .filter((p) => (hasNonLoadImage ? p.nodeType !== 'LoadImage' : true))
      .map<ImageSlot>((p) => ({ paramKey: `${p.nodeId}.${p.paramName}`, param: p }))
    setImageSlots(slots)

    // ---- 提示词识别（区分正/负面）----
    // 命中"负面/negative"关键词的 string 参数视作负面提示词
    // 其余 string 参数（PrimitiveStringMultiline / CLIPTextEncode / 名称含 prompt/正面/提示 等）视作正面提示词
    const textParams = params.filter(
      (p) =>
        p.type === 'string' &&
        (p.nodeType === 'CLIPTextEncode' ||
          p.nodeType === 'PrimitiveStringMultiline' ||
          /prompt|提示|正面|负面|negative|positive/i.test(`${p.label} ${p.title} ${p.paramName}`))
    )
    const negativeParam = textParams.find((p) =>
      /负面|negative|neg[_-]?prompt/i.test(`${p.label} ${p.title}`)
    )
    const positiveParam =
      textParams.find((p) => /正面|positive|pos[_-]?prompt/i.test(`${p.label} ${p.title}`)) ??
      textParams.find((p) => p !== negativeParam)

    if (positiveParam) {
      setPromptKey(`${positiveParam.nodeId}.${positiveParam.paramName}`)
      setPrompt(String(positiveParam.value ?? ''))
    } else {
      setPromptKey('')
      setPrompt('')
    }
    if (negativeParam) {
      setNegativePromptKey(`${negativeParam.nodeId}.${negativeParam.paramName}`)
      setNegativePrompt(String(negativeParam.value ?? ''))
    } else {
      setNegativePromptKey('')
      setNegativePrompt('')
    }

    // ---- seed 识别（KSampler 的 seed）----
    const seedParam = params.find(
      (p) =>
        p.type === 'int' &&
        /^seed$/i.test(p.paramName) &&
        /sampler|采样/i.test(`${p.nodeType} ${p.title}`)
    ) ?? params.find((p) => p.type === 'int' && /^seed$/i.test(p.paramName))
    if (seedParam) {
      setSeedKey(`${seedParam.nodeId}.${seedParam.paramName}`)
    } else {
      setSeedKey('')
    }

    // 识别 width / height 参数（int 类型 + 名称匹配）
    const wParam = params.find(
      (p) =>
        p.type === 'int' &&
        (/^(width|宽|宽度)$/i.test(p.paramName) ||
          /width|宽度/i.test(`${p.label} ${p.title}`))
    )
    const hParam = params.find(
      (p) =>
        p.type === 'int' &&
        (/^(height|高|高度)$/i.test(p.paramName) ||
          /height|高度/i.test(`${p.label} ${p.title}`))
    )
    if (wParam && hParam) {
      setWidthKey(`${wParam.nodeId}.${wParam.paramName}`)
      setHeightKey(`${hParam.nodeId}.${hParam.paramName}`)
      const w = Number(wParam.value) || 1024
      const h = Number(hParam.value) || 1024
      setDimension({ width: w, height: h })
    } else {
      setWidthKey('')
      setHeightKey('')
    }
  }, [selectedWorkflow])

  // 关键：画布选中图层变化时，自动填充第一个图片插槽
  useEffect(() => {
    if (!selectedImageSrc || imageSlots.length === 0) return
    // 已经用同一张图自动填充过则不重复
    if (
      imageSlots[0]?.image?.fromCanvas &&
      imageSlots[0]?.image?.previewUrl === selectedImageSrc
    ) {
      return
    }
    void autoFillFromCanvas(0, selectedImageSrc)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedImageSrc, imageSlots.length])

  async function autoFillFromCanvas(idx: number, imageUrl: string) {
    // 判断来源：画布图层 or 素材面板
    const fromCanvasLayer = !!(selectedLayer && selectedLayer.type === 'image' && selectedLayer.src === imageUrl)
    const sourceLabel = fromCanvasLayer ? '画布选中' : '素材选中'
    setImageSlots((prev) => {
      const next = [...prev]
      if (!next[idx]) return prev
      next[idx] = {
        ...next[idx],
        image: {
          previewUrl: imageUrl,
          source: sourceLabel,
          uploading: true,
          fromCanvas: true,
        },
      }
      return next
    })
    try {
      const r = await comfyuiApi.uploadImageFromUrl(imageUrl)
      setImageSlots((prev) => {
        const next = [...prev]
        if (!next[idx]) return prev
        next[idx] = {
          ...next[idx],
          image: {
            previewUrl: imageUrl,
            source: sourceLabel,
            filename: r.name,
            uploading: false,
            fromCanvas: true,
          },
        }
        return next
      })
    } catch (e) {
      setImageSlots((prev) => {
        const next = [...prev]
        if (!next[idx]) return prev
        next[idx] = { ...next[idx], image: undefined }
        return next
      })
      toast.error(`自动加载选中图片失败：${e instanceof Error ? e.message : '未知错误'}`)
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
    // 文生图模式：不需要图片，但需要提示词或尺寸
    if (editMode === 'text') {
      return true
    }
    const slotsReady = imageSlots.every((s) => !!s.image?.filename)
    return slotsReady && imageSlots.length > 0
  }, [selectedWorkflow, running, imageSlots, editMode])

  async function handleRun() {
    if (!selectedWorkflow || !canRun) return
    setRunning(true)
    setProgressPercent(0)
    setProgressMessage('提交任务中...')
    cancelRef.current = false

    const startTime = Date.now()
    // 最长 5 分钟（可根据实际模型调整）
    const MAX_WAIT_MS = 5 * 60 * 1000
    let taskId: string | null = null

    try {
      const paramValues: Record<string, unknown> = {}
      imageSlots.forEach((s) => {
        if (s.image?.filename) paramValues[s.paramKey] = s.image.filename
      })
      if (promptKey) paramValues[promptKey] = prompt
      if (negativePromptKey) paramValues[negativePromptKey] = negativePrompt
      if (widthKey && heightKey) {
        paramValues[widthKey] = dimension.width
        paramValues[heightKey] = dimension.height
      }
      // 关键：每次提交都随机化 seed，避免 ComfyUI 命中缓存返回同一张图
      if (seedKey) {
        // 32-bit 内的正整数（ComfyUI seed 允许 uint64，但用 32bit 足够避免命中缓存且更安全）
        paramValues[seedKey] = Math.floor(Math.random() * 2 ** 31)
      }
      console.log('[ImageEdit] submit params=', paramValues)

      taskId = await comfyuiApi.submit(selectedWorkflow.id, paramValues, projectId)
      console.log('[ImageEdit] submit taskId=', taskId)
      // 提交成功后写入提示词历史（分正/负面）
      if (prompt.trim()) pushHistory(prompt, 'positive')
      if (negativePrompt.trim()) pushHistory(negativePrompt, 'negative')
      setProgressMessage('等待 ComfyUI 队列...')

      let urls: string[] = []
      let lastPercent = -1
      let sameCount = 0

      for (;;) {
        if (cancelRef.current) {
          throw new Error('用户已取消')
        }
        if (Date.now() - startTime > MAX_WAIT_MS) {
          throw new Error(`任务超过 ${MAX_WAIT_MS / 60000} 分钟仍未完成，已超时`)
        }

        await new Promise((r) => setTimeout(r, 1000))
        const p = await comfyuiApi.progress(taskId)
        console.log('[ImageEdit] progress', p)

        if (p.status === 'running') {
          setProgressPercent(p.percent)
          setProgressMessage(p.message || `处理中 ${p.percent}%`)
          // 检测卡住：percent 长时间不变
          if (p.percent === lastPercent) {
            sameCount++
            if (sameCount > 60) {
              setProgressMessage(`⚠️ 已 ${sameCount} 秒无进度更新，ComfyUI 可能卡住`)
            }
          } else {
            lastPercent = p.percent
            sameCount = 0
          }
        } else if (p.status === 'done') {
          urls = p.urls ?? []
          break
        } else {
          throw new Error(p.message || '生成失败')
        }
      }

      if (urls.length > 0) {
        onEdited(urls)
        toast.success(`AI 编辑完成，已生成 ${urls.length} 张图片`)
      } else {
        toast.warning('工作流未返回结果图片')
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : '未知错误'
      console.error('[ImageEdit] failed:', e, 'taskId=', taskId)
      toast.error(`图片编辑失败：${msg}`)
    } finally {
      setRunning(false)
      setProgressPercent(0)
      setProgressMessage('')
      cancelRef.current = false
    }
  }

  const handleCancel = () => {
    cancelRef.current = true
  }

  return (
    <div className='border-t border-neutral-100'>
      {/* 标题栏：可折叠 */}
      <button
        onClick={() => setCollapsed((c) => !c)}
        className='flex w-full items-center gap-1.5 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-50'
      >
        <Sparkles size={12} className='text-fuchsia-500' />
        AI 编辑
        <span className='ml-auto text-neutral-400'>{collapsed ? '展开' : '收起'}</span>
      </button>

      {!collapsed && (
        <div className='space-y-3 px-2 pb-3 pt-1'>
          {/* 编辑模式 Tab */}
          <div className='space-y-1'>
            <Label className='text-[10px] text-neutral-500'>编辑模式</Label>
            <div className='grid grid-cols-3 gap-1 rounded-md bg-neutral-100 p-0.5'>
              <button
                type='button'
                onClick={() => setEditMode('single')}
                className={cn(
                  'h-7 rounded text-xs font-medium transition-colors',
                  editMode === 'single'
                    ? 'bg-white text-fuchsia-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                Q单图编辑
              </button>
              <button
                type='button'
                onClick={() => setEditMode('double')}
                className={cn(
                  'h-7 rounded text-xs font-medium transition-colors',
                  editMode === 'double'
                    ? 'bg-white text-fuchsia-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                Q双图编辑
              </button>
              <button
                type='button'
                onClick={() => setEditMode('text')}
                className={cn(
                  'h-7 rounded text-xs font-medium transition-colors',
                  editMode === 'text'
                    ? 'bg-white text-fuchsia-600 shadow-sm'
                    : 'text-neutral-500 hover:text-neutral-700'
                )}
              >
                Z文生图
              </button>
            </div>
            {loadingWorkflows && (
              <p className='text-[10px] text-neutral-400'>加载工作流中...</p>
            )}
            {!loadingWorkflows && !selectedWorkflow && (
              <p className='text-[10px] text-red-500'>
                未找到
                {editMode === 'single' ? '单图' : editMode === 'double' ? '双图' : '文生图（Z-image）'}
                工作流，请先在 ComfyUI 中导入。
              </p>
            )}
          </div>

          {/* 尺寸单选：仅当工作流暴露 width/height 参数时显示 */}
          {selectedWorkflow && widthKey && heightKey && (
            <div className='space-y-1'>
              <Label className='text-[10px] text-neutral-500'>
                画面尺寸 · {dimension.width}×{dimension.height}
              </Label>
              <div className='grid grid-cols-2 gap-1'>
                {DIMENSION_PRESETS.map((p) => {
                  const active = p.width === dimension.width && p.height === dimension.height
                  return (
                    <button
                      key={`${p.width}x${p.height}`}
                      type='button'
                      onClick={() => setDimension({ width: p.width, height: p.height })}
                      className={cn(
                        'flex h-7 items-center justify-center rounded border px-1 text-[10px] transition-colors',
                        active
                          ? 'border-fuchsia-400 bg-fuchsia-50 text-fuchsia-700'
                          : 'border-neutral-200 bg-white text-neutral-600 hover:border-neutral-300 hover:bg-neutral-50'
                      )}
                    >
                      {p.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* 未选中图片提示（仅图片编辑模式） */}
          {editMode !== 'text' && selectedWorkflow && imageSlots.length > 0 && !selectedImageSrc && (
            <div className='rounded border border-blue-200 bg-blue-50 px-2 py-1.5 text-[10px] text-blue-700'>
              💡 请单击上方素材，或在画布上点击选中一张图片，将作为编辑输入自动填充。
            </div>
          )}

          {/* 无图片输入的工作流提示（仅图片编辑模式） */}
          {editMode !== 'text' && selectedWorkflow && imageSlots.length === 0 && (
            <div className='rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-[10px] text-amber-700'>
              该工作流没有图片输入节点。请选择支持图片输入的工作流。
            </div>
          )}

          {/* 图片插槽 */}
          {editMode !== 'text' && imageSlots.length > 0 && (
            <div className='space-y-1.5'>
              <Label className='text-[10px] text-neutral-500'>
                输入图片（{imageSlots.length}）
                {imageSlots.length > 1 && (
                  <span className='ml-1 text-neutral-400'>· 第1张来自画布选中，其余需手动补充</span>
                )}
              </Label>
              <div className='grid grid-cols-3 gap-1.5'>
                {imageSlots.map((slot, idx) => (
                  <div
                    key={slot.paramKey}
                    className={cn(
                      'relative aspect-square overflow-hidden rounded border border-dashed border-neutral-300 bg-neutral-50',
                      slot.image && 'border-solid border-neutral-200',
                      slot.image?.fromCanvas && 'border-fuchsia-300 ring-1 ring-fuchsia-200'
                    )}
                  >
                    {slot.image?.previewUrl ? (
                      <>
                        <img
                          src={slot.image.previewUrl}
                          alt=''
                          className='size-full object-cover'
                        />
                        {slot.image.uploading && (
                          <div className='absolute inset-0 flex items-center justify-center bg-black/40'>
                            <Loader2 size={14} className='animate-spin text-white' />
                          </div>
                        )}
                        {slot.image.fromCanvas && !slot.image.uploading && (
                          <div className='absolute bottom-0 left-0 right-0 bg-fuchsia-500/80 px-1 py-0.5 text-center text-[8px] font-medium text-white'>
                            {slot.image.source ?? '画布选中'}
                          </div>
                        )}
                        {!slot.image.uploading && !slot.image.fromCanvas && (
                          <button
                            onClick={() => removeSlotImage(idx)}
                            className='absolute right-0.5 top-0.5 flex size-4 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80'
                          >
                            <X size={9} />
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={() => triggerPick(idx)}
                        className='flex size-full flex-col items-center justify-center gap-0.5 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
                      >
                        <Plus size={14} />
                        <span className='text-[9px]'>
                          {idx === 0 ? '选中图片' : `图 ${idx + 1}`}
                        </span>
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <input
                ref={fileInputRef}
                type='file'
                accept='image/*'
                className='hidden'
                onChange={handleFileChange}
              />
            </div>
          )}

          {/* 提示词 */}
          {promptKey && (
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label className='text-[10px] text-neutral-500'>
                  {negativePromptKey ? '正面提示词' : '提示词'}
                </Label>
                <PromptHistoryPopover
                  kind='positive'
                  currentText={prompt}
                  onPick={(t) => setPrompt(t)}
                />
              </div>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder='描述你想要的画面内容...'
                className='min-h-[60px] resize-y text-xs'
              />
            </div>
          )}

          {/* 负面提示词 */}
          {negativePromptKey && (
            <div className='space-y-1'>
              <div className='flex items-center justify-between'>
                <Label className='text-[10px] text-neutral-500'>负面提示词</Label>
                <PromptHistoryPopover
                  kind='negative'
                  currentText={negativePrompt}
                  onPick={(t) => setNegativePrompt(t)}
                />
              </div>
              <Textarea
                value={negativePrompt}
                onChange={(e) => setNegativePrompt(e.target.value)}
                placeholder='描述你不想在画面中出现的内容...'
                className='min-h-[40px] resize-y text-xs'
              />
            </div>
          )}

          {/* 运行按钮 */}
          {selectedWorkflow && (
            <div className='space-y-1'>
              {running ? (
                <div className='space-y-1.5'>
                  <div className='flex items-center gap-1.5 text-[10px] text-neutral-600'>
                    <Loader2 size={10} className='animate-spin text-fuchsia-500' />
                    <span className='flex-1 truncate'>{progressMessage || `处理中 ${progressPercent}%`}</span>
                  </div>
                  <div className='h-1 w-full overflow-hidden rounded-full bg-neutral-100'>
                    <div
                      className='h-full bg-fuchsia-500 transition-all'
                      style={{ width: `${Math.max(2, progressPercent)}%` }}
                    />
                  </div>
                  <Button onClick={handleCancel} size='sm' variant='outline' className='w-full text-xs'>
                    取消
                  </Button>
                </div>
              ) : (
                <Button onClick={handleRun} disabled={!canRun} size='sm' className='w-full'>
                  <Play size={12} className='mr-1' />
                  生成
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
