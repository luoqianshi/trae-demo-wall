const ENCRYPTION_KEY = 'caijianji_secret_key'

function getStoredKey(): string {
  if (typeof window === 'undefined') return ''
  let key = localStorage.getItem(ENCRYPTION_KEY)
  if (!key) {
    key = generateSecureKey()
    localStorage.setItem(ENCRYPTION_KEY, key)
  }
  return key
}

function generateSecureKey(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const array = new Uint32Array(8)
    crypto.getRandomValues(array)
    return Array.from(array).map(b => b.toString(16).padStart(8, '0')).join('')
  }
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function xorEncryptDecrypt(text: string, key: string): string {
  let result = ''
  for (let i = 0; i < text.length; i++) {
    const textChar = text.charCodeAt(i)
    const keyChar = key.charCodeAt(i % key.length)
    result += String.fromCharCode(textChar ^ keyChar)
  }
  return result
}

export function encrypt(text: string): string {
  const key = getStoredKey()
  const encrypted = xorEncryptDecrypt(text, key)
  return btoa(encodeURIComponent(encrypted))
}

export function decrypt(encryptedText: string): string {
  const key = getStoredKey()
  try {
    const decoded = decodeURIComponent(atob(encryptedText))
    return xorEncryptDecrypt(decoded, key)
  } catch {
    return encryptedText
  }
}

export interface EncryptedData<T> {
  data: string
  expiresAt?: number
  createdAt: number
}

export function encryptObject<T>(obj: T): string {
  const data: EncryptedData<T> = {
    data: encrypt(JSON.stringify(obj)),
    createdAt: Date.now(),
  }
  return JSON.stringify(data)
}

export function decryptObject<T>(encrypted: string): T | null {
  try {
    const parsed: EncryptedData<T> = JSON.parse(encrypted)
    
    if (parsed.expiresAt && Date.now() > parsed.expiresAt) {
      return null
    }
    
    const decrypted = decrypt(parsed.data)
    return JSON.parse(decrypted) as T
  } catch {
    return null
  }
}