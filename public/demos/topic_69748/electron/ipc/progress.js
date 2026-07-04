/**
 * 进展管理 IPC 处理器
 */
const {
  pad4,
  parseProgressText,
  buildProgressText,
  parseAttachmentsText
} = require('../database');
const { relToAbs } = require('./attachments');
const { deleteAttachmentsByProgressId } = require('./attachments');

let _getDb = null;

function registerProgressHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('list-progress', (_, projectId) => {
    const db = _getDb();
    const row = db.prepare('SELECT progressText, attachmentsText FROM projects WHERE id = ?').get(projectId);
    if (!row) return [];
    const progressList = parseProgressText(row.progressText);
    const allAttachments = parseAttachmentsText(row.attachmentsText);
    const byProgress = {};
    for (const att of allAttachments) {
      if (att.progressId) {
        if (!byProgress[att.progressId]) byProgress[att.progressId] = [];
        byProgress[att.progressId].push({ ...att, filePath: relToAbs(att.filePath) });
      }
    }
    const result = progressList.map(p => ({
      ...p,
      attachments: byProgress[p.id] || []
    }));
    return result.sort((a, b) => {
      if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      return b.id.localeCompare(a.id);
    });
  });

  ipcMain.handle('add-progress', (_, data) => {
    const db = _getDb();
    const projRow = db.prepare('SELECT progressText FROM projects WHERE id = ?').get(data.projectId);
    if (!projRow) return null;
    const list = parseProgressText(projRow.progressText);
    const id = data.id || 'P' + data.projectId + '-' + pad4(list.length + 1);
    const now = new Date().toISOString().slice(0, 10);
    const createdAt = data.createdAt || now;
    list.push({ id, createdAt, content: data.content || '' });
    const newText = buildProgressText(list);
    db.prepare('UPDATE projects SET progressText = ?, updatedAt = ? WHERE id = ?')
      .run(newText, now, data.projectId);
    return id;
  });

  ipcMain.handle('update-progress', (_, data) => {
    const db = _getDb();
    const projRow = db.prepare('SELECT progressText FROM projects WHERE id = ?').get(data.projectId);
    if (!projRow) return { ok: false, error: '项目不存在' };
    const list = parseProgressText(projRow.progressText);
    const idx = list.findIndex(p => p.id === data.id);
    if (idx === -1) return { ok: false, error: '进展不存在' };
    list[idx].content = data.content || '';
    if (data.createdAt) list[idx].createdAt = data.createdAt;
    const newText = buildProgressText(list);
    const now = new Date().toISOString().slice(0, 10);
    db.prepare('UPDATE projects SET progressText = ?, updatedAt = ? WHERE id = ?')
      .run(newText, now, data.projectId);
    return { ok: true };
  });

  ipcMain.handle('delete-progress', (_, projectId, progressId) => {
    const db = _getDb();
    const projRow = db.prepare('SELECT progressText FROM projects WHERE id = ?').get(projectId);
    if (!projRow) return { ok: false, error: '项目不存在' };
    const list = parseProgressText(projRow.progressText);
    const filtered = list.filter(p => p.id !== progressId);
    const newText = buildProgressText(filtered);
    const now = new Date().toISOString().slice(0, 10);
    db.prepare('UPDATE projects SET progressText = ?, updatedAt = ? WHERE id = ?')
      .run(newText, now, projectId);
    deleteAttachmentsByProgressId(projectId, progressId);
    return { ok: true };
  });
}

module.exports = { registerProgressHandlers };
