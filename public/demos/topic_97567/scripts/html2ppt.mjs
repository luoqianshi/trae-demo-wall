/**
 * 将 presentation-final.html 的每一页截图并生成 PPTX
 * 用法: node scripts/html2ppt.mjs
 */

import puppeteer from 'puppeteer';
import PptxGenJS from 'pptxgenjs';
import { mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE = 'http://localhost:3000';
const HTML_PATH = '/presentation-final.html';
const OUTPUT = join(__dirname, '..', 'public', 'snowball-diary.pptx');

// 每页的 data-index（按顺序）
const SLIDES = Array.from({ length: 10 }, (_, i) => i);

async function run() {
  console.log('启动浏览器...');
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: process.env.PUPPETEER_EXECUTABLE_PATH,
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
  
  // 打开 PPT 页面，隐藏导航点避免干扰截图
  await page.goto(`${BASE}${HTML_PATH}`, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise(r => setTimeout(r, 1500));

  // 隐藏导航点和雪花粒子，让截图更干净
  await page.evaluate(() => {
    const nav = document.querySelector('.nav-dots');
    const snow = document.querySelector('.snow-container');
    if (nav) nav.style.display = 'none';
    if (snow) snow.style.display = 'none';
  });
  await new Promise(r => setTimeout(r, 500));

  const pptx = new PptxGenJS();
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = '雪球日记';
  pptx.author = 'Snowball Diary';

  for (const idx of SLIDES) {
    console.log(`处理第 ${idx + 1} / ${SLIDES.length} 页...`);

    // 切换到目标 slide
    await page.evaluate((targetIdx) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach(s => s.classList.remove('active'));
      slides[targetIdx].classList.add('active');
    }, idx);

    // 等待过渡动画完成
    await new Promise(r => setTimeout(r, 700));

    // 截图
    const screenshot = await page.screenshot({
      type: 'png',
      fullPage: false,
    });

    // 添加到 PPTX
    const slide = pptx.addSlide();
    slide.addImage({
      data: `image/png;base64,${screenshot.toString('base64')}`,
      x: 0,
      y: 0,
      w: '100%',
      h: '100%',
    });

    console.log(`  第 ${idx + 1} 页完成`);
  }

  await browser.close();

  // 保存文件
  mkdirSync(dirname(OUTPUT), { recursive: true });
  await pptx.writeFile({ fileName: OUTPUT });
  console.log(`\n✅ PPTX 已生成: ${OUTPUT}`);
}

run().catch(e => {
  console.error('转换失败:', e.message);
  process.exit(1);
});
