import type { NodeTemplate } from '../types'

export const useDragAndDrop = () => {
  const onDragStart = (event: React.DragEvent, node: NodeTemplate) => {
    if (event.dataTransfer) {
      event.dataTransfer.setData('application/reactflow', JSON.stringify(node))
      event.dataTransfer.effectAllowed = 'move'
    }
  }

  return {
    onDragStart,
  }
}
