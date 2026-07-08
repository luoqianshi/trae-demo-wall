/* ============================================
   无聊APP · 路由与核心
   ============================================ */

const App = {
  // 视图栈：[{view, tab, params}]
  stack: [],
  currentTab: 'home',
  views: {},       // 视图注册表
  onlineTimer: null,
  _psAvatar: '🐱',
  _psGender: '女',

  init() {
    // 注册视图
    this.views = {
      home: { render: Home.render, init: Home.init, title: '无聊', tab: 'home' },
      select: { render: Select.render, init: Select.init, title: '选择困难症', tab: 'select' },
      square: { render: Square.render, init: Square.init, title: '无聊广场', tab: 'square' },
      park: { render: Park.render, init: Park.init, title: '无聊乐园', tab: 'park' },
      profile: { render: Profile.render, init: Profile.init, title: '我的', tab: 'profile' },

      'select-outfit': { render: Select.outfit, init: Select.outfitInit, title: '今天穿什么' },
      'select-food': { render: Select.food, init: Select.foodInit, title: '今天吃什么' },
      'select-drink': { render: Select.drink, init: Select.drinkInit, title: '今天喝什么' },
      'select-makeup': { render: Select.makeup, init: Select.makeupInit, title: '今日美妆' },
      'select-travel': { render: Select.travel, init: Select.travelInit, title: '去哪玩' },
      'select-random': { render: Select.random, init: Select.randomInit, title: '随机选择' },

      'square-together': { render: Square.together, init: Square.togetherInit, title: '一起去无聊' },
      'square-post': { render: Square.postDetail, init: Square.postDetailInit, title: '帖子详情' },
      'square-treehole': { render: Square.treehole, init: Square.treeholeInit, title: '无聊树洞' },
      'square-brag': { render: Square.brag, init: Square.bragInit, title: '无聊吹牛' },
      'square-treehole-post': { render: Square.treeholePostDetail, init: Square.treeholePostDetailInit, title: '树洞帖子' },
      'square-brag-post': { render: Square.bragPostDetail, init: Square.bragPostDetailInit, title: '吹牛帖子' },
      'square-vote': { render: Square.vote, init: Square.voteInit, title: '无聊投票' },
      'square-waste': { render: Square.waste, init: Square.wasteInit, title: '变废为废' },
      'square-praise': { render: Square.praise, init: Square.praiseInit, title: '无聊夸夸墙' },
      'square-challenge': { render: Square.challenge, init: Square.challengeInit, title: '无聊挑战' },
      'square-challenge-detail': { render: Square.challengeDetail, init: Square.challengeDetailInit, title: '挑战详情' },

      'park-hotpot': { render: Park.hotpot, init: Park.hotpotInit, title: '无聊火锅店' },
      'park-shop': { render: Park.shop, init: Park.shopInit, title: '吹牛商城' },
      'park-wish': { render: Park.wish, init: Park.wishInit, title: '云许愿' },
      'park-blindbox': { render: Park.blindbox, init: Park.blindboxInit, title: '无聊盲盒' },
      'park-lottery': { render: Park.lottery, init: Park.lotteryInit, title: '无聊彩票站' },
      'park-marathon': { render: Park.marathon, init: Park.marathonInit, title: '无聊马拉松' },
      'park-theater': { render: Park.theater, init: Park.theaterInit, title: '无聊电影院' },
      'park-gaokao': { render: Park.gaokao, init: Park.gaokaoInit, title: '无聊高考' },
      'park-plane': { render: Park.plane, init: Park.planeInit, title: '无聊飞机' },
      'park-diet': { render: Park.diet, init: Park.dietInit, title: '无聊减肥' },
      'park-cat': { render: Park.cat, init: Park.catInit, title: '云撸猫' },
      'park-theater-detail': { render: Park.theaterDetail, init: Park.theaterDetailInit, title: '剧场详情' },
      'park-rich': { render: Park.rich, init: Park.richInit, title: '无聊富豪' },
      'park-love': { render: Park.love, init: Park.loveInit, title: '无聊恋爱' },
      'park-work': { render: Profile.work, init: Profile.workInit, title: '打工赚币' },
      'park-dig': { render: Profile.dig, init: Profile.digInit, title: '金矿挖金' },
    };

    // 底部Tab点击
    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.dataset.tab;
        this.switchTab(tab);
      });
    });

    // 返回按钮
    document.getElementById('back-btn').addEventListener('click', () => this.back());

    // 时钟
    this.updateClock();
    setInterval(() => this.updateClock(), 30000);

    // 在线人数模拟
    this.startOnlineSim();

    // 强制画像检查
    if (!DATA.profileSetupDone) {
      this.showProfileSetup();
    }

    // 启动首页
    this.switchTab('home', true);
  },

  // ===== 强制画像浮层 =====
  showProfileSetup() {
    // 生成头像网格
    const avatars = ['🐱','🦁','🐶','🐰','🦊','🐼','🐨','🐯','🦄','🐸','🐵','🐧'];
    const grid = document.getElementById('ps-avatar-grid');
    grid.innerHTML = avatars.map(a =>
      `<div class="ps-avatar-opt ${a===this._psAvatar?'active':''}" onclick="App.pickAvatar('${a}')">${a}</div>`
    ).join('');
    document.getElementById('profile-setup').classList.remove('hide');
  },
  pickAvatar(a) {
    this._psAvatar = a;
    document.getElementById('ps-avatar-cur').textContent = a;
    document.querySelectorAll('.ps-avatar-opt').forEach(el => {
      el.classList.toggle('active', el.textContent === a);
    });
  },
  pickGender(btn) {
    document.querySelectorAll('.ps-gender-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    this._psGender = btn.dataset.g;
  },
  submitProfile() {
    const name = document.getElementById('ps-name').value.trim();
    const sign = document.getElementById('ps-sign').value;
    const age = parseInt(document.getElementById('ps-age').value);
    const region = document.getElementById('ps-region').value.trim();

    if (!name) { U.toast('起个名字吧'); return; }
    if (!sign) { U.toast('请选择星座，这是必填的'); return; }
    if (!age || age < 5 || age > 120) { U.toast('请填写正确的年龄'); return; }

    const curYear = new Date().getFullYear();
    const birthYear = curYear - age;
    DATA.me.name = name;
    DATA.me.avatar = this._psAvatar;
    DATA.me.sign = sign;
    DATA.me.age = age;
    DATA.me.decade = U.decadeByYear(birthYear);
    DATA.me.gender = this._psGender;
    DATA.me.region = region || '地球';

    DATA.profileSetupDone = true;
    document.getElementById('profile-setup').classList.add('hide');
    App.renderCurrent();
    U.toast(`画像已建立！欢迎 ${DATA.me.decade}的${sign}朋友 ✨`);
  },

  updateClock() {
    const d = new Date();
    document.getElementById('clock').textContent =
      `${d.getHours()}:${String(d.getMinutes()).padStart(2,'0')}`;
  },

  startOnlineSim() {
    const el = document.getElementById('online-count');
    let n = DATA.onlineCount;
    setInterval(() => {
      n += U.rand(-3, 5);
      if (n < 1200) n = 1200;
      if (n > 1400) n = 1400;
      DATA.onlineCount = n;
      el.innerHTML = `此刻有 <b>${n.toLocaleString()}</b> 个无聊的人和你在一起`;
    }, 4000);
  },

  // 切换主Tab
  switchTab(tab, isInit) {
    if (!isInit && this.currentTab === tab && this.stack.length === 1) return;
    this.currentTab = tab;
    this.stack = [{ view: tab, tab }];
    // tab高亮
    document.querySelectorAll('.tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });
    this.renderCurrent();
    document.getElementById('app-view').scrollTop = 0;
  },

  // 进入子视图
  navigate(view, params) {
    this.stack.push({ view, tab: this.currentTab, params });
    this.renderCurrent();
    document.getElementById('app-view').scrollTop = 0;
  },

  // 返回
  back() {
    if (this.stack.length > 1) {
      this.stack.pop();
      this.renderCurrent();
      document.getElementById('app-view').scrollTop = 0;
    }
  },

  // 渲染当前视图
  renderCurrent() {
    const cur = this.stack[this.stack.length - 1];
    const v = this.views[cur.view];
    if (!v) return;

    // 清理上一视图的定时器
    this._cleanupTimers();

    // 标题
    document.getElementById('page-title').textContent = v.title || '无聊';

    // 返回按钮
    const backBtn = document.getElementById('back-btn');
    backBtn.classList.toggle('hide', this.stack.length <= 1);

    // 在线人数显示控制：只在首页显示
    document.getElementById('online-count').classList.toggle('hide', cur.view !== 'home');

    // 渲染
    const view = document.getElementById('app-view');
    view.innerHTML = v.render(cur.params);
    view.className = 'app-view fade-in';
    // 触发动画重绘
    void view.offsetHeight;

    if (v.init) v.init(cur.params);

    // tab高亮
    if (v.tab) {
      document.querySelectorAll('.tab').forEach(b => {
        b.classList.toggle('active', b.dataset.tab === v.tab);
      });
    }
  },

  // 骰子随机
  rollDice() {
    const dice = document.querySelector('.tab-dice');
    dice.classList.add('spinning');
    U.toast('🎲 骰子转动中…');
    setTimeout(() => {
      dice.classList.remove('spinning');
      const entry = U.pick(DATA.diceEntries);
      U.modal(`
        <div style="text-align:center">
          <div style="font-size:60px">${entry.icon}</div>
          <h3 style="font-family:var(--font-display);font-size:22px;margin:8px 0">骰子让你去：${entry.name}</h3>
          <p style="font-size:13px;color:var(--ink-soft);margin-bottom:14px">命运为你做出了选择，去吧无聊的人！</p>
          <button class="btn btn-primary btn-block btn-lg" onclick="U.closeModal();App.goto('${entry.target}')">出发 →</button>
          <button class="btn btn-block" style="margin-top:8px" onclick="U.closeModal()">再掷一次</button>
        </div>
      `);
    }, 900);
  },

  // 通用跳转
  goto(target, params) {
    // 主tab
    if (['home','select','square','park','profile'].includes(target)) {
      this.switchTab(target);
      return;
    }
    // 子视图，需先切到对应tab再进入
    const tabMap = {
      'select-outfit':'select','select-food':'select','select-drink':'select','select-makeup':'select',
      'select-travel':'select','select-random':'select',
    };
    const squareViews = ['square-together','square-post','square-treehole','square-brag','square-treehole-post','square-brag-post','square-vote','square-waste','square-praise','square-challenge','square-challenge-detail'];
    const parkViews = ['park-hotpot','park-shop','park-wish','park-blindbox','park-lottery','park-marathon','park-theater','park-gaokao','park-plane','park-diet','park-cat','park-theater-detail','park-rich','park-love','park-work','park-dig'];

    if (tabMap[target]) {
      this.switchTab(tabMap[target]);
      this.navigate(target, params);
    } else if (squareViews.includes(target)) {
      this.switchTab('square');
      this.navigate(target, params);
    } else if (parkViews.includes(target)) {
      this.switchTab('park');
      this.navigate(target, params);
    }
  },

  refreshProfile() {
    // 如果当前在profile页，刷新币数显示
    if (this.currentTab === 'profile' && this.stack.length === 1) {
      const coinEl = document.getElementById('coin-num');
      if (coinEl) coinEl.textContent = DATA.me.coin;
    }
  },

  // 清理各模块定时器（仅在视图真正切换时清理，renderCurrent重渲染不清理）
  _cleanupTimers() {
    // 注意：此方法在每次 renderCurrent 时调用，但同视图内重渲染也会触发
    // 仅清理"跨视图"的残留定时器；切西瓜/马拉松的定时器已自带 stage 存在性检查
    if (typeof Square !== 'undefined' && Square._sliceTimer && !document.getElementById('slice-stage')) {
      clearInterval(Square._sliceTimer);
      Square._sliceTimer = null;
    }
    if (typeof Square !== 'undefined' && Square._capFocusTimer && !document.getElementById('cap-stage')) {
      clearInterval(Square._capFocusTimer);
      Square._capFocusTimer = null;
    }
    if (typeof Park !== 'undefined' && Park._theaterHostTimer && !document.getElementById('theater-host-bubble')) {
      clearInterval(Park._theaterHostTimer);
      Park._theaterHostTimer = null;
    }
  },
};

window.App = App;
