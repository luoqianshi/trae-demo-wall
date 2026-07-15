const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.join(__dirname, '..', 'data', 'tongban.db');

if (!fs.existsSync(path.dirname(dbPath))) {
  fs.mkdirSync(path.dirname(dbPath), { recursive: true });
}

const db = new sqlite3.Database(dbPath);

function run(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function get(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function all(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

function initDatabase() {
  const initSql = `
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      phone TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      nickname TEXT,
      avatar TEXT,
      role TEXT NOT NULL DEFAULT 'visually_impaired',
      real_name TEXT,
      id_card TEXT,
      emergency_contact TEXT,
      emergency_phone TEXT,
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS family_bindings (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      family_id TEXT NOT NULL DEFAULT '',
      relation TEXT,
      status TEXT DEFAULT 'pending',
      invite_code TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS locations (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      accuracy REAL,
      altitude REAL,
      speed REAL,
      heading REAL,
      timestamp INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS geo_fences (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'circle',
      center_lat REAL,
      center_lng REAL,
      radius REAL,
      points TEXT,
      is_safe INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS fence_alerts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      fence_id TEXT NOT NULL,
      fence_name TEXT,
      alert_type TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      status TEXT DEFAULT 'unread',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sos_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      user_name TEXT,
      latitude REAL,
      longitude REAL,
      address TEXT,
      status TEXT DEFAULT 'pending',
      handled_by TEXT,
      handled_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS navigation_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      start_name TEXT,
      start_lat REAL,
      start_lng REAL,
      end_name TEXT,
      end_lat REAL,
      end_lng REAL,
      mode TEXT NOT NULL DEFAULT 'walk',
      distance REAL,
      duration INTEGER,
      status TEXT DEFAULT 'completed',
      started_at INTEGER,
      ended_at INTEGER,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ai_recognition_records (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      image_url TEXT,
      recognition_type TEXT NOT NULL,
      result TEXT,
      confidence REAL,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS posts (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      images TEXT,
      location TEXT,
      latitude REAL,
      longitude REAL,
      likes_count INTEGER DEFAULT 0,
      comments_count INTEGER DEFAULT 0,
      is_anonymous INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      content TEXT NOT NULL,
      parent_id TEXT,
      likes_count INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS post_likes (
      id TEXT PRIMARY KEY,
      post_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      UNIQUE(post_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      sender_id TEXT NOT NULL,
      receiver_id TEXT NOT NULL,
      content TEXT NOT NULL,
      type TEXT DEFAULT 'text',
      is_read INTEGER DEFAULT 0,
      created_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS danger_marks (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      title TEXT,
      description TEXT,
      latitude REAL NOT NULL,
      longitude REAL NOT NULL,
      address TEXT,
      photo_url TEXT,
      severity TEXT DEFAULT 'normal',
      status TEXT DEFAULT 'active',
      report_count INTEGER DEFAULT 1,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      voice_speed REAL DEFAULT 1.0,
      voice_volume REAL DEFAULT 1.0,
      haptic_enabled INTEGER DEFAULT 1,
      wake_word_enabled INTEGER DEFAULT 1,
      location_sharing INTEGER DEFAULT 0,
      high_contrast_mode INTEGER DEFAULT 0,
      large_text_mode INTEGER DEFAULT 0,
      auto_brake_warning INTEGER DEFAULT 1,
      updated_at INTEGER NOT NULL
    );
  `;

  db.exec(initSql, (err) => {
    if (err) {
      console.error('数据库初始化失败:', err);
    } else {
      console.log('✅ 数据库初始化完成');
    }
  });
}

module.exports = {
  db,
  run,
  get,
  all,
  initDatabase
};
