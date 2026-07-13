import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ChevronRight, FileSearch2, Loader2, Sparkles, Wand2 } from 'lucide-react'
import { toast } from 'sonner'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { MilkdownEditor } from '@/features/documents/editor/milkdown-editor'
import { novelOutlineApi, type NovelOutlineNode } from '../api/novel-api'
import { OUTLINE_LEVEL_LABEL } from '../constants'
import { computeWordStats, formatText } from '../lib/text-utils'
import { useDailyProgress } from '../hooks/useDailyProgress'
import { AiContinueDialog } from './AiContinueDialog'
import { AiPolishDialog } from './AiPolishDialog'
import { AiConsistencyDialog } from './AiConsistencyDialog'
import { AiSummaryDialog } from './AiSummaryDialog'
import { EditorToolbar, type EditorSettings } from './EditorToolbar'
import { WordCountPanel } from './WordCountPanel'
import { ChapterTOC } from './ChapterTOC'
import './novel-editor.css'

interface Props {
  novelId: string
  novelWordCount: number
  outlineTree: NovelOutlineNode[]
  node: NovelOutlineNode
  breadcrumbs: NovelOutlineNode[]
  onSaved: () => void
}

const DEFAULT_SETTINGS_KEY = 'novel:editor:settings'

const defaultSettings: EditorSettings = {
  focusMode: false,
  typewriterMode: false,
  fullscreen: false,
  showWordPanel: true,
  showTOC: false,
  autoSpaceBetweenCjkAscii: true,
  smartQuotes: true,
  chinesePunctuation: true,
  fixDashes: true,
  fixEllipsis: true,
  indentParagraph: false,
  collapseBlankLines: true,
  trimTrailingSpaces: true,
}

function loadSettings(): EditorSettings {
  try {
    const raw = localStorage.getItem(DEFAULT_SETTINGS_KEY)
    if (raw) return { ...defaultSettings, ...(JSON.parse(raw) as EditorSettings) }
  } catch {
    // ignore
  }
  return defaultSettings
}

export function ChapterEditor({
  novelId,
  novelWordCount,
  outlineTree,
  node,
  breadcrumbs,
  onSaved,
}: Props) {
  const [title, setTitle] = useState(node.title)
  const [summary, setSummary] = useState(node.summary ?? '')
  const [content, setContent] = useState(node.content ?? '')
  const [saving, setSaving] = useState(false)
  const [lastSaved, setLastSaved] = useState<string>('')
  const [continueOpen, setContinueOpen] = useState(false)
  const [polishOpen, setPolishOpen] = useState(false)
  const [consistencyOpen, setConsistencyOpen] = useState(false)
  const [summaryOpen, setSummaryOpen] = useState(false)
  const [settings, setSettings] = useState<EditorSettings>(() => loadSettings())
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef(content)
  const titleRef = useRef(title)
  const summaryRef = useRef(summary)

  useEffect(() => {
    contentRef.current = content
  }, [content])
  useEffect(() => {
    titleRef.current = title
  }, [title])
  useEffect(() => {
    summaryRef.current = summary
  }, [summary])

  useEffect(() => {
    localStorage.setItem(DEFAULT_SETTINGS_KEY, JSON.stringify(settings))
  }, [settings])

  // 挂载 body 标志，供 CSS 隐藏 Milkdown Portal 挂载的 top-bar / toolbar
  useEffect(() => {
    document.body.dataset.novelEditor = 'on'
    return () => {
      delete document.body.dataset.novelEditor
    }
  }, [])

  useEffect(() => {
    setTitle(node.title)
    setSummary(node.summary ?? '')
    setContent(node.content ?? '')
  }, [node.id, node.title, node.summary, node.content])

  const patchSettings = useCallback((patch: Partial<EditorSettings>) => {
    setSettings((prev) => ({ ...prev, ...patch }))
  }, [])

  const save = useCallback(
    async (payload: { title?: string; summary?: string; content?: string }) => {
      setSaving(true)
      try {
        await novelOutlineApi.update({ id: node.id, ...payload })
        setLastSaved(new Date().toLocaleTimeString())
        onSaved()
      } catch (e) {
        toast.error((e as Error).message || '保存失败')
      } finally {
        setSaving(false)
      }
    },
    [node.id, onSaved]
  )

  const scheduleSave = useCallback(
    (payload: { title?: string; summary?: string; content?: string }) => {
      if (timerRef.current) clearTimeout(timerRef.current)
      timerRef.current = setTimeout(() => {
        void save(payload)
      }, 1200)
    },
    [save]
  )

  const handleTitleChange = (v: string) => {
    setTitle(v)
    scheduleSave({ title: v })
  }
  const handleContentChange = useCallback(
    (v: string) => {
      setContent(v)
      scheduleSave({ content: v })
    },
    [scheduleSave]
  )

  const handleApplySummary = useCallback(
    (v: string) => {
      setSummary(v)
      scheduleSave({ summary: v })
    },
    [scheduleSave]
  )

  const handleManualSave = useCallback(async () => {
    if (timerRef.current) clearTimeout(timerRef.current)
    await save({
      title: titleRef.current,
      summary: summaryRef.current,
      content: contentRef.current,
    })
    toast.success('已保存')
  }, [save])

  const handleFormat = useCallback(() => {
    const next = formatText(contentRef.current, settings)
    if (next !== contentRef.current) {
      setContent(next)
      scheduleSave({ content: next })
    }
  }, [scheduleSave, settings])

  // 全局快捷键
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const meta = e.ctrlKey || e.metaKey
      if (meta && e.key.toLowerCase() === 's') {
        e.preventDefault()
        void handleManualSave()
      } else if (meta && e.altKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        handleFormat()
      } else if (meta && e.key === '.') {
        e.preventDefault()
        setSettings((prev) => ({ ...prev, focusMode: !prev.focusMode }))
      } else if (e.key === 'F11') {
        e.preventDefault()
        setSettings((prev) => ({ ...prev, fullscreen: !prev.fullscreen }))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [handleFormat, handleManualSave])

  const canEditContent = node.level === 3

  const stats = useMemo(() => computeWordStats(content), [content])
  const todayNew = useDailyProgress(novelId, novelWordCount)

  return (
    <div
      className={cn(
        'novel-editor-scope flex h-full flex-col bg-background',
        settings.fullscreen && 'fixed inset-0 z-50'
      )}
    >
      {/* 顶部：面包屑 + 标题输入 */}
      <div className="flex shrink-0 items-center gap-3 border-b bg-background/70 px-6 py-2 text-xs backdrop-blur">
        {/* 面包屑（父级路径，不含当前节点） */}
        {breadcrumbs.length > 1 && (
          <div className="flex min-w-0 shrink items-center gap-1 text-muted-foreground">
            {breadcrumbs.slice(0, -1).map((b, idx) => (
              <span key={b.id} className="flex shrink-0 items-center gap-1">
                {idx > 0 && <ChevronRight className="size-3 text-muted-foreground/50" />}
                <span className="truncate">{b.title}</span>
              </span>
            ))}
            <ChevronRight className="size-3 shrink-0 text-muted-foreground/50" />
          </div>
        )}
        {/* 当前节点标题输入（内联，可编辑） */}
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="h-7 min-w-0 flex-1 border-0 bg-transparent px-0 text-sm font-semibold text-foreground shadow-none focus-visible:ring-0"
          placeholder={`未命名${OUTLINE_LEVEL_LABEL[node.level]}`}
        />
        <Badge variant="outline" className="h-5 shrink-0 font-normal">
          {OUTLINE_LEVEL_LABEL[node.level]}
        </Badge>
        {saving && (
          <span className="flex shrink-0 items-center gap-1 text-muted-foreground">
            <Loader2 className="size-3 animate-spin" />
            保存中
          </span>
        )}
      </div>

      {/* 工具栏 */}
      {canEditContent && (
        <EditorToolbar
          saving={saving}
          lastSaved={lastSaved}
          wordCount={stats.totalWords}
          todayNew={todayNew}
          settings={settings}
          onSettingsChange={patchSettings}
          onSave={handleManualSave}
          content={content}
          onContentChange={(next) => {
            setContent(next)
            scheduleSave({ content: next })
          }}
          chapterTitle={title}
          aiSlot={
            <div className="flex items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setContinueOpen(true)}
              >
                <Sparkles data-icon="inline-start" />
                续写
              </Button>
              <Button variant="ghost" size="sm" className="h-8" onClick={() => setPolishOpen(true)}>
                <Wand2 data-icon="inline-start" />
                润色
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-8"
                onClick={() => setConsistencyOpen(true)}
              >
                <FileSearch2 data-icon="inline-start" />
                一致性
              </Button>
            </div>
          }
        />
      )}

      {/* 主体三栏：TOC · 编辑区 · 字数面板 */}
      <div className="flex min-h-0 flex-1">
        {canEditContent && settings.showTOC && (
          <aside className="hidden w-56 shrink-0 overflow-auto border-e bg-muted/10 lg:block">
            <ChapterTOC markdown={content} />
          </aside>
        )}

        <div className="flex min-h-0 flex-1 flex-col">
          {canEditContent ? (
            <ScrollArea className="flex-1">
              <div
                className={cn(
                  'flex w-full flex-col gap-4 px-10 py-8 lg:px-16 lg:py-10',
                  settings.focusMode && 'focus-mode-container',
                  settings.typewriterMode && 'pb-[50vh] pt-[35vh]'
                )}
              >
                {/* Milkdown 正文（概要已移至右侧栏） */}
                <div
                  className={cn(
                    'max-w-none',
                    settings.focusMode && '[&_.ProseMirror_p]:opacity-40 [&_.ProseMirror_p]:transition-opacity',
                    settings.focusMode && '[&_.ProseMirror_p:focus-within]:opacity-100',
                    settings.focusMode && '[&_.ProseMirror_p:has(*:focus)]:opacity-100'
                  )}
                >
                  <MilkdownEditor value={content} onChange={handleContentChange} />
                </div>
              </div>
            </ScrollArea>
          ) : (
            <ScrollArea className="flex-1">
              <div className="flex w-full flex-col gap-4 px-10 py-8 lg:px-16 lg:py-10">
                <div className="rounded-lg border border-dashed bg-muted/20 p-8 text-center">
                  <p className="text-sm font-medium">
                    「{OUTLINE_LEVEL_LABEL[node.level]}」层级不承载正文
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    请在下级「{OUTLINE_LEVEL_LABEL[Math.min(3, node.level + 1)]}」节点中撰写章节内容
                  </p>
                </div>
              </div>
            </ScrollArea>
          )}
        </div>

        {canEditContent && settings.showWordPanel && (
          <aside className="hidden w-64 shrink-0 overflow-auto border-s bg-muted/10 xl:block">
            <WordCountPanel
              currentContent={content}
              currentNode={node}
              outlineTree={outlineTree}
              novelTotal={novelWordCount}
              todayNew={todayNew}
              summary={summary}
              onGenerateSummary={() => setSummaryOpen(true)}
              canGenerateSummary={canEditContent}
            />
          </aside>
        )}
      </div>

      <AiContinueDialog
        open={continueOpen}
        onOpenChange={setContinueOpen}
        currentContent={content}
        onInsert={(text) => {
          const next = content + (content.endsWith('\n') ? '' : '\n\n') + text
          setContent(next)
          void save({ content: next })
        }}
      />
      <AiPolishDialog
        open={polishOpen}
        onOpenChange={setPolishOpen}
        currentContent={content}
        onReplace={(text) => {
          setContent(text)
          void save({ content: text })
        }}
      />
      <AiConsistencyDialog
        open={consistencyOpen}
        onOpenChange={setConsistencyOpen}
        novelId={novelId}
        content={content}
      />
      <AiSummaryDialog
        open={summaryOpen}
        onOpenChange={setSummaryOpen}
        currentContent={content}
        onApply={handleApplySummary}
      />
    </div>
  )
}

