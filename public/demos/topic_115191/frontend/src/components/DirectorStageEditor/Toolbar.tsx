/** 底部编辑模式工具栏。 */
import { useEffect } from 'react'

type TransformMode = 'translate' | 'rotate' | 'scale'

export function Toolbar({
  mode,
  onChange,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
}: {
  mode: TransformMode
  onChange: (mode: TransformMode) => void
  onUndo: () => void
  onRedo: () => void
  canUndo: boolean
  canRedo: boolean
}) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      if (key === 'v') onChange('translate')
      if (key === 'r') onChange('rotate')
      if (key === 's') onChange('scale')
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onChange])

  const btnClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
      active
        ? 'bg-white text-black border-white'
        : 'bg-[#1a1a1a] text-gray-300 border-gray-700 hover:border-gray-500'
    }`

  const iconBtn = (disabled: boolean) =>
    `px-3 py-1.5 text-xs rounded-lg border transition-colors ${
      disabled
        ? 'bg-[#1a1a1a] text-gray-600 border-gray-800 cursor-not-allowed'
        : 'bg-[#1a1a1a] text-gray-200 border-gray-700 hover:border-gray-500'
    }`

  return (
    <div className="h-12 bg-[#141414] border-t border-gray-800 flex items-center justify-between px-4">
      <div className="flex items-center gap-2">
        <button type="button" className={iconBtn(!canUndo)} onClick={onUndo} disabled={!canUndo} title="撤销 (Ctrl+Z)">
          ↶ 撤销
        </button>
        <button type="button" className={iconBtn(!canRedo)} onClick={onRedo} disabled={!canRedo} title="重做 (Ctrl+Y)">
          ↷ 重做
        </button>
      </div>
      <div className="flex items-center gap-3">
        <button type="button" className={btnClass(mode === 'translate')} onClick={() => onChange('translate')}>
          移动 (V)
        </button>
        <button type="button" className={btnClass(mode === 'rotate')} onClick={() => onChange('rotate')}>
          旋转 (R)
        </button>
        <button type="button" className={btnClass(mode === 'scale')} onClick={() => onChange('scale')}>
          缩放 (S)
        </button>
      </div>
      <div className="w-[120px]" />
    </div>
  )
}
