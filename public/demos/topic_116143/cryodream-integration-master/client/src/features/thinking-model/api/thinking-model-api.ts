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

export const thinkingModelApi = {
  list: () => apiClient.get<ThinkingModel[]>('/thinking-model/list').then(r => r.data),
  listActive: () => apiClient.get<ThinkingModel[]>('/thinking-model/list/active').then(r => r.data),
  listByKb: (kbId: string) => apiClient.get<ThinkingModel[]>('/thinking-model/list/by-kb', { params: { kbId } }).then(r => r.data),
  get: (id: string) => apiClient.get<ThinkingModel>('/thinking-model/get', { params: { id } }).then(r => r.data),
  extract: (rawText: string, modelConfigId?: string, kbId?: string) =>
    apiClient.post<ThinkingModel>('/thinking-model/extract', { rawText, modelConfigId, kbId }).then(r => r.data),
  toggle: (id: string, isActive: boolean) =>
    apiClient.post<boolean>('/thinking-model/toggle', { id, isActive }).then(r => r.data),
  delete: (id: string) =>
    apiClient.post<boolean>('/thinking-model/delete', { id }).then(r => r.data),
};
