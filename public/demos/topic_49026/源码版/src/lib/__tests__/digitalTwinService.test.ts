import { describe, it, expect, vi, beforeEach } from 'vitest'
import { chat } from '../ai'
import { tieredSearch } from '../vectorStore'
import { personRepository } from '../../repositories'
import { generateReplySuggestions, type ReplySuggestion } from '../../services/digitalTwinService'
import type { Person, PersonProfile } from '../../types'

vi.mock('../ai', () => ({
  chat: vi.fn(),
}))

vi.mock('../vectorStore', () => ({
  tieredSearch: vi.fn(),
}))

vi.mock('../../repositories', () => ({
  personRepository: {
    getById: vi.fn(),
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
    interactionStats: { totalCount: 0, lastInteractionAt: 0, avgSentiment: 50, topics: [] },
    createdAt: 0,
    updatedAt: 0,
    ...rest,
  }
}

describe('digitalTwinService', () => {
  const mockedChat = vi.mocked(chat)
  const mockedTieredSearch = vi.mocked(tieredSearch)
  const mockedGetById = vi.mocked(personRepository.getById)

  beforeEach(() => {
    vi.clearAllMocks()
    mockedTieredSearch.mockResolvedValue({ hot: [], warm: [], cold: [], summary: '' })
  })

  it('当对方人物不存在时降级使用fallback信息并调用chat', async () => {
    mockedGetById.mockResolvedValue(undefined)
    // chat 返回无效内容，使最终结果为空数组
    mockedChat.mockResolvedValue('')

    const result = await generateReplySuggestions('unknown-id', [
      { sender: '陈志远', content: '你好' },
    ])

    expect(result).toEqual([])
    expect(mockedGetById).toHaveBeenCalledWith('unknown-id')
    // 降级路径：人物不存在时仍创建fallback对象并调用chat
    expect(mockedChat).toHaveBeenCalled()
  })

  it('fallback-前缀ID跳过数据库查询直接降级', async () => {
    mockedChat.mockResolvedValue('')

    const result = await generateReplySuggestions('fallback-赵海明', [
      { sender: '我', content: '你好' },
    ], undefined, undefined, '赵海明')

    expect(result).toEqual([])
    // fallback- 前缀应跳过 getById 调用
    expect(mockedGetById).not.toHaveBeenCalled()
    expect(mockedChat).toHaveBeenCalled()
  })

  it('正常生成回复建议并解析为 JSON', async () => {
    const person = makePerson({ id: 'p1', name: '林晓薇', relationship: 'spouse' })
    mockedGetById.mockResolvedValue(person)

    mockedTieredSearch.mockResolvedValue({
      hot: [
        {
          sourceType: 'memory' as const,
          sourceId: 'm1',
          embedding: [],
          text: '林晓薇最近工作压力大',
          createdAt: Date.now(),
          similarity: 0.82,
          tier: 'hot' as const,
        },
      ],
      warm: [],
      cold: [],
      summary: '',
    })

    const suggestions: ReplySuggestion[] = [
      { text: '今天早点休息，别太累了。', tone: '关心', reason: '对方近期压力大，表达关心。' },
      { text: '需要我帮你做点什么吗？', tone: '体贴', reason: '主动提供帮助，符合配偶关系。' },
      { text: '周末我们出去走走放松一下？', tone: '轻松', reason: '用轻松提议缓解压力。' },
    ]
    mockedChat.mockResolvedValue(JSON.stringify(suggestions))

    const recentMessages = [
      { sender: '陈志远', content: '下班了吗？' },
      { sender: '林晓薇', content: '还没，今天事情特别多。' },
      { sender: '陈志远', content: '辛苦了，注意休息。' },
    ]

    const result = await generateReplySuggestions('p1', recentMessages, '我又要加班到很晚')

    expect(mockedGetById).toHaveBeenCalledWith('p1')
    expect(mockedTieredSearch).toHaveBeenCalled()
    expect(mockedChat).toHaveBeenCalled()

    const callArgs = mockedChat.mock.calls[0]
    expect(callArgs[0]).toHaveLength(1)
    expect(callArgs[0][0].role).toBe('user')
    expect(callArgs[0][0].content).toContain('林晓薇')
    expect(callArgs[0][0].content).toContain('我又要加班到很晚')
    expect(callArgs[1]).toHaveProperty('system')
    expect(typeof callArgs[1]!.system).toBe('string')

    expect(result).toHaveLength(3)
    expect(result[0]).toHaveProperty('text')
    expect(result[0]).toHaveProperty('tone')
    expect(result[0]).toHaveProperty('reason')
    expect(result.map(r => r.text)).toEqual(suggestions.map(s => s.text))
  })

  it('能处理带 markdown 代码块的 LLM 输出', async () => {
    const person = makePerson({ id: 'p2', name: '张伟' })
    mockedGetById.mockResolvedValue(person)

    const suggestions: ReplySuggestion[] = [
      { text: '好的，明天见。', tone: '简洁', reason: '结束对话，明确时间。' },
    ]
    mockedChat.mockResolvedValue(`\`\`\`json\n${JSON.stringify(suggestions)}\n\`\`\``)

    const result = await generateReplySuggestions('p2', [
      { sender: '陈志远', content: '明晚一起吃饭？' },
      { sender: '张伟', content: '好。' },
    ])

    expect(result).toHaveLength(1)
    expect(result[0].text).toBe('好的，明天见。')
  })
})
