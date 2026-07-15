// generate-tabbar-icons.js
// 用纯 Node.js 生成 6 个 81x81 灰度 PNG 图标（无外部依赖）
// 符合微信小程序 tabBar 图标规范：< 40KB，PNG 格式

const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

const OUT_DIR = path.join(__dirname, '..', 'images');
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

const SIZE = 81;
const ACTIVE = '#4285F4';   // 选中色（蓝）
const NORMAL = '#999999';   // 未选中色（灰）

/**
 * 手工构造最小化 PNG
 * @param {Buffer} rgba  RGBA 字节，size*size*4
 * @param {number} size  边长
 * @returns {Buffer}
 */
function encodePng(rgba, size) {
  // PNG signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  const ihdrChunk = makeChunk('IHDR', ihdr);

  // IDAT: 每行加 filter byte 0
  const raw = Buffer.alloc(size * (size * 4 + 1));
  for (let y = 0; y < size; y++) {
    const rowStart = y * (size * 4 + 1);
    raw[rowStart] = 0; // filter none
    rgba.copy(raw, rowStart + 1, y * size * 4, (y + 1) * size * 4);
  }
  const compressed = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', compressed);

  // IEND
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcInput = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcInput), 0);
  return Buffer.concat([len, typeBuf, data, crc]);
}

// CRC32 table
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    }
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  }
  return (c ^ 0xffffffff) >>> 0;
}

/**
 * 绘制实心圆角矩形（带圆角）
 */
function fillRoundRect(rgba, size, x, y, w, h, radius, hex) {
  const r = hexToRgb(hex);
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(size, Math.ceil(x + w));
  const y1 = Math.min(size, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      // 圆角内/外判断
      if (!inRoundRect(px, py, x, y, w, h, radius)) continue;
      const idx = (py * size + px) * 4;
      rgba[idx] = r.r;
      rgba[idx + 1] = r.g;
      rgba[idx + 2] = r.b;
      rgba[idx + 3] = 255;
    }
  }
}

/**
 * 绘制描边矩形（空心）
 */
function strokeRoundRect(rgba, size, x, y, w, h, radius, thickness, hex) {
  const r = hexToRgb(hex);
  const x0 = Math.max(0, Math.floor(x));
  const y0 = Math.max(0, Math.floor(y));
  const x1 = Math.min(size, Math.ceil(x + w));
  const y1 = Math.min(size, Math.ceil(y + h));
  for (let py = y0; py < y1; py++) {
    for (let px = x0; px < x1; px++) {
      if (!inRoundRect(px, py, x, y, w, h, radius)) continue;
      // 仅边缘
      const onTop = py - y < thickness;
      const onBottom = (y + h - 1 - py) < thickness;
      const onLeft = px - x < thickness;
      const onRight = (x + w - 1 - px) < thickness;
      if (!(onTop || onBottom || onLeft || onRight)) continue;
      const idx = (py * size + px) * 4;
      rgba[idx] = r.r;
      rgba[idx + 1] = r.g;
      rgba[idx + 2] = r.b;
      rgba[idx + 3] = 255;
    }
  }
}

function inRoundRect(px, py, x, y, w, h, radius) {
  if (px < x || px >= x + w || py < y || py >= y + h) return false;
  // 简化：只检查 4 个角的圆弧
  const corners = [
    { cx: x + radius, cy: y + radius },
    { cx: x + w - radius, cy: y + radius },
    { cx: x + radius, cy: y + h - radius },
    { cx: x + w - radius, cy: y + h - radius }
  ];
  const dx = [], dy = [];
  if (px < x + radius) dx.push(x + radius - px);
  if (px >= x + w - radius) dx.push(px - (x + w - radius - 1));
  if (py < y + radius) dy.push(y + radius - py);
  if (py >= y + h - radius) dy.push(py - (y + h - radius - 1));
  const r2 = radius * radius;
  for (const ddx of dx) {
    for (const ddy of dy) {
      if (ddx * ddx + ddy * ddy > r2) return false;
    }
  }
  return true;
}

function hexToRgb(hex) {
  const v = parseInt(hex.replace('#', ''), 16);
  return { r: (v >> 16) & 255, g: (v >> 8) & 255, b: v & 255 };
}

/**
 * 绘制一条直线
 */
function drawLine(rgba, size, x0, y0, x1, y1, thickness, hex) {
  const r = hexToRgb(hex);
  const dx = x1 - x0, dy = y1 - y0;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i++) {
    const t = steps === 0 ? 0 : i / steps;
    const x = Math.round(x0 + dx * t);
    const y = Math.round(y0 + dy * t);
    for (let oy = -thickness; oy <= thickness; oy++) {
      for (let ox = -thickness; ox <= thickness; ox++) {
        const px = x + ox, py = y + oy;
        if (px < 0 || px >= size || py < 0 || py >= size) continue;
        const idx = (py * size + px) * 4;
        rgba[idx] = r.r;
        rgba[idx + 1] = r.g;
        rgba[idx + 2] = r.b;
        rgba[idx + 3] = 255;
      }
    }
  }
}

/**
 * 绘制实心圆
 */
function fillCircle(rgba, size, cx, cy, radius, hex) {
  const r = hexToRgb(hex);
  const r2 = radius * radius;
  for (let y = Math.max(0, cy - radius); y <= Math.min(size - 1, cy + radius); y++) {
    for (let x = Math.max(0, cx - radius); x <= Math.min(size - 1, cx + radius); x++) {
      const dx = x - cx, dy = y - cy;
      if (dx * dx + dy * dy > r2) continue;
      const idx = (y * size + x) * 4;
      rgba[idx] = r.r;
      rgba[idx + 1] = r.g;
      rgba[idx + 2] = r.b;
      rgba[idx + 3] = 255;
    }
  }
}

/**
 * 绘制折线（折线图）
 */
function drawPolyline(rgba, size, points, thickness, hex) {
  for (let i = 0; i < points.length - 1; i++) {
    drawLine(rgba, size, points[i][0], points[i][1], points[i + 1][0], points[i + 1][1], thickness, hex);
  }
  for (const p of points) {
    fillCircle(rgba, size, p[0], p[1], thickness + 1, hex);
  }
}

// ============ 各图标绘制函数 ============

// 1. 首页（日历图标）
function drawHome(color) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4); // 透明背景
  // 主体矩形
  strokeRoundRect(rgba, SIZE, 16, 20, 49, 49, 4, 3, color);
  // 顶部分割线
  drawLine(rgba, SIZE, 16, 34, 65, 34, 2, color);
  // 两个挂耳
  drawLine(rgba, SIZE, 26, 12, 26, 22, 2, color);
  drawLine(rgba, SIZE, 55, 12, 55, 22, 2, color);
  // 3x3 日期点
  for (let r = 0; r < 3; r++) {
    for (let c = 0; c < 3; c++) {
      const x = 25 + c * 12;
      const y = 42 + r * 9;
      fillCircle(rgba, SIZE, x, y, 2, color);
    }
  }
  return rgba;
}

// 2. 洞察（折线图图标）
function drawInsights(color) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  // 坐标轴
  drawLine(rgba, SIZE, 14, 14, 14, 67, 2, color);
  drawLine(rgba, SIZE, 14, 67, 67, 67, 2, color);
  // 折线
  drawPolyline(rgba, SIZE, [
    [22, 56], [32, 40], [42, 48], [52, 28], [62, 36]
  ], 2, color);
  return rgba;
}

// 3. 设置（齿轮图标，简化为三条横线 + 圆点）
function drawSettings(color) {
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  // 三条横线
  drawLine(rgba, SIZE, 18, 25, 63, 25, 3, color);
  drawLine(rgba, SIZE, 18, 40, 63, 40, 3, color);
  drawLine(rgba, SIZE, 18, 55, 63, 55, 3, color);
  // 三个圆点
  fillCircle(rgba, SIZE, 30, 25, 4, color);
  fillCircle(rgba, SIZE, 50, 40, 4, color);
  fillCircle(rgba, SIZE, 30, 55, 4, color);
  return rgba;
}

// ============ 主流程 ============

const icons = [
  { name: 'home', draw: drawHome, color: NORMAL },
  { name: 'home-active', draw: drawHome, color: ACTIVE },
  { name: 'insights', draw: drawInsights, color: NORMAL },
  { name: 'insights-active', draw: drawInsights, color: ACTIVE },
  { name: 'settings', draw: drawSettings, color: NORMAL },
  { name: 'settings-active', draw: drawSettings, color: ACTIVE }
];

icons.forEach(icon => {
  const rgba = icon.draw(icon.color);
  const png = encodePng(rgba, SIZE);
  const file = path.join(OUT_DIR, icon.name + '.png');
  fs.writeFileSync(file, png);
  console.log('生成: ' + file + ' (' + png.length + ' 字节)');
});

console.log('\n[OK] 6 个 tabBar 图标已生成在 images/ 目录');
