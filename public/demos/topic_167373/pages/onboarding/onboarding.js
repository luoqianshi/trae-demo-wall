// 入口：onboarding
const { appSettingsRepository } = require('../../data/repositories/index.js');

const STEP_DATA = [
  {
    icon: '记录',
    title: '欢迎使用',
    description: '排便健康记录工具，帮助您养成健康记录习惯',
    button: '下一步'
  },
  {
    icon: '快速',
    title: '快速记录',
    description: '10秒完成一次记录，Bristol 7 型图文选择，简单直观',
    button: '下一步'
  },
  {
    icon: '洞察',
    title: '健康洞察',
    description: '日历视图、健康统计、个性化建议，了解您的排便规律',
    button: '开始使用'
  }
];

Page({
  data: {
    currentStep: 0,
    iconText: STEP_DATA[0].icon,
    titleText: STEP_DATA[0].title,
    descText: STEP_DATA[0].description,
    buttonText: STEP_DATA[0].button
  },

  onLoad() {
    // PT-mp-006 修复：home 已成为首屏，onboarding 入口由 home 跳转而来，
    // 不再需要在此处自动跳转到 home
  },

  onNext() {
    const { currentStep } = this.data;
    if (currentStep < STEP_DATA.length - 1) {
      const next = currentStep + 1;
      this.setData({
        currentStep: next,
        iconText: STEP_DATA[next].icon,
        titleText: STEP_DATA[next].title,
        descText: STEP_DATA[next].description,
        buttonText: STEP_DATA[next].button
      });
    } else {
      this.onComplete();
    }
  },

  onSkip() {
    this.goToProfileSetup();
  },

  async onComplete() {
    try {
      await appSettingsRepository.setOnboardingCompleted();
    } catch (e) {
      console.error('[onboarding] 标记完成失败:', e);
    }
    this.goToProfileSetup();
  },

  goToProfileSetup() {
    wx.redirectTo({ url: '/pages/profile-setup/profile-setup' });
  }
});
