import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/novels')({
  component: NovelsLayoutRoute,
})

function NovelsLayoutRoute() {
  return (
    <div data-layout="fixed" className="flex h-svh w-full flex-col overflow-hidden bg-background">
      <Outlet />
    </div>
  )
}
