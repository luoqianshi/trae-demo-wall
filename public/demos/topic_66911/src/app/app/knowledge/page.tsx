'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import {
  getKnowledge,
  getPapers,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
  type KnowledgeEntry,
  type Paper,
} from '../../../lib/api'
import { callAI } from '../../../lib/editor-api'
import {
  Lightbulb,
  Plus,
  Search,
  Trash2,
  Edit3,
  BookOpen,
  Tag,
  List,
  Network,
  Sparkles,
  Loader2,
  Maximize2,
  Move,
} from 'lucide-react'
import { useToast } from '../../../components/ui/Toast'

// ============ FORCE GRAPH TYPES ============

interface GraphNode {
  id: string
  x: number
  y: number
  vx: number
  vy: number
  radius: number
  color: string
  entry: KnowledgeEntry
  tags: string[]
}

interface GraphLink {
  source: string
  target: string
  strength: number
}

// ============ CATEGORY BORDER COLORS ============

const CATEGORY_BORDER_MAP: Record<string, string> = {
  general: 'border-l-gray-400',
  methodology: 'border-l-indigo',
  theory: 'border-l-purple-400',
  experiment: 'border-l-green-500',
  finding: 'border-l-amber-500',
  insight: 'border-l-rose-400',
}

// ============ FORCE GRAPH COMPONENT ============

function KnowledgeGraph({
  entries,
  categories,
  onNodeClick,
}: {
  entries: KnowledgeEntry[]
  categories: { value: string; label: string; color: string }[]
  onNodeClick: (entry: KnowledgeEntry) => void
}) {
  const svgRef = useRef<SVGSVGElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [nodes, setNodes] = useState<GraphNode[]>([])
  const [links, setLinks] = useState<GraphLink[]>([])
  const [hoveredNode, setHoveredNode] = useState<string | null>(null)
  const [draggingNode, setDraggingNode] = useState<string | null>(null)
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 })
  const [dimensions, setDimensions] = useState({ width: 800, height: 500 })
  const animRef = useRef<number>()

  const categoryColorMap: Record<string, string> = {
    general: '#8A7E74',
    methodology: '#5B8DB8',
    theory: '#9B7CB8',
    experiment: '#6BA88A',
    finding: '#C4A35A',
    insight: '#B87070',
  }

  useEffect(() => {
    if (!entries.length) return

    const width = containerRef.current?.clientWidth || 800
    const height = containerRef.current?.clientHeight || 500
    setDimensions({ width, height })

    const newNodes: GraphNode[] = entries.map((entry, i) => {
      const tags = entry.tags ? entry.tags.split(',').map(t => t.trim()).filter(Boolean) : []
      const contentLength = entry.content.length
      const radius = Math.max(20, Math.min(50, 20 + contentLength / 50))
      const color = categoryColorMap[entry.category] || '#8A7E74'
      const angle = (i / entries.length) * Math.PI * 2
      const dist = Math.min(width, height) * 0.3

      return { id: entry.id, x: width / 2 + Math.cos(angle) * dist, y: height / 2 + Math.sin(angle) * dist, vx: 0, vy: 0, radius, color, entry, tags }
    })

    const newLinks: GraphLink[] = []
    for (let i = 0; i < newNodes.length; i++) {
      for (let j = i + 1; j < newNodes.length; j++) {
        const a = newNodes[i]
        const b = newNodes[j]
        let strength = 0
        if (a.entry.category === b.entry.category) strength += 0.5
        const sharedTags = a.tags.filter(t => b.tags.includes(t))
        strength += sharedTags.length * 0.3
        const lenDiff = Math.abs(a.entry.content.length - b.entry.content.length)
        if (lenDiff < 100) strength += 0.1
        if (strength > 0.2) newLinks.push({ source: a.id, target: b.id, strength: Math.min(strength, 1) })
      }
    }

    setNodes(newNodes)
    setLinks(newLinks)
  }, [entries])

  useEffect(() => {
    if (!nodes.length) return

    const simulate = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n }))
        const width = dimensions.width
        const height = dimensions.height

        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const a = newNodes[i]
            const b = newNodes[j]
            const dx = b.x - a.x
            const dy = b.y - a.y
            const dist = Math.sqrt(dx * dx + dy * dy) || 1
            const minDist = a.radius + b.radius + 20
            if (dist < minDist * 3) {
              const force = (minDist * 3 - dist) / (minDist * 3) * 80
              const fx = (dx / dist) * force
              const fy = (dy / dist) * force
              a.vx -= fx; a.vy -= fy
              b.vx += fx; b.vy += fy
            }
          }
        }

        links.forEach(link => {
          const a = newNodes.find(n => n.id === link.source)
          const b = newNodes.find(n => n.id === link.target)
          if (!a || !b) return
          const dx = b.x - a.x
          const dy = b.y - a.y
          const dist = Math.sqrt(dx * dx + dy * dy) || 1
          const targetDist = 100 + (1 - link.strength) * 150
          const force = (dist - targetDist) * 0.003 * link.strength
          const fx = (dx / dist) * force
          const fy = (dy / dist) * force
          a.vx += fx; a.vy += fy
          b.vx -= fx; b.vy -= fy
        })

        newNodes.forEach(n => {
          n.vx += (width / 2 - n.x) * 0.0005
          n.vy += (height / 2 - n.y) * 0.0005
        })

        newNodes.forEach(n => {
          if (n.id === draggingNode) return
          n.vx *= 0.85; n.vy *= 0.85
          n.x += n.vx; n.y += n.vy
          const margin = n.radius + 10
          n.x = Math.max(margin, Math.min(width - margin, n.x))
          n.y = Math.max(margin, Math.min(height - margin, n.y))
        })

        return newNodes
      })
      animRef.current = requestAnimationFrame(simulate)
    }

    animRef.current = requestAnimationFrame(simulate)
    return () => { if (animRef.current) cancelAnimationFrame(animRef.current) }
  }, [nodes.length, links, draggingNode, dimensions])

  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setDimensions({ width: containerRef.current.clientWidth, height: containerRef.current.clientHeight })
      }
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const getMousePos = (e: React.MouseEvent) => {
    const rect = svgRef.current?.getBoundingClientRect()
    if (!rect) return { x: 0, y: 0 }
    return { x: e.clientX - rect.left, y: e.clientY - rect.top }
  }

  const handleMouseDown = (e: React.MouseEvent, nodeId: string) => {
    e.stopPropagation()
    const pos = getMousePos(e)
    const node = nodes.find(n => n.id === nodeId)
    if (!node) return
    setDraggingNode(nodeId)
    setDragOffset({ x: pos.x - node.x, y: pos.y - node.y })
  }

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!draggingNode) return
    const pos = getMousePos(e)
    setNodes(prev => prev.map(n =>
      n.id === draggingNode ? { ...n, x: pos.x - dragOffset.x, y: pos.y - dragOffset.y, vx: 0, vy: 0 } : n
    ))
  }, [draggingNode, dragOffset])

  const handleMouseUp = useCallback(() => { setDraggingNode(null) }, [])

  const getConnectedNodeIds = (nodeId: string) => {
    const connected = new Set<string>()
    links.forEach(l => {
      if (l.source === nodeId) connected.add(l.target)
      if (l.target === nodeId) connected.add(l.source)
    })
    return connected
  }

  const connectedNodeIds = hoveredNode ? getConnectedNodeIds(hoveredNode) : new Set<string>()

  return (
    <div ref={containerRef} className="w-full h-[500px] relative liquid-glass overflow-hidden paper-texture">
      {/* Warm ink-wash background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        background: 'radial-gradient(ellipse at 30% 40%, rgba(196,163,90,0.06) 0%, transparent 60%), radial-gradient(ellipse at 70% 60%, rgba(91,94,166,0.04) 0%, transparent 50%)',
      }} />

      <svg
        ref={svgRef}
        width={dimensions.width}
        height={dimensions.height}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className="cursor-grab active:cursor-grabbing relative z-10"
      >
        <defs>
          <linearGradient id="linkGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#C4A35A" stopOpacity="0.5" />
            <stop offset="50%" stopColor="#8A7E74" stopOpacity="0.4" />
            <stop offset="100%" stopColor="#5B5EA6" stopOpacity="0.5" />
          </linearGradient>
          <filter id="inkBrush" x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="turbulence" baseFrequency="0.015" numOctaves="3" seed="2" result="turbulence" />
            <feDisplacementMap in="SourceGraphic" in2="turbulence" scale="3" xChannelSelector="R" yChannelSelector="G" />
          </filter>
        </defs>

        {/* Links */}
        {links.map((link, i) => {
          const source = nodes.find(n => n.id === link.source)
          const target = nodes.find(n => n.id === link.target)
          if (!source || !target) return null
          const isHighlighted = hoveredNode && (link.source === hoveredNode || link.target === hoveredNode)
          const opacity = hoveredNode ? (isHighlighted ? 0.8 : 0.08) : (0.2 + link.strength * 0.3)
          const strokeWidth = isHighlighted ? 2.5 : 1 + link.strength

          return (
            <line
              key={`${link.source}-${link.target}-${i}`}
              x1={source.x} y1={source.y} x2={target.x} y2={target.y}
              stroke="url(#linkGradient)" strokeWidth={strokeWidth} opacity={opacity}
              filter="url(#inkBrush)"
              style={{ cursor: 'pointer', transition: 'opacity 0.3s ease' }}
            />
          )
        })}

        {/* Nodes */}
        {nodes.map(node => {
          const isHovered = hoveredNode === node.id
          const isConnected = hoveredNode ? connectedNodeIds.has(node.id) : false
          const opacity = hoveredNode ? (isHovered || isConnected ? 1 : 0.25) : 1
          const scale = isHovered ? 1.3 : 1

          return (
            <g
              key={node.id}
              transform={`translate(${node.x}, ${node.y}) scale(${scale})`}
              opacity={opacity}
              onMouseDown={(e) => handleMouseDown(e, node.id)}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => onNodeClick(node.entry)}
              style={{ cursor: 'pointer', transition: 'opacity 0.3s ease, transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)' }}
            >
              <defs>
                <radialGradient id={`inkWash-${node.id}`}>
                  <stop offset="0%" stopColor={node.color} stopOpacity="0.25" />
                  <stop offset="50%" stopColor={node.color} stopOpacity="0.08" />
                  <stop offset="70%" stopColor={node.color} stopOpacity="0" />
                </radialGradient>
              </defs>
              {isHovered && (
                <circle r={node.radius + 10} fill="#C4A35A" opacity={0.12} className="golden-glow" />
              )}
              <circle
                r={node.radius}
                fill={`url(#inkWash-${node.id})`}
                stroke={node.color}
                strokeWidth={1.5}
                strokeOpacity={0.5}
              />
              <circle r={node.radius - 3} fill="none" stroke={node.color} strokeWidth={0.8} strokeOpacity={0.25} />
              <text
                textAnchor="middle"
                dominantBaseline="middle"
                fill={node.color}
                fontSize={Math.max(10, node.radius / 2.5)}
                fontWeight={600}
                style={{ pointerEvents: 'none', userSelect: 'none', fontFamily: 'serif' }}
              >
                {node.entry.title.length > 4 ? node.entry.title.slice(0, 4) + '...' : node.entry.title}
              </text>
            </g>
          )
        })}

        {/* Hovered node tooltip */}
        {hoveredNode && (() => {
          const node = nodes.find(n => n.id === hoveredNode)
          if (!node) return null
          return (
            <foreignObject x={node.x + node.radius * 1.3 + 8} y={node.y - 40} width={220} height={100} style={{ pointerEvents: 'none' }}>
              <div className="liquid-glass p-3 shadow-lg" style={{ fontFamily: 'serif' }}>
                <p className="text-xs font-semibold text-ink mb-1 truncate">{node.entry.title}</p>
                <p className="text-[10px] text-ink-muted line-clamp-2 leading-relaxed">{node.entry.content.slice(0, 80)}...</p>
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: node.color }} />
                  <span className="text-[10px] text-ink-light">{categories.find(c => c.value === node.entry.category)?.label || '通识'}</span>
                </div>
              </div>
            </foreignObject>
          )
        })()}
      </svg>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 liquid-glass px-4 py-3 z-20">
        <p className="text-[10px] font-serif font-medium text-ink-muted mb-2">标签分类</p>
        <div className="flex flex-wrap gap-x-3 gap-y-1.5">
          {categories.map(cat => (
            <div key={cat.value} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: categoryColorMap[cat.value] || '#8A7E74' }} />
              <span className="text-[10px] font-serif text-ink-secondary">{cat.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Interaction hint */}
      <div className="absolute top-4 right-4 liquid-glass px-3 py-2 z-20 flex items-center gap-1.5">
        <Move className="w-3 h-3 text-ink-muted" />
        <span className="text-[10px] font-serif text-ink-muted">拖拽调整 · 点击查看</span>
      </div>
    </div>
  )
}

// ============ MAIN PAGE ============

export default function KnowledgePage() {
  const { success, error: toastError } = useToast()
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [viewingEntry, setViewingEntry] = useState<KnowledgeEntry | null>(null)
  const [viewMode, setViewMode] = useState<'list' | 'graph'>('list')
  const [aiDiscovering, setAiDiscovering] = useState(false)
  const [aiConnections, setAiConnections] = useState<{ from: string; to: string; reason: string }[] | null>(null)

  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: 'general',
    tags: '',
    sourcePaperId: '',
  })

  const categories = [
    { value: 'general', label: '通识', color: 'bg-gray-100 text-gray-600', dotColor: 'bg-gray-400' },
    { value: 'methodology', label: '方法', color: 'bg-blue-50 text-blue-600', dotColor: 'bg-blue-400' },
    { value: 'theory', label: '义理', color: 'bg-purple-50 text-purple-600', dotColor: 'bg-purple-400' },
    { value: 'experiment', label: '实验', color: 'bg-green-50 text-green-600', dotColor: 'bg-green-400' },
    { value: 'finding', label: '发现', color: 'bg-amber-50 text-amber-600', dotColor: 'bg-amber-400' },
    { value: 'insight', label: '洞见', color: 'bg-rose-50 text-rose-600', dotColor: 'bg-rose-400' },
  ]

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const [entriesData, papersData] = await Promise.all([
        getKnowledge().catch(() => []),
        getPapers().catch(() => []),
      ])
      setEntries(entriesData)
      setPapers(papersData)
    } catch (error) {
      console.error('Failed to load knowledge:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '博闻加载未果，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({ title: '', content: '', category: 'general', tags: '', sourcePaperId: '' })
    setEditingEntry(null)
  }

  function openEditModal(entry: KnowledgeEntry) {
    setEditingEntry(entry)
    setFormData({
      title: entry.title,
      content: entry.content,
      category: entry.category,
      tags: entry.tags,
      sourcePaperId: entry.sourcePaperId || '',
    })
    setShowAddModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (editingEntry) {
        await updateKnowledge(editingEntry.id, formData)
      } else {
        await createKnowledge(formData)
        success('博闻已录')
      }
      setShowAddModal(false)
      resetForm()
      loadData()
    } catch (error) {
      console.error('Failed to save knowledge:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '博闻保存未果，请稍后重试')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要除却此条博闻？')) return
    try {
      await deleteKnowledge(id)
      loadData()
      success('博闻已除')
    } catch (error) {
      console.error('Failed to delete knowledge:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '博闻删除未果，请稍后重试')
    }
  }

  const filteredEntries = entries
    .filter(e => {
      if (categoryFilter === 'all') return true
      return e.category === categoryFilter
    })
    .filter(e => {
      if (!searchQuery) return true
      const q = searchQuery.toLowerCase()
      return e.title.toLowerCase().includes(q) || e.content.toLowerCase().includes(q) || e.tags.toLowerCase().includes(q)
    })

  const categoryCounts = categories.map(cat => ({
    ...cat,
    count: entries.filter(e => e.category === cat.value).length,
  }))

  // AI discover connections
  async function handleAIDiscover() {
    if (entries.length < 2) { success('博闻不足，请至少记录两条'); return }
    setAiDiscovering(true)
    setAiConnections(null)
    try {
      const entriesSummary = entries.map(e =>
        `【${e.title}】分类：${categories.find(c => c.value === e.category)?.label || e.category}，标签：${e.tags || '无'}，内容摘要：${e.content.slice(0, 100)}...`
      ).join('\n\n')

      const prompt = `请分析以下知识条目之间的潜在关联。找出 3-5 对可能存在隐性关联的条目，并简要说明关联原因。只返回 JSON 数组格式：\n\n${entriesSummary}\n\n请返回格式：[{"from": "条目A标题", "to": "条目B标题", "reason": "关联原因说明"}]`

      const result = await callAI(prompt, {
        systemPrompt: '你是一个知识图谱分析专家，擅长发现知识之间的隐性关联。',
        temperature: 0.7,
        maxTokens: 1024,
      })

      const jsonMatch = result.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        setAiConnections(JSON.parse(jsonMatch[0]))
      } else {
        setAiConnections([])
      }
    } catch (error) {
      console.error('AI discovery failed:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '关联发现未果，请稍后重试')
      setAiConnections([])
    } finally {
      setAiDiscovering(false)
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen paper-texture ink-wash">
      {/* Header */}
      <div className="flex items-end justify-between mb-2 animate-float-in">
        <div>
          <h1 className="font-display text-3xl text-ink tracking-wider">博闻阁</h1>
          <p className="font-serif text-ink-muted/40 mt-1 text-sm italic tracking-widest">
            格物致知，博闻强记
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* View mode toggle with pill style */}
          <div className="relative flex gap-1 p-1 rounded-full bg-white/40 backdrop-blur-sm border border-border/50">
            <button
              onClick={() => setViewMode('list')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-serif font-medium transition-all duration-300 ${
                viewMode === 'list' ? 'bg-ink text-gold shadow-sm' : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              目录
            </button>
            <button
              onClick={() => setViewMode('graph')}
              className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-serif font-medium transition-all duration-300 ${
                viewMode === 'graph' ? 'bg-ink text-gold shadow-sm' : 'text-ink-muted hover:text-ink-secondary'
              }`}
            >
              <Network className="w-3.5 h-3.5" />
              星图
            </button>
          </div>
          <button
            onClick={() => { resetForm(); setShowAddModal(true) }}
            className="btn-primary"
          >
            <Plus className="w-4 h-4" />
            <span>记录博闻</span>
          </button>
        </div>
      </div>

      {/* Decorative ink divider */}
      <div className="ink-divider my-6" />

      {/* Search + AI Extract */}
      <div className="flex gap-3 mb-6 animate-float-in" style={{ animationDelay: '80ms' }}>
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索博闻题名、内容..."
            className="input-field pl-11"
          />
        </div>
        <button
          onClick={handleAIDiscover}
          disabled={aiDiscovering || entries.length < 2}
          className="btn-primary !bg-gradient-to-r !from-cinnabar !to-ink disabled:opacity-50"
        >
          {aiDiscovering ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          AI 提取
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-2 animate-float-in" style={{ animationDelay: '160ms' }}>
        <button
          onClick={() => setCategoryFilter('all')}
          className={`px-4 py-1.5 rounded-full text-sm font-serif font-medium border transition-all duration-300 ${
            categoryFilter === 'all'
              ? 'bg-ochre-bg border-ochre/40 text-ochre shadow-[0_0_8px_rgba(196,163,90,0.15)]'
              : 'border-ochre/20 text-ink-secondary hover:border-ochre/30 hover:bg-ochre/5'
          }`}
        >
          全部 ({entries.length})
        </button>
        {categoryCounts.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategoryFilter(cat.value)}
            className={`px-4 py-1.5 rounded-full text-sm font-serif font-medium border transition-all duration-300 ${
              categoryFilter === cat.value
                ? 'bg-ochre-bg border-ochre/40 text-ochre shadow-[0_0_8px_rgba(196,163,90,0.15)]'
                : 'border-ochre/20 text-ink-secondary hover:border-ochre/30 hover:bg-ochre/5'
            }`}
          >
            {cat.label} ({cat.count})
          </button>
        ))}
      </div>

      {/* Ink divider below filters */}
      <div className="ink-divider mb-6" />

      {/* Graph View */}
      {viewMode === 'graph' && (
        <div className="space-y-4 animate-float-in" style={{ animationDelay: '240ms' }}>
          {/* AI Connections */}
          {aiConnections && aiConnections.length > 0 && (
            <div className="liquid-glass p-5 border-cinnabar/20">
              <h4 className="text-xs font-serif font-semibold text-cinnabar mb-3 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                智囊发现的潜在关联
              </h4>
              <div className="space-y-2.5">
                {aiConnections.map((conn, i) => (
                  <div key={i} className="flex items-start gap-2 font-serif text-xs">
                    <span className="px-2.5 py-0.5 bg-cinnabar/5 text-cinnabar rounded-full font-medium whitespace-nowrap border border-cinnabar/15">{conn.from}</span>
                    <span className="text-ink-light mt-0.5">→</span>
                    <span className="px-2.5 py-0.5 bg-cinnabar/5 text-cinnabar rounded-full font-medium whitespace-nowrap border border-cinnabar/15">{conn.to}</span>
                    <span className="text-ink-muted leading-relaxed">{conn.reason}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Force Graph */}
          {entries.length > 0 ? (
            <KnowledgeGraph entries={filteredEntries} categories={categories} onNodeClick={(entry) => setViewingEntry(entry)} />
          ) : (
            <div className="liquid-glass p-12 text-center">
              <Network className="w-12 h-12 text-ink-light mx-auto mb-4" />
              <h3 className="font-display text-xl text-ink mb-2">尚无博闻记录</h3>
              <p className="font-serif text-ink-muted text-sm">记录博闻后，星图将自动生成</p>
            </div>
          )}
        </div>
      )}

      {/* List View */}
      {viewMode === 'list' && (
        <>
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-8 h-8 border-2 border-ochre border-t-transparent rounded-full mx-auto" />
              <p className="font-serif text-ink-muted text-sm mt-4">博闻载入中...</p>
            </div>
          ) : filteredEntries.length === 0 ? (
            <div className="liquid-glass p-12 text-center animate-float-in">
              <Lightbulb className="w-12 h-12 text-ink-light mx-auto mb-4" />
              <h3 className="font-display text-xl text-ink mb-2">{searchQuery ? '未寻得匹配之博闻' : '尚无博闻记录'}</h3>
              <p className="font-serif text-ink-muted/50 text-sm italic mb-6">
                {searchQuery ? '' : '知之为知之，不知为不知，是知也'}
              </p>
              {!searchQuery && (
                <button onClick={() => { resetForm(); setShowAddModal(true) }} className="btn-primary">
                  <Plus className="w-4 h-4" />
                  记录第一条博闻
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredEntries.map((entry, i) => {
                const category = categories.find(c => c.value === entry.category)
                const borderClass = CATEGORY_BORDER_MAP[entry.category] || 'border-l-gray-400'
                return (
                  <div
                    key={entry.id}
                    className={`liquid-glass liquid-glass-hover p-6 cursor-pointer animate-float-in border-l-[3px] ${borderClass}`}
                    style={{ animationDelay: `${Math.min(i * 60, 400)}ms` }}
                    onClick={() => setViewingEntry(entry)}
                  >
                    {/* Top row: category + actions */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${category?.dotColor || 'bg-gray-400'}`} />
                        <span className={`px-3 py-1 rounded-full text-xs font-serif font-medium border ${
                          category?.value === 'methodology' ? 'bg-indigo/10 text-indigo border-indigo/20' :
                          category?.value === 'theory' ? 'bg-purple-50 text-purple-600 border-purple-200' :
                          category?.value === 'experiment' ? 'bg-green-50 text-green-600 border-green-200' :
                          category?.value === 'finding' ? 'bg-ochre-bg text-ochre border-ochre/20' :
                          category?.value === 'insight' ? 'bg-cinnabar-bg text-cinnabar border-cinnabar/20' :
                          'bg-gray-100 text-gray-600 border-gray-200'
                        }`}>
                          {category?.label || '通识'}
                        </span>
                      </div>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <button onClick={e => { e.stopPropagation(); openEditModal(entry) }} className="p-1.5 hover:bg-ochre/5 rounded-xl transition-all duration-200">
                          <Edit3 className="w-3.5 h-3.5 text-ink-muted hover:text-ink transition-colors" />
                        </button>
                        <button onClick={e => { e.stopPropagation(); handleDelete(entry.id) }} className="p-1.5 hover:bg-cinnabar-bg rounded-xl transition-all duration-200">
                          <Trash2 className="w-3.5 h-3.5 text-cinnabar/60 hover:text-cinnabar transition-colors" />
                        </button>
                      </div>
                    </div>

                    {/* Title */}
                    <h3 className="font-serif font-semibold text-ink text-base mb-2 leading-snug">{entry.title}</h3>

                    {/* Content preview */}
                    <p className="font-serif text-sm text-ink-muted line-clamp-3 mb-3 leading-relaxed">{entry.content}</p>

                    {/* Tags as traditional seal pills */}
                    {entry.tags && (
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {entry.tags.split(',').map((tag, i) => (
                          <span key={i} className="px-2.5 py-0.5 text-[11px] font-serif rounded-full border border-ochre/25 text-ink-secondary bg-ochre/5">
                            {tag.trim()}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Bottom meta */}
                    <div className="flex items-center gap-3 text-xs font-serif text-ink-light pt-3 ink-divider">
                      {entry.sourcePaperTitle && (
                        <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />出自典籍</span>
                      )}
                      {entry.tags && (
                        <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{entry.tags.split(',').length} 标签</span>
                      )}
                      <span className="ml-auto">{new Date(entry.updatedAt).toLocaleDateString('zh-CN')}</span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm() }} title={editingEntry ? '修订博闻' : '记录博闻'}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-serif font-medium text-ink-secondary mb-1.5">题名 *</label>
            <input type="text" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} required className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-serif font-medium text-ink-secondary mb-1.5">归类</label>
            <select value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="input-field">
              {categories.map(cat => (<option key={cat.value} value={cat.value}>{cat.label}</option>))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-serif font-medium text-ink-secondary mb-1.5">内容 *</label>
            <textarea value={formData.content} onChange={e => setFormData({ ...formData, content: e.target.value })} required rows={6} className="input-field !rounded-2xl resize-none" />
          </div>
          <div>
            <label className="block text-sm font-serif font-medium text-ink-secondary mb-1.5">标签</label>
            <input type="text" value={formData.tags} onChange={e => setFormData({ ...formData, tags: e.target.value })} placeholder="用逗号分隔" className="input-field" />
          </div>
          <div>
            <label className="block text-sm font-serif font-medium text-ink-secondary mb-1.5">出处典籍</label>
            <select value={formData.sourcePaperId} onChange={e => setFormData({ ...formData, sourcePaperId: e.target.value })} className="input-field">
              <option value="">无</option>
              {papers.map(paper => (<option key={paper.id} value={paper.id}>{paper.title}</option>))}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button type="submit" className="flex-1">{editingEntry ? '保存修订' : '记录博闻'}</Button>
            <button
              type="button"
              onClick={async () => {
                if (!formData.content) return
                try {
                  const result = await callAI(`请为以下内容生成一段简洁的学术摘要（50字以内）：\n\n${formData.content}`, {
                    systemPrompt: '你是一个学术摘要生成助手，擅长提炼核心观点。',
                    temperature: 0.5,
                    maxTokens: 200,
                  })
                  setFormData({ ...formData, content: formData.content + '\n\n【智囊摘要】' + result })
                } catch {
                  toastError('摘要生成未果')
                }
              }}
              className="liquid-glass px-4 py-2.5 font-serif text-sm text-ink flex items-center gap-2 hover:border-cinnabar/40 transition-all duration-300"
            >
              <Sparkles className="w-4 h-4 text-cinnabar animate-pulse" />
              <span>智囊摘要</span>
            </button>
            <Button type="button" variant="secondary" onClick={() => { setShowAddModal(false); resetForm() }}>作罢</Button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal isOpen={!!viewingEntry} onClose={() => setViewingEntry(null)} title={viewingEntry?.title || ''}>
        {viewingEntry && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              {(() => {
                const category = categories.find(c => c.value === viewingEntry.category)
                return category ? <span className={`px-2.5 py-0.5 rounded-full text-xs font-serif font-medium ${category.color}`}>{category.label}</span> : null
              })()}
              <span className="text-xs font-serif text-ink-muted">{new Date(viewingEntry.updatedAt).toLocaleDateString('zh-CN')}</span>
            </div>
            <div className="font-serif text-sm text-ink leading-relaxed whitespace-pre-wrap">{viewingEntry.content}</div>
            {viewingEntry.tags && (
              <div className="flex flex-wrap gap-1.5">
                {viewingEntry.tags.split(',').map((tag, i) => (
                  <span key={i} className="px-2.5 py-0.5 bg-ochre/5 text-ink-muted text-xs font-serif rounded-full border border-ochre/10">{tag.trim()}</span>
                ))}
              </div>
            )}
            {viewingEntry.sourcePaperTitle && (
              <div className="flex items-center gap-2 text-sm font-serif text-ochre pt-3 ink-divider">
                <BookOpen className="w-4 h-4" />
                来源：{viewingEntry.sourcePaperTitle}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  )
}
