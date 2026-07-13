import { createFileRoute } from '@tanstack/react-router'
import { WorkspacePage } from '@/features/projects/workspace-page'

export const Route = createFileRoute('/_authenticated/projects/')({
  validateSearch: (search: Record<string, unknown>) => ({
    projectId: (search.projectId as string) || undefined,
    workflowId: (search.workflowId as string) || undefined,
    mode: (search.mode as string) || undefined,
  }),
  component: WorkspacePage,
})
