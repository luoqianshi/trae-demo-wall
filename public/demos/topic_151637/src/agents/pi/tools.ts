/**
 * pi-agent-core 工具定义 — 将 DataPilot 工具转换为 AgentTool 格式。
 *
 * 每个工具通过闭包捕获 sandbox / sharedStore / sessionId 等依赖。
 */

import { Type } from '@sinclair/typebox'
import type { Static } from '@sinclair/typebox'
import type { AgentTool } from '@earendil-works/pi-agent-core'
import type { SandboxManager } from '../../sandbox/SandboxManager'
import type { PiSharedStore } from './PiAgent'
import { getStylePreset } from '../shared/styleGuide'
import { buildDashboardHTML } from './dashboardBuilder'

export interface ToolDeps {
  sandbox: SandboxManager
  sessionId: string
  sharedStore: PiSharedStore
  styleId?: string
  apiPort?: number
}

export function createTools(deps: ToolDeps): AgentTool[] {
  const { sandbox, sessionId, sharedStore, styleId, apiPort } = deps

  // ── sandbox_execute ──
  const ExecuteArgsSchema = Type.Object({
    code: Type.String({ description: '要执行的 Python 代码' }),
    description: Type.Optional(Type.String({ description: '代码用途的简短描述' })),
  })

  const sandboxExecuteTool: AgentTool<typeof ExecuteArgsSchema> = {
    name: 'sandbox_execute',
    label: 'Python 代码执行',
    description: '在 Python 沙箱中执行数据分析代码。使用 Plotly 画图后把 figure 追加到 `figures` 列表（`figures.append(fig)`）。依赖库：pandas、numpy、plotly、scipy、statsmodels。',
    parameters: ExecuteArgsSchema,
    execute: async (_toolCallId, params, _signal) => {
      const result = await sandbox.execute(
        sessionId,
        params.code,
        120_000,
      )

      sharedStore.executedCode.push(params.code)

      let output = ''
      if (params.description) output += `[${params.description}]\n`
      if (result.stdout) output += result.stdout
      if (result.stderr) output += `\n⚠️ stderr:\n${result.stderr.slice(0, 1000)}`
      if (result.result !== undefined && result.result !== null) {
        const rs = typeof result.result === 'string' ? result.result : JSON.stringify(result.result, null, 2)
        output += `\n✓ result: ${rs.slice(0, 2000)}`
      }
      if (result.figures && result.figures.length > 0) {
        output += `\n📊 生成了 ${result.figures.length} 个图表（已保存）。如需在报告中展示，请调用 generate_chart 工具。`
        for (const fig of result.figures) {
          sharedStore.pendingFigures.push({
            figure: fig as object,
            reasoning: params.description || '',
          })
        }
      }

      return {
        content: [{ type: 'text', text: output || '(代码执行成功，无输出)' }],
        details: { result: result.result, figures: result.figures },
      }
    },
  }

  // ── generate_chart ──
  const ChartArgsSchema = Type.Object({
    title: Type.String({ description: '图表标题' }),
    reasoning: Type.Optional(Type.String({ description: '选择此图表类型的原因' })),
  })

  const generateChartTool: AgentTool<typeof ChartArgsSchema> = {
    name: 'generate_chart',
    label: '生成图表',
    description: '从 sandbox_execute 的执行结果中提取一个 Plotly 图表。每次调用提取一个图表。',
    parameters: ChartArgsSchema,
    execute: async (_toolCallId, params) => {
      if (sharedStore.pendingFigures.length === 0) {
        throw new Error('没有待提取的图表。请先在 sandbox_execute 中用 Plotly 创建图表，并将 figure 追加到 `figures` 列表。')
      }

      const pending = sharedStore.pendingFigures.shift()!
      const chart = {
        title: params.title,
        figure: pending.figure,
        reasoning: params.reasoning || pending.reasoning || '根据数据分析结果生成',
      }
      sharedStore.charts.push(chart)

      const remaining = sharedStore.pendingFigures.length
      return {
        content: [{ type: 'text', text: `图表「${params.title}」已生成并保存。${remaining > 0 ? `还有 ${remaining} 个图表待提取。` : ''}` }],
        details: chart,
      }
    },
  }

  // ── generate_report ──
  const ReportArgsSchema = Type.Object({
    title: Type.String({ description: '报告标题' }),
    content: Type.String({ description: '报告 Markdown 内容，包含所有分析结论' }),
  })

  const generateReportTool: AgentTool<typeof ReportArgsSchema> = {
    name: 'generate_report',
    label: '生成报告',
    description: '生成分析报告（Markdown 格式）。注意：generate_dashboard 是最终交付格式，report 作为其输入。',
    parameters: ReportArgsSchema,
    execute: async (_toolCallId, params) => {
      sharedStore.reportContent.value = params.content
      sharedStore.analysisResults.push({
        title: params.title,
        content: params.content,
        timestamp: Date.now(),
      })

      return {
        content: [{
          type: 'text',
          text: `报告「${params.title}」已生成。内容长度: ${params.content.length} 字符。`,
        }],
        details: { title: params.title, length: params.content.length },
      }
    },
  }

  // ── generate_dashboard ──
  const DashboardArgsSchema = Type.Object({
    title: Type.String({ description: '看板标题' }),
    sections: Type.Optional(Type.Array(Type.Object({
      heading: Type.String({ description: '章节标题' }),
      content: Type.String({ description: '章节 Markdown 内容' }),
    }), { description: '报告章节列表' })),
    content: Type.Optional(Type.String({ description: '报告内容（如果不使用 sections）' })),
    inlineCharts: Type.Optional(Type.Boolean({ description: '是否内联图表，默认 true' })),
  })

  const generateDashboardTool: AgentTool<typeof DashboardArgsSchema> = {
    name: 'generate_dashboard',
    label: '生成看板',
    description: '生成精美的自包含 HTML 看板文件。这是最终交付物的唯一格式。所有分析结论和报告内容都应通过此工具交付。',
    parameters: DashboardArgsSchema,
    execute: async (_toolCallId, params) => {
      const stylePreset = getStylePreset(styleId || 'clean-white') || getStylePreset('clean-white')!
      const charts = sharedStore.charts.map(c => ({
        title: c.title,
        figure: c.figure,
        reasoning: c.reasoning || '',
      }))

      const html = buildDashboardHTML({
        title: params.title,
        content: params.content,
        sections: params.sections,
        charts,
        stylePreset,
        apiPort,
      })

      sharedStore.dashboardHTML = html

      return {
        content: [{
          type: 'text',
          text: `看板「${params.title}」已生成 (${html.length.toLocaleString()} 字符)。${charts.length} 个图表。${apiPort ? ' 已启用交互式 SQL 查询。' : ''}`,
        }],
        details: { title: params.title, chartCount: charts.length, size: html.length },
        terminate: true,
      }
    },
  }

  return [sandboxExecuteTool, generateChartTool, generateReportTool, generateDashboardTool]
}