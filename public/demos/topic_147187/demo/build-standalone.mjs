// 将 dist 目录打包成单一 HTML 文件（使用 Blob URL 方案保证 module 兼容性）
// 用法：node build-standalone.mjs
import { readFileSync, readdirSync, statSync, writeFileSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, 'dist');
const OUTPUT = join(__dirname, 'remote-tutoring-standalone.html');

if (!existsSync(DIST_DIR)) {
  console.error('请先运行 npm run build 生成 dist 目录');
  process.exit(1);
}

const indexHtml = readFileSync(join(DIST_DIR, 'index.html'), 'utf-8');

function readDirRecursive(dir, baseDir = dir) {
  const files = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      files.push(...readDirRecursive(full, baseDir));
    } else {
      files.push({
        path: full,
        relative: full.replace(baseDir, '').replace(/\\/g, '/').replace(/^\//, ''),
      });
    }
  }
  return files;
}

const allFiles = readDirRecursive(DIST_DIR);
const cssFiles = allFiles.filter((f) => f.relative.endsWith('.css'));
const jsFiles = allFiles.filter((f) => f.relative.endsWith('.js') && !f.relative.endsWith('.map'));
const svgFiles = allFiles.filter((f) => f.relative.endsWith('.svg'));

let html = indexHtml;
const placeholders = {};

// 1. 内联所有 CSS
for (const file of cssFiles) {
  const css = readFileSync(file.path, 'utf-8');
  const escapedPath = file.relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<link[^>]*href="\\/${escapedPath}"[^>]*\\/?>`,
    'g'
  );
  const replacement = `<style data-source="${file.relative}">\n${css}\n</style>`;
  html = html.replace(pattern, replacement);
}

// 2. 提取所有 JS 内容并以 base64 形式保存到一个特殊占位符
let jsIndex = 0;
for (const file of jsFiles) {
  const js = readFileSync(file.path, 'utf-8');
  const base64 = Buffer.from(js, 'utf-8').toString('base64');
  const placeholder = `__JS_PLACEHOLDER_${jsIndex}__`;
  placeholders[placeholder] = base64;
  jsIndex++;

  const escapedPath = file.relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<script[^>]*src="\\/${escapedPath}"[^>]*>\\s*<\\/script>|<script[^>]*src="\\/${escapedPath}"[^>]*\\/>`,
    'g'
  );
  const replacement = `<script type="module" data-source="${file.relative}" data-blob="${placeholder}"></script>`;
  html = html.replace(pattern, replacement);
}

// 3. 在 </head> 之前插入 Blob URL 加载器
const loaderScript = `
<script>
(function() {
  const placeholders = ${JSON.stringify(placeholders)};
  function hydrate() {
    document.querySelectorAll('script[data-blob]').forEach((old) => {
      if (old._loaded) return;
      old._loaded = true;
      const placeholder = old.getAttribute('data-blob');
      const base64 = placeholders[placeholder];
      if (!base64) return;
      const js = decodeURIComponent(escape(atob(base64)));
      const type = old.getAttribute('type') || 'text/javascript';
      let blob;
      try {
        blob = new Blob([js], { type: type === 'module' ? 'text/javascript' : type });
      } catch (e) {
        console.error('Blob creation failed', e);
        return;
      }
      const url = URL.createObjectURL(blob);
      const newScript = document.createElement('script');
      newScript.type = type;
      newScript.src = url;
      old.parentNode.replaceChild(newScript, old);
    });
  }
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', hydrate);
  } else {
    hydrate();
  }
  const observer = new MutationObserver(hydrate);
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
`.trim();

html = html.replace('</head>', `${loaderScript}\n</head>`);

// 4. 内联 SVG（base64 data URI）
for (const file of svgFiles) {
  const svg = readFileSync(file.path, 'utf-8');
  const escapedPath = file.relative.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const pattern = new RegExp(
    `<link[^>]*href="\\/${escapedPath}"[^>]*\\/?>`,
    'g'
  );
  const replacement = `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}" />`;
  html = html.replace(pattern, replacement);
}

writeFileSync(OUTPUT, html);
const sizeKB = (Buffer.byteLength(html) / 1024).toFixed(2);
console.log(`打包完成！输出文件: ${OUTPUT}`);
console.log(`文件大小: ${sizeKB} KB`);