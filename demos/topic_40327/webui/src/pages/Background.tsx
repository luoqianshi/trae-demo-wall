import { useState, useEffect, useRef, useCallback } from 'react'
import { Upload, Trash2, Image, Check, Loader2 } from 'lucide-react'
import { fetchBackgrounds, uploadBackground, deleteBackground, selectBackground } from '../lib/api'
import type { BackgroundItem } from '../lib/api'

export function Background() {
  const [backgrounds, setBackgrounds] = useState<BackgroundItem[]>([])
  const [selectedID, setSelectedID] = useState('')
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      const data = await fetchBackgrounds()
      if (data.success) {
        setBackgrounds(data.backgrounds || [])
        setSelectedID(data.selected || '')
      }
    } catch {
      setMessage('加载背景列表失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { load() }, [load])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    try {
      setUploading(true)
      const result = await uploadBackground(file)
      if (result.success && result.background) {
        setBackgrounds(prev => [result.background!, ...prev])
        setMessage('背景已上传')
      } else {
        setMessage(result.error || '上传失败')
      }
    } catch {
      setMessage('上传失败')
    } finally {
      setUploading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteBackground(id)
      setBackgrounds(prev => prev.filter(b => b.id !== id))
      if (selectedID === id) setSelectedID('')
      setMessage('已删除')
    } catch {
      setMessage('删除失败')
    }
  }

  async function handleSelect(id: string) {
    try {
      await selectBackground(id)
      setSelectedID(id)
      // 通知 Layout 实时更新背景
      let url = ''
      if (id) {
        // 同时更新 backgrounds 中的 URL（刚上传的可能还没更新列表）
        const found = backgrounds.find(b => b.id === id)
        url = found?.url || `/api/backgrounds/file/${encodeURIComponent(id)}`
      }
      window.dispatchEvent(new CustomEvent('bg-change', { detail: { url } }))
    } catch {
      setMessage('设置失败')
    }
  }

  return (
    <div className="min-h-screen aurora-bg space-y-6 p-6 pb-12">
      {/* 头部 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/20 to-pink-400/20">
              <Image className="h-6 w-6 text-primary" aria-hidden="true" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-gradient">背景设置</h1>
              <p className="text-sm text-muted-foreground">自定义控制台全局背景图片</p>
            </div>
          </div>
          <div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="btn btn-accent"
            >
              {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {uploading ? '上传中…' : '添加背景'}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleUpload}
              className="hidden"
            />
          </div>
        </div>
        <div className="h-1 rounded-full bg-gradient-to-r from-blue-400 via-primary to-accent" />
      </div>

      {message && (
        <div className="flex items-center justify-between card rounded-xl px-4 py-3 text-sm" role="alert">
          <span>{message}</span>
          <button onClick={() => setMessage('')} className="text-muted-foreground hover:text-foreground">&times;</button>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          <Loader2 className="h-6 w-6 animate-spin" />
        </div>
      ) : backgrounds.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground card rounded-2xl p-8">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400/10 to-pink-400/10 mb-5">
            <Image size={32} className="text-primary/40" aria-hidden="true" />
          </div>
          <p className="text-sm font-semibold text-foreground/60">暂无背景图片</p>
          <p className="text-xs mt-1.5 text-muted-foreground/70">点击上方「添加背景」上传图片</p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* 不使用背景选项 */}
          <button
            onClick={() => handleSelect('')}
            className={`w-full card rounded-2xl p-4 flex items-center gap-4 transition-all duration-150 hover:shadow-md ${
              selectedID === '' ? 'ring-2 ring-primary bg-primary/5' : ''
            }`}
          >
            <div className="flex h-16 w-24 items-center justify-center rounded-xl bg-muted border-2 border-dashed border-muted-foreground/30">
              <span className="text-xs text-muted-foreground">无背景</span>
            </div>
            <span className="flex-1 text-left font-medium">不使用背景</span>
            {selectedID === '' && (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-white">
                <Check className="h-4 w-4" />
              </div>
            )}
          </button>

          {/* 已有背景 */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {backgrounds.map(bg => (
              <div
                key={bg.id}
                className={`group relative card rounded-xl overflow-hidden cursor-pointer transition-all duration-150 hover:shadow-lg ${
                  selectedID === bg.id ? 'ring-2 ring-primary' : ''
                }`}
              >
                <div
                  className="aspect-video bg-cover bg-center"
                  style={{ backgroundImage: `url(${bg.url})` }}
                  onClick={() => handleSelect(bg.id)}
                />
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2 flex items-center justify-between">
                  <span className="text-xs text-white truncate flex-1">{bg.name}</span>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(bg.id) }}
                    className="ml-1 rounded-full p-1 text-white/70 hover:text-red-400 hover:bg-white/20 transition-colors opacity-0 group-hover:opacity-100"
                    title="删除"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
                {selectedID === bg.id && (
                  <div className="absolute top-2 right-2 flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white shadow">
                    <Check className="h-3.5 w-3.5" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}