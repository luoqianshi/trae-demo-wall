const FREE_DAILY_LIMIT = 100  // W1 dogfood 放宽；W2 改为 3

function todayKey(date) {
  const d = date || new Date()
  // 用 Intl.DateTimeFormat 直接格式化为北京时区的 YYYY-MM-DD
  // en-CA locale 默认产出 ISO-like 顺序，避免本地时区依赖
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(d)
}

function shouldReset(userState, today) {
  if (!userState || !userState.dailyResetAt) return true
  return userState.dailyResetAt !== today
}

function computeRemaining(userState, freeLimit) {
  if (!userState) return freeLimit
  if (userState.plan === 'pro') return Infinity
  const used = userState.dailyUsed || 0
  return Math.max(0, freeLimit - used)
}

module.exports = {
  todayKey,
  shouldReset,
  computeRemaining,
  FREE_DAILY_LIMIT
}
