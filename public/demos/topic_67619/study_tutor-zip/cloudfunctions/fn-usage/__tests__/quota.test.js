const {
  todayKey,
  shouldReset,
  computeRemaining,
  FREE_DAILY_LIMIT
} = require('../quota')

describe('quota', () => {
  test('todayKey returns YYYY-MM-DD in Beijing time', () => {
    const key = todayKey(new Date('2026-06-19T15:30:00+08:00'))
    expect(key).toBe('2026-06-19')
  })

  test('todayKey rolls over at midnight', () => {
    const before = todayKey(new Date('2026-06-19T23:59:59+08:00'))
    const after = todayKey(new Date('2026-06-20T00:00:01+08:00'))
    expect(before).toBe('2026-06-19')
    expect(after).toBe('2026-06-20')
  })

  test('shouldReset returns true when stored day differs', () => {
    expect(shouldReset({ dailyResetAt: '2026-06-18' }, '2026-06-19')).toBe(true)
    expect(shouldReset({ dailyResetAt: '2026-06-19' }, '2026-06-19')).toBe(false)
  })

  test('shouldReset returns true when no prior state', () => {
    expect(shouldReset({}, '2026-06-19')).toBe(true)
    expect(shouldReset(null, '2026-06-19')).toBe(true)
  })

  test('computeRemaining returns free limit for free plan', () => {
    expect(computeRemaining({ plan: 'free', dailyUsed: 5 }, FREE_DAILY_LIMIT)).toBe(FREE_DAILY_LIMIT - 5)
  })

  test('computeRemaining returns Infinity for pro plan', () => {
    expect(computeRemaining({ plan: 'pro', dailyUsed: 9999 }, FREE_DAILY_LIMIT)).toBe(Infinity)
  })

  test('computeRemaining never returns negative', () => {
    expect(computeRemaining({ plan: 'free', dailyUsed: 9999 }, FREE_DAILY_LIMIT)).toBe(0)
  })
})
