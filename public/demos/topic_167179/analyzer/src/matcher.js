/**
 * 模板匹配器
 * 将识别结果映射到模板，生成 render payload
 */
const { generateUUID } = require('./utils/uuid');
const { getPresetKey } = require('./preset-library');

// 类型 → 默认模板 ID 映射（当 suggestedTemplate 缺失时使用）
const DEFAULT_TEMPLATE_MAP = {
  data_card: 'data_card_v1',
  quote_highlight: 'quote_highlight_v1',
  timeline_node: 'timeline_node_v1',
  conclusion_box: 'title_card_v4',
  title_card: 'title_card_v1',
};

// 默认渲染设置
const DEFAULT_RENDER_SETTINGS = {
  resolution: [1080, 1700],
  fps: 25,
  duration: 3,
  format: 'mov-prores4444',
};

/**
 * 匹配模板 ID
 * @param {object} result - 识别结果
 * @returns {string} 模板 ID
 */
function getTemplateId(result) {
  if (result.suggestedTemplate) return result.suggestedTemplate;
  return DEFAULT_TEMPLATE_MAP[result.type] || 'title_card_v1';
}

/**
 * 生成短显示文案
 */
function buildDisplayText(type, extractedData, rawText) {
  if (extractedData.displayText) return extractedData.displayText;

  const text = rawText || '';

  if (type === 'data_card') {
    const num = extractedData.number || '';
    const unit = extractedData.unit || '';
    return `${num}${unit}`.trim() || text;
  }

  if (type === 'quote_highlight') {
    const quote = extractedData.quoteText || text;
    return shortenText(quote.replace(/[“”""''『』「」]/g, '').trim(), 18);
  }

  if (type === 'timeline_node') {
    return extractedData.timeText || text;
  }

  if (type === 'title_card' || type === 'conclusion_box') {
    const title = extractedData.titleText || extractedData.conclusionText || text;
    return shortenTitle(title);
  }

  return text;
}

function shortenTitle(title) {
  if (!title) return '';
  // 去掉首尾标点和空白
  let t = title.trim().replace(/^[，,。．！？；：\s]+|[，,。．！？；：\s]+$/g, '');
  // 优先取逗号/顿号前的主语短句
  const firstPart = t.split(/[，,、]/)[0].trim();
  if (firstPart.length >= 4 && firstPart.length <= 18) return firstPart;
  // 否则截断到 18 字
  return t.length > 18 ? t.slice(0, 18) + '…' : t;
}

function shortenText(text, maxLen) {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + '…';
}

function inferChapterNumber(text) {
  const m = (text || '').match(/第\s*([一二三四五12345])\s*[章节条]/);
  if (!m) return '1';
  const map = { 一: '1', 二: '2', 三: '3', 四: '4', 五: '5' };
  return map[m[1]] || m[1];
}

/**
 * 构建渲染参数
 * @param {object} result - 识别结果
 * @returns {object} 渲染参数
 */
function buildRenderParams(result) {
  const { type, text, extractedData = {} } = result;
  const params = {
    displayText: buildDisplayText(type, extractedData, text),
    preset: getPresetKey(type, result.suggestedTemplate),
    theme: 'amber',
  };

  switch (type) {
    case 'data_card':
      params.mainText = extractedData.mainText || text;
      params.subText = extractedData.subText || '';
      params.number = extractedData.number || '';
      params.unit = extractedData.unit || '';
      params.source = extractedData.source || '';
      break;
    case 'quote_highlight':
      params.mainText = extractedData.quoteText || text;
      params.subText = extractedData.subText || '';
      params.source = extractedData.source || '';
      params.quoteText = extractedData.quoteText || text;
      break;
    case 'timeline_node':
      params.mainText = extractedData.timeText || text;
      params.subText = '';
      params.timeText = extractedData.timeText || text;
      params.items = extractedData.items || [
        { time: extractedData.timeText || text, text: params.displayText }
      ];
      break;
    case 'conclusion_box':
      params.mainText = extractedData.conclusionText || text;
      params.subText = '';
      break;
    case 'title_card':
      params.mainText = extractedData.titleText || text;
      params.subText = extractedData.subText || '';
      params.source = extractedData.source || '';
      if (params.preset === 'chapter') {
        params.chapterNumber = extractedData.chapterNumber || inferChapterNumber(text);
      }
      break;
    default:
      params.mainText = text;
      params.subText = '';
  }

  return params;
}

/**
 * 为单个识别结果生成渲染 payload
 * @param {object} result - 识别结果
 * @param {object} [overrides] - 覆盖设置
 * @returns {object} 渲染 payload
 */
function matchTemplate(result, overrides = {}) {
  const templateId = getTemplateId(result);
  const params = buildRenderParams(result);
  const settings = { ...DEFAULT_RENDER_SETTINGS, ...overrides };

  return {
    templateId,
    params,
    settings,
  };
}

/**
 * 为所有识别结果批量生成渲染 payload
 * @param {Array} results - 识别结果数组
 * @returns {Array} 渲染 payload 数组
 */
function matchAllTemplates(results) {
  if (!results || results.length === 0) return [];
  return results.map((r) => matchTemplate(r));
}

module.exports = {
  getTemplateId,
  matchTemplate,
  matchAllTemplates,
  buildRenderParams,
  DEFAULT_TEMPLATE_MAP,
  DEFAULT_RENDER_SETTINGS,
};
