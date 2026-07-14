import db from '../config/database';

const updates = [
  { id: 122, url: 'https://www.bilibili.com/video/BV1Sf4y1d7t4/', title: '购物小达人' },
  { id: 123, url: 'https://www.bilibili.com/video/BV17CQaYsEH6/', title: '时间管理员' },
];

for (const x of updates) {
  db.prepare('UPDATE tasks SET external_video_url = ? WHERE id = ?').run(x.url, x.id);
  const t = db.prepare('SELECT display_order, title, external_video_url FROM tasks WHERE id = ?').get(x.id) as any;
  console.log('#' + String(t.display_order).padStart(3, '0') + ' ' + t.title);
  console.log('  ' + t.external_video_url.replace('https://www.bilibili.com/video/', ''));
}
console.log('\n完成');
