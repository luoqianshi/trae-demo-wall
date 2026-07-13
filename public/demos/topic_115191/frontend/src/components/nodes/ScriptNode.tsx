/** Agent 导演节点：剧本导入入口。 */
import { useState, useEffect } from 'react'
import { Handle, NodeProps, Position } from '@xyflow/react'
import { useStore } from '../../store'

export function ScriptNode({ id, data, selected }: NodeProps) {
  const [text, setText] = useState('')
  const [status, setStatus] = useState<'idle' | 'submitting' | 'submitted' | 'error'>('idle')
  const [message, setMessage] = useState('')
  const currentProject = useStore(s => s.currentProject)
  const uploadScript = useStore(s => s.uploadScript)
  const appearIndex = (data as any)?.appearIndex ?? 0
  const animationStyle = { animationDelay: `${appearIndex * 0.08}s` }
  const projectId = (data as any)?.projectId as string | undefined

  // 切换项目时重置组件内部状态。ScriptNode 的 id 始终为 'script'，
  // React 会复用同一组件实例，导致上一个项目的 text/status 残留。
  useEffect(() => {
    setText('')
    setStatus('idle')
    setMessage('')
  }, [projectId])

  const handleUpload = async () => {
    if (!text.trim() || !currentProject) {
      setStatus('error')
      setMessage('请先选择项目并输入剧本内容')
      return
    }
    setStatus('submitting')
    setMessage('正在提交剧本...')
    try {
      await uploadScript(text)
      setStatus('submitted')
      setMessage('剧本已提交，Agent 开始分析角色、场景、道具并拆解分集...')
    } catch (e: any) {
      setStatus('error')
      setMessage(e?.response?.data?.detail || e.message || '提交失败，请检查后端服务')
      console.error('剧本提交失败:', e)
    }
  }

  const isBusy = status === 'submitting'

  return (
    <div
      className={`node-card w-80 overflow-hidden nodrag nowheel node-pop-in ${selected ? 'node-selected' : ''}`}
      style={animationStyle}
    >
      <Handle type="target" position={Position.Top} id="top" className="node-handle" />
      <Handle type="target" position={Position.Left} id="left" className="node-handle" />

      <div className="node-header">
        <span>🎬</span> agent导演
      </div>
      <div className="p-3 space-y-2">
        <textarea
          className="w-full h-40 bg-[#121214] border border-gray-700 rounded p-2 text-sm text-gray-200 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-gray-600"
          placeholder="粘贴剧本文本，或在此输入...&#10;Agent 将自动分析角色、场景、道具并拆解分集"
          value={text}
          onChange={e => setText(e.target.value)}
          disabled={isBusy}
        />
        <button
          type="button"
          className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors nodrag"
          onClick={handleUpload}
          disabled={!text.trim() || isBusy}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {isBusy ? '提交中...' : '开始分析生成'}
        </button>
        {(!!data?.hasScript || status === 'submitted') && (
          <p className="text-xs text-emerald-400">剧本已导入，Agent 正在处理...</p>
        )}
        {status === 'error' && message && (
          <p className="text-xs text-red-400">{message}</p>
        )}
      </div>

      <Handle type="source" position={Position.Bottom} id="bottom" className="node-handle" />
      <Handle type="source" position={Position.Right} id="right" className="node-handle" />
    </div>
  )
}
