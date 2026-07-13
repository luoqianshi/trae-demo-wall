// Spring Boot 后端 sidecar 管理
import { spawn, ChildProcess } from 'child_process'
import path from 'path'
import http from 'http'
import fsp from 'fs/promises'
import { app } from 'electron'

let backendProcess: ChildProcess | null = null
const BACKEND_PORT = 8111
const BACKEND_HOST = 'localhost'

/** 获取后端 URL */
export function getBackendUrl(): string {
  return `http://${BACKEND_HOST}:${BACKEND_PORT}`
}

/** 读取当前工作区路径（供 sidecar 启动时注入到 Spring Boot） */
async function readWorkspacePath(): Promise<string | null> {
  try {
    const configPath = path.join(app.getPath('userData'), 'workspace-config.json')
    const content = await fsp.readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return parsed?.current?.path ?? null
  } catch {
    return null
  }
}

/** 生成 Spring Boot 需要的 JVM/系统属性参数（工作区注入） */
async function buildWorkspaceProps(): Promise<string[]> {
  const workspacePath = await readWorkspacePath()
  if (!workspacePath) {
    console.log('[sidecar] 未检测到工作区，使用后端默认输出目录')
    return []
  }
  const canvasDir = path.join(workspacePath, 'canvas')
  const canvasInputsDir = path.join(workspacePath, 'canvas-inputs')
  console.log('[sidecar] 注入工作区路径:', workspacePath)
  return [
    `-Dcomfyui.output-dir=${canvasDir}`,
    `-Dcomfyui.input-cache-dir=${canvasInputsDir}`,
    `-Dworkspace.path=${workspacePath}`,
  ]
}

/** 检测后端是否已经就绪 */
export function isBackendReady(): Promise<boolean> {
  return new Promise((resolve) => {
    const req = http.get(
      `http://${BACKEND_HOST}:${BACKEND_PORT}/api/comfyui/list`,
      { timeout: 3000 },
      (res) => {
        resolve(res.statusCode !== undefined && res.statusCode < 500)
      }
    )
    req.on('error', () => resolve(false))
    req.on('timeout', () => {
      req.destroy()
      resolve(false)
    })
  })
}

/** 等待后端就绪，超时 60 秒 */
export async function waitForBackend(timeoutMs = 60000): Promise<boolean> {
  const startTime = Date.now()
  while (Date.now() - startTime < timeoutMs) {
    if (await isBackendReady()) return true
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }
  return false
}

/** 启动后端 */
export async function startSidecar(): Promise<boolean> {
  // 先检测后端是否已经在运行
  if (await isBackendReady()) {
    console.log('[sidecar] 后端已在运行，跳过启动')
    return true
  }

  const isDev = !!process.env.VITE_DEV_SERVER_URL || !app.isPackaged
  const workspaceProps = await buildWorkspaceProps()

  if (isDev) {
    // 开发模式：用 mvnw 启动
    const serviceDir = path.resolve(app.getAppPath(), '../service')
    console.log('[sidecar] 开发模式：启动 Spring Boot (mvnw)...', serviceDir)

    // 通过 mvnw 的 -Dspring-boot.run.jvmArguments 传递系统属性
    const mvnwArgs = ['/c', 'mvnw.cmd', 'spring-boot:run']
    if (workspaceProps.length > 0) {
      mvnwArgs.push(`-Dspring-boot.run.jvmArguments=${workspaceProps.join(' ')}`)
    }

    backendProcess = spawn('cmd.exe', mvnwArgs, {
      cwd: serviceDir,
      env: { ...process.env, JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8' },
      shell: false,
    })
  } else {
    // 生产模式：用 java -jar 启动
    const jarPath = path.join(process.resourcesPath, 'backend', 'template.jar')
    const javaPath = 'java' // 假设系统已安装 Java，或打包时带 JRE
    console.log('[sidecar] 生产模式：启动 Spring Boot (jar)...', jarPath)

    // 系统属性必须放在 -jar 之前
    const javaArgs = [...workspaceProps, '-jar', jarPath]

    backendProcess = spawn(javaPath, javaArgs, {
      env: { ...process.env, JAVA_TOOL_OPTIONS: '-Dfile.encoding=UTF-8' },
      shell: false,
    })
  }

  backendProcess.stdout?.on('data', (data) => {
    console.log(`[backend] ${data.toString().trim()}`)
  })
  backendProcess.stderr?.on('data', (data) => {
    console.error(`[backend-error] ${data.toString().trim()}`)
  })
  backendProcess.on('exit', (code) => {
    console.log(`[sidecar] 后端进程退出，code=${code}`)
    backendProcess = null
  })

  // 等待后端就绪
  console.log('[sidecar] 等待后端就绪...')
  const ready = await waitForBackend(120000)
  if (ready) {
    console.log('[sidecar] 后端已就绪')
  } else {
    console.error('[sidecar] 后端启动超时')
  }
  return ready
}

/** 停止后端 */
export async function stopSidecar(): Promise<void> {
  if (!backendProcess) {
    return
  }
  console.log('[sidecar] 正在停止后端...')
  const pid = backendProcess.pid
  try {
    if (process.platform === 'win32' && pid) {
      // Windows: mvnw 会 fork 独立 Java 进程，用 taskkill /T 递归杀掉整颗进程树
      await new Promise<void>((resolve) => {
        const killer = spawn('taskkill', ['/F', '/T', '/PID', String(pid)], {
          shell: false,
        })
        killer.on('exit', () => resolve())
        killer.on('error', () => resolve())
      })
    } else {
      backendProcess.kill('SIGTERM')
      await new Promise((resolve) => setTimeout(resolve, 3000))
      if (backendProcess && !backendProcess.killed) {
        backendProcess.kill('SIGKILL')
      }
    }
  } catch (e) {
    console.error('[sidecar] 停止后端失败:', e)
  }
  backendProcess = null

  // 等待端口真正释放
  for (let i = 0; i < 10; i++) {
    if (!(await isBackendReady())) break
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

/** 重启后端 */
export async function restartSidecar(): Promise<boolean> {
  await stopSidecar()
  await new Promise((resolve) => setTimeout(resolve, 2000))
  return startSidecar()
}
