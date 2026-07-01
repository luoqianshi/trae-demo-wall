import { useState, useRef } from 'react'
import { FileText, Image, Mic, MessageCircle, Plus } from 'lucide-react'

interface AttachmentMenuProps {
  onFileSelect: (file: File, type: 'file' | 'image' | 'audio' | 'wechat') => void
}

export function AttachmentMenu({ onFileSelect }: AttachmentMenuProps) {
  const [open, setOpen] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const audioInputRef = useRef<HTMLInputElement>(null)
  const wechatInputRef = useRef<HTMLInputElement>(null)

  const menuItems = [
    { icon: FileText, label: '文件', type: 'file' as const, ref: fileInputRef, accept: '*/*' },
    { icon: Image, label: '图片', type: 'image' as const, ref: imageInputRef, accept: 'image/*' },
    { icon: Mic, label: '录音', type: 'audio' as const, ref: audioInputRef, accept: 'audio/*' },
    { icon: MessageCircle, label: '微信记录', type: 'wechat' as const, ref: wechatInputRef, accept: '.txt,.html,.htm' },
  ]

  const handleFileChange = (type: 'file' | 'image' | 'audio' | 'wechat') => (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      onFileSelect(file, type)
      setOpen(false)
    }
    e.target.value = ''
  }

  return (
    <>
      {menuItems.map((item) => (
        <input
          key={item.type}
          ref={item.ref}
          type="file"
          accept={item.accept}
          className="hidden"
          onChange={handleFileChange(item.type)}
        />
      ))}
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center p-1.5 text-ink-tertiary hover:text-ink-secondary transition-colors flex-shrink-0"
        aria-label="附件菜单"
        aria-expanded={open}
      >
        <Plus size={20} className={`transition-transform ${open ? 'rotate-45' : ''}`} />
      </button>
      {open && (
        <div className="absolute bottom-full left-0 mb-2 z-50 p-2 bg-surface rounded-xl shadow-lg border border-ink-muted/20 flex gap-3">
          {menuItems.map(({ icon: Icon, label, type, ref }) => (
            <button
              key={type}
              onClick={() => ref.current?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-lg hover:bg-canvas-warm min-w-[48px] transition-colors"
            >
              <Icon size={20} className="text-zen-indigo" />
              <span className="text-xs text-ink-secondary">{label}</span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}
