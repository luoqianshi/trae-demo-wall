// 数据库初始化模块
// 使用 better-sqlite3 创建并管理 SQLite 数据库

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');

// 确保数据目录存在
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// 确保上传目录存在
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// 创建数据库连接（同步 API）
const db = new Database(path.join(dataDir, 'shiguangji.db'));

// 开启 WAL 模式以提升并发性能
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

/**
 * 初始化数据库表结构
 */
function initDatabase() {
  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // 美食记录表
  db.exec(`
    CREATE TABLE IF NOT EXISTS records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      dish_name TEXT NOT NULL,
      image_path TEXT,
      emoji TEXT DEFAULT '🍽️',
      date TEXT NOT NULL,
      meal_type TEXT DEFAULT 'dinner',
      tags TEXT DEFAULT '[]',
      difficulty TEXT DEFAULT 'easy',
      cook_time INTEGER DEFAULT 0,
      calories INTEGER DEFAULT 0,
      notes TEXT,
      rating INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 社区帖子表
  db.exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      title TEXT NOT NULL,
      content TEXT,
      image_path TEXT,
      record_id INTEGER,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (record_id) REFERENCES records(id) ON DELETE SET NULL
    );
  `);

  // 评论表
  db.exec(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      content TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 点赞表
  db.exec(`
    CREATE TABLE IF NOT EXISTS likes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(post_id, user_id),
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // 关注关系表
  db.exec(`
    CREATE TABLE IF NOT EXISTS follows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      follower_id INTEGER NOT NULL,
      following_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(follower_id, following_id),
      FOREIGN KEY (follower_id) REFERENCES users(id),
      FOREIGN KEY (following_id) REFERENCES users(id)
    );
  `);

  // 创建默认管理员账号
  createDefaultAdmin();
}

/**
 * 创建默认管理员账号
 * 从环境变量读取管理员用户名和密码
 */
function createDefaultAdmin() {
  const adminUsername = process.env.ADMIN_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

  // 查询管理员是否已存在
  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(adminUsername);

  if (!existing) {
    // 哈希密码
    const hashedPassword = bcrypt.hashSync(adminPassword, 10);
    db.prepare(
      'INSERT INTO users (username, password, role) VALUES (?, ?, ?)'
    ).run(adminUsername, hashedPassword, 'admin');
    console.log(`默认管理员账号已创建: ${adminUsername}`);
  }
}

// 模块加载时初始化数据库
initDatabase();

module.exports = db;
