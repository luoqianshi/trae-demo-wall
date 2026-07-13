import { createFileRoute } from '@tanstack/react-router'
import StandardListLayout from '../../../../features/templates/layout/standard-list-layout'

export const Route = createFileRoute('/_authenticated/templates/layout/standard-list-layout')({
  component: StandardListLayoutRoute,
})

function StandardListLayoutRoute() {
  return <StandardListLayout />
}
