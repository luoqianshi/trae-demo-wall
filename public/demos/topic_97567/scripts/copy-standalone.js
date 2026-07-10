// 复制 Next.js standalone 构建所需的额外资源到 standalone 目录，
// 并清理 standalone 中被 Next.js 文件追踪器错误包含的不必要文件。
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const STANDALONE_DIR = path.join(ROOT, '.next', 'standalone');

// standalone 中不需要的目录（运行时用不到）
const CLEANUP_DIRS = [
  'release',                          // 之前构建的残留（会导致递归膨胀）
  'docs',                             // 文档
  'scripts',                          // 构建脚本
  'electron',                         // Electron 源码（已编译为 .js 并由 electron-builder 单独打包）
  'ai-collaboration-workflow-skill',  // AI 技能文件
  'src',                              // TypeScript 源码（已编译到 .next/server/）
  'data',                             // 开发环境数据库
  'public/ppt-package',               // PPT 演示包
  'public/screenshots',               // 截图
];

// standalone 根目录下不需要的文件
const CLEANUP_FILES = [
  'AGENTS.md',
  'README.md',
  'eslint.config.mjs',
  'postcss.config.mjs',
  'tsconfig.json',
  'vercel.json',
  'vitest.config.ts',
  '报名帖.md',
  '雪球日记-创意展示.html',
];

// public 目录中只有以下子目录/文件是运行时需要的
const KEEP_PUBLIC = [
  'images/snowball-stages',
];

function removePath(target) {
  if (fs.existsSync(target)) {
    fs.rmSync(target, { recursive: true, force: true });
    console.log(`  已删除: ${path.relative(ROOT, target)}`);
  }
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) {
    console.warn(`源目录不存在，跳过: ${src}`);
    return;
  }
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, entry.name);
    const d = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDir(s, d);
    } else {
      fs.copyFileSync(s, d);
    }
  }
}

function main() {
  if (!fs.existsSync(STANDALONE_DIR)) {
    console.error('standalone 目录不存在，请先运行 npm run build');
    process.exit(1);
  }

  // 1. 清理 standalone 中不必要的目录
  console.log('清理 standalone 中不必要的目录...');
  for (const dir of CLEANUP_DIRS) {
    removePath(path.join(STANDALONE_DIR, dir));
  }

  // 2. 清理 standalone 根目录下不必要的文件
  console.log('清理 standalone 中不必要的文件...');
  for (const file of CLEANUP_FILES) {
    removePath(path.join(STANDALONE_DIR, file));
  }

  // 3. 清理 public 目录：删除不需要的文件，只保留运行时必需的
  console.log('精简 public 目录...');
  const publicDir = path.join(STANDALONE_DIR, 'public');
  if (fs.existsSync(publicDir)) {
    for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
      const relPath = entry.name;
      const fullPath = path.join(publicDir, relPath);
      const keep = KEEP_PUBLIC.some(k => relPath === k || relPath.startsWith(k + '/'));
      if (!keep) {
        removePath(fullPath);
      }
    }
  }

  // 4. 复制 .next/static -> standalone/.next/static
  const staticSrc = path.join(ROOT, '.next', 'static');
  const staticDest = path.join(STANDALONE_DIR, '.next', 'static');
  console.log('复制 static 资源...');
  copyDir(staticSrc, staticDest);

  // 5. 确保 public/images/snowball-stages 存在（若被清理则重新复制）
  const stagesSrc = path.join(ROOT, 'public', 'images', 'snowball-stages');
  const stagesDest = path.join(STANDALONE_DIR, 'public', 'images', 'snowball-stages');
  if (fs.existsSync(stagesSrc) && !fs.existsSync(stagesDest)) {
    console.log('复制 snowball-stages 图片...');
    copyDir(stagesSrc, stagesDest);
  }

  console.log('standalone 资源整理完成');
}

main();
