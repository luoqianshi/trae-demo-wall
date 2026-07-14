import { Handle, Position } from "@xyflow/react"

export interface CustomNodeData {
  icon: string
  text: string
}

const HANDLE_STYLE = {
  width: 10,
  height: 10,
  borderRadius: "50%",
  background: "#9CA3AF",
  border: "2px solid white",
}

export function TriggerNode({ data }: { data: CustomNodeData }) {
  return (
    <div className="bg-[#E6F3FF] border-2 border-[#4A90D9] rounded-lg p-4 w-56 shadow-sm border-l-4">
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
      <div className="flex items-center gap-3">
        <span className="text-2xl">{data.icon}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words">
            {data.text}
          </p>
        </div>
      </div>
    </div>
  )
}

export function ConditionNode({ data }: { data: CustomNodeData }) {
  return (
    <div className="bg-[#FFF9D9] border border-[#E6D580] rounded-lg px-4 py-2 w-56 shadow-sm">
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
      <div className="flex items-center gap-2">
        <span className="text-lg">{data.icon}</span>
        <span className="text-xs text-gray-600 whitespace-pre-wrap break-words">
          {data.text}
        </span>
      </div>
    </div>
  )
}

export function DelayNode({ data }: { data: CustomNodeData }) {
  return (
    <div className="bg-[#E6FBF3] border border-dashed border-[#7ED9BD] rounded-lg p-3 w-56 shadow-sm border-l border-l-2 border-l-dashed">
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
      <div className="flex items-center gap-2">
        <span className="text-xl">{data.icon}</span>
        <span className="text-sm text-gray-700 whitespace-pre-wrap break-words">
          {data.text}
        </span>
      </div>
    </div>
  )
}

export function ActionNode({ data }: { data: CustomNodeData }) {
  return (
    <div className="bg-[#E7F9E9] border-2 border-[#7ED995] rounded-lg p-3 w-56 shadow-sm border-l-2">
      <Handle type="target" position={Position.Top} style={HANDLE_STYLE} />
      <Handle type="source" position={Position.Bottom} style={HANDLE_STYLE} />
      <div className="flex items-center gap-2">
        <span className="text-xl">{data.icon}</span>
        <span className="text-sm font-medium text-gray-800 whitespace-pre-wrap break-words">
          {data.text}
        </span>
      </div>
    </div>
  )
}

export const nodeTypes = {
  trigger: TriggerNode,
  condition: ConditionNode,
  delay: DelayNode,
  action: ActionNode,
}