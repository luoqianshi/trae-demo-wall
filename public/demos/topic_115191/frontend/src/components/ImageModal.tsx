/** 图片点击放大弹窗（Portal 渲染到 body，避免父级 transform 影响）。 */
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

export function ImageModal({ src, alt, onClose }: { src: string; alt?: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
      onClick={onClose}
    >
      <div className="relative max-h-full max-w-full">
        <button
          type="button"
          className="absolute -top-10 right-0 text-white text-sm hover:text-gray-300 px-2 py-1"
          onClick={onClose}
        >
          关闭 ×
        </button>
        <img
          src={src}
          alt={alt || '放大图片'}
          className="max-h-[90vh] max-w-[90vw] rounded-lg shadow-2xl object-contain border border-gray-700"
          onClick={(e) => e.stopPropagation()}
        />
      </div>
    </div>,
    document.body,
  )
}
