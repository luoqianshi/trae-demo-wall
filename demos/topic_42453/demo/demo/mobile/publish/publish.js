/* =========================================================================
 * 「知行」App 本体 Demo —— Phase 3 / 发布页逻辑（publish.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 发布页视图栈：main → repo / drafts / history / commit（均右入，可叠加）
 *   2. 发布操作卡：草稿选择 · 公有/私有/团队 segment · 受众 · 标签 · commit message
 *   3. 变更预览 diff（源码 / 预览 切换 · 折叠展开）
 *   4. 仓库列表（搜索 + 排序）→ 仓库详情（分支 · git log commit 历史）
 *   5. 最近活动时间线（发布/编辑/合并/回滚/AI 改动，AI 用鎏金 ✦）
 *   6. 发布确认模态 + Toast
 * 依赖：../../demo/shared/icons.js（ZX.icon）· 内联 MOCK_REPOS / MOCK_COMMITS / MOCK_DRAFTS
 * 挂载：window.ZX_PUBLISH
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
    drafts:  function () { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'); },
    clock:   function () { return svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>'); },
    globe:   function () { return svg('<circle cx="12" cy="12" r="8"/><path d="M4 12h16"/><path d="M12 4c2.5 2.4 2.5 13.6 0 16M12 4c-2.5 2.4-2.5 13.6 0 16"/>'); },
    lock:    function () { return svg('<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>'); },
    users:   function () { return svg('<circle cx="9" cy="8" r="3"/><path d="M3 19c0-3 2.7-5 6-5s6 2 6 5"/><path d="M16 6a3 3 0 0 1 0 6"/><path d="M17 14c2.5.4 4 2.2 4 5"/>'); },
    folder:  function () { return svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>'); },
    star:    function () { return svg('<path d="M12 3l2.6 5.6L20 9.4l-4 4 1 6L12 16.6 7 19.4l1-6-4-4 5.4-.8z"/>'); },
    branch:  function () { return svg('<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="9" r="2.4"/><path d="M6 8.4v7.2"/><path d="M18 11.4c0 4-6 2-6 6"/>'); },
    merge:   function () { return svg('<circle cx="6" cy="6" r="2.4"/><circle cx="6" cy="18" r="2.4"/><circle cx="18" cy="12" r="2.4"/><path d="M6 8.4v7.2"/><path d="M18 9.6c0 3-7 2.4-9 6"/>'); },
    undo:    function () { return svg('<path d="M9 14L4 9V4"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>'); },
    upload:  function () { return svg('<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>'); },
    edit:    function () { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>'); },
    del:     function () { return svg('<path d="M4 7h16M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13"/>'); },
    more:    function () { return svg('<circle cx="5" cy="12" r="1.4"/><circle cx="12" cy="12" r="1.4"/><circle cx="19" cy="12" r="1.4"/>'); },
    chev:    function () { return svg('<path d="M6 9l6 6 6-6"/>'); },
    check:   function () { return zicon('check'); },
    close:   function () { return zicon('close'); },
    plus:    function () { return zicon('plus'); },
    search:  function () { return zicon('search'); },
    back:    function () { return zicon('arrow-left'); },
    spark:   function () { return zicon('spark'); }
  };

  /* ----------------------------- Mock 数据 -----------------------------
   * 主线：固态电池 / 硫化物电解质 / 界面阻抗 / 钠电池枝晶
   * -------------------------------------------------------------------- */

  var MOCK_DRAFTS = [
    {
      id: 'd1',
      title: '硫化物电解质 5 大优势与界面挑战',
      excerpt: '从离子电导率、可塑性、电化学窗口三个维度，系统梳理硫化物电解质的核心优势，并讨论与正极界面副反应的应对策略。',
      lastModified: '2 小时前',
      visibility: 'public',
      audience: 'followers',
      tags: ['固态电池', '硫化物', '界面修饰'],
      commitHint: '补充第 4、5 条优势，重写界面段落',
      diff: {
        additions: 18, deletions: 4, modifications: 6,
        lines: [
          { type: 'ctx', text: '# 硫化物电解质 5 大优势' },
          { type: 'ctx', text: '硫化物电解质（如 Li₆PS₅Cl）室温离子电导率可达 10⁻³ S/cm。' },
          { type: 'del', text: '优势主要集中在：高电导率、易加工两点。' },
          { type: 'add', text: '优势可拆解为五点：① 高离子电导率 ② 良好可塑性 ③ 软特性降低界面阻抗 ④ 与锂金属负极兼容 ⑤ 可冷压成膜。' },
          { type: 'mod', text: '界面挑战：与氧化物正极（NCM）存在副反应，需 LiNbO₃ 缓冲层隔离。' },
          { type: 'ai',  text: '林帮你润色了第二段，将「主要集中在」改为「可拆解为五点」，更结构化。' },
          { type: 'add', text: '新增「与锂金属兼容」一节，引用张衡组的循环数据。' },
          { type: 'ctx', text: '参考文献：Janek & Zeier, Nat. Energy 2023.' }
        ]
      }
    },
    {
      id: 'd2',
      title: '钠电池枝晶抑制的三种思路',
      excerpt: '比较人工 SEI、三维集流体、电解液添加剂三条路径在钠金属电池中的枝晶抑制效果与工程化成本。',
      lastModified: '昨天 21:14',
      visibility: 'private',
      audience: 'all',
      tags: ['钠电池', '枝晶'],
      commitHint: '补充三维集流体数据表',
      diff: {
        additions: 12, deletions: 2, modifications: 3,
        lines: [
          { type: 'ctx', text: '# 钠电池枝晶抑制的三种思路' },
          { type: 'mod', text: '三维集流体：铜网骨架可将有效电流密度降至原来的 1/3。' },
          { type: 'add', text: '数据表：铜网 vs 平面铜，500h 循环枝晶出现率 12% → 4%。' },
          { type: 'del', text: '人工 SEI 成本偏高，暂不列入工程化首选。' }
        ]
      }
    },
    {
      id: 'd3',
      title: '界面阻抗测量方法学综述（草稿）',
      excerpt: 'EIS、DRT、对称电池三驾马车，分别解决什么问题、各自陷阱在哪。',
      lastModified: '3 天前',
      visibility: 'team',
      audience: 'group',
      tags: ['EIS', '方法学', '固态电池'],
      commitHint: '整理 DRT 解析常见误用',
      diff: {
        additions: 8, deletions: 1, modifications: 2,
        lines: [
          { type: 'ctx', text: '# 界面阻抗测量方法学' },
          { type: 'add', text: 'DRT 解析陷阱：正则化参数过小会制造虚假峰。' },
          { type: 'mod', text: '对称电池：只能测本体+界面之和，无法分离。' }
        ]
      }
    }
  ];

  var MOCK_REPOS = [
    {
      id: 'r1', name: 'solid-state-primer', displayName: '固态电池入门手册',
      desc: '面向材料学初学者的固态电池知识体系，已沉淀 28 篇笔记 + 9 场讨论。',
      visibility: 'public', stars: 142, forks: 18, branch: 'main', type: 'collection', topic: '材料学',
      commitCount: 64,
      lastCommit: { hash: 'a3f2d1e', message: '林帮你润色了第二段', time: '2 小时前', author: '林', type: 'ai' },
      commits: [
        { hash: 'a3f2d1e', message: '林帮你润色了第二段，将「主要集中在」改为「可拆解为五点」', time: '2 小时前', author: '林', authorColor: '#C7A24A', type: 'ai' },
        { hash: '7b9c0f2', message: '添加硫化物 5 大优势章节', time: '昨天', author: '我', authorColor: '#1D5B7A', type: 'edit' },
        { hash: 'c1d8a9b', message: 'Merge branch「界面修饰」into main', time: '3 天前', author: '我', authorColor: '#1D5B7A', type: 'merge' },
        { hash: '5e2f4c7', message: '初始发布：建立手册骨架', time: '1 周前', author: '我', authorColor: '#1D5B7A', type: 'publish' },
        { hash: '9a0b3d5', message: 'Revert: 误删「界面阻抗」一节，回滚到 c1d8a9b', time: '2 周前', author: '我', authorColor: '#1D5B7A', type: 'rollback' }
      ]
    },
    {
      id: 'r2', name: 'interface-impedance-debate', groupName: '界面阻抗讨论合集', displayName: '界面阻抗讨论合集',
      desc: '沈砚 vs 林知微：长循环下本体阻抗才是决定因素吗？收录 9 场讨论与原始数据。',
      visibility: 'public', stars: 87, forks: 6, branch: 'main', type: 'debate', topic: '电化学',
      commitCount: 31,
      lastCommit: { hash: '4f8c1a2', message: '新增沈砚反驳：n=12 循环数据复核', time: '昨天', author: '沈砚', type: 'edit' },
      commits: [
        { hash: '4f8c1a2', message: '新增沈砚反驳：n=12 循环数据复核', time: '昨天', author: '沈砚', authorColor: '#B4602C', type: 'edit' },
        { hash: '2d6e9b3', message: '林知微发起第 9 轮讨论', time: '4 天前', author: '林知微', authorColor: '#C1272D', type: 'publish' },
        { hash: '8a1f0c4', message: '合并「测量方法」分支', time: '1 周前', author: '我', authorColor: '#1D5B7A', type: 'merge' }
      ]
    },
    {
      id: 'r3', name: 'sodium-dendrite-notes', displayName: '钠电池枝晶笔记',
      desc: '钠金属电池枝晶抑制的个人笔记，含三维集流体实验记录。',
      visibility: 'private', stars: 0, forks: 0, branch: 'main', type: 'note', topic: '电池工程',
      commitCount: 12,
      lastCommit: { hash: '6b2d7e1', message: '补充三维集流体数据表', time: '昨天 21:14', author: '我', type: 'edit' },
      commits: [
        { hash: '6b2d7e1', message: '补充三维集流体数据表', time: '昨天 21:14', author: '我', authorColor: '#1D5B7A', type: 'edit' },
        { hash: '3c9a4f8', message: '建立枝晶抑制三路径框架', time: '5 天前', author: '我', authorColor: '#1D5B7A', type: 'publish' }
      ]
    },
    {
      id: 'r4', name: 'eis-methodology', displayName: 'EIS 方法学综述',
      desc: '电化学阻抗谱测量方法学综述，团队协作维护版本。',
      visibility: 'team', stars: 24, forks: 4, branch: 'main', type: 'note', topic: '方法学',
      commitCount: 19,
      lastCommit: { hash: '1e5b8a3', message: '李轻语整理 DRT 解析误用', time: '3 天前', author: '李轻语', type: 'edit' },
      commits: [
        { hash: '1e5b8a3', message: '李轻语整理 DRT 解析常见误用', time: '3 天前', author: '李轻语', authorColor: '#E58A8E', type: 'edit' },
        { hash: '7f2c0d6', message: '陈墨白补充对称电池陷阱', time: '1 周前', author: '陈墨白', authorColor: '#1D5B7A', type: 'edit' },
        { hash: '0a4e9b2', message: '建立综述骨架', time: '2 周前', author: '我', authorColor: '#1D5B7A', type: 'publish' }
      ]
    },
    {
      id: 'r5', name: 'cathode-coating-review', displayName: '正极涂层方案对比',
      desc: 'LiNbO₃、LiZrO₃、Al₂O₃ 三种正极涂层在硫化物体系中的横向对比。',
      visibility: 'public', stars: 56, forks: 3, branch: 'main', type: 'note', topic: '材料学',
      commitCount: 8,
      lastCommit: { hash: 'b5c3d7e', message: '林帮你补充循环数据图注', time: '4 天前', author: '林', type: 'ai' },
      commits: [
        { hash: 'b5c3d7e', message: '林帮你补充循环数据图注', time: '4 天前', author: '林', authorColor: '#C7A24A', type: 'ai' },
        { hash: '9d2a6f1', message: '完成三种涂层横向对比表', time: '1 周前', author: '我', authorColor: '#1D5B7A', type: 'publish' }
      ]
    },
    {
      id: 'r6', name: 'weekly-review-2026w24', displayName: '2026 第 24 周复盘',
      desc: '本周学习复盘：界面阻抗主线推进 + 3 场讨论 + 林帮你润色 7 次的统计。',
      visibility: 'private', stars: 0, forks: 0, branch: 'main', type: 'note', topic: '复盘',
      commitCount: 5,
      lastCommit: { hash: 'c0e4f2a', message: '发布本周复盘 v1', time: '2 天前', author: '我', type: 'publish' },
      commits: [
        { hash: 'c0e4f2a', message: '发布本周复盘 v1', time: '2 天前', author: '我', authorColor: '#1D5B7A', type: 'publish' }
      ]
    }
  ];

  var MOCK_ACTIVITY = [
    { hash: 'a3f2d1e', type: 'ai', title: '林帮你润色了「硫化物电解质 5 大优势」第二段', time: '2 小时前', repo: 'solid-state-primer' },
    { hash: '7b9c0f2', type: 'publish', title: '发布 v0.3 至 solid-state-primer', time: '昨天', repo: 'solid-state-primer' },
    { hash: '4f8c1a2', type: 'edit', title: '沈砚在 interface-impedance-debate 新增反驳', time: '昨天', repo: 'interface-impedance-debate' },
    { hash: '6b2d7e1', type: 'edit', title: '编辑 sodium-dendrite-notes，补充数据表', time: '昨天 21:14', repo: 'sodium-dendrite-notes' },
    { hash: '1e5b8a3', type: 'edit', title: '李轻语更新 EIS 方法学综述', time: '3 天前', repo: 'eis-methodology' },
    { hash: 'b5c3d7e', type: 'ai', title: '林帮你补充循环数据图注', time: '4 天前', repo: 'cathode-coating-review' },
    { hash: '8a1f0c4', type: 'merge', title: '合并「测量方法」分支至 interface-impedance-debate', time: '1 周前', repo: 'interface-impedance-debate' },
    { hash: '9a0b3d5', type: 'rollback', title: '回滚 solid-state-primer 至 c1d8a9b（误删修复）', time: '2 周前', repo: 'solid-state-primer' }
  ];

  var TAG_SUGGESTIONS = ['界面阻抗', 'NCM 正极', 'LiNbO₃', '循环寿命', '第一性原理', 'DRT'];

  /* ----------------------------- 状态 ----------------------------- */

  var state = {
    selectedDraftId: 'd1',
    visibility: window.VIS ? VIS.defaultVisibility() : { scope: 'all', preview: 'summary', paywall: 'free' },
    audience: 'followers',
    tags: ['固态电池', '硫化物', '界面修饰'],
    commitMsg: '',
    _tagInputOpen: false,
    diffExpanded: false,
    diffMode: 'source',
    repoSearch: '',
    repoSort: 'recent'
  };

  var stack = [{ name: 'main' }];
  var currentRepo = null;
  var root = null;
  var toastTimer = null;

  /* ----------------------------- 数据查找 ----------------------------- */

  function currentDraft() {
    for (var i = 0; i < MOCK_DRAFTS.length; i++) { if (MOCK_DRAFTS[i].id === state.selectedDraftId) return MOCK_DRAFTS[i]; }
    return MOCK_DRAFTS[0];
  }
  function findRepoById(id) { for (var i = 0; i < MOCK_REPOS.length; i++) { if (MOCK_REPOS[i].id === id) return MOCK_REPOS[i]; } return null; }
  function findRepoByName(name) { for (var i = 0; i < MOCK_REPOS.length; i++) { if (MOCK_REPOS[i].name === name) return MOCK_REPOS[i]; } return null; }
  function findCommitInRepo(repo, hash) {
    if (!repo) return null;
    for (var i = 0; i < repo.commits.length; i++) { if (repo.commits[i].hash === hash) return repo.commits[i]; }
    return repo.commits[0];
  }

  /* ----------------------------- 片段构造 ----------------------------- */

  var VIS_MAP = { public: ['globe', '公有', 'public'], private: ['lock', '私有', 'private'], team: ['users', '团队', 'team'] };
  var TYPE_MAP = { note: '笔记', debate: '讨论', collection: '合集' };
  var TL_TYPE_MAP = { publish: ['upload', '发布'], edit: ['edit', '编辑'], merge: ['merge', '合并'], rollback: ['undo', '回滚'], ai: ['spark', 'AI 改动'] };

  function visChipHTML(v) {
    var m = VIS_MAP[v] || VIS_MAP.public;
    return '<span class="pub-vis-chip pub-vis-chip--' + m[2] + '">' + IC[m[0]]() + m[1] + '</span>';
  }
  function typeChipHTML(t) {
    return '<span class="pub-type-chip pub-type-chip--' + t + '">' + (TYPE_MAP[t] || t) + '</span>';
  }
  function visLabel(v) { var m = VIS_MAP[v] || VIS_MAP.public; return m[1]; }
  function audienceLabel(a) { return ({ all: '所有', followers: '仅关注', group: '特定群组' })[a] || '所有'; }
  function sortLabel(s) { return ({ recent: '最近', stars: '最多 Star', name: '名称' })[s] || '最近'; }

  function visSegmentHTML() {
    var opts = [['public', 'globe', '公有'], ['private', 'lock', '私有'], ['team', 'users', '团队']];
    return '<div class="pub-segment pub-segment--vis" data-pub-vis-segment>' +
      opts.map(function (o) {
        var on = state.visibility === o[0] ? ' is-active' : '';
        return '<button class="pub-segment__btn' + on + '" data-pub-act="vis" data-val="' + o[0] + '">' + IC[o[1]]() + o[2] + '</button>';
      }).join('') + '</div>';
  }

  function renderPubVisChip() {
    var slot = document.querySelector('[data-pub-vis-slot]');
    if (!slot || !window.VIS) return;
    slot.innerHTML = VIS.chipHTML(state.visibility);
    var chip = slot.querySelector('.vis-chip');
    if (chip) chip.onclick = function () {
      VIS.openPicker(slot, state.visibility, null, function (v) {
        state.visibility = Object.assign({}, v);
        renderPubVisChip();
      });
    };
  }
  function audienceSegmentHTML() {
    var opts = [['all', 'globe', '所有'], ['followers', 'users', '仅关注'], ['group', 'users', '特定群组']];
    return '<div class="pub-segment" data-pub-audience-segment>' +
      opts.map(function (o) {
        var on = state.audience === o[0] ? ' is-active' : '';
        return '<button class="pub-segment__btn' + on + '" data-pub-act="audience" data-val="' + o[0] + '">' + IC[o[1]]() + o[2] + '</button>';
      }).join('') + '</div>';
  }
  function tagsHTML() {
    var chips = state.tags.map(function (t) {
      return '<span class="pub-tag-chip">' + escapeHtml(t) +
        '<button class="pub-tag-chip__x" data-pub-act="tag-remove" data-tag="' + escapeHtml(t) + '" aria-label="移除标签">' + IC.close() + '</button></span>';
    }).join('');
    var add = state._tagInputOpen
      ? '<input class="pub-tag-input" data-pub-tag-input placeholder="标签名，回车确认">'
      : '<button class="pub-tag-add" data-pub-act="tag-add">' + IC.plus() + ' 添加标签</button>';
    return chips + add;
  }

  function commitHashPreview() {
    var d = currentDraft();
    var seed = (d ? d.id : 'x') + '|' + state.commitMsg + '|' + state.visibility;
    var hex = '0123456789abcdef', s = '';
    for (var i = 0; i < 7; i++) { s += hex[(seed.charCodeAt(i % seed.length) + i * 7) % 16]; }
    return s;
  }

  function diffSourceHTML(lines) {
    return lines.map(function (ln) {
      var sign = ln.type === 'add' ? '+' : (ln.type === 'del' ? '−' : (ln.type === 'mod' ? '~' : (ln.type === 'ai' ? '✦' : ' ')));
      return '<div class="pub-diff-line pub-diff-line--' + ln.type + '"><span class="pub-diff-line__sign">' + sign + '</span><span class="pub-diff-line__txt">' + escapeHtml(ln.text) + '</span></div>';
    }).join('');
  }
  function diffPreviewHTML(lines) {
    return lines.map(function (ln) {
      var t = escapeHtml(ln.text);
      if (ln.type === 'del') return '<del>' + t + '</del>';
      if (ln.type === 'add') return '<ins>' + t + '</ins>';
      if (ln.type === 'mod') return '<mark>' + t + '</mark>';
      if (ln.type === 'ai') return '<ins>✦ ' + t + '</ins>';
      return '<span>' + t + '</span>';
    }).join(' ');
  }

  function repoCardHTML(r) {
    return '<div class="pub-repo-card" data-pub-act="open-repo" data-repo-id="' + r.id + '">' +
      '<div class="pub-repo__head">' +
        '<span class="pub-repo__ico">' + IC.folder() + '</span>' +
        '<h3 class="pub-repo__name">' + escapeHtml(r.displayName) + '</h3>' +
        visChipHTML(r.visibility) +
        '<span class="pub-repo__stars">' + IC.star() + r.stars + '</span>' +
      '</div>' +
      '<p class="pub-repo__desc">' + escapeHtml(r.desc) + '</p>' +
      '<div class="pub-repo__foot">' +
        '<span class="pub-repo__branch">' + IC.branch() + escapeHtml(r.branch) + '</span>' +
        '<span class="pub-repo__commit-hash">' + r.lastCommit.hash + '</span>' +
        '<span class="pub-repo__commit-msg">' + escapeHtml(r.lastCommit.message) + '</span>' +
        '<span class="pub-repo__typechip">' + typeChipHTML(r.type) + '</span>' +
        '<span class="pub-repo__time">' + escapeHtml(r.lastCommit.time) + '</span>' +
      '</div>' +
    '</div>';
  }

  function tlItemHTML(it) {
    var m = TL_TYPE_MAP[it.type] || TL_TYPE_MAP.edit;
    return '<div class="pub-tl-item pub-tl-item--' + it.type + '" data-pub-act="tl-item" data-hash="' + it.hash + '" data-repo="' + escapeHtml(it.repo) + '">' +
      '<div class="pub-tl-item__dot">' + IC[m[0]]() + '</div>' +
      '<div class="pub-tl-item__row1">' +
        '<span class="pub-tl-item__hash">' + it.hash + '</span>' +
        '<span class="pub-tl-item__type">' + m[1] + '</span>' +
        '<span class="pub-tl-item__time">' + escapeHtml(it.time) + '</span>' +
      '</div>' +
      '<p class="pub-tl-item__title">' + escapeHtml(it.title) + '</p>' +
      '<div class="pub-tl-item__repo">' + escapeHtml(it.repo) + '</div>' +
    '</div>';
  }

  function commitRowHTML(c, idx) {
    var initial = (c.author || '我').slice(0, 1);
    var color = c.authorColor || '#1D5B7A';
    var head = idx === 0 ? '<span style="color:var(--cinnabar-500);font-weight:600">HEAD</span>' : '';
    return '<div class="pub-commit-row pub-commit-row--' + c.type + '" data-pub-act="open-commit" data-hash="' + c.hash + '">' +
      '<div class="pub-commit-row__dot" style="background:' + color + '">' + escapeHtml(initial) + '</div>' +
      '<div class="pub-commit-row__body">' +
        '<p class="pub-commit-row__msg">' + escapeHtml(c.message) + '</p>' +
        '<div class="pub-commit-row__meta">' +
          '<span class="pub-commit-row__hash">' + c.hash + '</span>' +
          '<span class="pub-commit-row__author">' + escapeHtml(c.author || '我') + '</span>' +
          '<span>' + escapeHtml(c.time) + '</span>' +
          head +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function statHTML(num, lbl) {
    return '<div class="pub-detail-stat"><span class="pub-detail-stat__num">' + num + '</span><span class="pub-detail-stat__lbl">' + lbl + '</span></div>';
  }

  function synthesizeCommitDiff(c) {
    if (c.type === 'ai') {
      return [
        { type: 'ctx', text: '// 第二段 · 润色' },
        { type: 'del', text: '优势主要集中在：高电导率、易加工。' },
        { type: 'add', text: '优势可拆解为五点：① 高离子电导率 ② 良好可塑性 ...' },
        { type: 'ai',  text: '林润色：将「主要集中在」改为「可拆解为五点」，更结构化。' }
      ];
    }
    if (c.type === 'merge') {
      return [
        { type: 'ctx', text: 'Merge branch「界面修饰」into main' },
        { type: 'add', text: '+ 4 行来自「界面修饰」分支的界面涂层内容' },
        { type: 'mod', text: '~ 第二章与第三章顺序微调' }
      ];
    }
    if (c.type === 'rollback') {
      return [
        { type: 'del', text: '误删「界面阻抗」一节的内容已撤销' },
        { type: 'add', text: '回滚至 c1d8a9b，恢复 12 行正文' }
      ];
    }
    return [
      { type: 'ctx', text: '# ' + c.message },
      { type: 'add', text: '+ 新增内容段落，建立结构骨架' }
    ];
  }

  /* ----------------------------- 渲染：主视图 ----------------------------- */

  function renderMain() {
    var html =
      '<div class="pub-sec"><div data-pub-action></div></div>' +
      '<div class="pub-sec">' +
        '<div class="pub-sec-head"><h3 class="pub-sec-title pub-sec-title--gold">本次变更</h3></div>' +
        '<div data-pub-diff></div>' +
      '</div>' +
      '<div class="pub-sec">' +
        '<div class="pub-sec-head">' +
          '<h3 class="pub-sec-title pub-sec-title--indigo">我的仓库 <span class="pub-mono" style="font-size:12px;color:var(--neutral-500)" data-pub-repo-count></span></h3>' +
          '<div class="pub-sec-tools"><button class="pub-sec-tool" data-pub-act="repo-sort"><span data-ic="branch"></span><span data-pub-repo-sort-label>' + sortLabel(state.repoSort) + '</span></button></div>' +
        '</div>' +
        '<div class="pub-searchbar"><span data-ic="search"></span><input data-pub-repo-search placeholder="搜索仓库…" aria-label="搜索仓库"></div>' +
        '<div data-pub-repos></div>' +
      '</div>' +
      '<div class="pub-sec">' +
        '<div class="pub-sec-head"><h3 class="pub-sec-title">最近活动</h3></div>' +
        '<div class="pub-timeline" data-pub-timeline>' + MOCK_ACTIVITY.map(tlItemHTML).join('') + '</div>' +
      '</div>';
    var mainScroll = $('[data-pub-main-scroll]');
    if (!mainScroll) { return; }
    mainScroll.innerHTML = html;
    renderAction();
    renderDiff();
    renderRepos();
    updateDraftsCount();
    injectIcons();
  }

  function renderAction() {
    var d = currentDraft();
    var audienceField = '<div class="pub-field' + (state.visibility === 'public' ? '' : ' is-hidden') + '" data-pub-audience-field>' +
      '<span class="pub-field__label">受众范围</span>' + audienceSegmentHTML() + '</div>';

    var html =
      '<div class="pub-action">' +
        '<h3 class="pub-action__title">准备好<em>发布</em>了？</h3>' +
        '<div class="pub-draft-card" data-pub-act="pick-draft" data-draft-id="' + d.id + '">' +
          '<div class="pub-draft-card__thumb">' + IC.edit() + '</div>' +
          '<div class="pub-draft-card__body">' +
            '<p class="pub-draft-card__title">' + escapeHtml(d.title) + '</p>' +
            '<div class="pub-draft-card__meta">最后修改 ' + escapeHtml(d.lastModified) + ' · <span class="pub-mono">+' + d.diff.additions + ' −' + d.diff.deletions + '</span></div>' +
          '</div>' +
          '<span class="pub-draft-card__chev">' + IC.chev() + '</span>' +
        '</div>' +
        '<div class="pub-field"><span class="pub-field__label">可见性</span><span class="ne-vis-slot" data-pub-vis-slot></span></div>' +
        audienceField +
        '<div class="pub-field"><span class="pub-field__label">标签</span><div class="pub-tags" data-pub-tags>' + tagsHTML() + '</div></div>' +
        '<div class="pub-field">' +
          '<span class="pub-field__label">Commit message</span>' +
          '<textarea class="pub-commit-input" data-pub-commit-input rows="2" placeholder="一句话描述这次改动…">' + escapeHtml(state.commitMsg) + '</textarea>' +
          '<div class="pub-commit-foot"><span>将作为 <span class="pub-mono" data-pub-commit-hash>' + commitHashPreview() + '</span> 提交至 main</span><span data-pub-commit-count>' + state.commitMsg.length + ' 字</span></div>' +
        '</div>' +
        '<button class="pub-btn-publish" data-pub-act="publish">' + IC.check() + ' 发布</button>' +
      '</div>';
    var actionBox = $('[data-pub-action]');
    if (actionBox) actionBox.innerHTML = html;
    renderPubVisChip();
  }

  function renderDiff() {
    var d = currentDraft();
    var lines = d.diff.lines;
    var short = lines.length <= 5;
    var stats = '<span class="add">+' + d.diff.additions + '</span> <span class="del">−' + d.diff.deletions + '</span> <span class="mod">~' + d.diff.modifications + '</span>';
    var diffCls = 'pub-diff' + (state.diffMode === 'preview' ? ' is-preview' : '') + (short ? ' is-short' : '');
    var html =
      '<div class="' + diffCls + '">' +
        '<div class="pub-diff__head">' +
          '<div class="pub-diff__stats">' + stats + '</div>' +
          '<div class="pub-diff-toggle">' +
            '<button class="pub-diff-toggle__btn' + (state.diffMode === 'source' ? ' is-active' : '') + '" data-pub-act="diff-mode" data-val="source">源码</button>' +
            '<button class="pub-diff-toggle__btn' + (state.diffMode === 'preview' ? ' is-active' : '') + '" data-pub-act="diff-mode" data-val="preview">预览</button>' +
          '</div>' +
        '</div>' +
        '<div class="pub-diff__body' + (state.diffExpanded ? ' is-expanded' : '') + (short ? ' is-short' : '') + '" data-pub-diff-body>' + diffSourceHTML(lines) + '</div>' +
        '<div class="pub-diff-preview' + (state.diffMode === 'preview' ? ' is-on' : '') + '">' + diffPreviewHTML(lines) + '</div>' +
        '<div class="pub-diff-foot">' +
          '<button class="pub-diff-expand' + (state.diffExpanded ? ' is-open' : '') + '" data-pub-act="diff-expand">' + IC.chev() + ' ' + (state.diffExpanded ? '收起' : '展开全部 ' + lines.length + ' 行') + '</button>' +
        '</div>' +
      '</div>';
    var diffBox = $('[data-pub-diff]');
    if (diffBox) diffBox.innerHTML = html;
  }

  function renderRepos() {
    var list = MOCK_REPOS.slice();
    var q = state.repoSearch.trim().toLowerCase();
    if (q) {
      list = list.filter(function (r) {
        return (r.name + ' ' + r.displayName + ' ' + r.desc + ' ' + r.topic).toLowerCase().indexOf(q) >= 0;
      });
    }
    if (state.repoSort === 'stars') { list.sort(function (a, b) { return b.stars - a.stars; }); }
    else if (state.repoSort === 'name') { list.sort(function (a, b) { return a.displayName.localeCompare(b.displayName, 'zh'); }); }

    var html = list.length ? list.map(repoCardHTML).join('') : '<div class="pub-empty">没有匹配的仓库</div>';
    var box = $('[data-pub-repos]');
    if (box) box.innerHTML = html;
    var countEl = $('[data-pub-repo-count]');
    if (countEl) countEl.textContent = '· ' + list.length;
  }

  function updateDraftsCount() {
    var el = $('[data-pub-drafts-count]');
    if (el) el.textContent = MOCK_DRAFTS.length;
  }

  /* ----------------------------- 渲染：子视图 ----------------------------- */

  function renderDrafts() {
    var html;
    if (!MOCK_DRAFTS.length) {
      html = '<div class="pub-empty">没有未发布的草稿<br>去笔记本写点什么吧</div>';
    } else {
      html = MOCK_DRAFTS.map(function (d) {
        return '<div class="pub-draft-row">' +
          '<div class="pub-draft-row__body">' +
            '<h3 class="pub-draft-row__title">' + escapeHtml(d.title) + '</h3>' +
            '<p class="pub-draft-row__meta">最后修改 ' + escapeHtml(d.lastModified) + ' · <span class="pub-mono">+' + d.diff.additions + ' −' + d.diff.deletions + '</span> · ' + escapeHtml((d.tags || []).join(' / ')) + '</p>' +
            '<div class="pub-draft-row__actions">' +
              '<button class="pub-draft-mini pub-draft-mini--edit" data-pub-act="draft-edit" data-draft-id="' + d.id + '">' + IC.edit() + ' 继续编辑</button>' +
              '<button class="pub-draft-mini pub-draft-mini--publish" data-pub-act="draft-publish" data-draft-id="' + d.id + '">' + IC.upload() + ' 发布</button>' +
              '<button class="pub-draft-mini pub-draft-mini--del" data-pub-act="draft-delete" data-draft-id="' + d.id + '">' + IC.del() + ' 删除</button>' +
            '</div>' +
          '</div>' +
        '</div>';
      }).join('');
    }
    $('[data-pub-drafts-body]').innerHTML = html;
  }

  function renderHistory() {
    var html = '<div class="pub-sec-head"><h3 class="pub-sec-title">全局活动 · ' + MOCK_ACTIVITY.length + ' 条</h3></div>' +
      '<div class="pub-timeline">' + MOCK_ACTIVITY.map(tlItemHTML).join('') + '</div>';
    $('[data-pub-history-body]').innerHTML = html;
  }

  function renderRepoDetail(repo) {
    var nameEl = $('[data-pub-repo-name]');
    if (nameEl) nameEl.textContent = repo.displayName;
    var html =
      '<div class="pub-detail-info">' +
        '<h3 class="pub-detail-info__name">' + escapeHtml(repo.displayName) + ' ' + visChipHTML(repo.visibility) + ' ' + typeChipHTML(repo.type) + '</h3>' +
        '<p class="pub-detail-info__desc">' + escapeHtml(repo.desc) + '</p>' +
        '<div class="pub-detail-stats">' +
          statHTML(repo.stars, 'Stars') +
          statHTML(repo.forks, 'Forks') +
          statHTML(repo.commitCount, 'Commits') +
          statHTML(repo.branch, '默认分支') +
        '</div>' +
      '</div>' +
      '<div class="pub-branchbar">' +
        '<span class="pub-branchbar__branch">' + IC.branch() + escapeHtml(repo.branch) + '</span>' +
        '<button class="pub-branchbar__new" data-pub-act="new-branch">' + IC.plus() + ' 新建分支</button>' +
      '</div>' +
      '<div class="pub-sec-head"><h3 class="pub-sec-title pub-sec-title--indigo">Commit 历史</h3></div>' +
      '<div class="pub-commit-list">' + repo.commits.map(commitRowHTML).join('') + '</div>';
    $('[data-pub-repo-body]').innerHTML = html;
  }

  function renderCommitDetail(payload) {
    var repo = payload && payload.repo;
    var hash = payload && payload.hash;
    var c = findCommitInRepo(repo, hash) || { hash: hash || '------', message: '（无提交信息）', author: '我', time: '-', type: 'edit' };
    var initial = (c.author || '我').slice(0, 1);
    var color = c.authorColor || '#1D5B7A';
    var lines = synthesizeCommitDiff(c);
    var head =
      '<div class="pub-commit-detail-head">' +
        '<div class="pub-commit-detail-head__hash">' + c.hash + '</div>' +
        '<h2 class="pub-commit-detail-head__msg">' + escapeHtml(c.message) + '</h2>' +
        '<div class="pub-commit-detail-head__meta">' +
          '<span class="pub-commit-row__dot" style="background:' + color + ';width:22px;height:22px;font-size:11px">' + escapeHtml(initial) + '</span>' +
          '<span>' + escapeHtml(c.author || '我') + '</span><span>·</span>' +
          '<span>' + escapeHtml(c.time) + '</span><span>·</span>' +
          '<span>' + escapeHtml(repo ? repo.name : '—') + '</span>' +
        '</div>' +
      '</div>';
    var body =
      '<div class="pub-diff-block">' +
        '<div class="pub-diff-block__head">变更 · ' + lines.length + ' 行</div>' +
        '<div class="pub-diff-block__body">' + diffSourceHTML(lines) + '</div>' +
      '</div>';
    $('[data-pub-commit-body]').innerHTML = head + body;
  }

  /* ----------------------------- 图标注入 ----------------------------- */

  function injectIcons() {
    if (!root) return;
    $all('[data-ic]', root).forEach(function (s) {
      var name = s.getAttribute('data-ic');
      if (IC[name]) s.innerHTML = IC[name]();
    });
  }

  /* ----------------------------- 视图栈 ----------------------------- */

  function viewEl(name) { return $('.pub-view[data-view="' + name + '"]', root); }

  function applyStack() {
    var set = {};
    stack.forEach(function (e) { set[e.name] = true; });
    $all('.pub-view', root).forEach(function (v) {
      v.classList.toggle('is-on', !!set[v.getAttribute('data-view')]);
    });
    var top = stack[stack.length - 1];
    if (top.name === 'drafts') renderDrafts();
    else if (top.name === 'history') renderHistory();
    else if (top.name === 'repo') { currentRepo = top.payload; renderRepoDetail(top.payload); }
    else if (top.name === 'commit') renderCommitDetail(top.payload);

    var topEl = viewEl(top.name);
    if (topEl) { var sc = $('.pub-scroll', topEl); if (sc) sc.scrollTop = 0; }
  }

  function openSub(name, payload) {
    stack.push({ name: name, payload: payload });
    applyStack();
  }

  function back() {
    if (stack.length > 1) { stack.pop(); applyStack(); }
  }

  /* ----------------------------- 业务动作 ----------------------------- */

  function selectDraft(id) {
    var d = null;
    for (var i = 0; i < MOCK_DRAFTS.length; i++) { if (MOCK_DRAFTS[i].id === id) d = MOCK_DRAFTS[i]; }
    if (!d) return;
    state.selectedDraftId = id;
    /* 三维可见度模型：保留当前 state.visibility（3D 对象），不再用草稿的字符串覆盖 */
    state.audience = d.audience;
    state.tags = d.tags.slice();
    state.commitMsg = '';
    state._tagInputOpen = false;
    renderAction();
    renderDiff();
  }

  function deleteDraft(id) {
    MOCK_DRAFTS = MOCK_DRAFTS.filter(function (d) { return d.id !== id; });
    updateDraftsCount();
    renderDrafts();
    if (state.selectedDraftId === id && MOCK_DRAFTS.length) { selectDraft(MOCK_DRAFTS[0].id); }
    toast('草稿已删除');
  }

  function setVisibility(v) {
    state.visibility = v;
    $all('[data-pub-vis-segment] .pub-segment__btn', root).forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-val') === v);
    });
    var af = $('[data-pub-audience-field]', root);
    if (af) af.classList.toggle('is-hidden', v !== 'public');
  }

  function setAudience(a) {
    state.audience = a;
    $all('[data-pub-audience-segment] .pub-segment__btn', root).forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-val') === a);
    });
  }

  function renderTags() {
    var box = $('[data-pub-tags]', root);
    if (box) box.innerHTML = tagsHTML();
  }

  function openTagInput() {
    state._tagInputOpen = true;
    renderTags();
    var inp = $('[data-pub-tag-input]', root);
    if (inp) inp.focus();
  }

  function addTag(t) {
    t = (t || '').trim();
    if (!t) return;
    if (state.tags.indexOf(t) >= 0) { state._tagInputOpen = false; renderTags(); return; }
    state.tags.push(t);
    state._tagInputOpen = false;
    renderTags();
  }

  function removeTag(t) {
    state.tags = state.tags.filter(function (x) { return x !== t; });
    renderTags();
  }

  function cycleRepoSort() {
    var order = ['recent', 'stars', 'name'];
    var idx = order.indexOf(state.repoSort);
    state.repoSort = order[(idx + 1) % order.length];
    var lbl = $('[data-pub-repo-sort-label]', root);
    if (lbl) lbl.textContent = sortLabel(state.repoSort);
    renderRepos();
  }

  function openCommitFromCurrentRepo(hash) {
    if (!currentRepo) return;
    openSub('commit', { repo: currentRepo, hash: hash });
  }

  function openCommitFromActivity(hash, repoName) {
    openSub('commit', { repo: findRepoByName(repoName), hash: hash });
  }

  /* ----------------------------- 模态 + Toast ----------------------------- */

  function openModal() {
    var d = currentDraft();
    var commitTxt = state.commitMsg.trim();
    var commitCell = commitTxt ? escapeHtml(commitTxt) : '<span style="color:var(--neutral-500)">（未填写，将使用：「' + escapeHtml(d.commitHint || '更新内容') + '」）</span>';
    var html =
      '<div class="pub-modal__row"><dt>草稿</dt><dd>' + escapeHtml(d.title) + '</dd></div>' +
      '<div class="pub-modal__row"><dt>Commit</dt><dd>' + commitCell + '</dd></div>' +
      '<div class="pub-modal__row"><dt>可见性</dt><dd>' + (window.VIS ? VIS.chipHTML(state.visibility) : visChipHTML(state.visibility && state.visibility.scope)) + '</dd></div>' +
      (state.visibility === 'public' ? '<div class="pub-modal__row"><dt>受众</dt><dd>' + escapeHtml(audienceLabel(state.audience)) + '</dd></div>' : '') +
      '<div class="pub-modal__row"><dt>标签</dt><dd>' + (state.tags.length
        ? state.tags.map(function (t) { return '<span class="pub-tag-chip">' + escapeHtml(t) + '</span>'; }).join('')
        : '<span style="color:var(--neutral-500)">无</span>') + '</dd></div>';
    var sum = $('[data-pub-modal-summary]', root);
    if (sum) sum.innerHTML = html;
    var m = $('[data-pub-modal]', root);
    if (m) m.classList.add('is-open');
  }

  function closeModal() {
    var m = $('[data-pub-modal]', root);
    if (m) m.classList.remove('is-open');
  }

  function confirmPublish() {
    closeModal();
    var d = currentDraft();
    var visText = (window.VIS && state.visibility && VIS.SCOPE[state.visibility.scope]) ? VIS.SCOPE[state.visibility.scope].label : visLabel(state.visibility && state.visibility.scope);
    toast('已发布「' + d.title + '」 · ' + visText + ' · ' + commitHashPreview(), true);
    /* 闭环 ①：写入 bridge，广场 Feed 会置顶、个人页「我的创作」会出现 */
    if (window.ZX_BRIDGE && d) {
      window.ZX_BRIDGE.publish({
        title: d.title,
        excerpt: d.excerpt || d.summary || '',
        tags: state.tags && state.tags.length ? state.tags.slice() : ['我的发布'],
        visibility: state.visibility
      });
    }
    state.commitMsg = '';
    state.diffExpanded = false;
    renderAction();
    renderDiff();
  }

  function toast(msg, spark) {
    var t = $('[data-pub-toast]', root);
    if (!t) return;
    t.innerHTML = (spark ? '<span class="pub-toast__spark">' + IC.spark() + '</span>' : '') + '<span>' + msg + '</span>';
    t.classList.add('is-show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 2600);
  }

  /* ----------------------------- 事件 ----------------------------- */

  function closestAct(node) {
    while (node && node !== root) {
      if (node.getAttribute && node.getAttribute('data-pub-act')) return node;
      node = node.parentNode;
    }
    return null;
  }

  function onClick(e) {
    var t = closestAct(e.target);
    if (!t) return;
    var act = t.getAttribute('data-pub-act');
    switch (act) {
      case 'drafts': openSub('drafts'); break;
      case 'history': openSub('history'); break;
      case 'back': back(); break;
      case 'more': toast('仓库菜单（演示）'); break;
      case 'new-branch': toast('新建分支（演示）'); break;
      /* case 'vis': setVisibility(t.getAttribute('data-val')); break; */ /* 已替换为三维 chip */
      case 'audience': setAudience(t.getAttribute('data-val')); break;
      case 'tag-add': openTagInput(); break;
      case 'tag-remove': removeTag(t.getAttribute('data-tag')); break;
      case 'diff-expand': state.diffExpanded = !state.diffExpanded; renderDiff(); break;
      case 'diff-mode': state.diffMode = t.getAttribute('data-val'); renderDiff(); break;
      case 'publish': openModal(); break;
      case 'modal-cancel': closeModal(); break;
      case 'modal-confirm': confirmPublish(); break;
      case 'pick-draft': openSub('drafts'); break;
      case 'draft-edit': toast('跳转笔记本继续编辑（演示）'); break;
      case 'draft-publish': selectDraft(t.getAttribute('data-draft-id')); back(); toast('已选为待发布草稿'); break;
      case 'draft-delete': deleteDraft(t.getAttribute('data-draft-id')); break;
      case 'open-repo': { var r = findRepoById(t.getAttribute('data-repo-id')); if (r) openSub('repo', r); break; }
      case 'open-commit': openCommitFromCurrentRepo(t.getAttribute('data-hash')); break;
      case 'tl-item': openCommitFromActivity(t.getAttribute('data-hash'), t.getAttribute('data-repo')); break;
      case 'repo-sort': cycleRepoSort(); break;
      default: break;
    }
  }

  function onInput(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-pub-commit-input') !== null) {
      state.commitMsg = t.value;
      var cnt = $('[data-pub-commit-count]', root); if (cnt) cnt.textContent = t.value.length + ' 字';
      var hp = $('[data-pub-commit-hash]', root); if (hp) hp.textContent = commitHashPreview();
    } else if (t.getAttribute('data-pub-repo-search') !== null) {
      state.repoSearch = t.value;
      renderRepos();
    }
  }

  function onKeydown(e) {
    var t = e.target;
    if (!t || !t.getAttribute) return;
    if (t.getAttribute('data-pub-tag-input') !== null) {
      if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); addTag(t.value); }
      else if (e.key === 'Escape' || e.keyCode === 27) { state._tagInputOpen = false; renderTags(); }
      return;
    }
    if ((e.key === 'Escape' || e.keyCode === 27)) {
      var m = $('[data-pub-modal]', root);
      if (m && m.classList.contains('is-open')) { closeModal(); }
    }
  }

  /* ----------------------------- 初始化 ----------------------------- */

  function init() {
    root = $('[data-pub-root]');
    if (!root) return;
    renderMain();
    root.addEventListener('click', onClick);
    root.addEventListener('input', onInput);
    root.addEventListener('keydown', onKeydown);
  }

  var api = {
    init: init,
    openRepo: function (id) { var r = findRepoById(id); if (r) openSub('repo', r); },
    back: back,
    state: state
  };

  window.ZX_PUBLISH = api;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
