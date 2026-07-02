'use client'

import { useState, useMemo } from 'react'
import { Card, CardContent } from '../../../../components/ui/Card'
import { AlertTriangle, Info, Shield, Flame } from 'lucide-react'
import type { Task } from '../../../../lib/api'

// ============ 类型定义 ============

/** 风险数据项：每个任务的风险计算结果 */
interface RiskData {
  taskId: string
  title: string
  /** 时间紧迫度 0~1 */
  timeUrgency: number
  /** 进度偏差 0~1 */
  progressDeviation: number
  /** 综合风险 = 时间紧迫度*0.4 + 进度偏差*0.6 */
  overallRisk: number
  /** 风险等级 */
  level: 'low' | 'medium' | 'high' | 'critical'
  /** 剩余天数 */
  daysRemaining: number
  /** 总天数 */
  totalDays: number
  /** 实际进度百分比 */
  actualProgress: number
  /** 预期进度百分比 */
  expectedProgress: number
}

/** 风险等级配置 */
interface RiskLevelConfig {
  label: string
  color: string          // 色块背景色
  textColor: string      // 色块文字色
  borderColor: string    // 边框色
  glowColor: string      // 悬停发光色
  icon: React.ReactNode
}

/** 风险热力图组件属性 */
interface RiskHeatmapProps {
  /** 任务列表 */
  tasks: Task[]
  /** 计划截止日期（ISO 字符串） */
  planDeadline: string
  /** 计划开始日期（ISO 字符串），可选 */
  planStartDate?: string
  /** 计划总字数 */
  totalWords?: number
  /** 已完成总字数 */
  completedWords?: number
}

// ============ 常量与配置 ============

/** 风险等级阈值 */
const RISK_THRESHOLDS = {
  low: 0.25,       // < 0.25 为低风险
  medium: 0.5,     // 0.25 ~ 0.5 为中风险
  high: 0.75,      // 0.5 ~ 0.75 为高风险
  // >= 0.75 为极高风险
} as const

/** 各风险等级的视觉配置（赭石色系） */
const RISK_LEVEL_STYLES: Record<string, RiskLevelConfig> = {
  low: {
    label: '低',
    color: 'bg-[#4A7C59]',       // 古绿
    textColor: 'text-[#4A7C59]',
    borderColor: 'border-[#4A7C59]',
    glowColor: 'rgba(74, 124, 89, 0.15)',
    icon: <Shield className="w-3.5 h-3.5" />,
  },
  medium: {
    label: '中',
    color: 'bg-[#C4A24E]',       // 古黄
    textColor: 'text-[#C4A24E]',
    borderColor: 'border-[#C4A24E]',
    glowColor: 'rgba(196, 162, 78, 0.15)',
    icon: <Info className="w-3.5 h-3.5" />,
  },
  high: {
    label: '高',
    color: 'bg-[#C46B3C]',       // 赭橙
    textColor: 'text-[#C46B3C]',
    borderColor: 'border-[#C46B3C]',
    glowColor: 'rgba(196, 107, 60, 0.15)',
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
  critical: {
    label: '极高',
    color: 'bg-[#8B3A3A]',       // 深赭红
    textColor: 'text-[#8B3A3A]',
    borderColor: 'border-[#8B3A3A]',
    glowColor: 'rgba(139, 58, 58, 0.15)',
    icon: <Flame className="w-3.5 h-3.5" />,
  },
}

// ============ 工具函数 ============

/**
 * 根据风险值判定风险等级
 * @param risk 风险值 0~1
 */
function getRiskLevel(risk: number): 'low' | 'medium' | 'high' | 'critical' {
  if (risk < RISK_THRESHOLDS.low) return 'low'
  if (risk < RISK_THRESHOLDS.medium) return 'medium'
  if (risk < RISK_THRESHOLDS.high) return 'high'
  return 'critical'
}

/**
 * 根据风险值返回色块背景色的渐变透明度版本
 * 用于在热力图格子中展示不同深浅
 */
function getHeatColor(risk: number): string {
  if (risk < RISK_THRESHOLDS.low) return 'rgba(74, 124, 89, 0.15)'       // 低风险浅绿
  if (risk < RISK_THRESHOLDS.medium) return 'rgba(196, 162, 78, 0.25)'  // 中风险浅黄
  if (risk < RISK_THRESHOLDS.high) return 'rgba(196, 107, 60, 0.35)'    // 高风险浅橙
  return 'rgba(139, 58, 58, 0.45)'                                       // 极高风险浅红
}

/**
 * 根据风险值返回文字颜色
 */
function getHeatTextColor(risk: number): string {
  if (risk < RISK_THRESHOLDS.low) return '#3D6B4A'
  if (risk < RISK_THRESHOLDS.medium) return '#A3852E'
  if (risk < RISK_THRESHOLDS.high) return '#A3552E'
  return '#7A2E2E'
}

/**
 * 生成针对某任务风险的 AI 建议
 */
function generateRiskSuggestion(risk: RiskData): string {
  const suggestions: string[] = []

  // 根据时间紧迫度给建议
  if (risk.timeUrgency >= 0.75) {
    suggestions.push('时间极度紧迫，建议立即集中精力推进此任务')
  } else if (risk.timeUrgency >= 0.5) {
    suggestions.push('剩余时间不足一半，需加快进度')
  }

  // 根据进度偏差给建议
  if (risk.progressDeviation >= 0.75) {
    suggestions.push('进度严重落后，考虑调整目标或寻求协助')
  } else if (risk.progressDeviation >= 0.5) {
    suggestions.push('进度明显滞后，建议增加每日投入')
  } else if (risk.progressDeviation >= 0.25) {
    suggestions.push('进度略有偏差，注意保持节奏')
  }

  // 根据综合风险给建议
  if (risk.overallRisk >= 0.75) {
    suggestions.push('综合风险极高，优先处理此任务')
  }

  if (suggestions.length === 0) {
    suggestions.push('风险可控，继续保持当前节奏')
  }

  return suggestions.join('；')
}

// ============ 主组件 ============

export default function RiskHeatmap({
  tasks,
  planDeadline,
  planStartDate,
  totalWords = 0,
  completedWords = 0,
}: RiskHeatmapProps) {
  // 当前悬停的任务 ID（用于显示 tooltip）
  const [hoveredCell, setHoveredCell] = useState<{
    taskId: string
    dimension: 'time' | 'progress' | 'overall'
  } | null>(null)

  // 计算所有任务的风险数据
  const riskDataList = useMemo<RiskData[]>(() => {
    const now = Date.now()
    const planEnd = new Date(planDeadline).getTime()
    const planStart = planStartDate
      ? new Date(planStartDate).getTime()
      : new Date(new Date(planDeadline).getTime() - 30 * 24 * 60 * 60 * 1000).getTime() // 默认30天
    const planTotalDays = Math.max(1, Math.ceil((planEnd - planStart) / (1000 * 60 * 60 * 24)))
    const planElapsedDays = Math.max(0, Math.ceil((now - planStart) / (1000 * 60 * 60 * 24)))
    const planExpectedProgress = Math.min(1, planElapsedDays / planTotalDays)

    return tasks.map((task) => {
      // 任务截止日期，默认使用计划截止日期
      const taskDeadline = task.deadline || planDeadline
      const taskEnd = new Date(taskDeadline).getTime()
      const taskStart = planStart
      const taskTotalDays = Math.max(1, Math.ceil((taskEnd - taskStart) / (1000 * 60 * 60 * 24)))
      const daysRemaining = Math.ceil((taskEnd - now) / (1000 * 60 * 60 * 24))

      // 时间紧迫度 = max(0, 1 - 剩余天数/总天数)
      const timeUrgency = Math.max(0, Math.min(1, 1 - daysRemaining / taskTotalDays))

      // 实际进度：基于字数完成情况
      const actualProgress = task.targetWords > 0
        ? Math.min(1, task.completedWords / task.targetWords)
        : task.status === 'completed' ? 1 : 0

      // 预期进度：基于时间流逝比例
      const taskElapsed = Math.max(0, Math.ceil((now - taskStart) / (1000 * 60 * 60 * 24)))
      const expectedProgress = Math.min(1, taskElapsed / taskTotalDays)

      // 进度偏差 = max(0, 1 - 实际进度/预期进度)
      const progressDeviation = expectedProgress > 0
        ? Math.max(0, Math.min(1, 1 - actualProgress / expectedProgress))
        : 0

      // 综合风险 = 时间紧迫度 * 0.4 + 进度偏差 * 0.6
      const overallRisk = Math.min(1, timeUrgency * 0.4 + progressDeviation * 0.6)

      return {
        taskId: task.id,
        title: task.title,
        timeUrgency,
        progressDeviation,
        overallRisk,
        level: getRiskLevel(overallRisk),
        daysRemaining,
        totalDays: taskTotalDays,
        actualProgress,
        expectedProgress,
      }
    })
  }, [tasks, planDeadline, planStartDate])

  // 计算整体风险摘要
  const summary = useMemo(() => {
    if (riskDataList.length === 0) {
      return {
        avgOverallRisk: 0,
        avgTimeUrgency: 0,
        avgProgressDeviation: 0,
        criticalCount: 0,
        highCount: 0,
        mediumCount: 0,
        lowCount: 0,
        overallLevel: 'low' as const,
      }
    }

    const avgOverallRisk = riskDataList.reduce((s, r) => s + r.overallRisk, 0) / riskDataList.length
    const avgTimeUrgency = riskDataList.reduce((s, r) => s + r.timeUrgency, 0) / riskDataList.length
    const avgProgressDeviation = riskDataList.reduce((s, r) => s + r.progressDeviation, 0) / riskDataList.length
    const criticalCount = riskDataList.filter(r => r.level === 'critical').length
    const highCount = riskDataList.filter(r => r.level === 'high').length
    const mediumCount = riskDataList.filter(r => r.level === 'medium').length
    const lowCount = riskDataList.filter(r => r.level === 'low').length

    return {
      avgOverallRisk,
      avgTimeUrgency,
      avgProgressDeviation,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      overallLevel: getRiskLevel(avgOverallRisk),
    }
  }, [riskDataList])

  // 生成整体 AI 建议
  const aiSuggestions = useMemo(() => {
    const suggestions: string[] = []

    if (summary.criticalCount > 0) {
      suggestions.push(
        `有 ${summary.criticalCount} 个任务处于极高风险状态，建议立即优先处理，必要时调整截止日期或缩减范围。`
      )
    }
    if (summary.highCount > 0) {
      suggestions.push(
        `${summary.highCount} 个任务风险较高，需密切关注进度并增加每日投入时间。`
      )
    }
    if (summary.avgProgressDeviation > 0.4) {
      suggestions.push(
        '整体进度偏差较大，建议重新评估任务优先级，集中资源攻克关键任务。'
      )
    }
    if (summary.avgTimeUrgency > 0.6) {
      suggestions.push(
        '时间紧迫度偏高，建议采用番茄工作法等高效策略提升产出。'
      )
    }
    if (suggestions.length === 0) {
      suggestions.push('当前各任务风险总体可控，保持稳定节奏即可。')
    }

    return suggestions
  }, [summary])

  // 无任务时显示空状态
  if (tasks.length === 0) {
    return (
      <Card className="mb-6">
        <CardContent>
          <div className="text-center py-8">
            <Shield className="w-8 h-8 text-[#B5A99A] mx-auto mb-2" />
            <p className="text-sm text-[#8A7E74]">暂无任务数据，添加任务后可查看风险热力图</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="mb-6">
      {/* 热力图标题 */}
      <div className="flex items-center gap-2 mb-3">
        <AlertTriangle className="w-5 h-5 text-[#8B5E3C]" />
        <h2 className="text-lg font-semibold text-[#2C2420]">风险热力图</h2>
        <span className={`text-xs px-2 py-0.5 rounded-full border ${
          RISK_LEVEL_STYLES[summary.overallLevel].borderColor
        } ${RISK_LEVEL_STYLES[summary.overallLevel].textColor}`}>
          整体{RISK_LEVEL_STYLES[summary.overallLevel].label}风险
        </span>
      </div>

      {/* 热力图主体 */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          {/* 表头 */}
          <div className="grid grid-cols-[1fr_100px_100px_100px] gap-0 border-b border-[#E5DDD4]">
            <div className="px-4 py-3 text-xs font-medium text-[#5A5048] bg-[#F8F5F0]">
              任务名称
            </div>
            <div className="px-3 py-3 text-xs font-medium text-[#5A5048] bg-[#F8F5F0] text-center">
              时间紧迫度
            </div>
            <div className="px-3 py-3 text-xs font-medium text-[#5A5048] bg-[#F8F5F0] text-center">
              进度偏差
            </div>
            <div className="px-3 py-3 text-xs font-medium text-[#5A5048] bg-[#F8F5F0] text-center">
              综合风险
            </div>
          </div>

          {/* 任务行 */}
          {riskDataList.map((risk, index) => (
            <div
              key={risk.taskId}
              className={`grid grid-cols-[1fr_100px_100px_100px] gap-0 ${
                index < riskDataList.length - 1 ? 'border-b border-[#F0EBE5]' : ''
              }`}
            >
              {/* 任务名称列 */}
              <div className="px-4 py-3 flex items-center min-w-0">
                <span className="text-sm text-[#2C2420] truncate" title={risk.title}>
                  {risk.title}
                </span>
                <span className={`ml-2 flex-shrink-0 text-xs px-1.5 py-0.5 rounded ${RISK_LEVEL_STYLES[risk.level].color} text-white`}>
                  {RISK_LEVEL_STYLES[risk.level].label}
                </span>
              </div>

              {/* 时间紧迫度色块 */}
              <div
                className="relative px-3 py-3 flex items-center justify-center cursor-pointer transition-colors"
                style={{ backgroundColor: getHeatColor(risk.timeUrgency) }}
                onMouseEnter={() => setHoveredCell({ taskId: risk.taskId, dimension: 'time' })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <span className="text-sm font-medium" style={{ color: getHeatTextColor(risk.timeUrgency) }}>
                  {(risk.timeUrgency * 100).toFixed(0)}%
                </span>

                {/* 悬停提示 */}
                {hoveredCell?.taskId === risk.taskId && hoveredCell.dimension === 'time' && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-[#2C2420] text-white text-xs rounded-lg shadow-xl">
                    <div className="font-medium mb-1.5 text-[#C4A882]">时间紧迫度详情</div>
                    <div className="space-y-1 text-[#E5DDD4]">
                      <div>剩余天数：{risk.daysRemaining} 天 / 共 {risk.totalDays} 天</div>
                      <div>紧迫度值：{(risk.timeUrgency * 100).toFixed(1)}%</div>
                      <div className="pt-1 border-t border-[#5A5048] text-[#C4A882]">
                        {risk.daysRemaining < 0
                          ? '已逾期，需立即完成'
                          : risk.daysRemaining === 0
                          ? '今天到期，最后冲刺'
                          : risk.timeUrgency >= 0.75
                          ? '时间极度紧迫'
                          : risk.timeUrgency >= 0.5
                          ? '时间较为紧张'
                          : '时间充裕'}
                      </div>
                    </div>
                    {/* 小三角 */}
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="w-2 h-2 bg-[#2C2420] rotate-45" />
                    </div>
                  </div>
                )}
              </div>

              {/* 进度偏差色块 */}
              <div
                className="relative px-3 py-3 flex items-center justify-center cursor-pointer transition-colors"
                style={{ backgroundColor: getHeatColor(risk.progressDeviation) }}
                onMouseEnter={() => setHoveredCell({ taskId: risk.taskId, dimension: 'progress' })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <span className="text-sm font-medium" style={{ color: getHeatTextColor(risk.progressDeviation) }}>
                  {(risk.progressDeviation * 100).toFixed(0)}%
                </span>

                {/* 悬停提示 */}
                {hoveredCell?.taskId === risk.taskId && hoveredCell.dimension === 'progress' && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-3 bg-[#2C2420] text-white text-xs rounded-lg shadow-xl">
                    <div className="font-medium mb-1.5 text-[#C4A882]">进度偏差详情</div>
                    <div className="space-y-1 text-[#E5DDD4]">
                      <div>实际进度：{(risk.actualProgress * 100).toFixed(1)}%</div>
                      <div>预期进度：{(risk.expectedProgress * 100).toFixed(1)}%</div>
                      <div>偏差值：{(risk.progressDeviation * 100).toFixed(1)}%</div>
                      <div className="pt-1 border-t border-[#5A5048] text-[#C4A882]">
                        {risk.progressDeviation >= 0.75
                          ? '进度严重落后，需紧急追赶'
                          : risk.progressDeviation >= 0.5
                          ? '进度明显滞后，建议加速'
                          : risk.progressDeviation >= 0.25
                          ? '进度略有偏差，注意保持'
                          : '进度良好，符合预期'}
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="w-2 h-2 bg-[#2C2420] rotate-45" />
                    </div>
                  </div>
                )}
              </div>

              {/* 综合风险色块 */}
              <div
                className="relative px-3 py-3 flex items-center justify-center cursor-pointer transition-colors"
                style={{ backgroundColor: getHeatColor(risk.overallRisk) }}
                onMouseEnter={() => setHoveredCell({ taskId: risk.taskId, dimension: 'overall' })}
                onMouseLeave={() => setHoveredCell(null)}
              >
                <span className="text-sm font-bold" style={{ color: getHeatTextColor(risk.overallRisk) }}>
                  {(risk.overallRisk * 100).toFixed(0)}%
                </span>

                {/* 悬停提示 */}
                {hoveredCell?.taskId === risk.taskId && hoveredCell.dimension === 'overall' && (
                  <div className="absolute z-20 bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 p-3 bg-[#2C2420] text-white text-xs rounded-lg shadow-xl">
                    <div className="font-medium mb-1.5 text-[#C4A882]">综合风险评估</div>
                    <div className="space-y-1 text-[#E5DDD4]">
                      <div>综合风险值：{(risk.overallRisk * 100).toFixed(1)}%</div>
                      <div>风险等级：{RISK_LEVEL_STYLES[risk.level].label}</div>
                      <div>计算公式：紧迫度 x 0.4 + 偏差 x 0.6</div>
                      <div className="pt-1.5 border-t border-[#5A5048]">
                        <div className="text-[#C4A882] font-medium mb-0.5">AI 建议：</div>
                        <div className="text-[#E5DDD4]">{generateRiskSuggestion(risk)}</div>
                      </div>
                    </div>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-px">
                      <div className="w-2 h-2 bg-[#2C2420] rotate-45" />
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* 图例 */}
      <div className="flex items-center gap-4 mt-3 px-1">
        <span className="text-xs text-[#8A7E74]">图例：</span>
        {Object.entries(RISK_LEVEL_STYLES).map(([key, config]) => (
          <div key={key} className="flex items-center gap-1">
            <div className={`w-3 h-3 rounded-sm ${config.color}`} />
            <span className="text-xs text-[#5A5048]">{config.label}风险</span>
          </div>
        ))}
      </div>

      {/* 总体风险摘要与 AI 建议 */}
      <Card className="mt-4">
        <CardContent>
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-[#8B5E3C]" />
            <span className="text-sm font-medium text-[#2C2420]">总体风险摘要</span>
          </div>

          {/* 风险分布统计 */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            <div className="text-center p-2 rounded-lg bg-[#F8F5F0]">
              <div className="text-lg font-bold text-[#8B3A3A]">{summary.criticalCount}</div>
              <div className="text-xs text-[#8A7E74]">极高风险</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#F8F5F0]">
              <div className="text-lg font-bold text-[#C46B3C]">{summary.highCount}</div>
              <div className="text-xs text-[#8A7E74]">高风险</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#F8F5F0]">
              <div className="text-lg font-bold text-[#C4A24E]">{summary.mediumCount}</div>
              <div className="text-xs text-[#8A7E74]">中风险</div>
            </div>
            <div className="text-center p-2 rounded-lg bg-[#F8F5F0]">
              <div className="text-lg font-bold text-[#4A7C59]">{summary.lowCount}</div>
              <div className="text-xs text-[#8A7E74]">低风险</div>
            </div>
          </div>

          {/* 平均风险指标 */}
          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#F0EBE5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${summary.avgTimeUrgency * 100}%`,
                    backgroundColor: getHeatTextColor(summary.avgTimeUrgency),
                  }}
                />
              </div>
              <span className="text-xs text-[#8A7E74] w-20 text-right">
                平均紧迫 {(summary.avgTimeUrgency * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#F0EBE5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${summary.avgProgressDeviation * 100}%`,
                    backgroundColor: getHeatTextColor(summary.avgProgressDeviation),
                  }}
                />
              </div>
              <span className="text-xs text-[#8A7E74] w-20 text-right">
                平均偏差 {(summary.avgProgressDeviation * 100).toFixed(0)}%
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-2 bg-[#F0EBE5] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${summary.avgOverallRisk * 100}%`,
                    backgroundColor: getHeatTextColor(summary.avgOverallRisk),
                  }}
                />
              </div>
              <span className="text-xs text-[#8A7E74] w-20 text-right">
                综合风险 {(summary.avgOverallRisk * 100).toFixed(0)}%
              </span>
            </div>
          </div>

          {/* AI 建议 */}
          <div className="bg-[#F8F5F0] rounded-lg p-3 border border-[#E5DDD4]">
            <div className="flex items-center gap-1.5 mb-2">
              <span className="text-xs font-medium text-[#8B5E3C]">AI 风险建议</span>
            </div>
            <ul className="space-y-1.5">
              {aiSuggestions.map((suggestion, index) => (
                <li key={index} className="flex items-start gap-2 text-xs text-[#5A5048]">
                  <span className="flex-shrink-0 w-1 h-1 rounded-full bg-[#8B5E3C] mt-1.5" />
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
