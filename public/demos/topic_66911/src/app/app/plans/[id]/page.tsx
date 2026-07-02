'use client'

import { useEffect, useState, useRef } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '../../../../components/ui/Button'
import { Progress } from '../../../../components/ui/Progress'
import { BreadcrumbNav } from '../../../../components/ui/BreadcrumbNav'
import {
  getPlan as getPlanById,
  createTask,
  updateTask,
  deletePlan,
  type Plan,
  type Task,
} from '../../../../lib/api'
import { getDocuments, updateDocument } from '../../../../lib/editor-api'
import type { Document } from '../../../../lib/editor-types'
import { getMilestones, type Milestone } from '../../../../lib/plan-utils'
import { getAIConfig } from '../../../../lib/editor-api'
import { useToast } from '../../../../components/ui/Toast'
import {
  ArrowLeft,
  Calendar,
  Target,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Sparkles,
  AlertTriangle,
  Clock,
  BookOpen,
  FileText,
  BarChart3,
  Timer,
  Play,
  Pause,
  RotateCcw,
  Link2,
  X,
  TrendingUp,
} from 'lucide-react'

/* ==================== 番茄钟组件 ==================== */
function PomodoroTimer({
  taskId,
  taskTitle,
  onSessionComplete,
}: {
  taskId: string
  taskTitle: string
  onSessionComplete: (taskId: string, minutes: number) => void
}) {
  const DEFAULT_WORK = 25 * 60
  const DEFAULT_BREAK = 5 * 60

  const [workDuration, setWorkDuration] = useState(DEFAULT_WORK)
  const [breakDuration, setBreakDuration] = useState(DEFAULT_BREAK)
  const [timeLeft, setTimeLeft] = useState(DEFAULT_WORK)
  const [isRunning, setIsRunning] = useState(false)
  const [isBreak, setIsBreak] = useState(false)
  const [sessions, setSessions] = useState(0)
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const startTimer = () => {
    setIsRunning(true)
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!isBreak) {
            // 工作结束 -> 休息
            setSessions((s) => s + 1)
            onSessionComplete(taskId, workDuration / 60)
            setIsBreak(true)
            return breakDuration
          } else {
            // 休息结束 -> 停止
            setIsRunning(false)
            setIsBreak(false)
            return workDuration
          }
        }
        return prev - 1
      })
    }, 1000)
  }

  const pauseTimer = () => {
    setIsRunning(false)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
  }

  const resetTimer = () => {
    pauseTimer()
    setIsBreak(false)
    setTimeLeft(workDuration)
    setSessions(0)
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60)
    const s = seconds % 60
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
  }

  const progress = isBreak
    ? ((breakDuration - timeLeft) / breakDuration) * 100
    : ((workDuration - timeLeft) / workDuration) * 100

  return (
    <div className="p-3 bg-gradient-to-br from-red-50 to-orange-50 rounded-xl border border-red-100">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <Timer className="w-3.5 h-3.5 text-cinnabar" />
          <span className="text-xs font-medium text-ink">
            {isBreak ? '小憩' : '专注'} · {taskTitle}
          </span>
        </div>
        {sessions > 0 && (
          <span className="text-[10px] text-ink-muted">{sessions} 轮</span>
        )}
      </div>

      <div className="text-center mb-2">
        <span className={`text-2xl font-mono font-bold ${isBreak ? 'text-green-600' : 'text-cinnabar'}`}>
          {formatTime(timeLeft)}
        </span>
      </div>

      <Progress value={progress} className="h-1 mb-2" />

      <div className="flex items-center justify-center gap-2">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="p-1.5 bg-cinnabar text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <Play className="w-3.5 h-3.5" />
          </button>
        ) : (
          <button
            onClick={pauseTimer}
            className="p-1.5 bg-ochre text-white rounded-lg hover:bg-ink transition-colors"
          >
            <Pause className="w-3.5 h-3.5" />
          </button>
        )}
        <button
          onClick={resetTimer}
          className="p-1.5 bg-white border border-border rounded-lg text-ink-muted hover:text-ink transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 时长设置 */}
      <div className="flex items-center gap-2 mt-2 text-[10px] text-ink-muted justify-center">
        <span>专注</span>
        {[15, 25, 45].map((m) => (
          <button
            key={m}
            onClick={() => {
              if (!isRunning) {
                setWorkDuration(m * 60)
                if (!isBreak) setTimeLeft(m * 60)
              }
            }}
            className={`px-1.5 py-0.5 rounded ${workDuration === m * 60 ? 'bg-cinnabar/10 text-cinnabar font-medium' : 'hover:bg-paper-dark'}`}
          >
            {m}min
          </button>
        ))}
        <span className="mx-1">|</span>
        <span>休息</span>
        {[3, 5, 10].map((m) => (
          <button
            key={m}
            onClick={() => {
              if (!isRunning) {
                setBreakDuration(m * 60)
                if (isBreak) setTimeLeft(m * 60)
              }
            }}
            className={`px-1.5 py-0.5 rounded ${breakDuration === m * 60 ? 'bg-green-500/10 text-green-600 font-medium' : 'hover:bg-paper-dark'}`}
          >
            {m}min
          </button>
        ))}
      </div>
    </div>
  )
}

/* ==================== 警示通告组件 ==================== */
function GapWarning({
  plan,
  tasks,
  totalWrittenWords,
}: {
  plan: Plan
  tasks: Task[]
  totalWrittenWords: number
}) {
  const now = Date.now()
  const deadline = new Date(plan.deadline).getTime()
  const daysRemaining = Math.max(0, Math.ceil((deadline - now) / (1000 * 60 * 60 * 24)))
  const wordsRemaining = Math.max(0, plan.totalWords - totalWrittenWords)
  const dailyTarget = daysRemaining > 0 ? Math.ceil(wordsRemaining / daysRemaining) : wordsRemaining

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const taskProgress = tasks.length > 0 ? Math.round((completedTasks / tasks.length) * 100) : 0

  const riskLevel: 'low' | 'medium' | 'high' =
    daysRemaining <= 0 ? 'high' :
      daysRemaining <= 3 ? 'high' :
        dailyTarget > 2000 ? 'high' :
          daysRemaining <= 7 ? 'medium' :
            taskProgress < 30 ? 'medium' :
              'low'

  const riskConfig = {
    high: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', icon: 'text-red-500' },
    medium: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', icon: 'text-amber-500' },
    low: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', icon: 'text-green-500' },
  }

  const cfg = riskConfig[riskLevel]

  return (
    <div className={`${cfg.bg} border ${cfg.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${cfg.icon} mt-0.5`}>
          {riskLevel === 'high' ? (
            <AlertTriangle className="w-5 h-5" />
          ) : riskLevel === 'medium' ? (
            <Clock className="w-5 h-5" />
          ) : (
            <TrendingUp className="w-5 h-5" />
          )}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className={`text-sm font-semibold ${cfg.text}`}>
              {riskLevel === 'high'
                ? '急！目标差距警示'
                : riskLevel === 'medium'
                  ? '需关注进度'
                  : '进度良好'}
            </h3>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-3">
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <p className="text-[10px] text-ink-muted">剩余天数</p>
              <p className={`text-lg font-bold ${cfg.text}`}>{daysRemaining}</p>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <p className="text-[10px] text-ink-muted">待写字数</p>
              <p className={`text-lg font-bold ${cfg.text}`}>
                {wordsRemaining >= 10000
                  ? `${(wordsRemaining / 10000).toFixed(1)}万`
                  : wordsRemaining.toLocaleString()}
              </p>
            </div>
            <div className="bg-white/60 rounded-lg p-2 text-center">
              <p className="text-[10px] text-ink-muted">每日目标</p>
              <p className={`text-lg font-bold ${cfg.text}`}>
                {dailyTarget >= 10000
                  ? `${(dailyTarget / 10000).toFixed(1)}万`
                  : dailyTarget.toLocaleString()}
              </p>
            </div>
          </div>
          {riskLevel === 'high' && dailyTarget > 0 && (
            <p className={`mt-2 text-xs ${cfg.text}`}>
              按当前进度，每日需完成约 {dailyTarget.toLocaleString()} 字方能赶上截止日期。建议增加写作时间或拆分更多子任务。
            </p>
          )}
          {daysRemaining <= 0 && (
            <p className="mt-2 text-xs text-cinnabar font-medium">截止日期已过，请更新筹谋时限或调整任务优先级。</p>
          )}
        </div>
      </div>
    </div>
  )
}

/* ==================== 主页面 ==================== */
export default function PlanDetailPage() {
  const params = useParams()
  const router = useRouter()
  const planId = params.id as string
  const { success, error: toastError } = useToast()

  const [plan, setPlan] = useState<Plan | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [aiLoading, setAiLoading] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [newTaskTitle, setNewTaskTitle] = useState('')
  const [newTaskWords, setNewTaskWords] = useState(1000)
  const [activePomodoro, setActivePomodoro] = useState<string | null>(null)

  useEffect(() => {
    loadAll()
  }, [planId])

  async function loadAll() {
    setLoading(true)
    try {
      const planData = await getPlanById(planId)
      setPlan(planData)

      const tasksData = planData.tasks || []
      setTasks(tasksData)

      setMilestones(getMilestones(planId))

      // 加载关联文档
      try {
        const docs = await getDocuments()
        // 匹配：planId 关联 或 标题/内容关键词匹配
        const related = docs.filter((d) => {
          if (d.planId === planId) return true
          const keywords = planData.title.split(/[，,、\s]+/).filter((w: string) => w.length >= 2)
          const docText = `${d.title} ${(d.plainText || '').slice(0, 500)}`
          return keywords.some((kw: string) => docText.includes(kw))
        })
        setDocuments(related)

        // 自动检测任务完成
        autoCheckTaskCompletion(tasksData, related)
      } catch {
        setDocuments([])
      }
    } catch (e) {
      console.error('Failed to load plan:', e)
    } finally {
      setLoading(false)
    }
  }

  /* 自动检测任务完成 */
  function autoCheckTaskCompletion(currentTasks: Task[], docs: Document[]) {
    const allText = docs.map((d) => d.plainText || '').join(' ')
    const totalWords = allText.replace(/\s+/g, '').length
    let updated = false

    const updatedTasks = currentTasks.map((t) => {
      if (t.status === 'completed') return t
      // 检查任务关键词是否在文档中出现
      const keywords = t.title.split(/[，,、\s]+/).filter((w) => w.length >= 2)
      const keywordMatched = keywords.every((kw) => allText.includes(kw))
      // 或者文档总字数达到任务目标
      const wordsMet = t.targetWords > 0 && totalWords >= t.targetWords

      if (keywordMatched || wordsMet) {
        updated = true
        // 尝试更新服务端
        updateTask(t.id, { status: 'completed', completedWords: t.targetWords }).catch(() => { })
        return { ...t, status: 'completed' as const, completedWords: t.targetWords }
      }
      return t
    })

    if (updated) {
      setTasks(updatedTasks)
    }
  }

  /* 关联/解关联文档 */
  async function linkDocument(docId: string) {
    try {
      await updateDocument(docId, { planId })
      setDocuments((prev) =>
        prev.map((d) => (d.id === docId ? { ...d, planId } : d))
      )
      success('文稿已关联')
    } catch {
      toastError('关联失败')
    }
  }

  async function unlinkDocument(docId: string) {
    try {
      await updateDocument(docId, { planId: null })
      setDocuments((prev) => prev.filter((d) => d.id !== docId))
      success('关联已解除')
    } catch {
      toastError('解除失败')
    }
  }

  /* AI 智能拆解任务 */
  async function handleAITaskBreakdown() {
    if (!plan) return
    setAiLoading(true)
    try {
      const config = getAIConfig()
      if (!config) {
        toastError('请先配置智囊')
        return
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-config': JSON.stringify(config) },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `请将以下写作筹谋拆解为5-8个具体可执行的子任务。每个子任务格式为 "任务标题|目标字数|简要描述"：

筹谋标题：${plan.title}
筹谋描述：${plan.description || '无'}
总目标字数：${plan.totalWords}
截止日期：${plan.deadline}

请只输出任务列表，每行一个任务，格式严格为：任务标题|目标字数|简要描述，不要任何其他内容。`,
          }],
        }),
      })

      const text = await res.text()
      const raw = parseSSEStream(text)
      const lines = raw.split('\n').filter((l) => l.trim())

      for (let i = 0; i < lines.length; i++) {
        const parts = lines[i].split('|')
        if (parts.length >= 2) {
          const title = parts[0].trim()
          const targetWords = parseInt(parts[1]) || 1000
          const description = parts[2]?.trim() || ''
          try {
            await createTask(planId, {
              title,
              description,
              orderNum: tasks.length + i,
              targetWords,
              deadline: plan.deadline,
            })
          } catch { /* skip failed task */ }
        }
      }
      success(`已自动拆解 ${lines.length} 个任务`)
      loadAll()
    } catch (e: any) {
      toastError(e.message || 'AI 拆解失败')
    } finally {
      setAiLoading(false)
    }
  }

  /* 添加新任务 */
  async function handleAddTask() {
    if (!newTaskTitle.trim()) return
    try {
      await createTask(planId, {
        title: newTaskTitle.trim(),
        targetWords: newTaskWords,
        orderNum: tasks.length,
        deadline: plan?.deadline || '',
      })
      setNewTaskTitle('')
      setShowNewTask(false)
      loadAll()
      success('任务已添加')
    } catch {
      toastError('添加失败')
    }
  }

  /* 计算总字数 */
  const totalWrittenWords = documents.reduce((sum, d) => sum + (d.wordCount || 0), 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-ochre" />
      </div>
    )
  }

  if (!plan) {
    return (
      <div className="p-8">
        <BreadcrumbNav items={[{ label: '工作台', href: '/app' }, { label: '写作规划', href: '/app/plans' }]} />
        <div className="mt-8 text-center">
          <p className="text-ink-muted">计划不存在或已被删除</p>
          <Button variant="secondary" className="mt-4" onClick={() => router.push('/app/plans')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            返回计划列表
          </Button>
        </div>
      </div>
    )
  }

  const completedTasks = tasks.filter((t) => t.status === 'completed').length
  const wordProgress = plan.totalWords > 0 ? Math.min(100, Math.round((totalWrittenWords / plan.totalWords) * 100)) : 0

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <BreadcrumbNav items={[
        { label: '工作台', href: '/app' },
        { label: '写作规划', href: '/app/plans' },
        { label: plan.title },
      ]} />

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => router.push('/app/plans')}>
          <ArrowLeft className="w-4 h-4 mr-1" />
          返回
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            if (confirm('确定要删除此筹谋？')) {
              deletePlan(planId).then(() => router.push('/app/plans'))
            }
          }}
          className="text-cinnabar hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4 mr-1" />
          删除
        </Button>
      </div>

      <h1 className="text-2xl font-bold text-ink mt-4">{plan.title}</h1>
      <p className="text-ink-muted mt-2">{plan.description}</p>

      <div className="flex items-center gap-6 mt-4 text-sm text-ink-muted">
        <span className="flex items-center gap-1">
          <Calendar className="w-4 h-4" />
          截止：{new Date(plan.deadline).toLocaleDateString('zh-CN')}
        </span>
        <span className="flex items-center gap-1">
          <Target className="w-4 h-4" />
          任务：{completedTasks}/{tasks.length}
        </span>
        <span className="flex items-center gap-1">
          <BookOpen className="w-4 h-4" />
          字数：{totalWrittenWords.toLocaleString()}/{plan.totalWords.toLocaleString()}
        </span>
      </div>

      {/* 字数进度 */}
      <div className="mt-4">
        <div className="flex items-center justify-between text-xs text-ink-muted mb-1">
          <span>筹谋进度</span>
          <span>{wordProgress}%</span>
        </div>
        <Progress value={wordProgress} className="h-2" />
      </div>

      {/* ---- 警示通告 ---- */}
      <div className="mt-6">
        <GapWarning plan={plan} tasks={tasks} totalWrittenWords={totalWrittenWords} />
      </div>

      {/* 两栏布局 */}
      <div className="mt-6 grid grid-cols-3 gap-6">
        {/* 左栏 - 任务与里程碑 */}
        <div className="col-span-2 space-y-6">
          {/* 任务列表 */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-ink flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-ochre" />
                任务列表
              </h2>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={handleAITaskBreakdown}
                  disabled={aiLoading}
                >
                  <Sparkles className="w-3.5 h-3.5 mr-1" />
                  {aiLoading ? '拆解中...' : 'AI 拆解'}
                </Button>
                <Button variant="primary" size="sm" onClick={() => setShowNewTask(true)}>
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  添加
                </Button>
              </div>
            </div>

            {/* 新任务输入 */}
            {showNewTask && (
              <div className="mb-3 p-3 bg-paper border border-border rounded-xl flex items-center gap-3">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder="任务名称"
                  className="flex-1 px-3 py-1.5 text-sm bg-white border border-border rounded-lg text-ink focus:outline-none focus:border-ochre"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAddTask()
                    if (e.key === 'Escape') setShowNewTask(false)
                  }}
                  autoFocus
                />
                <input
                  type="number"
                  value={newTaskWords}
                  onChange={(e) => setNewTaskWords(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 text-sm bg-white border border-border rounded-lg text-ink focus:outline-none focus:border-ochre"
                  placeholder="字数"
                />
                <Button variant="primary" size="sm" onClick={handleAddTask}>确定</Button>
                <Button variant="ghost" size="sm" onClick={() => setShowNewTask(false)}>取消</Button>
              </div>
            )}

            {tasks.length === 0 ? (
              <p className="text-ink-muted text-sm py-8 text-center">暂无任务，点击"AI 拆解"自动生成</p>
            ) : (
              <div className="space-y-2">
                {tasks.map((task) => {
                  const isCompleted = task.status === 'completed'
                  const taskDocs = documents.filter((d) => {
                    const taskKeywords = task.title.split(/[，,、\s]+/).filter((w) => w.length >= 2)
                    const docText = `${d.title} ${(d.plainText || '').slice(0, 200)}`
                    return taskKeywords.some((kw) => docText.includes(kw))
                  })

                  return (
                    <div
                      key={task.id}
                      className={`p-3 rounded-xl border transition-colors ${isCompleted
                        ? 'bg-green-50 border-green-200'
                        : 'bg-white border-border hover:border-ochre/30'
                        }`}
                    >
                      <div className="flex items-start gap-3">
                        <button
                          onClick={async () => {
                            const newStatus = isCompleted ? 'pending' : 'completed'
                            const newWords = newStatus === 'completed' ? (task.targetWords || task.completedWords) : 0
                            try {
                              await updateTask(task.id, {
                                status: newStatus,
                                completedWords: newWords,
                              })
                              setTasks((prev) =>
                                prev.map((t) =>
                                  t.id === task.id
                                    ? { ...t, status: newStatus as 'pending' | 'completed', completedWords: newWords }
                                    : t
                                )
                              )
                            } catch { /* ignore */ }
                          }}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5 text-green-600" />
                          ) : (
                            <Circle className="w-5 h-5 text-ink-muted hover:text-ochre transition-colors" />
                          )}
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span
                              className={`text-sm font-medium ${isCompleted ? 'line-through text-ink-muted' : 'text-ink'
                                }`}
                            >
                              {task.title}
                            </span>
                            <div className="flex items-center gap-3 text-xs text-ink-muted">
                              <span>目标 {task.targetWords?.toLocaleString() || 0} 字</span>
                              {/* 番茄钟按钮 */}
                              <button
                                onClick={() =>
                                  setActivePomodoro(activePomodoro === task.id ? null : task.id)
                                }
                                className={`p-1 rounded-md transition-colors ${activePomodoro === task.id
                                  ? 'bg-cinnabar/10 text-cinnabar'
                                  : 'hover:bg-paper-dark'
                                  }`}
                                title="番茄钟"
                              >
                                <Timer className="w-3.5 h-3.5" />
                              </button>
                              {task.description && (
                                <span className="hidden sm:inline truncate max-w-[120px]">
                                  {task.description}
                                </span>
                              )}
                            </div>
                          </div>
                          {taskDocs.length > 0 && (
                            <div className="flex items-center gap-1 mt-1">
                              <FileText className="w-3 h-3 text-ink-light" />
                              <span className="text-[10px] text-ink-muted">
                                {taskDocs.map((d) => d.title).join('、')}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* 番茄钟展开 */}
                      {activePomodoro === task.id && (
                        <div className="mt-3">
                          <PomodoroTimer
                            taskId={task.id}
                            taskTitle={task.title}
                            onSessionComplete={(tid, minutes) => {
                              console.log(`Task ${tid}: completed ${minutes} minutes`)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* 里程碑 */}
          <div>
            <h2 className="text-lg font-semibold text-ink mb-4 flex items-center gap-2">
              <Target className="w-5 h-5 text-ochre" />
              里程碑
            </h2>
            {milestones.length === 0 ? (
              <p className="text-ink-muted text-sm py-4 text-center">暂无里程碑</p>
            ) : (
              <div className="space-y-2">
                {milestones.map((m) => (
                  <div
                    key={m.id}
                    className={`flex items-center gap-3 p-3 rounded-lg border ${m.completed ? 'bg-green-50 border-green-200' : 'bg-white border-border'
                      }`}
                  >
                    {m.completed ? (
                      <CheckCircle2 className="w-5 h-5 text-green-600" />
                    ) : (
                      <Circle className="w-5 h-5 text-ink-muted" />
                    )}
                    <span className={m.completed ? 'line-through text-ink-muted' : 'text-ink'}>
                      {m.name}
                    </span>
                    <span className="text-xs text-ink-muted ml-auto">
                      {new Date(m.deadline).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 右栏 - 关联文稿 */}
        <div className="space-y-4">
          <div className="bg-paper rounded-xl border border-border p-4">
            <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-ochre" />
              关联文稿
              <span className="text-[10px] text-ink-muted font-normal">
                ({documents.filter((d) => d.planId === planId).length} 直接关联)
              </span>
            </h3>

            {documents.length === 0 ? (
              <div className="text-center py-6">
                <Link2 className="w-8 h-8 text-ink-light mx-auto mb-2" />
                <p className="text-xs text-ink-muted mb-2">暂无关联文稿</p>
                <p className="text-[10px] text-ink-light">
                  从编辑器关联文稿，或在编辑器中选中文稿后关联此筹谋
                </p>
              </div>
            ) : (
              <div className="space-y-2 max-h-[400px] overflow-y-auto">
                {documents.map((doc) => (
                  <div
                    key={doc.id}
                    className="flex items-start gap-2 p-2 bg-white rounded-lg border border-border hover:border-ochre/30 transition-colors"
                  >
                    <FileText className="w-3.5 h-3.5 text-ink-muted mt-0.5 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-ink truncate">{doc.title}</p>
                      <p className="text-[10px] text-ink-muted">
                        {doc.wordCount?.toLocaleString() || 0} 字
                        {doc.planId !== planId && (
                          <span className="ml-1 text-ochre">(待关联)</span>
                        )}
                      </p>
                    </div>
                    {doc.planId === planId ? (
                      <button
                        onClick={() => unlinkDocument(doc.id)}
                        className="p-0.5 text-ink-light hover:text-cinnabar transition-colors"
                        title="解除关联"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => linkDocument(doc.id)}
                        className="p-0.5 text-ink-light hover:text-ochre transition-colors"
                        title="关联此文稿"
                      >
                        <Link2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 写作统计 */}
          {totalWrittenWords > 0 && documents.length > 0 && (
            <div className="bg-paper rounded-xl border border-border p-4">
              <h3 className="text-sm font-semibold text-ink mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-ochre" />
                写作统计
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-ink-muted">文稿数量</span>
                  <span className="text-ink font-medium">{documents.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">总字数</span>
                  <span className="text-ink font-medium">{totalWrittenWords.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">目标完成</span>
                  <span className="text-ink font-medium">{wordProgress}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-ink-muted">任务完成</span>
                  <span className="text-ink font-medium">
                    {completedTasks}/{tasks.length}
                    {tasks.length > 0 && ` (${Math.round((completedTasks / tasks.length) * 100)}%)`}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

/* 解析 SSE 流文本 */
function parseSSEStream(raw: string): string {
  const lines = raw.split('\n')
  let text = ''
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try { text += JSON.parse(payload).content || JSON.parse(payload) }
      catch { text += payload }
    }
  }
  return text || raw
}
