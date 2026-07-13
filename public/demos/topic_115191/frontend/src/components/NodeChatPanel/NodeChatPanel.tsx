/** 底部节点操作面板（参考图风格）。 */
import { useState, useEffect } from 'react'
import { useStore } from '../../store'
import { assetsApi, storyboardsApi, imageUrl } from '../../api'
import { StatusBadge } from '../nodes/StatusBadge'
import type { AssetType, DirectorStageScreenshot } from '../../types'
import { ImageModal } from '../ImageModal'

const TYPE_NAMES: Record<string, string> = {
  script: '剧本',
  character: '角色',
  scene: '场景',
  prop: '道具',
  episode: '分集',
  storyboard: '故事板',
  director_stage: '导演台',
  reference_image: '参考图',
}

export function NodeChatPanel({ selectedNode, onClose }: { selectedNode: any; onClose: () => void }) {
  const saveCanvas = useStore(s => s.saveCanvas)
  const nodes = useStore(s => s.nodes)
  const updateStoryboardRefs = useStore(s => s.updateStoryboardRefs)
  const addReferenceImageNode = useStore(s => s.addReferenceImageNode)
  const openDirectorStageEditor = useStore(s => s.openDirectorStageEditor)
  const editorOpen = useStore(s => s.directorStageEditorOpen)

  // 始终从 store 读取实时节点数据。切换项目后旧节点不在 store 中，
  // 返回 null 让面板自动隐藏，避免显示过期快照。
  const liveNode = useStore(s =>
    selectedNode ? s.nodes.find(n => n.id === selectedNode.id) || null : null,
  ) as any

  const [prompt, setPrompt] = useState('')
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [regenerating, setRegenerating] = useState(false)
  const [inputText, setInputText] = useState('')
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  useEffect(() => {
    if (!selectedNode) return
    setPrompt(selectedNode.data?.prompt || '')
    setName(selectedNode.data?.name || '')
    setDescription(selectedNode.data?.description || '')
    setInputText('')
    setZoomImage(null)
  }, [selectedNode?.id])

  if (!selectedNode || !liveNode) return null
  // 导演台编辑器打开时隐藏底部面板，避免遮挡
  if (editorOpen) return null

  const nodeType = liveNode.type
  const data = liveNode.data
  const isAsset = ['character', 'scene', 'prop'].includes(nodeType || '')
  const isStoryboard = nodeType === 'storyboard'
  const isDirectorStage = nodeType === 'director_stage'
  const isReferenceImage = nodeType === 'reference_image'
  const img = imageUrl(data.image_path)

  const referenceImageNodes = nodes.filter(n => n.type === 'reference_image')
  const currentRefIds = (data.director_stage_ref_ids || []) as string[]

  const handleToggleRef = async (refId: string) => {
    if (!isStoryboard) return
    const next = currentRefIds.includes(refId)
      ? currentRefIds.filter(id => id !== refId)
      : [...currentRefIds, refId]
    updateStoryboardRefs(data.id, next)
  }

  const handleOpenDirectorStage = () => {
    if (isDirectorStage) {
      openDirectorStageEditor(data.id)
    }
  }

  const handleSendShotToCanvas = (shot: DirectorStageScreenshot) => {
    if (isDirectorStage) {
      addReferenceImageNode(data.id, shot)
    }
  }

  const handleSaveAsset = async () => {
    const assetType = nodeType as AssetType
    await assetsApi.update(assetType, data.id, { name, description, prompt })
  }

  const handleRegenAsset = async () => {
    setRegenerating(true)
    try {
      await assetsApi.regenerate(nodeType as AssetType, data.id)
    } finally {
      setRegenerating(false)
    }
  }

  const handleRegenStoryboard = async () => {
    setRegenerating(true)
    try {
      await storyboardsApi.regenerate(data.id)
    } finally {
      setRegenerating(false)
    }
  }

  const handleSend = () => {
    if (!inputText.trim()) return
    // 这里可以扩展为向当前节点发送指令/生成请求
    console.log('发送:', inputText)
    setInputText('')
  }

  return (
    <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[calc(100%-2rem)] max-w-4xl">
      <div className="chat-panel rounded-2xl p-4 space-y-3">
        {/* 顶部：节点信息 + 关闭 */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-white">{TYPE_NAMES[nodeType] || '节点'}</span>
            <span className="text-sm text-gray-400 truncate max-w-xs">
              {data.name || data.title || (data.index ? `故事板 ${data.index}` : '节点')}
            </span>
            {data.status && <StatusBadge status={data.status} error={data.error} />}
          </div>
          <div className="flex items-center gap-2">
            {(isAsset || isStoryboard) && (
              <button
                type="button"
                onClick={isAsset ? handleRegenAsset : handleRegenStoryboard}
                disabled={regenerating || !prompt}
                className="px-3 py-1 text-xs font-medium bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-full transition-colors"
              >
                {regenerating ? '生成中...' : '重新生成'}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="text-gray-400 hover:text-white text-lg leading-none px-2"
            >
              ×
            </button>
          </div>
        </div>

        {/* 中间：图片 + 提示词编辑 */}
        {(isAsset || isStoryboard) && (
          <div className="flex gap-3">
            {img && (
              <div className="w-24 h-24 shrink-0 rounded-lg overflow-hidden border border-gray-700">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="flex-1 space-y-2">
              {isAsset && (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    onBlur={handleSaveAsset}
                    className="flex-1 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1 text-sm text-white focus:outline-none focus:border-gray-500"
                    placeholder="名称"
                  />
                </div>
              )}
              <textarea
                value={prompt}
                onChange={e => setPrompt(e.target.value)}
                onBlur={isAsset ? handleSaveAsset : undefined}
                className="w-full h-16 bg-[#1a1a1a] border border-gray-700 rounded px-3 py-2 text-sm text-gray-200 resize-none focus:outline-none focus:border-gray-500"
                placeholder="编辑生图提示词..."
              />
            </div>
          </div>
        )}

        {/* 故事板参考图选择 */}
        {isStoryboard && referenceImageNodes.length > 0 && (
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700 space-y-2">
            <div className="text-xs text-gray-400">导演台参考图</div>
            <div className="flex flex-wrap gap-2">
              {referenceImageNodes.map(refNode => {
                const refData = refNode.data as any
                const refImg = imageUrl(refData?.image_path as string | null)
                const checked = currentRefIds.includes(refData?.id as string)
                return (
                  <label
                    key={refNode.id}
                    className={`flex items-center gap-1.5 px-2 py-1 rounded border cursor-pointer transition-colors ${
                      checked ? 'border-blue-500 bg-blue-500/10' : 'border-gray-700 hover:border-gray-500'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() => handleToggleRef(refData?.id as string)}
                      className="w-3.5 h-3.5 accent-blue-500"
                    />
                    {refImg && (
                      <img src={refImg} alt="" className="w-6 h-6 rounded object-cover" />
                    )}
                    <span className="text-xs text-gray-300 truncate max-w-[80px]">{refData?.name || '参考图'}</span>
                  </label>
                )
              })}
            </div>
          </div>
        )}

        {/* 导演台节点操作 */}
        {isDirectorStage && (
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-xs text-gray-400">
                机位 × {data.scene_data?.cameras?.length || 0} · 截图 × {(data.screenshots || []).length}
              </div>
              <button
                type="button"
                onClick={handleOpenDirectorStage}
                className="px-3 py-1 text-xs bg-white text-black rounded hover:bg-gray-200 transition-colors"
              >
                打开导演台
              </button>
            </div>
            {(data.screenshots || []).length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1">
                {(data.screenshots as DirectorStageScreenshot[]).map(shot => {
                  const shotImg = imageUrl(shot.image_path)
                  return (
                    <div key={shot.id} className="shrink-0 space-y-1">
                      <div
                        className="w-20 h-14 rounded border border-gray-700 overflow-hidden cursor-zoom-in bg-[#121214]"
                        onClick={() => shotImg && setZoomImage(shotImg)}
                      >
                        {shotImg ? (
                          <img src={shotImg} alt={shot.filename} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">无图</div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleSendShotToCanvas(shot)}
                        className="w-full text-[10px] bg-[#252525] text-gray-300 border border-gray-700 hover:border-gray-500 rounded py-0.5"
                      >
                        发送到画布
                      </button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* 参考图节点 */}
        {isReferenceImage && (
          <div className="bg-[#1a1a1a] rounded-lg p-3 border border-gray-700">
            {img && (
              <div className="w-full h-32 rounded border border-gray-700 overflow-hidden">
                <img src={img} alt={data.name || '参考图'} className="w-full h-full object-cover" />
              </div>
            )}
            <div className="mt-2 text-xs text-gray-400">来自导演台构图参考</div>
          </div>
        )}

        {nodeType === 'episode' && (
          <div className="text-sm text-gray-300 bg-[#1a1a1a] rounded-lg p-3 border border-gray-700">
            {data.plot_summary}
          </div>
        )}

        {data.status === 'failed' && data.error && (
          <div className="text-xs text-red-300 bg-red-900/20 border border-red-800 rounded-lg p-2">
            {data.error}
          </div>
        )}

        {/* 底部：输入框 + 参数 + 发送 */}
        <div className="flex items-end gap-3">
          <button
            type="button"
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-xl border border-dashed border-gray-600 text-gray-400 hover:border-gray-400 hover:text-white transition-colors"
          >
            +
          </button>
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2 text-xs text-gray-400">
              <span className="px-2 py-0.5 bg-[#1a1a1a] rounded border border-gray-700">风格转绘</span>
              <span className="px-2 py-0.5 bg-[#1a1a1a] rounded border border-gray-700">调色盘</span>
              <span className="px-2 py-0.5 bg-[#1a1a1a] rounded border border-gray-700">文本</span>
            </div>
            <input
              type="text"
              value={inputText}
              onChange={e => setInputText(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSend()}
              placeholder="请输入图片描述或指令..."
              className="w-full bg-[#1a1a1a] border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-gray-500"
            />
          </div>
          <button
            type="button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="w-10 h-10 shrink-0 flex items-center justify-center rounded-full bg-white text-black disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-200 transition-colors"
          >
            ↑
          </button>
        </div>

        {/* 参数栏 */}
        <div className="flex items-center gap-2 text-xs text-gray-400 overflow-x-auto pb-1">
          <button className="px-2.5 py-1 bg-[#1a1a1a] rounded-full border border-gray-700 hover:border-gray-500 whitespace-nowrap">🎨 Image 官方</button>
          <button className="px-2.5 py-1 bg-[#1a1a1a] rounded-full border border-gray-700 hover:border-gray-500 whitespace-nowrap">▣ 比例 16:9</button>
          <button className="px-2.5 py-1 bg-[#1a1a1a] rounded-full border border-gray-700 hover:border-gray-500 whitespace-nowrap">2K</button>
          <button className="px-2.5 py-1 bg-[#1a1a1a] rounded-full border border-gray-700 hover:border-gray-500 whitespace-nowrap">质量-高</button>
          <button className="px-2.5 py-1 bg-[#1a1a1a] rounded-full border border-gray-700 hover:border-gray-500 whitespace-nowrap">1 张</button>
        </div>
      </div>
      {zoomImage && <ImageModal src={zoomImage} alt="预览" onClose={() => setZoomImage(null)} />}
    </div>
  )
}
