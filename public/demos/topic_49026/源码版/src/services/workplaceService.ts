import { chat } from '../lib/ai'
import {
  buildUpwardManagementPrompt,
  buildDecisionExtractionPrompt,
} from '../lib/prompts'
import { personRepository, memoryRepository } from '../repositories'
import type { Person, Memory } from '../types'

export interface WorkplaceOverviewStats {
  leaderSentiment: number
  coolConnectionsCount: number
  openCommitmentsCount: number
  pendingDecisionsCount: number
}

export interface WorkplacePerson {
  person: Person
  lastInteractionAt: number
  recentMemories: Memory[]
}

export interface CommitmentItem {
  id: string
  content: string
  who: string
  deadline: string | null
  direction: 'made-by-me' | 'made-to-me'
  memoryId: string
  confirmed: boolean
  tags: string[]
}

export interface DecisionItem {
  id: string
  topic: string
  description: string
  stakeholders: string[]
  urgency: 'high' | 'medium' | 'low'
  memoryId: string
}

const WORKPLACE_RELATIONSHIPS: Person['relationship'][] = [
  'colleague',
  'leader',
  'mentor',
  'subordinate',
  'client',
]
const LEADER_RELATIONSHIPS: Person['relationship'][] = ['leader']
const COOL_DAYS = 14
const COOL_SENTIMENT = 70

export const workplaceService = {
  async getOverviewStats(): Promise<WorkplaceOverviewStats> {
    const [people, memories] = await Promise.all([
      personRepository.getAll(),
      memoryRepository.getAll(),
    ])

    const leaders = people.filter((p) => LEADER_RELATIONSHIPS.includes(p.relationship))
    const leaderSentiment = leaders.length > 0
      ? Math.round(leaders.reduce((sum, p) => sum + p.sentiment, 0) / leaders.length)
      : 0

    const now = Date.now()
    const coolConnectionsCount = people.filter((p) => {
      if (!WORKPLACE_RELATIONSHIPS.includes(p.relationship)) return false
      const lastInteraction = p.interactionStats?.lastInteractionAt || p.updatedAt
      const daysSince = (now - lastInteraction) / (1000 * 60 * 60 * 24)
      return daysSince > COOL_DAYS && p.sentiment < COOL_SENTIMENT
    }).length

    const openCommitmentsCount = memories.filter(
      (m) => m.type === 'commitment' && !m.tags?.includes('done')
    ).length

    const pendingDecisions = await this.getPendingDecisions()

    return {
      leaderSentiment,
      coolConnectionsCount,
      openCommitmentsCount,
      pendingDecisionsCount: pendingDecisions.length,
    }
  },

  async getWorkplacePeople(): Promise<WorkplacePerson[]> {
    const people = await personRepository.getAll()
    const memories = await memoryRepository.getAll()

    return people
      .filter((p) => WORKPLACE_RELATIONSHIPS.includes(p.relationship))
      .map((p) => {
        const recentMemories = memories
          .filter((m) => m.relatedPersonIds?.includes(p.id))
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 5)
        return {
          person: p,
          lastInteractionAt: p.interactionStats?.lastInteractionAt || p.updatedAt,
          recentMemories,
        }
      })
      .sort((a, b) => a.lastInteractionAt - b.lastInteractionAt)
  },

  async getCoolConnections(daysThreshold = COOL_DAYS): Promise<WorkplacePerson[]> {
    const all = await this.getWorkplacePeople()
    const now = Date.now()
    return all.filter((wp) => {
      const daysSince = (now - wp.lastInteractionAt) / (1000 * 60 * 60 * 24)
      return daysSince > daysThreshold && wp.person.sentiment < COOL_SENTIMENT
    })
  },

  async generateUpwardAdvice(personId: string): Promise<{ weeklyReportTips: string; risk: string; quickAction: string } | null> {
    const person = await personRepository.getById(personId)
    if (!person) return null

    const memories = await memoryRepository.getAll()
    const relatedMemories = memories
      .filter((m) => m.relatedPersonIds?.includes(personId))
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 10)
      .map((m) => m.content)

    try {
      const response = await chat(
        [{ role: 'user', content: buildUpwardManagementPrompt({ leaderName: person.name, memories: relatedMemories }) }],
        { system: '你是职场沟通教练，只输出合法 JSON。' }
      )
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      return JSON.parse(cleanJson)
    } catch (e) {
      console.warn('[workplaceService] generateUpwardAdvice failed:', e)
      return null
    }
  },

  async getCommitments(filter?: 'made-by-me' | 'made-to-me'): Promise<CommitmentItem[]> {
    const memories = await memoryRepository.getAll()
    const commitmentMemories = memories.filter((m) => m.type === 'commitment')

    const items: CommitmentItem[] = commitmentMemories.map((m) => ({
      id: m.id,
      content: m.content,
      who: m.relatedPersonIds?.[0] || '未知',
      deadline: m.expiresAt
        ? new Date(m.expiresAt).toLocaleDateString('zh-CN')
        : null,
      direction: (m.tags?.includes('made-to-me') ? 'made-to-me' : 'made-by-me') as CommitmentItem['direction'],
      memoryId: m.id,
      confirmed: m.confirmed,
      tags: m.tags ?? [],
    }))

    if (filter) {
      return items.filter((i) => i.direction === filter)
    }
    return items
  },

  async getPendingDecisions(): Promise<DecisionItem[]> {
    const memories = await memoryRepository.getAll()
    const recentMemories = memories
      .filter((m) => m.createdAt > Date.now() - 30 * 24 * 60 * 60 * 1000)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, 20)

    if (recentMemories.length === 0) return []

    const text = recentMemories.map((m) => m.content).join('\n')

    try {
      const response = await chat(
        [{ role: 'user', content: buildDecisionExtractionPrompt(text) }],
        { system: '你是决策分析专家，只输出合法 JSON 数组。' }
      )
      const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      const parsed = JSON.parse(cleanJson)
      if (!Array.isArray(parsed)) return []

      return parsed.map((item: Record<string, unknown>, idx: number) => ({
        id: `decision-${idx}`,
        topic: String(item.topic || '未命名决策'),
        description: String(item.description || ''),
        stakeholders: Array.isArray(item.stakeholders) ? item.stakeholders.map(String) : [],
        urgency: (['high', 'medium', 'low'].includes(String(item.urgency)) ? String(item.urgency) : 'medium') as DecisionItem['urgency'],
        memoryId: recentMemories[idx]?.id || '',
      }))
    } catch (e) {
      console.warn('[workplaceService] getPendingDecisions failed:', e)
      return []
    }
  },
}
