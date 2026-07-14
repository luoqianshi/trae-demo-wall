// ============================================================
// js/custom-input.js
// 中华文化粒子云引擎 · Task 6 自定义主题输入
// 负责：1) 文字采样转粒子云目标点（离屏 canvas 渲染 + alpha 采样）
//       2) 关键词匹配预设主题（复用 ThemeLoader.search）
//       3) 统一提交入口 handleCustomSubmit（先匹配主题，无匹配走文字采样）
// 依赖：security.js（sanitizeText / validateInput）、engine3d.js（loadCustomTargets）
// ============================================================

import { sanitizeText, validateInput } from './security.js';

// ==================== 常量配置 ====================

/** 自定义文字粒子云的配色（金色 + 墨色背景，符合中华文化意境） */
const CUSTOM_PALETTE = {
  main:   '#d4af6a',   // 主金
  accent: '#f4d77e',   // 亮金强调
  glow:   '#8b6929',   // 暗金辉光
  bg:     '#0a0705',   // 墨色背景 1
  bg2:    '#1a1208'    // 墨色背景 2
};

/** 离屏 canvas 单行高度（像素），多行文字按此行高排列 */
const LINE_HEIGHT_PX = 220;

/** 文字字体（加粗 Ma Shan Zheng 毛笔字风格） */
const TEXT_FONT = `bold 200px 'Ma Shan Zheng', serif`;

/** 采样步长（每 step 像素采一点，控制粒子密度与采样总数） */
const SAMPLE_STEP = 2;

/** 采样点上限（性能保护，超过则截断） */
const MAX_SAMPLE_POINTS = 50000;

/** 世界坐标缩放系数（canvas 像素 -> 3D 空间单位，0.1 让文字大小适中） */
const WORLD_SCALE = 0.1;

/** Z 轴随机扰动幅度（让粒子云有厚度） */
const Z_JITTER = 5;

/** 每个采样点生成的粒子数（加随机偏移，让字形更饱满） */
const PARTICLES_PER_SAMPLE = 2;

/** 采样点数下限（避免空文字导致无粒子） */
const MIN_TARGET_POINTS = 600;

// ==================== 文字采样核心 ====================

/**
 * 文字采样：把文本渲染到离屏 canvas，采样 alpha > 128 的像素，
 * 转换为 3D 世界坐标 XYZ 数组
 * @param {string} text 已净化的文本（可含换行 \n）
 * @returns {{targets:Float32Array, sampleCount:number}} 目标坐标数组（长度 = 粒子数 * 3）与采样点数
 */
export function sampleTextToTargets(text) {
  if (!text || typeof text !== 'string') {
    return { targets: new Float32Array(MIN_TARGET_POINTS * 3), sampleCount: 0 };
  }

  // 按换行拆分为多行（同时兼容全角逗号 / 句号分句，便于短句堆叠）
  const lines = text.split(/\r?\n|[,，;；]/).map(s => s.trim()).filter(s => s.length > 0);
  const finalLines = lines.length > 0 ? lines : [text];

  // 计算离屏 canvas 尺寸：宽度取最长行字符数估算，高度 = 行数 * 行高
  const maxLen = Math.max(...finalLines.map(l => l.length));
  const canvasW = Math.max(512, Math.min(2048, maxLen * 220 + 80));
  const canvasH = Math.max(512, Math.min(2048, finalLines.length * LINE_HEIGHT_PX + 80));

  // 创建离屏 canvas
  const off = document.createElement('canvas');
  off.width = canvasW;
  off.height = canvasH;
  const ctx = off.getContext('2d', { willReadFrequently: true });
  ctx.clearRect(0, 0, canvasW, canvasH);
  ctx.fillStyle = '#ffffff';
  ctx.font = TEXT_FONT;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // 多行文字按行高排列，垂直居中
  const startY = canvasH / 2 - ((finalLines.length - 1) * LINE_HEIGHT_PX) / 2;
  finalLines.forEach((line, idx) => {
    ctx.fillText(line, canvasW / 2, startY + idx * LINE_HEIGHT_PX);
  });

  // 采样 alpha > 128 的像素
  const imageData = ctx.getImageData(0, 0, canvasW, canvasH);
  const data = imageData.data;
  const rawPoints = [];
  for (let y = 0; y < canvasH; y += SAMPLE_STEP) {
    for (let x = 0; x < canvasW; x += SAMPLE_STEP) {
      const alpha = data[(y * canvasW + x) * 4 + 3];
      if (alpha > 128) {
        rawPoints.push(x, y);
      }
    }
  }

  let sampleCount = rawPoints.length / 2;
  if (sampleCount === 0) {
    // 兜底：无采样点则生成随机散点
    const fallback = new Float32Array(MIN_TARGET_POINTS * 3);
    for (let i = 0; i < MIN_TARGET_POINTS; i++) {
      fallback[i * 3]     = (Math.random() - 0.5) * 200;
      fallback[i * 3 + 1] = (Math.random() - 0.5) * 200;
      fallback[i * 3 + 2] = (Math.random() - 0.5) * 40;
    }
    return { targets: fallback, sampleCount: 0 };
  }

  // 截断到上限
  if (sampleCount > MAX_SAMPLE_POINTS) {
    sampleCount = MAX_SAMPLE_POINTS;
  }

  // 每个采样点生成 PARTICLES_PER_SAMPLE 个粒子（加随机偏移让字形饱满）
  const particleCount = sampleCount * PARTICLES_PER_SAMPLE;
  const targets = new Float32Array(particleCount * 3);
  const halfW = canvasW / 2;
  const halfH = canvasH / 2;

  for (let i = 0; i < sampleCount; i++) {
    const px = rawPoints[i * 2];
    const py = rawPoints[i * 2 + 1];
    for (let k = 0; k < PARTICLES_PER_SAMPLE; k++) {
      const pi = i * PARTICLES_PER_SAMPLE + k;
      const jitterX = (Math.random() - 0.5) * 2.5;
      const jitterY = (Math.random() - 0.5) * 2.5;
      // X = (px - W/2) * scale, Y = -(py - H/2) * scale（Y 轴翻转，canvas Y 向下为正而 3D Y 向上为正）
      targets[pi * 3]     = (px - halfW + jitterX) * WORLD_SCALE;
      targets[pi * 3 + 1] = -(py - halfH + jitterY) * WORLD_SCALE;
      targets[pi * 3 + 2] = (Math.random() - 0.5) * Z_JITTER;
    }
  }

  return { targets, sampleCount };
}

// ==================== 文字转粒子云 ====================

/**
 * 文字转粒子云：采样文字 → 调用 engine3D.loadCustomTargets 渲染
 * @param {string} text 已净化的文本
 * @param {object} engine3D Engine3D 实例
 * @returns {{ok:boolean, sampleCount:number, particleCount:number, error?:string}}
 */
export function renderCustomText(text, engine3D) {
  if (!engine3D || !engine3D.particleSystem) {
    return { ok: false, sampleCount: 0, particleCount: 0, error: '3D 引擎未就绪' };
  }
  if (engine3D.currentMode !== '3d' && !engine3D.particleSystem.points) {
    return { ok: false, sampleCount: 0, particleCount: 0, error: '3D 引擎未就绪' };
  }

  const { targets, sampleCount } = sampleTextToTargets(text);
  const particleCount = targets.length / 3;

  if (particleCount === 0) {
    return { ok: false, sampleCount: 0, particleCount: 0, error: '文字采样无有效点' };
  }

  // 调用 engine3D.loadCustomTargets：应用自定义配色 + 调整粒子数 + 触发 morph
  engine3D.loadCustomTargets(targets, CUSTOM_PALETTE);

  return { ok: true, sampleCount, particleCount };
}

// ==================== 统一提交入口 ====================

/**
 * 统一提交入口：净化 → 校验 → 匹配预设主题 → 文字采样
 * @param {string} rawText 用户原始输入
 * @param {object} app App 实例（含 themeLoader / engine3D / loadTheme / _toast / currentMode / switchMode）
 * @returns {Promise<{action:'theme'|'text'|'invalid', themeId?:string, sampleCount?:number, particleCount?:number, error?:string}>}
 */
export async function handleCustomSubmit(rawText, app) {
  // 1. 净化：剥离 HTML 标签 + 危险关键字 + 实体转义
  const cleaned = sanitizeText(rawText, { maxLength: 200, allowNewlines: true });

  // 2. 校验：用 keyword 类型先校验（短词匹配主题），失败再用 poem 类型校验（长句文字采样）
  // 这里采用宽松策略：只要净化后非空即放行（避免「静夜思」这种短词被 keyword 校验卡住后无法走文字采样）
  if (!cleaned || !cleaned.trim()) {
    return { action: 'invalid', error: '输入不能为空' };
  }

  // 3. 若当前非 3D 模式，自动切换到 3D（文字采样与主题加载都在 3D 中呈现）
  if (app.currentMode !== '3d') {
    if (typeof app.switchMode === 'function') {
      app.switchMode('3d');
    } else {
      return { action: 'invalid', error: '请切换到 3D 云海模式后重试' };
    }
  }

  // 4. 关键词匹配预设主题：调用 themeLoader.search 模糊匹配 name/description/era/category/id
  //    search 内部会对未加载主题触发 load，加载后 _metaCache 即有完整 meta
  let matchedIds = [];
  try {
    matchedIds = await app.themeLoader.search(cleaned);
  } catch (err) {
    // search 失败则降级走文字采样
    matchedIds = [];
  }

  // 匹配优先级（从高到低）：
  //   a) id 精确等于输入
  //   b) name 精确等于输入
  //   c) 输入长度 ≥ 2 时，name 包含输入的主题（且唯一）—— 处理「唐诗」→「唐诗星河」
  //   d) matchedIds 唯一 —— 处理「李白」匹配 description 含「李白」的 tangshi
  //   e) matchedIds 多个 —— 朝代匹配场景，toast 提示选择
  //   f) matchedIds 为空 —— 走文字采样
  let targetId = null;
  if (matchedIds.length > 0) {
    const list = app.themeLoader.list();
    const getMeta = (mid) => list.find(t => t.id === mid);

    // a) id 精确匹配
    const exactId = matchedIds.find(mid => mid === cleaned);
    if (exactId) {
      targetId = exactId;
    } else {
      // b) name 精确匹配
      const exactName = matchedIds.find(mid => {
        const m = getMeta(mid);
        return m && m.name === cleaned;
      });
      if (exactName) {
        targetId = exactName;
      } else if (cleaned.length >= 2) {
        // c) name 包含输入且唯一
        const nameContains = matchedIds.filter(mid => {
          const m = getMeta(mid);
          return m && m.name && m.name.includes(cleaned);
        });
        if (nameContains.length === 1) {
          targetId = nameContains[0];
        }
      }
    }

    // d) 若仍未命中且 matchedIds 唯一，则加载
    if (!targetId && matchedIds.length === 1) {
      targetId = matchedIds[0];
    }

    // e) 多个且未命中精确/name 包含，toast 提示选择
    if (!targetId && matchedIds.length > 1) {
      if (typeof app._toast === 'function') {
        const names = matchedIds.slice(0, 3).map(mid => {
          const m = getMeta(mid);
          return m && m.name ? m.name : mid;
        }).join('、');
        app._toast(`匹配到 ${matchedIds.length} 个主题（${names}…），请输入更精确的关键词`, 2800);
      }
      return { action: 'invalid', error: '匹配到多个主题' };
    }
  }

  if (targetId) {
    // 命中主题：加载并 toast，不再走文字采样
    await app.loadTheme(targetId);
    if (typeof app._toast === 'function') {
      const listAll = app.themeLoader.list();
      const m = listAll.find(t => t.id === targetId);
      const themeName = m && m.name ? m.name : targetId;
      app._toast(`已加载主题：${themeName}`, 1800);
    }
    return { action: 'theme', themeId: targetId };
  }

  // 5. 无主题匹配：走文字采样路径
  // 等待切换 3D 完成（switchMode 是异步墨散过渡，这里给一个微小延迟让引擎就绪）
  if (!app.engine3D) {
    return { action: 'invalid', error: '3D 引擎未就绪' };
  }
  // 简单等待：若刚切换模式，等一帧让引擎 start
  await new Promise(r => setTimeout(r, 60));

  const result = renderCustomText(cleaned, app.engine3D);
  if (!result.ok) {
    if (typeof app._toast === 'function') {
      app._toast(result.error || '文字渲染失败', 2000);
    }
    return { action: 'invalid', error: result.error };
  }

  if (typeof app._toast === 'function') {
    app._toast(`已渲染文字粒子云（${result.particleCount.toLocaleString()} 粒子）`, 1800);
  }
  return { action: 'text', sampleCount: result.sampleCount, particleCount: result.particleCount };
}

// 功能描述：Task 6 自定义主题输入模块。导出三个核心能力：
// 1) sampleTextToTargets(text)：离屏 canvas 用 bold 200px 'Ma Shan Zheng' 渲染文字，
//    按 220px 行高排列多行，getImageData 采样 alpha>128 的像素（每 2 像素采一点，上限 50000），
//    转换为 XYZ 坐标（X=(px-W/2)*0.1, Y=-(py-H/2)*0.1, Z=(random-0.5)*5），每采样点生成 2 个粒子加随机偏移，
//    返回 {targets:Float32Array, sampleCount}；
// 2) renderCustomText(text, engine3D)：调用 sampleTextToTargets 后调用 engine3D.loadCustomTargets(targets, CUSTOM_PALETTE)
//    应用金色+墨色自定义配色并触发 morph，返回 {ok, sampleCount, particleCount}；
// 3) handleCustomSubmit(rawText, app)：统一提交入口，流程为 sanitizeText 净化（maxLength 200, allowNewlines）
//    → 非空校验 → 若非 3D 模式自动 switchMode('3d') → themeLoader.search 模糊匹配 name/description/era/category/id，
//    匹配优先级：a) id 精确等于输入 → b) name 精确等于输入 → c) 输入长度≥2 时 name 包含输入且唯一（处理「唐诗」→「唐诗星河」）
//    → d) matchedIds 唯一则加载（处理「李白」匹配 description 含「李白」的 tangshi）→ e) 多个则 toast 提示选择（朝代匹配场景）
//    → f) 零匹配走 renderCustomText 文字采样 + toast「已渲染文字粒子云（N 粒子）」。
// 自定义配色 CUSTOM_PALETTE = {main:#d4af6a, accent:#f4d77e, glow:#8b6929, bg:#0a0705, bg2:#1a1208} 金墨意境。
