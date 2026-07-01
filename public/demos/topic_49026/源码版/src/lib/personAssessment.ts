/**
 * 人物分析引擎 — 基于《人物志》（刘劭·三国魏）九征八观体系
 *
 * 理论根基：
 * - 九征：神、精、筋、骨、气、色、仪、言、事 — 九个观察维度
 * - 八观：观夺救、观感变、观志质、观所由、观爱敬、观情机、观所短、观聪明
 * - 七谬：避免七种常见判断偏差
 *
 * 工程化映射：
 * - 神/精 → personality.neuroticism + personality.extraversion（精神状态与精力）
 * - 筋/骨 → career.strengths/weaknesses + conscientiousness（执行力与原则）
 * - 气/色 → personality.agreeableness + sentiment（气质与情绪表达）
 * - 仪/言 → preferences.communicationStyle + personality.description（仪表与言语）
 * - 事 → timeline events + interactionStats（行事轨迹）
 */

import type { Person } from '../types'

// ============================================================
// 一、九征分析 — 九个观察维度
// ============================================================

export interface ObservationDimension {
  key: string
  name: string         // 维度名称（古文）
  modernName: string   // 现代名称
  score: number        // 0-100
  analysis: string     // 分析说明
  evidence: string[]   // 依据
}

/** 九征分析 — 从人物画像中提取九个维度的观察结果 */
export function assessNineObservations(person: Person): ObservationDimension[] {
  const p = person.profile
  const dimensions: ObservationDimension[] = []

  // 1. 神 — 精神状态（映射：神经质反向 + 外向性）
  const spiritScore = Math.round(
    (100 - p.personality.neuroticism) * 0.6 + p.personality.extraversion * 0.4
  )
  dimensions.push({
    key: 'spirit',
    name: '神',
    modernName: '精神状态',
    score: spiritScore,
    analysis: spiritScore >= 70
      ? '精神饱满，气定神闲，遇事不慌'
      : spiritScore >= 40
        ? '精神状态尚可，但压力下容易波动'
        : '精神容易紧张，情绪波动较大，需注意调节',
    evidence: [
      `神经质${p.personality.neuroticism}（${p.personality.neuroticism > 60 ? '敏感' : '稳定'}）`,
      `外向性${p.personality.extraversion}（${p.personality.extraversion > 60 ? '外向' : '内敛'}）`,
    ],
  })

  // 2. 精 — 精力/专注力（映射：尽责性 + 外向性）
  const essenceScore = Math.round(
    p.personality.conscientiousness * 0.6 + p.personality.extraversion * 0.4
  )
  dimensions.push({
    key: 'essence',
    name: '精',
    modernName: '精力专注',
    score: essenceScore,
    analysis: essenceScore >= 70
      ? '精力充沛，做事专注高效'
      : essenceScore >= 40
        ? '精力一般，需要适当休息和激励'
        : '精力容易分散，做事缺乏持续性',
    evidence: [
      `尽责性${p.personality.conscientiousness}（${p.personality.conscientiousness > 60 ? '自律' : '随性'}）`,
    ],
  })

  // 3. 筋 — 执行力（映射：尽责性 + career.strengths）
  const tendonScore = Math.round(
    p.personality.conscientiousness * 0.5 +
    (p.career.strengths.length > 0 ? 60 : 30) * 0.3 +
    (p.career.workStyle ? 60 : 40) * 0.2
  )
  dimensions.push({
    key: 'tendon',
    name: '筋',
    modernName: '执行力',
    score: tendonScore,
    analysis: tendonScore >= 70
      ? '行动力强，说到做到，不拖泥带水'
      : tendonScore >= 40
        ? '执行力尚可，但偶尔拖延'
        : '执行力偏弱，计划多落地少',
    evidence: p.career.strengths.length > 0
      ? [`优势：${p.career.strengths.slice(0, 3).join('、')}`]
      : ['暂无明确优势记录'],
  })

  // 4. 骨 — 骨气/原则性（映射：价值观 + 尽责性）
  const boneScore = Math.round(
    p.personality.conscientiousness * 0.4 +
    (p.values.coreValues.length > 0 ? 70 : 40) * 0.4 +
    (p.values.fears.length > 0 ? 55 : 45) * 0.2
  )
  dimensions.push({
    key: 'bone',
    name: '骨',
    modernName: '原则骨气',
    score: boneScore,
    analysis: boneScore >= 70
      ? '有原则有底线，不轻易妥协'
      : boneScore >= 40
        ? '有一定原则，但在压力下可能动摇'
        : '原则性不强，容易随波逐流',
    evidence: p.values.coreValues.length > 0
      ? [`核心价值观：${p.values.coreValues.slice(0, 3).join('、')}`]
      : ['价值观未明确记录'],
  })

  // 5. 气 — 气质/气场（映射：开放性 + 宜人性）
  const qiScore = Math.round(
    p.personality.openness * 0.5 + p.personality.agreeableness * 0.5
  )
  dimensions.push({
    key: 'qi',
    name: '气',
    modernName: '气质气场',
    score: qiScore,
    analysis: qiScore >= 70
      ? '气质温和大气，让人如沐春风'
      : qiScore >= 40
        ? '气质平和，不张扬也不怯场'
        : '气场偏弱，或过于强势，需注意分寸',
    evidence: [
      `开放性${p.personality.openness}（${p.personality.openness > 60 ? '开放包容' : '保守稳重'}）`,
      `宜人性${p.personality.agreeableness}（${p.personality.agreeableness > 60 ? '温和' : '直接'}）`,
    ],
  })

  // 6. 色 — 情绪表达（映射：神经质 + sentiment）
  const complexionScore = Math.round(
    (100 - p.personality.neuroticism) * 0.5 + person.sentiment * 0.5
  )
  dimensions.push({
    key: 'complexion',
    name: '色',
    modernName: '情绪表达',
    score: complexionScore,
    analysis: complexionScore >= 70
      ? '情绪稳定，面色从容，不喜形于色也不压抑'
      : complexionScore >= 40
        ? '情绪有一定波动，但总体可控'
        : '情绪容易外露或压抑，需注意疏导',
    evidence: [
      `当前关系温度：${person.sentiment}/100`,
    ],
  })

  // 7. 仪 — 仪表/举止（映射：communicationStyle + 外向性）
  const appearanceScore = Math.round(
    p.personality.extraversion * 0.4 +
    (p.preferences.communicationStyle ? 65 : 45) * 0.3 +
    (p.identity.currentCity ? 60 : 40) * 0.3
  )
  dimensions.push({
    key: 'appearance',
    name: '仪',
    modernName: '仪表举止',
    score: appearanceScore,
    analysis: appearanceScore >= 70
      ? '举止得体，进退有度，给人良好第一印象'
      : appearanceScore >= 40
        ? '仪表尚可，不算出众也不失礼'
        : '不拘小节，可能在正式场合吃亏',
    evidence: p.preferences.communicationStyle
      ? [`沟通风格：${p.preferences.communicationStyle}`]
      : ['沟通风格未记录'],
  })

  // 8. 言 — 言语/表达（映射：开放性 + communicationStyle + MBTI）
  const speechScore = Math.round(
    p.personality.openness * 0.4 +
    (p.preferences.communicationStyle ? 65 : 40) * 0.3 +
    (p.personality.mbti ? 60 : 40) * 0.3
  )
  dimensions.push({
    key: 'speech',
    name: '言',
    modernName: '言语表达',
    score: speechScore,
    analysis: speechScore >= 70
      ? '言辞得体，善于表达，有说服力'
      : speechScore >= 40
        ? '表达尚可，偶尔词不达意'
        : '不善言辞，或过于直白，需注意方式',
    evidence: [
      p.personality.mbti ? `MBTI: ${p.personality.mbti}` : 'MBTI未测',
      p.personality.description ? p.personality.description.slice(0, 40) : '',
    ].filter(Boolean),
  })

  // 9. 事 — 行事/作为（映射：timeline + interactionStats）
  const eventCount = person.timeline?.length || 0
  const interactionCount = person.interactionStats.totalCount
  const actionScore = Math.round(
    Math.min(100, eventCount * 10) * 0.3 +
    Math.min(100, interactionCount * 5) * 0.3 +
    (p.career.careerHistory.length > 0 ? 60 : 30) * 0.4
  )
  dimensions.push({
    key: 'action',
    name: '事',
    modernName: '行事作为',
    score: actionScore,
    analysis: actionScore >= 70
      ? '行事有章法，经历丰富，可托重任'
      : actionScore >= 40
        ? '做事尚可，但缺乏亮点经历'
        : '经历较少，或行事缺乏规划',
    evidence: [
      `时间线事件：${eventCount}条`,
      `互动记录：${interactionCount}次`,
      p.career.careerHistory.length > 0 ? `职业经历：${p.career.careerHistory.length}段` : '',
    ].filter(Boolean),
  })

  return dimensions
}

// ============================================================
// 二、八观评估 — 八步深度评估
// ============================================================

export interface AssessmentStep {
  key: string
  name: string         // 评估步骤（古文）
  modernName: string   // 现代名称
  result: string       // 评估结果
  suggestion: string   // 建议
}

/** 八观评估 — 八步深度评估人物 */
export function assessEightSteps(person: Person): AssessmentStep[] {
  const p = person.profile
  const steps: AssessmentStep[] = []

  // 1. 观其夺救 — 观察在紧要关头的反应（映射：神经质 + fears）
  const crisisResponse = p.personality.neuroticism < 50
    ? '临危不乱，能保持冷静'
    : p.personality.neuroticism < 70
      ? '危机中有一定应变能力，但需要时间恢复'
      : '容易在压力下慌乱，不适合处理突发危机'
  steps.push({
    key: 'crisis',
    name: '观其夺救',
    modernName: '危机应变',
    result: crisisResponse,
    suggestion: p.personality.neuroticism > 60
      ? '在紧急事务中给予明确指引，减少其决策压力'
      : '可放心交付紧急重要任务',
  })

  // 2. 观其感变 — 观察应变能力（映射：开放性 + 外向性）
  const adaptability = (p.personality.openness + p.personality.extraversion) / 2
  steps.push({
    key: 'adaptability',
    name: '观其感变',
    modernName: '应变能力',
    result: adaptability >= 60
      ? '反应敏捷，善于变通，能快速适应新环境'
      : adaptability >= 40
        ? '应变能力一般，需要一定时间适应变化'
        : '偏好稳定，不善于应对频繁变化',
    suggestion: adaptability < 40
      ? '避免频繁变更计划，提前沟通变更原因'
      : '可以安排需要灵活应变的工作',
  })

  // 3. 观其志质 — 观察志向和品质（映射：values.goals + coreValues）
  const hasGoals = p.values.goals.length > 0
  const hasValues = p.values.coreValues.length > 0
  steps.push({
    key: 'ambition',
    name: '观其志质',
    modernName: '志向品质',
    result: hasGoals && hasValues
      ? `志向明确（${p.values.goals.slice(0, 2).join('、')}），有清晰价值观`
      : hasGoals
        ? '有目标但价值观不够清晰'
        : hasValues
          ? '有原则但缺乏明确目标'
          : '志向和价值观尚不明确，需要进一步了解',
    suggestion: !hasGoals
      ? '可以聊聊对方的人生目标，帮助其明确方向'
      : '志同道合，可以深入交流',
  })

  // 4. 观其所由 — 观察做事的动机（映射：values.motivations）
  steps.push({
    key: 'motivation',
    name: '观其所由',
    modernName: '行为动机',
    result: p.values.motivations.length > 0
      ? `主要驱动力：${p.values.motivations.slice(0, 3).join('、')}`
      : '动机不明显，可能需要外部激励',
    suggestion: p.values.motivations.length > 0
      ? `投其所好，在${p.values.motivations[0]}方面给予认可`
      : '需要了解什么能激发对方的积极性',
  })

  // 5. 观其爱敬 — 观察爱敬之心（映射：宜人性 + socialRole）
  steps.push({
    key: 'respect',
    name: '观其爱敬',
    modernName: '爱敬之心',
    result: p.personality.agreeableness >= 60
      ? '待人温和有礼，懂得尊重他人'
      : p.personality.agreeableness >= 40
        ? '对人有一定尊重，但偶尔自我中心'
        : '个性较强，可能忽视他人感受',
    suggestion: p.personality.agreeableness < 50
      ? '沟通时注意给足面子，避免正面冲突'
      : '可以坦诚交流，对方能接受不同意见',
  })

  // 6. 观其情机 — 观察情机反应（映射：神经质 + fears + preferences.dislikes）
  const emotionalTriggers = [
    ...p.values.fears.map(f => `担忧${f}`),
    ...p.preferences.dislikes.map(d => `反感${d}`),
  ]
  steps.push({
    key: 'emotional',
    name: '观其情机',
    modernName: '情机反应',
    result: emotionalTriggers.length > 0
      ? `情绪触发点：${emotionalTriggers.slice(0, 3).join('、')}`
      : '情绪触发点不明显，表面平和',
    suggestion: emotionalTriggers.length > 0
      ? `避免触碰以上话题，尤其在公开场合`
      : '情绪较稳定，一般话题不会触发负面反应',
  })

  // 7. 观其所短 — 观察短处（映射：career.weaknesses + neuroticism）
  const weaknesses = [
    ...p.career.weaknesses,
    ...(p.personality.neuroticism > 60 ? ['情绪敏感'] : []),
    ...(p.personality.conscientiousness < 40 ? ['执行力不足'] : []),
    ...(p.personality.agreeableness < 40 ? ['人际敏感度低'] : []),
  ]
  steps.push({
    key: 'weakness',
    name: '观其所短',
    modernName: '短板所在',
    result: weaknesses.length > 0
      ? weaknesses.slice(0, 4).join('、')
      : '暂未发现明显短板',
    suggestion: weaknesses.length > 0
      ? `沟通中避免触及以上短处，用"三明治法"提出改进建议`
      : '整体表现均衡，无明显短板',
  })

  // 8. 观其聪明 — 观察聪明程度（映射：开放性 + career.strengths）
  const intelligence = p.personality.openness
  steps.push({
    key: 'intelligence',
    name: '观其聪明',
    modernName: '才智评估',
    result: intelligence >= 70
      ? '聪慧过人，学习能力强，思维开阔'
      : intelligence >= 50
        ? '智力中上，能理解复杂概念，善于学习'
        : '智力一般，更擅长实操而非抽象思考',
    suggestion: intelligence >= 60
      ? '可以讨论复杂话题，对方能跟上思路'
      : '沟通时多用具体案例，少用抽象概念',
  })

  return steps
}

// ============================================================
// 三、综合评价
// ============================================================

export interface PersonAssessment {
  personId: string
  personName: string
  overallScore: number       // 综合评分 0-100
  nineObservations: ObservationDimension[]
  eightSteps: AssessmentStep[]
  summary: string             // 一句话总结
  strengths: string[]         // 优势总结
  weaknesses: string[]        // 短板总结
  communicationTips: string[] // 沟通建议
  compatibility: string      // 相处之道
}

/** 生成完整的人物分析报告 */
export function assessPerson(person: Person): PersonAssessment {
  const nineObservations = assessNineObservations(person)
  const eightSteps = assessEightSteps(person)
  const p = person.profile

  // 综合评分 = 九征均分（八观为定性评估，不参与计分）
  const nineAvg = nineObservations.reduce((sum, d) => sum + d.score, 0) / nineObservations.length
  const overallScore = Math.round(nineAvg)

  // 提取优势
  const strengths: string[] = []
  for (const dim of nineObservations) {
    if (dim.score >= 65) {
      strengths.push(`${dim.modernName}（${dim.score}分）`)
    }
  }
  if (p.career.strengths.length > 0) {
    strengths.push(...p.career.strengths.slice(0, 2))
  }

  // 提取短板
  const weaknesses: string[] = []
  for (const dim of nineObservations) {
    if (dim.score < 45) {
      weaknesses.push(`${dim.modernName}（${dim.score}分）`)
    }
  }
  if (p.career.weaknesses.length > 0) {
    weaknesses.push(...p.career.weaknesses.slice(0, 2))
  }

  // 一句话总结
  const topStrength = nineObservations
    .slice()
    .sort((a, b) => b.score - a.score)[0]
  const topWeakness = nineObservations
    .slice()
    .sort((a, b) => a.score - b.score)[0]
  const summary = `${person.name}的${topStrength.modernName}突出（${topStrength.score}分），${topWeakness.modernName}有待加强（${topWeakness.score}分）。`

  // 沟通建议
  const communicationTips: string[] = []
  if (p.personality.neuroticism > 60) {
    communicationTips.push('对方情绪敏感，注意措辞，避免直接批评')
  }
  if (p.personality.agreeableness < 40) {
    communicationTips.push('对方个性较强，沟通时先肯定再建议')
  }
  if (p.personality.extraversion < 40) {
    communicationTips.push('对方偏内向，给其思考时间，不要催促回应')
  }
  if (p.preferences.dislikes.length > 0) {
    communicationTips.push(`避免话题：${p.preferences.dislikes.slice(0, 2).join('、')}`)
  }
  if (p.values.fears.length > 0) {
    communicationTips.push(`对方担忧：${p.values.fears.slice(0, 2).join('、')}，沟通时注意安抚`)
  }
  if (communicationTips.length === 0) {
    communicationTips.push('对方性格较为均衡，正常沟通即可')
  }

  // 相处之道
  let compatibility = ''
  const sentiment = person.sentiment
  if (sentiment >= 70) {
    compatibility = `与${person.name}关系亲密，可以坦诚交流，但仍需注意对方情绪敏感点。`
  } else if (sentiment >= 40) {
    compatibility = `与${person.name}关系尚可，保持定期互动，适当关心但不过分热情。`
  } else {
    compatibility = `与${person.name}关系一般，建议先通过小事建立信任，再深入交流。`
  }

  return {
    personId: person.id,
    personName: person.name,
    overallScore,
    nineObservations,
    eightSteps,
    summary,
    strengths: strengths.slice(0, 5),
    weaknesses: weaknesses.slice(0, 5),
    communicationTips,
    compatibility,
  }
}

// ============================================================
// 四、七谬警示 — 避免七种判断偏差
// ============================================================

export const SEVEN_ERRORS = [
  { id: 'surface', name: '察容有色', desc: '只看外表，忽略内在', warning: '不要仅凭第一印象判断人物' },
  { id: 'partial', name: '信耳弃目', desc: '听信传言，不做核实', warning: '不要仅凭他人评价判断人物' },
  { id: 'timing', name: '度功要誉', desc: '以一时成败论英雄', warning: '不要仅凭一时成败判断人物能力' },
  { id: 'emotion', name: '因其所爱', desc: '因偏爱而失去客观', warning: '不要因个人好恶影响判断' },
  { id: 'position', name: '因其所异', desc: '因身份地位差异而偏见', warning: '不要因对方身份地位影响判断' },
  { id: 'rumor', name: '听言信貌', desc: '听信好话而忽略事实', warning: '不要因对方会说好话就信任' },
  { id: 'comparison', name: '以己度人', desc: '以自己的标准衡量他人', warning: '不要以自己的价值观强加于人' },
] as const

/** 生成七谬警示提示 */
export function buildSevenErrorsPrompt(): string {
  const lines = SEVEN_ERRORS.map(e => `- ${e.name}：${e.desc}。${e.warning}`)
  return `【人物志·七谬警示】\n评估人物时避免以下七种偏差：\n${lines.join('\n')}`
}
