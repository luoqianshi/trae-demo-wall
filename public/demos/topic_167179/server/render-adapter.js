/**
 * 渲染适配层
 * 接收前端渲染请求，映射模板 ID，调用 Agent B 渲染管线生成透明 MOV
 */
const path = require('path');
const fs = require('fs');
const { renderTemplate } = require('../renderer/render-template');

// 前端模板 ID → 模板文件夹名（支持所有预设 ID）
const TEMPLATE_ID_MAP = {
  // 基础预设
  data_card_v1: 'data_card',
  data_card_v2: 'data_card',
  data_card_v3: 'data_card',
  data_card_v4: 'data_card',
  data_card_v5: 'data_card',
  quote_highlight_v1: 'quote_highlight',
  quote_highlight_v2: 'quote_highlight',
  quote_highlight_v3: 'quote_highlight',
  quote_highlight_v4: 'quote_highlight',
  quote_highlight_v5: 'quote_highlight',
  timeline_node_v1: 'timeline',
  timeline_node_v2: 'timeline',
  timeline_node_v3: 'timeline',
  timeline_node_v4: 'timeline',
  timeline_node_v5: 'timeline',
  title_card_v1: 'title_card',
  title_card_v2: 'title_card',
  title_card_v3: 'title_card',
  title_card_v4: 'title_card',
  title_card_v5: 'title_card',
  // 金标准模板
  'single-stat': 'single-stat',
  'data-compare': 'data-compare',
  'trend-ratio': 'trend-ratio',
  'quote-callout': 'quote-callout',
  'data-to-conclusion': 'data-to-conclusion',
};

// 模板文件夹名 → 前端模板 ID
const REVERSE_TEMPLATE_ID_MAP = Object.fromEntries(
  Object.entries(TEMPLATE_ID_MAP).map(([k, v]) => [v, k])
);

function resolveTemplateFolder(templateId) {
  return TEMPLATE_ID_MAP[templateId] || templateId;
}

/**
 * 执行渲染任务
 * @param {object} body - 前端请求体 { templateId, params, settings }
 * @returns {Promise<{jobId, status, progress, downloadUrl, outputPath, error}>}
 */
async function renderJob(body) {
  const { templateId, params = {}, settings = {} } = body;

  if (!templateId) {
    return { status: 'failed', error: '缺少 templateId' };
  }

  const templateFolder = resolveTemplateFolder(templateId);
  const templateDir = path.join(__dirname, '..', 'templates', templateFolder);

  if (!fs.existsSync(templateDir)) {
    return { status: 'failed', error: `模板不存在: ${templateId}` };
  }

  const jobId = `${templateFolder}_${Date.now()}`;

  // 构造渲染器可识别的参数包
  const sampleData = {
    templateId: templateFolder,
    params: { ...params },
    settings: {
      resolution: settings.resolution || [1080, 1700],
      fps: settings.fps || 25,
      duration: settings.duration || 3,
      format: settings.format || 'mov-prores4444',
    },
  };

  console.log(`\n📹 Render request: ${templateId} → ${jobId}`);

  const renderResult = await renderTemplate(templateFolder, sampleData, jobId);

  const outputPath = renderResult.file;
  const fileName = path.basename(outputPath);

  return {
    jobId,
    status: renderResult.passed ? 'done' : 'failed',
    progress: renderResult.passed ? 1 : 0,
    downloadUrl: `/output/${templateFolder}/${fileName}`,
    outputPath,
    error: renderResult.passed ? null : '输出验证未通过',
    verify: renderResult,
  };
}

module.exports = { renderJob, TEMPLATE_ID_MAP, REVERSE_TEMPLATE_ID_MAP };
