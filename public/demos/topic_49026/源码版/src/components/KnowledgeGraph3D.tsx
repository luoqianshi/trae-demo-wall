import { useEffect, useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { OrbitControls, Text, Line } from '@react-three/drei'
import { useDataStore } from '../stores/useDataStore'
import { KnowledgeGraph } from './KnowledgeGraph'
import * as THREE from 'three'

function useWebGLAvailable(): boolean {
  const [available, setAvailable] = useState(true)
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      setAvailable(!!gl)
    } catch {
      setAvailable(false)
    }
  }, [])
  return available
}

function Node({ position, label, color, onClick }: { position: [number, number, number]; label: string; color: string; onClick: () => void }) {
  return (
    <mesh position={position} onClick={onClick}>
      <sphereGeometry args={[0.35, 16, 16]} />
      <meshStandardMaterial color={color} />
      <Text position={[0, 0.55, 0]} fontSize={0.2} color="#1f2937" anchorX="center">
        {label}
      </Text>
    </mesh>
  )
}

export function KnowledgeGraph3D({ onClose }: { onClose: () => void }) {
  const webglAvailable = useWebGLAvailable()
  const persons = useDataStore((s) => s.persons)
  const memories = useDataStore((s) => s.memories)
  const [selected, setSelected] = useState<string | null>(null)

  if (!webglAvailable) {
    return (
      <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
        <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-ink-muted/20">
          <h2 className="text-sm font-medium text-ink-primary">关系宇宙</h2>
          <button onClick={onClose} className="text-xs px-3 py-1 rounded-lg bg-zen-slate/10 hover:bg-zen-slate/20">关闭</button>
        </div>
        <div className="flex-1 p-6 overflow-auto">
          <div className="mb-4 p-3 rounded-lg bg-zen-amber/10 border border-zen-amber/20 text-xs text-ink-secondary">
            当前浏览器或环境不支持 3D 渲染，已自动切换为 2D 关系图谱。
          </div>
          <KnowledgeGraph persons={persons} />
        </div>
      </div>
    )
  }

  const { nodes, links } = useMemo(() => {
    const personNodes = persons.map((p, i) => ({
      id: p.id,
      label: p.name,
      position: [Math.cos((i / Math.max(1, persons.length)) * Math.PI * 2) * 3, 0, Math.sin((i / Math.max(1, persons.length)) * Math.PI * 2) * 3] as [number, number, number],
      color: '#0f766e',
    }))
    const memoryNodes = memories.slice(0, 20).map((m) => ({
      id: m.id,
      label: m.content.slice(0, 6),
      position: [(Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, (Math.random() - 0.5) * 6] as [number, number, number],
      color: '#d97706',
    }))
    const allNodes = [...personNodes, ...memoryNodes]
    const linkList: Array<{ from: [number, number, number]; to: [number, number, number] }> = []

    // FIX: 使用真实 Person.connections 数据替代随机连边
    const nodeMap = new Map(personNodes.map(n => [n.id, n]))
    persons.forEach((p) => {
      if (p.connections) {
        p.connections.forEach((conn) => {
          const target = nodeMap.get(conn.targetPersonId)
          const source = nodeMap.get(p.id)
          if (target && source && conn.strength >= 30) {
            linkList.push({ from: source.position, to: target.position })
          }
        })
      }
    })

    // 记忆节点关联到人物（基于 relatedPersonIds）
    memoryNodes.forEach((mem) => {
      const memData = memories.find(m => m.id === mem.id)
      if (memData?.relatedPersonIds) {
        memData.relatedPersonIds.forEach(pid => {
          const target = nodeMap.get(pid)
          if (target) linkList.push({ from: mem.position, to: target.position })
        })
      }
    })

    return { nodes: allNodes, links: linkList }
  }, [persons, memories])

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex flex-col">
      <div className="flex items-center justify-between px-6 py-3 bg-surface border-b border-ink-muted/20">
        <h2 className="text-sm font-medium text-ink-primary">关系宇宙 3D</h2>
        <button onClick={onClose} className="text-xs px-3 py-1 rounded-lg bg-zen-slate/10 hover:bg-zen-slate/20">关闭</button>
      </div>
      <div className="flex-1 relative">
        <Canvas camera={{ position: [0, 0, 8] }}>
          <ambientLight intensity={1.2} />
          <pointLight position={[10, 10, 10]} />
          {nodes.map((n) => (
            <Node
              key={n.id}
              position={n.position}
              label={n.label}
              color={selected === n.id ? '#dc2626' : n.color}
              onClick={() => setSelected(n.id)}
            />
          ))}
          {links.map((l, i) => (
            <Line key={i} points={[new THREE.Vector3(...l.from), new THREE.Vector3(...l.to)]} color="#94a3b8" lineWidth={1} />
          ))}
          <OrbitControls />
        </Canvas>
      </div>
    </div>
  )
}
