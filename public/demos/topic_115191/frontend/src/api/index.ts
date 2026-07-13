/** 后端 REST API 客户端。 */
import axios from 'axios'
import type { AssetType, DirectorStage, LibraryData, ProjectDetail, ProjectListItem, SceneDescription } from '../types'

const api = axios.create({ baseURL: '/api' })

export const projectsApi = {
  create: (name: string) => api.post<ProjectDetail>('/projects', { name }).then(r => r.data),
  list: () => api.get<ProjectListItem[]>('/projects').then(r => r.data),
  get: (id: string) => api.get<ProjectDetail>(`/projects/${id}`).then(r => r.data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  saveCanvas: (id: string, canvas_state: any) => api.put(`/projects/${id}/canvas`, { canvas_state }),
  update: (id: string, data: { name?: string; pinned?: boolean }) =>
    api.put(`/projects/${id}`, data).then(r => r.data),
}

export const scriptApi = {
  upload: (projectId: string, script_text: string) =>
    api.post(`/projects/${projectId}/script`, { script_text }).then(r => r.data),
}

export const assetsApi = {
  update: (type: AssetType, id: string, data: { name?: string; description?: string; prompt?: string }) =>
    api.put(`/assets/${type}/${id}`, data),
  regenerate: (type: AssetType, id: string) =>
    api.post(`/assets/${type}/${id}/regenerate`).then(r => r.data),
}

export const storyboardsApi = {
  update: (id: string, data: { prompt?: string; director_stage_ref_ids?: string[] }) =>
    api.put(`/storyboards/${id}`, data),
  regenerate: (id: string) =>
    api.post(`/storyboards/${id}/regenerate`).then(r => r.data),
}

export const videosApi = {
  regenerate: (id: string) =>
    api.post(`/videos/${id}/regenerate`).then(r => r.data),
}

export const directorStagesApi = {
  create: (projectId: string, name?: string) =>
    api.post<DirectorStage>('/director-stages', { project_id: projectId, name }).then(r => r.data),
  get: (id: string) =>
    api.get<DirectorStage>(`/director-stages/${id}`).then(r => r.data),
  update: (id: string, data: Partial<DirectorStage>) =>
    api.put<DirectorStage>(`/director-stages/${id}`, data).then(r => r.data),
  remove: (id: string) =>
    api.delete(`/director-stages/${id}`),
  uploadScreenshot: (id: string, cameraId: string, blob: Blob) => {
    const form = new FormData()
    form.append('camera_id', cameraId)
    form.append('file', blob, 'screenshot.png')
    return api.post<{ id: string; camera_id: string; filename: string; image_path: string; created_at: string }>(
      `/director-stages/${id}/screenshots`,
      form,
    ).then(r => r.data)
  },
  generate3DScene: (stageId: string, prompt: string) =>
    api.post<{ scene_description: SceneDescription }>(`/director-stages/${stageId}/generate-3d`, { prompt }).then(r => r.data.scene_description),
}

export const libraryApi = {
  get: () => api.get<LibraryData>('/library').then(r => r.data),
}

/** 图片 URL 构造 */
export function imageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null
  return `/storage/${imagePath}`
}

/** 视频 URL 构造（本地存储的 mp4） */
export function videoUrl(videoPath: string | null): string | null {
  if (!videoPath) return null
  return `/storage/${videoPath}`
}
