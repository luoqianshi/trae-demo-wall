import { createFileRoute } from '@tanstack/react-router'
import { TemplatesLayout } from '../../../features/templates/templates-layout'

export const Route = createFileRoute('/_authenticated/templates/')({
  component: TemplatesIndex,
})

function TemplatesIndex() {
  return <TemplatesLayout />
}
