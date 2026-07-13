import { knowledgeBaseApi, documentApi, type KnowledgeBase, type Document } from '@/features/knowledge/api/knowledge-api'

// 知识库与文档下拉选项的内存缓存，供画布节点（如 KnowledgeBaseWriter 的 kb_id、
// DocumentLoader 的 document_id）以「显示名称、存 ID」的方式渲染下拉框。
let knowledgeBasesCache: KnowledgeBase[] = []
let documentsCache: Document[] = []

const isBrowser = () => typeof window !== 'undefined'

const KB_STORAGE_KEY = 'flow.knowledgeBases'

const readKbCacheFromStorage = (): KnowledgeBase[] => {
  if (!isBrowser()) return []
  try {
    const raw = window.localStorage.getItem(KB_STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as KnowledgeBase[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

const writeKbCacheToStorage = (list: KnowledgeBase[]) => {
  if (!isBrowser()) return
  try {
    window.localStorage.setItem(KB_STORAGE_KEY, JSON.stringify(list))
  } catch {
    // ignore quota / serialization errors
  }
}

if (knowledgeBasesCache.length === 0) {
  knowledgeBasesCache = readKbCacheFromStorage()
}

export const listKnowledgeBaseOptions = async (): Promise<KnowledgeBase[]> => {
  const { list } = await knowledgeBaseApi.list({ current: 1, pageSize: 200 })
  knowledgeBasesCache = list
  writeKbCacheToStorage(list)
  if (isBrowser()) {
    window.dispatchEvent(new CustomEvent('flow:knowledge-bases-changed'))
  }
  return list
}

export const getKnowledgeBaseSelectOptions = (): string[] => {
  return knowledgeBasesCache.map((kb) => kb.id)
}

export const getKnowledgeBaseDisplayName = (kbId: string): string => {
  if (!kbId) return ''
  const kb = knowledgeBasesCache.find((item) => item.id === kbId)
  if (!kb) return kbId
  return kb.domain ? `${kb.name}（${kb.domain}）` : kb.name
}

export const listDocumentOptions = async (kbId?: string): Promise<Document[]> => {
  const { list } = await documentApi.list({ current: 1, pageSize: 200, kbId })
  documentsCache = list
  return list
}

export const getDocumentSelectOptions = (): string[] => {
  return documentsCache.map((doc) => doc.id)
}

export const getDocumentDisplayName = (documentId: string): string => {
  if (!documentId) return ''
  const doc = documentsCache.find((item) => item.id === documentId)
  return doc ? doc.title : documentId
}
