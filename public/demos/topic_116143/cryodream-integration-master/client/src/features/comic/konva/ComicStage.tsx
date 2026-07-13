import { useEffect, useMemo, useRef, useState, forwardRef, useImperativeHandle } from 'react'
import { Stage, Layer, Rect, Transformer } from 'react-konva'
import Konva from 'konva'
import type { ComicPanel, ComicLayer, TextLayer, SpeechBubbleLayer } from '../types'
import { useComicWorkspaceStore, useCurrentPage } from '../stores/comic-workspace-store'
import { PanelGroup } from './PanelGroup'
import { ImageLayerNode } from './ImageLayerNode'
import { TextLayerNode } from './TextLayerNode'
import { SpeechBubbleNode } from './SpeechBubbleNode'

export interface ComicStageHandle {
  exportImage: (pixelRatio?: number) => string | null
  focusPage: () => void
}

interface Props {
  containerSize: { width: number; height: number }
  canvasWidth: number
  canvasHeight: number
  onTextEditRequest: (layer: TextLayer | SpeechBubbleLayer, panelId: string) => void
}

/**
 * 漫画主画布：Konva Stage，展示当前页面的所有分格及其图层
 * - 支持画布平移、缩放
 * - 分格工具下可拖出新分格
 * - 选中工具下点击选中分格 / 图层
 * - 双击分格进入图层编辑模式
 */
export const ComicStage = forwardRef<ComicStageHandle, Props>(function ComicStage(
  { containerSize, canvasWidth, canvasHeight, onTextEditRequest },
  ref
) {
  const stageRef = useRef<Konva.Stage>(null)
  const transformerRef = useRef<Konva.Transformer>(null)
  const selectedNodeRef = useRef<Konva.Node | null>(null)

  const page = useCurrentPage()
  const tool = useComicWorkspaceStore((s) => s.tool)
  const setTool = useComicWorkspaceStore((s) => s.setTool)
  const selectedPanelId = useComicWorkspaceStore((s) => s.selectedPanelId)
  const selectedLayerId = useComicWorkspaceStore((s) => s.selectedLayerId)
  const selectPanel = useComicWorkspaceStore((s) => s.selectPanel)
  const selectLayer = useComicWorkspaceStore((s) => s.selectLayer)
  const addPanel = useComicWorkspaceStore((s) => s.addPanel)
  const updateLayer = useComicWorkspaceStore((s) => s.updateLayer)

  // 编辑模式：进入某个分格后聚焦该分格
  const [editingPanelId, setEditingPanelId] = useState<string | null>(null)

  // 画布视图变换
  const [scale, setScale] = useState(1)
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  // 分格绘制状态
  const [drawingRect, setDrawingRect] = useState<{
    x: number
    y: number
    w: number
    h: number
  } | null>(null)
  const drawStartRef = useRef<{ x: number; y: number } | null>(null)

  // 自动居中画布
  useEffect(() => {
    if (containerSize.width === 0 || containerSize.height === 0) return
    const fitScale = Math.min(
      (containerSize.width - 40) / canvasWidth,
      (containerSize.height - 40) / canvasHeight,
      1
    )
    setScale(fitScale)
    setOffset({
      x: (containerSize.width - canvasWidth * fitScale) / 2,
      y: (containerSize.height - canvasHeight * fitScale) / 2,
    })
  }, [containerSize.width, containerSize.height, canvasWidth, canvasHeight])

  // 对外方法：导出图片、聚焦
  useImperativeHandle(ref, () => ({
    exportImage: (pixelRatio = 2) => {
      const stage = stageRef.current
      if (!stage) return null
      // 记录当前变换，导出前重置
      const oldScale = stage.scaleX()
      const oldPos = { x: stage.x(), y: stage.y() }
      stage.scale({ x: 1, y: 1 })
      stage.position({ x: 0, y: 0 })
      stage.size({ width: canvasWidth, height: canvasHeight })
      const dataUrl = stage.toDataURL({
        x: 0,
        y: 0,
        width: canvasWidth,
        height: canvasHeight,
        pixelRatio,
      })
      // 恢复
      stage.scale({ x: oldScale, y: oldScale })
      stage.position(oldPos)
      stage.size(containerSize)
      return dataUrl
    },
    focusPage: () => {
      const fitScale = Math.min(
        (containerSize.width - 40) / canvasWidth,
        (containerSize.height - 40) / canvasHeight,
        1
      )
      setScale(fitScale)
      setOffset({
        x: (containerSize.width - canvasWidth * fitScale) / 2,
        y: (containerSize.height - canvasHeight * fitScale) / 2,
      })
    },
  }))

  // 更新 Transformer 附加的节点
  useEffect(() => {
    const tr = transformerRef.current
    if (!tr) return
    const node = selectedNodeRef.current
    if (node) {
      tr.nodes([node])
      tr.getLayer()?.batchDraw()
    } else {
      tr.nodes([])
      tr.getLayer()?.batchDraw()
    }
  }, [selectedPanelId, selectedLayerId, editingPanelId, page])

  const registerSelected = (node: Konva.Node | null) => {
    selectedNodeRef.current = node
    const tr = transformerRef.current
    if (!tr) return
    if (node) tr.nodes([node])
    else tr.nodes([])
    tr.getLayer()?.batchDraw()
  }

  const stageToCanvasCoord = (evt: Konva.KonvaEventObject<PointerEvent>) => {
    const stage = evt.target.getStage()
    if (!stage) return null
    const pos = stage.getPointerPosition()
    if (!pos) return null
    return {
      x: (pos.x - offset.x) / scale,
      y: (pos.y - offset.y) / scale,
    }
  }

  const handleMouseDown = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (tool !== 'panel') return
    // 点在空白位置才开始画分格
    const target = e.target
    if (target.getType() !== 'Stage' && target.name() !== 'canvas-bg') return
    const point = stageToCanvasCoord(e)
    if (!point) return
    drawStartRef.current = point
    setDrawingRect({ x: point.x, y: point.y, w: 0, h: 0 })
  }

  const handleMouseMove = (e: Konva.KonvaEventObject<PointerEvent>) => {
    if (!drawStartRef.current) return
    const point = stageToCanvasCoord(e)
    if (!point) return
    setDrawingRect({
      x: Math.min(drawStartRef.current.x, point.x),
      y: Math.min(drawStartRef.current.y, point.y),
      w: Math.abs(point.x - drawStartRef.current.x),
      h: Math.abs(point.y - drawStartRef.current.y),
    })
  }

  const handleMouseUp = () => {
    const rect = drawingRect
    drawStartRef.current = null
    setDrawingRect(null)
    if (!rect || rect.w < 20 || rect.h < 20) return
    const newPanel: ComicPanel = {
      id: crypto.randomUUID(),
      x: rect.x,
      y: rect.y,
      width: rect.w,
      height: rect.h,
      borderColor: '#94a3b8',
      borderWidth: 1.5,
      cornerRadius: 20,
      clipContent: true,
      layers: [],
      style: 'soft',
    }
    addPanel(newPanel)
    setTool('select')
  }

  // 滚轮缩放（Ctrl/Cmd + wheel）
  const handleWheel = (e: Konva.KonvaEventObject<WheelEvent>) => {
    if (!e.evt.ctrlKey && !e.evt.metaKey) return
    e.evt.preventDefault()
    const stage = stageRef.current
    if (!stage) return
    const pointer = stage.getPointerPosition()
    if (!pointer) return
    const scaleBy = 1.1
    const oldScale = scale
    const direction = e.evt.deltaY < 0 ? 1 : -1
    const newScale = Math.max(0.1, Math.min(3, direction > 0 ? oldScale * scaleBy : oldScale / scaleBy))
    const mousePointTo = {
      x: (pointer.x - offset.x) / oldScale,
      y: (pointer.y - offset.y) / oldScale,
    }
    setScale(newScale)
    setOffset({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    })
  }

  const currentPagePanels = useMemo(() => page?.panels ?? [], [page])

  return (
    <div className='relative h-full w-full overflow-hidden bg-neutral-100'>
      <Stage
        ref={stageRef}
        width={containerSize.width}
        height={containerSize.height}
        x={offset.x}
        y={offset.y}
        scaleX={scale}
        scaleY={scale}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        onClick={(e) => {
          // 点击 Stage 空白处取消选择
          const target = e.target
          if (target.getType() === 'Stage' || target.name() === 'canvas-bg') {
            selectPanel(null)
            selectLayer(null)
            setEditingPanelId(null)
            registerSelected(null)
          }
        }}
        style={{ cursor: tool === 'panel' ? 'crosshair' : 'default' }}
      >
        {/* 底层：画布背景 */}
        <Layer listening>
          <Rect
            name='canvas-bg'
            x={0}
            y={0}
            width={canvasWidth}
            height={canvasHeight}
            fill='#ffffff'
            shadowBlur={20}
            shadowColor='rgba(0,0,0,0.15)'
            shadowOpacity={0.3}
          />
        </Layer>

        {/* 分格与图层 */}
        <Layer>
          {currentPagePanels.map((panel) => {
            const dimmed = editingPanelId !== null && editingPanelId !== panel.id
            return (
              <PanelGroup
                key={panel.id}
                panel={panel}
                isSelected={selectedPanelId === panel.id}
                isEditingLayers={editingPanelId === panel.id}
                onSelect={() => {
                  if (tool !== 'select') return
                  selectPanel(panel.id)
                  // 分格本身不再绑定 Transformer，取消上一次的 transformer 目标
                  registerSelected(null)
                }}
                onEnterLayerMode={() => setEditingPanelId(panel.id)}
              >
                {panel.layers.map((layer) => (
                  <LayerRenderer
                    key={layer.id}
                    layer={layer}
                    isSelected={selectedLayerId === layer.id}
                    canInteract={editingPanelId === panel.id || editingPanelId === null}
                    onSelect={() => {
                      if (editingPanelId !== panel.id) setEditingPanelId(panel.id)
                      // 同时把 selectedPanelId 同步为图层所属分格，
                      // 确保属性面板能正确显示图层信息
                      if (selectedPanelId !== panel.id) selectPanel(panel.id)
                      selectLayer(layer.id)
                    }}
                    onChange={(patch) => updateLayer(panel.id, layer.id, patch)}
                    onDoubleClick={() => {
                      if (layer.type === 'text' || layer.type === 'bubble') {
                        onTextEditRequest(layer, panel.id)
                      }
                    }}
                    registerNodeRef={registerSelected}
                  />
                ))}
                {/* 半透明遮罩（其他分格） */}
                {dimmed && (
                  <Rect
                    width={panel.width}
                    height={panel.height}
                    fill='white'
                    opacity={0.5}
                    listening={false}
                  />
                )}
              </PanelGroup>
            )
          })}

          {/* 分格绘制预览 */}
          {drawingRect && (
            <Rect
              x={drawingRect.x}
              y={drawingRect.y}
              width={drawingRect.w}
              height={drawingRect.h}
              fill='rgba(59,130,246,0.15)'
              stroke='#3b82f6'
              strokeWidth={2}
              dash={[6, 3]}
              listening={false}
            />
          )}

          {/* Transformer */}
          <Transformer
            ref={transformerRef}
            rotateEnabled
            keepRatio={false}
            anchorSize={8}
            anchorFill='#fff'
            anchorStroke='#3b82f6'
            borderStroke='#3b82f6'
            borderDash={[4, 3]}
          />
        </Layer>
      </Stage>

      {/* 缩放指示 */}
      <div className='pointer-events-none absolute bottom-2 right-2 rounded bg-white/80 px-2 py-1 text-xs text-neutral-600 shadow'>
        {Math.round(scale * 100)}%
      </div>

      {/* 图层模式指示 */}
      {editingPanelId && (
        <div className='pointer-events-none absolute left-1/2 top-2 -translate-x-1/2 rounded-full bg-emerald-500 px-3 py-1 text-xs text-white shadow'>
          图层编辑模式 · 按 ESC 退出
        </div>
      )}
    </div>
  )
})

interface LayerRendererProps {
  layer: ComicLayer
  isSelected: boolean
  canInteract: boolean
  onSelect: () => void
  onChange: (patch: Partial<ComicLayer>) => void
  onDoubleClick: () => void
  registerNodeRef: (node: Konva.Node | null) => void
}

function LayerRenderer({
  layer,
  isSelected,
  canInteract,
  onSelect,
  onChange,
  onDoubleClick,
  registerNodeRef,
}: LayerRendererProps) {
  const commonProps = {
    isSelected,
    onSelect,
    registerNodeRef,
  }
  if (!canInteract) {
    // 未处于图层模式或不属于当前编辑分格时，禁用交互（但仍显示）
  }
  switch (layer.type) {
    case 'image':
      return (
        <ImageLayerNode
          {...commonProps}
          layer={layer}
          onChange={(patch) => onChange(patch)}
        />
      )
    case 'text':
      return (
        <TextLayerNode
          {...commonProps}
          layer={layer}
          onChange={(patch) => onChange(patch)}
          onDoubleClick={onDoubleClick}
        />
      )
    case 'bubble':
      return (
        <SpeechBubbleNode
          {...commonProps}
          layer={layer}
          onChange={(patch) => onChange(patch)}
          onDoubleClick={onDoubleClick}
        />
      )
    case 'effect':
      // MVP 阶段先简单渲染为矩形，后续再扩展
      return null
    default:
      return null
  }
}
