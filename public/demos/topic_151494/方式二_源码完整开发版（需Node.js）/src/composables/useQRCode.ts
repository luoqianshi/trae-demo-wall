import QRCode from 'qrcode'

export function useQRCode() {
  const generate = async (text: string, size = 320): Promise<string> => {
    try {
      return await QRCode.toDataURL(text, {
        width: size,
        margin: 2,
        color: { dark: '#1D3557', light: '#FFFFFF' }
      })
    } catch (e) {
      console.error('QR code error:', e)
      return ''
    }
  }

  const generateDownload = async (text: string, filename = 'qrcode.png') => {
    const url = await generate(text, 512)
    if (!url) return
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
  }

  return { generate, generateDownload }
}
