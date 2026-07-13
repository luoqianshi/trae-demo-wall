import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { TestDemoPage } from '@/features/test-demo'

export const Route = createFileRoute('/_authenticated/test-demo')({
  component: TestDemoRoute,
})

function TestDemoRoute() {
  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main fixed>
        <TestDemoPage />
      </Main>
    </>
  )
}
