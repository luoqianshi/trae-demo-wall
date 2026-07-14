import db from '../config/database';

const tasks = db.prepare(
  "SELECT id, title, external_video_url FROM tasks WHERE title LIKE '%鸡蛋%' OR title LIKE '%电动机%'"
).all() as any[];

tasks.forEach(t => {
  console.log(`[${t.id}] ${t.title}`);
  console.log(`    ${t.external_video_url}`);
  console.log('');
});