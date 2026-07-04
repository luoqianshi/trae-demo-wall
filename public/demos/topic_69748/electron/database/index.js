/**
 * 数据库入口模块
 * 统一导出所有数据库操作功能
 */
const path = require('path');
const { Database, getDb, setDb, pad4, todayStr, genProjectId, loadTemplate } = require('./db-utils');

// 子模块
const projects = require('./projects');
const fields = require('./fields');
const templates = require('./templates');
const settings = require('./settings');
const aiConfig = require('./ai-config');
const knowledge = require('./knowledge');
const stats = require('./stats');
const demo = require('./demo');
const textParser = require('./text-parser');
const jumper = require('./jumper');

/**
 * 初始化数据库
 */
function initDatabase(dataDir) {
  const dbPath = path.join(dataDir, 'database.sqlite');
  const db = new Database(dbPath);
  setDb(db);

  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  // 创建表
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      customer TEXT DEFAULT '',
      region TEXT DEFAULT '',
      status TEXT DEFAULT '',
      currentPhase TEXT DEFAULT '',
      nextAction TEXT DEFAULT '',
      imGroup TEXT DEFAULT '',
      imContact TEXT DEFAULT '',
      attachmentDir TEXT DEFAULT '',
      isRecent INTEGER DEFAULT 0,
      progressText TEXT DEFAULT '',
      attachmentsText TEXT DEFAULT '',
      customFields TEXT DEFAULT '{}',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL
    );
  `);

  db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_status ON projects(status);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_region ON projects(region);`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_projects_isRecent ON projects(isRecent);`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS field_config (
      key TEXT PRIMARY KEY,
      label TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'text',
      visible INTEGER DEFAULT 1,
      orderIndex INTEGER DEFAULT 0,
      options TEXT DEFAULT '[]',
      defaultValue TEXT DEFAULT '',
      showInQuickAdd INTEGER DEFAULT 0,
      jumperMode TEXT DEFAULT 'person'
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS jumper_config (
      id TEXT PRIMARY KEY,
      personTemplate TEXT DEFAULT '',
      groupTemplate TEXT DEFAULT ''
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ai_config (
      id TEXT PRIMARY KEY,
      apiUrl TEXT DEFAULT '',
      apiKey TEXT DEFAULT '',
      model TEXT DEFAULT '',
      promptTemplate TEXT DEFAULT ''
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS progress_template (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      fields TEXT NOT NULL DEFAULT '[]',
      createdAt TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_category (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT DEFAULT '',
      orderIndex INTEGER DEFAULT 0,
      createdAt TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_item (
      id TEXT PRIMARY KEY,
      categoryId TEXT NOT NULL,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tags TEXT DEFAULT '',
      filePaths TEXT DEFAULT '[]',
      createdAt TEXT NOT NULL,
      updatedAt TEXT NOT NULL,
      FOREIGN KEY (categoryId) REFERENCES knowledge_category(id) ON DELETE CASCADE
    );
  `);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_ki_categoryId ON knowledge_item(categoryId);`);

  db.exec(`
    CREATE TABLE IF NOT EXISTS ui_settings (
      id TEXT PRIMARY KEY,
      defaultPage TEXT DEFAULT 'quickAdd',
      theme TEXT DEFAULT 'light',
      tableDensity TEXT DEFAULT 'middle',
      cardOpacity REAL DEFAULT 0.72,
      auroraEnabled INTEGER DEFAULT 1,
      cardOpacityAlpha REAL DEFAULT 0.82,
      demoModeEnabled INTEGER DEFAULT 1
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS registered_stats (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      chartType TEXT NOT NULL,
      dataSource TEXT NOT NULL,
      config TEXT DEFAULT '{}',
      orderIndex INTEGER DEFAULT 0,
      enabled INTEGER DEFAULT 1
    );
  `);

  // 从模板填充初始数据
  seedFromTemplate();
}

/**
 * 从模板填充初始数据
 */
function seedFromTemplate() {
  const db = getDb();
  const tpl = loadTemplate();
  if (!tpl || !db) return;

  // 填充字段配置
  const fieldRow = db.prepare('SELECT COUNT(*) as c FROM field_config').get();
  if (fieldRow.c === 0 && tpl.fields) {
    const stmt = db.prepare(`
      INSERT INTO field_config (key, label, type, visible, orderIndex, options, defaultValue, showInQuickAdd, jumperMode)
      VALUES (@key, @label, @type, @visible, @orderIndex, @options, @defaultValue, @showInQuickAdd, @jumperMode)
    `);
    const tx = db.transaction((items) => {
      for (const item of items) {
        stmt.run({
          ...item,
          options: JSON.stringify(item.options || []),
          jumperMode: item.jumperMode || 'person'
        });
      }
    });
    tx(tpl.fields);
  }

  // 填充 AI 配置
  const aiRow = db.prepare('SELECT COUNT(*) as c FROM ai_config').get();
  if (aiRow.c === 0 && tpl.aiConfig) {
    db.prepare(`
      INSERT INTO ai_config (id, apiUrl, apiKey, model, promptTemplate)
      VALUES ('default', ?, ?, ?, ?)
    `).run(
      tpl.aiConfig.apiUrl || '',
      tpl.aiConfig.apiKey || '',
      tpl.aiConfig.model || '',
      tpl.aiConfig.promptTemplate || ''
    );
  }

  // 填充模板
  const tmplRow = db.prepare('SELECT COUNT(*) as c FROM progress_template').get();
  if (tmplRow.c === 0 && tpl.progressTemplates) {
    const now = todayStr();
    const insertTmpl = db.prepare(`
      INSERT INTO progress_template (id, name, fields, createdAt)
      VALUES (?, ?, ?, ?)
    `);
    for (const t of tpl.progressTemplates) {
      insertTmpl.run(t.id, t.name, JSON.stringify(t.fields || []), now);
    }
  }

  // 填充 UI 设置
  const uiRow = db.prepare('SELECT COUNT(*) as c FROM ui_settings').get();
  if (uiRow.c === 0 && tpl.uiSettings) {
    const u = tpl.uiSettings;
    db.prepare(`
      INSERT INTO ui_settings (id, defaultPage, theme, tableDensity, cardOpacity, auroraEnabled, cardOpacityAlpha, demoModeEnabled)
      VALUES ('default', ?, ?, ?, ?, ?, ?, ?)
    `).run(
      u.defaultPage || 'quickAdd',
      u.theme || 'light',
      u.tableDensity || 'middle',
      u.cardOpacity ?? 0.72,
      u.auroraEnabled ?? 1,
      u.cardOpacityAlpha ?? 0.82,
      u.demoModeEnabled ?? 1
    );
  }

  // 填充统计配置
  const statsRow = db.prepare('SELECT COUNT(*) as c FROM registered_stats').get();
  if (statsRow.c === 0 && tpl.stats) {
    const insertStats = db.prepare(`
      INSERT INTO registered_stats (id, name, chartType, dataSource, config, orderIndex, enabled)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    for (const s of tpl.stats) {
      insertStats.run(s.id, s.name, s.chartType, s.dataSource, JSON.stringify(s.config || {}), s.orderIndex || 0, s.enabled ?? 1);
    }
  }

  // 填充知识库分类
  const kcRow = db.prepare('SELECT COUNT(*) as c FROM knowledge_category').get();
  if (kcRow.c === 0 && tpl.knowledgeCategories) {
    const now = todayStr();
    const insertKc = db.prepare(`
      INSERT INTO knowledge_category (id, name, description, orderIndex, createdAt)
      VALUES (?, ?, ?, ?, ?)
    `);
    for (const kc of tpl.knowledgeCategories) {
      insertKc.run(kc.id, kc.name, kc.description || '', kc.orderIndex || 0, now);
    }
  }

  // 填充跳转配置
  const jumperRow = db.prepare('SELECT COUNT(*) as c FROM jumper_config').get();
  if (jumperRow.c === 0 && tpl.jumperConfig) {
    db.prepare(`
      INSERT INTO jumper_config (id, personTemplate, groupTemplate)
      VALUES ('default', ?, ?)
    `).run(
      tpl.jumperConfig.personTemplate || '',
      tpl.jumperConfig.groupTemplate || ''
    );
  }

  // 确保有示例项目
  demo.ensureDemoProjects();
}

// 统一导出
console.log('[DB] 开始导出...');
module.exports = {
  // 初始化
  initDatabase,
  getDb,
  loadTemplate,
  genProjectId,
  pad4,
  todayStr,

  // 项目
  ...projects,

  // 字段
  ...fields,

  // 模板
  ...templates,

  // 设置
  ...settings,

  // AI 配置
  ...aiConfig,

  // 知识库
  ...knowledge,

  // 统计
  ...stats,

  // 示例数据
  ...demo,

  // 文本解析
  ...textParser,

  // 跳转配置
  ...jumper
};
