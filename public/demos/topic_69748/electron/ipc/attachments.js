/**
 * 附件管理 IPC 处理器
 * 附件文件路径使用相对路径存储（相对于 dataDir），格式如：projects/0001/2024-01-15/file.pdf
 */
const {
  pad4,
  parseAttachmentsText,
  buildAttachmentsText
} = require('../database');
const { getDataDir } = require('./system');
const path = require('path');
const fs = require('fs');

let _getDb = null;

function relToAbs(relPath) {
  if (!relPath) return '';
  if (path.isAbsolute(relPath)) return relPath;
  return path.join(getDataDir(), relPath);
}

function absToRel(absPath) {
  if (!absPath) return '';
  const dataDir = getDataDir();
  if (!path.isAbsolute(absPath)) return absPath;
  const rel = path.relative(dataDir, absPath);
  return rel.replace(/\\/g, '/');
}

function toAbsAttachment(att) {
  if (!att) return att;
  return { ...att, filePath: relToAbs(att.filePath) };
}

function toRelAttachment(att) {
  if (!att) return att;
  return { ...att, filePath: absToRel(att.filePath) };
}

function registerAttachmentHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('list-attachments', (_, projectId) => {
    const db = _getDb();
    const row = db.prepare('SELECT attachmentsText FROM projects WHERE id = ?').get(projectId);
    if (!row) return [];
    const list = parseAttachmentsText(row.attachmentsText);
    const sorted = list.sort((a, b) => {
      if (a.createdAt !== b.createdAt) return b.createdAt.localeCompare(a.createdAt);
      return b.id.localeCompare(a.id);
    });
    return sorted.map(toAbsAttachment);
  });

  ipcMain.handle('upload-attachments', (_, projectId, filePaths, progressId, progressDate) => {
    const db = _getDb();
    const proj = db.prepare('SELECT id, attachmentsText FROM projects WHERE id = ?').get(projectId);
    if (!proj) return { ok: false, error: '局点不存在' };

    const dateStr = progressDate || new Date().toISOString().slice(0, 10);
    const dataDir = getDataDir();
    const targetRelDir = `projects/${projectId}/${dateStr}`;
    const targetDir = path.join(dataDir, targetRelDir);
    if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

    const list = parseAttachmentsText(proj.attachmentsText);
    const inserted = [];
    const effectiveProgressId = progressId || '';

    for (const srcPath of filePaths) {
      try {
        const stat = fs.statSync(srcPath);
        if (!stat.isFile()) continue;
        const origName = path.basename(srcPath);
        let targetName = origName;
        const ext = path.extname(targetName);
        const base = path.basename(targetName, ext);
        let counter = 1;
        while (fs.existsSync(path.join(targetDir, targetName))) {
          targetName = `${base}_${counter}${ext}`;
          counter++;
        }
        const dest = path.join(targetDir, targetName);
        fs.copyFileSync(srcPath, dest);
        const fileType = ext.replace('.', '').toLowerCase();
        const id = 'A' + projectId + '-' + pad4(list.length + inserted.length + 1);
        const relPath = `${targetRelDir}/${targetName}`;
        list.push({
          id,
          createdAt: dateStr,
          fileName: targetName,
          filePath: relPath,
          fileSize: stat.size,
          fileType,
          progressId: effectiveProgressId
        });
        inserted.push(id);
      } catch (e) {
        continue;
      }
    }

    const newText = buildAttachmentsText(list);
    const now = new Date().toISOString().slice(0, 10);
    db.prepare('UPDATE projects SET attachmentsText = ?, updatedAt = ? WHERE id = ?')
      .run(newText, now, projectId);
    return { ok: true, ids: inserted };
  });

  ipcMain.handle('delete-attachment', (_, projectId, attachmentId) => {
    const db = _getDb();
    const projRow = db.prepare('SELECT attachmentsText FROM projects WHERE id = ?').get(projectId);
    if (!projRow) return { ok: false, error: '项目不存在' };
    const list = parseAttachmentsText(projRow.attachmentsText);
    const item = list.find(a => a.id === attachmentId);
    const filtered = list.filter(a => a.id !== attachmentId);
    const newText = buildAttachmentsText(filtered);
    const now = new Date().toISOString().slice(0, 10);
    db.prepare('UPDATE projects SET attachmentsText = ?, updatedAt = ? WHERE id = ?')
      .run(newText, now, projectId);
    if (item && item.filePath) {
      const absPath = relToAbs(item.filePath);
      if (fs.existsSync(absPath)) {
        try { fs.unlinkSync(absPath); } catch (e) { /* ignore */ }
      }
    }
    return { ok: true };
  });
}

function deleteAttachmentsByProgressId(projectId, progressId) {
  const db = _getDb();
  const projRow = db.prepare('SELECT attachmentsText FROM projects WHERE id = ?').get(projectId);
  if (!projRow || !projRow.attachmentsText) return;
  const list = parseAttachmentsText(projRow.attachmentsText);
  const toDelete = list.filter(a => a.progressId === progressId);
  const filtered = list.filter(a => a.progressId !== progressId);
  const newText = buildAttachmentsText(filtered);
  const now = new Date().toISOString().slice(0, 10);
  db.prepare('UPDATE projects SET attachmentsText = ?, updatedAt = ? WHERE id = ?')
    .run(newText, now, projectId);
  for (const item of toDelete) {
    if (item && item.filePath) {
      const absPath = relToAbs(item.filePath);
      if (fs.existsSync(absPath)) {
        try { fs.unlinkSync(absPath); } catch (e) { /* ignore */ }
      }
    }
  }
}

module.exports = { registerAttachmentHandlers, relToAbs, absToRel, deleteAttachmentsByProgressId };
