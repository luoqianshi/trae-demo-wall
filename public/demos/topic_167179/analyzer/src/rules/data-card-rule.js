/**
 * 数据卡片规则 — 识别「数字 + 单位」
 * 匹配：30%、12万、3.5亿、5000人、20次、9亿元 等
 */
const { generateUUID } = require('../utils/uuid');
const { calculateConfidence } = require('../utils/confidence');

const TYPE = 'data_card';
const SUGGESTED_TEMPLATE = 'data_card_v1';

// 数字 + 单位的正则
// 支持：数字（含小数点、逗号）+ 单位（%、万、亿、人、次、元、个、项、倍 等）
// 注意：年、月、日 已排除，由 timeline 规则处理
const DATA_CARD_PATTERN = /(\d[\d,.]*\.?\d*)\s*([%％万亿人次数元个项倍名家家户户点多层级别步轮场处批张份只台座辆艘枚颗组套版期届次回度前后左右])/g;

/**
 * 提取数字+单位匹配
 * @param {string} text - 原文
 * @returns {Array} 识别结果数组
 */
function match(text) {
  const results = [];
  const matches = text.matchAll(DATA_CARD_PATTERN);

  for (const match of matches) {
    const fullMatch = match[0];
    const numberPart = match[1];
    const unitPart = match[2];

    results.push({
      id: generateUUID(),
      text: fullMatch,
      type: TYPE,
      confidence: calculateConfidence(TYPE, {
        matchLength: fullMatch.length,
        isExactMatch: true,
      }),
      startIndex: match.index,
      endIndex: match.index + fullMatch.length,
      suggestedTemplate: SUGGESTED_TEMPLATE,
      extractedData: {
        mainText: fullMatch,
        number: numberPart,
        unit: unitPart,
        subText: '',
        source: '',
      },
    });
  }

  return results;
}

module.exports = { match, TYPE, SUGGESTED_TEMPLATE, DATA_CARD_PATTERN };