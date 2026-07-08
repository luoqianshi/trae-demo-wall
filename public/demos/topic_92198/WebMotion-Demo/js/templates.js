/**
 * WebMotion - 预设模板库
 * 每个模板包含 js, html, css 三部分代码
 * 用户代码 JS 部分接收参数: (ctx, t, width, height, utils)
 *   - ctx: Canvas 2D 上下文
 *   - t: 当前时间（秒，0 到 duration）
 *   - width / height: 画布尺寸
 *   - utils: 工具函数 { lerp, clamp, ease, map }
 */

const TEMPLATES = [
  {
    id: 'typewriter',
    icon: '⌨️',
    name: '打字机文字',
    desc: '逐字显示的文字动画，适合做标题和字幕',
    duration: 4,
    js: `// 打字机文字动画（增强版：辉光背景 + 平滑光标 + 装饰元素）
ctx.clearRect(0, 0, width, height);

const text = 'Hello WebMotion';
const charDuration = 0.08;
const visibleChars = Math.floor(t / charDuration);
const displayText = text.substring(0, visibleChars);

// 背景辉光区域
const glowAlpha = utils.clamp(visibleChars / text.length * 0.15, 0, 0.15);
const bgGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, 280);
bgGrad.addColorStop(0, \`rgba(201, 169, 110, \${glowAlpha})\`);
bgGrad.addColorStop(0.5, \`rgba(120, 80, 255, \${glowAlpha * 0.5})\`);
bgGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = bgGrad;
ctx.fillRect(0, 0, width, height);

// 装饰点（文字区域周围）
const dotCount = 8;
for (let i = 0; i < dotCount; i++) {
  const angle = (i / dotCount) * Math.PI * 2 + t * 0.3;
  const dotR = 180 + Math.sin(t * 2 + i) * 10;
  const dx = width / 2 + Math.cos(angle) * dotR;
  const dy = height / 2 + Math.sin(angle) * dotR;
  const dotAlpha = 0.15 + 0.1 * Math.sin(t * 3 + i * 0.8);
  ctx.fillStyle = \`rgba(201, 169, 110, \${dotAlpha})\`;
  ctx.beginPath();
  ctx.arc(dx, dy, 2.5, 0, Math.PI * 2);
  ctx.fill();
}

// 装饰线（文字区域上下）
const lineW = utils.clamp(visibleChars / text.length, 0, 1) * 200;
const lineAlpha = 0.2 + 0.1 * Math.sin(t * 2);
ctx.strokeStyle = \`rgba(201, 169, 110, \${lineAlpha})\`;
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(width/2 - lineW/2, height/2 - 55);
ctx.lineTo(width/2 + lineW/2, height/2 - 55);
ctx.stroke();
ctx.beginPath();
ctx.moveTo(width/2 - lineW/2, height/2 + 55);
ctx.lineTo(width/2 + lineW/2, height/2 + 55);
ctx.stroke();

// 注册可编辑的文字元素（带辉光阴影）
const titleEl = utils.registerElement('text', {
  id: 'title',
  x: width / 2 - 300, y: height / 2 - 40, w: 600, h: 80,
  text: displayText,
  fontSize: 64, color: '#ffffff', fontWeight: 'bold',
  textAlign: 'center',
  animIn: 'fade', animInDuration: 0.2
});

// 文字辉光层
ctx.save();
ctx.shadowColor = 'rgba(201, 169, 110, 0.6)';
ctx.shadowBlur = 20;
titleEl.draw(ctx);
ctx.restore();

// 光标：平滑闪烁 + 渐变淡出
if (visibleChars < text.length) {
  const blinkPhase = (t * 2.5) % (Math.PI * 2);
  const cursorAlpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.cos(blinkPhase));

  ctx.font = 'bold 64px sans-serif';
  const fullWidth = ctx.measureText(text).width;
  const visibleWidth = ctx.measureText(displayText).width;
  const textStartX = titleEl.x + titleEl.w / 2 - fullWidth / 2;
  const cursorX = textStartX + visibleWidth + 4;
  const cursorY = titleEl.y + titleEl.h / 2 - 28;

  // 光标渐变（顶部到底部淡出）
  const cursorGrad = ctx.createLinearGradient(cursorX, cursorY, cursorX, cursorY + 56);
  cursorGrad.addColorStop(0, \`rgba(201, 169, 110, \${cursorAlpha})\`);
  cursorGrad.addColorStop(0.5, \`rgba(201, 169, 110, \${cursorAlpha * 0.9})\`);
  cursorGrad.addColorStop(1, \`rgba(201, 169, 110, \${cursorAlpha * 0.2})\`);
  ctx.fillStyle = cursorGrad;

  // 光标辉光
  ctx.shadowColor = 'rgba(201, 169, 110, 0.8)';
  ctx.shadowBlur = 12 * cursorAlpha;
  ctx.fillRect(cursorX, cursorY, 4, 56);
  ctx.shadowBlur = 0;
}`,
    html: '',
    css: ''
  },
  {
    id: 'bounce-text',
    icon: '🏀',
    name: '弹跳文字',
    desc: '文字从上方弹跳落入画面，带有缩放效果',
    duration: 2.5,
    js: `// 弹跳文字动画（增强版：粒子爆发 + 辉光拖尾 + 阴影 + 装饰环）
ctx.clearRect(0, 0, width, height);

const text = 'WebMotion';
const fps = 30;
const frame = t * fps;

const springProgress = utils.spring(frame, fps, utils.springPresets.bouncy);

const y = utils.lerp(-100, height / 2 - 40, springProgress);
const scale = 0.5 + 0.5 * springProgress;

// 辉光拖尾（弹跳过程中）
if (springProgress < 0.95) {
  const trailCount = 5;
  for (let i = 0; i < trailCount; i++) {
    const trailT = Math.max(0, t - i * 0.03);
    const trailFrame = trailT * fps;
    const trailSpring = utils.spring(trailFrame, fps, utils.springPresets.bouncy);
    const trailY = utils.lerp(-100, height / 2 - 40, trailSpring);
    const trailAlpha = (1 - i / trailCount) * 0.15;
    const trailScale = 0.5 + 0.5 * trailSpring;
    ctx.save();
    ctx.globalAlpha = trailAlpha;
    ctx.shadowColor = 'rgba(201, 169, 110, 0.5)';
    ctx.shadowBlur = 20;
    ctx.font = \`bold \${Math.round(72 * trailScale)}px sans-serif\`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillStyle = '#c9a96e';
    ctx.fillText(text, width / 2, trailY);
    ctx.restore();
  }
}

// 着陆粒子爆发（接近落地时）
if (springProgress > 0.85 && springProgress < 1.1) {
  const burstPhase = (springProgress - 0.85) / 0.25;
  const burstAlpha = 1 - burstPhase;
  const burstCount = 12;
  for (let i = 0; i < burstCount; i++) {
    const angle = (i / burstCount) * Math.PI * 2;
    const dist = burstPhase * 60;
    const px = width / 2 + Math.cos(angle) * dist;
    const py = y + 40 + Math.sin(angle) * dist * 0.5;
    ctx.fillStyle = \`rgba(201, 169, 110, \${burstAlpha * 0.6})\`;
    ctx.beginPath();
    ctx.arc(px, py, 3 * (1 - burstPhase), 0, Math.PI * 2);
    ctx.fill();
  }
}

// 文字下方阴影（深度感）
const shadowAlpha = utils.clamp(springProgress, 0, 1) * 0.3;
const shadowY = height / 2 + 20;
const shadowScale = 0.8 + 0.2 * springProgress;
ctx.save();
ctx.globalAlpha = shadowAlpha;
ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
ctx.beginPath();
ctx.ellipse(width / 2, shadowY, 180 * shadowScale, 8, 0, 0, Math.PI * 2);
ctx.fill();
ctx.restore();

// 装饰环
if (springProgress > 0.7) {
  const ringAlpha = (springProgress - 0.7) / 0.3 * 0.3;
  const ringScale = 1 + Math.sin(t * 3) * 0.05;
  ctx.strokeStyle = \`rgba(201, 169, 110, \${ringAlpha})\`;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.arc(width / 2, y + 40, 160 * ringScale, 0, Math.PI * 2);
  ctx.stroke();
}

// 注册可编辑的文字元素
const titleEl = utils.registerElement('text', {
  id: 'title',
  x: width / 2 - 250, y: y, w: 500, h: 80,
  text: text,
  fontSize: Math.round(72 * scale), color: '#ffffff', fontWeight: 'bold',
  animIn: 'bounce', animInDuration: 2
});

// 文字辉光
ctx.save();
ctx.shadowColor = 'rgba(201, 169, 110, 0.4)';
ctx.shadowBlur = 15;
titleEl.draw(ctx);
ctx.restore();`,
    html: '',
    css: ''
  },
  {
    id: 'bar-chart',
    icon: '📊',
    name: '数据柱状图',
    desc: '柱状图从底部生长的动画，适合数据展示',
    duration: 3,
    js: `// 数据柱状图（增强版：圆角柱 + 渐变填充 + 网格线 + 辉光 + 动态标签 + 阴影）
const data = [
  { label: '1月', value: 65 },
  { label: '2月', value: 80 },
  { label: '3月', value: 92 },
  { label: '4月', value: 73 },
  { label: '5月', value: 85 },
  { label: '6月', value: 100 },
];
const baseColors = ['#c9a96e', '#00b8d9', '#fb7185', '#ff8c42', '#22c55e', '#a78bfa'];

const padding = 80;
const chartW = width - padding * 2;
const chartH = height - padding * 2 - 40;
const barW = chartW / data.length * 0.6;
const barGap = chartW / data.length * 0.4;

ctx.clearRect(0, 0, width, height);

// 背景网格线
const gridLines = 5;
for (let g = 1; g <= gridLines; g++) {
  const gy = height - padding - (chartH / gridLines) * g;
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(padding, gy);
  ctx.lineTo(width - padding, gy);
  ctx.stroke();
}

// 基线
ctx.strokeStyle = 'rgba(255,255,255,0.12)';
ctx.lineWidth = 1;
ctx.beginPath();
ctx.moveTo(padding, height - padding);
ctx.lineTo(width - padding, height - padding);
ctx.stroke();

data.forEach((d, i) => {
  const delay = i * 0.15;
  const progress = utils.clamp((t - delay) / 0.8, 0, 1);
  const eased = utils.ease.outCubic(progress);
  const barH = (d.value / 100) * chartH * eased;
  const x = padding + i * (barW + barGap) + barGap / 2;
  const y = height - padding - barH;

  // 柱子阴影
  if (barH > 2) {
    ctx.save();
    ctx.globalAlpha = 0.15 * eased;
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.ellipse(x + barW / 2, height - padding + 4, barW / 2 + 4, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // 渐变填充 + 圆角顶部（使用 arcTo）
  if (barH > 2) {
    const grad = ctx.createLinearGradient(x, y, x, height - padding);
    grad.addColorStop(0, baseColors[i]);
    grad.addColorStop(0.6, baseColors[i]);
    grad.addColorStop(1, baseColors[i] + '66');

    // 辉光层
    ctx.save();
    ctx.shadowColor = baseColors[i];
    ctx.shadowBlur = 12 * eased;
    ctx.fillStyle = grad;

    // 圆角顶部矩形
    const r = Math.min(8, barW / 2, barH / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + barW, y, x + barW, y + barH, r);
    ctx.arcTo(x + barW, height - padding, x, height - padding, 0);
    ctx.arcTo(x, height - padding, x, y, 0);
    ctx.arcTo(x, y, x + barW, y, r);
    ctx.closePath();
    ctx.fill();
    ctx.restore();

    // 高光条（柱子左侧）
    ctx.save();
    ctx.globalAlpha = 0.15;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(x + 2, y + r, 3, barH - r);
    ctx.restore();
  }

  // 数值标签（更好的缓动）
  if (progress > 0.3) {
    const valProgress = utils.clamp((progress - 0.3) / 0.5, 0, 1);
    const valEased = utils.ease.outBack(valProgress);
    const valEl = utils.registerElement('text', {
      id: 'val_' + i,
      x: x + barW / 2 - 30, y: y - 30 - (1 - valEased) * 15, w: 60, h: 24,
      text: String(d.value), fontSize: 16, color: '#ffffff',
      animIn: 'fade', animInDuration: 0.3, animInDelay: delay + 0.4
    });
    ctx.save();
    ctx.globalAlpha = valEased;
    ctx.shadowColor = baseColors[i];
    ctx.shadowBlur = 8;
    valEl.draw(ctx);
    ctx.restore();
  }

  // 月份标签
  const labelEl = utils.registerElement('text', {
    id: 'label_' + i,
    x: x + barW / 2 - 40, y: height - padding + 10, w: 80, h: 24,
    text: d.label, fontSize: 14, color: 'rgba(255,255,255,0.6)',
    animIn: 'fade', animInDuration: 0.3
  });
  labelEl.draw(ctx);
});`,
    html: '',
    css: ''
  },
  {
    id: 'particles',
    icon: '✨',
    name: '粒子汇聚',
    desc: '粒子从随机位置汇聚成圆形',
    duration: 3,
    js: `// 粒子汇聚动画（增强版：HSL色彩和谐 + 辉光 + 渐变连线 + 中心光球 + 多形状粒子）
const particleCount = 80;
const radius = Math.min(width, height) * 0.25;

ctx.clearRect(0, 0, width, height);

const progress = utils.clamp(t / 2.5, 0, 1);
const eased = utils.ease.inOutCubic(progress);

// 中心辉光球
const orbAlpha = eased * 0.25;
const orbGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, radius * 1.2);
orbGrad.addColorStop(0, \`rgba(201, 169, 110, \${orbAlpha})\`);
orbGrad.addColorStop(0.4, \`rgba(120, 80, 255, \${orbAlpha * 0.5})\`);
orbGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = orbGrad;
ctx.fillRect(0, 0, width, height);

// 中心脉动核心
const corePulse = 0.5 + 0.5 * Math.sin(t * 4);
const coreR = 8 + corePulse * 6;
const coreGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, coreR);
coreGrad.addColorStop(0, \`rgba(255, 255, 255, \${eased * 0.8})\`);
coreGrad.addColorStop(0.5, \`rgba(201, 169, 110, \${eased * 0.4})\`);
coreGrad.addColorStop(1, 'rgba(201, 169, 110, 0)');
ctx.fillStyle = coreGrad;
ctx.beginPath();
ctx.arc(width/2, height/2, coreR, 0, Math.PI * 2);
ctx.fill();

for (let i = 0; i < particleCount; i++) {
  const angle = (i / particleCount) * Math.PI * 2;
  const tx = width / 2 + Math.cos(angle) * radius;
  const ty = height / 2 + Math.sin(angle) * radius;
  const seed = i * 12.9898;
  const sx = width / 2 + Math.sin(seed) * width * 0.4;
  const sy = height / 2 + Math.cos(seed * 1.3) * height * 0.4;

  const x = utils.lerp(sx, tx, eased);
  const y = utils.lerp(sy, ty, eased);
  const size = utils.lerp(1, 4, eased);
  const alpha = utils.lerp(0.3, 1, eased);

  // HSL 色彩和谐（180-270 范围，青蓝紫）
  const hue = 180 + (i / particleCount) * 90;
  const lightness = 55 + Math.sin(i * 0.5 + t) * 10;
  const color = \`hsl(\${hue}, 80%, \${lightness}%)\`;

  // 粒子辉光
  ctx.save();
  ctx.shadowColor = \`hsla(\${hue}, 90%, 60%, \${alpha * 0.8})\`;
  ctx.shadowBlur = 10;
  ctx.fillStyle = \`hsla(\${hue}, 80%, \${lightness}%, \${alpha})\`;

  // 多形状：部分粒子用菱形/星形
  if (i % 5 === 0) {
    // 星形粒子
    const spikes = 4;
    const outerR = size * 1.5;
    const innerR = size * 0.6;
    ctx.beginPath();
    for (let s = 0; s < spikes * 2; s++) {
      const r2 = s % 2 === 0 ? outerR : innerR;
      const a = (s / (spikes * 2)) * Math.PI * 2 - Math.PI / 2;
      if (s === 0) ctx.moveTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
      else ctx.lineTo(x + Math.cos(a) * r2, y + Math.sin(a) * r2);
    }
    ctx.closePath();
    ctx.fill();
  } else if (i % 7 === 0) {
    // 菱形粒子
    ctx.beginPath();
    ctx.moveTo(x, y - size * 1.2);
    ctx.lineTo(x + size * 0.8, y);
    ctx.lineTo(x, y + size * 1.2);
    ctx.lineTo(x - size * 0.8, y);
    ctx.closePath();
    ctx.fill();
  } else {
    // 圆形粒子（带辉光）
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // 连线（渐变透明度）
  if (eased > 0.6) {
    const lineAlpha = (eased - 0.6) / 0.4;
    const nextI = (i + 1) % particleCount;
    const na = (nextI / particleCount) * Math.PI * 2;
    const nx = width / 2 + Math.cos(na) * radius;
    const ny = height / 2 + Math.sin(na) * radius;

    // 渐变连线
    const lineGrad = ctx.createLinearGradient(x, y, nx, ny);
    lineGrad.addColorStop(0, \`hsla(\${hue}, 80%, 60%, \${lineAlpha * 0.4})\`);
    lineGrad.addColorStop(0.5, \`hsla(\${hue + 30}, 80%, 60%, \${lineAlpha * 0.6})\`);
    lineGrad.addColorStop(1, \`hsla(\${hue + 60}, 80%, 60%, \${lineAlpha * 0.4})\`);
    ctx.strokeStyle = lineGrad;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(nx, ny);
    ctx.stroke();
  }
}`,
    html: '',
    css: ''
  },
  {
    id: 'gradient-text',
    icon: '🌈',
    name: '渐变文字滑入',
    desc: '带渐变色彩的文字从左侧滑入',
    duration: 2,
    js: `// 渐变文字滑入（增强版：背景光球 + 多色停渐变 + 辉光 + 装饰线 + 闪光粒子）
const text = '用代码做视频';
const progress = utils.clamp(t / 1.5, 0, 1);
const eased = utils.ease.outCubic(progress);

ctx.clearRect(0, 0, width, height);

// 背景光球
const orbAlpha = eased * 0.12;
const orb1 = ctx.createRadialGradient(width/2 - 100, height/2, 0, width/2 - 100, height/2, 200);
orb1.addColorStop(0, \`rgba(201, 169, 110, \${orbAlpha})\`);
orb1.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = orb1;
ctx.fillRect(0, 0, width, height);

const orb2 = ctx.createRadialGradient(width/2 + 100, height/2, 0, width/2 + 100, height/2, 200);
orb2.addColorStop(0, \`rgba(251, 113, 133, \${orbAlpha})\`);
orb2.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = orb2;
ctx.fillRect(0, 0, width, height);

const orb3 = ctx.createRadialGradient(width/2, height/2 - 60, 0, width/2, height/2 - 60, 150);
orb3.addColorStop(0, \`rgba(167, 139, 250, \${orbAlpha * 0.8})\`);
orb3.addColorStop(1, 'rgba(0, 0, 0, 0)');
ctx.fillStyle = orb3;
ctx.fillRect(0, 0, width, height);

ctx.save();
ctx.globalAlpha = eased;

const offsetX = utils.lerp(-200, 0, eased);

ctx.font = 'bold 56px sans-serif';
ctx.textAlign = 'center';
ctx.textBaseline = 'middle';

// 多色停渐变
const grad = ctx.createLinearGradient(
  width / 2 - 250 + offsetX, 0,
  width / 2 + 250 + offsetX, 0
);
grad.addColorStop(0, '#c9a96e');
grad.addColorStop(0.2, '#00e5c8');
grad.addColorStop(0.4, '#a78bfa');
grad.addColorStop(0.6, '#ff6b9d');
grad.addColorStop(0.8, '#fb7185');
grad.addColorStop(1, '#ffcc00');

// 文字辉光
ctx.shadowColor = 'rgba(201, 169, 110, 0.5)';
ctx.shadowBlur = 25;
ctx.fillStyle = grad;
ctx.fillText(text, width / 2 + offsetX, height / 2);
ctx.shadowBlur = 0;

// 副标题
ctx.font = '20px sans-serif';
ctx.fillStyle = 'rgba(255,255,255,0.5)';
ctx.fillText('WebMotion', width / 2 + offsetX, height / 2 + 50);

ctx.restore();

// 装饰线（上方）
if (eased > 0.5) {
  const lineProgress = (eased - 0.5) / 0.5;
  const lineW = lineProgress * 160;
  const lineAlpha = lineProgress * 0.3;
  ctx.strokeStyle = \`rgba(201, 169, 110, \${lineAlpha})\`;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(width/2 - lineW/2 + offsetX, height/2 - 50);
  ctx.lineTo(width/2 + lineW/2 + offsetX, height/2 - 50);
  ctx.stroke();

  // 装饰线（下方）
  ctx.strokeStyle = \`rgba(251, 113, 133, \${lineAlpha})\`;
  ctx.beginPath();
  ctx.moveTo(width/2 - lineW/2 + offsetX, height/2 + 70);
  ctx.lineTo(width/2 + lineW/2 + offsetX, height/2 + 70);
  ctx.stroke();
}

// 闪光粒子
if (eased > 0.6) {
  const sparkleCount = 10;
  for (let i = 0; i < sparkleCount; i++) {
    const seed = i * 7.321;
    const sx = width/2 + Math.sin(seed) * 220 + offsetX;
    const sy = height/2 + Math.cos(seed * 1.7) * 50;
    const sparkleAlpha = (eased - 0.6) / 0.4 * (0.3 + 0.7 * Math.abs(Math.sin(t * 5 + i)));
    const sparkleSize = 2 + Math.sin(t * 4 + i * 2) * 1.5;
    ctx.save();
    ctx.globalAlpha = sparkleAlpha;
    ctx.shadowColor = '#ffffff';
    ctx.shadowBlur = 6;
    ctx.fillStyle = '#ffffff';
    // 十字闪光
    ctx.fillRect(sx - sparkleSize, sy - 0.5, sparkleSize * 2, 1);
    ctx.fillRect(sx - 0.5, sy - sparkleSize, 1, sparkleSize * 2);
    ctx.restore();
  }
}`,
    html: '',
    css: ''
  },
  {
    id: 'circle-burst',
    icon: '💥',
    name: '圆形爆破转场',
    desc: '圆形扩散的转场效果，适合场景切换',
    duration: 1.5,
    js: `// 圆形爆破转场（增强版：多层环 + 边缘粒子 + 多色停渐变 + 辉光 + 脉动核心）
const progress = utils.clamp(t / 1.2, 0, 1);
const eased = utils.ease.outQuart(progress);

ctx.clearRect(0, 0, width, height);

const maxRadius = Math.sqrt(width * width + height * height) / 2;
const radius = maxRadius * eased;

// 多层环（不同速度）
for (let ring = 0; ring < 3; ring++) {
  const ringSpeed = 1 - ring * 0.15;
  const ringRadius = maxRadius * utils.clamp(progress * ringSpeed, 0, 1);
  const ringAlpha = (1 - ring * 0.3) * 0.4 * (1 - progress * 0.5);
  ctx.strokeStyle = \`rgba(201, 169, 110, \${ringAlpha})\`;
  ctx.lineWidth = 2 - ring * 0.5;
  ctx.beginPath();
  ctx.arc(width / 2, height / 2, ringRadius, 0, Math.PI * 2);
  ctx.stroke();
}

// 主圆（多色停渐变 + 辉光）
ctx.save();
ctx.shadowColor = 'rgba(201, 169, 110, 0.6)';
ctx.shadowBlur = 30;
const grad = ctx.createRadialGradient(
  width / 2, height / 2, 0,
  width / 2, height / 2, radius
);
grad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
grad.addColorStop(0.15, 'rgba(201, 169, 110, 0.9)');
grad.addColorStop(0.4, 'rgba(120, 80, 255, 0.6)');
grad.addColorStop(0.7, 'rgba(201, 169, 110, 0.3)');
grad.addColorStop(1, 'rgba(201, 169, 110, 0)');
ctx.fillStyle = grad;
ctx.beginPath();
ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2);
ctx.fill();
ctx.restore();

// 环形边框（渐变）
const ringGrad = ctx.createLinearGradient(
  width/2 - radius, height/2,
  width/2 + radius, height/2
);
ringGrad.addColorStop(0, 'rgba(251, 113, 133, 0.9)');
ringGrad.addColorStop(0.5, 'rgba(255, 204, 0, 0.9)');
ringGrad.addColorStop(1, 'rgba(251, 113, 133, 0.9)');
ctx.strokeStyle = ringGrad;
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(width / 2, height / 2, radius * 0.95, 0, Math.PI * 2);
ctx.stroke();

// 边缘粒子爆发
if (eased > 0.1 && eased < 1) {
  const edgeCount = 20;
  for (let i = 0; i < edgeCount; i++) {
    const angle = (i / edgeCount) * Math.PI * 2 + t * 2;
    const edgeR = radius * (0.9 + Math.sin(t * 8 + i * 3) * 0.1);
    const px = width/2 + Math.cos(angle) * edgeR;
    const py = height/2 + Math.sin(angle) * edgeR;
    const pAlpha = (1 - Math.abs(eased - 0.5) * 2) * 0.7;
    const pSize = 2 + Math.sin(t * 6 + i) * 1;
    ctx.save();
    ctx.shadowColor = 'rgba(255, 204, 0, 0.8)';
    ctx.shadowBlur = 8;
    ctx.fillStyle = \`rgba(255, 204, 0, \${pAlpha})\`;
    ctx.beginPath();
    ctx.arc(px, py, pSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 中心脉动核心
const corePulse = 0.5 + 0.5 * Math.sin(t * 6);
const coreR = 15 + corePulse * 8;
const coreGrad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, coreR);
coreGrad.addColorStop(0, 'rgba(255, 255, 255, 0.9)');
coreGrad.addColorStop(0.4, 'rgba(201, 169, 110, 0.5)');
coreGrad.addColorStop(1, 'rgba(201, 169, 110, 0)');
ctx.fillStyle = coreGrad;
ctx.beginPath();
ctx.arc(width/2, height/2, coreR, 0, Math.PI * 2);
ctx.fill();

// 中心文字
if (eased > 0.5) {
  const textAlpha = (eased - 0.5) * 2;
  ctx.globalAlpha = textAlpha;
  ctx.save();
  ctx.shadowColor = 'rgba(255, 255, 255, 0.8)';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('WebMotion', width / 2, height / 2);
  ctx.restore();
  ctx.globalAlpha = 1;
}`,
    html: '',
    css: ''
  },

  // ===== 3D 模板 =====
  {
    id: '3d-cube',
    icon: '🎲',
    name: '3D 旋转立方体',
    desc: '彩色立方体在 3D 空间中旋转，展示 3D 效果',
    duration: 4,
    is3D: true,
    js: `// 3D 旋转立方体（增强版：多光源 + 环境粒子 + 更好材质 + 动态相机 + 弹簧入场）
// 接收参数: (THREE, scene, camera, width, height, utils)

// 创建立方体
const geo = new THREE.BoxGeometry(1.5, 1.5, 1.5);
const materials = [
  new THREE.MeshPhongMaterial({ color: 0xc9a96e, transparent: true, opacity: 0.9, shininess: 100, specular: 0x444444 }),
  new THREE.MeshPhongMaterial({ color: 0xfb7185, transparent: true, opacity: 0.9, shininess: 100, specular: 0x444444 }),
  new THREE.MeshPhongMaterial({ color: 0x00ff88, transparent: true, opacity: 0.9, shininess: 100, specular: 0x444444 }),
  new THREE.MeshPhongMaterial({ color: 0xff0066, transparent: true, opacity: 0.9, shininess: 100, specular: 0x444444 }),
  new THREE.MeshPhongMaterial({ color: 0xffcc00, transparent: true, opacity: 0.9, shininess: 100, specular: 0x444444 }),
  new THREE.MeshPhongMaterial({ color: 0x9966ff, transparent: true, opacity: 0.9, shininess: 100, specular: 0x444444 })
];
const cube = new THREE.Mesh(geo, materials);
scene.add(cube);

// 添加边线
const edges = new THREE.EdgesGeometry(geo);
const line = new THREE.LineSegments(edges, new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2, transparent: true, opacity: 0.6 }));
cube.add(line);

// 多光源设置
const ambient = new THREE.AmbientLight(0x404040, 1.5);
scene.add(ambient);

const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

const pointLight1 = new THREE.PointLight(0xc9a96e, 1, 10);
pointLight1.position.set(-3, 2, 2);
scene.add(pointLight1);

const pointLight2 = new THREE.PointLight(0xfb7185, 0.8, 10);
pointLight2.position.set(3, -2, -2);
scene.add(pointLight2);

const rimLight = new THREE.PointLight(0x9966ff, 0.6, 8);
rimLight.position.set(0, 0, -4);
scene.add(rimLight);

// 环境粒子
const envParticleCount = 100;
const envPositions = new Float32Array(envParticleCount * 3);
for (let i = 0; i < envParticleCount; i++) {
  envPositions[i * 3] = (Math.random() - 0.5) * 10;
  envPositions[i * 3 + 1] = (Math.random() - 0.5) * 10;
  envPositions[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
const envGeo = new THREE.BufferGeometry();
envGeo.setAttribute('position', new THREE.BufferAttribute(envPositions, 3));
const envMat = new THREE.PointsMaterial({ color: 0xc9a96e, size: 0.03, transparent: true, opacity: 0.4, blending: THREE.AdditiveBlending });
const envParticles = new THREE.Points(envGeo, envMat);
scene.add(envParticles);

camera.position.z = 4;

// 弹簧入场动画
return function(t) {
  const fps = 30;
  const frame = t * fps;
  const intro = utils.spring(frame, fps, utils.springPresets.bouncy);
  cube.scale.set(intro, intro, intro);

  cube.rotation.x = t * 0.5;
  cube.rotation.y = t * 0.8;

  cube.position.y = Math.sin(t * 2) * 0.2;

  // 动态相机运动
  camera.position.x = Math.sin(t * 0.3) * 0.5;
  camera.position.y = Math.cos(t * 0.4) * 0.3;
  camera.lookAt(0, 0, 0);

  // 彩色光源旋转
  pointLight1.position.x = Math.sin(t * 0.7) * 3;
  pointLight1.position.z = Math.cos(t * 0.7) * 3;
  pointLight2.position.x = Math.cos(t * 0.5) * 3;
  pointLight2.position.z = Math.sin(t * 0.5) * -3;

  // 环境粒子缓慢旋转
  envParticles.rotation.y = t * 0.05;
  envParticles.rotation.x = t * 0.03;
};`,
    html: '',
    css: ''
  },

  {
    id: '3d-particles',
    icon: '✨',
    name: '3D 粒子球',
    desc: '由粒子组成的球体，旋转时展现空间感',
    duration: 5,
    is3D: true,
    js: `// 3D 粒子球（增强版：多光源 + 环境雾 + 更好材质 + 动态相机 + 弹簧入场）
const particleCount = 2000;
const positions = new Float32Array(particleCount * 3);
const colors = new Float32Array(particleCount * 3);

for (let i = 0; i < particleCount; i++) {
  const phi = Math.acos(-1 + (2 * i) / particleCount);
  const theta = Math.sqrt(particleCount * Math.PI) * phi;
  const r = 1.5;
  positions[i * 3] = r * Math.cos(theta) * Math.sin(phi);
  positions[i * 3 + 1] = r * Math.sin(theta) * Math.sin(phi);
  positions[i * 3 + 2] = r * Math.cos(phi);

  const c = new THREE.Color();
  c.setHSL(i / particleCount, 0.8, 0.5);
  colors[i * 3] = c.r;
  colors[i * 3 + 1] = c.g;
  colors[i * 3 + 2] = c.b;
}

const geo = new THREE.BufferGeometry();
geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const mat = new THREE.PointsMaterial({
  size: 0.04,
  vertexColors: true,
  transparent: true,
  opacity: 0.85,
  blending: THREE.AdditiveBlending
});

const points = new THREE.Points(geo, mat);
scene.add(points);

// 多光源
const ambient = new THREE.AmbientLight(0x222244, 1);
scene.add(ambient);
const pointLight1 = new THREE.PointLight(0xc9a96e, 1.5, 8);
pointLight1.position.set(3, 2, 2);
scene.add(pointLight1);
const pointLight2 = new THREE.PointLight(0xfb7185, 1, 8);
pointLight2.position.set(-3, -1, -2);
scene.add(pointLight2);

// 环境雾
scene.fog = new THREE.FogExp2(0x000011, 0.08);

// 环境粒子
const envCount = 300;
const envPos = new Float32Array(envCount * 3);
for (let i = 0; i < envCount; i++) {
  envPos[i * 3] = (Math.random() - 0.5) * 12;
  envPos[i * 3 + 1] = (Math.random() - 0.5) * 12;
  envPos[i * 3 + 2] = (Math.random() - 0.5) * 12;
}
const envGeo = new THREE.BufferGeometry();
envGeo.setAttribute('position', new THREE.BufferAttribute(envPos, 3));
const envMat = new THREE.PointsMaterial({ color: 0x4466ff, size: 0.02, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
const envParticles = new THREE.Points(envGeo, envMat);
scene.add(envParticles);

camera.position.z = 4;

return function(t) {
  // 弹簧入场
  const fps = 30;
  const frame = t * fps;
  const intro = utils.spring(frame, fps, utils.springPresets.gentle);
  points.scale.set(intro, intro, intro);

  points.rotation.y = t * 0.3;
  points.rotation.x = Math.sin(t * 0.5) * 0.3;

  const pulse = 1 + Math.sin(t * 3) * 0.05;
  points.scale.multiplyScalar(pulse);

  // 动态相机
  camera.position.x = Math.sin(t * 0.2) * 0.8;
  camera.position.y = Math.cos(t * 0.3) * 0.5;
  camera.lookAt(0, 0, 0);

  // 光源旋转
  pointLight1.position.x = Math.sin(t * 0.4) * 3;
  pointLight1.position.y = Math.cos(t * 0.6) * 2;
  pointLight2.position.x = Math.cos(t * 0.3) * 3;
  pointLight2.position.z = Math.sin(t * 0.5) * 3;

  envParticles.rotation.y = t * 0.02;
};`,
    html: '',
    css: ''
  },

  {
    id: '3d-wave',
    icon: '🌊',
    name: '3D 波浪平面',
    desc: '波浪起伏的 3D 平面，适合做背景效果',
    duration: 4,
    is3D: true,
    js: `// 3D 波浪平面（增强版：多光源 + 环境雾 + 更好材质 + 动态相机 + 弹簧入场）
const segs = 40;
const geo = new THREE.PlaneGeometry(6, 6, segs, segs);
const mat = new THREE.MeshPhongMaterial({
  color: 0xc9a96e,
  wireframe: false,
  flatShading: true,
  transparent: true,
  opacity: 0.9,
  side: THREE.DoubleSide,
  shininess: 80,
  specular: 0x336699
});
const plane = new THREE.Mesh(geo, mat);
plane.rotation.x = -Math.PI / 3;
scene.add(plane);

// 线框叠加
const wireMat = new THREE.MeshBasicMaterial({
  color: 0xffffff,
  wireframe: true,
  transparent: true,
  opacity: 0.15
});
const wireframe = new THREE.Mesh(geo, wireMat);
plane.add(wireframe);

// 多光源
const ambient = new THREE.AmbientLight(0x666688, 1);
scene.add(ambient);
const dirLight = new THREE.DirectionalLight(0xffffff, 1.2);
dirLight.position.set(2, 5, 3);
scene.add(dirLight);
const pointLight1 = new THREE.PointLight(0xc9a96e, 1, 10);
pointLight1.position.set(-2, 3, 1);
scene.add(pointLight1);
const pointLight2 = new THREE.PointLight(0xfb7185, 0.6, 8);
pointLight2.position.set(2, 1, -2);
scene.add(pointLight2);

// 环境雾
scene.fog = new THREE.FogExp2(0x000022, 0.06);

// 环境粒子
const envCount = 150;
const envPos = new Float32Array(envCount * 3);
for (let i = 0; i < envCount; i++) {
  envPos[i * 3] = (Math.random() - 0.5) * 10;
  envPos[i * 3 + 1] = Math.random() * 5;
  envPos[i * 3 + 2] = (Math.random() - 0.5) * 10;
}
const envGeo = new THREE.BufferGeometry();
envGeo.setAttribute('position', new THREE.BufferAttribute(envPos, 3));
const envMat = new THREE.PointsMaterial({ color: 0xc9a96e, size: 0.025, transparent: true, opacity: 0.3, blending: THREE.AdditiveBlending });
const envParticles = new THREE.Points(envGeo, envMat);
scene.add(envParticles);

camera.position.set(0, 3, 4);
camera.lookAt(0, 0, 0);

const positions = geo.attributes.position;

return function(t) {
  // 弹簧入场
  const fps = 30;
  const frame = t * fps;
  const intro = utils.spring(frame, fps, utils.springPresets.gentle);
  plane.material.opacity = intro * 0.9;
  wireframe.material.opacity = intro * 0.15;

  // 波浪动画
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const y = positions.getY(i);
    const z = Math.sin(x * 1.5 + t * 2) * 0.3 + Math.cos(y * 1.5 + t * 1.5) * 0.3;
    positions.setZ(i, z);
  }
  positions.needsUpdate = true;
  geo.computeVertexNormals();

  plane.rotation.z = t * 0.1;

  // 动态相机
  camera.position.x = Math.sin(t * 0.15) * 1;
  camera.position.z = 4 + Math.cos(t * 0.2) * 0.5;
  camera.lookAt(0, 0, 0);

  // 光源动画
  pointLight1.position.x = Math.sin(t * 0.3) * 3;
  pointLight1.position.z = Math.cos(t * 0.4) * 2;
  pointLight2.position.x = Math.cos(t * 0.25) * 3;
  pointLight2.position.z = Math.sin(t * 0.35) * 2;

  envParticles.rotation.y = t * 0.03;
};`,
    html: '',
    css: ''
  },

  // ===== 语义转场模板（关联原则） =====
  {
    id: 'transition-zoom',
    icon: '🔍',
    name: '深入细节（缩放转场）',
    desc: '镜头拉近的缩放转场，适合从总览切换到细节',
    duration: 1.5,
    js: `// 深入细节 — 缩放转场（增强版：粒子效果 + 更好渐变 + 辉光 + 平滑缓动）
const progress = utils.clamp(t / 1.2, 0, 1);
const eased = utils.ease.inOutQuart(progress);

ctx.clearRect(0, 0, width, height);

const maxR = Math.sqrt(width * width + height * height) / 2;
const r = maxR * eased;

// 辉光效果
ctx.save();
ctx.shadowColor = 'rgba(201, 169, 110, 0.4)';
ctx.shadowBlur = 20;

ctx.beginPath();
ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
ctx.clip();

// 多色停渐变背景
const grad = ctx.createRadialGradient(width/2, height/2, 0, width/2, height/2, r);
grad.addColorStop(0, 'rgba(201, 169, 110, 0.2)');
grad.addColorStop(0.4, 'rgba(120, 80, 255, 0.1)');
grad.addColorStop(0.8, 'rgba(201, 169, 110, 0.05)');
grad.addColorStop(1, 'rgba(201, 169, 110, 0)');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, width, height);

// 中心文字
if (eased > 0.4) {
  ctx.globalAlpha = (eased - 0.4) / 0.6;
  ctx.font = 'bold 42px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('深入细节', width / 2, height / 2);
}
ctx.restore();

// 边框光圈（渐变）
const ringGrad = ctx.createLinearGradient(width/2 - r, height/2, width/2 + r, height/2);
ringGrad.addColorStop(0, 'rgba(201, 169, 110, 0.8)');
ringGrad.addColorStop(0.5, 'rgba(120, 80, 255, 0.8)');
ringGrad.addColorStop(1, 'rgba(201, 169, 110, 0.8)');
ctx.strokeStyle = ringGrad;
ctx.lineWidth = 3;
ctx.beginPath();
ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
ctx.stroke();

// 边缘粒子
if (eased > 0.1 && eased < 0.95) {
  const pCount = 16;
  for (let i = 0; i < pCount; i++) {
    const angle = (i / pCount) * Math.PI * 2 + t * 3;
    const pr = r + Math.sin(t * 5 + i * 2) * 5;
    const px = width/2 + Math.cos(angle) * pr;
    const py = height/2 + Math.sin(angle) * pr;
    const pAlpha = 0.6 * (1 - Math.abs(eased - 0.5) * 2);
    ctx.fillStyle = \`rgba(201, 169, 110, \${pAlpha})\`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }
}`,
    html: '',
    css: ''
  },
  {
    id: 'transition-line',
    icon: '➡️',
    name: '顺着思路（线条引导）',
    desc: '画一条线连接到下个场景，适合逻辑递进',
    duration: 1.5,
    js: `// 顺着思路 — 线条引导转场（增强版：粒子 + 渐变 + 辉光 + 平滑缓动）
const progress = utils.clamp(t / 1.2, 0, 1);
const eased = utils.ease.inOutCubic(progress);

ctx.clearRect(0, 0, width, height);

const startX = width * 0.15;
const endX = width * 0.85;
const y = height / 2;
const lineLen = (endX - startX) * eased;

// 线条辉光
ctx.save();
ctx.shadowColor = 'rgba(201, 169, 110, 0.5)';
ctx.shadowBlur = 15;

// 渐变线条
const lineGrad = ctx.createLinearGradient(startX, 0, startX + lineLen, 0);
lineGrad.addColorStop(0, '#c9a96e');
lineGrad.addColorStop(0.5, '#a78bfa');
lineGrad.addColorStop(1, '#c9a96e');
ctx.strokeStyle = lineGrad;
ctx.lineWidth = 4;
ctx.lineCap = 'round';
ctx.beginPath();
ctx.moveTo(startX, y);
ctx.lineTo(startX + lineLen, y);
ctx.stroke();
ctx.restore();

// 起点圆点（带辉光）
ctx.save();
ctx.shadowColor = 'rgba(201, 169, 110, 0.8)';
ctx.shadowBlur = 12;
ctx.fillStyle = '#c9a96e';
ctx.beginPath();
ctx.arc(startX, y, 8, 0, Math.PI * 2);
ctx.fill();
ctx.restore();

// 终点箭头
if (eased > 0.85) {
  const arrowAlpha = (eased - 0.85) / 0.15;
  ctx.save();
  ctx.globalAlpha = arrowAlpha;
  ctx.shadowColor = 'rgba(201, 169, 110, 0.6)';
  ctx.shadowBlur = 10;
  ctx.fillStyle = '#c9a96e';
  ctx.beginPath();
  ctx.moveTo(endX + 10, y);
  ctx.lineTo(endX - 8, y - 8);
  ctx.lineTo(endX - 8, y + 8);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 线条上的粒子
if (eased > 0.1) {
  const particleCount = 8;
  for (let i = 0; i < particleCount; i++) {
    const pProgress = ((t * 2 + i * 0.15) % 1);
    const px = startX + lineLen * pProgress;
    const py = y + Math.sin(t * 6 + i * 2) * 8;
    const pAlpha = 0.5 * Math.sin(pProgress * Math.PI);
    ctx.fillStyle = \`rgba(167, 139, 250, \${pAlpha})\`;
    ctx.beginPath();
    ctx.arc(px, py, 2, 0, Math.PI * 2);
    ctx.fill();
  }
}

// 文字
if (eased > 0.5) {
  const textAlpha = utils.ease.outCubic((eased - 0.5) * 2);
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
  ctx.shadowBlur = 15;
  ctx.font = 'bold 36px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('下一步', width / 2, y - 40);
  ctx.restore();
}`,
    html: '',
    css: ''
  },
  {
    id: 'transition-mask',
    icon: '⭕',
    name: '切换章节（遮罩转场）',
    desc: '圆形展开的遮罩转场，适合章节切换',
    duration: 1.2,
    js: `// 切换章节 — 圆形展开遮罩（增强版：粒子 + 多色停渐变 + 辉光 + 平滑缓动）
const progress = utils.clamp(t / 1.0, 0, 1);
const eased = utils.ease.outQuart(progress);

ctx.clearRect(0, 0, width, height);

const maxR = Math.sqrt(width * width + height * height) / 2;
const r = maxR * eased;

// 外圈辉光
ctx.save();
ctx.shadowColor = 'rgba(251, 113, 133, 0.5)';
ctx.shadowBlur = 25;

// 多色停外圈渐变
const grad = ctx.createRadialGradient(width/2, height/2, r * 0.5, width/2, height/2, r);
grad.addColorStop(0, 'rgba(251, 113, 133, 0)');
grad.addColorStop(0.5, 'rgba(255, 140, 66, 0.15)');
grad.addColorStop(0.8, 'rgba(251, 113, 133, 0.3)');
grad.addColorStop(1, 'rgba(255, 80, 40, 0.8)');
ctx.fillStyle = grad;
ctx.fillRect(0, 0, width, height);
ctx.restore();

// 环形边框（渐变）
const ringGrad = ctx.createLinearGradient(width/2 - r, height/2, width/2 + r, height/2);
ringGrad.addColorStop(0, '#fb7185');
ringGrad.addColorStop(0.3, '#ffcc00');
ringGrad.addColorStop(0.7, '#fb7185');
ringGrad.addColorStop(1, '#ff8c42');
ctx.strokeStyle = ringGrad;
ctx.lineWidth = 4;
ctx.beginPath();
ctx.arc(width / 2, height / 2, r, 0, Math.PI * 2);
ctx.stroke();

// 边缘粒子
if (eased > 0.15 && eased < 0.95) {
  const pCount = 14;
  for (let i = 0; i < pCount; i++) {
    const angle = (i / pCount) * Math.PI * 2 + t * 4;
    const pr = r + Math.sin(t * 7 + i * 3) * 6;
    const px = width/2 + Math.cos(angle) * pr;
    const py = height/2 + Math.sin(angle) * pr;
    const pAlpha = 0.7 * (1 - Math.abs(eased - 0.5) * 2);
    ctx.save();
    ctx.shadowColor = 'rgba(255, 204, 0, 0.6)';
    ctx.shadowBlur = 6;
    ctx.fillStyle = \`rgba(255, 204, 0, \${pAlpha})\`;
    ctx.beginPath();
    ctx.arc(px, py, 2.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

// 中心章节标识
if (eased > 0.6) {
  const textAlpha = utils.ease.outCubic((eased - 0.6) / 0.4);
  ctx.save();
  ctx.globalAlpha = textAlpha;
  ctx.shadowColor = 'rgba(255, 255, 255, 0.6)';
  ctx.shadowBlur = 20;
  ctx.font = 'bold 48px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#ffffff';
  ctx.fillText('新章节', width / 2, height / 2);
  ctx.restore();
}`,
    html: '',
    css: ''
  }
];

// 导出模板
if (typeof module !== 'undefined' && module.exports) {
  module.exports = TEMPLATES;
}
