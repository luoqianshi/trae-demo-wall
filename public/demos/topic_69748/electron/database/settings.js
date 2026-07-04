/**
 * UI 设置模块
 * 负责 UI 配置的读取和更新
 */
const { getDb } = require('./db-utils');

/**
 * 获取 UI 设置
 */
function getSettings() {
  const db = getDb();
  if (!db) return getDefaultSettings();
  const row = db.prepare("SELECT * FROM ui_settings WHERE id = 'default'").get();
  if (!row) return getDefaultSettings();
  return {
    defaultPage: row.defaultPage || 'quickAdd',
    theme: row.theme || 'light',
    tableDensity: row.tableDensity || 'middle',
    cardOpacity: row.cardOpacity ?? 0.72,
    auroraEnabled: !!row.auroraEnabled,
    cardOpacityAlpha: row.cardOpacityAlpha ?? 0.82,
    demoModeEnabled: !!row.demoModeEnabled
  };
}

/**
 * 获取默认设置
 */
function getDefaultSettings() {
  return {
    defaultPage: 'quickAdd',
    theme: 'light',
    tableDensity: 'middle',
    cardOpacity: 0.72,
    auroraEnabled: true,
    cardOpacityAlpha: 0.82,
    demoModeEnabled: true
  };
}

/**
 * 更新 UI 设置
 */
function updateSettings(data) {
  const db = getDb();
  if (!db) return false;

  const sets = [];
  const params = { id: 'default' };

  if (data.defaultPage !== undefined) { sets.push('defaultPage = @defaultPage'); params.defaultPage = data.defaultPage; }
  if (data.theme !== undefined) { sets.push('theme = @theme'); params.theme = data.theme; }
  if (data.tableDensity !== undefined) { sets.push('tableDensity = @tableDensity'); params.tableDensity = data.tableDensity; }
  if (data.cardOpacity !== undefined) { sets.push('cardOpacity = @cardOpacity'); params.cardOpacity = data.cardOpacity; }
  if (data.auroraEnabled !== undefined) { sets.push('auroraEnabled = @auroraEnabled'); params.auroraEnabled = data.auroraEnabled ? 1 : 0; }
  if (data.cardOpacityAlpha !== undefined) { sets.push('cardOpacityAlpha = @cardOpacityAlpha'); params.cardOpacityAlpha = data.cardOpacityAlpha; }
  if (data.demoModeEnabled !== undefined) { sets.push('demoModeEnabled = @demoModeEnabled'); params.demoModeEnabled = data.demoModeEnabled ? 1 : 0; }

  if (sets.length === 0) return false;

  db.prepare(`UPDATE ui_settings SET ${sets.join(', ')} WHERE id = @id`).run(params);
  return true;
}

module.exports = {
  getSettings,
  getDefaultSettings,
  updateSettings
};
