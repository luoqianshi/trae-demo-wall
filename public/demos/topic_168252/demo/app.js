// 模拟数据
const POINTS = {
  purple: {
    name: '市博物馆',
    quality: '史诗',
    qualityClass: 'quality-epic',
    qualityStyle: 'background:rgba(155,89,182,0.3);color:#d7bde2;',
    distance: '580m',
    time: '8 分钟',
    mode: '谜题解锁：答对古籍相关问题即可开箱。今日题目："这首诗描写的是哪座建筑？"',
    rewards: [
      {icon:'💎', name:'海洋之泪碎片'},
      {icon:'🧋', name:'奶茶兑换券'},
      {icon:'🎫', name:'探币 ×50'}
    ],
    culture: '该馆建于1958年，馆藏文物10万余件。打卡点位于馆内"古籍特展"展厅，寻宝的同时了解《诗经》与建筑文化的渊源。',
    drop: { quality:'史诗掉落！', qualityStyle:'background:rgba(155,89,182,0.3);color:#d7bde2;', icon:'💎', name:'海洋之泪碎片', desc:'集齐 10 片可合成完整「海洋之泪」，兑换限定皮肤或奶茶券' }
  },
  gold: {
    name: '万象城',
    quality: '稀有',
    qualityClass: 'quality-rare',
    qualityStyle: 'background:rgba(52,152,219,0.3);color:#aed6f1;',
    distance: '220m',
    time: '3 分钟',
    mode: '消费验证：在商场任意门店消费满 ¥30，凭小票验证码获得额外抽奖机会',
    rewards: [
      {icon:'🎁', name:'泡泡玛特盲盒'},
      {icon:'🧋', name:'喜茶兑换券'},
      {icon:'🎫', name:'探币 ×30'}
    ],
    culture: '城市核心商圈，日均客流5万+。合作打卡点设在中庭下沉广场，开箱同时还能逛逛新店。',
    drop: { quality:'稀有掉落！', qualityStyle:'background:rgba(52,152,219,0.3);color:#aed6f1;', icon:'🎁', name:'泡泡玛特盲盒兑换券', desc:'凭券可到门店兑换指定系列盲盒一个' }
  },
  blue: {
    name: '古城墙遗址',
    quality: '稀有',
    qualityClass: 'quality-rare',
    qualityStyle: 'background:rgba(52,152,219,0.3);color:#aed6f1;',
    distance: '1.8km',
    time: '12 分钟',
    mode: '纯打卡：到达城墙下方蓝牙范围即可开箱，绿色出行骑行加成 +10% 爆率',
    rewards: [
      {icon:'⚔️', name:'古剑残片'},
      {icon:'🎭', name:'非遗脸谱'},
      {icon:'🎫', name:'探币 ×40'}
    ],
    culture: '始建于明洪武年间，全长14公里。打卡点设在"永宁门"段，城墙砖上至今保留古人铭文，可AR扫描特定砖块解锁线索。',
    drop: { quality:'稀有掉落！', qualityStyle:'background:rgba(52,152,219,0.3);color:#aed6f1;', icon:'⚔️', name:'青铜古剑残片', desc:'集齐 8 片可合成完整「青铜古剑」道具' }
  },
  green: {
    name: '喜茶门店',
    quality: '普通',
    qualityClass: 'quality-common',
    qualityStyle: 'background:rgba(149,165,166,0.3);color:#d5dbdb;',
    distance: '400m',
    time: '5 分钟',
    mode: '纯打卡：到店门口即可开箱，每日限开 1 次',
    rewards: [
      {icon:'🧋', name:'奶茶券'},
      {icon:'🎫', name:'探币 ×15'}
    ],
    culture: '品牌合作打卡点，新品尝鲜同步上线。打卡开箱有机会获得新品免费券。',
    drop: { quality:'普通掉落', qualityStyle:'background:rgba(149,165,166,0.3);color:#d5dbdb;', icon:'🧋', name:'奶茶兑换券', desc:'可到任意合作门店兑换指定饮品一杯' }
  }
};

// 应用逻辑
const app = {
  currentPoint: null,
  chestOpened: false,

  init() {
    // 启动页
    setTimeout(() => {
      const splash = document.getElementById('splash');
      if (splash) splash.classList.add('hidden');
    }, 2200);

    // 时钟
    this.updateClock();
    setInterval(() => this.updateClock(), 60000);
  },

  updateClock() {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    const clock = document.getElementById('clock');
    if (clock) clock.textContent = h + ':' + m;
  },

  switchPage(pageName) {
    // 隐藏所有页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    // 显示目标页面
    const target = document.getElementById('page-' + pageName);
    if (target) target.classList.add('active');

    // 更新导航状态
    const navs = document.querySelectorAll('.nav-item');
    navs.forEach(n => n.classList.remove('active'));
    const navMap = { map: 0, bag: 1, profile: 2 };
    if (navMap[pageName] !== undefined && navs[navMap[pageName]]) {
      navs[navMap[pageName]].classList.add('active');
    }
  },

  openPoint(pointId) {
    const point = POINTS[pointId];
    if (!point) return;
    this.currentPoint = point;

    // 填充详情
    const nameEl = document.getElementById('detail-name');
    if (nameEl) nameEl.textContent = point.name;
    const descEl = document.getElementById('detail-desc');
    if (descEl) descEl.textContent = '📍 距离你 ' + point.distance + ' · 🚶 步行约 ' + point.time;
    const modeEl = document.getElementById('detail-mode');
    if (modeEl) modeEl.innerHTML = point.mode;
    const cultureEl = document.getElementById('detail-culture');
    if (cultureEl) cultureEl.textContent = point.culture;

    const qualityEl = document.getElementById('detail-quality');
    if (qualityEl) {
      qualityEl.textContent = point.quality;
      qualityEl.className = 'detail-quality-badge ' + point.qualityClass;
    }

    const rewardsEl = document.getElementById('detail-rewards');
    if (rewardsEl) {
      rewardsEl.innerHTML = point.rewards.map(r =>
        '<div class="reward-item"><span class="icon">' + r.icon + '</span>' + r.name + '</div>'
      ).join('');
    }

    // 切换页面
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    const detailPage = document.getElementById('page-detail');
    if (detailPage) detailPage.classList.add('active');
    const navs = document.querySelectorAll('.nav-item');
    navs.forEach(n => n.classList.remove('active'));
  },

  backToMap() {
    this.switchPage('map');
  },

  startChest() {
    const pages = document.querySelectorAll('.page');
    pages.forEach(p => p.classList.remove('active'));
    const chestPage = document.getElementById('page-chest');
    if (chestPage) chestPage.classList.add('active');
    const navs = document.querySelectorAll('.nav-item');
    navs.forEach(n => n.classList.remove('active'));
    this.chestOpened = false;

    // 重置开箱UI
    const box = document.getElementById('chest-box');
    const lid = document.getElementById('chest-lid');
    const lock = document.getElementById('chest-lock');
    const rays = document.getElementById('search-rays');
    const status = document.getElementById('chest-status');
    const hint = document.getElementById('chest-hint');

    if (box) { box.textContent = '📦'; box.classList.remove('shaking'); box.onclick = () => this.openChest(); }
    if (lid) lid.classList.remove('open');
    if (lock) lock.textContent = '🔒';
    if (rays) rays.classList.remove('active');
    if (status) status.textContent = '点击保险箱开始搜索';
    if (hint) hint.innerHTML = '蓝牙已连接 · 信号强度良好<br>靠近打卡点即可获得更高爆率';
  },

  openChest() {
    if (this.chestOpened) return;
    this.chestOpened = true;

    const box = document.getElementById('chest-box');
    const lid = document.getElementById('chest-lid');
    const lock = document.getElementById('chest-lock');
    const rays = document.getElementById('search-rays');
    const status = document.getElementById('chest-status');
    const hint = document.getElementById('chest-hint');

    // 阶段1：震动搜索
    if (box) { box.classList.add('shaking'); box.textContent = '🔍'; }
    if (status) status.textContent = '正在搜索物资...';
    if (hint) hint.textContent = '蓝牙握手成功 · 验证位置中...';
    if (rays) rays.classList.add('active');

    // 阶段2：开箱
    setTimeout(() => {
      if (box) { box.classList.remove('shaking'); box.textContent = '✨'; }
      if (lid) lid.classList.add('open');
      if (lock) lock.textContent = '🔓';
      if (status) status.textContent = '发现宝藏！';
      if (hint) hint.textContent = '开箱成功 · 奖励已生成';
      if (rays) rays.classList.remove('active');

      // 阶段3：显示结果
      setTimeout(() => {
        this.showDrop();
      }, 800);
    }, 2000);
  },

  showDrop() {
    const drop = this.currentPoint ? this.currentPoint.drop : POINTS.purple.drop;
    const qEl = document.getElementById('drop-quality');
    const iEl = document.getElementById('drop-icon');
    const nEl = document.getElementById('drop-name');
    const dEl = document.getElementById('drop-desc');
    const result = document.getElementById('drop-result');

    if (qEl) { qEl.textContent = drop.quality; qEl.style = drop.qualityStyle; }
    if (iEl) iEl.textContent = drop.icon;
    if (nEl) nEl.textContent = drop.name;
    if (dEl) dEl.textContent = drop.desc;
    if (result) result.classList.add('show');
  },

  closeDrop() {
    const result = document.getElementById('drop-result');
    if (result) result.classList.remove('show');
    this.switchPage('map');
  },

  switchBagTab(tab) {
    const tabs = document.querySelectorAll('.bag-tab');
    tabs.forEach(t => t.classList.remove('active'));
    if (event && event.target) event.target.classList.add('active');
  }
};

// 初始化
document.addEventListener('DOMContentLoaded', function() {
  app.init();
});
