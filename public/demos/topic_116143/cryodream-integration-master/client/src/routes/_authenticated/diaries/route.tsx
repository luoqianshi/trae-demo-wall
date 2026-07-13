import { Outlet, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/diaries')({
  component: DiariesLayoutRoute,
})

function DiariesLayoutRoute() {
  return (
    <div data-layout='fixed' className='flex h-svh w-full flex-col overflow-hidden bg-background'>
      <Outlet />
    </div>
  )
}
