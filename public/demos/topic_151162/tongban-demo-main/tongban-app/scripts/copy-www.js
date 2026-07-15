const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');
const SRC_DIR = path.resolve(PROJECT_ROOT, '..');
const WWW_DIR = path.join(PROJECT_ROOT, 'www');

function copyFile(src, dest) {
  fs.copyFileSync(src, dest);
  console.log(`  Copy: ${path.basename(src)} -> ${path.relative(PROJECT_ROOT, dest)}`);
}

console.log('=== 瞳伴App - 同步源码到www目录 ===\n');

console.log('同步主页面文件...');
copyFile(
  path.join(SRC_DIR, 'tongban-demo.html'),
  path.join(WWW_DIR, 'index.html')
);

console.log('\n同步JS文件...');
const jsDir = path.join(WWW_DIR, 'js');
if (!fs.existsSync(jsDir)) {
  fs.mkdirSync(jsDir, { recursive: true });
}

copyFile(
  path.join(SRC_DIR, 'App.js'),
  path.join(jsDir, 'app.js')
);
copyFile(
  path.join(SRC_DIR, 'fence.js'),
  path.join(jsDir, 'fence.js')
);

console.log('\n更新index.html移动端适配...');
let html = fs.readFileSync(path.join(WWW_DIR, 'index.html'), 'utf-8');

html = html.replace(
  '<meta name="viewport" content="width=device-width, initial-scale=1.0">',
  '<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0, user-scalable=no, viewport-fit=cover">'
);

html = html.replace(
  '<title>瞳伴 - AI出行助手 Demo</title>',
  '<title>瞳伴 - AI出行助手</title>'
);

const headExtra = `
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<meta name="apple-mobile-web-app-title" content="瞳伴">
<meta name="theme-color" content="#FFFFFF">
<meta name="mobile-web-app-capable" content="yes">
<meta name="format-detection" content="telephone=no">`;

html = html.replace(
  '<meta name="viewport"',
  headExtra.trim() + '\n<meta name="viewport"'
);

html = html.replace(
  '<script src="app.js"></script>\n<script src="fence.js"></script>',
  '<script src="cordova.js"></script>\n<script src="js/cordova-app.js"></script>\n<script src="js/app.js"></script>\n<script src="js/fence.js"></script>'
);

fs.writeFileSync(path.join(WWW_DIR, 'index.html'), html);
console.log('  index.html 已更新移动端配置');

console.log('\n=== 同步完成 ===');
console.log(`输出目录: ${WWW_DIR}`);
