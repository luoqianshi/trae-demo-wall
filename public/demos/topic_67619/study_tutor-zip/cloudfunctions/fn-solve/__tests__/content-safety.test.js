const { checkContent } = require('../content-safety')

describe('content-safety stub', () => {
  test('returns ok=true in stub mode', async () => {
    const r = await checkContent('任意文本')
    expect(r.ok).toBe(true)
  })

  test('returns provider=stub', async () => {
    const r = await checkContent('任意文本')
    expect(r.provider).toBe('stub')
  })

  test('does not modify input', async () => {
    const input = '某文本'
    await checkContent(input)
    expect(input).toBe('某文本')
  })
})
