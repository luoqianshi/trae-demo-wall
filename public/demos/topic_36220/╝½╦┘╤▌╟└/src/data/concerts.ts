import { ConcertTier } from '../context/AppContext'

export interface Concert {
  id: string
  artist: string
  concertName: string
  city: string
  date: string
  hotWeight: number
  expectedUsers: number
  tier: ConcertTier
  emoji: string
}

// AI 模拟抢票场景数据（非真实演出，按热度分类）
const SCENARIO_BASES: Omit<Concert, 'date'>[] = [
  // 超热门场景
  { id: 's01', artist: '周杰伦（超热门）', concertName: '超热门演唱会模拟场景', city: '模拟城市', hotWeight: 0.95, expectedUsers: 1280000, tier: 'hot', emoji: '🎤' },
  { id: 's02', artist: '五月天（超热门）', concertName: '超热门演唱会模拟场景', city: '模拟城市', hotWeight: 0.92, expectedUsers: 980000, tier: 'hot', emoji: '🎸' },
  { id: 's03', artist: 'Taylor Swift（国际顶流）', concertName: '国际顶流演唱会模拟场景', city: '模拟城市', hotWeight: 0.97, expectedUsers: 1560000, tier: 'hot', emoji: '✨' },
  { id: 's04', artist: '林俊杰（超热门）', concertName: '超热门演唱会模拟场景', city: '模拟城市', hotWeight: 0.88, expectedUsers: 720000, tier: 'hot', emoji: '🎹' },

  // 热门场景
  { id: 's05', artist: '陈奕迅（热门）', concertName: '热门演唱会模拟场景', city: '模拟城市', hotWeight: 0.78, expectedUsers: 350000, tier: 'hot', emoji: '🎭' },
  { id: 's06', artist: '薛之谦（热门）', concertName: '热门演唱会模拟场景', city: '模拟城市', hotWeight: 0.85, expectedUsers: 560000, tier: 'hot', emoji: '🌌' },
  { id: 's07', artist: '邓紫棋（热门）', concertName: '热门演唱会模拟场景', city: '模拟城市', hotWeight: 0.83, expectedUsers: 480000, tier: 'hot', emoji: '👑' },

  // 普通场景
  { id: 's08', artist: '华语流行歌手（普通）', concertName: '普通热度演唱会模拟场景', city: '模拟城市', hotWeight: 0.55, expectedUsers: 85000, tier: 'normal', emoji: '🎵' },
  { id: 's09', artist: '新生代偶像（普通）', concertName: '普通热度演唱会模拟场景', city: '模拟城市', hotWeight: 0.48, expectedUsers: 62000, tier: 'normal', emoji: '💫' },
  { id: 's10', artist: '摇滚乐队（普通）', concertName: '普通热度演唱会模拟场景', city: '模拟城市', hotWeight: 0.42, expectedUsers: 45000, tier: 'normal', emoji: '🤘' },

  // 冷门场景
  { id: 's11', artist: '独立乐队（冷门）', concertName: '冷门演唱会模拟场景', city: '模拟城市', hotWeight: 0.22, expectedUsers: 8500, tier: 'cold', emoji: '🐦' },
  { id: 's12', artist: 'Livehouse演出（冷门）', concertName: 'Livehouse模拟场景', city: '模拟城市', hotWeight: 0.18, expectedUsers: 4200, tier: 'cold', emoji: '🌅' },
  { id: 's13', artist: '爵士现场（冷门）', concertName: '冷门演唱会模拟场景', city: '模拟城市', hotWeight: 0.15, expectedUsers: 3200, tier: 'cold', emoji: '🎷' },
  { id: 's14', artist: '民谣巡演（冷门）', concertName: '冷门演唱会模拟场景', city: '模拟城市', hotWeight: 0.25, expectedUsers: 12000, tier: 'cold', emoji: '🍂' },
]

// 动态生成一个未来的模拟日期（仅用于内部逻辑，不展示）
function getSimulatedDate(index: number): string {
  const d = new Date()
  d.setDate(d.getDate() + 7 + index * 3)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

// 获取 AI 模拟抢票场景
export function getScenarios(): Concert[] {
  return SCENARIO_BASES.map((base, i) => ({
    ...base,
    date: getSimulatedDate(i),
  }))
}

// 兼容旧接口：所有场景
export const FUTURE_CONCERTS: Concert[] = getScenarios()

// 随机推荐一组场景
export function getRandomConcerts(count: number = 6): Concert[] {
  const all = getScenarios()
  const shuffled = [...all].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}
