// ============================================================
// app.js — 同路 AA 主应用逻辑
// Vue 3 + Pinia，所有状态用 Pinia 管理，交互逻辑用组合式函数封装
// ============================================================

const { createApp, ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } = Vue;
const { createPinia, defineStore, storeToRefs } = Pinia;

// ===== 车型数据库（本地配置，无免费 API） =====
const CAR_DATABASE = {
  '传祺 M8': {
    name: '传祺 M8', series: '领秀系列', type: 'MPV', seats: 7,
    fuel: 8.5, fuelType: '92号汽油', costPerKm: 1.2, trunk: 516, comfort: 4.3,
    description: '空间宽敞，适合多人出游',
  },
  '别克 GL8': {
    name: '别克 GL8', series: '陆上公务舱', type: 'MPV', seats: 7,
    fuel: 9.2, fuelType: '95号汽油', costPerKm: 1.5, trunk: 475, comfort: 4.5,
    description: '舒适度高，油耗略高',
  },
  '哈弗 H6': {
    name: '哈弗 H6', series: '国潮版', type: 'SUV', seats: 5,
    fuel: 8.0, fuelType: '92号汽油', costPerKm: 0.9, trunk: 347, comfort: 4.0,
    description: '性价比高，适合预算敏感出行',
  },
};

const CAR_OPTIONS = Object.values(CAR_DATABASE);

// === 自定义车型管理（localStorage 持久化） ===
const CUSTOM_CARS_KEY = 'tonglu_custom_cars';
function loadCustomCars() {
  try { return JSON.parse(localStorage.getItem(CUSTOM_CARS_KEY) || '[]'); } catch { return []; }
}
function saveCustomCars(cars) {
  try { localStorage.setItem(CUSTOM_CARS_KEY, JSON.stringify(cars)); } catch {}
}
// 合并内置车型 + 自定义车型
function getAllCarOptions() {
  return [...CAR_OPTIONS, ...loadCustomCars()];
}

// ===== Pinia Store: Trip =====
const useTripStore = defineStore('trip', () => {
  const origin = ref('');
  const dest = ref('');
  const people = ref(4);
  const budgetMax = ref(2000);
  const carModel = ref('传祺 M8');
  const days = ref(1);
  const selectedRouteIndex = ref(0);

  // API 返回的真实数据
  const routeData = ref(null);      // OSRM 返回的路线数据
  const originCoords = ref(null);   // 出发地坐标
  const destCoords = ref(null);     // 目的地坐标
  const weatherData = ref(null);    // 天气数据
  const aiRouteDesc = ref('');      // AI 生成的路线描述
  const aiRisks = ref([]);          // AI 生成的风险提示
  const aiFoods = ref([]);          // AI 生成的美食推荐
  const aiGuide = ref(null);        // AI 生成的游玩攻略
  const apiError = ref('');         // API 错误信息

  return { origin, dest, people, budgetMax, carModel, days, selectedRouteIndex,
    routeData, originCoords, destCoords, weatherData, aiRouteDesc, aiRisks, aiFoods, aiGuide, apiError };
});

// ===== Pinia Store: Checklist =====
const useChecklistStore = defineStore('checklist', () => {
  const defaultItems = [
    { text: '身份证', owner: '全员', ownerClass: 'shared', checked: false },
    { text: '学生证', owner: '全员', ownerClass: 'shared', checked: false },
    { text: '充电宝×2', owner: '张同学', ownerClass: 'o1', checked: false },
    { text: '防晒霜', owner: '李同学', ownerClass: 'o2', checked: false },
    { text: '遮阳帽 & 墨镜', owner: '全员', ownerClass: 'shared', checked: false },
    { text: '运动鞋', owner: '全员', ownerClass: 'shared', checked: false },
    { text: '矿泉水 2L/人', owner: '王同学', ownerClass: 'o3', checked: false },
    { text: '常用药品包', owner: '张同学', ownerClass: 'o1', checked: false },
    { text: '垃圾袋', owner: '赵同学', ownerClass: 'o4', checked: false },
    { text: '雨伞/一次性雨衣', owner: '全员', ownerClass: 'shared', checked: false },
    { text: '少量现金', owner: '全员', ownerClass: 'shared', checked: false },
    { text: '车载手机支架', owner: '张同学', ownerClass: 'o1', checked: false },
  ];
  const items = ref(JSON.parse(localStorage.getItem('tonglu_checklist') || 'null') || defaultItems);

  function save() { localStorage.setItem('tonglu_checklist', JSON.stringify(items.value)); }
  function toggle(i) { items.value[i].checked = !items.value[i].checked; save(); }
  function checkAll() { items.value.forEach(it => it.checked = true); save(); }
  function uncheckAll() { items.value.forEach(it => it.checked = false); save(); }
  function add(text) {
    if (!text.trim()) return;
    items.value.push({ text: text.trim(), owner: '自定义', ownerClass: 'shared', checked: false });
    save();
  }
  function remove(i) { items.value.splice(i, 1); save(); }

  return { items, toggle, checkAll, uncheckAll, add, remove, save };
});

// ===== Pinia Store: Polls =====
const usePollStore = defineStore('polls', () => {
  const defaultPolls = [
    { icon: '🥘', question: '午餐选择？', closed: true, myVote: 0, options: [{ text: '当地特色餐馆', votes: 3 }, { text: '自带野餐', votes: 1 }] },
    { icon: '⏰', question: '出发时间？', closed: true, myVote: 1, options: [{ text: '06:30', votes: 1 }, { text: '07:00', votes: 3 }] },
    { icon: '🎵', question: '路上听什么歌单？', closed: false, myVote: -1, options: [{ text: '周杰伦精选', votes: 2 }, { text: '夏日旅行歌单', votes: 1 }, { text: '随机播放', votes: 0 }] },
  ];
  const polls = ref(JSON.parse(localStorage.getItem('tonglu_polls') || 'null') || defaultPolls);

  function save() { localStorage.setItem('tonglu_polls', JSON.stringify(polls.value)); }
  function vote(pi, oi) {
    const p = polls.value[pi];
    if (p.closed) return;
    if (p.myVote >= 0) p.options[p.myVote].votes = Math.max(0, p.options[p.myVote].votes - 1);
    if (p.myVote === oi) { p.myVote = -1; } else { p.options[oi].votes++; p.myVote = oi; }
    save();
  }
  function add(question) {
    if (!question.trim()) return;
    polls.value.push({ icon: '📊', question: question.trim(), closed: false, myVote: -1, options: [{ text: '选项 A', votes: 0 }, { text: '选项 B', votes: 0 }] });
    save();
  }

  return { polls, vote, add, save };
});

// ===== Pinia Store: Expense =====
const useExpenseStore = defineStore('expense', () => {
  const items = ref(JSON.parse(localStorage.getItem('tonglu_expenses') || '[]'));
  function save() { localStorage.setItem('tonglu_expenses', JSON.stringify(items.value)); }
  function add(expense) { items.value.unshift(expense); save(); }
  function remove(id) { items.value = items.value.filter(e => e.id !== id); save(); }
  return { items, add, remove, save };
});

// ===== Pinia Store: Live =====
const useLiveStore = defineStore('live', () => {
  const defaultPosts = [
    {
      id: Date.now() - 120000,
      user: '张同学',
      userId: 'zhang',
      avatar: '张',
      location: '吐鲁沟国家森林公园',
      type: 'traffic',
      content: 'G109 连城段正在修路，单向通行，预计延误 30 分钟',
      image: '',
      timestamp: new Date(Date.now() - 120000).toISOString(),
      likes: 5,
      likedByMe: false,
      verified: true,
    },
    {
      id: Date.now() - 3600000,
      user: '李同学',
      userId: 'li',
      avatar: '李',
      location: '吐鲁沟国家森林公园 · 天池',
      type: 'scenic',
      content: '今天天气不错，天池能见度很高，适合拍照！',
      image: '',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      likes: 12,
      likedByMe: false,
      verified: false,
    },
  ];
  const posts = ref(JSON.parse(localStorage.getItem('tonglu_live') || 'null') || defaultPosts);

  function save() { localStorage.setItem('tonglu_live', JSON.stringify(posts.value)); }
  function add(post) { posts.value.unshift(post); save(); }
  function like(id) {
    const p = posts.value.find(x => x.id === id);
    if (!p) return;
    if (p.likedByMe) { p.likes = Math.max(0, p.likes - 1); p.likedByMe = false; }
    else { p.likes++; p.likedByMe = true; }
    save();
  }

  return { posts, add, like, save };
});

// ===== 信用分规则 =====
const CREDIT_RULES = {
  '准时到达': +5,
  '费用结清': +5,
  '获得好评': +3,
  '发布实况被采纳': +2,
  '迟到': -5,
  '费用纠纷': -10,
  '被投诉': -15,
  '放鸽子': -20
};

function calculateCreditScore(userId, history = []) {
  let score = 100;
  history.forEach(event => {
    score += CREDIT_RULES[event.type] || 0;
  });
  return Math.max(0, Math.min(100, score));
}

// ===== Main App =====
const app = createApp({
  setup() {
    const tripStore = useTripStore();
    const checklistStore = useChecklistStore();
    const pollStore = usePollStore();
    const liveStore = useLiveStore();
    const expenseStore = useExpenseStore();

    // === Reactive State ===
    const loading = ref(false);
    const loadingText = ref('');
    const loadingStep = ref(''); // 当前执行步骤
    const toast = reactive({ show: false, msg: '', type: 'info' });
    const showResult = ref(false);
    const planReady = ref(false); // 方案就绪提示卡
    const guideModalOpen = ref(false); // 完整攻略弹窗
    const guideLoading = ref(false); // 攻略重新生成中
    const guideError = ref(''); // 攻略 AI 错误信息
    // === AI 问答 ===
    const aiQuestion = ref('');
    const aiAnswer = ref('');
    const aiAnswerSource = ref('');
    const aiAnswerLoading = ref(false);
    const aiChatHistory = ref([]); // 对话历史
    const aiSuggestedQuestions = computed(() => {
      const dest = tripStore.dest || '目的地';
      return [
        `${dest}附近有什么好吃的？`,
        '需要带厚衣服吗？',
        `${dest}门票多少钱？`,
        '有什么需要注意的？',
        '附近有加油站吗？',
        '一天时间够玩吗？',
      ];
    });
    // === file:// 遮罩 ===
    const showProtocolMask = ref(location.protocol === 'file:');
    // === 分享 Canvas ===
    const shareCanvasRef = ref(null);
    const step = ref(1);
    const activeSection = ref('plan');
    const activeTab = ref('plan');
    const tabs = [
      { id: 'plan', icon: '📋', label: '方案' },
      { id: 'map', icon: '🗺', label: '地图' },
      { id: 'account', icon: '💰', label: '账本' },
      { id: 'me', icon: '👤', label: '我的' },
    ];
    const newItem = ref('');
    const newPollQuestion = ref('');
    const showLiveForm = ref(false);
    const newLive = reactive({ content: '', location: '', type: 'traffic', image: '' });
    const expenseModalOpen = ref(false);
    const expenseForm = reactive({ amount: null, category: '油费', payer: '张同学', receipt: null, receiptPreview: null });
    const receiptInput = ref(null);
    const errors = reactive({});
    const planRef = ref(null);
    const shareCardRef = ref(null);
    const qrCanvasRef = ref(null);

    // === 地图状态（由 MapController 管理） ===
    const mapStatus = ref('idle'); // idle | loading | ready | error | fallback
    const mapErrorMsg = ref('');

    // === 数据来源 & 更新时间追踪 ===
    const dataSources = reactive({
      geocode: '',    // open-meteo-geocoding | local-fallback
      route: '',      // osrm | ors | local-estimate
      weather: '',    // open-meteo | local-fallback
      aiRouteDesc: '',// ai-mimo | local-template
      aiRisks: '',    // ai-mimo | local-template
      aiFoods: '',    // ai-mimo | local-template
      aiGuide: '',    // ai-mimo | local-template
    });
    const updateTimes = reactive({
      route: null,
      weather: null,
      ai: null,
    });

    // === 比赛演示模式 ===
    const DEMO_DATA = {
      origin: '兰州工业学院',
      dest: '吐鲁沟国家森林公园',
      people: 4,
      budgetMax: 2000,
      carModel: '传祺 M8',
      days: 1,
    };
    const isDemoMode = ref(false);

    function loadDemoData() {
      tripStore.origin = DEMO_DATA.origin;
      tripStore.dest = DEMO_DATA.dest;
      tripStore.people = DEMO_DATA.people;
      tripStore.budgetMax = DEMO_DATA.budgetMax;
      tripStore.carModel = DEMO_DATA.carModel;
      tripStore.days = DEMO_DATA.days;
      isDemoMode.value = true;
      doPlan();
    }

    // 格式化更新时间
    function formatUpdateTime(ts) {
      if (!ts) return '';
      const d = new Date(ts);
      return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`;
    }

    // 数据来源标签
    function sourceLabel(source) {
      const labels = {
        'open-meteo-geocoding': '🌐 Open-Meteo',
        'local-fallback': '📦 本地后备',
        'osrm': '🌐 OSRM',
        'ors': '🌐 ORS',
        'local-estimate': '📦 本地估算',
        'open-meteo': '🌐 Open-Meteo',
        'ai-mimo': '🤖 MiMo AI',
        'local-template': '📝 本地模板',
      };
      return labels[source] || source;
    }

    // === 实时位置共享 ===
    const locationSharing = ref(false);
    const locationMapVisible = ref(false);
    const sosConfirmShow = ref(false);
    let shareIntervalId = null;
    let mockIntervalId = null;
    const LOCATION_UPDATE_MS = 30000; // 30 秒
    const DEVIATION_THRESHOLD_M = 5000; // 5 km
    const locationMembers = ref([
      { id: 'current_user', name: '我', color: '#c53d43', lat: null, lon: null, timestamp: null, battery: 87, marker: null, status: 'normal' },
      { id: 'm1', name: '张同学', color: '#10b981', lat: null, lon: null, timestamp: null, battery: 65, marker: null, status: 'normal' },
      { id: 'm2', name: '李同学', color: '#f59e0b', lat: null, lon: null, timestamp: null, battery: 42, marker: null, status: 'normal' },
      { id: 'm3', name: '王同学', color: '#6b5b95', lat: null, lon: null, timestamp: null, battery: 78, marker: null, status: 'normal' },
    ]);

    // === Nav Items ===
    const navItems = [
      { id: 'plan', label: '📋 出行规划' }, { id: 'match', label: '🤝 找搭子' }, { id: 'route', label: '🗺 路线方案' },
      { id: 'guide', label: '📖 攻略' }, { id: 'weather', label: '🌤 天气' },
      { id: 'compare', label: '🚗 车型' }, { id: 'budget', label: '💰 AA 分账' },
      { id: 'timeline', label: '⏱ 行程' }, { id: 'checklist-sec', label: '🎒 清单' },
      { id: 'food', label: '🍜 美食' }, { id: 'feasibility', label: '✅ 可行性' },
      { id: 'risk', label: '⚠ 风险' }, { id: 'poll', label: '📊 投票' },
      { id: 'live', label: '📡 实况' }, { id: 'stats', label: '📈 统计' },
      { id: 'share', label: '📤 分享' }, { id: 'value', label: '💡 价值' },
      { id: 'refs', label: '📚 参考' },
    ];

    // === 找搭子 ===
    const matchTagOptions = ['摄影', '徒步', '美食', '自驾', '穷游'];
    const matchForm = reactive({ dest: '', date: '', currentPeople: 2, budget: 200, tags: [], note: '' });
    const matchErrors = ref([]);
    const matchResults = ref([]);
    const myMatchPlan = ref(null);
    const matchRef = ref(null);

    const canPublishMatch = computed(() => {
      return matchForm.dest.trim() && matchForm.date && matchForm.currentPeople >= 1 && matchForm.budget >= 0;
    });

    function formatMatchDate(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return `${d.getFullYear()}年${d.getMonth()+1}月${d.getDate()}日 ${['日','一','二','三','四','五','六'][d.getDay()]}`;
    }
    function toggleMatchTag(tag) {
      const idx = matchForm.tags.indexOf(tag);
      if (idx > -1) matchForm.tags.splice(idx, 1);
      else matchForm.tags.push(tag);
    }
    function recomputeMatches() {
      const refPlan = myMatchPlan.value || { ...matchForm, tags: [...matchForm.tags] };
      const plans = MatchEngine.loadPlans();
      matchResults.value = MatchEngine.findMatches(refPlan, plans);
    }
    function publishMatchPlan() {
      matchErrors.value = [];
      if (!matchForm.dest.trim()) matchErrors.value.push('请输入目的地');
      if (!matchForm.date) matchErrors.value.push('请选择出发日期');
      if (matchForm.currentPeople < 1) matchErrors.value.push('人数至少为 1');
      if (matchErrors.value.length) return;
      myMatchPlan.value = MatchEngine.publishPlan({
        publisher: '我',
        dest: matchForm.dest.trim(),
        date: matchForm.date,
        currentPeople: matchForm.currentPeople,
        budget: matchForm.budget,
        tags: [...matchForm.tags],
        note: matchForm.note.trim(),
      });
      recomputeMatches();
      showToast('计划发布成功，已为你匹配同路人');
      // 清空表单，但保留已发布计划作为匹配基准
      matchForm.dest = '';
      matchForm.date = '';
      matchForm.currentPeople = 2;
      matchForm.budget = 200;
      matchForm.tags = [];
      matchForm.note = '';
    }
    function resetMatchForm() {
      matchForm.dest = '';
      matchForm.date = '';
      matchForm.currentPeople = 2;
      matchForm.budget = 200;
      matchForm.tags = [];
      matchForm.note = '';
      myMatchPlan.value = null;
      matchErrors.value = [];
      recomputeMatches();
    }
    function joinMatchPlan(plan) {
      showToast(`已向 ${plan.publisher} 发送加入申请，请等待确认`);
    }
    function copyMatchContact(plan) {
      const text = `🤝 同路 AA · 找搭子\n目的地：${plan.dest}\n日期：${formatMatchDate(plan.date)}\n人数：已有 ${plan.currentPeople} 人\n预算：人均 ¥${plan.budget}\n标签：${plan.tags.join('、') || '无'}\n备注：${plan.note || '暂无'}\n\n我也想加入，私聊我～`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast('联系方式文案已复制'));
      } else {
        const ta = document.createElement('textarea'); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand('copy'); document.body.removeChild(ta); showToast('联系方式文案已复制');
      }
    }
    watch(() => [matchForm.dest, matchForm.date, matchForm.currentPeople, matchForm.budget, matchForm.tags.length], () => {
      if (!myMatchPlan.value) recomputeMatches();
    }, { deep: true });

    const peopleOptions = [2, 3, 4, 5, 6, 7, 8, 9];
    const dayOptions = [1, 2, 3, 4, 5, 6, 7];

    // === 历史地点记忆 ===
    const HISTORY_KEY = 'tonglu_history';
    const history = reactive({
      origin: JSON.parse(localStorage.getItem(HISTORY_KEY + '_origin') || '[]'),
      dest: JSON.parse(localStorage.getItem(HISTORY_KEY + '_dest') || '[]'),
    });
    function saveHistory(type) {
      const val = (type === 'origin' ? tripStore.origin : tripStore.dest).trim();
      if (!val) return;
      const list = history[type];
      const idx = list.indexOf(val);
      if (idx > -1) list.splice(idx, 1);
      list.unshift(val);
      if (list.length > 8) list.pop();
      localStorage.setItem(HISTORY_KEY + '_' + type, JSON.stringify(list));
    }

    // === Current Car（支持自定义车型） ===
    const customCars = ref(loadCustomCars());
    const allCarOptions = computed(() => [...CAR_OPTIONS, ...customCars.value]);
    const currentCar = computed(() => {
      const all = allCarOptions.value;
      return all.find(c => c.name === tripStore.carModel) || all[0];
    });

    // === 自定义车型表单 ===
    const customCarModalOpen = ref(false);
    const customCarForm = ref({ name: '', seats: 5, fuel: 8.0, fuelType: '92号汽油', trunk: 300 });
    const customCarErrors = ref({});
    function openCustomCarModal() {
      customCarForm.value = { name: '', seats: 5, fuel: 8.0, fuelType: '92号汽油', trunk: 300 };
      customCarErrors.value = {};
      customCarModalOpen.value = true;
    }
    function closeCustomCarModal() { customCarModalOpen.value = false; }
    function saveCustomCar() {
      const f = customCarForm.value;
      const errs = {};
      if (!f.name || !f.name.trim()) errs.name = '请填写车型名称';
      if (!f.seats || f.seats < 2 || f.seats > 9) errs.seats = '座位数 2-9';
      if (!f.fuel || f.fuel < 3 || f.fuel > 20) errs.fuel = '油耗 3-20 L/100km';
      if (!f.trunk || f.trunk < 50) errs.trunk = '后备箱容积需大于 50L';
      // 座位数校验
      if (f.seats < tripStore.people) errs.seats = `${f.name || '该车'}只有${f.seats}座，无法容纳${tripStore.people}人`;
      if (Object.keys(errs).length > 0) { customCarErrors.value = errs; return; }
      const fuelPrice = CONFIG.FUEL_PRICE[f.fuelType] || 7.8;
      const newCar = {
        name: f.name.trim(),
        series: '自定义',
        type: f.seats >= 7 ? 'MPV' : 'SUV',
        seats: parseInt(f.seats),
        fuel: parseFloat(f.fuel),
        fuelType: f.fuelType,
        costPerKm: parseFloat((parseFloat(f.fuel) * fuelPrice / 100).toFixed(2)),
        trunk: parseInt(f.trunk),
        comfort: 4.0,
        description: '用户自定义车型',
        custom: true,
      };
      customCars.value = [...customCars.value, newCar];
      saveCustomCars(customCars.value);
      tripStore.carModel = newCar.name;
      customCarModalOpen.value = false;
      showToast(`已添加自定义车型：${newCar.name}`);
    }
    function deleteCustomCar(name) {
      customCars.value = customCars.value.filter(c => c.name !== name);
      saveCustomCars(customCars.value);
      if (tripStore.carModel === name) tripStore.carModel = CAR_OPTIONS[0].name;
      showToast(`已删除车型：${name}`);
    }
    function onCarSelectChange(name) {
      if (name === '__custom__') { openCustomCarModal(); return; }
      tripStore.carModel = name;
      onCarChange();
    }

    // === 计算某车型在当前路线下的预算 ===
    function calcBudgetForCar(car) {
      if (!tripStore.routeData) return 0;
      const dist = tripStore.routeData.distanceKm * 2;
      const fuelPrice = CONFIG.FUEL_PRICE[car.fuelType] || 7.8;
      const fuel = dist * car.fuel / 100;
      const oilCost = fuel * fuelPrice;
      const toll = Math.round(dist * CONFIG.TOLL_RATE_PER_KM);
      const ticket = (CONFIG.TICKET_PRICE / 2) * tripStore.people;
      const parking = 20;
      const lunch = CONFIG.MEAL_PRICE * tripStore.people;
      const snack = 20 * tripStore.people;
      const emergency = 25 * tripStore.people;
      return oilCost + toll + ticket + parking + lunch + snack + emergency;
    }

    // === Recommended Car ===
    function carScore(c) {
      let score = 50;
      if (c.seats >= tripStore.people) score += 20; else score -= 30;
      if (c.fuel <= 8) score += 15; else if (c.fuel <= 9) score += 8;
      if (c.costPerKm <= 1.2) score += 10;
      score += (c.comfort - 4) * 10;
      if (c.trunk >= 400) score += 5;
      const totalCost = calcBudgetForCar(c);
      if (totalCost > 0 && totalCost <= tripStore.budgetMax) score += 5;
      return Math.max(0, Math.min(100, Math.round(score)));
    }

    const recommendedCar = computed(() => {
      let best = CAR_OPTIONS[0];
      let bestScore = -1;
      for (const c of CAR_OPTIONS) {
        const s = carScore(c);
        if (s > bestScore) { bestScore = s; best = c; }
      }
      return best;
    });

    // === 路线数据（来自 OSRM API） ===
    const routeInfo = computed(() => {
      if (!tripStore.routeData) return null;
      const r = tripStore.routeData;
      return {
        distanceKm: r.distanceKm,
        durationText: r.durationText,
        distance: r.distanceKm,
        time: r.durationText,
        road: '驾车路线',
        score: 4.5,
      };
    });

    // 备选路线（基于真实距离生成变体）
    const routes = computed(() => {
      if (!tripStore.routeData) return [];
      const base = tripStore.routeData.distanceKm;
      const baseTime = tripStore.routeData.duration;
      return [
        {
          name: '推荐路线（最快）', distance: base, time: tripStore.routeData.durationText,
          toll: Math.round(base * CONFIG.TOLL_RATE_PER_KM), road: '高速优先', score: 4.6,
          tag: '推荐', tagType: 'fast',
          desc: tripStore.aiRouteDesc || `从${tripStore.origin}到${tripStore.dest}，距离约${base}公里，预计${tripStore.routeData.durationText}。`,
        },
        {
          name: '省钱路线', distance: Math.round(base * 1.1), time: Utils.formatDuration(baseTime * 1.15),
          toll: Math.round(base * 1.1 * 0.2), road: '省道优先', score: 4.2,
          tag: '省费', tagType: 'cheap',
          desc: `绕行省道，距离略长但通行费更低，适合预算敏感出行。`,
        },
        {
          name: '风景路线', distance: Math.round(base * 1.05), time: Utils.formatDuration(baseTime * 1.25),
          toll: 0, road: '国道/风景道', score: 4.8,
          tag: '风景好', tagType: 'scenic',
          desc: `选择风景优美的国道行驶，无高速费，但耗时较长。`,
        },
      ];
    });

    const selectedRoute = computed(() => routes.value[tripStore.selectedRouteIndex] || routes.value[0] || { distance: 0, time: '', road: '', score: 0, toll: 0, desc: '' });

    function selectRoute(i) { tripStore.selectedRouteIndex = i; }

    // === 预算计算（基于真实距离） ===
    const budgetItems = computed(() => {
      if (!tripStore.routeData) return [];
      const dist = tripStore.routeData.distanceKm * 2; // 往返
      const car = currentCar.value;
      const fuelPrice = CONFIG.FUEL_PRICE[car.fuelType] || 7.8;
      const fuel = dist * car.fuel / 100;
      const oilCost = fuel * fuelPrice;
      const toll = Math.round(dist * CONFIG.TOLL_RATE_PER_KM);
      const ticket = (CONFIG.TICKET_PRICE / 2) * tripStore.people; // 学生半价
      const parking = 20;
      const lunch = CONFIG.MEAL_PRICE * tripStore.people;
      const snack = 20 * tripStore.people;
      const emergency = 25 * tripStore.people;

      return [
        { icon: '⛽', name: '油费', detail: `往返${dist.toFixed(0)}km × ${car.fuel}L/100km × ¥${fuelPrice}/L`, amount: oilCost, status: '已确认', statusClass: 'tag-green' },
        { icon: '🛣', name: '高速通行费', detail: `往返 × ¥${CONFIG.TOLL_RATE_PER_KM}/km`, amount: toll, status: '预估', statusClass: 'tag-yellow' },
        { icon: '🎫', name: '景区门票', detail: `${tripStore.dest} ×${tripStore.people}人（学生半价）`, amount: ticket, status: '已确认', statusClass: 'tag-green' },
        { icon: '🅿', name: '停车费', detail: '景区停车场（全天）', amount: parking, status: '预估', statusClass: 'tag-yellow' },
        { icon: '🍱', name: '午餐', detail: `人均¥${CONFIG.MEAL_PRICE} ×${tripStore.people}人`, amount: lunch, status: '预估', statusClass: 'tag-yellow' },
        { icon: '🥤', name: '零食饮料', detail: '出发前超市采购', amount: snack, status: '预估', statusClass: 'tag-yellow' },
        { icon: '📋', name: '应急备用', detail: '药品/雨具/意外支出', amount: emergency, status: '建议预留', statusClass: 'tag-red' },
      ];
    });

    const totalBudget = computed(() => budgetItems.value.reduce((s, i) => s + i.amount, 0));
    const perPerson = computed(() => tripStore.people > 0 ? totalBudget.value / tripStore.people : 0);
    const budgetRatio = computed(() => tripStore.budgetMax > 0 ? Math.round(totalBudget.value / tripStore.budgetMax * 100) : 0);
    const budgetRemaining = computed(() => tripStore.budgetMax - totalBudget.value);

    const budgetStatus = computed(() => {
      const ratio = budgetRatio.value;
      if (ratio > 100) return { text: `超支 ¥${Math.abs(budgetRemaining.value).toFixed(2)}`, class: 'tag-red', label: '预算超支' };
      if (ratio >= 80) return { text: `剩余 ¥${budgetRemaining.value.toFixed(2)}`, class: 'tag-yellow', label: '预算紧张' };
      return { text: `剩余 ¥${budgetRemaining.value.toFixed(2)}`, class: 'tag-green', label: '预算安全' };
    });

    // === 实时预算管家（升级版 AA）===
    const expenses = computed(() => expenseStore.items);
    const totalSpent = computed(() => expenses.value.reduce((sum, e) => sum + (Number(e.amount) || 0), 0));
    const poolBalance = computed(() => Math.max(0, tripStore.budgetMax - totalSpent.value));
    const poolClass = computed(() => {
      const ratio = tripStore.budgetMax > 0 ? totalSpent.value / tripStore.budgetMax : 0;
      if (ratio > 0.9) return 'danger';
      if (ratio > 0.7) return 'warn';
      return '';
    });

    const saveTip = computed(() => {
      const budget = tripStore.budgetMax;
      if (budget <= 0) return '';
      const ratio = totalSpent.value / budget;
      if (ratio > 0.9) return '预算即将用完！建议控制后续开支';
      if (ratio > 0.7) return '已用 70% 预算，餐饮建议控制在人均 30 元以内';
      if (ratio > 0.5) return '预算使用过半，目前状态良好';
      return '';
    });
    const saveTipClass = computed(() => {
      const ratio = tripStore.budgetMax > 0 ? totalSpent.value / tripStore.budgetMax : 0;
      if (ratio > 0.9) return 'danger';
      if (ratio > 0.7) return 'warn';
      return 'safe';
    });
    const saveTipIcon = computed(() => {
      const ratio = tripStore.budgetMax > 0 ? totalSpent.value / tripStore.budgetMax : 0;
      if (ratio > 0.9) return '⚠️';
      if (ratio > 0.7) return '💡';
      if (ratio > 0.5) return '✅';
      return '';
    });

    const categoryIcons = { '油费': '⛽', '餐饮': '🍜', '门票': '🎫', '住宿': '🏨', '其他': '🧾' };
    function categoryIcon(cat) { return categoryIcons[cat] || '🧾'; }
    function formatExpenseTime(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return `${d.getMonth() + 1}月${d.getDate()}日 ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    }

    function openExpenseModal() {
      expenseForm.amount = null;
      expenseForm.category = '油费';
      expenseForm.payer = members.value[0]?.name || '张同学';
      expenseForm.receipt = null;
      expenseForm.receiptPreview = null;
      if (receiptInput.value) receiptInput.value.value = '';
      expenseModalOpen.value = true;
    }
    function closeExpenseModal() { expenseModalOpen.value = false; }
    function onReceiptChange(e) {
      const file = e.target.files[0];
      if (!file) { expenseForm.receipt = null; expenseForm.receiptPreview = null; return; }
      expenseForm.receipt = file;
      expenseForm.receiptPreview = URL.createObjectURL(file);
    }
    async function saveExpense() {
      const amount = parseFloat(expenseForm.amount);
      if (!amount || amount <= 0) { showToast('请输入有效金额'); return; }
      let receiptUrl = null;
      if (expenseForm.receipt) {
        try {
          receiptUrl = await new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(expenseForm.receipt);
          });
        } catch (e) { console.error('Receipt read failed', e); }
      }
      const expense = {
        id: Date.now(),
        amount,
        category: expenseForm.category,
        payer: expenseForm.payer,
        time: new Date().toISOString(),
        receipt: receiptUrl,
      };
      expenseStore.add(expense);
      closeExpenseModal();
      showToast('支出已记录');
    }
    function deleteExpense(id) {
      expenseStore.remove(id);
      showToast('支出已删除');
    }
    function viewReceipt(url) {
      if (!url) return;
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener';
      a.click();
    }

    // === Members ===
    const memberNames = ['张同学', '李同学', '王同学', '赵同学', '周同学', '吴同学', '郑同学', '王同学', '刘同学'];
    const members = computed(() => {
      const arr = [];
      for (let i = 0; i < tripStore.people; i++) {
        arr.push({ name: memberNames[i] || `同学${i + 1}`, role: i === 0 ? '司机' : '', amount: perPerson.value, paid: i === 0 });
      }
      return arr;
    });
    const paidCount = computed(() => members.value.filter(m => m.paid).length);
    const paidRatio = computed(() => tripStore.people > 0 ? paidCount.value / tripStore.people * 100 : 0);

    // === Stats ===
    const totalDistance = computed(() => tripStore.routeData ? tripStore.routeData.distanceKm * 2 : 0);
    const totalFuel = computed(() => parseFloat((totalDistance.value * currentCar.value.fuel / 100).toFixed(1)));
    const carbonEmission = computed(() => (totalFuel.value * 2.3).toFixed(1));

    // === 碳足迹对比（自驾 vs 公共交通 vs 高铁） ===
    const carbonComparison = computed(() => {
      if (!tripStore.routeData) return null;
      const dist = totalDistance.value;
      // 自驾：2.3 kg CO2/L 汽油
      const carCO2 = parseFloat(carbonEmission.value);
      // 大巴：0.027 kg CO2/km/人
      const busCO2 = parseFloat((dist * 0.027 * tripStore.people).toFixed(1));
      // 高铁：0.004 kg CO2/km/人
      const trainCO2 = parseFloat((dist * 0.004 * tripStore.people).toFixed(1));
      // 人均自驾碳排放
      const carPerPerson = parseFloat((carCO2 / tripStore.people).toFixed(1));
      const busPerPerson = parseFloat((busCO2 / tripStore.people).toFixed(1));
      const trainPerPerson = parseFloat((trainCO2 / tripStore.people).toFixed(1));
      // 节省比例（如果选高铁）
      const saving = carCO2 > 0 ? Math.round((1 - trainCO2 / carCO2) * 100) : 0;
      // 等效树木（一棵树年吸收约 18 kg CO2）
      const trees = parseFloat((carCO2 / 18).toFixed(1));
      return { carCO2, busCO2, trainCO2, carPerPerson, busPerPerson, trainPerPerson, saving, trees };
    });

    // === Canvas 支出饼图 ===
    const chartCanvasRef = ref(null);
    function drawExpenseChart() {
      const canvas = chartCanvasRef.value;
      if (!canvas || !budgetItems.value.length) return;
      const ctx = canvas.getContext('2d');
      const dpr = window.devicePixelRatio || 1;
      const size = 180;
      canvas.width = size * dpr;
      canvas.height = size * dpr;
      canvas.style.width = size + 'px';
      canvas.style.height = size + 'px';
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, size, size);

      const cx = size / 2, cy = size / 2, r = size / 2 - 10;
      const total = totalBudget.value;
      if (total <= 0) return;

      const colors = ['#c53d43', '#5b8c5a', '#d4a843', '#c23b22', '#6b5b95', '#00ced1', '#ff6b6b'];
      let startAngle = -Math.PI / 2;

      budgetItems.value.forEach((item, i) => {
        const angle = (item.amount / total) * Math.PI * 2;
        ctx.beginPath();
        ctx.arc(cx, cy, r, startAngle, startAngle + angle);
        ctx.lineTo(cx, cy);
        ctx.closePath();
        ctx.fillStyle = colors[i % colors.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();
        startAngle += angle;
      });

      // 中心圆（甜甜圈效果）
      ctx.beginPath();
      ctx.arc(cx, cy, r * 0.55, 0, Math.PI * 2);
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--bg2').trim() || '#fff';
      ctx.fill();

      // 中心文字
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#1a1a2e';
      ctx.font = 'bold 16px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('¥' + Math.round(total), cx, cy - 6);
      ctx.font = '10px sans-serif';
      ctx.fillStyle = getComputedStyle(document.documentElement).getPropertyValue('--muted').trim() || '#8e8e93';
      ctx.fillText('人均 ¥' + Math.round(perPerson.value), cx, cy + 10);
    }

    // === 旅行人格测试 ===
    const personalityQuestions = [
      { q: '出游时你最在意什么？', options: [
        { text: '💰 花费越少越好', type: 'saver', icon: '💰' },
        { text: '📸 拍照打卡出片', type: 'photographer', icon: '📸' },
        { text: '🍜 吃遍当地美食', type: 'foodie', icon: '🍜' },
        { text: '🏔 探索小众路线', type: 'explorer', icon: '🏔' },
      ]},
      { q: '你的出行节奏是？', options: [
        { text: '⚡ 紧凑高效，一天刷完', type: 'planner', icon: '⚡' },
        { text: '😴 睡到自然醒，随性走', type: 'chiller', icon: '😴' },
        { text: '🗺 提前规划每一步', type: 'planner', icon: '🗺' },
        { text: '🎲 走哪算哪，惊喜最重要', type: 'explorer', icon: '🎲' },
      ]},
      { q: '和搭子意见不合时？', options: [
        { text: '🤝 少数服从多数', type: 'planner', icon: '🤝' },
        { text: '💬 讨论到达成共识', type: 'planner', icon: '💬' },
        { text: '🙋 我说了算', type: 'explorer', icon: '🙋' },
        { text: '🤷 无所谓都行', type: 'chiller', icon: '🤷' },
      ]},
      { q: '你的行李箱里一定有？', options: [
        { text: '📷 相机/自拍杆', type: 'photographer', icon: '📷' },
        { text: '🍪 零食干粮', type: 'foodie', icon: '🍪' },
        { text: '💊 药品/充电宝', type: 'planner', icon: '💊' },
        { text: '🎒 一个背包就够了', type: 'explorer', icon: '🎒' },
      ]},
    ];
    const personalityTypes = {
      saver: { name: '精打细算家', icon: '💰', desc: '你是团队里的财务总监，每一分钱都花在刀刃上。AA 分账你最在行！', color: 'var(--accent2)' },
      photographer: { name: '出片达人', icon: '📸', desc: '没有照片等于没去过！你的朋友圈永远是旅行大片现场。', color: 'var(--accent5)' },
      foodie: { name: '美食猎人', icon: '🍜', desc: '旅行的意义就是吃！当地特色一个都不能少，人均预算你最高。', color: 'var(--accent3)' },
      explorer: { name: '野路探险家', icon: '🏔', desc: '大众景点太无聊，你专挑小众路线。搭子跟着你永远有惊喜！', color: 'var(--accent)' },
      planner: { name: '靠谱组织者', icon: '🗺', desc: '行程表、时间线、备用方案你全包了。有你在，团队心里踏实！', color: 'var(--accent4)' },
      chiller: { name: '佛系旅行者', icon: '😴', desc: '计划赶不上变化，不如随遇而安。你是团队里的减压担当！', color: 'var(--accent5)' },
    };
    const personalityAnswers = ref([]);
    const personalityResult = ref(null);
    function selectPersonalityAnswer(qIndex, option) {
      personalityAnswers.value[qIndex] = option.type;
      if (personalityAnswers.value.filter(Boolean).length === personalityQuestions.length) {
        calcPersonality();
      }
    }
    function calcPersonality() {
      const counts = {};
      personalityAnswers.value.forEach(t => { counts[t] = (counts[t] || 0) + 1; });
      let maxType = 'explorer', maxCount = 0;
      for (const [t, c] of Object.entries(counts)) {
        if (c > maxCount) { maxCount = c; maxType = t; }
      }
      personalityResult.value = personalityTypes[maxType];
    }
    function resetPersonalityTest() {
      personalityAnswers.value = [];
      personalityResult.value = null;
    }

    // === 沿途 POI 标注（基于路线几何坐标） ===
    const routePOIs = computed(() => {
      if (!tripStore.routeData || !tripStore.originCoords || !tripStore.destCoords) return [];

      const geometry = tripStore.routeData.geometry;
      if (geometry && geometry.coordinates && geometry.coordinates.length > 5) {
        // 从实际路线坐标中按比例选取 POI 位置
        const coords = geometry.coordinates;
        const total = coords.length;
        const pois = [
          { name: '加油站', icon: '⛽', type: 'fuel', ratio: 0.15 },
          { name: '服务区餐厅', icon: '🍽', type: 'food', ratio: 0.35 },
          { name: '沿途观景台', icon: '🏔', type: 'view', ratio: 0.55 },
          { name: '便利店', icon: '🏪', type: 'shop', ratio: 0.25 },
          { name: '洗手间', icon: '🚻', type: 'restroom', ratio: 0.75 },
        ];
        return pois.map(poi => {
          const idx = Math.min(Math.floor(total * poi.ratio), total - 1);
          const [lon, lat] = coords[idx];
          // 加一个很小的偏移（约 50-100 米），让 POI 不完全重叠在路线上
          return {
            ...poi,
            lat: lat + (Math.random() - 0.5) * 0.001,
            lon: lon + (Math.random() - 0.5) * 0.001,
          };
        });
      }

      // fallback：没有路线几何数据时，用原来的中点偏移逻辑
      const o = tripStore.originCoords;
      const d = tripStore.destCoords;
      const midLat = (o.lat + d.lat) / 2;
      const midLon = (o.lon + d.lon) / 2;
      const latRange = Math.abs(d.lat - o.lat);
      const lonRange = Math.abs(d.lon - o.lon);
      return [
        { name: '加油站', icon: '⛽', lat: midLat + latRange * 0.1, lon: midLon - lonRange * 0.05, type: 'fuel' },
        { name: '服务区餐厅', icon: '🍽', lat: midLat - latRange * 0.05, lon: midLon + lonRange * 0.08, type: 'food' },
        { name: '沿途观景台', icon: '🏔', lat: midLat + latRange * 0.15, lon: midLon + lonRange * 0.12, type: 'view' },
        { name: '便利店', icon: '🏪', lat: o.lat + (d.lat - o.lat) * 0.25, lon: o.lon + (d.lon - o.lon) * 0.25, type: 'shop' },
        { name: '洗手间', icon: '🚻', lat: o.lat + (d.lat - o.lat) * 0.6, lon: o.lon + (d.lon - o.lon) * 0.6, type: 'restroom' },
      ];
    });

    // === 天气3天预报弹窗 ===
    const weatherForecastOpen = ref(false);
    const weatherForecast = computed(() => {
      if (!tripStore.weatherData || !tripStore.weatherData.daily) return [];
      return tripStore.weatherData.daily.slice(0, 3);
    });
    function openWeatherForecast() { weatherForecastOpen.value = true; }
    function closeWeatherForecast() { weatherForecastOpen.value = false; }
    function formatWeatherDate(dateStr) {
      if (!dateStr) return '';
      const d = new Date(dateStr);
      const week = ['日', '一', '二', '三', '四', '五', '六'][d.getDay()];
      return `${d.getMonth() + 1}月${d.getDate()}日 周${week}`;
    }

    // === 完整攻略弹窗 + 重新生成 ===
    function openGuideModal() { guideModalOpen.value = true; }
    function closeGuideModal() { guideModalOpen.value = false; }
    async function regenerateGuide() {
      if (!tripStore.routeData || !tripStore.weatherData) { showToast('请先生成出行方案'); return; }
      guideLoading.value = true;
      guideError.value = '';
      try {
        const weatherToday = tripStore.weatherData.daily[0];
        const budgetSummary = {
          total: totalBudget.value,
          perPerson: perPerson.value,
          oil: budgetItems.value.find(i => i.name === '油费')?.amount || 0,
          toll: budgetItems.value.find(i => i.name === '高速通行费')?.amount || 0,
        };
        const guide = await API.generateGuide(
          tripStore.origin, tripStore.dest, tripStore.routeData, weatherToday,
          tripStore.people, tripStore.carModel, tripStore.days, budgetSummary
        );
        // 字段校验
        const localGuide = API._localGuide(tripStore.origin, tripStore.dest, tripStore.routeData, weatherToday, tripStore.people, tripStore.carModel, tripStore.days, budgetSummary);
        ['routeOverview', 'howToPlay', 'howToEat', 'howToSave', 'notices'].forEach(f => {
          if (!guide[f] || !String(guide[f]).trim()) guide[f] = localGuide[f];
        });
        tripStore.aiGuide = guide;
        dataSources.aiGuide = guide.source;
        updateTimes.ai = Date.now();
        if (guide.source === 'local-template') {
          guideError.value = 'AI 调用失败，已使用本地模板';
        }
        showToast(guide.source === 'ai-mimo' ? '攻略已重新生成' : 'AI 不可用，使用本地模板');
      } catch (err) {
        guideError.value = err.message;
        showToast('重新生成失败：' + err.message);
      } finally {
        guideLoading.value = false;
      }
    }

    // === 地图重试 ===
    function retryMapLoad() {
      mapStatus.value = 'loading';
      mapErrorMsg.value = '';
      MapController.destroyRouteMap();
      nextTick(() => { setTimeout(() => renderRouteMap(), 200); });
    }
    // 兼容旧引用
    const retryMap = retryMapLoad;

    // === 查看完整方案 ===
    function viewFullPlan() {
      switchTab('map');
    }

    // === AI 自由问答（增强版：支持对话历史） ===
    async function askAI() {
      if (!aiQuestion.value.trim()) { showToast('请输入问题'); return; }
      const question = aiQuestion.value.trim();

      // 将用户问题加入历史
      aiChatHistory.value.push({
        role: 'user',
        text: question,
        time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
      });

      aiAnswerLoading.value = true;
      aiQuestion.value = ''; // 清空输入框

      try {
        const weatherToday = tripStore.weatherData?.daily?.[0];
        const result = await API.askAI(question, {
          origin: tripStore.origin,
          dest: tripStore.dest,
          distance: tripStore.routeData?.distanceKm,
          weather: weatherToday ? `${weatherToday.desc} ${weatherToday.tempMin}°~${weatherToday.tempMax}°C` : '',
          people: tripStore.people,
        });

        // 将 AI 回答加入历史
        aiChatHistory.value.push({
          role: 'ai',
          text: result.text,
          source: result.source,
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        });

        // 兼容旧逻辑
        aiAnswer.value = result.text;
        aiAnswerSource.value = result.source;
      } catch (err) {
        aiChatHistory.value.push({
          role: 'ai',
          text: 'AI 助手暂时不可用：' + err.message,
          source: 'local-template',
          time: new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' }),
        });
        aiAnswer.value = 'AI 助手暂时不可用：' + err.message;
        aiAnswerSource.value = 'local-template';
      } finally {
        aiAnswerLoading.value = false;
        // 自动滚动到底部
        await nextTick();
        const historyEl = document.querySelector('.ai-chat-history');
        if (historyEl) historyEl.scrollTop = historyEl.scrollHeight;
      }
    }

    // 推荐问题点击
    function askSuggestedQuestion(q) {
      aiQuestion.value = q;
      askAI();
    }

    // === Canvas 分享卡片绘制 ===
    function drawShareCard() {
      const canvas = shareCanvasRef.value;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      const W = 360, H = 540;
      canvas.width = W * 2;
      canvas.height = H * 2;
      canvas.style.width = W + 'px';
      canvas.style.height = H + 'px';
      ctx.scale(2, 2);
      // 背景渐变（中国传统色）
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, '#fffef8');
      grad.addColorStop(0.5, '#f5efe4');
      grad.addColorStop(1, '#ede4d3');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);
      // 祥云装饰
      ctx.strokeStyle = 'rgba(197,61,67,0.06)';
      ctx.lineWidth = 1.5;
      for (let i = 0; i < 6; i++) {
        const x = 20 + i * 60, y = 30 + (i % 2) * 20;
        ctx.beginPath();
        ctx.arc(x, y, 12, 0, Math.PI * 2);
        ctx.arc(x + 16, y, 8, 0, Math.PI * 2);
        ctx.stroke();
      }
      // 顶部品牌
      ctx.fillStyle = '#c53d43';
      ctx.font = 'bold 22px "STKaiti","KaiTi","楷体",serif';
      ctx.textAlign = 'center';
      ctx.fillText('同路 AA', W / 2, 50);
      ctx.fillStyle = '#8b7355';
      ctx.font = '12px sans-serif';
      ctx.fillText('出游计划', W / 2, 70);
      // 分隔线
      ctx.strokeStyle = '#d4c5a9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, 85);
      ctx.lineTo(W - 40, 85);
      ctx.stroke();
      // 路线图示
      const routeY = 140;
      ctx.fillStyle = '#c53d43';
      ctx.beginPath();
      ctx.arc(70, routeY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#5b8c5a';
      ctx.beginPath();
      ctx.arc(W - 70, routeY, 6, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#d4a843';
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 3]);
      ctx.beginPath();
      ctx.moveTo(76, routeY);
      ctx.lineTo(W - 76, routeY);
      ctx.stroke();
      ctx.setLineDash([]);
      // 路线文字
      ctx.fillStyle = '#3a3a3a';
      ctx.font = 'bold 14px sans-serif';
      ctx.textAlign = 'left';
      const originShort = (tripStore.origin || '').substring(0, 8);
      const destShort = (tripStore.dest || '').substring(0, 8);
      ctx.fillText(originShort, 30, routeY + 25);
      ctx.textAlign = 'right';
      ctx.fillText(destShort, W - 30, routeY + 25);
      // 距离标注
      if (tripStore.routeData) {
        ctx.fillStyle = '#8b7355';
        ctx.font = '11px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${selectedRoute.value.distance}km · ${selectedRoute.value.time}`, W / 2, routeY - 12);
      }
      // 信息区域
      const infoY = 210;
      const rows = [
        { label: '📅 日期', val: tripDate.value },
        { label: '👥 人数', val: `${tripStore.people} 人` },
        { label: '🚗 车型', val: tripStore.carModel },
        { label: '💰 人均', val: `¥${perPerson.value.toFixed(0)} AA`, highlight: true },
      ];
      rows.forEach((r, i) => {
        const y = infoY + i * 38;
        ctx.fillStyle = '#8b7355';
        ctx.font = '13px sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(r.label, 50, y);
        ctx.fillStyle = r.highlight ? '#c53d43' : '#3a3a3a';
        ctx.font = r.highlight ? 'bold 16px sans-serif' : '14px sans-serif';
        ctx.textAlign = 'right';
        ctx.fillText(r.val, W - 50, y);
      });
      // 底部分隔
      ctx.strokeStyle = '#d4c5a9';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(40, H - 100);
      ctx.lineTo(W - 40, H - 100);
      ctx.stroke();
      // 二维码区域
      const qrSize = 70;
      const qrX = W / 2 - qrSize / 2;
      const qrY = H - 90;
      ctx.fillStyle = '#fff';
      ctx.fillRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
      ctx.strokeStyle = '#d4c5a9';
      ctx.strokeRect(qrX - 4, qrY - 4, qrSize + 8, qrSize + 8);
      // 复制已有二维码
      const qrCanvas = qrCanvasRef.value;
      if (qrCanvas) {
        ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);
      } else {
        ctx.fillStyle = '#f5efe4';
        ctx.fillRect(qrX, qrY, qrSize, qrSize);
        ctx.fillStyle = '#8b7355';
        ctx.font = '10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('二维码', W / 2, qrY + qrSize / 2);
      }
      // 底部文字
      ctx.fillStyle = '#c53d43';
      ctx.font = 'bold 13px "STKaiti","KaiTi","楷体",serif';
      ctx.textAlign = 'center';
      ctx.fillText('扫码查看完整方案', W / 2, H - 12);
    }

    function saveShareImage() {
      drawShareCard();
      const canvas = shareCanvasRef.value;
      if (!canvas) return;
      const link = document.createElement('a');
      link.download = `同路AA_${tripStore.dest}_${Date.now()}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
      showToast('行程海报已保存');
    }

    // === 离线检测 ===
    const isOnline = ref(navigator.onLine);
    window.addEventListener('online', () => { isOnline.value = true; });
    window.addEventListener('offline', () => { isOnline.value = false; });

    // === Timeline（动态多日生成） ===
    const timeline = computed(() => {
      if (!tripStore.routeData) return [];
      const r = tripStore.routeData;
      const hours = r.duration / 3600;
      const days = tripStore.days || 1;
      const origin = tripStore.origin;
      const dest = tripStore.dest;
      const distKm = r.distanceKm;
      const durText = r.durationText;

      // 辅助：根据出发时间和车程小时数计算到达时间
      function calcTime(startHour, startMin, addHours) {
        const totalMin = startHour * 60 + startMin + Math.round(addHours * 60);
        const h = Math.floor(totalMin / 60) % 24;
        const m = totalMin % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }

      function timeRange(startHour, startMin, addHours) {
        const start = calcTime(startHour, startMin, 0);
        const end = calcTime(startHour, startMin, addHours);
        return `${start} — ${end}`;
      }

      const result = [];

      if (days === 1) {
        // === 一日往返 ===
        const arriveTime = calcTime(7, 0, hours);
        result.push({ day: 1, dayLabel: '第 1 天', time: '06:30 — 07:00', title: '集合 & 出发前检查', desc: `${origin}集合，检查车辆油量、胎压，确认物品清单。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: `07:00 — ${arriveTime}`, title: '驾车前往目的地', desc: `驾车前往${dest}，约${distKm}km，预计${durText}。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: `${arriveTime} — 12:00`, title: '上午游览', desc: `抵达${dest}，购票入园开始游览。注意体力分配。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: '12:00 — 13:00', title: '午餐休整', desc: `人均¥${CONFIG.MEAL_PRICE}用餐，也可自带食物野餐。`, done: false });
        result.push({ day: 1, dayLabel: '第 1 天', time: '13:00 — 15:30', title: '下午游览', desc: '继续游览，适合拍照打卡、集体合影。', done: false });
        result.push({ day: 1, dayLabel: '第 1 天', time: '15:30 — 16:00', title: '返程准备', desc: '景区门口集合，清点人数，补充饮水，检查车辆。', done: false });
        const returnArrive = calcTime(16, 0, hours);
        result.push({ day: 1, dayLabel: '第 1 天', time: `16:00 — ${returnArrive}`, title: '驾车返回', desc: `原路返回${origin}，注意疲劳驾驶，建议途中轮换司机。`, done: false });
        result.push({ day: 1, dayLabel: '第 1 天', time: `${returnArrive} — ${calcTime(16, 0, hours + 0.5)}`, title: '到达 & AA 结算', desc: '安全抵达，通过"同路 AA"一键生成账单，群里确认分账。', done: false });
      } else if (days === 2) {
        // === 两日游 ===
        const d1Arrive = calcTime(8, 0, hours);
        result.push({ day: 1, dayLabel: '第 1 天', time: '07:30 — 08:00', title: '集合 & 出发', desc: `${origin}集合，检查车辆，确认行李和物品清单。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: `08:00 — ${d1Arrive}`, title: '驾车前往目的地', desc: `驾车前往${dest}，约${distKm}km，预计${durText}。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: `${d1Arrive} — 13:00`, title: '抵达 & 午餐', desc: `抵达${dest}，办理入住/放行李，就近午餐。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: '13:00 — 17:30', title: '下午核心景点', desc: '游览${dest}核心景区，合理安排路线避免走回头路。'.replace('${dest}', dest), done: false });
        result.push({ day: 1, dayLabel: '第 1 天', time: '18:00 — 20:00', title: '晚餐 & 入住', desc: '当地特色晚餐，入住休息，交流当日感受。', done: false });
        // Day 2
        const d2ReturnArrive = calcTime(14, 0, hours);
        result.push({ day: 2, dayLabel: '第 2 天', time: '08:00 — 09:00', title: '早餐 & 退房', desc: '酒店早餐，整理行李退房，检查物品无遗漏。', done: false });
        result.push({ day: 2, dayLabel: '第 2 天', time: '09:00 — 12:00', title: '上午补充游览', desc: '游览昨日未到的景点，或体验当地特色项目。', done: false });
        result.push({ day: 2, dayLabel: '第 2 天', time: '12:00 — 13:30', title: '午餐 & 返程准备', desc: '午餐休整，清点人数和行李，检查车辆。', done: false });
        result.push({ day: 2, dayLabel: '第 2 天', time: `14:00 — ${d2ReturnArrive}`, title: '驾车返回', desc: `驾车返回${origin}，约${distKm}km，注意疲劳驾驶。`, done: false });
        result.push({ day: 2, dayLabel: '第 2 天', time: `${d2ReturnArrive} — ${calcTime(14, 0, hours + 0.5)}`, title: '到达 & AA 结算', desc: '安全抵达，通过"同路 AA"一键生成账单，群里确认分账。', done: false });
      } else {
        // === 三天及以上 ===
        // Day 1: 出发、抵达、入住、初步游览
        const d1Arrive = calcTime(9, 0, hours);
        result.push({ day: 1, dayLabel: '第 1 天', time: '08:30 — 09:00', title: '集合 & 出发', desc: `${origin}集合，检查车辆，确认行李和物品清单。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: `09:00 — ${d1Arrive}`, title: '驾车前往目的地', desc: `驾车前往${dest}，约${distKm}km，预计${durText}。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: `${d1Arrive} — 13:00`, title: '抵达 & 午餐', desc: `抵达${dest}，办理入住，就近午餐。`, done: true });
        result.push({ day: 1, dayLabel: '第 1 天', time: '14:00 — 17:30', title: '初步游览', desc: `抵达后轻松游览${dest}周边景点，适应环境。`, done: false });
        result.push({ day: 1, dayLabel: '第 1 天', time: '18:00 — 20:00', title: '晚餐 & 入住', desc: '当地特色晚餐，入住休息。', done: false });

        // 中间天：深度游览、自由活动
        for (let d = 2; d < days; d++) {
          result.push({ day: d, dayLabel: `第 ${d} 天`, time: '08:00 — 09:00', title: '早餐', desc: '酒店早餐，规划当日游览路线。', done: false });
          result.push({ day: d, dayLabel: `第 ${d} 天`, time: '09:00 — 12:00', title: '深度游览', desc: `深入游览${dest}核心景区，体验特色项目。`, done: false });
          result.push({ day: d, dayLabel: `第 ${d} 天`, time: '12:00 — 13:30', title: '午餐休整', desc: `人均¥${CONFIG.MEAL_PRICE}用餐，适当休息。`, done: false });
          result.push({ day: d, dayLabel: `第 ${d} 天`, time: '14:00 — 17:30', title: '自由活动', desc: '自由活动或备用计划：购物、拍照、体验当地文化。', done: false });
          result.push({ day: d, dayLabel: `第 ${d} 天`, time: '18:00 — 20:00', title: '晚餐 & 交流', desc: '晚餐后交流当日感受，确认次日计划。', done: false });
        }

        // 最后一天：返程
        const lastDay = days;
        const lastReturnArrive = calcTime(14, 0, hours);
        result.push({ day: lastDay, dayLabel: `第 ${lastDay} 天`, time: '08:00 — 09:30', title: '早餐 & 退房', desc: '酒店早餐，整理行李退房，检查物品无遗漏。', done: false });
        result.push({ day: lastDay, dayLabel: `第 ${lastDay} 天`, time: '09:30 — 12:00', title: '最后游览 & 纪念品', desc: '最后逛逛，购买当地特产纪念品。', done: false });
        result.push({ day: lastDay, dayLabel: `第 ${lastDay} 天`, time: '12:00 — 13:30', title: '午餐 & 返程准备', desc: '午餐休整，清点人数和行李，检查车辆。', done: false });
        result.push({ day: lastDay, dayLabel: `第 ${lastDay} 天`, time: `14:00 — ${lastReturnArrive}`, title: '驾车返回', desc: `驾车返回${origin}，约${distKm}km，注意疲劳驾驶。`, done: false });
        result.push({ day: lastDay, dayLabel: `第 ${lastDay} 天`, time: `${lastReturnArrive} — ${calcTime(14, 0, hours + 0.5)}`, title: '到达 & AA 结算', desc: '安全抵达，通过"同路 AA"一键生成账单，群里确认分账。', done: false });
      }

      return result;
    });

    // 时间线按天分组
    const timelineGroups = computed(() => {
      const groups = [];
      let currentDay = -1;
      for (const item of timeline.value) {
        if (item.day !== currentDay) {
          currentDay = item.day;
          groups.push({ day: item.day, label: item.dayLabel, items: [] });
        }
        groups[groups.length - 1].items.push(item);
      }
      return groups;
    });

    // === 实时位置共享逻辑（地图操作委托给 MapController） ===

    function initLocationMap() {
      MapController.initLocationMap('locationMap');
      if (tripStore.routeData) {
        MapController.drawPlannedRouteOnLocMap(tripStore.routeData);
      }
    }

    function updateMemberMarker(memberId, lat, lon) {
      const m = locationMembers.value.find(x => x.id === memberId);
      if (!m) return;
      m.lat = lat;
      m.lon = lon;
      m.timestamp = Date.now();
      MapController.updateMemberMarker(m, lat, lon);
      MapController.updateMemberPopup(m);
      if (memberId === 'current_user') {
        MapController.panToLocation(lat, lon);
      }
    }

    function calculateDistanceToRoute(lat, lon, routeGeoJson) {
      return MapController.distanceToRoute(lat, lon, routeGeoJson);
    }

    function checkRouteDeviation(lat, lon) {
      const deviation = calculateDistanceToRoute(lat, lon, tripStore.routeData?.geometry);
      const m = locationMembers.value.find(x => x.id === 'current_user');
      if (deviation > DEVIATION_THRESHOLD_M) {
        if (m) m.status = 'deviation';
        sendAlert('⚠️ 安全提醒：你偏离预定路线超过 5km，请确认安全');
      } else {
        if (m && m.status === 'deviation') m.status = 'normal';
      }
      return deviation;
    }

    function broadcastLocation(payload) {
      // 实际项目中这里应通过 WebSocket 发送；当前用 localStorage 模拟多窗口/成员通信
      try {
        const msg = { ...payload, sender: 'current_user', name: '我', color: '#c53d43', battery: 87 };
        const queue = JSON.parse(localStorage.getItem('tonglu_location') || '[]');
        queue.push(msg);
        if (queue.length > 50) queue.shift();
        localStorage.setItem('tonglu_location', JSON.stringify(queue));
      } catch (e) { /* ignore */ }
    }

    function sendAlert(text) {
      showToast(text, 'warn');
    }

    function updateSafetyStatus() {
      let hasSos = false;
      let hasDeviation = false;
      locationMembers.value.forEach(m => {
        if (m.status === 'sos') hasSos = true;
        else if (m.status === 'deviation') hasDeviation = true;
      });
      if (hasSos) {
        showToast('🚨 有成员发起 SOS 求助，请立即确认', 'error');
      } else if (hasDeviation) {
        showToast('⚠️ 有成员偏离预定路线超过 5km', 'warn');
      }
    }

    let positionRetryCount = 0;

    function startLocationSharing() {
      if (!navigator.geolocation) {
        showToast('您的浏览器不支持位置共享');
        return;
      }

      // file:// 协议下 geolocation 被禁用
      if (location.protocol === 'file:') {
        showToast('⚠️ 位置共享需要通过 localhost 访问（运行 start.bat）', 'warn');
        locationMapVisible.value = true;
        nextTick(() => {
          initLocationMap();
          MapController.invalidateLocationSize();
          startMockMembers();
        });
        locationSharing.value = true;
        updateSafetyStatus();
        return;
      }

      locationMapVisible.value = true;
      nextTick(() => {
        initLocationMap();
        MapController.invalidateLocationSize();
      });

      // 带降级的定位：先尝试高精度，失败后自动降级低精度
      tryGetPosition(true);

      // 每 30 秒更新
      shareIntervalId = setInterval(() => {
        tryGetPosition(false);
      }, LOCATION_UPDATE_MS);

      startMockMembers();
      locationSharing.value = true;
      updateSafetyStatus();
    }

    function tryGetPosition(isFirstAttempt) {
      const highAccuracyOpts = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 30000,
      };
      const lowAccuracyOpts = {
        enableHighAccuracy: false,
        timeout: 15000,
        maximumAge: 60000,
      };

      navigator.geolocation.getCurrentPosition(
        (pos) => {
          positionRetryCount = 0;
          onPosition(pos);
        },
        (err) => {
          if (isFirstAttempt && positionRetryCount < 2) {
            positionRetryCount++;
            console.warn('[Location] 高精度定位失败，降级到低精度:', err.message);
            showToast('高精度定位失败，正在尝试网络定位...');
            navigator.geolocation.getCurrentPosition(
              onPosition,
              (err2) => {
                console.error('[Location] 低精度定位也失败:', err2.message);
                handleLocationFailure(err2);
              },
              lowAccuracyOpts
            );
          } else {
            handleLocationFailure(err);
          }
        },
        isFirstAttempt ? highAccuracyOpts : lowAccuracyOpts
      );
    }

    function handleLocationFailure(err) {
      let hint = '';
      switch (err.code) {
        case 1: hint = '请在浏览器设置中允许位置权限'; break;
        case 2: hint = '无法获取位置，正在使用模拟位置'; break;
        case 3: hint = '定位超时，正在使用模拟位置'; break;
        default: hint = '正在使用模拟位置';
      }
      showToast('📍 ' + hint);

      // 使用路线上的某个点作为模拟位置
      if (tripStore.routeData?.geometry?.coordinates) {
        const coords = tripStore.routeData.geometry.coordinates;
        const idx = Math.floor(coords.length * 0.3);
        const [lon, lat] = coords[idx];
        onPosition({ coords: { latitude: lat, longitude: lon } });
      }
    }

    function onPosition(pos) {
      const { latitude, longitude } = pos.coords;
      checkRouteDeviation(latitude, longitude);
      broadcastLocation({ lat: latitude, lon: longitude, timestamp: Date.now() });
      nextTick(() => updateMemberMarker('current_user', latitude, longitude));
    }

    function onGeoError(err) {
      console.warn('[Location] Geolocation error:', err.code, err.message);
      // 由 handleLocationFailure 统一处理
    }

    function stopLocationSharing() {
      if (shareIntervalId) { clearInterval(shareIntervalId); shareIntervalId = null; }
      if (mockIntervalId) { clearInterval(mockIntervalId); mockIntervalId = null; }
      locationSharing.value = false;
      locationMapVisible.value = false;
      showToast('已停止位置共享');
    }

    function toggleLocationSharing() {
      if (locationSharing.value) stopLocationSharing();
      else startLocationSharing();
    }

    // 模拟其他成员沿路线附近移动
    function startMockMembers() {
      if (!tripStore.routeData?.geometry) return;
      const coords = tripStore.routeData.geometry.coordinates;
      const offsets = [
        { id: 'm1', idx: 0.25, side: 0.002 },
        { id: 'm2', idx: 0.55, side: -0.003 },
        { id: 'm3', idx: 0.80, side: 0.0015 },
      ];
      offsets.forEach(o => {
        const idx = Math.min(Math.floor(coords.length * o.idx), coords.length - 1);
        const [lon, lat] = coords[idx];
        updateMemberMarker(o.id, lat + o.side, lon + o.side);
      });

      mockIntervalId = setInterval(() => {
        if (!tripStore.routeData?.geometry) return;
        const routeCoords = tripStore.routeData.geometry.coordinates;
        locationMembers.value.forEach(m => {
          if (m.id === 'current_user') return;
          if (m.lat == null || m.lon == null) return;
          // 小随机游动
          const dLat = (Math.random() - 0.5) * 0.004;
          const dLon = (Math.random() - 0.5) * 0.004;
          const newLat = m.lat + dLat;
          const newLon = m.lon + dLon;
          const dist = calculateDistanceToRoute(newLat, newLon, tripStore.routeData.geometry);
          m.status = dist > DEVIATION_THRESHOLD_M ? 'deviation' : 'normal';
          // 模拟李同学偶尔低电量，但这里只做位置变化
          updateMemberMarker(m.id, newLat, newLon);
        });
        updateSafetyStatus();
      }, 8000);
    }

    function confirmSOS() {
      sosConfirmShow.value = true;
    }

    function sendSOS() {
      sosConfirmShow.value = false;

      // file:// 协议下无法获取真实位置
      if (location.protocol === 'file:') {
        const m = locationMembers.value.find(x => x.id === 'current_user');
        if (m) {
          m.status = 'sos';
          m.timestamp = Date.now();
        }
        updateSafetyStatus();
        showToast('🚨 [演示模式] SOS 已模拟发送', 'error');
        return;
      }

      // 正常模式：获取真实位置
      navigator.geolocation.getCurrentPosition(pos => {
        const { latitude, longitude } = pos.coords;
        const m = locationMembers.value.find(x => x.id === 'current_user');
        if (m) {
          m.status = 'sos';
          m.lat = latitude;
          m.lon = longitude;
          m.timestamp = Date.now();
        }
        updateMemberMarker('current_user', latitude, longitude);
        updateSafetyStatus();
        showToast('🚨 SOS 已发送', 'error');
      }, (err) => {
        console.error('[SOS] 获取位置失败:', err.message);
        const m = locationMembers.value.find(x => x.id === 'current_user');
        if (m) m.status = 'sos';
        updateSafetyStatus();
        showToast('🚨 SOS 已发送（位置获取失败，使用模拟位置）', 'error');
      }, { enableHighAccuracy: true, timeout: 8000 });
    }

    function sendEmergencyAlert(message) {
      showToast('🚨 [演示模式] SOS 已模拟发送', 'error');
      console.log('[SOS Demo]', message);
    }

    // === Checklist ===
    const checklist = computed(() => checklistStore.items);
    const checkedCount = computed(() => checklist.value.filter(i => i.checked).length);
    const checkProgress = computed(() => checklist.value.length > 0 ? checkedCount.value / checklist.value.length * 100 : 0);

    function toggleCheck(i) { checklistStore.toggle(i); }
    function checkAll() { checklistStore.checkAll(); }
    function uncheckAll() { checklistStore.uncheckAll(); }
    function addItem() {
      if (!newItem.value.trim()) return;
      checklistStore.add(newItem.value);
      newItem.value = '';
      showToast('已添加物品');
    }
    function removeItem(i) { checklistStore.remove(i); showToast('已删除物品'); }

    // === Polls ===
    const polls = computed(() => pollStore.polls);
    function vote(pi, oi) { pollStore.vote(pi, oi); showToast('投票已记录'); }
    function optPercent(p, oi) {
      const total = p.options.reduce((s, o) => s + o.votes, 0);
      return total > 0 ? Math.round(p.options[oi].votes / total * 100) : 0;
    }
    function addPoll() {
      if (!newPollQuestion.value.trim()) return;
      pollStore.add(newPollQuestion.value);
      newPollQuestion.value = '';
      showToast('已创建投票');
    }

    // === Foods（来自 AI） ===
    const foods = computed(() => tripStore.aiFoods.length > 0 ? tripStore.aiFoods : []);

    // === Live 实况广场 ===
    const livePosts = computed(() => liveStore.posts);
    const liveTypeMap = { traffic: '🚗 路况', scenic: '🏞 景区', food: '🍜 美食', warning: '⚠ 预警' };
    function liveTypeLabel(type) { return liveTypeMap[type] || type; }
    function formatTimeAgo(ts) { return Utils.formatTimeAgo(ts); }
    function avatarColor(name) {
      const colors = ['#c53d43', '#10b981', '#f59e0b', '#ef4444', '#6b5b95', '#06b6d4'];
      let hash = 0;
      for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
      return colors[Math.abs(hash) % colors.length];
    }
    // 模拟用户历史数据，用于演示信用分
    const userHistory = {
      zhang: [{ type: '准时到达' }, { type: '费用结清' }, { type: '发布实况被采纳' }],
      li: [{ type: '获得好评' }, { type: '发布实况被采纳' }],
    };
    function userCredit(userId) { return calculateCreditScore(userId, userHistory[userId] || []); }
    function creditClass(userId) {
      const s = userCredit(userId);
      if (s >= 90) return '';
      if (s >= 70) return 'mid';
      return 'low';
    }
    function toggleLiveForm() {
      showLiveForm.value = !showLiveForm.value;
      if (showLiveForm.value) {
        newLive.content = '';
        newLive.location = tripStore.dest || '';
        newLive.type = 'traffic';
        newLive.image = '';
      }
    }
    function submitLive() {
      if (!newLive.content.trim()) { showToast('请输入分享内容'); return; }
      if (!newLive.location.trim()) { showToast('请输入位置'); return; }
      const post = {
        id: Date.now(),
        user: '我',
        userId: 'me',
        avatar: '我',
        location: newLive.location.trim(),
        type: newLive.type,
        content: newLive.content.trim(),
        image: newLive.image.trim(),
        timestamp: new Date().toISOString(),
        likes: 0,
        likedByMe: false,
        verified: false,
      };
      liveStore.add(post);
      showLiveForm.value = false;
      showToast('实况已发布');
    }
    function likeLive(id) { liveStore.like(id); }

    // === Risks（来自 AI 或本地模板） ===
    const risks = computed(() => {
      if (tripStore.aiRisks.length > 0) return tripStore.aiRisks;
      return [];
    });

    // === 风险等级（用于行程总览卡） ===
    const riskLevel = computed(() => {
      const r = risks.value;
      if (r.length === 0) return { label: '待评估', class: 'tag-yellow', level: 0 };
      const warnCount = r.filter(x => x.type === 'warn' || x.type === 'danger').length;
      if (warnCount >= 3) return { label: '较高风险', class: 'tag-red', level: 3 };
      if (warnCount >= 1) return { label: '需注意', class: 'tag-yellow', level: 2 };
      return { label: '低风险', class: 'tag-green', level: 1 };
    });

    // === Feasibility ===
    const feasibility = computed(() => {
      const budget = budgetRatio.value > 100 ? 'fail' : budgetRatio.value >= 80 ? 'warn' : 'pass';
      const seats = currentCar.value.seats >= tripStore.people ? 'pass' : 'fail';
      let weatherStatus = 'pass';
      if (tripStore.weatherData && tripStore.weatherData.daily[0]) {
        const code = tripStore.weatherData.daily[0].code;
        if (Utils.isBadWeather(code)) weatherStatus = 'fail';
        else if (Utils.isModerateWeather(code)) weatherStatus = 'warn';
      }
      const allPass = budget === 'pass' && seats === 'pass' && weatherStatus === 'pass';
      const hasWarn = budget === 'warn' || weatherStatus === 'warn';
      const hasFail = budget === 'fail' || seats === 'fail' || weatherStatus === 'fail';

      let verdictClass = '', verdictIcon = '✅', verdictText = '综合评估：方案可行，风险可控', verdictSub = '建议出发前再次确认天气与路况，确保司机休息充足。';
      if (hasFail) { verdictClass = 'fail'; verdictIcon = '❌'; verdictText = '综合评估：方案存在严重问题'; verdictSub = '请调整人数、预算或出行日期后重新规划。'; }
      else if (hasWarn) { verdictClass = 'warn'; verdictIcon = '⚠'; verdictText = '综合评估：方案基本可行，需注意'; verdictSub = '部分项目需要关注，建议做好预案。'; }

      return { budget, seats, weather: weatherStatus, verdictClass, verdictIcon, verdictText, verdictSub };
    });

    // === Trip Date ===
    const tripDate = computed(() => Utils.getTripDate(5));

    // === Weather ===
    const weather = computed(() => {
      if (!tripStore.weatherData) return { daily: [], loading: false, error: '尚未获取天气数据', source: '' };
      return {
        daily: tripStore.weatherData.daily,
        loading: false,
        error: '',
        source: tripStore.weatherData.source,
      };
    });

    // === Validation ===
    function validate() {
      Object.keys(errors).forEach(k => delete errors[k]);
      if (!tripStore.origin.trim()) errors.origin = '请输入出发地';
      if (!tripStore.dest.trim()) errors.dest = '请输入目的地';
      if (currentCar.value.seats < tripStore.people) {
        errors.seats = `${tripStore.carModel}只有${currentCar.value.seats}座，无法容纳${tripStore.people}人`;
      }
      return Object.keys(errors).length === 0;
    }

    // === Event Handlers ===
    function onPeopleChange() { step.value = Math.max(step.value, 1); validate(); }
    function onCarChange() { step.value = Math.max(step.value, 2); validate(); }

    // === Do Plan (核心：按步骤调用真实 API，每步有 fallback) ===
    const completedSteps = ref([]); // 已完成步骤标记
    const aiErrors = ref({}); // AI 调用错误信息（可见化）
    const isFileProtocol = ref(location.protocol === 'file:');

    async function doPlan() {
      step.value = 4;
      tripStore.apiError = '';
      if (!validate()) { showToast('请先修复错误再生成方案'); return; }

      loading.value = true;
      showResult.value = false;
      completedSteps.value = [];
      aiErrors.value = {};

      try {
        // Step 1: 并行查询出发地 & 目的地坐标
        loadingText.value = '⏳ 正在解析地址...';
        loadingStep.value = 'Step 1/5: 地理编码';
        const [originGeo, destGeo] = await Promise.all([
          API.geocode(tripStore.origin),
          API.geocode(tripStore.dest),
        ]);
        tripStore.originCoords = originGeo;
        tripStore.destCoords = destGeo;
        dataSources.geocode = originGeo.source;
        completedSteps.value.push(1);

        // Step 2: 调用 OSRM 获取真实路线（失败时用本地估算）
        loadingText.value = '⏳ 正在查询路线...';
        loadingStep.value = 'Step 2/5: 路线规划';
        let route;
        try {
          route = await API.getRoute(originGeo, destGeo);
        } catch (routeErr) {
          console.warn('[doPlan] Route API failed, using fallback:', routeErr.message);
          route = API.getFallbackRoute(originGeo, destGeo);
          showToast('路线 API 不可用，已使用直线距离估算');
        }
        tripStore.routeData = route;
        dataSources.route = route.source;
        updateTimes.route = route.updatedAt;
        completedSteps.value.push(2);

        // Step 3: 获取天气（失败时用本地模板）
        loadingText.value = '⏳ 正在获取天气...';
        loadingStep.value = 'Step 3/5: 天气预报';
        let weather;
        try {
          weather = await API.getWeather(destGeo.lat, destGeo.lon);
        } catch (weatherErr) {
          console.warn('[doPlan] Weather API failed, using fallback:', weatherErr.message);
          weather = API.getFallbackWeather();
          showToast('天气 API 不可用，已使用默认数据');
        }
        tripStore.weatherData = weather;
        dataSources.weather = weather.source;
        updateTimes.weather = weather.updatedAt;
        completedSteps.value.push(3);

        // Step 4: AI 生成文案（失败时自动用本地模板）
        loadingText.value = '⏳ AI 正在生成方案...';
        loadingStep.value = 'Step 4/5: AI 文案';
        const weatherToday = weather.daily[0];
        const budgetSummary = {
          total: totalBudget.value,
          perPerson: perPerson.value,
          oil: budgetItems.value.find(i => i.name === '油费')?.amount || 0,
          toll: budgetItems.value.find(i => i.name === '高速通行费')?.amount || 0,
        };
        const [routeDesc, riskList, foodList, guide] = await Promise.all([
          API.generateRouteDesc(tripStore.origin, tripStore.dest, route, weatherToday),
          API.generateRisks(tripStore.origin, tripStore.dest, route, weatherToday, tripStore.people, tripStore.carModel),
          API.generateFoods(tripStore.dest, route),
          API.generateGuide(tripStore.origin, tripStore.dest, route, weatherToday, tripStore.people, tripStore.carModel, tripStore.days, budgetSummary),
        ]);
        tripStore.aiRouteDesc = routeDesc.text;
        dataSources.aiRouteDesc = routeDesc.source;
        if (routeDesc.error) aiErrors.value.routeDesc = routeDesc.error;
        tripStore.aiRisks = riskList.items;
        dataSources.aiRisks = riskList.source;
        if (riskList.error) aiErrors.value.risks = riskList.error;
        tripStore.aiFoods = foodList.items;
        dataSources.aiFoods = foodList.source;
        if (foodList.error) aiErrors.value.foods = foodList.error;
        tripStore.aiGuide = guide;
        dataSources.aiGuide = guide.source;
        if (guide.error) aiErrors.value.guide = guide.error;
        console.log('[doPlan] Guide source:', guide.source, '内容预览:', JSON.stringify(guide).substring(0, 200));
        // 攻略字段完整性校验：缺失字段用本地模板补全
        const localGuide = API._localGuide(tripStore.origin, tripStore.dest, route, weatherToday, tripStore.people, tripStore.carModel, tripStore.days, budgetSummary);
        const requiredFields = ['routeOverview', 'howToPlay', 'howToEat', 'howToSave', 'notices'];
        let guidePatched = false;
        requiredFields.forEach(f => {
          if (!guide[f] || !String(guide[f]).trim()) {
            guide[f] = localGuide[f];
            guidePatched = true;
          }
        });
        if (guidePatched) {
          console.warn('[doPlan] Guide fields patched with local template');
          guide.source = guide.source === 'ai-mimo' ? 'ai-mimo-patched' : 'local-template';
          dataSources.aiGuide = guide.source;
          tripStore.aiGuide = guide;
        }
        updateTimes.ai = Date.now();
        completedSteps.value.push(4);

        // Step 5: 渲染
        loadingText.value = '✅ 方案生成完成';
        loadingStep.value = 'Step 5/5: 渲染';
        showResult.value = true;
        planReady.value = true; // 显示"方案就绪"提示卡
        activeTab.value = 'plan';
        await nextTick();
        renderRouteMap();
        showToast('方案生成成功！', 'success');
        completedSteps.value.push(5);
        // file:// 协议提示（方案生成后再次提醒）
        if (isFileProtocol.value) {
          setTimeout(() => showToast('⚠️ file:// 模式：AI 功能不可用，已使用本地模板。运行 start.bat 可启用 AI', 'warn'), 1500);
        }
        // 1 秒后自动跳转到地图页
        setTimeout(() => {
          switchTab('map');
          showToast('🗺 方案已生成，查看路线详情', 'success');
        }, 1000);
      } catch (err) {
        tripStore.apiError = err.message;
        showToast('错误：' + err.message);
        // 如果已有部分数据（如坐标），仍然显示并尝试 fallback 地图
        if (tripStore.originCoords && tripStore.destCoords) {
          showResult.value = true;
          planReady.value = true;
          await nextTick();
          renderRouteMap(); // 会自动使用 fallback 直线模式
        }
      } finally {
        loading.value = false;
        loadingStep.value = '';
      }
    }

    // === 重试 ===
    function retryPlan() {
      tripStore.apiError = '';
      doPlan();
    }

    // === Reset ===
    function resetForm() {
      tripStore.origin = '';
      tripStore.dest = '';
      tripStore.people = 4;
      tripStore.budgetMax = 2000;
      tripStore.carModel = '传祺 M8';
      tripStore.days = 1;
      tripStore.selectedRouteIndex = 0;
      tripStore.routeData = null;
      tripStore.weatherData = null;
      tripStore.aiRouteDesc = '';
      tripStore.aiRisks = [];
      tripStore.aiFoods = [];
      tripStore.aiGuide = null;
      tripStore.apiError = '';
      showResult.value = false;
      planReady.value = false;
      guideModalOpen.value = false;
      guideError.value = '';
      completedSteps.value = [];
      aiErrors.value = {};
      aiChatHistory.value = [];
      aiQuestion.value = '';
      aiAnswer.value = '';
      step.value = 1;
      activeTab.value = 'plan';
      Object.keys(errors).forEach(k => delete errors[k]);
      MapController.destroyRouteMap();
      mapStatus.value = 'idle';
      mapErrorMsg.value = '';
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    // === 地图渲染（委托给 MapController） ===
    function renderRouteMap() {
      nextTick(() => {
        const container = document.getElementById('routeMap');
        if (!container) return;

        // 如果当前不在地图 Tab，不初始化（等切换到 map Tab 时再初始化）
        if (activeTab.value !== 'map') {
          return;
        }

        // 确保容器有尺寸（v-show 可能在 nextTick 后才完全显示）
        if (container.offsetWidth === 0 || container.offsetHeight === 0) {
          setTimeout(() => renderRouteMap(), 100);
          return;
        }

        // 初始化地图（如果尚未初始化）
        if (!MapController.isRouteMapReady()) {
          mapStatus.value = 'loading';
          MapController.initRouteMap('routeMap', {
            onTileError: (msg) => {
              console.warn('[App] Map tile error:', msg);
              mapStatus.value = 'error';
              mapErrorMsg.value = msg;
            },
          });
        }

        // 如果有路线数据，绘制路线
        if (tripStore.routeData && tripStore.routeData.geometry) {
          MapController.renderRoute(
            tripStore.routeData,
            tripStore.origin,
            tripStore.dest,
            tripStore.originCoords,
            tripStore.destCoords,
          );
          // 渲染沿途 POI
          if (routePOIs.value.length > 0) {
            MapController.renderPOIs(routePOIs.value);
          }
          mapStatus.value = MapController.getRouteMapState();
        } else if (tripStore.originCoords && tripStore.destCoords) {
          // OSRM 失败但有坐标，使用 fallback 直线模式
          MapController.renderRoute(
            null,
            tripStore.origin,
            tripStore.dest,
            tripStore.originCoords,
            tripStore.destCoords,
          );
          mapStatus.value = 'fallback';
        } else {
          mapStatus.value = 'idle';
        }

        // 确保地图尺寸正确（延迟调用以等容器完全渲染）
        setTimeout(() => MapController.invalidateRouteSize(), 200);
      });
    }

    // === Tab Switching ===
    function switchTab(name) {
      activeTab.value = name;
      if (name === 'map') {
        nextTick(() => {
          // 如果有路线数据但地图未初始化，初始化并渲染
          if (tripStore.routeData && !MapController.isRouteMapReady()) {
            renderRouteMap();
          } else if (MapController.isRouteMapReady()) {
            // 地图已存在，只需刷新尺寸
            MapController.invalidateRouteSize();
            setTimeout(() => MapController.invalidateRouteSize(), 200);
          }
          MapController.invalidateLocationSize();
        });
      }
      if (name === 'account') {
        nextTick(() => {
          setTimeout(() => drawExpenseChart(), 100);
        });
      }
    }

    // === Scroll & Nav ===
    function scrollTo(id) {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // === Intersection Observer for nav highlight ===
    let observer = null;
    function handleRippleClick(e) {
      const btn = e.target.closest('.btn');
      if (!btn) return;
      // 触觉反馈（支持的设备上）
      if (navigator.vibrate) navigator.vibrate(8);
      const ripple = document.createElement('span');
      ripple.className = 'ripple';
      const rect = btn.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      ripple.style.width = ripple.style.height = size + 'px';
      ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
      ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
      btn.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);
    }

    // === 卡片滚动渐显 ===
    let cardRevealObserver = null;
    function setupCardReveal() {
      if (cardRevealObserver) cardRevealObserver.disconnect();
      cardRevealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
            cardRevealObserver.unobserve(entry.target);
          }
        });
      }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
      // 观察所有卡片（排除已有入场动画的首屏卡片）
      nextTick(() => {
        document.querySelectorAll('.card').forEach((card, i) => {
          // 跳过前 8 个卡片（已有 CSS 入场动画），只观察后续滚动进入的卡片
          if (i >= 8) {
            card.classList.add('reveal');
            cardRevealObserver.observe(card);
          }
        });
      });
    }

    onMounted(() => {
      // file:// 协议提示
      if (location.protocol === 'file:') {
        setTimeout(() => showToast('⚠️ file:// 模式：AI 功能不可用，已使用本地模板。运行 start.bat 可启用 AI', 'warn'), 3000);
      }
      document.addEventListener('click', handleRippleClick);
      if (MatchEngine.loadPlans().length === 0 && !localStorage.getItem('tonglu_match_seeded')) {
        MatchEngine.seedPlans();
        localStorage.setItem('tonglu_match_seeded', '1');
      }
      recomputeMatches();
      observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting && entry.intersectionRatio > 0.2) {
            activeSection.value = entry.target.id;
          }
        });
      }, { threshold: [0.2, 0.5], rootMargin: '-80px 0px -50% 0px' });
      nextTick(() => {
        document.querySelectorAll('section[id]').forEach(s => observer.observe(s));
      });
      // 初始化卡片渐显
      setupCardReveal();
      // Tab 切换时重新观察新卡片
      watch(activeTab, () => {
        nextTick(() => setupCardReveal());
      });
    });

    onUnmounted(() => {
      if (observer) observer.disconnect();
      if (cardRevealObserver) cardRevealObserver.disconnect();
      document.removeEventListener('click', handleRippleClick);
      if (shareIntervalId) clearInterval(shareIntervalId);
      if (mockIntervalId) clearInterval(mockIntervalId);
    });

    // === Toast ===
    let toastTimer = null;
    function showToast(msg, type = 'info') {
      toast.msg = msg;
      toast.type = type;
      toast.show = true;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(() => { toast.show = false; }, 3000);
    }

    // === Share Card ===
    function generateQR() {
      if (!qrCanvasRef.value) return;
      const shareUrl = window.location.href.split('#')[0] + '#plan=' + encodeURIComponent(tripStore.origin) + '&dest=' + encodeURIComponent(tripStore.dest) + '&p=' + tripStore.people;
      try {
        const qr = qrcode(0, 'M');
        qr.addData(shareUrl);
        qr.make();
        const canvas = qrCanvasRef.value;
        const ctx = canvas.getContext('2d');
        const moduleCount = qr.getModuleCount();
        const size = canvas.width; // 60
        const cellSize = size / moduleCount;
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, size, size);
        ctx.fillStyle = '#000';
        for (let r = 0; r < moduleCount; r++) {
          for (let c = 0; c < moduleCount; c++) {
            if (qr.isDark(r, c)) ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      } catch (e) { console.error('QR generation failed:', e); }
    }

    function copyShareText() {
      const text = `🚗 同路 AA · 出游计划\n${tripStore.origin} → ${tripStore.dest}\n📅 ${tripDate.value}\n👥 ${tripStore.people}人\n🚗 ${tripStore.carModel}\n💰 人均AA ¥${perPerson.value.toFixed(2)}\n📍 集合：${tripStore.origin}\n⏰ 07:00出发\n\n扫码查看完整方案👇`;
      if (navigator.clipboard) {
        navigator.clipboard.writeText(text).then(() => showToast('文案已复制到剪贴板'));
      } else {
        const ta = document.createElement('textarea');
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
        showToast('文案已复制到剪贴板');
      }
    }

    async function saveAsImage() {
      if (!shareCardRef.value) return;
      loading.value = true;
      loadingText.value = '正在生成图片...';
      try {
        const canvas = await html2canvas(shareCardRef.value, { scale: 2, backgroundColor: '#fff' });
        const link = document.createElement('a');
        link.download = `同路AA_${tripStore.dest}_${Date.now()}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        showToast('图片已保存');
      } catch (e) {
        showToast('图片保存失败：' + e.message);
      } finally {
        loading.value = false;
      }
    }

    // Watch for showResult to generate QR
    watch(showResult, (val) => {
      if (val) { nextTick(() => setTimeout(generateQR, 500)); }
    });
    watch([() => tripStore.people, () => tripStore.carModel, () => tripStore.dest], () => {
      if (showResult.value) { nextTick(() => setTimeout(generateQR, 100)); }
    });

    // 路线数据就绪后，若实时地图已打开则绘制路线
    watch(() => tripStore.routeData, () => {
      MapController.drawPlannedRouteOnLocMap(tripStore.routeData);
    });

    // === Expose ===
    return {
      trip: tripStore,
      loading, loadingText, loadingStep, toast, showResult, step, activeSection, activeTab, tabs, errors,
      mapStatus, mapErrorMsg,
      dataSources, updateTimes, formatUpdateTime, sourceLabel, retryPlan,
      isDemoMode, loadDemoData, riskLevel,
      newItem, newPollQuestion, showLiveForm, newLive,
      planRef, shareCardRef, qrCanvasRef, receiptInput,
      navItems, carOptions: allCarOptions, peopleOptions, dayOptions, history,
      currentCar, recommendedCar, routes, selectedRoute, routeInfo, weather,
      customCars, customCarModalOpen, customCarForm, customCarErrors,
      openCustomCarModal, closeCustomCarModal, saveCustomCar, deleteCustomCar, onCarSelectChange,
      budgetItems, totalBudget, perPerson, budgetRatio, budgetRemaining, budgetStatus,
      expenses, totalSpent, poolBalance, poolClass, saveTip, saveTipClass, saveTipIcon,
      expenseModalOpen, expenseForm,
      members, paidCount, paidRatio,
      totalDistance, totalFuel, carbonEmission, carbonComparison,
      chartCanvasRef, drawExpenseChart,
      personalityQuestions, personalityAnswers, personalityResult,
      selectPersonalityAnswer, resetPersonalityTest,
      routePOIs, isOnline,
      weatherForecastOpen, weatherForecast, openWeatherForecast, closeWeatherForecast, formatWeatherDate,
      planReady, viewFullPlan, completedSteps, aiErrors, isFileProtocol,
      guideModalOpen, guideLoading, guideError, openGuideModal, closeGuideModal, regenerateGuide,
      retryMap, retryMapLoad,
      aiQuestion, aiAnswer, aiAnswerSource, aiAnswerLoading, askAI,
      aiChatHistory, aiSuggestedQuestions, askSuggestedQuestion,
      showProtocolMask, shareCanvasRef, saveShareImage, drawShareCard,
      timeline, timelineGroups, checklist, checkedCount, checkProgress,
      polls, risks, foods, feasibility, tripDate,
      livePosts, liveTypeLabel, formatTimeAgo, avatarColor, userCredit, creditClass, toggleLiveForm, submitLive, likeLive,
      locationSharing, locationMapVisible, locationMembers, sosConfirmShow,
      carScore, selectRoute, onPeopleChange, onCarChange, doPlan, resetForm, scrollTo, switchTab, saveHistory, renderRouteMap,
      toggleCheck, checkAll, uncheckAll, addItem, removeItem,
      vote, optPercent, addPoll,
      copyShareText, saveAsImage, generateQR,
      categoryIcon, formatExpenseTime,
      openExpenseModal, closeExpenseModal, onReceiptChange, saveExpense, deleteExpense, viewReceipt,
      matchForm, matchTagOptions, matchResults, matchErrors, canPublishMatch,
      toggleMatchTag, publishMatchPlan, resetMatchForm, formatMatchDate, joinMatchPlan, copyMatchContact,
      toggleLocationSharing, startLocationSharing, stopLocationSharing, confirmSOS, sendSOS,
    };
  },
});

app.use(createPinia());
app.config.errorHandler = (err, vm, info) => { console.error('[Vue Error]', err.message, '\nInfo:', info, '\nStack:', err.stack); };
app.mount('#app');
