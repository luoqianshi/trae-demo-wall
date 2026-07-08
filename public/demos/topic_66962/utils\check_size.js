// 检查项目文件大小
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function getSize(dir) {
  let total = 0;
  const items = [];
  function walk(d) {
    const files = fs.readdirSync(d);
    for (const f of files) {
      const fp = path.join(d, f);
      const stat = fs.statSync(fp);
      if (stat.isDirectory()) walk(fp);
      else {
        total += stat.size;
        items.push({ name: fp.replace(root + '\\', ''), size: stat.size });
      }
    }
  }
  walk(dir);
  return { total, items };
}

const result = getSize(root);
console.log(`📦 总大小: ${(result.total / 1024 / 1024).toFixed(2)} MB`);
console.log(`微信小程序主包限制: 2 MB\n`);

// 按目录分组
const dirs = {};
for (const item of result.items) {
  const dir = path.dirname(item.name).split('\\')[0];
  dirs[dir] = (dirs[dir] || 0) + item.size;
}

console.log('各目录大小:');
for (const [d, s] of Object.entries(dirs).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${d}: ${(s/1024/1024).toFixed(2)} MB`);
}

// 找出最大的文件
console.log('\n最大文件 Top 10:');
result.items
  .sort((a, b) => b.size - a.size)
  .slice(0, 10)
  .forEach((item, i) => {
    console.log(`  ${i+1}. ${item.name} (${(item.size/1024).toFixed(1)} KB)`);
  });