const app = getApp();
const regions = require('../../data/regions');

Page({
  data: {
    avatarUrl: '',
    nickName: '',
    realName: '',
    grades: app.grades || [],
    gradeIndex: -1,
    // 省市区三级数据
    provinceNames: [],
    cityNames: [],
    districtNames: [],
    provinceIndex: -1,
    cityIndex: -1,
    districtIndex: -1,
    // 选中结果
    selectedProvince: null,
    selectedCity: null,
    selectedDistrict: '',
    canLogin: false
  },

  onLoad() {
    // 提取省份名称列表
    const provinceNames = regions.map(p => p.name);
    this.setData({ provinceNames });

    // 检查是否已登录，已登录直接跳首页
    const userInfo = wx.getStorageSync('userInfo');
    if (userInfo) {
      app.globalData.userInfo = userInfo;
      app.globalData.isLoggedIn = true;
      wx.switchTab({ url: '/pages/index/index' });
    }
  },

  // 选择微信头像
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail;
    this.setData({ avatarUrl }, this.checkCanLogin);
  },

  // 输入昵称
  onNicknameInput(e) {
    this.setData({ nickName: e.detail.value }, this.checkCanLogin);
  },

  // 选择省份
  onProvinceChange(e) {
    const provinceIndex = e.detail.value;
    const selectedProvince = regions[provinceIndex];
    const cityNames = selectedProvince.cities.map(c => c.name);
    this.setData({
      provinceIndex,
      selectedProvince,
      cityNames,
      cityIndex: -1,
      districtNames: [],
      districtIndex: -1,
      selectedCity: null,
      selectedDistrict: ''
    }, this.checkCanLogin);
  },

  // 选择城市
  onCityChange(e) {
    const cityIndex = e.detail.value;
    const selectedCity = this.data.selectedProvince.cities[cityIndex];
    const districtNames = selectedCity.districts;
    this.setData({
      cityIndex,
      selectedCity,
      districtNames,
      districtIndex: -1,
      selectedDistrict: ''
    }, this.checkCanLogin);
  },

  // 选择区/县
  onDistrictChange(e) {
    const districtIndex = e.detail.value;
    const selectedDistrict = this.data.districtNames[districtIndex];
    this.setData({ districtIndex, selectedDistrict }, this.checkCanLogin);
  },

  // 选择年级
  onGradeChange(e) {
    this.setData({ gradeIndex: e.detail.value }, this.checkCanLogin);
  },

  // 输入真实姓名
  onRealNameInput(e) {
    this.setData({ realName: e.detail.value }, this.checkCanLogin);
  },

  // 检查能否登录
  checkCanLogin() {
    const { avatarUrl, nickName, realName, provinceIndex, cityIndex, districtIndex, gradeIndex } = this.data;
    const canLogin = !!(avatarUrl && nickName && realName &&
      provinceIndex !== -1 && cityIndex !== -1 && districtIndex !== -1 && gradeIndex !== -1);
    this.setData({ canLogin });
  },

  // 登录
  onLogin() {
    const { avatarUrl, nickName, realName, gradeIndex, grades,
      selectedProvince, selectedCity, selectedDistrict } = this.data;

    // 组合地区显示名
    const regionName = `${selectedProvince.name} ${selectedCity.name} ${selectedDistrict}`;

    const userInfo = {
      avatarUrl,
      nickName,
      realName,
      province: selectedProvince.name,
      city: selectedCity.name,
      district: selectedDistrict,
      regionName,
      grade: grades[gradeIndex],
      gradeIndex,
      loginTime: Date.now()
    };

    // 保存到本地存储
    wx.setStorageSync('userInfo', userInfo);

    // 设置全局变量
    app.globalData.userInfo = userInfo;
    app.globalData.isLoggedIn = true;

    // 跳转首页
    wx.switchTab({ url: '/pages/index/index' });
  },

  // 教师登录（独立入口，不和学生端共用）
  onTeacherLogin() {
    wx.showModal({
      title: '教师登录',
      editable: true,
      placeholderText: '请输入教师密码',
      content: '',
      confirmText: '登录',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          const password = res.content.trim();
          // 预设教师密码
          const TEACHER_PASSWORD = 'admin888';
          if (password === TEACHER_PASSWORD) {
            wx.setStorageSync('teacherLoggedIn', true);
            wx.redirectTo({ url: '/pages/teacher/teacher' });
          } else {
            wx.showToast({
              title: '密码错误',
              icon: 'error',
              duration: 1500
            });
          }
        }
      }
    });
  }
});