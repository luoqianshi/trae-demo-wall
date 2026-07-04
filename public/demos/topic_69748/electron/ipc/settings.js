/**
 * UI 设置 IPC 处理器
 */
let _getDb = null;

function registerSettingsHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;

  ipcMain.handle('get-ui-settings', () => {
    const db = _getDb();
    return db.prepare('SELECT * FROM ui_settings WHERE id = ?').get('default') || null;
  });

  ipcMain.handle('save-ui-settings', (_, data) => {
    const db = _getDb();
    const exists = db.prepare('SELECT COUNT(*) as c FROM ui_settings WHERE id = ?').get('default');
    const defaultPage = data.defaultPage || 'quickAdd';
    const theme = data.theme || 'light';
    const tableDensity = data.tableDensity || 'middle';
    const cardOpacity = data.cardOpacity !== undefined && data.cardOpacity !== null ? data.cardOpacity : 0.72;
    const auroraEnabled = data.auroraEnabled !== undefined && data.auroraEnabled !== null ? (data.auroraEnabled ? 1 : 0) : 1;
    const cardOpacityAlpha = data.cardOpacityAlpha !== undefined && data.cardOpacityAlpha !== null ? data.cardOpacityAlpha : 0.82;
    const demoModeEnabled = data.demoModeEnabled !== undefined && data.demoModeEnabled !== null ? (data.demoModeEnabled ? 1 : 0) : 1;
    if (exists.c > 0) {
      db.prepare(`UPDATE ui_settings SET
        defaultPage = ?, theme = ?, tableDensity = ?, cardOpacity = ?,
        auroraEnabled = ?, cardOpacityAlpha = ?, demoModeEnabled = ?
        WHERE id = ?`)
        .run(defaultPage, theme, tableDensity, cardOpacity, auroraEnabled, cardOpacityAlpha, demoModeEnabled, 'default');
    } else {
      db.prepare(`INSERT INTO ui_settings (id, defaultPage, theme, tableDensity, cardOpacity, auroraEnabled, cardOpacityAlpha, demoModeEnabled)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
        .run('default', defaultPage, theme, tableDensity, cardOpacity, auroraEnabled, cardOpacityAlpha, demoModeEnabled);
    }
    return { ok: true };
  });
}

module.exports = { registerSettingsHandlers };
