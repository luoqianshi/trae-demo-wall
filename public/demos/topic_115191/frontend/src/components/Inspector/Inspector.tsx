/** Inspector 面板：选中节点的详情编辑与重生成。 */
import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { assetsApi, storyboardsApi, imageUrl } from '../../api'
import { StatusBadge } from '../nodes/StatusBadge'
import type { Asset, AssetType, Storyboard } from '../../types'

export function Inspector({ selectedNode }: { selectedNode: any }) {
  const saveCanvas = useStore(s => s.saveCanvas)
  const [editing, setEditing] = useState(false)
  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [regenerating, setRegenerating] = useState(false)

  useEffect(() => {
    if (!selectedNode) return
    setPrompt(selectedNode.data?.prompt || '')
    setName(selectedNode.data?.name || '')
    setDescription(selectedNode.data?.description || '')
    setEditing(false)
  }, [selectedNode?.id])

  if (!selectedNode) {
    return (
      <div className="w-80 bg-[#141414] border-l border-gray-800 h-full p-4 text-sm text-gray-500">
        <p>点击画布上的节点查看详情</p>
        <p className="mt-2">支持编辑提示词、描述，并重新生成图片</p>
      </div>
    )
  }

  const nodeType = selectedNode.type
  const data = selectedNode.data

  const handleSaveAsset = async () => {
    const assetType = nodeType as AssetType
    await assetsApi.update(assetType, data.id, { name, description, prompt })
    setEditing(false)
  }

  const handleRegenAsset = async () => {
    setRegenerating(true)
    try {
      await assetsApi.regenerate(nodeType as AssetType, data.id)
    } finally {
      setRegenerating(false)
    }
  }

  const handleSaveStoryboard = async () => {
    await storyboardsApi.update(data.id, { prompt })
    setEditing(false)
  }

  const handleRegenStoryboard = async () => {
    setRegenerating(true)
    try {
      await storyboardsApi.regenerate(data.id)
    } finally {
      setRegenerating(false)
    }
  }

  const isAsset = ['character', 'scene', 'prop'].includes(nodeType || '')
  const isStoryboard = nodeType === 'storyboard'
  const img = imageUrl(data.image_path)

  return (
    <div className="w-80 bg-[#141414] border-l border-gray-800 h-full overflow-y-auto text-gray-200">
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-2">
          <h2 className="font-semibold text-gray-100">
            {nodeType === 'script' ? '剧本' :
             nodeType === 'character' ? '角色' :
             nodeType === 'scene' ? '场景' :
             nodeType === 'prop' ? '道具' :
             nodeType === 'episode' ? '分集' :
             nodeType === 'storyboard' ? '故事板' : '节点'}
          </h2>
          {data.status && <StatusBadge status={data.status} />}
        </div>
      </div>

      <div className="p-4 space-y-3">
        {img && (
          <div className="rounded-lg overflow-hidden border border-gray-800">
            <img src={img} alt="" className="w-full" />
          </div>
        )}

        {(isAsset || isStoryboard) && (
          <>
            {isAsset && (
              <>
                <Field label="名称" value={name} editing={editing} onChange={setName} />
                <Field label="描述" value={description} editing={editing} onChange={setDescription} multiline />
              </>
            )}
            <div>
              <label className="text-xs text-gray-500 uppercase">提示词</label>
              {editing ? (
                <textarea
                  className="w-full bg-[#1f1f1f] border border-gray-700 rounded p-2 text-sm text-gray-200 mt-1 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  value={prompt}
                  onChange={e => setPrompt(e.target.value)}
                />
              ) : (
                <div className="text-sm text-gray-300 mt-1 bg-[#1f1f1f] p-2 rounded min-h-16 max-h-40 overflow-y-auto">
                  {prompt || '(空)'}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {editing ? (
                <>
                  <button
                    className="flex-1 bg-indigo-600 hover:bg-indigo-500 text-white py-1.5 rounded text-sm transition-colors"
                    onClick={isAsset ? handleSaveAsset : handleSaveStoryboard}
                  >
                    保存
                  </button>
                  <button
                    className="flex-1 bg-[#252525] hover:bg-[#333] text-gray-300 py-1.5 rounded text-sm transition-colors"
                    onClick={() => setEditing(false)}
                  >
                    取消
                  </button>
                </>
              ) : (
                <>
                  <button
                    className="flex-1 bg-[#252525] hover:bg-[#333] text-gray-200 py-1.5 rounded text-sm transition-colors"
                    onClick={() => setEditing(true)}
                  >
                    编辑
                  </button>
                  <button
                    className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white py-1.5 rounded text-sm disabled:opacity-50 transition-colors"
                    onClick={isAsset ? handleRegenAsset : handleRegenStoryboard}
                    disabled={regenerating || !prompt}
                  >
                    {regenerating ? '生成中...' : '重新生成'}
                  </button>
                </>
              )}
            </div>

            {isStoryboard && (data.character_ref_ids?.length || data.scene_ref_ids?.length || data.prop_ref_ids?.length) && (
              <div className="text-xs text-gray-400 bg-[#1f1f1f] p-2 rounded border border-gray-800">
                <div className="font-medium mb-1 text-gray-300">参考来源（保证连续性）</div>
                {data.prev_storyboard_id && <div>· 前一故事板图</div>}
                {data.character_ref_ids?.length > 0 && <div>· 角色图 ×{data.character_ref_ids.length}</div>}
                {data.scene_ref_ids?.length > 0 && <div>· 场景图 ×{data.scene_ref_ids.length}</div>}
                {data.prop_ref_ids?.length > 0 && <div>· 道具图 ×{data.prop_ref_ids.length}</div>}
              </div>
            )}
          </>
        )}

        {nodeType === 'episode' && (
          <div className="space-y-2">
            <div className="text-sm text-gray-300">{data.plot_summary}</div>
            <div className="text-xs text-gray-500">时长: {data.duration_seconds}秒</div>
          </div>
        )}
      </div>
    </div>
  )
}

function Field({ label, value, editing, onChange, multiline }: {
  label: string
  value: string
  editing: boolean
  onChange: (v: string) => void
  multiline?: boolean
}) {
  return (
    <div>
      <label className="text-xs text-gray-500 uppercase">{label}</label>
      {editing ? (
        multiline ? (
          <textarea
            className="w-full bg-[#1f1f1f] border border-gray-700 rounded p-2 text-sm text-gray-200 mt-1 h-20 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        ) : (
          <input
            className="w-full bg-[#1f1f1f] border border-gray-700 rounded p-2 text-sm text-gray-200 mt-1 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            value={value}
            onChange={e => onChange(e.target.value)}
          />
        )
      ) : (
        <div className="text-sm text-gray-300 mt-1">{value || '(空)'}</div>
      )}
    </div>
  )
}
