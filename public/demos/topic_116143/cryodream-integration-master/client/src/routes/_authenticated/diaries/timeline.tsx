import { createFileRoute } from '@tanstack/react-router'
import { DiaryTimelinePage } from '@/features/diaries/diary-timeline-page'

export const Route = createFileRoute('/_authenticated/diaries/timeline')({
  component: DiaryTimelinePage,
})
