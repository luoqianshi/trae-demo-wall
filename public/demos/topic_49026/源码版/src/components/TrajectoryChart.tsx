/**
 * 关系轨迹预测图表
 *
 * 企业级技术降维：企业需求预测 / 库存预测 → 个人关系走向推演
 *
 * 在人物详情弹窗中展示：
 * - 历史温度变化曲线（实线）
 * - 预测温度走向（虚线）
 * - 风险等级标识
 * - 预计到达冰点的时间
 * - 修复建议
 */

import {
  TrendingDown, TrendingUp, Minus, AlertTriangle,
  Shield, Clock, Lightbulb, Activity,
} from 'lucide-react'
import type { TrajectoryPrediction, TemperaturePoint } from '../lib/trajectoryPrediction'
import { warmthToColor, warmthLabel, warmthBgGradient } from '../lib/warmthColor'

// ─── 风险等级样式 ───────────────────────────────────────────
const RISK_STYLES: Record<string, { color: string; bg: string; border: string; label: string; icon: typeof Shield }> = {
  safe: { color: 'text-zen-sage', bg: 'bg-zen-sage/10', border: 'border-zen-sage/30', label: '安全', icon: Shield },
  warning: { color: 'text-zen-amber', bg: 'bg-zen-amber/10', border: 'border-zen-amber/30', label: '需关注', icon: AlertTriangle },
  danger: { color: 'text-zen-terracotta', bg: 'bg-zen-terracotta/10', border: 'border-zen-terracotta/30', label: '危险', icon: AlertTriangle },
  critical: { color: 'text-zen-rose', bg: 'bg-zen-rose/10', border: 'border-zen-rose/30', label: '危急', icon: AlertTriangle },
}

// ─── SVG 图表参数 ───────────────────────────────────────────
const CHART_WIDTH = 320
const CHART_HEIGHT = 120
const PADDING = { top: 10, right: 10, bottom: 20, left: 10 }

// ─── 工具函数 ───────────────────────────────────────────────
function formatDate(timestamp: number): string {
  const d = new Date(timestamp)
  return `${d.getMonth() + 1}/${d.getDate()}`
}

function formatDays(days: number): string {
  if (days <= 0) return '已到达冰点'
  if (days < 7) return `${Math.round(days)} 天`
  if (days < 30) return `${Math.round(days / 7)} 周`
  return `${Math.round(days / 30)} 个月`
}

// ─── 迷你 SVG 折线图 ────────────────────────────────────────
function MiniChart({
  historical,
  predicted,
  currentTemp,
}: {
  historical: TemperaturePoint[]
  predicted: TemperaturePoint[]
  currentTemp: number
}) {
  const allPoints = [...historical, ...predicted]
  if (allPoints.length < 2) return null

  const minDate = Math.min(...allPoints.map(p => p.date))
  const maxDate = Math.max(...allPoints.map(p => p.date))
  const dateRange = Math.max(maxDate - minDate, 1)

  const innerW = CHART_WIDTH - PADDING.left - PADDING.right
  const innerH = CHART_HEIGHT - PADDING.top - PADDING.bottom

  // 坐标映射
  const xScale = (date: number) => PADDING.left + ((date - minDate) / dateRange) * innerW
  const yScale = (temp: number) => PADDING.top + (1 - temp / 100) * innerH

  // 历史折线路径
  const histPath = historical
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date).toFixed(1)} ${yScale(p.temperature).toFixed(1)}`)
    .join(' ')

  // 预测折线路径（虚线）
  const lastHist = historical[historical.length - 1]
  const predPoints = lastHist ? [lastHist, ...predicted] : predicted
  const predPath = predPoints
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${xScale(p.date).toFixed(1)} ${yScale(p.temperature).toFixed(1)}`)
    .join(' ')

  // 冰点线（10°）
  const iceLineY = yScale(10)

  return (
    <svg
      viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
      className="w-full"
      style={{ maxHeight: `${CHART_HEIGHT}px` }}
    >
      {/* 背景区域 */}
      <defs>
        <linearGradient id="tempGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={warmthToColor(80)} stopOpacity="0.15" />
          <stop offset="50%" stopColor={warmthToColor(50)} stopOpacity="0.08" />
          <stop offset="100%" stopColor={warmthToColor(20)} stopOpacity="0.03" />
        </linearGradient>
      </defs>

      {/* 冰点线 */}
      <line
        x1={PADDING.left} y1={iceLineY}
        x2={CHART_WIDTH - PADDING.right} y2={iceLineY}
        stroke="rgba(200, 80, 80, 0.3)"
        strokeWidth="1"
        strokeDasharray="3 3"
      />
      <text
        x={CHART_WIDTH - PADDING.right - 2}
        y={iceLineY - 3}
        textAnchor="end"
        fontSize="8"
        fill="rgba(200, 80, 80, 0.5)"
      >
        冰点
      </text>

      {/* 历史区域填充 */}
      {historical.length > 1 && (
        <path
          d={`${histPath} L ${xScale(historical[historical.length - 1].date).toFixed(1)} ${yScale(0).toFixed(1)} L ${xScale(historical[0].date).toFixed(1)} ${yScale(0).toFixed(1)} Z`}
          fill="url(#tempGradient)"
        />
      )}

      {/* 历史折线 */}
      <path
        d={histPath}
        fill="none"
        stroke={warmthToColor(currentTemp)}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* 预测折线（虚线） */}
      {predicted.length > 0 && (
        <path
          d={predPath}
          fill="none"
          stroke={warmthToColor(currentTemp)}
          strokeWidth="1.5"
          strokeDasharray="4 3"
          strokeLinecap="round"
          opacity="0.6"
        />
      )}

      {/* 历史数据点 */}
      {historical.map((p, i) => (
        <circle
          key={`h-${i}`}
          cx={xScale(p.date)}
          cy={yScale(p.temperature)}
          r="2.5"
          fill={warmthToColor(p.temperature)}
        />
      ))}

      {/* 预测数据点 */}
      {predicted.map((p, i) => (
        <circle
          key={`p-${i}`}
          cx={xScale(p.date)}
          cy={yScale(p.temperature)}
          r="2"
          fill="none"
          stroke={warmthToColor(p.temperature)}
          strokeWidth="1.5"
          opacity="0.6"
        />
      ))}

      {/* 当前点高亮 */}
      {lastHist && (
        <circle
          cx={xScale(lastHist.date)}
          cy={yScale(lastHist.temperature)}
          r="4"
          fill={warmthToColor(lastHist.temperature)}
          opacity="0.3"
        />
      )}

      {/* 日期标签 */}
      <text x={PADDING.left} y={CHART_HEIGHT - 5} fontSize="8" fill="rgba(120, 120, 120, 0.6)">
        {formatDate(minDate)}
      </text>
      <text x={CHART_WIDTH - PADDING.right} y={CHART_HEIGHT - 5} fontSize="8" fill="rgba(120, 120, 120, 0.6)" textAnchor="end">
        {formatDate(maxDate)}
      </text>
    </svg>
  )
}

// ─── 主组件 ─────────────────────────────────────────────────
interface TrajectoryChartProps {
  prediction: TrajectoryPrediction
}

export function TrajectoryChart({ prediction }: TrajectoryChartProps) {
  const risk = RISK_STYLES[prediction.riskLevel] || RISK_STYLES.safe
  const RiskIcon = risk.icon
  const currentTemp = prediction.currentTemperature

  const trendIcon = prediction.trend === 'rising'
    ? <TrendingUp className="w-3.5 h-3.5 text-zen-sage" />
    : prediction.trend === 'falling'
    ? <TrendingDown className="w-3.5 h-3.5 text-zen-rose" />
    : <Minus className="w-3.5 h-3.5 text-ink-muted" />

  return (
    <div className="space-y-3">
      {/* === 预测概要 === */}
      <div
        className="rounded-xl p-3.5 border border-ink-muted/10"
        style={{ background: warmthBgGradient(currentTemp, 0.35) }}
      >
        <div className="flex items-center justify-between mb-2 relative z-10">
          <div className="flex items-center gap-2">
            <Activity className="w-4 h-4 text-ink-tertiary" />
            <span className="text-xs font-medium text-ink-secondary">关系走向预测</span>
          </div>
          <span className={`inline-flex items-center gap-1 text-2xs px-2 py-0.5 rounded-full ${risk.bg} ${risk.color}`}>
            <RiskIcon className="w-3 h-3" />
            {risk.label}
          </span>
        </div>

        {/* 当前温度 + 趋势 */}
        <div className="flex items-center gap-3 mb-2 relative z-10">
          <div>
            <p className="text-2xs text-ink-tertiary">当前温度</p>
            <p className="text-sm font-medium" style={{ color: warmthToColor(currentTemp) }}>
              {warmthLabel(currentTemp)}
            </p>
          </div>
          <div className="flex items-center gap-1">
            {trendIcon}
            <span className="text-2xs text-ink-tertiary">
              {prediction.trendVelocity > 0 ? '+' : ''}{prediction.trendVelocity.toFixed(1)}°/周
            </span>
          </div>
        </div>

        {/* 预测摘要 */}
        <p className="text-xs text-ink-secondary leading-relaxed relative z-10">
          {prediction.predictionSummary}
        </p>
      </div>

      {/* === 预测图表 === */}
      <div className="bg-surface border border-ink-muted/10 rounded-xl p-3.5">
        <MiniChart
          historical={prediction.historicalPoints}
          predicted={prediction.predictedPoints}
          currentTemp={currentTemp}
        />
        {/* 图例 */}
        <div className="flex items-center justify-center gap-4 mt-1">
          <span className="flex items-center gap-1 text-2xs text-ink-tertiary">
            <span className="w-3 h-0.5 rounded-full" style={{ background: warmthToColor(currentTemp) }} />
            历史温度
          </span>
          <span className="flex items-center gap-1 text-2xs text-ink-tertiary">
            <span className="w-3 h-0.5 rounded-full border-t border-dashed" style={{ borderColor: warmthToColor(currentTemp) }} />
            预测走向
          </span>
        </div>
      </div>

      {/* === 冰点预警 === */}
      {prediction.daysToCritical != null && prediction.daysToCritical > 0 && prediction.riskLevel !== 'safe' && (
        <div className={`rounded-xl p-3 border ${risk.border} ${risk.bg}`}>
          <div className="flex items-center gap-2 mb-1">
            <Clock className={`w-3.5 h-3.5 ${risk.color}`} />
            <span className={`text-xs font-medium ${risk.color}`}>冰点预警</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">
            按当前趋势，预计 <span className={`font-medium ${risk.color}`}>{formatDays(prediction.daysToCritical)}</span> 后关系温度将降至冰点（10°以下）。
            建议尽快采取行动修复关系。
          </p>
        </div>
      )}

      {/* === 修复建议 === */}
      {prediction.recommendation && prediction.riskLevel !== 'safe' && (
        <div className="bg-zen-sage/5 border border-zen-sage/20 rounded-xl p-3.5">
          <div className="flex items-center gap-1.5 mb-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-zen-sage" />
            <span className="text-xs font-medium text-zen-sage">修复建议</span>
          </div>
          <p className="text-xs text-ink-secondary leading-relaxed">{prediction.recommendation}</p>
        </div>
      )}
    </div>
  )
}
