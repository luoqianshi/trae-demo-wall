/**
 * 图表美学风格预设 — 参考 Landing Love、Landbook、Aceternity UI、21st 等设计平台。
 *
 * 每个预设包含：
 *   - plotlyTemplate: Plotly layout 模板 (JSON)
 *   - promptSnippet: 注入 LLM prompt 的美学指导
 *   - description: 中文描述
 */

import type { StyleGuide } from '../../types/shared'

export interface ChartStylePreset {
  id: string
  name: string
  description: string
  /** 注入 LLM prompt 的图表美学指导 */
  promptSnippet: string
  /** Plotly layout 默认模板（JSON 可序列化） */
  plotlyTemplate: Record<string, unknown>
}

// ============================================================
// 预设风格库
// ============================================================

export const CHART_STYLE_PRESETS: ChartStylePreset[] = [
  {
    id: 'minimal-dark',
    name: '极简暗色',
    description: 'Aceternity / 21st 风格：深色背景，霓虹高亮，无衬线字体',
    promptSnippet: `## 图表美学要求（极简暗色风格）

- 配色：深色背景 (#0a0a0a)，亮色数据元素
- 使用 plotly 暗色模板：template='plotly_dark'
- 字体："Inter", "SF Pro Display", "PingFang SC", sans-serif
- 坐标轴：白色细线 (#333)，网格线极淡或不显示
- 数据色：高饱和霓虹色系 (#00d4ff, #ff6b6b, #feca57, #48dbfb, #ff9ff3)
- 图表标题：白色粗体，左对齐，无衬线
- 去除所有 chart border、背景色块
- 数据标签：白色半透明 (rgba(255,255,255,0.7))
- 图例：深色背景，白色文字，无边框
- 整体风格：科技感、现代、干净`,
    plotlyTemplate: {
      template: 'plotly_dark',
      paper_bgcolor: '#0a0a0a',
      plot_bgcolor: '#0a0a0a',
      font: { family: 'Inter, SF Pro Display, PingFang SC, sans-serif', color: '#e5e5e5' },
      colorway: ['#00d4ff', '#ff6b6b', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#5f27cd'],
      margin: { l: 50, r: 30, t: 60, b: 50 },
      xaxis: { gridcolor: '#1a1a1a', linecolor: '#333', zerolinecolor: '#333' },
      yaxis: { gridcolor: '#1a1a1a', linecolor: '#333', zerolinecolor: '#333' },
      title: { font: { size: 18, color: '#fff' }, x: 0 },
      legend: { bgcolor: 'rgba(0,0,0,0.5)', font: { color: '#aaa' } },
    },
  },
  {
    id: 'clean-white',
    name: '清简白底',
    description: 'Landing Love / Landbook 风格：白色背景，衬线标题，细线分割',
    promptSnippet: `## 图表美学要求（清简白底风格）

- 配色：纯白背景 (#ffffff)，深色文字 (#1a1a1a)
- 使用 plotly 白色模板：template='simple_white'
- 标题字体："Tiempos Text", "Charter", "Songti SC", "Noto Serif CJK SC", serif（衬线体）
- 正文字体："Inter", "PingFang SC", "Microsoft YaHei", sans-serif
- 坐标轴：极细线条 (#e5e5e5)，无网格线
- 数据色：低饱和暖色系 (#c2410c, #d97706, #b45309, #92400e, #78350f)
- 图表标题：深色衬线体，左对齐，字号 18px
- 禁止渐变、禁止阴影（仅 0 1px 0 #e5e5e5 模拟边线）
- 禁止 emoji 装饰
- 数据标签：直接标注在数据点旁，减少图例依赖
- 整体风格：编辑感、克制、优雅`,
    plotlyTemplate: {
      template: 'simple_white',
      paper_bgcolor: '#ffffff',
      plot_bgcolor: '#ffffff',
      font: { family: 'Inter, PingFang SC, Microsoft YaHei, sans-serif', color: '#1a1a1a' },
      colorway: ['#c2410c', '#d97706', '#b45309', '#92400e', '#78350f', '#78716c', '#a8a29e'],
      margin: { l: 50, r: 30, t: 60, b: 50 },
      xaxis: { gridcolor: '#f5f5f4', linecolor: '#e7e5e4', zeroline: false },
      yaxis: { gridcolor: '#f5f5f4', linecolor: '#e7e5e4', zeroline: false },
      title: { font: { size: 18, family: 'Tiempos Text, Charter, Songti SC, serif', color: '#1a1a1a' }, x: 0 },
      legend: { bgcolor: 'rgba(255,255,255,0.8)', font: { color: '#78716c' } },
    },
  },
  {
    id: 'data-journal',
    name: '数据新闻',
    description: 'FT / Economist 风格：结构化留白，红黑配色，数据密集',
    promptSnippet: `## 图表美学要求（数据新闻风格）

- 配色：白底 (#fafaf9)，深色文字，强调色使用红色 (#e11d48)
- 使用 plotly 白色模板：template='simple_white'
- 字体："Source Serif Pro", "Charter", "Songti SC", "Noto Serif CJK SC", serif
- 坐标轴：黑色细线 (#333)，水平网格线仅 Y 轴 (#e5e5e5)
- 数据色：红黑灰系列 (#e11d48, #1a1a1a, #78716c, #d6d3d1, #a8a29e)
- 图表标题：粗体衬线，左对齐，2 行以内
- 副标题/注释：小号灰色衬线，放在图表下方
- 数据标签：仅在关键数据点标注，黑色小字
- 强调：用红色标注关键数据点或趋势线
- 图例：放在图表上方，横向排列
- 整体风格：权威、专业、数据驱动`,
    plotlyTemplate: {
      template: 'simple_white',
      paper_bgcolor: '#fafaf9',
      plot_bgcolor: '#fafaf9',
      font: { family: 'Source Serif Pro, Charter, Songti SC, serif', color: '#1a1a1a' },
      colorway: ['#e11d48', '#1a1a1a', '#78716c', '#d6d3d1', '#a8a29e', '#57534e', '#44403c'],
      margin: { l: 50, r: 30, t: 60, b: 60 },
      xaxis: { gridcolor: '#e5e5e5', linecolor: '#333', zeroline: false, showgrid: false },
      yaxis: { gridcolor: '#e5e5e5', linecolor: '#333', zeroline: false },
      title: { font: { size: 16, family: 'Source Serif Pro, Charter, Songti SC, serif', color: '#1a1a1a' }, x: 0 },
      legend: { orientation: 'h', yanchor: 'bottom', y: 1.02, xanchor: 'right', x: 1, font: { color: '#57534e' } },
    },
  },
  {
    id: 'warm-paper',
    name: '暖纸质感',
    description: 'One Page Love 风格：暖色背景，圆润卡片，柔和阴影',
    promptSnippet: `## 图表美学要求（暖纸质感风格）

- 配色：暖米色背景 (#fef7ed)，深棕色文字 (#3c2a1e)
- 使用 plotly 白色模板：template='simple_white'
- 字体："Georgia", "Songti SC", "Noto Serif CJK SC", serif
- 坐标轴：暖棕色细线 (#d4c5b9)，无网格线
- 数据色：暖色系渐变 (#e07b39, #d4a574, #c4956a, #b8865e, #a0704e)
- 图表标题：暖棕色粗体衬线，居中，字号 20px
- 图表背景：微暖色调 (rgba(254,247,237,0.5))
- 数据标签：棕色小字，圆形标记点
- 圆角感：使用较粗的线条和圆角标记
- 图例：底部居中，暖色调
- 整体风格：温暖、手工感、亲切`,
    plotlyTemplate: {
      template: 'simple_white',
      paper_bgcolor: '#fef7ed',
      plot_bgcolor: '#fef7ed',
      font: { family: 'Georgia, Songti SC, Noto Serif CJK SC, serif', color: '#3c2a1e' },
      colorway: ['#e07b39', '#d4a574', '#c4956a', '#b8865e', '#a0704e', '#8b6914', '#6b4c2a'],
      margin: { l: 50, r: 30, t: 60, b: 50 },
      xaxis: { gridcolor: '#f0e6d8', linecolor: '#d4c5b9', zeroline: false },
      yaxis: { gridcolor: '#f0e6d8', linecolor: '#d4c5b9', zeroline: false },
      title: { font: { size: 20, family: 'Georgia, Songti SC, serif', color: '#3c2a1e' }, x: 0.5 },
      legend: { orientation: 'h', yanchor: 'top', y: -0.15, xanchor: 'center', x: 0.5, font: { color: '#6b4c2a' } },
    },
  },
  {
    id: 'modern-glass',
    name: '现代毛玻璃',
    description: 'Linear / Vercel 风格：毛玻璃效果，渐变光影，现代几何',
    promptSnippet: `## 图表美学要求（现代毛玻璃风格）

- 配色：浅灰蓝背景 (#f8fafc)，深蓝灰文字 (#1e293b)
- 使用 plotly 白色模板：template='plotly_white'
- 字体："Inter", "SF Pro Display", "PingFang SC", sans-serif
- 坐标轴：极淡蓝灰 (#e2e8f0)，无网格线
- 数据色：现代蓝紫渐变 (#6366f1, #8b5cf6, #a78bfa, #c4b5fd, #3b82f6)
- 图表标题：深蓝灰无衬线粗体，左对齐，字号 18px
- 使用半透明填充色块 (rgba opacity 0.15-0.25)
- 数据标签：干净的小号无衬线字体
- 标记点：使用半透明圆形，带微边框
- 图例：横向排列，圆角背景
- 整体风格：现代、轻盈、科技`,
    plotlyTemplate: {
      template: 'plotly_white',
      paper_bgcolor: '#f8fafc',
      plot_bgcolor: '#f8fafc',
      font: { family: 'Inter, SF Pro Display, PingFang SC, sans-serif', color: '#1e293b' },
      colorway: ['#6366f1', '#8b5cf6', '#a78bfa', '#c4b5fd', '#3b82f6', '#06b6d4', '#14b8a6'],
      margin: { l: 50, r: 30, t: 60, b: 50 },
      xaxis: { gridcolor: '#f1f5f9', linecolor: '#e2e8f0', zeroline: false },
      yaxis: { gridcolor: '#f1f5f9', linecolor: '#e2e8f0', zeroline: false },
      title: { font: { size: 18, color: '#0f172a' }, x: 0 },
      legend: { bgcolor: 'rgba(255,255,255,0.8)', bordercolor: '#e2e8f0', borderwidth: 1, font: { color: '#64748b' } },
    },
  },
]

/** 获取指定 ID 的风格预设 */
export function getStylePreset(id: string): ChartStylePreset | undefined {
  return CHART_STYLE_PRESETS.find((s) => s.id === id)
}

/** 默认风格 ID */
export const DEFAULT_STYLE_ID = 'clean-white'

/** 旧版兼容：全局 StyleGuide 常量（agents/index.ts 的 SharedStore 使用） */

export const STYLE_GUIDE: StyleGuide = {
  motto: '清晰、克制、以数据为中心',
  theme: {
    bg: '#ffffff',
    ink: '#1a1a1a',
    accent: '#c2410c',
    rule: '#e5e5e5',
    fontSerif: 'Tiempos Text, Charter, Songti SC, Noto Serif CJK SC, serif',
    fontSans: 'Inter, PingFang SC, Microsoft YaHei, sans-serif',
    fontMono: 'JetBrains Mono, SF Mono, Consolas, monospace',
  },
  rules: [
    '禁止渐变填充',
    '禁止阴影特效',
    '禁止 emoji 装饰',
    '数据标签直接标注，减少图例',
    '标题用衬线体，正文用无衬线',
  ],
  chartPrinciples: [
    '每个图表只传达一个核心信息',
    '坐标轴从 0 开始（除非有合理理由）',
    '颜色不超过 5 种',
    '避免 3D 效果',
    '图例放在图表上方或右侧',
  ],
}