export interface ComicProject {
  id: string
  name: string
  description?: string
  canvasWidth: number
  canvasHeight: number
  comicData: string
  thumbnailUrl?: string
  createTime?: string
  updateTime?: string
}

export interface ComicAsset {
  id: string
  url: string
  name: string
  /** 所属分组 id；未指定则视为「未分组」 */
  groupId?: string
}

export interface AssetGroup {
  id: string
  name: string
}

export interface ComicData {
  pages: ComicPage[]
  assets?: ComicAsset[]
  assetGroups?: AssetGroup[]
}

export interface ComicPage {
  id: string
  order: number
  panels: ComicPanel[]
}

export type PanelStyle =
  | 'classic'   // 日系经典：黑色粗描边，直角
  | 'soft'      // 柔和：中性灰细描边，大圆角，浅阴影
  | 'paper'     // 纸质：米色描边+柔和投影+圆角
  | 'manga'     // 极简线稿：细黑线，微阴影
  | 'retro'     // 复古：双层描边（外粗内细）
  | 'ink'       // 水墨：深灰粗线+淡纸底
  | 'neon'      // 霓虹：亮色描边+发光效果
  | 'custom'    // 用户自定义

export interface ComicPanel {
  id: string
  x: number
  y: number
  width: number
  height: number
  borderColor: string
  borderWidth: number
  cornerRadius: number
  clipContent: boolean
  layers: ComicLayer[]
  /** 分格风格预设，可选。缺省视为 'custom'（使用 borderColor/borderWidth/cornerRadius） */
  style?: PanelStyle
}

export type ComicLayer = ImageLayer | SpeechBubbleLayer | TextLayer | EffectLayer

interface BaseLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  x: number
  y: number
  width: number
  height: number
  rotation: number
  opacity: number
}

export interface ImageLayer extends BaseLayer {
  type: 'image'
  src: string
  sourceAssetId?: string
  /** 水平翻转 */
  flipX?: boolean
  /** 垂直翻转 */
  flipY?: boolean
}

export type BubbleStyle = 'normal' | 'thought' | 'shout' | 'narration'
export type BubbleTailDirection = 'left-down' | 'right-down' | 'left-up' | 'right-up' | 'none'

export interface SpeechBubbleLayer extends BaseLayer {
  type: 'bubble'
  bubbleStyle: BubbleStyle
  tailDirection: BubbleTailDirection
  tailX: number
  tailY: number
  text: string
  fontSize: number
  fontFamily: string
  textColor: string
  fillColor: string
  strokeColor: string
  strokeWidth: number
}

export interface TextLayer extends BaseLayer {
  type: 'text'
  text: string
  fontSize: number
  fontFamily: string
  color: string
  strokeColor?: string
  strokeWidth?: number
  align: 'left' | 'center' | 'right'
  fontWeight: 'normal' | 'bold'
  fontStyle: 'normal' | 'italic'
}

export type EffectType = 'boom' | 'flash' | 'lines'

export interface EffectLayer extends BaseLayer {
  type: 'effect'
  effectType: EffectType
  color: string
}

export const DEFAULT_CANVAS_PRESETS = [
  { label: 'A4 竖版', width: 1240, height: 1754 },
  { label: '手机竖版', width: 1080, height: 1920 },
  { label: '正方形', width: 1200, height: 1200 },
  { label: '横版 16:9', width: 1920, height: 1080 },
] as const

export function createEmptyComicData(): ComicData {
  return { pages: [{ id: crypto.randomUUID(), order: 0, panels: [] }], assets: [], assetGroups: [] }
}

export function parseComicData(json: string | undefined | null): ComicData {
  if (!json) return createEmptyComicData()
  try {
    const parsed = JSON.parse(json) as Partial<ComicData>
    if (!parsed || !Array.isArray(parsed.pages) || parsed.pages.length === 0) {
      return createEmptyComicData()
    }
    // 兜底 assets / assetGroups 字段，保证引用稳定
    if (!Array.isArray(parsed.assets)) {
      parsed.assets = []
    }
    if (!Array.isArray(parsed.assetGroups)) {
      parsed.assetGroups = []
    }
    return parsed as ComicData
  } catch {
    return createEmptyComicData()
  }
}
