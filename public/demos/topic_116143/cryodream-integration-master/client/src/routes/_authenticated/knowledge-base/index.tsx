import { createFileRoute } from '@tanstack/react-router'
import { KnowledgeBaseListPage } from '@/features/knowledge'

export const Route = createFileRoute('/_authenticated/knowledge-base/')({
  component: KnowledgeBaseListPage,
})
