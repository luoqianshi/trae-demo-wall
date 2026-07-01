/**
 * GraphRAG — 知识图谱增强检索
 *
 * 企业级技术降维：Microsoft GraphRAG (2024) → 个人关系网络推理
 *
 * 核心思路：
 * - 传统 RAG 只做向量相似度检索，无法发现"间接关联"
 * - GraphRAG 在向量检索基础上增加图谱遍历，发现多跳关系链
 * - 例如：用户问"谁帮我介绍投资人" → 图谱遍历 "陈志远→张伟华→沈一鸣(投资人)"
 *
 * 实现：
 * 1. 从 Person.connections + 同公司/同标签构建邻接表
 * 2. BFS 遍历发现 N 跳内的间接关联人物
 * 3. 将间接关联人物的记忆补充到检索结果中
 * 4. 在 sources 中标注"通过关系链发现"
 */

import { db } from './db'
import type { Person, Memory, PersonConnection } from '../types'

// ─── 类型定义 ───────────────────────────────────────────────

export interface GraphNode {
  personId: string
  personName: string
  sentiment: number
  relationship: Person['relationship']
}

export interface GraphEdge {
  source: string
  target: string
  relationType: PersonConnection['relationType']
  strength: number
  description: string
}

export interface GraphPath {
  nodes: GraphNode[]
  edges: GraphEdge[]
  totalStrength: number
  hops: number
  description: string
}

export interface GraphRAGResult {
  /** 通过图谱遍历发现的间接关联人物 */
  indirectPeople: Person[]
  /** 关系链路径（用于 UI 展示） */
  paths: GraphPath[]
  /** 通过间接关联发现的额外记忆 */
  indirectMemories: Memory[]
  /** 图谱遍历摘要（注入到 RAG context） */
  graphContext: string
  /** 检索方法标注 */
  method: 'graph_1hop' | 'graph_2hop' | 'graph_3hop'
}

// ─── 邻接表构建（带缓存） ─────────────────────────────────────

interface AdjacencyEntry {
  targetId: string
  relationType: PersonConnection['relationType']
  strength: number
  description: string
}

// 缓存：避免每次查询都重新构建邻接表
let _adjacencyCache: Map<string, AdjacencyEntry[]> | null = null
let _adjacencyCacheTime = 0
const ADJACENCY_CACHE_TTL = 60_000 // 60秒缓存

/**
 * 构建人物关系图谱邻接表
 * 数据来源：Person.connections + 同公司自动连边 + 同标签自动连边
 */
export async function buildAdjacencyList(): Promise<Map<string, AdjacencyEntry[]>> {
  // 检查缓存
  if (_adjacencyCache && Date.now() - _adjacencyCacheTime < ADJACENCY_CACHE_TTL) {
    return _adjacencyCache
  }

  const allPeople = await db.persons.toArray()
  const adjacency = new Map<string, AdjacencyEntry[]>()
  // FIX: 用复合 key (fromId-toId-relationType) 去重，允许同节点对不同关系类型的多线关系
  const edgeSet = new Set<string>()

  // 初始化邻接表
  for (const person of allPeople) {
    adjacency.set(person.id, [])
  }

  // 辅助函数：添加边（同节点对+同关系类型才去重，不同关系类型允许多条）
  const addEdge = (fromId: string, toId: string, entry: AdjacencyEntry) => {
    const compositeKey = `${fromId}-${toId}-${entry.relationType}`
    if (!edgeSet.has(compositeKey)) {
      edgeSet.add(compositeKey)
      adjacency.get(fromId)!.push(entry)
    }
  }

  // 1. 从 Person.connections 加载显式关系
  for (const person of allPeople) {
    if (person.connections && person.connections.length > 0) {
      for (const conn of person.connections) {
        // 跳过目标人物不存在的连接（引用了已删除的人物）
        if (!adjacency.has(conn.targetPersonId)) continue
        addEdge(person.id, conn.targetPersonId, {
          targetId: conn.targetPersonId,
          relationType: conn.relationType,
          strength: conn.strength,
          description: conn.description,
        })
        // 无向图：反向边
        addEdge(conn.targetPersonId, person.id, {
          targetId: person.id,
          relationType: conn.relationType,
          strength: conn.strength,
          description: conn.description,
        })
      }
    }
  }

  // 2. 同公司自动连边（同事关系）
  const companyGroups = new Map<string, Person[]>()
  for (const person of allPeople) {
    const company = person.profile?.career?.company || person.company || ''
    if (company && company !== '未填写') {
      if (!companyGroups.has(company)) {
        companyGroups.set(company, [])
      }
      companyGroups.get(company)!.push(person)
    }
  }

  for (const [, group] of companyGroups) {
    // 限制同公司连边数量：如果公司人数超过 15 人，只连接相同部门的人
    const shouldConnectAll = group.length <= 15
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]
        const b = group[j]
        const isSameDept = (a.tags?.some(t => b.tags?.includes(t))) || false
        if (!shouldConnectAll && !isSameDept) continue // 大公司只连同部门

        const strength = isSameDept ? 60 : 40
        addEdge(a.id, b.id, {
          targetId: b.id,
          relationType: 'colleague',
          strength,
          description: `同公司${isSameDept ? '·同部门' : ''}`,
        })
        addEdge(b.id, a.id, {
          targetId: a.id,
          relationType: 'colleague',
          strength,
          description: `同公司${isSameDept ? '·同部门' : ''}`,
        })
      }
    }
  }

  // 3. 同标签自动连边（弱关联）
  const tagGroups = new Map<string, Person[]>()
  for (const person of allPeople) {
    for (const tag of person.tags || []) {
      if (!tagGroups.has(tag)) {
        tagGroups.set(tag, [])
      }
      tagGroups.get(tag)!.push(person)
    }
  }

  for (const [, group] of tagGroups) {
    if (group.length < 2 || group.length > 8) continue // 跳过过大或过小的组
    for (let i = 0; i < group.length; i++) {
      for (let j = i + 1; j < group.length; j++) {
        const a = group[i]
        const b = group[j]
        addEdge(a.id, b.id, {
          targetId: b.id,
          relationType: 'other',
          strength: 25,
          description: `共同标签`,
        })
        addEdge(b.id, a.id, {
          targetId: a.id,
          relationType: 'other',
          strength: 25,
          description: `共同标签`,
        })
      }
    }
  }

  // 写入缓存
  _adjacencyCache = adjacency
  _adjacencyCacheTime = Date.now()

  return adjacency
}

/**
 * 清除邻接表缓存（在人物数据变更时调用）
 */
export function clearAdjacencyCache() {
  _adjacencyCache = null
  _adjacencyCacheTime = 0
}

// ─── BFS 多跳遍历 ───────────────────────────────────────────

/**
 * BFS 遍历发现从起始人物出发的 N 跳内关系链
 *
 * @param startPersonIds 起始人物 ID 列表
 * @param maxHops 最大跳数（默认 2 跳）
 * @param adjacency 邻接表
 * @returns 关系链路径列表
 */
export function bfsGraphTraversal(
  startPersonIds: string[],
  maxHops: number,
  adjacency: Map<string, AdjacencyEntry[]>,
  allPeople: Person[],
): GraphPath[] {
  const paths: GraphPath[] = []
  const personMap = new Map(allPeople.map(p => [p.id, p]))

  for (const startId of startPersonIds) {
    const startPerson = personMap.get(startId)
    if (!startPerson) continue

    // BFS
    const visited = new Set<string>([startId])
    const queue: { currentId: string; path: { nodeIds: string[]; edges: AdjacencyEntry[] } }[] = [
      { currentId: startId, path: { nodeIds: [startId], edges: [] } },
    ]

    while (queue.length > 0) {
      const { currentId, path } = queue.shift()!

      if (path.edges.length >= maxHops) continue

      const neighbors = adjacency.get(currentId) || []
      // 按强度排序，优先遍历强关系
      neighbors.sort((a, b) => b.strength - a.strength)

      for (const edge of neighbors) {
        if (visited.has(edge.targetId) && path.nodeIds.includes(edge.targetId)) continue

        const newPath = {
          nodeIds: [...path.nodeIds, edge.targetId],
          edges: [...path.edges, edge],
        }

        // 记录路径（仅 2 跳以上的路径，1 跳是直接关系不需要图谱发现）
        if (newPath.edges.length >= 2) {
          const pathNodes: GraphNode[] = []
          for (const id of newPath.nodeIds) {
            const p = personMap.get(id)
            if (!p) {
              // 跳过不存在的人物节点（connections 引用了已删除的人物）
              break
            }
            pathNodes.push({
              personId: id,
              personName: p.name,
              sentiment: p.sentiment,
              relationship: p.relationship,
            })
          }
          // 如果有节点缺失，跳过这条路径
          if (pathNodes.length !== newPath.nodeIds.length) continue

          const pathEdges: GraphEdge[] = newPath.edges.map((e, idx) => ({
            source: newPath.nodeIds[idx],
            target: e.targetId,
            relationType: e.relationType,
            strength: e.strength,
            description: e.description,
          }))

          const totalStrength = newPath.edges.reduce((sum, e) => sum + e.strength, 0) / newPath.edges.length
          const hops = newPath.edges.length

          paths.push({
            nodes: pathNodes,
            edges: pathEdges,
            totalStrength,
            hops,
            description: buildPathDescription(pathNodes, pathEdges),
          })
        }

        // 继续遍历（限制访问避免指数爆炸）
        if (newPath.edges.length < maxHops && !visited.has(edge.targetId)) {
          visited.add(edge.targetId)
          queue.push({ currentId: edge.targetId, path: newPath })
        }
      }
    }
  }

  // 去重 + 按强度排序
  const seen = new Set<string>()
  const uniquePaths = paths.filter(p => {
    const key = p.nodes.map(n => n.personId).join('→')
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })

  uniquePaths.sort((a, b) => b.totalStrength - a.totalStrength)
  return uniquePaths.slice(0, 10) // 最多返回 10 条路径
}

function buildPathDescription(nodes: GraphNode[], edges: GraphEdge[]): string {
  const parts: string[] = []
  for (let i = 0; i < nodes.length; i++) {
    parts.push(nodes[i].personName)
    if (i < edges.length) {
      const relMap: Record<string, string> = {
        family: '家人',
        colleague: '同事',
        friend: '朋友',
        partner: '合作伙伴',
        rival: '竞争对手',
        introduced_by: '介绍认识',
        other: '关联',
      }
      parts.push(`—${relMap[edges[i].relationType] || '关联'}→`)
    }
  }
  return parts.join(' ')
}

// ─── GraphRAG 主入口 ────────────────────────────────────────

/**
 * GraphRAG 检索增强
 * 在传统 RAG 检索结果基础上，通过图谱遍历发现间接关联
 *
 * @param query 用户查询
 * @param detectedPersons RAG 已检测到的人物
 * @param existingMemories RAG 已检索到的记忆
 * @returns 图谱增强结果
 */
export async function graphRAGEnhance(
  query: string,
  detectedPersons: Person[],
  existingMemories: Memory[],
): Promise<GraphRAGResult | null> {
  if (detectedPersons.length === 0) return null

  const allPeople = await db.persons.toArray()
  const adjacency = await buildAdjacencyList()

  // 从检测到的人物出发，最多遍历 3 跳
  const startIds = detectedPersons.map(p => p.id)
  const paths = bfsGraphTraversal(startIds, 3, adjacency, allPeople)

  if (paths.length === 0) return null

  // 收集通过图谱发现的间接关联人物
  const existingPersonIds = new Set(detectedPersons.map(p => p.id))
  const indirectPersonIds = new Set<string>()

  for (const path of paths) {
    for (const node of path.nodes) {
      if (!existingPersonIds.has(node.personId) && !indirectPersonIds.has(node.personId)) {
        indirectPersonIds.add(node.personId)
      }
    }
  }

  const indirectPeople = allPeople.filter(p => indirectPersonIds.has(p.id))

  // 检索间接关联人物的记忆
  const existingMemoryIds = new Set(existingMemories.map(m => m.id))
  const allMemories = await db.memories.toArray()
  const indirectMemories = allMemories.filter(m => {
    if (existingMemoryIds.has(m.id)) return false
    const relatedIds = m.relatedPersonIds || []
    return relatedIds.some(id => indirectPersonIds.has(id))
  }).slice(0, 5) // 最多补充 5 条间接记忆

  // 构建图谱上下文摘要
  const graphContext = buildGraphContext(detectedPersons, paths, indirectPeople)

  // 确定检索方法标注
  const maxHops = Math.max(...paths.map(p => p.hops), 0)
  const method: GraphRAGResult['method'] = maxHops >= 3 ? 'graph_3hop' : maxHops >= 2 ? 'graph_2hop' : 'graph_1hop'

  return {
    indirectPeople,
    paths,
    indirectMemories,
    graphContext,
    method,
  }
}

function buildGraphContext(
  directPeople: Person[],
  paths: GraphPath[],
  indirectPeople: Person[],
): string {
  const parts: string[] = []

  parts.push('【GraphRAG 关系链发现】')

  if (paths.length > 0) {
    parts.push('通过知识图谱遍历发现以下间接关联：')
    for (const path of paths.slice(0, 5)) {
      parts.push(`- ${path.description}（${path.hops}跳，关联强度${Math.round(path.totalStrength)}）`)
    }
  }

  if (indirectPeople.length > 0) {
    parts.push(`间接关联人物：${indirectPeople.map(p => `${p.name}(${p.relationship})`).join('、')}`)
  }

  return parts.join('\n')
}

// ─── 查询意图识别 ───────────────────────────────────────────

/**
 * 识别查询是否适合触发 GraphRAG
 * 以下场景触发：
 * - "谁帮我介绍..." / "谁能帮我..." → 寻找中间人
 * - "XX和YY什么关系" → 关系链查询
 * - "XX的朋友/同事/同学" → 社交圈探索
 * - "通过XX认识" → 介绍链追溯
 */
export function shouldTriggerGraphRAG(query: string): boolean {
  const patterns = [
    /谁.*介绍/,
    /谁.*帮忙/,
    /谁.*认识/,
    /谁.*能/,
    /通过.*认识/,
    /什么关系/,
    /怎么.*认识/,
    /关系链/,
    /人脉/,
    /介绍.*给/,
    /帮我.*找/,
    /能不能.*介绍/,
  ]
  return patterns.some(p => p.test(query))
}

/**
 * 识别"关系链查询"意图：查询中提及两个人物，想了解他们之间的关系
 */
export function isRelationshipChainQuery(query: string, detectedPersons: Person[]): boolean {
  return detectedPersons.length >= 2 && /什么关系|怎么认识|关系|认识/.test(query)
}
