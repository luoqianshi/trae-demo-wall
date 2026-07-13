export type AIProviderType = 'ollama' | 'openai' | 'claude';

export type AIModelType = 'chat' | 'embedding';

export type AITaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type AITaskType = 'summary' | 'tags' | 'keyPoints' | 'embedding';

export interface AIProviderConfig {
  type: AIProviderType;
  enabled: boolean;
  baseUrl?: string;
  apiKey?: string;
  chatModel?: string;
  embeddingModel?: string;
  timeout?: number;
  maxRetries?: number;
  // Global generation defaults (applied when a request doesn't override them).
  maxTokens?: number;
  temperature?: number;
}

export interface AIChatConfig {
  model: string;
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  systemPrompt?: string;
}

export interface AIEmbeddingConfig {
  model: string;
  dimensions?: number;
}

export interface AIProviderCapabilities {
  chat: boolean;
  embedding: boolean;
  maxContextLength: number;
  supportedModels: string[];
}

export interface AIUsageStats {
  provider: AIProviderType;
  modelType: AIModelType;
  model: string;
  inputTokens: number;
  outputTokens?: number;
  totalTokens?: number;
  requestCount: number;
  timestamp: string;
}

export interface AIRequestOptions {
  timeout?: number;
  maxRetries?: number;
  stream?: boolean;
}

export interface AIChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AIChatRequest {
  messages: AIChatMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  options?: AIRequestOptions;
}

export interface AIChatResponse {
  content: string;
  model: string;
  inputTokens?: number;
  outputTokens?: number;
  finishReason?: string;
  latency?: number;
}

export interface AIEmbeddingRequest {
  text: string | string[];
  model?: string;
  options?: AIRequestOptions;
}

export interface AIEmbeddingResponse {
  embeddings: number[][];
  model: string;
  dimensions: number;
  inputTokens?: number;
  latency?: number;
}

export interface AISummaryRequest {
  content: string;
  title?: string;
  maxLength?: number;
  style?: 'concise' | 'detailed' | 'bullet';
}

export interface AISummaryResponse {
  summary: string;
  inputTokens?: number;
  outputTokens?: number;
}

export interface AITagsRequest {
  content: string;
  title?: string;
  maxTags?: number;
  existingTags?: string[];
}

export interface AITagsResponse {
  tags: string[];
  inputTokens?: number;
  outputTokens?: number;
}

export interface AIKeyPointsRequest {
  content: string;
  title?: string;
  maxPoints?: number;
}

export interface AIKeyPointsResponse {
  keyPoints: string[];
  inputTokens?: number;
  outputTokens?: number;
}

export interface AITestResult {
  success: boolean;
  provider: AIProviderType;
  modelType: AIModelType;
  latency?: number;
  error?: string;
  details?: Record<string, unknown>;
}

export interface AIProviderInterface {
  readonly name: string;
  readonly type: AIProviderType;
  readonly capabilities: AIProviderCapabilities;

  isEnabled(): boolean;
  isAvailable(): Promise<boolean>;
  testConnection(modelType?: AIModelType): Promise<AITestResult>;
  chat(request: AIChatRequest): Promise<AIChatResponse>;
  embedding(request: AIEmbeddingRequest): Promise<AIEmbeddingResponse>;
  getUsageStats(): AIUsageStats[];
  hasChatCapability(): boolean;
  hasEmbeddingCapability(): boolean;
}

export interface AIProviderManagerConfig {
  providers: AIProviderConfig[];
  defaultChatProvider?: AIProviderType;
  defaultEmbeddingProvider?: AIProviderType;
  autoFallback: boolean;
  fallbackOrder: AIProviderType[];
}

export interface PromptTemplate {
  id: string;
  name: string;
  type: AITaskType;
  systemPrompt: string;
  userPromptTemplate: string;
  variables: string[];
  defaultValues: Record<string, unknown>;
}

export interface PromptTemplateConfig {
  summary: PromptTemplate;
  tags: PromptTemplate;
  keyPoints: PromptTemplate;
}