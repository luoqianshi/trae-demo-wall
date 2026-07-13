import { BaseAIProvider } from './BaseProvider';
import {
  AIProviderType,
  AIProviderCapabilities,
  AIProviderConfig,
  AIChatRequest,
  AIChatResponse,
  AIEmbeddingRequest,
  AIEmbeddingResponse,
  AITestResult,
  AIModelType,
} from '../types';

const CLAUDE_DEFAULT_CHAT_MODELS = ['claude-sonnet-4-20250514', 'claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'];

const MODEL_CONTEXT_LENGTHS: Record<string, number> = {
  'claude-sonnet-4-20250514': 200000,
  'claude-3-5-sonnet-20241022': 200000,
  'claude-3-haiku-20240307': 200000,
  'claude-3-opus-20240229': 200000,
};

export class ClaudeProvider extends BaseAIProvider {
  readonly name = 'Claude';
  readonly type: AIProviderType = 'claude';
  readonly capabilities: AIProviderCapabilities = {
    chat: true,
    embedding: false,
    maxContextLength: 200000,
    supportedModels: CLAUDE_DEFAULT_CHAT_MODELS,
  };

  private embeddingProvider?: BaseAIProvider;

  constructor(config: Partial<AIProviderConfig> = {}) {
    super({
      type: 'claude',
      enabled: config.enabled ?? true,
      apiKey: config.apiKey || '',
      chatModel: config.chatModel || 'claude-sonnet-4-20250514',
      timeout: config.timeout || 60,
      maxRetries: config.maxRetries || 3,
      ...config,
    });
  }

  // Read live from config so updateConfig()/applyConfig() take effect immediately.
  private get apiKey(): string {
    return this.config.apiKey || '';
  }

  // Base URL is configurable (BYOK / Anthropic-compatible endpoints); default to Anthropic.
  private get baseUrl(): string {
    return (this.config.baseUrl || 'https://api.anthropic.com').replace(/\/+$/, '');
  }

  setApiKey(apiKey: string): void {
    this.updateConfig({ apiKey });
  }

  setEmbeddingProvider(provider: BaseAIProvider): void {
    this.embeddingProvider = provider;
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/v1/models`, {
        method: 'GET',
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  async testConnection(modelType?: AIModelType): Promise<AITestResult> {
    const startTime = Date.now();

    if (!this.apiKey) {
      return this.createErrorResult(
        modelType || 'chat',
        'API key not configured',
        Date.now() - startTime
      );
    }

    try {
      // Don't gate on GET /models — the actual messages call below is the real
      // connectivity + credential check and works with compatible endpoints.
      const model = this.getChatModel();

      if (modelType === 'embedding') {
        if (!this.embeddingProvider) {
          return this.createErrorResult(
            'embedding',
            'Claude does not support embedding. Please configure an embedding provider.',
            Date.now() - startTime
          );
        }

        return this.embeddingProvider.testConnection('embedding');
      }

      // No maxTokens override: use the configured budget (5 truncates
      // reasoning models before they can emit content).
      const testResult = await this.chat({
        messages: [{ role: 'user', content: 'test connection' }],
      });

      return this.createSuccessResult('chat', Date.now() - startTime, {
        model,
        response: testResult.content.slice(0, 50),
        inputTokens: testResult.inputTokens,
        outputTokens: testResult.outputTokens,
      });
    } catch (error) {
      return this.createErrorResult(
        modelType || 'chat',
        error instanceof Error ? error : 'Connection test failed',
        Date.now() - startTime
      );
    }
  }

  async chat(request: AIChatRequest): Promise<AIChatResponse> {
    const startTime = Date.now();
    const model = request.model || this.getChatModel();
    const timeout = this.getTimeout(request.options);
    const maxRetries = this.getMaxRetries(request.options);
    const contextLength = MODEL_CONTEXT_LENGTHS[model] || this.capabilities.maxContextLength;

    const systemPrompt = request.messages.find(m => m.role === 'system')?.content;
    const userMessages = request.messages.filter(m => m.role !== 'system').map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: this.ensureContentLength(m.content, contextLength),
    }));

    const operation = async () => {
      const response = await this.withTimeout(
        fetch(`${this.baseUrl}/v1/messages`, {
          method: 'POST',
          headers: {
            'x-api-key': this.apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
            temperature: request.temperature ?? this.config.temperature ?? 0.7,
            system: systemPrompt,
            messages: userMessages.length > 0 ? userMessages : [{ role: 'user', content: '' }],
          }),
        }),
        timeout
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`Claude chat API error: ${errorMessage}`);
      }

      const data = (await response.json()) as {
        content?: Array<{ type?: string; text?: string }>;
        model?: string;
        usage?: { input_tokens?: number; output_tokens?: number };
        stop_reason?: string;
      };

      const content = (data.content ?? [])
        .filter((block) => block.type === 'text')
        .map((block) => block.text ?? '')
        .join('\n');

      return {
        content,
        model: data.model || model,
        inputTokens: data.usage?.input_tokens,
        outputTokens: data.usage?.output_tokens,
        finishReason: data.stop_reason,
        latency: Date.now() - startTime,
      };
    };

    const result = await this.withRetry(operation, maxRetries);

    this.recordUsage({
      provider: this.type,
      modelType: 'chat',
      model: result.model,
      inputTokens: result.inputTokens || 0,
      outputTokens: result.outputTokens || 0,
      totalTokens: (result.inputTokens || 0) + (result.outputTokens || 0),
      requestCount: 1,
      timestamp: new Date().toISOString(),
    });

    return result;
  }

  async embedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    if (!this.embeddingProvider) {
      throw new Error('Claude does not support embedding. Please configure an embedding provider (OpenAI or Ollama).');
    }

    return this.embeddingProvider.embedding(request);
  }

  hasEmbeddingCapability(): boolean {
    return this.embeddingProvider?.hasEmbeddingCapability() ?? false;
  }
}

export const claudeProvider = new ClaudeProvider();