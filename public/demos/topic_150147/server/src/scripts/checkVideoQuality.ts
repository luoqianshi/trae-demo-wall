import db from '../config/database';

const tasks = db.prepare(
  "SELECT id, title, category, external_video_url FROM tasks WHERE external_video_url IS NOT NULL AND external_video_url != '' ORDER BY id"
).all() as any[];

console.log(`有视频的任务数: ${tasks.length}`);
console.log('');

console.log('=== 所有任务视频列表 ===');
tasks.forEach((t: any) => {
  console.log(`[${t.id}] ${t.title} (${t.category})`);
  console.log(`    视频: ${t.external_video_url}`);
  console.log('');
});