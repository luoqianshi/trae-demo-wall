import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { RedisService } from '../../../redis/redis.service';
import { LlmAdapterService, ChatMessage } from './llm-adapter.service';
import { PromptService } from './prompt.service';
import { EmbeddingService } from './embedding.service';
import { RagService } from './rag.service';
import { QuotaService } from './quota.service';
import { SkillsEvolutionService } from '../../familyhub/skills-evolution.service';
import { WebSearchService } from './web-search.service';
import {
  AgentType,
  SSEEventType,
  ERROR_CODES,
  RAG_DEFAULTS,
  AI_CONFIG,
  AgentInput,
  MemoryType,
} from '@echolife/shared';
import type {
  SSETokenData,
  SSEEntitiesData,
  SSEEmotionData,
  SSEDoneData,
  SSEErrorData,
  MemoryWithScore,
  RetrievalConfig,
} from '@echolife/shared';

/** Discriminated union for SSE events streamed to the client */
export type SSEEvent =
  | { type: SSEEventType.TOKEN; data: SSETokenData }
  | { type: SSEEventType.ENTITIES; data: SSEEntitiesData }
  | { type: SSEEventType.EMOTION; data: SSEEmotionData }
  | { type: SSEEventType.DONE; data: SSEDoneData }
  | { type: SSEEventType.ERROR; data: SSEErrorData };

/** Input for the digital life persona endpoint */
export interface DigitalLifeInput {
  userId: string;
  message: string;
  persona?: string;
}

/** Parsed memory extraction result */
interface ExtractedMemory {
  title: string;
  content: string;
  type: string;
  emotion?: string;
  emotionScore?: number;
  importance?: number;
  occurredAt?: string;
}

/** Wrapper for the memory extraction LLM response */
interface MemoryExtractionResult {
  memories: ExtractedMemory[];
}

/** Parsed emotion analysis result */
interface EmotionResult {
  emotion: string;
  intensity: number;
  secondaryEmotion?: string;
  valence?: string;
  analysis?: string;
}

/** Parsed entity extraction result */
interface EntityResult {
  entities: Array<{ name: string; type: string; description?: string }>;
  relations?: Array<{ source: string; target: string; type: string }>;
}

/** Result of the routing classification */
interface RoutingResult {
  agentType: string;
}

@Injectable()
export class AgentOrchestratorService {
  private readonly logger = new Logger(AgentOrchestratorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly redis: RedisService,
    private readonly llmAdapter: LlmAdapterService,
    private readonly promptService: PromptService,
    private readonly embeddingService: EmbeddingService,
    private readonly ragService: RagService,
    private readonly quotaService: QuotaService,
    private readonly skillsEvolution: SkillsEvolutionService,
    private readonly webSearch: WebSearchService,
  ) {}

  // ============================================================
  // Interview Chat (Main Orchestrator)
  // ============================================================

  /**
   * Main interview orchestration pipeline.
   *
   * Flow:
   * 1. Check monthly AI quota via Redis
   * 2. Retrieve relevant memories via RAG (hybrid retrieval)
   * 3. Route to the appropriate sub-agent via the LifeCoach
   * 4. Stream the agent's response as token events
   * 5. Asynchronously extract and store new memories
   * 6. Log the AI call
   *
   * @param input - The agent input containing userId, message, and optional interviewId
   * @yields {SSEEvent} SSE events (token, entities, emotion, done, error)
   */
  async *interview(input: AgentInput): AsyncGenerator<SSEEvent> {
    const startTime = Date.now();
    let fullResponse = '';
    let agentType: string = AgentType.LIFE_COACH;
    let status = 'success';
    let errorMessage: string | undefined;

    try {
      // Step 1: Check quota
      const quotaCheck = await this.quotaService.checkQuota(input.userId);
      if (!quotaCheck.allowed) {
        yield {
          type: SSEEventType.ERROR,
          data: {
            message: '本月AI对话次数已用完，请升级订阅计划',
            code: ERROR_CODES.QUOTA_EXCEEDED,
          },
        };
        return;
      }

      // Step 2: Retrieve relevant memories via RAG
      const ragConfig: RetrievalConfig = {
        topK: RAG_DEFAULTS.TOP_K,
        userId: input.userId,
        weightConfig: {
          semantic: RAG_DEFAULTS.WEIGHTS.SEMANTIC,
          recency: RAG_DEFAULTS.WEIGHTS.RECENCY,
          emotion: RAG_DEFAULTS.WEIGHTS.EMOTION,
        },
        minSimilarity: RAG_DEFAULTS.MIN_SIMILARITY,
      };

      let retrievedMemories: MemoryWithScore[] = [];
      try {
        const ragResult = await this.ragService.retrieve(input.message, ragConfig);
        retrievedMemories = ragResult.memories;
      } catch (error) {
        this.logger.warn(`RAG retrieval failed: ${(error as Error).message}`);
      }

      // Load user context (nickname, personality, recent messages)
      const context = await this.loadUserContext(input, retrievedMemories);

      // Step 3: Route to appropriate agent via LifeCoach
      agentType = await this.routeAgent(input.message, context);

      // Step 4: Render the selected agent's prompt
      const systemPrompt = await this.promptService.render(agentType, {
        user_nickname: context.nickname,
        user_message: input.message,
        recent_messages: context.formattedRecentMessages,
        retrieved_memories: context.formattedMemories,
        personality_profile: context.formattedPersonality,
      });

      // Inject skills evolution prompt so 时墨 in interviews is skill-aware.
      // The life agent's skills (and their levels) shape the depth of the
      // response. Failures here are non-fatal — we fall back to the base prompt.
      let systemPromptEnhanced: string;
      try {
        const skillPrompt = await this.skillsEvolution.buildSkillPrompt('life');
        if (skillPrompt) {
          systemPromptEnhanced = systemPrompt + '\n\n' + skillPrompt;
        } else {
          systemPromptEnhanced = systemPrompt;
        }
      } catch (e) {
        this.logger.warn(`Skills evolution injection failed: ${(e as Error).message}`);
        systemPromptEnhanced = systemPrompt;
      }

      // Web search: detect if the user is asking about real-time info
      // (weather, news, stock prices, etc.) and inject search results.
      // Non-blocking — if search fails, the conversation continues normally.
      try {
        const searchQuery = this.webSearch.detectRealtimeQuery(input.message);
        if (searchQuery) {
          this.logger.log(`Detected real-time query, searching: "${searchQuery}"`);
          const searchResult = await this.webSearch.search(searchQuery, 5);
          const searchContext = this.webSearch.formatForPrompt(searchResult);
          if (searchContext) {
            systemPromptEnhanced += '\n\n' + searchContext;
            this.logger.log(`Web search injected (${searchResult.source}): ${searchResult.results.length} results`);
          }
        }
      } catch (e) {
        this.logger.warn(`Web search failed (non-blocking): ${(e as Error).message}`);
      }

      // Build the message array for the LLM.
      // Note: user message and recent history are NOT duplicated in the
      // system prompt (removed {{user_message}} and {{recent_messages}} from
      // the template) to avoid confusing the model.
      const messages: ChatMessage[] = [
        { role: 'system', content: systemPromptEnhanced },
        ...context.recentMessageHistory,
        { role: 'user', content: input.message },
      ];

      // Store user message in interview (if applicable)
      if (input.interviewId) {
        await this.storeInterviewMessage(input.interviewId, 'user', input.message);
      }

      // Step 5: Stream the response, yielding token events
      try {
        for await (const chunk of this.llmAdapter.chat(messages, {
          temperature: context.aiTemperature,
          maxTokens: AI_CONFIG.MAX_TOKENS,
        })) {
          fullResponse += chunk;
          yield {
            type: SSEEventType.TOKEN,
            data: { content: chunk },
          };
        }
      } catch (error) {
        this.logger.error(`Streaming failed: ${(error as Error).message}`);
        status = 'failed';
        errorMessage = (error as Error).message;
        yield {
          type: SSEEventType.ERROR,
          data: {
            message: 'AI响应流式传输失败，请稍后重试',
            code: ERROR_CODES.AI_SERVICE_ERROR,
          },
        };
        return;
      }

      // Store AI response in interview (if applicable)
      if (input.interviewId) {
        await this.storeInterviewMessage(input.interviewId, 'ai', fullResponse);
      }

      // Increment usage counter
      await this.quotaService.incrementUsage(input.userId);

      // Update working memory with the latest exchange
      await this.updateWorkingMemory(input.userId, input.message, fullResponse);

      // Step 6: Async extraction (memories, emotions, entities)
      let emotionResult: EmotionResult | null = null;
      let entityResult: EntityResult | null = null;
      let storedMemoryIds: string[] = [];

      try {
        const [emotion, entities, memories] = await Promise.all([
          this.extractEmotion(input.message, fullResponse),
          this.extractEntities(input.message),
          this.extractAndStoreMemories(input, fullResponse, context),
        ]);

        emotionResult = emotion;
        entityResult = entities;
        storedMemoryIds = memories;
      } catch (error) {
        this.logger.warn(`Post-processing extraction failed: ${(error as Error).message}`);
      }

      // Yield entities event
      if (entityResult && entityResult.entities.length > 0) {
        yield {
          type: SSEEventType.ENTITIES,
          data: { entities: entityResult.entities.map((e) => e.name) },
        };
      }

      // Yield emotion event
      if (emotionResult) {
        yield {
          type: SSEEventType.EMOTION,
          data: {
            emotion: emotionResult.emotion,
            intensity: emotionResult.intensity,
          },
        };
      }

      // Step 7: Log the AI call
      const latencyMs = Date.now() - startTime;
      await this.logAICall(
        input.userId,
        agentType,
        latencyMs,
        status,
        errorMessage,
        fullResponse,
      );

      // Yield done event
      yield {
        type: SSEEventType.DONE,
        data: {
          memoryId: storedMemoryIds[0] ?? '',
          summary: fullResponse.slice(0, 200),
          emotion: emotionResult?.emotion,
        },
      };

      // Let the interview conversation also accumulate skill experience for
      // the life agent, so 时墨 grows through interviews — not just agent calls.
      // Wrapped so a failure here never surfaces as an error after DONE.
      try {
        await this.skillsEvolution.gainExperience('life', input.message);
      } catch (e) {
        this.logger.warn(`Skills evolution gainExperience failed: ${(e as Error).message}`);
      }
    } catch (error) {
      this.logger.error(`Orchestration error: ${(error as Error).message}`, (error as Error).stack);
      status = 'failed';
      errorMessage = (error as Error).message;

      // Log the failed call
      const latencyMs = Date.now() - startTime;
      await this.logAICall(input.userId, agentType, latencyMs, status, errorMessage, fullResponse);

      yield {
        type: SSEEventType.ERROR,
        data: {
          message: 'AI服务内部错误，请稍后重试',
          code: ERROR_CODES.INTERNAL_ERROR,
        },
      };
    }
  }

  // ============================================================
  // Digital Life Persona
  // ============================================================

  /**
   * Streams a response from the user's digital life persona.
   * The digital life is an AI that speaks in the user's voice based on
   * their memories and personality profile.
   *
   * @param input - The digital life input
   * @yields {SSEEvent} SSE events (token, done, error)
   */
  async *digitalLife(input: DigitalLifeInput): AsyncGenerator<SSEEvent> {
    const startTime = Date.now();
    let fullResponse = '';
    let status = 'success';
    let errorMessage: string | undefined;

    try {
      // Check quota
      const quotaCheck = await this.quotaService.checkQuota(input.userId);
      if (!quotaCheck.allowed) {
        yield {
          type: SSEEventType.ERROR,
          data: {
            message: '本月AI对话次数已用完，请升级订阅计划',
            code: ERROR_CODES.QUOTA_EXCEEDED,
          },
        };
        return;
      }

      // Retrieve memories for context
      const ragConfig: RetrievalConfig = {
        topK: 15,
        userId: input.userId,
        weightConfig: {
          semantic: 0.5,
          recency: 0.3,
          emotion: 0.2,
        },
        minSimilarity: 0.2,
      };

      let retrievedMemories: MemoryWithScore[] = [];
      try {
        const ragResult = await this.ragService.retrieve(input.message, ragConfig);
        retrievedMemories = ragResult.memories;
      } catch (error) {
        this.logger.warn(`RAG retrieval failed for digital life: ${(error as Error).message}`);
      }

      // Load user context
      const user = await this.prisma.user.findUnique({
        where: { id: input.userId, deletedAt: null },
        include: {
          profile: true,
          settings: true,
          personality: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      if (!user) {
        yield {
          type: SSEEventType.ERROR,
          data: { message: '用户不存在', code: ERROR_CODES.USER_NOT_FOUND },
        };
        return;
      }

      const nickname = user.profile?.nickname ?? '用户';
      const aiTemperature = user.settings?.aiTemperature ?? AI_CONFIG.TEMPERATURE;

      // Build the digital life system prompt
      const memoryText = this.formatMemories(retrievedMemories);
      const personalityText = user.personality[0]
        ? this.formatPersonality(user.personality[0])
        : '暂无个性分析数据';

      const personaInstruction = input.persona ?? '你是用户的数字生命，以用户的第一人称视角回答问题，保持用户的说话风格和个性。';

      const systemPrompt = `${personaInstruction}

你是 ${nickname} 的数字生命。你拥有以下记忆和个性特征，请以 ${nickname} 的口吻回答问题。

你的记忆：
${memoryText}

你的个性特征：
${personalityText}

请以第一人称回答，保持真实的自我。如果不确定某件事，诚实地说你不记得了。`;

      const messages: ChatMessage[] = [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: input.message },
      ];

      // Stream the response
      try {
        for await (const chunk of this.llmAdapter.chat(messages, {
          temperature: aiTemperature,
          maxTokens: AI_CONFIG.MAX_TOKENS,
        })) {
          fullResponse += chunk;
          yield {
            type: SSEEventType.TOKEN,
            data: { content: chunk },
          };
        }
      } catch (error) {
        this.logger.error(`Digital life streaming failed: ${(error as Error).message}`);
        status = 'failed';
        errorMessage = (error as Error).message;
        yield {
          type: SSEEventType.ERROR,
          data: {
            message: '数字生命响应失败，请稍后重试',
            code: ERROR_CODES.AI_SERVICE_ERROR,
          },
        };
        return;
      }

      // Increment usage
      await this.quotaService.incrementUsage(input.userId);

      // Log the call
      const latencyMs = Date.now() - startTime;
      await this.logAICall(
        input.userId,
        'life_coach',
        latencyMs,
        status,
        errorMessage,
        fullResponse,
      );

      yield {
        type: SSEEventType.DONE,
        data: {
          memoryId: '',
          summary: fullResponse.slice(0, 200),
        },
      };
    } catch (error) {
      this.logger.error(`Digital life error: ${(error as Error).message}`, (error as Error).stack);
      status = 'failed';
      errorMessage = (error as Error).message;

      const latencyMs = Date.now() - startTime;
      await this.logAICall(input.userId, 'life_coach', latencyMs, status, errorMessage, fullResponse);

      yield {
        type: SSEEventType.ERROR,
        data: {
          message: '数字生命服务内部错误',
          code: ERROR_CODES.INTERNAL_ERROR,
        },
      };
    }
  }

  // ============================================================
  // Agent Routing (LifeCoach)
  // ============================================================

  /**
   * Uses the LifeCoach to classify the user's message and determine
   * which sub-agent should handle the response.
   *
   * @param message - The user's message
   * @param context - The loaded user context
   * @returns The agent type to route to
   */
  private async routeAgent(
    message: string,
    context: UserContext,
  ): Promise<string> {
    try {
      // Only route to conversational agents that produce natural text.
      // emotion_agent, memory_agent, knowledge_agent, relationship_agent
      // are internal extraction agents that output JSON — they must NEVER
      // be used for the main streamed response.
      const routingPrompt = `你是一个路由助手。分析用户的消息，判断应该由哪个代理处理。只回复代理类型名称，不要其他文字。

可用代理（仅限以下两个，都会以自然语言回复用户）：
- story_agent: 用户明确要求把经历写成故事、叙事
- life_coach: 所有其他情况（日常对话、情感倾诉、生活提问、记忆分享等）

注意：即使用户表达了情感或提到记忆，也一律路由到 life_coach，因为 life_coach 会以温暖自然的方式回应。

用户消息：${message}

只回复代理类型名称：`;

      const result = await this.llmAdapter.chatComplete(
        [
          { role: 'system', content: routingPrompt },
          { role: 'user', content: message },
        ],
        { temperature: 0.1, maxTokens: 50 },
      );

      const agentType = result.content.trim().toLowerCase();

      // Only allow conversational agents for the streamed response
      const conversationalAgents = [
        AgentType.STORY_AGENT,
        AgentType.LIFE_COACH,
      ];

      if (conversationalAgents.includes(agentType as AgentType)) {
        this.logger.debug(`Routed to agent: ${agentType}`);
        return agentType;
      }

      // Default to life_coach for anything else
      this.logger.debug(`Routed to life_coach (fallback from: ${agentType})`);
      return AgentType.LIFE_COACH;
    } catch (error) {
      this.logger.warn(`Routing failed, defaulting to life_coach: ${(error as Error).message}`);
      return AgentType.LIFE_COACH;
    }
  }

  // ============================================================
  // Memory Extraction & Storage
  // ============================================================

  /**
   * Extracts structured memories from the conversation using the MemoryAgent
   * and stores them in the database with embeddings.
   *
   * @param input - The original agent input
   * @param aiResponse - The full AI response text
   * @param context - The loaded user context
   * @returns Array of created memory IDs
   */
  private async extractAndStoreMemories(
    input: AgentInput,
    aiResponse: string,
    context: UserContext,
  ): Promise<string[]> {
    try {
      const systemPrompt = await this.promptService.render(AgentType.MEMORY_AGENT, {
        user_nickname: context.nickname,
        user_message: input.message,
        retrieved_memories: context.formattedMemories,
        recent_messages: `${input.message}\nAI: ${aiResponse}`,
      });

      const result = await this.llmAdapter.chatComplete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `用户: ${input.message}\nAI: ${aiResponse}` },
        ],
        { temperature: 0.3, maxTokens: 2048 },
      );

      const parsed = this.parseJsonResponse<MemoryExtractionResult>(result.content);
      if (!parsed || !parsed.memories || parsed.memories.length === 0) {
        return [];
      }

      const memoryIds: string[] = [];

      for (const mem of parsed.memories.slice(0, 5)) {
        // Create the memory record
        const memory = await this.prisma.memory.create({
          data: {
            userId: input.userId,
            interviewId: input.interviewId ?? null,
            title: mem.title,
            content: mem.content,
            type: this.validateMemoryType(mem.type),
            visibility: 'private',
            emotion: mem.emotion ?? null,
            emotionScore: mem.emotionScore ?? null,
            importance: mem.importance ?? 0.5,
            occurredAt: mem.occurredAt ? new Date(mem.occurredAt) : null,
          },
        });

        memoryIds.push(memory.id);

        // Generate and store embedding asynchronously
        try {
          const embedding = await this.embeddingService.generateEmbedding(
            `${mem.title} ${mem.content}`,
          );
          await this.embeddingService.storeEmbedding(memory.id, embedding);
        } catch (error) {
          this.logger.error(
            `Failed to store embedding for memory ${memory.id}: ${(error as Error).message}`,
          );
        }
      }

      // Update interview memory count
      if (input.interviewId && memoryIds.length > 0) {
        await this.prisma.interview.update({
          where: { id: input.interviewId },
          data: { memoryCount: { increment: memoryIds.length } },
        });
      }

      this.logger.log(`Extracted and stored ${memoryIds.length} memories for user ${input.userId}`);
      return memoryIds;
    } catch (error) {
      this.logger.error(`Memory extraction failed: ${(error as Error).message}`);
      return [];
    }
  }

  // ============================================================
  // Emotion Analysis
  // ============================================================

  /**
   * Analyzes the emotional content of the user's message using the EmotionAgent.
   */
  private async extractEmotion(
    userMessage: string,
    aiResponse: string,
  ): Promise<EmotionResult | null> {
    try {
      const systemPrompt = await this.promptService.render(AgentType.EMOTION_AGENT, {
        user_nickname: '用户',
        user_message: userMessage,
        retrieved_memories: '',
        recent_messages: aiResponse,
      });

      const result = await this.llmAdapter.chatComplete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.3, maxTokens: 512 },
      );

      const parsed = this.parseJsonResponse<EmotionResult>(result.content);
      if (!parsed || !parsed.emotion) {
        return null;
      }

      return {
        emotion: parsed.emotion,
        intensity: parsed.intensity ?? 0.5,
        secondaryEmotion: parsed.secondaryEmotion,
        valence: parsed.valence,
        analysis: parsed.analysis,
      };
    } catch (error) {
      this.logger.warn(`Emotion analysis failed: ${(error as Error).message}`);
      return null;
    }
  }

  // ============================================================
  // Entity Extraction
  // ============================================================

  /**
   * Extracts entities from the user's message using the KnowledgeAgent.
   */
  private async extractEntities(userMessage: string): Promise<EntityResult | null> {
    try {
      const systemPrompt = await this.promptService.render(AgentType.KNOWLEDGE_AGENT, {
        user_nickname: '用户',
        user_message: userMessage,
        retrieved_memories: '',
        recent_messages: '',
      });

      const result = await this.llmAdapter.chatComplete(
        [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userMessage },
        ],
        { temperature: 0.3, maxTokens: 1024 },
      );

      const parsed = this.parseJsonResponse<EntityResult>(result.content);
      if (!parsed || !parsed.entities) {
        return null;
      }

      return parsed;
    } catch (error) {
      this.logger.warn(`Entity extraction failed: ${(error as Error).message}`);
      return null;
    }
  }

  // ============================================================
  // Context Loading
  // ============================================================

  /**
   * Loads user context including nickname, personality, recent messages,
   * and formats them for prompt injection.
   */
  private async loadUserContext(
    input: AgentInput,
    retrievedMemories: MemoryWithScore[],
  ): Promise<UserContext> {
    // Fetch user profile and personality
    const user = await this.prisma.user.findUnique({
      where: { id: input.userId, deletedAt: null },
      include: {
        profile: true,
        settings: true,
        personality: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    const nickname = user?.profile?.nickname ?? '用户';
    const aiTemperature = user?.settings?.aiTemperature ?? AI_CONFIG.TEMPERATURE;

    // Fetch recent interview messages
    let recentMessages: Array<{ sender: string; content: string }> = [];
    if (input.interviewId) {
      const messages = await this.prisma.interviewMessage.findMany({
        where: { interviewId: input.interviewId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
      recentMessages = messages.reverse().map((m) => ({
        sender: m.sender,
        content: m.content,
      }));
    } else {
      // Try working memory for recent context
      const workingMemory = await this.redis.getWorkingMemory<{
        messages?: Array<{ sender: string; content: string }>;
      }>(input.userId);
      if (workingMemory?.messages) {
        recentMessages = workingMemory.messages.slice(-10);
      }
    }

    // Build formatted strings for prompt injection
    const formattedRecentMessages = this.formatRecentMessages(recentMessages);
    const formattedMemories = this.formatMemories(retrievedMemories);
    const formattedPersonality = user?.personality[0]
      ? this.formatPersonality(user.personality[0])
      : '暂无个性分析数据';

    // Build message history for the LLM (excluding the current user message)
    const recentMessageHistory: ChatMessage[] = recentMessages.map((m) => ({
      role: m.sender === 'user' ? 'user' : 'assistant',
      content: m.content,
    }));

    return {
      nickname,
      aiTemperature,
      recentMessages,
      recentMessageHistory,
      formattedRecentMessages,
      formattedMemories,
      formattedPersonality,
    };
  }

  // ============================================================
  // Private Helpers
  // ============================================================

  /**
   * Stores a message in the InterviewMessage table.
   */
  private async storeInterviewMessage(
    interviewId: string,
    sender: string,
    content: string,
  ): Promise<void> {
    try {
      await this.prisma.interviewMessage.create({
        data: {
          interviewId,
          sender,
          content,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to store interview message: ${(error as Error).message}`);
    }
  }

  /**
   * Updates the working memory in Redis with the latest exchange.
   */
  private async updateWorkingMemory(
    userId: string,
    userMessage: string,
    aiResponse: string,
  ): Promise<void> {
    try {
      const existing = await this.redis.getWorkingMemory<{
        messages?: Array<{ sender: string; content: string }>;
      }>(userId);

      const messages = existing?.messages ?? [];
      messages.push(
        { sender: 'user', content: userMessage },
        { sender: 'ai', content: aiResponse },
      );

      // Keep only the last 20 messages
      const trimmed = messages.slice(-20);

      await this.redis.setWorkingMemory(userId, { messages: trimmed });
    } catch (error) {
      this.logger.warn(`Failed to update working memory: ${(error as Error).message}`);
    }
  }

  /**
   * Logs an AI call to the AICallLog table.
   */
  private async logAICall(
    userId: string,
    agentType: string,
    latencyMs: number,
    status: string,
    errorMessage?: string,
    responseText?: string,
  ): Promise<void> {
    try {
      // Estimate token counts (rough approximation: 1 token ≈ 4 chars)
      const estimatedTokens = Math.ceil((responseText?.length ?? 0) / 4);

      await this.prisma.aICallLog.create({
        data: {
          userId,
          agentType,
          model: AI_CONFIG.MODEL,
          promptTokens: 0,
          completionTokens: estimatedTokens,
          totalTokens: estimatedTokens,
          latencyMs,
          status,
          errorMessage: errorMessage ?? null,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to log AI call: ${(error as Error).message}`);
    }
  }

  /**
   * Parses a JSON response from the LLM, handling potential markdown code fences.
   */
  private parseJsonResponse<T>(text: string): T | null {
    try {
      // Strip markdown code fences if present
      let cleaned = text.trim();
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '');
      }

      return JSON.parse(cleaned) as T;
    } catch {
      this.logger.debug(`Failed to parse JSON response: ${text.slice(0, 200)}`);
      return null;
    }
  }

  /**
   * Validates and normalizes a memory type string.
   */
  private validateMemoryType(type: string): string {
    const validTypes = Object.values(MemoryType) as string[];
    const normalized = type?.toLowerCase().trim();
    return validTypes.includes(normalized) ? normalized : MemoryType.STORY;
  }

  /**
   * Formats recent messages for prompt injection.
   */
  private formatRecentMessages(
    messages: Array<{ sender: string; content: string }>,
  ): string {
    if (messages.length === 0) return '暂无对话记录';
    return messages
      .map((m) => `${m.sender === 'user' ? '用户' : 'AI'}: ${m.content}`)
      .join('\n');
  }

  /**
   * Formats retrieved memories for prompt injection.
   */
  private formatMemories(memories: MemoryWithScore[]): string {
    if (!memories || memories.length === 0) return '暂无相关记忆';
    return memories
      .map((m) => `- [${m.type}] ${m.title}: ${m.content}`)
      .join('\n');
  }

  /**
   * Formats a personality profile for prompt injection.
   */
  private formatPersonality(personality: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
    analysis?: string | null;
  }): string {
    const traits = [
      `开放性: ${(personality.openness * 100).toFixed(0)}%`,
      `尽责性: ${(personality.conscientiousness * 100).toFixed(0)}%`,
      `外向性: ${(personality.extraversion * 100).toFixed(0)}%`,
      `宜人性: ${(personality.agreeableness * 100).toFixed(0)}%`,
      `神经质: ${(personality.neuroticism * 100).toFixed(0)}%`,
    ];

    let result = traits.join(', ');
    if (personality.analysis) {
      result += `\n分析: ${personality.analysis}`;
    }
    return result;
  }
}

// ============================================================
// Internal Types
// ============================================================

interface UserContext {
  nickname: string;
  aiTemperature: number;
  recentMessages: Array<{ sender: string; content: string }>;
  recentMessageHistory: ChatMessage[];
  formattedRecentMessages: string;
  formattedMemories: string;
  formattedPersonality: string;
}
