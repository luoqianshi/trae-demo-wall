import type { ComicProject } from '../types'

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

export interface ComicProjectCreatePayload {
  name: string
  description?: string
  canvasWidth?: number
  canvasHeight?: number
  comicData?: string
}

export interface ComicProjectSavePayload {
  id: string
  name?: string
  description?: string
  canvasWidth?: number
  canvasHeight?: number
  comicData?: string
  thumbnailUrl?: string
}

export const comicProjectApi = {
  list: async (): Promise<ComicProject[]> => {
    const response = await fetch(`${baseUrl}/comic/project/list`)
    return parseResponse<ComicProject[]>(response)
  },

  create: async (payload: ComicProjectCreatePayload): Promise<ComicProject> => {
    const response = await fetch(`${baseUrl}/comic/project/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<ComicProject>(response)
  },

  get: async (id: string): Promise<ComicProject> => {
    const response = await fetch(`${baseUrl}/comic/project/get?id=${encodeURIComponent(id)}`)
    return parseResponse<ComicProject>(response)
  },

  save: async (payload: ComicProjectSavePayload): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/comic/project/save`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/comic/project/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    })
    return parseResponse<boolean>(response)
  },

  /**
   * 从指定的 ComfyUI 画布项目 graphJson 中解析出全部图片素材
   * 返回 [{ id, name, url }]
   */
  listComfyuiAssets: async (
    comfyuiProjectId: string
  ): Promise<Array<{ id: string; name: string; url: string }>> => {
    const response = await fetch(
      `${baseUrl}/comic/project/list-comfyui-assets?projectId=${encodeURIComponent(comfyuiProjectId)}`
    )
    return parseResponse<Array<{ id: string; name: string; url: string }>>(response)
  },
}
