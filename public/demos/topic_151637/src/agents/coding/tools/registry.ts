/**
 * 工具注册表 — 管理所有可用工具的定义与执行。
 */

import type { ToolDefinition, ToolName, ToolCall, ToolResult, AgentMessage } from '../types'
import type { SandboxManager } from '../../../sandbox/SandboxManager'
import type { LLMClient } from '../../llm/LLMClient'
import type { DatasetContext } from '../../../types/shared'
import { executeSandboxTool } from './sandbox'
import { executeWebSearchTool, executeWebFetchTool } from './web'
import { executeChartTool } from './chart'
import { executeReportTool } from './report'
import { executeDashboardTool } from './dashboard'

// ============================================================
// 工具定义列表
// ============================================================

export const TOOL_DEFINITIONS: ToolDefinition[] = [
{
    name: 'web_search',
    description: `在互联网上搜索实时信息。返回 Markdown 格式的编号列表 + 结构化 JSON 摘要。这是获取实时数据（新闻、排行榜、价格、统计数据等）的首选工具。

搜索策略：
- 时效性：附加当前年份/日期获取最新数据（如"2024年深圳各区房价"）
- 精确性：使用具体关键词而非模糊描述
- 多源验证：如果第一次结果不理想，换用不同关键词重新搜索
- 数据源偏好：优先选择官方数据源（.gov.cn、权威机构）

返回格式：每条结果包含标题、URL、摘要，末尾附 JSON 结构化摘要（可复制到 Python 中解析）。`,
    parameters: {
      type: 'object',
      properties: {
        query: { type: 'string', description: '搜索关键词（中文或英文），附加当前年份确保时效性。例如"2024年深圳各区房价排名"、"最新微博热搜榜"、"茅台最新股价"' },
        num: { type: 'number', description: '返回结果数量（默认 8，最多 10）' },
      },
      required: ['query'],
    },
  },
  {
    name: 'web_fetch',
    description: `获取指定 URL 的完整网页内容（Markdown 格式，已去除导航、广告、脚本等杂讯）。用于：web_search 找到靠谱链接后，深入获取详细内容。

返回内容特点：
- 已转换为 Markdown 格式（标题、列表、链接、粗体等保留）
- 已去除导航、页脚、广告、脚本等干扰内容
- 优先提取 <main>、<article> 等主体内容区域
- 最多返回 15000 字符，超出部分智能截断

适用场景：web_search 找到包含表格/列表的页面后，用 web_fetch 获取完整数据，然后用 Python 的 pd.read_html() 解析。`,
    parameters: {
      type: 'object',
      properties: {
        url: { type: 'string', description: '要获取的网页 URL（必须是完整的 https:// URL）。优先选择包含表格、列表的页面' },
      },
      required: ['url'],
    },
  },
  {
    name: 'sandbox_execute',
    description: '在 Python 沙箱中执行代码。沙箱预装了 pandas、numpy、scipy、plotly、duckdb、akshare、openpyxl、lxml、html5lib。用于：解析网页数据、构建 DataFrame、统计分析、创建图表。如果已上传数据集，df 变量已预加载。',
    parameters: {
      type: 'object',
      properties: {
        code: { type: 'string', description: '要执行的 Python 代码' },
        description: { type: 'string', description: '这段代码的简短描述（中文）' },
      },
      required: ['code'],
    },
  },
  {
    name: 'generate_chart',
    description: '根据沙箱中已生成的数据生成可视化图表。调用前必须先在沙箱中用 Plotly 创建好 figure 并追加到 figures 列表。此工具会提取 figures 并生成前端可用的图表描述。',
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '图表标题（中文）' },
        reasoning: { type: 'string', description: '为什么选择这个图表类型' },
      },
      required: ['title'],
    },
  },
  {
    name: 'generate_report',
    description: `生成结构化分析报告（Markdown 格式）。当所有分析完成、图表已生成后，调用此工具将结果汇总为结构化报告。

参数：
- title: 报告标题
- content: 报告正文（完整的 Markdown 文本，包含分析结论、数据洞察、关键发现）
- sections: 报告章节列表（可选，用于结构化报告。每节含 heading 和 content）

注意：如果要生成带图表的精美看板，请使用 generate_dashboard 工具。`,
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '报告标题（中文）' },
        content: { type: 'string', description: '报告正文（Markdown 格式，包含分析结论、数据洞察、关键发现）' },
        sections: {
          type: 'array',
          description: '报告章节列表（可选）',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string', description: '章节标题' },
              content: { type: 'string', description: '章节内容（Markdown 格式）' },
            },
            required: ['heading', 'content'],
          },
        },
      },
      required: ['title', 'content'],
    },
  },
  {
    name: 'generate_dashboard',
    description: `生成精美的自包含 HTML 看板文件。这是最终交付物的首选格式。

看板特性：
- 自包含 HTML 文件，可在浏览器中直接打开
- 应用用户选择的风格主题（配色、字体、间距等）
- 包含所有图表（Plotly 交互式图表）、数据分析报告、摘要卡片
- 响应式布局，支持桌面和移动端
- 参考 Vercel Analytics、Linear、Stripe 等现代 SaaS 产品的设计风格

参数：
- title: 看板标题
- content: 报告正文（Markdown 格式）
- sections: 报告章节列表（可选，用于结构化展示）
- inlineCharts: 是否内联图表（默认 true，图表数据嵌入 HTML）

调用此工具前，确保所有图表已通过 generate_chart 提取完毕。`,
    parameters: {
      type: 'object',
      properties: {
        title: { type: 'string', description: '看板标题（中文）' },
        content: { type: 'string', description: '报告正文（Markdown 格式）' },
        sections: {
          type: 'array',
          description: '报告章节列表（可选）',
          items: {
            type: 'object',
            properties: {
              heading: { type: 'string', description: '章节标题' },
              content: { type: 'string', description: '章节内容（Markdown 格式）' },
            },
            required: ['heading', 'content'],
          },
        },
        inlineCharts: { type: 'boolean', description: '是否内联图表（默认 true）' },
      },
      required: ['title'],
    },
  },
]

// ============================================================
// 工具执行器
// ============================================================

export interface ToolExecutorDeps {
  sandbox: SandboxManager
  sessionId: string
  llm: LLMClient
  dataset?: DatasetContext
  /** 当前活跃的风格 ID */
  styleId?: string
  /** 沙箱中生成的图表列表（由 generate_chart 工具填充） */
  charts: Array<{ title: string; figure: object; reasoning: string }>
  /** 已执行的代码列表 */
  executedCode: string[]
  /** 报告内容（使用对象包装以支持引用修改） */
  reportContent: { value: string }
  /** 单次代码执行超时 (ms) */
  executeTimeout: number
  /**
   * sandbox_execute 返回的待提取 figures。
   * harness.py 在每次 execute 后清空 figures 列表，
   * 所以 generate_chart 必须从这里读取，不能再调沙箱。
   */
  pendingFigures: Array<{ title?: string; figure: object; reasoning?: string }>
  /** 看板 HTML（由 generate_dashboard 工具填充） */
  dashboardHTML?: string
  /** API 端口（主进程内嵌 Express 服务，供看板 iframe 查询 SQL） */
  apiPort?: number
}

/**
 * 执行单个工具调用。
 */
export async function executeTool(
  call: ToolCall,
  deps: ToolExecutorDeps
): Promise<ToolResult> {
  const { name, arguments: args, id } = call

  switch (name) {
    case 'sandbox_execute': {
      return executeSandboxTool(id, args as { code: string; description?: string }, deps)
    }
    case 'web_search': {
      return executeWebSearchTool(id, args as { query: string; num?: number })
    }
    case 'web_fetch': {
      return executeWebFetchTool(id, args as { url: string })
    }
    case 'generate_chart': {
      return executeChartTool(id, args as { title: string; reasoning?: string }, deps)
    }
    case 'generate_report': {
      return executeReportTool(id, args as { title: string; content: string; sections?: Array<{ heading: string; content: string }> }, deps)
    }
    case 'generate_dashboard': {
      return executeDashboardTool(id, args as {
        title: string
        content?: string
        sections?: Array<{ heading: string; content: string }>
        inlineCharts?: boolean
      }, deps)
    }
    default:
      return {
        toolCallId: id,
        name,
        success: false,
        output: `未知工具: ${name}`,
        error: `Tool "${name}" not found`,
      }
  }
}

// ============================================================
// 工具结果转消息
// ============================================================

/**
 * 将工具调用结果转换为 OpenAI 格式的 tool result 消息。
 */
export function toolResultToMessage(result: ToolResult): AgentMessage {
  return {
    role: 'tool',
    tool_call_id: result.toolCallId,
    content: result.output,
  }
}