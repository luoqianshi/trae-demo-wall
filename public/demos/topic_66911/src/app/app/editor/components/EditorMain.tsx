'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import CharacterCount from '@tiptap/extension-character-count'
import TextAlign from '@tiptap/extension-text-align'
import Highlight from '@tiptap/extension-highlight'
import Heading from '@tiptap/extension-heading'
import { TextStyle } from '@tiptap/extension-text-style'
import { FontFamily } from '@tiptap/extension-font-family'
import { Color } from '@tiptap/extension-color'
import FontSize from 'tiptap-extension-font-size'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table'
import { TableCell } from '@tiptap/extension-table'
import { TableHeader } from '@tiptap/extension-table'
import Image from '@tiptap/extension-image'
import Link from '@tiptap/extension-link'
import Subscript from '@tiptap/extension-subscript'
import Superscript from '@tiptap/extension-superscript'
import { LatexMath } from './LatexMathExtension'
import { useEffect, useRef, useState } from 'react'
import '../page-styles.css'
import 'katex/dist/katex.min.css'

/* ========== AI 幽灵文本插件 ========== */
import { createGhostTextPlugin, ghostTextPluginKey, type WritingPersona } from './AIGhostText'
import { createSlashCommandPlugin } from './SlashCommand'
import { getAIConfig } from '../../../../lib/editor-api'

/* ========== Lucide 图标 ========== */
import {
  Wand2,
  BookOpen,
  Scissors,
  Languages,
  CheckCheck,
  Sparkles,
  Keyboard,
  ChevronDown,
} from 'lucide-react'

interface EditorMainProps {
  content: string
  onUpdate: (html: string, text: string) => void
  onReady: (editor: any) => void
  zoomLevel?: number
  onSave?: () => void
  pageMode?: boolean
}

/* 解析 SSE 流文本（通用格式） */
function parseSSEStream(raw: string): string {
  const lines = raw.split('\n')
  let text = ''
  for (const line of lines) {
    if (line.startsWith('data:')) {
      const payload = line.slice(5).trim()
      if (payload === '[DONE]') continue
      try { text += JSON.parse(payload).content || JSON.parse(payload) }
      catch { text += payload }
    }
  }
  return text || raw
}

/* ========== AI 浮动工具栏组件 ========== */
function AIInlineToolbar({ editor, onClose }: { editor: any; onClose: () => void }) {
  const [loading, setLoading] = useState<string | null>(null)
  const [result, setResult] = useState<string | null>(null)
  const [mode, setMode] = useState<'action' | 'result'>('action')

  const actions = [
    { key: 'polish', label: '润色', prompt: '润色以下文本，使表达更流畅学术化：', icon: Wand2 },
    { key: 'expand', label: '扩写', prompt: '扩写以下文本，增加更多学术细节和论证：', icon: BookOpen },
    { key: 'shorten', label: '精简', prompt: '精简以下文本，保留核心论点，删除冗余表达：', icon: Scissors },
    { key: 'translate', label: '英译', prompt: '将以下中文翻译为学术英文：', icon: Languages },
    { key: 'proofread', label: '纠错', prompt: '检查以下文本的语法错误和措辞不当之处，给出修正后的完整文本：', icon: CheckCheck },
  ]

  const handleAction = async (action: typeof actions[0]) => {
    if (!editor) return
    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    if (!selectedText.trim()) return

    setLoading(action.key)
    try {
      const config = getAIConfig()
      if (!config) { alert('请先在设置中配置 AI'); return }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-config': JSON.stringify(config) },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `${action.prompt}\n\n原文：\n${selectedText}\n\n只输出处理后的文本，不要任何解释。`,
          }],
        }),
      })

      const text = await res.text()
      const parsed = parseSSEStream(text)
      setResult(parsed)
      setMode('result')
    } catch (e: any) { console.error('AI inline edit failed:', e) }
    finally { setLoading(null) }
  }

  const handleAcceptResult = () => {
    if (!result) return
    editor.chain().focus().deleteSelection().insertContent(result).run()
    onClose()
  }

  /* 结果展示模式 */
  if (mode === 'result' && result) {
    return (
      <div className="fixed z-50 bg-white border border-border rounded-lg shadow-2xl p-4 min-w-[320px] max-w-[480px]">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-ochre">AI 建议</span>
          <div className="flex items-center gap-1">
            <button
              onClick={handleAcceptResult}
              className="px-3 py-1 text-xs bg-ochre text-white rounded-md hover:bg-[#4A3728] transition-colors flex items-center gap-1"
            >
              <CheckCheck className="w-3 h-3" /> 采纳
            </button>
            <button onClick={onClose} className="px-2 py-1 text-xs text-ink-light hover:text-ink-secondary">放弃</button>
          </div>
        </div>
        <div className="p-3 bg-paper border border-border rounded-lg text-sm text-ink leading-relaxed whitespace-pre-wrap max-h-48 overflow-y-auto">
          {result}
        </div>
        <p className="text-[10px] text-ink-light mt-2">点击"采纳"替换原文，或继续编辑忽略此建议</p>
      </div>
    )
  }

  /* 操作按钮模式 */
  return (
    <div className="fixed z-50 bg-white border border-border rounded-lg shadow-2xl p-1.5 flex items-center gap-1">
      {actions.map(a => {
        const Icon = a.icon
        return (
          <button
            key={a.key}
            onClick={() => handleAction(a)}
            disabled={loading !== null}
            title={a.label}
            className="px-2.5 py-1.5 text-xs rounded-md hover:bg-ochre-bg text-ink-secondary hover:text-ochre transition-colors disabled:opacity-50 flex items-center gap-1.5 whitespace-nowrap"
          >
            {loading === a.key ? (
              <span className="w-3 h-3 border-2 border-ochre border-t-transparent rounded-full animate-spin" />
            ) : (
              <Icon className="w-3 h-3" />
            )}
            {a.label}
          </button>
        )
      })}
      <button onClick={onClose} className="ml-1 px-1.5 py-1 text-xs text-ink-light hover:text-ink-secondary rounded">x</button>
    </div>
  )
}

/* ========== 主组件 ========== */
export default function EditorMain({ content, onUpdate, onReady, zoomLevel = 100, onSave, pageMode = false }: EditorMainProps) {
  const debounceRef = useRef<NodeJS.Timeout | null>(null)
  const editorRef = useRef<HTMLDivElement>(null)

  /* --- 解析 SSE 流文本 --- */
  function parseSSEStream(raw: string): string {
    const lines = raw.split('\n')
    let text = ''
    for (const line of lines) {
      if (line.startsWith('data:')) {
        const payload = line.slice(5).trim()
        if (payload === '[DONE]') continue
        try { text += JSON.parse(payload).content || JSON.parse(payload) }
        catch { text += payload }
      }
    }
    return text || raw
  }

  /* --- AI 伴写开关与角色 --- */
  const [ghostEnabled, setGhostEnabled] = useState(true)
  const [writingPersona, setWritingPersona] = useState<WritingPersona>('academic')
  const [showPersonaMenu, setShowPersonaMenu] = useState(false)

  /* --- AI 浮动工具栏位置 --- */
  const [aiToolbarPos, setAiToolbarPos] = useState<{ top: number; left: number } | null>(null)

  const handleSlashCommand = async (command: string, query?: string) => {
    if (!editor) return

    const prompts: Record<string, string> = {
      continue: '继续写作，续写以下内容：',
      polish: '润色以下文本，使表达更流畅学术化：',
      expand: '扩写以下文本，增加更多学术细节和论证：',
      shorten: '精简以下文本，保留核心论点：',
      translate: '将以下中文翻译为学术英文：',
      fix: '检查以下文本的语法错误并修正：',
    }

    if (command === 'format' && query) {
      handleFormatCommand(query)
      return
    }

    const prompt = prompts[command]
    if (!prompt) return

    const textBeforeCursor = editor.getText().slice(0, editor.state.selection.from)
    const lastParagraph = textBeforeCursor.split(/\n\n/).pop() || textBeforeCursor

    setAiToolbarPos(null)

    try {
      const config = getAIConfig()
      if (!config) {
        alert('请先在设置中配置 AI')
        return
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-ai-config': JSON.stringify(config) },
        body: JSON.stringify({
          messages: [{
            role: 'user',
            content: `${prompt}\n\n${lastParagraph}\n\n只输出处理后的文本，不要任何解释。`,
          }],
        }),
      })

      const raw = await res.text()
      const result = parseSSEStream(raw)

      if (command === 'continue') {
        editor.chain().focus().insertContent(result).run()
      } else {
        const { from, to } = editor.state.selection
        if (from !== to) {
          editor.chain().focus().deleteSelection().insertContent(result).run()
        } else {
          editor.chain().focus().insertContent(result).run()
        }
      }
    } catch (e) {
      console.error('Slash command failed:', e)
    }
  }

  const handleFormatCommand = (command: string) => {
    if (!editor) return

    const formatCommands: Record<string, () => void> = {
      heading1: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
      heading2: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
      heading3: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
      bold: () => editor.chain().focus().toggleBold().run(),
      bulletList: () => editor.chain().focus().toggleBulletList().run(),
      blockquote: () => editor.chain().focus().toggleBlockquote().run(),
      codeBlock: () => editor.chain().focus().toggleCodeBlock().run(),
    }

    formatCommands[command]?.()
  }

  const editor = useEditor({
    extensions: [
      StarterKit.configure({ heading: false }),
      Heading.configure({ levels: [1, 2, 3] }),
      Placeholder.configure({ placeholder: '执笔挥毫...' }),
      CharacterCount,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight.configure({ multicolor: false }),
      TextStyle,
      FontFamily,
      Color,
      FontSize as any,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Image.configure({ inline: true, allowBase64: true }),
      Link.configure({ openOnClick: false }),
      Subscript,
      Superscript,
      LatexMath,
    ],
    content: content || '<p></p>',
    editorProps: {
      attributes: { class: 'prose-editor' },
    },
    immediatelyRender: true,
    onUpdate: ({ editor }) => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
      debounceRef.current = setTimeout(() => {
        const html = editor.getHTML()
        const text = editor.getText()
        onUpdate(html, text)
      }, 300)
    },
    onBlur: () => { },
  })

  /* --- 动态注册/注销 ProseMirror 插件 --- */
  const updatePersonaRef = useRef<(p: WritingPersona) => void>(() => { })
  const updateEnabledRef = useRef<(enabled: boolean) => void>(() => { })
  const slashCallbackRef = useRef(handleSlashCommand)
  slashCallbackRef.current = handleSlashCommand

  // Ghost 文本插件：只注册一次，通过 ref 控制启用状态
  useEffect(() => {
    if (!editor) return

    const { plugin, updatePersona, updateEnabled } = createGhostTextPlugin({ enabled: ghostEnabled, persona: writingPersona })
    updatePersonaRef.current = updatePersona
    updateEnabledRef.current = updateEnabled

    editor.registerPlugin(plugin)

    return () => {
      try {
        editor.unregisterPlugin(ghostTextPluginKey)
      } catch { /* ignore */ }
    }
  }, [editor])

  // ghostEnabled 变化时只更新 ref，不重新注册插件
  useEffect(() => {
    updateEnabledRef.current(ghostEnabled)
  }, [ghostEnabled])

  // Slash 命令插件：仅注册一次，callback 通过 ref 更新
  useEffect(() => {
    if (!editor) return

    const slashPlugin = createSlashCommandPlugin((cmd, query) => {
      slashCallbackRef.current(cmd, query)
    })
    editor.registerPlugin(slashPlugin)

    return () => {
      try {
        editor.unregisterPlugin('slashCommand')
      } catch { /* ignore */ }
    }
  }, [editor])

  // 角色变化时只更新 ref，不重新注册插件
  useEffect(() => {
    updatePersonaRef.current(writingPersona)
  }, [writingPersona])

  /* --- 监听选中文字，定位 AI 浮动工具栏 --- */
  useEffect(() => {
    if (!editor) return
    const handleSelectionUpdate = () => {
      const { from, to } = editor.state.selection
      if (from !== to) {
        const start = editor.view.coordsAtPos(from)
        const end = editor.view.coordsAtPos(to)
        const editorRect = editor.view.dom.getBoundingClientRect()
        setAiToolbarPos({
          top: Math.max(4, start.top - editorRect.top - 48),
          left: Math.max(0, (start.left + end.right) / 2 - editorRect.left - 160),
        })
      } else {
        setAiToolbarPos(null)
      }
    }
    editor.on('selectionUpdate', handleSelectionUpdate)
    return () => { editor.off('selectionUpdate', handleSelectionUpdate) }
  }, [editor])

  /* --- 显示快捷键帮助弹窗状态 --- */
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  /* --- 全局快捷键处理 --- */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // 忽略输入框内的快捷键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Ctrl+Shift+K：切换 AI 伴写开关
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setGhostEnabled(prev => !prev)
      }
      // Ctrl+S：保存文档
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
        e.preventDefault()
        onSave?.()
      }
      // Ctrl+/：显示快捷键帮助
      if ((e.ctrlKey || e.metaKey) && e.key === '/') {
        e.preventDefault()
        setShowShortcutsHelp(prev => !prev)
      }
      // Alt+\：手动触发AI续写
      if (e.altKey && e.key === '\\') {
        e.preventDefault()
        handleSlashCommand('continue')
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onSave])

  /* --- 编辑器快捷键处理 --- */
  useEffect(() => {
    if (!editor) return

    const handler = (e: KeyboardEvent) => {
      // 忽略输入框内的快捷键
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return

      // Ctrl+B：加粗
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault()
        editor.chain().focus().toggleBold().run()
      }
      // Ctrl+I：斜体
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault()
        editor.chain().focus().toggleItalic().run()
      }
      // Ctrl+U：下划线
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        editor.chain().focus().toggleUnderline().run()
      }
      // Ctrl+Shift+1：标题1
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '1') {
        e.preventDefault()
        editor.chain().focus().toggleHeading({ level: 1 }).run()
      }
      // Ctrl+Shift+2：标题2
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '2') {
        e.preventDefault()
        editor.chain().focus().toggleHeading({ level: 2 }).run()
      }
      // Ctrl+Shift+3：标题3
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === '3') {
        e.preventDefault()
        editor.chain().focus().toggleHeading({ level: 3 }).run()
      }
      // Ctrl+Q：引用
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'q') {
        e.preventDefault()
        editor.chain().focus().toggleBlockquote().run()
      }
      // Ctrl+Shift+C：代码块
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'c') {
        e.preventDefault()
        editor.chain().focus().toggleCodeBlock().run()
      }
      // Ctrl+L：无序列表
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        editor.chain().focus().toggleBulletList().run()
      }
      // Ctrl+Shift+L：有序列表
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        editor.chain().focus().toggleOrderedList().run()
      }
      // Ctrl+D：删除线
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        editor.chain().focus().toggleStrike().run()
      }
      // Ctrl+Shift+P：段落居中
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        editor.chain().focus().setTextAlign('center').run()
      }
      // Ctrl+Shift+R：段落右对齐
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'r') {
        e.preventDefault()
        editor.chain().focus().setTextAlign('right').run()
      }
      // Ctrl+Shift+L：段落左对齐
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key.toLowerCase() === 'l') {
        e.preventDefault()
        editor.chain().focus().setTextAlign('left').run()
      }
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [editor])

  useEffect(() => {
    if (editor && !editor.isDestroyed) {
      onReady(editor)
    }
  }, [editor, onReady])

  // 切换文档时更新内容
  useEffect(() => {
    if (editor && !editor.isDestroyed && content !== undefined) {
      const currentContent = editor.getHTML()
      if (content !== currentContent) {
        editor.commands.setContent(content || '<p></p>')
      }
    }
  }, [content, editor])

  /* 写作角色选项 */
  const personaOptions: { value: WritingPersona; label: string }[] = [
    { value: 'academic', label: '学术' },
    { value: 'general', label: '通用' },
    { value: 'admin', label: '公文' },
  ]

  return (
    <div className="h-full flex flex-col relative">
      {/* 顶部 AI 伴写控制栏 */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-paper border-b border-border select-none">
        <div className="flex items-center gap-3">
          {/* 伴写开关 */}
          <button
            onClick={() => setGhostEnabled(v => !v)}
            title={`AI 伴写 ${ghostEnabled ? '已开启' : '已关闭'} (Ctrl+Shift+K)`}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${ghostEnabled
              ? 'bg-ochre/10 text-ochre hover:bg-ochre/20'
              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
              }`}
          >
            <Sparkles className="w-3 h-3" />
            <span>AI 伴写</span>
            <span className={`w-1.5 h-1.5 rounded-full ${ghostEnabled ? 'bg-green-500' : 'bg-gray-300'}`} />
          </button>

          {/* 写作角色下拉 */}
          <div className="relative">
            <button
              onClick={() => setShowPersonaMenu(v => !v)}
              className="flex items-center gap-1 px-2 py-1 text-xs text-ink-secondary hover:bg-ochre-bg rounded-md transition-colors"
            >
              <Keyboard className="w-3 h-3" />
              <span>角色: {personaOptions.find(p => p.value === writingPersona)?.label}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
            {showPersonaMenu && (
              <div className="absolute top-full left-0 mt-1 glass-card rounded-xl shadow-lg py-1 z-50 min-w-[100px]">
                <div className="px-3 pt-2 pb-1 text-ochre font-display text-xs">写作角色</div>
                {personaOptions.map(p => (
                  <button
                    key={p.value}
                    onClick={() => { setWritingPersona(p.value); setShowPersonaMenu(false) }}
                    className={`w-full text-left px-3 py-1.5 text-xs hover:bg-ochre/5 transition-colors ${writingPersona === p.value ? 'text-ochre font-medium' : 'text-ink-secondary'
                      }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="text-[10px] text-ink-light">
          {ghostEnabled ? 'Tab 采纳 · Esc 取消 · Alt+\\ 手动触发' : '伴写已关闭'}
        </div>
      </div>

      {/* 编辑器主体 */}
      <div
        className={`flex-1 overflow-y-auto relative ${pageMode ? 'editor-paginated' : 'bg-[#E8E4DF]'}`}
        ref={editorRef}
        onClick={() => setShowPersonaMenu(false)}
        style={!pageMode ? { minHeight: '0', height: '100%' } : {}}
      >
        {pageMode ? (
          /* 分页模式：A4 纸张 */
          <div
            className="page-sheet relative"
            data-page-number="1"
            style={{
              width: `${210 * (zoomLevel / 100)}mm`,
              minHeight: `${297 * (zoomLevel / 100)}mm`,
              padding: `${25.4 * (zoomLevel / 100)}mm ${31.7 * (zoomLevel / 100)}mm`,
              boxShadow: '0 2px 20px rgba(44,36,32,0.08), 0 8px 40px rgba(44,36,32,0.04)',
            }}
          >
            {/* 宣纸纹理叠加层 */}
            <div className="absolute inset-0 pointer-events-none rounded-sm opacity-[0.03]"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100' height='100' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
                backgroundRepeat: 'repeat',
                mixBlendMode: 'multiply',
              }}
            />
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="h-full flex items-center justify-center text-ink-muted">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-ochre border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">加载编辑器...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          /* 普通模式：占满容器 */
          <div className="editor-content-area h-full w-full">
            {editor ? (
              <EditorContent editor={editor} />
            ) : (
              <div className="h-full flex items-center justify-center text-ink-muted">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-ochre border-t-transparent rounded-full animate-spin" />
                  <span className="text-xs">加载编辑器...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* AI 浮动工具栏（选中文字时显示） */}
        {aiToolbarPos && editor && (
          <div
            className="absolute z-50"
            style={{ top: aiToolbarPos.top, left: aiToolbarPos.left }}
          >
            <AIInlineToolbar editor={editor} onClose={() => setAiToolbarPos(null)} />
          </div>
        )}

        {/* Bottom padding for scrolling */}
        <div className="h-12" />
      </div>

      {/* 快捷键帮助弹窗 */}
      {showShortcutsHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm" onClick={() => setShowShortcutsHelp(false)}>
          <div className="bg-white rounded-xl shadow-2xl p-6 max-w-lg w-full mx-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-ink">快捷键参考</h3>
              <button onClick={() => setShowShortcutsHelp(false)} className="text-ink-muted hover:text-ink-secondary">
                <span className="text-xl">&times;</span>
              </button>
            </div>

            <div className="space-y-6">
              {/* AI 功能 */}
              <div>
                <h4 className="text-sm font-medium text-ochre mb-3">AI 功能</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">AI 伴写开关</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+K</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">手动续写</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Alt+\</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">显示快捷键</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+/</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">保存文档</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+S</kbd>
                  </div>
                </div>
              </div>

              {/* 文本格式 */}
              <div>
                <h4 className="text-sm font-medium text-ochre mb-3">文本格式</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">加粗</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+B</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">斜体</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+I</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">下划线</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+U</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">删除线</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+D</kbd>
                  </div>
                </div>
              </div>

              {/* 标题 */}
              <div>
                <h4 className="text-sm font-medium text-ochre mb-3">标题</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">标题1</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+1</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">标题2</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+2</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">标题3</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+3</kbd>
                  </div>
                </div>
              </div>

              {/* 列表与引用 */}
              <div>
                <h4 className="text-sm font-medium text-ochre mb-3">列表与引用</h4>
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">无序列表</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+L</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">有序列表</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+L</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">引用</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Q</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">代码块</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+C</kbd>
                  </div>
                </div>
              </div>

              {/* 对齐 */}
              <div>
                <h4 className="text-sm font-medium text-ochre mb-3">文本对齐</h4>
                <div className="grid grid-cols-3 gap-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">居中</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+P</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">右对齐</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+R</kbd>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-ink-secondary">左对齐</span>
                    <kbd className="px-2 py-0.5 text-xs bg-ochre-bg text-ochre rounded font-mono">Ctrl+Shift+L</kbd>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-border">
              <p className="text-xs text-ink-light text-center">
                按 <kbd className="px-1.5 py-0.5 text-ochre rounded font-mono">Esc</kbd> 或点击外部关闭
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
