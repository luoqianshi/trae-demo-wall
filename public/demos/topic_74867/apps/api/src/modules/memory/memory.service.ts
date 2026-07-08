import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { CreateMemoryDto } from './dto/create-memory.dto';
import { UpdateMemoryDto } from './dto/update-memory.dto';
import { QueryMemoryDto } from './dto/query-memory.dto';
import { ERROR_CODES, REDIS_TTL, REDIS_KEYS } from '@echolife/shared';
import type { PaginatedResponse } from '@echolife/shared';

/** Allowed sortable fields for memory queries */
const ALLOWED_SORT_FIELDS = new Set([
  'createdAt',
  'updatedAt',
  'occurredAt',
  'importance',
  'emotionScore',
  'title',
]);

/** Shape of memory statistics */
export interface MemoryStats {
  total: number;
  byType: Record<string, number>;
  byEmotion: Record<string, number>;
  byVisibility: Record<string, number>;
  averageImportance: number;
  dateRange: {
    earliest: string | null;
    latest: string | null;
  };
}

@Injectable()
export class MemoryService {
  private readonly logger = new Logger(MemoryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
  ) {}

  // ============================================================
  // CRUD Operations
  // ============================================================

  /**
   * Create a new memory record for the given user.
   */
  async create(userId: string, dto: CreateMemoryDto) {
    const memory = await this.prisma.memory.create({
      data: {
        userId,
        title: dto.title,
        content: dto.content,
        type: dto.type ?? 'story',
        visibility: dto.visibility ?? 'private',
        emotion: dto.emotion ?? null,
        emotionScore: dto.emotionScore ?? null,
        importance: dto.importance ?? 0.5,
        occurredAt: dto.occurredAt ?? null,
        metadata: (dto.metadata ?? undefined) as Prisma.InputJsonValue,
      },
      include: {
        entities: { include: { entity: true } },
      },
    });

    this.logger.log(`Memory created: ${memory.id} for user: ${userId}`);

    // Invalidate list cache
    await this.invalidateListCache(userId);

    return memory;
  }

  /**
   * Find a single memory by ID. Ensures the memory belongs to the user
   * and has not been soft-deleted.
   */
  async findById(userId: string, id: string) {
    const memory = await this.prisma.memory.findFirst({
      where: { id, userId, isDeleted: false },
      include: {
        entities: { include: { entity: true } },
        lifeTreeNode: { select: { id: true, title: true } },
      },
    });

    if (!memory) {
      throw new NotFoundException({
        code: ERROR_CODES.MEMORY_NOT_FOUND,
        message: '记忆不存在或已被删除',
      });
    }

    return memory;
  }

  /**
   * List memories with pagination, filtering by type/emotion/visibility,
   * date range, sorting, and optional full-text search.
   */
  async list(userId: string, query: QueryMemoryDto): Promise<PaginatedResponse<unknown>> {
    const { skip, take } = query;
    const where = this.buildWhereClause(userId, query);
    const orderBy = this.buildOrderBy(query);

    const [items, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
        orderBy,
        skip,
        take,
        include: {
          entities: { include: { entity: { select: { id: true, name: true, type: true } } } },
        },
      }),
      this.prisma.memory.count({ where }),
    ]);

    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Update a memory by ID.
   */
  async update(userId: string, id: string, dto: UpdateMemoryDto) {
    const existing = await this.prisma.memory.findFirst({
      where: { id, userId, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.MEMORY_NOT_FOUND,
        message: '记忆不存在或已被删除',
      });
    }

    const data: Prisma.MemoryUpdateInput = {};
    if (dto.title !== undefined) data.title = dto.title;
    if (dto.content !== undefined) data.content = dto.content;
    if (dto.type !== undefined) data.type = dto.type;
    if (dto.visibility !== undefined) data.visibility = dto.visibility;
    if (dto.emotion !== undefined) data.emotion = dto.emotion;
    if (dto.emotionScore !== undefined) data.emotionScore = dto.emotionScore;
    if (dto.importance !== undefined) data.importance = dto.importance;
    if (dto.occurredAt !== undefined) data.occurredAt = dto.occurredAt;
    if (dto.metadata !== undefined) {
      data.metadata = dto.metadata as Prisma.InputJsonValue;
    }

    const updated = await this.prisma.memory.update({
      where: { id },
      data,
      include: {
        entities: { include: { entity: true } },
      },
    });

    this.logger.log(`Memory updated: ${id}`);

    await this.invalidateListCache(userId);

    return updated;
  }

  /**
   * Soft-delete a memory by setting isDeleted=true and deletedAt=now.
   */
  async softDelete(userId: string, id: string): Promise<void> {
    const existing = await this.prisma.memory.findFirst({
      where: { id, userId, isDeleted: false },
      select: { id: true },
    });

    if (!existing) {
      throw new NotFoundException({
        code: ERROR_CODES.MEMORY_NOT_FOUND,
        message: '记忆不存在或已被删除',
      });
    }

    await this.prisma.memory.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    this.logger.log(`Memory soft-deleted: ${id}`);

    await this.invalidateListCache(userId);
  }

  // ============================================================
  // Search & Aggregation
  // ============================================================

  /**
   * Full-text search across memory title and content.
   */
  async searchMemories(
    userId: string,
    searchTerm: string,
    page: number = 1,
    pageSize: number = 20,
  ): Promise<PaginatedResponse<unknown>> {
    if (!searchTerm || searchTerm.trim().length === 0) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PARAMS,
        message: '搜索关键词不能为空',
      });
    }

    const trimmed = searchTerm.trim();
    const where: Prisma.MemoryWhereInput = {
      userId,
      isDeleted: false,
      OR: [
        { title: { contains: trimmed, mode: 'insensitive' } },
        { content: { contains: trimmed, mode: 'insensitive' } },
      ],
    };

    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const [items, total] = await Promise.all([
      this.prisma.memory.findMany({
        where,
        orderBy: { occurredAt: 'desc' },
        skip,
        take,
      }),
      this.prisma.memory.count({ where }),
    ]);

    return {
      items,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  /**
   * Retrieve memories that occurred within the given date range.
   */
  async getMemoriesByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date,
  ) {
    if (startDate > endDate) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PARAMS,
        message: '开始日期不能晚于结束日期',
      });
    }

    return this.prisma.memory.findMany({
      where: {
        userId,
        isDeleted: false,
        occurredAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { occurredAt: 'asc' },
      select: {
        id: true,
        title: true,
        content: true,
        type: true,
        emotion: true,
        emotionScore: true,
        importance: true,
        occurredAt: true,
        createdAt: true,
      },
    });
  }

  /**
   * Compute aggregate statistics for the user's memories.
   */
  async getMemoryStats(userId: string): Promise<MemoryStats> {
    const cacheKey = `${REDIS_KEYS.AGENT_CACHE}memory_stats:${userId}`;
    const cached = await this.redis.getJSON<MemoryStats>(cacheKey);
    if (cached) {
      return cached;
    }

    const where = { userId, isDeleted: false };

    const [total, typeGroups, emotionGroups, visibilityGroups, avgResult, dateRange] =
      await Promise.all([
        this.prisma.memory.count({ where }),
        this.prisma.memory.groupBy({
          by: ['type'],
          where,
          _count: { type: true },
        }),
        this.prisma.memory.groupBy({
          by: ['emotion'],
          where,
          _count: { emotion: true },
        }),
        this.prisma.memory.groupBy({
          by: ['visibility'],
          where,
          _count: { visibility: true },
        }),
        this.prisma.memory.aggregate({
          where,
          _avg: { importance: true },
        }),
        this.prisma.memory.aggregate({
          where,
          _min: { occurredAt: true },
          _max: { occurredAt: true },
        }),
      ]);

    const byType: Record<string, number> = {};
    for (const g of typeGroups) {
      byType[g.type] = g._count.type;
    }

    const byEmotion: Record<string, number> = {};
    for (const g of emotionGroups) {
      if (g.emotion) {
        byEmotion[g.emotion] = g._count.emotion;
      }
    }

    const byVisibility: Record<string, number> = {};
    for (const g of visibilityGroups) {
      byVisibility[g.visibility] = g._count.visibility;
    }

    const stats: MemoryStats = {
      total,
      byType,
      byEmotion,
      byVisibility,
      averageImportance: avgResult._avg.importance ?? 0,
      dateRange: {
        earliest: dateRange._min.occurredAt
          ? dateRange._min.occurredAt.toISOString()
          : null,
        latest: dateRange._max.occurredAt
          ? dateRange._max.occurredAt.toISOString()
          : null,
      },
    };

    await this.redis.setJSON(cacheKey, stats, REDIS_TTL.SHORT_CACHE);

    return stats;
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Builds the Prisma where clause from query filters.
   */
  private buildWhereClause(userId: string, query: QueryMemoryDto): Prisma.MemoryWhereInput {
    const where: Prisma.MemoryWhereInput = {
      userId,
      isDeleted: false,
    };

    if (query.type) {
      where.type = query.type;
    }

    if (query.emotion) {
      where.emotion = query.emotion;
    }

    if (query.visibility) {
      where.visibility = query.visibility;
    }

    // Date range filtering on occurredAt
    if (query.startDate || query.endDate) {
      where.occurredAt = {};
      if (query.startDate) {
        where.occurredAt.gte = query.startDate;
      }
      if (query.endDate) {
        where.occurredAt.lte = query.endDate;
      }
    }

    // Full-text search across title and content
    if (query.search) {
      const trimmed = query.search.trim();
      where.OR = [
        { title: { contains: trimmed, mode: 'insensitive' } },
        { content: { contains: trimmed, mode: 'insensitive' } },
      ];
    }

    return where;
  }

  /**
   * Builds the Prisma orderBy clause from query parameters.
   * Falls back to createdAt descending for invalid sort fields.
   */
  private buildOrderBy(query: QueryMemoryDto): Prisma.MemoryOrderByWithRelationInput[] {
    const sortBy = query.sortBy ?? 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    if (!ALLOWED_SORT_FIELDS.has(sortBy)) {
      return [{ createdAt: 'desc' }];
    }

    return [{ [sortBy]: sortOrder }];
  }

  /**
   * Invalidate cached memory lists and stats for a user.
   */
  private async invalidateListCache(userId: string): Promise<void> {
    try {
      await this.redis.del(`${REDIS_KEYS.AGENT_CACHE}memory_stats:${userId}`);
    } catch (error) {
      this.logger.warn(`Failed to invalidate memory cache: ${(error as Error).message}`);
    }
  }
}
