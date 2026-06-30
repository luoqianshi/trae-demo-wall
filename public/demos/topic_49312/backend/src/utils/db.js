/**
 * 数据库连接工具
 * 使用 sql.js（纯 JavaScript SQLite 实现）操作数据库
 * 提供与 better-sqlite3 兼容的 API
 *
 * 使用方式：
 *   const db = require('./utils/db');
 *   // db 已自动初始化（通过顶层同步等待）
 *   // 或在异步上下文中：await db.ready;
 */
const initSqlJs = require('sql.js');
const path = require('path');
const fs = require('fs');

// 数据库文件路径
const dbDir = path.join(__dirname, '../..');
const dbPath = path.join(dbDir, 'hr_system.db');

let _db = null;
let _transactionDepth = 0; // 事务嵌套计数器，用于控制自动持久化

/**
 * 将内存数据库持久化到文件
 */
function save() {
  if (!_db) return;
  const data = _db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbPath, buffer);
}

/**
 * 内部自动持久化：仅在非事务上下文中才自动保存
 */
function autoSave() {
  if (_transactionDepth === 0) {
    save();
  }
}

/**
 * 包装 Statement 对象，提供与 better-sqlite3 兼容的 API
 */
class Statement {
  constructor(sql) {
    this._stmt = _db.prepare(sql);
  }

  /**
   * 执行带参数的写操作（INSERT/UPDATE/DELETE）
   * 返回 { changes, lastInsertRowid } 以兼容 better-sqlite3
   */
  run(...params) {
    if (params.length > 0) {
      this._stmt.bind(params);
    }
    this._stmt.step();
    this._stmt.free();

    const changes = _db.getRowsModified();
    const lastInsertResult = _db.exec('SELECT last_insert_rowid() as lid');
    const lastInsertRowid = (lastInsertResult.length > 0 && lastInsertResult[0].values.length > 0)
      ? lastInsertResult[0].values[0][0]
      : 0;

    autoSave();

    return { changes, lastInsertRowid };
  }

  /**
   * 获取单行数据
   */
  get(...params) {
    if (params.length > 0) {
      this._stmt.bind(params);
    }
    const hasResult = this._stmt.step();
    let row = null;
    if (hasResult) {
      row = this._stmt.getAsObject();
    }
    this._stmt.free();
    return row;
  }

  /**
   * 获取所有行数据
   */
  all(...params) {
    if (params.length > 0) {
      this._stmt.bind(params);
    }
    const rows = [];
    while (this._stmt.step()) {
      rows.push(this._stmt.getAsObject());
    }
    this._stmt.free();
    return rows;
  }
}

/**
 * 数据库兼容层对象
 */
const db = {
  /**
   * 准备一条 SQL 语句
   */
  prepare(sql) {
    return new Statement(sql);
  },

  /**
   * 执行一条或多条 SQL（无参数）
   * 注意：sql.js 的 Database.run() 不支持多条语句，需要逐条执行
   */
  exec(sql) {
    // 按分号分割SQL语句（简单处理，忽略空行和注释中的分号）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);
    for (const stmt of statements) {
      _db.run(stmt);
    }
    autoSave();
  },

  /**
   * 执行 PRAGMA 语句
   */
  pragma(sql) {
    _db.run(sql);
  },

  /**
   * 直接运行 SQL（用于事务控制等场景）
   */
  run(sql) {
    _db.run(sql);
    // run() 不自动 save，由调用方控制（事务场景下 BEGIN/COMMIT/ROLLBACK 不需要 save）
  },

  /**
   * 事务支持：与 better-sqlite3 的 db.transaction(fn) 兼容
   * transaction(fn) 返回一个新函数，调用该新函数时会在事务中执行 fn
   */
  transaction(fn) {
    return function(...args) {
      _transactionDepth++;
      _db.run('BEGIN');
      try {
        fn(...args);
        _db.run('COMMIT');
        _transactionDepth--;
        save(); // 事务结束时统一持久化
      } catch (e) {
        _db.run('ROLLBACK');
        _transactionDepth--;
        throw e;
      }
    };
  },

  /**
   * 手动持久化（供外部调用）
   */
  save,

  /**
   * 关闭数据库
   */
  close() {
    save();
    _db.close();
  }
};

/**
 * 异步初始化数据库
 * 必须在使用 db 对象之前调用
 */
async function initDb() {
  if (_db) return; // 已初始化则跳过

  if (!fs.existsSync(dbPath)) {
    console.error('错误: 数据库文件不存在，请先运行 node init-db.js 初始化数据库');
    process.exit(1);
  }

  const SQL = await initSqlJs();
  const fileBuffer = fs.readFileSync(dbPath);
  _db = new SQL.Database(fileBuffer);

  // 设置 PRAGMA
  _db.run('PRAGMA journal_mode=WAL');
  _db.run('PRAGMA busy_timeout=5000');
  _db.run('PRAGMA foreign_keys=ON');

  console.log('数据库加载成功:', dbPath);
}

db.init = initDb;
db.ready = initDb();

module.exports = db;
