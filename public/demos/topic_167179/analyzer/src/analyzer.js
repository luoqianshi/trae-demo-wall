/**
 * 本地规则引擎 — 核心分析器
 * 组合所有规则，执行去重、排序、限制数量
 */
const dataCardRule = require('./rules/data-card-rule');
const quoteRule = require('./rules/quote-rule');
const timelineRule = require('./rules/timeline-rule');
const conclusionRule = require('./rules/conclusion-rule');
const titleCardRule = require('./rules/title-card-rule');
const { dedupeResults } = require('./utils/dedupe');

// 规则执行顺序（优先级从高到低）
const RULES = [dataCardRule, quoteRule, timelineRule, conclusionRule, titleCardRule];

/**
 * 使用本地规则引擎分析文本
 * @param {string} rawText - 原文
 * @param {object} options
 * @param {number} [options.maxResults] - 最大结果数量，默认 12
 * @returns {Array} 识别结果数组
 */
function analyzeWithRules(rawText, options = {}) {
  const maxResults = options.maxResults || 12;

  if (!rawText || rawText.trim().length === 0) {
    return [];
  }

  let allResults = [];

  // 依次执行每一条规则
  for (const rule of RULES) {
    try {
      const ruleResults = rule.match(rawText);
      allResults = allResults.concat(ruleResults);
    } catch (err) {
      // 单条规则失败不影响其他规则
      console.error(`[Rule Error] ${rule.TYPE || 'unknown'}:`, err.message);
    }
  }

  // 去重
  allResults = dedupeResults(allResults);

  // 排序：置信度高的在前，置信度相同时原文位置靠前的在前
  allResults.sort((a, b) => {
    if (b.confidence !== a.confidence) {
      return b.confidence - a.confidence;
    }
    return a.startIndex - b.startIndex;
  });

  // 限制数量
  return allResults.slice(0, maxResults);
}

module.exports = { analyzeWithRules, RULES };