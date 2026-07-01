/**
 * 国情合规引擎 — 确保 AI 回复符合中国国情和社会常识
 *
 * 校验维度：
 * 1. 饮食习惯：不默认用户喝洋酒，除非记忆中有明确记录
 * 2. 社交规范：不代第三方做承诺，不给空话安慰
 * 3. 职场常识：离职后不能假设可以回去，创业失败不能假设原公司接收
 * 4. 家庭观念：尊重中国家庭的长幼尊卑、面子文化
 * 5. 人情世故：建议要符合人情往来规则
 */

import { getUserValueSystem } from './valueSystem'

// ============================================================
// 合规规则定义
// ============================================================

export interface CulturalRule {
  id: string
  category: 'diet' | 'social_norm' | 'workplace' | 'family' | 'gift' | 'comfort'
  rule: string
  pattern: RegExp
  suggestion: string
  severity: 'error' | 'warning' | 'info'
}

// ============================================================
// 规则库
// ============================================================

const RULES: CulturalRule[] = [
  // === 饮食习惯 ===
  {
    id: 'no_exotic_alcohol_default',
    category: 'diet',
    rule: '不默认用户喝威士忌/白兰地/伏特加等洋酒，除非记忆中有明确记录',
    pattern: /威士忌|whiskey|白兰地|伏特加|朗姆酒|金酒|龙舌兰/i,
    suggestion: '替换为白酒、红酒、啤酒、茶、咖啡等更常见的饮品',
    severity: 'warning',
  },
  {
    id: 'no_western_diet_default',
    category: 'diet',
    rule: '不默认用户吃西餐/牛排/奶酪等西方饮食，除非记忆中有明确记录',
    pattern: /牛排|奶酪|cheese|沙拉|三明治|汉堡|披萨/i,
    suggestion: '替换为更符合中国饮食习惯的食物（米饭、面条、炒菜等）',
    severity: 'info',
  },

  // === 社交规范 ===
  {
    id: 'no_third_party_promise',
    category: 'social_norm',
    rule: '不代第三方做承诺或保证',
    pattern: /(他|她|他们|合伙人|老板|公司).{0,6}(答应|保证|承诺|同意|同意了).{0,6}(你|可以|能|会)/,
    suggestion: '改为"建议你直接和对方确认"或"你可以和他谈谈，看看他的态度"',
    severity: 'error',
  },
  {
    id: 'no_unrealistic_reassurance',
    category: 'comfort',
    rule: '不给不切实际的安慰',
    pattern: /一切都会好的|没事的|别担心|会好起来的|想开点|别想太多|顺其自然/,
    suggestion: '将空话替换为具体的、可操作的下一步行动建议',
    severity: 'warning',
  },
  {
    id: 'no_direct_criticism',
    category: 'social_norm',
    rule: '不对用户做直接人身批评',
    pattern: /你太(懒|蠢|笨|差|弱|自私|小气|没用)|你就是个|你这种人/,
    suggestion: '改为"我觉得可以换个角度"或"这事也许可以这样看"',
    severity: 'error',
  },

  // === 职场常识 ===
  {
    id: 'no_return_assumption',
    category: 'workplace',
    rule: '不假设离职后可以返回原公司',
    pattern: /(回去|回原公司|回原来的|原岗位).{0,4}(可以|能|没问题|没事|随时)/,
    suggestion: '改为"如果考虑离职，建议提前和原公司沟通留职可能性，不要假设一定能回去"',
    severity: 'error',
  },
  {
    id: 'no_startup_guarantee',
    category: 'workplace',
    rule: '不保证创业一定会成功',
    pattern: /创业.{0,4}(一定|肯定|必然|绝对).{0,4}(成功|赚钱|盈利)/,
    suggestion: '改为"创业有风险，需要做好最坏情况的准备"',
    severity: 'error',
  },
  {
    id: 'no_resignation_encouragement',
    category: 'workplace',
    rule: '不轻易鼓励用户辞职',
    pattern: /(辞职|离职|辞职吧|离职吧|别干了|别做了).{0,2}(吧|好了|算了)/,
    suggestion: '改为"建议你先想清楚离职后的经济来源和职业规划，再做决定"',
    severity: 'warning',
  },

  // === 家庭观念 ===
  {
    id: 'respect_elders',
    category: 'family',
    rule: '尊重长辈，不建议用户和父母/长辈正面冲突',
    pattern: /(跟|和|对).{0,3}(爸妈|父母|妈|爸|长辈|老人).{0,3}(吵|闹|翻脸|翻|怼|顶嘴|硬刚)/,
    suggestion: '改为"可以委婉表达你的想法，但注意方式，给长辈留面子"',
    severity: 'warning',
  },
  {
    id: 'no_spouse_criticism',
    category: 'family',
    rule: '不轻易批评用户的配偶',
    pattern: /(老婆|妻子|媳妇|老公|丈夫).{0,4}(太|就是|总是|从不|太差|不行|不好|不好)/,
    suggestion: '改为"夫妻之间需要互相理解，也许可以换个角度想"',
    severity: 'warning',
  },

  // === 人情世故 ===
  {
    id: 'no_free_favor',
    category: 'gift',
    rule: '不建议用户白占别人便宜',
    pattern: /(白拿|白要|白占|蹭|免费拿|不用还|不用给|不用谢)/,
    suggestion: '改为"收到人情要找机会回报，礼尚往来才能维持关系"',
    severity: 'warning',
  },
  {
    id: 'no_overstep_boundary',
    category: 'social_norm',
    rule: '不建议用户越界干涉他人私事',
    pattern: /(你|你应该).{0,4}(管|干涉|过问|打听).{0,4}(别人|他|她).{0,4}(私事|私生活|家事|收入|感情)/,
    suggestion: '改为"关系不到那个程度，不宜过问太深"',
    severity: 'warning',
  },
]

// ============================================================
// 校验引擎
// ============================================================

export interface ValidationResult {
  valid: boolean
  issues: Array<{
    ruleId: string
    category: string
    rule: string
    matched: string
    suggestion: string
    severity: 'error' | 'warning' | 'info'
  }>
}

/** 校验回复内容是否符合国情合规规则 */
export function checkCulturalCompliance(content: string): ValidationResult {
  const issues: ValidationResult['issues'] = []

  for (const rule of RULES) {
    const match = content.match(rule.pattern)
    if (match) {
      issues.push({
        ruleId: rule.id,
        category: rule.category,
        rule: rule.rule,
        matched: match[0],
        suggestion: rule.suggestion,
        severity: rule.severity,
      })
    }
  }

  return {
    valid: issues.filter(i => i.severity === 'error').length === 0,
    issues,
  }
}

/** 生成合规提示（注入到系统提示词） */
export function buildCulturalGuardPrompt(): string {
  const parts: string[] = []

  parts.push(`【国情合规·中国式人情世故】`)
  parts.push(`回复必须符合中国国情和社会常识：`)
  parts.push(``)
  parts.push(`饮食：不默认用户喝威士忌/洋酒，除非记忆中有明确记录。中国42岁男性更常见的饮品是白酒、茶、啤酒。`)
  parts.push(`社交：绝对不代第三方做承诺——不能说"他会答应你""公司会接收你"。只能建议用户自己去确认。`)
  parts.push(`职场：离职后不能假设可以"回去"，创业失败不能假设原公司会接收。建议要基于用户自身可控范围。`)
  parts.push(`家庭：尊重长幼尊卑，不建议和父母正面冲突；不轻易批评用户配偶。`)
  parts.push(`人情：收到人情必须找机会回报，不建议白占便宜；不越界干涉他人私事。`)
  parts.push(`安慰：不给空话安慰（"一切都会好的"），要给具体的可操作建议。`)
  parts.push(`分寸：不同关系亲疏远近，说话分寸不同——家人可直说，同事要点到为止，领导要恭敬。`)

  // 自适应用户价值观
  const adaptiveParts = buildAdaptiveCulturalRules()
  if (adaptiveParts) {
    parts.push('')
    parts.push(adaptiveParts)
  }

  return parts.join('\n')
}

/**
 * 根据用户价值体系生成自适应文化规则
 */
function buildAdaptiveCulturalRules(): string {
  let vs
  try {
    vs = getUserValueSystem()
  } catch {
    return ''
  }

  if (!vs.boundaryStyle && !vs.justiceProfitOrientation && !vs.lifePhilosophy && !vs.conflictStyle) {
    return ''
  }

  const parts: string[] = []
  parts.push('【个性化适配·用户价值观】')

  if (vs.boundaryStyle === 'clear') {
    parts.push('边界感：用户注重边界分明（亲兄弟明算账），建议涉及人际边界时尊重其原则，不劝其模糊界限。')
  } else if (vs.boundaryStyle === 'permeable') {
    parts.push('边界感：用户倾向互助互渗（一家人不说两家话），可建议适度介入，但需提醒注意自我保护。')
  }

  if (vs.justiceProfitOrientation === 'profit') {
    parts.push('义利取向：用户务实重利，建议应包含利益分析和投入产出考量，不宜过度强调道义说教。')
  } else if (vs.justiceProfitOrientation === 'justice') {
    parts.push('义利取向：用户重义轻利，建议应从道义和情义角度出发，不宜过度强调利益算计。')
  }

  if (vs.lifePhilosophy === 'forgiving') {
    parts.push('处世哲学：用户倾向宽容（以德报怨），建议应顺应其宽容倾向，但涉及底线问题时温和提醒保护自己。')
  } else if (vs.lifePhilosophy === 'reciprocal') {
    parts.push('处世哲学：用户讲究对等（以直报怨），建议应尊重其对等原则，不劝其单方面付出或退让。')
  } else if (vs.lifePhilosophy === 'pragmatic') {
    parts.push('处世哲学：用户务实变通，建议应注重可操作性和实际效果，避免理想化说教。')
  } else if (vs.lifePhilosophy === 'idealistic') {
    parts.push('处世哲学：用户坚持原则（宁折不弯），建议应尊重其原则底线，但可适时提醒评估现实成本。')
  }

  if (vs.conflictStyle === 'avoidant') {
    parts.push('冲突处理：用户倾向回避冲突，建议应循序渐进，不强迫其正面硬刚，可建议委婉沟通方式。')
  } else if (vs.conflictStyle === 'competitive') {
    parts.push('冲突处理：用户倾向正面竞争，建议应肯定其勇气，但适时提醒评估风险和后果。')
  }

  // 普世价值兜底
  parts.push('')
  parts.push('普世价值兜底：当用户价值观可能导致严重伤害（身心安全、法律风险、重大财产损失）时，')
  parts.push('应基于普世价值提出与用户价值观不完全相同的合理建议，')
  parts.push('但语气应尊重而非说教，用"我理解你的想法，同时我也担心..."的方式表达。')

  return parts.join('\n')
}

/** 获取所有规则（供调试和测试使用） */
export function getAllRules(): CulturalRule[] {
  return RULES
}
