#!/usr/bin/env node
/**
 * 渲染单个模板 → 透明通道 MOV
 * 用法: node renderer/render-template.js <templateId>
 */
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');
const { captureFrames } = require('./capture-frames');
const { encodeProRes, generateCheckerPreview } = require('./encode-prores');
const { verifyOutput } = require('./verify-output');

async function renderTemplate(templateId, sampleData = null, jobSuffix = null) {
  console.log(`\n╔══════════════════════════════════════════╗`);
  console.log(`║  Rendering: ${templateId.padEnd(32)} ║`);
  console.log(`╚══════════════════════════════════════════╝`);

  const templateDir = CONFIG.getTemplateDir(templateId);
  const distDir = CONFIG.getDistDir(templateId);
  const outputPath = jobSuffix
    ? CONFIG.getOutputPath(templateId, jobSuffix)
    : CONFIG.getOutputPath(templateId);
  const framesDir = path.join(CONFIG.root, 'temp', `${templateId}_${Date.now()}`);

  // Load composition and sample data
  const compositionPath = path.join(templateDir, 'composition.html');
  const samplePath = sampleData ? null : path.join(templateDir, 'sample.json');

  if (!fs.existsSync(compositionPath)) {
    throw new Error(`Template composition not found: ${compositionPath}`);
  }

  let compositionHTML = fs.readFileSync(compositionPath, 'utf8');
  let rawParams = sampleData || {};

  if (!sampleData && fs.existsSync(samplePath)) {
    rawParams = JSON.parse(fs.readFileSync(samplePath, 'utf8'));
  }

  // 兼容两种参数格式：
  // 1. CLI/sample.json 格式: { templateId, params: {...}, settings: {...} }
  // 2. 直接格式: { mainText, number, theme, settings: {...} }
  const isWrapped = rawParams.params && typeof rawParams.params === 'object';
  const actualParams = isWrapped ? rawParams.params : rawParams;
  const settings = isWrapped
    ? { ...rawParams.settings, ...actualParams.settings }
    : actualParams.settings || {};

  // Inject parameters into composition
  const theme = actualParams.theme || rawParams.theme || 'amber';
  const themeColors = CONFIG.themes[theme] || CONFIG.themes.amber;
  const duration = settings.duration || CONFIG.defaultDuration;
  const fps = settings.fps || CONFIG.fps;

  // Replace template variables
  let html = compositionHTML
    .replace(/{{theme}}/g, theme)
    .replace(/{{themeColor}}/g, themeColors.primary)
    .replace(/{{themeGlow}}/g, themeColors.primaryGlow);

  // 构建注入脚本
  const paramsJSON = JSON.stringify(actualParams);
  let injectScripts = `
<script>
  window.__TEMPLATE_PARAMS = ${paramsJSON};
  window.__THEME = ${JSON.stringify(themeColors)};
  window.__DURATION = ${duration};
</script>`;

  // 金标准模板需要 GSAP 和 __hyperframes 桥接
  const GOLD_STANDARD_TEMPLATES = ['single-stat', 'data-compare', 'trend-ratio', 'quote-callout', 'data-to-conclusion'];
  const isGoldStandard = GOLD_STANDARD_TEMPLATES.includes(templateId) || GOLD_STANDARD_TEMPLATES.includes(actualParams.templateId || '');
  if (isGoldStandard) {
    const gsapPath = path.join(CONFIG.root, 'node_modules', 'gsap', 'dist', 'gsap.min.js');
    if (fs.existsSync(gsapPath)) {
      const gsapCode = fs.readFileSync(gsapPath, 'utf8');
      injectScripts += `\n<script>/* GSAP */\n${gsapCode}\n</script>`;
    }
    injectScripts += `\n<script>window.__hyperframes = { getVariables: function() { return window.__TEMPLATE_PARAMS || {}; } };</script>`;
  }

  html = html.replace('</head>', injectScripts + '\n</head>');

  // Step 1: Capture frames
  console.log('\n[1/3] Capturing frames...');
  await captureFrames(html, framesDir, {
    duration,
    fps
  });

  // Step 2: Encode ProRes
  console.log('\n[2/3] Encoding ProRes 4444 MOV...');
  encodeProRes(framesDir, outputPath, { fps });

  // Step 3: Generate preview
  console.log('\n[3/3] Generating preview & verifying...');
  generateCheckerPreview(outputPath, distDir);

  // Verify
  const result = verifyOutput(outputPath);

  // Cleanup temp frames
  const frames = fs.readdirSync(framesDir);
  frames.forEach(f => fs.unlinkSync(path.join(framesDir, f)));
  fs.rmdirSync(framesDir);

  console.log(`\n✅ ${templateId} render complete!`);
  return result;
}

// CLI
if (require.main === module) {
  const templateId = process.argv[2];
  if (!templateId) {
    console.error('Usage: node renderer/render-template.js <templateId>');
    process.exit(1);
  }
  renderTemplate(templateId).then(r => {
    if (!r.passed) process.exit(1);
  }).catch(e => {
    console.error('Render failed:', e.message);
    process.exit(1);
  });
}

module.exports = { renderTemplate };