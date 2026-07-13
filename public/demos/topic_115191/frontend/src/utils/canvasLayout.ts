/** 画布自动布局与连线工具。
 *
 * 布局策略：
 * - 剧本节点在最左侧
 * - 角色/场景/道具分别占一列纵向堆叠，同列节点上下串联
 * - 分集节点在其右侧，每集占一行
 * - 故事板横向排列在对应分集右侧
 * - 根据名称关联自动添加 script->asset->episode->storyboard 的连线
 */
import type { Edge, Node } from '@xyflow/react'
import type { Asset, AssetType, Episode, ProjectDetail, Storyboard } from '../types'

const GAP_X = 120
const GAP_Y = 80

const COL_X = {
  script: 0,
  character: 420,
  scene: 840,
  prop: 1260,
  director_stage: 1560,
  episode: 1880,
  storyboard: 2360,
}

const NODE_H: Record<string, number> = {
  script: 320,
  character: 260,
  scene: 260,
  prop: 260,
  director_stage: 260,
  episode: 200,
  storyboard: 260,
  video: 260,
}

const STORYBOARD_W = 280

function assetTypeKey(type: AssetType) {
  return type === 'character' ? 'character' : type === 'scene' ? 'scene' : 'prop'
}

function assetNodeId(type: AssetType, id: string) {
  const prefix = type === 'character' ? 'char' : type
  return `${prefix}-${id}`
}

export function computeProjectLayout(
  proj: ProjectDetail,
  appearStart = 0,
): { nodes: Node[]; edges: Edge[]; appearNext: number } {
  const nodes: Node[] = []
  const edges: Edge[] = []
  let appearIdx = appearStart

  const nextAppear = () => appearIdx++

  // 记录每列当前 Y
  const colY: Record<string, number> = {
    script: 0,
    character: 0,
    scene: 0,
    prop: 0,
    director_stage: 0,
    episode: 0,
    storyboard: 0,
    video: 0,
  }

  const placeNode = (type: string, id: string, data: any, xOverride?: number, yOverride?: number): Node => {
    const x = xOverride ?? COL_X[type as keyof typeof COL_X]
    const y = yOverride ?? colY[type]
    const h = NODE_H[type] ?? 220
    if (yOverride === undefined) {
      colY[type] = y + h + GAP_Y
    }
    const node: Node = { id, type, position: { x, y }, data: { ...data, appearIndex: nextAppear() } }
    nodes.push(node)
    return node
  }

  // 1. 剧本节点
  placeNode('script', 'script', { projectId: proj.id, hasScript: !!proj.script_text })

  // 2. 资产节点（按类型分组，避免同列重叠；同列上下串联）
  const assetNameToNodeId: Record<string, string> = {}
  const prevAssetId: Record<AssetType, string | null> = { character: null, scene: null, prop: null }

  const addAsset = (asset: Asset, type: AssetType) => {
    const typeKey = assetTypeKey(type)
    const id = assetNodeId(type, asset.id)
    placeNode(typeKey, id, { ...asset, type })
    assetNameToNodeId[asset.name] = id

    // 同列前一个资产 -> 当前资产（上下串联）
    if (prevAssetId[type]) {
      edges.push(makeEdge(prevAssetId[type]!, id, `e-${prevAssetId[type]}-${id}`, false, 'bottom', 'top'))
    }
    prevAssetId[type] = id
  }
  ;(proj.characters ?? []).forEach(c => addAsset(c, 'character'))
  ;(proj.scenes ?? []).forEach(s => addAsset(s, 'scene'))
  ;(proj.props ?? []).forEach(p => addAsset(p, 'prop'))

  // script -> 各列第一个资产（横向）
  ;(proj.characters ?? []).slice(0, 1).forEach(c =>
    edges.push(makeEdge('script', assetNodeId('character', c.id), `e-script-char-${c.id}`, false, 'right', 'left'))
  )
  ;(proj.scenes ?? []).slice(0, 1).forEach(s =>
    edges.push(makeEdge('script', assetNodeId('scene', s.id), `e-script-scene-${s.id}`, false, 'right', 'left'))
  )
  ;(proj.props ?? []).slice(0, 1).forEach(p =>
    edges.push(makeEdge('script', assetNodeId('prop', p.id), `e-script-prop-${p.id}`, false, 'right', 'left'))
  )

  // 3. 导演台节点（放在道具列下方）
  let prevDsId: string | null = null
  ;(proj.director_stages ?? []).forEach(ds => {
    const dsNodeId = `ds-${ds.id}`
    const dsY = Math.max(colY.director_stage, colY.prop)
    placeNode('director_stage', dsNodeId, ds, COL_X.director_stage, dsY)

    if (prevDsId) {
      edges.push(makeEdge(prevDsId, dsNodeId, `e-${prevDsId}-${dsNodeId}`, false, 'bottom', 'top'))
    }
    prevDsId = dsNodeId
    colY.director_stage = dsY + NODE_H.director_stage + GAP_Y
    colY.prop = Math.max(colY.prop, colY.director_stage)
  })

  // 4. 分集 + 故事板（每集占一行）
  let prevEpId: string | null = null
  ;(proj.episodes ?? []).forEach((ep, ei) => {
    const epNodeId = `ep-${ep.id}`
    const epY = Math.max(colY.episode, colY.storyboard)
    placeNode('episode', epNodeId, ep, COL_X.episode, epY)

    // 分集之间上下串联
    if (prevEpId) {
      edges.push(makeEdge(prevEpId, epNodeId, `e-${prevEpId}-${epNodeId}`, false, 'bottom', 'top'))
    }
    prevEpId = epNodeId

    // 分集引用的资产 -> 分集连线（横向）
    const involvedNames = new Set([
      ...(ep.involved_character_names ?? []),
      ...(ep.involved_scene_names ?? []),
      ...(ep.involved_prop_names ?? []),
    ])
    involvedNames.forEach(name => {
      const srcId = assetNameToNodeId[name]
      if (srcId && !edges.find(e => e.source === srcId && e.target === epNodeId)) {
        edges.push(makeEdge(srcId, epNodeId, `e-${srcId}-${epNodeId}`, false, 'right', 'left'))
      }
    })

    // 故事板横向排列
    let rowH = NODE_H.episode
    ;(ep.storyboards ?? []).forEach((sb, si) => {
      const sbNodeId = `sb-${sb.id}`
      const x = COL_X.storyboard + si * (STORYBOARD_W + GAP_X)
      const y = epY
      placeNode('storyboard', sbNodeId, { ...sb, episode_id: ep.id, episode_index: ep.index }, x, y)

      // episode -> storyboard
      edges.push(makeEdge(epNodeId, sbNodeId, `e-${epNodeId}-${sbNodeId}`, false, 'right', 'left'))

      // prev -> current
      if (sb.prev_storyboard_id) {
        edges.push(makeEdge(`sb-${sb.prev_storyboard_id}`, sbNodeId, `e-prev-${sb.id}`, true, 'right', 'left'))
      }

      rowH = Math.max(rowH, NODE_H.storyboard)

      // 故事板对应的视频节点（放在故事板正下方，垂直 bottom → top 连线）
      const video = (proj.videos ?? []).find(v => v.storyboard_id === sb.id)
      if (video) {
        const vNodeId = `vid-${video.id}`
        const vy = y + NODE_H.storyboard + GAP_Y
        placeNode('video', vNodeId, video, x, vy)
        edges.push(makeEdge(sbNodeId, vNodeId, `e-${sbNodeId}-${vNodeId}`, false, 'bottom', 'top'))
        rowH = Math.max(rowH, NODE_H.storyboard + GAP_Y + NODE_H.video)
      }
    })

    // 推进两列的 Y
    colY.episode = epY + rowH + GAP_Y
    colY.storyboard = colY.episode
  })

  return { nodes, edges, appearNext: appearIdx }
}

function makeEdge(
  source: string,
  target: string,
  id: string,
  animated = false,
  sourceHandle?: string,
  targetHandle?: string,
): Edge {
  return {
    id,
    source,
    target,
    sourceHandle,
    targetHandle,
    type: 'default',
    animated,
    style: { stroke: '#9ca3af', strokeWidth: 1.5 },
  }
}

/** 为新增的故事板计算位置（基于其分集节点位置）。 */
export function computeStoryboardPosition(
  episodeId: string,
  sbIndex: number,
  existingNodes: Node[],
): { x: number; y: number } {
  const epNode = existingNodes.find(n => n.id === `ep-${episodeId}`)
  const baseY = epNode?.position.y ?? 0
  const existingCount = existingNodes.filter(
    n => n.type === 'storyboard' && n.data?.episode_id === episodeId,
  ).length
  const offset = Math.max(existingCount, sbIndex - 1)
  const x = COL_X.storyboard + offset * (STORYBOARD_W + GAP_X)
  return { x, y: baseY }
}

/** 为新增的资产节点计算位置（基于类型列的已有节点）。 */
export function computeAssetPosition(
  assetType: AssetType,
  existingNodes: Node[],
): { x: number; y: number } {
  const typeKey = assetTypeKey(assetType)
  const colNodes = existingNodes.filter(n => n.type === typeKey)
  const maxY = colNodes.length
    ? Math.max(...colNodes.map(n => n.position.y + (NODE_H[typeKey] ?? 220)))
    : 0
  return { x: COL_X[typeKey], y: maxY + GAP_Y }
}
