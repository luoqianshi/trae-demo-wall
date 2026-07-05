const templates = {
  daily: [
    { id: 1, title: '日常小事', content: '今天和TA一起吃了午餐，阳光很好，心情也很好。' },
    { id: 2, title: '普通一天', content: '平淡的日子里，因为有TA的陪伴而变得特别。' },
    { id: 3, title: '简单记录', content: '今天也有好好想念TA，想把这份心情记下来。' },
    { id: 4, title: '日常随想', content: '生活中的小确幸，想和TA一起珍藏。' }
  ],
  regret: [
    { id: 5, title: '遗憾心事', content: '有些话没能说出口，希望有一天能勇敢表达。' },
    { id: 6, title: '未完成', content: '那个约定还在心里，等待一个合适的时机。' },
    { id: 7, title: '想说的话', content: '如果时光能倒流，我想重新说一次我爱你。' }
  ],
  heart: [
    { id: 8, title: '心动瞬间', content: '那一刻，心跳漏了一拍，原来这就是喜欢的感觉。' },
    { id: 9, title: '甜蜜回忆', content: '记得那天TA的笑容，像阳光一样温暖。' },
    { id: 10, title: '心动时刻', content: '四目相对的瞬间，一切都变得不一样了。' },
    { id: 11, title: '爱的表达', content: '想告诉TA，你是我生命中最美的遇见。' }
  ],
  accompany: [
    { id: 12, title: '陪伴是福', content: '谢谢你一直陪在我身边，这份温暖我会好好珍惜。' },
    { id: 13, title: '温暖时光', content: '有TA在的日子，每一天都充满了安心。' },
    { id: 14, title: '默默守护', content: '不需要太多言语，陪伴就是最好的告白。' }
  ]
}

function getTemplates(type) {
  return templates[type] || []
}

function getAllTemplates() {
  const all = []
  const keys = Object.keys(templates)
  keys.forEach(function(key) {
    templates[key].forEach(function(item) {
      all.push(item)
    })
  })
  return all
}

module.exports = {
  templates: templates,
  getTemplates: getTemplates,
  getAllTemplates: getAllTemplates
}