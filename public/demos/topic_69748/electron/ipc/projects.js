/**
 * 项目管理 IPC 处理器
 */
const {
  genProjectId,
  buildProgressText,
  buildAttachmentsText,
  parseProgressText,
  parseAttachmentsText
} = require('../database');
const { getDataDir } = require('./system');
const path = require('path');
const fs = require('fs');

let _getDb = null;

function registerProjectHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('list-projects', () => {
    const db = _getDb();
    const rows = db.prepare('SELECT * FROM projects ORDER BY updatedAt DESC').all();
    return rows.map(r => parseProjectRow(r));
  });

  ipcMain.handle('get-project', (_, id) => {
    const db = _getDb();
    const r = db.prepare('SELECT * FROM projects WHERE id = ?').get(id);
    if (!r) return null;
    return parseProjectRow(r);
  });

  ipcMain.handle('add-project', (_, data) => {
    const db = _getDb();
    const id = data.id || genProjectId();
    const now = new Date().toISOString().slice(0, 10);
    const dataDir = getDataDir();
    const dir = path.join(dataDir, 'projects', id);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const progressText = buildProgressText(data.progressList || []);
    const attachmentsText = buildAttachmentsText(data.attachmentList || []);

    db.prepare(`
      INSERT INTO projects (id, name, customer, region, status, currentPhase, nextAction,
        imGroup, imContact, attachmentDir, isRecent, progressText, attachmentsText,
        customFields, createdAt, updatedAt)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name || '',
      data.customer || '',
      data.region || '',
      data.status || '',
      data.currentPhase || '',
      data.nextAction || '',
      data.imGroup || '',
      data.imContact || '',
      dir,
      data.isRecent ? 1 : 0,
      progressText,
      attachmentsText,
      JSON.stringify(data.customFields || {}),
      data.createdAt || now,
      now
    );
    return id;
  });

  ipcMain.handle('update-project', (_, data) => {
    const db = _getDb();
    const now = new Date().toISOString().slice(0, 10);
    const customFields = JSON.stringify(data.customFields || {});
    db.prepare(`
      UPDATE projects SET
        name = ?, customer = ?, region = ?, status = ?, currentPhase = ?,
        nextAction = ?, imGroup = ?, imContact = ?, isRecent = ?,
        customFields = ?, updatedAt = ?
      WHERE id = ?
    `).run(
      data.name || '',
      data.customer || '',
      data.region || '',
      data.status || '',
      data.currentPhase || '',
      data.nextAction || '',
      data.imGroup || '',
      data.imContact || '',
      data.isRecent ? 1 : 0,
      customFields,
      now,
      data.id
    );
    return { ok: true };
  });

  ipcMain.handle('delete-project', (_, id) => {
    const db = _getDb();
    const row = db.prepare('SELECT attachmentDir FROM projects WHERE id = ?').get(id);
    db.prepare('DELETE FROM projects WHERE id = ?').run(id);
    if (row && row.attachmentDir && fs.existsSync(row.attachmentDir)) {
      try { fs.rmSync(row.attachmentDir, { recursive: true, force: true }); } catch (e) { /* ignore */ }
    }
    return { ok: true };
  });
}

function parseProjectRow(r) {
  let customFields = {};
  try { customFields = JSON.parse(r.customFields || '{}'); } catch (_) {}
  return {
    ...r,
    customFields,
    isRecent: !!r.isRecent,
    progressList: parseProgressText(r.progressText),
    attachmentList: parseAttachmentsText(r.attachmentsText)
  };
}

module.exports = {
  registerProjectHandlers,
  parseProjectRow
};
