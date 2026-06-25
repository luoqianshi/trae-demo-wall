/* =========================================================================
 * 「知行」App 本体 Demo —— 智能体与团队页（agent.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 智能体列表 + 团队列表（同页 tab 切换）
 *   2. 智能体配置页（简单/高级/引入 三 tab）
 *   3. 团队配置页（成员管理 + 使用历史）
 * 依赖：../../demo/shared/icons.js、notebook.js（暴露 ZX_AGENTS）
 * 约束：原生 JS，无框架；通过 window.ZX_NOTEBOOK.pushView 进入
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

  /* ----------------------------- 数据模型 ----------------------------- */
  // 智能体列表（从 notebook.js 的 AGENTS 派生扩展）
  var AGENTS_LIST = [
    { id: 'lin', name: '林', role: '主智能体', desc: '你的主智能体，长记忆，专属你。负责综合决策与调度。', avatar: 'lin', isMain: true },
    { id: 'search', name: '检索员', role: '信息检索', desc: '联网与内部库检索，返回事实。', avatar: 'sch' },
    { id: 'research', name: '研究员', role: '深度调研', desc: '多轮深度调研，能写综述。', avatar: 'zhou' },
    { id: 'summary', name: '总结员', role: '内容总结', desc: '对笔记/文档生成结构化总结。', avatar: 'chk' },
    { id: 'reader', name: '陪读员', role: 'PDF 陪读', desc: '陪读 PDF/论文，边读边聊，抽取关键论点。', avatar: 'lin' }
  ];

  // 团队列表
  var TEAMS_LIST = [
    {
      id: 'team-research', name: '研究主线', icon: 'research',
      members: ['lin', 'research', 'search', 'summary'],
      desc: '固态电池主线研究：检索 → 初稿 → 专家审查 → 校验',
      activeTasks: 2, historyTasks: 5
    },
    {
      id: 'team-study', name: '学习小组', icon: 'study',
      members: ['lin', 'reader', 'summary'],
      desc: '读书会 + 学习笔记整理',
      activeTasks: 0, historyTasks: 3
    },
    {
      id: 'team-write', name: '写作团队', icon: 'write',
      members: ['lin', 'research', 'summary'],
      desc: '综述写作：大纲 → 起草 → 润色 → 校对',
      activeTasks: 1, historyTasks: 2
    }
  ];

  // 头像渐变映射
  var AVATAR_GRADIENTS = {
    lin: 'linear-gradient(135deg,#C7A24A,#e8d091)',
    zhou: 'linear-gradient(135deg,#1D5B7A,#5a9bbd)',
    sch: 'linear-gradient(135deg,#2F855A,#68b786)',
    chk: 'linear-gradient(135deg,#C1272D,#e07175)'
  };

  function avatarBg(id) { return AVATAR_GRADIENTS[id] || AVATAR_GRADIENTS.lin; }

  function findAgent(id) {
    for (var i = 0; i < AGENTS_LIST.length; i++) { if (AGENTS_LIST[i].id === id) return AGENTS_LIST[i]; }
    return null;
  }
  function findTeam(id) {
    for (var i = 0; i < TEAMS_LIST.length; i++) { if (TEAMS_LIST[i].id === id) return TEAMS_LIST[i]; }
    return null;
  }

  /* ----------------------------- 渲染：智能体/团队列表页 ----------------------------- */

  function renderTopbar(title) {
    return '<header class="ag-topbar">' +
      '<button class="ag-back" data-action="ag-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
      '<h2 class="ag-title">' + escapeHtml(title) + '</h2>' +
      '<div class="ag-top-actions">' +
      '<button class="ag-icon-btn" data-action="ag-search" aria-label="搜索">' + svg('<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>') + '</button>' +
      '<button class="ag-icon-btn ag-icon-btn--add" data-action="ag-add" aria-label="新建">' + svg('<path d="M12 5v14M5 12h14"/>') + '</button>' +
      '</div>' +
      '</header>';
  }

  function renderTabs(active) {
    /* E11-12: 合并团队+工作流，上方切换 智能体/工作流/Skill配置 */
    return '<div class="ag-tabs" role="tablist">' +
      '<button class="ag-tab' + (active === 'agents' ? ' is-active' : '') + '" data-action="ag-switch-tab" data-tab="agents" role="tab">智能体</button>' +
      '<button class="ag-tab' + (active === 'workflows' ? ' is-active' : '') + '" data-action="ag-switch-tab" data-tab="workflows" role="tab">工作流</button>' +
      '<button class="ag-tab' + (active === 'skills' ? ' is-active' : '') + '" data-action="ag-switch-tab" data-tab="skills" role="tab">Skill配置</button>' +
    '</div>';
  }

  function renderAgentCard(a) {
    return '<article class="ag-card" data-action="ag-open-agent" data-id="' + a.id + '">' +
      '<div class="ag-card__avatar" style="background:' + avatarBg(a.id) + '">' + escapeHtml(a.name.charAt(0)) + '</div>' +
      '<div class="ag-card__info">' +
      '<div class="ag-card__name">' + escapeHtml(a.name) + (a.isMain ? '<span class="ag-card__main">主</span>' : '') + '</div>' +
      '<div class="ag-card__role">' + escapeHtml(a.role) + '</div>' +
      '<div class="ag-card__desc">' + escapeHtml(a.desc) + '</div>' +
      '</div>' +
      '<span class="ag-card__arrow">›</span>' +
      '</article>';
  }

  function renderTeamCard(t) {
    var avs = t.members.map(function (mid) {
      var a = findAgent(mid);
      var initial = a ? a.name.charAt(0) : '?';
      return '<span class="tm-card__av" style="background:' + avatarBg(mid) + '">' + escapeHtml(initial) + '</span>';
    }).join('');
    var used = t.activeTasks > 0
      ? '<span class="tm-card__used">● ' + t.activeTasks + ' 个任务在跑</span>'
      : '<span class="tm-card__used tm-card__used--idle">空闲</span>';
    return '<article class="tm-card" data-action="ag-open-team" data-id="' + t.id + '">' +
      '<div class="tm-card__head">' +
      '<div class="tm-card__icon tm-card__icon--' + t.icon + '">' + (t.icon === 'research' ? '🔬' : t.icon === 'study' ? '📚' : '✍') + '</div>' +
      '<div class="tm-card__name">' + escapeHtml(t.name) + '</div>' +
      '<span class="tm-card__count">' + t.members.length + ' 成员</span>' +
      '</div>' +
      '<div class="tm-card__avs">' + avs + '</div>' +
      '<div class="tm-card__desc">' + escapeHtml(t.desc) + '</div>' +
      '<div class="tm-card__foot">' + used + '<span class="tm-card__arrow">›</span></div>' +
      '</article>';
  }

  /* E11-12: 工作流列表数据（合并团队，工作流即含团队配置） */
  var WORKFLOW_CARDS = [
    { id: 'wf-research', name: '研究型', icon: 'research', desc: '检索 → 初稿 → 专家审查 → 校验 → 定稿', team: '研究主线', teamCount: 4, steps: 5, agents: 4, activeTasks: 2 },
    { id: 'wf-write', name: '写作型', icon: 'write', desc: '大纲 → 起草 → 润色 → 校对', team: '写作团队', teamCount: 3, steps: 4, agents: 3, activeTasks: 1 },
    { id: 'wf-search', name: '检索型', icon: 'study', desc: '检索 → 汇总 → 标签归档', team: '研究主线', teamCount: 4, steps: 3, agents: 2, activeTasks: 0 }
  ];

  /* E11-12: Skill 配置列表数据 */
  var SKILL_CARDS = [
    { id: 'sk-web-search', name: '网页搜索', desc: '联网检索实时信息，支持语义搜索', category: '检索', on: true,
      inputs: [
        { name: 'query', type: 'string', required: true, desc: '搜索关键词' },
        { name: 'max_results', type: 'number', required: false, default: '10', desc: '最大返回条数' }
      ],
      outputs: [{ name: 'results', type: 'array', desc: '搜索结果列表，含标题/摘要/链接' }],
      execConfig: { timeout: '30s', retry: 2, concurrency: 3, memory: '256MB' },
      permissions: [
        { id: 'network', name: '网络访问', on: true },
        { id: 'filesystem', name: '文件系统', on: false },
        { id: 'database', name: '数据库', on: false }
      ],
      boundAgents: ['lin', 'search', 'research'] },
    { id: 'sk-file-io', name: '文件读写', desc: '读写本地文件系统，支持多格式', category: '文件', on: true,
      inputs: [
        { name: 'path', type: 'string', required: true, desc: '文件路径' },
        { name: 'mode', type: 'string', required: false, default: 'read', desc: '读写模式' }
      ],
      outputs: [{ name: 'content', type: 'string', desc: '文件内容' }],
      execConfig: { timeout: '10s', retry: 1, concurrency: 5, memory: '128MB' },
      permissions: [
        { id: 'network', name: '网络访问', on: false },
        { id: 'filesystem', name: '文件系统', on: true },
        { id: 'database', name: '数据库', on: false }
      ],
      boundAgents: ['lin', 'summary', 'reader'] },
    { id: 'sk-code-exec', name: '代码执行', desc: '沙箱中执行 Python/JS 代码', category: '执行', on: false,
      inputs: [
        { name: 'code', type: 'string', required: true, desc: '待执行代码' },
        { name: 'language', type: 'string', required: false, default: 'python', desc: '编程语言' }
      ],
      outputs: [{ name: 'result', type: 'string', desc: '执行结果输出' }],
      execConfig: { timeout: '60s', retry: 0, concurrency: 1, memory: '512MB' },
      permissions: [
        { id: 'network', name: '网络访问', on: false },
        { id: 'filesystem', name: '文件系统', on: true },
        { id: 'database', name: '数据库', on: false }
      ],
      boundAgents: ['lin', 'research'] },
    { id: 'sk-image-gen', name: '图像生成', desc: '调用文生图模型生成图片', category: '生成', on: false,
      inputs: [
        { name: 'prompt', type: 'string', required: true, desc: '图像描述提示词' },
        { name: 'size', type: 'string', required: false, default: '1024x1024', desc: '图像尺寸' }
      ],
      outputs: [{ name: 'image_url', type: 'string', desc: '生成图像的 URL' }],
      execConfig: { timeout: '120s', retry: 1, concurrency: 2, memory: '256MB' },
      permissions: [
        { id: 'network', name: '网络访问', on: true },
        { id: 'filesystem', name: '文件系统', on: false },
        { id: 'database', name: '数据库', on: false }
      ],
      boundAgents: ['lin', 'research'] },
    { id: 'sk-pdf-read', name: 'PDF 解析', desc: '解析 PDF 文档，抽取关键信息', category: '文件', on: true,
      inputs: [
        { name: 'file', type: 'string', required: true, desc: 'PDF 文件路径' },
        { name: 'pages', type: 'string', required: false, desc: '指定页码范围' }
      ],
      outputs: [{ name: 'text', type: 'string', desc: '解析后的文本内容' }],
      execConfig: { timeout: '45s', retry: 2, concurrency: 2, memory: '512MB' },
      permissions: [
        { id: 'network', name: '网络访问', on: false },
        { id: 'filesystem', name: '文件系统', on: true },
        { id: 'database', name: '数据库', on: false }
      ],
      boundAgents: ['lin', 'reader', 'summary'] },
    { id: 'sk-calendar', name: '日历管理', desc: '读写日程，支持提醒推送', category: '效率', on: false,
      inputs: [
        { name: 'action', type: 'string', required: true, desc: '操作类型' },
        { name: 'date', type: 'string', required: false, desc: '日期' }
      ],
      outputs: [{ name: 'events', type: 'array', desc: '日程列表' }],
      execConfig: { timeout: '15s', retry: 1, concurrency: 3, memory: '128MB' },
      permissions: [
        { id: 'network', name: '网络访问', on: true },
        { id: 'filesystem', name: '文件系统', on: false },
        { id: 'database', name: '数据库', on: false }
      ],
      boundAgents: ['lin'] }
  ];

  /* Skill 市场（新建 Skill 时引入） */
  var SKILL_MARKET = [
    { id: 'mkt-translate', name: '翻译', desc: '多语言互译，支持术语库', category: '效率' },
    { id: 'mkt-summary', name: '智能总结', desc: '长文本结构化总结', category: '效率' },
    { id: 'mkt-crawler', name: '网页爬虫', desc: '抓取页面内容并清洗', category: '检索' },
    { id: 'mkt-ocr', name: 'OCR 识别', desc: '图片文字识别提取', category: '文件' }
  ];

  function findSkill(id) {
    for (var i = 0; i < SKILL_CARDS.length; i++) { if (SKILL_CARDS[i].id === id) return SKILL_CARDS[i]; }
    return null;
  }

  function renderWorkflowCardInAgent(w) {
    var used = w.activeTasks > 0
      ? '<span class="tm-card__used">● ' + w.activeTasks + ' 个任务在跑</span>'
      : '<span class="tm-card__used tm-card__used--idle">空闲</span>';
    var iconBg = w.icon === 'research' ? 'linear-gradient(135deg,#1D5B7A,#5a9bbd)'
      : w.icon === 'study' ? 'linear-gradient(135deg,#2F855A,#68b786)'
      : 'linear-gradient(135deg,#C7A24A,#e8d091)';
    var iconChar = w.icon === 'research' ? '🔬' : w.icon === 'study' ? '📚' : '✍';
    return '<article class="tm-card" data-action="ag-open-workflow" data-id="' + w.id + '">' +
      '<div class="tm-card__head">' +
        '<div class="tm-card__icon" style="background:' + iconBg + '">' + iconChar + '</div>' +
        '<div class="tm-card__name">' + escapeHtml(w.name) + '</div>' +
        '<span class="tm-card__count">' + w.teamCount + ' 成员</span>' +
      '</div>' +
      '<div class="tm-card__desc">' + escapeHtml(w.desc) + '</div>' +
      '<div class="tm-card__foot">' + used + '<span class="tm-card__arrow">›</span></div>' +
    '</article>';
  }

  function renderSkillCard(s) {
    return '<article class="ag-skill-card" data-action="ag-open-skill" data-id="' + s.id + '">' +
      '<div class="ag-skill-card__head">' +
        '<div class="ag-skill-card__info">' +
          '<div class="ag-skill-card__name">' + escapeHtml(s.name) + '</div>' +
          '<div class="ag-skill-card__cat">' + escapeHtml(s.category) + '</div>' +
        '</div>' +
        '<span class="ag-skill-card__status' + (s.on ? ' is-on' : '') + '">' + (s.on ? '已启用' : '未启用') + '</span>' +
      '</div>' +
      '<p class="ag-skill-card__desc">' + escapeHtml(s.desc) + '</p>' +
    '</article>';
  }

  function renderAgentPage() {
    var root = $('[data-agent-root]');
    if (!root) return;
    var agentsHtml = AGENTS_LIST.map(renderAgentCard).join('') +
      '<button class="ag-add" data-action="ag-add">+ 新建智能体</button>';
    /* E11-12: 工作流列表（合并团队） */
    var workflowsHtml = WORKFLOW_CARDS.map(renderWorkflowCardInAgent).join('') +
      '<button class="ag-add" data-action="ag-add-workflow">+ 新建工作流</button>';
    /* E11-12: Skill 配置列表 */
    var skillsHtml = SKILL_CARDS.map(renderSkillCard).join('') +
      '<button class="ag-add" data-action="ag-add-skill">+ 新建 Skill</button>';
    root.innerHTML = renderTopbar('智能体') + renderTabs('agents') +
      '<div class="ag-list" data-agent-list>' + agentsHtml + '</div>' +
      '<div class="ag-list ag-list--workflows" data-workflow-list hidden>' + workflowsHtml + '</div>' +
      '<div class="ag-list ag-list--skills" data-skill-list hidden>' + skillsHtml + '</div>';
  }

  /* ----------------------------- 渲染：智能体配置页 -----------------------------
   * D7-D10 重构：
   *   - 能力滑块 → 模型思考等级（低/中/高/深度思考）
   *   - 能力+行为 → 模型参数 + 模型供应商 + Skill配置 + MCP配置
   *   - 提示词右下角加优化按钮
   *   - 删除「试听对话」按钮
   * ------------------------------------------------------------------------- */
  var THINK_LEVELS = [
    { id: 'low', label: '低', desc: '快速响应' },
    { id: 'mid', label: '中', desc: '均衡' },
    { id: 'high', label: '高', desc: '深度推理' },
    { id: 'deep', label: '深度思考', desc: '最强推理' }
  ];
  var MODEL_PROVIDERS = [
    { id: 'openai', name: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'o1', 'o3-mini'] },
    { id: 'anthropic', name: 'Anthropic', models: ['claude-3.5-sonnet', 'claude-3.5-haiku', 'claude-3-opus'] },
    { id: 'google', name: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro'] },
    { id: 'local', name: '本地', models: ['qwen-2.5-72b', 'deepseek-v3', 'llama-3.3-70b'] }
  ];
  var SKILL_LIST = [
    { id: 'web-search', name: '网页搜索', desc: '联网检索实时信息', on: true },
    { id: 'file-io', name: '文件读写', desc: '读写本地文件系统', on: true },
    { id: 'code-exec', name: '代码执行', desc: '沙箱中执行代码', on: false },
    { id: 'image-gen', name: '图像生成', desc: '调用文生图模型', on: false },
    { id: 'pdf-read', name: 'PDF 解析', desc: '解析 PDF 文档内容', on: true }
  ];
  var MCP_LIST = [
    { id: 'filesystem', name: 'filesystem', desc: '本地文件系统访问', on: true },
    { id: 'github', name: 'github', desc: 'GitHub 仓库与 PR 管理', on: false },
    { id: 'postgres', name: 'postgres', desc: 'PostgreSQL 数据库查询', on: false },
    { id: 'puppeteer', name: 'puppeteer', desc: '浏览器自动化', on: true }
  ];

  /* F13d: 节点上下文（从工作流节点进入智能体配置时设置） */
  var currentNodeCtx = null;
  var NODE_TYPE_LABELS = { start: '开始', task: '任务', branch: '分支', end: '结束' };

  function renderAgentConfig(id, opts) {
    var a = findAgent(id);
    if (!a) return;
    var root = $('[data-agent-config-root]');
    if (!root) return;

    /* F13d: 记录节点上下文（从工作流节点进入时） */
    if (opts && opts.nodeId) {
      currentNodeCtx = opts;
    } else {
      currentNodeCtx = null;
    }

    /* D7: 模型思考等级 segmented */
    var thinkLevelsHtml = '<div class="ag-cfg-seg">' +
      THINK_LEVELS.map(function (lv, i) {
        return '<button class="ag-cfg-seg__item' + (i === 1 ? ' is-active' : '') + '" data-action="ag-cfg-think" data-id="' + lv.id + '">' +
          '<span class="ag-cfg-seg__label">' + escapeHtml(lv.label) + '</span>' +
          '<span class="ag-cfg-seg__desc">' + escapeHtml(lv.desc) + '</span>' +
        '</button>';
      }).join('') + '</div>';

    /* D9: 模型参数 */
    var modelParamsHtml =
      '<div class="ag-cfg-slider"><span>Temperature</span><input type="range" min="0" max="200" value="70"><span class="ag-cfg-slider__val">0.7</span></div>' +
      '<div class="ag-cfg-slider"><span>Top P</span><input type="range" min="0" max="100" value="90"><span class="ag-cfg-slider__val">0.9</span></div>' +
      '<div class="ag-cfg-field"><label>上下文窗口</label><input class="ag-cfg-input ag-cfg-input--sm" value="128K" placeholder="如 128K"></div>' +
      '<div class="ag-cfg-field"><label>Max Tokens</label><input class="ag-cfg-input ag-cfg-input--sm" value="4096" placeholder="如 4096"></div>';

    /* D9: 模型供应商 */
    var providerOptions = MODEL_PROVIDERS.map(function (p, i) {
      return '<option' + (i === 0 ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>';
    }).join('');
    var modelOptions = MODEL_PROVIDERS[0].models.map(function (m) {
      return '<option>' + escapeHtml(m) + '</option>';
    }).join('');
    var providerHtml =
      '<select class="ag-cfg-select">' + providerOptions + '</select>' +
      '<select class="ag-cfg-select ag-cfg-select--model">' + modelOptions + '</select>';

    /* D9: Skill 配置 */
    var skillHtml = SKILL_LIST.map(function (s) {
      return '<label class="ag-cfg-toggle">' +
        '<input type="checkbox"' + (s.on ? ' checked' : '') + ' hidden>' +
        '<div class="ag-cfg-toggle__row">' +
          '<div class="ag-cfg-toggle__info"><div class="ag-cfg-toggle__name">' + escapeHtml(s.name) + '</div><div class="ag-cfg-toggle__desc">' + escapeHtml(s.desc) + '</div></div>' +
          '<span class="ag-cfg-switch' + (s.on ? ' is-on' : '') + '"></span>' +
        '</div>' +
      '</label>';
    }).join('');

    /* D9: MCP 配置 */
    var mcpHtml = MCP_LIST.map(function (m) {
      return '<label class="ag-cfg-toggle">' +
        '<input type="checkbox"' + (m.on ? ' checked' : '') + ' hidden>' +
        '<div class="ag-cfg-toggle__row">' +
          '<div class="ag-cfg-toggle__info"><div class="ag-cfg-toggle__name"><span class="ag-cfg-mono">' + escapeHtml(m.name) + '</span></div><div class="ag-cfg-toggle__desc">' + escapeHtml(m.desc) + '</div></div>' +
          '<span class="ag-cfg-switch' + (m.on ? ' is-on' : '') + '"></span>' +
        '</div>' +
      '</label>';
    }).join('');

    /* F13d: 节点绑定区域（仅当从工作流节点进入时显示） */
    var nodeBindHtml = '';
    var cfgTitle = '智能体配置';
    if (currentNodeCtx) {
      cfgTitle = '节点配置';
      var avatarsHtml = AGENTS_LIST.map(function (ag) {
        var isCurrent = ag.id === id;
        return '<button class="ag-cfg-bind__av' + (isCurrent ? ' is-current' : '') + '" data-action="ag-cfg-switch-agent" data-id="' + ag.id + '" style="background:' + avatarBg(ag.id) + '" title="' + escapeHtml(ag.name) + '">' +
          escapeHtml(ag.name.charAt(0)) +
          (isCurrent ? '<span class="ag-cfg-bind__check">✓</span>' : '') +
        '</button>';
      }).join('');
      var nodeType = currentNodeCtx.nodeType || 'task';
      nodeBindHtml =
        '<div class="ag-cfg-section ag-cfg-section--bind">' +
          '<div class="ag-cfg-bind__node">' +
            '<span class="ag-cfg-bind__node-label">节点</span>' +
            '<span class="ag-cfg-bind__node-name">' + escapeHtml(currentNodeCtx.nodeLabel || '任务') + '</span>' +
            '<span class="ag-cfg-bind__node-type ag-cfg-bind__node-type--' + nodeType + '">' + escapeHtml(NODE_TYPE_LABELS[nodeType] || '任务') + '</span>' +
          '</div>' +
          '<label class="ag-cfg-label">绑定 Agent <span class="ag-cfg-hint">点击切换</span></label>' +
          '<div class="ag-cfg-bind__list">' +
            avatarsHtml +
            '<button class="ag-cfg-bind__add" data-action="ag-cfg-new-agent" aria-label="新建智能体">' + svg('<path d="M12 5v14M5 12h14"/>', 16) + '</button>' +
          '</div>' +
        '</div>';
    }

    root.innerHTML =
      '<header class="ag-cfg-topbar">' +
        '<button class="ag-back" data-action="ag-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="ag-cfg-title">' + cfgTitle + '</h2>' +
        '<span class="ag-cfg-spacer"></span>' +
      '</header>' +
      '<div class="ag-cfg-hero">' +
        '<div class="ag-cfg-avatar" style="background:' + avatarBg(a.id) + '">' + escapeHtml(a.name.charAt(0)) + '</div>' +
        '<div class="ag-cfg-meta"><div class="ag-cfg-name">' + escapeHtml(a.name) + '</div><div class="ag-cfg-role">' + escapeHtml(a.role) + '</div></div>' +
      '</div>' +
      '<div class="ag-cfg-body" data-cfg-body>' +
        nodeBindHtml +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">名称</label>' +
          '<input class="ag-cfg-input" value="' + escapeHtml(a.name) + '">' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">角色</label>' +
          '<input class="ag-cfg-input" value="' + escapeHtml(a.role) + '">' +
        '</div>' +
        /* D8: 提示词右下角加优化按钮 */
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">提示词 <span class="ag-cfg-hint">Agent 由提示词定义</span></label>' +
          '<div class="ag-cfg-prompt-wrap">' +
            '<textarea class="ag-cfg-prompt" rows="5">你是' + escapeHtml(a.name) + '，一个专注于' + escapeHtml(a.role) + '的智能体。' + escapeHtml(a.desc) + '</textarea>' +
            '<button class="ag-cfg-prompt__optimize" data-action="ag-cfg-optimize-prompt">优化</button>' +
          '</div>' +
        '</div>' +
        /* D7: 模型思考等级 */
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">模型思考等级</label>' +
          thinkLevelsHtml +
        '</div>' +
        /* D9: 模型参数 */
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">模型参数</label>' +
          '<div class="ag-cfg-params">' + modelParamsHtml + '</div>' +
        '</div>' +
        /* D9: 模型供应商 */
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">模型供应商</label>' +
          '<div class="ag-cfg-providers">' + providerHtml + '</div>' +
        '</div>' +
        /* D9: Skill 配置 */
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">Skill 配置 <span class="ag-cfg-hint">能力插件</span></label>' +
          '<div class="ag-cfg-toggles">' + skillHtml + '</div>' +
        '</div>' +
        /* D9: MCP 配置 */
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">MCP 配置 <span class="ag-cfg-hint">外部工具协议</span></label>' +
          '<div class="ag-cfg-toggles">' + mcpHtml + '</div>' +
        '</div>' +
      '</div>' +
      /* D10: 删除试听对话按钮，只保留保存 */
      '<footer class="ag-cfg-foot">' +
        '<button class="ag-cfg-btn ag-cfg-btn--primary" data-action="ag-cfg-save">保存配置</button>' +
      '</footer>';
  }

  /* ----------------------------- 渲染：团队配置页 ----------------------------- */

  function renderTeamConfig(id) {
    var t = findTeam(id);
    if (!t) return;
    var root = $('[data-agent-config-root]');
    if (!root) return;
    var members = t.members.map(function (mid, idx) {
      var a = findAgent(mid);
      if (!a) return '';
      var role = idx === 0 ? '主笔' : idx === 1 ? '顾问' : '协作';
      return '<div class="tm-cfg-member">' +
        '<div class="tm-cfg-member__av" style="background:' + avatarBg(mid) + '">' + escapeHtml(a.name.charAt(0)) + '</div>' +
        '<div class="tm-cfg-member__info"><div class="tm-cfg-member__name">' + escapeHtml(a.name) + '</div><div class="tm-cfg-member__role">' + role + '</div></div>' +
        '<button class="tm-cfg-member__remove" data-action="tm-remove-member" data-id="' + mid + '" aria-label="移除">×</button>' +
      '</div>';
    }).join('');
    root.innerHTML =
      '<header class="ag-cfg-topbar">' +
        '<button class="ag-back" data-action="ag-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="ag-cfg-title">团队配置</h2>' +
        '<span class="ag-cfg-spacer"></span>' +
      '</header>' +
      '<div class="tm-cfg-hero">' +
        '<div class="tm-cfg-icon tm-card__icon--' + t.icon + '">' + (t.icon === 'research' ? '🔬' : t.icon === 'study' ? '📚' : '✍') + '</div>' +
        '<input class="tm-cfg-name" value="' + escapeHtml(t.name) + '">' +
      '</div>' +
      '<div class="tm-cfg-section">' +
        '<label class="tm-cfg-label">描述</label>' +
        '<textarea class="tm-cfg-desc" rows="2">' + escapeHtml(t.desc) + '</textarea>' +
      '</div>' +
      '<div class="tm-cfg-section">' +
        '<label class="tm-cfg-label">成员管理</label>' +
        '<div class="tm-cfg-members">' + members + '</div>' +
        '<button class="tm-cfg-add-member" data-action="tm-add-member">+ 从智能体库添加</button>' +
      '</div>' +
      '<div class="tm-cfg-section">' +
        '<label class="tm-cfg-label">使用历史</label>' +
        '<div class="tm-cfg-history">' +
          (t.activeTasks > 0 ? '<div class="tm-cfg-hist-item tm-cfg-hist-item--active">● 当前 ' + t.activeTasks + ' 个任务在跑</div>' : '') +
          '<div class="tm-cfg-hist-item">历史完成 ' + t.historyTasks + ' 个任务</div>' +
        '</div>' +
      '</div>' +
      '<footer class="ag-cfg-foot">' +
        '<button class="ag-cfg-btn ag-cfg-btn--ghost tm-cfg-dissolve" data-action="tm-dissolve">解散团队</button>' +
        '<button class="ag-cfg-btn ag-cfg-btn--primary" data-action="tm-save">保存团队</button>' +
      '</footer>';
  }

  /* ----------------------------- 渲染：Skill 配置页 ----------------------------- */
  function renderSkillConfig(id) {
    var s = findSkill(id);
    if (!s) return;
    var root = $('[data-agent-config-root]');
    if (!root) return;

    /* 输入参数表格 */
    var inputsHtml = s.inputs.map(function (inp) {
      return '<tr class="sk-cfg-io__row">' +
        '<td class="sk-cfg-io__name">' + escapeHtml(inp.name) + '</td>' +
        '<td class="sk-cfg-io__type">' + escapeHtml(inp.type) + '</td>' +
        '<td class="sk-cfg-io__req">' + (inp.required ? '<span class="sk-cfg-io__badge">必填</span>' : '可选') + '</td>' +
        '<td class="sk-cfg-io__default">' + escapeHtml(inp.default || '-') + '</td>' +
      '</tr>';
    }).join('');
    var outputsHtml = s.outputs.map(function (out) {
      return '<div class="sk-cfg-io__out">' +
        '<span class="sk-cfg-io__out-name">' + escapeHtml(out.name) + '</span>' +
        '<span class="sk-cfg-io__out-type">' + escapeHtml(out.type) + '</span>' +
        '<span class="sk-cfg-io__out-desc">' + escapeHtml(out.desc) + '</span>' +
      '</div>';
    }).join('');

    /* 执行配置 */
    var execHtml =
      '<div class="ag-cfg-field"><label>超时</label><input class="ag-cfg-input ag-cfg-input--sm" value="' + escapeHtml(s.execConfig.timeout) + '"></div>' +
      '<div class="ag-cfg-field"><label>重试次数</label><input class="ag-cfg-input ag-cfg-input--sm" type="number" value="' + escapeHtml(String(s.execConfig.retry)) + '"></div>' +
      '<div class="ag-cfg-field"><label>并发数</label><input class="ag-cfg-input ag-cfg-input--sm" type="number" value="' + escapeHtml(String(s.execConfig.concurrency)) + '"></div>' +
      '<div class="ag-cfg-field"><label>内存限制</label><input class="ag-cfg-input ag-cfg-input--sm" value="' + escapeHtml(s.execConfig.memory) + '"></div>';

    /* 权限与作用域 */
    var permsHtml = s.permissions.map(function (p) {
      return '<div class="sk-cfg-perm" data-action="sk-cfg-toggle-perm" data-id="' + p.id + '">' +
        '<div class="sk-cfg-perm__info"><div class="sk-cfg-perm__name">' + escapeHtml(p.name) + '</div></div>' +
        '<span class="ag-cfg-switch' + (p.on ? ' is-on' : '') + '"></span>' +
      '</div>';
    }).join('');

    /* 绑定智能体 */
    var agentsHtml = AGENTS_LIST.map(function (ag) {
      var bound = s.boundAgents.indexOf(ag.id) >= 0;
      return '<div class="sk-cfg-agent" data-action="sk-cfg-toggle-agent" data-id="' + ag.id + '">' +
        '<div class="sk-cfg-agent__av" style="background:' + avatarBg(ag.id) + '">' + escapeHtml(ag.name.charAt(0)) + '</div>' +
        '<div class="sk-cfg-agent__info"><div class="sk-cfg-agent__name">' + escapeHtml(ag.name) + '</div><div class="sk-cfg-agent__role">' + escapeHtml(ag.role) + '</div></div>' +
        '<span class="ag-cfg-switch' + (bound ? ' is-on' : '') + '"></span>' +
      '</div>';
    }).join('');

    root.innerHTML =
      '<header class="ag-cfg-topbar">' +
        '<button class="ag-back" data-action="ag-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="ag-cfg-title">Skill配置</h2>' +
        '<span class="ag-cfg-spacer"></span>' +
      '</header>' +
      '<div class="ag-cfg-hero">' +
        '<div class="sk-cfg-icon">' + escapeHtml(s.name.charAt(0)) + '</div>' +
        '<div class="ag-cfg-meta"><div class="ag-cfg-name">' + escapeHtml(s.name) + '</div><div class="ag-cfg-role">' + escapeHtml(s.category) + '</div></div>' +
        '<div class="sk-cfg-status' + (s.on ? ' is-on' : '') + '" data-action="sk-cfg-toggle-status">' + (s.on ? '已启用' : '未启用') + '</div>' +
      '</div>' +
      '<div class="ag-cfg-body" data-cfg-body>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">输入输出定义</label>' +
          '<table class="sk-cfg-io"><thead><tr><th>参数</th><th>类型</th><th>必填</th><th>默认</th></tr></thead><tbody>' + inputsHtml + '</tbody></table>' +
          '<div class="sk-cfg-io__outs"><div class="sk-cfg-io__outs-label">输出</div>' + outputsHtml + '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">执行配置</label>' +
          '<div class="ag-cfg-params">' + execHtml + '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">权限与作用域</label>' +
          '<div class="ag-cfg-toggles">' + permsHtml + '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">绑定智能体</label>' +
          '<div class="ag-cfg-toggles">' + agentsHtml + '</div>' +
        '</div>' +
      '</div>' +
      '<footer class="ag-cfg-foot">' +
        '<button class="ag-cfg-btn ag-cfg-btn--primary" data-action="sk-cfg-save">保存配置</button>' +
      '</footer>';
  }

  /* ----------------------------- 渲染：新建 Skill 页 ----------------------------- */
  function renderSkillNew() {
    var root = $('[data-agent-config-root]');
    if (!root) return;

    var marketHtml = SKILL_MARKET.map(function (m) {
      return '<div class="sk-new-market__item">' +
        '<div class="sk-new-market__info"><div class="sk-new-market__name">' + escapeHtml(m.name) + '</div><div class="sk-new-market__desc">' + escapeHtml(m.desc) + '</div></div>' +
        '<span class="sk-new-market__cat">' + escapeHtml(m.category) + '</span>' +
        '<button class="sk-new-market__btn" data-action="sk-new-import" data-id="' + m.id + '">引入</button>' +
      '</div>';
    }).join('');

    root.innerHTML =
      '<header class="ag-cfg-topbar">' +
        '<button class="ag-back" data-action="ag-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="ag-cfg-title">新建 Skill</h2>' +
        '<span class="ag-cfg-spacer"></span>' +
      '</header>' +
      '<div class="ag-cfg-body" data-cfg-body>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">基本信息</label>' +
          '<input class="ag-cfg-input sk-new-name" placeholder="Skill 名称">' +
          '<textarea class="ag-cfg-prompt sk-new-desc" rows="2" placeholder="Skill 描述" style="margin-top:8px;min-height:40px;"></textarea>' +
          '<select class="ag-cfg-select sk-new-cat" style="margin-top:8px;"><option>检索</option><option>文件</option><option>执行</option><option>生成</option><option>效率</option></select>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">创建方式</label>' +
          '<div class="sk-new-tabs">' +
            '<button class="sk-new-tab is-active" data-action="sk-new-pick-type" data-type="builtin">内置 Skill</button>' +
            '<button class="sk-new-tab" data-action="sk-new-pick-type" data-type="custom">自定义 Skill</button>' +
          '</div>' +
          '<div class="sk-new-panel sk-new-panel--builtin">' +
            '<div class="sk-new-market">' + marketHtml + '</div>' +
          '</div>' +
          '<div class="sk-new-panel sk-new-panel--custom" hidden>' +
            '<div class="ag-cfg-field"><label>API 地址</label><input class="ag-cfg-input ag-cfg-input--sm sk-new-api" placeholder="https://"></div>' +
            '<div class="ag-cfg-field"><label>认证方式</label><select class="ag-cfg-select sk-new-auth"><option>Bearer</option><option>API Key</option><option>None</option></select></div>' +
            '<div class="ag-cfg-field"><label>请求方法</label><select class="ag-cfg-select sk-new-method"><option>GET</option><option>POST</option></select></div>' +
            '<div style="margin-top:8px;"><label class="ag-cfg-label">输入 Schema</label><textarea class="ag-cfg-prompt sk-new-input-schema" rows="3" placeholder=\'{"query":"string"}\'></textarea></div>' +
            '<div style="margin-top:8px;"><label class="ag-cfg-label">输出 Schema</label><textarea class="ag-cfg-prompt sk-new-output-schema" rows="3" placeholder=\'{"result":"string"}\'></textarea></div>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<footer class="ag-cfg-foot">' +
        '<button class="ag-cfg-btn ag-cfg-btn--primary" data-action="sk-new-create">创建</button>' +
      '</footer>';
  }

  /* ----------------------------- 渲染：新建智能体页 ----------------------------- */
  function renderAgentNew() {
    var root = $('[data-agent-config-root]');
    if (!root) return;

    var avatarKeys = Object.keys(AVATAR_GRADIENTS);
    var avatarPickerHtml = avatarKeys.map(function (k, i) {
      return '<button class="ag-cfg-avatar-picker__item' + (i === 0 ? ' is-selected' : '') + '" data-action="ag-new-pick-avatar" data-id="' + k + '" style="background:' + AVATAR_GRADIENTS[k] + '"></button>';
    }).join('');

    var thinkLevelsHtml = '<div class="ag-cfg-seg">' +
      THINK_LEVELS.map(function (lv, i) {
        return '<button class="ag-cfg-seg__item' + (i === 1 ? ' is-active' : '') + '" data-action="ag-cfg-think" data-id="' + lv.id + '">' +
          '<span class="ag-cfg-seg__label">' + escapeHtml(lv.label) + '</span>' +
          '<span class="ag-cfg-seg__desc">' + escapeHtml(lv.desc) + '</span>' +
        '</button>';
      }).join('') + '</div>';

    var providerOptions = MODEL_PROVIDERS.map(function (p, i) {
      return '<option' + (i === 0 ? ' selected' : '') + '>' + escapeHtml(p.name) + '</option>';
    }).join('');
    var modelOptions = MODEL_PROVIDERS[0].models.map(function (m) {
      return '<option>' + escapeHtml(m) + '</option>';
    }).join('');

    var skillHtml = SKILL_LIST.map(function (s) {
      return '<label class="ag-cfg-toggle">' +
        '<input type="checkbox"' + (s.on ? ' checked' : '') + ' hidden>' +
        '<div class="ag-cfg-toggle__row">' +
          '<div class="ag-cfg-toggle__info"><div class="ag-cfg-toggle__name">' + escapeHtml(s.name) + '</div><div class="ag-cfg-toggle__desc">' + escapeHtml(s.desc) + '</div></div>' +
          '<span class="ag-cfg-switch' + (s.on ? ' is-on' : '') + '"></span>' +
        '</div>' +
      '</label>';
    }).join('');

    var mcpHtml = MCP_LIST.map(function (m) {
      return '<label class="ag-cfg-toggle">' +
        '<input type="checkbox"' + (m.on ? ' checked' : '') + ' hidden>' +
        '<div class="ag-cfg-toggle__row">' +
          '<div class="ag-cfg-toggle__info"><div class="ag-cfg-toggle__name"><span class="ag-cfg-mono">' + escapeHtml(m.name) + '</span></div><div class="ag-cfg-toggle__desc">' + escapeHtml(m.desc) + '</div></div>' +
          '<span class="ag-cfg-switch' + (m.on ? ' is-on' : '') + '"></span>' +
        '</div>' +
      '</label>';
    }).join('');

    root.innerHTML =
      '<header class="ag-cfg-topbar">' +
        '<button class="ag-back" data-action="ag-back" aria-label="返回">' + svg('<path d="M19 12H5"/><path d="M11 6l-6 6 6 6"/>') + '</button>' +
        '<h2 class="ag-cfg-title">新建智能体</h2>' +
        '<span class="ag-cfg-spacer"></span>' +
      '</header>' +
      '<div class="ag-cfg-hero">' +
        '<div class="ag-cfg-avatar ag-new-avatar" style="background:' + AVATAR_GRADIENTS[avatarKeys[0]] + '">新</div>' +
        '<div class="ag-cfg-meta"><div class="ag-cfg-name ag-new-name-display">新智能体</div><div class="ag-cfg-role">自定义角色</div></div>' +
      '</div>' +
      '<div class="ag-cfg-body" data-cfg-body>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">基本信息</label>' +
          '<input class="ag-cfg-input ag-new-name" placeholder="智能体名称">' +
          '<input class="ag-cfg-input ag-new-role" placeholder="角色描述" style="margin-top:8px;">' +
          '<label class="ag-cfg-label" style="margin-top:10px;">头像配色</label>' +
          '<div class="ag-cfg-avatar-picker">' + avatarPickerHtml + '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">模型配置</label>' +
          thinkLevelsHtml +
          '<div class="ag-cfg-providers" style="margin-top:8px;">' +
            '<select class="ag-cfg-select ag-new-provider">' + providerOptions + '</select>' +
            '<select class="ag-cfg-select ag-cfg-select--model ag-new-model">' + modelOptions + '</select>' +
          '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">初始能力 <span class="ag-cfg-hint">Skill</span></label>' +
          '<div class="ag-cfg-toggles">' + skillHtml + '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">MCP 配置 <span class="ag-cfg-hint">外部工具协议</span></label>' +
          '<div class="ag-cfg-toggles">' + mcpHtml + '</div>' +
        '</div>' +
        '<div class="ag-cfg-section">' +
          '<label class="ag-cfg-label">提示词</label>' +
          '<div class="ag-cfg-prompt-wrap">' +
            '<textarea class="ag-cfg-prompt ag-new-prompt" rows="5">你是一个专注于[角色]的智能体…</textarea>' +
            '<button class="ag-cfg-prompt__optimize" data-action="ag-cfg-optimize-prompt">优化</button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<footer class="ag-cfg-foot">' +
        '<button class="ag-cfg-btn ag-cfg-btn--primary" data-action="ag-new-create">创建智能体</button>' +
      '</footer>';
  }

  /* ----------------------------- 交互 ----------------------------- */

  function onClick(e) {
    var actEl = e.target.closest('[data-action]');
    if (!actEl) return;
    var action = actEl.getAttribute('data-action');
    var nb = window.ZX_NOTEBOOK;

    if (action === 'ag-back') {
      /* F13d: 从节点配置返回时，刷新工作流画布以反映 agent 切换 */
      if (currentNodeCtx && window.ZX_WORKFLOW && window.ZX_WORKFLOW.renderWorkflowEdit) {
        try { window.ZX_WORKFLOW.renderWorkflowEdit(currentNodeCtx.workflowId); } catch (e) { /* ignore */ }
      }
      currentNodeCtx = null;
      if (nb && nb.popView) nb.popView();
      return;
    }
    if (action === 'ag-switch-tab') {
      var tab = actEl.getAttribute('data-tab');
      switchTab(tab);
      return;
    }
    if (action === 'ag-open-agent') {
      var aid = actEl.getAttribute('data-id');
      renderAgentConfig(aid);
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'agent', id: aid });
      return;
    }
    /* E11-12: 工作流即含团队配置，点击工作流 → 进入工作流编辑页 */
    if (action === 'ag-open-workflow') {
      var wid = actEl.getAttribute('data-id');
      if (window.ZX_WORKFLOW && window.ZX_WORKFLOW.renderWorkflowEdit) {
        window.ZX_WORKFLOW.renderWorkflowEdit(wid);
      }
      if (nb && nb.pushView) nb.pushView('workflow-edit', { id: wid });
      return;
    }
    /* E11-12: Skill 配置点击 → 进入 Skill 配置详情页 */
    if (action === 'ag-open-skill') {
      var skId = actEl.getAttribute('data-id');
      renderSkillConfig(skId);
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'skill', id: skId });
      return;
    }
    if (action === 'ag-add-workflow') {
      if (nb && nb.toast) nb.toast('新建工作流（demo）');
      return;
    }
    if (action === 'ag-add-skill') {
      renderSkillNew();
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'skill-new' });
      return;
    }
    if (action === 'ag-open-team') {
      var tid = actEl.getAttribute('data-id');
      renderTeamConfig(tid);
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'team', id: tid });
      return;
    }
    if (action === 'ag-cfg-save' || action === 'tm-save') {
      if (nb && nb.toast) nb.toast('配置已保存');
      if (nb && nb.popView) nb.popView();
      return;
    }
    /* D7: 切换模型思考等级 */
    if (action === 'ag-cfg-think') {
      $all('.ag-cfg-seg__item').forEach(function (b) { b.classList.toggle('is-active', b === actEl); });
      return;
    }
    /* D8: 优化提示词 */
    if (action === 'ag-cfg-optimize-prompt') {
      var ta = $('.ag-cfg-prompt');
      if (ta) {
        var original = ta.value;
        ta.value = '【角色】' + original + '\n\n【约束】\n1. 输出结构化、可执行的结果\n2. 如信息不足，主动追问\n3. 遵循最小权限原则，不越界操作';
      }
      if (nb && nb.toast) nb.toast('已优化提示词');
      return;
    }
    /* F13d: 切换节点绑定的 Agent（保留节点上下文重新渲染 + 同步工作流数据） */
    if (action === 'ag-cfg-switch-agent') {
      var newAgentId = actEl.getAttribute('data-id');
      /* 同步更新工作流节点的 agent 绑定 */
      if (currentNodeCtx && window.ZX_WORKFLOW && window.ZX_WORKFLOW.WORKFLOWS) {
        try {
          window.ZX_WORKFLOW.WORKFLOWS.forEach(function (wf) {
            if (wf.id !== currentNodeCtx.workflowId) return;
            wf.nodes.forEach(function (n) {
              if (n.id === currentNodeCtx.nodeId) n.agent = newAgentId;
            });
          });
        } catch (e) { /* ignore */ }
      }
      renderAgentConfig(newAgentId, currentNodeCtx);
      if (nb && nb.toast) nb.toast('已切换为 ' + (findAgent(newAgentId) ? findAgent(newAgentId).name : ''));
      return;
    }
    /* F13d: 新建智能体并绑定到当前节点 */
    if (action === 'ag-cfg-new-agent') {
      if (nb && nb.toast) nb.toast('新建智能体（demo）');
      return;
    }
    if (action === 'tm-remove-member') {
      if (nb && nb.toast) nb.toast('已移除成员（demo）');
      return;
    }
    if (action === 'tm-add-member') {
      if (nb && nb.toast) nb.toast('从智能体库添加（demo）');
      return;
    }
    if (action === 'tm-dissolve') {
      if (nb && nb.toast) nb.toast('团队已解散（demo）');
      if (nb && nb.popView) nb.popView();
      return;
    }
    if (action === 'ag-add') {
      renderAgentNew();
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'agent-new' });
      return;
    }
    if (action === 'ag-add-team') {
      if (nb && nb.toast) nb.toast('新建团队（demo）');
      return;
    }
    /* Skill 配置：保存 */
    if (action === 'sk-cfg-save') {
      if (nb && nb.toast) nb.toast('配置已保存');
      if (nb && nb.popView) nb.popView();
      return;
    }
    /* Skill 配置：切换启用状态 */
    if (action === 'sk-cfg-toggle-status') {
      actEl.classList.toggle('is-on');
      actEl.textContent = actEl.classList.contains('is-on') ? '已启用' : '未启用';
      return;
    }
    /* Skill 配置：切换权限 */
    if (action === 'sk-cfg-toggle-perm') {
      var permSw = actEl.querySelector('.ag-cfg-switch');
      if (permSw) permSw.classList.toggle('is-on');
      return;
    }
    /* Skill 配置：切换智能体绑定 */
    if (action === 'sk-cfg-toggle-agent') {
      var agentSw = actEl.querySelector('.ag-cfg-switch');
      if (agentSw) agentSw.classList.toggle('is-on');
      return;
    }
    /* 新建 Skill：切换创建方式 tab */
    if (action === 'sk-new-pick-type') {
      var newType = actEl.getAttribute('data-type');
      $all('.sk-new-tab').forEach(function (b) { b.classList.toggle('is-active', b === actEl); });
      var builtinPanel = $('.sk-new-panel--builtin');
      var customPanel = $('.sk-new-panel--custom');
      if (builtinPanel) builtinPanel.hidden = (newType !== 'builtin');
      if (customPanel) customPanel.hidden = (newType !== 'custom');
      return;
    }
    /* 新建 Skill：引入内置 Skill */
    if (action === 'sk-new-import') {
      if (nb && nb.toast) nb.toast('已引入 Skill');
      if (nb && nb.popView) nb.popView();
      return;
    }
    /* 新建 Skill：创建自定义 Skill */
    if (action === 'sk-new-create') {
      if (nb && nb.toast) nb.toast('已创建自定义 Skill');
      if (nb && nb.popView) nb.popView();
      return;
    }
    /* 新建智能体：选择头像配色 */
    if (action === 'ag-new-pick-avatar') {
      var avId = actEl.getAttribute('data-id');
      $all('.ag-cfg-avatar-picker__item').forEach(function (b) { b.classList.toggle('is-selected', b === actEl); });
      var avPreview = $('.ag-new-avatar');
      if (avPreview) avPreview.style.background = AVATAR_GRADIENTS[avId] || AVATAR_GRADIENTS.lin;
      return;
    }
    /* 新建智能体：创建 */
    if (action === 'ag-new-create') {
      var nameInput = $('.ag-new-name');
      var roleInput = $('.ag-new-role');
      var newName = nameInput ? nameInput.value.trim() : '';
      var newRole = roleInput ? roleInput.value.trim() : '';
      if (!newName) {
        if (nb && nb.toast) nb.toast('请输入智能体名称');
        return;
      }
      var selectedAvatar = $('.ag-cfg-avatar-picker__item.is-selected');
      var avatarKey = selectedAvatar ? selectedAvatar.getAttribute('data-id') : 'lin';
      var newAgentId = 'agent-' + Date.now();
      AGENTS_LIST.push({
        id: newAgentId,
        name: newName,
        role: newRole || '自定义角色',
        desc: '用户自定义智能体',
        avatar: avatarKey
      });
      if (nb && nb.toast) nb.toast('已创建智能体');
      renderAgentPage();
      renderAgentConfig(newAgentId);
      if (nb && nb.popView) nb.popView();
      if (nb && nb.pushView) nb.pushView('agent-config', { kind: 'agent', id: newAgentId });
      return;
    }
    if (action === 'ag-search') {
      if (nb && nb.toast) nb.toast('搜索（demo）');
      return;
    }
  }

  function switchTab(tab) {
    $all('.ag-tab').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-tab') === tab);
    });
    var agentList = $('[data-agent-list]');
    var workflowList = $('[data-workflow-list]');
    var skillList = $('[data-skill-list]');
    if (agentList) agentList.hidden = (tab !== 'agents');
    if (workflowList) workflowList.hidden = (tab !== 'workflows');
    if (skillList) skillList.hidden = (tab !== 'skills');
    var title = $('.ag-title');
    if (title) {
      title.textContent = (tab === 'agents') ? '智能体'
        : (tab === 'workflows') ? '工作流' : 'Skill配置';
    }
  }

  /* ----------------------------- 初始化 ----------------------------- */

  function init() {
    var root = $('[data-agent-root]');
    if (!root) return;
    renderAgentPage();
    root.addEventListener('click', onClick);

    /* D6: 配置页也绑定点击事件，修复返回按钮无法返回 */
    var cfgRoot = $('[data-agent-config-root]');
    if (cfgRoot) cfgRoot.addEventListener('click', onClick);
  }

  window.ZX_AGENT = {
    init: init,
    renderAgentPage: renderAgentPage,
    renderAgentConfig: renderAgentConfig,
    renderTeamConfig: renderTeamConfig,
    renderSkillConfig: renderSkillConfig,
    renderSkillNew: renderSkillNew,
    renderAgentNew: renderAgentNew,
    switchTab: switchTab,
    AGENTS_LIST: AGENTS_LIST,
    TEAMS_LIST: TEAMS_LIST,
    SKILL_CARDS: SKILL_CARDS
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
