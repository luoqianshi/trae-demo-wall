interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export type TagColorKey =
  | 'gray'
  | 'red'
  | 'orange'
  | 'amber'
  | 'yellow'
  | 'green'
  | 'teal'
  | 'blue'
  | 'indigo'
  | 'purple'
  | 'pink'
  | 'brown'

export interface TagCategory {
  id: string
  name: string
  color: TagColorKey
  sort: number
  description?: string
  tags?: Tag[]
  createTime?: string
  updateTime?: string
}

export interface Tag {
  id: string
  categoryId?: string
  categoryName?: string
  categoryColor?: TagColorKey
  name: string
  color: TagColorKey
  sort: number
  createTime?: string
  updateTime?: string
}

export interface TagCategoryAddRequest {
  name: string
  color?: TagColorKey
  sort?: number
  description?: string
}

export interface TagCategoryUpdateRequest {
  id: string
  name?: string
  color?: TagColorKey
  sort?: number
  description?: string
}

export interface TagAddRequest {
  categoryId?: string
  name: string
  color?: TagColorKey
  sort?: number
}

export interface TagUpdateRequest {
  id: string
  categoryId?: string
  name?: string
  color?: TagColorKey
  sort?: number
}

export interface TagQueryRequest {
  current: number
  pageSize: number
  categoryId?: string
  name?: string
  searchText?: string
}

export interface TagBindRequest {
  tagIds: string[]
  targetType: string
  targetId: string
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

export const tagCategoryApi = {
  add: async (data: TagCategoryAddRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/tag-category/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  update: async (data: TagCategoryUpdateRequest): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/tag-category/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/tag-category/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id),
    })
    return parseResponse<boolean>(response)
  },

  list: async (): Promise<TagCategory[]> => {
    const response = await fetch(`${baseUrl}/tag-category/list`)
    return parseResponse<TagCategory[]>(response)
  },
}

export const tagApi = {
  add: async (data: TagAddRequest): Promise<string> => {
    const response = await fetch(`${baseUrl}/tag/add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<string>(response)
  },

  update: async (data: TagUpdateRequest): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/tag/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  delete: async (id: string): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/tag/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(id),
    })
    return parseResponse<boolean>(response)
  },

  listPage: async (params: TagQueryRequest): Promise<{ list: Tag[]; total: number }> => {
    const response = await fetch(`${baseUrl}/tag/list/page`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    })
    const data = await parseResponse<{ records: Tag[]; total: number }>(response)
    return { list: data.records, total: data.total }
  },

  listAll: async (): Promise<Tag[]> => {
    const response = await fetch(`${baseUrl}/tag/list/all`)
    return parseResponse<Tag[]>(response)
  },
}

export const tagRelationApi = {
  bind: async (data: TagBindRequest): Promise<boolean> => {
    const response = await fetch(`${baseUrl}/tag-relation/bind`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    return parseResponse<boolean>(response)
  },

  listByTarget: async (targetType: string, targetId: string): Promise<Tag[]> => {
    const response = await fetch(
      `${baseUrl}/tag-relation/listByTarget?targetType=${encodeURIComponent(targetType)}&targetId=${encodeURIComponent(targetId)}`
    )
    return parseResponse<Tag[]>(response)
  },

  listTargets: async (tagId: string, targetType?: string): Promise<string[]> => {
    const params = new URLSearchParams({ tagId })
    if (targetType) params.set('targetType', targetType)
    const response = await fetch(`${baseUrl}/tag-relation/listTargets?${params}`)
    return parseResponse<string[]>(response)
  },
}
