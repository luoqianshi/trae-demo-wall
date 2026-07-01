import { create } from 'zustand'
import type { Person, Memory, DiaryEntry } from '../types'
import {
  personRepository,
  memoryRepository,
  diaryRepository,
} from '../repositories'
import { dataSyncService, onDataChange } from '../services'
import { db } from '../lib/db'
import { guardWrite } from '../lib/demoGuard'

interface DataState {
  persons: Person[]
  memories: Memory[]
  diaries: DiaryEntry[]
  pendingMemories: Memory[]
  loading: boolean
  hasDemoData: boolean

  loadPersons: () => Promise<void>
  loadMemories: () => Promise<void>
  loadDiaries: () => Promise<void>
  loadPendingMemories: () => Promise<void>
  addPerson: (person: Partial<Person>) => Promise<void>
  updatePerson: (id: string, person: Partial<Person>) => Promise<void>
  addMemory: (memory: Omit<Memory, 'id' | 'createdAt'>) => Promise<void>
  addDiary: (entry: Omit<DiaryEntry, 'id' | 'timestamp'>) => Promise<void>
  confirmMemory: (id: string) => Promise<void>
  ignoreMemory: (id: string) => Promise<void>
  clearDemoData: () => Promise<void>
  hasRealPersons: () => boolean
}

export const useDataStore = create<DataState>((set, get) => {
  // 当 Service 层写入数据时，自动刷新对应 UI 状态
  onDataChange('person:changed', () => get().loadPersons())
  onDataChange('memory:changed', () => {
    get().loadMemories()
    get().loadPendingMemories()
  })
  onDataChange('diary:changed', () => get().loadDiaries())

  return {
    persons: [],
    memories: [],
    diaries: [],
    pendingMemories: [],
    loading: false,
    hasDemoData: false,

    loadPersons: async () => {
      set({ loading: true })
      const all = await personRepository.getAll()
      set({ persons: all, hasDemoData: all.some((p) => p.isDemo), loading: false })
    },

    loadMemories: async () => {
      set({ loading: true })
      const all = await memoryRepository.getAll()
      set({ memories: all.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 50), hasDemoData: all.some((m) => m.isDemo), loading: false })
    },

    loadDiaries: async () => {
      set({ loading: true })
      const all = await diaryRepository.getAll()
      set({ diaries: all.slice().sort((a, b) => b.timestamp - a.timestamp).slice(0, 50), hasDemoData: all.some((d) => d.isDemo), loading: false })
    },

    loadPendingMemories: async () => {
      set({ loading: true })
      const all = await memoryRepository.getPending()
      set({ pendingMemories: all.slice().sort((a, b) => b.createdAt - a.createdAt).slice(0, 20), loading: false })
    },

    addPerson: async (person) => {
      await dataSyncService.savePerson(person)
    },

    updatePerson: async (id, updates) => {
      await dataSyncService.updatePerson(id, updates)
    },

    addMemory: async (memory) => {
      await dataSyncService.saveMemory(memory)
    },

    addDiary: async (entry) => {
      await dataSyncService.saveDiary(entry)
    },

    confirmMemory: async (id) => {
      await dataSyncService.updateMemory(id, { confirmed: true, confidence: 'high' })
    },

    ignoreMemory: async (id) => {
      await dataSyncService.deleteMemory(id)
    },

    clearDemoData: async () => {
      // Demo Guard: 演示模式下禁止清除示例数据
      guardWrite('清除示例数据')
      await db.persons.where('isDemo').equals(1).delete()
      await db.memories.where('isDemo').equals(1).delete()
      await db.diaries.where('isDemo').equals(1).delete()
      await db.interactions.where('isDemo').equals(1).delete()
      set({ hasDemoData: false })
      await get().loadPersons()
      await get().loadMemories()
      await get().loadDiaries()
      // 通知依赖 demo 数据的组件刷新（如主动提醒卡片）
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('hengzhou:demo-cleared'))
      }
    },

    hasRealPersons: () => {
      return get().persons.some((p) => !p.isDemo)
    },
  }
})
