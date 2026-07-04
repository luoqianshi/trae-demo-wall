/**
 * 字段配置 IPC 处理器
 */
let _getDb = null;

function uid(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10);
}

function registerFieldHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('list-field-config', () => {
    const db = _getDb();
    const rows = db.prepare('SELECT * FROM field_config ORDER BY orderIndex ASC, key ASC').all();
    return rows.map(r => parseFieldRow(r));
  });

  ipcMain.handle('add-field', (_, data) => {
    const db = _getDb();
    const maxOrder = db.prepare('SELECT MAX(orderIndex) as m FROM field_config').get();
    db.prepare(`
      INSERT INTO field_config (key, label, type, visible, orderIndex, options, defaultValue, showInQuickAdd, jumperMode)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      data.key || uid('field'),
      data.label || '',
      data.type || 'text',
      data.visible !== undefined ? (data.visible ? 1 : 0) : 1,
      ((maxOrder && maxOrder.m) || 0) + 1,
      JSON.stringify(data.options || []),
      data.defaultValue || '',
      data.showInQuickAdd ? 1 : 0,
      data.jumperMode || 'person'
    );
    return { ok: true };
  });

  ipcMain.handle('update-field', (_, data) => {
    const db = _getDb();
    db.prepare(`
      UPDATE field_config SET label = ?, type = ?, visible = ?, orderIndex = ?, options = ?, defaultValue = ?, showInQuickAdd = ?, jumperMode = ?
      WHERE key = ?
    `).run(
      data.label || '',
      data.type || 'text',
      data.visible ? 1 : 0,
      data.orderIndex || 0,
      JSON.stringify(data.options || []),
      data.defaultValue || '',
      data.showInQuickAdd ? 1 : 0,
      data.jumperMode || 'person',
      data.key
    );
    return { ok: true };
  });

  ipcMain.handle('delete-field', (_, key) => {
    const db = _getDb();
    const row = db.prepare('SELECT key FROM field_config WHERE key = ?').get(key);
    if (!row) return { ok: false, error: '字段不存在' };
    db.prepare('DELETE FROM field_config WHERE key = ?').run(key);
    return { ok: true };
  });
}

function parseFieldRow(r) {
  let options = [];
  try { options = JSON.parse(r.options || '[]'); } catch (_) {}
  return {
    key: r.key,
    label: r.label,
    type: r.type,
    visible: !!r.visible,
    orderIndex: r.orderIndex,
    options,
    defaultValue: r.defaultValue || '',
    showInQuickAdd: !!r.showInQuickAdd,
    jumperMode: r.jumperMode || 'person'
  };
}

module.exports = {
  registerFieldHandlers,
  parseFieldRow
};
