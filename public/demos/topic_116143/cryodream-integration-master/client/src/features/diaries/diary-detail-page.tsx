import { useCallback, useEffect, useState } from 'react'
import { useNavigate, useParams, useSearch } from '@tanstack/react-router'
import { format } from 'date-fns'
import { ArrowLeft, AudioLines, Loader2, Save, Sparkles, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  type DiaryCategory,
  type DiaryItem,
  diaryApi,
  diaryCategoryApi,
} from './api/diary-api'
import { MOODS, getAiStatusInfo, getCategoryColorClass } from './constants'
import { VoiceRecorder } from './components/voice-recorder'

export function DiaryDetailPage() {
  const navigate = useNavigate()
  const { diaryId } = useParams({ strict: false }) as { diaryId: string }
  const search = useSearch({ strict: false }) as Record<string, unknown>
  const isNew = diaryId === 'new'

  const [diary, setDiary] = useState<DiaryItem | null>(null)
  const [categories, setCategories] = useState<DiaryCategory[]>([])
  const [loading, setLoading] = useState(!isNew)
  const [saving, setSaving] = useState(false)
  const [deleteOpen, setDeleteOpen] = useState(false)

  // 表单状态
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [category, setCategory] = useState('')
  const [mood, setMood] = useState('calm')
  const [diaryDate, setDiaryDate] = useState(format(new Date(), "yyyy-MM-dd'T'HH:mm"))
  const [audioUrl, setAudioUrl] = useState<string | undefined>()
  const [audioDuration, setAudioDuration] = useState<number | undefined>()

  const loadDiary = useCallback(async () => {
    if (isNew) {
      // 新建模式，从 search 参数读取初始值
      if (search.initialContent) {
        setContent(search.initialContent as string)
      }
      if (search.initialAudioUrl) {
        setAudioUrl(search.initialAudioUrl as string)
      }
      if (search.initialAudioDuration) {
        setAudioDuration(search.initialAudioDuration as number)
      }
      return
    }
    setLoading(true)
    try {
      const data = await diaryApi.get(diaryId)
      setDiary(data)
      setTitle(data.title ?? '')
      setContent(data.content ?? '')
      setCategory(data.category ?? '')
      setMood(data.mood ?? 'calm')
      setDiaryDate(
        data.diaryDate
          ? format(new Date(data.diaryDate), "yyyy-MM-dd'T'HH:mm")
          : format(new Date(), "yyyy-MM-dd'T'HH:mm")
      )
      setAudioUrl(data.audioUrl)
      setAudioDuration(data.audioDurationSec)
    } catch {
      toast.error('日记加载失败')
    } finally {
      setLoading(false)
    }
  }, [diaryId, isNew, search])

  useEffect(() => {
    void loadDiary()
  }, [loadDiary])

  useEffect(() => {
    diaryCategoryApi.list().then(setCategories).catch(() => {})
  }, [])

  const handleSave = async () => {
    if (!content.trim()) {
      toast.error('日记内容不能为空')
      return
    }
    setSaving(true)
    try {
      if (isNew) {
        const id = await diaryApi.add({
          title: title || undefined,
          content,
          category: category || undefined,
          mood,
          audioUrl,
          audioDurationSec: audioDuration,
          diaryDate: new Date(diaryDate).toISOString(),
        })
        toast.success('日记已保存')
        navigate({ to: '/diaries/$diaryId', params: { diaryId: id } })
      } else {
        await diaryApi.update({
          id: diaryId,
          title,
          content,
          summary: diary?.summary,
          category,
          mood,
          moodScore: diary?.moodScore,
          diaryDate: new Date(diaryDate).toISOString(),
        })
        toast.success('已保存')
      }
    } catch (e) {
      toast.error('保存失败：' + (e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (isNew) return
    try {
      await diaryApi.delete(diaryId)
      toast.success('日记已删除')
      navigate({ to: '/diaries' })
    } catch {
      toast.error('删除失败')
    }
  }

  const handleTranscribed = (plainText: string, audioUrl: string, durationSec: number) => {
    setContent((prev) => (prev ? prev + '\n\n' + plainText : plainText))
    setAudioUrl(audioUrl)
    setAudioDuration(durationSec)
    toast.success('语音已转写，记得保存')
  }

  if (loading) {
    return (
      <div className='flex h-full items-center justify-center'>
        <Loader2 className='size-8 animate-spin text-muted-foreground' />
      </div>
    )
  }

  const aiStatus = getAiStatusInfo(diary?.aiAnalysisStatus)

  return (
    <>
      {/* 顶栏 */}
      <header className='flex h-14 shrink-0 items-center gap-3 border-b bg-background/70 px-6 backdrop-blur'>
        <SidebarTrigger className='-ms-2' />
        <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/diaries' })}>
          <ArrowLeft className='size-3.5' data-icon='inline-start' />
          返回
        </Button>
        <span className='text-sm font-medium'>
          {isNew ? '写日记' : title || '日记详情'}
        </span>
        <div className='ms-auto flex items-center gap-2'>
          <VoiceRecorder onTranscribed={handleTranscribed} />
          {!isNew && (
            <Button variant='outline' size='sm' onClick={() => setDeleteOpen(true)}>
              <Trash2 className='size-3.5' />
            </Button>
          )}
          <Button size='sm' onClick={handleSave} disabled={saving}>
            {saving ? <Loader2 className='size-3.5 animate-spin' /> : <Save className='size-3.5' data-icon='inline-start' />}
            保存
          </Button>
        </div>
      </header>

      {/* 主体 */}
      <ScrollArea className='flex-1'>
        <div className='mx-auto flex w-full max-w-3xl flex-col gap-4 px-6 py-6'>
          {/* 元信息行 */}
          <div className='flex flex-wrap items-center gap-3'>
            <Input
              type='datetime-local'
              value={diaryDate}
              onChange={(e) => setDiaryDate(e.target.value)}
              className='w-auto'
            />
            <Select value={mood} onValueChange={setMood}>
              <SelectTrigger className='w-32'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MOODS.map((m) => (
                  <SelectItem key={m.value} value={m.value}>
                    {m.emoji} {m.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className='w-32'>
                <SelectValue placeholder='分类' />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {!isNew && (
              <Badge variant='outline' className={cn('text-xs', aiStatus.color)}>
                <Sparkles className='mr-1 size-3' />
                {aiStatus.label}
              </Badge>
            )}
          </div>

          {/* 标题 */}
          <Input
            placeholder='标题（可选）'
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className='border-none px-0 text-xl font-bold shadow-none focus-visible:ring-0'
          />

          {/* AI 短摘要 */}
          {diary?.shortSummary && (
            <div className='rounded-lg border border-primary/20 bg-primary/5 p-3'>
              <span className='text-sm font-medium'>{diary.shortSummary}</span>
            </div>
          )}

          {/* AI 摘要 */}
          {diary?.summary && (
            <div className='rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-900 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-200'>
              <span className='font-medium'>AI 摘要：</span>
              {diary.summary}
            </div>
          )}

          {/* 音频播放器 */}
          {audioUrl && (
            <div className='flex items-center gap-2 rounded-lg border p-3'>
              <AudioLines className='size-4 text-muted-foreground' />
              <audio controls src={audioUrl} className='h-8 flex-1' />
              {audioDuration && (
                <span className='text-xs text-muted-foreground'>{audioDuration}s</span>
              )}
            </div>
          )}

          {/* 正文编辑 */}
          <Textarea
            placeholder='写下今天的想法...'
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className='min-h-[400px] resize-none border-none text-base leading-relaxed shadow-none focus-visible:ring-0'
          />

          {/* 标签 */}
          {diary?.tags && diary.tags.length > 0 && (
            <div className='flex flex-wrap items-center gap-2'>
              <span className='text-xs text-muted-foreground'>标签：</span>
              {diary.tags.map((tag) => (
                <Badge key={tag} variant='secondary' className='text-xs'>
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>

      {/* 删除确认 */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除这条日记吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className='bg-red-600 hover:bg-red-700'
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
