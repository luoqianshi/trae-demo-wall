/****************************
 * 见澄明H5 - 分享海报 Canvas 生成模块 (ES Module)
 * 750x1334px 海报: 品牌 + 雷达图 + 画像名 + 一句话 + 橙红日出星空背景
 ****************************/

import { PORTRAIT_DATA, PORTRAIT_ONE_LINER } from './report-data.js';

const POSTER_WIDTH = 750;
const POSTER_HEIGHT = 1334;

/** 统一橙红色主题 */
const THEME = {
  bgTop: '#FF6B35',
  bgMid: '#FF4D2E',
  bgBottom: '#8B1A1A',
  text: '#FFFFFF',
  sub: 'rgba(255,255,255,0.88)',
  ring: 'rgba(255,255,255,0.08)',
  star: 'rgba(255,255,255,0.6)',
  sunCore: '#FFD700',
  sunGlow: 'rgba(255,200,50,0.25)'
};

/** 绘制星空+日出背景 */
function drawSunriseStarBackground(ctx, w, h) {
  // 1. 主渐变：深红夜空 → 橙红 → 暗红
  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, '#1A0A2E');
  grad.addColorStop(0.25, '#4A1942');
  grad.addColorStop(0.45, '#C0392B');
  grad.addColorStop(0.6, '#FF6B35');
  grad.addColorStop(0.75, '#FF8C42');
  grad.addColorStop(0.9, '#C0392B');
  grad.addColorStop(1, '#8B1A1A');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  // 2. 星星（上半部分）
  const starSeed = 42;
  let rng = starSeed;
  function pseudoRandom() {
    rng = (rng * 16807 + 0) % 2147483647;
    return rng / 2147483647;
  }

  ctx.fillStyle = THEME.star;
  for (let i = 0; i < 60; i++) {
    const sx = pseudoRandom() * w;
    const sy = pseudoRandom() * h * 0.45;
    const sr = pseudoRandom() * 2.2 + 0.6;
    const alpha = pseudoRandom() * 0.5 + 0.3;
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(sx, sy, sr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  // 3. 几颗亮星（十字星）
  for (let i = 0; i < 5; i++) {
    const bx = pseudoRandom() * w;
    const by = pseudoRandom() * h * 0.3;
    const br = pseudoRandom() * 3 + 2;
    ctx.globalAlpha = 0.7;
    ctx.fillStyle = '#FFFFFF';
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
    // 十字光芒
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(bx - br * 3, by);
    ctx.lineTo(bx + br * 3, by);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(bx, by - br * 3);
    ctx.lineTo(bx, by + br * 3);
    ctx.stroke();
  }
  ctx.globalAlpha = 1;

  // 4. 太阳（日出位置，约在画面 55% 高度处）
  const sunX = w / 2;
  const sunY = h * 0.55;
  const sunR = 80;

  // 外层光晕
  const glowGrad = ctx.createRadialGradient(sunX, sunY, sunR * 0.5, sunX, sunY, sunR * 4);
  glowGrad.addColorStop(0, 'rgba(255,220,100,0.35)');
  glowGrad.addColorStop(0.3, 'rgba(255,180,50,0.15)');
  glowGrad.addColorStop(1, 'rgba(255,100,30,0)');
  ctx.fillStyle = glowGrad;
  ctx.fillRect(0, 0, w, h);

  // 太阳本体
  const sunGrad = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, sunR);
  sunGrad.addColorStop(0, '#FFFACD');
  sunGrad.addColorStop(0.5, '#FFD700');
  sunGrad.addColorStop(1, '#FF8C00');
  ctx.fillStyle = sunGrad;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunR, 0, Math.PI * 2);
  ctx.fill();

  // 5. 水平光线（从太阳发出的横向光带）
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < 8; i++) {
    const ly = sunY + (i - 4) * 12;
    const lw = w * (1 - Math.abs(i - 4) * 0.15);
    const lineGrad = ctx.createLinearGradient(0, ly, w, ly);
    lineGrad.addColorStop(0, 'rgba(255,200,50,0)');
    lineGrad.addColorStop(0.3, 'rgba(255,200,50,1)');
    lineGrad.addColorStop(0.5, 'rgba(255,220,100,1)');
    lineGrad.addColorStop(0.7, 'rgba(255,200,50,1)');
    lineGrad.addColorStop(1, 'rgba(255,200,50,0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect((w - lw) / 2, ly, lw, 2);
  }
  ctx.globalAlpha = 1;

  // 6. 远山剪影（底部）
  ctx.fillStyle = 'rgba(60,20,20,0.5)';
  ctx.beginPath();
  ctx.moveTo(0, h);
  ctx.lineTo(0, h * 0.88);
  ctx.quadraticCurveTo(w * 0.15, h * 0.82, w * 0.3, h * 0.86);
  ctx.quadraticCurveTo(w * 0.45, h * 0.80, w * 0.55, h * 0.84);
  ctx.quadraticCurveTo(w * 0.7, h * 0.78, w * 0.85, h * 0.85);
  ctx.quadraticCurveTo(w * 0.95, h * 0.82, w, h * 0.87);
  ctx.lineTo(w, h);
  ctx.closePath();
  ctx.fill();

  // 7. 底部半透明遮罩（让文字更清晰）
  const bottomGrad = ctx.createLinearGradient(0, h * 0.65, 0, h);
  bottomGrad.addColorStop(0, 'rgba(100,20,20,0)');
  bottomGrad.addColorStop(1, 'rgba(60,10,10,0.6)');
  ctx.fillStyle = bottomGrad;
  ctx.fillRect(0, h * 0.65, w, h * 0.35);
}

function drawRadarOnPoster(ctx, cx, cy, r, scores) {
  const axes = [
    { label: '看清世界', key: 'jianCha', angle: -Math.PI / 2 },
    { label: '找到路径', key: 'chengXing', angle: Math.PI / 6 },
    { label: '了解自己', key: 'mingDing', angle: Math.PI * 5 / 6 }
  ];

  // 网格（3层）
  ctx.lineWidth = 1.5;
  for (let level = 1; level <= 3; level++) {
    ctx.beginPath();
    const lr = r * level / 3;
    for (let i = 0; i < 3; i++) {
      const a = axes[i].angle;
      const x = cx + lr * Math.cos(a);
      const y = cy + lr * Math.sin(a);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.strokeStyle = THEME.sub;
    ctx.globalAlpha = 0.35;
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  // 轴线和标签
  for (const ax of axes) {
    const x = cx + r * Math.cos(ax.angle);
    const y = cy + r * Math.sin(ax.angle);
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.lineTo(x, y);
    ctx.strokeStyle = THEME.sub;
    ctx.globalAlpha = 0.45;
    ctx.stroke();
    ctx.globalAlpha = 1;

    // 标签
    ctx.fillStyle = THEME.text;
    ctx.font = 'bold 28px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const lx = cx + (r + 50) * Math.cos(ax.angle);
    const ly = cy + (r + 50) * Math.sin(ax.angle);
    ctx.fillText(ax.label, lx, ly);
  }

  // 数据区域
  ctx.beginPath();
  for (let i = 0; i < 3; i++) {
    const ax = axes[i];
    const val = scores[ax.key] || 0;
    const vr = r * val / 100;
    const x = cx + vr * Math.cos(ax.angle);
    const y = cy + vr * Math.sin(ax.angle);
    if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fillStyle = 'rgba(255,255,255,0.18)';
  ctx.fill();
  ctx.strokeStyle = THEME.text;
  ctx.lineWidth = 4;
  ctx.stroke();

  // 数据点
  for (const ax of axes) {
    const val = scores[ax.key] || 0;
    const vr = r * val / 100;
    const x = cx + vr * Math.cos(ax.angle);
    const y = cy + vr * Math.sin(ax.angle);
    ctx.beginPath();
    ctx.arc(x, y, 9, 0, Math.PI * 2);
    ctx.fillStyle = THEME.text;
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, Math.PI * 2);
    ctx.fillStyle = THEME.bgMid;
    ctx.fill();
  }
}

/** 绘制装饰圆环 */
function drawDecorativeRings(ctx, cx, cy) {
  ctx.strokeStyle = THEME.ring;
  ctx.lineWidth = 2;
  [260, 290].forEach(r => {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();
  });
}

/** 文本自动换行（中文） */
function drawWrappedText(ctx, text, x, y, maxWidth, lineHeight, align = 'center') {
  ctx.textAlign = align;
  const chars = text.split('');
  let line = '';
  let lines = [];
  for (let i = 0; i < chars.length; i++) {
    const testLine = line + chars[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && line.length > 0) {
      lines.push(line);
      line = chars[i];
    } else {
      line = testLine;
    }
  }
  lines.push(line);

  let cy = y;
  lines.forEach(l => {
    ctx.fillText(l, x, cy);
    cy += lineHeight;
  });
  return cy;
}

/**
 * 生成分享海报
 * @param {HTMLCanvasElement} canvas
 * @param {Object} result - CJIScorer.calculate() 的结果
 * @param {HTMLImageElement|null} logoImg - 品牌logo图片（可选）
 * @returns {HTMLCanvasElement}
 */
export function generatePoster(canvas, result, logoImg = null) {
  // 固定 750x1334 像素（海报输出尺寸）
  canvas.width = POSTER_WIDTH;
  canvas.height = POSTER_HEIGHT;

  const ctx = canvas.getContext('2d');
  const p = PORTRAIT_DATA[result.portrait] || PORTRAIT_DATA['BBB'];
  const oneLiner = PORTRAIT_ONE_LINER[result.portrait] || '';

  // 1. 日出星空背景
  drawSunriseStarBackground(ctx, POSTER_WIDTH, POSTER_HEIGHT);

  // 2. 顶部装饰线
  ctx.fillStyle = 'rgba(255,255,255,0.2)';
  ctx.fillRect(80, 80, POSTER_WIDTH - 160, 2);

  // 3. 品牌logo（如有图片则绘制图片，否则用文字）
  if (logoImg && logoImg.complete && logoImg.naturalWidth > 0) {
    const logoSize = 100;
    const logoX = (POSTER_WIDTH - logoSize) / 2;
    const logoY = 100;
    // 圆形裁切绘制
    ctx.save();
    ctx.beginPath();
    ctx.arc(POSTER_WIDTH / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.closePath();
    ctx.clip();
    ctx.drawImage(logoImg, logoX, logoY, logoSize, logoSize);
    ctx.restore();
    // 外圈金色描边
    ctx.strokeStyle = 'rgba(255,200,100,0.6)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(POSTER_WIDTH / 2, logoY + logoSize / 2, logoSize / 2, 0, Math.PI * 2);
    ctx.stroke();
  } else {
    ctx.fillStyle = THEME.text;
    ctx.font = 'bold 56px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('见澄明', POSTER_WIDTH / 2, 110);
  }

  // 4. 品牌标语（紧跟logo下方，视觉居中）
  ctx.fillStyle = THEME.sub;
  ctx.font = '24px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  // 口号已移除

  // 5. 雷达图区域（中心约 460，在太阳上方）
  const radarCX = POSTER_WIDTH / 2;
  const radarCY = 460;
  const radarR = 155;

  drawDecorativeRings(ctx, radarCX, radarCY);
  drawRadarOnPoster(ctx, radarCX, radarCY, radarR, result.threeAxes);

  // 6. 画像名（带文字阴影增强可读性）
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.4)';
  ctx.shadowBlur = 12;
  ctx.fillStyle = THEME.text;
  ctx.font = 'bold 68px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(p.name, POSTER_WIDTH / 2, 780);
  ctx.restore();

  // 7. 装饰短线
  ctx.fillStyle = 'rgba(255,255,255,0.35)';
  ctx.fillRect(POSTER_WIDTH / 2 - 50, 870, 100, 3);

  // 8. 一句话描述（自动换行）
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.3)';
  ctx.shadowBlur = 8;
  ctx.fillStyle = THEME.sub;
  ctx.font = '28px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  drawWrappedText(ctx, oneLiner, POSTER_WIDTH / 2, 910, POSTER_WIDTH - 120, 48, 'center');
  ctx.restore();

  // 9. 底部 QR 占位区
  const footerY = 1080;
  ctx.strokeStyle = 'rgba(255,255,255,0.35)';
  ctx.lineWidth = 2;
  ctx.setLineDash([8, 6]);
  ctx.strokeRect(POSTER_WIDTH / 2 - 60, footerY, 120, 120);
  ctx.setLineDash([]);

  ctx.fillStyle = THEME.sub;
  ctx.font = '22px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('二维码', POSTER_WIDTH / 2, footerY + 55);

  ctx.fillText('扫码测测你的澄明力', POSTER_WIDTH / 2, footerY + 148);

  // 10. 底部版权
  ctx.fillStyle = 'rgba(255,255,255,0.45)';
  ctx.font = '20px "PingFang SC", "Microsoft YaHei", "Noto Sans SC", sans-serif';
  ctx.fillText('见澄明 © 2026', POSTER_WIDTH / 2, 1280);

  // 11. 设置 CSS 显示尺寸（保持宽高比，避免变形）
  const maxDisplayWidth = Math.min(327, window.innerWidth - 32);
  const displayScale = maxDisplayWidth / POSTER_WIDTH;
  canvas.style.width = maxDisplayWidth + 'px';
  canvas.style.height = Math.round(POSTER_HEIGHT * displayScale) + 'px';

  return canvas;
}

/**
 * 下载海报图片
 * @param {HTMLCanvasElement} canvas
 * @param {string} filename
 */
export function downloadPoster(canvas, filename = '见澄明-澄明力海报.png') {
  const link = document.createElement('a');
  link.download = filename;
  link.href = canvas.toDataURL('image/png');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
