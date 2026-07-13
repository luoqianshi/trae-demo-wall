/** 导演台 3D 编辑器主壳（全屏 Modal）。
 *
 * 布局：左侧场景树 | 中央 3D 视口 | 右属性面板
 *       底部工具栏
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useStore } from '../../store'
import { directorStagesApi } from '../../api'
import type { DirectorStageCamera, DirectorStageElement, DirectorStageGroup, DirectorStageSceneData, DirectorStageScreenshot, SceneDescription } from '../../types'
import { MESH_TYPE_NAME } from './elements/AiSceneElement'
import { SceneTree } from './SceneTree'
import { PropertiesPanel } from './PropertiesPanel'
import { Toolbar } from './Toolbar'
import { Viewport3D, type Viewport3DRef } from './Viewport3D'

const DEFAULT_SCENE_DATA: DirectorStageSceneData = {
  background: { color: '#111111', showGrid: true },
  environment: { ambientIntensity: 0.6 },
  elements: [],
  cameras: [],
  groups: [],
}

const MAX_ARMY_INSTANCES = 20000

function generateId() {
  return crypto.randomUUID()
}

// ===== 前端方阵生成：输入"N×N方阵"时直接生成，不走后端 AI =====
interface ArmyPromptMatch {
  rows: number
  cols: number
  formations: number
  pose: string
  isWoman: boolean
  withMountains: boolean
}

function matchArmyPrompt(prompt: string): ArmyPromptMatch | null {
  // 匹配方阵/军队意图。两种模式任一命中即可：
  //  1) 数字×数字 + (人|兵|士兵|个)? + (方阵|军队|阵|占位|列阵|布阵|密集|兵团)
  //     覆盖："100×100方阵"、"25*25人的军队密集占位"、"30x30士兵方阵"
  //  2) 数字×数字 + (士兵|兵|人) —— "N×N士兵/人" 几乎都是方阵意图
  const PATTERN_WITH_KEYWORD = /(\d+)\s*[×x*]\s*(\d+)\s*(?:人|兵|士兵|个)?\s*(?:方阵|军队|阵|占位|列阵|布阵|密集|兵团)/
  const PATTERN_PLURAL_UNIT = /(\d+)\s*[×x*]\s*(\d+)\s*(?:士兵|兵|人)/
  const m = prompt.match(PATTERN_WITH_KEYWORD) || prompt.match(PATTERN_PLURAL_UNIT)
  if (!m) return null
  const rows = Math.min(parseInt(m[1]), 200) // 单方阵上限保护
  const cols = Math.min(parseInt(m[2]), 200)
  // "满山遍野/多个" → 多个方阵
  const formations = /满山遍野|多个方阵|漫山遍野|一片/.test(prompt) ? 9 : 1
  const pose = /跑/.test(prompt) ? 'running'
    : /举|欢呼|cheer/.test(prompt) ? 'arms_up'
    : /跳/.test(prompt) ? 'jumping'
    : 'standing'
  const isWoman = /女|woman|girl/.test(prompt)
  const withMountains = /山|满山|漫山/.test(prompt)
  return { rows, cols, formations, pose, isWoman, withMountains }
}

function buildArmyElements(m: ArmyPromptMatch): { elements: DirectorStageElement[]; downsampled: boolean; note?: string } {
  let { rows, cols, formations } = m
  let downsampled = false
  let note: string | undefined
  const total = rows * cols * formations
  if (total > MAX_ARMY_INSTANCES) {
    // 优先减少方阵数
    const maxFormations = Math.max(1, Math.floor(MAX_ARMY_INSTANCES / (rows * cols)))
    if (formations > maxFormations) {
      formations = maxFormations
      downsampled = true
    }
    // 仍超限则把行列收敛为方形
    if (rows * cols * formations > MAX_ARMY_INSTANCES) {
      const side = Math.max(1, Math.floor(Math.sqrt(MAX_ARMY_INSTANCES / formations)))
      rows = side
      cols = side
      downsampled = true
    }
    note = `已自动降采样方阵至 ${rows}×${cols}${formations > 1 ? `×${formations}` : ''}（上限 ${MAX_ARMY_INSTANCES} 实例）`
  }

  const elements: DirectorStageElement[] = []
  // 1. army 方阵元素（使用降采样后的 rows/cols/formations）
  elements.push({
    id: generateId(),
    type: 'army',
    name: `${rows}×${cols} 方阵${formations > 1 ? `×${formations}` : ''}`,
    color: '#3a5a8a',
    transform: { position: [0, 0, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
    visible: true,
    locked: false,
    army: {
      rows,
      cols,
      formations,
      spacing: 0.6,
      formationGap: 20, // = 20 * 0.6 = 12 米，满足"间隔20个士兵距离"
      pose: m.pose,
      isWoman: m.isWoman,
      colors: m.isWoman
        ? { skin: '#e8b890', hair: '#3a2418', jacket: '#d96a8e', shirt: '#f5d0e0', pants: '#2a2438', shoes: '#0f1118' }
        : { skin: '#c89878', hair: '#15100a', jacket: '#3a5a8a', shirt: '#e8e8f0', pants: '#171a22', shoes: '#0f1118' },
    },
    prompt: '方阵',
  })
  // 2. 山体元素（"满山遍野"配合，围绕方阵布置）
  if (m.withMountains) {
    const mountains: { pos: [number, number, number]; scale: [number, number, number]; color: string }[] = [
      { pos: [-15, 0, -10], scale: [8, 6, 8], color: '#3a4a3a' },
      { pos: [18, 0, -8], scale: [9, 7, 9], color: '#4a5a4a' },
      { pos: [0, 0, -25], scale: [12, 10, 12], color: '#2a3a2a' },
      { pos: [-22, 0, 8], scale: [7, 5, 7], color: '#4a5a4a' },
      { pos: [20, 0, 15], scale: [10, 8, 10], color: '#3a4a3a' },
    ]
    mountains.forEach((mt, i) => {
      elements.push({
        id: generateId(),
        type: 'ai_object' as const,
        name: `山 ${i + 1}`,
        color: mt.color,
        transform: { position: mt.pos, rotation: [0, i * 0.7, 0], scale: mt.scale },
        visible: true,
        locked: false,
        mesh: { type: 'mountain' as const, position: mt.pos, rotation: [0, i * 0.7, 0], scale: mt.scale, color: mt.color },
      })
    })
  }
  return { elements, downsampled, note }
}

function emptyTransform() {
  return {
    position: [0, 0, 0] as [number, number, number],
    rotation: [0, 0, 0] as [number, number, number],
    scale: [1, 1, 1] as [number, number, number],
  }
}

// 归一化遗留元素：丢弃 human_model，把旧 ai_scene 拆为多个独立可移动的 ai_object
function normalizeLegacyElements(elements: DirectorStageElement[]): DirectorStageElement[] {
  const result: DirectorStageElement[] = []
  for (const el of elements) {
    // 旧数据可能含 human_model（已废弃类型），直接丢弃
    if ((el as { type: string }).type === 'human_model') {
      continue
    }
    if (el.type === 'ai_scene' && el.sceneDescription?.meshes?.length) {
      for (const mesh of el.sceneDescription.meshes) {
        result.push({
          id: generateId(),
          type: 'ai_object',
          name: MESH_TYPE_NAME[mesh.type] || mesh.type,
          color: mesh.color,
          transform: {
            position: mesh.position,
            rotation: mesh.rotation || [0, 0, 0],
            scale: mesh.scale,
          },
          visible: el.visible,
          locked: el.locked,
          mesh,
          prompt: el.prompt,
        })
      }
      continue
    }
    result.push(el)
  }
  return result
}

type SelectMode = 'single' | 'add' | 'range'

export function DirectorStageEditor({ stageId, onClose }: { stageId: string; onClose: () => void }) {
  const stageNode = useStore(s => s.nodes.find(n => n.id === `ds-${stageId}`))
  const updateDirectorStageNode = useStore(s => s.updateDirectorStageNode)
  const addReferenceImageNode = useStore(s => s.addReferenceImageNode)

  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('导演台')
  const [sceneData, setSceneData] = useState<DirectorStageSceneData>(DEFAULT_SCENE_DATA)
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [selectedType, setSelectedType] = useState<'element' | 'camera' | null>(null)
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  const [transformMode, setTransformMode] = useState<'translate' | 'rotate' | 'scale'>('translate')
  const [activeCameraId, setActiveCameraId] = useState<string | null>(null)
  const [viewMode, setViewMode] = useState<'director' | 'camera'>('director')
  const [saving, setSaving] = useState(false)
  const [screenshotUploading, setScreenshotUploading] = useState(false)
  const [viewportReady, setViewportReady] = useState(false)
  const [aiSceneLoading, setAiSceneLoading] = useState(false)
  const [manualJsonOpen, setManualJsonOpen] = useState(false)
  const [manualJson, setManualJson] = useState('')

  const viewportRef = useRef<Viewport3DRef>(null)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  // 用 ref 持有最新 sceneData，避免 scheduleSave 闭包捕获过期状态
  const sceneDataRef = useRef(sceneData)
  sceneDataRef.current = sceneData

  // 撤销/重做历史栈
  const historyRef = useRef<{ past: DirectorStageSceneData[]; future: DirectorStageSceneData[] }>({ past: [], future: [] })
  const lastEditRef = useRef<{ key: string; t: number } | null>(null)
  const anchorIdRef = useRef<string | null>(null)
  const [canUndoRedo, setCanUndoRedo] = useState({ undo: false, redo: false })
  const syncHist = useCallback(() => {
    setCanUndoRedo({ undo: historyRef.current.past.length > 0, redo: historyRef.current.future.length > 0 })
  }, [])

  // 加载导演台数据
  useEffect(() => {
    let cancelled = false
    directorStagesApi.get(stageId).then(ds => {
      if (cancelled) return
      setName(ds.name)
      setSceneData({
        ...DEFAULT_SCENE_DATA,
        ...(ds.scene_data || {}),
        groups: ds.scene_data?.groups || [],
        elements: normalizeLegacyElements(ds.scene_data?.elements || []),
      })
      setLoading(false)
    }).catch(e => {
      console.error('加载导演台失败:', e)
      if (!cancelled) setLoading(false)
    })
    return () => { cancelled = true }
  }, [stageId])

  // 防抖保存 scene_data（从 ref 读取最新数据）
  const scheduleSave = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      setSaving(true)
      directorStagesApi.update(stageId, { scene_data: sceneDataRef.current }).finally(() => {
        setSaving(false)
      })
    }, 800)
  }, [stageId])

  // 统一提交：记录历史（支持 600ms 合并窗口，合并连续输入为一步），并触发保存
  const commit = useCallback((producer: (prev: DirectorStageSceneData) => DirectorStageSceneData, mergeKey?: string) => {
    setSceneData(prev => {
      const now = Date.now()
      const merge = !!mergeKey && lastEditRef.current?.key === mergeKey && now - lastEditRef.current.t < 600
      if (!merge) {
        historyRef.current.past.push(prev)
        if (historyRef.current.past.length > 100) historyRef.current.past.shift()
        historyRef.current.future = []
      }
      if (mergeKey) lastEditRef.current = { key: mergeKey, t: now }
      return producer(prev)
    })
    scheduleSave()
    syncHist()
  }, [scheduleSave, syncHist])

  const undo = useCallback(() => {
    if (historyRef.current.past.length === 0) return
    setSceneData(prev => {
      const last = historyRef.current.past.pop()!
      historyRef.current.future.push(prev)
      return last
    })
    scheduleSave()
    syncHist()
  }, [scheduleSave, syncHist])

  const redo = useCallback(() => {
    if (historyRef.current.future.length === 0) return
    setSceneData(prev => {
      const next = historyRef.current.future.pop()!
      historyRef.current.past.push(prev)
      return next
    })
    scheduleSave()
    syncHist()
  }, [scheduleSave, syncHist])

  // 快捷键：Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做（输入框内让原生文本撤销生效）
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault()
        redo()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [undo, redo])

  // 关闭时立即保存
  const handleClose = useCallback(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    const latest = sceneDataRef.current
    updateDirectorStageNode(stageId, { scene_data: latest })
    directorStagesApi.update(stageId, { scene_data: latest }).finally(() => {
      onClose()
    })
  }, [stageId, onClose, updateDirectorStageNode])

  const handleNameChange = useCallback(async (newName: string) => {
    setName(newName)
    updateDirectorStageNode(stageId, { name: newName })
    await directorStagesApi.update(stageId, { name: newName })
  }, [stageId, updateDirectorStageNode])

  const addElement = useCallback((type: DirectorStageElement['type'], geometry?: DirectorStageElement['geometry']) => {
    const id = generateId()
    const element: DirectorStageElement = {
      id,
      type,
      name: geometry === 'cube' ? '立方体' : '几何体',
      color: '#6b7280',
      geometry,
      transform: {
        position: [0, 0.5, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
      },
      visible: true,
      locked: false,
    }
    commit(prev => ({ ...prev, elements: [...prev.elements, element] }))
    setSelectedIds([id])
    setSelectedType('element')
  }, [commit])

  const addCamera = useCallback(() => {
    const id = generateId()
    // 默认机位：从斜上方看向原点
    const camera: DirectorStageCamera = {
      id,
      name: `机位 ${sceneData.cameras.length + 1}`,
      position: [3, 2, 5],
      target: [0, 1, 0],
      fov: 50,
      aspect: '16:9',
    }
    commit(prev => ({ ...prev, cameras: [...prev.cameras, camera] }))
    setSelectedIds([id])
    setSelectedType('camera')
    setActiveCameraId(id)
    setViewMode('camera')
  }, [sceneData.cameras.length, commit])

  const updateElement = useCallback((id: string, patch: Partial<DirectorStageElement>) => {
    commit(prev => ({
      ...prev,
      elements: prev.elements.map(el => el.id === id ? { ...el, ...patch } : el),
    }), `elem:${id}`)
  }, [commit])

  const updateCamera = useCallback((id: string, patch: Partial<DirectorStageCamera>) => {
    commit(prev => ({
      ...prev,
      cameras: prev.cameras.map(cam => cam.id === id ? { ...cam, ...patch } : cam),
    }), `cam:${id}`)
  }, [commit])

  // 把后端/手动 JSON 的 SceneDescription 注入为场景元素与机位
  const injectSceneDescription = useCallback((sd: SceneDescription) => {
    const newElements: DirectorStageElement[] = (sd.meshes || []).map((mesh, i) => ({
      id: generateId(),
      type: 'ai_object' as const,
      name: (MESH_TYPE_NAME[mesh.type] || mesh.type) + (i > 0 ? ` ${i + 1}` : ''),
      color: mesh.color,
      transform: {
        position: mesh.position,
        rotation: mesh.rotation || [0, 0, 0],
        scale: mesh.scale,
      },
      visible: true,
      locked: false,
      mesh,
      prompt: '',
    }))

    const firstId = newElements[0]?.id

    commit(prev => {
      const nextCameras = [...prev.cameras]
      if (sd.suggestedCamera) {
        nextCameras.push({
          id: generateId(),
          name: `机位 ${nextCameras.length + 1}`,
          position: sd.suggestedCamera.position,
          target: sd.suggestedCamera.target,
          fov: 50,
          aspect: '16:9',
        })
      }
      const nextBackground = sd.background
        ? { ...prev.background, color: sd.background }
        : prev.background
      return {
        ...prev,
        elements: [...prev.elements, ...newElements],
        cameras: nextCameras,
        background: nextBackground,
      }
    })

    if (firstId) {
      setSelectedIds([firstId])
      setSelectedType('element')
    }
  }, [commit])

  const generateAiScene = useCallback(async (prompt: string) => {
    if (aiSceneLoading) return
    setAiSceneLoading(true)
    try {
      // 前端方阵检测：命中则直接生成元素，不走后端 AI
      const armyMatch = matchArmyPrompt(prompt)
      if (armyMatch) {
        const res = buildArmyElements(armyMatch)
        commit(prev => ({
          ...prev,
          elements: [...prev.elements, ...res.elements],
          background: { ...prev.background, color: '#87CEEB' },
        }))
        if (res.note) useStore.getState().setGlobalError(res.note)
        if (res.elements[0]) {
          setSelectedIds([res.elements[0].id])
          setSelectedType('element')
        }
        return
      }
      const sceneDescription = await directorStagesApi.generate3DScene(stageId, prompt)
      injectSceneDescription(sceneDescription)
    } catch (e: any) {
      const detail = e?.response?.data?.detail || e?.message || '生成失败'
      const msg = String(detail).toLowerCase()
      // 配额/超时 → 友好降级，并展开手动 JSON 入口
      if (/quota|balance|余额|timeout|超时|limit|额度|insufficient/.test(msg)) {
        useStore.getState().setGlobalError('AI 生成暂不可用（配额/超时），可展开下方「手动输入场景 JSON」继续。')
        setManualJsonOpen(true)
      } else {
        useStore.getState().setGlobalError(`AI 物体生成失败: ${detail}`)
      }
    } finally {
      setAiSceneLoading(false)
    }
  }, [stageId, aiSceneLoading, commit, injectSceneDescription])

  // 手动 JSON 入口：解析用户粘贴的 SceneDescription 形态并注入
  const handleManualJson = useCallback((json: string) => {
    try {
      const data = JSON.parse(json)
      if (data.meshes) {
        injectSceneDescription(data as SceneDescription)
        setManualJsonOpen(false)
        setManualJson('')
      } else if (Array.isArray(data.elements)) {
        const els = (data.elements as any[]).map(el => ({
          id: generateId(),
          type: 'ai_object' as const,
          name: el.name || '物体',
          color: el.color || '#888888',
          transform: el.transform || { position: [0, 0.5, 0], rotation: [0, 0, 0], scale: [1, 1, 1] },
          visible: true,
          locked: false,
          mesh: el.mesh,
        }))
        commit(prev => ({ ...prev, elements: [...prev.elements, ...els] }))
        setManualJsonOpen(false)
        setManualJson('')
      } else {
        useStore.getState().setGlobalError('JSON 需包含 meshes 或 elements 字段')
      }
    } catch (e: any) {
      useStore.getState().setGlobalError('JSON 解析失败：' + (e?.message || '格式错误'))
    }
  }, [commit, injectSceneDescription])

  const updateScene = useCallback((patch: Partial<DirectorStageSceneData>) => {
    commit(prev => ({ ...prev, ...patch }))
  }, [commit])

  const removeElement = useCallback((id: string) => {
    commit(prev => ({ ...prev, elements: prev.elements.filter(el => el.id !== id) }))
    setSelectedIds(prev => prev.filter(x => x !== id))
  }, [commit])

  const removeCamera = useCallback((id: string) => {
    commit(prev => ({ ...prev, cameras: prev.cameras.filter(cam => cam.id !== id) }))
    setSelectedIds(prev => prev.filter(x => x !== id))
    if (activeCameraId === id) {
      setActiveCameraId(null)
      setViewMode('director')
    }
  }, [commit, activeCameraId])

  const selectItem = useCallback((id: string | null, type: 'element' | 'camera' | null, mode: SelectMode = 'single') => {
    if (id === null) {
      setSelectedIds([])
      setSelectedType(null)
      setSelectedGroupId(null)
      if (type === 'camera') {
        setActiveCameraId(null)
        setViewMode('director')
      }
      return
    }
    if (type === 'camera') {
      setSelectedIds([id])
      setSelectedType('camera')
      setSelectedGroupId(null)
      setActiveCameraId(id)
      setViewMode('camera')
      return
    }
    if (type !== 'element') return
    setSelectedType('element')
    setSelectedGroupId(null)
    if (mode === 'single') {
      setSelectedIds([id])
      anchorIdRef.current = id
    } else if (mode === 'add') {
      setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
    } else if (mode === 'range') {
      const list = sceneData.elements.map(e => e.id)
      const a = anchorIdRef.current ? list.indexOf(anchorIdRef.current) : -1
      const b = list.indexOf(id)
      if (a >= 0 && b >= 0) {
        const [lo, hi] = a < b ? [a, b] : [b, a]
        setSelectedIds(list.slice(lo, hi + 1))
      } else {
        setSelectedIds([id])
        anchorIdRef.current = id
      }
    }
  }, [sceneData.elements])

  // 编组 / 解组
  const createGroup = useCallback((ids: string[]) => {
    if (ids.length < 2) return
    const gid = generateId()
    const group: DirectorStageGroup = {
      id: gid,
      name: `编组 ${(sceneData.groups?.length || 0) + 1}`,
      memberIds: ids,
    }
    commit(prev => ({ ...prev, groups: [...(prev.groups || []), group] }))
    setSelectedGroupId(gid)
    setSelectedType('element')
  }, [commit, sceneData.groups])

  const ungroup = useCallback((groupId: string) => {
    commit(prev => ({ ...prev, groups: (prev.groups || []).filter(g => g.id !== groupId) }))
    setSelectedGroupId(null)
  }, [commit])

  const updateGroup = useCallback((groupId: string, patch: { name?: string }) => {
    commit(prev => ({
      ...prev,
      groups: (prev.groups || []).map(g => g.id === groupId ? { ...g, ...patch } : g),
    }), `group:${groupId}`)
  }, [commit])

  const selectGroup = useCallback((groupId: string) => {
    const g = sceneData.groups?.find(x => x.id === groupId)
    if (!g) return
    setSelectedGroupId(groupId)
    setSelectedType('element')
    setSelectedIds(g.memberIds)
  }, [sceneData.groups])

  const activeCamera = useMemo(() =>
    sceneData.cameras.find(cam => cam.id === activeCameraId) || null,
  [sceneData.cameras, activeCameraId])

  const selectedCamera = useMemo(() =>
    selectedType === 'camera' ? sceneData.cameras.find(cam => cam.id === selectedIds[0]) || null : null,
  [sceneData.cameras, selectedIds, selectedType])

  const groups = sceneData.groups || []

  const handleTakeScreenshot = useCallback(async () => {
    // 导演自由视角也可截图：无 activeCamera 时用当前视口相机参数（takeScreenshot 内部处理）
    if (!viewportRef.current || !viewportReady) return
    setScreenshotUploading(true)
    try {
      const aspect = activeCamera?.aspect || '16:9'
      const camId = activeCamera?.id ?? 'director'
      const blob = await viewportRef.current.takeScreenshot(aspect)
      const shot = await directorStagesApi.uploadScreenshot(stageId, camId, blob)
      const current = (stageNode?.data?.screenshots as DirectorStageScreenshot[] | undefined) || []
      updateDirectorStageNode(stageId, { screenshots: [...current, shot], status: 'done' })
    } catch (e) {
      console.error('截图上传失败:', e)
      useStore.getState().setGlobalError('截图上传失败')
    } finally {
      setScreenshotUploading(false)
    }
  }, [activeCamera, viewportReady, stageId, stageNode, updateDirectorStageNode])

  const handleSendToCanvas = useCallback((shot: DirectorStageScreenshot) => {
    addReferenceImageNode(stageId, shot)
  }, [addReferenceImageNode, stageId])

  const screenshots = useMemo(() =>
    (stageNode?.data?.screenshots as DirectorStageScreenshot[] | undefined) || [],
  [stageNode])

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-gray-400 text-sm">加载导演台...</div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0a0a0a] flex flex-col">
      {/* 顶部工具栏 */}
      <div className="h-12 bg-[#141414] border-b border-gray-800 flex items-center justify-between px-4 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="text-gray-400 hover:text-white text-sm"
          >
            ← 返回画布
          </button>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={e => handleNameChange(e.target.value)}
            className="bg-transparent text-white text-sm font-medium border-b border-transparent hover:border-gray-600 focus:border-gray-400 focus:outline-none px-1"
          />
          {saving && <span className="text-xs text-gray-500">保存中...</span>}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setViewMode('director')}
            className={`px-3 py-1 text-xs rounded border transition-colors ${
              viewMode === 'director'
                ? 'bg-white text-black border-white'
                : 'bg-[#1a1a1a] text-gray-300 border-gray-700 hover:border-gray-500'
            }`}
          >
            导演视角
          </button>
          <select
            value={activeCameraId || ''}
            onChange={e => {
              const id = e.target.value
              if (id) {
                selectItem(id, 'camera')
              } else {
                setActiveCameraId(null)
                setViewMode('director')
              }
            }}
            className="bg-[#1a1a1a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none"
          >
            <option value="">选择机位...</option>
            {sceneData.cameras.map(cam => (
              <option key={cam.id} value={cam.id}>{cam.name}</option>
            ))}
          </select>
          <button
            type="button"
            onClick={addCamera}
            className="px-3 py-1 text-xs bg-[#1a1a1a] text-gray-300 border border-gray-700 hover:border-gray-500 rounded transition-colors"
          >
            + 机位
          </button>
          <button
            type="button"
            onClick={handleTakeScreenshot}
            disabled={screenshotUploading || !viewportReady}
            className="px-3 py-1 text-xs bg-white text-black rounded hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {screenshotUploading ? '截图中...' : '截图'}
          </button>
        </div>
      </div>

      {/* 主体 */}
      <div className="flex-1 flex overflow-hidden">
        <SceneTree
          elements={sceneData.elements}
          cameras={sceneData.cameras}
          groups={groups}
          selectedIds={selectedIds}
          selectedType={selectedType}
          selectedGroupId={selectedGroupId}
          onSelect={selectItem}
          onSelectGroup={selectGroup}
          onAddElement={addElement}
          onAddCamera={addCamera}
          onGenerateAiScene={generateAiScene}
          onUpdateElement={updateElement}
          onUpdateCamera={updateCamera}
          onRemoveElement={removeElement}
          onRemoveCamera={removeCamera}
          onGroupCreate={createGroup}
          onGroupUngroup={ungroup}
        />
        {aiSceneLoading && (
          <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-3 py-1.5 rounded border border-gray-600 z-10">
            AI 物体生成中...
          </div>
        )}
        {manualJsonOpen && (
          <div className="absolute top-14 left-1/2 -translate-x-1/2 w-[28rem] max-w-[90vw] bg-[#141414] border border-gray-700 rounded-lg p-3 space-y-2 z-20 shadow-xl">
            <div className="text-xs text-gray-300">手动输入场景 JSON</div>
            <div className="text-[11px] text-gray-500">形态：<code>{'{ "meshes":[...], "suggestedCamera":{...}, "background":"#..." }'}</code> 或 <code>{'{ "elements":[...] }'}</code></div>
            <textarea
              value={manualJson}
              onChange={e => setManualJson(e.target.value)}
              rows={6}
              placeholder='{ "meshes": [ { "type": "table", "position": [0,0,0], "scale": [2,1,1], "color": "#8a5a2a" } ] }'
              className="w-full bg-[#0a0a0a] text-gray-200 text-xs border border-gray-700 rounded px-2 py-1 focus:outline-none focus:border-gray-500 resize-none font-mono"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => handleManualJson(manualJson)}
                className="flex-1 px-2 py-1 text-xs bg-white text-black rounded hover:bg-gray-200"
              >
                注入场景
              </button>
              <button
                type="button"
                onClick={() => setManualJsonOpen(false)}
                className="px-2 py-1 text-xs bg-[#1a1a1a] text-gray-300 border border-gray-700 rounded hover:border-gray-500"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        <div className="flex-1 flex flex-col min-w-0">
          <div className="flex-1 relative">
            <Viewport3D
              ref={viewportRef}
              sceneData={sceneData}
              selectedIds={selectedIds}
              selectedType={selectedType}
              transformMode={transformMode}
              viewMode={viewMode}
              activeCameraId={activeCameraId}
              onSelect={selectItem}
              onUpdateElement={updateElement}
              onUpdateCamera={updateCamera}
              onReady={setViewportReady}
            />
          </div>
          <Toolbar
            mode={transformMode}
            onChange={setTransformMode}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndoRedo.undo}
            canRedo={canUndoRedo.redo}
          />
        </div>

        <PropertiesPanel
          sceneData={sceneData}
          selectedIds={selectedIds}
          selectedType={selectedType}
          selectedGroupId={selectedGroupId}
          groups={groups}
          onUpdateScene={updateScene}
          onUpdateElement={updateElement}
          onUpdateCamera={updateCamera}
          onUpdateGroup={updateGroup}
          onUngroup={ungroup}
          onCreateGroup={createGroup}
          onSelectGroup={selectGroup}
          screenshots={screenshots}
          onSendToCanvas={handleSendToCanvas}
        />
      </div>
    </div>
  )
}
