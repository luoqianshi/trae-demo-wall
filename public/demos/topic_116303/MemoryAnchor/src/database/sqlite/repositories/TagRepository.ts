// Tag Repository
// Repository for tag data operations

import Database from 'better-sqlite3';
import { BaseRepository, PaginatedResult, PaginationParams } from './BaseRepository';

/**
 * Tag 数据模型
 */
export interface Tag {
  id: string;
  name: string;
  color?: string;
  collection_count: number;
  created_at: string;
  updated_at: string;
}

/**
 * Tag Repository 类
 */
export class TagRepository extends BaseRepository<Tag> {
  constructor() {
    super('tags');
  }

  /**
   * 根据名称获取标签
   */
  getByName(name: string): Tag | null {
    return this.findOneWhere([{ field: 'name', value: name }]);
  }

  /**
   * 创建标签
   */
  createTag(name: string, color?: string): Tag {
    const existing = this.getByName(name);
    if (existing) return existing;
    return this.create({
      name,
      color,
      collection_count: 0,
    });
  }

  /**
   * 更新标签颜色
   */
  updateColor(id: string, color: string): Tag | null {
    return this.update(id, { color });
  }

  /**
   * 增加标签的收藏计数
   */
  incrementCount(id: string): Tag | null {
    const tag = this.getById(id);
    if (!tag) return null;

    return this.update(id, {
      collection_count: tag.collection_count + 1,
    });
  }

  /**
   * 减少标签的收藏计数
   */
  decrementCount(id: string): Tag | null {
    const tag = this.getById(id);
    if (!tag) return null;

    const newCount = Math.max(0, tag.collection_count - 1);
    return this.update(id, {
      collection_count: newCount,
    });
  }

  /**
   * 获取热门标签（按收藏数排序）
   */
  listPopular(params: PaginationParams = {}): PaginatedResult<Tag> {
    return this.list(params, [], {
      field: 'collection_count',
      order: 'DESC',
    });
  }

  /**
   * 批量创建标签
   */
  createTags(names: string[], color?: string): Tag[] {
    return this.transaction(() => {
      const tags: Tag[] = [];
      for (const name of names) {
        const existing = this.getByName(name);
        if (!existing) {
          tags.push(this.createTag(name, color));
        } else {
          tags.push(existing);
        }
      }
      return tags;
    });
  }

  /**
   * 添加标签到收藏（简化实现：使用 JSON 存储，暂不使用 junction table）
   */
  addTagsToCollection(collectionId: string, tagNames: string[]): void {
    this.createTags(tagNames);
  }

  /**
   * 设置收藏的标签（简化实现：使用 JSON 存储，暂不使用 junction table）
   */
  setCollectionTags(collectionId: string, tagNames: string[]): void {
    this.createTags(tagNames);
  }

  /**
   * 搜索标签（模糊匹配）
   */
  search(query: string, limit?: number): Tag[] {
    const sql = `
      SELECT * FROM tags
      WHERE name LIKE ?
      ORDER BY collection_count DESC
      ${limit ? 'LIMIT ?' : ''}
    `;
    const stmt = this.db.prepare(sql) as Database.Statement;
    return stmt.all(`${query}%`, ...(limit ? [limit] : [])) as Tag[];
  }
}

// 导出单例实例
export const tagRepository = new TagRepository();
