/* ===== parser.js · JSON 解析与降级 ===== */
window.Parser = (function () {

  // 支持的 graphType
  const SUPPORTED_TYPES = ['quadratic', 'forceDiagram', 'geneticDiagram', 'essayStructure', 'ecosystemDiagram', 'none'];

  // 尝试解析 JSON，失败则正则提取 {...} 子串重试
  function tryParseJSON(raw) {
    if (!raw) return null;
    // 直接尝试
    try {
      return JSON.parse(raw);
    } catch (e) { /* 继续尝试 */ }

    // 去除可能的 markdown 代码块标记
    let cleaned = raw.replace(/^```json\s*/i, '').replace(/^```\s*/, '').replace(/```\s*$/, '');
    try {
      return JSON.parse(cleaned);
    } catch (e) { /* 继续尝试 */ }

    // 正则提取第一个 {...} 子串
    const match = cleaned.match(/\{[\s\S]*\}/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch (e) { /* 失败 */ }
    }
    return null;
  }

  // 校验 graph 对象，不合法则降级为 none
  function validateGraph(graph) {
    if (!graph || typeof graph !== 'object') {
      return { graphType: 'none', graphParams: {} };
    }
    const type = graph.graphType;
    if (!type || SUPPORTED_TYPES.indexOf(type) === -1) {
      return { graphType: 'none', graphParams: {} };
    }
    const params = graph.graphParams || {};
    // 按类型校验关键字段
    if (!validateParams(type, params)) {
      return { graphType: 'none', graphParams: {} };
    }
    return { graphType: type, graphParams: params };
  }

  // 按 graphType 校验 params 关键字段
  function validateParams(type, p) {
    if (!p || typeof p !== 'object') return false;
    switch (type) {
      case 'quadratic':
        // 至少要有 vertex 或 a
        return !!(p.vertex && typeof p.vertex.x === 'number') || typeof p.a === 'number';
      case 'forceDiagram':
        return Array.isArray(p.forces) && typeof p.inclination === 'number';
      case 'geneticDiagram':
        return Array.isArray(p.generations) && p.generations.length >= 2;
      case 'essayStructure':
        return typeof p.theme === 'string' && Array.isArray(p.sections);
      case 'ecosystemDiagram':
        return Array.isArray(p.species) && p.species.length >= 2
          && Array.isArray(p.relationships) && p.relationships.length >= 1;
      case 'none':
        return true;
      default:
        return false;
    }
  }

  // 流式累积：把新 chunk 追加到 buffer，尝试解析出完整 JSON
  // 返回 { buffer, parsed }，parsed 为 null 表示尚未完整
  function accumulateChunk(buffer, chunk) {
    const newBuffer = (buffer || '') + (chunk || '');
    // 流式过程中 JSON 往往不完整，只在闭合 } 出现时尝试
    const parsed = tryParseJSON(newBuffer);
    return { buffer: newBuffer, parsed };
  }

  // 从解析结果中提取讲解文本（用于流式展示）
  // 思路：从原始 buffer 中尝试提取 explanation 字段的字符串值
  function tryExtractExplanation(raw) {
    if (!raw) return '';
    // 尝试匹配 "explanation": "..."
    // 注意：值中可能含 \n 转义与转义引号
    const m = raw.match(/"explanation"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) {
      // 反转义 JSON 字符串
      try {
        return JSON.parse('"' + m[1] + '"');
      } catch (e) {
        return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"').replace(/\\\\/g, '\\');
      }
    }
    return '';
  }

  function tryExtractSubject(raw) {
    if (!raw) return '';
    const m = raw.match(/"subject"\s*:\s*"([^"]*)"/);
    return m ? m[1] : '';
  }

  function tryExtractQuestion(raw) {
    if (!raw) return '';
    const m = raw.match(/"question"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) {
      try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return m[1]; }
    }
    return '';
  }

  function tryExtractSummary(raw) {
    if (!raw) return '';
    const m = raw.match(/"summary"\s*:\s*"((?:[^"\\]|\\.)*)"/);
    if (m) {
      try { return JSON.parse('"' + m[1] + '"'); } catch (e) { return m[1]; }
    }
    return '';
  }

  return {
    tryParseJSON, validateGraph, validateParams,
    accumulateChunk,
    tryExtractExplanation, tryExtractSubject, tryExtractQuestion, tryExtractSummary,
    SUPPORTED_TYPES,
  };
})();
