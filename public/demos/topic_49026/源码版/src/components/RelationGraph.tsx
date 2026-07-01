import { useState, useMemo, useRef, useEffect, useCallback } from 'react'
import { X, ZoomIn, ZoomOut, Users, ChevronRight, Sparkles } from 'lucide-react'
import { useDataStore } from '../stores/useDataStore'
import { getUserProfileObject } from '../lib/prompts'
import { BackHeader } from './BackHeader'
import type { PersonConnection } from '../types'

// === 设计系统：温润水墨 × 玻璃质感 ===
// 灵感来源：Apple Health 的有机感 + Things 3 的克制优雅 + 东方水墨的留白意境

const PALETTE = {
  // 关系色系 — 降低饱和度，提升高级感
  spouse:   { base: '#D4768A', glow: '#D4768A', soft: 'rgba(212,118,138,0.12)' },
  family:   { base: '#D4A056', glow: '#D4A056', soft: 'rgba(212,160,86,0.12)' },
  friend:   { base: '#7AAF8E', glow: '#7AAF8E', soft: 'rgba(122,175,142,0.12)' },
  colleague:{ base: '#7B8BA8', glow: '#7B8BA8', soft: 'rgba(123,139,168,0.12)' },
  leader:   { base: '#9B8AB8', glow: '#9B8AB8', soft: 'rgba(155,138,184,0.12)' },
  mentor:   { base: '#6BA8A0', glow: '#6BA8A0', soft: 'rgba(107,168,160,0.12)' },
  subordinate:{ base: '#6BA0C4', glow: '#6BA0C4', soft: 'rgba(107,160,196,0.12)' },
  client:   { base: '#D48856', glow: '#D48856', soft: 'rgba(212,136,86,0.12)' },
  rival:    { base: '#C47A6A', glow: '#C47A6A', soft: 'rgba(196,122,106,0.12)' },
  other:    { base: '#A8A29E', glow: '#A8A29E', soft: 'rgba(168,162,158,0.12)' },
} as const

const RELATION_LABELS: Record<string, string> = {
  spouse: '伴侣', family: '家人', friend: '挚友', colleague: '同僚',
  leader: '上级', mentor: '导师', subordinate: '下属', client: '客户',
  rival: '竞对', other: '其他',
}

const CONNECTION_LABELS: Record<string, string> = {
  family: '家人', colleague: '同事', friend: '朋友', partner: '伙伴',
  rival: '竞争', introduced_by: '引荐', other: '关联',
}

interface GraphNode {
  id: string
  name: string
  relationship: string
  sentiment: number
  x: number
  y: number
  vx: number
  vy: number
  isUser: boolean
  radius: number
  initials: string
}

interface GraphEdge {
  source: string
  target: string
  label: string
  strength: number
  color: string
  isPrimary: boolean
  relationType: string  // FIX: 保留关系类型用于多线区分
  edgeIndex: number     // FIX: 同节点对的边序号（用于多线分离渲染）
  totalEdges: number    // FIX: 同节点对的边总数（用于计算曲线偏移）
}

interface RelationGraphProps {
  onClose: () => void
  onSelectPerson?: (personId: string) => void
}

// 获取人物首字（用于头像）
function getInitials(name: string): string {
  if (!name) return '?'
  return name.charAt(0)
}

// 温度 → 语义描述
function tempLabel(sentiment: number): string {
  const t = Math.max(0, Math.min(100, sentiment))
  if (t >= 80) return '亲密'
  if (t >= 60) return '温暖'
  if (t >= 40) return '平和'
  if (t >= 20) return '疏远'
  return '冷淡'
}

export function RelationGraph({ onClose, onSelectPerson }: RelationGraphProps) {
  const { persons: allPersons } = useDataStore()
  // 过滤掉 SELF 人物（用户自己），避免在图谱中同时作为中心节点和外围节点出现
  const persons = useMemo(() => {
    const userProfile = getUserProfileObject()
    return allPersons.filter(p => p.id !== 'p-self' && p.name !== userProfile.name)
  }, [allPersons])
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [dimensions, setDimensions] = useState({ width: 800, height: 600 })
  const [animProgress, setAnimProgress] = useState(0)
  const animationRef = useRef<number>(0)

  const userProfile = getUserProfileObject()
  const userName = userProfile.name || '我'

  // 构建节点和边
  const { nodes, edges } = useMemo(() => {
    const centerX = dimensions.width / 2
    const centerY = dimensions.height / 2

    const graphNodes: GraphNode[] = [{
      id: '__user__',
      name: userName,
      relationship: 'user',
      sentiment: 100,
      x: centerX,
      y: centerY,
      vx: 0, vy: 0,
      isUser: true,
      radius: 36,
      initials: getInitials(userName),
    }]

    const personCount = persons.length
    persons.forEach((person, i) => {
      const angle = (i / personCount) * Math.PI * 2 - Math.PI / 2
      const distance = Math.min(dimensions.width, dimensions.height) * 0.32
      const temp = Math.max(0, Math.min(100, person.sentiment))
      graphNodes.push({
        id: person.id,
        name: person.name,
        relationship: person.relationship,
        sentiment: person.sentiment,
        x: centerX + Math.cos(angle) * distance,
        y: centerY + Math.sin(angle) * distance,
        vx: 0, vy: 0,
        isUser: false,
        radius: 18 + (temp / 100) * 14, // 18~32
        initials: getInitials(person.name),
      })
    })

    const graphEdges: GraphEdge[] = []
    persons.forEach((person) => {
      const pal = PALETTE[person.relationship as keyof typeof PALETTE] || PALETTE.other
      graphEdges.push({
        source: '__user__',
        target: person.id,
        label: RELATION_LABELS[person.relationship] || '其他',
        strength: Math.abs(person.sentiment),
        color: pal.base,
        isPrimary: true,
        relationType: person.relationship,
        edgeIndex: 0,
        totalEdges: 1,
      })
    })

    // FIX: 收集所有人物间的连接（不去重），支持多线关系
    const personIds = new Set(persons.map(p => p.id))
    const rawSecondaryEdges: Array<{ source: string; target: string; label: string; strength: number; relationType: string }> = []
    persons.forEach((person) => {
      if (person.connections) {
        person.connections.forEach((conn: PersonConnection) => {
          if (personIds.has(conn.targetPersonId)) {
            if (conn.strength < 30) return
            rawSecondaryEdges.push({
              source: person.id,
              target: conn.targetPersonId,
              label: CONNECTION_LABELS[conn.relationType] || '关联',
              strength: conn.strength,
              relationType: conn.relationType,
            })
          }
        })
      }
    })

    // FIX: 按节点对分组，计算每条边的序号和总数（用于多线曲线分离）
    const edgeGroupMap = new Map<string, typeof rawSecondaryEdges>()
    rawSecondaryEdges.forEach(edge => {
      const pairKey = [edge.source, edge.target].sort().join('--')
      const group = edgeGroupMap.get(pairKey) || []
      group.push(edge)
      edgeGroupMap.set(pairKey, group)
    })

    // 添加到 graphEdges，每条边都保留（不再去重）
    edgeGroupMap.forEach(group => {
      group.forEach((edge, idx) => {
        graphEdges.push({
          source: edge.source,
          target: edge.target,
          label: edge.label,
          strength: edge.strength,
          color: '#C4BFB8',
          isPrimary: false,
          relationType: edge.relationType,
          edgeIndex: idx,
          totalEdges: group.length,
        })
      })
    })

    return { nodes: graphNodes, edges: graphEdges }
  }, [persons, userName, dimensions])

  // 力导向布局
  const nodesRef = useRef<GraphNode[]>([])
  useEffect(() => {
    nodesRef.current = nodes.map(n => ({ ...n }))
  }, [nodes])

  const simulate = useCallback(() => {
    const ns = nodesRef.current
    if (ns.length === 0) return
    const cx = dimensions.width / 2
    const cy = dimensions.height / 2
    const repulsion = 9000
    const attraction = 0.018
    const centerForce = 0.004
    const damping = 0.82

    for (let i = 0; i < ns.length; i++) {
      for (let j = i + 1; j < ns.length; j++) {
        const dx = ns[j].x - ns[i].x
        const dy = ns[j].y - ns[i].y
        const dist = Math.sqrt(dx * dx + dy * dy) || 1
        const force = repulsion / (dist * dist)
        const fx = (dx / dist) * force
        const fy = (dy / dist) * force
        ns[i].vx -= fx; ns[i].vy -= fy
        ns[j].vx += fx; ns[j].vy += fy
      }
    }

    for (const edge of edges) {
      const s = ns.find(n => n.id === edge.source)
      const t = ns.find(n => n.id === edge.target)
      if (!s || !t) continue
      const dx = t.x - s.x
      const dy = t.y - s.y
      const dist = Math.sqrt(dx * dx + dy * dy) || 1
      const ideal = s.isUser || t.isUser ? 160 : 130
      const force = (dist - ideal) * attraction
      const fx = (dx / dist) * force
      const fy = (dy / dist) * force
      s.vx += fx; s.vy += fy
      t.vx -= fx; t.vy -= fy
    }

    for (const n of ns) {
      if (n.isUser) {
        n.x = cx; n.y = cy; n.vx = 0; n.vy = 0
      } else {
        n.vx += (cx - n.x) * centerForce
        n.vy += (cy - n.y) * centerForce
        n.vx *= damping; n.vy *= damping
        n.x += n.vx; n.y += n.vy
        const margin = n.radius + 20
        n.x = Math.max(margin, Math.min(dimensions.width - margin, n.x))
        n.y = Math.max(margin, Math.min(dimensions.height - margin, n.y))
      }
    }
  }, [edges, dimensions])

  useEffect(() => {
    let frameCount = 0
    const maxFrames = 280
    const animate = () => {
      simulate()
      frameCount++
      setAnimProgress(Math.min(frameCount / maxFrames, 1))
      if (frameCount < maxFrames) {
        animationRef.current = requestAnimationFrame(animate)
      }
    }
    animationRef.current = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationRef.current)
  }, [simulate])

  useEffect(() => {
    if (!containerRef.current) return
    const observer = new ResizeObserver((entries) => {
      const entry = entries[0]
      if (entry) {
        setDimensions({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        })
      }
    })
    observer.observe(containerRef.current)
    return () => observer.disconnect()
  }, [])

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.target === svgRef.current || (e.target as Element).tagName === 'svg') {
      setIsDragging(true)
      setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
    }
  }
  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
    }
  }
  const handleMouseUp = () => setIsDragging(false)

  const handleZoom = (delta: number) => {
    setZoom(z => Math.max(0.4, Math.min(2.2, z + delta)))
  }

  const handleNodeClick = (nodeId: string) => {
    if (nodeId === '__user__') return
    setSelectedNode(nodeId)
  }

  const handleNodeDoubleClick = (nodeId: string) => {
    if (nodeId === '__user__') return
    if (onSelectPerson) {
      onSelectPerson(nodeId)
    }
  }

  const ns = nodesRef.current
  const focusNode = hoveredNode || selectedNode
  const selectedPerson = selectedNode ? persons.find(p => p.id === selectedNode) : null

  // 统计各关系类型
  const relationStats = useMemo(() => {
    const stats: Record<string, number> = {}
    persons.forEach(p => { stats[p.relationship] = (stats[p.relationship] || 0) + 1 })
    return stats
  }, [persons])

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col"
      style={{
        background: 'var(--color-canvas, radial-gradient(ellipse at 50% 30%, #F5F2ED 0%, #EDE8E1 50%, #E8E2D9 100%))',
      }}
    >
      {/* === 顶部导航栏 — Apple HIG 返回头 === */}
      <BackHeader
        title="关系图谱"
        subtitle={`${persons.length} 位联系人 · ${edges.filter(e => !e.isPrimary).length} 条关联`}
        onBack={onClose}
        rightAction={
          <div className="flex items-center gap-1">
            {[
              { icon: ZoomIn, action: () => handleZoom(0.2), label: '放大' },
              { icon: ZoomOut, action: () => handleZoom(-0.2), label: '缩小' },
            ].map((btn, i) => (
              <button
                key={i}
                onClick={btn.action}
                className="w-9 h-9 rounded-full flex items-center justify-center transition-all"
                style={{
                  color: 'var(--color-ink-secondary, #57534E)',
                  background: 'transparent',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover, rgba(0,0,0,0.04))' }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
                aria-label={btn.label}
              >
                <btn.icon className="w-4 h-4" strokeWidth={1.8} />
              </button>
            ))}
            <div className="w-px h-5 mx-1" style={{ background: 'var(--color-border, rgba(168,162,158,0.3))' }} />
            <button
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }}
              className="px-3 h-9 rounded-full text-xs font-medium transition-all"
              style={{ color: 'var(--color-ink-secondary, #57534E)', background: 'transparent' }}
              onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--color-surface-hover, rgba(0,0,0,0.04))' }}
              onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent' }}
            >
              复位
            </button>
          </div>
        }
      />

      {/* === 图谱画布 === */}
      <div ref={containerRef} className="flex-1 relative overflow-hidden">
        {/* 背景纹理：极淡的同心圆，营造空间感 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.3 }}>
          <defs>
            <radialGradient id="bgGlow" cx="50%" cy="45%" r="50%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.6)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </radialGradient>
          </defs>
          <rect width="100%" height="100%" fill="url(#bgGlow)" />
          {[120, 200, 280, 360].map((r, i) => (
            <circle
              key={r}
              cx={dimensions.width / 2}
              cy={dimensions.height / 2}
              r={r}
              fill="none"
              stroke="rgba(168,162,158,0.08)"
              strokeWidth={1}
              strokeDasharray={i % 2 === 0 ? '2 6' : 'none'}
            />
          ))}
        </svg>

        {/* 主 SVG */}
        <svg
          ref={svgRef}
          width="100%"
          height="100%"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : 'grab' }}
        >
          <defs>
            {/* 节点渐变定义 */}
            {Object.entries(PALETTE).map(([key, pal]) => (
              <radialGradient key={key} id={`grad-${key}`} cx="35%" cy="30%" r="80%">
                <stop offset="0%" stopColor={pal.base} stopOpacity={0.25} />
                <stop offset="60%" stopColor={pal.base} stopOpacity={0.08} />
                <stop offset="100%" stopColor={pal.base} stopOpacity={0.02} />
              </radialGradient>
            ))}
            <radialGradient id="grad-user" cx="35%" cy="30%" r="80%">
              <stop offset="0%" stopColor="#6B7B8C" stopOpacity={0.3} />
              <stop offset="60%" stopColor="#6B7B8C" stopOpacity={0.1} />
              <stop offset="100%" stopColor="#6B7B8C" stopOpacity={0.03} />
            </radialGradient>
            {/* 边的渐变 */}
            <linearGradient id="edge-fade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(168,162,158,0.3)" />
              <stop offset="50%" stopColor="rgba(168,162,158,0.15)" />
              <stop offset="100%" stopColor="rgba(168,162,158,0.3)" />
            </linearGradient>
          </defs>

          <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
            {/* === 绘制边 === */}
            {edges.map((edge, i) => {
              const source = ns.find(n => n.id === edge.source)
              const target = ns.find(n => n.id === edge.target)
              if (!source || !target) return null
              const midX = (source.x + target.x) / 2
              const midY = (source.y + target.y) / 2
              const isFocused = focusNode === edge.source || focusNode === edge.target
              const isDimmed = focusNode && !isFocused

              // 贝塞尔曲线 — 比直线更优雅
              // FIX: 多线关系按 edgeIndex 计算不同曲线偏移，避免重叠
              const dx = target.x - source.x
              const dy = target.y - source.y
              const dist = Math.sqrt(dx * dx + dy * dy)
              const baseOffset = edge.isPrimary ? 0 : Math.min(dist * 0.12, 30)
              // 多线分离：同节点对多条边按序号递增偏移
              const multiOffset = edge.totalEdges > 1
                ? (edge.edgeIndex - (edge.totalEdges - 1) / 2) * 22
                : 0
              const curveOffset = baseOffset + multiOffset
              const perpX = -dy / (dist || 1) * curveOffset
              const perpY = dx / (dist || 1) * curveOffset
              const cpX = midX + perpX
              const cpY = midY + perpY

              const pathD = `M ${source.x} ${source.y} Q ${cpX} ${cpY} ${target.x} ${target.y}`

              return (
                <g key={`edge-${i}`} style={{ opacity: isDimmed ? 0.15 : 1, transition: 'opacity 0.3s ease' }}>
                  <path
                    d={pathD}
                    fill="none"
                    stroke={isFocused ? edge.color : edge.isPrimary ? `${edge.color}50` : 'rgba(196,191,184,0.4)'}
                    strokeWidth={isFocused ? 2 : edge.isPrimary ? 1.5 : 1}
                    strokeDasharray={edge.isPrimary ? 'none' : '3 5'}
                    strokeLinecap="round"
                  />
                  {/* 边标签 — 聚焦、缩放足够、或多线关系时显示 */}
                  {(isFocused || (zoom > 0.85 && edge.isPrimary) || (zoom > 0.7 && edge.totalEdges > 1)) && (
                    <g transform={`translate(${cpX}, ${cpY})`}>
                      <rect
                        x={-18} y={-8} width={36} height={16}
                        rx={8}
                        fill="rgba(255,255,255,0.85)"
                        stroke={isFocused ? `${edge.color}40` : 'rgba(168,162,158,0.2)'}
                        strokeWidth={0.5}
                      />
                      <text
                        textAnchor="middle"
                        dy="0.35em"
                        fontSize={9}
                        fill={isFocused ? edge.color : '#A8A29E'}
                        className="pointer-events-none select-none"
                        style={{ fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}
                      >
                        {edge.label}
                      </text>
                    </g>
                  )}
                </g>
              )
            })}

            {/* === 绘制节点 === */}
            {ns.map((node) => {
              const pal = node.isUser
                ? PALETTE.colleague
                : (PALETTE[node.relationship as keyof typeof PALETTE] || PALETTE.other)
              const isFocused = focusNode === node.id
              const isDimmed = focusNode && !isFocused && !edges.some(e =>
                (e.source === focusNode && e.target === node.id) ||
                (e.target === focusNode && e.source === node.id)
              )
              const isSelected = selectedNode === node.id
              const temp = Math.max(0, Math.min(100, node.sentiment))
              const gradId = node.isUser ? 'grad-user' : `grad-${node.relationship}`

              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  onClick={() => handleNodeClick(node.id)}
                  onDoubleClick={() => handleNodeDoubleClick(node.id)}
                  onMouseEnter={() => setHoveredNode(node.id)}
                  onMouseLeave={() => setHoveredNode(null)}
                  style={{
                    cursor: node.isUser ? 'default' : 'pointer',
                    opacity: isDimmed ? 0.25 : 1,
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  {/* 外层光晕 — 聚焦时显示 */}
                  {isFocused && (
                    <circle
                      r={node.radius + 12}
                      fill={pal.soft}
                      style={{ transition: 'r 0.3s ease' }}
                    />
                  )}

                  {/* 选中环 */}
                  {isSelected && (
                    <circle
                      r={node.radius + 5}
                      fill="none"
                      stroke={pal.base}
                      strokeWidth={1.5}
                      opacity={0.5}
                      strokeDasharray="3 3"
                    >
                      <animateTransform
                        attributeName="transform"
                        type="rotate"
                        from="0"
                        to="360"
                        dur="20s"
                        repeatCount="indefinite"
                      />
                    </circle>
                  )}

                  {/* 节点主体 — 玻璃质感 */}
                  <circle r={node.radius} fill={`url(#${gradId})`} />
                  <circle
                    r={node.radius}
                    fill="none"
                    stroke={pal.base}
                    strokeWidth={node.isUser ? 2 : 1.5}
                    opacity={isFocused || isSelected ? 1 : 0.7}
                  />

                  {/* 温度弧 — 内圈进度 */}
                  {!node.isUser && (
                    <circle
                      r={node.radius - 4}
                      fill="none"
                      stroke={pal.base}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeDasharray={`${(temp / 100) * 2 * Math.PI * (node.radius - 4)} ${2 * Math.PI * (node.radius - 4)}`}
                      transform="rotate(-90)"
                      opacity={isFocused || isSelected ? 0.8 : 0.4}
                      style={{ transition: 'opacity 0.3s ease' }}
                    />
                  )}

                  {/* 用户节点特殊标记 */}
                  {node.isUser && (
                    <circle
                      r={node.radius - 6}
                      fill="none"
                      stroke="#6B7B8C"
                      strokeWidth={1}
                      opacity={0.3}
                      strokeDasharray="2 3"
                    />
                  )}

                  {/* 首字头像 */}
                  <text
                    textAnchor="middle"
                    dy="0.35em"
                    fontSize={node.isUser ? 16 : 13}
                    fill={pal.base}
                    className="pointer-events-none select-none"
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontWeight: 600,
                      opacity: isFocused || isSelected ? 1 : 0.85,
                    }}
                  >
                    {node.initials}
                  </text>

                  {/* 节点名称 — 在节点下方 */}
                  <text
                    textAnchor="middle"
                    dy={node.radius + 16}
                    fontSize={11}
                    fill={isFocused || isSelected ? '#1C1917' : '#57534E'}
                    className="pointer-events-none select-none"
                    style={{
                      fontFamily: "'Noto Sans SC', sans-serif",
                      fontWeight: isFocused || isSelected ? 600 : 400,
                      transition: 'fill 0.3s ease, font-weight 0.3s ease',
                    }}
                  >
                    {node.name.length > 5 ? node.name.slice(0, 4) + '…' : node.name}
                  </text>

                  {/* 温度标签 — 聚焦时显示 */}
                  {(isFocused || isSelected) && !node.isUser && (
                    <text
                      textAnchor="middle"
                      dy={node.radius + 30}
                      fontSize={9}
                      fill={pal.base}
                      className="pointer-events-none select-none"
                      style={{ fontFamily: "'Noto Sans SC', sans-serif", fontWeight: 500 }}
                    >
                      {tempLabel(node.sentiment)} · {node.sentiment}°
                    </text>
                  )}
                </g>
              )
            })}
          </g>
        </svg>

        {/* === 左下角：关系图例 — 浮动卡片 === */}
        <div
          className="absolute bottom-4 left-4 rounded-2xl p-4"
          style={{
            background: 'rgba(255,255,255,0.75)',
            backdropFilter: 'blur(20px) saturate(180%)',
            WebkitBackdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid rgba(214,211,209,0.3)',
            boxShadow: '0 4px 24px rgba(28,25,23,0.06)',
            maxWidth: '180px',
          }}
        >
          <div
            className="text-xs mb-2.5"
            style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#1C1917', letterSpacing: '0.03em' }}
          >
            关系分布
          </div>
          <div className="space-y-1.5">
            {Object.entries(relationStats).map(([type, count]) => {
              const pal = PALETTE[type as keyof typeof PALETTE] || PALETTE.other
              return (
                <div key={type} className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: pal.base, boxShadow: `0 0 6px ${pal.base}60` }}
                  />
                  <span className="text-xs flex-1" style={{ color: '#57534E' }}>
                    {RELATION_LABELS[type] || type}
                  </span>
                  <span className="text-xs" style={{ color: '#A8A29E', fontVariantNumeric: 'tabular-nums' }}>
                    {count}
                  </span>
                </div>
              )
            })}
          </div>
        </div>

        {/* === 右下角：选中人物详情卡 — 滑入动画 === */}
        {selectedPerson && (
          <div
            className="absolute bottom-4 right-4 rounded-2xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.82)',
              backdropFilter: 'blur(20px) saturate(180%)',
              WebkitBackdropFilter: 'blur(20px) saturate(180%)',
              border: '1px solid rgba(214,211,209,0.3)',
              boxShadow: '0 8px 32px rgba(28,25,23,0.1)',
              width: '240px',
              animation: 'cardSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1)',
            }}
          >
            {/* 顶部色带 */}
            <div
              className="h-1"
              style={{
                background: `linear-gradient(90deg, ${(PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base}, ${(PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base}60)`,
              }}
            />

            <div className="p-4">
              {/* 头部 */}
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{
                    background: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).soft,
                    border: `1.5px solid ${(PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base}40`,
                  }}
                >
                  <span
                    className="text-base"
                    style={{
                      fontFamily: "'Noto Serif SC', serif",
                      fontWeight: 600,
                      color: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base,
                    }}
                  >
                    {getInitials(selectedPerson.name)}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <div
                    className="text-sm truncate"
                    style={{ fontFamily: "'Noto Serif SC', serif", fontWeight: 600, color: '#1C1917' }}
                  >
                    {selectedPerson.name}
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span
                      className="text-xs px-1.5 py-0.5 rounded"
                      style={{
                        background: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).soft,
                        color: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base,
                      }}
                    >
                      {RELATION_LABELS[selectedPerson.relationship]}
                    </span>
                    <span className="text-xs" style={{ color: '#A8A29E' }}>
                      {tempLabel(selectedPerson.sentiment)}
                    </span>
                  </div>
                </div>
              </div>

              {/* 温度条 */}
              <div className="mb-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs" style={{ color: '#A8A29E' }}>关系温度</span>
                  <span
                    className="text-xs font-medium"
                    style={{
                      color: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base,
                      fontVariantNumeric: 'tabular-nums',
                    }}
                  >
                    {selectedPerson.sentiment}°
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(168,162,158,0.15)' }}>
                  <div
                    className="h-full rounded-full"
                    style={{
                      width: `${Math.max(0, Math.min(100, selectedPerson.sentiment))}%`,
                      background: `linear-gradient(90deg, ${(PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base}80, ${(PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base})`,
                      transition: 'width 0.5s cubic-bezier(0.16, 1, 0.3, 1)',
                    }}
                  />
                </div>
              </div>

              {/* 信息行 */}
              <div className="space-y-1.5 mb-3">
                {selectedPerson.profile?.identity?.age && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: '#A8A29E', width: '36px' }}>年龄</span>
                    <span style={{ color: '#57534E' }}>{selectedPerson.profile.identity.age}岁</span>
                  </div>
                )}
                {selectedPerson.profile?.career?.company && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: '#A8A29E', width: '36px' }}>公司</span>
                    <span style={{ color: '#57534E' }} className="truncate">{selectedPerson.profile.career.company}</span>
                  </div>
                )}
                {selectedPerson.profile?.career?.title && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: '#A8A29E', width: '36px' }}>职位</span>
                    <span style={{ color: '#57534E' }} className="truncate">{selectedPerson.profile.career.title}</span>
                  </div>
                )}
                {selectedPerson.connections?.length > 0 && (
                  <div className="flex items-center gap-2 text-xs">
                    <span style={{ color: '#A8A29E', width: '36px' }}>关联</span>
                    <span style={{ color: '#57534E' }}>{selectedPerson.connections.length} 人</span>
                  </div>
                )}
              </div>

              {/* 查看详情按钮 */}
              <button
                onClick={() => handleNodeDoubleClick(selectedPerson.id)}
                className="w-full flex items-center justify-center gap-1 py-2 rounded-lg text-xs font-medium transition-all"
                style={{
                  background: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).soft,
                  color: (PALETTE[selectedPerson.relationship as keyof typeof PALETTE] || PALETTE.other).base,
                }}
                onMouseEnter={(e) => { e.currentTarget.style.opacity = '0.8' }}
                onMouseLeave={(e) => { e.currentTarget.style.opacity = '1' }}
              >
                查看完整档案
                <ChevronRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}

        {/* === 底部提示 — 仅首次显示 === */}
        {animProgress < 0.5 && (
          <div
            className="absolute top-4 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 rounded-full"
            style={{
              background: 'rgba(255,255,255,0.8)',
              backdropFilter: 'blur(12px)',
              WebkitBackdropFilter: 'blur(12px)',
              border: '1px solid rgba(214,211,209,0.3)',
              animation: 'fadeInOut 3s ease-in-out',
            }}
          >
            <Sparkles className="w-3 h-3" style={{ color: '#C4A35A' }} />
            <span className="text-xs" style={{ color: '#57534E' }}>点击节点查看详情，双击打开档案</span>
          </div>
        )}
      </div>

      {/* 内联动画 */}
      <style>{`
        @keyframes cardSlideIn {
          from { transform: translateY(12px) scale(0.96); opacity: 0; }
          to { transform: translateY(0) scale(1); opacity: 1; }
        }
        @keyframes fadeInOut {
          0% { opacity: 0; transform: translate(-50%, -8px); }
          20% { opacity: 1; transform: translate(-50%, 0); }
          80% { opacity: 1; transform: translate(-50%, 0); }
          100% { opacity: 0; transform: translate(-50%, -4px); }
        }
      `}</style>
    </div>
  )
}
