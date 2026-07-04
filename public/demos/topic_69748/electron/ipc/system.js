/**
 * 系统级 IPC 处理器
 * 处理数据目录、路径打开等系统级操作
 */
const path = require('path');

let _getDataDir = null;
let _dialog = null;
let _shell = null;

function registerSystemHandlers(ipcMain, ctx) {
  _getDataDir = ctx.getDataDir;
  _dialog = ctx.dialog;
  _shell = ctx.shell;

  ipcMain.handle('get-data-dir', () => _getDataDir());

  ipcMain.handle('open-path', (_, p) => {
    try {
      _shell.openPath(p);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle('open-external', (_, url) => {
    try {
      _shell.openExternal(url);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e.message };
    }
  });

  ipcMain.handle('show-save-dialog', (_, opts) => _dialog.showSaveDialog(opts || {}));
  ipcMain.handle('show-open-dialog', (_, opts) => _dialog.showOpenDialog(opts || {}));
}

function getDataDir() {
  return _getDataDir();
}

function getDialog() {
  return _dialog;
}

function getShell() {
  return _shell;
}

module.exports = {
  registerSystemHandlers,
  getDataDir,
  getDialog,
  getShell
};
