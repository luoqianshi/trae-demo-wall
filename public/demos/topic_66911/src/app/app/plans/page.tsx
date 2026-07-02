'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '../../../components/ui/Button'
import { getPlans, deletePlan, type Plan } from '../../../lib/api'
import { getMilestones, type Milestone } from '../../../lib/plan-utils'
import {
  Plus,
  Target,
  Trash2,
  TrendingUp,
  Calendar,
  CheckCircle2,
  Layers,
  Flag,
} from 'lucide-react'
import { NewPlanModal } from '../components/NewPlanModal'
import { useToast } from '../../../components/ui/Toast'

export default function PlansPage() {
  const { success, error: toastError } = useToast()
  const [plans, setPlans] = useState<Plan[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewPlanModal, setShowNewPlanModal] = useState(false)

  useEffect(() => { loadPlans() }, [])

  async function loadPlans() {
    try {
      const data = await getPlans()
      setPlans(data)
    } catch (error) {
      console.error('Failed to load plans:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '筹谋加载未果，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要除却此筹谋？')) return
    try {
      await deletePlan(id)
      loadPlans()
      success('筹谋已除')
    } catch (error) {
      console.error('Failed to delete plan:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '筹谋删除未果，请稍后重试')
    }
  }

  const activePlans = plans.filter(p => p.status === 'active')
  const completedPlans = plans.filter(p => p.status === 'completed')

  const totalPlans = plans.length
  const activeCount = activePlans.length
  const completedCount = completedPlans.length

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen paper-texture ink-wash">
      {/* Header */}
      <div className="flex items-end justify-between mb-2 animate-float-in">
        <div>
          <h1 className="font-display text-3xl text-ink tracking-wider">运筹帷幄</h1>
          <p className="font-serif text-ink-muted/40 mt-1 text-sm italic tracking-widest">
            千里之行，始于足下
          </p>
        </div>
        <button onClick={() => setShowNewPlanModal(true)} className="btn-primary">
          <Plus className="w-4 h-4" />
          <span>新建筹谋</span>
        </button>
      </div>

      {/* Decorative ink divider */}
      <div className="ink-divider my-6" />

      {/* Statistics - Horizontal layout with ink dividers */}
      {plans.length > 0 && (
        <div className="liquid-glass p-6 mb-8 animate-float-in" style={{ animationDelay: '80ms' }}>
          <div className="flex items-center">
            {/* Total */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-ochre/10 flex items-center justify-center flex-shrink-0">
                <Layers className="w-5 h-5 text-ochre" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-ochre">{totalPlans}</div>
                <div className="text-xs font-serif text-ink-muted mt-0.5">筹谋总数</div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-ink/15 to-transparent mx-6" />

            {/* Active */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-ochre">{activeCount}</div>
                <div className="text-xs font-serif text-ink-muted mt-0.5">进行中</div>
              </div>
            </div>

            {/* Divider */}
            <div className="w-px h-12 bg-gradient-to-b from-transparent via-ink/15 to-transparent mx-6" />

            {/* Completed */}
            <div className="flex items-center gap-4 flex-1">
              <div className="w-12 h-12 rounded-2xl bg-indigo/10 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-5 h-5 text-indigo" />
              </div>
              <div>
                <div className="text-2xl font-display font-bold text-ochre">{completedCount}</div>
                <div className="text-xs font-serif text-ink-muted mt-0.5">已完成</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Plans List */}
      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin w-8 h-8 border-2 border-ochre border-t-transparent rounded-full mx-auto" />
          <p className="font-serif text-ink-muted text-sm mt-4">筹谋载入中...</p>
        </div>
      ) : plans.length === 0 ? (
        <div className="liquid-glass p-12 text-center animate-float-in">
          <Target className="w-12 h-12 text-ink-light mx-auto mb-4" />
          <h3 className="font-display text-xl text-ink mb-2">尚无筹谋</h3>
          <p className="font-serif text-ink-muted/50 text-sm italic mb-6">不积跬步，无以至千里</p>
          <button onClick={() => setShowNewPlanModal(true)} className="btn-primary">
            <Plus className="w-4 h-4" />
            立第一个筹谋
          </button>
        </div>
      ) : (
        <div className="space-y-8">
          {/* Active Plans */}
          {activePlans.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-ochre rounded-full" />
                <h2 className="font-display text-lg text-ink tracking-wide">进行中</h2>
                <span className="font-serif text-xs text-ink-muted bg-ochre-bg px-2.5 py-0.5 rounded-full border border-ochre/20">
                  {activePlans.length}
                </span>
              </div>
              <div className="space-y-4">
                {activePlans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} index={i} onDelete={() => handleDelete(plan.id)} />
                ))}
              </div>
            </div>
          )}

          {/* Ink divider */}
          {activePlans.length > 0 && completedPlans.length > 0 && (
            <div className="ink-divider my-4" />
          )}

          {/* Completed Plans */}
          {completedPlans.length > 0 && (
            <div>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-1.5 h-6 bg-indigo rounded-full" />
                <h2 className="font-display text-lg text-ink tracking-wide">已毕</h2>
                <span className="font-serif text-xs text-ink-muted bg-indigo/10 px-2.5 py-0.5 rounded-full border border-indigo/20">
                  {completedPlans.length}
                </span>
              </div>
              <div className="space-y-4">
                {completedPlans.map((plan, i) => (
                  <PlanCard key={plan.id} plan={plan} index={i} onDelete={() => handleDelete(plan.id)} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
      <NewPlanModal
        isOpen={showNewPlanModal}
        onClose={() => setShowNewPlanModal(false)}
        onCreated={() => { loadPlans(); success('筹谋已立') }}
      />
    </div>
  )
}

function PlanCard({ plan, index, onDelete }: { plan: Plan; index: number; onDelete: () => void }) {
  const daysRemaining = Math.ceil((new Date(plan.deadline).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
  const completedTasks = plan.tasks?.filter(t => t.status === 'completed').length || 0
  const totalTasks = plan.tasks?.length || 0

  const [milestones, setMilestonesLocal] = useState<Milestone[]>([])
  useEffect(() => { setMilestonesLocal(getMilestones(plan.id)) }, [plan.id])

  const completedMilestones = milestones.filter(m => m.completed).length
  const totalMilestones = milestones.length

  const isUrgent = plan.status === 'active' && daysRemaining < 7 && daysRemaining >= 0

  // Build milestone positions along the progress bar
  const milestonePositions = totalMilestones > 0
    ? milestones.map((m, i) => ({
        position: ((i + 1) / totalMilestones) * 100,
        completed: m.completed,
      }))
    : []

  return (
    <div
      className={`liquid-glass liquid-glass-hover p-6 animate-float-in ${
        isUrgent ? 'border-cinnabar/30' : ''
      }`}
      style={{ animationDelay: `${Math.min(index * 60, 400)}ms` }}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1 min-w-0">
          <Link href={`/app/plans/${plan.id}`}>
            <h3 className="font-serif font-semibold text-ink text-lg hover:text-ochre transition-colors duration-200 leading-snug">
              {plan.title}
            </h3>
          </Link>
          <p className="font-serif text-sm text-ink-muted mt-1.5 leading-relaxed">{plan.description}</p>

          {/* Stats badges */}
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-border/50 font-serif text-xs text-ink-secondary">
              <Target className="w-3 h-3 text-ochre" />
              {completedTasks}/{totalTasks} 功课
            </span>
            {totalMilestones > 0 && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-border/50 font-serif text-xs text-ink-secondary">
                <Flag className="w-3 h-3 text-indigo" />
                {completedMilestones}/{totalMilestones} 里程碑
              </span>
            )}
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-white/50 backdrop-blur-sm rounded-full border border-border/50 font-serif text-xs text-ink-secondary">
              <Calendar className="w-3 h-3 text-ink-light" />
              {new Date(plan.deadline).toLocaleDateString('zh-CN')}
            </span>
            {plan.status === 'active' && daysRemaining < 14 && daysRemaining >= 0 && (
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-serif text-xs font-medium ${
                daysRemaining < 7
                  ? 'bg-cinnabar-bg text-cinnabar border border-cinnabar/20'
                  : 'bg-ochre-bg text-ochre border border-ochre/20'
              }`}>
                余 {daysRemaining} 日
              </span>
            )}
          </div>

          {/* Progress bar - ink scroll unfurling style */}
          <div className="mt-5">
            <div className="flex items-center justify-between mb-2">
              <span className="font-serif text-xs text-ink-muted">总进度</span>
              <span className="font-serif text-xs font-medium text-ink-secondary">{Math.round(plan.progress || 0)}%</span>
            </div>
            <div className="relative h-2.5 bg-white/50 backdrop-blur-sm rounded-full overflow-hidden border border-border/30">
              {/* Ink scroll gradient */}
              <div
                className="h-full rounded-full bg-gradient-to-r from-ochre/80 via-amber-400 to-amber-300 transition-all duration-700"
                style={{ width: `${plan.progress || 0}%` }}
              />
              {/* Milestone dots along progress bar */}
              {milestonePositions.map((mp, i) => (
                <div
                  key={i}
                  className="absolute top-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full border-2 transition-all duration-300"
                  style={{
                    left: `${mp.position}%`,
                    transform: `translateX(-50%) translateY(-50%)`,
                    backgroundColor: mp.completed ? '#C4A35A' : 'rgba(255,255,255,0.8)',
                    borderColor: mp.completed ? '#C4A35A' : 'rgba(138,126,116,0.3)',
                  }}
                />
              ))}
            </div>
          </div>

          {/* Milestone Progress */}
          {totalMilestones > 0 && (
            <div className="mt-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-serif text-xs text-ink-muted">里程碑</span>
                <span className="font-serif text-xs font-medium text-ink-secondary">
                  {Math.round((completedMilestones / totalMilestones) * 100)}%
                </span>
              </div>
              <div className="relative h-2.5 bg-white/50 backdrop-blur-sm rounded-full overflow-hidden border border-border/30">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-indigo/80 via-indigo to-ochre/80 transition-all duration-700"
                  style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Right side: status + actions */}
        <div className="flex flex-col items-end gap-3 ml-4 flex-shrink-0">
          {plan.status === 'active' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-50 text-green-600 rounded-full font-serif text-xs font-medium border border-green-100">
              <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
              进行中
            </span>
          )}
          {plan.status === 'completed' && (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-indigo/10 text-indigo rounded-full font-serif text-xs font-medium border border-indigo/20">
              <CheckCircle2 className="w-3 h-3" />
              已毕
            </span>
          )}
          <button onClick={onDelete} className="p-2 hover:bg-cinnabar-bg rounded-xl transition-all duration-200">
            <Trash2 className="w-4 h-4 text-cinnabar/60 hover:text-cinnabar transition-colors" />
          </button>
        </div>
      </div>
    </div>
  )
}
