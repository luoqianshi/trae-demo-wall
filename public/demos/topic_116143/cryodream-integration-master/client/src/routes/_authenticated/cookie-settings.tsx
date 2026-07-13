import { createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { CookieSettingsPage } from '@/features/cookie-settings'

export const Route = createFileRoute('/_authenticated/cookie-settings')({
  component: CookieSettingsRoute,
})

function CookieSettingsRoute() {
  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main fixed>
        <CookieSettingsPage />
      </Main>
    </>
  )
}
