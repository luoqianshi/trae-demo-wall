const store = new Map()

export function createRateLimiter(options = {}) {
  const windowMs = options.windowMs || 60000
  const max = options.max || 60

  return function rateLimitMiddleware(req, res, next) {
    const rawKey = req.socket.remoteAddress || req.headers['x-forwarded-for'] || 'unknown'
    const key = Array.isArray(rawKey) ? rawKey[0] : rawKey
    const now = Date.now()

    let record = store.get(key)
    if (!record || now > record.resetAt) {
      record = { count: 0, resetAt: now + windowMs }
    }
    record.count++
    store.set(key, record)

    const remaining = Math.max(0, max - record.count)
    res.setHeader('X-RateLimit-Limit', String(max))
    res.setHeader('X-RateLimit-Remaining', String(remaining))

    if (record.count > max) {
      res.writeHead(429, { 'Content-Type': 'application/json; charset=utf-8' })
      res.end(JSON.stringify({ error: 'Too Many Requests', retryAfter: Math.ceil((record.resetAt - now) / 1000) }))
      return
    }
    next()
  }
}
