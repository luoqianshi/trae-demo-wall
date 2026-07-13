/** 自由节点：文本 / 图片 / 视频。
 *
 * 通过画布双击菜单手动创建，不依赖后端生成流程。
 */
import { Handle, NodeProps, Position } from '@xyflow/react'
import type { FreeNodeData } from '../../types'

const TYPE_CONFIG = {
  text: { label: '文本', icon: '☰' },
  image: { label: '图片', icon: '🖼️' },
  video: { label: '视频', icon: '🎥' },
}

export function FreeNode({ data, selected }: NodeProps) {
  const node = data as unknown as FreeNodeData
  const cfg = TYPE_CONFIG[node.contentType]
  const animationStyle = { animationDelay: `${node.appearIndex * 0.08}s` }

  return (
    <div
      className={`node-card w-60 overflow-hidden node-pop-in ${selected ? 'node-selected' : ''}`}
      style={animationStyle}
    >
      <Handle type="target" position={Position.Top} id="top" className="node-handle" />
      <Handle type="target" position={Position.Left} id="left" className="node-handle" />

      <div className="node-header">
        <span className="flex items-center gap-1.5">
          <span>{cfg.icon}</span>
          {cfg.label}
        </span>
      </div>

      <div className="p-2.5">
        {node.contentType === 'text' && (
          <div className="text-sm text-gray-200 whitespace-pre-wrap min-h-[60px]">
            {node.content || '空文本节点'}
          </div>
        )}
        {node.contentType === 'image' && (
          <div className="bg-[#121214] rounded-lg h-32 flex items-center justify-center overflow-hidden border border-gray-800">
            {node.src ? (
              <img
                src={node.src}
                alt={node.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-gray-600 text-xs">图片节点</div>
            )}
          </div>
        )}
        {node.contentType === 'video' && (
          <div className="bg-[#121214] rounded-lg h-32 flex items-center justify-center overflow-hidden border border-gray-800">
            {node.src ? (
              <video
                src={node.src}
                className="w-full h-full object-cover"
                controls
              />
            ) : (
              <div className="text-gray-600 text-xs">视频节点</div>
            )}
          </div>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
    </div>
  )
}
