import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import {
  Loader2,
  NotebookPen,
  Plus,
  RefreshCw,
  Search,
  Trash2,
} from 'lucide-react'
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
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import {
  type DiaryCategory,
  type DiaryItem,
  type Milestone,
  type TimelineBucket,
  diaryApi,
  diaryCategoryApi,
  milestoneApi,
} from './api/diary-api'
import { DiaryCard } from './components/diary-card'
import { MilestonePanel } from './components/milestone-panel'
import { TimelineSidebar } from './components/timeline-sidebar'
import { VoiceRecorder } from './components/voice-recorder'
import { MOODS } from './constants'

export function DiaryListPage() {
  const navigate = useNavigate()
  const isMobile = useIsMobile()

  // 日记列表
  const [diaries, setDiaries] = useState<DiaryItem[]>([])
  const [categories, setCategories] = useState<DiaryCategory[]>([])
  const [keyword, setKeyword] = useState('')
  const [filterCategory, setFilterCategory] = useState<string>('all')
  const [filterMood, setFilterMood] = useState<string>('all')
  const [loading, setLoading] = useState(false)

  // 时间线 & 里程碑
  const [buckets, setBuckets] = useState<TimelineBucket[]>([])
  const [moodData, setMoodData] = useState<{ date: string; moodScore: number; mood: string }[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [sideLoading, setSideLoading] = useState(false)

  // 删除
  const [deleteTarget, setDeleteTarget] = useState<DiaryItem | null>(null)
  const [deleting, setDeleting] = useState(false)

  const reloadDiaries = useCallback(async () => {
    setLoading(true)
    try {
      const [diaryResult, catResult] = await Promise.all([
        diaryApi.list({ current: 1, pageSize: 100 }),
        diaryCategoryApi.list(),
      ])
      setDiaries(diaryResult.records)
      setCategories(catResult)
    } catch {
      toast.error('日记列表加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  const reloadSidebar = useCallback(async () => {
    setSideLoading(true)
    try {
      const [timelineData, trendData, milestoneList] = await Promise.all([
        diaryApi.timeline({ granularity: 'day' }),
        diaryApi.moodTrend(),
        milestoneApi.list('active'),
      ])
      setBuckets(timelineData)
      setMoodData(trendData)
      setMilestones(milestoneList)
    } catch {
      // 侧边栏加载失败不阻塞主列表
      console.error('侧边栏数据加载失败')
    } finally {
      setSideLoading(false)
    }
  }, [])

  const reload = useCallback(async () => {
    await Promise.all([reloadDiaries(), reloadSidebar()])
  }, [reloadDiaries, reloadSidebar])

  useEffect(() => {
    void reload()
  }, [reload])

  const filtered = useMemo(() => {
    return diaries.filter((d) => {
      if (keyword) {
        const kw = keyword.toLowerCase()
        const match =
          d.title?.toLowerCase().includes(kw) ||
          d.summary?.toLowerCase().includes(kw) ||
          d.shortSummary?.toLowerCase().includes(kw) ||
          d.content?.toLowerCase().includes(kw)
        if (!match) return false
      }
      if (filterCategory !== 'all' && d.category !== filterCategory) return false
      if (filterMood !== 'all' && d.mood !== filterMood) return false
      return true
    })
  }, [diaries, keyword, filterCategory, filterMood])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await diaryApi.delete(deleteTarget.id)
      toast.success('日记已删除')
      setDeleteTarget(null)
      void reload()
    } catch {
      toast.error('删除失败')
    } finally {
      setDeleting(false)
    }
  }

  const handleTranscribed = (plainText: string, audioUrl: string, durationSec: number) => {
    navigate({
      to: '/diaries/$diaryId',
      params: { diaryId: 'new' },
      search: {
        initialContent: plainText,
        initialAudioUrl: audioUrl,
        initialAudioDuration: durationSec,
      } as Record<string, unknown>,
    })
  }

  // 顶栏（在两种布局下共用）
  const Header = (
    <header className='flex h-14 shrink-0 items-center gap-3 border-b bg-background/70 px-6 backdrop-blur'>
      <SidebarTrigger className='-ms-2' />
      <div className='flex items-center gap-2'>
        <span className='text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground'>
          Diary
        </span>
        <span className='text-muted-foreground/60'>·</span>
        <span className='text-sm font-medium'>日记</span>
      </div>
      <div className='ms-auto flex items-center gap-2'>
        <Button variant='ghost' size='sm' onClick={reload} disabled={loading}>
          <RefreshCw className={cn('size-3.5', loading && 'animate-spin')} data-icon='inline-start' />
          刷新
        </Button>
        <VoiceRecorder onTranscribed={handleTranscribed} />
        <Button
          size='sm'
          onClick={() =>
            navigate({
              to: '/diaries/$diaryId',
              params: { diaryId: 'new' },
            })
          }
        >
          <Plus className='size-3.5' data-icon='inline-start' />
          写日记
        </Button>
      </div>
    </header>
  )

  // 左侧面板内容（时间线 + 里程碑）
  const LeftPanel = (
    <div className='flex h-full flex-col gap-4 px-4 py-4'>
      {/* 时间线区域 */}
      <div className='flex min-h-0 flex-1 flex-col'>
        {sideLoading ? (
          <div className='flex flex-col gap-2'>
            <Skeleton className='h-28 w-full' />
            <Skeleton className='h-40 w-full' />
          </div>
        ) : (
          <TimelineSidebar buckets={buckets} moodData={moodData} />
        )}
      </div>

      {/* 里程碑区域 */}
      <div className='flex min-h-0 flex-[0_0_40%] flex-col border-t pt-3'>
        <MilestonePanel milestones={milestones} onReload={reloadSidebar} />
      </div>
    </div>
  )

  // 右侧面板内容（搜索筛选 + 日记卡片网格）
  const RightPanel = (
    <ScrollArea className='h-full'>
      <div className='flex flex-col gap-4 px-6 py-6'>
        {/* 搜索 + 筛选 */}
        <div className='flex flex-wrap items-center gap-3'>
          <div className='relative max-w-xs flex-1'>
            <Search className='absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground' />
            <Input
              placeholder='搜索日记...'
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              className='pl-9'
            />
          </div>
          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger className='w-32'>
              <SelectValue placeholder='分类' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部分类</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={c.id}>
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterMood} onValueChange={setFilterMood}>
            <SelectTrigger className='w-28'>
              <SelectValue placeholder='心情' />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value='all'>全部心情</SelectItem>
              {MOODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>
                  {m.emoji} {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 日记列表 */}
        {loading ? (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className='h-32 rounded-xl' />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className='flex flex-col items-center justify-center gap-3 py-20 text-center'>
            <NotebookPen className='size-12 text-muted-foreground/30' />
            <p className='text-muted-foreground'>
              {keyword || filterCategory !== 'all' || filterMood !== 'all'
                ? '没有匹配的日记'
                : '还没有日记，点击「写日记」或「语音输入」开始记录吧'}
            </p>
          </div>
        ) : (
          <div className='grid grid-cols-1 gap-4 lg:grid-cols-2'>
            {filtered.map((diary) => (
              <DiaryCard
                key={diary.id}
                diary={diary}
                categories={categories}
                onDelete={setDeleteTarget}
              />
            ))}
          </div>
        )}
      </div>
    </ScrollArea>
  )

  return (
    <div className='flex h-svh flex-col overflow-hidden'>
      {Header}

      {/* 主体：桌面端用 ResizablePanelGroup，移动端用 flex 上下堆叠 */}
      {isMobile ? (
        <div className='flex flex-1 flex-col overflow-hidden'>
          {/* 时间线 + 里程碑（上） */}
          <div className='max-h-[45vh] shrink-0 overflow-hidden border-b'>{LeftPanel}</div>
          {/* 日记列表（下） */}
          <div className='flex-1 overflow-hidden'>{RightPanel}</div>
        </div>
      ) : (
        <ResizablePanelGroup orientation='horizontal' className='min-h-0 flex-1'>
          <ResizablePanel defaultSize='30%' minSize='20%' maxSize='45%'>
            {LeftPanel}
          </ResizablePanel>
          <ResizableHandle withHandle />
          <ResizablePanel defaultSize='70%'>
            {RightPanel}
          </ResizablePanel>
        </ResizablePanelGroup>
      )}

      {/* 删除确认 */}
      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
          <AlertDialogDescription>
              确定要删除「{deleteTarget?.title || deleteTarget?.summary || '这条日记'}」吗？此操作不可撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className='bg-red-600 hover:bg-red-700'
            >
              {deleting ? (
                <Loader2 className='mr-2 size-4 animate-spin' />
              ) : (
                <Trash2 className='mr-2 size-4' />
              )}
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
