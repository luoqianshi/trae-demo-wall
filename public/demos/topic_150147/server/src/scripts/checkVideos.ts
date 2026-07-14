import db from '../config/database';

const total = db.prepare('SELECT COUNT(*) as cnt FROM tasks').get() as { cnt: number };
const hasVideo = db.prepare("SELECT COUNT(*) as cnt FROM tasks WHERE external_video_url IS NOT NULL AND external_video_url != ''").get() as { cnt: number };
const sample = db.prepare("SELECT id, title, category, external_video_url FROM tasks WHERE external_video_url != '' LIMIT 5").all();
const noVideo = db.prepare("SELECT category, COUNT(*) as cnt FROM tasks WHERE external_video_url IS NULL OR external_video_url = '' GROUP BY category").all();

console.log(`有视频链接: ${hasVideo.cnt} / ${total.cnt}`);
console.log('');
if (sample.length > 0) {
  (sample as any[]).forEach((t: any) => console.log(`  [${t.id}] ${t.title}: ${t.external_video_url}`));
} else {
  console.log('没有任何视频链接，需要重新运行 batchUpdateVideos.ts');
  console.log('');
  // 按分类看看哪些任务没有视频
  console.log('无视频链接的任务分布:');
  (noVideo as any[]).forEach((c: any) => console.log(`  ${c.category}: ${c.cnt}个`));
}
