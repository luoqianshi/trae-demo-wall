import { apiClient } from '@/lib/api-client'

// ===== 类型定义 =====

export interface DiaryItem {
  id: string
  title?: string
  content?: string
  summary?: string
  shortSummary?: string
  category?: string
  mood?: string
  moodScore?: number
  audioUrl?: string
  audioDurationSec?: number
  wordCount?: number
  aiAnalysisStatus?: string
  diaryDate?: string
  createTime?: string
  updateTime?: string
  tags?: string[]
}

export interface DiaryAddRequest {
  title?: string
  content: string
  category?: string
  mood?: string
  audioUrl?: string
  audioDurationSec?: number
  diaryDate?: string
  modelConfigId?: string
}

export interface DiaryUpdateRequest {
  id: string
  title?: string
  content?: string
  summary?: string
  category?: string
  mood?: string
  moodScore?: number
  diaryDate?: string
}

export interface DiaryQueryRequest {
  current?: number
  pageSize?: number
  searchText?: string
  category?: string
  mood?: string
  startDate?: string
  endDate?: string
}

export interface DiaryCategory {
  id: string
  name: string
  color: string
  icon: string
  sort: number
  isPreset: number
}

export interface TranscribeResult {
  audioUrl: string
  plainText: string
  durationSec: number
}

export interface TimelineBucket {
  key: string
  count: number
  avgMoodScore: number
  items: {
    id: string
    title?: string
    summary?: string
    mood?: string
    moodScore?: number
    category?: string
    diaryDate?: string
    audioUrl?: string
    wordCount?: number
  }[]
}

// ===== API =====

export const diaryApi = {
  list: async (params: DiaryQueryRequest) => {
    const res = await apiClient.post('/diary/list/page', {
      current: params.current ?? 1,
      pageSize: params.pageSize ?? 20,
      ...params,
    })
    return res.data as { records: DiaryItem[]; total: number; current: number; pageSize: number }
  },

  get: async (id: string) => {
    const res = await apiClient.get('/diary/get', { params: { id } })
    return res.data as DiaryItem
  },

  add: async (data: DiaryAddRequest) => {
    const res = await apiClient.post('/diary/add', data)
    return res.data as string
  },

  update: async (data: DiaryUpdateRequest) => {
    const res = await apiClient.post('/diary/update', data)
    return res.data as boolean
  },

  delete: async (id: string) => {
    const res = await apiClient.post('/diary/delete', { id })
    return res.data as boolean
  },

  timeline: async (params: {
    granularity?: string
    startDate?: string
    endDate?: string
    category?: string
    mood?: string
  }) => {
    const res = await apiClient.post('/diary/timeline', params)
    return res.data as TimelineBucket[]
  },

  moodTrend: async (startDate?: string, endDate?: string) => {
    const res = await apiClient.get('/diary/mood-trend', {
      params: { startDate, endDate },
    })
    return res.data as { date: string; moodScore: number; mood: string }[]
  },

  reanalyze: async (diaryId: string, modelConfigId: string) => {
    const res = await apiClient.post('/diary/reanalyze', null, {
      params: { diaryId, modelConfigId },
    })
    return res.data as boolean
  },

  transcribe: async (file: Blob) => {
    const formData = new FormData()
    formData.append('file', file)
    const res = await apiClient.post('/diary/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 600000,
    })
    return res.data as TranscribeResult
  },
}

export const diaryCategoryApi = {
  list: async () => {
    const res = await apiClient.get('/diary/category/list')
    return res.data as DiaryCategory[]
  },

  add: async (data: { name: string; color?: string; icon?: string; sort?: number }) => {
    const res = await apiClient.post('/diary/category/add', data)
    return res.data as string
  },

  update: async (data: {
    id: string
    name?: string
    color?: string
    icon?: string
    sort?: number
  }) => {
    const res = await apiClient.post('/diary/category/update', data)
    return res.data as boolean
  },

  delete: async (id: string) => {
    const res = await apiClient.post('/diary/category/delete', { id })
    return res.data as boolean
  },
}

// ===== 里程碑 =====

export interface Milestone {
  id: string
  title: string
  description?: string
  targetDate?: string
  achievedDate?: string
  status: 'active' | 'achieved'
  linkedDiaryId?: string
  color: string
  sort: number
  createTime?: string
}

export const milestoneApi = {
  list: async (status?: string) => {
    const res = await apiClient.get('/diary/milestone/list', { params: { status } })
    return res.data as Milestone[]
  },

  add: async (data: {
    title: string
    description?: string
    targetDate?: string
    color?: string
    sort?: number
  }) => {
    const res = await apiClient.post('/diary/milestone/add', data)
    return res.data as string
  },

  update: async (data: {
    id: string
    title?: string
    description?: string
    targetDate?: string
    status?: string
    color?: string
    sort?: number
    linkedDiaryId?: string
  }) => {
    const res = await apiClient.post('/diary/milestone/update', data)
    return res.data as boolean
  },

  delete: async (id: string) => {
    const res = await apiClient.post('/diary/milestone/delete', { id })
    return res.data as boolean
  },

  achieve: async (id: string, linkedDiaryId?: string) => {
    const res = await apiClient.post('/diary/milestone/achieve', null, {
      params: { id, linkedDiaryId },
    })
    return res.data as boolean
  },
}
