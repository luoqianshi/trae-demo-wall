// 定时器服务：每 5 分钟检查一次是否需要生成日/月/年总结
import {
  checkAndGenerateDailySummary,
  generateMonthlySummary,
  generateYearlySummary,
  saveSummaryAsMemory,
  getSummaryConfig,
} from './summaryEngine'

let timerId: number | null = null

export function startSummaryScheduler(): void {
  if (timerId !== null) return // 已启动

  // 立即检查一次
  void checkAndTrigger()

  // 每 5 分钟检查一次
  timerId = window.setInterval(() => void checkAndTrigger(), 5 * 60 * 1000)
}

export function stopSummaryScheduler(): void {
  if (timerId !== null) {
    clearInterval(timerId)
    timerId = null
  }
}

async function checkAndTrigger(): Promise<void> {
  const config = getSummaryConfig()
  const now = new Date()
  const hour = now.getHours()
  const day = now.getDate()
  const month = now.getMonth()

  // 每日总结：在配置的时间点（默认 22:00）之后检查
  // checkAndGenerateDailySummary 内部会判断今天是否已生成，保证每天只生成一次
  const configHour = parseInt(config.dailyTime.split(':')[0], 10) || 22
  if (config.dailyEnabled && hour >= configHour) {
    try {
      const result = await checkAndGenerateDailySummary()
      if (result) {
        console.log('[SummaryScheduler] 每日总结已生成:', result.title)
      }
    } catch (e) {
      console.warn('[SummaryScheduler] 每日总结生成失败:', e)
    }
  }

  // 月度总结：每月最后一天或第一天检查
  if (config.monthlyEnabled && (day === 1 || isLastDayOfMonth(now))) {
    const key = `hengzhou-monthly-${now.getFullYear()}-${now.getMonth() + 1}`
    if (!localStorage.getItem(key)) {
      try {
        const result = await generateMonthlySummary()
        await saveSummaryAsMemory(result)
        localStorage.setItem(key, 'done')
        console.log('[SummaryScheduler] 月度总结已生成:', result.title)
      } catch (e) {
        console.warn('[SummaryScheduler] 月度总结生成失败:', e)
      }
    }
  }

  // 年度总结：每年 1 月 1 日检查（生成上一年的年度总结）
  if (config.yearlyEnabled && month === 0 && day === 1) {
    const key = `hengzhou-yearly-${now.getFullYear() - 1}`
    if (!localStorage.getItem(key)) {
      try {
        const result = await generateYearlySummary(now.getFullYear() - 1)
        await saveSummaryAsMemory(result)
        localStorage.setItem(key, 'done')
        console.log('[SummaryScheduler] 年度总结已生成:', result.title)
      } catch (e) {
        console.warn('[SummaryScheduler] 年度总结生成失败:', e)
      }
    }
  }
}

function isLastDayOfMonth(date: Date): boolean {
  // 构造下个月的第 0 天，即为本月的最后一天
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0)
  return date.getDate() === lastDay.getDate()
}
