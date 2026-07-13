import type { Task } from '@/features/task/task-api'

interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export type IngestionMode = 'none' | 'auto' | 'standard' | 'deep' | 'thinking-model' | 'event' | 'case' | 'opinion'
export type ResolvedIngestionMode = 'standard' | 'deep'

export interface KnowledgeBase {
  id: string
  name: string
  description?: string
  domain?: string
  projectId?: string
  embeddingModelId?: string
  documentCount?: number
  chunkCount?: number
  createTime?: string
  updateTime?: string
}

export interface Document {
  id: string
  kbId: string
  title: string
  fileType?: string
  filePath?: string
  fileSize?: number
  rawText?: string
  globalMetadata?: string
  status: 'pending' | 'parsed' | 'processing' | 'completed' | 'failed'
  ingestionMode?: IngestionMode
  resolvedIngestionMode?: ResolvedIngestionMode
  chunkCount?: number
  errorMessage?: string
  createTime?: string
  updateTime?: string
}

export interface Chunk {
  id: string
  docId: string
  kbId: string
  chunkIndex: number
  parentId?: string
  chunkLevel?: 'parent' | 'child' | string
  chunkText: string
  rawText?: string
  metadata?: string
  events?: string
  embedding?: string
  content?: string
  createTime?: string
  updateTime?: string
}

export interface KnowledgeBaseAddRequest {
  name: string
  description?: string
  domain?: string
  projectId?: string
  embeddingModelId?: string
}

export interface KnowledgeBaseUpdateRequest {
  id: string
  name?: string
  description?: string
  domain?: string
  projectId?: string
  embeddingModelId?: string
}

export interface KnowledgeBaseQueryRequest {
  current?: number
  pageSize?: number
  name?: string
  projectId?: string
  searchText?: string
}

export interface DocumentAddRequest {
  kbId: string
  title: string
  fileType?: string
  filePath?: string
  fileSize?: number
  rawText?: string
  ingestionMode?: IngestionMode
}

export interface DocumentQueryRequest {
  current?: number
  pageSize?: number
  kbId?: string
  title?: string
  status?: string
  searchText?: string
}

export interface ChunkQueryRequest {
  current?: number
  pageSize?: number
  docId?: string
  kbId?: string
  chunkLevel?: 'parent' | 'child'
}

export interface IngestDocumentRequest {
  kbId: string
  title: string
  content: string
  fileType: string
  ingestionMode?: IngestionMode
}

export interface UploadDocumentFileRequest {
  kbId: string
  title?: string
  file: File
  ingestionMode?: IngestionMode
}

export interface IngestUrlRequest {
  kbId: string
  url: string
  title?: string
  ingestionMode?: IngestionMode
}

export type IngestDouyinRequest = IngestUrlRequest

export interface CognitiveIngestResult {
  documentId: string
  chunkCount: number
  status: string
  metadata?: Record<string, unknown>
  resolvedIngestionMode?: ResolvedIngestionMode
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export const knowledgeBaseApi = {
  add: async (data: KnowledgeBaseAddRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/knowledgeBase/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  update: async (data: KnowledgeBaseUpdateRequest): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/knowledgeBase/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/knowledgeBase/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  get: async (id: string): Promise<KnowledgeBase> => {
    const response = await fetch(`${baseUrl}/knowledgeBase/get?id=${encodeURIComponent(id)}`)
    return parseResponse<KnowledgeBase>(response)
  },

  list: async (params: KnowledgeBaseQueryRequest): Promise<{ list: KnowledgeBase[]; total: number }> => {
    const response = await fetch(`${baseUrl}/knowledgeBase/list/page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await parseResponse<{ records: KnowledgeBase[]; total: number }>(response)
    return { list: data.records, total: data.total }
  },
}

export const documentApi = {
  add: async (data: DocumentAddRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/knowledge-document/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  update: async (data: { id: string; title?: string; status?: string; ingestionMode?: IngestionMode }): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/knowledge-document/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  updateContent: async (data: { id: string; rawText: string }): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/knowledge-document/updateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  ingest: async (data: { documentId: string; knowledgeBaseId: string }): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/knowledgeBase/ingest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: data.documentId }),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/knowledge-document/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  get: async (id: string): Promise<Document> => {
    const response = await fetch(`${baseUrl}/knowledge-document/get?id=${encodeURIComponent(id)}`)
    return parseResponse<Document>(response)
  },

  list: async (params: DocumentQueryRequest): Promise<{ list: Document[]; total: number }> => {
    const response = await fetch(`${baseUrl}/knowledge-document/list/page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await parseResponse<{ records: Document[]; total: number }>(response)
    return { list: data.records, total: data.total }
  },
}

export const chunkApi = {
  get: async (id: string): Promise<Chunk> => {
    const response = await fetch(`${baseUrl}/chunk/get?id=${encodeURIComponent(id)}`)
    return parseResponse<Chunk>(response)
  },

  list: async (params: ChunkQueryRequest): Promise<{ list: Chunk[]; total: number }> => {
    const response = await fetch(`${baseUrl}/chunk/list/page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await parseResponse<{ records: Chunk[]; total: number }>(response)
    return { list: data.records, total: data.total }
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/chunk/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },
}

export const ingestionApi = {
  ingestDocument: async (data: IngestDocumentRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/ingestion/document`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  uploadDocumentFile: async (data: UploadDocumentFileRequest): Promise<string> => {
    const formData = new FormData()
    formData.append('kbId', data.kbId)
    formData.append('file', data.file)
    if (data.title) {
      formData.append('title', data.title)
    }
    if (data.ingestionMode) {
      formData.append('ingestionMode', data.ingestionMode)
    }
    // 视频/音频转录耗时长（FFmpeg Whisper），设置 10 分钟超时
    const isMedia = data.file.type.startsWith('video/') || data.file.type.startsWith('audio/')
    const controller = new AbortController()
    const timeout = isMedia ? 600000 : undefined  // 视频 10 分钟，其他不设超时
    let timer: ReturnType<typeof setTimeout> | undefined
    if (timeout) {
      timer = setTimeout(() => controller.abort(), timeout)
    }
    try {
      const response = await fetch(`${baseUrl}/ingestion/upload`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
      })
      return parseResponse<string>(response)
    } finally {
      if (timer) clearTimeout(timer)
    }
  },

  uploadDocumentFileAsync: async (data: UploadDocumentFileRequest): Promise<Task> => {
    const formData = new FormData()
    formData.append('file', data.file)
    formData.append('kbId', data.kbId)
    if (data.title) formData.append('title', data.title)
    if (data.ingestionMode) formData.append('ingestionMode', data.ingestionMode)

    const response = await fetch(`${baseUrl}/ingestion/upload/async`, {
      method: 'POST',
      body: formData,
    })
    return parseResponse<Task>(response)
  },

  ingestUrl: async (data: IngestUrlRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/ingestion/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  ingestDouyinAsync: async (data: IngestDouyinRequest): Promise<Task> => {
    const response = await fetch(`${baseUrl}/ingestion/douyin/async`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<Task>(response)
  },

  ingestDouyin: async (data: IngestDouyinRequest): Promise<string> => {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 600000)
    try {
      const response = await fetch(`${baseUrl}/ingestion/douyin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
        signal: controller.signal,
      })
      return parseResponse<string>(response)
    } finally {
      clearTimeout(timer)
    }
  },

  cognitiveIngest: async (documentId: string, modelConfigId?: string, ingestionMode?: IngestionMode): Promise<Task> => {
    const response = await fetch(`${baseUrl}/ingestion/cognitive`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, modelConfigId: modelConfigId || '', ingestionMode: ingestionMode || '' }),
    })
    return parseResponse<Task>(response)
  },

  cognitiveIngestSync: async (documentId: string, modelConfigId?: string, ingestionMode?: IngestionMode): Promise<CognitiveIngestResult> => {
    const response = await fetch(`${baseUrl}/ingestion/cognitive/sync`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ documentId, modelConfigId: modelConfigId || '', ingestionMode: ingestionMode || '' }),
    })
    return parseResponse<CognitiveIngestResult>(response)
  },
}
