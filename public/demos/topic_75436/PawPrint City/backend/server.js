// 爪印城市 - 后端API服务器
const express = require('express');
const cors = require('cors');
const store = require('./data/places');

const app = express();
const PORT = 3000;

// 中间件
app.use(cors());
app.use(express.json());

// ==================== 通用响应方法 ====================
const success = (data, msg = 'success') => ({ code: 200, msg, data });
const fail = (msg = 'error', code = 400) => ({ code, msg, data: null });

// ==================== 场所模块 ====================

// 获取场所列表（支持多维度筛选 + 城市筛选）
app.get('/api/places', (req, res) => {
  let result = [...store.places];
  const { type, keyword, petType, size, facilities, city } = req.query;

  // 按城市筛选
  if (city) {
    result = result.filter(p => p.city === city);
  }

  // 按场所类型筛选
  if (type && type !== '全部') {
    const typeMap = { '餐饮': '餐饮', '住宿': '住宿', '公园': '公共空间', '商场': '商业' };
    const mappedType = typeMap[type] || type;
    result = result.filter(p => p.type === mappedType);
  }

  // 按关键词搜索（名称或地址）
  if (keyword) {
    const kw = keyword.toLowerCase();
    result = result.filter(p =>
      p.name.toLowerCase().includes(kw) ||
      p.address.toLowerCase().includes(kw)
    );
  }

  // 按宠物类型筛选
  if (petType) {
    if (petType === '全品类') {
      result = result.filter(p => p.petPolicy.petTypes.includes('犬类') && p.petPolicy.petTypes.includes('猫类'));
    } else {
      result = result.filter(p => p.petPolicy.petTypes.includes(petType));
    }
  }

  // 按体型限制筛选
  if (size) {
    result = result.filter(p => p.petPolicy.sizeLimit.includes(size));
  }

  // 按配套设施筛选（逗号分隔多选）
  if (facilities) {
    const facilityList = facilities.split(',');
    result = result.filter(p =>
      facilityList.every(f => p.petPolicy.facilities.includes(f))
    );
  }

  res.json(success(result));
});

// 获取支持的城市列表（全国主要城市）
app.get('/api/cities', (req, res) => {
  // 全国主要城市列表（高德地图支持）
  const allCities = [
    { name: '北京', center: [116.397428, 39.90923] },
    { name: '上海', center: [121.48, 31.22] },
    { name: '广州', center: [113.264385, 23.12911] },
    { name: '深圳', center: [114.085947, 22.547] },
    { name: '杭州', center: [120.153576, 30.287459] },
    { name: '成都', center: [104.065735, 30.659462] },
    { name: '重庆', center: [106.504962, 29.533155] },
    { name: '武汉', center: [114.298572, 30.584355] },
    { name: '西安', center: [108.948024, 34.263161] },
    { name: '南京', center: [118.78, 32.04] },
    { name: '苏州', center: [120.62, 31.32] },
    { name: '天津', center: [117.190182, 39.125575] },
    { name: '长沙', center: [112.982279, 28.194591] },
    { name: '郑州', center: [113.65, 34.76] },
    { name: '青岛', center: [120.33, 36.07] },
    { name: '大连', center: [121.62, 38.92] },
    { name: '厦门', center: [118.1, 24.46] },
    { name: '昆明', center: [102.712251, 25.040609] },
    { name: '沈阳', center: [123.429096, 41.796767] },
    { name: '哈尔滨', center: [126.642464, 45.756967] },
    { name: '石家庄', center: [114.48, 38.03] },
    { name: '太原', center: [112.53, 37.87] },
    { name: '济南', center: [117.000923, 36.675807] },
    { name: '福州', center: [119.306239, 26.075302] },
    { name: '南宁', center: [108.320004, 22.82402] },
    { name: '贵阳', center: [106.713478, 26.578343] },
    { name: '海口', center: [110.35, 20.02] },
    { name: '兰州', center: [103.823557, 36.058039] },
    { name: '银川', center: [106.27, 38.47] },
    { name: '西宁', center: [101.74, 36.56] },
    { name: '乌鲁木齐', center: [87.617733, 43.792818] },
    { name: '拉萨', center: [91.132212, 29.660361] },
    { name: '呼和浩特', center: [111.75, 40.84] },
    { name: '长春', center: [125.3245, 43.886841] },
    { name: '南昌', center: [115.89, 28.68] },
    { name: '合肥', center: [117.27, 31.86] },
    { name: '无锡', center: [120.29, 31.59] },
    { name: '宁波', center: [121.55, 29.87] },
    { name: '温州', center: [120.7, 28.0] },
    { name: '佛山', center: [113.11, 23.05] },
    { name: '东莞', center: [113.75, 23.05] },
    { name: '珠海', center: [113.52, 22.3] },
    { name: '中山', center: [113.39, 22.52] },
    { name: '惠州', center: [114.42, 23.11] },
    { name: '烟台', center: [121.39, 37.52] },
    { name: '潍坊', center: [119.16, 36.71] },
    { name: '洛阳', center: [112.45, 34.62] },
    { name: '唐山', center: [118.18, 39.63] },
    { name: '保定', center: [115.48, 38.87] }
  ];

  // 统计每个城市的场所数量
  const citiesWithData = [...new Set(store.places.map(p => p.city))];
  const cityData = allCities.map(city => ({
    name: city.name,
    center: city.center,
    count: citiesWithData.includes(city.name) ? store.places.filter(p => p.city === city.name).length : 0,
    hasData: citiesWithData.includes(city.name)
  }));

  res.json(success(cityData));
});

// 获取场所详情
app.get('/api/places/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const place = store.places.find(p => p.id === id);
  if (!place) {
    return res.status(404).json(fail('场所不存在', 404));
  }
  res.json(success(place));
});

// 提交用户实地验证
app.post('/api/places/:id/verify', (req, res) => {
  const id = parseInt(req.params.id);
  const place = store.places.find(p => p.id === id);
  if (!place) {
    return res.status(404).json(fail('场所不存在', 404));
  }

  const { user, content } = req.body;
  if (!user || !content) {
    return res.status(400).json(fail('用户名和验证内容不能为空'));
  }

  const verify = {
    user,
    content,
    time: new Date().toISOString().split('T')[0],
    avatar: '🐾'
  };

  place.verifies.unshift(verify);
  place.verifyCount += 1;

  res.json(success(verify, '验证提交成功'));
});

// 提交信息纠错
app.post('/api/places/:id/report', (req, res) => {
  const id = parseInt(req.params.id);
  const place = store.places.find(p => p.id === id);
  if (!place) {
    return res.status(404).json(fail('场所不存在', 404));
  }

  const { user, content, field } = req.body;
  if (!user || !content) {
    return res.status(400).json(fail('用户名和纠错内容不能为空'));
  }

  const report = {
    id: Date.now(),
    placeId: id,
    placeName: place.name,
    user,
    content,
    field: field || '其他',
    time: new Date().toISOString().split('T')[0],
    status: '已提交'
  };

  res.json(success(report, '纠错申请已提交，感谢您的反馈'));
});

// ==================== 商家模块 ====================

// 提交商家入驻申请
app.post('/api/merchant/apply', (req, res) => {
  const { name, type, address, hours, phone, petPolicy: petPolicyInput, description, facilities } = req.body;

  if (!name || !type || !address) {
    return res.status(400).json(fail('店铺名称、场所类型和详细地址为必填项'));
  }

  const apply = {
    id: store.nextApplyId++,
    applyNo: 'PP' + Date.now().toString().slice(-8),
    name,
    type,
    address,
    hours: hours || '待补充',
    phone: phone || '待补充',
    petPolicy: petPolicyInput || { allowed: true, petTypes: [], sizeLimit: [], requirements: '' },
    description: description || '',
    facilities: facilities || [],
    status: '审核中',
    submitTime: new Date().toISOString().split('T')[0],
    userId: store.defaultUserId
  };

  store.merchantApplies.push(apply);
  res.json(success(apply, '入驻申请提交成功'));
});

// 查询申请审核状态
app.get('/api/merchant/apply/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const apply = store.merchantApplies.find(a => a.id === id);
  if (!apply) {
    return res.status(404).json(fail('申请不存在', 404));
  }
  res.json(success(apply));
});

// ==================== 用户模块 ====================

// 初始化用户收藏
const ensureFavorites = (userId) => {
  if (!store.favorites[userId]) {
    store.favorites[userId] = [];
  }
  return store.favorites[userId];
};

// 获取用户收藏列表
app.get('/api/user/favorites', (req, res) => {
  const userId = req.query.userId || store.defaultUserId;
  const favIds = ensureFavorites(userId);
  const favPlaces = store.places.filter(p => favIds.includes(p.id));
  res.json(success(favPlaces));
});

// 添加/取消收藏
app.post('/api/user/favorites', (req, res) => {
  const userId = req.body.userId || store.defaultUserId;
  const { placeId, action } = req.body;

  if (!placeId || !['add', 'remove'].includes(action)) {
    return res.status(400).json(fail('参数错误：需要placeId和action（add/remove）'));
  }

  const favs = ensureFavorites(userId);
  const place = store.places.find(p => p.id === placeId);
  if (!place) {
    return res.status(404).json(fail('场所不存在', 404));
  }

  if (action === 'add') {
    if (!favs.includes(placeId)) {
      favs.push(placeId);
    }
    res.json(success({ placeId, isFavorited: true }, '收藏成功'));
  } else {
    const idx = favs.indexOf(placeId);
    if (idx > -1) {
      favs.splice(idx, 1);
    }
    res.json(success({ placeId, isFavorited: false }, '已取消收藏'));
  }
});

// 获取用户验证记录
app.get('/api/user/verifies', (req, res) => {
  const userId = req.query.userId || store.defaultUserId;
  const records = [];

  store.places.forEach(place => {
    place.verifies.forEach(v => {
      records.push({
        ...v,
        placeId: place.id,
        placeName: place.name,
        placeType: place.type
      });
    });
  });

  // 模拟部分记录属于当前用户
  const userRecords = records.filter((_, i) => i % 3 === 0);
  res.json(success(userRecords));
});

// 获取用户提交的商家申请
app.get('/api/user/applies', (req, res) => {
  const userId = req.query.userId || store.defaultUserId;
  const applies = store.merchantApplies.filter(a => a.userId === userId);
  res.json(success(applies));
});

// ==================== 用户认证模块 ====================

// 用户注册
app.post('/api/auth/register', (req, res) => {
  const { username, phone, password } = req.body;
  if (!username || !phone || !password) {
    return res.status(400).json(fail('用户名、手机号和密码为必填项'));
  }

  // 检查手机号是否已注册
  const exists = Object.values(store.users).find(u => u.phone === phone);
  if (exists) {
    return res.status(400).json(fail('该手机号已注册'));
  }

  const userId = 'user_' + (store.nextUserId++).toString().padStart(3, '0');
  const user = {
    id: userId,
    username,
    phone,
    password,
    avatar: '🐾',
    createdAt: new Date().toISOString().split('T')[0]
  };
  store.users[userId] = user;

  res.json(success({ id: user.id, username: user.username, avatar: user.avatar, phone: user.phone }, '注册成功'));
});

// 用户登录
app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  if (!phone || !password) {
    return res.status(400).json(fail('手机号和密码为必填项'));
  }

  const user = Object.values(store.users).find(u => u.phone === phone && u.password === password);
  if (!user) {
    return res.status(401).json(fail('手机号或密码错误', 401));
  }

  res.json(success({ id: user.id, username: user.username, avatar: user.avatar, phone: user.phone }, '登录成功'));
});

// 获取用户信息
app.get('/api/auth/profile', (req, res) => {
  const userId = req.query.userId || store.defaultUserId;
  const user = store.users[userId];
  if (!user) {
    return res.status(404).json(fail('用户不存在', 404));
  }
  res.json(success({ id: user.id, username: user.username, avatar: user.avatar, phone: user.phone }));
});

// ==================== 评论评分模块 ====================

// 获取场所评论列表
app.get('/api/places/:id/comments', (req, res) => {
  const placeId = parseInt(req.params.id);
  const place = store.places.find(p => p.id === placeId);
  if (!place) {
    return res.status(404).json(fail('场所不存在', 404));
  }

  const comments = store.comments[placeId] || [];
  res.json(success(comments));
});

// 提交评论评分
app.post('/api/places/:id/comments', (req, res) => {
  const placeId = parseInt(req.params.id);
  const place = store.places.find(p => p.id === placeId);
  if (!place) {
    return res.status(404).json(fail('场所不存在', 404));
  }

  const { userId, content, rating } = req.body;
  if (!userId || !content || !rating) {
    return res.status(400).json(fail('用户ID、评论内容和评分为必填项'));
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json(fail('评分必须在1-5之间'));
  }

  const user = store.users[userId] || { username: '匿名用户', avatar: '🐾' };
  const comment = {
    id: store.nextCommentId++,
    placeId,
    userId,
    username: user.username,
    avatar: user.avatar,
    content,
    rating,
    time: new Date().toISOString().split('T')[0]
  };

  if (!store.comments[placeId]) {
    store.comments[placeId] = [];
  }
  store.comments[placeId].unshift(comment);

  // 更新场所评分
  const allComments = store.comments[placeId];
  const avgRating = allComments.reduce((s, c) => s + c.rating, 0) / allComments.length;
  place.rating = Math.round(avgRating * 10) / 10;
  place.reviewCount = allComments.length;

  res.json(success(comment, '评论提交成功'));
});

// ==================== 宠物档案模块 ====================

// 获取用户宠物列表
app.get('/api/pets', (req, res) => {
  const userId = req.query.userId || store.defaultUserId;
  const pets = store.petProfiles[userId] || [];
  res.json(success(pets));
});

// 添加宠物档案
app.post('/api/pets', (req, res) => {
  const { userId, name, type, breed, age, size, description } = req.body;
  if (!userId || !name || !type) {
    return res.status(400).json(fail('用户ID、宠物名称和类型为必填项'));
  }

  const pet = {
    id: store.nextPetId++,
    name,
    type,
    breed: breed || '混血',
    age: age || '未知',
    size: size || '中型',
    avatar: type === '犬类' ? '🐕' : '🐱',
    description: description || '',
    createdAt: new Date().toISOString().split('T')[0]
  };

  if (!store.petProfiles[userId]) {
    store.petProfiles[userId] = [];
  }
  store.petProfiles[userId].push(pet);

  res.json(success(pet, '宠物档案添加成功'));
});

// 删除宠物档案
app.delete('/api/pets/:id', (req, res) => {
  const petId = parseInt(req.params.id);
  const userId = req.query.userId || store.defaultUserId;

  const pets = store.petProfiles[userId] || [];
  const idx = pets.findIndex(p => p.id === petId);
  if (idx === -1) {
    return res.status(404).json(fail('宠物档案不存在', 404));
  }

  const removed = pets.splice(idx, 1)[0];
  res.json(success(removed, '宠物档案已删除'));
});

// ==================== 启动服务 ====================
app.listen(PORT, () => {
  console.log('🐾 爪印城市后端服务已启动');
  console.log(`📍 API地址: http://localhost:${PORT}`);
  console.log(`📋 场所数据: ${store.places.length} 条（北京+上海）`);
  console.log(`🔗 接口前缀: http://localhost:${PORT}/api`);
  console.log('────────────────────────────────────────────');
  console.log('  场所模块:');
  console.log('  GET  /api/places               - 获取场所列表');
  console.log('  GET  /api/places/:id           - 获取场所详情');
  console.log('  POST /api/places/:id/verify    - 提交验证');
  console.log('  POST /api/places/:id/report    - 提交纠错');
  console.log('  GET  /api/cities               - 城市列表');
  console.log('  评论模块:');
  console.log('  GET  /api/places/:id/comments  - 获取评论');
  console.log('  POST /api/places/:id/comments  - 提交评论');
  console.log('  商家模块:');
  console.log('  POST /api/merchant/apply       - 商家入驻');
  console.log('  GET  /api/merchant/apply/:id   - 查询申请');
  console.log('  用户模块:');
  console.log('  POST /api/auth/register        - 用户注册');
  console.log('  POST /api/auth/login           - 用户登录');
  console.log('  GET  /api/auth/profile         - 用户信息');
  console.log('  GET  /api/user/favorites       - 获取收藏');
  console.log('  POST /api/user/favorites       - 操作收藏');
  console.log('  GET  /api/user/verifies        - 验证记录');
  console.log('  GET  /api/user/applies         - 商家申请');
  console.log('  宠物模块:');
  console.log('  GET  /api/pets                 - 宠物列表');
  console.log('  POST /api/pets                 - 添加宠物');
  console.log('  DELETE /api/pets/:id           - 删除宠物');
  console.log('────────────────────────────────────────────');
});