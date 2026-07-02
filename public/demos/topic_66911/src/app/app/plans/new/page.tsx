'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Card, CardContent } from '../../../../components/ui/Card'
import { Button } from '../../../../components/ui/Button'
import { Modal } from '../../../../components/ui/Modal'
import { createPlan, generateAIPlan, createTask } from '../../../../lib/api'
import { Sparkles, FileText, Calendar, Target, Loader2, Check, ArrowLeft } from 'lucide-react'

export default function NewPlanPage() {
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
  const [aiPlan, setAiPlan] = useState<any>(null)

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

      router.push(`/app/plans/${plan.id}`)
    } catch (error) {
      console.error('Failed to create plan with AI:', error)
      alert('创建计划失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl mx-auto min-h-screen">
      <div className="mb-6">
        <Link href="/app/plans" className="text-sm text-[#8A7E74] hover:text-[#8B5E3C] flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" />
          返回计划列表
        </Link>
        <h1 className="text-2xl font-bold text-[#2C2420]">新建写作计划</h1>
        <p className="text-[#8A7E74]">输入论文信息，AI 将为你生成完整的写作规划</p>
      </div>

      <Card>
        <CardContent>
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

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleAIGenerate}
                disabled={aiLoading}
                className="flex-1"
              >
                {aiLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                AI 智能规划
              </Button>
              <Button type="submit" disabled={loading} className="flex-1">
                {loading ? '创建中...' : '创建计划'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* AI Plan Confirmation Modal */}
      <Modal
        isOpen={showAIConfirm}
        onClose={() => setShowAIConfirm(false)}
        title="AI 生成的写作规划"
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
    </div>
  )
}
