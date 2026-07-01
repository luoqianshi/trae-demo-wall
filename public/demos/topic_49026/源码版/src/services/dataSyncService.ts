import {
  memoryRepository,
  personRepository,
  diaryRepository,
} from '../repositories'
import { indexingService } from './indexingService'
import type { Memory, Person, DiaryEntry } from '../types'

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9)
}

type DataChangeEvent = 'memory:changed' | 'person:changed' | 'diary:changed'

const listeners = new Map<DataChangeEvent, Set<() => void>>()

function emit(event: DataChangeEvent): void {
  listeners.get(event)?.forEach((cb) => {
    try {
      cb()
    } catch (e) {
      console.warn('[DataSyncService] listener error:', e)
    }
  })
}

export function onDataChange(
  event: DataChangeEvent,
  callback: () => void
): () => void {
  if (!listeners.has(event)) {
    listeners.set(event, new Set())
  }
  listeners.get(event)!.add(callback)
  return () => {
    listeners.get(event)?.delete(callback)
  }
}

export const dataSyncService = {
  // === Memory ===
  async saveMemory(memory: Omit<Memory, 'id' | 'createdAt'>): Promise<Memory> {
    const full: Memory = {
      ...memory,
      id: generateId(),
      createdAt: Date.now(),
    }
    await memoryRepository.add(full)
    await indexingService.indexMemory(full.id, full.content)
    emit('memory:changed')
    return full
  },

  async updateMemory(id: string, changes: Partial<Memory>): Promise<void> {
    await memoryRepository.update(id, changes)
    const updated = await memoryRepository.getById(id)
    if (updated) {
      await indexingService.indexMemory(updated.id, updated.content)
    }
    emit('memory:changed')
  },

  async deleteMemory(id: string): Promise<void> {
    await memoryRepository.delete(id)
    emit('memory:changed')
  },

  // === Person ===
  async savePerson(person: Partial<Person>): Promise<Person> {
    const now = Date.now()
    const id = generateId()
    const fullPerson: Person = {
      id,
      name: person.name || '未命名',
      relationship: person.relationship || 'other',
      sentiment: person.sentiment ?? 70,
      sentimentHistory: person.sentimentHistory || [],
      profile: person.profile || createDefaultProfile(person.name || '未命名'),
      timeline: person.timeline || [],
      connections: person.connections || [],
      traits: person.traits || [],
      tags: person.tags || [],
      interactionStats: person.interactionStats || {
        totalCount: 0,
        lastInteractionAt: now,
        avgSentiment: 70,
        topics: [],
      },
      createdAt: now,
      updatedAt: now,
    }
    await personRepository.add(fullPerson)
    await indexingService.indexPerson(
      fullPerson.id,
      fullPerson.name,
      fullPerson.traits,
      buildPersonProfileText(fullPerson)
    )
    emit('person:changed')
    return fullPerson
  },

  async updatePerson(id: string, changes: Partial<Person>): Promise<void> {
    await personRepository.update(id, { ...changes, updatedAt: Date.now() })
    const person = await personRepository.getById(id)
    if (person) {
      await indexingService.indexPerson(
        person.id,
        person.name,
        person.traits,
        buildPersonProfileText(person)
      )
    }
    emit('person:changed')
  },

  async deletePerson(id: string): Promise<void> {
    await personRepository.delete(id)
    emit('person:changed')
  },

  // === Diary ===
  async saveDiary(entry: Omit<DiaryEntry, 'id' | 'timestamp'>): Promise<DiaryEntry> {
    const full: DiaryEntry = {
      ...entry,
      id: generateId(),
      timestamp: Date.now(),
    }
    await diaryRepository.add(full)
    await indexingService.indexDiary(full.id, full.content)
    emit('diary:changed')
    return full
  },

  async updateDiary(id: string, changes: Partial<DiaryEntry>): Promise<void> {
    await diaryRepository.update(id, changes)
    const updated = await diaryRepository.getById(id)
    if (updated) {
      await indexingService.indexDiary(updated.id, updated.content)
    }
    emit('diary:changed')
  },

  async deleteDiary(id: string): Promise<void> {
    await diaryRepository.delete(id)
    emit('diary:changed')
  },
}

function buildPersonProfileText(person: Person): string {
  const identity = person.profile?.identity
  const career = person.profile?.career
  const personality = person.profile?.personality
  return [
    person.name,
    person.traits?.join(' ') || '',
    identity?.nicknames?.join(' ') || '',
    career?.title || '',
    personality?.mbti || '',
  ]
    .join(' ')
    .trim()
}

function createDefaultProfile(name: string): Person['profile'] {
  return {
    identity: {
      fullName: name,
      nicknames: [],
      gender: undefined,
      age: undefined,
      birthday: undefined,
      zodiac: undefined,
      hometown: undefined,
      currentCity: undefined,
    },
    career: {
      company: undefined,
      title: undefined,
      department: undefined,
      industry: undefined,
      workStyle: undefined,
      strengths: [],
      weaknesses: [],
      careerHistory: [],
    },
    personality: {
      openness: 50,
      conscientiousness: 50,
      extraversion: 50,
      agreeableness: 50,
      neuroticism: 50,
      mbti: undefined,
      description: '',
    },
    preferences: {
      likes: [],
      dislikes: [],
      allergies: [],
      dietary: [],
      hobbies: [],
      communicationStyle: '',
    },
    values: {
      coreValues: [],
      motivations: [],
      fears: [],
      goals: [],
    },
    socialRole: {
      roleInMyLife: '',
      myRoleInTheirLife: '',
      powerDynamic: 'equal',
      trustLevel: 50,
      intimacyLevel: 50,
    },
    sharedExperiences: [],
  }
}
