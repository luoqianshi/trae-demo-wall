/**
 * 引号规则 — 识别「引号内容」
 * 匹配：中文引号 ""、''、『』、「」、"" 等
 */
const { generateUUID } = require('../utils/uuid');
const { calculateConfidence } = require('../utils/confidence');

const TYPE = 'quote_highlight';
const SUGGESTED_TEMPLATE = 'quote_highlight_v1';

// 匹配各种中文引号包裹的内容
// “...”  『...』  「...」  "..."  '...'
const QUOTE_PATTERNS = [
  /\u201c([^\u201d]+)\u201d/g,        // "..."
  /\u300e([^\u300f]+)\u300f/g,        // 『...』
  /\u300c([^\u300d]+)\u300d/g,        // 「...」
  /"([^"]+)"/g,                        // "..."
  /'([^']+)'/g,                        // '...'
];

/**
 * 提取引号内容
 * @param {string} text - 原文
 * @returns {Array} 识别结果数组
 */
function match(text) {
  const results = [];

  for (const pattern of QUOTE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const fullMatch = m[0];
      const innerText = m[1];

      // 过滤过短的引号内容（少于4个字符，可能是标点用法）
      if (innerText.length < 4) continue;

      results.push({
        id: generateUUID(),
        text: fullMatch,
        type: TYPE,
        confidence: calculateConfidence(TYPE, {
          matchLength: fullMatch.length,
          isExactMatch: true,
        }),
        startIndex: m.index,
        endIndex: m.index + fullMatch.length,
        suggestedTemplate: SUGGESTED_TEMPLATE,
        extractedData: {
          quoteText: innerText,
          quoteType: fullMatch[0],
        },
      });
    }
  }

  return results;
}

module.exports = { match, TYPE, SUGGESTED_TEMPLATE };