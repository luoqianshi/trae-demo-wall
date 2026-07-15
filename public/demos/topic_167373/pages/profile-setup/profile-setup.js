const { userProfileRepository, appSettingsRepository } = require('../../data/repositories/index.js');
const UserProfile = require('../../data/models/user-profile.js');

const app = getApp();

Page({
  data: {
    gender: 'secret',
    ageRange: '26-35',
    concernLevel: 'none',
    genders: [
      { value: 'male', label: '男' },
      { value: 'female', label: '女' },
      { value: 'secret', label: '不愿透露' }
    ],
    ageRanges: [
      { value: '18-25', label: '18-25' },
      { value: '26-35', label: '26-35' },
      { value: '36-45', label: '36-45' },
      { value: '46-55', label: '46-55' },
      { value: '55+', label: '55+' }
    ],
    concernLevels: [
      { value: 'none', label: '无' },
      { value: 'mild', label: '轻度' },
      { value: 'moderate', label: '中度' },
      { value: 'severe', label: '重度' }
    ]
  },

  onLoad() {
    // 加载已有档案
    const profile = userProfileRepository.getProfile();
    if (profile) {
      this.setData({
        gender: profile.gender,
        ageRange: profile.ageRange,
        concernLevel: profile.concernLevel
      });
    }
  },

  onGenderSelect(e) {
    this.setData({ gender: e.currentTarget.dataset.value });
  },

  onAgeSelect(e) {
    this.setData({ ageRange: e.currentTarget.dataset.value });
  },

  onConcernSelect(e) {
    this.setData({ concernLevel: e.currentTarget.dataset.value });
  },

  async onComplete() {
    const profile = new UserProfile({
      gender: this.data.gender,
      ageRange: this.data.ageRange,
      concernLevel: this.data.concernLevel
    });
    userProfileRepository.saveProfile(profile);
    await appSettingsRepository.setOnboardingCompleted();

    wx.showToast({ title: '设置完成', icon: 'success' });
    setTimeout(() => {
      wx.switchTab({ url: '/pages/home/home' });
    }, 800);
  }
});
