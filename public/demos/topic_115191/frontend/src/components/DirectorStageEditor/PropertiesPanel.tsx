/** 右侧属性面板：根据选中对象动态展示场景/元素/相机属性，以及截图列表。 */
import { useState } from 'react'
import { imageUrl } from '../../api'
import type { ArmyConfig, DirectorStageCamera, DirectorStageElement, DirectorStageGroup, DirectorStageSceneData, DirectorStageScreenshot } from '../../types'
import { ImageModal } from '../ImageModal'
import { MESH_TYPE_NAME, POSES } from './elements/AiSceneElement'

interface PropertiesPanelProps {
  sceneData: DirectorStageSceneData
  selectedIds: string[]
  selectedType: 'element' | 'camera' | null
  selectedGroupId: string | null
  groups: DirectorStageGroup[]
  onUpdateScene: (patch: Partial<DirectorStageSceneData>) => void
  onUpdateElement: (id: string, patch: Partial<DirectorStageElement>) => void
  onUpdateCamera: (id: string, patch: Partial<DirectorStageCamera>) => void
  onUpdateGroup: (groupId: string, patch: { name?: string }) => void
  onUngroup: (groupId: string) => void
  onCreateGroup: (ids: string[]) => void
  onSelectGroup: (groupId: string) => void
  screenshots: DirectorStageScreenshot[]
  onSendToCanvas: (shot: DirectorStageScreenshot) => void
}

function Vec3Input({
  label,
  value,
  onChange,
  step = 0.1,
  angle = false,
  slider,
}: {
  label: string
  value: [number, number, number]
  onChange: (v: [number, number, number]) => void
  step?: number
  /** 角度模式：显示/编辑用度数，内部存储弧度 */
  angle?: boolean
  /** 可选滑块：提供范围时显示数字框 + 滑块双控 */
  slider?: { min: number; max: number; step: number }
}) {
  const toDisplay = (v: number) => (angle ? (v * 180) / Math.PI : v)
  const fromDisplay = (v: number) => (angle ? (v * Math.PI) / 180 : v)
  const set = (i: number, raw: number) => {
    const next = [...value] as [number, number, number]
    next[i] = fromDisplay(Number.isNaN(raw) ? 0 : raw)
    onChange(next)
  }
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-500">{label}{angle ? '（度）' : ''}</div>
      <div className="grid grid-cols-3 gap-1">
        {(['X', 'Y', 'Z'] as const).map((axis, i) => (
          <input
            key={axis}
            type="number"
            step={angle ? 1 : step}
            value={Number(toDisplay(value[i]).toFixed(2))}
            onChange={e => set(i, parseFloat(e.target.value))}
            className="bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-1.5 py-1 focus:outline-none focus:border-gray-500"
          />
        ))}
      </div>
      {slider && (
        <div className="grid grid-cols-3 gap-1">
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <input
              key={axis}
              type="range"
              min={slider.min}
              max={slider.max}
              step={slider.step}
              value={Number(toDisplay(value[i]).toFixed(2))}
              onChange={e => set(i, parseFloat(e.target.value))}
              className="w-full"
            />
          ))}
        </div>
      )}
    </div>
  )
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <div className="text-xs font-medium text-gray-400 uppercase tracking-wider">{title}</div>
      {children}
    </div>
  )
}

function NumberInput({
  label,
  value,
  min,
  max,
  step,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  onChange: (v: number) => void
}) {
  return (
    <div className="space-y-1">
      <div className="text-xs text-gray-400">{label}</div>
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => {
          const v = parseFloat(e.target.value)
          onChange(Number.isNaN(v) ? min : v)
        }}
        className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
      />
    </div>
  )
}

// 姿势中文标签：以 POSES 实际键为准，保证下拉项与预设严格对齐
const POSE_LABELS: Record<string, string> = {
  standing: '站立',
  dancing: '跳舞',
  arms_up: '举手欢呼',
  hands_on_hips: '叉腰',
  sitting: '坐下',
  running: '奔跑',
  pointing: '指向',
  jumping: '跳跃',
  waving: '招手',
}
const POSE_OPTIONS = Object.keys(POSES).map(k => ({ value: k, label: POSE_LABELS[k] || k }))

const ARMY_COLOR_FIELDS: { key: keyof ArmyConfig['colors']; label: string }[] = [
  { key: 'jacket', label: '外套' },
  { key: 'shirt', label: '衬衫' },
  { key: 'pants', label: '裤子' },
  { key: 'hair', label: '头发' },
  { key: 'skin', label: '皮肤' },
  { key: 'shoes', label: '鞋子' },
]

export function PropertiesPanel({
  sceneData,
  selectedIds,
  selectedType,
  selectedGroupId,
  groups,
  onUpdateScene,
  onUpdateElement,
  onUpdateCamera,
  onUpdateGroup,
  onUngroup,
  onCreateGroup,
  onSelectGroup,
  screenshots,
  onSendToCanvas,
}: PropertiesPanelProps) {
  const [zoomImage, setZoomImage] = useState<string | null>(null)

  const selectedElements = selectedIds
    .map(id => sceneData.elements.find(e => e.id === id))
    .filter((e): e is DirectorStageElement => !!e)
  const selectedGroup = selectedGroupId
    ? groups.find(g => g.id === selectedGroupId) ?? null
    : null
  const selectedCamera = selectedType === 'camera'
    ? sceneData.cameras.find(c => c.id === selectedIds[0]) || null
    : null

  // 场景属性
  const renderSceneProps = () => (
    <Section title="场景">
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">背景颜色</span>
          <input
            type="color"
            value={sceneData.background.color}
            onChange={e => onUpdateScene({ background: { ...sceneData.background, color: e.target.value } })}
            className="w-8 h-6 bg-transparent border-0 cursor-pointer"
          />
        </div>
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">显示网格</span>
          <button
            type="button"
            onClick={() => onUpdateScene({ background: { ...sceneData.background, showGrid: !sceneData.background.showGrid } })}
            className={`w-9 h-5 rounded-full transition-colors relative ${
              sceneData.background.showGrid !== false ? 'bg-blue-500' : 'bg-gray-700'
            }`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${
                sceneData.background.showGrid !== false ? 'translate-x-4' : ''
              }`}
            />
          </button>
        </div>
        <div className="space-y-1">
          <div className="text-xs text-gray-400">环境光强度</div>
          <input
            type="range"
            min={0}
            max={2}
            step={0.1}
            value={sceneData.environment.ambientIntensity ?? 0.6}
            onChange={e => onUpdateScene({ environment: { ...sceneData.environment, ambientIntensity: parseFloat(e.target.value) } })}
            className="w-full"
          />
        </div>
      </div>
    </Section>
  )

  // 元素属性
  const renderElementProps = (el: DirectorStageElement) => {
    if (!el) return null
    const isAiObject = el.type === 'ai_object'
    const isAiScene = el.type === 'ai_scene'
    const isArmy = el.type === 'army'
    const army = el.army
    return (
      <Section title="元素">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-gray-400">名称</div>
            <input
              type="text"
              value={el.name}
              onChange={e => onUpdateElement(el.id, { name: e.target.value })}
              className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            />
          </div>

          {/* 方阵配置：行列/方阵数/间距/姿势/性别/颜色，改即所见 */}
          {isArmy && army && (
            <div className="space-y-2 rounded border border-gray-700 bg-[#0f0f0f] p-2">
              <div className="text-xs text-gray-400">方阵配置</div>
              <NumberInput label="行数" value={army.rows} min={1} max={200} step={1}
                onChange={v => onUpdateElement(el.id, { army: { ...army, rows: Math.round(v) } })} />
              <NumberInput label="列数" value={army.cols} min={1} max={200} step={1}
                onChange={v => onUpdateElement(el.id, { army: { ...army, cols: Math.round(v) } })} />
              <NumberInput label="方阵数" value={army.formations} min={1} max={9} step={1}
                onChange={v => onUpdateElement(el.id, { army: { ...army, formations: Math.round(v) } })} />
              <NumberInput label="士兵间距（米）" value={army.spacing} min={0.2} max={3} step={0.1}
                onChange={v => onUpdateElement(el.id, { army: { ...army, spacing: v } })} />
              <NumberInput label="方阵间距系数" value={army.formationGap} min={1} max={40} step={1}
                onChange={v => onUpdateElement(el.id, { army: { ...army, formationGap: Math.round(v) } })} />
              <div className="text-xs text-gray-500">= {army.formationGap}×间距 = {(army.formationGap * army.spacing).toFixed(1)} 米</div>
              <div className="text-xs text-gray-300">
                总士兵数：{army.rows} × {army.cols} × {army.formations} = <span className="text-white">{army.rows * army.cols * army.formations}</span>
              </div>
              <div className="space-y-1">
                <div className="text-xs text-gray-400">姿势</div>
                <select
                  value={army.pose}
                  onChange={e => onUpdateElement(el.id, { army: { ...army, pose: e.target.value } })}
                  className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
                >
                  {POSE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">性别（{army.isWoman ? '女' : '男'}）</span>
                <button
                  type="button"
                  onClick={() => onUpdateElement(el.id, { army: { ...army, isWoman: !army.isWoman } })}
                  className={`w-9 h-5 rounded-full transition-colors relative ${army.isWoman ? 'bg-pink-500' : 'bg-blue-500'}`}
                >
                  <span className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-transform ${army.isWoman ? 'translate-x-4' : ''}`} />
                </button>
              </div>
              <div className="text-xs text-gray-400">颜色</div>
              {ARMY_COLOR_FIELDS.map(f => (
                <div key={f.key} className="flex items-center justify-between">
                  <span className="text-xs text-gray-400">{f.label}</span>
                  <input
                    type="color"
                    value={army.colors[f.key]}
                    onChange={e => onUpdateElement(el.id, { army: { ...army, colors: { ...army.colors, [f.key]: e.target.value } } })}
                    className="w-8 h-6 bg-transparent border-0 cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}

          {/* AI 物体类型与生成描述 */}
          {isAiObject && el.mesh && (
            <div className="space-y-1">
              <div className="text-xs text-gray-400">类型</div>
              <div className="text-xs text-gray-200">{MESH_TYPE_NAME[el.mesh.type] || el.mesh.type}</div>
            </div>
          )}
          {isAiObject && el.prompt && (
            <div className="space-y-1">
              <div className="text-xs text-gray-400">生成描述</div>
              <div className="text-xs text-gray-300 bg-[#1a1a1a] border border-gray-700 rounded px-2 py-1">{el.prompt}</div>
            </div>
          )}
          {isAiScene && (
            <div className="text-xs text-gray-500">
              {el.sceneDescription?.meshes?.length || 0} 个物体（遗留场景组）
            </div>
          )}

          {!isAiScene && !isArmy && (
            <div className="flex items-center justify-between">
              <span className="text-xs text-gray-400">颜色</span>
              <input
                type="color"
                value={el.color}
                onChange={e => onUpdateElement(el.id, { color: e.target.value })}
                className="w-8 h-6 bg-transparent border-0 cursor-pointer"
              />
            </div>
          )}

          <Vec3Input
            label="位置"
            value={el.transform.position}
            onChange={v => onUpdateElement(el.id, { transform: { ...el.transform, position: v } })}
            step={0.1}
            slider={{ min: -50, max: 50, step: 0.1 }}
          />
          <Vec3Input
            label="旋转"
            value={el.transform.rotation}
            onChange={v => onUpdateElement(el.id, { transform: { ...el.transform, rotation: v } })}
            step={0.1}
            angle
            slider={{ min: -180, max: 180, step: 1 }}
          />
          <Vec3Input
            label="缩放"
            value={el.transform.scale}
            onChange={v => onUpdateElement(el.id, { transform: { ...el.transform, scale: v } })}
            step={0.1}
            slider={{ min: 0.1, max: 10, step: 0.1 }}
          />
        </div>
      </Section>
    )
  }

  // 相机属性
  const renderCameraProps = () => {
    if (!selectedCamera) return null
    const cam = selectedCamera
    return (
      <Section title="相机">
        <div className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-gray-400">名称</div>
            <input
              type="text"
              value={cam.name}
              onChange={e => onUpdateCamera(cam.id, { name: e.target.value })}
              className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            />
          </div>
          <Vec3Input
            label="位置"
            value={cam.position}
            onChange={v => onUpdateCamera(cam.id, { position: v })}
            step={0.1}
          />
          <Vec3Input
            label="目标"
            value={cam.target}
            onChange={v => onUpdateCamera(cam.id, { target: v })}
            step={0.1}
          />
          <div className="space-y-1">
            <div className="text-xs text-gray-400">FOV</div>
            <input
              type="number"
              min={10}
              max={120}
              step={1}
              value={cam.fov}
              onChange={e => onUpdateCamera(cam.id, { fov: parseInt(e.target.value, 10) || 50 })}
              className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-gray-400">比例</div>
            <select
              value={cam.aspect}
              onChange={e => onUpdateCamera(cam.id, { aspect: e.target.value as DirectorStageCamera['aspect'] })}
              className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            >
              <option value="16:9">16:9</option>
              <option value="9:16">9:16</option>
              <option value="4:3">4:3</option>
              <option value="1:1">1:1</option>
            </select>
          </div>
        </div>
      </Section>
    )
  }

  // 整体平移控件：输入 dx/dy/dz 后点击「应用」批量偏移选中对象的位置
  const BatchTranslate = ({ onApply }: { onApply: (delta: [number, number, number]) => void }) => {
    const [delta, setDelta] = useState<[number, number, number]>([0, 0, 0])
    return (
      <div className="space-y-1 rounded border border-gray-700 bg-[#0f0f0f] p-2">
        <div className="text-xs text-gray-400">整体平移（米）</div>
        <div className="grid grid-cols-3 gap-1">
          {(['X', 'Y', 'Z'] as const).map((axis, i) => (
            <input
              key={axis}
              type="number"
              step={0.1}
              value={Number(delta[i].toFixed(3))}
              onChange={e => {
                const n = [...delta] as [number, number, number]
                n[i] = parseFloat(e.target.value) || 0
                setDelta(n)
              }}
              className="bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-1.5 py-1 focus:outline-none focus:border-gray-500"
            />
          ))}
        </div>
        <button
          type="button"
          onClick={() => {
            onApply(delta)
            setDelta([0, 0, 0])
          }}
          className="w-full text-xs bg-blue-600 text-white rounded py-1 hover:bg-blue-500"
        >
          应用
        </button>
      </div>
    )
  }

  // 编组属性：改名、显隐/锁定（批量应用到成员）、整体平移、解散
  const renderGroupProps = (group: DirectorStageGroup) => {
    const members = group.memberIds
      .map(id => sceneData.elements.find(e => e.id === id))
      .filter((e): e is DirectorStageElement => !!e)
    const allVisible = members.length > 0 && members.every(m => m.visible !== false)
    const allLocked = members.length > 0 && members.every(m => m.locked)
    return (
      <Section title="编组">
        <div className="space-y-2">
          <div className="space-y-1">
            <div className="text-xs text-gray-400">组名称</div>
            <input
              type="text"
              value={group.name}
              onChange={e => onUpdateGroup(group.id, { name: e.target.value })}
              className="w-full bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500"
            />
          </div>
          <div className="text-xs text-gray-500">成员数：{members.length}</div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => members.forEach(m => onUpdateElement(m.id, { visible: !allVisible }))}
              className="flex-1 text-xs bg-[#1a1a1a] text-gray-200 border border-gray-700 rounded py-1 hover:border-gray-500"
            >
              {allVisible ? '隐藏全部' : '显示全部'}
            </button>
            <button
              type="button"
              onClick={() => members.forEach(m => onUpdateElement(m.id, { locked: !allLocked }))}
              className="flex-1 text-xs bg-[#1a1a1a] text-gray-200 border border-gray-700 rounded py-1 hover:border-gray-500"
            >
              {allLocked ? '解锁全部' : '锁定全部'}
            </button>
          </div>
          <BatchTranslate
            onApply={d =>
              members.forEach(m => {
                const p = m.transform.position
                onUpdateElement(m.id, {
                  transform: { ...m.transform, position: [p[0] + d[0], p[1] + d[1], p[2] + d[2]] },
                })
              })
            }
          />
          <button
            type="button"
            onClick={() => onSelectGroup(group.id)}
            className="w-full text-xs bg-[#1a1a1a] text-gray-300 border border-gray-700 rounded py-1 hover:border-gray-500"
          >
            选中全部成员
          </button>
          <button
            type="button"
            onClick={() => onUngroup(group.id)}
            className="w-full text-xs bg-red-900/50 text-red-300 border border-red-800 rounded py-1 hover:bg-red-900"
          >
            解散组
          </button>
        </div>
      </Section>
    )
  }

  // 多选（非组）批量属性
  const renderBatchProps = (elements: DirectorStageElement[]) => (
    <Section title={`已选 ${elements.length} 个元素`}>
      <div className="space-y-2">
        <BatchTranslate
          onApply={d =>
            elements.forEach(el => {
              const p = el.transform.position
              onUpdateElement(el.id, {
                transform: { ...el.transform, position: [p[0] + d[0], p[1] + d[1], p[2] + d[2]] },
              })
            })
          }
        />
        <button
          type="button"
          onClick={() => onCreateGroup(elements.map(e => e.id))}
          className="w-full text-xs bg-blue-600 text-white rounded py-1.5 hover:bg-blue-500"
        >
          📦 编组所选
        </button>
      </div>
    </Section>
  )

  const renderBody = () => {
    if (selectedGroup) return renderGroupProps(selectedGroup)
    if (selectedElements.length === 1) return renderElementProps(selectedElements[0])
    if (selectedElements.length > 1) return renderBatchProps(selectedElements)
    if (selectedCamera) return renderCameraProps()
    return renderSceneProps()
  }

  return (
    <div className="w-72 bg-[#141414] border-l border-gray-800 flex flex-col shrink-0">
      <div className="h-10 border-b border-gray-800 flex items-center px-3">
        <span className="text-sm font-medium text-white">属性</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-5">
        {renderBody()}

        {/* 截图列表 */}
        <Section title="截图">
          <div className="grid grid-cols-2 gap-2">
            {screenshots.map(shot => {
              const img = imageUrl(shot.image_path)
              return (
                <div key={shot.id} className="space-y-1">
                  <div
                    className="aspect-video bg-[#1a1a1a] rounded border border-gray-700 overflow-hidden cursor-zoom-in"
                    onClick={() => img && setZoomImage(img)}
                  >
                    {img ? (
                      <img src={img} alt={shot.filename} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xs text-gray-600">无图</div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => onSendToCanvas(shot)}
                    className="w-full text-xs bg-[#1a1a1a] text-gray-300 border border-gray-700 hover:border-gray-500 rounded py-1 transition-colors"
                  >
                    发送到画布
                  </button>
                </div>
              )
            })}
            {screenshots.length === 0 && (
              <div className="col-span-2 text-xs text-gray-600 py-2">暂无截图，选择机位后点击顶部「截图」</div>
            )}
          </div>
        </Section>
      </div>

      {zoomImage && <ImageModal src={zoomImage} alt="截图预览" onClose={() => setZoomImage(null)} />}
    </div>
  )
}
