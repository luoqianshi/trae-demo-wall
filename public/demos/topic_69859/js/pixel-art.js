/* =================================================================
   CodeBeat 节奏编程 - 像素画渐进显影系统
   右侧画布随玩家击打准确度逐步"显影"预设像素画。
   判定越准 → 点亮像素越多 → 最终画面越完整。
   画布每帧持续重绘，保持呼吸、扫描波、进度条等动态视觉。
   ================================================================= */

// ============ 调色板 ============
const PIXEL_PALETTE = [
  null,        // 0: 透明/背景
  '#ffffff',   // 1: 白色
  '#ec4899',   // 2: 粉色
  '#06b6d4',   // 3: 青色（眼睛）
  '#f59e0b',   // 4: 金色
  '#eab308',   // 5: 黄色
  '#8b5cf6',   // 6: 紫色
  '#10b981',   // 7: 绿色
  '#ef4444',   // 8: 红色
];

// ============ 像素画数据 ============
// 16x16 网格，每个字符是调色板索引
const PIXEL_ART_DATA = {
  cat: {
    name: '像素小猫',
    rows: [
      '0000200000020000',
      '0002220000222000',
      '0021111111111200',
      '0211111111111120',
      '0211311111131120',
      '0211111121111120',
      '0211112221111120',
      '0021111111111200',
      '0002111111112000',
      '0021111111111200',
      '0211111111111122',
      '0211111111111120',
      '0021100000112000',
      '0021100000112000',
      '0002200000220000',
      '0000000000000000',
    ],
  },
  heart: {
    name: '像素爱心',
    rows: [
      '0000000000000000',
      '0000000000000000',
      '0022000000220000',
      '0222200002222000',
      '2222220022222200',
      '2222222222222200',
      '2222222222222200',
      '0222222222222000',
      '0022222222220000',
      '0002222222200000',
      '0000222222000000',
      '0000022220000000',
      '0000002200000000',
      '0000000000000000',
      '0000000000000000',
      '0000000000000000',
    ],
  },
  star: {
    name: '像素星星',
    rows: [
      '0000000000000000',
      '0000000500000000',
      '0000005550000000',
      '0000055555000000',
      '5555555555555500',
      '0555555555555000',
      '0055555555550000',
      '0005555555500000',
      '0000555555000000',
      '0005550055500000',
      '0055500005550000',
      '0555000000555000',
      '5500000000005500',
      '0000000000000000',
      '0000000000000000',
      '0000000000000000',
    ],
  },
};

// ============ 像素显影参数 ============
const PIXEL_REVEAL = {
  PERFECT: 3,
  GREAT:   2,
  GOOD:    1,
  FREE:    1,
  MISS:    0,
};

// ============ 运行时状态 ============
const pixelState = {
  cells: [],
  totalColored: 0,
  revealedCount: 0,
  ripples: [],        // 点亮波纹
  animFrameId: null,  // 动画帧 ID
  lastRevealTime: 0,  // 最后一次点亮时间（用于闪光效果）
};

let currentArtwork = 'cat';

// ============ 初始化 ============
function initPixelArt() {
  const data = PIXEL_ART_DATA[currentArtwork];
  pixelState.cells = [];
  pixelState.totalColored = 0;
  pixelState.revealedCount = 0;
  pixelState.ripples = [];
  pixelState.lastRevealTime = 0;

  for (let r = 0; r < data.rows.length; r++) {
    const row = [];
    for (let c = 0; c < data.rows[r].length; c++) {
      const idx = parseInt(data.rows[r][c]);
      row.push({
        colorIdx: idx,
        revealed: false,
        revealTime: 0,
      });
      if (idx > 0) pixelState.totalColored++;
    }
    pixelState.cells.push(row);
  }

  // 启动持续动画循环
  _startPixelAnimation();
}

// ============ 持续动画循环 ============
function _startPixelAnimation() {
  if (pixelState.animFrameId) cancelAnimationFrame(pixelState.animFrameId);

  function loop() {
    drawPixelArt();
    pixelState.animFrameId = requestAnimationFrame(loop);
  }
  pixelState.animFrameId = requestAnimationFrame(loop);
}

function _stopPixelAnimation() {
  if (pixelState.animFrameId) {
    cancelAnimationFrame(pixelState.animFrameId);
    pixelState.animFrameId = null;
  }
}

// ============ 像素显影核心 ============
function revealPixels(judgment, trackColor) {
  const count = PIXEL_REVEAL[judgment] || 0;
  if (count <= 0) return 0;

  const unrevealed = [];
  for (let r = 0; r < pixelState.cells.length; r++) {
    for (let c = 0; c < pixelState.cells[r].length; c++) {
      const cell = pixelState.cells[r][c];
      if (cell.colorIdx > 0 && !cell.revealed) {
        unrevealed.push({ r, c });
      }
    }
  }

  if (unrevealed.length === 0) return 0;

  // 洗牌后取前 count 个
  for (let i = unrevealed.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [unrevealed[i], unrevealed[j]] = [unrevealed[j], unrevealed[i]];
  }

  const now = performance.now();
  const actual = Math.min(count, unrevealed.length);
  for (let i = 0; i < actual; i++) {
    const { r, c } = unrevealed[i];
    pixelState.cells[r][c].revealed = true;
    pixelState.cells[r][c].revealTime = now;
    pixelState.revealedCount++;
  }

  pixelState.lastRevealTime = now;

  // 扩散波纹
  if (actual > 0) {
    const center = unrevealed[0];
    pixelState.ripples.push({
      r: center.r, c: center.c,
      time: now,
      color: trackColor || '#ffffff',
    });
  }

  return actual;
}

// ============ 渲染（每帧调用） ============
function drawPixelArt() {
  const w = drawCanvas.width;
  const h = drawCanvas.height;
  if (w === 0 || h === 0) return;

  const now = performance.now();

  // --- 深色背景 ---
  drawCtx.fillStyle = '#0a0a1a';
  drawCtx.fillRect(0, 0, w, h);

  const rows = pixelState.cells.length;
  const cols = rows > 0 ? pixelState.cells[0].length : 16;
  const gap = 3;
  const pixelSize = Math.floor(Math.min(
    (w - gap) / cols - gap,
    (h - gap) / rows - gap
  ));
  const gridW = cols * (pixelSize + gap) + gap;
  const gridH = rows * (pixelSize + gap) + gap;
  const offsetX = Math.floor((w - gridW) / 2);
  const offsetY = Math.floor((h - gridH) / 2);

  // --- 网格线（微弱） ---
  drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.035)';
  drawCtx.lineWidth = 1;
  for (let r = 0; r <= rows; r++) {
    const y = offsetY + r * (pixelSize + gap);
    drawCtx.beginPath();
    drawCtx.moveTo(offsetX, y);
    drawCtx.lineTo(offsetX + gridW, y);
    drawCtx.stroke();
  }
  for (let c = 0; c <= cols; c++) {
    const x = offsetX + c * (pixelSize + gap);
    drawCtx.beginPath();
    drawCtx.moveTo(x, offsetY);
    drawCtx.lineTo(x, offsetY + gridH);
    drawCtx.stroke();
  }

  // --- 绘制所有格子 ---
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const cell = pixelState.cells[r][c];
      const x = offsetX + gap + c * (pixelSize + gap);
      const y = offsetY + gap + r * (pixelSize + gap);

      if (cell.revealed) {
        const age = now - cell.revealTime;
        const color = PIXEL_PALETTE[cell.colorIdx];

        // ① 刚点亮的弹出放大动画（300ms），仅当 age >= 0 时生效
        let scale = 1;
        let extraGlow = 0;
        if (age >= 0 && age < 300) {
          const t = age / 300;
          scale = 0.4 + 0.6 * t;
          extraGlow = 22 * (1 - t);
        }

        // ② 呼吸效果：所有已点亮像素亮度缓慢波动
        const breathePhase = (r * 0.618 + c * 0.382 + now * 0.0015) % 1;
        const breathe = 0.82 + 0.18 * Math.sin(breathePhase * Math.PI * 2);

        // ③ 全局闪光：每次点亮后画布整体短暂高亮
        const flashAge = now - pixelState.lastRevealTime;
        const flash = flashAge < 120 ? (1 - flashAge / 120) * 0.12 : 0;

        const s = Math.floor(pixelSize * scale);
        const pad = Math.floor((pixelSize - s) / 2);
        const baseGlow = 6 + extraGlow;

        drawCtx.shadowColor = color;
        drawCtx.shadowBlur = baseGlow;
        drawCtx.globalAlpha = breathe;
        drawCtx.fillStyle = color;
        drawCtx.fillRect(x + pad, y + pad, s, s);

        // 闪光叠加（白色薄层）
        if (flash > 0) {
          drawCtx.globalAlpha = flash;
          drawCtx.fillStyle = '#ffffff';
          drawCtx.fillRect(x + pad, y + pad, s, s);
        }

        drawCtx.globalAlpha = 1;
        drawCtx.shadowBlur = 0;

      } else if (cell.colorIdx > 0) {
        // 未点亮但属于图案区域：显示极淡轮廓提示
        drawCtx.fillStyle = 'rgba(255, 255, 255, 0.025)';
        drawCtx.fillRect(x, y, pixelSize, pixelSize);
      }
    }
  }

  // --- 扩散波纹（清理 600ms 前的） ---
  pixelState.ripples = pixelState.ripples.filter(rip => now - rip.time < 600);
  for (const rip of pixelState.ripples) {
    const elapsed = now - rip.time;
    const progress = elapsed / 600;
    const maxRadius = Math.max(gridW, gridH) * 0.4;
    const radius = progress * maxRadius;
    const cx = offsetX + gap + rip.c * (pixelSize + gap) + pixelSize / 2;
    const cy = offsetY + gap + rip.r * (pixelSize + gap) + pixelSize / 2;
    const alpha = 0.45 * (1 - progress);

    drawCtx.strokeStyle = hexToRgba(rip.color, alpha);
    drawCtx.lineWidth = 2;
    drawCtx.beginPath();
    drawCtx.arc(cx, cy, radius, 0, Math.PI * 2);
    drawCtx.stroke();
  }

  // --- 扫描光波：从上到下循环扫过画布 ---
  const scanPeriod = 3000;
  const scanProgress = (now % scanPeriod) / scanPeriod;
  const scanY = offsetY + scanProgress * gridH;
  const scanHeight = pixelSize * 2.5;
  const completionRatio = pixelState.totalColored > 0
    ? pixelState.revealedCount / pixelState.totalColored : 0;
  const scanAlpha = 0.08 + completionRatio * 0.12;

  const scanGrad = drawCtx.createLinearGradient(0, scanY - scanHeight, 0, scanY + scanHeight);
  scanGrad.addColorStop(0, 'rgba(139, 92, 246, 0)');
  scanGrad.addColorStop(0.5, hexToRgba('#8b5cf6', scanAlpha));
  scanGrad.addColorStop(1, 'rgba(139, 92, 246, 0)');
  drawCtx.fillStyle = scanGrad;
  drawCtx.fillRect(offsetX, scanY - scanHeight, gridW, scanHeight * 2);

  // --- 底部辉光（完成度越高越亮） ---
  if (completionRatio > 0.02) {
    const glowH = 30 + completionRatio * 50;
    const bottomGrad = drawCtx.createLinearGradient(0, offsetY + gridH, 0, offsetY + gridH + glowH);
    bottomGrad.addColorStop(0, hexToRgba('#ec4899', 0.25 * completionRatio));
    bottomGrad.addColorStop(1, 'rgba(236, 72, 153, 0)');
    drawCtx.fillStyle = bottomGrad;
    drawCtx.fillRect(offsetX, offsetY + gridH, gridW, glowH);
  }

  // --- 四边完成度进度条 ---
  const barW = 3;
  drawProgressBorder(
    offsetX - barW - 3, offsetY - barW - 3,
    gridW + (barW + 3) * 2, gridH + (barW + 3) * 2,
    barW, completionRatio
  );
}

// ============ 进度边框 ============
function drawProgressBorder(x, y, w, h, barW, ratio) {
  if (ratio <= 0) return;

  const totalLen = 2 * (w + h);
  const filledLen = totalLen * ratio;

  // 背景轨道
  drawCtx.strokeStyle = 'rgba(255, 255, 255, 0.06)';
  drawCtx.lineWidth = barW;
  drawCtx.strokeRect(x, y, w, h);

  // 填充进度（顺时针：上→右→下→左）
  const grad = drawCtx.createLinearGradient(x, y, x + w, y + h);
  grad.addColorStop(0, '#ec4899');
  grad.addColorStop(0.5, '#8b5cf6');
  grad.addColorStop(1, '#06b6d4');

  drawCtx.strokeStyle = grad;
  drawCtx.lineWidth = barW;
  drawCtx.lineCap = 'round';

  // 构建顺时针路径点
  const corners = [
    { x: x,       y: y       }, // 左上
    { x: x + w,   y: y       }, // 右上
    { x: x + w,   y: y + h   }, // 右下
    { x: x,       y: y + h   }, // 左下
    { x: x,       y: y       }, // 回到左上（闭合）
  ];
  const segmentLens = [w, h, w, h]; // 每段长度

  drawCtx.beginPath();
  drawCtx.moveTo(corners[0].x, corners[0].y);

  let drawn = 0;
  for (let i = 0; i < 4 && drawn < filledLen; i++) {
    const segLen = segmentLens[i];
    const remaining = filledLen - drawn;
    const t = Math.min(1, remaining / segLen);

    const ex = corners[i].x + (corners[i + 1].x - corners[i].x) * t;
    const ey = corners[i].y + (corners[i + 1].y - corners[i].y) * t;
    drawCtx.lineTo(ex, ey);

    drawn += segLen * t;
  }

  drawCtx.shadowColor = '#ec4899';
  drawCtx.shadowBlur = 8;
  drawCtx.stroke();
  drawCtx.shadowBlur = 0;
  drawCtx.lineCap = 'butt';
}

// ============ 工具函数 ============
function getCompletionPercent() {
  if (pixelState.totalColored === 0) return 0;
  return Math.round((pixelState.revealedCount / pixelState.totalColored) * 100);
}

function setArtwork(name) {
  if (PIXEL_ART_DATA[name]) {
    currentArtwork = name;
    initPixelArt();
  }
}

/**
 * 结算时用：一次性点亮所有未显示的像素，让画布呈现完整作品。
 * 带轻微的交错动画，比瞬间全亮更有仪式感。
 * @returns {number} 完整动画所需的时长（ms），调用方可据此延迟显示结果。
 */
function revealAllPixels() {
  const now = performance.now();
  let newCount = 0;
  let maxDelay = 0;
  for (let r = 0; r < pixelState.cells.length; r++) {
    for (let c = 0; c < pixelState.cells[r].length; c++) {
      const cell = pixelState.cells[r][c];
      if (cell.colorIdx > 0 && !cell.revealed) {
        cell.revealed = true;
        cell.revealTime = now + maxDelay; // 交错点亮
        pixelState.revealedCount++;
        newCount++;
        maxDelay += 18; // 每个像素延迟 18ms
      }
    }
  }
  // 动画总时长 = 交错延迟 + 最后像素的 300ms 弹出动画
  const totalAnimTime = maxDelay + 300;
  drawPixelArt();
  return totalAnimTime;
}
