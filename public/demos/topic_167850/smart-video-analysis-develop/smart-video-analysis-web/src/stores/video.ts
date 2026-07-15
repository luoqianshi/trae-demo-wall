import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import {
  getVideoList,
  getVideoDetail,
  getPresignUrl,
  createVideo,
  analyzeVideo,
  getAnalysisProgress,
  type VideoItem,
  type VideoAnalysisItem,
  type CreateVideoData
} from '@/api/video'
import { useUserStore } from '@/stores/user'

export const useVideoStore = defineStore('video', () => {
  const videoList = ref<VideoItem[]>([])
  const currentVideo = ref<VideoItem | null>(null)
  const analysisProgress = ref<VideoAnalysisItem | null>(null)
  const loading = ref(false)
  const progressTimer = ref<number | null>(null)
  const ws = ref<WebSocket | null>(null)
  const analysisProgressMap = ref<Record<string, { progress: number; status: string }>>({})

  const analyzingCount = computed(() => {
    return videoList.value.filter(v => v.status === 1).length
  })

  const fetchVideoList = async (projectId?: string) => {
    loading.value = true
    try {
      const data: any = await getVideoList(projectId || '')
      videoList.value = data.list || data || []
    } catch {
      videoList.value = []
    } finally {
      loading.value = false
    }
  }

  const fetchVideoDetail = async (id: string) => {
    try {
      const data: any = await getVideoDetail(id)
      currentVideo.value = data
      return data
    } catch {
      return null
    }
  }

  const getUploadPresignUrl = async (filename: string, contentType: string, projectId?: string) => {
    const data: any = await getPresignUrl({ filename, contentType, projectId })
    return data
  }

  const uploadVideoToStorage = async (presignUrl: string, file: File, onProgress?: (percent: number) => void) => {
    return new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest()
      xhr.open('PUT', presignUrl)
      xhr.setRequestHeader('Content-Type', file.type)

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
          const percent = Math.round((e.loaded / e.total) * 100)
          onProgress(percent)
        }
      }

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          resolve()
        } else {
          reject(new Error(`上传失败: ${xhr.status}`))
        }
      }

      xhr.onerror = () => {
        reject(new Error('网络错误，上传失败'))
      }

      xhr.send(file)
    })
  }

  const createVideoRecord = async (data: any) => {
    const result: any = await createVideo(data)
    if (result && videoList.value) {
      videoList.value.unshift(result)
    }
    return result
  }

  const startAnalysis = async (id: string) => {
    const data: any = await analyzeVideo(id)
    updateVideoStatus(id, 1)
    return data
  }

  const updateVideoStatus = (videoId: string, status: number) => {
    const video = videoList.value.find(v => v.id === videoId)
    if (video) {
      video.status = status
    }
  }

  const fetchAnalysisProgress = async (id: string) => {
    try {
      const data: any = await getAnalysisProgress(id)
      analysisProgress.value = data
      return data
    } catch {
      return null
    }
  }

  const connectWebSocket = () => {
    if (ws.value && ws.value.readyState === WebSocket.OPEN) {
      return
    }

    const userStore = useUserStore()
    const userId = userStore.userId
    if (!userId) return

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const host = window.location.hostname
    const port = import.meta.env.VITE_WS_PORT || import.meta.env.VITE_API_PORT || '8080'
    const wsUrl = `${protocol}//${host}:${port}/ws/task-progress?userId=${userId}`

    try {
      ws.value = new WebSocket(wsUrl)

      ws.value.onopen = () => {
        console.log('WebSocket connected')
      }

      ws.value.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          if (data.type === 'progress' && data.taskType === 'VIDEO_ANALYSIS') {
            const videoId = String(data.taskId)
            analysisProgressMap.value[videoId] = {
              progress: data.progress,
              status: data.status
            }
            if (data.status === 'SUCCESS') {
              updateVideoStatus(videoId, 2)
            } else if (data.status === 'FAILED') {
              updateVideoStatus(videoId, 3)
            } else {
              updateVideoStatus(videoId, 1)
            }
          }
        } catch (e) {
          console.error('Failed to parse WebSocket message', e)
        }
      }

      ws.value.onclose = () => {
        console.log('WebSocket closed')
        ws.value = null
      }

      ws.value.onerror = (e) => {
        console.error('WebSocket error', e)
      }
    } catch (e) {
      console.error('Failed to create WebSocket', e)
    }
  }

  const disconnectWebSocket = () => {
    if (ws.value) {
      ws.value.close()
      ws.value = null
    }
  }

  const getAnalysisProgressByVideoId = (videoId: string) => {
    return analysisProgressMap.value[videoId] || { progress: 0, status: '' }
  }

  const startProgressPolling = (id: string, interval: number = 2000) => {
    stopProgressPolling()
    progressTimer.value = window.setInterval(() => {
      fetchAnalysisProgress(id)
    }, interval)
  }

  const stopProgressPolling = () => {
    if (progressTimer.value) {
      clearInterval(progressTimer.value)
      progressTimer.value = null
    }
  }

  const setCurrentVideo = (video: VideoItem | null) => {
    currentVideo.value = video
  }

  return {
    videoList,
    currentVideo,
    analysisProgress,
    loading,
    analyzingCount,
    analysisProgressMap,
    fetchVideoList,
    fetchVideoDetail,
    getUploadPresignUrl,
    uploadVideoToStorage,
    createVideoRecord,
    startAnalysis,
    fetchAnalysisProgress,
    connectWebSocket,
    disconnectWebSocket,
    getAnalysisProgressByVideoId,
    startProgressPolling,
    stopProgressPolling,
    setCurrentVideo,
    updateVideoStatus
  }
})
