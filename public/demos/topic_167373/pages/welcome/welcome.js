// pages/welcome/welcome.js
// 首次启动三步式引导：
//   步骤 1/3：产品介绍（无须勾选）
//   步骤 2/3：用户须知（必须勾选才能下一步）
//   步骤 3/3：免责声明（必须勾选才能开始使用）

const { appSettingsRepository } = require('../../data/repositories/index.js');

const TERMS_TEXT = [
  '1. 本应用是健康记录工具，不会收集、不会上传您的任何数据到服务器',
  '2. 所有记录仅保存在您的手机本地，清除小程序数据会一并清除记录',
  '3. 本应用会读取您的本地时间用于标记记录发生时间',
  '4. 您可随时在「设置」中查看须知、免责声明、清除所有数据',
  '5. 请勿将本应用作为医疗诊断依据，如有健康问题请咨询专业医生',
  '6. 继续使用即表示您已阅读并同意以上条款'
];

const DISCLAIMER_TEXT = [
  '本应用仅作为健康记录工具，所有分析、建议仅供参考，不能替代专业医生的诊断和建议。',
  '本应用不提供任何医疗诊断、治疗或处方服务。',
  '使用本应用所产生的一切后果，由您本人承担。',
  '如出现持续性腹痛、便血、严重腹泻、便秘等异常症状，请立即就医。',
  '本应用不收集您的个人信息，不向第三方共享数据。',
  '点击「开始使用」即表示您已知晓并接受以上声明。'
];

Page({
  data: {
    step: 1, // 1=产品介绍，2=用户须知，3=免责声明
    totalSteps: 3,
    acceptedTerms: false,
    acceptedDisclaimer: false,
    termsText: TERMS_TEXT,
    disclaimerText: DISCLAIMER_TEXT
  },

  onLoad() {
    // 修复 PT-mp-welcome-003：welcome 不再是 pages[0]，由 app.js onLaunch 决定是否进入
    // 这里只需根据当前进度显示对应步骤
    this.computeInitialStep();
  },

  computeInitialStep() {
    try {
      const settings = appSettingsRepository.getSettings();
      let step = 1;
      if (!settings.hasAcceptedTerms) step = 1;
      else if (!settings.hasAcceptedDisclaimer) step = 2;
      else step = 3;
      this.setData({ step });
    } catch (e) {
      console.error('[welcome] computeInitialStep error:', e);
    }
  },

  onNext() {
    if (this.data.step < this.data.totalSteps) {
      this.setData({ step: this.data.step + 1 });
    } else {
      this.onFinish();
    }
  },

  onPrev() {
    if (this.data.step > 1) {
      this.setData({ step: this.data.step - 1 });
    }
  },

  onToggleTerms(e) {
    this.setData({ acceptedTerms: !!e.detail.value });
  },

  onToggleDisclaimer(e) {
    this.setData({ acceptedDisclaimer: !!e.detail.value });
  },

  onFinish() {
    if (!this.data.acceptedTerms) {
      wx.showToast({ title: '请先勾选"我已阅读并同意"', icon: 'none' });
      this.setData({ step: 2 });
      return;
    }
    if (!this.data.acceptedDisclaimer) {
      wx.showToast({ title: '请先勾选"我已知晓并接受"', icon: 'none' });
      this.setData({ step: 3 });
      return;
    }
    try {
      const settings = appSettingsRepository.getSettings();
      settings.hasAcceptedTerms = true;
      settings.hasAcceptedDisclaimer = true;
      settings.hasCompletedOnboarding = true;
      appSettingsRepository.saveSettings(settings);
    } catch (e) {
      console.error('[welcome] saveSettings error:', e);
    }
    // 修复 PT-mp-welcome-002：home 是 tabBar 页，必须用 switchTab
    wx.switchTab({ url: '/pages/home/home' });
  },

  /**
   * 让 home 在 onShow 重新展示 FAB 气泡（如果用户主动在设置中清除了"已看过气泡"）
   */
  onShow() {
    // 不在这里做任何事，避免重复跳转
  }
});
