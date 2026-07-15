/**
 * 智析Agent — SPA 交互逻辑
 * 纯 Vanilla JavaScript（IIFE 模块模式）
 * 实现：路由导航、智能问数聊天、智能报告、智能看板、场景管理、Toast 通知
 */
;(function () {
  'use strict';

  /* ================================================================
     0. 动态注入动画样式
     ================================================================ */
  const ANIM_STYLE_ID = 'app-anim-styles';
  if (!document.getElementById(ANIM_STYLE_ID)) {
    const styleEl = document.createElement('style');
    styleEl.id = ANIM_STYLE_ID;
    styleEl.textContent = `
      /* ---- Toast 动画 ---- */
      @keyframes toast-slide-in {
        from { transform: translateX(100%); opacity: 0; }
        to   { transform: translateX(0);    opacity: 1; }
      }
      @keyframes toast-fade-out {
        from { opacity: 1; }
        to   { opacity: 0; transform: translateX(40px); }
      }
      .toast-enter { animation: toast-slide-in 0.3s ease forwards; }
      .toast-exit  { animation: toast-fade-out 0.3s ease forwards; }

      /* ---- 聊天打字指示器弹跳动画 ---- */
      @keyframes typing-bounce {
        0%, 60%, 100% { transform: translateY(0); }
        30%           { transform: translateY(-6px); }
      }
      .typing-dot {
        display: inline-block;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: var(--color-text-tertiary, #94A3B8);
        margin: 0 2px;
        animation: typing-bounce 1.2s ease-in-out infinite;
      }
      .typing-dot:nth-child(2) { animation-delay: 0.15s; }
      .typing-dot:nth-child(3) { animation-delay: 0.3s; }

      /* ---- 页面切换淡入 ---- */
      @keyframes page-fade-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      .page-fade-in { animation: page-fade-in 0.2s ease forwards; }

      /* ---- Modal 遮罩淡入 ---- */
      @keyframes modal-backdrop-in {
        from { opacity: 0; }
        to   { opacity: 1; }
      }
      @keyframes modal-box-in {
        from { opacity: 0; transform: scale(0.95) translateY(-10px); }
        to   { opacity: 1; transform: scale(1) translateY(0); }
      }
      .modal-backdrop-enter { animation: modal-backdrop-in 0.25s ease forwards; }
      .modal-box-enter      { animation: modal-box-in 0.25s ease forwards; }

      /* ---- KPI 卡片刷新脉冲 ---- */
      @keyframes kpi-pulse {
        0%   { opacity: 1; }
        30%  { opacity: 0.35; }
        60%  { opacity: 1; }
        80%  { opacity: 0.5; }
        100% { opacity: 1; }
      }
      .kpi-refresh-pulse { animation: kpi-pulse 0.8s ease; }
    `;
    document.head.appendChild(styleEl);
  }

  /* ================================================================
     1. 常量 / 配置
     ================================================================ */
  const SELECTORS = {
    navItems:       '.sidebar-nav-item',
    mainContent:    '#main-content',
    pageTitle:      '#page-title-slot',
    sceneName:      '.topbar-scene-selector span',          // 顶栏场景名称
    toastContainer: '#toast-container',
  };

  /** 页面路由配置 */
  const PAGES = {
    'dashboard':       { title: '数据概览', navId: 'nav-dashboard',       init: initDashboard },
    'smart-query':     { title: '智能问数', navId: 'nav-smart-query',     init: initSmartQuery },
    'smart-report':    { title: '智能报告', navId: 'nav-smart-report',    init: initSmartReport },
    'smart-dashboard': { title: '智能看板', navId: 'nav-smart-dashboard', init: initSmartDashboard },
    'scene-manage':    { title: '场景管理', navId: 'nav-scene-manage',    init: initSceneManage },
  };

  let currentPage = null;           // 当前页面 hash
  let dashboardBeautified = false;    // 看板是否已美化

  /* ================================================================
     2. Toast 通知系统
     ================================================================ */
  /** 获取/创建 Toast 容器 */
  function getToastContainer () {
    let container = document.querySelector(SELECTORS.toastContainer);
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      Object.assign(container.style, {
        position: 'fixed',
        top: '16px',
        right: '16px',
        zIndex: '9999',
        display: 'flex',
        flexDirection: 'column',
        gap: '8px',
        pointerEvents: 'none',
        maxWidth: '360px',
      });
      document.body.appendChild(container);
    }
    return container;
  }

  /**
   * 显示 Toast 通知
   * @param {string} message  - 消息文本
   * @param {'info'|'success'|'warning'} type - 类型
   */
  function showToast (message, type = 'info') {
    const container = getToastContainer();
    const colorMap = {
      info:    { bg: '#DBEAFE', border: '#2563EB', icon: 'i' },
      success: { bg: '#D1FAE5', border: '#059669', icon: '\u2713' },
      warning: { bg: '#FEF3C7', border: '#D97706', icon: '!' },
    };
    const c = colorMap[type] || colorMap.info;

    const toast = document.createElement('div');
    toast.className = 'toast-enter';
    Object.assign(toast.style, {
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      padding: '10px 16px',
      background: c.bg,
      borderLeft: `4px solid ${c.border}`,
      borderRadius: '6px',
      fontSize: '13px',
      color: '#0F172A',
      boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
      pointerEvents: 'auto',
      fontFamily: 'var(--font-body, sans-serif)',
    });

    const iconSpan = document.createElement('span');
    Object.assign(iconSpan.style, {
      width: '18px',
      height: '18px',
      borderRadius: '50%',
      background: c.border,
      color: '#FFFFFF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '11px',
      fontWeight: '700',
      flexShrink: '0',
    });
    iconSpan.textContent = c.icon;

    const msgSpan = document.createElement('span');
    msgSpan.textContent = message;

    toast.appendChild(iconSpan);
    toast.appendChild(msgSpan);
    container.appendChild(toast);

    // 3 秒后自动消失
    setTimeout(() => {
      toast.classList.remove('toast-enter');
      toast.classList.add('toast-exit');
      toast.addEventListener('animationend', () => toast.remove());
    }, 3000);
  }

  /* ================================================================
     3. 路由 / 导航
     ================================================================ */
  /** 从 <script type="text/html" id="tmpl-[page]"> 获取模板内容 */
  function getTemplate (pageKey) {
    const tmpl = document.getElementById(`tmpl-${pageKey}`);
    if (tmpl) return tmpl.innerHTML.trim();
    return '';
  }

  /** 切换页面 */
  function navigateTo (pageKey) {
    const page = PAGES[pageKey];
    if (!page) return;

    // 1) 更新 hash
    if (location.hash !== `#${pageKey}`) {
      history.replaceState(null, '', `#${pageKey}`);
    }

    // 2) 更新侧栏高亮
    document.querySelectorAll(SELECTORS.navItems).forEach(item => {
      item.classList.toggle('active', item.dataset.domId === page.navId);
    });

    // 3) 更新顶栏标题
    const titleEl = document.querySelector(SELECTORS.pageTitle);
    if (titleEl) titleEl.textContent = page.title;

    // 4) 替换主内容（带淡入动画）
    const mainEl = document.querySelector(SELECTORS.mainContent);
    if (mainEl) {
      mainEl.classList.remove('page-fade-in');
      // 触发 reflow 以重新播放动画
      void mainEl.offsetWidth;
      const html = getTemplate(pageKey);
      if (html) {
        mainEl.innerHTML = html;
      }
      mainEl.classList.add('page-fade-in');
    }

    // 5) 调用页面初始化
    currentPage = pageKey;
    if (typeof page.init === 'function') {
      page.init();
    }
  }

  /** 侧栏导航点击（事件委托） */
  function setupNavigation () {
    document.querySelector('.sidebar-nav').addEventListener('click', (e) => {
      const navItem = e.target.closest('.sidebar-nav-item');
      if (!navItem) return;
      const domId = navItem.dataset.domId;
      // domId 格式: nav-xxx -> 页面 key 就是去掉 "nav-" 前缀
      const pageKey = domId.replace(/^nav-/, '');
      if (PAGES[pageKey]) navigateTo(pageKey);
    });

    // hashchange 监听（前进/后退）
    window.addEventListener('hashchange', () => {
      const hash = location.hash.replace('#', '') || 'dashboard';
      if (PAGES[hash]) navigateTo(hash);
    });
  }

  /* ================================================================
     4. 智能问数页面 (#smart-query)
     ================================================================ */
  /** 模拟 AI 响应数据（关键词匹配） */
  function getAIResponse (query) {
    const q = query.toLowerCase();

    if (/uv|访客|独立访客/.test(q)) {
      return {
        text: '当前周期内独立访客（UV）数据如下：',
        card: `
          <div class="mini-data-card">
            <div class="metric-row">
              <span class="metric-label">总 UV</span>
              <span class="metric-value">12,847</span>
              <span class="metric-trend">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M7 3L4 6M7 3L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                较上周 +12.5%
              </span>
            </div>
            <div class="sparkline-area">
              <svg width="120" height="32" viewBox="0 0 120 32" fill="none">
                <polyline points="0,22 20,18 40,24 60,16 80,14 100,10 120,8" stroke="var(--chart-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <polygon points="0,22 20,18 40,24 60,16 80,14 100,10 120,8 120,32 0,32" fill="var(--chart-1)" fill-opacity="0.1"/>
              </svg>
            </div>
          </div>`,
        insight: 'UV 整体呈上升趋势，11月27日后增速明显加快，建议关注流量来源渠道。',
      };
    }

    if (/pv|浏览量/.test(q)) {
      return {
        text: '当前周期内页面浏览量（PV）数据如下：',
        card: `
          <div class="mini-data-card">
            <div class="metric-row">
              <span class="metric-label">总 PV</span>
              <span class="metric-value">98,326</span>
              <span class="metric-trend">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M7 3L4 6M7 3L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                较上周 +8.3%
              </span>
            </div>
            <div class="sparkline-area">
              <svg width="120" height="32" viewBox="0 0 120 32" fill="none">
                <polyline points="0,26 20,20 40,18 60,22 80,12 100,8 120,6" stroke="var(--chart-2)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <polygon points="0,26 20,20 40,18 60,22 80,12 100,8 120,6 120,32 0,32" fill="var(--chart-2)" fill-opacity="0.1"/>
              </svg>
            </div>
          </div>`,
        insight: 'PV 在12月1日达到峰值13.8k，与双12预热活动高度相关。人均PV 7.66页，浏览深度良好。',
      };
    }

    if (/转化|购买转化/.test(q)) {
      return {
        text: '购买转化率为 <strong>3.21%</strong>，较上周下降0.4个百分点。',
        card: `
          <div class="comparison-card">
            <div class="comparison-item">
              <div class="comp-date">上周均值</div>
              <div class="comp-value">3.61%</div>
            </div>
            <div class="comparison-item current">
              <div class="comp-date">本周均值</div>
              <div class="comp-value">3.21%</div>
            </div>
          </div>
          <div class="comparison-change">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 3V11M7 11L10 8M7 11L4 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
            -0.40pp
          </div>`,
        insight: '转化率下降主要受服饰鞋包类目影响（-0.45pp），建议检查该类目促销策略是否有变动。',
      };
    }

    if (/复购/.test(q)) {
      return {
        text: '当前周期复购率为 <strong>28.7%</strong>，较上周上升1.2个百分点。',
        card: `
          <div class="mini-data-card">
            <div class="metric-row">
              <span class="metric-label">复购率</span>
              <span class="metric-value">28.7%</span>
              <span class="metric-trend">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M7 11V3M7 3L4 6M7 3L10 6" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
                +1.2% 较上周
              </span>
            </div>
          </div>`,
        insight: '复购率持续走高，手机数码和食品饮料类目复购率最高（分别为42%和35%），用户粘性表现优秀。',
      };
    }

    if (/类目|商品/.test(q)) {
      return {
        text: '购买量 TOP5 类目如下：',
        card: `
          <div class="mini-bar-chart">
            <div class="bar-row">
              <span class="bar-label">手机数码</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:100%; background:var(--chart-1);"><span class="bar-value">8,432</span></div>
              </div>
            </div>
            <div class="bar-row">
              <span class="bar-label">服饰鞋包</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:74.5%; background:var(--chart-2);"><span class="bar-value">6,287</span></div>
              </div>
            </div>
            <div class="bar-row">
              <span class="bar-label">家用电器</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:61%; background:var(--chart-3);"><span class="bar-value">5,143</span></div>
              </div>
            </div>
            <div class="bar-row">
              <span class="bar-label">美妆个护</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:50%; background:var(--chart-4);"><span class="bar-value">4,218</span></div>
              </div>
            </div>
            <div class="bar-row">
              <span class="bar-label">食品饮料</span>
              <div class="bar-track">
                <div class="bar-fill" style="width:37.4%; background:#8B5CF6;"><span class="bar-value">3,156</span></div>
              </div>
            </div>
          </div>`,
        insight: '手机数码类目购买量领先第二名34.1%，建议重点关注该类目的库存与促销策略。',
      };
    }

    if (/趋势|周/.test(q)) {
      return {
        text: '本周 UV/PV 趋势数据如下：',
        card: `
          <div class="mini-data-card">
            <div class="sparkline-area" style="margin-top:0;">
              <svg width="100%" height="48" viewBox="0 0 240 48" fill="none">
                <polyline points="0,38 30,30 60,34 90,24 120,28 150,18 180,22 210,14 240,10"
                  stroke="var(--chart-1)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
                <polyline points="0,20 30,16 60,14 90,18 120,10 150,6 180,12 210,4 240,2"
                  stroke="var(--chart-3)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" fill="none" stroke-dasharray="4,2"/>
                <circle cx="210" cy="14" r="3" fill="var(--chart-1)"/>
                <circle cx="240" cy="10" r="3" fill="var(--chart-1)"/>
              </svg>
            </div>
            <div style="display:flex;gap:12px;margin-top:4px;font-size:11px;color:var(--color-text-tertiary);">
              <span><span style="display:inline-block;width:12px;height:2px;background:var(--chart-1);vertical-align:middle;margin-right:3px;"></span>UV</span>
              <span><span style="display:inline-block;width:12px;height:2px;background:var(--chart-3);vertical-align:middle;margin-right:3px;border-top:1px dashed var(--chart-3);"></span>PV</span>
            </div>
          </div>`,
        insight: '整体趋势向好，周中（11/28-11/30）有小幅回调，周末回暖。12月2日UV达到峰值4,870。',
      };
    }

    // 默认回复
    return {
      text: '基于当前数据场景的分析如下：',
      card: '',
      insight: `您的问题"${query}"涉及多个维度，建议尝试更具体的查询，例如："最近一周的UV是多少？"、"哪个类目购买量最高？"等，智析将为您提供精准的数据回答。`,
    };
  }

  /** 构造 AI 气泡 HTML */
  function buildAIBubbleHTML (response) {
    let html = '<div class="ai-text">' + response.text + '</div>';
    if (response.card) html += response.card;
    if (response.insight) html += '<div class="ai-insight">' + response.insight + '</div>';
    return html;
  }

  /** 自动滚动聊天区域到底部 */
  function scrollChatToBottom () {
    const chatHistory = document.querySelector('.chat-history');
    if (chatHistory) {
      chatHistory.scrollTop = chatHistory.scrollHeight;
    }
  }

  /** 发送消息 */
  function sendChatMessage () {
    const input = document.querySelector('.chat-input');
    const text = (input.value || '').trim();
    if (!text) return;

    const chatHistory = document.querySelector('.chat-history');
    if (!chatHistory) return;

    // 用户消息
    const userRow = document.createElement('div');
    userRow.className = 'chat-row user';
    userRow.innerHTML = `<div class="chat-bubble user">${escapeHtml(text)}</div>`;
    chatHistory.appendChild(userRow);

    // 清空输入
    input.value = '';
    scrollChatToBottom();

    // 800ms 后显示打字指示器
    setTimeout(() => {
      const typingRow = document.createElement('div');
      typingRow.className = 'chat-row ai typing-indicator-row';
      typingRow.innerHTML = `
        <div class="chat-avatar">AI</div>
        <div class="chat-bubble ai">
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
          <span class="typing-dot"></span>
        </div>`;
      chatHistory.appendChild(typingRow);
      scrollChatToBottom();

      // 再 1200ms 后替换为实际回复
      setTimeout(() => {
        const response = getAIResponse(text);
        typingRow.innerHTML = `
          <div class="chat-avatar">AI</div>
          <div class="chat-bubble ai">${buildAIBubbleHTML(response)}</div>`;
        scrollChatToBottom();
      }, 1200);
    }, 800);
  }

  /** HTML 转义 */
  function escapeHtml (str) {
    const map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
    return str.replace(/[&<>"']/g, c => map[c]);
  }

  /** 智能问数页面初始化 */
  function initSmartQuery () {
    // 发送按钮
    const sendBtn = document.querySelector('.chat-send-btn');
    if (sendBtn) {
      sendBtn.addEventListener('click', sendChatMessage);
    }

    // 输入框 Enter 发送
    const input = document.querySelector('.chat-input');
    if (input) {
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          sendChatMessage();
        }
      });
      // 自动聚焦
      input.focus();
    }

    // 建议问题芯片点击
    const chips = document.querySelectorAll('.suggested-chip');
    chips.forEach(chip => {
      chip.addEventListener('click', () => {
        const input = document.querySelector('.chat-input');
        if (input) {
          input.value = chip.textContent;
          sendChatMessage();
        }
      });
    });
  }

  /* ================================================================
     5. 智能报告页面 (#smart-report)
     ================================================================ */
  /** 模拟报告详情数据 */
  const REPORT_DETAILS = [
    {
      title: '淘宝用户行为全量分析报告',
      summary: '本报告周期内（2017.11.25 - 2017.12.03），淘宝平台整体数据表现良好。独立访客数达到 12,847 人，页面浏览量达 98,326 次，人均浏览页面约 7.66 页。',
      metrics: [
        { label: 'UV', value: '12,847', color: 'blue' },
        { label: 'PV', value: '98,326', color: 'cyan' },
        { label: '转化率', value: '3.21%', color: 'green' },
        { label: '复购率', value: '28.7%', color: 'amber' },
      ],
    },
    {
      title: '双12用户活跃度专项分析',
      summary: '双12活动期间用户活跃度显著提升，峰值UV达到4,870人。活动期间加购转化率提升2.3个百分点，促销效果明显。',
      metrics: [
        { label: '峰值UV', value: '4,870', color: 'blue' },
        { label: '加购率', value: '17.8%', color: 'cyan' },
        { label: '客单价', value: '¥286', color: 'green' },
        { label: 'GMV', value: '¥903k', color: 'amber' },
      ],
    },
    {
      title: '用户转化漏斗深度分析',
      summary: '浏览到购买的转化漏斗整体转化率为3.2%。加购环节流失最大（84.5%未加购），建议优化商品详情页信息架构与价格展示策略。',
      metrics: [
        { label: '浏览-加购', value: '15.5%', color: 'blue' },
        { label: '加购-购买', value: '20.7%', color: 'cyan' },
        { label: '购买-复购', value: '78.5%', color: 'green' },
        { label: '整体转化', value: '3.2%', color: 'amber' },
      ],
    },
  ];

  /** 刷新右侧报告详情 */
  function updateReportDetail (index) {
    const detail = REPORT_DETAILS[index] || REPORT_DETAILS[0];
    const titleEl = document.querySelector('.report-detail-title');
    const bodyEl = document.querySelector('.report-detail-body');
    if (!bodyEl) return;

    if (titleEl) titleEl.textContent = detail.title;

    bodyEl.innerHTML = `
      <div class="metric-cards">
        ${detail.metrics.map(m => `
          <div class="metric-card">
            <div class="metric-card-label">${m.label}</div>
            <div class="metric-card-value ${m.color}">${m.value}</div>
          </div>`).join('')}
      </div>
      <div class="summary-text">${detail.summary}</div>
      <details class="chapter" open>
        <summary>
          <svg class="chapter-arrow" viewBox="0 0 16 16" fill="none"><path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/></svg>
          详细分析内容
        </summary>
        <div class="chapter-content">
          <p style="color:var(--color-text-secondary); line-height:var(--leading-relaxed);">
            ${detail.summary} 更详细的分析数据与可视化图表将在完整报告中呈现。
          </p>
        </div>
      </details>
    `;
  }

  /** 智能报告页面初始化 */
  function initSmartReport () {
    const listBody = document.querySelector('.report-list-body');
    if (!listBody) return;

    // 报告卡片点击
    listBody.addEventListener('click', (e) => {
      const card = e.target.closest('.report-card');
      if (!card) return;

      // 高亮选中
      listBody.querySelectorAll('.report-card').forEach(c => c.classList.remove('selected'));
      card.classList.add('selected');

      // 更新右侧详情
      const cards = Array.from(listBody.querySelectorAll('.report-card'));
      const idx = cards.indexOf(card);
      updateReportDetail(idx);
    });

    // 生成报告按钮
    const genBtn = document.querySelector('.btn-generate');
    if (genBtn) {
      genBtn.addEventListener('click', () => showToast('报告生成中...', 'info'));
    }

    // 导出按钮（事件委托）
    const exportBtns = document.querySelector('.export-btns');
    if (exportBtns) {
      exportBtns.addEventListener('click', (e) => {
        if (e.target.closest('.btn-export')) {
          showToast('导出功能演示中', 'info');
        }
      });
    }
  }

  /* ================================================================
     6. 智能看板页面 (#smart-dashboard)
     ================================================================ */
  /** 看板备用色板 */
  const ALT_PALETTE = {
    'var(--chart-1)': '#6366F1',
    'var(--chart-2)': '#14B8A6',
    'var(--chart-3)': '#F59E0B',
    'var(--chart-4)': '#EC4899',
    'var(--chart-5)': '#8B5CF6',
  };

  /** 智能看板页面初始化 */
  function initSmartDashboard () {
    // 刷新数据按钮
    const refreshBtns = document.querySelectorAll('.toolbar-btn-primary');
    refreshBtns.forEach(btn => {
      if (btn.textContent.includes('刷新数据')) {
        btn.addEventListener('click', () => {
          const kpiCards = document.querySelectorAll('.kpi-card');
          kpiCards.forEach(card => {
            card.classList.add('kpi-refresh-pulse');
            card.addEventListener('animationend', () => card.classList.remove('kpi-refresh-pulse'), { once: true });
          });
          showToast('数据已刷新', 'success');
        });
      }
    });

    // 导出图片按钮
    const outlineBtns = document.querySelectorAll('.toolbar-btn-outline');
    outlineBtns.forEach(btn => {
      if (btn.textContent.includes('导出图片')) {
        btn.addEventListener('click', () => showToast('看板导出功能演示中', 'info'));
      }
      if (btn.textContent.includes('美化看板')) {
        btn.addEventListener('click', () => {
          dashboardBeautified = !dashboardBeautified;
          toggleDashboardPalette(dashboardBeautified);
          showToast(dashboardBeautified ? '已切换至美化色板' : '已恢复默认色板', 'success');
        });
      }
    });
  }

  /** 切换看板颜色 */
  function toggleDashboardPalette (beautified) {
    const mainEl = document.querySelector(SELECTORS.mainContent);
    if (!mainEl) return;

    // 替换 chart-card 和 funnel-bar 等的背景色
    const barFills = mainEl.querySelectorAll('.bar-chart-vertical .bar');
    barFills.forEach(bar => {
      const currentBg = bar.style.background || bar.style.backgroundColor;
      Object.keys(ALT_PALETTE).forEach(original => {
        if (currentBg.includes(original)) {
          bar.style.background = beautified ? ALT_PALETTE[original] : original;
        }
      });
    });

    // 切换 funnel 颜色
    const funnelBars = mainEl.querySelectorAll('.funnel-bar');
    if (beautified) {
      funnelBars.forEach(bar => {
        bar.style.background = bar.style.background
          .replace(/#3B82F6/g, '#6366F1')
          .replace(/#06B6D4/g, '#14B8A6')
          .replace(/#10B981/g, '#F59E0B')
          .replace(/#F59E0B/g, '#EC4899');
      });
    } else {
      // 简单用 class color 来恢复
      funnelBars.forEach(bar => {
        bar.style.background = '';
        // 依赖 CSS class 恢复
      });
    }
  }

  /* ================================================================
     7. 场景管理页面 (#scene-manage)
     ================================================================ */
  /** 创建导入配置包弹窗 */
  function showImportModal () {
    // 移除已有弹窗
    closeModal();

    const backdrop = document.createElement('div');
    backdrop.className = 'modal-backdrop-enter';
    backdrop.id = 'import-modal-backdrop';
    Object.assign(backdrop.style, {
      position: 'fixed',
      inset: '0',
      background: 'rgba(15, 23, 42, 0.5)',
      zIndex: '500',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    });

    const modal = document.createElement('div');
    modal.className = 'modal-box-enter';
    Object.assign(modal.style, {
      background: 'var(--color-bg-surface, #FFFFFF)',
      borderRadius: '12px',
      width: '480px',
      maxWidth: '90vw',
      boxShadow: '0 20px 60px rgba(0,0,0,0.15)',
      overflow: 'hidden',
    });

    modal.innerHTML = `
      <div style="padding:20px 24px 16px; border-bottom:1px solid var(--color-border, #E2E8F0); display:flex; align-items:center; justify-content:space-between;">
        <span style="font-size:16px; font-weight:600; color:var(--color-text-primary, #0F172A);">导入场景配置包</span>
        <button class="modal-close-btn" style="width:28px;height:28px;border-radius:6px;border:none;background:transparent;cursor:pointer;display:flex;align-items:center;justify-content:center;color:var(--color-text-tertiary, #94A3B8);transition:all 150ms;" onmouseover="this.style.background='var(--color-bg-page, #F8FAFC)'" onmouseout="this.style.background='transparent'">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4L12 12M12 4L4 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div style="padding:24px;">
        <div style="border:2px dashed var(--color-border, #E2E8F0); border-radius:12px; padding:40px 20px; text-align:center; cursor:pointer; transition:all 200ms; background:var(--color-bg-page, #F8FAFC);" onmouseover="this.style.borderColor='var(--color-primary-200, #BFDBFE)';this.style.background='var(--color-primary-bg, #EFF6FF)'" onmouseout="this.style.borderColor='var(--color-border, #E2E8F0)';this.style.background='var(--color-bg-page, #F8FAFC)'">
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" style="color:var(--color-text-tertiary, #94A3B8); margin-bottom:12px;">
            <path d="M12 5V19M5 12H19" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>
            <path d="M4 16V20C4 20.6 4.4 21 5 21H19C19.6 21 20 20.6 20 20V16" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          <div style="font-size:14px; font-weight:500; color:var(--color-text-secondary, #475569); margin-bottom:4px;">点击或拖拽配置包到此处</div>
          <div style="font-size:12px; color:var(--color-text-tertiary, #94A3B8);">支持 YAML 格式配置包</div>
        </div>
      </div>
      <div style="padding:0 24px 20px; display:flex; justify-content:flex-end; gap:8px;">
        <button class="modal-cancel-btn" style="padding:8px 16px; border-radius:8px; border:1px solid var(--color-border, #E2E8F0); background:var(--color-bg-surface, #FFFFFF); color:var(--color-text-secondary, #475569); font-size:13px; cursor:pointer; font-family:var(--font-body, sans-serif); font-weight:500;">取消</button>
        <button class="modal-confirm-btn" style="padding:8px 16px; border-radius:8px; border:none; background:var(--color-primary, #1E40AF); color:#FFFFFF; font-size:13px; cursor:pointer; font-family:var(--font-body, sans-serif); font-weight:500;">确认</button>
      </div>
    `;

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);

    // 事件
    modal.querySelector('.modal-close-btn').addEventListener('click', closeModal);
    modal.querySelector('.modal-cancel-btn').addEventListener('click', closeModal);
    modal.querySelector('.modal-confirm-btn').addEventListener('click', () => {
      showToast('配置导入中...', 'info');
      closeModal();
    });
    backdrop.addEventListener('click', (e) => {
      if (e.target === backdrop) closeModal();
    });
  }

  /** 关闭弹窗 */
  function closeModal () {
    const backdrop = document.getElementById('import-modal-backdrop');
    if (backdrop) backdrop.remove();
  }

  /** 更新顶栏场景名称 */
  function updateSceneSelector (name) {
    const sceneSpan = document.querySelector(SELECTORS.sceneName);
    if (sceneSpan) sceneSpan.textContent = name;
  }

  /** 场景管理页面初始化 */
  function initSceneManage () {
    const mainEl = document.querySelector(SELECTORS.mainContent);
    if (!mainEl) return;

    // 导入配置包按钮
    const importBtn = mainEl.querySelector('.btn-primary');
    if (importBtn && importBtn.textContent.includes('导入配置包')) {
      importBtn.addEventListener('click', showImportModal);
    }

    // 事件委托：处理场景卡片上的按钮
    mainEl.addEventListener('click', (e) => {
      // "切换至此场景" 按钮
      const switchBtn = e.target.closest('.btn-outline');
      if (switchBtn && switchBtn.textContent.includes('切换至此场景')) {
        const card = switchBtn.closest('.scene-card');
        if (!card) return;
        const name = card.querySelector('.scene-card-name');
        const sceneName = name ? name.textContent : '未知场景';

        // 高亮当前卡片
        mainEl.querySelectorAll('.scene-card').forEach(c => {
          c.classList.remove('active-scene');
          c.classList.add('inactive-scene');
        });
        card.classList.remove('inactive-scene');
        card.classList.add('active-scene');

        // 更新状态徽标
        mainEl.querySelectorAll('.scene-status-badge').forEach(badge => {
          badge.className = 'scene-status-badge badge-configured';
          badge.innerHTML = '<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="2" fill="currentColor"/></svg> 已配置';
        });
        const activeBadge = card.querySelector('.scene-status-badge');
        if (activeBadge) {
          activeBadge.className = 'scene-status-badge badge-active';
          activeBadge.innerHTML = '<svg viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><circle cx="6" cy="6" r="2" fill="currentColor"/></svg> 当前使用中';
        }

        // 更新顶栏场景名称
        updateSceneSelector(sceneName);
        showToast(`已切换至 ${sceneName}`, 'success');
        return;
      }

      // "删除" 按钮
      const deleteBtn = e.target.closest('.btn-text-danger');
      if (deleteBtn && deleteBtn.textContent.includes('删除')) {
        const card = deleteBtn.closest('.scene-card');
        if (!card) return;

        // 如果已有确认栏，不重复添加
        if (card.querySelector('.delete-confirm')) return;

        const confirm = document.createElement('div');
        confirm.className = 'delete-confirm';
        Object.assign(confirm.style, {
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          marginTop: '8px',
          padding: '8px 12px',
          background: 'var(--color-error-bg, #FEE2E2)',
          borderRadius: '6px',
          fontSize: '13px',
          color: 'var(--state-error, #DC2626)',
        });
        confirm.innerHTML = `
          <span>确定删除该场景？</span>
          <button class="confirm-yes" style="padding:4px 10px;border-radius:4px;border:none;background:var(--state-error,#DC2626);color:#FFFFFF;font-size:12px;cursor:pointer;font-family:var(--font-body,sans-serif);">确定</button>
          <button class="confirm-no" style="padding:4px 10px;border-radius:4px;border:1px solid var(--color-border,#E2E8F0);background:#FFFFFF;font-size:12px;cursor:pointer;color:var(--color-text-secondary,#475569);font-family:var(--font-body,sans-serif);">取消</button>
        `;
        card.appendChild(confirm);

        confirm.querySelector('.confirm-yes').addEventListener('click', () => {
          card.style.transition = 'opacity 0.3s, transform 0.3s';
          card.style.opacity = '0';
          card.style.transform = 'scale(0.95)';
          setTimeout(() => card.remove(), 300);
          showToast('场景已删除', 'warning');
        });
        confirm.querySelector('.confirm-no').addEventListener('click', () => {
          confirm.remove();
        });
        return;
      }

      // 添加新场景卡片（虚线卡片）
      const addCard = e.target.closest('.scene-card-add');
      if (addCard) {
        showImportModal();
        return;
      }
    });
  }

  /* ================================================================
     8. 数据概览页面 (#dashboard)
     ================================================================ */
  function initDashboard () {
    // 快捷操作按钮（事件委托）
    const mainEl = document.querySelector(SELECTORS.mainContent);
    if (!mainEl) return;

    mainEl.addEventListener('click', (e) => {
      const actionBtn = e.target.closest('.action-btn');
      if (!actionBtn) return;
      if (actionBtn.textContent.includes('生成全量报告')) {
        navigateTo('smart-report');
      } else if (actionBtn.textContent.includes('开始智能问数')) {
        navigateTo('smart-query');
      } else if (actionBtn.textContent.includes('查看完整看板')) {
        navigateTo('smart-dashboard');
      }
    });
  }

  /* ================================================================
     9. 初始化入口
     ================================================================ */
  function init () {
    // 设置侧栏导航
    setupNavigation();

    // 根据 hash 显示对应页面，默认 dashboard
    const hash = location.hash.replace('#', '') || 'dashboard';
    navigateTo(hash);
  }

  // DOM Ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
