export interface ApiResponse<T> {
  code: number
  data: T
  message?: string
}

export interface PageResponse<T> {
  records: T[]
  total: number
  current: number
  size: number
}

export interface FlowProject {
  id: string
  name: string
  description?: string
  icon?: string
  color?: string
  scenario?: string
  status: 'active' | 'archived'
  sortOrder?: number
  lastWorkflowId?: string
  workflowCount?: number
  createTime?: string
  updateTime?: string
}

export interface WorkflowSummary {
  id: string
  projectId: string
  projectName?: string
  name: string
  description?: string
  category?: string
  tags?: string[]
  status: 'draft' | 'active' | 'archived'
  version: number
  sourceTemplateId?: string
  graphJson?: string
  nodeCount: number
  edgeCount: number
  lastRunStatus?: string
  isTemplate?: number
  createTime?: string
  updateTime?: string
}

export interface WorkflowTemplate {
  id: string
  name: string
  description?: string
  category?: string
  tags: string[]
  coverColor?: string
  graphJson?: string
  systemTemplate: boolean
  createTime?: string
  updateTime?: string
}

const request = async <T>(url: string, options?: RequestInit): Promise<T> => {
  let response: Response
  try {
    response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...(options?.headers ?? {}),
      },
      ...options,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '网络连接失败'
    throw new Error(`网络请求失败：${message}`)
  }

  let result: { code: number; data: T; message?: string }
  try {
    result = (await response.json()) as { code: number; data: T; message?: string }
  } catch {
    throw new Error(`服务器响应格式异常（HTTP ${response.status}）`)
  }

  if (!response.ok) {
    throw new Error(`${result.message || '请求失败'}（HTTP ${response.status}）`)
  }
  if (result.code !== 0) {
    throw new Error(result.message || '接口返回错误')
  }
  return result.data
}

const normalizeProject = (item: FlowProject): FlowProject => ({
  ...item,
  id: String(item.id),
  lastWorkflowId: item.lastWorkflowId ? String(item.lastWorkflowId) : undefined,
})

const normalizeTemplate = (item: WorkflowTemplate): WorkflowTemplate => ({
  ...item,
  id: String(item.id),
})

export const listProjects = async () => {
  const page = await request<PageResponse<FlowProject>>('/api/flowProject/list/page', {
    method: 'POST',
    body: JSON.stringify({ current: 1, pageSize: 100 }),
  })
  return { ...page, records: page.records.map(normalizeProject) }
}

export const getProject = async (id: string) => {
  const project = await request<FlowProject>(`/api/flowProject/get?id=${id}`)
  return normalizeProject(project)
}

export const addProject = async (payload: Pick<FlowProject, 'name' | 'description' | 'icon' | 'color' | 'scenario'>) => {
  const id = await request<number | string>('/api/flowProject/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return String(id)
}

export const updateProject = async (payload: Partial<FlowProject> & { id: string }) =>
  request<boolean>('/api/flowProject/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

/** 把后端返回的 tags 字符串（逗号分隔）解析为数组 */
const parseTags = (tags: unknown): string[] => {
  if (Array.isArray(tags)) return tags as string[]
  if (typeof tags !== 'string' || !tags.trim()) return []
  return tags.split(',').map((t) => t.trim()).filter(Boolean)
}

export const listWorkflows = async (projectId: string) => {
  const page = await request<PageResponse<WorkflowSummary>>('/api/workflow/list/page', {
    method: 'POST',
    body: JSON.stringify({ current: 1, pageSize: 200, projectId }),
  })
  return {
    ...page,
    records: page.records.map((item) => ({
      ...item,
      id: String(item.id),
      projectId: String(item.projectId),
      sourceTemplateId: item.sourceTemplateId ? String(item.sourceTemplateId) : undefined,
      tags: parseTags(item.tags),
    })),
  }
}

export const getWorkflow = async (id: string) => {
  const workflow = await request<WorkflowSummary>(`/api/workflow/get?id=${id}`)
  return {
    ...workflow,
    id: String(workflow.id),
    projectId: String(workflow.projectId),
    sourceTemplateId: workflow.sourceTemplateId ? String(workflow.sourceTemplateId) : undefined,
    tags: parseTags(workflow.tags),
  }
}

export const addWorkflow = async (payload: { projectId: string; name: string; description?: string; graphJson?: string; category?: string; tags?: string }) => {
  const id = await request<number | string>('/api/workflow/add', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return String(id)
}

export const updateWorkflow = async (payload: { id: string; name?: string; description?: string; category?: string; tags?: string }) =>
  request<boolean>('/api/workflow/update', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const createWorkflowFromTemplate = async (payload: { projectId: string; templateId: string; name?: string; description?: string }) => {
  const id = await request<number | string>('/api/workflow/create/fromTemplate', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
  return String(id)
}

export const saveWorkflowGraph = async (payload: { id: string; name: string; description?: string; graphJson: string; nodeCount: number; edgeCount: number; status?: string }) =>
  request<boolean>('/api/workflow/saveGraph', {
    method: 'POST',
    body: JSON.stringify(payload),
  })

export const deleteWorkflow = async (id: string) =>
  request<boolean>('/api/workflow/delete', {
    method: 'POST',
    body: JSON.stringify({ id }),
  })

export const listWorkflowTemplates = async () => {
  const page = await request<PageResponse<WorkflowTemplate>>('/api/workflowTemplate/list/page', {
    method: 'POST',
    body: JSON.stringify({ current: 1, pageSize: 100, systemTemplate: true }),
  })
  return { ...page, records: page.records.map(normalizeTemplate) }
}

/** 根据 ID 获取工作流模板 */
export const getWorkflowTemplate = async (id: string) => {
  const template = await request<WorkflowTemplate>(`/api/workflowTemplate/get?id=${id}`)
  return normalizeTemplate(template)
}

/** 保存工作流为模板（标记 is_template=1） */
export const saveWorkflowAsTemplate = async (workflowId: string) =>
  request<boolean>('/api/workflow/saveAsTemplate', {
    method: 'POST',
    body: JSON.stringify({ workflowId }),
  })

/** 查询被标记为模板的工作流列表（is_template=1） */
export const listTemplateWorkflows = async () => {
  const page = await request<PageResponse<WorkflowSummary>>('/api/workflow/list/page', {
    method: 'POST',
    body: JSON.stringify({ current: 1, pageSize: 100, isTemplate: 1 }),
  })
  return {
    ...page,
    records: page.records.map((item) => ({
      ...item,
      id: String(item.id),
      projectId: String(item.projectId),
      sourceTemplateId: item.sourceTemplateId ? String(item.sourceTemplateId) : undefined,
    })),
  }
}
