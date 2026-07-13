// Database Migration Manager
// Manages database schema migrations with version control

import Database from 'better-sqlite3';
import { logger } from '../../../main/utils/logger';

/**
 * 迁移记录接口
 */
export interface MigrationRecord {
  id: number;
  version: string;
  name: string;
  applied_at: string;
}

/**
 * 迁移脚本接口
 */
export interface Migration {
  /** 版本号，格式：YYYYMMDDHHMMSS 或 001, 002 等 */
  version: string;
  /** 迁移名称 */
  name: string;
  /** 向上迁移（应用迁移） */
  up: (db: Database.Database) => void;
  /** 向下迁移（回滚迁移） */
  down: (db: Database.Database) => void;
}

/**
 * 迁移管理器
 * 负责数据库迁移的版本控制、应用和回滚
 */
export class MigrationManager {
  private db: Database.Database;
  private migrations: Migration[] = [];

  constructor(db: Database.Database) {
    this.db = db;
    this.ensureMigrationsTable();
  }

  /**
   * 确保迁移记录表存在
   */
  private ensureMigrationsTable(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        version TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        applied_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
      )
    `);
  }

  /**
   * 注册迁移脚本
   */
  public registerMigration(migration: Migration): void {
    // 检查版本号是否已存在
    const existing = this.migrations.find((m) => m.version === migration.version);
    if (existing) {
      throw new Error(`Migration version ${migration.version} already registered`);
    }

    this.migrations.push(migration);
    // 按版本号排序
    this.migrations.sort((a, b) => a.version.localeCompare(b.version));

    logger.debug(`Registered migration: ${migration.version} - ${migration.name}`);
  }

  /**
   * 批量注册迁移脚本
   */
  public registerMigrations(migrations: Migration[]): void {
    migrations.forEach((migration) => this.registerMigration(migration));
  }

  /**
   * 获取已应用的迁移版本列表
   */
  public getAppliedMigrations(): MigrationRecord[] {
    const stmt = this.db.prepare<[], MigrationRecord>(
      'SELECT * FROM schema_migrations ORDER BY version ASC'
    );
    return stmt.all();
  }

  /**
   * 获取待应用的迁移列表
   */
  public getPendingMigrations(): Migration[] {
    const applied = this.getAppliedMigrations();
    const appliedVersions = new Set(applied.map((m) => m.version));

    return this.migrations.filter((m) => !appliedVersions.has(m.version));
  }

  /**
   * 应用单个迁移
   */
  private applyMigration(migration: Migration): void {
    const transaction = this.db.transaction(() => {
      // 执行迁移
      migration.up(this.db);

      // 记录迁移
      const stmt = this.db.prepare(
        'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
      );
      stmt.run(migration.version, migration.name);
    });

    transaction();

    logger.info(`Applied migration: ${migration.version} - ${migration.name}`);
  }

  /**
   * 回滚单个迁移
   */
  private rollbackMigration(migration: Migration): void {
    const transaction = this.db.transaction(() => {
      // 执行回滚
      migration.down(this.db);

      // 删除迁移记录
      const stmt = this.db.prepare('DELETE FROM schema_migrations WHERE version = ?');
      stmt.run(migration.version);
    });

    transaction();

    logger.info(`Rolled back migration: ${migration.version} - ${migration.name}`);
  }

  /**
   * 应用所有待处理的迁移
   */
  public async applyMigrations(): Promise<void> {
    const pending = this.getPendingMigrations();

    if (pending.length === 0) {
      logger.info('No pending migrations to apply');
      return;
    }

    logger.info(`Found ${pending.length} pending migrations`);

    for (const migration of pending) {
      try {
        this.applyMigration(migration);
      } catch (error) {
        logger.error(`Failed to apply migration ${migration.version}:`, error);
        throw error;
      }
    }

    logger.info('All migrations applied successfully');
  }

  /**
   * 回滚到指定版本
   */
  public async rollbackTo(targetVersion: string): Promise<void> {
    const applied = this.getAppliedMigrations();
    const appliedVersions = applied.map((m) => m.version);

    // 找到需要回滚的迁移
    const toRollback: Migration[] = [];
    for (const migration of [...this.migrations].reverse()) {
      if (migration.version <= targetVersion) {
        break;
      }
      if (appliedVersions.includes(migration.version)) {
        toRollback.push(migration);
      }
    }

    if (toRollback.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    logger.info(`Rolling back ${toRollback.length} migrations to version ${targetVersion}`);

    for (const migration of toRollback) {
      try {
        this.rollbackMigration(migration);
      } catch (error) {
        logger.error(`Failed to rollback migration ${migration.version}:`, error);
        throw error;
      }
    }

    logger.info('Rollback completed successfully');
  }

  /**
   * 回滚最近一次迁移
   */
  public async rollbackLast(): Promise<void> {
    const applied = this.getAppliedMigrations();

    if (applied.length === 0) {
      logger.info('No migrations to rollback');
      return;
    }

    const lastApplied = applied[applied.length - 1];
    const migration = this.migrations.find((m) => m.version === lastApplied.version);

    if (!migration) {
      throw new Error(`Migration ${lastApplied.version} not found in registered migrations`);
    }

    try {
      this.rollbackMigration(migration);
      logger.info('Last migration rolled back successfully');
    } catch (error) {
      logger.error('Failed to rollback last migration:', error);
      throw error;
    }
  }

  /**
   * 重置数据库（回滚所有迁移并重新应用）
   */
  public async reset(): Promise<void> {
    const applied = this.getAppliedMigrations();

    if (applied.length === 0) {
      logger.info('No migrations to rollback, applying all migrations');
      await this.applyMigrations();
      return;
    }

    logger.info('Resetting database: rolling back all migrations');

    // 回滚所有迁移
    for (const migration of [...this.migrations].reverse()) {
      if (applied.some((a) => a.version === migration.version)) {
        try {
          this.rollbackMigration(migration);
        } catch (error) {
          logger.error(`Failed to rollback migration ${migration.version}:`, error);
          throw error;
        }
      }
    }

    // 重新应用所有迁移
    await this.applyMigrations();

    logger.info('Database reset completed successfully');
  }

  /**
   * 获取当前数据库版本
   */
  public getCurrentVersion(): string | null {
    const applied = this.getAppliedMigrations();
    if (applied.length === 0) {
      return null;
    }
    return applied[applied.length - 1].version;
  }

  /**
   * 检查是否有待处理的迁移
   */
  public hasPendingMigrations(): boolean {
    return this.getPendingMigrations().length > 0;
  }

  /**
   * 获取迁移统计信息
   */
  public getStats(): {
    total: number;
    applied: number;
    pending: number;
  } {
    const applied = this.getAppliedMigrations().length;
    const pending = this.getPendingMigrations().length;
    return {
      total: this.migrations.length,
      applied,
      pending,
    };
  }
}