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
import { Textarea } from '@/components/ui/textarea'
import { novelCharacterApi, type NovelCharacterItem } from '../api/novel-api'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  novelId: string
  editing: NovelCharacterItem | null
  onSaved: () => void
}

const emptyForm = {
  name: '',
  alias: '',
  avatarUrl: '',
  identity: '',
  personality: '',
  background: '',
  appearance: '',
  catchphrase: '',
  remark: '',
}

export function CharacterFormDialog({ open, onOpenChange, novelId, editing, onSaved }: Props) {
  const [form, setForm] = useState(emptyForm)
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (editing) {
      setForm({
        name: editing.name ?? '',
        alias: editing.alias ?? '',
        avatarUrl: editing.avatarUrl ?? '',
        identity: editing.identity ?? '',
        personality: editing.personality ?? '',
        background: editing.background ?? '',
        appearance: editing.appearance ?? '',
        catchphrase: editing.catchphrase ?? '',
        remark: editing.remark ?? '',
      })
    } else {
      setForm(emptyForm)
    }
  }, [editing, open])

  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error('姓名不能为空')
      return
    }
    setSubmitting(true)
    try {
      if (editing) {
        await novelCharacterApi.update({ id: editing.id, ...form })
        toast.success('人物已更新')
      } else {
        await novelCharacterApi.add({ novelId, ...form })
        toast.success('人物已创建')
      }
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
          <DialogTitle>{editing ? '编辑人物' : '新建人物'}</DialogTitle>
          <DialogDescription>完善人物设定，便于后续 AI 一致性检查参考。</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label>姓名 *</Label>
            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus />
          </div>
          <div className="flex flex-col gap-2">
            <Label>别名</Label>
            <Input value={form.alias} onChange={(e) => setForm({ ...form, alias: e.target.value })} placeholder="多个别名用逗号分隔" />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label>身份 / 职业</Label>
            <Input
              value={form.identity}
              onChange={(e) => setForm({ ...form, identity: e.target.value })}
              placeholder="例如：将军的独生女、修真界散仙"
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label>性格</Label>
            <Textarea
              rows={2}
              value={form.personality}
              onChange={(e) => setForm({ ...form, personality: e.target.value })}
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label>背景</Label>
            <Textarea
              rows={3}
              value={form.background}
              onChange={(e) => setForm({ ...form, background: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>外貌</Label>
            <Textarea
              rows={2}
              value={form.appearance}
              onChange={(e) => setForm({ ...form, appearance: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2">
            <Label>口头禅</Label>
            <Input
              value={form.catchphrase}
              onChange={(e) => setForm({ ...form, catchphrase: e.target.value })}
              placeholder='例如："又是这样"'
            />
          </div>
          <div className="col-span-2 flex flex-col gap-2">
            <Label>备注</Label>
            <Textarea
              rows={2}
              value={form.remark}
              onChange={(e) => setForm({ ...form, remark: e.target.value })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
