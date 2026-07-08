// pages/capsule-detail/capsule-detail.js
Page({
  data: {
    bottle: null,
    commentInput: '',
    submitting: false,
    loading: true
  },

  onLoad: function(options) {
    this.bottleId = options.id;
    this.loadDetail();
  },

  onShareAppMessage: function() {
    var b = this.data.bottle;
    return {
      title: (b && b.title) || '我的时光漂流瓶',
      path: '/pages/capsule-detail/capsule-detail?id=' + this.bottleId
    };
  },

  loadDetail: function() {
    var that = this;
    try {
      if (wx.cloud) {
        var db = wx.cloud.database();
        db.collection('bottles').doc(this.bottleId).get({
          success: function(res) {
            if (res.data) {
              that.setData({ bottle: that.formatBottle(res.data), loading: false });
            } else {
              that.loadLocal();
            }
          },
          fail: function() { that.loadLocal(); }
        });
        return;
      }
    } catch (e) {}
    this.loadLocal();
  },

  loadLocal: function() {
    var that = this;
    // 先通过统一 API 获取（支持 mockCapsules 数据）
    try {
      var { request } = require('../../utils/request');
      request('GET', '/api/capsules/' + this.bottleId)
        .then(function(data) {
          if (data && data.capsule) {
            that.setData({ bottle: that.formatBottle(data.capsule), loading: false });
          } else {
            that.fallbackMockBottle();
          }
        })
        .catch(function() {
          that.fallbackMockBottle();
        });
    } catch (e) {
      this.fallbackMockBottle();
    }
  },

  fallbackMockBottle: function() {
    var mock = this.getMockBottle(this.bottleId);
    if (mock) {
      this.setData({ bottle: this.formatBottle(mock), loading: false });
    } else {
      this.setData({ bottle: null, loading: false });
    }
  },

  formatBottle: function(b) {
    var type = b.bottle_type || b.type || 'self';
    var status = b.status || 'sealed';

    var sealedAt = b.sealed_at || b.created_at || b.sealedAt || '';
    var unlockAt = b.unlock_at || b.unlockAt || '';
    var keywordsText = (b.trigger_keywords || b.triggerKeywords || []).join('、');

    var comments = (b.comments || []).map(function(c) {
      return {
        id: c.id || c._id || ('c_' + Math.random().toString(36).substring(2, 8)),
        text: c.text || c.content || '',
        created_at_text: c.created_at_text || (c.created_at ? c.created_at.substring(0, 10) : '') || '刚刚'
      };
    });

    var photos = (b.photos || []).map(function(p) {
      return {
        id: p.id || ('p_' + Math.random().toString(36).substring(2, 8)),
        url: p.url || p.pic || p.thumb_url || ''
      };
    });

    var videos = (b.videos || []).map(function(v) {
      return {
        id: v.id || ('v_' + Math.random().toString(36).substring(2, 8)),
        url: v.url || v.video || ''
      };
    });

    return {
      id: b.id || b._id || this.bottleId,
      bottle_type: type,
      type: type,
      status: status,
      title: b.title || '未命名漂流瓶',
      content_text: (typeof b.content === 'string' ? b.content : (b.content && b.content.text ? b.content.text : '')) || '',
      sealed_at_text: sealedAt ? sealedAt.substring(0, 10) : '',
      unlock_at_text: unlockAt ? unlockAt.substring(0, 10) : '',
      location_name: b.location_name || b.locationName || '',
      geo_radius: b.geo_radius || b.geoRadius || 0,
      trigger_keywords: b.trigger_keywords || b.triggerKeywords || [],
      keywordsText: keywordsText,
      target_user_name: b.target_user_name || b.targetUserName || '',
      target_user_id: b.target_user_id || b.targetUserId || '',
      photos: photos,
      photosCount: photos.length,
      videos: videos,
      videosCount: videos.length,
      comments: comments,
      commentsCount: comments.length
    };
  },

  // 图片预览
  previewPhoto: function(e) {
    var url = e.currentTarget.dataset.url;
    if (!url || !this.data.bottle) return;
    var urls = (this.data.bottle.photos || []).map(function(p) { return p.url; });
    wx.previewImage({ current: url, urls: urls });
  },

  playVideo: function(e) {
    var url = e.currentTarget.dataset.url;
    if (!url) return;
    wx.showToast({ title: '即将打开视频', icon: 'none' });
  },

  onCommentInput: function(e) {
    this.setData({ commentInput: e.detail.value });
  },

  // 提交评论并放回
  submitComment: function() {
    var text = (this.data.commentInput || '').trim();
    if (!text) {
      wx.showToast({ title: '请填写留言内容', icon: 'none' });
      return;
    }
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    var that = this;
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var dateText = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate());

    var newComment = {
      id: 'c_' + Date.now(),
      text: text,
      created_at_text: dateText
    };

    var after = function() {
      var bottle = that.data.bottle;
      if (!bottle) return;
      var comments = (bottle.comments || []).slice();
      comments.unshift(newComment);
      bottle.comments = comments;
      bottle.commentsCount = comments.length;
      that.setData({
        bottle: bottle,
        commentInput: '',
        submitting: false
      });
    };

    try {
      if (wx.cloud) {
        var db = wx.cloud.database();
        db.collection('bottles').doc(this.bottleId).update({
          data: { comments: db.command.push(newComment) },
          success: function() {
            after();
            wx.showToast({ title: '已放回漂流瓶', icon: 'success' });
          },
          fail: function() { after(); wx.showToast({ title: '已放回（本地）', icon: 'success' }); }
        });
        return;
      }
    } catch (e) {}

    after();
    wx.showToast({ title: '已放回（本地）', icon: 'success' });
  },

  shareBottle: function() {
    wx.showShareMenu({ withShareTicket: true });
    wx.showToast({ title: '请点击右上角分享', icon: 'none' });
  },

  deleteBottle: function() {
    var that = this;
    wx.showModal({
      title: '删除漂流瓶',
      content: '确认要删除这个漂流瓶吗？删除后无法恢复。',
      confirmColor: '#f472b6',
      success: function(res) {
        if (!res.confirm) return;
        that.setData({ submitting: true });

        var done = function() {
          wx.showToast({ title: '已删除', icon: 'success' });
          that.setData({ submitting: false });
          setTimeout(function() { wx.navigateBack(); }, 700);
        };

        try {
          if (wx.cloud) {
            var db = wx.cloud.database();
            db.collection('bottles').doc(that.bottleId).remove({
              success: done,
              fail: done
            });
            return;
          }
        } catch (e) {}
        done();
      }
    });
  },

  goBack: function() {
    wx.navigateBack();
  },

  getMockBottle: function(id) {
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var fmt = function(days) {
      var d = new Date(now.getTime() + days * 86400000);
      return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate()) + 'T10:00:00';
    };

    var map = {
      'demo_self_1': {
        id: 'demo_self_1',
        bottle_type: 'self',
        status: 'sealed',
        title: '给一年后的自己',
        content: '此刻你正在为了梦想努力，希望一年后的你依然坚定。\n\n记得多陪陪家人，多吃蔬菜，多出去走走。',
        sealed_at: fmt(-7),
        unlock_at: fmt(358),
        trigger_keywords: ['梦想', '坚持']
      },
      'demo_self_2': {
        id: 'demo_self_2',
        bottle_type: 'self',
        status: 'unlocked',
        title: '去年今天的心情',
        content: '今天天气很好，你完成了一个里程碑。记得犒劳自己。\n\n希望未来的你依然热爱生活。',
        sealed_at: fmt(-365),
        unlock_at: fmt(-1)
      },
      'demo_self_3': {
        id: 'demo_self_3',
        bottle_type: 'self',
        status: 'unlocked',
        title: '一个小秘密',
        content: '这是属于你的小秘密，希望打开时你能会心一笑。',
        sealed_at: fmt(-200),
        unlock_at: fmt(-50),
        location_name: '北京·朝阳'
      },
      'demo_self_4': {
        id: 'demo_self_4',
        bottle_type: 'self',
        status: 'sealed',
        title: '未开放',
        content: '这个漂流瓶还未到开启时间，请耐心等待。',
        sealed_at: fmt(-30),
        unlock_at: fmt(90)
      },
      'demo_location_1': {
        id: 'demo_location_1',
        bottle_type: 'location',
        status: 'unlocked',
        title: '外滩边的秘密',
        content: '当你读到这个漂流瓶时，也许你已经走过很多路。\n\n希望你能留下一段属于你的故事～',
        sealed_at: fmt(-30),
        unlock_at: fmt(-20),
        location_name: '上海·外滩',
        geo_radius: 200,
        comments: [
          { id: 'c1', text: '今天我也在上海，正好路过，心情不错。', created_at_text: '2026-03-01' },
          { id: 'c2', text: '读到你的留言，感觉很亲切，谢谢你。', created_at_text: '2026-04-15' }
        ]
      },
      'demo_location_2': {
        id: 'demo_location_2',
        bottle_type: 'location',
        status: 'sealed',
        title: '未开放的回忆',
        content: '这个漂流瓶会在半年后开放给附近的人获取。',
        sealed_at: fmt(-3),
        unlock_at: fmt(180),
        location_name: '成都·宽窄巷子',
        geo_radius: 500
      },
      'demo_location_3': {
        id: 'demo_location_3',
        bottle_type: 'location',
        status: 'unlocked',
        title: '街角的惊喜',
        content: '在这个街角留下一点惊喜，希望发现它的人能有好心情。',
        sealed_at: fmt(-100),
        unlock_at: fmt(-30),
        location_name: '杭州·西湖',
        geo_radius: 300
      },
      'demo_user_1': {
        id: 'demo_user_1',
        bottle_type: 'user',
        status: 'unlocked',
        title: '致好友的一封信',
        content: '这封信会在你生日那天送到，祝你生日快乐！\n\n愿你永远被世界温柔以待。',
        sealed_at: fmt(-15),
        unlock_at: fmt(-5),
        target_user_name: '小美'
      },
      'demo_user_2': {
        id: 'demo_user_2',
        bottle_type: 'user',
        status: 'sealed',
        title: '生日惊喜',
        content: '老王，生日快乐！这是我提前写好的一封信，等到那天你才能看到。',
        sealed_at: fmt(-2),
        unlock_at: fmt(60),
        target_user_name: '老王'
      },
      'demo_user_3': {
        id: 'demo_user_3',
        bottle_type: 'user',
        status: 'unlocked',
        title: '迟到的祝福',
        content: '虽然迟了，但祝福永远不会过期。',
        sealed_at: fmt(-400),
        unlock_at: fmt(-100),
        target_user_name: '阿强'
      }
    };

    return map[id] || map['demo_self_1'];
  }
});
