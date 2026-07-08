/**
 * 生成 Tab 图标（纯 Node.js，无外部依赖）
 * 运行: node utils/generate_icons.js
 */
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

function createPNG(width, height, rgbaFn) {
  // 构建像素行（每行以 filter byte 0x00 开头）
  const rawData = Buffer.alloc((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    const rowOffset = y * (1 + width * 4);
    rawData[rowOffset] = 0; // filter: None
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = rgbaFn(x, y, width, height);
      const px = rowOffset + 1 + x * 4;
      rawData[px] = r;
      rawData[px + 1] = g;
      rawData[px + 2] = b;
      rawData[px + 3] = a;
    }
  }

  // zlib 压缩
  const compressed = zlib.deflateSync(rawData);

  // PNG 文件构建
  const chunks = [];

  // IHDR
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  // bit depth
  ihdr[9] = 6;  // color type: RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace
  chunks.push(makeChunk('IHDR', ihdr));

  // IDAT
  chunks.push(makeChunk('IDAT', compressed));

  // IEND
  chunks.push(makeChunk('IEND', Buffer.alloc(0)));

  // 拼接
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const totalLen = chunks.reduce((s, c) => s + c.length, 0);
  const result = Buffer.concat([signature, ...chunks], signature.length + totalLen);
  return result;
}

function makeChunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeB = Buffer.from(type, 'ascii');
  const crcData = Buffer.concat([typeB, data]);
  const crc = crc32(crcData);
  const crcB = Buffer.alloc(4);
  crcB.writeUInt32BE(crc, 0);
  return Buffer.concat([len, typeB, data, crcB]);
}

function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
    }
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

// ======= 图标绘制函数 =======

// 首页 - 小房子
function drawHouse(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  // 屋顶 (三角形)
  const roofH = h * 0.35;
  const roofBase = w * 0.75;
  const roofLeft = (w - roofBase) / 2;
  // 判断是否在屋顶区域内
  const relY = y - (cy - roofH);
  const roofEdge = (relY / roofH) * (roofBase / 2);
  const inRoof = y >= cy - roofH && y <= cy &&
    x >= cx - roofEdge && x <= cx + roofEdge;

  // 墙壁 (矩形)
  const wallTop = cy;
  const wallBottom = h;
  const wallLeft = w * 0.2;
  const wallRight = w * 0.8;
  const inWall = y >= wallTop && y <= wallBottom &&
    x >= wallLeft && x <= wallRight;

  // 门
  const doorW = w * 0.2;
  const doorH = h * 0.25;
  const doorLeft = cx - doorW / 2;
  const doorRight = cx + doorW / 2;
  const doorTop = h - doorH;
  const inDoor = y >= doorTop && y <= h &&
    x >= doorLeft && x <= doorRight;

  if (inRoof && !inDoor) {
    return [255, 107, 74, 230]; // 橘色屋顶
  }
  if (inWall && !inDoor) {
    return [255, 183, 77, 200]; // 淡橘墙壁
  }
  if (inDoor) {
    return [180, 80, 50, 230]; // 棕色门
  }
  return [0, 0, 0, 0]; // 透明
}

// 徽章墙 - 奖牌/勋章
function drawMedal(x, y, w, h) {
  const cx = w / 2;
  const cy = h * 0.45;
  const outerR = w * 0.32;
  const innerR = w * 0.22;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // 圆形奖牌
  if (dist <= outerR) {
    if (dist <= innerR) {
      return [255, 215, 0, 240]; // 金色中心
    }
    const angle = Math.atan2(dy, dx);
    // 锯齿边缘效果
    const numTeeth = 12;
    const tooth = Math.round((angle / (2 * Math.PI) + 0.5) * numTeeth) % 2 === 0;
    if (tooth || dist <= outerR * 0.85) {
      return [255, 193, 7, 235]; // 金色
    }
    return [255, 215, 0, 200];
  }

  // 丝带（奖牌下方两侧）
  const ribbonW = w * 0.15;
  const ribbonLeft = cx - w * 0.3;
  const ribbonRight = cx + w * 0.3;
  const ribbonTop = cy + outerR * 0.6;
  const ribbonBottom = h;

  if (x >= ribbonLeft - ribbonW/2 && x <= ribbonLeft + ribbonW/2 &&
      y >= ribbonTop && y <= ribbonBottom) {
    return [255, 60, 60, 220]; // 红色丝带
  }
  if (x >= ribbonRight - ribbonW/2 && x <= ribbonRight + ribbonW/2 &&
      y >= ribbonTop && y <= ribbonBottom) {
    return [255, 60, 60, 220]; // 红色丝带
  }

  return [0, 0, 0, 0];
}

// 排行榜 - 柱状图表
function drawChart(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const margin = w * 0.12;
  const chartW = w - margin * 2;
  const chartH = h * 0.65;
  const chartLeft = margin;
  const chartRight = w - margin;
  const chartTop = h - margin - chartH;
  const chartBottom = h - margin;

  // 坐标轴
  const axisLeft = chartLeft + 8;
  const axisBottom = chartBottom;

  // 柱子参数
  const barCount = 3;
  const barW = chartW / (barCount * 2.5);
  const barGap = chartW / barCount - barW;

  const barHeights = [
    chartH * 0.55,
    chartH * 0.85,
    chartH * 0.70,
  ];

  // 检查是否在某个柱子上
  for (let i = 0; i < barCount; i++) {
    const barLeft = axisLeft + i * (barW + barGap) + barGap / 2;
    const barRight = barLeft + barW;
    const barTop = chartBottom - barHeights[i];
    if (x >= barLeft && x <= barRight && y >= barTop && y <= chartBottom) {
      const colors = [
        [255, 107, 74, 220],
        [91, 134, 229, 220],
        [46, 196, 182, 220],
      ];
      return colors[i];
    }
  }

  // 坐标底线
  if (y >= chartBottom - 2 && y <= chartBottom + 2 && x >= axisLeft && x <= chartRight) {
    return [180, 180, 180, 180];
  }

  return [0, 0, 0, 0];
}

// 生成所有图标
const outputDir = path.join(__dirname, '..', 'images');

const icons = [
  { name: 'home.png', draw: drawHouse },
  { name: 'home_active.png', draw: (x,y,w,h) => {
    const c = drawHouse(x,y,w,h);
    if (c[3] > 0) { c[0] = Math.min(255, c[0] + 30); c[1] = Math.min(255, c[1] + 20); }
    return c;
  }},
  { name: 'badge.png', draw: drawMedal },
  { name: 'badge_active.png', draw: (x,y,w,h) => {
    const c = drawMedal(x,y,w,h);
    if (c[3] > 0) { c[0] = Math.min(255, c[0] + 30); c[1] = Math.min(255, c[1] + 20); c[2] = Math.min(255, c[2]+10); }
    return c;
  }},
  { name: 'rank.png', draw: drawChart },
  { name: 'rank_active.png', draw: (x,y,w,h) => {
    const c = drawChart(x,y,w,h);
    if (c[3] > 0) { c[0] = Math.min(255, c[0] + 30); c[1] = Math.min(255, c[1] + 20); }
    return c;
  }},
];

for (const icon of icons) {
  // 生成 81x81 像素图标（tab推荐尺寸）
  const png = createPNG(81, 81, icon.draw);
  const filePath = path.join(outputDir, icon.name);
  fs.writeFileSync(filePath, png);
  console.log(`  ✓ ${icon.name} (${png.length} bytes)`);
}

console.log('\n全部图标已生成到:', outputDir);