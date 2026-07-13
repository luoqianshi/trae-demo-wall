import { useState } from 'react'
import { format, parseISO } from 'date-fns'
import { Check, Loader2, Milestone as MilestoneIcon, Plus } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'
import { type Milestone, milestoneApi } from '../api/diary-api'

interface MilestonePanelProps {
  milestones: Milestone[]
  onReload: () => void
}

const COLOR_OPTIONS = [
  { value: 'blue', dot: 'bg-blue-500' },
  { value: 'green', dot: 'bg-green-500' },
  { value: 'amber', dot: 'bg-amber-500' },
  { value: 'pink', dot: 'bg-pink-500' },
  { value: 'purple', dot: 'bg-purple-500' },
  { value: 'teal', dot: 'bg-teal-500' },
  { value: 'red', dot: 'bg-red-500' },
  { value: 'gray', dot: 'bg-gray-500' },
]

function colorDotClass(color?: string) {
  return COLOR_OPTIONS.find((c) => c.value === color)?.dot ?? 'bg-gray-500'
}

export function MilestonePanel({ milestones, onReload }: MilestonePanelProps) {
  const [open, setOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [achievingId, setAchievingId] = useState<string | null>(null)

  // 表单状态
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [targetDate, setTargetDate] = useState<Date | undefined>()
  const [color, setColor] = useState<string>('blue')

  const resetForm = () => {
    setTitle('')
    setDescription('')
    setTargetDate(undefined)
    setColor('blue')
  }

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast.warning('请输入里程碑标题')
      return
    }
    setSubmitting(true)
    try {
      await milestoneApi.add({
        title: title.trim(),
        description: description.trim() || undefined,
        targetDate: targetDate ? format(targetDate, 'yyyy-MM-dd') : undefined,
        color,
      })
      toast.success('里程碑已创建')
      resetForm()
      setOpen(false)
      onReload()
    } catch {
      toast.error('创建失败')
    } finally {
      setSubmitting(false)
    }
  }

  const handleAchieve = async (id: string) => {
    setAchievingId(id)
    try {
      await milestoneApi.achieve(id)
      toast.success('已标记为完成')
      onReload()
    } catch {
      toast.error('操作失败')
    } finally {
      setAchievingId(null)
    }
  }

  return (
    <section className='flex min-h-0 flex-1 flex-col'>
      <div className='mb-2 flex items-center justify-between px-1'>
        <div className='flex items-center gap-2'>
          <MilestoneIcon className='size-3.5 text-muted-foreground' />
          <h3 className='text-xs font-medium text-muted-foreground'>里程碑</h3>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm() }}>
          <DialogTrigger asChild>
            <Button variant='ghost' size='sm' className='h-6 px-2 text-xs'>
              <Plus className='size-3' data-icon='inline-start' />
              新建
            </Button>
          </DialogTrigger>
          <DialogContent className='sm:max-w-md'>
            <DialogHeader>
              <DialogTitle>新建里程碑</DialogTitle>
            </DialogHeader>
            <div className='flex flex-col gap-4 py-2'>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='milestone-title'>标题</Label>
                <Input
                  id='milestone-title'
                  placeholder='例如：连续写日记 30 天'
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>目标日期</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant='outline'
                      size='sm'
                      className='justify-start text-left font-normal'
                    >
                      {targetDate
                        ? format(targetDate, 'yyyy-MM-dd')
                        : '选择日期（可选）'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className='w-auto p-0' align='start'>
                    <Calendar
                      mode='single'
                      selected={targetDate}
                      onSelect={setTargetDate}
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label>颜色</Label>
                <div className='flex flex-wrap gap-2'>
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c.value}
                      type='button'
                      onClick={() => setColor(c.value)}
                      className={cn(
                        'flex size-6 items-center justify-center rounded-full transition-all',
                        c.dot,
                        color === c.value
                          ? 'ring-2 ring-ring ring-offset-2'
                          : 'opacity-70 hover:opacity-100'
                      )}
                      aria-label={c.value}
                    >
                      {color === c.value && <Check className='size-3 text-white' />}
                    </button>
                  ))}
                </div>
              </div>
              <div className='flex flex-col gap-1.5'>
                <Label htmlFor='milestone-desc'>描述</Label>
                <Input
                  id='milestone-desc'
                  placeholder='备注（可选）'
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant='outline'
                size='sm'
                onClick={() => { setOpen(false); resetForm() }}
                disabled={submitting}
              >
                取消
              </Button>
              <Button size='sm' onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <Loader2 className='size-3.5 animate-spin' />
                ) : (
                  <Check className='size-3.5' />
                )}
                创建
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <ScrollArea className='min-h-0 flex-1'>
        {milestones.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-2 py-8 text-center'>
            <MilestoneIcon className='size-8 text-muted-foreground/30' />
            <p className='text-xs text-muted-foreground'>还没有里程碑</p>
          </div>
        ) : (
          <div className='flex flex-col gap-1.5 px-1 pb-2'>
            {milestones.map((m) => {
              const isAchieved = m.status === 'achieved'
              return (
                <div
                  key={m.id}
                  className={cn(
                    'flex items-start gap-2 rounded-md border bg-card px-2.5 py-2 transition-all',
                    isAchieved && 'opacity-60'
                  )}
                >
                  <span
                    className={cn(
                      'mt-1 size-2 shrink-0 rounded-full',
                      colorDotClass(m.color)
                    )}
                  />
                  <div className='min-w-0 flex-1'>
                    <p
                      className={cn(
                        'line-clamp-1 text-xs font-medium',
                        isAchieved && 'text-muted-foreground line-through'
                      )}
                    >
                      {m.title}
                    </p>
                    {m.targetDate && (
                      <p className='text-[10px] text-muted-foreground'>
                        目标：{format(parseISO(m.targetDate), 'yyyy-MM-dd')}
                      </p>
                    )}
                    {m.description && (
                      <p className='line-clamp-1 text-[10px] text-muted-foreground'>
                        {m.description}
                      </p>
                    )}
                  </div>
                  {!isAchieved && (
                    <Button
                      variant='ghost'
                      size='icon'
                      className='size-6 shrink-0'
                      onClick={() => handleAchieve(m.id)}
                      disabled={achievingId === m.id}
                      title='标记完成'
                    >
                      {achievingId === m.id ? (
                        <Loader2 className='size-3 animate-spin' />
                      ) : (
                        <Check className='size-3' />
                      )}
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </ScrollArea>
    </section>
  )
}
