/** 视频节点：显示图生视频进度/结果，每个故事板对应一个 VideoNode。 */
import { useState } from 'react'
import { Handle, NodeProps, Position } from '@xyflow/react'
import type { Video } from '../../types'
import { videoUrl, videosApi } from '../../api'
import { StatusBadge } from './StatusBadge'

export function VideoNode({ data, selected }: NodeProps) {
  const video = data as any as Video & { appearIndex?: number }
  const src = videoUrl(video.video_path)
  const [refreshing, setRefreshing] = useState(false)
  const appearIndex = (data as any)?.appearIndex ?? 0
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }
  const progress = video.progress ?? 0

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (refreshing) return
    setRefreshing(true)
    try {
      await videosApi.regenerate(video.id)
    } catch {
      // 错误由 WS 事件处理
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div
      className={`node-card w-64 overflow-hidden node-pop-in ${selected ? 'node-selected' : ''}`}
      style={animationStyle}
    >
      <Handle type="target" position={Position.Top} id="top" className="node-handle" />
      <Handle type="target" position={Position.Left} id="left" className="node-handle" />

      <div className="node-header">
        <span className="flex items-center gap-1.5"><span>🎬</span>视频</span>
        <div className="flex items-center gap-1">
          {video.status === 'failed' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="重新生成"
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            >
              <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            </button>
          )}
          <StatusBadge status={video.status} error={video.error ?? undefined} />
        </div>
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="bg-[#121214] rounded-lg h-28 flex items-center justify-center overflow-hidden border border-gray-800">
          {src ? (
            <video
              src={src}
              controls
              loop
              muted
              className="w-full h-full object-cover"
            />
          ) : video.status === 'failed' ? (
            <div className="text-red-400 text-xs text-center px-2" title={video.error ?? undefined}>
              {video.error || '生成失败'}
            </div>
          ) : video.status === 'generating' ? (
            <div className="w-full px-3 space-y-1.5">
              <div className="text-gray-400 text-xs text-center animate-pulse">生成中 {progress}%</div>
              <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-red-500 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(2, progress)}%` }}
                />
              </div>
            </div>
          ) : (
            <div className="text-gray-600 text-xs">待生成</div>
          )}
        </div>
        {video.prompt && (
          <div className="text-xs text-gray-500 line-clamp-2 h-8 italic">{video.prompt}</div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
    </div>
  )
}
