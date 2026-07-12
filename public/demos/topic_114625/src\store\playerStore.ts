import { create } from 'zustand'
import type { Track } from '@/data/tracks'
import { tracks } from '@/data/tracks'

export type MusicPlatform = 'netease' | 'qq'

export interface LyricLine {
  time: number
  text: string
}

interface SearchResultRaw {
  id: string
  name: string
  artist: string[]
  album: string
  pic_id: string
  url_id: string
  lyric_id: string
  duration: number
}

/** Single source within a merged search result */
export interface MusicSource {
  platform: MusicPlatform
  sourceLabel: string
  cover: string
  urlId: string
  rawId: string
  lyricId: string
}

/** A merged search result (same song title + artist grouped together) */
export interface SearchResultItem {
  id: string
  title: string
  artist: string
  cover: string
  sources: MusicSource[]
}

/** A chart from NetEase or QQ Music hot list */
export interface ChartData {
  name: string
  platform: MusicPlatform
  chartLabel: string
  songs: {
    name: string
    artist: string[]
    album: string
    pic_id: string
    cover: string
    url_id: string
    lyric_id: string
    id: string
    duration: number
  }[]
}

interface PlayerState {
  currentTrack: Track
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  isDragging: boolean
  playlist: Track[]
  searchResults: SearchResultItem[]
  isSearching: boolean
  searchKeyword: string
  charts: ChartData[]
  chartsLoaded: boolean
  lyrics: LyricLine[]
  currentLyricIndex: number
  lyricPlatform: string
  lyricId: string
  favorites: string[]
  playHistory: Track[]
  repeatMode: 'none' | 'all' | 'one'
  coverStyle: 'circle' | 'square'
  playlistVisible: boolean
  sidebarVisible: boolean

  setCurrentTrack: (track: Track) => void
  setIsPlaying: (isPlaying: boolean) => void
  setCurrentTime: (time: number) => void
  setDuration: (duration: number) => void
  setVolume: (volume: number) => void
  setIsDragging: (dragging: boolean) => void
  nextTrack: () => void
  prevTrack: () => void
  toggleFavorite: (trackId: string) => void
  isFavorite: (trackId: string) => boolean
  search: (keyword: string) => Promise<void>
  playSource: (item: SearchResultItem, source: MusicSource) => Promise<void>
  clearSearch: () => void
  addToPlaylist: (track: Track) => void
  fetchCharts: () => Promise<void>
  fetchPlayHistory: () => Promise<void>
  loadPlaylistFromDB: () => Promise<void>
  playChartSong: (platform: MusicPlatform, song: ChartData['songs'][0]) => Promise<void>
  fetchLyrics: (platform: string, id: string) => Promise<void>
  setCurrentLyricIndex: (index: number) => void
  cycleRepeatMode: () => void
  setCoverStyle: (style: 'circle' | 'square') => void
  togglePlaylistVisible: () => void
  toggleSidebarVisible: () => void
  removeFromPlaylist: (trackId: string) => void
}

const platformLabel: Record<MusicPlatform, string> = {
  netease: '网易云',
  qq: 'QQ音乐',
}

/** Normalize a string for comparison (lowercase, trim, remove extra spaces) */
function normalize(str: string): string {
  return str.trim().toLowerCase().replace(/\s+/g, ' ')
}

export const usePlayerStore = create<PlayerState>((set, get) => ({
  currentTrack: tracks[0],
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  volume: 0.7,
  isDragging: false,
  playlist: [],
  searchResults: [],
  isSearching: false,
  searchKeyword: '',
  charts: [],
  chartsLoaded: false,
  lyrics: [],
  currentLyricIndex: -1,
  lyricPlatform: '',
  lyricId: '',
  favorites: [],
  playHistory: [],
  repeatMode: 'none',
  coverStyle: 'circle',
  playlistVisible: true,
  sidebarVisible: true,

  setCurrentTrack: (track) => {
    set({ currentTrack: track, currentTime: 0, duration: 0, lyrics: [], currentLyricIndex: -1 })
    if (track._platform && track._lyricId) {
      get().fetchLyrics(track._platform, track._lyricId)
    }
  },

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  setCurrentTime: (currentTime) => set({ currentTime }),

  setDuration: (duration) => set({ duration }),

  setVolume: (volume) => set({ volume }),

  setIsDragging: (dragging) => set({ isDragging: dragging }),

  toggleFavorite: (trackId) => {
    const { favorites } = get()
    if (favorites.includes(trackId)) {
      set({ favorites: favorites.filter((id) => id !== trackId) })
    } else {
      set({ favorites: [...favorites, trackId] })
    }
  },

  isFavorite: (trackId) => {
    return get().favorites.includes(trackId)
  },

  cycleRepeatMode: () => {
    const { repeatMode } = get()
    const modes: ('none' | 'all' | 'one')[] = ['none', 'all', 'one']
    const idx = modes.indexOf(repeatMode)
    set({ repeatMode: modes[(idx + 1) % modes.length] })
  },

  setCoverStyle: (style) => set({ coverStyle: style }),

  togglePlaylistVisible: () => {
    const { playlistVisible } = get()
    set({ playlistVisible: !playlistVisible })
  },

  toggleSidebarVisible: () => {
    const { sidebarVisible } = get()
    set({ sidebarVisible: !sidebarVisible })
  },

  removeFromPlaylist: async (trackId) => {
    const { playlist, currentTrack } = get()
    const newPlaylist = playlist.filter((t) => String(t.id) !== trackId)
    set({ playlist: newPlaylist })
    if (String(currentTrack.id) === trackId && newPlaylist.length > 0) {
      set({ currentTrack: newPlaylist[0], currentTime: 0, duration: 0 })
    }
    try {
      await fetch(`/api/db/song/${trackId}`, { method: 'DELETE' })
    } catch (error) {
      console.error('Delete song from database error:', error)
    }
  },

  loadPlaylistFromDB: async () => {
    try {
      const res = await fetch('/api/db/playlist')
      const data = await res.json()
      if (Array.isArray(data) && data.length > 0) {
        const playlist: Track[] = data.map((item: any) => ({
          id: String(item.id),
          title: item.title,
          artist: item.artist,
          cover: item.cover || '',
          audioSrc: item.audio_src || '',
          duration: item.duration || 0,
          _platform: item.platform || '',
          _lyricId: item.platform_id || '',
        }))
        set({ playlist })
        get().setCurrentTrack(playlist[0])
      }
    } catch (error) {
      console.error('Load playlist from database error:', error)
    }
  },

  nextTrack: () => {
    const { currentTrack, playlist, repeatMode } = get()
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id)
    if (currentIndex < 0) return
    if (repeatMode === 'one') {
      set({ currentTime: 0 })
      return
    }
    const nextIndex = (currentIndex + 1) % playlist.length
    get().setCurrentTrack(playlist[nextIndex])
  },

  prevTrack: () => {
    const { currentTrack, playlist, currentTime } = get()
    const currentIndex = playlist.findIndex((t) => t.id === currentTrack.id)
    if (currentIndex < 0) return
    if (currentTime > 3) {
      set({ currentTime: 0 })
      return
    }
    const prevIndex = (currentIndex - 1 + playlist.length) % playlist.length
    get().setCurrentTrack(playlist[prevIndex])
  },

  search: async (keyword) => {
    set({ isSearching: true, searchKeyword: keyword })
    try {
      // Search both platforms in parallel
      const [neteaseRes, qqRes] = await Promise.all([
        fetch(`/api/search?platform=netease&keyword=${encodeURIComponent(keyword)}&limit=10`),
        fetch(`/api/search?platform=qq&keyword=${encodeURIComponent(keyword)}&limit=10`),
      ])

      const [neteaseData, qqData]: [SearchResultRaw[], SearchResultRaw[]] = await Promise.all([
        neteaseRes.ok ? neteaseRes.json() : [],
        qqRes.ok ? qqRes.json() : [],
      ])

      // Fetch cover for a single source
      const fetchCover = async (platform: MusicPlatform, picId: string): Promise<string> => {
        try {
          const r = await fetch(`/api/pic?platform=${platform}&id=${picId}&size=300`)
          const d = await r.json()
          return d?.url || ''
        } catch {
          return ''
        }
      }

      // Process one platform's raw results into sources with covers
      const processSources = async (data: SearchResultRaw[], platform: MusicPlatform): Promise<{ title: string; artist: string; source: MusicSource }[]> => {
        const items = await Promise.all(
          (data || []).slice(0, 10).map(async (item) => {
            const [cover] = await Promise.all([fetchCover(platform, item.pic_id)])
            return {
              title: item.name,
              artist: item.artist?.join(' / ') || 'Unknown',
              source: {
                platform,
                sourceLabel: platformLabel[platform],
                cover,
                urlId: item.url_id,
                rawId: item.id,
                lyricId: item.lyric_id || item.id,
              },
            }
          })
        )
        return items
      }

      const [neteaseItems, qqItems] = await Promise.all([
        processSources(neteaseData, 'netease'),
        processSources(qqData, 'qq'),
      ])

      // Merge by (title + artist)
      const mergeKey = (item: { title: string; artist: string }) =>
        `${normalize(item.title)}||${normalize(item.artist)}`

      const map = new Map<string, { title: string; artist: string; sources: MusicSource[] }>()

      for (const item of [...neteaseItems, ...qqItems]) {
        const key = mergeKey(item)
        const existing = map.get(key)
        if (existing) {
          existing.sources.push(item.source)
        } else {
          map.set(key, { title: item.title, artist: item.artist, sources: [item.source] })
        }
      }

      // Build final result list
      const merged: SearchResultItem[] = []
      for (const [, value] of map) {
        merged.push({
          id: `merged_${value.sources.map((s) => s.rawId).join('_')}`,
          title: value.title,
          artist: value.artist,
          cover: value.sources[0].cover,
          sources: value.sources,
        })
      }

      set({ searchResults: merged, isSearching: false })
    } catch (error) {
      console.error('Search error:', error)
      set({ isSearching: false })
    }
  },

  playSource: async (item, source) => {
    const track: Track = {
      id: `${source.platform}_${source.rawId}`,
      title: item.title,
      artist: item.artist,
      cover: source.cover,
      audioSrc: '',
      duration: 0,
      _platform: source.platform,
      _lyricId: source.lyricId,
    }

    set({ isPlaying: false, currentTrack: track, currentTime: 0, duration: 0, lyrics: [], currentLyricIndex: -1 })

    try {
      const res = await fetch(`/api/url?platform=${source.platform}&id=${source.urlId}&br=320`)
      const data = await res.json()
      const audioUrl = data?.data?.[0]?.url || data?.url || ''
      const fee = data?.data?.[0]?.fee ?? 0
      const isPreview = fee !== 0

      if (audioUrl) {
        const proxiedUrl = `/api/audio-proxy?url=${encodeURIComponent(audioUrl)}`
        const updatedTrack = { ...track, audioSrc: proxiedUrl, _isPreview: isPreview }
        set({ currentTrack: updatedTrack, isPlaying: true })
        get().addToPlaylist(updatedTrack)
        get().fetchLyrics(source.platform, source.lyricId)
      } else {
        set({ isPlaying: false })
      }
    } catch (error) {
      console.error('Failed to get audio URL:', error)
      set({ isPlaying: false })
    }
  },

  clearSearch: () => set({ searchKeyword: '', searchResults: [] }),

  addToPlaylist: (track) => {
    const { playlist } = get()
    const exists = playlist.some((t) => t.id === track.id)
    if (!exists) {
      set({ playlist: [...playlist, track] })
    }
  },

  fetchCharts: async () => {
    try {
      const [neteaseRes, qqRes] = await Promise.all([
        fetch('/api/chart?platform=netease'),
        fetch('/api/chart?platform=qq'),
      ])
      const [neteaseData, qqData] = await Promise.all([
        neteaseRes.ok ? neteaseRes.json() : null,
        qqRes.ok ? qqRes.json() : null,
      ])
      const charts: ChartData[] = []
      if (neteaseData?.songs) {
        charts.push({
          name: neteaseData.chart,
          platform: 'netease',
          chartLabel: '网易云',
          songs: neteaseData.songs,
        })
      }
      if (qqData?.songs) {
        charts.push({
          name: qqData.chart,
          platform: 'qq',
          chartLabel: 'QQ音乐',
          songs: qqData.songs,
        })
      }
      set({ charts, chartsLoaded: true })
    } catch (error) {
      console.error('Fetch charts error:', error)
      set({ chartsLoaded: true })
    }
  },

  playChartSong: async (platform, song) => {
    set({ isPlaying: false, currentTime: 0, duration: 0, lyrics: [], currentLyricIndex: -1 })
    const track: Track = {
      id: `${platform}_${song.id}`,
      title: song.name,
      artist: song.artist?.join(' / ') || 'Unknown',
      cover: song.cover,
      audioSrc: '',
      duration: song.duration || 0,
      _platform: platform,
      _lyricId: song.lyric_id || song.id,
    }
    set({ currentTrack: track })

    const tryGetUrl = async (plat: MusicPlatform, id: string): Promise<{ url: string; preview: boolean } | null> => {
      try {
        const res = await fetch(`/api/url?platform=${plat}&id=${id}&br=320`)
        const data = await res.json()
        const audioUrl = data?.data?.[0]?.url || data?.url || ''
        const fee = data?.data?.[0]?.fee ?? 0
        if (audioUrl) {
          return { url: audioUrl, preview: fee !== 0 }
        }
      } catch {}
      return null
    }

    try {
      let result = await tryGetUrl(platform, song.url_id)

      if (!result) {
        const searchRes = await fetch(`/api/search?platform=${platform}&keyword=${encodeURIComponent(song.name)}&limit=3`)
        const searchData = await searchRes.json()
        if (Array.isArray(searchData) && searchData.length > 0) {
          const found = searchData[0]
          result = await tryGetUrl(platform, found.url_id)
        }
      }

      if (!result) {
        const otherPlatform: MusicPlatform = platform === 'qq' ? 'netease' : 'qq'
        const searchRes = await fetch(`/api/search?platform=${otherPlatform}&keyword=${encodeURIComponent(song.name + ' ' + (song.artist?.[0] || ''))}&limit=3`)
        const searchData = await searchRes.json()
        if (Array.isArray(searchData) && searchData.length > 0) {
          const found = searchData[0]
          result = await tryGetUrl(otherPlatform, found.url_id)
        }
      }

      let cover = song.cover
      if (!cover && song.pic_id) {
        try {
          const picRes = await fetch(`/api/pic?platform=${platform}&id=${song.pic_id}&size=300`)
          const picData = await picRes.json()
          cover = picData?.url || ''
        } catch {}
      }

      if (result) {
        const proxiedUrl = `/api/audio-proxy?url=${encodeURIComponent(result.url)}`
        const updatedTrack = { ...track, cover, audioSrc: proxiedUrl, _isPreview: result.preview }
        set({ currentTrack: updatedTrack, isPlaying: true })
        get().addToPlaylist(updatedTrack)
        get().fetchLyrics(platform, song.lyric_id || song.url_id)
      } else {
        set({ isPlaying: false })
      }
    } catch (error) {
      console.error('Failed to play chart song:', error)
      set({ isPlaying: false })
    }
  },

  fetchLyrics: async (platform, id) => {
    if (!platform || !id) return
    set({ lyricPlatform: platform, lyricId: id })
    try {
      const res = await fetch(`/api/lyric?platform=${platform}&id=${id}`)
      const data = await res.json()
      const lrcText = data?.lrc?.lyric || data?.lyric || ''
      if (!lrcText) {
        set({ lyrics: [], currentLyricIndex: -1 })
        return
      }
      const lines = lrcText.split('\n')
      const parsed: LyricLine[] = []
      const lineRegex = /^\[(\d{2}):(\d{2})[\.:](\d{2,3})\](.*)/
      for (const line of lines) {
        const match = line.match(lineRegex)
        if (match) {
          const min = parseInt(match[1])
          const sec = parseInt(match[2])
          const ms = parseInt(match[3])
          const time = min * 60 + sec + ms / (match[3].length === 2 ? 100 : 1000)
          const text = match[4].trim()
          if (text) {
            parsed.push({ time, text })
          }
        }
      }
      parsed.sort((a, b) => a.time - b.time)
      set({ lyrics: parsed, currentLyricIndex: -1 })
    } catch (error) {
      console.error('Fetch lyrics error:', error)
      set({ lyrics: [], currentLyricIndex: -1 })
    }
  },

  fetchPlayHistory: async () => {
    try {
      const res = await fetch('/api/db/history')
      const data = await res.json()
      const history: Track[] = data.map((item: any) => ({
        id: String(item.id),
        title: item.title,
        artist: item.artist,
        cover: item.cover || '',
        audioSrc: item.audio_src || '',
        duration: item.duration || 0,
      }))
      set({ playHistory: history })
    } catch (error) {
      console.error('Fetch play history error:', error)
    }
  },

  setCurrentLyricIndex: (index) => set({ currentLyricIndex: index }),
}))
