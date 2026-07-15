import type { TemplateCategory } from '@/types'

const TITLES: Record<TemplateCategory, string[]> = {
  'square-dance': [
    '最美夕阳红，《映山红》广场舞跳起来',
    '大妈舞团精彩演绎《最炫民族风》，活力满满',
    '小区花园广场舞，姐妹们的快乐时光',
    '每天跳30分钟，身体好心情更好',
    '经典红歌广场舞，跳出健康与美丽',
    '《站在草原望北京》团队版广场舞'
  ],
  'countryside': [
    '乡下菜园大丰收，这才是真正的田园生活',
    '老家的院子，种满了瓜果和回忆',
    '带着孙子下地摘菜，最简单的幸福',
    '田间地头随手拍，秋天的颜色真美',
    '农村的清晨，空气里都是稻香',
    '自家果园的桃子熟了，脆甜又多汁'
  ],
  'cooking': [
    '老妈拿手红烧肉，肥而不腻入口即化',
    '今天做一道红烧鱼，全家都爱吃',
    '地道北方手擀面，配上卤子太香了',
    '家常菜醋溜土豆丝，简单又下饭',
    '端午必吃的粽子，外婆的老配方',
    '早餐豆浆配油条，自己做的最健康'
  ],
  'family': [
    '全家福来了，一家人整整齐齐最重要',
    '孙子孙女回家，爷爷奶奶笑得合不拢嘴',
    '三代同堂的周末，家的味道',
    '金婚五十年，爸妈的爱情故事',
    '老战友聚会，岁月不改兄弟情',
    '第一次抱孙子，激动得手都抖了'
  ]
}

const HASHTAGS: Record<TemplateCategory, string[]> = {
  'square-dance': ['#广场舞', '#老年人生活', '#运动健身', '#快乐晚年', '#经典老歌', '#姐妹团'],
  'countryside': ['#田园生活', '#农村日常', '#我的老家', '#丰收的喜悦', '#菜园日记', '#乡愁'],
  'cooking': ['#家常菜', '#厨房日记', '#美食分享', '#今天吃什么', '#妈妈的味道', '#老年人美食'],
  'family': ['#家庭日常', '#一家老小', '#祖孙乐', '#幸福时光', '#难忘的回忆', '#我爱我家']
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

export function generateTitle(category: TemplateCategory): string {
  return pick(TITLES[category])
}

export function generateHashtags(category: TemplateCategory, count = 4): string[] {
  const pool = [...HASHTAGS[category]]
  const result: string[] = []
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length)
    result.push(pool.splice(idx, 1)[0])
  }
  return result
}

export function generateSubtitle(category: TemplateCategory, materialCount: number): string {
  const s = TITLES[category][0]
  return `❤️ ${s}\n\n欢迎大家点赞👍 收藏⭐ 转发给更多朋友\n关注我，每天分享精彩生活！`
}
