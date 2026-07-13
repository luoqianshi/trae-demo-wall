import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useRouterState } from '@tanstack/react-router'
import { toast } from 'sonner'
import {
  Archive,
  Check,
  ChevronDown,
  ChevronUp,
  FolderOpen,
  Highlighter,
  Loader2,
  Mic,
  Music,
  PanelRightClose,
  PanelRightOpen,
  Paperclip,
  Play,
  Plus,
  Save,
  SlidersHorizontal,
  Sparkles,
  Trash2,
  Wand2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils'
import {
  addAiMusicLyricVersion,
  addAiMusicProject,
  addAiMusicAudio,
  deleteAiMusicProject,
  deleteAiMusicAudio,
  listAiMusicAudios,
  listAiMusicLyricVersions,
  listAiMusicProjects,
  loadAiMusicWorkflowGraph,
  runAiMusicWorkflow,
  updateAiMusicProject,
  type AiMusicAudio,
  type AiMusicLyricVersion,
  type AiMusicProject,
  type WorkflowGraph,
} from './api'
import { ACE_MUSIC_WORKFLOW_ID, LYRIC_WORKFLOW_ID } from './constants'
import {
  buildLyricGenerateInput,
  createLineDiff,
  mapCurrentLinesToDiff,
  isPromptInstruction,
  lyricDataToPlainText,
  lyricDataToJson,
  normalizePlainLyricText,
  parseGeneratedLyric,
  parseLyricData,
  parseRewriteCandidates,
  plainTextToLyricData,
  replaceLineText,
  type LyricCandidate,
  type LyricData,
  type LyricSelection,
  type DiffRow,
} from './utils'
import { comfyuiApi, parseParams, type ComfyParam, type ComfyWorkflow } from '@/features/comfyui/api/comfyui-api'

const versionColors = ['bg-primary', 'bg-chart-2', 'bg-chart-4', 'bg-chart-5', 'bg-muted-foreground']

const styleOptions = ['流行 Pop', '摇滚 Rock', '民谣 Folk', '电子 Electronic']
const moodOptions = ['温暖', '伤感', '明亮', '克制']
const languageOptions = ['中文', '英文', '中英混合']

interface CategoryDropdownProps {
  label: string
  value: string
  options: string[]
  onChange: (value: string) => void
}

const buildDefaultProjectPayload = (title: string) => ({
  title,
  description: 'AI音乐创作项目',
  style: '流行 Pop',
  mood: '温暖',
  language: '中文',
  lyricWorkflowId: LYRIC_WORKFLOW_ID,
  currentLyric: '',
})

function VersionDot({ className }: { className: string }) {
  return <span className={cn('inline-flex size-2.5 rounded-full', className)} />
}

function CategoryDropdown({ label, value, options, onChange }: CategoryDropdownProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant='outline' size='sm' className='h-9 rounded-xl border-neutral-200 bg-white px-3 text-xs text-neutral-700 shadow-none hover:bg-neutral-50'>
          <SlidersHorizontal size={14} />
          {label}：{value}
          <ChevronDown size={13} className='text-neutral-400' />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align='start' className='w-40'>
        {options.map((option) => (
          <DropdownMenuItem key={option} onClick={() => onChange(option)} className='text-xs'>
            {option === value ? <Check size={13} /> : <span className='w-[13px]' />}
            {option}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface CreativeInputBoxProps {
  inputOpen: boolean
  style: string
  mood: string
  language: string
  extra: string
  generateRunning: boolean
  workflowLoading: boolean
  selectedProject: AiMusicProject | null
  onOpenChange: (open: boolean) => void
  onStyleChange: (value: string) => void
  onMoodChange: (value: string) => void
  onLanguageChange: (value: string) => void
  onExtraChange: (value: string) => void
  onGenerate: () => void
}

function CreativeInputBox({
  inputOpen,
  style,
  mood,
  language,
  extra,
  generateRunning,
  workflowLoading,
  selectedProject,
  onOpenChange,
  onStyleChange,
  onMoodChange,
  onLanguageChange,
  onExtraChange,
  onGenerate,
}: CreativeInputBoxProps) {
  return (
    <Collapsible open={inputOpen} onOpenChange={onOpenChange}>
      <div className='rounded-[28px] border border-neutral-200 bg-white shadow-[0_14px_60px_rgba(15,23,42,0.08)]'>
        <div className='flex h-14 items-center justify-between gap-4 px-5'>
          <div className='flex min-w-0 items-center gap-2'>
            <h2 className='m-0 flex items-center text-lg font-semibold leading-none tracking-tight'>开启你的 <span className='mx-1 text-cyan-600'>工作流模式</span> 即刻造梦！</h2>
            <Badge variant='secondary' className='rounded-full'>作词家</Badge>
          </div>
          <CollapsibleTrigger asChild>
            <Button variant='ghost' size='sm' className='h-8 rounded-xl text-xs text-neutral-500 hover:bg-neutral-100'>
              {inputOpen ? '收起' : '展开'}
              {inputOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </Button>
          </CollapsibleTrigger>
        </div>

        <CollapsibleContent>
          <div className='flex min-h-[132px] gap-4 px-5 pt-4'>
            <button type='button' className='flex h-16 w-12 shrink-0 -rotate-6 items-center justify-center rounded-sm border bg-neutral-50 text-neutral-400 shadow-sm transition-colors hover:bg-neutral-100'>
              <Paperclip size={18} />
            </button>
            <Textarea
              value={extra}
              onChange={(event) => onExtraChange(event.target.value)}
              placeholder='输入想法、脚本或上传参考，支持 “/” 使用技能，@ 添加主体，和 Agent 一起创作'
              className='min-h-[118px] flex-1 resize-none border-0 bg-transparent px-0 text-sm leading-7 shadow-none focus-visible:ring-0'
            />
          </div>
          <div className='flex flex-wrap items-center justify-between gap-3 px-5 pb-4 pt-3'>
            <div className='flex flex-wrap items-center gap-2'>
              <Button variant='outline' size='sm' className='h-9 rounded-xl border-cyan-100 bg-cyan-50 px-3 text-xs text-cyan-700 shadow-none hover:bg-cyan-100'>
                <Sparkles size={14} />
                工作流模式
                <ChevronDown size={13} />
              </Button>
              <CategoryDropdown label='曲风' value={style} options={styleOptions} onChange={onStyleChange} />
              <CategoryDropdown label='情绪' value={mood} options={moodOptions} onChange={onMoodChange} />
              <CategoryDropdown label='语言' value={language} options={languageOptions} onChange={onLanguageChange} />
            </div>
            <div className='flex items-center gap-2'>
              <Button variant='ghost' size='icon' className='size-9 rounded-full text-neutral-400 hover:text-neutral-700'>
                <Mic size={17} />
              </Button>
              <Button
                onClick={onGenerate}
                disabled={workflowLoading || generateRunning || !selectedProject}
                size='icon'
                className='size-9 rounded-full bg-neutral-900 text-white hover:bg-black'
              >
                {generateRunning ? <Loader2 className='animate-spin' size={17} /> : <Sparkles size={17} />}
              </Button>
            </div>
          </div>
        </CollapsibleContent>
      </div>
    </Collapsible>
  )
}

interface LyricCanvasProps {
  lyricData: LyricData
  onChange: (value: LyricData) => void
  onSelectionChange: (selection: LyricSelection | null) => void
  lineDiffTypes: Array<'keep' | 'add' | 'change'>
  showDiff: boolean
}

function LyricCanvas({ lyricData, onChange, onSelectionChange, lineDiffTypes, showDiff }: LyricCanvasProps) {
  const [editingLineId, setEditingLineId] = useState<number | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const containerRef = useRef<HTMLDivElement>(null)

  const handleMouseUp = () => {
    const sel = window.getSelection()
    if (!containerRef.current) return

    // 如果没有有效选区，检查点击是否在 LyricCanvas 内部
    if (!sel || sel.isCollapsed || !sel.toString().trim()) {
      return // 不清空已有选区，让用户可以点击候选面板而不丢失选区
    }

    const text = sel.toString().trim()

    const range = sel.getRangeAt(0)

    // 找选区起止所在的行元素
    const findLineElement = (node: Node): HTMLElement | null => {
      let current: Node | null = node
      while (current && current !== containerRef.current) {
        if (current instanceof HTMLElement && current.dataset.lineId) return current
        current = current.parentElement
      }
      return null
    }

    const startLineEl = findLineElement(range.startContainer)
    if (!startLineEl) {
      return // 选区不在歌词行内，保留已有选区
    }

    const lineId = Number(startLineEl.dataset.lineId)
    const lineData = lyricData.lines.find(l => l.id === lineId)
    if (!lineData) {
      onSelectionChange(null)
      return
    }

    // 计算行内起始偏移
    const startLineRange = document.createRange()
    startLineRange.selectNodeContents(startLineEl)
    startLineRange.setEnd(range.startContainer, range.startOffset)
    const startInLine = startLineRange.toString().length

    // 判断是否跨行
    const endLineEl = findLineElement(range.endContainer)
    const isMultiLine = endLineEl !== null && endLineEl !== startLineEl

    if (isMultiLine) {
      // 多行选区：取起止行之间的所有行文本
      const startLineIndex = lyricData.lines.findIndex(l => l.id === lineId)
      const endLineId = Number(endLineEl!.dataset.lineId)
      const endLineIndex = lyricData.lines.findIndex(l => l.id === endLineId)
      if (startLineIndex === -1 || endLineIndex === -1) {
        onSelectionChange(null)
        return
      }
      const selectedText = lyricData.lines
        .slice(startLineIndex, endLineIndex + 1)
        .map(l => l.text)
        .join('\n')
      onSelectionChange({ lineId, startInLine, endInLine: lineData.text.length, text: selectedText })
    } else {
      // 单行选区
      const endLineRange = document.createRange()
      endLineRange.selectNodeContents(startLineEl)
      endLineRange.setEnd(range.endContainer, range.endOffset)
      const endInLine = endLineRange.toString().length

      if (startInLine > lineData.text.length || endInLine > lineData.text.length) {
        onSelectionChange(null)
        return
      }

      onSelectionChange({ lineId, startInLine, endInLine, text: lineData.text.slice(startInLine, endInLine) })
    }
  }

  const handleDoubleClick = (lineId: number) => {
    setEditingLineId(lineId)
    const line = lyricData.lines.find(l => l.id === lineId)
    setEditDraft(line?.text || '')
  }

  const commitEdit = () => {
    if (editingLineId === null) return
    onChange(prev => ({
      lines: prev.lines.map(l => l.id === editingLineId ? { ...l, text: editDraft } : l)
    }))
    setEditingLineId(null)
    setEditDraft('')
  }

  const isSectionTitle = (line: string) => /^\s*\[[^\]]+\]\s*$/.test(line)

  return (
    <div
      ref={containerRef}
      className='min-h-[520px] select-text rounded-lg border bg-white p-4 font-mono text-sm leading-8'
      onMouseDown={() => onSelectionChange(null)}
      onMouseUp={handleMouseUp}
    >
      {lyricData.lines.length === 0 ? (
        <div className='flex h-[480px] items-center justify-center text-muted-foreground'>
          点击上方"开始创作"生成歌词，或点击"编辑歌词"直接输入
        </div>
      ) : lyricData.lines.map((line) => {
        const lineIndex = lyricData.lines.indexOf(line)
        const diffType = showDiff ? lineDiffTypes[lineIndex] : null
        const section = isSectionTitle(line.text)

        if (editingLineId === line.id) {
          return (
            <input
              key={`edit-${line.id}`}
              autoFocus
              value={editDraft}
              onChange={(e) => setEditDraft(e.target.value)}
              onBlur={commitEdit}
              onKeyDown={(e) => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingLineId(null) }}
              className='w-full border-b border-primary bg-primary/5 px-1 font-mono text-sm outline-none'
            />
          )
        }

        return (
          <div
            key={`line-${line.id}`}
            data-line-id={line.id}
            onDoubleClick={() => handleDoubleClick(line.id)}
            className={cn(
              'cursor-text rounded px-1 transition-colors hover:bg-muted/40',
              section && 'mt-4 text-xs font-bold uppercase tracking-wider text-neutral-400',
              !section && 'text-neutral-800',
              diffType === 'add' && 'bg-primary/10 underline decoration-primary/40',
              diffType === 'change' && 'bg-primary/10',
            )}
          >
            {line.text || '\u00A0'}
          </div>
        )
      })}
    </div>
  )
}

/**
 * 向工作流图中的格式检验器节点注入 context_text 字段
 */
const patchValidatorNode = (graph: WorkflowGraph, selectedText: string): WorkflowGraph => {
  const nodes = graph.nodes.map((node) => {
    if (node.data?.type === 'FormatValidator' || node.data?.type === 'LyricRewriteValidator') {
      const patchedData = { ...node.data }
      const values = { ...(patchedData.values ?? {}) }
      // 新字段名 context_text，兼容旧字段 selected_text
      values.context_text = selectedText
      values.selected_text = selectedText
      const nodeDef = patchedData.node ?? {}
      const template = { ...(nodeDef.template ?? {}) }
      if (template.context_text) {
        template.context_text = { ...template.context_text, value: selectedText }
      }
      if (template.selected_text) {
        template.selected_text = { ...template.selected_text, value: selectedText }
      }
      patchedData.values = values
      patchedData.node = { ...nodeDef, template }
      return { ...node, data: patchedData }
    }
    return node
  })
  return { ...graph, nodes }
}

/**
 * 解析格式检验器（FormatValidator）节点输出的结构化 JSON
 */
const parseValidatorOutput = (outputText: string, selectedText?: string): LyricCandidate[] => {
  const maxLen = Math.max((selectedText?.length ?? 4) * 3, 20)

  /** 从候选元素中提取 content 和 title */
  const mapCandidateItem = (c: unknown, i: number): LyricCandidate | null => {
    if (c != null && typeof c === 'object' && 'content' in c) {
      const obj = c as { title?: string; content?: string }
      if (!obj.content?.trim()) return null
      const content = normalizePlainLyricText(obj.content.replace(/\n/g, ' ').trim(), 'candidate')
      return { title: obj.title || `候选 ${i + 1}`, content }
    }
    const content = normalizePlainLyricText(String(c).trim(), 'candidate')
    return { title: `候选 ${i + 1}`, content }
  }

  // 0. 优先尝试 JSON 格式（FormatValidator 结构化输出 或 LLM 直接 JSON 输出）
  const jsonStr = extractJsonFromText(outputText)
  if (jsonStr) {
    try {
      const parsed = JSON.parse(jsonStr)
      // 格式1: {"candidates": [...]} — 支持字符串和对象两种候选项
      if (parsed?.candidates && Array.isArray(parsed.candidates)) {
        return parsed.candidates
          .map(mapCandidateItem)
          .filter((c): c is LyricCandidate => c !== null)
          .filter((c) => isValidCandidateContent(c.content, maxLen, selectedText))
      }
      // 格式2: ["c1", "c2", "c3"]
      if (Array.isArray(parsed)) {
        return parsed
          .map(mapCandidateItem)
          .filter((c): c is LyricCandidate => c !== null)
          .filter((c) => isValidCandidateContent(c.content, maxLen, selectedText))
      }
    } catch {
      // JSON 解析失败，继续回退
    }
  }

  // 1. 回退到旧的文本解析
  return parseRewriteCandidates(outputText)
}

/** 从 LLM 输出中提取 JSON 字符串 */
const extractJsonFromText = (text: string): string | null => {
  const trimmed = text.trim()
  if ((trimmed.startsWith('{') && trimmed.endsWith('}')) ||
      (trimmed.startsWith('[') && trimmed.endsWith(']'))) {
    return trimmed
  }
  const braceStart = trimmed.indexOf('{')
  const bracketStart = trimmed.indexOf('[')
  let start = -1
  if (braceStart >= 0 && bracketStart >= 0) start = Math.min(braceStart, bracketStart)
  else if (braceStart >= 0) start = braceStart
  else if (bracketStart >= 0) start = bracketStart
  if (start < 0) return null

  const openChar = trimmed[start]
  const closeChar = openChar === '{' ? '}' : ']'
  let depth = 0
  for (let i = start; i < trimmed.length; i++) {
    if (trimmed[i] === openChar) depth++
    else if (trimmed[i] === closeChar) depth--
    if (depth === 0) return trimmed.slice(start, i + 1)
  }
  return null
}

/** 校验候选内容是否有效 */
const isValidCandidateContent = (content: string, maxLen: number, selectedText?: string): boolean => {
  if (!content) return false
  if (isPromptInstruction(content)) return false
  if (/^\[[^\]]+\]$/.test(content.trim())) return false
  // 多行选区对应多行候选，maxLen 放宽到 5 倍
  if (content.length > maxLen * 2) return false
  if (selectedText && content.includes(selectedText) && content.length <= selectedText.length + 4) return false
  return true
}

const STORAGE_KEY_PROJECT = 'ai-music-selected-project'
const VALID_TABS = ['lyrics', 'versions', 'music'] as const
type TabValue = (typeof VALID_TABS)[number]

function AiMusicPage({ tab: routeTab, projectId: routeProjectId }: { tab?: string; projectId?: string }) {
  const navigate = useNavigate()
  const [projects, setProjects] = useState<AiMusicProject[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    routeProjectId ?? localStorage.getItem(STORAGE_KEY_PROJECT) ?? null
  )
  const [activeTab, setActiveTab] = useState<TabValue>(
    VALID_TABS.includes(routeTab as TabValue) ? (routeTab as TabValue) : 'lyrics'
  )
  const activeTabRef = useRef(activeTab)
  activeTabRef.current = activeTab
  const [projectLoading, setProjectLoading] = useState(false)
  const [projectSaving, setProjectSaving] = useState(false)
  const [creating, setCreating] = useState(false)
  const [newProjectName, setNewProjectName] = useState('')
  const [editingName, setEditingName] = useState(false)
  const [nameDraft, setNameDraft] = useState('')
  const [workflowGraph, setWorkflowGraph] = useState<WorkflowGraph | null>(null)
  const [workflowLoading, setWorkflowLoading] = useState(true)
  const [runningType, setRunningType] = useState<'generate' | 'rewrite' | null>(null)
  const [style, setStyle] = useState('流行 Pop')
  const [mood, setMood] = useState('温暖')
  const [language, setLanguage] = useState('中文')
  const [extra, setExtra] = useState('主歌要有画面感，副歌要适合重复演唱，歌词不要太口水。')
  const [inputOpen, setInputOpen] = useState(true)
  const [lyricData, setLyricData] = useState<LyricData>({ lines: [] })
  const [hasHadLyrics, setHasHadLyrics] = useState(false)
  const [rewriteInstruction, setRewriteInstruction] = useState('改得更有画面感，更适合副歌重复。')
  const [selection, setSelection] = useState<LyricSelection | null>(null)
  const [rewriteSelection, setRewriteSelection] = useState<LyricSelection | null>(null)
  const [candidates, setCandidates] = useState<LyricCandidate[]>([])
  const [selectedCandidate, setSelectedCandidate] = useState('0')
  const [candidatePanelOpen, setCandidatePanelOpen] = useState(true)
  const [versions, setVersions] = useState<AiMusicLyricVersion[]>([])
  const [showDiff, setShowDiff] = useState(true)
  const [selectedVersionId, setSelectedVersionId] = useState<string | null>(null)
  const [editingFullLyric, setEditingFullLyric] = useState(false)
  const [editFullDraft, setEditFullDraft] = useState('')

  // 音乐生成状态
  const [musicWorkflow, setMusicWorkflow] = useState<ComfyWorkflow | null>(null)
  const [musicParams, setMusicParams] = useState<ComfyParam[]>([])
  const [musicParamValues, setMusicParamValues] = useState<Record<string, unknown>>({})
  const [musicRunning, setMusicRunning] = useState(false)
  const [musicProgress, setMusicProgress] = useState(0)
  const [musicProgressLabel, setMusicProgressLabel] = useState('')
  const [audioUrls, setAudioUrls] = useState<string[]>([])
  const [showMusicAdvanced, setShowMusicAdvanced] = useState(false)
  const [audioRecords, setAudioRecords] = useState<AiMusicAudio[]>([])

  // 歌词有内容后自动收缩输入框
  const lyricText = lyricDataToPlainText(lyricData)
  useEffect(() => {
    if (!hasHadLyrics && lyricText.trim().length > 0) {
      setHasHadLyrics(true)
      setInputOpen(false)
    }
  }, [lyricText, hasHadLyrics])

  const selectedProject = useMemo(() => {
    return projects.find((project) => project.id === selectedProjectId) ?? null
  }, [projects, selectedProjectId])

  const selectedCandidateItem = candidates[Number(selectedCandidate)]
  const latestVersion = versions.length > 0 ? versions[versions.length - 1] : undefined
  const selectedVersionDetail = versions.find((v) => v.id === selectedVersionId)

  const getNextMajorVersionName = () => {
    const majorCount = versions.filter((v) => /^\d+(\.0+)?$/.test(String(v.versionNo))).length
    return `V${majorCount + 1}`
  }

  const getCurrentVersionName = () => {
    if (versions.length === 0) return 'V0'
    const last = versions[versions.length - 1]
    return `V${last.versionNo}`
  }

  // 获取当前大版本号（如 1、2）
  const getCurrentMajorNo = () => {
    const majorCount = versions.filter((v) => /^\d+(\.0+)?$/.test(String(v.versionNo))).length
    return majorCount > 0 ? majorCount : 1
  }

  const lineDiffTypes = useMemo(() => {
    if (!latestVersion) return []
    return mapCurrentLinesToDiff(latestVersion.content, lyricDataToPlainText(lyricData))
  }, [latestVersion, lyricData])

  // 版本总览：始终显示选中版（或最新版）的歌词，与 V1 做差异对比
  const versionOverviewDiff = useMemo(() => {
    const firstVersion = versions.find((v) => /^\d+(\.0+)?$/.test(String(v.versionNo)))
    const compareTo = selectedVersionDetail ?? latestVersion
    if (!compareTo) return []
    // 只有一个版本或 V1 不存在时，直接显示该版本歌词（全部 keep）
    if (!firstVersion || compareTo.id === firstVersion.id) {
      return compareTo.content.split('\n')
        .filter((line: string) => line.trim())
        .map((line: string) => ({ type: 'keep' as const, line, before: '', after: '' }))
    }
    return createLineDiff(firstVersion.content, compareTo.content)
  }, [versions, selectedVersionDetail, latestVersion])

  const syncProjectToForm = useCallback((project: AiMusicProject | null) => {
    if (!project) {
      setStyle('流行 Pop')
      setMood('温暖')
      setLanguage('中文')
      setLyricData({ lines: [] })
      setNameDraft('')
      setVersions([])
      setHasHadLyrics(false)
      setInputOpen(true)
      return
    }
    setStyle(project.style || '流行 Pop')
    setMood(project.mood || '温暖')
    setLanguage(project.language || '中文')
    setLyricData(project.currentLyric ? parseLyricData(project.currentLyric) : { lines: [] })
    setNameDraft(project.title)
    setCandidates([])
    setVersions([])
    setSelection(null)
    setRewriteSelection(null)
    // 已有歌词的项目：自动收缩输入框
    if (project.currentLyric && project.currentLyric.trim().length > 0) {
      setHasHadLyrics(true)
      setInputOpen(false)
    } else {
      setHasHadLyrics(false)
      setInputOpen(true)
    }
  }, [])

  const syncProjectToUrl = useCallback((id: string | null) => {
    if (id) {
      localStorage.setItem(STORAGE_KEY_PROJECT, id)
    } else {
      localStorage.removeItem(STORAGE_KEY_PROJECT)
    }
    navigate({
      to: '/ai-music',
      search: { projectId: id ?? undefined, tab: activeTabRef.current },
      replace: true,
    })
  }, [navigate])

  const reloadProjects = useCallback(async () => {
    setProjectLoading(true)
    try {
      const page = await listAiMusicProjects()
      setProjects(page.records)
      // 优先恢复：路由参数 > localStorage > 当前选中 > 列表第一个
      const savedId = localStorage.getItem(STORAGE_KEY_PROJECT)
      const restoreId = [routeProjectId, savedId].find((id) => id && page.records.some((p) => p.id === id)) ?? null
      if (restoreId) {
        setSelectedProjectId(restoreId)
        localStorage.setItem(STORAGE_KEY_PROJECT, restoreId)
        // URL 与实际选中项目不一致时，同步 URL
        if (routeProjectId !== restoreId) {
          navigate({ to: '/ai-music', search: { projectId: restoreId, tab: activeTabRef.current }, replace: true })
        }
      } else {
        const fallbackId = page.records[0]?.id ?? null
        setSelectedProjectId((current) => current && page.records.some((project) => project.id === current) ? current : fallbackId)
        if (fallbackId) {
          localStorage.setItem(STORAGE_KEY_PROJECT, fallbackId)
        }
      }
    } catch (error) {
      toast.error(`音乐项目加载失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setProjectLoading(false)
    }
  }, [routeProjectId, navigate])

  useEffect(() => {
    void reloadProjects()
  }, [reloadProjects])

  useEffect(() => {
    syncProjectToForm(selectedProject)
  }, [selectedProject, syncProjectToForm])

  useEffect(() => {
    if (!selectedProject?.id) return
    let ignore = false

    const loadVersions = async () => {
      try {
        const versionList = await listAiMusicLyricVersions(selectedProject.id)
        if (!ignore) setVersions(versionList)
      } catch (error) {
        if (!ignore) toast.error(`歌词版本加载失败：${error instanceof Error ? error.message : '未知错误'}`)
      }
    }

    void loadVersions()

    return () => {
      ignore = true
    }
  }, [selectedProject?.id])

  // 加载项目音频列表
  useEffect(() => {
    if (!selectedProject?.id) {
      setAudioRecords([])
      return
    }
    let ignore = false
    const loadAudios = async () => {
      try {
        const list = await listAiMusicAudios(selectedProject.id)
        if (!ignore) setAudioRecords(list)
      } catch {
        if (!ignore) setAudioRecords([])
      }
    }
    void loadAudios()
    return () => { ignore = true }
  }, [selectedProject?.id])

  // 加载音乐生成工作流参数
  useEffect(() => {
    let ignore = false
    const loadMusicWorkflow = async () => {
      try {
        const wf = await comfyuiApi.get(ACE_MUSIC_WORKFLOW_ID)
        if (ignore) return
        setMusicWorkflow(wf)
        const params = parseParams(wf.paramSchema)
        setMusicParams(params)
        // 初始化默认值
        try {
          const defaults = JSON.parse(wf.paramValues) as Record<string, unknown>
          const values: Record<string, unknown> = {}
          for (const p of params) {
            const key = `${p.nodeId}.${p.paramName}`
            // tags 和 lyrics 默认为空，由用户填写
            if (p.paramName === 'tags' || p.paramName === 'lyrics') {
              values[key] = ''
            } else {
              values[key] = defaults[key] ?? p.value
            }
          }
          setMusicParamValues(values)
        } catch {
          const values: Record<string, unknown> = {}
          for (const p of params) values[`${p.nodeId}.${p.paramName}`] = p.value
          setMusicParamValues(values)
        }
      } catch {
        if (!ignore) setMusicWorkflow(null)
      }
    }
    void loadMusicWorkflow()
    return () => { ignore = true }
  }, [])

  useEffect(() => {
    let ignore = false

    const loadWorkflow = async () => {
      try {
        setWorkflowLoading(true)
        const { graph } = await loadAiMusicWorkflowGraph(LYRIC_WORKFLOW_ID)
        if (ignore) return
        setWorkflowGraph(graph)
      } catch (error) {
        if (ignore) return
        toast.error(`加载作词家工作流失败：${error instanceof Error ? error.message : '未知错误'}`)
      } finally {
        if (!ignore) setWorkflowLoading(false)
      }
    }

    loadWorkflow()

    return () => {
      ignore = true
    }
  }, [])

  const ensureWorkflowReady = () => {
    if (!workflowGraph) {
      toast.error('作词家工作流还没有加载完成')
      return false
    }
    return true
  }

  const handleGenerateMusic = async () => {
    if (!musicWorkflow) {
      toast.error('音乐生成工作流未加载')
      return
    }
    // 自动填入当前歌词
    const currentLyricText = lyricDataToPlainText(lyricData)
    const values = { ...musicParamValues }
    // 把当前歌词和风格标签自动填入（如果用户没有手动填过）
    const tagsKey = musicParams.find((p) => p.paramName === 'tags')
      ? `${musicParams.find((p) => p.paramName === 'tags')!.nodeId}.tags`
      : null
    const lyricsKey = musicParams.find((p) => p.paramName === 'lyrics')
      ? `${musicParams.find((p) => p.paramName === 'lyrics')!.nodeId}.lyrics`
      : null
    if (lyricsKey && !values[lyricsKey]) {
      values[lyricsKey] = currentLyricText
    }
    if (tagsKey && !values[tagsKey]) {
      // 用项目的风格作为默认 tags
      values[tagsKey] = selectedProject?.style || ''
    }

    setMusicRunning(true)
    setMusicProgress(0)
    setMusicProgressLabel('提交中...')
    setAudioUrls([])
    try {
      const taskId = await comfyuiApi.submit(musicWorkflow.id, values)
      setMusicProgressLabel('音频生成中...')
      for (;;) {
        await new Promise((r) => setTimeout(r, 1000))
        const p = await comfyuiApi.progress(taskId)
        if (p.status === 'running') {
          setMusicProgress(p.max > 0 ? p.percent : 0)
          setMusicProgressLabel(p.max > 0 ? `音频生成中 ${p.percent}%` : '加载模型中...')
        } else if (p.status === 'done') {
          setAudioUrls(p.urls ?? [])
          setMusicProgress(100)
          setMusicProgressLabel('生成完成')
          toast.success(`音频生成成功，共 ${(p.urls ?? []).length} 个文件`)
          // 保存音频到项目
          if (selectedProject && (p.urls ?? []).length > 0) {
            const currentLyricText = lyricDataToPlainText(lyricData)
            const tagsParam = musicParams.find((mp) => mp.paramName === 'tags')
            const tagsValue = tagsParam ? String(musicParamValues[`${tagsParam.nodeId}.tags`] ?? '') : ''
            const secondsParam = musicParams.find((mp) => mp.paramName === 'seconds')
            const secondsValue = secondsParam ? Number(musicParamValues[`${secondsParam.nodeId}.seconds`] ?? 0) : 0
            for (const url of p.urls ?? []) {
              try {
                await addAiMusicAudio({
                  projectId: selectedProject.id,
                  audioUrl: url,
                  title: `${selectedProject.title} - 音频`,
                  durationSeconds: secondsValue || undefined,
                  styleTags: tagsValue || undefined,
                  lyricsSummary: currentLyricText.slice(0, 200) || undefined,
                })
              } catch {
                // 保存失败不影响用户体验
              }
            }
            // 刷新音频列表
            try {
              const list = await listAiMusicAudios(selectedProject.id)
              setAudioRecords(list)
            } catch { /* ignore */ }
          }
          break
        } else {
          setMusicProgressLabel(`生成失败: ${p.message || '未知错误'}`)
          toast.error(`音频生成失败: ${p.message || '未知错误'}`)
          break
        }
      }
    } catch (error) {
      toast.error(`音频生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
      setMusicProgressLabel('生成失败')
    } finally {
      setMusicRunning(false)
    }
  }

  const commitCreateProject = async () => {
    setCreating(true)
    try {
      const title = newProjectName.trim() || `音乐项目 ${projects.length + 1}`
      const id = await addAiMusicProject(buildDefaultProjectPayload(title))
      setNewProjectName('')
      setCreating(false)
      await reloadProjects()
      setSelectedProjectId(id)
      syncProjectToUrl(id)
      toast.success('音乐项目已创建')
    } catch (error) {
      toast.error(`创建失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setCreating(false)
    }
  }

  const handleOpenProject = (id: string) => {
    setSelectedProjectId(id)
    syncProjectToUrl(id)
  }

  const handleDeleteProject = async (id: string) => {
    try {
      await deleteAiMusicProject(id)
      toast.success('音乐项目已删除')
      // 如果删除的是当前选中项目，立即清除 localStorage
      if (selectedProjectId === id) {
        localStorage.removeItem(STORAGE_KEY_PROJECT)
      }
      await reloadProjects()
    } catch (error) {
      toast.error(`删除失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleRenameCurrent = async (title: string) => {
    if (!selectedProject) return
    const nextTitle = title.trim() || selectedProject.title
    setProjectSaving(true)
    try {
      await updateAiMusicProject({ id: selectedProject.id, title: nextTitle })
      setProjects((current) => current.map((project) => project.id === selectedProject.id ? { ...project, title: nextTitle } : project))
      toast.success('项目名称已更新')
    } catch (error) {
      toast.error(`重命名失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setProjectSaving(false)
    }
  }

  const handleSaveCurrentProject = async () => {
    if (!selectedProject) {
      toast.error('请先选择音乐项目')
      return
    }
    setProjectSaving(true)
    try {
      await updateAiMusicProject({
        id: selectedProject.id,
        style,
        mood,
        language,
        currentLyric: lyricDataToJson(lyricData),
        lyricWorkflowId: LYRIC_WORKFLOW_ID,
      })
      setProjects((current) => current.map((project) => project.id === selectedProject.id ? {
        ...project,
        style,
        mood,
        language,
        currentLyric: lyricDataToJson(lyricData),
        lyricWorkflowId: LYRIC_WORKFLOW_ID,
      } : project))
      toast.success('音乐项目已保存')
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setProjectSaving(false)
    }
  }

  const handleGenerateLyric = async () => {
    if (!ensureWorkflowReady() || !workflowGraph) return

    setRunningType('generate')
    try {
      const prompt = extra.trim()
      if (!prompt) {
        toast.error('请先输入创作内容')
        return
      }
      const inputValue = buildLyricGenerateInput({ prompt, style, mood, language })
      const result = await runAiMusicWorkflow({
        workflowId: LYRIC_WORKFLOW_ID,
        inputValue,
        graph: workflowGraph,
      })
      const parsed = parseGeneratedLyric(result.outputText)
      const newLyricData = plainTextToLyricData(parsed.lyric)
      setLyricData(newLyricData)
      setProjects((current) => current.map((project) => project.id === selectedProject?.id ? { ...project, currentLyric: lyricDataToJson(newLyricData) } : project))
      if (selectedProject) {
        await updateAiMusicProject({
          id: selectedProject.id,
          style,
          mood,
          language,
          currentLyric: lyricDataToJson(newLyricData),
          lyricWorkflowId: LYRIC_WORKFLOW_ID,
        })
      }
      setCandidates([])
      setSelectedCandidate('0')
      toast.success('歌词已生成并保存到项目')
    } catch (error) {
      toast.error(`歌词生成失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setRunningType(null)
    }
  }

  const runRewriteWorkflow = async (instruction: string) => {
    if (!ensureWorkflowReady() || !workflowGraph) return
    if (!selection?.text.trim()) {
      toast.error('请先在歌词编辑器里选中要改写的歌词片段')
      return
    }

    setRunningType('rewrite')
    try {
      const fullLyric = lyricDataToPlainText(lyricData)
      const selectedText = selection.text

      // 构造 JSON 对象输入，ObjectInput 节点会解析为独立变量
      const inputValue = JSON.stringify({
        selected_text: selectedText,
        instruction,
        full_lyrics: fullLyric,
      })

      const patchedGraph = patchValidatorNode(workflowGraph, selection.text)

      const result = await runAiMusicWorkflow({
        workflowId: LYRIC_WORKFLOW_ID,
        inputValue,
        graph: patchedGraph,
      })

      const nextCandidates = parseValidatorOutput(result.outputText, selection.text)
      setCandidates(nextCandidates)
      setSelectedCandidate('0')
      setRewriteSelection(selection)
      setCandidatePanelOpen(true)
      toast.success(`已生成 ${nextCandidates.length} 个修改候选`)
    } catch (error) {
      toast.error(`局部改写失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setRunningType(null)
    }
  }

  const handleRewriteSelection = async () => {
    if (!rewriteInstruction.trim()) {
      toast.error('请输入局部改写要求')
      return
    }
    await runRewriteWorkflow(rewriteInstruction)
  }

  const handleRewriteSelectionWithHint = async (hint: string) => {
    await runRewriteWorkflow(hint)
  }

  const handleApplyCandidate = async () => {
    if (!rewriteSelection || !selectedCandidateItem) {
      toast.error('请选择可采纳的修改候选')
      return
    }

    const candidateContent = normalizePlainLyricText(selectedCandidateItem.content, 'candidate')
    // 防御：如果候选内容比选中文本长太多，说明 AI 返回了整段歌词而非短词替换
    if (candidateContent.length > rewriteSelection.text.length * 3 && candidateContent.length > 30) {
      toast.error('候选内容过长，可能包含完整歌词而非短词替换，请重新改写')
      return
    }
    const nextLyricData = replaceLineText(lyricData, rewriteSelection.lineId, rewriteSelection.startInLine, rewriteSelection.endInLine, candidateContent)
    setLyricData(nextLyricData)
    const nextLyricPlain = lyricDataToPlainText(nextLyricData)
    const nextLyricJson = lyricDataToJson(nextLyricData)
    setProjects((current) => current.map((project) => project.id === selectedProject?.id ? { ...project, currentLyric: nextLyricJson } : project))
    try {
      if (selectedProject) {
        await updateAiMusicProject({
          id: selectedProject.id,
          style,
          mood,
          language,
          currentLyric: nextLyricJson,
          lyricWorkflowId: LYRIC_WORKFLOW_ID,
        })
      }
      // 采纳候选后自动创建小版本记录
      if (selectedProject) {
        const currentMajor = getCurrentMajorNo()
        const minorCount = versions.filter((v) => {
          const no = String(v.versionNo)
          return no.startsWith(`${currentMajor}.`) && !/\.0+$/.test(no)
        }).length
        const minorVersionNo = `${currentMajor}.${String(minorCount + 1).padStart(2, '0')}`
        const autoVersion: Omit<AiMusicLyricVersion, 'id' | 'createTime' | 'updateTime'> = {
          projectId: selectedProject.id,
          name: `V${minorVersionNo}`,
          title: '采纳候选',
          color: 'bg-blue-400',
          summary: `采纳 AI 候选修改歌词`,
          content: nextLyricPlain,
          versionNo: minorVersionNo,
        }
        const versionId = await addAiMusicLyricVersion(autoVersion)
        const savedVersion = { ...autoVersion, id: versionId, createTime: new Date().toISOString() }
        setVersions((current) => [...current, savedVersion])
      }
      setSelection(null)
      setRewriteSelection(null)
      setCandidates([])
      setSelectedCandidate('0')
      setCandidatePanelOpen(true)
      toast.success('已采纳候选并保存当前歌词，可继续选区改写')
    } catch (error) {
      toast.error(`候选采纳保存失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  const handleArchiveVersion = async () => {
    if (!selectedProject) {
      toast.error('请先选择音乐项目')
      return
    }
    if (!lyricDataToPlainText(lyricData).trim()) {
      toast.error('歌词为空，无法归档')
      return
    }

    const majorCount = versions.filter((v) => /^\d+(\.0+)?$/.test(String(v.versionNo))).length
    const nextMajor = majorCount + 1
    const majorVersionNo = `${nextMajor}.00`
    const nextVersion: Omit<AiMusicLyricVersion, 'id' | 'createTime' | 'updateTime'> = {
      projectId: selectedProject.id,
      name: `V${majorVersionNo}`,
      title: majorCount === 0 ? '初稿归档' : '手动归档',
      color: versionColors[(nextMajor - 1) % versionColors.length],
      summary: majorCount === 0 ? '保存当前歌词初稿' : `基于上一版本保存当前修改`,
      content: lyricDataToPlainText(lyricData),
      versionNo: majorVersionNo,
    }
    setProjectSaving(true)
    try {
      const id = await addAiMusicLyricVersion(nextVersion)
      const savedVersion = { ...nextVersion, id, createTime: new Date().toISOString() }
      await updateAiMusicProject({
        id: selectedProject.id,
        style,
        mood,
        language,
        currentLyric: lyricDataToJson(lyricData),
        lyricWorkflowId: LYRIC_WORKFLOW_ID,
      })
      setVersions((current) => [...current, savedVersion])
      setProjects((current) => current.map((project) => project.id === selectedProject.id ? {
        ...project,
        style,
        mood,
        language,
        currentLyric: lyricDataToJson(lyricData),
        lyricWorkflowId: LYRIC_WORKFLOW_ID,
      } : project))
      toast.success(`已归档为 V${majorVersionNo}，并保存到数据库`)
    } catch (error) {
      toast.error(`归档失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setProjectSaving(false)
    }
  }

  const generateRunning = runningType === 'generate'
  const rewriteRunning = runningType === 'rewrite'

  const handleStartEditFull = () => {
    setEditFullDraft(lyricDataToPlainText(lyricData))
    setEditingFullLyric(true)
  }

  const handleCommitEditFull = async () => {
    if (!selectedProject) {
      setLyricData(plainTextToLyricData(editFullDraft))
      setEditingFullLyric(false)
      return
    }
    const nextLyricData = plainTextToLyricData(editFullDraft)
    setLyricData(nextLyricData)
    setEditingFullLyric(false)
    const nextLyricJson = lyricDataToJson(nextLyricData)
    const nextLyricPlain = lyricDataToPlainText(nextLyricData)
    try {
      await updateAiMusicProject({
        id: selectedProject.id,
        style,
        mood,
        language,
        currentLyric: nextLyricJson,
        lyricWorkflowId: LYRIC_WORKFLOW_ID,
      })
      // 手动编辑后自动创建小版本
      const currentMajor = getCurrentMajorNo()
      const minorCount = versions.filter((v) => {
        const no = String(v.versionNo)
        return no.startsWith(`${currentMajor}.`) && !/\.0+$/.test(no)
      }).length
      const minorVersionNo = `${currentMajor}.${String(minorCount + 1).padStart(2, '0')}`
      const editVersion: Omit<AiMusicLyricVersion, 'id' | 'createTime' | 'updateTime'> = {
        projectId: selectedProject.id,
        name: `V${minorVersionNo}`,
        title: '手动编辑',
        color: 'bg-emerald-400',
        summary: '手动编辑歌词全文',
        content: nextLyricPlain,
        versionNo: minorVersionNo,
      }
      const versionId = await addAiMusicLyricVersion(editVersion)
      const savedVersion = { ...editVersion, id: versionId, createTime: new Date().toISOString() }
      setVersions((current) => [...current, savedVersion])
      setProjects((current) => current.map((project) => project.id === selectedProject.id ? { ...project, currentLyric: nextLyricJson } : project))
      toast.success(`已保存为 V${minorVersionNo}`)
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  return (
    <div className='flex h-full min-h-0 flex-1 flex-col overflow-hidden bg-background'>
      <div className='flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 bg-white px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]'>
        <SidebarTrigger variant='outline' className='size-7' />
        <Separator orientation='vertical' className='h-5' />
        <FolderOpen size={15} className='shrink-0 text-neutral-700' />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className='flex items-center gap-1 rounded-md px-2 py-1 text-[13px] font-semibold text-neutral-800 transition-colors hover:bg-neutral-200/60'>
              音乐项目
              <ChevronDown size={13} className='text-neutral-400' />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-64'>
            <DropdownMenuLabel className='text-xs text-neutral-400'>我的音乐</DropdownMenuLabel>
            {projectLoading ? (
              <div className='px-2 py-3 text-center text-xs text-neutral-400'>加载音乐项目中...</div>
            ) : projects.length === 0 ? (
              <div className='px-2 py-3 text-center text-xs text-neutral-400'>暂无音乐项目</div>
            ) : projects.map((project) => (
              <DropdownMenuItem
                key={project.id}
                onClick={() => handleOpenProject(project.id)}
                className='flex items-center gap-2 text-xs'
              >
                {project.id === selectedProjectId ? (
                  <Check size={13} className='text-neutral-900' />
                ) : (
                  <span className='w-[13px]' />
                )}
                <span className='flex-1 truncate'>{project.title}</span>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    void handleDeleteProject(project.id)
                  }}
                  className='text-neutral-300 hover:text-red-500'
                >
                  <Trash2 size={12} />
                </button>
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        <span className='text-neutral-300'>/</span>

        {selectedProject ? (
          editingName ? (
            <Input
              autoFocus
              value={nameDraft}
              onChange={(event) => setNameDraft(event.target.value)}
              onBlur={() => {
                void handleRenameCurrent(nameDraft)
                setEditingName(false)
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void handleRenameCurrent(nameDraft)
                  setEditingName(false)
                }
                if (event.key === 'Escape') setEditingName(false)
              }}
              className='h-7 w-44 text-xs'
            />
          ) : (
            <button
              onClick={() => {
                setNameDraft(selectedProject.title)
                setEditingName(true)
              }}
              className='truncate rounded px-1.5 py-0.5 text-[13px] text-neutral-700 hover:bg-neutral-200/60'
            >
              {selectedProject.title}
            </button>
          )
        ) : (
          <span className='text-[13px] text-neutral-400'>未选择音乐项目</span>
        )}

        <div className='ms-auto flex items-center gap-2'>
          {creating ? (
            <div className='flex items-center gap-1'>
              <Input
                autoFocus
                value={newProjectName}
                onChange={(event) => setNewProjectName(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') void commitCreateProject()
                  if (event.key === 'Escape') setCreating(false)
                }}
                placeholder='音乐项目名称'
                className='h-7 w-40 text-xs'
              />
              <Button onClick={() => void commitCreateProject()} size='sm' className='h-7 bg-neutral-900 text-xs hover:bg-black'>
                创建
              </Button>
            </div>
          ) : (
            <Button
              onClick={() => setCreating(true)}
              size='sm'
              variant='outline'
              className='h-7 border-neutral-200 text-xs text-neutral-600'
            >
              <Plus size={13} className='mr-1' /> 新建项目
            </Button>
          )}
          <Button
            onClick={() => void handleSaveCurrentProject()}
            disabled={projectSaving || !selectedProject}
            size='sm'
            className='h-7 bg-neutral-900 text-xs hover:bg-black'
          >
            {projectSaving ? <Loader2 size={13} className='mr-1 animate-spin' /> : <Save size={13} className='mr-1' />}
            保存
          </Button>
        </div>
      </div>

      <main className='flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden'>
        <div className='min-h-0 flex-1 overflow-auto p-4'>
          <div className='flex w-full flex-col gap-4'>
            <CreativeInputBox
              inputOpen={inputOpen}
              style={style}
              mood={mood}
              language={language}
              extra={extra}
              generateRunning={generateRunning}
              workflowLoading={workflowLoading}
              selectedProject={selectedProject}
              onOpenChange={setInputOpen}
              onStyleChange={setStyle}
              onMoodChange={setMood}
              onLanguageChange={setLanguage}
              onExtraChange={setExtra}
              onGenerate={handleGenerateLyric}
            />

            <Tabs value={activeTab} onValueChange={(v) => {
              const tab = VALID_TABS.includes(v as TabValue) ? (v as TabValue) : 'lyrics'
              setActiveTab(tab)
              navigate({ to: '/ai-music', search: (prev: Record<string, unknown>) => ({ ...prev, tab }) })
            }} className='flex flex-col gap-4'>
                <TabsList>
                  <TabsTrigger value='lyrics'>歌词编辑</TabsTrigger>
                  <TabsTrigger value='versions'>版本总览</TabsTrigger>
                  <TabsTrigger value='music'>音乐生成</TabsTrigger>
                </TabsList>

                <TabsContent value='lyrics' className='flex flex-col gap-4'>
                  <div className={cn('grid gap-4', candidatePanelOpen && 'xl:grid-cols-[minmax(0,1fr)_380px]')}>
                    <Card>
                      <CardHeader>
                        <div className='flex items-center justify-between gap-2'>
                          <div>
                            <CardTitle className='text-base'>歌词</CardTitle>
                            <CardDescription>双击行编辑，选中文字发起 AI 改写。</CardDescription>
                          </div>
                          <div className='flex items-center gap-2'>
                            <Button size='sm' variant='outline' className='gap-1' onClick={() => setShowDiff((v) => !v)}>
                              {showDiff ? '隐藏 Diff' : '显示 Diff'}
                            </Button>
                            {editingFullLyric ? (
                              <Button size='sm' className='gap-1 bg-emerald-600 hover:bg-emerald-700' onClick={() => { void handleCommitEditFull() }}>
                                <Save size={16} />
                                保存编辑
                              </Button>
                            ) : (
                              <Button size='sm' variant='outline' className='gap-1' onClick={handleStartEditFull}>
                                编辑歌词
                              </Button>
                            )}
                            <Button size='sm' variant='outline' className='gap-1' onClick={() => setCandidatePanelOpen((open) => !open)}>
                              {candidatePanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
                              {candidatePanelOpen ? '隐藏候选' : '显示候选'}
                            </Button>
                            <Button size='sm' variant='outline' className='gap-1' onClick={() => { void handleArchiveVersion() }} disabled={!selectedProject || projectSaving}>
                              <Archive size={16} />
                              归档为 {getNextMajorVersionName()}（当前 {getCurrentVersionName()}）
                            </Button>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className='flex flex-col gap-3'>
                        {editingFullLyric ? (
                          <Textarea
                            autoFocus
                            value={editFullDraft}
                            onChange={(event) => setEditFullDraft(event.target.value)}
                            className='min-h-[520px] resize-none font-mono text-sm leading-7'
                          />
                        ) : (
                          <LyricCanvas
                            lyricData={lyricData}
                            onChange={setLyricData}
                            onSelectionChange={setSelection}
                            lineDiffTypes={lineDiffTypes}
                            showDiff={showDiff}
                          />
                        )}
                      </CardContent>
                    </Card>

                    {candidatePanelOpen ? (
                      <Card className='h-fit xl:sticky xl:top-4'>
                        <CardHeader>
                          <div className='flex items-start justify-between gap-2'>
                            <div>
                              <CardTitle className='text-base'>AI 修改候选</CardTitle>
                              <CardDescription>局部改写返回多个候选，选择后再采纳。</CardDescription>
                            </div>
                            <Button variant='ghost' size='icon' className='size-8' onClick={() => setCandidatePanelOpen(false)}>
                              <PanelRightClose size={16} />
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className='flex flex-col gap-3'>
                          <div className='flex flex-col gap-2'>
                            <span className='text-sm font-medium'>改写要求</span>
                            <Input value={rewriteInstruction} onChange={(event) => setRewriteInstruction(event.target.value)} placeholder='输入改写方向，如：更有画面感' />
                          </div>
                          <div className='flex flex-col gap-2 rounded-md border bg-muted/20 p-3'>
                            <div className='flex items-start gap-2 text-sm text-muted-foreground'>
                              <Highlighter size={16} className='mt-0.5 shrink-0' />
                              <span className='line-clamp-3'>{selection?.text ? `已选中：${selection.text.slice(0, 72)}${selection.text.length > 72 ? '...' : ''}` : '先在左侧歌词编辑器中选中片段，再在这里发起局部改写。'}</span>
                            </div>
                            <Button variant='outline' size='sm' className='w-full gap-1' onClick={handleRewriteSelection} disabled={workflowLoading || rewriteRunning || !selectedProject}>
                              <span>{rewriteRunning ? '改写中' : 'AI 改写选区'}</span>
                              {rewriteRunning ? <Loader2 className='animate-spin' size={16} /> : <Wand2 size={16} />}
                            </Button>
                          </div>
                          <div className='flex max-h-[420px] flex-col gap-3 overflow-auto pr-1'>
                            {candidates.length === 0 ? <div className='rounded-md border p-4 text-sm text-muted-foreground'>还没有候选。请先在歌词编辑器中选中片段，然后点击“AI 改写选区”。</div> : candidates.map((candidate, index) => {
                              const value = String(index)
                              const selected = selectedCandidate === value
                              return (
                                <button key={`${candidate.title}-${index}`} type='button' onClick={() => setSelectedCandidate(value)} className={cn('rounded-md border p-4 text-left transition-colors hover:bg-muted/50', selected && 'border-primary bg-muted')}>
                                  <div className='mb-2 flex items-center justify-between gap-2'><Badge variant={selected ? 'default' : 'secondary'}>{candidate.title || `候选 ${index + 1}`}</Badge>{selected ? <Check size={16} /> : null}</div>
                                  <p className='whitespace-pre-wrap text-sm leading-6 text-muted-foreground'>{candidate.content}</p>
                                </button>
                              )
                            })}
                          </div>
                          <Button size='sm' className='w-full' onClick={() => { void handleApplyCandidate() }} disabled={!rewriteSelection || !selectedCandidateItem}>采纳当前候选</Button>
                          <div className='flex flex-col gap-2'>
                            <span className='text-xs text-muted-foreground'>换个风格继续改写</span>
                            <div className='flex flex-wrap gap-1.5'>
                              {['更有画面感', '更口语化', '更诗意', '更有节奏感', '更含蓄', '更直白'].map((hint) => (
                                <button
                                  key={hint}
                                  type='button'
                                  onClick={() => { setRewriteInstruction(hint); setCandidates([]); setSelectedCandidate('0'); void handleRewriteSelectionWithHint(hint) }}
                                  className='rounded-full border px-2.5 py-1 text-xs transition-colors hover:bg-primary/10 hover:text-primary'
                                >
                                  {hint}
                                </button>
                              ))}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ) : null}
                  </div>
                </TabsContent>

                <TabsContent value='versions' className='flex flex-col gap-4'>
                  <div className='grid gap-4 lg:grid-cols-[280px_minmax(0,1fr)]'>
                    <Card>
                      <CardHeader><CardTitle className='text-base'>版本时间线</CardTitle><CardDescription>点击版本查看对比</CardDescription></CardHeader>
                      <CardContent className='flex flex-col gap-2'>
                        {versions.length === 0 ? <div className='rounded-md border p-3 text-sm text-muted-foreground'>暂无版本，点击"归档为 V1"保存当前歌词。</div> : versions.map((version) => {
                          const isSelected = selectedVersionId === (version.id || version.name)
                          return (
                            <div
                              key={version.id || version.name}
                              onClick={() => setSelectedVersionId(isSelected ? null : (version.id || null))}
                              className={cn(
                                'cursor-pointer rounded-md border p-2.5 transition-colors hover:bg-muted/50',
                                isSelected && 'border-primary bg-primary/5 ring-1 ring-primary/20'
                              )}
                            >
                              <div className='flex items-center justify-between gap-2'>
                                <div className='flex items-center gap-2'>
                                  <VersionDot className={version.color} />
                                  <span className='text-sm font-medium'>{version.name}</span>
                                </div>
                                <span className='text-[11px] text-muted-foreground'>
                                  {version.createTime ? new Date(version.createTime).toLocaleString('zh-CN', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' }) : ''}
                                </span>
                              </div>
                              <p className='mt-1 text-xs text-muted-foreground'>{version.title}</p>
                            </div>
                          )
                        })}
                      </CardContent>
                    </Card>
                    <Card>
                      <CardHeader>
                        <CardTitle className='text-base'>
                          {selectedVersionDetail
                            ? `V1 → ${selectedVersionDetail.name} 变更对比`
                            : versions.length > 0
                              ? `V1 → ${latestVersion?.name ?? '最新'} 变更总览`
                              : '版本变更对比'}
                        </CardTitle>
                        <CardDescription>
                          <span className='inline-flex items-center gap-3 text-[11px]'>
                            <span className='flex items-center gap-1'><span className='inline-block h-2 w-4 rounded bg-red-100' />删除</span>
                            <span className='flex items-center gap-1'><span className='inline-block h-2 w-4 rounded bg-yellow-100' />更换</span>
                            <span className='flex items-center gap-1'><span className='inline-block h-2 w-4 rounded bg-green-50 border border-green-200' />新增</span>
                          </span>
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        {versions.length === 0 ? (
                          <div className='rounded-md border p-3 text-sm text-muted-foreground'>
                            暂无版本，归档后可查看变更对比。
                          </div>
                        ) : versionOverviewDiff.length === 0 ? (
                          <div className='rounded-md border p-3 text-sm text-muted-foreground'>
                            当前版本无歌词内容。
                          </div>
                        ) : (
                          <div className='flex flex-col gap-0.5 rounded-md border p-2'>
                            {versionOverviewDiff.map((row, index) => (
                              <div
                                key={`${row.type}-${index}`}
                                className={cn(
                                  'rounded px-2.5 py-1.5 font-mono text-sm leading-6',
                                  row.type === 'keep' && 'text-foreground',
                                  row.type === 'remove' && 'bg-red-50 text-red-500 line-through decoration-red-400',
                                  row.type === 'add' && 'border border-green-200 bg-green-50 text-green-700',
                                  row.type === 'change' && 'bg-yellow-50 text-yellow-800'
                                )}
                              >
                                {row.type === 'change' ? (
                                  <span>
                                    <span className='line-through decoration-red-400 text-red-400'>{row.before}</span>
                                    <span className='mx-1.5 text-muted-foreground'>→</span>
                                    <span className='text-yellow-700 font-medium'>{row.after}</span>
                                  </span>
                                ) : row.line}
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value='music' className='flex flex-col gap-4'>
                  {!musicWorkflow ? (
                    <Card>
                      <CardContent className='flex h-48 items-center justify-center text-muted-foreground'>
                        音乐生成工作流未加载，请确认后端已导入 ACE 音乐生成工作流
                      </CardContent>
                    </Card>
                  ) : (
                    <>
                      {/* 核心参数 */}
                      <Card>
                        <CardHeader>
                          <div className='flex items-center justify-between gap-2'>
                            <div>
                              <CardTitle className='text-base'>音乐生成</CardTitle>
                              <CardDescription>ACE Step 1.5 — 填写歌词和风格，一键生成完整歌曲</CardDescription>
                            </div>
                            <Button
                              size='sm'
                              className='gap-1'
                              disabled={musicRunning}
                              onClick={handleGenerateMusic}
                            >
                              {musicRunning ? <Loader2 size={16} className='animate-spin' /> : <Play size={16} />}
                              <span>{musicRunning ? musicProgressLabel : '生成音乐'}</span>
                            </Button>
                          </div>
                        </CardHeader>
                        <CardContent className='space-y-4'>
                          {musicRunning && (
                            <div className='space-y-1'>
                              <div className='h-2 overflow-hidden rounded-full bg-neutral-100'>
                                <div
                                  className='h-full rounded-full bg-cyan-500 transition-all duration-500'
                                  style={{ width: `${musicProgress}%` }}
                                />
                              </div>
                              <p className='text-xs text-muted-foreground'>{musicProgressLabel}</p>
                            </div>
                          )}

                          {(() => {
                            const coreParams = musicParams.filter((p) => !p.advanced)
                            const advancedParams = musicParams.filter((p) => p.advanced)
                            return (
                              <>
                                {coreParams.map((p) => {
                                  const key = `${p.nodeId}.${p.paramName}`
                                  const val = musicParamValues[key] ?? p.value
                                  return (
                                    <div key={key} className='space-y-1.5'>
                                      <Label className='text-xs font-medium text-neutral-600'>
                                        {p.label}
                                        {p.paramName === 'tags' && (
                                          <span className='ml-1 text-[10px] text-neutral-400'>描述音乐风格、乐器、氛围</span>
                                        )}
                                        {p.paramName === 'lyrics' && (
                                          <span className='ml-1 text-[10px] text-neutral-400'>带段标歌词，留空自动使用当前草稿</span>
                                        )}
                                        {p.paramName === 'bpm' && (
                                          <span className='ml-1 text-[10px] text-neutral-400'>每分钟节拍数</span>
                                        )}
                                        {p.paramName === 'timesignature' && (
                                          <span className='ml-1 text-[10px] text-neutral-400'>拍号</span>
                                        )}
                                        {p.paramName === 'keyscale' && (
                                          <span className='ml-1 text-[10px] text-neutral-400'>调式/调性</span>
                                        )}
                                        {p.paramName === 'seconds' && (
                                          <span className='ml-1 text-[10px] text-neutral-400'>生成音频时长，范围1-1000秒</span>
                                        )}
                                      </Label>
                                      {p.multiline ? (
                                        <Textarea
                                          value={String(val)}
                                          onChange={(e) =>
                                            setMusicParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                                          }
                                          rows={p.paramName === 'lyrics' ? 8 : 3}
                                          className='resize-none text-sm'
                                          placeholder={
                                            p.paramName === 'lyrics'
                                              ? '留空自动使用当前项目歌词；也可手动输入带段标的歌词，如 [Verse 1] [Chorus]'
                                              : p.paramName === 'tags'
                                              ? '如：Chinese pop, female vocal, piano, gentle, 120 BPM'
                                              : ''
                                          }
                                        />
                                      ) : p.options ? (
                                        <select
                                          value={String(val)}
                                          onChange={(e) =>
                                            setMusicParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                                          }
                                          className='h-9 w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs'
                                        >
                                          {p.options.map((opt) => (
                                            <option key={String(opt)} value={String(opt)}>
                                              {String(opt)}
                                            </option>
                                          ))}
                                        </select>
                                      ) : p.type === 'int' || p.type === 'float' ? (
                                        <Input
                                          type='number'
                                          value={String(val)}
                                          onChange={(e) =>
                                            setMusicParamValues((prev) => ({
                                              ...prev,
                                              [key]: p.type === 'int' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0,
                                            }))
                                          }
                                          min={p.min}
                                          max={p.max}
                                          step={p.step ?? 1}
                                          className='text-sm'
                                        />
                                      ) : (
                                        <Input
                                          value={String(val)}
                                          onChange={(e) =>
                                            setMusicParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                                          }
                                          className='text-sm'
                                        />
                                      )}
                                    </div>
                                  )
                                })}

                                {advancedParams.length > 0 && (
                                  <div className='pt-2'>
                                    <button
                                      className='flex items-center gap-1 text-xs font-medium text-neutral-400 hover:text-neutral-700'
                                      onClick={() => setShowMusicAdvanced((v) => !v)}
                                    >
                                      {showMusicAdvanced ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                                      高级参数 ({advancedParams.length})
                                    </button>
                                    {showMusicAdvanced && (
                                      <div className='mt-3 space-y-3 rounded-lg border border-neutral-100 bg-neutral-50/50 p-3'>
                                        {advancedParams.map((p) => {
                                          const key = `${p.nodeId}.${p.paramName}`
                                          const val = musicParamValues[key] ?? p.value
                                          return (
                                            <div key={key} className='space-y-1'>
                                              <Label className='text-[11px] font-medium text-neutral-500'>
                                                {p.label}
                                                <span className='ml-1 text-[10px] text-neutral-400'>
                                                  {p.paramName === 'seed' && '随机种子，每次生成自动随机'}
                                                  {p.paramName === 'language' && '歌词语言'}
                                                  {p.paramName === 'generate_audio_codes' && '开启后质量更高但更慢'}
                                                  {p.paramName === 'cfg_scale' && 'CFG 缩放系数'}
                                                  {p.paramName === 'temperature' && '生成温度，越高越随机'}
                                                  {p.paramName === 'top_p' && 'Top-P 采样'}
                                                  {p.paramName === 'top_k' && 'Top-K 采样，0=禁用'}
                                                  {p.paramName === 'min_p' && 'Min-P 采样，0=禁用'}
                                                  {p.paramName === 'steps' && '采样步数'}
                                                  {p.paramName === 'cfg' && '引导系数'}
                                                  {p.paramName === 'sampler_name' && '采样算法'}
                                                  {p.paramName === 'scheduler' && '调度策略'}
                                                  {p.paramName === 'denoise' && '降噪强度，1.0=全生成'}
                                                </span>
                                              </Label>
                                              {p.type === 'boolean' ? (
                                                <label className='flex items-center gap-2'>
                                                  <input
                                                    type='checkbox'
                                                    checked={!!val}
                                                    onChange={(e) =>
                                                      setMusicParamValues((prev) => ({ ...prev, [key]: e.target.checked }))
                                                    }
                                                    className='rounded'
                                                  />
                                                  <span className='text-xs text-neutral-600'>{val ? '开启' : '关闭'}</span>
                                                </label>
                                              ) : p.options ? (
                                                <select
                                                  value={String(val)}
                                                  onChange={(e) =>
                                                    setMusicParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                                                  }
                                                  className='h-8 w-full rounded-md border border-input bg-transparent px-2 text-xs shadow-xs'
                                                >
                                                  {p.options.map((opt) => (
                                                    <option key={String(opt)} value={String(opt)}>
                                                      {String(opt)}
                                                    </option>
                                                  ))}
                                                </select>
                                              ) : p.type === 'int' || p.type === 'float' ? (
                                                <Input
                                                  type='number'
                                                  value={String(val)}
                                                  onChange={(e) =>
                                                    setMusicParamValues((prev) => ({
                                                      ...prev,
                                                      [key]: p.type === 'int' ? parseInt(e.target.value) || 0 : parseFloat(e.target.value) || 0,
                                                    }))
                                                  }
                                                  min={p.min}
                                                  max={p.max}
                                                  step={p.step ?? 1}
                                                  className='h-8 text-xs'
                                                />
                                              ) : (
                                                <Input
                                                  value={String(val)}
                                                  onChange={(e) =>
                                                    setMusicParamValues((prev) => ({ ...prev, [key]: e.target.value }))
                                                  }
                                                  className='h-8 text-xs'
                                                />
                                              )}
                                            </div>
                                          )
                                        })}
                                      </div>
                                    )}
                                  </div>
                                )}
                              </>
                            )
                          })()}
                        </CardContent>
                      </Card>

                      {/* 音频历史 */}
                      <Card>
                        <CardHeader>
                          <CardTitle className='text-base'>音频历史</CardTitle>
                          <CardDescription>项目内所有生成音频，支持多次生成累积</CardDescription>
                        </CardHeader>
                        <CardContent>
                          {audioRecords.length === 0 ? (
                            <div className='flex h-24 items-center justify-center text-sm text-muted-foreground'>
                              暂无生成音频，点击上方"生成音乐"开始
                            </div>
                          ) : (
                            <div className='space-y-3'>
                              {audioRecords.map((audio) => (
                                <div key={audio.id} className='rounded-lg border p-3'>
                                  <div className='mb-2 flex items-center justify-between'>
                                    <div className='flex items-center gap-2'>
                                      <Music size={14} className='text-cyan-600' />
                                      <span className='text-sm font-medium'>
                                        {audio.title || '音频'}
                                      </span>
                                      {audio.durationSeconds ? (
                                        <span className='text-[11px] text-muted-foreground'>
                                          {audio.durationSeconds}秒
                                        </span>
                                      ) : null}
                                      <span className='text-[11px] text-muted-foreground'>
                                        {audio.createTime
                                          ? new Date(audio.createTime).toLocaleString('zh-CN', {
                                              month: '2-digit',
                                              day: '2-digit',
                                              hour: '2-digit',
                                              minute: '2-digit',
                                            })
                                          : ''}
                                      </span>
                                    </div>
                                    <div className='flex items-center gap-2'>
                                      <a href={audio.audioUrl} download className='text-xs text-cyan-600 hover:underline'>
                                        下载
                                      </a>
                                      <button
                                        onClick={() => {
                                          void (async () => {
                                            try {
                                              await deleteAiMusicAudio(audio.id!)
                                              setAudioRecords((prev) => prev.filter((a) => a.id !== audio.id))
                                              toast.success('已删除音频')
                                            } catch {
                                              toast.error('删除失败')
                                            }
                                          })()
                                        }}
                                        className='text-xs text-neutral-400 hover:text-red-500'
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                  <audio controls src={audio.audioUrl} className='w-full' />
                                  {audio.styleTags && (
                                    <div className='mt-1.5 flex flex-wrap gap-1'>
                                      {audio.styleTags.split(',').map((tag, i) => (
                                        <Badge key={i} variant='secondary' className='text-[10px]'>
                                          {tag.trim()}
                                        </Badge>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </CardContent>
                      </Card>
                    </>
                  )}
                </TabsContent>
            </Tabs>
          </div>
        </div>
      </main>
    </div>
  )
}

export { AiMusicPage }
