import { useState, type ReactNode } from 'react'
import { Eye, FileText, Loader2, Save } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { documentApi, type Document } from '../api/knowledge-api'

interface DocumentMarkdownEditorDialogProps {
  open: boolean
  document: Document
  onClose: () => void
  onSaved?: (document: Document) => void
}

function renderInlineMarkdown(text: string): ReactNode[] {
  const nodes: ReactNode[] = []
  const parts = text.split(/(`[^`]+`|\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g)
  parts.forEach((part, index) => {
    if (!part) return
    if (part.startsWith('`') && part.endsWith('`')) {
      nodes.push(<code key={index} className='rounded bg-muted px-1 py-0.5 font-mono text-[0.9em]'>{part.slice(1, -1)}</code>)
      return
    }
    if (part.startsWith('**') && part.endsWith('**')) {
      nodes.push(<strong key={index}>{part.slice(2, -2)}</strong>)
      return
    }
    const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
    if (linkMatch) {
      nodes.push(<a key={index} href={linkMatch[2]} target='_blank' rel='noreferrer' className='text-primary underline underline-offset-2'>{linkMatch[1]}</a>)
      return
    }
    nodes.push(part)
  })
  return nodes
}

export function MarkdownPreview({ content }: { content: string }) {
  const lines = content.split('\n')
  const elements: ReactNode[] = []
  let listItems: string[] = []
  let codeLines: string[] = []
  let inCodeBlock = false

  const flushList = () => {
    if (listItems.length > 0) {
      const items = listItems
      elements.push(
        <ul key={`ul-${elements.length}`} className='my-3 list-disc space-y-1 pl-6'>
          {items.map((item, index) => <li key={index}>{renderInlineMarkdown(item)}</li>)}
        </ul>
      )
      listItems = []
    }
  }

  const flushCode = () => {
    if (codeLines.length > 0) {
      elements.push(
        <pre key={`code-${elements.length}`} className='my-4 overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-zinc-50'>
          <code>{codeLines.join('\n')}</code>
        </pre>
      )
      codeLines = []
    }
  }

  lines.forEach((line, index) => {
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        flushCode()
        inCodeBlock = false
      } else {
        flushList()
        inCodeBlock = true
      }
      return
    }

    if (inCodeBlock) {
      codeLines.push(line)
      return
    }

    const trimmed = line.trim()
    if (!trimmed) {
      flushList()
      elements.push(<div key={`space-${index}`} className='h-3' />)
      return
    }

    const listMatch = trimmed.match(/^[-*+]\s+(.+)$/)
    if (listMatch) {
      listItems.push(listMatch[1])
      return
    }

    flushList()

    if (trimmed.startsWith('### ')) {
      elements.push(<h3 key={index} className='mb-2 mt-5 text-lg font-semibold'>{renderInlineMarkdown(trimmed.slice(4))}</h3>)
      return
    }
    if (trimmed.startsWith('## ')) {
      elements.push(<h2 key={index} className='mb-3 mt-6 border-b pb-2 text-xl font-semibold'>{renderInlineMarkdown(trimmed.slice(3))}</h2>)
      return
    }
    if (trimmed.startsWith('# ')) {
      elements.push(<h1 key={index} className='mb-4 mt-2 text-2xl font-bold tracking-tight'>{renderInlineMarkdown(trimmed.slice(2))}</h1>)
      return
    }
    if (trimmed.startsWith('> ')) {
      elements.push(<blockquote key={index} className='my-3 border-l-4 border-primary/40 pl-4 text-muted-foreground'>{renderInlineMarkdown(trimmed.slice(2))}</blockquote>)
      return
    }
    if (/^---+$/.test(trimmed)) {
      elements.push(<hr key={index} className='my-5' />)
      return
    }

    elements.push(<p key={index} className='my-2 leading-7'>{renderInlineMarkdown(line)}</p>)
  })

  flushList()
  flushCode()

  return <div className='max-w-none text-sm'>{elements}</div>
}

export function DocumentMarkdownEditorDialog({
  open,
  document,
  onClose,
  onSaved,
}: DocumentMarkdownEditorDialogProps) {
  const [title, setTitle] = useState(document.title || '')
  const [content, setContent] = useState(document.rawText || '')
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    if (!title.trim()) {
      toast.error('请输入文档标题')
      return
    }
    setSaving(true)
    try {
      if (title.trim() !== document.title) {
        await documentApi.update({ id: document.id, title: title.trim() })
      }
      await documentApi.updateContent({ id: document.id, rawText: content })
      const latestDocument = await documentApi.get(document.id)
      toast.success('文档已保存')
      onSaved?.(latestDocument)
      onClose()
    } catch (error) {
      toast.error(`保存失败：${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => { if (!nextOpen) onClose() }}>
      <DialogContent className='flex h-[90vh] max-h-[90vh] max-w-[92vw] flex-col overflow-hidden sm:max-w-6xl'>
        <DialogHeader className='shrink-0'>
          <DialogTitle className='flex items-center gap-2'>
            <FileText className='h-5 w-5 text-primary' />
            Markdown 预览与编辑
          </DialogTitle>
        </DialogHeader>

        <div className='grid shrink-0 gap-2'>
          <Label htmlFor='document-title'>文档标题</Label>
          <Input
            id='document-title'
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder='请输入文档标题'
          />
        </div>

        <Tabs defaultValue='edit' className='flex min-h-0 flex-1 flex-col overflow-hidden'>
          <TabsList className='shrink-0 self-start'>
            <TabsTrigger value='edit'>编辑 Markdown</TabsTrigger>
            <TabsTrigger value='preview'>预览</TabsTrigger>
          </TabsList>
          <TabsContent value='edit' className='mt-3 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden'>
            <Textarea
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder='请输入 Markdown 内容'
              className='h-full min-h-0 resize-none overflow-y-auto font-mono text-sm leading-relaxed'
            />
          </TabsContent>
          <TabsContent value='preview' className='mt-3 min-h-0 flex-1 overflow-hidden data-[state=inactive]:hidden'>
            <div className='h-full min-h-0 overflow-y-auto rounded-lg border bg-muted/20 p-5'>
              {content.trim() ? (
                <MarkdownPreview content={content} />
              ) : (
                <div className='flex h-full min-h-[320px] items-center justify-center text-sm text-muted-foreground'>
                  暂无可预览内容
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        <div className='flex shrink-0 items-center justify-between border-t pt-3'>
          <div className='flex items-center gap-2 text-xs text-muted-foreground'>
            <Eye className='h-4 w-4' />
            保存后将作为后续认知级入库的 Markdown 源内容
          </div>
          <div className='flex items-center gap-2'>
            <Button variant='outline' onClick={onClose} disabled={saving}>
              取消
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              {saving ? (
                <Loader2 className='mr-1 h-4 w-4 animate-spin' />
              ) : (
                <Save className='mr-1 h-4 w-4' />
              )}
              保存
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default DocumentMarkdownEditorDialog
