'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
  Bot,
  X,
  Sparkles,
  Loader2,
  Check,
  RotateCcw,
  Wand2,
  FileText,
  BookOpen,
  Scissors,
  Expand,
  SpellCheck,
  ListOrdered,
  ChevronLeft,
  Copy,
  CheckCheck,
  AlertTriangle,
} from 'lucide-react'
import { callAI } from '../../../../lib/editor-api'
import {
  aiPromptTemplates,
  getPromptTemplate,
  renderPromptTemplate,
  type AIPromptTemplate,
} from '../../../../lib/ai-prompts'
import type { Editor as TiptapEditor } from '@tiptap/react'

/* ============================================================
   类型定义
   ============================================================ */

interface AIPromptPanelProps {
  /** 面板是否打开 */
  isOpen: boolean
  /** 关闭面板回调 */
  onClose: () => void
  /** 编辑器实例，用于获取选中文本 */
  editor?: TiptapEditor | null
  /** 将结果插入编辑器 */
  onInsertResult?: (text: string) => void
  /** 外部传入的选中文本（优先级高于 editor 获取） */
  selectedText?: string
}

type PanelView = 'template-list' | 'result'

interface AIResult {
  content: string
  templateId: string
  originalText: string
}

/* ============================================================
   图标映射
   ============================================================ */

const templateIcons: Record<string, React.ElementType> = {
  academic_polish: Wand2,
  generate_abstract: FileText,
  continue_writing: BookOpen,
  make_shorter: Scissors,
  make_longer: Expand,
  fix_grammar: SpellCheck,
  format_references: ListOrdered,
}

/* ============================================================
   主组件
   ============================================================ */

export default function AIPromptPanel({
  isOpen,
  onClose,
  editor,
  onInsertResult,
  selectedText: externalSelectedText,
}: AIPromptPanelProps) {
  /* ---- 状态 ---- */
  const [view, setView] = useState<PanelView>('template-list')
  const [activeTemplate, setActiveTemplate] = useState<AIPromptTemplate | null>(null)
  const [inputText, setInputText] = useState('')
  const [result, setResult] = useState<AIResult | null>(null)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const panelRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  /* ---- 获取当前选中文本 ---- */
  const getSelectedText = useCallback((): string => {
    if (externalSelectedText !== undefined) return externalSelectedText
    if (!editor) return ''
    const { from, to } = editor.state.selection
    if (from === to) return ''
    return editor.state.doc.textBetween(from, to, ' ')
  }, [editor, externalSelectedText])

  /* ---- 面板打开时自动填入选中文本 ---- */
  useEffect(() => {
    if (isOpen) {
      const text = getSelectedText()
      setInputText(text)
      setView('template-list')
      setResult(null)
      setError(null)
    }
  }, [isOpen, getSelectedText])

  /* ---- 聚焦输入框 ---- */
  useEffect(() => {
    if (isOpen && view === 'template-list') {
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [isOpen, view])

  /* ---- Esc 关闭面板 ---- */
  useEffect(() => {
    if (!isOpen) return
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen, onClose])

  /* ---- 调用 AI ---- */
  const handleRunTemplate = async (template: AIPromptTemplate) => {
    const text = inputText.trim() || getSelectedText()
    if (!text.trim()) {
      setError('请先输入或选中文本内容')
      return
    }

    setActiveTemplate(template)
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const userPrompt = renderPromptTemplate(template, text)
      const response = await callAI(userPrompt, {
        systemPrompt: template.systemPrompt,
        temperature: template.temperature ?? 0.7,
        maxTokens: template.maxTokens ?? 2048,
      })

      setResult({
        content: response,
        templateId: template.id,
        originalText: text,
      })
      setView('result')
    } catch (err: any) {
      setError(err?.message || '智囊调用失败，请检查智囊配置')
    } finally {
      setLoading(false)
    }
  }

  /* ---- 重试 ---- */
  const handleRetry = () => {
    if (activeTemplate) {
      handleRunTemplate(activeTemplate)
    }
  }

  /* ---- 接受结果（插入编辑器） ---- */
  const handleAccept = () => {
    if (!result) return
    onInsertResult?.(result.content)
    onClose()
  }

  /* ---- 拒绝结果 ---- */
  const handleReject = () => {
    setView('template-list')
    setResult(null)
  }

  /* ---- 复制结果 ---- */
  const handleCopy = async () => {
    if (!result) return
    try {
      await navigator.clipboard.writeText(result.content)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // 静默失败
    }
  }

  /* ---- 返回模板列表 ---- */
  const handleBack = () => {
    setView('template-list')
    setResult(null)
    setError(null)
  }

  if (!isOpen) return null

  return (
    <div
      ref={panelRef}
      className="fixed right-0 top-0 h-full w-[400px] bg-paper border-l border-border shadow-xl z-50 flex flex-col animate-slide-in-right"
      role="complementary"
      aria-label="文式模板面板"
    >
      {/* ==================== Header ==================== */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
        <div className="flex items-center gap-2.5">
          {view === 'result' ? (
            <button
              onClick={handleBack}
              className="p-1.5 rounded-lg text-ink-muted hover:bg-paper-dark hover:text-ink transition-all"
              aria-label="返回模板列表"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          ) : (
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-ochre to-cinnabar flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
          )}
          <div>
            <h2 className="text-sm font-semibold text-ink">
              {view === 'result' && activeTemplate ? activeTemplate.name : '智囊助手'}
            </h2>
            <p className="text-[11px] text-ink-muted">
              {view === 'result' ? '智囊生成结果' : '选择模板处理文本'}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-lg text-ink-muted hover:bg-paper-dark hover:text-ink transition-all"
          aria-label="关闭面板"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ==================== 内容区域 ==================== */}
      <div className="flex-1 overflow-y-auto">
        {/* ---- 模板列表视图 ---- */}
        {view === 'template-list' && (
          <div className="p-4 space-y-4">
            {/* 输入区域 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-secondary">输入文本</label>
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="在此输入或粘贴需要处理的文本，也可在编辑器中选中文本后打开此面板..."
                rows={4}
                className="w-full px-3 py-2.5 text-sm bg-paper border border-border rounded-xl text-ink placeholder:text-ink-light focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre/20 transition-all resize-none"
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-ink-light">
                  {inputText.length > 0 ? `${inputText.length} 字` : '未输入文本'}
                </span>
                {getSelectedText() && (
                  <span className="text-[10px] text-ochre bg-ochre-bg px-2 py-0.5 rounded-full">
                    已选中 {getSelectedText().length} 字
                  </span>
                )}
              </div>
            </div>

            {/* 错误提示 */}
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-100 text-xs text-red-600">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* 模板列表 */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-ink-secondary">选择模板</label>
              <div className="grid grid-cols-1 gap-2">
                {aiPromptTemplates.map((template) => {
                  const Icon = templateIcons[template.id] || Sparkles
                  return (
                    <button
                      key={template.id}
                      onClick={() => handleRunTemplate(template)}
                      disabled={loading}
                      className="flex items-start gap-3 p-3 rounded-xl border border-border bg-paper hover:bg-paper-dark hover:border-ink-light transition-all duration-150 text-left group disabled:opacity-50"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5"
                        style={{ backgroundColor: `${template.color}15`, color: template.color }}
                      >
                        <Icon className="w-4.5 h-4.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-ink">{template.name}</span>
                          {loading && activeTemplate?.id === template.id && (
                            <Loader2 className="w-3 h-3 animate-spin text-ochre" />
                          )}
                        </div>
                        <p className="text-xs text-ink-muted mt-0.5 leading-relaxed">
                          {template.description}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* ---- 结果视图 ---- */}
        {view === 'result' && result && activeTemplate && (
          <div className="p-4 space-y-4">
            {/* 原始文本 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-ink-secondary">原始文本</label>
                <span className="text-[10px] text-ink-light">{result.originalText.length} 字</span>
              </div>
              <div className="p-3 rounded-xl bg-paper border border-border text-xs text-ink-secondary leading-relaxed max-h-[120px] overflow-y-auto">
                {result.originalText}
              </div>
            </div>

            {/* 智囊生成结果 */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-ink-secondary">智囊生成结果</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={handleCopy}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] text-ink-muted hover:text-ochre hover:bg-paper-dark transition-all"
                  >
                    {copied ? <CheckCheck className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                    {copied ? '已复制' : '复制'}
                  </button>
                </div>
              </div>
              <div className="p-3 rounded-xl bg-paper-dark border border-border text-sm text-ink leading-relaxed max-h-[300px] overflow-y-auto whitespace-pre-wrap">
                {result.content}
              </div>
            </div>

            {/* 操作按钮 */}
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleAccept}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-ochre text-white text-sm font-medium rounded-xl hover:bg-ink transition-all active:scale-[0.97]"
              >
                <Check className="w-4 h-4" />
                接受并插入
              </button>
              <button
                onClick={handleRetry}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-ink-secondary text-sm font-medium rounded-xl hover:bg-paper-dark hover:border-ink-light transition-all active:scale-[0.97]"
              >
                <RotateCcw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={handleReject}
                className="flex items-center justify-center gap-2 px-4 py-2.5 border border-border text-cinnabar text-sm font-medium rounded-xl hover:bg-red-50 hover:border-red-200 transition-all active:scale-[0.97]"
              >
                <X className="w-4 h-4" />
                拒绝
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ==================== Footer ==================== */}
      <div className="px-4 py-3 border-t border-border bg-paper shrink-0">
        <p className="text-[10px] text-ink-light text-center">
          智囊生成的内容仅供参考，请核实重要信息
        </p>
      </div>
    </div>
  )
}
