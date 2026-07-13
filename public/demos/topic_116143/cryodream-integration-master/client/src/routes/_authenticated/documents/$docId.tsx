import { createFileRoute } from '@tanstack/react-router'
import { DocumentEditPage } from '@/features/documents/document-edit-page'

export const Route = createFileRoute('/_authenticated/documents/$docId')({
  component: DocumentEditPage,
})
