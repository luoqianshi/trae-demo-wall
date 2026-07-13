// AI Types
// Shared type definitions for AI-related data

/**
 * AI 提供商类型
 */
export type AIProviderType = 'openai' | 'claude' | 'ollama' | 'none';

/**
 * AI 任务状态
 */
export type AITaskStatus = 'pending' | 'processing' | 'completed' | 'failed';

/**
 * AI 任务类型
 */
export type AITaskType = 'summary' | 'tags' | 'keyPoints' | 'embedding';

/**
 * AI 任务
 */
export interface AITask {
  id: string;
  type: AITaskType;
  collectionId?: string;
  status: AITaskStatus;
  progress: number;
  result?: unknown;
  error?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * AI 生成摘要请求
 */
export interface GenerateSummaryInput {
  content: string;
  maxLength?: number;
}

/**
 * AI 生成摘要结果
 */
export interface GenerateSummaryResult {
  summary: string;
}

/**
 * AI 生成标签请求
 */
export interface GenerateTagsInput {
  content: string;
  maxTags?: number;
}

/**
 * AI 生成标签结果
 */
export interface GenerateTagsResult {
  tags: string[];
}

/**
 * AI 生成要点请求
 */
export interface GenerateKeyPointsInput {
  content: string;
  maxPoints?: number;
}

/**
 * AI 生成要点结果
 */
export interface GenerateKeyPointsResult {
  keyPoints: string[];
}

/**
 * AI 生成嵌入向量请求
 */
export interface GenerateEmbeddingInput {
  text: string;
}

/**
 * AI 生成嵌入向量结果
 */
export interface GenerateEmbeddingResult {
  embedding: number[];
}

/**
 * AI 连接测试结果
 */
export interface AITestConnectionResult {
  success: boolean;
  provider: AIProviderType;
  message: string;
  latency?: number;
}

/**
 * AI 服务状态
 */
export interface AIServiceStatus {
  provider: AIProviderType;
  available: boolean;
  model?: string;
  lastChecked: string;
}