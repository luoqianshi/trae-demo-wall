// 首页 - 时光胶囊
const { request } = require('../../utils/request');

Page({
  data: {
    isLoggedIn: false,
    userInfo: null,
    loggingIn: false,
    capsuleCount: 0,
    recentUnlocked: [],
    // 假日今日
    holidayReminders: [],
    holidayLoading: true,
    // N年今日
    onThisDay: null,
    onThisDayLoading: true,
    // 黑暗时刻
    darkMomentOverview: null,
    darkMomentLoading: true,
    // 暖心时刻
    warmMomentOverview: null,
    warmMomentLoading: true
  },

  onShow() {
    const app = getApp();
    const { isLoggedIn, userInfo, capsuleList } = app.globalData;

    if (isLoggedIn) {
      this.setData({ isLoggedIn, userInfo });

      // 加载胶囊数据
      request('GET', '/api/capsules', { status: 'unlocked', page: 1, size: 3 })
        .then(data => {
          const items = (data.items || []).map(formatCapsule);
          this.setData({
            capsuleCount: data.total || capsuleList.length,
            recentUnlocked: items
          });
        })
        .catch(() => {});

      // 加载假日今日提醒
      this.loadHolidayToday();

      // 加载 N年今日
      this.loadOnThisDay();

      // 加载黑暗时刻概览
      this.loadDarkMomentOverview();

      // 加载暖心时刻概览
      this.loadWarmMomentOverview();
    } else {
      this.setData({ isLoggedIn: false, userInfo: null });
    }
  },

  // 加载假日今日
  loadHolidayToday() {
    this.setData({ holidayLoading: true });
    request('GET', '/api/holiday-today')
      .then(data => {
        this.setData({
          holidayReminders: data.reminders || [],
          holidayLoading: false
        });
      })
      .catch(() => {
        this.setData({ holidayLoading: false });
      });
  },

  // 加载 N年今日
  loadOnThisDay() {
    this.setData({ onThisDayLoading: true });
    request('GET', '/api/on-this-day')
      .then(data => {
        // 预处理：为每年的照片添加 url_list 字段（WXML 不支持 map 表达式）
        if (data.years && data.years.length) {
          data.years.forEach(y => {
            if (y.photos && y.photos.length) {
              y.photo_urls = y.photos.map(p => p.url);
            } else {
              y.photo_urls = [];
            }
          });
        }
        this.setData({
          onThisDay: data,
          onThisDayLoading: false
        });
      })
      .catch(() => {
        this.setData({ onThisDayLoading: false });
      });
  },

  // 手机号授权回调
  onGetPhoneNumber(e) {
    this.setData({ loggingIn: true });
    const app = getApp();

    app.handlePhoneLogin(e)
      .then(() => this.onShow())
      .catch(err => {
        // 用户取消授权不弹 toast
        if (err.message !== '授权已取消') {
          wx.showToast({ title: err.message || '登录失败', icon: 'none' });
        }
      })
      .finally(() => this.setData({ loggingIn: false }));
  },

  // 跳转
  goCreate()  { wx.navigateTo({ url: '/pages/capsule-create/capsule-create' }); },
  goCapsules(){ wx.switchTab({ url: '/pages/capsules/capsules' }); },
  goImport()  { wx.navigateTo({ url: '/pages/import/import' }); },

  // 跳转 N年今日详情
  goOnThisDay() {
    wx.navigateTo({ url: '/pages/on-this-day/on-this-day' });
  },

  // 加载黑暗时刻概览
  loadDarkMomentOverview() {
    this.setData({ darkMomentLoading: true });
    request('GET', '/api/dark-moments/overview')
      .then(data => {
        this.setData({
          darkMomentOverview: data,
          darkMomentLoading: false
        });
      })
      .catch(() => {
        this.setData({ darkMomentLoading: false });
      });
  },

  // 跳转黑暗时刻
  goDarkMoments() {
    wx.navigateTo({ url: '/pages/dark-moments/dark-moments' });
  },

  // 加载暖心时刻概览
  loadWarmMomentOverview() {
    this.setData({ warmMomentLoading: true });
    request('GET', '/api/warm-moments/overview')
      .then(data => {
        this.setData({
          warmMomentOverview: data,
          warmMomentLoading: false
        });
      })
      .catch(() => {
        this.setData({ warmMomentLoading: false });
      });
  },

  // 跳转暖心时刻
  goWarmMoments() {
    wx.navigateTo({ url: '/pages/warm-moments/warm-moments' });
  },

  onCapsuleTap(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: `/pages/capsule-detail/capsule-detail?id=${id}` });
  },

  // 点击呵护提醒卡片
  tapReminder(e) {
    const reminder = e.currentTarget.dataset.reminder;
    if (!reminder) return;

    if (reminder.is_today && reminder.blessing_text) {
      wx.showModal({
        title: reminder.emoji + ' ' + reminder.title,
        content: '小祝福语：\n' + reminder.blessing_text,
        confirmText: '复制祝福',
        cancelText: '知道了',
        confirmColor: '#7c5cfc',
        success: (res) => {
          if (res.confirm) {
            wx.setClipboardData({
              data: reminder.blessing_text,
              success: () => {
                wx.showToast({ title: '已复制祝福语', icon: 'success' });
              }
            });
          }
        }
      });
    } else if (!reminder.is_today) {
      wx.showToast({
        title: `已记下：${reminder.days_left}天后是${reminder.person}的日子`,
        icon: 'none',
        duration: 2000
      });
    }
  }
});

function formatCapsule(c) {
  const diff = new Date(c.unlock_at).getTime() - Date.now();
  let countdownText = '';
  if (c.status === 'sealed' && diff > 0) {
    const d = Math.ceil(diff / 86400000);
    countdownText = d > 1 ? `${d} 天后解锁` : '即将解锁';
  }
  return {
    ...c,
    sealed_at_text: formatDate(c.sealed_at),
    unlocked_at_text: c.unlock_at ? formatDate(c.unlock_at) : '',
    countdown_text: countdownText
  };
}

function formatDate(isoStr) {
  if (!isoStr) return '';
  const d = new Date(isoStr);
  return `${d.getFullYear()}/${String(d.getMonth()+1).padStart(2,'0')}/${String(d.getDate()).padStart(2,'0')}`;
}
