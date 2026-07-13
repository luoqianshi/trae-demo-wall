const fs = require('fs');
const path = require('path');

const createPNG = (width, height, r, g, b, a = 255) => {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const createChunk = (type, data) => {
    const length = Buffer.alloc(4);
    length.writeUInt32BE(data.length, 0);
    const typeBuffer = Buffer.from(type);
    const crcData = Buffer.concat([typeBuffer, data]);
    const crc = crc32(crcData);
    const crcBuffer = Buffer.alloc(4);
    crcBuffer.writeUInt32BE(crc >>> 0, 0);
    return Buffer.concat([length, typeBuffer, data, crcBuffer]);
  };
  
  const crc32 = (buf) => {
    let crc = 0xffffffff;
    const table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let j = 0; j < 8; j++) {
        c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
      }
      table[i] = c;
    }
    for (let i = 0; i < buf.length; i++) {
      crc = table[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
    }
    return crc ^ 0xffffffff;
  };
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  ihdr[10] = 0;
  ihdr[11] = 0;
  ihdr[12] = 0;
  
  const rawData = [];
  for (let y = 0; y < height; y++) {
    rawData.push(0);
    for (let x = 0; x < width; x++) {
      rawData.push(0, 0, 0, 0);
    }
  }
  
  return { signature, ihdr, createChunk, crc32, rawData, width, height };
};

const drawPixel = (rawData, x, y, width, r, g, b, a = 255) => {
  if (x >= 0 && x < width * 4 && y >= 0 && y < Math.floor(rawData.length / (width * 4 + 1))) {
    const idx = y * (width * 4 + 1) + 1 + x * 4;
    rawData[idx] = r;
    rawData[idx + 1] = g;
    rawData[idx + 2] = b;
    rawData[idx + 3] = a;
  }
};

const drawCircle = (rawData, cx, cy, radius, width, r, g, b, a = 255) => {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      if (dx * dx + dy * dy <= radius * radius) {
        drawPixel(rawData, cx + dx, cy + dy, width, r, g, b, a);
      }
    }
  }
};

const drawRect = (rawData, x, y, w, h, width, r, g, b, a = 255) => {
  for (let yy = y; yy < y + h; yy++) {
    for (let xx = x; xx < x + w; xx++) {
      drawPixel(rawData, xx, yy, width, r, g, b, a);
    }
  }
};

const drawLine = (rawData, x1, y1, x2, y2, width, r, g, b, a = 255) => {
  const dx = Math.abs(x2 - x1);
  const dy = Math.abs(y2 - y1);
  const sx = x1 < x2 ? 1 : -1;
  const sy = y1 < y2 ? 1 : -1;
  let err = dx - dy;
  let x = x1, y = y1;
  while (true) {
    drawPixel(rawData, x, y, width, r, g, b, a);
    if (x === x2 && y === y2) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
};

const generateHomeIcon = (r, g, b) => {
  const { signature, ihdr, createChunk, rawData, width, height } = createPNG(48, 48, 0, 0, 0);
  const cx = 24, cy = 28;
  
  drawRect(rawData, 8, 16, 32, 28, width, r, g, b);
  drawRect(rawData, 6, 20, 36, 24, width, r, g, b);
  
  drawLine(rawData, cx, 8, cx - 14, 20, width, r, g, b);
  drawLine(rawData, cx, 8, cx + 14, 20, width, r, g, b);
  drawLine(rawData, cx - 14, 20, cx + 14, 20, width, r, g, b);
  
  const { deflateSync } = require('zlib');
  const compressed = deflateSync(Buffer.from(rawData));
  return Buffer.concat([signature, createChunk('IHDR', ihdr), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))]);
};

const generateInterviewIcon = (r, g, b) => {
  const { signature, ihdr, createChunk, rawData, width, height } = createPNG(48, 48, 0, 0, 0);
  const cx = 24;
  
  drawRect(rawData, 10, 10, 28, 28, width, r, g, b);
  drawRect(rawData, 14, 14, 20, 20, width, 255, 255, 255);
  
  drawCircle(rawData, cx, 18, 3, width, r, g, b);
  drawCircle(rawData, cx, 26, 3, width, r, g, b);
  drawCircle(rawData, cx, 34, 3, width, r, g, b);
  
  drawLine(rawData, 18, 18, 30, 18, width, r, g, b);
  drawLine(rawData, 18, 26, 26, 26, width, r, g, b);
  
  const { deflateSync } = require('zlib');
  const compressed = deflateSync(Buffer.from(rawData));
  return Buffer.concat([signature, createChunk('IHDR', ihdr), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))]);
};

const generateKnowledgeIcon = (r, g, b) => {
  const { signature, ihdr, createChunk, rawData, width, height } = createPNG(48, 48, 0, 0, 0);
  
  drawRect(rawData, 12, 8, 24, 32, width, r, g, b);
  
  drawRect(rawData, 14, 12, 20, 6, width, 255, 255, 255);
  drawRect(rawData, 14, 20, 18, 4, width, 255, 255, 255);
  drawRect(rawData, 14, 26, 16, 4, width, 255, 255, 255);
  drawRect(rawData, 14, 32, 14, 4, width, 255, 255, 255);
  
  drawLine(rawData, 12, 14, 36, 14, width, r, g, b);
  
  const { deflateSync } = require('zlib');
  const compressed = deflateSync(Buffer.from(rawData));
  return Buffer.concat([signature, createChunk('IHDR', ihdr), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))]);
};

const generateFavoritesIcon = (r, g, b) => {
  const { signature, ihdr, createChunk, rawData, width, height } = createPNG(48, 48, 0, 0, 0);
  const cx = 24, cy = 26;
  
  for (let y = 48; y >= 0; y--) {
    for (let x = 0; x < 48; x++) {
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const targetDist = Math.abs(dy) * 0.8 + Math.min(Math.abs(dx) * 1.2, 18);
      if (dist <= targetDist) {
        drawPixel(rawData, x, y, width, r, g, b);
      }
    }
  }
  
  const { deflateSync } = require('zlib');
  const compressed = deflateSync(Buffer.from(rawData));
  return Buffer.concat([signature, createChunk('IHDR', ihdr), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))]);
};

const generateProfileIcon = (r, g, b) => {
  const { signature, ihdr, createChunk, rawData, width, height } = createPNG(48, 48, 0, 0, 0);
  const cx = 24, cy = 22;
  
  drawCircle(rawData, cx, cy, 12, width, r, g, b);
  
  drawCircle(rawData, cx, 18, 4, width, 255, 255, 255);
  
  drawRect(rawData, 10, 34, 28, 12, width, r, g, b);
  
  const { deflateSync } = require('zlib');
  const compressed = deflateSync(Buffer.from(rawData));
  return Buffer.concat([signature, createChunk('IHDR', ihdr), createChunk('IDAT', compressed), createChunk('IEND', Buffer.alloc(0))]);
};

const icons = [
  { name: 'home.png', color: [148, 163, 184], generator: generateHomeIcon },
  { name: 'home-active.png', color: [34, 197, 94], generator: generateHomeIcon },
  { name: 'interview.png', color: [148, 163, 184], generator: generateInterviewIcon },
  { name: 'interview-active.png', color: [59, 130, 246], generator: generateInterviewIcon },
  { name: 'knowledge.png', color: [148, 163, 184], generator: generateKnowledgeIcon },
  { name: 'knowledge-active.png', color: [168, 85, 247], generator: generateKnowledgeIcon },
  { name: 'favorites.png', color: [148, 163, 184], generator: generateFavoritesIcon },
  { name: 'favorites-active.png', color: [239, 68, 68], generator: generateFavoritesIcon },
  { name: 'profile.png', color: [148, 163, 184], generator: generateProfileIcon },
  { name: 'profile-active.png', color: [249, 115, 22], generator: generateProfileIcon }
];

const dir = path.dirname(__filename);
icons.forEach(icon => {
  const png = icon.generator(...icon.color);
  fs.writeFileSync(path.join(dir, icon.name), png);
  console.log(`Created ${icon.name}`);
});

console.log('All icons created successfully!');