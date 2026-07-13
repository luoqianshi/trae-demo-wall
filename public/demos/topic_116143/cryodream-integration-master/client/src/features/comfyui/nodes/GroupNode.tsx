import { memo, useState } from 'react'
import { Handle, Position, type NodeProps } from '@xyflow/react'
import { X, Grid3X3 } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface GroupNodeData {
  label: string
  childIds: string[]
  groupId: string
  width?: number
  height?: number
  onRename: (groupId: string, label: string) => void
  onDelete: (groupId: string) => void
  onArrange: (groupId: string) => void
  [key: string]: unknown
}

function GroupNodeComponent({ data, selected }: NodeProps) {
  const d = data as GroupNodeData
  const [editing, setEditing] = useState(false)
  const [labelValue, setLabelValue] = useState(d.label)

  const width = d.width ?? 400
  const height = d.height ?? 300

  const handleBlur = () => {
    setEditing(false)
    if (labelValue.trim()) {
      d.onRename(d.groupId, labelValue.trim())
    }
  }

  return (
    <div
      className={cn(
        'group relative rounded-lg border-2 transition-all',
        selected
          ? 'border-violet-400 bg-violet-50/60 shadow-md'
          : 'border-dashed border-slate-400 bg-slate-50/40'
      )}
      style={{
        width,
        height,
        minWidth: 200,
        minHeight: 120,
      }}
    >
      {/* Title bar */}
      <div className="absolute -top-7 left-0 flex items-center gap-1 pr-6">
        <div
          className={cn(
            'flex items-center gap-1 rounded-t-md border border-b-0 border-x px-2 py-0.5 text-xs font-medium',
            selected
              ? 'border-violet-400 bg-violet-100 text-violet-700'
              : 'border-slate-400 bg-slate-100 text-slate-600'
          )}
        >
          {editing ? (
            <input
              autoFocus
              value={labelValue}
              onChange={(e) => setLabelValue(e.target.value)}
              onBlur={handleBlur}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleBlur()
                if (e.key === 'Escape') {
                  setLabelValue(d.label)
                  setEditing(false)
                }
              }}
              className="w-24 bg-transparent outline-none"
            />
          ) : (
            <span
              onDoubleClick={() => setEditing(true)}
              className="cursor-pointer"
              title="双击重命名"
            >
              {d.label}
            </span>
          )}
          <span className="ml-1 rounded bg-black/10 px-1 py-0.5 text-[10px] text-black/50">
            {d.childIds.length}
          </span>
        </div>

        {/* Action buttons - only show when selected */}
        {selected && (
          <div className="flex items-center gap-0.5">
            <button
              onClick={() => d.onArrange(d.groupId)}
              title="自动排列节点"
              className="flex size-5 items-center justify-center rounded bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 hover:text-slate-700"
            >
              <Grid3X3 size={12} />
            </button>
            <button
              onClick={() => d.onDelete(d.groupId)}
              title="删除分组"
              className="flex size-5 items-center justify-center rounded bg-red-50 text-red-500 transition-colors hover:bg-red-100 hover:text-red-700"
            >
              <X size={12} />
            </button>
          </div>
        )}
      </div>

      {/* Invisible handles for connecting */}
      <Handle type="target" position={Position.Top} className="opacity-0" />
      <Handle type="source" position={Position.Bottom} className="opacity-0" />
    </div>
  )
}

export const GroupNode = memo(GroupNodeComponent)
