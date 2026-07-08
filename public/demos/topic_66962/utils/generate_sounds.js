/**
 * 生成简单音效WAV文件（Node.js 脚本）
 * 运行: node utils/generate_sounds.js
 */
const fs = require('fs');
const path = require('path');

function createWAV(samples, sampleRate) {
  const numChannels = 1;
  const bitsPerSample = 8;
  const byteRate = sampleRate * numChannels * bitsPerSample / 8;
  const blockAlign = numChannels * bitsPerSample / 8;
  const dataSize = samples.length;
  const headerSize = 44;
  const buffer = Buffer.alloc(headerSize + dataSize);

  // RIFF header
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16);        // chunk size
  buffer.writeUInt16LE(1, 20);         // PCM format
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(byteRate, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);

  // data chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  for (let i = 0; i < dataSize; i++) {
    buffer[headerSize + i] = samples[i];
  }

  return buffer;
}

// 正确音效 - 上升双音 (C5 → E5, 0.3s)
function generateCorrectSound() {
  const sampleRate = 8000;
  const duration = 0.3;
  const samples = Math.floor(sampleRate * duration);
  const data = [];
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq1 = 523; // C5
    const freq2 = 659; // E5
    const fadeFactor = Math.max(0, 1 - t / duration);
    // 前半段C5，后半段E5，带淡出
    const mixPoint = 0.4;
    let value;
    if (t / duration < mixPoint) {
      value = Math.sin(2 * Math.PI * freq1 * t);
    } else {
      value = Math.sin(2 * Math.PI * freq2 * t);
    }
    // 转换为8-bit unsigned
    const sample = Math.round(128 + value * 50 * fadeFactor);
    data.push(Math.max(0, Math.min(255, sample)));
  }
  return data;
}

// 错误音效 - 低沉蜂鸣 (200Hz, 0.3s)
function generateWrongSound() {
  const sampleRate = 8000;
  const duration = 0.25;
  const samples = Math.floor(sampleRate * duration);
  const data = [];
  
  for (let i = 0; i < samples; i++) {
    const t = i / sampleRate;
    const freq = 200;
    const fadeFactor = Math.max(0, 1 - t / duration);
    const value = Math.sin(2 * Math.PI * freq * t);
    const sample = Math.round(128 + value * 40 * fadeFactor);
    data.push(Math.max(0, Math.min(255, sample)));
  }
  return data;
}

const outputDir = path.join(__dirname, '..', 'sounds');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 生成正确音效
const correctData = generateCorrectSound();
const correctWav = createWAV(correctData, 8000);
fs.writeFileSync(path.join(outputDir, 'correct.wav'), correctWav);

// 生成错误音效
const wrongData = generateWrongSound();
const wrongWav = createWAV(wrongData, 8000);
fs.writeFileSync(path.join(outputDir, 'wrong.wav'), wrongWav);

console.log('音效文件已生成到: ' + outputDir);
console.log('  - correct.wav (' + correctWav.length + ' bytes)');
console.log('  - wrong.wav (' + wrongWav.length + ' bytes)');