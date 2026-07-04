/**
 * 字段配置模块
 * 负责字段的增删改查操作
 */
const { getDb } = require('./db-utils');

/**
 * 获取所有字段配置
 */
function listFields() {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare('SELECT * FROM field_config ORDER BY orderIndex').all();
  return rows.map(r => ({
    ...r,
    options: JSON.parse(r.options || '[]'),
    visible: !!r.visible,
    showInQuickAdd: !!r.showInQuickAdd,
    jumperMode: r.jumperMode || 'person'
  }));
}

/**
 * 获取单个字段
 */
function getField(key) {
  const db = getDb();
  if (!db) return null;
  const row = db.prepare('SELECT * FROM field_config WHERE key = ?').get(key);
  if (!row) return null;
  return {
    ...row,
    options: JSON.parse(row.options || '[]'),
    visible: !!row.visible,
    showInQuickAdd: !!row.showInQuickAdd,
    jumperMode: row.jumperMode || 'person'
  };
}

/**
 * 创建字段
 */
function createField(data) {
  const db = getDb();
  if (!db) return false;

  db.prepare(`
    INSERT INTO field_config (key, label, type, visible, orderIndex, options, defaultValue, showInQuickAdd, jumperMode)
    VALUES (@key, @label, @type, @visible, @orderIndex, @options, @defaultValue, @showInQuickAdd, @jumperMode)
  `).run({
    key: data.key,
    label: data.label,
    type: data.type || 'text',
    visible: data.visible ? 1 : 0,
    orderIndex: data.orderIndex || 0,
    options: JSON.stringify(data.options || []),
    defaultValue: data.defaultValue || '',
    showInQuickAdd: data.showInQuickAdd ? 1 : 0,
    jumperMode: data.jumperMode || 'person'
  });

  return true;
}

/**
 * 更新字段
 */
function updateField(key, data) {
  const db = getDb();
  if (!db) return false;

  const sets = [];
  const params = { key };

  if (data.label !== undefined) { sets.push('label = @label'); params.label = data.label; }
  if (data.type !== undefined) { sets.push('type = @type'); params.type = data.type; }
  if (data.visible !== undefined) { sets.push('visible = @visible'); params.visible = data.visible ? 1 : 0; }
  if (data.orderIndex !== undefined) { sets.push('orderIndex = @orderIndex'); params.orderIndex = data.orderIndex; }
  if (data.options !== undefined) { sets.push('options = @options'); params.options = JSON.stringify(data.options); }
  if (data.defaultValue !== undefined) { sets.push('defaultValue = @defaultValue'); params.defaultValue = data.defaultValue; }
  if (data.showInQuickAdd !== undefined) { sets.push('showInQuickAdd = @showInQuickAdd'); params.showInQuickAdd = data.showInQuickAdd ? 1 : 0; }
  if (data.jumperMode !== undefined) { sets.push('jumperMode = @jumperMode'); params.jumperMode = data.jumperMode || 'person'; }

  if (sets.length === 0) return false;

  db.prepare(`UPDATE field_config SET ${sets.join(', ')} WHERE key = @key`).run(params);
  return true;
}

/**
 * 删除字段
 */
function deleteField(key) {
  const db = getDb();
  if (!db) return false;
  db.prepare('DELETE FROM field_config WHERE key = ?').run(key);
  return true;
}

module.exports = {
  listFields,
  getField,
  createField,
  updateField,
  deleteField
};
