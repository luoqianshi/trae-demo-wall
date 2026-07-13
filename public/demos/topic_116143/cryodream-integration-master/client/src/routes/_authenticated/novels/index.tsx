import { createFileRoute } from '@tanstack/react-router'
import { NovelListPage } from '@/features/novels/novel-list-page'

export const Route = createFileRoute('/_authenticated/novels/')({
  component: NovelListPage,
})
