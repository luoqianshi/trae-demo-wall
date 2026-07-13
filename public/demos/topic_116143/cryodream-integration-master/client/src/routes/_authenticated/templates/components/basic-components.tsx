import { createFileRoute } from '@tanstack/react-router'
import BasicComponents from '../../../../features/templates/components/basic-components'

export const Route = createFileRoute('/_authenticated/templates/components/basic-components')({
  component: BasicComponentsRoute,
})

function BasicComponentsRoute() {
  return <BasicComponents />
}
