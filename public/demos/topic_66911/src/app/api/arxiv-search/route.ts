import { NextRequest, NextResponse } from 'next/server'

/**
 * arXiv API 服务端代理
 * 解决前端直连 arXiv 的 CORS 问题
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q') || ''
    const maxResults = searchParams.get('max') || '10'
    const action = searchParams.get('action') || 'search'

    if (!query && action === 'search') {
      return NextResponse.json({ ok: false, error: '缺少搜索关键词' }, { status: 400 })
    }

    if (action === 'search') {
      // 搜索论文
      const url = `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&start=0&max_results=${maxResults}&sortBy=relevance`
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Caijianji/1.0' },
      })

      if (!response.ok) {
        return NextResponse.json({ ok: false, error: `arXiv API 返回 ${response.status}` }, { status: 502 })
      }

      const text = await response.text()
      const results = parseArxivXML(text)
      return NextResponse.json({ ok: true, results })
    }

    if (action === 'paper') {
      // 根据 arXiv ID 获取单篇
      const arxivId = query
      const url = `http://export.arxiv.org/api/query?id_list=${encodeURIComponent(arxivId)}`
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Caijianji/1.0' },
      })

      if (!response.ok) {
        return NextResponse.json({ ok: false, error: `arXiv API 返回 ${response.status}` }, { status: 502 })
      }

      const text = await response.text()
      const results = parseArxivXML(text)
      return NextResponse.json({ ok: true, paper: results[0] || null })
    }

    return NextResponse.json({ ok: false, error: '未知操作' }, { status: 400 })
  } catch (error: any) {
    console.error('arXiv proxy error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'arXiv 请求失败' },
      { status: 500 }
    )
  }
}

interface ArxivResult {
  id: string
  arxivId: string
  title: string
  authors: string[]
  abstract: string
  year: number | null
  published: string
  pdfUrl: string
  categories: string[]
  doi: string | null
  journalRef: string | null
  comment: string | null
}

function parseArxivXML(xmlText: string): ArxivResult[] {
  const results: ArxivResult[] = []

  // Simple regex-based XML parsing (avoids deps like xml2js)
  const entryRegex = /<entry>([\s\S]*?)<\/entry>/g
  let entryMatch

  while ((entryMatch = entryRegex.exec(xmlText)) !== null) {
    const entryXml = entryMatch[1]
    const result: ArxivResult = {
      id: extractTag(entryXml, 'id') || '',
      arxivId: '',
      title: cleanText(extractTag(entryXml, 'title') || ''),
      authors: [],
      abstract: cleanText(extractTag(entryXml, 'summary') || ''),
      year: null,
      published: extractTag(entryXml, 'published') || '',
      pdfUrl: '',
      categories: [],
      doi: null,
      journalRef: null,
      comment: null,
    }

    // Parse arxiv ID from the id URL
    const idUrl = result.id
    const arxivIdMatch = idUrl.match(/arxiv\.org\/abs\/(.+?)(?:v\d+)?$/)
    if (arxivIdMatch) {
      result.arxivId = arxivIdMatch[1].trim()
    } else {
      result.arxivId = idUrl.split('/').pop()?.trim() || idUrl
    }

    // Authors
    const authorRegex = /<author>[\s\S]*?<name>([^<]+)<\/name>[\s\S]*?<\/author>/g
    let authorMatch
    while ((authorMatch = authorRegex.exec(entryXml)) !== null) {
      result.authors.push(authorMatch[1].trim())
    }

    // Year
    if (result.published) {
      result.year = new Date(result.published).getFullYear()
    }

    // PDF URL
    const linkRegex = /<link[^>]*href="([^"]*)"[^>]*title="pdf"[^>]*\/>/g
    let linkMatch
    while ((linkMatch = linkRegex.exec(entryXml)) !== null) {
      result.pdfUrl = linkMatch[1]
    }

    // Categories
    const catRegex = /<category[^>]*term="([^"]*)"[^>]*\/>/g
    let catMatch
    while ((catMatch = catRegex.exec(entryXml)) !== null) {
      result.categories.push(catMatch[1])
    }

    // DOI
    result.doi = extractTag(entryXml, 'arxiv:doi')
    result.journalRef = extractTag(entryXml, 'arxiv:journal_ref')
    result.comment = extractTag(entryXml, 'arxiv:comment')

    results.push(result)
  }

  return results
}

function extractTag(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1].trim() : null
}

function cleanText(text: string): string {
  return text
    .replace(/\s+/g, ' ')
    .replace(/\n/g, ' ')
    .trim()
}
