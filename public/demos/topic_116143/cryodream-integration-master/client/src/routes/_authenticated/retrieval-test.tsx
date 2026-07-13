import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { RetrievalTestPage } from '@/features/retrieval-test'

export const Route = createFileRoute('/_authenticated/retrieval-test')({
  component: RetrievalTestRoute,
})

function RetrievalTestRoute() {
  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main fixed>
        <RetrievalTestPage />
      </Main>
    </>
  )
}
