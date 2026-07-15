/**
 * AI 逻辑工程师 — 文本解析与模板匹配系统
 * 主入口模块
 */
const { analyzeWithRules } = require('./analyzer');
const { matchAllTemplates } = require('./matcher');
const { callLLM, isProviderAvailable } = require('./llm/llm-client');
const { dedupeResults } = require('./utils/dedupe');

/**
 * 核心函数：分析文本，返回识别结果和渲染 payload
 *
 * @param {string} rawText - 新闻口播稿全文
 * @param {object} [options={}]
 * @param {string} [options.provider="local"] - "local" | "kimi"
 * @param {string} [options.apiKey] - LLM API Key
 * @param {string} [options.mode="rules-first"] - "rules-only" | "rules-first" | "llm-first"
 * @param {number} [options.maxResults=12] - 最大结果数量
 * @returns {Promise<object>} { status, provider, mode, results, renderPayloads, error }
 */
async function analyzeText(rawText, options = {}) {
  const {
    provider = 'local',
    apiKey,
    mode = 'rules-first',
    maxResults = 12,
  } = options;

  const result = {
    status: 'ok',
    provider,
    mode,
    results: [],
    renderPayloads: [],
    error: null,
  };

  try {
    if (!rawText || rawText.trim().length === 0) {
      return result;
    }

    let analysisResults = [];

    switch (mode) {
      case 'rules-only':
        analysisResults = analyzeWithRules(rawText, { maxResults });
        result.provider = 'local';
        break;

      case 'rules-first':
        analysisResults = analyzeWithRules(rawText, { maxResults });
        if (provider !== 'local' && isProviderAvailable(provider, apiKey)) {
          try {
            const llmResults = await callLLM(rawText, provider, apiKey);
            analysisResults = mergeResults(analysisResults, llmResults, maxResults);
            result.provider = provider;
          } catch (llmErr) {
            console.warn(`[LLM Fallback] ${provider} 调用失败，使用本地规则:`, llmErr.message);
            result.provider = 'local';
            result.error = `KIMI 调用失败，已降级到本地规则: ${llmErr.message}`;
          }
        }
        break;

      case 'llm-first':
        if (provider !== 'local' && isProviderAvailable(provider, apiKey)) {
          try {
            analysisResults = await callLLM(rawText, provider, apiKey);
            result.provider = provider;
          } catch (llmErr) {
            console.warn(`[LLM Fallback] ${provider} 调用失败，降级到本地规则:`, llmErr.message);
            analysisResults = analyzeWithRules(rawText, { maxResults });
            result.provider = 'local';
            result.error = `KIMI 调用失败，已降级到本地规则: ${llmErr.message}`;
          }
        } else {
          analysisResults = analyzeWithRules(rawText, { maxResults });
          result.provider = 'local';
        }
        break;

      default:
        analysisResults = analyzeWithRules(rawText, { maxResults });
        break;
    }

    result.results = analysisResults;
    result.renderPayloads = matchAllTemplates(analysisResults);
  } catch (err) {
    result.status = 'error';
    result.error = err.message;
    // 兜底降级到本地规则
    try {
      result.results = analyzeWithRules(rawText, { maxResults });
      result.renderPayloads = matchAllTemplates(result.results);
      result.provider = 'local';
      result.status = 'ok';
      result.error = `LLM 调用失败，已降级到本地规则: ${err.message}`;
    } catch (fallbackErr) {
      result.status = 'error';
      result.error = fallbackErr.message;
    }
  }

  return result;
}

function mergeResults(ruleResults, llmResults, maxResults) {
  const combined = [...ruleResults, ...llmResults];
  const deduped = dedupeResults(combined);
  deduped.sort((a, b) => {
    if (b.confidence !== a.confidence) return b.confidence - a.confidence;
    return (a.startIndex || 0) - (b.startIndex || 0);
  });
  return deduped.slice(0, maxResults);
}

module.exports = { analyzeText, analyzeWithRules, matchAllTemplates };
