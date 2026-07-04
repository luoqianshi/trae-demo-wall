/**
 * 项目数据库操作模块
 * 负责项目的增删改查操作
 */
const { getDb, genProjectId, todayStr } = require('./db-utils');

/**
 * 获取所有项目列表
 */
function listProjects() {
  const db = getDb();
  if (!db) return [];
  return db.prepare(`
    SELECT id, name, customer, region, status, currentPhase, nextAction,
           imGroup, imContact, attachmentDir, isRecent, progressText,
           attachmentsText, customFields, createdAt, updatedAt
    FROM projects ORDER BY id
  `).all();
}

/**
 * 获取单个项目
 */
function getProject(id) {
  const db = getDb();
  if (!db) return null;
  return db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
}

/**
 * 创建新项目
 */
function createProject(data) {
  const db = getDb();
  if (!db) return null;

  const id = genProjectId();
  const now = todayStr();
  const fields = {
    id,
    name: data.name || '未命名局点',
    customer: data.customer || '',
    region: data.region || '',
    status: data.status || '',
    currentPhase: data.currentPhase || '',
    nextAction: data.nextAction || '',
    imGroup: data.imGroup || '',
    imContact: data.imContact || '',
    attachmentDir: data.attachmentDir || '',
    isRecent: data.isRecent ? 1 : 0,
    progressText: data.progressText || '',
    attachmentsText: data.attachmentsText || '',
    customFields: data.customFields ? JSON.stringify(data.customFields) : '{}',
    createdAt: now,
    updatedAt: now
  };

  db.prepare(`
    INSERT INTO projects (id, name, customer, region, status, currentPhase, nextAction,
      imGroup, imContact, attachmentDir, isRecent, progressText, attachmentsText, customFields, createdAt, updatedAt)
    VALUES (@id, @name, @customer, @region, @status, @currentPhase, @nextAction,
      @imGroup, @imContact, @attachmentDir, @isRecent, @progressText, @attachmentsText, @customFields, @createdAt, @updatedAt)
  `).run(fields);

  return id;
}

/**
 * 更新项目
 */
function updateProject(id, data) {
  const db = getDb();
  if (!db) return false;

  const now = todayStr();
  const fields = {
    id,
    name: data.name,
    customer: data.customer ?? '',
    region: data.region ?? '',
    status: data.status ?? '',
    currentPhase: data.currentPhase ?? '',
    nextAction: data.nextAction ?? '',
    imGroup: data.imGroup ?? '',
    imContact: data.imContact ?? '',
    isRecent: data.isRecent !== undefined ? (data.isRecent ? 1 : 0) : undefined,
    progressText: data.progressText !== undefined ? data.progressText : undefined,
    attachmentsText: data.attachmentsText !== undefined ? data.attachmentsText : undefined,
    customFields: data.customFields !== undefined ? JSON.stringify(data.customFields) : undefined,
    updatedAt: now
  };

  const sets = [];
  const vals = [];
  for (const [k, v] of Object.entries(fields)) {
    if (v !== undefined) {
      sets.push(`${k} = @${k}`);
      vals.push({ key: k, value: v });
    }
  }
  sets.push('updatedAt = @updatedAt');

  const sql = `UPDATE projects SET ${sets.join(', ')} WHERE id = @id`;
  const stmt = db.prepare(sql);
  stmt.run(fields);

  return true;
}

/**
 * 删除项目
 */
function deleteProject(id) {
  const db = getDb();
  if (!db) return false;
  db.prepare('DELETE FROM projects WHERE id = ?').run(id);
  return true;
}

/**
 * 搜索项目
 */
function searchProjects(keyword) {
  const db = getDb();
  if (!db) return [];
  const pattern = `%${keyword}%`;
  return db.prepare(`
    SELECT * FROM projects
    WHERE name LIKE ? OR customer LIKE ? OR region LIKE ? OR status LIKE ?
    ORDER BY id
  `).all(pattern, pattern, pattern, pattern);
}

/**
 * 按状态统计项目数量
 */
function countByStatus() {
  const db = getDb();
  if (!db) return [];
  return db.prepare(`
    SELECT status, COUNT(*) as count
    FROM projects
    WHERE status != ''
    GROUP BY status
  `).all();
}

/**
 * 按区域统计项目数量
 */
function countByRegion() {
  const db = getDb();
  if (!db) return [];
  return db.prepare(`
    SELECT region, COUNT(*) as count
    FROM projects
    WHERE region != ''
    GROUP BY region
  `).all();
}

module.exports = {
  listProjects,
  getProject,
  createProject,
  updateProject,
  deleteProject,
  searchProjects,
  countByStatus,
  countByRegion
};
