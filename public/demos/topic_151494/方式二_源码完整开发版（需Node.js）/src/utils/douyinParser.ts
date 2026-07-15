import type { DouyinVideo } from '@/types'
import { mockVideos } from '@/mock/videos'

export function parseDouyinLink(link: string): string | null {
  if (!link) return null
  // 提取抖音链接中的 video id
  const patterns = [
    /(?:v\.douyin\.com|iesdouyin\.com)\/(?:share\/video|video)\/(\d+)/i,
    /v\.douyin\.com\/([a-zA-Z0-9]+)/i,
    /\/video\/(\d+)/,
    /\b(\d{15,22})\b/
  ]
  for (const p of patterns) {
    const m = link.match(p)
    if (m) return m[1]
  }
  // 如果直接输入一个id号
  if (/^\d{5,}$/.test(link.trim())) return link.trim()
  return null
}

export function mockParseDouyinLink(link: string): Promise<DouyinVideo> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const id = parseDouyinLink(link)
      const pool = mockVideos
      let video = id ? pool.find(v => v.id === id || v.id.endsWith(id.slice(-3))) : undefined
      if (!video) {
        // 如果没找到，根据关键词匹配
        const text = link.toLowerCase()
        if (/诈骗|刷单|养老理财|保健品/.test(text)) {
          video = pool.find(v => v.category === 'fraud-demo')
        } else if (/广场|舞/.test(text)) {
          video = pool.find(v => v.category === 'square-dance')
        } else if (/戏曲|京剧|豫剧/.test(text)) {
          video = pool.find(v => v.category === 'opera')
        } else if (/养生|健康/.test(text)) {
          video = pool.find(v => v.category === 'health')
        } else if (/菜|烹饪|美食/.test(text)) {
          video = pool.find(v => v.category === 'food')
        }
      }
      if (!video) {
        // 随机给一个
        video = pool[Math.floor(Math.random() * (pool.length - 1))]
      }
      if (video) resolve(video)
      else reject(new Error('无法解析此链接'))
    }, 900)
  })
}
