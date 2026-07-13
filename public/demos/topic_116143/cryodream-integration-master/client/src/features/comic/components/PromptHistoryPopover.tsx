import { useMemo, useRef, useState } from 'react'
import { History, Star, Trash2, X } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import type { PromptEntry } from '../hooks/use-prompt-history'
import { usePromptHistory } from '../hooks/use-prompt-history'

interface Props {
  kind: PromptEntry['kind']
  /** 当前提示词文本（用于展示"是否已收藏当前提示词"按钮态） */
  currentText: string
  onPick: (text: string) => void
  /** 默认展示前多少条历史（点击"查看更多"展开全部） */
  defaultLimit?: number
}

/**
 * 提示词历史 + 收藏气泡按钮：
 * - 触发按钮：⭐（收藏当前）+ 🕓（历史，弹出下拉）
 * - 下拉内含 2 个 tab：历史 / 收藏
 * - 默认显示前 10 条，超过时可展开
 */
export function PromptHistoryPopover({ kind, currentText, onPick, defaultLimit = 10 }: Props) {
  const {
    history,
    favorites,
    clearHistory,
    removeHistoryEntry,
    toggleFavorite,
    removeFavorite,
    isFavorite,
  } = usePromptHistory()

  const [tab, setTab] = useState<'history' | 'favorites'>('history')
  const [expanded, setExpanded] = useState(false)
  const [open, setOpen] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)

  const currentIsFav = useMemo(
    () => isFavorite(currentText, kind),
    [isFavorite, currentText, kind]
  )

  const filteredHistory = useMemo(
    () => history.filter((e) => e.kind === kind),
    [history, kind]
  )
  const filteredFavorites = useMemo(
    () => favorites.filter((e) => e.kind === kind),
    [favorites, kind]
  )

  const listToShow = tab === 'history' ? filteredHistory : filteredFavorites
  const showAll = expanded || listToShow.length <= defaultLimit
  const displayed = showAll ? listToShow : listToShow.slice(0, defaultLimit)

  const kindLabel = kind === 'positive' ? '正面' : '负面'

  return (
    <div ref={anchorRef} className='flex items-center gap-1'>
      {/* 一键收藏当前提示词 */}
      <button
        type='button'
        onClick={() => {
          const text = currentText.trim()
          if (!text) return
          toggleFavorite({ id: '', text, kind, ts: Date.now() })
        }}
        disabled={!currentText.trim()}
        className={cn(
          'flex size-5 items-center justify-center rounded transition-colors disabled:opacity-30 disabled:cursor-not-allowed',
          currentIsFav
            ? 'text-amber-500 hover:bg-amber-50'
            : 'text-neutral-400 hover:bg-neutral-100 hover:text-amber-500'
        )}
        title={currentIsFav ? '取消收藏当前提示词' : '收藏当前提示词'}
      >
        <Star size={11} fill={currentIsFav ? 'currentColor' : 'none'} />
      </button>

      {/* 历史 / 收藏下拉 */}
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <button
            type='button'
            className='flex size-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-fuchsia-600'
            title='查看历史与收藏'
          >
            <History size={11} />
          </button>
        </PopoverTrigger>
        <PopoverContent
          align='end'
          className='w-[420px] p-0'
          side='bottom'
          sideOffset={4}
        >
          {/* Tab */}
          <div className='flex items-center border-b border-neutral-100 px-1 pt-1'>
            <button
              type='button'
              onClick={() => {
                setTab('history')
                setExpanded(false)
              }}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors',
                tab === 'history'
                  ? 'border-b-2 border-fuchsia-500 text-fuchsia-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <History size={11} />
              历史（{filteredHistory.length}）
            </button>
            <button
              type='button'
              onClick={() => {
                setTab('favorites')
                setExpanded(false)
              }}
              className={cn(
                'flex items-center gap-1 px-2 py-1.5 text-[11px] font-medium transition-colors',
                tab === 'favorites'
                  ? 'border-b-2 border-fuchsia-500 text-fuchsia-600'
                  : 'text-neutral-500 hover:text-neutral-700'
              )}
            >
              <Star size={11} />
              收藏（{filteredFavorites.length}）
            </button>
            <div className='ml-auto flex items-center gap-1 px-1'>
              {tab === 'history' && filteredHistory.length > 0 && (
                <button
                  type='button'
                  onClick={() => {
                    if (window.confirm('确定要清空所有历史记录吗？（不会影响收藏）')) {
                      clearHistory()
                    }
                  }}
                  className='rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-rose-500'
                  title='清空历史'
                >
                  <Trash2 size={11} />
                </button>
              )}
              <button
                type='button'
                onClick={() => setOpen(false)}
                className='rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700'
                title='关闭'
              >
                <X size={11} />
              </button>
            </div>
          </div>

          {/* 列表 */}
          <div className='max-h-[360px] overflow-y-auto p-1'>
            {displayed.length === 0 ? (
              <div className='flex flex-col items-center gap-1 py-6 text-center text-[11px] text-neutral-400'>
                {tab === 'history' ? (
                  <>
                    <History size={20} />
                    <span>暂无{kindLabel}提示词历史</span>
                    <span className='text-[10px] text-neutral-300'>
                      每次点击"生成"后会自动保存
                    </span>
                  </>
                ) : (
                  <>
                    <Star size={20} />
                    <span>暂无{kindLabel}提示词收藏</span>
                    <span className='text-[10px] text-neutral-300'>
                      点击 ⭐ 收藏喜欢的提示词
                    </span>
                  </>
                )}
              </div>
            ) : (
              <ul className='space-y-0.5'>
                {displayed.map((e) => {
                  const fav = isFavorite(e.text, e.kind)
                  return (
                    <li
                      key={e.id}
                      className='group flex items-start gap-1.5 rounded px-1.5 py-1.5 hover:bg-neutral-50'
                    >
                      <button
                        type='button'
                        onClick={() => {
                          onPick(e.text)
                          setOpen(false)
                        }}
                        className='min-w-0 flex-1 text-left'
                        title='点击使用该提示词'
                      >
                        <div className='line-clamp-3 whitespace-pre-wrap break-words text-[11px] leading-snug text-neutral-700 group-hover:text-fuchsia-700'>
                          {e.text}
                        </div>
                        <div className='mt-0.5 text-[9px] text-neutral-400'>
                          {formatTs(e.ts)} · {e.text.length} 字
                        </div>
                      </button>
                      <div className='flex shrink-0 flex-col items-center gap-0.5 opacity-60 group-hover:opacity-100'>
                        <button
                          type='button'
                          onClick={(ev) => {
                            ev.stopPropagation()
                            toggleFavorite(e)
                          }}
                          className={cn(
                            'flex size-5 items-center justify-center rounded transition-colors',
                            fav
                              ? 'text-amber-500 hover:bg-amber-50'
                              : 'text-neutral-400 hover:bg-neutral-100 hover:text-amber-500'
                          )}
                          title={fav ? '取消收藏' : '收藏'}
                        >
                          <Star size={10} fill={fav ? 'currentColor' : 'none'} />
                        </button>
                        <button
                          type='button'
                          onClick={(ev) => {
                            ev.stopPropagation()
                            if (tab === 'history') removeHistoryEntry(e.id)
                            else removeFavorite(e.id)
                          }}
                          className='flex size-5 items-center justify-center rounded text-neutral-400 hover:bg-neutral-100 hover:text-rose-500'
                          title='删除'
                        >
                          <Trash2 size={10} />
                        </button>
                      </div>
                    </li>
                  )
                })}
              </ul>
            )}

            {!showAll && (
              <button
                type='button'
                onClick={() => setExpanded(true)}
                className='mt-1 w-full rounded py-1 text-center text-[11px] text-fuchsia-600 hover:bg-fuchsia-50'
              >
                查看全部 {listToShow.length} 条
              </button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}

function formatTs(ts: number): string {
  const d = new Date(ts)
  const now = new Date()
  const diff = now.getTime() - ts
  if (diff < 60_000) return '刚刚'
  if (diff < 3600_000) return `${Math.floor(diff / 60_000)} 分钟前`
  if (diff < 86400_000) return `${Math.floor(diff / 3600_000)} 小时前`
  return `${d.getMonth() + 1}-${d.getDate()} ${String(d.getHours()).padStart(2, '0')}:${String(
    d.getMinutes()
  ).padStart(2, '0')}`
}
