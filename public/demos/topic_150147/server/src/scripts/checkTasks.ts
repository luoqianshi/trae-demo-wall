import db from '../config/database';

const tasks = db.prepare('SELECT id, title, category, cover_image FROM tasks ORDER BY category, id').all() as any[];
console.log('总任务数:', tasks.length);

console.log('\n分类分布:');
const cats: Record<string, number> = {};
tasks.forEach(t => { cats[t.category] = (cats[t.category] || 0) + 1; });
Object.entries(cats).sort().forEach(([k, v]) => console.log(`  ${k}: ${v}个`));

console.log('\n前5个任务样例:');
tasks.slice(0, 5).forEach(t => {
  console.log(`  [${t.id}] ${t.title} [${t.category}]`);
});

const noCover = tasks.filter(t => !t.cover_image).length;
console.log(`\n无封面任务数: ${noCover} / ${tasks.length}`);
