'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import dynamic from 'next/dynamic'
import EditorToolbar from './components/EditorToolbar'
import EditorSidebar from './components/EditorSidebar'
import EditorStatusBar from './components/EditorStatusBar'
import AIAssistantPanel from './components/AIAssistantPanel'
import DocumentUpload from './components/DocumentUpload'
import PomodoroTimer from './components/PomodoroTimer'
import type { Editor as TiptapEditor } from '@tiptap/react'
import type { Document } from '../../../lib/editor-types'
import {
  getDocuments,
  createDocument,
  updateDocument,
  deleteDocument,
} from '../../../lib/editor-api'
import { exportToWord } from '../../../lib/export-word'
import { getPlans, createPlan } from '../../../lib/api'
import type { Plan } from '../../../lib/api'

const EditorMain = dynamic(() => import('./components/EditorMain'), {
  ssr: false,
  loading: () => (
    <div className="flex-1 flex items-center justify-center text-ink-muted">
      <div className="flex flex-col items-center gap-2">
        <div className="w-8 h-8 border-2 border-ochre border-t-transparent rounded-full animate-spin" />
        <span className="text-xs">加载编辑器...</span>
      </div>
    </div>
  ),
})
import {
  FileText,
  Trash2,
  ChevronLeft,
  Upload,
  X,
  FileEdit,
  Clock,
  FolderOpen,
  Search,
  FilePlus,
  FileUp,
  MessageSquare,
  Type,
  History,
  RotateCcw,
  User,
  BarChart3,
  Share2,
  Link2,
  Eye,
  EyeOff,
  Send,
  CheckCircle2,
  Circle,
  Reply,
  Activity,
  Loader2,
  Plus,
  Sparkles,
  Timer,
} from 'lucide-react'
import { AncientSeal } from '../../../components/ui/AncientSeal'
import { ChineseBorder } from '../../../components/ui/ChineseBorder'
import { useToast } from '../../../components/ui/Toast'
import { Modal } from '../../../components/ui/Modal'

interface VersionSnapshot {
  id: string
  content: string
  timestamp: string
  wordCount: number
  author: string
}

interface WritingStats {
  dailyWords: Record<string, number>
  hourlyDistribution: Record<string, number>
  docTypeDistribution: Record<string, number>
  lastWritingDate: string | null
  streakDays: number
  totalWords: number
}

// ============ COLLABORATION TYPES ============

interface Comment {
  id: string
  docId: string
  text: string
  selectedText: string
  author: string
  authorColor: string
  timestamp: string
  resolved: boolean
  replies: CommentReply[]
}

interface CommentReply {
  id: string
  author: string
  authorColor: string
  content: string
  timestamp: string
}

interface ShareSettings {
  docId: string
  shareLink: string
  permission: 'read' | 'edit'
  enabled: boolean
}

interface ActivityRecord {
  id: string
  docId: string
  author: string
  action: string
  timestamp: string
}

const MAX_VERSIONS = 20
const VERSIONS_KEY_PREFIX = 'caijianji_versions_'
const WRITING_STATS_KEY = 'caijianji_writing_stats'

// Collaboration localStorage keys
function getCommentsKey(docId: string): string { return `caijianji_comments_${docId}` }
function getSharesKey(docId: string): string { return `caijianji_shares_${docId}` }
function getActivitiesKey(docId: string): string { return `caijianji_activities_${docId}` }

function getVersionsKey(docId: string): string {
  return `${VERSIONS_KEY_PREFIX}${docId}`
}

function loadVersions(docId: string): VersionSnapshot[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getVersionsKey(docId))
    if (!raw) return []
    return JSON.parse(raw) as VersionSnapshot[]
  } catch {
    return []
  }
}

function saveVersions(docId: string, versions: VersionSnapshot[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getVersionsKey(docId), JSON.stringify(versions))
}

function addVersion(docId: string, content: string, wordCount: number, author: string = '我'): void {
  const versions = loadVersions(docId)
  const newVersion: VersionSnapshot = {
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    content,
    timestamp: new Date().toISOString(),
    wordCount,
    author,
  }
  versions.unshift(newVersion)
  if (versions.length > MAX_VERSIONS) {
    versions.pop()
  }
  saveVersions(docId, versions)
}

function loadWritingStats(): WritingStats {
  if (typeof window === 'undefined') {
    return {
      dailyWords: {},
      hourlyDistribution: {},
      docTypeDistribution: {},
      lastWritingDate: null,
      streakDays: 0,
      totalWords: 0,
    }
  }
  try {
    const raw = localStorage.getItem(WRITING_STATS_KEY)
    if (!raw) {
      return {
        dailyWords: {},
        hourlyDistribution: {},
        docTypeDistribution: {},
        lastWritingDate: null,
        streakDays: 0,
        totalWords: 0,
      }
    }
    return JSON.parse(raw) as WritingStats
  } catch {
    return {
      dailyWords: {},
      hourlyDistribution: {},
      docTypeDistribution: {},
      lastWritingDate: null,
      streakDays: 0,
      totalWords: 0,
    }
  }
}

function saveWritingStats(stats: WritingStats): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(WRITING_STATS_KEY, JSON.stringify(stats))
}

function updateWritingStats(wordCount: number, docType: string = '文稿'): void {
  const stats = loadWritingStats()
  const now = new Date()
  const today = now.toISOString().split('T')[0]
  const hour = now.getHours().toString()

  // Update daily words
  stats.dailyWords[today] = (stats.dailyWords[today] || 0) + wordCount
  stats.totalWords += wordCount

  // Update hourly distribution
  stats.hourlyDistribution[hour] = (stats.hourlyDistribution[hour] || 0) + 1

  // Update doc type distribution
  stats.docTypeDistribution[docType] = (stats.docTypeDistribution[docType] || 0) + 1

  // Update streak
  if (stats.lastWritingDate) {
    const lastDate = new Date(stats.lastWritingDate)
    const diffDays = Math.floor((now.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24))
    if (diffDays === 1) {
      stats.streakDays += 1
    } else if (diffDays > 1) {
      stats.streakDays = 1
    }
  } else {
    stats.streakDays = 1
  }
  stats.lastWritingDate = today

  saveWritingStats(stats)
}

// ============ COLLABORATION HELPERS ============

function loadComments(docId: string): Comment[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getCommentsKey(docId))
    if (!raw) return []
    return JSON.parse(raw) as Comment[]
  } catch { return [] }
}

function saveComments(docId: string, comments: Comment[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getCommentsKey(docId), JSON.stringify(comments))
}

function loadShareSettings(docId: string): ShareSettings | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(getSharesKey(docId))
    if (!raw) return null
    return JSON.parse(raw) as ShareSettings
  } catch { return null }
}

function saveShareSettings(docId: string, settings: ShareSettings): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getSharesKey(docId), JSON.stringify(settings))
}

function loadActivities(docId: string): ActivityRecord[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(getActivitiesKey(docId))
    if (!raw) return []
    return JSON.parse(raw) as ActivityRecord[]
  } catch { return [] }
}

function saveActivities(docId: string, activities: ActivityRecord[]): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(getActivitiesKey(docId), JSON.stringify(activities))
}

function addActivity(docId: string, author: string, action: string): void {
  const activities = loadActivities(docId)
  activities.unshift({
    id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    docId,
    author,
    action,
    timestamp: new Date().toISOString(),
  })
  if (activities.length > 50) activities.pop()
  saveActivities(docId, activities)
}

export default function EditorPage() {
  const { success, error: toastError } = useToast()
  const [documents, setDocuments] = useState<Document[]>([])
  const [currentDoc, setCurrentDoc] = useState<Document | null>(null)
  const [editor, setEditor] = useState<TiptapEditor | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [wordCount, setWordCount] = useState(0)
  const [charCount, setCharCount] = useState(0)
  const [paragraphCount, setParagraphCount] = useState(0)
  const [lastSaved, setLastSaved] = useState<string | null>(null)
  const [showDocList, setShowDocList] = useState(true)
  const [showUpload, setShowUpload] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [hoveredDoc, setHoveredDoc] = useState<string | null>(null)
  const [zoomLevel, setZoomLevel] = useState(100)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [pageMode, setPageMode] = useState(false)

  // AI Writing Suggestion Panel States
  const [selectedText, setSelectedText] = useState('')
  const [hasSelection, setHasSelection] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)

  // Version History States
  const [showVersionPanel, setShowVersionPanel] = useState(false)
  const [versions, setVersions] = useState<VersionSnapshot[]>([])
  const [selectedVersion, setSelectedVersion] = useState<VersionSnapshot | null>(null)
  const [previewContent, setPreviewContent] = useState<string>('')

  // Collaboration States
  const [showCommentsPanel, setShowCommentsPanel] = useState(false)
  const [comments, setComments] = useState<Comment[]>([])
  const [newCommentText, setNewCommentText] = useState('')
  const [replyingTo, setReplyingTo] = useState<string | null>(null)
  const [replyText, setReplyText] = useState('')
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareSettings, setShareSettings] = useState<ShareSettings | null>(null)
  const [sharePermission, setSharePermission] = useState<'read' | 'edit'>('read')
  const [activities, setActivities] = useState<ActivityRecord[]>([])
  const [showActivitiesPanel, setShowActivitiesPanel] = useState(false)
  const [commentSelection, setCommentSelection] = useState<{ text: string; from: number; to: number } | null>(null)

  // Writing Plan Panel States
  const [showPlanPanel, setShowPlanPanel] = useState(false)
  const [plans, setPlans] = useState<Plan[]>([])

  // Pomodoro Timer Panel State
  const [showPomodoroPanel, setShowPomodoroPanel] = useState(false)

  const saveTimerRef = useRef<NodeJS.Timeout | null>(null)
  const selectionTimerRef = useRef<NodeJS.Timeout | null>(null)

  // Load documents
  useEffect(() => {
    loadDocuments()
  }, [])

  // Load versions, comments, share settings, activities when current doc changes
  useEffect(() => {
    if (currentDoc) {
      setVersions(loadVersions(currentDoc.id))
      setSelectedVersion(null)
      setPreviewContent('')
      setComments(loadComments(currentDoc.id))
      setShareSettings(loadShareSettings(currentDoc.id))
      setActivities(loadActivities(currentDoc.id))

      // 恢复未保存的草稿
      if (typeof window !== 'undefined') {
        const draft = localStorage.getItem(`doc_draft_${currentDoc.id}`)
        if (draft) {
          const parsed = JSON.parse(draft)
          // 如果草稿比当前内容新，恢复草稿
          if (new Date(parsed.updatedAt) > new Date(currentDoc.updatedAt)) {
            setCurrentDoc(prev => prev ? { ...prev, content: parsed.content } : prev)
            setSaveStatus('unsaved')
          }
        }
      }
    }
  }, [currentDoc?.id])

  // Text selection detection
  useEffect(() => {
    if (!editor) return

    const handleSelectionChange = () => {
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current)
      selectionTimerRef.current = setTimeout(() => {
        const { from, to } = editor.state.selection
        if (from !== to) {
          const text = editor.state.doc.textBetween(from, to, ' ')
          setSelectedText(text)
          setHasSelection(true)
          setCommentSelection({ text, from, to })
        } else {
          setSelectedText('')
          setHasSelection(false)
          setCommentSelection(null)
        }
      }, 200)
    }

    const editorElement = editor.view.dom
    editorElement.addEventListener('mouseup', handleSelectionChange)
    editorElement.addEventListener('keyup', handleSelectionChange)

    return () => {
      editorElement.removeEventListener('mouseup', handleSelectionChange)
      editorElement.removeEventListener('keyup', handleSelectionChange)
      if (selectionTimerRef.current) clearTimeout(selectionTimerRef.current)
    }
  }, [editor])

  async function loadDocuments() {
    try {
      const docs = await getDocuments()
      setDocuments(docs)
    } catch (e) {
      console.error('Failed to load documents:', e)
      toastError(typeof e === 'string' ? e : (e as Error)?.message || '加载文稿失败，请稍后重试')
    } finally {
      setLoading(false)
    }
  }

  // Auto-save with debounce
  const handleContentUpdate = useCallback(
    (html: string, text: string) => {
      if (!currentDoc) return
      setSaveStatus('unsaved')
      setWordCount(text.replace(/\s/g, '').length)
      setCharCount(text.length)
      setParagraphCount(text.split(/\n\s*\n/).filter(p => p.trim().length > 0).length)

      // 自动保存到 localStorage（游客模式或作为备份）
      if (typeof window !== 'undefined') {
        localStorage.setItem(`doc_draft_${currentDoc.id}`, JSON.stringify({
          content: html,
          title: currentDoc.title,
          updatedAt: new Date().toISOString(),
        }))
      }

      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(async () => {
        await saveDocument(html)
      }, 3000)
    },
    [currentDoc]
  )

  // Manual save
  const handleSave = useCallback(async () => {
    if (!currentDoc || !editor) return
    const html = editor.getHTML()
    await saveDocument(html)
  }, [currentDoc, editor])

  async function saveDocument(html: string) {
    if (!currentDoc) return
    setSaveStatus('saving')
    try {
      const updated = await updateDocument(currentDoc.id, {
        title: currentDoc.title,
        content: html,
        status: currentDoc.status,
      })
      setCurrentDoc(updated)
      setDocuments(prev => prev.map(d => (d.id === updated.id ? updated : d)))
      setSaveStatus('saved')
      setLastSaved(new Date().toLocaleTimeString('zh-CN'))
      success('文稿已存')

      // Save version snapshot
      const plainText = html.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()
      const wc = plainText.length
      addVersion(currentDoc.id, html, wc)
      setVersions(loadVersions(currentDoc.id))

      // Update writing stats
      updateWritingStats(wc, detectDocType(currentDoc.title))

      // Add activity
      addActivity(currentDoc.id, '我', '编辑了文稿')
      setActivities(loadActivities(currentDoc.id))

      // 保存成功后清除 localStorage 中的草稿
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`doc_draft_${currentDoc.id}`)
      }
    } catch (e) {
      console.error('Save failed:', e)
      toastError(typeof e === 'string' ? e : (e as Error)?.message || '保存未果，请稍后重试')
      setSaveStatus('unsaved')
    }
  }

  function detectDocType(title: string): string {
    const t = title.toLowerCase()
    if (t.includes('论文')) return '论文'
    if (t.includes('报告')) return '报告'
    if (t.includes('笔记')) return '笔记'
    if (t.includes('总结')) return '总结'
    if (t.includes('计划')) return '计划'
    return '文稿'
  }

  // Create new document
  async function handleCreateNew() {
    try {
      const doc = await createDocument({
        title: '无题文稿',
        content: '',
      })
      setDocuments(prev => [doc, ...prev])
      setCurrentDoc(doc)
      setShowDocList(false)
      setSaveStatus('saved')
      setWordCount(0)
      setCharCount(0)
      setParagraphCount(0)
      setSelectedText('')
      setHasSelection(false)
      // Add activity
      addActivity(doc.id, '我', '创建了文稿')
    } catch (e) {
      console.error('Create failed:', e)
      toastError(typeof e === 'string' ? e : (e as Error)?.message || '文稿创建未果，请稍后重试')
    }
  }

  // Select document
  function handleSelectDoc(doc: Document) {
    setCurrentDoc(doc)
    setShowDocList(false)
    setSaveStatus('saved')
    setWordCount(doc.wordCount || 0)
    setCharCount(doc.plainText?.length || 0)
    const paragraphs = (doc.plainText || '').split(/\n\s*\n/).filter(p => p.trim().length > 0)
    setParagraphCount(paragraphs.length)
    setSelectedText('')
    setHasSelection(false)
  }

  // Delete document
  async function handleDeleteDoc(id: string) {
    // 弹出确认对话框，防止误删
    if (!confirm('确定要删除此文稿？此操作不可撤销。')) {
      return
    }
    try {
      await deleteDocument(id)
      setDocuments(prev => prev.filter(d => d.id !== id))
      if (currentDoc?.id === id) {
        setCurrentDoc(null)
        setShowDocList(true)
      }
      // Clean up versions
      if (typeof window !== 'undefined') {
        localStorage.removeItem(getVersionsKey(id))
        localStorage.removeItem(getCommentsKey(id))
        localStorage.removeItem(getSharesKey(id))
        localStorage.removeItem(getActivitiesKey(id))
      }
    } catch (e) {
      console.error('Delete failed:', e)
      toastError(typeof e === 'string' ? e : (e as Error)?.message || '文稿删除未果，请稍后重试')
    }
  }

  // Upload complete
  function handleUploadComplete(doc: Document) {
    setDocuments(prev => [doc, ...prev])
    setCurrentDoc(doc)
    setShowDocList(false)
    setShowUpload(false)
    setSaveStatus('saved')
    setWordCount(doc.wordCount || 0)
    setCharCount(doc.plainText?.length || 0)
  }

  // AI insert suggestion
  function handleInsertSuggestion(text: string) {
    if (!editor) return
    editor.chain().focus().insertContent(text).run()
  }

  // AI apply fix - replace original text with suggestion
  function handleApplyFix(original: string, suggestion: string) {
    if (!editor) return
    const currentContent = editor.getHTML()
    if (currentContent.includes(original)) {
      const newContent = currentContent.replace(original, suggestion)
      editor.commands.setContent(newContent)
      setSaveStatus('unsaved')
      success('已应用修改')
    } else {
      // If exact match fails, try plain text replacement
      const plainTextContent = editor.getText()
      const plainIndex = plainTextContent.indexOf(original)
      if (plainIndex !== -1) {
        // Find the corresponding position in the HTML
        const tempDiv = document.createElement('div')
        tempDiv.innerHTML = currentContent
        const textContent = tempDiv.textContent || ''
        const htmlIndex = textContent.indexOf(original)
        if (htmlIndex !== -1) {
          // Simple approach: replace in HTML
          const escapedOriginal = original.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          const newHtml = currentContent.replace(new RegExp(escapedOriginal), suggestion)
          editor.commands.setContent(newHtml)
          setSaveStatus('unsaved')
          success('已应用修改')
          return
        }
      }
      // Fallback: insert suggestion at cursor
      editor.chain().focus().insertContent(suggestion).run()
      success('已插入修改建议（未找到原文精确匹配）')
    }
  }

  // Load plans for writing plan panel
  async function loadPlans() {
    try {
      const data = await getPlans()
      setPlans(data)
    } catch (e) {
      console.error('Failed to load plans:', e)
      toastError(typeof e === 'string' ? e : (e as Error)?.message || '加载写作筹谋失败，请稍后重试')
    }
  }

  // Toggle plan panel and load plans
  function handleTogglePlanPanel() {
    if (!showPlanPanel && plans.length === 0) {
      loadPlans()
    }
    setShowPlanPanel(!showPlanPanel)
  }

  // Export to Word
  const handleExport = useCallback(async () => {
    if (!currentDoc || !editor) return
    try {
      const html = editor.getHTML()
      await exportToWord(html, currentDoc.title || '文稿')
      success('导出成功')
    } catch (e) {
      console.error('Export failed:', e)
      toastError(typeof e === 'string' ? e : (e as Error)?.message || '导出失败，请稍后重试')
    }
  }, [currentDoc, editor, success])

  // Editor ready
  const handleEditorReady = useCallback((ed: TiptapEditor) => {
    setEditor(ed)
  }, [])

  // Filter documents
  const filteredDocs = documents.filter(doc =>
    doc.title.toLowerCase().includes(searchQuery.toLowerCase())
  )

  // Status badge config
  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'draft':
        return { label: '草稿', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
      case 'review':
        return { label: '审阅中', bg: 'bg-amber-50', text: 'text-amber-600', border: 'border-amber-200' }
      case 'final':
        return { label: '定稿', bg: 'bg-green-50', text: 'text-green-600', border: 'border-green-200' }
      default:
        return { label: '草稿', bg: 'bg-gray-100', text: 'text-gray-600', border: 'border-gray-200' }
    }
  }

  // Version history handlers
  function handleVersionClick(version: VersionSnapshot) {
    setSelectedVersion(version)
    setPreviewContent(version.content)
  }

  function handleRestoreVersion(version: VersionSnapshot) {
    if (!editor || !currentDoc) return
    if (confirm('确定要恢复到此版本吗？当前未保存的内容将丢失。')) {
      editor.commands.setContent(version.content)
      setSaveStatus('unsaved')
      setSelectedVersion(null)
      setPreviewContent('')
      success('已恢复版本')
    }
  }

  function formatVersionTime(timestamp: string): string {
    const date = new Date(timestamp)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return '方才'
    if (minutes < 60) return `${minutes} 分钟前`
    if (hours < 24) return `${hours} 时辰前`
    if (days < 7) return `${days} 日前`
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  // ============ COLLABORATION HANDLERS ============

  function handleAddComment() {
    if (!currentDoc || !commentSelection || !newCommentText.trim()) return
    const commentsList = loadComments(currentDoc.id)
    const newComment: Comment = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      docId: currentDoc.id,
      text: newCommentText.trim(),
      selectedText: commentSelection.text,
      author: '我',
      authorColor: '#8B5E3C',
      timestamp: new Date().toISOString(),
      resolved: false,
      replies: [],
    }
    commentsList.push(newComment)
    saveComments(currentDoc.id, commentsList)
    setComments(commentsList)
    setNewCommentText('')
    setShowCommentsPanel(true)
    success('评注已添加')
  }

  function handleResolveComment(commentId: string) {
    if (!currentDoc) return
    const commentsList = loadComments(currentDoc.id)
    const updated = commentsList.map(c => c.id === commentId ? { ...c, resolved: !c.resolved } : c)
    saveComments(currentDoc.id, updated)
    setComments(updated)
  }

  function handleDeleteComment(commentId: string) {
    if (!currentDoc) return
    const commentsList = loadComments(currentDoc.id)
    const updated = commentsList.filter(c => c.id !== commentId)
    saveComments(currentDoc.id, updated)
    setComments(updated)
  }

  function handleAddReply(commentId: string) {
    if (!currentDoc || !replyText.trim()) return
    const commentsList = loadComments(currentDoc.id)
    const updated = commentsList.map(c => {
      if (c.id !== commentId) return c
      return {
        ...c,
        replies: [
          ...c.replies,
          {
            id: `${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
            author: '我',
            authorColor: '#8B5E3C',
            content: replyText.trim(),
            timestamp: new Date().toISOString(),
          },
        ],
      }
    })
    saveComments(currentDoc.id, updated)
    setComments(updated)
    setReplyText('')
    setReplyingTo(null)
  }

  function handleGenerateShareLink() {
    if (!currentDoc) return
    const link = `${window.location.origin}/app/editor/share/${currentDoc.id}`
    const settings: ShareSettings = {
      docId: currentDoc.id,
      shareLink: link,
      permission: sharePermission,
      enabled: true,
    }
    saveShareSettings(currentDoc.id, settings)
    setShareSettings(settings)
    success('分享链接已生成')
  }

  function handleCopyShareLink() {
    if (shareSettings?.shareLink) {
      navigator.clipboard.writeText(shareSettings.shareLink)
      success('链接已复制到剪贴板')
    }
  }

  function formatActivityTime(timestamp: string): string {
    return formatVersionTime(timestamp)
  }

  // Document list view
  if (showDocList && !currentDoc) {
    return (
      <div className="h-[calc(100vh-64px)] bg-paper overflow-y-auto">
        <div className="max-w-6xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-ink flex items-center gap-2">
                <FileEdit className="w-7 h-7 text-ochre" />
                论文编辑器
                <AncientSeal text="墨韵" size={40} />
              </h1>
              <p className="text-sm text-ink-muted mt-1">创建、编辑和管理你的论文文稿</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowUpload(true)}
                className="px-4 py-2.5 border border-border rounded-lg text-sm text-ink-secondary hover:bg-white hover:border-ochre-light transition-all flex items-center gap-2 shadow-sm"
              >
                <FileUp className="w-4 h-4" />
                导入 Word
              </button>
              <button
                onClick={handleCreateNew}
                className="px-4 py-2.5 bg-ochre text-white rounded-lg text-sm hover:bg-ink transition-all flex items-center gap-2 shadow-sm"
              >
                <FilePlus className="w-4 h-4" />
                新建文稿
              </button>
            </div>
          </div>

          {/* Upload area */}
          {showUpload && (
            <div className="mb-6 bg-white border border-border rounded-xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-ink flex items-center gap-2">
                  <Upload className="w-4 h-4 text-ochre" />
                  导入 Word 文稿
                </h3>
                <button onClick={() => setShowUpload(false)} className="text-ink-light hover:text-ink-secondary p-1 rounded-lg hover:bg-paper-dark transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <DocumentUpload onUploadComplete={handleUploadComplete} />
            </div>
          )}

          {/* Search bar */}
          {documents.length > 0 && (
            <div className="mb-6 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-ink-light" />
              <input
                type="text"
                placeholder="搜索文稿..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white border border-border rounded-lg text-sm text-ink placeholder:text-ink-light focus:outline-none focus:border-ochre focus:ring-1 focus:ring-ochre transition-all"
              />
            </div>
          )}

          {/* Document list */}
          {loading ? (
            <div className="text-center py-16">
              <div className="animate-spin w-10 h-10 border-3 border-ochre border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-sm text-ink-muted">加载文稿中...</p>
            </div>
          ) : documents.length === 0 && !searchQuery ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-ochre-bg flex items-center justify-center border border-border animate-empty-float">
                <FileText className="w-10 h-10 text-ochre" />
              </div>
              <h3 className="text-lg font-semibold text-ink mb-2">开始你的第一篇论文</h3>
              <p className="text-sm text-ink-muted mb-6 max-w-sm mx-auto leading-relaxed">
                创建文稿后，你可以使用 AI 辅助写作、管理文献引用、追踪写作进度
              </p>
              <div className="flex items-center justify-center gap-3">
                <button
                  onClick={handleCreateNew}
                  className="px-5 py-2.5 bg-ochre text-white text-sm rounded-lg hover:bg-ink transition-all active:scale-[0.97] flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  创建文稿
                </button>
                <button
                  onClick={async () => {
                    try {
                      const doc = await createDocument({
                        title: '示例：基于深度学习的自然语言处理研究综述',
                        content: '<h1>基于深度学习的自然语言处理研究综述</h1><p>本文综述了近年来深度学习在自然语言处理领域的最新进展...</p>',
                      })
                      setDocuments(prev => [doc, ...prev])
                      setCurrentDoc(doc)
                      setShowDocList(false)
                      setSaveStatus('saved')
                    } catch (e) {
                      console.error('Create sample failed:', e)
                      toastError(typeof e === 'string' ? e : (e as Error)?.message || '创建示例文稿失败，请稍后重试')
                    }
                  }}
                  className="px-5 py-2.5 border border-border text-ink-secondary text-sm rounded-lg hover:bg-ochre-bg hover:border-ochre-light transition-all active:scale-[0.97] flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4 text-ochre" />
                  查看示例
                </button>
              </div>
            </div>
          ) : documents.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm text-ink-muted">未找到匹配的文稿</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredDocs.map(doc => {
                const status = getStatusConfig(doc.status)
                return (
                  <div
                    key={doc.id}
                    className="group bg-white border border-border rounded-xl p-5 hover:border-ochre-light hover:shadow-md transition-all cursor-pointer relative"
                    onClick={() => handleSelectDoc(doc)}
                    onMouseEnter={() => setHoveredDoc(doc.id)}
                    onMouseLeave={() => setHoveredDoc(null)}
                  >
                    {/* Document preview thumbnail */}
                    <div className="h-32 bg-paper border border-border-light rounded-lg mb-4 flex items-center justify-center overflow-hidden">
                      <div className="text-center px-4">
                        <FileText className="w-8 h-8 text-[#D4C8BC] mx-auto mb-2" />
                        <p className="text-xs text-ink-light truncate max-w-[180px]">{doc.title}</p>
                      </div>
                    </div>

                    {/* Title and actions */}
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="text-sm font-semibold text-ink truncate flex-1 pr-2">{doc.title}</h3>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id) }}
                        className="opacity-0 group-hover:opacity-100 p-1.5 text-ink-light hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {/* Meta info */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium border ${status.bg} ${status.text} ${status.border}`}>
                        {status.label}
                      </span>
                      <span className="text-xs text-ink-muted">{doc.wordCount || 0} 字</span>
                      <span className="text-xs text-ink-light">·</span>
                      <span className="text-xs text-ink-muted flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(doc.updatedAt).toLocaleDateString('zh-CN')}
                      </span>
                    </div>

                    {/* Hover action overlay */}
                    {hoveredDoc === doc.id && (
                      <div className="absolute inset-0 bg-white/90 rounded-xl flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={(e) => { e.stopPropagation(); handleSelectDoc(doc) }}
                          className="px-4 py-2 bg-ochre text-white text-xs rounded-lg hover:bg-ink transition-colors flex items-center gap-2"
                        >
                          <FolderOpen className="w-3.5 h-3.5" />
                          打开
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteDoc(doc.id) }}
                          className="px-4 py-2 border border-red-200 text-red-500 text-xs rounded-lg hover:bg-red-50 transition-colors flex items-center gap-2"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          删除
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // Editor view
  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-paper">
      {/* Editor header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-white">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setShowDocList(true)
              setCurrentDoc(null)
            }}
            className="p-1.5 text-ink-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
            title="返回文稿列表"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <input
            value={currentDoc?.title || ''}
            onChange={(e) => {
              if (currentDoc) {
                setCurrentDoc({ ...currentDoc, title: e.target.value })
                setSaveStatus('unsaved')
              }
            }}
            className="text-sm font-semibold text-ink bg-transparent border-none outline-none focus:ring-0 px-2 py-1 hover:bg-paper-dark rounded transition-colors min-w-[200px]"
            placeholder="文稿题名"
          />
        </div>
        <div className="flex items-center gap-2">
          {/* Share button */}
          <button
            onClick={() => setShowShareModal(true)}
            className="px-3 py-1.5 text-xs text-ink-secondary border border-border rounded-md hover:bg-ochre-bg hover:border-ochre-light hover:text-ochre transition-all flex items-center gap-1.5"
          >
            <Share2 className="w-3.5 h-3.5" />
            分享文稿
          </button>
          {/* Comments button */}
          <button
            onClick={() => setShowCommentsPanel(!showCommentsPanel)}
            className={`px-3 py-1.5 text-xs border rounded-md transition-all flex items-center gap-1.5 ${showCommentsPanel
              ? 'bg-ochre-bg text-ochre border-ochre-light'
              : 'text-ink-secondary border-border hover:bg-ochre-bg hover:border-ochre-light hover:text-ochre'
              }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            评注
            {comments.filter(c => !c.resolved).length > 0 && (
              <span className="px-1.5 py-0.5 bg-ochre text-white text-[10px] rounded-full">
                {comments.filter(c => !c.resolved).length}
              </span>
            )}
          </button>
          {/* Activity button */}
          <button
            onClick={() => setShowActivitiesPanel(!showActivitiesPanel)}
            className={`px-3 py-1.5 text-xs border rounded-md transition-all flex items-center gap-1.5 ${showActivitiesPanel
              ? 'bg-ochre-bg text-ochre border-ochre-light'
              : 'text-ink-secondary border-border hover:bg-ochre-bg hover:border-ochre-light hover:text-ochre'
              }`}
          >
            <Activity className="w-3.5 h-3.5" />
            活动
          </button>
          <button
            onClick={() => setShowVersionPanel(true)}
            className="px-3 py-1.5 text-xs text-ink-secondary border border-border rounded-md hover:bg-ochre-bg hover:border-ochre-light hover:text-ochre transition-all flex items-center gap-1.5"
          >
            <History className="w-3.5 h-3.5" />
            版本留影
          </button>
          {/* Plan button */}
          <button
            onClick={handleTogglePlanPanel}
            className={`px-3 py-1.5 text-xs border rounded-md transition-all flex items-center gap-1.5 ${showPlanPanel
              ? 'bg-ochre-bg text-ochre border-ochre-light'
              : 'text-ink-secondary border-border hover:bg-ochre-bg hover:border-ochre-light hover:text-ochre'
              }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            写作筹谋
          </button>
          {/* 分页模式切换 */}
          <button
            onClick={() => setPageMode(v => !v)}
            title={pageMode ? '切换为普通模式' : '切换为分页模式'}
            className={`px-3 py-1.5 text-xs border rounded-md transition-all flex items-center gap-1.5 ${pageMode
              ? 'bg-ochre-bg text-ochre border-ochre-light'
              : 'text-ink-secondary border-border hover:bg-ochre-bg hover:border-ochre-light hover:text-ochre'
              }`}
          >
            <FileText className="w-3.5 h-3.5" />
            {pageMode ? '分页模式' : '普通模式'}
          </button>
          <select
            value={currentDoc?.status || 'draft'}
            onChange={(e) => {
              if (currentDoc) {
                setCurrentDoc({ ...currentDoc, status: e.target.value as any })
                setSaveStatus('unsaved')
              }
            }}
            className="text-xs border border-border rounded-md px-2 py-1.5 text-ink-secondary bg-white focus:outline-none focus:border-ochre"
          >
            <option value="draft">草稿</option>
            <option value="review">审阅中</option>
            <option value="final">定稿</option>
          </select>
        </div>
      </div>

      {/* Toolbar */}
      <EditorToolbar
        editor={editor}
        onSave={handleSave}
        saveStatus={saveStatus}
        onAISuggest={() => setAiPanelOpen(true)}
        onExport={handleExport}
        onTogglePomodoro={() => setShowPomodoroPanel(!showPomodoroPanel)}
      />

      {/* Main area: sidebar + editor + panels */}
      <div className="flex flex-1 overflow-hidden relative">
        <EditorSidebar
          content={currentDoc?.content || ''}
          onHeadingClick={(text) => {
            if (!editor) return
            const doc = editor.state.doc
            let found = false
            doc.descendants((node, pos) => {
              if (found) return false
              if (node.type.name === 'heading') {
                const nodeText = node.textContent
                if (nodeText.trim() === text.trim()) {
                  editor.chain().focus().setTextSelection({ from: pos, to: pos + node.nodeSize }).run()
                  const view = editor.view
                  const coords = view.coordsAtPos(pos)
                  if (coords) {
                    view.dom.parentElement?.scrollTo({
                      top: coords.top - 100,
                      behavior: 'smooth'
                    })
                  }
                  found = true
                  return false
                }
              }
            })
          }}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* Writing Plan Panel */}
        {showPlanPanel && (
          <div className="w-[260px] border-r border-border bg-white flex flex-col h-full flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-paper">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <BarChart3 className="w-4 h-4 text-ochre" />
                写作筹谋
              </div>
              <button
                onClick={() => setShowPlanPanel(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3">
              {(() => {
                // Find the plan associated with current document
                const currentPlan = currentDoc?.planId
                  ? plans.find(p => p.id === currentDoc.planId)
                  : plans.length > 0
                    ? plans[0]
                    : null

                if (!currentPlan) {
                  return (
                    <div className="text-center py-8">
                      <div className="w-12 h-12 bg-paper rounded-xl flex items-center justify-center mx-auto mb-3">
                        <BarChart3 className="w-6 h-6 text-[#D4C8BC]" />
                      </div>
                      <p className="text-xs text-ink-muted mb-3">暂无关联的写作筹谋</p>
                      <CreatePlanInline
                        docTitle={currentDoc?.title || '无题文稿'}
                        onCreated={(plan) => {
                          // Associate plan with current document
                          if (currentDoc) {
                            updateDocument(currentDoc.id, { planId: plan.id }).then(() => {
                              setCurrentDoc({ ...currentDoc, planId: plan.id })
                              setPlans(prev => [...prev, plan])
                            })
                          }
                        }}
                      />
                    </div>
                  )
                }

                // Get document content for progress detection
                const docContent = currentDoc?.content || ''
                const plainContent = docContent.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim()

                const completedTasks = currentPlan.tasks.filter(task => {
                  if (task.status === 'completed') return true
                  // Check if document contains task keywords
                  const keywords = task.title.split(/[，,、\s]+/).filter(w => w.length >= 2)
                  return keywords.some(keyword => plainContent.includes(keyword))
                })

                const progressPercent = currentPlan.tasks.length > 0
                  ? Math.round((completedTasks.length / currentPlan.tasks.length) * 100)
                  : 0

                return (
                  <div className="space-y-3">
                    {/* Plan info */}
                    <div className="p-3 bg-paper rounded-lg border border-border-light">
                      <h4 className="text-xs font-semibold text-ink mb-1">{currentPlan.title}</h4>
                      {currentPlan.description && (
                        <p className="text-[10px] text-ink-muted leading-relaxed">{currentPlan.description}</p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <div className="flex-1 h-1.5 bg-border rounded-full overflow-hidden">
                          <div
                            className="h-full bg-ochre rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <span className="text-[10px] text-ink-muted font-medium">{progressPercent}%</span>
                      </div>
                      <div className="flex items-center gap-3 mt-1.5 text-[10px] text-ink-muted">
                        <span className="text-green-600">{completedTasks.length} 已完成</span>
                        <span>{currentPlan.tasks.length - completedTasks.length} 待完成</span>
                      </div>
                    </div>

                    {/* Task list */}
                    <div>
                      <h5 className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider mb-2">
                        任务列表
                      </h5>
                      <div className="space-y-1.5">
                        {currentPlan.tasks
                          .sort((a, b) => a.orderNum - b.orderNum)
                          .map(task => {
                            const isCompleted = completedTasks.some(t => t.id === task.id)
                            const isActive = task.status === 'in_progress'

                            return (
                              <div
                                key={task.id}
                                className={`p-2.5 rounded-lg text-xs flex items-start gap-2 ${isCompleted
                                  ? 'bg-green-50 border border-green-100'
                                  : isActive
                                    ? 'bg-amber-50 border border-amber-100'
                                    : 'bg-white border border-border'
                                  }`}
                              >
                                <div
                                  className={`w-4 h-4 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${isCompleted
                                    ? 'bg-green-100'
                                    : isActive
                                      ? 'bg-amber-100'
                                      : 'bg-gray-100'
                                    }`}
                                >
                                  {isCompleted ? (
                                    <CheckCircle2 className="w-3 h-3 text-green-600" />
                                  ) : isActive ? (
                                    <Circle className="w-3 h-3 text-amber-500" />
                                  ) : (
                                    <Circle className="w-3 h-3 text-gray-300" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-ink leading-relaxed ${isCompleted ? 'line-through opacity-60' : ''}`}>
                                    {task.title}
                                  </p>
                                  {task.description && (
                                    <p className="text-[10px] text-ink-muted mt-0.5 truncate">{task.description}</p>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  </div>
                )
              })()}
            </div>
          </div>
        )}

        {/* Pomodoro Timer Panel */}
        {showPomodoroPanel && (
          <div className="w-[280px] border-r border-border bg-paper flex flex-col h-full flex-shrink-0">
            <div className="flex items-center justify-between px-4 py-3 border-b border-ochre/10">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Timer className="w-4 h-4 text-cinnabar" />
                <span className="font-display text-cinnabar">番茄钟</span>
              </div>
              <button
                onClick={() => setShowPomodoroPanel(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-ochre/5 rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4">
              <PomodoroTimer
                onSessionComplete={(minutes) => {
                  console.log(`Completed ${minutes} minute session`)
                }}
              />
            </div>
          </div>
        )}

        {/* Editor area */}
        <div className="flex-1 relative flex flex-col min-h-0">
          <ChineseBorder className="flex-1 m-2 flex flex-col min-h-0 bg-white" showCorners={true}>
            <EditorMain
              content={currentDoc?.content || ''}
              onUpdate={handleContentUpdate}
              onReady={handleEditorReady}
              zoomLevel={zoomLevel}
              pageMode={pageMode}
            />
          </ChineseBorder>

          {/* Comment selection popup */}
          {hasSelection && commentSelection && (
            <div
              className="absolute z-50 bg-white border border-border rounded-lg shadow-lg p-2 flex items-center gap-2"
              style={{
                top: '10px',
                right: '10px',
              }}
            >
              <span className="text-xs text-ink-muted max-w-[150px] truncate">
                选中 {commentSelection.text.length} 字
              </span>
              <button
                onClick={() => setShowCommentsPanel(true)}
                className="px-2.5 py-1.5 bg-ochre text-white text-xs rounded-md hover:bg-ink transition-colors flex items-center gap-1"
              >
                <MessageSquare className="w-3 h-3" />
                添加评注
              </button>
            </div>
          )}
        </div>

        {/* Comments Panel */}
        {showCommentsPanel && (
          <div className="w-[280px] border-l border-border bg-white flex flex-col h-full flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-paper">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <MessageSquare className="w-4 h-4 text-ochre" />
                同侪评注
              </div>
              <button
                onClick={() => setShowCommentsPanel(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Add comment */}
            <div className="px-3 py-3 border-b border-border">
              {commentSelection ? (
                <div className="space-y-2">
                  <div className="text-[10px] text-ink-muted bg-paper-dark px-2 py-1 rounded truncate">
                    选中：{commentSelection.text.slice(0, 30)}{commentSelection.text.length > 30 ? '...' : ''}
                  </div>
                  <textarea
                    value={newCommentText}
                    onChange={e => setNewCommentText(e.target.value)}
                    placeholder="输入评注..."
                    rows={2}
                    className="w-full px-2.5 py-2 text-xs border border-border rounded-lg focus:outline-none focus:border-ochre resize-none"
                  />
                  <button
                    onClick={handleAddComment}
                    disabled={!newCommentText.trim()}
                    className="w-full py-1.5 bg-ochre text-white text-xs rounded-md hover:bg-ink transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
                  >
                    <Send className="w-3 h-3" />
                    发表评注
                  </button>
                </div>
              ) : (
                <p className="text-xs text-ink-muted text-center py-2">选中文本以添加评注</p>
              )}
            </div>

            {/* Comments list */}
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {comments.length === 0 ? (
                <div className="text-center py-8">
                  <MessageSquare className="w-8 h-8 text-[#D4C8BC] mx-auto mb-2" />
                  <p className="text-xs text-ink-muted">暂无评注</p>
                </div>
              ) : (
                comments.map(comment => (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-lg border text-xs ${comment.resolved
                      ? 'bg-gray-50 border-gray-200 opacity-60'
                      : 'bg-white border-border'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-1.5">
                        <div
                          className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] text-white font-medium"
                          style={{ backgroundColor: comment.authorColor }}
                        >
                          {comment.author[0]}
                        </div>
                        <span className="font-medium text-ink">{comment.author}</span>
                        <span className="text-[10px] text-ink-light">{formatVersionTime(comment.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleResolveComment(comment.id)}
                          className="p-1 hover:bg-paper-dark rounded transition-colors"
                          title={comment.resolved ? '标记为未解决' : '标记为已解决'}
                        >
                          {comment.resolved ? (
                            <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                          ) : (
                            <Circle className="w-3.5 h-3.5 text-ink-light" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteComment(comment.id)}
                          className="p-1 hover:bg-red-50 rounded transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-ink-light hover:text-red-500" />
                        </button>
                      </div>
                    </div>
                    <div className="text-[10px] text-ink-muted bg-paper-dark px-2 py-1 rounded mb-1.5 truncate">
                      {comment.selectedText}
                    </div>
                    <p className="text-ink leading-relaxed">{comment.text}</p>

                    {/* Replies */}
                    {comment.replies.length > 0 && (
                      <div className="mt-2 space-y-1.5 pl-3 border-l-2 border-border">
                        {comment.replies.map(reply => (
                          <div key={reply.id} className="text-[11px]">
                            <span className="font-medium text-ink-secondary" style={{ color: reply.authorColor }}>
                              {reply.author}
                            </span>
                            <span className="text-ink-muted ml-1">{reply.content}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Reply input */}
                    {replyingTo === comment.id ? (
                      <div className="mt-2 flex gap-1.5">
                        <input
                          value={replyText}
                          onChange={e => setReplyText(e.target.value)}
                          placeholder="回复..."
                          className="flex-1 px-2 py-1 text-[11px] border border-border rounded focus:outline-none focus:border-ochre"
                          onKeyDown={e => {
                            if (e.key === 'Enter' && replyText.trim()) {
                              handleAddReply(comment.id)
                            }
                          }}
                        />
                        <button
                          onClick={() => handleAddReply(comment.id)}
                          disabled={!replyText.trim()}
                          className="px-2 py-1 bg-ochre text-white text-[10px] rounded hover:bg-ink transition-colors disabled:opacity-50"
                        >
                          回复
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setReplyingTo(comment.id)}
                        className="mt-2 text-[10px] text-ochre hover:text-ink flex items-center gap-1 transition-colors"
                      >
                        <Reply className="w-3 h-3" />
                        回复
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* Activities Panel */}
        {showActivitiesPanel && (
          <div className="w-[240px] border-l border-border bg-white flex flex-col h-full flex-shrink-0">
            <div className="flex items-center justify-between px-3 py-2.5 border-b border-border bg-paper">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <Activity className="w-4 h-4 text-ochre" />
                活动记录
              </div>
              <button
                onClick={() => setShowActivitiesPanel(false)}
                className="p-1 text-ink-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {activities.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="w-8 h-8 text-[#D4C8BC] mx-auto mb-2" />
                  <p className="text-xs text-ink-muted">暂无活动记录</p>
                </div>
              ) : (
                activities.map(activity => (
                  <div key={activity.id} className="flex items-start gap-2 text-xs">
                    <div className="w-5 h-5 rounded-full bg-ochre-bg flex items-center justify-center flex-shrink-0 mt-0.5">
                      <User className="w-3 h-3 text-ochre" />
                    </div>
                    <div>
                      <p className="text-ink">
                        <span className="font-medium">{activity.author}</span>
                        <span className="text-ink-secondary ml-1">{activity.action}</span>
                      </p>
                      <p className="text-[10px] text-ink-light">{formatActivityTime(activity.timestamp)}</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* AI Writing Assistant Panel */}
        <AIAssistantPanel
          isOpen={aiPanelOpen}
          onClose={() => setAiPanelOpen(false)}
          onInsertText={handleInsertSuggestion}
        />
      </div>

      {/* Status bar */}
      <EditorStatusBar
        wordCount={wordCount}
        charCount={charCount}
        paragraphCount={paragraphCount}
        saveStatus={saveStatus}
        lastSaved={lastSaved}
        zoomLevel={zoomLevel}
        onZoomChange={setZoomLevel}
      />

      {/* Version History Panel */}
      {showVersionPanel && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/20"
            onClick={() => {
              setShowVersionPanel(false)
              setSelectedVersion(null)
              setPreviewContent('')
            }}
          />
          {/* Panel */}
          <div className="relative w-[320px] bg-white border-l border-border shadow-xl flex flex-col h-full animate-in slide-in-from-right duration-300">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-paper">
              <div className="flex items-center gap-2 text-sm font-semibold text-ink">
                <History className="w-4 h-4 text-ochre" />
                版本留影
              </div>
              <button
                onClick={() => {
                  setShowVersionPanel(false)
                  setSelectedVersion(null)
                  setPreviewContent('')
                }}
                className="p-1 text-ink-muted hover:text-ink hover:bg-paper-dark rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Version list */}
            <div className="flex-1 overflow-y-auto">
              {versions.length === 0 ? (
                <div className="text-center py-12 px-4">
                  <div className="w-12 h-12 bg-paper rounded-xl flex items-center justify-center mx-auto mb-3">
                    <History className="w-6 h-6 text-[#D4C8BC]" />
                  </div>
                  <p className="text-sm text-ink-muted">暂无版本留影</p>
                  <p className="text-xs text-ink-light mt-1">保存文稿后将自动创建版本留影</p>
                </div>
              ) : (
                <div className="p-3 space-y-2">
                  {versions.map((version, index) => (
                    <div
                      key={version.id}
                      onClick={() => handleVersionClick(version)}
                      className={`group p-3 rounded-lg border cursor-pointer transition-all ${selectedVersion?.id === version.id
                        ? 'bg-ochre-bg border-ochre-light'
                        : 'bg-white border-border hover:border-ochre-light hover:shadow-sm'
                        }`}
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-xs font-medium text-ink">
                          版本 {versions.length - index}
                        </span>
                        <span className="text-[10px] text-ink-muted">
                          {formatVersionTime(version.timestamp)}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-[10px] text-ink-muted">
                        <span className="flex items-center gap-1">
                          <Type className="w-3 h-3" />
                          {version.wordCount} 字
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {version.author}
                        </span>
                      </div>
                      {selectedVersion?.id === version.id && (
                        <div className="mt-2 pt-2 border-t border-border/50">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRestoreVersion(version)
                            }}
                            className="w-full py-1.5 px-2 bg-ochre text-white text-[10px] rounded-md hover:bg-ink transition-colors flex items-center justify-center gap-1.5"
                          >
                            <RotateCcw className="w-3 h-3" />
                            恢复此版本
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Preview area */}
            {selectedVersion && (
              <div className="border-t border-border bg-paper p-3 max-h-[200px] overflow-y-auto">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[10px] font-semibold text-ink-muted uppercase tracking-wider">
                    版本预览
                  </span>
                  <span className="text-[10px] text-ink-muted">
                    {selectedVersion.wordCount} 字
                  </span>
                </div>
                <div
                  className="text-[11px] text-ink-secondary leading-relaxed line-clamp-6"
                  dangerouslySetInnerHTML={{ __html: previewContent }}
                />
              </div>
            )}

            {/* Footer info */}
            <div className="px-4 py-2 border-t border-border bg-paper">
              <p className="text-[10px] text-ink-light">
                最多保留 {MAX_VERSIONS} 个版本 · 当前 {versions.length} 个
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <Modal
          isOpen={showShareModal}
          onClose={() => setShowShareModal(false)}
          title="分享文稿"
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-ink-secondary mb-2">权限设置</label>
              <div className="flex gap-3">
                <button
                  onClick={() => setSharePermission('read')}
                  className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm transition-all ${sharePermission === 'read'
                    ? 'bg-ochre-bg border-ochre-light text-ochre'
                    : 'bg-white border-border text-ink-secondary hover:border-ochre-light'
                    }`}
                >
                  <Eye className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">只读</div>
                    <div className="text-[10px] text-ink-muted">其他人只能查看，不能编辑</div>
                  </div>
                </button>
                <button
                  onClick={() => setSharePermission('edit')}
                  className={`flex-1 flex items-center gap-2 px-4 py-3 rounded-lg border text-sm transition-all ${sharePermission === 'edit'
                    ? 'bg-ochre-bg border-ochre-light text-ochre'
                    : 'bg-white border-border text-ink-secondary hover:border-ochre-light'
                    }`}
                >
                  <EyeOff className="w-4 h-4" />
                  <div className="text-left">
                    <div className="font-medium">可编辑</div>
                    <div className="text-[10px] text-ink-muted">其他人可以查看和编辑</div>
                  </div>
                </button>
              </div>
            </div>

            {shareSettings?.enabled ? (
              <div>
                <label className="block text-sm font-medium text-ink-secondary mb-2">分享链接</label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={shareSettings.shareLink}
                    readOnly
                    className="flex-1 px-3 py-2 rounded-lg border border-border bg-paper text-sm text-ink-secondary"
                  />
                  <button
                    onClick={handleCopyShareLink}
                    className="px-4 py-2 bg-ochre text-white text-sm rounded-lg hover:bg-ink transition-colors flex items-center gap-1.5"
                  >
                    <Link2 className="w-4 h-4" />
                    复制
                  </button>
                </div>
                <p className="text-[10px] text-ink-muted mt-1.5">
                  当前权限：{shareSettings.permission === 'read' ? '只读' : '可编辑'}
                </p>
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-ink-muted mb-3">生成分享链接，邀请同侪协作</p>
                <button
                  onClick={handleGenerateShareLink}
                  className="px-5 py-2.5 bg-ochre text-white text-sm rounded-lg hover:bg-ink transition-colors flex items-center gap-2 mx-auto"
                >
                  <Link2 className="w-4 h-4" />
                  生成分享链接
                </button>
              </div>
            )}

          </div>
        </Modal>
      )}
    </div>
  )
}

// ============ Inline Create Plan Component ============

function CreatePlanInline({ docTitle, onCreated }: { docTitle: string; onCreated: (plan: Plan) => void }) {
  const [isCreating, setIsCreating] = useState(false)
  const [title, setTitle] = useState(docTitle)
  const [description, setDescription] = useState('')
  const [deadline, setDeadline] = useState('')
  const [totalWords, setTotalWords] = useState(10000)
  const [loading, setLoading] = useState(false)
  const { success, error } = useToast()

  const handleCreate = async () => {
    if (!title.trim()) {
      error('请输入筹谋标题')
      return
    }
    setLoading(true)
    try {
      const plan = await createPlan({
        title: title.trim(),
        description: description.trim() || undefined,
        deadline: deadline || undefined,
        totalWords,
      })
      success('筹谋已立')
      onCreated(plan)
      setIsCreating(false)
    } catch (e: any) {
      error(e.message || '创建未果')
    } finally {
      setLoading(false)
    }
  }

  if (!isCreating) {
    return (
      <button
        onClick={() => setIsCreating(true)}
        className="px-4 py-2 bg-ochre text-white text-xs rounded-lg hover:bg-ink transition-colors flex items-center gap-1.5 mx-auto"
      >
        <FilePlus className="w-3.5 h-3.5" />
        立筹谋
      </button>
    )
  }

  return (
    <div className="text-left space-y-3">
      <div>
        <label className="block text-[10px] text-ink-muted mb-1">筹谋标题</label>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder="例如：毕业论文写作筹谋"
          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-ochre bg-white"
        />
      </div>
      <div>
        <label className="block text-[10px] text-ink-muted mb-1">描述（可选）</label>
        <textarea
          value={description}
          onChange={e => setDescription(e.target.value)}
          placeholder="简述写作目标和内容..."
          rows={2}
          className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-ochre bg-white resize-none"
        />
      </div>
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="block text-[10px] text-ink-muted mb-1">截止日期</label>
          <input
            type="date"
            value={deadline}
            onChange={e => setDeadline(e.target.value)}
            className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-ochre bg-white"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[10px] text-ink-muted mb-1">目标字数</label>
          <input
            type="number"
            value={totalWords}
            onChange={e => setTotalWords(Number(e.target.value))}
            min={1000}
            step={1000}
            className="w-full px-2.5 py-1.5 text-xs border border-border rounded-lg focus:outline-none focus:border-ochre bg-white"
          />
        </div>
      </div>
      <div className="flex gap-2 pt-1">
        <button
          onClick={() => setIsCreating(false)}
          className="flex-1 px-3 py-1.5 text-xs text-ink-muted border border-border rounded-lg hover:bg-paper transition-colors"
        >
          作罢
        </button>
        <button
          onClick={handleCreate}
          disabled={loading || !title.trim()}
          className="flex-1 px-3 py-1.5 text-xs bg-ochre text-white rounded-lg hover:bg-ink transition-colors disabled:opacity-50 flex items-center justify-center gap-1"
        >
          {loading && <Loader2 className="w-3 h-3 animate-spin" />}
          确定
        </button>
      </div>
    </div>
  )
}
