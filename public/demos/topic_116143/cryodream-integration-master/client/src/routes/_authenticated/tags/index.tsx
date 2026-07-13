import { createFileRoute } from '@tanstack/react-router'
import { TagsManager } from '@/features/tags/pages/tags-manager'

export const Route = createFileRoute('/_authenticated/tags/')({
  component: TagsManager,
})
