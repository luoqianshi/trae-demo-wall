/** 故事板节点：显示序号、提示词、图片、状态、参考来源。 */
import { useState } from 'react'
import { Handle, NodeProps, Position } from '@xyflow/react'
import type { Storyboard } from '../../types'
import { imageUrl, storyboardsApi } from '../../api'
import { StatusBadge } from './StatusBadge'
import { ImageModal } from '../ImageModal'

export function StoryboardNode({ data, selected }: NodeProps) {
  const sb = data as any as Storyboard & { episode_index?: number }
  const img = imageUrl(sb.image_path)
  const refCount = (sb.character_ref_ids?.length || 0) + (sb.scene_ref_ids?.length || 0) + (sb.prop_ref_ids?.length || 0)
  const [zoom, setZoom] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const appearIndex = ((data as any)?.appearIndex ?? 0) as number
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (refreshing) return
    setRefreshing(true)
    try {
      await storyboardsApi.regenerate(sb.id)
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
        <span className="flex items-center gap-1.5"><span>🎞️</span>故事板 {sb.index}</span>
        <div className="flex items-center gap-1">
          {sb.status === 'failed' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="重新生成"
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            >
              <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            </button>
          )}
          <StatusBadge status={sb.status} error={(data as any)?.error} />
        </div>
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="bg-[#121214] rounded-lg h-28 flex items-center justify-center overflow-hidden border border-gray-800">
          {img ? (
            <img
              src={img}
              alt={`故事板${sb.index}`}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setZoom(true)}
            />
          ) : sb.status === 'failed' ? (
            <div className="text-red-400 text-xs text-center px-2" title={(data as any)?.error}>
              {(data as any)?.error || '生成失败'}
            </div>
          ) : sb.status === 'generating' ? (
            <div className="text-gray-500 text-xs animate-pulse">生成中...</div>
          ) : (
            <div className="text-gray-600 text-xs">待生成</div>
          )}
        </div>
        {sb.prompt && (
          <div className="text-xs text-gray-500 line-clamp-3 h-12 italic">{sb.prompt}</div>
        )}
        <div className="flex items-center gap-1 text-xs text-gray-400">
          {sb.prev_storyboard_id && <span className="bg-sky-900/40 text-sky-400 px-1.5 py-0.5 rounded">参考前序</span>}
          {refCount > 0 && <span className="bg-gray-800 text-gray-400 px-1.5 py-0.5 rounded">资产×{refCount}</span>}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
      {zoom && img && <ImageModal src={img} alt={`故事板${sb.index}`} onClose={() => setZoom(false)} />}
    </div>
  )
}
