import { createFileRoute } from '@tanstack/react-router'
import TabLayout from '../../../../features/templates/layout/tab-layout'

export const Route = createFileRoute('/_authenticated/templates/layout/tab-layout')({
  component: TabLayoutRoute,
})

function TabLayoutRoute() {
  return <TabLayout />
}
