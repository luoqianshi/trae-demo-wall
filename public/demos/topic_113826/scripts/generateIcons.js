const fs = require('fs');
const path = require('path');

const dir = './miniprogram/images';
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

function crc32(data) {
  let crc = 0xFFFFFFFF;
  const table = [];
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let j = 0; j < 8; j++) {
      c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    }
    table[i] = c;
  }
  for (let i = 0; i < data.length; i++) {
    crc = table[(crc ^ data[i]) & 0xFF] ^ (crc >>> 8);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function createChunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeBuffer = Buffer.from(type);
  const crcData = Buffer.concat([typeBuffer, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(crcData));
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function createPNG(width, height, drawFn) {
  const signature = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  
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
      const [r, g, b, a] = drawFn(x, y);
      rawData.push(r, g, b, a);
    }
  }
  
  const zlib = require('zlib');
  const compressed = zlib.deflateSync(Buffer.from(rawData));
  
  const ihdrChunk = createChunk('IHDR', ihdr);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));
  
  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function pixelCat1(x, y) {
  if (y <= 5) return [255, 255, 255, 0];
  if (y >= 18) return [255, 255, 255, 0];
  
  if (y === 6) {
    if (x >= 3 && x <= 5) return [255, 180, 180, 255];
    if (x >= 10 && x <= 12) return [255, 180, 180, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 7 && y <= 9) {
    if (x >= 2 && x <= 6) return [255, 180, 180, 255];
    if (x >= 9 && x <= 13) return [255, 180, 180, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 10 && y <= 15) {
    if (x >= 3 && x <= 12) return [150, 150, 150, 255];
    return [255, 255, 255, 0];
  }
  
  if (y === 16) {
    if (x >= 5 && x <= 10) return [150, 150, 150, 255];
    if (x === 4 || x === 11) return [150, 150, 150, 255];
    return [255, 255, 255, 0];
  }
  
  if (y === 17) {
    if (x >= 6 && x <= 9) return [150, 150, 150, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 10 && y <= 12) {
    if (x === 5) return [255, 255, 255, 255];
    if (x === 9) return [255, 255, 255, 255];
    if (x === 6) return [0, 0, 0, 255];
    if (x === 8) return [0, 0, 0, 255];
  }
  
  return [255, 255, 255, 0];
}

function pixelDog(x, y) {
  if (y <= 4) return [255, 255, 255, 0];
  if (y >= 20) return [255, 255, 255, 0];
  
  if (y >= 5 && y <= 9) {
    if (x >= 4 && x <= 11) return [255, 180, 100, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 6 && y <= 8) {
    if (x >= 6 && x <= 9) return [255, 255, 255, 255];
  }
  
  if (y === 7) {
    if (x === 7 || x === 8) return [0, 0, 0, 255];
  }
  
  if (y >= 10 && y <= 17) {
    if (x >= 3 && x <= 12) return [255, 180, 100, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 11 && y <= 14) {
    if (x >= 6 && x <= 9) return [255, 255, 255, 255];
  }
  
  if (y >= 12 && y <= 15) {
    if (x >= 1 && x <= 3) return [255, 180, 100, 255];
    if (x >= 12 && x <= 14) return [255, 180, 100, 255];
  }
  
  return [255, 255, 255, 0];
}

function pixelHouse(x, y) {
  if (y <= 3) return [255, 255, 255, 0];
  if (y >= 22) return [255, 255, 255, 0];
  
  if (y >= 4 && y <= 8) {
    if (x >= 5 && x <= 10) return [200, 80, 50, 255];
    if (x >= 6 && x <= 9 && y <= 6) return [200, 80, 50, 255];
    if (y === 4 && x >= 4 && x <= 11) return [200, 80, 50, 255];
    if (y === 5 && x >= 3 && x <= 12) return [200, 80, 50, 255];
    if (y === 6 && x >= 2 && x <= 13) return [200, 80, 50, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 7 && y <= 8) {
    if (x >= 3 && x <= 12) return [200, 80, 50, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 9 && y <= 17) {
    if (x >= 2 && x <= 13) return [255, 200, 150, 255];
    if (x === 2 || x === 13) return [200, 150, 100, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 11 && y <= 14) {
    if (x >= 7 && x <= 8) return [200, 100, 50, 255];
    if (x >= 8 && x <= 9 && y >= 13) return [200, 100, 50, 255];
  }
  
  if (y === 12 && x === 8) return [255, 100, 100, 255];
  
  return [255, 255, 255, 0];
}

function pixelCat2(x, y) {
  if (y <= 5) return [255, 255, 255, 0];
  if (y >= 20) return [255, 255, 255, 0];
  
  if (y >= 6 && y <= 8) {
    if (x >= 2 && x <= 5) return [200, 180, 200, 255];
    if (x >= 10 && x <= 13) return [200, 180, 200, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 9 && y <= 16) {
    if (x >= 3 && x <= 12) return [180, 180, 200, 255];
    return [255, 255, 255, 0];
  }
  
  if (y === 17) {
    if (x >= 5 && x <= 10) return [180, 180, 200, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 11 && y <= 13) {
    if (x === 5) return [255, 255, 255, 255];
    if (x === 9) return [255, 255, 255, 255];
    if (x === 6) return [0, 0, 0, 255];
    if (x === 8) return [0, 0, 0, 255];
  }
  
  return [255, 255, 255, 0];
}

function pixelCat3(x, y) {
  if (y <= 4) return [255, 255, 255, 0];
  if (y >= 18) return [255, 255, 255, 0];
  
  if (y >= 5 && y <= 7) {
    if (x >= 3 && x <= 5) return [255, 180, 180, 255];
    if (x >= 10 && x <= 12) return [255, 180, 180, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 8 && y <= 14) {
    if (x >= 4 && x <= 11) return [150, 150, 150, 255];
    return [255, 255, 255, 0];
  }
  
  if (y === 15) {
    if (x >= 6 && x <= 9) return [150, 150, 150, 255];
    return [255, 255, 255, 0];
  }
  
  if (y >= 10 && y <= 12) {
    if (x === 6) return [255, 255, 255, 255];
    if (x === 9) return [255, 255, 255, 255];
    if (x === 7) return [0, 0, 0, 255];
    if (x === 8) return [0, 0, 0, 255];
  }
  
  return [255, 255, 255, 0];
}

function drawHome(color) {
  const [r, g, b] = color;
  return (x, y) => {
    if (y >= 22 && y <= 38) {
      if ((y === 22 || y === 38) && x >= 10 && x <= 53) return [r, g, b, 255];
      if (x === 10 || x === 53) return [r, g, b, 255];
    }
    if (y >= 38 && y <= 60) {
      if ((y === 38 || y === 60) && x >= 6 && x <= 57) return [r, g, b, 255];
      if (x === 6 || x === 57) return [r, g, b, 255];
    }
    if (y >= 10 && y <= 22) {
      const dx = Math.abs(x - 32);
      const dy = 22 - y;
      if (dx <= dy) return [r, g, b, 255];
    }
    return [0, 0, 0, 0];
  };
}

function drawPlus(color) {
  const [r, g, b] = color;
  return (x, y) => {
    const cx = 32, cy = 32;
    if (Math.abs(x - cx) <= 5 && y >= 16 && y <= 48) return [r, g, b, 255];
    if (Math.abs(y - cy) <= 5 && x >= 16 && x <= 48) return [r, g, b, 255];
    return [0, 0, 0, 0];
  };
}

function drawPerson(color) {
  const [r, g, b] = color;
  return (x, y) => {
    if (y >= 10 && y <= 28) {
      const dx = Math.abs(x - 32);
      const dy = y - 10;
      if (dx * dx + dy * dy <= 18 * 18) return [r, g, b, 255];
    }
    if (y >= 28 && y <= 42) {
      if ((y === 28 || y === 42) && x >= 20 && x <= 44) return [r, g, b, 255];
      if (x === 20 || x === 44) return [r, g, b, 255];
    }
    if (y >= 42 && y <= 60) {
      if (x >= 20 && x <= 26 && y >= 42 && y <= 60) return [r, g, b, 255];
      if (x >= 38 && x <= 44 && y >= 42 && y <= 60) return [r, g, b, 255];
    }
    return [0, 0, 0, 0];
  };
}

fs.writeFileSync(path.join(dir, 'pixel-cat.png'), createPNG(16, 24, pixelCat1));
fs.writeFileSync(path.join(dir, 'pixel-dog.png'), createPNG(16, 24, pixelDog));
fs.writeFileSync(path.join(dir, 'pixel-house.png'), createPNG(16, 24, pixelHouse));
fs.writeFileSync(path.join(dir, 'pixel-cat2.png'), createPNG(16, 24, pixelCat2));
fs.writeFileSync(path.join(dir, 'pixel-cat3.png'), createPNG(16, 24, pixelCat3));

fs.writeFileSync(path.join(dir, 'home.png'), createPNG(64, 64, drawHome([181, 173, 156])));
fs.writeFileSync(path.join(dir, 'home-active.png'), createPNG(64, 64, drawHome([255, 214, 153])));
fs.writeFileSync(path.join(dir, 'publish.png'), createPNG(64, 64, drawPlus([181, 173, 156])));
fs.writeFileSync(path.join(dir, 'publish-active.png'), createPNG(64, 64, drawPlus([255, 214, 153])));
fs.writeFileSync(path.join(dir, 'mine.png'), createPNG(64, 64, drawPerson([181, 173, 156])));
fs.writeFileSync(path.join(dir, 'mine-active.png'), createPNG(64, 64, drawPerson([255, 214, 153])));

console.log('All images created successfully!');