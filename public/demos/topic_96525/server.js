const express = require('express');
const puppeteer = require('puppeteer');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const AdmZip = require('adm-zip');
const { spawn } = require('child_process');

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

const outputDir = path.join(__dirname, 'output');
const uploadDir = path.join(__dirname, 'uploads');
const tempDir = path.join(__dirname, 'temp');
[outputDir, uploadDir, tempDir].forEach(d => {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
});

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + '_' + crypto.randomBytes(4).toString('hex') + ext);
  }
});
const upload = multer({ storage, limits: { fileSize: 100 * 1024 * 1024 } });

// ==================== 浏览器管理 ====================
let browser = null;

async function getBrowser() {
  try {
    if (browser) {
      await browser.pages();
      return browser;
    }
  } catch (e) {
    browser = null;
  }
  browser = await puppeteer.launch({
    headless: true,
    executablePath: 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-gpu',
      '--headless',
      '--window-position=-32000,-32000',
      '--allow-file-access-from-files',
      '--disable-web-security'
    ]
  });
  return browser;
}

async function loadPage(pageUrl, viewportWidth = 1920) {
  const browserInstance = await getBrowser();
  const page = await browserInstance.newPage();
  page.setDefaultTimeout(120000);
  page.setDefaultNavigationTimeout(60000);
  await page.setViewport({ width: viewportWidth, height: 1080 });

  const isFileUrl = pageUrl.startsWith('file://');
  const waitUntil = isFileUrl ? 'domcontentloaded' : 'networkidle2';

  try {
    await page.goto(pageUrl, { waitUntil, timeout: 60000 });
  } catch (e) {
    // networkidle2 可能因某些资源加载失败而超时，降级为 load 重试
    if (!isFileUrl && waitUntil === 'networkidle2') {
      console.log(`[重试] networkidle2 超时，降级为 load 重试: ${pageUrl}`);
      await page.goto(pageUrl, { waitUntil: 'load', timeout: 60000 });
    } else {
      throw e;
    }
  }

  // 等待页面完全渲染
  await new Promise(resolve => setTimeout(resolve, isFileUrl ? 2000 : 1500));
  return page;
}

// ==================== 维度检测 ====================
async function getPageDimensions(page) {
  const dims = await page.evaluate(() => {
    const body = document.body;
    const html = document.documentElement;
    return {
      width: Math.max(
        body.scrollWidth, body.offsetWidth,
        html.clientWidth, html.scrollWidth, html.offsetWidth
      ),
      height: Math.max(
        body.scrollHeight, body.offsetHeight,
        html.clientHeight, html.scrollHeight, html.offsetHeight
      )
    };
  });
  return {
    width: Math.ceil(dims.width) + 10,
    height: Math.ceil(dims.height) + 20
  };
}

// ==================== 生成 PDF（真实 PDF，非截图） ====================
async function generatePDF(pageUrl, options = {}) {
  const {
    format = 'A4',
    landscape = false,
    margin = { top: '0mm', bottom: '0mm', left: '0mm', right: '0mm' },
    scale = 1,
    singlePage = false
  } = options;

  const page = await loadPage(pageUrl);
  try {
    const pdfOptions = {
      landscape,
      scale,
      printBackground: true,
      margin,
      preferCSSPageSize: !singlePage
    };

    if (singlePage) {
      const dims = await getPageDimensions(page);
      console.log(`[长单页PDF] 宽: ${dims.width}px, 高: ${dims.height}px`);
      await page.setViewport({ width: dims.width, height: dims.height });
      pdfOptions.width = dims.width + 'px';
      pdfOptions.height = dims.height + 'px';
    } else {
      pdfOptions.format = format;
    }

    console.log('[PDF] 开始生成...');
    page.setDefaultTimeout(0);
    const result = await page.pdf({ ...pdfOptions, timeout: 0 });
    console.log('[PDF] 生成完成');
    return result;
  } finally {
    await page.close();
  }
}

// ==================== 生成 PNG 高清长图 ====================
async function generatePNG(pageUrl, options = {}) {
  const { singlePage = true } = options;

  const page = await loadPage(pageUrl, 1920);
  try {
    if (singlePage) {
      const dims = await getPageDimensions(page);
      await page.setViewport({ width: dims.width, height: dims.height });
      console.log(`[长图PNG] 宽: ${dims.width}px, 高: ${dims.height}px`);
    }
    return await page.screenshot({
      fullPage: singlePage,
      type: 'png',
      omitBackground: false
    });
  } finally {
    await page.close();
  }
}

// ==================== 工具函数 ====================
function toFileUrl(filePath) {
  return 'file:///' + encodeURI(filePath.replace(/\\/g, '/')).replace(/#/g, '%23');
}

function parseOptions(body) {
  return {
    format: body.format || 'A4',
    landscape: body.landscape === 'true' || body.landscape === true,
    scale: parseFloat(body.scale) || 1,
    singlePage: body.singlePage === 'true' || body.singlePage === true,
    outputType: body.outputType || 'pdf',
    saveName: body.saveName || ''
  };
}

function findHtmlFile(dirPath) {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile() && /\.html?$/i.test(entry.name)) {
      return path.join(dirPath, entry.name);
    }
    if (entry.isDirectory()) {
      const found = findHtmlFile(path.join(dirPath, entry.name));
      if (found) return found;
    }
  }
  return null;
}

function cleanTemp(dirPath) {
  try {
    if (dirPath && fs.existsSync(dirPath)) {
      fs.rmSync(dirPath, { recursive: true, force: true });
    }
  } catch (e) {
    // 忽略清理错误
  }
}

function copyWithResources(htmlFilePath, destDir) {
  const htmlDir = path.dirname(htmlFilePath);
  const htmlContent = fs.readFileSync(htmlFilePath, 'utf-8');
  const copied = new Set();

  const patterns = [
    /\bsrc\s*=\s*["']([^"']+)["']/gi,
    /\bhref\s*=\s*["']([^"']+)["']/gi,
    /srcset\s*=\s*["']([^"']+)["']/gi,
    /url\(\s*["']?([^"')]+)["']?\s*\)/gi
  ];

  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(htmlContent)) !== null) {
      const ref = match[1].trim();
      if (/^(https?:|data:|#|mailto:|javascript:)/i.test(ref)) continue;

      const absPath = path.resolve(htmlDir, ref);
      const relPath = ref.split(/[?#]/)[0];

      if (!fs.existsSync(absPath) || copied.has(absPath)) continue;

      const destPath = path.join(destDir, relPath);
      const destParent = path.dirname(destPath);
      if (!fs.existsSync(destParent)) {
        fs.mkdirSync(destParent, { recursive: true });
      }

      try {
        fs.copyFileSync(absPath, destPath);
        copied.add(absPath);
        console.log(`  [资源] ${relPath}`);
      } catch (e) {
        console.log(`  [跳过] ${relPath}: ${e.message}`);
      }
    }
  }

  const destHtml = path.join(destDir, path.basename(htmlFilePath));
  fs.writeFileSync(destHtml, htmlContent, 'utf-8');
  return { htmlPath: destHtml, resourceCount: copied.size };
}

// ==================== API: 原生文件选择对话框 ====================
app.post('/api/browse-file', (req, res) => {
  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.OpenFileDialog
$dialog.Filter = "HTML文件 (*.html;*.htm)|*.html;*.htm|所有文件 (*.*)|*.*"
$dialog.Title = "选择HTML文件"
$dialog.InitialDirectory = [Environment]::GetFolderPath('Desktop')
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName } else { Write-Output "" }
`;

  const ps = spawn('powershell', [
    '-WindowStyle', 'Hidden', '-NoProfile', '-Command', psScript
  ], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.on('close', code => {
    const filePath = stdout.trim();
    if (!filePath) return res.json({ cancelled: true });
    res.json({ success: true, filePath });
  });
  ps.on('error', err => res.status(500).json({ error: err.message }));
});

// ==================== API: 系统另存为对话框 ====================
app.post('/api/save-as', (req, res) => {
  const { filename, saveName } = req.body;
  const srcPath = path.join(outputDir, filename);

  if (!filename || !fs.existsSync(srcPath)) {
    return res.status(404).json({ error: '文件不存在' });
  }

  const ext = path.extname(filename);
  const defaultName = (saveName || 'output') + ext;
  const filter = ext === '.png'
    ? 'PNG图片 (*.png)|*.png'
    : 'PDF文件 (*.pdf)|*.pdf';

  const psScript = `
[Console]::OutputEncoding = [System.Text.Encoding]::UTF8
Add-Type -AssemblyName System.Windows.Forms
$dialog = New-Object System.Windows.Forms.SaveFileDialog
$dialog.Filter = "${filter}"
$dialog.Title = "另存为"
$dialog.FileName = "${defaultName.replace(/"/g, '""')}"
$dialog.InitialDirectory = [Environment]::GetFolderPath('Desktop')
$result = $dialog.ShowDialog()
if ($result -eq [System.Windows.Forms.DialogResult]::OK) { Write-Output $dialog.FileName } else { Write-Output "" }
`;

  const ps = spawn('powershell', [
    '-WindowStyle', 'Hidden', '-NoProfile', '-Command', psScript
  ], {
    windowsHide: true,
    stdio: ['pipe', 'pipe', 'pipe']
  });

  let stdout = '';
  ps.stdout.on('data', d => { stdout += d.toString(); });
  ps.on('close', code => {
    const destPath = stdout.trim();
    if (!destPath) return res.json({ cancelled: true });
    try {
      fs.copyFileSync(srcPath, destPath);
      res.json({ success: true, destPath });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });
  ps.on('error', err => res.status(500).json({ error: err.message }));
});

// ==================== API: URL 转换 ====================
app.post('/api/convert-url', async (req, res) => {
  try {
    const { url } = req.body;
    if (!url) return res.status(400).json({ error: '请提供网页URL' });

    const opts = parseOptions(req.body);
    const ext = opts.outputType === 'png' ? 'png' : 'pdf';
    console.log(`[URL转换] ${url} -> ${ext}`);

    const buffer = opts.outputType === 'png'
      ? await generatePNG(url, opts)
      : await generatePDF(url, opts);

    const baseName = opts.saveName
      || new URL(url).hostname.replace(/[^a-zA-Z0-9\u4e00-\u9fa5_-]/g, '_');
    const filename = `${baseName}_${Date.now()}.${ext}`;

    fs.writeFileSync(path.join(outputDir, filename), buffer);
    res.json({
      success: true,
      filename,
      size: buffer.length,
      downloadUrl: `/api/download/${filename}`
    });
  } catch (err) {
    console.error('[URL转换失败]', err.message);
    res.status(500).json({ error: `转换失败: ${err.message}` });
  }
});

// ==================== API: 本地路径转换（自动关联资源） ====================
app.post('/api/convert-path', async (req, res) => {
  let workDir = null;
  try {
    const { filePath } = req.body;
    if (!filePath) return res.status(400).json({ error: '请提供本地文件路径' });
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({ error: `文件不存在: ${filePath}` });
    }

    const opts = parseOptions(req.body);
    const ext = opts.outputType === 'png' ? 'png' : 'pdf';

    workDir = path.join(tempDir, crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(workDir, { recursive: true });

    console.log(`[路径转换] ${filePath}`);
    const { htmlPath, resourceCount } = copyWithResources(filePath, workDir);
    console.log(`[路径转换] 已复制 ${resourceCount} 个关联资源`);

    const pageUrl = toFileUrl(htmlPath);
    const buffer = opts.outputType === 'png'
      ? await generatePNG(pageUrl, opts)
      : await generatePDF(pageUrl, opts);

    const baseName = opts.saveName
      || path.basename(filePath, path.extname(filePath));
    const filename = `${baseName}_${Date.now()}.${ext}`;

    fs.writeFileSync(path.join(outputDir, filename), buffer);
    cleanTemp(workDir);

    res.json({
      success: true,
      filename,
      size: buffer.length,
      downloadUrl: `/api/download/${filename}`,
      resourceCount
    });
  } catch (err) {
    console.error('[路径转换失败]', err.message);
    cleanTemp(workDir);
    res.status(500).json({ error: `转换失败: ${err.message}` });
  }
});

// ==================== API: 上传文件/ZIP 转换 ====================
app.post('/api/convert-file', upload.single('htmlFile'), async (req, res) => {
  let workDir = null;
  try {
    if (!req.file) return res.status(400).json({ error: '请上传HTML或ZIP文件' });

    const fileExt = path.extname(req.file.originalname).toLowerCase();
    const opts = parseOptions(req.body);
    const outExt = opts.outputType === 'png' ? 'png' : 'pdf';

    let htmlPath;
    workDir = path.join(tempDir, crypto.randomBytes(8).toString('hex'));
    fs.mkdirSync(workDir, { recursive: true });

    if (fileExt === '.zip') {
      new AdmZip(req.file.path).extractAllTo(workDir, true);
      htmlPath = findHtmlFile(workDir);
      if (!htmlPath) throw new Error('ZIP文件中未找到HTML文件');
      console.log(`[ZIP转换] ${req.file.originalname} -> ${htmlPath}`);
    } else {
      htmlPath = path.join(workDir, req.file.originalname);
      fs.copyFileSync(req.file.path, htmlPath);
      console.log(`[文件转换] ${req.file.originalname}`);
    }

    const pageUrl = toFileUrl(htmlPath);
    const buffer = opts.outputType === 'png'
      ? await generatePNG(pageUrl, opts)
      : await generatePDF(pageUrl, opts);

    const baseName = opts.saveName
      || path.basename(req.file.originalname, path.extname(req.file.originalname));
    const filename = `${baseName}_${Date.now()}.${outExt}`;

    fs.writeFileSync(path.join(outputDir, filename), buffer);
    cleanTemp(workDir);
    if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);

    res.json({
      success: true,
      filename,
      size: buffer.length,
      downloadUrl: `/api/download/${filename}`
    });
  } catch (err) {
    console.error('[文件转换失败]', err.message);
    cleanTemp(workDir);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: `转换失败: ${err.message}` });
  }
});

// ==================== API: 下载 ====================
app.get('/api/download/:filename', (req, res) => {
  const filepath = path.join(outputDir, req.params.filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  const downloadName = req.query.name || 'output';
  const ext = path.extname(req.params.filename);
  res.download(filepath, downloadName + ext);
});

// ==================== API: 预览 ====================
app.get('/api/preview/:filename', (req, res) => {
  const filepath = path.join(outputDir, req.params.filename);
  if (!fs.existsSync(filepath)) {
    return res.status(404).json({ error: '文件不存在' });
  }
  const ext = path.extname(req.params.filename).toLowerCase();
  res.setHeader('Content-Type', ext === '.png' ? 'image/png' : 'application/pdf');
  res.sendFile(filepath);
});

// ==================== 定时清理 ====================
setInterval(() => {
  const now = Date.now();
  const tenMinutes = 10 * 60 * 1000;
  [outputDir, tempDir].forEach(dir => {
    if (!fs.existsSync(dir)) return;
    fs.readdirSync(dir).forEach(name => {
      const p = path.join(dir, name);
      try {
        if (now - fs.statSync(p).mtimeMs > tenMinutes) {
          fs.rmSync(p, { recursive: true, force: true });
          console.log(`[清理] ${p}`);
        }
      } catch (e) {
        // 忽略
      }
    });
  });
}, 10 * 60 * 1000);

// ==================== 优雅退出 ====================
process.on('SIGINT', async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  if (browser) {
    await browser.close();
    browser = null;
  }
  process.exit(0);
});

// ==================== 启动 ====================
app.listen(PORT, () => {
  console.log(`\n  印迹 网页转PDF/PNG工具 已启动`);
  console.log(`  本地访问: http://localhost:${PORT}\n`);
});