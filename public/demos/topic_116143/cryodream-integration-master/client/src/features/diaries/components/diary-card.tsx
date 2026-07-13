import { format } from 'date-fns'
import { AudioLines, MoreHorizontal, Pencil, Trash2 } from 'lucide-react'
import { useNavigate } from '@tanstack/react-router'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { type DiaryItem } from '../api/diary-api'
import { getMoodInfo, getCategoryColorClass, getAiStatusInfo } from '../constants'

interface DiaryCardProps {
  diary: DiaryItem
  categories: { id: string; name: string; color: string }[]
  onDelete: (diary: DiaryItem) => void
}

export function DiaryCard({ diary, categories, onDelete }: DiaryCardProps) {
  const navigate = useNavigate()
  const mood = getMoodInfo(diary.mood)
  const aiStatus = getAiStatusInfo(diary.aiAnalysisStatus)
  const category = categories.find((c) => c.id === diary.category)

  const handleClick = () => {
    navigate({ to: '/diaries/$diaryId', params: { diaryId: diary.id } })
  }

  return (
    <article
      onClick={handleClick}
      className='group cursor-pointer rounded-xl border bg-card p-4 transition-all hover:-translate-y-0.5 hover:shadow-lg'
    >
      <div className='mb-2 flex items-start justify-between'>
        <div className='flex items-center gap-2'>
          <span className='text-lg'>{mood.emoji}</span>
          <div>
            <h3 className='line-clamp-1 font-medium'>
              {diary.title || diary.summary || '无标题日记'}
            </h3>
            <p className='text-xs text-muted-foreground'>
              {diary.diaryDate
                ? format(new Date(diary.diaryDate), 'yyyy-MM-dd HH:mm')
                : ''}
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant='ghost'
              size='icon'
              className='size-7 opacity-0 group-hover:opacity-100'
              onClick={(e) => e.stopPropagation()}
            >
              <MoreHorizontal className='size-4' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end'>
            <DropdownMenuItem
              onClick={(e) => {
                e.stopPropagation()
                handleClick()
              }}
            >
              <Pencil className='mr-2 size-3.5' />
              编辑
            </DropdownMenuItem>
            <DropdownMenuItem
              className='text-red-600'
              onClick={(e) => {
                e.stopPropagation()
                onDelete(diary)
              }}
            >
              <Trash2 className='mr-2 size-3.5' />
              删除
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {diary.shortSummary ? (
        <p className='mb-3 line-clamp-2 font-medium'>
          {diary.shortSummary}
        </p>
      ) : (
        <p className='mb-3 line-clamp-2 text-sm text-muted-foreground'>
          {diary.summary || diary.content?.slice(0, 100) || '（空）'}
        </p>
      )}

      <div className='flex items-center gap-2'>
        {category && (
          <Badge
            variant='secondary'
            className={cn('text-xs', getCategoryColorClass(category.color))}
          >
            {category.name}
          </Badge>
        )}
        {diary.audioUrl && (
          <Badge variant='outline' className='text-xs'>
            <AudioLines className='mr-1 size-3' />
            {diary.audioDurationSec}s
          </Badge>
        )}
        {diary.tags?.slice(0, 3).map((tag) => (
          <Badge key={tag} variant='outline' className='text-xs'>
            {tag}
          </Badge>
        ))}
        <span className={cn('ml-auto text-xs', aiStatus.color)}>
          {aiStatus.label}
        </span>
        {diary.wordCount ? (
          <span className='text-xs text-muted-foreground'>
            {diary.wordCount}字
          </span>
        ) : null}
      </div>
    </article>
  )
}
