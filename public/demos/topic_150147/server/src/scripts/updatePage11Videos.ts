import db from '../config/database';

const updates = [
  { id: 122, url: 'https://www.bilibili.com/video/BV1mr4y1f7uu/', title: '购物小达人' },
  { id: 123, url: 'https://www.bilibili.com/video/BV1N44y1J7qW/', title: '时间管理员' },
  { id: 124, url: 'https://www.bilibili.com/video/BV1MG3qzFE3n/', title: '趣味数独挑战' },
  { id: 132, url: 'https://www.bilibili.com/video/BV12S4y1r7rm/', title: '恐龙时代探秘' },
];

for (const x of updates) {
  db.prepare('UPDATE tasks SET external_video_url = ? WHERE id = ?').run(x.url, x.id);
  const t = db.prepare('SELECT display_order, title, external_video_url FROM tasks WHERE id = ?').get(x.id) as any;
  console.log('#' + String(t.display_order).padStart(3, '0') + ' ' + t.title);
  console.log('  ' + t.external_video_url.replace('https://www.bilibili.com/video/', ''));
}
console.log('\n视频更新完成');
