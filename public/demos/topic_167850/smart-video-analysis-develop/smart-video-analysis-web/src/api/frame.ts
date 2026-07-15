import request from '@/utils/request'

// ===== 类型定义 =====
export interface FrameInfo {
  frameId: string
  frameIndex: number
  timestampMs: number
  storagePath: string
  bucketName: string
  sceneTags?: string
  promptText?: string
  thumbnailUrl?: string
}

export interface FrameExtractData {
  videoId: string
  filename?: string
  startMs?: number
  endMs?: number
  frameIndexes?: number[]
  intervalMs?: number
}

export interface FrameExtractResult {
  videoId: string
  videoFilename: string
  frames: FrameInfo[]
  total: number
}

export type FrameGenMode = 'SINGLE_REDRAW' | 'START_END_FUSION' | 'SEGMENT_REMAKE' | 'MULTI_SEGMENT_FUSION'

export interface FrameTaskParams {
  resolution?: number
  steps?: number
  cfg?: number
  sampler?: string
  scheduler?: string
  seed?: number
  prompt?: string
  negativePrompt?: string
  model?: string
  denoise?: number
  duration?: number
  [key: string]: any
}

export interface FrameTaskCreateData {
  projectId: string
  videoId?: string
  mode: FrameGenMode
  sourceFrames?: FrameInfo[]
  params?: FrameTaskParams
}

export interface FrameTaskResult {
  index: number
  type: 'image' | 'video'
  filename: string
  storagePath: string
  bucketName: string
  resolution?: string
  duration?: string
  url?: string
}

export interface FrameTaskVO {
  id: string
  projectId: string
  videoId?: string
  mode: FrameGenMode
  modeName: string
  params?: FrameTaskParams
  sourceFrames?: FrameInfo[]
  results?: FrameTaskResult[]
  comfyuiTaskId?: string
  status: number
  progress: number
  errorMsg?: string
  createTime: string
  updateTime?: string
}

export interface AiServiceConfig {
  id?: string
  serviceType: string
  endpoint: string
  apiKey?: string
  enabled?: number
  isDefault?: number
}

export interface ComfyUiTestResult {
  connected: boolean
  message: string
  systemInfo?: any
}

// ===== 帧级创作 API =====
export const createFrameTask = (data: FrameTaskCreateData) => {
  return request.post('/frame', data)
}

export const getFrameTaskResult = (id: string) => {
  return request.get(`/frame/${id}/result`)
}

export const getFrameTaskList = (projectId: string) => {
  return request.get('/frame', { params: { projectId } })
}

export const regenerateFrameTask = (id: string) => {
  return request.post(`/frame/${id}/regenerate`)
}

export const extractFrames = (data: FrameExtractData) => {
  return request.post('/frame/extract', data)
}

// ===== AI 服务配置 API =====
export const getAiConfigs = () => {
  return request.get('/ai/configs')
}

export const getAiConfig = (serviceType: string) => {
  return request.get(`/ai/configs/${serviceType}`)
}

export const saveAiConfig = (data: AiServiceConfig) => {
  return request.post('/ai/configs', data)
}

export const deleteAiConfig = (id: string) => {
  return request.delete(`/ai/configs/${id}`)
}

export const testComfyUi = () => {
  return request.post('/ai/comfyui/test')
}

export const testComfyUiCustom = (endpoint: string, apiKey: string) => {
  return request.post('/ai/comfyui/test-custom', { endpoint, apiKey })
}
