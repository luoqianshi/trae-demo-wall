import {
  CollectionRepository,
  Collection,
} from '../database/sqlite/repositories/CollectionRepository';
import {
  ScrapeTaskRepository,
} from '../database/sqlite/repositories/ScrapeTaskRepository';
import { WhereClause } from '../database/sqlite/repositories/BaseRepository';
import { VersionRepository } from '../database/sqlite/repositories/VersionRepository';
import { TagRepository } from '../database/sqlite/repositories/TagRepository';
import {
  CreateCollectionRequest,
  UpdateCollectionRequest,
  ListCollectionsRequest,
  CollectionData,
  CollectionListData,
} from '../shared/types/ipc';
import { generateId } from '../shared/utils/id';
import { createHash } from 'crypto';

export class CollectionService {
  private collectionRepository: CollectionRepository;
  private scrapeTaskRepository: ScrapeTaskRepository;
  private versionRepository: VersionRepository;
  private tagRepository: TagRepository;

  constructor() {
    this.collectionRepository = new CollectionRepository();
    this.scrapeTaskRepository = new ScrapeTaskRepository();
    this.versionRepository = new VersionRepository();
    this.tagRepository = new TagRepository();
  }

  async createCollection(request: CreateCollectionRequest): Promise<CollectionData> {
    const { url, title, description, tags, notes, autoScrape } = request;

    const existing = this.collectionRepository.getByUrl(url);
    if (existing && !existing.is_deleted) {
      return this.toCollectionData(existing);
    }

    const now = new Date().toISOString();
    const id = generateId();

    const collectionData: Partial<Collection> = {
      id,
      url,
      title: title || url,
      content: description || '',
      content_text: description || '',
      description,
      tags: tags ? tags.join(',') : '',
      notes,
      source_type: 'web',
      status: autoScrape ? 'pending' : 'draft',
      version_count: 0,
      is_read: false,
      is_favorite: false,
      is_deleted: false,
      created_at: now,
      updated_at: now,
    };

    const collection = this.collectionRepository.create(collectionData);

    this.versionRepository.createInitialVersion(id, {
      title: collectionData.title,
      content: collectionData.content,
      content_text: collectionData.content_text,
      word_count: collectionData.word_count,
    });

    if (autoScrape) {
      this.scrapeTaskRepository.createTask(url, 'web', 1, 3);
    }

    if (tags && tags.length > 0) {
      this.tagRepository.addTagsToCollection(id, tags);
    }

    return this.toCollectionData(collection);
  }

  getCollection(id: string): CollectionData | null {
    const collection = this.collectionRepository.getById(id);
    if (!collection || collection.is_deleted) return null;
    return this.toCollectionData(collection);
  }

  getCollectionByUrl(url: string): CollectionData | null {
    const collection = this.collectionRepository.getByUrl(url);
    if (!collection || collection.is_deleted) return null;
    return this.toCollectionData(collection);
  }

  listCollections(params: ListCollectionsRequest): CollectionListData {
    const {
      page = 1,
      pageSize = 20,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      isDeleted,
      isFavorite,
      isRead,
      sourceType,
      dateRange,
      tags,
    } = params;

    const where: WhereClause[] = [];

    if (isDeleted !== undefined) {
      where.push({ field: 'is_deleted', value: isDeleted });
    } else {
      where.push({ field: 'is_deleted', value: false });
    }

    if (isFavorite !== undefined) {
      where.push({ field: 'is_favorite', value: isFavorite });
    }

    if (isRead !== undefined) {
      where.push({ field: 'is_read', value: isRead });
    }

    if (sourceType !== undefined) {
      where.push({ field: 'source_type', value: sourceType });
    }

    if (dateRange) {
      where.push({ field: 'created_at', operator: '>=', value: dateRange.start });
      where.push({ field: 'created_at', operator: '<=', value: dateRange.end });
    }

    // tags is stored as a comma-separated string (e.g. "React,Vue"). Wrap the
    // column in commas and match ",tag," so we get exact tag-boundary matches
    // without false-matching substrings (React vs ReactNative). The field is a
    // constant SQL expression; the tag value stays parameterized.
    if (tags && tags.length > 0) {
      for (const tag of tags) {
        where.push({ field: "(',' || tags || ',')", operator: 'LIKE', value: `%,${tag},%` });
      }
    }

    const sortFieldMap: Record<string, string> = {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
      title: 'title',
      viewCount: 'view_count',
    };

    const result = this.collectionRepository.list(
      { page, pageSize },
      where,
      { field: sortFieldMap[sortBy] || 'created_at', order: sortOrder === 'asc' ? 'ASC' : 'DESC' }
    );

    return {
      items: result.items.map((item) => this.toCollectionData(item)),
      total: result.total,
      page: result.page,
      pageSize: result.pageSize,
    };
  }

  /** Aggregate stats for the dashboard (excludes the recycle bin). */
  getStats(): { total: number; todayCount: number; aiProcessedCount: number } {
    return this.collectionRepository.getStats();
  }

  updateCollection(
    id: string,
    data: UpdateCollectionRequest['data']
  ): CollectionData | null {
    const existing = this.collectionRepository.getById(id);
    if (!existing || existing.is_deleted) return null;

    const updateData: Partial<Collection> = {
      updated_at: new Date().toISOString(),
    };

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) {
      updateData.description = data.description;
    }
    if (data.notes !== undefined) updateData.notes = data.notes;
    if (data.summary !== undefined) updateData.summary = data.summary;
    if (data.keyPoints !== undefined) {
      updateData.key_points = JSON.stringify(data.keyPoints);
    }

    if (data.tags !== undefined) {
      updateData.tags = data.tags.join(',');
      this.tagRepository.setCollectionTags(id, data.tags);
    }

    const updated = this.collectionRepository.update(id, updateData);
    return updated ? this.toCollectionData(updated) : null;
  }

  deleteCollection(id: string): boolean {
    const result = this.collectionRepository.update(id, {
      is_deleted: true,
      deleted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });
    return !!result;
  }

  restoreCollection(id: string): CollectionData | null {
    const result = this.collectionRepository.update(id, {
      is_deleted: false,
      deleted_at: null,
    });
    return result ? this.toCollectionData(result) : null;
  }

  permanentlyDeleteCollection(id: string): boolean {
    return this.collectionRepository.delete(id);
  }

  toggleFavorite(id: string): CollectionData | null {
    const collection = this.collectionRepository.getById(id);
    if (!collection || collection.is_deleted) return null;

    const result = this.collectionRepository.update(id, {
      is_favorite: !collection.is_favorite,
      updated_at: new Date().toISOString(),
    });
    return result ? this.toCollectionData(result) : null;
  }

  markAsRead(id: string): CollectionData | null {
    const collection = this.collectionRepository.getById(id);
    if (!collection || collection.is_deleted) return null;

    const result = this.collectionRepository.update(id, {
      is_read: true,
      view_count: (collection.view_count || 0) + 1,
      updated_at: new Date().toISOString(),
    });
    return result ? this.toCollectionData(result) : null;
  }

  updateCollectionWithScrapeResult(
    collectionId: string,
    scrapeResult: {
      title?: string;
      description?: string;
      content?: string;
      htmlContent?: string;
      textContent?: string;
      markdown?: string;
      metadata?: {
        author?: string;
        publishedAt?: string;
        language?: string;
        wordCount?: number;
        readingTime?: number;
        favicon?: string;
        thumbnail?: string;
        tags?: string[];
      };
      engine?: string;
    }
  ): CollectionData | null {
    const collection = this.collectionRepository.getById(collectionId);
    if (!collection) return null;

    const now = new Date().toISOString();
    const contentChecksum = this.calculateChecksum(
      scrapeResult.textContent || scrapeResult.content || ''
    );

    const updateData: Partial<Collection> = {
      title: scrapeResult.title || collection.title,
      description: scrapeResult.description || collection.description,
      content: scrapeResult.markdown || scrapeResult.content || collection.content,
      content_text: scrapeResult.textContent || collection.content_text,
      author: scrapeResult.metadata?.author,
      published_at: scrapeResult.metadata?.publishedAt,
      language: scrapeResult.metadata?.language,
      word_count: scrapeResult.metadata?.wordCount,
      reading_time: scrapeResult.metadata?.readingTime,
      favicon: scrapeResult.metadata?.favicon,
      thumbnail: scrapeResult.metadata?.thumbnail,
      scraper_engine: scrapeResult.engine,
      status: 'active',
      updated_at: now,
    };

    const shouldCreateVersion =
      collection.content && contentChecksum !== this.calculateChecksum(collection.content_text || '');

    const updated = this.collectionRepository.update(collectionId, updateData);

    if (updated && shouldCreateVersion) {
      this.versionRepository.createVersion(
        collectionId,
        {
          title: collection.title,
          content: collection.content,
          content_text: collection.content_text,
          html_content: collection.html_content,
          word_count: collection.word_count,
          change_summary: 'Content updated by re-scrape',
        }
      );

      this.collectionRepository.incrementVersionCount(collectionId);
    }

    if (scrapeResult.metadata?.tags && scrapeResult.metadata.tags.length > 0) {
      const existingTags = collection.tags ? collection.tags.split(',').filter(Boolean) : [];
      const newTags = [...new Set([...existingTags, ...scrapeResult.metadata.tags])];
      this.tagRepository.setCollectionTags(collectionId, newTags);
      if (updated) {
        updated.tags = newTags.join(',');
      }
    }

    return updated ? this.toCollectionData(updated) : null;
  }

  private calculateChecksum(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }

  private toCollectionData(collection: Collection): CollectionData {
    const tags = collection.tags
      ? collection.tags.split(',').filter(Boolean)
      : [];

    let keyPoints: string[] = [];
    if (collection.key_points) {
      try {
        const parsed = JSON.parse(collection.key_points) as unknown;
        if (Array.isArray(parsed)) keyPoints = parsed.filter((p): p is string => typeof p === 'string');
      } catch {
        keyPoints = [];
      }
    }

    return {
      id: collection.id,
      url: collection.url,
      title: collection.title,
      description: collection.description,
      content: collection.content,
      htmlContent: collection.html_content,
      summary: collection.summary,
      keyPoints,
      tags,
      notes: collection.notes,
      isFavorite: collection.is_favorite,
      isRead: collection.is_read,
      viewCount: collection.view_count || 0,
      createdAt: collection.created_at,
      updatedAt: collection.updated_at,
      deletedAt: collection.deleted_at ?? undefined,
    };
  }

  getCollectionsNeedingUpdateCheck(daysSinceLastCheck: number = 7): CollectionData[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysSinceLastCheck);
    const cutoffStr = cutoffDate.toISOString();

    const collections = this.collectionRepository.findWhere([
      { field: 'is_deleted', value: false },
      { field: 'status', value: 'active' },
    ]);

    return collections
      .filter(c => !c.updated_at || c.updated_at < cutoffStr)
      .map(c => this.toCollectionData(c));
  }
}

export const collectionService = new CollectionService();
