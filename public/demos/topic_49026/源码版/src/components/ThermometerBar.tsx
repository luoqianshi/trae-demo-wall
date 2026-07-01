import { useState } from 'react'
import {
  warmthToColor,
  warmthToColorAlpha,
  warmthLabel,
  warmthOrbGradient,
  warmthGlow,
} from '../lib/warmthColor'

/**
 * WarmthOrb — 暖度光球
 * 用色彩本身表达关系亲密度，替代生硬的数字温度计
 *
 * compact: 小尺寸光球（列表行用）
 * full: 带标签的完整光球（详情页用）
 */

interface WarmthOrbProps {
  /** 温度值 0-100 */
  temperature: number
  /** 人物名称（用于 tooltip） */
  name?: string
  compact?: boolean
}

export function ThermometerBar({ temperature, name, compact = false }: WarmthOrbProps) {
  const [showTooltip, setShowTooltip] = useState(false)
  const temp = Math.max(0, Math.min(100, temperature))
  const label = warmthLabel(temp)
  const orbSize = compact ? 14 : 22

  return (
    <div
      className="relative flex items-center gap-1.5"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      {/* 暖度光球 */}
      <div
        className="rounded-full transition-all duration-500 flex-shrink-0"
        style={{
          width: orbSize,
          height: orbSize,
          background: warmthOrbGradient(temp),
          boxShadow: warmthGlow(temp, compact ? 0.7 : 1),
        }}
      />

      {/* 标签（compact 模式不显示） */}
      {!compact && (
        <div className="flex flex-col items-start">
          <span
            className="text-xs font-medium transition-colors duration-500"
            style={{ color: warmthToColor(temp) }}
          >
            {label}
          </span>
        </div>
      )}

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute z-10 bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1.5 rounded-lg text-[10px] whitespace-nowrap shadow-lg"
          style={{
            background: 'var(--color-ink-primary, #1c1917)',
            color: 'var(--color-surface, #fff)',
          }}
        >
          {name || '关系'} · {label}
        </div>
      )}
    </div>
  )
}

/**
 * WarmthBar — 暖度渐变条
 * 用于详情页：全宽渐变轨道 + 当前位置标记
 */
interface WarmthBarProps {
  temperature: number
}

export function WarmthBar({ temperature }: WarmthBarProps) {
  const temp = Math.max(0, Math.min(100, temperature))
  const label = warmthLabel(temp)

  return (
    <div className="space-y-1.5">
      {/* 渐变轨道 */}
      <div className="relative h-2 rounded-full overflow-hidden">
        {/* 底层：完整冷暖光谱轨道 */}
        <div
          className="absolute inset-0 rounded-full"
          style={{
            background: `linear-gradient(to right,
              hsla(205, 55%, 52%, 0.15) 0%,
              hsla(210, 42%, 55%, 0.15) 18%,
              hsla(160, 40%, 58%, 0.15) 38%,
              hsla(44, 72%, 64%, 0.15) 55%,
              hsla(18, 62%, 60%, 0.15) 78%,
              hsla(11, 82%, 60%, 0.15) 100%
            )`,
          }}
        />
        {/* 填充：从冷端到当前温度 */}
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-500"
          style={{
            width: `${temp}%`,
            background: `linear-gradient(to right,
              hsla(205, 55%, 52%, 0.6),
              ${warmthToColorAlpha(temp, 0.85)}
            )`,
          }}
        />
        {/* 当前位置光点 */}
        <div
          className="absolute top-1/2 -translate-y-1/2 rounded-full transition-all duration-500"
          style={{
            left: `calc(${temp}% - 5px)`,
            width: 10,
            height: 10,
            background: warmthOrbGradient(temp),
            boxShadow: warmthGlow(temp, 1),
          }}
        />
      </div>
      {/* 标签 */}
      <div className="flex items-center justify-between">
        <span className="text-2xs text-ink-muted">疏远</span>
        <span
          className="text-xs font-medium transition-colors duration-500"
          style={{ color: warmthToColor(temp) }}
        >
          {label}
        </span>
        <span className="text-2xs text-ink-muted">亲密</span>
      </div>
    </div>
  )
}

/**
 * 温度趋势迷你图（用于人物卡片展开时）
 * 用色彩点连线，颜色随温度变化
 */
interface TempTrendMiniProps {
  history: number[] // 温度历史值数组
}

export function TempTrendMini({ history }: TempTrendMiniProps) {
  if (history.length < 2) return null

  const width = 120
  const height = 40

  const points = history.map((v, i) => {
    const x = (i / (history.length - 1)) * width
    const y = height - (v / 100) * height
    return { x, y, temp: v }
  })

  const lastTemp = history[history.length - 1]

  // 生成渐变路径
  const pathD = points
    .map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `L ${p.x} ${p.y}`))
    .join(' ')

  return (
    <div className="flex items-center gap-2">
      <svg width={width} height={height} className="overflow-visible">
        <defs>
          <linearGradient id="warmth-trend" x1="0%" y1="0%" x2="100%" y2="0%">
            {points.map((p, i) => (
              <stop
                key={i}
                offset={`${(i / (points.length - 1)) * 100}%`}
                stopColor={warmthToColor(p.temp)}
              />
            ))}
          </linearGradient>
        </defs>
        <path
          d={pathD}
          fill="none"
          stroke="url(#warmth-trend)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 各点用对应温度色 */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r={i === points.length - 1 ? 3 : 2}
            fill={warmthToColor(p.temp)}
          />
        ))}
      </svg>
      <span
        className="text-xs font-medium transition-colors"
        style={{ color: warmthToColor(lastTemp) }}
      >
        {warmthLabel(lastTemp)}
      </span>
    </div>
  )
}
