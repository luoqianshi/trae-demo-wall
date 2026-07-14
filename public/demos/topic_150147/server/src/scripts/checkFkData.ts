import db from '../config/database';

const fkTables = ['comments', 'favorites', 'ratings', 'submissions', 'task_progress'];
console.log('=== 关联表数据量 ===');
for (const t of fkTables) {
  const r = db.prepare(`SELECT COUNT(*) as cnt FROM ${t}`).get() as any;
  console.log(`  ${t}: ${r.cnt} 条`);
}

console.log('\n=== sqlite_sequence ===');
const seq = db.prepare("SELECT * FROM sqlite_sequence WHERE name='tasks'").get() as any;
console.log('  tasks:', seq);
