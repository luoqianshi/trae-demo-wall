import { useState } from 'react'
import { ChevronDown, ChevronRight, Download, FileVideo, Grid2x2, Image as ImageIcon, ImageOff, Lock, Square, Trash2, Unlock, X } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { cn } from '@/lib/utils'
import { type AssetParamItem } from '../nodes/AssetNode'

function isVideoUrl(url: string) {
  const clean = url.split('?')[0].toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(clean)
}

interface AssetPropertyPanelProps {
  name: string
  urls: string[]
  displayMode: 'single' | 'multi'
  locked?: boolean
  prompt?: string
  aspectRatio?: string
  params?: AssetParamItem[]
  onRename: (name: string) => void
  onToggleMode: () => void
  onToggleLock: () => void
  onRemoveImage: (url: string) => void
  onClearAll: () => void
  onClose: () => void
}

/**
 * 图片输出节点属性面板：编辑节点命名（变量名）、锁定、展示生成提示词、宽高比、完整参数（可折叠），并提供图片管理。
 */
export function AssetPropertyPanel({
  name,
  urls,
  displayMode,
  locked,
  prompt,
  aspectRatio,
  params,
  onRename,
  onToggleMode,
  onToggleLock,
  onRemoveImage,
  onClearAll,
  onClose,
}: AssetPropertyPanelProps) {
  const isMulti = displayMode === 'multi'
  const [showParams, setShowParams] = useState(false)

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-neutral-200 bg-white">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b border-neutral-200 px-4 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
        <ImageIcon size={15} className="text-neutral-700" />
        <span className="flex-1 truncate text-sm font-semibold text-neutral-800">图片输出</span>
        <button
          onClick={onClose}
          title="关闭"
          className="flex size-6 items-center justify-center rounded-md text-neutral-400 transition-colors hover:bg-neutral-100 hover:text-neutral-700"
        >
          <X size={15} />
        </button>
      </div>

      <ScrollArea className="min-h-0 flex-1">
        <div className="space-y-4 px-4 py-4">
          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">命名（变量名）</Label>
            <Input
              value={name}
              onChange={(e) => onRename(e.target.value)}
              placeholder="如：角色A"
              className="h-8 border-neutral-200 text-xs focus-visible:ring-neutral-900/20"
            />
            <p className="text-[10px] text-neutral-400">用于标识该输出，与节点标题双向同步</p>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2">
            <div className="flex flex-col">
              <span className="text-xs font-medium text-neutral-600">锁定输出</span>
              <span className="text-[10px] text-neutral-400">锁定后再次生图将新建输出节点</span>
            </div>
            <button
              onClick={onToggleLock}
              className={cn(
                'flex items-center gap-1 rounded-md border px-2 py-1 text-xs transition-colors',
                locked
                  ? 'border-amber-300 bg-amber-50 text-amber-600 hover:bg-amber-100'
                  : 'border-neutral-200 text-neutral-500 hover:bg-neutral-100'
              )}
            >
              {locked ? <Lock size={13} /> : <Unlock size={13} />}
              {locked ? '已锁定' : '未锁定'}
            </button>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">生成提示词</Label>
            <div className="max-h-32 overflow-y-auto rounded-lg border border-neutral-200 bg-neutral-50/60 px-3 py-2 text-xs leading-relaxed text-neutral-700">
              {prompt ? prompt : <span className="text-neutral-400">暂无提示词</span>}
            </div>
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs font-medium text-neutral-600">宽高比</Label>
            <div className="rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2 text-sm font-semibold text-neutral-800">
              {aspectRatio ? aspectRatio : '-'}
            </div>
          </div>

          {params && params.length > 0 && (
            <div className="space-y-2">
              <button
                onClick={() => setShowParams((v) => !v)}
                className="flex w-full items-center gap-1 text-xs font-medium text-neutral-600 transition-colors hover:text-neutral-900"
              >
                {showParams ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
                生成参数（{params.length}）
              </button>
              {showParams && (
                <div className="space-y-1 rounded-lg border border-neutral-100 bg-neutral-50/60 px-3 py-2">
                  {params.map((p, i) => (
                    <div key={`${p.label}-${i}`} className="flex items-start justify-between gap-2 text-xs">
                      <span className="shrink-0 text-neutral-400">{p.label}</span>
                      <span className="break-all text-right font-medium text-neutral-700">{p.value || '-'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium text-neutral-600">显示模式</Label>
            <Button
              onClick={onToggleMode}
              size="sm"
              variant="outline"
              disabled={urls.length <= 1}
              className="h-7 border-neutral-200 text-xs text-neutral-600"
            >
              {isMulti ? <Grid2x2 size={13} className="mr-1" /> : <Square size={13} className="mr-1" />}
              {isMulti ? '多图平铺' : '单图显示'}
            </Button>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-medium text-neutral-600">素材列表（{urls.length}）</Label>
              {urls.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`确定清空全部 ${urls.length} 张素材？此操作会删除服务器上的文件，且不可撤销。`)) {
                      onClearAll()
                    }
                  }}
                  className="flex items-center gap-1 rounded-md border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] text-red-600 transition-colors hover:bg-red-100"
                  title="清空所有素材（含服务器文件）"
                >
                  <Trash2 size={11} />
                  清空全部
                </button>
              )}
            </div>
            {urls.length === 0 ? (
              <div className="flex h-24 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-neutral-200 text-neutral-300">
                <ImageOff size={22} />
                <span className="text-[11px]">暂无素材</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {urls.map((url) => {
                  const isVideo = isVideoUrl(url)
                  return (
                    <div key={url} className="group relative overflow-hidden rounded-lg border border-neutral-100 bg-neutral-50">
                      {isVideo ? (
                        <div className="relative flex aspect-square w-full items-center justify-center bg-neutral-900/90 text-white/80">
                          <video
                            src={url}
                            muted
                            playsInline
                            preload="metadata"
                            className="absolute inset-0 h-full w-full object-cover opacity-70"
                          />
                          <FileVideo size={22} className="relative z-10 drop-shadow" />
                        </div>
                      ) : (
                        <img src={url} alt={name} className="aspect-square w-full object-cover" />
                      )}
                      <div className="absolute right-1.5 top-1.5 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <a
                          href={url}
                          download
                          target="_blank"
                          rel="noreferrer"
                          className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm"
                          title="下载"
                        >
                          <Download size={12} />
                        </a>
                        <button
                          onClick={() => onRemoveImage(url)}
                          className="flex size-6 items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-red-500"
                          title="删除本地素材"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </ScrollArea>
    </aside>
  )
}
