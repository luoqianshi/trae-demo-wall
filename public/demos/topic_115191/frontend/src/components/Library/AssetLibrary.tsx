/** 资产库面板：按日期查看所有项目的文本、图片、视频。 */
import { useEffect, useState } from 'react'
import type { LibraryCategory, LibraryData, LibraryItem } from '../../types'
import { libraryApi, imageUrl } from '../../api'
import { ImageModal } from '../ImageModal'

type CategoryKey = 'text' | 'image' | 'video'

const CATEGORY_LABELS: Record<CategoryKey, string> = {
  text: '文本',
  image: '图片',
  video: '视频',
}

export function AssetLibrary({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [data, setData] = useState<LibraryData | null>(null)
  const [loading, setLoading] = useState(false)
  const [active, setActive] = useState<CategoryKey>('image')
  const [zoomItem, setZoomItem] = useState<LibraryItem | null>(null)

  useEffect(() => {
    if (!open) return
    setLoading(true)
    libraryApi
      .get()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [open])

  const category: LibraryCategory = data?.[active] ?? {}
  const sortedDates = Object.keys(category).sort((a, b) => b.localeCompare(a))

  return (
    <>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end">
          <div className="absolute inset-0 bg-black/60" onClick={onClose} />
          <div className="relative z-50 w-[480px] h-full bg-[#1a1a1a] text-gray-100 border-l border-gray-800 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800">
              <h2 className="text-base font-semibold">节点生成历史 / 资产库</h2>
              <button type="button" className="text-gray-400 hover:text-white" onClick={onClose}>
                ×
              </button>
            </div>

            <div className="flex border-b border-gray-800">
              {(Object.keys(CATEGORY_LABELS) as CategoryKey[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`flex-1 py-2 text-sm font-medium transition-colors ${
                    active === key
                      ? 'text-white border-b-2 border-indigo-500 bg-gray-800/50'
                      : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/30'
                  }`}
                  onClick={() => setActive(key)}
                >
                  {CATEGORY_LABELS[key]}
                </button>
              ))}
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              {loading && <div className="text-sm text-gray-400">加载中...</div>}
              {!loading && sortedDates.length === 0 && (
                <div className="text-sm text-gray-500 text-center py-10">暂无{CATEGORY_LABELS[active]}资产</div>
              )}
              {sortedDates.map((date) => (
                <section key={date}>
                  <div className="sticky top-0 bg-[#1a1a1a] text-xs text-gray-500 uppercase tracking-wider mb-2 py-1">
                    {date}
                  </div>
                  <div className="space-y-3">
                    {category[date].map((item) => (
                      <div
                        key={item.id}
                        className="bg-[#252525] rounded-lg border border-gray-800 p-3 hover:border-gray-700 transition-colors"
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-indigo-400">{item.project_name}</span>
                          <span className="text-xs text-gray-500">{item.title}</span>
                        </div>
                        {active === 'image' ? (
                          <>
                            {item.image_path ? (
                              <img
                                src={imageUrl(item.image_path)!}
                                alt={item.title}
                                className="w-full h-36 object-cover rounded cursor-zoom-in bg-gray-900"
                                onClick={() => setZoomItem(item)}
                              />
                            ) : (
                              <div className="w-full h-36 bg-gray-900 rounded flex items-center justify-center text-xs text-gray-500">
                                无图片
                              </div>
                            )}
                            {item.prompt && (
                              <div className="mt-2 text-xs text-gray-400 line-clamp-2">{item.prompt}</div>
                            )}
                          </>
                        ) : active === 'text' ? (
                          <div className="text-sm text-gray-300 whitespace-pre-wrap line-clamp-6">{item.content}</div>
                        ) : (
                          <div className="text-sm text-gray-400">视频生成尚未接入</div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          </div>
        </div>
      )}
      {zoomItem?.image_path && (
        <ImageModal
          src={imageUrl(zoomItem.image_path)!}
          alt={zoomItem.title}
          onClose={() => setZoomItem(null)}
        />
      )}
    </>
  )
}
