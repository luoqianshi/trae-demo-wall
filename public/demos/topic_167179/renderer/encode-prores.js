const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');

/**
 * 使用 FFmpeg 将 PNG 序列编码为 ProRes 4444 MOV
 * @param {string} framesDir - PNG 序列目录
 * @param {string} outputPath - 输出 MOV 文件路径
 * @param {object} options
 */
function encodeProRes(framesDir, outputPath, options = {}) {
  const fps = options.fps || CONFIG.fps;
  const outputDir = path.dirname(outputPath);
  fs.mkdirSync(outputDir, { recursive: true });

  const args = [
    '-y',
    '-framerate', String(fps),
    '-i', path.join(framesDir, 'frame-%04d.png'),
    '-c:v', 'prores_ks',
    '-profile:v', '4444',
    '-pix_fmt', 'yuva444p10le',
    '-vendor', 'apl0',
    '-r', String(fps),
    outputPath
  ];

  const cmd = `"${CONFIG.ffmpegPath}" ${args.map(a => `"${a}"`).join(' ')}`;
  console.log(`  Encoding: ${cmd}`);
  execSync(cmd, { stdio: 'inherit' });

  const stats = fs.statSync(outputPath);
  console.log(`  ✅ Output: ${outputPath} (${(stats.size / 1024 / 1024).toFixed(2)} MB)`);
  return outputPath;
}

/**
 * 生成 checkerboard 预览图，用于人工检查画面内容
 */
function generateCheckerPreview(movPath, outputDir) {
  const previewPath = path.join(outputDir, 'checker-preview.png');
  const cmd = `"${CONFIG.ffmpegPath}" -y -ss 1.5 -i "${movPath}" -vframes 1 -f image2 -update true "${previewPath}"`;
  try {
    execSync(cmd, { stdio: 'pipe' });
    const stats = fs.statSync(previewPath);
    console.log(`  ✅ Preview: ${previewPath} (${(stats.size / 1024).toFixed(0)} bytes)`);
    return previewPath;
  } catch (e) {
    console.warn(`  ⚠️  Preview generation failed: ${e.message}`);
    return null;
  }
}

module.exports = { encodeProRes, generateCheckerPreview };