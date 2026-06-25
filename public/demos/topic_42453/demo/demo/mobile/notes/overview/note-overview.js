/* =========================================================================
 * 「知行」App 本体 Demo —— Wave 2.B / 笔记本总览（note-overview.js）
 * -------------------------------------------------------------------------
 * 三视图：文件夹视图（嵌套树）+ 思维导图视图（AI 自动构建）+ Git 版本管理抽屉
 * 设计语言：墨韵 · 星图（朱砂 / 黛青 / 鎏金 / 赤陶）
 *   · 朱砂 → 中心节点 / CTA / 当前版本
 *   · 黛青 → 一级主题 / 连线
 *   · 鎏金 → AI 标识 / 二级节点 / 版本差异新增
 *   · 赤陶 → 版本差异删除
 * 挂载：#nb-overview-root（由本脚本防御性创建，appendChild 到 [data-nb-root]）
 * 命名空间：window.ZX_OVERVIEW（open / close / isOpen）
 * 依赖：../../demo/shared/icons.js（ZX.icon）、note-overview.css（由 Wave 2.C 引入）
 * 约束：纯 JS 文件，不修改任何其它文件；SVG 思维导图无外部库
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  function zicon(name, size) { return (window.ZX && typeof window.ZX.icon === 'function') ? window.ZX.icon(name, size || 22) : svg('', size); }

  var IC = {
    back:    function () { return zicon('arrow-left', 22); },
    close:   function (s) { return zicon('close', s || 18); },
    search:  function () { return zicon('search', 18); },
    spark:   function (s) { return zicon('spark', s || 14); },
    check:   function (s) { return svg('<path d="M4 12l5 5L20 6"/>', s || 14); },
    folder:  function (s) { return svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', s || 18); },
    doc:     function (s) { return svg('<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M8 13h8M8 17h5"/>', s || 18); },
    chev:    function (s) { return svg('<path d="M6 9l6 6 6-6"/>', s || 16); },
    more:    function () { return '⋯'; },
    plus:    function (s) { return svg('<path d="M12 5v14M5 12h14"/>', s || 18); },
    minus:   function (s) { return svg('<path d="M5 12h14"/>', s || 18); },
    sort:    function (s) { return svg('<path d="M3 6h18M6 12h12M10 18h4"/>', s || 14); },
    refresh: function (s) { return svg('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>', s || 13); },
    brain:   function (s) { return svg('<path d="M9 3a3 3 0 0 0-3 3 3 3 0 0 0-1 5 3 3 0 0 0 2 5 3 3 0 0 0 5 0V3z"/><path d="M15 3a3 3 0 0 1 3 3 3 3 0 0 1 1 5 3 3 0 0 1-2 5 3 3 0 0 1-5 0"/>', s || 16); },
    edit:    function (s) { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', s || 15); },
    trash:   function (s) { return svg('<path d="M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M6 6l1 14a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-14"/>', s || 15); },
    open:    function (s) { return svg('<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>', s || 15); },
    clock:   function (s) { return svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', s || 14); },
    history: function (s) { return svg('<circle cx="6" cy="6" r="2.2"/><circle cx="6" cy="18" r="2.2"/><circle cx="18" cy="12" r="2.2"/><path d="M6 8.2v7.6"/><path d="M18 12c0-4-4-4-6-2"/>', s || 14); }
  };

  /* ----------------------------- Mock 数据 ----------------------------- */

  var MOCK_NOTES_TREE = {
    personal: [
      {
        type: 'folder', id: 'f-solid', name: '固态电池研究',
        children: [
          {
            type: 'folder', id: 'f-sulfide', name: '硫化物电解质',
            children: [
              { type: 'note', id: 'n1', name: '硫化物 5 大优势', versions: 3, words: 1240, modified: '2h 前', recency: 2, tags: ['硫化物', '电解质'] },
              { type: 'note', id: 'n2', name: '界面阻抗分析', versions: 5, words: 2180, modified: '昨天', recency: 5, tags: ['界面阻抗', 'EIS'] }
            ]
          },
          {
            type: 'folder', id: 'f-interface', name: '界面问题',
            children: [
              { type: 'note', id: 'n3', name: 'LLZO 阻抗测试', versions: 2, words: 860, modified: '3 天前', recency: 8, tags: ['LLZO', '氧化物'] }
            ]
          },
          { type: 'note', id: 'n4', name: '固态电池综述笔记', versions: 8, words: 5400, modified: '上周', recency: 20, tags: ['综述'] }
        ]
      },
      {
        type: 'folder', id: 'f-study', name: '学习方法',
        children: [
          { type: 'note', id: 'n5', name: '费曼学习法', versions: 1, words: 420, modified: '5 天前', recency: 30, tags: ['方法'] }
        ]
      },
      { type: 'note', id: 'n6', name: '周报 2024-W24', versions: 2, words: 980, modified: '今天', recency: 1, tags: ['周报'] }
    ],
    team: [
      {
        type: 'folder', id: 'ft-battery', name: '固态电池主线',
        children: [
          { type: 'note', id: 't1', name: '硫化物路线对比', versions: 4, words: 3100, modified: '1h 前', recency: 1, tags: ['硫化物'], sharedBy: '沈砚' },
          { type: 'note', id: 't2', name: '中试节点跟踪', versions: 6, words: 2800, modified: '今天', recency: 3, tags: ['中试', '宁德'], sharedBy: '张衡' }
        ]
      },
      { type: 'note', id: 't3', name: '讨论树：界面阻抗', versions: 3, words: 1600, modified: '昨天', recency: 6, tags: ['讨论', '界面阻抗'], sharedBy: '江月' }
    ]
  };

  var MOCK_MINDMAP = {
    center: { type: 'user', name: '我' },
    branches: [
      { topic: '固态电池', children: ['界面阻抗', '硫化物', 'LLZO'] },
      { topic: '学习方法', children: ['费曼学习法'] },
      { topic: '行业动态', children: ['宁德路线图', '中试节点'] },
      { topic: '笔记方法', children: ['双联阅读', '大纲树'] },
      { topic: '项目协作', children: ['讨论树'] }
    ]
  };

  var MOCK_MM_DETAILS = {
    '界面阻抗': { summary: '四电极 vs 两电极测量的争议；LiNbO₃ 涂层可降界面阻抗约 10×。', modified: '昨天', noteId: 'n2' },
    '硫化物': { summary: 'Li₆PS₅Cl 室温电导率 10⁻³ S/cm 级，五大优势速览。', modified: '2h 前', noteId: 'n1' },
    'LLZO': { summary: '氧化物电解质代表，化学稳定但界面阻抗偏高。', modified: '3 天前', noteId: 'n3' },
    '费曼学习法': { summary: '用「教」的方式倒逼理解，适合概念性知识。', modified: '5 天前', noteId: 'n5' },
    '宁德路线图': { summary: '2026 中试节点：350 Wh/kg、循环 500 次、阻抗降 5×。', modified: '上周', noteId: 't2' },
    '中试节点': { summary: '跟踪全固态电池行业中试进展与关键指标。', modified: '今天', noteId: 't2' },
    '双联阅读': { summary: '左正文右资料，适合读论文、做技术笔记。', modified: '上周', noteId: null },
    '大纲树': { summary: '以树为骨架的结构化思考模板。', modified: '2 周前', noteId: null },
    '讨论树': { summary: '多观点结构化对比，便于收敛共识。', modified: '昨天', noteId: 't3' }
  };

  var MOCK_VERSIONS = {
    'n1': [
      { v: 3, time: '今天 14:32', author: 'lin', note: '林帮你重写了第二段，强化了电导率数据的引用与单位。', current: true,
        content: ['硫化物电解质的 5 大优势', '', '1. 高室温电导率：Li₆PS₅Cl 可达 10⁻³ S/cm 级，与液态电解液相当。', '2. 良好的可塑性：冷压即可致密化，界面接触良好。', '3. 低温性能优异：-20°C 仍保持较高电导率。', '4. 与锂金属兼容性可改善（需界面涂层）。', '5. 易于薄膜化，适合柔性器件。'] },
      { v: 2, time: '昨天 21:15', author: 'user', note: '你手动编辑，补充了第 4 点。',
        content: ['硫化物电解质的 5 大优势', '', '1. 高室温电导率。', '2. 良好的可塑性。', '3. 低温性能优。', '4. 与锂金属兼容性可改善（需界面涂层）。', '5. 易于薄膜化。'] },
      { v: 1, time: '3 天前', author: 'user', note: '创建。',
        content: ['硫化物电解质的 5 大优势', '', '1. 高电导率。', '2. 可塑性好。', '3. 低温性能优。'] }
    ],
    'n2': [
      { v: 5, time: '昨天 22:40', author: 'lin', note: '林补齐了四电极与两电极的对比表。', current: true,
        content: ['界面阻抗分析', '', '核心争议：界面阻抗是否被高估。', '四电极体系：LiNbO₃ 涂层降低阻抗约 10×（高可信）。', '两电极测量：可能高估，量级待复核。', '结论：先看测量方法，再下判断。'] },
      { v: 4, time: '前天 09:10', author: 'user', note: '你新增了结论段。',
        content: ['界面阻抗分析', '', '核心争议：界面阻抗是否被高估。', '四电极体系：LiNbO₃ 涂层降低阻抗约 10×。', '两电极测量：可能高估。', '结论：先看测量方法，再下判断。'] },
      { v: 3, time: '4 天前', author: 'lin', note: '林抽取了论文 Table 2 的数据。',
        content: ['界面阻抗分析', '', '核心争议：界面阻抗是否被高估。', '四电极体系：LiNbO₃ 涂层降低阻抗约 10×。', '两电极测量：可能高估。'] },
      { v: 2, time: '5 天前', author: 'user', note: '补充两电极段落。',
        content: ['界面阻抗分析', '', '核心争议：界面阻抗是否被高估。', '四电极体系：LiNbO₃ 涂层降低阻抗约 10×。'] },
      { v: 1, time: '6 天前', author: 'user', note: '创建。',
        content: ['界面阻抗分析', '', '核心争议：界面阻抗是否被高估。'] }
    ],
    'n3': [
      { v: 2, time: '3 天前', author: 'user', note: '你更新了 LLZO 的电导率数值。', current: true,
        content: ['LLZO 阻抗测试', '', 'LLZO 室温电导率约 10⁻⁴ S/cm。', '化学稳定性好，对锂金属稳定。', '缺点：界面阻抗偏高，需界面工程。'] },
      { v: 1, time: '1 周前', author: 'user', note: '创建。',
        content: ['LLZO 阻抗测试', '', 'LLZO 室温电导率约 10⁻⁴ S/cm。', '化学稳定性好。'] }
    ],
    'n4': [
      { v: 8, time: '上周', author: 'lin', note: '林梳理了全固态三大技术路线对比。', current: true,
        content: ['固态电池综述笔记', '', '硫化物：电导率高，对空气敏感。', '氧化物：稳定，界面阻抗高。', '聚合物：易加工，室温电导率低。'] },
      { v: 7, time: '2 周前', author: 'user', note: '你补充了聚合物路线。',
        content: ['固态电池综述笔记', '', '硫化物：电导率高，对空气敏感。', '氧化物：稳定，界面阻抗高。'] }
    ],
    'n5': [
      { v: 1, time: '5 天前', author: 'user', note: '创建。', current: true,
        content: ['费曼学习法', '', '用最简单的语言把概念讲清楚。', '讲不清的地方就是理解的缺口。', '回头补缺口，再讲一遍。'] }
    ],
    'n6': [
      { v: 2, time: '今天', author: 'lin', note: '林帮你生成本周要点 7 条。', current: true,
        content: ['周报 2024-W24', '', '主线推进：固态电池 +2 步。', '新增笔记 8 篇。', '下周关注：中试数据、四电极复测。'] },
      { v: 1, time: '昨天', author: 'user', note: '创建。',
        content: ['周报 2024-W24', '', '主线推进：固态电池。', '新增笔记 8 篇。'] }
    ],
    't1': [
      { v: 4, time: '1h 前', author: 'lin', note: '林更新了硫化物 vs 氧化物对比表。', current: true,
        content: ['硫化物路线对比', '', '硫化物：电导率胜，稳定性弱。', '氧化物：稳定性胜，阻抗高。', '复合电解质是折中方向。'] },
      { v: 3, time: '昨天', author: 'user', note: '你补充复合电解质方向。',
        content: ['硫化物路线对比', '', '硫化物：电导率胜，稳定性弱。', '氧化物：稳定性胜，阻抗高。'] }
    ],
    't2': [
      { v: 6, time: '今天', author: 'lin', note: '林同步宁德时代最新中试指标。', current: true,
        content: ['中试节点跟踪', '', '宁德：2026 中试，350 Wh/kg。', 'QuantumScape：氧化物隔膜扩产。', '行业第一梯队节奏。'] }
    ],
    't3': [
      { v: 3, time: '昨天', author: 'user', note: '你新增反方观点。', current: true,
        content: ['讨论树：界面阻抗', '', '正方：界面修饰短期增益明显。', '反方：长循环下本体阻抗才是决定因素。', '待验证：n≥30 四电极复测。'] }
    ]
  };

  var SORT_LABELS = { recent: '最近', words: '字数', relevance: '相关度' };
  var SORT_CYCLE = ['recent', 'words', 'relevance'];

  /* ----------------------------- 状态 ----------------------------- */

  var state = {
    tab: 'folder',
    scope: 'personal',
    search: '',
    sort: 'recent',
    expandedFolders: {},
    selectedNotes: {},
    multiselect: false,
    currentNoteId: null,
    _justEntered: null,
    mm: { tx: 0, ty: 0, scale: 1 }
  };

  var root = null;
  var screen = null;
  var world = null;
  var mmLayout = null;
  var built = false;

  /* ----------------------------- 数据查询 ----------------------------- */

  function getTree() {
    var base = (MOCK_NOTES_TREE[state.scope] || []).slice();
    /* Task 2.2：个人域顶部插入「最近笔记」文件夹，内容来自 bridge.notes（编辑器 autosave / 新建） */
    if (state.scope === 'personal' && window.ZX_BRIDGE && window.ZX_BRIDGE.getNotes) {
      var bn = window.ZX_BRIDGE.getNotes();
      if (bn && bn.length) {
        var nodes = bn.map(function (n) {
          var words = 0;
          if (n.body) words = String(n.body).replace(/<[^>]+>/g, '').replace(/\s+/g, '').length;
          else if (n.blocks && n.blocks.length) n.blocks.forEach(function (b) { words += (b.text || '').length; });
          else if (n.outline) words = (n.outline.text || '').length + 40;
          return {
            type: 'note', id: n.id, name: n.title || '无标题笔记',
            versions: (n.versions && n.versions.length) || 1,
            words: Math.max(words, 1) * 2, /* 粗估字数 */
            modified: n.modified || '刚刚', recency: 0, tags: [], aiCo: !!n.aiCo, template: n.template
          };
        });
        base.unshift({ type: 'folder', id: 'f-recent', name: '最近笔记', children: nodes, _recent: true });
      }
    }
    return base;
  }

  function defaultExpanded() {
    var m = {};
    getTree().forEach(function (n) { if (n.type === 'folder') m[n.id] = true; });
    return m;
  }

  function findNote(id, nodes) {
    nodes = nodes || getTree();
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      if (n.type === 'note' && n.id === id) return n;
      if (n.type === 'folder' && n.children) {
        var f = findNote(id, n.children);
        if (f) return f;
      }
    }
    return null;
  }

  function noteNameById(id) { var n = findNote(id); return n ? n.name : '笔记'; }

  /* Task 2.2：版本优先取 bridge.notes 的真实版本（autosave 产生），否则回退 mock */
  function versionsOf(id) {
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.getNoteById) {
      var bn = window.ZX_BRIDGE.getNoteById(id);
      if (bn && bn.versions && bn.versions.length) {
        return bn.versions.map(function (ver, i) {
          return {
            v: ver.v || (bn.versions.length - i),
            time: ver.at || '刚刚',
            author: ver.aiCo ? 'lin' : 'user',
            note: ver.snippet || (ver.aiCo ? '林协写了一版' : '你编辑了一版'),
            current: i === 0,
            content: ver.snippet ? [bn.title || '无标题笔记', '', ver.snippet] : [bn.title || '无标题笔记', '', '（这一版由编辑器自动保存）']
          };
        });
      }
    }
    return MOCK_VERSIONS[id] || [];
  }

  function latestAuthor(id) {
    var vs = versionsOf(id);
    if (!vs.length) return 'user';
    for (var i = 0; i < vs.length; i++) { if (vs[i].current) return vs[i].author; }
    return vs[0].author;
  }

  function currentVersion(id) {
    var vs = versionsOf(id);
    for (var i = 0; i < vs.length; i++) { if (vs[i].current) return vs[i]; }
    return vs[0] || null;
  }

  /* ----------------------------- 过滤 / 排序 ----------------------------- */

  function matchNode(node, q) {
    if (!q) return true;
    var hay = (node.name || '').toLowerCase();
    if (hay.indexOf(q) >= 0) return true;
    if (node.tags) { for (var i = 0; i < node.tags.length; i++) { if (node.tags[i].toLowerCase().indexOf(q) >= 0) return true; } }
    return false;
  }

  function filterTree(nodes, q) {
    var out = [];
    nodes.forEach(function (n) {
      if (n.type === 'folder') {
        var kids = filterTree(n.children || [], q);
        if (kids.length || matchNode(n, q)) out.push({ type: 'folder', id: n.id, name: n.name, sharedBy: n.sharedBy, children: kids });
      } else if (matchNode(n, q)) {
        out.push(n);
      }
    });
    return out;
  }

  function sortChildren(children) {
    var folders = [], notes = [];
    children.forEach(function (c) { (c.type === 'folder' ? folders : notes).push(c); });
    folders.sort(function (a, b) { return String(a.name).localeCompare(String(b.name), 'zh'); });
    notes.sort(function (a, b) {
      if (state.sort === 'words') return b.words - a.words;
      if (state.sort === 'relevance') return 0;
      return (a.recency || 0) - (b.recency || 0);
    });
    return folders.concat(notes);
  }

  /* ----------------------------- 容器与外壳 ----------------------------- */

  function ensureRoot() {
    if (root) return;
    var existing = document.getElementById('nb-overview-root');
    if (existing) { root = existing; return; }
    root = el('div');
    root.id = 'nb-overview-root';
    root.hidden = true;
    var mount = document.querySelector('[data-nb-root]') || document.body;
    mount.appendChild(root);
  }

  function buildShell() {
    if (built) return;
    built = true;
    var styleTag = '<style>' +
      '.ov-children{overflow:hidden;transition:max-height var(--dur-base) var(--ease-zx),opacity var(--dur-base) var(--ease-zx);}' +
      '.ov-item-group.is-collapsed>.ov-children{max-height:0!important;opacity:0;}' +
      '@media (prefers-reduced-motion: reduce){.ov-children{transition-duration:.01s!important;}}' +
      '</style>';

    root.innerHTML = styleTag +
      '<div class="ov-screen">' +
        '<header class="ov-topbar">' +
          '<button class="ov-back" data-action="ov-close" aria-label="返回">' + IC.back() + '</button>' +
          '<h1 class="ov-title">我的笔记</h1>' +
          '<div class="ov-scope" role="tablist" aria-label="范围">' +
            '<button class="ov-scope__btn" data-scope="team" data-action="ov-set-scope" role="tab">团队</button>' +
            '<button class="ov-scope__btn is-active" data-scope="personal" data-action="ov-set-scope" role="tab">个人</button>' +
          '</div>' +
        '</header>' +
        '<div class="ov-tabs" role="tablist" aria-label="视图">' +
          '<button class="ov-tab ov-tab--folder is-active" data-tab="folder" data-action="ov-set-tab" role="tab">' + IC.folder(16) + '<span>文件夹</span></button>' +
          '<button class="ov-tab ov-tab--mindmap" data-tab="mindmap" data-action="ov-set-tab" role="tab">' + IC.brain(16) + '<span>思维导图</span></button>' +
        '</div>' +
        '<div class="ov-body">' +
          '<section class="ov-pane is-active" id="ov-pane-folder">' +
            '<div class="ov-folder-toolbar">' +
              '<label class="ov-search">' + IC.search() + '<input type="search" data-ov-search placeholder="搜索笔记 · 名称 / 标签" aria-label="搜索笔记"></label>' +
              '<button class="ov-sort" data-action="ov-cycle-sort" aria-label="切换排序">' + IC.sort() + '<span data-ov-sort-label>' + SORT_LABELS[state.sort] + '</span></button>' +
            '</div>' +
            '<div class="ov-tree-scroll" data-ov-tree></div>' +
            '<div class="ov-multibar">' +
              '<span class="ov-multibar__count">已选 <b data-ov-sel-count>0</b> 篇</span>' +
              '<button class="ov-multibar__btn" data-action="ov-multi-move">移动</button>' +
              '<button class="ov-multibar__btn ov-multibar__btn--danger" data-action="ov-multi-delete">删除</button>' +
              '<button class="ov-multibar__btn" data-action="ov-multi-exit">取消</button>' +
            '</div>' +
          '</section>' +
          '<section class="ov-pane" id="ov-pane-mindmap">' +
            '<div class="ov-mm-bar">' +
              '<span class="ov-mm-bar__spark">' + IC.spark() + '</span>' +
              '<span>林为你构建</span>' +
              '<span class="ov-mm-bar__sep">·</span>' +
              '<span>3 天前更新</span>' +
              '<button class="ov-mm-bar__regen" data-action="ov-mm-regen">' + IC.refresh() + '<span>重新生成</span></button>' +
            '</div>' +
            '<div class="ov-mm-canvas" data-ov-mm-canvas>' +
              '<div class="ov-mm-world" data-ov-mm-world></div>' +
              '<div class="ov-mm-zoom">' +
                '<button class="ov-mm-zoom__btn" data-action="ov-mm-zoom-in" aria-label="放大">' + IC.plus() + '</button>' +
                '<button class="ov-mm-zoom__btn" data-action="ov-mm-zoom-out" aria-label="缩小">' + IC.minus() + '</button>' +
              '</div>' +
              '<div class="ov-mm-hint"><span class="ov-mm-hint__spark">✦</span> AI 自动构建，无需手动整理</div>' +
              '<aside class="ov-detail" id="ov-detail" role="status" aria-live="polite"></aside>' +
            '</div>' +
          '</section>' +
        '</div>' +
        '<div class="ov-menu" id="ov-menu" role="menu"></div>' +
        '<div class="ov-drawer" id="ov-drawer">' +
          '<div class="ov-drawer__overlay" data-action="ov-drawer-close"></div>' +
          '<div class="ov-drawer__panel">' +
            '<div class="ov-drawer__handle"></div>' +
            '<div class="ov-drawer__head">' +
              '<div><h2 class="ov-drawer__title" data-ov-drawer-title>版本历史</h2>' +
              '<span class="ov-drawer__sub" data-ov-drawer-sub></span></div>' +
              '<button class="ov-drawer__close" data-action="ov-drawer-close" aria-label="关闭">' + IC.close() + '</button>' +
            '</div>' +
            '<div class="ov-drawer__body" data-ov-drawer-body></div>' +
          '</div>' +
        '</div>' +
        '<div class="ov-toast" data-ov-toast></div>' +
      '</div>';

    screen = $('.ov-screen', root);
    world = $('[data-ov-mm-world]', root);
  }

  /* ----------------------------- 渲染：顶栏状态 ----------------------------- */

  function renderScope() {
    $all('.ov-scope__btn', root).forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-scope') === state.scope);
    });
  }

  function renderTabs() {
    $all('.ov-tab', root).forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-tab') === state.tab);
    });
    $('#ov-pane-folder', root).classList.toggle('is-active', state.tab === 'folder');
    var mmPane = $('#ov-pane-mindmap', root);
    mmPane.classList.toggle('is-active', state.tab === 'mindmap');
  }

  /* ----------------------------- 渲染：文件夹视图 ----------------------------- */

  function renderFolderView() {
    var box = $('[data-ov-tree]', root);
    if (!box) return;
    var tree = filterTree(getTree(), state.search.toLowerCase().trim());
    if (!tree.length) {
      box.innerHTML = '<div class="ov-empty"><div class="ov-empty__icon">' + IC.folder(56) + '</div>' +
        '<div class="ov-empty__text">' + (state.search ? '没有匹配的笔记' : '这里还没有笔记') + '</div></div>';
      return;
    }
    var html = '';
    var sectionLabel = state.scope === 'team' ? '团队共享笔记' : '我的笔记';
    html += '<div class="ov-tree-section-label">' + escapeHtml(sectionLabel) + '</div>';
    html += '<div class="' + (state.scope === 'team' ? 'ov-team-shared' : 'ov-private-group') + '">';
    html += tree.map(function (n) { return renderNode(n, 0); }).join('');
    html += '</div>';
    box.innerHTML = html;
  }

  function checkHtml(id) {
    var on = !!state.selectedNotes[id];
    return '<span class="ov-check' + (on ? ' is-on' : '') + '" data-action="ov-toggle-select" data-note="' + escapeHtml(id) + '" aria-label="选择">' + IC.check(14) + '</span>';
  }

  function renderNode(node, depth) {
    var pad = 8 + depth * 16;
    if (node.type === 'folder') {
      var expanded = !!state.expandedFolders[node.id];
      var count = (node.children || []).length;
      var meta = count + ' 项' + (node.sharedBy ? ' · 共享' : '');
      var groupCls = 'ov-item-group' + (expanded ? '' : ' is-collapsed');
      var itemCls = 'ov-item ov-item--folder' + (expanded ? ' is-expanded' : '');
      var h = '<div class="' + groupCls + '" data-folder-group="' + escapeHtml(node.id) + '">';
      h += '<div class="' + itemCls + '" data-action="ov-toggle-folder" data-folder="' + escapeHtml(node.id) + '" data-kind="folder" style="padding-left:' + pad + 'px;">';
      h += checkHtml(node.id);
      h += '<span class="ov-item__chev">' + IC.chev() + '</span>';
      h += '<span class="ov-item__icon">' + IC.folder() + '</span>';
      h += '<span class="ov-item__main"><span class="ov-item__name">' + escapeHtml(node.name) + '</span>';
      h += '<span class="ov-item__meta">' + escapeHtml(meta) + '</span></span>';
      h += '<span class="ov-item__right"><span class="ov-item__more" data-action="ov-item-more" data-id="' + escapeHtml(node.id) + '" data-kind="folder" aria-label="更多">' + IC.more() + '</span></span>';
      h += '</div>';
      var kids = sortChildren(node.children || []);
      h += '<div class="ov-children" style="max-height:4000px;">' + kids.map(function (k) { return renderNode(k, depth + 1); }).join('') + '</div>';
      h += '</div>';
      return h;
    }

    var note = node;
    var author = latestAuthor(note.id);
    var badgeCls = author === 'lin' ? 'ov-vbadge--ai' : 'ov-vbadge--human';
    if (note.aiCo) badgeCls += ' ov-vbadge--aico';
    var meta = escapeHtml(note.modified + ' · ' + note.words + ' 字');
    if (note.sharedBy) meta += '<span class="ov-item__shared-by">共享 · ' + escapeHtml(note.sharedBy) + '</span>';
    var tags = (note.tags || []).slice(0, 2).map(function (t) {
      return '<span class="zx-chip">' + escapeHtml(t) + '</span>';
    }).join('');
    if (tags) meta += tags;
    var sel = state.selectedNotes[note.id];
    var itemCls = 'ov-item ov-item--file' + (sel ? ' is-selected' : '');
    var h = '<div class="' + itemCls + '" data-action="ov-open-note" data-note="' + escapeHtml(note.id) + '" data-kind="note" style="padding-left:' + pad + 'px;">';
    h += checkHtml(note.id);
    h += '<span class="ov-item__chev">' + IC.chev() + '</span>';
    h += '<span class="ov-item__icon">' + IC.doc() + '</span>';
    h += '<span class="ov-item__main"><span class="ov-item__name">' + escapeHtml(note.name) + '</span>';
    h += '<span class="ov-item__meta">' + meta + '</span></span>';
    h += '<span class="ov-item__right">';
    h += '<span class="ov-vbadge ' + badgeCls + '" data-action="ov-open-versions" data-note="' + escapeHtml(note.id) + '" aria-label="版本历史">' + (note.aiCo ? '✦ ' : '') + 'v' + note.versions + '</span>';
    h += '<span class="ov-item__more" data-action="ov-item-more" data-id="' + escapeHtml(note.id) + '" data-kind="note" aria-label="更多">' + IC.more() + '</span>';
    h += '</span></div>';
    return h;
  }

  function renderMultibar() {
    var screen_ = screen;
    if (!screen_) return;
    screen_.classList.toggle('is-multiselect', state.multiselect);
    var count = Object.keys(state.selectedNotes).length;
    var c = $('[data-ov-sel-count]', root);
    if (c) c.textContent = String(count);
  }

  function renderAll() {
    renderScope();
    renderTabs();
    if (state.tab === 'folder') renderFolderView();
    else renderMindmapView();
    renderMultibar();
    var sl = $('[data-ov-sort-label]', root);
    if (sl) sl.textContent = SORT_LABELS[state.sort];
  }

  /* ----------------------------- 思维导图：布局算法 -----------------------------
   * 径向布局：中心节点在原点；一级主题等角分布在半径 R1 的圆上（从正上方起逆时针）；
   * 每个一级主题的二级子节点沿「中心→主题」方向的扇形向外展开，分布在半径 R2。
   * 最后统一偏移到正坐标系，得到每个节点在世界中的绝对坐标。
   * -------------------------------------------------------------------------- */

  function layoutMindmap(data) {
    var branches = data.branches || [];
    var N = branches.length;
    var nodes = [];
    var edges = [];
    var byId = {};

    var center = { id: 'center', level: 'center', name: data.center.name, x: 0, y: 0 };
    nodes.push(center); byId.center = center;

    var R1 = 132;
    var R2 = 248;
    var fan = Math.PI / 2.6;

    branches.forEach(function (b, i) {
      var angle = (2 * Math.PI / N) * i - Math.PI / 2;
      var px = R1 * Math.cos(angle);
      var py = R1 * Math.sin(angle);
      var pId = 'p' + i;
      var pNode = { id: pId, level: 'primary', name: b.topic, x: px, y: py, parent: 'center', topic: b.topic, childIds: [] };
      nodes.push(pNode); byId[pId] = pNode;
      edges.push({ from: 'center', to: pId, level: 'l1' });

      var kids = b.children || [];
      var M = kids.length;
      kids.forEach(function (k, j) {
        var ca;
        if (M === 1) ca = angle;
        else ca = angle - fan / 2 + (fan * j / (M - 1));
        var kx = R2 * Math.cos(ca);
        var ky = R2 * Math.sin(ca);
        var sId = pId + '_s' + j;
        var sNode = { id: sId, level: 'secondary', name: k, x: kx, y: ky, parent: pId, topic: b.topic };
        nodes.push(sNode); byId[sId] = sNode;
        pNode.childIds.push(sId);
        edges.push({ from: pId, to: sId, level: 'l2' });
      });
    });

    var minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    nodes.forEach(function (n) {
      if (n.x < minX) minX = n.x; if (n.y < minY) minY = n.y;
      if (n.x > maxX) maxX = n.x; if (n.y > maxY) maxY = n.y;
    });
    var pad = 86;
    var offX = -minX + pad;
    var offY = -minY + pad;
    var worldW = (maxX - minX) + pad * 2;
    var worldH = (maxY - minY) + pad * 2;
    nodes.forEach(function (n) { n.sx = n.x + offX; n.sy = n.y + offY; });

    return {
      nodes: nodes, edges: edges, byId: byId,
      worldW: worldW, worldH: worldH,
      centerWX: center.sx, centerWY: center.sy
    };
  }

  function edgePath(from, to) {
    var mx = (from.sx + to.sx) / 2;
    return 'M' + from.sx + ' ' + from.sy +
      ' C ' + mx + ' ' + from.sy + ', ' + mx + ' ' + to.sy + ', ' + to.sx + ' ' + to.sy;
  }

  /* ----------------------------- 渲染：思维导图视图 ----------------------------- */

  function renderMindmapView() {
    if (!world) return;
    mmLayout = layoutMindmap(MOCK_MINDMAP);

    var svgHtml = '<svg class="ov-mm-edges" width="' + mmLayout.worldW + '" height="' + mmLayout.worldH + '" viewBox="0 0 ' + mmLayout.worldW + ' ' + mmLayout.worldH + '">';
    mmLayout.edges.forEach(function (e) {
      var from = mmLayout.byId[e.from], to = mmLayout.byId[e.to];
      if (!from || !to) return;
      var cls = 'ov-mm-edge' + (e.level === 'l1' ? ' ov-mm-edge--l1' : '');
      svgHtml += '<path class="' + cls + '" d="' + edgePath(from, to) + '" data-from="' + e.from + '" data-to="' + e.to + '"></path>';
    });
    svgHtml += '</svg>';

    var sizeMap = { center: 48, primary: 36, secondary: 28 };
    var gapMap = { center: 34, primary: 27, secondary: 21 };
    var nodesHtml = '';
    mmLayout.nodes.forEach(function (n) {
      var size = sizeMap[n.level];
      var left = n.sx - size / 2;
      var top = n.sy - size / 2;
      var inner = '';
      if (n.level === 'center') inner = escapeHtml(n.name);
      else if (n.level === 'primary') inner = escapeHtml(n.name.slice(0, 2));
      nodesHtml += '<div class="ov-mm-node ov-mm-node--' + n.level + '" data-node="' + escapeHtml(n.id) + '" style="left:' + left + 'px;top:' + top + 'px;">' + inner + '</div>';
      nodesHtml += '<div class="ov-mm-label ov-mm-label--' + n.level + '" style="left:' + n.sx + 'px;top:' + (n.sy + gapMap[n.level]) + 'px;">' + escapeHtml(n.name) + '</div>';
    });

    world.innerHTML = svgHtml + nodesHtml;

    requestAnimationFrame(function () {
      requestAnimationFrame(centerMindmap);
    });
  }

  /* ----------------------------- 思维导图：变换 / 手势 ----------------------------- */

  function applyMMTransform() {
    if (!world) return;
    var m = state.mm;
    world.style.transform = 'translate(' + m.tx + 'px,' + m.ty + 'px) scale(' + m.scale + ')';
  }

  function centerMindmap() {
    var canvas = $('[data-ov-mm-canvas]', root);
    if (!canvas || !mmLayout) return;
    var rect = canvas.getBoundingClientRect();
    if (!rect.width) return;
    state.mm.scale = 1;
    state.mm.tx = rect.width / 2 - mmLayout.centerWX;
    state.mm.ty = rect.height / 2 - mmLayout.centerWY;
    applyMMTransform();
  }

  function zoomTo(ns, mx, my, oldScale) {
    if (!world) return;
    ns = clamp(ns, 0.4, 2.5);
    var wx = (mx - state.mm.tx) / oldScale;
    var wy = (my - state.mm.ty) / oldScale;
    state.mm.tx = mx - wx * ns;
    state.mm.ty = my - wy * ns;
    state.mm.scale = ns;
    applyMMTransform();
  }

  function zoomBy(factor) {
    var canvas = $('[data-ov-mm-canvas]', root);
    if (!canvas) return;
    var rect = canvas.getBoundingClientRect();
    zoomTo(state.mm.scale * factor, rect.width / 2, rect.height / 2, state.mm.scale);
  }

  function bindMindmapGestures() {
    var canvas = $('[data-ov-mm-canvas]', root);
    if (!canvas || canvas.__ovBound) return;
    canvas.__ovBound = true;

    var pressTimer = null, pressNode = null, pressX = 0, pressY = 0, moved = false;
    var pan = null, pinch = null, mouseDown = false;

    function nodeOf(target) { var n = target.closest ? target.closest('.ov-mm-node') : null; return n; }
    function clearPress() { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } pressNode = null; }
    function startPress(node, x, y) {
      clearPress();
      pressNode = node; pressX = x; pressY = y; moved = false;
      pressTimer = setTimeout(function () {
        if (pressNode && !moved) { showNodeMenu(pressNode, pressX, pressY); clearPress(); }
      }, 500);
    }

    canvas.addEventListener('touchstart', function (e) {
      if (e.touches.length === 2) {
        clearPress(); pan = null;
        var a = e.touches[0], b = e.touches[1];
        pinch = { dist: Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY), scale: state.mm.scale, mx: (a.clientX + b.clientX) / 2, my: (a.clientY + b.clientY) / 2 };
        return;
      }
      var t = e.touches[0];
      var node = nodeOf(e.target);
      if (node) { startPress(node, t.clientX, t.clientY); }
      else { pan = { x: t.clientX, y: t.clientY, tx: state.mm.tx, ty: state.mm.ty }; canvas.classList.add('is-dragging'); }
    }, { passive: true });

    canvas.addEventListener('touchmove', function (e) {
      if (pinch && e.touches.length === 2) {
        var a = e.touches[0], b = e.touches[1];
        var d = Math.hypot(a.clientX - b.clientX, a.clientY - b.clientY);
        var ns = clamp(pinch.scale * (d / pinch.dist), 0.4, 2.5);
        var rect = canvas.getBoundingClientRect();
        zoomTo(ns, pinch.mx - rect.left, pinch.my - rect.top, pinch.scale);
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (pan && e.touches.length === 1) {
        var t = e.touches[0];
        state.mm.tx = pan.tx + (t.clientX - pan.x);
        state.mm.ty = pan.ty + (t.clientY - pan.y);
        applyMMTransform();
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (pressNode && e.touches.length === 1) {
        var t2 = e.touches[0];
        if (Math.abs(t2.clientX - pressX) > 10 || Math.abs(t2.clientY - pressY) > 10) { moved = true; clearPress(); }
      }
    }, { passive: false });

    canvas.addEventListener('touchend', function (e) {
      if (pinch && e.touches.length < 2) pinch = null;
      if (pan && e.touches.length === 0) { pan = null; canvas.classList.remove('is-dragging'); }
      if (pressNode && !moved) { selectNode(pressNode); }
      clearPress();
    });

    canvas.addEventListener('mousedown', function (e) {
      mouseDown = true;
      var node = nodeOf(e.target);
      if (node) { startPress(node, e.clientX, e.clientY); }
      else { pan = { x: e.clientX, y: e.clientY, tx: state.mm.tx, ty: state.mm.ty, mouse: true }; canvas.classList.add('is-dragging'); }
    });
    document.addEventListener('mousemove', function (e) {
      if (!mouseDown) return;
      if (pan && pan.mouse) {
        state.mm.tx = pan.tx + (e.clientX - pan.x);
        state.mm.ty = pan.ty + (e.clientY - pan.y);
        applyMMTransform();
      }
      if (pressNode) {
        if (Math.abs(e.clientX - pressX) > 10 || Math.abs(e.clientY - pressY) > 10) { moved = true; clearPress(); }
      }
    });
    document.addEventListener('mouseup', function () {
      mouseDown = false;
      if (pan && pan.mouse) { pan = null; canvas.classList.remove('is-dragging'); }
      if (pressNode && !moved) { selectNode(pressNode); }
      clearPress();
    });

    canvas.addEventListener('wheel', function (e) {
      e.preventDefault();
      var rect = canvas.getBoundingClientRect();
      var factor = e.deltaY < 0 ? 1.12 : 0.89;
      zoomTo(state.mm.scale * factor, e.clientX - rect.left, e.clientY - rect.top, state.mm.scale);
    }, { passive: false });
  }

  /* ----------------------------- 思维导图：选中 / 详情卡 / 菜单 ----------------------------- */

  function selectNode(nodeEl) {
    var id = nodeEl.getAttribute('data-node');
    $all('.ov-mm-node.is-selected', root).forEach(function (n) { n.classList.remove('is-selected'); });
    nodeEl.classList.add('is-selected');
    $all('.ov-mm-edge', root).forEach(function (p) {
      var hl = p.getAttribute('data-from') === id || p.getAttribute('data-to') === id;
      p.classList.toggle('is-hl', hl);
    });
    showDetail(id);
  }

  function showDetail(id) {
    var detail = $('#ov-detail', root);
    if (!detail || !mmLayout) return;
    var node = mmLayout.byId[id];
    if (!node) return;

    var levelLabel = { center: '中心', primary: '一级主题', secondary: '笔记' }[node.level];
    var title = node.name;
    var summary = '';
    var metaLines = [];
    var actions = '';

    if (node.level === 'center') {
      summary = '全部笔记的起点。林会持续为你自动构建知识脉络，无需手动整理。';
      metaLines.push('主题数：' + MOCK_MINDMAP.branches.length);
      actions = '<button class="ov-detail__btn" data-action="ov-mm-menu-rename" data-node="' + id + '">重命名</button>' +
        '<button class="ov-detail__btn ov-detail__btn--primary" data-action="ov-mm-regen">重新生成</button>';
    } else if (node.level === 'primary') {
      var cnt = node.childIds ? node.childIds.length : 0;
      summary = 'AI 已将该主题下的 ' + cnt + ' 篇相关笔记归集到这里。';
      metaLines.push('主题：' + node.topic);
      metaLines.push('归集笔记：' + cnt + ' 篇');
      actions = '<button class="ov-detail__btn" data-action="ov-mm-menu-rename" data-node="' + id + '">重命名</button>' +
        '<button class="ov-detail__btn ov-detail__btn--primary" data-action="ov-mm-regen-sub" data-node="' + id + '">重新生成结构</button>';
    } else {
      var d = MOCK_MM_DETAILS[node.name] || {};
      summary = d.summary || '林关联的笔记节点。';
      metaLines.push('所属主题：' + node.topic);
      if (d.modified) metaLines.push('最后修改：' + d.modified);
      var openBtn = d.noteId
        ? '<button class="ov-detail__btn ov-detail__btn--primary" data-action="ov-mm-open-note" data-note="' + escapeHtml(d.noteId) + '">打开笔记</button>'
        : '<button class="ov-detail__btn ov-detail__btn--primary" data-action="ov-mm-menu-rename" data-node="' + id + '">查看</button>';
      actions = openBtn + '<button class="ov-detail__btn" data-action="ov-mm-menu-more" data-node="' + id + '">更多</button>';
    }

    var metaHtml = metaLines.map(function (m) { return '<span>' + escapeHtml(m) + '</span>'; }).join('');
    detail.innerHTML =
      '<div class="ov-detail__head">' +
        '<span class="ov-detail__level ov-detail__level--' + node.level + '">' + escapeHtml(levelLabel) + '</span>' +
        '<button class="ov-detail__close" data-action="ov-detail-close" aria-label="关闭">' + IC.close(16) + '</button>' +
      '</div>' +
      '<h3 class="ov-detail__title">' + escapeHtml(title) + '</h3>' +
      '<p class="ov-detail__summary">' + escapeHtml(summary) + '</p>' +
      '<div class="ov-detail__meta">' + metaHtml + '</div>' +
      '<div class="ov-detail__actions">' + actions + '</div>';
    detail.classList.add('is-show');
  }

  function hideDetail() { var d = $('#ov-detail', root); if (d) { d.classList.remove('is-show'); d.innerHTML = ''; } }

  function showNodeMenu(nodeEl, clientX, clientY) {
    var menu = $('#ov-menu', root);
    if (!menu) return;
    var id = nodeEl.getAttribute('data-node');
    var node = mmLayout && mmLayout.byId[id];
    var isNote = node && node.level === 'secondary';
    var rect = root.getBoundingClientRect();
    var x = clientX - rect.left;
    var y = clientY - rect.top;
    var items = '';
    if (isNote) {
      var d = MOCK_MM_DETAILS[node.name] || {};
      if (d.noteId) items += menuBtn('ov-mm-open-note', IC.open(), '打开', { note: d.noteId });
      items += menuBtn('ov-mm-menu-rename', IC.edit(), '重命名', { node: id });
      items += menuBtn('ov-mm-regen-sub', IC.refresh(), '重新生成结构', { node: id }, 'ai');
      items += menuBtn('ov-mm-delete', IC.trash(), '删除', { node: id }, 'danger');
    } else {
      items += menuBtn('ov-mm-menu-rename', IC.edit(), '重命名', { node: id });
      items += menuBtn('ov-mm-regen-sub', IC.refresh(), '重新生成结构', { node: id }, 'ai');
      items += menuBtn('ov-mm-delete', IC.trash(), '删除', { node: id }, 'danger');
    }
    menu.innerHTML = items;
    menu.setAttribute('data-for-node', id);
    menu.classList.add('is-open');
    var mw = 180, mh = 200;
    menu.style.left = Math.max(8, Math.min(x - mw / 2, rect.width - mw - 8)) + 'px';
    menu.style.top = Math.max(8, Math.min(y, rect.height - mh - 8)) + 'px';
  }

  function menuBtn(action, icon, label, data, kind) {
    var cls = 'ov-menu__item' + (kind ? ' ov-menu__item--' + kind : '');
    var d = '';
    Object.keys(data || {}).forEach(function (k) { d += ' data-' + k + '="' + escapeHtml(data[k]) + '"'; });
    return '<button class="' + cls + '" data-action="' + action + '"' + d + ' role="menuitem">' + icon + '<span>' + escapeHtml(label) + '</span></button>';
  }

  function hideMenu() { var m = $('#ov-menu', root); if (m) { m.classList.remove('is-open'); m.innerHTML = ''; } }

  /* ----------------------------- 列表项 ⋯ 菜单 ----------------------------- */

  function showItemMenu(id, kind, anchorEl) {
    var menu = $('#ov-menu', root);
    if (!menu || !anchorEl) return;
    var items = '';
    if (kind === 'note') {
      items += menuBtn('ov-item-open', IC.open(), '打开笔记', { note: id });
      items += menuBtn('ov-open-versions', IC.history(), '版本历史', { note: id });
      items += menuBtn('ov-item-select', IC.check(), '选择（多选）', { note: id });
      items += menuBtn('ov-item-rename', IC.edit(), '重命名', { note: id });
      items += menuBtn('ov-item-delete', IC.trash(), '删除', { note: id }, 'danger');
    } else {
      items += menuBtn('ov-item-rename', IC.edit(), '重命名', { note: id });
      items += menuBtn('ov-item-delete', IC.trash(), '删除文件夹', { note: id }, 'danger');
    }
    menu.innerHTML = items;
    menu.setAttribute('data-for-item', id);
    menu.classList.add('is-open');
    var rect = root.getBoundingClientRect();
    var ar = anchorEl.getBoundingClientRect();
    var mw = 180;
    menu.style.left = Math.max(8, Math.min(ar.right - rect.left - mw, rect.width - mw - 8)) + 'px';
    menu.style.top = Math.min(ar.bottom - rect.top + 4, rect.height - 220) + 'px';
  }

  /* ----------------------------- 版本抽屉 ----------------------------- */

  function openVersionDrawer(noteId) {
    state.currentNoteId = noteId;
    var drawer = $('#ov-drawer', root);
    if (!drawer) return;
    var versions = versionsOf(noteId);
    var titleEl = $('[data-ov-drawer-title]', root);
    var subEl = $('[data-ov-drawer-sub]', root);
    var body = $('[data-ov-drawer-body]', root);
    if (titleEl) titleEl.textContent = noteNameById(noteId);
    if (subEl) subEl.textContent = '共 ' + versions.length + ' 个版本';
    if (body) {
      if (!versions.length) {
        body.innerHTML = '<div class="ov-empty"><div class="ov-empty__icon">' + IC.history(56) + '</div><div class="ov-empty__text">暂无版本记录</div></div>';
      } else {
        body.innerHTML = '<div class="ov-ver-list">' + versions.map(function (v, i) { return verItemHtml(v, noteId, i); }).join('') + '</div>';
      }
    }
    drawer.classList.add('is-open');
  }

  function closeDrawer() { var d = $('#ov-drawer', root); if (d) d.classList.remove('is-open'); }

  function verItemHtml(v, noteId, idx) {
    var isCurrent = !!v.current;
    var isAi = v.author === 'lin';
    var cls = 'ov-ver' + (isCurrent ? ' ov-ver--current' : '') + (isAi ? ' ov-ver--ai' : '');
    var byName = isAi ? '林' : '你';
    var byCls = 'ov-ver__by' + (isAi ? ' ov-ver__by--ai' : '');
    var h = '<div class="' + cls + '" data-ver-idx="' + idx + '">';
    h += '<div class="ov-ver__rail"><span class="ov-ver__dot"></span><span class="ov-ver__line"></span></div>';
    h += '<div class="ov-ver__main">';
    h += '<div class="ov-ver__row1">';
    h += '<span class="ov-ver__v">v' + v.v + '</span>';
    if (isCurrent) h += '<span class="ov-ver__current-tag">当前</span>';
    if (isAi) h += '<span class="ov-ver__ai-tag">林</span>';
    h += '<span class="ov-ver__time">' + escapeHtml(v.time) + '</span>';
    h += '</div>';
    h += '<div class="' + byCls + '">由 <b>' + escapeHtml(byName) + '</b> ' + (isAi ? '重写' : '编辑') + '</div>';
    h += '<div class="ov-ver__note">' + escapeHtml(v.note) + '</div>';
    h += '<div class="ov-ver__actions">';
    h += '<button class="ov-ver__btn" data-action="ov-ver-view" data-note="' + escapeHtml(noteId) + '" data-idx="' + idx + '">查看</button>';
    if (!isCurrent) h += '<button class="ov-ver__btn" data-action="ov-ver-compare" data-note="' + escapeHtml(noteId) + '" data-idx="' + idx + '">对比当前</button>';
    if (!isCurrent) h += '<button class="ov-ver__btn ov-ver__btn--danger" data-action="ov-ver-rollback" data-idx="' + idx + '">回滚</button>';
    h += '</div>';
    h += '<div class="ov-ver-preview" data-preview="' + idx + '"></div>';
    if (!isCurrent) {
      h += '<div class="ov-confirm" data-confirm="' + idx + '">' +
        '<div class="ov-confirm__text">确认回滚到 v' + v.v + '？当前版本会变为历史版本，仍可再次回滚恢复。</div>' +
        '<div class="ov-confirm__actions">' +
        '<button class="ov-ver__btn" data-action="ov-ver-cancel-roll" data-idx="' + idx + '">取消</button>' +
        '<button class="ov-ver__btn ov-ver__btn--danger" data-action="ov-ver-confirm-roll" data-note="' + escapeHtml(noteId) + '" data-idx="' + idx + '">确认回滚</button>' +
        '</div></div>';
    }
    h += '</div></div>';
    return h;
  }

  /* ---- 简单 LCS 行级 diff ---- */
  function lcsDiff(a, b) {
    var n = a.length, m = b.length;
    var dp = [];
    for (var i = 0; i <= n; i++) dp.push(new Array(m + 1).fill(0));
    for (var i2 = 1; i2 <= n; i2++) {
      for (var j = 1; j <= m; j++) {
        if (a[i2 - 1] === b[j - 1]) dp[i2][j] = dp[i2 - 1][j - 1] + 1;
        else dp[i2][j] = Math.max(dp[i2 - 1][j], dp[i2][j - 1]);
      }
    }
    var out = [];
    var i3 = n, j3 = m;
    while (i3 > 0 && j3 > 0) {
      if (a[i3 - 1] === b[j3 - 1]) { out.unshift({ type: 'ctx', text: a[i3 - 1] }); i3--; j3--; }
      else if (dp[i3 - 1][j3] >= dp[i3][j3 - 1]) { out.unshift({ type: 'del', text: a[i3 - 1] }); i3--; }
      else { out.unshift({ type: 'add', text: b[j3 - 1] }); j3--; }
    }
    while (i3 > 0) { out.unshift({ type: 'del', text: a[i3 - 1] }); i3--; }
    while (j3 > 0) { out.unshift({ type: 'add', text: b[j3 - 1] }); j3--; }
    return out;
  }

  function showPreview(idx, label, linesHtml, modeTag) {
    var box = $('[data-preview="' + idx + '"]', root);
    if (!box) return;
    if (box.classList.contains('is-show') && box.getAttribute('data-mode') === modeTag) {
      box.classList.remove('is-show');
      return;
    }
    box.setAttribute('data-mode', modeTag);
    box.innerHTML = '<div class="ov-ver-preview__label">' + escapeHtml(label) + '</div>' + linesHtml;
    box.classList.add('is-show');
  }

  function actVerView(noteId, idx) {
    var v = versionsOf(noteId)[idx];
    if (!v) return;
    var lines = (v.content || []).map(function (l) {
      return '<div class="ov-diff-line ov-diff-line--ctx">' + escapeHtml(l || ' ') + '</div>';
    }).join('');
    showPreview(idx, '版本预览 · v' + v.v, lines, 'view');
  }

  function actVerCompare(noteId, idx) {
    var v = versionsOf(noteId)[idx];
    var cur = currentVersion(noteId);
    if (!v || !cur) return;
    var diff = lcsDiff(v.content || [], cur.content || []);
    var lines = diff.map(function (d) {
      var cls = d.type === 'add' ? 'add' : (d.type === 'del' ? 'del' : 'ctx');
      var sign = d.type === 'add' ? '+ ' : (d.type === 'del' ? '- ' : '  ');
      return '<div class="ov-diff-line ov-diff-line--' + cls + '">' + sign + escapeHtml(d.text || ' ') + '</div>';
    }).join('');
    showPreview(idx, '差异对比 · v' + v.v + ' → 当前', lines, 'compare');
  }

  function actRollback(idx) {
    $all('[data-confirm].is-show', root).forEach(function (c) { c.classList.remove('is-show'); });
    var c = $('[data-confirm="' + idx + '"]', root);
    if (c) c.classList.add('is-show');
  }

  function actConfirmRollback(noteId, idx) {
    var v = versionsOf(noteId)[idx];
    closeDrawer();
    toast('已回滚到 v' + (v ? v.v : '?'), true);
  }

  /* ----------------------------- 多选 ----------------------------- */

  function enterMulti(noteId) {
    state.multiselect = true;
    state.selectedNotes = {};
    if (noteId) state.selectedNotes[noteId] = true;
    state._justEntered = noteId;
    renderMultibar();
    renderFolderView();
  }

  function exitMulti() {
    state.multiselect = false;
    state.selectedNotes = {};
    state._justEntered = null;
    renderMultibar();
    renderFolderView();
  }

  function toggleSelectNote(noteId) {
    if (state.selectedNotes[noteId]) delete state.selectedNotes[noteId];
    else state.selectedNotes[noteId] = true;
    renderMultibar();
    renderFolderView();
  }

  /* ----------------------------- 动作 ----------------------------- */

  function setTab(tab) {
    if (state.tab === tab) return;
    state.tab = tab;
    renderTabs();
    if (tab === 'mindmap') {
      renderMindmapView();
      bindMindmapGestures();
    } else {
      renderFolderView();
    }
  }

  function setScope(scope) {
    if (state.scope === scope) return;
    state.scope = scope;
    state.expandedFolders = defaultExpanded();
    state.multiselect = false;
    state.selectedNotes = {};
    renderAll();
  }

  function toggleFolder(folderId) {
    if (state.expandedFolders[folderId]) delete state.expandedFolders[folderId];
    else state.expandedFolders[folderId] = true;
    renderFolderView();
  }

  function cycleSort() {
    var i = SORT_CYCLE.indexOf(state.sort);
    state.sort = SORT_CYCLE[(i + 1) % SORT_CYCLE.length];
    renderFolderView();
    var sl = $('[data-ov-sort-label]', root);
    if (sl) sl.textContent = SORT_LABELS[state.sort];
  }

  function openNote(noteId) {
    if (window.ZX_EDITOR && typeof window.ZX_EDITOR.open === 'function') {
      try {
        window.ZX_EDITOR.open('doc', { noteId: noteId });
        close();
        return;
      } catch (e) {}
    }
    toast('编辑器加载中…（ZX_EDITOR 未就绪）');
  }

  /* ----------------------------- Toast ----------------------------- */

  var toastTimer = null;
  function toast(msg, withSpark) {
    var t = $('[data-ov-toast]', root);
    if (!t) return;
    t.innerHTML = (withSpark ? '<span class="ov-toast__spark">' + IC.spark() + '</span>' : '') + '<span>' + escapeHtml(msg) + '</span>';
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 1900);
  }

  /* ----------------------------- 事件委托 ----------------------------- */

  function onClick(e) {
    var target = e.target;
    if (!target.closest) return;

    if (!target.closest('#ov-menu')) hideMenu();

    var actEl = target.closest('[data-action]');
    if (!actEl) return;
    var action = actEl.getAttribute('data-action');

    switch (action) {
      case 'ov-close': close(); break;
      case 'ov-set-scope': setScope(actEl.getAttribute('data-scope')); break;
      case 'ov-set-tab': setTab(actEl.getAttribute('data-tab')); break;
      case 'ov-cycle-sort': cycleSort(); break;

      case 'ov-toggle-folder': {
        if (state.multiselect) { toast('多选模式下不支持展开文件夹'); break; }
        toggleFolder(actEl.getAttribute('data-folder'));
        break;
      }

      case 'ov-open-note': {
        var nid = actEl.getAttribute('data-note');
        if (state.multiselect) {
          if (state._justEntered === nid) { state._justEntered = null; break; }
          toggleSelectNote(nid);
          break;
        }
        openNote(nid);
        break;
      }

      case 'ov-toggle-select': {
        toggleSelectNote(actEl.getAttribute('data-note'));
        break;
      }

      case 'ov-open-versions': {
        if (state.multiselect) { toggleSelectNote(actEl.getAttribute('data-note')); break; }
        openVersionDrawer(actEl.getAttribute('data-note'));
        break;
      }

      case 'ov-item-more': {
        showItemMenu(actEl.getAttribute('data-id'), actEl.getAttribute('data-kind'), actEl);
        e.stopPropagation();
        break;
      }
      case 'ov-item-open': hideMenu(); openNote(actEl.getAttribute('data-note')); break;
      case 'ov-item-select': hideMenu(); enterMulti(actEl.getAttribute('data-note')); break;
      case 'ov-item-rename': hideMenu(); toast('重命名（占位）'); break;
      case 'ov-item-delete': hideMenu(); toast('已删除（占位）'); break;

      case 'ov-multi-move': toast('选择目标文件夹（占位）'); break;
      case 'ov-multi-delete': toast('已删除 ' + Object.keys(state.selectedNotes).length + ' 篇（占位）'); exitMulti(); break;
      case 'ov-multi-exit': exitMulti(); break;

      case 'ov-mm-zoom-in': zoomBy(1.18); break;
      case 'ov-mm-zoom-out': zoomBy(1 / 1.18); break;
      case 'ov-mm-regen': toast('林正在重新构建思维导图…', true); break;
      case 'ov-mm-regen-sub': hideMenu(); toast('林正在重新生成该分支…', true); break;
      case 'ov-mm-menu-rename': hideMenu(); toast('重命名节点（占位）'); break;
      case 'ov-mm-menu-more': {
        var mn = actEl.getAttribute('data-node');
        hideMenu();
        var nEl = mn ? $('[data-node="' + mn + '"]', root) : null;
        if (nEl) {
          var rect = nEl.getBoundingClientRect();
          var rrect = root.getBoundingClientRect();
          showNodeMenu(nEl, rect.left - rrect.left + 24, rect.top - rrect.top + 24);
        }
        break;
      }
      case 'ov-mm-open-note': hideMenu(); openNote(actEl.getAttribute('data-note')); break;
      case 'ov-mm-delete': hideMenu(); toast('已删除节点（占位）'); break;
      case 'ov-detail-close': hideDetail(); break;

      case 'ov-drawer-close': closeDrawer(); break;
      case 'ov-ver-view': actVerView(actEl.getAttribute('data-note'), parseInt(actEl.getAttribute('data-idx'), 10)); break;
      case 'ov-ver-compare': actVerCompare(actEl.getAttribute('data-note'), parseInt(actEl.getAttribute('data-idx'), 10)); break;
      case 'ov-ver-rollback': actRollback(parseInt(actEl.getAttribute('data-idx'), 10)); break;
      case 'ov-ver-cancel-roll': { var c = $('[data-confirm="' + actEl.getAttribute('data-idx') + '"]', root); if (c) c.classList.remove('is-show'); break; }
      case 'ov-ver-confirm-roll': actConfirmRollback(actEl.getAttribute('data-note'), parseInt(actEl.getAttribute('data-idx'), 10)); break;

      default: break;
    }
  }

  function onSearchInput(e) {
    state.search = e.target.value || '';
    renderFolderView();
  }

  function bindEvents() {
    if (!root || root.__ovEvents) return;
    root.__ovEvents = true;
    root.addEventListener('click', onClick);
    var search = $('[data-ov-search]', root);
    if (search) search.addEventListener('input', onSearchInput);
    document.addEventListener('click', function (e) {
      if (!root || root.hidden) return;
      if (!e.target.closest('#ov-menu') && !e.target.closest('[data-action="ov-item-more"]') && !e.target.closest('.ov-mm-node')) {
        hideMenu();
      }
    });
  }

  /* ----------------------------- 工作台顶栏 📁 按钮注入 ----------------------------- */

  function injectTopbarButton() {
    var right = document.querySelector('.nb-topbar__right');
    if (!right) return;
    if (right.querySelector('[data-action="open-overview"]')) return;
    var btn = el('button', 'nb-iconbtn');
    btn.setAttribute('data-action', 'open-overview');
    btn.setAttribute('aria-label', '笔记总览');
    btn.setAttribute('title', '笔记总览');
    btn.innerHTML = IC.folder(22);
    btn.addEventListener('click', function (e) {
      e.stopPropagation();
      if (window.ZX_OVERVIEW) window.ZX_OVERVIEW.open();
    });
    right.insertBefore(btn, right.firstChild);
  }

  /* ----------------------------- 公共 API ----------------------------- */

  function open(options) {
    ensureRoot();
    buildShell();
    bindEvents();
    if (!state.expandedFolders || !Object.keys(state.expandedFolders).length) {
      state.expandedFolders = defaultExpanded();
    }
    if (options) {
      if (options.tab) state.tab = options.tab;
      if (options.scope) { state.scope = options.scope; state.expandedFolders = defaultExpanded(); }
    }
    renderAll();
    root.hidden = false;
    root.classList.add('is-open');
    if (state.tab === 'mindmap') {
      renderMindmapView();
      bindMindmapGestures();
    }
    injectTopbarButton();
  }

  function close() {
    if (!root) return;
    root.classList.remove('is-open');
    root.hidden = true;
    hideMenu();
    closeDrawer();
    hideDetail();
  }

  function isOpen() { return !!(root && !root.hidden); }

  window.ZX_OVERVIEW = {
    open: open,
    close: close,
    isOpen: isOpen,
    openVersionDrawer: openVersionDrawer,
    setTab: setTab,
    setScope: setScope
  };

  /* ----------------------------- 启动 ----------------------------- */

  function boot() {
    ensureRoot();
    if (root) {
      root.hidden = true;
    }
    injectTopbarButton();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
  setTimeout(injectTopbarButton, 0);
})();
