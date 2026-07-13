import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { ArrowLeft, Calendar, LineChart as LineChartIcon, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Skeleton } from '@/components/ui/skeleton'
import { type TimelineBucket, diaryApi } from './api/diary-api'
import { getMoodInfo } from './constants'

export function DiaryTimelinePage() {
  const navigate = useNavigate()
  const [buckets, setBuckets] = useState<TimelineBucket[]>([])
  const [moodData, setMoodData] = useState<{ date: string; moodScore: number; mood: string }[]>([])
  const [loading, setLoading] = useState(true)

  const reload = useCallback(async () => {
    setLoading(true)
    try {
      const [timelineData, trendData] = await Promise.all([
        diaryApi.timeline({ granularity: 'day' }),
        diaryApi.moodTrend(),
      ])
      setBuckets(timelineData)
      setMoodData(trendData)
    } catch {
      toast.error('时间线加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void reload()
  }, [reload])

  return (
    <>
      {/* 顶栏 */}
      <header className='flex h-14 shrink-0 items-center gap-3 border-b bg-background/70 px-6 backdrop-blur'>
        <SidebarTrigger className='-ms-2' />
        <Button variant='ghost' size='sm' onClick={() => navigate({ to: '/diaries' })}>
          <ArrowLeft className='size-3.5' data-icon='inline-start' />
          返回
        </Button>
        <span className='text-sm font-medium'>日记时间线</span>
      </header>

      <ScrollArea className='flex-1'>
        <div className='mx-auto flex w-full max-w-5xl flex-col gap-6 px-6 py-8'>
          {/* 情绪趋势图 */}
          <section>
            <div className='mb-3 flex items-center gap-2'>
              <LineChartIcon className='size-4 text-muted-foreground' />
              <h2 className='text-sm font-medium'>情绪趋势</h2>
            </div>
            {loading ? (
              <Skeleton className='h-48 rounded-xl' />
            ) : moodData.length === 0 ? (
              <div className='flex h-48 items-center justify-center text-sm text-muted-foreground'>
                暂无情绪数据
              </div>
            ) : (
              <div className='rounded-xl border p-4'>
                <ResponsiveContainer width='100%' height={200}>
                  <LineChart data={moodData}>
                    <CartesianGrid strokeDasharray='3 3' className='stroke-muted' />
                    <XAxis
                      dataKey='date'
                      tick={{ fontSize: 11 }}
                      className='text-muted-foreground'
                    />
                    <YAxis
                      domain={[-2, 2]}
                      ticks={[-2, -1, 0, 1, 2]}
                      tick={{ fontSize: 11 }}
                      className='text-muted-foreground'
                    />
                    <Tooltip
                      contentStyle={{
                        fontSize: '12px',
                        borderRadius: '8px',
                      }}
                    />
                    <Line
                      type='monotone'
                      dataKey='moodScore'
                      stroke='hsl(var(--primary))'
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>

          {/* 时间线卡片流 */}
          <section>
            <div className='mb-3 flex items-center gap-2'>
              <Calendar className='size-4 text-muted-foreground' />
              <h2 className='text-sm font-medium'>日记列表</h2>
            </div>
            {loading ? (
              <div className='flex flex-col gap-3'>
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className='h-24 rounded-xl' />
                ))}
              </div>
            ) : buckets.length === 0 ? (
              <div className='py-12 text-center text-sm text-muted-foreground'>
                还没有日记记录
              </div>
            ) : (
              <div className='flex flex-col gap-6'>
                {buckets.map((bucket) => (
                  <div key={bucket.key}>
                    {/* 日期头 */}
                    <div className='mb-2 flex items-center gap-2'>
                      <h3 className='text-sm font-semibold'>{bucket.key}</h3>
                      <Badge variant='secondary' className='text-xs'>
                        {bucket.count} 篇
                      </Badge>
                      <span className='text-xs text-muted-foreground'>
                        平均情绪：{bucket.avgMoodScore.toFixed(1)}
                      </span>
                    </div>
                    {/* 卡片 */}
                    <div className='grid grid-cols-1 gap-3 sm:grid-cols-2'>
                      {bucket.items.map((item) => {
                        const mood = getMoodInfo(item.mood)
                        return (
                          <article
                            key={item.id}
                            onClick={() =>
                              navigate({
                                to: '/diaries/$diaryId',
                                params: { diaryId: item.id },
                              })
                            }
                            className='cursor-pointer rounded-lg border bg-card p-3 transition-all hover:-translate-y-0.5 hover:shadow-md'
                          >
                            <div className='mb-1 flex items-center gap-2'>
                              <span>{mood.emoji}</span>
                              <h4 className='line-clamp-1 text-sm font-medium'>
                                {item.title || item.summary || '无标题'}
                              </h4>
                            </div>
                            <p className='line-clamp-2 text-xs text-muted-foreground'>
                              {item.summary || '（无摘要）'}
                            </p>
                          </article>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </ScrollArea>
    </>
  )
}
