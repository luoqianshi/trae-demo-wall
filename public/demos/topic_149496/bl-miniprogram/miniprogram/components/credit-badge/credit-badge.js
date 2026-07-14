// components/credit-badge/credit-badge.js
Component({
  properties: {
    level: { type: String, value: '新邻居' },
    score: { type: Number, value: 0 },
    size: { type: String, value: 'md' } // sm, md, lg
  },
  data: {
    config: {}
  },
  observers: {
    'level,score': function (level, score) {
      const util = require('../../utils/util.js')
      const actualScore = score !== undefined ? score : 0
      const config = util.getCreditLevel(actualScore)
      this.setData({ config })
    }
  }
})
