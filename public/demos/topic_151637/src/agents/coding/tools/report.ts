/**
 * 报告工具 — 生成最终分析报告。
 */

import type { ToolResult } from '../types'
import type { ToolExecutorDeps } from './registry'

export async function executeReportTool(
  id: string,
  args: { title: string; content: string },
  deps: ToolExecutorDeps
): Promise<ToolResult> {
  deps.reportContent.value = args.content

  return {
    toolCallId: id,
    name: 'generate_report',
    success: true,
    output: `报告「${args.title}」已生成。内容长度: ${args.content.length} 字符。\n\n报告摘要:\n${args.content.slice(0, 500)}${args.content.length > 500 ? '...' : ''}`,
    data: {
      title: args.title,
      content: args.content,
    },
  }
}