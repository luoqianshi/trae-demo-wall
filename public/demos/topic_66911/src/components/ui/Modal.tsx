import { X } from 'lucide-react'
import { useEffect, useRef, useCallback, useState } from 'react'
import { ChineseBorder } from './ChineseBorder'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  children: React.ReactNode
  className?: string
  size?: 'md' | 'lg' | 'xl'
  /** 点击遮罩层是否关闭，默认 true */
  closeOnOverlay?: boolean
}

const sizeClasses: Record<string, string> = {
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

export function Modal({
  isOpen,
  onClose,
  title,
  children,
  className,
  size = 'md',
  closeOnOverlay = true,
}: ModalProps) {
  const modalRef = useRef<HTMLDivElement>(null)
  const previousActiveRef = useRef<Element | null>(null)
  const titleId = title ? `modal-title-${title.replace(/\s+/g, '-').toLowerCase()}` : undefined
  const [closing, setClosing] = useState(false)

  /* ------------------------------------------------------------------ */
  /*  Close handler with exit animation                                   */
  /* ------------------------------------------------------------------ */
  const handleClose = useCallback(() => {
    setClosing(true)
    setTimeout(() => {
      setClosing(false)
      onClose()
    }, 300)
  }, [onClose])

  /* ------------------------------------------------------------------ */
  /*  Lock body scroll when open                                         */
  /* ------------------------------------------------------------------ */
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
      // Save previously focused element
      previousActiveRef.current = document.activeElement
    } else {
      document.body.style.overflow = ''
      // Restore focus to the previous element
      if (previousActiveRef.current instanceof HTMLElement) {
        previousActiveRef.current.focus()
      }
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [isOpen])

  /* ------------------------------------------------------------------ */
  /*  Esc key handler                                                     */
  /* ------------------------------------------------------------------ */
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        handleClose()
        return
      }

      /* ---- Simple focus trap ---- */
      if (e.key === 'Tab' && modalRef.current) {
        const focusable = modalRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
        )
        if (focusable.length === 0) return

        const first = focusable[0]
        const last = focusable[focusable.length - 1]

        if (e.shiftKey) {
          if (document.activeElement === first) {
            e.preventDefault()
            last.focus()
          }
        } else {
          if (document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }
    },
    [handleClose],
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      // Auto-focus the first focusable element on open
      setTimeout(() => {
        if (modalRef.current) {
          const firstFocusable = modalRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
          )
          firstFocusable?.focus()
        }
      }, 50)
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  /* ------------------------------------------------------------------ */
  /*  Render                                                              */
  /* ------------------------------------------------------------------ */
  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-ink/30 backdrop-blur-md animate-fade-in ink-bg opacity-20"
        onClick={closeOnOverlay ? handleClose : undefined}
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        ref={modalRef}
        className={`relative bg-white rounded-xl shadow-xl ${sizeClasses[size]} w-full max-h-[90vh] overflow-auto ${closing ? 'animate-page-exit' : 'animate-modal-appear'} ${className || ''}`}
      >
        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-5 border-b border-border-light">
            <h3
              id={titleId}
              className="text-lg font-semibold text-ink"
            >
              {title}
            </h3>
            <button
              onClick={handleClose}
              className="p-1.5 rounded-full text-ink-muted hover:text-ink hover:bg-paper-dark transition-all active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ochre/30 btn-press"
              aria-label="关闭"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <ChineseBorder>
          <div className="p-6">{children}</div>
        </ChineseBorder>
      </div>
    </div>
  )
}