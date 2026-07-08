// DeepSeek V4 真实 API 接入（第 4 轮）
// 使用 Node 原生 fetch，不引入 axios/openai SDK。
// 真实密钥只能通过环境变量 DEEPSEEK_API_KEY 注入，不得写入仓库、不得打印到日志。

import type {
  RegionInfo,
  ReviewItem,
  ReviewResult,
} from '../shared/api-types';

const DEEPSEEK_BASE_URL = 'https://api.deepseek.com';

// ====== 基础配置 ======
export interface DeepSeekConfig {
  apiKey: string;
  model: string;
}

/** 多模态消息内容片段（第 5 轮材料识别用） */
export type DeepSeekContentPart =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: { url: string } };

export interface DeepSeekMessage {
  role: 'system' | 'user' | 'assistant';
  /** 纯文本消息用 string；含图片用 DeepSeekContentPart[] */
  content: string | DeepSeekContentPart[];
}

export interface DeepSeekRequest {
  messages: DeepSeekMessage[];
  temperature?: number;
}

export interface DeepSeekResponse {
  content: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export type DeepSeekResult =
  | { ok: true; data: DeepSeekResponse }
  | { ok: false; error: string };

/**
 * 从环境变量读取 DeepSeek 配置。
 * 缺少 API Key 时 apiKey 为空字符串，由调用方决定兜底。
 */
export function loadDeepSeekConfig(): DeepSeekConfig {
  const apiKey = process.env.DEEPSEEK_API_KEY?.trim() ?? '';
  const model = process.env.DEEPSEEK_MODEL?.trim() || 'deepseek-v4-flash';
  return { apiKey, model };
}

/**
 * 校验是否具备调用 DeepSeek 的前置条件（仅检查 API Key 是否存在）。
 */
export function validateDeepSeekConfig(): { ok: boolean; error?: string } {
  const { apiKey } = loadDeepSeekConfig();
  if (!apiKey) {
    return {
      ok: false,
      error:
        '缺少 DEEPSEEK_API_KEY。请在 .env 中填写有效密钥后再调用（不要将真实密钥提交到仓库）。',
    };
  }
  return { ok: true };
}

/**
 * 调用 DeepSeek /chat/completions。
 * 失败时返回 { ok: false, error }，不抛异常、不打印 API Key。
 */
export async function callDeepSeek(
  request: DeepSeekRequest,
): Promise<DeepSeekResult> {
  const { apiKey, model } = loadDeepSeekConfig();
  if (!apiKey) {
    return { ok: false, error: '缺少 DEEPSEEK_API_KEY' };
  }

  try {
    const res = await fetch(`${DEEPSEEK_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.2,
        response_format: { type: 'json_object' },
      }),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return {
        ok: false,
        error: `DeepSeek HTTP ${res.status}: ${text.slice(0, 200)}`,
      };
    }

    const data = (await res.json()) as {
      model?: string;
      choices?: Array<{ message?: { content?: string } }>;
      usage?: {
        prompt_tokens?: number;
        completion_tokens?: number;
        total_tokens?: number;
      };
    };

    const content = data?.choices?.[0]?.message?.content ?? '';
    if (!content) {
      return { ok: false, error: 'DeepSeek 返回内容为空' };
    }

    return {
      ok: true,
      data: {
        content,
        model: data?.model ?? model,
        usage: data?.usage
          ? {
              promptTokens: data.usage.prompt_tokens ?? 0,
              completionTokens: data.usage.completion_tokens ?? 0,
              totalTokens: data.usage.total_tokens ?? 0,
            }
          : undefined,
      },
    };
  } catch (e) {
    return {
      ok: false,
      error: `DeepSeek 调用异常: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

// ====== AI 预审编排（构建提示词 → 调用 → 解析 JSON） ======
export interface AiReviewInput {
  serviceCode: string;
  serviceName: string;
  region: RegionInfo;
  applicantType?: 'self' | 'family';
  age?: number;
  livingInGD?: 'yes' | 'no';
  materials: string[];
}

export type AiReviewOutcome =
  | { ok: true; result: ReviewResult }
  | { ok: false; error: string };

const SYSTEM_PROMPT = `你是 CivicMate 办事材料准备助手，面向广东省办事场景，帮助老人整理办事材料。你不是一个官方审批系统，不进行任何行政审批。

严格遵守以下限制：
1. 不得声称"审核通过"或任何类似官方审批结论的表述。
2. 不得生成法律、医疗、行政审批结论。
3. 不得编造当地政策细节（如具体补贴金额、办理时限、办理窗口地址等）。不确定的内容必须放入 uncertain。
4. 输出语言：简体中文。
5. 输出格式：严格 JSON，不要 Markdown，不要代码块，不要任何 JSON 之外的文字。
6. 以提供的"本地规则预审结果"为硬约束：
   - 不得把本地判定为 missing 的材料标为 ready；
   - 不得删除本地给出的材料项；
   - 你只能优化每项的 description 解释、补充 riskNotes、生成 plainChecklist 老人友好清单、把无法靠材料判断的问题放入 uncertain。

输出 JSON 结构必须严格如下：
{
  "ready": [{"name":"材料名","description":"说明"}],
  "missing": [{"name":"材料名","description":"说明"}],
  "uncertain": [{"name":"待确认事项","description":"说明"}],
  "plainChecklist": ["老人友好清单条目（口语化、大字友好）"],
  "riskNotes": ["风险提示条目"],
  "disclaimer": "免责声明"
}`;

function buildUserPrompt(input: AiReviewInput, localReview: ReviewResult): string {
  const regionLabel = [
    input.region.provinceName,
    input.region.cityName,
    input.region.countyName,
  ]
    .filter(Boolean)
    .join(' / ');

  const ctx = {
    事项编码: input.serviceCode,
    事项名称: input.serviceName,
    地区: regionLabel || '未选择',
    办理人类型: input.applicantType === 'self' ? '本人办理' : input.applicantType === 'family' ? '家属代办' : '未选择',
    年龄: input.age ?? '未提供',
    是否广东省内居住: input.livingInGD === 'yes' ? '是' : input.livingInGD === 'no' ? '否' : '未提供',
    已登记材料: input.materials,
  };

  return `请基于以下用户输入和本地规则预审结果，输出严格 JSON。

【用户输入】
${JSON.stringify(ctx, null, 2)}

【本地规则预审结果（硬约束）】
${JSON.stringify(localReview, null, 2)}

请按系统提示的 JSON 结构输出，不得包含任何 JSON 之外的文字。`;
}

/** 去除可能的 Markdown 代码块包裹，提取首个 JSON 对象。 */
function extractJsonString(raw: string): string {
  let s = raw.trim();
  // 去除 ```json ... ``` 或 ``` ... ``` 包裹
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) {
    s = fence[1].trim();
  }
  // 若仍含代码块标记，截取首个 { 到末尾 }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x : typeof x === 'number' ? String(x) : ''))
    .filter((x) => x.length > 0);
}

function asItemList(v: unknown): ReviewItem[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x): ReviewItem | null => {
      if (x && typeof x === 'object') {
        const obj = x as Record<string, unknown>;
        const name = typeof obj.name === 'string' ? obj.name : '';
        if (!name) return null;
        const description =
          typeof obj.description === 'string' ? obj.description : undefined;
        return { name, description };
      }
      if (typeof x === 'string' && x.length > 0) {
        return { name: x };
      }
      return null;
    })
    .filter((x): x is ReviewItem => x !== null);
}

/** 把 AI 返回的任意结构归一化为合法 ReviewResult。 */
function normalizeResult(v: unknown): ReviewResult {
  const obj = (v && typeof v === 'object' ? v : {}) as Record<string, unknown>;
  return {
    ready: asItemList(obj.ready),
    missing: asItemList(obj.missing),
    uncertain: asItemList(obj.uncertain),
    plainChecklist: asStringArray(obj.plainChecklist),
    riskNotes: asStringArray(obj.riskNotes),
    disclaimer:
      typeof obj.disclaimer === 'string' && obj.disclaimer.trim()
        ? obj.disclaimer
        : '本结果仅供材料准备参考，正式办理请以官方窗口要求为准。',
  };
}

// ====== 本地规则硬约束合并 ======
const DEFAULT_DISCLAIMER =
  '本结果仅供材料准备参考，正式办理请以官方窗口要求为准。';
// disclaimer 至少需要这么多字符，且必须含"官方窗口/办事机关/以官方/以窗口"之一，否则视为无效
const MIN_DISCLAIMER_LEN = 10;
const OFFICIAL_KEYWORDS = ['官方窗口', '办事机关', '以官方', '以窗口', '窗口要求'];

function hasOfficialMeaning(s: string): boolean {
  const t = s?.trim() ?? '';
  if (t.length < MIN_DISCLAIMER_LEN) return false;
  return OFFICIAL_KEYWORDS.some((k) => t.includes(k));
}

function dedupeStrings(items: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const s of items) {
    const key = (s ?? '').trim();
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
  }
  return out;
}

function dedupeItemsBy(items: ReviewItem[]): ReviewItem[] {
  const seen = new Set<string>();
  const out: ReviewItem[] = [];
  for (const it of items) {
    const name = (it?.name ?? '').trim();
    if (!name) continue;
    if (seen.has(name)) continue;
    seen.add(name);
    out.push(it);
  }
  return out;
}

/**
 * 把 AI 返回结果与本地规则预审结果合并，强制以本地规则为硬约束。
 *
 * 规则：
 * 1. ready 完全以 localReview.ready 为准，AI 不得改写；
 *    本地 ready 中的材料必须仍出现在最终 ready，不能被 AI 移到 missing。
 * 2. missing 完全以 localReview.missing 为准，AI 不得改写；
 *    本地 missing 中的材料必须仍出现在最终 missing，不能被 AI 移到 ready。
 * 3. uncertain 至少包含 localReview.uncertain 全部；
 *    可追加 AI 新增的不确定项（按 name 去重，本地优先）。
 * 4. plainChecklist 优先使用 AI 版本（口语化老人友好清单）；
 *    若 AI plainChecklist 为空则回退 localReview.plainChecklist。
 * 5. riskNotes 合并 localReview.riskNotes 与 AI riskNotes，去重（本地在前）。
 * 6. disclaimer 必须保留"正式办理请以官方窗口要求为准"含义；
 *    若 AI disclaimer 为空/过短/不含官方窗口关键词，则使用 localReview.disclaimer。
 */
export function mergeAiWithLocal(
  aiResult: ReviewResult,
  localReview: ReviewResult,
): ReviewResult {
  // 1. ready / missing 完全以本地为准（AI 分类被忽略）
  const ready: ReviewItem[] = localReview.ready.map((it) => ({ ...it }));
  const missing: ReviewItem[] = localReview.missing.map((it) => ({ ...it }));

  // 2. uncertain: 本地全保留 + AI 新增（按 name 去重）
  const uncertain = dedupeItemsBy([
    ...localReview.uncertain,
    ...aiResult.uncertain,
  ]);

  // 3. plainChecklist: 优先 AI，为空则回退本地
  const plainChecklist =
    aiResult.plainChecklist && aiResult.plainChecklist.length > 0
      ? dedupeStrings(aiResult.plainChecklist)
      : [...localReview.plainChecklist];

  // 4. riskNotes: 合并去重（本地在前）
  const riskNotes = dedupeStrings([
    ...localReview.riskNotes,
    ...aiResult.riskNotes,
  ]);

  // 5. disclaimer: 必须保留官方窗口含义
  const localDisclaimer =
    localReview.disclaimer?.trim() || DEFAULT_DISCLAIMER;
  const aiDisclaimer = aiResult.disclaimer?.trim() ?? '';
  const disclaimer = hasOfficialMeaning(aiDisclaimer)
    ? aiDisclaimer
    : localDisclaimer;

  return {
    ready,
    missing,
    uncertain,
    plainChecklist,
    riskNotes,
    disclaimer,
  };
}

/**
 * 调用 DeepSeek 进行 AI 预审。
 * - 缺 API Key：返回 { ok: false, error }，由调用方走兜底。
 * - 调用失败 / JSON 解析失败：返回 { ok: false, error }，由调用方走兜底。
 * - 成功：返回 { ok: true, result: ReviewResult }。
 */
export async function aiReviewMaterials(
  input: AiReviewInput,
  localReview: ReviewResult,
): Promise<AiReviewOutcome> {
  const dsRes = await callDeepSeek({
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: buildUserPrompt(input, localReview) },
    ],
    temperature: 0.2,
  });

  if (!dsRes.ok) {
    return { ok: false, error: dsRes.error };
  }

  const jsonStr = extractJsonString(dsRes.data.content);
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    return {
      ok: false,
      error: `AI 返回 JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }

  // 成功解析后，必须经过 mergeAiWithLocal 强制以本地规则为硬约束，
  // 不允许 AI 改写本地 ready/missing 分类。
  return {
    ok: true,
    result: mergeAiWithLocal(normalizeResult(parsed), localReview),
  };
}
