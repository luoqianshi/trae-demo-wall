const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const CONFIG = require('./config');

/**
 * 使用 Puppeteer 逐帧捕获透明 PNG 序列
 * @param {string} htmlContent - 完整的 HTML 页面内容
 * @param {string} outputDir - 帧输出目录
 * @param {object} options
 * @param {number} [options.duration] - 时长（秒），默认 3
 * @param {number} [options.fps] - 帧率，默认 30
 */
async function captureFrames(htmlContent, outputDir, options = {}) {
  const duration = options.duration || CONFIG.defaultDuration;
  const fps = options.fps || CONFIG.fps;
  const totalFrames = Math.round(duration * fps);

  fs.mkdirSync(outputDir, { recursive: true });

  const browser = await puppeteer.launch({
    executablePath: CONFIG.chromePath,
    headless: 'new',
    defaultViewport: { width: CONFIG.width, height: CONFIG.height }
  });

  const page = await browser.newPage();
  await new Promise(r => setTimeout(r, 100));

  // Inject animation progress update function
  const htmlWithScript = htmlContent.replace('</body>', `
<script>
  // Animation progress driver
  window.__currentProgress = 0;
  if (typeof window.updateAnimation === 'function') {
    window.updateAnimation(window.__currentProgress);
  }
</script>
</body>`);

  await page.setContent(htmlWithScript, { waitUntil: 'load', timeout: 60000 });

  console.log(`  Capturing ${totalFrames} frames (${duration}s @ ${fps}fps)...`);

  for (let frame = 0; frame < totalFrames; frame++) {
    const progress = frame / totalFrames;

    // Update animation state
    await page.evaluate((p) => {
      window.__currentProgress = p;
      if (typeof window.updateAnimation === 'function') {
        window.updateAnimation(p);
      }
    }, progress);

    // Small delay to let CSS transitions/animations settle
    await new Promise(r => setTimeout(r, 15));

    const framePath = path.join(outputDir, `frame-${String(frame).padStart(4, '0')}.png`);
    await page.screenshot({
      path: framePath,
      omitBackground: true
    });

    if ((frame + 1) % 10 === 0 || frame === totalFrames - 1) {
      console.log(`    Frame ${frame + 1}/${totalFrames}`);
    }
  }

  await browser.close();
  return { totalFrames, outputDir };
}

module.exports = { captureFrames };