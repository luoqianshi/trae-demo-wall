// Scrape Task Repository
// Repository for scrape task data operations

import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

/**
 * ScrapeTask 数据模型
 */
export interface ScrapeTask {
  id: string;
  url: string;
  source_type: string;
  status: string;
  priority: number;
  engine?: string;
  retry_count: number;
  max_retries: number;
  error_message?: string | null;
  collection_id?: string;
  started_at?: string | null;
  completed_at?: string | null;
  created_at: string;
}

/**
 * ScrapeTask Repository 类
 */
export class ScrapeTaskRepository extends BaseRepository<ScrapeTask> {
  constructor() {
    super('scrape_tasks', undefined, false);
  }

  /**
   * 获取待处理的任务列表
   */
  listPending(params: PaginationParams = {}): PaginatedResult<ScrapeTask> {
    return this.list(
      params,
      [{ field: 'status', value: 'pending' }],
      { field: 'priority', order: 'DESC' }
    );
  }

  /**
   * 获取正在进行的任务列表
   */
  listInProgress(params: PaginationParams = {}): PaginatedResult<ScrapeTask> {
    return this.list(params, [{ field: 'status', value: 'in_progress' }]);
  }

  /**
   * 获取已完成的任务列表
   */
  listCompleted(params: PaginationParams = {}): PaginatedResult<ScrapeTask> {
    return this.list(params, [{ field: 'status', value: 'completed' }]);
  }

  /**
   * 获取失败的任务列表
   */
  listFailed(params: PaginationParams = {}): PaginatedResult<ScrapeTask> {
    return this.list(params, [{ field: 'status', value: 'failed' }]);
  }

  /**
   * 根据 URL 获取任务
   */
  getByUrl(url: string): ScrapeTask | null {
    return this.findOneWhere([{ field: 'url', value: url }]);
  }

  /**
   * 根据收藏 ID 获取任务
   */
  getByCollectionId(collectionId: string): ScrapeTask | null {
    return this.findOneWhere([{ field: 'collection_id', value: collectionId }]);
  }

  /**
   * 创建抓取任务
   */
  createTask(
    url: string,
    sourceType: string = 'web',
    priority: number = 0,
    maxRetries: number = 3
  ): ScrapeTask {
    return this.create({
      url,
      source_type: sourceType,
      status: 'pending',
      priority,
      retry_count: 0,
      max_retries: maxRetries,
    });
  }

  /**
   * 更新任务状态
   */
  updateStatus(id: string, status: string): ScrapeTask | null {
    const now = new Date().toISOString();
    const updateData: Partial<ScrapeTask> = { status };

    if (status === 'in_progress') {
      updateData.started_at = now;
    } else if (status === 'completed' || status === 'failed') {
      updateData.completed_at = now;
    }

    return this.update(id, updateData);
  }

  /**
   * 设置关联的收藏 ID
   */
  setCollectionId(id: string, collectionId: string): ScrapeTask | null {
    return this.update(id, { collection_id: collectionId });
  }

  /**
   * 增加重试计数
   */
  incrementRetryCount(id: string): ScrapeTask | null {
    const task = this.getById(id);
    if (!task) return null;

    return this.update(id, {
      retry_count: task.retry_count + 1,
    });
  }

  /**
   * 设置错误信息
   */
  setError(id: string, errorMessage: string): ScrapeTask | null {
    return this.update(id, {
      error_message: errorMessage,
      status: 'failed',
    });
  }

  /**
   * 设置抓取引擎
   */
  setEngine(id: string, engine: string): ScrapeTask | null {
    return this.update(id, { engine });
  }

  /**
   * 重置任务（重新尝试）
   */
  resetTask(id: string): ScrapeTask | null {
    return this.update(id, {
      status: 'pending',
      retry_count: 0,
      error_message: null,
      started_at: null,
      completed_at: null,
    });
  }

  /**
   * 统计各状态的任务数量
   */
  countByStatus(): Record<string, number> {
    const sql = `
      SELECT status, COUNT(*) as count
      FROM scrape_tasks
      GROUP BY status
    `;
    const stmt = this.db.prepare<[], { status: string; count: number }>(sql);
    const results = stmt.all();

    const counts: Record<string, number> = {
      pending: 0,
      in_progress: 0,
      completed: 0,
      failed: 0,
    };

    for (const result of results) {
      counts[result.status] = result.count;
    }

    return counts;
  }

  /**
   * 批量创建任务
   */
  createTasks(urls: string[], sourceType: string = 'web', priority: number = 0): ScrapeTask[] {
    return this.transaction(() => {
      const tasks: ScrapeTask[] = [];
      for (const url of urls) {
        const existing = this.getByUrl(url);
        if (!existing) {
          tasks.push(this.createTask(url, sourceType, priority));
        } else if (existing.status === 'failed' && existing.retry_count < existing.max_retries) {
          // 重置失败但可重试的任务
          this.resetTask(existing.id);
          tasks.push(this.getById(existing.id)!);
        }
      }
      return tasks;
    });
  }

  /**
   * 清理已完成的旧任务
   */
  cleanOldTasks(daysOld: number = 30): number {
    const sql = `
      DELETE FROM scrape_tasks
      WHERE status = 'completed'
      AND completed_at < datetime('now', '-' || ? || ' days')
    `;
    const stmt = this.db.prepare<[number], void>(sql);
    stmt.run(daysOld);
    return stmt.run(daysOld).changes;
  }
}

// 导出单例实例
export const scrapeTaskRepository = new ScrapeTaskRepository();