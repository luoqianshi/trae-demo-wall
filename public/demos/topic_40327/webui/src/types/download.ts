// 下载进度事件类型
export interface DownloadProgressEvent {
  download_id: string
  url: string
  file_name: string
  group_id: string
  total: number
  downloaded: number
  percent: number
  speed: number
  status: 'downloading' | 'completed' | 'failed'
  error?: string
  created_at: number
}