import { createFileRoute, Navigate } from '@tanstack/react-router'

interface FlowSearch {
  projectId?: string
  workflowId?: string
  mode?: 'edit' | 'debug'
}

export const Route = createFileRoute('/_authenticated/flow')({
  validateSearch: (search: Record<string, unknown>): FlowSearch => ({
    projectId: typeof search.projectId === 'string' ? search.projectId : undefined,
    workflowId: typeof search.workflowId === 'string' ? search.workflowId : undefined,
    mode: search.mode === 'debug' || search.mode === 'edit' ? search.mode : undefined,
  }),
  component: FlowRedirect,
})

function FlowRedirect() {
  const search = Route.useSearch()
  // 重定向到统一工作区页面
  return <Navigate to='/projects' search={{ projectId: search.projectId, workflowId: search.workflowId, mode: search.mode }} />
}
