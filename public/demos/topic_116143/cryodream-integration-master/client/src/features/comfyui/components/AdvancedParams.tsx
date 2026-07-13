import { Dice5, FileVideo, ImagePlus, Lock, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { comfyuiApi, type ComfyParam } from '../api/comfyui-api'
import { COMBO_OPTIONS, paramLabel, randomSeed, seedModeKey } from '../config/nodeMeta'
import { useProjectId } from '../context/ProjectIdContext'

/**
 * 图片预览 URL 解析器：
 * 1. 已经是完整 URL（http/// 或以 /api/ 开头） → 直接返回
 * 2. 纯文件名（比如 trae-upload-xxx.png） → 优先构造 /api/comfyui-output/<projectId>/xxx（画布项目目录）
 * 3. 兜底走原 inputFileUrl（ComfyUI view 接口，兼容老数据）
 */
function resolveInputPreviewUrl(value: string, projectId?: string): string {
  if (!value) return ''
  if (value.startsWith('http://') || value.startsWith('https://') || value.startsWith('/api/')) {
    return value
  }
  if (projectId) {
    const dir = projectId.trim().replace(/[\\/:*?"<>|]/g, '_').replace(/\s+/g, '_')
    return `/api/comfyui-output/${dir}/${value}`
  }
  return comfyuiApi.inputFileUrl(value)
}

interface AdvancedParamsProps {
  params: ComfyParam[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

function paramKey(p: ComfyParam) {
  return `${p.nodeId}.${p.paramName}`
}

/**
 * 高级参数网格：下拉框（采样器/调度器）+ 种子（随机/固定切换）+ 普通输入框。
 */
export function AdvancedParams({ params, values, onChange }: AdvancedParamsProps) {
  const getVal = (p: ComfyParam) => String(values[paramKey(p)] ?? p.value ?? '')
  const seedParam = params.find((p) => p.paramName === 'seed')
  const imageParams = params.filter((p) => p.type === 'image')
  const videoParams = params.filter((p) => p.type === 'video')
  const restParams = params.filter((p) => p.paramName !== 'seed' && p.type !== 'image' && p.type !== 'video')

  return (
    <div className="space-y-2">
      {seedParam && (
        <SeedField
          value={getVal(seedParam)}
          mode={(values[seedModeKey(seedParam.nodeId)] as string) ?? 'randomize'}
          onValueChange={(v) => onChange(paramKey(seedParam), v)}
          onModeChange={(m) => onChange(seedModeKey(seedParam.nodeId), m)}
        />
      )}

      {videoParams.map((p) => (
        <VideoField
          key={paramKey(p)}
          param={p}
          value={getVal(p)}
          onChange={(v) => onChange(paramKey(p), v)}
        />
      ))}

      {imageParams.map((p) => (
        <ImageField
          key={paramKey(p)}
          param={p}
          value={getVal(p)}
          onChange={(v) => onChange(paramKey(p), v)}
        />
      ))}

      <div className="grid grid-cols-2 gap-2">
        {restParams.map((p) => {
          // Prefer schema-provided options, fallback to hardcoded COMBO_OPTIONS
          const options = (p.options?.length ? p.options.map(String) : null) ?? COMBO_OPTIONS[p.paramName]
          return (
            <div key={paramKey(p)} className="space-y-1">
              <Label className="truncate text-[10px] text-neutral-400">{paramLabel(p)}</Label>
              {options ? (
                <Select value={getVal(p)} onValueChange={(v) => onChange(paramKey(p), v)}>
                  <SelectTrigger className="nodrag h-7 border-neutral-200 bg-white text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {options.map((opt) => (
                      <SelectItem key={opt} value={opt} className="text-xs">
                        {opt}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <Input
                  value={getVal(p)}
                  onChange={(e) => {
                    const raw = e.target.value
                    const val = p.type === 'int' || p.type === 'float' ? Number(raw) : raw
                    onChange(paramKey(p), Number.isNaN(val as number) ? raw : val)
                  }}
                  className="nodrag h-7 border-neutral-200 bg-white text-xs focus-visible:ring-neutral-900/20"
                />
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

function SeedField({
  value,
  mode,
  onValueChange,
  onModeChange,
}: {
  value: string
  mode: string
  onValueChange: (v: number) => void
  onModeChange: (m: string) => void
}) {
  const isRandom = mode === 'randomize'
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] text-neutral-400">种子</Label>
        <div className="flex overflow-hidden rounded-md border border-neutral-200">
          <button
            onClick={() => onModeChange('fixed')}
            className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] transition-colors',
              !isRandom ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-100'
            )}
          >
            <Lock size={10} /> 固定
          </button>
          <button
            onClick={() => onModeChange('randomize')}
            className={cn(
              'flex items-center gap-0.5 px-1.5 py-0.5 text-[10px] transition-colors',
              isRandom ? 'bg-neutral-900 text-white' : 'bg-white text-neutral-500 hover:bg-neutral-100'
            )}
          >
            <Dice5 size={10} /> 随机
          </button>
        </div>
      </div>
      <div className="flex gap-1.5">
        <Input
          value={value}
          disabled={isRandom}
          onChange={(e) => onValueChange(Number(e.target.value) || 0)}
          placeholder={isRandom ? '每次运行随机生成' : '固定种子'}
          className="nodrag h-7 flex-1 border-neutral-200 bg-white text-xs focus-visible:ring-neutral-900/20 disabled:bg-neutral-50 disabled:text-neutral-400"
        />
        <button
          onClick={() => onValueChange(randomSeed())}
          title="生成一个随机种子"
          className="nodrag flex size-7 shrink-0 items-center justify-center rounded-md border border-neutral-200 bg-white text-neutral-500 transition-colors hover:bg-neutral-900 hover:text-white"
        >
          <Dice5 size={13} />
        </button>
      </div>
    </div>
  )
}

export function VideoField({
  param,
  value,
  onChange,
}: {
  param: ComfyParam
  value: string
  onChange: (v: string) => void
}) {
  const projectId = useProjectId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [fileName, setFileName] = useState(value)
  const [uploading, setUploading] = useState(false)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    setUploading(true)
    try {
      const r = await comfyuiApi.uploadVideo(file, undefined, projectId)
      setFileName(file.name)
      onChange(r.name)
      toast.success('视频上传成功')
    } catch (err) {
      setFileName('')
      console.error('[comfyui] 上传视频失败:', err)
      toast.error(`上传失败：${err instanceof Error ? err.message : '未知错误'}`, {
        duration: 10000,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    setFileName('')
    onChange('')
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-neutral-400">{paramLabel(param)}</Label>
        <span className="text-[10px] text-red-400">*</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="video/*,.mp4,.mov,.webm,.avi,.mkv"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      {fileName ? (
        <div className="flex items-center gap-2 rounded-md border border-neutral-200 bg-neutral-50 px-2 py-2">
          <div className="flex size-8 shrink-0 items-center justify-center rounded-md bg-neutral-900 text-white">
            <FileVideo size={15} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-xs text-neutral-700">{fileName}</div>
            <div className="text-[10px] text-neutral-400">已选择视频</div>
          </div>
          <button
            onClick={handleClear}
            className="flex size-6 shrink-0 items-center justify-center rounded-full text-neutral-400 hover:bg-neutral-200 hover:text-neutral-700"
          >
            <X size={11} />
          </button>
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-16 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-red-200 bg-red-50/40 text-xs text-red-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
        >
          <FileVideo size={16} />
          <span>{uploading ? '视频上传中...' : '请上传视频'}</span>
        </button>
      )}
    </div>
  )
}

export function ImageField({
  param,
  value,
  onChange,
}: {
  param: ComfyParam
  value: string
  onChange: (v: string) => void
}) {
  const projectId = useProjectId()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(
    value ? resolveInputPreviewUrl(value, projectId) : null
  )
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    setPreviewUrl(value ? resolveInputPreviewUrl(value, projectId) : null)
  }, [value, projectId])

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    e.target.value = ''
    const preview = URL.createObjectURL(file)
    setPreviewUrl(preview)
    setUploading(true)
    try {
      const r = await comfyuiApi.uploadImage(file, undefined, projectId)
      setPreviewUrl(r.url ?? comfyuiApi.inputFileUrl(r.name, r.type, r.subfolder))
      onChange(r.name)
      toast.success('图片上传成功')
    } catch (err) {
      setPreviewUrl(null)
      console.error('[comfyui] 上传图片失败:', err)
      toast.error(`上传失败：${err instanceof Error ? err.message : '未知错误'}`, {
        duration: 10000,
      })
    } finally {
      setUploading(false)
    }
  }

  const handleClear = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPreviewUrl(null)
    onChange('')
  }

  const hasImage = !!previewUrl

  return (
    <div className="space-y-1">
      <div className="flex items-center gap-1">
        <Label className="text-[10px] text-neutral-400">{paramLabel(param)}</Label>
        <span className="text-[10px] text-red-400">*</span>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => void handleFileChange(e)}
      />
      {hasImage ? (
        <div className="group relative overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
          <img
            src={previewUrl!}
            alt={paramLabel(param)}
            className="h-24 w-full object-contain"
          />
          <div className="absolute inset-0 flex cursor-pointer items-center justify-center bg-black/0 transition-colors group-hover:bg-black/20"
            onClick={() => fileInputRef.current?.click()}
          >
            <span className="text-[10px] text-white opacity-0 transition-opacity group-hover:opacity-100">点击更换</span>
          </div>
          <div className="absolute right-1 top-1 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
            <button
              onClick={(e) => { e.stopPropagation(); handleClear() }}
              className="flex size-5 items-center justify-center rounded-full bg-black/50 text-white hover:bg-black/70"
            >
              <X size={10} />
            </button>
          </div>
          {uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/30">
              <span className="text-[10px] text-white">上传中...</span>
            </div>
          )}
        </div>
      ) : (
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-20 w-full items-center justify-center gap-1.5 rounded-md border border-dashed border-red-200 bg-red-50/40 text-xs text-red-400 transition-colors hover:border-red-300 hover:text-red-500 disabled:opacity-50"
        >
          <ImagePlus size={16} />
          <span>请上传图片</span>
        </button>
      )}
    </div>
  )
}
