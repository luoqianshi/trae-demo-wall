import { useAppStore } from "@/stores/useAppStore"
import { getTriggerDisplay, getActionDisplay, getConditionDisplay } from "@/engine/displayHelper"
import { ReactFlow, Background, Controls, type Edge, type Node } from "@xyflow/react"
import "@xyflow/react/dist/style.css"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Zap, AlignCenter } from "lucide-react"
import { useEffect, useState } from "react"
import { nodeTypes } from "./CustomNodes"
import dagre from "@dagrejs/dagre"

const LEGEND_ITEMS = [
  { color: "#E6F3FF", label: "触发条件" },
  { color: "#FFF9D9", label: "生效限制" },
  { color: "#E6FBF3", label: "等待延时" },
  { color: "#E7F9E9", label: "设备动作" },
]

const NODE_WIDTH = 224
const NODE_HEIGHT = 80
const CONDITION_HEIGHT = 56
const ROW_GAP = 120
const COL_GAP = 40
const MAX_COLS = 7

function applyDagreLayout(nodes: Node[], edges: Edge[]): Node[] {
  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))
  dagreGraph.setGraph({
    rankdir: "TB",
    nodesep: 80,
    ranksep: 120,
  })

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: NODE_WIDTH, height: node.type === "condition" ? CONDITION_HEIGHT : NODE_HEIGHT })
  })

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  dagre.layout(dagreGraph)

  return nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    return {
      ...node,
      position: {
        x: nodeWithPosition.x - NODE_WIDTH / 2,
        y: nodeWithPosition.y - (node.type === "condition" ? CONDITION_HEIGHT / 2 : NODE_HEIGHT / 2),
      },
    }
  })
}

interface LayoutResult {
  nodes: Node[]
  edges: Edge[]
}

function applyRadialLayout(nodes: Node[], edges: Edge[]): LayoutResult {
  const triggerNodes = nodes.filter((n) => n.type === "trigger")
  const conditionNodes = nodes.filter((n) => n.type === "condition")
  const actionNodes = nodes.filter((n) => n.type === "action" || n.type === "delay")

  const newNodes: Node[] = []
  const newEdges: Edge[] = []

  const centerX = 400
  let currentY = 50

  triggerNodes.forEach((node) => {
    newNodes.push({
      ...node,
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    })
  })
  currentY += NODE_HEIGHT + 40

  conditionNodes.forEach((node) => {
    newNodes.push({
      ...node,
      position: { x: centerX - NODE_WIDTH / 2, y: currentY },
    })
  })
  if (conditionNodes.length > 0) {
    currentY += CONDITION_HEIGHT + 40
  }

  const rows: Node[][] = []
  let currentRow: Node[] = []
  actionNodes.forEach((node) => {
    if (currentRow.length >= MAX_COLS) {
      rows.push(currentRow)
      currentRow = []
    }
    currentRow.push(node)
  })
  if (currentRow.length > 0) {
    rows.push(currentRow)
  }

  rows.forEach((row, rowIndex) => {
    const rowWidth = row.length * NODE_WIDTH + (row.length - 1) * COL_GAP
    const rowStartX = centerX - rowWidth / 2

    row.forEach((node, colIndex) => {
      newNodes.push({
        ...node,
        position: {
          x: rowStartX + colIndex * (NODE_WIDTH + COL_GAP),
          y: currentY,
        },
      })
    })

    if (rowIndex === 0) {
      const sourceNode = conditionNodes.length > 0 ? conditionNodes[0] : triggerNodes[0]
      if (sourceNode) {
        row.forEach((targetNode) => {
          newEdges.push({
            id: `${sourceNode.id}-${targetNode.id}`,
            source: sourceNode.id,
            target: targetNode.id,
            animated: false,
            type: "smoothstep",
            style: { stroke: "#374151", strokeWidth: 2 },
          })
        })
      }
    }

    if (rowIndex > 0) {
      const prevLastNode = rows[rowIndex - 1][rows[rowIndex - 1].length - 1]
      const currFirstNode = row[0]
      newEdges.push({
        id: `${prevLastNode.id}-${currFirstNode.id}`,
        source: prevLastNode.id,
        target: currFirstNode.id,
        animated: false,
        type: "smoothstep",
        style: { stroke: "#374151", strokeWidth: 2 },
      })
    }

    currentY += NODE_HEIGHT + ROW_GAP
  })

  return { nodes: newNodes, edges: [...edges.filter((e) => e.source.startsWith("trigger") && e.target.startsWith("condition")), ...newEdges] }
}

function isManualMultiAction(ruleObj: Record<string, unknown>): boolean {
  const triggers = (ruleObj.triggers as unknown[]) || []
  const actions = (ruleObj.actions as unknown[]) || []
  if (triggers.length === 0 || actions.length < 2) return false
  const firstTrigger = triggers[0] as Record<string, unknown>
  return String(firstTrigger.type) === "manual"
}

export function RuleFlowCanvas() {
  const { generatedRule } = useAppStore()
  const [nodes, setNodes] = useState<Node[]>([])
  const [edges, setEdges] = useState<Edge[]>([])
  const [isRadial, setIsRadial] = useState(false)

  useEffect(() => {
    if (!generatedRule) {
      setNodes([])
      setEdges([])
      setIsRadial(false)
      return
    }

    const ruleObj = generatedRule as Record<string, unknown>
    const triggers = (ruleObj.triggers as unknown[]) || []
    const conditions = (ruleObj.conditions as unknown[]) || []
    const actions = (ruleObj.actions as unknown[]) || []

    const newNodes: Node[] = []
    const newEdges: Edge[] = []

    triggers.forEach((t, index) => {
      const trigger = t as Record<string, unknown>
      const display = getTriggerDisplay(trigger)
      newNodes.push({
        id: `trigger-${index}`,
        type: "trigger",
        position: { x: 0, y: 0 },
        data: display,
      })
    })

    conditions.forEach((c, index) => {
      const condition = c as Record<string, unknown>
      const display = getConditionDisplay(condition)
      newNodes.push({
        id: `condition-${index}`,
        type: "condition",
        position: { x: 0, y: 0 },
        data: display,
      })
    })

    actions.forEach((a, index) => {
      const action = a as Record<string, unknown>
      const display = getActionDisplay(action)
      const nodeType = String(action.type) === "delay" ? "delay" : "action"
      newNodes.push({
        id: `${nodeType}-${index}`,
        type: nodeType,
        position: { x: 0, y: 0 },
        data: { icon: display.icon, text: display.text },
      })
    })

    const triggerIds = triggers.map((_, i) => `trigger-${i}`)
    const conditionIds = conditions.map((_, i) => `condition-${i}`)
    const actionIds = actions.map((_, i) => {
      const action = actions[i] as Record<string, unknown>
      const nodeType = String(action.type) === "delay" ? "delay" : "action"
      return `${nodeType}-${i}`
    })

    const manualMultiAction = isManualMultiAction(ruleObj)
    setIsRadial(manualMultiAction)

    if (!manualMultiAction) {
      if (triggerIds.length > 0) {
        conditionIds.forEach((condId) => {
          triggerIds.forEach((triggerId) => {
            newEdges.push({
              id: `${triggerId}-${condId}`,
              source: triggerId,
              target: condId,
              animated: false,
              type: "smoothstep",
              style: { stroke: "#D1D5DB", strokeWidth: 1, strokeDasharray: "4 4" },
            })
          })
        })

        const lastConditionId = conditionIds.length > 0 ? conditionIds[conditionIds.length - 1] : triggerIds[triggerIds.length - 1]

        if (actionIds.length > 0) {
          actionIds.forEach((actionId, index) => {
            const sourceId = index === 0 ? lastConditionId : actionIds[index - 1]
            newEdges.push({
              id: `${sourceId}-${actionId}`,
              source: sourceId,
              target: actionId,
              animated: false,
              type: "smoothstep",
              style: { stroke: "#374151", strokeWidth: 2 },
            })
          })
        }
      }

      const laidOutNodes = applyDagreLayout(newNodes, newEdges)
      setNodes(laidOutNodes)
      setEdges(newEdges)
    } else {
      if (triggerIds.length > 0 && conditionIds.length > 0) {
        conditionIds.forEach((condId) => {
          triggerIds.forEach((triggerId) => {
            newEdges.push({
              id: `${triggerId}-${condId}`,
              source: triggerId,
              target: condId,
              animated: false,
              type: "smoothstep",
              style: { stroke: "#D1D5DB", strokeWidth: 1, strokeDasharray: "4 4" },
            })
          })
        })
      }

      const { nodes: laidOutNodes, edges: radialEdges } = applyRadialLayout(newNodes, newEdges)
      setNodes(laidOutNodes)
      setEdges(radialEdges)
    }
  }, [generatedRule])

  const handleAutoAlign = () => {
    if (isRadial) {
      const { nodes: laidOutNodes, edges: radialEdges } = applyRadialLayout(nodes, edges)
      setNodes(laidOutNodes)
      setEdges(radialEdges)
    } else {
      const laidOutNodes = applyDagreLayout(nodes, edges)
      setNodes(laidOutNodes)
    }
  }

  if (!generatedRule) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">🔄</span>
            场景逻辑流程
          </CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center justify-center py-20 text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted mb-4">
            <Zap className="h-8 w-8 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground">暂无规则，请先生成</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="flex items-center justify-between pb-2">
        <div className="flex items-center gap-2">
          <CardTitle className="text-base flex items-center gap-2">
            <span className="text-lg">🔄</span>
            场景逻辑流程
          </CardTitle>
          <span className="text-xs text-muted-foreground">{isRadial ? "并行执行" : "从上至下为场景执行顺序"}</span>
        </div>
        <Button variant="ghost" size="sm" onClick={handleAutoAlign} className="h-7 text-xs gap-1">
          <AlignCenter className="h-3 w-3" />
          一键对齐
        </Button>
      </CardHeader>
      <CardContent className="p-0 flex-1 relative">
        <div className="absolute top-2 left-2 z-10 flex flex-col gap-1 bg-white/95 backdrop-blur-sm px-2 py-1 rounded shadow-sm">
          {LEGEND_ITEMS.map((item) => (
            <div key={item.label} className="flex items-center gap-1">
              <div className="w-3 h-3 rounded-sm border border-gray-200" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
          ))}
          <div className="border-t border-gray-100 my-1" />
          <div className="flex items-center gap-1">
            <svg className="w-6 h-2" viewBox="0 0 24 8">
              <path d="M0 4 L20 4 M16 0 L20 4 L16 8" stroke="#D1D5DB" strokeWidth="1.5" fill="none" strokeDasharray="4 4" />
            </svg>
            <span className="text-[10px] text-gray-500">必须同时满足的附加条件</span>
          </div>
          <div className="flex items-center gap-1">
            <svg className="w-6 h-2" viewBox="0 0 24 8">
              <path d="M0 4 L20 4 M16 0 L20 4 L16 8" stroke="#374151" strokeWidth="2" fill="none" />
            </svg>
            <span className="text-[10px] text-gray-500">{isRadial ? "分叉执行（并行）" : "条件达成后执行步骤"}</span>
          </div>
        </div>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          fitView
          minZoom={0.5}
          maxZoom={2}
          defaultViewport={{ x: 0, y: 0, zoom: 1 }}
          style={{ width: "100%", height: "100%" }}
          snapGrid={[20, 20]}
        >
          <Background />
          <Controls />
        </ReactFlow>
      </CardContent>
    </Card>
  )
}