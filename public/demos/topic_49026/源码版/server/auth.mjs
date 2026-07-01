import crypto from 'node:crypto'

function safeCompare(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string') return false
  if (a.length !== b.length) return false
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b))
  } catch {
    return false
  }
}

export function createAuthMiddleware(config) {
  const requiredToken = (config.apiToken || '').trim()
  const requireAuth = config.requireAuth === true || (requiredToken.length > 0 && config.requireAuth !== false)

  return function authMiddleware(req, res, next) {
    if (!requireAuth) return next()

    const header = req.headers['x-api-token']
    const token = Array.isArray(header) ? header[0] : header || ''
    if (safeCompare(token.trim(), requiredToken)) {
      return next()
    }

    res.writeHead(401, { 'Content-Type': 'application/json; charset=utf-8' })
    res.end(JSON.stringify({ error: 'Unauthorized', message: '缺少或错误的 x-api-token' }))
  }
}
