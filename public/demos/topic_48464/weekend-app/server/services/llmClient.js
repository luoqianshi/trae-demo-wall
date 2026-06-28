/**
 * 大模型调用模块 (WI-0.6)
 * 支持配置 OpenAI 兼容 API；超时控制+重试；JSON 解析与修复。
 * 未配置 apiKey 时返回 null，由编排层降级到规则生成器。
 */
const config = require('../config');

/**
 * 从大模型响应文本中提取 JSON 数组
 * 兼容：裸数组 / 包裹对象 / markdown 代码块 / 单个方案对象
 * 使用括号平衡匹配避免贪婪正则误匹配。
 */
function extractJson(text) {
  if (!text) return null;
  // 去除可能的 markdown 代码块标记
  let cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 尝试直接解析
  try {
    const parsed = JSON.parse(cleaned);
    return normalizeToArray(parsed);
  } catch (e) { /* 继续尝试 */ }

  // 括号平衡提取 JSON 数组（找到第一个 [ 然后匹配到对应 ]）
  const arrayResult = extractBalanced(cleaned, '[', ']');
  if (arrayResult) {
    try { return normalizeToArray(JSON.parse(arrayResult)); } catch (e) { /* 继续 */ }
  }

  // 括号平衡提取 JSON 对象（找到第一个 { 然后匹配到对应 }）
  const objResult = extractBalanced(cleaned, '{', '}');
  if (objResult) {
    try {
      const obj = JSON.parse(objResult);
      return normalizeToArray(obj);
    } catch (e) { /* 失败 */ }
  }

  // 兜底：非贪婪正则提取
  const lazyArray = cleaned.match(/\[[\s\S]*?\]/);
  if (lazyArray) {
    try { return normalizeToArray(JSON.parse(lazyArray[0])); } catch (e) { /* 继续 */ }
  }
  const lazyObj = cleaned.match(/\{[\s\S]*?\}/);
  if (lazyObj) {
    try { return normalizeToArray(JSON.parse(lazyObj[0])); } catch (e) { /* 失败 */ }
  }

  return null;
}

/**
 * 括号平衡匹配：从 open 字符开始，找到对应的 close 字符
 * 处理嵌套和字符串中的括号
 */
function extractBalanced(text, open, close) {
  const start = text.indexOf(open);
  if (start === -1) return null;
  let depth = 0;
  let inString = false;
  let escape = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (escape) { escape = false; continue; }
    if (ch === '\\') { escape = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === open) depth++;
    else if (ch === close) {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  return null;
}

/**
 * 将解析结果统一转为数组
 * 处理 {"plans": [...]} / {"data": [...]} / 单个方案对象等情况
 */
function normalizeToArray(obj) {
  if (Array.isArray(obj)) return obj;
  if (obj && typeof obj === 'object') {
    for (const key of ['plans', 'data', 'results', 'list']) {
      if (Array.isArray(obj[key])) return obj[key];
    }
    if (obj.plan_name) return [obj];
  }
  return null;
}

/**
 * 调用大模型生成方案
 * @returns {Promise<Array|null>} 方案数组，失败返回 null
 */
async function generate(prefs, { systemPrompt, userPrompt }) {
  if (!config.llm.apiKey) {
    return null;
  }

  const callOnce = async () => {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), config.llm.timeoutMs);
    try {
      // 确保 apiBase 不以 / 结尾，避免双斜杠
      const baseUrl = config.llm.apiBase.replace(/\/+$/, '');
      const res = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.llm.apiKey}`
        },
        body: JSON.stringify({
          model: config.llm.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt }
          ],
          temperature: 0.7,
          max_tokens: 1500
        }),
        signal: controller.signal
      });
      if (!res.ok) {
        const errBody = await res.text().catch(() => '');
        const code = res.status;
        // 401 Key无效、429限流 不重试，直接抛出带标记的错误
        if (code === 401) {
          const err = new Error(`LLM_AUTH_ERROR: API Key 无效`);
          err.noRetry = true;
          throw err;
        }
        if (code === 429) {
          const err = new Error(`LLM_RATE_LIMITED: 请求频率超限`);
          err.noRetry = true;
          throw err;
        }
        throw new Error(`LLM_API_ERROR ${code}: ${errBody.slice(0, 200)}`);
      }
      const data = await res.json();
      const content = data.choices?.[0]?.message?.content || '';
      if (!content) {
        console.warn('[LLM] 模型返回空内容');
        return null;
      }
      const parsed = extractJson(content);
      if (!parsed) {
        console.warn('[LLM] JSON 解析失败，返回内容前200字:', content.slice(0, 200));
      }
      return parsed;
    } finally {
      clearTimeout(timer);
    }
  };

  // 重试逻辑（使用 AbortController 控制超时，不再需要外层 withTimeout 双重超时）
  for (let attempt = 0; attempt <= config.llm.maxRetries; attempt++) {
    try {
      const result = await callOnce();
      if (result && result.length > 0) return result;
      if (result === null && attempt < config.llm.maxRetries) {
        // JSON解析失败，等一小会重试
        await new Promise(r => setTimeout(r, 200 * (attempt + 1)));
      }
    } catch (err) {
      console.warn(`[LLM] 第 ${attempt + 1} 次调用失败: ${err.message}`);
      if (err.noRetry || attempt >= config.llm.maxRetries) return null;
      // 指数退避
      await new Promise(r => setTimeout(r, 500 * Math.pow(2, attempt)));
    }
  }
  return null;
}

module.exports = { generate, extractJson };
