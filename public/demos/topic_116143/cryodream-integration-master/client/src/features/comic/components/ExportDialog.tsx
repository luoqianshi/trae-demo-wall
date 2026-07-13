import { useState } from 'react'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onExport: (opts: { format: 'png' | 'pdf'; pixelRatio: number; scope: 'current' | 'all' }) => Promise<void>
  hasMultiplePages: boolean
}

export function ExportDialog({ open, onOpenChange, onExport, hasMultiplePages }: Props) {
  const [format, setFormat] = useState<'png' | 'pdf'>('png')
  const [pixelRatio, setPixelRatio] = useState(2)
  const [scope, setScope] = useState<'current' | 'all'>('current')
  const [exporting, setExporting] = useState(false)

  const handleExport = async () => {
    setExporting(true)
    try {
      await onExport({ format, pixelRatio, scope })
      onOpenChange(false)
    } finally {
      setExporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='max-w-md'>
        <DialogHeader>
          <DialogTitle>导出漫画</DialogTitle>
        </DialogHeader>
        <div className='space-y-4 py-2'>
          <div className='space-y-1.5'>
            <Label className='text-xs text-neutral-500'>格式</Label>
            <div className='flex gap-2'>
              {(['png', 'pdf'] as const).map((f) => (
                <button
                  key={f}
                  onClick={() => setFormat(f)}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    format === f
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {f.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className='space-y-1.5'>
            <Label className='text-xs text-neutral-500'>清晰度</Label>
            <div className='flex gap-2'>
              {[1, 2, 3].map((r) => (
                <button
                  key={r}
                  onClick={() => setPixelRatio(r)}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    pixelRatio === r
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  {r}x
                </button>
              ))}
            </div>
          </div>

          {(hasMultiplePages || format === 'pdf') && (
            <div className='space-y-1.5'>
              <Label className='text-xs text-neutral-500'>页面范围</Label>
              <div className='flex gap-2'>
                <button
                  onClick={() => setScope('current')}
                  disabled={format === 'pdf'}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    scope === 'current' && format !== 'pdf'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  } disabled:cursor-not-allowed disabled:opacity-40`}
                >
                  当前页
                </button>
                <button
                  onClick={() => setScope('all')}
                  className={`flex-1 rounded border px-3 py-2 text-sm ${
                    scope === 'all' || format === 'pdf'
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 hover:bg-neutral-50'
                  }`}
                >
                  全部页面
                </button>
              </div>
              {format === 'pdf' && (
                <p className='text-[10px] text-neutral-400'>PDF 会自动包含全部页面</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant='outline' onClick={() => onOpenChange(false)} disabled={exporting}>
            取消
          </Button>
          <Button onClick={handleExport} disabled={exporting} className='gap-1'>
            {exporting && <Loader2 size={14} className='animate-spin' />}
            导出
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
