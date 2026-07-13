import { createFileRoute } from '@tanstack/react-router'
import { ComicPage } from '@/features/comic'

interface ComicSearch {
  project?: string
}

export const Route = createFileRoute('/_authenticated/canvas/comic')({
  validateSearch: (search: Record<string, unknown>): ComicSearch => ({
    project: typeof search.project === 'string' ? search.project : undefined,
  }),
  component: ComicRoute,
})

function ComicRoute() {
  const { project } = Route.useSearch()
  return (
    <div data-layout="fixed" className="flex h-full min-h-0 flex-1 flex-col overflow-hidden">
      <ComicPage projectId={project} />
    </div>
  )
}
