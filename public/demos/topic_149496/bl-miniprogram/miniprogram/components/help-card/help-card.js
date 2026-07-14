// components/help-card/help-card.js
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    item: { type: Object, value: {} },
    showCommunity: { type: Boolean, value: false }
  },
  data: {
    typeConfig: {},
    timeText: '',
    distanceText: ''
  },
  observers: {
    'item': function (item) {
      if (!item) return
      const util = require('../../utils/util.js')
      const typeConfig = util.getHelpTypeConfig(item.type)
      const timeText = util.timeAgo(item.create_time)
      let distanceText = ''
      if (item.distance !== null && item.distance !== undefined) {
        distanceText = '距您' + util.formatDistance(item.distance)
      }
      this.setData({ typeConfig, timeText, distanceText })
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { item: this.data.item })
    }
  }
})
