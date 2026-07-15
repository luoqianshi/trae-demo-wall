import { generateNpcReply, NpcAiError, testAiConnection } from './npc-ai.js'
import { createAiProfileStore } from './ai-profiles.js'

const MAX_BODY_SIZE = 24 * 1024
const RATE_WINDOW_MS = 60 * 1000
const RATE_LIMIT = 20

function sendJson(response, status, payload) {
  response.statusCode = status
  response.setHeader('Content-Type', 'application/json; charset=utf-8')
  response.setHeader('Cache-Control', 'no-store')
  response.end(JSON.stringify(payload))
}

function sendApiError(response, error, fallbackMessage) {
  const knownError = error instanceof NpcAiError
  const status = knownError ? error.status : 500
  const code = knownError ? error.code : 'INTERNAL_ERROR'
  const message = knownError ? error.message : fallbackMessage
  if (!knownError) console.error('[npc-ai]', error)
  sendJson(response, status, { error: { code, message } })
}

async function readJsonBody(request) {
  let body = ''
  for await (const chunk of request) {
    body += chunk
    if (Buffer.byteLength(body) > MAX_BODY_SIZE) {
      throw new NpcAiError('BODY_TOO_LARGE', '请求内容过长。', 413)
    }
  }

  try {
    return JSON.parse(body || '{}')
  } catch {
    throw new NpcAiError('INVALID_JSON', '请求格式无效。', 400)
  }
}

function getClientId(request) {
  const forwarded = request.headers['x-forwarded-for']
  if (typeof forwarded === 'string' && forwarded) return forwarded.split(',')[0].trim()
  return request.socket?.remoteAddress || 'local'
}

export function createNpcChatHandler(options = {}) {
  const requestsByClient = new Map()

  function checkRateLimit(request) {
    const now = Date.now()
    const clientId = getClientId(request)
    const recent = (requestsByClient.get(clientId) || []).filter(
      (timestamp) => now - timestamp < RATE_WINDOW_MS
    )
    if (recent.length >= RATE_LIMIT) return false
    recent.push(now)
    requestsByClient.set(clientId, recent)
    return true
  }

  return async function npcChatHandler(request, response) {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST')
      sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } })
      return
    }

    if (!checkRateLimit(request)) {
      sendJson(response, 429, { error: { code: 'RATE_LIMITED', message: '对话过于频繁，请稍后再试。' } })
      return
    }

    try {
      const payload = await readJsonBody(request)
      const requestOptions = { ...options }
      if (options.profileStore) {
        requestOptions.config = options.profileStore.getActiveConfig()
        delete requestOptions.profileStore
      }
      const result = await generateNpcReply(payload, requestOptions)
      sendJson(response, 200, result)
    } catch (error) {
      sendApiError(response, error, 'AI 对话服务发生错误。')
    }
  }
}

export function createAiConfigHandler(profileStore) {
  return async function aiConfigHandler(request, response) {
    try {
      if (request.method === 'GET') {
        sendJson(response, 200, profileStore.getPublicState())
        return
      }
      if (request.method !== 'POST') {
        response.setHeader('Allow', 'GET, POST')
        sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 GET 或 POST 请求。' } })
        return
      }

      const payload = await readJsonBody(request)
      let state
      if (payload.action === 'save') {
        state = profileStore.saveProfile(payload.profile)
      } else if (payload.action === 'activate') {
        state = profileStore.activateProfile(payload.profileId)
      } else if (payload.action === 'delete') {
        state = profileStore.deleteProfile(payload.profileId)
      } else {
        throw new NpcAiError('INVALID_ACTION', '未知的配置操作。', 400)
      }
      sendJson(response, 200, state)
    } catch (error) {
      sendApiError(response, error, 'AI 配置服务发生错误。')
    }
  }
}

export function createAiTestHandler(profileStore, options = {}) {
  return async function aiTestHandler(request, response) {
    if (request.method !== 'POST') {
      response.setHeader('Allow', 'POST')
      sendJson(response, 405, { error: { code: 'METHOD_NOT_ALLOWED', message: '仅支持 POST 请求。' } })
      return
    }
    try {
      const payload = await readJsonBody(request)
      const config = profileStore.resolveTestConfig(payload.profile)
      const result = await testAiConnection(config, options)
      sendJson(response, 200, result)
    } catch (error) {
      sendApiError(response, error, 'AI 接口测试失败。')
    }
  }
}

export function npcAiVitePlugin(env, options = {}) {
  const profileStore = options.profileStore || createAiProfileStore({
    rootDirectory: options.rootDirectory || process.cwd(),
    filePath: env.AI_CONFIG_FILE || undefined,
    env
  })
  const chatHandler = createNpcChatHandler({ profileStore })
  const configHandler = createAiConfigHandler(profileStore)
  const testHandler = createAiTestHandler(profileStore)
  return {
    name: 'npc-ai-api',
    configureServer(server) {
      server.middlewares.use('/api/npc/chat', chatHandler)
      server.middlewares.use('/api/ai/config', configHandler)
      server.middlewares.use('/api/ai/test', testHandler)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/npc/chat', chatHandler)
      server.middlewares.use('/api/ai/config', configHandler)
      server.middlewares.use('/api/ai/test', testHandler)
    }
  }
}
