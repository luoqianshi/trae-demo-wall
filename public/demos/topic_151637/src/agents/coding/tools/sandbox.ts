/**
 * 沙箱工具 — 在 Python 沙箱中执行代码。
 */

import type { ToolResult } from '../types'
import type { ToolExecutorDeps } from './registry'

export async function executeSandboxTool(
  id: string,
  args: { code: string; description?: string },
  deps: ToolExecutorDeps
): Promise<ToolResult> {
  const { code, description } = args
  const startTime = Date.now()

  try {
    const result = await deps.sandbox.execute(deps.sessionId, code, deps.executeTimeout)

    // 记录已执行的代码
    deps.executedCode.push(code)

    // 构建输出
    let output = ''
    if (description) {
      output += `[${description}]\n`
    }
    if (result.stdout) {
      output += result.stdout
    }
    if (result.stderr) {
      output += `\n⚠️ stderr:\n${result.stderr.slice(0, 1000)}`
    }
    if (result.result !== undefined && result.result !== null) {
      const resultStr = typeof result.result === 'string'
        ? result.result
        : JSON.stringify(result.result, null, 2)
      output += `\n✓ result: ${resultStr.slice(0, 2000)}`
    }
    if (result.figures && result.figures.length > 0) {
      output += `\n📊 生成了 ${result.figures.length} 个图表（已保存到沙箱）。如需在报告中展示，请调用 generate_chart 工具。`
      // 将 figures 存入 pendingFigures，供 generate_chart 工具读取
      // 注意：harness.py 在 execute 后清空 figures 列表，所以 generate_chart 不能调沙箱
      for (const fig of result.figures) {
        deps.pendingFigures.push({
          figure: fig as object,
          reasoning: description || '',
        })
      }
    }

    const durationMs = Date.now() - startTime
    return {
      toolCallId: id,
      name: 'sandbox_execute',
      success: true,
      output: output || '(代码执行成功，无输出)',
      data: { result: result.result, figures: result.figures, durationMs },
    }
  } catch (err) {
    const durationMs = Date.now() - startTime
    const errorMsg = err instanceof Error ? err.message : String(err)
    return {
      toolCallId: id,
      name: 'sandbox_execute',
      success: false,
      output: `❌ 代码执行失败 (${durationMs}ms):\n${errorMsg}\n\n请检查错误并修正代码后重试。`,
      error: errorMsg,
    }
  }
}