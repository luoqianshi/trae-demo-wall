/**
 * 社交智能引擎单元测试
 *
 * 测试覆盖：
 * 1. 差序格局引擎 — 圈层计算和策略匹配
 * 2. 面子评估引擎 — 风险等级和策略选择
 * 3. 人情账本引擎 — 记录提取和余额计算
 * 4. 六情机检测 — 负面情绪触发器
 * 5. 高语境理解 — 话外音识别
 * 6. 国情合规引擎 — 规则校验
 * 7. 回复校验管线 — 综合校验
 */

import { describe, it, expect } from 'vitest'
import {
  calculateSocialCircle,
  getCircleStrategy,
  assessFaceRisk,
  selectFaceStrategy,
  extractFavorRecords,
  calculateFavorBalance,
  detectNegativeTriggers,
  detectHighContextSignals,
  buildSocialIntelligenceContext,
} from '../socialIntelligence'
import { checkCulturalCompliance, buildCulturalGuardPrompt, getAllRules } from '../culturalGuard'
import { validateReply, buildRevisionPrompt } from '../replyValidator'
import type { Person, Memory } from '../../types'

// ============================================================
// 测试数据
// ============================================================

function makePerson(overrides: Partial<Person> = {}): Person {
  return {
    id: 'test-1',
    name: '测试人物',
    relationship: 'friend',
    sentiment: 50,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
    connections: [],
    ...overrides,
  } as Person
}

function makeMemory(content: string, overrides: Partial<Memory> = {}): Memory {
  return {
    id: 'm-test-' + Math.random(),
    content,
    type: 'other',
    createdAt: Date.now(),
    confidence: 'medium',
    tags: [],
    source: 'conversation',
    ...overrides,
  } as unknown as Memory
}

// ============================================================
// 1. 差序格局引擎测试
// ============================================================

describe('差序格局引擎', () => {
  it('配偶应归为核心圈', () => {
    const person = makePerson({ relationship: 'spouse', sentiment: 80 })
    expect(calculateSocialCircle(person)).toBe('core')
  })

  it('家人应归为核心圈', () => {
    const person = makePerson({ relationship: 'family', sentiment: 50 })
    expect(calculateSocialCircle(person)).toBe('core')
  })

  it('低温度家人应降级为熟人圈', () => {
    const person = makePerson({ relationship: 'family', sentiment: 10 })
    expect(calculateSocialCircle(person)).toBe('familiar')
  })

  it('高温度朋友应升级为亲密圈', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 70 })
    expect(calculateSocialCircle(person)).toBe('intimate')
  })

  it('普通朋友应为熟人圈', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 40 })
    expect(calculateSocialCircle(person)).toBe('familiar')
  })

  it('领导应为工具圈', () => {
    const person = makePerson({ relationship: 'leader', sentiment: 30 })
    expect(calculateSocialCircle(person)).toBe('instrumental')
  })

  it('客户应为工具圈', () => {
    const person = makePerson({ relationship: 'client', sentiment: 20 })
    expect(calculateSocialCircle(person)).toBe('instrumental')
  })

  it('核心圈策略应有高直接度', () => {
    const strategy = getCircleStrategy('core')
    expect(strategy.directness).toBeGreaterThan(0.8)
    expect(strategy.faceSensitivity).toBeLessThan(0.3)
  })

  it('工具圈策略应有低直接度和高面子敏感度', () => {
    const strategy = getCircleStrategy('instrumental')
    expect(strategy.directness).toBeLessThan(0.3)
    expect(strategy.faceSensitivity).toBeGreaterThan(0.8)
  })

  it('边缘圈应有禁忌话题', () => {
    const strategy = getCircleStrategy('peripheral')
    expect(strategy.tabooTopics.length).toBeGreaterThan(0)
  })
})

// ============================================================
// 2. 面子评估引擎测试
// ============================================================

describe('面子评估引擎', () => {
  it('对核心圈家人的温和回复应无面子风险', () => {
    const person = makePerson({ relationship: 'spouse', sentiment: 80 })
    const risk = assessFaceRisk('今天辛苦了，早点休息', person, '今天好累')
    expect(risk).toBe('none')
  })

  it('对工具圈领导的批评性回复应有高面子风险', () => {
    const person = makePerson({ relationship: 'leader', sentiment: 30 })
    const risk = assessFaceRisk('你这样做不对，你应该换种方式', person, '领导让我改方案')
    expect(['medium', 'high']).toContain(risk)
  })

  it('对工具圈领导的命令性回复应有高面子风险', () => {
    const person = makePerson({ relationship: 'leader', sentiment: 30 })
    const risk = assessFaceRisk('你必须先跟团队沟通再决定', person, '领导让我改方案')
    expect(['medium', 'high']).toContain(risk)
  })

  it('空话安慰应增加面子风险', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 50 })
    const risk = assessFaceRisk('别担心，一切都会好的', person, '我最近压力很大')
    expect(['low', 'medium', 'high']).toContain(risk)
  })

  it('对方情绪低落时应增加面子风险', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 50 })
    const risk = assessFaceRisk('你这样做不对', person, '我今天心情不好')
    expect(['medium', 'high']).toContain(risk)
  })

  it('对方情绪激动时应选择沉默支持策略', () => {
    const strategy = selectFaceStrategy('high', 'intimate', '我非常生气')
    expect(strategy).toBe('silent_support')
  })

  it('无风险时应选择直接策略', () => {
    const strategy = selectFaceStrategy('none', 'core', '今天怎么样')
    expect(strategy).toBe('direct')
  })

  it('中高风险对工具圈应选择间接策略', () => {
    const strategy = selectFaceStrategy('high', 'instrumental', '工作上的事')
    expect(strategy).toBe('indirect')
  })
})

// ============================================================
// 3. 人情账本引擎测试
// ============================================================

describe('人情账本引擎', () => {
  it('应从记忆中提取收到的人情', () => {
    const person = makePerson({ id: 'p1', name: '张三' })
    const memories = [
      makeMemory('张三帮我办了户口迁移的事'),
      makeMemory('今天天气不错'),
    ]
    const records = extractFavorRecords(memories, [person])
    expect(records.length).toBeGreaterThan(0)
    expect(records[0].type).toBe('received')
    expect(records[0].personName).toBe('张三')
  })

  it('应从记忆中提取介绍类人情', () => {
    const person = makePerson({ id: 'p1', name: '李四' })
    const memories = [
      makeMemory('李四介绍认识了一个投资人'),
    ]
    const records = extractFavorRecords(memories, [person])
    expect(records.length).toBeGreaterThan(0)
    expect(records[0].category).toBe('introduction')
  })

  it('应正确计算人情余额', () => {
    const records = [
      { personId: 'p1', personName: '张三', type: 'received' as const, category: 'material' as const, description: '帮了我', weight: 5, date: '2026-01-01', repaid: false },
      { personId: 'p1', personName: '张三', type: 'given' as const, category: 'material' as const, description: '我帮了', weight: 3, date: '2026-02-01', repaid: false },
    ]
    const balances = calculateFavorBalance(records)
    expect(balances[0].balance).toBe(-2) // -5 + 3 = -2（我欠对方2分）
    expect(balances[0].suggestion).toContain('欠')
  })

  it('人情平衡时应提示基本平衡', () => {
    const records = [
      { personId: 'p1', personName: '张三', type: 'received' as const, category: 'material' as const, description: '帮了我', weight: 3, date: '2026-01-01', repaid: false },
      { personId: 'p1', personName: '张三', type: 'given' as const, category: 'material' as const, description: '我帮了', weight: 3, date: '2026-02-01', repaid: false },
    ]
    const balances = calculateFavorBalance(records)
    expect(balances[0].suggestion).toContain('平衡')
  })
})

// ============================================================
// 4. 六情机检测测试
// ============================================================

describe('六情机检测', () => {
  it('应检测自夸倾向', () => {
    const triggers = detectNegativeTriggers('我比你做得好多了')
    expect(triggers.length).toBeGreaterThan(0)
    expect(triggers[0]).toContain('自伐')
  })

  it('应检测攻击短处', () => {
    const triggers = detectNegativeTriggers('你总是这样，每次都不听')
    expect(triggers.length).toBeGreaterThan(0)
    expect(triggers[0]).toContain('驳其所乏')
  })

  it('应检测以长压短', () => {
    const triggers = detectNegativeTriggers('我都能做到，你怎么不行')
    expect(triggers.length).toBeGreaterThan(0)
    expect(triggers[0]).toContain('以恶犯婟')
  })

  it('正常回复不应触发负面情机', () => {
    const triggers = detectNegativeTriggers('今天辛苦了，早点休息')
    expect(triggers.length).toBe(0)
  })
})

// ============================================================
// 5. 高语境理解测试
// ============================================================

describe('高语境理解', () => {
  it('应识别"改天"为婉拒', () => {
    const signals = detectHighContextSignals('改天再约吧')
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].type).toBe('refusal')
  })

  it('应识别"再说吧"为拒绝', () => {
    const signals = detectHighContextSignals('再说吧')
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].type).toBe('refusal')
  })

  it('应识别"还行"为正面评价', () => {
    const signals = detectHighContextSignals('最近工作还行')
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].type).toBe('approval')
  })

  it('应识别"没事"为可能的信号', () => {
    const signals = detectHighContextSignals('我没事')
    expect(signals.length).toBeGreaterThan(0)
    expect(signals[0].type).toBe('concern')
  })

  it('正常消息不应触发高语境信号', () => {
    const signals = detectHighContextSignals('今天天气真好')
    expect(signals.length).toBe(0)
  })
})

// ============================================================
// 6. 国情合规引擎测试
// ============================================================

describe('国情合规引擎', () => {
  it('应检测威士忌等洋酒', () => {
    const result = checkCulturalCompliance('建议你少喝威士忌')
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].category).toBe('diet')
  })

  it('应检测代第三方承诺', () => {
    const result = checkCulturalCompliance('合伙人答应你创业失败可以回去')
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].severity).toBe('error')
  })

  it('应检测空话安慰', () => {
    const result = checkCulturalCompliance('别担心，一切都会好的')
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].category).toBe('comfort')
  })

  it('应检测离职返回假设', () => {
    const result = checkCulturalCompliance('离职后可以回原公司没问题')
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].severity).toBe('error')
  })

  it('应检测直接人身批评', () => {
    const result = checkCulturalCompliance('你太懒了')
    expect(result.issues.length).toBeGreaterThan(0)
    expect(result.issues[0].severity).toBe('error')
  })

  it('正常回复应通过校验', () => {
    const result = checkCulturalCompliance('今天辛苦了，早点休息')
    expect(result.valid).toBe(true)
    expect(result.issues.length).toBe(0)
  })

  it('国情合规提示应包含所有维度', () => {
    const prompt = buildCulturalGuardPrompt()
    expect(prompt).toContain('饮食')
    expect(prompt).toContain('社交')
    expect(prompt).toContain('职场')
    expect(prompt).toContain('家庭')
    expect(prompt).toContain('人情')
    expect(prompt).toContain('安慰')
  })

  it('规则库应包含至少10条规则', () => {
    const rules = getAllRules()
    expect(rules.length).toBeGreaterThanOrEqual(10)
  })
})

// ============================================================
// 7. 回复校验管线测试
// ============================================================

describe('回复校验管线', () => {
  it('正常回复应通过校验', () => {
    const person = makePerson({ relationship: 'spouse', sentiment: 80 })
    const result = validateReply(
      '今天辛苦了，泡杯茶歇会儿',
      '今天好累',
      person,
      []
    )
    expect(result.passed).toBe(true)
    expect(result.qualityScore).toBeGreaterThan(80)
  })

  it('含威士忌的回复应检测到国情合规问题', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 50 })
    const result = validateReply(
      '建议你少喝威士忌',
      '最近身体不太好',
      person,
      []
    )
    expect(result.culturalCompliance.issues.length).toBeGreaterThan(0)
    expect(result.culturalCompliance.issues[0].category).toBe('diet')
  })

  it('含代第三方承诺的回复应不通过校验', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 50 })
    const result = validateReply(
      '合伙人答应你创业失败可以回原公司',
      '我在考虑创业',
      person,
      []
    )
    expect(result.passed).toBe(false)
  })

  it('对领导的高面子风险回复应生成修正提示', () => {
    const person = makePerson({ relationship: 'leader', sentiment: 30 })
    const result = validateReply(
      '你这样做不对，你应该换种方式',
      '领导让我改方案',
      person,
      []
    )
    expect(result.faceRisk).not.toBe('none')
    expect(result.revisionHints.length).toBeGreaterThan(0)
  })

  it('修正提示应包含具体建议', () => {
    const person = makePerson({ relationship: 'leader', sentiment: 30 })
    const result = validateReply(
      '你这样做不对，你应该换种方式，合伙人答应你可以回去',
      '领导让我改方案',
      person,
      []
    )
    const revision = buildRevisionPrompt(result)
    expect(revision).toContain('人情世故')
    expect(revision.length).toBeGreaterThan(0)
  })

  it('应检测用户消息中的高语境信号', () => {
    const person = makePerson({ relationship: 'friend', sentiment: 50 })
    const result = validateReply(
      '好的，知道了',
      '他说改天再约',
      person,
      []
    )
    expect(result.highContextSignals.length).toBeGreaterThan(0)
  })
})

// ============================================================
// 8. 社交智能上下文生成测试
// ============================================================

describe('社交智能上下文生成', () => {
  it('应生成包含差序格局的上下文', () => {
    const person = makePerson({ relationship: 'spouse', name: '林晓薇', sentiment: 80 })
    const context = buildSocialIntelligenceContext(person, '今天好累', [])
    expect(context).toContain('差序格局')
    expect(context).toContain('核心圈')
  })

  it('应检测用户消息中的高语境信号', () => {
    const person = makePerson({ relationship: 'friend', name: '张三', sentiment: 50 })
    const context = buildSocialIntelligenceContext(person, '他说改天再说', [])
    expect(context).toContain('高语境')
  })

  it('无人物时应返回空上下文', () => {
    const context = buildSocialIntelligenceContext(undefined, '今天好累', [])
    expect(context).toBe('')
  })
})
