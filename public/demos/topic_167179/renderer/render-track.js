const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const CONFIG = require('./config');
const { renderTemplate } = require('./render-template');
const { verifyOutput } = require('./verify-output');

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
  // 金标准模板（独立目录）
  'single-stat': 'single-stat',
  'data-compare': 'data-compare',
  'trend-ratio': 'trend-ratio',
  'quote-callout': 'quote-callout',
  'data-to-conclusion': 'data-to-conclusion',
};

const PRESET_KEY_MAP = {
  // 基础预设
  data_card_v1: 'classic',
  data_card_v2: 'compare',
  data_card_v3: 'trend',
  data_card_v4: 'ring',
  data_card_v5: 'tag',
  quote_highlight_v1: 'classic',
  quote_highlight_v2: 'center',
  quote_highlight_v3: 'speaker',
  quote_highlight_v4: 'bubble',
  quote_highlight_v5: 'underline',
  timeline_node_v1: 'classic',
  timeline_node_v2: 'dual',
  timeline_node_v3: 'flow',
  timeline_node_v4: 'date_card',
  timeline_node_v5: 'milestone',
  title_card_v1: 'classic',
  title_card_v2: 'subtitle',
  title_card_v3: 'left_bar',
  title_card_v4: 'conclusion',
  title_card_v5: 'chapter',
  // 金标准模板
  'single-stat': 'gold_single_stat',
  'data-compare': 'gold_data_compare',
  'trend-ratio': 'gold_trend_ratio',
  'quote-callout': 'gold_quote_callout',
  'data-to-conclusion': 'gold_data_to_conclusion',
};

const POINT_DURATION = 3; // 每个包装点展示 3 秒

/**
 * 渲染完整长度的透明包装轨
 * @param {Array} packagingPoints - 已绑定 time 的包装点数组
 * @param {number} fullDuration - 完整视频时长（秒）
 * @param {string} trackId - 轨道任务 ID
 * @returns {Promise<object>} 验证结果
 */
async function renderTrack(packagingPoints, fullDuration, trackId) {
  const workDir = path.join(CONFIG.root, 'temp', `track_${trackId}`);
  fs.mkdirSync(workDir, { recursive: true });

  const outputDir = path.join(CONFIG.root, 'output', 'track');
  fs.mkdirSync(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `track_${trackId}.mov`);

  // 1. 过滤并渲染每个包装点的独立 MOV
  const validPoints = packagingPoints
    .filter((p) => p.aligned && p.time !== null && p.time < fullDuration)
    .sort((a, b) => a.time - b.time);

  console.log(`\n🎬 开始渲染完整包装轨：${validPoints.length} 个包装点，总时长 ${fullDuration.toFixed(2)}s`);

  const segmentPaths = [];
  for (let i = 0; i < validPoints.length; i++) {
    const p = validPoints[i];
    const folder = TEMPLATE_ID_MAP[p.suggestedTemplate] || p.suggestedTemplate.replace('_v1', '');
    const suffix = `${trackId}_seg${i}`;

    const payload = {
      templateId: folder,
      params: buildParams(p),
      settings: {
        resolution: [CONFIG.width, CONFIG.height],
        fps: CONFIG.fps,
        duration: POINT_DURATION,
        format: 'mov-prores4444',
      },
    };

    console.log(`\n[${i + 1}/${validPoints.length}] 渲染 ${p.suggestedTemplate} @ ${p.time.toFixed(2)}s`);
    const result = await renderTemplate(folder, payload, suffix);
    if (!result.passed) {
      console.warn(`  ⚠️ 包装点 ${i} 渲染验证未通过，跳过`);
      continue;
    }
    segmentPaths.push({
      path: result.file,
      start: p.time,
      end: Math.min(p.time + POINT_DURATION, fullDuration),
    });
  }

  if (segmentPaths.length === 0) {
    throw new Error('没有可渲染的包装点（全部未对齐或渲染失败）');
  }

  // 2. 生成透明底图 PNG
  const transparentPng = path.join(workDir, 'transparent.png');
  generateTransparentPng(transparentPng);

  // 3. 用 FFmpeg 把所有片段叠加到透明底轨上
  compositeTrack(transparentPng, segmentPaths, fullDuration, outputPath);

  // 4. 验证输出
  const verify = verifyOutput(outputPath, { expectedDuration: fullDuration });

  // 5. 清理临时文件
  cleanup(workDir, segmentPaths);

  console.log(`\n✅ 包装轨导出完成: ${outputPath}`);
  return { ...verify, file: outputPath, trackId, points: validPoints.length };
}

function buildParams(point) {
  const data = point.extractedData || {};
  const displayText = data.displayText || '';
  const suggestedTemplate = point.suggestedTemplate || '';

  // 金标准模板参数映射
  if (suggestedTemplate === 'single-stat') {
    return {
      mainNumber: displayText || data.number || data.mainText || point.text,
      subText: data.subText || '',
      displayText,
      theme: point.theme || 'amber',
    };
  }
  if (suggestedTemplate === 'data-compare') {
    return {
      textLeft: data.textLeft || displayText || data.number || point.text,
      textRight: data.textRight || data.compareNumber || '',
      displayText,
      theme: point.theme || 'amber',
    };
  }
  if (suggestedTemplate === 'trend-ratio') {
    return {
      mainNumber: displayText || data.number || data.mainText || point.text,
      trendDirection: data.trendDirection || (data.subText && /下降|跌|减/.test(data.subText) ? 'down' : 'up'),
      subText: data.subText || '',
      displayText,
      theme: point.theme || 'amber',
    };
  }
  if (suggestedTemplate === 'quote-callout') {
    return {
      quoteText: displayText || data.quoteText || point.text,
      speaker: data.source || data.speaker || data.subText || '',
      displayText,
      theme: point.theme || 'amber',
    };
  }
  if (suggestedTemplate === 'data-to-conclusion') {
    return {
      textLeft: data.textLeft || data.number || '',
      textRight: data.textRight || data.compareNumber || '',
      textResult: displayText || data.conclusionText || data.titleText || point.text,
      displayText,
      theme: point.theme || 'amber',
    };
  }

  // 原有逻辑
  const preset = PRESET_KEY_MAP[suggestedTemplate] || 'classic';

  const params = {
    mainText: displayText || data.mainText || point.text,
    subText: data.subText || '',
    displayText,
    preset,
    theme: point.theme || 'amber',
  };

  if (point.type === 'data_card') {
    params.number = data.number || displayText || '';
    params.unit = data.unit || '';
    params.source = data.source || '';
  } else if (point.type === 'quote_highlight') {
    params.quoteText = displayText || data.quoteText || point.text;
    params.source = data.source || '';
  } else if (point.type === 'timeline_node') {
    params.timeText = displayText || data.timeText || point.text;
    params.items = data.items || [{ time: params.timeText, text: displayText || point.text }];
  } else if (point.type === 'title_card' || point.type === 'conclusion_box') {
    params.source = data.source || '';
    if (preset === 'chapter') {
      params.chapterNumber = data.chapterNumber || '1';
    }
  }

  return params;
}

function generateTransparentPng(outputPath) {
  const args = [
    '-y',
    '-f', 'lavfi',
    '-i', `color=black:s=${CONFIG.width}x${CONFIG.height}:r=${CONFIG.fps}:d=1`,
    '-vf', 'format=yuva444p,geq=lum=0:cb=128:cr=128:a=0',
    '-frames:v', '1',
    '-update', 'true',
    outputPath,
  ];
  const res = spawnSync(CONFIG.ffmpegPath, args, { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`生成透明底图失败: ${res.stderr || res.stdout}`);
  }
}

function compositeTrack(transparentPng, segments, duration, outputPath) {
  const args = [
    '-y',
    '-loop', '1',
    '-framerate', String(CONFIG.fps),
    '-i', transparentPng,
  ];

  segments.forEach((seg) => args.push('-i', seg.path));

  const filterParts = [];
  let lastLabel = '0:v';

  segments.forEach((seg, idx) => {
    const inputIdx = idx + 1;
    const segLabel = `seg${idx}`;
    const outLabel = idx === segments.length - 1 ? 'out' : `tmp${idx}`;
    const start = seg.start.toFixed(3);
    const end = seg.end.toFixed(3);

    filterParts.push(`[${inputIdx}:v]setpts=PTS+${start}/TB[${segLabel}]`);
    filterParts.push(`[${lastLabel}][${segLabel}]overlay=0:0:enable='gte(t,${start})*lte(t,${end})'[${outLabel}]`);
    lastLabel = outLabel;
  });

  args.push(
    '-t', String(duration),
    '-filter_complex', filterParts.join(';'),
    '-map', '[out]',
    '-c:v', 'prores_ks',
    '-profile:v', '4444',
    '-pix_fmt', 'yuva444p10le',
    '-vendor', 'apl0',
    '-r', String(CONFIG.fps),
    outputPath
  );

  console.log(`\n[composite] 合成完整轨道: ${outputPath}`);
  const res = spawnSync(CONFIG.ffmpegPath, args, { encoding: 'utf8', stdio: 'pipe' });
  if (res.status !== 0) {
    console.error(res.stderr);
    throw new Error('FFmpeg 合成包装轨失败');
  }
}

function cleanup(workDir, segmentPaths) {
  try {
    segmentPaths.forEach((seg) => {
      if (fs.existsSync(seg.path)) fs.unlinkSync(seg.path);
    });
    if (fs.existsSync(workDir)) {
      fs.readdirSync(workDir).forEach((f) => fs.unlinkSync(path.join(workDir, f)));
      fs.rmdirSync(workDir);
    }
  } catch (e) {
    console.warn('清理临时文件失败:', e.message);
  }
}

module.exports = { renderTrack };
