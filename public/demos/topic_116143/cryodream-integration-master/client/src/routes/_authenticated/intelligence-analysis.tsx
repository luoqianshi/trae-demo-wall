import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { IntelligenceAnalysisPage } from '@/features/intelligence-analysis'

export const Route = createFileRoute('/_authenticated/intelligence-analysis')({
  component: IntelligenceAnalysisRoute,
})

function IntelligenceAnalysisRoute() {
  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main fixed>
        <IntelligenceAnalysisPage />
      </Main>
    </>
  )
}
