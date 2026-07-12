import { useEffect, useRef, useCallback } from 'react'
import { SkipBack, SkipForward, Play, Pause, Heart, Repeat, Repeat1, ChevronLeft, ChevronRight, Image, Square } from 'lucide-react'
import { usePlayerStore } from '@/store/playerStore'
import ProgressBar from './ProgressBar'
import VolumeControl from './VolumeControl'
import Playlist from './Playlist'
import SearchBar from './SearchBar'
import Lyrics from './Lyrics'
import Visualizer from './Visualizer'
import BaichuanChat from './BaichuanChat'

export default function Player() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const volume = usePlayerStore((s) => s.volume)
  const currentTime = usePlayerStore((s) => s.currentTime)
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying)
  const setCurrentTime = usePlayerStore((s) => s.setCurrentTime)
  const setDuration = usePlayerStore((s) => s.setDuration)
  const nextTrack = usePlayerStore((s) => s.nextTrack)
  const prevTrack = usePlayerStore((s) => s.prevTrack)
  const toggleFavorite = usePlayerStore((s) => s.toggleFavorite)
  const isFavoriteFn = usePlayerStore((s) => s.isFavorite)
  const repeatMode = usePlayerStore((s) => s.repeatMode)
  const cycleRepeatMode = usePlayerStore((s) => s.cycleRepeatMode)
  const fetchCharts = usePlayerStore((s) => s.fetchCharts)
  const chartsLoaded = usePlayerStore((s) => s.chartsLoaded)
  const lyrics = usePlayerStore((s) => s.lyrics)
  const setCurrentLyricIndex = usePlayerStore((s) => s.setCurrentLyricIndex)
  const coverStyle = usePlayerStore((s) => s.coverStyle)
  const setCoverStyle = usePlayerStore((s) => s.setCoverStyle)
  const playlistVisible = usePlayerStore((s) => s.playlistVisible)
  const togglePlaylistVisible = usePlayerStore((s) => s.togglePlaylistVisible)
  const sidebarVisible = usePlayerStore((s) => s.sidebarVisible)
  const toggleSidebarVisible = usePlayerStore((s) => s.toggleSidebarVisible)
  const loadPlaylistFromDB = usePlayerStore((s) => s.loadPlaylistFromDB)
  const playlist = usePlayerStore((s) => s.playlist)

  useEffect(() => {
    loadPlaylistFromDB()
  }, [loadPlaylistFromDB])

  useEffect(() => {
    if (!chartsLoaded) fetchCharts()
  }, [chartsLoaded, fetchCharts])

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio()
      audioRef.current.volume = volume
    }
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.src = currentTrack.audioSrc
    audio.load()
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
  }, [currentTrack.id, currentTrack.audioSrc])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    if (isPlaying) audio.play().catch(() => setIsPlaying(false))
    else audio.pause()
  }, [isPlaying, setIsPlaying])

  useEffect(() => {
    if (lyrics.length === 0) { setCurrentLyricIndex(-1); return }
    let idx = -1
    for (let i = 0; i < lyrics.length; i++) {
      if (lyrics[i].time <= currentTime) idx = i; else break
    }
    setCurrentLyricIndex(idx)
  }, [currentTime, lyrics, setCurrentLyricIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    const onTimeUpdate = () => {
      if (!usePlayerStore.getState().isDragging) {
        setCurrentTime(audio.currentTime)
      }
    }
    const onLoadedMetadata = () => setDuration(audio.duration)
    const onEnded = () => {
      const mode = usePlayerStore.getState().repeatMode
      if (mode === 'one') {
        audio.currentTime = 0
        audio.play().catch(() => {})
      } else {
        nextTrack()
      }
    }
    const onError = () => setIsPlaying(false)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    return () => {
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }, [currentTrack, setCurrentTime, setDuration, nextTrack, setIsPlaying])

  const togglePlay = useCallback(() => {
    if (!currentTrack.audioSrc) return
    setIsPlaying(!isPlaying)
  }, [currentTrack.audioSrc, isPlaying, setIsPlaying])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
      switch (e.code) {
        case 'Space':
          e.preventDefault()
          togglePlay()
          break
        case 'ArrowLeft':
          e.preventDefault()
          prevTrack()
          break
        case 'ArrowRight':
          e.preventDefault()
          nextTrack()
          break
        case 'KeyM':
          e.preventDefault()
          const store = usePlayerStore.getState()
          store.setVolume(store.volume > 0 ? 0 : 0.7)
          break
        case 'KeyR':
          e.preventDefault()
          cycleRepeatMode()
          break
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, prevTrack, nextTrack, cycleRepeatMode])

  const trackId = String(currentTrack.id || '')
  const isFav = isFavoriteFn(trackId)
  const isLiked = isFav

  const RepeatIcon = repeatMode === 'one' ? Repeat1 : Repeat
  const repeatLabel =
    repeatMode === 'none' ? '列表循环' : repeatMode === 'all' ? '列表循环' : '单曲循环'

  return (
    <div className="h-screen flex flex-col bg-gradient-to-br from-gray-50 via-white to-gray-100 text-gray-900 overflow-hidden">
      <div className="flex-1 flex overflow-hidden">
        {sidebarVisible && (
          <div className="w-80 flex-shrink-0 border-r border-gray-200/60 glass-card flex flex-col animate-slide-in">
            <div className="p-4">
              <SearchBar />
            </div>
            <div className="flex-1 overflow-y-auto">
              <Playlist />
            </div>
          </div>
        )}

        <button
          onClick={toggleSidebarVisible}
          className="flex-shrink-0 w-8 border-r border-gray-200/60 bg-white/50 hover:bg-white/80 flex items-center justify-center transition-all"
          title={sidebarVisible ? '隐藏侧边栏' : '显示侧边栏'}
        >
          {sidebarVisible ? (
            <ChevronLeft size={16} className="text-gray-500" />
          ) : (
            <ChevronRight size={16} className="text-gray-500" />
          )}
        </button>

        <div className="flex-1 flex flex-col">
          <div className="flex-shrink-0 px-6 py-4 border-b border-gray-200/60 glass-card flex items-center justify-between">
            <h1 className="text-lg font-semibold text-gray-800 tracking-tight">Music Player</h1>
            <div className="flex items-center gap-4">
              <span className="text-xs text-gray-500 font-medium">
                SPACE 播放 · ← → 切歌 · M 静音 · R 循环
              </span>
              <button
                    onClick={() => setCoverStyle(coverStyle === 'circle' ? 'square' : 'circle')}
                    className="p-2 rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800 transition-all"
                    title={coverStyle === 'circle' ? '切换为方形封面' : '切换为圆形封面'}
                  >
                    {coverStyle === 'circle' ? <Square size={18} /> : <Image size={18} />}
                  </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col items-center justify-center px-8 pb-6">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gray-200/50 to-gray-300/50 blur-3xl scale-110" />
              <div className="relative">
                <img
                  src={currentTrack.cover || ''}
                  alt={currentTrack.title}
                  className={`h-64 w-64 object-cover shadow-2xl ring-1 ring-white/60 transition-all duration-300 ${
                    coverStyle === 'circle' ? 'rounded-full' : 'rounded-2xl'
                  }`}
                  style={{ animation: coverStyle === 'circle' && isPlaying ? 'spin 25s linear infinite' : 'none' }}
                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
                {!currentTrack.cover && (
                  <div className={`absolute inset-0 flex items-center justify-center ${
                    coverStyle === 'circle' ? 'rounded-full' : 'rounded-2xl'
                  }`}>
                    <div className={`h-64 w-64 ${coverStyle === 'circle' ? 'rounded-full' : 'rounded-2xl'} bg-gray-100 flex items-center justify-center`}>
                      <Play size={56} className="text-gray-300" />
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="mb-4 w-full max-w-xs">
              <Visualizer audioRef={audioRef} />
            </div>

            <div className="text-center mb-4 w-full max-w-md flex items-center justify-center gap-3">
              <div className="min-w-0 flex-1 rounded-xl glass-card px-4 py-3">
                <h2 className="text-xl font-semibold text-gray-900 truncate">{currentTrack.title}</h2>
                <p className="mt-1 text-sm text-gray-500 truncate">{currentTrack.artist}</p>
              </div>
              <button
                onClick={() => toggleFavorite(trackId)}
                className={`flex-shrink-0 transition-all duration-300 rounded-xl p-2.5 ${
                  isLiked
                    ? 'bg-red-500/10 text-red-500'
                    : 'bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600'
                }`}
                title={isLiked ? '取消收藏' : '收藏'}
              >
                <Heart
                  size={22}
                  fill={isLiked ? 'currentColor' : 'none'}
                  className="transition-all"
                />
              </button>
            </div>

            <div className="w-full max-w-md rounded-2xl glass-card px-5 py-4 mb-4">
              <Lyrics />
            </div>

            <div className="flex items-center justify-center gap-8 mb-6">
              <button
                onClick={cycleRepeatMode}
                className={`transition-all p-3 rounded-xl ${
                  repeatMode !== 'none'
                    ? 'bg-blue-50 text-blue-600'
                    : 'bg-gray-100 text-gray-400 hover:text-gray-600'
                }`}
                title={repeatLabel}
              >
                <RepeatIcon size={20} />
              </button>

              <button onClick={prevTrack} className="text-gray-600 hover:text-gray-900 transition-colors p-3 rounded-xl hover:bg-gray-100">
                <SkipBack size={24} />
              </button>
              <button
                onClick={togglePlay}
                disabled={!currentTrack.audioSrc}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-gray-900 text-white hover:bg-gray-800 transition-all active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shadow-lg"
              >
                {isPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-0.5" />}
              </button>
              <button onClick={nextTrack} className="text-gray-600 hover:text-gray-900 transition-colors p-3 rounded-xl hover:bg-gray-100">
                <SkipForward size={24} />
              </button>

              <div className="w-[22px]" />
            </div>

            <div className="w-full max-w-md flex items-center gap-4">
              <div className="flex-1 rounded-xl glass-card px-4 py-3">
                <ProgressBar audioRef={audioRef} />
              </div>
              <div className="flex-shrink-0">
                <VolumeControl audioRef={audioRef} />
              </div>
            </div>
          </div>
        </div>

        <button
          onClick={togglePlaylistVisible}
          className="flex-shrink-0 w-8 border-l border-gray-200/60 bg-white/50 hover:bg-white/80 flex items-center justify-center transition-all"
          title={playlistVisible ? '隐藏播放列表' : '显示播放列表'}
        >
          {playlistVisible ? (
            <ChevronRight size={16} className="text-gray-500" />
          ) : (
            <ChevronLeft size={16} className="text-gray-500" />
          )}
        </button>

        {playlistVisible && (
          <div className="w-80 flex-shrink-0 border-l border-gray-200/60 glass-card flex flex-col animate-slide-in">
            <div className="px-4 py-3 border-b border-gray-200/60">
              <h3 className="text-sm font-semibold text-gray-800">播放列表</h3>
              <p className="text-xs text-gray-500">{usePlayerStore.getState().playlist.length} 首歌曲</p>
            </div>
            <div className="flex-1 overflow-y-auto">
              <PlayerPlaylist />
            </div>
          </div>
        )}
      </div>

      <BaichuanChat />
    </div>
  )
}

function PlayerPlaylist() {
  const playlist = usePlayerStore((s) => s.playlist)
  const currentTrack = usePlayerStore((s) => s.currentTrack)
  const isPlaying = usePlayerStore((s) => s.isPlaying)
  const setCurrentTrack = usePlayerStore((s) => s.setCurrentTrack)
  const setIsPlaying = usePlayerStore((s) => s.setIsPlaying)
  const removeFromPlaylist = usePlayerStore((s) => s.removeFromPlaylist)

  const handleTrackClick = (trackId: number | string) => {
    const track = playlist.find((t) => t.id === trackId)
    if (!track) return
    if (track.id === currentTrack.id) {
      setIsPlaying(!isPlaying)
    } else {
      setCurrentTrack(track)
      setIsPlaying(true)
    }
  }

  return (
    <div className="space-y-1 px-3 py-2">
      {playlist.map((track) => {
        const isActive = track.id === currentTrack.id
        return (
          <div
            key={track.id}
            className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
              isActive
                ? 'bg-blue-50 border border-blue-200/60'
                : 'bg-white/40 border border-gray-200/30 hover:bg-white/80 hover:border-gray-200/60'
            }`}
          >
            <button
              onClick={() => handleTrackClick(track.id)}
              className="flex-1 flex items-center gap-3"
            >
              <div className="relative h-9 w-9 flex-shrink-0 overflow-hidden rounded-lg ring-1 ring-gray-200/60">
                <img
                  src={track.cover}
                  alt={track.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
                {isActive && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                    {isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3">
                        <span className="w-0.5 bg-white rounded-full animate-equalizer" style={{ animationDelay: '0s' }} />
                        <span className="w-0.5 bg-white rounded-full animate-equalizer" style={{ animationDelay: '0.15s' }} />
                        <span className="w-0.5 bg-white rounded-full animate-equalizer" style={{ animationDelay: '0.3s' }} />
                      </div>
                    ) : (
                      <Play size={12} className="text-white fill-white" />
                    )}
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <p className={`truncate text-sm font-medium ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                  {track.title}
                </p>
                <p className="truncate text-xs text-gray-500">{track.artist}</p>
              </div>
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); removeFromPlaylist(String(track.id)) }}
              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
              title="删除"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 6h18" />
                <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
              </svg>
            </button>
          </div>
        )
      })}
    </div>
  )
}
