import { useEffect, useMemo, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Braces, FileText } from 'lucide-react'
import { extractMustacheVariables } from '../../utils/mustache'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

// 稳定的空对象引用，避免默认值每次渲染创建新对象导致 useEffect 无限触发
const EMPTY_VARIABLE_VALUES: Record<string, string> = {}

interface PromptModalProps {
  open: boolean
  setOpen: (open: boolean) => void
  value: string
  onChange: (value: string) => void
  title?: string
  description?: string
  variableValues?: Record<string, string>
  onVariableChange?: (variables: Record<string, string>) => void
}

/**
 * 高亮 HTML 生成：把 {{变量名}} 渲染为带样式的 span，其余保持原样转义。
 */
const renderHighlightedContent = (text: string) => {
  if (!text) return ''
  // 按 {{变量}} 切分字符串，保留分隔符
  const regex = /\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g
  const parts: Array<{ type: 'text' | 'variable'; content: string; variableName?: string }> = []
  let lastIndex = 0
  let match: RegExpExecArray | null
  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: 'text', content: text.slice(lastIndex, match.index) })
    }
    parts.push({ type: 'variable', content: match[0], variableName: match[1] })
    lastIndex = regex.lastIndex
  }
  if (lastIndex < text.length) {
    parts.push({ type: 'text', content: text.slice(lastIndex) })
  }
  // 生成 HTML
  let html = ''
  for (const part of parts) {
    if (part.type === 'text') {
      html += part.content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/\n/g, '<br />')
    } else {
      html += `<span class="inline-block rounded-md bg-primary/15 px-1.5 py-0.5 text-[13px] font-medium text-primary ring-1 ring-primary/30 mx-0.5">${part.variableName}</span>`
    }
  }
  return html
}

export function PromptModal({
  open,
  setOpen,
  value,
  onChange,
  title = '编辑提示词',
  description = '使用双花括号定义变量，例如 {{topic}} {{question}}。',
  variableValues = EMPTY_VARIABLE_VALUES,
  onVariableChange,
}: PromptModalProps) {
  const [inputValue, setInputValue] = useState(value)
  const [isEdit, setIsEdit] = useState(true)
  const [localVariableValues, setLocalVariableValues] = useState<Record<string, string>>(variableValues)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const scrollPositionRef = useRef(0)
  const prevOpenRef = useRef(open)

  // 仅在对话框从关闭→打开时同步 value，避免编辑过程中被父组件覆盖
  useEffect(() => {
    if (!prevOpenRef.current && open) {
      setInputValue(value)
      setLocalVariableValues(variableValues)
    }
    prevOpenRef.current = open
  }, [open, value, variableValues])

  const variables = useMemo(() => extractMustacheVariables(inputValue), [inputValue])

  // 编辑模式下自动聚焦
  useEffect(() => {
    if (isEdit && open && textareaRef.current) {
      textareaRef.current.focus()
      textareaRef.current.scrollTop = scrollPositionRef.current
    }
  }, [isEdit, open])

  // 处理本地变量输入（用于预览模式）
  const handleVariableInputChange = (name: string, val: string) => {
    const next = { ...localVariableValues, [name]: val }
    setLocalVariableValues(next)
    onVariableChange?.(next)
  }

  // 预览时的替换
  const previewReplaced = useMemo(() => {
    if (!inputValue) return ''
    return inputValue.replace(/\{\{([a-zA-Z_][a-zA-Z0-9_]*)\}\}/g, (_match, name) => {
      const val = localVariableValues[name]
      return val !== undefined && val !== '' ? String(val) : `{${name}}`
    })
  }, [inputValue, localVariableValues])

  const handleSave = () => {
    onChange(inputValue)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="flex max-h-[90vh] h-[800px] w-[90vw] max-w-[2700px] !max-w-none flex-col">
        <DialogHeader>
          <div className="flex items-start gap-2">
            <Braces className="mt-1 size-5 text-primary" />
            <div className="flex flex-col">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="flex min-h-0 flex-1 flex-col gap-4">
          {/* 编辑 / 预览 切换 */}
          <div className="flex shrink-0 items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <FileText className="size-3.5" />
              <span>
                已检测到 <span className="font-semibold text-foreground">{variables.length}</span> 个变量
              </span>
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant={isEdit ? 'default' : 'outline'}
                size="sm"
                onClick={() => setIsEdit(true)}
              >
                编辑
              </Button>
              <Button
                type="button"
                variant={!isEdit ? 'default' : 'outline'}
                size="sm"
                onClick={() => {
                  scrollPositionRef.current = textareaRef.current?.scrollTop || 0
                  setIsEdit(false)
                }}
              >
                预览
              </Button>
            </div>
          </div>

          {/* 内容区：左文本 / 右变量输入 */}
          <div className="flex min-h-0 flex-1 gap-4 overflow-hidden">
            {/* 左边：文本编辑或预览 */}
            <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-lg border bg-background">
              {isEdit ? (
                <Textarea
                  ref={textareaRef}
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  className="min-h-full flex-1 resize-none border-0 bg-transparent text-[14px] leading-relaxed focus-visible:ring-0 p-4"
                  placeholder="在此输入提示词模板...&#10;&#10;示例：&#10;你是一名 {{\u4e13\u4e1a}} 顾问，用户提问：{{question}}&#10;请回答："
                  style={{ minHeight: '400px' }}
                />
              ) : (
                <div
                  className="min-h-full flex-1 overflow-auto p-4 text-[14px] leading-relaxed bg-muted/30"
                  dangerouslySetInnerHTML={{ __html: renderHighlightedContent(inputValue) }}
                />
              )}
            </div>

            {/* 右边：变量面板 */}
            <div className="flex w-72 shrink-0 flex-col gap-3 overflow-hidden rounded-lg border bg-card p-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-foreground">
                <Badge variant="outline" className="text-xs">
                  变量
                </Badge>
                <span className="text-muted-foreground">
                  {variables.length > 0 ? `共 ${variables.length} 个` : '暂无'}
                </span>
              </div>

              {/* 变量列表 - 编辑模式显示变量名 + 变量值输入（用于预览） */}
              <div className="flex-1 space-y-3 overflow-auto pr-1">
                {variables.length === 0 ? (
                  <div className="flex h-32 items-center justify-center text-xs text-muted-foreground">
                    在模板中使用 {'{{变量名}}'} 定义变量
                  </div>
                ) : (
                  variables.map((variable) => (
                    <div key={variable} className="flex flex-col gap-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 text-xs font-medium">
                          <span className="rounded bg-primary/15 px-1.5 py-0.5 text-primary">
                            {variable}
                          </span>
                        </span>
                      </div>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <input
                            type="text"
                            value={localVariableValues[variable] ?? ''}
                            onChange={(e) => handleVariableInputChange(variable, e.target.value)}
                            placeholder={isEdit ? '预览时的变量值' : '点击编辑模式提供变量值'}
                            className="h-8 w-full rounded-md border bg-background px-2 text-xs outline-none focus-visible:ring-1 focus-visible:ring-primary"
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <span className="text-xs">在预览和运行时使用此值替换 {'{{' + variable + '}}'}</span>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  ))
                )}
              </div>

              {/* 预览区 - 替换后预览 */}
              {variables.length > 0 && (
                <div className="shrink-0 rounded-md border bg-muted/30 p-2">
                  <div className="mb-1.5 flex items-center gap-1.5 text-[11px] font-medium text-muted-foreground">
                    <span className="size-1.5 rounded-full bg-green-500" />
                    预览替换后
                  </div>
                  <div className="max-h-40 overflow-auto text-[12px] leading-relaxed text-foreground whitespace-pre-wrap">
                    {previewReplaced}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 底部变量展示 */}
          {variables.length > 0 && (
            <div className="shrink-0 flex flex-wrap items-center gap-1.5 rounded-md border bg-muted/30 p-2">
              <span className="text-[11px] font-medium text-muted-foreground">变量：</span>
              {variables.map((variable, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {variable}
                </Badge>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            取消
          </Button>
          <Button onClick={handleSave}>
            保存
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
