import { useMemo } from 'react'
import type { Memory } from '../types'

/**
 * P1-1: 记忆星图（Memory Constellation）
 * 将右栏的静态记忆列表升级为动态发光节点图
 * AI 回复时，被引用的记忆节点脉冲发光并连线到中心
 */

interface MemoryConstellationProps {
  memories: Memory[]
  activeMemoryIds?: string[]
  isGenerating: boolean
}

interface NodePosition {
  id: string
  x: number
  y: number
  label: string
  sentiment: 'positive' | 'negative' | 'neutral'
  isActive: boolean
}

export function MemoryConstellation({
  memories,
  activeMemoryIds = [],
  isGenerating,
}: MemoryConstellationProps) {
  // 只展示前 12 条记忆，避免过于拥挤
  const displayMemories = memories.slice(0, 12)

  // 计算节点位置（圆形排列）
  const nodes: NodePosition[] = useMemo(() => {
    const centerX = 100
    const centerY = 100
    const radius = 70
    return displayMemories.map((mem, i) => {
      const angle = (i / displayMemories.length) * Math.PI * 2 - Math.PI / 2
      const sentiment: 'positive' | 'negative' | 'neutral' =
        mem.content.includes('压力') || mem.content.includes('冲突') || mem.content.includes('担心')
          ? 'negative'
          : mem.content.includes('开心') || mem.content.includes('成功') || mem.content.includes('答应')
            ? 'positive'
            : 'neutral'
      return {
        id: mem.id,
        x: centerX + Math.cos(angle) * radius,
        y: centerY + Math.sin(angle) * radius,
        label: mem.content.slice(0, 8) + (mem.content.length > 8 ? '...' : ''),
        sentiment,
        isActive: activeMemoryIds.includes(mem.id),
      }
    })
  }, [displayMemories, activeMemoryIds])

  if (displayMemories.length === 0) return null

  const getColor = (sentiment: string, isActive: boolean) => {
    if (isActive) return '#6B9E6B'
    switch (sentiment) {
      case 'positive': return '#6B9E6B'
      case 'negative': return '#C8956D'
      default: return '#A0A0A0'
    }
  }

  const getOpacity = (isActive: boolean, isGenerating: boolean) => {
    if (isActive && isGenerating) return 1
    if (isActive) return 0.9
    return 0.4
  }

  return (
    <div className="relative">
      <svg viewBox="0 0 200 200" className="w-full" style={{ maxHeight: '200px' }}>
        {/* 中心 AI 节点 */}
        <circle
          cx={100}
          cy={100}
          r={12}
          fill="url(#aiGradient)"
          className={isGenerating ? 'ai-pulse' : ''}
        />
        <text
          x={100}
          y={104}
          textAnchor="middle"
          fontSize={10}
          fill="white"
          fontFamily="serif"
        >
          舟
        </text>

        {/* 渐变定义 */}
        <defs>
          <radialGradient id="aiGradient">
            <stop offset="0%" stopColor="#6B9E6B" />
            <stop offset="100%" stopColor="#4A7C4A" />
          </radialGradient>
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* 连线（仅 active 节点） */}
        {isGenerating && nodes.filter(n => n.isActive).map((node) => (
          <line
            key={`line-${node.id}`}
            x1={100}
            y1={100}
            x2={node.x}
            y2={node.y}
            stroke={getColor(node.sentiment, true)}
            strokeWidth={0.8}
            opacity={0.5}
            strokeDasharray="2 2"
            className="connection-pulse"
          />
        ))}

        {/* 记忆节点 */}
        {nodes.map((node) => (
          <g key={node.id}>
            <circle
              cx={node.x}
              cy={node.y}
              r={node.isActive && isGenerating ? 5 : 3}
              fill={getColor(node.sentiment, node.isActive)}
              opacity={getOpacity(node.isActive, isGenerating)}
              filter={node.isActive && isGenerating ? 'url(#glow)' : undefined}
              className={node.isActive && isGenerating ? 'node-pulse' : ''}
            />
            {/* 标签（仅 active 节点显示） */}
            {node.isActive && isGenerating && (
              <text
                x={node.x}
                y={node.y - 8}
                textAnchor="middle"
                fontSize={5}
                fill="#6B655C"
                opacity={0.8}
              >
                {node.label}
              </text>
            )}
          </g>
        ))}
      </svg>

      {/* 图例 */}
      <div className="flex items-center justify-center gap-3 mt-1 text-[10px] text-ink-muted">
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zen-sage" /> 正面
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-zen-terracotta" /> 压力
        </span>
        <span className="flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> 中性
        </span>
      </div>

      <style>{`
        @keyframes aiPulse {
          0%, 100% { r: 12; opacity: 1; }
          50% { r: 14; opacity: 0.8; }
        }
        .ai-pulse {
          animation: aiPulse 1.5s ease-in-out infinite;
        }
        @keyframes nodePulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        .node-pulse {
          animation: nodePulse 1s ease-in-out infinite;
        }
        @keyframes connectionPulse {
          0% { stroke-dashoffset: 0; opacity: 0.2; }
          50% { opacity: 0.6; }
          100% { stroke-dashoffset: 4; opacity: 0.2; }
        }
        .connection-pulse {
          animation: connectionPulse 1.5s linear infinite;
        }
      `}</style>
    </div>
  )
}
