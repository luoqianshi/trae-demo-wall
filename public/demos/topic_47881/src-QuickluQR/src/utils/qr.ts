export function getByteLength(str: string): number {
    return new TextEncoder().encode(str).length
}

export const QR_CAPACITY: Record<'L' | 'M' | 'Q' | 'H', { max: number; warn: number; label: string; desc: string }> = {
    L: { max: 2900, warn: 2300, label: 'L (低)', desc: '约 7% 纠错，可容纳最多数据' },
    M: { max: 2280, warn: 1800, label: 'M (中)', desc: '约 15% 纠错，推荐默认' },
    Q: { max: 1620, warn: 1300, label: 'Q (较高)', desc: '约 25% 纠错' },
    H: { max: 1240, warn: 950, label: 'H (高)', desc: '约 30% 纠错，最强容错' },
}

export function svgToPngBlob(svg: SVGSVGElement, scale = 4, whiteBackground = true): Promise<Blob | null> {
    return new Promise((resolve) => {
        // 确保 SVG 有 xmlns 命名空间,提高跨环境兼容性
        const svgData = new XMLSerializer().serializeToString(svg)
        const svgWithNs = svgData.includes('xmlns') ? svgData : svgData.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"')

        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        const svgBlob = new Blob([svgWithNs], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)

        img.onload = () => {
            canvas.width = img.width * scale
            canvas.height = img.height * scale
            if (ctx) {
                if (whiteBackground) {
                    ctx.fillStyle = '#ffffff'
                    ctx.fillRect(0, 0, canvas.width, canvas.height)
                }
                ctx.imageSmoothingEnabled = false
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
            }
            canvas.toBlob((blob) => {
                resolve(blob)
                URL.revokeObjectURL(url)
            }, 'image/png')
        }
        img.onerror = () => {
            resolve(null)
            URL.revokeObjectURL(url)
        }
        img.src = url
    })
}

export async function copySvgAsPng(svg: SVGSVGElement, whiteBackground = true): Promise<boolean> {
    const blob = await svgToPngBlob(svg, 4, whiteBackground)
    if (!blob) return false
    try {
        await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })])
        return true
    } catch {
        return false
    }
}

export async function downloadSvgAsPng(svg: SVGSVGElement, filename = 'qrcode.png', whiteBackground = true): Promise<boolean> {
    const blob = await svgToPngBlob(svg, 4, whiteBackground)
    if (!blob) return false
    try {
        const url = URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.download = filename
        link.href = url
        link.click()
        setTimeout(() => URL.revokeObjectURL(url), 1000)
        return true
    } catch {
        return false
    }
}
