import { useRef, useEffect } from 'react'
import { Group, Rect, Text, Shape } from 'react-konva'
import Konva from 'konva'
import type { SpeechBubbleLayer, BubbleTailDirection } from '../types'

interface Props {
  layer: SpeechBubbleLayer
  isSelected: boolean
  onSelect: () => void
  onChange: (patch: Partial<SpeechBubbleLayer>) => void
  onDoubleClick: () => void
  registerNodeRef?: (node: Konva.Node | null) => void
}

/**
 * 绘制气泡主体路径
 */
function drawBubbleBody(
  context: Konva.Context,
  style: SpeechBubbleLayer['bubbleStyle'],
  w: number,
  h: number
) {
  if (style === 'thought') {
    // 云朵形：多段椭圆拼接
    const cx = w / 2
    const cy = h / 2
    const rx = w / 2
    const ry = h / 2
    context.moveTo(cx - rx, cy)
    const bumps = 8
    for (let i = 0; i < bumps; i++) {
      const a1 = (Math.PI * 2 * i) / bumps
      const a2 = (Math.PI * 2 * (i + 1)) / bumps
      const mid = (a1 + a2) / 2
      const cpX = cx + Math.cos(mid) * (rx + 12)
      const cpY = cy + Math.sin(mid) * (ry + 12)
      const endX = cx + Math.cos(a2) * rx
      const endY = cy + Math.sin(a2) * ry
      context.quadraticCurveTo(cpX, cpY, endX, endY)
    }
    return
  }
  if (style === 'shout') {
    // 锯齿爆炸边
    const cx = w / 2
    const cy = h / 2
    const rx = w / 2
    const ry = h / 2
    const spikes = 16
    for (let i = 0; i <= spikes * 2; i++) {
      const angle = (Math.PI * 2 * i) / (spikes * 2)
      const r = i % 2 === 0 ? 1 : 0.75
      const x = cx + Math.cos(angle) * rx * r
      const y = cy + Math.sin(angle) * ry * r
      if (i === 0) context.moveTo(x, y)
      else context.lineTo(x, y)
    }
    return
  }
  if (style === 'narration') {
    // 矩形边框（旁白）
    context.rect(0, 0, w, h)
    return
  }
  // normal：圆角矩形（椭圆气泡）
  const r = Math.min(w, h) * 0.3
  context.moveTo(r, 0)
  context.lineTo(w - r, 0)
  context.quadraticCurveTo(w, 0, w, r)
  context.lineTo(w, h - r)
  context.quadraticCurveTo(w, h, w - r, h)
  context.lineTo(r, h)
  context.quadraticCurveTo(0, h, 0, h - r)
  context.lineTo(0, r)
  context.quadraticCurveTo(0, 0, r, 0)
}

function drawBubbleTail(context: Konva.Context, w: number, h: number, direction: BubbleTailDirection) {
  if (direction === 'none') return
  const tailW = Math.min(w, h) * 0.15
  const tailH = Math.min(w, h) * 0.25
  const attach = (() => {
    switch (direction) {
      case 'left-down':
        return { anchorX: w * 0.3, anchorY: h, tipX: w * 0.15, tipY: h + tailH }
      case 'right-down':
        return { anchorX: w * 0.7, anchorY: h, tipX: w * 0.85, tipY: h + tailH }
      case 'left-up':
        return { anchorX: w * 0.3, anchorY: 0, tipX: w * 0.15, tipY: -tailH }
      case 'right-up':
        return { anchorX: w * 0.7, anchorY: 0, tipX: w * 0.85, tipY: -tailH }
    }
  })()
  context.moveTo(attach.anchorX - tailW / 2, attach.anchorY)
  context.lineTo(attach.tipX, attach.tipY)
  context.lineTo(attach.anchorX + tailW / 2, attach.anchorY)
}

export function SpeechBubbleNode({
  layer,
  isSelected,
  onSelect,
  onChange,
  onDoubleClick,
  registerNodeRef,
}: Props) {
  const groupRef = useRef<Konva.Group>(null)

  useEffect(() => {
    if (isSelected && registerNodeRef) registerNodeRef(groupRef.current)
    return () => {
      if (isSelected && registerNodeRef) registerNodeRef(null)
    }
  }, [isSelected, registerNodeRef])

  if (!layer.visible) return null

  return (
    <Group
      ref={groupRef}
      x={layer.x}
      y={layer.y}
      rotation={layer.rotation}
      opacity={layer.opacity}
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
        const node = groupRef.current
        if (!node) return
        const scaleX = node.scaleX()
        const scaleY = node.scaleY()
        const newWidth = Math.max(30, layer.width * scaleX)
        const newHeight = Math.max(30, layer.height * scaleY)
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
    >
      <Shape
        sceneFunc={(context, shape) => {
          context.beginPath()
          drawBubbleBody(context, layer.bubbleStyle, layer.width, layer.height)
          context.closePath()
          drawBubbleTail(context, layer.width, layer.height, layer.tailDirection)
          context.fillStrokeShape(shape)
        }}
        fill={layer.fillColor}
        stroke={layer.strokeColor}
        strokeWidth={layer.strokeWidth}
      />
      <Text
        text={layer.text || (layer.bubbleStyle === 'narration' ? '旁白...' : '双击输入文字')}
        x={layer.width * 0.06}
        y={layer.height * 0.08}
        width={layer.width * 0.88}
        height={layer.height * 0.84}
        fontSize={layer.fontSize}
        fontFamily={layer.fontFamily}
        fill={layer.textColor}
        align='center'
        verticalAlign='middle'
        wrap='word'
        listening={false}
      />
    </Group>
  )
}
