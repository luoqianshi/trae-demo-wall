/** 左侧场景树：展示元素/机位/编组，支持搜索过滤、Shift/Ctrl 多选、编组/解组、选中、重命名、显示/隐藏、删除、添加。 */
import { useMemo, useState } from 'react'
import type { DirectorStageCamera, DirectorStageElement, DirectorStageGroup } from '../../types'

type SelectMode = 'single' | 'add' | 'range'

interface SceneTreeProps {
  elements: DirectorStageElement[]
  cameras: DirectorStageCamera[]
  groups: DirectorStageGroup[]
  selectedIds: string[]
  selectedType: 'element' | 'camera' | null
  selectedGroupId: string | null
  onSelect: (id: string, type: 'element' | 'camera', mode: SelectMode) => void
  onSelectGroup: (groupId: string) => void
  onAddElement: (type: DirectorStageElement['type'], geometry?: DirectorStageElement['geometry']) => void
  onAddCamera: () => void
  onGenerateAiScene: (prompt: string) => void
  onUpdateElement: (id: string, patch: Partial<DirectorStageElement>) => void
  onUpdateCamera: (id: string, patch: Partial<DirectorStageCamera>) => void
  onRemoveElement: (id: string) => void
  onRemoveCamera: (id: string) => void
  onGroupCreate: (ids: string[]) => void
  onGroupUngroup: (groupId: string) => void
}

const ELEMENT_ICONS: Record<string, string> = {
  army: '👥',
  ai_object: '✨',
  ai_scene: '🌐',
  cube: '🟦',
  sphere: '🔵',
  cylinder: '🛢️',
  cone: '🔺',
  torus: '🍩',
  plane: '⬜',
}

function TreeItem({
  icon,
  name,
  selected,
  visible,
  onSelect,
  onToggleVisible,
  onRename,
  onRemove,
}: {
  icon: string
  name: string
  selected: boolean
  visible?: boolean
  onSelect: (e: React.MouseEvent) => void
  onToggleVisible?: () => void
  onRename: (name: string) => void
  onRemove: () => void
}) {
  const [editing, setEditing] = useState(false)
  const [editName, setEditName] = useState(name)

  return (
    <div
      className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
        selected ? 'bg-white/15 ring-1 ring-white/30' : 'hover:bg-white/5'
      }`}
      onClick={onSelect}
    >
      <span className="text-sm w-5 text-center">{icon}</span>
      {editing ? (
        <input
          type="text"
          value={editName}
          onChange={e => setEditName(e.target.value)}
          onBlur={() => {
            onRename(editName)
            setEditing(false)
          }}
          onKeyDown={e => {
            if (e.key === 'Enter') {
              onRename(editName)
              setEditing(false)
            }
          }}
          onClick={e => e.stopPropagation()}
          autoFocus
          className="flex-1 bg-[#1a1a1a] text-white text-xs border border-gray-600 rounded px-1 py-0.5 focus:outline-none"
        />
      ) : (
        <span
          className="flex-1 text-xs text-gray-200 truncate"
          onDoubleClick={e => {
            e.stopPropagation()
            setEditing(true)
            setEditName(name)
          }}
        >
          {name}
        </span>
      )}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {onToggleVisible && (
          <button
            type="button"
            onClick={e => {
              e.stopPropagation()
              onToggleVisible()
            }}
            className="text-xs text-gray-400 hover:text-white px-1"
            title={visible ? '隐藏' : '显示'}
          >
            {visible !== false ? '👁' : '🚫'}
          </button>
        )}
        <button
          type="button"
          onClick={e => {
            e.stopPropagation()
            onRemove()
          }}
          className="text-xs text-gray-400 hover:text-red-400 px-1"
          title="删除"
        >
          🗑
        </button>
      </div>
    </div>
  )
}

export function SceneTree({
  elements,
  cameras,
  groups,
  selectedIds,
  selectedType,
  selectedGroupId,
  onSelect,
  onSelectGroup,
  onAddElement,
  onAddCamera,
  onGenerateAiScene,
  onUpdateElement,
  onUpdateCamera,
  onRemoveElement,
  onRemoveCamera,
  onGroupCreate,
  onGroupUngroup,
}: SceneTreeProps) {
  const [aiScenePrompt, setAiScenePrompt] = useState('')
  const [search, setSearch] = useState('')

  const submitAiScene = () => {
    const prompt = aiScenePrompt.trim()
    if (prompt) onGenerateAiScene(prompt)
    setAiScenePrompt('')
  }

  const filteredElements = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return elements
    return elements.filter(el => el.name.toLowerCase().includes(q))
  }, [elements, search])

  const filteredCameras = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return cameras
    return cameras.filter(cam => cam.name.toLowerCase().includes(q))
  }, [cameras, search])

  const elementSelectionCount = selectedIds.length

  const handleClick = (e: React.MouseEvent, id: string, type: 'element' | 'camera') => {
    const mode: SelectMode = e.shiftKey ? 'range' : e.ctrlKey || e.metaKey ? 'add' : 'single'
    onSelect(id, type, mode)
  }

  return (
    <div className="w-60 bg-[#141414] border-r border-gray-800 flex flex-col shrink-0">
      <div className="h-10 border-b border-gray-800 flex items-center justify-between px-3">
        <span className="text-sm font-medium text-white">场景</span>
      </div>

      <div className="p-2 border-b border-gray-800 space-y-2">
        <div>
          <div className="text-xs text-gray-500 mb-1.5">AI 生成物体</div>
          <textarea
            value={aiScenePrompt}
            onChange={e => setAiScenePrompt(e.target.value)}
            placeholder="描述要生成的物体，如：一个男人坐在桌子旁，桌上有杯水"
            rows={2}
            onKeyDown={e => {
              if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
                e.preventDefault()
                submitAiScene()
              }
            }}
            className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-600 rounded px-2 py-1 focus:outline-none focus:border-gray-400 resize-none"
          />
          <button
            type="button"
            onClick={submitAiScene}
            disabled={!aiScenePrompt.trim()}
            className="mt-1.5 w-full px-2 py-1 text-xs bg-white text-black rounded hover:bg-gray-200 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            ✨ 生成
          </button>
        </div>
        <div>
          <div className="text-xs text-gray-500 mb-1.5">基础几何体</div>
          <div className="flex flex-wrap gap-1.5">
            {(['cube', 'sphere', 'cylinder', 'cone', 'torus', 'plane'] as const).map(geo => (
              <button
                key={geo}
                type="button"
                onClick={() => onAddElement('geometry', geo)}
                className="px-2 py-1 text-xs bg-[#1a1a1a] text-gray-300 border border-gray-700 hover:border-gray-500 rounded"
                title={geo}
              >
                {ELEMENT_ICONS[geo]} {geo}
              </button>
            ))}
            <button
              type="button"
              onClick={onAddCamera}
              className="px-2 py-1 text-xs bg-[#1a1a1a] text-gray-300 border border-gray-700 hover:border-gray-500 rounded"
            >
              📷 机位
            </button>
          </div>
        </div>
      </div>

      <div className="p-2 border-b border-gray-800">
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="搜索元素/机位..."
          className="w-full bg-[#1a1a1a] text-white text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
        />
      </div>

      <div className="flex-1 overflow-y-auto p-2 space-y-3">
        {/* 编组区 */}
        {groups.length > 0 && (
          <div>
            <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
              <span>编组</span>
              <span className="text-gray-600">{groups.length}</span>
            </div>
            <div className="space-y-0.5">
              {groups.map(g => (
                <div
                  key={g.id}
                  className={`flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${
                    selectedGroupId === g.id ? 'bg-white/15 ring-1 ring-white/30' : 'hover:bg-white/5'
                  }`}
                  onClick={() => onSelectGroup(g.id)}
                >
                  <span className="text-sm w-5 text-center">📦</span>
                  <span className="flex-1 text-xs text-gray-200 truncate">{g.name}</span>
                  <span className="text-[10px] text-gray-500">{g.memberIds.length}</span>
                  <button
                    type="button"
                    onClick={e => {
                      e.stopPropagation()
                      onGroupUngroup(g.id)
                    }}
                    className="text-xs text-gray-400 hover:text-red-400 px-1 opacity-0 group-hover:opacity-100"
                    title="解散组"
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 元素分组 */}
        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
            <span>元素</span>
            <span className="text-gray-600">{elements.length}</span>
          </div>
          {elementSelectionCount > 1 && (
            <button
              type="button"
              onClick={() => onGroupCreate(selectedIds)}
              className="mb-1.5 w-full px-2 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-500"
            >
              📦 编组所选 ({elementSelectionCount})
            </button>
          )}
          <div className="space-y-0.5">
            {filteredElements.map(el => (
              <TreeItem
                key={el.id}
                icon={
                  el.type === 'army' ? ELEMENT_ICONS.army
                  : el.type === 'ai_object' ? ELEMENT_ICONS.ai_object
                  : el.type === 'ai_scene' ? ELEMENT_ICONS.ai_scene
                  : ELEMENT_ICONS[el.geometry || 'cube']
                }
                name={el.name}
                selected={selectedIds.includes(el.id) && selectedType === 'element'}
                visible={el.visible}
                onSelect={e => handleClick(e, el.id, 'element')}
                onToggleVisible={() => onUpdateElement(el.id, { visible: !el.visible })}
                onRename={name => onUpdateElement(el.id, { name })}
                onRemove={() => onRemoveElement(el.id)}
              />
            ))}
            {filteredElements.length === 0 && (
              <div className="text-xs text-gray-600 px-2 py-1">暂无元素</div>
            )}
          </div>
        </div>

        {/* 机位分组 */}
        <div>
          <div className="text-xs text-gray-500 mb-1 flex items-center justify-between">
            <span>机位</span>
            <span className="text-gray-600">{cameras.length}</span>
          </div>
          <div className="space-y-0.5">
            {filteredCameras.map(cam => (
              <TreeItem
                key={cam.id}
                icon="📷"
                name={cam.name}
                selected={selectedIds.includes(cam.id) && selectedType === 'camera'}
                onSelect={e => handleClick(e, cam.id, 'camera')}
                onRename={name => onUpdateCamera(cam.id, { name })}
                onRemove={() => onRemoveCamera(cam.id)}
              />
            ))}
            {filteredCameras.length === 0 && (
              <div className="text-xs text-gray-600 px-2 py-1">暂无机位</div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
