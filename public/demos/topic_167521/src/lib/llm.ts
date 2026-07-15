import type { UserConfig, ProviderConfig } from './types';
import { tavilySearch } from './tavily';
import { log } from './logger';

// ========== 激活服务商读取 ==========

// 取当前激活服务商的档案；异常情况兜底走 custom
function getActiveProvider(config: UserConfig): ProviderConfig {
  return config.providers[config.activeProvider] || config.providers.custom;
}

// 当前激活服务商是否已填 API Key（供 store / UI 判断可用性）
export function hasActiveProviderConfig(config: UserConfig): boolean {
  return !!getActiveProvider(config).apiKey;
}

// ========== 错误类型与降级判断 ==========

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

// 400 且错误信息含 temperature / unsupported parameter：模型不支持某些参数
function isTemperatureError(err: unknown): boolean {
  return err instanceof ApiError && err.status === 400 && /temperature|unsupported.*parameter/i.test(err.message);
}

// 错误信息含 "stream"：模型不支持流式
function isStreamError(err: unknown): boolean {
  return err instanceof ApiError && /stream/i.test(err.message);
}

// ========== 推理模型判断 ==========

// GPT-5 / o1 / o3 等推理模型：不收 temperature，需要 max_completion_tokens
function isReasoningModel(model: string): boolean {
  const lower = (model || '').toLowerCase();
  return lower.startsWith('gpt-5')
    || lower.startsWith('o1')
    || lower.startsWith('o3')
    || lower.includes('reasoning');
}

// ========== 底层调用（不带降级） ==========

function buildBody(prompt: string, config: UserConfig, temperature: number | undefined, stream: boolean): Record<string, unknown> {
  const provider = getActiveProvider(config);
  const model = provider.modelName || 'deepseek-chat';
  const reasoning = isReasoningModel(model);

  const body: Record<string, unknown> = {
    model,
    messages: [{ role: 'user', content: prompt }],
    stream,
  };

  // 推理模型：不传 temperature（会被拒绝/忽略），改传 max_completion_tokens
  if (reasoning) {
    body.max_completion_tokens = 4096;
  } else if (temperature !== undefined) {
    body.temperature = temperature;
  }

  return body;
}

// messages 数组版本：支持 system + 多轮历史（per-member agent 记忆用）
function buildBodyMessages(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  config: UserConfig,
  temperature: number | undefined,
  stream: boolean
): Record<string, unknown> {
  const provider = getActiveProvider(config);
  const model = provider.modelName || 'deepseek-chat';
  const reasoning = isReasoningModel(model);

  const body: Record<string, unknown> = {
    model,
    messages,
    stream,
  };

  if (reasoning) {
    body.max_completion_tokens = 4096;
  } else if (temperature !== undefined) {
    body.temperature = temperature;
  }

  return body;
}

async function parseError(response: Response): Promise<ApiError> {
  const errorText = await response.text();
  let errorMsg = `API 调用失败 (${response.status})`;
  try {
    const errorJson = JSON.parse(errorText);
    if (errorJson.error?.message) {
      errorMsg += `: ${errorJson.error.message}`;
    }
  } catch {
    if (errorText) errorMsg += `: ${errorText.slice(0, 200)}`;
  }
  return new ApiError(response.status, errorMsg);
}

// 底层：非流式
async function callOnce(prompt: string, config: UserConfig, temperature: number | undefined): Promise<string> {
  const provider = getActiveProvider(config);
  if (!provider.apiKey) {
    throw new Error('未配置 API Key，请先到设置页配置');
  }
  const baseUrl = provider.apiBaseUrl || 'https://api.deepseek.com/v1';
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(buildBody(prompt, config, temperature, false)),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API 返回内容为空');
  }
  return content;
}

// 底层：非流式（messages 数组版本）
async function callOnceMessages(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  config: UserConfig,
  temperature: number | undefined
): Promise<string> {
  const provider = getActiveProvider(config);
  if (!provider.apiKey) {
    throw new Error('未配置 API Key，请先到设置页配置');
  }
  const baseUrl = provider.apiBaseUrl || 'https://api.deepseek.com/v1';
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(buildBodyMessages(messages, config, temperature, false)),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    throw new Error('API 返回内容为空');
  }
  return content;
}

// 底层：流式
async function callStreamOnce(
  prompt: string,
  config: UserConfig,
  onChunk: (chunk: string) => void,
  temperature: number | undefined
): Promise<string> {
  const provider = getActiveProvider(config);
  if (!provider.apiKey) {
    throw new Error('未配置 API Key，请先到设置页配置');
  }
  const baseUrl = provider.apiBaseUrl || 'https://api.deepseek.com/v1';
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(buildBody(prompt, config, temperature, true)),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      } catch {
        // 忽略解析错误的行
      }
    }
  }

  return fullContent;
}

// 底层：流式（messages 数组版本）
async function callStreamOnceMessages(
  messages: { role: 'system' | 'user' | 'assistant'; content: string }[],
  config: UserConfig,
  onChunk: (chunk: string) => void,
  temperature: number | undefined
): Promise<string> {
  const provider = getActiveProvider(config);
  if (!provider.apiKey) {
    throw new Error('未配置 API Key，请先到设置页配置');
  }
  const baseUrl = provider.apiBaseUrl || 'https://api.deepseek.com/v1';
  const url = `${baseUrl}/chat/completions`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
    },
    body: JSON.stringify(buildBodyMessages(messages, config, temperature, true)),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('无法读取响应流');
  }

  const decoder = new TextDecoder();
  let fullContent = '';
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith('data: ')) continue;

      const data = trimmed.slice(6);
      if (data === '[DONE]') continue;

      try {
        const json = JSON.parse(data);
        const delta = json.choices?.[0]?.delta?.content;
        if (delta) {
          fullContent += delta;
          onChunk(delta);
        }
      } catch {
        // 忽略解析错误的行
      }
    }
  }

  return fullContent;
}

// ========== 导出：带错误驱动降级 ==========

// 非流式：带 temperature 调用，400 且错误含 temperature 时去掉重试一次
export async function callLLM(prompt: string, config: UserConfig, temperature: number = 0.8): Promise<string> {
  const promptPreview = prompt.slice(0, 30).replace(/\s+/g, ' ');
  const start = Date.now();
  log('llm', `callLLM 开始: ${promptPreview}...`, { temperature, promptLen: prompt.length });
  try {
    const content = await callOnce(prompt, config, temperature);
    log('llm', `callLLM 完成: 耗时${Date.now() - start}ms`, { promptLen: prompt.length, contentLen: content.length });
    return content;
  } catch (err) {
    if (isTemperatureError(err)) {
      log('llm', 'callLLM 重试（去掉temperature）', { promptLen: prompt.length });
      const content = await callOnce(prompt, config, undefined);
      log('llm', `callLLM 完成（重试后）: 耗时${Date.now() - start}ms`, { promptLen: prompt.length, contentLen: content.length });
      return content;
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    log('error', `callLLM 失败: ${errMsg}`, { promptLen: prompt.length, elapsed: Date.now() - start });
    throw err;
  }
}

// 流式：带 temperature 调用
// - temperature 400：去 temperature 重试流式；再失败且指向 stream 则降级非流式
// - stream 不支持：降级非流式（callLLM 内部会处理 temperature 重试）
export async function callLLMStream(
  prompt: string,
  config: UserConfig,
  onChunk: (chunk: string) => void,
  temperature: number = 0.8
): Promise<string> {
  try {
    return await callStreamOnce(prompt, config, onChunk, temperature);
  } catch (err) {
    if (isTemperatureError(err)) {
      try {
        return await callStreamOnce(prompt, config, onChunk, undefined);
      } catch (err2) {
        if (isStreamError(err2)) {
          const content = await callOnce(prompt, config, undefined);
          onChunk(content);
          return content;
        }
        throw err2;
      }
    }
    if (isStreamError(err)) {
      return await callLLM(prompt, config, temperature);
    }
    throw err;
  }
}

// ========== messages 数组版本（per-member agent 记忆用） ==========

export type ChatMessage = { role: 'system' | 'user' | 'assistant'; content: string };

// 非流式 messages 版本：带 temperature 错误降级
export async function callLLMMessages(
  messages: ChatMessage[],
  config: UserConfig,
  temperature: number = 0.8
): Promise<string> {
  const start = Date.now();
  log('llm', `callLLMMessages 开始: ${messages.length}条消息`, { temperature });
  try {
    const content = await callOnceMessages(messages, config, temperature);
    log('llm', `callLLMMessages 完成: 耗时${Date.now() - start}ms`, { contentLen: content.length });
    return content;
  } catch (err) {
    if (isTemperatureError(err)) {
      log('llm', 'callLLMMessages 重试（去掉temperature）');
      const content = await callOnceMessages(messages, config, undefined);
      log('llm', `callLLMMessages 完成（重试后）: 耗时${Date.now() - start}ms`, { contentLen: content.length });
      return content;
    }
    const errMsg = err instanceof Error ? err.message : String(err);
    log('error', `callLLMMessages 失败: ${errMsg}`, { elapsed: Date.now() - start });
    throw err;
  }
}

// 流式 messages 版本：带 temperature + stream 错误降级
export async function callLLMStreamMessages(
  messages: ChatMessage[],
  config: UserConfig,
  onChunk: (chunk: string) => void,
  temperature: number = 0.8
): Promise<string> {
  try {
    return await callStreamOnceMessages(messages, config, onChunk, temperature);
  } catch (err) {
    if (isTemperatureError(err)) {
      try {
        return await callStreamOnceMessages(messages, config, onChunk, undefined);
      } catch (err2) {
        if (isStreamError(err2)) {
          const content = await callOnceMessages(messages, config, undefined);
          onChunk(content);
          return content;
        }
        throw err2;
      }
    }
    if (isStreamError(err)) {
      return await callLLMMessages(messages, config, temperature);
    }
    throw err;
  }
}

// ========== 模型列表拉取（过滤非 chat 模型） ==========

const NON_CHAT_PREFIXES = [
  'whisper', 'tts', 'dall-e', 'text-embedding', 'text-davinci',
  'text-moderation', 'text-search', 'text-similarity', 'babbage',
  'ada', 'davinci', 'code-search', 'omni-moderation', 'audio-', 'sora',
];

function isLikelyChatModel(id: string): boolean {
  const lower = id.toLowerCase();
  if (lower.endsWith('-instruct')) return false;
  return !NON_CHAT_PREFIXES.some(prefix => lower.startsWith(prefix));
}

export async function fetchAvailableModels(config: UserConfig): Promise<string[]> {
  const provider = getActiveProvider(config);
  if (!provider.apiKey) {
    throw new Error('未配置 API Key');
  }
  const baseUrl = provider.apiBaseUrl || 'https://api.deepseek.com/v1';
  const url = `${baseUrl}/models`;

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${provider.apiKey}`,
    },
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const data = await response.json();
  const models: string[] = (data.data || [])
    .map((m: any) => m.id)
    .filter((id: string) => id)
    .filter(isLikelyChatModel)
    .sort();

  return models;
}

// ========== 错误人话映射 ==========

export interface ApiErrorInfo {
  raw: string;        // 原始错误信息
  human: string;      // 人话映射
  status?: number;    // HTTP 状态码
}

export function explainApiError(err: unknown): ApiErrorInfo {
  const raw = err instanceof Error ? err.message : String(err);
  let status: number | undefined;

  if (err instanceof ApiError) {
    status = err.status;
  } else {
    // 从消息里提取状态码，如 "Tavily 搜索失败 (429)" / "API 调用失败 (401)"
    const m = raw.match(/\((\d{3})\)/);
    if (m) status = parseInt(m[1], 10);
  }

  let human: string;
  if (status === 401) {
    human = 'Key 无效或过期，去对应服务商控制台重新生成';
  } else if (status === 429) {
    human = '限流或余额不足，去充值页看看';
  } else if (status === 404 && /model/i.test(raw)) {
    human = "模型名不对，换一个或点'拉取模型列表'看支持的模型";
  } else if (status === 400 && /temperature/i.test(raw)) {
    human = '这个模型不支持 temperature 参数（已自动重试去掉，仍失败说明还有其他问题）';
  } else if (status === 400 && /max_tokens/i.test(raw)) {
    human = '这个模型要用 max_completion_tokens 参数（已自动处理，仍失败说明还有其他问题）';
  } else if (/failed to fetch|networkerror|load failed/i.test(raw)) {
    human = '连不上服务商，检查网络或 Base URL 是否填对';
  } else {
    human = '调用失败，看上面的原始错误';
  }

  return { raw, human, status };
}

// ========== 连通性检测 ==========

export interface TestResult {
  ok: boolean;
  latencyMs?: number;     // 成功时的耗时
  error?: ApiErrorInfo;   // 失败时的错误信息
}

// 测试当前激活服务商：发一次最小调用 "ping"，不传 temperature（避免推理模型问题）
export async function testProviderConnection(config: UserConfig): Promise<TestResult> {
  const start = Date.now();
  try {
    await callOnce('ping', config, undefined);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: explainApiError(err) };
  }
}

// 测试 Tavily：发一次搜索 "test"
export async function testTavilyConnection(apiKey: string): Promise<TestResult> {
  const start = Date.now();
  try {
    await tavilySearch('test', apiKey);
    return { ok: true, latencyMs: Date.now() - start };
  } catch (err) {
    return { ok: false, error: explainApiError(err) };
  }
}
