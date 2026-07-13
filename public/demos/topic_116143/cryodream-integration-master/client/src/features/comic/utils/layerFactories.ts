import type { BubbleStyle, SpeechBubbleLayer, TextLayer } from '../types'

/** 生成默认的文字图层 */
export function buildTextLayer(kind: 'title' | 'body' | 'effect'): TextLayer {
  const presets = {
    title: { text: '标题', fontSize: 48, fontWeight: 'bold' as const },
    body: { text: '正文文字', fontSize: 20, fontWeight: 'normal' as const },
    effect: { text: 'BOOM!', fontSize: 64, fontWeight: 'bold' as const },
  }
  const preset = presets[kind]
  return {
    id: crypto.randomUUID(),
    name: preset.text,
    type: 'text',
    visible: true,
    locked: false,
    x: 40,
    y: 40,
    width: 240,
    height: 80,
    rotation: 0,
    opacity: 1,
    text: preset.text,
    fontSize: preset.fontSize,
    fontFamily: '"Microsoft YaHei", sans-serif',
    color: '#171717',
    align: 'center',
    fontWeight: preset.fontWeight,
    fontStyle: 'normal',
  }
}

const bubbleNameMap: Record<BubbleStyle, string> = {
  normal: '普通对话框',
  thought: '思考气泡',
  shout: '呐喊气泡',
  narration: '旁白框',
}

/** 生成默认的对话气泡图层 */
export function buildBubbleLayer(style: BubbleStyle): SpeechBubbleLayer {
  return {
    id: crypto.randomUUID(),
    name: bubbleNameMap[style],
    type: 'bubble',
    visible: true,
    locked: false,
    x: 50,
    y: 50,
    width: 200,
    height: 120,
    rotation: 0,
    opacity: 1,
    bubbleStyle: style,
    tailDirection: style === 'narration' ? 'none' : 'left-down',
    tailX: 0,
    tailY: 0,
    text: '',
    fontSize: 24,
    fontFamily: '"Microsoft YaHei", sans-serif',
    textColor: '#171717',
    fillColor: '#ffffff',
    strokeColor: '#171717',
    strokeWidth: 3,
  }
}

export const BUBBLE_OPTIONS: { value: BubbleStyle; label: string }[] = [
  { value: 'normal', label: '普通' },
  { value: 'thought', label: '思考' },
  { value: 'shout', label: '呐喊' },
  { value: 'narration', label: '旁白' },
]

export const TEXT_KINDS: { value: 'title' | 'body' | 'effect'; label: string; sample: string }[] = [
  { value: 'title', label: '标题', sample: 'H1 加粗' },
  { value: 'body', label: '正文', sample: '常规' },
  { value: 'effect', label: '效果字', sample: 'BOOM!' },
]
