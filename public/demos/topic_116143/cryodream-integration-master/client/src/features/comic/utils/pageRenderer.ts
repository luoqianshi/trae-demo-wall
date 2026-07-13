import Konva from 'konva'
import type { ComicPage, ComicLayer } from '../types'
import { resolvePanelStyle } from '../config/panelStyles'

/**
 * 离屏渲染一个漫画页面为 PNG dataURL。
 * 不依赖 React，直接用 Konva 命令式 API 渲染，避免闪烁和 DOM 依赖。
 */
export async function renderPageToDataURL(
  page: ComicPage,
  canvasWidth: number,
  canvasHeight: number,
  pixelRatio = 2
): Promise<string> {
  // 创建离屏容器
  const container = document.createElement('div')
  container.style.position = 'absolute'
  container.style.left = '-99999px'
  container.style.top = '-99999px'
  container.style.width = `${canvasWidth}px`
  container.style.height = `${canvasHeight}px`
  document.body.appendChild(container)

  try {
    const stage = new Konva.Stage({
      container,
      width: canvasWidth,
      height: canvasHeight,
    })

    // 背景层
    const bgLayer = new Konva.Layer()
    bgLayer.add(
      new Konva.Rect({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        fill: '#ffffff',
      })
    )
    stage.add(bgLayer)

    // 内容层
    const contentLayer = new Konva.Layer()

    // 预先加载所有图片
    const imagePromises: Promise<void>[] = []

    for (const panel of page.panels) {
      const spec = resolvePanelStyle(panel)
      const group = new Konva.Group({ x: panel.x, y: panel.y })
      // 阴影底层
      if (spec.shadow) {
        group.add(
          new Konva.Rect({
            width: panel.width,
            height: panel.height,
            fill: spec.fill ?? '#ffffff',
            cornerRadius: spec.cornerRadius,
            shadowColor: spec.shadow.color,
            shadowBlur: spec.shadow.blur,
            shadowOffsetX: spec.shadow.offsetX,
            shadowOffsetY: spec.shadow.offsetY,
            shadowOpacity: spec.shadow.opacity,
            listening: false,
          })
        )
      }
      // 主分格
      group.add(
        new Konva.Rect({
          width: panel.width,
          height: panel.height,
          fill: spec.fill ?? '#ffffff',
          stroke: spec.border,
          strokeWidth: spec.borderWidth,
          cornerRadius: spec.cornerRadius,
        })
      )
      // 双层描边
      if (spec.outerStroke) {
        group.add(
          new Konva.Rect({
            x: spec.outerStroke.offset,
            y: spec.outerStroke.offset,
            width: panel.width - spec.outerStroke.offset * 2,
            height: panel.height - spec.outerStroke.offset * 2,
            stroke: spec.outerStroke.color,
            strokeWidth: spec.outerStroke.width,
            cornerRadius: spec.outerStroke.cornerRadius,
            listening: false,
          })
        )
      }
      // 内容组（带 clip）
      const contentGroup = new Konva.Group({
        clipFunc: panel.clipContent
          ? (ctx) => {
              ctx.beginPath()
              if (spec.cornerRadius > 0) {
                const r = Math.min(spec.cornerRadius, panel.width / 2, panel.height / 2)
                ctx.moveTo(r, 0)
                ctx.lineTo(panel.width - r, 0)
                ctx.quadraticCurveTo(panel.width, 0, panel.width, r)
                ctx.lineTo(panel.width, panel.height - r)
                ctx.quadraticCurveTo(panel.width, panel.height, panel.width - r, panel.height)
                ctx.lineTo(r, panel.height)
                ctx.quadraticCurveTo(0, panel.height, 0, panel.height - r)
                ctx.lineTo(0, r)
                ctx.quadraticCurveTo(0, 0, r, 0)
              } else {
                ctx.rect(0, 0, panel.width, panel.height)
              }
              ctx.closePath()
            }
          : undefined,
      })
      for (const layer of panel.layers) {
        if (!layer.visible) continue
        const node = createLayerNode(layer, imagePromises)
        if (node) contentGroup.add(node)
      }
      group.add(contentGroup)
      // 内发光
      if (spec.innerGlow) {
        group.add(
          new Konva.Rect({
            x: spec.innerGlow.inset,
            y: spec.innerGlow.inset,
            width: panel.width - spec.innerGlow.inset * 2,
            height: panel.height - spec.innerGlow.inset * 2,
            stroke: spec.innerGlow.color,
            strokeWidth: spec.innerGlow.width,
            cornerRadius: Math.max(0, spec.cornerRadius - spec.innerGlow.inset),
            listening: false,
          })
        )
      }
      contentLayer.add(group)
    }
    stage.add(contentLayer)

    // 等待所有图片加载
    await Promise.all(imagePromises)
    contentLayer.batchDraw()

    // 等待下一帧确保渲染完成
    await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

    const dataUrl = stage.toDataURL({
      x: 0,
      y: 0,
      width: canvasWidth,
      height: canvasHeight,
      pixelRatio,
      mimeType: 'image/png',
    })

    stage.destroy()
    return dataUrl
  } finally {
    document.body.removeChild(container)
  }
}

function createLayerNode(layer: ComicLayer, imagePromises: Promise<void>[]): Konva.Node | null {
  if (layer.type === 'image') {
    const flipX = layer.flipX ? -1 : 1
    const flipY = layer.flipY ? -1 : 1
    const img = new Konva.Image({
      x: layer.x + (layer.flipX ? layer.width : 0),
      y: layer.y + (layer.flipY ? layer.height : 0),
      width: layer.width,
      height: layer.height,
      scaleX: flipX,
      scaleY: flipY,
      rotation: layer.rotation,
      opacity: layer.opacity,
      image: undefined as unknown as HTMLImageElement,
    })
    const promise = new Promise<void>((resolve) => {
      const dom = new Image()
      dom.crossOrigin = 'anonymous'
      dom.onload = () => {
        img.image(dom)
        resolve()
      }
      dom.onerror = () => resolve()
      dom.src = layer.src
    })
    imagePromises.push(promise)
    return img
  }
  if (layer.type === 'text') {
    return new Konva.Text({
      x: layer.x,
      y: layer.y,
      width: layer.width,
      height: layer.height,
      rotation: layer.rotation,
      opacity: layer.opacity,
      text: layer.text,
      fontSize: layer.fontSize,
      fontFamily: layer.fontFamily,
      fontStyle:
        layer.fontWeight === 'bold' && layer.fontStyle === 'italic'
          ? 'bold italic'
          : layer.fontWeight === 'bold'
            ? 'bold'
            : layer.fontStyle === 'italic'
              ? 'italic'
              : 'normal',
      fill: layer.color,
      align: layer.align,
      verticalAlign: 'middle',
      wrap: 'word',
    })
  }
  if (layer.type === 'bubble') {
    const g = new Konva.Group({
      x: layer.x,
      y: layer.y,
      rotation: layer.rotation,
      opacity: layer.opacity,
    })
    g.add(
      new Konva.Shape({
        sceneFunc: (context, shape) => {
          context.beginPath()
          drawBubbleBody(context, layer.bubbleStyle, layer.width, layer.height)
          context.closePath()
          drawBubbleTail(context, layer.width, layer.height, layer.tailDirection)
          context.fillStrokeShape(shape)
        },
        fill: layer.fillColor,
        stroke: layer.strokeColor,
        strokeWidth: layer.strokeWidth,
      })
    )
    g.add(
      new Konva.Text({
        text: layer.text,
        x: layer.width * 0.06,
        y: layer.height * 0.08,
        width: layer.width * 0.88,
        height: layer.height * 0.84,
        fontSize: layer.fontSize,
        fontFamily: layer.fontFamily,
        fill: layer.textColor,
        align: 'center',
        verticalAlign: 'middle',
        wrap: 'word',
      })
    )
    return g
  }
  return null
}

// 与 SpeechBubbleNode.tsx 中保持一致的绘制逻辑
function drawBubbleBody(context: Konva.Context, style: string, w: number, h: number) {
  if (style === 'thought') {
    const cx = w / 2
    const cy = h / 2
    const rx = w / 2
    const ry = h / 2
    context.moveTo(cx - rx, cy)
    const bumps = 8
    for (let i = 0; i < bumps; i++) {
      const a2 = (Math.PI * 2 * (i + 1)) / bumps
      const mid = ((Math.PI * 2 * i) / bumps + a2) / 2
      const cpX = cx + Math.cos(mid) * (rx + 12)
      const cpY = cy + Math.sin(mid) * (ry + 12)
      const endX = cx + Math.cos(a2) * rx
      const endY = cy + Math.sin(a2) * ry
      context.quadraticCurveTo(cpX, cpY, endX, endY)
    }
    return
  }
  if (style === 'shout') {
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
    context.rect(0, 0, w, h)
    return
  }
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

function drawBubbleTail(context: Konva.Context, w: number, h: number, direction: string) {
  if (direction === 'none') return
  const tailW = Math.min(w, h) * 0.15
  const tailH = Math.min(w, h) * 0.25
  let anchorX = 0
  let anchorY = 0
  let tipX = 0
  let tipY = 0
  switch (direction) {
    case 'left-down':
      anchorX = w * 0.3
      anchorY = h
      tipX = w * 0.15
      tipY = h + tailH
      break
    case 'right-down':
      anchorX = w * 0.7
      anchorY = h
      tipX = w * 0.85
      tipY = h + tailH
      break
    case 'left-up':
      anchorX = w * 0.3
      anchorY = 0
      tipX = w * 0.15
      tipY = -tailH
      break
    case 'right-up':
      anchorX = w * 0.7
      anchorY = 0
      tipX = w * 0.85
      tipY = -tailH
      break
    default:
      return
  }
  context.moveTo(anchorX - tailW / 2, anchorY)
  context.lineTo(tipX, tipY)
  context.lineTo(anchorX + tailW / 2, anchorY)
}
