import { createFileRoute } from '@tanstack/react-router'
import { TasksPage } from '@/features/task/TasksPage'

export const Route = createFileRoute('/_authenticated/tasks/')({
  component: TasksPage,
})
