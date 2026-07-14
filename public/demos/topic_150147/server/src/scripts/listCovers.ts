import db from '../config/database';

const tasks = db.prepare(
  'SELECT id, display_order, title, category, cover_image FROM tasks WHERE display_order >= 121 ORDER BY display_order'
).all() as any[];

tasks.forEach((t: any) => {
  console.log('#' + String(t.display_order).padStart(3, '0') + ' ID=' + t.id + ' [' + t.category + '] ' + t.title);
  console.log('     cover: ' + (t.cover_image ? t.cover_image.split('/').pop() : '无'));
});
