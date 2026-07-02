'use client'

import { useState } from 'react'
import {
  FileText,
  Clock,
  Type,
  AlignLeft,
  ZoomIn,
  ZoomOut,
  CheckCircle2,
  Loader2,
  AlertCircle,
  BookOpen,
  ChevronDown,
  Sparkles,
} from 'lucide-react'

interface EditorStatusBarProps {
  wordCount: number
  charCount: number
  paragraphCount: number
  saveStatus: 'saved' | 'saving' | 'unsaved'
  lastSaved: string | null
  zoomLevel?: number
  onZoomChange?: (zoom: number) => void
}

export default function EditorStatusBar({
  wordCount,
  charCount,
  paragraphCount,
  saveStatus,
  lastSaved,
  zoomLevel = 100,
  onZoomChange,
}: EditorStatusBarProps) {
  const [showZoomMenu, setShowZoomMenu] = useState(false)

  const zoomOptions = [50, 75, 100, 125, 150, 200]

  const handleZoom = (zoom: number) => {
    onZoomChange?.(zoom)
    setShowZoomMenu(false)
  }

  // Estimate page count (rough estimate: ~300 words per page)
  const pageCount = Math.max(1, Math.ceil(wordCount / 300))

  return (
    <div className="relative flex items-center justify-between px-4 py-1.5 liquid-glass-dark border-t border-ochre/10 text-xs text-ink-muted">
      {/* Ink divider at top */}
      <div className="absolute top-0 left-0 right-0 ink-divider" />
      {/* Left: Document stats */}
      <div className="flex items-center">
        <span className="flex items-center gap-1.5 px-3">
          <BookOpen className="w-3 h-3 text-ink-muted" />
          <span className="font-medium text-ink-secondary">{pageCount}</span>
          <span>页</span>
        </span>
        <div className="w-px h-3 bg-gradient-to-b from-transparent via-ochre/15 to-transparent" />
        <span className="flex items-center gap-1.5 px-3">
          <Type className="w-3 h-3 text-ink-muted" />
          <span className="font-medium text-ink-secondary">{wordCount.toLocaleString()}</span>
          <span>字</span>
        </span>
        <div className="w-px h-3 bg-gradient-to-b from-transparent via-ochre/15 to-transparent" />
        <span className="flex items-center gap-1.5 px-3">
          <FileText className="w-3 h-3 text-ink-muted" />
          <span className="font-medium text-ink-secondary">{charCount.toLocaleString()}</span>
          <span>字符</span>
        </span>
        <div className="w-px h-3 bg-gradient-to-b from-transparent via-ochre/15 to-transparent" />
        <span className="flex items-center gap-1.5 px-3">
          <AlignLeft className="w-3 h-3 text-ink-muted" />
          <span className="font-medium text-ink-secondary">{paragraphCount}</span>
          <span>段落</span>
        </span>
      </div>

      {/* Center: Save status */}
      <div className="flex items-center gap-3">
        {lastSaved && (
          <span className="flex items-center gap-1 text-ink-muted">
            <Clock className="w-3 h-3" />
            上次保存 {lastSaved}
          </span>
        )}
        <span
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium ${
            saveStatus === 'saved'
              ? 'bg-green-500/10 text-green-600'
              : saveStatus === 'saving'
                ? 'bg-ochre/10 text-ochre'
                : 'bg-cinnabar/10 text-cinnabar'
          }`}
        >
          {saveStatus === 'saved' && <CheckCircle2 className="w-3 h-3" />}
          {saveStatus === 'saving' && (
            <>
              <Sparkles className="w-3 h-3 animate-pulse" />
              <Loader2 className="w-3 h-3 animate-spin" />
            </>
          )}
          {saveStatus === 'unsaved' && <AlertCircle className="w-3 h-3" />}
          {saveStatus === 'saved' ? '已存' : saveStatus === 'saving' ? '存档中...' : '未存'}
        </span>
      </div>

      {/* Right: Zoom control */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleZoom(Math.max(50, zoomLevel - 10))}
          className="p-1 text-ink-muted hover:text-ink-secondary hover:bg-ochre/5 rounded-[8px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          title="缩小"
        >
          <ZoomOut className="w-3 h-3" />
        </button>

        <div className="relative">
          <button
            onClick={() => setShowZoomMenu(!showZoomMenu)}
            className="flex items-center gap-1 px-2 py-0.5 text-ink-secondary hover:bg-ochre/5 rounded-[8px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          >
            <span className="font-medium">{zoomLevel}%</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {showZoomMenu && (
            <div className="absolute bottom-full right-0 mb-1.5 liquid-glass rounded-[14px] shadow-lg z-50 py-1 min-w-[80px]">
              {zoomOptions.map((zoom) => (
                <button
                  key={zoom}
                  onClick={() => handleZoom(zoom)}
                  className={`w-full text-left px-3 py-1.5 text-xs transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)] ${
                    zoom === zoomLevel
                      ? 'text-ochre bg-ochre/5 font-medium'
                      : 'text-ink hover:bg-ochre/5'
                  }`}
                >
                  {zoom}%
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => handleZoom(Math.min(200, zoomLevel + 10))}
          className="p-1 text-ink-muted hover:text-ink-secondary hover:bg-ochre/5 rounded-[8px] transition-all duration-[250ms] ease-[cubic-bezier(0.32,0.72,0,1)]"
          title="放大"
        >
          <ZoomIn className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
