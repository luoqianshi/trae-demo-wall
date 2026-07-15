/**
 * 图表工具 — 从 pendingFigures 内存中提取已生成的 Plotly 图表。
 *
 * 为什么不再调用沙箱？
 *   harness.py 在每次 execute 后清空 figures 列表（`ns["figures"] = []`），
 *   所以 generate_chart 无法从沙箱中重新读取 figures。
 *   sandbox_execute 工具已把 figures 存入 deps.pendingFigures，
 *   本工具直接从内存中读取第一个待提取的 figure。
 */

import type { ToolResult } from '../types'
import type { ToolExecutorDeps } from './registry'

export async function executeChartTool(
  id: string,
  args: { title: string; reasoning?: string },
  deps: ToolExecutorDeps
): Promise<ToolResult> {
  try {
    if (deps.pendingFigures.length === 0) {
      return {
        toolCallId: id,
        name: 'generate_chart',
        success: false,
        output: '没有待提取的图表。请先在 sandbox_execute 中用 Plotly 创建图表，并将 figure 追加到 `figures` 列表。'
          + ' 示例：`import plotly.express as px; fig = px.bar(...); figures.append(fig)`',
      }
    }

    // 取出第一个待提取的 figure
    const pending = deps.pendingFigures.shift()!
    const chart = {
      title: args.title,
      figure: pending.figure,
      reasoning: args.reasoning || pending.reasoning || '根据数据分析结果生成',
    }

    deps.charts.push(chart)

    const remaining = deps.pendingFigures.length
    return {
      toolCallId: id,
      name: 'generate_chart',
      success: true,
      output: `图表「${args.title}」已生成并保存。${remaining > 0 ? `还有 ${remaining} 个图表待提取。` : ''}`,
      data: chart,
    }
  } catch (err) {
    return {
      toolCallId: id,
      name: 'generate_chart',
      success: false,
      output: `生成图表失败: ${err instanceof Error ? err.message : String(err)}`,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}