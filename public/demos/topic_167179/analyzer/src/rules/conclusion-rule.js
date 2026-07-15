/**
 * 结论规则 — 识别「结论关键词」
 * 匹配：综上所述、核心观点、值得注意的是、总结来说、关键在于、这意味着 等
 *
 * 注：Agent B 目前没有独立的 conclusion_box 模板，
 * 此处映射到 title_card_v1 或 quote_highlight_v1（根据上下文判断）。
 */
const { generateUUID } = require('../utils/uuid');
const { calculateConfidence } = require('../utils/confidence');

const TYPE = 'conclusion_box';
const SUGGESTED_TEMPLATE = 'title_card_v1'; // 默认映射到 title_card

// 结论关键词列表
const CONCLUSION_KEYWORDS = [
  '综上所述',
  '核心观点',
  '值得注意的是',
  '总结来说',
  '关键在于',
  '这意味着',
  '归根结底',
  '总的来看',
  '总体而言',
  '概括而言',
  '简而言之',
  '一言以蔽之',
  '从以上分析可以看出',
  '由此可见',
  '因此',
  '结论是',
  '最后',
  '总结一下',
];

// 构建正则：匹配包含结论关键词的句子
// 取关键词前后各最多 50 个字符作为结论片段
function buildPattern() {
  const escaped = CONCLUSION_KEYWORDS.map((kw) => kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
  return new RegExp(`(${escaped.join('|')})`, 'g');
}

/**
 * 提取结论关键词所在的句子片段
 * @param {string} text - 原文
 * @returns {Array} 识别结果数组
 */
function match(text) {
  const results = [];
  const pattern = buildPattern();
  const matches = text.matchAll(pattern);

  for (const m of matches) {
    const keyword = m[0];
    const kwIndex = m.index;

    // 提取关键词所在句子（前后扩展到最近句号或换行）
    const contextStart = Math.max(0, kwIndex - 50);
    const contextEnd = Math.min(text.length, kwIndex + keyword.length + 50);

    // 向后找到最近的句号或换行
    let sentenceStart = contextStart;
    let sentenceEnd = contextEnd;

    for (let i = kwIndex - 1; i >= contextStart; i--) {
      if (/[。！？\n]/.test(text[i])) {
        sentenceStart = i + 1;
        break;
      }
    }

    for (let i = kwIndex + keyword.length; i < contextEnd; i++) {
      if (/[。！？\n]/.test(text[i])) {
        sentenceEnd = i + 1;
        break;
      }
    }

    const snippet = text.slice(sentenceStart, sentenceEnd).trim();
    if (snippet.length < 5) continue;

    // 根据内容判断匹配类型：长句子适合 title_card，短引语适合 quote_highlight
    const template = snippet.length > 30 ? 'title_card_v1' : 'quote_highlight_v1';

    results.push({
      id: generateUUID(),
      text: snippet,
      type: TYPE,
      confidence: calculateConfidence(TYPE, {
        matchLength: snippet.length,
        isExactMatch: true,
      }),
      startIndex: sentenceStart,
      endIndex: sentenceEnd,
      suggestedTemplate: template,
      extractedData: {
        keyword,
        conclusionText: snippet,
      },
    });
  }

  return results;
}

module.exports = { match, TYPE, SUGGESTED_TEMPLATE, CONCLUSION_KEYWORDS };