import { type Node, type NodePositionChange, type XYPosition } from '@xyflow/react'

export interface HelperLines {
  horizontal?: number
  vertical?: number
  snapPosition: Partial<XYPosition>
}

const DISTANCE = 5

/**
 * 计算节点拖拽时的对齐辅助线，并在接近时给出吸附位置。
 * 参考 React Flow 官方 helper-lines 示例实现。
 */
export function getHelperLines(
  change: NodePositionChange,
  nodes: Node[],
  distance = DISTANCE
): HelperLines {
  const nodeA = nodes.find((n) => n.id === change.id)
  if (!nodeA || !change.position) {
    return { snapPosition: { x: undefined, y: undefined } }
  }

  const nodeABounds = {
    left: change.position.x,
    right: change.position.x + (nodeA.measured?.width ?? 0),
    top: change.position.y,
    bottom: change.position.y + (nodeA.measured?.height ?? 0),
    width: nodeA.measured?.width ?? 0,
    height: nodeA.measured?.height ?? 0,
  }

  let horizontalDistance = distance
  let verticalDistance = distance

  const result: HelperLines = { snapPosition: { x: undefined, y: undefined } }

  for (const nodeB of nodes) {
    if (nodeB.id === nodeA.id) continue

    const nodeBBounds = {
      left: nodeB.position.x,
      right: nodeB.position.x + (nodeB.measured?.width ?? 0),
      top: nodeB.position.y,
      bottom: nodeB.position.y + (nodeB.measured?.height ?? 0),
      width: nodeB.measured?.width ?? 0,
      height: nodeB.measured?.height ?? 0,
    }

    // 左对齐
    const dLeftLeft = Math.abs(nodeABounds.left - nodeBBounds.left)
    if (dLeftLeft < verticalDistance) {
      result.snapPosition.x = nodeBBounds.left
      result.vertical = nodeBBounds.left
      verticalDistance = dLeftLeft
    }
    // 右对齐到左
    const dRightLeft = Math.abs(nodeABounds.right - nodeBBounds.left)
    if (dRightLeft < verticalDistance) {
      result.snapPosition.x = nodeBBounds.left - nodeABounds.width
      result.vertical = nodeBBounds.left
      verticalDistance = dRightLeft
    }
    // 右对齐
    const dRightRight = Math.abs(nodeABounds.right - nodeBBounds.right)
    if (dRightRight < verticalDistance) {
      result.snapPosition.x = nodeBBounds.right - nodeABounds.width
      result.vertical = nodeBBounds.right
      verticalDistance = dRightRight
    }
    // 左对齐到右
    const dLeftRight = Math.abs(nodeABounds.left - nodeBBounds.right)
    if (dLeftRight < verticalDistance) {
      result.snapPosition.x = nodeBBounds.right
      result.vertical = nodeBBounds.right
      verticalDistance = dLeftRight
    }
    // 水平中心
    const centerAX = nodeABounds.left + nodeABounds.width / 2
    const centerBX = nodeBBounds.left + nodeBBounds.width / 2
    const dCenterX = Math.abs(centerAX - centerBX)
    if (dCenterX < verticalDistance) {
      result.snapPosition.x = centerBX - nodeABounds.width / 2
      result.vertical = centerBX
      verticalDistance = dCenterX
    }

    // 顶对齐
    const dTopTop = Math.abs(nodeABounds.top - nodeBBounds.top)
    if (dTopTop < horizontalDistance) {
      result.snapPosition.y = nodeBBounds.top
      result.horizontal = nodeBBounds.top
      horizontalDistance = dTopTop
    }
    // 底对齐到顶
    const dBottomTop = Math.abs(nodeABounds.bottom - nodeBBounds.top)
    if (dBottomTop < horizontalDistance) {
      result.snapPosition.y = nodeBBounds.top - nodeABounds.height
      result.horizontal = nodeBBounds.top
      horizontalDistance = dBottomTop
    }
    // 底对齐
    const dBottomBottom = Math.abs(nodeABounds.bottom - nodeBBounds.bottom)
    if (dBottomBottom < horizontalDistance) {
      result.snapPosition.y = nodeBBounds.bottom - nodeABounds.height
      result.horizontal = nodeBBounds.bottom
      horizontalDistance = dBottomBottom
    }
    // 顶对齐到底
    const dTopBottom = Math.abs(nodeABounds.top - nodeBBounds.bottom)
    if (dTopBottom < horizontalDistance) {
      result.snapPosition.y = nodeBBounds.bottom
      result.horizontal = nodeBBounds.bottom
      horizontalDistance = dTopBottom
    }
    // 垂直中心
    const centerAY = nodeABounds.top + nodeABounds.height / 2
    const centerBY = nodeBBounds.top + nodeBBounds.height / 2
    const dCenterY = Math.abs(centerAY - centerBY)
    if (dCenterY < horizontalDistance) {
      result.snapPosition.y = centerBY - nodeABounds.height / 2
      result.horizontal = centerBY
      horizontalDistance = dCenterY
    }
  }

  return result
}
