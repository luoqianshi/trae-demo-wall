import request from '@/utils/request'

// ===== 类型定义 =====

/** 音频生成模式 */
export type AudioGenMode = 'VOICE_CLONE' | 'TEXT_TO_SPEECH' | 'VOICE_CONVERSION'

/** 音频项目 */
export interface AudioItem {
  id: string
  projectId: string
  userId: string
  filename: string
  storagePath: string
  bucketName: string
  fileSize: number
  duration: number
  format: string
  audioUrl?: string
  createTime: string
  updateTime: string
}

/** 音频任务项 */
export interface AudioTaskItem {
  id: string
  projectId: string
  mode: AudioGenMode
  modeName: string
  sourceAudioId?: string
  sourceAudioName?: string
  text?: string
  voiceId?: string
  voiceName?: string
  params?: AudioTaskParams
  resultAudioId?: string
  resultAudioName?: string
  resultAudioUrl?: string
  status: number
  progress: number
  errorMsg?: string
  createTime: string
  updateTime?: string
}

/** 音频任务参数 */
export interface AudioTaskParams {
  speed?: number
  pitch?: number
  emotion?: string
  [key: string]: any
}

/** 音色项目 */
export interface VoiceItem {
  id: string
  projectId: string
  voiceName: string
  gender: 'male' | 'female' | 'neutral'
  language: string
  description?: string
  previewUrl?: string
  createTime: string
}

/** 创建人声克隆任务参数 */
export interface VoiceCloneTaskData {
  projectId: string
  sourceAudioId: string
  voiceName: string
}

/** 创建 TTS 任务参数 */
export interface TtsTaskData {
  projectId: string
  text: string
  voiceId: string
  params?: AudioTaskParams
}

/** 创建音色转换任务参数 */
export interface VoiceConversionTaskData {
  projectId: string
  sourceAudioId: string
  voiceId: string
  params?: AudioTaskParams
}

// ===== 音频管理 API =====

/** 获取音频列表 */
export const getAudioList = (projectId: string) => {
  return request.get('/audio', { params: { projectId } })
}

/** 获取单个音频详情 */
export const getAudioDetail = (id: string) => {
  return request.get(`/audio/${id}`)
}

/** 上传音频 */
export const uploadAudio = (projectId: string, file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('projectId', projectId)
  return request.post('/audio/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
}

/** 删除音频 */
export const deleteAudio = (id: string) => {
  return request.delete(`/audio/${id}`)
}

/** 下载音频 */
export const downloadAudio = (id: string) => {
  return request.get(`/audio/${id}/download`, { responseType: 'blob' })
}

// ===== 音频任务 API =====

/** 创建人声克隆任务 */
export const createVoiceCloneTask = (data: VoiceCloneTaskData) => {
  return request.post('/audio/voice-clone', data)
}

/** 创建 TTS 任务 */
export const createTtsTask = (data: TtsTaskData) => {
  return request.post('/audio/text-to-speech', data)
}

/** 创建音色转换任务 */
export const createVoiceConversionTask = (data: VoiceConversionTaskData) => {
  return request.post('/audio/voice-conversion', data)
}

/** 获取任务结果 */
export const getAudioTaskResult = (id: string) => {
  return request.get(`/audio/task/${id}/result`)
}

/** 获取任务列表 */
export const getAudioTaskList = (projectId: string) => {
  return request.get('/audio/tasks', { params: { projectId } })
}

/** 重新生成任务 */
export const regenerateAudioTask = (id: string) => {
  return request.post(`/audio/task/${id}/regenerate`)
}

// ===== 音色管理 API =====

/** 获取音色列表 */
export const getVoiceList = () => {
  return request.get('/audio/voices')
}

/** 获取单个音色详情 */
export const getVoiceDetail = (id: string) => {
  return request.get(`/audio/voices/${id}`)
}

/** 试听音色 */
export const previewVoice = (id: string) => {
  return request.get(`/audio/voices/${id}/preview`, { responseType: 'blob' })
}

/** 删除音色 */
export const deleteVoice = (id: string) => {
  return request.delete(`/audio/voices/${id}`)
}

// ===== AI 服务配置 API =====

/** 测试 TTS 服务 */
export const testTtsService = (data: { endpoint: string; apiKey?: string }) => {
  return request.post('/ai/tts/test', data)
}

/** 测试 RVC 服务 */
export const testRvcService = (data: { endpoint: string; apiKey?: string }) => {
  return request.post('/ai/rvc/test', data)
}