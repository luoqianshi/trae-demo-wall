'use client'

import { useCountUp } from '../../lib/animation-utils'

/* ============================================================
   AnimatedNumber -- 数字滚动组件
   从 0 到目标值的平滑递增动画
   ============================================================ */

interface AnimatedNumberProps {
  value: number
  duration?: number
  prefix?: string
  suffix?: string
  className?: string
  format?: boolean // 千分位格式化
}

export default function AnimatedNumber({
  value,
  duration = 2000,
  prefix = '',
  suffix = '',
  className = '',
  format = true,
}: AnimatedNumberProps) {
  const { value: current, ref } = useCountUp(value, duration)

  const displayValue = format
    ? current.toLocaleString('zh-CN')
    : String(current)

  return (
    <span ref={ref} className={`tabular-nums ${className}`}>
      {prefix}{displayValue}{suffix}
    </span>
  )
}
