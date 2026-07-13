import { createFileRoute } from '@tanstack/react-router'
import { AiMusicPage } from '@/features/ai-music'

function AiMusicRoute() {
  const search = Route.useSearch()
  return (
    <div data-layout='fixed' className='flex h-full min-h-0 flex-1 flex-col overflow-hidden'>
      <AiMusicPage tab={search.tab} projectId={search.projectId} />
    </div>
  )
}

export const Route = createFileRoute('/_authenticated/ai-music/')({
  component: AiMusicRoute,
  validateSearch: (search: Record<string, unknown>) => ({
    tab: (search.tab as string) || undefined,
    projectId: (search.projectId as string) || undefined,
  }),
})
