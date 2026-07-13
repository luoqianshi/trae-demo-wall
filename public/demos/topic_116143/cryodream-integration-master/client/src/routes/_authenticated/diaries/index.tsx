import { createFileRoute } from '@tanstack/react-router'
import { DiaryListPage } from '@/features/diaries/diary-list-page'

export const Route = createFileRoute('/_authenticated/diaries/')({
  component: DiaryListPage,
})
