import { createFileRoute } from '@tanstack/react-router'
import { ComfyUIPage } from '@/features/comfyui'

interface ComfyUISearch {
  project?: string
}

export const Route = createFileRoute('/_authenticated/canvas/comfyui')({
  validateSearch: (search: Record<string, unknown>): ComfyUISearch => ({
    project: typeof search.project === 'string' ? search.project : undefined,
  }),
  component: ComfyUIRoute,
})

function ComfyUIRoute() {
  const { project } = Route.useSearch()
  return (
    <div data-layout="fixed" className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ComfyUIPage projectId={project} />
    </div>
  )
}
