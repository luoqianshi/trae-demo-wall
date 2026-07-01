/**
 * 迷你关系图谱
 *
 * 在人物详情弹窗中展示以当前人物为中心的局部关系网络
 * SVG 力导向布局简化版：中心节点 + 辐射连接
 */

import { useMemo } from 'react'
import { Users } from 'lucide-react'
import type { Person, PersonConnection } from '../types'
import { warmthToColor } from '../lib/warmthColor'

interface MiniRelationGraphProps {
  person: Person
  allPersons: Person[]
  onPersonClick?: (personId: string) => void
}

// 连接类型颜色
const CONNECTION_COLORS: Record<string, string> = {
  family: '#C4704A',
  colleague: '#5B7DB1',
  friend: '#6B9E6B',
  mentor: '#C4A35A',
  partner: '#8B6BB1',
  client: '#D49B6A',
  subordinate: '#7A8B99',
  leader: '#B17A7A',
  other: '#999999',
}

const CONNECTION_LABELS: Record<string, string> = {
  family: '家人',
  colleague: '同事',
  friend: '朋友',
  mentor: '导师',
  partner: '伙伴',
  client: '客户',
  subordinate: '下属',
  leader: '上级',
  other: '其他',
}

export function MiniRelationGraph({ person, allPersons, onPersonClick }: MiniRelationGraphProps) {
  const SIZE = 280
  const CENTER = SIZE / 2
  const RADIUS = 95

  // 构建节点和边
  const { nodes, edges } = useMemo(() => {
    const nodes: Array<{
      id: string
      name: string
      x: number
      y: number
      color: string
      sentiment: number
      strength: number
      connectionType: string
    }> = []
    const edges: Array<{
      x1: number
      y1: number
      x2: number
      y2: number
      strength: number
      color: string
    }> = []

    const connections = person.connections || []
    if (connections.length === 0) return { nodes, edges }

    // 中心节点
    const centerSentiment = person.sentiment
    nodes.push({
      id: person.id,
      name: person.name,
      x: CENTER,
      y: CENTER,
      color: warmthToColor(centerSentiment),
      sentiment: centerSentiment,
      strength: 100,
      connectionType: 'self',
    })

    // 辐射节点
    const angleStep = (Math.PI * 2) / connections.length
    const startAngle = -Math.PI / 2 // 从正上方开始

    connections.forEach((conn: PersonConnection, idx: number) => {
      const angle = startAngle + angleStep * idx
      const targetPerson = allPersons.find(p => p.id === conn.targetPersonId)
      const targetName = targetPerson?.name || conn.targetPersonName || conn.targetPersonId
      const targetSentiment = targetPerson?.sentiment ?? 50

      // 根据强度调整距离（强度高的近一些）
      const distance = RADIUS - (conn.strength / 100) * 15
      const x = CENTER + Math.cos(angle) * distance
      const y = CENTER + Math.sin(angle) * distance

      nodes.push({
        id: conn.targetPersonId,
        name: targetName,
        x,
        y,
        color: warmthToColor(targetSentiment),
        sentiment: targetSentiment,
        strength: conn.strength,
        connectionType: conn.relationType,
      })

      // 边
      const edgeColor = CONNECTION_COLORS[conn.relationType] || CONNECTION_COLORS.other
      edges.push({
        x1: CENTER,
        y1: CENTER,
        x2: x,
        y2: y,
        strength: conn.strength,
        color: edgeColor,
      })
    })

    return { nodes, edges }
  }, [person, allPersons])

  if (nodes.length <= 1) return null

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        className="w-full"
        style={{ maxHeight: `${SIZE}px` }}
      >
        {/* 边（连接线） */}
        {edges.map((edge, idx) => (
          <line
            key={`edge-${idx}`}
            x1={edge.x1}
            y1={edge.y1}
            x2={edge.x2}
            y2={edge.y2}
            stroke={edge.color}
            strokeWidth={Math.max(0.5, edge.strength / 40)}
            strokeOpacity={0.2 + (edge.strength / 100) * 0.3}
            strokeDasharray={edge.strength < 40 ? '3 2' : 'none'}
          />
        ))}

        {/* 节点 */}
        {nodes.map((node, idx) => {
          const isCenter = idx === 0
          const nodeRadius = isCenter ? 22 : Math.max(12, 12 + (node.strength / 100) * 8)

          return (
            <g
              key={`node-${idx}`}
              onClick={() => !isCenter && onPersonClick?.(node.id)}
              style={{ cursor: !isCenter && onPersonClick ? 'pointer' : 'default' }}
            >
              {/* 外圈光晕 */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius + 3}
                fill={node.color}
                opacity={isCenter ? 0.2 : 0.12}
              />
              {/* 主节点 */}
              <circle
                cx={node.x}
                cy={node.y}
                r={nodeRadius}
                fill={node.color}
                opacity={isCenter ? 0.9 : 0.75}
                stroke="white"
                strokeWidth={isCenter ? 2 : 1}
              />
              {/* 中心人物标识 */}
              {isCenter && (
                <text
                  x={node.x}
                  y={node.y + 1}
                  textAnchor="middle"
                  dominantBaseline="middle"
                  fontSize="11"
                  fontWeight="600"
                  fill="white"
                >
                  {node.name.slice(0, 2)}
                </text>
              )}
              {/* 外围节点名称 */}
              {!isCenter && (
                <text
                  x={node.x}
                  y={node.y + nodeRadius + 10}
                  textAnchor="middle"
                  fontSize="9"
                  fill="var(--color-ink-secondary, #57534E)"
                >
                  {node.name.length > 4 ? node.name.slice(0, 3) + '…' : node.name}
                </text>
              )}
              {/* 连接类型标签 */}
              {!isCenter && node.connectionType !== 'self' && (
                <text
                  x={node.x}
                  y={node.y - nodeRadius - 5}
                  textAnchor="middle"
                  fontSize="7"
                  fill={CONNECTION_COLORS[node.connectionType] || '#999'}
                  opacity="0.7"
                >
                  {CONNECTION_LABELS[node.connectionType] || node.connectionType}
                </text>
              )}
            </g>
          )
        })}
      </svg>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-3 flex-wrap mt-1">
        {Object.entries(CONNECTION_LABELS).filter(([key]) =>
          nodes.some(n => n.connectionType === key)
        ).map(([key, label]) => (
          <span key={key} className="flex items-center gap-1 text-2xs text-ink-tertiary">
            <span
              className="w-2 h-2 rounded-full"
              style={{ background: CONNECTION_COLORS[key] || '#999' }}
            />
            {label}
          </span>
        ))}
      </div>
    </div>
  )
}
