import { createFileRoute } from '@tanstack/react-router'
import TopNavLayout from '../../../../features/templates/layout/top-nav-layout'

export const Route = createFileRoute('/_authenticated/templates/layout/top-nav-layout')({
  component: TopNavLayoutRoute,
})

function TopNavLayoutRoute() {
  return <TopNavLayout />
}
