import db from '../config/database';

console.log('修改前:');
const before = db.prepare('SELECT id, display_order, title FROM tasks ORDER BY id LIMIT 3').all() as any[];
before.forEach(t => console.log(`  id=${t.id}  #${t.display_order}  ${t.title}`));

db.prepare('PRAGMA foreign_keys = OFF').run();

const updateStmt = db.prepare('UPDATE tasks SET id = ? WHERE id = ?');
const tasks = db.prepare('SELECT id, display_order FROM tasks ORDER BY display_order').all() as any[];

const tx = db.transaction(() => {
  for (const t of tasks) {
    if (t.id !== t.display_order) {
      updateStmt.run(t.display_order, t.id);
    }
  }
  db.prepare("UPDATE sqlite_sequence SET seq = 175 WHERE name = 'tasks'").run();
});

tx();

db.prepare('PRAGMA foreign_keys = ON').run();

console.log('\n修改后:');
const after = db.prepare('SELECT id, display_order, title FROM tasks ORDER BY id LIMIT 3').all() as any[];
after.forEach(t => console.log(`  id=${t.id}  #${t.display_order}  ${t.title}`));

const count = db.prepare('SELECT COUNT(*) as cnt FROM tasks WHERE id != display_order').get() as any;
console.log(`\nid != display_order 的数量: ${count.cnt}`);

const range = db.prepare('SELECT MIN(id) as minId, MAX(id) as maxId FROM tasks').get() as any;
console.log(`id 范围: ${range.minId} - ${range.maxId}`);
