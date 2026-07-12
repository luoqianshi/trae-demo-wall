const fs = require('fs');
const path = require('path');

const DIST_DIR = path.join(__dirname, 'dist', 'trae-guard');
const SRC_DIR = __dirname;

const filesToCopy = [
  'package.json',
  '启动TRAE-Guard.bat',
  '新建TRAE窗口.bat',
  'inspect.bat',
  '演示模式.bat',
  '使用说明.txt',
  'config.example.json',
  'demo.js'
];

const dirsToCopy = [
  'src'
];

function ensureDir(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src, dest) {
  ensureDir(path.dirname(dest));
  fs.copyFileSync(src, dest);
  console.log(`  复制: ${path.relative(SRC_DIR, src)}`);
}

function copyDir(src, dest) {
  ensureDir(dest);
  const entries = fs.readdirSync(src, { withFileTypes: true });
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(srcPath, destPath);
    } else {
      copyFile(srcPath, destPath);
    }
  }
}

console.log('═══════════════════════════════════════════════');
console.log('  TRAE Guard - 构建发布包');
console.log('═══════════════════════════════════════════════');
console.log();

ensureDir(DIST_DIR);
console.log(`输出目录: ${DIST_DIR}`);
console.log();

console.log('[1/3] 复制必要文件...');
for (const file of filesToCopy) {
  const src = path.join(SRC_DIR, file);
  const dest = path.join(DIST_DIR, file);
  if (fs.existsSync(src)) {
    copyFile(src, dest);
  } else {
    console.log(`  跳过 (不存在): ${file}`);
  }
}

console.log();
console.log('[2/3] 复制源码目录...');
for (const dir of dirsToCopy) {
  const src = path.join(SRC_DIR, dir);
  const dest = path.join(DIST_DIR, dir);
  if (fs.existsSync(src)) {
    copyDir(src, dest);
  }
}

console.log();
console.log('[3/3] 创建快速启动脚本...');

const quickStart = `@echo off
chcp 65001 >nul
echo.
echo ========================================
echo   TRAE Guard 快速启动
echo ========================================
echo.
call "启动TRAE-Guard.bat"
`;
fs.writeFileSync(path.join(DIST_DIR, '双击启动.bat'), quickStart, 'utf8');
console.log('  创建: 双击启动.bat');

console.log();
console.log('═══════════════════════════════════════════════');
console.log('  构建完成！');
console.log();
console.log(`  发布包位置: ${DIST_DIR}`);
console.log();
console.log('  你可以将 trae-guard 文件夹压缩后发送给他人，');
console.log('  或者直接在本机使用。使用方法请看「使用说明.txt」');
console.log('═══════════════════════════════════════════════');
