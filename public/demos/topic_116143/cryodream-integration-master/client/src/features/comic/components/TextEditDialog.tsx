import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

interface Props {
  open: boolean
  initialText: string
  title?: string
  onOpenChange: (open: boolean) => void
  onSave: (text: string) => void
}

export function TextEditDialog({ open, initialText, title = '编辑文字', onOpenChange, onSave }: Props) {
  const [draft, setDraft] = useState('')

  useEffect(() => {
    if (open) setDraft(initialText)
  }, [open, initialText])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <textarea
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className='min-h-32 w-full rounded border border-neutral-200 p-3 text-sm focus:border-neutral-500 focus:outline-none'
          placeholder='输入文字内容...'
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
              onSave(draft)
              onOpenChange(false)
            }
          }}
        />
        <p className='text-[10px] text-neutral-400'>Ctrl/Cmd + Enter 保存</p>
        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button
            onClick={() => {
              onSave(draft)
              onOpenChange(false)
            }}
          >
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
