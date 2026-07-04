/**
 * 统计配置模块
 * 负责统计配置的增删改查操作
 */
const { getDb } = require('./db-utils');

/**
 * 获取所有统计配置
 */
function listStats() {
  const db = getDb();
  if (!db) return [];
  const rows = db.prepare('SELECT * FROM registered_stats ORDER BY orderIndex').all();
  return rows.map(r => ({
    ...r,
    config: JSON.parse(r.config || '{}'),
    enabled: !!r.enabled
  }));
}

/**
 * 获取单个统计配置
 */
function getStat(id) {
  const db = getDb();
  if (!db) return null;
  const row = db.prepare('SELECT * FROM registered_stats WHERE id = ?').get(id);
  if (!row) return null;
  return {
    ...row,
    config: JSON.parse(row.config || '{}'),
    enabled: !!row.enabled
  };
}

/**
 * 创建统计配置
 */
function createStat(data) {
  const db = getDb();
  if (!db) return false;

  db.prepare(`
    INSERT INTO registered_stats (id, name, chartType, dataSource, config, orderIndex, enabled)
    VALUES (@id, @name, @chartType, @dataSource, @config, @orderIndex, @enabled)
  `).run({
    id: data.id,
    name: data.name,
    chartType: data.chartType,
    dataSource: data.dataSource,
    config: JSON.stringify(data.config || {}),
    orderIndex: data.orderIndex || 0,
    enabled: data.enabled ? 1 : 0
  });

  return true;
}

/**
 * 更新统计配置
 */
function updateStat(id, data) {
  const db = getDb();
  if (!db) return false;

  const sets = [];
  const params = { id };

  if (data.name !== undefined) { sets.push('name = @name'); params.name = data.name; }
  if (data.chartType !== undefined) { sets.push('chartType = @chartType'); params.chartType = data.chartType; }
  if (data.dataSource !== undefined) { sets.push('dataSource = @dataSource'); params.dataSource = data.dataSource; }
  if (data.config !== undefined) { sets.push('config = @config'); params.config = JSON.stringify(data.config); }
  if (data.orderIndex !== undefined) { sets.push('orderIndex = @orderIndex'); params.orderIndex = data.orderIndex; }
  if (data.enabled !== undefined) { sets.push('enabled = @enabled'); params.enabled = data.enabled ? 1 : 0; }

  if (sets.length === 0) return false;

  db.prepare(`UPDATE registered_stats SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return true;
}

/**
 * 删除统计配置
 */
function deleteStat(id) {
  const db = getDb();
  if (!db) return false;
  db.prepare('DELETE FROM registered_stats WHERE id = ?').run(id);
  return true;
}

module.exports = {
  listStats,
  getStat,
  createStat,
  updateStat,
  deleteStat
};
