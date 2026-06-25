// ============================================================
// 战锤40K银河征兵中心 - 主应用逻辑
// ============================================================

const App = {
  currentPage: 'home',
  previousPage: null,
  quizState: { current: 0, answers: [], scores: {} },
  compareSelected: [],

  // --- 初始化 ---
  init() {
    this.bindEvents();
    this.initLoadingScreen();
    this.initInquisitionMonitor();
    this.initDailyNotice();
    this.checkDailyFortune();
  },

  // --- 加载动画 ---
  initLoadingScreen() {
    const screen = document.getElementById('loading-screen');
    const status = document.querySelector('.loading-status');
    const messages = [
      '正在接入星语通讯...',
      '校验帝国公民身份...',
      '同步亚空间数据...',
      '加载阵营档案...',
      '初始化征兵系统...',
      '系统就绪'
    ];
    let i = 0;
    const interval = setInterval(() => {
      i++;
      if (status && i < messages.length) {
        status.textContent = messages[i];
      }
      if (i >= messages.length) {
        clearInterval(interval);
        setTimeout(() => {
          screen.classList.add('hidden');
          setTimeout(() => screen.remove(), 800);
        }, 300);
      }
    }, 350);
  },

  // --- 审判庭监控 ---
  initInquisitionMonitor() {
    const monitor = document.getElementById('inquisition-monitor');
    if (!monitor) return;
    const dismissed = localStorage.getItem('inquisition_dismissed');
    if (dismissed) {
      monitor.classList.add('dismissed');
    }
    monitor.addEventListener('click', () => {
      monitor.classList.add('dismissed');
      localStorage.setItem('inquisition_dismissed', '1');
    });
  },

  // --- 每日通知 ---
  initDailyNotice() {
    const today = new Date().toDateString();
    const lastNotice = localStorage.getItem('last_imperial_notice');
    if (lastNotice !== today) {
      setTimeout(() => {
        const news = RECRUIT_NEWS[Math.floor(Math.random() * RECRUIT_NEWS.length)];
        this.showToast(news, 'info');
        localStorage.setItem('last_imperial_notice', today);
      }, 3000);
    }
  },

  // --- 检查每日运势 ---
  checkDailyFortune() {
    const today = new Date().toDateString();
    const drawn = localStorage.getItem('fortune_date');
    return drawn === today;
  },

  // --- 事件绑定 ---
  bindEvents() {
    // 导航
    document.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.nav;
        this.navigate(page);
        // 关闭移动菜单
        document.getElementById('mobile-menu')?.classList.remove('open');
        document.querySelector('.navbar-toggle')?.classList.remove('active');
      });
    });

    // 汉堡菜单
    document.querySelector('.navbar-toggle')?.addEventListener('click', () => {
      document.getElementById('mobile-menu')?.classList.toggle('open');
      document.querySelector('.navbar-toggle')?.classList.toggle('active');
    });

    // 滚动事件
    window.addEventListener('scroll', () => {
      const navbar = document.querySelector('.navbar');
      if (window.scrollY > 50) {
        navbar.classList.add('scrolled');
      } else {
        navbar.classList.remove('scrolled');
      }
    });

    // 交叉观察器（卡片入场动画）
    this.initScrollAnimations();
  },

  // --- 滚动动画 ---
  initScrollAnimations() {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
        }
      });
    }, { threshold: 0.1 });

    document.querySelectorAll('.card-enter').forEach(el => observer.observe(el));
  },

  // --- 路由导航 ---
  navigate(page, params = {}) {
    this.previousPage = this.currentPage;
    this.currentPage = page;

    // 隐藏所有页面
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));

    // 更新导航高亮
    document.querySelectorAll('[data-nav]').forEach(a => a.classList.remove('active'));
    document.querySelectorAll(`[data-nav="${page}"]`).forEach(a => a.classList.add('active'));

    // 显示目标页面
    const targetPage = document.getElementById(`page-${page}`);
    if (targetPage) {
      targetPage.classList.add('active');
    }

    // 渲染页面内容
    switch (page) {
      case 'home': this.renderHome(); break;
      case 'factions': this.renderFactions(); break;
      case 'faction-detail': this.renderFactionDetail(params.id); break;
      case 'compare': this.renderCompare(); break;
      case 'quiz': this.renderQuiz(); break;
      case 'enlist': this.renderEnlist(); break;
      case 'survival': this.renderSurvival(); break;
      case 'daily': this.renderDaily(); break;
      case 'rank': this.renderRank(); break;
      case 'message': this.renderMessage(); break;
    }

    window.scrollTo({ top: 0, behavior: 'smooth' });
  },

  // --- Toast 通知 ---
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      toast.style.transition = 'all 0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 4000);
  },

  // --- 工具函数 ---
  randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; },
  randomNum(min, max) { return Math.floor(Math.random() * (max - min + 1)) + min; },
  getFaction(id) { return FACTIONS.find(f => f.id === id); },

  // ============================================================
  // 首页渲染
  // ============================================================
  renderHome() {
    const container = document.getElementById('page-home');
    container.innerHTML = `
      <!-- Hero -->
      <section class="hero">
        <div class="hero-bg"></div>
        <div class="hero-content">
          <p class="hero-subtitle">Galactic Recruitment Center · Est. M41</p>
          <h1 class="hero-title">战锤40K<br>银河征兵中心</h1>
          <p class="hero-tagline">在第四十二个千年，唯有战争。<br>选择你的阵营，为银河而战。</p>
          <div class="hero-cta">
            <button class="btn btn-primary btn-press" data-nav="factions">查看全部阵营</button>
            <button class="btn btn-secondary btn-press" data-nav="quiz">开始适配测试</button>
          </div>
        </div>
      </section>

      <!-- 九大阵营 -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Choose Your Allegiance</p>
            <h2 class="section-title">九大阵营</h2>
            <div class="divider"></div>
            <p class="section-desc">银河系中九大主要势力，每一个都在为生存与霸权而战。选择你的命运。</p>
          </div>
          <div class="faction-grid stagger-in">
            ${FACTIONS.map(f => `
              <div class="faction-card card-enter" data-nav="faction-detail" data-faction="${f.id}" style="--faction-color: ${f.theme.secondary}">
                <span class="card-icon">${f.icon}</span>
                <h3 class="card-name">${f.name}</h3>
                <p class="card-slogan">${f.slogan}</p>
                <div class="card-meta">
                  <span>难度 <span class="difficulty-stars">${'★'.repeat(f.difficulty)}${'☆'.repeat(5 - f.difficulty)}</span></span>
                  <span>存活率 ${f.survivalRate}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </section>

      <!-- 征兵流程 -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Recruitment Process</p>
            <h2 class="section-title">征兵流程</h2>
            <div class="divider"></div>
          </div>
          <div class="timeline">
            <div class="timeline-item">
              <div class="timeline-icon">📋</div>
              <div class="timeline-dot"></div>
              <div class="timeline-title">提交申请</div>
              <div class="timeline-desc">填写征兵报名表，选择目标阵营</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">🔍</div>
              <div class="timeline-dot"></div>
              <div class="timeline-title">资质筛查</div>
              <div class="timeline-desc">审判庭背景调查与基因检测</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">⚔️</div>
              <div class="timeline-dot"></div>
              <div class="timeline-title">阵营试炼</div>
              <div class="timeline-desc">通过阵营专属的严苛考验</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">🎖️</div>
              <div class="timeline-dot"></div>
              <div class="timeline-title">正式入伍</div>
              <div class="timeline-desc">宣誓效忠，领取装备，奔赴战场</div>
            </div>
            <div class="timeline-item">
              <div class="timeline-icon">👑</div>
              <div class="timeline-dot"></div>
              <div class="timeline-title">晋升授勋</div>
              <div class="timeline-desc">在战场上证明自己，获得荣耀</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 帝国征兵播报 -->
      <section class="news-ticker">
        <span class="news-ticker-label">帝国广播</span>
        <div class="news-ticker-track">
          ${[...RECRUIT_NEWS, ...RECRUIT_NEWS].map(n => `
            <span class="news-ticker-item"><span class="news-tag">[政令]</span>${n}</span>
          `).join('')}
        </div>
      </section>

      <!-- 快捷入口 -->
      <section class="section">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Interactive Tools</p>
            <h2 class="section-title">互动工具中心</h2>
            <div class="divider"></div>
          </div>
          <div class="quick-grid stagger-in">
            <div class="quick-card card-enter" data-nav="enlist">
              <div class="quick-icon">📋</div>
              <div class="quick-name">征兵报名表</div>
              <div class="quick-desc">填写报名表，获取录取通知书</div>
            </div>
            <div class="quick-card card-enter" data-nav="survival">
              <div class="quick-icon">💀</div>
              <div class="quick-name">战损计算器</div>
              <div class="quick-desc">计算你的战场存活概率</div>
            </div>
            <div class="quick-card card-enter" data-nav="daily">
              <div class="quick-icon">🎲</div>
              <div class="quick-name">每日征兵签</div>
              <div class="quick-desc">抽取今日战锤运势</div>
            </div>
            <div class="quick-card card-enter" data-nav="rank">
              <div class="quick-icon">🎖️</div>
              <div class="quick-name">军衔生成器</div>
              <div class="quick-desc">生成你的专属军衔头衔</div>
            </div>
            <div class="quick-card card-enter" data-nav="message">
              <div class="quick-icon">💬</div>
              <div class="quick-name">新兵留言板</div>
              <div class="quick-desc">留下你的报到宣言</div>
            </div>
          </div>
        </div>
      </section>

      <!-- 页脚 -->
      <footer class="footer">
        <div class="container">
          <p class="footer-text">
            <span class="gold">战锤40K银河征兵中心</span> · 粉丝向非官方站点<br>
            在第四十二个千年，唯有战争。<br>
            Warhammer 40,000 © Games Workshop Ltd. 本站为粉丝创作，与GW无关。
          </p>
        </div>
      </footer>
    `;

    // 绑定阵营卡片点击
    container.querySelectorAll('[data-faction]').forEach(card => {
      card.addEventListener('click', () => {
        this.navigate('faction-detail', { id: card.dataset.faction });
      });
    });

    // 重新绑定导航
    this.bindPageNavs(container);
    this.initScrollAnimations();
  },

  // ============================================================
  // 阵营总览页
  // ============================================================
  renderFactions() {
    const container = document.getElementById('page-factions');
    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">All Factions</p>
            <h2 class="section-title">阵营总览</h2>
            <div class="divider"></div>
            <p class="section-desc">浏览银河系中所有主要势力，找到属于你的战场。</p>
          </div>

          <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 16px; margin-bottom: 32px;">
            <div class="filter-bar" style="margin-bottom: 0;">
              <button class="filter-btn active" data-filter="all">全部</button>
              <button class="filter-btn" data-filter="human">人类阵营</button>
              <button class="filter-btn" data-filter="chaos">混沌阵营</button>
              <button class="filter-btn" data-filter="alien">异形阵营</button>
            </div>
            <div class="view-toggle">
              <button class="active" data-view="grid">▦</button>
              <button data-view="list">☰</button>
            </div>
          </div>

          <div id="factions-display" class="faction-grid"></div>
        </div>
      </section>
    `;

    this.renderFactionCards('all', 'grid');

    // 筛选
    container.querySelectorAll('[data-filter]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-filter]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const currentView = container.querySelector('.view-toggle button.active')?.dataset.view || 'grid';
        this.renderFactionCards(btn.dataset.filter, currentView);
      });
    });

    // 视图切换
    container.querySelectorAll('[data-view]').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('[data-view]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const currentFilter = container.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        this.renderFactionCards(currentFilter, btn.dataset.view);
      });
    });
  },

  renderFactionCards(filter, view) {
    const display = document.getElementById('factions-display');
    if (!display) return;

    let factions = FACTIONS;
    if (filter !== 'all') {
      factions = FACTIONS.filter(f => f.category === filter);
    }

    if (view === 'grid') {
      display.className = 'faction-grid stagger-in';
      display.innerHTML = factions.map(f => `
        <div class="faction-card card-enter" data-faction="${f.id}">
          <span class="card-icon">${f.icon}</span>
          <h3 class="card-name">${f.name}</h3>
          <p class="card-slogan">${f.slogan}</p>
          <div class="card-meta">
            <span>难度 <span class="difficulty-stars">${'★'.repeat(f.difficulty)}${'☆'.repeat(5 - f.difficulty)}</span></span>
            <span>存活率 ${f.survivalRate}</span>
            <span>寿命 ${f.lifespan}</span>
          </div>
        </div>
      `).join('');
    } else {
      display.className = 'faction-list stagger-in';
      display.innerHTML = factions.map(f => `
        <div class="faction-list-item card-enter" data-faction="${f.id}">
          <span class="list-icon">${f.icon}</span>
          <div class="list-info">
            <div class="list-name">${f.name}</div>
            <div class="list-slogan">${f.slogan}</div>
          </div>
          <div class="list-meta">
            <span>难度 ${'★'.repeat(f.difficulty)}</span>
            <span>存活 ${f.survivalRate}</span>
            <span>寿命 ${f.lifespan}</span>
          </div>
        </div>
      `).join('');
    }

    display.querySelectorAll('[data-faction]').forEach(card => {
      card.addEventListener('click', () => {
        this.navigate('faction-detail', { id: card.dataset.faction });
      });
    });

    this.initScrollAnimations();
  },

  // ============================================================
  // 阵营详情页
  // ============================================================
  renderFactionDetail(id) {
    const faction = this.getFaction(id);
    if (!faction) {
      this.navigate('factions');
      return;
    }

    const container = document.getElementById('page-faction-detail');
    const isGlitch = id === 'chaos' || id === 'necrons';

    container.innerHTML = `
      <div class="faction-hero" style="background: ${faction.theme.gradient};">
        <div class="faction-hero-bg" style="background: ${faction.theme.gradient};"></div>
        <div class="faction-hero-content">
          <span class="faction-icon-large">${faction.icon}</span>
          <h1 class="faction-name-large ${isGlitch ? 'glitch-text' : ''}" ${isGlitch ? `data-text="${faction.name}"` : ''} style="color: ${faction.theme.secondary};">${faction.name}</h1>
          <p class="faction-name-en">${faction.nameEn}</p>
          <p class="faction-motto" style="color: ${faction.theme.secondary}; opacity: 0.8;">"${faction.motto}"</p>
        </div>
      </div>

      <div class="container">
        <!-- 阵营概述 -->
        <div class="detail-section">
          <h2 class="detail-title">阵营概述</h2>
          <p style="font-size: 15px; color: var(--text-secondary); line-height: 2;">${faction.overview}</p>
        </div>

        <!-- 核心信条 -->
        <div class="detail-section">
          <h2 class="detail-title">核心信条</h2>
          <ul class="tenet-list">
            ${faction.tenets.map(t => `<li>${t}</li>`).join('')}
          </ul>
        </div>

        <!-- 征兵条件 -->
        <div class="detail-section">
          <h2 class="detail-title">征兵条件</h2>
          <div class="requirement-grid">
            <div class="requirement-item">
              <div class="req-label">种族/基因要求</div>
              <div class="req-value">${faction.requirements.race}</div>
            </div>
            <div class="requirement-item">
              <div class="req-label">年龄与身体条件</div>
              <div class="req-value">${faction.requirements.age}</div>
            </div>
            <div class="requirement-item">
              <div class="req-label">信仰/忠诚度要求</div>
              <div class="req-value">${faction.requirements.loyalty}</div>
            </div>
            <div class="requirement-item">
              <div class="req-label">特殊天赋要求</div>
              <div class="req-value">${faction.requirements.special}</div>
            </div>
            <div class="requirement-item">
              <div class="req-label">官方淘汰率</div>
              <div class="req-value" style="color: var(--imperial-red); font-weight: 600;">${faction.requirements.rejectionRate}</div>
            </div>
            <div class="requirement-item">
              <div class="req-label">典型招募来源</div>
              <div class="req-value">${faction.requirements.sources}</div>
            </div>
          </div>
        </div>

        <!-- 兵种晋升路径 -->
        <div class="detail-section">
          <h2 class="detail-title">兵种晋升路径</h2>
          <div class="rank-tree">
            ${faction.ranks.map(r => `
              <div class="rank-tree-item">
                <div class="rank-title">${r.title}</div>
                <div class="rank-desc">${r.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 装备与待遇 -->
        <div class="detail-section">
          <h2 class="detail-title">装备与待遇</h2>
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 24px;">
            <div>
              <h3 style="font-family: var(--font-display); font-size: 14px; color: var(--gold-dim); margin-bottom: 12px; letter-spacing: 1px;">标配装备</h3>
              <ul style="list-style: none; display: grid; gap: 8px;">
                ${faction.equipment.map(e => `<li style="font-size: 14px; color: var(--text-secondary); padding: 8px 12px; background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border-color);">⚔ ${e}</li>`).join('')}
              </ul>
            </div>
            <div>
              <h3 style="font-family: var(--font-display); font-size: 14px; color: var(--gold-dim); margin-bottom: 12px; letter-spacing: 1px;">特殊福利</h3>
              <ul style="list-style: none; display: grid; gap: 8px;">
                ${faction.benefits.map(b => `<li style="font-size: 14px; color: var(--text-secondary); padding: 8px 12px; background: var(--bg-card); border-radius: var(--radius); border: 1px solid var(--border-color);">✦ ${b}</li>`).join('')}
              </ul>
            </div>
          </div>
        </div>

        <!-- 著名代表人物 -->
        <div class="detail-section">
          <h2 class="detail-title">著名代表人物</h2>
          <div class="heroes-grid">
            ${faction.heroes.map(h => `
              <div class="hero-card">
                <div class="hero-name">${h.name}</div>
                <div class="hero-title">${h.title}</div>
                <div class="hero-desc">${h.desc}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- 入伍宣誓词 -->
        <div class="detail-section">
          <h2 class="detail-title">入伍宣誓词</h2>
          <div class="oath-box" id="oath-text">${faction.oath}</div>
          <div style="text-align: center; margin-top: 16px;">
            <button class="btn btn-secondary btn-sm" id="btn-play-oath">播放宣誓动效</button>
          </div>
        </div>

        <!-- 底部CTA -->
        <div style="text-align: center; padding: 48px 0;">
          <button class="btn btn-primary btn-press" data-nav="enlist" data-faction-preselect="${faction.id}">
            立即申请入伍 — ${faction.name}
          </button>
        </div>
      </div>
    `;

    // 宣誓动效
    document.getElementById('btn-play-oath')?.addEventListener('click', () => {
      const oathEl = document.getElementById('oath-text');
      const text = faction.oath;
      oathEl.textContent = '';
      oathEl.style.borderRight = '2px solid var(--gold)';
      let i = 0;
      const typeInterval = setInterval(() => {
        oathEl.textContent += text[i];
        i++;
        if (i >= text.length) {
          clearInterval(typeInterval);
          setTimeout(() => { oathEl.style.borderRight = 'none'; }, 1000);
        }
      }, 50);
    });

    // 预选阵营
    container.querySelectorAll('[data-faction-preselect]').forEach(btn => {
      btn.addEventListener('click', () => {
        localStorage.setItem('enlist_faction', btn.dataset.factionPreselect);
      });
    });

    this.bindPageNavs(container);
  },

  // ============================================================
  // 征兵条件对比页
  // ============================================================
  renderCompare() {
    const container = document.getElementById('page-compare');
    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Compare Factions</p>
            <h2 class="section-title">征兵条件对比</h2>
            <div class="divider"></div>
            <p class="section-desc">选择2-3个阵营进行横向对比，找到最适合你的战场。</p>
          </div>

          <div class="compare-selector">
            ${FACTIONS.map(f => `
              <button class="compare-chip" data-compare="${f.id}">${f.icon} ${f.name}</button>
            `).join('')}
          </div>

          <div id="compare-result"></div>
        </div>
      </section>
    `;

    container.querySelectorAll('[data-compare]').forEach(chip => {
      chip.addEventListener('click', () => {
        const id = chip.dataset.compare;
        if (this.compareSelected.includes(id)) {
          this.compareSelected = this.compareSelected.filter(s => s !== id);
          chip.classList.remove('selected');
        } else if (this.compareSelected.length < 3) {
          this.compareSelected.push(id);
          chip.classList.add('selected');
        } else {
          this.showToast('最多选择3个阵营进行对比', 'error');
          return;
        }
        this.renderCompareTable();
      });
    });
  },

  renderCompareTable() {
    const result = document.getElementById('compare-result');
    if (!result || this.compareSelected.length < 2) {
      if (result) result.innerHTML = '<div class="empty-state"><div class="empty-icon">⚖️</div><div class="empty-text">请选择至少2个阵营进行对比</div></div>';
      return;
    }

    const factions = this.compareSelected.map(id => this.getFaction(id));
    result.innerHTML = `
      <div style="overflow-x: auto;">
        <table class="compare-table">
          <thead>
            <tr>
              <th>对比维度</th>
              ${factions.map(f => `<th>${f.icon} ${f.name}</th>`).join('')}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>入伍门槛</td>
              ${factions.map(f => `<td>${'★'.repeat(f.difficulty)}${'☆'.repeat(5 - f.difficulty)}</td>`).join('')}
            </tr>
            <tr>
              <td>平均预期寿命</td>
              ${factions.map(f => `<td>${f.lifespan}</td>`).join('')}
            </tr>
            <tr>
              <td>战场存活率</td>
              ${factions.map(f => `<td style="color: ${parseInt(f.survivalRate) > 30 ? '#22c55e' : parseInt(f.survivalRate) > 15 ? 'var(--gold)' : 'var(--imperial-red)'}; font-weight: 600;">${f.survivalRate}</td>`).join('')}
            </tr>
            <tr>
              <td>种族要求</td>
              ${factions.map(f => `<td>${f.requirements.race.substring(0, 30)}...</td>`).join('')}
            </tr>
            <tr>
              <td>淘汰率</td>
              ${factions.map(f => `<td>${f.requirements.rejectionRate}</td>`).join('')}
            </tr>
            <tr>
              <td>晋升空间</td>
              ${factions.map(f => `<td>${f.ranks.length} 个等级</td>`).join('')}
            </tr>
            <tr>
              <td>退役可能性</td>
              ${factions.map(f => `<td>${f.id === 'tau' || f.id === 'votann' ? '有退休制度' : f.id === 'orks' ? '兽人不退役' : '几乎为零'}</td>`).join('')}
            </tr>
            <tr>
              <td>精神稳定性要求</td>
              ${factions.map(f => `<td>${f.id === 'chaos' || f.id === 'dark-eldar' ? '越疯越好' : f.id === 'necrons' || f.id === 'tyranids' ? '不需要' : f.id === 'orks' ? '不需要' : '极高'}</td>`).join('')}
            </tr>
            <tr>
              <td>后勤条件</td>
              ${factions.map(f => `<td>${f.id === 'tau' || f.id === 'votann' ? '优秀' : f.id === 'orks' ? '有什么用什么' : f.id === 'tyranids' ? '自给自足' : f.id === 'necrons' ? '不需要' : '堪忧'}</td>`).join('')}
            </tr>
          </tbody>
        </table>
      </div>
    `;
  },

  // ============================================================
  // 阵营适配测试页
  // ============================================================
  renderQuiz() {
    this.quizState = { current: 0, answers: [], scores: {} };
    const container = document.getElementById('page-quiz');
    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Faction Aptitude Test</p>
            <h2 class="section-title">阵营适配测试</h2>
            <div class="divider"></div>
            <p class="section-desc">回答12道问题，找出最适合你的阵营。</p>
          </div>
          <div class="quiz-container" id="quiz-container"></div>
        </div>
      </section>
    `;
    this.renderQuizQuestion();
  },

  renderQuizQuestion() {
    const qContainer = document.getElementById('quiz-container');
    if (!qContainer) return;

    if (this.quizState.current >= QUIZ_QUESTIONS.length) {
      this.renderQuizResult();
      return;
    }

    const q = QUIZ_QUESTIONS[this.quizState.current];
    const progress = ((this.quizState.current) / QUIZ_QUESTIONS.length * 100);

    qContainer.innerHTML = `
      <div class="quiz-progress">
        <div class="quiz-progress-bar">
          <div class="quiz-progress-fill" style="width: ${progress}%"></div>
        </div>
        <span class="quiz-progress-text">${this.quizState.current + 1}/${QUIZ_QUESTIONS.length}</span>
      </div>
      <div class="quiz-question">
        <div class="quiz-question-text">${q.question}</div>
        <div class="quiz-options">
          ${q.options.map((opt, i) => `
            <button class="quiz-option" data-index="${i}">${opt.text}</button>
          `).join('')}
        </div>
      </div>
    `;

    qContainer.querySelectorAll('.quiz-option').forEach(btn => {
      btn.addEventListener('click', () => {
        const idx = parseInt(btn.dataset.index);
        const option = q.options[idx];

        // 记录答案
        this.quizState.answers.push(idx);

        // 累计分数
        Object.entries(option.scores).forEach(([faction, score]) => {
          this.quizState.scores[faction] = (this.quizState.scores[faction] || 0) + score;
        });

        // 下一题
        this.quizState.current++;
        this.renderQuizQuestion();
      });
    });
  },

  renderQuizResult() {
    const qContainer = document.getElementById('quiz-container');
    if (!qContainer) return;

    // 找出最高分阵营
    let maxScore = 0;
    let bestFaction = 'imperium';
    Object.entries(this.quizState.scores).forEach(([faction, score]) => {
      if (score > maxScore) {
        maxScore = score;
        bestFaction = faction;
      }
    });

    const faction = this.getFaction(bestFaction);
    const result = QUIZ_RESULT_DESC[bestFaction];
    const totalPossible = QUIZ_QUESTIONS.length * 4;
    const matchPercent = Math.round((maxScore / totalPossible) * 100);

    qContainer.innerHTML = `
      <div class="quiz-result">
        <div class="result-faction">${faction.icon}</div>
        <h2 class="result-title">${result.title}</h2>
        <div class="result-match">${matchPercent}%</div>
        <p style="font-size: 14px; color: var(--text-muted); margin-bottom: 8px;">适配阵营</p>
        <h3 style="font-family: var(--font-display); font-size: 24px; color: ${faction.theme.secondary}; margin-bottom: 24px;">${faction.name}</h3>
        <p class="result-desc">${result.desc}</p>
        <div class="result-rank">推荐兵种：${result.rank}</div>
        <div style="margin-top: 32px; display: flex; gap: 16px; justify-content: center; flex-wrap: wrap;">
          <button class="btn btn-primary btn-press" data-nav="faction-detail" data-faction="${faction.id}">查看阵营详情</button>
          <button class="btn btn-secondary btn-press" id="btn-retake-quiz">重新测试</button>
        </div>
      </div>
    `;

    document.getElementById('btn-retake-quiz')?.addEventListener('click', () => {
      this.renderQuiz();
    });

    this.bindPageNavs(qContainer);
  },

  // ============================================================
  // 征兵报名表
  // ============================================================
  renderEnlist() {
    const container = document.getElementById('page-enlist');
    const preselected = localStorage.getItem('enlist_faction') || '';
    localStorage.removeItem('enlist_faction');

    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Enlistment Form</p>
            <h2 class="section-title">征兵报名表</h2>
            <div class="divider"></div>
            <p class="section-desc">填写以下信息，提交你的入伍申请。系统将根据阵营要求自动审核。</p>
          </div>

          <div style="max-width: 600px; margin: 0 auto;" id="enlist-form-container">
            <form id="enlist-form">
              <div class="form-group">
                <label class="form-label">姓名 *</label>
                <input type="text" class="form-input" id="enlist-name" placeholder="输入你的全名" required>
              </div>
              <div class="form-group">
                <label class="form-label">昵称</label>
                <input type="text" class="form-input" id="enlist-nickname" placeholder="你在战场上的代号">
              </div>
              <div class="form-group">
                <label class="form-label">年龄 *</label>
                <input type="number" class="form-input" id="enlist-age" placeholder="你的年龄" min="1" max="99999" required>
              </div>
              <div class="form-group">
                <label class="form-label">来自星球 *</label>
                <input type="text" class="form-input" id="enlist-planet" placeholder="例如：地球、卡迪亚、塔兰" required>
              </div>
              <div class="form-group">
                <label class="form-label">擅长技能</label>
                <input type="text" class="form-input" id="enlist-skill" placeholder="例如：射击、近战、灵能、工程">
              </div>
              <div class="form-group">
                <label class="form-label">申请阵营 *</label>
                <select class="form-select" id="enlist-faction" required>
                  <option value="">-- 选择阵营 --</option>
                  ${FACTIONS.map(f => `<option value="${f.id}" ${f.id === preselected ? 'selected' : ''}>${f.icon} ${f.name}</option>`).join('')}
                </select>
              </div>
              <div class="form-group">
                <label class="form-label">效忠誓言（可选）</label>
                <textarea class="form-textarea" id="enlist-oath" placeholder="写下你的效忠誓言..."></textarea>
              </div>
              <div style="text-align: center; margin-top: 32px;">
                <button type="submit" class="btn btn-primary btn-press">提交入伍申请</button>
              </div>
            </form>
          </div>

          <div id="enlist-result" style="display: none;"></div>
        </div>
      </section>
    `;

    document.getElementById('enlist-form')?.addEventListener('submit', (e) => {
      e.preventDefault();
      this.processEnlistment();
    });
  },

  processEnlistment() {
    const name = document.getElementById('enlist-name').value.trim();
    const nickname = document.getElementById('enlist-nickname').value.trim() || name;
    const age = parseInt(document.getElementById('enlist-age').value);
    const planet = document.getElementById('enlist-planet').value.trim();
    const skill = document.getElementById('enlist-skill').value.trim() || '未填写';
    const factionId = document.getElementById('enlist-faction').value;
    const oath = document.getElementById('enlist-oath').value.trim();

    if (!name || !age || !planet || !factionId) {
      this.showToast('请填写所有必填项', 'error');
      return;
    }

    const faction = this.getFaction(factionId);
    const formContainer = document.getElementById('enlist-form-container');
    const resultContainer = document.getElementById('enlist-result');

    // 审判庭彩蛋（5%概率）
    const isInquisition = Math.random() < 0.05;

    // 模拟审核（70%通过率）
    const accepted = isInquisition ? false : Math.random() < 0.7;

    formContainer.style.display = 'none';
    resultContainer.style.display = 'block';

    if (isInquisition) {
      resultContainer.innerHTML = `
        <div class="notice-card rejected" style="border-color: #7c3aed; box-shadow: 0 0 40px rgba(124, 58, 237, 0.2);">
          <div class="notice-icon">👁️</div>
          <div class="notice-title" style="color: #7c3aed;">审判庭特别调查令</div>
          <div class="notice-info">
            <div class="notice-row"><span class="label">调查对象</span><span class="value">${name}</span></div>
            <div class="notice-row"><span class="label">调查原因</span><span class="value">疑似异端活动</span></div>
            <div class="notice-row"><span class="label">调查等级</span><span class="value" style="color: #7c3aed;">极秘</span></div>
          </div>
          <p style="font-size: 14px; color: var(--text-secondary); line-height: 1.8; margin-bottom: 24px;">
            恭喜你触发了审判庭背景调查彩蛋！<br>
            你的申请已被转交至审判庭异端审判官处理。<br>
            审判官将在"适当的时候"联系你。请保持警惕。<br>
            <span style="color: var(--text-muted); font-size: 12px;">（提示：大多数人被"联系"后就再也没有出现过。）</span>
          </p>
          <button class="btn btn-secondary btn-sm" id="btn-enlist-retry">重新申请</button>
        </div>
      `;
    } else if (accepted) {
      const serialNum = `WH40K-${factionId.toUpperCase().substring(0, 3)}-${this.randomNum(10000, 99999)}`;
      const rank = faction.ranks[0].title;
      const unit = this.randomItem(RANK_GENERATOR.suffixes[factionId]).replace('{num}', this.randomNum(1, 999));
      const reportDate = `${this.randomNum(1, 31)} ${['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'][this.randomNum(0, 11)]}, M42.${this.randomNum(1, 9)}`;

      resultContainer.innerHTML = `
        <div class="notice-card accepted">
          <div class="notice-icon">🎖️</div>
          <div class="notice-title">入伍录取通知书</div>
          <div class="notice-info">
            <div class="notice-row"><span class="label">编号</span><span class="value">${serialNum}</span></div>
            <div class="notice-row"><span class="label">姓名</span><span class="value">${name}</span></div>
            <div class="notice-row"><span class="label">代号</span><span class="value">${nickname}</span></div>
            <div class="notice-row"><span class="label">入伍阵营</span><span class="value" style="color: ${faction.theme.secondary};">${faction.name}</span></div>
            <div class="notice-row"><span class="label">授予军衔</span><span class="value">${rank}</span></div>
            <div class="notice-row"><span class="label">分配部队</span><span class="value">${unit}</span></div>
            <div class="notice-row"><span class="label">报到时间</span><span class="value">${reportDate}</span></div>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 16px;">
            ${faction.name}欢迎你的加入。请携带本通知书于指定时间前往报到。<br>
            迟到者将被视为逃兵处理。
          </p>
          <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
            <button class="btn btn-secondary btn-sm" id="btn-copy-notice">复制通知书</button>
            <button class="btn btn-secondary btn-sm" id="btn-enlist-retry">重新申请</button>
          </div>
        </div>
      `;

      document.getElementById('btn-copy-notice')?.addEventListener('click', () => {
        const text = `【入伍录取通知书】\n编号: ${serialNum}\n姓名: ${name}\n阵营: ${faction.name}\n军衔: ${rank}\n部队: ${unit}\n报到: ${reportDate}`;
        navigator.clipboard?.writeText(text).then(() => {
          this.showToast('通知书已复制到剪贴板', 'success');
        }).catch(() => {
          this.showToast('复制失败，请手动复制', 'error');
        });
      });
    } else {
      const reason = this.randomItem(RANK_GENERATOR.rejectionReasons[factionId]);
      resultContainer.innerHTML = `
        <div class="notice-card rejected">
          <div class="notice-icon">✗</div>
          <div class="notice-title">入伍申请驳回</div>
          <div class="notice-info">
            <div class="notice-row"><span class="label">申请人</span><span class="value">${name}</span></div>
            <div class="notice-row"><span class="label">申请阵营</span><span class="value">${faction.name}</span></div>
            <div class="notice-row"><span class="label">驳回原因</span><span class="value" style="color: var(--imperial-red);">${reason}</span></div>
          </div>
          <p style="font-size: 13px; color: var(--text-muted); margin-top: 16px;">
            你可以修改信息后重新申请，或者考虑其他阵营。<br>
            <span style="font-style: italic;">帝国提醒你：即使被驳回，你仍然可以通过成为炮灰来为帝皇服务。</span>
          </p>
          <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
            <button class="btn btn-secondary btn-sm" id="btn-enlist-retry">重新申请</button>
          </div>
        </div>
      `;
    }

    document.getElementById('btn-enlist-retry')?.addEventListener('click', () => {
      formContainer.style.display = 'block';
      resultContainer.style.display = 'none';
    });
  },

  // ============================================================
  // 战损存活概率计算器
  // ============================================================
  renderSurvival() {
    const container = document.getElementById('page-survival');
    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Survival Calculator</p>
            <h2 class="section-title">战损存活概率计算器</h2>
            <div class="divider"></div>
            <p class="section-desc">输入你的属性，计算在不同阵营和战场中的预期存活时间。</p>
          </div>

          <div style="max-width: 600px; margin: 0 auto;" id="survival-form-container">
            <div class="form-group">
              <label class="form-label">战斗经验等级</label>
              <select class="form-select" id="survival-exp">
                <option value="1">菜鸟（从未上过战场）</option>
                <option value="2">新兵（参加过少量战斗）</option>
                <option value="3" selected>老兵（身经百战）</option>
                <option value="4">精英（战场上的传奇）</option>
                <option value="5">英雄（几乎不可杀死）</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">身体素质</label>
              <select class="form-select" id="survival-physical">
                <option value="1">虚弱（需要拐杖）</option>
                <option value="2">一般（勉强达标）</option>
                <option value="3" selected>良好（标准战士水平）</option>
                <option value="4">优秀（基因强化级）</option>
                <option value="5">超人（超越人类极限）</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">心理素质</label>
              <select class="form-select" id="survival-mental">
                <option value="1">脆弱（看到血就晕）</option>
                <option value="2">一般（偶尔会崩溃）</option>
                <option value="3" selected>稳定（能承受正常压力）</option>
                <option value="4">坚强（面对恶魔也不退缩）</option>
                <option value="5">钢铁意志（什么都不怕）</option>
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">所属阵营</label>
              <select class="form-select" id="survival-faction">
                ${FACTIONS.map(f => `<option value="${f.id}">${f.icon} ${f.name}</option>`).join('')}
              </select>
            </div>
            <div class="form-group">
              <label class="form-label">参战场景</label>
              <select class="form-select" id="survival-scene">
                <option value="patrol">常规巡逻（相对安全）</option>
                <option value="battle" selected>主力会战（大规模冲突）</option>
                <option value="hive">巢都清剿（近距离战斗）</option>
                <option value="boarding">太空登舰（极度危险）</option>
              </select>
            </div>
            <div style="text-align: center; margin-top: 32px;">
              <button class="btn btn-danger btn-press" id="btn-calc-survival">计算存活概率</button>
            </div>
          </div>

          <div id="survival-result" style="display: none;"></div>
        </div>
      </section>
    `;

    document.getElementById('btn-calc-survival')?.addEventListener('click', () => {
      this.calculateSurvival();
    });
  },

  calculateSurvival() {
    const exp = parseInt(document.getElementById('survival-exp').value);
    const physical = parseInt(document.getElementById('survival-physical').value);
    const mental = parseInt(document.getElementById('survival-mental').value);
    const factionId = document.getElementById('survival-faction').value;
    const scene = document.getElementById('survival-scene').value;
    const faction = this.getFaction(factionId);

    const formContainer = document.getElementById('survival-form-container');
    const resultContainer = document.getElementById('survival-result');

    // 场景危险系数
    const sceneMultiplier = { patrol: 0.5, battle: 1, hive: 1.5, boarding: 2.5 };
    // 阵营存活系数
    const factionMultiplier = {
      imperium: 0.8, chaos: 0.6, eldar: 1.2, 'dark-eldar': 0.9,
      orks: 1.0, tau: 1.1, necrons: 1.5, tyranids: 1.3, votann: 1.1
    };

    const totalScore = (exp + physical + mental) * factionMultiplier[factionId] / sceneMultiplier[scene];

    // 计算存活时间
    let time, unit;
    if (totalScore > 12) { time = this.randomNum(5, 50); unit = '年'; }
    else if (totalScore > 9) { time = this.randomNum(1, 12); unit = '年'; }
    else if (totalScore > 6) { time = this.randomNum(30, 365); unit = '天'; }
    else if (totalScore > 3) { time = this.randomNum(1, 72); unit = '小时'; }
    else { time = this.randomNum(3, 60); unit = '分钟'; }

    const deathCause = this.randomItem(RANK_GENERATOR.deathCauses[factionId]);
    const honorRating = RANK_GENERATOR.honorRatings.find(r => totalScore >= r.min);
    const funnyComment = this.randomItem(RANK_GENERATOR.funnyComments[factionId]).replace('{score}', this.randomNum(20, 80));

    formContainer.style.display = 'none';
    resultContainer.style.display = 'block';

    resultContainer.innerHTML = `
      <div class="survival-result">
        <p style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px;">预期存活时间</p>
        <div class="survival-time">${time} <span class="survival-unit">${unit}</span></div>
        <p style="font-size: 14px; color: var(--text-secondary);">在 ${faction.name} 的${({ patrol: '常规巡逻', battle: '主力会战', hive: '巢都清剿', boarding: '太空登舰' })[scene]}中</p>

        <div class="survival-stats">
          <div class="survival-stat">
            <div class="stat-label">最可能阵亡方式</div>
            <div class="stat-value">${deathCause}</div>
          </div>
          <div class="survival-stat">
            <div class="stat-label">阵亡后荣誉评级</div>
            <div class="stat-value">${honorRating.name}</div>
            <div style="font-size: 12px; color: var(--text-muted); margin-top: 4px;">${honorRating.desc.replace('{num}', this.randomNum(1000, 99999))}</div>
          </div>
          <div class="survival-stat">
            <div class="stat-label">综合评价</div>
            <div class="stat-value" style="font-size: 14px; line-height: 1.6;">${funnyComment}</div>
          </div>
        </div>

        <div style="margin-top: 32px;">
          <button class="btn btn-secondary btn-sm" id="btn-survival-retry">重新计算</button>
        </div>
      </div>
    `;

    document.getElementById('btn-survival-retry')?.addEventListener('click', () => {
      formContainer.style.display = 'block';
      resultContainer.style.display = 'none';
    });
  },

  // ============================================================
  // 每日征兵签
  // ============================================================
  renderDaily() {
    const container = document.getElementById('page-daily');
    const today = new Date().toDateString();
    const alreadyDrawn = localStorage.getItem('fortune_date') === today;

    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Daily Fortune</p>
            <h2 class="section-title">每日征兵签</h2>
            <div class="divider"></div>
            <p class="section-desc">每日限抽一次，抽取今日战锤运势。</p>
          </div>

          <div id="daily-content" style="max-width: 500px; margin: 0 auto;">
            ${alreadyDrawn ? this.renderFortuneResult() : `
              <div style="text-align: center; padding: 48px 0;">
                <div style="font-size: 80px; margin-bottom: 24px; cursor: pointer; transition: transform 0.3s;" id="fortune-dice">🎲</div>
                <p style="font-size: 16px; color: var(--text-secondary); margin-bottom: 32px;">点击骰子抽取今日运势</p>
                <button class="btn btn-primary btn-press" id="btn-draw-fortune">抽取今日运势</button>
              </div>
            `}
          </div>
        </div>
      </section>
    `;

    if (!alreadyDrawn) {
      document.getElementById('btn-draw-fortune')?.addEventListener('click', () => {
        this.drawFortune();
      });
      document.getElementById('fortune-dice')?.addEventListener('click', () => {
        this.drawFortune();
      });
    }
  },

  drawFortune() {
    const today = new Date().toDateString();
    localStorage.setItem('fortune_date', today);

    // 基于日期的伪随机
    const seed = today.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const levelIndex = seed % FORTUNE_LEVELS.length;
    const fortune = FORTUNE_LEVELS[levelIndex];
    const advice = FORTUNE_ADVICE[fortune.id];
    const faction = this.randomItem(FACTIONS);
    const quote = this.randomItem(faction.quotes);

    localStorage.setItem('fortune_data', JSON.stringify({ fortune, advice, faction, quote }));

    document.getElementById('daily-content').innerHTML = this.renderFortuneResult();
  },

  renderFortuneResult() {
    let data;
    const saved = localStorage.getItem('fortune_data');
    if (saved) {
      data = JSON.parse(saved);
    } else {
      const fortune = FORTUNE_LEVELS[0];
      const advice = FORTUNE_ADVICE[fortune.id];
      const faction = FACTIONS[0];
      const quote = faction.quotes[0];
      data = { fortune, advice, faction, quote };
    }

    return `
      <div class="fortune-card" style="border-color: ${data.fortune.color};">
        <div class="fortune-icon">${data.fortune.icon}</div>
        <div class="fortune-level" style="color: ${data.fortune.color};">${data.fortune.name}</div>
        <div class="fortune-desc">${data.fortune.desc}</div>

        <div class="fortune-advice">
          <h4>今日宜</h4>
          <ul>
            ${data.advice.good.slice(0, 3).map(g => `<li class="good">${g}</li>`).join('')}
          </ul>
          <h4 style="margin-top: 16px;">今日忌</h4>
          <ul>
            ${data.advice.bad.slice(0, 3).map(b => `<li class="bad">${b}</li>`).join('')}
          </ul>
        </div>

        <div class="fortune-quote">
          「${data.quote}」—— ${data.faction.name}
        </div>
      </div>
    `;
  },

  // ============================================================
  // 军衔生成器
  // ============================================================
  renderRank() {
    const container = document.getElementById('page-rank');
    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Rank Generator</p>
            <h2 class="section-title">40K风格军衔头衔生成器</h2>
            <div class="divider"></div>
            <p class="section-desc">输入你的名字，生成符合阵营风格的完整军衔与头衔。</p>
          </div>

          <div style="max-width: 600px; margin: 0 auto;">
            <div class="form-group">
              <label class="form-label">你的昵称 *</label>
              <input type="text" class="form-input" id="rank-name" placeholder="输入你的昵称" value="新兵">
            </div>
            <div class="form-group">
              <label class="form-label">选择阵营</label>
              <select class="form-select" id="rank-faction">
                ${FACTIONS.map(f => `<option value="${f.id}">${f.icon} ${f.name}</option>`).join('')}
              </select>
            </div>
            <div style="text-align: center; margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
              <button class="btn btn-primary btn-press" id="btn-gen-rank">生成军衔</button>
              <button class="btn btn-secondary btn-press" id="btn-random-rank">随机生成</button>
            </div>
          </div>

          <div id="rank-result" style="display: none;"></div>
        </div>
      </section>
    `;

    document.getElementById('btn-gen-rank')?.addEventListener('click', () => {
      this.generateRank(false);
    });
    document.getElementById('btn-random-rank')?.addEventListener('click', () => {
      this.generateRank(true);
    });
  },

  generateRank(isRandom) {
    const nameInput = document.getElementById('rank-name');
    const factionSelect = document.getElementById('rank-faction');
    const resultContainer = document.getElementById('rank-result');

    let name = nameInput.value.trim() || '无名战士';
    let factionId = factionSelect.value;

    if (isRandom) {
      name = ['格里芬', '凯恩', '沃里克', '赛勒斯', '阿瑞斯', '索拉里安', '达克斯', '诺瓦', '雷克斯', '卡尔加'][this.randomNum(0, 9)];
      factionId = FACTIONS[this.randomNum(0, FACTIONS.length - 1)].id;
      nameInput.value = name;
      factionSelect.value = factionId;
    }

    if (!name) {
      this.showToast('请输入昵称', 'error');
      return;
    }

    const faction = this.getFaction(factionId);
    const prefix = this.randomItem(RANK_GENERATOR.prefixes[factionId]);
    const rank = this.randomItem(RANK_GENERATOR.ranks[factionId]);
    const suffix = this.randomItem(RANK_GENERATOR.suffixes[factionId]).replace('{num}', this.randomNum(1, 999));
    const position = this.randomItem(RANK_GENERATOR.positions[factionId]);

    const fullTitle = `${prefix} ${rank} ${name}，${suffix} ${position}`;

    resultContainer.style.display = 'block';
    resultContainer.innerHTML = `
      <div class="rank-result">
        <p style="font-size: 14px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 2px;">你的军衔头衔</p>
        <div class="rank-display" style="border-color: ${faction.theme.secondary};">${fullTitle}</div>
        <div class="rank-breakdown">
          <span><span class="label">荣誉称号</span>${prefix}</span>
          <span><span class="label">军衔</span>${rank}</span>
          <span><span class="label">所属部队</span>${suffix}</span>
          <span><span class="label">职位</span>${position}</span>
        </div>
        <div style="margin-top: 24px; display: flex; gap: 12px; justify-content: center;">
          <button class="btn btn-secondary btn-sm" id="btn-copy-rank">复制头衔</button>
          <button class="btn btn-secondary btn-sm" id="btn-regen-rank">换一个</button>
        </div>
      </div>
    `;

    document.getElementById('btn-copy-rank')?.addEventListener('click', () => {
      navigator.clipboard?.writeText(fullTitle).then(() => {
        this.showToast('头衔已复制', 'success');
      });
    });

    document.getElementById('btn-regen-rank')?.addEventListener('click', () => {
      this.generateRank(false);
    });
  },

  // ============================================================
  // 新兵留言板
  // ============================================================
  renderMessage() {
    const container = document.getElementById('page-message');
    const messages = this.getMessages();

    container.innerHTML = `
      <section class="section" style="padding-top: 40px;">
        <div class="container">
          <div class="section-header">
            <p class="section-label">Message Board</p>
            <h2 class="section-title">新兵报到留言板</h2>
            <div class="divider"></div>
            <p class="section-desc">留下你的报到宣言，让全银河听到你的声音。</p>
          </div>

          <!-- 发言区 -->
          <div style="max-width: 600px; margin: 0 auto 48px; padding: 24px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: var(--radius);">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 16px;">
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">你的昵称</label>
                <input type="text" class="form-input" id="msg-name" placeholder="输入昵称">
              </div>
              <div class="form-group" style="margin-bottom: 0;">
                <label class="form-label">选择阵营</label>
                <select class="form-select" id="msg-faction">
                  ${FACTIONS.map(f => `<option value="${f.id}">${f.icon} ${f.name}</option>`).join('')}
                </select>
              </div>
            </div>
            <div class="form-group">
              <textarea class="form-textarea" id="msg-content" placeholder="写下你的报到宣言..." rows="3"></textarea>
            </div>
            <button class="btn btn-primary btn-sm" id="btn-send-msg">发表留言</button>
          </div>

          <!-- 留言列表 -->
          <div class="message-list" id="message-list">
            ${messages.map(m => this.renderMessageItem(m)).join('')}
          </div>
        </div>
      </section>
    `;

    document.getElementById('btn-send-msg')?.addEventListener('click', () => {
      this.sendMessage();
    });
  },

  getMessages() {
    const stored = localStorage.getItem('wh40k_messages');
    if (stored) {
      return JSON.parse(stored);
    }
    // 初始化NPC留言
    localStorage.setItem('wh40k_messages', JSON.stringify(NPC_MESSAGES));
    return [...NPC_MESSAGES];
  },

  renderMessageItem(msg) {
    const faction = this.getFaction(msg.faction) || FACTIONS[0];
    return `
      <div class="message-item">
        <div class="message-avatar" style="background: ${faction.theme.primary}; border-color: ${faction.theme.secondary};">
          ${faction.icon}
        </div>
        <div class="message-body">
          <div class="message-header">
            <span class="message-name">${msg.name}</span>
            <span class="message-faction-tag" style="background: ${faction.theme.primary}; color: ${faction.theme.secondary};">${faction.name}</span>
            <span class="message-time">${msg.time}</span>
          </div>
          <div class="message-content">${msg.content}</div>
        </div>
      </div>
    `;
  },

  sendMessage() {
    const name = document.getElementById('msg-name').value.trim();
    const faction = document.getElementById('msg-faction').value;
    const content = document.getElementById('msg-content').value.trim();

    if (!name || !content) {
      this.showToast('请填写昵称和留言内容', 'error');
      return;
    }

    const messages = this.getMessages();
    const newMsg = {
      name,
      faction,
      content,
      time: '刚刚'
    };

    messages.unshift(newMsg);
    localStorage.setItem('wh40k_messages', JSON.stringify(messages));

    // 刷新列表
    const list = document.getElementById('message-list');
    const newItem = document.createElement('div');
    newItem.innerHTML = this.renderMessageItem(newMsg);
    list.insertBefore(newItem.firstElementChild, list.firstChild);

    // 清空表单
    document.getElementById('msg-name').value = '';
    document.getElementById('msg-content').value = '';

    this.showToast('留言发表成功！', 'success');
  },

  // --- 绑定页面内导航 ---
  bindPageNavs(container) {
    container.querySelectorAll('[data-nav]').forEach(el => {
      el.addEventListener('click', (e) => {
        e.preventDefault();
        const page = el.dataset.nav;
        const params = {};
        if (el.dataset.faction) params.id = el.dataset.faction;
        this.navigate(page, params);
      });
    });
  }
};

// --- 启动 ---
document.addEventListener('DOMContentLoaded', () => {
  App.init();
  App.renderHome();
});
