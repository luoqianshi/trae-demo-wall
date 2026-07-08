// pages/capsule-sealed/capsule-sealed.js
Page({
  data: {
    typeFilter: null,
    sealedList: []
  },

  onLoad: function(options) {
    // options.type 可能为空字符串、'null' 或 'self' / 'user' / 'location'
    var type = options.type && options.type !== '' && options.type !== 'null' ? options.type : null;
    this.setData({ typeFilter: type });
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  loadData: function() {
    var that = this;
    var type = this.data.typeFilter;

    try {
      if (wx.cloud) {
        var db = wx.cloud.database();
        var query = { status: 'sealed' };
        if (type) {
          query.bottle_type = type;
        }
        db.collection('bottles')
          .where(query)
          .orderBy('created_at', 'desc')
          .get({
            success: function(res) {
              var list = res.data || [];
              that.formatAndSet(list);
            },
            fail: function() {
              that.loadMock();
            }
          });
        return;
      }
    } catch (e) {}
    this.loadMock();
  },

  loadMock: function() {
    var type = this.data.typeFilter;
    var mock = this.getMockData();
    var filtered = mock.filter(function(b) {
      var match = b.status === 'sealed';
      if (type) match = match && b.bottle_type === type;
      return match;
    });
    this.formatAndSet(filtered);
  },

  formatAndSet: function(list) {
    var formatted = list.map(function(b) {
      var sealedAt = b.sealed_at || b.created_at || b.sealedAt || '';
      var sealedAtText = sealedAt ? sealedAt.substring(0, 10) : '';
      return {
        id: b.id || b._id || ('b_' + Math.random().toString(36).substring(2, 10)),
        sealedAtText: sealedAtText,
        status: 'sealed'
      };
    });
    this.setData({ sealedList: formatted });
  },

  onSealedItemTap: function(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: '/pages/capsule-detail/capsule-detail?id=' + id
    });
  },

  getMockData: function() {
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var fmt = function(days) {
      var d = new Date(now.getTime() + days * 86400000);
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T10:00:00';
    };

    return [
      { id: 'demo_self_1', bottle_type: 'self', status: 'sealed', title: '给一年后的自己', sealed_at: fmt(-7), unlock_at: fmt(358) },
      { id: 'demo_self_2', bottle_type: 'self', status: 'unlocked', title: '去年今天的心情', sealed_at: fmt(-365), unlock_at: fmt(-1) },
      { id: 'demo_self_3', bottle_type: 'self', status: 'unlocked', title: '一个小秘密', sealed_at: fmt(-200), unlock_at: fmt(-50), location_name: '北京·朝阳' },
      { id: 'demo_self_4', bottle_type: 'self', status: 'sealed', title: '未开放', sealed_at: fmt(-30), unlock_at: fmt(90) },
      { id: 'demo_location_1', bottle_type: 'location', status: 'unlocked', title: '外滩边的秘密', sealed_at: fmt(-30), unlock_at: fmt(-20), location_name: '上海·外滩' },
      { id: 'demo_location_2', bottle_type: 'location', status: 'sealed', title: '未开放的回忆', sealed_at: fmt(-3), unlock_at: fmt(180), location_name: '成都·宽窄巷子' },
      { id: 'demo_location_3', bottle_type: 'location', status: 'unlocked', title: '街角的惊喜', sealed_at: fmt(-100), unlock_at: fmt(-30), location_name: '杭州·西湖' },
      { id: 'demo_user_1', bottle_type: 'user', status: 'unlocked', title: '致好友的一封信', sealed_at: fmt(-15), unlock_at: fmt(-5), target_user_name: '小美' },
      { id: 'demo_user_2', bottle_type: 'user', status: 'sealed', title: '生日惊喜', sealed_at: fmt(-2), unlock_at: fmt(60), target_user_name: '老王' },
      { id: 'demo_user_3', bottle_type: 'user', status: 'unlocked', title: '迟到的祝福', sealed_at: fmt(-400), unlock_at: fmt(-100), target_user_name: '阿强' }
    ];
  }
});
