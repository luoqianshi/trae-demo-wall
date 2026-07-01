/**
 * 请求队列 + 速率限制
 * 控制并发请求数和请求间隔，避免触发 API 限额
 */

interface QueueItem<T> {
  fn: () => Promise<T>
  resolve: (v: T) => void
  reject: (e: Error) => void
  retryCount: number
}

const MAX_CONCURRENT = 2        // 最大并发请求数
const MIN_INTERVAL_MS = 500     // 请求间最小间隔
const MAX_RETRIES = 2

export class RequestQueue {
  private queue: QueueItem<any>[] = []
  private running = 0
  private lastRequestTime = 0

  async enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject, retryCount: 0 })
      this.process()
    })
  }

  private async process() {
    if (this.running >= MAX_CONCURRENT || this.queue.length === 0) return

    // 速率限制：确保请求间隔
    const now = Date.now()
    const elapsed = now - this.lastRequestTime
    if (elapsed < MIN_INTERVAL_MS) {
      setTimeout(() => this.process(), MIN_INTERVAL_MS - elapsed)
      return
    }

    const item = this.queue.shift()!
    this.running++
    this.lastRequestTime = Date.now()

    try {
      const result = await item.fn()
      item.resolve(result)
    } catch (err) {
      if (item.retryCount < MAX_RETRIES) {
        item.retryCount++
        const delay = 1000 * item.retryCount
        setTimeout(() => {
          this.queue.unshift(item)
          this.process()
        }, delay)
      } else {
        item.reject(err instanceof Error ? err : new Error(String(err)))
      }
    } finally {
      this.running--
      this.process()
    }
  }

  get pendingCount(): number {
    return this.queue.length
  }

  get runningCount(): number {
    return this.running
  }
}

export const requestQueue = new RequestQueue()
