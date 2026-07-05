const KEYWORD_TYPES = {
  TIME: ['今天', '昨天', '前天', '上周', '上个月', '去年', '周一', '周二', '周三', '周四', '周五', '周六', '周日', '早上', '中午', '晚上', '凌晨', '深夜'],
  PLACE: ['公园', '餐厅', '电影院', '咖啡馆', '商场', '学校', '公司', '家里', '车站', '机场', '海边', '山上', '湖边', '书店', '医院'],
  THING: ['蛋糕', '咖啡', '电影', '书', '礼物', '花', '照片', '信', '晚餐', '早餐', '午餐', '奶茶', '火锅', '烧烤', '旅行', '散步', '聊天'],
  ACTION: ['一起', '记得', '忘记', '想念', '遇见', '告别', '拥抱', '牵手', '亲吻', '笑', '哭', '说', '看', '听', '走', '跑']
}

function extractKeywords(text) {
  const keywords = []
  const textLower = text.toLowerCase()
  
  const typeKeys = Object.keys(KEYWORD_TYPES)
  typeKeys.forEach(function(typeKey) {
    const typeKeywords = KEYWORD_TYPES[typeKey]
    typeKeywords.forEach(function(keyword) {
      if (textLower.indexOf(keyword.toLowerCase()) !== -1) {
        keywords.push(keyword)
      }
    })
  })
  
  const uniqueKeywords = []
  keywords.forEach(function(k) {
    if (uniqueKeywords.indexOf(k) === -1) {
      uniqueKeywords.push(k)
    }
  })
  
  return uniqueKeywords
}

function matchBottles(bottle1, bottle2) {
  const keywords1 = extractKeywords(bottle1.content)
  const keywords2 = extractKeywords(bottle2.content)
  
  const common = []
  keywords1.forEach(function(k) {
    if (keywords2.indexOf(k) !== -1) {
      common.push(k)
    }
  })
  const matchCount = common.length
  
  if (matchCount >= 2) {
    return { matched: true, level: 'strong', keywords: common }
  } else if (matchCount === 1) {
    return { matched: true, level: 'weak', keywords: common }
  }
  
  return { matched: false, level: 'none', keywords: [] }
}

function findMatches(river) {
  const bottles = river.bottles || []
  const matches = []
  const matchedIds = {}
  
  for (let i = 0; i < bottles.length; i++) {
    for (let j = i + 1; j < bottles.length; j++) {
      if (bottles[i].owner !== bottles[j].owner) {
        const result = matchBottles(bottles[i], bottles[j])
        if (result.matched && !matchedIds[bottles[i].id] && !matchedIds[bottles[j].id]) {
          matches.push({
            bottle1: bottles[i],
            bottle2: bottles[j],
            level: result.level,
            keywords: result.keywords
          })
          matchedIds[bottles[i].id] = true
          matchedIds[bottles[j].id] = true
        }
      }
    }
  }
  
  return matches
}

module.exports = {
  extractKeywords: extractKeywords,
  matchBottles: matchBottles,
  findMatches: findMatches
}