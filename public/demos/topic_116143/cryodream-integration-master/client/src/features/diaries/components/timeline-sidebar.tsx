import { format } from 'date-fns'
import { CalendarDays, LineChart as LineChartIcon } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { type TimelineBucket } from '../api/diary-api'
import { getMoodInfo } from '../constants'

interface TimelineSidebarProps {
  buckets: TimelineBucket[]
  moodData: { date: string; moodScore: number; mood: string }[]
}

export function TimelineSidebar({ buckets, moodData }: TimelineSidebarProps) {
  const navigate = useNavigate()

  const recentMoodData = moodData.slice(-7)

  return (
    <div className='flex h-full flex-col gap-4'>
      {/* 情绪趋势迷你图 */}
      <section className='rounded-lg border bg-card p-3'>
        <div className='mb-2 flex items-center gap-2'>
          <LineChartIcon className='size-3.5 text-muted-foreground' />
          <h3 className='text-xs font-medium text-muted-foreground'>情绪趋势 · 近7天</h3>
        </div>
        {recentMoodData.length === 0 ? (
          <div className='flex h-20 items-center justify-center text-xs text-muted-foreground'>
            暂无情绪数据
          </div>
        ) : (
          <ResponsiveContainer width='100%' height={80}>
            <LineChart data={recentMoodData} margin={{ top: 4, right: 4, bottom: 0, left: -28 }}>
              <CartesianGrid strokeDasharray='3 3' className='stroke-muted' vertical={false} />
              <XAxis
                dataKey='date'
                tick={{ fontSize: 9 }}
                tickFormatter={(v: string) => v.slice(5)}
                className='text-muted-foreground'
                interval='preserveStartEnd'
              />
              <YAxis
                domain={[-2, 2]}
                ticks={[-2, 0, 2]}
                tick={{ fontSize: 9 }}
                className='text-muted-foreground'
              />
              <Tooltip
                contentStyle={{
                  fontSize: '11px',
                  borderRadius: '6px',
                  padding: '4px 8px',
                }}
              />
              <Line
                type='monotone'
                dataKey='moodScore'
                stroke='hsl(var(--primary))'
                strokeWidth={2}
                dot={{ r: 2 }}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </section>

      {/* 时间线列表 */}
      <section className='flex min-h-0 flex-1 flex-col'>
        <div className='mb-2 flex items-center gap-2 px-1'>
          <CalendarDays className='size-3.5 text-muted-foreground' />
          <h3 className='text-xs font-medium text-muted-foreground'>时间线</h3>
        </div>
        <ScrollArea className='min-h-0 flex-1'>
          {buckets.length === 0 ? (
            <div className='flex flex-col items-center justify-center gap-2 py-10 text-center'>
              <CalendarDays className='size-8 text-muted-foreground/30' />
              <p className='text-xs text-muted-foreground'>还没有日记记录</p>
            </div>
          ) : (
            <div className='flex flex-col gap-3 px-1 pb-2'>
              {buckets.map((bucket) => (
                <div key={bucket.key}>
                  <div className='mb-1 flex items-center gap-1.5'>
                    <span className='text-xs font-semibold'>
                      {format(new Date(bucket.key), 'MM-dd')}
                    </span>
                    <Badge variant='secondary' className='h-4 px-1 text-[10px]'>
                      {bucket.count}
                    </Badge>
                  </div>
                  <div className='flex flex-col gap-1'>
                    {bucket.items.map((item) => {
                      const mood = getMoodInfo(item.mood)
                      return (
                        <button
                          key={item.id}
                          type='button'
                          onClick={() =>
                            navigate({
                              to: '/diaries/$diaryId',
                              params: { diaryId: item.id },
                            })
                          }
                          className={cn(
                            'group flex items-center gap-2 rounded-md border border-transparent px-2 py-1.5 text-left transition-all',
                            'hover:border-border hover:bg-accent/50'
                          )}
                        >
                          <span className='text-sm'>{mood.emoji}</span>
                          <div className='min-w-0 flex-1'>
                            <p className='line-clamp-1 text-xs font-medium'>
                              {item.title || item.summary || '无标题'}
                            </p>
                            {item.diaryDate && (
                              <p className='text-[10px] text-muted-foreground'>
                                {format(new Date(item.diaryDate), 'HH:mm')}
                              </p>
                            )}
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </section>
    </div>
  )
}
