import db from '../config/database';
import fs from 'fs';
import path from 'path';

// 删除旧数据，重新导入
db.exec('DELETE FROM tasks');
db.exec('DELETE FROM task_progress');

const dataPathCandidates = [
  path.join(__dirname, '..', 'data', 'tasks_v3.json'),
  path.join(__dirname, '..', '..', 'src', 'data', 'tasks_v3.json'),
];

let dataPath = '';
for (const p of dataPathCandidates) {
  if (fs.existsSync(p)) { dataPath = p; break; }
}

if (!dataPath) {
  console.error('找不到 tasks_v3.json');
  process.exit(1);
}

const tasks = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
console.log(`读取到 ${tasks.length} 个任务`);

const stmt = db.prepare(
  `INSERT INTO tasks (title, description, category, difficulty, requirements, reference_materials, grade_level, estimated_time, steps_json, ai_video_url, external_video_url, status)
   VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'published')`
);

const insertMany = db.transaction(() => {
  for (const t of tasks) {
    stmt.run(t.title, t.description, t.category, t.difficulty,
      t.requirements || '', t.reference_materials || '', t.grade_level || '', t.estimated_time || '',
      JSON.stringify(t.steps || []), '', '');
  }
});

insertMany();

// 验证
const count = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get() as { cnt: number };
console.log(`数据库现有 ${count.cnt} 个任务`);

// 分类统计
const cats = db.prepare('SELECT category, COUNT(*) as cnt FROM tasks GROUP BY category ORDER BY cnt DESC').all() as any[];
cats.forEach((c: any) => console.log(`  ${c.category}: ${c.cnt}个`));