/**
 * Agent IPC — Agent 运行与取消。
 *
 * 单例 SandboxManager 与 LLMClient（模块级），避免每次 run 重建。
 * 维护 activeSessionId + control 对象实现取消。
 *
 * 多轮对话支持：接收 priorState，复用 sessionId 保持 sandbox 中的 df 变量持续存在，
 * 并把前一轮的 analysisResults/chartSpecs/report 注入 SharedStore，
 * 让 LLM 知道之前已完成的步骤，避免重复执行。
 */

import { ipcMain, BrowserWindow } from 'electron'
import { runAgent } from '../../agents'
import { LLMClient } from '../../agents/llm/LLMClient'
import { SandboxManager } from '../../sandbox/SandboxManager'
import { IPC, AgentRunParams } from '../../types/ipc'
import type { ProgressEvent, DatasetContext } from '../../types/shared'
import { loadDatasetForSandbox } from './data.ipc'

// 模块级单例
const sandbox = new SandboxManager()
let llm: LLMClient | null = null

interface ActiveSession {
  sessionId: string
  control: { cancelled: boolean }
}

let active: ActiveSession | null = null

export function registerAgentIPC(win: BrowserWindow) {
  ipcMain.handle(IPC.AGENT_RUN, async (_e, params: AgentRunParams) => {
    const { goal, datasetId, datasetPath, llmConfig, conversationHistory, priorState, styleId, customStylePrompt, apiPort } = params

    // 初始化或更新 LLM 配置
    if (llmConfig && (llmConfig.apiKey || llmConfig.baseURL || llmConfig.model)) {
      llm = new LLMClient({
        apiKey: llmConfig.apiKey,
        baseURL: llmConfig.baseURL,
        model: llmConfig.model
      })
    } else if (!llm) {
      llm = new LLMClient()
    }

    // 多轮对话：复用 priorState.sessionId 保持 sandbox 中的 df 变量持续存在
    // 如果是第一次对话或前一会话已关闭，则用 priorState.sessionId 让上层负责确保沙箱存在
    const sessionId = priorState?.sessionId || `agent-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
    const control = { cancelled: false }
    active = { sessionId, control }

    try {
      // 启动或复用沙箱
      const sandboxRunning = sandbox.hasSession(sessionId)
      if (!sandboxRunning) {
        await sandbox.start(sessionId)
      }

      // 加载数据集到沙箱（多轮对话：用同一 datasetId 重新加载，确保 df 一致）
      const effectiveDatasetId = datasetId || priorState?.datasetId
      const effectivePath = datasetPath || priorState?.datasetPath
      let dataset: DatasetContext | undefined
      if (effectiveDatasetId) {
        dataset = await loadDatasetForSandbox(sandbox, sessionId, effectiveDatasetId, effectivePath)
      }

      // 运行 Agent Flow（把 priorState 传给 runAgent 复用累积结果）
      const result = await runAgent(
        goal,
        dataset,
        llm,
        sandbox,
        sessionId,
        control,
        (event: ProgressEvent) => {
          win.webContents.send(IPC.AGENT_PROGRESS, event)
        },
        conversationHistory,
        priorState,
        styleId,
        customStylePrompt,
        apiPort
      )

      const agentResult = {
        sessionId,
        goal: result.goal,
        steps: result.steps,
        charts: result.chartSpecs,
        analysisResults: result.analysisResults,
        researchFindings: result.researchFindings,
        report: result.report,
        dashboardHTML: result.dashboardHTML,
        errors: result.errors,
        iteration: result.iteration
      }

      win.webContents.send(IPC.AGENT_COMPLETE, agentResult)
      return agentResult
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err))
      win.webContents.send(IPC.AGENT_ERROR, { message: error.message })
      throw error
    } finally {
      // 多轮对话：不要停止沙箱，保持 df 变量持续存在
      // 只有取消时才停止
      if (control.cancelled) {
        await sandbox.stop(sessionId).catch(() => {})
      }
      active = null
    }
  })

  ipcMain.handle(IPC.AGENT_CANCEL, async () => {
    if (active) {
      active.control.cancelled = true
      const sessionId = active.sessionId
      // 不 await stop 阻塞 return，让 fire-and-forget 清理在后台进行
      sandbox.stop(sessionId).catch(() => {})
    }
    return true
  })

  // 删除会话/退出时由 renderer 主动释放指定 sessionId 的沙箱
  ipcMain.handle(IPC.SANDBOX_STOP, async (_e, sessionId: string) => {
    if (!sessionId) return false
    // 若是当前 active 会话，先标记取消
    if (active && active.sessionId === sessionId) {
      active.control.cancelled = true
      active = null
    }
    // fire-and-forget 清理，不阻塞 renderer 删除流程
    sandbox.stop(sessionId).catch(() => {})
    return true
  })
}

/** 应用退出时清理所有沙箱 */
export async function cleanupSandbox(): Promise<void> {
  await sandbox.stopAll().catch(() => {})
}
