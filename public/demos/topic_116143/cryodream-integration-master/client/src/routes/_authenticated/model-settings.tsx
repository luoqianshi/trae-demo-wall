import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ModelConfigPage } from '@/features/model-config'

export const Route = createFileRoute('/_authenticated/model-settings')({
  component: ModelSettingsRoute,
})

function ModelSettingsRoute() {
  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main fixed>
        <ModelConfigPage />
      </Main>
    </>
  )
}
