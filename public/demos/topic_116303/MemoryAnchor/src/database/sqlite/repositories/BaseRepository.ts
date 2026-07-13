// Base Repository
// Base class for all repository implementations providing common CRUD operations

import Database from 'better-sqlite3';
import { database } from '../index';
import { logger } from '../../../main/utils/logger';
import { generateId } from '../../../shared/utils/id';

/**
 * 分页参数接口
 */
export interface PaginationParams {
  /** 页码，从 1 开始 */
  page?: number;
  /** 每页数量，默认 20 */
  limit?: number;
  /** 每页数量别名（兼容 pageSize） */
  pageSize?: number;
  /** 偏移量（可选，如果提供则忽略 page） */
  offset?: number;
}

/**
 * 分页结果接口
 */
export interface PaginatedResult<T> {
  /** 数据列表 */
  items: T[];
  /** 数据列表别名 */
  data: T[];
  /** 总记录数 */
  total: number;
  /** 当前页码 */
  page: number;
  /** 每页数量 */
  limit: number;
  /** 每页数量别名 */
  pageSize: number;
  /** 总页数 */
  totalPages: number;
  /** 是否有下一页 */
  hasNext: boolean;
  /** 是否有上一页 */
  hasPrev: boolean;
}

/**
 * 排序参数接口
 */
export interface SortParams {
  /** 排序字段 */
  field: string;
  /** 排序方向 */
  order?: 'ASC' | 'DESC';
}

/**
 * 查询条件接口
 */
export interface WhereClause {
  /** 字段名 */
  field: string;
  /** 操作符 */
  operator?: '=' | '!=' | '>' | '<' | '>=' | '<=' | 'LIKE' | 'IN' | 'IS' | 'IS NOT';
  /** 值 */
  value: unknown;
}

/**
 * 基础 Repository 类
 * 提供通用的 CRUD 操作、分页查询和事务支持
 */
export abstract class BaseRepository<T extends { id: string }> {
  private _db?: Database.Database;
  public readonly tableName: string;
  protected hasUpdatedAt: boolean;

  /** 懒加载获取数据库连接，避免模块加载时数据库未初始化 */
  protected get db(): Database.Database {
    if (!this._db) {
      this._db = database.db;
    }
    return this._db;
  }

  constructor(tableName: string, db?: Database.Database, hasUpdatedAt: boolean = true) {
    this._db = db;
    this.tableName = tableName;
    this.hasUpdatedAt = hasUpdatedAt;
  }

  /**
   * 生成 UUID
   */
  protected generateId(): string {
    return generateId();
  }

  /**
   * 创建记录
   */
  create(data: Partial<T>): T {
    const record = data as Record<string, unknown>;
    const id = (record.id as string) || this.generateId();
    const now = new Date().toISOString();

    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    // Normalize so better-sqlite3 can bind (boolean -> 0/1, undefined -> null).
    const values = fields.map(k => this.normalizeBindValue(record[k]));

    let sql: string;
    let params: unknown[];

    if (this.hasUpdatedAt) {
      sql = `
        INSERT INTO ${this.tableName} (id, ${fields.join(', ')}, created_at, updated_at)
        VALUES (?, ${fields.map(() => '?').join(', ')}, ?, ?)
      `;
      params = [id, ...values, now, now];
    } else {
      sql = `
        INSERT INTO ${this.tableName} (id, ${fields.join(', ')}, created_at)
        VALUES (?, ${fields.map(() => '?').join(', ')}, ?)
      `;
      params = [id, ...values, now];
    }

    const stmt = this.db.prepare(sql);
    stmt.run(...params);

    return this.getById(id)!;
  }

  /**
   * 根据 ID 获取记录
   */
  getById(id: string): T | null {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE id = ?`) as Database.Statement;
    const result = stmt.get(id) as T | undefined;
    return result || null;
  }

  /**
   * 获取所有记录
   */
  getAll(): T[] {
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName}`) as Database.Statement;
    return stmt.all() as T[];
  }

  /**
   * 根据条件查询记录
   */
  findWhere(conditions: WhereClause[]): T[] {
    const whereClause = this.buildWhereClause(conditions);
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${whereClause.sql}`) as Database.Statement;
    return stmt.all(...whereClause.params) as T[];
  }

  /**
   * 根据条件查询单条记录
   */
  findOneWhere(conditions: WhereClause[]): T | null {
    const whereClause = this.buildWhereClause(conditions);
    const stmt = this.db.prepare(`SELECT * FROM ${this.tableName} WHERE ${whereClause.sql} LIMIT 1`) as Database.Statement;
    const result = stmt.get(...whereClause.params) as T | undefined;
    return result || null;
  }

  /**
   * 分页查询
   */
  list(
    params: PaginationParams = {},
    conditions: WhereClause[] = [],
    sort?: SortParams
  ): PaginatedResult<T> {
    const page = params.page || 1;
    const limit = params.limit || params.pageSize || 20;
    const offset = params.offset || (page - 1) * limit;

    const whereClause = conditions.length > 0
      ? this.buildWhereClause(conditions)
      : { sql: '1=1', params: [] as unknown[] };

    const orderClause = sort
      ? `ORDER BY ${sort.field} ${sort.order || 'ASC'}`
      : '';

    const countSql = `SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause.sql}`;
    const countStmt = this.db.prepare(countSql) as Database.Statement;
    const countResult = countStmt.get(...whereClause.params) as { count: number } | undefined;
    const total = countResult?.count || 0;

    const dataSql = `
      SELECT * FROM ${this.tableName}
      WHERE ${whereClause.sql}
      ${orderClause}
      LIMIT ? OFFSET ?
    `;
    const dataStmt = this.db.prepare(dataSql) as Database.Statement;
    const data = dataStmt.all(...whereClause.params, limit, offset) as T[];

    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    return {
      items: data,
      data,
      total,
      page,
      limit,
      pageSize: limit,
      totalPages,
      hasNext,
      hasPrev,
    };
  }

  /**
   * 更新记录
   */
  update(id: string, data: Partial<T>): T | null {
    const now = new Date().toISOString();
    const record = data as Record<string, unknown>;
    const fields = Object.keys(data).filter(k => k !== 'id' && k !== 'created_at' && k !== 'updated_at');
    // Normalize so better-sqlite3 can bind (boolean -> 0/1, undefined -> null).
    const values = fields.map(k => this.normalizeBindValue(record[k]));

    if (fields.length === 0) {
      return this.getById(id);
    }

    let sql: string;
    let params: unknown[];

    if (this.hasUpdatedAt) {
      sql = `
        UPDATE ${this.tableName}
        SET ${fields.map((f) => `${f} = ?`).join(', ')}, updated_at = ?
        WHERE id = ?
      `;
      params = [...values, now, id];
    } else {
      sql = `
        UPDATE ${this.tableName}
        SET ${fields.map((f) => `${f} = ?`).join(', ')}
        WHERE id = ?
      `;
      params = [...values, id];
    }

    const stmt = this.db.prepare(sql);
    stmt.run(...params);

    return this.getById(id);
  }

  /**
   * 删除记录
   */
  delete(id: string): boolean {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  /**
   * 创建记录（不自动生成 ID 和时间戳）
   * 用于特殊场景，如导入数据
   */
  createWithId(data: T): T {
    const fields = Object.keys(data);
    const values = Object.values(data);

    const sql = `
      INSERT INTO ${this.tableName} (${fields.join(', ')})
      VALUES (${fields.map(() => '?').join(', ')})
    `;

    const stmt = this.db.prepare(sql);
    stmt.run(...values);

    return this.getById(data.id)!;
  }

  /**
   * 批量删除
   */
  deleteMany(ids: string[]): number {
    const stmt = this.db.prepare(`DELETE FROM ${this.tableName} WHERE id = ?`);
    const deleteMany = this.db.transaction((ids: string[]) => {
      let count = 0;
      for (const id of ids) {
        const result = stmt.run(id);
        count += result.changes;
      }
      return count;
    });

    return deleteMany(ids);
  }

  /**
   * 记录是否存在
   */
  exists(id: string): boolean {
    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE id = ?`) as Database.Statement;
    const result = stmt.get(id) as { count: number } | undefined;
    return (result?.count || 0) > 0;
  }

  /**
   * 统计记录数
   */
  count(conditions: WhereClause[] = []): number {
    const whereClause = conditions.length > 0
      ? this.buildWhereClause(conditions)
      : { sql: '1=1', params: [] as unknown[] };

    const stmt = this.db.prepare(`SELECT COUNT(*) as count FROM ${this.tableName} WHERE ${whereClause.sql}`) as Database.Statement;
    const result = stmt.get(...whereClause.params) as { count: number } | undefined;
    return result?.count || 0;
  }

  /**
   * 执行事务
   */
  transaction<R>(fn: () => R): R {
    return database.transaction(fn);
  }

  /**
   * 构建 WHERE 子句
   */
  protected buildWhereClause(conditions: WhereClause[]): { sql: string; params: unknown[] } {
    const parts: string[] = [];
    const params: unknown[] = [];

    for (const condition of conditions) {
      const operator = condition.operator || '=';

      if (operator === 'IN') {
        const values = Array.isArray(condition.value) ? condition.value : [condition.value];
        parts.push(`${condition.field} IN (${values.map(() => '?').join(', ')})`);
        params.push(...values.map((v) => this.normalizeBindValue(v)));
      } else if (operator === 'IS' || operator === 'IS NOT') {
        parts.push(`${condition.field} ${operator} ${String(condition.value)}`);
      } else {
        parts.push(`${condition.field} ${operator} ?`);
        params.push(this.normalizeBindValue(condition.value));
      }
    }

    return {
      sql: parts.join(' AND '),
      params,
    };
  }

  /**
   * 将 JS 值转换为 SQLite 支持的绑定类型
   * better-sqlite3 只接受: number, string, bigint, buffer, null
   */
  private normalizeBindValue(value: unknown): unknown {
    if (value === undefined || value === null) {
      return null;
    }
    if (typeof value === 'boolean') {
      return Number(value); // true → 1, false → 0
    }
    return value;
  }

  /**
   * 执行原生 SQL 查询
   */
  protected query<P, R>(sql: string, params: P[] = []): R[] {
    const stmt = this.db.prepare(sql) as Database.Statement;
    return stmt.all(...params) as R[];
  }

  /**
   * 执行原生 SQL 并返回单条记录
   */
  protected queryOne<P, R>(sql: string, params: P[] = []): R | null {
    const stmt = this.db.prepare(sql) as Database.Statement;
    const result = stmt.get(...params) as R | undefined;
    return result || null;
  }

  /**
   * 执行原生 SQL 命令
   */
  protected execute<P>(sql: string, params: P[] = []): Database.RunResult {
    const stmt = this.db.prepare(sql) as Database.Statement;
    return stmt.run(...params);
  }

  /**
   * 记录日志
   */
  protected log(message: string, ...args: unknown[]): void {
    logger.debug(`[${this.tableName}Repository] ${message}`, ...args);
  }
}
