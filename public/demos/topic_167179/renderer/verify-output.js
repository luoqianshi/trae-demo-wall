const { execSync } = require('child_process');
const fs = require('fs');
const CONFIG = require('./config');

/**
 * 验证 MOV 输出文件
 */
function verifyOutput(movPath, options = {}) {
  console.log(`\n  === Verifying: ${movPath} ===`);

  if (!fs.existsSync(movPath)) {
    return { passed: false, error: 'File not found' };
  }

  const cmd = `"${CONFIG.ffprobePath}" -v error -select_streams v:0 -show_entries stream=width,height,r_frame_rate,duration,pix_fmt,codec_name -of json "${movPath}"`;
  const output = execSync(cmd, { encoding: 'utf8' });
  const data = JSON.parse(output);
  const stream = data.streams[0];

  const results = {
    file: movPath,
    size: `${(fs.statSync(movPath).size / 1024 / 1024).toFixed(2)} MB`,
    width: stream.width,
    height: stream.height,
    duration: parseFloat(stream.duration).toFixed(2),
    pixelFormat: stream.pix_fmt,
    codec: stream.codec_name,
    checks: {}
  };

  // Resolution check
  results.checks.resolution = stream.width === 1080 && stream.height === 1700;
  console.log(`  Resolution: ${stream.width}x${stream.height} ${results.checks.resolution ? '✅' : '❌'}`);

  // Duration check
  const expectedDuration = options.expectedDuration ?? CONFIG.defaultDuration;
  const dur = parseFloat(stream.duration);
  results.checks.duration = Math.abs(dur - expectedDuration) < 0.5;
  console.log(`  Duration: ${dur}s (expected ${expectedDuration}s) ${results.checks.duration ? '✅' : '❌'}`);

  // Alpha channel check
  const hasAlpha = stream.pix_fmt && (stream.pix_fmt.includes('a') || stream.pix_fmt.includes('yuva'));
  results.checks.alpha = hasAlpha;
  console.log(`  Pixel format: ${stream.pix_fmt} ${hasAlpha ? '✅ (alpha)' : '❌'}`);

  // Overall
  results.passed = results.checks.resolution && results.checks.duration && results.checks.alpha;
  console.log(`  Overall: ${results.passed ? '✅ PASSED' : '❌ FAILED'}`);

  return results;
}

module.exports = { verifyOutput };