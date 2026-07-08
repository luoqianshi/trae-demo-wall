const cloud = require('wx-server-sdk')
const tencentcloud = require('tencentcloud-sdk-nodejs-ocr')

const OcrClient = tencentcloud.ocr.v20201210.Client

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

function buildOcrRequest(imageBase64) {
  return { ImageBase64: imageBase64 }
}

function computeConfidence(detections) {
  if (!detections || detections.length === 0) return 0
  const sum = detections.reduce((s, d) => s + (d.Confidence || 0), 0)
  return sum / detections.length / 100
}

function parseOcrResponse(resp) {
  const detections = resp.TextDetections || []
  const textParts = []
  const latexParts = []

  for (const d of detections) {
    if (d.Type === 'formula') {
      latexParts.push(d.DetectedText)
      textParts.push(d.DetectedText)
    } else {
      textParts.push(d.DetectedText)
    }
  }

  return {
    text: textParts.join('\n'),
    latex: latexParts.join('\n'),
    confidence: computeConfidence(detections),
    segments: detections.map(d => ({
      text: d.DetectedText,
      type: d.Type,
      confidence: (d.Confidence || 0) / 100
    }))
  }
}

async function downloadImageAsBase64(fileID) {
  const res = await cloud.downloadFile({ fileID })
  return res.fileContent.toString('base64')
}

function getClient() {
  return new OcrClient({
    credential: {
      secretId: process.env.TENCENT_OCR_SECRET_ID,
      secretKey: process.env.TENCENT_OCR_SECRET_KEY
    },
    region: 'ap-shanghai',
    profile: { httpProfile: { endpoint: 'ocr.tencentcloudapi.com' } }
  })
}

exports.main = async (event) => {
  const { fileID } = event
  if (!fileID) {
    return { ok: false, error: 'fileID is required' }
  }

  try {
    const base64 = await downloadImageAsBase64(fileID)
    const client = getClient()
    const resp = await client.GeneralAccurateOCR(buildOcrRequest(base64))
    const parsed = parseOcrResponse(resp)
    return { ok: true, ...parsed }
  } catch (err) {
    console.error('OCR failed', err)
    return { ok: false, error: err.message }
  }
}

exports.buildOcrRequest = buildOcrRequest
exports.parseOcrResponse = parseOcrResponse
exports.computeConfidence = computeConfidence
