import { useEffect, useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { useConversationStore } from '../stores/useConversationStore'
import { useUIStore } from '../stores/useUIStore'
import { workplaceService, type WorkplacePerson } from '../services/workplaceService'
import { generateReplySuggestions, type ReplySuggestion } from '../services'
import { getUserProfile } from '../lib/prompts'
import { WorkplacePersonCard } from './WorkplacePersonCard'
import { ActionSuggestionList } from './ActionSuggestionList'
import type { Memory } from '../types'

interface SuggestionItem {
  title: string
  description: string
}

const COOL_DAYS = 14
const COOL_SENTIMENT = 70

function getCurrentUserName(): string {
  try {
    const profile = getUserProfile()
    const match = profile.match(/姓名[：:]\s*(\S+)/)
    return match?.[1]?.trim() || '我'
  } catch {
    return '我'
  }
}

function isCoolConnection(wp: WorkplacePerson): boolean {
  const now = Date.now()
  const daysSince = (now - wp.lastInteractionAt) / (1000 * 60 * 60 * 24)
  return daysSince > COOL_DAYS && wp.person.sentiment < COOL_SENTIMENT
}

function buildRecentMessages(
  personName: string,
  recentMemories: Memory[]
): { sender: string; content: string }[] {
  const myName = getCurrentUserName()
  return recentMemories
    .filter((m) => m.content && m.content.trim().length > 0)
    .map((m) => ({
      sender: m.source?.includes('wechat-import') ? personName : myName,
      content: m.content.trim(),
    }))
    .reverse()
}

function mapReplyToSuggestion(reply: ReplySuggestion): SuggestionItem {
  const descriptionParts: string[] = []
  if (reply.tone) descriptionParts.push(`语气：${reply.tone}`)
  if (reply.reason) descriptionParts.push(reply.reason)
  return {
    title: reply.text,
    description: descriptionParts.join(' · '),
  }
}

export function NetworkMaintenancePanel() {
  const persons = useDataStore((s) => s.persons)
  const memories = useDataStore((s) => s.memories)
  const loadPersons = useDataStore((s) => s.loadPersons)
  const loadMemories = useDataStore((s) => s.loadMemories)

  const setInputText = useConversationStore((s) => s.setInputText)
  const setActiveNav = useUIStore((s) => s.setActiveNav)

  const [workplacePeople, setWorkplacePeople] = useState<WorkplacePerson[]>([])
  const [loadingPeople, setLoadingPeople] = useState(false)
  const [selectedPersonId, setSelectedPersonId] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  // 确保人物和记忆数据已加载
  useEffect(() => {
    loadPersons()
    loadMemories()
  }, [loadPersons, loadMemories])

  // 加载职场人脉并拆分为冷却/全部两组
  useEffect(() => {
    let cancelled = false
    setLoadingPeople(true)

    workplaceService
      .getWorkplacePeople()
      .then((people) => {
        if (cancelled) return
        setWorkplacePeople(people)

        setSelectedPersonId((prev) => {
          if (prev && people.some((wp) => wp.person.id === prev)) return prev
          const firstCool = people.find((wp) => isCoolConnection(wp))
          return firstCool ? firstCool.person.id : people.length > 0 ? people[0].person.id : null
        })
      })
      .catch((err) => {
        console.error('[NetworkMaintenancePanel] getWorkplacePeople failed:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingPeople(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [persons, memories])

  const coolConnections = useMemo(
    () => workplacePeople.filter((wp) => isCoolConnection(wp)),
    [workplacePeople]
  )

  const warmConnections = useMemo(
    () => workplacePeople.filter((wp) => !isCoolConnection(wp)),
    [workplacePeople]
  )

  const selectedPerson = useMemo(
    () => workplacePeople.find((wp) => wp.person.id === selectedPersonId) ?? null,
    [workplacePeople, selectedPersonId]
  )

  // 选中人物变化时生成重启对话建议
  useEffect(() => {
    if (!selectedPersonId || !selectedPerson) {
      setSuggestions([])
      return
    }

    let cancelled = false
    setLoadingSuggestions(true)
    setSuggestions([])

    const recentMessages = buildRecentMessages(
      selectedPerson.person.name,
      selectedPerson.recentMemories
    )

    generateReplySuggestions(selectedPersonId, recentMessages)
      .then((replies) => {
        if (cancelled) return
        setSuggestions(replies.map(mapReplyToSuggestion))
      })
      .catch((err) => {
        console.error('[NetworkMaintenancePanel] generateReplySuggestions failed:', err)
      })
      .finally(() => {
        if (!cancelled) {
          setLoadingSuggestions(false)
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedPersonId, selectedPerson])

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
          <Users className="w-6 h-6 text-zen-terracotta" />
        </div>
        <p className="text-sm text-ink-secondary">暂无职场人脉</p>
        <p className="text-2xs text-ink-tertiary mt-1 max-w-xs">
          在人物管理中将联系人关系类型设为同事、领导、导师、下属或客户，即可在这里维护人脉
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
      {/* 左栏：人脉列表 */}
      <div className="lg:col-span-1 space-y-5">
        {/* 冷却人脉 */}
        {coolConnections.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between px-1">
              <span className="text-xs font-medium text-ink-secondary">冷却人脉（需主动联系）</span>
              <span className="text-2xs text-ink-tertiary">{coolConnections.length} 人</span>
            </div>
            {coolConnections.map((wp) => (
              <WorkplacePersonCard
                key={wp.person.id}
                person={wp.person}
                lastInteractionAt={wp.lastInteractionAt}
                onClick={() => setSelectedPersonId(wp.person.id)}
              />
            ))}
          </div>
        )}

        {/* 全部职场人脉 */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-medium text-ink-secondary">全部职场人脉</span>
            <span className="text-2xs text-ink-tertiary">{workplacePeople.length} 人</span>
          </div>
          {warmConnections.map((wp) => (
            <WorkplacePersonCard
              key={wp.person.id}
              person={wp.person}
              lastInteractionAt={wp.lastInteractionAt}
              onClick={() => setSelectedPersonId(wp.person.id)}
            />
          ))}
        </div>
      </div>

      {/* 右栏：重启对话建议 */}
      <div className="lg:col-span-2">
        {selectedPerson && (
          <div className="mb-3 px-1 flex items-center gap-2">
            <span className="text-xs font-medium text-ink-secondary">当前选中：</span>
            <span className="text-xs text-zen-terracotta font-medium">{selectedPerson.person.name}</span>
          </div>
        )}
        <ActionSuggestionList
          suggestions={suggestions}
          loading={loadingSuggestions}
          onApply={handleApply}
          title="重启对话建议"
          emptyHint="选择一位职场人脉后可生成重启对话建议"
        />
      </div>
    </div>
  )
}
