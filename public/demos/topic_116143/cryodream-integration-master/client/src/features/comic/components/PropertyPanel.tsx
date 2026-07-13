import { Slider } from '@/components/ui/slider'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { FlipHorizontal, FlipVertical, Maximize2, RefreshCw, RotateCcw } from 'lucide-react'
import type { ComicLayer, ComicPanel, BubbleStyle, BubbleTailDirection, ImageLayer } from '../types'
import { fitImageCover, fitImageContain, loadImageSize } from '../utils/imageFit'

interface Props {
  selectedPanel: ComicPanel | null
  selectedLayer: ComicLayer | null
  onPanelChange: (patch: Partial<ComicPanel>) => void
  onLayerChange: (patch: Partial<ComicLayer>) => void
}

const bubbleStyles: { value: BubbleStyle; label: string }[] = [
  { value: 'normal', label: '普通' },
  { value: 'thought', label: '思考' },
  { value: 'shout', label: '呐喊' },
  { value: 'narration', label: '旁白' },
]

const tailDirections: { value: BubbleTailDirection; label: string }[] = [
  { value: 'left-down', label: '左下' },
  { value: 'right-down', label: '右下' },
  { value: 'left-up', label: '左上' },
  { value: 'right-up', label: '右上' },
  { value: 'none', label: '无' },
]

export function PropertyPanel({ selectedPanel, selectedLayer, onPanelChange, onLayerChange }: Props) {
  if (selectedLayer) {
    return (
      <div className='space-y-4 p-3'>
        <div className='text-xs font-semibold text-neutral-700'>图层属性</div>

        <div className='space-y-1.5'>
          <Label className='text-xs text-neutral-500'>不透明度：{Math.round(selectedLayer.opacity * 100)}%</Label>
          <Slider
            min={0}
            max={1}
            step={0.05}
            value={[selectedLayer.opacity]}
            onValueChange={([v]) => onLayerChange({ opacity: v } as Partial<ComicLayer>)}
          />
        </div>

        <div className='space-y-1.5'>
          <Label className='text-xs text-neutral-500'>旋转：{Math.round(selectedLayer.rotation)}°</Label>
          <Slider
            min={-180}
            max={180}
            step={1}
            value={[selectedLayer.rotation]}
            onValueChange={([v]) => onLayerChange({ rotation: v } as Partial<ComicLayer>)}
          />
        </div>

        {selectedLayer.type === 'text' && (
          <>
            <div className='space-y-1'>
              <Label className='text-xs text-neutral-500'>文字内容</Label>
              <textarea
                value={selectedLayer.text}
                onChange={(e) => onLayerChange({ text: e.target.value })}
                className='w-full rounded border border-neutral-200 px-2 py-1 text-xs focus:border-neutral-400 focus:outline-none'
                rows={3}
              />
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label className='text-xs text-neutral-500'>字号</Label>
                <Input
                  type='number'
                  value={selectedLayer.fontSize}
                  onChange={(e) => onLayerChange({ fontSize: Number(e.target.value) })}
                  className='h-7 text-xs'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs text-neutral-500'>颜色</Label>
                <input
                  type='color'
                  value={selectedLayer.color}
                  onChange={(e) => onLayerChange({ color: e.target.value })}
                  className='h-7 w-full rounded border border-neutral-200'
                />
              </div>
            </div>
            <div className='flex gap-1'>
              {(['left', 'center', 'right'] as const).map((a) => (
                <button
                  key={a}
                  onClick={() => onLayerChange({ align: a })}
                  className={`flex-1 rounded border px-2 py-1 text-xs ${
                    selectedLayer.align === a
                      ? 'border-neutral-900 bg-neutral-900 text-white'
                      : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                  }`}
                >
                  {a === 'left' ? '左' : a === 'center' ? '中' : '右'}
                </button>
              ))}
            </div>
            <div className='flex gap-1'>
              <button
                onClick={() =>
                  onLayerChange({ fontWeight: selectedLayer.fontWeight === 'bold' ? 'normal' : 'bold' })
                }
                className={`flex-1 rounded border px-2 py-1 text-xs font-bold ${
                  selectedLayer.fontWeight === 'bold'
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-600'
                }`}
              >
                B
              </button>
              <button
                onClick={() =>
                  onLayerChange({ fontStyle: selectedLayer.fontStyle === 'italic' ? 'normal' : 'italic' })
                }
                className={`flex-1 rounded border px-2 py-1 text-xs italic ${
                  selectedLayer.fontStyle === 'italic'
                    ? 'border-neutral-900 bg-neutral-900 text-white'
                    : 'border-neutral-200 text-neutral-600'
                }`}
              >
                I
              </button>
            </div>
          </>
        )}

        {selectedLayer.type === 'bubble' && (
          <>
            <div className='space-y-1'>
              <Label className='text-xs text-neutral-500'>文字内容</Label>
              <textarea
                value={selectedLayer.text}
                onChange={(e) => onLayerChange({ text: e.target.value })}
                className='w-full rounded border border-neutral-200 px-2 py-1 text-xs focus:border-neutral-400 focus:outline-none'
                rows={3}
              />
            </div>
            <div className='space-y-1'>
              <Label className='text-xs text-neutral-500'>气泡风格</Label>
              <div className='grid grid-cols-4 gap-1'>
                {bubbleStyles.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => onLayerChange({ bubbleStyle: b.value })}
                    className={`rounded border px-1 py-1 text-xs ${
                      selectedLayer.bubbleStyle === b.value
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>
            <div className='space-y-1'>
              <Label className='text-xs text-neutral-500'>尾巴方向</Label>
              <div className='grid grid-cols-3 gap-1'>
                {tailDirections.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => onLayerChange({ tailDirection: t.value })}
                    className={`rounded border px-1 py-1 text-xs ${
                      selectedLayer.tailDirection === t.value
                        ? 'border-neutral-900 bg-neutral-900 text-white'
                        : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>
            </div>
            <div className='grid grid-cols-2 gap-2'>
              <div className='space-y-1'>
                <Label className='text-xs text-neutral-500'>字号</Label>
                <Input
                  type='number'
                  value={selectedLayer.fontSize}
                  onChange={(e) => onLayerChange({ fontSize: Number(e.target.value) })}
                  className='h-7 text-xs'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs text-neutral-500'>文字色</Label>
                <input
                  type='color'
                  value={selectedLayer.textColor}
                  onChange={(e) => onLayerChange({ textColor: e.target.value })}
                  className='h-7 w-full rounded border border-neutral-200'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs text-neutral-500'>填充色</Label>
                <input
                  type='color'
                  value={selectedLayer.fillColor}
                  onChange={(e) => onLayerChange({ fillColor: e.target.value })}
                  className='h-7 w-full rounded border border-neutral-200'
                />
              </div>
              <div className='space-y-1'>
                <Label className='text-xs text-neutral-500'>描边色</Label>
                <input
                  type='color'
                  value={selectedLayer.strokeColor}
                  onChange={(e) => onLayerChange({ strokeColor: e.target.value })}
                  className='h-7 w-full rounded border border-neutral-200'
                />
              </div>
            </div>
          </>
        )}

        {selectedLayer.type === 'image' && (
          <ImageLayerActions
            layer={selectedLayer}
            panel={selectedPanel}
            onChange={onLayerChange}
          />
        )}
      </div>
    )
  }

  if (selectedPanel) {
    return (
      <div className='space-y-4 p-3'>
        <div className='text-xs font-semibold text-neutral-700'>分格属性</div>

        <div className='flex items-center gap-2'>
          <input
            id='clip-content'
            type='checkbox'
            checked={selectedPanel.clipContent}
            onChange={(e) => onPanelChange({ clipContent: e.target.checked })}
          />
          <Label htmlFor='clip-content' className='cursor-pointer text-xs text-neutral-600'>
            裁剪图层至分格内
          </Label>
        </div>
        <div className='rounded border border-neutral-200 p-2 text-xs text-neutral-500'>
          <div>位置：{Math.round(selectedPanel.x)}, {Math.round(selectedPanel.y)}</div>
          <div>大小：{Math.round(selectedPanel.width)} × {Math.round(selectedPanel.height)}</div>
        </div>
      </div>
    )
  }

  return (
    <div className='flex h-full items-center justify-center px-4 text-center text-xs text-neutral-400'>
      选中分格或图层查看属性
    </div>
  )
}

interface ImageLayerActionsProps {
  layer: ImageLayer
  panel: ComicPanel | null
  onChange: (patch: Partial<ComicLayer>) => void
}

/** 图片图层的编辑操作面板：翻转、适配、复位等 */
function ImageLayerActions({ layer, panel, onChange }: ImageLayerActionsProps) {
  const applyFit = async (mode: 'cover' | 'contain') => {
    if (!panel) return
    try {
      const size = await loadImageSize(layer.src)
      const box =
        mode === 'cover'
          ? fitImageCover(panel, size.width, size.height)
          : fitImageContain(panel, size.width, size.height)
      onChange({ ...box, rotation: 0 })
    } catch {
      // 加载失败：直接铺满
      onChange({ x: 0, y: 0, width: panel.width, height: panel.height, rotation: 0 })
    }
  }

  const centerInPanel = () => {
    if (!panel) return
    onChange({
      x: (panel.width - layer.width) / 2,
      y: (panel.height - layer.height) / 2,
    })
  }

  return (
    <div className='space-y-2'>
      <Label className='text-xs text-neutral-500'>图片操作</Label>
      <div className='grid grid-cols-2 gap-1.5'>
        <Button
          variant='outline'
          size='sm'
          onClick={() => applyFit('cover')}
          disabled={!panel}
          className='h-7 gap-1 text-xs'
          title='等比缩放并占满分格（可能裁剪）'
        >
          <Maximize2 size={12} /> 填满分格
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => applyFit('contain')}
          disabled={!panel}
          className='h-7 gap-1 text-xs'
          title='等比缩放并完整显示'
        >
          <Maximize2 size={12} /> 适应分格
        </Button>
        <Button
          variant={layer.flipX ? 'default' : 'outline'}
          size='sm'
          onClick={() => onChange({ flipX: !layer.flipX })}
          className='h-7 gap-1 text-xs'
        >
          <FlipHorizontal size={12} /> 水平翻转
        </Button>
        <Button
          variant={layer.flipY ? 'default' : 'outline'}
          size='sm'
          onClick={() => onChange({ flipY: !layer.flipY })}
          className='h-7 gap-1 text-xs'
        >
          <FlipVertical size={12} /> 垂直翻转
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={centerInPanel}
          disabled={!panel}
          className='h-7 gap-1 text-xs'
        >
          <RefreshCw size={12} /> 居中
        </Button>
        <Button
          variant='outline'
          size='sm'
          onClick={() => onChange({ rotation: 0, flipX: false, flipY: false })}
          className='h-7 gap-1 text-xs'
        >
          <RotateCcw size={12} /> 复位
        </Button>
      </div>
      <div className='mt-2 rounded border border-neutral-200 p-2 text-xs text-neutral-500'>
        <div>宽 × 高：{Math.round(layer.width)} × {Math.round(layer.height)}</div>
        <div className='mt-1 truncate' title={layer.src}>
          来源：{layer.src.split('/').pop()}
        </div>
      </div>
    </div>
  )
}

