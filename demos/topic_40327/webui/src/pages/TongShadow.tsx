import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Upload,
  Trash2,
  X,
  RefreshCw,
  Loader2,
  Image,
  Eye,
} from 'lucide-react'
import {
  fetchTongShadows,
  uploadTongShadow,
  deleteTongShadow,
  getTongShadowImageUrl,
} from '../lib/api'
import type { TongShadowItem } from '../types/api'

export function TongShadow() {
  const [items, setItems] = useState<TongShadowItem[]>([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [previewItem, setPreviewItem] = useState<TongShadowItem | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { loadItems() }, [])

  async function loadItems() {
    try {
      setLoading(true)
      const data = await fetchTongShadows()
      setItems(data.items || [])
    } catch {
      setMessage('加载自画像列表失败')
    } finally {
      setLoading(false)
    }
  }

  async function handleUpload(file: File) {
    if (!file.type.startsWith('image/')) {
      setMessage('仅支持图片文件')
      return
    }
    try {
      setUploading(true)
      setMessage('')
      await uploadTongShadow(file)
      setMessage('自画像已添加，瞳瞳记住这个形象啦～')
      await loadItems()
    } catch (err) {
      setMessage(err instanceof Error ? err.message : '上传失败')
    } finally {
      setUploading(false)
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) handleUpload(file)
  }

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleUpload(file)
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }, [])

  async function handleDelete(id: string) {
    if (!confirm('确定要删除这张自画像吗？瞳瞳将不再记得这个形象。')) return
    try {
      await deleteTongShadow(id)
      setMessage('自画像已删除')
      await loadItems()
    } catch {
      setMessage('删除失败')
    }
  }

  function truncate(str: string, maxLen: number) {
    if (str.length <= maxLen) return str
    return str.slice(0, maxLen) + '...'
  }

  return (
    <div className="aurora-bg min-h-screen space-y-6 p-6">
      {/* 标题栏 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gradient">瞳影</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            上传瞳瞳的自画像，让她认识自己的样子～支持拖拽上传
          </p>
        </div>
        <button onClick={loadItems} className="btn btn-outline" aria-label="刷新列表">
          <RefreshCw className="h-4 w-4" aria-hidden="true" />
          刷新
        </button>
      </div>

      {/* 消息提示 */}
      {message && (
        <div
          className="card card-glow-blue border-green-500/20 bg-green-500/8 p-4 text-sm text-green-700 flex items-center justify-between"
          role="alert"
        >
          <span className="font-medium">{message}</span>
          <button
            onClick={() => setMessage('')}
            aria-label="关闭提示"
            className="p-1 rounded-lg hover:bg-green-500/10 transition-colors"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      )}

      {/* 上传区域 */}
      <div className="card card-hover rounded-xl border border-border bg-muted p-5 shadow-sm">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          aria-label="选择自画像文件"
        />
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => !uploading && fileInputRef.current?.click()}
          className={`
            relative flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10
            transition-all duration-200 cursor-pointer
            ${dragOver
              ? 'border-blue-500 bg-blue-500/10 scale-[1.02]'
              : 'border-border hover:border-blue-500/50 hover:bg-surface'
            }
            ${uploading ? 'pointer-events-none opacity-60' : ''}
          `}
        >
          {uploading ? (
            <>
              <Loader2 className="h-10 w-10 animate-spin text-blue-500 mb-3" aria-hidden="true" />
              <p className="text-sm font-medium text-blue-500">正在分析外貌特征…</p>
              <p className="text-xs text-muted-foreground mt-1">VLM 正在生成描述，请稍候</p>
            </>
          ) : (
            <>
              <div className="h-16 w-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
                <Upload className="h-8 w-8 text-blue-500" aria-hidden="true" />
              </div>
              <p className="text-sm font-medium text-foreground">
                拖拽图片到此处，或点击上传
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                支持 JPG、PNG、WebP 格式
              </p>
            </>
          )}
        </div>
      </div>

      {/* 图库 */}
      <div className="card card-hover rounded-xl border-blue-500/10 overflow-hidden">
        <div className="flex items-center justify-between border-b border-blue-500/10 px-5 py-3.5">
          <span className="text-sm font-bold text-blue-500">共 {items.length} 张自画像</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-7 w-7 animate-spin text-blue-500" aria-hidden="true" />
            <span className="ml-3 text-blue-500 font-medium">正在加载...</span>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-5">
            <div className="h-24 w-24 rounded-2xl bg-muted border border-border flex items-center justify-center">
              <Image size={44} style={{ color: 'hsl(var(--primary) / 0.8)' }} aria-hidden="true" />
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-foreground mb-1">还没有自画像</p>
              <p className="text-sm text-muted-foreground">
                拖拽或点击上传瞳瞳的自画像，让她认识自己～
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 p-5">
            {items.map((item) => (
              <div
                key={item.id}
                className="group relative rounded-xl border border-border bg-surface overflow-hidden hover:border-blue-500/30 transition-all"
              >
                {/* 图片缩略图 */}
                <div
                  className="aspect-square overflow-hidden cursor-pointer"
                  onClick={() => setPreviewItem(item)}
                >
                  <img
                    src={getTongShadowImageUrl(item.id)}
                    alt="自画像"
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    loading="lazy"
                  />
                </div>

                {/* 描述摘要 */}
                <div className="p-3">
                  <p className="text-xs text-foreground leading-relaxed line-clamp-2">
                    {truncate(item.description, 80)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {new Date(item.created_at).toLocaleDateString()}
                  </p>
                </div>

                {/* 操作按钮 */}
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => { e.stopPropagation(); setPreviewItem(item) }}
                    className="rounded-lg bg-surface/90 border border-border p-1.5 hover:bg-blue-500/10 transition-colors"
                    aria-label="查看大图"
                  >
                    <Eye className="h-3.5 w-3.5 text-blue-500" aria-hidden="true" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(item.id) }}
                    className="rounded-lg bg-surface/90 border border-border p-1.5 hover:bg-red-500/10 transition-colors"
                    aria-label="删除自画像"
                  >
                    <Trash2 className="h-3.5 w-3.5" style={{ color: 'hsl(var(--accent))' }} aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 大图预览弹窗 */}
      {previewItem && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}
          onClick={() => setPreviewItem(null)}
        >
          <div
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl"
            style={{
              background: 'hsl(var(--surface))',
              border: '1px solid hsl(var(--border))',
              boxShadow: '0 25px 50px -12px rgba(0,0,0,0.3)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* 关闭按钮 */}
            <button
              onClick={() => setPreviewItem(null)}
              aria-label="关闭预览"
              className="absolute top-3 right-3 z-10 p-2 rounded-lg bg-surface/90 border border-border hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" style={{ color: 'hsl(var(--text-primary))' }} />
            </button>

            {/* 大图 */}
            <div className="aspect-square overflow-hidden rounded-t-xl">
              <img
                src={getTongShadowImageUrl(previewItem.id)}
                alt="自画像大图"
                className="w-full h-full object-contain bg-black/5"
              />
            </div>

            {/* 完整描述 */}
            <div className="p-6">
              <h3 className="text-sm font-bold text-blue-500 mb-2">外貌描述</h3>
              <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                {previewItem.description}
              </p>
              <p className="text-xs text-muted-foreground mt-3">
                创建时间：{new Date(previewItem.created_at).toLocaleString()}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}