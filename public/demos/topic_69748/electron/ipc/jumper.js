const { exec } = require('child_process');
const { shell } = require('electron');

let _getDb = null;
let _getJumperConfigFn = null;
let _saveJumperConfigFn = null;

function registerJumperHandlers(ipcMain, ctx) {
  _getDb = ctx.getDb;
  _getJumperConfigFn = ctx.getJumperConfig;
  _saveJumperConfigFn = ctx.saveJumperConfig;

  ipcMain.handle('get-jumper-config', () => {
    if (!_getJumperConfigFn) return { id: 'default', personTemplate: '', groupTemplate: '' };
    return _getJumperConfigFn();
  });

  ipcMain.handle('save-jumper-config', (_, data) => {
    if (!_saveJumperConfigFn) return { ok: false, error: '未初始化' };
    const ok = _saveJumperConfigFn(data);
    return { ok: !!ok };
  });

  ipcMain.handle('execute-jump', (_, value, mode) => {
    const idPart = extractId(value);
    if (!idPart) return { ok: false, error: '未找到可识别的号码/工号' };

    const config = _getJumperConfigFn ? _getJumperConfigFn() : { personTemplate: '', groupTemplate: '' };
    const template = mode === 'group' ? (config.groupTemplate || '') : (config.personTemplate || '');
    if (!template) return { ok: false, error: '请先在设置中配置跳转命令模板' };

    const cmd = template.replace(/\{id\}/g, idPart).replace(/\{value\}/g, value);

    if (/^https?:\/\//i.test(cmd)) {
      shell.openExternal(cmd).catch(() => {});
      return { ok: true, command: cmd };
    }

    return new Promise((resolve) => {
      exec(cmd, (error) => {
        if (error) {
          resolve({ ok: false, error: error.message, command: cmd });
        } else {
          resolve({ ok: true, command: cmd });
        }
      });
    });
  });
}

function extractId(value) {
  if (!value) return '';
  const trimmed = String(value).trim();
  const m = trimmed.match(/[a-zA-Z]?\d{4,}/);
  if (m) return m[0];
  const parts = trimmed.split(/[\s,，;；]+/);
  for (const p of parts) {
    if (/^[a-zA-Z]?\d+$/.test(p)) return p;
  }
  return '';
}

module.exports = { registerJumperHandlers, extractId };
