/** 参考图节点：显示导演台截图。 */
import { useState } from 'react'
import { Handle, NodeProps, Position } from '@xyflow/react'
import { imageUrl } from '../../api'
import { ImageModal } from '../ImageModal'

export function ReferenceImageNode({ data, selected }: NodeProps) {
  const imagePath = (data as any)?.image_path as string | null
  const name = (data as any)?.name as string || '参考图'
  const img = imageUrl(imagePath)
  const [zoom, setZoom] = useState(false)
  const appearIndex = (data as any)?.appearIndex ?? 0
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }

  return (
    <div
      className={`node-card w-56 overflow-hidden node-pop-in ${selected ? 'node-selected' : ''}`}
      style={animationStyle}
    >
      <Handle type="target" position={Position.Top} id="top" className="node-handle" />
      <Handle type="target" position={Position.Left} id="left" className="node-handle" />

      <div className="node-header">
        <span className="flex items-center gap-1.5"><span>🖼️</span>参考图</span>
      </div>
      <div className="p-2">
        <div className="bg-[#121214] rounded-lg h-32 flex items-center justify-center overflow-hidden border border-gray-800">
          {img ? (
            <img
              src={img}
              alt={name}
              className="w-full h-full object-cover cursor-zoom-in"
              onClick={() => setZoom(true)}
            />
          ) : (
            <div className="text-gray-600 text-xs">无图片</div>
          )}
        </div>
        <div className="mt-1.5 text-xs text-gray-400 truncate">{name}</div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
      {zoom && img && <ImageModal src={img} alt={name} onClose={() => setZoom(false)} />}
    </div>
  )
}
