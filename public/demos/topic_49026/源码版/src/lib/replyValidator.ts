/**
 * 回复校验管线 — AI 回复生成后的质量检查
 *
 * 四层校验：
 * 1. 国情合规检查 — 饮食/社交/职场/家庭规则
 * 2. 面子风险评估 — 差序格局+面子理论
 * 3. 六情机检测 — 《人物志》负面情绪触发器
 * 4. 价值观冲突检测 — 回复是否与用户本人的价值取向冲突
 *
 * 校验不通过时，生成修正提示供 AI 二次生成
 */

import type { Person, Memory } from '../types'
import {
  calculateSocialCircle,
  getCircleStrategy,
  assessFaceRisk,
  selectFaceStrategy,
  detectNegativeTriggers,
  detectHighContextSignals,
  type FaceRisk,
  type FaceStrategy,
} from './socialIntelligence'
import { checkCulturalCompliance, type ValidationResult } from './culturalGuard'
import { checkValueConflict, type ValueConflictResult } from './valueSystem'

// ============================================================
// 校验结果类型
// ============================================================

export interface ReplyValidationResult {
  /** 是否通过校验 */
  passed: boolean
  /** 国情合规检查结果 */
  culturalCompliance: ValidationResult
  /** 面子风险等级 */
  faceRisk: FaceRisk
  /** 面子维护策略 */
  faceStrategy: FaceStrategy
  /** 触发的负面六情机 */
  negativeTriggers: string[]
  /** 检测到的高语境信号 */
  highContextSignals: Array<{ word: string; meaning: string; type: string }>
  /** 价值观冲突检测结果 */
  valueConflicts: ValueConflictResult
  /** 修正建议（供 AI 二次生成时参考） */
  revisionHints: string[]
  /** 综合质量评分 0-100 */
  qualityScore: number
}

// ============================================================
// 主校验函数
// ============================================================

/**
 * 校验 AI 回复质量
 *
 * @param replyContent AI 生成的回复内容
 * @param userMessage 用户的原始消息
 * @param targetPerson 回复涉及的人物（可选）
 * @param memories 相关记忆列表
 * @returns 校验结果
 */
export function validateReply(
  replyContent: string,
  userMessage: string,
  targetPerson: Person | undefined,
  memories: Memory[]
): ReplyValidationResult {
  // 1. 国情合规检查
  const culturalResult = checkCulturalCompliance(replyContent)

  // 2. 面子风险评估
  let faceRisk: FaceRisk = 'none'
  let faceStrategy: FaceStrategy = 'direct'
  if (targetPerson) {
    faceRisk = assessFaceRisk(replyContent, targetPerson, userMessage)
    const circle = calculateSocialCircle(targetPerson)
    faceStrategy = selectFaceStrategy(faceRisk, circle, userMessage)
  }

  // 3. 六情机检测
  const negativeTriggers = detectNegativeTriggers(replyContent)

  // 4. 高语境信号检测（检测用户消息中的话外音）
  const highContextSignals = detectHighContextSignals(userMessage)

  // 5. 价值观冲突检测
  const valueConflicts = checkValueConflict(replyContent)

  // 6. 生成修正建议
  const revisionHints: string[] = []

  // 国情合规问题
  for (const issue of culturalResult.issues) {
    if (issue.severity === 'error') {
      revisionHints.push(`[严重] ${issue.rule}。检测到"${issue.matched}"。${issue.suggestion}`)
    } else if (issue.severity === 'warning') {
      revisionHints.push(`[提醒] ${issue.rule}。${issue.suggestion}`)
    }
  }

  // 面子风险
  if (faceRisk === 'high') {
    revisionHints.push(`[面子风险高] 建议使用${faceStrategy === 'sandwich' ? '三明治法（肯定-建议-肯定）' : '委婉表达'}，避免直接批评或命令`)
  } else if (faceRisk === 'medium') {
    revisionHints.push(`[面子风险中] 注意语气委婉，先肯定再建议`)
  }

  // 负面情机
  for (const trigger of negativeTriggers) {
    revisionHints.push(`[六情机] ${trigger}`)
  }

  // 高语境信号提醒
  if (highContextSignals.length > 0) {
    const signalDescs = highContextSignals.map(s => `"${s.word}"=${s.meaning}`).join('，')
    revisionHints.push(`[高语境] 用户消息中检测到话外音：${signalDescs}。回复时要注意理解真实意图`)
  }

  // 价值观冲突提醒
  if (valueConflicts.hasConflict) {
    for (const conflict of valueConflicts.conflicts) {
      const severityLabel = conflict.severity === 'high' ? '严重' : conflict.severity === 'medium' ? '提醒' : '注意'
      revisionHints.push(`[价值观${severityLabel}] ${conflict.description}。${conflict.suggestion}`)
    }
  }

  // 7. 计算质量评分
  let qualityScore = 100
  for (const issue of culturalResult.issues) {
    if (issue.severity === 'error') qualityScore -= 20
    else if (issue.severity === 'warning') qualityScore -= 10
    else qualityScore -= 3
  }
  if (faceRisk === 'high') qualityScore -= 15
  else if (faceRisk === 'medium') qualityScore -= 8
  qualityScore -= negativeTriggers.length * 5
  // 价值观冲突扣分
  for (const conflict of valueConflicts.conflicts) {
    if (conflict.severity === 'high') qualityScore -= 12
    else if (conflict.severity === 'medium') qualityScore -= 6
    else qualityScore -= 3
  }
  qualityScore = Math.max(0, qualityScore)

  // 判断是否通过（价值观冲突不阻断，只提示）
  const hasErrors = culturalResult.issues.some(i => i.severity === 'error')
  const passed = !hasErrors && faceRisk !== 'high' && negativeTriggers.length === 0

  return {
    passed,
    culturalCompliance: culturalResult,
    faceRisk,
    faceStrategy,
    negativeTriggers,
    highContextSignals,
    valueConflicts,
    revisionHints,
    qualityScore,
  }
}

// ============================================================
// 修正提示生成
// ============================================================

/**
 * 生成修正提示（当校验不通过时，追加到系统提示词供 AI 二次生成）
 */
export function buildRevisionPrompt(result: ReplyValidationResult): string {
  if (result.passed) return ''

  const parts: string[] = []
  parts.push(`【回复校验提示 — 上一版回复存在以下问题，请在后续回复中注意】`)

  for (const hint of result.revisionHints) {
    parts.push(`- ${hint}`)
  }

  parts.push(``)
  parts.push(`请遵循中国式人情世故原则：`)
  parts.push(`- 不代第三方做承诺`)
  parts.push(`- 不给空话安慰，要给具体可操作建议`)
  parts.push(`- 注意面子管理，批评用三明治法`)
  parts.push(`- 理解话外音和高语境信号`)
  parts.push(`- 符合中国国情（饮食、社交、职场、家庭）`)

  return parts.join('\n')
}

// ============================================================
// 批量校验工具
// ============================================================

/**
 * 批量校验多条回复（用于测试）
 */
export function validateReplies(
  replies: Array<{ content: string; userMessage: string; person?: Person; memories?: Memory[] }>
): ReplyValidationResult[] {
  return replies.map(r =>
    validateReply(r.content, r.userMessage, r.person, r.memories || [])
  )
}
