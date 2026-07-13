import type { ComfyProject } from '../api/project-api'

/** 判断 URL 是否是视频（用于挑缩略图时排除） */
function isVideoUrl(url: string): boolean {
  const lower = url.toLowerCase()
  return /\.(mp4|webm|mov|avi|mkv|m4v)$/.test(lower)
}

/**
 * 从画布 graphJson 中提取缩略图 URL。
 * 挑选顺序：assetNode → multiImageOutputNode → promptBatchNode
 * 每个节点优先取 baselineUrls[0]（对应 AssetNode 的原始底图），退回 urls[0]。
 * 会过滤：视频、blob:开头（本地占位）、包含 _temp_ 的编辑中间态。
 *
 * 不解析失败时返回 undefined。
 */
export function extractThumbnailUrl(graphJson?: string): string | undefined {
  if (!graphJson) return undefined
  let parsed: unknown
  try {
    parsed = JSON.parse(graphJson)
  } catch {
    return undefined
  }
  if (!parsed || typeof parsed !== 'object') return undefined
  const nodes = (parsed as { nodes?: unknown }).nodes
  if (!Array.isArray(nodes)) return undefined

  const priority = ['assetNode', 'multiImageOutputNode', 'promptBatchNode']

  for (const type of priority) {
    for (const rawNode of nodes) {
      if (!rawNode || typeof rawNode !== 'object') continue
      const n = rawNode as { type?: string; data?: { urls?: unknown; baselineUrls?: unknown } }
      if (n.type !== type) continue
      const data = n.data
      if (!data) continue
      const candidates: unknown[] = []
      if (Array.isArray(data.baselineUrls)) candidates.push(...data.baselineUrls)
      if (Array.isArray(data.urls)) candidates.push(...data.urls)
      for (const c of candidates) {
        if (typeof c !== 'string' || !c) continue
        if (c.startsWith('blob:')) continue
        if (c.includes('_temp_')) continue
        if (isVideoUrl(c)) continue
        return c
      }
    }
  }
  return undefined
}

/** 便捷版本：给 ComfyProject 拿缩略图 */
export function getProjectThumbnail(project: ComfyProject): string | undefined {
  return extractThumbnailUrl(project.graphJson)
}
