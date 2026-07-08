/**
 * SQLite 数据库初始化与连接
 * 使用 better-sqlite3(同步 API,简单高效,无需外部数据库服务)
 */
const Database = require('better-sqlite3');
const path = require('path');

const db = new Database(path.join(__dirname, 'data', 'app.db'));
db.pragma('journal_mode = WAL');

// ====== 建表 ======
db.exec(`
  -- 用户表
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    openid TEXT UNIQUE,                          -- 微信 openid
    nickname TEXT,
    avatar TEXT,
    semester TEXT DEFAULT 'grade7_1',            -- 当前学期
    learn_per_week INTEGER DEFAULT 2,            -- 每周学新次数 2 或 4
    created_at TEXT DEFAULT (datetime('now','localtime'))
  );

  -- 学科表
  CREATE TABLE IF NOT EXISTS subjects (
    code TEXT PRIMARY KEY,                       -- english/chinese/math/...
    name TEXT NOT NULL,
    icon TEXT,
    sort INTEGER DEFAULT 0
  );

  -- 背诵内容表
  CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    subject_code TEXT NOT NULL,
    semester TEXT NOT NULL,                      -- grade7_1 / grade7_2 / ...
    unit TEXT,                                   -- 单元
    title TEXT NOT NULL,                         -- 标题(如:古诗《静夜思》)
    body TEXT NOT NULL,                          -- 背诵正文
    tip TEXT,                                    -- 背诵提示/翻译
    sort INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (subject_code) REFERENCES subjects(code)
  );

  -- 学习记录表(用户学过哪些内容)
  CREATE TABLE IF NOT EXISTS learn_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    learn_date TEXT NOT NULL,                    -- 学新日期
    completed_rounds TEXT DEFAULT '[]',          -- 已完成复习轮次 JSON 数组
    finished INTEGER DEFAULT 0,                  -- 是否已完成全部 14 轮
    created_at TEXT DEFAULT (datetime('now','localtime')),
    UNIQUE(user_id, content_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (content_id) REFERENCES contents(id)
  );

  -- 打卡记录表(每次复习/学新完成打卡)
  CREATE TABLE IF NOT EXISTS checkins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER,
    type TEXT NOT NULL,                          -- learn / review
    round INTEGER,                               -- 复习轮次(review 时)
    read_count INTEGER DEFAULT 3,                -- 跟读次数
    checkin_date TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now','localtime')),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  -- 索引
  CREATE INDEX IF NOT EXISTS idx_contents_subj_sem ON contents(subject_code, semester);
  CREATE INDEX IF NOT EXISTS idx_learn_user ON learn_records(user_id);
  CREATE INDEX IF NOT EXISTS idx_checkins_user_date ON checkins(user_id, checkin_date);
`);

module.exports = db;
