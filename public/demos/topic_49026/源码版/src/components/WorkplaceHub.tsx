import { useEffect, useState } from 'react'
import { Briefcase, Users, CheckSquare, GitBranch } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { workplaceService, type WorkplaceOverviewStats } from '../services/workplaceService'
import { WorkplaceOverviewCards } from './WorkplaceOverviewCards'
import { UpwardManagementPanel } from './UpwardManagementPanel'
import { NetworkMaintenancePanel } from './NetworkMaintenancePanel'
import { CommitmentTrackerPanel } from './CommitmentTrackerPanel'
import { DecisionAdvisorPanel } from './DecisionAdvisorPanel'

type WorkplaceTab = 'upward' | 'network' | 'commitment' | 'decision'

const tabs: { key: WorkplaceTab; label: string; icon: React.ElementType }[] = [
  { key: 'upward', label: '向上管理', icon: Briefcase },
  { key: 'network', label: '人脉维护', icon: Users },
  { key: 'commitment', label: '承诺追踪', icon: CheckSquare },
  { key: 'decision', label: '决策建议', icon: GitBranch },
]

export function WorkplaceHub() {
  const [activeTab, setActiveTab] = useState<WorkplaceTab>('upward')
  const [stats, setStats] = useState<WorkplaceOverviewStats | null>(null)
  const [loading, setLoading] = useState(false)

  const loadPersons = useDataStore((s) => s.loadPersons)
  const loadMemories = useDataStore((s) => s.loadMemories)

  useEffect(() => {
    loadPersons()
    loadMemories()
  }, [loadPersons, loadMemories])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    workplaceService
      .getOverviewStats()
      .then((data) => {
        if (!cancelled) {
          setStats(data)
        }
      })
      .catch((err) => {
        console.error('[WorkplaceHub] getOverviewStats failed:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false)
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <div className="h-full flex flex-col overflow-y-auto">
      <div className="p-4 lg:p-6 space-y-5">
        <WorkplaceOverviewCards stats={stats} loading={loading} />

        <div className="flex gap-1 bg-canvas rounded-lg p-1">
          {tabs.map((tab) => {
          const Icon = tab.icon as React.ComponentType<{ className?: string }>
          const active = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded-md text-xs font-medium transition-colors ${
                active
                  ? 'bg-surface text-ink-primary shadow-sm'
                  : 'text-ink-tertiary hover:text-ink-secondary hover:bg-canvas-warm'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          )
        })}
        </div>

        <div className="flex-1 min-h-0">
          {activeTab === 'upward' && <UpwardManagementPanel />}
          {activeTab === 'network' && <NetworkMaintenancePanel />}
          {activeTab === 'commitment' && <CommitmentTrackerPanel />}
          {activeTab === 'decision' && <DecisionAdvisorPanel />}
        </div>
      </div>
    </div>
  )
}
