// SQLite Database Manager
// Main SQLite database connection and initialization

import Database from 'better-sqlite3';
import { pathManager } from '../../main/utils/path';
import { logger } from '../../main/utils/logger';
import { MigrationManager } from './migrations/index';
import fs from 'fs';
import path from 'path';

/**
 * 数据库配置接口
 */
export interface DatabaseConfig {
  /** 数据库文件路径，默认使用 PathManager 获取 */
  databasePath?: string;
  /** 是否开启外键约束，默认 true */
  foreignKeys?: boolean;
  /** 是否开启 WAL 模式，默认 true */
  walMode?: boolean;
  /** 忙碌超时时间（毫秒），默认 5000 */
  busyTimeout?: number;
}

/**
 * 数据库统计信息
 */
export interface DatabaseStats {
  /** 数据库文件大小（字节） */
  fileSize: number;
  /** 数据库页数 */
  pageCount: number;
  /** 数据库页大小（字节） */
  pageSize: number;
  /** WAL 文件大小（字节） */
  walSize: number;
  /** 表数量 */
  tableCount: number;
  /** 索引数量 */
  indexCount: number;
}

/**
 * SQLite 数据库管理器（单例模式）
 * 负责数据库连接的创建、管理和关闭
 */
export class SQLiteDatabase {
  private static instance: SQLiteDatabase | null = null;
  private db: Database.Database | null = null;
  private migrationManager: MigrationManager | null = null;
  private config: Required<DatabaseConfig>;

  private constructor(config: DatabaseConfig = {}) {
    this.config = {
      databasePath: config.databasePath || pathManager.getDatabasePath(),
      foreignKeys: config.foreignKeys ?? true,
      walMode: config.walMode ?? true,
      busyTimeout: config.busyTimeout ?? 5000,
    };
  }

  /**
   * 获取数据库单例实例
   */
  public static getInstance(config?: DatabaseConfig): SQLiteDatabase {
    if (!SQLiteDatabase.instance) {
      SQLiteDatabase.instance = new SQLiteDatabase(config);
    }
    return SQLiteDatabase.instance;
  }

  /**
   * 打开数据库连接
   */
  public open(): Database.Database {
    if (this.db) {
      logger.warn('Database already open, returning existing connection');
      return this.db;
    }

    try {
      // 确保数据库目录存在
      const dbDir = path.dirname(this.config.databasePath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      // 创建数据库连接
      this.db = new Database(this.config.databasePath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined,
      });

      // 配置数据库
      this.configureDatabase();

      // 初始化迁移管理器
      this.migrationManager = new MigrationManager(this.db);

      logger.info(`Database opened successfully at ${this.config.databasePath}`);
      return this.db;
    } catch (error) {
      logger.error('Failed to open database:', error);
      throw error;
    }
  }

  /**
   * 配置数据库参数
   */
  private configureDatabase(): void {
    if (!this.db) return;

    // 开启外键约束
    if (this.config.foreignKeys) {
      this.db.pragma('foreign_keys = ON');
    }

    // 开启 WAL 模式（Write-Ahead Logging）
    if (this.config.walMode) {
      this.db.pragma('journal_mode = WAL');
    }

    // 设置忙碌超时
    this.db.pragma(`busy_timeout = ${this.config.busyTimeout}`);

    // 设置同步模式为 NORMAL（性能优化）
    this.db.pragma('synchronous = NORMAL');

    // 设置缓存大小（负数表示 KB，正数表示页数）
    this.db.pragma('cache_size = -64000'); // 64MB

    // 设置临时文件存储位置
    this.db.pragma('temp_store = MEMORY');

    logger.debug('Database configured with:', {
      foreignKeys: this.config.foreignKeys,
      walMode: this.config.walMode,
      busyTimeout: this.config.busyTimeout,
    });
  }

  /**
   * 获取数据库连接
   */
  public getDatabase(): Database.Database {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }
    return this.db;
  }

  /**
   * 获取迁移管理器
   */
  public getMigrationManager(): MigrationManager {
    if (!this.migrationManager) {
      throw new Error('Database not initialized. Call open() first.');
    }
    return this.migrationManager;
  }

  /**
   * 运行数据库迁移
   */
  public async migrate(): Promise<void> {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }

    try {
      await this.migrationManager?.applyMigrations();
      logger.info('Database migrations applied successfully');
    } catch (error) {
      logger.error('Failed to apply migrations:', error);
      throw error;
    }
  }

  /**
   * 关闭数据库连接
   */
  public close(): void {
    if (this.db) {
      try {
        // 执行检查点操作，将 WAL 内容写入数据库
        if (this.config.walMode) {
          this.db.pragma('wal_checkpoint(TRUNCATE)');
        }

        this.db.close();
        this.db = null;
        this.migrationManager = null;
        logger.info('Database closed successfully');
      } catch (error) {
        logger.error('Failed to close database:', error);
        throw error;
      }
    }
  }

  /**
   * 备份数据库到指定路径
   */
  public backup(backupPath: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.db) {
        reject(new Error('Database not initialized. Call open() first.'));
        return;
      }

      try {
        // 确保备份目录存在
        const backupDir = path.dirname(backupPath);
        if (!fs.existsSync(backupDir)) {
          fs.mkdirSync(backupDir, { recursive: true });
        }

        // 执行备份
        this.db.backup(backupPath)
          .then(() => {
            logger.info(`Database backed up to ${backupPath}`);
            resolve(backupPath);
          })
          .catch((error: unknown) => {
            logger.error('Failed to backup database:', error);
            reject(error instanceof Error ? error : new Error(String(error)));
          });
      } catch (error) {
        logger.error('Failed to backup database:', error);
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    });
  }

  /**
   * 获取数据库统计信息
   */
  public getStats(): DatabaseStats {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }

    const dbPath = this.config.databasePath;
    const walPath = `${dbPath}-wal`;

    // 获取页信息
    const pageCount = this.db.pragma('page_count', { simple: true }) as number;
    const pageSize = this.db.pragma('page_size', { simple: true }) as number;

    // 获取表和索引数量
    const tables = this.db
      .prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'fts_%'"
      )
      .get() as { count: number };

    const indexes = this.db
      .prepare(
        "SELECT count(*) as count FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
      )
      .get() as { count: number };

    return {
      fileSize: fs.existsSync(dbPath) ? fs.statSync(dbPath).size : 0,
      pageCount,
      pageSize,
      walSize: fs.existsSync(walPath) ? fs.statSync(walPath).size : 0,
      tableCount: tables.count,
      indexCount: indexes.count,
    };
  }

  /**
   * 执行事务
   */
  public transaction<T>(fn: () => T): T {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }
    return this.db.transaction(fn)();
  }

  /**
   * 执行 SQL 命令
   */
  public exec(sql: string): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }
    this.db.exec(sql);
  }

  /**
   * 优化数据库（VACUUM）
   */
  public optimize(): void {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }

    try {
      // 执行 VACUUM 重建数据库文件
      this.db.exec('VACUUM');
      logger.info('Database optimized successfully');
    } catch (error) {
      logger.error('Failed to optimize database:', error);
      throw error;
    }
  }

  /**
   * 执行完整性检查
   */
  public integrityCheck(): boolean {
    if (!this.db) {
      throw new Error('Database not initialized. Call open() first.');
    }

    try {
      const result = this.db.pragma('integrity_check');
      const checkResult = result as Array<{ integrity_check: string }>;
      const isOk = checkResult.length === 1 && checkResult[0].integrity_check === 'ok';

      if (isOk) {
        logger.info('Database integrity check passed');
      } else {
        logger.error('Database integrity check failed:', checkResult);
      }

      return isOk;
    } catch (error) {
      logger.error('Failed to perform integrity check:', error);
      throw error;
    }
  }

  /**
   * 重置数据库单例（仅用于测试）
   */
  public static resetInstance(): void {
    if (SQLiteDatabase.instance) {
      SQLiteDatabase.instance.close();
      SQLiteDatabase.instance = null;
    }
  }
}

// 导出数据库管理器实例的便捷方法
export const database = {
  get instance(): SQLiteDatabase {
    return SQLiteDatabase.getInstance();
  },

  get db(): Database.Database {
    return SQLiteDatabase.getInstance().getDatabase();
  },

  open(): Database.Database {
    return SQLiteDatabase.getInstance().open();
  },

  close(): void {
    SQLiteDatabase.getInstance().close();
  },

  async migrate(): Promise<void> {
    await SQLiteDatabase.getInstance().migrate();
  },

  backup(backupPath: string): Promise<string> {
    return SQLiteDatabase.getInstance().backup(backupPath);
  },

  getStats(): DatabaseStats {
    return SQLiteDatabase.getInstance().getStats();
  },

  transaction<T>(fn: () => T): T {
    return SQLiteDatabase.getInstance().transaction(fn);
  },

  exec(sql: string): void {
    SQLiteDatabase.getInstance().exec(sql);
  },

  optimize(): void {
    SQLiteDatabase.getInstance().optimize();
  },

  integrityCheck(): boolean {
    return SQLiteDatabase.getInstance().integrityCheck();
  },
};