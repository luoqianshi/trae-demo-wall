// 漂流瓶卡片组件
Component({
  properties: {
    // 类型：self / location / user
    type: {
      type: String,
      value: 'self'
    },
    // 漂流瓶标题
    title: {
      type: String,
      value: ''
    },
    // 封存日期文字
    sealedAtText: {
      type: String,
      value: ''
    },
    // 开启日期文字
    unlockAtText: {
      type: String,
      value: ''
    },
    // 地点（location 类型）
    locationName: {
      type: String,
      value: ''
    },
    // 状态：sealed / available / unlocked
    status: {
      type: String,
      value: 'sealed'
    },
    // 状态文字（缺省时自动生成）
    statusText: {
      type: String,
      value: ''
    },
    // 类型 emoji（缺省时根据 type 自动生成）
    typeEmoji: {
      type: String,
      value: ''
    }
  },

  methods: {
    onTap: function() {
      this.triggerEvent('cardtap', {
        type: this.data.type,
        title: this.data.title
      });
    }
  }
});
