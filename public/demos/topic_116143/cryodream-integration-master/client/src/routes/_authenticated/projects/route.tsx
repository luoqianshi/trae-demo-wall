import { Outlet, createFileRoute } from '@tanstack/react-router'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'

export const Route = createFileRoute('/_authenticated/projects')({
  component: ProjectsLayoutRoute,
})

function ProjectsLayoutRoute() {
  return (
    <>
      <Header fixed>
        <Search />
      </Header>
      <Main fixed className="overflow-auto">
        <Outlet />
      </Main>
    </>
  )
}
