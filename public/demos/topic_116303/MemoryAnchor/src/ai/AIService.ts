import { AIProviderManager, aiProviderManager } from './ProviderManager';
import { PromptTemplateManager, promptTemplateManager } from './PromptTemplateManager';
import type { AppConfig } from '../shared/types/config';
import {
  AISummaryRequest,
  AISummaryResponse,
  AITagsRequest,
  AITagsResponse,
  AIKeyPointsRequest,
  AIKeyPointsResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AITestResult,
  AIProviderType,
  AIModelType,
  AIChatMessage,
} from './types';
import { OllamaProvider, ollamaProvider } from './providers/OllamaProvider';
import { OpenAIProvider, openaiProvider } from './providers/OpenAIProvider';
import { ClaudeProvider, claudeProvider } from './providers/ClaudeProvider';
import type { BaseAIProvider } from './providers/BaseProvider';

export class AIService {
  private providerManager: AIProviderManager;
  private templateManager: PromptTemplateManager;
  private isInitialized: boolean = false;

  constructor() {
    this.providerManager = aiProviderManager;
    this.templateManager = promptTemplateManager;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return;

    this.providerManager.registerProvider(ollamaProvider);
    this.providerManager.registerProvider(openaiProvider);
    this.providerManager.registerProvider(claudeProvider);

    claudeProvider.setEmbeddingProvider(openaiProvider);

    this.providerManager.setDefaultChatProvider('ollama');
    this.providerManager.setDefaultEmbeddingProvider('ollama');
    this.providerManager.setFallbackOrder(['ollama', 'openai', 'claude']);
    this.providerManager.setAutoFallback(true);

    this.isInitialized = true;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }
  }

  /**
   * Apply the persisted AI config: per-provider credentials/models and the
   * independent Chat / Embedding backend selection (PRD 3.1.6.2).
   */
  applyConfig(ai: AppConfig['ai']): void {
    // Global generation params apply uniformly (single max-tokens / temperature
    // control, overriding per-task defaults).
    const gen = { maxTokens: ai.maxTokens, temperature: ai.temperature };

    // Keep the shared type-singletons configured too, for non role-specific
    // paths (availability checks / fallback).
    this.providerManager.updateProviderConfig('openai', { apiKey: ai.openai.apiKey, baseUrl: ai.openai.baseUrl, chatModel: ai.openai.model, embeddingModel: ai.openai.embeddingModel, ...gen });
    this.providerManager.updateProviderConfig('claude', { apiKey: ai.claude.apiKey, baseUrl: ai.claude.baseUrl, chatModel: ai.claude.model, ...gen });
    this.providerManager.updateProviderConfig('ollama', { baseUrl: ai.ollama.baseUrl, chatModel: ai.ollama.model, embeddingModel: ai.ollama.embeddingModel, ...gen });

    // Build DEDICATED instances for each role so Chat and Embedding hold fully
    // independent config (baseUrl/apiKey/model) — even when both use the same
    // provider type or BYOK OpenAI protocol, they never clobber each other.
    this.providerManager.setChatProviderInstance(
      this.buildRoleProvider(ai, ai.chatProvider, ai.chatByok, 'chat', gen)
    );
    this.providerManager.setEmbeddingProviderInstance(
      this.buildRoleProvider(ai, ai.embeddingProvider, ai.embeddingByok, 'embedding', gen)
    );
  }

  /** Instantiate a fresh provider configured for one role (null = disabled). */
  private buildRoleProvider(
    ai: AppConfig['ai'],
    backend: AppConfig['ai']['chatProvider'],
    byok: AppConfig['ai']['chatByok'],
    role: 'chat' | 'embedding',
    gen: { maxTokens: number; temperature: number }
  ): BaseAIProvider | null {
    switch (backend) {
      case 'none':
        return null;
      case 'openai':
        return new OpenAIProvider({ apiKey: ai.openai.apiKey, baseUrl: ai.openai.baseUrl, chatModel: ai.openai.model, embeddingModel: ai.openai.embeddingModel, ...gen });
      case 'ollama':
        return new OllamaProvider({ baseUrl: ai.ollama.baseUrl, chatModel: ai.ollama.model, embeddingModel: ai.ollama.embeddingModel, ...gen });
      case 'claude':
        // Claude has no native embeddings; only valid for the chat role.
        return new ClaudeProvider({ apiKey: ai.claude.apiKey, baseUrl: ai.claude.baseUrl, chatModel: ai.claude.model, ...gen });
      case 'byok':
        if (byok.protocol === 'anthropic') {
          return new ClaudeProvider({ apiKey: byok.apiKey, baseUrl: byok.baseUrl, chatModel: byok.model, ...gen });
        }
        return new OpenAIProvider({
          apiKey: byok.apiKey,
          baseUrl: byok.baseUrl,
          ...(role === 'chat' ? { chatModel: byok.model } : { embeddingModel: byok.model }),
          ...gen,
        });
      default:
        return null;
    }
  }

  async generateSummary(
    request: AISummaryRequest,
    preferredProvider?: AIProviderType
  ): Promise<AISummaryResponse> {
    await this.ensureInitialized();

    const { systemPrompt, userPrompt } = this.templateManager.renderDefaultTemplate(
      'summary',
      {
        title: request.title || request.content.slice(0, 100),
        content: request.content,
      }
    );

    const messages: AIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.providerManager.chat(
      {
        messages,
      },
      preferredProvider
    );

    const summary = response.content.trim();

    return {
      summary,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    };
  }

  async generateTags(
    request: AITagsRequest,
    preferredProvider?: AIProviderType
  ): Promise<AITagsResponse> {
    await this.ensureInitialized();

    const summary = request.content.slice(0, 200);

    const { systemPrompt, userPrompt } = this.templateManager.renderDefaultTemplate(
      'tags',
      {
        title: request.title || request.content.slice(0, 100),
        summary,
      }
    );

    const messages: AIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.providerManager.chat(
      {
        messages,
      },
      preferredProvider
    );

    const splitTags = (): string[] =>
      response.content
        .split(/[,\n]/)
        .map((t) => t.trim().replace(/^[["'\s]+|[\]"'\s]+$/g, ''))
        .filter((t) => t.length > 0 && t !== '[' && t !== ']');

    let tags: string[];

    try {
      // [\s\S] so a pretty-printed (multi-line) JSON array still matches.
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as unknown;
        tags = Array.isArray(parsed)
          ? parsed.map((t) => String(t).trim()).filter((t) => t.length > 0)
          : splitTags();
      } else {
        tags = splitTags();
      }
    } catch {
      tags = splitTags();
    }

    if (request.maxTags && tags.length > request.maxTags) {
      tags = tags.slice(0, request.maxTags);
    }

    return {
      tags,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    };
  }

  async generateKeyPoints(
    request: AIKeyPointsRequest,
    preferredProvider?: AIProviderType
  ): Promise<AIKeyPointsResponse> {
    await this.ensureInitialized();

    const { systemPrompt, userPrompt } = this.templateManager.renderDefaultTemplate(
      'keyPoints',
      {
        title: request.title || request.content.slice(0, 100),
        content: request.content,
      }
    );

    const messages: AIChatMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt },
    ];

    const response = await this.providerManager.chat(
      {
        messages,
      },
      preferredProvider
    );

    const splitKeyPoints = (): string[] =>
      response.content
        .split(/\n/)
        .map((p) => p.trim().replace(/^\d+\.?\s*/, ''))
        .filter((p) => p.length > 10);

    let keyPoints: string[];

    try {
      // [\s\S] so a pretty-printed (multi-line) JSON array still matches.
      const jsonMatch = response.content.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]) as unknown;
        keyPoints = Array.isArray(parsed)
          ? parsed.map((p) => String(p).trim()).filter((p) => p.length > 0)
          : splitKeyPoints();
      } else {
        keyPoints = splitKeyPoints();
      }
    } catch {
      keyPoints = splitKeyPoints();
    }

    if (request.maxPoints && keyPoints.length > request.maxPoints) {
      keyPoints = keyPoints.slice(0, request.maxPoints);
    }

    return {
      keyPoints,
      inputTokens: response.inputTokens,
      outputTokens: response.outputTokens,
    };
  }

  async generateEmbedding(
    request: AIEmbeddingRequest,
    preferredProvider?: AIProviderType
  ): Promise<AIEmbeddingResponse> {
    await this.ensureInitialized();

    return this.providerManager.embedding(request, preferredProvider);
  }

  async generateBatchEmbeddings(
    texts: string[],
    preferredProvider?: AIProviderType
  ): Promise<AIEmbeddingResponse> {
    await this.ensureInitialized();

    return this.providerManager.embedding({ text: texts }, preferredProvider);
  }

  async testConnection(
    providerType: AIProviderType,
    modelType?: AIModelType
  ): Promise<AITestResult[]> {
    await this.ensureInitialized();

    // Per-role tests use that role's DEDICATED instance, so the Chat test hits
    // the Chat baseUrl/apiKey and the Embedding test hits the Embedding one —
    // even when both roles are the same provider type.
    if (modelType === 'chat') {
      const p = this.providerManager.getChatProviderInstance();
      if (!p) return [{ success: false, provider: providerType, modelType: 'chat', error: 'Chat 后端未配置' }];
      return [await p.testConnection('chat')];
    }
    if (modelType === 'embedding') {
      const p = this.providerManager.getEmbeddingProviderInstance();
      if (!p) return [{ success: false, provider: providerType, modelType: 'embedding', error: 'Embedding 后端未配置' }];
      return [await p.testConnection('embedding')];
    }

    // No role specified: fall back to the type-registered singleton.
    const provider = this.providerManager.getProvider(providerType);
    if (!provider) {
      return [
        {
          success: false,
          provider: providerType,
          modelType: 'chat',
          error: `Provider ${providerType} not registered`,
        },
      ];
    }

    const results: AITestResult[] = [];
    results.push(await provider.testConnection('chat'));
    if (provider.hasEmbeddingCapability()) {
      results.push(await provider.testConnection('embedding'));
    }
    return results;
  }

  async testAllConnections(): Promise<AITestResult[]> {
    await this.ensureInitialized();
    return this.providerManager.testAllProviders();
  }

  setProviderConfig(
    providerType: AIProviderType,
    config: Partial<{
      enabled: boolean;
      apiKey: string;
      baseUrl: string;
      chatModel: string;
      embeddingModel: string;
    }>
  ): boolean {
    return this.providerManager.updateProviderConfig(providerType, config);
  }

  setDefaultChatProvider(providerType: AIProviderType): void {
    this.providerManager.setDefaultChatProvider(providerType);
  }

  setDefaultEmbeddingProvider(providerType: AIProviderType): void {
    this.providerManager.setDefaultEmbeddingProvider(providerType);
  }

  async getAvailableProviders(): Promise<AIProviderType[]> {
    await this.ensureInitialized();
    return this.providerManager.getAvailableProviders();
  }

  getFallbackOrder(): AIProviderType[] {
    return this.providerManager.getFallbackOrder();
  }

  setFallbackOrder(order: AIProviderType[]): void {
    this.providerManager.setFallbackOrder(order);
  }

  isAutoFallbackEnabled(): boolean {
    return this.providerManager.isAutoFallbackEnabled();
  }

  setAutoFallback(enabled: boolean): void {
    this.providerManager.setAutoFallback(enabled);
  }

  getPromptTemplateManager(): PromptTemplateManager {
    return this.templateManager;
  }

  getProviderManager(): AIProviderManager {
    return this.providerManager;
  }
}

export const aiService = new AIService();