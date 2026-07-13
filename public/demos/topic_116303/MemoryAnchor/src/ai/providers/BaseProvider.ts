import {
  AIProviderType,
  AIProviderCapabilities,
  AIProviderConfig,
  AIChatRequest,
  AIChatResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AITestResult,
  AIUsageStats,
  AIModelType,
  AIProviderInterface,
} from '../types';

export abstract class BaseAIProvider implements AIProviderInterface {
  abstract readonly name: string;
  abstract readonly type: AIProviderType;
  abstract readonly capabilities: AIProviderCapabilities;

  protected config: AIProviderConfig;
  protected usageStats: AIUsageStats[] = [];
  protected maxUsageStatsEntries: number = 100;

  constructor(config: AIProviderConfig) {
    this.config = config;
  }

  updateConfig(config: Partial<AIProviderConfig>): void {
    this.config = { ...this.config, ...config };
  }

  getConfig(): AIProviderConfig {
    return { ...this.config };
  }

  abstract isAvailable(): Promise<boolean>;
  abstract testConnection(modelType?: AIModelType): Promise<AITestResult>;
  abstract chat(request: AIChatRequest): Promise<AIChatResponse>;
  abstract embedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;

  getUsageStats(): AIUsageStats[] {
    return [...this.usageStats];
  }

  clearUsageStats(): void {
    this.usageStats = [];
  }

  protected recordUsage(stats: AIUsageStats): void {
    this.usageStats.push(stats);

    if (this.usageStats.length > this.maxUsageStatsEntries) {
      this.usageStats = this.usageStats.slice(-this.maxUsageStatsEntries);
    }
  }

  protected getTimeout(options?: { timeout?: number }): number {
    return (options?.timeout || this.config.timeout || 30) * 1000;
  }

  protected getMaxRetries(options?: { maxRetries?: number }): number {
    return options?.maxRetries || this.config.maxRetries || 3;
  }

  protected async withTimeout<T>(
    promise: Promise<T>,
    timeoutMs: number
  ): Promise<T> {
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Request timeout after ${timeoutMs}ms`));
      }, timeoutMs);
    });

    return Promise.race([promise, timeoutPromise]);
  }

  protected async withRetry<T>(
    operation: () => Promise<T>,
    maxRetries: number,
    delayMs: number = 1000
  ): Promise<T> {
    let lastError: Error | undefined;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown error');

        if (attempt < maxRetries) {
          const exponentialDelay = delayMs * Math.pow(2, attempt);
          await this.delay(Math.min(exponentialDelay, 10000));
        }
      }
    }

    throw lastError ?? new Error('Operation failed after retries');
  }

  protected delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  protected createErrorResult(
    modelType: AIModelType,
    error: Error | string,
    latency?: number
  ): AITestResult {
    const errorMessage = error instanceof Error ? error.message : error;

    return {
      success: false,
      provider: this.type,
      modelType,
      latency,
      error: errorMessage,
    };
  }

  protected createSuccessResult(
    modelType: AIModelType,
    latency: number,
    details?: Record<string, unknown>
  ): AITestResult {
    return {
      success: true,
      provider: this.type,
      modelType,
      latency,
      details,
    };
  }

  protected validateConfig(): boolean {
    if (!this.config.enabled) return false;

    return true;
  }

  protected truncateContent(content: string, maxLength: number): string {
    if (content.length <= maxLength) return content;
    return content.slice(0, maxLength - 3) + '...';
  }

  protected ensureContentLength(
    content: string,
    maxContextLength: number,
    reservedTokens: number = 500
  ): string {
    const estimatedChars = (maxContextLength - reservedTokens) * 4;
    return this.truncateContent(content, estimatedChars);
  }

  getChatModel(): string {
    return this.config.chatModel || this.capabilities.supportedModels[0] || '';
  }

  getEmbeddingModel(): string {
    return (
      this.config.embeddingModel ||
      this.capabilities.supportedModels.find((m) => m.includes('embed')) ||
      ''
    );
  }

  hasChatCapability(): boolean {
    return this.capabilities.chat;
  }

  hasEmbeddingCapability(): boolean {
    return this.capabilities.embedding;
  }

  getBaseUrl(): string | undefined {
    return this.config.baseUrl;
  }

  getApiKey(): string | undefined {
    return this.config.apiKey;
  }

  isEnabled(): boolean {
    return this.config.enabled;
  }
}