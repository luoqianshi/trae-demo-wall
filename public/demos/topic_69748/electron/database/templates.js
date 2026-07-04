/**
 * 模板配置模块
 * 负责进度模板的增删改查操作
 */
const { getDb, todayStr } = require('./db-utils');

/**
 * 获取所有模板
 */
function listTemplates() {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare('SELECT * FROM progress_template ORDER BY id').all();
  return rows.map(r => ({
    ...r,
    fields: JSON.parse(r.fields || '[]')
  }));
}

/**
 * 获取单个模板
 */
function getTemplate(id) {
  const db = getDb();
  if (!db) return null;
  const row = db.prepare('SELECT * FROM progress_template WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    fields: JSON.parse(row.fields || '[]')
  };
}

/**
 * 创建模板
 */
function createTemplate(data) {
  const db = getDb();
  if (!db) return null;

  const id = data.id || 'T' + Date.now();
  const now = todayStr();

  db.prepare(`
    INSERT INTO progress_template (id, name, fields, createdAt)
    VALUES (?, ?, ?, ?)
  `).run(id, data.name, JSON.stringify(data.fields || []), now);

  return id;
}

/**
 * 更新模板
 */
function updateTemplate(id, data) {
  const db = getDb();
  if (!db) return false;

  const sets = [];
  const params = { id };

  if (data.name !== undefined) { sets.push('name = @name'); params.name = data.name; }
  if (data.fields !== undefined) { sets.push('fields = @fields'); params.fields = JSON.stringify(data.fields); }

  if (sets.length === 0) return false;

  db.prepare(`UPDATE progress_template SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return true;
}

/**
 * 删除模板
 */
function deleteTemplate(id) {
  const db = getDb();
  if (!db) return false;
  db.prepare('DELETE FROM progress_template WHERE id = ?').run(id);
  return true;
}

module.exports = {
  listTemplates,
  getTemplate,
  createTemplate,
  updateTemplate,
  deleteTemplate
};
