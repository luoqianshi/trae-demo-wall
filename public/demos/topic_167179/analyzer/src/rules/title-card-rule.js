/**
 * 标题卡规则 — 识别「段落首句 / 尾句」
 * 适合作为章节标题或段落总结
 */
const { generateUUID } = require('../utils/uuid');
const { findOffset } = require('../utils/text-offset');
const { calculateConfidence } = require('../utils/confidence');

const TYPE = 'title_card';
const SUGGESTED_TEMPLATE = 'title_card_v1';

// 段落分隔符
const PARAGRAPH_SEPARATOR = /(?:\n\n|\n(?=\S)|(?<=[。！？])\n)/;

/**
 * 提取段落首句和尾句
 * @param {string} text - 原文
 * @returns {Array} 识别结果数组
 */
function match(text) {
  const results = [];

  // 分割段落
  const paragraphs = text.split(PARAGRAPH_SEPARATOR).filter((p) => p.trim().length > 0);

  for (const para of paragraphs) {
    const trimmed = para.trim();
    if (trimmed.length < 10) continue;

    // 段落首句：取第一个句号/问号/感叹号之前的内容
    const firstSentenceMatch = trimmed.match(/^([^。！？\n]+)[。！？]?/);
    if (firstSentenceMatch) {
      const firstSentence = firstSentenceMatch[1].trim();
      if (firstSentence.length >= 6 && firstSentence.length <= 60) {
        const offset = findOffset(text, firstSentence);
        if (offset) {
          results.push({
            id: generateUUID(),
            text: firstSentence,
            type: TYPE,
            confidence: calculateConfidence(TYPE, {
              matchLength: firstSentence.length,
              isExactMatch: true,
            }),
            startIndex: offset.startIndex,
            endIndex: offset.endIndex,
            suggestedTemplate: SUGGESTED_TEMPLATE,
            extractedData: {
              titleText: firstSentence,
              position: 'first',
            },
          });
        }
      }
    }

    // 段落尾句：取最后一个句号之前的内容
    const lastSentenceMatch = trimmed.match(/([^。！？\n]+)[。！？]\s*$/);
    if (lastSentenceMatch) {
      const lastSentence = lastSentenceMatch[1].trim();
      if (lastSentence.length >= 6 && lastSentence.length <= 60) {
        const offset = findOffset(text, lastSentence);
        if (offset) {
          results.push({
            id: generateUUID(),
            text: lastSentence,
            type: TYPE,
            confidence: calculateConfidence(TYPE, {
              matchLength: lastSentence.length,
              isExactMatch: true,
            }) - 0.05, // 尾句置信度略低于首句
            startIndex: offset.startIndex,
            endIndex: offset.endIndex,
            suggestedTemplate: SUGGESTED_TEMPLATE,
            extractedData: {
              titleText: lastSentence,
              position: 'last',
            },
          });
        }
      }
    }
  }

  return results;
}

module.exports = { match, TYPE, SUGGESTED_TEMPLATE };