// pages/capsules/capsules.js
Page({
  data: {
    typeFilter: null,
    filteredUnlocked: [],
    sealedOfTypeCount: 0,
    loading: true
  },

  onLoad: function(options) {
    this.loadData();
  },

  onShow: function() {
    this.loadData();
  },

  onPullDownRefresh: function() {
    this.loadData();
    setTimeout(function() { wx.stopPullDownRefresh(); }, 800);
  },

  switchType: function(e) {
    var clickedType = e.currentTarget.dataset.type;
    var newFilter = this.data.typeFilter === clickedType ? null : clickedType;
    this.setData({ typeFilter: newFilter });
    this.loadData();
  },

  loadData: function() {
    var that = this;
    this.setData({ loading: true });

    try {
      if (wx.cloud) {
        var db = wx.cloud.database();
        var query = {};
        if (that.data.typeFilter) {
          query.bottle_type = that.data.typeFilter;
        }
        db.collection('bottles')
          .where(query)
          .orderBy('created_at', 'desc')
          .get({
            success: function(res) {
              var list = res.data || [];
              that.processData(list);
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
    var filtered = type ? mock.filter(function(b) {
      return b.bottle_type === type;
    }) : mock;
    this.processData(filtered);
  },

  processData: function(list) {
    var that = this;
    var unlockedItems = [];
    var sealedCount = 0;

    list.forEach(function(b) {
      var status = b.status || 'sealed';
      if (status === 'sealed') {
        sealedCount++;
      } else if (status === 'unlocked') {
        unlockedItems.push(that.formatItem(b));
      }
    });

    this.setData({
      filteredUnlocked: unlockedItems,
      sealedOfTypeCount: sealedCount,
      loading: false
    });
  },

  formatItem: function(b) {
    var type = b.bottle_type || b.type || 'self';
    var status = b.status || 'unlocked';

    var unlockAt = b.unlock_at || b.unlockAt || '';
    var locationName = b.location_name || b.locationName || '';
    var targetUserName = b.target_user_name || b.targetUserName || '';

    var subInfo = '';
    if (type === 'self' && locationName) {
      subInfo = '📍 ' + locationName;
    } else if (type === 'user' && targetUserName) {
      subInfo = '💌 ' + targetUserName;
    } else if (type === 'location' && locationName) {
      subInfo = '📍 ' + locationName;
    }

    return {
      id: b.id || b._id || ('b_' + Math.random().toString(36).substring(2, 10)),
      title: b.title || '未命名漂流瓶',
      unlockAtText: unlockAt ? unlockAt.substring(0, 10) : '',
      subInfo: subInfo,
      status: status
    };
  },

  onBottleTap: function(e) {
    var id = e.currentTarget.dataset.id;
    if (!id) return;
    wx.navigateTo({
      url: '/pages/capsule-detail/capsule-detail?id=' + id
    });
  },

  goSealedList: function() {
    var url = '/pages/capsule-sealed/capsule-sealed';
    if (this.data.typeFilter) {
      url += '?type=' + this.data.typeFilter;
    }
    wx.navigateTo({ url: url });
  },

  goCreate: function() {
    wx.navigateTo({ url: '/pages/capsule-create/capsule-create' });
  },

  getMockData: function() {
    var now = new Date();
    var fmt = function(days) {
      var d = new Date(now.getTime() + days * 86400000);
      var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
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
