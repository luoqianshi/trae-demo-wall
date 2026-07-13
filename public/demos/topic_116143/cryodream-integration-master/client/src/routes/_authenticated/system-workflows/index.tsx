import { createFileRoute, Navigate } from '@tanstack/react-router'

export const Route = createFileRoute('/_authenticated/system-workflows/')({
  component: () => <Navigate to="/system-workflows/case-ingestion" />,
})
