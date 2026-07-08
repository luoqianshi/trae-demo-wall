import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import { RedisService } from '../../redis/redis.service';
import { LlmAdapterService, ChatMessage } from '../ai/services/llm-adapter.service';
import { PromptService } from '../ai/services/prompt.service';
import { GenerateSummaryDto } from './dto/generate-summary.dto';
import { QuerySummaryDto } from './dto/query-summary.dto';
import {
  ERROR_CODES,
  AgentType,
  AI_CONFIG,
  SummaryPeriod,
} from '@echolife/shared';
import type { PaginatedResponse } from '@echolife/shared';

/** The structured summary result parsed from the AI response */
interface SummaryResult {
  title: string;
  content: string;
  highlights: string[];
  emotionTrend?: Record<string, number>;
}

@Injectable()
export class SummaryService {
  private readonly logger = new Logger(SummaryService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly llmAdapter: LlmAdapterService,
    private readonly promptService: PromptService,
  ) {}

  // ============================================================
  // Summary Retrieval
  // ============================================================

  /**
   * List summaries with pagination and optional period filter.
   */
  async list(userId: string, query: QuerySummaryDto): Promise<PaginatedResponse<unknown>> {
    const { skip, take } = query;

    const where: Prisma.SummaryWhereInput = { userId };
    if (query.period) {
      where.period = query.period;
    }

    const [items, total] = await Promise.all([
      this.prisma.summary.findMany({
        where,
        orderBy: { periodStart: 'desc' },
        skip,
        take,
      }),
      this.prisma.summary.count({ where }),
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
   * Get a single summary by ID.
   */
  async getById(userId: string, id: string) {
    const summary = await this.prisma.summary.findFirst({
      where: { id, userId },
    });

    if (!summary) {
      throw new NotFoundException({
        code: ERROR_CODES.NOT_FOUND,
        message: '总结不存在',
      });
    }

    return summary;
  }

  /**
   * Get the latest summary for the user, optionally filtered by period.
   */
  async getLatest(userId: string, period?: string) {
    const where: Prisma.SummaryWhereInput = { userId };
    if (period) {
      where.period = period;
    }

    const summary = await this.prisma.summary.findFirst({
      where,
      orderBy: { periodStart: 'desc' },
    });

    if (!summary) {
      return {
        userId,
        hasSummary: false,
        message: '暂无总结数据',
      };
    }

    return {
      ...summary,
      hasSummary: true,
    };
  }

  // ============================================================
  // Summary Generation
  // ============================================================

  /**
   * Generate a periodic life summary using the AI summary agent.
   * Analyzes memories within the specified date range and produces
   * a narrative summary with highlights and emotion trends.
   */
  async generate(userId: string, dto: GenerateSummaryDto) {
    // Compute the end date if not provided
    const startDate = dto.startDate;
    const endDate = dto.endDate ?? this.computeEndDate(dto.period, startDate);

    if (startDate > endDate) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PARAMS,
        message: '开始日期不能晚于结束日期',
      });
    }

    // Fetch memories within the date range
    const memories = await this.prisma.memory.findMany({
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
      },
    });

    if (memories.length === 0) {
      throw new BadRequestException({
        code: ERROR_CODES.INVALID_PARAMS,
        message: '该时间段内没有记忆数据，无法生成总结',
      });
    }

    // Build the memory text for the AI prompt
    const memoryText = memories
      .map(
        (m) =>
          `- [${m.occurredAt?.toISOString().split('T')[0] ?? '未知日期'}] ${m.title}: ${m.content}${
            m.emotion ? ` (情感: ${m.emotion})` : ''
          }`,
      )
      .join('\n');

    // Compute emotion distribution for the emotion trend
    const emotionTrend = this.computeEmotionTrend(memories);

    // Render the summary agent prompt
    const periodLabel = this.getPeriodLabel(dto.period);
    const systemPrompt = await this.promptService.render(AgentType.SUMMARY_AGENT, {
      user_nickname: '用户',
      period: `${periodLabel} (${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]})`,
      retrieved_memories: memoryText,
      user_message: '请生成生活总结',
      recent_messages: '',
    });

    const analysisPrompt = `${systemPrompt}

请基于以下用户的记忆数据，生成一份${periodLabel}生活总结。以 JSON 格式返回：
{
  "title": "总结标题（简洁有力）",
  "content": "总结正文（500-1000字，温暖鼓励的语气）",
  "highlights": ["亮点1", "亮点2", "亮点3"],
  "emotionTrend": {
    "joy": 0.0-1.0,
    "sadness": 0.0-1.0,
    "anger": 0.0-1.0,
    "nostalgia": 0.0-1.0
  }
}

用户记忆（${memories.length}条）：
${memoryText}

只返回 JSON，不要其他内容。`;

    const messages: ChatMessage[] = [
      { role: 'system', content: analysisPrompt },
      { role: 'user', content: `请生成${periodLabel}生活总结` },
    ];

    let result: SummaryResult;
    try {
      const completion = await this.llmAdapter.chatComplete(messages, {
        temperature: 0.5,
        maxTokens: AI_CONFIG.MAX_TOKENS,
      });

      result = this.parseSummaryResult(completion.content);
    } catch (error) {
      this.logger.error(`Summary generation failed: ${(error as Error).message}`);
      // Fall back to a basic summary
      result = this.generateFallbackSummary(memories, dto.period, startDate, endDate);
    }

    // Store the summary
    const summary = await this.prisma.summary.create({
      data: {
        userId,
        period: dto.period,
        periodStart: startDate,
        periodEnd: endDate,
        title: result.title,
        content: result.content,
        highlights: result.highlights,
        emotionTrend: (result.emotionTrend ?? emotionTrend) as Prisma.InputJsonValue,
        metadata: { memoryCount: memories.length } as Prisma.InputJsonValue,
      },
    });

    // Log the AI call
    await this.logAICall(userId, AgentType.SUMMARY_AGENT);

    this.logger.log(`Summary generated for user: ${userId}, period: ${dto.period}`);

    return summary;
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Computes the end date for a summary period based on the start date
   * and period type.
   */
  private computeEndDate(period: string, startDate: Date): Date {
    const end = new Date(startDate);
    switch (period) {
      case SummaryPeriod.DAILY:
        end.setDate(end.getDate() + 1);
        end.setMilliseconds(-1);
        break;
      case SummaryPeriod.WEEKLY:
        end.setDate(end.getDate() + 7);
        end.setMilliseconds(-1);
        break;
      case SummaryPeriod.MONTHLY:
        end.setMonth(end.getMonth() + 1);
        end.setMilliseconds(-1);
        break;
      case SummaryPeriod.YEARLY:
        end.setFullYear(end.getFullYear() + 1);
        end.setMilliseconds(-1);
        break;
      default:
        end.setDate(end.getDate() + 7);
        end.setMilliseconds(-1);
    }
    return end;
  }

  /**
   * Computes the emotion distribution from memory data.
   */
  private computeEmotionTrend(
    memories: Array<{ emotion: string | null; emotionScore: number | null }>,
  ): Record<string, number> {
    const trend: Record<string, number> = {};
    let total = 0;

    for (const m of memories) {
      if (m.emotion) {
        const emotion = m.emotion.toLowerCase();
        trend[emotion] = (trend[emotion] ?? 0) + (m.emotionScore ?? 0.5);
        total++;
      }
    }

    // Normalize to 0-1 range
    if (total > 0) {
      for (const key of Object.keys(trend)) {
        trend[key] = trend[key] / total;
      }
    }

    return trend;
  }

  /**
   * Returns a human-readable label for the period type.
   */
  private getPeriodLabel(period: string): string {
    const labels: Record<string, string> = {
      [SummaryPeriod.DAILY]: '每日',
      [SummaryPeriod.WEEKLY]: '每周',
      [SummaryPeriod.MONTHLY]: '每月',
      [SummaryPeriod.YEARLY]: '每年',
    };
    return labels[period] ?? period;
  }

  /**
   * Parses the JSON response from the LLM into a summary result.
   */
  private parseSummaryResult(text: string): SummaryResult {
    try {
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      const parsed = JSON.parse(cleaned) as SummaryResult;

      return {
        title: parsed.title ?? '生活总结',
        content: parsed.content ?? '',
        highlights: Array.isArray(parsed.highlights) ? parsed.highlights : [],
        emotionTrend: parsed.emotionTrend,
      };
    } catch {
      this.logger.warn(`Failed to parse summary JSON: ${text.slice(0, 200)}`);
      return {
        title: '生活总结',
        content: text,
        highlights: [],
      };
    }
  }

  /**
   * Generates a basic fallback summary when the AI service is unavailable.
   */
  private generateFallbackSummary(
    memories: Array<{ title: string; content: string; emotion: string | null; occurredAt: Date | null }>,
    period: string,
    startDate: Date,
    endDate: Date,
  ): SummaryResult {
    const titles = memories.map((m) => m.title).slice(0, 5);

    return {
      title: `${this.getPeriodLabel(period)}生活总结`,
      content: `在 ${startDate.toISOString().split('T')[0]} 至 ${endDate.toISOString().split('T')[0]} 期间，您共记录了 ${memories.length} 条记忆。这些记忆记录了您这段时间的生活点滴。（AI服务暂不可用，此为基本总结）`,
      highlights: titles,
      emotionTrend: {},
    };
  }

  /**
   * Logs an AI call to the database.
   */
  private async logAICall(userId: string, agentType: string): Promise<void> {
    try {
      await this.prisma.aICallLog.create({
        data: {
          userId,
          agentType,
          model: AI_CONFIG.MODEL,
          promptTokens: 0,
          completionTokens: 0,
          totalTokens: 0,
          latencyMs: 0,
          status: 'success',
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log AI call: ${(error as Error).message}`);
    }
  }
}
