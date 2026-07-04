/**
 * IPC 处理器入口
 * 重新导出 ipc/index.js 的所有功能
 */
const { registerHandlers } = require('./ipc');
module.exports = { registerHandlers };
