// 8 种心情的视觉与行为配置
// 调色板采用 CSS 渐变方向，粒子模式由 particles.js 解释
window.MOODS = [
  {
    id: 'happy',
    name: '开心',
    en: 'Joyful',
    desc: '像汽水开盖的午后',
    icon: '☀️',
    palette: { from: '#FFB347', to: '#FF6F91', accent: '#FFE066', bg: '#1A0F1F' },
    particle: 'fountain',
    scale: [0, 2, 4, 5, 7, 9, 11],         // Lydian 大调 明亮
    bpm: 110,
    songs: ['s1', 's2', 's3']
  },
  {
    id: 'sad',
    name: '难过',
    en: 'Melancholy',
    desc: '窗外的雨和没说完的话',
    icon: '🌧️',
    palette: { from: '#4F6D8E', to: '#7A6E8F', accent: '#A3B5CC', bg: '#0E1320' },
    particle: 'rain',
    scale: [0, 2, 3, 5, 7, 8, 10],         // minor 自然小调
    bpm: 72,
    songs: ['s4', 's5', 's6']
  },
  {
    id: 'relax',
    name: '放松',
    en: 'Relaxed',
    desc: '咖啡凉了也没关系',
    icon: '🍃',
    palette: { from: '#7BD3B5', to: '#F4EEDD', accent: '#FFFFFF', bg: '#0F1A18' },
    particle: 'bubble',
    scale: [0, 2, 4, 7, 9],                 // pentatonic 五声
    bpm: 80,
    songs: ['s7', 's8']
  },
  {
    id: 'romance',
    name: '浪漫',
    en: 'Romance',
    desc: '这一刻只属于我们',
    icon: '💗',
    palette: { from: '#FF7EB6', to: '#B388EB', accent: '#FFD3E0', bg: '#170C20' },
    particle: 'heart',
    scale: [0, 2, 4, 5, 7, 9, 11],
    bpm: 92,
    songs: ['s9', 's10']
  },
  {
    id: 'nostalgia',
    name: '怀旧',
    en: 'Nostalgic',
    desc: '老唱针划过的旧时光',
    icon: '📻',
    palette: { from: '#D4A24C', to: '#8B5A2B', accent: '#F2D199', bg: '#150D08' },
    particle: 'grain',
    scale: [0, 2, 4, 5, 7, 9, 10],
    bpm: 84,
    songs: ['s11', 's12']
  },
  {
    id: 'energy',
    name: '元气',
    en: 'Energetic',
    desc: '此刻不跳更待何时',
    icon: '⚡',
    palette: { from: '#FCEE21', to: '#A8E063', accent: '#FFFFFF', bg: '#101A0A' },
    particle: 'bounce',
    scale: [0, 2, 4, 7, 9, 11],             // 大六度
    bpm: 128,
    songs: ['s13', 's14']
  },
  {
    id: 'blue',
    name: '忧郁',
    en: 'Blue',
    desc: '夜晚的河与远方的灯',
    icon: '🌌',
    palette: { from: '#1A2A4F', to: '#4A6FA5', accent: '#9FB4D9', bg: '#070B1A' },
    particle: 'orbit',
    scale: [0, 1, 3, 5, 6, 8, 10],         // minor
    bpm: 70,
    songs: ['s15']
  },
  {
    id: 'heal',
    name: '治愈',
    en: 'Healing',
    desc: '没关系，明天也会来',
    icon: '🕊️',
    palette: { from: '#F5E6D3', to: '#FFD6E0', accent: '#FFFFFF', bg: '#1A1216' },
    particle: 'feather',
    scale: [0, 2, 4, 7, 9],
    bpm: 76,
    songs: ['s16']
  }
];
