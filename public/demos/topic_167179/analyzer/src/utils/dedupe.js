/**
 * 去重工具：避免同一文本片段被多个规则重复识别
 */

/**
 * 对识别结果去重
 * 规则：
 * 1. 不同 type 不过滤（不同类型服务于不同包装目的）
 * 2. 同 type 且 startIndex/endIndex 完全一致 → 保留置信度高的
 * 3. 同 type 且重叠 > 80% → 视为重复
 * @param {Array} results - 识别结果数组
 * @returns {Array} 去重后的结果
 */
function dedupeResults(results) {
  if (!results || results.length <= 1) return results || [];

  const seen = [];

  return results.filter((item) => {
    // 检查是否与已有结果重叠（仅检查同类型）
    const isDuplicate = seen.some((existing) => {
      // 不同类型不视为重复
      if (existing.type !== item.type) return false;

      // 完全相同的索引范围
      if (existing.startIndex === item.startIndex && existing.endIndex === item.endIndex) {
        // 保留置信度更高的
        if (item.confidence > existing.confidence) {
          seen.splice(seen.indexOf(existing), 1, item);
        }
        return true;
      }

      // 计算重叠度
      const overlapStart = Math.max(existing.startIndex, item.startIndex);
      const overlapEnd = Math.min(existing.endIndex, item.endIndex);
      if (overlapStart >= overlapEnd) return false; // 无重叠

      const overlapLen = overlapEnd - overlapStart;
      const itemLen = item.endIndex - item.startIndex;
      const existingLen = existing.endIndex - existing.startIndex;
      const minLen = Math.min(itemLen, existingLen);

      // 如果重叠超过 80% 的较短片段长度，视为重复
      if (overlapLen / minLen > 0.8) {
        // 保留置信度更高的
        if (item.confidence > existing.confidence) {
          seen.splice(seen.indexOf(existing), 1, item);
        }
        return true;
      }

      return false;
    });

    if (!isDuplicate) {
      seen.push(item);
    }
    return !isDuplicate;
  });
}

module.exports = { dedupeResults };