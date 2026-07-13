import { create } from 'zustand'
import { useFlowStore } from './useFlowStore'
import { createDebugMessage, runFlowWithFallback, type DebugMessage, type FlowRunResult } from '../utils/runFlowAdapter'

interface FlowDebugState {
  open: boolean
  isRunning: boolean
  inputValue: string
  messages: DebugMessage[]
  /** 最近一次运行的结构化结果（用于左右分栏展示） */
  lastRunResult: FlowRunResult | null
  setOpen: (open: boolean) => void
  setInputValue: (value: string) => void
  clearMessages: () => void
  addMessage: (message: DebugMessage) => void
  runCurrentFlow: (input?: string) => Promise<void>
}

export const useFlowDebugStore = create<FlowDebugState>((set, get) => ({
  open: false,
  isRunning: false,
  inputValue: '',
  lastRunResult: null,
  messages: [
    createDebugMessage('system', '调试区已准备好。你可以输入一段对话内容，查看当前工作流的模拟执行过程和输出结果。'),
  ],

  setOpen: (open) => set({ open }),
  setInputValue: (inputValue) => set({ inputValue }),
  clearMessages: () =>
    set({
      lastRunResult: null,
      messages: [createDebugMessage('system', '调试消息已清空，可以重新输入内容运行流程。')],
    }),
  addMessage: (message) => set((state) => ({ messages: [...state.messages, message] })),

  runCurrentFlow: async (input) => {
    const flowStore = useFlowStore.getState()
    const { nodes, edges } = flowStore
    const text = typeof input === 'string' ? input : get().inputValue
    const trimmed = text.trim()

    if (get().isRunning) return

    set((state) => ({
      open: true,
      isRunning: true,
      inputValue: '',
      messages: [...state.messages, createDebugMessage('user', trimmed || '空输入')],
    }))

    try {
      const result = await runFlowWithFallback({ nodes, edges, inputValue: trimmed, flow: flowStore.saveFlow() })
      const role: DebugMessage['role'] = result.status === 'FAILED' || nodes.length === 0 ? 'error' : 'assistant'
      // 生成展示内容：优先用 steps 摘要，避免重复输出用户输入
      let content = ''
      if (result.steps && result.steps.length > 0) {
        // 有执行步骤时，生成摘要而非直接用 outputText（outputText 可能是用户输入的重复）
        const successCount = result.steps.filter((s) => s.status === 'SUCCESS').length
        const failedCount = result.steps.filter((s) => s.status === 'FAILED').length
        const lastStep = result.steps[result.steps.length - 1]
        if (result.status === 'SUCCESS') {
          // 成功时，用最后一步的输出作为结果
          const lastOutput = lastStep?.output
          if (lastOutput) {
            // 优先取有意义的输出字段
            const meaningfulKeys = ['chunkCount', 'response', 'metadata', 'text', 'output']
            const meaningfulEntry = Object.entries(lastOutput).find(([key]) => meaningfulKeys.includes(key))
            if (meaningfulEntry) {
              const [key, value] = meaningfulEntry
              content = `${key}: ${typeof value === 'object' ? JSON.stringify(value) : String(value)}`
            } else {
              content = `执行成功，共 ${result.steps.length} 个步骤（${successCount} 成功）`
            }
          } else {
            content = `执行成功，共 ${result.steps.length} 个步骤`
          }
        } else {
          content = result.errorMessage || '执行失败'
        }
      } else {
        content = result.outputText || result.errorMessage || '后端未返回输出内容。'
      }
      set((state) => ({
        isRunning: false,
        lastRunResult: result,
        messages: [...state.messages, createDebugMessage(role, content, result)],
      }))
    } catch (error) {
      set((state) => ({
        isRunning: false,
        messages: [...state.messages, createDebugMessage('error', error instanceof Error ? error.message : String(error))],
      }))
    }
  },
}))
