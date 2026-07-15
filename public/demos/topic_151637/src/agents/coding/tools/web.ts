/**
 * Web 工具 — 搜索和获取网页内容（OpenCode 风格重构）。
 *
 * 搜索后端：DuckDuckGo HTML 版（优先）→ Bing HTML 抓取（回退）
 * 内容提取：HTML → Markdown 转换 + 主体内容提取（readability 风格）
 * 格式化：编号列表 + 结构化 JSON 摘要，针对 LLM 消费优化
 *
 * 设计参考：OpenCode (sst/opencode) 的 websearch.ts / webfetch.ts
 */

import type { ToolResult } from '../types'

// ============================================================
// 常量
// ============================================================

const UA_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36'
const UA_OPENA = 'datapilot/1.0'

const SEARCH_TIMEOUT_MS = 15_000
const FETCH_TIMEOUT_MS = 20_000
const MAX_FETCH_CHARS = 15000 // web_fetch 最大输出字符数（OpenCode 默认 10000）

interface SearchResult {
  title: string
  url: string
  snippet: string
}

// ============================================================
// HTML → Markdown 轻量转换（纯 JS，无依赖）
// ============================================================

/**
 * 将 HTML 转换为易读的 Markdown 格式。
 * 参考 OpenCode 的 turndown 配置：atx 标题、fenced 代码块、- 列表。
 */
function htmlToMarkdown(html: string): string {
  let text = html

  // 1. 移除不需要的标签及其内容
  const removeTags = ['script', 'style', 'noscript', 'iframe', 'object', 'embed', 'nav', 'footer', 'header']
  for (const tag of removeTags) {
    text = text.replace(new RegExp(`<${tag}[^>]*>[\\s\\S]*?<\\/${tag}>`, 'gi'), '')
  }

  // 2. 提取 <title>
  const titleMatch = text.match(/<title[^>]*>([\s\S]*?)<\/title>/i)
  const pageTitle = titleMatch ? decodeEntities(titleMatch[1].trim()) : ''

  // 3. 移除 HTML 注释
  text = text.replace(/<!--[\s\S]*?-->/g, '')

  // 4. 替换块级标签为换行 + Markdown 标记
  text = text.replace(/<br\s*\/?>/gi, '\n')
  text = text.replace(/<\/p>/gi, '\n\n')
  text = text.replace(/<\/h[1-6]>/gi, '\n\n')
  text = text.replace(/<\/li>/gi, '\n')
  text = text.replace(/<\/tr>/gi, '\n')
  text = text.replace(/<\/div>/gi, '\n')
  text = text.replace(/<\/section>/gi, '\n')
  text = text.replace(/<\/article>/gi, '\n')

  // 5. 替换行内标签
  text = text.replace(/<strong[^>]*>/gi, '**')
  text = text.replace(/<\/strong>/gi, '**')
  text = text.replace(/<b[^>]*>/gi, '**')
  text = text.replace(/<\/b>/gi, '**')
  text = text.replace(/<em[^>]*>/gi, '*')
  text = text.replace(/<\/em>/gi, '*')
  text = text.replace(/<i[^>]*>/gi, '*')
  text = text.replace(/<\/i>/gi, '*')
  text = text.replace(/<code[^>]*>/gi, '`')
  text = text.replace(/<\/code>/gi, '`')

  // 6. 链接转换 [text](url)
  text = text.replace(/<a[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi, (_, url, inner) => {
    const label = stripTagsOnly(inner).trim()
    if (label && !url.startsWith('javascript')) {
      return `[${label}](${url})`
    }
    return url
  })

  // 7. 图片转换 ![alt](url)
  text = text.replace(/<img[^>]*alt="([^"]*)"[^>]*src="([^"]*)"[^>]*>/gi, '![$1]($2)')
  text = text.replace(/<img[^>]*src="([^"]*)"[^>]*alt="([^"]*)"[^>]*>/gi, '![$2]($1)')

  // 8. 标题转换
  for (let h = 1; h <= 6; h++) {
    const prefix = '#'.repeat(h) + ' '
    text = text.replace(new RegExp(`<h${h}[^>]*>([\\s\\S]*?)<\\/h${h}>`, 'gi'), (_, content) => {
      return '\n\n' + prefix + stripTagsOnly(content).trim() + '\n\n'
    })
  }

  // 9. 列表项转换
  text = text.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_, content) => '- ' + stripTagsOnly(content).trim() + '\n')

  // 10. 移除所有剩余 HTML 标签
  text = text.replace(/<[^>]*>/g, ' ')

  // 11. 解码 HTML 实体
  text = decodeEntities(text)

  // 12. 清理空白：合并多余换行，但保留段落间距
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/gm, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  // 13. 添加页面标题
  if (pageTitle && !text.startsWith(pageTitle)) {
    text = `# ${pageTitle}\n\n${text}`
  }

  return text
}

/** 仅移除 HTML 标签，不解码实体 */
function stripTagsOnly(html: string): string {
  return html.replace(/<[^>]*>/g, ' ')
}

/** 解码常见 HTML 实体 */
function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&#x27;/g, "'")
}

/**
 * 提取页面主体内容（readability 风格）。
 * 优先使用 <main>、<article>、[role="main"] 内容，
 * 回退到 <body> 中去除导航/页脚后的内容。
 */
function extractMainContent(html: string): string {
  // 优先：<main> 或 <article> 标签
  const mainMatch = html.match(/<main[^>]*>([\s\S]*?)<\/main>/i)
  if (mainMatch) return mainMatch[1]

  const articleMatch = html.match(/<article[^>]*>([\s\S]*?)<\/article>/i)
  if (articleMatch) return articleMatch[1]

  // 其次：role="main"
  const roleMatch = html.match(/<[^>]*role="main"[^>]*>([\s\S]*?)<\/(div|section)>/i)
  if (roleMatch) return roleMatch[1]

  // 回退：提取 <body>，去除 nav/footer/header
  const bodyMatch = html.match(/<body[^>]*>([\s\S]*?)<\/body>/i)
  if (bodyMatch) {
    let body = bodyMatch[1]
    // 移除导航区域
    body = body.replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
    body = body.replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
    body = body.replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
    return body
  }

  return html
}

// ============================================================
// 搜索后端
// ============================================================

/**
 * DuckDuckGo HTML 版搜索。
 * 解析 class="result__body" 结构。
 */
async function searchDuckDuckGo(query: string, num: number): Promise<SearchResult[]> {
  const url = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`

  const response = await fetch(url, {
    headers: {
      'User-Agent': UA_CHROME,
      Accept: 'text/html,application/xhtml+xml',
    },
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  })

  const html = await response.text()
  if (html.length < 200) throw new Error('DuckDuckGo returned empty response')

  const results: SearchResult[] = []

  // 解析 class="result__body" 结构
  const resultBlocks = html.split(/class="result__body"/i)
  for (let i = 1; i < resultBlocks.length && results.length < num; i++) {
    const block = resultBlocks[i]
    const linkMatch = block.match(/<a[^>]*href="([^"]*)"[^>]*class="result__a"[^>]*>([\s\S]*?)<\/a>/i)
    const snippetMatch = block.match(/class="result__snippet"[^>]*>([\s\S]*?)<\//i)

    if (linkMatch) {
      const url = linkMatch[1]
      const title = decodeEntities(stripTagsOnly(linkMatch[2] || '')).trim()
      const snippet = snippetMatch ? decodeEntities(stripTagsOnly(snippetMatch[1])).trim() : ''
      if (title.length > 3) {
        results.push({ title, url, snippet })
      }
    }
  }

  // 回退：简单 <a> 标签解析
  if (results.length === 0) {
    const linkRegex = /<a[^>]*href="(https?:\/\/[^"]*)"[^>]*>([^<]*)<\/a>/gi
    const seen = new Set<string>()
    let m: RegExpExecArray | null
    while ((m = linkRegex.exec(html)) !== null && results.length < num) {
      const url = m[1]
      const title = decodeEntities(m[2]).trim()
      if (url.includes('duckduckgo.com') || title.length < 5 || seen.has(url)) continue
      seen.add(url)
      results.push({ title, url, snippet: '' })
    }
  }

  return results
}

/**
 * Bing 搜索（回退，纯 HTML 抓取）。
 */
async function searchBing(query: string, num: number): Promise<SearchResult[]> {
  const url = `https://www.bing.com/search?q=${encodeURIComponent(query)}&setlang=zh-cn`

  const response = await fetch(url, {
    headers: {
      'User-Agent': UA_CHROME,
      Accept: 'text/html',
      'Accept-Language': 'zh-CN,zh;q=0.9',
    },
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  })

  const html = await response.text()
  const results: SearchResult[] = []

  const algoBlocks = html.split(/<li[^>]*class="b_algo"[^>]*>/i)
  for (let i = 1; i < algoBlocks.length && results.length < num; i++) {
    const block = algoBlocks[i]
    const linkMatch = block.match(/<a[^>]*href="(https?:\/\/[^"]*)"[^>]*>([\s\S]*?)<\/a>/i)
    const snippetMatch = block.match(/<p[^>]*>([\s\S]*?)<\/p>/i)

    if (linkMatch) {
      const url = linkMatch[1]
      const title = decodeEntities(stripTagsOnly(linkMatch[2] || '')).trim()
      const snippet = snippetMatch ? decodeEntities(stripTagsOnly(snippetMatch[1])).trim() : ''
      if (title.length > 3) {
        results.push({ title, url, snippet })
      }
    }
  }

  return results
}

// ============================================================
// 简单内存缓存
// ============================================================

const cache = new Map<string, { data: SearchResult[]; ts: number }>()
const CACHE_TTL_MS = 60_000 // 1 分钟

function getCached(key: string): SearchResult[] | null {
  const entry = cache.get(key)
  if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
    return entry.data
  }
  cache.delete(key)
  return null
}

function setCache(key: string, data: SearchResult[]): void {
  cache.set(key, { data, ts: Date.now() })
  // 限制缓存大小
  if (cache.size > 50) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts)[0]
    if (oldest) cache.delete(oldest[0])
  }
}

// ============================================================
// 格式化
// ============================================================

function formatSearchResults(query: string, results: SearchResult[], durationMs: number): string {
  if (results.length === 0) {
    return `未找到与 "${query}" 相关的结果。\n\n建议：\n- 换用更具体的关键词重新搜索\n- 使用英文关键词搜索国际数据\n- 使用 web_fetch 直接访问已知数据源（如 stats.gov.cn、worldbank.org 等）`
  }

  const lines: string[] = [
    `搜索 "${query}" 返回 ${results.length} 条结果 (${durationMs}ms):\n`,
  ]

  results.forEach((r, i) => {
    lines.push(`[${i + 1}] **${r.title}**`)
    lines.push(`    URL: ${r.url}`)
    if (r.snippet) {
      lines.push(`    摘要: ${r.snippet}`)
    }
    lines.push('')
  })

  // 附加 JSON 摘要（供 Python 解析）
  lines.push('---')
  lines.push('## 结构化摘要（JSON 格式，可复制到 Python 中解析）')
  lines.push('```json')
  lines.push(JSON.stringify(
    results.map((r) => ({ title: r.title, url: r.url, snippet: r.snippet })),
    null,
    2
  ))
  lines.push('```')

  return lines.join('\n')
}

// ============================================================
// 公开工具函数
// ============================================================

export async function executeWebSearchTool(
  id: string,
  args: { query: string; num?: number }
): Promise<ToolResult> {
  const startTime = Date.now()
  const num = Math.min(args.num || 8, 10)
  const cacheKey = `search:${args.query}:${num}`

  // 检查缓存
  const cached = getCached(cacheKey)
  if (cached) {
    return {
      toolCallId: id,
      name: 'web_search',
      success: true,
      output: formatSearchResults(args.query, cached, 0) + '\n\n*(缓存命中)*',
    }
  }

  try {
    let results: SearchResult[]

    // 先尝试 DuckDuckGo
    try {
      results = await searchDuckDuckGo(args.query, num)
    } catch (_ddgErr) {
      // 回退到 Bing
      try {
        results = await searchBing(args.query, num)
      } catch (_bingErr) {
        const ddgMsg = _ddgErr instanceof Error ? _ddgErr.message : String(_ddgErr)
        const bingMsg = _bingErr instanceof Error ? _bingErr.message : String(_bingErr)
        return {
          toolCallId: id,
          name: 'web_search',
          success: false,
          output: `搜索失败。\n\nDuckDuckGo: ${ddgMsg}\nBing: ${bingMsg}\n\n建议：\n- 检查网络连接\n- 换用更具体的关键词\n- 使用 web_fetch 直接访问已知网站`,
          error: `DDG: ${ddgMsg}; Bing: ${bingMsg}`,
        }
      }
    }

    // 缓存结果
    if (results.length > 0) {
      setCache(cacheKey, results)
    }

    const durationMs = Date.now() - startTime
    return {
      toolCallId: id,
      name: 'web_search',
      success: true,
      output: formatSearchResults(args.query, results, durationMs),
    }
  } catch (err) {
    return {
      toolCallId: id,
      name: 'web_search',
      success: false,
      output: `搜索失败: ${err instanceof Error ? err.message : String(err)}`,
      error: err instanceof Error ? err.message : String(err),
    }
  }
}

export async function executeWebFetchTool(
  id: string,
  args: { url: string }
): Promise<ToolResult> {
  const startTime = Date.now()

  try {
    // 首次请求使用 Chrome UA
    let response = await fetch(args.url, {
      headers: {
        'User-Agent': UA_CHROME,
        Accept: 'text/html,application/xhtml+xml',
        'Accept-Language': 'zh-CN,zh;q=0.9',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    })

    // 反爬：如果遇到 Cloudflare 403，用简化 UA 重试
    if (response.status === 403 || response.status === 429) {
      response = await fetch(args.url, {
        headers: {
          'User-Agent': UA_OPENA,
          Accept: 'text/html,application/xhtml+xml',
        },
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      })
    }

    if (!response.ok) {
      return {
        toolCallId: id,
        name: 'web_fetch',
        success: false,
        output: `获取网页失败: HTTP ${response.status} ${response.statusText}\nURL: ${args.url}\n\n建议: 尝试用 web_search 搜索相关内容，或直接访问已知数据源。`,
        error: `HTTP ${response.status}`,
      }
    }

    const contentType = response.headers.get('content-type') || ''
    const html = await response.text()

    // 检查是否为 HTML 内容
    if (!contentType.includes('html') && html.trim().length < 100) {
      return {
        toolCallId: id,
        name: 'web_fetch',
        success: false,
        output: `获取的网页内容不是 HTML（Content-Type: ${contentType}），无法解析。\nURL: ${args.url}`,
        error: `Non-HTML content: ${contentType}`,
      }
    }

    // 提取主体内容并转换为 Markdown
    const mainContent = extractMainContent(html)
    let markdown = htmlToMarkdown(mainContent)

    // 智能截断：优先保留前面的内容（标题 + 前几段最有价值）
    if (markdown.length > MAX_FETCH_CHARS) {
      const truncated = markdown.slice(0, MAX_FETCH_CHARS)
      const lastNewline = truncated.lastIndexOf('\n\n')
      markdown = lastNewline > MAX_FETCH_CHARS * 0.7
        ? truncated.slice(0, lastNewline)
        : truncated
      markdown += `\n\n*(内容已截断，原文共 ${markdown.length.toLocaleString()} 字符。如需完整内容，可使用 web_fetch 再次访问。)*`
    }

    const durationMs = Date.now() - startTime
    const charCount = markdown.replace(/\s/g, '').length

    return {
      toolCallId: id,
      name: 'web_fetch',
      success: true,
      output: `${args.url} (${durationMs}ms, ~${charCount.toLocaleString()} 字符):\n\n${markdown}`,
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    return {
      toolCallId: id,
      name: 'web_fetch',
      success: false,
      output: `获取网页失败: ${msg}\nURL: ${args.url}\n\n建议: 检查 URL 是否正确，或使用 web_search 搜索相关内容。`,
      error: msg,
    }
  }
}