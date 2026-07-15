import request from '@/utils/request'

export interface PresignUrlParams {
  filename: string
  contentType: string
  projectId?: string
}

export interface CreateVideoData {
  filename: string
  storagePath: string
  bucketName: string
  fileSize: number
  projectId: string
}

export interface VideoItem {
  id: string
  projectId: string
  userId: string
  filename: string
  storagePath: string
  bucketName: string
  fileSize: number
  duration?: number
  width?: number
  height?: number
  fps?: number
  format?: string
  status: number
  createTime: string
  updateTime: string
}

export interface VideoAnalysisItem {
  id: string
  videoId: string
  transcriptJson?: string
  framesJson?: string
  promptsJson?: string
  summary?: string
  status: number
  progress: number
  errorMsg?: string
  createTime: string
  updateTime: string
}

export interface VideoFrameItem {
  id: string
  videoId: string
  analysisId?: string
  frameIndex: number
  timestampMs: number
  storagePath: string
  bucketName: string
  sceneTags?: string
  promptText?: string
  isKeyFrame: number
  createTime: string
}

export interface TranscriptItem {
  startTime: string
  endTime?: string
  timestampMs: number
  text: string
  speaker?: string
  confidence?: number
}

export interface AnalysisResultDetail {
  video: VideoItem
  videoUrl: string
  analysis: VideoAnalysisItem
  frames: VideoFrameItem[]
  transcriptList: TranscriptItem[]
}

export const getPresignUrl = (params: PresignUrlParams) => {
  return request.get('/videos/presign', { params })
}

export const createVideo = (data: CreateVideoData) => {
  return request.post('/videos', data)
}

export const getVideoList = (projectId: string) => {
  return request.get('/videos', { params: { projectId } })
}

export const getVideoDetail = (id: string) => {
  return request.get(`/videos/${id}`)
}

export const analyzeVideo = (id: string) => {
  return request.post(`/videos/${id}/analyze`)
}

export const getAnalysisProgress = (id: string) => {
  return request.get(`/videos/${id}/analysis`)
}

export const getVideoFrames = (id: string) => {
  return request.get(`/videos/${id}/frames`)
}

export const getAnalysisResultDetail = (id: string) => {
  return request.get(`/videos/${id}/analysis-detail`)
}

export const exportTranscript = (id: string, format: string) => {
  return request.get(`/videos/${id}/export/transcript`, {
    params: { format },
    responseType: 'blob'
  })
}

export const exportPrompts = (id: string) => {
  return request.get(`/videos/${id}/export/prompts`, {
    responseType: 'blob'
  })
}

export const deleteVideo = (id: string) => {
  return request.delete(`/videos/${id}`)
}
