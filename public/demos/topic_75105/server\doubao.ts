// Ark 豆包视觉模型接入（第 5 轮三次修复）
// 使用火山方舟 Responses API，Node 原生 fetch，不引入 SDK。
// 真实密钥只能通过环境变量 ARK_API_KEY 注入，不得写入仓库、不得打印到日志。
// 仅用于图片视觉识别；PDF 不走视觉模型。
//
// 官方推荐调用方式（参考）：
//   client = Ark(base_url='https://ark.cn-beijing.volces.com/api/v3', api_key=...)
//   response = client.responses.create(model='doubao-seed-2-1-pro-260628', input='hello')
//
// 本模块对应 HTTP 调用：
//   POST ${ARK_BASE_URL}/responses
//   Authorization: Bearer ${ARK_API_KEY}
//   Content-Type: application/json
//   body: { model, input }
// input 支持纯字符串或消息数组（多模态视觉识别用消息数组）。

/** 多模态消息内容片段（OpenAI 兼容格式） */
export type ArkContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface ArkInputMessage {
  role: 'system' | 'user' | 'assistant';
  /** 纯文本用 string；含图片用 ArkContentPart[] */
  content: string | ArkContentPart[];
}

export interface ArkRequest {
  /** Responses API 的 input：纯字符串或消息数组 */
  input: string | ArkInputMessage[];
  model?: string;
  temperature?: number;
}

export interface ArkResponse {
  /** 从响应中提取的文本内容 */
  content: string;
  model: string;
}

export type ArkResult =
  | { ok: true; data: ArkResponse }
  | { ok: false; error: string };

export interface ArkConfig {
  apiKey: string;
  model: string;
  baseUrl: string;
}

/** 默认 Base URL（火山方舟北京区 Responses API） */
export const ARK_DEFAULT_BASE_URL = 'https://ark.cn-beijing.volces.com/api/v3';
/** 默认模型（豆包视觉理解） */
export const ARK_DEFAULT_MODEL = 'doubao-seed-2-1-pro-260628';

/**
 * 从环境变量读取 Ark 配置。
 * 缺少 API Key 时 apiKey 为空字符串，由调用方决定降级。
 * baseUrl/model 未配置时使用默认值。
 */
export function loadArkConfig(): ArkConfig {
  const apiKey = process.env.ARK_API_KEY?.trim() ?? '';
  const model = process.env.ARK_MODEL?.trim() || ARK_DEFAULT_MODEL;
  // 去除尾部斜杠，避免拼接 /responses 时出现双斜杠
  const baseUrl =
    process.env.ARK_BASE_URL?.trim().replace(/\/+$/, '') ?? ARK_DEFAULT_BASE_URL;
  return { apiKey, model, baseUrl };
}

/**
 * 校验是否具备调用 Ark 的前置条件（仅检查 API Key 是否存在）。
 * 缺失时返回 { ok: false }，调用方应走文本降级逻辑。
 */
export function validateArkConfig(): { ok: boolean; error?: string } {
  const { apiKey } = loadArkConfig();
  if (!apiKey) {
    return {
      ok: false,
      error:
        '缺少 ARK_API_KEY。图片视觉识别不可用，将走文本降级。',
    };
  }
  return { ok: true };
}

/**
 * 健壮解析 Ark Responses API 响应，提取文本内容。
 * 支持多种可能的返回结构：
 *   1. data.output[0].content[0].text（OpenAI Responses API 标准格式）
 *   2. data.output_text（Responses API 简化字段）
 *   3. data.choices[0].message.content（Chat Completions 兼容格式）
 *   4. data.content（直接内容字段）
 *   5. data.output[0].text（部分实现）
 * 解析失败返回空字符串，由调用方判断。
 */
export function parseArkResponseContent(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const obj = data as Record<string, unknown>;

  // 1. data.output_text（字符串或数组）
  if (typeof obj.output_text === 'string' && obj.output_text) {
    return obj.output_text;
  }
  if (Array.isArray(obj.output_text)) {
    const texts: string[] = [];
    for (const p of obj.output_text) {
      if (p && typeof p === 'object') {
        const po = p as Record<string, unknown>;
        if (typeof po.text === 'string' && po.text) texts.push(po.text);
      } else if (typeof p === 'string' && p) {
        texts.push(p);
      }
    }
    if (texts.length > 0) return texts.join('');
  }

  // 2. data.output（数组，标准 Responses API）
  if (Array.isArray(obj.output)) {
    const parts: string[] = [];
    for (const item of obj.output) {
      if (!item || typeof item !== 'object') continue;
      const io = item as Record<string, unknown>;
      // item.content 数组
      if (Array.isArray(io.content)) {
        for (const c of io.content) {
          if (!c || typeof c !== 'object') continue;
          const co = c as Record<string, unknown>;
          const t =
            typeof co.text === 'string'
              ? co.text
              : typeof co.output_text === 'string'
                ? co.output_text
                : '';
          if (t) parts.push(t);
        }
      }
      // item.text 直接字段
      if (typeof io.text === 'string' && io.text) parts.push(io.text);
    }
    if (parts.length > 0) return parts.join('');
  }

  // 3. data.choices[0].message.content（Chat Completions 兼容）
  if (Array.isArray(obj.choices) && obj.choices.length > 0) {
    const choice = obj.choices[0] as Record<string, unknown> | undefined;
    const msg = choice?.message as Record<string, unknown> | undefined;
    const c = msg?.content;
    if (typeof c === 'string' && c) return c;
    if (Array.isArray(c)) {
      const parts: string[] = [];
      for (const p of c) {
        if (p && typeof p === 'object') {
          const po = p as Record<string, unknown>;
          if (typeof po.text === 'string' && po.text) parts.push(po.text);
        } else if (typeof p === 'string' && p) {
          parts.push(p);
        }
      }
      if (parts.length > 0) return parts.join('');
    }
  }

  // 4. data.content（直接内容）
  if (typeof obj.content === 'string' && obj.content) {
    return obj.content;
  }

  return '';
}

/**
 * 调用 Ark Responses API（POST ${ARK_BASE_URL}/responses）。
 * 失败时返回 { ok: false, error }，不抛异常、不打印 API Key。
 * 不打印文件内容、身份证号、银行卡号。
 */
export async function callArkVision(request: ArkRequest): Promise<ArkResult> {
  const { apiKey, model: cfgModel, baseUrl } = loadArkConfig();
  if (!apiKey) {
    return { ok: false, error: '缺少 ARK_API_KEY' };
  }

  try {
    const url = `${baseUrl}/responses`;
    const body: Record<string, unknown> = {
      model: request.model ?? cfgModel,
      input: request.input,
    };
    if (typeof request.temperature === 'number') {
      body.temperature = request.temperature;
    }

    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: `Ark HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = await res.json();
    const content = parseArkResponseContent(data);
    if (!content) {
      return { ok: false, error: 'Ark 返回内容为空或解析失败' };
    }

    const respModel =
      (typeof (data as { model?: unknown }).model === 'string' &&
        (data as { model?: string }).model) ||
      cfgModel;

    return {
      ok: true,
      data: { content, model: respModel },
    };
  } catch (e) {
    return {
      ok: false,
      error: `Ark 调用异常: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ====== 兼容旧导出（已弃用，仅向后兼容，新代码请使用 Ark 命名） ======
// 保留 DoubaoMessage 等类型别名，避免 identify.ts 大量改动；内部已切换为 Ark 实现。
export type DoubaoMessage = ArkInputMessage;
export type DoubaoContentPart = ArkContentPart;
export type DoubaoRequest = ArkRequest;
export type DoubaoResponse = ArkResponse;
export type DoubaoResult = ArkResult;
export type DoubaoConfig = ArkConfig;

/** @deprecated 请使用 loadArkConfig */
export function loadDoubaoConfig(): ArkConfig {
  return loadArkConfig();
}

/** @deprecated 请使用 validateArkConfig */
export function validateDoubaoConfig(): { ok: boolean; error?: string } {
  return validateArkConfig();
}

/** @deprecated 请使用 callArkVision */
export function callDoubaoVision(request: ArkRequest): Promise<ArkResult> {
  return callArkVision(request);
}
