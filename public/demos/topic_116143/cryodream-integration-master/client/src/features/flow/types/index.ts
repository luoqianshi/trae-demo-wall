import { type Edge, type Node } from '@xyflow/react'

export type FlowNodeKind = 'genericNode' | 'noteNode' | 'groupNode'
export type ComponentSourceGroup = 'core' | 'bundle' | 'mcp' | 'legacy'

export interface TemplateField {
  name: string
  display_name: string
  type: string
  input_types?: string[]
  required?: boolean
  value?: unknown
  advanced?: boolean
  info?: string
  options?: string[]
  placeholder?: string
  tool_mode?: boolean
  /** 当 type='model_config' 时，指定只显示该类型的模型（如 'embedding'、'chat'），不填则显示全部 */
  modelType?: string
}

export interface TemplateOutput {
  name: string
  display_name: string
  types: string[]
  selected?: string
  group_outputs?: boolean
}

export interface ComponentTemplate {
  type: string
  display_name: string
  description: string
  icon?: string
  base_classes: string[]
  category: string
  beta?: boolean
  legacy?: boolean
  source?: ComponentSourceGroup
  bundle?: string
  mcpServer?: string
  template: Record<string, TemplateField>
  outputs: TemplateOutput[]
}

export interface GenericNodeData extends Record<string, unknown> {
  id: string
  type: string
  node: ComponentTemplate
  selected_output?: string
}

export interface NoteNodeData extends Record<string, unknown> {
  id: string
  text: string
  color: string
}

export interface GroupNodeData extends Record<string, unknown> {
  id: string
  title: string
  description?: string
  color: string
  childNodeIds: string[]
}

export type FlowNodeData = GenericNodeData | NoteNodeData | GroupNodeData
export type GenericFlowNode = Node<GenericNodeData, 'genericNode'>
export type NoteFlowNode = Node<NoteNodeData, 'noteNode'>
export type GroupFlowNode = Node<GroupNodeData, 'groupNode'>
export type CustomNode = GenericFlowNode | NoteFlowNode | GroupFlowNode
export type EdgeType = Edge

export interface FlowData {
  id: string
  name: string
  description?: string
  nodes: CustomNode[]
  edges: EdgeType[]
  createdAt: string
  updatedAt: string
}

export interface SidebarCategory {
  display_name: string
  name: string
  icon: string
}

export interface NodeTemplate {
  id: string
  category: string
  name: string
  display_name: string
  description: string
  icon: string
  beta?: boolean
  legacy?: boolean
  source?: ComponentSourceGroup
  bundle?: string
  mcpServer?: string
  node: ComponentTemplate
}

export interface NodeCategory {
  id: string
  name: string
  icon: string
  description?: string
  nodes: NodeTemplate[]
}
