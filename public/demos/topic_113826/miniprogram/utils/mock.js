// miniprogram/utils/mock.js
// ==================== 模拟数据层（等价于云函数）====================
// 为了让前端页面在没有真实云开发环境时也能完整演示，
// 这里用纯 JS + 本地存储模拟了全部数据。
// 未来接入微信云开发时，只需把下面每个函数替换为对应的 wx.cloud.callFunction 调用。

const ANIMALS_KEY = "demo_animals";
const APPLICATIONS_KEY = "demo_applications";
const REVIEWS_KEY = "demo_reviews";
const DATA_VERSION_KEY = "demo_data_version";
const DATA_VERSION = "v4.2";
const { cityToCoord } = require("./cityCoords.js");

// --- 初始数据 ---
function getInitialAnimals() {
  return [
    // ---------- 北京 ----------
    {
      _id: "animal_001",
      name: "小黄",
      species: "dog",
      breed: "中华田园犬",
      ageMonth: 12,
      gender: "male",
      weight: 5.2,
      sterilized: true,
      vaccinated: true,
      images: [
        "/pic/dog_yellow_xiaohuang.jpg",
        "/pic/dog_yellow_xiaohuang.jpg",
        "/pic/dog_yellow_xiaohuang.jpg",
      ],
      description:
        "性格温顺亲人，喜欢与人互动。对陌生人也会摇尾巴，是家庭伴侣犬的好选择。",
      tags: ["亲人", "已绝育", "已疫苗"],
      city: "北京",
      addressText: "北京市朝阳区望京",
      lat: 39.995,
      lng: 116.476,
      status: "available",
      publisherOpenId: "mock_publisher_1",
      publisherName: "林小姐",
      publisherPhone: "13800138001",
      healthNote: "驱虫已完成，体内外健康良好",
      viewCount: 128,
      favoriteCount: 12,
      applyCount: 3,
      createTime: "2026-06-01T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-dog.png",
    },
    {
      _id: "animal_002",
      name: "豆沙包",
      species: "dog",
      breed: "柴犬混血",
      ageMonth: 18,
      gender: "male",
      weight: 6.5,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/dog_brown_doubao.jpg", "/pic/dog_brown_doubao.jpg"],
      description: "性格稳定，会基本指令。适合有一定养狗经验的家庭。",
      tags: ["乖巧", "已绝育", "已疫苗"],
      city: "北京",
      addressText: "北京市海淀区中关村",
      lat: 39.983,
      lng: 116.317,
      status: "available",
      publisherOpenId: "mock_publisher_2",
      publisherName: "陈先生",
      publisherPhone: "13800138002",
      healthNote: "健康检查无异常，疫苗全",
      viewCount: 96,
      favoriteCount: 8,
      applyCount: 2,
      createTime: "2026-06-05T12:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-dog.png",
    },
    {
      _id: "animal_003",
      name: "糖糖",
      species: "cat",
      breed: "中华田园猫",
      ageMonth: 8,
      gender: "female",
      weight: 3.2,
      sterilized: false,
      vaccinated: true,
      images: [
        "/pic/cat_orange_tangguo.jpg",
        "/pic/cat_orange_tangguo.jpg",
        "/pic/cat_orange_tangguo.jpg",
      ],
      description: "温柔安静，爱撒娇，适合独居女生或有老人的家庭。",
      tags: ["亲人", "乖巧", "已疫苗"],
      city: "北京",
      addressText: "北京市丰台区西局",
      lat: 39.866,
      lng: 116.319,
      status: "available",
      publisherOpenId: "mock_publisher_3",
      publisherName: "赵女士",
      publisherPhone: "13800138003",
      healthNote: "近期食欲不振，需重点关注",
      viewCount: 214,
      favoriteCount: 24,
      applyCount: 6,
      createTime: "2026-06-08T14:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-cat.png",
    },
    // ---------- 上海 ----------
    {
      _id: "animal_005",
      name: "奶茶",
      species: "cat",
      breed: "英短混血",
      ageMonth: 10,
      gender: "female",
      weight: 3.8,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/cat_blue_yingduan.jpg"],
      description: "性格独立，不太黏人。适合上班族家庭。",
      tags: ["独立", "已绝育", "已疫苗"],
      city: "上海",
      addressText: "上海市浦东新区陆家嘴",
      lat: 31.24,
      lng: 121.505,
      status: "available",
      publisherOpenId: "mock_publisher_2",
      publisherName: "王女士",
      publisherPhone: "13800138004",
      healthNote: "近期精神不振，不愿就医",
      viewCount: 146,
      favoriteCount: 18,
      applyCount: 4,
      createTime: "2026-06-18T10:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-cat.png",
    },
    // ---------- 南京 ----------
    {
      _id: "animal_010",
      name: "团子",
      species: "cat",
      breed: "美短",
      ageMonth: 14,
      gender: "female",
      weight: 4.1,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/cat_meiduan_tuanzi.jpg", "/pic/cat_meiduan_tuanzi.jpg"],
      description: "性格乖巧亲人，不挑食，适合新手家庭。",
      tags: ["亲人", "乖巧", "已绝育"],
      city: "南京",
      addressText: "南京市玄武区新街口",
      lat: 32.045,
      lng: 118.778,
      status: "available",
      publisherOpenId: "mock_publisher_4",
      publisherName: "周小姐",
      publisherPhone: "13800138005",
      healthNote: "健康良好，疫苗齐全",
      viewCount: 147,
      favoriteCount: 20,
      applyCount: 5,
      createTime: "2026-06-10T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-cat.png",
    },
    {
      _id: "animal_011",
      name: "馒头",
      species: "dog",
      breed: "金毛混血",
      ageMonth: 20,
      gender: "male",
      weight: 18.5,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/dog_golden_mantou.jpg", "/pic/dog_golden_mantou.jpg"],
      description: "性格温和，适合有院子的家庭。不拆家，不乱叫。",
      tags: ["亲人", "已疫苗", "已绝育"],
      city: "南京",
      addressText: "南京市鼓楼区湖南路",
      lat: 32.068,
      lng: 118.765,
      status: "available",
      publisherOpenId: "mock_publisher_5",
      publisherName: "钱先生",
      publisherPhone: "13800138006",
      healthNote: "精神好，饮食正常",
      viewCount: 89,
      favoriteCount: 11,
      applyCount: 2,
      createTime: "2026-06-12T10:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-dog.png",
    },
    {
      _id: "animal_012",
      name: "芝麻",
      species: "cat",
      breed: "中华田园猫",
      ageMonth: 6,
      gender: "male",
      weight: 2.8,
      sterilized: false,
      vaccinated: true,
      images: ["/pic/cat_tabby_tangyuan.jpg"],
      description: "活泼好动，爱玩逗猫棒。已驱虫。",
      tags: ["活泼", "已疫苗"],
      city: "南京",
      addressText: "南京市建邺区河西",
      lat: 32.035,
      lng: 118.745,
      status: "available",
      publisherOpenId: "mock_publisher_4",
      publisherName: "孙小姐",
      publisherPhone: "13800138007",
      healthNote: "健康活泼",
      viewCount: 66,
      favoriteCount: 7,
      applyCount: 1,
      createTime: "2026-06-16T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-cat.png",
    },
    // ---------- 苏州 ----------
    {
      _id: "animal_020",
      name: "小笼",
      species: "dog",
      breed: "中华田园犬",
      ageMonth: 15,
      gender: "male",
      weight: 7.0,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/dog_yellow_xiaohuang.jpg"],
      description: "性格温和亲人，适合家庭饲养。",
      tags: ["亲人", "已绝育", "已疫苗"],
      city: "苏州",
      addressText: "苏州市姑苏区平江路",
      lat: 31.319,
      lng: 120.635,
      status: "available",
      publisherOpenId: "mock_publisher_6",
      publisherName: "吴女士",
      publisherPhone: "13800138008",
      healthNote: "健康良好",
      viewCount: 118,
      favoriteCount: 15,
      applyCount: 3,
      createTime: "2026-06-11T10:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-dog.png",
    },
    // ---------- 杭州 ----------
    {
      _id: "animal_030",
      name: "茶茶",
      species: "cat",
      breed: "布偶混血",
      ageMonth: 9,
      gender: "female",
      weight: 3.5,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/cat_blue_yingduan.jpg", "/pic/cat_blue_yingduan.jpg"],
      description: "安静温柔，适合居家生活。",
      tags: ["亲人", "已绝育", "已疫苗"],
      city: "杭州",
      addressText: "杭州市西湖区文三路",
      lat: 30.283,
      lng: 120.126,
      status: "available",
      publisherOpenId: "mock_publisher_7",
      publisherName: "郑先生",
      publisherPhone: "13800138009",
      healthNote: "健康良好",
      viewCount: 132,
      favoriteCount: 22,
      applyCount: 4,
      createTime: "2026-06-14T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-cat.png",
    },
    // ---------- 广州 ----------
    {
      _id: "animal_040",
      name: "阿黄",
      species: "dog",
      breed: "中华田园犬",
      ageMonth: 22,
      gender: "male",
      weight: 9.5,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/dog_yellow_xiaohuang.jpg"],
      description: "性格忠厚老实，适合有院子的家庭。",
      tags: ["亲人", "已绝育", "已疫苗"],
      city: "广州",
      addressText: "广州市天河区体育西路",
      lat: 23.133,
      lng: 113.325,
      status: "available",
      publisherOpenId: "mock_publisher_8",
      publisherName: "冯先生",
      publisherPhone: "13800138010",
      healthNote: "健康良好",
      viewCount: 98,
      favoriteCount: 9,
      applyCount: 2,
      createTime: "2026-06-13T10:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-dog.png",
    },
    // ---------- 深圳 ----------
    {
      _id: "animal_045",
      name: "小七",
      species: "cat",
      breed: "中华田园猫",
      ageMonth: 7,
      gender: "male",
      weight: 3.0,
      sterilized: false,
      vaccinated: true,
      images: ["/pic/cat_tabby_tangyuan.jpg"],
      description: "调皮活泼，爱玩逗猫棒。",
      tags: ["活泼", "已疫苗"],
      city: "深圳",
      addressText: "深圳市南山区科技园",
      lat: 22.54,
      lng: 113.946,
      status: "available",
      publisherOpenId: "mock_publisher_9",
      publisherName: "黄小姐",
      publisherPhone: "13800138011",
      healthNote: "健康活泼",
      viewCount: 77,
      favoriteCount: 8,
      applyCount: 1,
      createTime: "2026-06-17T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-cat.png",
    },
    // ---------- 成都 ----------
    {
      _id: "animal_050",
      name: "汤圆",
      species: "cat",
      breed: "加菲混血",
      ageMonth: 11,
      gender: "female",
      weight: 4.0,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/cat_blue_yingduan.jpg"],
      description: "安静黏人，喜欢被抱。",
      tags: ["亲人", "已绝育", "已疫苗"],
      city: "成都",
      addressText: "成都市武侯区科华北路",
      lat: 30.642,
      lng: 104.088,
      status: "available",
      publisherOpenId: "mock_publisher_10",
      publisherName: "曾先生",
      publisherPhone: "13800138012",
      healthNote: "健康良好",
      viewCount: 145,
      favoriteCount: 19,
      applyCount: 4,
      createTime: "2026-06-15T10:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-cat.png",
    },
    // ---------- 武汉 ----------
    {
      _id: "animal_060",
      name: "热干面",
      species: "dog",
      breed: "中华田园犬",
      ageMonth: 13,
      gender: "male",
      weight: 6.8,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/dog_yellow_xiaohuang.jpg"],
      description: "聪明听话，会基本指令。",
      tags: ["亲人", "已疫苗", "已绝育"],
      city: "武汉",
      addressText: "武汉市武昌区中南路",
      lat: 30.558,
      lng: 114.317,
      status: "available",
      publisherOpenId: "mock_publisher_11",
      publisherName: "胡先生",
      publisherPhone: "13800138013",
      healthNote: "健康良好",
      viewCount: 105,
      favoriteCount: 12,
      applyCount: 3,
      createTime: "2026-06-19T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-dog.png",
    },
    // ---------- 其他已有动物 ----------
    {
      _id: "animal_004",
      name: "小白",
      species: "other",
      breed: "白兔",
      ageMonth: 6,
      gender: "male",
      weight: 1.8,
      sterilized: false,
      vaccinated: false,
      images: ["/pic/dog_white_mantou.jpg"],
      description: "亲人可爱，饲养简单，适合租房和小户型的家庭。",
      tags: ["亲人"],
      city: "北京",
      addressText: "北京市东城区安定门",
      lat: 39.947,
      lng: 116.413,
      status: "available",
      publisherOpenId: "mock_publisher_1",
      publisherName: "李先生",
      publisherPhone: "13800138014",
      healthNote: "基本健康，尚未绝育和疫苗",
      viewCount: 58,
      favoriteCount: 5,
      applyCount: 1,
      createTime: "2026-06-15T10:00:00.000Z",
      tagStyle: "blue",
      cardStyle: "style2",
      pixelDecor: "/images/pixel-cat.png",
    },
    {
      _id: "animal_006",
      name: "花卷",
      species: "dog",
      breed: "中华田园犬",
      ageMonth: 24,
      gender: "female",
      weight: 7.0,
      sterilized: true,
      vaccinated: true,
      images: ["/pic/dog_brown_doubao.jpg"],
      description: "性格温顺亲人，家庭伴侣犬的好选择，适合有院子的家庭。",
      tags: ["亲人", "已绝育", "已疫苗"],
      city: "上海",
      addressText: "上海市徐汇区",
      status: "pending_audit",
      publisherOpenId: "mock_publisher_3",
      publisherName: "刘先生",
      healthNote: "健康良好",
      viewCount: 0,
      favoriteCount: 0,
      applyCount: 0,
      createTime: "2026-06-20T10:00:00.000Z",
      tagStyle: "pink",
      cardStyle: "style1",
      pixelDecor: "/images/pixel-dog.png",
    },
  ];
}

function getInitialApplications() {
  return [
    {
      _id: "apply_001",
      animalId: "animal_001",
      animalName: "小黄",
      applicantOpenId: "mock_openid_demo_user",
      applicantName: "爱心领养人",
      applicationForm: {
        reason: "喜欢动物，家里有适合的条件",
        timeCommitment: "每天有2小时陪伴时间",
        financialAbility: "可以承担每月500元",
        familyAgree: true,
        agreeReturn: true,
        otherPets: "家里没有其他宠物",
      },
      status: "approved", // pending / approved / rejected
      reviewerOpenId: "mock_staff_1",
      reviewNote: "家庭环境良好，审核通过",
      reviewTime: "2026-06-12T12:00:00.000Z",
      createTime: "2026-06-10T10:00:00.000Z",
    },
    {
      _id: "apply_002",
      animalId: "animal_002",
      animalName: "豆沙包",
      applicantOpenId: "mock_openid_demo_user",
      applicantName: "爱心领养人",
      applicationForm: {
        reason: "有养猫经验1年，想再领养一只狗",
        timeCommitment: "每天有3小时陪伴时间",
        financialAbility: "可以承担每月600元",
        familyAgree: true,
        agreeReturn: true,
        otherPets: "家里有一只猫",
      },
      status: "pending",
      reviewerOpenId: null,
      reviewNote: null,
      reviewTime: null,
      createTime: "2026-06-18T10:00:00.000Z",
    },
  ];
}

function getInitialReviews() {
  return [
    {
      _id: "review_001_01",
      animalId: "animal_001",
      animalName: "小黄",
      adopterOpenId: "mock_openid_demo_user",
      adopterName: "爱心领养人",
      applicationId: "apply_001",
      stage: "day7", // day7 / day30 / day90 / day365
      stageLabel: "第 1 次回访",
      status: "done", // pending / done / risk / closed
      submitTime: "2026-06-19T10:00:00.000Z",
      content: "小黄在新家适应良好，能吃能睡，和家人相处融洽。",
      images: [],
      rating: 5,
      healthStatus: "good",
      staffNote: "家长已提交回访，精神状态良好，饮食正常。",
      staffOpenId: "mock_staff_1",
      staffReplyTime: "2026-06-20T10:00:00.000Z",
      riskFlag: false,
    },
    {
      _id: "review_001_02",
      animalId: "animal_001",
      animalName: "小黄",
      adopterOpenId: "mock_openid_demo_user",
      adopterName: "爱心领养人",
      applicationId: "apply_001",
      stage: "day30",
      stageLabel: "第 2 次回访",
      status: "pending",
      submitTime: null,
      content: "家长反馈：近三天精神不振，食欲不振，不愿去医院检查。",
      images: [],
      rating: 3,
      healthStatus: "need_attention",
      staffNote: "",
      staffOpenId: null,
      staffReplyTime: null,
      riskFlag: true,
    },
  ];
}

// --- 内部工具 ---
// 数据版本检查：如果版本号不一致，清空所有缓存，强制用新初始数据
(function ensureDataVersion() {
  try {
    const cur = wx.getStorageSync(DATA_VERSION_KEY);
    if (cur !== DATA_VERSION) {
      wx.removeStorageSync(ANIMALS_KEY);
      wx.removeStorageSync(APPLICATIONS_KEY);
      wx.removeStorageSync(REVIEWS_KEY);
      wx.setStorageSync(DATA_VERSION_KEY, DATA_VERSION);
    }
  } catch (e) {
    // 忽略
  }
})();

function getCollection(key, initialFn) {
  try {
    let data = wx.getStorageSync(key);
    const storedVersion = wx.getStorageSync(DATA_VERSION_KEY);

    if (!data || !Array.isArray(data) || storedVersion !== DATA_VERSION) {
      data = initialFn();
      wx.setStorageSync(key, data);
      wx.setStorageSync(DATA_VERSION_KEY, DATA_VERSION);
    }
    return data;
  } catch (e) {
    return initialFn();
  }
}
function saveCollection(key, data) {
  try {
    wx.setStorageSync(key, data);
  } catch (e) {}
}
function now() {
  return new Date().toISOString();
}

// --- 导出 API ---
module.exports = {
  // ========== 动物档案 ==========
  // 查询附近待领养列表 — 根据用户坐标按距离筛选/排序
  animalList(params) {
    params = params || {};
    const {
      keyword = "",
      species = "",
      tag = "",
      page = 1,
      pageSize = 20,
      userLat = 0,
      userLng = 0,
      userCity = "",
    } = params;
    // 统一从本地存储读取（包含用户发布的新动物），不再只读取初始硬编码数据
    const list = getCollection(ANIMALS_KEY, getInitialAnimals);
    let filtered = list.filter((a) => a.status === "available");
    if (species) filtered = filtered.filter((a) => a.species === species);
    if (tag)
      filtered = filtered.filter((a) => (a.tags || []).indexOf(tag) > -1);
    if (keyword) {
      const kw = String(keyword).toLowerCase();
      filtered = filtered.filter(
        (a) =>
          (a.name || "").toLowerCase().indexOf(kw) > -1 ||
          (a.breed || "").toLowerCase().indexOf(kw) > -1 ||
          (a.description || "").toLowerCase().indexOf(kw) > -1,
      );
    }

    // === 根据用户坐标按距离筛选/排序 ===
    const hasCoord = userLat && userLng && userLat !== 0 && userLng !== 0;
    const DISTANCE_LIMIT_KM = 500; // 只展示 500 公里以内

    if (hasCoord) {
      // 给每只动物计算距离
      const withDistance = filtered.map((a) => {
        // 优先用动物自己的 lat/lng；没有时用城市中心坐标
        let aLat = a.lat,
          aLng = a.lng;
        if (!aLat || !aLng) {
          // 调用通用城市坐标查询（支持"北京市"和"北京"都能匹配）
          const fb = cityToCoord(a.city);
          if (fb) {
            aLat = fb.lat;
            aLng = fb.lng;
          } else {
            aLat = 32.06;
            aLng = 118.796;
          } // 找不到就用南京中心
        }
        const dLat = (aLat - userLat) * 111;
        const dLng = (aLng - userLng) * 85;
        const distanceKm = Math.sqrt(dLat * dLat + dLng * dLng);
        return Object.assign({}, a, {
          distanceKm: Math.round(distanceKm * 10) / 10,
        });
      });

      // 先筛选：同城/500km 内 的动物
      const cityKeyword = (userCity || "").replace(/[市县区省州]/g, "").trim();
      const inCityOrNear = withDistance.filter((a) => {
        // 同城市 → 一定保留
        if (cityKeyword && a.city) {
          const aCityShort = a.city.replace(/[市县区省州]/g, "").trim();
          if (aCityShort === cityKeyword) return true;
        }
        // 其他情况：距离 ≤ 500km
        return a.distanceKm <= DISTANCE_LIMIT_KM;
      });

      // 如果有 500km 以内的动物，按距离排序优先展示；否则全量展示（用户很远）
      if (inCityOrNear.length > 0) {
        filtered = inCityOrNear;
      }
      // 统一按距离排序（近 → 远）
      filtered.sort((x, y) => (x.distanceKm || 0) - (y.distanceKm || 0));
    }

    const start = (page - 1) * pageSize;
    return {
      code: 0,
      data: {
        list: filtered.slice(start, start + pageSize),
        total: filtered.length,
      },
    };
  },

  // 待审核列表（仅 staff）
  animalAuditList() {
    const list = getCollection(ANIMALS_KEY, getInitialAnimals);
    return { code: 0, data: list.filter((a) => a.status === "pending_audit") };
  },

  // 审核动物
  animalAudit(params) {
    const { animalId, action, rejectReason } = params || {};
    const list = getCollection(ANIMALS_KEY, getInitialAnimals);
    const idx = list.findIndex((a) => a._id === animalId);
    if (idx === -1) return { code: -1, msg: "动物不存在" };
    if (action === "approve") {
      list[idx].status = "available";
    } else if (action === "reject") {
      list[idx].status = "rejected";
      list[idx].rejectReason = rejectReason || "";
    }
    saveCollection(ANIMALS_KEY, list);
    return { code: 0, data: { animalId, action, status: list[idx].status } };
  },

  // 动物详情
  animalDetail(id) {
    const list = getCollection(ANIMALS_KEY, getInitialAnimals);
    const item = list.find((a) => a._id === id);
    if (!item) return { code: -1, msg: "找不到该动物" };
    // 查看数 +1
    item.viewCount = (item.viewCount || 0) + 1;
    saveCollection(ANIMALS_KEY, list);
    return { code: 0, data: item };
  },

  // 发布救助信息
  animalPublish(payload) {
    const list = getCollection(ANIMALS_KEY, getInitialAnimals);
    const user = wx.getStorageSync("userInfo") || {};
    // 优先用传入的精确坐标（用户自己的定位坐标），没有就用城市中心推断
    let lat = payload.lat,
      lng = payload.lng;
    if (!lat || !lng || lat === 0 || lng === 0) {
      const coord = cityToCoord(payload.city);
      if (coord) {
        lat = coord.lat;
        lng = coord.lng;
      }
    }
    const newAnimal = Object.assign({
      _id: "animal_" + Date.now(),
      name: payload.name || "未命名",
      species: payload.species || "dog",
      breed: payload.breed || "",
      ageMonth: payload.ageMonth || 0,
      gender: payload.gender || "male",
      weight: payload.weight || 0,
      sterilized: !!payload.sterilized,
      vaccinated: !!payload.vaccinated,
      images: payload.images || [],
      description: payload.description || "",
      tags: payload.tags || [],
      city: payload.city || "北京",
      addressText: payload.addressText || "",
      lat: lat || 0,
      lng: lng || 0,
      status: "available",
      publisherOpenId: user.openid || "mock_publisher_local",
      publisherName: user.nickname || "本地发布者",
      publisherPhone: payload.phone || "",
      healthNote: payload.healthNote || "",
      viewCount: 0,
      favoriteCount: 0,
      applyCount: 0,
      createTime: now(),
    });
    list.push(newAnimal);
    saveCollection(ANIMALS_KEY, list);
    return { code: 0, data: { animalId: newAnimal._id } };
  },

  // 收藏/取消收藏
  favoriteToggle(animalId) {
    const user = wx.getStorageSync("userInfo") || {};
    user.favoriteAnimals = user.favoriteAnimals || [];
    const idx = user.favoriteAnimals.indexOf(animalId);
    if (idx > -1) {
      user.favoriteAnimals.splice(idx, 1);
    } else {
      user.favoriteAnimals.push(animalId);
    }
    wx.setStorageSync("userInfo", user);
    // 同步 animals 的 favoriteCount
    const list = getCollection(ANIMALS_KEY, getInitialAnimals);
    const item = list.find((a) => a._id === animalId);
    if (item) {
      item.favoriteCount = (item.favoriteCount || 0) + (idx > -1 ? -1 : 1);
      saveCollection(ANIMALS_KEY, list);
    }
    return { code: 0, data: { isFavorite: idx === -1 } };
  },

  // ========== 领养申请 ==========
  applySubmit(params) {
    const { animalId, applicationForm } = params || {};
    const user = wx.getStorageSync("userInfo") || {};
    const applications = getCollection(
      APPLICATIONS_KEY,
      getInitialApplications,
    );
    // 重复申请校验（同一用户同一动物 24 小时内）
    const existed = applications.find(
      (a) =>
        a.animalId === animalId &&
        a.applicantOpenId === (user.openid || "mock_openid_demo_user") &&
        Date.now() - new Date(a.createTime).getTime() < 24 * 3600 * 1000,
    );
    if (existed) return { code: -1, msg: "您近期已对该动物提交过申请" };
    const animals = getCollection(ANIMALS_KEY, getInitialAnimals);
    const a = animals.find((x) => x._id === animalId);
    const newApply = {
      _id: "apply_" + Date.now(),
      animalId,
      animalName: a ? a.name : "",
      applicantOpenId: user.openid || "mock_openid_demo_user",
      applicantName: user.nickname || "爱心领养人",
      applicationForm: applicationForm || {},
      status: "pending",
      reviewerOpenId: null,
      reviewNote: null,
      reviewTime: null,
      createTime: now(),
    };
    applications.push(newApply);
    saveCollection(APPLICATIONS_KEY, applications);
    if (a) {
      a.applyCount = (a.applyCount || 0) + 1;
      saveCollection(ANIMALS_KEY, animals);
    }
    return { code: 0, data: { applicationId: newApply._id } };
  },

  // 我的申请
  applicationMy() {
    const user = wx.getStorageSync("userInfo") || {};
    const list = getCollection(APPLICATIONS_KEY, getInitialApplications);
    const filtered = list.filter(
      (a) => a.applicantOpenId === (user.openid || "mock_openid_demo_user"),
    );
    return { code: 0, data: filtered };
  },

  // 管理员审核申请
  applicationReview(params) {
    const { applicationId, status, note } = params || {};
    const list = getCollection(APPLICATIONS_KEY, getInitialApplications);
    const idx = list.findIndex((a) => a._id === applicationId);
    if (idx === -1) return { code: -1, msg: "申请不存在" };
    list[idx].status = status; // approved / rejected
    list[idx].reviewNote = note || "";
    list[idx].reviewTime = now();
    list[idx].reviewerOpenId = "mock_staff_1";
    saveCollection(APPLICATIONS_KEY, list);
    // 通过后生成 2 次回访任务
    if (status === "approved") {
      const reviews = getCollection(REVIEWS_KEY, getInitialReviews);
      const base = {
        animalId: list[idx].animalId,
        animalName: list[idx].animalName,
        adopterOpenId: list[idx].applicantOpenId,
        adopterName: list[idx].applicantName,
        applicationId: list[idx]._id,
      };
      reviews.push(
        Object.assign({}, base, {
          _id: "review_" + Date.now() + "_d7",
          stage: "day7",
          stageLabel: "第 1 次回访",
          status: "pending",
          submitTime: null,
          content: "",
          rating: 0,
          healthStatus: "good",
          staffNote: "",
          staffOpenId: null,
          staffReplyTime: null,
          riskFlag: false,
        }),
      );
      reviews.push(
        Object.assign({}, base, {
          _id: "review_" + Date.now() + "_d30",
          stage: "day30",
          stageLabel: "第 2 次回访",
          status: "pending",
          submitTime: null,
          content: "",
          rating: 0,
          healthStatus: "good",
          staffNote: "",
          staffOpenId: null,
          staffReplyTime: null,
          riskFlag: false,
        }),
      );
      saveCollection(REVIEWS_KEY, reviews);
    }
    return { code: 0, data: { applicationId, status } };
  },

  // ========== 回访 ==========
  reviewListByUser() {
    const user = wx.getStorageSync("userInfo") || {};
    const list = getCollection(REVIEWS_KEY, getInitialReviews);
    return {
      code: 0,
      data: list.filter(
        (r) => r.adopterOpenId === (user.openid || "mock_openid_demo_user"),
      ),
    };
  },

  reviewSubmit(params) {
    const { reviewId, content, images, healthStatus, rating } = params || {};
    const list = getCollection(REVIEWS_KEY, getInitialReviews);
    const idx = list.findIndex((r) => r._id === reviewId);
    if (idx === -1) return { code: -1, msg: "回访不存在" };
    list[idx].content = content;
    list[idx].images = images || [];
    list[idx].healthStatus = healthStatus || "good";
    list[idx].rating = rating || 5;
    list[idx].submitTime = now();
    // 健康状态有异常则标记风险
    if (healthStatus === "need_attention") list[idx].riskFlag = true;
    saveCollection(REVIEWS_KEY, list);
    // 信用分 +3
    const user = wx.getStorageSync("userInfo") || {};
    user.creditScore = Math.min(100, (user.creditScore || 80) + 3);
    wx.setStorageSync("userInfo", user);
    return { code: 0, data: { reviewId } };
  },

  // ========== 用户信息 ==========
  userInfo() {
    const user = wx.getStorageSync("userInfo") || {};
    return { code: 0, data: user };
  },

  // 更新用户资料
  userUpdate(payload) {
    const user = wx.getStorageSync("userInfo") || {};
    Object.assign(user, payload || {});
    wx.setStorageSync("userInfo", user);
    return { code: 0, data: user };
  },

  // 重置所有数据（便于调试）
  resetAll() {
    try {
      wx.removeStorageSync(ANIMALS_KEY);
      wx.removeStorageSync(APPLICATIONS_KEY);
      wx.removeStorageSync(REVIEWS_KEY);
    } catch (e) {}
    return { code: 0 };
  },
};
