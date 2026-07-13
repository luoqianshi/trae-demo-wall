import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import {
  novelSnapshotApi,
  parseAttributes,
  stringifyAttributes,
  type CharacterAttribute,
  type NovelCharacterSnapshot,
  type NovelTimelineEvent,
} from '../api/novel-api'
import { AttributeEditor } from './AttributeEditor'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  novelId: string
  characterId: string
  editing: NovelCharacterSnapshot | null
  events: NovelTimelineEvent[]
  baseAttributes: CharacterAttribute[]
  onSaved: () => void
}

export function SnapshotDialog({
  open,
  onOpenChange,
  novelId,
  characterId,
  editing,
  events,
  baseAttributes,
  onSaved,
}: Props) {
  const [label, setLabel] = useState('')
  const [note, setNote] = useState('')
  const [eventId, setEventId] = useState<string>('__none__')
  const [attrs, setAttrs] = useState<CharacterAttribute[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editing) {
      setLabel(editing.label ?? '')
      setNote(editing.note ?? '')
      setEventId(editing.eventId ?? '__none__')
      setAttrs(parseAttributes(editing.attributes))
    } else if (open) {
      setLabel('')
      setNote('')
      setEventId('__none__')
      // 新快照默认继承当前人物的属性作为起点
      setAttrs(baseAttributes.map((a) => ({ ...a })))
    }
  }, [editing, open, baseAttributes])

  const handleSave = async () => {
    if (!label.trim()) {
      toast.error('快照名称不能为空')
      return
    }
    setSubmitting(true)
    try {
      await novelSnapshotApi.save({
        id: editing?.id,
        novelId,
        characterId,
        label: label.trim(),
        note: note.trim() || undefined,
        eventId: eventId === '__none__' ? null : eventId,
        attributes: stringifyAttributes(attrs),
      })
      toast.success('快照已保存')
      onOpenChange(false)
      onSaved()
    } catch (e) {
      toast.error((e as Error).message || '保存失败')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-2xl overflow-auto">
        <DialogHeader>
          <DialogTitle>{editing ? '编辑状态快照' : '新建状态快照'}</DialogTitle>
          <DialogDescription>
            记录人物在某个剧情节点的属性状态。关联时间线事件后，可从时间线上直接跳查。
          </DialogDescription>
        </DialogHeader>
        <div className="flex flex-col gap-5 py-2">
          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-2">
              <Label>快照名称</Label>
              <Input
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="例如：开篇 / 第一次觉醒 / 大战之后"
              />
            </div>
            <div className="flex flex-col gap-2">
              <Label>关联时间线事件</Label>
              <Select value={eventId} onValueChange={setEventId}>
                <SelectTrigger>
                  <SelectValue placeholder="可选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectItem value="__none__">— 不关联 —</SelectItem>
                    {events.map((ev) => (
                      <SelectItem key={ev.id} value={ev.id}>
                        {ev.timeLabel ? `[${ev.timeLabel}] ` : ''}
                        {ev.title}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Label>备注</Label>
            <Textarea
              rows={2}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="记录此刻的处境、心境或环境……"
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>属性快照</Label>
            <AttributeEditor value={attrs} onChange={setAttrs} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSave} disabled={submitting}>
            {submitting ? '保存中…' : '保存快照'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
