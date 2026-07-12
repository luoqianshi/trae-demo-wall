export interface EmojiItem {
  id: string
  name: string
  dataURL: string
  type: 'local' | 'network'
  fileType: 'jpg' | 'png' | 'gif'
  uploadTime: number
  featureVector?: number[]
}

const DB_NAME = 'FaceSearchDB'
const DB_VERSION = 1
const STORE_NAME = 'emojis'

let db: IDBDatabase | null = null

export const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    if (db) {
      resolve(db)
      return
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      db = request.result
      resolve(db)
    }

    request.onupgradeneeded = (event) => {
      const database = (event.target as IDBOpenDBRequest).result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' })
        store.createIndex('uploadTime', 'uploadTime', { unique: false })
        store.createIndex('name', 'name', { unique: false })
      }
    }
  })
}

export const getAllEmojis = async (): Promise<EmojiItem[]> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}

export const addEmoji = async (emoji: EmojiItem): Promise<void> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.add(emoji)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

export const addEmojis = async (emojis: EmojiItem[]): Promise<void> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    let completed = 0

    for (const emoji of emojis) {
      const request = store.add(emoji)
      request.onerror = () => {
        reject(request.error)
      }
      request.onsuccess = () => {
        completed++
        if (completed === emojis.length) {
          resolve()
        }
      }
    }
  })
}

export const deleteEmoji = async (id: string): Promise<void> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(id)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

export const clearAllEmojis = async (): Promise<void> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.clear()

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve()
    }
  })
}

export const getEmojiById = async (id: string): Promise<EmojiItem | undefined> => {
  const database = await openDB()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction([STORE_NAME], 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(id)

    request.onerror = () => {
      reject(request.error)
    }

    request.onsuccess = () => {
      resolve(request.result)
    }
  })
}