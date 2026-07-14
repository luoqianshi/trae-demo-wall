import db from '../config/database';

const tasks = db.prepare('SELECT id, title, category, cover_image FROM tasks ORDER BY category, id').all() as any[];

console.log('总任务数:', tasks.length);

const cats: Record<string, number> = {};
tasks.forEach(t => {
  if (!cats[t.category]) cats[t.category] = 0;
  cats[t.category]++;
});
console.log('分类统计:', JSON.stringify(cats, null, 2));

console.log('\n=== 生活实践类 ===');
tasks.filter(t => t.category === 'life').forEach(t => {
  const img = t.cover_image ? t.cover_image.split('/').pop() : '(无)';
  console.log(`  [${t.id}] ${t.title} -> ${img}`);
});

console.log('\n=== 人文社科类 ===');
tasks.filter(t => t.category === 'humanities').forEach(t => {
  const img = t.cover_image ? t.cover_image.split('/').pop() : '(无)';
  console.log(`  [${t.id}] ${t.title} -> ${img}`);
});

console.log('\n=== 创意制作类 ===');
tasks.filter(t => t.category === 'creative').forEach(t => {
  const img = t.cover_image ? t.cover_image.split('/').pop() : '(无)';
  console.log(`  [${t.id}] ${t.title} -> ${img}`);
});