'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import { createPlan, generateAIPlan, createTask } from '../../../lib/api'
import {
  Sparkles,
  FileText,
  Calendar,
  Target,
  Loader2,
  Check,
  BookOpen,
  GraduationCap,
  FileText as FileTextIcon,
  Wand2,
  ChevronRight,
} from 'lucide-react'
import { PLAN_TEMPLATES, type PlanTemplate, setMilestones, type Milestone } from '../../../lib/plan-utils'

interface NewPlanModalProps {
  isOpen: boolean
  onClose: () => void
  onCreated?: () => void
}

export function NewPlanModal({ isOpen, onClose, onCreated }: NewPlanModalProps) {
  const router = useRouter()
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  // 默认截止日期：3个月后
  const defaultDeadline = new Date()
  defaultDeadline.setMonth(defaultDeadline.getMonth() + 3)
  const [deadline, setDeadline] = useState(defaultDeadline.toISOString().split('T')[0])
  const [totalWords, setTotalWords] = useState('')
  const [loading, setLoading] = useState(false)
  const [aiLoading, setAiLoading] = useState(false)
  const [showAIConfirm, setShowAIConfirm] = useState(false)
  const [showTemplateSelect, setShowTemplateSelect] = useState(false)
  const [showSmartBreakdown, setShowSmartBreakdown] = useState(false)
  const [aiPlan, setAiPlan] = useState<any>(null)
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(null)
  const [generatedTasks, setGeneratedTasks] = useState<string[]>([])

  // 弹窗关闭时重置表单
  function handleClose() {
    if (loading || aiLoading) return
    setTitle('')
    setDescription('')
    defaultDeadline.setMonth(new Date().getMonth() + 3)
    setDeadline(defaultDeadline.toISOString().split('T')[0])
    setTotalWords('')
    setShowAIConfirm(false)
    setShowTemplateSelect(false)
    setShowSmartBreakdown(false)
    setAiPlan(null)
    setSelectedTemplate(null)
    setGeneratedTasks([])
    onClose()
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    try {
      const plan = await createPlan({
        title,
        description,
        deadline,
        totalWords: parseInt(totalWords) || 0,
        status: 'active',
      })
      handleClose()
      onCreated?.()
      router.push(`/app/plans/${plan.id}`)
    } catch (error) {
      console.error('Failed to create plan:', error)
      alert('创建计划失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleAIGenerate() {
    if (!title || !deadline) {
      alert('请先填写标题和截止时间')
      return
    }
    setAiLoading(true)
    try {
      const plan = await generateAIPlan(title, deadline, description)
      setAiPlan(plan)
      setShowAIConfirm(true)
    } catch (error) {
      console.error('Failed to generate AI plan:', error)
      alert('AI 规划生成失败')
    } finally {
      setAiLoading(false)
    }
  }

  // Smart Breakdown: generate tasks without creating plan yet
  async function handleSmartBreakdown() {
    if (!title) {
      alert('请先填写论文标题')
      return
    }
    setAiLoading(true)
    try {
      const plan = await generateAIPlan(title, deadline, description)
      const tasks: string[] = []
      for (const phase of plan.phases) {
        for (const taskTitle of phase.tasks) {
          tasks.push(`${phase.name}：${taskTitle}`)
        }
      }
      setGeneratedTasks(tasks)
      setShowSmartBreakdown(true)
    } catch (error) {
      console.error('Failed to generate smart breakdown:', error)
      alert('AI 智能拆解失败')
    } finally {
      setAiLoading(false)
    }
  }

  async function handleAIConfirm() {
    setLoading(true)
    try {
      const plan = await createPlan({
        title,
        description,
        deadline,
        totalWords: parseInt(totalWords) || 0,
        status: 'active',
      })

      // Create tasks from AI plan
      let orderNum = 0
      for (const phase of aiPlan.phases) {
        for (const taskTitle of phase.tasks) {
          await createTask(plan.id, {
            title: `${phase.name}：${taskTitle}`,
            orderNum,
            status: 'pending',
          })
          orderNum++
        }
      }

      handleClose()
      onCreated?.()
      router.push(`/app/plans/${plan.id}`)
    } catch (error) {
      console.error('Failed to create plan with AI:', error)
      alert('创建计划失败')
    } finally {
      setLoading(false)
    }
  }

  // Create plan with selected template tasks and milestones
  async function handleCreateWithTemplate() {
    if (!selectedTemplate) return
    setLoading(true)
    try {
      const plan = await createPlan({
        title,
        description: description || selectedTemplate.description,
        deadline,
        totalWords: parseInt(totalWords) || 0,
        status: 'active',
      })

      // Create tasks from template
      for (let i = 0; i < selectedTemplate.tasks.length; i++) {
        await createTask(plan.id, {
          title: selectedTemplate.tasks[i],
          orderNum: i,
          status: 'pending',
        })
      }

      // Create milestones from template
      const milestones: Milestone[] = selectedTemplate.milestones.map((m, idx) => ({
        id: `ms_${Date.now()}_${idx}`,
        name: m.name,
        deadline: '',
        completed: false,
      }))
      setMilestones(plan.id, milestones)

      handleClose()
      onCreated?.()
      router.push(`/app/plans/${plan.id}`)
    } catch (error) {
      console.error('Failed to create plan with template:', error)
      alert('创建计划失败')
    } finally {
      setLoading(false)
    }
  }

  // Create plan with smart breakdown tasks
  async function handleCreateWithBreakdown() {
    if (generatedTasks.length === 0) return
    setLoading(true)
    try {
      const plan = await createPlan({
        title,
        description,
        deadline,
        totalWords: parseInt(totalWords) || 0,
        status: 'active',
      })

      for (let i = 0; i < generatedTasks.length; i++) {
        await createTask(plan.id, {
          title: generatedTasks[i],
          orderNum: i,
          status: 'pending',
        })
      }

      handleClose()
      onCreated?.()
      router.push(`/app/plans/${plan.id}`)
    } catch (error) {
      console.error('Failed to create plan with breakdown:', error)
      alert('创建计划失败')
    } finally {
      setLoading(false)
    }
  }

  // Template icons mapping
  const templateIcons: Record<string, React.ReactNode> = {
    bachelor: <BookOpen className="w-5 h-5" />,
    master: <GraduationCap className="w-5 h-5" />,
    journal: <FileTextIcon className="w-5 h-5" />,
  }

  return (
    <>
      {/* Main New Plan Modal */}
      <Modal
        isOpen={isOpen && !showAIConfirm && !showTemplateSelect && !showSmartBreakdown}
        onClose={handleClose}
        title="新建写作计划"
        size="lg"
      >
        <p className="text-sm text-[#8A7E74] mb-5">输入论文信息，选择模板或使用 AI 智能规划</p>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-[#5A5048] mb-1.5">
              <FileText className="w-4 h-4 inline mr-1" />
              论文标题
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="例如：深度学习在医学影像中的应用研究"
              required
              className="w-full px-4 py-3 rounded-lg border border-[#E5DDD4] bg-[#FAF8F5] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#5A5048] mb-1.5">
              论文描述
            </label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="简要描述论文的研究方向、目标和方法..."
              rows={3}
              className="w-full px-4 py-3 rounded-lg border border-[#E5DDD4] bg-[#FAF8F5] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#5A5048] mb-1.5">
                <Calendar className="w-4 h-4 inline mr-1" />
                截止时间
              </label>
              <input
                type="date"
                value={deadline}
                onChange={e => setDeadline(e.target.value)}
                required
                className="w-full px-4 py-3 rounded-lg border border-[#E5DDD4] bg-[#FAF8F5] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#5A5048] mb-1.5">
                <Target className="w-4 h-4 inline mr-1" />
                目标字数
              </label>
              <input
                type="number"
                value={totalWords}
                onChange={e => setTotalWords(e.target.value)}
                placeholder="例如：15000"
                className="w-full px-4 py-3 rounded-lg border border-[#E5DDD4] bg-[#FAF8F5] focus:outline-none focus:border-[#8B5E3C] focus:ring-2 focus:ring-[#8B5E3C]/20 text-sm"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-2">
            <div className="flex gap-3">
              <Button
                type="button"
                variant="secondary"
                onClick={handleSmartBreakdown}
                disabled={aiLoading}
                className="flex-1"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Wand2 className="w-4 h-4" />
                )}
                AI 智能拆解
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={() => setShowTemplateSelect(true)}
                className="flex-1"
              >
                <BookOpen className="w-4 h-4" />
                选择模板
              </Button>
            </div>
            <div className="flex gap-3">
              <Button
                type="button"
                variant="ghost"
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className="flex-1"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI 完整规划
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '创建中...' : '手动创建'}
              </Button>
            </div>
          </div>
        </form>
      </Modal>

      {/* Template Selection Modal */}
      <Modal
        isOpen={showTemplateSelect}
        onClose={() => setShowTemplateSelect(false)}
        title="选择论文模板"
        size="lg"
      >
        <p className="text-sm text-[#8A7E74] mb-5">
          选择适合你的论文类型，系统将自动填充建议任务和里程碑
        </p>
        <div className="space-y-3">
          {PLAN_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => setSelectedTemplate(template)}
              className={`w-full text-left p-4 rounded-xl border transition-all ${
                selectedTemplate?.id === template.id
                  ? 'border-[#8B5E3C] bg-[#F5EDE3]'
                  : 'border-[#E5DDD4] hover:border-[#C4A882] hover:bg-[#FAF8F5]'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#F5F0EB] flex items-center justify-center text-[#8B5E3C]">
                  {templateIcons[template.id]}
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold text-[#2C2420]">{template.name}</h4>
                  <p className="text-xs text-[#8A7E74]">{template.description}</p>
                </div>
                <div className="text-right text-xs text-[#8A7E74]">
                  <div>{template.tasks.length} 个任务</div>
                  <div>{template.milestones.length} 个里程碑</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#B5A99A]" />
              </div>

              {selectedTemplate?.id === template.id && (
                <div className="mt-3 pt-3 border-t border-[#E5DDD4]">
                  <p className="text-xs font-medium text-[#5A5048] mb-2">包含任务预览：</p>
                  <div className="flex flex-wrap gap-1.5">
                    {template.tasks.slice(0, 6).map((task, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 bg-white rounded-md text-xs text-[#5A5048] border border-[#E5DDD4]"
                      >
                        {task.length > 12 ? task.slice(0, 12) + '...' : task}
                      </span>
                    ))}
                    {template.tasks.length > 6 && (
                      <span className="px-2 py-0.5 text-xs text-[#8A7E74]">
                        +{template.tasks.length - 6} 更多
                      </span>
                    )}
                  </div>
                  <div className="mt-3 flex gap-3">
                    <Button
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCreateWithTemplate()
                      }}
                      disabled={loading}
                      className="flex-1"
                    >
                      {loading ? '创建中...' : '使用此模板'}
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedTemplate(null)
                      }}
                    >
                      取消
                    </Button>
                  </div>
                </div>
              )}
            </button>
          ))}
        </div>
      </Modal>

      {/* Smart Breakdown Modal */}
      <Modal
        isOpen={showSmartBreakdown}
        onClose={() => setShowSmartBreakdown(false)}
        title="AI 智能拆解结果"
        size="lg"
      >
        {generatedTasks.length > 0 && (
          <div className="space-y-4">
            <p className="text-sm text-[#8A7E74]">
              基于「{title}」，AI 为你拆解出以下写作任务：
            </p>
            <div className="max-h-[400px] overflow-y-auto space-y-2 pr-1">
              {generatedTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 bg-[#F5F0EB] rounded-lg"
                >
                  <span className="w-6 h-6 rounded-full bg-[#8B5E3C] text-white text-xs flex items-center justify-center flex-shrink-0">
                    {idx + 1}
                  </span>
                  <span className="text-sm text-[#5A5048]">{task}</span>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button
                onClick={handleCreateWithBreakdown}
                disabled={loading}
                className="flex-1"
              >
                {loading ? '创建中...' : '采用并创建计划'}
              </Button>
              <Button variant="secondary" onClick={() => setShowSmartBreakdown(false)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* AI Plan Confirmation Modal */}
      <Modal
        isOpen={showAIConfirm}
        onClose={() => setShowAIConfirm(false)}
        title="AI 生成的写作规划"
        size="lg"
      >
        {aiPlan && (
          <div className="space-y-4">
            <p className="text-sm text-[#8A7E74]">
              基于您的论文信息，AI 为您生成了以下写作路线：
            </p>
            <div className="space-y-3">
              {aiPlan.phases.map((phase: any, idx: number) => (
                <div key={idx} className="p-3 bg-[#F5F0EB] rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-[#2C2420]">{phase.name}</h4>
                    <span className="text-xs text-[#8A7E74]">{phase.duration} 天</span>
                  </div>
                  <ul className="space-y-1">
                    {phase.tasks.map((task: string, tidx: number) => (
                      <li key={tidx} className="text-sm text-[#5A5048] flex items-center gap-2">
                        <Check className="w-3 h-3 text-green-500" />
                        {task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <div className="flex gap-3 pt-2">
              <Button onClick={handleAIConfirm} disabled={loading} className="flex-1">
                {loading ? '创建中...' : '采用此规划'}
              </Button>
              <Button variant="secondary" onClick={() => setShowAIConfirm(false)}>
                取消
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </>
  )
}
