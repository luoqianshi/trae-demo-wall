const app = getApp();

Page({
  data: {
    form: { avatarUrls: [], nickname: '', aboutMe: '', height: '', city: '', constellation: '', mbti: '', interests: [], wantToDo: [], relationshipGoals: [], cannotDo: [], openingLine: '', wechatId: '', isPhotoBlur: false },
    constellations: ['白羊座', '金牛座', '双子座', '巨蟹座', '狮子座', '处女座', '天秤座', '天蝎座', '射手座', '摩羯座', '水瓶座', '双鱼座'],
    mbtiTypes: ['INTJ', 'INTP', 'ENTJ', 'ENTP', 'INFJ', 'INFP', 'ENFJ', 'ENFP', 'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ', 'ISTP', 'ISFP', 'ESTP', 'ESFP'],
    interestTags: [],
    wantToDoTags: [],
    relationshipGoalTags: [],
    cannotDoTags: [],
    originalNickname: '',
    nicknameLocked: false
  },

  onLoad() {
    const user = app.globalData.currentUser || {};
    const form = {
      avatarUrls: user.avatarUrls || [],
      nickname: user.nickname || '',
      aboutMe: user.aboutMe || '',
      height: user.height || '',
      city: user.city || '',
      constellation: user.constellation || '',
      mbti: user.mbti || '',
      interests: user.interests || [],
      wantToDo: user.wantToDo || [],
      relationshipGoals: user.relationshipGoals || [],
      cannotDo: user.cannotDo || [],
      openingLine: user.openingLine || '先从一杯咖啡和一次轻松聊天开始吧～',
      wechatId: user.wechatId || '',
      isPhotoBlur: user.isPhotoBlur || false
    };
    this.setData({
      form,
      originalNickname: user.nickname || '',
      nicknameLocked: !!user.nicknameChanged,
      interestTags: app.globalData.interestEmojis || [],
      wantToDoTags: app.globalData.wantToDoTags || [],
      relationshipGoalTags: app.globalData.relationshipGoalTags || [],
      cannotDoTags: app.globalData.cannotDoTags || []
    });
  },

  onInput(e) {
    this.setData({ [`form.${e.currentTarget.dataset.field}`]: e.detail.value });
  },

  onPickerChange(e) {
    const field = e.currentTarget.dataset.field;
    const list = field === 'constellation' ? this.data.constellations : this.data.mbtiTypes;
    this.setData({ [`form.${field}`]: list[e.detail.value] });
  },

  onInterestsChange(e) { this.setData({ 'form.interests': e.detail.selected }); },
  onWantToDoChange(e) { this.setData({ 'form.wantToDo': e.detail.selected }); },
  onRelationshipGoalChange(e) { this.setData({ 'form.relationshipGoals': e.detail.selected }); },
  onCannotDoChange(e) { this.setData({ 'form.cannotDo': e.detail.selected }); },
  onBlurChange(e) { this.setData({ 'form.isPhotoBlur': e.detail.value }); },

  fillWechatExample() {
    const user = app.globalData.currentUser || wx.getStorageSync('userInfo') || {};
    const exampleWechatId = user.wechatId || 'wx_potato_123';
    this.setData({ 'form.wechatId': exampleWechatId });
    wx.showToast({ title: '已填入示例微信号', icon: 'success' });
  },

  addPhoto() {
    const count = 9 - this.data.form.avatarUrls.length;
    if (count <= 0) {
      wx.showToast({ title: '最多上传9张照片', icon: 'none' });
      return;
    }
    if (wx.chooseMedia) {
      wx.chooseMedia({
        count,
        mediaType: ['image'],
        sourceType: ['album', 'camera'],
        sizeType: ['compressed'],
        success: res => {
          this.handleSelectedPhotos((res.tempFiles || []).map(file => file.tempFilePath).filter(Boolean));
        },
        fail: err => this.handlePhotoChooseFail(err)
      });
      return;
    }
    wx.chooseImage({
      count,
      sourceType: ['album', 'camera'],
      sizeType: ['compressed'],
      success: res => {
        this.handleSelectedPhotos(res.tempFilePaths || []);
      },
      fail: err => this.handlePhotoChooseFail(err)
    });
  },

  handleSelectedPhotos(selected) {
    if (!selected.length) {
      wx.showToast({ title: '未选择照片', icon: 'none' });
      return;
    }
    const avatarUrls = [...this.data.form.avatarUrls, ...selected].slice(0, 9);
    this.saveAvatarUrls(avatarUrls);
    wx.showToast({ title: '照片已添加', icon: 'success' });
  },

  handlePhotoChooseFail(err) {
    const msg = (err && err.errMsg) || '';
    if (msg.includes('auth') || msg.includes('authorize') || msg.includes('permission')) {
      wx.showModal({
        title: '需要相册权限',
        content: '请允许访问相册或相机后再上传照片。',
        confirmText: '去设置',
        cancelText: '稍后',
        success: res => {
          if (res.confirm) wx.openSetting();
        }
      });
      return;
    }
    wx.showToast({ title: '未选择照片', icon: 'none' });
  },

  saveAvatarUrls(avatarUrls) {
    this.setData({ 'form.avatarUrls': avatarUrls });
    const user = app.globalData.currentUser || wx.getStorageSync('userInfo') || {};
    user.avatarUrls = avatarUrls;
    app.globalData.currentUser = user;
    app.globalData.userInfo = user;
    wx.setStorageSync('userInfo', user);
  },

  previewPhoto(e) {
    const current = e.currentTarget.dataset.url;
    wx.previewImage({
      current,
      urls: this.data.form.avatarUrls
    });
  },

  removePhoto(e) {
    const index = e.currentTarget.dataset.index;
    const avatarUrls = [...this.data.form.avatarUrls];
    avatarUrls.splice(index, 1);
    this.saveAvatarUrls(avatarUrls);
  },

  setCoverPhoto(e) {
    const index = Number(e.currentTarget.dataset.index);
    const avatarUrls = [...this.data.form.avatarUrls];
    const [cover] = avatarUrls.splice(index, 1);
    avatarUrls.unshift(cover);
    this.saveAvatarUrls(avatarUrls);
    wx.showToast({ title: '已设为主封面', icon: 'success' });
  },

  movePhoto(e) {
    const index = Number(e.currentTarget.dataset.index);
    const direction = e.currentTarget.dataset.direction;
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    const avatarUrls = [...this.data.form.avatarUrls];
    if (targetIndex < 0 || targetIndex >= avatarUrls.length) return;
    [avatarUrls[index], avatarUrls[targetIndex]] = [avatarUrls[targetIndex], avatarUrls[index]];
    this.saveAvatarUrls(avatarUrls);
  },

  saveProfile() {
    if (!this.data.form.nickname.trim()) {
      wx.showToast({ title: '请填写昵称', icon: 'none' });
      return;
    }
    const user = app.globalData.currentUser || {};
    if (this.data.nicknameLocked && this.data.form.nickname !== this.data.originalNickname) {
      wx.showToast({ title: '昵称仅可修改3次', icon: 'none' });
      this.setData({ 'form.nickname': this.data.originalNickname });
      return;
    }
    if (!user.nicknameChanged && this.data.form.nickname !== this.data.originalNickname) {
      user.nicknameChanged = true;
    }
    Object.assign(user, this.data.form);
    app.globalData.currentUser = user;
    app.globalData.userInfo = user;
    wx.setStorageSync('userInfo', user);
    wx.showToast({ title: '保存成功', icon: 'success' });
    setTimeout(() => wx.navigateBack(), 800);
  }
});
