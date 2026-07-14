import db from '../config/database';

// 列出所有高风险分类的所有任务
const riskyCategories = ['chinese', 'english', 'history', 'humanities', 'politics', 'life', 'ai', 'computer', 'programming'];

const tasks = db.prepare(
  'SELECT id, title, category FROM tasks WHERE category IN (?) ORDER BY category, id'
).all(riskyCategories.join(',')) as any[];

console.log('高风险分类任务数:', tasks.length);
console.log('');
tasks.forEach((t: any) => {
  console.log(`  [${t.id}] ${t.title} [${t.category}]`);
});
