// 工作区管理 IPC handlers（单工作区模式）
import { ipcMain, dialog, shell, app } from 'electron'
import { spawn } from 'child_process'
import fsp from 'fs/promises'
import os from 'os'
import path from 'path'
import type { WorkspaceConfig } from '../types'

/** 工作区子目录清单（canvas 画布产出、canvas-inputs 上传素材、temp 临时） */
const WORKSPACE_SUBDIRS = ['canvas', 'canvas-inputs', 'temp'] as const

/** 获取工作区配置文件路径 */
function getConfigPath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'workspace-config.json')
}

/** 读取配置（只保留 current，兼容旧配置里的 recent 字段） */
async function readConfig(): Promise<{ current: WorkspaceConfig | null }> {
  try {
    const configPath = getConfigPath()
    const content = await fsp.readFile(configPath, 'utf-8')
    const parsed = JSON.parse(content)
    return { current: parsed.current ?? null }
  } catch {
    return { current: null }
  }
}

/** 写入配置 */
async function writeConfig(config: { current: WorkspaceConfig | null }): Promise<void> {
  const configPath = getConfigPath()
  const configDir = path.dirname(configPath)
  await fsp.mkdir(configDir, { recursive: true })
  await fsp.writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8')
}

/** 工作区初始化异常，携带诊断信息给前端展示 */
class WorkspaceInitError extends Error {
  code: string
  details: string
  constructor(code: string, message: string, details = '') {
    super(message)
    this.code = code
    this.details = details
    this.name = 'WorkspaceInitError'
  }
}

/** 运行进程并收集 stdout/stderr（限时） */
function runCommand(
  cmd: string,
  args: string[],
  timeoutMs = 15000
): Promise<{ code: number | null; stdout: string; stderr: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { shell: false, windowsHide: true })
    let stdout = ''
    let stderr = ''
    child.stdout?.on('data', (d) => (stdout += d.toString()))
    child.stderr?.on('data', (d) => (stderr += d.toString()))
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      resolve({ code: null, stdout, stderr: stderr + `\n[timeout after ${timeoutMs}ms]` })
    }, timeoutMs)
    child.on('exit', (code) => {
      clearTimeout(timer)
      resolve({ code, stdout, stderr })
    })
    child.on('error', (err) => {
      clearTimeout(timer)
      resolve({ code: -1, stdout, stderr: stderr + '\n' + err.message })
    })
  })
}

/**
 * Windows 下多层 icacls 授权：
 * 1. 移除只读属性
 * 2. 授予当前用户完全控制权（含继承）
 * 3. 授予 Users 组修改权（兜底，防止服务以 SYSTEM/其他账号运行）
 * 每一步失败会记 warn，但不会中断流程 —— 最终以「探针」验证结果为准。
 */
async function ensureWindowsPermissions(targetPath: string): Promise<string[]> {
  const notes: string[] = []
  if (process.platform !== 'win32') return notes
  const user = process.env.USERNAME || os.userInfo().username

  // 1. 移除只读
  const attrib = await runCommand('attrib', ['-R', targetPath, '/S', '/D'])
  if (attrib.code !== 0) {
    notes.push(`attrib -R 返回 ${attrib.code}: ${attrib.stderr.trim()}`)
  }

  // 2. 授予当前用户完全控制权（含继承）
  if (user) {
    const r1 = await runCommand('icacls', [
      targetPath,
      '/grant:r',
      `${user}:(OI)(CI)F`,
      '/T',
      '/Q',
    ])
    if (r1.code !== 0) {
      notes.push(`icacls 授权 ${user} 返回 ${r1.code}: ${r1.stderr.trim()}`)
    } else {
      console.log('[workspace] 已授予', user, '对', targetPath, '完全控制权')
    }
  }

  // 3. 授予 Users 组修改权（兜底：如果后端以其它账号或服务身份运行）
  const r2 = await runCommand('icacls', [
    targetPath,
    '/grant',
    'Users:(OI)(CI)M',
    '/T',
    '/Q',
  ])
  if (r2.code !== 0) {
    notes.push(`icacls Users 修改权返回 ${r2.code}: ${r2.stderr.trim()}`)
  }

  return notes
}

/**
 * 探针：真实创建子目录 + 写文件 + 删除，验证权限有效。
 * 失败会抛 WorkspaceInitError，前端能拿到具体报错。
 */
async function probeWritePermission(workspacePath: string): Promise<void> {
  const probeDir = path.join(workspacePath, `.probe_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`)
  const probeFile = path.join(probeDir, 'probe.txt')
  try {
    await fsp.mkdir(probeDir, { recursive: true })
  } catch (e: any) {
    throw new WorkspaceInitError(
      'PROBE_MKDIR_FAILED',
      `无法在工作区创建子目录（可能被杀毒软件拦截）：${probeDir}`,
      `${e?.code ?? ''} ${e?.message ?? String(e)}`
    )
  }
  try {
    await fsp.writeFile(probeFile, 'workspace probe', 'utf-8')
    await fsp.unlink(probeFile)
    await fsp.rmdir(probeDir)
  } catch (e: any) {
    // 尝试清理
    try {
      await fsp.rm(probeDir, { recursive: true, force: true })
    } catch {
      /* ignore */
    }
    throw new WorkspaceInitError(
      'PROBE_WRITE_FAILED',
      `工作区目录不允许写入文件（可能被杀毒软件的实时防护拦截）：${workspacePath}`,
      `${e?.code ?? ''} ${e?.message ?? String(e)}`
    )
  }
}

/**
 * 初始化工作区目录结构 + 完整权限授权 + 写入探针。
 * 任何一步不可恢复的失败都会抛 WorkspaceInitError。
 */
async function initWorkspaceDir(workspacePath: string): Promise<{ warnings: string[] }> {
  // 1. 创建工作区根目录（如果不存在）
  try {
    await fsp.mkdir(workspacePath, { recursive: true })
  } catch (e: any) {
    throw new WorkspaceInitError(
      'MKDIR_ROOT_FAILED',
      `无法创建工作区目录：${workspacePath}`,
      `${e?.code ?? ''} ${e?.message ?? String(e)}`
    )
  }

  // 2. 创建子目录
  for (const dir of WORKSPACE_SUBDIRS) {
    const dirPath = path.join(workspacePath, dir)
    try {
      await fsp.mkdir(dirPath, { recursive: true })
    } catch (e: any) {
      throw new WorkspaceInitError(
        'MKDIR_SUB_FAILED',
        `无法创建工作区子目录 ${dir}：${dirPath}`,
        `${e?.code ?? ''} ${e?.message ?? String(e)}`
      )
    }
  }

  // 3. Windows 授权（Linux/macOS 上跳过）
  const warnings = await ensureWindowsPermissions(workspacePath)

  // 4. 写入探针（真实创建/写/删一遍，验证权限有效）
  await probeWritePermission(workspacePath)

  // 5. 每个子目录再单独探针一次
  for (const dir of WORKSPACE_SUBDIRS) {
    await probeWritePermission(path.join(workspacePath, dir))
  }

  return { warnings }
}

/** 注册工作区 IPC handlers */
export function registerWorkspaceIPC(): void {
  // 获取当前工作区
  ipcMain.handle('workspace:getCurrent', async () => {
    const config = await readConfig()
    return config.current
  })

  // 选择工作区目录（弹出对话框）
  ipcMain.handle('workspace:select', async () => {
    const result = await dialog.showOpenDialog({
      title: '选择工作区目录',
      properties: ['openDirectory'],
    })

    if (result.canceled || result.filePaths.length === 0) return null

    const workspacePath = result.filePaths[0]
    const name = path.basename(workspacePath)
    return await setWorkspace(workspacePath, name)
  })

  // 直接设置工作区（不弹对话框）
  ipcMain.handle('workspace:set', async (_event, workspacePath: string, name?: string) => {
    return await setWorkspace(workspacePath, name || path.basename(workspacePath))
  })

  // 单工作区模式：recent 已废弃，返回空数组以兼容前端
  ipcMain.handle('workspace:getRecent', async () => {
    return []
  })

  // 单工作区模式：clearRecent 保留但空实现
  ipcMain.handle('workspace:clearRecent', async () => {
    // no-op
  })

  // 在文件管理器中打开
  ipcMain.handle('workspace:openInExplorer', async (_event, p?: string) => {
    const config = await readConfig()
    const targetPath = p || config.current?.path
    if (targetPath) {
      shell.openPath(targetPath)
    }
  })

  // 手动重新验证/授权当前工作区（供设置页"检查权限"按钮使用）
  ipcMain.handle('workspace:verifyPermissions', async () => {
    const config = await readConfig()
    if (!config.current) {
      return { ok: false, code: 'NO_WORKSPACE', message: '未设置工作区' }
    }
    try {
      const { warnings } = await initWorkspaceDir(config.current.path)
      return { ok: true, warnings }
    } catch (err) {
      if (err instanceof WorkspaceInitError) {
        return { ok: false, code: err.code, message: err.message, details: err.details }
      }
      const msg = err instanceof Error ? err.message : String(err)
      return { ok: false, code: 'UNKNOWN', message: msg }
    }
  })
}

/** 设置工作区（覆盖式，不累加） */
async function setWorkspace(workspacePath: string, name: string): Promise<WorkspaceConfig> {
  // 初始化 + 权限保障 + 探针（任何失败都会抛异常，前端能拿到结构化错误）
  await initWorkspaceDir(workspacePath)

  const now = Date.now()
  const workspace: WorkspaceConfig = {
    name,
    path: workspacePath,
    createdAt: now,
    lastOpenedAt: now,
  }

  await writeConfig({ current: workspace })
  return workspace
}
