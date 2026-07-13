interface ApiResponse<T> {
  code: number
  data: T
  message: string
}

export interface NovelItem {
  id: string
  title: string
  summary?: string
  coverUrl?: string
  genre?: string
  tags?: string
  wordCount?: number
  status?: string
  createTime?: string
  updateTime?: string
}

export interface NovelAddRequest {
  title: string
  summary?: string
  coverUrl?: string
  genre?: string
  tags?: string
}

export interface NovelUpdateRequest {
  id: string
  title?: string
  summary?: string
  coverUrl?: string
  genre?: string
  tags?: string
  status?: string
}

export interface NovelQueryRequest {
  current?: number
  pageSize?: number
  searchText?: string
  status?: string
  genre?: string
}

export interface NovelOutlineNode {
  id: string
  novelId: string
  parentId?: string | null
  level: number
  title: string
  summary?: string
  content?: string
  sortOrder?: number
  wordCount?: number
  createTime?: string
  updateTime?: string
  children?: NovelOutlineNode[]
}

export interface NovelOutlineAddRequest {
  novelId: string
  parentId?: string | null
  level: number
  title?: string
  summary?: string
  sortOrder?: number
}

export interface NovelOutlineUpdateRequest {
  id: string
  title?: string
  summary?: string
  content?: string
  sortOrder?: number
}

export interface NovelOutlineReorderItem {
  id: string
  parentId?: string | null
  sortOrder?: number
  level?: number
}

export interface NovelCharacterItem {
  id: string
  novelId: string
  name: string
  alias?: string
  avatarUrl?: string
  identity?: string
  personality?: string
  background?: string
  appearance?: string
  catchphrase?: string
  remark?: string
  chapterIds?: string
  canvasPos?: string
  attributes?: string
  createTime?: string
  updateTime?: string
}

export interface NovelCharacterAddRequest {
  novelId: string
  name: string
  alias?: string
  avatarUrl?: string
  identity?: string
  personality?: string
  background?: string
  appearance?: string
  catchphrase?: string
  remark?: string
  chapterIds?: string
  canvasPos?: string
  attributes?: string
}

export interface NovelCharacterUpdateRequest extends Partial<NovelCharacterAddRequest> {
  id: string
}

export interface CharacterAttribute {
  key: string
  value: string
  type?: 'text' | 'number' | 'progress'
}

export interface NovelCharacterSnapshot {
  id: string
  novelId: string
  characterId: string
  eventId?: string | null
  label: string
  attributes?: string
  note?: string
  sortOrder?: number
  createTime?: string
  updateTime?: string
}

export interface NovelCharacterSnapshotSaveRequest {
  id?: string
  novelId: string
  characterId: string
  eventId?: string | null
  label: string
  attributes?: string
  note?: string
  sortOrder?: number
}

export interface NovelTimelineEvent {
  id: string
  novelId: string
  title: string
  description?: string
  timeLabel?: string
  sortOrder?: number
  chapterId?: string | null
  characterIds?: string
  importance?: number
  color?: string
  createTime?: string
  updateTime?: string
}

export interface NovelTimelineEventSaveRequest {
  id?: string
  novelId: string
  title: string
  description?: string
  timeLabel?: string
  sortOrder?: number
  chapterId?: string | null
  characterIds?: string
  importance?: number
  color?: string
}

export interface NovelRelationItem {
  id: string
  novelId: string
  sourceId: string
  targetId: string
  relationType: string
  description?: string
  createTime?: string
}

export interface NovelRelationAddRequest {
  novelId: string
  sourceId: string
  targetId: string
  relationType: string
  description?: string
}

export interface NovelSettingItem {
  id: string
  novelId: string
  category: string
  name: string
  brief?: string
  content?: string
  createTime?: string
  updateTime?: string
}

export interface NovelSettingAddRequest {
  novelId: string
  category: string
  name: string
  brief?: string
  content?: string
}

export interface NovelSettingUpdateRequest extends Partial<NovelSettingAddRequest> {
  id: string
}

export interface NovelAiRequest {
  action: 'continue' | 'polish' | 'consistency' | 'summarize'
  modelConfigId: string
  text: string
  instruction?: string
  novelId?: string
  characterIds?: string[]
  candidateCount?: number
}

const baseUrl = '/api'

async function parseResponse<T>(response: Response): Promise<T> {
  const result = (await response.json()) as ApiResponse<T>
  if (result.code !== 0) {
    throw new Error(result.message || '请求失败')
  }
  return result.data
}

function postJson<T>(path: string, body: unknown): Promise<T> {
  return fetch(`${baseUrl}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  }).then(parseResponse<T>)
}

function getJson<T>(path: string): Promise<T> {
  return fetch(`${baseUrl}${path}`).then(parseResponse<T>)
}

export const novelApi = {
  add: (data: NovelAddRequest) => postJson<string>('/novel/add', data),
  update: (data: NovelUpdateRequest) => postJson<boolean>('/novel/update', data),
  delete: (id: string) => postJson<boolean>('/novel/delete', { id }),
  get: (id: string) => getJson<NovelItem>(`/novel/get?id=${encodeURIComponent(id)}`),
  list: async (params: NovelQueryRequest): Promise<{ list: NovelItem[]; total: number }> => {
    const data = await postJson<{ records: NovelItem[]; total: number }>('/novel/list/page', params)
    return { list: data.records, total: data.total }
  },
}

export const novelOutlineApi = {
  add: (data: NovelOutlineAddRequest) => postJson<string>('/novel/outline/add', data),
  update: (data: NovelOutlineUpdateRequest) => postJson<boolean>('/novel/outline/update', data),
  delete: (id: string) => postJson<boolean>('/novel/outline/delete', { id }),
  tree: (novelId: string) =>
    getJson<NovelOutlineNode[]>(`/novel/outline/tree?novelId=${encodeURIComponent(novelId)}`),
  get: (id: string) => getJson<NovelOutlineNode>(`/novel/outline/get?id=${encodeURIComponent(id)}`),
  reorder: (novelId: string, items: NovelOutlineReorderItem[]) =>
    postJson<boolean>('/novel/outline/reorder', { novelId, items }),
}

export const novelCharacterApi = {
  add: (data: NovelCharacterAddRequest) => postJson<string>('/novel/character/add', data),
  update: (data: NovelCharacterUpdateRequest) => postJson<boolean>('/novel/character/update', data),
  delete: (id: string) => postJson<boolean>('/novel/character/delete', { id }),
  list: (novelId: string) =>
    getJson<NovelCharacterItem[]>(`/novel/character/list?novelId=${encodeURIComponent(novelId)}`),
}

export const novelRelationApi = {
  add: (data: NovelRelationAddRequest) => postJson<string>('/novel/relation/add', data),
  update: (data: { id: string; relationType?: string; description?: string }) =>
    postJson<boolean>('/novel/relation/update', data),
  delete: (id: string) => postJson<boolean>('/novel/relation/delete', { id }),
  list: (novelId: string) =>
    getJson<NovelRelationItem[]>(`/novel/relation/list?novelId=${encodeURIComponent(novelId)}`),
}

export const novelSettingApi = {
  add: (data: NovelSettingAddRequest) => postJson<string>('/novel/setting/add', data),
  update: (data: NovelSettingUpdateRequest) => postJson<boolean>('/novel/setting/update', data),
  delete: (id: string) => postJson<boolean>('/novel/setting/delete', { id }),
  list: (novelId: string, category?: string) =>
    getJson<NovelSettingItem[]>(
      `/novel/setting/list?novelId=${encodeURIComponent(novelId)}${category ? `&category=${encodeURIComponent(category)}` : ''}`
    ),
}

export const novelAiApi = {
  continueWriting: (data: NovelAiRequest) => postJson<string>('/novel/ai/continue', data),
  polish: (data: NovelAiRequest) => postJson<string[]>('/novel/ai/polish', data),
  consistency: (data: NovelAiRequest) => postJson<string>('/novel/ai/consistency', data),
  summarize: (data: NovelAiRequest) => postJson<string>('/novel/ai/summarize', data),
}

export const novelSnapshotApi = {
  save: (data: NovelCharacterSnapshotSaveRequest) => postJson<string>('/novel/snapshot/save', data),
  delete: (id: string) => postJson<boolean>('/novel/snapshot/delete', { id }),
  listByCharacter: (characterId: string) =>
    getJson<NovelCharacterSnapshot[]>(
      `/novel/snapshot/list/character?characterId=${encodeURIComponent(characterId)}`
    ),
  listByNovel: (novelId: string) =>
    getJson<NovelCharacterSnapshot[]>(
      `/novel/snapshot/list/novel?novelId=${encodeURIComponent(novelId)}`
    ),
  listByEvent: (eventId: string) =>
    getJson<NovelCharacterSnapshot[]>(
      `/novel/snapshot/list/event?eventId=${encodeURIComponent(eventId)}`
    ),
}

export const novelTimelineApi = {
  save: (data: NovelTimelineEventSaveRequest) => postJson<string>('/novel/timeline/save', data),
  delete: (id: string) => postJson<boolean>('/novel/timeline/delete', { id }),
  list: (novelId: string) =>
    getJson<NovelTimelineEvent[]>(`/novel/timeline/list?novelId=${encodeURIComponent(novelId)}`),
  reorder: (novelId: string, items: { id: string; sortOrder: number }[]) =>
    postJson<boolean>('/novel/timeline/reorder', { novelId, items }),
}

export function parseAttributes(json?: string): CharacterAttribute[] {
  if (!json) return []
  try {
    const parsed = JSON.parse(json)
    if (Array.isArray(parsed)) {
      return parsed
        .filter((x) => x && typeof x === 'object')
        .map((x) => ({
          key: String((x as { key?: unknown }).key ?? ''),
          value: String((x as { value?: unknown }).value ?? ''),
          type: ((x as { type?: unknown }).type as CharacterAttribute['type']) ?? 'text',
        }))
        .filter((x) => x.key.length > 0)
    }
  } catch {
    // ignore
  }
  return []
}

export function stringifyAttributes(attrs: CharacterAttribute[]): string {
  return JSON.stringify(
    attrs
      .filter((a) => a.key.trim().length > 0)
      .map((a) => ({ key: a.key.trim(), value: a.value, type: a.type ?? 'text' }))
  )
}
