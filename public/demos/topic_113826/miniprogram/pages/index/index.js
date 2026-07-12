// miniprogram/pages/index/index.js
const { call } = require('../../utils/request.js');
const config = require('../../config.js');

Page({
  data: {
    keyword: '',
    speciesTabs: [
      { key: '', label: '全部', icon: '/stylepic/爪子.png', active: true },
      { key: 'dog', label: '狗狗', icon: '/stylepic/狗狗.png', active: false },
      { key: 'cat', label: '猫猫', icon: '/stylepic/猫猫.png', active: false },
      { key: 'other', label: '其他', icon: '/stylepic/爪子.png', active: false }
    ],
    tagTabs: [
      { key: '', label: '不限', icon: '/stylepic/爱心.png', active: true },
      { key: '已绝育', label: '已绝育', icon: '/stylepic/保护.png', active: false },
      { key: '已疫苗', label: '已疫苗', icon: '/stylepic/奶瓶.png', active: false },
      { key: '亲人', label: '亲人', icon: '/stylepic/[笑脸].png', active: false }
    ],
    list: [],
    total: 0,
    currentSpecies: '',
    currentTag: '',
    // 定位相关
    locationText: '',        // 显示在页面上的位置文字（如：南京市）
    locationStatus: '',     // '', 'loading', 'ok', 'denied'
    locationAccuracy: '',    // 精度文字（已简化为市级）
    locationCorrected: false,   // 始终以城市中心筛选
    userLat: 0,             // 用户真实坐标（纬度）
    userLng: 0,             // 用户真实坐标（经度）
    filterLat: 0,             // 列表筛选用的坐标（GPS 或 城市中心）
    filterLng: 0,             // 列表筛选用的坐标
    userCity: '',            // 用户所在城市关键字（如：南京）

    // 城市选择浮层
    showCityPicker: false,
    citySearchText: '',
    // 按省份分组的城市列表（城市列表仅需在一个地方维护）
    cityGroups: [
      {
        province: '热门',
        cities: [
          { name: '北京市', lat: 39.904, lng: 116.407 },
          { name: '上海市', lat: 31.230, lng: 121.474 },
          { name: '广州市', lat: 23.129, lng: 113.264 },
          { name: '深圳市', lat: 22.543, lng: 114.058 },
          { name: '南京市', lat: 32.060, lng: 118.796 },
          { name: '苏州市', lat: 31.299, lng: 120.585 },
          { name: '杭州市', lat: 30.274, lng: 120.155 },
          { name: '成都市', lat: 30.572, lng: 104.066 },
          { name: '武汉市', lat: 30.592, lng: 114.305 },
          { name: '西安市', lat: 34.341, lng: 108.939 }
        ]
      },
      {
        province: '江苏省',
        cities: [
          { name: '南京市', lat: 32.060, lng: 118.796 },
          { name: '苏州市', lat: 31.299, lng: 120.585 },
          { name: '无锡市', lat: 31.491, lng: 120.312 },
          { name: '常州市', lat: 31.797, lng: 119.946 },
          { name: '镇江市', lat: 32.203, lng: 119.446 },
          { name: '扬州市', lat: 32.394, lng: 119.427 },
          { name: '南通市', lat: 32.015, lng: 120.865 },
          { name: '徐州市', lat: 34.204, lng: 117.286 },
          { name: '连云港市', lat: 34.596, lng: 119.222 },
          { name: '盐城市', lat: 33.377, lng: 120.139 },
          { name: '淮安市', lat: 33.510, lng: 119.021 },
          { name: '泰州市', lat: 32.455, lng: 119.922 },
          { name: '宿迁市', lat: 33.963, lng: 118.275 }
        ]
      },
      {
        province: '浙江省',
        cities: [
          { name: '杭州市', lat: 30.274, lng: 120.155 },
          { name: '宁波市', lat: 29.868, lng: 121.544 },
          { name: '温州市', lat: 28.000, lng: 120.672 },
          { name: '绍兴市', lat: 30.030, lng: 120.580 },
          { name: '嘉兴市', lat: 30.746, lng: 120.755 },
          { name: '湖州市', lat: 30.892, lng: 120.088 },
          { name: '金华市', lat: 29.078, lng: 119.647 },
          { name: '台州市', lat: 28.656, lng: 121.421 }
        ]
      },
      {
        province: '安徽省',
        cities: [
          { name: '合肥市', lat: 31.820, lng: 117.227 },
          { name: '马鞍山市', lat: 31.670, lng: 118.506 },
          { name: '芜湖市', lat: 31.353, lng: 118.434 },
          { name: '蚌埠市', lat: 32.939, lng: 117.363 },
          { name: '滁州市', lat: 32.287, lng: 118.316 },
          { name: '安庆市', lat: 30.509, lng: 117.045 }
        ]
      },
      {
        province: '广东省',
        cities: [
          { name: '广州市', lat: 23.129, lng: 113.264 },
          { name: '深圳市', lat: 22.543, lng: 114.058 },
          { name: '东莞市', lat: 23.048, lng: 113.745 },
          { name: '佛山市', lat: 23.021, lng: 113.122 },
          { name: '珠海市', lat: 22.270, lng: 113.577 },
          { name: '中山市', lat: 22.516, lng: 113.392 },
          { name: '惠州市', lat: 23.111, lng: 114.416 }
        ]
      },
      {
        province: '上海市/北京市/天津市/重庆市',
        cities: [
          { name: '北京市', lat: 39.904, lng: 116.407 },
          { name: '上海市', lat: 31.230, lng: 121.474 },
          { name: '天津市', lat: 39.343, lng: 117.362 },
          { name: '重庆市', lat: 29.431, lng: 106.912 }
        ]
      },
      {
        province: '其他主要城市',
        cities: [
          { name: '成都市', lat: 30.572, lng: 104.066 },
          { name: '武汉市', lat: 30.592, lng: 114.305 },
          { name: '西安市', lat: 34.341, lng: 108.939 },
          { name: '郑州市', lat: 34.746, lng: 113.625 },
          { name: '长沙市', lat: 28.228, lng: 112.938 },
          { name: '南昌市', lat: 28.682, lng: 115.858 },
          { name: '济南市', lat: 36.651, lng: 117.120 },
          { name: '青岛市', lat: 36.067, lng: 120.382 },
          { name: '厦门市', lat: 24.479, lng: 118.089 },
          { name: '福州市', lat: 26.074, lng: 119.296 },
          { name: '沈阳市', lat: 41.805, lng: 123.432 },
          { name: '大连市', lat: 38.914, lng: 121.618 },
          { name: '哈尔滨市', lat: 45.803, lng: 126.535 },
          { name: '长春市', lat: 43.817, lng: 125.324 },
          { name: '石家庄市', lat: 38.042, lng: 114.514 },
          { name: '太原市', lat: 37.870, lng: 112.548 },
          { name: '昆明市', lat: 25.038, lng: 102.718 },
          { name: '贵阳市', lat: 26.647, lng: 106.630 },
          { name: '南宁市', lat: 22.817, lng: 108.366 },
          { name: '海口市', lat: 20.044, lng: 110.192 },
          { name: '兰州市', lat: 36.061, lng: 103.834 },
          { name: '乌鲁木齐市', lat: 43.825, lng: 87.616 }
        ]
      }
    ],
    filteredCityGroups: []   // 搜索过滤后的分组
  },

  onLoad() {
    // 先加载默认列表
    this.loadList();
    // 同时发起定位
    this.getLocation();
  },

  onPullDownRefresh() {
    this.loadList().then(() => wx.stopPullDownRefresh());
  },

  onShow() {
    if (this.data.list.length > 0) this.loadList();
  },

  // ==========================================================================
  // 定位：打开小程序时主动申请授权；被拒绝时引导用户去设置页开启
  // 流程：
  //   onLoad → getLocation()
  //     ├─ wx.getSetting 检查权限
  //     │    ├─ 已有权限 → 连续采样 3 次，选精度最好的一次
  //     │    ├─ 从未授权 → 直接 wx.getLocation（微信会自动弹授权弹窗）
  //     │    └─ 之前拒绝过 → 弹 Modal 引导用户去设置页开启
  //     └─ 拿到坐标 → reverseGeocode 转成文字地址 + 校验 GPS 偏差
  // ==========================================================================
  getLocation() {
    const self = this;
    this.setData({
      locationStatus: 'loading',
      locationText: '正在获取位置…'
    });

    wx.getSetting({
      success: (setting) => {
        const authStatus = setting.authSetting['scope.userLocation'];

        if (authStatus === false) {
          wx.showModal({
            title: '需要定位权限',
            content: '开启定位权限，为您显示附近的待领养动物',
            confirmText: '去设置',
            confirmColor: '#FFB366',
            cancelText: '暂不开启',
            success: (modalRes) => {
              if (modalRes.confirm) {
                wx.openSetting({
                  success: (res) => {
                    if (res.authSetting['scope.userLocation']) {
                      self._doSampling();
                    } else {
                      self._showDenied();
                    }
                  },
                  fail: () => self._showDenied()
                });
              } else {
                self._showDenied();
              }
            }
          });
        } else {
          self._doSampling();
        }
      },
      fail: () => {
        self._doSampling();
      }
    });
  },

  _showDenied() {
    this.setData({
      locationStatus: 'denied',
      locationText: '未开启定位权限',
      locationHint: '点击切换城市'
    });
    this._useDefaultLocation();
  },

  _useDefaultLocation() {
    const fallback = this.coordToCity(32.060, 118.796);
    this.setData({
      filterLat: fallback.lat,
      filterLng: fallback.lng,
      userCity: fallback.city
    });
    this.loadList();
  },

  _doSampling() {
    const self = this;
    const samples = [];
    const MAX_SAMPLES = 3;
    const ACCEPTABLE_ACCURACY = 100;
    let finished = false;
    let firstAttempt = true;

    function pickBest() {
      if (samples.length === 0) {
        self.setData({
          locationStatus: 'error',
          locationText: '定位失败',
          locationHint: '点击切换城市'
        });
        self._useDefaultLocation();
        return;
      }
      let best = samples[0];
      for (let i = 1; i < samples.length; i++) {
        if (samples[i].accuracy < best.accuracy) best = samples[i];
      }
      console.log('[定位] 共采样 ' + samples.length + ' 次，选最佳：lat=' + best.latitude.toFixed(4) + ' lng=' + best.longitude.toFixed(4) + ' 精度=' + best.accuracy + 'm');

      self.setData({
        userLat: best.latitude,
        userLng: best.longitude,
        filterLat: best.latitude,
        filterLng: best.longitude,
        locationAccuracy: '精度 ' + Math.round(best.accuracy) + ' 米',
        locationCorrected: false
      });
      self.reverseGeocode(best.latitude, best.longitude);
    }

    function doSample(nth) {
      if (finished) return;
      if (nth > MAX_SAMPLES) {
        finished = true;
        pickBest();
        return;
      }
      wx.getLocation({
        type: config.location.type,
        isHighAccuracy: config.location.highAccuracy,
        highAccuracyExpireTime: config.location.highAccuracyExpireTime,
        timeout: 10000,
        success: (res) => {
          if (finished) return;
          firstAttempt = false;
          const acc = (res.accuracy && res.accuracy > 0) ? res.accuracy : 999;
          samples.push({
            latitude: res.latitude,
            longitude: res.longitude,
            accuracy: acc
          });
          console.log('[定位] 第 ' + nth + ' 次采样: lat=' + res.latitude.toFixed(4) + ' lng=' + res.longitude.toFixed(4) + ' acc=' + acc + 'm');

          if (acc <= ACCEPTABLE_ACCURACY) {
            finished = true;
            pickBest();
            return;
          }
          setTimeout(() => doSample(nth + 1), 1000);
        },
        fail: (err) => {
          if (finished) return;
          console.log('[定位] 第 ' + nth + ' 次采样失败:', err && err.errMsg);
          if (firstAttempt && err && err.errMsg && err.errMsg.indexOf('auth') > -1) {
            finished = true;
            self._showDenied();
            return;
          }
          setTimeout(() => doSample(nth + 1), 500);
        }
      });
    }

    doSample(1);
  },

  // 坐标 → 文字地址（腾讯地图逆地理编码）
  // 始终以识别到的城市中心坐标来筛选列表
  reverseGeocode(lat, lng) {
    const self = this;

    // 从 data.cityGroups 构造 {城市名: {lat, lng}
    const allCities = {};
    for (let i = 0; i < self.data.cityGroups.length; i++) {
      const group = self.data.cityGroups[i];
      for (let j = 0; j < group.cities.length; j++) {
        const c = group.cities[j];
        allCities[c.name] = { lat: c.lat, lng: c.lng };
      }
    }

    wx.request({
      url: config.reverseGeocodeUrl,
      data: {
        key: config.mapKey,
        location: lat + ',' + lng
      },
      success: (res) => {
        let cityKeyword = '';
        if (res.data && res.data.status === 0 && res.data.result) {
          const comp = res.data.result.address_component || {};
          const province = comp.province || '';
          const city = comp.city || '';
          cityKeyword = city || province || '';
          console.log('[定位] 腾讯地图识别城市: ' + cityKeyword);
        }

        // 1. cityKeyword 在列表 → 直接用
        // 2. 不在 → 用 coordToCity 找最近的
        let checkCity = cityKeyword;
        let cityCenter = allCities[cityKeyword];
        if (!cityCenter) {
          const fallback = self.coordToCity(lat, lng);
          checkCity = fallback.city;
          cityCenter = { lat: fallback.lat, lng: fallback.lng };
          console.log('[定位] ' + cityKeyword + ' 不在列表，按最近城市: ' + checkCity);
        }

        // 始终以城市中心坐标筛选（无论 GPS 坐标是否准确）
        const finalLat = cityCenter.lat;
        const finalLng = cityCenter.lng;
        console.log('[定位] 以 ' + checkCity + ' 中心 (' + finalLat + ', ' + finalLng + ') 筛选');

        self.setData({
          locationStatus: 'ok',
          locationText: checkCity,
          locationAccuracy: '',
          locationCorrected: true,
          userCity: checkCity,
          filterLat: finalLat,
          filterLng: finalLng
        });

        self.loadList();
      },
      fail: () => {
        const fallback = self.coordToCity(lat, lng);
        self.setData({
          locationStatus: 'ok',
          locationText: fallback.city,
          userCity: fallback.city,
          locationCorrected: true,
          filterLat: fallback.lat,
          filterLng: fallback.lng
        });
        self.loadList();
      }
    });
  },

  // 本地城市锚点兜底（腾讯地图接口失败/城市未知时用）
  coordToCity(lat, lng) {
    const anchors = [
      { city: '北京市', lat: 39.904, lng: 116.407 },
      { city: '上海市', lat: 31.230, lng: 121.474 },
      { city: '南京市', lat: 32.060, lng: 118.796 },
      { city: '苏州市', lat: 31.299, lng: 120.585 },
      { city: '无锡市', lat: 31.491, lng: 120.312 },
      { city: '常州市', lat: 31.797, lng: 119.946 },
      { city: '镇江市', lat: 32.203, lng: 119.446 },
      { city: '扬州市', lat: 32.394, lng: 119.427 },
      { city: '南通市', lat: 32.015, lng: 120.865 },
      { city: '杭州市', lat: 30.274, lng: 120.155 },
      { city: '合肥市', lat: 31.820, lng: 117.227 },
      { city: '马鞍山市', lat: 31.670, lng: 118.506 },
      { city: '芜湖市', lat: 31.353, lng: 118.434 },
      { city: '广州市', lat: 23.129, lng: 113.264 },
      { city: '深圳市', lat: 22.543, lng: 114.058 },
      { city: '成都市', lat: 30.572, lng: 104.066 },
      { city: '武汉市', lat: 30.592, lng: 114.305 },
      { city: '徐州市', lat: 34.204, lng: 117.286 },
      { city: '宁波市', lat: 29.868, lng: 121.544 },
      { city: '郑州市', lat: 34.746, lng: 113.625 },
      { city: '长沙市', lat: 28.228, lng: 112.938 },
      { city: '西安市', lat: 34.341, lng: 108.939 },
      { city: '天津市', lat: 39.343, lng: 117.362 },
      { city: '重庆市', lat: 29.431, lng: 106.912 }
    ];
    let best = anchors[0], bestDist = Infinity;
    for (let i = 0; i < anchors.length; i++) {
      const a = anchors[i];
      const dLat = (a.lat - lat) * 111;
      const dLng = (a.lng - lng) * 85;
      const d = dLat * dLat + dLng * dLng;
      if (d < bestDist) { bestDist = d; best = a; }
    }
    return { city: best.city, lat: best.lat, lng: best.lng };
  },

  // 点击位置栏：打开城市选择浮层
  tapLocation() {
    // 打开前先重置搜索框
    this.setData({
      showCityPicker: true,
      citySearchText: '',
      filteredCityGroups: this.data.cityGroups
    });
  },

  // 关闭城市选择浮层
  closeCityPicker() {
    this.setData({ showCityPicker: false });
  },

  // 城市搜索：实时过滤分组
  onCitySearch(e) {
    const keyword = (e.detail.value || '').trim();
    if (!keyword) {
      this.setData({
        citySearchText: '',
        filteredCityGroups: this.data.cityGroups
      });
      return;
    }
    // 过滤：城市名包含关键字即可
    const filtered = this.data.cityGroups
      .map(group => ({
        province: group.province,
        cities: group.cities.filter(c => c.name.indexOf(keyword) !== -1)
      }))
      .filter(group => group.cities.length > 0);
    this.setData({
      citySearchText: keyword,
      filteredCityGroups: filtered
    });
  },

  // 选择城市后：更新筛选坐标并刷新列表
  onSelectCity(e) {
    const cityName = e.currentTarget.dataset.name;
    const lat = Number(e.currentTarget.dataset.lat);
    const lng = Number(e.currentTarget.dataset.lng);
    this.setData({
      locationStatus: 'ok',
      locationText: cityName,
      locationAccuracy: '',
      locationCorrected: true,
      userCity: cityName,
      filterLat: lat,
      filterLng: lng,
      showCityPicker: false
    });
    console.log('[列表] 用户切换到 ' + cityName + ' (' + lat + ', ' + lng + ')');
    this.loadList();
  },

  // 在浮层里"重新获取定位"
  onRelocate() {
    this.setData({ showCityPicker: false });
    this.getLocation();
  },

  // ==== 列表加载：携带用户坐标给 animalList，按距离筛选
  // 注意：用 filterLat/filterLng（经过 GPS 偏差校正后的坐标）
  loadList() {
    wx.showLoading({ title: '加载中' });
    const payload = {
      keyword: this.data.keyword,
      species: this.data.currentSpecies,
      tag: this.data.currentTag,
      userLat: this.data.filterLat || 0,
      userLng: this.data.filterLng || 0,
      userCity: this.data.userCity || ''
    };
    console.log('[列表] 调用 animalList，筛选坐标: (' + payload.userLat + ', ' + payload.userLng + ')');
    return call('animalList', payload).then((data) => {
      this.setData({ list: data.list, total: data.total });
      wx.hideLoading();
    }).catch(() => wx.hideLoading());
  },

  onKeywordInput(e) {
    this.setData({ keyword: e.detail.value });
  },

  onConfirmSearch() {
    this.loadList();
  },

  focusSearch() {},

  onSpeciesTab(e) {
    const key = e.currentTarget.dataset.key;
    const speciesTabs = this.data.speciesTabs.map(t => ({ ...t, active: t.key === key }));
    this.setData({ speciesTabs, currentSpecies: key });
    this.loadList();
  },

  onTagTab(e) {
    const key = e.currentTarget.dataset.key;
    const tagTabs = this.data.tagTabs.map(t => ({ ...t, active: t.key === key }));
    this.setData({ tagTabs, currentTag: key });
    this.loadList();
  },

  goDetail(e) {
    const id = e.currentTarget.dataset.id;
    wx.navigateTo({ url: '/pages/detail/detail?id=' + id });
  },

  toggleFavorite(e) {
    e.stopPropagation();
    const id = e.currentTarget.dataset.id;
    const list = this.data.list.map(item => {
      if (item._id === id) {
        return { ...item, favorited: !item.favorited };
      }
      return item;
    });
    this.setData({ list });
  }
});
