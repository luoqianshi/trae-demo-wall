import { createFileRoute } from '@tanstack/react-router'
import { WorkflowTestPage } from '@/features/comfyui'

export const Route = createFileRoute('/_authenticated/canvas/workflow-test')({
  component: WorkflowTestRoute,
})

function WorkflowTestRoute() {
  return <WorkflowTestPage />
}
