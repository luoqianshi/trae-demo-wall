import { spawn, spawnSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { get } from 'node:http'
import { connect } from 'node:net'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { loadLocalEnv } from '../server/env.js'

const projectRoot = resolve(fileURLToPath(new URL('..', import.meta.url)))
const noOpen = process.argv.includes('--no-open') || process.env.NO_OPEN === '1'
const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm'
const healthMarker = 'guicun-miju'

function fail(message) {
  console.error(`\n[启动失败] ${message}`)
  process.exit(1)
}

function run(command, args, label) {
  console.log(`\n[启动器] ${label}`)
  const result = spawnSync(command, args, {
    cwd: projectRoot,
    env: process.env,
    stdio: 'inherit'
  })
  if (result.error || result.status !== 0) {
    fail(`${label}未完成。`)
  }
}

function newestMtime(path) {
  if (!existsSync(path)) return 0
  const stat = statSync(path)
  if (!stat.isDirectory()) return stat.mtimeMs
  return readdirSync(path).reduce(
    (latest, entry) => Math.max(latest, newestMtime(resolve(path, entry))),
    stat.mtimeMs
  )
}

function needsBuild() {
  const output = resolve(projectRoot, 'dist/index.html')
  if (!existsSync(output)) return true
  if (!existsSync(resolve(projectRoot, 'src/main.js'))) return false

  const outputTime = statSync(output).mtimeMs
  const sourceTime = Math.max(
    newestMtime(resolve(projectRoot, 'src')),
    newestMtime(resolve(projectRoot, 'index.html')),
    newestMtime(resolve(projectRoot, 'vite.config.js'))
  )
  return sourceTime > outputTime
}

function ensureBuild() {
  if (!needsBuild()) return
  if (!existsSync(resolve(projectRoot, 'package.json'))) {
    fail('发布包缺少 dist/index.html，请重新执行项目封装。')
  }
  if (!existsSync(resolve(projectRoot, 'node_modules/vite/package.json'))) {
    run(npmCommand, ['install'], '首次运行，正在安装项目依赖...')
  }
  run(npmCommand, ['run', 'build'], '正在生成最新游戏文件...')
}

function checkHealth(port) {
  return new Promise((resolveHealth) => {
    const request = get({
      hostname: '127.0.0.1',
      port,
      path: '/api/health',
      timeout: 700
    }, (response) => {
      let body = ''
      response.setEncoding('utf8')
      response.on('data', (chunk) => { body += chunk })
      response.on('end', () => {
        try {
          const data = JSON.parse(body)
          resolveHealth(response.statusCode === 200 && data.app === healthMarker)
        } catch {
          resolveHealth(false)
        }
      })
    })
    request.on('timeout', () => request.destroy())
    request.on('error', () => resolveHealth(false))
  })
}

function portInUse(port) {
  return new Promise((resolvePort) => {
    const socket = connect({ host: '127.0.0.1', port })
    socket.setTimeout(500)
    socket.once('connect', () => {
      socket.destroy()
      resolvePort(true)
    })
    socket.once('timeout', () => {
      socket.destroy()
      resolvePort(false)
    })
    socket.once('error', () => resolvePort(false))
  })
}

async function selectPort(preferredPort) {
  for (let port = preferredPort; port <= preferredPort + 20; port += 1) {
    if (await checkHealth(port)) return { port, alreadyRunning: true }
    if (!(await portInUse(port))) return { port, alreadyRunning: false }
  }
  fail(`端口 ${preferredPort}-${preferredPort + 20} 均不可用。`)
}

function openBrowser(url) {
  if (noOpen) return

  const commands = {
    win32: ['cmd', ['/c', 'start', '', url]],
    darwin: ['open', [url]],
    linux: ['xdg-open', [url]]
  }
  const [command, args] = commands[process.platform] || commands.linux
  const opener = spawn(command, args, { detached: true, stdio: 'ignore' })
  opener.once('error', () => {
    console.log(`[启动器] 无法自动打开浏览器，请手动访问 ${url}`)
  })
  opener.unref()
}

async function waitUntilReady(port, child) {
  for (let attempt = 0; attempt < 40; attempt += 1) {
    if (child.exitCode !== null) return false
    if (await checkHealth(port)) return true
    await new Promise((resolveWait) => setTimeout(resolveWait, 250))
  }
  return false
}

async function main() {
  const nodeMajor = Number.parseInt(process.versions.node.split('.')[0], 10)
  if (nodeMajor < 18) {
    fail(`当前 Node.js 版本为 ${process.versions.node}，请升级到 18 或更高版本。`)
  }

  loadLocalEnv(projectRoot)
  const preferredPort = Number.parseInt(process.env.PORT, 10) || 4173
  const selected = await selectPort(preferredPort)
  const url = `http://127.0.0.1:${selected.port}`

  if (selected.alreadyRunning) {
    console.log(`[启动器] 游戏已经运行：${url}`)
    openBrowser(url)
    return
  }

  ensureBuild()
  console.log(`\n[启动器] 正在启动诡村迷局...`)
  const server = spawn(process.execPath, ['server/index.js'], {
    cwd: projectRoot,
    env: { ...process.env, PORT: String(selected.port) },
    stdio: 'inherit'
  })

  const stopServer = () => {
    if (server.exitCode === null) server.kill('SIGTERM')
  }
  process.once('SIGINT', stopServer)
  process.once('SIGTERM', stopServer)

  if (!(await waitUntilReady(selected.port, server))) {
    stopServer()
    fail('本地服务未能在规定时间内启动。')
  }

  console.log(`[启动器] 游戏地址：${url}`)
  console.log('[启动器] 保持此窗口开启；关闭窗口即可停止游戏。')
  openBrowser(url)

  const exitCode = await new Promise((resolveExit) => {
    server.once('exit', (code) => resolveExit(code ?? 0))
  })
  process.exitCode = exitCode
}

main().catch((error) => fail(error?.message || '发生未知错误。'))
