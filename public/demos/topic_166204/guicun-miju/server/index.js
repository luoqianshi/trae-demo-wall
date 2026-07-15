import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import { createAiConfigHandler, createAiTestHandler, createNpcChatHandler } from './api.js'
import { createAiProfileStore } from './ai-profiles.js'
import { loadLocalEnv } from './env.js'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const distRoot = resolve(projectRoot, 'dist')
loadLocalEnv(projectRoot)

const profileStore = createAiProfileStore({
  rootDirectory: projectRoot,
  filePath: process.env.AI_CONFIG_FILE || undefined,
  env: process.env
})
const chatHandler = createNpcChatHandler({ profileStore })
const configHandler = createAiConfigHandler(profileStore)
const testHandler = createAiTestHandler(profileStore)
const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp'
}

function serveApp(request, response) {
  let pathname = '/'
  try {
    pathname = decodeURIComponent(new URL(request.url, 'http://localhost').pathname)
  } catch {
    response.writeHead(400).end('Bad Request')
    return
  }

  const requestedPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '')
  let filePath = resolve(distRoot, requestedPath)
  if (!filePath.startsWith(`${distRoot}${sep}`) && filePath !== distRoot) {
    response.writeHead(403).end('Forbidden')
    return
  }
  if (!existsSync(filePath) || !statSync(filePath).isFile()) {
    filePath = resolve(distRoot, 'index.html')
  }
  if (!existsSync(filePath)) {
    response.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
    response.end('dist/ 不存在，请先运行 npm run build。')
    return
  }

  response.writeHead(200, {
    'Content-Type': mimeTypes[extname(filePath)] || 'application/octet-stream',
    'Cache-Control': filePath.endsWith('index.html') ? 'no-cache' : 'public, max-age=31536000, immutable'
  })
  createReadStream(filePath).pipe(response)
}

const server = createServer((request, response) => {
  const pathname = new URL(request.url, 'http://localhost').pathname
  if (pathname === '/api/health') {
    response.writeHead(200, {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store'
    })
    response.end(JSON.stringify({ status: 'ok', app: 'guicun-miju' }))
    return
  }
  if (pathname === '/api/npc/chat') {
    chatHandler(request, response)
    return
  }
  if (pathname === '/api/ai/config') {
    configHandler(request, response)
    return
  }
  if (pathname === '/api/ai/test') {
    testHandler(request, response)
    return
  }
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    response.writeHead(405, { Allow: 'GET, HEAD' }).end()
    return
  }
  serveApp(request, response)
})

const port = Number.parseInt(process.env.PORT, 10) || 4173
const host = process.env.HOST || '127.0.0.1'
server.on('error', (error) => {
  if (error.code === 'EADDRINUSE') {
    console.error(`端口 ${port} 已被占用，请关闭占用程序后重试。`)
  } else {
    console.error('游戏服务启动失败：', error.message)
  }
  process.exitCode = 1
})
server.listen(port, host, () => {
  console.log(`诡村迷局已启动：http://127.0.0.1:${port}`)
})
