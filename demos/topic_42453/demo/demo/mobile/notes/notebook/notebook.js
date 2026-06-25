/* =========================================================================
 * 「知行」App 本体 Demo —— Phase 1.A / 笔记本逻辑（notebook.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 页面栈状态机：workbench ⇄ agent（左入）→ detail（右入）；workbench → chat（下入）
 *   2. 时段感知问候（morning/noon/evening/night）→ body class
 *   3. 主动工作台 5 种小组件渲染 + ⋯ 菜单 + 添加组件
 *   4. Agent 控制台 Kanban + 任务详情子页
 *   5. 指派任务底部模态（5 类型 + 动态参数表单）
 *   6. 对话子页：消息流 / @ 引用笔记 / 附件 / mock AI 回复
 * 依赖：../../demo/shared/icons.js（ZX.icon）、../../demo/shared/mock-data.js（ZX_MOCK）
 * 约束：原生 JS + 事件委托，无框架，无 alert/prompt/confirm
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  function zicon(name, size) { return (window.ZX && typeof window.ZX.icon === 'function') ? window.ZX.icon(name, size || 22) : svg('', size); }

  var IC = {
    menu: function () { return zicon('menu'); },
    spark: function () { return zicon('spark'); },
    back: function () { return zicon('arrow-left'); },
    send: function () { return zicon('arrow-up'); },
    plus: function () { return zicon('plus'); },
    close: function () { return zicon('close'); },
    list: function () { return zicon('list'); },
    search: function () { return zicon('search'); },
    gear: function () { return svg('<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>'); },
    clip: function () { return svg('<path d="M21 11.5l-8.2 8.2a5 5 0 0 1-7.1-7.1l8.8-8.8a3.3 3.3 0 0 1 4.7 4.7l-8.3 8.3a1.6 1.6 0 0 1-2.3-2.3l7.1-7.1"/>'); },
    flame: function () { return svg('<path d="M12 3c.5 3-2 4.5-2 7a2 2 0 0 0 4 0c0-.8-.3-1.4-.5-2 2 1.5 3.5 3.8 3.5 6.5a5 5 0 0 1-10 0c0-3.5 3-5.5 3-9 0-1 .8-2 2-2.5z"/>'); },
    clock: function () { return svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'); },
    pencil: function () { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'); },
    square: function () { return svg('<rect x="4" y="4" width="16" height="16" rx="4"/>'); },
    folder: function () { return svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'); },
    pdf: function () { return svg('<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M9 13h6M9 17h4"/>'); },
    image: function () { return svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5L5 20"/>'); },
    play: function () { return svg('<path d="M7 5l12 7-12 7z"/>'); },
    pause: function () { return svg('<rect x="6" y="5" width="4" height="14" rx="1"/><rect x="14" y="5" width="4" height="14" rx="1"/>'); },
    edit: function () { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'); },
    chat: function () { return svg('<path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 9 9 0 0 1-3.9-.9L3 21l1.4-4.4A8.4 8.4 0 0 1 12.5 3 8.4 8.4 0 0 1 21 11.5z"/>'); },
    chev: function () { return svg('<path d="M6 9l6 6 6-6"/>'); },
    trash: function () { return svg('<path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M6 6l1 14a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-14"/>'); },
    move: function () { return svg('<path d="M5 9l-3 3 3 3M9 5l3-3 3 3M15 19l-3 3-3-3M19 9l3 3-3 3M2 12h20M12 2v20"/>'); },
    folderPlus: function () { return svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><path d="M12 10v4M10 12h4"/>'); },
    bookPlus: function () { return svg('<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><path d="M12 9v4M10 11h4"/>'); }
  };

  function mock() { return window.ZX_MOCK || (window.ZX && window.ZX.mock) || { notes: [], dailyPicks: [] }; }
  function noteById(id) { var n = mock().notes || []; for (var i = 0; i < n.length; i++) { if (n[i].id === id) return n[i]; } return null; }

  /* ----------------------------- 智能体元数据（主+子） -----------------------------
   * 主智能体「林」：拟人、长记忆、永远在线，负责综合决策与调度
   * 子智能体：一次性、单独会话、不拟人，是林被调度的「能力」
   * -------------------------------------------------------------------------- */
  const AGENTS = {
    lin: { id: 'lin', name: '林', role: '主智能体', isMain: true, avatar: 'spark', desc: '你的主智能体，长记忆，专属你' },
    search: { id: 'search', name: '搜索', role: '子智能体', icon: '🔍', desc: '联网与内部库检索，返回事实', callCount: 12 },
    summary: { id: 'summary', name: '总结', role: '子智能体', icon: '📋', desc: '对笔记/文档生成总结', callCount: 8 },
    research: { id: 'research', name: '研究', role: '子智能体', icon: '🔬', desc: '多轮深度调研', callCount: 3 },
    reader: { id: 'reader', name: '陪读', role: '子智能体', icon: '📖', desc: '陪读 PDF/论文，边读边聊', callCount: 5 }
  };
  /* 暴露给共享 ZX_DISPATCH 渲染 helper（Task 0.3） */
  window.ZX_AGENTS = AGENTS;

  /* ----------------------------- 对话 mock 数据 ----------------------------- */
  /* 修复 3：任务对话（按 taskId 取） */
  var MOCK_TASK_CHATS = {
    't1': [
      { role: 'ai', text: '我在分析「界面阻抗相关讨论」。已扫描 12 篇笔记，识别出 3 个争议点：测量方法、本体阻抗、界面涂层。', time: '09:02' },
      { role: 'ai', text: '目前在聚类「界面修饰」子主题，LiNbO₃ 涂层是被引用最多的方案。', time: '09:05' },
      { role: 'user', text: '沈砚的反对意见是怎么说的？', time: '09:06' },
      { role: 'ai', text: '沈砚认为长循环下本体阻抗才是决定因素，界面修饰只是短期增益。他给出 n=12 的循环数据，样本量偏小，结论方向可信但量级待复核。', time: '09:06' },
      { role: 'user', text: '那这个讨论有结论吗？', time: '09:08' },
      { role: 'ai', text: '暂时没有。我建议把「四电极体系复测」列为待验证项，等有 n≥30 的数据再下定论。要我建一个待办吗？', time: '09:08' }
    ],
    't2': [
      { role: 'ai', text: '《固态电解质》第 3 章我读到第 8 页了。本章主线是硫化物电解质的界面问题。', time: '14:02' },
      { role: 'ai', text: '关键论点：Li₆PS₅Cl 的室温电导率可达 10⁻³ S/cm，但与金属锂的界面稳定性差。', time: '14:05' },
      { role: 'user', text: 'LiNbO₃ 涂层能解决这个问题吗？', time: '14:06' },
      { role: 'ai', text: '能显著改善。LiNbO₃ 涂层在硫化物与正极之间形成稳定中间层，可降低界面阻抗约 10×。但要小心测量方法的影响。', time: '14:06' },
      { role: 'user', text: '10× 这个数字可信吗？', time: '14:08' },
      { role: 'ai', text: '在 EIS 等效电路拟合下可信。但若是两电极测量，可能高估。原文用的是四电极体系，我标注为「高可信」。', time: '14:08' }
    ]
  };

  /* 修复 4.1：历史对话列表 */
  var MOCK_CHAT_LIST = [
    { id: 'c1', title: '关于界面阻抗的讨论', preview: '林：已找到 3 篇相关笔记，正在对齐数据…', time: '刚刚', tags: ['界面阻抗', '固态电池'], kind: 'main' },
    { id: 'c2', title: '固态电池综述 PDF 陪读', preview: '林：第 3 章关键论点已抽取为卡片…', time: '10 分钟前', tags: ['PDF', '陪读'], kind: 'main' },
    { id: 'c3', title: '硫化物电解质的 5 大优势分析', preview: '林：从电导率、可塑性、低温性能看…', time: '昨天', tags: ['硫化物', '分析'], kind: 'main' },
    { id: 'c4', title: '本周学习总结', preview: '林：本周新增 8 篇笔记，主线推进 2 步…', time: '3 天前', tags: ['周报', '总结'], kind: 'main' },
    { id: 'c5', title: '宁德时代全固态路线图解读', preview: '林：2026 中试节点的关键指标是…', time: '上周', tags: ['行业', '路线图'], kind: 'main' },
    { id: 'mc-seed-1', title: '习惯打卡小程序', preview: '林：已构建完成，包含 5 个组件…', time: '昨天', tags: ['小程序', '习惯'], kind: 'miniapp' },
    { id: 'mc-seed-2', title: '读书清单小程序', preview: '林：已添加列表组件和统计…', time: '3 天前', tags: ['小程序', '阅读'], kind: 'miniapp' }
  ];

  /* 修复 4.4：历史对话消息（按 chatId 取） */
  var MOCK_CHAT_MESSAGES = {
    'c1': [
      { role: 'user', text: '帮我对齐一下界面阻抗的相关数据', time: '09:02' },
      { role: 'ai', text: '已找到 3 篇相关笔记，正在对齐数据。三篇分别是 @《固态电池界面阻抗的真相》《阻抗被高估了吗》《硫化物 vs 氧化物》。', time: '09:02' },
      { role: 'user', text: '给我一个对比表', time: '09:05' },
      { role: 'ai', text: '已生成对比表，挂在控制台的「分析界面阻抗」任务下。', time: '09:05', attach: 'compare-impedance.csv · 已生成' }
    ],
    'c2': [
      { role: 'ai', text: '开始陪读《固态电池综述.pdf》。当前进度 12%，停在第 3 章界面涂层。', time: '昨天 22:10' },
      { role: 'user', text: '继续读吧', time: '昨天 22:12' },
      { role: 'ai', text: '第 3 章关键论点已抽取为 5 张卡片。核心是 LiNbO₃ 涂层在硫化物体系中的作用。', time: '昨天 22:15' }
    ],
    'c3': [
      { role: 'user', text: '硫化物电解质有哪些优势？', time: '昨天 14:00' },
      { role: 'ai', text: '五大优势：① 高室温电导率（10⁻³ S/cm 级）② 良好的可塑性 ③ 低温性能优 ④ 与锂金属兼容性可改善 ⑤ 易于薄膜化。', time: '昨天 14:00' },
      { role: 'user', text: '主要缺点呢？', time: '昨天 14:02' },
      { role: 'ai', text: '主要缺点：空气敏感（遇水分解出 H₂S）、界面稳定性差、机械性能偏脆。', time: '昨天 14:02' }
    ],
    'c4': [
      { role: 'ai', text: '本周你新增了 8 篇笔记，主线「固态电池」推进了 2 步。热点集中在「界面阻抗」和「硫化物路线」。', time: '3 天前 20:00' },
      { role: 'user', text: '下周该关注什么？', time: '3 天前 20:05' },
      { role: 'ai', text: '建议关注：① 宁德时代中试进展 ② 四电极复测数据 ③ LiNbO₃ 涂层长循环稳定性。', time: '3 天前 20:05' }
    ],
    'c5': [
      { role: 'user', text: '宁德时代的全固态路线图怎么看？', time: '上周 10:00' },
      { role: 'ai', text: '2026 中试节点的关键指标：能量密度 350 Wh/kg、循环 500 次、界面阻抗降低 5×。整体节奏在业内属于第一梯队。', time: '上周 10:00' }
    ]
  };

  function findChatById(id) {
    for (var i = 0; i < MOCK_CHAT_LIST.length; i++) { if (MOCK_CHAT_LIST[i].id === id) return MOCK_CHAT_LIST[i]; }
    return null;
  }

  function nowHm() {
    var d = new Date();
    return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  /* ----------------------------- 页面栈状态机 ----------------------------- */

  var stack = ['duty'];
  var AXIS = {
    duty: 'none',
    editor: 'none',
    config: 'right',
    taskboard: 'right',
    assigntask: 'right',
    agent: 'right',
    'agent-config': 'right',
    workflow: 'right',
    'workflow-edit': 'right',
    'wf-new': 'right',
    detail: 'right',
    chat: 'bottom',
    chatlist: 'right',
    'miniapp-chat': 'right',
    template: 'right',
    discover: 'right',
    market: 'right',
    'market-detail': 'right'
  };
  var EXIT_BY_AXIS = { left: 'right', right: 'left', bottom: 'up', none: 'none' };
  var MAX_STACK = 6;
  var viewParams = {};

  function viewEl(name) { return $('.nb-view[data-view="' + name + '"]'); }

  function applyStack() {
    $all('.nb-view').forEach(function (v) {
      v.classList.remove('is-on', 'is-covered');
      v.removeAttribute('data-exit');
    });
    stack.forEach(function (name, i) {
      var v = viewEl(name);
      if (!v) return;
      if (i === stack.length - 1) v.classList.add('is-on');
      else v.classList.add('is-covered');
    });
    if (stack.length >= 2) {
      var top = stack[stack.length - 1];
      var under = viewEl(stack[stack.length - 2]);
      if (under) under.setAttribute('data-exit', EXIT_BY_AXIS[AXIS[top]] || 'none');
    }
    /* C5: 子页面（非 duty/editor 根视图）打开时隐藏底部 5-tab */
    var topName = stack[stack.length - 1];
    var isSubPage = (topName !== 'duty' && topName !== 'editor');
    document.body.classList.toggle('is-nb-sub-open', isSubPage);
  }

  function pushView(name, params) {
    if (stack[stack.length - 1] === name && !params) return;
    if (stack.length >= MAX_STACK) {
      toast('页面栈已满（最多 ' + MAX_STACK + ' 层），请先返回');
      return;
    }
    stack.push(name);
    viewParams[name] = params || null;
    applyStack();
    afterTransition(name, params);
  }

  function popView() {
    if (stack.length <= 1) return;
    var leaving = stack.pop();
    delete viewParams[leaving];
    applyStack();
    if (leaving === 'chat') {
      var i = chatInput(); if (i) i.blur(); closeMention();
      /* 自动保存钩子：离开对话页时静默归档到推荐分区 */
      try { autoArchiveChat(); } catch (e) {}
    }
  }

  /* 双视图切换：duty ↔ editor（与广场 tab toggleMode 一致的设计语言）
   * 规则：清空 stack 重置为 [目标视图]，避免子页残留 */
  function toggleView() {
    var current = stack[0];
    var target = (current === 'duty') ? 'editor' : 'duty';
    stack = [target];
    viewParams = {};
    applyStack();
    afterTransition(target, null);
  }

  function afterTransition(name, params) {
    params = params || viewParams[name];
    if (name === 'duty') { renderDuty(); }
    if (name === 'editor') { renderEditor(); }
    if (name === 'config') { renderConfig(); }
    if (name === 'view-designer') { renderViewDesigner(); }
    if (name === 'taskboard') { renderTaskboard(); }
    if (name === 'assigntask') { renderAssigntask(); }
    if (name === 'agent') { if (window.ZX_AGENT) window.ZX_AGENT.renderAgentPage(); }
    if (name === 'agent-config') {
      var p = params || {};
      if (p.kind === 'team' && window.ZX_AGENT) window.ZX_AGENT.renderTeamConfig(p.id);
      else if (window.ZX_AGENT) window.ZX_AGENT.renderAgentConfig(p.id);
    }
    if (name === 'workflow') { if (window.ZX_WORKFLOW) window.ZX_WORKFLOW.renderWorkflowList(); }
    if (name === 'workflow-edit') {
      var wp = params || {};
      if (window.ZX_WORKFLOW) window.ZX_WORKFLOW.renderWorkflowEdit(wp.id);
    }
    if (name === 'wf-new') { if (window.ZX_WORKFLOW) window.ZX_WORKFLOW.renderWorkflowNew(); }
    if (name === 'chat') {
      enterChat(params);
      window.setTimeout(function () { var i = chatInput(); if (i) i.focus(); scrollChatBottom(); }, 320);
    }
    if (name === 'chatlist') { renderChatList(); }
    if (name === 'miniapp-chat') { enterMiniappChat(params); }
    if (name === 'template') { renderTemplate(); }
    if (name === 'discover') { renderDiscover(); }
    if (name === 'market') {
      if (!marketState.initialized) {
        marketState.initialized = true;
        renderMarketTop();
      }
      renderMarket();
    }
    if (name === 'market-detail') { renderMarketDetail(); }
  }

  /* ----------------------------- Toast ----------------------------- */

  var toastTimer = null;
  function toast(msg, withSpark) {
    var t = $('[data-toast]');
    if (!t) return;
    t.innerHTML = (withSpark ? '<span class="nb-toast__spark">' + IC.spark() + '</span>' : '') + '<span>' + escapeHtml(msg) + '</span>';
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 1900);
  }

  /* ----------------------------- Sheet（底部模态） ----------------------------- */

  function openSheet(name) {
    var s = $('[data-sheet="' + name + '"]');
    if (s) s.classList.add('is-open');
  }
  function closeSheet(name) {
    $all('.nb-sheet').forEach(function (s) { s.classList.remove('is-open'); });
  }

  /* ----------------------------- 小组件数据与渲染 ----------------------------- */

  var state = {
    widgets: [
      {
        id: 'w1', type: 'ai-suggestion',
        title: '整理昨天的 5 篇固态电池笔记',
        desc: '昨天你新增了 5 篇关于固态电池的笔记，要不要让我帮你按主题归类？',
        assignType: 'organize'
      },
      {
        id: 'wchat1', type: 'chat',
        title: '与林的对话',
        recent: [
          { title: '关于界面阻抗的讨论', preview: '林：已找到 3 篇相关笔记…', time: '刚刚', chatId: 'c1' },
          { title: '固态电池综述 PDF 陪读', preview: '林：第 3 章关键论点已抽取…', time: '10 分钟前', chatId: 'c2' }
        ]
      },
      {
        id: 'w2', type: 'todo',
        title: '今日待办',
        items: [
          { text: '读完《界面阻抗的真相》原位 XPS 部分', done: true },
          { text: '回复张衡在讨论树里的评论', done: true },
          { text: '整理硫化物电解质相关笔记', done: false },
          { text: '写本周固态电池主线周报', done: false }
        ]
      },
      {
        id: 'w3', type: 'hotspot',
        title: '今日热点 · 固态电池',
        items: [
          { title: '硫化物电解质新突破：Li₆PS₅Cl 室温电导率刷新纪录', source: 'Nature Energy', reads: '1.2k 阅读' },
          { title: '宁德时代发布全固态路线图：2026 中试节点确认', source: '产业视角', reads: '956 阅读' },
          { title: 'QuantumScape Q2 财报：氧化物隔膜产线扩产', source: '财报速递', reads: '738 阅读' },
          { title: '界面阻抗是否被高估了？物理学群 72h 热议', source: '物理学群', reads: '1.5k 阅读' }
        ]
      },
      {
        id: 'w4', type: 'recall',
        title: '笔记回顾',
        items: [
          { label: '一周前的今天', noteId: 'n-solid-vs-liquid-review' },
          { label: '去年的今天', noteId: 'n-li-battery-paradigm' }
        ]
      },
      {
        id: 'w5', type: 'free',
        title: '我的便签',
        text: '记住：界面阻抗降低 10× 的声称，要先看测量方法（四电极体系 / EIS 等效电路拟合），再决定信不信。',
        tags: ['界面阻抗', '方法论']
      },
      {
        id: 'w6', type: 'ai-suggestion',
        title: '跟进：界面阻抗的争议',
        desc: '你在追的「界面阻抗」话题有新进展，反方（沈砚）新增了一条高赞评论，质疑长循环下本体才是决定因素。',
        assignType: 'analyze'
      },
      {
        id: 'w7', type: 'ai-suggestion',
        title: '陪读《锂电池综述》PDF',
        desc: '你 3 天前上传了《锂电池综述.pdf》但只读了 12%，要不要现在继续？我可以边读边抽关键论点。',
        assignType: 'pdf'
      }
    ]
  };

  var WIDGET_META = {
    'ai-suggestion': { chip: 'AI 建议', icon: function () { return IC.spark(); } },
    'chat': { chip: '对话', icon: function () { return IC.chat(); } },
    'todo': { chip: '待办', icon: function () { return IC.square(); } },
    'hotspot': { chip: '今日热点', icon: function () { return IC.flame(); } },
    'recall': { chip: '回顾', icon: function () { return IC.clock(); } },
    'free': { chip: '自定义', icon: function () { return IC.pencil(); } }
  };

  function widgetBody(w) {
    if (w.type === 'ai-suggestion') {
      return '<p class="nb-sug__desc">' + escapeHtml(w.desc) + '</p>' +
        '<div class="nb-sug__actions">' +
        '<button class="nb-btn nb-btn--primary nb-btn--sm" data-action="sug-start" data-id="' + w.id + '">开始</button>' +
        '<button class="nb-btn nb-btn--ghost nb-btn--sm" data-action="sug-ignore" data-id="' + w.id + '">忽略</button>' +
        '</div>';
    }
    if (w.type === 'chat') {
      var items = (w.recent || []).map(function (r) {
        return '<div class="nb-chat-w__item" data-action="open-chat-by-id" data-id="' + r.chatId + '">' +
          '<div class="nb-chat-w__row">' +
          '<p class="nb-chat-w__t">' + escapeHtml(r.title) + '</p>' +
          '<span class="nb-chat-w__time">' + escapeHtml(r.time) + '</span>' +
          '</div>' +
          '<p class="nb-chat-w__p">' + escapeHtml(r.preview) + '</p>' +
          '</div>';
      }).join('');
      return '<div class="nb-chat-w__list">' + items + '</div>' +
        '<div class="nb-chat-w__actions">' +
        '<button class="nb-btn nb-btn--outline nb-btn--sm" data-action="open-chatlist">查看全部</button>' +
        '<button class="nb-btn nb-btn--primary nb-btn--sm" data-action="new-chat">' + IC.plus() + ' 新对话</button>' +
        '</div>';
    }
    if (w.type === 'todo') {
      var items = w.items.map(function (it, idx) {
        return '<li class="nb-todo__item ' + (it.done ? 'is-done' : '') + '" data-action="todo-toggle" data-id="' + w.id + '" data-idx="' + idx + '">' +
          '<span class="nb-todo__box"></span><span class="nb-todo__text">' + escapeHtml(it.text) + '</span></li>';
      }).join('');
      return '<ul class="nb-todo__list">' + items + '</ul>' +
        '<button class="nb-todo__add" data-action="todo-add" data-id="' + w.id + '">' + IC.plus() + ' 添加待办</button>';
    }
    if (w.type === 'hotspot') {
      var rows = w.items.map(function (it, idx) {
        return '<li class="nb-hot__item" data-action="open-hot" data-id="' + w.id + '" data-idx="' + idx + '">' +
          '<span class="nb-hot__rank">' + (idx + 1) + '</span>' +
          '<div><p class="nb-hot__t">' + escapeHtml(it.title) + '</p>' +
          '<p class="nb-hot__m">' + escapeHtml(it.source) + ' · ' + escapeHtml(it.reads) + '</p></div></li>';
      }).join('');
      return '<ul class="nb-hot__list">' + rows + '</ul>';
    }
    if (w.type === 'recall') {
      var cards = w.items.map(function (it) {
        var n = noteById(it.noteId);
        var title = n ? n.title : '（已删除的笔记）';
        var excerpt = n ? n.summary.replace(/\s+/g, ' ').slice(0, 60) + '…' : '';
        return '<div class="nb-recall__item" data-action="open-recall" data-id="' + w.id + '" data-note="' + (it.noteId || '') + '">' +
          '<p class="nb-recall__label">' + escapeHtml(it.label) + '</p>' +
          '<p class="nb-recall__title">' + escapeHtml(title) + '</p>' +
          '<p class="nb-recall__excerpt">' + escapeHtml(excerpt) + '</p></div>';
      }).join('');
      return cards;
    }
    if (w.type === 'free') {
      var tags = (w.tags || []).map(function (t) { return '<span class="zx-chip">' + escapeHtml(t) + '</span>'; }).join('');
      return '<div class="nb-free__text" contenteditable="true" data-action="free-edit" data-id="' + w.id + '">' + escapeHtml(w.text) + '</div>' +
        '<div class="nb-free__tags">' + tags + '</div>';
    }
    return '';
  }

  function widgetMenu() {
    return '<div class="nb-wmenu" data-wmenu>' +
      '<button class="nb-wmenu__item" data-action="w-pin">置顶</button>' +
      '<button class="nb-wmenu__item" data-action="w-todo">转为待办</button>' +
      '<button class="nb-wmenu__item" data-action="w-settings">设置</button>' +
      '<button class="nb-wmenu__item nb-wmenu__item--danger" data-action="w-delete">删除</button>' +
      '</div>';
  }

  function handleIcon() { return svg('<path d="M12 5v14"/><path d="M8 9l4-4 4 4"/><path d="M8 15l4 4 4-4"/>'); }

  function renderWidgetCard(w) {
    var meta = WIDGET_META[w.type] || { chip: '', icon: function () { return ''; } };
    var h = w.height || 240;
    return '<article class="nb-widget nb-widget--' + w.type + '" data-widget="' + w.id + '" style="height:' + h + 'px">' +
      '<span class="nb-widget__height-badge">' + h + 'px</span>' +
      '<div class="nb-widget__head">' +
      '<span class="nb-widget__icon">' + meta.icon() + '</span>' +
      '<h3 class="nb-widget__title">' + escapeHtml(w.title) + '</h3>' +
      '<span class="nb-widget__chip nb-chip-mono">' + escapeHtml(meta.chip) + '</span>' +
      '<button class="nb-widget__more" data-action="widget-menu" data-id="' + w.id + '" aria-label="更多">⋯</button>' +
      widgetMenu() +
      '</div>' +
      '<div class="nb-widget__body">' + widgetBody(w) + '</div>' +
      '<span class="nb-widget__handle" data-widget-handle="' + w.id + '" aria-label="拖拽调整高度" role="separator">' + handleIcon() + '</span>' +
      '</article>';
  }

  function sugActionLabel(assignType) {
    if (assignType === 'pdf') return '陪读';
    if (assignType === 'analyze') return '跟进';
    if (assignType === 'organize') return '开始整理';
    if (assignType === 'summary') return '回答';
    return '开始';
  }

  function renderAiSuggestionCarousel(arr) {
    var count = arr.length;
    var chipText = 'AI 建议' + (count > 0 ? ' · ' + count + ' 个' : '');
    var body;
    if (count === 0) {
      body = '<div class="nb-aicarousel__empty">' + IC.spark() + '<p>暂无新建议</p></div>';
    } else {
      var slides = arr.map(function (w) {
        return '<div class="nb-aicarousel__slide" data-slide-id="' + w.id + '">' +
          '<h4 class="nb-aicarousel__slide-title">' + escapeHtml(w.title) + '</h4>' +
          '<p class="nb-aicarousel__slide-desc">' + escapeHtml(w.desc) + '</p>' +
          '<div class="nb-aicarousel__slide-actions">' +
          '<button class="nb-btn nb-btn--primary nb-btn--sm" data-action="sug-start" data-id="' + w.id + '">' + escapeHtml(sugActionLabel(w.assignType)) + '</button>' +
          '<button class="nb-btn nb-btn--ghost nb-btn--sm" data-action="sug-ignore" data-id="' + w.id + '">忽略</button>' +
          '</div>' +
          '</div>';
      }).join('');
      var dots = arr.map(function (_, i) {
        return '<span class="nb-aicarousel__dot' + (i === 0 ? ' is-active' : '') + '" data-dot="' + i + '"></span>';
      }).join('');
      body = '<div class="nb-aicarousel__viewport" data-aicarousel><div class="nb-aicarousel__track">' + slides + '</div></div>' +
        '<div class="nb-aicarousel__dots" data-aicarousel-dots>' + dots + '</div>';
    }
    var h = state.aiCarouselHeight || 240;
    return '<article class="nb-widget nb-widget--ai-suggestion nb-widget--ai-carousel" data-widget="ai-carousel" style="height:' + h + 'px">' +
      '<span class="nb-widget__height-badge">' + h + 'px</span>' +
      '<div class="nb-widget__head">' +
      '<span class="nb-widget__icon">' + IC.spark() + '</span>' +
      '<h3 class="nb-widget__title">AI 建议</h3>' +
      '<span class="nb-widget__chip nb-chip-mono">' + escapeHtml(chipText) + '</span>' +
      '</div>' +
      '<div class="nb-widget__body">' + body + '</div>' +
      '<span class="nb-widget__handle" data-widget-handle="ai-carousel" aria-label="拖拽调整高度" role="separator">' + handleIcon() + '</span>' +
      '</article>';
  }

  function bindCarouselScroll() {
    $all('[data-aicarousel]').forEach(function (vp) {
      if (vp.__zxCarBound) return;
      vp.__zxCarBound = true;
      vp.addEventListener('scroll', function () {
        var idx = Math.round(vp.scrollLeft / vp.clientWidth);
        var card = vp.closest('[data-widget="ai-carousel"]');
        if (!card) return;
        $all('.nb-aicarousel__dot', card).forEach(function (d, i) {
          d.classList.toggle('is-active', i === idx);
        });
      }, { passive: true });
    });
  }

  /* ========================================================================
   * 工作区重设计（2026-06-22）：值班台 / 编辑器视图 / 任务看板 / 布置任务
   * ====================================================================== */

  /* ----------------------------- 值班台数据 ----------------------------- */
  var DUTY_STATE = {
    greeting: function () {
      var h = new Date().getHours();
      if (h < 6) return '夜深了';
      if (h < 11) return '早上好';
      if (h < 14) return '中午好';
      if (h < 18) return '下午好';
      return '晚上好';
    },
    /* AI 工作动态流：status 决定左侧节点颜色和状态文案
     * doing 当前在做 / done 刚完成 / plan 下一步计划 */
    stream: [
      {
        id: 's1', status: 'doing', time: '刚刚', agent: 'research',
        title: '正在分析「界面阻抗相关讨论」',
        body: '已扫描 12 篇笔记，识别 3 个争议点：测量方法、本体阻抗、界面涂层。LiNbO₃ 涂层是被引用最多的方案。',
        product: '12 篇扫描中 · 60% 完成'
      },
      {
        id: 's2', status: 'done', time: '5 分钟前', agent: 'lin',
        title: '已完成「整理昨天的笔记」',
        body: '5 篇笔记按主题归类到「固态电池」主线。其中 2 篇涉及界面阻抗，已打标签 #界面修饰。',
        product: '5 篇归类 · 2 个新标签'
      },
      {
        id: 's3', status: 'done', time: '今天 09:00', agent: 'reader',
        title: '陪读《固态电解质》第 3 章',
        body: '已抽取 8 个关键论点，其中 3 个与你昨天的笔记相关。继续阅读可触发自动关联。',
        product: '24 页中已读 8 页'
      },
      {
        id: 's4', status: 'plan', time: '待启动', agent: 'lin',
        title: '计划：汇总本周界面阻抗研究',
        body: '基于已扫描的 12 篇笔记，输出一份争议点对比表，并标注每个方案的引用来源。',
        product: '预计 30 分钟'
      }
    ]
  };

  function dutyTaskSummary() {
    return {
      doing: (TASKS.doing || []).length,
      todo: (TASKS.todo || []).length,
      done: (TASKS.done || []).length
    };
  }

  /* 值班台 = 工作区首屏（2026-06-23 v2 重设计）
   * 进入工作区 = AI 主导的动态落地页：过场动画 → 问候语上移 → 三个选项。
   * 不再有输入框、看板动态流。看板直接走任务看板，动态流已删除（与任务重复）。
   * 右上角保留：任务看板 + 会话列表。 */

  /* ----------------------------- 值班台渲染 ----------------------------- */
  function renderDuty() {
    var box = $('[data-duty-scroll]');
    if (!box) return;
    renderDutyLanding(box);
  }

  /* 首屏落地页：顶栏(菜单+任务+会话列表) / AI动态区(问候语) / 三选项 */
  /* A3: 每次进入随机使用文字 */
  var DUTY_SUBS = [
    '林已就绪', '随时待命', '准备就绪', '今日事今日毕',
    '灵感正在涌动', '已整理好思绪', '等待你的指令', '今日宜创作',
    '万物皆可记录', '思绪已归位', '清空了昨日杂念', '新的一天，新的可能'
  ];
  function dutySub() { return DUTY_SUBS[Math.floor(Math.random() * DUTY_SUBS.length)]; }

  function renderDutyLanding(box) {
    box.innerHTML =
      '<header class="nb-duty-topbar">' +
        '<button class="nb-duty-menu" data-action="duty-menu" aria-label="菜单">' + IC.menu() + '</button>' +
        '<div class="nb-duty-topbar__right">' +
          '<button class="nb-duty-iconbtn" data-action="duty-open-task" aria-label="任务看板">' + IC.list() + '</button>' +
          '<button class="nb-duty-iconbtn" data-action="open-chatlist" aria-label="会话列表">' + IC.chat() + '</button>' +
        '</div>' +
      '</header>' +
      '<div class="nb-duty-landing">' +
        '<div class="nb-duty-landing__hero">' +
          '<p class="nb-duty-landing__greeting">' + escapeHtml(DUTY_STATE.greeting()) + '</p>' +
          '<p class="nb-duty-landing__sub">' + escapeHtml(dutySub()) + '</p>' +
        '</div>' +
        '<div class="nb-duty-landing__options">' +
          '<button class="nb-duty-option" data-action="duty-start-chat">' +
            '<span class="nb-duty-option__icon">' + IC.chat() + '</span>' +
            '<span class="nb-duty-option__label">开始对话</span>' +
          '</button>' +
          '<button class="nb-duty-option" data-action="duty-miniapp">' +
            '<span class="nb-duty-option__icon">' + IC.spark() + '</span>' +
            '<span class="nb-duty-option__label">自制小程序</span>' +
          '</button>' +
          '<button class="nb-duty-option" data-action="duty-open-task">' +
            '<span class="nb-duty-option__icon">' + IC.list() + '</span>' +
            '<span class="nb-duty-option__label">查看任务</span>' +
          '</button>' +
          '<button class="nb-duty-option" data-action="duty-discover">' +
            '<span class="nb-duty-option__icon">' + IC.search() + '</span>' +
            '<span class="nb-duty-option__label">找点新东西</span>' +
          '</button>' +
        '</div>' +
      '</div>';

    /* 过场动画：每次进入延迟标记 landed，触发问候语上移 + 选项淡入 */
    var landing = box.querySelector('.nb-duty-landing');
    setTimeout(function () {
      if (landing && document.body.contains(landing)) landing.classList.add('is-landed');
    }, 1400);
  }

  /* ----------------------------- 编辑器视图数据 ----------------------------- */
  var EDITOR_MODE = 'tree'; /* 'tree' | 'shelf' | 'mind'（由配置界面选择） */

  /* ----------------------------- 笔记本可见度（Task 1.6） -----------------------------
   * 笔记本 = 工作区皆文件中的 Notebook 容器，每个 Notebook 可覆盖全局默认可见度。
   * 默认可见度：本地变量 nbDefaultVis（继承 VIS.defaultVisibility()）。
   * ------------------------------------------------------------------------- */
  var nbDefaultVis = window.VIS ? VIS.defaultVisibility() : null;
  var nbVisibilityMap = {}; /* key -> visibility object（覆盖项）*/

  function notebookVis(nbKey) {
    return nbVisibilityMap[nbKey] || (window.VIS ? VIS.defaultVisibility() : null);
  }
  function renderNbVisChip(nbKey) {
    var v = notebookVis(nbKey);
    if (!v || !window.VIS) return '';
    return '<span class="nb-vis-slot" data-nb-vis="' + nbKey + '">' + VIS.chipHTML(v) + '</span>';
  }
  function renderNbDefaultVisChip() {
    if (!window.VIS || !nbDefaultVis) return '';
    return '<span class="nb-vis-slot" data-nb-default-vis>' + VIS.chipHTML(nbDefaultVis) + '</span>';
  }

  /* 折叠状态：默认展开首个 Portfolio 与首个 Notebook */
  var treeExpand = { portfolios: {}, notebooks: {} };
  var treeFirstInit = false;

  function bridge() { return window.ZX_BRIDGE || null; }

  /* 文件类型 → 图标（与 spec 树视图图标对齐） */
  var FILE_TYPE_ICONS = {
    note: '📝', template: '🎨', workflow: '⚙️', code: '📦', plugin: '🔌', chat: '💬',
    miniapp: '🧩', skill: '🛠'
  };
  var FILE_TYPE_LABELS = {
    note: '笔记', template: '模板', workflow: '工作流', code: '代码', plugin: '插件', chat: '对话',
    miniapp: '小程序', skill: '技能'
  };

  /* fileToTreeNode：把统一 File 转为树节点 { id, name, type, icon, summary, aiCo } */
  function fileToTreeNode(f) {
    var type = f.type || 'note';
    var icon = FILE_TYPE_ICONS[type] || '📝';
    var content = f.content || {};
    var summary = '';
    if (type === 'note') {
      summary = f.summary || '';
    } else if (type === 'chat') {
      var msgCount = (content.msgs || []).length;
      summary = msgCount ? (msgCount + ' 条消息') : '空对话';
    } else if (type === 'template') {
      summary = content.desc || '';
    } else if (type === 'workflow') {
      var steps = content.steps || [];
      summary = steps.length + ' 个步骤';
    } else if (type === 'code') {
      summary = content.language || '';
    } else if (type === 'plugin') {
      var manifest = content.manifest || {};
      summary = manifest.desc || '';
    } else if (type === 'miniapp') {
      var comps = content.components || [];
      summary = comps.length + ' 组件 · ' + (content.template || '自定义');
    } else if (type === 'skill') {
      var caps = content.capabilities || [];
      summary = caps.length ? caps.join(' / ') : '技能包';
    }
    return {
      id: f.id,
      name: f.name || f.title || '未命名',
      type: type,
      icon: icon,
      summary: summary,
      aiCo: (type === 'note' || type === 'chat') ? !!(f.aiCo || content.aiCo) : false
    };
  }

  function editorTreeData() {
    var b = bridge();
    var portfolios = (b && b.getPortfolios) ? b.getPortfolios() : [];
    var result = [];
    /* 默认展开首层，便于一眼看到笔记 */
    if (!treeFirstInit && portfolios.length) {
      treeExpand.portfolios[portfolios[0].id] = true;
      var firstNbs = (b && b.getNotebooks) ? b.getNotebooks(portfolios[0].id) : [];
      if (firstNbs.length) treeExpand.notebooks[firstNbs[0].id] = true;
      treeFirstInit = true;
    }
    portfolios.forEach(function (p) {
      var notebooks = (b && b.getNotebooks) ? b.getNotebooks(p.id) : [];
      var nbList = notebooks.map(function (nb) {
        /* Task 3.1：取多类型 File（不过滤类型） */
        var files = (b && b.getFilesByNotebook) ? b.getFilesByNotebook(nb.id) : [];
        return {
          id: nb.id,
          label: nb.name || '未命名笔记本',
          icon: '📒',
          type: 'notebook',
          files: files.map(fileToTreeNode)
        };
      });
      result.push({
        id: p.id,
        label: p.name || '未命名作品集',
        icon: p.icon || '📦',
        type: 'portfolio',
        notebooks: nbList
      });
    });
    return result;
  }

  /* 扁平化所有 Notebook（供「新建笔记选笔记本」「移动笔记」选择器使用） */
  function flattenNotebooks() {
    var out = [];
    editorTreeData().forEach(function (p) {
      (p.notebooks || []).forEach(function (nb) {
        out.push({ id: nb.id, label: nb.label, portfolioLabel: p.label, fileCount: (nb.files || []).length });
      });
    });
    return out;
  }

  /* ----------------------------- 编辑器视图渲染 -----------------------------
   * 重构（工作区皆文件）：Portfolio → Notebook → Note 三层可折叠真树，
   * 替换原 life/work/study 桶。书架 / 思维导图模式读同一份 editorTreeData。
   * 顶栏：菜单 + 新建作品集 + 新建笔记 + 设置 */
  function renderEditor() {
    var box = $('[data-editor-scroll]');
    if (!box) return;
    var groups = editorTreeData();
    /* 文件树模式：三层可折叠 */
    var treeHtml = renderTreeHtml(groups);
    if (!treeHtml) {
      treeHtml = '<div class="nb-editor-empty">还没有作品集。点 + 创建第一个。</div>';
    }
    /* 书架模式：把所有 Notebook 的文件拍平成卡片 */
    var shelfRows = [];
    groups.forEach(function (p) {
      (p.notebooks || []).forEach(function (nb) {
        if (!nb.files.length) return;
        var cards = nb.files.map(function (n) {
          var action = n.type === 'note' ? 'editor-open-note' : 'editor-open-file';
          var dataAttrs = 'data-action="' + action + '" data-id="' + n.id + '"';
          if (n.type !== 'note') dataAttrs += ' data-type="' + n.type + '"';
          return '<button class="nb-editor-shelf__card" ' + dataAttrs + '>' +
            '<span class="nb-editor-shelf__spine"></span>' +
            '<span class="nb-editor-shelf__icon">' + n.icon + '</span>' +
            '<span class="nb-editor-shelf__title">' + escapeHtml((n.name || '').slice(0, 12)) + '</span>' +
          '</button>';
        }).join('');
        shelfRows.push('<div class="nb-editor-shelf__group">' +
          '<div class="nb-editor-shelf__head">' + nb.icon + ' ' + escapeHtml(nb.label) + '</div>' +
          '<div class="nb-editor-shelf__row">' + cards + '</div>' +
        '</div>');
      });
    });
    var shelfHtml = shelfRows.join('') || '<div class="nb-editor-empty">还没有文件。</div>';

    box.innerHTML =
      '<header class="nb-editor-topbar">' +
        '<button class="nb-editor-menu" data-action="editor-menu" aria-label="菜单">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 6h18M3 12h18M3 18h18"/></svg>' +
        '</button>' +
        '<h2 class="nb-editor-topbar__title">工作区</h2>' +
        '<div class="nb-editor-topbar__right">' +
          '<button class="nb-editor-add" data-action="editor-new-portfolio" aria-label="新建作品集">' + IC.folderPlus() + '</button>' +
          '<button class="nb-editor-add" data-action="editor-add" aria-label="新建笔记">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
          '</button>' +
          '<button class="nb-editor-config" data-action="editor-config" aria-label="工作区配置">' +
            '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.6 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.6a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09A1.65 1.65 0 0 0 15 4.6a1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>' +
          '</button>' +
        '</div>' +
      '</header>' +
      '<div class="nb-editor-tree" ' + (EDITOR_MODE === 'tree' ? '' : 'hidden') + '>' + treeHtml + '</div>' +
      '<div class="nb-editor-shelf" ' + (EDITOR_MODE === 'shelf' ? '' : 'hidden') + '>' + shelfHtml + '</div>' +
      '<div class="nb-editor-mind" ' + (EDITOR_MODE === 'mind' ? '' : 'hidden') + '>' + renderMindHtml(groups) + '</div>';
  }

  /* 文件树 HTML：Portfolio → Notebook → File（多类型） */
  function renderTreeHtml(groups) {
    var html = '';
    groups.forEach(function (p) {
      var pOpen = treeExpand.portfolios[p.id];
      var nbCount = (p.notebooks || []).length;
      var pTools =
        '<span class="nb-editor-tree__tools">' +
          '<button class="nb-editor-tree__tool" data-action="editor-new-notebook" data-id="' + p.id + '" title="新建笔记本" aria-label="新建笔记本">' + IC.bookPlus() + '</button>' +
          '<button class="nb-editor-tree__tool" data-action="editor-rename-portfolio" data-id="' + p.id + '" title="重命名" aria-label="重命名">' + IC.edit() + '</button>' +
          '<button class="nb-editor-tree__tool nb-editor-tree__tool--danger" data-action="editor-delete-portfolio" data-id="' + p.id + '" title="删除" aria-label="删除">' + IC.trash() + '</button>' +
        '</span>';
      html += '<div class="nb-editor-tree__portfolio' + (pOpen ? ' is-expanded' : '') + '">' +
        '<div class="nb-editor-tree__head nb-editor-tree__head--portfolio" data-action="editor-toggle-portfolio" data-id="' + p.id + '">' +
          '<span class="nb-editor-tree__arrow' + (pOpen ? ' is-open' : '') + '">' + IC.chev() + '</span>' +
          '<span class="nb-editor-tree__icon">' + p.icon + '</span>' +
          '<span class="nb-editor-tree__label" data-rename-label="portfolio" data-id="' + p.id + '">' + escapeHtml(p.label) + '</span>' +
          '<span class="nb-editor-tree__count">' + nbCount + '</span>' +
          pTools +
        '</div>' +
        '<div class="nb-editor-tree__nb-wrap"' + (pOpen ? '' : ' hidden') + '>';
      (p.notebooks || []).forEach(function (nb) {
        var nbOpen = treeExpand.notebooks[nb.id];
        var fileCount = (nb.files || []).length;
        var nbTools =
          '<span class="nb-editor-tree__tools">' +
            '<button class="nb-editor-tree__tool" data-action="editor-rename-notebook" data-id="' + nb.id + '" title="重命名" aria-label="重命名">' + IC.edit() + '</button>' +
            '<button class="nb-editor-tree__tool nb-editor-tree__tool--danger" data-action="editor-delete-notebook" data-id="' + nb.id + '" title="删除" aria-label="删除">' + IC.trash() + '</button>' +
          '</span>';
        var items = (nb.files || []).map(function (n) {
          var summary = n.summary ? escapeHtml(String(n.summary).slice(0, 28)) : '';
          /* Task 3.2：note → editor-open-note；其它类型 → editor-open-file */
          var action = n.type === 'note' ? 'editor-open-note' : 'editor-open-file';
          var dataAttrs = 'data-id="' + n.id + '"';
          if (n.type !== 'note') dataAttrs += ' data-type="' + n.type + '"';
          return '<div class="nb-editor-tree__item" data-action="' + action + '" ' + dataAttrs + '>' +
            '<span class="nb-editor-tree__type-icon" title="' + escapeHtml(FILE_TYPE_LABELS[n.type] || n.type) + '">' + n.icon + '</span>' +
            '<span class="nb-editor-tree__title">' + escapeHtml(n.name) + '</span>' +
            (summary ? '<span class="nb-editor-tree__summary">' + summary + '</span>' : '') +
            (n.aiCo ? '<span class="nb-editor-tree__aico" title="AI 协作">✦</span>' : '') +
            '<span class="nb-editor-tree__tools">' +
              '<button class="nb-editor-tree__tool" data-action="editor-move-note" data-id="' + n.id + '" title="移动到其他笔记本" aria-label="移动">' + IC.move() + '</button>' +
            '</span>' +
          '</div>';
        }).join('');
        if (!items) items = '<div class="nb-editor-tree__empty">暂无文件</div>';
        html += '<div class="nb-editor-tree__notebook' + (nbOpen ? ' is-expanded' : '') + '">' +
          '<div class="nb-editor-tree__head nb-editor-tree__head--notebook" data-action="editor-toggle-notebook" data-id="' + nb.id + '">' +
            '<span class="nb-editor-tree__arrow' + (nbOpen ? ' is-open' : '') + '">' + IC.chev() + '</span>' +
            '<span class="nb-editor-tree__icon">' + nb.icon + '</span>' +
            '<span class="nb-editor-tree__label" data-rename-label="notebook" data-id="' + nb.id + '">' + escapeHtml(nb.label) + '</span>' +
            '<span class="nb-editor-tree__count">' + fileCount + '</span>' +
            nbTools +
          '</div>' +
          '<div class="nb-editor-tree__items"' + (nbOpen ? '' : ' hidden') + '>' + items + '</div>' +
        '</div>';
      });
      html += '</div></div>';
    });
    return html;
  }

  /* 思维导图模式：读同一份 Portfolio/Notebook/File 数据，左→右发散 */
  function renderMindHtml(groups) {
    if (!groups.length) {
      return '<div class="nb-editor-empty">还没有作品集。</div>';
    }
    var PORT_X = 16, NB_X = 190, NOTE_X = 360, LEAF_H = 34, NODE_W = 150;
    var y = 16, totalH = 16;
    var pNodes = [], nbNodes = [], noteNodes = [];
    var edges = []; /* {x1,y1,x2,y2} */
    groups.forEach(function (p) {
      var startY = y;
      (p.notebooks || []).forEach(function (nb) {
        var nbStartY = y;
        var nbFiles = nb.files || [];
        if (!nbFiles.length) {
          y += LEAF_H;
        } else {
          nbFiles.forEach(function (n) {
            var ntY = y + LEAF_H / 2;
            noteNodes.push({ x: NOTE_X, y: ntY, title: n.name, aiCo: n.aiCo, icon: n.icon });
            y += LEAF_H;
          });
        }
        var nbCenter = (nbStartY + y) / 2;
        nbNodes.push({ id: nb.id, x: NB_X, y: nbCenter, label: nb.label, icon: nb.icon });
        /* 收集 notebook → 每条 file 的连线 */
        var idx = noteNodes.length - nbFiles.length;
        for (var k = 0; k < nbFiles.length; k++) {
          edges.push({ x1: NB_X + NODE_W, y1: nbCenter, x2: NOTE_X, y2: noteNodes[idx + k].y });
        }
      });
      if (!(p.notebooks || []).length) { y += LEAF_H; }
      var pCenter = (startY + y) / 2;
      pNodes.push({ id: p.id, x: PORT_X, y: pCenter, label: p.label, icon: p.icon });
      /* 收集 portfolio → 每个 notebook 的连线 */
      nbNodes.slice(-((p.notebooks || []).length)).forEach(function (nn) {
        edges.push({ x1: PORT_X + NODE_W, y1: pCenter, x2: NB_X, y2: nn.y });
      });
      y += 24;
      totalH = y;
    });
    var svgW = NOTE_X + NODE_W + 16;
    var lines = edges.map(function (e) {
      var mx = (e.x1 + e.x2) / 2;
      return '<path d="M' + e.x1 + ' ' + e.y1 + ' C' + mx + ' ' + e.y1 + ',' + mx + ' ' + e.y2 + ',' + e.x2 + ' ' + e.y2 + '" fill="none" stroke="rgba(199,162,74,0.55)" stroke-width="1.2"/>';
    }).join('');
    var nodes = '';
    pNodes.forEach(function (p) {
      nodes += '<div class="nb-mind-node nb-mind-node--portfolio" style="left:' + p.x + 'px;top:' + (p.y - 15) + 'px;width:' + NODE_W + 'px">' + p.icon + ' ' + escapeHtml(p.label) + '</div>';
    });
    nbNodes.forEach(function (nb) {
      nodes += '<div class="nb-mind-node nb-mind-node--notebook" style="left:' + nb.x + 'px;top:' + (nb.y - 14) + 'px;width:' + NODE_W + 'px">' + nb.icon + ' ' + escapeHtml(nb.label) + '</div>';
    });
    noteNodes.forEach(function (nt) {
      nodes += '<div class="nb-mind-node nb-mind-node--note" style="left:' + nt.x + 'px;top:' + (nt.y - 13) + 'px;width:' + NODE_W + 'px">' +
        (nt.aiCo ? '<span class="nb-mind-node__aico">✦</span>' : '') + (nt.icon || '') + ' ' + escapeHtml((nt.title || '').slice(0, 12)) + '</div>';
    });
    return '<div class="nb-editor-mind__hint">思维导图 · Portfolio → Notebook → File</div>' +
      '<div class="nb-editor-mind__canvas" style="width:' + svgW + 'px;height:' + totalH + 'px">' +
        '<svg class="nb-editor-mind__svg" viewBox="0 0 ' + svgW + ' ' + totalH + '" preserveAspectRatio="xMinYMin meet">' + lines + '</svg>' +
        nodes +
      '</div>';
  }

  function switchEditorMode(mode) {
    if (['tree', 'shelf', 'mind'].indexOf(mode) < 0) return;
    EDITOR_MODE = mode;
    var tree = $('.nb-editor-tree');
    var shelf = $('.nb-editor-shelf');
    var mind = $('.nb-editor-mind');
    if (tree) tree.hidden = (mode !== 'tree');
    if (shelf) shelf.hidden = (mode !== 'shelf');
    if (mind) mind.hidden = (mode !== 'mind');
  }

  /* ----------------------------- 工作区配置视图 -----------------------------
   * 全屏覆盖视图：视图选择（文件树/书架/思维导图）+ 隐私配置（各笔记本可见度统一管理）
   * 设计理念：工作区的视图形式由更高的第三者（插件系统/用户配置）决定 */
  function renderConfig() {
    var box = $('[data-config-scroll]');
    if (!box) return;

    /* 视图选择卡片 */
    var viewOpts = [
      { mode: 'tree', label: '文件树', desc: '传统层级列表', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M3 6h6M3 12h12M3 18h6"/><circle cx="15" cy="6" r="2"/><circle cx="21" cy="12" r="2"/><circle cx="15" cy="18" r="2"/></svg>' },
      { mode: 'shelf', label: '书架视图', desc: '类似小说书架的卡片排列', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="3" y="4" width="4" height="16" rx="1"/><rect x="9" y="4" width="4" height="16" rx="1"/><rect x="15" y="4" width="4" height="16" rx="1"/></svg>' },
      { mode: 'mind', label: '思维导图', desc: '节点辐射式导图', icon: '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><circle cx="12" cy="12" r="3"/><circle cx="4" cy="6" r="2"/><circle cx="20" cy="6" r="2"/><circle cx="4" cy="18" r="2"/><circle cx="20" cy="18" r="2"/><path d="M9.5 10.5L6 7.5M14.5 10.5L18 7.5M9.5 13.5L6 16.5M14.5 13.5L18 16.5"/></svg>' }
    ];
    var viewHtml = viewOpts.map(function (v) {
      var active = EDITOR_MODE === v.mode;
      return '<button class="nb-cfg-view__opt' + (active ? ' is-active' : '') + '" data-action="cfg-set-view" data-mode="' + v.mode + '">' +
        '<span class="nb-cfg-view__icon">' + v.icon + '</span>' +
        '<span class="nb-cfg-view__label">' + v.label + '</span>' +
        '<span class="nb-cfg-view__desc">' + v.desc + '</span>' +
        '<span class="nb-cfg-view__check">' + (active ? '✓' : '') + '</span>' +
      '</button>';
    }).join('');
    /* 添加自定义视图入口（跳转到视图设计器） */
    viewHtml += '<button class="nb-cfg-view__opt nb-cfg-view__opt--add" data-action="cfg-add-view">' +
      '<span class="nb-cfg-view__icon"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg></span>' +
      '<span class="nb-cfg-view__label">添加视图</span>' +
      '<span class="nb-cfg-view__desc">设计自己的展现形式</span>' +
      '<span class="nb-cfg-view__check"></span>' +
    '</button>';

    /* 隐私配置：各笔记本可见度统一管理（按 Notebook 列出） */
    var nbForVis = flattenNotebooks();
    var visRows = nbForVis.map(function (nb) {
      var v = notebookVis(nb.id);
      var chipHtml = v && window.VIS ? VIS.chipHTML(v) : '<span class="vis-chip"><span class="vis-chip__label">未设置</span></span>';
      return '<div class="nb-cfg-vis__row">' +
        '<span class="nb-cfg-vis__icon">📒</span>' +
        '<span class="nb-cfg-vis__label">' + escapeHtml(nb.label) + '</span>' +
        '<span class="nb-cfg-vis__chip" data-nb-vis="' + nb.id + '">' + chipHtml + '</span>' +
      '</div>';
    }).join('');
    var defaultChipHtml = nbDefaultVis && window.VIS ? VIS.chipHTML(nbDefaultVis) : '<span class="vis-chip"><span class="vis-chip__label">默认</span></span>';

    box.innerHTML =
      '<header class="nb-cfg-topbar">' +
        '<button class="nb-cfg-back" data-action="cfg-back" aria-label="返回">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>' +
        '</button>' +
        '<h2 class="nb-cfg-title">工作区配置</h2>' +
      '</header>' +
      '<div class="nb-cfg-body">' +
        '<section class="nb-cfg-section">' +
          '<h3 class="nb-cfg-section__title">视图模式</h3>' +
          '<p class="nb-cfg-section__hint">工作区的展现形式由配置决定，而非固定的文件树或思维导图</p>' +
          '<div class="nb-cfg-view__list">' + viewHtml + '</div>' +
        '</section>' +
        '<section class="nb-cfg-section">' +
          '<h3 class="nb-cfg-section__title">隐私配置</h3>' +
          '<p class="nb-cfg-section__hint">统一管理各笔记本分区的可见度</p>' +
          '<div class="nb-cfg-vis__list">' +
            '<div class="nb-cfg-vis__row nb-cfg-vis__row--default">' +
              '<span class="nb-cfg-vis__icon">★</span>' +
              '<span class="nb-cfg-vis__label">默认可见度</span>' +
              '<span class="nb-cfg-vis__chip" data-nb-default-vis>' + defaultChipHtml + '</span>' +
            '</div>' +
            visRows +
          '</div>' +
        '</section>' +
      '</div>';
  }

  /* ----------------------------- 视图设计器 -----------------------------
   * 自定义视图设计页：命名 → 选布局 → 选展示项 → 排序 → 预览 → 保存
   * 设计理念：视图形式不限于内置三种，用户可 DIY 自己的展现形式 */
  var VD_LAYOUTS = [
    { key: 'list',    label: '列表',   desc: '纵向单列', icon: '☰' },
    { key: 'grid',    label: '网格',   desc: '行列对齐', icon: '▦' },
    { key: 'card',    label: '卡片',   desc: '独立卡片流', icon: '❏' },
    { key: 'gallery', label: '画廊',   desc: '横向滑动', icon: '⇆' },
    { key: 'compact', label: '紧凑',   desc: '信息密度高', icon: '≣' }
  ];
  var VD_FIELDS = [
    { key: 'icon',    label: '类型图标' },
    { key: 'summary', label: '摘要预览' },
    { key: 'count',   label: '子项数量' },
    { key: 'aico',    label: 'AI 协作标' },
    { key: 'time',    label: '更新时间' }
  ];
  var VD_SORTS = [
    { key: 'manual',  label: '手动排序' },
    { key: 'time',    label: '按更新时间' },
    { key: 'name',    label: '按名称' },
    { key: 'aico',    label: 'AI 协作优先' }
  ];
  var vdState = { name: '', layout: 'list', fields: { icon: true, summary: true, count: true, aico: false, time: false }, sort: 'manual' };

  function renderViewDesigner() {
    var box = $('[data-vd-scroll]');
    if (!box) return;
    var layoutHtml = VD_LAYOUTS.map(function (l) {
      var active = vdState.layout === l.key;
      return '<button class="nb-vd-chip' + (active ? ' is-active' : '') + '" data-action="vd-pick-layout" data-layout="' + l.key + '">' +
        '<span class="nb-vd-chip__icon">' + l.icon + '</span>' +
        '<span class="nb-vd-chip__label">' + l.label + '</span>' +
        '<span class="nb-vd-chip__desc">' + l.desc + '</span>' +
      '</button>';
    }).join('');
    var fieldHtml = VD_FIELDS.map(function (f) {
      var on = !!vdState.fields[f.key];
      return '<button class="nb-vd-toggle' + (on ? ' is-on' : '') + '" data-action="vd-toggle-field" data-field="' + f.key + '">' +
        '<span class="nb-vd-toggle__dot"></span>' +
        '<span class="nb-vd-toggle__label">' + f.label + '</span>' +
      '</button>';
    }).join('');
    var sortHtml = VD_SORTS.map(function (s) {
      var active = vdState.sort === s.key;
      return '<button class="nb-vd-seg' + (active ? ' is-active' : '') + '" data-action="vd-pick-sort" data-sort="' + s.key + '">' + s.label + '</button>';
    }).join('');
    /* 预览：用真实笔记本数据生成 3 条样例 */
    var nbs = flattenNotebooks().slice(0, 3);
    var previewHtml = nbs.map(function (nb) {
      var parts = ['<span class="nb-vd-prev__name">' + escapeHtml(nb.label) + '</span>'];
      if (vdState.fields.icon) parts.unshift('<span class="nb-vd-prev__icon">📒</span>');
      if (vdState.fields.count) parts.push('<span class="nb-vd-prev__meta">' + (nb.fileCount || 0) + ' 篇</span>');
      if (vdState.fields.aico) parts.push('<span class="nb-vd-prev__meta">✦</span>');
      if (vdState.fields.time) parts.push('<span class="nb-vd-prev__meta">刚刚</span>');
      return '<div class="nb-vd-prev__item nb-vd-prev__item--' + vdState.layout + '">' + parts.join('') + '</div>';
    }).join('');
    if (!previewHtml) previewHtml = '<div class="nb-vd-empty">暂无笔记本可预览</div>';

    box.innerHTML =
      '<header class="nb-vd-topbar">' +
        '<button class="nb-vd-back" data-action="vd-back" aria-label="返回">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>' +
        '</button>' +
        '<h2 class="nb-vd-title">视图设计器</h2>' +
        '<button class="nb-vd-save" data-action="vd-save">保存</button>' +
      '</header>' +
      '<div class="nb-vd-body">' +
        '<section class="nb-vd-section">' +
          '<h3 class="nb-vd-section__title">视图名称</h3>' +
          '<input class="nb-vd-name-input" data-vd-name type="text" placeholder="如：我的收藏视图" value="' + escapeHtml(vdState.name) + '">' +
        '</section>' +
        '<section class="nb-vd-section">' +
          '<h3 class="nb-vd-section__title">布局形式</h3>' +
          '<p class="nb-vd-section__hint">选择节点排列方式</p>' +
          '<div class="nb-vd-layout-list">' + layoutHtml + '</div>' +
        '</section>' +
        '<section class="nb-vd-section">' +
          '<h3 class="nb-vd-section__title">展示字段</h3>' +
          '<p class="nb-vd-section__hint">勾选每个节点要显示的信息</p>' +
          '<div class="nb-vd-field-list">' + fieldHtml + '</div>' +
        '</section>' +
        '<section class="nb-vd-section">' +
          '<h3 class="nb-vd-section__title">排序方式</h3>' +
          '<div class="nb-vd-sort-seg">' + sortHtml + '</div>' +
        '</section>' +
        '<section class="nb-vd-section">' +
          '<h3 class="nb-vd-section__title">预览</h3>' +
          '<p class="nb-vd-section__hint">基于当前配置的实时预览</p>' +
          '<div class="nb-vd-preview">' + previewHtml + '</div>' +
        '</section>' +
      '</div>';
    /* 绑定名称输入 */
    var nameInput = $('[data-vd-name]');
    if (nameInput) nameInput.addEventListener('input', function (e) { vdState.name = e.target.value; });
  }

  function pickViewLayout(key) {
    vdState.layout = key;
    renderViewDesigner();
  }

  function saveCustomView() {
    var name = (vdState.name || '').trim();
    if (!name) { toast('请先填写视图名称'); return; }
    toast('已保存自定义视图「' + name + '」（demo）');
    popView();
  }

  /* ----------------------------- 任务看板数据 ----------------------------- */
  var currentFilter = '全部';
  var calendarState = { view: 'week', monthOffset: 0, selectedDate: null };

  /* 解析任务日期字符串为 Date 对象 */
  function parseTaskDate(str) {
    if (!str) return null;
    var now = new Date();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (str.indexOf('今天') >= 0) return today;
    if (str.indexOf('昨天') >= 0) { var d = new Date(today); d.setDate(d.getDate() - 1); return d; }
    if (str.indexOf('前天') >= 0) { var d = new Date(today); d.setDate(d.getDate() - 2); return d; }
    if (str.indexOf('上周') >= 0) { var d = new Date(today); d.setDate(d.getDate() - 7); return d; }
    if (str.indexOf('本周') >= 0) return today;
    var m = str.match(/(\d+)月(\d+)日/);
    if (m) return new Date(now.getFullYear(), parseInt(m[1]) - 1, parseInt(m[2]));
    return null;
  }

  function dateKey(d) { return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }

  /* 统计某天任务密度 */
  function getTaskDensity(date) {
    if (!date) return 0;
    var dk = dateKey(date);
    var count = 0;
    ['doing', 'todo', 'done'].forEach(function (key) {
      (TASKS[key] || []).forEach(function (t) {
        var td = parseTaskDate(t.assigned) || parseTaskDate(t.plan) || parseTaskDate(t.finished);
        if (td && dateKey(td) === dk) count++;
      });
    });
    return count;
  }

  function densityLevel(n) {
    if (n === 0) return 0;
    if (n <= 2) return 1;
    if (n <= 5) return 2;
    return 3;
  }

  function taskboardFiltered() {
    var doing = (TASKS.doing || []).slice();
    var todo = (TASKS.todo || []).slice();
    var done = (TASKS.done || []).slice();
    /* 按 prio 排序：high → mid → low */
    var prioOrder = { high: 0, mid: 1, low: 2 };
    doing.sort(function (a, b) { return (prioOrder[a.prio] || 1) - (prioOrder[b.prio] || 1); });
    todo.sort(function (a, b) { return (prioOrder[a.prio] || 1) - (prioOrder[b.prio] || 1); });
    /* 日期筛选 */
    if (calendarState.selectedDate) {
      var selStr = dateKey(calendarState.selectedDate);
      function matchDate(t) {
        var td = parseTaskDate(t.assigned) || parseTaskDate(t.plan) || parseTaskDate(t.finished);
        return td && dateKey(td) === selStr;
      }
      doing = doing.filter(matchDate);
      todo = todo.filter(matchDate);
      done = done.filter(matchDate);
    }
    return { doing: doing, todo: todo, done: done };
  }

  /* ----------------------------- 工作日历密度条 ----------------------------- */
  var WEEK_LABELS = ['日', '一', '二', '三', '四', '五', '六'];

  function renderCalendarBar() {
    var now = new Date();
    var base = new Date(now.getFullYear(), now.getMonth() + calendarState.monthOffset, 1);
    var year = base.getFullYear();
    var month = base.getMonth();
    var monthLabel = (month + 1) + '月';

    if (calendarState.view === 'week') {
      /* 周视角：当前选中周（或本周）的 7 天 */
      var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      var weekStart = calendarState.selectedDate
        ? new Date(calendarState.selectedDate)
        : new Date(today);
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());
      var cells = '';
      for (var i = 0; i < 7; i++) {
        var d = new Date(weekStart);
        d.setDate(d.getDate() + i);
        var density = getTaskDensity(d);
        var lvl = densityLevel(density);
        var isToday = dateKey(d) === dateKey(today);
        var isSelected = calendarState.selectedDate && dateKey(d) === dateKey(calendarState.selectedDate);
        cells += '<button class="nb-cal-cell nb-cal-cell--' + lvl +
          (isToday ? ' is-today' : '') + (isSelected ? ' is-selected' : '') +
          '" data-action="cal-pick-date" data-date="' + dateKey(d) + '">' +
          '<span class="nb-cal-cell__day">' + WEEK_LABELS[i] + '</span>' +
          '<span class="nb-cal-cell__num">' + d.getDate() + '</span>' +
          '<span class="nb-cal-cell__dot">' + (density > 0 ? density : '') + '</span>' +
        '</button>';
      }
      return '<div class="nb-cal-bar">' +
        '<div class="nb-cal-nav">' +
          '<button class="nb-cal-nav__btn" data-action="cal-prev-month" aria-label="上一月">‹</button>' +
          '<button class="nb-cal-nav__label" data-action="cal-toggle-view">' + monthLabel + ' · 周</button>' +
          '<button class="nb-cal-nav__btn" data-action="cal-next-month" aria-label="下一月">›</button>' +
        '</div>' +
        '<div class="nb-cal-week">' + cells + '</div>' +
      '</div>';
    }

    /* 月视角：整月方格网格 */
    var firstDay = new Date(year, month, 1);
    var startWeekday = firstDay.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    var cellsHtml = '';
    /* 空白填充 */
    for (var i = 0; i < startWeekday; i++) {
      cellsHtml += '<span class="nb-cal-cell nb-cal-cell--empty"></span>';
    }
    for (var day = 1; day <= daysInMonth; day++) {
      var d = new Date(year, month, day);
      var density = getTaskDensity(d);
      var lvl = densityLevel(density);
      var isToday = dateKey(d) === dateKey(today);
      var isSelected = calendarState.selectedDate && dateKey(d) === dateKey(calendarState.selectedDate);
      cellsHtml += '<button class="nb-cal-cell nb-cal-cell--' + lvl +
        (isToday ? ' is-today' : '') + (isSelected ? ' is-selected' : '') +
        '" data-action="cal-pick-date" data-date="' + dateKey(d) + '">' +
        '<span class="nb-cal-cell__num">' + day + '</span>' +
        '<span class="nb-cal-cell__dot">' + (density > 0 ? density : '') + '</span>' +
      '</button>';
    }
    var headerHtml = WEEK_LABELS.map(function (w) {
      return '<span class="nb-cal-header__cell">' + w + '</span>';
    }).join('');
    return '<div class="nb-cal-bar">' +
      '<div class="nb-cal-nav">' +
        '<button class="nb-cal-nav__btn" data-action="cal-prev-month" aria-label="上一月">‹</button>' +
        '<button class="nb-cal-nav__label" data-action="cal-toggle-view">' + year + '年' + monthLabel + ' · 月</button>' +
        '<button class="nb-cal-nav__btn" data-action="cal-next-month" aria-label="下一月">›</button>' +
      '</div>' +
      '<div class="nb-cal-header">' + headerHtml + '</div>' +
      '<div class="nb-cal-month">' + cellsHtml + '</div>' +
    '</div>';
  }

  /* 归档列表渲染 */
  function renderArchived() {
    var box = $('[data-tb-scroll]');
    if (!box) return;
    var archived = TASKS.archived || [];
    var listHtml = archived.map(function (t) {
      return '<article class="nb-tb-card nb-tb-card--archived" data-id="' + t.id + '">' +
        '<div class="nb-tb-card__head">' +
          '<span class="nb-tb-card__type">' + escapeHtml(t.type) + '</span>' +
        '</div>' +
        '<h4 class="nb-tb-card__name">' + escapeHtml(t.name) + '</h4>' +
        (t.finished ? '<div class="nb-tb-card__meta">' + escapeHtml(t.finished) + '</div>' : '') +
        (t.product ? '<div class="nb-tb-card__meta">' + escapeHtml(t.product) + '</div>' : '') +
        '<div class="nb-archived-actions">' +
          '<button class="nb-archived-btn nb-archived-btn--restore" data-action="tb-restore" data-id="' + t.id + '">恢复</button>' +
          '<button class="nb-archived-btn nb-archived-btn--delete" data-action="tb-delete-archived" data-id="' + t.id + '">删除</button>' +
        '</div>' +
      '</article>';
    }).join('');
    box.innerHTML =
      '<header class="nb-tb-topbar">' +
        '<button class="nb-tb-back" data-action="tb-back" aria-label="返回">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>' +
        '</button>' +
        '<h2 class="nb-tb-topbar__title">已归档 ' + archived.length + ' 项</h2>' +
        '<span class="nb-tb-top-actions"></span>' +
      '</header>' +
      '<div class="nb-tb-groups">' +
        (listHtml || '<p class="nb-tb-empty">暂无归档任务</p>') +
      '</div>';
  }

  /* ----------------------------- 任务看板渲染 ----------------------------- */
  function renderTaskboard() {
    var box = $('[data-tb-scroll]');
    if (!box) return;
    var f = taskboardFiltered();
    var calHtml = renderCalendarBar();
    /* 日期筛选提示 */
    var dateFilterHtml = '';
    if (calendarState.selectedDate) {
      var d = calendarState.selectedDate;
      var total = f.doing.length + f.todo.length + f.done.length;
      var label = (d.getMonth() + 1) + '月' + d.getDate() + '日 · ' + total + ' 项任务';
      dateFilterHtml = '<div class="nb-cal-current">' +
        '<span class="nb-cal-current__label">' + label + '</span>' +
        '<button class="nb-cal-current__clear" data-action="cal-clear-date">清除筛选</button>' +
      '</div>';
    }
    function cardHtml(t, status) {
      var prioDot = '<span class="nb-tb-card__prio nb-tb-card__prio--' + (t.prio || 'mid') + '"></span>';
      var meta = t.step ? escapeHtml(t.step)
        : t.plan ? escapeHtml(t.plan)
        : t.product ? escapeHtml(t.product)
        : '';
      return '<article class="nb-tb-card nb-tb-card--' + status + '" data-action="tb-open-task" data-id="' + t.id + '">' +
        '<div class="nb-tb-card__head">' +
          '<span class="nb-tb-card__type">' + escapeHtml(t.type) + '</span>' +
          prioDot +
        '</div>' +
        '<h4 class="nb-tb-card__name">' + escapeHtml(t.name) + '</h4>' +
        (meta ? '<div class="nb-tb-card__meta">' + meta + '</div>' : '') +
        (t.count ? '<div class="nb-tb-card__count">' + escapeHtml(t.count) + '</div>' : '') +
      '</article>';
    }
    var doingHtml = f.doing.map(function (t) { return cardHtml(t, 'doing'); }).join('');
    var todoHtml = f.todo.map(function (t) { return cardHtml(t, 'todo'); }).join('');
    var doneHtml = f.done.map(function (t) { return cardHtml(t, 'done'); }).join('');
    var archivedCount = (TASKS.archived || []).length;
    box.innerHTML =
      '<header class="nb-tb-topbar">' +
        '<button class="nb-tb-back" data-action="tb-back" aria-label="返回">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>' +
        '</button>' +
        '<h2 class="nb-tb-topbar__title">任务</h2>' +
        '<div class="nb-tb-top-actions">' +
          '<button class="nb-tb-icon-btn" data-action="tb-open-team" aria-label="团队">👥</button>' +
          '<button class="nb-tb-icon-btn" data-action="tb-open-workflow" aria-label="工作流">🔧</button>' +
        '</div>' +
      '</header>' +
      calHtml +
      dateFilterHtml +
      '<div class="nb-tb-groups">' +
        (doingHtml ? '<section class="nb-tb-group"><h3 class="nb-tb-group__title">工作中</h3><div class="nb-tb-group__cards">' + doingHtml + '</div></section>' : '') +
        (todoHtml ? '<section class="nb-tb-group"><h3 class="nb-tb-group__title">等待中</h3><div class="nb-tb-group__cards">' + todoHtml + '</div></section>' : '') +
        (doneHtml ? '<section class="nb-tb-group"><div class="nb-tb-group__head"><h3 class="nb-tb-group__title">已完成</h3>' +
          (f.done.length > 0 ? '<button class="nb-tb-group__archive-btn" data-action="tb-archive-all">归档全部</button>' : '') +
        '</div><div class="nb-tb-group__cards">' + doneHtml + '</div></section>' : '') +
        (archivedCount > 0 ? '<button class="nb-tb-archived-entry" data-action="tb-open-archived">已归档 ' + archivedCount + ' 项 ›</button>' : '') +
      '</div>' +
      '<button class="nb-tb-fab" data-action="tb-assign" aria-label="布置任务">' +
        '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
      '</button>';
  }

  /* ----------------------------- 布置任务数据 ----------------------------- */
  var ASSIGN_STATE = {
    type: 'text',           /* 'text' 文本型 | 'operation' 操作型 */
    text: '',               /* 文本型：一句话布置 */
    opGoal: '',             /* 操作型：任务目标 */
    opTarget: '',           /* 操作型：外部服务/URL */
    opConstraint: '',       /* 操作型：约束条件 */
    workflow: 'wf-research', /* 选工作流 = 选团队（团队是工作流的一部分） */
    prio: 'high'
  };

  /* 工作流 = 预设步骤序列，每步绑特定 Agent + 工具，已含团队配置 */
  var ASSIGN_WORKFLOWS = [
    { id: 'wf-research', name: '研究型', desc: '检索 → 初稿 → 审查 → 校验', team: '研究主线', teamCount: 4, type: 'text', steps: [
      { label: '检索', agent: 'search', action: '多源检索论文' },
      { label: '初稿', agent: 'lin', action: '撰写综述初稿' },
      { label: '审查', agent: 'research', action: '专家审查初稿' },
      { label: '校验', agent: 'summary', action: '校验事实与引用' }
    ] },
    { id: 'wf-write', name: '写作型', desc: '大纲 → 起草 → 润色 → 校对', team: '写作团队', teamCount: 3, type: 'text', steps: [
      { label: '大纲', agent: 'lin', action: '生成文章大纲' },
      { label: '起草', agent: 'lin', action: '起草正文' },
      { label: '润色', agent: 'research', action: '润色语言风格' },
      { label: '校对', agent: 'summary', action: '校对错别字' }
    ] },
    { id: 'wf-search', name: '检索型', desc: '检索 → 汇总 → 归档', team: '研究主线', teamCount: 4, type: 'text', steps: [
      { label: '检索', agent: 'search', action: '多源检索' },
      { label: '汇总', agent: 'summary', action: '汇总要点' },
      { label: '归档', agent: 'lin', action: '打标签归档' }
    ] },
    { id: 'wf-web', name: '网页操作型', desc: '登录 → 导航 → 操作 → 回传', team: '操作团队', teamCount: 3, type: 'operation', steps: [
      { label: '登录', agent: 'search', action: '自动登录目标站点' },
      { label: '导航', agent: 'search', action: '导航到目标页面' },
      { label: '操作', agent: 'lin', action: '执行页面操作' },
      { label: '回传', agent: 'summary', action: '回传结果数据' }
    ] },
    { id: 'wf-api', name: 'API 调用型', desc: '鉴权 → 请求 → 解析 → 存储', team: '操作团队', teamCount: 3, type: 'operation', steps: [
      { label: '鉴权', agent: 'search', action: '获取访问令牌' },
      { label: '请求', agent: 'search', action: '发送 API 请求' },
      { label: '解析', agent: 'summary', action: '解析返回数据' },
      { label: '存储', agent: 'lin', action: '存储到本地' }
    ] }
  ];

  /* Agent 头像渐变（与 agent.js 一致） */
  var ASSIGN_AVATAR_GRADIENTS = {
    lin: 'linear-gradient(135deg,#C7A24A,#e8d091)',
    search: 'linear-gradient(135deg,#2F855A,#68b786)',
    research: 'linear-gradient(135deg,#1D5B7A,#5a9bbd)',
    summary: 'linear-gradient(135deg,#C1272D,#e07175)',
    reader: 'linear-gradient(135deg,#C7A24A,#e8d091)'
  };
  var ASSIGN_AGENT_NAMES = { lin: '林', search: '检', research: '研', summary: '总', reader: '读' };
  var expandedWfId = null;

  var ASSIGN_PRIOS = [
    { id: 'high', label: '高', desc: '插队执行' },
    { id: 'mid', label: '中', desc: '正常执行' },
    { id: 'low', label: '低', desc: '空闲执行' }
  ];

  /* ----------------------------- 布置任务渲染 ----------------------------- */
  function renderAssigntask() {
    var box = $('[data-as-scroll]');
    if (!box) return;
    var isOp = ASSIGN_STATE.type === 'operation';

    /* 类型切换 */
    var typeSwitchHtml =
      '<div class="nb-as-typeswitch">' +
        '<button class="nb-as-type' + (!isOp ? ' is-active' : '') + '" data-action="as-pick-type" data-id="text">文本型</button>' +
        '<button class="nb-as-type' + (isOp ? ' is-active' : '') + '" data-action="as-pick-type" data-id="operation">操作型</button>' +
      '</div>';

    /* 文本型：一句话布置 + 优化按钮 */
    var textFormHtml =
      '<section class="nb-as-section">' +
        '<label class="nb-as-label">一句话布置</label>' +
        '<div class="nb-as-quick">' +
          '<textarea class="nb-as-quick__input" data-as-text placeholder="例如：分析本周电池笔记，整理出 3 个研究问题" rows="3">' + escapeHtml(ASSIGN_STATE.text) + '</textarea>' +
          '<button class="nb-as-quick__optimize" data-action="as-optimize">优化</button>' +
        '</div>' +
      '</section>';

    /* 操作型：详细表单（不能一句话布置） */
    var opFormHtml =
      '<section class="nb-as-section">' +
        '<label class="nb-as-label">任务目标 <span class="nb-as-hint">详细描述要完成什么</span></label>' +
        '<textarea class="nb-as-quick__input" data-as-op-goal placeholder="例如：登录学校教务系统，下载本学期成绩单并整理为表格" rows="3">' + escapeHtml(ASSIGN_STATE.opGoal) + '</textarea>' +
      '</section>' +
      '<section class="nb-as-section">' +
        '<label class="nb-as-label">外部服务 / URL</label>' +
        '<input class="nb-as-textinput" data-as-op-target placeholder="https://example.com 或服务名称" value="' + escapeHtml(ASSIGN_STATE.opTarget) + '">' +
      '</section>' +
      '<section class="nb-as-section">' +
        '<label class="nb-as-label">约束条件 <span class="nb-as-hint">可选</span></label>' +
        '<textarea class="nb-as-quick__input" data-as-op-constraint placeholder="例如：需要验证码时暂停等我；只下载本学期的" rows="2">' + escapeHtml(ASSIGN_STATE.opConstraint) + '</textarea>' +
      '</section>';

    /* 工作流选择（按类型过滤，显示绑定团队 + 步骤详情） */
    var filteredWfs = ASSIGN_WORKFLOWS.filter(function (w) { return w.type === ASSIGN_STATE.type; });
    var wfHtml = filteredWfs.map(function (w) {
      var checked = ASSIGN_STATE.workflow === w.id;
      var expanded = expandedWfId === w.id;
      var stepsHtml = (w.steps || []).map(function (s, i) {
        var arrow = i > 0 ? '<span class="nb-as-wf__step-arrow">→</span>' : '';
        return arrow + '<div class="nb-as-wf__step">' +
          '<span class="nb-as-wf__step-av" style="background:' + (ASSIGN_AVATAR_GRADIENTS[s.agent] || ASSIGN_AVATAR_GRADIENTS.lin) + '">' + escapeHtml((ASSIGN_AGENT_NAMES[s.agent] || '?')) + '</span>' +
          '<div class="nb-as-wf__step-info">' +
            '<span class="nb-as-wf__step-label">' + escapeHtml(s.label) + '</span>' +
            '<span class="nb-as-wf__step-action">' + escapeHtml(s.action) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
      return '<div class="nb-as-wf' + (checked ? ' is-checked' : '') + (expanded ? ' is-expanded' : '') + '">' +
        '<div class="nb-as-wf__head" data-action="as-toggle-wf" data-id="' + w.id + '">' +
          '<span class="nb-as-wf__name">' + escapeHtml(w.name) + '</span>' +
          '<span class="nb-as-wf__team">' + escapeHtml(w.team) + ' · ' + w.teamCount + '人 · ' + (w.steps || []).length + '步</span>' +
          '<span class="nb-as-wf__chevron">' + (expanded ? '▾' : '▸') + '</span>' +
        '</div>' +
        '<div class="nb-as-wf__desc">' + escapeHtml(w.desc) + '</div>' +
        (expanded ? '<div class="nb-as-wf__steps">' + stepsHtml + '</div>' : '') +
        (expanded ? '<button class="nb-as-wf__confirm' + (checked ? ' is-active' : '') + '" data-action="as-confirm-workflow" data-id="' + w.id + '">' + (checked ? '✓ 已选用' : '选用此工作流') + '</button>' : '') +
      '</div>';
    }).join('');

    var prioHtml = ASSIGN_PRIOS.map(function (p) {
      var checked = ASSIGN_STATE.prio === p.id;
      return '<label class="nb-as-prio nb-as-prio--' + p.id + (checked ? ' is-checked' : '') + '">' +
        '<input type="radio" name="as-prio" data-action="as-pick-prio" data-id="' + p.id + '" ' + (checked ? 'checked' : '') + ' hidden>' +
        '<span class="nb-as-prio__label">' + escapeHtml(p.label) + '</span>' +
        '<span class="nb-as-prio__desc">' + escapeHtml(p.desc) + '</span>' +
      '</label>';
    }).join('');

    box.innerHTML =
      '<header class="nb-as-topbar">' +
        '<button class="nb-as-back" data-action="as-back" aria-label="返回">' +
          '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/></svg>' +
        '</button>' +
        '<h2 class="nb-as-topbar__title">布置任务</h2>' +
        '<span class="nb-as-spacer"></span>' +
      '</header>' +
      typeSwitchHtml +
      (isOp ? opFormHtml : textFormHtml) +
      '<section class="nb-as-section">' +
        '<label class="nb-as-label">工作流 <span class="nb-as-hint">已含团队配置</span></label>' +
        '<div class="nb-as-wfs">' + wfHtml + '</div>' +
      '</section>' +
      '<section class="nb-as-section">' +
        '<label class="nb-as-label">优先级</label>' +
        '<div class="nb-as-prios">' + prioHtml + '</div>' +
      '</section>' +
      '<div class="nb-as-spacer"></div>' +
      '<footer class="nb-as-foot">' +
        '<button class="nb-as-btn nb-as-btn--primary" data-action="as-submit">提交任务</button>' +
      '</footer>';

    /* 绑定输入框 */
    var ta = $('[data-as-text]');
    if (ta) ta.addEventListener('input', function () { ASSIGN_STATE.text = ta.value; });
    var opGoal = $('[data-as-op-goal]');
    if (opGoal) opGoal.addEventListener('input', function () { ASSIGN_STATE.opGoal = opGoal.value; });
    var opTarget = $('[data-as-op-target]');
    if (opTarget) opTarget.addEventListener('input', function () { ASSIGN_STATE.opTarget = opTarget.value; });
    var opConstraint = $('[data-as-op-constraint]');
    if (opConstraint) opConstraint.addEventListener('input', function () { ASSIGN_STATE.opConstraint = opConstraint.value; });
  }

  function asPickType(id) {
    ASSIGN_STATE.type = id;
    /* 切换类型时重置工作流为该类型下的第一个 */
    var firstWf = ASSIGN_WORKFLOWS.find(function (w) { return w.type === id; });
    if (firstWf) ASSIGN_STATE.workflow = firstWf.id;
    renderAssigntask();
  }
  function asPickWorkflow(id) { ASSIGN_STATE.workflow = id; renderAssigntask(); }
  function asPickPrio(id) { ASSIGN_STATE.prio = id; renderAssigntask(); }
  /* 优化为 Prompt：将一句话描述扩写为结构化 prompt */
  function asOptimize() {
    var text = (ASSIGN_STATE.text || '').trim();
    if (!text) { toast('请先输入任务描述'); return; }
    ASSIGN_STATE.text = '【任务】' + text + '\n【要求】\n1. 聚焦核心问题，避免发散\n2. 输出结构化结果（要点 + 依据）\n3. 标注信息来源与置信度\n4. 如有争议，列出不同观点';
    renderAssigntask();
    toast('已优化为结构化 Prompt');
  }
  function asSubmit() {
    if (ASSIGN_STATE.type === 'text') {
      if (!ASSIGN_STATE.text) { toast('请先输入任务'); return; }
    } else {
      if (!ASSIGN_STATE.opGoal) { toast('请先描述任务目标'); return; }
    }
    popView();
    setTimeout(function () { toast('已布置任务，串行执行中'); }, 320);
  }

  /* ----------------------------- 工作区事件分发 ----------------------------- */
  function handleWorkspaceAction(action, actEl) {
    switch (action) {
      case 'duty-open-task': pushView('taskboard'); break;
      /* 首屏四选项：开始对话 / 自制小程序 / 查看任务 / 找点新东西 */
      case 'duty-start-chat': pushView('chat', { new: true }); break;
      case 'duty-miniapp': pushView('miniapp-chat', { new: true }); break;
      case 'duty-discover': pushView('market'); break;
      case 'dsc-back': popView(); break;
      case 'dsc-pick-wf': toast('引入工作流（demo）'); break;
      case 'dsc-pick-agent': toast('引入 AI 配置（demo）'); break;
      case 'duty-report-view': toast('查看汇报（demo）'); break;
      case 'duty-more-reports': pushView('taskboard'); break;
      case 'duty-menu': if (window.ZX_DRAWER && window.ZX_DRAWER.open) window.ZX_DRAWER.open(); break;
      case 'duty-bell': toast('暂无新通知'); break;
      case 'duty-quick-assign': pushView('assigntask'); break;
      case 'duty-quick-team': pushView('agent'); break;
      case 'duty-quick-workflow': pushView('workflow'); break;
      case 'editor-switch': switchEditorMode(actEl.getAttribute('data-mode')); break;
      case 'editor-open-note': openNoteFromEditor(actEl.getAttribute('data-id')); break;
      case 'editor-open-file': openFileFromEditor(actEl.getAttribute('data-id'), actEl.getAttribute('data-type')); break;
      case 'editor-close-file': closeFileView(); break;
      /* TemplateRenderer 的"用此模板新建笔记"按钮：从 template 文件创建笔记 */
      case 'file-use-template': useTemplateFromFile(actEl.getAttribute('data-id')); break;
      case 'editor-add': openAddFilePicker(); break;
      case 'editor-menu': if (window.ZX_DRAWER && window.ZX_DRAWER.open) window.ZX_DRAWER.open(); break;
      case 'editor-config': pushView('config'); break;
      /* 工作区皆文件：树节点折叠 / CRUD / 移动 */
      case 'editor-toggle-portfolio': togglePortfolio(actEl.getAttribute('data-id')); break;
      case 'editor-toggle-notebook': toggleNotebook(actEl.getAttribute('data-id')); break;
      case 'editor-new-portfolio': newPortfolio(); break;
      case 'editor-rename-portfolio': startRename('portfolio', actEl.getAttribute('data-id')); break;
      case 'editor-delete-portfolio': confirmDelete('portfolio', actEl.getAttribute('data-id')); break;
      case 'editor-new-notebook': newNotebook(actEl.getAttribute('data-id')); break;
      case 'editor-rename-notebook': startRename('notebook', actEl.getAttribute('data-id')); break;
      case 'editor-delete-notebook': confirmDelete('notebook', actEl.getAttribute('data-id')); break;
      case 'editor-move-note': openMoveNotePicker(actEl.getAttribute('data-id')); break;
      case 'move-note-to': moveNoteTo(actEl.getAttribute('data-id'), actEl.getAttribute('data-nb')); break;
      case 'move-note-cancel': closeMoveNotePicker(); break;
      case 'cfg-back': popView(); break;
      case 'cfg-add-view': pushView('view-designer'); break;
      case 'vd-back': popView(); break;
      case 'vd-save': saveCustomView(); break;
      case 'vd-pick-layout': pickViewLayout(actEl.getAttribute('data-layout')); break;
      case 'vd-toggle-field': {
        var fk = actEl.getAttribute('data-field');
        if (fk) { vdState.fields[fk] = !vdState.fields[fk]; renderViewDesigner(); }
        break;
      }
      case 'vd-pick-sort': vdState.sort = actEl.getAttribute('data-sort'); renderViewDesigner(); break;
      case 'cfg-set-view': {
        var cfgMode = actEl.getAttribute('data-mode');
        switchEditorMode(cfgMode);
        /* 更新选中态 */
        $all('.nb-cfg-view__opt').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-mode') === cfgMode);
          var chk = b.querySelector('.nb-cfg-view__check');
          if (chk) chk.textContent = (b.getAttribute('data-mode') === cfgMode) ? '✓' : '';
        });
        toast('已切换到' + (cfgMode === 'tree' ? '文件树' : cfgMode === 'shelf' ? '书架视图' : '思维导图'));
        break;
      }
      case 'add-note-to': addNoteToNotebook(actEl.getAttribute('data-nb')); break;
      case 'add-note-with-tpl': addNoteWithTemplate(actEl.getAttribute('data-nb'), actEl.getAttribute('data-tpl')); break;
      case 'add-note-from-tpl': addNoteFromTemplate(actEl.getAttribute('data-nb'), actEl.getAttribute('data-tpl-id')); break;
      case 'pick-file-type': pickFileType(actEl.getAttribute('data-nb'), actEl.getAttribute('data-type')); break;
      case 'add-note-cancel': closeAddNotePicker(); break;
      case 'tb-back': popView(); break;
      case 'tb-open-team': pushView('agent'); break;
      case 'tb-open-workflow': pushView('workflow'); break;
      case 'tb-filter':
        currentFilter = actEl.getAttribute('data-filter');
        renderTaskboard();
        break;
      case 'cal-pick-date': {
        var dateStr = actEl.getAttribute('data-date');
        var parts = dateStr.split('-');
        var picked = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
        calendarState.selectedDate = (calendarState.selectedDate && dateKey(calendarState.selectedDate) === dateKey(picked)) ? null : picked;
        renderTaskboard();
        break;
      }
      case 'cal-clear-date':
        calendarState.selectedDate = null;
        renderTaskboard();
        break;
      case 'cal-toggle-view':
        calendarState.view = (calendarState.view === 'week') ? 'month' : 'week';
        renderTaskboard();
        break;
      case 'cal-prev-month':
        calendarState.monthOffset--;
        renderTaskboard();
        break;
      case 'cal-next-month':
        calendarState.monthOffset++;
        renderTaskboard();
        break;
      case 'tb-archive-all':
        TASKS.archived = (TASKS.archived || []).concat(TASKS.done.splice(0));
        renderTaskboard();
        toast('已归档全部完成项');
        break;
      case 'tb-archive-one': {
        var aid = actEl.getAttribute('data-id');
        for (var ai = 0; ai < TASKS.done.length; ai++) {
          if (TASKS.done[ai].id === aid) {
            TASKS.archived = TASKS.archived || [];
            TASKS.archived.unshift(TASKS.done.splice(ai, 1)[0]);
            break;
          }
        }
        renderTaskboard();
        break;
      }
      case 'tb-open-archived':
        pushView('archived');
        renderArchived();
        break;
      case 'tb-restore': {
        var rid = actEl.getAttribute('data-id');
        for (var ri = 0; ri < (TASKS.archived || []).length; ri++) {
          if (TASKS.archived[ri].id === rid) {
            TASKS.done.unshift(TASKS.archived.splice(ri, 1)[0]);
            break;
          }
        }
        renderArchived();
        break;
      }
      case 'tb-delete-archived': {
        var did = actEl.getAttribute('data-id');
        for (var di = 0; di < (TASKS.archived || []).length; di++) {
          if (TASKS.archived[di].id === did) { TASKS.archived.splice(di, 1); break; }
        }
        renderArchived();
        break;
      }
      case 'tb-open-task': openTaskDetail(actEl.getAttribute('data-id')); break;
      case 'tb-assign': pushView('assigntask'); break;
      case 'as-back': popView(); break;
      case 'as-pick-type': asPickType(actEl.getAttribute('data-id')); break;
      case 'as-pick-workflow': asPickWorkflow(actEl.getAttribute('data-id')); break;
      case 'as-toggle-wf':
        expandedWfId = (expandedWfId === actEl.getAttribute('data-id')) ? null : actEl.getAttribute('data-id');
        renderAssigntask();
        break;
      case 'as-confirm-workflow':
        ASSIGN_STATE.workflow = actEl.getAttribute('data-id');
        renderAssigntask();
        toast('已选用工作流');
        break;
      case 'as-pick-prio': asPickPrio(actEl.getAttribute('data-id')); break;
      case 'as-optimize': asOptimize(); break;
      case 'as-submit': asSubmit(); break;
      case 'menu': if (window.ZX_DRAWER && window.ZX_DRAWER.open) window.ZX_DRAWER.open(); break;
      /* ===== 市场事件 ===== */
      case 'market-back': popView(); break;
      case 'market-cat':
        marketState.cat = actEl.getAttribute('data-cat') || 'all';
        renderMarket();
        break;
      case 'toggle-market-search':
        openMarketSearch();
        break;
      case 'close-market-search':
        closeMarketSearch();
        break;
      case 'market-pick': {
        var mkId = actEl.getAttribute('data-id');
        var mkItem = marketItemById(mkId);
        if (mkItem) {
          marketState.detailId = mkId;
          pushView('market-detail');
          renderMarketDetail();
        }
        break;
      }
      case 'market-detail-back':
        popView();
        break;
      case 'share':
        toast('分享链接已复制到剪贴板');
        break;
      case 'market-introduce': {
        var introId = actEl.getAttribute('data-id');
        var introItem = marketItemById(introId);
        if (introItem) {
          marketState.introduced[introId] = !marketState.introduced[introId];
          toast(marketState.introduced[introId]
            ? '已引入「' + introItem.name + '」到工作区'
            : '已移除「' + introItem.name + '」');
          renderMarketDetail();
        }
        break;
      }
      case 'toggle-releases': {
        var relId = actEl.getAttribute('data-id');
        if (relId) {
          marketState.releasesExpanded[relId] = !marketState.releasesExpanded[relId];
          renderMarketDetail();
        }
        break;
      }
      default: return false;
    }
    return true;
  }

  function openNoteFromEditor(id) {
    var n = noteById(id);
    if (!n) { toast('笔记不存在'); return; }
    if (window.ZX_EDITOR && window.ZX_EDITOR.open) {
      window.ZX_EDITOR.open({ noteId: id });
    } else {
      toast('打开笔记：' + (n.title || n.name || ''));
    }
  }

  /* Task 3.2：打开非 note 类型文件 → 调用 ZX_FILE.renderFile 渲染到全屏视图 */
  function ensureFileViewRoot() {
    var root = document.getElementById('nb-fileview-root');
    if (root) return root;
    root = el('div');
    root.id = 'nb-fileview-root';
    root.className = 'nb-fileview-root';
    root.hidden = true;
    /* 挂到 nb-root 下（与编辑器同层），复用其 click 事件委托 */
    var nbRoot = $('[data-nb-root]');
    if (nbRoot) nbRoot.appendChild(root);
    else {
      var nbSection = document.querySelector('[data-page="notebook"]');
      if (nbSection) nbSection.appendChild(root);
    }
    return root;
  }

  function openFileFromEditor(id, type) {
    var b = bridge();
    var file = b && b.getFileById ? b.getFileById(id) : null;
    if (!file) { toast('文件不存在'); return; }
    if (!window.ZX_FILE || !window.ZX_FILE.renderFile) {
      toast('文件渲染器未就绪');
      return;
    }
    /* 关闭可能开着的编辑器/总览，避免层叠 */
    if (window.ZX_EDITOR && window.ZX_EDITOR.isOpen && window.ZX_EDITOR.isOpen()) {
      try { window.ZX_EDITOR.close(); } catch (e) {}
    }
    if (window.ZX_OVERVIEW && window.ZX_OVERVIEW.isOpen && window.ZX_OVERVIEW.isOpen()) {
      try { window.ZX_OVERVIEW.close(); } catch (e) {}
    }
    var root = ensureFileViewRoot();
    var fileHtml = window.ZX_FILE.renderFile(file);
    var typeLabel = FILE_TYPE_LABELS[file.type || type || 'note'] || '文件';
    root.innerHTML =
      '<header class="nb-fileview-topbar">' +
        '<button class="nb-fileview-back" data-action="editor-close-file" aria-label="返回">' + IC.back() + '</button>' +
        '<h2 class="nb-fileview-title">' + (FILE_TYPE_ICONS[file.type || type] || '') + ' ' + escapeHtml(file.name || '未命名文件') + '</h2>' +
        '<span class="nb-fileview-type">' + escapeHtml(typeLabel) + '</span>' +
      '</header>' +
      '<div class="nb-fileview-body">' + fileHtml + '</div>';
    root.hidden = false;
  }

  function closeFileView() {
    var root = document.getElementById('nb-fileview-root');
    if (root) { root.hidden = true; root.innerHTML = ''; }
  }

  /* TemplateRenderer "用此模板新建笔记"：从 template 文件深拷贝 spec 创建笔记 */
  function useTemplateFromFile(templateFileId) {
    var b = bridge();
    var tf = b && b.getFileById ? b.getFileById(templateFileId) : null;
    if (!tf) { toast('模板文件不存在'); return; }
    var nbId = tf.notebookId || 'nb-default';
    closeFileView();
    addNoteFromTemplate(nbId, templateFileId);
  }

  /* 新建文件：点击 + 后弹出笔记本选择底部抽屉（Task 3.3：openAddNotePicker → openAddFilePicker） */
  function openAddFilePicker() {
    closeAddNotePicker();
    var nbs = flattenNotebooks();
    var opts = nbs.map(function (nb) {
      return '<button class="nb-add-pick__opt" data-action="add-note-to" data-nb="' + nb.id + '">' +
        '<span class="nb-add-pick__icon">📒</span>' +
        '<span class="nb-add-pick__label">' + escapeHtml(nb.label) + '</span>' +
        '<span class="nb-add-pick__count">' + escapeHtml(nb.portfolioLabel) + '</span>' +
      '</button>';
    }).join('');
    if (!opts) opts = '<div class="nb-editor-empty">请先创建一个笔记本</div>';
    var scrim = document.createElement('div');
    scrim.className = 'nb-add-pick-scrim';
    scrim.setAttribute('data-add-pick-scrim', '');
    scrim.onclick = closeAddNotePicker;
    var sheet = document.createElement('div');
    sheet.className = 'nb-add-pick';
    sheet.innerHTML =
      '<div class="nb-add-pick__handle"></div>' +
      '<h3 class="nb-add-pick__title">选择笔记本</h3>' +
      '<div class="nb-add-pick__list">' + opts + '</div>' +
      '<button class="nb-add-pick__cancel" data-action="add-note-cancel">取消</button>';
    var phone = $('[data-nb-root]') || $('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(sheet);
  }
  /* 保留旧名为别名（向后兼容） */
  var openAddNotePicker = openAddFilePicker;

  function closeAddNotePicker() {
    var s = $('[data-add-pick-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = $('.nb-add-pick');
    if (p) p.parentNode.removeChild(p);
    var tp = $('.nb-tpl-pick');
    if (tp) tp.parentNode.removeChild(tp);
  }

  /* 内置模板（5 个） */
  var TEMPLATES = [
    { key: 'doc',      icon: '📝', label: '纯文档',  desc: '线性文字流，适合写作' },
    { key: 'dual',     icon: '📖', label: '双联阅读', desc: '左文右附件，适合读书笔记' },
    { key: 'canvas',   icon: '🎨', label: '无限画布', desc: '自由布局，适合思维发散' },
    { key: 'outline',  icon: '🌳', label: '大纲树',   desc: '嵌套结构，适合论证梳理' },
    { key: 'blank',    icon: '⬜', label: '空白页',   desc: '从零开始 DIY' }
  ];

  /* Task 3.3：文件类型选择（第二步）—— 选完笔记本后选文件类型 */
  var FILE_TYPE_OPTIONS = [
    { type: 'note',     icon: '📝', label: '笔记',   desc: '富文本块树，适合写作与思考' },
    { type: 'template', icon: '🎨', label: '模板',   desc: '可复用的块树结构，供新建笔记时套用' },
    { type: 'workflow', icon: '⚙️', label: '工作流', desc: '步骤化数据处理流' },
    { type: 'code',     icon: '📦', label: '代码',   desc: '代码片段或脚本' }
  ];

  function openFileTypePicker(nbId) {
    closeAddNotePicker();
    var nb = findNotebookMeta(nbId);
    var nbLabel = nb ? nb.label : '笔记本';
    var opts = FILE_TYPE_OPTIONS.map(function (t) {
      return '<button class="nb-tpl-pick__opt" data-action="pick-file-type" data-nb="' + nbId + '" data-type="' + t.type + '">' +
        '<span class="nb-tpl-pick__icon">' + t.icon + '</span>' +
        '<span class="nb-tpl-pick__body">' +
          '<span class="nb-tpl-pick__label">' + escapeHtml(t.label) + '</span>' +
          '<span class="nb-tpl-pick__desc">' + escapeHtml(t.desc) + '</span>' +
        '</span>' +
      '</button>';
    }).join('');
    var scrim = document.createElement('div');
    scrim.className = 'nb-add-pick-scrim';
    scrim.setAttribute('data-add-pick-scrim', '');
    scrim.onclick = closeAddNotePicker;
    var sheet = document.createElement('div');
    sheet.className = 'nb-add-pick nb-tpl-pick';
    sheet.innerHTML =
      '<div class="nb-add-pick__handle"></div>' +
      '<h3 class="nb-add-pick__title">选择文件类型 · 「' + escapeHtml(nbLabel) + '」</h3>' +
      '<div class="nb-add-pick__list">' + opts + '</div>' +
      '<button class="nb-add-pick__cancel" data-action="add-note-cancel">取消</button>';
    var phone = $('[data-nb-root]') || $('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(sheet);
  }

  /* 选完文件类型后：note → 进模板选择器；其它类型 → 直接创建 */
  function pickFileType(nbId, type) {
    if (type === 'note') {
      openTemplatePicker(nbId);
    } else {
      addFileWithType(nbId, type);
    }
  }

  /* 直接创建非 note 类型文件（template/workflow/code） */
  function addFileWithType(nbId, type) {
    closeAddNotePicker();
    var nb = findNotebookMeta(nbId);
    var label = nb ? nb.label : '笔记本';
    var typeLabel = FILE_TYPE_LABELS[type] || '文件';
    var newId = 'f-' + Date.now();
    var name = '未命名' + typeLabel;
    var content = {};
    if (type === 'template') {
      content = { spec: { type: 'section', children: [{ type: 'text', text: '' }] }, icon: '🎨', desc: '自定义模板' };
    } else if (type === 'workflow') {
      content = { steps: [{ name: '第一步', input: '输入', output: '输出' }] };
    } else if (type === 'code') {
      content = { language: 'javascript', code: '// 在这里写代码\n' };
    } else if (type === 'plugin') {
      content = { language: 'javascript', code: '// 插件代码\n', manifest: { name: name, version: '1.0.0', desc: '自定义插件' } };
    }
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.upsertFile) {
      window.ZX_BRIDGE.upsertFile({ id: newId, name: name, type: type, notebookId: nbId, content: content });
    }
    toast('已创建' + typeLabel + '于「' + label + '」');
    renderEditor();
  }

  /* Task 3.4：模板选择器增强 —— 内置 5 模板 + 同 Notebook 下的 template 文件 */
  function openTemplatePicker(nbId) {
    closeAddNotePicker();
    var nb = findNotebookMeta(nbId);
    var nbLabel = nb ? nb.label : '笔记本';
    var builtinOpts = TEMPLATES.map(function (t) {
      return '<button class="nb-tpl-pick__opt" data-action="add-note-with-tpl" data-nb="' + nbId + '" data-tpl="' + t.key + '">' +
        '<span class="nb-tpl-pick__icon">' + t.icon + '</span>' +
        '<span class="nb-tpl-pick__body">' +
          '<span class="nb-tpl-pick__label">' + escapeHtml(t.label) + '</span>' +
          '<span class="nb-tpl-pick__desc">' + escapeHtml(t.desc) + '</span>' +
        '</span>' +
      '</button>';
    }).join('');

    /* 追加同 Notebook 下的 template 文件 */
    var b = bridge();
    var tplFiles = (b && b.getTemplateFiles) ? b.getTemplateFiles(nbId) : [];
    var tplFileOpts = tplFiles.map(function (tf) {
      var content = tf.content || {};
      var icon = content.icon || '🎨';
      var desc = content.desc || '自定义模板';
      return '<button class="nb-tpl-pick__opt nb-tpl-pick__opt--file" data-action="add-note-from-tpl" data-nb="' + nbId + '" data-tpl-id="' + tf.id + '">' +
        '<span class="nb-tpl-pick__icon">' + icon + '</span>' +
        '<span class="nb-tpl-pick__body">' +
          '<span class="nb-tpl-pick__label">' + escapeHtml(tf.name || '未命名模板') + '</span>' +
          '<span class="nb-tpl-pick__desc">' + escapeHtml(desc) + '</span>' +
        '</span>' +
      '</button>';
    }).join('');

    var listHtml;
    if (tplFileOpts) {
      listHtml = '<div class="nb-tpl-pick__section">内置模板</div>' + builtinOpts +
        '<div class="nb-tpl-pick__section">笔记本模板文件</div>' + tplFileOpts;
    } else {
      listHtml = builtinOpts;
    }

    var scrim = document.createElement('div');
    scrim.className = 'nb-add-pick-scrim';
    scrim.setAttribute('data-add-pick-scrim', '');
    scrim.onclick = closeAddNotePicker;
    var sheet = document.createElement('div');
    sheet.className = 'nb-add-pick nb-tpl-pick';
    sheet.innerHTML =
      '<div class="nb-add-pick__handle"></div>' +
      '<h3 class="nb-add-pick__title">选择模板 · 「' + escapeHtml(nbLabel) + '」</h3>' +
      '<div class="nb-add-pick__list">' + listHtml + '</div>' +
      '<button class="nb-add-pick__cancel" data-action="add-note-cancel">取消</button>';
    var phone = $('[data-nb-root]') || $('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(sheet);
  }

  /* 第一步选完笔记本 → 进入第二步选文件类型（Task 3.3） */
  function addNoteToNotebook(nbId) {
    openFileTypePicker(nbId);
  }

  /* 内置模板创建笔记（原有逻辑） */
  function addNoteWithTemplate(nbId, tplKey) {
    closeAddNotePicker();
    var nb = findNotebookMeta(nbId);
    var label = nb ? nb.label : '笔记本';
    var newId = 'n-' + Date.now();
    var realTpl = tplKey === 'blank' ? 'doc' : tplKey; /* blank 用 doc 空壳 */
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.upsertNote) {
      window.ZX_BRIDGE.upsertNote({ id: newId, title: '未命名笔记', notebookId: nbId, template: realTpl });
    }
    if (window.ZX_EDITOR && window.ZX_EDITOR.open) {
      window.ZX_EDITOR.open(realTpl, { noteId: newId });
      toast('已创建' + (tplKey === 'blank' ? '空白' : TEMPLATES.filter(function(t){return t.key===tplKey})[0].label) + '笔记于「' + label + '」');
    } else {
      toast('已创建笔记于「' + label + '」');
      renderEditor();
    }
  }

  /* Task 3.4：从 template 文件创建笔记（深拷贝 template.content.spec 为新笔记 spec） */
  function addNoteFromTemplate(nbId, templateFileId) {
    closeAddNotePicker();
    var nb = findNotebookMeta(nbId);
    var label = nb ? nb.label : '笔记本';
    var b = bridge();
    var tf = b && b.getFileById ? b.getFileById(templateFileId) : null;
    if (!tf) { toast('模板文件不存在'); return; }
    var spec = (tf.content && tf.content.spec) ? JSON.parse(JSON.stringify(tf.content.spec)) : null;
    var newId = 'n-' + Date.now();
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.upsertNote) {
      window.ZX_BRIDGE.upsertNote({ id: newId, title: '未命名笔记', notebookId: nbId, template: 'doc', spec: spec });
    }
    if (window.ZX_EDITOR && window.ZX_EDITOR.open) {
      window.ZX_EDITOR.open('doc', { noteId: newId });
      toast('已从模板「' + (tf.name || '') + '」创建笔记于「' + label + '」');
    } else {
      toast('已创建笔记于「' + label + '」');
      renderEditor();
    }
  }

  /* ----------------------------- 工作区皆文件：树节点 CRUD ----------------------------- */
  function refreshEditor() {
    renderEditor();
  }

  function togglePortfolio(id) {
    treeExpand.portfolios[id] = !treeExpand.portfolios[id];
    refreshEditor();
  }
  function toggleNotebook(id) {
    treeExpand.notebooks[id] = !treeExpand.notebooks[id];
    refreshEditor();
  }

  function newPortfolio() {
    var b = bridge();
    if (!b || !b.upsertPortfolio) { toast('暂不支持新建作品集'); return; }
    var entry = b.upsertPortfolio({ name: '新作品集' });
    treeExpand.portfolios[entry.id] = true;
    toast('已新建作品集「' + entry.name + '」');
    refreshEditor();
    startRename('portfolio', entry.id);
  }

  function newNotebook(portfolioId) {
    var b = bridge();
    if (!b || !b.upsertNotebook) { toast('暂不支持新建笔记本'); return; }
    var entry = b.upsertNotebook({ name: '新笔记本', portfolioId: portfolioId });
    treeExpand.portfolios[portfolioId] = true;
    treeExpand.notebooks[entry.id] = true;
    toast('已新建笔记本「' + entry.name + '」');
    refreshEditor();
    startRename('notebook', entry.id);
  }

  /* 重命名：把 label span 换成 input，失焦/回车提交 */
  function startRename(kind, id) {
    var box = $('[data-editor-scroll]');
    if (!box) return;
    var label = box.querySelector('[data-rename-label="' + kind + '"][data-id="' + id + '"]');
    if (!label) return;
    var oldText = label.textContent;
    var input = document.createElement('input');
    input.type = 'text';
    input.className = 'nb-editor-tree__rename';
    input.value = oldText;
    label.parentNode.replaceChild(input, label);
    input.focus();
    input.select();
    var done = false;
    function commit() {
      if (done) return;
      done = true;
      var val = (input.value || '').trim() || oldText;
      var b = bridge();
      if (kind === 'portfolio' && b && b.upsertPortfolio) b.upsertPortfolio({ id: id, name: val });
      else if (kind === 'notebook' && b && b.upsertNotebook) b.upsertNotebook({ id: id, name: val });
      toast('已重命名');
      refreshEditor();
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); input.blur(); }
      else if (e.key === 'Escape' || e.keyCode === 27) { done = true; refreshEditor(); }
    });
  }

  /* 删除确认：两段式 toast（首次提示，3s 内再点确认） */
  var pendingDelete = null;
  function confirmDelete(kind, id) {
    var meta = kind === 'portfolio' ? findPortfolioMeta(id) : findNotebookMeta(id);
    var label = meta ? meta.label : '';
    if (pendingDelete && pendingDelete.kind === kind && pendingDelete.id === id) {
      clearTimeout(pendingDelete.timer);
      pendingDelete = null;
      doDelete(kind, id, label);
      return;
    }
    toast('再次点击删除以确认' + (label ? '「' + label + '」' : ''));
    pendingDelete = { kind: kind, id: id };
    pendingDelete.timer = setTimeout(function () { pendingDelete = null; }, 3000);
  }

  function doDelete(kind, id, label) {
    var b = bridge();
    if (kind === 'portfolio') {
      if (!b || !b.deletePortfolio || !b.deletePortfolio(id)) { toast('至少保留一个作品集'); return; }
      toast('已删除作品集' + (label ? '「' + label + '」' : ''));
    } else {
      if (b && b.deleteNotebook) b.deleteNotebook(id);
      toast('已删除笔记本' + (label ? '「' + label + '」' : ''));
    }
    refreshEditor();
  }

  /* 移动笔记：弹出笔记本选择器，调 upsertNote 改 notebookId */
  function openMoveNotePicker(noteId) {
    closeMoveNotePicker();
    var n = noteById(noteId) || (bridge() && bridge().getNoteById ? bridge().getNoteById(noteId) : null);
    var curNb = n ? (n.notebookId || 'nb-default') : '';
    var nbs = flattenNotebooks();
    var opts = nbs.map(function (nb) {
      var isCur = nb.id === curNb;
      return '<button class="nb-add-pick__opt' + (isCur ? ' is-current' : '') + '" data-action="move-note-to" data-id="' + noteId + '" data-nb="' + nb.id + '"' + (isCur ? ' disabled' : '') + '>' +
        '<span class="nb-add-pick__icon">📒</span>' +
        '<span class="nb-add-pick__label">' + escapeHtml(nb.label) + '</span>' +
        '<span class="nb-add-pick__count">' + (isCur ? '当前' : escapeHtml(nb.portfolioLabel)) + '</span>' +
      '</button>';
    }).join('');
    var scrim = document.createElement('div');
    scrim.className = 'nb-add-pick-scrim';
    scrim.setAttribute('data-move-pick-scrim', '');
    scrim.onclick = closeMoveNotePicker;
    var sheet = document.createElement('div');
    sheet.className = 'nb-add-pick';
    sheet.innerHTML =
      '<div class="nb-add-pick__handle"></div>' +
      '<h3 class="nb-add-pick__title">移动到笔记本</h3>' +
      '<div class="nb-add-pick__list">' + opts + '</div>' +
      '<button class="nb-add-pick__cancel" data-action="move-note-cancel">取消</button>';
    var phone = $('[data-nb-root]') || $('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(sheet);
  }
  function closeMoveNotePicker() {
    var s = $('[data-move-pick-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = $('.nb-add-pick');
    if (p) p.parentNode.removeChild(p);
  }
  function moveNoteTo(noteId, nbId) {
    closeMoveNotePicker();
    var b = bridge();
    if (b && b.upsertNote) b.upsertNote({ id: noteId, notebookId: nbId });
    else if (window.ZX_MOCK && window.ZX_MOCK.notes) {
      for (var i = 0; i < window.ZX_MOCK.notes.length; i++) { if (window.ZX_MOCK.notes[i].id === noteId) window.ZX_MOCK.notes[i].notebookId = nbId; }
    }
    var nb = findNotebookMeta(nbId);
    toast('已移动到「' + (nb ? nb.label : '笔记本') + '」');
    refreshEditor();
  }

  /* 元数据查找（用于回显名称） */
  function findPortfolioMeta(id) {
    var list = bridge() && bridge().getPortfolios ? bridge().getPortfolios() : [];
    for (var i = 0; i < list.length; i++) { if (list[i].id === id) return { id: id, label: list[i].name }; }
    return null;
  }
  function findNotebookMeta(id) {
    var b = bridge();
    if (!b) return null;
    var ps = b.getPortfolios ? b.getPortfolios() : [];
    for (var i = 0; i < ps.length; i++) {
      var nbs = b.getNotebooks ? b.getNotebooks(ps[i].id) : [];
      for (var j = 0; j < nbs.length; j++) { if (nbs[j].id === id) return { id: id, label: nbs[j].name }; }
    }
    return null;
  }

  function openTaskDetail(id) {
    var found = taskById(id);
    if (!found) { toast('任务不存在'); return; }
    if (typeof renderDetail === 'function') renderDetail(id);
    pushView('detail', { taskId: id });
  }

  /* ========================================================================
   * 工作区重设计 结束
   * ====================================================================== */

  function renderWidgets() {
    var box = $('[data-widgets]');
    if (!box) return;
    var order = ['todo', 'chat', 'ai-suggestion', 'hotspot', 'recall', 'free'];
    var buckets = {};
    order.forEach(function (t) { buckets[t] = []; });
    state.widgets.forEach(function (w) { if (w.hidden) return; if (buckets[w.type]) buckets[w.type].push(w); });

    var html = '';
    buckets['todo'].forEach(function (w) { html += renderWidgetCard(w); });
    buckets['chat'].forEach(function (w) { html += renderWidgetCard(w); });
    html += renderAiSuggestionCarousel(buckets['ai-suggestion']);
    ['hotspot', 'recall', 'free'].forEach(function (t) {
      buckets[t].forEach(function (w) { html += renderWidgetCard(w); });
    });
    html += '<button class="nb-add-widget" data-action="open-add-widget">' + IC.plus() + ' 添加小组件</button>';
    box.innerHTML = html;
    bindCarouselScroll();
  }

  function findWidget(id) {
    for (var i = 0; i < state.widgets.length; i++) { if (state.widgets[i].id === id) return { w: state.widgets[i], i: i }; }
    return null;
  }

  function closeAllWidgetMenus() { $all('[data-wmenu].is-open').forEach(function (m) { m.classList.remove('is-open'); }); }

  /* ----------------------------- 添加小组件 Sheet ----------------------------- */

  var ADD_WIDGET_OPTIONS = [
    { type: 'ai-suggestion', name: 'AI 建议', desc: '林基于你的主线主动提一个行动', icon: function () { return IC.spark(); } },
    { type: 'todo', name: '待办清单', desc: '可勾选、可追加的今日待办', icon: function () { return IC.square(); } },
    { type: 'hotspot', name: '今日热点', desc: '聚合你关注领域的新动态', icon: function () { return IC.flame(); } },
    { type: 'recall', name: '笔记回顾', desc: '上周 / 上月今天写过的笔记', icon: function () { return IC.clock(); } },
    { type: 'free', name: '自由卡片', desc: '随便记一句话、一个灵感', icon: function () { return IC.pencil(); } }
  ];

  function renderAddWidgetList() {
    var box = $('[data-add-widget-list]');
    if (!box) return;
    box.innerHTML = ADD_WIDGET_OPTIONS.map(function (o) {
      return '<button class="nb-widget-pick nb-widget-pick--' + o.type + '" data-action="pick-widget" data-type="' + o.type + '">' +
        '<span class="nb-widget-pick__ico">' + o.icon() + '</span>' +
        '<span><span class="nb-widget-pick__name">' + escapeHtml(o.name) + '</span>' +
        '<span class="nb-widget-pick__desc">' + escapeHtml(o.desc) + '</span></span>' +
        '</button>';
    }).join('');
  }

  function newWidgetDefault(type) {
    var id = 'w' + Date.now();
    if (type === 'ai-suggestion') return { id: id, type: type, title: '新的 AI 建议', desc: '林正在为你构思一个行动建议，稍后会出现在这里。', assignType: 'analyze' };
    if (type === 'todo') return { id: id, type: type, title: '新待办清单', items: [{ text: '新建待办事项', done: false }] };
    if (type === 'hotspot') return { id: id, type: type, title: '今日热点', items: [{ title: '加载中的热点…', source: '林正在聚合', reads: '—' }] };
    if (type === 'recall') return { id: id, type: type, title: '笔记回顾', items: [{ label: '一周前的今天', noteId: 'n-solid-battery-impedance' }] };
    if (type === 'free') return { id: id, type: type, title: '自由卡片', text: '在这里写下你的想法…', tags: [] };
    return { id: id, type: type, title: '新组件' };
  }

  /* ----------------------------- Agent Kanban ----------------------------- */

  var TASKS = {
    doing: [
      { id: 't1', type: '分析', prio: 'high', name: '分析界面阻抗相关讨论', count: '关联 12 篇', progress: 60, step: '正在聚类「界面修饰」子主题…', eta: '约 2 分钟' },
      { id: 't2', type: '陪读', prio: 'mid', name: '陪读《固态电解质》第 3 章', count: '共 24 页', progress: 35, step: '正在抽取界面涂层关键论点…', eta: '约 5 分钟' }
    ],
    todo: [
      { id: 't3', type: '整理', prio: 'mid', name: '整理本周电池笔记', count: '关联 5 篇', assigned: '今天 09:00 指派', plan: '计划 14:00 开始' },
      { id: 't4', type: '总结', prio: 'low', name: '总结上月学习', count: '关联 8 篇', assigned: '昨天 22:10 指派', plan: '等你空闲时开始' }
    ],
    done: [
      { id: 't5', type: '整理', prio: 'mid', name: '整理昨天的笔记', count: '关联 5 篇', finished: '昨天 18:42 完成', product: '产物：5 篇按主题归类到「固态电池」主线' },
      { id: 't6', type: '总结', prio: 'low', name: '自动总结上周热点', count: '关联 4 篇', finished: '上周日 20:10 完成', product: '产物：1 篇周报《本周固态电池要点 7 条》' }
    ],
    archived: []
  };
  /* Task 2.4：把 TASKS 作为单一数据源镜像到 bridge（bridge.getTasks 懒加载时取此引用） */
  window.ZX = window.ZX || {};
  window.ZX.exportTasks = function () { return TASKS; };

  var TASK_TYPE_ICON = {
    '整理': function () { return IC.folder(); },
    '总结': function () { return IC.list(); },
    '分析': function () { return IC.spark(); },
    '陪读': function () { return IC.pdf(); },
    '定时': function () { return IC.clock(); }
  };

  function taskById(id) {
    var keys = ['doing', 'todo', 'done'];
    for (var i = 0; i < keys.length; i++) {
      var arr = TASKS[keys[i]];
      for (var j = 0; j < arr.length; j++) { if (arr[j].id === id) return { t: arr[j], status: keys[i] }; }
    }
    return null;
  }

  /* Task 4.2：从事件元素上溯找到任务 id（看板卡片 / 详情）并返回 id */
  function currentTaskOf(actEl) {
    if (!actEl) return null;
    var card = actEl.closest('[data-id]');
    if (card) return card.getAttribute('data-id');
    return currentDetailTaskId || null;
  }
  /* 真改 bridge 任务栏位 + 刷新看板（TASKS 即 bridge.tasks 同引用） */
  function moveTaskAndRender(id, fromCol, toCol) {
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.moveTask) {
      if (!window.ZX_BRIDGE.moveTask(id, fromCol, toCol)) return;
    } else {
      if (!TASKS[fromCol] || !TASKS[toCol]) return;
      var idx = -1, t = null;
      for (var i = 0; i < TASKS[fromCol].length; i++) { if (TASKS[fromCol][i].id === id) { idx = i; t = TASKS[fromCol][i]; break; } }
      if (idx < 0) return;
      TASKS[fromCol].splice(idx, 1); TASKS[toCol].unshift(t);
    }
    renderKanban();
  }
  /* 任务 → planning 草稿（编辑任务时复用任务设计模式） */
  function planDraftFromTask(task) {
    if (!task) return { type: 'custom' };
    var typeMap = { '整理': '整理笔记', '总结': '总结', '分析': '深度分析', '陪读': '陪读 PDF', '定时': 'custom' };
    return { type: typeMap[task.type] || 'custom', title: task.name, topic: task.name, sourceNotes: [] };
  }
  /* 产物卡：按任务类型给真实产物内容，显示在 toast 区（富文本，长停留） */
  function showProductCard(task) {
    var t = $('[data-toast]');
    if (!t || !task) { toast('查看产物'); return; }
    var body;
    if (task.type === '整理') {
      body = '<div class="nb-prod"><b>归类清单（固态电池主线）</b>' +
        '<div>· 界面阻抗 → 《界面阻抗分析》《阻抗被高估了吗》</div>' +
        '<div>· 硫化物电解质 → 《硫化物 5 大优势》《硫化物 vs 氧化物》</div>' +
        '<div>· 测量方法 → 《四电极体系对比》</div></div>';
    } else if (task.type === '总结') {
      body = '<div class="nb-prod"><b>本周要点 7 条</b>' +
        '<div>① 硫化物电导率 10⁻³ S/cm ② LiNbO₃ 涂层降阻抗 10× ③ 四电极 vs 两电极 …</div></div>';
    } else if (task.type === '分析') {
      body = '<div class="nb-prod"><b>界面阻抗对比表（compare-impedance.csv）</b>' +
        '<div>四电极：10× ｜ 两电极：高估 ｜ 样本：n=12→待 n≥30</div></div>';
    } else {
      body = '<div class="nb-prod"><b>陪读卡片</b><div>LiNbO₃ 涂层 · 高可信（四电极）</div></div>';
    }
    t.classList.remove('nb-toast--undo');
    t.innerHTML = '<div class="nb-toast__card"><div class="nb-toast__card-head">' + IC.spark(13) + ' ' + escapeHtml(task.name) + ' · 产物</div>' + body + '</div>';
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 3600);
  }
  /* Task 4.3：热点预览卡（按热点项给真实预览内容，长停留 toast） */
  function showHotspotCard(actEl) {
    var wId = actEl.getAttribute('data-id');
    var idx = parseInt(actEl.getAttribute('data-idx'), 10) || 0;
    var f = findWidget(wId);
    var item = (f && f.w && f.w.items && f.w.items[idx]) ? f.w.items[idx] : null;
    var t = $('[data-toast]');
    if (!t || !item) { toast('进入热点预览'); return; }
    t.classList.remove('nb-toast--undo');
    t.innerHTML = '<div class="nb-toast__card"><div class="nb-toast__card-head">' + IC.flame() + ' 热点预览 · ' + escapeHtml(item.source) + '</div>' +
      '<div class="nb-prod"><b>' + escapeHtml(item.title) + '</b>' +
      '<div>' + escapeHtml(item.reads) + ' · 主流观点：界面阻抗受测量方法影响显著。</div>' +
      '<div>相关：LiNbO₃ 涂层降阻抗 10×（四电极）。</div></div></div>';
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 3600);
  }
  /* Task 4.3：组件设置 sheet（重命名 + 显隐开关） */
  function showWidgetSettings(id) {
    var f = findWidget(id);
    if (!f) { toast('组件设置'); return; }
    var w = f.w;
    var nameInput = '<input class="nb-set-input" data-set="title" value="' + escapeHtml(w.title) + '" aria-label="组件名称">';
    var hiddenToggle = '<button class="nb-set-toggle' + (w.hidden ? ' is-on' : '') + '" data-set="hidden" data-action="set-toggle-hidden" aria-pressed="' + (w.hidden ? 'true' : 'false') + '">' + (w.hidden ? '已隐藏' : '显示中') + '</button>';
    openSheet('add-widget'); /* 复用底部 sheet 容器，注入临时设置内容 */
    var panel = $('.nb-sheet__panel');
    if (!panel) { toast('组件名称：' + w.title); return; }
    panel.__savedAddBody = panel.querySelector('.nb-widget-pick-list');
    panel.innerHTML =
      '<div class="nb-sheet__handle"></div>' +
      '<div class="nb-sheet__head"><h2 class="nb-sheet__title">组件设置 · ' + escapeHtml(WIDGET_META[w.type] ? WIDGET_META[w.type].chip : w.type) + '</h2><button class="nb-iconbtn" data-action="set-close" aria-label="关闭">' + IC.close() + '</button></div>' +
      '<div class="nb-sheet__body"><div class="nb-set">' +
      '<label class="nb-set-label">名称</label>' + nameInput +
      '<label class="nb-set-label">显示</label>' + hiddenToggle +
      '<button class="nb-btn nb-btn--primary nb-set-save" data-action="set-save" data-id="' + id + '">保存</button>' +
      '</div></div>';
    panel.__setWidgetId = id;
  }
  function restoreAddSheet() {
    var panel = $('.nb-sheet__panel');
    if (panel && panel.__savedAddBody) { panel.appendChild(panel.__savedAddBody); panel.__savedAddBody = null; }
    panel.__setWidgetId = null;
  }

  function taskActions(status) {
    if (status === 'doing') return '<button class="nb-btn nb-btn--ghost nb-btn--sm" data-action="t-pause">' + IC.pause() + ' 暂停</button><button class="nb-btn nb-btn--outline nb-btn--sm" data-action="t-detail">看详情</button>';
    if (status === 'todo') return '<button class="nb-btn nb-btn--primary nb-btn--sm" data-action="t-start">' + IC.play() + ' 开始</button><button class="nb-btn nb-btn--ghost nb-btn--sm" data-action="t-edit">' + IC.edit() + ' 编辑</button>';
    return '<button class="nb-btn nb-btn--outline nb-btn--sm" data-action="t-product">查看产物</button><button class="nb-btn nb-btn--ghost nb-btn--sm" data-action="t-redo">重新执行</button>';
  }

  function taskCard(t, status) {
    var mid = '';
    if (status === 'doing') {
      mid = '<div class="nb-task__progress"><div class="nb-task__barwrap"><span class="nb-task__barfill" style="width:' + t.progress + '%"></span></div>' +
        '<p class="nb-task__step">' + escapeHtml(t.step) + '</p>' +
        '<p class="nb-task__eta">剩余 ' + escapeHtml(t.eta) + ' · ' + t.progress + '%</p></div>';
    } else if (status === 'todo') {
      mid = '<p class="nb-task__meta">' + escapeHtml(t.assigned) + '<br>' + escapeHtml(t.plan) + '</p>';
    } else {
      mid = '<p class="nb-task__meta">' + escapeHtml(t.finished) + '</p>' +
        '<p class="nb-task__product">' + escapeHtml(t.product) + '</p>';
    }
    var typeIco = TASK_TYPE_ICON[t.type] ? TASK_TYPE_ICON[t.type]() : '';
    var agentId = taskAgentByType(t.type);
    var agentMeta = AGENTS[agentId] || AGENTS.research;
    var agentTag = '<span class="nb-task__agent">' + agentMeta.icon + ' 由' + escapeHtml(agentMeta.name) + '执行</span>';
    return '<article class="nb-task" data-action="open-task" data-id="' + t.id + '">' +
      '<div class="nb-task__top"><div class="nb-task__top-left"><span class="nb-task__chip nb-task__chip--' + t.type + '">' + typeIco + escapeHtml(t.type) + '</span>' + agentTag + '</div>' +
      '<span class="nb-task__top-meta"><span class="nb-task__count">' + escapeHtml(t.count) + '</span><span class="nb-task__prio nb-task__prio--' + (t.prio || 'mid') + '" aria-label="优先级"></span></span></div>' +
      '<h4 class="nb-task__name">' + escapeHtml(t.name) + '</h4>' +
      mid +
      '<div class="nb-task__actions">' + taskActions(status) + '</div>' +
      '</article>';
  }

  function renderKanban() {
    var cols = [
      { cls: 'todo', title: '待办', arr: TASKS.todo },
      { cls: 'doing', title: '进行中', arr: TASKS.doing },
      { cls: 'done', title: '已完成', arr: TASKS.done }
    ];
    /* 顶部页签（左右翻页切换列） */
    var tabsBox = $('[data-kanban-tabs]');
    if (tabsBox) {
      tabsBox.innerHTML = cols.map(function (c, i) {
        return '<button class="nb-kanban-tab nb-kanban-tab--' + c.cls + (i === 0 ? ' is-active' : '') + '" ' +
          'data-action="kanban-tab" data-idx="' + i + '" role="tab" aria-selected="' + (i === 0 ? 'true' : 'false') + '">' +
          '<span>' + escapeHtml(c.title) + '</span>' +
          '<span class="nb-kanban-tab__count">' + c.arr.length + '</span></button>';
      }).join('');
    }
    var box = $('[data-kanban]');
    if (!box) return;
    box.innerHTML = cols.map(function (c) {
      var cards = c.arr.map(function (t) { return taskCard(t, c.cls); }).join('');
      return '<div class="nb-col nb-col--' + c.cls + '" data-col="' + c.cls + '">' +
        '<div class="nb-col__head"><h3 class="nb-col__title">' + c.title + '</h3>' +
        '<span class="nb-col__count">' + c.arr.length + '</span><span class="nb-col__bar"></span></div>' +
        '<div class="nb-col__cards">' + cards + '</div></div>';
    }).join('');
    /* 重置到第一页 */
    if (box.scrollTo) box.scrollTo(0, 0); else box.scrollLeft = 0;
    setActiveKanbanTab(0);
    bindKanbanPager();
  }

  /* ---- 看板翻页：滚动联动页签 / 点页签翻页 ---- */
  function setActiveKanbanTab(idx) {
    $all('[data-kanban-tabs] .nb-kanban-tab').forEach(function (t, i) {
      var on = i === idx;
      t.classList.toggle('is-active', on);
      t.setAttribute('aria-selected', on ? 'true' : 'false');
    });
  }
  function bindKanbanPager() {
    var box = $('[data-kanban]');
    if (!box || box.__zxKanbanBound) return;
    box.__zxKanbanBound = true;
    var snapTimer = null;
    box.addEventListener('scroll', function () {
      if (snapTimer) clearTimeout(snapTimer);
      snapTimer = setTimeout(function () {
        var idx = Math.round(box.scrollLeft / box.clientWidth);
        setActiveKanbanTab(idx);
      }, 80);
    }, { passive: true });
  }

  /* ---- Task 1.A.11：任务类型 → 执行子智能体映射 ---- */
  function taskAgentByType(type) {
    if (type === '整理' || type === '总结') return 'summary';
    if (type === '分析') return 'research';
    if (type === '陪读') return 'reader';
    if (type === '定时' || type === '搜索') return 'search';
    return 'research';
  }

  /* ---- Task 1.A.11：智能体中心 · 主智能体卡 + 子智能体网格 ---- */
  function renderAgentSub() {
    var box = $('[data-agent-sub]');
    if (!box) return;
    var mainCard =
      '<div class="nb-agent-main">' +
      '<div class="nb-agent-main__ava">' + IC.spark() + '</div>' +
      '<div class="nb-agent-main__info">' +
      '<div class="nb-agent-main__name">林<span class="nb-agent-main__role">主智能体</span></div>' +
      '<div class="nb-agent-main__desc">你的主智能体，长记忆，专属你</div>' +
      '<div class="nb-agent-main__activity">最近活动：刚刚</div>' +
      '</div>' +
      '<div class="nb-agent-main__online"><span class="nb-dot"></span>在线</div>' +
      '</div>';

    var subIds = ['search', 'summary', 'research', 'reader'];
    var subGrid =
      '<div class="nb-agent-subs">' +
      subIds.map(function (id) {
        var a = AGENTS[id];
        return '<button class="nb-agent-sub" data-action="open-sub-agent" data-id="' + id + '" aria-label="查看' + a.name + '智能体最近子会话">' +
          '<div class="nb-agent-sub__head"><span class="nb-agent-sub__icon">' + a.icon + '</span><span class="nb-agent-sub__name">' + escapeHtml(a.name) + '</span></div>' +
          '<div class="nb-agent-sub__count">调用 ' + a.callCount + ' 次</div>' +
          '</button>';
      }).join('') +
      '</div>';

    box.innerHTML =
      '<div class="nb-agent-sub__label">主智能体</div>' +
      mainCard +
      '<div class="nb-agent-sub__label">子智能体 <span class="nb-agent-sub__label-hint">（林的「能力」，由林调度）</span></div>' +
      subGrid;
  }

  /* ----------------------------- 任务详情 ----------------------------- */

  var currentDetailTaskId = null;

  function renderDetail(id) {
    currentDetailTaskId = id;
    var found = taskById(id);
    var t = found ? found.t : TASKS.doing[0];
    var status = found ? found.status : 'doing';
    var titleEl = $('[data-detail-title]');
    if (titleEl) titleEl.textContent = t.name;
    var body = $('[data-detail-body]');
    if (!body) return;

    /* 执行步骤 todolist：done / doing / pending */
    var steps = '';
    if (status === 'doing') {
      steps =
        detailStep('done', '读取关联笔记 ' + (t.count || '')) +
        detailStep('done', '抽取关键论点与数据') +
        detailStep('doing', t.step || '处理中…') +
        detailStep('pending', '生成可追问的卡片与总结');
    } else if (status === 'todo') {
      steps =
        detailStep('pending', '等待开始 · ' + (t.plan || '')) +
        detailStep('pending', '执行任务') +
        detailStep('pending', '归档结果');
    } else {
      steps =
        detailStep('done', '读取关联笔记 ' + (t.count || '')) +
        detailStep('done', '执行任务') +
        detailStep('done', '归档结果');
    }

    /* AI 思维链：实时推理过程 */
    var chain = '';
    if (status === 'doing') {
      chain =
        detailChain('09:02:11', '读取笔记 n-solid-battery-impedance') +
        detailChain('09:02:34', '识别主题：界面阻抗 / 硫化物电解质') +
        detailChain('09:08:50', t.step || '处理中…');
    } else if (status === 'todo') {
      chain = detailChain('--', '等待启动，林将按计划执行');
    } else {
      chain =
        detailChain('--', '读取关联笔记') +
        detailChain('--', '生成总结') +
        detailChain('--', '归档至主线');
    }

    /* 完成项展示产物 */
    var resultHtml = (status === 'done' && t.product)
      ? '<section class="nb-detail__section"><p class="nb-detail__h">产物</p><div class="nb-detail__result">' + escapeHtml(t.product) + '</div></section>'
      : '';

    body.innerHTML =
      '<section class="nb-detail__section"><p class="nb-detail__h">执行步骤</p><div class="nb-detail__steps">' + steps + '</div></section>' +
      '<section class="nb-detail__section"><p class="nb-detail__h">AI 思维链</p><div class="nb-detail__chain">' + chain + '</div></section>' +
      resultHtml;

    /* 清空底部按钮栏（介入对话/暂停/继续/删除 已移除） */
    var actions = $('[data-detail-actions]');
    if (actions) actions.innerHTML = '';
  }

  function detailStep(state, text) {
    var icon = state === 'done' ? '✓' : state === 'doing' ? '◉' : '○';
    return '<div class="nb-detail__step nb-detail__step--' + state + '">' +
      '<span class="nb-detail__step-icon">' + icon + '</span>' +
      '<span class="nb-detail__step-text">' + escapeHtml(text) + '</span>' +
    '</div>';
  }
  function detailChain(time, text) {
    return '<div class="nb-detail__chain-line">' +
      '<span class="nb-detail__chain-time">[' + escapeHtml(time) + ']</span>' +
      '<span class="nb-detail__chain-text">' + escapeHtml(text) + '</span>' +
    '</div>';
  }

  /* ----------------------------- 对话子页 ----------------------------- */

  var chatMessages = [
    { role: 'ai', text: '早上好。我注意到你昨晚标记了「界面阻抗是否被高估」这条还没复盘，要不要我先把 @《固态电池界面阻抗的真相》 的关键数据对齐一下？', time: '09:02' },
    { role: 'user', text: '好，顺便帮我看看江月的复测质疑是否成立。', time: '09:03' },
    { role: 'ai', text: '收到。江月的复测样本量偏小（n=12），结论方向可信但量级待复核。我已建了一个对比表，稍后放进控制台。', time: '09:03', attach: 'compare-impedance.csv · 已生成' },
    { role: 'user', text: '帮我把硫化物相关的笔记整理一下，按主题归并。', time: '09:05' },
    { role: 'ai', text: '好，我按「固态电池」主线开始归并，把 @《硫化物 vs 氧化物哪个能赢》 和另外 4 篇挂到一起，完成后在控制台给你清单。', time: '09:05' },
    { role: 'user', text: '《锂电池综述.pdf》我读到哪了？', time: '09:06' },
    { role: 'ai', text: '读到 12%，停在第 3 章界面涂层部分。要现在继续吗？我可以边读边把 LiNbO₃ 涂层的关键论点抽成卡片。', time: '09:06' }
  ];
  var DEFAULT_CHAT_MESSAGES = chatMessages;
  var chatAttachments = [];

  /* planning 模式：任务计划草稿 / 用户消息计数 / 是否可确认 */
  var planState = null;
  var planUserMsgCount = 0;
  var planReady = false;
  /* workspace-redesign 模式：工作台调整状态（Task 1.A.13 实现具体逻辑） */
  var redesignState = null;

  /* ---- 修复 3/4.4：对话页入口参数处理（含 planning 任务设计模式） ---- */
  function enterChat(params) {
    params = params || {};
    var msgs;
    var title = '林';
    var status = '在线 · 你的工作伙伴';
    var taskChipData = null;

    if (params.mode === 'planning') {
      planState = makePlanState(params.planDraft);
      planUserMsgCount = 0;
      planReady = false;
      msgs = [{ role: 'ai', text: linOpening(planState), time: nowHm() }];
      title = '任务设计 · 林';
      status = '正在设计任务';
      showPlanbar();
      renderTaskChip(null);
      chatMessages = msgs;
      renderChat();
      setChatTop(title, status);
      return;
    }

    if (params.mode === 'workspace-redesign') {
      startWorkspaceRedesign();
      planState = null; planUserMsgCount = 0; planReady = false;
      hidePlanbar();
      msgs = [{ role: 'ai', text: '我们来看看你的工作台。你想看什么？要不要简化，还是要加什么？', time: nowHm() }];
      title = '工作台调整 · 林';
      status = '正在调整工作台';
      showRedesignPlanbar();
      renderTaskChip(null);
      chatMessages = msgs;
      renderChat();
      setChatTop(title, status);
      return;
    }

    planState = null;
    planUserMsgCount = 0;
    planReady = false;
    hidePlanbar();

    if (params.taskId) {
      var found = taskById(params.taskId);
      var task = found ? found.t : null;
      msgs = (MOCK_TASK_CHATS[params.taskId] || []).slice();
      if (task) {
        title = task.name;
        status = '任务对话 · 可随时介入';
        taskChipData = task;
      } else {
        title = '任务对话';
      }
    } else if (params.chatId) {
      /* Task 4.1：优先读 bridge.convos（含子智能体子会话），其次历史 mock */
      var bConvo = (window.ZX_BRIDGE && window.ZX_BRIDGE.getConvo) ? window.ZX_BRIDGE.getConvo(params.chatId) : null;
      if (bConvo) {
        msgs = (bConvo.msgs || []).slice();
        title = bConvo.title || '历史对话';
        status = bConvo.kind === 'sub' ? ('子智能体 · ' + (bConvo.agentName || '')) : ('恢复于 ' + (bConvo.time || '刚刚'));
      } else {
        var item = findChatById(params.chatId);
        msgs = (MOCK_CHAT_MESSAGES[params.chatId] || []).slice();
        title = item ? item.title : '历史对话';
        status = item ? ('恢复于 ' + item.time) : '历史对话';
      }
    } else if (params.new) {
      msgs = [{ role: 'ai', text: '我们今天聊点什么？', time: nowHm() }];
      title = '新对话';
      status = '新对话';
    } else {
      msgs = DEFAULT_CHAT_MESSAGES.slice();
    }

    chatMessages = msgs;
    renderChat();
    setChatTop(title, status);
    renderTaskChip(taskChipData);
  }

  function setChatTop(title, status) {
    var nameEl = $('.nb-chat__name');
    var statusEl = $('.nb-chat__status');
    if (nameEl) nameEl.textContent = title;
    if (statusEl) statusEl.textContent = status;
  }

  function renderTaskChip(task) {
    var box = $('[data-chat-taskchip]');
    if (!box) return;
    if (!task) { box.hidden = true; box.classList.remove('is-collapsed'); box.innerHTML = ''; return; }
    box.hidden = false;
    box.classList.remove('is-collapsed');
    var iconFn = TASK_TYPE_ICON[task.type] || IC.spark;
    var meta = task.count + ' · 进度 ' + (task.progress || 0) + '%';
    box.innerHTML =
      '<div class="nb-taskchip">' +
      '<button class="nb-taskchip__main" data-action="toggle-taskchip" aria-label="折叠/展开任务上下文">' +
      '<span class="nb-taskchip__icon">' + iconFn() + '</span>' +
      '<span class="nb-taskchip__info">' +
      '<span class="nb-taskchip__name">' + escapeHtml(task.name) + '</span>' +
      '<span class="nb-taskchip__meta">' + escapeHtml(meta) + '</span>' +
      '</span>' +
      '</button>' +
      '<button class="nb-taskchip__close" data-action="close-taskchip" aria-label="关闭任务上下文">' + IC.close() + '</button>' +
      '</div>';
  }

  /* ---- 修复 4.1：对话列表渲染 ---- */
  function renderChatList() {
    var box = $('[data-chatlist-body]');
    if (!box) return;
    box.innerHTML = MOCK_CHAT_LIST.map(function (c) {
      var tags = (c.tags || []).map(function (t) {
        return '<span class="nb-chatlist__tag">' + escapeHtml(t) + '</span>';
      }).join('');
      var kindBadge = c.kind === 'miniapp'
        ? '<span class="nb-chatlist__kind-badge">小程序</span>'
        : '';
      return '<article class="nb-chatlist__item' + (c.kind === 'miniapp' ? ' nb-chatlist__item--miniapp' : '') + '" data-action="open-chat-by-id" data-id="' + c.id + '">' +
        '<span class="nb-chatlist__ava">' + IC.spark() + '</span>' +
        '<div class="nb-chatlist__main">' +
        '<div class="nb-chatlist__row1">' +
        kindBadge +
        '<h3 class="nb-chatlist__t">' + escapeHtml(c.title) + '</h3>' +
        '<span class="nb-chatlist__time">' + escapeHtml(c.time) + '</span>' +
        '</div>' +
        '<p class="nb-chatlist__preview">' + escapeHtml(c.preview) + '</p>' +
        (tags ? '<div class="nb-chatlist__tags">' + tags + '</div>' : '') +
        '</div>' +
        '</article>';
    }).join('');
  }

  function chatInput() { return $('[data-chat-input]'); }
  function chatMsgs() { return $('[data-chat-msgs]'); }

  function parseInline(text) {
    return escapeHtml(text).replace(/@《([^》]+)》/g, function (_, title) {
      return '<span class="nb-chip-inline">@《' + escapeHtml(title) + '》</span>';
    });
  }

  function renderMessage(m) {
    if (m.role === 'dispatch') return renderDispatch(m);
    var isAi = m.role === 'ai';
    var bubble = '<div class="nb-msg__bubble">' + parseInline(m.text) + '</div>';
    if (m.attach) {
      bubble += '<div class="nb-msg__attach">' + IC.pdf() + '<span>' + escapeHtml(m.attach) + '</span></div>';
    }
    return '<div class="nb-msg nb-msg--' + m.role + '">' +
      '<span class="nb-msg__ava">' + (isAi ? '林' : '我') + '</span>' +
      '<div>' + bubble + '<p class="nb-msg__time">' + escapeHtml(m.time || '') + '</p></div>' +
      '</div>';
  }

  function renderChat() {
    var box = chatMsgs();
    if (!box) return;
    box.innerHTML = chatMessages.map(renderMessage).join('');
  }

  /* ---- 调度状态消息渲染：林调用子智能体的透明化展示（Task 1.A.10）
   * Task 0.3：迁至共享 ZX_DISPATCH.render，notebook 与 editor 复用同一渲染 ---- */
  function renderDispatch(m) {
    if (window.ZX_DISPATCH && window.ZX_DISPATCH.render) return window.ZX_DISPATCH.render(m);
    return '';
  }

  function rerenderDispatch(msg) {
    if (!msg || !msg._domId) return;
    var node = $('[data-dispatch-id="' + msg._domId + '"]');
    if (node) {
      var tmp = el('div');
      tmp.innerHTML = renderDispatch(msg);
      if (tmp.firstElementChild) node.parentNode.replaceChild(tmp.firstElementChild, node);
    }
    scrollChatBottom();
  }

  function pushMessage(role, text, attaches) {
    var d = new Date();
    var time = String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    var msg = { role: role, text: text, time: time };
    if (attaches && attaches.length) { msg.attach = attaches[0].label + ' · 已附上'; }
    chatMessages.push(msg);
    var box = chatMsgs();
    if (box) { box.insertAdjacentHTML('beforeend', renderMessage(msg)); }
    scrollChatBottom();
  }

  function scrollChatBottom() {
    var box = chatMsgs();
    if (box) box.scrollTop = box.scrollHeight;
  }

  function showTyping() {
    var box = chatMsgs();
    if (!box) return null;
    var html = '<div class="nb-msg nb-msg--ai nb-msg--typing">' +
      '<span class="nb-msg__ava">林</span>' +
      '<div><div class="nb-msg__bubble"><span class="nb-typing">' +
      '<span class="nb-typing__dots"><span class="nb-typing__dot"></span><span class="nb-typing__dot"></span><span class="nb-typing__dot"></span></span>' +
      '<span class="nb-typing__label">林正在思考…</span></span></div></div>' +
      '</div>';
    box.insertAdjacentHTML('beforeend', html);
    scrollChatBottom();
    return box.lastElementChild;
  }
  function removeTyping(el) { if (el && el.parentNode) el.parentNode.removeChild(el); }

  /* Task 1.1：把随机池回复改为 ZX_AI 取材（保留 planning/redesign 分支） */
  function intentOf(text) {
    if (/查|搜索|找/.test(text)) return 'search';
    if (/总结|归纳/.test(text)) return 'summarize';
    if (/江月|复测|阻抗|争议|质疑/.test(text)) return 'impedance';
    if (/研究|调研|深入|分析/.test(text)) return 'research';
    if (/读|pdf|陪读|文献|论文/i.test(text)) return 'reader';
    if (/路线|量产|中试|宁德|产业/.test(text)) return 'industry';
    return 'general';
  }

  function mockAiReply(userText) {
    if (planState) {
      if (planReady) {
        return '计划看起来完整了，要我创建这个任务吗？你可以点状态条底部的「确认创建任务」，也可以继续补充。';
      }
      return '好的，我记下了。还有要补充的吗？比如关联哪几篇笔记、跑的频次，或者具体目标。';
    }
    /* 走 ZX_AI 伪 ReAct 取材 */
    if (window.ZX_AI && window.ZX_AI.reply) {
      var intent = intentOf(userText);
      /* search/reader/research 这类会被 detectSubAgent 拦去走 dispatch，
         这里只为非调度兜底，用对应 intent 取材 */
      var ai = intent;
      if (intent === 'summarize') ai = 'summarize';
      else if (intent === 'impedance') ai = 'impedance';
      else if (intent === 'industry') ai = 'industry';
      else ai = 'general';
      return window.ZX_AI.reply(ai, { selText: userText, query: userText });
    }
    return '好的，我来看看。需要的话我会把它挂到你的「固态电池」主线上。';
  }

  /* ---- 调度透明化：林识别用户意图后，调用对应子智能体（Task 1.A.10） ---- */

  function detectSubAgent(text) {
    if (/查|搜索|找/.test(text)) return 'search';
    if (/总结|归纳/.test(text)) return 'summary';
    if (/研究|调研|深入/.test(text)) return 'research';
    if (/读|PDF|论文/.test(text)) return 'reader';
    return null;
  }

  /* Task 0.3：迁至共享 ZX_DISPATCH.result（= ZX_AI.dispatch，取真实笔记标题） */
  function subAgentMockResult(agentId, userText) {
    if (window.ZX_DISPATCH && window.ZX_DISPATCH.result) return window.ZX_DISPATCH.result(agentId, userText);
    return { query: userText || '', duration: '1.0s', resultCount: 0, items: [] };
  }

  /* Task 1.1：整合回复按 agentId 走 ZX_AI 取材（含伪 ReAct 前缀） */
  function integrationReply(agentId, userText) {
    var topic = userText.replace(/^(帮我|请|麻烦)?(查一下|查询|搜索|查找|查|找一下|找|总结一下|归纳一下|总结|归纳|研究一下|调研一下|深入研究|研究|调研|读一下|陪读|读)/, '').trim() || '这个话题';
    if (window.ZX_AI && window.ZX_AI.reply) {
      if (agentId === 'search')   return window.ZX_AI.reply('impedance', { selText: topic, query: userText });
      if (agentId === 'summary')  return window.ZX_AI.reply('summarize', { selText: topic, query: userText });
      if (agentId === 'research') return window.ZX_AI.reply('counter', { selText: topic, query: userText });
      if (agentId === 'reader')   return window.ZX_AI.reply('sulfide', { selText: topic, query: userText });
    }
    if (agentId === 'summary') return '总结完成。核心要点已抽取为卡片，挂在你的「固态电池」主线下，要看看吗？';
    if (agentId === 'research') return '研究告一段落。我整理了争议点和待验证项，放在控制台的「研究」任务里，你可以随时介入追问。';
    if (agentId === 'reader') return '陪读完成关键章节。LiNbO₃ 涂层数据我标了「高可信」。继续读还是先聊聊？';
    return '完成了。';
  }

  function updateSendState() {
    var i = chatInput();
    var btn = $('[data-chat-send]');
    if (!i || !btn) return;
    var has = i.value.trim().length > 0 || chatAttachments.length > 0;
    btn.disabled = !has;
    /* 有文字时给 input-row 加 is-composing：显示发送、隐藏附件按钮（微信式） */
    var row = i.closest('.nb-chat__input-row');
    if (row) { row.classList.toggle('is-composing', has); }
  }

  /* textarea 自适应高度（键盘输入后调用） */
  function onInputScrollHeight(input) {
    input.style.height = 'auto';
    input.style.height = Math.min(96, input.scrollHeight) + 'px';
  }

  /* 模拟键盘：focus 时滑入，blur 时收起；点击按键往输入框插字 */
  function chatKeyboard() { return $('[data-chat-keyboard]'); }
  function showChatKeyboard() {
    var kb = chatKeyboard();
    if (kb) kb.removeAttribute('hidden');
  }
  function hideChatKeyboard() {
    var kb = chatKeyboard();
    if (kb) kb.setAttribute('hidden', '');
  }
  function bindChatKeyboard(kb, input, sendBtn, onUpdate) {
    if (!kb || !input) return;
    /* 防止点击键盘导致输入框 blur */
    kb.addEventListener('mousedown', function (e) { e.preventDefault(); });
    kb.addEventListener('click', function (e) {
      var key = e.target.closest('.nb-chat__key');
      if (!key) return;
      var special = key.getAttribute('data-nb-key');
      if (special === 'back') {
        input.value = input.value.slice(0, -1);
      } else if (special === 'space') {
        input.value += ' ';
      } else if (special === 'enter') {
        input.value += '\n';
      } else if (special === 'shift') {
        /* 简单大小写切换 */
        var upper = key.classList.toggle('is-on');
        kb.querySelectorAll('.nb-chat__key').forEach(function (k) {
          if (k.type === 'button' && !k.getAttribute('data-nb-key')) {
            k.textContent = upper ? (k.textContent.toUpperCase()) : (k.textContent.toLowerCase());
          }
        });
      } else {
        input.value += key.textContent;
      }
      onInputScrollHeight(input);
      if (onUpdate) onUpdate(); else updateSendState();
      input.focus();
    });
  }

  /* 小程序对话键盘：复用 chat 键盘交互，但更新小程序发送按钮状态 */
  function macKeyboard() { return $('[data-mac-keyboard]'); }
  function showMacKeyboard() {
    var kb = macKeyboard();
    if (kb) kb.removeAttribute('hidden');
  }
  function hideMacKeyboard() {
    var kb = macKeyboard();
    if (kb) kb.setAttribute('hidden', '');
  }
  function updateMacSendState() {
    var input = $('[data-mac-input]');
    var btn = $('[data-action="miniapp-send"]');
    if (!input || !btn) return;
    btn.disabled = input.value.trim().length === 0 || miniappState.building;
  }

  function renderAttachTray() {
    var tray = $('[data-chat-tray]');
    if (!tray) return;
    tray.innerHTML = chatAttachments.map(function (a, idx) {
      return '<span class="nb-chat__att-chip">' + (a.kind === 'image' ? IC.image() : IC.pdf()) + '<span>' + escapeHtml(a.label) + '</span>' +
        '<button data-action="remove-attach" data-idx="' + idx + '" aria-label="移除">×</button></span>';
    }).join('');
    tray.style.display = chatAttachments.length ? 'flex' : 'none';
    updateSendState();
  }

  function addAttachment(kind, label) {
    chatAttachments.push({ kind: kind, label: label });
    renderAttachTray();
    toast('已添加 ' + label);
  }

  /* ---- @ 引用 ---- */

  function mentionEl() { return $('[data-mention]'); }

  function openMention(query) {
    var box = mentionEl();
    if (!box) return;
    var notes = (mock().notes || []).filter(function (n) { return !query || n.title.indexOf(query) >= 0; }).slice(0, 6);
    if (!notes.length) { closeMention(); return; }
    box.innerHTML = notes.map(function (n) {
      return '<button class="nb-mention__item" data-action="pick-mention" data-title="' + escapeHtml(n.title) + '">' +
        escapeHtml(n.title) + '<small>' + escapeHtml((n.tags || []).slice(0, 2).join(' · ')) + '</small></button>';
    }).join('');
    box.classList.add('is-open');
  }

  function closeMention() { var box = mentionEl(); if (box) box.classList.remove('is-open'); }

  function currentMentionQuery() {
    var ta = chatInput();
    if (!ta) return null;
    var pos = ta.selectionStart;
    var val = ta.value.slice(0, pos);
    var m = val.match(/@([^@\s《》]{0,20})$/);
    return m ? { query: m[1], start: pos - m[0].length } : null;
  }

  function insertMention(title) {
    var ta = chatInput();
    if (!ta) return;
    var info = currentMentionQuery();
    var insert = '@《' + title + '》 ';
    if (info) {
      ta.value = ta.value.slice(0, info.start) + insert + ta.value.slice(ta.selectionStart);
    } else {
      ta.value += insert;
    }
    var np = (info ? info.start : ta.value.length - insert.length) + insert.length;
    ta.focus();
    ta.setSelectionRange(np, np);
    closeMention();
    updateSendState();
  }

  function sendChat() {
    var i = chatInput();
    if (!i) return;
    var text = i.value.trim();
    var atts = chatAttachments.slice();
    if (!text && !atts.length) return;
    pushMessage('user', text || '（附件）', atts);
    if (planState) handlePlanningUserMessage(text);
    else if (redesignState) handleWorkspaceRedesignMessage(text);
    i.value = '';
    chatAttachments = [];
    renderAttachTray();
    closeMention();
    updateSendState();
    var echo = text;
    /* redesign 模式：handler 已同步发出操作回复，直接返回，不再 typing */
    if (redesignState) return;
    /* planning 模式不走子智能体调度，由 mockAiReply 的 planning 分支回复 */
    var subAgent = planState ? null : detectSubAgent(echo);
    if (subAgent) {
      /* 调度透明化：先插入 pending 调度状态消息，1.5s 后转完成态 + 林发整合消息 */
      var dispatchMsg = { role: 'dispatch', agentId: subAgent, userText: echo, status: 'pending', expanded: false };
      chatMessages.push(dispatchMsg);
      var dbox = chatMsgs();
      if (dbox) { dbox.insertAdjacentHTML('beforeend', renderMessage(dispatchMsg)); }
      scrollChatBottom();
      window.setTimeout(function () {
        dispatchMsg.status = 'done';
        dispatchMsg.result = subAgentMockResult(subAgent, echo);
        rerenderDispatch(dispatchMsg);
        window.setTimeout(function () {
          pushMessage('ai', integrationReply(subAgent, echo), []);
        }, 280);
      }, 1500);
    } else {
      var typingEl = showTyping();
      window.setTimeout(function () {
        removeTyping(typingEl);
        pushMessage('ai', mockAiReply(echo), []);
      }, 900);
    }
  }

  /* ----------------------------- planning：任务计划状态条 ----------------------------- */

  var PLAN_TYPES = ['custom', '整理笔记', '总结', '深度分析', '陪读 PDF'];
  var PLAN_FREQS = ['一次性', '每日', '每周'];

  function planTypeLabel(t) { return t === 'custom' ? '选择类型…' : t; }

  function makePlanState(draft) {
    draft = draft || {};
    var s = { type: draft.type || 'custom', title: draft.title || '', chips: [], freq: draft.freq || '一次性' };
    if (draft.sourceNotes && draft.sourceNotes.length) s.chips.push('已关联 ' + draft.sourceNotes.length + ' 篇笔记');
    if (draft.topic) { if (!s.title) s.title = draft.topic; s.chips.push(draft.topic); }
    if (draft.pdf) s.chips.push(draft.pdf);
    return s;
  }

  function planSummary() {
    if (!planState) return '';
    var summary = planState.type !== 'custom' ? planState.type : '未定类型';
    if (planState.chips.length) summary += ' · ' + planState.chips.length + ' 项';
    return summary;
  }

  function linOpening(plan) {
    if (plan.type === '陪读 PDF') return '我来陪你读这份 PDF。你希望这次阅读的重点是什么？是关键概念、实验方法，还是论点梳理？';
    if (plan.type === '整理笔记') return '整理这批笔记时，你更想按主题归档，还是按时间线梳理脉络？';
    if (plan.type === '总结') return '我们来设计一个总结任务。你想总结的范围是最近一周，还是某个特定主题？';
    if (plan.type === '深度分析') return '我们来设计一个深度分析任务。你想聚焦的主题是什么？需要看数据、观点，还是找缺口？';
    return '我们来设计一个任务。你希望让林帮你做什么？整理笔记 / 总结 / 深度分析 / 陪读 PDF ？';
  }

  function showPlanbar() {
    var bar = $('[data-chat-planbar]');
    if (bar) { bar.hidden = false; bar.classList.remove('is-collapsed'); }
    renderPlanbar();
  }
  function hidePlanbar() {
    var bar = $('[data-chat-planbar]');
    if (bar) { bar.hidden = true; bar.classList.remove('is-collapsed'); bar.innerHTML = ''; }
  }

  function updatePlanbarSummary() {
    var sumEl = $('.nb-planbar__summary');
    if (sumEl) sumEl.textContent = planSummary();
  }

  function planField(label, control) {
    return '<div class="nb-planbar__field"><span class="nb-planbar__label">' + label + '</span>' + control + '</div>';
  }

  function renderPlanbar() {
    var bar = $('[data-chat-planbar]');
    if (!bar || !planState) return;
    var typeOpts = PLAN_TYPES.map(function (t) {
      return '<option value="' + escapeHtml(t) + '"' + (planState.type === t ? ' selected' : '') + '>' + escapeHtml(planTypeLabel(t)) + '</option>';
    }).join('');
    var freqOpts = PLAN_FREQS.map(function (f) {
      return '<option value="' + escapeHtml(f) + '"' + (planState.freq === f ? ' selected' : '') + '>' + escapeHtml(f) + '</option>';
    }).join('');
    var chipsHtml = planState.chips.map(function (c) {
      return '<span class="nb-planbar__chip">' + escapeHtml(c) + '</span>';
    }).join('') + '<button class="nb-planbar__addchip" type="button" data-action="plan-add-chip">' + IC.plus() + ' 添加笔记</button>';

    bar.innerHTML =
      '<div class="nb-planbar">' +
      '<div class="nb-planbar__head">' +
      '<button class="nb-planbar__close" type="button" data-action="exit-planning" aria-label="退出任务设计">' + IC.close() + '</button>' +
      '<button class="nb-planbar__title" type="button" data-action="toggle-planbar">' +
      IC.spark() +
      '<span class="nb-planbar__title-text">任务计划草案</span>' +
      '<span class="nb-planbar__summary">' + escapeHtml(planSummary()) + '</span>' +
      '<span class="nb-planbar__chev">' + IC.chev() + '</span>' +
      '</button>' +
      '</div>' +
      '<div class="nb-planbar__body">' +
      planField('类型', '<select class="nb-planbar__control" data-plan="type">' + typeOpts + '</select>') +
      planField('标题', '<input class="nb-planbar__control" data-plan="title" value="' + escapeHtml(planState.title) + '" placeholder="给任务起个名字…">') +
      planField('关联', '<div class="nb-planbar__chips" data-plan="chips">' + chipsHtml + '</div>') +
      planField('频次', '<select class="nb-planbar__control" data-plan="freq">' + freqOpts + '</select>') +
      '</div>' +
      '<button class="nb-btn nb-btn--primary nb-planbar__confirm' + (planReady ? ' is-ready' : '') + '" type="button" data-action="confirm-plan">确认创建任务</button>' +
      '</div>';
  }

  function onPlanbarChange(e) {
    if (!planState) return;
    var t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-plan')) return;
    var key = t.getAttribute('data-plan');
    if (key === 'type') planState.type = t.value;
    else if (key === 'freq') planState.freq = t.value;
    renderPlanbar();
  }
  function onPlanbarInput(e) {
    if (!planState) return;
    var t = e.target;
    if (!t || !t.hasAttribute || !t.hasAttribute('data-plan')) return;
    if (t.getAttribute('data-plan') === 'title') {
      planState.title = t.value;
      updatePlanbarSummary();
    }
  }

  function handlePlanningUserMessage(text) {
    planUserMsgCount++;
    var changed = false;
    if (/主题/.test(text)) {
      planState.type = '整理笔记';
      if (planState.chips.indexOf('按主题') < 0) { planState.chips.push('按主题'); changed = true; }
    }
    var numMatch = text.match(/(\d+)\s*篇/);
    if (numMatch) {
      planState.chips = planState.chips.filter(function (c) { return !/^已关联/.test(c); });
      planState.chips.push('已关联 ' + numMatch[1] + ' 篇笔记');
      changed = true;
    }
    if (/每天|每日/.test(text)) { planState.freq = '每日'; changed = true; }
    else if (/每周/.test(text)) { planState.freq = '每周'; changed = true; }
    if (/总结/.test(text)) { planState.type = '总结'; changed = true; }
    if (/分析/.test(text)) { planState.type = '深度分析'; changed = true; }
    if (/陪读/.test(text)) { planState.type = '陪读 PDF'; changed = true; }
    if (changed) renderPlanbar();

    if (planUserMsgCount >= 2 && !planReady) {
      planReady = true;
      var btn = $('.nb-planbar__confirm');
      if (btn) btn.classList.add('is-ready');
    }
  }

  function planDraftFromAssignType(t) {
    if (t === 'organize') return { type: '整理笔记', sourceNotes: ['昨天新增 5 篇'] };
    if (t === 'analyze') return { type: '深度分析', topic: '界面阻抗' };
    if (t === 'pdf') return { type: '陪读 PDF', pdf: '锂电池综述.pdf' };
    if (t === 'summary') return { type: '总结', topic: '群组热议' };
    return { type: 'custom' };
  }

  function addPlannedTask(plan, name) {
    var typeKey = plan.type !== 'custom' ? plan.type : '整理';
    var relateCount = plan.chips.length || 1;
    TASKS.todo.unshift({
      id: 'tp' + Date.now(),
      type: typeKey,
      prio: 'mid',
      name: name,
      count: '关联 ' + relateCount + ' 项',
      assigned: '刚刚由你与林设计',
      plan: plan.freq !== '一次性' ? '频次：' + plan.freq : '等你空闲时开始'
    });
  }

  /* ----------------------------- workspace-redesign：AI 可编辑工作台（Task 1.A.13） -----------------------------
   * 林在对话中真实修改 widgets state（移除/隐藏/加回/加大），用户可应用、撤销或取消（恢复快照）。
   * -------------------------------------------------------------------------- */
  var redesignUndoTimer = null;

  function startWorkspaceRedesign() {
    redesignState = {
      log: [],
      snapshot: state.widgets.map(function (w) { return JSON.parse(JSON.stringify(w)); }),
      history: []
    };
  }

  function widgetNameByType(t) {
    return ({ todo: '待办', chat: '对话', hotspot: '今日热点', recall: '笔记回顾', free: '便签', 'ai-suggestion': 'AI 建议' })[t] || t;
  }

  function showRedesignPlanbar() {
    var bar = $('[data-chat-planbar]');
    if (bar) { bar.hidden = false; bar.classList.remove('is-collapsed'); }
    renderRedesignPlanbar();
  }
  function hideRedesignPlanbar() {
    var bar = $('[data-chat-planbar]');
    if (bar) { bar.hidden = true; bar.classList.remove('is-collapsed'); bar.innerHTML = ''; }
  }

  function renderRedesignPlanbar() {
    var bar = $('[data-chat-planbar]');
    if (!bar || !redesignState) return;
    var logHtml;
    if (redesignState.log.length) {
      logHtml = redesignState.log.map(function (l) {
        return '<div class="nb-rdp__log-line">· ' + escapeHtml(l) + '</div>';
      }).join('');
    } else {
      logHtml = '<div class="nb-rdp__log-line nb-rdp__log-line--empty">· (等待你的指示)</div>';
    }
    bar.innerHTML =
      '<div class="nb-planbar nb-rdp">' +
      '<div class="nb-planbar__head">' +
      '<button class="nb-planbar__close" type="button" data-action="exit-redesign" aria-label="退出工作台调整">' + IC.close() + '</button>' +
      '<div class="nb-planbar__title"><span class="nb-planbar__title-text">✦ 工作台调整</span></div>' +
      '</div>' +
      '<div class="nb-rdp__body">' +
      '<div class="nb-rdp__section-label">操作记录</div>' +
      '<div class="nb-rdp__log">' + logHtml + '</div>' +
      '</div>' +
      '<button class="nb-btn nb-btn--primary nb-rdp__apply" type="button" data-action="apply-redesign">应用更改</button>' +
      '</div>';
  }

  function handleWorkspaceRedesignMessage(text) {
    if (!redesignState) return;
    /* 撤销优先 */
    if (/撤销|撤回|退回/.test(text)) { undoLastRedesign(); return; }

    var changed = false;
    var reply = null;

    /* 太乱/简化 → 移除今日热点 + 笔记回顾 */
    if (/太乱|简化|太多|精简/.test(text)) {
      var removedNames = [];
      var removedSnap = [];
      state.widgets.forEach(function (w) {
        if ((w.type === 'hotspot' || w.type === 'recall') && !w.hidden) {
          removedNames.push(widgetNameByType(w.type));
          removedSnap.push(JSON.parse(JSON.stringify(w)));
        }
      });
      if (removedSnap.length) {
        state.widgets = state.widgets.filter(function (w) { return !(w.type === 'hotspot' || w.type === 'recall'); });
        redesignState.history.push({ type: 'remove', widgets: removedSnap });
        redesignState.log.push('移除 ' + removedNames.join(' / '));
        reply = '好的，我把' + removedNames.join('和') + '移除了，工作台清爽多了。还需要再简化吗？';
        changed = true;
      }
    }
    /* 专注/写作 → 隐藏除 todo/ai-suggestion/chat 外的组件 */
    else if (/专注|写作|聚焦/.test(text)) {
      var hiddenIds = [];
      state.widgets.forEach(function (w) {
        if (['hotspot', 'recall', 'free'].indexOf(w.type) >= 0 && !w.hidden) { w.hidden = true; hiddenIds.push(w.id); }
      });
      if (hiddenIds.length) {
        redesignState.history.push({ type: 'hide', ids: hiddenIds });
        redesignState.log.push('聚焦写作：隐藏热点 / 回顾 / 便签');
        reply = '好的，我让工作台更聚焦写作——只留待办、对话和 AI 建议。写完想恢复随时说「加回」。';
        changed = true;
      }
    }
    /* 加大 X / X 大一点 */
    else if (/(加大|大一点|放大|更大|调高|更高)/.test(text)) {
      var resizeMap = { '待办': 'todo', '热点': 'hotspot', '回顾': 'recall', '便签': 'free', '建议': 'ai-suggestion', '对话': 'chat' };
      Object.keys(resizeMap).forEach(function (kw) {
        if (changed) return;
        if (text.indexOf(kw) >= 0) {
          var t = resizeMap[kw];
          var target = null;
          for (var i = 0; i < state.widgets.length; i++) {
            if (state.widgets[i].type === t && !state.widgets[i].hidden) { target = state.widgets[i]; break; }
          }
          if (target) {
            var oldH = target.height || 240;
            target.height = Math.min(400, oldH + 80);
            redesignState.history.push({ type: 'resize', id: target.id, oldH: oldH });
            redesignState.log.push('加大 ' + kw + '（→ ' + target.height + 'px）');
            reply = '好的，我把' + kw + '加大了，现在 ' + target.height + 'px 高，看得更清楚。';
            changed = true;
          }
        }
      });
    }
    /* 加 X / 加回 X / 恢复 */
    else if (/加|恢复|回来/.test(text)) {
      var addMap = { '待办': 'todo', '热点': 'hotspot', '回顾': 'recall', '便签': 'free', '建议': 'ai-suggestion', '对话': 'chat' };
      var addedKws = [];
      Object.keys(addMap).forEach(function (kw) {
        if (text.indexOf(kw) < 0) return;
        var t = addMap[kw];
        var items = [];
        state.widgets.forEach(function (w) {
          if (w.type === t && w.hidden) { w.hidden = false; items.push({ id: w.id, kind: 'unhide' }); }
        });
        if (items.length) {
          redesignState.history.push({ type: 'add', items: items });
          redesignState.log.push('加回 ' + kw);
          addedKws.push(kw);
        } else {
          var existed = state.widgets.some(function (w) { return w.type === t; });
          if (!existed) {
            var nw = newWidgetDefault(t);
            state.widgets.push(nw);
            redesignState.history.push({ type: 'add', items: [{ id: nw.id, kind: 'create' }] });
            redesignState.log.push('新增 ' + kw);
            addedKws.push(kw);
          }
        }
      });
      if (addedKws.length) {
        reply = '好的，我把' + addedKws.join('、') + '加回来了。';
        changed = true;
      }
    }

    if (changed) {
      renderRedesignPlanbar();
      showRedesignUndoToast();
      pushMessage('ai', reply || '好的，已调整。', []);
    } else {
      pushMessage('ai', '嗯，你想怎么调整？可以说「太乱了简化一下」「专注写作」，或者「加回热点」「加大待办」。', []);
    }
  }

  function undoLastRedesign() {
    if (!redesignState || !redesignState.history.length) {
      pushMessage('ai', '没有可撤销的调整了。', []);
      return;
    }
    var last = redesignState.history.pop();
    var undone = redesignState.log.pop();
    if (last.type === 'remove') {
      last.widgets.forEach(function (snap) {
        var exists = state.widgets.some(function (w) { return w.id === snap.id; });
        if (!exists) state.widgets.push(JSON.parse(JSON.stringify(snap)));
      });
    } else if (last.type === 'hide') {
      last.ids.forEach(function (id) { var f = findWidget(id); if (f) f.w.hidden = false; });
    } else if (last.type === 'add') {
      last.items.forEach(function (it) {
        if (it.kind === 'unhide') { var f = findWidget(it.id); if (f) f.w.hidden = true; }
        else { var f2 = findWidget(it.id); if (f2) state.widgets.splice(f2.i, 1); }
      });
    } else if (last.type === 'resize') {
      var fr = findWidget(last.id);
      if (fr) fr.w.height = last.oldH;
    }
    redesignState.log.push('撤销：' + (undone || '上一步'));
    renderRedesignPlanbar();
    pushMessage('ai', '好，我撤销了「' + (undone || '上一步') + '」。', []);
  }

  function showRedesignUndoToast() {
    var t = $('[data-toast]');
    if (!t) return;
    t.classList.remove('is-show');
    t.innerHTML = '<button class="nb-toast__undo" data-action="undo-redesign" aria-label="撤销林的调整">↶ 撤销林的调整</button>';
    t.classList.add('is-show', 'nb-toast--undo');
    if (redesignUndoTimer) clearTimeout(redesignUndoTimer);
    redesignUndoTimer = setTimeout(function () {
      t.classList.remove('is-show', 'nb-toast--undo');
      t.innerHTML = '';
    }, 5000);
  }

  /* ----------------------------- 模板选择页 ----------------------------- */

  function svgTplDoc() {
    return svg('<path d="M9 4h7l5 5v11a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V5a1 1 0 0 1 1-1z"/><path d="M16 4v5h5"/><path d="M11 17h7M11 13h7"/>');
  }
  function svgTplBook() {
    return svg('<path d="M12 7C9.5 5.5 6 5 3 5.5v13C6 18 9.5 18.5 12 20"/><path d="M12 7c2.5-1.5 6-2 9-1.5v13c-3-.5-6.5 0-9 2"/><path d="M12 7v13"/>');
  }
  function svgTplPalette() {
    return svg('<path d="M12 3a9 9 0 0 0 0 18c1.7 0 2.5-1.3 2.5-2.5 0-.7-.3-1.2-.7-1.6-.4-.5-.6-1-.6-1.6 0-1.2 1-2.2 2.2-2.2H17a4 4 0 0 0 4-4c0-3.3-4-6-9-6z"/><circle cx="7.5" cy="11" r="1.1" fill="currentColor" stroke="none"/><circle cx="9.5" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="14" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="16.5" cy="11" r="1.1" fill="currentColor" stroke="none"/>');
  }
  function svgTplTree() {
    return svg('<rect x="3" y="5" width="9" height="4" rx="2"/><rect x="3" y="14" width="6" height="4" rx="2"/><path d="M12 7h4M12 16h4"/><rect x="16" y="9" width="5" height="4" rx="2"/><path d="M14 7v6"/>');
  }

  function previewTplDoc() {
    return '<svg viewBox="0 0 120 64" fill="none" aria-hidden="true"><rect x="1" y="1" width="118" height="62" rx="5" fill="#FAF6EE" stroke="#0E0D0B" stroke-opacity="0.16"/><rect x="14" y="12" width="58" height="5" rx="2.5" fill="#0E0D0B" fill-opacity="0.5"/><rect x="14" y="24" width="92" height="3" rx="1.5" fill="#0E0D0B" fill-opacity="0.18"/><rect x="14" y="31" width="86" height="3" rx="1.5" fill="#0E0D0B" fill-opacity="0.18"/><line x1="14" y1="40" x2="106" y2="40" stroke="#0E0D0B" stroke-opacity="0.14"/><rect x="14" y="48" width="68" height="3" rx="1.5" fill="#0E0D0B" fill-opacity="0.18"/></svg>';
  }
  function previewTplBook() {
    return '<svg viewBox="0 0 120 64" fill="none" aria-hidden="true"><rect x="1" y="1" width="118" height="62" rx="5" fill="#FAF6EE" stroke="#0E0D0B" stroke-opacity="0.16"/><line x1="60" y1="8" x2="60" y2="56" stroke="#1D5B7A" stroke-opacity="0.5"/><rect x="10" y="13" width="44" height="4" rx="2" fill="#1D5B7A" fill-opacity="0.65"/><rect x="10" y="22" width="40" height="2.6" rx="1.3" fill="#0E0D0B" fill-opacity="0.2"/><rect x="10" y="29" width="42" height="2.6" rx="1.3" fill="#0E0D0B" fill-opacity="0.2"/><rect x="10" y="36" width="36" height="2.6" rx="1.3" fill="#0E0D0B" fill-opacity="0.2"/><rect x="68" y="13" width="42" height="22" rx="3" fill="#1D5B7A" fill-opacity="0.14" stroke="#1D5B7A" stroke-opacity="0.45"/><rect x="72" y="40" width="34" height="2.6" rx="1.3" fill="#0E0D0B" fill-opacity="0.2"/><rect x="72" y="46" width="24" height="2.6" rx="1.3" fill="#0E0D0B" fill-opacity="0.2"/></svg>';
  }
  function previewTplCanvas() {
    return '<svg viewBox="0 0 120 64" fill="none" aria-hidden="true"><rect x="1" y="1" width="118" height="62" rx="5" fill="#FAF6EE" stroke="#0E0D0B" stroke-opacity="0.16"/><rect x="12" y="11" width="28" height="15" rx="3" fill="#B4602C" fill-opacity="0.18" stroke="#B4602C" stroke-opacity="0.5"/><rect x="58" y="17" width="32" height="17" rx="3" fill="#1D5B7A" fill-opacity="0.16" stroke="#1D5B7A" stroke-opacity="0.45"/><rect x="40" y="38" width="36" height="15" rx="3" fill="#C7A24A" fill-opacity="0.22" stroke="#C7A24A" stroke-opacity="0.55"/><path d="M40 19c8 3 12 5 18 7" stroke="#0E0D0B" stroke-opacity="0.38" stroke-dasharray="3 3" fill="none"/><path d="M76 35c-3 3-5 4-9 6" stroke="#0E0D0B" stroke-opacity="0.38" stroke-dasharray="3 3" fill="none"/></svg>';
  }
  function previewTplOutline() {
    return '<svg viewBox="0 0 120 64" fill="none" aria-hidden="true"><rect x="1" y="1" width="118" height="62" rx="5" fill="#FAF6EE" stroke="#0E0D0B" stroke-opacity="0.16"/><rect x="12" y="11" width="42" height="4" rx="2" fill="#C7A24A" fill-opacity="0.75"/><path d="M18 17v8" stroke="#0E0D0B" stroke-opacity="0.3"/><rect x="24" y="21" width="38" height="3.4" rx="1.7" fill="#0E0D0B" fill-opacity="0.3"/><path d="M26 28v6" stroke="#0E0D0B" stroke-opacity="0.25"/><rect x="32" y="31" width="46" height="3.4" rx="1.7" fill="#0E0D0B" fill-opacity="0.22"/><rect x="12" y="44" width="36" height="4" rx="2" fill="#C7A24A" fill-opacity="0.75"/><path d="M18 50v4" stroke="#0E0D0B" stroke-opacity="0.3"/><rect x="24" y="52" width="42" height="3.4" rx="1.7" fill="#0E0D0B" fill-opacity="0.25"/></svg>';
  }

  var TEMPLATES = [
    { key: 'doc', cls: 'doc', name: '纯文档', tag: '基础', icon: svgTplDoc, preview: previewTplDoc,
      desc: '从上到下文档流，适合文章、思考、日志。可输入文字、插入图片、嵌入链接。' },
    { key: 'dual', cls: 'dual', name: '双联阅读', tag: '研究', icon: svgTplBook, preview: previewTplBook,
      desc: '左侧写正文，右侧贴 PDF/代码/图片，适合读论文、做技术笔记。可联动引用。' },
    { key: 'canvas', cls: 'canvas', name: '无限画布', tag: '自由', icon: svgTplPalette, preview: previewTplCanvas,
      desc: '无限尺寸的画布，任意位置贴文本/PDF/代码/图片，可拖拽、缩放、连线。适合概念梳理、头脑风暴。' },
    { key: 'outline', cls: 'outline', name: '大纲树', tag: '结构', icon: svgTplTree, preview: previewTplOutline,
      desc: '以大纲树为骨架，每个节点可展开为详细内容。支持折叠/拖拽重排。适合结构化思考。' }
  ];

  function renderTemplate() {
    var box = $('[data-template-body]');
    if (!box) return;
    var cards = TEMPLATES.map(function (t) {
      return '<button class="nb-tpl-card nb-tpl-card--' + t.cls + '" type="button" data-action="pick-template" data-key="' + t.key + '">' +
        '<div class="nb-tpl-card__head">' +
        '<span class="nb-tpl-card__icon">' + t.icon() + '</span>' +
        '<h3 class="nb-tpl-card__name">' + escapeHtml(t.name) + '</h3>' +
        '<span class="nb-tpl-card__tag">' + escapeHtml(t.tag) + '</span>' +
        '</div>' +
        '<div class="nb-tpl-card__preview">' + t.preview() + '</div>' +
        '<p class="nb-tpl-card__desc">' + escapeHtml(t.desc) + '</p>' +
        '</button>';
    }).join('');
    box.innerHTML =
      '<div class="nb-template__suggest" data-template-suggest>' +
      '<div class="nb-template__suggest-row">' +
      '<span class="nb-template__suggest-icon">' + IC.spark() + '</span>' +
      '<div class="nb-template__suggest-text">根据你最近写了 3 篇技术笔记，我推荐<b>「双联阅读」</b>。要试试吗？</div>' +
      '</div>' +
      '<div class="nb-template__suggest-actions">' +
      '<button class="nb-btn nb-btn--primary nb-btn--sm" type="button" data-action="pick-template" data-key="dual">就用这个</button>' +
      '<button class="nb-btn nb-btn--ghost nb-btn--sm" type="button" data-action="dismiss-template-suggest">自己选</button>' +
      '</div>' +
      '</div>' +
      '<p class="nb-template__hint">知行的笔记是元素集合，不同模板适配不同场景。你可以随时切换。</p>' +
      '<div class="nb-template__list">' + cards + '</div>';
  }

  /* ----------------------------- 发现页（别人的工作流和 AI 配置） ----------------------------- */
  var DISCOVER_WORKFLOWS = [
    { id: 'dw1', name: '论文精读流水线', author: '学者·周', avatar: 'zhou', desc: 'arXiv 检索 → 结构化精读 → 要点卡片 → 归档', steps: 5, agents: 4, uses: 128 },
    { id: 'dw2', name: '竞品监控机器人', author: '产品·陈', avatar: 'sch', desc: '定时抓取竞品官网 → 变更检测 → 日报推送', steps: 4, agents: 3, uses: 86 },
    { id: 'dw3', name: '代码 Review 助手', author: '工程·李', avatar: 'chk', desc: 'PR 检出 → 静态分析 → 改进建议 → 评论回写', steps: 6, agents: 5, uses: 203 }
  ];
  var DISCOVER_AGENTS = [
    { id: 'da1', name: 'ArXiv 检索员', author: '学者·周', avatar: 'zhou', role: '学术检索', desc: '专注 arXiv 论文检索，支持语义搜索与引用追踪。', uses: 312 },
    { id: 'da2', name: '财报分析员', author: '分析师·王', avatar: 'sch', role: '金融分析', desc: '解析上市公司财报，生成结构化摘要与风险提示。', uses: 197 },
    { id: 'da3', name: 'SQL 生成器', author: '工程·李', avatar: 'chk', role: '数据查询', desc: '自然语言转 SQL，支持多方言与执行计划分析。', uses: 421 }
  ];

  function renderDiscover() {
    var root = $('[data-discover-root]');
    if (!root) return;

    var wfCards = DISCOVER_WORKFLOWS.map(function (w) {
      return '<article class="nb-dsc-card" data-action="dsc-pick-wf" data-id="' + w.id + '">' +
        '<div class="nb-dsc-card__head">' +
          '<span class="nb-dsc-card__av" style="background:' + discoverAvatarBg(w.avatar) + '">' + escapeHtml(w.author.charAt(0)) + '</span>' +
          '<div class="nb-dsc-card__info">' +
            '<div class="nb-dsc-card__name">' + escapeHtml(w.name) + '</div>' +
            '<div class="nb-dsc-card__author">by ' + escapeHtml(w.author) + '</div>' +
          '</div>' +
          '<span class="nb-dsc-card__uses">' + w.uses + ' 人在用</span>' +
        '</div>' +
        '<p class="nb-dsc-card__desc">' + escapeHtml(w.desc) + '</p>' +
        '<div class="nb-dsc-card__meta">' + w.steps + ' 步 · ' + w.agents + ' Agent</div>' +
      '</article>';
    }).join('');

    var agCards = DISCOVER_AGENTS.map(function (a) {
      return '<article class="nb-dsc-card nb-dsc-card--agent" data-action="dsc-pick-agent" data-id="' + a.id + '">' +
        '<div class="nb-dsc-card__head">' +
          '<span class="nb-dsc-card__av" style="background:' + discoverAvatarBg(a.avatar) + '">' + escapeHtml(a.name.charAt(0)) + '</span>' +
          '<div class="nb-dsc-card__info">' +
            '<div class="nb-dsc-card__name">' + escapeHtml(a.name) + '</div>' +
            '<div class="nb-dsc-card__role">' + escapeHtml(a.role) + '</div>' +
          '</div>' +
          '<span class="nb-dsc-card__uses">' + a.uses + ' 人在用</span>' +
        '</div>' +
        '<p class="nb-dsc-card__desc">' + escapeHtml(a.desc) + '</p>' +
        '<div class="nb-dsc-card__author">by ' + escapeHtml(a.author) + '</div>' +
      '</article>';
    }).join('');

    root.innerHTML =
      '<header class="nb-dsc-topbar">' +
        '<button class="nb-dsc-back" data-action="dsc-back" aria-label="返回">' + IC.back() + '</button>' +
        '<h2 class="nb-dsc-title">发现</h2>' +
        '<span class="nb-dsc-spacer"></span>' +
      '</header>' +
      '<div class="nb-dsc-scroll">' +
        '<section class="nb-dsc-section">' +
          '<h3 class="nb-dsc-section__h">热门工作流</h3>' +
          '<p class="nb-dsc-section__sub">别人搭好的流程，一键复用</p>' +
          '<div class="nb-dsc-list">' + wfCards + '</div>' +
        '</section>' +
        '<section class="nb-dsc-section">' +
          '<h3 class="nb-dsc-section__h">推荐 AI 配置</h3>' +
          '<p class="nb-dsc-section__sub">别人调好的智能体，直接引入</p>' +
          '<div class="nb-dsc-list">' + agCards + '</div>' +
        '</section>' +
      '</div>';
  }

  function discoverAvatarBg(id) {
    var m = { lin: 'linear-gradient(135deg,#C7A24A,#e8d091)', zhou: 'linear-gradient(135deg,#1D5B7A,#5a9bbd)', sch: 'linear-gradient(135deg,#2F855A,#68b786)', chk: 'linear-gradient(135deg,#C1272D,#e07175)' };
    return m[id] || m.lin;
  }

  /* ----------------------------- 自制小程序（对话 + 实时构建预览） ----------------------------- */
  var miniappState = {
    msgs: [],
    previewOpen: false,
    buildSteps: [],
    builtComponents: [],
    currentChatId: null,
    building: false
  };

  var MINIAPP_TEMPLATES = [
    {
      key: 'habit-tracker', name: '习惯打卡',
      keywords: ['习惯', '打卡', 'tracker', 'habit', '坚持'],
      steps: [
        { action: 'add', comp: '容器', desc: '创建主容器' },
        { action: 'add', comp: '标题栏', desc: '添加「我的习惯」标题' },
        { action: 'add', comp: '习惯卡片', desc: '添加习惯卡片 ×3' },
        { action: 'config', comp: '打卡按钮', desc: '配置点击交互' },
        { action: 'add', comp: '统计条', desc: '添加本周完成率' }
      ]
    },
    {
      key: 'reading-list', name: '读书清单',
      keywords: ['读书', '阅读', '书单', 'reading', '书'],
      steps: [
        { action: 'add', comp: '容器', desc: '创建主容器' },
        { action: 'add', comp: '标题栏', desc: '添加「我的书单」标题' },
        { action: 'add', comp: '书籍列表', desc: '添加书籍卡片 ×3' },
        { action: 'config', comp: '进度条', desc: '配置阅读进度' }
      ]
    },
    {
      key: 'pomodoro', name: '番茄专注钟',
      keywords: ['番茄', '专注', '计时', 'pomodoro', '钟'],
      steps: [
        { action: 'add', comp: '容器', desc: '创建主容器' },
        { action: 'add', comp: '计时器', desc: '添加 25:00 倒计时' },
        { action: 'config', comp: '开始按钮', desc: '配置计时交互' },
        { action: 'add', comp: '任务标签', desc: '添加当前任务显示' },
        { action: 'add', comp: '统计图', desc: '添加今日专注统计' }
      ]
    }
  ];

  var MOCK_MINIAPP_CHATS = {
    'mc-seed-1': [
      { role: 'ai', text: '你想做什么样的小程序？可以描述一个场景或功能…', time: '昨天 10:00' },
      { role: 'user', text: '做一个习惯打卡', time: '昨天 10:01' },
      { role: 'ai', text: '好的，我来帮你构建一个「习惯打卡」小程序。共 5 个组件，已保存到「我的小程序」。', time: '昨天 10:02' }
    ],
    'mc-seed-2': [
      { role: 'ai', text: '你想做什么样的小程序？可以描述一个场景或功能…', time: '3 天前 15:00' },
      { role: 'user', text: '读书清单', time: '3 天前 15:01' },
      { role: 'ai', text: '好的，我来帮你构建一个「读书清单」小程序。共 4 个组件，已保存到「我的小程序」。', time: '3 天前 15:02' }
    ]
  };

  function matchMiniappTemplate(text) {
    var lower = text.toLowerCase();
    for (var i = 0; i < MINIAPP_TEMPLATES.length; i++) {
      var t = MINIAPP_TEMPLATES[i];
      for (var j = 0; j < t.keywords.length; j++) {
        if (lower.indexOf(t.keywords[j].toLowerCase()) >= 0) return t;
      }
    }
    return MINIAPP_TEMPLATES[0];
  }

  function enterMiniappChat(params) {
    params = params || {};
    miniappState.building = false;
    miniappState.builtComponents = [];
    miniappState.buildSteps = [];
    miniappState.previewOpen = false;

    if (params.new) {
      miniappState.currentChatId = null;
      miniappState.msgs = [
        { role: 'ai', text: '你想做什么样的小程序？可以描述一个场景或功能，比如「习惯打卡」「读书清单」「番茄钟」…', time: nowHm() }
      ];
    } else if (params.chatId) {
      miniappState.currentChatId = params.chatId;
      var chat = findChatById(params.chatId);
      miniappState.msgs = MOCK_MINIAPP_CHATS[params.chatId] || [
        { role: 'ai', text: '这是你的「' + (chat ? chat.title : '小程序') + '」对话。', time: (chat ? chat.time : nowHm()) }
      ];
    }

    renderMiniappTop();
    renderMiniappMsgs();
    renderMiniappInput();
    renderMiniappPreview();
  }

  function renderMiniappTop() {
    var top = $('[data-mac-top]');
    if (!top) return;
    var label = miniappState.previewOpen ? '收起' : '拉开';
    top.innerHTML =
      '<button class="nb-mac__back" data-action="miniapp-back" aria-label="返回">' + IC.back() + '</button>' +
      '<div class="nb-mac__title">' +
        '<span class="nb-mac__title-text">自制小程序</span>' +
        '<span class="nb-mac__title-sub">' + (miniappState.building ? '构建中…' : (miniappState.builtComponents.length ? '已构建' : 'AI 引导')) + '</span>' +
      '</div>' +
      '<button class="nb-mac__toggle' + (miniappState.previewOpen ? ' is-open' : '') + '" data-action="toggle-miniapp-preview" aria-label="' + label + '预览">' +
        '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M15 3v18"/></svg>' +
        '<span>' + label + '</span>' +
      '</button>';
  }

  function renderMiniappMsgs() {
    var box = $('[data-mac-msgs]');
    if (!box) return;
    box.innerHTML = miniappState.msgs.map(function (m) {
      var isAi = m.role === 'ai';
      return '<div class="nb-msg nb-msg--' + m.role + '">' +
        '<span class="nb-msg__ava">' + (isAi ? '林' : '我') + '</span>' +
        '<div><div class="nb-msg__bubble">' + escapeHtml(m.text) + '</div>' +
        '<p class="nb-msg__time">' + escapeHtml(m.time || '') + '</p></div>' +
      '</div>';
    }).join('');
    box.scrollTop = box.scrollHeight;
  }

  function renderMiniappInput() {
    var row = $('[data-mac-input-row]');
    if (!row) return;
    /* 复用主对话输入栏组件（nb-chat__），保持视觉与交互一致性 */
    row.className = 'nb-chat__input-row is-composing';
    row.setAttribute('data-mac-input-row', '');
    row.innerHTML =
      '<div class="nb-chat__input-wrap">' +
        '<textarea class="nb-chat__input" data-mac-input rows="1" placeholder="描述你想做的小程序…"></textarea>' +
      '</div>' +
      '<button class="nb-chat__send" data-action="miniapp-send" aria-label="发送">' + IC.send() + '</button>';
    var input = $('[data-mac-input]');
    if (input) {
      input.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMiniappMsg(); }
      });
      /* focus 弹出模拟键盘；blur 延迟收起 */
      input.addEventListener('focus', showMacKeyboard);
      input.addEventListener('blur', function () {
        window.setTimeout(hideMacKeyboard, 150);
      });
      /* input 事件更新发送按钮状态 */
      input.addEventListener('input', updateMacSendState);
    }
    /* 键盘按键 → 输入框插字 + 更新发送状态 */
    bindChatKeyboard(macKeyboard(), input, $('[data-action="miniapp-send"]'), updateMacSendState);
    updateMacSendState();
  }

  function renderMiniappPreview() {
    var preview = $('[data-mac-preview]');
    if (!preview) return;
    preview.hidden = !miniappState.previewOpen;
    if (!miniappState.previewOpen) return;

    var total = miniappState.buildSteps.length;
    var done = miniappState.builtComponents.length;
    var pct = total ? Math.round((done / total) * 100) : 0;

    var head = $('[data-mac-preview-head]');
    if (head) {
      head.innerHTML =
        '<div class="nb-mac__preview-title">' + IC.spark() + '<span>构建预览</span></div>' +
        '<div class="nb-mac__progress"><div class="nb-mac__progress-bar" style="width:' + pct + '%"></div></div>' +
        '<span class="nb-mac__progress-text">' + done + '/' + total + ' 步</span>';
    }

    var canvas = $('[data-mac-preview-canvas]');
    if (canvas) {
      if (!done) {
        canvas.innerHTML = '<div class="nb-mac__canvas-empty">' + IC.spark() + '<p>等待构建…</p></div>';
      } else {
        canvas.innerHTML = miniappState.builtComponents.map(function (c) {
          return '<div class="nb-mac__comp-item">' +
            '<span class="nb-mac__comp-icon">' + (c.action === 'config' ? '⚙️' : '🧩') + '</span>' +
            '<div class="nb-mac__comp-info">' +
              '<span class="nb-mac__comp-name">' + escapeHtml(c.comp) + '</span>' +
              '<span class="nb-mac__comp-desc">' + escapeHtml(c.desc) + '</span>' +
            '</div>' +
            '<span class="nb-mac__comp-status">✓</span>' +
          '</div>';
        }).join('');
      }
    }

    var log = $('[data-mac-preview-log]');
    if (log) {
      var html = miniappState.builtComponents.map(function (c) {
        return '<div class="nb-mac__log-line">✓ ' + escapeHtml(c.desc) + '</div>';
      }).join('');
      if (miniappState.building) html += '<div class="nb-mac__log-line is-active">→ 正在构建…</div>';
      log.innerHTML = html || '<div class="nb-mac__log-empty">暂无构建日志</div>';
      log.scrollTop = log.scrollHeight;
    }
  }

  function toggleMiniappPreview() {
    miniappState.previewOpen = !miniappState.previewOpen;
    renderMiniappTop();
    renderMiniappPreview();
    var chatEl = $('.nb-mac__chat');
    if (chatEl) chatEl.classList.toggle('is-narrow', miniappState.previewOpen);
    var pv = $('[data-mac-preview]');
    if (pv) pv.classList.toggle('is-open', miniappState.previewOpen);
  }

  function sendMiniappMsg() {
    var input = $('[data-mac-input]');
    if (!input || miniappState.building) return;
    var text = input.value.trim();
    if (!text) return;
    miniappState.msgs.push({ role: 'user', text: text, time: nowHm() });
    input.value = '';
    onInputScrollHeight(input);
    updateMacSendState();
    renderMiniappMsgs();

    var template = matchMiniappTemplate(text);
    var reply = '好的，我来帮你构建一个「' + template.name + '」小程序。我会逐步添加组件，你可以在右侧预览中看到构建过程。';

    if (!miniappState.previewOpen) toggleMiniappPreview();

    setTimeout(function () {
      miniappState.msgs.push({ role: 'ai', text: reply, time: nowHm() });
      renderMiniappMsgs();
      runMiniappBuild(template);
    }, 600);
  }

  function runMiniappBuild(template) {
    miniappState.buildSteps = template.steps.slice();
    miniappState.builtComponents = [];
    miniappState.building = true;
    renderMiniappTop();
    renderMiniappPreview();

    var idx = 0;
    function next() {
      if (idx >= miniappState.buildSteps.length) {
        miniappState.building = false;
        miniappState.msgs.push({
          role: 'ai',
          text: '「' + template.name + '」构建完成！共 ' + template.steps.length + ' 个组件。已保存到「我的小程序」分区。',
          time: nowHm()
        });
        renderMiniappTop();
        renderMiniappMsgs();
        renderMiniappPreview();
        archiveMiniappChat(template);
        return;
      }
      miniappState.builtComponents.push(miniappState.buildSteps[idx]);
      idx++;
      renderMiniappPreview();
      setTimeout(next, 600);
    }
    setTimeout(next, 300);
  }

  function archiveMiniappChat(template) {
    if (miniappState.currentChatId) return;
    var cid = 'mc-' + Date.now();
    miniappState.currentChatId = cid;
    MOCK_CHAT_LIST.unshift({
      id: cid,
      title: template.name + '小程序',
      preview: '林：已构建完成，包含 ' + template.steps.length + ' 个组件…',
      time: '刚刚',
      tags: ['小程序', template.name],
      kind: 'miniapp'
    });
    MOCK_MINIAPP_CHATS[cid] = miniappState.msgs.slice();
  }

  /* ----------------------------- AI 市场（类 GitHub 的 AI 资源市场） ----------------------------- */
  /* 市场独立状态（从 square.js 迁移而来） */
  var marketState = {
    cat: 'all',
    kw: '',
    searchOpen: false,
    initialized: false,
    detailId: null,
    introduced: {},
    releasesExpanded: {}
  };

  /* 市场专用图标（notebook.js IC 不带 size 参数，这里独立维护） */
  var mktIC = {
    back: function (n) { return zicon('arrow-left', n || 22); },
    search: function (n) { return zicon('search', n || 22); },
    like: function (n) { return zicon('like', n || 16); },
    comment: function (n) { return zicon('comment', n || 16); },
    share: function (n) { return zicon('share', n || 16); },
    flame: function (n) { return svg('<path d="M12 3c.5 3-2 4.5-2 7a2 2 0 0 0 4 0c0-.8-.3-1.4-.5-2 2 1.5 3.5 3.8 3.5 6.5a5 5 0 0 1-10 0c0-3.5 3-5.5 3-9 0-1 .8-2 2-2.5z"/>', n); },
    at: function (n) { return svg('<circle cx="12" cy="12" r="4"/><path d="M16 8v5a3 3 0 0 0 6 0v-1a10 10 0 1 0-4 8"/>', n); },
    graph: function (n) { return zicon('graph', n || 18); },
    book: function (n) { return svg('<path d="M4 19.5V5a2 2 0 0 1 2-2h14v18H6a2 2 0 0 1-2-1.5z"/><path d="M8 7h8M8 11h6"/>', n); },
    grid: function (n) { return svg('<rect x="3" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="3" width="7.5" height="7.5" rx="1.6"/><rect x="3" y="13.5" width="7.5" height="7.5" rx="1.6"/><rect x="13.5" y="13.5" width="7.5" height="7.5" rx="1.6"/>', n); },
    list: function (n) { return svg('<path d="M8 6h13M8 12h13M8 18h13"/><circle cx="3.5" cy="6" r="1.5"/><circle cx="3.5" cy="12" r="1.5"/><circle cx="3.5" cy="18" r="1.5"/>', n); },
    tag: function (n) { return svg('<path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><circle cx="7" cy="7" r="1.5" fill="currentColor"/>', n); },
    swap: function (n) { return svg('<path d="M7 4L3 8l4 4"/><path d="M3 8h14"/><path d="M17 20l4-4-4-4"/><path d="M21 16H7"/>', n); },
    caret: function (n) { return svg('<path d="M9 6l6 6-6 6"/>', n || 13); }
  };

  var MARKET_CATS = [
    { key: 'all',    label: '全部' },
    { key: 'agent',  label: '智能体' },
    { key: 'flow',   label: '工作流' },
    { key: 'design', label: '设计/模板' },
    { key: 'skill',  label: '技能包' },
    { key: 'miniapp', label: '小程序' }
  ];
  var MARKET_CAT_TAG = { agent: '智能体', flow: '工作流', design: '设计', skill: '技能', miniapp: '小程序' };
  var MARKET_CAT_TAG_CLS = { agent: 'sq-market__card-tag--agent', flow: 'sq-market__card-tag--flow', design: 'sq-market__card-tag--design', skill: 'sq-market__card-tag--skill', miniapp: 'sq-market__card-tag--miniapp' };

  var MARKET_ITEMS = [
    /* 智能体 */
    { id: 'mk1',  type: 'agent',  name: 'ArXiv 检索员',   author: '学者·周', desc: '专注 arXiv 论文检索，支持语义搜索与引用追踪，可挂载到任意工作流。', uses: 312, icon: 'Ar', bg: '#1D5B7A' },
    { id: 'mk2',  type: 'agent',  name: '财报分析员',     author: '分析师·王', desc: '解析上市公司财报，生成结构化摘要与风险提示，支持多期对比。', uses: 197, icon: '财', bg: '#2F855A' },
    { id: 'mk3',  type: 'agent',  name: 'SQL 生成器',     author: '工程·李', desc: '自然语言转 SQL，支持多方言与执行计划分析，附自动纠错。', uses: 421, icon: 'SQ', bg: '#C1272D' },
    { id: 'mk4',  type: 'agent',  name: '法律文书助手',   author: '律师·陈', desc: '起草合同/律师函，内置常见条款库与风险点检查清单。', uses: 156, icon: '法', bg: '#C7A24A' },
    { id: 'mk5',  type: 'agent',  name: '翻译审校员',     author: '译者的林', desc: '中英互译 + 信达雅审校，保留术语一致性，支持领域词典。', uses: 268, icon: '译', bg: '#1D5B7A' },
    /* 工作流 */
    { id: 'mk6',  type: 'flow',   name: '论文精读流水线', author: '学者·周', desc: 'arXiv 检索 → 结构化精读 → 要点卡片 → 归档，5 步 4 Agent。', uses: 128, icon: '论', bg: '#C1272D' },
    { id: 'mk7',  type: 'flow',   name: '竞品监控机器人', author: '产品·陈', desc: '定时抓取竞品官网 → 变更检测 → 日报推送，4 步 3 Agent。', uses: 86,  icon: '竞', bg: '#2F855A' },
    { id: 'mk8',  type: 'flow',   name: '代码 Review 助手', author: '工程·李', desc: 'PR 检出 → 静态分析 → 改进建议 → 评论回写，6 步 5 Agent。', uses: 203, icon: 'CR', bg: '#1D5B7A' },
    { id: 'mk9',  type: 'flow',   name: '周报自动生成',   author: '运营·赵', desc: '收集本周 PR/Issue → 分类归纳 → 生成周报草稿，3 步 2 Agent。', uses: 174, icon: '周', bg: '#C7A24A' },
    /* 设计/模板 */
    { id: 'mk10', type: 'design', name: '极简笔记模板',   author: '设计·林', desc: '适合知识沉淀的极简布局，含标题/正文/标签区，支持暗色适配。', uses: 256, icon: '简', bg: '#C7A24A' },
    { id: 'mk11', type: 'design', name: '复盘卡片组件',   author: '设计·林', desc: '四象限复盘卡片：继续/停止/开始/尝试，含拖拽排序。', uses: 142, icon: '复', bg: '#2F855A' },
    { id: 'mk12', type: 'design', name: '发布排版套件',   author: '运营·赵', desc: '6 套发布排版预设：学术/产品/随笔/数据/访谈/清单。', uses: 98,  icon: '排', bg: '#C1272D' },
    { id: 'mk13', type: 'design', name: '数据看板布局',   author: '工程·李', desc: '响应式数据看板：指标卡 + 趋势图 + 明细表，含暗色模式。', uses: 115, icon: '板', bg: '#1D5B7A' },
    /* 技能包 */
    { id: 'mk14', type: 'skill',  name: '论文检索技能',   author: '学者·周', desc: '可挂载到任意 Agent 的 arXiv 检索能力模块，含引用格式化。', uses: 89,  icon: '检', bg: '#2F855A' },
    { id: 'mk15', type: 'skill',  name: '图表生成技能',   author: '工程·李', desc: '从表格数据生成柱状/折线/饼图，支持 ECharts 配置导出。', uses: 167, icon: '图', bg: '#C1272D' },
    { id: 'mk16', type: 'skill',  name: '摘要提取技能',   author: '译者的林', desc: '长文 → 300 字摘要，支持抽取式与生成式两种模式。', uses: 234, icon: '摘', bg: '#C7A24A' },
    { id: 'mk17', type: 'skill',  name: '敏感词检测技能', author: '律师·陈', desc: '文本合规检测，内置通用词库 + 可扩展行业词库。', uses: 76,  icon: '敏', bg: '#1D5B7A' },
    /* 小程序 */
    { id: 'mk18', type: 'miniapp', name: '每日复盘',   author: '设计·林', desc: '四象限复盘小程序：继续/停止/开始/尝试，支持每日打卡与周报。', uses: 312, icon: '复', bg: '#C7A24A' },
    { id: 'mk19', type: 'miniapp', name: '专注番茄钟', author: '工程·李', desc: '25 分钟专注 + 5 分钟休息，含任务绑定与统计图表。', uses: 456, icon: '番', bg: '#C1272D' },
    { id: 'mk20', type: 'miniapp', name: '阅读清单',   author: '学者·周', desc: '管理阅读进度，自动提取笔记卡片，支持分类与标签。', uses: 198, icon: '读', bg: '#1D5B7A' },
    { id: 'mk21', type: 'miniapp', name: '记账本',     author: '运营·赵', desc: '极简记账，自动分类 + 月度报表，支持预算提醒。', uses: 267, icon: '账', bg: '#2F855A' }
  ];

  /* 场景化推荐：按使用场景分组，叙事感更强 */
  var MARKET_SCENES = [
    { title: '学术研究必备', sub: '从检索到精读，一站搞定', icon: '学', color: '#1D5B7A', items: ['mk1', 'mk6', 'mk14', 'mk16'] },
    { title: '内容创作利器', sub: '翻译 · 排版 · 小程序，提效 3 倍', icon: '创', color: '#C7A24A', items: ['mk5', 'mk12', 'mk18', 'mk10'] },
    { title: '开发提效工具', sub: 'SQL · Review · 图表，工程化提速', icon: '工', color: '#C1272D', items: ['mk3', 'mk8', 'mk13', 'mk15'] }
  ];

  /* Hero 精选：主推 + 两个副推 */
  var MARKET_HERO = { main: 'mk6', sub1: 'mk3', sub2: 'mk16' };

  /* 颜色加深：用于 Hero 渐变背景 */
  function shadeColor(hex, percent) {
    var f = parseInt(hex.slice(1), 16);
    var t = percent < 0 ? 0 : 255;
    var p = Math.abs(percent) / 100;
    var R = f >> 16, G = (f >> 8) & 0xFF, B = f & 0xFF;
    R = Math.round((t - R) * p) + R;
    G = Math.round((t - G) * p) + G;
    B = Math.round((t - B) * p) + B;
    return '#' + (0x1000000 + (R << 16) + (G << 8) + B).toString(16).slice(1);
  }

  function marketItemById(id) {
    for (var i = 0; i < MARKET_ITEMS.length; i++) {
      if (MARKET_ITEMS[i].id === id) return MARKET_ITEMS[i];
    }
    return null;
  }

  /* ===== 资源详情数据（GitHub 风格：版本演进 / 作者寄语 / 使用步骤 / 评论） ===== */
  var MARKET_DETAIL = {
    mk6: {
      version: 'v2.1.0', updatedAt: '2026-06-15',
      authorNote: '这个工作流源于我自己的论文阅读痛点——每天 arXiv 刷不完，读了就忘。于是把检索、精读、卡片化、归档串成一条流水线，交给 4 个 Agent 协作。现在 5 分钟就能消化一篇论文。',
      changelog: [
        { version: 'v2.1.0', date: '2026-06-15', notes: ['新增 arXiv 全文检索（关键词 + ID）', '摘要卡片排版优化，支持导出图片'] },
        { version: 'v2.0.0', date: '2026-05-20', notes: ['重构为 4 Agent 协作架构', '支持 PDF 直传', '新增归档到笔记本'] },
        { version: 'v1.0.0', date: '2026-03-10', notes: ['初始版本：单 Agent 精读'] }
      ],
      steps: ['在输入框粘贴 arXiv 论文链接或关键词', 'ArXiv 检索员自动抓取论文全文', '精读 Agent 生成结构化摘要（背景/方法/结果/局限）', '要点卡片 Agent 输出可分享的知识卡片', '归档 Agent 自动存入你的笔记本'],
      tags: ['学术', '论文', '自动化'],
      flowConfig: {
        nodes: [
          { name: 'ArXiv 检索员', role: '抓取论文全文', agent: 'mk1', icon: '检' },
          { name: '精读 Agent', role: '结构化摘要', agent: '自建', icon: '读' },
          { name: '卡片 Agent', role: '生成知识卡片', agent: '自建', icon: '卡' },
          { name: '归档 Agent', role: '存入笔记本', agent: '自建', icon: '档' }
        ],
        inputs: 'arXiv 论文链接 / 关键词', outputs: '结构化摘要 + 知识卡片 + 归档笔记', duration: '约 5 分钟/篇'
      },
      comments: [
        { user: '研究员·李', avatar: '李', text: '效率提升明显，5 分钟读完一篇论文，卡片可以直接分享给组会。', likes: 24, time: '2 天前' },
        { user: '博士生·王', avatar: '王', text: '希望支持中文论文检索，目前只支持 arXiv。', likes: 8, time: '5 天前' }
      ]
    },
    mk3: {
      version: 'v1.8.2', updatedAt: '2026-06-10',
      authorNote: '写 SQL 是体力活。这个 Agent 能听懂自然语言，直接生成可执行的 SQL，还附带解释。支持 MySQL / PostgreSQL / SQLite。',
      changelog: [
        { version: 'v1.8.2', date: '2026-06-10', notes: ['修复多表 JOIN 字段歧义问题', '新增 EXPLAIN 结果解读'] },
        { version: 'v1.8.0', date: '2026-05-28', notes: ['支持 PostgreSQL 窗口函数', 'SQL 格式化输出'] },
        { version: 'v1.0.0', date: '2026-02-15', notes: ['初始版本：MySQL 单表查询'] }
      ],
      steps: ['选择数据库类型（MySQL / PostgreSQL / SQLite）', '用自然语言描述你要查什么', 'Agent 生成 SQL 并附带逐行解释', '点击执行（需连接数据库）或复制 SQL'],
      tags: ['开发', '数据库', 'SQL'],
      agentConfig: {
        model: 'GPT-4o', temperature: 0.2, contextWindow: '128K',
        capabilities: ['自然语言理解', 'SQL 生成', '多方言支持', '执行计划分析', '自动纠错'],
        inputs: '自然语言描述 + 数据库 schema', outputs: '可执行 SQL + 逐行解释 + EXPLAIN 解读',
        integration: '可独立对话调用，或作为工作流节点挂载'
      },
      comments: [
        { user: '后端·张', avatar: '张', text: '复杂查询也能搞定，省了翻文档的时间。', likes: 31, time: '1 天前' },
        { user: '数据·陈', avatar: '陈', text: 'EXPLAIN 解读很实用，新手友好。', likes: 12, time: '3 天前' }
      ]
    },
    mk16: {
      version: 'v1.4.0', updatedAt: '2026-06-12',
      authorNote: '长文阅读的痛点不是读不懂，而是读完就忘。这个技能把任意长文压缩成 300 字摘要，保留核心论点和关键数据。可以独立使用，也可以串联到工作流里。',
      changelog: [
        { version: 'v1.4.0', date: '2026-06-12', notes: ['支持中英混排长文', '摘要可自定义长度（100/300/500 字）'] },
        { version: 'v1.2.0', date: '2026-05-15', notes: ['新增关键句高亮标注'] },
        { version: 'v1.0.0', date: '2026-03-20', notes: ['初始版本'] }
      ],
      steps: ['引入技能到工作区', '在对话中粘贴或上传长文', 'Agent 自动提取核心论点和关键数据', '生成 300 字结构化摘要'],
      tags: ['技能', '摘要', '阅读'],
      skillConfig: {
        inputs: '长文本（中英混排）/ 链接 / 文件', outputs: '300 字结构化摘要 + 关键句高亮',
        scenarios: ['长文阅读', '快速概览', '内容筛选', '审稿辅助'],
        mount: '挂载到任意 Agent 作为工具调用，或在工作流中作为节点'
      },
      comments: [{ user: '编辑·刘', avatar: '刘', text: '审稿利器，10 万字的稿件 30 秒出摘要。', likes: 18, time: '4 天前' }]
    },
    mk1: {
      version: 'v2.3.1', updatedAt: '2026-06-14',
      authorNote: 'arXiv 每天新增上千篇论文，手动检索效率太低。这个 Agent 支持关键词、作者、时间范围多维检索，还能按相关度排序，自动去重。',
      changelog: [
        { version: 'v2.3.1', date: '2026-06-14', notes: ['修复分页加载时的重复问题'] },
        { version: 'v2.3.0', date: '2026-06-01', notes: ['新增按引用量排序', '支持作者维度检索'] },
        { version: 'v2.0.0', date: '2026-04-10', notes: ['重构检索引擎，响应速度提升 5 倍'] }
      ],
      steps: ['输入关键词、作者或 arXiv ID', '设置时间范围和排序方式', 'Agent 返回匹配论文列表', '点击论文查看详情或直接精读'],
      tags: ['学术', '检索', 'arXiv'],
      agentConfig: {
        model: 'Claude 3.5 Sonnet', temperature: 0.3, contextWindow: '200K',
        capabilities: ['关键词检索', '作者检索', '引用量排序', '自动去重', '相关度排序'],
        inputs: '关键词 / 作者 / arXiv ID + 时间范围', outputs: '论文列表（含标题、摘要、作者、引用量）',
        integration: '可独立对话调用，或挂载到论文精读工作流'
      },
      comments: [
        { user: '博士·赵', avatar: '赵', text: '按引用量排序太实用了，直接找到领域高引论文。', likes: 22, time: '1 天前' },
        { user: '教授·孙', avatar: '孙', text: '希望能支持 Semantic Scholar 的数据源。', likes: 6, time: '6 天前' }
      ]
    },
    mk8: {
      version: 'v1.5.0', updatedAt: '2026-06-08',
      authorNote: 'Code Review 占了团队大量时间。这个 Agent 能自动分析 PR 的改动，找出潜在 bug、风格问题、安全风险，并给出修改建议。支持 Git diff 格式输入。',
      changelog: [
        { version: 'v1.5.0', date: '2026-06-08', notes: ['新增安全漏洞检测（OWASP Top 10）', '支持多语言（JS/TS/Python/Go/Java）'] },
        { version: 'v1.2.0', date: '2026-05-10', notes: ['新增修改建议代码块', '支持 PR 级别整体评价'] },
        { version: 'v1.0.0', date: '2026-03-01', notes: ['初始版本：JS/TS 单文件 Review'] }
      ],
      steps: ['粘贴 Git diff 或上传 PR 链接', 'Agent 分析改动内容', '输出潜在问题列表（bug/风格/安全）', '点击问题查看详细建议和修改示例'],
      tags: ['开发', 'Code Review', '安全'],
      flowConfig: {
        nodes: [
          { name: 'PR 检出 Agent', role: '获取 PR 改动', agent: '自建', icon: '检' },
          { name: '静态分析 Agent', role: '检测 bug 和风格', agent: '自建', icon: '析' },
          { name: '安全检测 Agent', role: 'OWASP Top 10', agent: '自建', icon: '安' },
          { name: '建议生成 Agent', role: '生成修改建议', agent: '自建', icon: '议' },
          { name: '评论回写 Agent', role: '回写 PR 评论', agent: '自建', icon: '写' }
        ],
        inputs: 'Git diff / PR 链接', outputs: '问题列表 + 修改建议 + PR 评论', duration: '约 30 秒/PR'
      },
      comments: [
        { user: '前端·周', avatar: '周', text: '安全检测很到位，发现了一个 XSS 漏洞。', likes: 28, time: '2 天前' },
        { user: '运维·吴', avatar: '吴', text: 'Go 语言支持还需要加强，有些误报。', likes: 5, time: '1 周前' }
      ]
    },
    mk2: {
      version: 'v2.0.3', updatedAt: '2026-06-05',
      authorNote: '财报分析需要跨多个数据源，手动整理太慢。这个 Agent 能自动抓取财报数据，生成结构化分析报告，包括营收、利润、现金流、同比环比等关键指标。',
      changelog: [
        { version: 'v2.0.3', date: '2026-06-05', notes: ['新增现金流分析模块', '修复港股财报格式兼容问题'] },
        { version: 'v2.0.0', date: '2026-05-12', notes: ['支持 A 股 / 港股 / 美股', '新增行业对比功能'] },
        { version: 'v1.0.0', date: '2026-02-20', notes: ['初始版本：A 股财报分析'] }
      ],
      steps: ['输入股票代码或公司名称', '选择财报类型（季报/半年报/年报）', 'Agent 抓取并结构化财报数据', '生成分析报告（含图表）'],
      tags: ['金融', '财报', '分析'],
      agentConfig: {
        model: 'GPT-4o', temperature: 0.1, contextWindow: '128K',
        capabilities: ['财报数据抓取', '结构化分析', '多期对比', '行业对比', '图表生成'],
        inputs: '股票代码 / 公司名称 + 财报类型', outputs: '分析报告（含营收/利润/现金流/同比环比图表）',
        integration: '可独立对话调用，或定时调度生成报告'
      },
      comments: [{ user: '分析师·钱', avatar: '钱', text: '行业对比功能很实用，一键看竞品数据。', likes: 19, time: '3 天前' }]
    }
  };

  /* 获取资源详情：有自定义数据用自定义，否则用通用模板 */
  function getMarketDetail(id) {
    var item = marketItemById(id);
    if (!item) return null;
    var detail = MARKET_DETAIL[id];
    if (detail) return detail;
    var typeConfig = {};
    var typeName = MARKET_CAT_TAG[item.type] || '工具';
    var typeSteps = [];
    if (item.type === 'agent') {
      typeConfig.agentConfig = {
        model: 'GPT-4o', temperature: 0.3, contextWindow: '128K',
        capabilities: ['自然语言理解', '结构化输出', '多轮对话'],
        inputs: '自然语言描述', outputs: '结构化结果',
        integration: '可独立对话调用，或作为工作流节点挂载'
      };
      typeSteps = ['点击「引入到工作区」将智能体添加到你的工作区', '在对话窗口中用自然语言描述你的需求', '智能体根据配置的模型和能力生成响应', '查看输出结果，可继续多轮对话细化需求'];
    } else if (item.type === 'skill') {
      typeConfig.skillConfig = {
        inputs: '文本 / 链接 / 文件', outputs: '结构化数据',
        scenarios: ['日常使用', '批量处理'], mount: '挂载到任意 Agent 作为工具调用'
      };
      typeSteps = ['引入技能到工作区', '在任意 Agent 对话中调用此技能', '提供技能所需的输入（文本/链接/文件）', '获取技能处理后的结构化结果'];
    } else if (item.type === 'design') {
      typeConfig.designConfig = {
        palette: ['#1D5B7A', '#C7A24A', '#C1272D', '#2F855A'],
        components: ['标题区', '正文区', '元信息区'],
        scenarios: ['知识沉淀', '日常记录'], layout: '单栏纵向布局'
      };
      typeSteps = ['引入设计模板到工作区', '在笔记本中选择此模板创建新笔记', '按模板结构填充标题、正文、元信息', '发布或归档完成的笔记'];
    } else if (item.type === 'flow') {
      typeConfig.flowConfig = {
        nodes: [
          { name: '输入 Agent', role: '接收输入', agent: '自建', icon: '入' },
          { name: '处理 Agent', role: '核心处理', agent: '自建', icon: '处' },
          { name: '输出 Agent', role: '生成结果', agent: '自建', icon: '出' }
        ],
        inputs: '用户输入', outputs: '处理结果', duration: '约 1 分钟'
      };
      typeSteps = ['引入工作流到工作区', '在工作区中启动此工作流', '按提示提供所需的输入参数', '等待各节点 Agent 依次执行完成', '查看最终输出结果并归档'];
    }
    return Object.assign({
      version: 'v1.0.0', updatedAt: '2026-06-01',
      authorNote: '这个「' + item.name + '」是我在日常工作中反复打磨的' + typeName + '，希望也能帮到你。如果有建议或问题，欢迎在评论区留言。',
      changelog: [{ version: 'v1.0.0', date: '2026-06-01', notes: ['初始版本发布'] }],
      steps: typeSteps.length ? typeSteps : ['引入到工作区', '在对话中调用「' + item.name + '」', '根据提示提供所需输入', '获取输出结果'],
      tags: [typeName], comments: []
    }, typeConfig);
  }

  /* 查找相似资源：同类型，排除自身，按使用数降序取前 4 */
  function findSimilarItems(id, type) {
    return MARKET_ITEMS
      .filter(function (it) { return it.id !== id && it.type === type; })
      .sort(function (a, b) { return (b.uses || 0) - (a.uses || 0); })
      .slice(0, 4);
  }

  function marketFilterItems() {
    var cat = marketState.cat;
    var kw = marketState.kw.trim().toLowerCase();
    return MARKET_ITEMS.filter(function (it) {
      if (cat !== 'all' && it.type !== cat) return false;
      if (kw) {
        var hay = (it.name + ' ' + it.author + ' ' + it.desc + ' ' + (MARKET_CAT_TAG[it.type] || '')).toLowerCase();
        if (hay.indexOf(kw) === -1) return false;
      }
      return true;
    });
  }

  function renderMarketTop() {
    var top = $('[data-sq-market-top]');
    if (!top) return;
    if (marketState.searchOpen) {
      top.innerHTML =
        '<button class="sq-market__search-cancel" data-action="close-market-search">取消</button>' +
        '<div class="sq-market__search-inner">' +
          mktIC.search(16) +
          '<input class="sq-market__search-input" data-sq-market-input type="text" placeholder="搜索 AI 插件、工作流、模板…" autocomplete="off">' +
        '</div>';
      var input = $('[data-sq-market-input]', top);
      if (input) {
        input.value = marketState.kw;
        setTimeout(function () { input.focus(); }, 100);
      }
    } else {
      top.innerHTML =
        '<button class="sq-iconbtn" data-action="market-back" aria-label="返回">' + mktIC.back(22) + '</button>' +
        '<h1 class="sq-market__title">市场</h1>' +
        '<button class="sq-iconbtn" data-action="toggle-market-search" aria-label="搜索">' + mktIC.search(22) + '</button>';
    }
  }

  /* 渲染单张市场卡片（列表用，紧凑型） */
  function renderMarketCard(it) {
    var tagCls = MARKET_CAT_TAG_CLS[it.type] || '';
    var tagLabel = MARKET_CAT_TAG[it.type] || '';
    var introduced = !!marketState.introduced[it.id];
    return '<article class="sq-market__card' + (introduced ? ' is-introduced' : '') + '" data-action="market-pick" data-id="' + it.id + '">' +
      '<span class="sq-market__card-icon" style="background:' + it.bg + '">' + escapeHtml(it.icon) + '</span>' +
      '<div class="sq-market__card-body">' +
        '<div class="sq-market__card-head">' +
          '<span class="sq-market__card-name">' + escapeHtml(it.name) + '</span>' +
          '<span class="sq-market__card-tag ' + tagCls + '">' + escapeHtml(tagLabel) + '</span>' +
        '</div>' +
        '<p class="sq-market__card-desc">' + escapeHtml(it.desc) + '</p>' +
        '<div class="sq-market__card-meta">' +
          '<span>by ' + escapeHtml(it.author) + '</span>' +
          '<span class="sq-market__card-uses">' + mktIC.flame(11) + it.uses + ' 人在用</span>' +
          (introduced ? '<span class="sq-market__card-introduced">已引入</span>' : '') +
        '</div>' +
      '</div>' +
    '</article>';
  }

  function renderMarket() {
    var scroll = $('[data-sq-market-scroll]');
    if (!scroll) return;
    if (marketState.searchOpen) {
      if (marketState.kw) { renderMarketSearchResults(scroll); }
      else { renderMarketRankOnly(scroll); }
      return;
    }
    if (marketState.cat !== 'all') { renderMarketCategoryList(scroll); return; }

    /* 1. Hero 精选区 */
    var heroMain = marketItemById(MARKET_HERO.main);
    var heroSub1 = marketItemById(MARKET_HERO.sub1);
    var heroSub2 = marketItemById(MARKET_HERO.sub2);
    var heroHtml = '';
    if (heroMain) {
      var mainGrad = 'linear-gradient(135deg, ' + heroMain.bg + ', ' + shadeColor(heroMain.bg, -28) + ')';
      heroHtml =
        '<section class="sq-market__hero">' +
          '<article class="sq-market__hero-main" data-action="market-pick" data-id="' + heroMain.id + '">' +
            '<div class="sq-market__hero-main-bg" style="background:' + mainGrad + '"></div>' +
            '<div class="sq-market__hero-main-content">' +
              '<span class="sq-market__hero-badge">精选</span>' +
              '<div class="sq-market__hero-main-head">' +
                '<span class="sq-market__hero-main-icon">' + escapeHtml(heroMain.icon) + '</span>' +
                '<div class="sq-market__hero-main-info">' +
                  '<h2 class="sq-market__hero-main-name">' + escapeHtml(heroMain.name) + '</h2>' +
                  '<p class="sq-market__hero-main-desc">' + escapeHtml(heroMain.desc) + '</p>' +
                '</div>' +
              '</div>' +
              '<div class="sq-market__hero-main-foot">' +
                '<span class="sq-market__hero-main-author">by ' + escapeHtml(heroMain.author) + '</span>' +
                '<span class="sq-market__hero-main-uses">' + mktIC.flame(11) + heroMain.uses + ' 人在用</span>' +
              '</div>' +
            '</div>' +
          '</article>';
      if (heroSub1 && heroSub2) {
        heroHtml +=
          '<div class="sq-market__hero-sub">' +
            '<article class="sq-market__hero-card" data-action="market-pick" data-id="' + heroSub1.id + '">' +
              '<span class="sq-market__hero-card-icon" style="background:' + heroSub1.bg + '">' + escapeHtml(heroSub1.icon) + '</span>' +
              '<div class="sq-market__hero-card-body">' +
                '<h3 class="sq-market__hero-card-name">' + escapeHtml(heroSub1.name) + '</h3>' +
                '<p class="sq-market__hero-card-desc">' + escapeHtml(heroSub1.desc) + '</p>' +
              '</div>' +
            '</article>' +
            '<article class="sq-market__hero-card" data-action="market-pick" data-id="' + heroSub2.id + '">' +
              '<span class="sq-market__hero-card-icon" style="background:' + heroSub2.bg + '">' + escapeHtml(heroSub2.icon) + '</span>' +
              '<div class="sq-market__hero-card-body">' +
                '<h3 class="sq-market__hero-card-name">' + escapeHtml(heroSub2.name) + '</h3>' +
                '<p class="sq-market__hero-card-desc">' + escapeHtml(heroSub2.desc) + '</p>' +
              '</div>' +
            '</article>' +
          '</div>';
      }
      heroHtml += '</section>';
    }

    /* 2. 分类入口（4 个圆形图标） */
    var catCounts = { agent: 0, flow: 0, design: 0, skill: 0 };
    MARKET_ITEMS.forEach(function (it) { catCounts[it.type] = (catCounts[it.type] || 0) + 1; });
    var catEntries = [
      { key: 'agent',  label: '智能体', icon: 'AI', bg: '#1D5B7A', count: catCounts.agent },
      { key: 'flow',   label: '工作流', icon: '流', bg: '#C1272D', count: catCounts.flow },
      { key: 'design', label: '设计',   icon: '设', bg: '#C7A24A', count: catCounts.design },
      { key: 'skill',  label: '技能包', icon: '技', bg: '#2F855A', count: catCounts.skill }
    ];
    var catsHtml = catEntries.map(function (c) {
      return '<button class="sq-market__cat-entry" data-action="market-cat" data-cat="' + c.key + '">' +
        '<span class="sq-market__cat-entry-icon" style="background:' + c.bg + '">' + escapeHtml(c.icon) + '</span>' +
        '<span class="sq-market__cat-entry-name">' + escapeHtml(c.label) + '</span>' +
        '<span class="sq-market__cat-entry-count">' + c.count + ' 个</span>' +
      '</button>';
    }).join('');

    /* 3. 场景推荐 */
    var scenesHtml = MARKET_SCENES.map(function (scene) {
      var sceneItems = scene.items.map(function (id) { return marketItemById(id); }).filter(Boolean);
      var cardsHtml = sceneItems.map(function (it) {
        return '<article class="sq-market__scene-card" data-action="market-pick" data-id="' + it.id + '">' +
          '<span class="sq-market__scene-card-icon" style="background:' + it.bg + '">' + escapeHtml(it.icon) + '</span>' +
          '<h4 class="sq-market__scene-card-name">' + escapeHtml(it.name) + '</h4>' +
          '<p class="sq-market__scene-card-desc">' + escapeHtml(it.desc) + '</p>' +
          '<span class="sq-market__scene-card-uses">' + mktIC.flame(10) + it.uses + '</span>' +
        '</article>';
      }).join('');
      return '<section class="sq-market__scene">' +
        '<div class="sq-market__section-head">' +
          '<h3 class="sq-market__section-title">' +
            '<span class="sq-market__scene-icon" style="background:' + scene.color + '">' + escapeHtml(scene.icon) + '</span>' +
            escapeHtml(scene.title) +
          '</h3>' +
          '<span class="sq-market__section-sub">' + escapeHtml(scene.sub) + '</span>' +
        '</div>' +
        '<div class="sq-market__scene-scroll">' + cardsHtml + '</div>' +
      '</section>';
    }).join('');

    scroll.innerHTML =
      heroHtml +
      '<section class="sq-market__cats-entry-wrap">' +
        '<div class="sq-market__section-head"><h3 class="sq-market__section-title">分类导航</h3></div>' +
        '<div class="sq-market__cats-entry">' + catsHtml + '</div>' +
      '</section>' +
      scenesHtml;
  }

  /* 搜索展开但无关键词时：只显示热门排行 */
  function renderMarketRankOnly(scroll) {
    var rankItems = MARKET_ITEMS.slice().sort(function (a, b) { return b.uses - a.uses; }).slice(0, 10);
    var rankHtml = rankItems.map(function (it, idx) {
      var trend = idx < 3 ? 'up' : (idx >= 7 ? 'down' : 'flat');
      var trendIcon = trend === 'up' ? '↑' : (trend === 'down' ? '↓' : '—');
      var trendCls = 'sq-market__rank-trend--' + trend;
      return '<li class="sq-market__rank-item" data-action="market-pick" data-id="' + it.id + '">' +
        '<span class="sq-market__rank-num' + (idx < 3 ? ' is-top' : '') + '">' + (idx + 1) + '</span>' +
        '<span class="sq-market__rank-icon" style="background:' + it.bg + '">' + escapeHtml(it.icon) + '</span>' +
        '<div class="sq-market__rank-info">' +
          '<span class="sq-market__rank-name">' + escapeHtml(it.name) + '</span>' +
          '<span class="sq-market__rank-meta">' + escapeHtml(MARKET_CAT_TAG[it.type] || '') + ' · ' + it.uses + ' 人在用</span>' +
        '</div>' +
        '<span class="sq-market__rank-trend ' + trendCls + '">' + trendIcon + '</span>' +
      '</li>';
    }).join('');
    scroll.innerHTML =
      '<section class="sq-market__rank sq-market__rank--search">' +
        '<div class="sq-market__section-head">' +
          '<h3 class="sq-market__section-title">' + mktIC.flame(15) + '热门排行</h3>' +
          '<span class="sq-market__section-sub">大家都在用</span>' +
        '</div>' +
        '<ol class="sq-market__rank-list">' + rankHtml + '</ol>' +
      '</section>';
  }

  /* 分类筛选视图 */
  function renderMarketCategoryList(scroll) {
    var catLabel = '';
    for (var i = 0; i < MARKET_CATS.length; i++) {
      if (MARKET_CATS[i].key === marketState.cat) { catLabel = MARKET_CATS[i].label; break; }
    }
    var items = marketFilterItems();
    var listHtml = items.length
      ? items.map(renderMarketCard).join('')
      : '<div class="sq-market__empty">该分类暂无资源</div>';
    scroll.innerHTML =
      '<section class="sq-market__list-section sq-market__list-section--cat">' +
        '<div class="sq-market__section-head">' +
          '<button class="sq-market__back" data-action="market-cat" data-cat="all">' + mktIC.back(16) + '</button>' +
          '<h3 class="sq-market__section-title">' + escapeHtml(catLabel) + '</h3>' +
          '<span class="sq-market__section-sub">' + items.length + ' 个</span>' +
        '</div>' +
        '<div class="sq-market__list">' + listHtml + '</div>' +
      '</section>';
  }

  /* 搜索结果视图 */
  function renderMarketSearchResults(scroll) {
    var items = marketFilterItems();
    var listHtml = items.length
      ? items.map(renderMarketCard).join('')
      : '<div class="sq-market__empty">没有找到匹配「' + escapeHtml(marketState.kw) + '」的资源<br>试试换个关键词</div>';
    scroll.innerHTML =
      '<section class="sq-market__list-section">' +
        '<div class="sq-market__section-head">' +
          '<h3 class="sq-market__section-title">搜索结果</h3>' +
          '<span class="sq-market__section-sub">' + items.length + ' 个匹配</span>' +
        '</div>' +
        '<div class="sq-market__list">' + listHtml + '</div>' +
      '</section>';
  }

  function openMarketSearch() {
    marketState.searchOpen = true;
    renderMarketTop();
    renderMarket();
  }

  function closeMarketSearch() {
    marketState.searchOpen = false;
    marketState.kw = '';
    renderMarketTop();
    renderMarket();
  }

  /* 市场搜索输入 */
  function onMarketInput(e) {
    var t = e.target;
    if (!(t instanceof Element) || !t.matches('[data-sq-market-input]')) return;
    marketState.kw = t.value || '';
    if (marketState.searchOpen) { renderMarket(); }
  }

  /* ===== 类型差异化区块：智能体/技能/设计/工作流各有侧重 ===== */
  function renderTypeSpecific(item, detail) {
    if (!item || !detail) return '';
    var type = item.type;
    function ioHtml(inputs, outputs) {
      return '<div class="sq-mdetail__io">' +
        '<div class="sq-mdetail__io-row"><span class="sq-mdetail__io-label">输入</span><span class="sq-mdetail__io-value">' + escapeHtml(inputs) + '</span></div>' +
        '<div class="sq-mdetail__io-arrow">' + mktIC.caret(14) + '</div>' +
        '<div class="sq-mdetail__io-row"><span class="sq-mdetail__io-label">输出</span><span class="sq-mdetail__io-value">' + escapeHtml(outputs) + '</span></div>' +
      '</div>';
    }
    function chipsHtml(items) {
      return items.map(function (t) { return '<span class="sq-mdetail__chip">' + escapeHtml(t) + '</span>'; }).join('');
    }
    function noteHtml(label, text) {
      return '<div class="sq-mdetail__note"><span class="sq-mdetail__note-label">' + escapeHtml(label) + '</span><span class="sq-mdetail__note-text">' + escapeHtml(text) + '</span></div>';
    }

    if (type === 'agent' && detail.agentConfig) {
      var ac = detail.agentConfig;
      var paramsHtml = '<div class="sq-mdetail__params">' +
        '<div class="sq-mdetail__param"><span class="sq-mdetail__param-label">模型</span><span class="sq-mdetail__param-value">' + escapeHtml(ac.model) + '</span></div>' +
        '<div class="sq-mdetail__param"><span class="sq-mdetail__param-label">温度</span><span class="sq-mdetail__param-value">' + ac.temperature + '</span></div>' +
        '<div class="sq-mdetail__param"><span class="sq-mdetail__param-label">上下文</span><span class="sq-mdetail__param-value">' + escapeHtml(ac.contextWindow) + '</span></div>' +
      '</div>';
      return '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head"><h3 class="sq-mdetail__section-title">' + mktIC.at(15) + '智能体详情</h3></div>' +
        paramsHtml +
        '<div class="sq-mdetail__sub-title">核心能力</div>' +
        '<div class="sq-mdetail__chips">' + chipsHtml(ac.capabilities) + '</div>' +
        ioHtml(ac.inputs, ac.outputs) +
        noteHtml('集成方式', ac.integration) +
      '</section>';
    }
    if (type === 'skill' && detail.skillConfig) {
      var sc = detail.skillConfig;
      return '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head"><h3 class="sq-mdetail__section-title">' + mktIC.tag(15) + '技能详情</h3></div>' +
        ioHtml(sc.inputs, sc.outputs) +
        '<div class="sq-mdetail__sub-title">适用场景</div>' +
        '<div class="sq-mdetail__chips">' + chipsHtml(sc.scenarios) + '</div>' +
        noteHtml('挂载方式', sc.mount) +
      '</section>';
    }
    if (type === 'design' && detail.designConfig) {
      var dc = detail.designConfig;
      var paletteHtml = dc.palette.map(function (c) {
        return '<span class="sq-mdetail__color" style="background:' + c + '"><span class="sq-mdetail__color-hex">' + c + '</span></span>';
      }).join('');
      var previewHtml = '<div class="sq-mdetail__preview">' +
        '<div class="sq-mdetail__preview-bar sq-mdetail__preview-bar--title"></div>' +
        '<div class="sq-mdetail__preview-bar sq-mdetail__preview-bar--body"></div>' +
        '<div class="sq-mdetail__preview-bar sq-mdetail__preview-bar--body"></div>' +
        '<div class="sq-mdetail__preview-bar sq-mdetail__preview-bar--meta"></div>' +
      '</div>';
      return '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head"><h3 class="sq-mdetail__section-title">' + mktIC.grid(15) + '设计详情</h3></div>' +
        '<div class="sq-mdetail__sub-title">布局预览 · ' + escapeHtml(dc.layout) + '</div>' +
        previewHtml +
        '<div class="sq-mdetail__sub-title">配色方案</div>' +
        '<div class="sq-mdetail__palette">' + paletteHtml + '</div>' +
        '<div class="sq-mdetail__sub-title">组件清单</div>' +
        '<div class="sq-mdetail__chips">' + chipsHtml(dc.components) + '</div>' +
        '<div class="sq-mdetail__sub-title">适用场景</div>' +
        '<div class="sq-mdetail__chips">' + chipsHtml(dc.scenarios) + '</div>' +
      '</section>';
    }
    if (type === 'flow' && detail.flowConfig) {
      var fc = detail.flowConfig;
      var nodesHtml = fc.nodes.map(function (nd, idx) {
        var isLast = idx === fc.nodes.length - 1;
        return '<div class="sq-mdetail__flow-node' + (isLast ? ' is-last' : '') + '">' +
          '<div class="sq-mdetail__flow-node-marker">' +
            '<span class="sq-mdetail__flow-node-icon" style="background:' + item.bg + '">' + escapeHtml(nd.icon || (idx + 1)) + '</span>' +
            (isLast ? '' : '<span class="sq-mdetail__flow-node-line"></span>') +
          '</div>' +
          '<div class="sq-mdetail__flow-node-body">' +
            '<div class="sq-mdetail__flow-node-head">' +
              '<span class="sq-mdetail__flow-node-name">' + escapeHtml(nd.name) + '</span>' +
              '<span class="sq-mdetail__flow-node-agent">' + escapeHtml(nd.agent) + '</span>' +
            '</div>' +
            '<span class="sq-mdetail__flow-node-role">' + escapeHtml(nd.role) + '</span>' +
          '</div>' +
        '</div>';
      }).join('');
      return '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head">' +
          '<h3 class="sq-mdetail__section-title">' + mktIC.graph(15) + '工作流详情</h3>' +
          '<span class="sq-mdetail__section-sub">' + fc.nodes.length + ' 个节点</span>' +
        '</div>' +
        '<div class="sq-mdetail__flow-nodes">' + nodesHtml + '</div>' +
        ioHtml(fc.inputs, fc.outputs) +
        noteHtml('运行时长', fc.duration) +
      '</section>';
    }
    return '';
  }

  /* ===== GitHub 风格资源详情页 ===== */
  function renderMarketDetail() {
    var id = marketState.detailId;
    var item = marketItemById(id);
    if (!item) return;
    var detail = getMarketDetail(id);
    var introduced = !!marketState.introduced[id];

    var top = $('[data-sq-mdetail-top]');
    if (top) {
      top.innerHTML =
        '<button class="sq-iconbtn" data-action="market-detail-back" aria-label="返回">' + mktIC.back(22) + '</button>' +
        '<h1 class="sq-mdetail__title">' + escapeHtml(item.name) + '</h1>' +
        '<button class="sq-iconbtn" data-action="share" aria-label="分享">' + mktIC.share(20) + '</button>';
    }

    var foot = $('[data-sq-mdetail-foot]');
    if (foot) {
      foot.innerHTML =
        '<div class="sq-mdetail__foot-info">' +
          '<span class="sq-mdetail__foot-uses">' + mktIC.flame(14) + item.uses + ' 人在用</span>' +
          '<span class="sq-mdetail__foot-ver">' + escapeHtml(detail.version) + '</span>' +
        '</div>' +
        '<button class="sq-mdetail__cta' + (introduced ? ' is-introduced' : '') + '" data-action="market-introduce" data-id="' + id + '">' +
          (introduced ? '已引入' : '引入到工作区') +
        '</button>';
    }

    var scroll = $('[data-sq-mdetail-scroll]');
    if (!scroll) return;

    var tagsHtml = detail.tags.map(function (tag) {
      return '<span class="sq-mdetail__tag">' + escapeHtml(tag) + '</span>';
    }).join('');
    var typeTag = MARKET_CAT_TAG[item.type] || '';
    var typeTagCls = MARKET_CAT_TAG_CLS[item.type] || '';

    var releasesExpanded = !!marketState.releasesExpanded[id];
    var changelogHtml = detail.changelog.map(function (rel, idx) {
      var notesHtml = rel.notes.map(function (n) { return '<li>' + escapeHtml(n) + '</li>'; }).join('');
      var hiddenCls = (idx > 0 && !releasesExpanded) ? ' is-collapsed' : '';
      return '<div class="sq-mdetail__release' + (idx === 0 ? ' is-latest' : '') + hiddenCls + '">' +
        '<div class="sq-mdetail__release-head">' +
          '<span class="sq-mdetail__release-tag' + (idx === 0 ? ' is-latest' : '') + '">' + escapeHtml(rel.version) + '</span>' +
          (idx === 0 ? '<span class="sq-mdetail__release-latest-badge">Latest</span>' : '') +
          '<span class="sq-mdetail__release-date">' + escapeHtml(rel.date) + '</span>' +
        '</div>' +
        '<ul class="sq-mdetail__release-notes">' + notesHtml + '</ul>' +
      '</div>';
    }).join('');
    var releasesToggleHtml = detail.changelog.length > 1
      ? '<button class="sq-mdetail__releases-toggle" data-action="toggle-releases" data-id="' + id + '">' +
        (releasesExpanded ? '收起版本' : '查看全部 ' + detail.changelog.length + ' 个版本') +
        '<span class="sq-mdetail__releases-caret' + (releasesExpanded ? ' is-open' : '') + '">' + mktIC.caret(13) + '</span>' +
      '</button>'
      : '';

    var typeSpecificHtml = renderTypeSpecific(item, detail);

    var similarItems = findSimilarItems(id, item.type);
    var similarHtml = similarItems.length
      ? similarItems.map(function (it) {
          var sTag = MARKET_CAT_TAG[it.type] || '';
          return '<article class="sq-mdetail__similar-card" data-action="market-pick" data-id="' + it.id + '">' +
            '<span class="sq-mdetail__similar-icon" style="background:' + it.bg + '">' + escapeHtml(it.icon) + '</span>' +
            '<div class="sq-mdetail__similar-body">' +
              '<span class="sq-mdetail__similar-name">' + escapeHtml(it.name) + '</span>' +
              '<span class="sq-mdetail__similar-meta">by ' + escapeHtml(it.author) + ' · ' + it.uses + ' 人在用</span>' +
            '</div>' +
            mktIC.caret(14) +
          '</article>';
        }).join('')
      : '';
    var similarSectionHtml = similarHtml
      ? '<section class="sq-mdetail__section">' +
          '<div class="sq-mdetail__section-head">' +
            '<h3 class="sq-mdetail__section-title">' + mktIC.swap(15) + '相似的' + typeTag + '</h3>' +
            '<span class="sq-mdetail__section-sub">' + similarItems.length + ' 个</span>' +
          '</div>' +
          '<div class="sq-mdetail__similar-list">' + similarHtml + '</div>' +
        '</section>'
      : '';

    var stepsHtml = detail.steps.map(function (step, idx) {
      return '<li class="sq-mdetail__step">' +
        '<span class="sq-mdetail__step-num">' + (idx + 1) + '</span>' +
        '<span class="sq-mdetail__step-text">' + escapeHtml(step) + '</span>' +
      '</li>';
    }).join('');

    var commentsHtml = '';
    if (detail.comments && detail.comments.length) {
      commentsHtml = detail.comments.map(function (c) {
        return '<div class="sq-mdetail__comment">' +
          '<span class="sq-mdetail__comment-avatar" style="background:' + item.bg + '">' + escapeHtml(c.avatar) + '</span>' +
          '<div class="sq-mdetail__comment-body">' +
            '<div class="sq-mdetail__comment-head">' +
              '<span class="sq-mdetail__comment-user">' + escapeHtml(c.user) + '</span>' +
              '<span class="sq-mdetail__comment-time">' + escapeHtml(c.time) + '</span>' +
            '</div>' +
            '<p class="sq-mdetail__comment-text">' + escapeHtml(c.text) + '</p>' +
            '<div class="sq-mdetail__comment-meta">' +
              '<span class="sq-mdetail__comment-likes">' + mktIC.like(12) + c.likes + '</span>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    } else {
      commentsHtml = '<div class="sq-mdetail__comment-empty">还没有评论，快来抢沙发吧</div>';
    }

    scroll.innerHTML =
      '<section class="sq-mdetail__header" style="background:linear-gradient(135deg, ' + item.bg + ', ' + shadeColor(item.bg, -28) + ')">' +
        '<div class="sq-mdetail__header-inner">' +
          '<div class="sq-mdetail__header-top">' +
            '<span class="sq-mdetail__header-icon">' + escapeHtml(item.icon) + '</span>' +
            '<div class="sq-mdetail__header-info">' +
              '<h2 class="sq-mdetail__header-name">' + escapeHtml(item.name) + '</h2>' +
              '<div class="sq-mdetail__header-meta">' +
                '<span class="sq-mdetail__header-ver">' + escapeHtml(detail.version) + '</span>' +
                '<span class="sq-mdetail__header-tag ' + typeTagCls + '">' + escapeHtml(typeTag) + '</span>' +
              '</div>' +
            '</div>' +
          '</div>' +
          '<p class="sq-mdetail__header-desc">' + escapeHtml(item.desc) + '</p>' +
          '<div class="sq-mdetail__header-stats">' +
            '<span class="sq-mdetail__header-stat"><b>' + item.uses + '</b> 人在用</span>' +
            '<span class="sq-mdetail__header-stat">by ' + escapeHtml(item.author) + '</span>' +
            '<span class="sq-mdetail__header-stat">更新于 ' + escapeHtml(detail.updatedAt) + '</span>' +
          '</div>' +
          '<div class="sq-mdetail__header-tags">' + tagsHtml + '</div>' +
        '</div>' +
      '</section>' +
      '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head"><h3 class="sq-mdetail__section-title">' + mktIC.book(15) + '作者寄语</h3></div>' +
        '<blockquote class="sq-mdetail__author-note"><p>' + escapeHtml(detail.authorNote) + '</p><cite>— ' + escapeHtml(item.author) + '</cite></blockquote>' +
      '</section>' +
      typeSpecificHtml +
      '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head">' +
          '<h3 class="sq-mdetail__section-title">' + mktIC.tag(15) + '版本演进</h3>' +
          '<span class="sq-mdetail__section-sub">' + detail.changelog.length + ' 个版本</span>' +
        '</div>' +
        '<div class="sq-mdetail__releases' + (releasesExpanded ? ' is-expanded' : '') + '">' + changelogHtml + '</div>' +
        releasesToggleHtml +
      '</section>' +
      '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head"><h3 class="sq-mdetail__section-title">' + mktIC.list(15) + '使用步骤</h3></div>' +
        '<ol class="sq-mdetail__steps">' + stepsHtml + '</ol>' +
      '</section>' +
      '<section class="sq-mdetail__section">' +
        '<div class="sq-mdetail__section-head">' +
          '<h3 class="sq-mdetail__section-title">' + mktIC.comment(15) + '用户评价</h3>' +
          '<span class="sq-mdetail__section-sub">' + (detail.comments ? detail.comments.length : 0) + ' 条</span>' +
        '</div>' +
        '<div class="sq-mdetail__comments">' + commentsHtml + '</div>' +
      '</section>' +
      similarSectionHtml;
  }

  /* ----------------------------- 顶栏滚动变实 ----------------------------- */

  function bindTopbarScroll() {
    var sc = $('[data-scroll="workbench"]');
    var bar = $('[data-topbar]');
    if (!sc || !bar) return;
    sc.addEventListener('scroll', function () {
      bar.classList.toggle('is-solid', sc.scrollTop > 6);
    }, { passive: true });
  }

  /* ---- Task 1.A.12：工作台组件 · 长按进入编辑态 + 拖拽手柄调高度 ---- */
  function bindWidgetInteractions() {
    var root = $('[data-nb-root]');
    if (!root) return;
    var pressTimer = null;
    var pressedCard = null;
    var pressX = 0;
    var pressY = 0;
    var drag = null;
    var editingId = null;

    function pointOf(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    function isInteractive(t) {
      return !!(t.closest('[data-action], input, textarea, [contenteditable="true"], .nb-wmenu, a') ||
                t.closest('button:not(.nb-widget__handle)'));
    }
    function enterEdit(card, id) {
      $all('.nb-widget.is-editing').forEach(function (c) { c.classList.remove('is-editing'); });
      card.classList.add('is-editing');
      editingId = id;
    }
    function exitEdit() {
      $all('.nb-widget.is-editing').forEach(function (c) { c.classList.remove('is-editing'); });
      editingId = null;
    }

    function down(e) {
      var handle = e.target.closest('[data-widget-handle]');
      if (handle && editingId) {
        var hc = handle.closest('.nb-widget');
        if (!hc) return;
        var hid = handle.getAttribute('data-widget-handle');
        var p = pointOf(e);
        drag = { id: hid, card: hc, startY: p.y, startH: parseInt(hc.style.height, 10) || 240 };
        hc.classList.add('is-dragging');
        if (e.cancelable) e.preventDefault();
        return;
      }
      var card = e.target.closest('.nb-widget');
      if (!card) { if (editingId) exitEdit(); return; }
      if (isInteractive(e.target)) return;
      pressedCard = card;
      var p2 = pointOf(e);
      pressX = p2.x; pressY = p2.y;
      if (pressTimer) clearTimeout(pressTimer);
      var idForEdit = card.getAttribute('data-widget');
      pressTimer = setTimeout(function () {
        enterEdit(card, idForEdit);
        toast('拖拽右下角手柄调整高度，点空白退出');
        pressedCard = null;
      }, 500);
    }

    function move(e) {
      if (drag) {
        var p = pointOf(e);
        var dy = p.y - drag.startY;
        var nh = Math.max(120, Math.min(400, drag.startH + dy));
        drag.card.style.height = nh + 'px';
        var badge = drag.card.querySelector('.nb-widget__height-badge');
        if (badge) badge.textContent = nh + 'px';
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (pressedCard && pressTimer) {
        var p2 = pointOf(e);
        if (Math.abs(p2.x - pressX) > 10 || Math.abs(p2.y - pressY) > 10) {
          clearTimeout(pressTimer);
          pressTimer = null;
          pressedCard = null;
        }
      }
    }

    function up() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      if (drag) {
        var nh = parseInt(drag.card.style.height, 10) || 240;
        if (drag.id === 'ai-carousel') {
          state.aiCarouselHeight = nh;
        } else {
          var f = findWidget(drag.id);
          if (f) f.w.height = nh;
        }
        drag.card.classList.remove('is-dragging');
        drag = null;
      }
      pressedCard = null;
    }

    root.addEventListener('touchstart', down, { passive: false });
    root.addEventListener('touchmove', move, { passive: false });
    root.addEventListener('touchend', up);
    root.addEventListener('touchcancel', up);
    root.addEventListener('mousedown', down);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
  }

  /* ----------------------------- 事件委托 ----------------------------- */

  function onClick(e) {
    var target = e.target;

    var mentionItem = target.closest('[data-action="pick-mention"]');
    if (mentionItem) { insertMention(mentionItem.getAttribute('data-title')); return; }

    var actEl = target.closest('[data-action]');
    if (!actEl) {
      if (!target.closest('[data-wmenu]')) closeAllWidgetMenus();
      return;
    }
    var action = actEl.getAttribute('data-action');

    /* 工作区重设计 action 优先分发 */
    if (handleWorkspaceAction(action, actEl)) return;

    switch (action) {
      case 'open-agent': pushView('agent'); break;
      case 'agent-tab': {
        /* 统一工作台 tab 切换：「智能体」留在当前页，「对话」进入工作台调整模式 */
        var aTab = actEl.getAttribute('data-tab');
        if (aTab === 'chat') {
          pushView('chat', { mode: 'workspace-redesign' });
        } else {
          $all('[data-action="agent-tab"]').forEach(function (t) {
            var on = t.getAttribute('data-tab') === aTab;
            t.classList.toggle('is-active', on);
            t.setAttribute('aria-selected', on ? 'true' : 'false');
          });
        }
        break;
      }
      case 'back-workbench': popView(); break;
      case 'open-chat': pushView('chat'); break;
      case 'open-workspace-redesign':
      case 'open-ai-workspace':
        pushView('chat', { mode: 'workspace-redesign' }); break;
      case 'open-chatlist': pushView('chatlist'); break;
      case 'new-chat': pushView('chat', { new: true }); break;
      case 'open-chat-by-id': {
        var cid = actEl.getAttribute('data-id');
        var chatItem = findChatById(cid);
        if (chatItem && chatItem.kind === 'miniapp') pushView('miniapp-chat', { chatId: cid });
        else pushView('chat', { chatId: cid });
        break;
      }
      case 'miniapp-back': popView(); break;
      case 'toggle-miniapp-preview': toggleMiniappPreview(); break;
      case 'miniapp-send': sendMiniappMsg(); break;
      case 'open-overview':
        if (window.ZX_OVERVIEW) window.ZX_OVERVIEW.open();
        break;
      case 'kanban-tab': {
        /* 点页签 → 翻到对应列 */
        var kIdx = parseInt(actEl.getAttribute('data-idx'), 10) || 0;
        var kBox = $('[data-kanban]');
        if (kBox) {
          var left = kIdx * kBox.clientWidth;
          if (kBox.scrollTo) kBox.scrollTo({ left: left, behavior: 'smooth' }); else kBox.scrollLeft = left;
        }
        setActiveKanbanTab(kIdx);
        break;
      }

      case 'open-template': pushView('template'); break;
      case 'pick-template': {
        var pkey = actEl.getAttribute('data-key');
        if (window.ZX_EDITOR) {
          window.ZX_EDITOR.open(pkey);
          /* 编辑器是独立 overlay（z-index 60），退出模板视图栈回到工作台；
             这样关闭编辑器时直接回到工作台，而非卡在模板选择页 */
          popView();
        } else {
          toast('编辑器加载中…');
        }
        break;
      }
      case 'ai-pick-template': {
        var sug = $('[data-template-suggest]');
        if (sug) sug.classList.add('is-show');
        break;
      }
      case 'dismiss-template-suggest': {
        var sug2 = $('[data-template-suggest]');
        if (sug2) sug2.classList.remove('is-show');
        break;
      }

      case 'toggle-planbar': {
        var pbar = $('[data-chat-planbar]');
        if (pbar) pbar.classList.toggle('is-collapsed');
        break;
      }
      case 'plan-add-chip': {
        if (!planState) break;
        var hadRel = -1;
        for (var ci = planState.chips.length - 1; ci >= 0; ci--) { if (/^已关联/.test(planState.chips[ci])) { hadRel = ci; break; } }
        if (hadRel >= 0) {
          var cm = planState.chips[hadRel].match(/(\d+)/);
          var cn = cm ? (parseInt(cm[1], 10) + 1) : 2;
          planState.chips[hadRel] = '已关联 ' + cn + ' 篇笔记';
        } else {
          planState.chips.push('已关联 1 篇笔记');
        }
        renderPlanbar();
        break;
      }
      case 'exit-planning': {
        var hadPlan = !!planState;
        planState = null; planReady = false; planUserMsgCount = 0;
        hidePlanbar();
        setChatTop('林', '在线 · 你的工作伙伴');
        if (hadPlan) {
          toast('已保存任务草稿，可稍后继续设计');
          pushMessage('ai', '好，我们换个节奏。需要再设计任务时随时叫我。');
        }
        break;
      }
      case 'confirm-plan': {
        if (!planReady || !planState) { toast('再聊几句，把任务设计完整'); break; }
        var taskName = planState.title || (planState.type !== 'custom' ? planState.type + '任务' : '新任务');
        var returnToAgent = stack.length >= 2 && stack[stack.length - 2] === 'agent';
        addPlannedTask(planState, taskName);
        planState = null; planReady = false; planUserMsgCount = 0;
        toast('已创建任务：' + taskName, true);
        popView();
        if (returnToAgent) renderKanban();
        break;
      }

      /* ---- Task 1.A.13：工作台调整的应用 / 取消 / 撤销 ---- */
      case 'apply-redesign': {
        if (!redesignState) break;
        redesignState = null;
        if (redesignUndoTimer) { clearTimeout(redesignUndoTimer); redesignUndoTimer = null; }
        var applyToast = $('[data-toast]'); if (applyToast) { applyToast.classList.remove('is-show', 'nb-toast--undo'); applyToast.innerHTML = ''; }
        hideRedesignPlanbar();
        setChatTop('林', '在线 · 你的工作伙伴');
        toast('工作台已按林的调整更新', true);
        popView();
        renderWidgets();
        break;
      }
      case 'exit-redesign': {
        if (redesignState && redesignState.snapshot) {
          state.widgets = redesignState.snapshot;
        }
        redesignState = null;
        if (redesignUndoTimer) { clearTimeout(redesignUndoTimer); redesignUndoTimer = null; }
        var exitToast = $('[data-toast]'); if (exitToast) { exitToast.classList.remove('is-show', 'nb-toast--undo'); exitToast.innerHTML = ''; }
        hideRedesignPlanbar();
        setChatTop('林', '在线 · 你的工作伙伴');
        popView();
        renderWidgets();
        break;
      }
      case 'undo-redesign': {
        undoLastRedesign();
        break;
      }

      case 'toggle-dispatch': {
        var did = actEl.getAttribute('data-id');
        for (var di = 0; di < chatMessages.length; di++) {
          if (chatMessages[di] && chatMessages[di]._domId === did) {
            chatMessages[di].expanded = !chatMessages[di].expanded;
            rerenderDispatch(chatMessages[di]);
            break;
          }
        }
        break;
      }
      case 'toggle-taskchip': {
        var chipBox = $('[data-chat-taskchip]');
        if (chipBox && !chipBox.hidden) chipBox.classList.toggle('is-collapsed');
        break;
      }
      case 'close-taskchip': {
        var chipBox2 = $('[data-chat-taskchip]');
        if (chipBox2) { chipBox2.hidden = true; chipBox2.classList.remove('is-collapsed'); chipBox2.innerHTML = ''; }
        break;
      }

      case 'open-add-widget': renderAddWidgetList(); openSheet('add-widget'); break;
      /* Task 4.3：组件设置 sheet 动作 */
      case 'set-close': restoreAddSheet(); closeSheet(); break;
      case 'set-toggle-hidden': {
        var panelH = $('.nb-sheet__panel'); if (!panelH) break;
        var fH = findWidget(panelH.__setWidgetId); if (!fH) break;
        fH.w.hidden = !fH.w.hidden;
        actEl.textContent = fH.w.hidden ? '已隐藏' : '显示中';
        actEl.classList.toggle('is-on', fH.w.hidden);
        actEl.setAttribute('aria-pressed', fH.w.hidden ? 'true' : 'false');
        break;
      }
      case 'set-save': {
        var panelS = $('.nb-sheet__panel'); if (!panelS) break;
        var fS = findWidget(panelS.__setWidgetId);
        if (fS) {
          var ti = panelS.querySelector('[data-set="title"]');
          if (ti) fS.w.title = ti.value || fS.w.title;
        }
        restoreAddSheet(); closeSheet(); renderWidgets();
        toast('已保存组件设置');
        break;
      }
      case 'pick-widget': {
        var type = actEl.getAttribute('data-type');
        state.widgets.push(newWidgetDefault(type));
        renderWidgets();
        closeSheet();
        toast('已添加「' + (WIDGET_META[type] ? WIDGET_META[type].chip : type) + '」组件');
        break;
      }

      case 'widget-menu': {
        var id = actEl.getAttribute('data-id');
        var menu = actEl.parentElement.querySelector('[data-wmenu]');
        var isOpen = menu && menu.classList.contains('is-open');
        closeAllWidgetMenus();
        if (menu && !isOpen) { menu.classList.add('is-open'); menu.setAttribute('data-for', id); }
        e.stopPropagation();
        break;
      }
      case 'w-delete': { removeWidgetById(currentMenuId(actEl)); closeAllWidgetMenus(); toast('已删除组件'); break; }
      case 'w-pin': { pinWidgetById(currentMenuId(actEl)); closeAllWidgetMenus(); toast('已置顶'); break; }
      case 'w-todo': { convertToTodo(currentMenuId(actEl)); closeAllWidgetMenus(); toast('已转为待办'); break; }
      case 'w-settings': { var setId = currentMenuId(actEl); closeAllWidgetMenus(); showWidgetSettings(setId); break; }

      case 'sug-start': {
        var w = findWidget(actEl.getAttribute('data-id'));
        var draft = planDraftFromAssignType(w ? w.w.assignType : null);
        pushView('chat', { mode: 'planning', planDraft: draft });
        break;
      }
      case 'sug-ignore': {
        var igId = actEl.getAttribute('data-id');
        var igSlide = actEl.closest('[data-slide-id]');
        if (igSlide) {
          igSlide.style.transition = 'opacity .2s ease, transform .2s ease';
          igSlide.style.opacity = '0';
          igSlide.style.transform = 'scale(0.96)';
          window.setTimeout(function () { removeWidgetById(igId); toast('已忽略该建议'); }, 200);
        } else {
          removeWidgetById(igId); toast('已忽略该建议');
        }
        break;
      }

      case 'todo-toggle': {
        var f = findWidget(actEl.getAttribute('data-id'));
        var idx = parseInt(actEl.getAttribute('data-idx'), 10);
        if (f && f.w.type === 'todo') { f.w.items[idx].done = !f.w.items[idx].done; renderWidgets(); }
        break;
      }
      case 'todo-add': {
        var fa = findWidget(actEl.getAttribute('data-id'));
        if (fa && fa.w.type === 'todo') { fa.w.items.push({ text: '新待办事项', done: false }); renderWidgets(); }
        break;
      }

      case 'open-hot': showHotspotCard(actEl); break;
      case 'open-recall': {
        /* Task 4.3：回顾项 → 用编辑器打开该笔记（真跳页） */
        var note = actEl.getAttribute('data-note');
        if (note && window.ZX_EDITOR) {
          window.ZX_EDITOR.open('doc', { noteId: note });
        } else {
          toast('打开笔记（该回顾暂无可打开的笔记）');
        }
        break;
      }

      case 'open-assign': pushView('chat', { mode: 'planning', planDraft: { type: 'custom' } }); break;
      case 'close-sheet': closeSheet(); break;

      case 'open-sub-agent': {
        /* Task 4.1：进入该子智能体的"最近子会话"——从 bridge 取/seed 真实子会话 */
        var sid = actEl.getAttribute('data-id');
        var sa = AGENTS[sid];
        if (!sa) { toast('子会话暂不可用'); break; }
        var subCid = 'sub-' + sid;
        if (window.ZX_BRIDGE && window.ZX_BRIDGE.getConvo && !window.ZX_BRIDGE.getConvo(subCid)) {
          /* 用该子智能体最近一次 dispatch 结果 seed 子会话 */
          var res = window.ZX_AI ? window.ZX_AI.dispatch(sid, '界面阻抗 / 硫化物电解质') : { items: [] };
          var items = (res.items || []).slice(0, 3);
          window.ZX_BRIDGE.putConvo(subCid, {
            id: subCid, kind: 'sub', agentId: sid, agentName: sa.name,
            title: sa.name + '智能体 · 最近子会话', time: '刚刚',
            msgs: [
              { role: 'ai', text: '我是林调度的「' + sa.name + '」能力。最近一次被调用：' + sa.desc, time: '09:08' },
              { role: 'ai', text: '那次我返回了 ' + (res.resultCount || items.length) + ' 条结果：' + (items.join('；') || '—'), time: '09:08' }
            ]
          });
        }
        pushView('chat', { chatId: subCid });
        break;
      }
      case 'open-task': {
        var tid = actEl.getAttribute('data-id');
        renderDetail(tid);
        pushView('detail');
        break;
      }
      case 'back-agent': popView(); break;
      case 't-detail': {
        var card = actEl.closest('[data-id]');
        if (card) { renderDetail(card.getAttribute('data-id')); pushView('detail'); }
        break;
      }
      case 't-pause': { if (currentTaskOf(actEl)) { moveTaskAndRender(currentTaskOf(actEl), 'doing', 'todo'); toast('已暂停，任务回到待办'); } break; }
      case 't-start': { if (currentTaskOf(actEl)) { moveTaskAndRender(currentTaskOf(actEl), 'todo', 'doing'); toast('任务已开始，林开始工作', true); } break; }
      case 't-edit': {
        var te = currentTaskOf(actEl);
        if (te) pushView('chat', { mode: 'planning', planDraft: planDraftFromTask(te) });
        else toast('编辑任务（占位）');
        break;
      }
      case 't-product': {
        var tp = currentTaskOf(actEl);
        showProductCard(tp);
        break;
      }
      case 't-redo': toast('已重新指派任务', true); break;

      case 'd-pause': {
        if (currentDetailTaskId) { moveTaskAndRender(currentDetailTaskId, 'doing', 'todo'); popView(); toast('已暂停，任务回到待办'); }
        else toast('已暂停');
        break;
      }
      case 'd-resume': {
        if (currentDetailTaskId) { moveTaskAndRender(currentDetailTaskId, 'todo', 'doing'); toast('已继续', true); }
        else toast('已继续');
        break;
      }
      case 'd-takeover': {
        /* 在任务对话里插一条"我已接手"系统消息（写 convos） */
        if (currentDetailTaskId && window.ZX_BRIDGE) {
          var tcid = 'task-' + currentDetailTaskId;
          var tc = window.ZX_BRIDGE.getConvo(tcid);
          if (tc) { tc.msgs.push({ role: 'user', text: '我接手了，剩下的我来。', time: nowHm() }); window.ZX_BRIDGE.putConvo(tcid, tc); }
        }
        toast('已接手任务，对话已记录', true);
        break;
      }
      case 'd-chat': {
        var dTid = currentDetailTaskId;
        pushView('chat', dTid ? { taskId: dTid } : { new: true });
        break;
      }
      case 'd-delete': popView(); toast('任务已删除'); break;

      case 'chat-send': sendChat(); break;
      case 'chat-archive': archiveChat(); break;
      case 'chat-pick-partition': saveChatToPartition(actEl.getAttribute('data-nb')); break;
      case 'chat-new-partition': promptNewPartition(); break;
      case 'chat-create-partition': doCreatePartition(); break;
      case 'chat-partition-cancel': closePartitionPicker(); break;
      case 'chat-attach-pdf': addAttachment('pdf', 'battery-review.pdf'); break;
      case 'chat-attach-image': addAttachment('image', 'impedance-curve.png'); break;
      case 'chat-tool-note': {
        var ta = chatInput();
        if (ta) { ta.focus(); var p = ta.selectionStart; ta.value = ta.value.slice(0, p) + '@' + ta.value.slice(p); ta.setSelectionRange(p + 1, p + 1); openMention(''); }
        break;
      }
      case 'remove-attach': {
        var ri = parseInt(actEl.getAttribute('data-idx'), 10);
        chatAttachments.splice(ri, 1); renderAttachTray(); break;
      }
      case 'noop': break;
    }
  }

  function currentMenuId(actEl) {
    var menu = actEl.closest('[data-wmenu]');
    return menu ? menu.getAttribute('data-for') : null;
  }

  function removeWidgetById(id) {
    var f = findWidget(id);
    if (f) { state.widgets.splice(f.i, 1); renderWidgets(); }
  }
  function pinWidgetById(id) {
    var f = findWidget(id);
    if (f && f.i > 0) { var w = state.widgets.splice(f.i, 1)[0]; state.widgets.unshift(w); renderWidgets(); }
  }
  function convertToTodo(id) {
    var f = findWidget(id);
    if (!f) return;
    f.w = { id: f.w.id, type: 'todo', title: f.w.title, items: [{ text: f.w.title, done: false }] };
    state.widgets[f.i] = f.w;
    renderWidgets();
  }

  /* ---- 输入框事件 ---- */
  function onChatInput(e) {
    var info = currentMentionQuery();
    if (info) openMention(info.query); else closeMention();
    updateSendState();
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(); }
  }

  /* ----------------------------- 初始化 ----------------------------- */

  function buildStaticBits() {
    var bar = $('[data-topbar]');
    if (bar) {
      /* 顶栏布局：
       *   左上：☰ 三横 → 全局功能菜单（与其他 tab 统一，由 drawer.js 接管）
       *   右上：AI 工作台(✦) / 对话 / 总览 —— AI 入口从左上移到右上 */
      bar.innerHTML =
        '<button class="nb-iconbtn" data-action="menu" aria-label="功能菜单">' + IC.menu() + '</button>' +
        '<div class="nb-topbar__right">' +
        '<button class="nb-iconbtn nb-iconbtn--ai" data-action="open-agent" aria-label="AI 工作台">' + IC.spark() + '</button>' +
        '<button class="nb-iconbtn" data-action="open-chatlist" aria-label="与林的对话">' + IC.chat() + '</button>' +
        '<button class="nb-iconbtn" data-action="open-overview" aria-label="总览">' + IC.folder() + '</button>' +
        '</div>';
    }
    /* 底部仅保留「写新笔记」FAB（朱砂主色，右下角浮动）；
     * 「让林调整工作台」已移至顶部图标 */
    var workbenchFoot = $('[data-workbench-foot]');
    if (workbenchFoot) {
      workbenchFoot.innerHTML =
        '<button class="nb-fab nb-fab--write" data-action="open-template" aria-label="写新笔记">' + IC.plus() + '</button>';
    }

    var agentTop = $('[data-agent-top]');
    if (agentTop) {
      /* 顶栏：返回 + 统一工作台 tab（智能体 / 对话）+ 指派任务 */
      agentTop.innerHTML =
        '<button class="nb-iconbtn" data-action="back-workbench" aria-label="返回">' + IC.back() + '</button>' +
        '<div class="nb-agent__tabs" role="tablist" aria-label="工作台">' +
        '<button class="nb-agent__tab is-active" data-action="agent-tab" data-tab="agents" role="tab" aria-selected="true">智能体</button>' +
        '<button class="nb-agent__tab" data-action="agent-tab" data-tab="chat" role="tab" aria-selected="false">对话</button>' +
        '</div>' +
        '<button class="nb-btn nb-btn--outline nb-btn--sm" data-action="open-assign">' + IC.plus() + ' 指派任务</button>';
    }
    renderAgentSub();

    var detailTop = $('[data-detail-top]');
    if (detailTop) {
      detailTop.innerHTML =
        '<button class="nb-iconbtn" data-action="back-agent" aria-label="返回">' + IC.back() + '</button>' +
        '<h1 class="nb-detail__title" data-detail-title>任务详情</h1>';
    }
    var detailActions = $('[data-detail-actions]');
    if (detailActions) {
      detailActions.innerHTML = ''; /* 任务详情底部按钮已移除（介入对话/暂停/继续/删除） */
    }

    var chatlistTop = $('[data-chatlist-top]');
    if (chatlistTop) {
      chatlistTop.innerHTML =
        '<button class="nb-iconbtn" data-action="back-workbench" aria-label="返回">' + IC.back() + '</button>' +
        '<h1 class="nb-chatlist__title">与林的对话</h1>' +
        '<button class="nb-btn nb-btn--outline nb-btn--sm" data-action="new-chat">' + IC.plus() + ' 新对话</button>';
    }

    var templateTop = $('[data-template-top]');
    if (templateTop) {
      templateTop.innerHTML =
        '<button class="nb-iconbtn" data-action="back-workbench" aria-label="返回">' + IC.back() + '</button>' +
        '<h1 class="nb-template__title">选择笔记模板</h1>' +
        '<button class="nb-template__ai-btn" data-action="ai-pick-template">' + IC.spark() + ' AI 帮我选</button>';
    }

    var chatTop = $('[data-chat-top]');
    if (chatTop) {
      chatTop.innerHTML =
        '<button class="nb-iconbtn" data-action="back-workbench" aria-label="返回">' + IC.back() + '</button>' +
        '<div class="nb-chat__head">' +
        '<span class="nb-chat__avatar">' + IC.spark() + '</span>' +
        '<div><h1 class="nb-chat__name">林</h1><span class="nb-chat__status">在线 · 你的工作伙伴</span></div>' +
        '</div>' +
        '<button class="nb-iconbtn" data-action="chat-archive" aria-label="归档对话" title="归档到我的对话">' + IC.folder() + '</button>';
    }
    var chatTools = $('[data-chat-tools]');
    if (chatTools) {
      chatTools.innerHTML =
        '<button class="nb-chat__tool" data-action="chat-tool-note">导入笔记</button>' +
        '<button class="nb-chat__tool" data-action="chat-attach-pdf">导入 PDF</button>' +
        '<button class="nb-chat__tool" data-action="chat-attach-image">导入图片</button>';
    }
    var chatInputRow = $('[data-chat-input-row]');
    if (chatInputRow) {
      chatInputRow.innerHTML =
        '<button class="nb-chat__attach-btn" data-action="chat-attach-pdf" aria-label="附件">' + IC.clip() + '</button>' +
        '<div class="nb-chat__input-wrap">' +
        '<div class="nb-mention" data-mention></div>' +
        '<textarea class="nb-chat__input" data-chat-input rows="1" placeholder="问林什么… 输入 @ 引用笔记"></textarea>' +
        '</div>' +
        '<button class="nb-chat__send" data-action="chat-send" data-chat-send aria-label="发送">' + IC.send() + '</button>';
    }

    /* 模拟键盘：插入到 input-row 之后（nb-chat 视图底部），默认隐藏 */
    var chatView = $('[data-view="chat"]');
    if (chatView && !chatView.querySelector('[data-chat-keyboard]')) {
      var kb = el('div', 'nb-chat__keyboard');
      kb.setAttribute('data-chat-keyboard', '');
      kb.setAttribute('hidden', '');
      kb.innerHTML =
        '<div class="nb-chat__keyboard__row">' +
        '<button class="nb-chat__key" type="button">q</button><button class="nb-chat__key" type="button">w</button><button class="nb-chat__key" type="button">e</button><button class="nb-chat__key" type="button">r</button><button class="nb-chat__key" type="button">t</button><button class="nb-chat__key" type="button">y</button><button class="nb-chat__key" type="button">u</button><button class="nb-chat__key" type="button">i</button><button class="nb-chat__key" type="button">o</button><button class="nb-chat__key" type="button">p</button>' +
        '</div>' +
        '<div class="nb-chat__keyboard__row nb-chat__keyboard__row--offset">' +
        '<button class="nb-chat__key" type="button">a</button><button class="nb-chat__key" type="button">s</button><button class="nb-chat__key" type="button">d</button><button class="nb-chat__key" type="button">f</button><button class="nb-chat__key" type="button">g</button><button class="nb-chat__key" type="button">h</button><button class="nb-chat__key" type="button">j</button><button class="nb-chat__key" type="button">k</button><button class="nb-chat__key" type="button">l</button>' +
        '</div>' +
        '<div class="nb-chat__keyboard__row">' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button" data-nb-key="shift">⇧</button>' +
        '<button class="nb-chat__key" type="button">z</button><button class="nb-chat__key" type="button">x</button><button class="nb-chat__key" type="button">c</button><button class="nb-chat__key" type="button">v</button><button class="nb-chat__key" type="button">b</button><button class="nb-chat__key" type="button">n</button><button class="nb-chat__key" type="button">m</button>' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button" data-nb-key="back">⌫</button>' +
        '</div>' +
        '<div class="nb-chat__keyboard__row">' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button">123</button>' +
        '<button class="nb-chat__key" type="button">,</button>' +
        '<button class="nb-chat__key nb-chat__key--space" type="button" data-nb-key="space">空格</button>' +
        '<button class="nb-chat__key" type="button">.</button>' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button" data-nb-key="enter">换行</button>' +
        '</div>';
      chatView.appendChild(kb);
    }

    /* 小程序对话视图也插入一份键盘（视图互斥，需各自拥有） */
    var macView = $('[data-view="miniapp-chat"]');
    if (macView && !macView.querySelector('[data-mac-keyboard]')) {
      var mkb = el('div', 'nb-chat__keyboard');
      mkb.setAttribute('data-mac-keyboard', '');
      mkb.setAttribute('hidden', '');
      mkb.innerHTML =
        '<div class="nb-chat__keyboard__row">' +
        '<button class="nb-chat__key" type="button">q</button><button class="nb-chat__key" type="button">w</button><button class="nb-chat__key" type="button">e</button><button class="nb-chat__key" type="button">r</button><button class="nb-chat__key" type="button">t</button><button class="nb-chat__key" type="button">y</button><button class="nb-chat__key" type="button">u</button><button class="nb-chat__key" type="button">i</button><button class="nb-chat__key" type="button">o</button><button class="nb-chat__key" type="button">p</button>' +
        '</div>' +
        '<div class="nb-chat__keyboard__row nb-chat__keyboard__row--offset">' +
        '<button class="nb-chat__key" type="button">a</button><button class="nb-chat__key" type="button">s</button><button class="nb-chat__key" type="button">d</button><button class="nb-chat__key" type="button">f</button><button class="nb-chat__key" type="button">g</button><button class="nb-chat__key" type="button">h</button><button class="nb-chat__key" type="button">j</button><button class="nb-chat__key" type="button">k</button><button class="nb-chat__key" type="button">l</button>' +
        '</div>' +
        '<div class="nb-chat__keyboard__row">' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button" data-nb-key="shift">⇧</button>' +
        '<button class="nb-chat__key" type="button">z</button><button class="nb-chat__key" type="button">x</button><button class="nb-chat__key" type="button">c</button><button class="nb-chat__key" type="button">v</button><button class="nb-chat__key" type="button">b</button><button class="nb-chat__key" type="button">n</button><button class="nb-chat__key" type="button">m</button>' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button" data-nb-key="back">⌫</button>' +
        '</div>' +
        '<div class="nb-chat__keyboard__row">' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button">123</button>' +
        '<button class="nb-chat__key" type="button">,</button>' +
        '<button class="nb-chat__key nb-chat__key--space" type="button" data-nb-key="space">空格</button>' +
        '<button class="nb-chat__key" type="button">.</button>' +
        '<button class="nb-chat__key nb-chat__key--wide" type="button" data-nb-key="enter">换行</button>' +
        '</div>';
      macView.appendChild(mkb);
    }

    var addSheet = $('[data-sheet="add-widget"]');
    if (addSheet && !addSheet.querySelector('.nb-sheet__panel')) {
      addSheet.innerHTML =
        '<div class="nb-sheet__overlay" data-action="close-sheet"></div>' +
        '<div class="nb-sheet__panel">' +
        '<div class="nb-sheet__handle"></div>' +
        '<div class="nb-sheet__head"><h2 class="nb-sheet__title">添加小组件</h2><button class="nb-iconbtn" data-action="close-sheet" aria-label="关闭">' + IC.close() + '</button></div>' +
        '<div class="nb-sheet__body"><div class="nb-widget-pick-list" data-add-widget-list></div></div>' +
        '</div>';
    }
  }

  function bindEvents() {
    var root = $('[data-nb-root]');
    if (!root) return;
    root.addEventListener('click', onClick);
    root.addEventListener('input', onMarketInput);

    var doc = document;
    doc.addEventListener('click', function (e) {
      if (!e.target.closest('[data-action="widget-menu"]') && !e.target.closest('[data-wmenu]')) {
        closeAllWidgetMenus();
      }
    });

    var ta = chatInput();
    if (ta) {
      ta.addEventListener('input', onChatInput);
      ta.addEventListener('keydown', onChatInput);
      /* focus 弹出模拟键盘；blur 延迟收起（让键盘点击先触发，避免误收） */
      ta.addEventListener('focus', showChatKeyboard);
      ta.addEventListener('blur', function () {
        window.setTimeout(closeMention, 150);
        window.setTimeout(hideChatKeyboard, 150);
      });
    }
    /* 键盘按键 → 输入框插字 + 更新发送状态 */
    bindChatKeyboard(chatKeyboard(), ta, $('[data-chat-send]'));

    var planbar = $('[data-chat-planbar]');
    if (planbar) {
      planbar.addEventListener('change', onPlanbarChange);
      planbar.addEventListener('input', onPlanbarInput);
    }

    bindWidgetInteractions();

    /* Task 1.6：笔记本可见度 chip 点击委托 */
    doc.addEventListener('click', function (e) {
      var defSlot = e.target.closest('[data-nb-default-vis]');
      if (defSlot) {
        if (!window.VIS) return;
        if (!nbDefaultVis) nbDefaultVis = VIS.defaultVisibility();
        VIS.openPicker(defSlot, nbDefaultVis, null, function (nv) {
          nbDefaultVis = Object.assign({}, nv);
          defSlot.innerHTML = VIS.chipHTML(nv);
        });
        return;
      }
      var slot = e.target.closest('[data-nb-vis]');
      if (!slot || !window.VIS) return;
      var nbKey = slot.getAttribute('data-nb-vis');
      var v = notebookVis(nbKey) || VIS.defaultVisibility();
      VIS.openPicker(slot, v, null, function (nv) {
        nbVisibilityMap[nbKey] = Object.assign({}, nv);
        slot.innerHTML = VIS.chipHTML(nv);
      });
    });
  }

  /* Task 2.4：把对话 mock 数据 seed 进 bridge.convos（task / 历史对话统一可查） */
  function seedBridgeConvos() {
    if (!window.ZX_BRIDGE || !window.ZX_BRIDGE.putConvo) return;
    /* 任务对话 */
    for (var tid in MOCK_TASK_CHATS) {
      if (MOCK_TASK_CHATS.hasOwnProperty(tid) && !window.ZX_BRIDGE.getConvo('task-' + tid)) {
        var t = taskById(tid);
        window.ZX_BRIDGE.putConvo('task-' + tid, {
          id: 'task-' + tid, kind: 'task', taskId: tid,
          title: t ? t.name : '任务对话', msgs: MOCK_TASK_CHATS[tid].slice()
        });
      }
    }
    /* 历史对话 */
    MOCK_CHAT_LIST.forEach(function (c) {
      if (!window.ZX_BRIDGE.getConvo(c.id)) {
        var msgs = c.kind === 'miniapp'
          ? (MOCK_MINIAPP_CHATS[c.id] || []).slice()
          : (MOCK_CHAT_MESSAGES[c.id] || []).slice();
        window.ZX_BRIDGE.putConvo(c.id, {
          id: c.id, kind: c.kind || 'main', title: c.title, tags: c.tags || [],
          msgs: msgs
        });
      }
    });
  }

  /* "我的对话"作品集：默认隐私，按对话核心内容自动分区
   * 结构：Portfolio(p-chats) → Notebook(分区) → File(对话记录 + 总结) */
  var CHATS_PORTFOLIO_ID = 'p-chats';
  var CHATS_DEFAULT_PARTITIONS = [
    { id: 'nb-chat-research', name: '研究讨论' },
    { id: 'nb-chat-task', name: '任务复盘' },
    { id: 'nb-chat-misc', name: '其他对话' }
  ];
  /* 对话关键词→分区映射（用于 AI 推荐分区） */
  var CHATS_PARTITION_KEYWORDS = [
    { nbId: 'nb-chat-research', keywords: ['阻抗', '固态', '电池', '硫化物', '界面', '电解质', '锂', '钠', '研究', '分析', '数据', '实验', '论文', '文献'], label: '研究讨论' },
    { nbId: 'nb-chat-task', keywords: ['任务', '计划', '复盘', '进度', '安排', '部署', '调度', '智能体', '工作流', '看板'], label: '任务复盘' }
  ];

  function ensureChatsPortfolio() {
    var b = bridge();
    if (!b || !b.upsertPortfolio) return;
    /* 创建作品集（若不存在） */
    var portfolios = b.getPortfolios();
    var exists = portfolios.some(function (p) { return p.id === CHATS_PORTFOLIO_ID; });
    if (!exists) {
      b.upsertPortfolio({ id: CHATS_PORTFOLIO_ID, name: '我的对话' });
    }
    /* 创建默认分区笔记本 */
    CHATS_DEFAULT_PARTITIONS.forEach(function (nb) {
      var nbs = b.getNotebooks(CHATS_PORTFOLIO_ID);
      var nbExists = nbs.some(function (n) { return n.id === nb.id; });
      if (!nbExists) {
        b.upsertNotebook({ id: nb.id, name: nb.name, portfolioId: CHATS_PORTFOLIO_ID });
      }
    });
    /* 设置默认隐私：仅自己可见 */
    nbVisibilityMap[CHATS_PORTFOLIO_ID] = { scope: 'self', preview: 'hidden', paywall: 'free', scopeGroups: [], previewConfig: { chars: 200 } };
    CHATS_DEFAULT_PARTITIONS.forEach(function (nb) {
      nbVisibilityMap[nb.id] = { scope: 'self', preview: 'hidden', paywall: 'free', scopeGroups: [], previewConfig: { chars: 200 } };
    });
  }

  /* ---- 对话归档：生成摘要 + AI 推荐分区 + 分区选择器 + 保存 ---- */

  /* 当前归档上下文（供分区选择器回调使用） */
  var archiveCtx = null;

  /* 生成对话摘要：提取 AI 消息关键句 + 用户消息要点 */
  function buildChatSummary(msgs) {
    if (!msgs || !msgs.length) return '空对话';
    var aiMsgs = msgs.filter(function (m) { return m.role === 'ai' && m.text; });
    var userMsgs = msgs.filter(function (m) { return m.role === 'user' && m.text; });
    if (!aiMsgs.length && !userMsgs.length) return '空对话';

    /* 摘要结构：对话主题 + 关键要点 + 结论 */
    var firstUser = userMsgs[0] ? userMsgs[0].text : '';
    var topic = firstUser.length > 30 ? firstUser.slice(0, 30) + '…' : firstUser;

    /* 取前 3 条 AI 消息作为关键要点 */
    var points = aiMsgs.slice(0, 3).map(function (m, i) {
      var t = m.text.length > 60 ? m.text.slice(0, 60) + '…' : m.text;
      return (i + 1) + '. ' + t;
    });

    var summary = '【对话主题】' + (topic || '与林的对话') + '\n';
    summary += '【消息数】共 ' + msgs.length + ' 条（用户 ' + userMsgs.length + ' / AI ' + aiMsgs.length + '）\n';
    if (points.length) {
      summary += '【关键要点】\n' + points.join('\n');
    }
    return summary;
  }

  /* AI 推荐分区：基于关键词匹配 */
  function recommendPartition(msgs) {
    if (!msgs || !msgs.length) return CHATS_DEFAULT_PARTITIONS[2].id; /* 默认"其他对话" */
    var text = msgs.map(function (m) { return m.text || ''; }).join(' ');
    var scores = {};
    CHATS_PARTITION_KEYWORDS.forEach(function (pk) {
      scores[pk.nbId] = 0;
      pk.keywords.forEach(function (kw) {
        var idx = text.indexOf(kw);
        while (idx >= 0) { scores[pk.nbId]++; idx = text.indexOf(kw, idx + kw.length); }
      });
    });
    var best = CHATS_DEFAULT_PARTITIONS[2].id; /* 默认"其他对话" */
    var bestScore = 0;
    for (var nbId in scores) { if (scores[nbId] > bestScore) { bestScore = scores[nbId]; best = nbId; } }
    return best;
  }

  /* 归档对话主入口 */
  function archiveChat() {
    var msgs = chatMessages.slice();
    if (msgs.length < 2) { toast('对话内容太少，暂不归档'); return; }

    var summary = buildChatSummary(msgs);
    var recommendedNb = recommendPartition(msgs);
    var title = deriveChatTitle(msgs);

    archiveCtx = {
      msgs: msgs,
      summary: summary,
      title: title,
      recommendedNb: recommendedNb
    };

    openPartitionPicker(recommendedNb);
  }

  /* 从消息中推导对话标题 */
  function deriveChatTitle(msgs) {
    var firstUser = null;
    for (var i = 0; i < msgs.length; i++) {
      if (msgs[i].role === 'user' && msgs[i].text) { firstUser = msgs[i].text; break; }
    }
    if (!firstUser) return '与林的对话 · ' + nowHm();
    return firstUser.length > 20 ? firstUser.slice(0, 20) + '…' : firstUser;
  }

  /* 分区选择器底部抽屉 */
  function openPartitionPicker(recommendedNb) {
    closePartitionPicker();
    var b = bridge();
    var nbs = (b && b.getNotebooks) ? b.getNotebooks(CHATS_PORTFOLIO_ID) : [];
    if (!nbs.length) nbs = CHATS_DEFAULT_PARTITIONS.slice();

    var opts = nbs.map(function (nb) {
      var isRec = nb.id === recommendedNb;
      return '<button class="nb-partpick__opt' + (isRec ? ' is-recommended' : '') + '" data-action="chat-pick-partition" data-nb="' + nb.id + '">' +
        '<span class="nb-partpick__icon">💬</span>' +
        '<span class="nb-partpick__label">' + escapeHtml(nb.name) + '</span>' +
        (isRec ? '<span class="nb-partpick__rec">' + IC.spark() + ' AI 推荐</span>' : '') +
      '</button>';
    }).join('');

    var scrim = document.createElement('div');
    scrim.className = 'nb-add-pick-scrim';
    scrim.setAttribute('data-partpick-scrim', '');
    scrim.onclick = closePartitionPicker;
    var sheet = document.createElement('div');
    sheet.className = 'nb-add-pick nb-partpick';
    sheet.innerHTML =
      '<div class="nb-add-pick__handle"></div>' +
      '<h3 class="nb-add-pick__title">归档到分区</h3>' +
      '<div class="nb-add-pick__list">' + opts + '</div>' +
      '<button class="nb-partpick__new" data-action="chat-new-partition">' + IC.plus() + ' 新建分区</button>' +
      '<button class="nb-add-pick__cancel" data-action="chat-partition-cancel">取消</button>';
    var phone = $('[data-nb-root]') || $('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(sheet);
  }

  function closePartitionPicker() {
    var s = $('[data-partpick-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = $('.nb-partpick');
    if (p) p.parentNode.removeChild(p);
  }

  /* 新建分区：弹出输入框（用简易 inline 输入替代 prompt） */
  function promptNewPartition() {
    closePartitionPicker();
    var scrim = document.createElement('div');
    scrim.className = 'nb-add-pick-scrim';
    scrim.setAttribute('data-partpick-scrim', '');
    scrim.onclick = closePartitionPicker;
    var sheet = document.createElement('div');
    sheet.className = 'nb-add-pick nb-partpick';
    sheet.innerHTML =
      '<div class="nb-add-pick__handle"></div>' +
      '<h3 class="nb-add-pick__title">新建分区</h3>' +
      '<div class="nb-partpick__input-wrap">' +
        '<input class="nb-partpick__input" data-partpick-input type="text" placeholder="分区名称（如：读书笔记）" maxlength="20" />' +
      '</div>' +
      '<div class="nb-partpick__actions">' +
        '<button class="nb-add-pick__cancel" data-action="chat-partition-cancel">取消</button>' +
        '<button class="nb-btn nb-btn--primary nb-btn--sm" data-action="chat-create-partition">创建并归档</button>' +
      '</div>';
    var phone = $('[data-nb-root]') || $('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(sheet);
    var input = sheet.querySelector('[data-partpick-input]');
    if (input) { input.focus(); input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); doCreatePartition(); } }); }
  }

  function doCreatePartition() {
    var input = $('[data-partpick-input]');
    var name = input ? input.value.trim() : '';
    if (!name) { toast('请输入分区名称'); return; }
    var nbId = 'nb-chat-' + Date.now();
    var b = bridge();
    if (b && b.upsertNotebook) {
      b.upsertNotebook({ id: nbId, name: name, portfolioId: CHATS_PORTFOLIO_ID });
      nbVisibilityMap[nbId] = { scope: 'self', preview: 'hidden', paywall: 'free', scopeGroups: [], previewConfig: { chars: 200 } };
    }
    closePartitionPicker();
    saveChatToPartition(nbId);
  }

  /* 保存对话文件 + 总结文件到指定分区 */
  function saveChatToPartition(nbId) {
    if (!archiveCtx) { toast('归档上下文丢失'); return; }
    var b = bridge();
    if (!b || !b.upsertFile) { toast('数据桥未就绪'); return; }

    var ctx = archiveCtx;
    var ts = Date.now();

    /* 1. 保存对话文件（type='chat'） */
    var chatFile = b.upsertFile({
      id: 'chat-' + ts,
      type: 'chat',
      name: ctx.title,
      notebookId: nbId,
      content: {
        msgs: ctx.msgs,
        summary: ctx.summary,
        archivedAt: nowHm()
      }
    });
    /* chat 类型不在 note 路径，需手动同步 name/content */
    if (chatFile) {
      chatFile.name = ctx.title;
      chatFile.type = 'chat';
      chatFile.content = { msgs: ctx.msgs, summary: ctx.summary, archivedAt: nowHm() };
      chatFile.notebookId = nbId;
      chatFile.updatedAt = '刚刚';
    }

    /* 2. 保存总结文件（type='note'，body 为摘要文本） */
    var summaryTitle = '总结 · ' + ctx.title;
    b.upsertFile({
      id: 'chatsum-' + ts,
      type: 'note',
      title: summaryTitle,
      name: summaryTitle,
      notebookId: nbId,
      body: '<p>' + escapeHtml(ctx.summary).replace(/\n/g, '<br>') + '</p>',
      aiCo: true,
      spec: { type: 'doc', blocks: [{ type: 'text', text: ctx.summary }] }
    });

    archiveCtx = null;
    toast('已归档到「' + (findNotebookMeta(nbId) ? findNotebookMeta(nbId).label : '我的对话') + '」');

    /* 归档后返回工作台 */
    popView();
  }

  /* 自动保存钩子：离开对话页时自动归档到推荐分区（静默，不弹选择器） */
  function autoArchiveChat() {
    var msgs = chatMessages.slice();
    /* 仅在对话有实质内容（≥4 条消息）时自动保存 */
    if (msgs.length < 4) return;
    /* planning / redesign 模式不自动归档 */
    if (planState || redesignState) return;

    var b = bridge();
    if (!b || !b.upsertFile) return;

    var summary = buildChatSummary(msgs);
    var nbId = recommendPartition(msgs);
    var title = deriveChatTitle(msgs);
    var ts = Date.now();

    var chatFile = b.upsertFile({
      id: 'chat-auto-' + ts,
      type: 'chat',
      name: title,
      notebookId: nbId,
      content: {
        msgs: msgs,
        summary: summary,
        archivedAt: nowHm(),
        auto: true
      }
    });
    if (chatFile) {
      chatFile.name = title;
      chatFile.type = 'chat';
      chatFile.content = { msgs: msgs, summary: summary, archivedAt: nowHm(), auto: true };
      chatFile.notebookId = nbId;
      chatFile.updatedAt = '刚刚';
    }
  }

  function init() {
    if (! $('[data-nb-root]')) return;
    /* Task 2.4：让 bridge 持有 tasks（同引用）+ seed 对话数据，供子会话/状态读取 */
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.getTasks) { window.ZX_BRIDGE.getTasks(); }
    seedBridgeConvos();
    ensureChatsPortfolio();
    buildStaticBits();
    /* 工作区重设计：值班台 / 编辑器 / 任务看板 / 布置任务 */
    renderDuty();
    renderEditor();
    renderTaskboard();
    renderAssigntask();
    /* 旧 widget 仪表盘渲染（保留，待 T10 移除） */
    renderWidgets();
    renderKanban();
    renderChatList();
    renderChat();
    renderAttachTray();
    updateSendState();
    bindTopbarScroll();
    bindEvents();
    applyStack();
  }

  /* 暴露给 shell.js / agent.js / workflow.js 的公共 API */
  window.ZX_NOTEBOOK = {
    pushView: pushView,
    popView: popView,
    toggleView: toggleView,
    toast: toast,
    stack: function () { return stack.slice(); },
    currentView: function () { return stack[stack.length - 1]; }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
