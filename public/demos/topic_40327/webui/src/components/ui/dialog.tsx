import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface DialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  children: ReactNode
}

export function Dialog({ open, onOpenChange, children }: DialogProps) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [open])

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false)
    }
    if (open) document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open, onOpenChange])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* overlay */}
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={() => onOpenChange(false)}
      />
      {/* content */}
      <div className="relative z-50 w-full max-w-lg max-h-[90vh] overflow-y-auto animate-fade-scale">
        {children}
      </div>
    </div>
  )
}

export function DialogContent({ className = '', children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div className={`card p-0 ${className}`} {...props}>
      {children}
    </div>
  )
}

export function DialogHeader({ className = '', ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`px-5 py-4 border-b border-[hsl(var(--border)/0.5)] ${className}`} {...props} />
}

export function DialogTitle({ className = '', ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={`text-base font-semibold ${className}`} {...props} />
}

export function DialogClose({ onClick, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className="btn btn-ghost btn-sm"
      {...props}
      onClick={onClick}
    >
      <X className="h-4 w-4" />
    </button>
  )
}