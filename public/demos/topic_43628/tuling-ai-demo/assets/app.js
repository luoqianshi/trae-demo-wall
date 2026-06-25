// ===== 途灵 AI - 智能旅行计划生成器 =====

// 状态
let selectedDays = 3;
let selectedTags = ['美食', '文化'];
let selectedBudget = '舒适';
let currentPlan = null;

// ===== 数据：城市旅行数据 =====
const cityData = {
  '成都': {
    spots: [
      { name: '宽窄巷子', tag: '文化', desc: '成都最具代表性的历史文化街区' },
      { name: '武侯祠', tag: '文化', desc: '三国文化圣地，红墙竹影打卡地' },
      { name: '锦里古街', tag: '文化', desc: '西蜀第一街，夜景绝美' },
      { name: '大熊猫繁育研究基地', tag: '自然', desc: '近距离看国宝大熊猫' },
      { name: '春熙路', tag: '购物', desc: '成都最繁华的商业中心' },
      { name: '人民公园', tag: '休闲', desc: '体验成都慢生活，喝盖碗茶' },
      { name: '东郊记忆', tag: '文化', desc: '工业风文创园区，拍照圣地' },
      { name: '九眼桥', tag: '休闲', desc: '成都夜生活地标，酒吧一条街' },
      { name: '都江堰', tag: '自然', desc: '世界文化遗产，千年水利工程' },
      { name: '青城山', tag: '自然', desc: '道教名山，避暑胜地' },
    ],
    food: [
      { name: '火锅', tag: '必吃', desc: '麻辣鲜香，成都灵魂美食' },
      { name: '串串香', tag: '必吃', desc: '街头巷尾的成都味道' },
      { name: '担担面', tag: '必吃', desc: '百年老字号面食' },
      { name: '龙抄手', tag: '必吃', desc: '皮薄馅嫩，汤鲜味美' },
      { name: '夫妻肺片', tag: '必吃', desc: '麻辣爽口，下酒神器' },
      { name: '钟水饺', tag: '必吃', desc: '甜辣口味，独特风味' },
      { name: '兔头', tag: '特色', desc: '成都人最爱的小吃之一' },
      { name: '蛋烘糕', tag: '特色', desc: '街头经典甜品' },
    ],
    experiences: [
      { name: '人民公园喝盖碗茶', tag: '体验', desc: '感受成都慢生活的最佳方式' },
      { name: '看川剧变脸', tag: '体验', desc: '国家级非物质文化遗产' },
      { name: '逛玉林路夜市', tag: '体验', desc: '赵雷《成都》里的那条街' },
      { name: '采耳体验', tag: '体验', desc: '成都特色的放松方式' },
      { name: '逛太古里', tag: '体验', desc: '时尚与传统的完美融合' },
    ],
    budget: { 经济: 0.6, 舒适: 1, 豪华: 2.2 },
    baseBudget: { hotel: 300, transport: 80, food: 200, ticket: 150 },
  },
  '大理': {
    spots: [
      { name: '洱海', tag: '自然', desc: '风花雪月之洱海月，骑行环湖' },
      { name: '大理古城', tag: '文化', desc: '南诏古国遗风，洋人街漫步' },
      { name: '苍山', tag: '自然', desc: '十九峰十八溪，洗马潭索道' },
      { name: '双廊古镇', tag: '休闲', desc: '洱海边的文艺小镇' },
      { name: '喜洲古镇', tag: '文化', desc: '白族民居建筑群，扎染体验' },
      { name: '崇圣寺三塔', tag: '文化', desc: '大理地标，千年古刹' },
      { name: '蝴蝶泉', tag: '自然', desc: '《五朵金花》取景地' },
      { name: '南诏风情岛', tag: '文化', desc: '洱海中的小岛，白族风情' },
    ],
    food: [
      { name: '过桥米线', tag: '必吃', desc: '云南最具代表性的美食' },
      { name: '乳扇', tag: '必吃', desc: '大理特色奶制品，烤着吃更香' },
      { name: '喜洲粑粑', tag: '必吃', desc: '外酥里嫩，甜咸两种口味' },
      { name: '酸辣鱼', tag: '必吃', desc: '洱海鱼配酸木瓜，酸辣开胃' },
      { name: '饵丝', tag: '必吃', desc: '云南特色早餐' },
      { name: '鲜花饼', tag: '特色', desc: '现烤现吃，花香四溢' },
    ],
    experiences: [
      { name: '洱海骑行', tag: '体验', desc: '租一辆自行车环湖骑行' },
      { name: '扎染体验', tag: '体验', desc: '亲手制作白族扎染作品' },
      { name: '古城泡吧', tag: '体验', desc: '听民谣，看苍山洱海' },
      { name: '看日出', tag: '体验', desc: '龙龛码头看洱海日出' },
    ],
    budget: { 经济: 0.55, 舒适: 1, 豪华: 2.5 },
    baseBudget: { hotel: 250, transport: 100, food: 180, ticket: 120 },
  },
  '西安': {
    spots: [
      { name: '兵马俑', tag: '文化', desc: '世界第八大奇迹' },
      { name: '大雁塔', tag: '文化', desc: '唐代佛教建筑，音乐喷泉' },
      { name: '古城墙', tag: '文化', desc: '中国现存最完整的古城墙' },
      { name: '回民街', tag: '美食', desc: '西安美食一条街' },
      { name: '华清宫', tag: '文化', desc: '唐玄宗与杨贵妃的爱情故事' },
      { name: '大唐不夜城', tag: '休闲', desc: '沉浸式唐风文化街区' },
      { name: '陕西历史博物馆', tag: '文化', desc: '华夏珍宝库' },
      { name: '钟鼓楼', tag: '文化', desc: '西安地标，夜景绝美' },
    ],
    food: [
      { name: '肉夹馍', tag: '必吃', desc: '陕西名片，外酥里嫩' },
      { name: '羊肉泡馍', tag: '必吃', desc: '自己掰馍，汤鲜味浓' },
      { name: '凉皮', tag: '必吃', desc: '酸辣爽口，夏日必备' },
      { name: 'biangbiang面', tag: '必吃', desc: '陕西八大怪之一' },
      { name: '葫芦鸡', tag: '必吃', desc: '长安第一味' },
      { name: '甑糕', tag: '特色', desc: '糯米红枣，甜糯可口' },
    ],
    experiences: [
      { name: '城墙骑行', tag: '体验', desc: '租自行车绕古城墙一周' },
      { name: '看《长恨歌》', tag: '体验', desc: '大型实景历史舞剧' },
      { name: '穿汉服游街', tag: '体验', desc: '在大唐不夜城穿越回唐朝' },
    ],
    budget: { 经济: 0.6, 舒适: 1, 豪华: 2 },
    baseBudget: { hotel: 280, transport: 70, food: 190, ticket: 200 },
  },
  '杭州': {
    spots: [
      { name: '西湖', tag: '自然', desc: '欲把西湖比西子，淡妆浓抹总相宜' },
      { name: '灵隐寺', tag: '文化', desc: '千年古刹，飞来峰造像' },
      { name: '雷峰塔', tag: '文化', desc: '白蛇传说，西湖十景之一' },
      { name: '西溪湿地', tag: '自然', desc: '城市中的天然氧吧' },
      { name: '宋城', tag: '文化', desc: '大型宋代文化主题公园' },
      { name: '河坊街', tag: '购物', desc: '杭州历史街区，老字号云集' },
      { name: '龙井村', tag: '自然', desc: '品茶赏景，茶园风光' },
      { name: '千岛湖', tag: '自然', desc: '天下第一秀水' },
    ],
    food: [
      { name: '西湖醋鱼', tag: '必吃', desc: '杭州传统名菜' },
      { name: '东坡肉', tag: '必吃', desc: '肥而不腻，入口即化' },
      { name: '龙井虾仁', tag: '必吃', desc: '茶香虾鲜，清新雅致' },
      { name: '片儿川', tag: '必吃', desc: '杭州特色面食' },
      { name: '叫花鸡', tag: '必吃', desc: '荷叶包裹，香气扑鼻' },
      { name: '葱包桧', tag: '特色', desc: '杭州传统小吃' },
    ],
    experiences: [
      { name: '西湖泛舟', tag: '体验', desc: '手划船游西湖' },
      { name: '龙井品茶', tag: '体验', desc: '在茶园中品一杯明前龙井' },
      { name: '看《宋城千古情》', tag: '体验', desc: '一生必看的演出' },
    ],
    budget: { 经济: 0.65, 舒适: 1, 豪华: 2.3 },
    baseBudget: { hotel: 320, transport: 60, food: 210, ticket: 180 },
  },
};

// 默认数据（未知城市）
const defaultData = {
  spots: [
    { name: '市中心地标', tag: '文化', desc: '城市最具代表性的地标建筑' },
    { name: '当地博物馆', tag: '文化', desc: '了解城市历史文化的最佳去处' },
    { name: '著名公园', tag: '自然', desc: '城市绿肺，休闲放松好去处' },
    { name: '老城区', tag: '文化', desc: '感受城市历史风貌' },
    { name: '当地夜市', tag: '美食', desc: '体验地道市井生活' },
    { name: '购物中心', tag: '购物', desc: '当地最繁华的商业区' },
    { name: '观景台', tag: '自然', desc: '俯瞰城市全景' },
    { name: '特色街区', tag: '休闲', desc: '文艺青年聚集地' },
  ],
  food: [
    { name: '当地特色菜', tag: '必吃', desc: '最具代表性的地方美食' },
    { name: '街头小吃', tag: '必吃', desc: '当地人最爱的小吃' },
    { name: '老字号餐厅', tag: '必吃', desc: '百年老店，地道味道' },
    { name: '特色面食', tag: '必吃', desc: '当地特色面食' },
    { name: '甜品店', tag: '特色', desc: '当地特色甜品' },
    { name: '早茶/早餐', tag: '特色', desc: '当地人的早餐文化' },
  ],
  experiences: [
    { name: '当地特色体验', tag: '体验', desc: '感受当地独特文化' },
    { name: '夜游城市', tag: '体验', desc: '欣赏城市夜景' },
    { name: '逛当地市场', tag: '体验', desc: '体验市井生活' },
  ],
  budget: { 经济: 0.6, 舒适: 1, 豪华: 2.2 },
  baseBudget: { hotel: 280, transport: 80, food: 190, ticket: 130 },
};

// ===== 工具函数 =====
function getCityData(city) {
  return cityData[city] || defaultData;
}

function getSelectedDays() {
  return selectedDays;
}

function getSelectedTags() {
  return selectedTags;
}

function getSelectedBudget() {
  return selectedBudget;
}

// ===== 页面切换 =====
function showPage(pageId) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  document.getElementById(pageId).classList.remove('hidden');
  window.scrollTo(0, 0);
}

function showHome() { showPage('homePage'); }
function showForm() { showPage('formPage'); }
function showResult() { showPage('resultPage'); }

// ===== 表单交互 =====
function initForm() {
  // 天数选择
  document.querySelectorAll('.day-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.day-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedDays = parseInt(btn.dataset.days);
    });
  });

  // 标签选择
  document.querySelectorAll('.tag-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      btn.classList.toggle('active');
      const tag = btn.dataset.tag;
      if (btn.classList.contains('active')) {
        if (!selectedTags.includes(tag)) selectedTags.push(tag);
      } else {
        selectedTags = selectedTags.filter(t => t !== tag);
      }
    });
  });

  // 预算选择
  document.querySelectorAll('.budget-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.budget-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      selectedBudget = btn.dataset.budget;
    });
  });
}

// ===== 生成旅行计划 =====
function generatePlan() {
  const destination = document.getElementById('destination').value.trim();
  if (!destination) {
    alert('请输入目的地');
    return;
  }

  // 显示加载
  document.getElementById('btnText').classList.add('hidden');
  document.getElementById('btnLoading').classList.remove('hidden');

  // 模拟 AI 生成延迟
  setTimeout(() => {
    const plan = createPlan(destination, selectedDays, selectedTags, selectedBudget);
    currentPlan = plan;
    renderResult(plan);

    document.getElementById('btnText').classList.remove('hidden');
    document.getElementById('btnLoading').classList.add('hidden');
    showResult();
  }, 1500);
}

function createPlan(destination, days, tags, budget) {
  const data = getCityData(destination);
  const multiplier = data.budget[budget] || 1;

  // 筛选匹配标签的景点
  let matchedSpots = data.spots.filter(s => tags.includes(s.tag) || tags.includes('休闲'));
  if (matchedSpots.length < days * 2) {
    matchedSpots = [...matchedSpots, ...data.spots.filter(s => !matchedSpots.includes(s))];
  }

  // 生成每日行程
  const itinerary = [];
  const dayBudgets = [];
  for (let i = 0; i < days; i++) {
    const daySpots = matchedSpots.slice(i * 2, i * 2 + 2);
    const dayFoods = data.food.slice(i * 2, i * 2 + 2);
    const dayExp = data.experiences[i % data.experiences.length];

    const dayBudget = Math.round(
      (data.baseBudget.hotel + data.baseBudget.transport + data.baseBudget.food + data.baseBudget.ticket) *
      multiplier / days
    );

    itinerary.push({
      day: i + 1,
      title: getDayTitle(i, tags),
      spots: daySpots,
      foods: dayFoods,
      experience: dayExp,
      budget: dayBudget,
      schedule: generateSchedule(daySpots, dayFoods, dayExp),
    });
    dayBudgets.push(dayBudget);
  }

  // 总预算
  const totalBudget = dayBudgets.reduce((a, b) => a + b, 0);
  const budgetBreakdown = {
    住宿: Math.round(totalBudget * 0.35),
    餐饮: Math.round(totalBudget * 0.25),
    交通: Math.round(totalBudget * 0.2),
    门票: Math.round(totalBudget * 0.2),
  };

  // 打卡清单
  const checklist = {
    spots: matchedSpots.slice(0, Math.min(8, matchedSpots.length)),
    food: data.food.slice(0, Math.min(6, data.food.length)),
    experience: data.experiences.slice(0, Math.min(5, data.experiences.length)),
  };

  return {
    destination,
    days,
    tags,
    budget,
    totalBudget,
    budgetBreakdown,
    itinerary,
    checklist,
    totalSpots: matchedSpots.length,
    totalFood: data.food.length,
  };
}

function getDayTitle(dayIndex, tags) {
  const titles = {
    '美食': ['美食探索日', '舌尖上的旅行', '味蕾之旅'],
    '文化': ['文化沉浸日', '历史寻踪', '人文之旅'],
    '自然': ['自然探索日', '山水之间', '户外时光'],
    '购物': ['购物狂欢日', '买买买', '时尚之旅'],
    '休闲': ['慢生活日', '惬意时光', '放松之旅'],
    '冒险': ['挑战自我日', '刺激之旅', '探险时光'],
  };
  const primaryTag = tags[dayIndex % tags.length] || '休闲';
  const tagTitles = titles[primaryTag] || titles['休闲'];
  return tagTitles[dayIndex % tagTitles.length];
}

function generateSchedule(spots, foods, exp) {
  const schedule = [];
  schedule.push({ time: '09:00', content: '酒店出发', desc: '开启美好的一天' });
  if (spots[0]) {
    schedule.push({ time: '09:30', content: spots[0].name, desc: spots[0].desc });
  }
  if (foods[0]) {
    schedule.push({ time: '12:00', content: '午餐：' + foods[0].name, desc: foods[0].desc });
  }
  if (spots[1]) {
    schedule.push({ time: '14:00', content: spots[1].name, desc: spots[1].desc });
  }
  if (exp) {
    schedule.push({ time: '16:30', content: exp.name, desc: exp.desc });
  }
  if (foods[1]) {
    schedule.push({ time: '18:30', content: '晚餐：' + foods[1].name, desc: foods[1].desc });
  }
  schedule.push({ time: '20:00', content: '自由活动 / 回酒店休息', desc: '享受夜晚时光' });
  return schedule;
}

// ===== 渲染结果 =====
function renderResult(plan) {
  // 标题
  document.getElementById('resultTitle').textContent = `${plan.destination} ${plan.days} 天旅行计划`;
  document.getElementById('resultSubtitle').textContent = `${plan.tags.join(' · ')} | ${plan.budget}型预算`;

  // 概览
  document.getElementById('totalBudget').textContent = `¥${plan.totalBudget.toLocaleString()}`;
  document.getElementById('totalSpots').textContent = plan.totalSpots;
  document.getElementById('totalFood').textContent = plan.totalFood;

  // 预算明细
  const budgetBars = document.getElementById('budgetBars');
  const maxBudget = Math.max(...Object.values(plan.budgetBreakdown));
  const colors = ['#F97316', '#0EA5E9', '#22C55E', '#8B5CF6'];
  let budgetHtml = '';
  Object.entries(plan.budgetBreakdown).forEach(([name, amount], i) => {
    const pct = (amount / maxBudget * 100);
    budgetHtml += `
      <div class="budget-bar">
        <div class="budget-bar-header">
          <span>${name}</span>
          <span>¥${amount.toLocaleString()}</span>
        </div>
        <div class="budget-bar-track">
          <div class="budget-bar-fill" style="width: ${pct}%; background: ${colors[i % colors.length]};"></div>
        </div>
      </div>
    `;
  });
  budgetBars.innerHTML = budgetHtml;

  // 每日行程
  const itineraryList = document.getElementById('itineraryList');
  itineraryList.innerHTML = plan.itinerary.map(day => `
    <div class="day-card">
      <div class="day-header">
        <span class="day-title">Day ${day.day} — ${day.title}</span>
        <span class="day-budget">约 ¥${day.budget}</span>
      </div>
      <div class="timeline">
        ${day.schedule.map(item => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div class="timeline-time">${item.time}</div>
            <div class="timeline-content">${item.content}</div>
            <div class="timeline-desc">${item.desc}</div>
          </div>
        `).join('')}
      </div>
    </div>
  `).join('');

  // 打卡清单
  renderChecklist('spots');
}

function renderChecklist(tab) {
  const content = document.getElementById('checklistContent');
  const items = currentPlan.checklist[tab] || [];

  content.innerHTML = items.map((item, i) => `
    <div class="checklist-item">
      <div class="checklist-checkbox" onclick="toggleCheck(this)"></div>
      <span class="checklist-text">${item.name}</span>
      <span class="checklist-tag">${item.tag}</span>
    </div>
  `).join('');
}

function toggleCheck(el) {
  el.classList.toggle('checked');
  const text = el.nextElementSibling;
  text.classList.toggle('checked');
}

// ===== 打卡清单标签切换 =====
function initChecklistTabs() {
  document.querySelectorAll('.checklist-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      document.querySelectorAll('.checklist-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      renderChecklist(tab.dataset.tab);
    });
  });
}

// ===== 分享功能 =====
function sharePlan() {
  document.getElementById('shareModal').classList.remove('hidden');
}

function closeModal() {
  document.getElementById('shareModal').classList.add('hidden');
}

function copyLink() {
  const input = document.getElementById('shareUrl');
  input.select();
  document.execCommand('copy');
  alert('链接已复制到剪贴板！');
}

function exportPlan() {
  alert('导出功能将在完整版中实现');
}

// ===== 初始化 =====
document.addEventListener('DOMContentLoaded', () => {
  initForm();
  initChecklistTabs();
});
