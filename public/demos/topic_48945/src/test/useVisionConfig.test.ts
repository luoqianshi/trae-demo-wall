import { describe, expect, it } from 'vitest'
import {
  clearVisionConfigFromStorage,
  readVisionConfigFromStorage,
  writeVisionConfigToStorage,
} from '@/hooks/useVisionConfig'

function createStorage() {
  const store = new Map<string, string>()

  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, value)
    },
    removeItem: (key: string) => {
      store.delete(key)
    },
  }
}

describe('useVisionConfig helpers', () => {
  it('可读写并清除本地配置', () => {
    const storage = createStorage()

    writeVisionConfigToStorage(
      {
        baseUrl: 'https://api.example.com/v1/',
        apiKey: 'secret',
        model: 'vision-model',
      },
      storage,
    )

    expect(readVisionConfigFromStorage(storage)).toEqual({
      baseUrl: 'https://api.example.com/v1',
      apiKey: 'secret',
      model: 'vision-model',
    })

    clearVisionConfigFromStorage(storage)

    expect(readVisionConfigFromStorage(storage)).toEqual({
      baseUrl: '',
      apiKey: '',
      model: '',
    })
  })
})
