import { runFlow, type RunFlowStep } from '../api/run-flow'
import type { CustomNode, EdgeType, FlowData, GenericFlowNode } from '../types'

export type DebugRole = 'user' | 'assistant' | 'system' | 'error'

export interface DebugMessage {
  id: string
  role: DebugRole
  content: string
  createdAt: string
  /** 关联的结构化运行结果（仅 assistant 角色且真实执行成功时存在） */
  runResult?: FlowRunResult
}

/** 单次工作流运行的结构化结果 */
export interface FlowRunResult {
  runId: string
  status: 'SUCCESS' | 'FAILED'
  outputText: string
  outputs?: Record<string, unknown>
  steps: RunFlowStep[]
  errorMessage?: string | null
  /** 执行来源：真实接口 / 本地模拟 */
  source: 'remote' | 'local'
}

export interface RunFlowAdapterInput {
  nodes: CustomNode[]
  edges: EdgeType[]
  inputValue: string
  flow?: FlowData
}

const isGenericNode = (node: CustomNode): node is GenericFlowNode => node.type === 'genericNode'

const getGenericNodes = (nodes: CustomNode[]) => nodes.filter(isGenericNode)

const getNodeDisplayName = (node: GenericFlowNode) => node.data.node.display_name || node.data.type

const getNodeType = (node: GenericFlowNode) => node.data.type

const getConnectedNodeNames = (node: GenericFlowNode, nodes: GenericFlowNode[], edges: EdgeType[]) => {
  const upstreamIds = edges.filter((edge) => edge.target === node.id).map((edge) => edge.source)
  const downstreamIds = edges.filter((edge) => edge.source === node.id).map((edge) => edge.target)
  const upstream = upstreamIds
    .map((id) => nodes.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => getNodeDisplayName(item as GenericFlowNode))
  const downstream = downstreamIds
    .map((id) => nodes.find((item) => item.id === id))
    .filter(Boolean)
    .map((item) => getNodeDisplayName(item as GenericFlowNode))

  return { upstream, downstream }
}

const formatKeyNodes = (nodes: GenericFlowNode[]) => {
  const keyTypes = new Set(['ChatInput', 'ChatOutput', 'LanguageModel', 'Agent', 'PromptTemplate', 'EmbeddingModel', 'MessageHistory'])
  const keyNodes = nodes.filter((node) => keyTypes.has(getNodeType(node)))
  if (keyNodes.length === 0) return '未检测到聊天输入、语言模型、智能体或聊天输出等关键节点。'
  return keyNodes.map((node) => `- ${getNodeDisplayName(node)}（${getNodeType(node)}）`).join('\n')
}

const formatExecutionSteps = (nodes: GenericFlowNode[], edges: EdgeType[]) => {
  if (nodes.length === 0) return '没有可执行节点。'

  return nodes
    .map((node, index) => {
      const { upstream, downstream } = getConnectedNodeNames(node, nodes, edges)
      const inputText = upstream.length > 0 ? `输入来自：${upstream.join('、')}` : '输入来自：调试区或节点默认值'
      const outputText = downstream.length > 0 ? `输出到：${downstream.join('、')}` : '输出到：调试区结果'
      return `${index + 1}. ${getNodeDisplayName(node)}：${inputText}；${outputText}`
    })
    .join('\n')
}

export const runFlowRemotely = async ({ nodes, edges, inputValue, flow }: RunFlowAdapterInput): Promise<FlowRunResult> => {
  const targetFlow = flow ?? {
    id: `flow_${Date.now()}`,
    name: '未命名工作流',
    nodes,
    edges,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }
  const chatInput = nodes.find((node) => isGenericNode(node) && getNodeType(node) === 'ChatInput')
  const objectInput = nodes.find((node) => isGenericNode(node) && getNodeType(node) === 'ObjectInput')
  const startNode = objectInput ?? chatInput
  // eslint-disable-next-line no-console
  console.log('[FlowRun] 发送到后端的节点数据：', nodes.map((node) => {
    if (!isGenericNode(node)) return { id: node.id, type: node.type }
    const data = node.data as GenericNodeData
    const template = data.node?.template ?? {}
    const values = (data as Record<string, unknown>).values as Record<string, unknown> | undefined
    return {
      id: node.id,
      type: data.type,
      displayName: data.node?.display_name,
      templateKeys: Object.keys(template),
      // 打印 model_config_id 等关键字段的值
      model_config_id: {
        inTemplate: template.model_config_id?.value,
        inValues: values?.model_config_id,
      },
    }
  }))

  const response = await runFlow({
    flowId: targetFlow.id,
    inputValue,
    startNodeId: startNode?.id,
    sessionId: `debug-session-${targetFlow.id}`,
    flow: {
      nodes: targetFlow.nodes,
      edges: targetFlow.edges,
    },
  })

  // 前端调试日志：打印后端返回的完整数据，便于排查 AI 实际返回内容
  // eslint-disable-next-line no-console
  console.log('[FlowRun] 后端执行返回：', {
    runId: response.runId,
    status: response.status,
    outputText: response.outputText,
    messages: response.messages,
    steps: response.steps,
  })

  return {
    runId: response.runId,
    status: response.status,
    outputText: response.outputText || '',
    outputs: response.outputs,
    steps: response.steps ?? [],
    errorMessage: response.errorMessage,
    source: 'remote',
  }
}

/** 将结构化运行结果格式化为纯文本（用于本地模拟或错误回退展示） */
export const formatRunResultToText = (result: FlowRunResult): string => {
  const lines: string[] = []
  if (result.source === 'local') {
    lines.push('本地模拟执行结果')
  } else {
    lines.push(`运行编号：${result.runId}`)
    lines.push(`运行状态：${result.status}`)
  }
  if (result.errorMessage) {
    lines.push('', `错误信息：${result.errorMessage}`)
  }
  if (result.steps?.length) {
    lines.push('', '执行步骤：')
    result.steps.forEach((step, index) => {
      const elapsed = typeof step.elapsedMs === 'number' ? `，耗时 ${step.elapsedMs}ms` : ''
      const error = step.errorMessage ? `，错误：${step.errorMessage}` : ''
      lines.push(`${index + 1}. ${step.nodeName || step.nodeId}（${step.nodeType}）：${step.status}${elapsed}${error}`)
    })
  }
  if (result.outputText) {
    lines.push('', `最终输出：${result.outputText}`)
  }
  return lines.join('\n')
}

export const runFlowWithFallback = async (input: RunFlowAdapterInput): Promise<FlowRunResult> => {
  try {
    return await runFlowRemotely(input)
  } catch (error) {
    // 后端执行失败时，如果错误信息中包含节点执行信息，不要回退到本地模拟
    // 而是返回一个包含错误信息的 FAILED 结果，让前端调试面板能显示失败节点
    const message = error instanceof Error ? error.message : String(error)

    // 如果是网络错误或后端不可达，回退到本地模拟
    if (message.includes('请求失败') || message.includes('Failed to fetch') || message.includes('NetworkError')) {
      const fallbackText = await runFlowLocally(input)
      return {
        runId: `local-${Date.now()}`,
        status: 'SUCCESS',
        outputText: fallbackText,
        steps: [],
        errorMessage: `真实执行接口暂不可用，已自动切换为本地模拟执行。接口错误：${message}`,
        source: 'local',
      }
    }

    // 后端返回了错误（如节点执行失败），直接返回错误信息，不回退到本地模拟
    return {
      runId: `error-${Date.now()}`,
      status: 'FAILED',
      outputText: '',
      steps: [],
      errorMessage: message,
      source: 'remote',
    }
  }
}

export const runFlowLocally = async ({ nodes, edges, inputValue }: RunFlowAdapterInput) => {
  await new Promise((resolve) => window.setTimeout(resolve, 450))

  if (nodes.length === 0) {
    return '当前画布没有节点。请先从左侧组件栏拖入节点，再进行调试。'
  }

  const genericNodes = getGenericNodes(nodes)
  const chatInput = genericNodes.find((node) => getNodeType(node) === 'ChatInput')
  const chatOutput = genericNodes.find((node) => getNodeType(node) === 'ChatOutput')
  const languageModel = genericNodes.find((node) => getNodeType(node) === 'LanguageModel')
  const agent = genericNodes.find((node) => getNodeType(node) === 'Agent')

  const mode = chatInput || chatOutput ? '聊天调试模式' : '普通流程调试模式'
  const finalHandler = chatOutput ? getNodeDisplayName(chatOutput) : agent ? getNodeDisplayName(agent) : languageModel ? getNodeDisplayName(languageModel) : '调试区结果'

  return [
    `运行模式：${mode}`,
    '',
    `输入内容：${inputValue || '空输入'}`,
    '',
    `流程概览：${nodes.length} 个节点，${edges.length} 条连线。`,
    '',
    '关键节点：',
    formatKeyNodes(genericNodes),
    '',
    '模拟执行步骤：',
    formatExecutionSteps(genericNodes, edges),
    '',
    `最终输出：已通过「${finalHandler}」生成模拟结果。后续接入真实后端执行接口后，这里会展示实际模型或工作流输出。`,
  ].join('\n')
}

export const createDebugMessage = (role: DebugRole, content: string, runResult?: FlowRunResult): DebugMessage => ({
  id: `debug-message-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
  role,
  content,
  createdAt: new Date().toISOString(),
  runResult,
})
