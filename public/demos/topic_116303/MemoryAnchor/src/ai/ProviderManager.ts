import {
  AIProviderType,
  AIProviderConfig,
  AIProviderInterface,
  AIChatRequest,
  AIChatResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AITestResult,
  AIProviderManagerConfig,
  AIModelType,
} from './types';
import { BaseAIProvider } from './providers/BaseProvider';

export class AIProviderManager {
  private providers: Map<AIProviderType, AIProviderInterface> = new Map();
  private defaultChatProvider: AIProviderType | null = null;
  private defaultEmbeddingProvider: AIProviderType | null = null;
  // Dedicated per-role instances so Chat and Embedding hold fully independent
  // config (baseUrl/apiKey/model) even when both use the same provider type.
  private chatProviderInstance: AIProviderInterface | null = null;
  private embeddingProviderInstance: AIProviderInterface | null = null;
  private autoFallback: boolean = true;
  private fallbackOrder: AIProviderType[] = ['ollama', 'openai', 'claude'];

  constructor(config?: Partial<AIProviderManagerConfig>) {
    if (config) {
      this.configure(config);
    }
  }

  configure(config: Partial<AIProviderManagerConfig>): void {
    if (config.defaultChatProvider) {
      this.defaultChatProvider = config.defaultChatProvider;
    }
    if (config.defaultEmbeddingProvider) {
      this.defaultEmbeddingProvider = config.defaultEmbeddingProvider;
    }
    if (config.autoFallback !== undefined) {
      this.autoFallback = config.autoFallback;
    }
    if (config.fallbackOrder) {
      this.fallbackOrder = config.fallbackOrder;
    }
  }

  registerProvider(provider: AIProviderInterface): void {
    this.providers.set(provider.type, provider);
  }

  unregisterProvider(type: AIProviderType): boolean {
    return this.providers.delete(type);
  }

  getProvider(type: AIProviderType): AIProviderInterface | undefined {
    return this.providers.get(type);
  }

  hasProvider(type: AIProviderType): boolean {
    return this.providers.has(type);
  }

  setDefaultChatProvider(type: AIProviderType): void {
    this.defaultChatProvider = type;
  }

  setDefaultEmbeddingProvider(type: AIProviderType): void {
    this.defaultEmbeddingProvider = type;
  }

  /** Set the dedicated Chat-role provider instance (null = role disabled). */
  setChatProviderInstance(provider: AIProviderInterface | null): void {
    this.chatProviderInstance = provider;
  }

  /** Set the dedicated Embedding-role provider instance (null = role disabled). */
  setEmbeddingProviderInstance(provider: AIProviderInterface | null): void {
    this.embeddingProviderInstance = provider;
  }

  getChatProviderInstance(): AIProviderInterface | null {
    return this.chatProviderInstance;
  }

  getEmbeddingProviderInstance(): AIProviderInterface | null {
    return this.embeddingProviderInstance;
  }

  getRegisteredProviders(): AIProviderType[] {
    return Array.from(this.providers.keys());
  }

  async getAvailableProviders(): Promise<AIProviderType[]> {
    const available: AIProviderType[] = [];

    for (const [type, provider] of this.providers.entries()) {
      try {
        if (provider.isEnabled() && await provider.isAvailable()) {
          available.push(type);
        }
      } catch {
        continue;
      }
    }

    return available;
  }

  async selectChatProvider(
    preferred?: AIProviderType
  ): Promise<AIProviderInterface | null> {
    // The user's explicitly configured Chat instance wins. Don't gate on
    // isAvailable() (a GET /models probe) — many custom endpoints don't expose
    // it; the actual chat call is the real check.
    if (!preferred && this.chatProviderInstance) {
      return this.chatProviderInstance.hasChatCapability() ? this.chatProviderInstance : null;
    }

    if (preferred) {
      const provider = this.getProvider(preferred);
      if (provider && provider.hasChatCapability()) {
        try {
          if (await provider.isAvailable()) {
            return provider;
          }
        } catch {
          // Continue to fallback
        }
      }
    }

    if (this.defaultChatProvider) {
      const provider = this.getProvider(this.defaultChatProvider);
      if (provider && provider.hasChatCapability()) {
        try {
          if (await provider.isAvailable()) {
            return provider;
          }
        } catch {
          // Continue to fallback
        }
      }
    }

    if (this.autoFallback) {
      return this.selectProviderByFallback('chat');
    }

    return null;
  }

  async selectEmbeddingProvider(
    preferred?: AIProviderType
  ): Promise<AIProviderInterface | null> {
    // The user's explicitly configured Embedding instance wins (independent of
    // the Chat instance, even when both are the same provider type).
    if (!preferred && this.embeddingProviderInstance) {
      return this.embeddingProviderInstance.hasEmbeddingCapability() ? this.embeddingProviderInstance : null;
    }

    if (preferred) {
      const provider = this.getProvider(preferred);
      if (provider && provider.hasEmbeddingCapability()) {
        try {
          if (await provider.isAvailable()) {
            return provider;
          }
        } catch {
          // Continue to fallback
        }
      }
    }

    if (this.defaultEmbeddingProvider) {
      const provider = this.getProvider(this.defaultEmbeddingProvider);
      if (provider && provider.hasEmbeddingCapability()) {
        try {
          if (await provider.isAvailable()) {
            return provider;
          }
        } catch {
          // Continue to fallback
        }
      }
    }

    if (this.autoFallback) {
      return this.selectProviderByFallback('embedding');
    }

    return null;
  }

  private async selectProviderByFallback(
    modelType: AIModelType
  ): Promise<AIProviderInterface | null> {
    for (const type of this.fallbackOrder) {
      const provider = this.getProvider(type);
      if (!provider) continue;

      const hasCapability =
        modelType === 'chat'
          ? provider.hasChatCapability()
          : provider.hasEmbeddingCapability();

      if (!hasCapability) continue;

      try {
        if (await provider.isAvailable()) {
          return provider;
        }
      } catch {
        continue;
      }
    }

    return null;
  }

  async chat(
    request: AIChatRequest,
    preferredProvider?: AIProviderType
  ): Promise<AIChatResponse> {
    const provider = await this.selectChatProvider(preferredProvider);

    if (!provider) {
      throw new Error('No available chat provider found');
    }

    return provider.chat(request);
  }

  async chatWithFallback(
    request: AIChatRequest,
    preferredProviders?: AIProviderType[]
  ): Promise<AIChatResponse> {
    const providersToTry = preferredProviders || this.fallbackOrder;

    for (const type of providersToTry) {
      const provider = await this.selectChatProvider(type);
      if (!provider) continue;

      try {
        return await provider.chat(request);
      } catch (error) {
        console.warn(`Chat failed with provider ${type}:`, error);
        continue;
      }
    }

    throw new Error('All chat providers failed');
  }

  async embedding(
    request: AIEmbeddingRequest,
    preferredProvider?: AIProviderType
  ): Promise<AIEmbeddingResponse> {
    const provider = await this.selectEmbeddingProvider(preferredProvider);

    if (!provider) {
      throw new Error('No available embedding provider found');
    }

    return provider.embedding(request);
  }

  async embeddingWithFallback(
    request: AIEmbeddingRequest,
    preferredProviders?: AIProviderType[]
  ): Promise<AIEmbeddingResponse> {
    const providersToTry = preferredProviders || this.fallbackOrder;

    for (const type of providersToTry) {
      const provider = await this.selectEmbeddingProvider(type);
      if (!provider) continue;

      try {
        return await provider.embedding(request);
      } catch (error) {
        console.warn(`Embedding failed with provider ${type}:`, error);
        continue;
      }
    }

    throw new Error('All embedding providers failed');
  }

  async testAllProviders(): Promise<AITestResult[]> {
    const results: AITestResult[] = [];

    for (const [type, provider] of this.providers.entries()) {
      if (!provider.isEnabled()) continue;

      try {
        const chatResult = await provider.testConnection('chat');
        results.push(chatResult);

        if (provider.hasEmbeddingCapability()) {
          const embeddingResult = await provider.testConnection('embedding');
          results.push(embeddingResult);
        }
      } catch (error) {
        results.push({
          success: false,
          provider: type,
          modelType: 'chat',
          error: error instanceof Error ? error.message : 'Test failed',
        });
      }
    }

    return results;
  }

  updateProviderConfig(
    type: AIProviderType,
    config: Partial<AIProviderConfig>
  ): boolean {
    const provider = this.getProvider(type);
    if (!provider) return false;

    if (provider instanceof BaseAIProvider) {
      provider.updateConfig(config);
      return true;
    }

    return false;
  }

  enableProvider(type: AIProviderType): boolean {
    return this.updateProviderConfig(type, { enabled: true });
  }

  disableProvider(type: AIProviderType): boolean {
    return this.updateProviderConfig(type, { enabled: false });
  }

  getFallbackOrder(): AIProviderType[] {
    return [...this.fallbackOrder];
  }

  setFallbackOrder(order: AIProviderType[]): void {
    this.fallbackOrder = order;
  }

  isAutoFallbackEnabled(): boolean {
    return this.autoFallback;
  }

  setAutoFallback(enabled: boolean): void {
    this.autoFallback = enabled;
  }
}

export const aiProviderManager = new AIProviderManager();