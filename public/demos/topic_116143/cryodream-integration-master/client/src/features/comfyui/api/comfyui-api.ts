interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (!response.ok || result.code !== 0) {
    throw new Error(result.message && result.message !== 'No message available' ? result.message : `请求失败：${response.status}`)
  }
  return result.data
}

export interface LocalWorkflow {
  name: string
  fileName: string
  path: string
}

export interface ComfyParam {
  nodeId: string
  nodeType: string
  title: string
  paramName: string
  label: string
  type: 'int' | 'float' | 'string' | 'boolean' | 'image' | 'video' | 'audio'
  value: unknown
  advanced?: boolean
  multiline?: boolean
  options?: unknown[]
  min?: number
  max?: number
  step?: number
  control_after_generate?: string
}

export interface ComfyUploadResult {
  name: string
  subfolder: string
  type: string
  /** 落到画布项目目录时返回的完整 URL，形如 /api/comfyui-output/<projectId>/<name>；无 projectId 时可能为空 */
  url?: string
}

export interface ComfyVideoUploadResult {
  name: string
  subfolder: string
  type: string
  url?: string
}

/**
 * 输出插槽（Output Slot）。
 * 一个工作流可能有多个输出插槽（例如 SCIL 动作迁移：姿势图 + 对比图 + 视频）。
 * 每个插槽对应 ComfyUI graphJson 里一个 SaveXxx 节点，key = 该节点在 ComfyUI 里的 id。
 * 前端拿到工作流后，会为每个 slot 在画布上创建/复用一个对应的输出节点（AssetNode）。
 */
export interface OutputSlot {
  key: string
  label: string
  mediaKind: 'image' | 'video' | 'audio'
  comfyNodeId: string
}

export interface ComfyWorkflow {
  id: string
  name: string
  description?: string
  sourcePath: string
  outputType: 'image' | 'video' | 'audio'
  /**
   * 多输出插槽定义。新工作流由后端 detectOutputSlots 自动生成；
   * 老工作流可能为空 —— 前端会用 outputType 生成 1 个 fallback slot 保持兼容。
   */
  outputSlots?: OutputSlot[] | string
  graphJson: string
  paramSchema: string
  paramValues: string
  createTime?: string
}

export const comfyuiApi = {
  inputFileUrl: (filename: string, type = 'input', subfolder = ''): string => {
    const params = new URLSearchParams({ filename, type })
    if (subfolder) params.set('subfolder', subfolder)
    return `${baseUrl}/comfyui/input-file?${params.toString()}`
  },

  scan: async (): Promise<LocalWorkflow[]> => {
    const response = await fetch(`${baseUrl}/comfyui/scan`)
    return parseResponse<LocalWorkflow[]>(response)
  },

  importWorkflow: async (sourcePath: string): Promise<ComfyWorkflow> => {
    const response = await fetch(`${baseUrl}/comfyui/import`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sourcePath }),
    })
    return parseResponse<ComfyWorkflow>(response)
  },

  list: async (): Promise<ComfyWorkflow[]> => {
    const response = await fetch(`${baseUrl}/comfyui/list`)
    return parseResponse<ComfyWorkflow[]>(response)
  },

  get: async (id: string): Promise<ComfyWorkflow> => {
    const response = await fetch(`${baseUrl}/comfyui/get?id=${encodeURIComponent(id)}`)
    return parseResponse<ComfyWorkflow>(response)
  },

  run: async (id: string, paramValues?: Record<string, unknown>, projectId?: string): Promise<string[]> => {
    const response = await fetch(`${baseUrl}/comfyui/run`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, paramValues, projectId }),
    })
    return parseResponse<string[]>(response)
  },

  submit: async (id: string, paramValues?: Record<string, unknown>, projectId?: string): Promise<string> => {
    const response = await fetch(`${baseUrl}/comfyui/submit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, paramValues, projectId }),
    })
    return parseResponse<string>(response)
  },

  progress: async (taskId: string): Promise<ComfyProgress> => {
    const response = await fetch(`${baseUrl}/comfyui/progress?taskId=${encodeURIComponent(taskId)}`)
    return parseResponse<ComfyProgress>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/comfyui/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  deleteOutputImage: async (url: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/comfyui/delete-output-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    return parseResponse<boolean>(response)
  },

  uploadImage: async (
    file: File | Blob,
    filename?: string,
    projectId?: string
  ): Promise<ComfyUploadResult> => {
    const form = new FormData()
    form.append('file', file, filename ?? (file instanceof File ? file.name : 'upload.png'))
    if (projectId) form.append('projectId', projectId)
    const response = await fetch(`${baseUrl}/comfyui/upload-image`, {
      method: 'POST',
      body: form,
    })
    return parseResponse<ComfyUploadResult>(response)
  },

  uploadVideo: async (
    file: File | Blob,
    filename?: string,
    projectId?: string
  ): Promise<ComfyVideoUploadResult> => {
    const form = new FormData()
    form.append('file', file, filename ?? (file instanceof File ? file.name : 'upload.mp4'))
    if (projectId) form.append('projectId', projectId)
    const response = await fetch(`${baseUrl}/comfyui/upload-video`, {
      method: 'POST',
      body: form,
    })
    return parseResponse<ComfyVideoUploadResult>(response)
  },

  uploadImageFromUrl: async (url: string): Promise<ComfyUploadResult> => {
    const response = await fetch(`${baseUrl}/comfyui/upload-image-from-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    })
    return parseResponse<ComfyUploadResult>(response)
  },
}

export interface ComfyProgress {
  status: 'running' | 'done' | 'error'
  value: number
  max: number
  percent: number
  message: string
  urls?: string[]
  /** 按 OutputSlot.key 分组的 URL 列表（key = ComfyUI SaveXxx 节点 id），仅 done 时填充 */
  urlsBySlot?: Record<string, string[]>
}

export function parseParams(schema?: string): ComfyParam[] {
  if (!schema) return []
  try {
    const parsed = JSON.parse(schema)
    if (Array.isArray(parsed)) return parsed as ComfyParam[]
    if (parsed && Array.isArray(parsed.value)) return parsed.value as ComfyParam[]
    return []
  } catch {
    return []
  }
}
