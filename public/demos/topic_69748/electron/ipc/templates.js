/**
 * 模板配置 IPC 处理器
 */
let _getDb = null;

function uid(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function registerTemplateHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('list-templates', () => {
    const db = _getDb();
    const rows = db.prepare('SELECT * FROM progress_template ORDER BY createdAt ASC').all();
    return rows.map(r => parseTemplateRow(r));
  });

  ipcMain.handle('add-template', (_, data) => {
    const db = _getDb();
    const id = data.id || uid('tpl');
    db.prepare('INSERT INTO progress_template (id, name, fields, createdAt) VALUES (?, ?, ?, ?)')
      .run(id, data.name || '', JSON.stringify(data.fields || []), todayStr());
    return id;
  });

  ipcMain.handle('update-template', (_, data) => {
    const db = _getDb();
    db.prepare('UPDATE progress_template SET name = ?, fields = ? WHERE id = ?')
      .run(data.name || '', JSON.stringify(data.fields || []), data.id);
    return { ok: true };
  });

  ipcMain.handle('delete-template', (_, id) => {
    const db = _getDb();
    db.prepare('DELETE FROM progress_template WHERE id = ?').run(id);
    return { ok: true };
  });
}

function parseTemplateRow(r) {
  let fields = [];
  try { fields = JSON.parse(r.fields || '[]'); } catch (_) {}
  return {
    id: r.id,
    name: r.name,
    createdAt: r.createdAt,
    fields
  };
}

module.exports = {
  registerTemplateHandlers,
  parseTemplateRow
};
