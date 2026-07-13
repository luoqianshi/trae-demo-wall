import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from '@tanstack/react-router'
import { ArrowLeft, Check, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { documentApi, type DocumentItem } from './document-api'
import { MilkdownEditor } from './editor/milkdown-editor'

export function DocumentEditPage() {
  const { docId } = useParams({ strict: false }) as { docId: string }
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [lastSaved, setLastSaved] = useState<string>('')
  const [editorReady, setEditorReady] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const loadDocument = useCallback(async () => {
    if (!docId) return
    setLoading(true)
    try {
      const doc = await documentApi.get(docId)
      setTitle(doc.title)
      setContent(doc.content ?? '')
    } catch {
      toast.error('文档加载失败')
    } finally {
      setLoading(false)
    }
  }, [docId])

  useEffect(() => {
    void loadDocument()
  }, [loadDocument])

  const saveDocument = useCallback(async (newTitle: string, newContent: string) => {
    if (!docId) return
    setSaving(true)
    try {
      await documentApi.update({ id: docId, title: newTitle, content: newContent })
      setLastSaved(new Date().toLocaleTimeString())
    } catch {
      toast.error('保存失败')
    } finally {
      setSaving(false)
    }
  }, [docId])

  const handleContentChange = useCallback((newContent: string) => {
    setContent(newContent)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveDocument(title, newContent)
    }, 1000)
  }, [title, saveDocument])

  const handleTitleChange = useCallback((newTitle: string) => {
    setTitle(newTitle)
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => {
      void saveDocument(newTitle, content)
    }, 1000)
  }, [content, saveDocument])

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="flex h-full flex-col">
      {/* 顶部工具栏 */}
      <div className="flex shrink-0 items-center gap-3 border-b px-4 py-2">
        <Button variant="ghost" size="icon" className="size-7" onClick={() => navigate({ to: '/documents' })}>
          <ArrowLeft className="size-4" />
        </Button>
        <Input
          value={title}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="h-7 max-w-xs border-0 bg-transparent px-1 text-sm font-medium shadow-none focus-visible:ring-1"
        />
        <div className="ms-auto flex items-center gap-2 text-[11px] text-muted-foreground">
          {saving && <Loader2 className="size-3 animate-spin" />}
          {lastSaved && !saving && (
            <>
              <Check className="size-3 text-emerald-500" />
              已保存 {lastSaved}
            </>
          )}
        </div>
      </div>

      {/* Milkdown 编辑区 */}
      <div className="min-h-0 flex-1 overflow-auto px-8 py-6">
        {!editorReady && (
          <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">
            <Loader2 className="mr-2 size-4 animate-spin" />
            编辑器加载中...
          </div>
        )}
        <div className={editorReady ? '' : 'invisible'}>
          <MilkdownEditor
            value={content}
            onChange={handleContentChange}
            onReady={() => setEditorReady(true)}
          />
        </div>
      </div>
    </div>
  )
}
