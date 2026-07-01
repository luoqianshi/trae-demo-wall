import { parseWeChatFile } from '../lib/wechatParser'
import { buildBatchMemoryExtractionPrompt } from '../lib/prompts'
import { chat } from '../lib/ai'
import { personRepository, memoryRepository } from '../repositories'
import { dataSyncService } from './dataSyncService'
import { buildNameToPersonMap, resolvePersonIds } from '../lib/memoryExtractor'
import type { Memory, Person } from '../types'

const CHUNK_SIZE = 50

export interface ChatImportOptions {
  createPersonIfMissing?: boolean
  defaultConfidence?: Memory['confidence']
}

export interface ChatImportProgress {
  stage: 'parsing' | 'extracting' | 'saving'
  current: number
  total: number
  detail: string
}

export interface ChatImportResult {
  chatsProcessed: number
  messagesProcessed: number
  personsMatched: number
  personsCreated: number
  memoriesCreated: number
  memoriesUpdated: number
}

interface ExtractedBatchMemory {
  type: Memory['type']
  content: string
  confidence: Memory['confidence']
  reason: string
  related_person_names?: string[]
}

export async function importWeChatChat(
  file: File,
  options: ChatImportOptions = {},
  onProgress?: (progress: ChatImportProgress) => void
): Promise<ChatImportResult> {
  const result: ChatImportResult = {
    chatsProcessed: 0,
    messagesProcessed: 0,
    personsMatched: 0,
    personsCreated: 0,
    memoriesCreated: 0,
    memoriesUpdated: 0,
  }

  reportProgress('parsing', 0, 1, '解析微信聊天记录文件', onProgress)

  const parseResult = await parseWeChatFile(file)
  if (parseResult.errors.length > 0) {
    console.error('[ChatImport] 解析失败:', parseResult.errors)
    throw new Error(`解析失败: ${parseResult.errors.join(', ')}`)
  }

  reportProgress('parsing', 1, 1, '解析完成', onProgress)

  const allPeople = await personRepository.getAll()
  const nameToPersonMap = buildNameToPersonMap(allPeople)
  const existingMemories = await memoryRepository.getAll()

  result.chatsProcessed = parseResult.chats.length
  result.messagesProcessed = parseResult.totalMessages

  for (const chatItem of parseResult.chats) {
    const contactPerson = await matchOrCreatePerson(
      chatItem.contactName,
      nameToPersonMap,
      options.createPersonIfMissing ?? false,
      result
    )

    const uniqueSenders = new Set(chatItem.messages.map((m) => m.sender))
    const senderPersonMap = new Map<string, Person | undefined>()
    for (const sender of uniqueSenders) {
      const person = await matchOrCreatePerson(
        sender,
        nameToPersonMap,
        options.createPersonIfMissing ?? false,
        result
      )
      senderPersonMap.set(sender, person)
    }

    const chunks = chunkMessages(chatItem.messages, CHUNK_SIZE)
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i]
      reportProgress(
        'extracting',
        i + 1,
        chunks.length,
        `从「${chatItem.contactName}」提取记忆 (${i + 1}/${chunks.length})`,
        onProgress
      )

      const prompt = buildBatchMemoryExtractionPrompt(
        chatItem.contactName,
        chunk.map((m) => ({ sender: m.sender, content: m.content, timestamp: m.timestamp }))
      )

      try {
        const response = await chat([
          { role: 'system', content: '你是一个信息提取专家，只输出合法的 JSON 数组。' },
          { role: 'user', content: prompt },
        ])

        const cleanJson = response.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
        const extractedMemories: ExtractedBatchMemory[] = JSON.parse(cleanJson)
        if (!Array.isArray(extractedMemories)) {
          console.warn('[ChatImport] LLM 输出不是数组，已跳过')
          continue
        }

        for (let j = 0; j < extractedMemories.length; j++) {
          const mem = extractedMemories[j]
          reportProgress(
            'saving',
            j + 1,
            extractedMemories.length,
            `保存「${chatItem.contactName}」的记忆 (${j + 1}/${extractedMemories.length})`,
            onProgress
          )

          const content = mem.content?.trim()
          if (!content) continue

          const relatedNames = [...new Set(mem.related_person_names || [])]
          const relatedPersonIds = resolvePersonIds(relatedNames, nameToPersonMap)

          if (contactPerson && !relatedPersonIds.includes(contactPerson.id)) {
            relatedPersonIds.push(contactPerson.id)
          }

          for (const msg of chunk) {
            const senderPerson = senderPersonMap.get(msg.sender)
            if (senderPerson && !relatedPersonIds.includes(senderPerson.id)) {
              relatedPersonIds.push(senderPerson.id)
            }
          }

          const confidence = mem.confidence || options.defaultConfidence || 'medium'

          const similar = findSimilarMemory(content, existingMemories)
          if (similar && shouldUpdateMemory(similar, { ...mem, confidence })) {
            await dataSyncService.updateMemory(similar.id, {
              content,
              confidence,
              type: mem.type,
            })
            result.memoriesUpdated++
            const idx = existingMemories.findIndex((m) => m.id === similar.id)
            if (idx >= 0) {
              existingMemories[idx] = { ...similar, content, confidence, type: mem.type }
            }
          } else {
            const saved = await dataSyncService.saveMemory({
              type: mem.type,
              content,
              source: `wechat-import:${chatItem.contactName}`,
              confidence,
              confirmed: confidence === 'high',
              tags: [chatItem.contactName, mem.type].filter(Boolean),
              relatedPersonIds,
              relatedMemoryIds: [],
            })
            result.memoriesCreated++
            existingMemories.push(saved)
          }
        }
      } catch (e) {
        console.error(`[ChatImport] 提取失败 (${chatItem.contactName} 第 ${i + 1} 块):`, e)
      }
    }
  }

  return result
}

function reportProgress(
  stage: ChatImportProgress['stage'],
  current: number,
  total: number,
  detail: string,
  onProgress?: (progress: ChatImportProgress) => void
): void {
  onProgress?.({ stage, current, total, detail })
}

async function matchOrCreatePerson(
  name: string,
  nameToPersonMap: Map<string, Person>,
  createIfMissing: boolean,
  result: ChatImportResult
): Promise<Person | undefined> {
  if (!name || name === '我') return undefined

  const normalized = name.trim().toLowerCase()
  if (!normalized) return undefined

  let person = nameToPersonMap.get(normalized)
  if (!person) {
    for (const [key, p] of nameToPersonMap.entries()) {
      if (key.includes(normalized) || normalized.includes(key)) {
        person = p
        break
      }
    }
  }

  if (person) {
    result.personsMatched++
    return person
  }

  if (createIfMissing) {
    const created = await dataSyncService.savePerson({
      name: name.trim(),
      relationship: 'other',
    })
    nameToPersonMap.set(created.name.toLowerCase(), created)
    result.personsCreated++
    return created
  }

  return undefined
}

function chunkMessages<T>(messages: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < messages.length; i += size) {
    chunks.push(messages.slice(i, i + size))
  }
  return chunks
}

function findSimilarMemory(content: string, memories: Memory[]): Memory | undefined {
  const prefix = content.slice(0, 30)
  const exact = memories.find((m) => m.content.includes(prefix))
  if (exact) return exact

  const keywords = extractKeywords(content)
  if (keywords.length === 0) return undefined

  let bestMatch: Memory | undefined
  let bestScore = 0

  const recentMemories = memories
    .slice()
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 50)

  for (const mem of recentMemories) {
    const memKeywords = extractKeywords(mem.content)
    const overlap = keywords.filter((k) => memKeywords.includes(k)).length
    const score = overlap / Math.max(keywords.length, memKeywords.length)
    if (score > bestScore && score > 0.5) {
      bestScore = score
      bestMatch = mem
    }
  }

  return bestMatch
}

function shouldUpdateMemory(
  existing: Memory,
  newMem: { content: string; confidence: Memory['confidence'] }
): boolean {
  if (newMem.content.length > existing.content.length * 1.3) return true
  if (newMem.confidence === 'high' && existing.confidence !== 'high') return true
  return false
}

function extractKeywords(content: string): string[] {
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '上', '也', '很', '到', '说', '要', '去', '你', '会', '着', '看', '好', '自己', '这', '他', '她', '它', '吗', '吧', '啊', '呢', '把', '被', '让', '给', '对', '从', '还', '但', '而', '或', '如果', '因为', '所以', '可以', '没', '能', '想', '做', '觉得', '应该', '可能',
  ])
  return content
    .replace(/[^\u4e00-\u9fa5a-z0-9]/g, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 2 && !stopWords.has(w))
}
