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

const OLLAMA_DEFAULT_BASE_URL = 'http://localhost:11434';

const OLLAMA_DEFAULT_CHAT_MODELS = [
  'llama3.2',
  'llama3.1',
  'llama3',
  'llama2',
  'mistral',
  'qwen2.5',
  'qwen2',
  'deepseek-r1',
];

const OLLAMA_DEFAULT_EMBEDDING_MODELS = [
  'nomic-embed-text',
  'mxbai-embed-large',
  'all-minilm',
];

export class OllamaProvider extends BaseAIProvider {
  readonly name = 'Ollama';
  readonly type: AIProviderType = 'ollama';
  readonly capabilities: AIProviderCapabilities = {
    chat: true,
    embedding: true,
    maxContextLength: 4096,
    supportedModels: [...OLLAMA_DEFAULT_CHAT_MODELS, ...OLLAMA_DEFAULT_EMBEDDING_MODELS],
  };

  constructor(config: Partial<AIProviderConfig> = {}) {
    super({
      type: 'ollama',
      enabled: true,
      baseUrl: config.baseUrl || OLLAMA_DEFAULT_BASE_URL,
      chatModel: config.chatModel || 'llama3.2',
      embeddingModel: config.embeddingModel || 'nomic-embed-text',
      timeout: config.timeout || 60,
      maxRetries: config.maxRetries || 3,
      ...config,
    });
  }

  // Read live from config so updateConfig()/applyConfig() take effect immediately.
  private get baseUrl(): string {
    return (this.config.baseUrl || OLLAMA_DEFAULT_BASE_URL).replace(/\/+$/, '');
  }

  async isAvailable(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
      });

      if (!response.ok) return false;

      const data = (await response.json()) as { models?: unknown };
      return Array.isArray(data.models);
    } catch {
      return false;
    }
  }

  async testConnection(modelType?: AIModelType): Promise<AITestResult> {
    const startTime = Date.now();

    try {
      const isAvailable = await this.isAvailable();
      if (!isAvailable) {
        return this.createErrorResult(
          modelType || 'chat',
          'Ollama server is not available',
          Date.now() - startTime
        );
      }

      const model = modelType === 'embedding'
        ? this.getEmbeddingModel()
        : this.getChatModel();

      const modelAvailable = await this.checkModelAvailability(model);

      if (!modelAvailable) {
        return this.createErrorResult(
          modelType || 'chat',
          `Model ${model} is not available`,
          Date.now() - startTime
        );
      }

      if (modelType === 'embedding') {
        const testResult = await this.embedding({ text: 'test connection' });
        return this.createSuccessResult('embedding', Date.now() - startTime, {
          model,
          dimensions: testResult.dimensions,
        });
      }

      const testResult = await this.chat({
        messages: [{ role: 'user', content: 'test connection' }],
        maxTokens: 5,
      });

      return this.createSuccessResult('chat', Date.now() - startTime, {
        model,
        response: testResult.content.slice(0, 50),
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

    const operation = async () => {
      const response = await this.withTimeout(
        fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            messages: request.messages.map(m => ({
              role: m.role,
              content: m.content,
            })),
            stream: false,
            options: {
              temperature: request.temperature ?? this.config.temperature ?? 0.7,
              num_predict: request.maxTokens ?? this.config.maxTokens ?? 2048,
            },
          }),
        }),
        timeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama chat API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        message?: { content?: string };
        model?: string;
        prompt_eval_count?: number;
        eval_count?: number;
        done_reason?: string;
      };

      return {
        content: data.message?.content || '',
        model: data.model || model,
        inputTokens: data.prompt_eval_count,
        outputTokens: data.eval_count,
        finishReason: data.done_reason,
        latency: Date.now() - startTime,
      };
    };

    const result = await this.withRetry(operation, maxRetries);

    if (result.inputTokens || result.outputTokens) {
      this.recordUsage({
        provider: this.type,
        modelType: 'chat',
        model: result.model,
        inputTokens: result.inputTokens || 0,
        outputTokens: result.outputTokens,
        totalTokens: (result.inputTokens || 0) + (result.outputTokens || 0),
        requestCount: 1,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  async embedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse> {
    const startTime = Date.now();
    const model = request.model || this.getEmbeddingModel();
    const timeout = this.getTimeout(request.options);
    const maxRetries = this.getMaxRetries(request.options);

    const texts = typeof request.text === 'string' ? [request.text] : request.text;

    const operation = async () => {
      const response = await this.withTimeout(
        fetch(`${this.baseUrl}/api/embeddings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model,
            input: texts,
          }),
        }),
        timeout
      );

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama embedding API error: ${response.status} - ${errorText}`);
      }

      const data = (await response.json()) as {
        embeddings?: number[][];
        embedding?: number[];
        model?: string;
        prompt_eval_count?: number;
      } | Array<{ embedding?: number[] } | number[]>;

      let embeddings: number[][];

      if (!Array.isArray(data) && data.embeddings && Array.isArray(data.embeddings)) {
        embeddings = data.embeddings;
      } else if (Array.isArray(data)) {
        embeddings = data.map((item) =>
          Array.isArray(item) ? item : item.embedding || []
        );
      } else if (data.embedding) {
        embeddings = [data.embedding];
      } else {
        throw new Error('Unexpected embedding response format');
      }

      const dimensions = embeddings[0]?.length || 0;

      return {
        embeddings,
        model: (Array.isArray(data) ? undefined : data.model) || model,
        dimensions,
        inputTokens: Array.isArray(data) ? undefined : data.prompt_eval_count,
        latency: Date.now() - startTime,
      };
    };

    const result = await this.withRetry(operation, maxRetries);

    if (result.inputTokens) {
      this.recordUsage({
        provider: this.type,
        modelType: 'embedding',
        model: result.model,
        inputTokens: result.inputTokens,
        requestCount: texts.length,
        timestamp: new Date().toISOString(),
      });
    }

    return result;
  }

  private async checkModelAvailability(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return false;

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      const models = data.models || [];

      return models.some(
        (m) => m.name === model || m.name.startsWith(`${model}:`)
      );
    } catch {
      return false;
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      if (!response.ok) return [];

      const data = (await response.json()) as { models?: Array<{ name: string }> };
      return (data.models || []).map((m) => m.name);
    } catch {
      return [];
    }
  }

  async pullModel(model: string): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/pull`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: model, stream: false }),
      });

      return response.ok;
    } catch {
      return false;
    }
  }

  setBaseUrl(baseUrl: string): void {
    this.updateConfig({ baseUrl });
  }
}

export const ollamaProvider = new OllamaProvider();