/**
 * 置信度计算工具
 */

/**
 * 基于规则匹配的置信度评分
 * 置信度范围：0.0 - 1.0
 */

// 各规则类型的基础置信度
const BASE_CONFIDENCE = {
  data_card: 0.90,
  quote_highlight: 0.88,
  timeline_node: 0.85,
  conclusion_box: 0.80,
  title_card: 0.75,
};

/**
 * 计算规则匹配的置信度
 * @param {string} type - 识别类型
 * @param {object} options
 * @param {number} [options.matchLength] - 匹配文本长度
 * @param {boolean} [options.isExactMatch] - 是否精确匹配
 * @returns {number}
 */
function calculateConfidence(type, options = {}) {
  const base = BASE_CONFIDENCE[type] || 0.7;
  let score = base;

  // 匹配文本越长，略微降低置信度（长文本可能包含噪音）
  if (options.matchLength && options.matchLength > 100) {
    score -= 0.05;
  }

  // 精确匹配加分
  if (options.isExactMatch) {
    score += 0.03;
  }

  // 限制在 0.0 - 1.0
  return Math.max(0, Math.min(1, Math.round(score * 100) / 100));
}

module.exports = { calculateConfidence, BASE_CONFIDENCE };