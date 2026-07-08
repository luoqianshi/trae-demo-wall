const app = getApp();
const nicknames = ['小土豆', '香槟玫瑰', '樱花布丁', '午后红茶', '马卡龙', '蜜桃乌龙', '抹茶拿铁', '焦糖布丁'];

Page({
  data: {
    step: 1,
    identity: '',
    nickname: '',
    age: '',
    constellation: '',
    constellations: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
    ageOptions: Array.from({ length: 48 }, (_, i) => String(i + 18)),
    suggestedNickname: ''
  },

  onLoad() {
    const suggested = nicknames[Math.floor(Math.random() * nicknames.length)];
    this.setData({ suggestedNickname: suggested, nickname: suggested });
  },

  selectIdentity(e) {
    this.setData({ step: 2, identity: e.currentTarget.dataset.identity });
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value });
  },

  onAgeChange(e) {
    this.setData({ age: this.data.ageOptions[e.detail.value] });
  },

  onConstellationChange(e) {
    this.setData({ constellation: this.data.constellations[e.detail.value] });
  },

  completeLogin() {
    const { nickname, identity, age, constellation } = this.data;
    if (!nickname.trim()) {
      wx.showToast({ title: '请输入昵称', icon: 'none' });
      return;
    }
    if (!age) {
      wx.showToast({ title: '请填写年龄', icon: 'none' });
      return;
    }
    if (!constellation) {
      wx.showToast({ title: '请选择星座', icon: 'none' });
      return;
    }
    const user = {
      userId: `u_${Date.now()}`,
      openid: `mock_${Date.now()}`,
      identity,
      nickname: nickname.trim(),
      avatarUrls: ['#F8BBD0'],
      aboutMe: '',
      interests: [],
      city: '上海',
      latitude: null,
      longitude: null,
      locationAuthorized: false,
      height: 165,
      age: Number(age),
      constellation,
      mbti: 'ENFP',
      wantToDo: [],
      relationshipGoals: [],
      cannotDo: [],
      wechatId: '',
      nicknameChanged: false,
      voiceUrl: '',
      voiceDuration: 0,
      openingLine: '先从一杯咖啡和一次轻松聊天开始吧～',
      isPhotoBlur: false,
      remainingSwipes: 30,
      superLikesToday: 1,
      memberType: 'none',
      memberExpireAt: null,
      trialUsed: false
    };
    app.globalData.isLogin = true;
    app.globalData.userInfo = user;
    app.globalData.identity = identity;
    app.globalData.currentUser = user;
    wx.setStorageSync('userInfo', user);
    wx.showToast({ title: '欢迎加入！', icon: 'success' });
    setTimeout(() => wx.switchTab({ url: '/pages/index/index' }), 800);
  }
});
