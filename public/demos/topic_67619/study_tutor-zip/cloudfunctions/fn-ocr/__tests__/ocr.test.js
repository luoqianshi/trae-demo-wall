const { buildOcrRequest, parseOcrResponse, computeConfidence } = require('../index')

describe('fn-ocr helpers', () => {
  test('buildOcrRequest accepts fileID and returns cloud path', () => {
    const req = buildOcrRequest('cloud://dev-w1.abc/test.png')
    expect(req).toHaveProperty('ImageBase64')
  })

  test('parseOcrResponse extracts text from valid response', () => {
    const mockResp = {
      TextDetections: [
        { DetectedText: '已知函数', Confidence: 95, Type: 'text' },
        { DetectedText: 'f(x) = x^2 + 1', Confidence: 90, Type: 'formula' }
      ]
    }
    const parsed = parseOcrResponse(mockResp)
    expect(parsed.text).toContain('已知函数')
    expect(parsed.latex).toContain('x^2')
    expect(parsed.confidence).toBeGreaterThan(0.85)
  })

  test('computeConfidence averages detection confidences', () => {
    const detections = [{ Confidence: 90 }, { Confidence: 80 }]
    expect(computeConfidence(detections)).toBeCloseTo(0.85)
  })

  test('computeConfidence returns 0 for empty array', () => {
    expect(computeConfidence([])).toBe(0)
  })
})
