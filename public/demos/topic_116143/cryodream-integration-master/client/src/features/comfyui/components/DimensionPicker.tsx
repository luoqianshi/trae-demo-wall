import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { DIMENSION_PRESETS } from '../config/nodeMeta'

interface DimensionPickerProps {
  width: number
  height: number
  onChange: (width: number, height: number) => void
}

/**
 * 可复用的宽高选择组件：仅一个占满宽度的下拉框选择常用尺寸。
 */
export function DimensionPicker({ width, height, onChange }: DimensionPickerProps) {
  const matched = DIMENSION_PRESETS.find((p) => p.width === width && p.height === height)
  const current = matched ? `${matched.width}x${matched.height}` : 'custom'

  return (
    <div className="space-y-1">
      <Label className="text-[11px] font-medium text-neutral-500">画面尺寸</Label>
      <Select
        value={current}
        onValueChange={(v) => {
          if (v === 'custom') return
          const [w, h] = v.split('x').map(Number)
          onChange(w, h)
        }}
      >
        <SelectTrigger className="nodrag h-8 w-full border-neutral-200 bg-neutral-50/60 text-xs">
          <SelectValue placeholder="选择尺寸" />
        </SelectTrigger>
        <SelectContent>
          {DIMENSION_PRESETS.map((p) => (
            <SelectItem key={`${p.width}x${p.height}`} value={`${p.width}x${p.height}`} className="text-xs">
              {p.label}
            </SelectItem>
          ))}
          {!matched && (
            <SelectItem value="custom" className="text-xs">
              自定义 · {width}×{height}
            </SelectItem>
          )}
        </SelectContent>
      </Select>
    </div>
  )
}
