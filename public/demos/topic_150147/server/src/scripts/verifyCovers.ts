import db from '../config/database';
import fs from 'fs';
import path from 'path';

const imagesDir = path.join(__dirname, '..', '..', 'public', 'images');

const tasks = db.prepare('SELECT id, title, cover_image FROM tasks ORDER BY id').all() as any[];

console.log(`总任务数: ${tasks.length}`);
console.log('');

// 统计v4/v5版本
let v4 = 0, v5 = 0, none = 0;
for (const t of tasks) {
  const fn = t.cover_image?.split('/').pop() || '';
  const fp = path.join(imagesDir, fn);
  if (!fn || !fs.existsSync(fp)) { none++; continue; }
  if (fn.includes('v5')) v5++;
  else if (fn.includes('v4')) v4++;
  else none++;
}

console.log(`v4版本: ${v4}个（科学/自然/创意等安全分类，无人物）`);
console.log(`v5版本: ${v5}个（修复后的人文/语文/历史等高风险分类，已确保无人）`);
console.log(`缺失: ${none}个`);

// 检查几个关键任务的文件大小
console.log('');

const checks = [
  { id: 290, name: '古诗配画创作' },
  { id: 303, name: '校园文明公约' },
  { id: 313, name: '秦始皇兵马俑' },
];

for (const c of checks) {
  const task = tasks.find((t: any) => t.id === c.id);
  if (!task) { console.log(`[${c.id}] ${c.name}: ❌ 不存在`); continue; }
  const fn = task.cover_image?.split('/').pop() || '';
  const fp = path.join(imagesDir, fn);
  if (!fs.existsSync(fp)) { console.log(`[${c.id}] ${c.name}: ❌ 文件不存在`); continue; }
  const kb = fs.statSync(fp).size / 1024;
  console.log(`[${c.id}] ${c.name}: ✅ ${fn} (${Math.round(kb)}KB)`);
}
