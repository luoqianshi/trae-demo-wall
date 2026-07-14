import db from '../config/database';

// 查看所有任务，按类别分组，看哪些有reference_materials哪些没有
const tasks = db.prepare(`
  SELECT id, title, category, reference_materials 
  FROM tasks 
  ORDER BY category, id
`).all() as any[];

const byCategory: Record<string, any[]> = {};
for (const t of tasks) {
  if (!byCategory[t.category]) byCategory[t.category] = [];
  byCategory[t.category].push(t);
}

console.log(`总任务数: ${tasks.length}`);
console.log(`有reference_materials: ${tasks.filter(t => t.reference_materials).length}`);
console.log(`无reference_materials: ${tasks.filter(t => !t.reference_materials).length}`);
console.log();

for (const [cat, catTasks] of Object.entries(byCategory)) {
  console.log(`\n=== ${cat} (${catTasks.length}个) ===`);
  for (const t of catTasks) {
    const hasRef = t.reference_materials ? '✓' : '✗';
    const refPreview = t.reference_materials 
      ? t.reference_materials.substring(0, 80).replace(/\n/g, ' ') 
      : '(无)';
    console.log(`  ${hasRef} [${t.id}] ${t.title}: ${refPreview}`);
  }
}