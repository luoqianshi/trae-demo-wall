import { Group, Rect } from 'react-konva'
import type { ComicPanel } from '../types'
import { resolvePanelStyle } from '../config/panelStyles'

interface Props {
  panel: ComicPanel
  isSelected: boolean
  isEditingLayers: boolean
  onSelect: () => void
  onEnterLayerMode: () => void
  children: React.ReactNode
}

/**
 * 分格（Panel）组件：固定不动的矩形容器（类似背景），本身不可拖拽、缩放。
 * 支持多种预设风格：classic / soft / paper / manga / retro / ink / neon / custom。
 */
export function PanelGroup({
  panel,
  isSelected,
  isEditingLayers,
  onSelect,
  onEnterLayerMode,
  children,
}: Props) {
  const spec = resolvePanelStyle(panel)
  const w = panel.width
  const h = panel.height

  return (
    <Group
      x={panel.x}
      y={panel.y}
      draggable={false}
      onClick={onSelect}
      onTap={onSelect}
      onDblClick={onEnterLayerMode}
      onDblTap={onEnterLayerMode}
    >
      {/* 阴影底层（先画一个纯色阴影 Rect，让主 Rect 绘制阴影） */}
      {spec.shadow && (
        <Rect
          x={0}
          y={0}
          width={w}
          height={h}
          fill={spec.fill ?? '#ffffff'}
          cornerRadius={spec.cornerRadius}
          shadowColor={spec.shadow.color}
          shadowBlur={spec.shadow.blur}
          shadowOffsetX={spec.shadow.offsetX}
          shadowOffsetY={spec.shadow.offsetY}
          shadowOpacity={spec.shadow.opacity}
          listening={false}
        />
      )}

      {/* 主分格：填充 + 描边 */}
      <Rect
        x={0}
        y={0}
        width={w}
        height={h}
        fill={spec.fill ?? '#ffffff'}
        stroke={spec.border}
        strokeWidth={spec.borderWidth}
        cornerRadius={spec.cornerRadius}
      />

      {/* 双层描边（复古风格） */}
      {spec.outerStroke && (
        <Rect
          x={spec.outerStroke.offset}
          y={spec.outerStroke.offset}
          width={w - spec.outerStroke.offset * 2}
          height={h - spec.outerStroke.offset * 2}
          stroke={spec.outerStroke.color}
          strokeWidth={spec.outerStroke.width}
          cornerRadius={spec.outerStroke.cornerRadius}
          listening={false}
        />
      )}

      {/* 图层内容（裁剪在分格内） */}
      <Group
        clipFunc={
          panel.clipContent
            ? (ctx) => {
                ctx.beginPath()
                if (spec.cornerRadius > 0) {
                  // 圆角裁剪
                  const r = Math.min(spec.cornerRadius, w / 2, h / 2)
                  ctx.moveTo(r, 0)
                  ctx.lineTo(w - r, 0)
                  ctx.quadraticCurveTo(w, 0, w, r)
                  ctx.lineTo(w, h - r)
                  ctx.quadraticCurveTo(w, h, w - r, h)
                  ctx.lineTo(r, h)
                  ctx.quadraticCurveTo(0, h, 0, h - r)
                  ctx.lineTo(0, r)
                  ctx.quadraticCurveTo(0, 0, r, 0)
                } else {
                  ctx.rect(0, 0, w, h)
                }
                ctx.closePath()
              }
            : undefined
        }
      >
        {children}
      </Group>

      {/* 内发光（纸质风格）：叠一层浅色描边 */}
      {spec.innerGlow && (
        <Rect
          x={spec.innerGlow.inset}
          y={spec.innerGlow.inset}
          width={w - spec.innerGlow.inset * 2}
          height={h - spec.innerGlow.inset * 2}
          stroke={spec.innerGlow.color}
          strokeWidth={spec.innerGlow.width}
          cornerRadius={Math.max(0, spec.cornerRadius - spec.innerGlow.inset)}
          listening={false}
        />
      )}

      {/* 选中高亮虚线 */}
      {isSelected && (
        <Rect
          x={-3}
          y={-3}
          width={w + 6}
          height={h + 6}
          stroke={isEditingLayers ? '#10b981' : '#3b82f6'}
          strokeWidth={1.5}
          dash={[6, 4]}
          cornerRadius={spec.cornerRadius + 3}
          listening={false}
        />
      )}
    </Group>
  )
}
