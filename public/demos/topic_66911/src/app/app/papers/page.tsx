'use client'

import { useEffect, useState, useCallback } from 'react'
import { Modal } from '../../../components/ui/Modal'
import { Button } from '../../../components/ui/Button'
import {
  getPapers,
  createPaper,
  updatePaper,
  deletePaper,
  type Paper,
} from '../../../lib/api'
import {
  BookOpen,
  Plus,
  Search,
  Star,
  Trash2,
  Edit3,
  CheckCircle2,
  Circle,
  Clock,
  Globe,
  FileText,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Filter,
  X,
  Sparkles,
  Quote,
  Copy,
  Check,
  Download,
  Tag,
  Bookmark,
  Hash,
  Loader2,
} from 'lucide-react'
import { useToast } from '../../../components/ui/Toast'

// ============ Types ============

interface ArxivResult {
  id: string
  arxivId: string
  title: string
  authors: string[]
  abstract: string
  year: number | null
  published: string
  pdfUrl: string
  categories: string[]
  doi: string | null
  journalRef: string | null
}

interface SearchResult {
  id: string
  title: string
  authors: string
  abstract: string
  year: number | null
  journal?: string
  doi?: string
  url?: string
  source: 'arxiv' | 'manual'
  categories?: string[]
}

// ============ arXiv Search via server proxy ============

async function searchArxiv(query: string, maxResults = 10): Promise<SearchResult[]> {
  try {
    const res = await fetch(
      `/api/arxiv-search?q=${encodeURIComponent(query)}&max=${maxResults}&action=search`
    )
    if (!res.ok) throw new Error('Search failed')
    const data = await res.json()
    if (!data.ok || !data.results) return []
    return data.results.map((r: ArxivResult) => ({
      id: r.arxivId,
      title: r.title,
      authors: r.authors.join(', '),
      abstract: r.abstract,
      year: r.year,
      journal: r.journalRef || '',
      doi: r.doi || '',
      url: r.pdfUrl || `https://arxiv.org/abs/${r.arxivId}`,
      source: 'arxiv' as const,
      categories: r.categories,
    }))
  } catch (e) {
    console.error('arXiv search error:', e)
    return []
  }
}

// ============ DOI Lookup ============

async function lookupDOI(doi: string): Promise<Partial<Paper> | null> {
  try {
    const res = await fetch(`https://doi.org/${doi}`, {
      headers: { Accept: 'application/vnd.citationstyles.csl+json' },
    })
    if (!res.ok) throw new Error('DOI lookup failed')
    const data = await res.json()
    return {
      title: data.title || '',
      authors: Array.isArray(data.author)
        ? data.author.map((a: any) => `${a.given || ''} ${a.family || ''}`.trim()).join(', ')
        : '',
      journal: data['container-title'] || '',
      year: data.published?.['date-parts']?.[0]?.[0] || null,
      doi,
      abstract: data.abstract || '',
    }
  } catch {
    return null
  }
}

// ============ BibTeX Export ============

async function exportBibtex(papers: Paper[]) {
  try {
    const res = await fetch('/api/bibtex', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ papers }),
    })
    const data = await res.json()
    return data.ok ? data.bibtex : null
  } catch {
    return null
  }
}

// ============ Filter tabs config ============

const FILTER_TABS = [
  { key: 'all', label: '全部' },
  { key: 'conference', label: '会议' },
  { key: 'journal', label: '期刊' },
  { key: 'book', label: '书籍' },
] as const

const STATUS_TABS = [
  { key: 'all', label: '全部' },
  { key: 'unread', label: '未读' },
  { key: 'reading', label: '阅读中' },
  { key: 'read', label: '已读' },
] as const

function getCategoryColor(cat: string): string {
  if (cat.startsWith('cs.')) return 'bg-blue-100 text-blue-700'
  if (cat.startsWith('stat.')) return 'bg-green-100 text-green-700'
  if (cat.startsWith('math.')) return 'bg-purple-100 text-purple-700'
  if (cat.startsWith('physics.')) return 'bg-orange-100 text-orange-700'
  if (cat.startsWith('q-bio.')) return 'bg-red-100 text-red-700'
  if (cat.startsWith('econ.')) return 'bg-amber-100 text-amber-700'
  return 'bg-gray-100 text-gray-600'
}

// ============ Main Page Component ============

export default function PapersPage() {
  const { success, error: toastError } = useToast()
  const [papers, setPapers] = useState<Paper[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null)

  // Academic search states
  const [activeTab, setActiveTab] = useState<'my-papers' | 'search'>('my-papers')
  const [academicQuery, setAcademicQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  const [expandedAbstracts, setExpandedAbstracts] = useState<Set<string>>(new Set())
  const [doiInput, setDoiInput] = useState('')
  const [doiLoading, setDoiLoading] = useState(false)

  // Select mode (for batch BibTeX export)
  const [selectMode, setSelectMode] = useState(false)
  const [selectedPapers, setSelectedPapers] = useState<Set<string>>(new Set())
  const [bibtexCopied, setBibtexCopied] = useState(false)

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    authors: '',
    journal: '',
    year: '',
    doi: '',
    abstract: '',
    tags: '',
    readStatus: 'unread' as Paper['readStatus'],
    notes: '',
    rating: 0,
  })

  useEffect(() => {
    loadPapers()
  }, [])

  async function loadPapers() {
    try {
      const data = await getPapers()
      setPapers(data)
    } catch (error) {
      console.error('Failed to load papers:', error)
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '典籍加载未果')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setFormData({
      title: '', authors: '', journal: '', year: '', doi: '',
      abstract: '', tags: '', readStatus: 'unread', notes: '', rating: 0,
    })
    setEditingPaper(null)
  }

  function openEditModal(paper: Paper) {
    setEditingPaper(paper)
    setFormData({
      title: paper.title, authors: paper.authors, journal: paper.journal,
      year: paper.year?.toString() || '', doi: paper.doi,
      abstract: paper.abstract, tags: paper.tags,
      readStatus: paper.readStatus, notes: paper.notes || '',
      rating: paper.rating,
    })
    setShowAddModal(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = {
        ...formData,
        year: formData.year ? parseInt(formData.year) : null,
      }
      if (editingPaper) {
        await updatePaper(editingPaper.id, data)
      } else {
        await createPaper(data)
        success('典籍已收录')
      }
      setShowAddModal(false)
      resetForm()
      loadPapers()
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '保存未果')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('确定要除却此篇典籍？')) return
    try {
      await deletePaper(id)
      loadPapers()
      success('典籍已除')
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '删除未果')
    }
  }

  async function handleStatusChange(paper: Paper, status: Paper['readStatus']) {
    try {
      await updatePaper(paper.id, { readStatus: status })
      loadPapers()
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '状态更新未果')
    }
  }

  async function handleRate(paper: Paper, rating: number) {
    try {
      await updatePaper(paper.id, { rating })
      loadPapers()
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '评分未果')
    }
  }

  // Academic search handlers
  const handleAcademicSearch = useCallback(async () => {
    if (!academicQuery.trim()) return
    setSearching(true)
    setSearchResults([])
    try {
      const results = await searchArxiv(academicQuery, 20)
      setSearchResults(results)
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '典籍探求未果')
    } finally {
      setSearching(false)
    }
  }, [academicQuery])

  const handleImportResult = async (result: SearchResult) => {
    try {
      await createPaper({
        title: result.title,
        authors: result.authors,
        journal: result.journal || '',
        year: result.year,
        doi: result.doi || '',
        abstract: result.abstract,
        tags: result.source + (result.categories?.length ? ` ${result.categories.slice(0, 3).join(' ')}` : ''),
        readStatus: 'unread',
        notes: '',
        rating: 0,
      })
      success('典籍已添加到吾之典藏')
      loadPapers()
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || '收录未果')
    }
  }

  const handleDOIImport = async () => {
    if (!doiInput.trim()) return
    setDoiLoading(true)
    try {
      const data = await lookupDOI(doiInput.trim())
      if (data) {
        await createPaper({ ...data, tags: 'DOI导入', readStatus: 'unread', notes: '', rating: 0 })
        success('以 DOI 收录典籍成功')
        setDoiInput('')
        loadPapers()
      } else {
        toastError('无法解析该 DOI')
      }
    } catch (error) {
      toastError(typeof error === 'string' ? error : (error as Error)?.message || 'DOI 收录未果')
    } finally {
      setDoiLoading(false)
    }
  }

  // BibTeX export for selected papers
  const handleExportBibtex = async () => {
    const toExport = selectMode
      ? papers.filter(p => selectedPapers.has(p.id))
      : papers
    if (toExport.length === 0) {
      toastError('请先选择论文')
      return
    }
    const bibtex = await exportBibtex(toExport)
    if (bibtex) {
      await navigator.clipboard.writeText(bibtex)
      setBibtexCopied(true)
      success(`已复制 ${toExport.length} 篇文献的 BibTeX 到剪贴板`)
      setTimeout(() => setBibtexCopied(false), 2000)
    } else {
      toastError('BibTeX 生成失败')
    }
  }

  const toggleAbstract = (id: string) => {
    setExpandedAbstracts(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const togglePaperSelection = (id: string) => {
    setSelectedPapers(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  // Filtered papers
  const filteredPapers = papers.filter(p => {
    const matchFilter = filter === 'all'
      || (p.tags || '').toLowerCase().includes(filter)
    const matchStatus = statusFilter === 'all' || p.readStatus === statusFilter
    const matchSearch = !searchQuery
      || p.title.toLowerCase().includes(searchQuery.toLowerCase())
      || p.authors.toLowerCase().includes(searchQuery.toLowerCase())
      || (p.abstract || '').toLowerCase().includes(searchQuery.toLowerCase())
    return matchFilter && matchStatus && matchSearch
  })

  // Stats
  const stats = {
    total: papers.length,
    unread: papers.filter(p => p.readStatus === 'unread').length,
    reading: papers.filter(p => p.readStatus === 'reading').length,
    read: papers.filter(p => p.readStatus === 'read').length,
    starred: papers.filter(p => p.rating >= 4).length,
  }

  // ---------- RENDER ----------
  return (
    <div className="flex flex-col h-full bg-[#f8f6f3]">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 bg-white/80 backdrop-blur-sm border-b border-ochre/10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo/10 to-ochre/10 flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-indigo" />
          </div>
          <div>
            <h1 className="text-lg font-display font-bold text-ink">典籍管理</h1>
            <p className="text-xs text-ink-muted">
              共 {stats.total} 篇文献 · 未读 {stats.unread} · 已读 {stats.read}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Tab switcher */}
          <div className="flex items-center bg-ochre/5 rounded-xl p-1">
            <button
              onClick={() => setActiveTab('my-papers')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'my-papers' ? 'bg-white text-ochre shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              我的典籍
            </button>
            <button
              onClick={() => setActiveTab('search')}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                activeTab === 'search' ? 'bg-white text-ochre shadow-sm' : 'text-ink-muted hover:text-ink'
              }`}
            >
              文献检索
            </button>
          </div>

          <button
            onClick={() => { resetForm(); setShowAddModal(true) }}
            className="btn-primary px-4 py-1.5 text-xs flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            手动添加
          </button>
        </div>
      </div>

      {/* Controls bar */}
      <div className="flex items-center gap-3 px-6 py-3 bg-white/40 border-b border-border-light">
        {/* Search */}
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-ink-muted" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="搜索标题/作者..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-white border border-border rounded-lg text-ink placeholder-ink-muted focus:outline-none focus:border-ochre"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-1">
          {FILTER_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`px-2.5 py-1 text-xs rounded-lg transition-colors ${
                filter === tab.key
                  ? 'bg-ochre/10 text-ochre font-medium'
                  : 'text-ink-muted hover:text-ink hover:bg-ochre/5'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="w-px h-4 bg-border mx-1" />

        {/* Status filter */}
        <div className="flex items-center gap-1">
          {statusFilter !== 'all' && (
            <button
              onClick={() => setStatusFilter('all')}
              className="text-xs text-ochre hover:underline"
            >
              清除
            </button>
          )}
          {STATUS_TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setStatusFilter(tab.key)}
              className={`px-2 py-0.5 text-xs rounded-full transition-colors ${
                statusFilter === tab.key
                  ? 'bg-indigo/10 text-indigo font-medium'
                  : 'text-ink-muted hover:text-ink'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Action buttons */}
        <button onClick={() => setSelectMode(!selectMode)} className={`px-3 py-1.5 text-xs rounded-lg transition-colors flex items-center gap-1.5 ${selectMode ? 'bg-indigo/10 text-indigo' : 'text-ink-muted hover:text-ink hover:bg-ochre/5'}`}>
          <CheckCircle2 className="w-3.5 h-3.5" />
          {selectMode ? '取消选择' : '批量选择'}
        </button>
        <button
          onClick={handleExportBibtex}
          className="px-3 py-1.5 text-xs rounded-lg text-ink-muted hover:text-ink hover:bg-ochre/5 transition-colors flex items-center gap-1.5"
          title={selectMode ? '导出已选' : '导出全部'}
        >
          {bibtexCopied ? <Check className="w-3.5 h-3.5 text-green-600" /> : <Quote className="w-3.5 h-3.5" />}
          BibTeX
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'search' ? (
          <div>
            {/* Search bar */}
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 flex items-center gap-2 bg-white rounded-xl border border-border p-1.5">
                <Search className="w-4 h-4 text-ink-muted ml-2" />
                <input
                  type="text"
                  value={academicQuery}
                  onChange={e => setAcademicQuery(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAcademicSearch()}
                  placeholder="输入论文标题、关键词或作者名..."
                  className="flex-1 py-1.5 text-sm bg-transparent border-none outline-none text-ink placeholder-ink-muted"
                />
                <button
                  onClick={handleAcademicSearch}
                  disabled={searching || !academicQuery.trim()}
                  className="px-4 py-1.5 bg-ochre text-white text-xs font-medium rounded-lg hover:bg-[#4A3728] transition-colors disabled:opacity-50 flex items-center gap-1.5"
                >
                  {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                  {searching ? '搜索中...' : '检索 arXiv'}
                </button>
              </div>

              {/* DOI import */}
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={doiInput}
                  onChange={e => setDoiInput(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleDOIImport()}
                  placeholder="输入 DOI..."
                  className="w-40 px-3 py-2 text-xs bg-white border border-border rounded-lg text-ink placeholder-ink-muted focus:outline-none focus:border-ochre"
                />
                <button
                  onClick={handleDOIImport}
                  disabled={doiLoading}
                  className="px-3 py-2 text-xs bg-white border border-border rounded-lg text-ink-muted hover:text-ink hover:bg-ochre/5 transition-colors disabled:opacity-50"
                >
                  {doiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : '导入'}
                </button>
              </div>
            </div>

            {/* Search results */}
            {searching && (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-ochre animate-spin" />
              </div>
            )}

            {!searching && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map(result => (
                  <div
                    key={result.id}
                    className="p-4 bg-white rounded-xl border border-border hover:border-ochre/20 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {result.categories?.slice(0, 2).map(cat => (
                            <span key={cat} className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${getCategoryColor(cat)}`}>
                              {cat}
                            </span>
                          ))}
                          <span className="px-1.5 py-0.5 text-[10px] rounded-full bg-ochre/10 text-ochre font-medium">
                            {result.source}
                          </span>
                          {result.year && (
                            <span className="text-xs text-ink-muted">{result.year}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-semibold text-ink mb-1.5 leading-snug">{result.title}</h3>
                        <p className="text-xs text-ink-muted mb-2">{result.authors}</p>
                        {result.journal && (
                          <p className="text-xs text-ink-light italic">{result.journal}</p>
                        )}
                      </div>
                      <button
                        onClick={() => handleImportResult(result)}
                        className="px-3 py-1.5 text-xs bg-ochre text-white rounded-lg hover:bg-[#4A3728] transition-colors flex-shrink-0"
                      >
                        收录
                      </button>
                    </div>

                    {/* Abstract */}
                    {result.abstract && (
                      <div className="mt-2">
                        <button
                          onClick={() => toggleAbstract(result.id)}
                          className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                        >
                          {expandedAbstracts.has(result.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          摘要
                        </button>
                        {expandedAbstracts.has(result.id) && (
                          <p className="mt-1.5 text-xs text-ink-muted leading-relaxed line-clamp-5">
                            {result.abstract}
                          </p>
                        )}
                      </div>
                    )}

                    {/* External link */}
                    {result.url && (
                      <a
                        href={result.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-2 text-xs text-indigo hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        在 arXiv 查看
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}

            {!searching && academicQuery && searchResults.length === 0 && (
              <div className="text-center py-20">
                <BookOpen className="w-12 h-12 text-ink-light mx-auto mb-3" />
                <p className="text-sm text-ink-muted">未找到匹配的文献</p>
                <p className="text-xs text-ink-light mt-1">尝试其他关键词或简化搜索词</p>
              </div>
            )}
          </div>
        ) : (
          /* My papers list */
          loading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-ochre animate-spin" />
            </div>
          ) : filteredPapers.length === 0 ? (
            <div className="text-center py-20">
              <BookOpen className="w-12 h-12 text-ink-light mx-auto mb-3" />
              <p className="text-sm text-ink-muted">暂无典籍</p>
              <p className="text-xs text-ink-light mt-1">搜索 arXiv 或手动添加论文</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredPapers.map(paper => (
                <div
                  key={paper.id}
                  className={`group p-4 bg-white rounded-xl border transition-all hover:shadow-sm ${
                    selectedPapers.has(paper.id) ? 'border-indigo/30 bg-indigo/[0.02]' : 'border-border hover:border-ochre/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {/* Select checkbox */}
                    {selectMode && (
                      <button
                        onClick={() => togglePaperSelection(paper.id)}
                        className="mt-0.5 flex-shrink-0"
                      >
                        {selectedPapers.has(paper.id) ? (
                          <CheckCircle2 className="w-5 h-5 text-indigo" />
                        ) : (
                          <Circle className="w-5 h-5 text-ink-light" />
                        )}
                      </button>
                    )}

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        {/* Type badge */}
                        {paper.tags && (
                          <span className={`px-1.5 py-0.5 text-[10px] rounded-full font-medium ${
                            paper.tags.toLowerCase().includes('conference') ? 'bg-ochre/10 text-ochre' :
                            paper.tags.toLowerCase().includes('journal') ? 'bg-indigo/10 text-indigo' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {paper.tags.split(' ')[0]}
                          </span>
                        )}
                        {/* Year */}
                        {paper.year && (
                          <span className="text-xs text-ink-muted">{paper.year}</span>
                        )}
                        {/* Journal */}
                        {paper.journal && (
                          <span className="text-xs text-ink-light italic truncate max-w-[200px]">{paper.journal}</span>
                        )}
                      </div>

                      <h3 className="text-sm font-semibold text-ink mb-1.5 leading-snug">{paper.title}</h3>
                      <p className="text-xs text-ink-muted mb-2">{paper.authors}</p>

                      {/* Abstract preview */}
                      {paper.abstract && (
                        <div className="mt-1">
                          <button
                            onClick={() => toggleAbstract(paper.id)}
                            className="flex items-center gap-1 text-xs text-ink-muted hover:text-ink transition-colors"
                          >
                            {expandedAbstracts.has(paper.id) ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            摘要
                          </button>
                          {expandedAbstracts.has(paper.id) && (
                            <p className="mt-1.5 text-xs text-ink-muted leading-relaxed">{paper.abstract}</p>
                          )}
                        </div>
                      )}

                      {/* Tags */}
                      {paper.tags && paper.tags.split(' ').length > 1 && (
                        <div className="flex items-center gap-1 mt-2 flex-wrap">
                          {paper.tags.split(' ').slice(1, 5).map((tag, i) => (
                            <span key={i} className="px-1.5 py-0.5 text-[10px] bg-gray-50 text-gray-500 rounded-full">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Notes preview */}
                      {paper.notes && (
                        <p className="mt-1.5 text-xs text-ink-light italic border-l-2 border-ochre/20 pl-2">
                          {paper.notes.slice(0, 100)}{paper.notes.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-0.5 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      {/* Star rating */}
                      <div className="flex items-center mr-1">
                        {[1, 2, 3, 4, 5].map(star => (
                          <button
                            key={star}
                            onClick={() => handleRate(paper, star)}
                            className="p-0.5"
                            title={`${star}星`}
                          >
                            <Star
                              className={`w-3.5 h-3.5 ${
                                star <= paper.rating
                                  ? 'text-amber-400 fill-amber-400'
                                  : 'text-gray-200'
                              }`}
                            />
                          </button>
                        ))}
                      </div>

                      {/* Read status toggle */}
                      <button
                        onClick={() => handleStatusChange(
                          paper,
                          paper.readStatus === 'read' ? 'unread' :
                          paper.readStatus === 'reading' ? 'read' : 'reading'
                        )}
                        className={`p-1.5 rounded-lg transition-colors ${
                          paper.readStatus === 'read' ? 'text-green-600 bg-green-50' :
                          paper.readStatus === 'reading' ? 'text-amber-600 bg-amber-50' :
                          'text-ink-muted hover:bg-ochre/5'
                        }`}
                        title={paper.readStatus === 'read' ? '已读' : paper.readStatus === 'reading' ? '阅读中' : '未读'}
                      >
                        {paper.readStatus === 'read' ? (
                          <CheckCircle2 className="w-4 h-4" />
                        ) : paper.readStatus === 'reading' ? (
                          <Clock className="w-4 h-4" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </button>

                      {/* Edit */}
                      <button
                        onClick={() => openEditModal(paper)}
                        className="p-1.5 text-ink-muted hover:text-ink hover:bg-ochre/5 rounded-lg transition-colors"
                        title="编辑"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>

                      {/* Delete */}
                      <button
                        onClick={() => handleDelete(paper.id)}
                        className="p-1.5 text-ink-muted hover:text-cinnabar hover:bg-cinnabar/5 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* DOI copy */}
                    {paper.doi && (
                      <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(paper.doi || '')
                            success('DOI 已复制')
                          }}
                          className="p-1.5 text-ink-muted hover:text-ink hover:bg-ochre/5 rounded-lg transition-colors"
                          title="复制 DOI"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )
        )}
      </div>

      {/* Add/Edit Modal */}
      <Modal isOpen={showAddModal} onClose={() => { setShowAddModal(false); resetForm() }}>
        <div className="p-6">
          <h3 className="text-lg font-display font-semibold text-ink mb-4">
            {editingPaper ? '修缮典籍' : '收录典籍'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">标题 *</label>
              <input
                type="text"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
                required
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                placeholder="论文标题"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">作者</label>
                <input
                  type="text"
                  value={formData.authors}
                  onChange={e => setFormData({ ...formData, authors: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                  placeholder="作者（逗号分隔）"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">年份</label>
                <input
                  type="number"
                  value={formData.year}
                  onChange={e => setFormData({ ...formData, year: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                  placeholder="e.g. 2024"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">期刊/会议</label>
                <input
                  type="text"
                  value={formData.journal}
                  onChange={e => setFormData({ ...formData, journal: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                  placeholder="期刊或会议名称"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">DOI</label>
                <input
                  type="text"
                  value={formData.doi}
                  onChange={e => setFormData({ ...formData, doi: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                  placeholder="10.xxxx/xxxx"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">标签</label>
              <input
                type="text"
                value={formData.tags}
                onChange={e => setFormData({ ...formData, tags: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                placeholder="e.g. conference nlp deep-learning"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">摘要</label>
              <textarea
                value={formData.abstract}
                onChange={e => setFormData({ ...formData, abstract: e.target.value })}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre resize-none"
                placeholder="论文摘要..."
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ink-secondary mb-1">笔记</label>
              <textarea
                value={formData.notes}
                onChange={e => setFormData({ ...formData, notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre resize-none"
                placeholder="个人笔记..."
              />
            </div>
            <div className="flex items-center gap-4">
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">评级</label>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating: star })}
                    >
                      <Star
                        className={`w-5 h-5 ${
                          star <= formData.rating ? 'text-amber-400 fill-amber-400' : 'text-gray-200'
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-ink-secondary mb-1">阅读状态</label>
                <select
                  value={formData.readStatus}
                  onChange={e => setFormData({ ...formData, readStatus: e.target.value as Paper['readStatus'] })}
                  className="px-3 py-2 text-sm border border-border rounded-lg focus:outline-none focus:border-ochre"
                >
                  <option value="unread">未读</option>
                  <option value="reading">阅读中</option>
                  <option value="read">已读</option>
                </select>
              </div>
            </div>
            <div className="flex items-center gap-3 pt-2">
              <Button type="submit" className="px-6 py-2">
                {editingPaper ? '保存' : '收录'}
              </Button>
              <button
                type="button"
                onClick={() => { setShowAddModal(false); resetForm() }}
                className="px-4 py-2 text-sm text-ink-muted hover:text-ink transition-colors"
              >
                取消
              </button>
            </div>
          </form>
        </div>
      </Modal>
    </div>
  )
}
