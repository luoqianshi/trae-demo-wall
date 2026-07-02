import { NextRequest, NextResponse } from 'next/server'

/**
 * BibTeX 生成与导出 API
 * 将论文信息转换为标准 BibTeX 格式
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { papers, format = 'bibtex' } = body

    if (!papers || !Array.isArray(papers)) {
      return NextResponse.json({ ok: false, error: '缺少论文数据' }, { status: 400 })
    }

    if (format === 'bibtex') {
      const bibtex = papers.map(paperToBibtex).join('\n\n')
      return NextResponse.json({ ok: true, bibtex })
    }

    // 也可以导出为纯文本引用
    if (format === 'text') {
      const text = papers.map(paperToTextCitation).join('\n\n---\n\n')
      return NextResponse.json({ ok: true, text })
    }

    return NextResponse.json({ ok: false, error: '不支持的格式' }, { status: 400 })
  } catch (error: any) {
    console.error('BibTeX generation error:', error)
    return NextResponse.json(
      { ok: false, error: error.message || 'BibTeX 生成失败' },
      { status: 500 }
    )
  }
}

function sanitizeKey(title: string, authors: string, year: number | null): string {
  // Generate a BibTeX citation key: firstAuthorLastNameYear
  const firstAuthor = authors.split(',')[0]?.trim()?.split(' ')?.pop() || 'Unknown'
  const cleanAuthor = firstAuthor.replace(/[^a-zA-Z0-9]/g, '')
  const keyYear = year || new Date().getFullYear()

  // Take first meaningful word from title
  const titleWords = title.replace(/[^a-zA-Z\s]/g, '').split(/\s+/).filter(w => w.length > 3)
  const titleKey = titleWords[0] || 'paper'

  return `${cleanAuthor}${keyYear}${titleKey.charAt(0).toUpperCase() + titleKey.slice(1).toLowerCase()}`
}

function paperToBibtex(paper: any): string {
  const year = paper.year || null
  const key = sanitizeKey(paper.title, paper.authors, year)
  const isConference = (paper.tags || paper.journal || '').toLowerCase().includes('conference')
  const entryType = isConference ? 'inproceedings' : 'article'

  const fields: string[] = []
  fields.push(`  author    = {${paper.authors || 'Unknown'}}`)
  fields.push(`  title     = {${paper.title || 'Untitled'}}`)

  if (paper.journal) {
    fields.push(`  journal   = {${paper.journal}}`)
  }
  if (paper.year) {
    fields.push(`  year      = {${paper.year}}`)
  }
  if (paper.doi) {
    fields.push(`  doi       = {${paper.doi}}`)
  }
  if (paper.abstract) {
    // Truncate abstract for BibTeX
    const shortAbstract = paper.abstract.slice(0, 200).trim()
    fields.push(`  abstract  = {${shortAbstract}...}`)
  }

  return `@${entryType}{${key},\n${fields.join(',\n')}\n}`
}

function paperToTextCitation(paper: any): string {
  const parts: string[] = []

  // Authors
  if (paper.authors) {
    parts.push(paper.authors)
  }

  // Title
  if (paper.title) {
    parts.push(`"${paper.title}"`)
  }

  // Journal
  if (paper.journal) {
    parts.push(paper.journal)
  }

  // Year
  if (paper.year) {
    parts.push(`(${paper.year})`)
  }

  // DOI
  if (paper.doi) {
    parts.push(`DOI: ${paper.doi}`)
  }

  return parts.join('. ')
}
