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

const OPENAI_DEFAULT_CHAT_MODELS = ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'];
const OPENAI_DEFAULT_EMBEDDING_MODELS = ['text-embedding-3-small', 'text-embedding-3-large', 'text-embedding-ada-002'];

const MODEL_CONTEXT_LENGTHS: Record<string, number> = {
  'gpt-4o': 128000,
  'gpt-4o-mini': 128000,
  'gpt-4-turbo': 128000,
  'gpt-4': 8192,
  'gpt-3.5-turbo': 16385,
};

const EMBEDDING_DIMENSIONS: Record<string, number> = {
  'text-embedding-3-small': 1536,
  'text-embedding-3-large': 3072,
  'text-embedding-ada-002': 1536,
};

export class OpenAIProvider extends BaseAIProvider {
  readonly name = 'OpenAI';
  readonly type: AIProviderType = 'openai';
  readonly capabilities: AIProviderCapabilities = {
    chat: true,
    embedding: true,
    maxContextLength: 128000,
    supportedModels: [...OPENAI_DEFAULT_CHAT_MODELS, ...OPENAI_DEFAULT_EMBEDDING_MODELS],
  };

  constructor(config: Partial<AIProviderConfig> = {}) {
    super({
      type: 'openai',
      enabled: config.enabled ?? true,
      apiKey: config.apiKey || '',
      chatModel: config.chatModel || 'gpt-4o-mini',
      embeddingModel: config.embeddingModel || 'text-embedding-3-small',
      timeout: config.timeout || 30,
      maxRetries: config.maxRetries || 3,
      ...config,
    });
  }

  // Read live from config so updateConfig()/applyConfig() take effect immediately.
  private get apiKey(): string {
    return this.config.apiKey || '';
  }

  // Base URL is configurable (BYOK / OpenAI-compatible endpoints); default to OpenAI.
  private get baseUrl(): string {
    return (this.config.baseUrl || 'https://api.openai.com/v1').replace(/\/+$/, '');
  }

  setApiKey(apiKey: string): void {
    this.updateConfig({ apiKey });
  }

  async isAvailable(): Promise<boolean> {
    if (!this.apiKey) return false;

    try {
      const response = await fetch(`${this.baseUrl}/models`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
      // Don't gate on GET /models — many OpenAI-compatible endpoints
      // (vLLM/SGLang, custom gateways) don't expose it. The actual chat /
      // embedding call below is the real connectivity + credential check.
      const model = modelType === 'embedding'
        ? this.getEmbeddingModel()
        : this.getChatModel();

      if (modelType === 'embedding') {
        const testResult = await this.embedding({ text: 'test connection' });
        return this.createSuccessResult('embedding', Date.now() - startTime, {
          model,
          dimensions: testResult.dimensions,
        });
      }

      // No maxTokens override: use the configured budget so reasoning models
      // have room to finish and return real content (5 tokens truncates them).
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

    const messages = request.messages.map(m => ({
      role: m.role,
      content: this.ensureContentLength(m.content, contextLength),
    }));

    const operation = async () => {
      const response = await this.withTimeout(
        fetch(`${this.baseUrl}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            messages,
            temperature: request.temperature ?? this.config.temperature ?? 0.7,
            max_tokens: request.maxTokens ?? this.config.maxTokens ?? 2048,
            top_p: request.maxTokens ? undefined : 1,
          }),
        }),
        timeout
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`OpenAI chat API error: ${errorMessage}`);
      }

      const data = (await response.json()) as {
        choices?: Array<{
          message?: { content?: string; reasoning_content?: string };
          finish_reason?: string;
        }>;
        model?: string;
        usage?: { prompt_tokens?: number; completion_tokens?: number };
      };

      // Reasoning models (DeepSeek-R1 & co. served via OpenAI-compatible
      // endpoints like vLLM/SGLang) put their answer in `content`, but when the
      // response is cut off mid-thought (finish_reason "length") `content` is
      // empty and only `reasoning_content` is populated — fall back to it so we
      // still surface something instead of an empty string.
      const message = data.choices?.[0]?.message;
      const content = message?.content || message?.reasoning_content || '';

      return {
        content,
        model: data.model || model,
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens,
        finishReason: data.choices?.[0]?.finish_reason,
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
    const startTime = Date.now();
    const model = request.model || this.getEmbeddingModel();
    const timeout = this.getTimeout(request.options);
    const maxRetries = this.getMaxRetries(request.options);
    const dimensions = EMBEDDING_DIMENSIONS[model] || 1536;

    const texts = typeof request.text === 'string' ? [request.text] : request.text;

    const operation = async () => {
      const response = await this.withTimeout(
        fetch(`${this.baseUrl}/embeddings`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model,
            input: texts,
          }),
        }),
        timeout
      );

      if (!response.ok) {
        const errorData = (await response.json().catch(() => null)) as {
          error?: { message?: string };
        } | null;
        const errorMessage = errorData?.error?.message || `HTTP ${response.status}`;
        throw new Error(`OpenAI embedding API error: ${errorMessage}`);
      }

      const data = (await response.json()) as {
        data?: Array<{ index: number; embedding: number[] }>;
        model?: string;
        usage?: { prompt_tokens?: number };
      };

      const embeddings = (data.data || [])
        .sort((a, b) => a.index - b.index)
        .map((item) => item.embedding);

      return {
        embeddings,
        model: data.model || model,
        dimensions: embeddings[0]?.length || dimensions,
        inputTokens: data.usage?.prompt_tokens,
        latency: Date.now() - startTime,
      };
    };

    const result = await this.withRetry(operation, maxRetries);

    this.recordUsage({
      provider: this.type,
      modelType: 'embedding',
      model: result.model,
      inputTokens: result.inputTokens || 0,
      requestCount: texts.length,
      timestamp: new Date().toISOString(),
    });

    return result;
  }
}

export const openaiProvider = new OpenAIProvider();