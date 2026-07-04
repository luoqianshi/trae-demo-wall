/**
 * 知识库 IPC 处理器
 */
let _getDb = null;

function uid(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10);
}

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function parseJSONSafe(s, fallback) {
  try { return JSON.parse(s); } catch (_) { return fallback; }
}

function registerKnowledgeHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  // 分类
  ipcMain.handle('list-categories', () => {
    const db = _getDb();
    return db.prepare('SELECT * FROM knowledge_category ORDER BY orderIndex ASC, createdAt ASC').all();
  });

  ipcMain.handle('add-category', (_, data) => {
    const db = _getDb();
    const id = data.id || uid('kc');
    const maxOrder = db.prepare('SELECT MAX(orderIndex) as m FROM knowledge_category').get();
    db.prepare(`
      INSERT INTO knowledge_category (id, name, description, orderIndex, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `).run(id, data.name || '', data.description || '', ((maxOrder && maxOrder.m) || 0) + 1, todayStr());
    return id;
  });

  ipcMain.handle('update-category', (_, data) => {
    const db = _getDb();
    db.prepare('UPDATE knowledge_category SET name = ?, description = ?, orderIndex = ? WHERE id = ?')
      .run(data.name || '', data.description || '', data.orderIndex || 0, data.id);
    return { ok: true };
  });

  ipcMain.handle('delete-category', (_, id) => {
    const db = _getDb();
    db.prepare('DELETE FROM knowledge_category WHERE id = ?').run(id);
    return { ok: true };
  });

  // 知识条目
  ipcMain.handle('list-knowledge', (_, categoryId) => {
    const db = _getDb();
    const rows = categoryId
      ? db.prepare('SELECT * FROM knowledge_item WHERE categoryId = ? ORDER BY updatedAt DESC').all(categoryId)
      : db.prepare('SELECT * FROM knowledge_item ORDER BY updatedAt DESC').all();
    return rows.map(r => parseKnowledgeRow(r));
  });

  ipcMain.handle('search-knowledge', (_, keyword, tag) => {
    const db = _getDb();
    let sql = 'SELECT * FROM knowledge_item WHERE 1=1';
    const params = [];
    if (keyword) {
      sql += ' AND (title LIKE ? OR content LIKE ?)';
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    if (tag) {
      sql += ' AND tags LIKE ?';
      params.push(`%${tag}%`);
    }
    sql += ' ORDER BY updatedAt DESC';
    const rows = db.prepare(sql).all(...params);
    return rows.map(r => parseKnowledgeRow(r));
  });

  ipcMain.handle('add-knowledge', (_, data) => {
    const db = _getDb();
    const id = uid('ki');
    const now = todayStr();
    const tags = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || '');
    db.prepare(`
      INSERT INTO knowledge_item (id, categoryId, title, content, tags, filePaths, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, data.categoryId || '', data.title || '', data.content || '', tags,
      JSON.stringify(data.filePaths || []), now, now);
    return id;
  });

  ipcMain.handle('update-knowledge', (_, data) => {
    const db = _getDb();
    const tags = Array.isArray(data.tags) ? data.tags.join(',') : (data.tags || '');
    db.prepare(`
      UPDATE knowledge_item SET categoryId = ?, title = ?, content = ?, tags = ?, filePaths = ?, updatedAt = ?
      WHERE id = ?
    `).run(data.categoryId || '', data.title || '', data.content || '', tags,
      JSON.stringify(data.filePaths || []), todayStr(), data.id);
    return { ok: true };
  });

  ipcMain.handle('delete-knowledge', (_, id) => {
    const db = _getDb();
    db.prepare('DELETE FROM knowledge_item WHERE id = ?').run(id);
    return { ok: true };
  });
}

function parseKnowledgeRow(r) {
  return {
    ...r,
    tags: (r.tags || '').split(',').map(s => s.trim()).filter(Boolean),
    filePaths: parseJSONSafe(r.filePaths, [])
  };
}

module.exports = { registerKnowledgeHandlers };
