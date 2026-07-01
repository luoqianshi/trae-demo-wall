import http from 'node:http'
import https from 'node:https'
import { URL } from 'node:url'
import fs from 'node:fs'
import path from 'node:path'
import { createAuthMiddleware } from './auth.mjs'
import { createRateLimiter } from './rateLimit.mjs'
import { logger } from './logger.mjs'
import { createZvecStore } from './zvecStore.mjs'

const PORT = Number(process.env.PORT || '3001')
const API_TOKEN = process.env.API_TOKEN || ''
const REQUIRE_AUTH = process.env.REQUIRE_AUTH === 'true'
const RATE_LIMIT_MAX = Number(process.env.RATE_LIMIT_MAX || '60')
const UPSTREAM_TIMEOUT_MS = Number(process.env.UPSTREAM_TIMEOUT_MS || '30000')
const ZVEC_DATA_DIR = process.env.ZVEC_DATA_DIR || './.zvec'
const ZVEC_EMBEDDING_DIMENSION = Number(process.env.ZVEC_EMBEDDING_DIMENSION || '2048')

const providers = {
  deepseek: {
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com/v1',
    apiKey: process.env.DEEPSEEK_API_KEY || '',
  },
  doubao: {
    baseURL: process.env.DOUBAO_BASE_URL || 'https://ark.cn-beijing.volces.com/api/v3',
    apiKey: process.env.DOUBAO_API_KEY || '',
  },
}

function logProviderConfig() {
  for (const [name, cfg] of Object.entries(providers)) {
    const masked = cfg.apiKey ? `${cfg.apiKey.slice(0, 8)}...${cfg.apiKey.slice(-4)}` : '(未配置)'
    logger.info('proxy.provider_config', { provider: name, baseURL: cfg.baseURL, key: masked })
  }
}
logProviderConfig()

const auth = createAuthMiddleware({ apiToken: API_TOKEN, requireAuth: REQUIRE_AUTH })
const rateLimit = createRateLimiter({ windowMs: 60000, max: RATE_LIMIT_MAX })

// Ensure the parent directory for the Zvec collection exists.
fs.mkdirSync(ZVEC_DATA_DIR, { recursive: true })
const zvecStore = createZvecStore({
  dataDir: path.resolve(ZVEC_DATA_DIR),
  dimension: ZVEC_EMBEDDING_DIMENSION,
})

function pickProvider(req) {
  const header = req.headers['x-provider']
  if (header === 'deepseek' || header === 'doubao') return header
  return 'deepseek'
}

function getClient(url) {
  return url.protocol === 'https:' ? https : http
}

function setCorsHeaders(res) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, x-provider, x-user-api-key, x-api-token'
  )
}

function sendJson(res, status, payload) {
  if (res.headersSent) return
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(payload))
}

function sendError(res, status, error, message) {
  sendJson(res, status, { error, message })
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = []
    req.on('data', (chunk) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const text = Buffer.concat(chunks).toString('utf-8')
        resolve(text ? JSON.parse(text) : {})
      } catch (err) {
        reject(err)
      }
    })
    req.on('error', reject)
  })
}

async function handleVectorRoutes(req, res, pathname) {
  try {
    if (pathname === '/api/vector/index' && req.method === 'POST') {
      const body = await readBody(req)
      await zvecStore.indexItem(body)
      return sendJson(res, 200, { ok: true })
    }

    if (pathname === '/api/vector/search' && req.method === 'POST') {
      const body = await readBody(req)
      const results = await zvecStore.search(body)
      return sendJson(res, 200, { results })
    }

    if (pathname === '/api/vector/tiered-search' && req.method === 'POST') {
      const body = await readBody(req)
      const results = await zvecStore.tieredSearch(body)
      return sendJson(res, 200, results)
    }

    if (pathname === '/api/vector/rebuild' && req.method === 'POST') {
      const body = await readBody(req)
      await zvecStore.rebuild(body.items || [])
      return sendJson(res, 200, { ok: true, count: await zvecStore.count() })
    }

    if (pathname === '/api/vector/clear' && req.method === 'POST') {
      await zvecStore.clear()
      return sendJson(res, 200, { ok: true })
    }

    if (pathname === '/api/vector/count' && req.method === 'GET') {
      return sendJson(res, 200, { count: await zvecStore.count() })
    }

    return sendError(res, 404, 'Not Found', `Unknown vector route: ${pathname}`)
  } catch (err) {
    logger.error('vector.route_error', { path: pathname, error: err.message })
    return sendError(res, 500, 'Vector Store Error', err.message)
  }
}

function handleProxy(req, res) {
  const providerName = pickProvider(req)
  const provider = providers[providerName]
  if (!provider) {
    return sendError(res, 400, 'Unknown provider', `Unknown provider: ${providerName}`)
  }

  const userKeyHeader = req.headers['x-user-api-key']
  const userKey = Array.isArray(userKeyHeader) ? userKeyHeader[0] : userKeyHeader
  const apiKey = typeof userKey === 'string' && userKey.trim().length > 0
    ? userKey.trim()
    : provider.apiKey

  const isDummy = !apiKey || apiKey.toLowerCase().startsWith('dummy') || apiKey === 'your-doubao-api-key' || apiKey === 'your-deepseek-api-key'
  if (isDummy) {
    return sendError(res, 401, 'API Key not configured', `API Key for ${providerName} is not configured or is a placeholder. Please set it in .env or pass x-user-api-key header.`)
  }

  // 前端通过 Vite proxy 或绝对路径调用 /api/*，转发到上游时需要去掉 /api 前缀
  // 注意：必须用相对路径（不以 / 开头）+ baseURL 带尾斜杠，否则绝对路径会覆盖 baseURL 的 path
  // 例如：new URL('/chat/completions', 'https://ark.cn-beijing.volces.com/api/v3') 会丢失 /api/v3
  const relativePath = req.url.replace(/^\/api\/?/, '') || ''
  const baseUrl = provider.baseURL.endsWith('/') ? provider.baseURL : provider.baseURL + '/'
  const target = new URL(relativePath, baseUrl)
  const client = getClient(target)

  const headers = { ...req.headers }
  headers.host = target.host
  headers.authorization = `Bearer ${apiKey}`
  delete headers['x-provider']
  delete headers['x-user-api-key']
  delete headers['x-api-token']
  delete headers['origin']
  delete headers['referer']

  const options = {
    method: req.method,
    hostname: target.hostname,
    port: target.port || (target.protocol === 'https:' ? 443 : 80),
    path: target.pathname + target.search,
    headers,
  }

  logger.info('proxy.request', {
    method: req.method,
    path: req.url,
    provider: providerName,
    ip: req.socket.remoteAddress,
  })

  const proxyReq = client.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode ?? 502, proxyRes.headers)
    proxyRes.pipe(res)
  })

  proxyReq.setTimeout(UPSTREAM_TIMEOUT_MS, () => {
    logger.error('proxy.timeout', { provider: providerName, path: req.url })
    proxyReq.destroy()
    sendError(res, 504, 'Gateway Timeout', '上游响应超时')
  })

  proxyReq.on('error', (err) => {
    logger.error('proxy.upstream_error', { provider: providerName, error: err.message })
    sendError(res, 502, 'Bad Gateway', err.message)
  })

  req.on('error', (err) => {
    logger.error('proxy.client_error', { error: err.message })
    proxyReq.destroy()
  })

  req.pipe(proxyReq)
}

function handleRequest(req, res) {
  setCorsHeaders(res)
  if (req.method === 'OPTIONS') {
    res.writeHead(204)
    res.end()
    return
  }

  const url = new URL(req.url, `http://${req.headers.host}`)

  auth(req, res, () =>
    rateLimit(req, res, () => {
      if (url.pathname.startsWith('/api/vector/')) {
        logger.info('vector.request', { path: url.pathname, method: req.method })
        return handleVectorRoutes(req, res, url.pathname)
      }
      return handleProxy(req, res)
    })
  )
}

const server = http.createServer(handleRequest)

server.listen(PORT, () => {
  logger.info('proxy.start', { port: PORT, providers: Object.keys(providers), zvec: ZVEC_DATA_DIR })
})
