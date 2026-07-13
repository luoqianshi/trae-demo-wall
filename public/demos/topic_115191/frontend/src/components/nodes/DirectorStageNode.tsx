/** 导演台节点：显示名称、最新截图、机位数量、打开入口。 */
import { useState } from 'react'
import { Handle, NodeProps, Position } from '@xyflow/react'
import type { DirectorStage } from '../../types'
import { imageUrl } from '../../api'
import { useStore } from '../../store'
import { StatusBadge } from './StatusBadge'
import { ImageModal } from '../ImageModal'

export function DirectorStageNode({ data, selected }: NodeProps) {
  const ds = data as unknown as DirectorStage
  const latestShot = ds.screenshots?.[ds.screenshots.length - 1]
  const img = imageUrl(latestShot?.image_path || null)
  const cameraCount = ds.scene_data?.cameras?.length || 0
  const [zoom, setZoom] = useState(false)
  const appearIndex = (data as any)?.appearIndex ?? 0
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }
  const openDirectorStageEditor = useStore(s => s.openDirectorStageEditor)

  return (
    <div
      className={`node-card w-72 overflow-hidden node-pop-in ${selected ? 'node-selected' : ''}`}
      style={animationStyle}
    >
      <Handle type="target" position={Position.Top} id="top" className="node-handle" />
      <Handle type="target" position={Position.Left} id="left" className="node-handle" />

      <div className="node-header">
        <span className="flex items-center gap-1.5"><span>🎬</span>导演台</span>
        <StatusBadge status={ds.status} error={(data as any)?.error} />
      </div>
      <div className="p-2.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="font-medium text-sm text-gray-100 truncate">{ds.name}</div>
          <button
            type="button"
            onClick={() => openDirectorStageEditor(ds.id)}
            className="text-[10px] px-2 py-0.5 bg-white/10 hover:bg-white/20 text-white rounded border border-white/20 transition-colors"
          >
            打开导演台
          </button>
        </div>
        <div className="bg-[#121214] rounded-lg h-36 flex items-center justify-center overflow-hidden border border-gray-800">
          {img ? (
            <img
              src={img}
              alt={ds.name}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setZoom(true)}
            />
          ) : (
            <div className="text-gray-600 text-xs flex flex-col items-center gap-1">
              <span>🎬</span>
              <span>打开导演台添加场景</span>
            </div>
          )}
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>机位 × {cameraCount}</span>
          <span>截图 × {ds.screenshots?.length || 0}</span>
        </div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
      {zoom && img && <ImageModal src={img} alt={ds.name} onClose={() => setZoom(false)} />}
    </div>
  )
}
