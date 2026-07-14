import express from 'express'
import cors from 'cors'
import Meting from '@meting/core'
import { Readable } from 'stream'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
import { initDatabase, saveSong, getSongById, getPlaylistSongs, addSongToPlaylist, removeSongFromPlaylist, isFavorite, toggleFavorite, getFavorites, getDefaultPlaylistId, addPlayHistory, getPlayHistory, deleteSongFromDatabase } from './database'

const app = express()
app.use(cors())
app.use(express.json())

const PORT = 3001

initDatabase()

// Search songs
app.get('/api/search', async (req, res) => {
  try {
    const { platform = 'netease', keyword, page = '1', limit = '20' } = req.query
    if (!keyword) {
      return res.status(400).json({ error: 'keyword is required' })
    }
    const meting = new Meting(platform as string)
    meting.format(true)
    const result = await meting.search(keyword as string, {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
    })
    res.json(JSON.parse(result))
  } catch (error: any) {
    console.error('Search error:', error)
    res.status(500).json({ error: error.message || 'Search failed' })
  }
})

// Get song streaming URL
app.get('/api/url', async (req, res) => {
  try {
    const { platform = 'netease', id, br = '320' } = req.query
    if (!id) {
      return res.status(400).json({ error: 'id is required' })
    }
    const meting = new Meting(platform as string)
    const result = await meting.url(id as string, parseInt(br as string))
    res.json(JSON.parse(result))
  } catch (error: any) {
    console.error('URL error:', error)
    res.status(500).json({ error: error.message || 'Failed to get song URL' })
  }
})

// Get album art URL
app.get('/api/pic', async (req, res) => {
  try {
    const { platform = 'netease', id, size = '300' } = req.query
    if (!id) {
      return res.status(400).json({ error: 'id is required' })
    }
    const meting = new Meting(platform as string)
    const result = await meting.pic(id as string, parseInt(size as string))
    res.json(JSON.parse(result))
  } catch (error: any) {
    console.error('Pic error:', error)
    res.status(500).json({ error: error.message || 'Failed to get album art' })
  }
})

// Get song details
app.get('/api/detail', async (req, res) => {
  try {
    const { platform = 'netease', id } = req.query
    if (!id) {
      return res.status(400).json({ error: 'id is required' })
    }
    const meting = new Meting(platform as string)
    const result = await meting.song(id as string)
    res.json(JSON.parse(result))
  } catch (error: any) {
    console.error('Detail error:', error)
    res.status(500).json({ error: error.message || 'Failed to get song details' })
  }
})

// Get lyrics
app.get('/api/lyric', async (req, res) => {
  try {
    const { platform = 'netease', id } = req.query
    if (!id) {
      return res.status(400).json({ error: 'id is required' })
    }

    if (platform === 'qq') {
      const qqRes = await fetch(
        `https://c.y.qq.com/lyric/fcgi-bin/fcg_query_lyric_new.fcg?songmid=${id}&g_tk=5381&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=h5&needNewCode=1`,
        {
          headers: {
            'Referer': 'https://y.qq.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      )
      const qqData = await qqRes.json()
      const lyricBase64 = qqData?.lyric || ''
      try {
        const decodedLyric = Buffer.from(lyricBase64, 'base64').toString('utf-8')
        res.json({ lrc: { lyric: decodedLyric }, lyric: decodedLyric })
      } catch {
        res.json({ lrc: { lyric: lyricBase64 }, lyric: lyricBase64 })
      }
    } else {
      const meting = new Meting(platform as string)
      const result = await meting.lyric(id as string)
      res.json(JSON.parse(result))
    }
  } catch (error: any) {
    console.error('Lyric error:', error)
    res.status(500).json({ error: error.message || 'Failed to get lyrics' })
  }
})

// Get hot chart (top 50)
app.get('/api/chart', async (req, res) => {
  try {
    const { platform = 'netease' } = req.query

    if (platform === 'netease') {
      const meting = new Meting('netease')
      const result = await meting.playlist('3778678')
      const data = JSON.parse(result)
      const tracks = (data?.playlist?.tracks || []).slice(0, 50)
      const formatted = tracks.map((t: any) => ({
        name: t.name,
        artist: (t.ar || []).map((a: any) => a.name),
        album: t.al?.name || '',
        pic_id: String(t.al?.pic || t.al?.id || ''),
        cover: t.al?.picUrl || '',
        url_id: String(t.id),
        id: String(t.id),
        duration: Math.floor((t.dt || 0) / 1000),
      }))
      res.json({ chart: '网易云热歌榜', platform: 'netease', songs: formatted })
    } else if (platform === 'qq') {
      const qqRes = await fetch(
        'https://c.y.qq.com/v8/fcg-bin/fcg_v8_toplist_cp.fcg?g_tk=5381&uin=0&format=json&inCharset=utf8&outCharset=utf-8&notice=0&platform=h5&needNewCode=1&tpl=3&page=detail&type=top&topid=26',
        {
          headers: {
            'Referer': 'https://y.qq.com',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          },
        }
      )
      const qqData = await qqRes.json()
      const songlist = (qqData?.songlist || []).slice(0, 50)

      // Build cover URLs using QQ Music CDN
      const getQQCover = (albummid: string) =>
        albummid ? `https://y.gtimg.cn/music/photo_new/T002R300x300M000${albummid}.jpg` : ''

      const formatted = songlist.map((item: any) => {
        const d = item.data
        return {
          name: d?.songname || '',
          artist: (d?.singer || []).map((s: any) => s.name || ''),
          album: d?.albumname || '',
          pic_id: d?.albummid || '',
          cover: getQQCover(d?.albummid || ''),
          url_id: String(d?.songid || ''),  // use numeric songid
          lyric_id: String(d?.songmid || d?.songid || ''),  // songmid for lyrics API
          id: String(d?.songid || ''),
          duration: d?.interval || 0,
        }
      })
      res.json({ chart: 'QQ音乐热歌榜', platform: 'qq', songs: formatted })
    } else {
      res.status(400).json({ error: 'Unsupported platform' })
    }
  } catch (error: any) {
    console.error('Chart error:', error)
    res.status(500).json({ error: error.message || 'Failed to get chart' })
  }
})
app.get('/api/audio-proxy', async (req, res) => {
  try {
    const { url } = req.query
    if (!url) {
      return res.status(400).json({ error: 'url is required' })
    }

    const decodedUrl = decodeURIComponent(url as string)
    const headers: Record<string, string> = {
      'Referer': 'https://music.163.com',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    }

    const range = req.headers.range
    if (range) {
      headers['Range'] = range
    }

    const response = await fetch(decodedUrl, { headers })

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch audio' })
    }

    const contentType = response.headers.get('content-type') || 'audio/mpeg'
    const contentLength = response.headers.get('content-length')
    const contentRange = response.headers.get('content-range')

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=3600')
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Accept-Ranges', 'bytes')

    if (response.status === 206 && contentRange) {
      res.setHeader('Content-Range', contentRange)
      res.status(206)
    } else if (contentLength) {
      res.setHeader('Content-Length', contentLength)
    }

    const reader = response.body!.getReader()
    const readable = new Readable({
      async read() {
        const { done, value } = await reader.read()
        if (done) {
          this.push(null)
        } else {
          this.push(Buffer.from(value))
        }
      },
    })
    readable.pipe(res)
  } catch (error: any) {
    console.error('Audio proxy error:', error)
    if (!res.headersSent) {
      res.status(500).json({ error: error.message || 'Failed to proxy audio' })
    }
  }
})

app.post('/api/ai-chat', async (req, res) => {
  try {
    const { messages, model = 'doubao-pro', max_tokens = 1024, temperature = 0.7 } = req.body
    
    const response = await fetch('https://api.doubao.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model,
        messages,
        max_tokens,
        temperature,
      }),
    })

    const data = await response.json()
    res.json(data)
  } catch (error: any) {
    console.error('AI chat error:', error)
    res.status(500).json({ error: error.message || 'Failed to chat with AI' })
  }
})

app.post('/api/db/song', async (req, res) => {
  try {
    const { platform, platformId, title, artist, album, cover, audioSrc, duration } = req.body
    if (!platform || !platformId || !title || !artist) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    const songId = await saveSong({ platform, platformId, title, artist, album, cover, audioSrc, duration })
    res.json({ songId })
  } catch (error: any) {
    console.error('Save song error:', error)
    res.status(500).json({ error: error.message || 'Failed to save song' })
  }
})

app.get('/api/db/song/:id', async (req, res) => {
  try {
    const song = await getSongById(parseInt(req.params.id))
    if (!song) {
      return res.status(404).json({ error: 'Song not found' })
    }
    res.json(song)
  } catch (error: any) {
    console.error('Get song error:', error)
    res.status(500).json({ error: error.message || 'Failed to get song' })
  }
})

app.get('/api/db/playlist', async (req, res) => {
  try {
    const playlistId = await getDefaultPlaylistId()
    const songs = await getPlaylistSongs(playlistId)
    res.json({ playlistId, songs })
  } catch (error: any) {
    console.error('Get playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to get playlist' })
  }
})

app.post('/api/db/playlist/add', async (req, res) => {
  try {
    const { songId } = req.body
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' })
    }
    const playlistId = await getDefaultPlaylistId()
    await addSongToPlaylist(playlistId, songId)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Add to playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to add song to playlist' })
  }
})

app.post('/api/db/playlist/remove', async (req, res) => {
  try {
    const { songId } = req.body
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' })
    }
    const playlistId = await getDefaultPlaylistId()
    await removeSongFromPlaylist(playlistId, songId)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Remove from playlist error:', error)
    res.status(500).json({ error: error.message || 'Failed to remove song from playlist' })
  }
})

app.post('/api/db/favorite/toggle', async (req, res) => {
  try {
    const { songId } = req.body
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' })
    }
    const isFav = await toggleFavorite(songId)
    res.json({ isFavorite: isFav })
  } catch (error: any) {
    console.error('Toggle favorite error:', error)
    res.status(500).json({ error: error.message || 'Failed to toggle favorite' })
  }
})

app.get('/api/db/favorite', async (req, res) => {
  try {
    const songs = await getFavorites()
    res.json(songs)
  } catch (error: any) {
    console.error('Get favorites error:', error)
    res.status(500).json({ error: error.message || 'Failed to get favorites' })
  }
})

app.get('/api/db/favorite/check/:songId', async (req, res) => {
  try {
    const isFav = await isFavorite(parseInt(req.params.songId))
    res.json({ isFavorite: isFav })
  } catch (error: any) {
    console.error('Check favorite error:', error)
    res.status(500).json({ error: error.message || 'Failed to check favorite' })
  }
})

app.post('/api/db/history/add', async (req, res) => {
  try {
    const { songId } = req.body
    if (!songId) {
      return res.status(400).json({ error: 'songId is required' })
    }
    await addPlayHistory(songId)
    res.json({ success: true })
  } catch (error: any) {
    console.error('Add history error:', error)
    res.status(500).json({ error: error.message || 'Failed to add play history' })
  }
})

app.get('/api/db/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit as string) || 20
    const songs = await getPlayHistory(limit)
    res.json(songs)
  } catch (error: any) {
    console.error('Get history error:', error)
    res.status(500).json({ error: error.message || 'Failed to get play history' })
  }
})

app.delete('/api/db/song/:id', async (req, res) => {
  try {
    const songId = parseInt(req.params.id)
    if (isNaN(songId)) {
      return res.status(400).json({ error: 'Invalid song ID' })
    }
    await deleteSongFromDatabase(songId)
    res.json({ success: true, message: 'Song deleted successfully' })
  } catch (error: any) {
    console.error('Delete song error:', error)
    res.status(500).json({ error: error.message || 'Failed to delete song' })
  }
})

app.use(express.static(path.join(__dirname, '../dist')))

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../dist', 'index.html'))
})

app.listen(PORT, () => {
  console.log(`🎵 Music API server running at http://localhost:${PORT}`)
})
