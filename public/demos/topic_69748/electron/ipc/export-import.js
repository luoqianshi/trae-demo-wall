/**
 * 导入导出 IPC 处理器
 */
const {
  genProjectId,
  parseProgressText,
  buildProgressText,
  parseAttachmentsText,
  buildAttachmentsText,
  generateDemoProjects,
  clearDemoProjects
} = require('../database');
const { getDataDir } = require('./system');
const path = require('path');
const fs = require('fs');
const XLSX = require('xlsx');
const JSZip = require('jszip');

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

function registerExportImportHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  // Excel 导出
  ipcMain.handle('export-excel', (_, filePath, projectList) => {
    const db = _getDb();
    const wb = XLSX.utils.book_new();

    const fieldRows = db.prepare('SELECT * FROM field_config ORDER BY orderIndex ASC').all();
    const fieldKeys = fieldRows.map(r => r.key);

    let projRows;
    if (Array.isArray(projectList) && projectList.length > 0) {
      projRows = projectList.map(p => ({
        ...p,
        customFields: typeof p.customFields === 'string' ? p.customFields : JSON.stringify(p.customFields || {})
      }));
    } else {
      projRows = db.prepare('SELECT * FROM projects ORDER BY createdAt DESC').all();
    }
    const projHeader = ['id', ...fieldKeys.map(k => {
      const f = fieldRows.find(r => r.key === k);
      return f ? f.label : k;
    }), 'attachmentDir', 'isRecent', '进展', '附件', 'createdAt', 'updatedAt'];

    const projSheetData = projRows.map(p => {
      const cf = parseJSONSafe(p.customFields, {});
      const base = [
        p.id,
        ...fieldKeys.map(k => {
          if (p.hasOwnProperty(k)) return p[k] || '';
          return cf[k] || '';
        }),
        p.attachmentDir || '',
        p.isRecent ? '是' : '否',
        p.progressText || '',
        p.attachmentsText || '',
        p.createdAt,
        p.updatedAt
      ];
      return base;
    });
    const projSheet = XLSX.utils.aoa_to_sheet([projHeader, ...projSheetData]);
    XLSX.utils.book_append_sheet(wb, projSheet, '局点');

    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(fieldRows), '字段配置');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(db.prepare('SELECT * FROM progress_template').all()), '进展模板');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(db.prepare('SELECT * FROM knowledge_category ORDER BY orderIndex').all()), '知识分类');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(db.prepare('SELECT * FROM knowledge_item ORDER BY updatedAt DESC').all()), '知识条目');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(db.prepare('SELECT * FROM ui_settings').all()), 'UI 设置');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(db.prepare('SELECT * FROM registered_stats').all()), '统计图');
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(db.prepare('SELECT * FROM jumper_config').all()), '跳转配置');

    XLSX.writeFile(wb, filePath);
    return { ok: true, filePath };
  });

  // Excel 导入
  ipcMain.handle('import-excel', (_, filePath, mode) => {
    const db = _getDb();
    const wb = XLSX.readFile(filePath);
    const effectiveMode = mode || 'overwrite';

    const tx = db.transaction((fn) => fn());
    tx(() => {
      // 导入局点
      if (wb.SheetNames.includes('局点')) {
        const aoa = XLSX.utils.sheet_to_json(wb.Sheets['局点'], { header: 1, defval: '' });
        if (aoa.length > 1) {
          const header = aoa[0];
          const fieldRows = db.prepare('SELECT * FROM field_config').all();
          const labelToKey = {};
          fieldRows.forEach(r => { labelToKey[r.label] = r.key; labelToKey[r.key] = r.key; });

          const colIdx = {};
          header.forEach((h, idx) => {
            if (typeof h !== 'string') return;
            if (labelToKey[h]) colIdx[labelToKey[h]] = idx;
            else colIdx[h] = idx;
          });

          const fixedCols = ['id', 'attachmentDir', 'isRecent', '进展', '附件', 'createdAt', 'updatedAt'];
          header.forEach((h, idx) => {
            if (fixedCols.includes(h)) colIdx[h] = idx;
          });

          if (effectiveMode === 'overwrite') {
            db.prepare('DELETE FROM projects').run();
          }

          const fieldKeys = fieldRows.map(r => r.key);
          const knownFixedKeys = ['name', 'customer', 'region', 'status', 'currentPhase', 'nextAction', 'imGroup', 'imContact', 'isRecent'];
          const dataDir = getDataDir();

          const ins = db.prepare(`
            INSERT INTO projects (id, name, customer, region, status, currentPhase, nextAction,
              imGroup, imContact, attachmentDir, isRecent, progressText, attachmentsText,
              customFields, createdAt, updatedAt)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

          for (let i = 1; i < aoa.length; i++) {
            const row = aoa[i];
            if (!row || row.length === 0) continue;
            const get = (k) => (colIdx[k] !== undefined ? String(row[colIdx[k]] || '') : '');
            const customFields = {};
            for (const f of fieldRows) {
              if (!knownFixedKeys.includes(f.key) && colIdx[f.label] !== undefined) {
                customFields[f.key] = row[colIdx[f.label]] || '';
              }
            }
            let id = get('id') || genProjectId();
            let dir = get('attachmentDir');
            if (!dir) dir = path.join(dataDir, 'projects', id);
            const isRecent = get('isRecent') === '是' ? 1 : 0;
            const progressText = get('进展') || '';
            const attachmentsText = get('附件') || '';
            try {
              ins.run(
                id,
                get('name') || get('局点名称'),
                get('customer') || get('客户名称'),
                get('region') || get('地区'),
                get('status') || get('当前状态'),
                get('currentPhase') || get('当前阶段'),
                get('nextAction') || get('下一步操作'),
                get('imGroup') || get('关联 IM 群'),
                get('imContact') || get('关联 IM 个人'),
                dir, isRecent, progressText, attachmentsText,
                JSON.stringify(customFields),
                get('createdAt') || todayStr(),
                get('updatedAt') || todayStr()
              );
              if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
            } catch (e) { /* ignore */ }
          }
        }
      }

      // 导入字段配置
      if (wb.SheetNames.includes('字段配置')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['字段配置'], { defval: '' });
        if (effectiveMode === 'overwrite') db.prepare('DELETE FROM field_config').run();
        const ins = db.prepare(`
          INSERT OR REPLACE INTO field_config (key, label, type, visible, orderIndex, options, defaultValue, showInQuickAdd, jumperMode)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of rows) {
          try {
            ins.run(
              String(r.key || uid('field')),
              String(r.label || ''),
              String(r.type || 'text'),
              Number(r.visible) || 1,
              Number(r.orderIndex) || 0,
              String(r.options || '[]'),
              String(r.defaultValue || ''),
              Number(r.showInQuickAdd) || 0,
              String(r.jumperMode || '') || null
            );
          } catch (e) { /* ignore */ }
        }
      }

      // 导入跳转配置
      if (wb.SheetNames.includes('跳转配置')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['跳转配置'], { defval: '' });
        if (effectiveMode === 'overwrite') db.prepare('DELETE FROM jumper_config').run();
        const ins = db.prepare(`
          INSERT OR REPLACE INTO jumper_config (id, personTemplate, groupTemplate)
          VALUES (?, ?, ?)
        `);
        for (const r of rows) {
          try {
            ins.run(
              String(r.id || 'default'),
              String(r.personTemplate || ''),
              String(r.groupTemplate || '')
            );
          } catch (e) { /* ignore */ }
        }
      }

      // 导入进展模板
      if (wb.SheetNames.includes('进展模板')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['进展模板'], { defval: '' });
        if (effectiveMode === 'overwrite') db.prepare('DELETE FROM progress_template').run();
        const ins = db.prepare(`
          INSERT OR REPLACE INTO progress_template (id, name, fields, createdAt)
          VALUES (?, ?, ?, ?)
        `);
        for (const r of rows) {
          try {
            ins.run(
              String(r.id || uid('tpl')),
              String(r.name || ''),
              String(r.fields || '[]'),
              String(r.createdAt || todayStr())
            );
          } catch (e) { /* ignore */ }
        }
      }

      // 导入知识分类
      if (wb.SheetNames.includes('知识分类')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['知识分类'], { defval: '' });
        if (effectiveMode === 'overwrite') {
          db.prepare('DELETE FROM knowledge_item').run();
          db.prepare('DELETE FROM knowledge_category').run();
        }
        const ins = db.prepare(`
          INSERT INTO knowledge_category (id, name, description, orderIndex, createdAt)
          VALUES (?, ?, ?, ?, ?)
        `);
        for (const r of rows) {
          try {
            ins.run(
              String(r.id || uid('kc')),
              String(r.name || ''),
              String(r.description || ''),
              Number(r.orderIndex) || 0,
              String(r.createdAt || todayStr())
            );
          } catch (e) { /* ignore */ }
        }
      }

      // 导入知识条目
      if (wb.SheetNames.includes('知识条目')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['知识条目'], { defval: '' });
        if (effectiveMode === 'overwrite') db.prepare('DELETE FROM knowledge_item').run();
        const ins = db.prepare(`
          INSERT INTO knowledge_item (id, categoryId, title, content, tags, filePaths, createdAt, updatedAt)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `);
        for (const r of rows) {
          try {
            ins.run(
              String(r.id || uid('ki')),
              String(r.categoryId || ''),
              String(r.title || ''),
              String(r.content || ''),
              String(r.tags || ''),
              String(r.filePaths || '[]'),
              String(r.createdAt || todayStr()),
              String(r.updatedAt || todayStr())
            );
          } catch (e) { /* ignore */ }
        }
      }

      // 导入 UI 设置
      if (wb.SheetNames.includes('UI 设置')) {
        const rows = XLSX.utils.sheet_to_json(wb.Sheets['UI 设置'], { defval: '' });
        for (const r of rows) {
          db.prepare('DELETE FROM ui_settings').run();
          db.prepare(`INSERT INTO ui_settings (id, defaultPage, theme, tableDensity, cardOpacity, auroraEnabled, cardOpacityAlpha, demoModeEnabled)
            VALUES ('default', ?, ?, ?, ?, ?, ?, ?)`)
            .run(
              String(r.defaultPage || 'quickAdd'),
              String(r.theme || 'light'),
              String(r.tableDensity || 'middle'),
              Number(r.cardOpacity) || 0.72,
              Number(r.auroraEnabled) || 1,
              Number(r.cardOpacityAlpha) || 0.82,
              Number(r.demoModeEnabled) || 1
            );
          break;
        }
      }

      return null;
    });

    return { ok: true };
  });

  // 附件导出
  ipcMain.handle('export-attachments', async (_, filePath) => {
    const dataDir = getDataDir();
    const projectsDir = path.join(dataDir, 'projects');

    const zip = new JSZip();
    if (fs.existsSync(projectsDir)) {
      function addDir(dirPath, zipPath) {
        const entries = fs.readdirSync(dirPath);
        for (const entry of entries) {
          const fullPath = path.join(dirPath, entry);
          const stat = fs.statSync(fullPath);
          if (stat.isDirectory()) {
            addDir(fullPath, zipPath + '/' + entry);
          } else {
            const rel = zipPath + '/' + entry;
            zip.file(rel, fs.readFileSync(fullPath));
          }
        }
      }
      addDir(projectsDir, 'projects');
    }
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    fs.writeFileSync(filePath, buffer);
    return { ok: true, filePath };
  });

  // 附件导入
  ipcMain.handle('import-attachments', async (_, filePath) => {
    const dataDir = getDataDir();
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);
    const files = Object.keys(zip.files);
    for (const name of files) {
      const entry = zip.files[name];
      if (entry.dir) continue;
      if (!name.startsWith('projects/')) continue;
      const dest = path.join(dataDir, name);
      const destDir = path.dirname(dest);
      if (!fs.existsSync(destDir)) fs.mkdirSync(destDir, { recursive: true });
      const content = await entry.async('nodebuffer');
      fs.writeFileSync(dest, content);
    }
    return { ok: true };
  });

  // 示例数据
  ipcMain.handle('generate-demo-projects', (_, count) => {
    const n = Number(count) || 10;
    return generateDemoProjects(n);
  });

  ipcMain.handle('clear-demo-projects', () => {
    return clearDemoProjects();
  });
}

module.exports = { registerExportImportHandlers };
