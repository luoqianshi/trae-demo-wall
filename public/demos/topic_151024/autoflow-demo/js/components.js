/**
 * AutoFlow — UI 组件库
 * 所有页面的渲染逻辑
 */
const Components = {

  // SVG 图标
  icons: {
    home: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>',
    create: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>',
    tasks: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    plugin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>',
    bell: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
    logo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M13 2L3 14h9l-1 8 10-12h-9z"/></svg>',
  },

  // ====== Landing Page ======
  landing() {
    return `
    <div class="landing">
      <div class="bg-effects">
        <div class="bg-grid"></div>
        <div class="bg-orb bg-orb-1"></div>
        <div class="bg-orb bg-orb-2"></div>
        <div class="bg-orb bg-orb-3"></div>
      </div>
      <nav class="landing-nav" id="landingNav">
        <div class="nav-brand" onclick="App.navigate('dashboard')">
          <div class="logo-mark">${this.icons.logo}</div>
          <span>AutoFlow</span>
        </div>
        <ul class="nav-links">
          <li><a href="#pain">痛点</a></li>
          <li><a href="#how">原理</a></li>
          <li><a href="#features">特性</a></li>
          <li><a href="#value">价值</a></li>
          <li><a href="#users">用户</a></li>
        </ul>
        <div class="nav-cta">
          <button class="btn btn-ghost btn-sm" onclick="App.navigate('dashboard')">登录</button>
          <button class="btn btn-primary btn-sm" onclick="App.navigate('dashboard')">进入工作台</button>
        </div>
      </nav>

      <section class="hero">
        <div class="hero-badge"><span class="pulse-dot"></span> TRAE AI 创造力大赛 · 学习工作赛道</div>
        <h1>说一句话<br><span class="gradient-text">自动化一切</span></h1>
        <p class="hero-sub">AutoFlow 是 AI 驱动的智能工作流自动化引擎。用自然语言描述任务，AI 自动理解意图、生成流程并执行——让重复性工作从此消失。</p>
        <div class="hero-cta">
          <button class="btn btn-primary btn-lg" onclick="App.navigate('dashboard')">立即体验</button>
          <button class="btn btn-secondary btn-lg" onclick="document.getElementById('pain').scrollIntoView({behavior:'smooth'})">查看演示</button>
        </div>
        <div class="terminal-demo">
          <div class="terminal">
            <div class="terminal-bar">
              <span class="t-dot r"></span><span class="t-dot y"></span><span class="t-dot g"></span>
              <span class="t-title">AutoFlow v0.1 — AI Workflow Engine</span>
            </div>
            <div class="terminal-body" id="terminalBody"></div>
          </div>
        </div>
      </section>

      <section class="landing-section reveal" id="pain">
        <div class="section-tag pink">痛点分析</div>
        <h2 class="section-title">每天被重复操作<br>偷走多少时间？</h2>
        <p class="section-desc">职场人平均每天花 1-2 小时做重复性数据搬运、表单填写和文件整理。这些机械任务毫无创造性，却消耗了最宝贵的注意力。</p>
        <div class="cards-2">
          <div class="card"><div class="card-icon pink">😰</div><h3>RPA 学习成本高</h3><p>传统 RPA 工具需要专业培训，编写脚本、调试流程，普通打工人根本用不起来。</p></div>
          <div class="card"><div class="card-icon pink">💔</div><h3>固定脚本易崩溃</h3><p>页面稍微改版，脚本就跑不通了。维护成本远超预期，最终沦为"半成品"。</p></div>
          <div class="card"><div class="card-icon pink">🤖</div><h3>缺乏智能决策</h3><p>现有工具只能按预设步骤执行，遇到弹窗、验证码、异常情况就卡住不动。</p></div>
          <div class="card"><div class="card-icon pink">🔒</div><h3>依赖开发人员</h3><p>普通用户无法自行创建自动化流程，每次需求变更都要排队等开发排期。</p></div>
        </div>
      </section>

      <section class="landing-section reveal" id="how">
        <div class="section-tag purple">工作原理</div>
        <h2 class="section-title">三步完成自动化</h2>
        <p class="section-desc">从自然语言到自动执行，AutoFlow 让自动化像说话一样简单。</p>
        <div class="steps">
          <div class="step"><div class="step-num">1</div><div class="step-body"><h3>描述你的任务</h3><p>用自然语言告诉 AutoFlow 你想做什么，不需要任何代码或技术术语。</p><div class="step-demo">💬 "每天早上9点从OA系统导出昨日销售数据，整理成Excel发到部门群"</div></div></div>
          <div class="step"><div class="step-num">2</div><div class="step-body"><h3>AI 生成自动化流程</h3><p>AutoFlow 的 AI 引擎理解意图，自动拆解步骤、识别操作对象，生成可执行的自动化流程图。</p><div class="step-demo">✅ 解析意图 → 识别系统 → 拆解步骤 → 生成流程 → 用户确认</div></div></div>
          <div class="step"><div class="step-num">3</div><div class="step-body"><h3>自动执行与监控</h3><p>确认后 AutoFlow 自动执行流程，实时监控状态，遇到异常智能恢复，完成后推送结果。</p><div class="step-demo">🚀 执行中... → 数据导出 ✓ → 格式整理 ✓ → 群消息发送 ✓ → 完成！</div></div></div>
        </div>
      </section>

      <section class="landing-section reveal" id="features">
        <div class="section-tag teal">核心特性</div>
        <h2 class="section-title">不只是自动化<br>更是智能自动化</h2>
        <p class="section-desc">AutoFlow 将 AI 的理解力与自动化的执行力结合，打造真正智能的工作流引擎。</p>
        <div class="cards-3">
          <div class="card"><div class="card-icon purple">🧠</div><h3>自然语言驱动</h3><p>用日常语言描述任务，AI 自动理解意图并生成流程，零代码门槛。</p></div>
          <div class="card"><div class="card-icon teal">🔄</div><h3>自适应执行</h3><p>AI 实时感知页面变化，自动调整操作策略，告别脚本崩溃。</p></div>
          <div class="card"><div class="card-icon pink">🛡️</div><h3>异常智能恢复</h3><p>遇到弹窗、验证码、网络异常，AI 自主决策处理方案，无需人工干预。</p></div>
          <div class="card"><div class="card-icon purple">📊</div><h3>流程可视化</h3><p>自动生成流程图，每一步操作清晰可见，执行状态实时追踪。</p></div>
          <div class="card"><div class="card-icon teal">🔗</div><h3>MCP 插件生态</h3><p>支持 MCP 协议，可连接飞书、钉钉、企业微信等办公平台，无限扩展。</p></div>
          <div class="card"><div class="card-icon warm">⏰</div><h3>定时调度</h3><p>支持 Cron 定时执行，设置一次持续运行，结果自动推送通知。</p></div>
        </div>
      </section>

      <section class="landing-section reveal">
        <div class="section-tag purple">数据说话</div>
        <h2 class="section-title">用数字证明价值</h2>
        <p class="section-desc">AutoFlow 为用户带来的不只是便利，更是实实在在的时间与效率提升。</p>
        <div class="stats-grid">
          <div class="stat-card"><div class="stat-num">5h+</div><div class="stat-label">每周节省时间</div></div>
          <div class="stat-card"><div class="stat-num">80%</div><div class="stat-label">维护成本降低</div></div>
          <div class="stat-card"><div class="stat-num">0</div><div class="stat-label">代码门槛</div></div>
          <div class="stat-card"><div class="stat-num">10x</div><div class="stat-label">效率提升</div></div>
        </div>
      </section>

      <section class="landing-section reveal" id="value">
        <div class="section-tag teal">价值与意义</div>
        <h2 class="section-title">让时间回归创造</h2>
        <p class="section-desc">AutoFlow 不只是效率工具，更是重新定义人与工作的关系。</p>
        <div class="cards-2">
          <div class="card" style="background:linear-gradient(135deg,var(--accent-primary-dim),var(--accent-secondary-dim));">
            <div class="card-tag" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent-secondary);margin-bottom:12px;">商业价值</div>
            <h3 style="font-size:22px;margin-bottom:10px;">从个人工具到企业平台</h3>
            <p>个人免费版快速获客，团队协作版和企业版构建商业模式。MCP 插件市场连接生态，形成网络效应。</p>
          </div>
          <div class="card" style="background:linear-gradient(135deg,rgba(255,107,157,0.08),rgba(255,200,87,0.05));">
            <div class="card-tag" style="font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;color:var(--accent-tertiary);margin-bottom:12px;">效率提升</div>
            <h3 style="font-size:22px;margin-bottom:10px;">从 2 小时到 2 分钟</h3>
            <p>将用户从每天 1-2 小时的重复操作中解放出来。AI 自适应能力让维护成本降低 80%，一次配置持续运行。</p>
          </div>
        </div>
      </section>

      <section class="landing-section reveal" id="users">
        <div class="section-tag purple">目标用户</div>
        <h2 class="section-title">谁最需要 AutoFlow？</h2>
        <p class="section-desc">任何被重复性工作困扰的职场人，都是 AutoFlow 的潜在用户。</p>
        <div class="cards-4">
          <div class="card" style="text-align:center;"><div style="font-size:36px;margin-bottom:12px;">👩‍💼</div><h3 style="font-size:15px;">运营人员</h3><p style="font-size:12px;">每日数据搬运、报表整理、多平台发布</p></div>
          <div class="card" style="text-align:center;"><div style="font-size:36px;margin-bottom:12px;">👨‍💻</div><h3 style="font-size:15px;">数据分析师</h3><p style="font-size:12px;">定期导出数据、格式转换、报告生成</p></div>
          <div class="card" style="text-align:center;"><div style="font-size:36px;margin-bottom:12px;">👩‍🔧</div><h3 style="font-size:15px;">行政人员</h3><p style="font-size:12px;">表单填写、文件归档、通知发送</p></div>
          <div class="card" style="text-align:center;"><div style="font-size:36px;margin-bottom:12px;">👨‍🎓</div><h3 style="font-size:15px;">学生/研究者</h3><p style="font-size:12px;">文献收集、数据清洗、笔记整理</p></div>
        </div>
      </section>

      <section class="landing-section reveal">
        <div class="cta-box">
          <h2>准备好让 AI 替你工作了吗？</h2>
          <p>AutoFlow — 说一句话，自动化一切。加入我们，重新定义工作方式。</p>
          <button class="btn btn-primary btn-lg" onclick="App.navigate('dashboard')">开始使用 AutoFlow</button>
        </div>
      </section>

      <footer style="text-align:center;padding:40px;border-top:1px solid var(--border-light);color:var(--text-muted);font-size:13px;position:relative;z-index:1;">
        <span style="font-family:'Space Grotesk',sans-serif;font-weight:600;color:var(--text-secondary);">AutoFlow</span> · AI 驱动的智能工作流自动化引擎<br>
        TRAE AI 创造力大赛 · 学习工作赛道 · 2026
      </footer>
    </div>`;
  },

  // ====== Landing 终端动画 ======
  startTerminalAnim() {
    const lines = [
      { html: '<span class="t-prompt">❯</span> <span class="t-cmd">autoflow run</span> "<span class="t-hl">每天早上9点从OA系统导出昨日销售数据，整理成Excel发到部门群</span>"' },
      { html: '<span class="t-ai">[AI]</span> 正在分析任务意图...' },
      { html: '<span class="t-ai">[AI]</span> 识别到 <span class="t-hl">4</span> 个操作步骤：' },
      { html: '<span class="t-out"><span class="t-step">Step 1</span>  登录 OA 系统 → 导出销售数据</span>' },
      { html: '<span class="t-out"><span class="t-step">Step 2</span>  数据格式化 → 生成 Excel 文件</span>' },
      { html: '<span class="t-out"><span class="t-step">Step 3</span>  发送文件到部门群</span>' },
      { html: '' },
      { html: '<span class="t-ai">[AI]</span> 流程已生成，是否确认执行？<span class="t-hl">[Y/n]</span>' },
      { html: '<span class="t-prompt">❯</span> <span class="t-cmd">Y</span>' },
      { html: '' },
      { html: '<span class="t-ok">✓</span> Step 1: 登录 OA 系统... <span class="t-ok">完成</span>' },
      { html: '<span class="t-ok">✓</span> Step 2: 导出销售数据... <span class="t-ok">完成</span> (1,247 条记录)' },
      { html: '<span class="t-ok">✓</span> Step 3: 数据格式化... <span class="t-ok">完成</span> (sales_20260628.xlsx)' },
      { html: '<span class="t-ok">✓</span> Step 4: 发送到部门群... <span class="t-ok">完成</span>' },
      { html: '' },
      { html: '<span class="t-ok">🎉 任务执行成功！</span> 已设置每日 09:00 自动运行。' },
    ];
    const body = document.getElementById('terminalBody');
    if (!body) return;
    body.innerHTML = '';
    let i = 0;
    const addLine = () => {
      if (i >= lines.length) {
        const cursor = document.createElement('span');
        cursor.className = 't-cursor';
        body.appendChild(cursor);
        return;
      }
      const div = document.createElement('div');
      div.className = 't-line';
      div.innerHTML = lines[i].html;
      body.appendChild(div);
      i++;
      setTimeout(addLine, lines[i - 1].html.includes('Step') || lines[i - 1].html.includes('✓') ? 350 : 280);
    };
    setTimeout(addLine, 500);
  },

  // ====== App Shell (Sidebar + Topbar) ======
  shell(content, activeRoute) {
    const navItems = [
      { route: 'dashboard', label: '工作台', icon: 'home' },
      { route: 'create', label: '创建任务', icon: 'create' },
      { route: 'tasks', label: '任务管理', icon: 'tasks' },
      { route: 'plugins', label: '插件市场', icon: 'plugin' },
      { route: 'settings', label: '设置', icon: 'settings' },
    ];
    const navHtml = navItems.map(item => `
      <a class="nav-item ${activeRoute === item.route ? 'active' : ''}" onclick="App.navigate('${item.route}')">
        ${this.icons[item.icon]}
        <span>${item.label}</span>
      </a>
    `).join('');

    const titles = { dashboard: '工作台', create: '创建任务', tasks: '任务管理', plugins: '插件市场', settings: '设置' };

    return `
    <div class="bg-effects"><div class="bg-grid"></div><div class="bg-orb bg-orb-1"></div><div class="bg-orb bg-orb-2"></div></div>
    <div class="app-layout">
      <aside class="sidebar">
        <div class="sidebar-brand" onclick="App.navigate('landing')">
          <div class="logo-mark">${this.icons.logo}</div>
          <span>AutoFlow</span>
        </div>
        <nav class="sidebar-nav">${navHtml}</nav>
        <div class="sidebar-footer">
          <div class="sidebar-user">
            <div class="user-avatar">飞</div>
            <div class="user-info"><div class="user-name">黄振飞</div><div class="user-plan">Pro 会员</div></div>
          </div>
        </div>
      </aside>
      <div class="main">
        <header class="topbar">
          <div class="topbar-left">
            <div class="topbar-title">${titles[activeRoute] || 'AutoFlow'}</div>
          </div>
          <div class="topbar-right">
            <button class="btn btn-primary btn-sm" onclick="App.navigate('create')">${this.icons.create}<span>新建任务</span></button>
            <button class="icon-btn">${this.icons.bell}</button>
          </div>
        </header>
        <div class="page-content">${content}</div>
      </div>
    </div>`;
  },

  // ====== Dashboard ======
  dashboard() {
    const s = Store.state.stats;
    const recentTasks = Store.state.tasks.slice(0, 4);
    const maxVal = Math.max(...s.weeklyTrend);
    const days = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];

    const statCards = [
      { icon: '⏱️', val: s.timeSaved + 'h', label: '累计节省时间', trend: '+12.5%', color: 'purple' },
      { icon: '✅', val: s.tasksExecuted, label: '已执行任务', trend: '+8', color: 'teal' },
      { icon: '🔄', val: s.activeFlows, label: '活跃自动化', trend: '+1', color: 'pink' },
      { icon: '📈', val: '98.2%', label: '执行成功率', trend: '+0.3%', color: 'warm' },
    ].map(c => `
      <div class="dash-stat">
        <div class="dash-stat-icon card-icon ${c.color}">${c.icon}</div>
        <div class="dash-stat-val">${c.val}</div>
        <div class="dash-stat-label">${c.label}</div>
        <div class="dash-stat-trend">↑ ${c.trend}</div>
      </div>
    `).join('');

    const chartBars = s.weeklyTrend.map((val, i) => `
      <div class="chart-bar">
        <div class="chart-bar-fill" style="height:${(val / maxVal) * 140}px"></div>
        <div class="chart-bar-label">${days[i]}</div>
      </div>
    `).join('');

    const taskRows = recentTasks.map(t => `
      <div class="task-row" onclick="App.navigate('task:${t.id}')">
        <div class="task-status ${t.status}"></div>
        <div class="task-name">${t.name}</div>
        <div class="task-time">${Store.formatTime(t.createdAt)}</div>
      </div>
    `).join('');

    return `
      <div class="dash-grid">${statCards}</div>
      <div class="dash-row">
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">本周执行趋势</div>
            <button class="btn btn-ghost btn-sm">查看详情</button>
          </div>
          <div class="panel-body">
            <div class="chart-bars">${chartBars}</div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header">
            <div class="panel-title">最近任务</div>
            <button class="btn btn-ghost btn-sm" onclick="App.navigate('tasks')">全部</button>
          </div>
          <div class="panel-body">${taskRows}</div>
        </div>
      </div>
      <div class="panel">
        <div class="panel-header">
          <div class="panel-title">快捷操作</div>
        </div>
        <div class="panel-body">
          <div class="quick-actions">
            <div class="quick-action" onclick="App.navigate('create')">
              <div class="quick-action-icon">✨</div>
              <div class="quick-action-label">AI 创建任务</div>
              <div class="quick-action-desc">用自然语言描述，自动生成流程</div>
            </div>
            <div class="quick-action" onclick="App.navigate('tasks')">
              <div class="quick-action-icon">📋</div>
              <div class="quick-action-label">管理任务</div>
              <div class="quick-action-desc">查看、编辑、调度自动化任务</div>
            </div>
            <div class="quick-action" onclick="App.navigate('plugins')">
              <div class="quick-action-icon">🔌</div>
              <div class="quick-action-label">安装插件</div>
              <div class="quick-action-desc">连接飞书、钉钉等办公平台</div>
            </div>
            <div class="quick-action" onclick="App.navigate('create')">
              <div class="quick-action-icon">📊</div>
              <div class="quick-action-label">查看模板</div>
              <div class="quick-action-desc">使用预设场景快速开始</div>
            </div>
          </div>
        </div>
      </div>`;
  },

  // ====== Create Task Page ======
  create() {
    const examples = Scenarios.examples();
    const chipsHtml = examples.map(text => {
      const short = text.length > 30 ? text.slice(0, 30) + '...' : text;
      return `<div class="chip" onclick="Components.fillExample('${text.replace(/'/g, "\\'")}')">${short}</div>`;
    }).join('');

    return `
      <div class="create-container">
        <div class="input-zone">
          <h2>描述你的自动化任务</h2>
          <p>用自然语言告诉 AutoFlow 你想做什么，AI 会自动理解并生成执行流程。</p>
          <div class="task-input-wrap">
            <textarea class="task-input" id="taskInput" placeholder="例如：每天早上9点从OA系统导出昨日销售数据，整理成Excel发到部门群"></textarea>
            <div class="input-actions">
              <button class="btn btn-primary btn-sm" id="parseBtn" onclick="Components.startParse()">
                ${this.icons.bolt} AI 解析
              </button>
            </div>
          </div>
          <div class="example-chips">
            <span style="font-size:12px;color:var(--text-muted);margin-right:4px;">试试：</span>
            ${chipsHtml}
          </div>
        </div>
        <div id="parseZone"></div>
        <div id="flowZone"></div>
        <div id="execZone"></div>
      </div>`;
  },

  // 填充示例
  fillExample(text) {
    const input = document.getElementById('taskInput');
    if (input) { input.value = text; input.focus(); }
  },

  // 开始 AI 解析
  async startParse() {
    const input = document.getElementById('taskInput');
    if (!input || !input.value.trim()) {
      Store.toast('请先输入任务描述', 'error');
      return;
    }
    const text = input.value.trim();
    document.getElementById('parseBtn').disabled = true;
    const parseZone = document.getElementById('parseZone');
    const flowZone = document.getElementById('flowZone');
    const execZone = document.getElementById('execZone');
    flowZone.innerHTML = '';
    execZone.innerHTML = '';

    // 显示解析动画
    parseZone.innerHTML = `
      <div class="ai-parsing">
        <div class="parse-header">
          <div class="parse-spinner"></div>
          <div style="font-size:15px;font-weight:600;">AI 正在分析你的任务...</div>
        </div>
        <div class="parse-steps" id="parseSteps"></div>
      </div>`;

    const stepsContainer = document.getElementById('parseSteps');
    await FlowEngine.simulateParse(text, (step) => {
      const div = document.createElement('div');
      div.className = 'parse-step-item' + (step.done ? ' done' : '');
      div.style.animationDelay = '0s';
      div.textContent = step.text;
      stepsContainer.appendChild(div);
    });

    // 解析完成
    const parsed = FlowEngine.parse(text);
    Store.state.currentParsed = parsed;
    parseZone.innerHTML = '';
    this.showFlowResult(parsed);
    document.getElementById('parseBtn').disabled = false;
  },

  // 显示流程结果
  showFlowResult(parsed) {
    const flowZone = document.getElementById('flowZone');
    const stepsHtml = parsed.steps.map((step, i) => {
      const connector = i < parsed.steps.length - 1 ? '<div class="flow-connector" id="conn-' + step.id + '"></div>' : '';
      return `
        <div class="flow-node" id="node-${step.id}">
          <div class="flow-node-head">
            <div class="flow-node-icon card-icon purple">${step.icon}</div>
            <div class="flow-node-title">${step.title}</div>
            <div class="flow-node-status pending" id="status-${step.id}">待执行</div>
          </div>
          <div class="flow-node-detail">${step.detail}</div>
        </div>
        ${connector}
      `;
    }).join('');

    flowZone.innerHTML = `
      <div class="flow-result">
        <div class="flow-header">
          <div>
            <div class="flow-name">${parsed.taskName}</div>
            <div class="flow-meta" style="margin-top:6px;">
              <span>📅 ${parsed.trigger}</span>
              <span>🎯 置信度 ${parsed.confidence}%</span>
              <span>📦 ${parsed.steps.length} 个步骤</span>
            </div>
          </div>
          <div style="display:flex;gap:10px;">
            <button class="btn btn-secondary btn-sm" onclick="Components.startParse()">重新解析</button>
            <button class="btn btn-primary btn-sm" onclick="Components.startExecution()">${this.icons.bolt} 执行流程</button>
          </div>
        </div>
        <div class="flow-body">
          <div class="flow-chart">${stepsHtml}</div>
        </div>
      </div>`;
  },

  // 开始执行
  async startExecution() {
    const parsed = Store.state.currentParsed;
    if (!parsed) return;
    const execZone = document.getElementById('execZone');
    execZone.innerHTML = `
      <div class="flow-result">
        <div class="flow-header">
          <div class="flow-name">执行日志</div>
          <div class="flow-meta"><span class="pulse-dot"></span> 执行中...</div>
        </div>
        <div class="flow-body">
          <div class="exec-log" id="execLog"></div>
        </div>
      </div>`;

    const logContainer = document.getElementById('execLog');
    Store.state.isExecuting = true;

    // 创建任务记录
    const taskId = 't' + Date.now();
    const task = {
      id: taskId,
      scenarioId: parsed.scenarioId,
      name: parsed.taskName,
      input: parsed.inputText,
      icon: parsed.icon,
      status: 'running',
      createdAt: Date.now(),
      trigger: parsed.trigger,
      steps: parsed.steps,
      result: null,
    };

    await FlowEngine.execute(
      parsed.steps,
      // onStepStart
      (i, step) => {
        const node = document.getElementById('node-' + step.id);
        const status = document.getElementById('status-' + step.id);
        if (node) { node.classList.add('active'); }
        if (status) { status.className = 'flow-node-status running'; status.textContent = '执行中'; }
        const log = document.createElement('div');
        log.className = 'log-line';
        log.innerHTML = `<span class="log-time">[${step.logs[0].t}]</span> <span class="log-warn">▶ ${step.title}</span>`;
        logContainer.appendChild(log);
        logContainer.scrollTop = logContainer.scrollHeight;
      },
      // onLog
      (i, logEntry) => {
        const log = document.createElement('div');
        log.className = 'log-line';
        const cls = logEntry.level === 'ok' ? 'log-ok' : 'log-info';
        log.innerHTML = `<span class="log-time">[${logEntry.t}]</span> <span class="${cls}">${logEntry.level === 'ok' ? '✓ ' : '  '}${logEntry.msg}</span>`;
        logContainer.appendChild(log);
        logContainer.scrollTop = logContainer.scrollHeight;
      },
      // onStepDone
      (i, step) => {
        const node = document.getElementById('node-' + step.id);
        const status = document.getElementById('status-' + step.id);
        const conn = document.getElementById('conn-' + step.id);
        if (node) { node.classList.remove('active'); node.classList.add('done'); }
        if (status) { status.className = 'flow-node-status done'; status.textContent = '完成'; }
        if (conn) { conn.classList.add('done'); }
      },
      // onComplete
      () => {
        task.status = 'success';
        task.result = parsed.result;
        Store.addTask(task);
        Store.state.isExecuting = false;

        // 显示结果卡片
        const resultHtml = `
          <div class="result-card">
            <h4>🎉 ${parsed.result.summary}</h4>
            <div class="result-grid">
              ${parsed.result.metrics.map(m => `
                <div class="result-item">
                  <div class="result-item-val">${m.value}</div>
                  <div class="result-item-label">${m.label}</div>
                </div>
              `).join('')}
            </div>
          </div>`;
        execZone.querySelector('.flow-body').insertAdjacentHTML('beforeend', resultHtml);

        // 更新执行头状态
        const header = execZone.querySelector('.flow-meta');
        if (header) header.innerHTML = '<span style="color:var(--accent-success);">✓ 执行完成</span>';

        Store.toast('任务执行成功！', 'success');
      }
    );
  },

  // ====== Tasks Page ======
  tasks(filter = 'all') {
    const tasks = Store.getTasks(filter);
    const filters = [
      { key: 'all', label: '全部' },
      { key: 'success', label: '已完成' },
      { key: 'running', label: '执行中' },
      { key: 'pending', label: '待执行' },
    ];
    const filterHtml = filters.map(f => `
      <div class="filter-tab ${filter === f.key ? 'active' : ''}" onclick="Components.renderTasks('${f.key}')">${f.label}</div>
    `).join('');

    if (tasks.length === 0) {
      return `
        <div class="tasks-toolbar">
          <div class="filter-tabs">${filterHtml}</div>
        </div>
        <div class="empty-state">
          <div class="empty-icon">📋</div>
          <div class="empty-title">暂无任务</div>
          <div class="empty-desc">点击"新建任务"创建你的第一个自动化流程</div>
        </div>`;
    }

    const statusMap = { success: '已完成', running: '执行中', pending: '待执行', error: '失败' };
    const colorMap = { success: 'teal', running: 'warm', pending: 'purple', error: 'pink' };

    const tasksHtml = tasks.map(t => `
      <div class="task-card" onclick="App.navigate('task:${t.id}')">
        <div class="task-card-icon card-icon ${colorMap[t.status]}">${t.icon}</div>
        <div class="task-card-info">
          <div class="task-card-name">${t.name}</div>
          <div class="task-card-desc">${t.trigger}</div>
        </div>
        <div class="task-card-meta">
          <div class="badge ${t.status}">${statusMap[t.status]}</div>
          <div class="task-card-time">${Store.formatTime(t.createdAt)}</div>
        </div>
      </div>
    `).join('');

    return `
      <div class="tasks-toolbar">
        <div class="filter-tabs">${filterHtml}</div>
      </div>
      ${tasksHtml}`;
  },

  // 重新渲染任务列表（带 filter）
  renderTasks(filter) {
    const content = document.querySelector('.page-content');
    if (content) content.innerHTML = this.tasks(filter);
  },

  // ====== Task Detail ======
  taskDetail(id) {
    const task = Store.getTask(id);
    if (!task) return '<div class="empty-state"><div class="empty-icon">🔍</div><div class="empty-title">任务不存在</div></div>';

    const statusMap = { success: '已完成', running: '执行中', pending: '待执行', error: '失败' };
    const stepsHtml = task.steps.map((step, i) => {
      const done = task.status === 'success';
      const running = task.status === 'running' && i === 0;
      const stateClass = done ? 'done' : running ? 'active' : '';
      const statusText = done ? '完成' : running ? '执行中' : '待执行';
      const statusClass = done ? 'done' : running ? 'running' : 'pending';
      const connector = i < task.steps.length - 1 ? `<div class="flow-connector ${done ? 'done' : ''}"></div>` : '';
      return `
        <div class="flow-node ${stateClass}">
          <div class="flow-node-head">
            <div class="flow-node-icon card-icon purple">${step.icon}</div>
            <div class="flow-node-title">${step.title}</div>
            <div class="flow-node-status ${statusClass}">${statusText}</div>
          </div>
          <div class="flow-node-detail">${step.detail}</div>
        </div>
        ${connector}`;
    }).join('');

    let resultHtml = '';
    if (task.result) {
      resultHtml = `
        <div class="result-card">
          <h4>🎉 ${task.result.summary}</h4>
          <div class="result-grid">
            ${task.result.metrics.map(m => `
              <div class="result-item"><div class="result-item-val">${m.value}</div><div class="result-item-label">${m.label}</div></div>
            `).join('')}
          </div>
        </div>`;
    }

    return `
      <div class="detail-header">
        <div class="detail-back" onclick="App.navigate('tasks')">${this.icons.arrow} 返回任务列表</div>
        <div class="detail-title">${task.icon} ${task.name}</div>
        <div class="detail-meta">
          <span>📅 ${task.trigger}</span>
          <span>🕐 ${Store.formatTime(task.createdAt)}</span>
          <span><div class="badge ${task.status}">${statusMap[task.status]}</div></span>
        </div>
      </div>
      <div class="flow-result">
        <div class="flow-header">
          <div class="flow-name">执行流程</div>
          ${task.status === 'pending' ? `<button class="btn btn-primary btn-sm" onclick="App.navigate('create')">${this.icons.bolt} 立即执行</button>` : ''}
        </div>
        <div class="flow-body">
          <div class="flow-chart">${stepsHtml}</div>
          ${resultHtml}
        </div>
      </div>`;
  },

  // ====== Plugins Page ======
  plugins() {
    const cats = [...new Set(Plugins.map(p => p.cat))];
    const catFilters = cats.map(c => `<div class="filter-tab" onclick="Components.filterPlugins('${c}')">${c}</div>`).join('');

    const pluginsHtml = Plugins.map(p => `
      <div class="plugin-card" onclick="Components.togglePlugin('${p.id}')">
        <div class="plugin-head">
          <div class="plugin-logo" style="background:${p.color}20;color:${p.color};">${p.icon}</div>
          <div>
            <div class="plugin-name">${p.name}</div>
            <div class="plugin-cat">${p.cat}</div>
          </div>
        </div>
        <div class="plugin-desc">${p.desc}</div>
        <div class="plugin-foot">
          <div class="plugin-installs">⬇ ${p.installs} 安装</div>
          ${p.installed
            ? '<div class="badge success">已安装</div>'
            : '<button class="btn btn-secondary btn-sm">安装</button>'}
        </div>
      </div>
    `).join('');

    return `
      <div class="tasks-toolbar">
        <div class="filter-tabs"><div class="filter-tab active">全部</div>${catFilters}</div>
      </div>
      <div class="cards-3" id="pluginsGrid">${pluginsHtml}</div>`;
  },

  filterPlugins(cat) {
    const grid = document.getElementById('pluginsGrid');
    if (!grid) return;
    const filtered = Plugins.filter(p => p.cat === cat);
    grid.innerHTML = filtered.map(p => `
      <div class="plugin-card" onclick="Components.togglePlugin('${p.id}')">
        <div class="plugin-head">
          <div class="plugin-logo" style="background:${p.color}20;color:${p.color};">${p.icon}</div>
          <div><div class="plugin-name">${p.name}</div><div class="plugin-cat">${p.cat}</div></div>
        </div>
        <div class="plugin-desc">${p.desc}</div>
        <div class="plugin-foot">
          <div class="plugin-installs">⬇ ${p.installs} 安装</div>
          ${p.installed ? '<div class="badge success">已安装</div>' : '<button class="btn btn-secondary btn-sm">安装</button>'}
        </div>
      </div>
    `).join('');
  },

  togglePlugin(id) {
    const plugin = Plugins.find(p => p.id === id);
    if (plugin) {
      plugin.installed = !plugin.installed;
      Store.toast(plugin.installed ? `${plugin.name} 已安装` : `${plugin.name} 已卸载`, 'success');
      App.rerender();
    }
  },

  // ====== Settings Page ======
  settings() {
    return `
      <div style="max-width:600px;">
        <div class="panel" style="margin-bottom:20px;">
          <div class="panel-header"><div class="panel-title">通用设置</div></div>
          <div class="panel-body">
            <div style="display:flex;flex-direction:column;gap:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-size:14px;font-weight:600;">AI 模型</div><div style="font-size:12px;color:var(--text-muted);">选择任务解析使用的 AI 模型</div></div>
                <select style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:8px 12px;border-radius:8px;font-size:13px;"><option>Auto (推荐)</option><option>GPT-4</option><option>Claude 3.5</option><option>GLM-5.1</option></select>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-size:14px;font-weight:600;">执行速度</div><div style="font-size:12px;color:var(--text-muted);">控制自动化任务执行速度</div></div>
                <select style="background:var(--bg-input);border:1px solid var(--border);color:var(--text-primary);padding:8px 12px;border-radius:8px;font-size:13px;"><option>正常</option><option>快速</option><option>慢速（调试）</option></select>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;">
                <div><div style="font-size:14px;font-weight:600;">异常通知</div><div style="font-size:12px;color:var(--text-muted);">任务执行异常时推送通知</div></div>
                <div style="width:44px;height:24px;background:var(--accent-primary);border-radius:100px;position:relative;cursor:pointer;"><div style="position:absolute;right:2px;top:2px;width:20px;height:20px;background:#fff;border-radius:50%;"></div></div>
              </div>
            </div>
          </div>
        </div>
        <div class="panel">
          <div class="panel-header"><div class="panel-title">关于</div></div>
          <div class="panel-body">
            <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
              <div style="width:56px;height:56px;border-radius:14px;background:var(--grad-primary);display:flex;align-items:center;justify-content:center;font-size:24px;">${this.icons.logo}</div>
              <div>
                <div style="font-size:18px;font-weight:700;">AutoFlow</div>
                <div style="font-size:13px;color:var(--text-muted);">v0.1.0 · AI 驱动的智能工作流自动化引擎</div>
              </div>
            </div>
            <p style="font-size:13px;color:var(--text-secondary);line-height:1.7;">AutoFlow 让非技术用户用自然语言描述任务，AI 自动生成并执行浏览器/桌面自动化工作流。TRAE AI 创造力大赛参赛作品。</p>
          </div>
        </div>
      </div>`;
  },
};
