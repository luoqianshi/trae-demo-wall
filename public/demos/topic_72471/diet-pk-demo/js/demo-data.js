// ========== Demo Data Layer: In-Memory Storage + Pre-populated Mock Data ==========
// 纯静态演示版：无 localStorage，无 API 调用，所有数据在内存中

// ─── 内存存储（替代 localStorage）───
const _store = {};

// ─── 预设食物卡路里映射表 ───
const FOOD_CAL_MAP = {
  rice: { name: '米饭', cal: 200, unit: '碗' },
  noodles: { name: '面条', cal: 300, unit: '碗' },
  burger: { name: '汉堡', cal: 550, unit: '个' },
  salad: { name: '沙拉', cal: 150, unit: '份' },
  chicken: { name: '鸡胸肉', cal: 200, unit: '份(100g)' },
  fruit: { name: '水果', cal: 80, unit: '份' },
  fish: { name: '鱼肉', cal: 150, unit: '份' },
  egg: { name: '鸡蛋', cal: 70, unit: '个' },
  bread: { name: '面包', cal: 250, unit: '片' },
  cake: { name: '蛋糕', cal: 350, unit: '块' },
  'milk-tea': { name: '奶茶', cal: 400, unit: '杯' },
  'ice-cream': { name: '冰淇淋', cal: 250, unit: '份' },
  'fried-chicken': { name: '炸鸡', cal: 600, unit: '份' },
  pizza: { name: '披萨', cal: 500, unit: '块' },
  chips: { name: '薯条', cal: 350, unit: '份' }
};

// 运动卡路里消耗参考 (kcal/小时)
const EXERCISE_CAL_MAP = {
  run: { name: '跑步', calPerHour: 500 },
  walk: { name: '散步', calPerHour: 200 },
  cycle: { name: '骑行', calPerHour: 400 },
  swim: { name: '游泳', calPerHour: 600 },
  gym: { name: '健身', calPerHour: 400 },
  yoga: { name: '瑜伽', calPerHour: 200 },
  jump: { name: '跳绳', calPerHour: 700 }
};

// ─── 日期工具 ───
function today() {
  const d = new Date();
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

function dateStr(d) {
  return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0');
}

// ─── 账号配置 ───
function getDefaultAccounts() {
  return {
    husband: {
      name: '燃脂侠',
      dailyCalorieBudget: 2000,
      initialWeight: 80,
      targetWeight: 72
    },
    wife: {
      name: '甩肉酱',
      dailyCalorieBudget: 1500,
      initialWeight: 60,
      targetWeight: 52
    }
  };
}

// ═══════════════════════════════════════════════
//  模拟数据预填充
// ═══════════════════════════════════════════════

function generateDayMeals(date, account, mealCount) {
  const options = account === 'husband'
    ? ['rice', 'chicken', 'fish', 'egg', 'bread', 'noodles', 'salad', 'fruit']
    : ['salad', 'fruit', 'egg', 'fish', 'chicken', 'rice', 'noodles', 'bread'];
  const meals = [];
  for (let i = 0; i < mealCount; i++) {
    const fk = options[Math.floor(Math.random() * options.length)];
    const f = FOOD_CAL_MAP[fk];
    meals.push({
      type: 'ai',
      name: f.name,
      calories: f.cal,
      unit: f.unit,
      time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 8 + i * 4, 10 + i * 10).toISOString(),
      supervised: false
    });
  }
  return meals;
}

function generateDayExercises(date, account) {
  const exercises = [];
  // 燃脂侠运动更多
  const exOptions = account === 'husband'
    ? ['run', 'gym', 'cycle', 'swim', 'jump']
    : ['walk', 'yoga', 'cycle', 'run'];
  const exKey = exOptions[Math.floor(Math.random() * exOptions.length)];
  const exInfo = EXERCISE_CAL_MAP[exKey];
  const duration = 25 + Math.floor(Math.random() * 35);
  exercises.push({
    type: exKey,
    name: exInfo.name,
    duration: duration,
    calories: Math.round(exInfo.calPerHour * (duration / 60)),
    time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 17, 30).toISOString()
  });
  return exercises;
}

function generateDayWater(date, account) {
  const amounts = account === 'husband' ? [500, 800, 1000, 500, 800] : [200, 500, 500, 800, 200, 500];
  const water = [];
  const count = 3 + Math.floor(Math.random() * 3);
  for (let i = 0; i < count; i++) {
    water.push({
      amount: amounts[Math.floor(Math.random() * amounts.length)],
      time: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 9 + i * 3, 0).toISOString()
    });
  }
  return water;
}

function generateDayWeight(date, account) {
  const base = account === 'husband' ? 78.5 : 57.8;
  const dayOfYear = Math.floor((date - new Date(date.getFullYear(), 0, 0)) / 86400000);
  const trend = -0.08 * (dayOfYear % 30);
  return Math.round((base + trend + (Math.random() - 0.5) * 0.6) * 10) / 10;
}

function buildDemoRecords() {
  const records = {};
  const now = new Date();

  // 燃脂侠的饮食计划（高热量但也在控制）
  const hMealCounts = [3, 2, 3, 2, 3, 3, 2, 3]; // 8天，今天 + 过去7天
  // 甩肉酱的饮食计划（更自律）
  const wMealCounts = [2, 2, 3, 2, 2, 2, 3, 2];

  for (let i = 7; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const idx = 7 - i;

    records[ds] = {
      husband: {
        meals: generateDayMeals(d, 'husband', hMealCounts[idx]),
        water: generateDayWater(d, 'husband'),
        exercises: generateDayExercises(d, 'husband'),
        weight: (d.getDate() % 2 === 0) ? generateDayWeight(d, 'husband') : null
      },
      wife: {
        meals: generateDayMeals(d, 'wife', wMealCounts[idx]),
        water: generateDayWater(d, 'wife'),
        exercises: generateDayExercises(d, 'wife'),
        weight: (d.getDate() % 2 === 0 || i === 0) ? generateDayWeight(d, 'wife') : null
      }
    };
  }
  return records;
}

// ─── 预填充所有存储 ───
_store.diet_pk_data = {
  records: buildDemoRecords(),
  pool: null,
  currentAccount: 'husband'
};

_store.diet_pk_accounts = {
  husband: {
    name: '燃脂侠',
    dailyCalorieBudget: 2000,
    initialWeight: 80,
    targetWeight: 72
  },
  wife: {
    name: '甩肉酱',
    dailyCalorieBudget: 1500,
    initialWeight: 60,
    targetWeight: 52
  }
};

_store.diet_pk_nicknames = {
  husband: '健身狂魔',
  wife: '小腰精'
};

_store.diet_pk_ai_config = {
  apiKey: '',
  apiEndpoint: 'https://api.openai.com/v1/chat/completions',
  model: 'gpt-4o'
};

_store.diet_pk_setup_completed = { husband: true, wife: true };

_store.pk_users = {
  '燃脂侠': { password: '', isAdmin: true, role: 'husband', displayName: '燃脂侠' },
  '甩肉酱': { password: '', isAdmin: false, role: 'wife', displayName: '甩肉酱' }
};

// ═══════════════════════════════════════════════
//  存储函数（操作 _store）
// ═══════════════════════════════════════════════

function loadData() {
  return _store.diet_pk_data || { records: {}, pool: null, currentAccount: 'husband' };
}

function saveData(data) {
  _store.diet_pk_data = data;
}

function loadAccounts() {
  return _store.diet_pk_accounts || getDefaultAccounts();
}

function saveAccounts(accounts) {
  _store.diet_pk_accounts = accounts;
}

// ─── 获取/初始化当日记录 ───
function getDayRecord(date, account) {
  const data = loadData();
  if (!data.records[date]) data.records[date] = {};
  if (!data.records[date][account]) {
    data.records[date][account] = { meals: [], water: [], exercises: [], weight: null };
    saveData(data);
  }
  return data.records[date][account];
}

// ─── 添加饮食 ───
function addMeal(date, account, foodKey, customName, customCal, supervised) {
  const data = loadData();
  if (!data.records[date]) data.records[date] = {};
  if (!data.records[date][account]) data.records[date][account] = { meals: [], water: [], exercises: [], weight: null };

  let meal;
  if (foodKey && FOOD_CAL_MAP[foodKey]) {
    const f = FOOD_CAL_MAP[foodKey];
    meal = {
      type: 'ai',
      name: f.name,
      calories: f.cal,
      unit: f.unit,
      time: new Date().toISOString(),
      supervised: !!supervised
    };
  } else if (customName && customCal) {
    meal = {
      type: 'manual',
      name: customName,
      calories: parseInt(customCal) || 0,
      unit: '',
      time: new Date().toISOString(),
      supervised: !!supervised
    };
  } else return null;

  data.records[date][account].meals.push(meal);
  saveData(data);
  return meal;
}

// ─── 添加喝水 ───
function addWaterFn(date, account, ml) {
  const data = loadData();
  if (!data.records[date]) data.records[date] = {};
  if (!data.records[date][account]) data.records[date][account] = { meals: [], water: [], exercises: [], weight: null };
  data.records[date][account].water.push({ amount: ml, time: new Date().toISOString() });
  saveData(data);
}
window._dataAddWater = addWaterFn;

// ─── 添加运动 ───
function addExercise(date, account, exKey, durationMin) {
  const data = loadData();
  if (!data.records[date]) data.records[date] = {};
  if (!data.records[date][account]) data.records[date][account] = { meals: [], water: [], exercises: [], weight: null };
  const exInfo = EXERCISE_CAL_MAP[exKey];
  if (!exInfo) return null;
  const hours = durationMin / 60;
  const calories = Math.round(exInfo.calPerHour * hours);
  const exercise = {
    type: exKey, name: exInfo.name, duration: durationMin,
    calories: calories, time: new Date().toISOString()
  };
  data.records[date][account].exercises.push(exercise);
  saveData(data);
  return exercise;
}

// ─── 删除记录 ───
function deleteMeal(date, account, index) {
  const data = loadData();
  if (!data.records[date] || !data.records[date][account]) return false;
  data.records[date][account].meals.splice(index, 1);
  saveData(data);
  return true;
}

function deleteWater(date, account, index) {
  const data = loadData();
  if (!data.records[date] || !data.records[date][account]) return false;
  data.records[date][account].water.splice(index, 1);
  saveData(data);
  return true;
}

function deleteExercise(date, account, index) {
  const data = loadData();
  if (!data.records[date] || !data.records[date][account]) return false;
  data.records[date][account].exercises.splice(index, 1);
  saveData(data);
  return true;
}

function deleteWeight(date, account) {
  const data = loadData();
  if (!data.records[date] || !data.records[date][account]) return false;
  data.records[date][account].weight = null;
  saveData(data);
  return true;
}

// ─── 体重 ───
function setWeight(date, account, weight) {
  const data = loadData();
  if (!data.records[date]) data.records[date] = {};
  if (!data.records[date][account]) data.records[date][account] = { meals: [], water: [], exercises: [], weight: null };
  data.records[date][account].weight = parseFloat(weight);
  saveData(data);
}

// ─── 今日统计 ───
function calcTodayStats(date, account) {
  const data = loadData();
  const rec = (data.records[date] && data.records[date][account]) || { meals: [], water: [], exercises: [], weight: null };
  const calIn = rec.meals.reduce((s, m) => s + m.calories, 0);
  const calOut = rec.exercises.reduce((s, e) => s + e.calories, 0);
  const waterTotal = rec.water.reduce((s, w) => s + w.amount, 0);
  const accounts = loadAccounts();
  const budget = accounts[account] ? accounts[account].dailyCalorieBudget : 2000;
  const netCal = calIn - calOut;
  const remain = Math.max(0, budget - netCal);

  let score = 0;
  if (waterTotal >= 1500) score += 10;
  if (rec.meals.length >= 2) score += 15;
  if (calOut >= 200) score += 15;
  if (rec.weight !== null) score += 5;
  if (netCal <= budget) score += 5;

  return { calIn, calOut, waterTotal, netCal, remain, budget, score,
    mealCount: rec.meals.length, exerciseCount: rec.exercises.length,
    hasWeight: rec.weight !== null, weight: rec.weight };
}

// ─── 积分明细 ───
function getScoreDetail(date, account) {
  const data = loadData();
  const rec = (data.records[date] && data.records[date][account]) || { meals: [], water: [], exercises: [], weight: null };
  const waterTotal = rec.water.reduce((s, w) => s + w.amount, 0);
  const calOut = rec.exercises.reduce((s, e) => s + e.calories, 0);
  const calIn = rec.meals.reduce((s, m) => s + m.calories, 0);
  const netCal = calIn - calOut;
  const accounts = loadAccounts();
  const budget = accounts[account] ? accounts[account].dailyCalorieBudget : 2000;
  const waterOk = waterTotal >= 1500;
  const mealOk = rec.meals.length >= 2;
  const exerciseOk = calOut >= 200;
  const weightOk = rec.weight !== null;
  const calOk = netCal <= budget;
  let score = 0;
  if (waterOk) score += 10;
  if (mealOk) score += 15;
  if (exerciseOk) score += 15;
  if (weightOk) score += 5;
  if (calOk) score += 5;
  return { waterOk, mealOk, exerciseOk, weightOk, calOk, score };
}

// ─── 本周积分（周一到周日）───
function getWeekScores(account) {
  const data = loadData();
  const now = new Date();
  const dayOfWeek = now.getDay();
  const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const scores = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(now);
    d.setDate(d.getDate() + mondayOffset + i);
    const ds = dateStr(d);
    const stats = calcTodayStats(ds, account);
    scores.push({ date: ds, score: stats.score, day: ['一','二','三','四','五','六','日'][i] });
  }
  return scores;
}

// ─── 本月数据 ───
function getMonthData(account) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const result = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const d = new Date(year, month, day);
    if (d > now) break;
    const ds = year + '-' + String(month+1).padStart(2,'0') + '-' + String(day).padStart(2,'0');
    const stats = calcTodayStats(ds, account);
    result.push({ date: ds, ...stats, label: day });
  }
  return result;
}

// ─── 最近N天 ───
function getRecentDaysData(account, days) {
  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const ds = dateStr(d);
    const stats = calcTodayStats(ds, account);
    result.push({ date: ds, ...stats });
  }
  return result;
}

// ─── 奖金池 ───
function getPool() { return loadData().pool; }
function setPool(pool) { const data = loadData(); data.pool = pool; saveData(data); }

function getPoolScores(startDate, endDate) {
  const data = loadData();
  const hScores = [], wScores = [];
  let d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    const ds = dateStr(d);
    hScores.push(calcTodayStats(ds, 'husband').score);
    wScores.push(calcTodayStats(ds, 'wife').score);
    d.setDate(d.getDate() + 1);
  }
  return { hTotal: hScores.reduce((a,b)=>a+b,0), wTotal: wScores.reduce((a,b)=>a+b,0), hScores, wScores };
}

// ─── 账号相关 ───
function getCurrentAccount() { return loadData().currentAccount || 'husband'; }
function switchCurrentAccount(account) { const data = loadData(); data.currentAccount = account; saveData(data); }
function getAccountInfo(account) { const accounts = loadAccounts(); return accounts[account] || null; }
function updateAccountInfo(account, updates) { const accounts = loadAccounts(); Object.assign(accounts[account], updates); saveAccounts(accounts); }

// ─── 昵称 ───
function loadNicknames() { return _store.diet_pk_nicknames || {}; }
function saveNicknames(nicknames) { _store.diet_pk_nicknames = nicknames; }
function getNickname(account) { const n = loadNicknames(); return n[account] || null; }
function setNickname(account, nickname) {
  const nicknames = loadNicknames();
  const trimmed = nickname.trim();
  if (trimmed) nicknames[account] = trimmed;
  else delete nicknames[account];
  saveNicknames(nicknames);
  const accounts = loadAccounts();
  if (accounts[account]) {
    accounts[account].name = trimmed || '燃脂侠';
    saveAccounts(accounts);
  }
}
function getDisplayName(account) {
  const nickname = getNickname(account);
  if (nickname) return nickname;
  const accounts = loadAccounts();
  return (accounts[account] && accounts[account].name) || account;
}
function getDefaultAccountName(account) {
  const accounts = loadAccounts();
  return (accounts[account] && accounts[account].name) || account;
}

// ─── 首次设置 ───
function isSetupCompleted(role) {
  const completed = _store.diet_pk_setup_completed || {};
  return !!completed[role];
}
function markSetupCompleted(role) {
  if (!_store.diet_pk_setup_completed) _store.diet_pk_setup_completed = {};
  _store.diet_pk_setup_completed[role] = true;
}

// ─── 重置/清空 ───
function resetAll() {
  _store.diet_pk_data = { records: buildDemoRecords(), pool: null, currentAccount: 'husband' };
  _store.diet_pk_accounts = { husband: { name:'燃脂侠', dailyCalorieBudget:2000, initialWeight:80, targetWeight:72 }, wife: { name:'甩肉酱', dailyCalorieBudget:1500, initialWeight:60, targetWeight:52 } };
  _store.diet_pk_nicknames = { husband: '健身狂魔', wife: '小腰精' };
  _store.diet_pk_ai_config = { apiKey:'', apiEndpoint:'https://api.openai.com/v1/chat/completions', model:'gpt-4o' };
  _store.diet_pk_setup_completed = { husband: true, wife: true };
}
function clearAllData() { resetAll(); }

// ─── AI配置 ───
function getDefaultAIConfig() { return { apiKey:'', apiEndpoint:'https://api.openai.com/v1/chat/completions', model:'gpt-4o' }; }
function loadAIConfig() { return _store.diet_pk_ai_config || getDefaultAIConfig(); }
function saveAIConfig(config) { _store.diet_pk_ai_config = config; }

// ─── AI识别（演示版使用模拟）───
async function analyzeFoodImage(base64Image) {
  return simulateFoodRecognition();
}
function simulateFoodRecognition() {
  const pool = [
    { name: '米饭', calories: 200 }, { name: '面条', calories: 300 }, { name: '汉堡', calories: 550 },
    { name: '沙拉', calories: 150 }, { name: '鸡胸肉', calories: 200 }, { name: '水果', calories: 80 },
    { name: '鱼肉', calories: 150 }, { name: '鸡蛋', calories: 70 }, { name: '面包', calories: 250 }
  ];
  const count = 1 + Math.floor(Math.random() * 3);
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  const foods = shuffled.slice(0, count).map(f => ({
    name: f.name, calories: Math.round(f.calories * (0.8 + Math.random() * 0.4)),
    confidence: Math.round((0.55 + Math.random() * 0.4) * 100) / 100
  }));
  return { foods, source: 'simulated' };
}

// ─── 统计汇总 ───
function getStatsSummary(account, days) {
  const daysData = getRecentDaysData(account, days);
  const totalScore = daysData.reduce((s, d) => s + d.score, 0);
  const totalCalIn = daysData.reduce((s, d) => s + d.calIn, 0);
  const totalCalOut = daysData.reduce((s, d) => s + d.calOut, 0);
  const totalNetCal = totalCalIn - totalCalOut;
  const avgScore = daysData.length > 0 ? Math.round(totalScore / daysData.length) : 0;
  const winDays = daysData.filter(d => d.score >= 30).length;
  const daysWithWeight = daysData.filter(d => d.hasWeight);
  const latestWeight = daysWithWeight.length > 0
    ? (() => { const idx = daysData.map(d => d.date).lastIndexOf(daysWithWeight[daysWithWeight.length-1].date); return daysData[idx].weight; })()
    : null;
  return { totalScore, totalCalIn, totalCalOut, totalNetCal, avgScore, winDays, daysWithWeight, latestWeight, daysData };
}

// ─── 获取全部记录日期 ───
function getAllRecordDates(account) {
  const data = loadData();
  const dates = [];
  for (const date in data.records) {
    const dayRec = data.records[date][account];
    if (dayRec) {
      const hasMeals = dayRec.meals && dayRec.meals.length > 0;
      const hasExercises = dayRec.exercises && dayRec.exercises.length > 0;
      const hasWater = dayRec.water && dayRec.water.length > 0;
      const hasWeight = dayRec.weight !== null && dayRec.weight !== undefined;
      if (hasMeals || hasExercises || hasWater || hasWeight) dates.push(date);
    }
  }
  dates.sort((a, b) => b.localeCompare(a));
  return dates;
}

// ─── 运动同步 ───
function addExerciseSync(date, account, syncData) {
  const data = loadData();
  if (!data.records[date]) data.records[date] = {};
  if (!data.records[date][account]) data.records[date][account] = { meals: [], water: [], exercises: [], weight: null };
  if (syncData.steps) {
    const calFromSteps = Math.round(syncData.steps * 0.04);
    data.records[date][account].exercises.push({
      type: 'synced', name: '手机步数同步', calories: calFromSteps,
      duration: syncData.activeMinutes || 0, time: new Date().toISOString(),
      meta: { steps: syncData.steps, distance: syncData.distance || 0, activeCal: syncData.activeCal || 0 }
    });
  }
  saveData(data);
  return data.records[date][account];
}

// ─── 用户认证（演示版跳过密码校验）───
const USERS_KEY = 'pk_users';
function loadUsers() { return _store.pk_users || null; }
function saveUsers(users) { _store.pk_users = users; }

async function register(hName, hPwd, wName, wPwd) {
  if (loadUsers()) return { success: false, error: '已有注册数据' };
  const users = {};
  users[hName] = { password: hPwd, isAdmin: true, role: 'husband', displayName: hName };
  users[wName] = { password: wPwd, isAdmin: false, role: 'wife', displayName: wName };
  saveUsers(users);
  return { success: true };
}

function login(accountName, password) {
  const users = loadUsers();
  if (!users) return { success: false, error: '尚未注册' };
  const user = users[accountName];
  if (!user) return { success: false, error: '账号不存在' };
  // 演示版：空密码直接通过
  if (user.password !== '' && user.password !== password) return { success: false, error: '密码错误' };
  return { success: true, isAdmin: user.isAdmin, role: user.role, displayName: user.displayName };
}

function autoLogin() {
  const users = loadUsers();
  if (!users) return false;
  // 默认以燃脂侠登录
  const hUser = users['燃脂侠'];
  if (!hUser) return false;
  return { success: true, isAdmin: hUser.isAdmin, role: hUser.role, displayName: hUser.displayName };
}

function getCurrentUser() {
  // 演示版：始终返回当前活跃用户
  return { account: '燃脂侠', role: 'husband', isAdmin: true };
}

function changePassword(adminAccount, adminPwd, targetAccount, newPwd) {
  const users = loadUsers();
  if (!users) return { success: false, error: '尚未注册' };
  const admin = users[adminAccount];
  if (!admin || !admin.isAdmin) return { success: false, error: '仅管理员可修改密码' };
  if (admin.password !== '' && admin.password !== adminPwd) return { success: false, error: '管理员密码错误' };
  if (!users[targetAccount]) return { success: false, error: '目标账号不存在' };
  users[targetAccount].password = newPwd;
  saveUsers(users);
  return { success: true };
}

function selfChangePassword(account, oldPwd, newPwd) {
  const users = loadUsers();
  if (!users) return { success: false, error: '尚未注册' };
  const user = users[account];
  if (!user) return { success: false, error: '账号不存在' };
  if (user.password !== '' && user.password !== oldPwd) return { success: false, error: '当前密码错误' };
  user.password = newPwd;
  saveUsers(users);
  return { success: true };
}

function syncUsersToData(users) {
  const data = loadData();
  data._users = users;
  saveData(data);
}

function saveLoginState(accountName, role, isAdmin) {
  _store.pk_saved_user = { accountName, role, isAdmin };
}

function getSavedAccount() {
  return _store.pk_saved_user || null;
}

function logout() {
  delete _store.pk_saved_user;
}

// ─── 跨设备同步（演示版无操作）───
async function initData() { return loadData(); }
async function pullDataFromServer() { return null; }
async function checkApiOnline() { return false; }
async function pushDataToServer() {}
async function pushUsersToServer() {}
function autoSyncToServer() {}
function exportSyncData() { alert('演示版不支持导出'); }
function saveSyncData() {}
async function loadSyncData() { return null; }
function mergeSyncData(localData, syncData) { return localData; }

console.log('[Demo] 模拟数据已加载，共 ' + Object.keys(_store.diet_pk_data.records).length + ' 天记录');
