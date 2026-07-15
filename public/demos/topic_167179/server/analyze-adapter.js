/**
 * 分析适配层
 * 封装本地规则引擎与可选 KIMI 辅助，为前端提供统一的识别结果
 */
const { analyzeText } = require('../analyzer/src/index');
const { matchAllTemplates } = require('../analyzer/src/matcher');
const { suggestPreset, getDefaultPresetId } = require('../analyzer/src/preset-library');

/**
 * 分析口播稿，返回识别结果与渲染 payload
 * @param {string} rawText
 * @param {object} options
 * @returns {{status: string, provider: string, results: Array, renderPayloads: Array, error?: string}}
 */
async function analyzeScript(rawText, options = {}) {
  const maxResults = options.maxResults || 12;

  // 本地规则同步返回，KIMI 辅助时异步调用
  const analysis = await analyzeText(rawText, options);

  // 为每个结果附加更完整的 extractedData 默认值、推荐预设和短文案
  const enrichedResults = analysis.results.map((r) => {
    const data = r.extractedData || {};
    // 始终用 suggestPreset 推荐最佳模板（金标准优先），不再盲从规则引擎的默认 v1
    const presetId = suggestPreset(r.type, data, r.text) || r.suggestedTemplate || getDefaultPresetId(r.type);
    const displayText = data.displayText || buildDisplayText(r.type, data, r.text);

    const recommendReason = generateRecommendReason(r.type, presetId, r.text);

    const base = {
      ...r,
      suggestedTemplate: presetId,
      recommendReason,
      extractedData: {
        ...data,
        displayText,
      },
    };

    if (r.type === 'data_card') {
      return {
        ...base,
        extractedData: {
          ...base.extractedData,
          mainText: data.mainText || displayText,
          number: data.number || '',
          unit: data.unit || '',
          subText: data.subText || '',
          source: data.source || '',
        },
      };
    }

    if (r.type === 'quote_highlight') {
      return {
        ...base,
        extractedData: {
          ...base.extractedData,
          quoteText: data.quoteText || r.text,
          subText: data.subText || '',
          source: data.source || '',
        },
      };
    }

    if (r.type === 'timeline_node') {
      return {
        ...base,
        extractedData: {
          ...base.extractedData,
          timeText: data.timeText || r.text,
          items: data.items || [{ time: data.timeText || displayText, text: displayText }],
        },
      };
    }

    if (r.type === 'title_card' || r.type === 'conclusion_box') {
      return {
        ...base,
        extractedData: {
          ...base.extractedData,
          titleText: data.titleText || data.conclusionText || displayText,
          subText: data.subText || '',
          source: data.source || '',
        },
      };
    }

    return base;
  });

  const renderPayloads = matchAllTemplates(enrichedResults);

  return {
    status: analysis.status || 'ok',
    provider: analysis.provider || 'local',
    mode: analysis.mode || 'rules-first',
    results: enrichedResults,
    renderPayloads,
    error: analysis.error || null,
  };
}

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
  let t = title.trim().replace(/^[，,。．！？；：\s]+|[，,。．！？；：\s]+$/g, '');
  const firstPart = t.split(/[，,、]/)[0].trim();
  if (firstPart.length >= 4 && firstPart.length <= 18) return firstPart;
  return t.length > 18 ? t.slice(0, 18) + '…' : t;
}

function shortenText(text, maxLen) {
  if (!text) return '';
  const t = text.trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen) + '…';
}

function generateRecommendReason(type, templateId, text) {
  const goldReasons = {
    'single-stat': '检测到核心数据指标，适合单一数字突出展示',
    'data-compare': '检测到可对比的数据，适合左右并列展示',
    'trend-ratio': '检测到趋势/比例数据，适合带方向指示展示',
    'data-to-conclusion': '检测到数据支撑的结论，适合三段式推导展示',
    'quote-callout': '检测到观点/引语，适合花字高亮展示',
  };
  if (goldReasons[templateId]) return goldReasons[templateId];

  const typeReasons = {
    data_card: '检测到数据信息，适合数据卡展示',
    quote_highlight: '检测到引语/观点，适合花字高亮',
    timeline_node: '检测到时间表述，适合时间轴展示',
    title_card: '检测到标题/结论，适合标题卡展示',
    conclusion_box: '检测到结论表述，适合结论卡展示',
  };
  return typeReasons[type] || '基于文本内容分析推荐';
}

module.exports = { analyzeScript };

