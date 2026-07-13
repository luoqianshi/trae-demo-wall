import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
  Download,
  Focus,
  Keyboard,
  LayoutList,
  Maximize2,
  Minimize2,
  PanelRightClose,
  PanelRightOpen,
  Save,
  Settings2,
  Type,
  Wand2,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Switch } from '@/components/ui/switch'
import { cn } from '@/lib/utils'
import { downloadTextFile, formatText, markdownToPlainText, type FormatOptions } from '../lib/text-utils'

export interface EditorSettings extends FormatOptions {
  focusMode: boolean
  typewriterMode: boolean
  fullscreen: boolean
  showWordPanel: boolean
  showTOC: boolean
}

interface Props {
  saving: boolean
  lastSaved: string
  wordCount: number
  todayNew: number
  settings: EditorSettings
  onSettingsChange: (patch: Partial<EditorSettings>) => void
  onSave: () => void
  content: string
  onContentChange: (next: string) => void
  chapterTitle: string
  aiSlot?: React.ReactNode
}

const SETTING_ITEMS: Array<{ key: keyof EditorSettings; label: string; desc?: string }> = [
  { key: 'autoSpaceBetweenCjkAscii', label: '中英文之间自动空格', desc: '"你好world" → "你好 world"' },
  { key: 'smartQuotes', label: '智能弯引号', desc: '英文 " " → 中文 " "' },
  { key: 'chinesePunctuation', label: '中文标点归一', desc: ', . ! ? → ，。！？' },
  { key: 'fixDashes', label: '破折号修正', desc: '-- → ——' },
  { key: 'fixEllipsis', label: '省略号修正', desc: '... → ……' },
  { key: 'indentParagraph', label: '段首两字符缩进', desc: '为每段插入全角空格' },
  { key: 'collapseBlankLines', label: '折叠多余空行' },
  { key: 'trimTrailingSpaces', label: '清除行尾空格' },
]

export function EditorToolbar({
  saving,
  lastSaved,
  wordCount,
  todayNew,
  settings,
  onSettingsChange,
  onSave,
  content,
  onContentChange,
  chapterTitle,
  aiSlot,
}: Props) {
  const [settingsOpen, setSettingsOpen] = useState(false)

  const runFormat = () => {
    const next = formatText(content, settings)
    if (next === content) {
      toast.info('内容已符合当前排版规则')
      return
    }
    onContentChange(next)
    toast.success('已按排版规则整理')
  }

  const exportMarkdown = () => {
    const filename = `${chapterTitle || '章节'}.md`
    downloadTextFile(filename, content, 'text/markdown;charset=utf-8')
    toast.success('已导出 Markdown')
  }
  const exportPlain = () => {
    const filename = `${chapterTitle || '章节'}.txt`
    downloadTextFile(filename, markdownToPlainText(content))
    toast.success('已导出 TXT')
  }

  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b bg-background/70 px-4 py-1.5 backdrop-blur">
      {/* 格式化 */}
      <Button variant="ghost" size="sm" className="h-8" onClick={runFormat} title="按规则整理排版 (Ctrl+Alt+F)">
        <Wand2 data-icon="inline-start" />
        整理排版
      </Button>

      {/* 排版规则设置 */}
      <Popover open={settingsOpen} onOpenChange={setSettingsOpen}>
        <PopoverTrigger asChild>
          <Button variant="ghost" size="icon" className="size-8" title="排版规则">
            <Settings2 className="size-4" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-80">
          <div className="mb-3 flex flex-col gap-1">
            <p className="text-sm font-semibold">排版规则</p>
            <p className="text-[11px] text-muted-foreground">
              点击「整理排版」时按以下规则一次性格式化正文
            </p>
          </div>
          <div className="flex flex-col gap-3">
            {SETTING_ITEMS.map((item) => (
              <label
                key={item.key}
                className="flex cursor-pointer items-start justify-between gap-3 rounded-md p-2 transition-colors hover:bg-muted/40"
              >
                <div className="flex flex-col gap-0.5">
                  <span className="text-sm">{item.label}</span>
                  {item.desc && (
                    <span className="text-[11px] text-muted-foreground">{item.desc}</span>
                  )}
                </div>
                <Switch
                  checked={Boolean(settings[item.key])}
                  onCheckedChange={(v) => onSettingsChange({ [item.key]: v } as Partial<EditorSettings>)}
                />
              </label>
            ))}
          </div>
        </PopoverContent>
      </Popover>

      <span className="mx-1 h-4 w-px bg-border" aria-hidden />

      {/* 视图切换 */}
      <ToggleButton
        active={settings.focusMode}
        onClick={() => onSettingsChange({ focusMode: !settings.focusMode })}
        title="专注模式 (Ctrl+.)"
        icon={<Focus className="size-4" />}
        label="专注"
      />
      <ToggleButton
        active={settings.typewriterMode}
        onClick={() => onSettingsChange({ typewriterMode: !settings.typewriterMode })}
        title="打字机模式"
        icon={<Type className="size-4" />}
        label="打字机"
      />
      <ToggleButton
        active={settings.showTOC}
        onClick={() => onSettingsChange({ showTOC: !settings.showTOC })}
        title="章节内目录"
        icon={<LayoutList className="size-4" />}
        label="目录"
      />
      <ToggleButton
        active={settings.showWordPanel}
        onClick={() => onSettingsChange({ showWordPanel: !settings.showWordPanel })}
        title={settings.showWordPanel ? '收起右侧栏' : '展开右侧栏（概要 · 字数）'}
        icon={
          settings.showWordPanel ? (
            <PanelRightClose className="size-4" />
          ) : (
            <PanelRightOpen className="size-4" />
          )
        }
        label="右栏"
      />
      <ToggleButton
        active={settings.fullscreen}
        onClick={() => onSettingsChange({ fullscreen: !settings.fullscreen })}
        title="全屏 (F11)"
        icon={settings.fullscreen ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
        label={settings.fullscreen ? '退出' : '全屏'}
      />

      <span className="mx-1 h-4 w-px bg-border" aria-hidden />

      {/* 导出 */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8">
            <Download data-icon="inline-start" />
            导出
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start">
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={exportMarkdown}>导出为 Markdown (.md)</DropdownMenuItem>
            <DropdownMenuItem onClick={exportPlain}>导出为纯文本 (.txt)</DropdownMenuItem>
          </DropdownMenuGroup>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* AI slot */}
      {aiSlot && (
        <>
          <span className="mx-1 h-4 w-px bg-border" aria-hidden />
          {aiSlot}
        </>
      )}

      {/* 右侧：字数 + 保存态 */}
      <div className="ms-auto flex items-center gap-2 text-xs text-muted-foreground">
        <ShortcutsButton />
        <Badge variant="secondary" className="h-6 gap-1 font-normal">
          <span className="font-mono tabular-nums">{wordCount.toLocaleString()}</span>
          <span className="text-muted-foreground">字</span>
        </Badge>
        {todayNew > 0 && (
          <Badge variant="outline" className="h-6 gap-1 font-normal">
            <span>今日</span>
            <span className="font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
              +{todayNew.toLocaleString()}
            </span>
          </Badge>
        )}
        <span className="text-[11px]">
          {saving ? '保存中…' : lastSaved ? `已保存 ${lastSaved}` : '—'}
        </span>
        <Button size="sm" variant="ghost" className="h-8" onClick={onSave} title="保存 (Ctrl+S)">
          <Save data-icon="inline-start" />
          保存
        </Button>
      </div>
    </div>
  )
}

function ToggleButton({
  active,
  onClick,
  title,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  title: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Button
      variant={active ? 'secondary' : 'ghost'}
      size="sm"
      className={cn('h-8 gap-1.5', active && 'text-primary')}
      onClick={onClick}
      title={title}
    >
      {icon}
      <span className="hidden lg:inline">{label}</span>
    </Button>
  )
}

function ShortcutsButton() {
  const [open, setOpen] = useState(false)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="size-7" title="快捷键 (Ctrl+/)">
          <Keyboard className="size-3.5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-72">
        <p className="mb-3 text-sm font-semibold">快捷键</p>
        <div className="flex flex-col gap-1.5 text-xs">
          <ShortcutRow k="Ctrl / ⌘ + S" desc="立即保存" />
          <ShortcutRow k="Ctrl + Alt + F" desc="整理排版" />
          <ShortcutRow k="Ctrl + ." desc="切换专注模式" />
          <ShortcutRow k="F11" desc="全屏切换" />
          <ShortcutRow k="Ctrl + /" desc="打开此帮助" />
        </div>
      </PopoverContent>
    </Popover>
  )
}

function ShortcutRow({ k, desc }: { k: string; desc: string }) {
  return (
    <div className="flex items-center justify-between">
      <kbd className="rounded border bg-muted/50 px-1.5 py-0.5 font-mono text-[10px]">{k}</kbd>
      <span className="text-muted-foreground">{desc}</span>
    </div>
  )
}
