'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Editor } from '@tiptap/react'
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Heading1,
  Heading2,
  Heading3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Highlighter,
  Undo,
  Redo,
  Quote,
  Code,
  Minus,
  Sparkles,
  Save,
  Type,
  Palette,
  Table,
  ChevronDown,
  FileDown,
  Printer,
  Wand2,
  Paintbrush,
  Languages,
  BookOpen,
  Lightbulb,
  Check,
  Image as ImageIcon,
  Link as LinkIcon,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Eraser,
  Search,
  Replace,
  Indent,
  Outdent,
  AlignVerticalSpaceAround,
  Timer,
  Sigma,
  FunctionSquare,
} from 'lucide-react'

interface EditorToolbarProps {
  editor: Editor | null
  onSave: () => void
  saveStatus: 'saved' | 'saving' | 'unsaved'
  onAISuggest: () => void
  onExport?: () => void
  onTogglePomodoro?: () => void
}

/* ---- Font and size constants ---- */
const FONT_SIZES = ['12', '14', '16', '18', '20', '24', '28', '32', '36']
const FONT_FAMILIES = [
  { label: '宋体', value: 'SimSun, serif' },
  { label: '黑体', value: 'SimHei, sans-serif' },
  { label: '微软雅黑', value: 'Microsoft YaHei, sans-serif' },
  { label: '楷体', value: 'KaiTi, serif' },
  { label: '仿宋', value: 'FangSong, serif' },
]

/* ---- Keyboard shortcut hint helper ---- */
function shortcutHint(shortcut: string) {
  return (
    <kbd className="hidden lg:inline-flex items-center px-1 py-0.5 text-[10px] font-mono text-ink-muted bg-ink/5 border border-ink/10 rounded-[6px] ml-1">
      {shortcut}
    </kbd>
  )
}

export default function EditorToolbar({ editor, onSave, saveStatus, onAISuggest, onExport, onTogglePomodoro }: EditorToolbarProps) {
  const [activeTab, setActiveTab] = useState<'home' | 'insert' | 'ai'>('home')
  const [openDropdown, setOpenDropdown] = useState<string | null>(null)
  const [currentFont, setCurrentFont] = useState<string>('字体')
  const [currentFontSize, setCurrentFontSize] = useState<string>('字号')
  const [showFindReplace, setShowFindReplace] = useState(false)
  const [findText, setFindText] = useState('')
  const [replaceText, setReplaceText] = useState('')
  const [matchCount, setMatchCount] = useState(0)
  const [currentMatchIndex, setCurrentMatchIndex] = useState(0)
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({})

  /* ---- Close dropdown on outside click ---- */
  const handleDocumentClick = useCallback(() => {
    setOpenDropdown(null)
  }, [])

  useEffect(() => {
    document.addEventListener('click', handleDocumentClick)
    return () => document.removeEventListener('click', handleDocumentClick)
  }, [handleDocumentClick])

  const toggleDropdown = (name: string) => {
    setOpenDropdown(prev => prev === name ? null : name)
  }

  /* ---- Update font info when editor changes ---- */
  useEffect(() => {
    if (!editor) return

    const updateFontInfo = () => {
      const attrs = editor.getAttributes('textStyle')

      // Update font family
      const fontFamily = attrs.fontFamily
      if (fontFamily) {
        const foundFont = FONT_FAMILIES.find(f => {
          const cleanVal = f.value.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
          const cleanAttr = fontFamily.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
          return cleanVal === cleanAttr || fontFamily.includes(cleanVal) || cleanAttr.includes(cleanVal)
        })
        setCurrentFont(foundFont?.label || '字体')
      } else {
        const { from } = editor.state.selection
        const dom = editor.view.domAtPos(from)?.node
        if (dom && dom.parentElement) {
          const computed = window.getComputedStyle(dom.parentElement)
          const computedFont = computed.fontFamily
          const foundFont = FONT_FAMILIES.find(f => {
            const cleanVal = f.value.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
            const cleanAttr = computedFont.split(',')[0].trim().replace(/['"]/g, '').toLowerCase()
            return cleanVal === cleanAttr || computedFont.includes(cleanVal) || cleanAttr.includes(cleanVal)
          })
          setCurrentFont(foundFont?.label || '字体')
        } else {
          setCurrentFont('字体')
        }
      }

      // Update font size
      const fontSize = attrs.fontSize
      if (fontSize) {
        const match = fontSize.match(/(\d+)/)
        setCurrentFontSize(match ? match[1] : '字号')
      } else {
        const { from } = editor.state.selection
        const dom = editor.view.domAtPos(from)?.node
        if (dom && dom.parentElement) {
          const computed = window.getComputedStyle(dom.parentElement)
          const px = parseFloat(computed.fontSize)
          if (px) {
            setCurrentFontSize(Math.round(px).toString())
          } else {
            setCurrentFontSize('字号')
          }
        } else {
          setCurrentFontSize('字号')
        }
      }
    }

    updateFontInfo()
    editor.on('update', updateFontInfo)
    editor.on('selectionUpdate', updateFontInfo)

    return () => {
      editor.off('update', updateFontInfo)
      editor.off('selectionUpdate', updateFontInfo)
    }
  }, [editor])

  // 编辑器未初始化时显示空工具栏
  if (!editor) {
    return <div className="..." />
  }

  const fontSizes = FONT_SIZES
  const fontFamilies = FONT_FAMILIES

  const ToolButton = ({
    onClick,
    isActive = false,
    disabled = false,
    title,
    children,
    className = '',
    shortcut,
  }: {
    onClick: () => void
    isActive?: boolean
    disabled?: boolean
    title: string
    children: React.ReactNode
    className?: string
    shortcut?: string
  }) => (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-pressed={isActive}
      className={`p-1.5 rounded-[10px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 ${isActive
        ? 'bg-ochre/10 text-ochre shadow-sm'
        : disabled
          ? 'text-ink-light/50 cursor-not-allowed'
          : 'text-ink-secondary hover:bg-ochre/5 hover:text-ink'
        } ${className}`}
    >
      <span className="flex items-center gap-0.5">
        {children}
        {shortcut && shortcutHint(shortcut)}
      </span>
    </button>
  )

  const Divider = () => <div className="w-8 h-px bg-gradient-to-r from-transparent via-ochre/15 to-transparent mx-1" role="separator" aria-hidden="true" />

  const colors = [
    '#000000', '#333333', '#666666', '#999999',
    '#B54A3A', '#8B5E3C', '#4A6B8A', '#2E7D32',
    '#C62828', '#D84315', '#F9A825', '#1565C0'
  ]

  const tabOrder = ['home', 'insert', 'ai'] as const

  const TabButton = ({ id, label, icon: Icon }: { id: typeof activeTab; label: string; icon: any }) => (
    <button
      ref={(el) => { tabRefs.current[id] = el }}
      onClick={() => setActiveTab(id)}
      className={`px-4 py-1.5 text-xs font-medium transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 ${activeTab === id
        ? 'text-ochre'
        : 'text-ink-muted hover:text-ink-secondary'
        }`}
    >
      <span className="flex items-center gap-1.5">
        <Icon className="w-3.5 h-3.5" />
        {label}
      </span>
    </button>
  )

  return (
    <div className="liquid-glass border-b border-ochre/10" role="toolbar" aria-label="编辑器工具栏">
      {/* Tab bar */}
      <div className="flex items-center border-b border-ochre/5 relative">
        <TabButton id="home" label="开始" icon={Type} />
        <TabButton id="insert" label="插入" icon={Paintbrush} />
        <TabButton id="ai" label="智囊" icon={Wand2} />
        {/* Sliding ink gradient indicator */}
        <div
          className="absolute bottom-0 h-[2px] bg-gradient-to-r from-transparent via-ochre to-transparent transition-all duration-300 pointer-events-none"
          style={{
            left: tabRefs.current[activeTab]
              ? `${tabRefs.current[activeTab].offsetLeft}px`
              : '0px',
            width: tabRefs.current[activeTab]
              ? `${tabRefs.current[activeTab].offsetWidth}px`
              : '0px',
          }}
        />
        <div className="flex-1" />
        {/* Save status */}
        <div className="flex items-center gap-2 px-4 text-xs">
          {saveStatus === 'saved' && (
            <span className="text-green-600 flex items-center gap-1" role="status">
              <Check className="w-3 h-3 animate-[scaleIn_0.3s_ease-out]" />
              已存
            </span>
          )}
          {saveStatus === 'saving' && (
            <span className="text-ochre flex items-center gap-1" role="status" aria-live="polite">
              <Save className="w-3 h-3 animate-pulse" />
              存档中...
            </span>
          )}
          {saveStatus === 'unsaved' && (
            <span className="text-cinnabar flex items-center gap-1 animate-pulse" role="status">
              <Save className="w-3 h-3" />
              未存
            </span>
          )}
          <button
            onClick={onSave}
            className="btn-primary px-3 py-1 text-xs"
            aria-label="保存文档"
          >
            保存
          </button>
        </div>
      </div>

      {/* Toolbar content */}
      <div className="flex items-center gap-1 px-3 py-2 flex-wrap">
        {activeTab === 'home' && (
          <>
            {/* Undo/Redo */}
            <ToolButton
              onClick={() => editor?.chain().focus().undo().run()}
              disabled={!editor?.can()?.undo()}
              title="撤回"
              shortcut="Ctrl+Z"
            >
              <Undo className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor?.chain().focus().redo().run()}
              disabled={!editor?.can()?.redo()}
              title="重做"
              shortcut="Ctrl+Y"
            >
              <Redo className="w-4 h-4" />
            </ToolButton>

            {/* Find/Replace */}
            <ToolButton
              onClick={() => setShowFindReplace(!showFindReplace)}
              isActive={showFindReplace}
              title="查找/替换"
              shortcut="Ctrl+F"
            >
              <Search className="w-4 h-4" />
            </ToolButton>

            {/* Pomodoro Timer */}
            <ToolButton
              onClick={() => onTogglePomodoro?.()}
              isActive={false}
              title="番茄钟"
            >
              <Timer className="w-4 h-4" />
            </ToolButton>

            <Divider />

            {/* Font Family */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => toggleDropdown('font')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-ink-secondary hover:bg-ochre/5 rounded-[10px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                title="字体"
              >
                <Type className="w-3.5 h-3.5" />
                <span className="max-w-[60px] truncate">{currentFont}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'font' && (
                <div className="absolute top-full left-0 mt-1.5 liquid-glass rounded-[16px] shadow-lg z-50 py-1 min-w-[140px] animate-modal-appear" onClick={(e) => e.stopPropagation()}>
                  {fontFamilies.map((font) => (
                    <button
                      key={font.value}
                      onClick={(e) => {
                        e.stopPropagation()
                        editor.chain().focus().setFontFamily(font.value).run()
                        setOpenDropdown(null)
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                      style={{ fontFamily: font.value }}
                    >
                      {font.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Font Size */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => toggleDropdown('size')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-ink-secondary hover:bg-ochre/5 rounded-[10px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                title="字号"
              >
                <span className="text-xs font-medium">{currentFontSize}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'size' && (
                <div className="absolute top-full left-0 mt-1.5 liquid-glass rounded-[16px] shadow-lg z-50 py-1 min-w-[80px] animate-modal-appear" onClick={(e) => e.stopPropagation()}>
                  {fontSizes.map((size) => (
                    <button
                      key={size}
                      onClick={(e) => {
                        e.stopPropagation()
                        editor.chain().focus().setFontSize(`${size}px`).run()
                        setOpenDropdown(null)
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                    >
                      {size}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Divider />

            {/* Text formatting */}
            <ToolButton
              onClick={() => editor.chain().focus().toggleBold().run()}
              isActive={editor.isActive('bold')}
              title="加粗"
              shortcut="Ctrl+B"
            >
              <Bold className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleItalic().run()}
              isActive={editor.isActive('italic')}
              title="斜体"
              shortcut="Ctrl+I"
            >
              <Italic className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              isActive={editor.isActive('underline')}
              title="下划线"
              shortcut="Ctrl+U"
            >
              <Underline className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleStrike().run()}
              isActive={editor.isActive('strike')}
              title="删除线"
            >
              <Strikethrough className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleHighlight().run()}
              isActive={editor.isActive('highlight')}
              title="高亮"
            >
              <Highlighter className="w-4 h-4" />
            </ToolButton>

            {/* Color picker */}
            <div className="relative group">
              <ToolButton onClick={() => { }} title="文字颜色">
                <Palette className="w-4 h-4" />
              </ToolButton>
              <div className="absolute top-full left-0 mt-1.5 liquid-glass rounded-[16px] shadow-lg z-50 p-2 hidden group-hover:grid grid-cols-4 gap-1 animate-modal-appear">
                {colors.map((color) => (
                  <button
                    key={color}
                    onClick={() => editor.chain().focus().setColor(color).run()}
                    className="w-5 h-5 rounded-[6px] border border-ink/10 hover:scale-125 transition-transform duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
              </div>
            </div>

            <Divider />

            {/* Alignment */}
            <ToolButton
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
              isActive={editor.isActive({ textAlign: 'left' })}
              title="左对齐"
            >
              <AlignLeft className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
              isActive={editor.isActive({ textAlign: 'center' })}
              title="居中"
            >
              <AlignCenter className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
              isActive={editor.isActive({ textAlign: 'right' })}
              title="右对齐"
            >
              <AlignRight className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
              isActive={editor.isActive({ textAlign: 'justify' })}
              title="两端对齐"
            >
              <AlignJustify className="w-4 h-4" />
            </ToolButton>

            <Divider />

            {/* Lists */}
            <ToolButton
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              isActive={editor.isActive('bulletList')}
              title="无序"
            >
              <List className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              isActive={editor.isActive('orderedList')}
              title="有序"
            >
              <ListOrdered className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              isActive={editor.isActive('blockquote')}
              title="引述"
            >
              <Quote className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleCode().run()}
              isActive={editor.isActive('code')}
              title="代码"
            >
              <Code className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
              title="分隔"
            >
              <Minus className="w-4 h-4" />
            </ToolButton>

            <Divider />

            {/* Subscript/Superscript */}
            <ToolButton
              onClick={() => editor.chain().focus().toggleSubscript().run()}
              isActive={editor.isActive('subscript')}
              title="下标"
            >
              <SubscriptIcon className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleSuperscript().run()}
              isActive={editor.isActive('superscript')}
              title="上标"
            >
              <SuperscriptIcon className="w-4 h-4" />
            </ToolButton>

            {/* Clear formatting */}
            <ToolButton
              onClick={() => editor.chain().focus().unsetAllMarks().run()}
              title="清除格式"
            >
              <Eraser className="w-4 h-4" />
            </ToolButton>

            {/* Divider */}
            <div className="w-px h-5 bg-border mx-0.5" />

            {/* LaTeX Math */}
            <ToolButton
              onClick={() => editor.chain().focus().insertInlineMath().run()}
              title="行内公式 $...$"
            >
              <Sigma className="w-4 h-4" />
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().insertBlockMath().run()}
              title="块级公式 $$...$$"
            >
              <FunctionSquare className="w-4 h-4" />
            </ToolButton>
          </>
        )}

        {activeTab === 'insert' && (
          <>
            {/* Headings */}
            <ToolButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
              isActive={editor.isActive('heading', { level: 1 })}
              title="一级标题"
              className="flex items-center gap-1"
            >
              <Heading1 className="w-4 h-4" />
              <span className="text-xs">题首 1</span>
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
              isActive={editor.isActive('heading', { level: 2 })}
              title="二级标题"
              className="flex items-center gap-1"
            >
              <Heading2 className="w-4 h-4" />
              <span className="text-xs">题首 2</span>
            </ToolButton>
            <ToolButton
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
              isActive={editor.isActive('heading', { level: 3 })}
              title="三级标题"
              className="flex items-center gap-1"
            >
              <Heading3 className="w-4 h-4" />
              <span className="text-xs">题首 3</span>
            </ToolButton>

            <Divider />

            {/* Line Height */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => toggleDropdown('lineHeight')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-ink-secondary hover:bg-ochre/5 rounded-[10px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                title="行距"
              >
                <AlignVerticalSpaceAround className="w-3.5 h-3.5" />
                <span className="text-xs">行距</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'lineHeight' && (
                <div className="absolute top-full left-0 mt-1.5 liquid-glass rounded-[16px] shadow-lg z-50 py-1 min-w-[80px] animate-modal-appear">
                  {['1', '1.5', '2', '2.5', '3'].map((lh) => (
                    <button
                      key={lh}
                      onClick={() => {
                        editor?.chain().focus().updateAttributes('paragraph', { class: `line-height-${lh.replace('.', '-')}` }).run()
                        setOpenDropdown(null)
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                    >
                      {lh}倍
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Text Indent */}
            <div className="relative" onClick={(e) => e.stopPropagation()}>
              <button
                onClick={() => toggleDropdown('indent')}
                className="flex items-center gap-1 px-2 py-1.5 text-xs text-ink-secondary hover:bg-ochre/5 rounded-[10px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
                title="缩进"
              >
                <Indent className="w-3.5 h-3.5" />
                <span className="text-xs">缩进</span>
                <ChevronDown className="w-3 h-3" />
              </button>
              {openDropdown === 'indent' && (
                <div className="absolute top-full left-0 mt-1.5 liquid-glass rounded-[16px] shadow-lg z-50 py-1 min-w-[80px] animate-modal-appear">
                  {['0', '2', '4', '6'].map((ind) => (
                    <button
                      key={ind}
                      onClick={() => {
                        editor?.chain().focus().updateAttributes('paragraph', { class: `text-indent-${ind}` }).run()
                        setOpenDropdown(null)
                      }}
                      className="w-full text-left px-3 py-1.5 text-xs text-ink hover:bg-ochre/5 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-[0.98]"
                    >
                      {ind === '0' ? '无' : `${ind}字符`}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <Divider />

            {/* Export */}
            <ToolButton
              onClick={() => onExport?.()}
              title="导出为 Word"
              className="flex items-center gap-1"
            >
              <FileDown className="w-4 h-4" />
              <span className="text-xs">导出</span>
            </ToolButton>
            <ToolButton
              onClick={() => window.print()}
              title="打印"
              className="flex items-center gap-1"
            >
              <Printer className="w-4 h-4" />
              <span className="text-xs">打印</span>
            </ToolButton>

            <Divider />

            {/* Table */}
            <ToolButton
              onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
              title="插入表格"
              className="flex items-center gap-1"
            >
              <Table className="w-4 h-4" />
              <span className="text-xs">表格</span>
            </ToolButton>

            {/* Image */}
            <ToolButton
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'image/*'
                input.onchange = (e) => {
                  const file = (e.target as HTMLInputElement).files?.[0]
                  if (file) {
                    const reader = new FileReader()
                    reader.onload = () => {
                      editor?.chain().focus().setImage({ src: reader.result as string }).run()
                    }
                    reader.readAsDataURL(file)
                  }
                }
                input.click()
              }}
              title="插入图片"
              className="flex items-center gap-1"
            >
              <ImageIcon className="w-4 h-4" />
              <span className="text-xs">图片</span>
            </ToolButton>

            {/* Link */}
            <ToolButton
              onClick={() => {
                const url = window.prompt('请输入链接地址：')
                if (url) {
                  editor?.chain().focus().setLink({ href: url }).run()
                }
              }}
              isActive={editor.isActive('link')}
              title="插入/编辑链接"
              className="flex items-center gap-1"
            >
              <LinkIcon className="w-4 h-4" />
              <span className="text-xs">链接</span>
            </ToolButton>
          </>
        )}

        {activeTab === 'ai' && (
          <>
            <button
              onClick={onAISuggest}
              className="btn-primary golden-glow flex items-center gap-2 px-4 py-2 text-xs rounded-[12px]"
            >
              <Sparkles className="w-4 h-4" />
              AI 智能续写
            </button>
            <button
              onClick={() => { }}
              className="flex items-center gap-2 px-4 py-2 border-l-2 border-ochre/60 border border-ochre/10 text-ink-secondary text-xs rounded-[12px] hover:bg-ochre/5 hover:border-ochre/30 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30"
            >
              <Wand2 className="w-4 h-4 text-ochre" />
              论文润色
            </button>
            <button
              onClick={() => { }}
              className="flex items-center gap-2 px-4 py-2 border-l-2 border-indigo/60 border border-indigo/10 text-ink-secondary text-xs rounded-[12px] hover:bg-ochre/5 hover:border-indigo/30 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo/30"
            >
              <Languages className="w-4 h-4 text-indigo" />
              中英互译
            </button>
            <button
              onClick={() => { }}
              className="flex items-center gap-2 px-4 py-2 border-l-2 border-[#6B8E5A]/60 border border-[#6B8E5A]/10 text-ink-secondary text-xs rounded-[12px] hover:bg-ochre/5 hover:border-[#6B8E5A]/30 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6B8E5A]/30"
            >
              <BookOpen className="w-4 h-4 text-[#6B8E5A]" />
              文献引用
            </button>
            <button
              onClick={() => { }}
              className="flex items-center gap-2 px-4 py-2 border-l-2 border-cinnabar/60 border border-cinnabar/10 text-ink-secondary text-xs rounded-[12px] hover:bg-ochre/5 hover:border-cinnabar/30 transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cinnabar/30"
            >
              <Lightbulb className="w-4 h-4 text-cinnabar" />
              结构分析
            </button>
          </>
        )}
      </div>

      {/* Find/Replace Panel */}
      {showFindReplace && (
        <div className="absolute top-full left-0 right-0 mt-2 liquid-glass rounded-xl shadow-lg p-3 z-50 animate-modal-appear">
          <div className="flex items-center gap-2 mb-2">
            <input
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              placeholder="查找..."
              className="flex-1 px-3 py-1.5 text-sm bg-white border border-border rounded-lg text-ink focus:outline-none focus:border-ochre"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleFindNext()
                }
              }}
            />
            <button
              onClick={handleFindNext}
              disabled={!findText}
              className="px-3 py-1.5 text-xs bg-ochre text-white rounded-lg hover:bg-[#4A3728] transition-colors disabled:opacity-50"
            >
              下一个 ({matchCount > 0 ? `${currentMatchIndex + 1}/${matchCount}` : '0'})
            </button>
            <button
              onClick={handleFindPrev}
              disabled={!findText}
              className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg hover:bg-ochre/5 transition-colors disabled:opacity-50"
            >
              上一个
            </button>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              placeholder="替换为..."
              className="flex-1 px-3 py-1.5 text-sm bg-white border border-border rounded-lg text-ink focus:outline-none focus:border-ochre"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleReplace()
                }
              }}
            />
            <button
              onClick={handleReplace}
              disabled={!findText || matchCount === 0}
              className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg hover:bg-ochre/5 transition-colors disabled:opacity-50"
            >
              替换
            </button>
            <button
              onClick={handleReplaceAll}
              disabled={!findText || matchCount === 0}
              className="px-3 py-1.5 text-xs bg-white border border-border rounded-lg hover:bg-ochre/5 transition-colors disabled:opacity-50"
            >
              全部替换
            </button>
          </div>
        </div>
      )}
    </div>
  )

  function handleFindNext() {
    if (!editor || !findText) return
    const { from } = editor.state.selection
    const doc = editor.state.doc
    const text = doc.textBetween(0, doc.content.size, '\n')
    const matches: number[] = []
    let pos = 0
    while ((pos = text.indexOf(findText, pos)) !== -1) {
      matches.push(pos)
      pos += findText.length
    }
    setMatchCount(matches.length)
    if (matches.length === 0) return

    let nextIndex = matches.findIndex(m => m > from)
    if (nextIndex === -1) nextIndex = 0
    setCurrentMatchIndex(nextIndex)

    editor.chain().focus().setTextSelection({ from: matches[nextIndex], to: matches[nextIndex] + findText.length }).run()
  }

  function handleFindPrev() {
    if (!editor || !findText) return
    const { from } = editor.state.selection
    const doc = editor.state.doc
    const text = doc.textBetween(0, doc.content.size, '\n')
    const matches: number[] = []
    let pos = 0
    while ((pos = text.indexOf(findText, pos)) !== -1) {
      matches.push(pos)
      pos += findText.length
    }
    setMatchCount(matches.length)
    if (matches.length === 0) return

    let prevIndex = matches.findLastIndex(m => m < from)
    if (prevIndex === -1) prevIndex = matches.length - 1
    setCurrentMatchIndex(prevIndex)

    editor.chain().focus().setTextSelection({ from: matches[prevIndex], to: matches[prevIndex] + findText.length }).run()
  }

  function handleReplace() {
    if (!editor || !findText || matchCount === 0) return
    editor.chain().focus().insertContent(replaceText).run()
    handleFindNext()
  }

  function handleReplaceAll() {
    if (!editor || !findText || matchCount === 0) return
    const doc = editor.state.doc
    const text = doc.textBetween(0, doc.content.size, '\n')
    const newText = text.split(findText).join(replaceText)
    editor.chain().focus().setContent(newText).run()
    setMatchCount(0)
    setCurrentMatchIndex(0)
  }
}
