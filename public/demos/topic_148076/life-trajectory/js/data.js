const TRIP_DATA = [
  {
    id: 'beijing',
    city: '北京',
    country: '中国',
    startDate: '2019-03-15',
    endDate: '2019-03-20',
    duration: 5,
    transport: 'plane',
    transportLabel: '飞机',
    description: '第一次独自旅行，故宫的红墙',
    highlights: ['故宫', '长城', '颐和园', '南锣鼓巷'],
    photos: 32,
    position: { top: '22%', left: '18%' },
    year: 2019,
    season: '春',
    cover: 'forbidden-city'
  },
  {
    id: 'tokyo',
    city: '东京',
    country: '日本',
    startDate: '2019-08-01',
    endDate: '2019-08-08',
    duration: 7,
    transport: 'plane',
    transportLabel: '飞机',
    description: '夏日祭的烟火与拉面',
    highlights: ['浅草寺', '东京塔', '涩谷', '秋叶原'],
    photos: 56,
    position: { top: '28%', left: '62%' },
    year: 2019,
    season: '夏',
    cover: 'senso-ji'
  },
  {
    id: 'dali',
    city: '大理',
    country: '中国',
    startDate: '2020-10-10',
    endDate: '2020-10-14',
    duration: 4,
    transport: 'train',
    transportLabel: '高铁',
    description: '洱海边的日落与风花雪月',
    highlights: ['洱海', '古城', '苍山', '双廊'],
    photos: 45,
    position: { top: '50%', left: '32%' },
    year: 2020,
    season: '秋',
    cover: 'erhai-lake'
  },
  {
    id: 'chengdu',
    city: '成都',
    country: '中国',
    startDate: '2021-05-20',
    endDate: '2021-05-26',
    duration: 6,
    transport: 'train',
    transportLabel: '高铁',
    description: '熊猫基地与火锅美食之旅',
    highlights: ['大熊猫基地', '锦里', '宽窄巷子', '都江堰'],
    photos: 48,
    position: { top: '45%', left: '28%' },
    year: 2021,
    season: '春',
    cover: 'panda'
  },
  {
    id: 'shanghai',
    city: '上海',
    country: '中国',
    startDate: '2022-01-05',
    endDate: '2022-01-08',
    duration: 3,
    transport: 'train',
    transportLabel: '高铁',
    description: '外滩的夜景与都市繁华',
    highlights: ['外滩', '东方明珠', '田子坊', '豫园'],
    photos: 28,
    position: { top: '30%', left: '55%' },
    year: 2022,
    season: '冬',
    cover: 'bund'
  },
  {
    id: 'xian',
    city: '西安',
    country: '中国',
    startDate: '2022-09-12',
    endDate: '2022-09-17',
    duration: 5,
    transport: 'train',
    transportLabel: '高铁',
    description: '千年古都的历史回响',
    highlights: ['兵马俑', '大雁塔', '古城墙', '回民街'],
    photos: 36,
    position: { top: '35%', left: '22%' },
    year: 2022,
    season: '秋',
    cover: 'terracotta'
  },
  {
    id: 'xiamen',
    city: '厦门',
    country: '中国',
    startDate: '2023-04-08',
    endDate: '2023-04-12',
    duration: 4,
    transport: 'plane',
    transportLabel: '飞机',
    description: '鼓浪屿的文艺时光',
    highlights: ['鼓浪屿', '厦门大学', '曾厝垵', '环岛路'],
    photos: 40,
    position: { top: '55%', left: '58%' },
    year: 2023,
    season: '春',
    cover: 'gulangyu'
  },
  {
    id: 'lhasa',
    city: '拉萨',
    country: '中国',
    startDate: '2024-07-01',
    endDate: '2024-07-09',
    duration: 8,
    transport: 'plane',
    transportLabel: '飞机',
    description: '布达拉宫的圣洁与高原风光',
    highlights: ['布达拉宫', '大昭寺', '纳木错', '羊卓雍错'],
    photos: 64,
    position: { top: '38%', left: '12%' },
    year: 2024,
    season: '夏',
    cover: 'potala-palace'
  }
];

const TRANSPORT_TYPES = [
  { id: 'plane', label: '飞机', icon: '✈️' },
  { id: 'train', label: '高铁', icon: '🚄' },
  { id: 'car', label: '自驾', icon: '🚗' },
  { id: 'bus', label: '大巴', icon: '🚌' },
  { id: 'walk', label: '步行/骑行', icon: '🚶' }
];

const PHOTO_SAMPLES = [
  { id: 1, city: '东京', date: '2019.08.15', height: 280, tripId: 'tokyo' },
  { id: 2, city: '北京', date: '2021.03.22', height: 180, tripId: 'beijing' },
  { id: 3, city: '大理', date: '2022.06.10', height: 300, tripId: 'dali' },
  { id: 4, city: '巴黎', date: '2023.04.18', height: 220, tripId: 'paris' },
  { id: 5, city: '首尔', date: '2021.11.05', height: 190, tripId: 'seoul' },
  { id: 6, city: '东京', date: '2024.01.28', height: 320, tripId: 'tokyo' },
  { id: 7, city: '北京', date: '2023.09.12', height: 240, tripId: 'beijing' },
  { id: 8, city: '大理', date: '2022.07.20', height: 200, tripId: 'dali' },
  { id: 9, city: '成都', date: '2021.05.25', height: 260, tripId: 'chengdu' },
  { id: 10, city: '西安', date: '2022.09.15', height: 230, tripId: 'xian' },
  { id: 11, city: '厦门', date: '2023.04.10', height: 270, tripId: 'xiamen' },
  { id: 12, city: '拉萨', date: '2024.07.05', height: 310, tripId: 'lhasa' }
];

const PLAYBACK_CHAPTERS = [
  { id: 1, tripId: 'beijing', year: 2019, month: '03', city: '北京', season: '春', quote: '春天的故宫，红墙琉璃瓦下藏着百年故事', isCompleted: true, progress: 5 },
  { id: 2, tripId: 'tokyo', year: 2019, month: '08', city: '东京', season: '夏', quote: '夏日祭的烟火照亮了整个夜空', isActive: true, progress: 30 },
  { id: 3, tripId: 'dali', year: 2020, month: '10', city: '大理', season: '秋', quote: '洱海边的风，吹散了所有烦恼', isCompleted: false, progress: 60 },
  { id: 4, tripId: 'chengdu', year: 2021, month: '05', city: '成都', season: '春', quote: '熊猫的故乡，慢生活的开始', isCompleted: false, progress: 85 },
  { id: 5, tripId: 'lhasa', year: 2024, month: '07', city: '拉萨', season: '夏', quote: '离天空最近的地方，心灵的净土', isCompleted: false, progress: 100 }
];

function formatDate(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric' });
}

function getShortDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
}

function getYearMonth(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
}
