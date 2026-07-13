import { Plus, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { ComicPage } from '../types'

interface Props {
  pages: ComicPage[]
  currentPageId: string | null
  onSelect: (pageId: string) => void
  onAdd: () => void
  onRemove: (pageId: string) => void
}

export function PageThumbnailBar({ pages, currentPageId, onSelect, onAdd, onRemove }: Props) {
  return (
    <div className='flex h-20 items-center gap-2 border-t border-neutral-200 bg-white px-3'>
      {/* overflow-x-auto 会裁剪掉子元素的外突部分，且 overflow-y 会隐式变成 auto，导致外突的删除按钮被隐藏或被兄弟遮挡。
          解决：删除按钮放在缩略图内部（right-0.5 top-0.5），并给悬停项 z-10 以避免被后面的兄弟盖住。 */}
      <div className='flex flex-1 items-center gap-2 overflow-x-auto py-1'>
        {pages.map((page, idx) => (
          <div
            key={page.id}
            onClick={() => onSelect(page.id)}
            className={cn(
              'group relative flex h-16 w-12 shrink-0 cursor-pointer flex-col items-center justify-center rounded border bg-white transition-colors',
              'hover:z-10',
              currentPageId === page.id
                ? 'border-blue-500 shadow-md ring-1 ring-blue-500'
                : 'border-neutral-200 hover:border-neutral-400'
            )}
          >
            <span className='text-xs text-neutral-500'>P{idx + 1}</span>
            <span className='text-[10px] text-neutral-400'>{page.panels.length}格</span>
            {pages.length > 1 && (
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  if (window.confirm(`删除第 ${idx + 1} 页？`)) onRemove(page.id)
                }}
                className='absolute right-0.5 top-0.5 z-20 hidden rounded-full bg-rose-500 p-0.5 text-white shadow ring-1 ring-white hover:bg-rose-600 group-hover:block'
                title='删除此页'
              >
                <X size={10} />
              </button>
            )}
          </div>
        ))}
      </div>
      <Button variant='outline' size='sm' onClick={onAdd} className='shrink-0 gap-1'>
        <Plus size={14} /> 新增页
      </Button>
    </div>
  )
}
