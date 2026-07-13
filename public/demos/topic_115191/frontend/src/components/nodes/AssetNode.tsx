/** 资产节点通用组件（角色/场景/道具共用）。 */
import { useState } from 'react'
import { Handle, NodeProps, Position } from '@xyflow/react'
import type { Asset } from '../../types'
import { assetsApi, imageUrl } from '../../api'
import { StatusBadge } from './StatusBadge'
import { ImageModal } from '../ImageModal'

const TYPE_CONFIG = {
  character: { label: '角色', icon: '👤', imgLabel: '三视图' },
  scene: { label: '场景', icon: '🏞️', imgLabel: '场景图' },
  prop: { label: '道具', icon: '📦', imgLabel: '道具图' },
}

export function AssetNode({ data, selected }: NodeProps) {
  const asset = data as unknown as Asset
  const cfg = TYPE_CONFIG[asset.type] || TYPE_CONFIG.character
  const img = imageUrl(asset.image_path)
  const [zoom, setZoom] = useState(false)
  const [refreshing, setRefreshing] = useState(false)
  const appearIndex = (data as any)?.appearIndex ?? 0
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }

  const handleRefresh = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (refreshing) return
    setRefreshing(true)
    try {
      await assetsApi.regenerate(asset.type, asset.id)
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
        <span className="flex items-center gap-1.5"><span>{cfg.icon}</span>{cfg.label}</span>
        <div className="flex items-center gap-1">
          {asset.status === 'failed' && (
            <button
              onClick={handleRefresh}
              disabled={refreshing}
              title="重新生成"
              className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 hover:bg-white/20 text-white text-xs transition-colors"
            >
              <span className={refreshing ? 'animate-spin inline-block' : ''}>🔄</span>
            </button>
          )}
          <StatusBadge status={asset.status} error={(data as any)?.error} />
        </div>
      </div>
      <div className="p-2.5 space-y-1.5">
        <div className="font-medium text-sm text-gray-100 truncate">{asset.name}</div>
        <div className="text-xs text-gray-400 line-clamp-2 h-8">{asset.description}</div>
        {asset.prompt && (
          <div className="text-xs text-gray-500 line-clamp-2 h-8 italic">提示词: {asset.prompt.slice(0, 60)}...</div>
        )}
        <div className="bg-[#121214] rounded-lg h-32 flex items-center justify-center overflow-hidden border border-gray-800">
          {img ? (
            <img
              src={img}
              alt={asset.name}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setZoom(true)}
            />
          ) : asset.status === 'failed' ? (
            <div className="text-red-400 text-xs text-center px-2" title={(data as any)?.error}>
              {(data as any)?.error || '生成失败'}
            </div>
          ) : asset.status === 'generating' ? (
            <div className="text-gray-500 text-xs animate-pulse">{cfg.imgLabel}生成中...</div>
          ) : (
            <div className="text-gray-600 text-xs">{cfg.imgLabel}待生成</div>
          )}
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
      {zoom && img && <ImageModal src={img} alt={asset.name} onClose={() => setZoom(false)} />}
    </div>
  )
}
