import { useRef, useEffect } from 'react'
import { Image as KonvaImage } from 'react-konva'
import useImage from 'use-image'
import Konva from 'konva'
import type { ImageLayer } from '../types'

interface Props {
  layer: ImageLayer
  isSelected: boolean
  onSelect: () => void
  onChange: (patch: Partial<ImageLayer>) => void
  registerNodeRef?: (node: Konva.Node | null) => void
}

export function ImageLayerNode({ layer, isSelected, onSelect, onChange, registerNodeRef }: Props) {
  const nodeRef = useRef<Konva.Image>(null)
  // 不使用 anonymous 模式：图片走 Vite 代理时后端静态资源默认不带 CORS 头，
  // 使用 anonymous 会导致加载失败。导出图片需要污点处理时会单独走后端渲染。
  const [img] = useImage(layer.src)

  useEffect(() => {
    if (isSelected && registerNodeRef) registerNodeRef(nodeRef.current)
    return () => {
      if (isSelected && registerNodeRef) registerNodeRef(null)
    }
  }, [isSelected, registerNodeRef])

  if (!layer.visible) return null

  return (
    <KonvaImage
      ref={nodeRef}
      image={img}
      x={layer.x + (layer.flipX ? layer.width : 0)}
      y={layer.y + (layer.flipY ? layer.height : 0)}
      width={layer.width}
      height={layer.height}
      scaleX={layer.flipX ? -1 : 1}
      scaleY={layer.flipY ? -1 : 1}
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
      onDragEnd={(e) => {
        // 拖拽结束后要还原到未翻转的 x/y
        const nx = e.target.x() - (layer.flipX ? layer.width : 0)
        const ny = e.target.y() - (layer.flipY ? layer.height : 0)
        onChange({ x: nx, y: ny })
      }}
      onTransformEnd={() => {
        const node = nodeRef.current
        if (!node) return
        const nodeScaleX = node.scaleX()
        const nodeScaleY = node.scaleY()
        // 分离用户变换缩放（相对基础 -1/1）与翻转
        const baseFlipX = layer.flipX ? -1 : 1
        const baseFlipY = layer.flipY ? -1 : 1
        const userScaleX = nodeScaleX / baseFlipX
        const userScaleY = nodeScaleY / baseFlipY
        const newWidth = Math.max(10, layer.width * userScaleX)
        const newHeight = Math.max(10, layer.height * userScaleY)
        node.scaleX(baseFlipX)
        node.scaleY(baseFlipY)
        // 还原为逻辑坐标
        const nx = node.x() - (layer.flipX ? newWidth : 0)
        const ny = node.y() - (layer.flipY ? newHeight : 0)
        onChange({
          x: nx,
          y: ny,
          width: newWidth,
          height: newHeight,
          rotation: node.rotation(),
        })
      }}
    />
  )
}
