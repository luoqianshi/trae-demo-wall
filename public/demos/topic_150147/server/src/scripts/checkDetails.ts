import db from '../config/database';

// 检查有多少任务已有详细讲解
const tasksWithDetails = db.prepare(
  "SELECT COUNT(*) as total FROM tasks WHERE reference_materials LIKE '%【详细讲解】%'"
).get() as any;
console.log('有详细讲解的任务数:', tasksWithDetails?.total);

const tasksTotal = db.prepare('SELECT COUNT(*) as total FROM tasks').get() as any;
console.log('总任务数:', tasksTotal?.total);
console.log('缺少详细讲解的任务数:', tasksTotal?.total - tasksWithDetails?.total);

// 检查任务181的详细讲解内容
const task181 = db.prepare('SELECT id, title, reference_materials FROM tasks WHERE id = 181').get() as any;
if (task181) {
  console.log('\n--- 任务181: 会跳舞的葡萄干 ---');
  const hasDetail = task181.reference_materials?.includes('【详细讲解】');
  console.log('是否包含【详细讲解】:', hasDetail);
  if (hasDetail && task181.reference_materials) {
    const idx = task181.reference_materials.indexOf('【详细讲解】');
    console.log('详细讲解内容长度:', task181.reference_materials.substring(idx).length);
    console.log('详细讲解前500字:', task181.reference_materials.substring(idx, idx + 500));
  }
}

// 列出缺少详细讲解的任务
const missing = db.prepare(
  "SELECT id, title, category FROM tasks WHERE reference_materials NOT LIKE '%【详细讲解】%' ORDER BY id"
).all() as any[];
console.log('\n--- 缺少详细讲解的任务 ---');
missing.forEach((t: any) => {
  console.log(`  [${t.id}] ${t.title} (${t.category})`);
});