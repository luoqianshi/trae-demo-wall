const cloud = require('wx-server-sdk')
const { todayKey, shouldReset, computeRemaining, FREE_DAILY_LIMIT } = require('./quota')

cloud.init({ env: cloud.DYNAMIC_CURRENT_ENV })

async function getUser(db, openid) {
  const res = await db.collection('users').where({ openid }).limit(1).get()
  return res.data.length > 0 ? res.data[0] : null
}

async function createUser(db, openid) {
  const today = todayKey()
  const res = await db.collection('users').add({
    data: {
      openid,
      plan: 'free',
      planExpiresAt: null,
      dailyUsed: 0,
      dailyResetAt: today,
      createdAt: new Date()
    }
  })
  return { _id: res._id, openid, plan: 'free', dailyUsed: 0, dailyResetAt: today }
}

async function resetDaily(db, user) {
  const today = todayKey()
  await db.collection('users').doc(user._id).update({
    data: { dailyUsed: 0, dailyResetAt: today }
  })
  return { ...user, dailyUsed: 0, dailyResetAt: today }
}

async function incrementUsage(db, user) {
  const newUsed = (user.dailyUsed || 0) + 1
  await db.collection('users').doc(user._id).update({
    data: { dailyUsed: newUsed }
  })
  return { ...user, dailyUsed: newUsed }
}

exports.main = async (event) => {
  const { action } = event
  const { OPENID } = cloud.getWXContext()
  if (!OPENID) return { ok: false, error: 'no openid' }

  const db = cloud.database()
  let user = await getUser(db, OPENID)
  if (!user) user = await createUser(db, OPENID)

  const today = todayKey()
  if (shouldReset(user, today)) {
    user = await resetDaily(db, user)
  }

  if (action === 'check') {
    return {
      ok: true,
      plan: user.plan,
      dailyUsed: user.dailyUsed,
      dailyLimit: user.plan === 'pro' ? null : FREE_DAILY_LIMIT,
      remaining: computeRemaining(user, FREE_DAILY_LIMIT)
    }
  }

  if (action === 'increment') {
    const remaining = computeRemaining(user, FREE_DAILY_LIMIT)
    if (remaining <= 0) {
      return { ok: false, error: 'quota exceeded', upgradeUrl: '/pages/profile/profile' }
    }
    user = await incrementUsage(db, user)
    return {
      ok: true,
      dailyUsed: user.dailyUsed,
      remaining: computeRemaining(user, FREE_DAILY_LIMIT)
    }
  }

  if (action === 'addMistake') {
    const { questionId } = event
    if (!questionId) return { ok: false, error: 'questionId required' }
    await db.collection('mistakes').add({
      data: {
        openid: OPENID,
        questionId,
        status: 'new',
        reviewCount: 0,
        addedAt: new Date()
      }
    })
    return { ok: true }
  }

  if (action === 'feedback') {
    const { questionId, correct } = event
    if (!questionId) return { ok: false, error: 'questionId required' }
    await db.collection('feedback').add({
      data: {
        openid: OPENID,
        questionId,
        reportedWrong: !correct,
        ts: new Date()
      }
    })
    return { ok: true }
  }

  if (action === 'listMistakes') {
    const res = await db.collection('mistakes')
      .where({ openid: OPENID })
      .orderBy('addedAt', 'desc')
      .limit(50)
      .get()
    return { ok: true, items: res.data }
  }

  return { ok: false, error: `unknown action: ${action}` }
}
