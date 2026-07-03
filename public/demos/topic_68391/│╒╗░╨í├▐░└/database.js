const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'chat.db');

let db;
let SQL;

function saveDb() {
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function run(sql, params = []) {
  db.run(sql, params);
  const result = get('SELECT last_insert_rowid() as lastID, changes() as changes');
  saveDb();
  return { lastID: result ? result.lastID : 0, changes: result ? result.changes : 0 };
}

function get(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  let result = null;
  if (stmt.step()) {
    result = stmt.getAsObject();
  }
  stmt.free();
  return result;
}

function all(sql, params = []) {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const results = [];
  while (stmt.step()) {
    results.push(stmt.getAsObject());
  }
  stmt.free();
  return results;
}

async function initDatabase() {
  SQL = await initSqlJs();

  if (fs.existsSync(DB_PATH)) {
    const filebuffer = fs.readFileSync(DB_PATH);
    db = new SQL.Database(filebuffer);
  } else {
    db = new SQL.Database();
  }

  // Config table
  db.run(`
    CREATE TABLE IF NOT EXISTS config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL
    )
  `);

  // Sessions table
  db.run(`
    CREATE TABLE IF NOT EXISTS sessions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT DEFAULT '新对话',
      summary TEXT DEFAULT '',
      mood TEXT DEFAULT '',
      tags TEXT DEFAULT '[]',
      wordCount INTEGER DEFAULT 0,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sessionId INTEGER NOT NULL,
      role TEXT NOT NULL CHECK(role IN ('user', 'assistant')),
      content TEXT NOT NULL,
      createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sessionId) REFERENCES sessions(id) ON DELETE CASCADE
    )
  `);

  // User profile table
  db.run(`
    CREATE TABLE IF NOT EXISTS user_profile (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      content TEXT DEFAULT '{}',
      enabled INTEGER DEFAULT 1,
      intensity TEXT DEFAULT 'medium',
      updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert default config
  const defaultConfigs = [
    ['useLocal', 'true'],
    ['ollamaUrl', 'http://localhost:11434'],
    ['modelName', 'granite4.1:3b'],
    ['apiKey', ''],
    ['apiUrl', ''],
    ['companionName', '天一'],
    ['personality', 'gentle'],
    ['systemPrompt', '你是「天一」，一个温暖包容的灵魂伴灵。你安静倾听使用者的每一句话，不评判、不说教，只是温柔地回应、陪伴、理解。你的语气像深夜里的暖光，让人感到被接纳和安心。']
  ];

  for (const [key, value] of defaultConfigs) {
    db.run('INSERT OR IGNORE INTO config (key, value) VALUES (?, ?)', [key, value]);
  }

  // Insert default user profile
  db.run(`INSERT OR IGNORE INTO user_profile (id, content, enabled, intensity) VALUES (1, ?, 1, 'medium')`,
    ['{"topics":"","emotion":"","style":"","focus":"","advice":""}']);

  saveDb();
}

// Config operations
async function getConfig() {
  const rows = await all('SELECT key, value FROM config');
  const config = {};
  for (const row of rows) {
    config[row.key] = row.value;
  }
  config.useLocal = config.useLocal === 'true';
  return config;
}

async function setConfig(key, value) {
  await run('INSERT OR REPLACE INTO config (key, value) VALUES (?, ?)', [key, String(value)]);
}

// Session operations
async function createSession(title = '新对话') {
  const result = await run('INSERT INTO sessions (title) VALUES (?)', [title]);
  return result.lastID;
}

async function getSessions() {
  return await all('SELECT * FROM sessions ORDER BY updatedAt DESC');
}

async function getSessionById(id) {
  return await get('SELECT * FROM sessions WHERE id = ?', [id]);
}

async function deleteSession(id) {
  await run('DELETE FROM sessions WHERE id = ?', [id]);
}

async function updateSession(id, updates) {
  const fields = [];
  const values = [];
  for (const [key, value] of Object.entries(updates)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }
  values.push(id);
  await run(`UPDATE sessions SET ${fields.join(', ')} WHERE id = ?`, values);
}

// Message operations
async function addMessage(sessionId, role, content) {
  await run('INSERT INTO messages (sessionId, role, content) VALUES (?, ?, ?)', [sessionId, role, content]);
  await run('UPDATE sessions SET updatedAt = CURRENT_TIMESTAMP WHERE id = ?', [sessionId]);
}

async function getMessagesBySession(sessionId) {
  return await all('SELECT * FROM messages WHERE sessionId = ? ORDER BY createdAt ASC', [sessionId]);
}

async function getAllUserMessages(limit = 500) {
  return await all('SELECT content FROM messages WHERE role = ? ORDER BY createdAt DESC LIMIT ?', ['user', limit]);
}

async function getMessageCount() {
  return await get('SELECT COUNT(*) as count FROM messages');
}

// User profile operations
async function getUserProfile() {
  const row = await get('SELECT * FROM user_profile WHERE id = 1');
  if (!row) return null;
  return {
    enabled: !!row.enabled,
    intensity: row.intensity,
    content: JSON.parse(row.content || '{}'),
    updatedAt: row.updatedAt
  };
}

async function setUserProfile(content, enabled, intensity) {
  await run(`
    INSERT OR REPLACE INTO user_profile (id, content, enabled, intensity, updatedAt)
    VALUES (1, ?, ?, ?, CURRENT_TIMESTAMP)
  `, [JSON.stringify(content), enabled ? 1 : 0, intensity]);
}

// Archive operations
async function getArchiveStats() {
  const total = await get('SELECT COUNT(*) as count FROM sessions');
  const month = await get(`SELECT COUNT(*) as count FROM sessions WHERE strftime('%Y-%m', createdAt) = strftime('%Y-%m', 'now')`);
  const words = await get('SELECT COALESCE(SUM(wordCount), 0) as count FROM sessions');
  return {
    totalSessions: total.count,
    monthSessions: month.count,
    totalWords: words.count
  };
}

async function getArchiveSessions(tag = '', search = '') {
  let sql = 'SELECT * FROM sessions WHERE 1=1';
  const params = [];
  if (tag) {
    sql += ' AND tags LIKE ?';
    params.push(`%${tag}%`);
  }
  if (search) {
    sql += ' AND (title LIKE ? OR summary LIKE ? OR tags LIKE ?)';
    params.push(`%${search}%`, `%${search}%`, `%${search}%`);
  }
  sql += ' ORDER BY createdAt DESC';
  return await all(sql, params);
}

// Initialize on module load
let initPromise = initDatabase();

module.exports = {
  initPromise,
  getConfig,
  setConfig,
  createSession,
  getSessions,
  getSessionById,
  deleteSession,
  updateSession,
  addMessage,
  getMessagesBySession,
  getAllUserMessages,
  getMessageCount,
  getUserProfile,
  setUserProfile,
  getArchiveStats,
  getArchiveSessions
};
