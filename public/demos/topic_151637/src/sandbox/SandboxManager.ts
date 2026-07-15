import { spawn, ChildProcess } from 'child_process'
import { join } from 'path'
import {
  RPCRequest,
  RPCResponse,
  ExecuteResult,
  LoadDataResult,
  QueryResult,
  DescribeResult
} from './Protocol'

interface PendingRequest {
  resolve: (value: unknown) => void
  reject: (reason: Error) => void
  timer: NodeJS.Timeout
  sessionId: string
}

export class SandboxManager {
  private static readonly STARTUP_TIMEOUT = 30_000

  private processes = new Map<string, ChildProcess>()
  private pending = new Map<number, PendingRequest>()
  private buffers = new Map<string, string>()
  /** 收集每个 session 的 stderr 输出，用于崩溃诊断 */
  private stderrLogs = new Map<string, string[]>()
  private requestCounter = 0
  private harnessPath: string
  private pythonPath: string
  private defaultTimeout: number

  constructor(options?: {
    harnessPath?: string
    pythonPath?: string
    timeout?: number
  }) {
    this.pythonPath = options?.pythonPath || process.env.PYTHON_PATH || 'python'
    // 首次执行时可能需要等待重型库（pandas 等）后台导入完成，
    // 因此给普通操作更长的默认超时（120s）
    this.defaultTimeout = options?.timeout || 120_000
    // dev mode: __dirname is out/main, go up to project root then into src
    this.harnessPath =
      options?.harnessPath || join(__dirname, '../../src/sandbox/python/harness.py')
  }

  async start(sessionId: string): Promise<void> {
    if (this.processes.has(sessionId)) {
      throw new Error(`Session ${sessionId} already exists`)
    }

    const child = spawn(this.pythonPath, [this.harnessPath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: {
        ...process.env,
        PYTHONUNBUFFERED: '1',
        PYTHONIOENCODING: 'utf-8',
        PYTHONUTF8: '1',
      }
    })

    this.processes.set(sessionId, child)
    this.buffers.set(sessionId, '')

    child.stdout?.on('data', (chunk: Buffer) => {
      this.handleStdout(sessionId, chunk)
    })

    child.stderr?.on('data', (chunk: Buffer) => {
      const text = chunk.toString('utf-8')
      // 收集 stderr 用于崩溃诊断
      const logs = this.stderrLogs.get(sessionId) || []
      logs.push(text)
      // 限制日志量，保留最近 50 条
      if (logs.length > 50) logs.shift()
      this.stderrLogs.set(sessionId, logs)
      if (process.env.DEBUG_SANDBOX) {
        console.error(`[sandbox:${sessionId}] stderr:`, text)
      }
    })

    child.on('exit', (code, signal) => {
      this.handleExit(sessionId, code, signal)
    })

    // Wait for ping to confirm process is ready
    // Python imports (pandas, numpy, etc.) take a few seconds — use fixed startup timeout
    try {
      await this.sendRequest(sessionId, 'ping', {}, SandboxManager.STARTUP_TIMEOUT)
    } catch (e) {
      const errMsg = e instanceof Error ? e.message : String(e)
      throw new Error(`Failed to start sandbox for session ${sessionId}: ${errMsg}`)
    }
  }

  hasSession(sessionId: string): boolean {
    return this.processes.has(sessionId)
  }

  async execute(
    sessionId: string,
    code: string,
    timeout?: number
  ): Promise<ExecuteResult> {
    return this.sendRequest(
      sessionId,
      'execute',
      { code },
      timeout
    ) as Promise<ExecuteResult>
  }

  async loadData(
    sessionId: string,
    source: string,
    format: string = 'csv'
  ): Promise<LoadDataResult> {
    return this.sendRequest(
      sessionId,
      'load_data',
      { source, format }
    ) as Promise<LoadDataResult>
  }

  async query(sessionId: string, sql: string): Promise<QueryResult> {
    return this.sendRequest(sessionId, 'query', { sql }) as Promise<QueryResult>
  }

  async describe(
    sessionId: string,
    handle: string = 'df'
  ): Promise<DescribeResult> {
    return this.sendRequest(
      sessionId,
      'describe',
      { handle }
    ) as Promise<DescribeResult>
  }

  async listVariables(sessionId: string): Promise<string[]> {
    return this.sendRequest(sessionId, 'list_variables', {}) as Promise<string[]>
  }

  async reset(sessionId: string): Promise<string> {
    return this.sendRequest(sessionId, 'reset', {}) as Promise<string>
  }

  async stop(sessionId: string): Promise<void> {
    const child = this.processes.get(sessionId)
    if (!child) return

    // Reject all pending requests for this session only
    for (const [id, pending] of this.pending) {
      if (pending.sessionId === sessionId) {
        clearTimeout(pending.timer)
        pending.reject(new Error('Session stopped'))
        this.pending.delete(id)
      }
    }

    child.kill('SIGKILL')
    this.processes.delete(sessionId)
    this.buffers.delete(sessionId)
  }

  async stopAll(): Promise<void> {
    const sessionIds = Array.from(this.processes.keys())
    await Promise.all(sessionIds.map((id) => this.stop(id)))
  }

  private sendRequest(
    sessionId: string,
    method: string,
    params: Record<string, unknown>,
    timeout?: number
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const child = this.processes.get(sessionId)
      if (!child || !child.stdin) {
        reject(new Error(`Session ${sessionId} not found or stdin closed`))
        return
      }

      const id = ++this.requestCounter
      const request: RPCRequest = {
        jsonrpc: '2.0',
        id,
        method: method as RPCRequest['method'],
        params
      }

      const actualTimeout = timeout || this.defaultTimeout
      const timer = setTimeout(() => {
        this.pending.delete(id)
        reject(new Error(`Request timeout after ${actualTimeout}ms`))
      }, actualTimeout)

      this.pending.set(id, { resolve, reject, timer, sessionId })

      const line = JSON.stringify(request) + '\n'
      // Node 默认 UTF-8 编码器拒绝 lone surrogate（\udc80 等），
      // 用 replace 清洗后再编码，避免 stdin 写入失败
      const safeLine = line.replace(
        /[\uD800-\uDBFF](?![\uDC00-\uDFFF])|(?<![\uD800-\uDBFF])[\uDC00-\uDFFF]/g,
        '\uFFFD'
      )
      child.stdin.write(safeLine, 'utf8')
    })
  }

  private handleStdout(sessionId: string, chunk: Buffer): void {
    const buffer = this.buffers.get(sessionId) || ''
    const data = buffer + chunk.toString('utf-8')
    const lines = data.split('\n')

    // Last element is incomplete (no trailing newline)
    this.buffers.set(sessionId, lines.pop() || '')

    for (const line of lines) {
      const trimmed = line.trim()
      if (!trimmed) continue
      try {
        const response: RPCResponse = JSON.parse(trimmed)
        this.handleResponse(response)
      } catch {
        // Non-JSON output (e.g., print statements from Python code)
        if (process.env.DEBUG_SANDBOX) {
          console.log(`[sandbox:${sessionId}] non-json:`, trimmed)
        }
      }
    }
  }

  private handleResponse(response: RPCResponse): void {
    const id = response.id
    if (id === null) return

    const pending = this.pending.get(id)
    if (!pending) return

    clearTimeout(pending.timer)
    this.pending.delete(id)

    if (response.error) {
      pending.reject(
        new Error(`${response.error.message}${response.error.traceback ? '\n' + response.error.traceback : ''}`)
      )
    } else {
      pending.resolve(response.result)
    }
  }

  private handleExit(
    sessionId: string,
    code: number | null,
    signal: NodeJS.Signals | null
  ): void {
    // 收集 stderr 日志用于诊断
    const stderrLogs = this.stderrLogs.get(sessionId) || []
    const stderrTail = stderrLogs.slice(-5).join('').slice(0, 500)

    // Reject all pending requests for this session only
    for (const [id, pending] of this.pending) {
      if (pending.sessionId === sessionId) {
        clearTimeout(pending.timer)
        const errMsg = `Python process exited (code=${code}, signal=${signal})`
        const detail = stderrTail ? `${errMsg}\nstderr: ${stderrTail}` : errMsg
        pending.reject(new Error(detail))
        this.pending.delete(id)
      }
    }

    this.processes.delete(sessionId)
    this.buffers.delete(sessionId)
    this.stderrLogs.delete(sessionId)
  }
}
