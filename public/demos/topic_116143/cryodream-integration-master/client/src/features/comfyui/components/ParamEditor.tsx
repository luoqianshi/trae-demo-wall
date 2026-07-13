import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { type ComfyParam } from '../api/comfyui-api'
import { paramLabel } from '../config/nodeMeta'
import { DimensionPicker } from './DimensionPicker'
import { AdvancedParams, ImageField, VideoField } from './AdvancedParams'

interface ParamEditorProps {
  params: ComfyParam[]
  values: Record<string, unknown>
  onChange: (key: string, value: unknown) => void
}

function paramKey(p: ComfyParam) {
  return `${p.nodeId}.${p.paramName}`
}

/**
 * 完整参数编辑表单（用于右侧属性面板），提示词输入框更高，参数全部展开。
 */
export function ParamEditor({ params, values, onChange }: ParamEditorProps) {
  const promptParams = params.filter((p) => {
    if (p.advanced === true) return false
    if (p.type === 'string' && p.multiline) return true
    return p.type === 'string' && (p.nodeType === 'CLIPTextEncode' || p.nodeType === 'PrimitiveStringMultiline')
  })
  const imageParams = params.filter((p) => p.advanced !== true && p.type === 'image')
  const videoParams = params.filter((p) => p.advanced !== true && p.type === 'video')
  const widthParams = params.filter((p) => p.paramName === 'width')
  const heightParams = params.filter((p) => p.paramName === 'height')
  const hasDimension = widthParams.length > 0 && heightParams.length > 0
  const advancedParams = params.filter(
    (p) =>
      !promptParams.includes(p) &&
      !imageParams.includes(p) &&
      !videoParams.includes(p) &&
      p.paramName !== 'width' &&
      p.paramName !== 'height'
  )

  const getVal = (p: ComfyParam) => String(values[paramKey(p)] ?? p.value ?? '')

  return (
    <div className="space-y-4">
      {imageParams.map((p) => (
        <ImageField key={paramKey(p)} param={p} value={getVal(p)} onChange={(v) => onChange(paramKey(p), v)} />
      ))}

      {videoParams.map((p) => (
        <VideoField key={paramKey(p)} param={p} value={getVal(p)} onChange={(v) => onChange(paramKey(p), v)} />
      ))}

      {promptParams.map((p) => (
        <div key={paramKey(p)} className="space-y-1.5">
          <Label className="text-xs font-medium text-neutral-600">{paramLabel(p)}</Label>
          <Textarea
            value={getVal(p)}
            onChange={(e) => onChange(paramKey(p), e.target.value)}
            rows={4}
            className="min-h-[88px] resize-y border-neutral-200 bg-neutral-50/60 text-xs leading-relaxed focus-visible:ring-neutral-900/20"
            placeholder="输入提示词..."
          />
        </div>
      ))}

      {hasDimension && (
        <DimensionPicker
          width={Number(values[paramKey(widthParams[0])] ?? widthParams[0].value ?? 0)}
          height={Number(values[paramKey(heightParams[0])] ?? heightParams[0].value ?? 0)}
          onChange={(w, h) => {
            for (const wp of widthParams) onChange(paramKey(wp), w)
            for (const hp of heightParams) onChange(paramKey(hp), h)
          }}
        />
      )}

      {advancedParams.length > 0 && (
        <AdvancedParams params={advancedParams} values={values} onChange={onChange} />
      )}
    </div>
  )
}
