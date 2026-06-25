import { useState, useEffect, useRef } from 'react'
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Upload,
  Save,
  X,
  Database,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import {
  fetchKnowledgeList,
  addKnowledge,
  updateKnowledge,
  deleteKnowledge,
  searchKnowledge,
  importKnowledgeFile,
} from '../lib/api'
import type { KnowledgeEntry } from '../types/api'

export function Knowledge() {
  const [entries, setEntries] = useState<KnowledgeEntry[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchMode, setSearchMode] = useState<'keyword' | 'semantic'>('keyword')
  const [offset, setOffset] = useState(0)
  const limit = 50

  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [editingEntry, setEditingEntry] = useState<KnowledgeEntry | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editTags, setEditTags] = useState('')
  const [saving, setSaving] = useState(false)

  const [importing, setImporting] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadEntries() }, [offset])

  async function loadEntries() {
    try {
      setLoading(true)
      const data = await fetchKnowledgeList(offset, limit)
      setEntries(data.entries || [])
      setTotal(data.total || 0)
    } catch (err) {
      setMessage('加载知识库失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch() {
    if (!searchQuery.trim()) {
      loadEntries()
      return
    }
    try {
      setLoading(true)
      const data = await searchKnowledge(searchQuery, searchMode)
      setEntries(data.results || [])
      setTotal(data.count || 0)
    } catch (err) {
      setMessage('搜索失败')
    } finally {
      setLoading(false)
    }
  }

  function openAddDialog() {
    setEditingEntry(null)
    setEditContent('')
    setEditTags('')
    setEditDialogOpen(true)
  }

  function openEditDialog(entry: KnowledgeEntry) {
    setEditingEntry(entry)
    setEditContent(entry.content)
    setEditTags((entry.tags || []).join(', '))
    setEditDialogOpen(true)
  }

  async function handleSave() {
    if (!editContent.trim()) {
      setMessage('内容不能为空')
      return
    }
    try {
      setSaving(true)
      const tags = editTags.split(',').map(t => t.trim()).filter(Boolean)
      if (editingEntry) {
        await updateKnowledge(editingEntry.id, editContent, tags)
        setMessage('知识条目已更新')
      } else {
        await addKnowledge(editContent, tags)
        setMessage('知识条目已添加')
      }
      setEditDialogOpen(false)
      await loadEntries()
    } catch (err) {
      setMessage('保存失败')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('确认删除这条知识条目？')) return
    try {
      await deleteKnowledge(id)
      setMessage('知识条目已删除')
      await loadEntries()
    } catch (err) {
      setMessage('删除失败')
    }
  }

  async function handleFileImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setImporting(true)
      const result = await importKnowledgeFile(file)
      setMessage(result.message)
      await loadEntries()
    } catch (err) {
      setMessage('文件导入失败')
    } finally {
      setImporting(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const totalPages = Math.ceil(total / limit)

  return (
    <div className="aurora-bg min-h-screen space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">知识库管理</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            管理 YaraFlow 的知识条目，支持手动添加、文件导入、搜索和编辑
          </p>
        </div>
        <button
          onClick={loadEntries}
          className="btn btn-outline"
          aria-label="刷新知识库列表"
        >
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          刷新
        </button>
      </div>

      {message && (
        <div className="card card-glow-blue border-green-500/20 bg-green-500/8 p-4 text-sm text-green-700 flex items-center justify-between" role="alert">
          <span className="font-medium">{message}</span>
          <button onClick={() => setMessage('')} aria-label="关闭提示" className="p-1 rounded-lg hover:bg-green-500/10 transition-colors">
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      <div className="card card-hover rounded-xl border border-border bg-muted p-5 shadow-sm">
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} aria-hidden="true" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="搜索知识条目..."
              aria-label="搜索知识条目"
              className="input w-full pl-10 pr-3"
            />
          </div>
          <select
            value={searchMode}
            onChange={(e) => setSearchMode(e.target.value as 'keyword' | 'semantic')}
            aria-label="搜索模式"
            className="input"
          >
            <option value="keyword">关键词搜索</option>
            <option value="semantic">语义搜索</option>
          </select>
          <button
            onClick={handleSearch}
            className="btn btn-primary"
          >
            搜索
          </button>

          <div className="ml-auto flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.md,.csv,.json"
              onChange={handleFileImport}
              className="hidden"
              aria-label="选择导入文件"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={importing}
              aria-label="导入文件"
              className="btn btn-outline"
            >
              <Upload className="h-4 w-4" aria-hidden="true" />
              {importing ? '导入中…' : '导入文件'}
            </button>
            <button
              onClick={openAddDialog}
              aria-label="添加知识条目"
              className="btn btn-accent"
            >
              <Plus className="h-4 w-4" aria-hidden="true" />
              添加知识
            </button>
          </div>
        </div>
      </div>

      <div className="card card-hover rounded-xl border-blue-500/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-blue-500/10 px-5 py-3.5">
          <span className="text-sm font-bold text-blue-500">共 {total} 条知识</span>
          {totalPages > 1 && (
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setOffset(Math.max(0, offset - limit))}
                disabled={offset === 0}
                aria-label="上一页"
                className="btn btn-outline px-4 py-1.5 text-xs"
              >
                上一页
              </button>
              <span className="text-muted-foreground tabular-nums font-medium">
                {Math.floor(offset / limit) + 1} / {totalPages}
              </span>
              <button
                onClick={() => setOffset(offset + limit)}
                disabled={(offset + limit) >= total}
                aria-label="下一页"
                className="btn btn-outline px-4 py-1.5 text-xs"
              >
                下一页
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" aria-hidden="true" />
            <span className="ml-3 text-blue-500 font-medium">正在加载...</span>
          </div>
        ) : entries.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="h-24 w-24 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <Database size={44} style={{ color: 'hsl(var(--primary) / 0.8)' }} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground mb-1">暂无知识条目</p>
              <p className="text-sm text-muted-foreground">点击「添加知识」或「导入文件」开始</p>
            </div>
          </div>
        ) : (
          <div className="divide-y stagger" style={{ borderColor: 'hsl(var(--border) / 0.5)' }}>
            {entries.map((entry) => (
              <div key={entry.id} className="flex items-start gap-4 px-5 py-4 hover:bg-surface transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm leading-relaxed whitespace-pre-wrap break-words text-foreground">
                    {entry.content}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {entry.tags && entry.tags.length > 0 && entry.tags.map((tag, i) => (
                      <span key={i} className="badge badge-pink">
                        {tag}
                      </span>
                    ))}
                    <span className="badge badge-blue">
                      {entry.source}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      #{entry.id}
                    </span>
                    <span className="text-xs text-muted-foreground font-medium">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <button
                    onClick={() => openEditDialog(entry)}
                    className="rounded-xl border border-border p-2 hover:bg-muted transition-all"
                    aria-label="编辑条目"
                  >
                    <Edit3 className="h-4 w-4" style={{ color: 'hsl(var(--primary))' }} aria-hidden="true" />
                  </button>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="rounded-xl border border-border p-2 hover:bg-muted transition-all"
                    aria-label="删除条目"
                  >
                    <Trash2 className="h-4 w-4" style={{ color: 'hsl(var(--accent))' }} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {editDialogOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center" 
          style={{ backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
          onClick={() => setEditDialogOpen(false)}
        >
          <div 
            className="relative w-full max-w-lg rounded-xl p-6 max-h-[90vh] overflow-y-auto"
            style={{ 
              background: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <div 
                  className="h-10 w-10 rounded-lg flex items-center justify-center"
                  style={{ background: 'hsl(var(--primary) / 0.1)' }}
                >
                  {editingEntry ? (
                    <Edit3 className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  ) : (
                    <Plus className="h-5 w-5" style={{ color: 'hsl(var(--primary))' }} />
                  )}
                </div>
                <h2 className="text-lg font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
                  {editingEntry ? '编辑知识条目' : '添加知识条目'}
                </h2>
              </div>
              <button 
                onClick={() => setEditDialogOpen(false)} 
                aria-label="关闭对话框" 
                className="p-2 rounded-lg"
                style={{ color: 'hsl(var(--text-muted))' }}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label htmlFor="knowledge-content" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
                  知识内容 <span style={{ color: 'hsl(var(--accent))' }}>*</span>
                </label>
                <textarea
                  id="knowledge-content"
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  placeholder="输入知识内容，一句话或一小段都可以..."
                  className="input w-full min-h-[140px] resize-y"
                />
              </div>
              <div>
                <label htmlFor="knowledge-tags" className="mb-2 block text-sm font-bold" style={{ color: 'hsl(var(--text-primary))' }}>
                  标签
                </label>
                <input
                  id="knowledge-tags"
                  value={editTags}
                  onChange={(e) => setEditTags(e.target.value)}
                  placeholder="例如：喜好、食物、重要"
                  className="input w-full"
                />
              </div>
            </div>

            <div className="mt-7 flex justify-end gap-3">
              <button
                onClick={() => setEditDialogOpen(false)}
                className="btn btn-outline"
              >
                取消
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="btn btn-primary"
              >
                <Save className="h-4 w-4" aria-hidden="true" />
                {saving ? '保存中…' : '保存'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
