const cloud = require('wx-server-sdk')
cloud.init({ env: 'cloud1-d6g90aucu24ba270c' })
const db = cloud.database()

function extractKeywords(text) {
  const keywords = []
  const regex = /[\u4e00-\u9fa5]{2,}/g
  let match
  while ((match = regex.exec(text)) !== null) {
    if (!keywords.includes(match[0])) {
      keywords.push(match[0])
    }
  }
  return keywords.slice(0, 5)
}

async function matchBottles(riverId) {
  const bottles = (await db.collection('bottles').where({ riverId, status: 'floating', bottleType: 'personal' }).get()).data
  
  for (let i = 0; i < bottles.length; i++) {
    for (let j = i + 1; j < bottles.length; j++) {
      const bottle1 = bottles[i]
      const bottle2 = bottles[j]
      
      const commonKeywords = bottle1.keywords.filter(k => bottle2.keywords.includes(k))
      
      if (commonKeywords.length >= 1) {
        await db.collection('bottles').doc(bottle1._id).update({
          data: { matchedWith: { id: bottle2._id, content: bottle2.content }, status: 'matched' }
        })
        
        await db.collection('bottles').doc(bottle2._id).update({
          data: { matchedWith: { id: bottle1._id, content: bottle1.content }, status: 'matched' }
        })
      }
    }
  }
}

exports.main = async (event, context) => {
  const { action, data } = event
  
  try {
    switch (action) {
      case 'login': {
        const { OPENID } = cloud.getWXContext()
        let user = (await db.collection('users').where({ openid: OPENID }).get()).data[0]
        
        if (!user) {
          user = { openid: OPENID, nickname: '用户', avatar: '', createdAt: new Date() }
          await db.collection('users').add({ data: user })
        }
        
        return { success: true, data: user }
      }
      
      case 'getUser': {
        const { OPENID } = cloud.getWXContext()
        const user = (await db.collection('users').where({ openid: OPENID }).get()).data[0]
        return { success: true, data: user || { openid: OPENID, nickname: '用户' } }
      }
      
      case 'getRivers': {
        const { OPENID } = cloud.getWXContext()
        const rivers = (await db.collection('rivers').where({ members: OPENID }).get()).data
        
        const riversWithBottles = await Promise.all(rivers.map(async river => {
          const bottles = (await db.collection('bottles').where({ riverId: river._id }).get()).data
          return { ...river, bottles }
        }))
        
        return { success: true, rivers: riversWithBottles }
      }
      
      case 'createRiver': {
        const { OPENID } = cloud.getWXContext()
        const newRiver = {
          name: data.name || '未命名长河',
          relationType: data.relationType || 'lover',
          customRelation: data.customRelation || '',
          members: [OPENID],
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date()
        }
        
        const result = await db.collection('rivers').add({ data: newRiver })
        return { success: true, river: { ...newRiver, _id: result._id } }
      }
      
      case 'getRiver': {
        const river = (await db.collection('rivers').doc(data.riverId).get()).data
        
        if (!river) {
          return { success: false, message: '长河不存在' }
        }
        
        const bottles = (await db.collection('bottles').where({ riverId: data.riverId }).get()).data
        return { success: true, river: { ...river, bottles } }
      }
      
      case 'createBottle': {
        const keywords = extractKeywords(data.content)
        
        const newBottle = {
          riverId: data.riverId,
          content: data.content,
          images: data.images || [],
          keywords: keywords,
          bottleType: data.bottleType || 'personal',
          status: 'floating',
          matchedWith: null,
          createdAt: new Date()
        }
        
        const result = await db.collection('bottles').add({ data: newBottle })
        
        await matchBottles(data.riverId)
        
        return { success: true, bottle: { ...newBottle, _id: result._id } }
      }
      
      case 'deleteBottle': {
        const bottle = (await db.collection('bottles').doc(data.bottleId).get()).data
        
        if (!bottle) {
          return { success: false, message: '漂流瓶不存在' }
        }
        
        if (bottle.matchedWith) {
          await db.collection('bottles').doc(bottle.matchedWith.id).update({
            data: { matchedWith: null, status: 'floating' }
          })
        }
        
        await db.collection('bottles').doc(data.bottleId).remove()
        return { success: true }
      }
      
      case 'toggleBottle': {
        const bottle = (await db.collection('bottles').doc(data.bottleId).get()).data
        
        if (!bottle) {
          return { success: false, message: '漂流瓶不存在' }
        }
        
        const newStatus = bottle.status === 'collected' ? 'floating' : 'collected'
        await db.collection('bottles').doc(data.bottleId).update({ data: { status: newStatus } })
        
        return { success: true, bottle: { ...bottle, status: newStatus } }
      }
      
      case 'getStatistics': {
        const { OPENID } = cloud.getWXContext()
        const rivers = (await db.collection('rivers').where({ members: OPENID }).get()).data
        const riverIds = rivers.map(r => r._id)
        
        const allBottles = riverIds.length > 0 
          ? (await db.collection('bottles').where({ riverId: db.command.in(riverIds) }).get()).data
          : []
        
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        return {
          success: true,
          stats: {
            totalBottles: allBottles.length,
            matchedBottles: allBottles.filter(b => b.status === 'matched').length,
            totalRivers: rivers.length,
            todayBottles: allBottles.filter(b => {
              const d = new Date(b.createdAt)
              d.setHours(0, 0, 0, 0)
              return d.getTime() === today.getTime()
            }).length
          }
        }
      }
      
      default:
        return { success: true, message: '云函数调用成功' }
    }
  } catch (err) {
    console.error('云函数执行失败:', err)
    return { success: false, message: err.message }
  }
}