import db from '../config/database';

const ids = [122, 123, 124, 132];
for (const id of ids) {
  const t = db.prepare('SELECT id, display_order, title, external_video_url, cover_image FROM tasks WHERE id = ?').get(id) as any;
  console.log('#' + String(t.display_order).padStart(3, '0') + ' ' + t.title);
  console.log('  视频: ' + (t.external_video_url || '无'));
  console.log('  封面: ' + (t.cover_image || '无'));
  console.log();
}
