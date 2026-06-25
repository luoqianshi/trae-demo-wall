/* =========================================================================
 * 「知行」App 本体 Demo —— 工作流页（workflow.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 工作流列表（含流程缩略图）
 *   2. 工作流节点编辑器（类 n8n，手机纵向排列）
 *   3. 节点增删 + Agent 绑定
 * 依赖：../../demo/shared/icons.js、notebook.js（暴露 ZX_NOTEBOOK）
 * 约束：原生 JS，无框架；通过 window.ZX_NOTEBOOK.pushView 进入
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function escapeHtml(s) { return String(s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }

  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }

  /* ----------------------------- 数据模型 ----------------------------- */
  /* F13: 节点添加 x,y 坐标，支持 n8n 风格画布布局 */
  var WORKFLOWS = [
    {
      id: 'wf-research', name: '搜索固态电池论文并整理', icon: 'research',
      desc: 'IEEE 检索 → 结构化精读 → 对比表 → 归档',
      steps: 5, agents: 4,
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '检索', agent: 'search', action: '检索 IEEE 论文', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '初稿', agent: 'lin', action: '写综述初稿', x: 140, y: 290 },
        { id: 'n4', type: 'branch', label: '专家审查', agent: 'research', action: '审查初稿', x: 140, y: 420 },
        { id: 'n5', type: 'task', label: '校验', agent: 'summary', action: '校验事实', x: 140, y: 560 },
        { id: 'n6', type: 'end', label: 'END', x: 140, y: 680 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5', branch: 'pass' },
        { from: 'n5', to: 'n6' }
      ],
      activeTasks: 2
    },
    {
      id: 'wf-write', name: '基于《界面阻抗分析》撰写文章', icon: 'write',
      desc: '提取要点 → 大纲 → 起草 → 润色 → 校对',
      steps: 4, agents: 3,
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '大纲', agent: 'lin', action: '生成大纲', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '起草', agent: 'lin', action: '起草正文', x: 140, y: 290 },
        { id: 'n4', type: 'task', label: '润色', agent: 'research', action: '润色语言', x: 140, y: 420 },
        { id: 'n5', type: 'task', label: '校对', agent: 'summary', action: '校对错别字', x: 140, y: 550 },
        { id: 'n6', type: 'end', label: 'END', x: 140, y: 670 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' },
        { from: 'n5', to: 'n6' }
      ],
      activeTasks: 1
    },
    {
      id: 'wf-search', name: '汇总本周笔记要点', icon: 'study',
      desc: '近 7 天笔记 → 提取要点 → 打标签 → 归档',
      steps: 3, agents: 2,
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '检索', agent: 'search', action: '多源检索', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '汇总', agent: 'summary', action: '汇总要点', x: 140, y: 290 },
        { id: 'n4', type: 'task', label: '归档', agent: 'lin', action: '打标签归档', x: 140, y: 420 },
        { id: 'n5', type: 'end', label: 'END', x: 140, y: 540 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' }
      ],
      activeTasks: 0
    }
  ];

  // 节点类型元数据
  var NODE_TYPES = {
    start: { label: 'START', color: 'jade', icon: '▶' },
    task: { label: '任务', color: 'gold', icon: '⚡' },
    branch: { label: '分支', color: 'purple', icon: '◆' },
    end: { label: 'END', color: 'cinnabar', icon: '■' }
  };

  /* 市场工作流（社区分享，可一键引入） */
  var MARKET_WORKFLOWS = [
    {
      id: 'mk-arxiv', name: 'arXiv 论文精读流水线', icon: 'research',
      desc: 'arXiv 检索 → 结构化精读 → 要点卡片 → 归档',
      steps: 5, agents: 4, uses: 128, author: '学者·周',
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: 'arXiv 检索', agent: 'search', action: '语义检索 arXiv', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '结构化精读', agent: 'reader', action: '抽取章节要点', x: 140, y: 290 },
        { id: 'n4', type: 'task', label: '卡片化', agent: 'lin', action: '生成要点卡片', x: 140, y: 420 },
        { id: 'n5', type: 'task', label: '归档', agent: 'summary', action: '打标签归档', x: 140, y: 550 },
        { id: 'n6', type: 'end', label: 'END', x: 140, y: 670 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' },
        { from: 'n5', to: 'n6' }
      ]
    },
    {
      id: 'mk-debate', name: '正反观点辩论', icon: 'study',
      desc: '收集论点 → 自动找反例 → 生成辩论卡',
      steps: 4, agents: 3, uses: 86, author: '辩手·林', category: '辩论',
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '收集论点', agent: 'search', action: '多源论点收集', x: 140, y: 160 },
        { id: 'n3', type: 'branch', label: '找反例', agent: 'research', action: '检索反例与对立证据', x: 140, y: 290 },
        { id: 'n4', type: 'task', label: '辩论卡', agent: 'lin', action: '生成正反对照卡', x: 140, y: 420 },
        { id: 'n5', type: 'end', label: 'END', x: 140, y: 540 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' }
      ]
    },
    {
      id: 'mk-daily', name: '每日知识回顾', icon: 'write',
      desc: '当日笔记 → 提取要点 → 间隔复习卡片',
      steps: 3, agents: 2, uses: 203, author: '学霸·陈', category: '效率',
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '提取要点', agent: 'summary', action: '当日笔记摘要', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '复习卡', agent: 'lin', action: '生成间隔复习卡', x: 140, y: 290 },
        { id: 'n4', type: 'end', label: 'END', x: 140, y: 410 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }
      ]
    },
    {
      id: 'mk-translate', name: '多语言翻译流水线', icon: 'write',
      desc: '检测 → 翻译 → 校对 → 格式化',
      steps: 4, agents: 3, uses: 67, author: '译者·王', category: '写作',
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '语言检测', agent: 'search', action: '检测源语言', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '翻译', agent: 'lin', action: '翻译为目标语言', x: 140, y: 290 },
        { id: 'n4', type: 'task', label: '校对', agent: 'research', action: '校对译文', x: 140, y: 420 },
        { id: 'n5', type: 'task', label: '格式化', agent: 'summary', action: '格式化输出', x: 140, y: 550 },
        { id: 'n6', type: 'end', label: 'END', x: 140, y: 670 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' },
        { from: 'n5', to: 'n6' }
      ]
    },
    {
      id: 'mk-summarize', name: '会议纪要生成', icon: 'study',
      desc: '录音转写 → 提取要点 → 生成纪要 → 发送',
      steps: 4, agents: 2, uses: 156, author: '助理·李', category: '效率',
      nodes: [
        { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
        { id: 'n2', type: 'task', label: '录音转写', agent: 'search', action: '语音转文字', x: 140, y: 160 },
        { id: 'n3', type: 'task', label: '提取要点', agent: 'summary', action: '提取关键信息', x: 140, y: 290 },
        { id: 'n4', type: 'task', label: '生成纪要', agent: 'lin', action: '生成会议纪要', x: 140, y: 420 },
        { id: 'n5', type: 'end', label: 'END', x: 140, y: 540 }
      ],
      edges: [
        { from: 'n1', to: 'n2' }, { from: 'n2', to: 'n3' },
        { from: 'n3', to: 'n4' }, { from: 'n4', to: 'n5' }
      ]
    }
  ];

  // 头像渐变（与 agent.js 一致）
  var AVATAR_GRADIENTS = {
    lin: 'linear-gradient(135deg,#C7A24A,#e8d091)',
    zhou: 'linear-gradient(135deg,#1D5B7A,#5a9bbd)',
    sch: 'linear-gradient(135deg,#2F855A,#68b786)',
    chk: 'linear-gradient(135deg,#C1272D,#e07175)'
  };

  function avatarBg(id) { return AVATAR_GRADIENTS[id] || AVATAR_GRADIENTS.lin; }
  function agentInitial(id) {
    var names = { lin: '林', search: '检', research: '研', summary: '总', reader: '读' };
    return names[id] || '?';
  }

  function findWorkflow(id) {
    for (var i = 0; i < WORKFLOWS.length; i++) { if (WORKFLOWS[i].id === id) return WORKFLOWS[i]; }
    return null;
  }

  /* ----------------------------- 渲染：工作流列表 ----------------------------- */

  function renderTopbar(title) {
    return '<header class="wf-topbar">' +
      '<button class="wf-back" data-action="wf-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
      '<h2 class="wf-title">' + escapeHtml(title) + '</h2>' +
      '<div class="wf-top-actions">' +
      '<button class="wf-icon-btn" data-action="wf-search" aria-label="搜索">' + svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') + '</button>' +
      '</div>' +
      '</header>';
  }

  function renderFlowThumbnail(nodes) {
    var html = '';
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.type === 'start' || n.type === 'end') continue;
      if (i > 1) html += '<span class="wf-step-arrow">→</span>';
      html += '<span class="wf-step">' +
        '<span class="wf-step__av" style="background:' + avatarBg(n.agent) + '">' + escapeHtml(agentInitial(n.agent)) + '</span>' +
        '<span class="wf-step__label">' + escapeHtml(n.label) + '</span>' +
      '</span>';
    }
    return html;
  }

  function renderWorkflowCard(w) {
    var used = w.activeTasks > 0
      ? '<span class="wf-card__used">● ' + w.activeTasks + ' 个任务使用</span>'
      : '<span class="wf-card__used wf-card__used--idle">空闲</span>';
    var iconBg = w.icon === 'research' ? 'linear-gradient(135deg,#1D5B7A,#5a9bbd)'
      : w.icon === 'study' ? 'linear-gradient(135deg,#2F855A,#68b786)'
      : 'linear-gradient(135deg,#C7A24A,#e8d091)';
    var iconChar = w.icon === 'research' ? '🔬' : w.icon === 'study' ? '📚' : '✍';
    return '<article class="wf-card" data-action="wf-open" data-id="' + w.id + '">' +
      '<div class="wf-card__head">' +
        '<div class="wf-card__icon" style="background:' + iconBg + '">' + iconChar + '</div>' +
        '<div class="wf-card__info"><div class="wf-card__name">' + escapeHtml(w.name) + '</div><div class="wf-card__desc">' + escapeHtml(w.desc) + '</div></div>' +
        '<span class="wf-card__arrow">›</span>' +
      '</div>' +
      '<div class="wf-card__flow">' + renderFlowThumbnail(w.nodes) + '</div>' +
      '<div class="wf-card__foot">' + used + '<span class="wf-card__meta">' + w.steps + ' 步 · ' + w.agents + ' Agent</span></div>' +
    '</article>';
  }

  function renderWorkflowList() {
    var root = $('[data-workflow-root]');
    if (!root) return;
    var cards = WORKFLOWS.map(renderWorkflowCard).join('');
    root.innerHTML = renderTopbar('工作流') +
      '<div class="wf-list">' + cards +
        '<button class="wf-add" data-action="wf-add">+ 新建工作流</button>' +
      '</div>';
  }

  /* ----------------------------- 渲染：新建工作流 ----------------------------- */
  function renderWorkflowNew() {
    var root = $('[data-wf-new-root]');
    if (!root) return;

    /* 市场分类标签 */
    var marketCats = ['全部', '研究', '写作', '效率', '辩论'];
    var tabsHtml = marketCats.map(function (c) {
      var active = c === wfMarketFilter ? ' is-active' : '';
      return '<button class="wf-new-market-tab' + active + '" data-action="wf-market-filter" data-cat="' + c + '">' + c + '</button>';
    }).join('');

    /* 市场卡片（按分类过滤）*/
    var marketCards = MARKET_WORKFLOWS.filter(function (w) {
      return wfMarketFilter === '全部' || w.category === wfMarketFilter;
    }).map(function (w) {
      var iconBg = w.icon === 'research' ? 'linear-gradient(135deg,#1D5B7A,#5a9bbd)'
        : w.icon === 'study' ? 'linear-gradient(135deg,#2F855A,#68b786)'
        : 'linear-gradient(135deg,#C7A24A,#e8d091)';
      var iconChar = w.icon === 'research' ? '🔬' : w.icon === 'study' ? '📚' : '✍';
      var previewHtml = '';
      if (wfPreviewId === w.id) {
        previewHtml = '<div class="wf-new-card__preview">' + renderFlowThumbnail(w.nodes) + '</div>';
      }
      return '<article class="wf-new-card" data-action="wf-new-import" data-id="' + w.id + '">' +
        '<div class="wf-new-card__head">' +
          '<div class="wf-new-card__icon" style="background:' + iconBg + '">' + iconChar + '</div>' +
          '<div class="wf-new-card__info">' +
            '<div class="wf-new-card__name">' + escapeHtml(w.name) + '</div>' +
            '<div class="wf-new-card__author">by ' + escapeHtml(w.author) + ' · ' + w.uses + ' 人在用</div>' +
          '</div>' +
          '<span class="wf-new-card__btn">引入</span>' +
        '</div>' +
        '<p class="wf-new-card__desc">' + escapeHtml(w.desc) + '</p>' +
        '<div class="wf-new-card__meta">' + w.steps + ' 步 · ' + w.agents + ' Agent</div>' +
        '<button class="wf-new-card__preview-btn" data-action="wf-new-preview" data-id="' + w.id + '">' +
          (wfPreviewId === w.id ? '收起' : '预览') +
        '</button>' +
        previewHtml +
      '</article>';
    }).join('');

    /* 空白创建表单分类 */
    var formCats = ['研究', '写作', '检索', '操作', '自定义'];
    var catHtml = formCats.map(function (c) {
      var active = c === wfNewFormState.category ? ' is-active' : '';
      return '<button class="wf-new-cat' + active + '" data-action="wf-new-cat" data-cat="' + c + '">' + c + '</button>';
    }).join('');

    root.innerHTML =
      '<header class="wf-topbar">' +
        '<button class="wf-back" data-action="wf-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="wf-title">新建工作流</h2>' +
        '<span class="wf-top-actions"></span>' +
      '</header>' +
      '<div class="wf-new-scroll">' +
        '<section class="wf-new-section">' +
          '<h3 class="wf-new-section__h">从空白创建</h3>' +
          '<p class="wf-new-section__sub">自己搭建流程节点，布置任务时再配置细节</p>' +
          '<div class="wf-new-form">' +
            '<input class="wf-new-input" data-wf-new-name type="text" placeholder="工作流名称" value="' + escapeHtml(wfNewFormState.name) + '" />' +
            '<input class="wf-new-input" data-wf-new-desc type="text" placeholder="简述工作流用途" value="' + escapeHtml(wfNewFormState.desc) + '" />' +
            '<div class="wf-new-cat-row">' + catHtml + '</div>' +
            '<button class="wf-new-create" data-action="wf-new-blank">创建</button>' +
          '</div>' +
        '</section>' +
        '<section class="wf-new-section">' +
          '<h3 class="wf-new-section__h">从市场引入</h3>' +
          '<p class="wf-new-section__sub">社区分享的方法论，一键复制到我的工作流</p>' +
          '<div class="wf-new-market-tabs">' + tabsHtml + '</div>' +
          '<div class="wf-new-market">' + marketCards + '</div>' +
        '</section>' +
      '</div>';
  }

  /* ----------------------------- 渲染：n8n 风格画布节点编辑器 -----------------------------
   * F13: 类 n8n 画布 —— 可 pan/zoom/drag，节点点击进入智能体配置
   * 节点配置与智能体配置合并：点击节点 → 选择/新建 Agent → 配置
   * ------------------------------------------------------------------------- */
  var NODE_W = 120, NODE_H = 56;
  var canvasState = { panX: 0, panY: 0, scale: 1, gesture: null };

  /* 新建工作流表单状态 / 市场筛选 / 预览 / 添加节点弹层 */
  var wfNewFormState = { name: '', desc: '', category: '研究' };
  var wfMarketFilter = '全部';
  var wfPreviewId = null;
  var wfAddSheetOpen = false;
  var currentEditId = null;

  function nodePort(n, kind) {
    /* kind: 'in' (top center) | 'out' (bottom center) */
    if (kind === 'in') return { x: n.x + NODE_W / 2, y: n.y };
    return { x: n.x + NODE_W / 2, y: n.y + NODE_H };
  }

  function edgePath(from, to) {
    var p1 = nodePort(from, 'out');
    var p2 = nodePort(to, 'in');
    var midY = (p1.y + p2.y) / 2;
    return 'M' + p1.x + ',' + p1.y +
      ' C' + p1.x + ',' + midY +
      ' ' + p2.x + ',' + midY +
      ' ' + p2.x + ',' + p2.y;
  }

  function renderCanvasNode(n) {
    var meta = NODE_TYPES[n.type] || NODE_TYPES.task;
    var agentHtml = '';
    if (n.agent) {
      agentHtml = '<div class="wf-nd__agent">' +
        '<span class="wf-nd__av" style="background:' + avatarBg(n.agent) + '">' + escapeHtml(agentInitial(n.agent)) + '</span>' +
        '<span class="wf-nd__agent-name">' + escapeHtml(n.label) + '</span>' +
      '</div>';
    } else {
      agentHtml = '<span class="wf-nd__title">' + escapeHtml(n.label) + '</span>';
    }
    var typeBadge = (n.type !== 'start' && n.type !== 'end')
      ? '<span class="wf-nd__type wf-nd__type--' + n.type + '">' + escapeHtml(meta.label) + '</span>'
      : '';
    return '<div class="wf-nd wf-nd--' + n.type + '" data-node-id="' + n.id + '" style="left:' + n.x + 'px;top:' + n.y + 'px;width:' + NODE_W + 'px">' +
      '<span class="wf-nd__port wf-nd__port--in" data-port="in"></span>' +
      '<div class="wf-nd__body">' +
        '<span class="wf-nd__icon">' + meta.icon + '</span>' +
        agentHtml +
        typeBadge +
      '</div>' +
      '<span class="wf-nd__port wf-nd__port--out" data-port="out"></span>' +
    '</div>';
  }

  function renderWorkflowEdit(id) {
    var w = findWorkflow(id);
    if (!w) return;
    var root = $('[data-workflow-edit-root]');
    if (!root) return;

    /* F13d: 重置画布状态（每次渲染都从默认位置开始） */
    canvasState = { panX: 0, panY: 0, scale: 1, gesture: null };
    currentEditId = id;
    wfAddSheetOpen = false;

    var iconBg = w.icon === 'research' ? 'linear-gradient(135deg,#1D5B7A,#5a9bbd)'
      : w.icon === 'study' ? 'linear-gradient(135deg,#2F855A,#68b786)'
      : 'linear-gradient(135deg,#C7A24A,#e8d091)';
    var iconChar = w.icon === 'research' ? '🔬' : w.icon === 'study' ? '📚' : '✍';

    /* 渲染节点 HTML */
    var nodesHtml = w.nodes.map(renderCanvasNode).join('');

    /* 渲染 SVG 连线 */
    var edgesSvg = w.edges.map(function (e) {
      var from = null, to = null;
      for (var i = 0; i < w.nodes.length; i++) {
        if (w.nodes[i].id === e.from) from = w.nodes[i];
        if (w.nodes[i].id === e.to) to = w.nodes[i];
      }
      if (!from || !to) return '';
      var cls = e.branch ? 'wf-edge--' + e.branch : '';
      return '<path class="wf-edge ' + cls + '" d="' + edgePath(from, to) + '"/>';
    }).join('');

    /* 计算 SVG viewBox */
    var maxY = 0;
    w.nodes.forEach(function (n) { if (n.y > maxY) maxY = n.y; });
    var svgH = maxY + NODE_H + 40;

    root.innerHTML =
      '<header class="wf-edit-topbar">' +
        '<button class="wf-back" data-action="wf-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="wf-edit-title">节点编辑</h2>' +
        '<button class="wf-edit-save" data-action="wf-save">保存</button>' +
      '</header>' +
      '<div class="wf-edit-hero">' +
        '<div class="wf-edit-icon" style="background:' + iconBg + '">' + iconChar + '</div>' +
        '<div class="wf-edit-info"><div class="wf-edit-name">' + escapeHtml(w.name) + '</div><div class="wf-edit-desc">' + escapeHtml(w.desc) + '</div></div>' +
        '<button class="wf-edit-editname" data-action="wf-edit-name">编辑</button>' +
      '</div>' +
      '<div class="wf-canvas" data-wf-canvas>' +
        '<div class="wf-canvas__inner" data-wf-canvas-inner style="transform: translate(0,0) scale(1)">' +
          '<svg class="wf-canvas__svg" width="400" height="' + svgH + '" viewBox="0 0 400 ' + svgH + '">' +
            '<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="rgba(107,101,92,0.4)"/></marker></defs>' +
            edgesSvg +
          '</svg>' +
          nodesHtml +
        '</div>' +
        '<div class="wf-canvas__controls">' +
          '<button class="wf-canvas__btn" data-action="wf-zoom-in" aria-label="放大">+</button>' +
          '<button class="wf-canvas__btn" data-action="wf-zoom-out" aria-label="缩小">−</button>' +
          '<button class="wf-canvas__btn" data-action="wf-zoom-reset" aria-label="重置缩放">⊙</button>' +
        '</div>' +
        '<div class="wf-canvas__hint">拖拽节点移动 · 双指缩放 · 点击节点配置</div>' +
      '</div>' +
      '<div class="wf-edit-drawer">' +
        '<button class="wf-edit-add" data-action="wf-add-node">+ 添加节点</button>' +
      '</div>';

    /* 初始化画布手势 */
    initCanvasGestures(root, w);
  }

  /* 画布手势：pan / zoom / node drag */
  function initCanvasGestures(root, w) {
    var canvas = $('[data-wf-canvas]', root);
    var inner = $('[data-wf-canvas-inner]', root);
    if (!canvas || !inner) return;

    function applyTransform() {
      inner.style.transform = 'translate(' + canvasState.panX + 'px,' + canvasState.panY + 'px) scale(' + canvasState.scale + ')';
    }

    /* 缩放按钮 */
    function setZoom(newScale, centerX, centerY) {
      newScale = Math.max(0.4, Math.min(2.5, newScale));
      if (centerX != null && centerY != null) {
        /* 以指定点为中心缩放 */
        var dx = (centerX - canvasState.panX) * (newScale / canvasState.scale - 1);
        var dy = (centerY - canvasState.panY) * (newScale / canvasState.scale - 1);
        canvasState.panX -= dx;
        canvasState.panY -= dy;
      }
      canvasState.scale = newScale;
      applyTransform();
    }

    /* 点击事件（delegate）—— 节点点击 + 缩放按钮 */
    canvas.addEventListener('click', function (e) {
      /* 缩放按钮 */
      var zoomEl = e.target.closest('[data-action^="wf-zoom"]');
      if (zoomEl) {
        var zAction = zoomEl.getAttribute('data-action');
        if (zAction === 'wf-zoom-in') setZoom(canvasState.scale * 1.2);
        else if (zAction === 'wf-zoom-out') setZoom(canvasState.scale * 0.8);
        else if (zAction === 'wf-zoom-reset') { canvasState.panX = 0; canvasState.panY = 0; canvasState.scale = 1; applyTransform(); }
        return;
      }
      /* 节点点击 */
      var ndEl = e.target.closest('[data-node-id]');
      if (ndEl) {
        var nodeId = ndEl.getAttribute('data-node-id');
        var node = null;
        for (var i = 0; i < w.nodes.length; i++) { if (w.nodes[i].id === nodeId) node = w.nodes[i]; }
        if (node && node.type !== 'start' && node.type !== 'end') {
          /* F13d: 节点点击 → 智能体配置（合并），传递 nodeId 让配置页显示 Agent 选择器 */
          var agentId = node.agent || 'lin';
          var nb = window.ZX_NOTEBOOK;
          if (window.ZX_AGENT && window.ZX_AGENT.renderAgentConfig) {
            window.ZX_AGENT.renderAgentConfig(agentId, {
              nodeId: nodeId, workflowId: w.id, nodeLabel: node.label, nodeType: node.type,
              nodeAction: node.action || '',
              nodeInputs: node.inputs || []
            });
          }
          if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'agent', id: agentId, nodeId: nodeId, workflowId: w.id });
        }
        return;
      }
    });

    /* 触摸手势 */
    var touchState = null;

    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 1) {
        var t = e.touches[0];
        var ndEl = e.target.closest('[data-node-id]');
        if (ndEl) {
          /* 节点拖拽 */
          var nodeId = ndEl.getAttribute('data-node-id');
          var node = null;
          for (var i = 0; i < w.nodes.length; i++) { if (w.nodes[i].id === nodeId) node = w.nodes[i]; }
          if (node) {
            var rect = canvas.getBoundingClientRect();
            touchState = {
              mode: 'drag-node',
              nodeId: nodeId,
              startTx: t.clientX, startTy: t.clientY,
              startNodeX: node.x, startNodeY: node.y,
              canvasRect: rect,
              moved: false
            };
            ndEl.classList.add('is-dragging');
          }
        } else {
          /* 画布平移 */
          touchState = {
            mode: 'pan',
            startTx: t.clientX, startTy: t.clientY,
            startPanX: canvasState.panX, startPanY: canvasState.panY,
            moved: false
          };
        }
      } else if (e.touches.length === 2) {
        /* 双指缩放 */
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        touchState = {
          mode: 'pinch',
          startDist: dist,
          startScale: canvasState.scale
        };
      }
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
      if (!touchState) return;
      e.preventDefault();
      if (touchState.mode === 'pan' && e.touches.length === 1) {
        var t = e.touches[0];
        var dx = t.clientX - touchState.startTx;
        var dy = t.clientY - touchState.startTy;
        if (Math.abs(dx) > 3 || Math.abs(dy) > 3) touchState.moved = true;
        canvasState.panX = touchState.startPanX + dx;
        canvasState.panY = touchState.startPanY + dy;
        applyTransform();
      } else if (touchState.mode === 'drag-node' && e.touches.length === 1) {
        var t = e.touches[0];
        var dx = (t.clientX - touchState.startTx) / canvasState.scale;
        var dy = (t.clientY - touchState.startTy) / canvasState.scale;
        if (Math.abs(dx) > 2 || Math.abs(dy) > 2) touchState.moved = true;
        var node = null;
        for (var i = 0; i < w.nodes.length; i++) { if (w.nodes[i].id === touchState.nodeId) node = w.nodes[i]; }
        if (node) {
          node.x = touchState.startNodeX + dx;
          node.y = touchState.startNodeY + dy;
          var ndEl = canvas.querySelector('[data-node-id="' + touchState.nodeId + '"]');
          if (ndEl) {
            ndEl.style.left = node.x + 'px';
            ndEl.style.top = node.y + 'px';
          }
          /* 更新连线 */
          updateEdges(canvas, w);
        }
      } else if (touchState.mode === 'pinch' && e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var dist = Math.sqrt(dx * dx + dy * dy);
        var ratio = dist / touchState.startDist;
        setZoom(touchState.startScale * ratio);
      }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
      if (touchState && touchState.mode === 'drag-node') {
        var ndEl = canvas.querySelector('[data-node-id="' + touchState.nodeId + '"]');
        if (ndEl) ndEl.classList.remove('is-dragging');
        /* 如果没有移动，视为点击（让 click 事件处理） */
        if (touchState.moved) {
          e.preventDefault();
          e.stopPropagation();
        }
      }
      if (e.touches.length === 0) touchState = null;
    });

    /* 鼠标手势（桌面调试）*/
    var mouseState = null;
    canvas.addEventListener('mousedown', function (e) {
      var ndEl = e.target.closest('[data-node-id]');
      if (ndEl) {
        var nodeId = ndEl.getAttribute('data-node-id');
        var node = null;
        for (var i = 0; i < w.nodes.length; i++) { if (w.nodes[i].id === nodeId) node = w.nodes[i]; }
        if (node) {
          mouseState = { mode: 'drag-node', nodeId: nodeId, startMx: e.clientX, startMy: e.clientY, startNodeX: node.x, startNodeY: node.y };
          ndEl.classList.add('is-dragging');
          e.preventDefault();
        }
      } else {
        mouseState = { mode: 'pan', startMx: e.clientX, startMy: e.clientY, startPanX: canvasState.panX, startPanY: canvasState.panY };
      }
    });
    document.addEventListener('mousemove', function (e) {
      if (!mouseState) return;
      if (mouseState.mode === 'pan') {
        canvasState.panX = mouseState.startPanX + (e.clientX - mouseState.startMx);
        canvasState.panY = mouseState.startPanY + (e.clientY - mouseState.startMy);
        applyTransform();
      } else if (mouseState.mode === 'drag-node') {
        var dx = (e.clientX - mouseState.startMx) / canvasState.scale;
        var dy = (e.clientY - mouseState.startMy) / canvasState.scale;
        var node = null;
        for (var i = 0; i < w.nodes.length; i++) { if (w.nodes[i].id === mouseState.nodeId) node = w.nodes[i]; }
        if (node) {
          node.x = mouseState.startNodeX + dx;
          node.y = mouseState.startNodeY + dy;
          var ndEl = canvas.querySelector('[data-node-id="' + mouseState.nodeId + '"]');
          if (ndEl) { ndEl.style.left = node.x + 'px'; ndEl.style.top = node.y + 'px'; }
          updateEdges(canvas, w);
        }
      }
    });
    document.addEventListener('mouseup', function () {
      if (mouseState && mouseState.mode === 'drag-node') {
        var ndEl = canvas.querySelector('[data-node-id="' + mouseState.nodeId + '"]');
        if (ndEl) ndEl.classList.remove('is-dragging');
      }
      mouseState = null;
    });

    /* 滚轮缩放（桌面）*/
    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var cx = e.clientX - rect.left;
      var cy = e.clientY - rect.top;
      var delta = e.deltaY > 0 ? 0.9 : 1.1;
      setZoom(canvasState.scale * delta, cx, cy);
    }, { passive: false });
  }

  /* 更新 SVG 连线（节点拖拽后）*/
  function updateEdges(canvas, w) {
    var svg = canvas.querySelector('.wf-canvas__svg');
    if (!svg) return;
    var paths = svg.querySelectorAll('.wf-edge');
    w.edges.forEach(function (e, i) {
      var from = null, to = null;
      for (var j = 0; j < w.nodes.length; j++) {
        if (w.nodes[j].id === e.from) from = w.nodes[j];
        if (w.nodes[j].id === e.to) to = w.nodes[j];
      }
      if (from && to && paths[i]) {
        paths[i].setAttribute('d', edgePath(from, to));
      }
    });
  }

  /* ----------------------------- 添加节点弹层 ----------------------------- */

  function renderAddSheet() {
    var w = findWorkflow(currentEditId);
    if (!w) return '';

    var hasStart = w.nodes.some(function (n) { return n.type === 'start'; });
    var hasEnd = w.nodes.some(function (n) { return n.type === 'end'; });

    var types = [
      { type: 'task', icon: '⚡', name: '任务节点', desc: '绑定 Agent 执行任务' },
      { type: 'branch', icon: '◆', name: '分支节点', desc: '条件分支判断' }
    ];
    if (!hasStart) types.push({ type: 'start', icon: '▶', name: '起点节点', desc: '工作流起点' });
    if (!hasEnd) types.push({ type: 'end', icon: '■', name: '终点节点', desc: '工作流终点' });

    var listHtml = types.map(function (t) {
      return '<button class="wf-add-sheet__type" data-action="wf-add-pick-type" data-type="' + t.type + '">' +
        '<span class="wf-add-sheet__icon">' + t.icon + '</span>' +
        '<div><div class="wf-add-sheet__name">' + t.name + '</div><div class="wf-add-sheet__desc">' + t.desc + '</div></div>' +
      '</button>';
    }).join('');

    return '<div class="wf-add-sheet-scrim" data-action="wf-add-close"></div>' +
      '<div class="wf-add-sheet">' +
        '<div class="wf-add-sheet__handle"></div>' +
        '<h3 class="wf-add-sheet__title">添加节点</h3>' +
        '<div class="wf-add-sheet__list">' + listHtml + '</div>' +
      '</div>';
  }

  function openAddSheet() {
    var editRoot = $('[data-workflow-edit-root]');
    if (!editRoot) return;
    closeAddSheet();
    var sheetWrap = document.createElement('div');
    sheetWrap.className = 'wf-add-sheet-wrap';
    sheetWrap.setAttribute('data-wf-add-sheet', '');
    sheetWrap.innerHTML = renderAddSheet();
    editRoot.appendChild(sheetWrap);
    wfAddSheetOpen = true;
  }

  function closeAddSheet() {
    var editRoot = $('[data-workflow-edit-root]');
    if (!editRoot) { wfAddSheetOpen = false; return; }
    var sheet = $('[data-wf-add-sheet]', editRoot);
    if (sheet) sheet.remove();
    wfAddSheetOpen = false;
  }

  function addNodeType(type) {
    var w = findWorkflow(currentEditId);
    if (!w) return;

    /* 找到最后一个节点（y 最大）*/
    var lastNode = null;
    var maxY = -1;
    w.nodes.forEach(function (n) {
      if (n.y > maxY) { maxY = n.y; lastNode = n; }
    });

    /* 自增 id */
    var maxNum = 0;
    w.nodes.forEach(function (n) {
      var num = parseInt(n.id.replace('n', ''), 10);
      if (!isNaN(num) && num > maxNum) maxNum = num;
    });
    var newId = 'n' + (maxNum + 1);

    /* 创建节点 */
    var meta = NODE_TYPES[type] || NODE_TYPES.task;
    var newNode = {
      id: newId,
      type: type,
      label: meta.label,
      x: 140,
      y: lastNode ? lastNode.y + 130 : 40
    };
    if (type === 'task') {
      newNode.agent = 'lin';
      newNode.action = '';
    }

    w.nodes.push(newNode);

    /* 自动连线（从最后节点到新节点）*/
    if (lastNode && lastNode.type !== 'end') {
      w.edges.push({ from: lastNode.id, to: newId });
    }

    /* 重新渲染画布 */
    renderWorkflowEdit(w.id);

    /* 任务节点：立即打开 Agent 配置进行绑定 */
    if (type === 'task' && window.ZX_AGENT && window.ZX_AGENT.renderAgentConfig) {
      var agentId = newNode.agent || 'lin';
      window.ZX_AGENT.renderAgentConfig(agentId, {
        nodeId: newId, workflowId: w.id, nodeLabel: newNode.label, nodeType: type,
        nodeAction: newNode.action || '',
        nodeInputs: newNode.inputs || []
      });
      var nb = window.ZX_NOTEBOOK;
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'agent', id: agentId, nodeId: newId, workflowId: w.id });
    }
  }

  /* 保存新建表单输入值（在重新渲染前调用）*/
  function saveNewFormInputs() {
    var nameInput = $('[data-wf-new-name]');
    var descInput = $('[data-wf-new-desc]');
    if (nameInput) wfNewFormState.name = nameInput.value;
    if (descInput) wfNewFormState.desc = descInput.value;
  }

  /* ----------------------------- 交互 ----------------------------- */

  function onClick(e) {
    var actEl = e.target.closest('[data-action]');
    if (!actEl) return;
    var action = actEl.getAttribute('data-action');
    var nb = window.ZX_NOTEBOOK;

    if (action === 'wf-back') {
      if (nb && nb.popView) nb.popView();
      return;
    }
    if (action === 'wf-open') {
      var id = actEl.getAttribute('data-id');
      renderWorkflowEdit(id);
      if (nb && nb.pushView) nb.pushView('workflow-edit', { id: id });
      return;
    }
    if (action === 'wf-add') {
      if (nb && nb.pushView) nb.pushView('wf-new');
      return;
    }
    if (action === 'wf-new-blank') {
      saveNewFormInputs();
      var newName = wfNewFormState.name.trim() || '未命名工作流';
      var newDesc = wfNewFormState.desc.trim() || '自定义工作流';
      var catIcon = wfNewFormState.category === '研究' ? 'research'
        : wfNewFormState.category === '写作' ? 'write' : 'study';
      var newWfId = 'wf-blank-' + Date.now();
      WORKFLOWS.push({
        id: newWfId, name: newName, icon: catIcon,
        desc: newDesc, steps: 2, agents: 0,
        nodes: [
          { id: 'n1', type: 'start', label: 'START', x: 140, y: 40 },
          { id: 'n2', type: 'end', label: 'END', x: 140, y: 170 }
        ],
        edges: [{ from: 'n1', to: 'n2' }],
        activeTasks: 0
      });
      /* 重置表单状态 */
      wfNewFormState = { name: '', desc: '', category: '研究' };
      if (nb && nb.popView) nb.popView();
      renderWorkflowEdit(newWfId);
      if (nb && nb.pushView) nb.pushView('workflow-edit', { id: newWfId });
      if (nb && nb.toast) nb.toast('已创建「' + newName + '」');
      return;
    }
    if (action === 'wf-new-cat') {
      saveNewFormInputs();
      wfNewFormState.category = actEl.getAttribute('data-cat');
      renderWorkflowNew();
      return;
    }
    if (action === 'wf-new-preview') {
      saveNewFormInputs();
      var previewId = actEl.getAttribute('data-id');
      wfPreviewId = (wfPreviewId === previewId) ? null : previewId;
      renderWorkflowNew();
      return;
    }
    if (action === 'wf-market-filter') {
      saveNewFormInputs();
      wfMarketFilter = actEl.getAttribute('data-cat');
      wfPreviewId = null;
      renderWorkflowNew();
      return;
    }
    if (action === 'wf-new-import') {
      var importId = actEl.getAttribute('data-id');
      var tpl = null;
      for (var i = 0; i < MARKET_WORKFLOWS.length; i++) { if (MARKET_WORKFLOWS[i].id === importId) tpl = MARKET_WORKFLOWS[i]; }
      if (tpl) {
        WORKFLOWS.push({
          id: 'wf-imp-' + Date.now(), name: tpl.name, icon: tpl.icon,
          desc: tpl.desc, steps: tpl.steps, agents: tpl.agents,
          nodes: tpl.nodes.map(function (n) { return Object.assign({}, n); }),
          edges: tpl.edges.map(function (e) { return Object.assign({}, e); }),
          activeTasks: 0
        });
        if (nb && nb.toast) nb.toast('已引入「' + tpl.name + '」');
      }
      if (nb && nb.popView) nb.popView();
      return;
    }
    if (action === 'wf-add-node') {
      if (wfAddSheetOpen) closeAddSheet();
      else openAddSheet();
      return;
    }
    if (action === 'wf-add-close') {
      closeAddSheet();
      return;
    }
    if (action === 'wf-add-pick-type') {
      var pickType = actEl.getAttribute('data-type');
      closeAddSheet();
      addNodeType(pickType);
      return;
    }
    if (action === 'wf-save') {
      if (nb && nb.toast) nb.toast('工作流已保存');
      if (nb && nb.popView) nb.popView();
      return;
    }
    if (action === 'wf-edit-name') {
      if (nb && nb.toast) nb.toast('编辑名称（demo）');
      return;
    }
    if (action === 'wf-search') {
      if (nb && nb.toast) nb.toast('搜索（demo）');
      return;
    }
  }

  /* ----------------------------- 初始化 ----------------------------- */

  function init() {
    var root = $('[data-workflow-root]');
    if (!root) return;
    renderWorkflowList();
    root.addEventListener('click', onClick);

    var editRoot = $('[data-workflow-edit-root]');
    if (editRoot) editRoot.addEventListener('click', onClick);

    var newRoot = $('[data-wf-new-root]');
    if (newRoot) newRoot.addEventListener('click', onClick);
  }

  window.ZX_WORKFLOW = {
    init: init,
    renderWorkflowList: renderWorkflowList,
    renderWorkflowEdit: renderWorkflowEdit,
    renderWorkflowNew: renderWorkflowNew,
    WORKFLOWS: WORKFLOWS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
