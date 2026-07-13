import { useEffect } from 'react'
import { Activity, CheckCircle2, XCircle, Loader2, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Progress } from '@/components/ui/progress'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Badge } from '@/components/ui/badge'
import { useTaskStore } from '@/features/task/task-store'
import type { Task, TaskStatus } from '@/features/task/task-api'

const statusConfig: Record<TaskStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', label: '等待中' },
  running: { icon: Loader2, color: 'text-primary', label: '运行中' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: '已完成' },
  failed: { icon: XCircle, color: 'text-destructive', label: '失败' },
}

const categoryLabels: Record<string, string> = {
  knowledge_base: '知识库',
  workflow: '工作流',
}

function TaskItem({ task }: { task: Task }) {
  const config = statusConfig[task.status] || statusConfig.pending
  const Icon = config.icon

  return (
    <div className="flex items-start gap-3 rounded-md px-3 py-2 hover:bg-muted/50">
      <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${config.color} ${task.status === 'running' ? 'animate-spin' : ''}`} />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium truncate">{task.title}</span>
          <Badge variant="outline" className="text-[10px] px-1 py-0">
            {categoryLabels[task.category] || task.category}
          </Badge>
        </div>
        <div className="mt-1 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{config.label}</span>
          {task.status === 'running' && (
            <Progress value={task.progress} className="h-1.5 flex-1" />
          )}
          {task.status === 'failed' && task.errorMessage && (
            <span className="text-xs text-destructive truncate">{task.errorMessage}</span>
          )}
        </div>
      </div>
    </div>
  )
}

export function TaskIndicator() {
  const tasks = useTaskStore((s) => s.tasks)
  const fetchTasks = useTaskStore((s) => s.fetchTasks)
  const startPolling = useTaskStore((s) => s.startPolling)
  const stopPolling = useTaskStore((s) => s.stopPolling)

  const activeTasks = tasks.filter((t) => t.status === 'pending' || t.status === 'running')
  const hasActive = activeTasks.length > 0

  useEffect(() => {
    startPolling()
    return () => stopPolling()
  }, [startPolling, stopPolling])

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative h-8 w-8">
          <Activity className="h-4 w-4" />
          {hasActive && (
            <span className="absolute -right-0.5 -top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-primary text-[9px] font-bold text-primary-foreground">
              {activeTasks.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="border-b px-4 py-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold">任务</h4>
            {hasActive && (
              <Badge variant="secondary" className="text-xs">
                {activeTasks.length} 个运行中
              </Badge>
            )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {tasks.length === 0 ? (
            <div className="px-4 py-6 text-center text-sm text-muted-foreground">暂无任务</div>
          ) : (
            <div className="divide-y">
              {tasks.slice(0, 20).map((task) => (
                <TaskItem key={task.id} task={task} />
              ))}
            </div>
          )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
