/**
 * IPC 处理器入口模块
 * 统一注册所有 IPC 处理器
 */
const { registerSystemHandlers } = require('./system');
const { registerProjectHandlers } = require('./projects');
const { registerProgressHandlers } = require('./progress');
const { registerAttachmentHandlers } = require('./attachments');
const { registerFieldHandlers } = require('./fields');
const { registerTemplateHandlers } = require('./templates');
const { registerKnowledgeHandlers } = require('./knowledge');
const { registerStatsHandlers } = require('./stats');
const { registerSettingsHandlers } = require('./settings');
const { registerAiHandlers } = require('./ai');
const { registerExportImportHandlers } = require('./export-import');
const { registerJumperHandlers } = require('./jumper');

/**
 * 注册所有 IPC 处理器
 */
function registerHandlers(ipcMain, ctx) {
  // 系统级
  registerSystemHandlers(ipcMain, ctx);

  // 项目管理
  registerProjectHandlers(ipcMain, ctx);

  // 进展管理
  registerProgressHandlers(ipcMain, ctx);

  // 附件管理
  registerAttachmentHandlers(ipcMain, ctx);

  // 字段配置
  registerFieldHandlers(ipcMain, ctx);

  // 模板配置
  registerTemplateHandlers(ipcMain, ctx);

  // 知识库
  registerKnowledgeHandlers(ipcMain, ctx);

  // 统计图
  registerStatsHandlers(ipcMain, ctx);

  // UI 设置
  registerSettingsHandlers(ipcMain, ctx);

  // AI 功能
  registerAiHandlers(ipcMain, ctx);

  // 导入导出
  registerExportImportHandlers(ipcMain, ctx);

  // 跳转功能
  registerJumperHandlers(ipcMain, ctx);
}

module.exports = { registerHandlers };
