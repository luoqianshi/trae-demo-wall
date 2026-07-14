import db from '../config/database';

console.log('=== 所有表 ===');
const tables = db.prepare(
  "SELECT name FROM sqlite_master WHERE type='table' ORDER BY name"
).all() as any[];
tables.forEach(t => console.log('  ' + t.name));

console.log('\n=== tasks 表结构 ===');
const cols = db.prepare("PRAGMA table_info(tasks)").all() as any[];
cols.forEach(c => console.log(`  ${c.name}  ${c.type}  pk=${c.pk}`));

console.log('\n=== 有 task_id 外键的表 ===');
const fkTables: string[] = [];
for (const t of tables) {
  try {
    const fks = db.prepare(`PRAGMA foreign_key_list(${t.name})`).all() as any[];
    const taskFks = fks.filter((f: any) => f.table === 'tasks');
    if (taskFks.length > 0) {
      console.log(`  ${t.name}:`);
      taskFks.forEach((f: any) => console.log(`    ${f.from} -> tasks.${f.to}`));
      fkTables.push(t.name);
    }
  } catch (e) {}
}

console.log('\n=== tasks 总数 & ID范围 ===');
const stat = db.prepare('SELECT COUNT(*) as cnt, MIN(id) as minId, MAX(id) as maxId, MIN(display_order) as minOrder, MAX(display_order) as maxOrder FROM tasks').get() as any;
console.log(`  总数: ${stat.cnt}`);
console.log(`  id 范围: ${stat.minId} - ${stat.maxId}`);
console.log(`  display_order 范围: ${stat.minOrder} - ${stat.maxOrder}`);

console.log('\n=== 前5个和后5个 ===');
const first5 = db.prepare('SELECT id, display_order, title FROM tasks ORDER BY id LIMIT 5').all() as any[];
const last5 = db.prepare('SELECT id, display_order, title FROM tasks ORDER BY id DESC LIMIT 5').all() as any[];
console.log('  前5:');
first5.forEach(t => console.log(`    id=${t.id} #${t.display_order} ${t.title}`));
console.log('  后5:');
last5.forEach(t => console.log(`    id=${t.id} #${t.display_order} ${t.title}`));

console.log('\n=== id 和 display_order 不一致的 ===');
const mismatch = db.prepare('SELECT id, display_order, title FROM tasks WHERE id != display_order ORDER BY id LIMIT 20').all() as any[];
console.log(`  共 ${mismatch.length} 个，前20个：`);
mismatch.forEach(t => console.log(`    id=${t.id}  order=${t.display_order}  ${t.title}`));
