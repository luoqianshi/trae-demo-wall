import axios from 'axios'

/**
 * API客户端
 * 封装所有后端请求
 * 后端基础地址：http://localhost:8000（通过vite proxy代理）
 */

// 创建axios实例
const apiClient = axios.create({
  baseURL: '/api',
  timeout: 300000,
})

/**
 * 上传视频文件
 * @param {File} file - 视频文件对象
 * @param {(progress: number) => void} onUploadProgress - 上传进度回调
 * @returns {Promise<{task_id: string}>}
 */
export async function uploadVideo(file, onUploadProgress) {
  const formData = new FormData()
  formData.append('file', file)
  const response = await apiClient.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    onUploadProgress: (progressEvent) => {
      if (onUploadProgress && progressEvent.total) {
        const percent = Math.round((progressEvent.loaded / progressEvent.total) * 100)
        onUploadProgress(percent)
      }
    },
  })
  return response.data
}

/**
 * 触发分析
 * @param {string} taskId - 任务ID
 * @returns {Promise<{message: string}>}
 */
export async function startAnalysis(taskId) {
  const response = await apiClient.post('/analyze/' + taskId)
  return response.data
}

/**
 * 获取分析状态
 * @param {string} taskId - 任务ID
 * @returns {Promise<{status: string, total_frames: number, processed_frames: number}>}
 */
export async function getAnalysisStatus(taskId) {
  const response = await apiClient.get('/status/' + taskId)
  return response.data
}

/**
 * 获取完整分析数据
 * @param {string} taskId - 任务ID
 * @returns {Promise<{players: Array, ball: Object, report: string, duration: number}>}
 */
export async function getAnalysisData(taskId) {
  const response = await apiClient.get('/data/' + taskId)
  return response.data
}

/**
 * 建立WebSocket连接，接收分析进度推送
 * @param {string} taskId - 任务ID
 * @param {(data: {processed: number, total: number, percentage: number}) => void} onProgress - 进度回调
 * @param {(data: any) => void} onComplete - 完成回调
 * @param {(error: Event) => void} onError - 错误回调
 * @returns {WebSocket} WebSocket实例，可用于手动关闭
 */
export function connectWebSocket(taskId, onProgress, onComplete, onError) {
  const wsUrl = 'ws://localhost:8000/ws/' + taskId
  const ws = new WebSocket(wsUrl)
  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data)
      if (data.type === 'progress') {
        onProgress && onProgress(data)
      } else if (data.type === 'complete' || data.type === 'completed') {
        onComplete && onComplete(data)
      } else if (data.type === 'error') {
        onError && onError(data)
      }
    } catch (e) {
      console.error('WebSocket消息解析失败:', e)
    }
  }
  ws.onerror = (error) => {
    console.error('WebSocket错误:', error)
    onError && onError(error)
  }
  ws.onclose = () => {
    console.log('WebSocket连接已关闭')
  }
  return ws
}