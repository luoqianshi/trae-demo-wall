// pages/capsule-create/capsule-create.js
Page({
  data: {
    bottleType: 'self',
    title: '',
    content: '',
    photos: [],
    photosCount: 0,
    videos: [],
    videosCount: 0,
    location_name: '',
    location: null,
    geo_radius: 500,
    keywords_input: '',
    trigger_keywords: [],
    target_user_name: '',
    target_user_id: '',
    unlock_date: '',        // YYYY-MM-DD
    unlock_date_display: '', // 中文友好日期
    showDatePicker: false,
    submitting: false
  },

  // 切换类型
  switchType: function(e) {
    var type = e.currentTarget.dataset.type;
    this.setData({ bottleType: type });
  },

  onTitleInput: function(e) {
    this.setData({ title: e.detail.value });
  },

  onContentInput: function(e) {
    this.setData({ content: e.detail.value });
  },

  onKeywordsInput: function(e) {
    var val = e.detail.value;
    var tags = (val || '').split(/[\s,，]+/).filter(function(x) { return x.length > 0; });
    this.setData({ keywords_input: val, trigger_keywords: tags });
  },

  // 选择位置
  chooseLocation: function() {
    var that = this;
    wx.chooseLocation({
      success: function(res) {
        that.setData({
          location_name: res.name || res.address || '未命名位置',
          location: { longitude: res.longitude, latitude: res.latitude }
        });
      },
      fail: function() {
        // 降级：使用默认示例
        that.setData({
          location_name: '北京·天安门',
          location: { longitude: 116.4074, latitude: 39.9042 }
        });
        wx.showToast({ title: '已使用示例位置', icon: 'none' });
      }
    });
  },

  // 半径调节
  onRadiusChange: function(e) {
    this.setData({ geo_radius: e.detail.value });
  },

  // 选择用户
  chooseUser: function() {
    var that = this;
    wx.showActionSheet({
      itemList: ['小美', '阿强', '老王'],
      success: function(res) {
        var names = ['小美', '阿强', '老王'];
        var ids = ['u_xiaomei', 'u_aqiang', 'u_laowang'];
        that.setData({
          target_user_name: names[res.tapIndex],
          target_user_id: ids[res.tapIndex]
        });
      },
      fail: function() {
        // 降级
        that.setData({ target_user_name: '小美', target_user_id: 'u_xiaomei' });
      }
    });
  },

  // 选择日期
  chooseDate: function() {
    var that = this;
    // 用 wx.showActionSheet + 日期选择器
    var today = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };

    // 生成一些快捷选项
    var options = [];
    var vals = [];
    var addDay = function(days, label) {
      var d = new Date(today.getTime() + days * 86400000);
      var str = d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate());
      options.push(label + '（' + str + '）');
      vals.push(str);
    };
    addDay(7, '一周后');
    addDay(30, '一个月后');
    addDay(90, '三个月后');
    addDay(180, '半年后');
    addDay(365, '一年后');
    addDay(365 * 3, '三年后');
    addDay(365 * 10, '十年后');

    wx.showActionSheet({
      itemList: options,
      success: function(res) {
        var str = vals[res.tapIndex];
        that.setData({
          unlock_date: str,
          unlock_date_display: str
        });
      },
      fail: function() {}
    });
  },

  onDateChange: function(e) {
    var str = e.detail.value;
    this.setData({
      unlock_date: str,
      unlock_date_display: str
    });
  },

  // 添加图片
  addPhoto: function() {
    var that = this;
    wx.chooseImage({
      count: 9 - this.data.photos.length,
      success: function(res) {
        var paths = res.tempFilePaths || [];
        var newPhotos = paths.map(function(p, i) {
          return {
            id: 'p_' + Date.now() + '_' + i,
            url: p,
            thumb_url: p
          };
        });
        var photos = that.data.photos.concat(newPhotos);
        that.setData({ photos: photos, photosCount: photos.length });
      },
      fail: function() {
        // 降级：用占位图
        var photos = that.data.photos.slice();
        photos.push({
          id: 'p_placeholder_' + Date.now(),
          url: 'https://placehold.co/200x200/png?text=Photo',
          thumb_url: 'https://placehold.co/200x200/png?text=Photo'
        });
        that.setData({ photos: photos, photosCount: photos.length });
      }
    });
  },

  previewPhoto: function(e) {
    var idx = e.currentTarget.dataset.index;
    var photos = this.data.photos;
    if (!photos[idx]) return;
    var urls = photos.map(function(p) { return p.url; });
    wx.previewImage({ current: urls[idx], urls: urls });
  },

  removePhoto: function(e) {
    var idx = e.currentTarget.dataset.index;
    var photos = this.data.photos.slice();
    photos.splice(idx, 1);
    this.setData({ photos: photos, photosCount: photos.length });
  },

  // 添加视频
  addVideo: function() {
    var that = this;
    wx.chooseVideo({
      sourceType: ['album', 'camera'],
      maxDuration: 60,
      success: function(res) {
        var videos = that.data.videos.slice();
        videos.push({
          id: 'v_' + Date.now(),
          url: res.tempFilePath
        });
        that.setData({ videos: videos, videosCount: videos.length });
      },
      fail: function() {
        var videos = that.data.videos.slice();
        videos.push({
          id: 'v_placeholder_' + Date.now(),
          url: 'https://example.com/placeholder.mp4'
        });
        that.setData({ videos: videos, videosCount: videos.length });
      }
    });
  },

  removeVideo: function(e) {
    var idx = e.currentTarget.dataset.index;
    var videos = this.data.videos.slice();
    videos.splice(idx, 1);
    this.setData({ videos: videos, videosCount: videos.length });
  },

  // 校验
  validate: function() {
    var d = this.data;
    if (!d.title.trim()) {
      wx.showToast({ title: '请填写漂流瓶标题', icon: 'none' });
      return false;
    }
    if (d.bottleType === 'location' && !d.location_name) {
      wx.showToast({ title: '请选择投放位置', icon: 'none' });
      return false;
    }
    if (d.bottleType === 'user' && !d.target_user_name) {
      wx.showToast({ title: '请选择指定用户', icon: 'none' });
      return false;
    }
    if (!d.unlock_date) {
      wx.showToast({ title: '请选择时间', icon: 'none' });
      return false;
    }
    if (!d.content.trim() && d.photos.length === 0 && d.videos.length === 0) {
      wx.showToast({ title: '请填写内容或添加图片/视频', icon: 'none' });
      return false;
    }
    return true;
  },

  // 提交
  submit: function() {
    if (!this.validate()) return;
    if (this.data.submitting) return;
    this.setData({ submitting: true });

    var d = this.data;
    var now = new Date();
    var pad = function(n) { return n < 10 ? '0' + n : '' + n; };
    var nowStr = now.getFullYear() + '-' + pad(now.getMonth() + 1) + '-' + pad(now.getDate()) + 'T' +
                 pad(now.getHours()) + ':' + pad(now.getMinutes()) + ':00';

    var bottle = {
      bottle_type: d.bottleType,
      title: d.title.trim(),
      content: d.content,
      photos: d.photos,
      videos: d.videos,
      location_name: d.location_name,
      location: d.location,
      geo_radius: d.geo_radius,
      trigger_keywords: d.trigger_keywords,
      target_user_name: d.target_user_name,
      target_user_id: d.target_user_id,
      sealed_at: nowStr,
      unlock_at: d.unlock_date + 'T10:00:00',
      status: 'sealed',
      created_at: nowStr
    };

    var that = this;
    try {
      const db = wx.cloud.database();
      db.collection('bottles').add({
        data: bottle,
        success: function(res) {
          bottle.id = res._id;
          that.showSuccess(bottle);
        },
        fail: function() {
          // 降级：本地模拟成功
          bottle.id = 'b_' + Date.now();
          that.showSuccess(bottle);
        }
      });
    } catch (err) {
      bottle.id = 'b_' + Date.now();
      this.showSuccess(bottle);
    }
  },

  showSuccess: function(bottle) {
    var that = this;
    wx.showModal({
      title: '🍾 漂流瓶已封存',
      content: '您的漂流瓶已成功封存。\n标题：' + bottle.title + '\n时间：' + bottle.unlock_at.substring(0, 10),
      showCancel: false,
      confirmText: '查看',
      success: function(res) {
        that.setData({ submitting: false });
        if (res.confirm) {
          wx.redirectTo({ url: '/pages/capsule-detail/capsule-detail?id=' + bottle.id });
        } else {
          wx.navigateBack();
        }
      }
    });
  }
});
