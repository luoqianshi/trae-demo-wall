import Dexie, { type Table } from 'dexie'
import type { Person, Interaction, Memory, DiaryEntry, Conversation, AgentTask } from '../types'

export interface EmbeddingRecord {
  id?: number
  sourceType: 'memory' | 'diary' | 'person' | 'interaction'
  sourceId: string
  /** 嵌入向量，支持 number[] 或 ArrayBuffer 二进制格式（节省 75% 空间） */
  embedding: number[] | ArrayBuffer
  text: string // 原始文本（用于关键词匹配降级）
  createdAt: number
}

// 语义缓存记录 — 从 localStorage 迁移至 IndexedDB，解除 5MB 限制
export interface QueryCacheRecord {
  id?: number
  query: string
  /** 查询嵌入向量，以 ArrayBuffer 二进制格式存储（4KB vs 20-30KB JSON） */
  queryEmbedding: ArrayBuffer | null
  ragResult: unknown
  llmResponse: string
  timestamp: number
  hitCount: number
  method: 'semantic' | 'token'
}

// OPT-7: 知识图谱三元组（预留：GraphRAG 当前使用内存邻接表，此表供未来持久化扩展使用）
export interface KnowledgeTriple {
  id?: number
  subject: string    // 主体（如"王思亮"）
  relation: string   // 关系（如"空降于"）
  object: string     // 客体（如"运营部"）
  memoryId: string   // 来源记忆 ID
  createdAt: number
}

// ─── 二进制嵌入向量工具函数 ────────────────────────────────
// Float32Array → ArrayBuffer，节省 75% 存储空间（1024维: 4KB vs 20-30KB JSON）

/** 将 number[] 转换为 ArrayBuffer 二进制格式 */
export function float32ArrayToBuffer(arr: number[]): ArrayBuffer {
  return new Float32Array(arr).buffer
}

/** 将 ArrayBuffer 二进制格式转换回 number[] */
export function bufferToFloat32Array(buf: ArrayBuffer | number[]): number[] {
  if (Array.isArray(buf)) return buf
  return Array.from(new Float32Array(buf))
}

/** 判断 embedding 是否为 ArrayBuffer 二进制格式 */
export function isBinaryEmbedding(embedding: unknown): embedding is ArrayBuffer {
  return embedding instanceof ArrayBuffer
}

export class HengzhouDB extends Dexie {
  persons!: Table<Person>
  interactions!: Table<Interaction>
  memories!: Table<Memory>
  diaries!: Table<DiaryEntry>
  conversations!: Table<Conversation>
  embeddings!: Table<EmbeddingRecord>
  agentTasks!: Table<AgentTask>
  knowledgeGraph!: Table<KnowledgeTriple>
  queryCache!: Table<QueryCacheRecord>

  constructor() {
    super('hengzhou-db')
    this.version(1).stores({
      persons: 'id, name, relationship, updatedAt',
      interactions: '++id, timestamp, type, *participants',
      memories: 'id, type, confidence, confirmed, createdAt',
      diaries: 'id, timestamp, *tags',
      conversations: '++id, timestamp',
    })
    this.version(2).stores({
      persons: 'id, name, relationship, updatedAt',
      interactions: '++id, timestamp, type, *participants',
      memories: 'id, type, confidence, confirmed, createdAt',
      diaries: 'id, timestamp, *tags',
      conversations: '++id, timestamp',
      embeddings: '++id, sourceType, sourceId',
    })
    // v3: 企业级人物档案 + Agent任务表 + 扩展索引
    this.version(3).stores({
      persons: 'id, name, relationship, updatedAt, *tags, [profile.identity.currentCity]',
      interactions: '++id, timestamp, type, *participants',
      memories: 'id, type, confidence, confirmed, createdAt, *relatedPersonIds, *tags',
      diaries: 'id, timestamp, *tags',
      conversations: '++id, timestamp',
      embeddings: '++id, sourceType, sourceId',
      agentTasks: 'id, agentId, type, status, startedAt',
    })
    // v4: 为示例数据添加 isDemo 索引，确保「清除示例」功能可正常执行
    this.version(4).stores({
      persons: 'id, name, relationship, updatedAt, isDemo, *tags, [profile.identity.currentCity]',
      interactions: '++id, timestamp, type, isDemo, *participants',
      memories: 'id, type, confidence, confirmed, createdAt, isDemo, *relatedPersonIds, *tags',
      diaries: 'id, timestamp, isDemo, *tags',
      conversations: '++id, timestamp',
      embeddings: '++id, sourceType, sourceId',
      agentTasks: 'id, agentId, type, status, startedAt',
    })
    // v5: 添加 embeddings 复合索引 [sourceType+sourceId]，消除 Dexie 查询警告
    this.version(5).stores({
      persons: 'id, name, relationship, updatedAt, isDemo, *tags, [profile.identity.currentCity]',
      interactions: '++id, timestamp, type, isDemo, *participants',
      memories: 'id, type, confidence, confirmed, createdAt, isDemo, *relatedPersonIds, *tags',
      diaries: 'id, timestamp, isDemo, *tags',
      conversations: '++id, timestamp',
      embeddings: '++id, sourceType, sourceId, [sourceType+sourceId]',
      agentTasks: 'id, agentId, type, status, startedAt',
    })
    // v6: OPT-7 知识图谱表
    this.version(6).stores({
      persons: 'id, name, relationship, updatedAt, isDemo, *tags, [profile.identity.currentCity]',
      interactions: '++id, timestamp, type, isDemo, *participants',
      memories: 'id, type, confidence, confirmed, createdAt, isDemo, *relatedPersonIds, *tags',
      diaries: 'id, timestamp, isDemo, *tags',
      conversations: '++id, timestamp',
      embeddings: '++id, sourceType, sourceId, [sourceType+sourceId]',
      agentTasks: 'id, agentId, type, status, startedAt',
      knowledgeGraph: '++id, subject, relation, object, memoryId, createdAt',
    })
    // v7: 语义缓存迁移至 IndexedDB + 嵌入向量二进制存储
    this.version(7).stores({
      persons: 'id, name, relationship, updatedAt, isDemo, *tags, [profile.identity.currentCity]',
      interactions: '++id, timestamp, type, isDemo, *participants',
      memories: 'id, type, confidence, confirmed, createdAt, isDemo, *relatedPersonIds, *tags',
      diaries: 'id, timestamp, isDemo, *tags',
      conversations: '++id, timestamp',
      embeddings: '++id, sourceType, sourceId, [sourceType+sourceId]',
      agentTasks: 'id, agentId, type, status, startedAt',
      knowledgeGraph: '++id, subject, relation, object, memoryId, createdAt',
      queryCache: '++id, query, timestamp, method',
    })
  }
}

export const db = new HengzhouDB()
