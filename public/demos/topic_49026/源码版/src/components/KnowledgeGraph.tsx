import { useEffect, useRef, useState, useCallback, useMemo } from 'react'
import type { Person } from '../types'

// ─── 类型定义 ───────────────────────────────────────────────

interface GraphNode {
  id: string
  name: string
  sentiment: number
  connectionCount: number
  x: number
  y: number
  vx: number
  vy: number
}

interface GraphEdge {
  source: string
  target: string
  strength: number
  description: string
  relationType: string
}

interface KnowledgeGraphProps {
  persons: Person[]
  onSelectPerson?: (personId: string) => void
}

interface MiniGraphProps {
  persons: Person[]
  onSelectPerson?: (personId: string) => void
}

// ─── 颜色工具 ──────────────────────────────────────────────

const ZEN_COLORS = {
  sage: '#7A9E7E',
  amber: '#C4A35A',
  rose: '#B87B7B',
  terracotta: '#C4705A',
  indigo: '#6B7B8C',
  stone: '#9C8E7E',
} as const

function sentimentColor(sentiment: number): string {
  if (sentiment >= 70) return ZEN_COLORS.sage
  if (sentiment >= 40) return ZEN_COLORS.amber
  return ZEN_COLORS.rose
}

function strengthToStroke(strength: number): number {
  if (strength >= 70) return 3
  if (strength >= 40) return 2
  return 1
}

function strengthToDash(strength: number): string {
  if (strength >= 70) return ''           // 实线
  if (strength >= 40) return '6,4'         // 虚线
  return '2,4'                              // 点线
}

// ─── 力导向布局引擎 ──────────────────────────────────────────

function runForceSimulation(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  maxIterations: number = 80,
): void {
  const centerX = width / 2
  const centerY = height / 2
  const n = nodes.length

  if (n === 0) return

  // 初始化速度
  for (const node of nodes) {
    node.vx = 0
    node.vy = 0
  }

  // 构建邻接表加速查找
  const adjacency = new Map<string, Set<string>>()
  for (const node of nodes) {
    adjacency.set(node.id, new Set())
  }
  for (const edge of edges) {
    adjacency.get(edge.source)?.add(edge.target)
    adjacency.get(edge.target)?.add(edge.source)
  }

  // 计算每个节点的连接数
  const connCount = new Map<string, number>()
  for (const node of nodes) {
    connCount.set(node.id, adjacency.get(node.id)?.size ?? 0)
  }

  // 力模拟参数
  const repulsion = 3000
  const attraction = 0.005
  const centerForce = 0.01
  const damping = 0.85
  const minDist = 40

  for (let iter = 0; iter < maxIterations; iter++) {
    const alpha = 1 - iter / maxIterations // 逐渐冷却

    // 斥力（所有节点对之间）
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 1) { dist = 1; dx = 1; dy = 0 }
        const force = (repulsion * alpha) / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        a.vx -= fx
        a.vy -= fy
        b.vx += fx
        b.vy += fy
      }
    }

    // 引力（连接的节点之间）
    for (const edge of edges) {
      const a = nodes.find((nd) => nd.id === edge.source)
      const b = nodes.find((nd) => nd.id === edge.target)
      if (!a || !b) continue
      const dx = b.x - a.x
      const dy = b.y - a.y
      const dist = Math.sqrt(dx * dx + dy * dy)
      if (dist < 1) continue
      const force = dist * attraction * alpha
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      a.vx += fx
      a.vy += fy
      b.vx -= fx
      b.vy -= fy
    }

    // 中心引力
    for (const node of nodes) {
      node.vx += (centerX - node.x) * centerForce * alpha
      node.vy += (centerY - node.y) * centerForce * alpha
    }

    // 更新位置
    for (const node of nodes) {
      node.vx *= damping
      node.vy *= damping
      node.x += node.vx
      node.y += node.vy

      // 边界约束
      const r = nodeRadius(node.connectionCount)
      node.x = Math.max(r, Math.min(width - r, node.x))
      node.y = Math.max(r, Math.min(height - r, node.y))
    }

    // 最小距离约束
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = nodes[i]
        const b = nodes[j]
        let dx = b.x - a.x
        let dy = b.y - a.y
        let dist = Math.sqrt(dx * dx + dy * dy)
        const minD = minDist + nodeRadius(a.connectionCount) + nodeRadius(b.connectionCount)
        if (dist < minD && dist > 0) {
          const overlap = (minD - dist) / 2
          const nx = dx / dist
          const ny = dy / dist
          a.x -= nx * overlap
          a.y -= ny * overlap
          b.x += nx * overlap
          b.y += ny * overlap
        }
      }
    }
  }
}

// ─── 节点半径计算 ────────────────────────────────────────────

function nodeRadius(connectionCount: number): number {
  if (connectionCount <= 0) return 16
  if (connectionCount <= 2) return 20
  if (connectionCount <= 5) return 26
  return 32
}

// ─── 构建图谱数据 ────────────────────────────────────────────

function buildGraphData(persons: Person[]): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const nodeMap = new Map<string, GraphNode>()
  const edgeSet = new Set<string>()
  const edges: GraphEdge[] = []

  // 创建节点
  for (const p of persons) {
    nodeMap.set(p.id, {
      id: p.id,
      name: p.name,
      sentiment: p.sentiment,
      connectionCount: p.connections.length,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
    })
  }

  // 创建边（去重）
  for (const p of persons) {
    for (const conn of p.connections) {
      // 只处理双方都在 persons 列表中的连接
      if (!nodeMap.has(conn.targetPersonId)) continue
      const edgeKey = [p.id, conn.targetPersonId].sort().join('--')
      if (edgeSet.has(edgeKey)) continue
      edgeSet.add(edgeKey)
      edges.push({
        source: p.id,
        target: conn.targetPersonId,
        strength: conn.strength,
        description: conn.description,
        relationType: conn.relationType,
      })
    }
  }

  return { nodes: Array.from(nodeMap.values()), edges }
}

// ─── 关系类型中文标签 ────────────────────────────────────────

function relationTypeLabel(type: string): string {
  const map: Record<string, string> = {
    family: '家人',
    colleague: '同事',
    friend: '朋友',
    partner: '伴侣',
    rival: '对手',
    introduced_by: '介绍人',
    other: '其他',
  }
  return map[type] || type
}

// ─── KnowledgeGraph 组件 ─────────────────────────────────────

export function KnowledgeGraph({ persons, onSelectPerson }: KnowledgeGraphProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dimensions, setDimensions] = useState({ width: 600, height: 300 })
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [hoveredEdgeIdx, setHoveredEdgeIdx] = useState<number | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null)
  const [graphNodes, setGraphNodes] = useState<GraphNode[]>([])
  const [graphEdges, setGraphEdges] = useState<GraphEdge[]>([])
  const dragOffset = useRef({ x: 0, y: 0 })
  const isSimulated = useRef(false)

  // 构建图谱数据
  const { nodes: initialNodes, edges: initialEdges } = useMemo(
    () => buildGraphData(persons),
    [persons],
  )

  // 响应容器尺寸
  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width } = entry.contentRect
        if (width > 0) {
          setDimensions({ width: Math.floor(width), height: 300 })
        }
      }
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  // 力导向模拟
  useEffect(() => {
    if (initialNodes.length === 0) {
      setGraphNodes([])
      setGraphEdges([])
      return
    }

    const nodes = initialNodes.map((n) => ({ ...n }))
    const edges = [...initialEdges]

    // 初始化节点位置：圆形布局
    const cx = dimensions.width / 2
    const cy = dimensions.height / 2
    const angleStep = (2 * Math.PI) / nodes.length
    const radius = Math.min(dimensions.width, dimensions.height) * 0.3

    nodes.forEach((node, i) => {
      const angle = angleStep * i - Math.PI / 2
      node.x = cx + radius * Math.cos(angle)
      node.y = cy + radius * Math.sin(angle)
    })

    // 运行力模拟
    runForceSimulation(nodes, edges, dimensions.width, dimensions.height, 80)

    setGraphNodes(nodes)
    setGraphEdges(edges)
    isSimulated.current = true
  }, [initialNodes, initialEdges, dimensions])

  // 获取节点关联的边索引
  const nodeEdgeIndices = useMemo(() => {
    const map = new Map<string, number[]>()
    for (let i = 0; i < graphEdges.length; i++) {
      const e = graphEdges[i]
      if (!map.has(e.source)) map.set(e.source, [])
      if (!map.has(e.target)) map.set(e.target, [])
      map.get(e.source)!.push(i)
      map.get(e.target)!.push(i)
    }
    return map
  }, [graphEdges])

  // 高亮节点集合
  const highlightedNodeIds = useMemo(() => {
    const set = new Set<string>()
    if (hoveredNodeId) {
      set.add(hoveredNodeId)
      const edgeIdxs = nodeEdgeIndices.get(hoveredNodeId) || []
      for (const idx of edgeIdxs) {
        const e = graphEdges[idx]
        set.add(e.source)
        set.add(e.target)
      }
    }
    return set
  }, [hoveredNodeId, graphEdges, nodeEdgeIndices])

  // 高亮边索引集合
  const highlightedEdgeIndices = useMemo(() => {
    const set = new Set<number>()
    if (hoveredNodeId) {
      const edgeIdxs = nodeEdgeIndices.get(hoveredNodeId) || []
      for (const idx of edgeIdxs) set.add(idx)
    }
    if (hoveredEdgeIdx !== null) {
      set.add(hoveredEdgeIdx)
    }
    return set
  }, [hoveredNodeId, hoveredEdgeIdx, nodeEdgeIndices])

  // 拖拽处理
  const handleMouseDown = useCallback(
    (nodeId: string, e: React.MouseEvent) => {
      e.preventDefault()
      e.stopPropagation()
      const node = graphNodes.find((n) => n.id === nodeId)
      if (!node) return
      setDraggingNodeId(nodeId)
      dragOffset.current = { x: e.clientX - node.x, y: e.clientY - node.y }
    },
    [graphNodes],
  )

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggingNodeId) return
      const svgEl = containerRef.current?.querySelector('svg')
      if (!svgEl) return
      const rect = svgEl.getBoundingClientRect()
      const x = e.clientX - rect.left
      const y = e.clientY - rect.top
      setGraphNodes((prev) =>
        prev.map((n) => (n.id === draggingNodeId ? { ...n, x, y, vx: 0, vy: 0 } : n)),
      )
    },
    [draggingNodeId],
  )

  const handleMouseUp = useCallback(() => {
    setDraggingNodeId(null)
  }, [])

  // 节点点击
  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId)
      onSelectPerson?.(nodeId)
    },
    [selectedNodeId, onSelectPerson],
  )

  // 获取人物首字
  const getInitial = (name: string) => name.charAt(0)

  // 空状态
  if (persons.length === 0) {
    return (
      <div
        ref={containerRef}
        className="w-full rounded-lg border border-ink-muted/30 bg-surface"
        style={{ height: 300 }}
      >
        <div className="flex h-full items-center justify-center text-ink-tertiary text-sm">
          暂无人物数据
        </div>
      </div>
    )
  }

  return (
    <div
      ref={containerRef}
      className="w-full rounded-lg border border-ink-muted/30 bg-surface overflow-hidden"
      style={{ height: 300 }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      <svg
        width={dimensions.width}
        height={dimensions.height}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        className="select-none"
      >
        <defs>
          {/* 箭头标记 */}
          <marker
            id="arrowhead"
            markerWidth="6"
            markerHeight="4"
            refX="6"
            refY="2"
            orient="auto"
          >
            <polygon points="0 0, 6 2, 0 4" fill={ZEN_COLORS.stone} />
          </marker>
        </defs>

        {/* 边 */}
        {graphEdges.map((edge, idx) => {
          const sourceNode = graphNodes.find((n) => n.id === edge.source)
          const targetNode = graphNodes.find((n) => n.id === edge.target)
          if (!sourceNode || !targetNode) return null

          const isHighlighted = highlightedEdgeIndices.has(idx)
          const isDimmed = hoveredNodeId !== null && !isHighlighted
          const isEdgeHovered = hoveredEdgeIdx === idx

          return (
            <g key={`edge-${edge.source}-${edge.target}-${idx}`}>
              {/* 不可见的宽线用于 hover 检测 */}
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke="transparent"
                strokeWidth={12}
                style={{ cursor: 'pointer' }}
                onMouseEnter={() => setHoveredEdgeIdx(idx)}
                onMouseLeave={() => setHoveredEdgeIdx(null)}
              />
              {/* 可见的边 */}
              <line
                x1={sourceNode.x}
                y1={sourceNode.y}
                x2={targetNode.x}
                y2={targetNode.y}
                stroke={
                  isEdgeHovered
                    ? ZEN_COLORS.terracotta
                    : isHighlighted
                      ? ZEN_COLORS.indigo
                      : ZEN_COLORS.stone
                }
                strokeWidth={isEdgeHovered ? strengthToStroke(edge.strength) + 1 : strengthToStroke(edge.strength)}
                strokeDasharray={strengthToDash(edge.strength)}
                opacity={isDimmed ? 0.15 : isHighlighted || isEdgeHovered ? 1 : 0.5}
              />
            </g>
          )
        })}

        {/* 节点 */}
        {graphNodes.map((node) => {
          const r = nodeRadius(node.connectionCount)
          const color = sentimentColor(node.sentiment)
          const isHovered = hoveredNodeId === node.id
          const isSelected = selectedNodeId === node.id
          const isRelated = highlightedNodeIds.has(node.id)
          const isDimmed = hoveredNodeId !== null && !isRelated

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y})`}
              style={{ cursor: draggingNodeId === node.id ? 'grabbing' : 'pointer' }}
              onMouseDown={(e) => handleMouseDown(node.id, e)}
              onMouseEnter={() => setHoveredNodeId(node.id)}
              onMouseLeave={() => setHoveredNodeId(null)}
              onClick={() => handleNodeClick(node.id)}
            >
              {/* 选中光环 */}
              {isSelected && (
                <circle
                  r={r + 4}
                  fill="none"
                  stroke={ZEN_COLORS.terracotta}
                  strokeWidth={2}
                  opacity={0.8}
                />
              )}
              {/* 节点阴影 */}
              <circle
                r={r}
                fill={color}
                opacity={isDimmed ? 0.2 : 0.15}
                transform="translate(1, 2)"
              />
              {/* 节点主体 */}
              <circle
                r={r}
                fill={color}
                opacity={isDimmed ? 0.25 : isHovered ? 1 : 0.85}
                stroke={isHovered || isSelected ? ZEN_COLORS.terracotta : 'white'}
                strokeWidth={isHovered || isSelected ? 2 : 1}
              />
              {/* 首字 */}
              <text
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={r > 24 ? 14 : 12}
                fontWeight={600}
                fontFamily="var(--font-sans)"
                opacity={isDimmed ? 0.3 : 1}
                pointerEvents="none"
              >
                {getInitial(node.name)}
              </text>
            </g>
          )
        })}

        {/* Tooltip: 节点 */}
        {hoveredNodeId && (() => {
          const node = graphNodes.find((n) => n.id === hoveredNodeId)
          if (!node) return null
          const person = persons.find((p) => p.id === node.id)
          const connections = person?.connections || []
          const tooltipLines = [
            node.name,
            `关系温度: ${node.sentiment}`,
            ...connections.slice(0, 3).map((c) => `${relationTypeLabel(c.relationType)} → ${c.targetPersonName}`),
          ]
          const tx = node.x
          const ty = node.y - nodeRadius(node.connectionCount) - 12

          return (
            <g>
              <rect
                x={tx - 60}
                y={ty - 40}
                width={120}
                height={40 + (tooltipLines.length - 1) * 16}
                rx={6}
                fill="var(--color-ink-primary)"
                opacity={0.9}
              />
              {tooltipLines.map((line, i) => (
                <text
                  key={i}
                  x={tx}
                  y={ty - 26 + i * 16}
                  textAnchor="middle"
                  fill="white"
                  fontSize={11}
                  fontFamily="var(--font-sans)"
                  pointerEvents="none"
                >
                  {line}
                </text>
              ))}
            </g>
          )
        })()}

        {/* Tooltip: 边 */}
        {hoveredEdgeIdx !== null && (() => {
          const edge = graphEdges[hoveredEdgeIdx]
          if (!edge) return null
          const sourceNode = graphNodes.find((n) => n.id === edge.source)
          const targetNode = graphNodes.find((n) => n.id === edge.target)
          if (!sourceNode || !targetNode) return null
          const mx = (sourceNode.x + targetNode.x) / 2
          const my = (sourceNode.y + targetNode.y) / 2
          const desc = edge.description || `${relationTypeLabel(edge.relationType)} (强度: ${edge.strength})`

          return (
            <g>
              <rect
                x={mx - 80}
                y={my - 18}
                width={160}
                height={28}
                rx={4}
                fill="var(--color-ink-primary)"
                opacity={0.85}
              />
              <text
                x={mx}
                y={my}
                textAnchor="middle"
                dominantBaseline="central"
                fill="white"
                fontSize={10}
                fontFamily="var(--font-sans)"
                pointerEvents="none"
              >
                {desc.length > 18 ? desc.slice(0, 18) + '...' : desc}
              </text>
            </g>
          )
        })()}
      </svg>
    </div>
  )
}

// ─── MiniGraph 组件 ─────────────────────────────────────────

export function MiniGraph({ persons, onSelectPerson }: MiniGraphProps) {
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null)
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null)

  const width = 200
  const height = 150

  const { nodes, edges } = useMemo(() => buildGraphData(persons), [persons])

  // 圆形布局（迷你版不做力模拟）
  const layoutNodes = useMemo(() => {
    if (nodes.length === 0) return []
    const cx = width / 2
    const cy = height / 2
    const angleStep = (2 * Math.PI) / nodes.length
    const radius = Math.min(width, height) * 0.3

    return nodes.map((node, i) => {
      const angle = angleStep * i - Math.PI / 2
      return {
        ...node,
        x: cx + radius * Math.cos(angle),
        y: cy + radius * Math.sin(angle),
      }
    })
  }, [nodes])

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      setSelectedNodeId(nodeId === selectedNodeId ? null : nodeId)
      onSelectPerson?.(nodeId)
    },
    [selectedNodeId, onSelectPerson],
  )

  if (persons.length === 0) {
    return (
      <div
        className="w-full rounded-md bg-canvas-warm"
        style={{ width: 200, height: 150 }}
      >
        <div className="flex h-full items-center justify-center text-ink-muted text-xs">
          暂无数据
        </div>
      </div>
    )
  }

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="select-none rounded-md bg-canvas-warm"
    >
      {/* 边 */}
      {edges.map((edge, idx) => {
        const source = layoutNodes.find((n) => n.id === edge.source)
        const target = layoutNodes.find((n) => n.id === edge.target)
        if (!source || !target) return null
        const isRelated =
          hoveredNodeId !== null &&
          (edge.source === hoveredNodeId || edge.target === hoveredNodeId)

        return (
          <line
            key={`mini-edge-${idx}`}
            x1={source.x}
            y1={source.y}
            x2={target.x}
            y2={target.y}
            stroke={ZEN_COLORS.stone}
            strokeWidth={isRelated ? 1.5 : 0.8}
            opacity={hoveredNodeId !== null ? (isRelated ? 0.8 : 0.1) : 0.4}
          />
        )
      })}

      {/* 节点 */}
      {layoutNodes.map((node) => {
        const r = node.connectionCount > 3 ? 10 : node.connectionCount > 0 ? 8 : 6
        const color = sentimentColor(node.sentiment)
        const isHovered = hoveredNodeId === node.id
        const isSelected = selectedNodeId === node.id

        return (
          <g
            key={`mini-node-${node.id}`}
            transform={`translate(${node.x}, ${node.y})`}
            style={{ cursor: 'pointer' }}
            onMouseEnter={() => setHoveredNodeId(node.id)}
            onMouseLeave={() => setHoveredNodeId(null)}
            onClick={() => handleNodeClick(node.id)}
          >
            {isSelected && (
              <circle r={r + 2} fill="none" stroke={ZEN_COLORS.terracotta} strokeWidth={1.5} />
            )}
            <circle
              r={r}
              fill={color}
              opacity={isHovered ? 1 : 0.8}
              stroke="white"
              strokeWidth={0.5}
            />
            <text
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={8}
              fontWeight={600}
              fontFamily="var(--font-sans)"
              pointerEvents="none"
            >
              {node.name.charAt(0)}
            </text>
          </g>
        )
      })}

      {/* Tooltip */}
      {hoveredNodeId && (() => {
        const node = layoutNodes.find((n) => n.id === hoveredNodeId)
        if (!node) return null
        return (
          <g>
            <rect
              x={node.x - 30}
              y={node.y - 22}
              width={60}
              height={16}
              rx={3}
              fill="var(--color-ink-primary)"
              opacity={0.85}
            />
            <text
              x={node.x}
              y={node.y - 13}
              textAnchor="middle"
              fill="white"
              fontSize={9}
              fontFamily="var(--font-sans)"
              pointerEvents="none"
            >
              {node.name}
            </text>
          </g>
        )
      })()}
    </svg>
  )
}
