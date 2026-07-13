import { createFileRoute } from '@tanstack/react-router'
import { ThinkingModelsPage } from '@/features/thinking-model'

export const Route = createFileRoute('/_authenticated/thinking-models')({
  component: ThinkingModelsPage,
})
