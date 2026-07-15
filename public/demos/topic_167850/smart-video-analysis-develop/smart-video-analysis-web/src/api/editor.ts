import request from '@/utils/request'

export const getEditorProjectList = (params?: any) => {
  return request.get('/editor/projects', { params })
}

export const createEditorProject = (data: any) => {
  return request.post('/editor/projects', data)
}

export const getEditorProject = (id: string) => {
  return request.get(`/editor/projects/${id}`)
}

export const updateEditorProject = (id: string, data: any) => {
  return request.put(`/editor/projects/${id}`, data)
}

export const deleteEditorProject = (id: string) => {
  return request.delete(`/editor/projects/${id}`)
}

export const getTracks = (projectId: string) => {
  return request.get(`/editor/projects/${projectId}/tracks`)
}

export const createTrack = (data: any) => {
  return request.post('/editor/tracks', data)
}

export const updateTrack = (id: string, data: any) => {
  return request.put(`/editor/tracks/${id}`, data)
}

export const deleteTrack = (id: string) => {
  return request.delete(`/editor/tracks/${id}`)
}

export const getClips = (trackId: string) => {
  return request.get(`/editor/tracks/${trackId}/clips`)
}

export const createClip = (data: any) => {
  return request.post('/editor/clips', data)
}

export const updateClip = (id: string, data: any) => {
  return request.put(`/editor/clips/${id}`, data)
}

export const deleteClip = (id: string) => {
  return request.delete(`/editor/clips/${id}`)
}

export const saveTimeline = (projectId: string, data: any) => {
  return request.post(`/editor/projects/${projectId}/timeline`, data)
}

export const getTimeline = (projectId: string) => {
  return request.get(`/editor/projects/${projectId}/timeline`)
}

export const getMaterialLibrary = (params?: any) => {
  return request.get('/editor/materials', { params })
}

export const aiAnalyze = (projectId: string) => {
  return request.post(`/editor/projects/${projectId}/analyze`)
}

export const exportVideo = (projectId: string, data?: any) => {
  return request.post(`/editor/projects/${projectId}/export`, data)
}

export const getExportProgress = (projectId: string) => {
  return request.get(`/editor/projects/${projectId}/export/progress`)
}