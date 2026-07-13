import { createFileRoute, Navigate } from '@tanstack/react-router'

interface ComfyUISearch {
  project?: string
}

export const Route = createFileRoute('/_authenticated/comfyui')({
  validateSearch: (search: Record<string, unknown>): ComfyUISearch => ({
    project: typeof search.project === 'string' ? search.project : undefined,
  }),
  component: ComfyUIRedirect,
})

function ComfyUIRedirect() {
  const search = Route.useSearch()
  return <Navigate to='/canvas/comfyui' search={{ project: search.project }} replace />
}
