// components/idle-card/idle-card.js
Component({
  options: {
    addGlobalClass: true
  },
  properties: {
    item: { type: Object, value: {} },
    showCommunity: { type: Boolean, value: false }
  },
  data: {
    categoryConfig: {},
    timeText: '',
    coverImage: '',
    distanceText: ''
  },
  observers: {
    'item': function (item) {
      if (!item) return
      const util = require('../../utils/util.js')
      const categoryConfig = util.getCategoryConfig(item.category)
      const timeText = util.timeAgo(item.create_time)
      const coverImage = (item.photos && item.photos.length > 0) ? item.photos[0] : ''
      let distanceText = ''
      if (item.distance !== null && item.distance !== undefined) {
        distanceText = '距您' + util.formatDistance(item.distance)
      }
      this.setData({ categoryConfig, timeText, coverImage, distanceText })
    }
  },
  methods: {
    onTap() {
      this.triggerEvent('tap', { item: this.data.item })
    }
  }
})
