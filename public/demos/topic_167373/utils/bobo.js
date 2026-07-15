// utils/bobo.js
// V0.2.0 波波角色工具库
//   - 表情状态：happy / normal / worried / celebrate / peek（从边缘探出）
//   - 互动计数管理（控制引导气泡只展示 N 次）
//   - 反馈文案生成（基于 Bristol+颜色+身体感受）

const STORAGE_KEYS = require('../data/storage/storage-keys.js');
const storageManager = require('../data/storage/storage-manager.js');

/**
 * 表情状态枚举
 */
const EXPRESSIONS = {
  HAPPY: 'happy',
  NORMAL: 'normal',
  WORRIED: 'worried',
  CELEBRATE: 'celebrate',
  PEEK: 'peek'
};

/**
 * 根据 Bristol 类型 + 颜色 + 身体感受信号，决定波波表情
 * @param {object} ctx { bristolType, color, painLevel, swelling, residue, unfinished }
 */
function pickExpression(ctx) {
  if (!ctx) return EXPRESSIONS.NORMAL;
  const t = Number(ctx.bristolType);
  const pain = Number(ctx.painLevel) || 0;
  const bad = ctx.swelling || ctx.residue || ctx.unfinished;

  // 异常颜色
  if (ctx.color === 'black' || ctx.color === 'red') return EXPRESSIONS.WORRIED;
  // 严重疼痛
  if (pain >= 2) return EXPRESSIONS.WORRIED;
  // 水样 + 疼痛
  if ((t === 6 || t === 7) && pain >= 1) return EXPRESSIONS.WORRIED;
  // 腹胀/残留/不尽
  if (bad) return EXPRESSIONS.WORRIED;
  // 干硬
  if (t === 1 || t === 2) return EXPRESSIONS.NORMAL;
  // 理想
  if (t === 4) return EXPRESSIONS.HAPPY;
  // 其它
  return EXPRESSIONS.NORMAL;
}

/**
 * 波波点评文案生成（80+ 条规则的简化版，组合式生成）
 * 优先级：异常 > 警告 > 正常
 * @param {object} ctx 同 pickExpression
 * @returns {string} 中文点评 1-2 句
 */
function generateComment(ctx) {
  if (!ctx) return '波波在看你记录哦~';
  const t = Number(ctx.bristolType);
  const pain = Number(ctx.painLevel) || 0;
  const color = ctx.color;
  const sw = !!ctx.swelling, re = !!ctx.residue, uf = !!ctx.unfinished;

  // ===== 异常通道 =====
  if (color === 'black' || color === 'red') {
    return '便便颜色偏深/带血，请尽快咨询医生。波波有点担心你。';
  }
  if (pain >= 2) {
    return '这次排便有明显疼痛，提示可能有肠道刺激，请注意观察。';
  }
  if ((t === 6 || t === 7) && pain >= 1) {
    return '稀便伴随疼痛，提示消化或肠道不适，建议咨询医生。';
  }
  if (sw && (re || uf)) {
    return '腹胀又排不干净，多半是消化问题，建议少食多餐、避免油腻。';
  }
  if (sw) return '腹胀不舒服的话，可以喝点温水或做腹部按摩。';
  if (re) return '总觉得排不干净，可以试一下散步或温水坐浴。';
  if (uf) return '排不尽感明显时，建议补充纤维 + 充足饮水。';

  // ===== 警告通道（基于 Bristol）=====
  if (t === 1) return '有点干硬哦，记得多喝水，多吃蔬菜水果。';
  if (t === 2) return '排便偏干，再加些膳食纤维会更好。';

  // ===== 正常通道 =====
  if (t === 4) return '状态很好，继续保持！波波为你点赞~';
  if (t === 3) return '形状略干，整体还行，多喝点水更好。';
  if (t === 5) return '有点软，状况不错，注意别吃太油。';
  if (t === 6) return '偏稀了一点，建议清淡饮食。';
  if (t === 7) return '今天有点稀，注意补水，观察下后续。';
  return '记录完成，波波在看着你~';
}

/**
 * 互动计数管理
 *  - 每次用户主动"查看/点击"波波时调用
 *  - 限制总次数避免打扰
 */
function getInteractionCount() {
  try {
    const n = storageManager.get(STORAGE_KEYS.BOBO_INTERACTIONS, 0);
    return Number(n) || 0;
  } catch (e) { return 0; }
}

function incrementInteractionCount() {
  try {
    const cur = getInteractionCount();
    storageManager.set(STORAGE_KEYS.BOBO_INTERACTIONS, cur + 1);
    return cur + 1;
  } catch (e) { return 0; }
}

function resetInteractionCount() {
  try { storageManager.set(STORAGE_KEYS.BOBO_INTERACTIONS, 0); } catch (e) {}
}

/**
 * 是否应该展示引导气泡
 *  条件：boboEnabled && 互动次数 < boboBubbleCount
 */
function shouldShowGuideBubble(settings) {
  if (!settings || !settings.boboEnabled) return false;
  const cnt = getInteractionCount();
  // 修复：0 也是有效值，用 ?? 而不是 ||
  const max = settings.boboBubbleCount != null && isFinite(settings.boboBubbleCount)
    ? Math.max(0, Math.floor(Number(settings.boboBubbleCount)))
    : 3;
  return cnt < max;
}

/**
 * Canvas 绘制波波（mini-program 2D 上下文）
 * 用最少的代码画一个圆胖、可爱、有表情的角色
 * @param {CanvasContext} ctx
 * @param {object} opts { x, y, size, expression, scale, blinkProgress }
 *  - expression: 'happy' | 'normal' | 'worried' | 'celebrate' | 'peek'
 *  - scale: 整体缩放 (0.5 - 1.5)
 *  - blinkProgress: 0=睁眼 1=闭眼 (用于眨眼动画)
 */
function drawBobo(ctx, opts) {
  if (!ctx) return;
  const o = opts || {};
  const x = Number(o.x) || 0;
  const y = Number(o.y) || 0;
  const size = Number(o.size) || 100;
  const scale = Number(o.scale) || 1;
  const expression = o.expression || EXPRESSIONS.NORMAL;
  const blink = Math.max(0, Math.min(1, Number(o.blinkProgress) || 0));

  ctx.save();
  // 坐标系平移到中心点
  ctx.translate(x, y);
  ctx.scale(scale, scale);

  // ===== 1. 影子（半透明椭圆） =====
  ctx.beginPath();
  ctx.fillStyle = 'rgba(0,0,0,0.18)';
  ctx.ellipse(0, size * 0.45, size * 0.4, size * 0.08, 0, 0, Math.PI * 2);
  ctx.fill();

  // ===== 2. 身体（圆胖波波主体，浅棕 + 渐变） =====
  const r = size * 0.4;
  const bodyGrad = ctx.createLinearGradient(0, -r, 0, r);
  bodyGrad.addColorStop(0, '#C8A47C');
  bodyGrad.addColorStop(1, '#8B6A47');

  ctx.beginPath();
  ctx.fillStyle = bodyGrad;
  // 整体形状：圆 + 两侧小耳垂
  ctx.arc(0, 0, r, 0, Math.PI * 2);
  ctx.fill();

  // 耳朵（两个小圆点）
  ctx.beginPath();
  ctx.fillStyle = '#8B6A47';
  ctx.arc(-r * 0.85, -r * 0.55, r * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.arc(r * 0.85, -r * 0.55, r * 0.18, 0, Math.PI * 2);
  ctx.fill();

  // 耳朵内圈（粉）
  ctx.beginPath();
  ctx.fillStyle = '#E8A4A4';
  ctx.arc(-r * 0.85, -r * 0.55, r * 0.09, 0, Math.PI * 2);
  ctx.fill();
  ctx.arc(r * 0.85, -r * 0.55, r * 0.09, 0, Math.PI * 2);
  ctx.fill();

  // 头顶高光
  ctx.beginPath();
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.ellipse(-r * 0.25, -r * 0.55, r * 0.32, r * 0.15, 0, 0, Math.PI * 2);
  ctx.fill();

  // ===== 3. 表情 =====
  drawEyes(ctx, expression, blink, r);
  drawMouth(ctx, expression, r);
  drawCheeks(ctx, r);

  // 庆祝模式：头顶加一圈小星星
  if (expression === EXPRESSIONS.CELEBRATE) {
    drawCelebrate(ctx, size);
  }
  // 担心模式：眉头点
  if (expression === EXPRESSIONS.WORRIED) {
    drawWorriedMark(ctx, size);
  }

  ctx.restore();
}

/**
 * 绘制眼睛（根据表情 + 眨眼进度）
 */
function drawEyes(ctx, expression, blink, r) {
  const eyeY = -r * 0.1;
  const eyeX = r * 0.35;
  const eyeW = r * 0.13;
  const eyeH = r * 0.16 * (1 - blink);

  // 左眼
  ctx.beginPath();
  ctx.fillStyle = '#1A1A1A';
  ctx.ellipse(-eyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();
  // 右眼
  ctx.beginPath();
  ctx.fillStyle = '#1A1A1A';
  ctx.ellipse(eyeX, eyeY, eyeW, eyeH, 0, 0, Math.PI * 2);
  ctx.fill();

  // 眼睛高光（仅在睁眼时）
  if (blink < 0.3) {
    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(-eyeX - eyeW * 0.3, eyeY - eyeH * 0.4, eyeW * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.fillStyle = '#FFFFFF';
    ctx.arc(eyeX - eyeW * 0.3, eyeY - eyeH * 0.4, eyeW * 0.35, 0, Math.PI * 2);
    ctx.fill();
  }

  // 担心模式：眼睛下面加一滴小泪
  if (expression === EXPRESSIONS.WORRIED && blink < 0.5) {
    ctx.beginPath();
    ctx.fillStyle = '#7FB3D5';
    ctx.arc(-eyeX + eyeW * 0.4, eyeY + eyeH * 0.9, eyeW * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

/**
 * 绘制嘴巴
 */
function drawMouth(ctx, expression, r) {
  ctx.beginPath();
  ctx.lineWidth = Math.max(2, r * 0.08);
  ctx.lineCap = 'round';
  ctx.strokeStyle = '#1A1A1A';

  const mouthY = r * 0.25;
  if (expression === EXPRESSIONS.HAPPY || expression === EXPRESSIONS.CELEBRATE) {
    // 上扬微笑
    ctx.moveTo(-r * 0.2, mouthY);
    ctx.quadraticCurveTo(0, mouthY + r * 0.15, r * 0.2, mouthY);
    ctx.stroke();
  } else if (expression === EXPRESSIONS.WORRIED) {
    // 下弯
    ctx.moveTo(-r * 0.2, mouthY + r * 0.05);
    ctx.quadraticCurveTo(0, mouthY - r * 0.08, r * 0.2, mouthY + r * 0.05);
    ctx.stroke();
  } else {
    // normal - 小横线
    ctx.moveTo(-r * 0.15, mouthY);
    ctx.lineTo(r * 0.15, mouthY);
    ctx.stroke();
  }
}

/**
 * 腮红
 */
function drawCheeks(ctx, r) {
  ctx.beginPath();
  ctx.fillStyle = 'rgba(232, 113, 113, 0.45)';
  ctx.ellipse(-r * 0.55, r * 0.05, r * 0.12, r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.fillStyle = 'rgba(232, 113, 113, 0.45)';
  ctx.ellipse(r * 0.55, r * 0.05, r * 0.12, r * 0.07, 0, 0, Math.PI * 2);
  ctx.fill();
}

/**
 * 庆祝头顶小星
 */
function drawCelebrate(ctx, size) {
  const r = size * 0.4;
  const stars = [
    { x: -r * 0.7, y: -r * 1.0, s: 0.07, c: '#FFD700' },
    { x: 0, y: -r * 1.15, s: 0.09, c: '#FF6B6B' },
    { x: r * 0.7, y: -r * 1.0, s: 0.07, c: '#FFD700' }
  ];
  for (let i = 0; i < stars.length; i++) {
    const s = stars[i];
    ctx.beginPath();
    ctx.fillStyle = s.c;
    drawStar(ctx, s.x, s.y, size * s.s);
    ctx.fill();
  }
}

function drawStar(ctx, cx, cy, r) {
  const spikes = 5;
  const outerR = r;
  const innerR = r * 0.45;
  let rot = Math.PI / 2 * 3;
  const step = Math.PI / spikes;
  ctx.moveTo(cx, cy - outerR);
  for (let i = 0; i < spikes; i++) {
    ctx.lineTo(cx + Math.cos(rot) * outerR, cy + Math.sin(rot) * outerR);
    rot += step;
    ctx.lineTo(cx + Math.cos(rot) * innerR, cy + Math.sin(rot) * innerR);
    rot += step;
  }
  ctx.closePath();
}

/**
 * 担心模式：眉头上方加一道斜线
 */
function drawWorriedMark(ctx, size) {
  const r = size * 0.4;
  ctx.beginPath();
  ctx.strokeStyle = '#1A1A1A';
  ctx.lineWidth = Math.max(1.5, r * 0.05);
  ctx.lineCap = 'round';
  // 眉头
  ctx.moveTo(-r * 0.55, -r * 0.4);
  ctx.lineTo(-r * 0.2, -r * 0.3);
  ctx.stroke();
  ctx.moveTo(r * 0.55, -r * 0.4);
  ctx.lineTo(r * 0.2, -r * 0.3);
  ctx.stroke();
}

module.exports = {
  EXPRESSIONS,
  pickExpression,
  generateComment,
  // 互动计数
  getInteractionCount,
  incrementInteractionCount,
  resetInteractionCount,
  shouldShowGuideBubble,
  // 绘制
  drawBobo
};
