'use client'

import { useState, useRef } from 'react'
import { Upload, FileText, X, Loader2 } from 'lucide-react'
import { uploadDocument } from '../../../../lib/editor-api'
import type { Document } from '../../../../lib/editor-types'

interface DocumentUploadProps {
  onUploadComplete: (doc: Document) => void
}

export default function DocumentUpload({ onUploadComplete }: DocumentUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFile = async (file: File) => {
    if (!file.name.match(/\.(docx?|DOCX?)$/)) {
      setError('不支持此格式')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      setError('文件不可超过 10MB')
      return
    }

    setUploading(true)
    setError(null)
    try {
      const doc = await uploadDocument(file)
      onUploadComplete(doc)
    } catch (e: any) {
      setError(e.message || '上传未果')
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleFile(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  return (
    <div className="space-y-2">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-ochre bg-ochre-bg'
            : 'border-border hover:border-ochre-light hover:bg-paper'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".doc,.docx"
          onChange={handleInputChange}
          className="hidden"
        />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 text-ochre animate-spin" />
            <p className="text-xs text-ink-muted">正在解析文稿...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Upload className="w-6 h-6 text-ink-light" />
            <p className="text-xs text-ink-muted">拖拽文件至此，或点击选择</p>
            <p className="text-[10px] text-ink-light">支持 .docx 格式，最大 10MB</p>
          </div>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-1.5 text-xs text-red-600 bg-red-50 p-2 rounded-lg">
          <X className="w-3 h-3 flex-shrink-0" />
          {error}
        </div>
      )}
    </div>
  )
}
