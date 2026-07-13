/** 分集节点。 */
import { Handle, NodeProps, Position } from '@xyflow/react'
import { StatusBadge } from './StatusBadge'

export function EpisodeNode({ data, selected }: NodeProps) {
  const ep = data as any
  const appearIndex = ((data as any)?.appearIndex ?? 0) as number
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }
  return (
    <div
      className={`node-card w-72 overflow-hidden node-pop-in ${selected ? 'node-selected' : ''}`}
      style={animationStyle}
    >
      <Handle type="target" position={Position.Top} id="top" className="node-handle" />
      <Handle type="target" position={Position.Left} id="left" className="node-handle" />

      <div className="node-header">
        <span className="flex items-center gap-1.5"><span>🎬</span>第 {ep.index} 集 · {ep.title}</span>
        <StatusBadge status={ep.status} error={(data as any)?.error} />
      </div>
      <div className="p-2.5 space-y-1">
        <div className="text-xs text-gray-300 line-clamp-4 h-20">{ep.plot_summary}</div>
        <div className="text-xs text-gray-500">时长 {ep.duration_seconds}s → {Math.max(1, Math.ceil(ep.duration_seconds / 15))} 个故事板</div>
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
    </div>
  )
}
