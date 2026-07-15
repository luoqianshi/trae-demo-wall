/**
 * 看板工具 — 生成精美的自包含交互式 HTML 看板。
 *
 * 设计参考：Vercel Analytics、Linear、Stripe Dashboard
 * 交互能力：Plotly.js restyle + 原生 HTML 控件 + 内嵌 SQL 查询辅助函数
 * 数据源：支持内嵌 JSON 快照 + 实时 SQL 查询（通过主进程内嵌 Express API）
 */

import type { ToolResult } from '../types'
import type { ToolExecutorDeps } from './registry'
import { getStylePreset } from '../../shared/styleGuide'
import { buildDashboardHTML } from '../../pi/dashboardBuilder'

export async function executeDashboardTool(
  id: string,
  args: {
    title: string
    /** 报告 Markdown 内容 */
    content?: string
    /** 报告章节 */
    sections?: Array<{ heading: string; content: string }>
    /** 是否内联 Plotly 图表（如果为 true，图表数据会嵌入 HTML） */
    inlineCharts?: boolean
  },
  deps: ToolExecutorDeps
): Promise<ToolResult> {
  const { title, content, sections, inlineCharts = true } = args
  const charts = deps.charts
  const stylePreset = getStylePreset(deps.styleId || 'clean-white') || getStylePreset('clean-white')!

  // 生成 HTML
  const html = buildDashboardHTML({
    title,
    content,
    sections,
    charts: inlineCharts ? charts.map(c => ({ title: c.title, figure: c.figure, reasoning: c.reasoning })) : [],
    stylePreset,
    apiPort: deps.apiPort,
  })

  // 存储到 deps 中
  deps.dashboardHTML = html
  deps.reportContent.value = content || sections?.map(s => `## ${s.heading}\n\n${s.content}`).join('\n\n') || ''

  return {
    toolCallId: id,
    name: 'generate_dashboard',
    success: true,
    output: `看板「${title}」已生成 (${html.length.toLocaleString()} 字符)。${charts.length} 个图表。${deps.apiPort ? ' 已启用交互式 SQL 查询。' : ''}`,
    data: {
      title,
      dashboardHTML: html,
      chartCount: charts.length,
    },
  }
}

// buildDashboardHTML / escapeHTML / renderMarkdown 已提取到 src/agents/pi/dashboardBuilder.ts