/**
 * 在原文中查找文本片段的精确 startIndex / endIndex
 */

/**
 * 在原文中查找子串位置，返回 { startIndex, endIndex } 或 null
 * @param {string} fullText - 原文
 * @param {string} substring - 要查找的文本片段
 * @param {number} [hintStart] - 提示起始位置，优先从此位置附近查找
 * @returns {{ startIndex: number, endIndex: number } | null}
 */
function findOffset(fullText, substring, hintStart = null) {
  if (!fullText || !substring) return null;

  let idx = -1;

  // 如果提供了 hint，优先在 hint 附近查找
  if (hintStart !== null && hintStart >= 0 && hintStart < fullText.length) {
    // 从 hint 位置前后各 50 字符范围内查找
    const searchStart = Math.max(0, hintStart - 50);
    const searchEnd = Math.min(fullText.length, hintStart + substring.length + 50);
    const searchRegion = fullText.slice(searchStart, searchEnd);
    const localIdx = searchRegion.indexOf(substring);
    if (localIdx !== -1) {
      idx = searchStart + localIdx;
    }
  }

  // 精确匹配
  if (idx === -1) {
    idx = fullText.indexOf(substring);
  }

  // 如果精确匹配失败，尝试去除首尾空白后匹配
  if (idx === -1) {
    const trimmed = substring.trim();
    if (trimmed !== substring) {
      idx = fullText.indexOf(trimmed);
    }
  }

  if (idx === -1) return null;

  return {
    startIndex: idx,
    endIndex: idx + substring.length,
  };
}

/**
 * 修正 startIndex / endIndex，用文本内容在原文中重新定位
 * @param {string} fullText - 原文
 * @param {string} text - 待修正的文本片段
 * @param {number} oldStart - 旧的 startIndex
 * @param {number} oldEnd - 旧的 endIndex
 * @returns {{ startIndex: number, endIndex: number }}
 */
function correctOffset(fullText, text, oldStart, oldEnd) {
  const corrected = findOffset(fullText, text, oldStart);
  if (corrected) {
    return corrected;
  }
  // 无法修正，返回原值
  return { startIndex: oldStart, endIndex: oldEnd };
}

module.exports = { findOffset, correctOffset };