// ====== LLM 调用抽象层 ======
// MVP 阶段使用本地逻辑实现，此文件预留 AI API 调用接口
// 后续接入 GLM-5.2 / Doubao-Seed-2.1-pro 时只需替换 callLLM 内部实现

/** 支持的模型类型 */
export type LLMModel = 'glm' | 'doubao';

/** LLM 调用参数 */
export interface LLMCallOptions {
  /** 完整的 prompt 文本 */
  prompt: string;
  /** 使用的模型，默认 glm */
  model?: LLMModel;
  /** 温度参数，控制生成随机性，0-1 */
  temperature?: number;
  /** 最大生成 token 数 */
  maxTokens?: number;
}

/** LLM 响应结构 */
export interface LLMResponse {
  /** 模型生成的文本内容 */
  content: string;
  /** token 使用统计 */
  usage?: {
    promptTokens: number;
    completionTokens: number;
  };
}

/** 是否启用真实 LLM 调用（MVP 阶段为 false） */
export const LLM_ENABLED = false;

/**
 * 调用大语言模型
 *
 * MVP 阶段：返回空响应，Agent 使用本地逻辑处理
 * 后续接入时：根据 model 参数路由到 GLM 或 Doubao API
 *
 * @example
 * // 后续接入 GLM 的伪代码：
 * if (model === 'glm') {
 *   const res = await fetch('https://open.bigmodel.cn/api/paas/v4/chat/completions', {
 *     method: 'POST',
 *     headers: { Authorization: `Bearer ${process.env.GLM_API_KEY}` },
 *     body: JSON.stringify({ model: 'glm-5.2', messages: [{ role: 'user', content: prompt }], temperature }),
 *   });
 *   return parseGLMResponse(res);
 * }
 */
export async function callLLM(options: LLMCallOptions): Promise<LLMResponse> {
  const { prompt, model = 'glm', temperature = 0.7, maxTokens = 2000 } = options;

  // MVP 阶段：模拟异步延迟，返回空响应
  await simulateLatency(50 + Math.random() * 100);

  if (!LLM_ENABLED) {
    return {
      content: '',
      usage: { promptTokens: 0, completionTokens: 0 },
    };
  }

  // ---- 以下为后续接入真实 API 的预留结构 ----
  // try {
  //   if (model === 'glm') {
  //     return await callGLMAPI(prompt, temperature, maxTokens);
  //   }
  //   if (model === 'doubao') {
  //     return await callDoubaoAPI(prompt, temperature, maxTokens);
  //   }
  // } catch (error) {
  //   console.error(`[LLM] ${model} 调用失败:`, error);
  //   throw error;
  // }

  console.debug(`[LLM] model=${model}, prompt length=${prompt.length}`);
  return { content: '', usage: { promptTokens: 0, completionTokens: 0 } };
}

/**
 * 安全调用 LLM 并解析 JSON 响应
 * 后续接入真实 API 后，Agent 可使用此函数获取结构化输出
 */
export async function callLLMForJSON<T = unknown>(options: LLMCallOptions): Promise<T | null> {
  const response = await callLLM(options);
  if (!response.content) return null;

  try {
    // 尝试从响应中提取 JSON
    const jsonMatch = response.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T;
    }
    return JSON.parse(response.content) as T;
  } catch {
    console.error('[LLM] JSON 解析失败');
    return null;
  }
}

/** 模拟网络延迟 */
async function simulateLatency(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
