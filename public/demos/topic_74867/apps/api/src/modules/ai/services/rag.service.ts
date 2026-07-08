import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { LlmAdapterService } from './llm-adapter.service';
import {
  RetrievalConfig,
  RetrievalResult,
  MemoryWithScore,
  RAG_DEFAULTS,
  timeDecayScore,
  hybridScore,
  MemoryType,
  MemoryVisibility,
} from '@echolife/shared';

/** Raw row returned from the pgvector similarity search */
interface VectorSearchRow {
  id: string;
  user_id: string;
  interview_id: string | null;
  title: string;
  content: string;
  type: string;
  visibility: string;
  emotion: string | null;
  emotion_score: number | null;
  importance: number | null;
  occurred_at: Date | null;
  metadata: unknown;
  is_deleted: boolean;
  created_at: Date;
  updated_at: Date;
  similarity: number;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly llmAdapter: LlmAdapterService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Performs hybrid retrieval combining semantic similarity, recency, and emotion.
   *
   * Pipeline:
   * 1. Embed the query using the LLM adapter
   * 2. Run a pgvector similarity search (cosine distance) joined with the memories table
   * 3. Calculate time decay score for each result
   * 4. Calculate emotion weight from emotionScore and importance
   * 5. Combine scores with hybrid weights (semantic 0.7, recency 0.2, emotion 0.1)
   * 6. Filter by minimum similarity and return top-K
   *
   * @param query - The user's query text
   * @param config - Retrieval configuration (topK, weights, filters)
   * @returns Retrieval results with scored memories
   */
  async retrieve(query: string, config: RetrievalConfig): Promise<RetrievalResult> {
    const topK = config.topK ?? RAG_DEFAULTS.TOP_K;
    const minSimilarity = config.minSimilarity ?? RAG_DEFAULTS.MIN_SIMILARITY;
    const weights = config.weightConfig ?? {
      semantic: RAG_DEFAULTS.WEIGHTS.SEMANTIC,
      recency: RAG_DEFAULTS.WEIGHTS.RECENCY,
      emotion: RAG_DEFAULTS.WEIGHTS.EMOTION,
    };

    // Step 1: Embed the query
    const queryEmbedding = await this.llmAdapter.embed(query);

    // Step 2: pgvector similarity search with a join to memories
    // Fetch more candidates than topK to allow for post-filtering
    const candidateLimit = Math.max(topK * 3, 30);
    const candidates = await this.vectorSearch(
      queryEmbedding,
      config.userId,
      candidateLimit,
      config.memoryTypes,
    );

    if (candidates.length === 0) {
      return { memories: [], totalFound: 0, queryEmbedding };
    }

    // Steps 3-5: Calculate hybrid scores
    const scoredMemories: MemoryWithScore[] = candidates
      .filter((row) => row.similarity >= minSimilarity)
      .map((row) => {
        const semanticScore = row.similarity;

        // Time decay score based on creation date (half-life of 30 days)
        const recencyScore = timeDecayScore(row.created_at, 30);

        // Emotion weight: blend of emotionScore and importance
        const emotionScore = this.calculateEmotionWeight(
          row.emotion_score,
          row.importance,
        );

        // Combine with hybrid weights
        const finalScore = hybridScore(semanticScore, recencyScore, emotionScore, weights);

        return {
          id: row.id,
          userId: row.user_id,
          interviewId: row.interview_id ?? undefined,
          title: row.title,
          content: row.content,
          type: row.type as MemoryType,
          visibility: row.visibility as MemoryVisibility,
          emotion: row.emotion ?? undefined,
          importance: row.importance ?? undefined,
          occurredAt: row.occurred_at ? row.occurred_at.toISOString() : undefined,
          metadata: (row.metadata as Record<string, unknown>) ?? undefined,
          createdAt: row.created_at.toISOString(),
          updatedAt: row.updated_at.toISOString(),
          similarityScore: semanticScore,
          recencyScore,
          emotionScore,
          finalScore,
        };
      });

    // Step 6: Sort by final score and return top-K
    scoredMemories.sort((a, b) => b.finalScore - a.finalScore);
    const topMemories = scoredMemories.slice(0, topK);

    this.logger.debug(
      `RAG retrieval: query="${query.slice(0, 50)}...", found=${candidates.length}, ` +
        `after_filter=${scoredMemories.length}, returning=${topMemories.length}`,
    );

    return {
      memories: topMemories,
      totalFound: scoredMemories.length,
      queryEmbedding,
    };
  }

  /**
   * Executes a pgvector similarity search with a join to the memories table.
   *
   * @param queryVector - The query embedding vector
   * @param userId - Filter memories by this user
   * @param limit - Maximum number of results
   * @param memoryTypes - Optional filter by memory types
   * @returns Array of memory rows with similarity scores
   */
  private async vectorSearch(
    queryVector: number[],
    userId: string,
    limit: number,
    memoryTypes?: MemoryType[],
  ): Promise<VectorSearchRow[]> {
    const vectorStr = `[${queryVector.join(',')}]`;

    // Build optional memory type filter
    let typeFilter = '';
    const params: unknown[] = [vectorStr, userId, limit];

    if (memoryTypes && memoryTypes.length > 0) {
      const placeholders = memoryTypes
        .map((_, i) => `$${params.length + i + 1}`)
        .join(', ');
      typeFilter = ` AND m.type IN (${placeholders})`;
      params.push(...memoryTypes);
    }

    const sql = `
      SELECT
        m.id, m.user_id, m.interview_id, m.title, m.content, m.type,
        m.visibility, m.emotion, m.emotion_score, m.importance,
        m.occurred_at, m.metadata, m.is_deleted, m.created_at, m.updated_at,
        1 - (me.embedding <=> $1::vector) AS similarity
      FROM "memory_embeddings" me
      JOIN "memories" m ON m.id = me.memory_id
      WHERE m.user_id = $2
        AND m.is_deleted = false
        ${typeFilter}
      ORDER BY me.embedding <=> $1::vector
      LIMIT $3
    `;

    const rows = await this.prisma.$queryRawUnsafe<VectorSearchRow[]>(sql, ...params);
    return rows;
  }

  /**
   * Calculates the emotion weight for a memory.
   * Blends the emotion score (if available) with the importance score.
   * Falls back to 0.5 when neither is available.
   *
   * @param emotionScore - The emotion score (0-1), may be null
   * @param importance - The importance score (0-1), may be null
   * @returns A weight between 0 and 1
   */
  private calculateEmotionWeight(
    emotionScore: number | null,
    importance: number | null,
  ): number {
    const eScore = emotionScore ?? 0.5;
    const imp = importance ?? 0.5;
    // Weighted blend: 60% emotion, 40% importance
    return eScore * 0.6 + imp * 0.4;
  }
}
