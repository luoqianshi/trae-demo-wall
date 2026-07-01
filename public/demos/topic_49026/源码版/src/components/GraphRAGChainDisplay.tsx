/**
 * GraphRAG 关系链展示
 *
 * 企业级技术降维：Microsoft GraphRAG (2024) → 个人关系网络推理
 *
 * 在聊天界面中展示 GraphRAG 发现的间接关系链：
 * - 关系路径可视化（A → B → C）
 * - 跳数和强度标注
 * - 间接关联人物列表
 */

import { useState } from 'react'
import {
  Network, ChevronDown, ChevronUp, Users,
  ArrowRight, Link2, Sparkles,
} from 'lucide-react'
import type { GraphRAGResult, GraphPath } from '../lib/graphRAG'
import { warmthToColor, warmthLabel } from '../lib/warmthColor'

// ─── 关系链路径展示 ─────────────────────────────────────────
function PathDisplay({ path, index }: { path: GraphPath; index: number }) {
  return (
    <div
      className="bg-canvas-warm/50 rounded-lg p-2.5 border border-ink-muted/10"
      style={{
        animation: `graphrag-fadein 0.3s ease-out ${index * 80}ms both`,
      }}
    >
      {/* 路径节点链 */}
      <div className="flex items-center gap-1 flex-wrap mb-1.5">
        {path.nodes.map((node, i) => (
          <div key={i} className="flex items-center gap-1">
            {i > 0 && (
              <ArrowRight className="w-3 h-3 text-ink-muted flex-shrink-0" />
            )}
            <span
              className="text-xs font-medium px-1.5 py-0.5 rounded-md"
              style={{
                color: warmthToColor(node.sentiment),
                background: `${warmthToColor(node.sentiment)}15`,
              }}
            >
              {node.personName}
            </span>
          </div>
        ))}
      </div>

      {/* 路径描述 */}
      <p className="text-2xs text-ink-tertiary leading-relaxed mb-1">
        {path.description}
      </p>

      {/* 路径元数据 */}
      <div className="flex items-center gap-3 text-2xs text-ink-muted">
        <span className="flex items-center gap-0.5">
          <Link2 className="w-2.5 h-2.5" />
          {path.hops} 跳
        </span>
        <span className="flex items-center gap-0.5">
          <Sparkles className="w-2.5 h-2.5" />
          强度 {Math.round(path.totalStrength)}
        </span>
      </div>
    </div>
  )
}

// ─── 主组件 ─────────────────────────────────────────────────
interface GraphRAGChainDisplayProps {
  result: GraphRAGResult
}

export function GraphRAGChainDisplay({ result }: GraphRAGChainDisplayProps) {
  const [expanded, setExpanded] = useState(false)

  if (!result || (result.indirectPeople.length === 0 && result.paths.length === 0)) {
    return null
  }

  const hopLabel = result.method === 'graph_1hop' ? '1跳' : result.method === 'graph_2hop' ? '2跳' : '3跳'

  return (
    <div className="bg-zen-indigo/5 border border-zen-indigo/20 rounded-xl overflow-hidden">
      {/* === 头部 === */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between px-3 py-2 hover:bg-zen-indigo/5 transition-colors"
      >
        <div className="flex items-center gap-1.5">
          <Network className="w-3.5 h-3.5 text-zen-indigo" />
          <span className="text-2xs font-medium text-zen-indigo">
            GraphRAG 知识图谱发现
          </span>
          <span className="text-2xs text-ink-muted">
            · {hopLabel}遍历 · {result.paths.length}条关系链
          </span>
        </div>
        {expanded ? (
          <ChevronUp className="w-3 h-3 text-ink-muted" />
        ) : (
          <ChevronDown className="w-3 h-3 text-ink-muted" />
        )}
      </button>

      {/* === 内容 === */}
      {expanded && (
        <div className="px-3 pb-3 space-y-2">
          {/* 关系链路径 */}
          {result.paths.length > 0 && (
            <div className="space-y-1.5">
              <p className="text-2xs text-ink-tertiary font-medium">发现的关系链</p>
              {result.paths.slice(0, 5).map((path, idx) => (
                <PathDisplay key={idx} path={path} index={idx} />
              ))}
            </div>
          )}

          {/* 间接关联人物 */}
          {result.indirectPeople.length > 0 && (
            <div className="pt-2 border-t border-ink-muted/10">
              <p className="text-2xs text-ink-tertiary font-medium mb-1.5">
                间接关联人物（{result.indirectPeople.length}）
              </p>
              <div className="flex flex-wrap gap-1">
                {result.indirectPeople.slice(0, 8).map((person) => (
                  <span
                    key={person.id}
                    className="inline-flex items-center gap-1 text-2xs px-1.5 py-0.5 rounded-md bg-surface border border-ink-muted/10"
                  >
                    <Users className="w-2.5 h-2.5 text-ink-muted" />
                    <span style={{ color: warmthToColor(person.sentiment) }}>
                      {person.name}
                    </span>
                    <span className="text-ink-muted">
                      {warmthLabel(person.sentiment)}
                    </span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* 间接记忆 */}
          {result.indirectMemories.length > 0 && (
            <div className="pt-2 border-t border-ink-muted/10">
              <p className="text-2xs text-ink-tertiary">
                通过关系链发现 {result.indirectMemories.length} 条相关记忆
              </p>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes graphrag-fadein {
          0% { opacity: 0; transform: translateY(4px); }
          100% { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
