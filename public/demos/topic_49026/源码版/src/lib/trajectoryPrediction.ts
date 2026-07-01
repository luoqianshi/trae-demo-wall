/**
 * 时序关系预测 — 关系走向推演
 *
 * 企业级技术降维：企业需求预测 / 库存预测 → 个人关系走向推演
 *
 * 核心思路：
 * - 企业级：用历史销售数据预测未来需求趋势
 * - 个人降维：用历史互动数据预测关系温度走向
 * - 不只说"现在温度 18°"，而是说"预计 2 周后降至 10°（冰点）"
 *
 * 实现：
 * 1. 从互动记录构建温度时间序列
 * 2. 计算互动频率变化趋势
 * 3. 用线性回归 + 指数衰减模型预测未来温度
 * 4. 生成预测曲线和风险预警
 */

import type { Person, Memory } from '../types'

// ─── 类型定义 ───────────────────────────────────────────────

export interface TemperaturePoint {
  date: number
  temperature: number
  source: 'actual' | 'predicted'
  confidence?: number // 0-1，预测置信度
}

export interface TrajectoryPrediction {
  personId: string
  personName: string
  currentTemperature: number
  historicalPoints: TemperaturePoint[]
  predictedPoints: TemperaturePoint[]
  trend: 'rising' | 'falling' | 'stable'
  trendVelocity: number // 每周温度变化率
  riskLevel: 'safe' | 'warning' | 'danger' | 'critical'
  daysToCritical: number | null // 预计多少天后到达冰点（<10°）
  predictionSummary: string
  recommendation: string
}

// ─── 温度时间序列构建 ───────────────────────────────────────

/**
 * 从互动记录构建温度时间序列
 */
function buildTemperatureSeries(
  person: Person,
  memories: Memory[],
): TemperaturePoint[] {
  const points: TemperaturePoint[] = []
  const now = Date.now()

  // 获取与该人物相关的记忆，按时间排序
  const personMemories = memories
    .filter(m => (m.relatedPersonIds || []).includes(person.id))
    .sort((a, b) => (a.timestamp || a.createdAt || 0) - (b.timestamp || b.createdAt || 0))

  if (personMemories.length === 0) {
    // 无历史数据，用当前温度作为起点
    points.push({
      date: now - 30 * 24 * 60 * 60 * 1000, // 30天前
      temperature: person.sentiment + 10, // 假设过去略高
      source: 'actual',
    })
    points.push({
      date: now,
      temperature: person.sentiment,
      source: 'actual',
    })
    return points
  }

  // 从最早的记忆开始，模拟温度变化
  let temp = person.sentiment + 15 // 假设过去温度更高
  const startDate = personMemories[0].timestamp || personMemories[0].createdAt || now

  points.push({
    date: startDate,
    temperature: Math.min(100, temp),
    source: 'actual',
  })

  for (const memory of personMemories) {
    const memDate = memory.timestamp || memory.createdAt || now
    const sentiment = analyzeMemoryImpact(memory)
    temp += sentiment

    // 自然衰减：每7天衰减1度（如果不互动）
    const daysSinceLast = points.length > 0
      ? Math.floor((memDate - points[points.length - 1].date) / (24 * 60 * 60 * 1000))
      : 0
    temp -= Math.min(daysSinceLast / 7, 5)

    temp = Math.max(0, Math.min(100, temp))
    points.push({
      date: memDate,
      temperature: Math.round(temp),
      source: 'actual',
    })
  }

  // 确保最后一个点是当前温度
  if (points.length > 0) {
    points[points.length - 1].temperature = person.sentiment
  }

  return points
}

function analyzeMemoryImpact(memory: Memory): number {
  const content = (memory.content || '').toLowerCase()

  if (/冲突|矛盾|争执|打回|拒绝|批评|不满|抱怨|失望|生气|冷淡|疏远|对立|质疑/.test(content)) {
    return -5
  }
  if (/合作|愉快|感谢|开心|信任|亲密|温暖|支持|帮助|认可|赞赏/.test(content)) {
    return +3
  }
  return 0
}

// ─── 预测模型 ───────────────────────────────────────────────

/**
 * 线性回归 + 指数衰减混合预测
 */
function predictTemperature(
  historical: TemperaturePoint[],
  currentTemp: number,
  daysToPredict: number,
): TemperaturePoint[] {
  const predictions: TemperaturePoint[] = []
  const now = Date.now()

  if (historical.length < 2) {
    // 数据不足，用简单衰减
    const decayRate = 0.5 // 每周衰减0.5度
    for (let day = 7; day <= daysToPredict; day += 7) {
      const predicted = Math.max(0, currentTemp - (decayRate * day / 7))
      predictions.push({
        date: now + day * 24 * 60 * 60 * 1000,
        temperature: Math.round(predicted),
        source: 'predicted',
        confidence: Math.max(0.3, 0.7 - day / (daysToPredict * 1.5)),
      })
    }
    return predictions
  }

  // 计算温度变化率（线性回归斜率）
  const recentPoints = historical.slice(-5) // 最近5个点
  const n = recentPoints.length
  const sumX = recentPoints.reduce((sum, _, i) => sum + i, 0)
  const sumY = recentPoints.reduce((sum, p) => sum + p.temperature, 0)
  const sumXY = recentPoints.reduce((sum, p, i) => sum + i * p.temperature, 0)
  const sumX2 = recentPoints.reduce((sum, _, i) => sum + i * i, 0)

  const slope = n * sumXY - sumX * sumY !== 0
    ? (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX)
    : 0

  // 每个点的平均时间间隔（天）
  const avgInterval = n > 1
    ? Math.floor((recentPoints[n - 1].date - recentPoints[0].date) / (n - 1) / (24 * 60 * 60 * 1000))
    : 7
  const intervalDays = Math.max(1, avgInterval)

  // 转换为每周变化率
  const weeklyVelocity = slope * (7 / intervalDays)

  // 指数衰减因子（关系自然冷却）
  const decayFactor = 0.95 // 每周保留95%的温度

  let predicted = currentTemp
  for (let day = 7; day <= daysToPredict; day += 7) {
    // 混合模型：线性趋势 + 指数衰减
    const linearComponent = currentTemp + weeklyVelocity * (day / 7)
    const decayComponent = predicted * decayFactor
    predicted = (linearComponent * 0.6 + decayComponent * 0.4)

    // 置信度随时间递减
    const confidence = Math.max(0.2, 0.8 - (day / daysToPredict) * 0.5)

    predictions.push({
      date: now + day * 24 * 60 * 60 * 1000,
      temperature: Math.round(Math.max(0, Math.min(100, predicted))),
      source: 'predicted',
      confidence: Math.round(confidence * 100) / 100,
    })
  }

  return predictions
}

// ─── 主入口 ─────────────────────────────────────────────────

/**
 * 预测关系温度走向
 */
export function predictTrajectory(
  person: Person,
  memories: Memory[],
  daysToPredict: number = 90, // 默认预测90天
): TrajectoryPrediction {
  const historical = buildTemperatureSeries(person, memories)
  const currentTemp = person.sentiment

  const predicted = predictTemperature(historical, currentTemp, daysToPredict)

  // 计算趋势
  const weeklyVelocity = predicted.length > 0
    ? (predicted[0].temperature - currentTemp) // 一周后的变化
    : 0

  let trend: 'rising' | 'falling' | 'stable' = 'stable'
  if (weeklyVelocity > 2) trend = 'rising'
  else if (weeklyVelocity < -2) trend = 'falling'

  // 风险等级
  let riskLevel: 'safe' | 'warning' | 'danger' | 'critical' = 'safe'
  if (currentTemp < 20) riskLevel = 'critical'
  else if (currentTemp < 35) riskLevel = 'danger'
  else if (currentTemp < 50 && trend === 'falling') riskLevel = 'warning'
  else if (trend === 'falling' && weeklyVelocity < -5) riskLevel = 'warning'

  // 计算到达冰点（10°）的天数
  let daysToCritical: number | null = null
  if (trend === 'falling') {
    for (const point of predicted) {
      if (point.temperature <= 10) {
        daysToCritical = Math.floor((point.date - Date.now()) / (24 * 60 * 60 * 1000))
        break
      }
    }
  }

  // 生成预测摘要
  const predictionSummary = generatePredictionSummary(
    person, currentTemp, trend, weeklyVelocity, riskLevel, daysToCritical, predicted
  )

  // 生成建议
  const recommendation = generateTrajectoryRecommendation(person, trend, riskLevel, daysToCritical)

  return {
    personId: person.id,
    personName: person.name,
    currentTemperature: currentTemp,
    historicalPoints: historical,
    predictedPoints: predicted,
    trend,
    trendVelocity: Math.round(weeklyVelocity * 10) / 10,
    riskLevel,
    daysToCritical,
    predictionSummary,
    recommendation,
  }
}

function generatePredictionSummary(
  person: Person,
  currentTemp: number,
  trend: string,
  velocity: number,
  riskLevel: string,
  daysToCritical: number | null,
  predicted: TemperaturePoint[],
): string {
  const parts: string[] = []

  parts.push(`${person.name}当前温度 ${currentTemp}°`)

  if (trend === 'falling') {
    parts.push(`，每周下降 ${Math.abs(velocity).toFixed(1)}°`)
  } else if (trend === 'rising') {
    parts.push(`，每周上升 ${velocity.toFixed(1)}°`)
  } else {
    parts.push('，趋势平稳')
  }

  // 30天后的预测
  const day30 = predicted.find(p =>
    Math.floor((p.date - Date.now()) / (24 * 60 * 60 * 1000)) >= 28
  )
  if (day30) {
    parts.push(`。预计30天后：${day30.temperature}°`)
  }

  if (daysToCritical !== null) {
    parts.push(`。⚠️ 预计 ${daysToCritical} 天后到达冰点（10°），需立即干预`)
  }

  const riskMap: Record<string, string> = {
    safe: '🟢 安全',
    warning: '🟡 预警',
    danger: '🔴 危险',
    critical: '🔴🔴 紧急',
  }
  parts.push(`。风险等级：${riskMap[riskLevel]}`)

  return parts.join('')
}

function generateTrajectoryRecommendation(
  person: Person,
  trend: string,
  riskLevel: string,
  daysToCritical: number | null,
): string {
  if (riskLevel === 'critical') {
    return `关系已处于冰点区。${daysToCritical ? `预计 ${daysToCritical} 天后进一步恶化。` : ''}建议立即安排面对面沟通，寻找关系修复的突破口。`
  }

  if (riskLevel === 'danger') {
    return '关系温度过低，建议在未来一周内主动联系，安排非正式互动（如吃饭、咖啡）。'
  }

  if (riskLevel === 'warning' && trend === 'falling') {
    return '关系有降温趋势，建议近期增加互动频率，防止进一步下滑。'
  }

  if (trend === 'rising') {
    return '关系正在升温，保持当前互动节奏，可以考虑深化关系。'
  }

  return '关系状态平稳，保持定期互动即可。'
}

// ─── 批量预测 ───────────────────────────────────────────────

/**
 * 批量预测所有人物的温度走向
 */
export function predictAllTrajectories(
  people: Person[],
  memories: Memory[],
): TrajectoryPrediction[] {
  return people
    .map(person => predictTrajectory(person, memories))
    .sort((a, b) => {
      // 按风险等级排序：critical > danger > warning > safe
      const riskOrder = { critical: 0, danger: 1, warning: 2, safe: 3 }
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel]
    })
}
