import { useEffect, useState } from 'react'
import { GripVertical, Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'
import { type CharacterAttribute } from '../api/novel-api'

interface Props {
  value: CharacterAttribute[]
  onChange: (next: CharacterAttribute[]) => void
  readOnly?: boolean
  compact?: boolean
}

const TYPE_OPTIONS: Array<{ value: CharacterAttribute['type']; label: string }> = [
  { value: 'text', label: '文本' },
  { value: 'number', label: '数值' },
  { value: 'progress', label: '进度 0-100' },
]

export function AttributeEditor({ value, onChange, readOnly, compact }: Props) {
  const [rows, setRows] = useState<CharacterAttribute[]>(value)

  useEffect(() => {
    setRows(value)
  }, [value])

  const commit = (next: CharacterAttribute[]) => {
    setRows(next)
    onChange(next)
  }

  const update = (idx: number, patch: Partial<CharacterAttribute>) => {
    commit(rows.map((r, i) => (i === idx ? { ...r, ...patch } : r)))
  }

  const remove = (idx: number) => {
    commit(rows.filter((_, i) => i !== idx))
  }

  const add = () => {
    commit([...rows, { key: '', value: '', type: 'text' }])
  }

  if (readOnly) {
    if (rows.length === 0) {
      return (
        <p className="text-xs italic text-muted-foreground">尚未设置任何自定义属性</p>
      )
    }
    return (
      <div className={cn('grid gap-2', compact ? 'grid-cols-1' : 'grid-cols-2')}>
        {rows.map((r, i) => (
          <AttributePill key={i} attr={r} />
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {rows.length === 0 ? (
        <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
          还没有自定义属性 · 点击下方「新增」添加 HP / 境界 / 归属等字段
        </div>
      ) : (
        rows.map((row, idx) => (
          <div
            key={idx}
            className="group grid grid-cols-[auto_1fr_1.5fr_auto_auto] items-center gap-2"
          >
            <GripVertical className="size-3.5 text-muted-foreground/40" />
            <Input
              className="h-8"
              value={row.key}
              placeholder="属性名"
              onChange={(e) => update(idx, { key: e.target.value })}
            />
            {row.type === 'progress' ? (
              <div className="flex items-center gap-2">
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="h-8"
                  value={row.value}
                  onChange={(e) => update(idx, { value: e.target.value })}
                  placeholder="0-100"
                />
                <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{
                      width: `${Math.max(0, Math.min(100, Number(row.value) || 0))}%`,
                    }}
                  />
                </div>
              </div>
            ) : (
              <Input
                className="h-8"
                type={row.type === 'number' ? 'number' : 'text'}
                value={row.value}
                placeholder="属性值"
                onChange={(e) => update(idx, { value: e.target.value })}
              />
            )}
            <Select
              value={row.type ?? 'text'}
              onValueChange={(v) => update(idx, { type: v as CharacterAttribute['type'] })}
            >
              <SelectTrigger className="h-8 w-24 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {TYPE_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value ?? 'text'}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <Button
              variant="ghost"
              size="icon"
              className="size-7 text-muted-foreground hover:text-destructive"
              onClick={() => remove(idx)}
            >
              <X className="size-3.5" />
            </Button>
          </div>
        ))
      )}
      <Button size="sm" variant="outline" className="w-fit" onClick={add}>
        <Plus data-icon="inline-start" />
        新增属性
      </Button>
    </div>
  )
}

function AttributePill({ attr }: { attr: CharacterAttribute }) {
  if (attr.type === 'progress') {
    const num = Math.max(0, Math.min(100, Number(attr.value) || 0))
    return (
      <div className="flex flex-col gap-1 rounded-md border bg-card px-3 py-2">
        <div className="flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">{attr.key}</span>
          <span className="font-mono tabular-nums">{num}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-primary transition-all" style={{ width: `${num}%` }} />
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center justify-between gap-2 rounded-md border bg-card px-3 py-1.5 text-sm">
      <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
        {attr.key}
      </span>
      <span
        className={cn(
          'truncate text-right',
          attr.type === 'number' && 'font-mono tabular-nums'
        )}
      >
        {attr.value || '—'}
      </span>
    </div>
  )
}
