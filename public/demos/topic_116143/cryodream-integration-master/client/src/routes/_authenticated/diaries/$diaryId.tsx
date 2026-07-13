import { createFileRoute } from '@tanstack/react-router'
import { DiaryDetailPage } from '@/features/diaries/diary-detail-page'

export const Route = createFileRoute('/_authenticated/diaries/$diaryId')({
  component: DiaryDetailPage,
})
