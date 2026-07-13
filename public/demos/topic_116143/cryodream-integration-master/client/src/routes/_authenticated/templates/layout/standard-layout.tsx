import { createFileRoute } from '@tanstack/react-router'
import StandardLayout from '../../../../features/templates/layout/standard-layout'

export const Route = createFileRoute('/_authenticated/templates/layout/standard-layout')({
  component: StandardLayoutRoute,
})

function StandardLayoutRoute() {
  return <StandardLayout />
}
