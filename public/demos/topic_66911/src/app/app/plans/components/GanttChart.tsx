'use client'

import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import type { Task } from '../../../../lib/api'

// ==================== 类型定义 ====================

/** 甘特图组件的 props */
interface GanttChartProps {
  /** 任务列表 */
  tasks: Task[]
  /** 计划开始日期（ISO 字符串） */
  planStartDate: string
  /** 计划截止日期（ISO 字符串） */
  planDeadline: string
}

/** 悬浮提示信息 */
interface TooltipInfo {
  /** 任务标题 */
  title: string
  /** 完成百分比 */
  progress: number
  /** 已完成字数 */
  completedWords: number
  /** 目标字数 */
  targetWords: number
  /** 截止日期 */
  deadline: string
  /** 任务状态 */
  status: string
  /** 提示框的 x 坐标 */
  x: number
  /** 提示框的 y 坐标 */
  y: number
}

// ==================== 颜色常量（古风/学术风格） ====================

/** 赭石色 - 任务条主色 */
const COLOR_OCHRE = '#8B5E3C'
/** 朱砂色 - 任务条渐变色 */
const COLOR_VERMILION = '#B54A3A'
/** 宣纸色 - 背景色 */
const COLOR_PARCHMENT = '#F0EBE5'
/** 墨色 - 文字颜色 */
const COLOR_INK = '#2C2420'
/** 淡墨色 - 次要文字 */
const COLOR_LIGHT_INK = '#8A7E74'
/** 金色 - 今日标记线 */
const COLOR_GOLD = '#C4A882'
/** 淡赭石 - 网格线 */
const COLOR_LIGHT_OCHRE = '#E5DDD4'

// ==================== 甘特图组件 ====================

export default function GanttChart({ tasks, planStartDate, planDeadline }: GanttChartProps) {
  // 悬浮提示状态
  const [tooltip, setTooltip] = useState<TooltipInfo | null>(null)
  // 图表容器的 ref
  const chartRef = useRef<HTMLDivElement>(null)
  // 是否在移动端
  const [isMobile, setIsMobile] = useState(false)

  // 监听窗口大小变化
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // ==================== 时间范围计算 ====================

  const { startDate, endDate, totalDays } = useMemo(() => {
    const start = planStartDate ? new Date(planStartDate) : new Date()
    const end = planDeadline ? new Date(planDeadline) : new Date(Date.now() + 30 * 86400000)

    // 确保开始时间不晚于结束时间
    const s = start.getTime() < end.getTime() ? start : end
    const e = start.getTime() < end.getTime() ? end : start

    // 计算总天数，至少 1 天
    const diffMs = e.getTime() - s.getTime()
    const days = Math.max(Math.ceil(diffMs / (1000 * 60 * 60 * 24)), 1)

    return { startDate: s, endDate: e, totalDays: days }
  }, [planStartDate, planDeadline])

  // ==================== 今日位置计算 ====================

  const todayPosition = useMemo(() => {
    const now = new Date()
    const todayMs = now.getTime()
    const startMs = startDate.getTime()
    const endMs = endDate.getTime()

    // 如果今天在时间范围之外，返回 null
    if (todayMs < startMs || todayMs > endMs) return null

    return (todayMs - startMs) / (endMs - startMs)
  }, [startDate, endDate])

  // ==================== 任务数据计算 ====================

  const taskBars = useMemo(() => {
    return tasks.map((task, index) => {
      // 计算任务的完成百分比
      const progress = task.targetWords > 0
        ? Math.min((task.completedWords / task.targetWords) * 100, 100)
        : task.status === 'completed' ? 100 : 0

      // 计算任务条的位置和宽度
      const taskStart = task.createdAt ? new Date(task.createdAt) : startDate
      const taskEnd = task.deadline ? new Date(task.deadline) : endDate

      // 确保任务时间在计划范围内
      const clampedStart = Math.max(taskStart.getTime(), startDate.getTime())
      const clampedEnd = Math.min(taskEnd.getTime(), endDate.getTime())

      const totalRange = endDate.getTime() - startDate.getTime()
      const leftPercent = totalRange > 0
        ? ((clampedStart - startDate.getTime()) / totalRange) * 100
        : 0
      const widthPercent = totalRange > 0
        ? ((clampedEnd - clampedStart) / totalRange) * 100
        : 0

      return {
        task,
        index,
        progress,
        leftPercent: Math.max(leftPercent, 0),
        widthPercent: Math.max(widthPercent, 0.5), // 最小宽度 0.5%
      }
    })
  }, [tasks, startDate, endDate])

  // ==================== 日期标签生成 ====================

  const dateLabels = useMemo(() => {
    const labels: { label: string; position: number }[] = []
    // 根据总天数决定标签间隔
    let step: number
    if (totalDays <= 7) {
      step = 1
    } else if (totalDays <= 14) {
      step = 2
    } else if (totalDays <= 30) {
      step = 3
    } else if (totalDays <= 60) {
      step = 7
    } else if (totalDays <= 180) {
      step = 14
    } else {
      step = 30
    }

    for (let i = 0; i <= totalDays; i += step) {
      const date = new Date(startDate.getTime() + i * 86400000)
      const position = (i / totalDays) * 100
      // 格式化日期标签
      const month = date.getMonth() + 1
      const day = date.getDate()
      labels.push({
        label: `${month}/${day}`,
        position,
      })
    }

    return labels
  }, [startDate, totalDays])

  // ==================== 事件处理 ====================

  /** 鼠标移入任务条时显示提示 */
  const handleMouseEnter = useCallback((task: Task, progress: number, e: React.MouseEvent) => {
    const rect = chartRef.current?.getBoundingClientRect()
    if (!rect) return

    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setTooltip({
      title: task.title,
      progress: Math.round(progress),
      completedWords: task.completedWords,
      targetWords: task.targetWords,
      deadline: task.deadline
        ? new Date(task.deadline).toLocaleDateString('zh-CN')
        : '未设置',
      status: task.status === 'completed' ? '已完成' : task.status === 'in_progress' ? '进行中' : '待开始',
      x,
      y,
    })
  }, [])

  /** 鼠标移出任务条时隐藏提示 */
  const handleMouseLeave = useCallback(() => {
    setTooltip(null)
  }, [])

  // ==================== 渲染 ====================

  // 如果没有任务，显示空状态
  if (tasks.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5DDD4] p-8 text-center">
        <p className="text-sm text-[#8A7E74]">暂无任务数据，添加任务后甘特图将自动展示</p>
      </div>
    )
  }

  // 行高（桌面端 48px，移动端 40px）
  const rowHeight = isMobile ? 40 : 48
  // 任务条高度
  const barHeight = isMobile ? 24 : 30
  // 左侧标签宽度
  const labelWidth = isMobile ? 80 : 160
  // 时间轴头部高度
  const headerHeight = isMobile ? 32 : 40

  return (
    <div className="bg-white rounded-xl border border-[#E5DDD4] overflow-hidden">
      {/* 甘特图标题栏 */}
      <div className="px-4 py-3 border-b border-[#E5DDD4] flex items-center gap-2">
        <div className="w-1 h-4 rounded-full bg-gradient-to-b from-[#8B5E3C] to-[#B54A3A]" />
        <span className="text-sm font-medium text-[#2C2420]">任务时间线</span>
        <span className="text-xs text-[#8A7E74] ml-auto">
          {startDate.toLocaleDateString('zh-CN')} — {endDate.toLocaleDateString('zh-CN')}
        </span>
      </div>

      {/* 甘特图主体（可横向滚动） */}
      <div className="overflow-x-auto" ref={chartRef}>
        <div
          className="relative"
          style={{
            minWidth: isMobile ? `${labelWidth + 400}px` : `${labelWidth + 600}px`,
          }}
        >
          {/* ===== 时间轴头部 ===== */}
          <div
            className="flex border-b border-[#E5DDD4] bg-[#FAF8F5]"
            style={{ height: headerHeight }}
          >
            {/* 左上角空白 */}
            <div
              className="flex-shrink-0 border-r border-[#E5DDD4] flex items-center justify-center text-xs text-[#8A7E74]"
              style={{ width: labelWidth }}
            >
              任务
            </div>
            {/* 时间刻度 */}
            <div className="flex-1 relative">
              {dateLabels.map((d, i) => (
                <span
                  key={i}
                  className="absolute text-xs text-[#8A7E74] -translate-x-1/2 top-1/2 -translate-y-1/2 whitespace-nowrap"
                  style={{ left: `${d.position}%` }}
                >
                  {d.label}
                </span>
              ))}
            </div>
          </div>

          {/* ===== 任务行 ===== */}
          {taskBars.map(({ task, index, progress, leftPercent, widthPercent }) => {
            // 根据完成度计算颜色（赭石色到朱砂色渐变）
            const hue = 15 + (progress / 100) * 10 // 色相微调
            const saturation = 45 + (progress / 100) * 15
            const lightness = 42 - (progress / 100) * 5
            const barColor = `hsl(${hue}, ${saturation}%, ${lightness}%)`
            const barColorLight = `hsla(${hue}, ${saturation}%, ${lightness}%, 0.35)`

            return (
              <div
                key={task.id}
                className="flex border-b border-[#E5DDD4] last:border-b-0 hover:bg-[#FAF8F5]/60 transition-colors"
                style={{ height: rowHeight }}
              >
                {/* 左侧任务名称 */}
                <div
                  className="flex-shrink-0 border-r border-[#E5DDD4] flex items-center px-2 overflow-hidden"
                  style={{ width: labelWidth }}
                >
                  <span
                    className={`text-xs truncate ${
                      task.status === 'completed'
                        ? 'text-[#8A7E74] line-through'
                        : 'text-[#2C2420]'
                    }`}
                    title={task.title}
                  >
                    {task.title}
                  </span>
                </div>

                {/* 右侧时间轴区域 */}
                <div className="flex-1 relative">
                  {/* 网格背景线 */}
                  {dateLabels.map((d, i) => (
                    <div
                      key={i}
                      className="absolute top-0 bottom-0 w-px bg-[#E5DDD4]/50"
                      style={{ left: `${d.position}%` }}
                    />
                  ))}

                  {/* 任务条 */}
                  <div
                    className="absolute top-1/2 -translate-y-1/2 cursor-pointer group"
                    style={{
                      left: `${leftPercent}%`,
                      width: `${widthPercent}%`,
                      height: barHeight,
                    }}
                    onMouseEnter={(e) => handleMouseEnter(task, progress, e)}
                    onMouseLeave={handleMouseLeave}
                  >
                    {/* 未完成部分（半透明底色） */}
                    <div
                      className="absolute inset-0 rounded-md transition-all duration-300 group-hover:shadow-md"
                      style={{ backgroundColor: barColorLight }}
                    />
                    {/* 已完成部分（实色） */}
                    <div
                      className="absolute inset-y-0 left-0 rounded-md transition-all duration-500"
                      style={{
                        width: `${progress}%`,
                        backgroundColor: barColor,
                      }}
                    />

                    {/* 进度文字（宽度足够时显示） */}
                    {widthPercent > 8 && (
                      <span
                        className="absolute inset-0 flex items-center justify-center text-[10px] font-medium text-white/90 pointer-events-none"
                        style={{
                          color: progress > 50 ? 'rgba(255,255,255,0.9)' : COLOR_INK,
                        }}
                      >
                        {Math.round(progress)}%
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}

          {/* ===== 今日标记线 ===== */}
          {todayPosition !== null && (
            <div
              className="absolute top-0 bottom-0 w-px z-10 pointer-events-none"
              style={{
                left: `calc(${labelWidth}px + (100% - ${labelWidth}px) * ${todayPosition})`,
                background: `repeating-linear-gradient(
                  to bottom,
                  ${COLOR_VERMILION} 0px,
                  ${COLOR_VERMILION} 4px,
                  transparent 4px,
                  transparent 8px
                )`,
              }}
            >
              {/* 今日标签 */}
              <div
                className="absolute -top-0 -translate-x-1/2 text-[10px] px-1.5 py-0.5 rounded-b text-white whitespace-nowrap"
                style={{ backgroundColor: COLOR_VERMILION }}
              >
                今日
              </div>
            </div>
          )}

          {/* ===== 悬浮提示框 ===== */}
          {tooltip && (
            <div
              className="absolute z-20 pointer-events-none bg-[#2C2420] text-white text-xs rounded-lg px-3 py-2 shadow-lg max-w-[220px]"
              style={{
                left: `${Math.min(tooltip.x + 12, (isMobile ? labelWidth + 400 : labelWidth + 600) - 230)}px`,
                top: `${tooltip.y - 10}px`,
              }}
            >
              {/* 提示框小三角 */}
              <div
                className="absolute -left-1 top-3 w-2 h-2 bg-[#2C2420] rotate-45"
              />
              <p className="font-medium text-[#C4A882] mb-1 truncate">{tooltip.title}</p>
              <div className="space-y-0.5 text-[#E5DDD4]">
                <p>状态：{tooltip.status}</p>
                <p>进度：{tooltip.progress}%</p>
                {tooltip.targetWords > 0 && (
                  <p>字数：{tooltip.completedWords} / {tooltip.targetWords}</p>
                )}
                <p>截止：{tooltip.deadline}</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== 图例 ===== */}
      <div className="px-4 py-2 border-t border-[#E5DDD4] flex items-center gap-4 text-xs text-[#8A7E74] bg-[#FAF8F5]/50">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: COLOR_OCHRE }} />
          <span>已完成</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: `${COLOR_OCHRE}59` }} />
          <span>未完成</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-px h-3" style={{ backgroundColor: COLOR_VERMILION }} />
          <span>今日</span>
        </div>
      </div>
    </div>
  )
}
