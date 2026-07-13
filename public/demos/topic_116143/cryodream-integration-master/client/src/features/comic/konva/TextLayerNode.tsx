import { useRef, useEffect } from 'react'
import { Text } from 'react-konva'
import Konva from 'konva'
import type { TextLayer } from '../types'

interface Props {
  layer: TextLayer
  isSelected: boolean
  onSelect: () => void
  onChange: (patch: Partial<TextLayer>) => void
  onDoubleClick: () => void
  registerNodeRef?: (node: Konva.Node | null) => void
}

export function TextLayerNode({
  layer,
  isSelected,
  onSelect,
  onChange,
  onDoubleClick,
  registerNodeRef,
}: Props) {
  const nodeRef = useRef<Konva.Text>(null)

  useEffect(() => {
    if (isSelected && registerNodeRef) registerNodeRef(nodeRef.current)
    return () => {
      if (isSelected && registerNodeRef) registerNodeRef(null)
    }
  }, [isSelected, registerNodeRef])

  if (!layer.visible) return null

  return (
    <Text
      ref={nodeRef}
      text={layer.text || '文字'}
      x={layer.x}
      y={layer.y}
      width={layer.width}
      height={layer.height}
      rotation={layer.rotation}
      opacity={layer.opacity}
      fontSize={layer.fontSize}
      fontFamily={layer.fontFamily}
      fontStyle={
        layer.fontWeight === 'bold' && layer.fontStyle === 'italic'
          ? 'bold italic'
          : layer.fontWeight === 'bold'
            ? 'bold'
            : layer.fontStyle === 'italic'
              ? 'italic'
              : 'normal'
      }
      fill={layer.color}
      stroke={layer.strokeColor}
      strokeWidth={layer.strokeWidth ?? 0}
      align={layer.align}
      verticalAlign='middle'
      wrap='word'
      draggable={!layer.locked}
      onClick={(e) => {
        e.cancelBubble = true
        onSelect()
      }}
      onTap={(e) => {
        e.cancelBubble = true
        onSelect()
      }}
      onDblClick={(e) => {
        e.cancelBubble = true
        onDoubleClick()
      }}
      onDblTap={(e) => {
        e.cancelBubble = true
        onDoubleClick()
      }}
      onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      onTransformEnd={() => {
        const node = nodeRef.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        const newWidth = Math.max(30, layer.width * scaleX)
        const newHeight = Math.max(20, layer.height * scaleY)
        node.scaleX(1)
        node.scaleY(1)
        onChange({
          x: node.x(),
          y: node.y(),
          width: newWidth,
          height: newHeight,
          rotation: node.rotation(),
        })
      }}
    />
  )
}
