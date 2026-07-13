interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export interface ComfyProject {
  id: string
  name: string
  description?: string
  graphJson: string
  createTime?: string
  updateTime?: string
}

export const comfyuiProjectApi = {
  list: async (): Promise<ComfyProject[]> => {
    const response = await fetch(`${baseUrl}/comfyui/project/list`)
    return parseResponse<ComfyProject[]>(response)
  },

  create: async (name: string, graphJson?: string): Promise<ComfyProject> => {
    const response = await fetch(`${baseUrl}/comfyui/project/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, graphJson }),
    })
    return parseResponse<ComfyProject>(response)
  },

  get: async (id: string): Promise<ComfyProject> => {
    const response = await fetch(`${baseUrl}/comfyui/project/get?id=${encodeURIComponent(id)}`)
    return parseResponse<ComfyProject>(response)
  },

  save: async (id: string, graphJson: string, name?: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/comfyui/project/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, graphJson, name }),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/comfyui/project/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  /**
   * 迁移画布文件到 <projectId>/ 子目录（支持从旧的 <projectName>/ 迁移）。
   * mode: 'graphJson'（默认）仅迁移画布引用的文件；'all' 迁移根目录下所有散落文件
   */
  migrateFiles: async (
    projectId: string,
    mode: 'graphJson' | 'all' = 'graphJson'
  ): Promise<{ moved: number; skipped: number; errors: number; dirName: string; oldDirName: string }> => {
    const response = await fetch(`${baseUrl}/comfyui/project/migrate-files`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ projectId, mode }),
    })
    return parseResponse(response)
  },
}
