// 材料类型辅助识别（第 5 轮）
// 接收前端上传的文件（multer memoryStorage，不落盘）。
// 识别优先级：
//   1. 图片 + Ark 视觉模型配置完整 → Ark Responses API 视觉理解
//   2. Ark 失败/未配置 → DeepSeek 纯文本降级（不发图片 base64）
//   3. PDF → 元信息/文件名逻辑（DeepSeek 文本）
//   4. 全部失败 → fallback + 保留 userLabel
// 不打印文件内容、身份证号、银行卡号、API Key。文件 buffer 仅在本次请求内存中存活。

import type { DeepSeekContentPart, DeepSeekMessage } from './deepseek';
import { callDeepSeek, validateDeepSeekConfig } from './deepseek';
import type { ArkInputMessage } from './doubao';
import { callArkVision, validateArkConfig } from './doubao';
import type {
  MaterialIdentifyItem,
  MaterialIdentifyReply,
  MaterialIdentifyResponse,
} from '../shared/api-types';

// ====== 输入结构（由 index.ts 从 multer 文件转换而来） ======
export interface IdentifyFileInput {
  originalname: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

export interface IdentifyRequestInput {
  files: IdentifyFileInput[];
  serviceCode: string;
  /** 前端传入的用户手动标注：fileName -> materialName */
  userLabels?: Record<string, string>;
}

/**
 * 解析 userLabels：支持 JSON 字符串、已解析对象、multer 数组字段。
 * 兼容 multipart/form-data 中 text field 传入的字符串 JSON。
 * 过滤非字符串 key/value，确保返回稳定的 Record<string, string>。
 * JSON 解析失败时返回 undefined（正常 JSON 必须生效）。
 */
export function parseUserLabels(
  raw: unknown,
): Record<string, string> | undefined {
  if (raw == null) return undefined;
  let obj: unknown = raw;
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return undefined;
    try {
      obj = JSON.parse(s);
    } catch {
      return undefined;
    }
  } else if (Array.isArray(raw)) {
    // multer 可能将重复字段返回为数组；取第一个有效字符串
    const first = raw.find(
      (x): x is string => typeof x === 'string' && x.trim().length > 0,
    );
    if (!first) return undefined;
    try {
      obj = JSON.parse(first.trim());
    } catch {
      return undefined;
    }
  }
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) return undefined;
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj as Record<string, unknown>)) {
    // key/value 都必须是字符串且非空（含中文/空格的文件名也按 originalname 精确匹配）
    if (typeof k === 'string' && k && typeof v === 'string' && v) {
      result[k] = v;
    }
  }
  return Object.keys(result).length > 0 ? result : undefined;
}

/**
 * userLabel 保留安全网：在所有返回路径（success/skipped/fallback）上调用，
 * 确保只要 input.userLabels 中存在与 item.fileName 匹配的标注，item.userLabel 必定被写入。
 * 即使 normalizeAiItems / buildPassthroughItems 出现遗漏，本函数会兜底补齐。
 */
export function ensureUserLabels(
  items: MaterialIdentifyItem[],
  input: IdentifyRequestInput,
): MaterialIdentifyItem[] {
  if (!input.userLabels) return items;
  return items.map((it) => {
    const label = input.userLabels?.[it.fileName];
    if (!label) return it;
    // 已存在且一致则不改；不存在或为空则补齐
    if (it.userLabel === label) return it;
    return { ...it, userLabel: label };
  });
}

// ====== 常量 ======
const PRIVACY_NOTICE = '文件仅用于本次识别请求，服务端不长期保存。';

// 候选材料清单（与前端 MATERIALS 一致，供 AI 选择）
const MATERIAL_CANDIDATES: string[] = [
  '身份证',
  '户口本',
  '银行卡',
  '证件照',
  '居住证明',
  '医疗票据',
  '费用清单',
  '诊断证明',
  '代办人身份证',
  '授权委托书',
  '亲属关系证明',
];

// 图片超过此大小（字节）则不附带 data URL，仅发元信息，避免请求体过大
const IMAGE_INLINE_LIMIT = 3 * 1024 * 1024; // 3MB

const IDENTIFY_SYSTEM_PROMPT = `你是 CivicMate 办事材料识别助手，帮助用户判断上传的文件属于哪类办事材料。

限制：
1. docType 只能从候选材料清单中选择；若无法判断则留空字符串，confidence 设为 "low"。
2. 不得声称"审核通过"或任何官方审批结论。
3. 不得编造文件内容；只根据可见信息给建议。extractedText 只填写肉眼可见的公开信息，不要填写完整身份证号、银行卡号等敏感字段，可用 "****" 脱敏。
4. 输出语言：简体中文。
5. 输出格式：严格 JSON，不要 Markdown，不要代码块，不要任何 JSON 之外的文字。
6. confidence 取值：high（明确）/ medium（较可能）/ low（不确定）。
7. 对每个上传文件必须输出一条 item，fileName 必须与用户上传的文件名一致。
8. warnings 为字符串数组，记录识别中的疑点或建议人工复核的事项；无则返回空数组。

输出 JSON 结构严格如下：
{
  "items": [
    {
      "fileName": "id-card.jpg",
      "docType": "身份证",
      "title": "中华人民共和国居民身份证",
      "confidence": "high",
      "extractedText": "姓名 **** 证件号码 ****",
      "issueDate": "",
      "expiryDate": "",
      "ownerName": "****",
      "warnings": ["证件边缘不完整，建议人工复核"]
    }
  ]
}`;

// ====== 工具函数 ======
function toDataUrl(f: IdentifyFileInput): string {
  return `data:${f.mimetype};base64,${f.buffer.toString('base64')}`;
}

/** 构造 skipped / fallback 时的 items：保留用户标注，不附带 AI 建议。 */
export function buildPassthroughItems(
  input: IdentifyRequestInput,
  notes: string,
): MaterialIdentifyItem[] {
  return input.files.map((f) => ({
    fileName: f.originalname,
    userLabel: input.userLabels?.[f.originalname],
    confidence: 'unknown',
    notes,
  }));
}

/** 构造调用 DeepSeek 的 multimodal messages。 */
function buildIdentifyMessages(
  input: IdentifyRequestInput,
): DeepSeekMessage[] {
  const userParts: DeepSeekContentPart[] = [];

  // 1. 事项 + 候选清单
  userParts.push({
    type: 'text',
    text:
      `事项编码：${input.serviceCode || '未选择'}\n` +
      `候选材料清单：${MATERIAL_CANDIDATES.join('、')}`,
  });

  // 2. 文件元信息清单（含用户标注）
  const metaLines = input.files.map((f, i) => {
    const label = input.userLabels?.[f.originalname];
    const parts = [
      `${i + 1}. fileName=${f.originalname}`,
      `mime=${f.mimetype}`,
      `size=${f.size}`,
    ];
    if (label) parts.push(`userLabel=${label}`);
    return parts.join(', ');
  });
  userParts.push({
    type: 'text',
    text: `已上传文件清单（共 ${input.files.length} 个）：\n${metaLines.join('\n')}`,
  });

  // 3. 逐个文件附内容：图片附 data URL（超限则降级为元信息），PDF 仅元信息
  for (const f of input.files) {
    if (f.mimetype === 'application/pdf') {
      userParts.push({
        type: 'text',
        text: `PDF 文件 ${f.originalname}：本轮仅发送文件名与元信息，PDF 内容识别将在后续增强。`,
      });
    } else if (f.mimetype.startsWith('image/')) {
      if (f.size > IMAGE_INLINE_LIMIT) {
        userParts.push({
          type: 'text',
          text: `图片 ${f.originalname} 体积较大（${f.size} 字节），本轮未附内容，仅依据文件名与标注判断。`,
        });
      } else {
        userParts.push({
          type: 'image_url',
          image_url: { url: toDataUrl(f) },
        });
      }
    } else {
      userParts.push({
        type: 'text',
        text: `文件 ${f.originalname} 类型未知（${f.mimetype}），仅依据文件名判断。`,
      });
    }
  }

  // 4. 输出要求
  userParts.push({
    type: 'text',
    text:
      '请对每个上传文件输出一条 item，fileName 必须与上述清单一致。' +
      '严格输出 JSON：{"items":[{"fileName":"...","docType":"...","title":"...","confidence":"high|medium|low","extractedText":"...","issueDate":"...","expiryDate":"...","ownerName":"...","warnings":["..."]}]}，' +
      '不要包含任何 JSON 之外的文字。',
  });

  return [
    { role: 'system', content: IDENTIFY_SYSTEM_PROMPT },
    { role: 'user', content: userParts },
  ];
}

/** 校验 AI 返回的 docType/suggestedMaterial 是否在候选清单内。 */
function sanitizeSuggested(raw: unknown): string {
  if (typeof raw === 'string' && MATERIAL_CANDIDATES.includes(raw)) {
    return raw;
  }
  return '';
}

function sanitizeConfidence(raw: unknown): 'high' | 'medium' | 'low' | 'unknown' {
  if (raw === 'high' || raw === 'medium' || raw === 'low') return raw;
  return 'unknown';
}

/** 把字符串字段安全转换为非空字符串（失败返回空串）。 */
function asNonEmptyString(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

/** 把 warnings 字段安全转换为字符串数组。 */
function asWarnings(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v
    .map((x) => (typeof x === 'string' ? x.trim() : ''))
    .filter((x) => x.length > 0);
}

/**
 * 把 Ark/DeepSeek 返回的任意结构归一化为按文件名对齐的 items。
 * 支持新字段（docType/title/extractedText/issueDate/expiryDate/ownerName/warnings）
 * 与旧字段（suggestedMaterial/notes）兼容。
 * docType 优先映射为 suggestedMaterial；其他视觉字段拼接为 notes。
 */
export function normalizeAiItems(
  parsed: unknown,
  input: IdentifyRequestInput,
): MaterialIdentifyItem[] {
  const obj =
    parsed && typeof parsed === 'object'
      ? (parsed as Record<string, unknown>)
      : {};
  const rawItems = Array.isArray(obj.items) ? obj.items : [];

  const aiByName = new Map<string, Record<string, unknown>>();
  for (const r of rawItems) {
    if (r && typeof r === 'object') {
      const rec = r as Record<string, unknown>;
      const name = typeof rec.fileName === 'string' ? rec.fileName : '';
      if (name) aiByName.set(name, rec);
    }
  }

  return input.files.map((f) => {
    const userLabel = input.userLabels?.[f.originalname];
    const ai = aiByName.get(f.originalname);

    // suggestedMaterial 优先取 docType，回退 suggestedMaterial
    const docType = ai ? asNonEmptyString(ai.docType) : '';
    const legacySuggested = ai ? asNonEmptyString(ai.suggestedMaterial) : '';
    const suggested = sanitizeSuggested(docType || legacySuggested);
    const confidence = ai ? sanitizeConfidence(ai.confidence) : 'unknown';

    // 拼接 notes：优先使用视觉字段，回退 legacy notes
    const notesParts: string[] = [];
    if (ai) {
      const title = asNonEmptyString(ai.title);
      const extractedText = asNonEmptyString(ai.extractedText);
      const issueDate = asNonEmptyString(ai.issueDate);
      const expiryDate = asNonEmptyString(ai.expiryDate);
      const ownerName = asNonEmptyString(ai.ownerName);
      const warnings = asWarnings(ai.warnings);
      const legacyNotes = asNonEmptyString(ai.notes);

      if (title) notesParts.push(`标题：${title}`);
      if (extractedText) notesParts.push(`可见信息：${extractedText}`);
      if (issueDate) notesParts.push(`签发日期：${issueDate}`);
      if (expiryDate) notesParts.push(`有效期：${expiryDate}`);
      if (ownerName) notesParts.push(`持有人：${ownerName}`);
      if (warnings.length > 0) notesParts.push(`提示：${warnings.join('；')}`);
      if (legacyNotes) notesParts.push(legacyNotes);
    }
    const notes = notesParts.length > 0 ? notesParts.join(' | ') : undefined;

    const item: MaterialIdentifyItem = {
      fileName: f.originalname,
      confidence,
    };
    if (userLabel) item.userLabel = userLabel;
    if (suggested) item.suggestedMaterial = suggested;
    if (notes) item.notes = notes;
    return item;
  });
}

/** 去除可能的 Markdown 代码块包裹，提取首个 JSON 对象。 */
function extractJsonString(raw: string): string {
  let s = raw.trim();
  const fence = s.match(/^```(?:json)?\s*([\s\S]*?)\s*```$/i);
  if (fence) {
    s = fence[1].trim();
  }
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start !== -1 && end !== -1 && end > start) {
    s = s.slice(start, end + 1);
  }
  return s;
}

// ====== 辅助：调用 API 并解析 JSON ======
type CallAndParseResult =
  | { ok: true; parsed: unknown }
  | { ok: false; error: string };

/** 从 AI 返回内容中提取并解析 JSON。 */
function parseAiJson(content: string): CallAndParseResult {
  const jsonStr = extractJsonString(content);
  try {
    return { ok: true, parsed: JSON.parse(jsonStr) };
  } catch (e) {
    return {
      ok: false,
      error: `AI 返回 JSON 解析失败: ${e instanceof Error ? e.message : String(e)}`,
    };
  }
}

/** 调用 DeepSeek 并解析 JSON。 */
async function callAndParse(
  messages: DeepSeekMessage[],
): Promise<CallAndParseResult> {
  const dsRes = await callDeepSeek({ messages, temperature: 0.1 });
  if (!dsRes.ok) {
    return { ok: false, error: dsRes.error };
  }
  return parseAiJson(dsRes.data.content);
}

/** 调用 Ark 视觉模型（Responses API）并解析 JSON。 */
async function callArkAndParse(
  messages: ArkInputMessage[],
): Promise<CallAndParseResult> {
  const arkRes = await callArkVision({
    input: messages,
    temperature: 0.1,
  });
  if (!arkRes.ok) {
    return { ok: false, error: arkRes.error };
  }
  return parseAiJson(arkRes.data.content);
}

/** 是否含图片文件（用于判断是否需要文本降级）。 */
function hasImageFiles(input: IdentifyRequestInput): boolean {
  return input.files.some((f) => f.mimetype.startsWith('image/'));
}

/**
 * 纯文本降级消息：不发图片 base64，仅发文件名/mime/size/userLabel/候选清单。
 * 用于第一次 multimodal 调用失败后的降级。
 */
function buildTextOnlyMessages(input: IdentifyRequestInput): DeepSeekMessage[] {
  const userParts: DeepSeekContentPart[] = [];
  userParts.push({
    type: 'text',
    text:
      `事项编码：${input.serviceCode || '未选择'}\n` +
      `候选材料清单：${MATERIAL_CANDIDATES.join('、')}`,
  });
  const metaLines = input.files.map((f, i) => {
    const label = input.userLabels?.[f.originalname];
    const parts = [
      `${i + 1}. fileName=${f.originalname}`,
      `mime=${f.mimetype}`,
      `size=${f.size}`,
    ];
    if (label) parts.push(`userLabel=${label}`);
    return parts.join(', ');
  });
  userParts.push({
    type: 'text',
    text: `已上传文件清单（共 ${input.files.length} 个）：\n${metaLines.join('\n')}`,
  });
  userParts.push({
    type: 'text',
    text:
      '说明：当前模型未读取图片/PDF 内容，请仅根据文件名、mime、size、用户标注给出建议材料类型。' +
      '若无法判断，docType 留空，confidence 设为 "low"。',
  });
  userParts.push({
    type: 'text',
    text:
      '请对每个文件输出一条 item，fileName 必须与上述清单一致。' +
      '严格输出 JSON：{"items":[{"fileName":"...","docType":"...","title":"...","confidence":"high|medium|low","extractedText":"...","issueDate":"...","expiryDate":"...","ownerName":"...","warnings":["..."]}]}，' +
      '不要包含任何 JSON 之外的文字。',
  });
  return [
    { role: 'system', content: IDENTIFY_SYSTEM_PROMPT },
    { role: 'user', content: userParts },
  ];
}

/** 给 items 的 notes 追加说明（已有 notes 拼接）。 */
function appendNote(
  items: MaterialIdentifyItem[],
  note: string,
): MaterialIdentifyItem[] {
  return items.map((it) => ({
    ...it,
    notes: it.notes ? `${it.notes} ${note}` : note,
  }));
}

/** success 返回前对 items 做最终处理：PDF 追加说明 + 可选额外 note。 */
export function finalizeItems(
  items: MaterialIdentifyItem[],
  input: IdentifyRequestInput,
  extraNote?: string,
): MaterialIdentifyItem[] {
  const pdfNames = new Set(
    input.files
      .filter((f) => f.mimetype === 'application/pdf')
      .map((f) => f.originalname),
  );
  let result = items;
  if (extraNote) {
    result = appendNote(result, extraNote);
  }
  const pdfNote = 'PDF 内容识别尚未增强，仅基于元信息判断。';
  return result.map((it) => {
    if (!pdfNames.has(it.fileName)) return it;
    return {
      ...it,
      notes: it.notes ? `${it.notes} ${pdfNote}` : pdfNote,
    };
  });
}

// ====== 主入口 ======
/**
 * 材料类型辅助识别。
 * 识别优先级：
 *   1. 图片 + Ark 视觉模型配置完整 → Ark Responses API 视觉理解
 *   2. Ark 失败/未配置 → DeepSeek 纯文本降级（不发图片 base64）
 *   3. PDF → 元信息/文件名逻辑（DeepSeek 文本）
 *   4. 全部失败 → fallback + 保留 userLabel
 * - 均未配置 → skipped + 保留 userLabel
 * - PDF 文件 notes 追加"PDF 内容识别尚未增强，仅基于元信息判断。"
 * - 所有路径均经 ensureUserLabels 安全网保留 userLabel。
 * 不抛异常，不打印文件内容、不打印 API Key。
 */
export async function identifyMaterials(
  input: IdentifyRequestInput,
): Promise<MaterialIdentifyReply> {
  // 无文件直接返回空 items
  if (input.files.length === 0) {
    const reply: MaterialIdentifyResponse = {
      ok: true,
      aiStatus: 'skipped',
      items: [],
      privacyNotice: PRIVACY_NOTICE,
    };
    return reply;
  }

  const arkValid = validateArkConfig();
  const deepseekValid = validateDeepSeekConfig();
  const hasImages = hasImageFiles(input);

  // 均未配置 → skipped（保留 userLabel）
  if (!arkValid.ok && !deepseekValid.ok) {
    const note = hasImages
      ? '未配置 Ark 视觉模型与 DeepSeek，仅保留用户标注。'
      : '未配置 API Key，仅保留用户标注。';
    // 经 finalizeItems 给 PDF 追加"PDF 内容识别尚未增强"说明
    const items = finalizeItems(buildPassthroughItems(input, note), input);
    const reply: MaterialIdentifyResponse = {
      ok: true,
      aiStatus: 'skipped',
      items: ensureUserLabels(items, input),
      privacyNotice: PRIVACY_NOTICE,
    };
    return reply;
  }

  // 1. 图片 + Ark 视觉模型配置完整：调用 Ark Responses API 视觉理解
  if (hasImages && arkValid.ok) {
    const result = await callArkAndParse(buildIdentifyMessages(input));
    if (result.ok) {
      const items = finalizeItems(
        normalizeAiItems(result.parsed, input),
        input,
        'Ark 视觉模型辅助识别。',
      );
      const reply: MaterialIdentifyResponse = {
        ok: true,
        aiStatus: 'success',
        items: ensureUserLabels(items, input),
        privacyNotice: PRIVACY_NOTICE,
      };
      return reply;
    }
    // Ark 失败，继续走文本降级
  }

  // 2. 文本降级（DeepSeek 纯文本，不发图片 base64）
  if (deepseekValid.ok) {
    const result = await callAndParse(buildTextOnlyMessages(input));
    if (result.ok) {
      // 根据是否含图片 + Ark 配置状态决定 extraNote
      let extraNote: string | undefined;
      if (hasImages) {
        extraNote = arkValid.ok
          ? 'Ark 视觉识别失败，基于文件名/用户标注辅助判断，未读取图片内容。'
          : '未配置 Ark 视觉模型，基于文件名/用户标注辅助判断，未读取图片内容。';
      }
      const items = finalizeItems(
        normalizeAiItems(result.parsed, input),
        input,
        extraNote,
      );
      const reply: MaterialIdentifyResponse = {
        ok: true,
        aiStatus: 'success',
        items: ensureUserLabels(items, input),
        privacyNotice: PRIVACY_NOTICE,
      };
      return reply;
    }
  }

  // 3. 全部失败 → fallback（保留 userLabel）
  const note =
    hasImages && !arkValid.ok
      ? '未配置 Ark 视觉模型，AI 识别失败，仅保留用户标注。'
      : 'AI 识别失败，仅保留用户标注。';
  // 经 finalizeItems 给 PDF 追加"PDF 内容识别尚未增强"说明
  const fallbackItems = finalizeItems(buildPassthroughItems(input, note), input);
  const reply: MaterialIdentifyResponse = {
    ok: true,
    aiStatus: 'fallback',
    items: ensureUserLabels(fallbackItems, input),
    privacyNotice: PRIVACY_NOTICE,
  };
  return reply;
}
