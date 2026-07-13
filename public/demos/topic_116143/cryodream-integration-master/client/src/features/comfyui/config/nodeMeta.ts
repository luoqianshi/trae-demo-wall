import { type ComfyParam } from '../api/comfyui-api'

const NAME_ALIAS: Record<string, string> = {
  Turbo文生图: 'Z-image文生图',
}

export function formatWorkflowName(name: string): string {
  const stripped = name.replace(/^[\d]+[\s\-_.]*/, '').trim()
  return NAME_ALIAS[stripped] ?? stripped ?? name
}

export const PARAM_LABELS: Record<string, string> = {
  seed: '种子',
  steps: '步数',
  cfg: 'CFG 强度',
  sampler_name: '采样器',
  scheduler: '调度器',
  denoise: '去噪强度',
  width: '宽度',
  height: '高度',
  batch_size: '批量数',
}

export function paramLabel(p: ComfyParam): string {
  if (p.nodeType === 'CLIPTextEncode' || p.nodeType === 'PrimitiveStringMultiline') {
    return p.title
  }
  return PARAM_LABELS[p.paramName] ?? p.label
}

/** 种子模式存储 key（fixed | randomize）。 */
export function seedModeKey(nodeId: string) {
  return `__seedMode__.${nodeId}`
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000_000)
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

/** 由宽高计算最简宽高比字符串，如 1024x1024 → "1:1 (1024×1024)"。 */
export function formatAspectRatio(width?: number, height?: number): string {
  if (!width || !height) return ''
  const g = gcd(width, height) || 1
  return `${width / g}:${height / g}（${width}×${height}）`
}

export const COMBO_OPTIONS: Record<string, string[]> = {
  sampler_name: [
    'euler',
    'euler_ancestral',
    'heun',
    'dpm_2',
    'dpm_2_ancestral',
    'lms',
    'dpmpp_2s_ancestral',
    'dpmpp_sde',
    'dpmpp_2m',
    'dpmpp_2m_sde',
    'dpmpp_3m_sde',
    'ddim',
    'uni_pc',
    'lcm',
    'res_multistep',
  ],
  scheduler: ['normal', 'karras', 'exponential', 'sgm_uniform', 'simple', 'ddim_uniform', 'beta'],
}

export interface DimensionPreset {
  label: string
  width: number
  height: number
}

export const DIMENSION_PRESETS: DimensionPreset[] = [
  { label: '1:1 方形 · 1024×1024', width: 1024, height: 1024 },
  { label: '9:16 竖屏 · 1088×1920', width: 1088, height: 1920 },
  { label: '16:9 横屏 · 1920×1088', width: 1920, height: 1088 },
  { label: '2:3 竖图 · 1024×1536', width: 1024, height: 1536 },
  { label: '3:2 横图 · 1536×1024', width: 1536, height: 1024 },
  { label: '2:3 竖图 · 832×1216', width: 832, height: 1216 },
  { label: '3:2 横图 · 1216×832', width: 1216, height: 832 },
  { label: '3:4 竖图 · 896×1152', width: 896, height: 1152 },
  { label: '4:3 横图 · 1152×896', width: 1152, height: 896 },
]
