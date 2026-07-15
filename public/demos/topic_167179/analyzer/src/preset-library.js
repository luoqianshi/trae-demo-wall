/**
 * 包装预设库（后端）
 * 与 presets/preset-library.json 保持一致
 */
const fs = require('fs');
const path = require('path');

const PRESET_JSON_PATH = path.join(__dirname, '..', '..', 'presets', 'preset-library.json');

let cachedLibrary = null;

function loadLibrary() {
  if (cachedLibrary) return cachedLibrary;
  const json = JSON.parse(fs.readFileSync(PRESET_JSON_PATH, 'utf8'));
  cachedLibrary = json;
  return json;
}

function getPresetsByType(type) {
  const lib = loadLibrary();
  return (lib.categories[type] && lib.categories[type].presets) || [];
}

function getPreset(type, presetId) {
  return getPresetsByType(type).find((p) => p.id === presetId);
}

function getPresetKey(type, presetId) {
  // 金标准模板的 presetKey 映射
  const goldStandardKeys = {
    'single-stat': 'gold_single_stat',
    'data-compare': 'gold_data_compare',
    'trend-ratio': 'gold_trend_ratio',
    'quote-callout': 'gold_quote_callout',
    'data-to-conclusion': 'gold_data_to_conclusion',
  };
  if (goldStandardKeys[presetId]) return goldStandardKeys[presetId];

  const preset = getPreset(type, presetId);
  return preset ? preset.presetKey : 'classic';
}

function getCategoryLabel(type) {
  const lib = loadLibrary();
  return (lib.categories[type] && lib.categories[type].label) || type;
}

function getDefaultPresetId(type) {
  const presets = getPresetsByType(type);
  return presets.length > 0 ? presets[0].id : `${type}_v1`;
}

/**
 * 根据规则类型和文本内容推荐预设
 * 金标准模板优先，基础预设回退
 */
function suggestPreset(type, extractedData = {}, rawText = '') {
  const text = rawText || '';
  const data = extractedData || {};

  if (type === 'data_card') {
    // 金标准模板推荐
    if (data.textLeft || data.textRight || /对比|同比|环比/.test(text)) return 'data-compare';
    if (data.trendDirection || /增长|上升|下降|下跌|趋势|比例|占比|完成率/.test(text)) return 'trend-ratio';
    if (data.textResult || /结论|因此|推出|得出|意味着/.test(text)) return 'data-to-conclusion';
    // 单一核心数据是最常用的金标准模板
    if (data.number || /\d+\.?\d*%/.test(text)) return 'single-stat';
    // 基础预设回退
    if (/完成率|占比|进度/.test(text)) return 'data_card_v4';
    if (text.length <= 6) return 'data_card_v5';
    return 'single-stat'; // 默认推荐金标准
  }

  if (type === 'quote_highlight') {
    // 金标准模板推荐
    if (data.quoteText || /指出|强调|表示|认为/.test(text)) return 'quote-callout';
    // 基础预设回退
    if (/记者|发言人/.test(text) && text.length > 15) return 'quote_highlight_v3';
    if (text.length <= 12) return 'quote_highlight_v2';
    if (/政策|会议/.test(text)) return 'quote_highlight_v5';
    if (/网友|评论|对话/.test(text)) return 'quote_highlight_v4';
    return 'quote-callout'; // 默认推荐金标准
  }

  if (type === 'timeline_node') {
    // 时间轴没有金标准模板，保持原有逻辑
    if (/第.*步|阶段|流程/.test(text)) return 'timeline_node_v3';
    if (/202\d年|去年|今年/.test(text) && text.length <= 10) return 'timeline_node_v4';
    if (/过去|以前|如今|现在/.test(text)) return 'timeline_node_v2';
    if (/里程碑|突破|成果/.test(text)) return 'timeline_node_v5';
    return 'timeline_node_v1';
  }

  if (type === 'title_card' || type === 'conclusion_box') {
    if (/结论|总结|因此|可见|综上/.test(text)) return 'title_card_v4';
    if (/第[一二三四五]|首先|其次/.test(text)) return 'title_card_v5';
    if (text.length > 20) return 'title_card_v2';
    return 'title_card_v1';
  }

  return getDefaultPresetId(type);
}

module.exports = {
  loadLibrary,
  getPresetsByType,
  getPreset,
  getPresetKey,
  getCategoryLabel,
  getDefaultPresetId,
  suggestPreset,
};
