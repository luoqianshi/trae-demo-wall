import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Main } from '@/components/layout/main'

export const Route = createFileRoute('/_authenticated/knowledge-base')({
  component: KnowledgeBaseLayoutRoute,
})

function KnowledgeBaseLayoutRoute() {
  return (
    <Main fixed className="p-0">
      <Outlet />
    </Main>
  )
}
