/**
 * 统计图 IPC 处理器
 */
const { parseProgressText } = require('../database');
let _getDb = null;

function uid(prefix = 'id') {
  return prefix + '-' + Math.random().toString(36).slice(2, 10);
}

function parseJSONSafe(s, fallback) {
  try { return JSON.parse(s); } catch (_) { return fallback; }
}

function registerStatsHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('list-stats', () => {
    const db = _getDb();
    const rows = db.prepare('SELECT * FROM registered_stats ORDER BY orderIndex ASC').all();
    return rows.map(r => parseStatsRow(r));
  });

  ipcMain.handle('add-stats', (_, data) => {
    const db = _getDb();
    const id = data.id || uid('stat');
    const maxOrder = db.prepare('SELECT MAX(orderIndex) as m FROM registered_stats').get();
    db.prepare(`
      INSERT INTO registered_stats (id, name, chartType, dataSource, config, orderIndex, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.name || '',
      data.chartType || 'pie',
      data.dataSource || '',
      JSON.stringify(data.config || {}),
      ((maxOrder && maxOrder.m) || 0) + 1,
      data.enabled !== undefined ? (data.enabled ? 1 : 0) : 1
    );
    return id;
  });

  ipcMain.handle('update-stats', (_, data) => {
    const db = _getDb();
    db.prepare('UPDATE registered_stats SET name = ?, chartType = ?, dataSource = ?, config = ?, orderIndex = ?, enabled = ? WHERE id = ?')
      .run(data.name || '', data.chartType || 'pie', data.dataSource || '',
        JSON.stringify(data.config || {}), data.orderIndex || 0,
        data.enabled ? 1 : 0, data.id);
    return { ok: true };
  });

  ipcMain.handle('delete-stats', (_, id) => {
    const db = _getDb();
    db.prepare('DELETE FROM registered_stats WHERE id = ?').run(id);
    return { ok: true };
  });

  ipcMain.handle('get-stats-data', (_, id) => {
    const db = _getDb();
    const cfg = db.prepare('SELECT * FROM registered_stats WHERE id = ?').get(id);
    if (!cfg) return { ok: false, error: '未找到统计图' };
    let data = [];
    switch (cfg.dataSource) {
      case 'project-status': {
        data = db.prepare(`
          SELECT status as name, COUNT(*) as value FROM projects
          GROUP BY status ORDER BY value DESC
        `).all().map(r => ({ name: r.name || '未设置', value: r.value }));
        break;
      }
      case 'project-region': {
        data = db.prepare(`
          SELECT region as name, COUNT(*) as value FROM projects
          GROUP BY region ORDER BY value DESC
        `).all().map(r => ({ name: r.name || '未设置', value: r.value }));
        break;
      }
      case 'progress-trend': {
        const rows = db.prepare('SELECT progressText, createdAt FROM projects').all();
        const dateMap = {};
        for (const row of rows) {
          const list = parseProgressText(row.progressText);
          for (const p of list) {
            const d = p.createdAt;
            dateMap[d] = (dateMap[d] || 0) + 1;
          }
        }
        data = Object.keys(dateMap).sort().map(date => ({ date, value: dateMap[date] }));
        break;
      }
      default:
        data = [];
    }
    return { ok: true, id, chartType: cfg.chartType, name: cfg.name, data };
  });
}

function parseStatsRow(r) {
  return {
    ...r,
    enabled: !!r.enabled,
    config: parseJSONSafe(r.config, {})
  };
}

module.exports = { registerStatsHandlers };
