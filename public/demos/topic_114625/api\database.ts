import mysql from 'mysql2/promise'

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: 'zhou6895230',
  database: 'music_player',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
})

export async function initDatabase() {
  try {
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS songs (
        id INT AUTO_INCREMENT PRIMARY KEY,
        platform VARCHAR(20) NOT NULL,
        platform_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        artist VARCHAR(255) NOT NULL,
        album VARCHAR(255),
        cover VARCHAR(500),
        audio_src VARCHAR(500),
        duration INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY unique_song (platform, platform_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS playlists (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) DEFAULT '默认播放列表',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS playlist_items (
        id INT AUTO_INCREMENT PRIMARY KEY,
        playlist_id INT NOT NULL,
        song_id INT NOT NULL,
        position INT NOT NULL DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (playlist_id) REFERENCES playlists(id) ON DELETE CASCADE,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
        UNIQUE KEY unique_playlist_item (playlist_id, song_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    await pool.execute(`
    CREATE TABLE IF NOT EXISTS favorites (
      id INT AUTO_INCREMENT PRIMARY KEY,
      song_id INT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE,
      UNIQUE KEY unique_favorite (song_id)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `)

    await pool.execute(`
      CREATE TABLE IF NOT EXISTS play_history (
        id INT AUTO_INCREMENT PRIMARY KEY,
        song_id INT NOT NULL,
        played_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (song_id) REFERENCES songs(id) ON DELETE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
    `)

    const [defaultPlaylist] = await pool.query('SELECT id FROM playlists WHERE name = ?', ['默认播放列表'])
    if (!Array.isArray(defaultPlaylist) || defaultPlaylist.length === 0) {
      await pool.execute('INSERT INTO playlists (name) VALUES (?)', ['默认播放列表'])
    }

    const [songCount] = await pool.query('SELECT COUNT(*) as cnt FROM songs')
    if ((songCount as any)[0].cnt === 0) {
      const defaultSongs = [
        { platform: 'local', platform_id: '1', title: 'Midnight Dreams', artist: 'Luna Wavefield', cover: 'https://picsum.photos/seed/midnight/400/400', audio_src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', duration: 318 },
        { platform: 'local', platform_id: '2', title: 'Neon Rain', artist: 'Synth Aurora', cover: 'https://picsum.photos/seed/neonrain/400/400', audio_src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3', duration: 272 },
        { platform: 'local', platform_id: '3', title: 'Crystal Cave', artist: 'Echo Drift', cover: 'https://picsum.photos/seed/crystal/400/400', audio_src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3', duration: 425 },
        { platform: 'local', platform_id: '4', title: 'Silver Lining', artist: 'Solara', cover: 'https://picsum.photos/seed/silver/400/400', audio_src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3', duration: 356 },
        { platform: 'local', platform_id: '5', title: 'Urban Echo', artist: 'Beat Circuit', cover: 'https://picsum.photos/seed/urban/400/400', audio_src: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3', duration: 289 },
      ]
      for (const song of defaultSongs) {
        await pool.execute(
          'INSERT INTO songs (platform, platform_id, title, artist, cover, audio_src, duration) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [song.platform, song.platform_id, song.title, song.artist, song.cover, song.audio_src, song.duration]
        )
      }
      const [playlistResult] = await pool.query('SELECT id FROM playlists WHERE name = ?', ['默认播放列表'])
      if (Array.isArray(playlistResult) && playlistResult.length > 0) {
        const playlistId = (playlistResult[0] as any).id
        const [songRows] = await pool.query('SELECT id FROM songs ORDER BY id ASC')
        if (Array.isArray(songRows)) {
          for (let i = 0; i < songRows.length; i++) {
            await pool.execute('INSERT INTO playlist_items (playlist_id, song_id, position) VALUES (?, ?, ?)', [playlistId, (songRows[i] as any).id, i + 1])
          }
        }
      }
      console.log('Default songs inserted successfully')
    }

    console.log('Database initialized successfully')
  } catch (error) {
    console.error('Database initialization failed:', error)
  }
}

export async function getDefaultPlaylistId(): Promise<number> {
  const [rows] = await pool.query('SELECT id FROM playlists WHERE name = ?', ['默认播放列表'])
  if (Array.isArray(rows) && rows.length > 0) {
    return (rows[0] as any).id
  }
  const [result] = await pool.execute('INSERT INTO playlists (name) VALUES (?)', ['默认播放列表'])
  return (result as any).insertId
}

export interface SongRecord {
  id: number
  platform: string
  platform_id: string
  title: string
  artist: string
  album: string | null
  cover: string | null
  audio_src: string | null
  duration: number
}

export async function saveSong(song: {
  platform: string
  platformId: string
  title: string
  artist: string
  album?: string
  cover?: string
  audioSrc?: string
  duration?: number
}): Promise<number> {
  try {
    const [result] = await pool.execute(
      'INSERT INTO songs (platform, platform_id, title, artist, album, cover, audio_src, duration) VALUES (?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE title = VALUES(title), artist = VALUES(artist), album = VALUES(album), cover = VALUES(cover), audio_src = VALUES(audio_src), duration = VALUES(duration)',
      [song.platform, song.platformId, song.title, song.artist, song.album || null, song.cover || null, song.audioSrc || null, song.duration || 0]
    )
    const insertId = (result as any).insertId
    if (insertId) return insertId

    const [rows] = await pool.query('SELECT id FROM songs WHERE platform = ? AND platform_id = ?', [song.platform, song.platformId])
    if (Array.isArray(rows) && rows.length > 0) {
      return (rows[0] as any).id
    }
    return 0
  } catch {
    return 0
  }
}

export async function getSongById(id: number): Promise<SongRecord | null> {
  const [rows] = await pool.query('SELECT * FROM songs WHERE id = ?', [id])
  if (Array.isArray(rows) && rows.length > 0) {
    return rows[0] as SongRecord
  }
  return null
}

export async function getPlaylistSongs(playlistId: number): Promise<SongRecord[]> {
  const [rows] = await pool.query(`
    SELECT s.* FROM songs s
    JOIN playlist_items pi ON s.id = pi.song_id
    WHERE pi.playlist_id = ?
    ORDER BY pi.position ASC
  `, [playlistId])
  return rows as SongRecord[]
}

export async function addSongToPlaylist(playlistId: number, songId: number): Promise<void> {
  const [count] = await pool.query('SELECT COUNT(*) as cnt FROM playlist_items WHERE playlist_id = ? AND song_id = ?', [playlistId, songId])
  if ((count as any)[0].cnt === 0) {
    const [pos] = await pool.query('SELECT COALESCE(MAX(position), 0) as max_pos FROM playlist_items WHERE playlist_id = ?', [playlistId])
    const position = ((pos as any)[0].max_pos || 0) + 1
    await pool.execute('INSERT INTO playlist_items (playlist_id, song_id, position) VALUES (?, ?, ?)', [playlistId, songId, position])
  }
}

export async function removeSongFromPlaylist(playlistId: number, songId: number): Promise<void> {
  await pool.execute('DELETE FROM playlist_items WHERE playlist_id = ? AND song_id = ?', [playlistId, songId])
  await pool.execute(`
    UPDATE playlist_items 
    SET position = position - 1 
    WHERE playlist_id = ? AND position > (SELECT position FROM playlist_items WHERE playlist_id = ? AND song_id = ?)
  `, [playlistId, playlistId, songId])
}

export async function deleteSongFromDatabase(songId: number): Promise<void> {
  await pool.execute('DELETE FROM songs WHERE id = ?', [songId])
}

export async function isFavorite(songId: number): Promise<boolean> {
  const [rows] = await pool.query('SELECT id FROM favorites WHERE song_id = ?', [songId])
  return Array.isArray(rows) && rows.length > 0
}

export async function toggleFavorite(songId: number): Promise<boolean> {
  const exists = await isFavorite(songId)
  if (exists) {
    await pool.execute('DELETE FROM favorites WHERE song_id = ?', [songId])
    return false
  } else {
    await pool.execute('INSERT INTO favorites (song_id) VALUES (?)', [songId])
    return true
  }
}

export async function getFavorites(): Promise<SongRecord[]> {
  const [rows] = await pool.query(`
    SELECT s.* FROM songs s
    JOIN favorites f ON s.id = f.song_id
    ORDER BY f.created_at DESC
  `)
  return rows as SongRecord[]
}

export async function addPlayHistory(songId: number): Promise<void> {
  await pool.execute('INSERT INTO play_history (song_id) VALUES (?)', [songId])
}

export async function getPlayHistory(limit: number = 20): Promise<SongRecord[]> {
  const [rows] = await pool.query(`
    SELECT DISTINCT s.* FROM songs s
    JOIN play_history ph ON s.id = ph.song_id
    ORDER BY ph.played_at DESC
    LIMIT ?
  `, [limit])
  return rows as SongRecord[]
}

export default pool
