import { createFileRoute, useNavigate } from '@tanstack/react-router'
import { KnowledgeBaseDetailPage } from '@/features/knowledge'

interface KnowledgeBaseDetailSearch {
  docId?: string
}

export const Route = createFileRoute('/_authenticated/knowledge-base/$kbId')({
  validateSearch: (search: Record<string, unknown>): KnowledgeBaseDetailSearch => {
    return {
      docId: typeof search.docId === 'string' ? search.docId : undefined,
    }
  },
  component: KnowledgeBaseDetailRoute,
})

function KnowledgeBaseDetailRoute() {
  const { kbId } = Route.useParams()
  const { docId } = Route.useSearch()
  const navigate = useNavigate()

  const handleSelectDoc = (nextDocId: string | null) => {
    navigate({
      to: '/knowledge-base/$kbId',
      params: { kbId },
      search: nextDocId ? { docId: nextDocId } : {},
      replace: true,
    })
  }

  return (
    <KnowledgeBaseDetailPage
      kbId={kbId}
      selectedDocId={docId}
      onSelectDoc={handleSelectDoc}
    />
  )
}
