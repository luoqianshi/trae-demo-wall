import { createFileRoute } from '@tanstack/react-router'
import { DocumentListPage } from '@/features/documents/document-list-page'

export const Route = createFileRoute('/_authenticated/documents/')({
  component: DocumentListPage,
})
