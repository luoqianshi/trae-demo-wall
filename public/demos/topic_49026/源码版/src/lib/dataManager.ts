import { db } from './db'
import { rebuildIndex } from './vectorStore'
import { isVectorServiceAvailable } from './zvecClient'
import { guardWrite } from './demoGuard'

export interface ExportData {
  version: string
  exportedAt: number
  persons: any[]
  memories: any[]
  diaries: any[]
  conversations: any[]
  embeddings: any[]
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0
}

function isArray(value: unknown): value is unknown[] {
  return Array.isArray(value)
}

/**
 * 对导入数据进行轻量 schema 校验
 * 不强制字段细节，但确保顶层结构正确且关键数组存在
 */
function validateExportData(data: unknown): ExportData {
  if (!data || typeof data !== 'object') {
    throw new Error('备份文件不是有效的 JSON 对象')
  }

  const record = data as Record<string, unknown>

  if (!isNonEmptyString(record.version)) {
    throw new Error('备份文件缺少 version 字段或格式不正确')
  }

  if (
    !isArray(record.persons) ||
    !isArray(record.memories) ||
    !isArray(record.diaries) ||
    !isArray(record.conversations)
  ) {
    throw new Error('备份文件缺少必要的数据数组（persons/memories/diaries/conversations）')
  }

  return {
    version: record.version,
    exportedAt: typeof record.exportedAt === 'number' ? record.exportedAt : Date.now(),
    persons: record.persons,
    memories: record.memories,
    diaries: record.diaries,
    conversations: record.conversations,
    embeddings: isArray(record.embeddings) ? record.embeddings : [],
  }
}

export async function exportAllData(): Promise<ExportData> {
  const [persons, memories, diaries, conversations, embeddings] = await Promise.all([
    db.persons.toArray(),
    db.memories.toArray(),
    db.diaries.toArray(),
    db.conversations.toArray(),
    db.embeddings.toArray(),
  ])

  return {
    version: '1.0',
    exportedAt: Date.now(),
    persons,
    memories,
    diaries,
    conversations,
    embeddings,
  }
}

export function downloadExport(data: ExportData): void {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `衡舟备份_${new Date().toISOString().slice(0, 10)}.json`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export async function importData(file: File): Promise<{ success: boolean; counts: Record<string, number> }> {
  const text = await file.text()
  let parsed: unknown

  try {
    parsed = JSON.parse(text)
  } catch (e) {
    throw new Error('备份文件不是有效的 JSON')
  }

  const data = validateExportData(parsed)

  // Demo Guard: 演示模式下禁止导入（会覆盖演示数据）
  guardWrite('导入备份数据')

  const counts: Record<string, number> = {}

  // 清空现有数据
  await Promise.all([
    db.persons.clear(),
    db.memories.clear(),
    db.diaries.clear(),
    db.conversations.clear(),
    db.embeddings.clear(),
  ])

  // 导入数据
  if (data.persons.length > 0) {
    await db.persons.bulkAdd(data.persons)
    counts.persons = data.persons.length
  }
  if (data.memories.length > 0) {
    await db.memories.bulkAdd(data.memories)
    counts.memories = data.memories.length
  }
  if (data.diaries.length > 0) {
    await db.diaries.bulkAdd(data.diaries)
    counts.diaries = data.diaries.length
  }
  if (data.conversations.length > 0) {
    await db.conversations.bulkAdd(data.conversations)
    counts.conversations = data.conversations.length
  }
  if (data.embeddings.length > 0) {
    // P1-4: 向量去重 — Zvec 后端可用时，跳过 IndexedDB embeddings 表写入
    // 向量数据由 Zvec 后端管理，IndexedDB 仅存元数据（text/sourceType/sourceId）
    const vectorAvailable = await isVectorServiceAvailable()
    if (vectorAvailable) {
      console.log('[Import] Zvec 后端可用，跳过 IndexedDB embeddings 表写入（向量去重）')
      // 仅存储不含 embedding 向量的元数据记录
      const metadataOnly = data.embeddings.map((e: any) => ({
        ...e,
        embedding: [], // 清空向量，仅保留元数据
      }))
      await db.embeddings.bulkAdd(metadataOnly)
    } else {
      await db.embeddings.bulkAdd(data.embeddings)
    }
    counts.embeddings = data.embeddings.length
  }

  // 如果导入的数据没有 embedding，异步重建向量索引
  if (data.embeddings.length === 0 && (data.persons.length > 0 || data.memories.length > 0 || data.diaries.length > 0)) {
    try {
      await rebuildIndex()
      console.log('[Import] 向量索引已重建')
    } catch (e) {
      console.warn('[Import] 向量索引重建失败:', e instanceof Error ? e.message : String(e))
    }
  }

  return { success: true, counts }
}
