import { apiClient } from '@/lib/api-client';

export interface ThinkingModelToolSchema {
  name: string;
  description: string;
  parameters: {
    type: string;
    properties: Record<string, { type: string; description: string }>;
    required: string[];
  };
}

export interface ThinkingModel {
  id: string;
  kbId?: string;
  modelId: string;
  modelName: string;
  isActive: boolean;
  routingCategory: string;
  tags: string[];
  toolSchema: ThinkingModelToolSchema;
  executionPrompt: string;
  rawText: string;
  description: string;
  createTime: string;
  updateTime: string;
}

export type ToolCategory = 'thinking-model' | 'plugin' | 'external-api';

export interface ToolItem {
  id: string;
  type: ToolCategory;
  name: string;
  description: string;
  category: string;
  isActive: boolean;
  tags: string[];
  data: ThinkingModel;
}

export interface ThinkingModelExtractResult {
  isThinkingModel: boolean
  reason?: string
  extractId?: string
  preview?: {
    modelId: string
    modelName: string
    routingCategory: string
    isActive: boolean
    tags: string | string[]
    toolSchema: string | ThinkingModelToolSchema
    executionPrompt: string
    description: string
  }
}

export const thinkingModelApi = {
  list: () => apiClient.get<ThinkingModel[]>('/thinking-model/list').then(r => r.data),
  listActive: () => apiClient.get<ThinkingModel[]>('/thinking-model/list/active').then(r => r.data),
  listByKb: (kbId: string) => apiClient.get<ThinkingModel[]>('/thinking-model/list/by-kb', { params: { kbId } }).then(r => r.data),
  get: (id: string) => apiClient.get<ThinkingModel>('/thinking-model/get', { params: { id } }).then(r => r.data),
  extract: (rawText: string, modelConfigId?: string, kbId?: string) =>
    apiClient.post<ThinkingModel>('/thinking-model/extract', { rawText, modelConfigId, kbId }).then(r => r.data),
  /** 仅提取不保存，返回预览数据供确认 */
  extractOnly: (documentId: string, rawText: string, modelConfigId?: string) =>
    apiClient.post<ThinkingModelExtractResult>('/thinking-model/extract-only', { documentId, rawText, modelConfigId: modelConfigId || '' }).then(r => r.data),
  /** 确认保存 */
  confirmSave: (extractId: string) =>
    apiClient.post<ThinkingModel>('/thinking-model/confirm-save', { extractId }).then(r => r.data),
  toggle: (id: string, isActive: boolean) =>
    apiClient.post<boolean>('/thinking-model/toggle', { id, isActive }).then(r => r.data),
  delete: (id: string) =>
    apiClient.post<boolean>('/thinking-model/delete', { id }).then(r => r.data),
};

/** 安全解析后端返回的 JSON 字符串字段（tags/toolSchema 在数据库中存为 JSON 字符串） */
function safeParseJson<T>(value: T | string | null | undefined, fallback: T): T {
  if (value == null) return fallback
  if (typeof value === 'string') {
    try { return JSON.parse(value) } catch { return fallback }
  }
  return value
}

/** 将 ThinkingModel 转为统一的 ToolItem */
export function toToolItem(model: ThinkingModel): ToolItem {
  const tags = safeParseJson<string[]>(model.tags, [])
  const toolSchema = safeParseJson<ThinkingModelToolSchema>(model.toolSchema, null as any)
  return {
    id: model.id,
    type: 'thinking-model',
    name: model.modelName,
    description: toolSchema?.description || model.description || '',
    category: model.routingCategory || '未分类',
    isActive: model.isActive,
    tags,
    data: { ...model, tags, toolSchema },
  };
}
