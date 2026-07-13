// 把 dist 产物内联成单文件 HTML（完全自包含）
import fs from 'fs';
import path from 'path';

const distDir = '/workspace/dist';
let html = fs.readFileSync(path.join(distDir, 'index.html'), 'utf8');

// 1. 内联 CSS
const cssLinks = [...html.matchAll(/href="(\/assets\/[^"]+\.css)"/g)];
for (const m of cssLinks) {
  const cssPath = path.join(distDir, m[1].replace(/^\//, ''));
  const cssContent = fs.readFileSync(cssPath, 'utf8');
  html = html.replace(
    /<link rel="stylesheet" crossorigin href="[^"]+\.css">/,
    `<style>\n${cssContent}\n</style>`
  );
}

// 2. 内联 JS（替换 <script type="module" crossorigin src="...">）
const jsScripts = [...html.matchAll(/src="(\/assets\/[^"]+\.js)"/g)];
for (const m of jsScripts) {
  const jsPath = path.join(distDir, m[1].replace(/^\//, ''));
  const jsContent = fs.readFileSync(jsPath, 'utf8');
  html = html.replace(
    /<script type="module" crossorigin src="[^"]+\.js"><\/script>/,
    `<script type="module">\n${jsContent}\n</script>`
  );
}

// 3. 移除所有 modulepreload 链接（避免外部引用）
html = html.replace(/<link rel="modulepreload"[^>]*>/g, '');

// 4. 内联 favicon
const favicon = fs.readFileSync(path.join(distDir, 'favicon.svg'), 'utf8');
html = html.replace(
  /<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/,
  `<link rel="icon" type="image/svg+xml" href="data:image/svg+xml;base64,${Buffer.from(favicon).toString('base64')}">`
);

// 5. 确保没有遗留的 /assets/ 或 /favicon.svg 外部引用
const remainingAssets = (html.match(/\/assets\/[^"')\s]+/g) || []);
const remainingFavicon = (html.match(/href="\/favicon\.svg"/g) || []);

const outDir = '/workspace';
const outPath = path.join(outDir, '柯基时光.html');
fs.writeFileSync(outPath, html, 'utf8');

const sizeKB = (Buffer.byteLength(html, 'utf8') / 1024).toFixed(2);
console.log(`单文件 HTML 已生成：${outPath}`);
console.log(`文件大小：${sizeKB} KB`);
console.log(`剩余外部 assets 引用数：${remainingAssets.length}`);
console.log(`剩余 favicon.svg 外部引用数：${remainingFavicon.length}`);
if (remainingAssets.length > 0) {
  console.log('⚠️ 仍有外部引用:', remainingAssets.slice(0, 5));
}
