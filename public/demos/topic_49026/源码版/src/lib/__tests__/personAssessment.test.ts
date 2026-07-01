import { describe, it, expect } from 'vitest'
import {
  assessNineObservations,
  assessEightSteps,
  assessPerson,
  buildSevenErrorsPrompt,
  SEVEN_ERRORS,
} from '../personAssessment'
import type { Person } from '../../types'

// 测试用人物数据
function makePerson(overrides?: Partial<Person>): Person {
  return {
    id: 'test-1',
    name: '张三',
    relationship: 'colleague',
    sentiment: 60,
    sentimentHistory: [],
    profile: {
      identity: {
        nicknames: ['老张'],
        age: 35,
        gender: 'male',
        hometown: '杭州',
        currentCity: '杭州',
      },
      career: {
        company: '云启科技',
        title: '产品经理',
        strengths: ['执行力强', '逻辑清晰'],
        weaknesses: ['不善表达'],
        careerHistory: [],
      },
      personality: {
        openness: 65,
        conscientiousness: 70,
        extraversion: 45,
        agreeableness: 55,
        neuroticism: 40,
        mbti: 'INTJ',
        description: '理性冷静，做事有条理',
      },
      preferences: {
        likes: ['阅读', '跑步'],
        dislikes: ['无效会议'],
        allergies: [],
        dietary: [],
        hobbies: ['围棋'],
        communicationStyle: '直接了当',
      },
      values: {
        coreValues: ['诚信', '效率'],
        motivations: ['成就感'],
        fears: ['被边缘化'],
        goals: ['晋升总监'],
      },
      socialRole: {
        roleInMyLife: '同事',
        myRoleInTheirLife: '同事',
        powerDynamic: 'equal',
        trustLevel: 60,
        intimacyLevel: 40,
      },
      sharedExperiences: [],
    },
    timeline: [
      { id: '1', timestamp: Date.now(), type: 'milestone', title: '入职', description: '张三入职', sentiment: 50, relatedMemoryIds: [] },
    ],
    connections: [],
    traits: ['靠谱'],
    tags: ['同事'],
    interactionStats: {
      totalCount: 10,
      lastInteractionAt: Date.now(),
      avgSentiment: 55,
      topics: ['工作', '项目'],
    },
    createdAt: Date.now(),
    updatedAt: Date.now(),
    isDemo: 0,
    ...overrides,
  }
}

describe('personAssessment - 九征分析', () => {
  it('应返回9个观察维度', () => {
    const person = makePerson()
    const dims = assessNineObservations(person)
    expect(dims).toHaveLength(9)
  })

  it('每个维度应有完整的结构', () => {
    const person = makePerson()
    const dims = assessNineObservations(person)
    for (const dim of dims) {
      expect(dim.key).toBeTruthy()
      expect(dim.name).toBeTruthy()
      expect(dim.modernName).toBeTruthy()
      expect(dim.score).toBeGreaterThanOrEqual(0)
      expect(dim.score).toBeLessThanOrEqual(100)
      expect(dim.analysis).toBeTruthy()
      expect(dim.evidence).toBeInstanceOf(Array)
    }
  })

  it('神（精神状态）分数应基于神经质和外向性', () => {
    const person = makePerson({
      profile: {
        ...makePerson().profile,
        personality: {
          ...makePerson().profile.personality,
          neuroticism: 20,
          extraversion: 80,
        },
      },
    })
    const dims = assessNineObservations(person)
    const spirit = dims.find(d => d.key === 'spirit')!
    expect(spirit.score).toBeGreaterThan(60)
  })

  it('高神经质的人精神状态分数应较低', () => {
    const person = makePerson({
      profile: {
        ...makePerson().profile,
        personality: {
          ...makePerson().profile.personality,
          neuroticism: 80,
          extraversion: 30,
        },
      },
    })
    const dims = assessNineObservations(person)
    const spirit = dims.find(d => d.key === 'spirit')!
    expect(spirit.score).toBeLessThan(50)
  })

  it('筋（执行力）应考虑职业优势', () => {
    const personWithStrengths = makePerson()
    const personWithoutStrengths = makePerson({
      profile: {
        ...makePerson().profile,
        career: {
          ...makePerson().profile.career,
          strengths: [],
        },
      },
    })
    const dims1 = assessNineObservations(personWithStrengths)
    const dims2 = assessNineObservations(personWithoutStrengths)
    const tendon1 = dims1.find(d => d.key === 'tendon')!
    const tendon2 = dims2.find(d => d.key === 'tendon')!
    expect(tendon1.score).toBeGreaterThan(tendon2.score)
  })
})

describe('personAssessment - 八观评估', () => {
  it('应返回8个评估步骤', () => {
    const person = makePerson()
    const steps = assessEightSteps(person)
    expect(steps).toHaveLength(8)
  })

  it('每个步骤应有完整的结构', () => {
    const person = makePerson()
    const steps = assessEightSteps(person)
    for (const step of steps) {
      expect(step.key).toBeTruthy()
      expect(step.name).toBeTruthy()
      expect(step.modernName).toBeTruthy()
      expect(step.result).toBeTruthy()
      expect(step.suggestion).toBeTruthy()
    }
  })

  it('观其夺救应反映神经质水平', () => {
    const stable = makePerson({
      profile: {
        ...makePerson().profile,
        personality: { ...makePerson().profile.personality, neuroticism: 30 },
      },
    })
    const sensitive = makePerson({
      profile: {
        ...makePerson().profile,
        personality: { ...makePerson().profile.personality, neuroticism: 80 },
      },
    })
    const steps1 = assessEightSteps(stable)
    const steps2 = assessEightSteps(sensitive)
    const crisis1 = steps1.find(s => s.key === 'crisis')!
    const crisis2 = steps2.find(s => s.key === 'crisis')!
    expect(crisis1.result).toContain('冷静')
    expect(crisis2.result).toContain('慌乱')
  })

  it('观其所短应包含职业弱点', () => {
    const person = makePerson()
    const steps = assessEightSteps(person)
    const weakness = steps.find(s => s.key === 'weakness')!
    expect(weakness.result).toContain('不善表达')
  })

  it('观其情机应包含恐惧和反感', () => {
    const person = makePerson()
    const steps = assessEightSteps(person)
    const emotional = steps.find(s => s.key === 'emotional')!
    expect(emotional.result).toContain('被边缘化')
    expect(emotional.result).toContain('无效会议')
  })
})

describe('personAssessment - 综合评价', () => {
  it('应返回完整的评估结果', () => {
    const person = makePerson()
    const result = assessPerson(person)
    expect(result.personId).toBe('test-1')
    expect(result.personName).toBe('张三')
    expect(result.overallScore).toBeGreaterThanOrEqual(0)
    expect(result.overallScore).toBeLessThanOrEqual(100)
    expect(result.nineObservations).toHaveLength(9)
    expect(result.eightSteps).toHaveLength(8)
    expect(result.summary).toBeTruthy()
    expect(result.strengths).toBeInstanceOf(Array)
    expect(result.weaknesses).toBeInstanceOf(Array)
    expect(result.communicationTips).toBeInstanceOf(Array)
    expect(result.compatibility).toBeTruthy()
  })

  it('高尽责性的人应有更多优势', () => {
    const person = makePerson({
      profile: {
        ...makePerson().profile,
        personality: {
          ...makePerson().profile.personality,
          conscientiousness: 90,
          neuroticism: 20,
        },
      },
    })
    const result = assessPerson(person)
    expect(result.strengths.length).toBeGreaterThan(0)
  })

  it('高神经质的人应有沟通建议提醒', () => {
    const person = makePerson({
      profile: {
        ...makePerson().profile,
        personality: {
          ...makePerson().profile.personality,
          neuroticism: 75,
        },
      },
    })
    const result = assessPerson(person)
    expect(result.communicationTips.some(t => t.includes('情绪敏感'))).toBe(true)
  })

  it('低关系温度应建议先建立信任', () => {
    const person = makePerson({ sentiment: 25 })
    const result = assessPerson(person)
    expect(result.compatibility).toContain('先通过小事建立信任')
  })

  it('高关系温度应允许坦诚交流', () => {
    const person = makePerson({ sentiment: 80 })
    const result = assessPerson(person)
    expect(result.compatibility).toContain('坦诚交流')
  })

  it('summary应包含最高和最低维度', () => {
    const person = makePerson()
    const result = assessPerson(person)
    expect(result.summary).toContain('张三')
    expect(result.summary).toMatch(/突出|强/)
    expect(result.summary).toMatch(/加强|弱|待/)
  })
})

describe('personAssessment - 七谬警示', () => {
  it('应有7种偏差', () => {
    expect(SEVEN_ERRORS).toHaveLength(7)
  })

  it('每种偏差应有完整结构', () => {
    for (const err of SEVEN_ERRORS) {
      expect(err.id).toBeTruthy()
      expect(err.name).toBeTruthy()
      expect(err.desc).toBeTruthy()
      expect(err.warning).toBeTruthy()
    }
  })

  it('buildSevenErrorsPrompt应生成提示文本', () => {
    const prompt = buildSevenErrorsPrompt()
    expect(prompt).toContain('七谬警示')
    expect(prompt).toContain('察容有色')
    expect(prompt).toContain('以己度人')
  })
})
