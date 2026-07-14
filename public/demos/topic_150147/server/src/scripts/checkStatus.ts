import db from '../config/database';

// 1. 检查数据库中的任务
const tasks = db.prepare('SELECT id, title, cover_image FROM tasks ORDER BY id').all() as any[];
console.log('=== 数据库任务总数:', tasks.length);
console.log('=== ID范围:', tasks[0]?.id, '~', tasks[tasks.length-1]?.id);

// 2. 统计cover_image情况
const withCover = tasks.filter(t => t.cover_image).length;
const withoutCover = tasks.filter(t => !t.cover_image).length;
console.log('=== 有封面:', withCover, '| 无封面:', withoutCover);

if (withoutCover > 0) {
  console.log('=== 没有封面的任务:');
  tasks.filter(t => !t.cover_image).forEach(t => console.log(`  ID=${t.id} ${t.title}`));
}

// 3. 检查已生成的v4封面文件
import fs from 'fs';
import path from 'path';
const coverDir = path.join(__dirname, '..', '..', 'public', 'images');
const v4Files = fs.readdirSync(coverDir).filter(f => f.match(/_v4\.png$/));
console.log(`\n=== v4封面文件数: ${v4Files.length}`);

// 提取ID
const v4Ids = new Set(v4Files.map(f => parseInt(f.match(/task_cover_(\d+)_v4/)![1])));
const missingInDb = tasks.filter(t => !v4Ids.has(t.id));
console.log('=== 数据库中无对应v4封面的任务:', missingInDb.length);
missingInDb.forEach(t => console.log(`  ID=${t.id} ${t.title}`));
