/**
 * 时间轴规则 — 识别「时间表述」
 * 匹配：2024年、7月7日、昨日、今天、近期、上周、明年 等
 */
const { generateUUID } = require('../utils/uuid');
const { calculateConfidence } = require('../utils/confidence');

const TYPE = 'timeline_node';
const SUGGESTED_TEMPLATE = 'timeline_node_v1';

// 时间表述模式
const TIMELINE_PATTERNS = [
  // 明确日期：2024年、2024年3月、3月15日、2024-03-15
  /\d{4}年(?:\d{1,2}月)?(?:\d{1,2}日)?/g,
  /\d{1,2}月\d{1,2}日/g,
  /\d{4}-\d{2}-\d{2}/g,
  // 相对时间：昨日、今天、今日、明天、近期、上周、本周、下周、本月、下月、今年、去年、明年
  /(?:昨日|今天|今日|明天|近期|上周|本周|下周|本月|下月|今年|去年|明年|前年|后年|上半年|下半年|第一季度|第二季度|第三季度|第四季度|一季度|二季度|三季度|四季度)/g,
  // 时间段：过去X年、未来X年、连续X个季度
  /(?:过去|未来|近|连续)\s*\d+\s*(?:年|个?月|个?季度|周|天)/g,
];

/**
 * 提取时间表述
 * @param {string} text - 原文
 * @returns {Array} 识别结果数组
 */
function match(text) {
  const results = [];

  for (const pattern of TIMELINE_PATTERNS) {
    const matches = text.matchAll(pattern);
    for (const m of matches) {
      const fullMatch = m[0];
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
          timeText: fullMatch,
        },
      });
    }
  }

  return results;
}

module.exports = { match, TYPE, SUGGESTED_TEMPLATE };