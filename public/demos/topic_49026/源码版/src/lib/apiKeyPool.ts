/**
 * API Key 轮换池
 * 支持配置多个 Key，自动轮换 + 故障标记 + 恢复
 * 解决单一 Key 限流后全线瘫痪的问题
 */

interface KeyState {
  key: string
  provider: 'doubao' | 'deepseek'
  failures: number
  rateLimitedUntil: number  // 限流恢复时间戳
  lastUsed: number
}

const COOLDOWN_MS = 60 * 1000  // 限流后冷却 1 分钟
const MAX_FAILURES = 3

export class ApiKeyPool {
  private keys: KeyState[] = []

  addKey(key: string, provider: 'doubao' | 'deepseek') {
    if (key && !this.keys.some(k => k.key === key)) {
      this.keys.push({ key, provider, failures: 0, rateLimitedUntil: 0, lastUsed: 0 })
    }
  }

  /** 获取下一个可用 Key */
  getAvailableKey(provider?: 'doubao' | 'deepseek'): KeyState | null {
    const now = Date.now()
    const candidates = this.keys.filter(k => {
      if (provider && k.provider !== provider) return false
      if (k.rateLimitedUntil > now) return false
      if (k.failures >= MAX_FAILURES) return false
      return true
    })
    if (candidates.length === 0) return null

    // 轮询选择最久未使用的
    candidates.sort((a, b) => a.lastUsed - b.lastUsed)
    const selected = candidates[0]
    selected.lastUsed = now
    return selected
  }

  markRateLimited(key: string) {
    const k = this.keys.find(k => k.key === key)
    if (k) {
      k.rateLimitedUntil = Date.now() + COOLDOWN_MS
      k.failures++
      console.warn(`[ApiKeyPool] Key ${key.slice(0, 8)}... 限流，冷却 ${COOLDOWN_MS / 1000}s`)
    }
  }

  markSuccess(key: string) {
    const k = this.keys.find(k => k.key === key)
    if (k) { k.failures = 0; k.rateLimitedUntil = 0 }
  }

  getStatus(): { total: number; available: number; rateLimited: number } {
    const now = Date.now()
    return {
      total: this.keys.length,
      available: this.keys.filter(k => k.rateLimitedUntil <= now && k.failures < MAX_FAILURES).length,
      rateLimited: this.keys.filter(k => k.rateLimitedUntil > now).length,
    }
  }
}

export const apiKeyPool = new ApiKeyPool()

/** 从 localStorage 加载所有 Key */
export function initApiKeyPool() {
  // 豆包 Key（支持多个，逗号分隔）
  const doubaoKeysStr = localStorage.getItem('hengzhou-doubao-api-keys')
  const doubaoKeys = doubaoKeysStr?.split(',').map(k => k.trim()).filter(Boolean) || []
  const doubaoSingle = localStorage.getItem('hengzhou-doubao-api-key')
  if (doubaoSingle && !doubaoKeys.includes(doubaoSingle)) doubaoKeys.push(doubaoSingle)
  doubaoKeys.forEach(k => apiKeyPool.addKey(k, 'doubao'))

  // DeepSeek Key
  const deepseekKey = localStorage.getItem('hengzhou-api-key')
  if (deepseekKey) apiKeyPool.addKey(deepseekKey, 'deepseek')
}
