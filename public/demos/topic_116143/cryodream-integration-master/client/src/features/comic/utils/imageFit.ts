import type { ImageLayer, ComicPanel } from '../types'

/**
 * 加载图片并返回其原始宽高（Promise）
 */
export function loadImageSize(src: string): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error(`加载图片失败: ${src}`))
    img.src = src
  })
}

/**
 * 按 "cover"（占满分格，可能裁剪部分）模式计算图片图层的位置和尺寸。
 * 图片按最大边贴合分格，超出部分被分格裁剪。
 */
export function fitImageCover(
  panel: ComicPanel,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const panelRatio = panel.width / panel.height
  const imageRatio = imageWidth / imageHeight
  let w: number
  let h: number
  if (imageRatio > panelRatio) {
    // 图片更宽：以高为准
    h = panel.height
    w = h * imageRatio
  } else {
    // 图片更高或等比：以宽为准
    w = panel.width
    h = w / imageRatio
  }
  return {
    x: (panel.width - w) / 2,
    y: (panel.height - h) / 2,
    width: w,
    height: h,
  }
}

/**
 * 按 "contain"（完整显示，可能留白）模式计算
 */
export function fitImageContain(
  panel: ComicPanel,
  imageWidth: number,
  imageHeight: number
): { x: number; y: number; width: number; height: number } {
  const panelRatio = panel.width / panel.height
  const imageRatio = imageWidth / imageHeight
  let w: number
  let h: number
  if (imageRatio > panelRatio) {
    // 图片更宽：以宽为准
    w = panel.width
    h = w / imageRatio
  } else {
    // 图片更高：以高为准
    h = panel.height
    w = h * imageRatio
  }
  return {
    x: (panel.width - w) / 2,
    y: (panel.height - h) / 2,
    width: w,
    height: h,
  }
}

/**
 * 从图片 URL 构造一个自动适配分格的 ImageLayer
 */
export async function buildFittedImageLayer(
  src: string,
  name: string,
  panel: ComicPanel,
  mode: 'cover' | 'contain' = 'cover',
  sourceAssetId?: string
): Promise<ImageLayer> {
  let box: { x: number; y: number; width: number; height: number }
  try {
    const size = await loadImageSize(src)
    box = mode === 'cover' ? fitImageCover(panel, size.width, size.height) : fitImageContain(panel, size.width, size.height)
  } catch {
    // 加载失败：默认铺满
    box = { x: 0, y: 0, width: panel.width, height: panel.height }
  }
  return {
    id: crypto.randomUUID(),
    name,
    type: 'image',
    visible: true,
    locked: false,
    x: box.x,
    y: box.y,
    width: box.width,
    height: box.height,
    rotation: 0,
    opacity: 1,
    src,
    sourceAssetId,
  }
}
