export interface Track {
  id: number | string
  title: string
  artist: string
  cover: string
  audioSrc: string
  duration: number
  _platform?: string
  _lyricId?: string
}

export const tracks: Track[] = [
  {
    id: 1,
    title: 'Midnight Dreams',
    artist: 'Luna Wavefield',
    cover: 'https://picsum.photos/seed/midnight/400/400',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
    duration: 318,
  },
  {
    id: 2,
    title: 'Neon Rain',
    artist: 'Synth Aurora',
    cover: 'https://picsum.photos/seed/neonrain/400/400',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
    duration: 272,
  },
  {
    id: 3,
    title: 'Crystal Cave',
    artist: 'Echo Drift',
    cover: 'https://picsum.photos/seed/crystal/400/400',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
    duration: 425,
  },
  {
    id: 4,
    title: 'Silver Lining',
    artist: 'Solara',
    cover: 'https://picsum.photos/seed/silver/400/400',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-4.mp3',
    duration: 356,
  },
  {
    id: 5,
    title: 'Urban Echo',
    artist: 'Beat Circuit',
    cover: 'https://picsum.photos/seed/urban/400/400',
    audioSrc: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-5.mp3',
    duration: 289,
  },
]
