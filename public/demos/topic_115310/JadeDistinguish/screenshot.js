import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function takeScreenshot(htmlFile, outputFile) {
  const browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // 设置视口大小
  await page.setViewport({
    width: 1920,
    height: 1080
  });
  
  // 打开 HTML 文件
  const filePath = path.resolve(__dirname, 'docs', htmlFile);
  await page.goto(`file://${filePath}`, {
    waitUntil: 'networkidle0'
  });
  
  // 等待页面完全加载
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 截取全页面（包括滚动部分）
  await page.screenshot({
    path: path.resolve(__dirname, 'docs', outputFile),
    fullPage: true
  });
  
  console.log(`✓ 已生成: ${outputFile}`);
  
  await browser.close();
}

async function main() {
  console.log('开始截屏...\n');
  
  try {
    await takeScreenshot('mobile-preview.html', 'mobile-preview.png');
    await takeScreenshot('admin-preview.html', 'admin-preview.png');
    
    console.log('\n✓ 所有截图已完成！');
  } catch (error) {
    console.error('截屏失败:', error);
    process.exit(1);
  }
}

main();
