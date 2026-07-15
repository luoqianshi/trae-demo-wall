// ============================================
// Keep Healthy - 情绪驱动健康管家
// 所有业务逻辑
// ============================================

// ==================== 全局变量 ====================
var currentUser = null;
var userProfile = {
  height: 175,
  weight: 70,
  gender: 'male',
  bmr: 0
};
var todayData = {
  date: getTodayDate(),
  diet: [],
  exercise: [],
  mood: '',
  checkin: false
};
var selectedFood = null;
var selectedExercise = { name: '', rate: 0 };

// ==================== 数据配置 ====================

// 食材数据库 - 每种食材每100g热量
var foodDB = {
  // 主食类
  rice: { name: '白米饭', emoji: '🍚', kcal: 116 },
  noodle: { name: '面条', emoji: '🍜', kcal: 110 },
  bread: { name: '全麦面包', emoji: '🍞', kcal: 260 },
  steamed_bun: { name: '馒头', emoji: '🥟', kcal: 221 },
  corn: { name: '玉米', emoji: '🌽', kcal: 116 },
  potato: { name: '土豆', emoji: '🥔', kcal: 77 },
  sweet_potato: { name: '红薯', emoji: '🍠', kcal: 86 },
  oats: { name: '燕麦', emoji: '🥣', kcal: 389 },
  
  // 肉类
  chicken: { name: '鸡胸肉', emoji: '🍗', kcal: 165 },
  beef: { name: '瘦牛肉', emoji: '🥩', kcal: 125 },
  pork: { name: '瘦猪肉', emoji: '🐷', kcal: 143 },
  fish: { name: '三文鱼', emoji: '🐟', kcal: 208 },
  shrimp: { name: '虾', emoji: '🦐', kcal: 81 },
  crab: { name: '螃蟹', emoji: '🦀', kcal: 95 },
  egg: { name: '鸡蛋', emoji: '🥚', kcal: 143 },
  duck: { name: '鸭肉', emoji: '🦆', kcal: 240 },
  
  // 蔬菜类
  tomato: { name: '番茄', emoji: '🍅', kcal: 18 },
  cucumber: { name: '黄瓜', emoji: '🥒', kcal: 16 },
  carrot: { name: '胡萝卜', emoji: '🥕', kcal: 41 },
  broccoli: { name: '西兰花', emoji: '🥦', kcal: 34 },
  spinach: { name: '菠菜', emoji: '🥬', kcal: 28 },
  lettuce: { name: '生菜', emoji: '🥬', kcal: 15 },
  mushroom: { name: '蘑菇', emoji: '🍄', kcal: 26 },
  bell_pepper: { name: '彩椒', emoji: '🫑', kcal: 25 },
  onion: { name: '洋葱', emoji: '🧅', kcal: 39 },
  garlic: { name: '大蒜', emoji: '🧄', kcal: 126 },
  
  // 水果类
  apple: { name: '苹果', emoji: '🍎', kcal: 52 },
  banana: { name: '香蕉', emoji: '🍌', kcal: 91 },
  orange: { name: '橙子', emoji: '🍊', kcal: 47 },
  grape: { name: '葡萄', emoji: '🍇', kcal: 43 },
  watermelon: { name: '西瓜', emoji: '🍉', kcal: 30 },
  pear: { name: '梨', emoji: '🍐', kcal: 58 },
  strawberry: { name: '草莓', emoji: '🍓', kcal: 32 },
  peach: { name: '桃子', emoji: '🍑', kcal: 42 },
  mango: { name: '芒果', emoji: '🥭', kcal: 60 },
  pineapple: { name: '菠萝', emoji: '🍍', kcal: 48 },
  kiwi: { name: '猕猴桃', emoji: '🥝', kcal: 61 },
  
  // 饮品类
  milk: { name: '牛奶', emoji: '🥛', kcal: 54 },
  yogurt: { name: '酸奶', emoji: '🥤', kcal: 72 },
  coffee: { name: '黑咖啡', emoji: '☕', kcal: 1 },
  tea: { name: '茶', emoji: '🍵', kcal: 1 },
  juice: { name: '果汁', emoji: '🧃', kcal: 45 },
  
  // 零食类
  chocolate: { name: '巧克力', emoji: '🍫', kcal: 546 },
  cookie: { name: '饼干', emoji: '🍪', kcal: 435 },
  ice_cream: { name: '冰淇淋', emoji: '🍦', kcal: 127 },
  chips: { name: '薯片', emoji: '🥔', kcal: 536 },
  candy: { name: '糖果', emoji: '🍬', kcal: 385 },
  
  // 其他
  salad: { name: '蔬菜沙拉', emoji: '🥗', kcal: 186 },
  tofu: { name: '豆腐', emoji: '🧈', kcal: 76 },
  cheese: { name: '芝士', emoji: '🧀', kcal: 380 },
  avocado: { name: '牛油果', emoji: '🥑', kcal: 160 }
};

// 心情-运动推荐映射
var moodRecommendations = {
  happy: {
    title: '心情不错！',
    desc: '心情好时适合高强度训练，可以更好地释放能量',
    exercises: ['跑步', 'HIIT', '跳绳']
  },
  depressed: {
    title: '心情压抑',
    desc: '压抑时需要通过运动来释放压力，建议中等强度运动',
    exercises: ['慢跑', '游泳', '骑行']
  },
  anxious: {
    title: '感到焦虑',
    desc: '焦虑时需要放松身心，瑜伽和冥想有助于平静情绪',
    exercises: ['瑜伽', '冥想', '慢跑']
  },
  tired: {
    title: '身心疲惫',
    desc: '疲惫时不宜剧烈运动，轻度活动有助于恢复精力',
    exercises: ['散步', '拉伸', '瑜伽']
  },
  irritated: {
    title: '烦躁易怒',
    desc: '烦躁时需要通过高强度运动来发泄情绪',
    exercises: ['拳击', '跳绳', '跑步']
  },
  empty: {
    title: '感觉空虚',
    desc: '空虚时需要社交性运动，增加生活乐趣',
    exercises: ['球类运动', '舞蹈', '团体健身']
  },
  low: {
    title: '情绪低落',
    desc: '低落时需要轻度活动来改善心情',
    exercises: ['散步', '太极', '园艺']
  },
  nervous: {
    title: '感到紧张',
    desc: '紧张时需要放松训练，深呼吸配合轻度运动',
    exercises: ['瑜伽', '拉伸', '散步']
  },
  numb: {
    title: '感觉麻木',
    desc: '麻木时需要轻度活动来激活身体',
    exercises: ['散步', '拉伸', '轻度瑜伽']
  },
  relaxed: {
    title: '状态轻松',
    desc: '轻松时适合保持日常运动习惯',
    exercises: ['慢跑', '骑行', '瑜伽']
  }
};

// 运动消耗速率（kcal/分钟）
var exerciseRates = {
  '跑步': 8,
  '健身': 6,
  '骑行': 5,
  '跳绳': 10,
  '瑜伽': 4,
  '游泳': 7,
  '散步': 3,
  '拉伸': 2,
  'HIIT': 9,
  '拳击': 11,
  '球类运动': 6,
  '舞蹈': 5,
  '团体健身': 6,
  '太极': 3,
  '冥想': 1
};

// ==================== 初始化 ====================
document.addEventListener('DOMContentLoaded', function() {
  initApp();
});

function initApp() {
  // 加载食物列表
  renderFoodList();
  renderModalFoodList();
  
  // 检查登录状态
  checkLogin();
  
  // 加载今日数据
  loadTodayData();
  
  // 加载用户数据
  loadUserData();
  
  // 更新首页
  updateHome();
}

// ==================== 工具函数 ====================

// 获取今日日期字符串
function getTodayDate() {
  var d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
}

// 格式化时间
function formatTime(date) {
  var d = new Date(date);
  return d.getHours().toString().padStart(2, '0') + ':' + d.getMinutes().toString().padStart(2, '0');
}

// Toast提示
function showToast(msg) {
  var toast = document.getElementById('toast');
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(function() {
    toast.classList.remove('show');
  }, 2000);
}

// 打开弹窗
function openModal(id) {
  document.getElementById(id).classList.add('show');
}

// 关闭弹窗
function closeModal(id) {
  document.getElementById(id).classList.remove('show');
}

// ==================== 登录注册系统 ====================

// 切换登录/注册Tab
function switchLoginTab(tab) {
  if (tab === 'login') {
    document.getElementById('tab-login').classList.add('bg-white/30');
    document.getElementById('tab-login').classList.remove('text-white/70');
    document.getElementById('tab-register').classList.remove('bg-white/30');
    document.getElementById('tab-register').classList.add('text-white/70');
    document.getElementById('form-login').style.display = 'block';
    document.getElementById('form-register').style.display = 'none';
  } else {
    document.getElementById('tab-register').classList.add('bg-white/30');
    document.getElementById('tab-register').classList.remove('text-white/70');
    document.getElementById('tab-login').classList.remove('bg-white/30');
    document.getElementById('tab-login').classList.add('text-white/70');
    document.getElementById('form-register').style.display = 'block';
    document.getElementById('form-login').style.display = 'none';
  }
}

// 登录
function handleLogin() {
  var username = document.getElementById('login-username').value.trim();
  var password = document.getElementById('login-password').value.trim();
  
  if (!username || !password) {
    showToast('请输入用户名和密码');
    return;
  }
  
  var users = JSON.parse(localStorage.getItem('users') || '[]');
  var user = users.find(function(u) {
    return u.username === username && u.password === password;
  });
  
  if (user) {
    currentUser = user;
    localStorage.setItem('currentUser', JSON.stringify(user));
    showToast('登录成功！');
    setTimeout(function() {
      document.getElementById('page-login').style.display = 'none';
      document.getElementById('app-main').style.display = 'block';
      initApp();
    }, 1000);
  } else {
    showToast('用户名或密码错误');
  }
}

// 注册
function handleRegister() {
  var username = document.getElementById('reg-username').value.trim();
  var password = document.getElementById('reg-password').value.trim();
  var password2 = document.getElementById('reg-password2').value.trim();
  
  if (!username || !password || !password2) {
    showToast('请填写完整信息');
    return;
  }
  
  if (password !== password2) {
    showToast('两次密码不一致');
    return;
  }
  
  var users = JSON.parse(localStorage.getItem('users') || '[]');
  if (users.some(function(u) { return u.username === username; })) {
    showToast('用户名已存在');
    return;
  }
  
  var newUser = {
    username: username,
    password: password,
    createdAt: new Date().toISOString()
  };
  
  users.push(newUser);
  localStorage.setItem('users', JSON.stringify(users));
  showToast('注册成功！请登录');
  switchLoginTab('login');
}

// 检查登录状态
function checkLogin() {
  var saved = localStorage.getItem('currentUser');
  if (saved) {
    currentUser = JSON.parse(saved);
    document.getElementById('page-login').style.display = 'none';
    document.getElementById('app-main').style.display = 'block';
  }
}

// 退出登录
function handleLogout() {
  localStorage.removeItem('currentUser');
  currentUser = null;
  showToast('已退出登录');
  setTimeout(function() {
    document.getElementById('page-login').style.display = 'flex';
    document.getElementById('app-main').style.display = 'none';
    document.getElementById('login-username').value = '';
    document.getElementById('login-password').value = '';
  }, 1000);
}

// ==================== 路由导航 ====================

function switchTab(tab) {
  // 更新Tab样式
  var tabs = document.querySelectorAll('.tab-item');
  tabs.forEach(function(t) { t.classList.remove('active'); });
  
  // 显示对应页面
  var pages = ['home', 'diet', 'mood', 'treehole', 'profile', 'feedback'];
  pages.forEach(function(p) {
    document.getElementById('page-' + p).classList.remove('active');
  });
  
  document.getElementById('page-' + tab).classList.add('active');
  
  // 更新底部导航高亮
  var tabIndex = { 'home': 0, 'diet': 1, 'mood': 2, 'treehole': 3, 'profile': 4 };
  if (tabIndex[tab] !== undefined) {
    tabs[tabIndex[tab]].classList.add('active');
  }
  
  // 如果是个人中心，刷新数据
  if (tab === 'profile') {
    loadUserData();
  }
}

// ==================== 数据存储 ====================

// 加载今日数据
function loadTodayData() {
  var key = 'todayData_' + getTodayDate();
  var saved = localStorage.getItem(key);
  if (saved) {
    todayData = JSON.parse(saved);
  }
  renderDietList();
  renderExerciseList();
}

// 保存今日数据
function saveTodayData() {
  var key = 'todayData_' + getTodayDate();
  localStorage.setItem(key, JSON.stringify(todayData));
}

// 加载用户数据
function loadUserData() {
  if (!currentUser) return;
  
  var key = 'userProfile_' + currentUser.username;
  var saved = localStorage.getItem(key);
  if (saved) {
    userProfile = JSON.parse(saved);
  }
  
  document.getElementById('profile-username').textContent = currentUser.username;
  document.getElementById('profile-height').value = userProfile.height;
  document.getElementById('profile-weight').value = userProfile.weight;
  setGender(userProfile.gender);
  
  // 计算BMR
  calcBMR();
  
  // 加载打卡记录
  loadCheckinHistory();
  
  // 加载树洞
  loadTreehole();
  
  // 加载反馈
  loadFeedback();
}

// 保存用户数据
function saveUserData() {
  if (!currentUser) return;
  var key = 'userProfile_' + currentUser.username;
  localStorage.setItem(key, JSON.stringify(userProfile));
}

// ==================== 计算逻辑 ====================

// 计算基础代谢率（Mifflin-St Jeor公式）
function calcBMR() {
  var h = userProfile.height || 175;
  var w = userProfile.weight || 70;
  var a = 25; // 默认年龄
  
  if (userProfile.gender === 'male') {
    userProfile.bmr = Math.round(10 * w + 6.25 * h - 5 * a + 5);
  } else {
    userProfile.bmr = Math.round(10 * w + 6.25 * h - 5 * a - 161);
  }
  
  document.getElementById('bmr-target').textContent = userProfile.bmr + ' kcal';
  updateHome();
}

// 设置性别
function setGender(gender) {
  userProfile.gender = gender;
  
  if (gender === 'male') {
    document.getElementById('gender-male').classList.add('bg-green-100', 'text-green-700');
    document.getElementById('gender-male').classList.remove('bg-gray-100', 'text-gray-600');
    document.getElementById('gender-female').classList.remove('bg-green-100', 'text-green-700');
    document.getElementById('gender-female').classList.add('bg-gray-100', 'text-gray-600');
  } else {
    document.getElementById('gender-female').classList.add('bg-green-100', 'text-green-700');
    document.getElementById('gender-female').classList.remove('bg-gray-100', 'text-gray-600');
    document.getElementById('gender-male').classList.remove('bg-green-100', 'text-green-700');
    document.getElementById('gender-male').classList.add('bg-gray-100', 'text-gray-600');
  }
  
  calcBMR();
  saveUserData();
}

// 更新个人资料
function updateProfile() {
  userProfile.height = parseInt(document.getElementById('profile-height').value) || 175;
  userProfile.weight = parseInt(document.getElementById('profile-weight').value) || 70;
  calcBMR();
  saveUserData();
}

// 计算总摄入热量
function getTotalIntake() {
  return todayData.diet.reduce(function(sum, item) {
    return sum + item.calories;
  }, 0);
}

// 计算总消耗热量
function getTotalBurn() {
  return todayData.exercise.reduce(function(sum, item) {
    return sum + item.calories;
  }, 0);
}

// 计算热量差值
function getCalorieBalance() {
  return getTotalIntake() - (userProfile.bmr + getTotalBurn());
}

// ==================== 首页 ====================

function updateHome() {
  var intake = getTotalIntake();
  var burn = getTotalBurn();
  var balance = getCalorieBalance();
  var target = userProfile.bmr;
  
  // 更新数值
  document.getElementById('cal-total').textContent = target;
  document.getElementById('intake-value').textContent = intake;
  document.getElementById('burn-value').textContent = burn;
  
  var balanceEl = document.getElementById('balance-value');
  balanceEl.textContent = (balance >= 0 ? '+' : '') + balance;
  balanceEl.style.color = balance >= 0 ? '#EF4444' : '#10B981';
  
  // 更新环形进度条
  var pct = Math.min(100, Math.round(intake / target * 100));
  var circumference = 2 * Math.PI * 42; // r=42
  var offset = circumference - (pct / 100) * circumference;
  document.getElementById('cal-progress').style.strokeDashoffset = offset;
  document.getElementById('cal-value').textContent = intake;
  
  // 更新状态
  var calStatus = document.getElementById('cal-status');
  if (intake === 0) {
    calStatus.textContent = '待记录';
    calStatus.className = 'status-tag';
  } else if (intake <= target * 1.1) {
    calStatus.textContent = '✅ 达标';
    calStatus.className = 'status-tag success';
  } else {
    calStatus.textContent = '⚠️ 超标';
    calStatus.className = 'status-tag danger';
  }
  
  var exerciseStatus = document.getElementById('exercise-status');
  var totalDuration = todayData.exercise.reduce(function(sum, item) {
    return sum + item.duration;
  }, 0);
  
  if (totalDuration === 0) {
    exerciseStatus.textContent = '待记录';
    exerciseStatus.className = 'status-tag';
  } else if (totalDuration >= 30) {
    exerciseStatus.textContent = '✅ 达标';
    exerciseStatus.className = 'status-tag success';
  } else {
    exerciseStatus.textContent = '⏳ 不足';
    exerciseStatus.className = 'status-tag danger';
  }
  
  // 更新健康总结
  var summary = document.getElementById('health-summary');
  if (intake === 0 && burn === 0) {
    summary.textContent = '新的一天开始了！记录今日饮食和运动吧';
  } else if (intake <= target && totalDuration >= 30) {
    summary.textContent = '🎉 今日表现优秀！继续保持健康生活方式';
  } else if (intake > target) {
    summary.textContent = '⚠️ 今日热量摄入超标，建议增加运动消耗';
  } else if (totalDuration < 30) {
    summary.textContent = '🏃 今日运动时长不足，建议适当增加运动量';
  } else {
    summary.textContent = '继续加油，保持良好的健康习惯！';
  }
}

// ==================== 饮食记录 ====================

// 渲染食物列表
function renderFoodList() {
  var container = document.getElementById('food-list-container');
  var html = '';
  
  Object.keys(foodDB).forEach(function(key) {
    var food = foodDB[key];
    html += '<div class="food-item" onclick="selectFood(\'' + key + '\')">' +
      '<div class="emoji">' + food.emoji + '</div>' +
      '<div class="info">' +
        '<div class="name">' + food.name + '</div>' +
        '<div class="cal">' + food.kcal + ' kcal/100g</div>' +
      '</div>' +
    '</div>';
  });
  
  container.innerHTML = html;
}

// 搜索食物
function searchFood() {
  var keyword = document.getElementById('food-search').value.toLowerCase();
  var container = document.getElementById('food-list-container');
  var items = container.querySelectorAll('.food-item');
  
  items.forEach(function(item) {
    var name = item.querySelector('.name').textContent.toLowerCase();
    item.style.display = name.includes(keyword) ? 'flex' : 'none';
  });
}

// 选择食物
function selectFood(key) {
  selectedFood = foodDB[key];
  openModal('modal-food');
  document.getElementById('modal-food-search').value = '';
  searchModalFood();
}

// 渲染弹窗食物列表
function renderModalFoodList() {
  var container = document.getElementById('modal-food-list');
  var html = '';
  
  Object.keys(foodDB).forEach(function(key) {
    var food = foodDB[key];
    html += '<div class="food-item" onclick="selectModalFood(\'' + key + '\')">' +
      '<div class="emoji">' + food.emoji + '</div>' +
      '<div class="info">' +
        '<div class="name">' + food.name + '</div>' +
        '<div class="cal">' + food.kcal + ' kcal/100g</div>' +
      '</div>' +
    '</div>';
  });
  
  container.innerHTML = html;
}

// 搜索弹窗食物
function searchModalFood() {
  var keyword = document.getElementById('modal-food-search').value.toLowerCase();
  var container = document.getElementById('modal-food-list');
  var items = container.querySelectorAll('.food-item');
  
  items.forEach(function(item) {
    var name = item.querySelector('.name').textContent.toLowerCase();
    item.style.display = name.includes(keyword) ? 'flex' : 'none';
  });
}

// 在弹窗中选择食物
function selectModalFood(key) {
  selectedFood = foodDB[key];
  showToast('已选择：' + selectedFood.name);
}

// 确认添加食物
function confirmFood() {
  if (!selectedFood) {
    showToast('请先选择食材');
    return;
  }
  
  var grams = parseInt(document.getElementById('modal-food-grams').value);
  if (!grams || grams <= 0) {
    showToast('请输入有效克数');
    return;
  }
  
  var calories = Math.round(selectedFood.kcal * grams / 100);
  
  todayData.diet.push({
    id: Date.now(),
    name: selectedFood.name,
    emoji: selectedFood.emoji,
    grams: grams,
    calories: calories
  });
  
  saveTodayData();
  renderDietList();
  closeModal('modal-food');
  document.getElementById('modal-food-grams').value = '';
  showToast('已添加：' + selectedFood.name + ' ' + grams + 'g');
}

// 渲染饮食列表
function renderDietList() {
  var container = document.getElementById('diet-list');
  var html = '';
  
  if (todayData.diet.length === 0) {
    html = '<div class="text-center text-gray-400 py-8">暂无饮食记录</div>';
  } else {
    todayData.diet.forEach(function(item) {
      html += '<div class="diet-row">' +
        '<div class="diet-name">' + item.emoji + ' ' + item.name + '</div>' +
        '<div class="diet-grams">' + item.grams + 'g</div>' +
        '<div class="diet-calories">' + item.calories + ' kcal</div>' +
        '<button class="btn-del" onclick="removeDiet(' + item.id + ')">×</button>' +
      '</div>';
    });
  }
  
  container.innerHTML = html;
  document.getElementById('total-intake').textContent = getTotalIntake();
  updateHome();
}

// 删除饮食记录
function removeDiet(id) {
  todayData.diet = todayData.diet.filter(function(item) {
    return item.id !== id;
  });
  saveTodayData();
  renderDietList();
  showToast('已删除');
}

// ==================== 心情&运动 ====================

// 选择心情
function selectMood(mood) {
  todayData.mood = mood;
  saveTodayData();
  
  var recommendation = moodRecommendations[mood];
  document.getElementById('mood-recommend-title').textContent = recommendation.title;
  document.getElementById('mood-recommend-desc').textContent = recommendation.desc;
  
  var listHtml = '';
  recommendation.exercises.forEach(function(ex) {
    listHtml += '<div class="flex items-center gap-2 mb-2">' +
      '<span class="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center text-xs">✓</span>' +
      '<span class="text-sm text-gray-700">' + ex + '</span>' +
    '</div>';
  });
  document.getElementById('mood-recommend-list').innerHTML = listHtml;
  
  openModal('modal-mood');
}

// 打开运动时长弹窗
function addExerciseModal(name, rate) {
  selectedExercise = { name: name, rate: rate };
  document.getElementById('modal-exercise-title').textContent = name + ' · 运动时长';
  openModal('modal-exercise');
}

// 确认运动记录
function confirmExercise() {
  var duration = parseInt(document.getElementById('modal-exercise-duration').value);
  if (!duration || duration <= 0) {
    showToast('请输入有效时长');
    return;
  }
  
  var calories = Math.round(selectedExercise.rate * duration);
  
  todayData.exercise.push({
    id: Date.now(),
    name: selectedExercise.name,
    duration: duration,
    calories: calories
  });
  
  saveTodayData();
  renderExerciseList();
  closeModal('modal-exercise');
  document.getElementById('modal-exercise-duration').value = '';
  showToast('已记录：' + selectedExercise.name + ' ' + duration + '分钟');
}

// 渲染运动列表
function renderExerciseList() {
  var container = document.getElementById('exercise-list');
  var html = '';
  
  if (todayData.exercise.length === 0) {
    html = '<div class="text-center text-gray-400 py-8">暂无运动记录</div>';
  } else {
    todayData.exercise.forEach(function(item) {
      html += '<div class="diet-row">' +
        '<div class="diet-name">🏃 ' + item.name + '</div>' +
        '<div class="diet-grams">' + item.duration + '分钟</div>' +
        '<div class="diet-calories">- ' + item.calories + ' kcal</div>' +
        '<button class="btn-del" onclick="removeExercise(' + item.id + ')">×</button>' +
      '</div>';
    });
  }
  
  container.innerHTML = html;
  document.getElementById('total-burn').textContent = getTotalBurn();
  updateHome();
}

// 删除运动记录
function removeExercise(id) {
  todayData.exercise = todayData.exercise.filter(function(item) {
    return item.id !== id;
  });
  saveTodayData();
  renderExerciseList();
  showToast('已删除');
}

// ==================== 树洞日记 ====================

// 加载树洞
function loadTreehole() {
  if (!currentUser) return;
  
  var key = 'treehole_' + currentUser.username;
  var saved = localStorage.getItem(key);
  var treeholes = saved ? JSON.parse(saved) : [];
  
  renderTreeholeList(treeholes);
}

// 保存树洞
function saveTreehole() {
  var content = document.getElementById('treehole-input').value.trim();
  if (!content) {
    showToast('请输入内容');
    return;
  }
  
  var key = 'treehole_' + currentUser.username;
  var saved = localStorage.getItem(key);
  var treeholes = saved ? JSON.parse(saved) : [];
  
  treeholes.unshift({
    id: Date.now(),
    content: content,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(key, JSON.stringify(treeholes));
  document.getElementById('treehole-input').value = '';
  renderTreeholeList(treeholes);
  showToast('日记已保存');
}

// 渲染树洞列表
function renderTreeholeList(treeholes) {
  var container = document.getElementById('treehole-list');
  var html = '';
  
  if (treeholes.length === 0) {
    html = '<div class="text-center text-gray-400 py-8">还没有日记，写下你的心事吧</div>';
  } else {
    treeholes.forEach(function(item) {
      var d = new Date(item.createdAt);
      var dateStr = d.getMonth() + 1 + '月' + d.getDate() + '日 ' + formatTime(item.createdAt);
      
      html += '<div class="treehole-item">' +
        '<div class="content">' + item.content + '</div>' +
        '<div class="flex justify-between items-center">' +
          '<div class="time">' + dateStr + '</div>' +
          '<button class="btn btn-sm btn-danger" onclick="deleteTreehole(' + item.id + ')">删除</button>' +
        '</div>' +
      '</div>';
    });
  }
  
  container.innerHTML = html;
}

// 删除树洞
function deleteTreehole(id) {
  var key = 'treehole_' + currentUser.username;
  var saved = localStorage.getItem(key);
  var treeholes = saved ? JSON.parse(saved) : [];
  
  treeholes = treeholes.filter(function(item) {
    return item.id !== id;
  });
  
  localStorage.setItem(key, JSON.stringify(treeholes));
  renderTreeholeList(treeholes);
  showToast('已删除');
}

// ==================== 每日打卡 ====================

// 加载打卡历史
function loadCheckinHistory() {
  if (!currentUser) return;
  
  var key = 'checkin_' + currentUser.username;
  var saved = localStorage.getItem(key);
  var history = saved ? JSON.parse(saved) : [];
  
  renderCheckinList(history);
  
  // 更新连续打卡天数
  var streak = calculateStreak(history);
  document.getElementById('profile-checkin').textContent = streak + '天';
}

// 计算连续打卡天数
function calculateStreak(history) {
  if (history.length === 0) return 0;
  
  var streak = 0;
  var today = getTodayDate();
  var checkDates = history.map(function(h) { return h.date; }).sort().reverse();
  
  var d = new Date();
  while (true) {
    var dateStr = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    
    if (checkDates.includes(dateStr)) {
      streak++;
      d.setDate(d.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
}

// 今日打卡
function doCheckin() {
  if (todayData.checkin) {
    showToast('今日已打卡');
    return;
  }
  
  todayData.checkin = true;
  saveTodayData();
  
  var key = 'checkin_' + currentUser.username;
  var saved = localStorage.getItem(key);
  var history = saved ? JSON.parse(saved) : [];
  
  history.push({
    date: getTodayDate(),
    mood: todayData.mood,
    dietCount: todayData.diet.length,
    exerciseCount: todayData.exercise.length,
    totalIntake: getTotalIntake(),
    totalBurn: getTotalBurn(),
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem(key, JSON.stringify(history));
  loadCheckinHistory();
  showToast('🎉 打卡成功！');
}

// 渲染打卡列表
function renderCheckinList(history) {
  var container = document.getElementById('checkin-list');
  var html = '';
  
  if (history.length === 0) {
    html = '<div class="text-center text-gray-400 py-8">还没有打卡记录</div>';
  } else {
    // 只显示最近7天
    var recent = history.slice(-7).reverse();
    
    recent.forEach(function(item) {
      html += '<div class="checkin-item">' +
        '<div class="date">' + item.date + '</div>' +
        '<div class="summary">' +
          '心情：' + (item.mood ? getMoodName(item.mood) : '未记录') + ' · ' +
          '饮食：' + item.dietCount + '项 · ' +
          '运动：' + item.exerciseCount + '项' +
        '</div>' +
      '</div>';
    });
  }
  
  container.innerHTML = html;
}

// 获取心情名称
function getMoodName(mood) {
  var names = {
    happy: '开心', depressed: '压抑', anxious: '焦虑', tired: '疲惫',
    irritated: '烦躁', empty: '空虚', low: '低落', nervous: '紧张',
    numb: '麻木', relaxed: '轻松'
  };
  return names[mood] || mood;
}

// ==================== 意见反馈 ====================

// 加载反馈
function loadFeedback() {
  var saved = localStorage.getItem('feedback');
  var feedbacks = saved ? JSON.parse(saved) : [];
  
  // 默认数据
  if (feedbacks.length === 0) {
    feedbacks = [
      {
        id: 1,
        username: '健康达人',
        content: '这个应用太棒了！帮助我更好地管理饮食和运动。',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      },
      {
        id: 2,
        username: '新手小白',
        content: '希望能增加更多的食材数据库，这样更方便记录。',
        createdAt: new Date(Date.now() - 172800000).toISOString()
      }
    ];
    localStorage.setItem('feedback', JSON.stringify(feedbacks));
  }
  
  renderFeedbackList(feedbacks);
}

// 提交反馈
function submitFeedback() {
  var content = document.getElementById('feedback-input').value.trim();
  if (!content) {
    showToast('请输入内容');
    return;
  }
  
  var saved = localStorage.getItem('feedback');
  var feedbacks = saved ? JSON.parse(saved) : [];
  
  feedbacks.unshift({
    id: Date.now(),
    username: currentUser ? currentUser.username : '匿名用户',
    content: content,
    createdAt: new Date().toISOString()
  });
  
  localStorage.setItem('feedback', JSON.stringify(feedbacks));
  document.getElementById('feedback-input').value = '';
  renderFeedbackList(feedbacks);
  showToast('评论已发布');
}

// 渲染反馈列表
function renderFeedbackList(feedbacks) {
  var container = document.getElementById('feedback-list');
  var html = '';
  
  if (feedbacks.length === 0) {
    html = '<div class="text-center text-gray-400 py-8">暂无评论，来说两句吧</div>';
  } else {
    feedbacks.forEach(function(item) {
      var d = new Date(item.createdAt);
      var dateStr = (d.getMonth() + 1) + '月' + d.getDate() + '日 ' + formatTime(item.createdAt);
      
      html += '<div class="comment-item">' +
        '<div class="author">' + item.username + '</div>' +
        '<div class="time">' + dateStr + '</div>' +
        '<div class="content">' + item.content + '</div>' +
        (currentUser && currentUser.username === item.username ?
          '<button class="btn btn-sm btn-danger mt-2" onclick="deleteFeedback(' + item.id + ')">删除</button>' : '') +
      '</div>';
    });
  }
  
  container.innerHTML = html;
}

// 删除反馈
function deleteFeedback(id) {
  var saved = localStorage.getItem('feedback');
  var feedbacks = saved ? JSON.parse(saved) : [];
  
  feedbacks = feedbacks.filter(function(item) {
    return item.id !== id;
  });
  
  localStorage.setItem('feedback', JSON.stringify(feedbacks));
  renderFeedbackList(feedbacks);
  showToast('已删除');
}