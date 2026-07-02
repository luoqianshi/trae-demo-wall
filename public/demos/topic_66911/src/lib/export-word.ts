import {
  Document,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Packer,
  UnderlineType,
  convertInchesToTwip,
} from 'docx'
import { saveAs } from 'file-saver'

/**
 * Convert HTML content from TipTap editor to a Word document and download it
 */
export async function exportToWord(htmlContent: string, fileName: string = '文档') {
  const parser = new DOMParser()
  const doc = parser.parseFromString(htmlContent, 'text/html')
  const body = doc.body

  const children: Paragraph[] = []

  function parseNode(node: Node): (TextRun | Paragraph)[] {
    const results: (TextRun | Paragraph)[] = []

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || ''
      if (text.trim()) {
        results.push(new TextRun({ text }))
      } else if (text.length > 0) {
        results.push(new TextRun({ text }))
      }
      return results
    }

    if (node.nodeType !== Node.ELEMENT_NODE) {
      return results
    }

    const el = node as HTMLElement
    const tagName = el.tagName.toLowerCase()

    // Handle headings
    if (tagName.match(/^h[1-6]$/)) {
      const levelMap: Record<string, typeof HeadingLevel[keyof typeof HeadingLevel]> = {
        h1: HeadingLevel.HEADING_1,
        h2: HeadingLevel.HEADING_2,
        h3: HeadingLevel.HEADING_3,
        h4: HeadingLevel.HEADING_4,
        h5: HeadingLevel.HEADING_5,
        h6: HeadingLevel.HEADING_6,
      }
      const textRuns = extractTextRuns(el)
      if (textRuns.length > 0) {
        children.push(
          new Paragraph({
            children: textRuns,
            heading: levelMap[tagName],
            spacing: { after: convertInchesToTwip(0.15) },
          })
        )
      }
      return results
    }

    // Handle paragraphs
    if (tagName === 'p') {
      const textRuns = extractTextRuns(el)
      const alignment = getAlignment(el)
      children.push(
        new Paragraph({
          children: textRuns.length > 0 ? textRuns : [new TextRun({ text: '' })],
          alignment,
          spacing: { after: convertInchesToTwip(0.1) },
        })
      )
      return results
    }

    // Handle lists
    if (tagName === 'ul' || tagName === 'ol') {
      const listItems = el.querySelectorAll(':scope > li')
      listItems.forEach((li) => {
        const textRuns = extractTextRuns(li as HTMLElement)
        children.push(
          new Paragraph({
            children: textRuns,
            bullet: tagName === 'ul' ? { level: 0 } : undefined,
            numbering: tagName === 'ol' ? { level: 0, reference: 'default-numbering' } : undefined,
            spacing: { after: convertInchesToTwip(0.05) },
          })
        )
      })
      return results
    }

    // Handle blockquote
    if (tagName === 'blockquote') {
      const textRuns = extractTextRuns(el)
      children.push(
        new Paragraph({
          children: textRuns,
          indent: { left: convertInchesToTwip(0.5) },
          spacing: { after: convertInchesToTwip(0.1) },
        })
      )
      return results
    }

    // Handle horizontal rule
    if (tagName === 'hr') {
      children.push(
        new Paragraph({
          children: [new TextRun({ text: '────────────────────────' })],
          alignment: AlignmentType.CENTER,
          spacing: { before: convertInchesToTwip(0.1), after: convertInchesToTwip(0.1) },
        })
      )
      return results
    }

    // Handle code blocks
    if (tagName === 'pre') {
      const codeEl = el.querySelector('code')
      const text = codeEl ? codeEl.textContent || '' : el.textContent || ''
      children.push(
        new Paragraph({
          children: [new TextRun({ text, font: 'Courier New', size: 20 })],
          spacing: { after: convertInchesToTwip(0.1) },
          shading: { fill: 'F5F5F5' },
        })
      )
      return results
    }

    // Handle div - recursively process children
    if (tagName === 'div') {
      el.childNodes.forEach((child) => {
        parseNode(child)
      })
      return results
    }

    // For other elements, just extract text runs
    const textRuns = extractTextRuns(el)
    if (textRuns.length > 0) {
      children.push(
        new Paragraph({
          children: textRuns,
          spacing: { after: convertInchesToTwip(0.1) },
        })
      )
    }

    return results
  }

  function extractTextRuns(el: HTMLElement): TextRun[] {
    const runs: TextRun[] = []

    function walk(node: Node, options: { bold?: boolean; italic?: boolean; underline?: boolean; strike?: boolean; highlight?: string; color?: string; font?: string; size?: number } = {}) {
      if (node.nodeType === Node.TEXT_NODE) {
        const text = node.textContent || ''
        if (text) {
          runs.push(
            new TextRun({
              text,
              bold: options.bold,
              italics: options.italic,
              underline: options.underline ? { type: UnderlineType.SINGLE } : undefined,
              strike: options.strike,
              highlight: options.highlight as any,
              color: options.color,
              font: options.font,
              size: options.size,
            })
          )
        }
        return
      }

      if (node.nodeType !== Node.ELEMENT_NODE) return

      const childEl = node as HTMLElement
      const tag = childEl.tagName.toLowerCase()
      const style = childEl.style

      const newOptions = { ...options }

      if (tag === 'strong' || tag === 'b' || style.fontWeight === 'bold') {
        newOptions.bold = true
      }
      if (tag === 'em' || tag === 'i' || style.fontStyle === 'italic') {
        newOptions.italic = true
      }
      if (tag === 'u' || style.textDecoration === 'underline') {
        newOptions.underline = true
      }
      if (tag === 's' || tag === 'strike' || tag === 'del' || style.textDecoration === 'line-through') {
        newOptions.strike = true
      }
      if (tag === 'mark' || style.backgroundColor) {
        newOptions.highlight = 'yellow'
      }
      if (style.color) {
        newOptions.color = style.color.replace('#', '')
      }
      if (style.fontFamily) {
        newOptions.font = style.fontFamily.split(',')[0].replace(/['"]/g, '')
      }
      if (style.fontSize) {
        const match = style.fontSize.match(/(\d+)/)
        if (match) {
          newOptions.size = parseInt(match[1]) * 2 // half-points
        }
      }

      childEl.childNodes.forEach((child) => walk(child, newOptions))
    }

    el.childNodes.forEach((child) => walk(child))
    return runs
  }

  function getAlignment(el: HTMLElement): typeof AlignmentType[keyof typeof AlignmentType] | undefined {
    const style = el.style.textAlign
    if (style === 'center') return AlignmentType.CENTER
    if (style === 'right') return AlignmentType.RIGHT
    if (style === 'justify') return AlignmentType.JUSTIFIED
    if (style === 'left') return AlignmentType.LEFT

    const classMatch = el.className.match(/text-align-(\w+)/)
    if (classMatch) {
      const align = classMatch[1]
      if (align === 'center') return AlignmentType.CENTER
      if (align === 'right') return AlignmentType.RIGHT
      if (align === 'justify') return AlignmentType.JUSTIFIED
    }

    return undefined
  }

  // Process all top-level nodes
  body.childNodes.forEach((node) => {
    parseNode(node)
  })

  // If no content, add an empty paragraph
  if (children.length === 0) {
    children.push(new Paragraph({ children: [new TextRun({ text: '' })] }))
  }

  const document = new Document({
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(1),
              right: convertInchesToTwip(1),
              bottom: convertInchesToTwip(1),
              left: convertInchesToTwip(1),
            },
          },
        },
        children,
      },
    ],
  })

  const blob = await Packer.toBlob(document)
  saveAs(blob, `${fileName}.docx`)
}
