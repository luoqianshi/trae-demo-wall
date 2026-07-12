// miniprogram/pages/apply/apply.js
const { call } = require('../../utils/request.js');

Page({
  data: {
    animalId: '',
    animalName: '',
    housingList: [
      { key: 'rent', label: '租房' },
      { key: 'self', label: '自有住房' },
      { key: 'family', label: '与家人同住' }
    ],
    form: {
      nickname: '',
      phone: '',
      city: '北京',
      housingType: 'rent',
      spaceSize: '60',
      familyMembers: '3',
      hasYard: false,
      allAgree: true,
      petExperience: '有养猫经验1年',
      reason: '',
      timeCommitment: '每天有2小时陪伴时间',
      financialAbility: '可以承担每月500元',
      otherPets: '',
      agreeReturn: false
    }
  },

  onLoad(options) {
    this.setData({
      animalId: options.id || '',
      animalName: decodeURIComponent(options.name || '')
    });
    // 预填用户信息
    const user = wx.getStorageSync('userInfo') || {};
    this.setData({
      'form.nickname': user.nickname || '',
      'form.phone': user.phone || '',
      'form.city': user.residenceCity || '北京',
      'form.housingType': (user.livingCondition && user.livingCondition.housingType) || 'rent',
      'form.spaceSize': (user.livingCondition && user.livingCondition.spaceSize) || '60',
      'form.familyMembers': (user.livingCondition && user.livingCondition.familyMembers) || '3',
      'form.hasYard': (user.livingCondition && user.livingCondition.hasYard) || false,
      'form.allAgree': (user.livingCondition && user.livingCondition.allAgree) || true,
      'form.petExperience': user.petExperience || ''
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: e.detail.value });
  },

  chooseHousing(e) {
    this.setData({ 'form.housingType': e.currentTarget.dataset.key });
  },

  toggleBool(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ['form.' + field]: !this.data.form[field] });
  },

  submit() {
    const f = this.data.form;
    if (!f.reason) return wx.showToast({ title: '请填写领养动机', icon: 'none' });
    if (!f.timeCommitment) return wx.showToast({ title: '请填写陪伴时间', icon: 'none' });
    if (!f.agreeReturn) return wx.showToast({ title: '请勾选领养承诺', icon: 'none' });
    if (!f.phone) return wx.showToast({ title: '请填写联系方式', icon: 'none' });

    wx.showLoading({ title: '提交中' });
    call('applySubmit', {
      animalId: this.data.animalId,
      applicationForm: {
        reason: f.reason,
        timeCommitment: f.timeCommitment,
        financialAbility: f.financialAbility,
        familyAgree: f.allAgree,
        agreeReturn: f.agreeReturn,
        otherPets: f.otherPets
      }
    }).then(() => {
      wx.hideLoading();
      wx.showModal({
        title: '申请已提交 🎉',
        content: '工作人员会在 24-48 小时内与您联系，请留意微信消息。',
        showCancel: false,
        confirmText: '好的',
        success: () => {
          wx.navigateBack({ delta: 2 });
        }
      });
    }).catch(() => wx.hideLoading());
  }
});
