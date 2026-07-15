import request from '@/utils/request'

export interface ShotSuggestion {
  index: number
  sourceVideoId: string
  sourceVideoName: string
  shotType: string
  description: string
  duration: string
  tags: string
  prompt: string
}

export interface FusionTaskItem {
  id: string
  projectId: string
  fusionMode: string
  fusionModeName: string
  scriptOutline: string
  shotSuggestions: ShotSuggestion[]
  sourceVideos: string[]
  status: number
  progress: number
  errorMsg: string
  createTime: string
}

export interface FusionCreateData {
  projectId: string
  videoIds: string[]
  fusionMode: string
}

export const createFusionTask = (data: FusionCreateData) => {
  return request.post('/fusion', data)
}

export const getFusionResult = (id: string) => {
  return request.get(`/fusion/${id}/result`)
}

export const getFusionTaskList = (projectId: string) => {
  return request.get('/fusion', { params: { projectId } })
}

export const regenerateFusion = (id: string) => {
  return request.post(`/fusion/${id}/regenerate`)
}
