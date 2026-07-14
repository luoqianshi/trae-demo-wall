import db from '../config/database';

const tasks = db.prepare(
  'SELECT id, display_order, title FROM tasks WHERE display_order BETWEEN 167 AND 172 ORDER BY display_order'
).all() as any[];

tasks.forEach((t: any) => console.log('ID=' + t.id + ' #' + String(t.display_order).padStart(3, '0') + ' ' + t.title));
