const fs = require('fs');
const path = require('path');

const PROJECT_ROOT = path.resolve(__dirname, '..');

const dirsToClean = [
  path.join(PROJECT_ROOT, 'platforms'),
  path.join(PROJECT_ROOT, 'plugins')
];

console.log('=== 清理构建产物 ===\n');

for (const dir of dirsToClean) {
  if (fs.existsSync(dir)) {
    console.log(`清理: ${path.relative(PROJECT_ROOT, dir)}`);
    fs.rmSync(dir, { recursive: true, force: true });
    console.log('  ✓ 已删除');
  } else {
    console.log(`跳过: ${path.relative(PROJECT_ROOT, dir)} (不存在)`);
  }
}

console.log('\n=== 清理完成 ===');
