// Collection Repository
// Repository for collection data operations

import { BaseRepository, PaginatedResult, PaginationParams, SortParams } from './BaseRepository';

/**
 * Collection 数据模型
 */
export interface Collection {
  id: string;
  url: string;
  title: string;
  content?: string;
  content_text?: string;
  html_content?: string;
  summary?: string;
  key_points?: string;
  keywords?: string;
  tags?: string;
  description?: string;
  notes?: string;
  source_type: string;
  language?: string;
  author?: string;
  published_at?: string;
  word_count?: number;
  reading_time?: number;
  favicon?: string;
  thumbnail?: string;
  status: string;
  error_message?: string;
  scraper_engine?: string;
  version_count: number;
  view_count?: number;
  is_read: boolean;
  is_favorite: boolean;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
}

/**
 * Collection Repository 类
 */
export class CollectionRepository extends BaseRepository<Collection> {
  constructor() {
    super('collections');
  }

  /**
   * 根据 URL 获取收藏
   */
  getByUrl(url: string): Collection | null {
    return this.findOneWhere([{ field: 'url', value: url }]);
  }

  /**
   * 获取未删除的收藏列表
   */
  listActive(params: PaginationParams = {}, sort?: SortParams): PaginatedResult<Collection> {
    return this.list(params, [{ field: 'is_deleted', value: false }], sort);
  }

  /**
   * 获取已删除的收藏列表（回收站）
   */
  listDeleted(params: PaginationParams = {}): PaginatedResult<Collection> {
    return this.list(params, [{ field: 'is_deleted', value: true }]);
  }

  /**
   * 获取收藏夹中的收藏列表
   */
  listFavorites(params: PaginationParams = {}): PaginatedResult<Collection> {
    return this.list(
      params,
      [
        { field: 'is_deleted', value: false },
        { field: 'is_favorite', value: true },
      ]
    );
  }

  /**
   * 获取未读的收藏列表
   */
  listUnread(params: PaginationParams = {}): PaginatedResult<Collection> {
    return this.list(
      params,
      [
        { field: 'is_deleted', value: false },
        { field: 'is_read', value: false },
      ]
    );
  }

  /**
   * 根据来源类型获取收藏列表
   */
  listBySourceType(sourceType: string, params: PaginationParams = {}): PaginatedResult<Collection> {
    return this.list(
      params,
      [
        { field: 'is_deleted', value: false },
        { field: 'source_type', value: sourceType },
      ]
    );
  }

  /**
   * 根据状态获取收藏列表
   */
  listByStatus(status: string, params: PaginationParams = {}): PaginatedResult<Collection> {
    return this.list(
      params,
      [
        { field: 'is_deleted', value: false },
        { field: 'status', value: status },
      ]
    );
  }

  /**
   * 软删除收藏
   */
  softDelete(id: string): Collection | null {
    const now = new Date().toISOString();
    return this.update(id, {
      is_deleted: true,
      deleted_at: now,
    });
  }

  /**
   * 恢复已删除的收藏
   */
  restore(id: string): Collection | null {
    return this.update(id, {
      is_deleted: false,
      deleted_at: null,
    });
  }

  /**
   * 切换收藏状态
   */
  toggleFavorite(id: string): Collection | null {
    const collection = this.getById(id);
    if (!collection) return null;

    return this.update(id, {
      is_favorite: !collection.is_favorite,
    });
  }

  /**
   * 标记为已读
   */
  markAsRead(id: string): Collection | null {
    const collection = this.getById(id);
    if (!collection) return null;

    return this.update(id, {
      is_read: true,
      view_count: (collection.view_count || 0) + 1,
    });
  }

  /**
   * 增加浏览次数
   */
  incrementViewCount(id: string): Collection | null {
    const collection = this.getById(id);
    if (!collection) return null;

    return this.update(id, {
      view_count: (collection.view_count || 0) + 1,
    });
  }

  /**
   * 增加版本计数
   */
  incrementVersionCount(id: string): Collection | null {
    const collection = this.getById(id);
    if (!collection) return null;

    return this.update(id, {
      version_count: collection.version_count + 1,
    });
  }

  /**
   * 全文搜索（使用 FTS5）
   */
  search(query: string, params: PaginationParams = {}): PaginatedResult<Collection> {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const offset = params.offset || (page - 1) * limit;

    // 查询总数
    const countSql = `
      SELECT COUNT(*) as count
      FROM collections c
      JOIN collections_fts fts ON c.rowid = fts.rowid
      WHERE c.is_deleted = 0
      AND collections_fts MATCH ?
    `;
    const countStmt = this.db.prepare<[string], { count: number }>(countSql);
    const countResult = countStmt.get(query);
    const total = countResult?.count || 0;

    // 查询数据
    const dataSql = `
      SELECT c.*
      FROM collections c
      JOIN collections_fts fts ON c.rowid = fts.rowid
      WHERE c.is_deleted = 0
      AND collections_fts MATCH ?
      ORDER BY rank
      LIMIT ? OFFSET ?
    `;
    const dataStmt = this.db.prepare<[string, number, number], Collection>(dataSql);
    const data = dataStmt.all(query, limit, offset);

    // 计算分页信息
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
   * 更新收藏内容
   */
  updateContent(
    id: string,
    data: {
      content?: string;
      content_text?: string;
      summary?: string;
      key_points?: string;
      keywords?: string;
      word_count?: number;
      reading_time?: number;
    }
  ): Collection | null {
    return this.update(id, data);
  }

  /**
   * 统计信息：总收藏数、今日新增数、已 AI 处理数（均排除回收站）。
   */
  getStats(): { total: number; todayCount: number; aiProcessedCount: number } {
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const total = (this.db.prepare('SELECT COUNT(*) AS c FROM collections WHERE is_deleted = 0').get() as { c: number }).c;
    const todayCount = (
      this.db
        .prepare('SELECT COUNT(*) AS c FROM collections WHERE is_deleted = 0 AND created_at >= ?')
        .get(startOfToday.toISOString()) as { c: number }
    ).c;
    const aiProcessedCount = (
      this.db.prepare("SELECT COUNT(*) AS c FROM collections WHERE is_deleted = 0 AND summary IS NOT NULL AND summary != ''").get() as { c: number }
    ).c;

    return { total, todayCount, aiProcessedCount };
  }
}

// 导出单例实例
export const collectionRepository = new CollectionRepository();