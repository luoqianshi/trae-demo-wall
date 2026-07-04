/**
 * 知识库模块
 * 负责知识库分类和条目的增删改查操作
 */
const { getDb, todayStr } = require('./db-utils');

/**
 * 获取所有知识库分类
 */
function listCategories() {
  const db = getDb();
  if (!db) return [];
  return db.prepare('SELECT * FROM knowledge_category ORDER BY orderIndex').all();
}

/**
 * 创建分类
 */
function createCategory(data) {
  const db = getDb();
  if (!db) return null;

  const id = data.id || 'C' + Date.now();
  const now = todayStr();

  db.prepare(`
    INSERT INTO knowledge_category (id, name, description, orderIndex, createdAt)
    VALUES (?, ?, ?, ?, ?)
  `).run(id, data.name, data.description || '', data.orderIndex || 0, now);

  return id;
}

/**
 * 更新分类
 */
function updateCategory(id, data) {
  const db = getDb();
  if (!db) return false;

  const sets = [];
  const params = { id };

  if (data.name !== undefined) { sets.push('name = @name'); params.name = data.name; }
  if (data.description !== undefined) { sets.push('description = @description'); params.description = data.description; }
  if (data.orderIndex !== undefined) { sets.push('orderIndex = @orderIndex'); params.orderIndex = data.orderIndex; }

  if (sets.length === 0) return false;

  db.prepare(`UPDATE knowledge_category SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return true;
}

/**
 * 删除分类
 */
function deleteCategory(id) {
  const db = getDb();
  if (!db) return false;
  db.prepare('DELETE FROM knowledge_category WHERE id = ?').run(id);
  return true;
}

/**
 * 获取所有知识库条目
 */
function listKnowledgeItems() {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare('SELECT * FROM knowledge_item ORDER BY id').all();
  return rows.map(r => ({
    ...r,
    tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
    filePaths: JSON.parse(r.filePaths || '[]')
  }));
}

/**
 * 按分类获取知识库条目
 */
function listKnowledgeItemsByCategory(categoryId) {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare('SELECT * FROM knowledge_item WHERE categoryId = ? ORDER BY id').all(categoryId);
  return rows.map(r => ({
    ...r,
    tags: r.tags ? r.tags.split(',').filter(Boolean) : [],
    filePaths: JSON.parse(r.filePaths || '[]')
  }));
}

/**
 * 获取单个知识库条目
 */
function getKnowledgeItem(id) {
  const db = getDb();
  if (!db) return null;
  const row = db.prepare('SELECT * FROM knowledge_item WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    tags: row.tags ? row.tags.split(',').filter(Boolean) : [],
    filePaths: JSON.parse(row.filePaths || '[]')
  };
}

/**
 * 创建知识库条目
 */
function createKnowledgeItem(data) {
  const db = getDb();
  if (!db) return null;

  const id = data.id || 'K' + Date.now();
  const now = todayStr();
  const tags = Array.isArray(data.tags) ? data.tags.join(',') : '';
  const filePaths = JSON.stringify(data.filePaths || []);

  db.prepare(`
    INSERT INTO knowledge_item (id, categoryId, title, content, tags, filePaths, createdAt, updatedAt)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(id, data.categoryId, data.title, data.content || '', tags, filePaths, now, now);

  return id;
}

/**
 * 更新知识库条目
 */
function updateKnowledgeItem(id, data) {
  const db = getDb();
  if (!db) return false;

  const now = todayStr();
  const sets = [];
  const params = { id };

  if (data.categoryId !== undefined) { sets.push('categoryId = @categoryId'); params.categoryId = data.categoryId; }
  if (data.title !== undefined) { sets.push('title = @title'); params.title = data.title; }
  if (data.content !== undefined) { sets.push('content = @content'); params.content = data.content; }
  if (data.tags !== undefined) { sets.push('tags = @tags'); params.tags = Array.isArray(data.tags) ? data.tags.join(',') : ''; }
  if (data.filePaths !== undefined) { sets.push('filePaths = @filePaths'); params.filePaths = JSON.stringify(data.filePaths); }
  sets.push('updatedAt = @updatedAt'); params.updatedAt = now;

  db.prepare(`UPDATE knowledge_item SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return true;
}

/**
 * 删除知识库条目
 */
function deleteKnowledgeItem(id) {
  const db = getDb();
  if (!db) return false;
  db.prepare('DELETE FROM knowledge_item WHERE id = ?').run(id);
  return true;
}

module.exports = {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  listKnowledgeItems,
  listKnowledgeItemsByCategory,
  getKnowledgeItem,
  createKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem
};
