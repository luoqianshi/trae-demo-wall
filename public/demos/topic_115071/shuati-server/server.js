/* 刷题软件后端 - 持久化题库 / 错题本 / 刷题进度 */
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const fsp = require('fs/promises');
const path = require('path');

const app = express();
const PORT = 8766;
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'db.json');
const TMP_FILE = DATA_FILE + '.tmp';

// ========== 配置 ==========
const CONFIG = {
  RESULTS_DEBOUNCE_MS: 300,   // 作答写入防抖
  PROGRESS_DEBOUNCE_MS: 500,  // 进度写入防抖
  BANK_MAX_ENTRIES: 100000,   // 题库上限
  HISTORY_MAX_ITEMS: 100,     // 历史记录上限
  BODY_LIMIT: '50mb',         // 请求体上限
};

// ========== 请求日志中间件 ==========
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    const level = res.statusCode >= 400 ? '⚠' : '→';
    console.log(`[${new Date().toISOString().slice(11, 19)}] ${level} ${req.method} ${req.path} - ${res.statusCode} - ${ms}ms`);
  });
  next();
});

app.use(cors());
app.use(express.json({ limit: CONFIG.BODY_LIMIT }));

// ========== 数据库（内存缓存 + 异步写入队列） ==========
// 确保 data 目录存在
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// 初始化数据库结构
const DEFAULT_DB = Object.freeze({
  bank: [],
  wrongbook: [],
  history: [],
  results: {},
  progress: {},
  starred: {},
});

function loadDB() {
  if (!fs.existsSync(DATA_FILE)) {
    const init = { ...DEFAULT_DB, bank: [], wrongbook: [], history: [], results: {}, progress: {} };
    try { fs.writeFileSync(DATA_FILE, JSON.stringify(init, null, 2)); } catch {}
    return init;
  }
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    const db = JSON.parse(raw);
    // 兜底：旧版兼容
    if (!db.results || Array.isArray(db.results)) {
      db.results = Array.isArray(db.results) ? { __all__: db.results } : {};
    }
    if (!db.progress || (typeof db.progress === 'object' && !Array.isArray(db.progress) && 'total' in db.progress && !Object.values(db.progress).some(v => typeof v === 'object' && 'done' in v))) {
      // 旧版单对象 → 按分组结构
      if ('total' in (db.progress || {})) db.progress = { __all__: db.progress };
      else db.progress = {};
    }
    // 确保所有顶层 key 存在（兼容旧版 db）
    for (const key of Object.keys(DEFAULT_DB)) {
      if (!(key in db)) db[key] = JSON.parse(JSON.stringify(DEFAULT_DB[key]));
    }
    return db;
  } catch (err) {
    console.error('[DB] 加载失败，使用空数据库:', err.message);
    return { bank: [], wrongbook: [], history: [], results: {}, progress: {} };
  }
}

// 写队列：串行化所有写入，防止交错
let writeQueue = Promise.resolve();

/** 原子写入：先写 .tmp 再 rename */
async function writeAtomic(db) {
  const json = JSON.stringify(db, null, 2);
  await fsp.writeFile(TMP_FILE, json, 'utf8');
  await fsp.rename(TMP_FILE, DATA_FILE);
}

/** 调度写入（所有写入经此串行化） */
function scheduleDBWrite(db) {
  writeQueue = writeQueue.then(() => writeAtomic(db)).catch(err => {
    console.error('[DB] 写入失败:', err.message);
  });
  return writeQueue;
}

// ========== 防抖写入（针对高频端点） ==========
/** @type {Map<string, {timer: NodeJS.Timeout, db: object}>} */
const debounceTimers = new Map();

function debouncedSave(key, db, delayMs) {
  const existing = debounceTimers.get(key);
  if (existing) clearTimeout(existing.timer);
  const timer = setTimeout(() => {
    debounceTimers.delete(key);
    scheduleDBWrite(db);
  }, delayMs);
  debounceTimers.set(key, { timer, db });
}

/** 立即刷盘所有待写入的防抖 */
async function flushAllPending() {
  for (const [key, entry] of debounceTimers) {
    clearTimeout(entry.timer);
    debounceTimers.delete(key);
    await writeAtomic(entry.db);
  }
}

// 内存中缓存的数据库引用（请求间共享）
let dbCache = loadDB();

function refreshCache() { dbCache = loadDB(); return dbCache; }
function getDB() { return dbCache; }

// ========== 工具 ==========
function assertObject(val, name) {
  if (typeof val !== 'object' || val === null || Array.isArray(val)) {
    throw { status: 400, message: `${name} 必须是一个对象（非数组）` };
  }
}
function assertArray(val, name) {
  if (!Array.isArray(val)) {
    throw { status: 400, message: `${name} 必须是一个数组` };
  }
}
function assertArrayMax(val, name, max) {
  assertArray(val, name);
  if (val.length > max) {
    throw { status: 400, message: `${name} 超过上限 ${max} 条（当前 ${val.length}）` };
  }
}

// ========== 路由 ==========

// 健康检查
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: Date.now() });
});

// 拉取全量数据（前端初始化用）
app.get('/api/all', (req, res) => {
  res.json(getDB());
});

// ------ 题库 ------
app.get('/api/bank', (req, res) => {
  res.json(getDB().bank);
});

app.post('/api/bank', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = Array.isArray(req.body) ? req.body : [];
    assertArrayMax(incoming, '题库', CONFIG.BANK_MAX_ENTRIES);
    const existing = new Set(db.bank.map(q => (q.stem || '').slice(0, 30)));
    let added = 0;
    for (const q of incoming) {
      const k = (q.stem || '').slice(0, 30);
      if (k && !existing.has(k)) {
        db.bank.push(q);
        existing.add(k);
        added++;
      }
    }
    scheduleDBWrite(db);
    res.json({ ok: true, added, total: db.bank.length });
  } catch (err) { next(err); }
});

app.delete('/api/bank', (req, res) => {
  const db = getDB();
  db.bank = [];
  scheduleDBWrite(db);
  res.json({ ok: true });
});

// PUT 全量替换题库（用于删除/清空同步）
app.put('/api/bank', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = Array.isArray(req.body) ? req.body : [];
    assertArrayMax(incoming, '题库', CONFIG.BANK_MAX_ENTRIES);
    db.bank = incoming;
    scheduleDBWrite(db);
    res.json({ ok: true, total: db.bank.length });
  } catch (err) { next(err); }
});

// ------ 错题本 ------
app.get('/api/wrongbook', (req, res) => {
  res.json(getDB().wrongbook);
});

app.post('/api/wrongbook', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = req.body || [];
    assertArray(incoming, '错题本');
    db.wrongbook = incoming;
    scheduleDBWrite(db);
    res.json({ ok: true, total: db.wrongbook.length });
  } catch (err) { next(err); }
});

// PUT 全量替换错题本
app.put('/api/wrongbook', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = Array.isArray(req.body) ? req.body : [];
    assertArray(incoming, '错题本');
    db.wrongbook = incoming;
    scheduleDBWrite(db);
    res.json({ ok: true, total: db.wrongbook.length });
  } catch (err) { next(err); }
});

// ------ 历史成绩 ------
app.get('/api/history', (req, res) => {
  res.json(getDB().history);
});

app.post('/api/history', (req, res, next) => {
  try {
    const db = getDB();
    const item = req.body || {};
    assertObject(item, '历史记录项');
    item.time = item.time || Date.now();
    db.history.unshift(item);
    db.history = db.history.slice(0, CONFIG.HISTORY_MAX_ITEMS);
    scheduleDBWrite(db);
    res.json({ ok: true });
  } catch (err) { next(err); }
});

// PUT 全量替换历史
app.put('/api/history', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = Array.isArray(req.body) ? req.body : [];
    assertArray(incoming, '历史记录');
    db.history = incoming;
    scheduleDBWrite(db);
    res.json({ ok: true, total: db.history.length });
  } catch (err) { next(err); }
});

// ------ 刷题进度 ------
app.get('/api/progress', (req, res) => {
  res.json(getDB().progress);
});

app.post('/api/progress', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = req.body || {};
    assertObject(incoming, '进度');
    db.progress = incoming;
    // 进度写入频率中等，用防抖
    debouncedSave('progress', db, CONFIG.PROGRESS_DEBOUNCE_MS);
    res.json({ ok: true, progress: db.progress });
  } catch (err) { next(err); }
});

// PUT 全量替换进度
app.put('/api/progress', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = req.body || {};
    assertObject(incoming, '进度');
    db.progress = incoming;
    scheduleDBWrite(db);
    res.json({ ok: true, progress: db.progress });
  } catch (err) { next(err); }
});

// ------ 作答记录（高频写入）------
app.get('/api/results', (req, res) => {
  res.json(getDB().results);
});

app.post('/api/results', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = req.body;
    if (typeof incoming === 'object' && !Array.isArray(incoming) && incoming !== null) {
      db.results = incoming;
    } else if (Array.isArray(incoming)) {
      db.results = { __all__: incoming };
    } else {
      throw { status: 400, message: 'results 必须是对象或数组' };
    }
    // 高频写入：使用防抖减少磁盘 IO
    debouncedSave('results', db, CONFIG.RESULTS_DEBOUNCE_MS);
    res.json({ ok: true, groups: Object.keys(db.results) });
  } catch (err) { next(err); }
});

// PUT 全量替换作答记录
app.put('/api/results', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = req.body;
    if (typeof incoming === 'object' && !Array.isArray(incoming) && incoming !== null) {
      db.results = incoming;
    } else if (Array.isArray(incoming)) {
      db.results = { __all__: incoming };
    } else {
      throw { status: 400, message: 'results 必须是对象或数组' };
    }
    scheduleDBWrite(db);
    res.json({ ok: true, groups: Object.keys(db.results) });
  } catch (err) { next(err); }
});

app.delete('/api/results', (req, res) => {
  const db = getDB();
  db.results = {};
  scheduleDBWrite(db);
  res.json({ ok: true });
});

// ------ 清空所有数据 ------
app.post('/api/clear', (req, res) => {
  const db = getDB();
  db.bank = []; db.wrongbook = []; db.history = [];
  db.results = {}; db.progress = {}; db.starred = {};
  scheduleDBWrite(db);
  res.json({ ok: true });
});

// ------ 收藏 ------
app.get('/api/starred', (req, res) => { res.json(getDB().starred || {}); });
app.put('/api/starred', (req, res, next) => {
  try {
    const db = getDB();
    const incoming = req.body || {};
    if (typeof incoming !== 'object' || Array.isArray(incoming)) throw { status: 400, message: 'starred 必须是对象' };
    db.starred = incoming;
    scheduleDBWrite(db);
    res.json({ ok: true, count: Object.keys(db.starred).length });
  } catch (err) { next(err); }
});

// ========== 错误处理中间件 ==========
app.use((err, req, res, _next) => {
  const status = err.status || 500;
  const message = err.message || '服务器内部错误';
  if (status >= 500) console.error('[ERROR]', err.stack || err.message);
  res.status(status).json({ ok: false, error: message });
});

// ========== 静态文件服务 ==========
app.use(express.static(path.join(__dirname, '..', 'shuati-app')));

// ========== 启动服务器 ==========
const server = app.listen(PORT, () => {
  console.log(`[shuati-server] 监听 http://localhost:${PORT}`);
  console.log(`[shuati-server] 数据文件 ${DATA_FILE}`);
  console.log(`[shuati-server] 题库 ${getDB().bank.length} 题 · 错题本 ${getDB().wrongbook.length} 条`);
});

// ========== 优雅关闭 ==========
async function gracefulShutdown(signal) {
  console.log(`\n[shuati-server] 收到 ${signal}，正在优雅关闭...`);
  // 1. 停止接收新连接
  server.close();
  // 2. 刷盘所有待写入
  await flushAllPending();
  // 3. 最后一次全量写入确保数据完整
  try { await writeAtomic(getDB()); } catch {}
  console.log('[shuati-server] 数据已保存，再见。');
  process.exit(0);
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// 未捕获异常兜底
process.on('uncaughtException', (err) => {
  console.error('[FATAL] 未捕获异常:', err);
  try { fs.writeFileSync(DATA_FILE, JSON.stringify(getDB(), null, 2)); } catch {}
  process.exit(1);
});
