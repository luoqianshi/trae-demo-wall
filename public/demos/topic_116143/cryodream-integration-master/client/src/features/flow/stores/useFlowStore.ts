import { create } from 'zustand'
import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition,
} from '@xyflow/react'
import type {
  ComponentTemplate,
  CustomNode,
  EdgeType,
  FlowData,
  FlowNodeData,
  GenericFlowNode,
  GroupFlowNode,
  NodeTemplate,
  NoteFlowNode,
} from '../types'

interface FlowHistorySnapshot {
  nodes: CustomNode[]
  edges: EdgeType[]
  flowName: string
  flowDescription?: string
  flowId: string
}

export interface FlowState {
  nodes: CustomNode[]
  edges: EdgeType[]
  selectedNode: CustomNode | null
  flowName: string
  flowDescription?: string
  flowId: string
  locked: boolean
  past: FlowHistorySnapshot[]
  future: FlowHistorySnapshot[]

  setNodes: (nodes: CustomNode[]) => void
  setEdges: (edges: EdgeType[]) => void
  onNodesChange: (changes: NodeChange<CustomNode>[]) => void
  onEdgesChange: (changes: EdgeChange<EdgeType>[]) => void
  onConnect: (connection: Connection) => void
  addNode: (node: CustomNode) => void
  addComponentNode: (template: NodeTemplate, position: XYPosition) => void
  addNoteNode: (position?: XYPosition) => void
  addGroupNode: (position?: XYPosition, childNodeIds?: string[]) => void
  groupSelected: () => void
  groupNodes: (nodeIds: string[]) => void
  ungroupNode: (nodeId: string) => void
  deleteNode: (nodeId: string) => void
  duplicateNode: (nodeId: string) => void
  deleteSelected: () => void
  updateNodeData: (nodeId: string, data: Partial<FlowNodeData>) => void
  selectNode: (node: CustomNode | null) => void
  setFlowName: (name: string) => void
  setLocked: (locked: boolean) => void
  undo: () => void
  redo: () => void
  canUndo: () => boolean
  canRedo: () => boolean
  saveFlow: () => FlowData
  loadFlow: (flow: FlowData) => void
  clearFlow: () => void
  loadKnowledgePipeline: () => void
}

const initialNodes: CustomNode[] = []
const initialEdges: EdgeType[] = []
const maxHistoryLength = 40
let positionChangeSessionActive = false

const cloneData = <T>(data: T): T => structuredClone(data)

const createSnapshot = (state: Pick<FlowState, 'nodes' | 'edges' | 'flowName' | 'flowDescription' | 'flowId'>): FlowHistorySnapshot => ({
  nodes: cloneData(state.nodes),
  edges: cloneData(state.edges),
  flowName: state.flowName,
  flowDescription: state.flowDescription,
  flowId: state.flowId,
})

const pushHistory = (state: FlowState) => ({
  past: [...state.past.slice(-(maxHistoryLength - 1)), createSnapshot(state)],
  future: [],
})

const createGenericNode = (template: ComponentTemplate, position: XYPosition): GenericFlowNode => {
  const id = `${template.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  return {
    id,
    type: 'genericNode',
    position,
    data: {
      id,
      type: template.type,
      node: cloneData(template),
      selected_output: template.outputs[0]?.name,
    },
  }
}

const createNoteNode = (position: XYPosition = { x: 240, y: 160 }): NoteFlowNode => {
  const id = `note-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  return {
    id,
    type: 'noteNode',
    position,
    data: {
      id,
      text: '双击编辑便签',
      color: 'yellow',
    },
  }
}

const createGroupNode = (
  position: XYPosition = { x: 220, y: 140 },
  childNodeIds: string[] = [],
  size: { width: number; height: number } = { width: 420, height: 260 }
): GroupFlowNode => {
  const id = `group-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`

  return {
    id,
    type: 'groupNode',
    position,
    style: {
      width: size.width,
      height: size.height,
      zIndex: -1,
    },
    data: {
      id,
      title: childNodeIds.length > 0 ? '节点分组' : '空白分组',
      description: childNodeIds.length > 0 ? `${childNodeIds.length} 个节点` : '用于整理画布区域',
      color: 'slate',
      childNodeIds,
    },
  }
}

const getGroupPositionForNode = (node: CustomNode): XYPosition => ({
  x: Math.max(0, node.position.x - 40),
  y: Math.max(0, node.position.y - 56),
})

const getGroupBounds = (nodes: CustomNode[]) => {
  const padding = 64
  const minX = Math.min(...nodes.map((node) => node.position.x))
  const minY = Math.min(...nodes.map((node) => node.position.y))
  const maxX = Math.max(...nodes.map((node) => node.position.x + Number(node.measured?.width ?? node.width ?? node.style?.width ?? 280)))
  const maxY = Math.max(...nodes.map((node) => node.position.y + Number(node.measured?.height ?? node.height ?? node.style?.height ?? 140)))

  return {
    position: {
      x: Math.max(0, minX - padding),
      y: Math.max(0, minY - padding),
    },
    size: {
      width: Math.max(360, maxX - minX + padding * 2),
      height: Math.max(220, maxY - minY + padding * 2),
    },
  }
}

const getPositionChangeDelta = (changes: NodeChange<CustomNode>[], nodes: CustomNode[]) => {
  const positionChange = changes.find(
    (change): change is Extract<NodeChange<CustomNode>, { type: 'position' }> => change.type === 'position' && Boolean(change.position)
  )
  if (!positionChange?.position) return null

  const node = nodes.find((item) => item.id === positionChange.id)
  if (!node || node.type !== 'groupNode') return null

  return {
    groupId: node.id,
    childNodeIds: node.data.childNodeIds,
    deltaX: positionChange.position.x - node.position.x,
    deltaY: positionChange.position.y - node.position.y,
  }
}

const removeNodeFromGroups = (nodes: CustomNode[], nodeId: string) =>
  nodes.map((node) => {
    if (node.type !== 'groupNode' || !node.data.childNodeIds.includes(nodeId)) return node
    const childNodeIds = node.data.childNodeIds.filter((childId) => childId !== nodeId)
    return {
      ...node,
      data: {
        ...node.data,
        childNodeIds,
        description: childNodeIds.length > 0 ? `${childNodeIds.length} 个节点` : '空白分组',
      },
    } as CustomNode
  })

const duplicateFlowNode = (node: CustomNode): CustomNode => {
  const id = `${node.type}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
  return {
    ...node,
    id,
    selected: false,
    style: node.style ? { ...node.style } : undefined,
    position: {
      x: node.position.x + 36,
      y: node.position.y + 36,
    },
    data: {
      ...cloneData(node.data),
      id,
    },
  } as CustomNode
}

export const useFlowStore = create<FlowState>((set, get) => ({
  nodes: initialNodes,
  edges: initialEdges,
  selectedNode: null,
  flowName: '未命名工作流',
  flowDescription: '',
  flowId: `flow_${Date.now()}`,
  locked: false,
  past: [],
  future: [],

  setNodes: (nodes) => set((state) => ({ ...pushHistory(state), nodes })),
  setEdges: (edges) => set((state) => ({ ...pushHistory(state), edges })),

  onNodesChange: (changes) => {
    const currentNodes = get().nodes
    const groupMove = getPositionChangeDelta(changes, currentNodes)
    const isPositionChange = changes.some((change) => change.type === 'position')
    const isPositionDragging = changes.some((change) => change.type === 'position' && Boolean(change.dragging))
    const isPositionCommit = changes.some((change) => change.type === 'position' && !change.dragging)
    const shouldRecord = changes.some((change) => change.type === 'remove') || (isPositionDragging && !positionChangeSessionActive)
    let nodes = applyNodeChanges<CustomNode>(changes, currentNodes)

    if (groupMove && (groupMove.deltaX !== 0 || groupMove.deltaY !== 0)) {
      const childNodeIds = new Set(groupMove.childNodeIds)
      nodes = nodes.map((node) => {
        if (node.id === groupMove.groupId || !childNodeIds.has(node.id)) return node
        return {
          ...node,
          position: {
            x: node.position.x + groupMove.deltaX,
            y: node.position.y + groupMove.deltaY,
          },
        }
      })
    }

    if (isPositionChange) {
      positionChangeSessionActive = isPositionDragging || (positionChangeSessionActive && !isPositionCommit)
    }

    if (isPositionCommit) positionChangeSessionActive = false

    const selectedNode = get().selectedNode
    set((state) => ({
      ...(shouldRecord ? pushHistory(state) : {}),
      nodes,
      selectedNode: selectedNode ? (nodes.find((node) => node.id === selectedNode.id) ?? null) : null,
    }))
  },

  onEdgesChange: (changes) =>
    set((state) => ({
      ...pushHistory(state),
      edges: applyEdgeChanges<EdgeType>(changes, get().edges),
    })),

  onConnect: (connection) =>
    set((state) => ({
      ...pushHistory(state),
      edges: addEdge(
        {
          ...connection,
          type: 'default',
          animated: true,
          style: { strokeWidth: 1.8 },
        },
        get().edges
      ),
    })),

  addNode: (node) => set((state) => ({ ...pushHistory(state), nodes: [...state.nodes, node] })),

  addComponentNode: (template, position) => {
    const node = createGenericNode(template.node, position)
    set((state) => ({ ...pushHistory(state), nodes: [...state.nodes, node], selectedNode: node }))
  },

  addNoteNode: (position) => {
    const node = createNoteNode(position)
    set((state) => ({ ...pushHistory(state), nodes: [...state.nodes, node], selectedNode: node }))
  },

  addGroupNode: (position, childNodeIds = []) => {
    const node = createGroupNode(position, childNodeIds)
    set((state) => ({ ...pushHistory(state), nodes: [node, ...state.nodes], selectedNode: node }))
  },

  groupSelected: () => {
    const selectedNodes = get().nodes.filter((node) => node.selected && node.type !== 'groupNode')
    if (selectedNodes.length > 1) {
      get().groupNodes(selectedNodes.map((node) => node.id))
      return
    }

    const selectedNode = get().selectedNode
    if (!selectedNode || selectedNode.type === 'groupNode') return
    const group = createGroupNode(getGroupPositionForNode(selectedNode), [selectedNode.id])
    set((state) => ({ ...pushHistory(state), nodes: [group, ...state.nodes], selectedNode: group }))
  },

  groupNodes: (nodeIds) => {
    const childNodes = get().nodes.filter((node) => nodeIds.includes(node.id) && node.type !== 'groupNode')
    if (childNodes.length === 0) return
    const bounds = getGroupBounds(childNodes)
    const group = createGroupNode(bounds.position, childNodes.map((node) => node.id), bounds.size)
    set((state) => ({ ...pushHistory(state), nodes: [group, ...state.nodes], selectedNode: group }))
  },

  ungroupNode: (nodeId) => {
    const group = get().nodes.find((node) => node.id === nodeId && node.type === 'groupNode')
    if (!group) return
    set((state) => ({
      ...pushHistory(state),
      nodes: state.nodes.filter((node) => node.id !== nodeId),
      edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
      selectedNode: null,
    }))
  },

  deleteNode: (nodeId) => {
    set((state) => {
      const nodes = removeNodeFromGroups(
        state.nodes.filter((node) => node.id !== nodeId),
        nodeId
      )

      return {
        ...pushHistory(state),
        nodes,
        edges: state.edges.filter((edge) => edge.source !== nodeId && edge.target !== nodeId),
        selectedNode: state.selectedNode?.id === nodeId ? null : state.selectedNode,
      }
    })
  },

  duplicateNode: (nodeId) => {
    const node = get().nodes.find((item) => item.id === nodeId)
    if (!node) return
    const duplicate = duplicateFlowNode(node)
    if (duplicate.type === 'groupNode') {
      duplicate.data = {
        ...duplicate.data,
        title: `${duplicate.data.title} 副本`,
        childNodeIds: [],
        description: '复制的空白分组',
      }
    }
    set((state) => ({ ...pushHistory(state), nodes: [...state.nodes, duplicate], selectedNode: duplicate }))
  },

  deleteSelected: () => {
    const selectedNode = get().selectedNode
    if (!selectedNode) return
    get().deleteNode(selectedNode.id)
  },

  updateNodeData: (nodeId, data) => {
    const mergeNodeData = (node: CustomNode): CustomNode => {
      if (node.type === 'genericNode' && 'node' in data && data.node && typeof data.node === 'object') {
        const nextComponent = data.node as Partial<ComponentTemplate>
        return {
          ...node,
          data: {
            ...node.data,
            ...data,
            node: {
              ...node.data.node,
              ...nextComponent,
              template: {
                ...node.data.node.template,
                ...(nextComponent.template ?? {}),
              },
            },
          },
        } as CustomNode
      }
      return { ...node, data: { ...node.data, ...data } } as CustomNode
    }

    const nodes = get().nodes.map((node) => (node.id === nodeId ? mergeNodeData(node) : node))
    set((state) => ({
      ...pushHistory(state),
      nodes,
      selectedNode: state.selectedNode?.id === nodeId ? (nodes.find((node) => node.id === nodeId) ?? null) : state.selectedNode,
    }))
  },

  selectNode: (node) => set({ selectedNode: node }),
  setFlowName: (name) => set((state) => ({ ...pushHistory(state), flowName: name })),
  setLocked: (locked) => set({ locked }),

  undo: () => {
    const state = get()
    const previous = state.past[state.past.length - 1]
    if (!previous) return
    const current = createSnapshot(state)
    set({
      ...previous,
      past: state.past.slice(0, -1),
      future: [current, ...state.future].slice(0, maxHistoryLength),
      selectedNode: null,
    })
  },

  redo: () => {
    const state = get()
    const next = state.future[0]
    if (!next) return
    const current = createSnapshot(state)
    set({
      ...next,
      past: [...state.past, current].slice(-maxHistoryLength),
      future: state.future.slice(1),
      selectedNode: null,
    })
  },

  canUndo: () => get().past.length > 0,
  canRedo: () => get().future.length > 0,

  saveFlow: () => {
    const { nodes, edges, flowName, flowDescription, flowId } = get()
    return {
      id: flowId,
      name: flowName,
      description: flowDescription,
      nodes,
      edges,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  },

  loadFlow: (flow) => {
    set((state) => ({
      ...pushHistory(state),
      flowId: flow.id,
      flowName: flow.name,
      flowDescription: flow.description,
      nodes: flow.nodes,
      edges: flow.edges,
      selectedNode: null,
    }))
  },

  clearFlow: () => {
    set((state) => ({
      ...pushHistory(state),
      nodes: initialNodes,
      edges: initialEdges,
      selectedNode: null,
      flowName: '未命名工作流',
      flowDescription: '',
      flowId: `flow_${Date.now()}`,
      locked: false,
    }))
  },

  loadKnowledgePipeline: () => {
    const kbId = `kb-demo-${Date.now()}`
    const loaderNode: GenericFlowNode = {
      id: 'node-document-loader',
      type: 'genericNode',
      position: { x: 80, y: 120 },
      data: {
        id: 'node-document-loader',
        type: 'DocumentLoader',
        node: {
          type: 'DocumentLoader',
          display_name: '文档加载器',
          description: '加载文档并解析为纯文本。',
          icon: 'FileText',
          base_classes: ['Data'],
          category: 'files_and_knowledge',
          template: {
            content: {
              name: 'content',
              display_name: '文档内容',
              type: 'str',
              input_types: [],
              value: '大语言模型（LLM）是一种基于 Transformer 架构的 AI 模型，通过海量文本数据进行预训练。\n它擅长理解和生成自然语言，能够执行问答、翻译、摘要、代码生成等多种任务。\n向量检索（RAG）通过将文档切分为向量块，在用户提问时检索最相关的上下文，显著增强了 LLM 的事实准确性。\n常见的向量数据库包括 Milvus、PgVector、ChromaDB。',
              required: false,
            },
            file_path: {
              name: 'file_path',
              display_name: '文件路径',
              type: 'str',
              input_types: [],
              value: '',
              required: false,
            },
            file_type: {
              name: 'file_type',
              display_name: '文件类型',
              type: 'str',
              input_types: [],
              value: 'txt',
              required: false,
            },
          },
          outputs: [{ name: 'text', display_name: '文本', types: ['Text'] }],
        },
        selected_output: 'text',
      },
    }

    const metaNode: GenericFlowNode = {
      id: 'node-metadata-extractor',
      type: 'genericNode',
      position: { x: 440, y: 40 },
      data: {
        id: 'node-metadata-extractor',
        type: 'GlobalMetadataExtractor',
        node: {
          type: 'GlobalMetadataExtractor',
          display_name: '全局元数据提取',
          description: '提取文档的领域、主题、实体、概念等元数据。',
          icon: 'Metadata',
          base_classes: ['Data'],
          category: 'files_and_knowledge',
          template: {
            input: {
              name: 'input',
              display_name: '输入文本',
              type: 'str',
              input_types: ['Text', 'Data'],
              value: '',
              required: true,
            },
            model_config_id: {
              name: 'model_config_id',
              display_name: '模型配置',
              type: 'model_config',
              input_types: [],
              value: '',
              required: false,
            },
          },
          outputs: [
            { name: 'metadata', display_name: '完整元数据', types: ['Data'] },
            { name: 'domain', display_name: '领域', types: ['Text'] },
            { name: 'theme', display_name: '主题', types: ['Text'] },
            { name: 'entities', display_name: '实体列表', types: ['Data'] },
            { name: 'concepts', display_name: '概念列表', types: ['Data'] },
          ],
        },
        selected_output: 'metadata',
      },
    }

    const chunkerNode: GenericFlowNode = {
      id: 'node-chunker',
      type: 'genericNode',
      position: { x: 440, y: 200 },
      data: {
        id: 'node-chunker',
        type: 'SemanticChunker',
        node: {
          type: 'SemanticChunker',
          display_name: '语义分块',
          description: '按段落逻辑切分文本，支持自定义分块大小。',
          icon: 'Scissors',
          base_classes: ['Data'],
          category: 'files_and_knowledge',
          template: {
            input: {
              name: 'input',
              display_name: '输入文本',
              type: 'str',
              input_types: ['Text', 'Data'],
              value: '',
              required: true,
            },
            chunk_size: {
              name: 'chunk_size',
              display_name: '分块大小',
              type: 'int',
              input_types: [],
              value: 500,
              required: false,
            },
            overlap_size: {
              name: 'overlap_size',
              display_name: '重叠大小',
              type: 'int',
              input_types: [],
              value: 50,
              required: false,
            },
          },
          outputs: [
            { name: 'chunks', display_name: '文本块', types: ['Data'] },
            { name: 'chunkCount', display_name: '块数量', types: ['Number'] },
          ],
        },
        selected_output: 'chunks',
      },
    }

    // 新增：元数据附加器节点
    const attacherNode: GenericFlowNode = {
      id: 'node-metadata-attacher',
      type: 'genericNode',
      position: { x: 800, y: 120 },
      data: {
        id: 'node-metadata-attacher',
        type: 'MetadataAttacher',
        node: {
          type: 'MetadataAttacher',
          display_name: '元数据附加器',
          description: '将全局元数据附加到每个 Chunk，形成「三维背包」结构。',
          icon: 'Link2',
          base_classes: ['Data'],
          category: 'files_and_knowledge',
          template: {
            chunks: {
              name: 'chunks',
              display_name: '文本块',
              type: 'str',
              input_types: ['Data'],
              value: '',
              required: true,
            },
            metadata: {
              name: 'metadata',
              display_name: '全局元数据',
              type: 'str',
              input_types: ['Data'],
              value: '',
              required: true,
            },
            time_stamp: {
              name: 'time_stamp',
              display_name: '时间戳',
              type: 'str',
              input_types: [],
              value: '2026-06',
              required: false,
            },
            claim_type: {
              name: 'claim_type',
              display_name: '主张类型',
              type: 'str',
              input_types: [],
              value: '事实陈述',
              required: false,
            },
            source: {
              name: 'source',
              display_name: '来源',
              type: 'str',
              input_types: [],
              value: '',
              required: false,
            },
            confidence: {
              name: 'confidence',
              display_name: '置信度',
              type: 'float',
              input_types: [],
              value: 0.8,
              required: false,
            },
          },
          outputs: [
            { name: 'enriched_chunks', display_name: '带背包的文本块', types: ['Data'] },
            { name: 'chunkCount', display_name: '块数量', types: ['Number'] },
          ],
        },
        selected_output: 'enriched_chunks',
      },
    }

    const writerNode: GenericFlowNode = {
      id: 'node-writer',
      type: 'genericNode',
      position: { x: 1160, y: 120 },
      data: {
        id: 'node-writer',
        type: 'KnowledgeBaseWriter',
        node: {
          type: 'KnowledgeBaseWriter',
          display_name: '知识库写入',
          description: '将带背包的 Chunk 向量化后写入知识库。',
          icon: 'Save',
          base_classes: ['Data'],
          category: 'files_and_knowledge',
          template: {
            chunks: {
              name: 'chunks',
              display_name: '文本块数据',
              type: 'str',
              input_types: ['Data'],
              value: '',
              required: true,
            },
            kb_id: {
              name: 'kb_id',
              display_name: '知识库 ID',
              type: 'str',
              input_types: [],
              value: kbId,
              required: true,
            },
            embedding_model_id: {
              name: 'embedding_model_id',
              display_name: '嵌入模型',
              type: 'model_config',
              input_types: [],
              value: '',
              required: false,
              modelType: 'embedding',
            },
          },
          outputs: [{ name: 'result', display_name: '结果', types: ['Data'] }],
        },
        selected_output: 'result',
      },
    }

    const presetEdges: EdgeType[] = [
      // 文档 → 元数据提取
      {
        id: 'edge-loader-meta',
        source: 'node-document-loader',
        target: 'node-metadata-extractor',
        sourceHandle: 'text',
        targetHandle: 'input',
        type: 'default',
        animated: true,
        style: { strokeWidth: 1.8 },
      },
      // 文档 → 语义分块
      {
        id: 'edge-loader-chunker',
        source: 'node-document-loader',
        target: 'node-chunker',
        sourceHandle: 'text',
        targetHandle: 'input',
        type: 'default',
        animated: true,
        style: { strokeWidth: 1.8 },
      },
      // 分块 → 元数据附加器
      {
        id: 'edge-chunker-attacher',
        source: 'node-chunker',
        target: 'node-metadata-attacher',
        sourceHandle: 'chunks',
        targetHandle: 'chunks',
        type: 'default',
        animated: true,
        style: { strokeWidth: 1.8 },
      },
      // 元数据 → 元数据附加器
      {
        id: 'edge-meta-attacher',
        source: 'node-metadata-extractor',
        target: 'node-metadata-attacher',
        sourceHandle: 'metadata',
        targetHandle: 'metadata',
        type: 'default',
        animated: true,
        style: { strokeWidth: 1.8 },
      },
      // 带背包的块 → 知识库写入
      {
        id: 'edge-attacher-writer',
        source: 'node-metadata-attacher',
        target: 'node-writer',
        sourceHandle: 'enriched_chunks',
        targetHandle: 'chunks',
        type: 'default',
        animated: true,
        style: { strokeWidth: 1.8 },
      },
    ]

    set((state) => ({
      ...pushHistory(state),
      nodes: [loaderNode, metaNode, chunkerNode, attacherNode, writerNode] as unknown as CustomNode[],
      edges: presetEdges,
      flowName: '知识入库流水线（V6.0）',
      flowDescription: `5 节点工作流：文档加载 → 全局元数据提取 → 语义分块 → 元数据附加 → 知识库写入（知识库 ID：${kbId}）`,
      flowId: `flow-kb-${Date.now()}`,
      selectedNode: null,
    }))
  },
}))
