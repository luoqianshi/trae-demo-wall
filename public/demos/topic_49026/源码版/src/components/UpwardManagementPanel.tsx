import { useEffect, useMemo, useState } from 'react'
import { Briefcase } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { useConversationStore } from '../stores/useConversationStore'
import { useUIStore } from '../stores/useUIStore'
import { workplaceService, type WorkplacePerson } from '../services/workplaceService'
import { WorkplacePersonCard } from './WorkplacePersonCard'
import { ActionSuggestionList } from './ActionSuggestionList'

interface AdviceItem {
  title: string
  description: string
}

export function UpwardManagementPanel() {
  const persons = useDataStore((s) => s.persons)
  const loadPersons = useDataStore((s) => s.loadPersons)

  const setInputText = useConversationStore((s) => s.setInputText)
  const setActiveNav = useUIStore((s) => s.setActiveNav)

  const [workplacePeople, setWorkplacePeople] = useState<WorkplacePerson[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [selectedLeaderId, setSelectedLeaderId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<AdviceItem[]>([])
  const [loadingAdvice, setLoadingAdvice] = useState(false)

  // 确保人物数据已加载
  useEffect(() => {
    loadPersons()
  }, [loadPersons])

  // 加载职场人物并筛选领导
  useEffect(() => {
    let cancelled = false
    setLoadingPeople(true)

    workplaceService
      .getWorkplacePeople()
      .then((people) => {
        if (cancelled) return
        const leaders = people.filter((wp) => wp.person.relationship === 'leader')
        setWorkplacePeople(leaders)

        // 默认选中第一个领导
        setSelectedLeaderId((prev) => {
          if (prev && leaders.some((l) => l.person.id === prev)) return prev
          return leaders.length > 0 ? leaders[0].person.id : null
        })
      })
      .catch((err) => {
        console.error('[UpwardManagementPanel] getWorkplacePeople failed:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPeople(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [persons])

  const selectedLeader = useMemo(
    () => workplacePeople.find((wp) => wp.person.id === selectedLeaderId) ?? null,
    [workplacePeople, selectedLeaderId]
  )

  // 选中领导变化时生成建议
  useEffect(() => {
    if (!selectedLeaderId) {
      setSuggestions([])
      return
    }

    let cancelled = false
    setLoadingAdvice(true)
    setSuggestions([])

    workplaceService
      .generateUpwardAdvice(selectedLeaderId)
      .then((advice) => {
        if (cancelled || !advice) return
        const items: AdviceItem[] = [
          { title: '周报技巧', description: advice.weeklyReportTips },
          { title: '风险提醒', description: advice.risk },
          { title: '快速行动', description: advice.quickAction },
        ].filter((item) => item.description && item.description.trim().length > 0)
        setSuggestions(items)
      })
      .catch((err) => {
        console.error('[UpwardManagementPanel] generateUpwardAdvice failed:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingAdvice(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedLeaderId])

  const handleApply = (text: string) => {
    setInputText(text)
    setActiveNav('对话')
  }

  if (loadingPeople) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-1 space-y-3">
          {[1, 2].map((i) => (
            <div key={i} className="bg-surface border border-ink-muted/10 rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-ink-muted/20 animate-pulse flex-shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 w-24 rounded bg-ink-muted/20 animate-pulse" />
                  <div className="h-3 w-full rounded bg-ink-muted/20 animate-pulse" />
                </div>
              </div>
            </div>
          ))}
        </div>
        <div className="lg:col-span-2">
          <ActionSuggestionList suggestions={[]} loading />
        </div>
      </div>
    )
  }

  if (workplacePeople.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-surface border border-ink-muted/10 rounded-xl">
        <div className="w-12 h-12 rounded-full bg-zen-terracotta/10 flex items-center justify-center mb-3">
          <Briefcase className="w-6 h-6 text-zen-terracotta" />
        </div>
        <p className="text-sm text-ink-secondary">暂无领导人物</p>
        <p className="text-2xs text-ink-tertiary mt-1 max-w-xs">
          在人物管理中将直属领导的关系类型设为「领导」，即可在这里获得向上管理建议
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 左栏：领导列表 */}
      <div className="lg:col-span-1 space-y-3">
        <div className="flex items-center justify-between px-1">
          <span className="text-xs font-medium text-ink-secondary">领导列表</span>
          <span className="text-2xs text-ink-tertiary">{workplacePeople.length} 人</span>
        </div>
        {workplacePeople.map((wp) => (
          <WorkplacePersonCard
            key={wp.person.id}
            person={wp.person}
            lastInteractionAt={wp.lastInteractionAt}
            onClick={() => setSelectedLeaderId(wp.person.id)}
          />
        ))}
      </div>

      {/* 右栏：向上管理建议 */}
      <div className="lg:col-span-2">
        {selectedLeader && (
          <div className="mb-3 px-1 flex items-center gap-2">
            <span className="text-xs font-medium text-ink-secondary">当前选中：</span>
            <span className="text-xs text-zen-terracotta font-medium">{selectedLeader.person.name}</span>
          </div>
        )}
        <ActionSuggestionList suggestions={suggestions} loading={loadingAdvice} onApply={handleApply} />
      </div>
    </div>
  )
}
