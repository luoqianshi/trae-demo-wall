import { useEffect, useState } from 'react'
import { db } from '../lib/db'
import type { AgentTask } from '../types'

export function AgentMetricsPanel({ onClose }: { onClose: () => void }) {
  const [tasks, setTasks] = useState<AgentTask[]>([])

  useEffect(() => {
    db.agentTasks.toArray().then(setTasks)
  }, [])

  const SAMPLE_TASKS: AgentTask[] = [
    { id: 'sample-1', agentId: 'memoryExtractor', status: 'completed', type: 'memory_extract', input: '提取用户消息中的记忆', subTaskIds: [], startedAt: Date.now() - 3000, completedAt: Date.now() },
    { id: 'sample-2', agentId: 'careerAdvisor', status: 'completed', type: 'analysis', input: '分析职场冲突', subTaskIds: [], startedAt: Date.now() - 2500, completedAt: Date.now() - 500 },
    { id: 'sample-3', agentId: 'relationshipCoach', status: 'completed', type: 'analysis', input: '分析关系影响', subTaskIds: [], startedAt: Date.now() - 2000, completedAt: Date.now() - 800 },
  ]

  const total = tasks.length
  const success = tasks.filter((t) => t.status === 'completed').length
  const avgLatency = total > 0
    ? tasks.reduce((s, t) => s + ((t.completedAt || 0) - (t.startedAt || 0)), 0) / total
    : 0

  const byAgent = tasks.reduce((acc, t) => {
    acc[t.agentId] = (acc[t.agentId] || 0) + 1
    return acc
  }, {} as Record<string, number>)

  if (tasks.length === 0) {
    return (
      <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl p-6 border border-ink-muted/20">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-medium text-ink-primary">Agent 数字劳动力看板</h2>
            <button onClick={onClose} className="text-xs px-2 py-1 rounded-lg hover:bg-canvas-warm">关闭</button>
          </div>
          <div className="text-center py-6">
            <p className="text-sm text-ink-secondary mb-2">暂无 Agent 任务记录</p>
            <p className="text-xs text-ink-tertiary mb-4">发送一条消息后，衡舟会调动多个 Agent 协作分析，这里将展示调用分布与耗时。</p>
            <div className="p-3 rounded-xl bg-canvas-warm text-left space-y-2">
              <p className="text-xs font-medium text-ink-secondary">示例：你发送「最近压力大」后</p>
              {SAMPLE_TASKS.map(t => (
                <div key={t.id} className="flex items-center justify-between text-xs">
                  <span className="text-ink-tertiary">{t.agentId}</span>
                  <span className="text-zen-terracotta">{t.completedAt && t.startedAt ? `${(t.completedAt - t.startedAt) / 1000}s` : '-'}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-surface rounded-2xl shadow-2xl p-6 border border-ink-muted/20">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-medium text-ink-primary">Agent 数字劳动力看板</h2>
          <button onClick={onClose} className="text-xs px-2 py-1 rounded-lg hover:bg-canvas-warm">关闭</button>
        </div>
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div className="p-3 rounded-xl bg-canvas-warm text-center">
            <p className="text-xl font-semibold text-ink-primary">{total}</p>
            <p className="text-xs text-ink-tertiary">总任务</p>
          </div>
          <div className="p-3 rounded-xl bg-canvas-warm text-center">
            <p className="text-xl font-semibold text-ink-primary">{success}</p>
            <p className="text-xs text-ink-tertiary">成功</p>
          </div>
          <div className="p-3 rounded-xl bg-canvas-warm text-center">
            <p className="text-xl font-semibold text-ink-primary">{avgLatency > 0 ? (avgLatency / 1000).toFixed(1) : '-'}</p>
            <p className="text-xs text-ink-tertiary">平均秒</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-medium text-ink-secondary">Agent 调用分布</p>
          {Object.entries(byAgent).map(([agentId, count]) => (
            <div key={agentId} className="flex items-center justify-between text-xs">
              <span className="text-ink-tertiary">{agentId}</span>
              <span className="font-medium text-ink-primary">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
