import { useEffect, useState, useCallback, Fragment } from 'react'
import { Activity, CheckCircle2, XCircle, Loader2, Clock, RefreshCw, ChevronRight, Zap, Globe, Brain, Database, Link2, SkipForward, Circle } from 'lucide-react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Separator } from '@/components/ui/separator'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'
import { taskApi, type Task, type TaskStatus, type TaskResult, type TaskStepLog } from '@/features/task/task-api'

const STATUS_CONFIG: Record<TaskStatus, { icon: React.ElementType; color: string; label: string }> = {
  pending: { icon: Clock, color: 'text-muted-foreground', label: '等待中' },
  running: { icon: Loader2, color: 'text-primary', label: '运行中' },
  completed: { icon: CheckCircle2, color: 'text-green-500', label: '已完成' },
  failed: { icon: XCircle, color: 'text-destructive', label: '失败' },
}

const CATEGORY_LABELS: Record<string, string> = {
  knowledge_base: '知识库',
  workflow: '工作流',
}

const TYPE_LABELS: Record<string, string> = {
  cognitive_ingest: '认知级 RAG 入库',
  tiered_ingest: '分级 RAG 入库',
  standard_ingest: '普通 RAG 入库',
  basic_ingest: '基础入库',
  thinking_model_ingest: '思维模型入库',
  web_ingest: '网页解析入库',
  file_ingest: '文件解析入库',
}

// 提取方案中文名
const VIA_LABELS: Record<string, string> = {
  'jsoup-readability': 'jsoup 本地提取',
  'jina-reader': 'Jina Reader',
  'scrapling': 'Scrapling 爬虫',
  'upstream': '上游已成功·短路跳过',
}

// 引擎中文名
const ENGINE_LABELS: Record<string, string> = {
  graph: '工作流图驱动',
  fallback: '兜底责任链',
}

// 根据节点类型选图标
function nodeIcon(nodeType: string): React.ElementType {
  if (nodeType === 'URLInput') return Link2
  if (nodeType.startsWith('WebFetch')) return Globe
  if (nodeType === 'SaveToKnowledgeBase') return Database
  if (nodeType.includes('Metadata') || nodeType.includes('Chunk')) return Brain
  return Circle
}

const STATUS_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '全部状态' },
  { value: 'running', label: '运行中' },
  { value: 'pending', label: '等待中' },
  { value: 'completed', label: '已完成' },
  { value: 'failed', label: '失败' },
]

const CATEGORY_FILTERS: { value: string; label: string }[] = [
  { value: 'all', label: '全部分类' },
  { value: 'knowledge_base', label: '知识库' },
  { value: 'workflow', label: '工作流' },
]

function formatTime(time?: string): string {
  if (!time) return '-'
  const date = new Date(time)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('zh-CN', { hour12: false })
}

function formatElapsed(ms?: number): string {
  if (ms == null) return '-'
  if (ms < 1000) return `${ms}ms`
  return `${(ms / 1000).toFixed(2)}s`
}

function parseResult(result?: string): TaskResult | null {
  if (!result) return null
  try {
    return JSON.parse(result) as TaskResult
  } catch {
    return null
  }
}

function StatusBadge({ status }: { status: TaskStatus }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.pending
  const Icon = config.icon
  return (
    <span className={`inline-flex items-center gap-1.5 text-sm ${config.color}`}>
      <Icon className={`h-3.5 w-3.5 ${status === 'running' ? 'animate-spin' : ''}`} />
      {config.label}
    </span>
  )
}

// 单个节点步骤的视觉：左侧状态圆点 + 竖线，右侧节点信息卡
function StepNode({ step, isLast }: { step: TaskStepLog; isLast: boolean }) {
  const Icon = nodeIcon(step.nodeType)
  const failed = step.status === 'FAILED'
  const skipped = step.via === 'upstream'
  const dotColor = failed
    ? 'bg-destructive border-destructive'
    : skipped
    ? 'bg-muted-foreground/40 border-muted-foreground/40'
    : 'bg-green-500 border-green-500'

  return (
    <div className="relative flex gap-3 pb-3 last:pb-0">
      {/* 时间线竖线 */}
      {!isLast && (
        <div className="absolute left-[7px] top-4 h-full w-px bg-gradient-to-b from-border to-transparent" />
      )}
      {/* 状态圆点 */}
      <div className={`relative z-10 mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full border-2 ${dotColor}`}>
        {failed && <XCircle className="h-2 w-2 text-white" />}
      </div>
      {/* 节点信息 */}
      <div className="flex min-w-0 flex-1 items-center gap-2 rounded-md border bg-card/50 px-2.5 py-1.5 transition-colors hover:bg-accent/40">
        <Icon className={`h-3.5 w-3.5 shrink-0 ${failed ? 'text-destructive' : skipped ? 'text-muted-foreground' : 'text-primary'}`} />
        <span className="shrink-0 text-xs font-medium">{step.nodeName}</span>
        {skipped ? (
          <Badge variant="outline" className="shrink-0 gap-1 border-amber-500/40 px-1 py-0 text-[10px] text-amber-600 dark:text-amber-400">
            <SkipForward className="h-2.5 w-2.5" />
            短路跳过
          </Badge>
        ) : step.via ? (
          <Badge variant="outline" className="shrink-0 gap-1 border-primary/30 px-1 py-0 text-[10px] text-primary">
            <Zap className="h-2.5 w-2.5" />
            {VIA_LABELS[step.via] || step.via}
          </Badge>
        ) : null}
        {failed && step.errorMessage && (
          <span className="min-w-0 flex-1 truncate text-[10px] text-destructive" title={step.errorMessage}>
            {step.errorMessage}
          </span>
        )}
        <span className="ml-auto shrink-0 font-mono text-[10px] text-muted-foreground">
          {formatElapsed(step.elapsedMs)}
        </span>
      </div>
    </div>
  )
}

// 任务展开后的详情面板：引擎信息 + 节点时间线
function TaskDetailPanel({ task }: { task: Task }) {
  const result = parseResult(task.result)
  const steps = result?.steps || []

  return (
    <div className="space-y-3 rounded-lg border bg-muted/30 p-4">
      {/* 概要徽章 */}
      <div className="flex flex-wrap items-center gap-2">
        {result?.engine && (
          <Badge className="gap-1 bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 dark:text-indigo-400">
            <Activity className="h-3 w-3" />
            {ENGINE_LABELS[result.engine] || result.engine}
          </Badge>
        )}
        {result?.workflowTemplateId && (
          <Badge variant="outline" className="gap-1 font-mono text-[10px]">
            <Brain className="h-3 w-3" />
            {result.workflowTemplateId}
          </Badge>
        )}
        {result?.via && VIA_LABELS[result.via] && (
          <Badge variant="outline" className="gap-1 text-[10px] text-primary">
            <Zap className="h-3 w-3" />
            命中：{VIA_LABELS[result.via] || result.via}
          </Badge>
        )}
        {result?.documentId && (
          <Badge variant="outline" className="gap-1 font-mono text-[10px] text-muted-foreground">
            <Database className="h-3 w-3" />
            doc: {result.documentId.slice(0, 8)}…
          </Badge>
        )}
      </div>

      {/* 节点时间线 */}
      {steps.length > 0 ? (
        <div>
          <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
            <Activity className="h-3.5 w-3.5" />
            节点执行时间线 · 共 {steps.length} 步
          </div>
          <div className="pl-1">
            {steps.map((step, idx) => (
              <StepNode key={idx} step={step} isLast={idx === steps.length - 1} />
            ))}
          </div>
        </div>
      ) : task.errorMessage ? (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-xs text-destructive">
          {task.errorMessage}
        </div>
      ) : (
        <div className="text-xs text-muted-foreground">暂无节点级日志</div>
      )}
    </div>
  )
}

export function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const loadTasks = useCallback(async () => {
    setLoading(true)
    try {
      const params: { category?: string; status?: string } = {}
      if (statusFilter !== 'all') params.status = statusFilter
      if (categoryFilter !== 'all') params.category = categoryFilter
      const data = await taskApi.list(params)
      setTasks(data)
    } catch {
      setTasks([])
    } finally {
      setLoading(false)
    }
  }, [statusFilter, categoryFilter])

  useEffect(() => {
    loadTasks()
  }, [loadTasks])

  // 存在运行中的任务时，每 3 秒自动刷新
  useEffect(() => {
    const hasActive = tasks.some((t) => t.status === 'pending' || t.status === 'running')
    if (!hasActive) return
    const timer = setInterval(loadTasks, 3000)
    return () => clearInterval(timer)
  }, [tasks, loadTasks])

  const activeCount = tasks.filter((t) => t.status === 'pending' || t.status === 'running').length

  return (
    <>
      <Header>
        <Search />
      </Header>

      <Main fixed>
        <div className='flex items-center justify-between gap-2'>
          <div>
            <h1 className='flex items-center gap-2 text-2xl font-bold tracking-tight'>
              <Activity className='h-6 w-6' />
              任务
            </h1>
            <p className='text-muted-foreground'>
              查看知识库入库等后台任务的执行状态与进度
            </p>
          </div>
          <Button variant='outline' size='sm' onClick={loadTasks} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
        </div>

        <div className='my-4 flex flex-wrap items-center gap-3'>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className='w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUS_FILTERS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className='w-36'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORY_FILTERS.map((item) => (
                <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {activeCount > 0 && (
            <Badge variant='secondary' className='text-xs'>
              {activeCount} 个运行中
            </Badge>
          )}
        </div>

        <Separator className='shadow-sm' />

        <div className='mt-4 flex-1 overflow-auto rounded-md border'>
          <Table>
            <TableHeader className='sticky top-0 bg-background'>
              <TableRow>
                <TableHead className='w-[40px]'></TableHead>
                <TableHead className='w-[240px]'>任务标题</TableHead>
                <TableHead className='w-[140px]'>类型</TableHead>
                <TableHead className='w-[90px]'>分类</TableHead>
                <TableHead className='w-[110px]'>状态</TableHead>
                <TableHead className='w-[180px]'>进度</TableHead>
                <TableHead className='w-[170px]'>创建时间</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {tasks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className='h-32 text-center text-muted-foreground'>
                    {loading ? '加载中...' : '暂无任务'}
                  </TableCell>
                </TableRow>
              ) : (
                tasks.map((task) => {
                  const expanded = expandedId === task.id
                  const hasDetail = !!task.result || !!task.errorMessage
                  return (
                  <Fragment key={task.id}>
                  <TableRow
                    className={`${hasDetail ? 'cursor-pointer' : ''} ${expanded ? 'bg-accent/30' : ''}`}
                    onClick={() => { if (hasDetail) setExpandedId(expanded ? null : task.id) }}
                  >
                    <TableCell>
                      {hasDetail && (
                        <ChevronRight className={`h-4 w-4 text-muted-foreground transition-transform ${expanded ? 'rotate-90' : ''}`} />
                      )}
                    </TableCell>
                    <TableCell className='font-medium'>
                      <div className='max-w-[220px] truncate' title={task.title}>{task.title}</div>
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {TYPE_LABELS[task.type] || task.type}
                    </TableCell>
                    <TableCell>
                      <Badge variant='outline' className='text-[10px] px-1 py-0'>
                        {CATEGORY_LABELS[task.category] || task.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {task.status === 'failed' && task.errorMessage ? (
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span className='cursor-help'><StatusBadge status={task.status} /></span>
                          </TooltipTrigger>
                          <TooltipContent className='max-w-xs break-words'>{task.errorMessage}</TooltipContent>
                        </Tooltip>
                      ) : (
                        <StatusBadge status={task.status} />
                      )}
                    </TableCell>
                    <TableCell>
                      {task.status === 'running' || task.status === 'pending' ? (
                        <div className='flex items-center gap-2'>
                          <Progress value={task.progress} className='h-1.5 flex-1' />
                          <span className='w-9 text-right text-xs text-muted-foreground'>{task.progress}%</span>
                        </div>
                      ) : task.status === 'completed' ? (
                        <span className='text-xs text-green-500'>100%</span>
                      ) : (
                        <span className='truncate text-xs text-destructive' title={task.errorMessage}>
                          {task.errorMessage || '执行失败'}
                        </span>
                      )}
                    </TableCell>
                    <TableCell className='text-sm text-muted-foreground'>
                      {formatTime(task.createTime)}
                    </TableCell>
                  </TableRow>
                  {expanded && (
                    <TableRow className='hover:bg-transparent'>
                      <TableCell colSpan={7} className='p-3'>
                        <TaskDetailPanel task={task} />
                      </TableCell>
                    </TableRow>
                  )}
                  </Fragment>
                  )
                })
              )}
            </TableBody>
          </Table>
        </div>
      </Main>
    </>
  )
}
