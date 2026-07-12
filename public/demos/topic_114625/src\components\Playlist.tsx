import { useCallback, useState } from 'react'
import { usePlayerStore, type SearchResultItem, type MusicSource, type MusicPlatform } from '@/store/playerStore'
import { Play, Pause, Search, TrendingUp, X } from 'lucide-react'

export default function Playlist() {
  const [activeChart, setActiveChart] = useState<MusicPlatform | null>(null)
  const searchResults = usePlayerStore((s) => s.searchResults)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const isSearching = usePlayerStore((s) => s.isSearching)
  const searchKeyword = usePlayerStore((s) => s.searchKeyword)
  const charts = usePlayerStore((s) => s.charts)
  const chartsLoaded = usePlayerStore((s) => s.chartsLoaded)
  const playSource = usePlayerStore((s) => s.playSource)
  const playChartSong = usePlayerStore((s) => s.playChartSong)
  const clearSearch = usePlayerStore((s) => s.clearSearch)

  const handlePlaySource = (item: SearchResultItem, source: MusicSource) => {
    playSource(item, source)
  }

  const handlePlayChartSong = useCallback(
    (platform: MusicPlatform, song: { name: string; artist: string[]; album: string; pic_id: string; cover: string; url_id: string; lyric_id: string; id: string; duration: number }) => {
      playChartSong(platform, song)
    },
    [playChartSong]
  )

  const isCurrentPlaying = (trackId: number | string) => {
    return currentTrack.id === trackId
  }

  const isSourcePlaying = (item: SearchResultItem, source: MusicSource) => {
    return currentTrack.id === `${source.platform}_${source.rawId}` && isPlaying
  }

  const isChartSongPlaying = (platform: MusicPlatform, songId: string) => {
    return currentTrack.id === `${platform}_${songId}` && isPlaying
  }

  const showSearchResults = searchKeyword.trim().length > 0

  return (
    <div className="space-y-2 px-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
          {showSearchResults ? `搜索结果 - "${searchKeyword}"` : '热门推荐'}
        </h3>
        {showSearchResults && (
          <button
            onClick={clearSearch}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-md p-1 hover:bg-gray-100"
            title="返回榜单"
          >
            <X size={14} />
          </button>
        )}
      </div>

      {showSearchResults ? (
        isSearching ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <div className="h-6 w-6 animate-spin rounded-full border border-gray-300 border-t-gray-600 mb-3" />
            <span className="text-sm">搜索中...</span>
          </div>
        ) : searchResults.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-gray-400">
            <Search size={24} className="mb-2" />
            <span className="text-sm">未找到结果</span>
          </div>
        ) : (
          searchResults.map((item) => {
            const isActive = isCurrentPlaying(item.id)
            return (
              <div
                key={item.id}
                className="group rounded-xl px-3 py-3 transition-all duration-200 bg-white/60 hover:bg-white/90 border border-gray-200/40 hover:border-gray-200/80 mb-1"
              >
                <div className="flex items-center gap-3">
                  <div className="relative h-10 w-10 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-gray-200/60">
                    {item.cover ? (
                      <img
                        src={item.cover}
                        alt={item.title}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
                        <Play size={14} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className={`truncate text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                      {item.title}
                    </p>
                    <p className="truncate text-xs text-gray-500">{item.artist}</p>
                  </div>
                </div>

                <div className="mt-2 flex gap-2 pl-[52px]">
                  {item.sources.map((source) => {
                    const active = isSourcePlaying(item, source)
                    return (
                      <button
                        key={source.platform}
                        onClick={() => handlePlaySource(item, source)}
                        className={`inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium transition-all ${
                          active
                            ? 'bg-gray-900 text-white'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                      >
                        {active && isPlaying ? (
                          <Pause size={10} />
                        ) : (
                          <Play size={10} />
                        )}
                        {source.sourceLabel}
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })
        )
      ) : !chartsLoaded ? (
        <div className="flex flex-col items-center justify-center py-12 text-gray-400">
          <div className="h-6 w-6 animate-spin rounded-full border border-gray-300 border-t-gray-600 mb-3" />
          <span className="text-sm">加载榜单中...</span>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="flex gap-2 px-1">
            {charts.map((chart) => {
              const isActive = activeChart === chart.platform || (activeChart === null && charts.indexOf(chart) === 0)
              return (
                <button
                  key={chart.platform}
                  onClick={() => setActiveChart(isActive ? null : chart.platform)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-gray-900 text-white'
                      : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                  }`}
                >
                  <TrendingUp size={11} />
                  {chart.name}
                </button>
              )
            })}
          </div>

          {charts.map((chart) => {
            const showChart = activeChart === null
              ? charts.indexOf(chart) === 0
              : activeChart === chart.platform
            if (!showChart) return null
            return (
              <div key={chart.platform} className="space-y-0.5">
                {chart.songs.map((song, index) => {
                  const isActive = isChartSongPlaying(chart.platform, song.id)
                  return (
                    <div
                      key={`${chart.platform}_${song.id}`}
                      className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? 'bg-blue-50 border border-blue-200/60'
                          : 'bg-white/40 border border-gray-200/30 hover:bg-white/80 hover:border-gray-200/60'
                      }`}
                      onClick={() => handlePlayChartSong(chart.platform, song)}
                    >
                      <span className={`w-5 text-center text-xs font-mono flex-shrink-0 ${
                        index < 3 ? 'text-gray-600 font-semibold' : 'text-gray-400'
                      }`}>
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <div className="flex-shrink-0 w-7 h-7 rounded-lg overflow-hidden bg-gray-100 ring-1 ring-gray-200/40">
                        {song.cover ? (
                          <img src={song.cover} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {isActive && isPlaying ? (
                              <Pause size={10} className="text-gray-600" />
                            ) : (
                              <Play size={10} className="text-gray-400" />
                            )}
                          </div>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className={`truncate text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                          {song.name}
                        </p>
                        <p className="truncate text-xs text-gray-500">
                          {song.artist?.join(' / ') || 'Unknown'}
                        </p>
                      </div>
                      {isActive && isPlaying && (
                        <div className="flex items-end gap-0.5 h-3 flex-shrink-0">
                          <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer" style={{ animationDelay: '0s' }} />
                          <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer" style={{ animationDelay: '0.15s' }} />
                          <span className="w-0.5 bg-blue-500 rounded-full animate-equalizer" style={{ animationDelay: '0.3s' }} />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
