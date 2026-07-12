// miniprogram/pages/publish/publish.js
const { call } = require("../../utils/request.js");
const config = require("../../config.js");
const { cityToCoord, CITY_COORDS } = require("../../utils/cityCoords.js");

Page({
  data: {
    form: {
      name: "",
      species: "dog",
      breed: "",
      breedIndex: -1,
      ageMonth: "",
      weight: "",
      gender: "male",
      sterilized: false,
      vaccinated: false,
      images: [],
      healthNote: "",
      city: "", // 留空，由 onLoad 自动填入（可能是"北京市朝阳区"）
      cityIndex: -1,
      addressText: "",
      description: "",
      tagsText: "亲人",
      phone: "", // 联系电话
      // 精确坐标（有就用，没有就用城市中心推断）
      lat: 0,
      lng: 0,
    },
    locationStatus: "", // loading | ok | denied
    speciesList: [
      { key: "dog", label: "狗狗", icon: "/stylepic/狗狗.png" },
      { key: "cat", label: "猫猫", icon: "/stylepic/猫猫.png" },
      { key: "other", label: "其他", icon: "/stylepic/猫猫.png" },
    ],
    // 常见品种列表
    breedList: {
      dog: [
        "中华田园犬",
        "金毛",
        "拉布拉多",
        "哈士奇",
        "边牧",
        "柯基",
        "柴犬",
        "泰迪",
        "比熊",
        "博美",
        "萨摩",
        "阿拉斯加",
        "雪纳瑞",
        "约克夏",
        "古牧",
        "可卡",
        "巴哥",
        "法斗",
        "英斗",
        "吉娃娃",
        "腊肠",
        "杜宾",
        "德牧",
        "边牧",
        "苏牧",
        "拉布拉多",
        "中华田园犬",
      ],
      cat: [
        "中华田园猫",
        "英短",
        "美短",
        "加菲",
        "布偶",
        "暹罗",
        "波斯",
        "橘猫",
        "蓝猫",
        "奶牛",
        "三花",
        "狸花",
        "折耳",
        "斯芬克斯",
        "缅因",
        "金吉拉",
      ],
      other: ["兔子", "仓鼠", "龙猫", "豚鼠", "荷兰猪", "乌龟", "鹦鹉", "其他"],
    },
    // 城市列表
    cityList: [
      "北京市",
      "上海市",
      "天津市",
      "重庆市",
      "南京市",
      "苏州市",
      "无锡市",
      "常州市",
      "镇江市",
      "扬州市",
      "南通市",
      "徐州市",
      "连云港市",
      "盐城市",
      "淮安市",
      "泰州市",
      "宿迁市",
      "杭州市",
      "宁波市",
      "温州市",
      "绍兴市",
      "嘉兴市",
      "湖州市",
      "金华市",
      "台州市",
      "合肥市",
      "马鞍山市",
      "芜湖市",
      "蚌埠市",
      "滁州市",
      "安庆市",
      "广州市",
      "深圳市",
      "东莞市",
      "佛山市",
      "珠海市",
      "中山市",
      "惠州市",
      "成都市",
      "武汉市",
      "西安市",
      "郑州市",
      "长沙市",
      "南昌市",
      "济南市",
      "青岛市",
      "厦门市",
      "福州市",
      "沈阳市",
      "大连市",
      "哈尔滨市",
      "长春市",
      "石家庄市",
      "太原市",
      "昆明市",
      "贵阳市",
      "南宁市",
      "海口市",
      "兰州市",
      "乌鲁木齐市",
    ],
  },

  // 根据物种返回品种数组（给 picker 使用）
  getBreedOptions() {
    return this.data.breedList[this.data.form.species] || [];
  },

  // 页面加载时自动定位
  onLoad() {
    this.autoLocate();
  },

  // 自动定位：获取用户坐标 → 逆地理编码 → 匹配 cityList 中的城市
  autoLocate() {
    const self = this;
    this.setData({ locationStatus: "loading" });

    // 先用 wx.getSetting 检查是否有授权
    wx.getSetting({
      success(setting) {
        const authStatus = setting.authSetting["scope.userLocation"];
        if (authStatus === false) {
          // 之前拒绝过 → 引导去设置
          wx.showModal({
            title: "需要定位权限",
            content: "允许定位，自动填入当前城市",
            confirmText: "去设置",
            success(res) {
              if (res.confirm) {
                wx.openSetting({
                  success(openRes) {
                    if (openRes.authSetting["scope.userLocation"]) {
                      self._doLocate();
                    } else {
                      self._useDefault();
                    }
                  },
                  fail() {
                    self._useDefault();
                  },
                });
              } else {
                self._useDefault();
              }
            },
          });
        } else {
          // 未授权过或已经授权 → 直接定位
          self._doLocate();
        }
      },
      fail() {
        self._useDefault();
      },
    });
  },

  // 真实定位
  _doLocate() {
    const self = this;
    wx.getLocation({
      type: config.location.type,
      isHighAccuracy: config.location.highAccuracy,
      highAccuracyExpireTime: config.location.highAccuracyExpireTime,
      success(res) {
        console.log(
          "[发布页定位] 坐标:",
          res.latitude,
          res.longitude,
          "精度:",
          res.accuracy,
        );
        // 保存精确坐标到 data（发布时一并传给后端，用于列表页距离计算更精准）
        self.setData({
          "form.lat": res.latitude,
          "form.lng": res.longitude,
        });
        // 有腾讯地图 key → 调用逆地理编码
        if (
          config.mapKey &&
          config.mapKey.indexOf("your") === -1 &&
          config.mapKey.length > 10
        ) {
          self._reverseGeocode(res.latitude, res.longitude);
        } else {
          // 没有 key → 用城市锚点找最近的城市
          self._findNearestCity(res.latitude, res.longitude);
        }
      },
      fail(err) {
        console.log("[发布页定位] 失败:", err && err.errMsg);
        self._useDefault();
      },
    });
  },

  // 腾讯地图逆地理编码
  _reverseGeocode(lat, lng) {
    const self = this;
    wx.request({
      url: config.reverseGeocodeUrl,
      data: {
        location: lat + "," + lng,
        key: config.mapKey,
        get_poi: 0,
      },
      success(res) {
        if (
          res.data &&
          res.data.status === 0 &&
          res.data.result &&
          res.data.result.address_component
        ) {
          const ac = res.data.result.address_component;
          // address_component.city 一般已经包含"市"，district 是区
          const cityName = ac.city || ac.province || "";
          const district = ac.district || "";
          // 组合成"北京市朝阳区"（有区就拼区，没有就只显示城市）
          let displayCity = cityName;
          if (district && district !== cityName) {
            displayCity = cityName + district;
          }
          console.log(
            "[发布页定位] 逆地理编码城市:",
            cityName,
            "区:",
            district,
            "显示:",
            displayCity,
          );
          // _setCityByName 传入显示用的 displayCity + 匹配用的 cityName
          self._setCityByNames(displayCity, cityName);
        } else {
          self._findNearestCity(lat, lng);
        }
      },
      fail() {
        self._findNearestCity(lat, lng);
      },
    });
  },

  // fallback：根据坐标找最近的城市（不依赖 API）
  _findNearestCity(lat, lng) {
    let minDist = Infinity;
    let nearest = "北京市";
    for (const cname in CITY_COORDS) {
      const c = CITY_COORDS[cname];
      const dLat = (c.lat - lat) * 111;
      const dLng = (c.lng - lng) * 85;
      const d = Math.sqrt(dLat * dLat + dLng * dLng);
      if (d < minDist) {
        minDist = d;
        nearest = cname;
      }
    }
    console.log(
      "[发布页定位] 最近城市:",
      nearest,
      "距离约",
      Math.round(minDist),
      "km",
    );
    this._setCityByName(nearest);
  },

  // 把城市名匹配到 cityList 中的索引并更新 UI
  // displayCity: 显示给用户看的，如"北京市朝阳区"；matchCity: 用来在 cityList 中找对应索引的，如"北京市"
  // 如果只传一个参数，就用它同时做显示和匹配
  _setCityByName(displayCity, matchCity) {
    const mCity = matchCity || displayCity;
    if (!mCity) return this._useDefault();
    // 精确匹配（cityList 中是"北京市"这样的名字）
    let idx = this.data.cityList.indexOf(mCity);
    if (idx === -1) {
      // 归一化匹配：去掉"市/区/省"后再比
      const normName = mCity.replace(/[市区省]/g, "").trim();
      for (let i = 0; i < this.data.cityList.length; i++) {
        const c = this.data.cityList[i];
        if (
          c.replace(/[市区省]/g, "").trim() === normName ||
          c.indexOf(normName) > -1
        ) {
          idx = i;
          break;
        }
      }
    }
    // 显示用 displayCity（可能是"北京市朝阳区"）
    const showCity =
      displayCity && idx !== -1
        ? displayCity
        : idx !== -1
          ? this.data.cityList[idx]
          : "北京市";
    if (idx === -1) {
      this.setData({
        "form.city": showCity,
        "form.cityIndex": this.data.cityList.indexOf("北京市"),
        locationStatus: "ok",
      });
    } else {
      this.setData({
        "form.city": showCity,
        "form.cityIndex": idx,
        locationStatus: "ok",
      });
    }
  },

  // 无法定位时的默认城市
  _useDefault() {
    const idx = this.data.cityList.indexOf("北京市");
    this.setData({
      "form.city": "北京市",
      "form.cityIndex": idx,
      locationStatus: "denied",
    });
  },

  onPickBreed(e) {
    const idx = Number(e.detail.value);
    const options = this.getBreedOptions();
    this.setData({
      "form.breedIndex": idx,
      "form.breed": options[idx] || "",
    });
  },

  onPickCity(e) {
    const idx = Number(e.detail.value);
    this.setData({
      "form.cityIndex": idx,
      "form.city": this.data.cityList[idx] || "",
    });
  },

  onInput(e) {
    const field = e.currentTarget.dataset.field;
    const value = e.detail.value;
    this.setData({ ["form." + field]: value });
  },

  chooseSpecies(e) {
    this.setData({
      "form.species": e.currentTarget.dataset.key,
      "form.breed": "",
      "form.breedIndex": -1,
    });
  },
  chooseGender(e) {
    this.setData({ "form.gender": e.currentTarget.dataset.key });
  },
  toggleBool(e) {
    const field = e.currentTarget.dataset.field;
    this.setData({ ["form." + field]: !this.data.form[field] });
  },

  chooseImage() {
    const remain = 9 - this.data.form.images.length;
    if (remain <= 0) return;
    wx.chooseMedia({
      count: remain,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: (res) => {
        const newUrls = (res.tempFiles || []).map((f) => f.tempFilePath);
        // 这里模拟上传：直接用临时路径，正式环境应 wx.cloud.uploadFile
        const merged = this.data.form.images.concat(newUrls);
        this.setData({ "form.images": merged });
      },
      fail: () => {
        // 模拟器不支持 chooseMedia 时，用 chooseImage 兜底
        wx.chooseImage({
          count: remain,
          success: (res2) => {
            const merged = this.data.form.images.concat(
              res2.tempFilePaths || [],
            );
            this.setData({ "form.images": merged });
          },
        });
      },
    });
  },

  removeImage(e) {
    const idx = e.currentTarget.dataset.index;
    const images = this.data.form.images.slice();
    images.splice(idx, 1);
    this.setData({ "form.images": images });
  },

  submit() {
    const f = this.data.form;
    if (!f.name) return wx.showToast({ title: "请输入名字", icon: "none" });
    if (!f.images || f.images.length === 0)
      return wx.showToast({ title: "至少上传 1 张照片", icon: "none" });
    if (!f.city) return wx.showToast({ title: "请填写城市", icon: "none" });

    const payload = {
      name: f.name,
      species: f.species,
      breed: f.breed,
      ageMonth: Number(f.ageMonth) || 0,
      weight: Number(f.weight) || 0,
      gender: f.gender,
      sterilized: !!f.sterilized,
      vaccinated: !!f.vaccinated,
      images: f.images,
      healthNote: f.healthNote,
      city: f.city, // 可能是"北京市朝阳区"这种格式
      addressText: f.addressText,
      description: f.description,
      tags: (f.tagsText || "").split(/\s+/).filter((x) => x),
      phone: f.phone, // 联系电话
      lat: f.lat, // 精确坐标（没有就为0，后端会自动推断）
      lng: f.lng,
    };

    wx.showLoading({ title: "发布中" });
    call("animalPublish", payload)
      .then((data) => {
        wx.hideLoading();
        wx.showToast({ title: "发布成功", icon: "success" });
        setTimeout(() => {
          wx.redirectTo({ url: "/pages/detail/detail?id=" + data.animalId });
        }, 800);
      })
      .catch(() => wx.hideLoading());
  },
});
