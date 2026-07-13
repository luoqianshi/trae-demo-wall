import { jsPDF } from 'jspdf'
import Konva from 'konva'
import type { ComicData, ComicPage } from '../types'
import { renderPageToDataURL } from './pageRenderer'

export async function exportPageAsPNG(
  page: ComicPage,
  canvasWidth: number,
  canvasHeight: number,
  pixelRatio: number,
  filename: string
): Promise<void> {
  const dataUrl = await renderPageToDataURL(page, canvasWidth, canvasHeight, pixelRatio)
  triggerDownload(dataUrl, `${filename}.png`)
}

export async function exportComicAsPDF(
  data: ComicData,
  canvasWidth: number,
  canvasHeight: number,
  pixelRatio: number,
  filename: string
): Promise<void> {
  if (data.pages.length === 0) throw new Error('无页面可导出')
  const orientation = canvasWidth >= canvasHeight ? 'landscape' : 'portrait'
  const pdf = new jsPDF({
    orientation,
    unit: 'px',
    format: [canvasWidth, canvasHeight],
  })
  for (let i = 0; i < data.pages.length; i++) {
    const page = data.pages[i]
    const dataUrl = await renderPageToDataURL(page, canvasWidth, canvasHeight, pixelRatio)
    if (i > 0) {
      pdf.addPage([canvasWidth, canvasHeight], orientation)
    }
    pdf.addImage(dataUrl, 'PNG', 0, 0, canvasWidth, canvasHeight)
  }
  pdf.save(`${filename}.pdf`)
}

function triggerDownload(dataUrl: string, filename: string) {
  const link = document.createElement('a')
  link.href = dataUrl
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

/** 依托内存中的 Konva stage 快速渲染，工具函数 */
export function stageToDataURL(stage: Konva.Stage, canvasWidth: number, canvasHeight: number, pixelRatio = 2): string {
  return stage.toDataURL({
    x: 0,
    y: 0,
    width: canvasWidth,
    height: canvasHeight,
    pixelRatio,
    mimeType: 'image/png',
  })
}
