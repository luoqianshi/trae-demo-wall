import { Component, forwardRef, useEffect, useImperativeHandle, useRef, type ReactNode } from 'react'
import { Crepe, CrepeFeature } from '@milkdown/crepe'
import { useEditor, Milkdown, MilkdownProvider } from '@milkdown/react'
import { editorViewOptionsCtx, parserCtx } from '@milkdown/kit/core'
import { Slice } from '@milkdown/kit/prose/model'
import type { EditorView } from '@milkdown/kit/prose/view'
import '@milkdown/crepe/theme/common/style.css'
import '@milkdown/crepe/theme/nord.css'
import './milkdown-theme.css'

interface MilkdownEditorProps {
  value: string
  onChange: (markdown: string) => void
  readOnly?: boolean
  onReady?: () => void
  onError?: (error: Error) => void
}

interface MilkdownEditorBoundaryProps {
  value: string
  children: ReactNode
  onError?: (error: Error) => void
}

interface MilkdownEditorBoundaryState {
  hasError: boolean
  errorMessage: string
}

export interface MilkdownEditorHandle {
  getMarkdown: () => string
}

const MARKDOWN_PATTERN = /(^|\n)\s{0,3}(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|\|.*\|)|\*\*.+\*\*|\[.+\]\(.+\)|!\[.*\]\(.+\)/

class MilkdownEditorBoundary extends Component<MilkdownEditorBoundaryProps, MilkdownEditorBoundaryState> {
  state: MilkdownEditorBoundaryState = {
    hasError: false,
    errorMessage: '',
  }

  static getDerivedStateFromError(error: Error): MilkdownEditorBoundaryState {
    return {
      hasError: true,
      errorMessage: error.message,
    }
  }

  componentDidCatch(error: Error) {
    this.props.onError?.(error)
  }

  componentDidUpdate(prevProps: MilkdownEditorBoundaryProps) {
    if (prevProps.value !== this.props.value && this.state.hasError) {
      this.setState({ hasError: false, errorMessage: '' })
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <textarea
          className="h-full min-h-[420px] w-full resize-none bg-background p-6 font-mono text-sm leading-7 outline-none"
          value={this.props.value}
          readOnly
          aria-label="Markdown 内容"
          title={this.state.errorMessage || 'Markdown 编辑器加载失败'}
        />
      )
    }

    return this.props.children
  }
}

const MilkdownEditorInner = forwardRef<MilkdownEditorHandle, MilkdownEditorProps>(function MilkdownEditorInner({ value, onChange, readOnly, onReady }, ref) {
  const safeValue = typeof value === 'string' ? value : ''
  const onChangeRef = useRef(onChange)

  useEffect(() => {
    onChangeRef.current = onChange
  }, [onChange])

  const initializedRef = useRef(false)
  const crepeRef = useRef<Crepe | null>(null)

  const { loading, get } = useEditor((container) => {
    const crepe = new Crepe({
      root: container,
      defaultValue: safeValue,
      features: {
        [CrepeFeature.Toolbar]: true,
        [CrepeFeature.TopBar]: true,
        [CrepeFeature.ImageBlock]: true,
        [CrepeFeature.Table]: true,
        [CrepeFeature.BlockEdit]: true,
        [CrepeFeature.LinkTooltip]: true,
        [CrepeFeature.ListItem]: true,
        [CrepeFeature.Cursor]: true,
        [CrepeFeature.Placeholder]: true,
        [CrepeFeature.CodeMirror]: false,
        [CrepeFeature.Latex]: false,
        [CrepeFeature.AI]: false,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: '输入内容，支持 Markdown 语法...',
          mode: 'doc',
        },
        [CrepeFeature.BlockEdit]: {
          textGroup: {
            label: '文本',
            text: { label: '正文', icon: '' },
            h1: null,
            h2: null,
            h3: null,
            h4: null,
            h5: null,
            h6: null,
            quote: null,
            divider: { label: '分割线', icon: '' },
          },
          listGroup: {
            label: '列表',
            bulletList: { label: '无序列表', icon: '' },
            orderedList: { label: '有序列表', icon: '' },
            taskList: { label: '任务列表', icon: '' },
          },
          advancedGroup: {
            label: '高级',
            image: { label: '图片', icon: '' },
            codeBlock: { label: '代码块', icon: '' },
            table: { label: '表格', icon: '' },
            math: null,
          },
        },
      },
    })
    crepe.editor.config((ctx) => {
      ctx.update(editorViewOptionsCtx, (prev) => ({
        ...prev,
        handlePaste: (view: EditorView, event: ClipboardEvent) => {
          const clipboard = event.clipboardData
          if (!clipboard) return false
          const text = clipboard.getData('text/plain')
          // 只要纯文本本身是 Markdown 源码就解析，忽略是否附带 html
          // （富文本来源的 text/plain 通常是去格式纯文本，不会匹配 Markdown 特征）
          if (!text || !MARKDOWN_PATTERN.test(text)) return false
          const parser = ctx.get(parserCtx)
          const doc = parser(text)
          if (!doc) return false
          const slice = new Slice(doc.content, 0, 0)
          view.dispatch(view.state.tr.replaceSelection(slice).scrollIntoView())
          return true
        },
      }))
    })
    crepe.on((api) => {
      api.markdownUpdated((_, markdown) => {
        if (!initializedRef.current) {
          initializedRef.current = true
          if (markdown === safeValue) return
        }
        onChangeRef.current(markdown)
      })
    })
    if (readOnly) {
      crepe.setReadonly(true)
    }
    crepeRef.current = crepe
    return crepe
  })

  useImperativeHandle(ref, () => ({
    getMarkdown: () => crepeRef.current?.getMarkdown() ?? safeValue,
  }), [safeValue])

  useEffect(() => {
    if (!loading && get()) {
      onReady?.()
    }
  }, [loading, get, onReady])

  return (
    <div className={`milkdown-editor-wrapper ${readOnly ? 'read-only' : ''}`}>
      <Milkdown />
    </div>
  )
})

export const MilkdownEditor = forwardRef<MilkdownEditorHandle, MilkdownEditorProps>(function MilkdownEditor(props, ref) {
  return (
    <MilkdownEditorBoundary value={typeof props.value === 'string' ? props.value : ''} onError={props.onError}>
      <MilkdownProvider>
        <MilkdownEditorInner {...props} ref={ref} />
      </MilkdownProvider>
    </MilkdownEditorBoundary>
  )
})
