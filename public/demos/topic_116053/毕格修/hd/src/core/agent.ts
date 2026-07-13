import OpenAI, {
  AuthenticationError,
  RateLimitError,
  APIConnectionError,
  APIError,
} from 'openai'
import { logger } from '../utils/logger.js'
import { settings } from '../config.js'
import type { DocumentFormat, ModificationItem, ModificationPlan } from '../models/schemas.js'

/**
 * DeepSeek 大模型智能体（替代原 Python 实现）。
 * 使用 OpenAI 兼容接口调用 DeepSeek，对比文档格式与模板规范，输出 JSON 修改方案。
 */
export class DeepSeekAgent {
  private client: OpenAI
  private model: string

  constructor() {
    // 绕过系统代理（不读取 HTTP_PROXY/HTTPS_PROXY）
    delete process.env.HTTP_PROXY
    delete process.env.HTTPS_PROXY
    delete process.env.http_proxy
    delete process.env.https_proxy

    this.client = new OpenAI({
      apiKey: settings.DEEPSEEK_API_KEY,
      baseURL: settings.DEEPSEEK_BASE_URL,
      timeout: 120000, // 120 秒
      maxRetries: 0,
    })
    this.model = settings.DEEPSEEK_MODEL

    logger.info(
      { baseURL: settings.DEEPSEEK_BASE_URL, model: this.model },
      'DeepSeek 客户端初始化完成',
    )
  }

  /**
   * 分析文档格式，对比模板规范规则集，返回修改方案。
   * 输入可能是 DocumentFormat 对象或普通 dict，统一处理。
   */
  async analyzeFormat(
    documentFormat: DocumentFormat | Record<string, unknown>,
    templateRules: Record<string, unknown>,
  ): Promise<ModificationPlan> {
    logger.info('开始调用 DeepSeek 进行文档格式分析')

    const docData = this._prepareDocData(documentFormat)
    if (docData.paragraphs_truncated === true) {
      logger.info(
        { original_paragraph_count: docData.original_paragraph_count },
        '文档段落数超过 60，已截断为前 60 段',
      )
    }

    const systemPrompt = this._buildSystemPrompt()
    const userMessage = this._buildUserMessage(docData, templateRules)

    let content: string
    try {
      content = await this._callApi(systemPrompt, userMessage)
    } catch (e) {
      logger.error({ err: e }, 'DeepSeek API 调用失败')
      throw e
    }

    logger.info('DeepSeek 调用成功，开始解析返回内容')

    let result: Record<string, unknown>
    try {
      result = this._parseJsonResponse(content)
    } catch (e) {
      logger.error(
        { err: e, content_preview: content.slice(0, 500) },
        'DeepSeek 返回内容解析为 JSON 失败',
      )
      throw e
    }

    const plan = this._buildPlan(result)
    logger.info({ total_items: plan.total_items }, '文档格式分析完成')
    return plan
  }

  /**
   * 构造 System Prompt（与原 Python 实现逐字一致）。
   */
  private _buildSystemPrompt(): string {
    return `你是毕业论文格式检查专家，精通 Word 文档格式规范与中文学术写作排版要求。

你的任务是：对比用户文档的格式信息与毕业论文模板规范规则集，找出用户文档中不符合规范的格式偏差，并给出具体的修改建议。

【输出要求】
1. 必须输出严格的 JSON 格式，不要使用 markdown 代码块包裹（即不要使用 \`\`\`json 标记），不要在 JSON 前后添加任何额外解释文字。
2. 输出结构必须为：
{
  "items": [
    {
      "target_type": "paragraph"/"section"/"run",
      "target_index": 段落或节的整数索引,
      "field": "要修改的格式字段名",
      "current_value": 当前值,
      "target_value": 目标值（必须与模板规范规则集中的值对应）,
      "description": "中文描述，说明该处偏差与修改建议"
    }
  ],
  "summary": "对整体格式问题的中文总结",
  "total_items": items 列表的长度
}

【字段说明】
- target_type：修改目标类型，取值为 "paragraph"（段落级格式）、"section"（节/页面级格式）或 "run"（文本片段级字体格式）。
- target_index：对应段落或节的索引（整数），与文档格式信息中的 index 字段对应。
- field：要修改的格式字段名，可用值包括：font_size（字号）、font_name_eastasia（中文字体）、font_name（英文字体）、bold（加粗）、alignment（对齐方式）、line_spacing（行距）、line_spacing_rule（行距规则）、first_line_indent（首行缩进）、space_before（段前间距）、space_after（段后间距）、outline_level（大纲级别）、top_margin（上页边距）、bottom_margin（下页边距）、left_margin（左页边距）、right_margin（右页边距）。
- current_value：用户文档中当前的格式值（可为字符串、数字、布尔值或 null）。
- target_value：依据模板规范规则集给出的目标值（如正文字号 12.0、行距 1.5 等），必须与规则集中的具体取值保持一致。
- description：用中文简要说明该格式偏差及修改建议。

【规则】
1. 只输出需要修改的项；如果某处格式已符合规范，则不要输出对应项。
2. target_value 必须与毕业论文模板规范规则集中的值严格对应，不得自行编造规范值。
3. 优先关注与模板规范规则集存在明显偏差的格式项（字号、字体、行距、对齐方式、页边距、首行缩进等核心格式）。
4. 段落索引应与文档格式信息中段落的 index 字段一一对应，便于后续定位修改。
5. total_items 必须等于 items 列表的实际长度。
6. 输出必须是合法的 JSON，且不要包含任何注释、markdown 标记或额外文字。`
  }

  /**
   * 构造 User Message。
   */
  private _buildUserMessage(
    docData: Record<string, unknown>,
    templateRules: Record<string, unknown>,
  ): string {
    return `请对比以下用户文档格式信息与毕业论文模板规范规则集，找出格式偏差并输出 JSON 修改方案。

【文档格式信息】
${JSON.stringify(docData)}

【毕业论文模板规范规则集】
${JSON.stringify(templateRules)}`
  }

  /**
   * 准备文档数据：段落超过 60 段时截断为前 60 段，并标注截断信息。
   * 输入可能是 DocumentFormat 对象或普通 dict，统一处理。
   */
  private _prepareDocData(
    documentFormat: DocumentFormat | Record<string, unknown>,
  ): Record<string, unknown> {
    const docData: Record<string, unknown> = { ...documentFormat }
    const paragraphs = Array.isArray(docData.paragraphs) ? docData.paragraphs : []
    if (paragraphs.length > 60) {
      docData.paragraphs = paragraphs.slice(0, 60)
      docData.paragraphs_truncated = true
      docData.original_paragraph_count = paragraphs.length
      docData.truncated_note = `文档段落数超过 60，仅分析前 60 段（共 ${paragraphs.length} 段）`
    } else {
      docData.paragraphs_truncated = false
    }
    return docData
  }

  /**
   * 调用 DeepSeek API（OpenAI 兼容接口）。
   */
  private async _callApi(systemPrompt: string, userMessage: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        temperature: 0.1,
        response_format: { type: 'json_object' },
        max_tokens: 8192,
      })
      return response.choices[0]?.message?.content ?? ''
    } catch (e) {
      throw this._classifyError(e)
    }
  }

  /**
   * 异常分类：将 openai SDK 异常转换为中文错误信息。
   */
  private _classifyError(e: unknown): Error {
    const detail = String(e)
    if (e instanceof AuthenticationError) {
      return new Error(
        `DeepSeek API 认证失败，请检查 API Key 配置是否正确。原始错误详情：${detail}`,
      )
    }
    if (e instanceof RateLimitError) {
      return new Error(
        `DeepSeek API 请求过于频繁或额度不足，已触发限流，请稍后重试。原始错误详情：${detail}`,
      )
    }
    if (e instanceof APIConnectionError) {
      return new Error(
        `DeepSeek API 网络连接失败，请检查网络或服务地址是否可达。原始错误详情：${detail}`,
      )
    }
    if (e instanceof APIError) {
      return new Error(`DeepSeek API 调用失败。原始错误详情：${detail}`)
    }
    return new Error(`调用 DeepSeek API 时发生未知异常。原始错误详情：${detail}`)
  }

  /**
   * 解析 DeepSeek 返回的 JSON 内容，带多重容错。
   * 依次尝试：直接解析 → 正则提取 → 修复语法 → 截断容错。
   */
  private _parseJsonResponse(text: string): Record<string, unknown> {
    const match = text.match(/\{[\s\S]*\}/)

    // 1. 直接解析
    try {
      return JSON.parse(text)
    } catch {
      // 继续尝试
    }

    // 2. 正则提取 JSON 块
    if (match) {
      try {
        return JSON.parse(match[0])
      } catch {
        // 继续尝试
      }
    }

    // 3. 修复常见 LLM JSON 语法错误
    try {
      return JSON.parse(this._repairJson(text))
    } catch {
      // 继续尝试
    }
    if (match) {
      try {
        return JSON.parse(this._repairJson(match[0]))
      } catch {
        // 继续尝试
      }
    }

    // 4. 截断容错
    try {
      return JSON.parse(this._salvageTruncatedJson(text))
    } catch {
      // 继续尝试
    }
    if (match) {
      try {
        return JSON.parse(this._salvageTruncatedJson(match[0]))
      } catch {
        // 继续尝试
      }
    }

    throw new Error(
      `DeepSeek 返回内容无法解析为 JSON。原始返回内容（前 500 字符）：${text.slice(0, 500)}`,
    )
  }

  /**
   * 修复常见 LLM JSON 语法错误（_repairJson 等价实现）。
   */
  private _repairJson(text: string): string {
    let repaired = text
    // 移除尾随逗号：,\s*([}\]]) → $1
    repaired = repaired.replace(/,\s*([}\]])/g, '$1')
    // 数组元素间缺逗号
    repaired = repaired.replace(/(["}\]])\s+(\{)/g, '$1,$2')
    repaired = repaired.replace(/(["}\]])\s+(\[)/g, '$1,$2')
    // 对象属性间缺逗号
    repaired = repaired.replace(/(")\s+(")/g, '$1,$2')
    repaired = repaired.replace(/(\})\s+(")/g, '$1,$2')
    return repaired
  }

  /**
   * 截断容错：尽力从被截断的内容中恢复出合法 JSON（_salvageTruncatedJson 等价实现）。
   */
  private _salvageTruncatedJson(text: string): string {
    const lastBrace = text.lastIndexOf('}')
    if (lastBrace === -1) {
      throw new Error('未找到可截断的 JSON 闭合位置')
    }
    let salvaged = text.slice(0, lastBrace + 1)
    // 移除尾随逗号
    salvaged = salvaged.replace(/,\s*([}\]])/g, '$1')
    // 闭合数组与根对象
    salvaged = salvaged + '\n  ]\n}'
    // 验证包含 items
    if (!salvaged.includes('"items"')) {
      throw new Error('恢复的 JSON 不包含 items 字段')
    }
    return salvaged
  }

  /**
   * 根据解析结果构造 ModificationPlan。
   * 单个 item 构造失败不中断，记录 warning 跳过。
   */
  private _buildPlan(result: Record<string, unknown>): ModificationPlan {
    const rawItems: unknown[] = Array.isArray(result.items) ? (result.items as unknown[]) : []
    const items: ModificationItem[] = []

    for (const raw of rawItems) {
      try {
        if (!raw || typeof raw !== 'object') {
          continue
        }
        const r = raw as Record<string, any>
        items.push({
          target_type: r.target_type || 'paragraph',
          target_index: parseInt(r.target_index) || 0,
          field: r.field || '',
          current_value: r.current_value ?? null,
          target_value: r.target_value ?? null,
          description: r.description ?? null,
        })
      } catch (err) {
        logger.warn({ err }, '构造单个修改项失败，已跳过')
      }
    }

    return {
      items,
      summary: typeof result.summary === 'string' ? result.summary : null,
      total_items: items.length,
    }
  }
}
