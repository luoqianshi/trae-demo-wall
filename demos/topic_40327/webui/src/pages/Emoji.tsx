import { useState, useEffect } from 'react'
import {
  Trash2,
  RefreshCw,
  Loader2,
  Image,
  Search,
  Filter,
  Eye,
  Hash,
  FileText,
  Tag,
  BarChart3,
  CircleDot,
  FolderOpen,
} from 'lucide-react'
import {
  fetchEmojiList,
  deleteEmoji,
  cleanupEmojis,
} from '../lib/api'
import type { EmojiItem } from '../lib/api'
import { Card, CardContent } from '../components/ui/card'
import { Button } from '../components/ui/button'
import { Badge } from '../components/ui/badge'
import { Input } from '../components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '../components/ui/dialog'

export function Emoji() {
  const [emojis, setEmojis] = useState<EmojiItem[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [messageType, setMessageType] = useState<'success' | 'error'>('success')
  const [deleting, setDeleting] = useState<string | null>(null)
  const [cleaning, setCleaning] = useState(false)
  const [filter, setFilter] = useState<'all' | 'registered' | 'unregistered'>('all')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedEmoji, setSelectedEmoji] = useState<EmojiItem | null>(null)

  useEffect(() => { loadEmojis() }, [])

  async function loadEmojis() {
    try {
      setLoading(true)
      const data = await fetchEmojiList()
      setEmojis(data.emojis || [])
      setTotal(data.count || 0)
      setMessage('')
    } catch {
      showMessage('加载表情包列表失败', 'error')
    } finally {
      setLoading(false)
    }
  }

  async function handleDelete(hash: string) {
    if (!confirm('确定要删除这个表情包吗？会同时清理存储文件和数据库记录。')) return
    try {
      setDeleting(hash)
      await deleteEmoji(hash)
      showMessage('已删除表情包并清理存储文件', 'success')
      loadEmojis()
    } catch {
      showMessage('删除失败', 'error')
    } finally {
      setDeleting(null)
    }
  }

  async function handleCleanup() {
    if (!confirm('确定要运行清理吗？会检查文件完整性、清理孤儿文件和淘汰过期表情包。')) return
    try {
      setCleaning(true)
      const data = await cleanupEmojis()
      showMessage(`清理完成，移除了 ${data.removed} 个表情包`, 'success')
      loadEmojis()
    } catch {
      showMessage('清理失败', 'error')
    } finally {
      setCleaning(false)
    }
  }

  function showMessage(msg: string, type: 'success' | 'error') {
    setMessage(msg)
    setMessageType(type)
    setTimeout(() => setMessage(''), 3000)
  }

  const filtered = emojis.filter(e => {
    if (filter === 'registered' && !e.is_registered) return false
    if (filter === 'unregistered' && e.is_registered) return false
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      return (
        e.hash.toLowerCase().includes(term) ||
        e.description.toLowerCase().includes(term) ||
        e.emotions.some(em => em.toLowerCase().includes(term))
      )
    }
    return true
  })

  const registeredCount = emojis.filter(e => e.is_registered).length

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* 页头 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: 'hsl(var(--text-primary))' }}>表情包管理</h1>
          <p className="text-sm mt-1" style={{ color: 'hsl(var(--text-muted))' }}>
            共 {total} 个（已入库 {registeredCount} 个，待入库 {total - registeredCount} 个）
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={handleCleanup}
            disabled={cleaning}
          >
            {cleaning ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            {cleaning ? '清理中...' : '一键清理'}
          </Button>
          <Button
            onClick={loadEmojis}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
            刷新
          </Button>
        </div>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className="px-4 py-2 rounded-lg text-sm font-medium"
          style={{
            background: messageType === 'success' ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--destructive) / 0.1)',
            color: messageType === 'success' ? 'hsl(var(--success))' : 'hsl(var(--destructive))',
          }}
        >
          {message}
        </div>
      )}

      {/* 搜索和筛选 */}
      <div className="flex items-center gap-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'hsl(var(--text-muted))' }} />
          <Input
            type="text"
            placeholder="搜索标签、描述..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg p-0.5" style={{ background: 'hsl(var(--surface-elevated))', border: '1px solid hsl(var(--border))' }}>
          <Filter className="h-4 w-4 ml-2" style={{ color: 'hsl(var(--text-muted))' }} />
          {(['all', 'registered', 'unregistered'] as const).map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-all"
              style={{
                background: filter === f ? 'hsl(var(--primary))' : 'transparent',
                color: filter === f ? 'white' : 'hsl(var(--text-secondary))',
              }}
            >
              {f === 'all' ? '全部' : f === 'registered' ? '已入库' : '待入库'}
            </button>
          ))}
        </div>
      </div>

      {/* 表情包卡片网格 */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'hsl(var(--primary))' }} />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20" style={{ color: 'hsl(var(--text-muted))' }}>
          <Image className="h-12 w-12 mb-3 opacity-30" />
          <p className="text-sm">暂无表情包</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 stagger">
          {filtered.map(emoji => (
            <Card key={emoji.hash} className="card-hover flex flex-col overflow-hidden">
              {/* 缩略图 */}
              <div
                className="relative w-full aspect-square flex items-center justify-center overflow-hidden"
                style={{ background: 'hsl(var(--surface-hover))' }}
              >
                <img
                  src={`/api/emoji/file?hash=${encodeURIComponent(emoji.hash)}`}
                  alt={emoji.description || emoji.file_name}
                  className="w-full h-full object-cover"
                  loading="lazy"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
                <Image
                  className="h-10 w-10"
                  style={{ color: 'hsl(var(--text-muted))', display: 'none' }}
                />
              </div>

              {/* 卡片内容 */}
              <CardContent className="flex flex-col gap-2 flex-1">
                {/* 文件名 */}
                <p
                  className="text-xs font-mono truncate"
                  style={{ color: 'hsl(var(--text-secondary))' }}
                  title={emoji.file_name}
                >
                  {emoji.file_name}
                </p>

                {/* 情感标签 */}
                <div className="flex flex-wrap gap-1 min-h-[20px]">
                  {emoji.emotions.length > 0 ? (
                    emoji.emotions.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="primary">{tag}</Badge>
                    ))
                  ) : (
                    <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>未标记</span>
                  )}
                  {emoji.emotions.length > 3 && (
                    <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
                      +{emoji.emotions.length - 3}
                    </span>
                  )}
                </div>

                {/* 底部操作栏 */}
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-[hsl(var(--border)/0.3)]">
                  <span
                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                    style={{
                      background: emoji.is_registered ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--warning) / 0.1)',
                      color: emoji.is_registered ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                    }}
                  >
                    {emoji.is_registered ? '已入库' : '待入库'}
                  </span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedEmoji(emoji)}
                      title="查看详细"
                      style={{ color: 'hsl(var(--text-secondary))' }}
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleDelete(emoji.hash)}
                      disabled={deleting === emoji.hash}
                      title="删除"
                      style={{ color: 'hsl(var(--destructive))' }}
                    >
                      {deleting === emoji.hash ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* 详情弹窗 */}
      <Dialog open={!!selectedEmoji} onOpenChange={() => setSelectedEmoji(null)}>
        {selectedEmoji && (
          <DialogContent>
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>表情包详情</DialogTitle>
                <DialogClose onClick={() => setSelectedEmoji(null)} />
              </div>
            </DialogHeader>
            <div className="px-5 py-4 space-y-4">
              {/* 大图预览 */}
              <div
                className="w-full aspect-video rounded-lg flex items-center justify-center overflow-hidden"
                style={{ background: 'hsl(var(--surface-hover))' }}
              >
                <img
                  src={`/api/emoji/file?hash=${encodeURIComponent(selectedEmoji.hash)}`}
                  alt={selectedEmoji.description || selectedEmoji.file_name}
                  className="max-w-full max-h-full object-contain"
                  onError={(e) => {
                    const target = e.currentTarget
                    target.style.display = 'none'
                    const placeholder = target.nextElementSibling as HTMLElement
                    if (placeholder) placeholder.style.display = 'flex'
                  }}
                />
                <Image
                  className="h-12 w-12"
                  style={{ color: 'hsl(var(--text-muted))', display: 'none' }}
                />
              </div>

              {/* 详细信息 */}
              <div className="space-y-3">
                {/* Hash */}
                <div className="flex items-start gap-3">
                  <Hash className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>Hash</p>
                    <p className="text-sm font-mono break-all" style={{ color: 'hsl(var(--text-primary))' }}>
                      {selectedEmoji.hash}
                    </p>
                  </div>
                </div>

                {/* 描述 */}
                <div className="flex items-start gap-3">
                  <FileText className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>描述</p>
                    <p className="text-sm" style={{ color: 'hsl(var(--text-primary))' }}>
                      {selectedEmoji.description || '无描述'}
                    </p>
                  </div>
                </div>

                {/* 情感标签 */}
                <div className="flex items-start gap-3">
                  <Tag className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="min-w-0">
                    <p className="text-xs mb-1" style={{ color: 'hsl(var(--text-muted))' }}>情感标签</p>
                    <div className="flex flex-wrap gap-1">
                      {selectedEmoji.emotions.length > 0 ? (
                        selectedEmoji.emotions.map(tag => (
                          <Badge key={tag} variant="primary">{tag}</Badge>
                        ))
                      ) : (
                        <span className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>未标记</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* 使用次数 */}
                <div className="flex items-start gap-3">
                  <BarChart3 className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>使用次数</p>
                    <p className="text-sm font-semibold" style={{ color: 'hsl(var(--text-primary))' }}>
                      {selectedEmoji.query_count}
                    </p>
                  </div>
                </div>

                {/* 状态 */}
                <div className="flex items-start gap-3">
                  <CircleDot className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>状态</p>
                    <span
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        background: selectedEmoji.is_registered ? 'hsl(var(--success) / 0.1)' : 'hsl(var(--warning) / 0.1)',
                        color: selectedEmoji.is_registered ? 'hsl(var(--success))' : 'hsl(var(--warning))',
                      }}
                    >
                      {selectedEmoji.is_registered ? '已入库' : '待入库'}
                    </span>
                  </div>
                </div>

                {/* 文件路径 */}
                <div className="flex items-start gap-3">
                  <FolderOpen className="h-4 w-4 mt-0.5 flex-shrink-0" style={{ color: 'hsl(var(--text-muted))' }} />
                  <div className="min-w-0">
                    <p className="text-xs" style={{ color: 'hsl(var(--text-muted))' }}>文件路径</p>
                    <p className="text-sm font-mono text-xs break-all" style={{ color: 'hsl(var(--text-secondary))' }}>
                      ./data/emoji/{selectedEmoji.file_name}
                    </p>
                  </div>
                </div>
              </div>

              {/* 底部操作 */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[hsl(var(--border)/0.5)]">
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => {
                    setSelectedEmoji(null)
                    handleDelete(selectedEmoji.hash)
                  }}
                  disabled={deleting === selectedEmoji.hash}
                >
                  {deleting === selectedEmoji.hash ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                  删除
                </Button>
              </div>
            </div>
          </DialogContent>
        )}
      </Dialog>

      {/* 底部统计 */}
      <div className="flex items-center gap-6 text-xs" style={{ color: 'hsl(var(--text-muted))' }}>
        <span>显示 {filtered.length} / {total} 个</span>
        <span>·</span>
        <span>表情包存储在 ./data/emoji/ 目录</span>
        <span>·</span>
        <span>数据库表: emojis (SQLite)</span>
      </div>
    </div>
  )
}