'use client'

import { Plugin, PluginKey, EditorState, TextSelection } from 'prosemirror-state'
import { Decoration, DecorationSet, EditorView } from 'prosemirror-view'
import { Wand2, Sparkles, BookOpen, Scissors, Languages, CheckCheck, Hash, List, Quote, Code, Heading1, Heading2, Heading3 } from 'lucide-react'
import * as React from 'react'
import * as ReactDOM from 'react-dom'

interface SlashMenuItem {
  id: string
  label: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  action: 'ai' | 'format' | 'insert'
  command?: string
  format?: string
}

const SLASH_MENU_ITEMS: SlashMenuItem[] = [
  { id: 'continue', label: '续写', description: '让智囊继续帮你写作', icon: Sparkles, action: 'ai', command: 'continue' },
  { id: 'polish', label: '润色', description: '优化文字表达', icon: Wand2, action: 'ai', command: 'polish' },
  { id: 'expand', label: '扩写', description: '增添更多内容', icon: BookOpen, action: 'ai', command: 'expand' },
  { id: 'shorten', label: '精简', description: '精简文字内容', icon: Scissors, action: 'ai', command: 'shorten' },
  { id: 'translate', label: '英译', description: '翻译为英文', icon: Languages, action: 'ai', command: 'translate' },
  { id: 'fix', label: '纠错', description: '检查语法错误', icon: CheckCheck, action: 'ai', command: 'fix' },
  { id: 'h1', label: '题首', description: '插入一级标题', icon: Heading1, action: 'format', format: 'heading', command: 'heading1' },
  { id: 'h2', label: '题首', description: '插入二级标题', icon: Heading2, action: 'format', format: 'heading', command: 'heading2' },
  { id: 'h3', label: '题首', description: '插入三级标题', icon: Heading3, action: 'format', format: 'heading', command: 'heading3' },
  { id: 'bold', label: '粗体', description: '加粗选中文字', icon: Hash, action: 'format', command: 'bold' },
  { id: 'list', label: '列表', description: '插入无序列表', icon: List, action: 'format', command: 'bulletList' },
  { id: 'quote', label: '引述', description: '插入引述', icon: Quote, action: 'format', command: 'blockquote' },
  { id: 'code', label: '代码', description: '插入代码块', icon: Code, action: 'format', command: 'codeBlock' },
]

interface SlashState {
  active: boolean
  query: string
  selectedIndex: number
}

const slashCommandKey = new PluginKey<SlashState>('slashCommand')

export function createSlashCommandPlugin(callback: (command: string, query?: string) => void) {
  return new Plugin<SlashState>({
    key: slashCommandKey,
    state: {
      init() {
        return { active: false, query: '', selectedIndex: 0 }
      },
      apply(tr, value, oldState, newState) {
        const stored = tr.getMeta(slashCommandKey)
        if (stored) {
          return { ...value, ...stored }
        }

        const textBefore = getTextBeforeCursor(newState)
        const match = textBefore.match(/(\/[\w]*)$/)

        if (match) {
          const query = match[1].slice(1)
          return { active: true, query, selectedIndex: 0 }
        }

        return { active: false, query: '', selectedIndex: 0 }
      },
    },
    props: {
      handleKeyDown(view: EditorView, event: KeyboardEvent) {
        const state = slashCommandKey.getState(view.state)

        if (!state?.active) return false

        if (event.key === 'ArrowDown') {
          view.dispatch(view.state.tr.setMeta(slashCommandKey, {
            selectedIndex: Math.min(state.selectedIndex + 1, SLASH_MENU_ITEMS.length - 1)
          }))
          return true
        }

        if (event.key === 'ArrowUp') {
          view.dispatch(view.state.tr.setMeta(slashCommandKey, {
            selectedIndex: Math.max(state.selectedIndex - 1, 0)
          }))
          return true
        }

        if (event.key === 'Enter') {
          const filtered = filterMenuItems(state.query)
          const selected = filtered[state.selectedIndex]
          if (selected) {
            executeCommand(view, selected, callback)
          }
          return true
        }

        if (event.key === 'Escape') {
          view.dispatch(view.state.tr.setMeta(slashCommandKey, { active: false }))
          return true
        }

        return false
      },
      decorations(state) {
        const pluginState = slashCommandKey.getState(state)
        if (!pluginState?.active) return null

        const { from } = state.selection
        const $from = state.doc.resolve(from)

        return DecorationSet.create(state.doc, [
          Decoration.widget(from, (view) => {
            const dom = document.createElement('div')
            ReactDOM.render(
              <SlashMenu
                query={pluginState.query}
                selectedIndex={pluginState.selectedIndex}
                onSelect={(item) => executeCommand(view, item, callback)}
              />,
              dom
            )
            return dom
          })
        ])
      },
    },
  })
}

function getTextBeforeCursor(state: EditorState): string {
  const { from } = state.selection
  const $from = state.doc.resolve(from)
  const start = $from.before()
  if (start < 0) return ''
  return state.doc.textBetween(start, from)
}

function filterMenuItems(query: string): SlashMenuItem[] {
  if (!query) return SLASH_MENU_ITEMS
  const lowerQuery = query.toLowerCase()
  return SLASH_MENU_ITEMS.filter(item =>
    item.label.toLowerCase().includes(lowerQuery) ||
    item.description.toLowerCase().includes(lowerQuery)
  )
}

function executeCommand(view: EditorView | null, item: SlashMenuItem, callback: (command: string, query?: string) => void) {
  if (view) {
    const { from } = view.state.selection
    const textBefore = getTextBeforeCursor(view.state)
    const match = textBefore.match(/(\/[\w]*)$/)
    if (match) {
      const deleteFrom = from - match[1].length
      view.dispatch(view.state.tr.delete(deleteFrom, from))
    }
    view.dispatch(view.state.tr.setMeta(slashCommandKey, { active: false }))
    view.focus()
  }

  if (item.action === 'ai') {
    callback(item.command || item.id)
  } else if (item.action === 'format') {
    callback('format', item.command)
  }
}

function SlashMenu({ query, selectedIndex, onSelect }: { query: string; selectedIndex: number; onSelect: (item: SlashMenuItem) => void }) {
  const filtered = filterMenuItems(query)

  if (filtered.length === 0) {
    return (
      <div className="absolute z-50 left-0 top-0 w-72 bg-paper border border-border rounded-xl shadow-xl overflow-hidden mt-2">
        <div className="p-3 text-sm text-ink-light text-center">未找到匹配的命令</div>
      </div>
    )
  }

  return (
    <div className="absolute z-50 left-0 top-0 w-72 bg-paper border border-border rounded-xl shadow-xl overflow-hidden mt-2">
      <div className="px-4 py-2 border-b border-border">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-md bg-ochre flex items-center justify-center">
            <Sparkles className="w-3 h-3 text-white" />
          </div>
          <span className="text-xs font-medium text-ink-secondary">命令菜单</span>
        </div>
        {query && (
          <p className="text-[10px] text-ink-light mt-1">搜索: {query}</p>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto">
        {filtered.map((item, index) => {
          const Icon = item.icon
          const isSelected = index === selectedIndex
          return (
            <button
              key={item.id}
              onClick={() => onSelect(item)}
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${isSelected ? 'bg-ochre-bg text-ochre' : 'hover:bg-paper text-ink-secondary'
                }`}
            >
              <div className={`w-7 h-7 rounded-md flex items-center justify-center ${isSelected ? 'bg-ochre/10' : 'bg-paper'
                }`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{item.label}</div>
                <div className="text-xs text-ink-light truncate">{item.description}</div>
              </div>
              {isSelected && (
                <span className="text-[10px] text-ink-light">Enter</span>
              )}
            </button>
          )
        })}
      </div>
      <div className="px-4 py-2 border-t border-border bg-paper">
        <div className="flex items-center justify-between text-[10px] text-ink-light">
          <span>上下键选择</span>
          <span>回车确认</span>
        </div>
      </div>
    </div>
  )
}
