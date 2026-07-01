/**
 * 问题类型分类器
 * 基于规则引擎，无需 AI 调用，零延迟
 * 根据问题特征动态调整 RAG 检索的 memoryLimit
 */

export type QueryType = 'fact_lookup' | 'relation_analysis' | 'cross_domain' | 'emotional_support'

export interface QueryClassification {
  type: QueryType
  memoryLimit: number
  minScore: number
  confidence: number
}

// 情绪关键词
const EMOTION_KEYWORDS = ['压力', '焦虑', '累', '烦', '怕', '担心', '怎么办', '迷茫', '崩溃', '抑郁', '失眠', '扛不住', '撑不住']

// 跨域信号词（同时出现 3+ 个领域即判定为跨域）
const DOMAIN_SIGNALS: Record<string, string[]> = {
  work: ['工作', '公司', 'KPI', '绩效', '领导', '同事', '加班', '周会', '创业', '跳槽', '职场', '运营', '总监', 'VP'],
  family: ['老婆', '妻子', '晓薇', '妈', '儿子', '一诺', '家庭', '结婚', '孩子', '母亲', '秀兰'],
  health: ['体检', '血压', '脂肪肝', '失眠', '健康', '身体', '锻炼', '白酒', '减脂', '甘油三酯'],
  schedule: ['端午', '周末', '周六', '周日', '下周', '提醒', '安排', '计划', '野餐', '绍兴'],
}

export function classifyQuery(query: string): QueryClassification {
  const len = query.length

  // 1. 检测跨域：统计命中的领域数
  const hitDomains = Object.entries(DOMAIN_SIGNALS).filter(([, words]) =>
    words.some(w => query.includes(w))
  ).map(([domain]) => domain)

  if (hitDomains.length >= 3) {
    return { type: 'cross_domain', memoryLimit: 12, minScore: 0, confidence: 0.9 }
  }

  // 2. 检测情绪支持
  if (EMOTION_KEYWORDS.some(w => query.includes(w))) {
    return { type: 'emotional_support', memoryLimit: 10, minScore: 0, confidence: 0.8 }
  }

  // 3. 检测关系分析（含人名 + 分析类动词，或跨 2 个领域）
  const hasPersonName = /[\u4e00-\u9fa5]{2,3}(说|想|觉得|什么意思|关系|背后|暗示)/.test(query)
  if (hasPersonName || hitDomains.length === 2) {
    return { type: 'relation_analysis', memoryLimit: 8, minScore: 0, confidence: 0.75 }
  }

  // 4. 默认：事实查询
  const isShortFact = len < 15 && /(什么|哪个|多少|在哪|是谁|几)/.test(query)
  return {
    type: 'fact_lookup',
    memoryLimit: isShortFact ? 5 : 8,
    minScore: 0,
    confidence: 0.7,
  }
}

/** 获取问题类型的中文标签 */
export function getQueryTypeLabel(type: QueryType): string {
  const labels: Record<QueryType, string> = {
    fact_lookup: '事实查询',
    relation_analysis: '关系分析',
    cross_domain: '跨域综合',
    emotional_support: '情绪支持',
  }
  return labels[type] || '未知'
}
