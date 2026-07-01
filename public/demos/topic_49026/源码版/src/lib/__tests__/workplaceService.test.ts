import { describe, it, expect, vi, beforeEach } from 'vitest'
import { workplaceService } from '../../services/workplaceService'
import * as ai from '../../lib/ai'
import { personRepository, memoryRepository } from '../../repositories'
import type { Person, PersonProfile, Memory } from '../../types'

vi.mock('../../lib/ai', () => ({
  chat: vi.fn(),
}))

vi.mock('../../repositories', () => ({
  personRepository: {
    getAll: vi.fn(),
    getById: vi.fn(),
  },
  memoryRepository: {
    getAll: vi.fn(),
  },
}))

function createDefaultProfile(): PersonProfile {
  return {
    identity: {
      fullName: undefined,
      nicknames: [],
      gender: undefined,
      age: undefined,
      birthday: undefined,
      zodiac: undefined,
      hometown: undefined,
      currentCity: undefined,
    },
    career: {
      company: undefined,
      title: undefined,
      department: undefined,
      industry: undefined,
      workStyle: undefined,
      strengths: [],
      weaknesses: [],
      careerHistory: [],
    },
    personality: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      mbti: undefined,
      description: '',
    },
    preferences: {
      likes: [],
      dislikes: [],
      allergies: [],
      dietary: [],
      hobbies: [],
      communicationStyle: '',
    },
    values: {
      coreValues: [],
      motivations: [],
      fears: [],
      goals: [],
    },
    socialRole: {
      roleInMyLife: '',
      myRoleInTheirLife: '',
      powerDynamic: 'equal',
      trustLevel: 50,
      intimacyLevel: 50,
    },
    sharedExperiences: [],
  }
}

function makePerson(
  overrides: Partial<Omit<Person, 'profile'>> & { id: string; name: string } & { profile?: Partial<PersonProfile> }
): Person {
  const { profile: profileOverride, ...rest } = overrides
  const defaultProfile = createDefaultProfile()
  return {
    relationship: 'friend',
    sentiment: 50,
    sentimentHistory: [],
    profile: profileOverride
      ? {
          ...defaultProfile,
          ...profileOverride,
          identity: { ...defaultProfile.identity, ...profileOverride.identity },
        }
      : defaultProfile,
    timeline: [],
    connections: [],
    traits: [],
    tags: [],
    interactionStats: { totalCount: 0, lastInteractionAt: Date.now(), avgSentiment: 50, topics: [] },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    ...rest,
  }
}

function makeMemory(overrides: Partial<Memory> & { id: string }): Memory {
  return {
    type: 'event',
    content: '',
    source: 'test',
    confidence: 'high',
    confirmed: false,
    createdAt: Date.now(),
    tags: [],
    relatedPersonIds: [],
    relatedMemoryIds: [],
    ...overrides,
  }
}

describe('workplaceService', () => {
  const mockedChat = vi.mocked(ai.chat)
  const mockedGetAllPersons = vi.mocked(personRepository.getAll)
  const mockedGetAllMemories = vi.mocked(memoryRepository.getAll)
  const mockedGetPersonById = vi.mocked(personRepository.getById)

  beforeEach(() => {
    vi.clearAllMocks()
    mockedGetAllPersons.mockResolvedValue([])
    mockedGetAllMemories.mockResolvedValue([])
    mockedGetPersonById.mockResolvedValue(undefined)
    mockedChat.mockResolvedValue('[]')
  })

  it('getOverviewStats 计算领导关系温度', async () => {
    mockedGetAllPersons.mockResolvedValue([
      makePerson({ id: 'p1', name: '王总', relationship: 'leader', sentiment: 80 }),
    ])

    const stats = await workplaceService.getOverviewStats()
    expect(stats.leaderSentiment).toBe(80)
  })

  it('getCommitments 过滤承诺类型记忆', async () => {
    mockedGetAllMemories.mockResolvedValue([
      makeMemory({
        id: 'm1',
        type: 'commitment',
        content: '我答应王总周五前交方案',
        confirmed: false,
        relatedPersonIds: ['p1'],
      }),
    ])

    const commitments = await workplaceService.getCommitments()
    expect(commitments).toHaveLength(1)
    expect(commitments[0].content).toContain('周五前交方案')
    expect(commitments[0].direction).toBe('made-by-me')
  })

  it('getCommitments 按 direction 过滤', async () => {
    mockedGetAllMemories.mockResolvedValue([
      makeMemory({
        id: 'm1',
        type: 'commitment',
        content: '我答应王总周五前交方案',
        tags: [],
        relatedPersonIds: ['p1'],
      }),
      makeMemory({
        id: 'm2',
        type: 'commitment',
        content: '小李答应帮我改 PPT',
        tags: ['made-to-me'],
        relatedPersonIds: ['p2'],
      }),
    ])

    const madeByMe = await workplaceService.getCommitments('made-by-me')
    const madeToMe = await workplaceService.getCommitments('made-to-me')

    expect(madeByMe).toHaveLength(1)
    expect(madeToMe).toHaveLength(1)
    expect(madeByMe[0].content).toContain('我答应王总')
    expect(madeToMe[0].content).toContain('小李答应')
  })

  it('getCoolConnections 识别冷却人脉', async () => {
    const oldInteraction = Date.now() - 30 * 24 * 60 * 60 * 1000
    mockedGetAllPersons.mockResolvedValue([
      makePerson({
        id: 'p2',
        name: '张同事',
        relationship: 'colleague',
        sentiment: 50,
        interactionStats: { totalCount: 1, lastInteractionAt: oldInteraction, avgSentiment: 50, topics: [] },
      }),
    ])
    mockedGetAllMemories.mockResolvedValue([])

    const cool = await workplaceService.getCoolConnections()
    expect(cool).toHaveLength(1)
    expect(cool[0].person.name).toBe('张同事')
  })

  it('generateUpwardAdvice 解析 LLM 返回的 JSON', async () => {
    mockedGetPersonById.mockResolvedValue(
      makePerson({ id: 'p1', name: '王总', relationship: 'leader', sentiment: 80 })
    )
    mockedGetAllMemories.mockResolvedValue([
      makeMemory({ id: 'm1', type: 'event', content: '王总喜欢数据驱动的汇报', relatedPersonIds: ['p1'] }),
    ])
    mockedChat.mockResolvedValue(JSON.stringify({
      weeklyReportTips: '多用数据说话',
      risk: '汇报不够结构化',
      quickAction: '周五发送周报',
    }))

    const advice = await workplaceService.generateUpwardAdvice('p1')
    expect(advice).not.toBeNull()
    expect(advice?.weeklyReportTips).toContain('数据')
    expect(mockedChat).toHaveBeenCalled()
  })
})
