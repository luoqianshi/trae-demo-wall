/* =========================================================================
 * 「知行」App 本体 Demo —— Wave 2.A / 笔记模板编辑器（note-editor.js）
 * -------------------------------------------------------------------------
 * 4 种模板：纯文档（doc）/ 双联阅读（dual）/ 无限画布（canvas）/ 大纲树（outline）
 * AI 三姿态协作：
 *   姿态 1 · 旁观插话 —— 写作停顿 > 2s，段落下方出现林的鎏金建议气泡
 *   姿态 2 · 肩并肩共写 —— 接受建议 / 长按 ✦ / 底栏 ✦，林以鎏金差异色输出
 *   姿态 3 · 按需召唤 —— 选中文字 → 行内浮动工具栏 [B][I][✦ 问林] → 行内对话框
 * 设计语言：墨韵 · 星图（朱砂 CTA / 黛青链接 / 鎏金 AI / 赤陶警示）
 * 挂载：#nb-editor-root（index.html 已就绪；防御性 ensureRoot 兜底创建）
 * 命名空间：window.ZX_EDITOR（open / close / isOpen）
 * 依赖：../../demo/shared/icons.js（ZX.icon）、note-editor.css
 * 约束：纯 JS 文件，不修改任何其它文件；IIFE + 事件委托；AI 全部 mock
 * 风格参照：note-overview.js（IIFE / $helper / IC 图标对象 / data-action 委托）
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具 ----------------------------- */

  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function escapeHtml(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]; }); }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function pad2(n) { return String(n).padStart(2, '0'); }
  function nowTime() { var d = new Date(); return pad2(d.getHours()) + ':' + pad2(d.getMinutes()); }

  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">' + inner + '</svg>';
  }
  function zicon(name, size) { return (window.ZX && typeof window.ZX.icon === 'function') ? window.ZX.icon(name, size || 22) : svg('', size); }

  /* ---- 图标对象（可复用 ZX.icon，缺失的内联 SVG） ---- */
  var IC = {
    back:   function (s) { return zicon('arrow-left', s || 22); },
    close:  function (s) { return zicon('close', s || 16); },
    spark:  function (s) { return zicon('spark', s || 18); },
    search: function (s) { return zicon('search', s || 18); },
    plus:   function (s) { return svg('<path d="M12 5v14M5 12h14"/>', s || 18); },
    minus:  function (s) { return svg('<path d="M5 12h14"/>', s || 18); },
    check:  function (s) { return svg('<path d="M4 12l5 5L20 6"/>', s || 14); },
    send:   function (s) { return svg('<path d="M12 19V5M6 11l6-6 6 6"/>', s || 16); },
    chev:   function (s) { return svg('<path d="M6 9l6 6 6-6"/>', s || 14); },
    camera: function (s) { return svg('<path d="M3 8a2 2 0 0 1 2-2h2.2l1.6-2h6.4l1.6 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.4"/>', s || 18); },
    voice:  function (s) { return svg('<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>', s || 18); },
    type:   function (s) { return svg('<path d="M4 7V5h16v2M9 19h6M12 5v14"/>', s || 18); },
    bold:   function (s) { return svg('<path d="M7 5h6a3.5 3.5 0 0 1 0 7H7zM7 12h7a3.5 3.5 0 0 1 0 7H7z"/>', s || 16); },
    italic: function (s) { return svg('<path d="M19 5h-6M11 19H5M15 5L9 19"/>', s || 16); },
    folder: function (s) { return svg('<path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>', s || 16); },
    doc:    function (s) { return svg('<path d="M14 3v5h5"/><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M8 13h8M8 17h5"/>', s || 16); },
    quote:  function (s) { return svg('<path d="M7 7H4v6h6V7zM7 7c0 4-1 6-3 7M20 7h-3v6h6V7zM20 7c0 4-1 6-3 7"/>', s || 16); },
    code:   function (s) { return svg('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M14 5l-4 14"/>', s || 16); },
    image:  function (s) { return svg('<rect x="3" y="4" width="18" height="16" rx="2"/><circle cx="9" cy="10" r="2"/><path d="M21 16l-5-5L5 20"/>', s || 16); },
    hr:     function (s) { return svg('<path d="M4 12h16"/>', s || 16); },
    link:   function (s) { return svg('<path d="M9 15l6-6"/><path d="M10.5 6.5l1-1a4 4 0 0 1 6 6l-2 2"/><path d="M13.5 17.5l-1 1a4 4 0 0 1-6-6l2-2"/>', s || 16); },
    refresh:function (s) { return svg('<path d="M21 12a9 9 0 1 1-3-6.7"/><path d="M21 4v5h-5"/>', s || 14); },
    expand: function (s) { return svg('<path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3"/>', s || 14); },
    rewrite:function (s) { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', s || 14); },
    /* Task 2.3 / 2.4：块菜单与拖拽额外图标 */
    up:     function (s) { return svg('<path d="M12 19V5M6 11l6-6 6 6"/>', s || 14); },
    down:   function (s) { return svg('<path d="M12 5v14M6 13l6 6 6-6"/>', s || 14); },
    slash:  function (s) { return svg('<path d="M16 4L8 20"/>', s || 14); },
    drag:   function (s) { return svg('<circle cx="9" cy="6" r="1.4"/><circle cx="15" cy="6" r="1.4"/><circle cx="9" cy="12" r="1.4"/><circle cx="15" cy="12" r="1.4"/><circle cx="9" cy="18" r="1.4"/><circle cx="15" cy="18" r="1.4"/>', s || 14); },
    grid:   function (s) { return svg('<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>', s || 14); },
    note:   function (s) { return svg('<path d="M4 4a2 2 0 0 1 2-2h8l6 6v12a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z"/><path d="M14 2v6h6M8 13h8M8 17h5"/>', s || 14); },
    /* reader 标注工具 */
    pen:     function (s) { return svg('<path d="M12 19l7-7-3-3-7 7v3z"/><path d="M14 7l3 3"/><path d="M5 19l3 0"/>', s || 18); },
    highlight: function (s) { return svg('<path d="M9 11l-4 4v3h3l4-4"/><path d="M13 7l4 4"/><path d="M9 11l4-4 4 4-4 4z"/><path d="M3 21h18"/>', s || 18); },
    eraser:  function (s) { return svg('<path d="M15 3l6 6-8 8H7l-4-4a2 2 0 0 1 0-3l7-7a2 2 0 0 1 3 0z"/><path d="M9 21h12"/>', s || 18); },
    chevL:   function (s) { return svg('<path d="M15 6l-6 6 6 6"/>', s || 20); },
    chevR:   function (s) { return svg('<path d="M9 6l6 6-6 6"/>', s || 20); },
    bookmark: function (s) { return svg('<path d="M6 3h12a1 1 0 0 1 1 1v17l-7-4-7 4V4a1 1 0 0 1 1-1z"/>', s || 18); },
    edit:    function (s) { return svg('<path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4z"/>', s || 20); },
    drag:    function (s) { return svg('<circle cx="9" cy="6" r="1.3"/><circle cx="15" cy="6" r="1.3"/><circle cx="9" cy="12" r="1.3"/><circle cx="15" cy="12" r="1.3"/><circle cx="9" cy="18" r="1.3"/><circle cx="15" cy="18" r="1.3"/>', s || 12); },
    chat:   function (s) { return svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', s || 14); }
  };

  /* ----------------------------- 状态 ----------------------------- */

  var state = {
    open: false,
    template: 'doc',
    title: '无标题笔记',
    currentNoteId: null,    /* Task 2.1：当前编辑的 bridge.notes 笔记 id（新建时即时生成） */
    aiCo: false,            /* Task 2.1：本次会话是否含 AI 协作产出（✦指纹，写回时带上） */
    suggestOn: true,        /* 姿态 1 总开关 */
    suggestTimer: null,
    suggestActive: false,   /* 是否已有一条建议在显示 */
    currentBlock: null,     /* 当前编辑的段落（doc） */
    inlineChatMsgs: [],
    inlineSelText: '',
    /* canvas */
    canvas: { panX: 0, panY: 0, scale: 1, blocks: [], links: [], nextId: 1, selected: null },
    /* reader 标注形式：PDF 全屏 + 底部工具栏 */
    reader: { page: 0, tool: null, annotations: [], pages: [], bookmarks: [], essays: {} },
    /* outline */
    outline: null,
    /* Task 4.3：AI 块编排 dispatch 链路的运行时态 */
    _pendingBlockDelta: null,   /* 待用户接受/拒绝的 delta */
    _pendingBlockAccept: null,  /* 接受回调（可选） */
    _aiBlockUndo: null          /* { snapshot, delta } —— 最近一次编排的应用前快照 */
  };

  /* ----------------------------- Mock 数据 ----------------------------- */

  /* 姿态 1 旁观建议池（随机取一条） */
  var SUGGEST_POOL = [
    '这段可以再展开一些吗？比如补充一个具体的实验数据。',
    '要不要在这里加一个例子，让论点更有说服力？',
    '我注意到这里可以和 [[界面阻抗分析]] 关联，要帮你加双链吗？',
    '这个数字需要标注来源吗？我可以帮你溯源。',
    '考虑在这里做一个正反方对比吗？明辨智能体可以帮你梳理。',
    '这句话有点绕，要不要我帮你润色得更精炼？',
    '这里似乎缺一个结论，要我帮你收束一下吗？',
    '要不要补充一段「我的判断」，把思考沉淀下来？'
  ];

  /* 姿态 2 肩并肩共写：展开 / 重写 的差异片段 */
  var COWRITE_EXPAND = [
    { ins: '具体而言，Li₆PS₅Cl 在室温下的电导率可达 10⁻³ S/cm 量级，与液态电解液相当，这是它最具吸引力的特性。' },
    { ins: '值得注意的是，这一结论依赖四电极测量体系——若用两电极，阻抗数值可能被高估约一个数量级。' }
  ];
  var COWRITE_REWRITE = [
    { del: '这个东西挺好的，电导率很高', ins: '硫化物电解质具备高室温电导率（10⁻³ S/cm 级），是当前全固态路线的有力候选' },
    { del: '我觉得界面问题很重要', ins: '界面阻抗是决定全固态电池循环寿命的关键因素，其量级高度依赖测量方法' }
  ];

  /* 行内对话：林的 mock 回复（按选中文字关键词）
   * Task 1.2：走 ZX_AI.reply 取材，针对选中文本给出真实笔记相关回复 */
  function mockInlineReply(text) {
    if (window.ZX_AI && window.ZX_AI.reply) {
      var sel = state.inlineSelText || text || '';
      var intent;
      if (/展开|详细|例子/.test(text)) intent = 'expand';
      else if (/润色|改写|精炼/.test(text)) intent = 'general';
      else if (/关联|链接|双链/.test(text)) intent = 'general';
      else intent = window.ZX_AI.inferIntent ? window.ZX_AI.inferIntent(sel) : 'impedance';
      return window.ZX_AI.reply(intent, { selText: sel, query: text });
    }
    if (/数据|数值|电导率|阻抗/.test(text)) return '这个数据的关键在于测量方法：四电极体系下 LiNbO₃ 涂层可降低界面阻抗约 10×，但两电极会高估。要我帮你标注「高可信」吗？';
    if (/展开|详细|例子/.test(text)) return '好，我帮你展开：可以补充 Li₆PS₅Cl 的具体电导率数值（10⁻³ S/cm）和它在 -20°C 的低温表现作为佐证。';
    if (/润色|改写|精炼/.test(text)) return '我把它改得更精炼了，保留了核心论点，去掉了重复表达。看看右下角的「应用到选中」。';
    if (/关联|链接|双链/.test(text)) return '我找到了 3 篇可关联的笔记：界面阻抗分析、硫化物 5 大优势、四电极体系对比。要我插入双链吗？';
    return '我看了一下这段。要不要我帮你补一个数据来源，或者展开成一个完整的论点？';
  }

  /* 双链搜索 mock 笔记 */
  var MOCK_NOTES = [
    { id: 'n1', title: '界面阻抗分析', hint: '固态电池 · 5 版' },
    { id: 'n2', title: '硫化物 5 大优势', hint: '硫化物电解质 · 3 版' },
    { id: 'n3', title: 'LLZO 阻抗测试', hint: '氧化物 · 2 版' },
    { id: 'n4', title: '四电极体系对比', hint: '测量方法 · 4 版' },
    { id: 'n5', title: '费曼学习法', hint: '学习方法 · 1 版' }
  ];

  /* 大纲树初始结构（固态电池主线） */
  function defaultOutline() {
    return {
      id: 'o0', type: 'opinion', text: '界面阻抗是全固态电池的核心瓶颈', collapsed: false,
      children: [
        {
          id: 'o1', type: 'evidence', text: 'LiNbO₃ 涂层可降低界面阻抗约 10×（四电极体系）', collapsed: false,
          children: [
            { id: 'o2', type: 'quote', text: '《固态电解质》第 3 章：涂层形成稳定中间层', collapsed: false, children: [] }
          ]
        },
        {
          id: 'o3', type: 'question', text: '两电极测量是否高估了阻抗？', collapsed: false, children: []
        },
        {
          id: 'o4', type: 'todo', text: '复测：四电极体系，n ≥ 30', collapsed: false, children: []
        }
      ]
    };
  }

  /* 画布初始块与连线 */
  function defaultCanvasBlocks() {
    var b = [
      { id: 1, x: 36, y: 28, type: 'text', title: '论点', text: '界面阻抗是核心瓶颈' },
      { id: 2, x: 220, y: 18, type: 'evidence', title: '证据', text: 'LiNbO₃ 涂层降阻抗 10×' },
      { id: 3, x: 230, y: 150, type: 'code', title: '数据', text: 'σ = 1.2×10⁻³ S/cm\n(四电极, 25°C)' },
      { id: 4, x: 40, y: 170, type: 'link', title: '关联', text: '[[界面阻抗分析]]' }
    ];
    var links = [
      { from: 1, to: 2 }, { from: 2, to: 3 }, { from: 1, to: 4 }
    ];
    return { blocks: b, links: links };
  }

  var CANVAS_ADD_ITEMS = [
    { type: 'text', name: '文本块' },
    { type: 'evidence', name: '证据块' },
    { type: 'code', name: '代码块' },
    { type: 'link', name: '双链块' }
  ];

  /* =====================================================================
   * Task 2.1：BlockRenderer —— 块树统一渲染器
   * 主入口 BlockRenderer.renderSpec(spec, ctx) → HTML 字符串
   * 递归处理 6 内容块（text/image/video/doc/embed-note/embed-block）
   * 与 6 布局块（section/cols/grid/canvas/callout/tabs）+ outline-node 变体
   * 每个块输出 data-block="<id>" 与 data-type="<type>"，aiCo 块加 .is-ai
   * ctx：{ editable: bool, inCols: bool } —— 控制文本块是否可编辑、是否在列内
   * ===================================================================*/
  function escapeAttr(s) { return String(s == null ? '' : s).replace(/"/g, '&quot;'); }

  function resolveFile(fileId) {
    var mock = window.ZX_MOCK;
    if (mock && mock.files) {
      for (var i = 0; i < mock.files.length; i++) {
        if (mock.files[i].id === fileId) return mock.files[i];
      }
    }
    return null;
  }
  function resolveNote(noteId) {
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.getNoteById) {
      var n = window.ZX_BRIDGE.getNoteById(noteId);
      if (n) return n;
    }
    var mock2 = window.ZX_MOCK;
    if (mock2 && mock2.notes) {
      for (var j = 0; j < mock2.notes.length; j++) {
        if (mock2.notes[j].id === noteId) return mock2.notes[j];
      }
    }
    return null;
  }
  function resolveInlineBlock(blockId) {
    var mock = window.ZX_MOCK;
    if (mock && mock.inlineBlocks) {
      for (var i = 0; i < mock.inlineBlocks.length; i++) {
        if (mock.inlineBlocks[i].id === blockId) return mock.inlineBlocks[i];
      }
    }
    return null;
  }

  /* 通用块外壳：data-block + data-type + is-ai */
  function specBlockTag(spec, cls, inner, opts) {
    opts = opts || {};
    var aiCls = spec.aiCo ? ' is-ai' : '';
    var dragCls = ' ne-specblk';
    var tag = opts.tag || 'div';
    return '<' + tag + ' class="' + (cls || '') + aiCls + dragCls + '"' +
      ' data-block="' + escapeAttr(spec.id) + '"' +
      ' data-type="' + escapeAttr(spec.type) + '"' +
      (spec.aiCo ? ' data-ai="1"' : '') +
      (opts.extra || '') +
      '>' + (inner == null ? '' : inner) + '</' + tag + '>';
  }

  /* ---- 内容块 ---- */
  function renderTextBlock(spec, ctx) {
    /* outline 节点是 text 的特殊形态（带 outlineType / children），走专属渲染 */
    if (spec.outlineType || spec.type === 'outline-node') return renderOutlineNodeBlock(spec, ctx);
    var raw = spec.text == null ? '' : String(spec.text);
    var inner;
    /* 已含 HTML 标签：原样输出（编辑器内的富文本）；否则按段落包 <p> */
    if (/^\s*</.test(raw)) {
      inner = raw;
    } else {
      inner = raw.split(/[\n\r]+/).map(function (p) {
        return '<p>' + escapeHtml(p) + '</p>';
      }).join('');
    }
    var aiBadge = spec.aiCo ? '<span class="ne-specblk__ai-badge" title="林协写">✦</span>' : '';
    /* 文本块用 <div> 外壳（可含 <p>），保持与 .ne-doc__body 既有段落观感兼容 */
    return specBlockTag(spec, 'ne-specblk--text', aiBadge + inner, { tag: 'div' });
  }

  function renderImageBlock(spec) {
    var f = resolveFile(spec.fileId);
    var url = (f && f.url) || spec.url || '';
    var name = (f && f.name) || spec.name || '';
    var inner;
    if (url) {
      inner = '<img src="' + escapeAttr(url) + '" alt="' + escapeAttr(name) + '" />';
      if (name) inner += '<div class="ne-specblk__caption">' + escapeHtml(name) + '</div>';
    } else {
      inner = '<div class="ne-specblk__placeholder">' + IC.image(20) + '<span>图片占位 · ' + escapeHtml(name || spec.fileId || '') + '</span></div>';
    }
    return specBlockTag(spec, 'ne-specblk--image', inner, { tag: 'figure' });
  }

  function renderVideoBlock(spec) {
    var f = resolveFile(spec.fileId);
    var url = (f && f.url) || spec.url || '';
    var name = (f && f.name) || spec.name || '';
    var inner;
    if (url) {
      inner = '<video src="' + escapeAttr(url) + '" controls></video>';
    } else {
      inner = '<div class="ne-specblk__placeholder">' + IC.voice(20) + '<span>视频占位 · ' + escapeHtml(name || spec.fileId || '') + '</span></div>';
    }
    return specBlockTag(spec, 'ne-specblk--video', inner, { tag: 'figure' });
  }

  function renderDocBlock(spec) {
    /* 双联阅读的 PDF 页卡片（带 page/pageTag）：保留 .ne-attach__page 结构以兼容 explain */
    if (spec.page != null) return renderReaderPageBlock(spec);
    var f = resolveFile(spec.fileId);
    var name = (f && f.name) || spec.name || spec.fileId || '附件';
    var mime = (f && f.mime) || spec.mime || '附件';
    var inner =
      '<div class="ne-specblk__doc">' +
        '<span class="ne-specblk__doc-icon">' + IC.doc(22) + '</span>' +
        '<div class="ne-specblk__doc-info">' +
          '<div class="ne-specblk__doc-name">' + escapeHtml(name) + '</div>' +
          '<div class="ne-specblk__doc-meta">' + escapeHtml(mime) + '</div>' +
        '</div>' +
      '</div>';
    return specBlockTag(spec, 'ne-specblk--doc', inner);
  }

  function renderReaderPageBlock(spec) {
    /* 标注形式：PDF 页面全屏显示，保留 page-tag 标识页码 */
    var idx = spec.page || 0;
    var tag = spec.pageTag || ('P.' + (28 + idx));
    var body = spec.html ? spec.html : '<div class="ne-attach__page-body">' + escapeHtml(spec.text || '') + '</div>';
    var inner =
      '<span class="ne-attach__page-tag">' + escapeHtml(tag) + '</span>' +
      '<div class="ne-attach__page-content">' + body + '</div>';
    return '<div class="ne-attach__page ne-attach__page--pdf ne-specblk' +
      (spec.aiCo ? ' is-ai' : '') + '"' +
      ' data-block="' + escapeAttr(spec.id) + '" data-type="doc"' +
      ' data-ne-attach="' + idx + '"' +
      (spec.aiCo ? ' data-ai="1"' : '') +
      '>' + inner + '</div>';
  }

  function renderEmbedNoteBlock(spec) {
    var n = resolveNote(spec.noteId);
    var title = (n && n.title) || spec.title || '未找到笔记';
    var summary = (n && n.summary) || spec.summary || '';
    if (summary.length > 80) summary = summary.slice(0, 80) + '…';
    var inner =
      '<div class="ne-specblk__embed-head">' + IC.note(14) + '<span>引用笔记</span></div>' +
      '<div class="ne-specblk__embed-title">' + escapeHtml(title) + '</div>' +
      (summary ? '<div class="ne-specblk__embed-summary">' + escapeHtml(summary) + '</div>' : '');
    return specBlockTag(spec, 'ne-specblk--embed-note', inner);
  }

  function renderEmbedBlockBlock(spec) {
    var b = resolveInlineBlock(spec.blockId);
    var text = (b && b.text) || spec.text || '未找到内联块';
    var inner =
      '<div class="ne-specblk__embed-head">' + IC.quote(14) + '<span>引用块</span></div>' +
      '<div class="ne-specblk__embed-text">' + escapeHtml(text) + '</div>';
    return specBlockTag(spec, 'ne-specblk--embed-block', inner);
  }

  /* ---- code 内容块（SubTask 2.6）----
   * 块格式：{ id, type:'code', language:'javascript', code:'...' }
   * 渲染为语法高亮代码块，复用 file-renderer.js 的 highlightCode（共用高亮函数）
   * 与独立 code 文件不同：这是笔记内的片段块，有 data-block/data-type="code" 属性
   * 高亮函数若不可用（file-renderer.js 未加载），回退为纯转义文本，保证不报错
   */
  function renderCodeBlock(spec, ctx) {
    var language = spec.language || 'text';
    var code = spec.code != null ? String(spec.code) : '';
    var highlightFn = (window.ZX_FILE && typeof window.ZX_FILE.highlightCode === 'function')
      ? window.ZX_FILE.highlightCode
      : function (c) { return escapeHtml(c); };
    var highlighted = highlightFn(code, language);
    var langLabel = (window.ZX_FILE && typeof window.ZX_FILE.langLabel === 'function')
      ? window.ZX_FILE.langLabel(language)
      : language;
    var inner =
      '<span class="ne-specblk__code-lang">' + escapeHtml(langLabel) + '</span>' +
      '<pre class="ne-specblk__code-pre"><code>' + highlighted + '</code></pre>';
    return specBlockTag(spec, 'ne-specblk--code', inner);
  }

  /* ---- outline-node 渲染（保留 .ne-node 结构以兼容 Tab/Enter/类型菜单/折叠） ---- */
  function renderOutlineNodeBlock(spec, ctx) {
    var hasChildren = spec.children && spec.children.length;
    var childHtml = (hasChildren && !spec.collapsed)
      ? '<div class="ne-node__children">' + spec.children.map(function (c) { return renderSpec(c, ctx); }).join('') + '</div>'
      : '';
    var otype = spec.outlineType || 'opinion';
    return '<div class="ne-node ne-node--' + otype + (spec.aiCo ? ' is-ai' : '') + ' ne-specblk"' +
      ' data-block="' + escapeAttr(spec.id) + '" data-type="outline-node"' +
      ' data-node="' + escapeAttr(spec.id) + '"' +
      (spec.aiCo ? ' data-ai="1"' : '') + '>' +
      '<div class="ne-node__gutter">' +
        '<button class="ne-node__toggle' + (!hasChildren ? ' is-leaf' : '') + (spec.collapsed ? ' is-collapsed' : '') + '" data-action="ne-toggle-node" data-node="' + escapeAttr(spec.id) + '" aria-label="折叠/展开">' + IC.chev(14) + '</button>' +
        '<span class="ne-node__bullet" aria-hidden="true">' + (spec.aiCo ? '✦' : '') + '</span>' +
      '</div>' +
      '<div class="ne-node__text" contenteditable="true" data-placeholder="输入内容…" data-ne-nodetext="' + escapeAttr(spec.id) + '">' + escapeHtml(spec.text || '') + '</div>' +
      '<button class="ne-node__typechip" data-action="ne-open-typemenu" data-node="' + escapeAttr(spec.id) + '">' + escapeHtml(outlineTypeLabel(otype)) + '</button>' +
      childHtml +
    '</div>';
  }

  /* ---- 布局块 ---- */
  function renderSectionBlock(spec, ctx) {
    var children = (spec.children || []).map(function (c) { return renderSpec(c, ctx); }).join('');
    return specBlockTag(spec, 'ne-section', children);
  }

  function renderColsBlock(spec, ctx) {
    var cols = spec.cols || [];
    var inner = cols.map(function (col, i) {
      var childCtx = { editable: ctx && ctx.editable, inCols: true };
      var colChildren = (col || []).map(function (c) {
        return renderSpec(c, childCtx);
      }).join('');
      return '<div class="ne-cols__col" data-col="' + i + '">' + colChildren + '</div>';
    }).join('');
    return specBlockTag(spec, 'ne-cols', inner);
  }

  function renderGridBlock(spec, ctx) {
    var children = (spec.children || []).map(function (c) {
      return '<div class="ne-grid__cell">' + renderSpec(c, ctx) + '</div>';
    }).join('');
    return specBlockTag(spec, 'ne-grid', children);
  }

  function renderCalloutBlock(spec, ctx) {
    var children = (spec.children || []).map(function (c) { return renderSpec(c, ctx); }).join('');
    var title = spec.title ? '<div class="ne-callout__title">' + escapeHtml(spec.title) + '</div>' : '';
    return specBlockTag(spec, 'ne-callout', title + children);
  }

  function renderTabsBlock(spec, ctx) {
    var tabs = spec.tabs || [];
    var labels = tabs.map(function (t, i) {
      return '<button class="ne-tabs__label' + (i === 0 ? ' is-active' : '') + '" data-action="ne-tab-switch" data-tab-idx="' + i + '" data-block-parent="' + escapeAttr(spec.id) + '">' + escapeHtml(t.label || ('Tab ' + (i + 1))) + '</button>';
    }).join('');
    var panels = tabs.map(function (t, i) {
      var panelChildren = (t.children || []).map(function (c) { return renderSpec(c, ctx); }).join('');
      return '<div class="ne-tabs__panel' + (i === 0 ? ' is-active' : '') + '" data-tab-panel="' + i + '">' + panelChildren + '</div>';
    }).join('');
    return specBlockTag(spec, 'ne-tabs', '<div class="ne-tabs__labels">' + labels + '</div>' + panels);
  }

  function renderCanvasBlock(spec, ctx) {
    /* canvas 布局块：在被其它模板嵌套引用时，给一个静态预览（不挂拖拽交互） */
    var children = (spec.children || []).map(function (c) {
      var x = c.x != null ? c.x : 0;
      var y = c.y != null ? c.y : 0;
      return '<div class="ne-canvas-preview__item" style="left:' + x + 'px;top:' + y + 'px">' + renderSpec(c, ctx) + '</div>';
    }).join('');
    return specBlockTag(spec, 'ne-canvas-preview', children);
  }

  function renderSpec(spec, ctx) {
    if (!spec || !spec.type) return '';
    ctx = ctx || {};
    switch (spec.type) {
      case 'text':          return renderTextBlock(spec, ctx);
      case 'image':         return renderImageBlock(spec);
      case 'video':         return renderVideoBlock(spec);
      case 'doc':           return renderDocBlock(spec);
      case 'embed-note':    return renderEmbedNoteBlock(spec);
      case 'embed-block':   return renderEmbedBlockBlock(spec);
      case 'code':          return renderCodeBlock(spec, ctx);
      case 'outline-node':  return renderOutlineNodeBlock(spec, ctx);
      case 'section':       return renderSectionBlock(spec, ctx);
      case 'cols':          return renderColsBlock(spec, ctx);
      case 'grid':          return renderGridBlock(spec, ctx);
      case 'callout':       return renderCalloutBlock(spec, ctx);
      case 'tabs':          return renderTabsBlock(spec, ctx);
      case 'canvas':        return renderCanvasBlock(spec, ctx);
      default:              return '';
    }
  }

  var BlockRenderer = { renderSpec: renderSpec };

  /* =====================================================================
   * Task 2.2：4 模板预设块树生成器
   * 把现有模板的硬编码内容翻成 spec 块树；新建笔记时也由这些函数落地初始 spec
   * ===================================================================*/
  var _specSeq = 0;
  function _specId(prefix) { return (prefix || 'blk') + '-s' + (++_specSeq); }

  function _textBlock(text, aiCo) {
    return { id: _specId('txt'), type: 'text', text: text == null ? '' : String(text), aiCo: !!aiCo };
  }

  function buildDocSpec(title, paragraphs) {
    /* paragraphs：字符串数组（每段已含/不含 HTML 标签均可） */
    var paras = paragraphs && paragraphs.length ? paragraphs : [
      '<h2>硫化物电解质的界面问题</h2>',
      '<p>全固态电池的关键挑战在于固-固界面的接触与阻抗。硫化物电解质虽然室温电导率出色，但与电极之间的界面稳定性一直备受争议。</p>',
      '<p>近期研究表明，LiNbO₃ 涂层在硫化物与正极之间形成稳定的中间层，可显著降低界面阻抗。</p>'
    ];
    var children = paras.map(function (p) { return _textBlock(p); });
    return { id: _specId('sec'), type: 'section', children: children };
  }

  function buildDualSpec() {
    var leftParas = [
      '<p>《固态电解质》第 3 章主线是硫化物电解质的界面问题。</p>',
      '<p>关键论点：Li₆PS₅Cl 的室温电导率可达 <mark>10⁻³ S/cm</mark>，但与金属锂的界面稳定性差。</p>',
      '<p>LiNbO₃ 涂层在硫化物与正极之间形成稳定中间层，可降低界面阻抗约 10×。</p>'
    ];
    var rightBlocks = [
      { id: _specId('doc'), type: 'doc', fileId: 'f-doc-1', page: 0, pageTag: 'P.28',
        text: 'Li₆PS₅Cl argyrodite 结构，室温电导率 σ ≈ 1.2 × 10⁻³ S/cm。冷压致密化后界面接触良好，但对空气敏感（遇水分解出 H₂S）。',
        html: '<div class="pdf-head"><div class="pdf-head__title">硫化物固体电解质界面稳定性研究</div><div class="pdf-head__meta">J. Solid State Ionics, 2024, 35(3): 281-295 · DOI: 10.1016/j.ssi.2024.03.012</div></div>' +
              '<h3 class="pdf-h">3.1  Li₆PS₅Cl 结构与电导率</h3>' +
              '<p>Li₆PS₅Cl 采用 argyrodite 结构（空间群 F4̄3m），Li⁺ 在晶格中形成三维迁移网络。室温下离子电导率：</p>' +
              '<div class="pdf-eq">σ<sub>RT</sub> ≈ 1.2 × 10⁻³ S/cm</div>' +
              '<p>冷压致密化（370 MPa, 25 °C）后相对密度可达 92%，颗粒间界面接触良好。但材料对空气敏感，遇水分解：</p>' +
              '<div class="pdf-eq">Li₆PS₅Cl + H₂O → LiOH + H₂S↑</div>' +
              '<p class="pdf-note">⚠ 上述数据基于四电极体系测量，两电极可能高估界面阻抗。</p>' },
      { id: _specId('doc'), type: 'doc', fileId: 'f-doc-1', page: 1, pageTag: 'P.29',
        text: 'LiNbO₃ 涂层（~5 nm）在正极/硫化物界面形成稳定中间层，EIS 拟合显示界面阻抗降低约一个数量级。',
        html: '<div class="pdf-head"><div class="pdf-head__title">硫化物固体电解质界面稳定性研究</div><div class="pdf-head__meta">J. Solid State Ionics, 2024, 35(3): 281-295 · 3.2 节</div></div>' +
              '<h3 class="pdf-h">3.2  LiNbO₃ 涂层界面改性</h3>' +
              '<p>在正极（NCM811）颗粒表面原子层沉积 ~5 nm LiNbO₃ 非晶层，形成稳定的离子/电子混合导通中间层。</p>' +
              '<p>EIS 拟合结果（25 °C, 0.1 mA/cm²）：</p>' +
              '<div class="pdf-table"><div class="pdf-table__row pdf-table__row--head"><span>样品</span><span>R<sub>int</sub> (Ω·cm²)</span><span>降幅</span></div>' +
              '<div class="pdf-table__row"><span>未涂层</span><span>1,240</span><span>—</span></div>' +
              '<div class="pdf-table__row"><span>LiNbO₃@5nm</span><span>132</span><span>↓ 9.4×</span></div></div>' +
              '<p>循环 200 次后涂层无明显破裂，界面阻抗增长 &lt; 8%。</p>' },
      { id: _specId('doc'), type: 'doc', fileId: 'f-doc-1', page: 2, pageTag: 'P.30',
        text: '注意：上述结论基于四电极体系。两电极测量可能高估界面阻抗。',
        html: '<div class="pdf-head"><div class="pdf-head__title">硫化物固体电解质界面稳定性研究</div><div class="pdf-head__meta">J. Solid State Ionics, 2024, 35(3): 281-295 · 3.3 节</div></div>' +
              '<h3 class="pdf-h">3.3  测量方法与展望</h3>' +
              '<p>四电极体系可分离体相阻抗与界面阻抗，是评估硫化物电解质的推荐方法。两电极构型中，正极/电解质界面与负极/电解质界面叠加，可能高估总阻抗达 30-50%。</p>' +
              '<div class="pdf-callout"><strong>关键结论</strong>：LiNbO₃ 涂层在硫化物体系中具有显著界面改性效果，但需严格控制环境湿度（&lt; 1 ppm H₂O）。</div>' +
              '<p>后续工作将探索 Li₃YCl₆ 等氯化物电解质的界面兼容性，以及原位 TEM 观测涂层演化。</p>' }
    ];
    return {
      id: _specId('cols'), type: 'cols',
      cols: [
        [{ id: _specId('sec'), type: 'section', children: leftParas.map(function (p) { return _textBlock(p); }) }],
        [{ id: _specId('sec'), type: 'section', children: rightBlocks }]
      ]
    };
  }

  function buildCanvasSpec() {
    /* 从 state.canvas.blocks 派生 spec（保留 x/y 与 subtype），无则用默认 */
    var src = (state.canvas.blocks && state.canvas.blocks.length) ? state.canvas.blocks : defaultCanvasBlocks().blocks;
    var children = src.map(function (b) {
      return {
        id: 'cv-' + b.id,
        type: 'text',
        subtype: b.type,            /* canvas 内特有：text/evidence/code/link */
        text: b.text || '',
        x: b.x != null ? b.x : 0,
        y: b.y != null ? b.y : 0,
        title: b.title || '',
        aiCo: !!b.aiCo
      };
    });
    var links = (state.canvas.links && state.canvas.links.length) ? state.canvas.links.slice() : defaultCanvasBlocks().links;
    return { id: _specId('cv'), type: 'canvas', children: children, links: links };
  }

  function buildOutlineSpec() {
    /* 从 state.outline 派生 spec（保留 outlineType / 折叠态 / aiCo），根节点本身也是显示节点 */
    function conv(node) {
      if (!node) return null;
      var kids = (node.children || []).map(conv).filter(Boolean);
      return {
        id: node.id || _specId('o'),
        type: 'outline-node',
        outlineType: node.type || 'opinion',
        text: node.text || '',
        collapsed: !!node.collapsed,
        aiCo: !!node.aiCo,
        children: kids
      };
    }
    var root = state.outline || defaultOutline();
    return { id: _specId('sec'), type: 'section', children: [conv(root)].filter(Boolean) };
  }

  /* =====================================================================
   * Task 2.3：spec 树操作工具（上移/下移/查找/重排）
   * ===================================================================*/
  /* 在 spec 树里查找 id，返回 { block, parentChildren, idx, parent } 或 null
   * parentChildren 是包含该块的数组（便于 splice），parent 是该数组的归属块（section/canvas/...） */
  function findSpecBlock(id, spec, parent) {
    spec = spec || state.spec;
    if (!spec) return null;
    /* cols 的 cols[] 每一项是子块数组 */
    if (spec.cols) {
      for (var ci = 0; ci < spec.cols.length; ci++) {
        var col = spec.cols[ci] || [];
        for (var cj = 0; cj < col.length; cj++) {
          if (col[cj].id === id) return { block: col[cj], parentChildren: col, idx: cj, parent: spec };
          var deep = findSpecBlock(id, col[cj], spec);
          if (deep) return deep;
        }
      }
    }
    /* tabs 的 tabs[].children */
    if (spec.tabs) {
      for (var ti = 0; ti < spec.tabs.length; ti++) {
        var panel = spec.tabs[ti].children || [];
        for (var tj = 0; tj < panel.length; tj++) {
          if (panel[tj].id === id) return { block: panel[tj], parentChildren: panel, idx: tj, parent: spec };
          var deep2 = findSpecBlock(id, panel[tj], spec);
          if (deep2) return deep2;
        }
      }
    }
    /* 普通子块（section / grid / canvas / callout / outline-node） */
    if (spec.children) {
      for (var k = 0; k < spec.children.length; k++) {
        if (spec.children[k].id === id) return { block: spec.children[k], parentChildren: spec.children, idx: k, parent: spec };
        var deep3 = findSpecBlock(id, spec.children[k], spec);
        if (deep3) return deep3;
      }
    }
    /* 根节点自身 */
    if (spec.id === id) return { block: spec, parentChildren: null, idx: -1, parent: parent || null };
    return null;
  }

  /* 把 id 块在父节点 children 内前移/后移一位（dir: -1 上移 / +1 下移） */
  function moveSpecBlock(id, dir) {
    var r = findSpecBlock(id);
    if (!r || !r.parentChildren) return false;
    var arr = r.parentChildren;
    var ni = r.idx + dir;
    if (ni < 0 || ni >= arr.length) return false;
    var tmp = arr[r.idx];
    arr[r.idx] = arr[ni];
    arr[ni] = tmp;
    return true;
  }

  /* 重排：把 srcId 块从原位置移动到 tgtParentChildren 的 tgtIdx 位置（同父布局块内） */
  function reorderSpecBlock(srcId, tgtParentChildren, tgtIdx) {
    var r = findSpecBlock(srcId);
    if (!r || !r.parentChildren) return false;
    /* 约束：不跨父布局块边界（parentChildren 必须相同） */
    if (r.parentChildren !== tgtParentChildren) return false;
    r.parentChildren.splice(r.idx, 1);
    var ni = Math.max(0, Math.min(tgtIdx, tgtParentChildren.length));
    tgtParentChildren.splice(ni, 0, r.block);
    return true;
  }

  /* 渲染 outline 节点类型中文标签（outlineTypeLabel 在原 outline 代码已存在 typeLabel，这里别名以避免冲突） */
  function outlineTypeLabel(key) {
    var t = outlineTypes().filter(function (x) { return x.key === key; })[0];
    return t ? t.label : '观点';
  }

  /* 把当前 spec 同步回 legacy 字段（写回 bridge 时用） */
  function specToLegacyFields(note) {
    note = note || {};
    note.template = state.template;
    note.spec = state.spec ? JSON.parse(JSON.stringify(state.spec)) : null;
    /* 文本类内容也写一份 body/blocks/outline 兼容旧读取 */
    if (state.template === 'doc') {
      var body = $('[data-ne-docbody]');
      note.body = body ? body.innerHTML : (state.noteBody || '');
    }
    if (state.template === 'dual') {
      /* 标注形式：保存标注数据 + 书签 + 随笔 */
      note.body = state.noteBody || '';
      note.annotations = state.reader.annotations ? JSON.parse(JSON.stringify(state.reader.annotations)) : [];
      note.bookmarks = state.reader.bookmarks ? state.reader.bookmarks.slice() : [];
      note.essays = state.reader.essays ? JSON.parse(JSON.stringify(state.reader.essays)) : {};
    }
    if (state.template === 'canvas') {
      note.blocks = state.canvas.blocks.map(function (b) {
        return { id: b.id, x: b.x, y: b.y, type: b.type, title: b.title || '', text: b.text, aiCo: !!b.aiCo };
      });
      note.links = state.canvas.links.map(function (l) { return { from: l.from, to: l.to }; });
    }
    if (state.template === 'outline') {
      captureOutlineText();
      note.outline = state.outline ? JSON.parse(JSON.stringify(stripAiFlags(state.outline))) : null;
    }
    return note;
  }

  /* ----------------------------- ensureRoot ----------------------------- */

  function ensureRoot() {
    var root = document.getElementById('nb-editor-root');
    if (root) return root;
    root = el('div');
    root.id = 'nb-editor-root';
    root.hidden = true;
    var nbSection = document.querySelector('[data-page="notebook"]');
    if (nbSection) nbSection.appendChild(root);
    return root;
  }

  function rootEl() { return ensureRoot(); }

  /* ----------------------------- 顶栏 / 底栏 ----------------------------- */

  function buildTopbar() {
    var zoom = state.template === 'canvas'
      ? '<div class="ne-topbar__right">' +
        '<div class="ne-zoom">' +
        '<button class="ne-zoom__btn" data-action="ne-zoom-out" aria-label="缩小">' + IC.minus(16) + '</button>' +
        '<span class="ne-zoom__pct" data-ne-zoom-pct>100%</span>' +
        '<button class="ne-zoom__btn" data-action="ne-zoom-in" aria-label="放大">' + IC.plus(16) + '</button>' +
        '</div>' +
        '</div>'
      : '';
    return '<header class="ne-topbar">' +
      '<button class="ne-iconbtn" data-action="ne-back" aria-label="返回">' + IC.back() + '</button>' +
      '<span class="ne-topbar__spacer"></span>' +
      '<button class="ne-topbar__share" data-action="ne-share" aria-label="分享笔记">' + shareIcon() + '</button>' +
      zoom +
      '</header>';
  }

  function shareIcon() {
    return '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="5" r="2.6"/><circle cx="6" cy="12" r="2.6"/><circle cx="18" cy="19" r="2.6"/><path d="M8.3 13.4l7.4 4.2M15.7 6.4L8.3 10.6"/></svg>';
  }

  function buildFoot() {
    /* 工具栏 + 模拟系统键盘，contenteditable 聚焦时一起滑入 */
    var toolbar = '<div class="ne-toolbar" data-ne-toolbar hidden>' +
      '<button class="ne-tb-btn" data-action="ne-tb-image" aria-label="插入图片">' + IC.camera(16) + '<span>图片</span></button>' +
      '<button class="ne-tb-btn" data-action="ne-tb-link" aria-label="插入链接">' + IC.link(16) + '<span>链接</span></button>' +
      '<button class="ne-tb-btn" data-action="ne-tb-voice" aria-label="语音输入">' + IC.voice(16) + '<span>语音</span></button>' +
      '<span class="ne-toolbar__spacer"></span>' +
      '<button class="ne-tb-btn" data-action="ne-tb-ai" aria-label="让林写一段">' + IC.spark(16) + '<span>林</span></button>' +
      '</div>';
    /* canvas 块编辑工具栏（双击块时显示） */
    var blockToolbar = '<div class="ne-toolbar ne-blocktoolbar" data-ne-blocktoolbar hidden>' +
      '<button class="ne-tb-btn" data-action="ne-block-bold" aria-label="加粗"><strong>B</strong></button>' +
      '<button class="ne-tb-btn" data-action="ne-block-italic" aria-label="斜体"><i>I</i></button>' +
      '<button class="ne-tb-btn" data-action="ne-block-cycle-type" aria-label="切换类型">' + IC.grid(14) + '<span>类型</span></button>' +
      '<button class="ne-tb-btn ne-tb-btn--ai" data-action="ne-block-ai" aria-label="AI编排">' + IC.spark(14) + '<span>林</span></button>' +
      '</div>';
    var keyboard = '<div class="ne-keyboard" data-ne-keyboard hidden>' +
      '<div class="ne-keyboard__row">' +
        '<button class="ne-key" type="button">q</button><button class="ne-key" type="button">w</button><button class="ne-key" type="button">e</button><button class="ne-key" type="button">r</button><button class="ne-key" type="button">t</button><button class="ne-key" type="button">y</button><button class="ne-key" type="button">u</button><button class="ne-key" type="button">i</button><button class="ne-key" type="button">o</button><button class="ne-key" type="button">p</button>' +
      '</div>' +
      '<div class="ne-keyboard__row ne-keyboard__row--offset">' +
        '<button class="ne-key" type="button">a</button><button class="ne-key" type="button">s</button><button class="ne-key" type="button">d</button><button class="ne-key" type="button">f</button><button class="ne-key" type="button">g</button><button class="ne-key" type="button">h</button><button class="ne-key" type="button">j</button><button class="ne-key" type="button">k</button><button class="ne-key" type="button">l</button>' +
      '</div>' +
      '<div class="ne-keyboard__row">' +
        '<button class="ne-key ne-key--wide" type="button" data-ne-key="shift">⇧</button>' +
        '<button class="ne-key" type="button">z</button><button class="ne-key" type="button">x</button><button class="ne-key" type="button">c</button><button class="ne-key" type="button">v</button><button class="ne-key" type="button">b</button><button class="ne-key" type="button">n</button><button class="ne-key" type="button">m</button>' +
        '<button class="ne-key ne-key--wide" type="button" data-ne-key="back">⌫</button>' +
      '</div>' +
      '<div class="ne-keyboard__row">' +
        '<button class="ne-key ne-key--wide" type="button">123</button>' +
        '<button class="ne-key" type="button">,</button>' +
        '<button class="ne-key ne-key--space" type="button" data-ne-key="space">空格</button>' +
        '<button class="ne-key" type="button">.</button>' +
        '<button class="ne-key ne-key--wide" type="button" data-ne-key="enter">换行</button>' +
      '</div>' +
    '</div>';
    return toolbar + blockToolbar + keyboard;
  }

  /* ----------------------------- 模板渲染分发 ----------------------------- */

  function buildMain() {
    if (state.template === 'doc') return renderDoc();
    if (state.template === 'dual') return renderReader();
    if (state.template === 'canvas') return renderCanvas();
    if (state.template === 'outline') return renderOutline();
    return renderDoc();
  }

  /* =====================================================================
   * 模板 1：纯文档（doc）—— Task 2.2 改走 buildDocSpec + renderSpec
   * ===================================================================*/
  function renderDoc() {
    /* state.spec 由 open() 时准备好（migrateLegacyNote 或 buildDocSpec 兜底）；
     * 若没有，按 state.noteBody 现场构建 */
    if (!state.spec) {
      var paras = [];
      if (state.noteBody) {
        paras = ['<p>' + escapeHtml(state.noteBody) + '</p>',
                 '<p>（这里可以继续展开你的思考。停下来两秒，林会轻声给一句建议。）</p>'];
      }
      state.spec = buildDocSpec(state.title, paras);
    }
    /* spec 是 section 包多个 text 块；正文区直接铺开 children（不再套一层 section 容器） */
    var bodyHtml = '';
    if (state.spec && state.spec.children) {
      bodyHtml = state.spec.children.map(function (c) { return BlockRenderer.renderSpec(c); }).join('');
    }
    return '<div class="ne-main">' +
      '<div class="ne-doc" data-ne-doc>' +
      '<h1 class="ne-doc__title" contenteditable="true" data-placeholder="无标题" data-ne-doctitle>' + escapeHtml(state.title || '') + '</h1>' +
      '<div class="ne-doc__meta"><span data-ne-wordcount>0 字</span><span>·</span><span>' + nowTime() + '</span><span>·</span><span>纯文档</span></div>' +
      '<div class="ne-doc__body" contenteditable="true" data-ne-docbody>' + bodyHtml + '</div>' +
      '</div>' +
      overlaysHtml() +
      '</div>';
  }

  /* =====================================================================
   * 模板 2：双联阅读（dual / reader）—— 标注形式
   * PDF 全屏显示 + SVG 标注层 + 底部常驻标注工具栏
   * ===================================================================*/
  function renderReader() {
    if (!state.spec || state.spec.type !== 'cols') {
      state.spec = buildDualSpec();
    }
    /* 取 cols[1] 附件区作为 PDF 页面数据 */
    var cols = state.spec.cols || [[], []];
    var pages = (cols[1] && cols[1][0] && cols[1][0].children) || [];
    state.reader.pages = pages;
    if (state.reader.page >= pages.length) state.reader.page = 0;

    var curPage = pages[state.reader.page];
    var pageHtml = curPage ? renderReaderPageBlock(curPage) : '<div class="ne-reader__page-empty">无 PDF 内容</div>';
    var pageTag = curPage ? (curPage.pageTag || ('P.' + (28 + (curPage.page || 0)))) : '';
    var pagerInfo = pageTag + ' / ' + pages.length;
    var bookmarked = state.reader.bookmarks.indexOf(state.reader.page) >= 0;

    /* 标注层 SVG：覆盖在 PDF 上，绘制当前页的标注 */
    var annotateSvg = renderReaderAnnotations();
    /* 文字标注 HTML 层 */
    var textLayerHtml = renderReaderTextLayer();

    return '<div class="ne-main">' +
      '<div class="ne-reader ne-reader--annotate" data-ne-reader>' +
        '<div class="ne-reader__pdf" data-ne-pdf>' +
          pageHtml +
          '<svg class="ne-reader__annotate-layer" data-ne-annotate></svg>' +
          textLayerHtml +
        '</div>' +
        '<div class="ne-reader__followread" data-ne-followread hidden></div>' +
        '<div class="ne-reader__pager">' +
          '<button class="ne-reader__pager-btn" data-action="ne-reader-prev" aria-label="上一页">' + IC.chevL(20) + '</button>' +
          '<span class="ne-reader__pager-info" data-ne-pager-info>' + escapeHtml(pagerInfo) + '</span>' +
          '<button class="ne-reader__pager-btn" data-action="ne-reader-next" aria-label="下一页">' + IC.chevR(20) + '</button>' +
          '<span class="ne-reader__pager-spacer"></span>' +
          '<button class="ne-reader__pager-btn ne-reader__essay-btn" data-action="ne-reader-essay" aria-label="随笔">' + IC.edit(18) + '</button>' +
          '<button class="ne-reader__pager-btn ne-reader__bookmark' + (bookmarked ? ' is-active' : '') + '" data-action="ne-reader-bookmark" aria-label="书签">' + IC.bookmark(18) + '</button>' +
        '</div>' +
        '<div class="ne-reader__tools" data-ne-tools>' +
          '<button class="ne-reader__tool" data-tool="pen" data-action="ne-reader-tool" aria-label="画笔">' + IC.pen(18) + '<span>画笔</span></button>' +
          '<button class="ne-reader__tool" data-tool="text" data-action="ne-reader-tool" aria-label="文字">' + IC.type(18) + '<span>文字</span></button>' +
          '<button class="ne-reader__tool" data-tool="highlight" data-action="ne-reader-tool" aria-label="高亮">' + IC.highlight(18) + '<span>高亮</span></button>' +
          '<button class="ne-reader__tool" data-tool="eraser" data-action="ne-reader-tool" aria-label="橡皮">' + IC.eraser(18) + '<span>橡皮</span></button>' +
          '<span class="ne-reader__tools-spacer"></span>' +
          '<button class="ne-reader__tool ne-reader__tool--ai" data-action="ne-reader-summary" aria-label="总结此页">' + IC.spark(18) + '<span>总结此页</span></button>' +
        '</div>' +
      '</div>' +
      overlaysHtml() +
      '</div>';
  }

  /* 渲染文字标注 HTML 层（可编辑文字框） */
  function renderReaderTextLayer() {
    var page = state.reader.page;
    var annos = state.reader.annotations.filter(function (a) { return a.page === page && a.type === 'text'; });
    var html = annos.map(function (a) {
      return '<div class="ne-reader__text-anno" data-anno="' + a.id + '" style="left:' + a.x + 'px;top:' + a.y + 'px">' +
        '<div class="ne-reader__text-anno-handle" data-ne-textanno-drag="' + a.id + '" aria-label="拖动">' + IC.drag(12) + '</div>' +
        '<div class="ne-reader__text-anno-body" contenteditable="true" data-ne-textanno="' + a.id + '">' + escapeHtml(a.text) + '</div>' +
        '<button class="ne-reader__text-anno-del" data-action="ne-reader-del-anno" data-anno="' + a.id + '" aria-label="删除">' + IC.close(12) + '</button>' +
        '</div>';
    }).join('');
    return '<div class="ne-reader__text-layer" data-ne-textlayer>' + html + '</div>';
  }

  /* 渲染当前页的标注到 SVG（仅画笔和高亮，文字标注用 HTML 层） */
  function renderReaderAnnotations() {
    var svg = $('[data-ne-annotate]');
    if (!svg) return '';
    var page = state.reader.page;
    var annos = state.reader.annotations.filter(function (a) { return a.page === page && (a.type === 'pen' || a.type === 'highlight'); });
    var html = annos.map(function (a) {
      if (a.type === 'pen') {
        var d = a.points.map(function (p, i) { return (i === 0 ? 'M' : 'L') + p.x + ' ' + p.y; }).join(' ');
        return '<path d="' + d + '" fill="none" stroke="#C1272D" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" data-anno="' + a.id + '" pointer-events="stroke"/>';
      }
      if (a.type === 'highlight') {
        /* 高亮：半透明黄色矩形 */
        var x = Math.min(a.x, a.x + a.w);
        var y = Math.min(a.y, a.y + a.h);
        var w = Math.abs(a.w);
        var h = Math.abs(a.h);
        return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" fill="rgba(255, 193, 7, 0.30)" stroke="none" rx="2" data-anno="' + a.id + '" pointer-events="all"/>';
      }
      return '';
    }).join('');
    svg.innerHTML = html;
    /* 同时刷新文字层 */
    var textLayer = $('[data-ne-textlayer]');
    if (textLayer) {
      var textAnnos = state.reader.annotations.filter(function (a) { return a.page === page && a.type === 'text'; });
      textLayer.innerHTML = textAnnos.map(function (a) {
        return '<div class="ne-reader__text-anno" data-anno="' + a.id + '" style="left:' + a.x + 'px;top:' + a.y + 'px">' +
          '<div class="ne-reader__text-anno-handle" data-ne-textanno-drag="' + a.id + '" aria-label="拖动">' + IC.drag(12) + '</div>' +
          '<div class="ne-reader__text-anno-body" contenteditable="true" data-ne-textanno="' + a.id + '">' + escapeHtml(a.text) + '</div>' +
          '<button class="ne-reader__text-anno-del" data-action="ne-reader-del-anno" data-anno="' + a.id + '" aria-label="删除">' + IC.close(12) + '</button>' +
          '</div>';
      }).join('');
    }
    return '';
  }

  /* reader 标注交互：画笔/高亮/文字/橡皮 */
  function bindReaderAnnotate() {
    var pdf = $('[data-ne-pdf]');
    var svg = $('[data-ne-annotate]');
    if (!pdf || !svg || pdf.__zxReaderBound) return;
    pdf.__zxReaderBound = true;

    var drawing = null;

    function pt(e) {
      var r = pdf.getBoundingClientRect();
      var x = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
      var y = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) - r.top;
      return { x: x, y: y };
    }

    /* 近距离检测：找到点击位置附近的标注 */
    function findNearbyAnno(p) {
      var page = state.reader.page;
      var annos = state.reader.annotations.filter(function (a) { return a.page === page; });
      var threshold = 20;
      for (var i = annos.length - 1; i >= 0; i--) {
        var a = annos[i];
        if (a.type === 'pen' || a.type === 'highlight') {
          if (a.type === 'highlight') {
            var x1 = Math.min(a.x, a.x + a.w);
            var x2 = Math.max(a.x, a.x + a.w);
            var y1 = Math.min(a.y, a.y + a.h);
            var y2 = Math.max(a.y, a.y + a.h);
            if (p.x >= x1 - threshold && p.x <= x2 + threshold && p.y >= y1 - threshold && p.y <= y2 + threshold) return a;
          } else {
            for (var j = 0; j < a.points.length; j++) {
              var dx = a.points[j].x - p.x;
              var dy = a.points[j].y - p.y;
              if (dx * dx + dy * dy <= threshold * threshold) return a;
            }
          }
        }
        if (a.type === 'text') {
          if (p.x >= a.x - threshold && p.x <= a.x + 120 + threshold && p.y >= a.y - threshold && p.y <= a.y + 40 + threshold) return a;
        }
      }
      return null;
    }

    function down(e) {
      var tool = state.reader.tool;
      if (!tool) return;
      /* 文字标注的编辑/删除不拦截 */
      if (e.target.closest('[data-ne-textlayer]')) return;
      if (e.cancelable) e.preventDefault();
      var p = pt(e);
      if (tool === 'eraser') {
        var anno = findNearbyAnno(p);
        if (anno) {
          state.reader.annotations = state.reader.annotations.filter(function (a) { return a.id !== anno.id; });
          renderReaderAnnotations();
        }
        return;
      }
      if (tool === 'text') {
        /* 在点击位置插入可编辑文字框 */
        var id = 'ra-' + Date.now();
        state.reader.annotations.push({ id: id, page: state.reader.page, type: 'text', x: p.x, y: p.y, text: '' });
        renderReaderAnnotations();
        /* 聚焦新文字框 */
        setTimeout(function () {
          var el = document.querySelector('[data-ne-textanno="' + id + '"]');
          if (el) { el.focus(); }
        }, 50);
        return;
      }
      if (tool === 'highlight') {
        /* 高亮：拖拽创建矩形 */
        drawing = { id: 'ra-' + Date.now(), page: state.reader.page, type: 'highlight', x: p.x, y: p.y, w: 0, h: 0 };
        state.reader.annotations.push(drawing);
        return;
      }
      /* pen：开始画线 */
      drawing = { id: 'ra-' + Date.now(), page: state.reader.page, type: 'pen', points: [p] };
      state.reader.annotations.push(drawing);
    }

    function move(e) {
      if (!drawing) return;
      if (e.cancelable) e.preventDefault();
      var p = pt(e);
      if (drawing.type === 'highlight') {
        drawing.w = p.x - drawing.x;
        drawing.h = p.y - drawing.y;
        renderReaderAnnotations();
      } else {
        drawing.points.push(p);
        renderReaderAnnotations();
      }
    }

    function up() {
      if (drawing && drawing.type === 'highlight') {
        /* 太小的高亮移除 */
        if (Math.abs(drawing.w) < 8 && Math.abs(drawing.h) < 8) {
          state.reader.annotations = state.reader.annotations.filter(function (a) { return a.id !== drawing.id; });
          renderReaderAnnotations();
        }
      } else if (drawing && drawing.type === 'pen' && drawing.points.length < 2) {
        state.reader.annotations = state.reader.annotations.filter(function (a) { return a.id !== drawing.id; });
        renderReaderAnnotations();
      }
      drawing = null;
    }

    pdf.addEventListener('touchstart', down, { passive: false });
    pdf.addEventListener('touchmove', move, { passive: false });
    pdf.addEventListener('touchend', up);
    pdf.addEventListener('mousedown', down);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);

    /* 文字标注拖拽 */
    var textDrag = null;
    function startTextDrag(e) {
      var handle = e.target.closest('[data-ne-textanno-drag]');
      if (!handle) return;
      var aid = handle.getAttribute('data-ne-textanno-drag');
      var anno = state.reader.annotations.find(function (a) { return a.id === aid; });
      if (!anno) return;
      var r = pdf.getBoundingClientRect();
      var px = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
      var py = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) - r.top;
      textDrag = { id: aid, offsetX: px - anno.x, offsetY: py - anno.y };
      if (e.cancelable) e.preventDefault();
      e.stopPropagation();
    }
    function moveTextDrag(e) {
      if (!textDrag) return;
      var r = pdf.getBoundingClientRect();
      var px = (e.touches && e.touches[0] ? e.touches[0].clientX : e.clientX) - r.left;
      var py = (e.touches && e.touches[0] ? e.touches[0].clientY : e.clientY) - r.top;
      var anno = state.reader.annotations.find(function (a) { return a.id === textDrag.id; });
      if (!anno) return;
      anno.x = px - textDrag.offsetX;
      anno.y = py - textDrag.offsetY;
      /* 更新 DOM 位置（不重建整个层，保持编辑焦点） */
      var node = document.querySelector('[data-anno="' + textDrag.id + '"]');
      if (node) {
        node.style.left = anno.x + 'px';
        node.style.top = anno.y + 'px';
      }
    }
    function endTextDrag() { textDrag = null; }
    pdf.addEventListener('touchstart', startTextDrag, { passive: false });
    pdf.addEventListener('mousedown', startTextDrag);
    document.addEventListener('touchmove', moveTextDrag, { passive: false });
    document.addEventListener('mousemove', moveTextDrag);
    document.addEventListener('touchend', endTextDrag);
    document.addEventListener('mouseup', endTextDrag);

    renderReaderAnnotations();
  }

  /* reader 翻页 */
  function readerPagePrev() {
    if (state.reader.page > 0) {
      state.reader.page--;
      rerenderReaderPage();
      followRead(state.reader.page);
    }
  }
  function readerPageNext() {
    if (state.reader.page < state.reader.pages.length - 1) {
      state.reader.page++;
      rerenderReaderPage();
      followRead(state.reader.page);
    }
  }
  function rerenderReaderPage() {
    var pdf = $('[data-ne-pdf]');
    if (!pdf) return;
    var curPage = state.reader.pages[state.reader.page];
    var pageHtml = curPage ? renderReaderPageBlock(curPage) : '<div class="ne-reader__page-empty">无 PDF 内容</div>';
    pdf.innerHTML = pageHtml +
      '<svg class="ne-reader__annotate-layer" data-ne-annotate></svg>' +
      '<div class="ne-reader__text-layer" data-ne-textlayer></div>';
    /* 更新页码 */
    var info = $('[data-ne-pager-info]');
    if (info && curPage) {
      var tag = curPage.pageTag || ('P.' + (28 + (curPage.page || 0)));
      info.textContent = tag + ' / ' + state.reader.pages.length;
    }
    /* 更新书签按钮状态 */
    var bmBtn = $('.ne-reader__bookmark');
    if (bmBtn) {
      var bookmarked = state.reader.bookmarks.indexOf(state.reader.page) >= 0;
      bmBtn.classList.toggle('is-active', bookmarked);
    }
    /* 重绘标注 */
    renderReaderAnnotations();
    /* 重新绑定标注交互（因为 DOM 重建了） */
    var newPdf = $('[data-ne-pdf]');
    if (newPdf) newPdf.__zxReaderBound = false;
    bindReaderAnnotate();
  }

  /* reader 工具切换 */
  function readerSelectTool(tool) {
    state.reader.tool = (state.reader.tool === tool) ? null : tool;
    $all('[data-action="ne-reader-tool"]').forEach(function (b) {
      b.classList.toggle('is-active', b.getAttribute('data-tool') === state.reader.tool);
    });
    var pdf = $('[data-ne-pdf]');
    if (pdf) {
      pdf.classList.toggle('is-annotating', !!state.reader.tool);
      pdf.classList.toggle('is-pen', state.reader.tool === 'pen' || state.reader.tool === 'highlight');
      pdf.classList.toggle('is-text', state.reader.tool === 'text');
      pdf.classList.toggle('is-eraser', state.reader.tool === 'eraser');
    }
  }

  /* reader 书签切换 */
  function toggleReaderBookmark() {
    var pg = state.reader.page;
    var idx = state.reader.bookmarks.indexOf(pg);
    if (idx >= 0) {
      state.reader.bookmarks.splice(idx, 1);
      toast('已移除书签');
    } else {
      state.reader.bookmarks.push(pg);
      toast('已添加书签', true);
    }
    var bmBtn = $('.ne-reader__bookmark');
    if (bmBtn) bmBtn.classList.toggle('is-active', state.reader.bookmarks.indexOf(pg) >= 0);
  }

  /* reader 总结此页 */
  function summarizeReaderPage() {
    var pg = state.reader.page;
    var text = attachPageText(pg);
    if (!text) { toast('当前页无内容'); return; }
    /* 用 AI 卡片展示总结 */
    var summary = '本页要点：' + text.slice(0, 60) + '…';
    if (text.length < 80) summary = '本页要点：' + text;
    insertReaderCard('normal', summary);
  }

  /* reader 随笔覆盖层 */
  function openReaderEssay() {
    closeReaderEssay();
    var pg = state.reader.page;
    var existing = state.reader.essays[pg] || '';
    var scrim = el('div', 'ne-essay-scrim');
    scrim.setAttribute('data-essay-scrim', '');
    scrim.onclick = closeReaderEssay;
    var panel = el('div', 'ne-essay');
    var pageTag = '';
    var curPage = state.reader.pages[pg];
    if (curPage) pageTag = curPage.pageTag || ('P.' + (28 + (curPage.page || 0)));
    panel.innerHTML =
      '<div class="ne-essay__head">' +
        '<button class="ne-essay__close" data-action="ne-reader-essay-close" aria-label="关闭">' + IC.close(18) + '</button>' +
        '<span class="ne-essay__title">随笔 · ' + escapeHtml(pageTag) + '</span>' +
        '<button class="ne-essay__save" data-action="ne-reader-essay-save">保存</button>' +
      '</div>' +
      '<div class="ne-essay__body" contenteditable="true" data-ne-essay-text data-placeholder="在此页写下你的想法…" data-ne-essay-page="' + pg + '">' + escapeHtml(existing) + '</div>';
    var root = rootEl();
    root.appendChild(scrim);
    root.appendChild(panel);
    setTimeout(function () {
      var t = $('[data-ne-essay-text]');
      if (t) t.focus();
    }, 100);
  }
  function closeReaderEssay() {
    var s = $('[data-essay-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = $('.ne-essay');
    if (p) p.parentNode.removeChild(p);
  }
  function saveReaderEssay() {
    var t = $('[data-ne-essay-text]');
    if (!t) return;
    var pg = t.getAttribute('data-ne-essay-page');
    var text = (t.textContent || '').trim();
    if (pg != null) {
      state.reader.essays[pg] = text;
      var pageTag = '';
      var curPage = state.reader.pages[parseInt(pg, 10)];
      if (curPage) pageTag = curPage.pageTag || ('P.' + (28 + (curPage.page || 0)));
      toast('随笔已保存到' + pageTag, true);
    }
    closeReaderEssay();
  }

  /* =====================================================================
   * 模板 3：无限画布（canvas）—— Task 2.2 走 buildCanvasSpec + spec 抽象
   * 子块仍由 renderBlocks 在 bindCanvas 后落地（绝对定位 + 拖拽/连线/缩放）
   * ===================================================================*/
  function renderCanvas() {
    /* Task 2.1：若 bridge 加载了已存画布则用之，否则用默认块 */
    var init;
    if (state._loadedCanvas && state._loadedCanvas.length) {
      var maxId = 0;
      state._loadedCanvas.forEach(function (b) { if (b.id > maxId) maxId = b.id; });
      init = { blocks: state._loadedCanvas, links: state._loadedLinks || [] };
      state.canvas.nextId = maxId + 1;
    } else {
      init = defaultCanvasBlocks();
      state.canvas.nextId = init.blocks.length + 1;
    }
    state.canvas.blocks = init.blocks;
    state.canvas.links = init.links;
    state.canvas.panX = 8; state.canvas.panY = 8; state.canvas.scale = 1;
    state.canvas.selected = null;
    /* Task 2.2：把 canvas 状态同步到 spec（state.canvas.blocks 是交互权威源） */
    state.spec = buildCanvasSpec();
    return '<div class="ne-main">' +
      '<div class="ne-canvas" data-ne-canvas>' +
      '<div class="ne-canvas__pad" data-ne-pad>' +
      '<svg class="ne-canvas__svg" data-ne-svg></svg>' +
      '</div>' +
      '<div class="ne-canvas__addmenu" data-ne-addmenu>' +
      CANVAS_ADD_ITEMS.map(function (it) {
        return '<button class="ne-canvas__additem" data-action="ne-add-block" data-btype="' + it.type + '">' + blockTypeIcon(it.type) + '<span>' + escapeHtml(it.name) + '</span></button>';
      }).join('') +
      '<span class="ne-canvas__addmenu-sep" aria-hidden="true"></span>' +
      '<button class="ne-canvas__additem ne-canvas__additem--ai" data-action="ne-canvas-summarize-all">' + IC.spark(16) + '<span>✦ 总结全画布</span></button>' +
      '</div>' +
      '<div class="ne-canvas__hint">双指缩放 · 拖动空白平移 · 长按空白加块</div>' +
      '</div>' +
      overlaysHtml() +
      '</div>';
  }

  function blockTypeIcon(type) {
    if (type === 'code') return IC.code(16);
    if (type === 'link') return IC.link(16);
    if (type === 'evidence') return IC.check(16);
    return IC.doc(16);
  }

  function blockClass(type) {
    if (type === 'code') return 'ne-block ne-block--code';
    if (type === 'link') return 'ne-block ne-block--link';
    return 'ne-block ne-block--text';
  }

  function renderBlocks() {
    var pad = $('[data-ne-pad]');
    if (!pad) return;
    /* 保留 svg，清掉块 */
    $all('.ne-block', pad).forEach(function (b) { b.parentNode.removeChild(b); });
    state.canvas.blocks.forEach(function (b) {
      pad.insertAdjacentHTML('beforeend', blockHtml(b));
    });
    renderLinks();
    updateZoomLabel();
  }

  function blockHtml(b) {
    var typeLabel = ({ text: '文本', evidence: '证据', code: '代码', link: '关联' })[b.type] || '文本';
    var content;
    if (b.type === 'code') {
      content = '<div style="white-space:pre-wrap">' + escapeHtml(b.text) + '</div>';
    } else if (b.type === 'link') {
      content = '<a class="ne-wikilink">' + escapeHtml(b.text) + '</a>';
    } else {
      content = escapeHtml(b.text);
    }
    return '<div class="' + blockClass(b.type) + (state.canvas.selected === b.id ? ' is-selected' : '') + (b.aiCo ? ' is-ai' : '') + '" ' +
      'data-block="' + b.id + '" style="left:' + b.x + 'px;top:' + b.y + 'px">' +
      (b.aiCo ? '<span class="ne-block__ai-badge" title="林协写">✦</span>' : '') +
      '<div class="ne-block__type">' + blockTypeIcon(b.type) + '<span>' + typeLabel + '</span></div>' +
      '<div class="ne-block__content" contenteditable="false" data-ne-blockcontent="' + b.id + '">' + content + '</div>' +
      '<span class="ne-block__port ne-block__port--e" data-port="e" data-block="' + b.id + '" aria-label="向东连线"></span>' +
      '<span class="ne-block__port ne-block__port--s" data-port="s" data-block="' + b.id + '" aria-label="向南连线"></span>' +
      '</div>';
  }

  /* canvas 块编辑：双击进入编辑 / 失焦保存 / 选中时显示样式工具栏 */
  function enterBlockEdit(id) {
    var el = document.querySelector('[data-ne-blockcontent="' + id + '"]');
    if (!el) return;
    el.setAttribute('contenteditable', 'true');
    el.focus();
    /* 选中全部文字 */
    var range = document.createRange();
    range.selectNodeContents(el);
    var sel = window.getSelection();
    sel.removeAllRanges();
    sel.addRange(range);
    el.classList.add('is-editing');
    /* 隐藏块菜单（编辑时不显示） */
    hideBlockMenu();
    /* 显示块工具栏 + 键盘 */
    var bt = $('[data-ne-blocktoolbar]');
    var kb = $('[data-ne-keyboard]');
    var rt = $('[data-ne-toolbar]');
    if (bt) { bt.__forBlock = id; bt.removeAttribute('hidden'); }
    if (kb) kb.removeAttribute('hidden');
    if (rt) rt.setAttribute('hidden', '');
  }
  function exitBlockEdit(id) {
    var el = document.querySelector('[data-ne-blockcontent="' + id + '"]');
    if (!el) return;
    el.setAttribute('contenteditable', 'false');
    el.classList.remove('is-editing');
    /* 保存内容回 state.canvas.blocks */
    var b = blockById(id);
    if (b) {
      b.text = el.textContent || '';
      /* 重建 spec 同步 */
      state.spec = buildCanvasSpec();
    }
    /* 隐藏块工具栏 + 键盘 */
    var bt = $('[data-ne-blocktoolbar]');
    var kb = $('[data-ne-keyboard]');
    if (bt) { bt.setAttribute('hidden', ''); bt.__forBlock = null; }
    if (kb) kb.setAttribute('hidden', '');
  }
  /* 选中块时显示样式编辑工具栏 */
  /* 旧浮动工具栏已移除，改为底部按键栏（见 buildFoot 中的 .ne-blocktoolbar） */
  /* 切换块类型 */
  function cycleBlockType(id) {
    var b = blockById(id);
    if (!b) return;
    var types = ['text', 'evidence', 'code', 'link'];
    var idx = types.indexOf(b.type);
    if (idx < 0) idx = 0;
    b.type = types[(idx + 1) % types.length];
    renderBlocks();
    selectBlock(id);
  }

  function renderLinks() {
    var svgEl = $('[data-ne-svg]');
    if (!svgEl) return;
    var byId = {};
    state.canvas.blocks.forEach(function (b) { byId[b.id] = b; });
    /* 测量实际 DOM 块尺寸（块宽高由内容决定，范围 120-240px），
     * 连线坐标系与 SVG 同在 .ne-canvas__pad 内，直接用 offsetWidth/Height。 */
    function blockEdge(id, side) {
      var b = byId[id];
      if (!b) return null;
      var elNode = document.querySelector('[data-block="' + id + '"]');
      var w = elNode ? elNode.offsetWidth : 120;
      var h = elNode ? elNode.offsetHeight : 56;
      if (side === 'e') return { x: b.x + w, y: b.y + h / 2 };
      return { x: b.x, y: b.y + h / 2 };
    }
    var paths = state.canvas.links.map(function (lk) {
      var a = blockEdge(lk.from, 'e');
      var b2 = blockEdge(lk.to, 'w');
      if (!a || !b2) return '';
      var x1 = a.x, y1 = a.y, x2 = b2.x, y2 = b2.y;
      var mx = (x1 + x2) / 2;
      return '<path d="M' + x1 + ' ' + y1 + ' C' + mx + ' ' + y1 + ', ' + mx + ' ' + y2 + ', ' + x2 + ' ' + y2 + '" fill="none" stroke="#B4602C" stroke-opacity="0.55" stroke-width="1.6" stroke-dasharray="4 3"/>';
    }).join('');
    svgEl.innerHTML = paths;
  }

  function applyCanvasTransform() {
    var pad = $('[data-ne-pad]');
    if (pad) pad.style.transform = 'translate(' + state.canvas.panX + 'px,' + state.canvas.panY + 'px) scale(' + state.canvas.scale + ')';
    updateZoomLabel();
  }
  function updateZoomLabel() {
    var pct = $('[data-ne-zoom-pct]');
    if (pct) pct.textContent = Math.round(state.canvas.scale * 100) + '%';
  }

  /* =====================================================================
   * 模板 4：大纲树（outline）—— Task 2.2 走 buildOutlineSpec + renderSpec
   * ===================================================================*/
  function renderOutline() {
    if (!state.outline) state.outline = defaultOutline();
    /* Task 2.2：spec 是 state.outline 的块树映射（type 'outline-node' 嵌套） */
    state.spec = buildOutlineSpec();
    /* 取 spec.children[0]（即根 outline 节点），用 renderSpec 输出 */
    var nodesHtml = '';
    if (state.spec.children && state.spec.children[0]) {
      nodesHtml = BlockRenderer.renderSpec(state.spec.children[0]);
    }
    return '<div class="ne-main">' +
      '<div class="ne-outline" data-ne-outline>' +
      '<div class="ne-outline__nodes" data-ne-outnodes>' + nodesHtml + '</div>' +
      '</div>' +
      overlaysHtml() +
      '<div class="ne-type-menu" data-ne-typemenu>' +
      outlineTypes().map(function (t) {
        return '<button class="ne-type-menu__item" data-action="ne-set-type" data-t="' + t.key + '">' +
          '<span class="ne-type-menu__dot" style="background:' + t.color + '"></span>' + escapeHtml(t.label) + '</button>';
      }).join('') +
      '<span class="ne-type-menu__sep" aria-hidden="true"></span>' +
      '<button class="ne-type-menu__item ne-type-menu__item--ai" data-action="ne-suggest-type">' + IC.spark(13) + ' 林建议类型</button>' +
      '<button class="ne-type-menu__item ne-type-menu__item--ai" data-action="ne-collapse-subtree">' + IC.spark(13) + ' 收束这棵子树</button>' +
      '</div>' +
      '</div>';
  }

  function outlineTypes() {
    return [
      { key: 'opinion', label: '观点', color: '#1D5B7A' },
      { key: 'evidence', label: '证据', color: '#2F855A' },
      { key: 'question', label: '问题', color: '#C7A24A' },
      { key: 'quote', label: '引用', color: '#B4602C' },
      { key: 'todo', label: '待办', color: '#6B655C' }
    ];
  }
  function typeLabel(key) { var t = outlineTypes().filter(function (x) { return x.key === key; })[0]; return t ? t.label : '观点'; }

  function outlineNodeHtml(node) {
    var hasChildren = node.children && node.children.length;
    var childHtml = (hasChildren && !node.collapsed)
      ? '<div class="ne-node__children">' + node.children.map(outlineNodeHtml).join('') + '</div>'
      : '';
    return '<div class="ne-node ne-node--' + node.type + (node.aiCo ? ' is-ai' : '') + '" data-node="' + node.id + '">' +
      '<div class="ne-node__gutter">' +
      '<button class="ne-node__toggle' + (!hasChildren ? ' is-leaf' : '') + (node.collapsed ? ' is-collapsed' : '') + '" data-action="ne-toggle-node" data-node="' + node.id + '" aria-label="折叠/展开">' + IC.chev(14) + '</button>' +
      '<span class="ne-node__bullet" aria-hidden="true">' + (node.aiCo ? '✦' : '') + '</span>' +
      '</div>' +
      '<div class="ne-node__text" contenteditable="true" data-placeholder="输入内容…" data-ne-nodetext="' + node.id + '">' + escapeHtml(node.text) + '</div>' +
      '<button class="ne-node__typechip" data-action="ne-open-typemenu" data-node="' + node.id + '">' + escapeHtml(typeLabel(node.type)) + '</button>' +
      childHtml +
      '</div>';
  }

  function findNode(id, node, parent, idx) {
    node = node || state.outline;
    if (node.id === id) return { node: node, parent: parent, idx: idx };
    if (node.children) {
      for (var i = 0; i < node.children.length; i++) {
        var r = findNode(id, node.children[i], node, i);
        if (r) return r;
      }
    }
    return null;
  }
  function rerenderOutline() {
    var box = $('[data-ne-outnodes]');
    if (!box) return;
    /* Task 2.2：重建 spec 后用 renderSpec 输出（与 outline-node 块渲染对齐） */
    state.spec = buildOutlineSpec();
    var nodesHtml = '';
    if (state.spec.children && state.spec.children[0]) {
      nodesHtml = BlockRenderer.renderSpec(state.spec.children[0]);
    }
    box.innerHTML = nodesHtml;
  }

  /* =====================================================================
   * 浮层 HTML（姿态 1/2/3 + 菜单 + 面板 + 遮罩）
   * ===================================================================*/
  function overlaysHtml() {
    return '' +
      '<div class="ne-slash" data-ne-slash></div>' +
      '<div class="ne-linksearch" data-ne-linksearch></div>' +
      '<div class="ne-ai-panel" data-ne-aipanel></div>' +
      '<div class="ne-inline-toolbar" data-ne-inlinetb hidden>' +
      '<button class="ne-inline-toolbar__btn" data-action="ne-bold" aria-label="加粗">B</button>' +
      '<button class="ne-inline-toolbar__btn" data-action="ne-italic" aria-label="斜体"><i>I</i></button>' +
      '<button class="ne-inline-toolbar__btn ne-inline-toolbar__btn--ai" data-action="ne-ask-lin" aria-label="问林">' + IC.spark(16) + ' 问林</button>' +
      '</div>' +
      '<div class="ne-inline-chat" data-ne-inlinechat hidden></div>' +
      '<div class="ne-blockmenu" data-ne-blockmenu hidden></div>' +      /* Task 3.1：画布块动作菜单 */
      '<div class="ne-canvas-dispatch" data-ne-cdispatch hidden></div>' + /* Task 3.1：画布上的 dispatch 气泡 */
      '<div class="ne-ai-dispatch" data-ne-aidispatch hidden></div>' +    /* Task 4.3：块编排 dispatch 鎏金带 */
      '<div class="ne-outlineask" data-ne-outlineask hidden></div>' +    /* Task 3.2：大纲问林三动作菜单 */
      '<div class="ne-scrim" data-ne-scrim></div>';
  }

  /* =====================================================================
   * AI 姿态 1：旁观插话（鎏金建议气泡）
   * ===================================================================*/
  function suggestHtml(text) {
    return '<div class="ne-suggest" data-ne-suggest>' +
      '<div class="ne-suggest__head"><span class="ne-suggest__ava">' + IC.spark(13) + '</span><span class="ne-suggest__label">林 · 在旁观</span></div>' +
      '<p class="ne-suggest__text">' + escapeHtml(text) + '</p>' +
      '<div class="ne-suggest__actions">' +
      '<button class="ne-suggest__btn ne-suggest__btn--primary" data-action="ne-suggest-expand">' + IC.expand(14) + ' 展开</button>' +
      '<button class="ne-suggest__btn" data-action="ne-suggest-rewrite">' + IC.rewrite(14) + ' 重写</button>' +
      '<button class="ne-suggest__btn ne-suggest__btn--ghost" data-action="ne-suggest-dismiss" aria-label="忽略">' + IC.close(14) + '</button>' +
      '</div>' +
      '</div>';
  }

  function maybeShowSuggest() {
    if (!state.suggestOn || state.template !== 'doc') return;
    if (state.suggestActive) return;
    var body = $('[data-ne-docbody]');
    if (!body) return;
    var block = currentEditingBlock();
    if (!block) block = body.lastElementChild || body;
    removeSuggest();
    /* Task 1.2：旁观建议改走 ZX_AI.suggestLine，针对当前段落取材 */
    var paraText = block.textContent || '';
    var text;
    if (window.ZX_AI && window.ZX_AI.suggestLine) {
      text = window.ZX_AI.suggestLine({ paragraph: paraText });
    } else {
      text = SUGGEST_POOL[Math.floor(Math.random() * SUGGEST_POOL.length)];
    }
    var node = el('div');
    node.innerHTML = suggestHtml(text);
    var suggest = node.firstElementChild;
    if (block.parentNode === body) {
      block.parentNode.insertBefore(suggest, block.nextSibling);
    } else {
      body.appendChild(suggest);
    }
    state.suggestActive = true;
  }

  function currentEditingBlock() {
    var sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    var n = sel.anchorNode;
    if (n.nodeType === 3) n = n.parentNode;
    while (n && n !== document) {
      if (n.parentNode && n.parentNode.classList && n.parentNode.classList.contains('ne-doc__body')) return n;
      n = n.parentNode;
    }
    return null;
  }

  function removeSuggest() {
    $all('[data-ne-suggest]').forEach(function (s) { if (s.parentNode) s.parentNode.removeChild(s); });
    state.suggestActive = false;
  }

  function scheduleSuggest() {
    if (state.suggestTimer) clearTimeout(state.suggestTimer);
    removeSuggest();
    if (!state.suggestOn || state.template !== 'doc') return;
    state.suggestTimer = setTimeout(function () { maybeShowSuggest(); }, 2000);
  }

  /* =====================================================================
   * AI 姿态 2：肩并肩共写（鎏金差异色输出）
   * ===================================================================*/
  function insertCowrite(mode) {
    if (state.template !== 'doc') {
      toast('肩并肩共写在「纯文档」模板下体验最佳，切过去试试 ✦');
      return;
    }
    var main = $('.ne-main');
    if (!main) return;
    removeSuggest();
    var anchor = $('[data-ne-docbody]');
    if (!anchor) return;

    var pool = mode === 'rewrite' ? COWRITE_REWRITE : COWRITE_EXPAND;
    /* Task 1.2：共写改走 ZX_AI.cowrite，针对当前段落取材（随机池兜底） */
    var bodyEl = $('[data-ne-docbody]');
    var paraText = bodyEl ? (bodyEl.textContent || '') : '';
    var item;
    if (window.ZX_AI && window.ZX_AI.cowrite) {
      item = window.ZX_AI.cowrite({ mode: mode, paragraph: paraText });
    } else {
      item = pool[Math.floor(Math.random() * pool.length)];
    }

    var wrap = el('div');
    wrap.innerHTML = cowriteHtml(mode, item, true);
    var node = wrap.firstElementChild;

    var lastP = anchor.lastElementChild;
    if (lastP) anchor.insertBefore(node, lastP.nextSibling); else anchor.appendChild(node);
    if (node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'center' });

    /* 1.1s 后由「正在写」切到正文 */
    setTimeout(function () {
      var typing = $('[data-ne-cowrite-typing]', node);
      var text = $('[data-ne-cowrite-text]', node);
      var actions = $('[data-ne-cowrite-actions]', node);
      if (typing) typing.style.display = 'none';
      if (text) text.style.display = '';
      if (actions) actions.style.display = '';
    }, 1100);
  }

  function cowriteHtml(mode, item, showTypingFirst) {
    var diffHtml;
    if (mode === 'rewrite') {
      diffHtml = '<span class="ne-cowrite__del">' + escapeHtml(item.del) + '</span> <span class="ne-cowrite__ins">' + escapeHtml(item.ins) + '</span>';
    } else {
      diffHtml = '<span class="ne-cowrite__ins">' + escapeHtml(item.ins) + '</span>';
    }
    var modeLabel = mode === 'rewrite' ? '重写' : '展开续写';
    return '<div class="ne-cowrite" data-ne-cowrite>' +
      '<div class="ne-cowrite__head"><span class="ne-cowrite__tag">' + IC.spark(11) + ' 林 · 共写</span><span class="ne-cowrite__mode">' + modeLabel + '</span></div>' +
      '<p class="ne-cowrite__text" data-ne-cowrite-text style="display:' + (showTypingFirst ? 'none' : '') + '">' + diffHtml + '</p>' +
      '<div class="ne-cowrite__typing" data-ne-cowrite-typing style="display:' + (showTypingFirst ? '' : 'none') + '"><span>林正在写</span><span class="ne-cowrite__dots"><span></span><span></span><span></span></span></div>' +
      '<div class="ne-cowrite__actions" data-ne-cowrite-actions style="display:' + (showTypingFirst ? 'none' : '') + '">' +
      '<button class="ne-cowrite__btn ne-cowrite__btn--accept" data-action="ne-cowrite-accept">' + IC.check(14) + ' 接受</button>' +
      '<button class="ne-cowrite__btn ne-cowrite__btn--reject" data-action="ne-cowrite-reject">拒绝</button>' +
      '<button class="ne-cowrite__btn ne-cowrite__btn--refine" data-action="ne-cowrite-refine">' + IC.refresh(14) + ' 再改改</button>' +
      '</div>' +
      '</div>';
  }

  function acceptCowrite(btn) {
    var card = btn.closest('[data-ne-cowrite]');
    if (!card) return;
    /* 把 ins 文本落成普通段落 */
    var ins = $('.ne-cowrite__ins', card);
    var text = ins ? ins.textContent : '';
    var p = '<p>' + escapeHtml(text) + '</p>';
    var body = $('[data-ne-docbody]');
    if (body) {
      body.insertAdjacentHTML('beforeend', p);
    }
    state.aiCo = true; /* Task 2.1：标记本次含 AI 协作产出（✦指纹） */
    if (card.parentNode) card.parentNode.removeChild(card);
    updateWordCount();
    toast('已采纳林的续写', true);
  }
  function rejectCowrite(btn) {
    var card = btn.closest('[data-ne-cowrite]');
    if (card && card.parentNode) card.parentNode.removeChild(card);
  }
  function refineCowrite(btn) {
    var card = btn.closest('[data-ne-cowrite]');
    if (!card) return;
    /* 重新换一条差异内容 */
    var mode = $('.ne-cowrite__mode', card);
    var isRewrite = mode && /重写/.test(mode.textContent);
    var pool = isRewrite ? COWRITE_REWRITE : COWRITE_EXPAND;
    var item;
    if (window.ZX_AI && window.ZX_AI.cowrite) {
      var bodyEl = $('[data-ne-docbody]');
      item = window.ZX_AI.cowrite({ mode: isRewrite ? 'rewrite' : 'expand', paragraph: bodyEl ? (bodyEl.textContent || '') : '' });
    } else {
      item = pool[Math.floor(Math.random() * pool.length)];
    }
    var diffHtml = isRewrite
      ? '<span class="ne-cowrite__del">' + escapeHtml(item.del) + '</span> <span class="ne-cowrite__ins">' + escapeHtml(item.ins) + '</span>'
      : '<span class="ne-cowrite__ins">' + escapeHtml(item.ins) + '</span>';
    var text = $('[data-ne-cowrite-text]', card);
    if (text) text.innerHTML = diffHtml;
  }

  /* =====================================================================
   * AI 姿态 3：按需召唤（行内浮动工具栏 + 行内对话框）
   * ===================================================================*/
  function onSelectionChange() {
    if (!state.open) return;
    var tb = $('[data-ne-inlinetb]');
    if (!tb) return;
    var sel = window.getSelection();
    if (!sel || sel.isCollapsed || sel.rangeCount === 0) { hideInlineToolbar(); return; }
    var range = sel.getRangeAt(0);
    /* 仅当选区在 doc 正文 / reader 正文 / outline 节点文本内时显示 */
    var inDoc = rangeIntersectsEl(range, $('[data-ne-docbody]')) || rangeIntersectsEl(range, $('[data-ne-readertext]')) || rangeIntersectsEl(range, $('[data-ne-outnodes]'));
    if (!inDoc) { hideInlineToolbar(); return; }
    state.inlineSelText = sel.toString();
    var rect = range.getBoundingClientRect();
    var main = $('.ne-main');
    if (!main) return;
    var mainRect = main.getBoundingClientRect();
    var left = rect.left - mainRect.left + rect.width / 2 - 70;
    var top = rect.top - mainRect.top - 46;
    left = clamp(left, 4, mainRect.width - 144);
    top = Math.max(4, top);
    tb.style.left = left + 'px';
    tb.style.top = top + 'px';
    tb.hidden = false;
  }
  function rangeIntersectsEl(range, elNode) {
    if (!elNode) return false;
    var elRange = document.createRange();
    elRange.selectNodeContents(elNode);
    return range.compareBoundaryPoints(Range.END_TO_START, elRange) <= 0 &&
           range.compareBoundaryPoints(Range.START_TO_END, elRange) >= 0;
  }
  function hideInlineToolbar() { var tb = $('[data-ne-inlinetb]'); if (tb) tb.hidden = true; }

  function openInlineChat() {
    var chat = $('[data-ne-inlinechat]');
    if (!chat) return;
    var main = $('.ne-main');
    var selText = state.inlineSelText || '（未选中文本）';
    state.inlineChatMsgs = [{ role: 'ai', text: '我看了你选中的内容。要展开、润色、找来源，还是关联其它笔记？', time: nowTime() }];
    chat.innerHTML =
      '<div class="ne-inline-chat__head">' +
      '<span class="ne-inline-chat__ava">' + IC.spark(13) + '</span>' +
      '<span class="ne-inline-chat__title">问林</span>' +
      '<button class="ne-inline-chat__close" data-action="ne-inline-close" aria-label="关闭">' + IC.close(16) + '</button>' +
      '</div>' +
      '<div class="ne-inline-chat__quote">' + escapeHtml(selText) + '</div>' +
      '<div class="ne-inline-chat__msgs" data-ne-chatmsgs>' + renderInlineMsgs() + '</div>' +
      '<div class="ne-inline-chat__input-row">' +
      '<input class="ne-inline-chat__input" data-ne-chatinput placeholder="追问林…" aria-label="追问">' +
      '<button class="ne-inline-chat__send" data-action="ne-inline-send" aria-label="发送">' + IC.send(16) + '</button>' +
      '</div>' +
      '<div class="ne-inline-chat__apply">' +
      '<button class="ne-cowrite__btn ne-cowrite__btn--accept" data-action="ne-inline-apply">' + IC.check(14) + ' 应用到选中</button>' +
      '</div>';
    chat.hidden = false;
    chat.style.top = '88px';
    hideInlineToolbar();
    openScrim();
    var input = $('[data-ne-chatinput]');
    if (input) setTimeout(function () { input.focus(); }, 60);
  }
  function closeInlineChat() { var chat = $('[data-ne-inlinechat]'); if (chat) { chat.hidden = true; chat.innerHTML = ''; } }
  function renderInlineMsgs() {
    return state.inlineChatMsgs.map(function (m) {
      return '<div class="ne-inline-chat__msg ne-inline-chat__msg--' + (m.role === 'ai' ? 'ai' : 'user') + '">' + escapeHtml(m.text) + '</div>';
    }).join('');
  }
  function sendInline() {
    var input = $('[data-ne-chatinput]');
    if (!input) return;
    var text = input.value.trim();
    if (!text) return;
    state.inlineChatMsgs.push({ role: 'user', text: text, time: nowTime() });
    input.value = '';
    renderInlineBox();
    setTimeout(function () {
      state.inlineChatMsgs.push({ role: 'ai', text: mockInlineReply(text + ' ' + state.inlineSelText), time: nowTime() });
      renderInlineBox();
    }, 700);
  }
  function renderInlineBox() {
    var box = $('[data-ne-chatmsgs]');
    if (box) { box.innerHTML = renderInlineMsgs(); box.scrollTop = box.scrollHeight; }
  }
  function applyInlineToSelection() {
    var last = state.inlineChatMsgs.filter(function (m) { return m.role === 'ai'; }).pop();
    if (!last) { toast('林还没有可应用的输出'); return; }
    var sel = window.getSelection();
    if (sel && !sel.isCollapsed && sel.rangeCount) {
      try { sel.deleteFromDocument(); sel.getRangeAt(0).insertNode(document.createTextNode(last.text)); }
      catch (e) { toast('已生成，请手动粘贴'); }
    } else {
      toast('已生成内容：' + last.text.slice(0, 16) + '…');
    }
    closeInlineChat();
    toast('已应用到选中', true);
  }

  /* =====================================================================
   * 斜杠命令菜单（/）与 双链搜索（[[）
   * ===================================================================*/
  var SLASH_ITEMS = [
    { key: 'h2', name: '标题', hint: '##', icon: IC.type },
    { key: 'quote', name: '引用', hint: '>', icon: IC.quote },
    { key: 'code', name: '代码块', hint: '```', icon: IC.code },
    { key: 'image', name: '图片', hint: '![]', icon: IC.image },
    { key: 'hr', name: '分割线', hint: '---', icon: IC.hr }
  ];

  function openSlashMenu(anchor) {
    var menu = $('[data-ne-slash]');
    if (!menu) return;
    menu.innerHTML = SLASH_ITEMS.map(function (it, i) {
      return '<button class="ne-slash__item' + (i === 0 ? ' is-active' : '') + '" data-action="ne-slash-pick" data-key="' + it.key + '">' +
        '<span class="ne-slash__icon">' + it.icon(16) + '</span>' +
        '<span class="ne-slash__name">' + escapeHtml(it.name) + '</span>' +
        '<span class="ne-slash__hint">' + escapeHtml(it.hint) + '</span></button>';
    }).join('');
    positionNear(menu, anchor, 180);
    menu.classList.add('is-open');
    openScrim();
  }

  function insertSlashItem(key) {
    var body = $('[data-ne-docbody]');
    closeAllMenus();
    if (!body) return;
    var html;
    if (key === 'h2') html = '<h2>小标题</h2>';
    else if (key === 'quote') html = '<blockquote>引用一段话…</blockquote>';
    else if (key === 'code') html = '<pre><code>// 代码块\nconst sigma = 1.2e-3;</code></pre>';
    else if (key === 'image') html = '<p>[图片占位 · 点击插入]</p>';
    else html = '<hr>';
    body.insertAdjacentHTML('beforeend', html);
    body.scrollTop = body.scrollHeight;
    updateWordCount();
  }

  function openLinkSearch(query, anchor) {
    var menu = $('[data-ne-linksearch]');
    if (!menu) return;
    var notes = MOCK_NOTES.filter(function (n) { return !query || n.title.indexOf(query) >= 0; });
    if (!notes.length) { closeAllMenus(); return; }
    menu.innerHTML = notes.map(function (n, i) {
      return '<button class="ne-linksearch__item' + (i === 0 ? ' is-active' : '') + '" data-action="ne-link-pick" data-title="' + escapeHtml(n.title) + '">' +
        escapeHtml(n.title) + '<small>' + escapeHtml(n.hint) + '</small></button>';
    }).join('');
    positionNear(menu, anchor, 220);
    menu.classList.add('is-open');
    openScrim();
  }

  function insertWikiLink(title) {
    closeAllMenus();
    var body = $('[data-ne-docbody]');
    if (!body) return;
    /* 插入一个鎏金可点的双链 */
    var node = el('a');
    node.className = 'ne-wikilink';
    node.textContent = '[[' + title + ']]';
    node.setAttribute('contenteditable', 'false');
    var p = el('p');
    p.appendChild(node);
    body.appendChild(p);
    body.scrollTop = body.scrollHeight;
  }

  function positionNear(menu, anchor, width) {
    var rect = anchor ? anchor.getBoundingClientRect() : null;
    var main = $('.ne-main');
    var mainRect = main ? main.getBoundingClientRect() : { left: 0, top: 0, width: 320 };
    menu.style.minWidth = (width || 180) + 'px';
    if (rect) {
      var left = rect.left - mainRect.left;
      var top = rect.bottom - mainRect.top + 6;
      menu.style.left = clamp(left, 4, mainRect.width - (width || 180) - 8) + 'px';
      menu.style.top = top + 'px';
    } else {
      menu.style.left = '16px';
      menu.style.top = '80px';
    }
  }

  function closeAllMenus() {
    $all('.ne-slash.is-open, .ne-linksearch.is-open').forEach(function (m) { m.classList.remove('is-open'); });
    var tm = $('[data-ne-typemenu]'); if (tm) tm.classList.remove('is-open');
    var am = $('[data-ne-addmenu]'); if (am) am.classList.remove('is-open');
    var ap = $('[data-ne-aipanel]'); if (ap) ap.classList.remove('is-open');
    hideBlockMenu(); /* Task 3.1 */
    hideOutlineAskMenu(); /* Task 3.2 */
    hideBlockDispatch(); /* Task 4.3：清理块编排 dispatch 鎏金带 */
    closeScrim();
  }

  /* =====================================================================
   * 顶栏 ✦ AI 设置面板
   * ===================================================================*/
  function openAiPanel() {
    var panel = $('[data-ne-aipanel]');
    if (!panel) return;
    panel.style.top = '6px';
    var poses = [
      { n: '1', name: '旁观插话', desc: '你停笔 2 秒，林轻声给一句建议，不打断你。' },
      { n: '2', name: '肩并肩共写', desc: '你点「展开/重写」或长按 ✦，林以鎏金差异色续写，你可接受或拒绝。' },
      { n: '3', name: '按需召唤', desc: '选中文字唤出工具栏，点「问林」打开行内对话，不离开笔记。' }
    ];
    panel.innerHTML =
      '<h3 class="ne-ai-panel__title">' + IC.spark(15) + ' 林的三种协作姿态</h3>' +
      poses.map(function (p) {
        return '<div class="ne-ai-panel__pose"><span class="ne-ai-panel__pose-num">' + p.n + '</span>' +
          '<div><div class="ne-ai-panel__pose-name">' + escapeHtml(p.name) + '</div>' +
          '<div class="ne-ai-panel__pose-desc">' + escapeHtml(p.desc) + '</div></div></div>';
      }).join('') +
      '<div class="ne-ai-panel__toggle"><span class="ne-ai-panel__toggle-label">旁观插话</span>' +
      '<button class="ne-switch' + (state.suggestOn ? ' is-on' : '') + '" data-action="ne-toggle-suggest" aria-label="开关旁观插话" role="switch" aria-checked="' + (state.suggestOn ? 'true' : 'false') + '"></button></div>';
    panel.classList.add('is-open');
    openScrim();
  }

  /* =====================================================================
   * Toast（复用 notebook 的 [data-toast]）
   * ===================================================================*/
  var toastTimer = null;
  function toast(msg, withSpark) {
    var t = document.querySelector('[data-toast]');
    if (!t) return;
    t.classList.remove('nb-toast--undo');
    t.innerHTML = (withSpark ? '<span class="nb-toast__spark">' + IC.spark(14) + '</span>' : '') + '<span>' + escapeHtml(msg) + '</span>';
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 1900);
  }

  /* =====================================================================
   * 遮罩
   * ===================================================================*/
  function openScrim() { var s = $('[data-ne-scrim]'); if (s) s.classList.add('is-open'); }
  function closeScrim() { var s = $('[data-ne-scrim]'); if (s) s.classList.remove('is-open'); }

  /* =====================================================================
   * 分享面板
   * ===================================================================*/
  function openSharePanel() {
    closeSharePanel();
    /* 复用 mock 里的真实好友列表（u-shenyan 等），分享到 1对1 好友聊天 */
    var mockData = (window.ZX_MOCK || (window.ZX && window.ZX.mock) || { users: [] });
    var allUsers = (mockData.users || []).filter(function (u) { return u.id !== 'u-me'; });
    /* 取前 6 个好友作为分享对象 */
    var friends = allUsers.slice(0, 6).map(function (u) {
      return {
        id: u.id,
        name: u.name,
        initials: u.initials || (u.name || '?').slice(0, 1),
        color: u.avatarColor || '#1D5B7A',
        sub: u.domain || (u.tags && u.tags[0]) || ''
      };
    });
    var friendList = friends.map(function (f) {
      return '<button class="ne-share__item" data-action="ne-share-to" data-to="' + f.id + '" data-name="' + escapeHtml(f.name) + '">' +
        '<span class="ne-share__avatar" style="background:' + f.color + '">' + escapeHtml(f.initials) + '</span>' +
        '<span class="ne-share__name">' + escapeHtml(f.name) + (f.sub ? '<span class="ne-share__sub">' + escapeHtml(f.sub) + '</span>' : '') + '</span>' +
        '</button>';
    }).join('');
    var groupList = '';

    var scrim = el('div', 'ne-share-scrim');
    scrim.setAttribute('data-share-scrim', '');
    scrim.onclick = closeSharePanel;
    var panel = el('div', 'ne-share');
    panel.innerHTML =
      '<div class="ne-share__handle"></div>' +
      '<h3 class="ne-share__title">分享笔记</h3>' +
      '<p class="ne-share__note-name">「' + escapeHtml(state.title || '无标题笔记') + '」</p>' +
      '<div class="ne-share__section"><h4 class="ne-share__label">选择聊天</h4>' + friendList + '</div>' +
      (groupList ? '<div class="ne-share__section"><h4 class="ne-share__label">群聊</h4>' + groupList + '</div>' : '');
    /* 追加到手机壳容器（.zx-phone），用 absolute 定位，确保大小和定位正确 */
    var phoneShell = document.querySelector('.zx-phone') || document.body;
    phoneShell.appendChild(scrim);
    phoneShell.appendChild(panel);
    /* 给分享项绑定独立点击（不依赖事件委托） */
    panel.querySelectorAll('[data-action="ne-share-to"]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        sendShareTo(btn.getAttribute('data-to'), btn.getAttribute('data-name'));
      });
    });
  }
  function closeSharePanel() {
    var s = document.querySelector('[data-share-scrim]');
    if (s) s.parentNode.removeChild(s);
    var p = document.querySelector('.ne-share');
    if (p) p.parentNode.removeChild(p);
  }
  function sendShareTo(peerId, name) {
    closeSharePanel();
    var noteTitle = state.title || '无标题笔记';
    var noteId = state.currentNoteId || ('share-' + Date.now());
    /* 调用 friends 暴露的 API：切到好友 tab → 打开 1对1 聊天 → 追加笔记分享卡片 */
    if (window.ZX_FRIENDS && typeof window.ZX_FRIENDS.shareNoteToPeer === 'function') {
      window.ZX_FRIENDS.shareNoteToPeer(peerId, noteTitle, noteId);
      /* 关闭编辑器（延迟，让 friends tab 切换先发生） */
      setTimeout(function () {
        if (typeof close === 'function') close();
      }, 100);
    } else {
      toast('已分享给「' + name + '」', true);
    }
  }

  /* =====================================================================
   * 字数统计 / 重命名
   * ===================================================================*/
  function updateWordCount() {
    var body = $('[data-ne-docbody]');
    var wc = $('[data-ne-wordcount]');
    if (!body || !wc) return;
    var n = (body.textContent || '').replace(/\s+/g, '').length;
    wc.textContent = n + ' 字';
  }

  function enterRename(btn) {
    var titleEl = $('[data-ne-title]', btn);
    if (!titleEl) return;
    var input = el('input');
    input.className = 'ne-topbar__title-input';
    input.value = state.title;
    input.setAttribute('aria-label', '笔记标题');
    btn.replaceChild(input, titleEl);
    input.focus();
    input.select();
    function commit() {
      state.title = input.value.trim() || '无标题笔记';
      var newTitle = el('span', 'ne-topbar__title', escapeHtml(state.title));
      newTitle.setAttribute('data-ne-title', '');
      if (input.parentNode) btn.replaceChild(newTitle, input);
    }
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); input.blur(); } });
  }

  /* =====================================================================
   * doc 正文：input 监听（停顿建议 / 斜杠 / 双链 / 字数）
   * ===================================================================*/
  function onDocInput() {
    updateWordCount();
    scheduleSuggest();
    detectSlashOrLink();
  }

  function detectSlashOrLink() {
    var body = $('[data-ne-docbody]');
    if (!body) return;
    var sel = window.getSelection();
    if (!sel || !sel.anchorNode) return;
    var node = sel.anchorNode;
    var text = node.nodeType === 3 ? node.textContent.slice(0, sel.anchorOffset) : '';
    /* 斜杠：行首或空格后紧接 / */
    var slash = text.match(/(?:^|\s)\/([^/\s]{0,12})$/);
    var lk = text.match(/\[\[([^\]]{0,16})$/);
    closeAllMenus();
    if (slash) {
      openSlashMenu(getCaretAnchor());
    } else if (lk) {
      openLinkSearch(lk[1], getCaretAnchor());
    }
  }

  function getCaretAnchor() {
    var sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return null;
    var range = sel.getRangeAt(0).cloneRange();
    try { range.collapse(true); var rect = range.getClientRects()[0] || range.getBoundingClientRect(); return { getBoundingClientRect: function () { return rect; } }; }
    catch (e) { return null; }
  }

  /* =====================================================================
   * canvas 交互：平移 / 缩放 / 选块 / 拖块 / 连线 / 长按加块
   * ===================================================================*/
  function bindCanvas() {
    var canvas = $('[data-ne-canvas]');
    if (!canvas || canvas.__zxCanvasBound) { applyCanvasTransform(); renderBlocks(); return; }
    canvas.__zxCanvasBound = true;

    var pan = null;
    var blockDrag = null;
    var linking = null;
    var pressTimer = null;
    var pressStart = null;
    var moved = false;
    var lastTap = { id: null, time: 0 };
    var editingBlock = null;

    function pt(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }
    function toCanvasCoord(clientX, clientY) {
      var r = canvas.getBoundingClientRect();
      return { x: (clientX - r.left - state.canvas.panX) / state.canvas.scale, y: (clientY - r.top - state.canvas.panY) / state.canvas.scale };
    }

    function down(e) {
      var portEl = e.target.closest('[data-port]');
      if (portEl) {
        linking = { from: parseInt(portEl.getAttribute('data-block'), 10) };
        canvas.classList.add('is-linking');
        if (e.cancelable) e.preventDefault();
        return;
      }
      var blockEl = e.target.closest('[data-block]');
      if (blockEl) {
        var id = parseInt(blockEl.getAttribute('data-block'), 10);
        /* 如果正在编辑这个块，不拦截（让 contenteditable 正常工作） */
        if (editingBlock === id && e.target.closest('.ne-block__content')) {
          return;
        }
        /* 双击检测：同一块 300ms 内两次点击 → 进入编辑 */
        var now = Date.now();
        if (lastTap.id === id && (now - lastTap.time) < 300) {
          lastTap = { id: null, time: 0 };
          enterBlockEdit(id);
          editingBlock = id;
          if (e.cancelable) e.preventDefault();
          return;
        }
        lastTap = { id: id, time: now };
        /* 单击：选中 + 准备拖拽 */
        selectBlock(id);
        var b = blockById(id);
        var p = pt(e);
        blockDrag = { id: id, startX: p.x, startY: p.y, ox: b.x, oy: b.y };
        if (e.cancelable) e.preventDefault();
        return;
      }
      /* 空白处：退出块编辑 + 平移 + 长按加块 */
      if (editingBlock != null) {
        exitBlockEdit(editingBlock);
        editingBlock = null;
      }
      var p2 = pt(e);
      pressStart = p2; moved = false;
      pan = { x: p2.x, y: p2.y, panX: state.canvas.panX, panY: state.canvas.panY };
      canvas.classList.add('is-panning');
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        if (!moved && pressStart) {
          var c = toCanvasCoord(pressStart.x, pressStart.y);
          openCanvasAddMenu(c.x, c.y);
        }
      }, 500);
    }
    function move(e) {
      var p = pt(e);
      if (linking) { if (e.cancelable) e.preventDefault(); return; }
      if (blockDrag) {
        var b = blockById(blockDrag.id);
        if (b) {
          b.x = Math.round(blockDrag.ox + (p.x - blockDrag.startX) / state.canvas.scale);
          b.y = Math.round(blockDrag.oy + (p.y - blockDrag.startY) / state.canvas.scale);
          var elDom = canvas.querySelector('[data-block="' + b.id + '"]');
          if (elDom) { elDom.style.left = b.x + 'px'; elDom.style.top = b.y + 'px'; }
          renderLinks();
        }
        if (e.cancelable) e.preventDefault();
        return;
      }
      /* 双指捏合缩放 */
      if (pan && e.touches && e.touches.length === 2) {
        var dx = e.touches[0].clientX - e.touches[1].clientX;
        var dy = e.touches[0].clientY - e.touches[1].clientY;
        var d = Math.hypot(dx, dy);
        if (pan.pinchD == null) pan.pinchD = d;
        else { zoomBy((d - pan.pinchD) / 240); pan.pinchD = d; }
        if (e.cancelable) e.preventDefault();
        return;
      }
      if (pan) {
        if (pressStart && (Math.abs(p.x - pressStart.x) > 8 || Math.abs(p.y - pressStart.y) > 8)) {
          moved = true;
          if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        }
        state.canvas.panX = pan.panX + (p.x - pan.x);
        state.canvas.panY = pan.panY + (p.y - pan.y);
        applyCanvasTransform();
        if (e.cancelable) e.preventDefault();
      }
    }
    function up(e) {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      if (linking) {
        var p = pt(e);
        var target = document.elementFromPoint(p.x, p.y);
        var tb = target ? target.closest('[data-block]') : null;
        if (tb) {
          var toId = parseInt(tb.getAttribute('data-block'), 10);
          if (toId !== linking.from && !linkExists(linking.from, toId)) {
            state.canvas.links.push({ from: linking.from, to: toId });
            renderLinks();
          }
        }
        linking = null;
        canvas.classList.remove('is-linking');
      }
      blockDrag = null;
      if (pan) { pan = null; canvas.classList.remove('is-panning'); }
      pressStart = null;
    }
    function wheel(e) {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      var delta = e.deltaY > 0 ? -0.1 : 0.1;
      zoomBy(delta);
    }

    canvas.addEventListener('touchstart', down, { passive: false });
    canvas.addEventListener('touchmove', move, { passive: false });
    canvas.addEventListener('touchend', up);
    canvas.addEventListener('mousedown', down);
    document.addEventListener('mousemove', move);
    document.addEventListener('mouseup', up);
    canvas.addEventListener('wheel', wheel, { passive: false });

    /* 块编辑失焦监听：用事件委托，检测 contenteditable 块失焦 */
    canvas.addEventListener('blur', function (e) {
      var t = e.target;
      if (t && t.classList && t.classList.contains('ne-block__content') && t.getAttribute('contenteditable') === 'true') {
        var bid = parseInt(t.getAttribute('data-ne-blockcontent'), 10);
        exitBlockEdit(bid);
        if (editingBlock === bid) editingBlock = null;
      }
    }, true);

    applyCanvasTransform();
    renderBlocks();
  }

  function blockById(id) { for (var i = 0; i < state.canvas.blocks.length; i++) { if (state.canvas.blocks[i].id === id) return state.canvas.blocks[i]; } return null; }
  function linkExists(a, b) { return state.canvas.links.some(function (l) { return (l.from === a && l.to === b) || (l.from === b && l.to === a); }); }
  function selectBlock(id) {
    state.canvas.selected = id;
    $all('[data-block]').forEach(function (b) { b.classList.toggle('is-selected', parseInt(b.getAttribute('data-block'), 10) === id); });
    /* Task 3.1：选中块后浮现块动作菜单（含 ✦ 归纳） */
    if (id != null) {
      showBlockMenu(id);
    }
  }
  function zoomBy(delta) {
    state.canvas.scale = clamp(+(state.canvas.scale + delta).toFixed(2), 0.4, 2.4);
    applyCanvasTransform();
  }
  function openCanvasAddMenu(x, y) {
    var menu = $('[data-ne-addmenu]');
    if (!menu) return;
    menu.style.left = clamp(x * state.canvas.scale + state.canvas.panX, 4, 240) + 'px';
    menu.style.top = clamp(y * state.canvas.scale + state.canvas.panY, 4, 480) + 'px';
    menu.__addAt = { x: x, y: y };
    menu.classList.add('is-open');
    openScrim();
  }
  function addBlockAt(type) {
    var menu = $('[data-ne-addmenu]');
    var at = menu && menu.__addAt ? menu.__addAt : { x: 60, y: 60 };
    closeAllMenus();
    var id = state.canvas.nextId++;
    var sample = ({
      text: '新文本块',
      evidence: '新证据 · 补充数据',
      code: '// 代码\nconst x = 1;',
      link: '[[界面阻抗分析]]'
    })[type] || '新块';
    var b = { id: id, x: Math.round(at.x), y: Math.round(at.y), type: type, title: '', text: sample };
    state.canvas.blocks.push(b);
    renderBlocks();
    selectBlock(id);
  }

  /* =====================================================================
   * Task 3.1：canvas AI —— 归纳主题 / 总结全画布 / 帮我连线
   * 统一范式：dispatch 鎏金色带（画布上方）→ 鎏金 aiCo 块 + 自动赤陶虚线 → 可撤销
   * ===================================================================*/

  /* 块间关键词重叠打分，找与 seed 语义相关的块（林"自己找"） */
  function blockKeywords(b) {
    var t = String((b && b.text) || '');
    var all = ['阻抗','界面','LiNbO','涂层','硫化物','Li6PS5Cl','Li₆PS₅Cl','电导率','电解质',
      '氧化物','LLZO','测量','四电极','两电极','EIS','数据','n=','路线','量产','中试','论证','观点','证据'];
    var hit = [];
    for (var i = 0; i < all.length; i++) { if (t.indexOf(all[i]) >= 0) hit.push(all[i]); }
    return hit;
  }
  function relatedBlocks(seedId, maxN) {
    var seed = blockById(seedId);
    if (!seed) return [];
    var kw = blockKeywords(seed);
    if (!kw.length) return [];
    var out = [];
    for (var i = 0; i < state.canvas.blocks.length; i++) {
      var b = state.canvas.blocks[i];
      if (b.id === seedId) continue;
      var overlap = blockKeywords(b).filter(function (k) { return kw.indexOf(k) >= 0; }).length;
      if (overlap > 0) out.push({ id: b.id, score: overlap });
    }
    out.sort(function (a, b2) { return b2.score - a.score; });
    return out.slice(0, maxN || 3).map(function (x) { return x.id; });
  }

  /* 画布上的 dispatch 气泡（pending → done → 回调产出） */
  function showCanvasDispatch(agentId, query, label, onDone) {
    var box = $('[data-ne-cdispatch]');
    if (!box) { if (onDone) onDone(); return; }
    box.hidden = false;
    box.classList.add('is-show');
    var m = { agentId: agentId, status: 'pending', expanded: true, userText: query };
    function paint() {
      box.innerHTML = '<div class="ne-cdispatch__label">' + IC.spark(13) + ' ' + escapeHtml(label) + '</div>' +
        (window.ZX_DISPATCH ? window.ZX_DISPATCH.render(m) : '');
    }
    paint();
    window.setTimeout(function () {
      m.status = 'done';
      m.result = window.ZX_DISPATCH ? window.ZX_DISPATCH.result(agentId, query) : { items: [], duration: '1.0s', resultCount: 0, query: query };
      paint();
      window.setTimeout(function () {
        box.hidden = true;
        box.classList.remove('is-show');
        box.innerHTML = '';
        if (onDone) onDone(m.result);
      }, 900);
    }, 1200);
  }

  /* 画布 AI 撤销快照 */
  function pushCanvasUndo(label, undoFn) {
    state._canvasUndo = state._canvasUndo || [];
    state._canvasUndo.push({ label: label, fn: undoFn });
    showAiUndoToast('撤销林的' + label);
  }
  function showAiUndoToast(label, action) {
    var t = document.querySelector('[data-toast]');
    if (!t) return;
    var act = action || 'ne-undo-canvas';
    t.classList.remove('is-show');
    t.innerHTML = '<button class="nb-toast__undo" data-action="' + act + '" aria-label="' + escapeHtml(label) + '">↶ ' + escapeHtml(label) + '</button>';
    t.classList.add('is-show', 'nb-toast--undo');
    if (state._aiUndoTimer) clearTimeout(state._aiUndoTimer);
    state._aiUndoTimer = setTimeout(function () { t.classList.remove('is-show', 'nb-toast--undo'); t.innerHTML = ''; }, 5000);
  }
  function undoLastCanvas() {
    if (!state._canvasUndo || !state._canvasUndo.length) { toast('没有可撤销的操作'); return; }
    var last = state._canvasUndo.pop();
    try { last.fn(); renderBlocks(); } catch (e) {}
    toast('已撤销林的' + last.label);
  }

  /* ① 选中块 → ✦ 归纳这个主题（林自找相关块 → 生成观点块 + 连线） */
  function summarizeTheme(blockId) {
    var b = blockById(blockId);
    if (!b) return;
    showCanvasDispatch('summary', b.text, '归纳这个主题', function (res) {
      var id = state.canvas.nextId++;
      var txt = (res && res.items && res.items.length) ? res.items[0] : '归纳：' + String(b.text).slice(0, 20);
      /* 找空位放置新块（避让现有块） */
      var pos = findFreePosition(b.x, b.y, 180, 100);
      var nb = { id: id, x: pos.x, y: pos.y, type: 'evidence', title: '林·归纳', text: txt, aiCo: true };
      state.canvas.blocks.push(nb);
      /* 只连原块，不连相关块（避免连线混乱） */
      state.canvas.links.push({ from: blockId, to: id });
      state.aiCo = true;
      renderBlocks();
      pushCanvasUndo('归纳', function () {
        state.canvas.blocks = state.canvas.blocks.filter(function (x) { return x.id !== id; });
        state.canvas.links = state.canvas.links.filter(function (l) { return !(l.from === blockId && l.to === id); });
      });
    });
  }

  /* ② 长按空白 → ✦ 总结全画布（扫所有块 → 中央生成总结块） */
  function summarizeCanvas() {
    closeAllMenus();
    var allText = state.canvas.blocks.map(function (b) { return b.text; }).join(' ');
    showCanvasDispatch('summary', allText, '总结全画布', function (res) {
      var id = state.canvas.nextId++;
      var txt = (res && res.items && res.items.length) ? res.items.slice(0, 2).join('；') : '已归纳现有块的核心论点。';
      /* 找空位放置总结块 */
      var pos = findFreePosition(60, 60, 200, 80);
      state.canvas.blocks.push({ id: id, x: pos.x, y: pos.y, type: 'text', title: '林·总结', text: txt, aiCo: true });
      state.aiCo = true;
      renderBlocks();
      pushCanvasUndo('总结', function () {
        state.canvas.blocks = state.canvas.blocks.filter(function (x) { return x.id !== id; });
      });
    });
  }

  /* ③ ✦ 帮我连线（分析块语义 → 最多加 3 条相关连线，可撤销） */
  function aiLinkBlocks() {
    var added = [];
    var maxLinks = 3;
    for (var i = 0; i < state.canvas.blocks.length && added.length < maxLinks; i++) {
      var relIds = relatedBlocks(state.canvas.blocks[i].id, 1);
      for (var j = 0; j < relIds.length && added.length < maxLinks; j++) {
        var a = state.canvas.blocks[i].id, b2 = relIds[j];
        if (!linkExists(a, b2)) { state.canvas.links.push({ from: a, to: b2 }); added.push({ from: a, to: b2 }); }
      }
    }
    if (!added.length) { toast('林没找到新的可连线关系'); return; }
    state.aiCo = true;
    renderLinks();
    pushCanvasUndo('连线', function () {
      state.canvas.links = state.canvas.links.filter(function (l) { return added.indexOf(l) < 0; });
    });
    toast('林连了 ' + added.length + ' 条关系');
  }

  /* 在画布上找一个空位放置新块（避让现有块） */
  function findFreePosition(srcX, srcY, offsetX, offsetY) {
    var bw = 160, bh = 60; /* 块的近似尺寸 */
    var candidates = [
      { x: srcX + offsetX, y: srcY },
      { x: srcX + offsetX, y: srcY + offsetY },
      { x: srcX + offsetX, y: srcY - offsetY },
      { x: srcX - offsetX - bw, y: srcY },
      { x: srcX - offsetX - bw, y: srcY + offsetY },
      { x: srcX, y: srcY + offsetY + bh },
      { x: srcX, y: srcY - offsetY - bh },
      { x: srcX + offsetX + bw, y: srcY + offsetY }
    ];
    for (var i = 0; i < candidates.length; i++) {
      var c = candidates[i];
      if (c.x < 0) c.x = 10;
      if (c.y < 0) c.y = 10;
      var overlap = false;
      for (var j = 0; j < state.canvas.blocks.length; j++) {
        var b = state.canvas.blocks[j];
        if (b.id === srcX) continue;
        if (Math.abs(b.x - c.x) < bw && Math.abs(b.y - c.y) < bh) { overlap = true; break; }
      }
      if (!overlap) return c;
    }
    /* 全部重叠时，用螺旋偏移 */
    return { x: srcX + offsetX + 40, y: srcY + 40 };
  }

  /* 块动作菜单（选中块时浮现） */
  function showBlockMenu(blockId) {
    var menu = $('[data-ne-blockmenu]');
    if (!menu) return;
    var b = blockById(blockId);
    if (!b) return;
    var left = b.x + 130, top = b.y;
    menu.__forBlock = blockId;
    menu.innerHTML =
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-canvas-summarize-theme">' + IC.spark(14) + ' 归纳这个主题</button>';
    menu.style.left = clamp(left * state.canvas.scale + state.canvas.panX, 4, 200) + 'px';
    menu.style.top = clamp(top * state.canvas.scale + state.canvas.panY, 4, 460) + 'px';
    menu.hidden = false;
    menu.classList.add('is-show');
  }
  function hideBlockMenu() { var m = $('[data-ne-blockmenu]'); if (m) { m.hidden = true; m.classList.remove('is-show'); m.innerHTML = ''; } }

  /* =====================================================================
   * Task 2.3：spec 块浮动菜单（上移/下移/斜杠命令/✦ AI 编排）
   * 复用 [data-ne-blockmenu] DOM；选中块或空位时浮动出现
   * ===================================================================*/
  function showSpecBlockMenu(blockId, anchorEl) {
    var menu = $('[data-ne-blockmenu]');
    if (!menu) return;
    var r = findSpecBlock(blockId);
    if (!r || !r.block) return;
    /* 顶端块/末尾块禁用对应方向按钮（视觉提示用 is-disabled） */
    var arr = r.parentChildren;
    var canUp = arr && r.idx > 0;
    var canDown = arr && r.idx >= 0 && r.idx < (arr.length - 1);
    menu.__forSpecBlock = blockId;
    menu.innerHTML =
      '<button class="ne-blockmenu__item' + (canUp ? '' : ' is-disabled') + '" data-action="ne-block-up"' + (canUp ? '' : ' disabled') + '>' + IC.up(14) + ' 上移</button>' +
      '<button class="ne-blockmenu__item' + (canDown ? '' : ' is-disabled') + '" data-action="ne-block-down"' + (canDown ? '' : ' disabled') + '>' + IC.down(14) + ' 下移</button>' +
      '<button class="ne-blockmenu__item" data-action="ne-block-slash">' + IC.slash(14) + ' 斜杠命令</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-block-ai">' + IC.spark(14) + ' ✦ AI 编排</button>';
    /* 定位：以 anchorEl 的 boundingRect 为准（相对 .ne-main） */
    var main = $('.ne-main');
    var mainRect = main ? main.getBoundingClientRect() : { left: 0, top: 0, width: 320 };
    var rect = anchorEl ? anchorEl.getBoundingClientRect() : null;
    if (rect) {
      var left = rect.right - mainRect.left + 6;
      var top = rect.top - mainRect.top;
      menu.style.left = clamp(left, 4, mainRect.width - 176) + 'px';
      menu.style.top = clamp(top, 4, 480) + 'px';
    } else {
      menu.style.left = '16px';
      menu.style.top = '88px';
    }
    menu.hidden = false;
    menu.classList.add('is-show');
    state.selectedSpecBlockId = blockId;
  }
  function hideSpecBlockMenu() { var m = $('[data-ne-blockmenu]'); if (m) { m.hidden = true; m.classList.remove('is-show'); m.innerHTML = ''; m.__forSpecBlock = null; } }

  /* =====================================================================
   * Task 4.2 / 4.3：AI 编排形式（块树 delta）—— 块级浮动菜单入口 + dispatch 鎏金带
   * 编排对象是块树结构（非正文文字）；正文文字仍走三姿态（不动）
   * 链路：✦ AI 编排 → 子菜单(5 动作) → composeBlocks 取 delta → showBlockDispatch
   *       → pending(重排中) → done(预览+应用/拒绝) → 应用(applyBlockDelta + 重渲染 + 撤销 toast)
   * ===================================================================*/
  /* ✦ AI 编排子菜单：复用 [data-ne-blockmenu]，替换内容为 5 个编排动作 */
  function showAiArrangeMenu(blockId, anchorEl) {
    var menu = $('[data-ne-blockmenu]');
    if (!menu) return;
    state.selectedSpecBlockId = blockId;
    menu.__forSpecBlock = blockId;
    menu.innerHTML =
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-wrap">' + IC.spark(14) + ' 套个证据卡</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-rearrange">' + IC.spark(14) + ' 改成双栏</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-restyle">' + IC.spark(14) + ' 换布局</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-suggest">' + IC.spark(14) + ' 林建议布局</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-compose">' + IC.spark(14) + ' 生成对比页</button>';
    /* 定位：沿用 showSpecBlockMenu 的锚点逻辑 */
    var main = $('.ne-main');
    var mainRect = main ? main.getBoundingClientRect() : { left: 0, top: 0, width: 320 };
    var rect = anchorEl ? anchorEl.getBoundingClientRect() : null;
    if (rect) {
      var left = rect.right - mainRect.left + 6;
      var top = rect.top - mainRect.top;
      menu.style.left = clamp(left, 4, mainRect.width - 176) + 'px';
      menu.style.top = clamp(top, 4, 480) + 'px';
    } else {
      menu.style.left = '16px';
      menu.style.top = '88px';
    }
    menu.hidden = false;
    menu.classList.add('is-show');
  }

  /* 换布局子菜单：callout / cols / grid 三个子选项 + 返回 */
  function showAiRestyleMenu(blockId, anchorEl) {
    var menu = $('[data-ne-blockmenu]');
    if (!menu) return;
    state.selectedSpecBlockId = blockId;
    menu.__forSpecBlock = blockId;
    menu.innerHTML =
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-restyle" data-restype="callout">' + IC.spark(14) + ' 证据卡 callout</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-restyle" data-restype="cols">' + IC.spark(14) + ' 双栏 cols</button>' +
      '<button class="ne-blockmenu__item ne-blockmenu__item--ai" data-action="ne-ai-restyle" data-restype="grid">' + IC.spark(14) + ' 网格 grid</button>' +
      '<button class="ne-blockmenu__item" data-action="ne-ai-back">' + IC.chevL(14) + ' 返回</button>';
    menu.hidden = false;
    menu.classList.add('is-show');
  }

  /* 触发某个编排 intent：计算 anchorSpec/anchorText → composeBlocks → dispatch 鎏金带 */
  function runAiArrange(intent, newType) {
    var blockId = state.selectedSpecBlockId;
    var r = blockId ? findSpecBlock(blockId) : null;
    var block = (r && r.block) ? r.block : null;
    /* anchorSpec 按 intent 选择：wrap/restyle 用选中块；rearrange 用其所在 section；suggest/compose 用整棵 spec */
    var anchorSpec, anchorText = '';
    if (intent === 'wrap' || intent === 'restyle') {
      anchorSpec = block || state.spec;
      if (block && block.text) anchorText = String(block.text).replace(/<[^>]+>/g, '').slice(0, 40);
    } else if (intent === 'rearrange') {
      var sec = (r && r.parent && r.parent.children && r.parent.children.length) ? r.parent : state.spec;
      anchorSpec = sec;
    } else {
      anchorSpec = state.spec;
    }
    if (!anchorSpec) { toast('没有可编排的内容'); return; }

    if (!window.ZX_AI || !window.ZX_AI.composeBlocks) { toast('林还在准备编排能力…'); return; }
    var delta = window.ZX_AI.composeBlocks({
      intent: intent,
      anchorSpec: anchorSpec,
      anchorText: anchorText,
      newType: newType
    });
    var labelMap = { wrap: '套证据卡', rearrange: '改成双栏', restyle: '换布局', suggest: '建议布局', compose: '生成对比页' };
    showBlockDispatch(labelMap[intent] || '编排布局', delta, null);
  }

  /* dispatch 鎏金带：pending(重排中+转圈) → done(预览+应用/拒绝)
   * 复用 showCanvasDispatch 的 pending→done 范式，但产出是块树 delta（非文字） */
  function showBlockDispatch(label, delta, onAccept) {
    var box = $('[data-ne-aidispatch]');
    if (!box) { /* 无浮层兜底：直接应用 */ if (delta && onAccept) onAccept(delta); return; }
    /* 先丢弃上一条待定 delta */
    state._pendingBlockDelta = null;
    state._pendingBlockAccept = null;
    box.hidden = false;
    box.classList.add('is-show');
    /* pending 状态 */
    box.innerHTML =
      '<div class="ne-aidispatch__band">' +
        '<span class="ne-aidispatch__icon">' + IC.spark(14) + '</span>' +
        '<span class="ne-aidispatch__text">林正在重排布局…</span>' +
        '<span class="ne-aidispatch__spinner"><span></span><span></span><span></span></span>' +
      '</div>';
    window.setTimeout(function () {
      /* done 状态：展示预览 + 应用/拒绝 */
      box.innerHTML =
        '<div class="ne-aidispatch__band ne-aidispatch__band--done">' +
          '<span class="ne-aidispatch__icon">' + IC.spark(14) + '</span>' +
          '<span class="ne-aidispatch__preview">' + escapeHtml((delta && delta.preview) || '林完成了编排') + '</span>' +
          '<button class="ne-aidispatch__btn ne-aidispatch__btn--accept" data-action="ne-ai-accept">' + IC.check(13) + ' 应用</button>' +
          '<button class="ne-aidispatch__btn ne-aidispatch__btn--reject" data-action="ne-ai-reject">✗ 拒绝</button>' +
        '</div>';
      state._pendingBlockDelta = delta;
      state._pendingBlockAccept = onAccept;
    }, 1100);
  }

  function hideBlockDispatch() {
    var box = $('[data-ne-aidispatch]');
    if (box) { box.hidden = true; box.classList.remove('is-show'); box.innerHTML = ''; }
  }

  /* 应用待定 delta 到 spec 树：先 sync 文字编辑 → 存快照 → 执行 ops → 重渲染 → 撤销 toast */
  function acceptPendingBlockDelta() {
    var delta = state._pendingBlockDelta;
    var onAccept = state._pendingBlockAccept;
    hideBlockDispatch();
    if (!delta) { toast('没有待应用的编排'); return; }
    var snapshot = applyBlockDelta(delta);
    state._aiBlockUndo = { snapshot: snapshot, delta: delta };
    state._pendingBlockDelta = null;
    state._pendingBlockAccept = null;
    rerenderSpecIntoTemplate();
    state.aiCo = true; /* ✦ 指纹：本次含 AI 编排产出 */
    toast('已应用林的编排', true);
    showAiUndoToast('撤销林的编排', 'ne-undo-ai-block');
    if (typeof onAccept === 'function') onAccept(delta);
  }

  function rejectPendingBlockDelta() {
    hideBlockDispatch();
    state._pendingBlockDelta = null;
    state._pendingBlockAccept = null;
    toast('已拒绝林的编排');
  }

  /* 把 delta.ops 应用到 state.spec，返回应用前的 spec 快照（供 undo） */
  function applyBlockDelta(delta) {
    syncSpecFromDom(); /* 先把 contenteditable 内的正文编辑写回 spec，避免重渲染丢失输入 */
    var snapshot = state.spec ? JSON.parse(JSON.stringify(state.spec)) : null;
    if (delta && delta.ops) {
      for (var i = 0; i < delta.ops.length; i++) applyBlockOp(delta.ops[i]);
    }
    return snapshot;
  }

  /* 单个结构操作执行器（wrap/rearrange/restyle/suggest/compose） */
  function applyBlockOp(op) {
    if (!op || !op.op) return;
    if (op.op === 'wrap') {
      var wr = findSpecBlock(op.targetId);
      if (!wr || !wr.parentChildren) return;
      var wrap = op.wrapWith || { id: _specId('co'), type: 'callout', children: [] };
      wrap.children = [wr.block];
      wr.parentChildren[wr.idx] = wrap;
    } else if (op.op === 'rearrange') {
      /* 收集 moveIds 的块引用，记录首个位置；从树中移除；前一半进左栏，后一半进右栏；插回原位 */
      var gathered = [];
      var firstParent = null, firstIdx = -1;
      (op.moveIds || []).forEach(function (mid) {
        var rr = findSpecBlock(mid);
        if (rr && rr.block) {
          gathered.push(rr.block);
          if (firstIdx < 0 && rr.parentChildren) { firstParent = rr.parentChildren; firstIdx = rr.idx; }
        }
      });
      /* 从 state.spec 中按 id 移除 moveIds */
      removeBlockIds(op.moveIds || []);
      var half = Math.ceil(gathered.length / 2);
      var newParent = op.newParent || { id: _specId('cols'), type: 'cols', cols: [[], []] };
      newParent.cols = [gathered.slice(0, half), gathered.slice(half)];
      /* 插回首个被移除块的原位置；找不到则落到根 section 末尾 */
      if (firstParent) {
        var ins = Math.max(0, Math.min(firstIdx, firstParent.length));
        firstParent.splice(ins, 0, newParent);
      } else if (state.spec && state.spec.children) {
        state.spec.children.push(newParent);
      }
    } else if (op.op === 'restyle') {
      var rs = findSpecBlock(op.targetId);
      if (rs && rs.block) {
        var nt = op.newType || 'callout';
        var isContainer = nt === 'callout' || nt === 'cols' || nt === 'grid' || nt === 'section' || nt === 'tabs';
        /* 叶块（有 text、无 children）改成容器时，把原文本收进一个子 text 块，避免渲染空容器 */
        if (isContainer && rs.block.text != null && !rs.block.children && !rs.block.cols) {
          rs.block.children = [_textBlock(rs.block.text, rs.block.aiCo)];
          delete rs.block.text;
        }
        rs.block.type = nt;
      }
    } else if (op.op === 'suggest') {
      /* 把推荐布局块追加到根 section（或 anchor 所在 section）的子节点末尾 */
      var sec = state.spec;
      if (op.anchorId) {
        var ar = findSpecBlock(op.anchorId);
        if (ar && ar.parent && ar.parent.children) sec = ar.parent;
      }
      if (sec && sec.children) {
        sec.children = sec.children.concat(op.suggestBlocks || []);
      } else if (state.spec && state.spec.children) {
        state.spec.children = state.spec.children.concat(op.suggestBlocks || []);
      }
    } else if (op.op === 'compose') {
      if (op.newSpec) state.spec = op.newSpec;
    }
  }

  /* 按 id 从 spec 树里移除一组块（原地 splice，保持 children/cols/tabs 数组引用不变，
   * 这样 rearrange 里记录的 firstParent 引用在移除后仍指向同一（已变更）数组） */
  function removeBlockIds(ids) {
    if (!ids || !ids.length || !state.spec) return;
    var idSet = {};
    ids.forEach(function (x) { idSet[x] = 1; });
    function sweepArr(arr) {
      if (!arr) return;
      for (var i = arr.length - 1; i >= 0; i--) { if (arr[i] && idSet[arr[i].id]) arr.splice(i, 1); }
      for (var k = 0; k < arr.length; k++) sweepNode(arr[k]);
    }
    function sweepNode(node) {
      if (!node) return;
      if (node.children) sweepArr(node.children);
      if (node.cols) node.cols.forEach(function (col) { sweepArr(col); });
      if (node.tabs) node.tabs.forEach(function (t) { if (t && t.children) sweepArr(t.children); });
    }
    sweepNode(state.spec);
  }

  /* 撤销最近一次 AI 块编排：还原 spec 快照 + 重渲染 */
  function undoAiBlock() {
    if (!state._aiBlockUndo || !state._aiBlockUndo.snapshot) { toast('没有可撤销的编排'); return; }
    state.spec = state._aiBlockUndo.snapshot;
    state._aiBlockUndo = null;
    rerenderSpecIntoTemplate();
    toast('已撤销林的编排');
  }

  /* 上移/下移 spec 块：在父节点 children 中前后换位，然后重渲染 */
  function moveSpecBlockAndRerender(dir) {
    var id = state.selectedSpecBlockId;
    if (!id) { toast('先选中一个块'); return; }
    /* 先把 contenteditable 内的编辑同步回 spec（避免重渲染丢失输入） */
    syncSpecFromDom();
    var r = findSpecBlock(id);
    if (!r || !r.parentChildren) { hideSpecBlockMenu(); toast('块已不可用'); return; }
    var ok = moveSpecBlock(id, dir);
    if (!ok) { toast(dir < 0 ? '已经在顶部' : '已经在底部'); return; }
    hideSpecBlockMenu();
    rerenderSpecIntoTemplate();
    /* 重新选中该块（让用户连续点上下移） */
    selectSpecBlockVisual(id);
  }

  /* 把当前 spec 重新渲染进当前模板（保留模板外壳，仅替换内容区） */
  function rerenderSpecIntoTemplate() {
    if (!state.spec) return;
    if (state.template === 'doc') {
      var docBody = $('[data-ne-docbody]');
      if (docBody && state.spec.children) {
        docBody.innerHTML = state.spec.children.map(function (c) { return BlockRenderer.renderSpec(c); }).join('');
        updateWordCount();
      }
    } else if (state.template === 'dual') {
      /* 标注形式：重新渲染当前 PDF 页 */
      var cols2 = state.spec.cols || [[], []];
      state.reader.pages = (cols2[1] && cols2[1][0] && cols2[1][0].children) || [];
      rerenderReaderPage();
    } else if (state.template === 'outline') {
      rerenderOutline();
    }
    /* canvas 模板的 spec 重排走 renderBlocks，不在此处理 */
  }

  /* 视觉高亮某个 spec 块（仅供上下移后给用户反馈） */
  function selectSpecBlockVisual(id) {
    $all('.ne-specblk.is-selected').forEach(function (n) { n.classList.remove('is-selected'); });
    var node = document.querySelector('[data-block="' + id + '"]');
    if (node) {
      node.classList.add('is-selected');
      if (node.scrollIntoView) node.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
    state.selectedSpecBlockId = id;
  }

  /* =====================================================================
   * Task 2.4：布局块（cols / grid）子块长按拖拽重排
   * 不跨父布局块边界；移动端 touchstart/move/end + 鼠标 mousedown/move/up 兼容
   * canvas 子块复用既有 bindCanvas 拖拽，不在此重复绑定
   * ===================================================================*/
  function bindLayoutDrag() {
    var root = rootEl();
    if (!root || root.__zxLayoutDragBound) return;
    root.__zxLayoutDragBound = true;

    var pressTimer = null;
    var pressStart = null;
    var pressTarget = null;
    var drag = null;

    function pt(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    /* 找到块所属的布局父（cols / grid；canvas 走既有逻辑）；返回 { parentChildren, parentEl } 或 null */
    function findLayoutParent(blockNode) {
      var colsParent = blockNode.closest('.ne-cols__col, .ne-grid');
      if (!colsParent) return null;
      /* 确定子块数组：cols 取列内同辈；grid 取 .ne-grid 直接子节点 */
      var blockId = blockNode.getAttribute('data-block');
      var r = findSpecBlock(blockId);
      if (!r || !r.parentChildren) return null;
      return { parentChildren: r.parentChildren, parentEl: colsParent, blockId: blockId, idx: r.idx };
    }

    function startPress(e) {
      var target = e.target;
      if (!target || !target.closest) return;
      /* 仅响应 .ne-specblk（不在 reader 分割线、不在 canvas 内 —— canvas 有自己的 down） */
      var blockNode = target.closest('[data-block]');
      if (!blockNode) return;
      /* canvas 模板下完全交给 bindCanvas */
      if (state.template === 'canvas') return;
      /* reader PDF 页卡片不支持拖拽（有专属交互） */
      if (blockNode.classList.contains('ne-attach__page')) return;
      var inLayout = blockNode.closest('.ne-cols__col, .ne-grid');
      var p = pt(e);
      pressStart = p;
      pressTarget = blockNode;
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        if (!pressStart || !pressTarget) return;
        /* 长按触发：layout 内 → 拖拽；否则 → 块菜单 */
        if (inLayout) {
          var lp = findLayoutParent(pressTarget);
          if (lp) startDrag(lp);
        } else {
          showSpecBlockMenu(pressTarget.getAttribute('data-block'), pressTarget);
        }
        pressStart = null;
        pressTarget = null;
        pressTimer = null;
      }, 480);
    }
    function cancelPress(e) {
      var p = pt(e);
      if (pressStart && (Math.abs(p.x - pressStart.x) > 8 || Math.abs(p.y - pressStart.y) > 8)) {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        pressStart = null;
        pressTarget = null;
      }
    }
    function clearPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      pressStart = null;
      pressTarget = null;
    }

    function startDrag(lp) {
      var blockNode = document.querySelector('[data-block="' + lp.blockId + '"]');
      if (!blockNode) return;
      drag = {
        blockId: lp.blockId,
        parentChildren: lp.parentChildren,
        parentEl: lp.parentEl,
        sourceIdx: lp.idx,
        ghost: null,
        dropIdx: -1
      };
      blockNode.classList.add('is-dragging');
      /* 收集同父兄弟作为可放置位置 */
      drag.siblings = [];
      var nodes = drag.parentEl.querySelectorAll('[data-block]');
      /* 对 cols：兄弟 = 同列内 [data-block]；对 grid：兄弟 = 同 .ne-grid 直接 .ne-grid__cell > [data-block] */
      var isCol = !!drag.parentEl.classList.contains('ne-cols__col');
      Array.prototype.forEach.call(nodes, function (n) {
        /* 必须与拖拽源在同一 parentChildren —— 用 spec id 比对 */
        var nid = n.getAttribute('data-block');
        if (!lp.parentChildren.some(function (c) { return c.id === nid; })) return;
        drag.siblings.push({ id: nid, node: n });
      });
      /* 创建跟随手指的 ghost */
      var ghost = blockNode.cloneNode(true);
      ghost.classList.add('ne-specblk-ghost');
      ghost.style.position = 'absolute';
      ghost.style.pointerEvents = 'none';
      ghost.style.zIndex = '9999';
      ghost.style.opacity = '0.92';
      var main = $('.ne-main');
      if (main) main.appendChild(ghost);
      drag.ghost = ghost;
      state.layoutDrag = drag;
    }

    function moveDrag(e) {
      if (!drag) return;
      var p = pt(e);
      /* 移动 ghost 跟随手指/鼠标 */
      var main = $('.ne-main');
      if (main && drag.ghost) {
        var mainRect = main.getBoundingClientRect();
        drag.ghost.style.left = (p.x - mainRect.left - 50) + 'px';
        drag.ghost.style.top = (p.y - mainRect.top - 20) + 'px';
      }
      /* 找最接近的兄弟（按垂直距离） */
      var closest = null, closestDist = Infinity, closestIdx = -1;
      for (var i = 0; i < drag.siblings.length; i++) {
        var s = drag.siblings[i];
        var r = s.node.getBoundingClientRect();
        var mid = r.top + r.height / 2;
        var d = Math.abs(p.y - mid);
        if (d < closestDist) { closestDist = d; closest = s; closestIdx = i; }
      }
      /* 清除旧高亮 */
      $all('.ne-specblk-drop-before, .ne-specblk-drop-after').forEach(function (n) {
        n.classList.remove('ne-specblk-drop-before', 'ne-specblk-drop-after');
      });
      if (closest) {
        var cr = closest.node.getBoundingClientRect();
        var cmid = cr.top + cr.height / 2;
        var before = p.y < cmid;
        closest.node.classList.add(before ? 'ne-specblk-drop-before' : 'ne-specblk-drop-after');
        /* dropIdx：在 closest 之前或之后；同时若拖到自身前后则视为无效（取消） */
        var baseIdx = -1;
        for (var bi = 0; bi < drag.parentChildren.length; bi++) {
          if (drag.parentChildren[bi].id === closest.id) { baseIdx = bi; break; }
        }
        drag.dropIdx = before ? baseIdx : baseIdx + 1;
        /* 调整：若从源位置往下移，dropIdx 需 -1（splice 后位置变化） */
        if (drag.sourceIdx < drag.dropIdx) drag.dropIdx -= 1;
      } else {
        drag.dropIdx = -1;
      }
      if (e.cancelable) e.preventDefault();
    }

    function endDrag(e) {
      if (!drag) { clearPress(); return; }
      /* 捕获拖拽前的 dropIdx（drag.moveDrag 计算时已对 sourceIdx 往下移做过 -1 调整） */
      var capturedDropIdx = drag.dropIdx;
      var capturedBlockId = drag.blockId;
      /* 清除高亮与 ghost */
      $all('.ne-specblk-drop-before, .ne-specblk-drop-after, .is-dragging').forEach(function (n) {
        n.classList.remove('ne-specblk-drop-before', 'ne-specblk-drop-after', 'is-dragging');
      });
      if (drag.ghost && drag.ghost.parentNode) drag.ghost.parentNode.removeChild(drag.ghost);
      /* 落定：若 dropIdx 有效，先同步 DOM 编辑到 spec，再 re-find 重排 */
      if (capturedDropIdx >= 0) {
        syncSpecFromDom();
        var r = findSpecBlock(capturedBlockId);
        if (r && r.parentChildren) {
          var arr = r.parentChildren;
          var srcIdx = arr.indexOf(r.block);
          if (srcIdx >= 0 && capturedDropIdx !== srcIdx) {
            var moved = arr.splice(srcIdx, 1)[0];
            /* capturedDropIdx 已在 moveDrag 内对 sourceIdx < dropIdx 做过 -1，这里直接用 */
            var ni = Math.max(0, Math.min(capturedDropIdx, arr.length));
            arr.splice(ni, 0, moved);
            rerenderSpecIntoTemplate();
            toast('已重排', true);
          }
        }
      }
      state.layoutDrag = null;
      drag = null;
      clearPress();
    }

    root.addEventListener('touchstart', startPress, { passive: false });
    root.addEventListener('touchmove', function (e) { cancelPress(e); if (drag) moveDrag(e); }, { passive: false });
    root.addEventListener('touchend', function (e) { if (drag) endDrag(e); else clearPress(); });
    root.addEventListener('mousedown', startPress);
    document.addEventListener('mousemove', function (e) { if (drag) moveDrag(e); else cancelPress(e); });
    document.addEventListener('mouseup', function (e) { if (drag) endDrag(e); else clearPress(); });
  }

  /* doc / outline 模板：长按正文空白区域 → 打开斜杠菜单加块 */
  function bindDocLongPress() {
    var root = rootEl();
    if (!root || root.__zxDocLongPressBound) return;
    root.__zxDocLongPressBound = true;

    var pressTimer = null;
    var pressStart = null;

    function pt(e) {
      if (e.touches && e.touches[0]) return { x: e.touches[0].clientX, y: e.touches[0].clientY };
      if (e.changedTouches && e.changedTouches[0]) return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
      return { x: e.clientX, y: e.clientY };
    }

    function startPress(e) {
      /* canvas 模板走 bindCanvas 自己的长按 */
      if (state.template === 'canvas') return;
      var body = $('[data-ne-docbody]') || $('[data-ne-outnodes]');
      if (!body) return;
      /* 只响应点在 body 容器本身或其空白区域（非 [data-block] 块内） */
      var target = e.target;
      if (!target) return;
      var inBody = target.closest('[data-ne-docbody]') || target.closest('[data-ne-outnodes]');
      if (!inBody) return;
      /* 点在已有块内 → 交给 bindLayoutDrag 处理 */
      if (target.closest('[data-block]')) return;
      /* 点在 contenteditable 文字上 → 不拦截（让原生选字/聚焦） */
      if (target.isContentEditable && target.tagName !== 'DIV') return;

      var p = pt(e);
      pressStart = p;
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        if (!pressStart) return;
        /* 长按空白 → 打开斜杠菜单 */
        var anchor = document.createElement('span');
        anchor.style.position = 'fixed';
        anchor.style.left = pressStart.x + 'px';
        anchor.style.top = pressStart.y + 'px';
        document.body.appendChild(anchor);
        openSlashMenu(anchor);
        anchor.parentNode.removeChild(anchor);
        pressStart = null;
        pressTimer = null;
      }, 500);
    }

    function cancelPress(e) {
      var p = pt(e);
      if (pressStart && (Math.abs(p.x - pressStart.x) > 8 || Math.abs(p.y - pressStart.y) > 8)) {
        if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        pressStart = null;
      }
    }

    function clearPress() {
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      pressStart = null;
    }

    root.addEventListener('touchstart', startPress, { passive: false });
    root.addEventListener('touchmove', cancelPress, { passive: false });
    root.addEventListener('touchend', clearPress);
    root.addEventListener('mousedown', startPress);
    document.addEventListener('mousemove', cancelPress);
    document.addEventListener('mouseup', clearPress);
  }

  function hideBlockMenu() { var m = $('[data-ne-blockmenu]'); if (m) { m.hidden = true; m.classList.remove('is-show'); m.innerHTML = ''; } }

  /* =====================================================================
   * Task 3.3：dual/reader AI —— 解读页 / 矛盾检测 / 跟读 / 抽卡片
   * ===================================================================*/
  function attachPageText(idx) {
    /* 标注形式：当前页 DOM 中取文本；若 idx 不等于当前页，从 spec 数据取 */
    var p = document.querySelector('[data-ne-attach="' + idx + '"]');
    if (p) {
      var clone = p.cloneNode(true);
      var btns = clone.querySelectorAll('.ne-attach__explain');
      for (var i = 0; i < btns.length; i++) btns[i].parentNode.removeChild(btns[i]);
      var tag = clone.querySelector('.ne-attach__page-tag');
      if (tag) tag.parentNode.removeChild(tag);
      return (clone.textContent || '').replace(/\s+/g, ' ').trim();
    }
    /* 从 spec 数据取（非当前页） */
    var page = state.reader.pages[idx];
    return page ? (page.text || '').replace(/\s+/g, ' ').trim() : '';
  }
  function activeAttachIdx() {
    return state.reader.page || 0;
  }
  function setActiveAttach(idx) {
    state.reader.page = idx;
    /* 标注形式下翻页由 rerenderReaderPage 处理，这里不直接操作 */
  }

  /* 在 PDF 上方浮动显示一张鎏金 AI 卡片（stance：normal/conflict/consistent/pending） */
  function insertReaderCard(stance, text) {
    var reader = $('[data-ne-reader]');
    if (!reader) return;
    /* 移除已有卡片，避免堆叠 */
    var old = $('.ne-ai-card', reader);
    if (old) old.parentNode.removeChild(old);
    var card = el('div');
    card.className = 'ne-ai-card ne-ai-card--' + stance;
    card.innerHTML =
      '<div class="ne-ai-card__head"><span class="ne-ai-card__ava">' + IC.spark(12) + '</span>' +
      '<span class="ne-ai-card__label">林 · ' + ({ normal: '解读', conflict: '矛盾检测', consistent: '一致性', pending: '待验证', card: '论点卡片' }[stance] || '卡片') + '</span>' +
      '<button class="ne-ai-card__close" data-action="ne-card-reject" aria-label="关闭">' + IC.close(14) + '</button></div>' +
      '<p class="ne-ai-card__text">' + escapeHtml(text) + '</p>' +
      '<div class="ne-ai-card__actions">' +
      '<button class="ne-ai-card__btn ne-ai-card__btn--accept" data-action="ne-card-accept">' + IC.check(13) + ' 存为笔记</button>' +
      '<button class="ne-ai-card__btn ne-ai-card__btn--save" data-action="ne-card-save">收起</button>' +
      '</div>';
    reader.appendChild(card);
    state.aiCo = true;
  }

  /* ① 解读这页：陪读智能体 dispatch → 卡片 */
  function explainPage(idx) {
    var txt = attachPageText(idx);
    setActiveAttach(idx);
    toast(IC.spark(13) + ' 林（陪读）正在解读 P.' + (28 + idx) + '…');
    setTimeout(function () {
      var r = window.ZX_DISPATCH ? window.ZX_DISPATCH.result('reader', txt) : { items: [txt.slice(0, 24)] };
      var head = r.items && r.items.length ? r.items[0] : '这页的关键论点';
      insertReaderCard('card', '【P.' + (28 + idx) + ' 解读】' + head + '。' + txt.slice(0, 30));
    }, 700);
  }

  /* ② 矛盾检测：对比选中文本与当前页 → 三态判定（research+陪读） */
  function checkConflict() {
    var sel = state.inlineSelText || '';
    if (!sel) { toast('先在左侧选中一段你写的文字'); return; }
    var pageText = attachPageText(activeAttachIdx());
    toast(IC.spark(13) + ' 林正在核对左侧与原文…');
    setTimeout(function () {
      var r = window.ZX_AI ? window.ZX_AI.conflictLine({ selText: sel, pageText: pageText }) : '待验证。';
      var stance = /^冲突/.test(r) ? 'conflict' : (/^一致/.test(r) ? 'consistent' : 'pending');
      insertReaderCard(stance, r);
    }, 700);
  }

  /* ③ 跟读：切页时给一句"这页关键是…"轻气泡（姿态1变体） */
  function followRead(idx) {
    var box = $('[data-ne-followread]');
    if (!box) return;
    var txt = attachPageText(idx);
    var key = /涂层/.test(txt) ? 'LiNbO₃ 涂层降阻抗约 10×（注意测量方法）'
      : /电导率/.test(txt) ? 'σ ≈ 10⁻³ S/cm，与液态电解液相当'
      : /四电极|两电极/.test(txt) ? '结论依赖测量体系，两电极会高估' : txt.slice(0, 18);
    box.hidden = false;
    box.innerHTML = '<span class="ne-followread__ava">' + IC.spark(12) + '</span><span>这页关键是：' + escapeHtml(key) + '</span>';
    if (state._followTimer) clearTimeout(state._followTimer);
    state._followTimer = setTimeout(function () { box.hidden = true; box.innerHTML = ''; }, 3500);
  }

  /* ④ 继续抽卡片：当前页抽论点卡片 */
  function extractCards() {
    var idx = activeAttachIdx();
    var txt = attachPageText(idx);
    toast(IC.spark(13) + ' 林（陪读）正在抽卡片…');
    setTimeout(function () {
      var r = window.ZX_DISPATCH ? window.ZX_DISPATCH.result('reader', txt) : { items: [txt.slice(0, 16)] };
      var items = (r.items || []).slice(0, 2);
      if (!items.length) items = [txt.slice(0, 18)];
      items.forEach(function (it, i) {
        setTimeout(function () { insertReaderCard('card', '【论点卡片】' + it); }, i * 250);
      });
    }, 700);
  }
  function toggleNode(id) {
    var r = findNode(id);
    if (r && r.node.children && r.node.children.length) {
      r.node.collapsed = !r.node.collapsed;
      rerenderOutline();
    }
  }
  function openTypeMenu(id, anchorEl) {
    var menu = $('[data-ne-typemenu]');
    if (!menu) return;
    var rect = anchorEl.getBoundingClientRect();
    menu.style.left = clamp(rect.left, 4, 220) + 'px';
    menu.style.top = (rect.bottom + 4) + 'px';
    menu.__forNode = id;
    menu.classList.add('is-open');
    openScrim();
  }
  function setNodeType(key) {
    var menu = $('[data-ne-typemenu]');
    var id = menu && menu.__forNode;
    closeAllMenus();
    if (!id) return;
    var r = findNode(id);
    if (r) { r.node.type = key; rerenderOutline(); }
  }
  function onNodeKeydown(e) {
    var textEl = e.target.closest('[data-ne-nodetext]');
    if (!textEl) return;
    var id = textEl.getAttribute('data-ne-nodetext');
    if (e.key === 'Tab') {
      e.preventDefault();
      var r = findNode(id);
      if (!r) return;
      if (e.shiftKey) outdentNode(r); else indentNode(r);
      rerenderOutline();
      focusNode(id);
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      var r2 = findNode(id);
      if (!r2) return;
      var newNode = { id: 'o' + Date.now(), type: r2.node.type, text: '', collapsed: false, children: [] };
      if (r2.parent) { r2.parent.children.splice(r2.idx + 1, 0, newNode); }
      else { /* 根节点：新建为其第一个子节点，避免覆盖整棵树 */
        state.outline.children = state.outline.children || [];
        state.outline.children.unshift(newNode);
        state.outline.collapsed = false;
      }
      rerenderOutline();
      focusNode(newNode.id);
    }
  }
  function indentNode(r) {
    if (!r.parent) return;
    var prev = r.parent.children[r.idx - 1];
    if (!prev) return;
    prev.children = prev.children || [];
    prev.collapsed = false;
    r.parent.children.splice(r.idx, 1);
    prev.children.push(r.node);
  }
  function outdentNode(r) {
    if (!r.parent || r.parent === state.outline) return;
    /* 找到 grandparent */
    var gp = findNode(r.parent.id);
    if (!gp || !gp.parent) return;
    var parentIdx = gp.idx;
    gp.parent.children.splice(parentIdx + 1, 0, r.node);
    r.parent.children.splice(r.idx, 1);
  }
  function focusNode(id) {
    setTimeout(function () {
      var t = $('[data-ne-nodetext="' + id + '"]');
      if (t) { t.focus(); }
    }, 30);
  }
  function captureOutlineText() {
    $all('[data-ne-nodetext]').forEach(function (t) {
      var id = t.getAttribute('data-ne-nodetext');
      var r = findNode(id);
      if (r) r.node.text = t.textContent;
    });
  }

  /* =====================================================================
   * Task 3.2：outline AI —— 问林三动作 / 收束子树 / 建议类型
   * ===================================================================*/
  function currentOutlineNodeId() {
    var sel = window.getSelection();
    if (!sel || !sel.anchorNode) return null;
    var n = sel.anchorNode;
    if (n.nodeType === 3) n = n.parentNode;
    while (n && n !== document) {
      if (n.getAttribute && n.getAttribute('data-ne-nodetext')) return n.getAttribute('data-ne-nodetext');
      n = n.parentNode;
    }
    return null;
  }

  function openOutlineAskMenu() {
    var nodeId = currentOutlineNodeId();
    if (!nodeId) { toast('先选中一个节点的文字'); return; }
    var menu = $('[data-ne-outlineask]');
    if (!menu) return;
    var r = findNode(nodeId);
    var textEl = $('[data-ne-nodetext="' + nodeId + '"]');
    var rect = textEl ? textEl.getBoundingClientRect() : null;
    var main = $('.ne-main'); var mainRect = main ? main.getBoundingClientRect() : { left: 0, top: 0, width: 320 };
    menu.innerHTML =
      '<button class="ne-outlineask__item" data-action="ne-outline-ask" data-act="point">' + IC.spark(13) + ' 补论点</button>' +
      '<button class="ne-outlineask__item" data-action="ne-outline-ask" data-act="evidence">' + IC.spark(13) + ' 转证据（配数据）</button>' +
      '<button class="ne-outlineask__item ne-outlineask__item--warn" data-action="ne-outline-ask" data-act="counter">' + IC.spark(13) + ' 找反例</button>';
    var top = rect ? (rect.bottom - mainRect.top + 6) : 80;
    menu.style.left = '20px';
    menu.style.top = clamp(top, 4, 460) + 'px';
    menu.hidden = false;
    menu.classList.add('is-show');
    menu.__forNode = nodeId;
    hideInlineToolbar();
    openScrim();
  }
  function hideOutlineAskMenu() { var m = $('[data-ne-outlineask]'); if (m) { m.hidden = true; m.classList.remove('is-show'); } }

  /* action → {intent, type} ：补论点/转证据/找反例 */
  function outlineAsk(action) {
    var menu = $('[data-ne-outlineask]');
    var nodeId = (menu && menu.__forNode) || currentOutlineNodeId();
    hideOutlineAskMenu(); closeAllMenus();
    if (!nodeId) { toast('先选中一个节点'); return; }
    var r = findNode(nodeId);
    if (!r) return;
    var map = {
      point:    { intent: 'expand',     type: 'opinion',  label: '补论点' },
      evidence: { intent: 'impedance',  type: 'evidence', label: '转证据' },
      counter:  { intent: 'counter',    type: 'question', label: '找反例' }
    };
    var cfg = map[action] || map.point;
    toast(IC.spark(13) + ' 林（研究）正在' + cfg.label + '…');
    setTimeout(function () {
      var text = window.ZX_AI ? window.ZX_AI.reply(cfg.intent, { selText: r.node.text }) : (cfg.label + '：' + r.node.text.slice(0, 16));
      var newNode = { id: 'o' + Date.now(), type: cfg.type, text: text, collapsed: false, children: [], aiCo: true };
      r.node.children = r.node.children || [];
      r.node.children.push(newNode);
      r.node.collapsed = false;
      state.aiCo = true;
      rerenderOutline();
      toast('林已' + cfg.label + '，可[接受]/编辑', true);
    }, 700);
  }

  /* 收束子树：把子节点喂给总结智能体 → 生成结论节点替换子节点列表 */
  function collapseSubtree(nodeId) {
    closeAllMenus();
    var r = findNode(nodeId);
    if (!r || !r.node.children || !r.node.children.length) { toast('这个节点还没有子节点'); return; }
    var allText = r.node.children.map(function (c) { return c.text; }).join('；');
    toast(IC.spark(13) + ' 林（总结）正在收束子树…');
    setTimeout(function () {
      var res = window.ZX_DISPATCH ? window.ZX_DISPATCH.result('summary', allText) : { items: ['已收束子树的核心结论'] };
      var conclusion = res.items && res.items.length ? '结论：' + res.items[0] : '结论：已收束子节点';
      var savedChildren = r.node.children.slice();
      r.node.children = [{ id: 'o' + Date.now(), type: 'opinion', text: conclusion, collapsed: false, children: [], aiCo: true }];
      r.node.collapsed = false;
      r.node._savedChildren = savedChildren;
      state.aiCo = true;
      rerenderOutline();
      showAiUndoToast('撤销收束', 'ne-undo-outline');
      state._outlineUndo = state._outlineUndo || [];
      state._outlineUndo.push({ nodeId: nodeId, saved: savedChildren });
    }, 700);
  }
  function undoOutlineCollapse() {
    if (!state._outlineUndo || !state._outlineUndo.length) { toast('没有可撤销的'); return; }
    var last = state._outlineUndo.pop();
    var r = findNode(last.nodeId);
    if (r) { r.node.children = last.saved; rerenderOutline(); toast('已撤销收束'); }
  }

  /* 建议类型：据内容推断，设类型并闪烁 chip */
  function suggestNodeType(nodeId) {
    var menu = $('[data-ne-typemenu]');
    var id = (menu && menu.__forNode) || nodeId;
    closeAllMenus();
    var r = findNode(id);
    if (!r) return;
    var t = r.node.text || '';
    var suggested;
    if (/数据|电导率|阻抗|\d|n=/.test(t)) suggested = 'evidence';
    else if (/是否|为什么|怎么办|？|\?/.test(t)) suggested = 'question';
    else if (/复测|验证|待办|要做/.test(t)) suggested = 'todo';
    else if (/引|原文|《/.test(t)) suggested = 'quote';
    else suggested = 'opinion';
    r.node.type = suggested;
    rerenderOutline();
    var chip = document.querySelector('[data-node="' + id + '"] .ne-node__typechip');
    if (chip) { chip.classList.add('is-flash'); setTimeout(function () { chip.classList.remove('is-flash'); }, 1200); }
    toast('林建议类型：' + typeLabel(suggested));
  }

  /* =====================================================================
   * 事件委托
   * ===================================================================*/
  function onClick(e) {
    var target = e.target;
    /* 点击遮罩 → 关闭所有浮层（必须在 data-action 判定之前） */
    if (target.closest('[data-ne-scrim]')) {
      closeAllMenus();
      hideInlineToolbar();
      closeInlineChat();
      return;
    }
    var actEl = target.closest('[data-action]');
    if (!actEl) {
      /* Task 3.3：双联阅读里点 PDF 页（非按钮）→ 切为当前页 + 林跟读 */
      if (state.template === 'dual') {
        var ap = target.closest('[data-ne-attach]');
        if (ap) {
          var pi = parseInt(ap.getAttribute('data-ne-attach'), 10);
          setActiveAttach(pi);
          followRead(pi);
        }
      }
      return;
    }
    var action = actEl.getAttribute('data-action');

    switch (action) {
      case 'ne-back': close(); break;

      /* 分享笔记 → 弹出分享面板（选好友/群聊） */
      case 'ne-share': openSharePanel(); break;
      case 'ne-share-to': sendShareTo(actEl.getAttribute('data-name')); break;

      /* 键盘上方工具栏 */
      case 'ne-tb-ai':
        if (state.template === 'canvas') aiLinkBlocks();
        else if (state.template === 'dual') extractCards();
        else insertCowrite('expand');
        break;
      case 'ne-tb-image': {
        var ib = $('[data-ne-docbody]') || $('[data-ne-readertext]');
        if (ib) {
          ib.insertAdjacentHTML('beforeend', '<p class="ne-img-placeholder">' + IC.image(14) + '［图片占位 · 点击插入］</p>');
          ib.scrollTop = ib.scrollHeight;
          updateWordCount();
          toast('已插入图片占位');
        }
        break;
      }
      case 'ne-tb-link': {
        var lb = $('[data-ne-docbody]') || $('[data-ne-readertext]');
        if (lb) {
          document.execCommand('insertHTML', false, '<a class="ne-wikilink" contenteditable="false">[[链接标题]]</a>&nbsp;');
          toast('已插入双链');
        }
        break;
      }
      case 'ne-tb-voice': {
        var vb = $('[data-ne-docbody]') || $('[data-ne-readertext]');
        if (vb) {
          vb.insertAdjacentHTML('beforeend', '<p>' + escapeHtml('（语音转写）界面阻抗是全固态电池的核心瓶颈，关键在测量方法。') + '</p>');
          vb.scrollTop = vb.scrollHeight;
          updateWordCount();
          toast('语音已转写为文字');
        }
        break;
      }

      /* 长按已触发共写 → 吞掉本次 click，避免又打开设置面板 */
      case 'ne-ai':
        if (state.aiLongPressed) { state.aiLongPressed = false; break; }
        openAiPanel();
        break;

      /* Task 4.3：编辑器工具装真——图片占位块 / 语音转写 / 字体切换 */
      case 'ne-tool-image': {
        var ib = $('[data-ne-docbody]') || $('[data-ne-readertext]');
        if (ib) {
          ib.insertAdjacentHTML('beforeend', '<p class="ne-img-placeholder">' + IC.image(14) + '［图片占位 · 点击插入］</p>');
          ib.scrollTop = ib.scrollHeight;
          updateWordCount();
          toast('已插入图片占位');
        } else toast('图片插入（占位）');
        break;
      }
      case 'ne-tool-voice': {
        var vb = $('[data-ne-docbody]') || $('[data-ne-readertext]');
        if (vb) {
          vb.insertAdjacentHTML('beforeend', '<p>' + escapeHtml('（语音转写）界面阻抗是全固态电池的核心瓶颈，关键在测量方法。') + '</p>');
          vb.scrollTop = vb.scrollHeight;
          updateWordCount();
          toast('语音已转写为文字');
        } else toast('语音输入已启动');
        break;
      }
      case 'ne-tool-style': {
        var sb = $('[data-ne-docbody]') || $('[data-ne-readertext]');
        if (sb) {
          var isSerif = /Serif|宋/.test(sb.style.fontFamily || getComputedStyle(sb).fontFamily);
          sb.style.fontFamily = isSerif ? '"Noto Sans SC", var(--font-sans)' : '"Noto Serif SC", var(--font-display)';
          toast(isSerif ? '已切换为思源黑体' : '已切换为思源宋体');
        } else toast('切换为思源宋体 / 黑体');
        break;
      }
      case 'ne-tool-cowrite':
        /* Task 3.1/3.3：底栏 ✦ 按模板分发——画布→帮我连线；双联→继续抽卡片；文档→肩并肩共写 */
        if (state.template === 'canvas') aiLinkBlocks();
        else if (state.template === 'dual') extractCards();
        else insertCowrite('expand');
        break;

      case 'ne-zoom-in': zoomBy(0.15); break;
      case 'ne-zoom-out': zoomBy(-0.15); break;

      case 'ne-suggest-expand': removeSuggest(); insertCowrite('expand'); break;
      case 'ne-suggest-rewrite': removeSuggest(); insertCowrite('rewrite'); break;
      case 'ne-suggest-dismiss': removeSuggest(); break;

      case 'ne-cowrite-accept': acceptCowrite(actEl); break;
      case 'ne-cowrite-reject': rejectCowrite(actEl); break;
      case 'ne-cowrite-refine': refineCowrite(actEl); break;

      case 'ne-bold': if (document.execCommand) document.execCommand('bold'); hideInlineToolbar(); break;
      case 'ne-italic': if (document.execCommand) document.execCommand('italic'); hideInlineToolbar(); break;
      case 'ne-ask-lin':
        /* Task 3.2/3.3：大纲→三动作菜单；双联→解读当前页；其余→行内对话 */
        if (state.template === 'outline') openOutlineAskMenu();
        else if (state.template === 'dual') explainPage(state.reader.page || 0);
        else openInlineChat();
        break;
      case 'ne-inline-close': closeInlineChat(); break;
      case 'ne-inline-send': sendInline(); break;
      case 'ne-inline-apply': applyInlineToSelection(); break;

      case 'ne-slash-pick': insertSlashItem(actEl.getAttribute('data-key')); break;
      case 'ne-link-pick': insertWikiLink(actEl.getAttribute('data-title')); break;

      case 'ne-toggle-suggest':
        state.suggestOn = !state.suggestOn;
        var sw = actEl;
        sw.classList.toggle('is-on', state.suggestOn);
        sw.setAttribute('aria-checked', state.suggestOn ? 'true' : 'false');
        if (!state.suggestOn) removeSuggest();
        toast(state.suggestOn ? '旁观插话已开启' : '旁观插话已关闭');
        break;

      /* canvas */
      case 'ne-add-block': addBlockAt(actEl.getAttribute('data-btype')); break;
      /* Task 3.1：canvas AI —— 归纳主题 / 总结全画布 / 撤销 */
      case 'ne-canvas-summarize-theme': {
        var bm = $('[data-ne-blockmenu]');
        var bid = bm && bm.__forBlock ? bm.__forBlock : state.canvas.selected;
        hideBlockMenu(); closeAllMenus();
        if (bid != null) summarizeTheme(bid); else toast('先选中一个块');
        break;
      }
      case 'ne-canvas-summarize-all': summarizeCanvas(); break;
      case 'ne-undo-canvas': undoLastCanvas(); break;

      /* Task 3.3：dual/reader AI —— 解读页 / 抽卡片 / 卡片动作 */
      case 'ne-reader-explain': explainPage(state.reader.page || 0); break;
      case 'ne-reader-extract': extractCards(); break;
      case 'ne-reader-summary': summarizeReaderPage(); break;
      case 'ne-reader-prev': readerPagePrev(); break;
      case 'ne-reader-next': readerPageNext(); break;
      case 'ne-reader-tool': readerSelectTool(actEl.getAttribute('data-tool')); break;
      case 'ne-reader-bookmark': toggleReaderBookmark(); break;
      case 'ne-reader-essay': openReaderEssay(); break;
      case 'ne-reader-essay-close': closeReaderEssay(); break;
      case 'ne-reader-essay-save': saveReaderEssay(); break;
      case 'ne-reader-del-anno': {
        var aid = actEl.getAttribute('data-anno');
        if (aid) {
          state.reader.annotations = state.reader.annotations.filter(function (a) { return a.id !== aid; });
          renderReaderAnnotations();
        }
        break;
      }
      case 'ne-card-accept': {
        /* 存为笔记 */
        var card = actEl.closest('.ne-ai-card');
        var txtA = card ? ($('.ne-ai-card__text', card) || {}).textContent : '';
        if (window.ZX_BRIDGE && window.ZX_BRIDGE.upsertNote) {
          window.ZX_BRIDGE.upsertNote({ title: '陪读卡片', template: 'doc', body: '<p>' + escapeHtml(txtA) + '</p>', aiCo: true });
        }
        if (card && card.parentNode) card.parentNode.removeChild(card);
        toast('已存为笔记', true);
        break;
      }
      case 'ne-card-save': {
        /* 收起卡片 */
        var card2 = actEl.closest('.ne-ai-card');
        if (card2 && card2.parentNode) card2.parentNode.removeChild(card2);
        break;
      }
      case 'ne-card-reject': { var cr = actEl.closest('.ne-ai-card'); if (cr && cr.parentNode) cr.parentNode.removeChild(cr); break; }

      /* outline */
      case 'ne-toggle-node': toggleNode(actEl.getAttribute('data-node')); break;
      case 'ne-open-typemenu': captureOutlineText(); openTypeMenu(actEl.getAttribute('data-node'), actEl); break;
      case 'ne-set-type': setNodeType(actEl.getAttribute('data-t')); break;
      /* Task 3.2：outline AI 三动作 / 建议类型 / 收束子树 / 撤销 */
      case 'ne-outline-ask': outlineAsk(actEl.getAttribute('data-act')); break;
      case 'ne-suggest-type': suggestNodeType(actEl.getAttribute('data-node')); break;
      case 'ne-collapse-subtree': {
        var tm2 = $('[data-ne-typemenu]');
        collapseSubtree(tm2 && tm2.__forNode);
        break;
      }
      case 'ne-undo-outline': undoOutlineCollapse(); break;

      /* Task 2.3：spec 块浮动菜单 —— 上移/下移/斜杠/AI 编排（占位） */
      case 'ne-block-up':   moveSpecBlockAndRerender(-1); break;
      case 'ne-block-down': moveSpecBlockAndRerender(+1); break;
      case 'ne-block-slash': {
        var slashId = state.selectedSpecBlockId;
        hideSpecBlockMenu();
        var slashNode = slashId ? document.querySelector('[data-block="' + slashId + '"]') : null;
        if (slashNode && document.createRange) {
          var s = window.getSelection();
          if (s) { s.removeAllRanges(); var rg = document.createRange(); rg.selectNodeContents(slashNode); rg.collapse(false); s.addRange(rg); }
        }
        var bodyAnchor = $('[data-ne-docbody]');
        openSlashMenu(bodyAnchor);
        break;
      }
      /* canvas 块样式编辑 */
      case 'ne-block-bold': {
        if (document.execCommand) document.execCommand('bold');
        break;
      }
      case 'ne-block-italic': {
        if (document.execCommand) document.execCommand('italic');
        break;
      }
      case 'ne-block-cycle-type': {
        var bar = $('[data-ne-blocktoolbar]');
        var bid = bar && bar.__forBlock;
        if (bid != null) cycleBlockType(bid);
        break;
      }
      case 'ne-block-ai': {
        /* 按来源路由：canvas 块工具栏 ✦ → 归纳主题；spec 块菜单 ✦ → Task 4 编排子菜单 */
        var btBar = actEl.closest('[data-ne-blocktoolbar]');
        if (btBar && btBar.__forBlock != null) {
          var cvBid = btBar.__forBlock;
          closeAllMenus();
          summarizeTheme(cvBid);
        } else {
          var bm2 = $('[data-ne-blockmenu]');
          var aiBid = (bm2 && bm2.__forSpecBlock) || state.selectedSpecBlockId;
          var aiAnchor = aiBid ? document.querySelector('[data-block="' + aiBid + '"]') : null;
          showAiArrangeMenu(aiBid, aiAnchor);
        }
        break;
      }

      /* Task 4.2/4.3：AI 编排 5 动作 + restyle 子选项 + 应用/拒绝/撤销 */
      case 'ne-ai-wrap':     hideSpecBlockMenu(); runAiArrange('wrap'); break;
      case 'ne-ai-rearrange':hideSpecBlockMenu(); runAiArrange('rearrange'); break;
      case 'ne-ai-suggest':  hideSpecBlockMenu(); runAiArrange('suggest'); break;
      case 'ne-ai-compose':  hideSpecBlockMenu(); runAiArrange('compose'); break;
      case 'ne-ai-restyle': {
        /* 带 data-restype → 直接 restyle；否则展开 callout/cols/grid 子菜单 */
        var rsType = actEl.getAttribute('data-restype');
        if (rsType) { hideSpecBlockMenu(); runAiArrange('restyle', rsType); }
        else {
          var bm3 = $('[data-ne-blockmenu]');
          var rsBid = (bm3 && bm3.__forSpecBlock) || state.selectedSpecBlockId;
          var rsAnchor = rsBid ? document.querySelector('[data-block="' + rsBid + '"]') : null;
          showAiRestyleMenu(rsBid, rsAnchor);
        }
        break;
      }
      case 'ne-ai-back': {
        /* 返回编排主菜单 */
        var bm4 = $('[data-ne-blockmenu]');
        var bkBid = (bm4 && bm4.__forSpecBlock) || state.selectedSpecBlockId;
        var bkAnchor = bkBid ? document.querySelector('[data-block="' + bkBid + '"]') : null;
        showAiArrangeMenu(bkBid, bkAnchor);
        break;
      }
      case 'ne-ai-accept':   acceptPendingBlockDelta(); break;
      case 'ne-ai-reject':   rejectPendingBlockDelta(); break;
      case 'ne-undo-ai-block': undoAiBlock(); break;

      /* Task 2.2：tabs 块标签页切换 */
      case 'ne-tab-switch': {
        var tabIdx = actEl.getAttribute('data-tab-idx');
        var tabParent = actEl.closest('.ne-tabs');
        if (tabParent) {
          $all('.ne-tabs__label', tabParent).forEach(function (b, i) {
            b.classList.toggle('is-active', String(i) === tabIdx);
          });
          $all('.ne-tabs__panel', tabParent).forEach(function (p, i) {
            p.classList.toggle('is-active', String(i) === tabIdx);
          });
        }
        break;
      }

      default: break;
    }
  }

  function bindEvents() {
    var root = rootEl();
    if (root.__zxEditorBound) return;
    root.__zxEditorBound = true;
    root.addEventListener('click', onClick);
    document.addEventListener('selectionchange', onSelectionChange);

    /* 顶栏 ✦ 长按 → 共写 */
    var aiBtnGetter = function () { return $('[data-action="ne-ai"]', root); };
    var pressTimer = null;
    function aiDown(e) {
      var b = e.target.closest('[data-action="ne-ai"]');
      if (!b) return;
      b.classList.add('is-pressing');
      if (pressTimer) clearTimeout(pressTimer);
      pressTimer = setTimeout(function () {
        b.classList.remove('is-pressing');
        state.aiLongPressed = true; /* 标记长按已触发，onClick 据此吞掉 click */
        /* 长按直接触发共写 */
        var panel = $('[data-ne-aipanel]');
        if (panel) panel.classList.remove('is-open');
        closeScrim();
        insertCowrite('expand');
      }, 500);
    }
    function aiUp(e) {
      var b = e.target.closest && e.target.closest('[data-action="ne-ai"]');
      if (b) b.classList.remove('is-pressing');
      if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
      if (b && b.__longPressed) { b.__longPressed = false; e.preventDefault(); e.stopPropagation(); }
    }
    root.addEventListener('touchstart', aiDown, { passive: false });
    root.addEventListener('touchend', aiUp);
    root.addEventListener('mousedown', aiDown);
    root.addEventListener('mouseup', aiUp);

    /* 输入监听 */
    root.addEventListener('input', function (e) {
      if (e.target.closest('[data-ne-docbody]')) onDocInput();
      if (e.target.closest('[data-ne-doctitle]')) {
        state.title = e.target.textContent.trim() || '无标题笔记';
      }
      if (e.target.closest('[data-ne-nodetext]')) { /* 大纲文本变化，暂存 */ }
    });
    root.addEventListener('keydown', function (e) {
      onNodeKeydown(e);
    });

    /* 文档失焦：清除建议计时 */
    root.addEventListener('blur', function (e) {
      if (e.target && e.target.closest && e.target.closest('[data-ne-docbody]')) {
        if (state.suggestTimer) { clearTimeout(state.suggestTimer); state.suggestTimer = null; }
      }
    }, true);

    /* 模拟键盘 + 工具栏：contenteditable 聚焦时滑入 */
    var kb = $('[data-ne-keyboard]', root);
    var tb = $('[data-ne-toolbar]', root);
    if (kb) {
      function showKb() {
        kb.removeAttribute('hidden');
        if (tb) tb.removeAttribute('hidden');
      }
      function hideKb() {
        kb.setAttribute('hidden', '');
        if (tb) tb.setAttribute('hidden', '');
      }
      /* 点击 contenteditable → 弹键盘；点击顶栏/键盘工具栏以外空白 → 收起 */
      root.addEventListener('mousedown', function (e) {
        if (e.target.closest('.ne-keyboard') || e.target.closest('.ne-toolbar') || e.target.closest('.ne-blocktoolbar') || e.target.closest('.ne-topbar')) {
          return; /* 点键盘/工具栏/顶栏本身不改变状态 */
        }
        /* 点在 contenteditable 元素 OR 其内部子节点（p/h2/标题等）→ 显示键盘；
         * 点在容器本身（如 .ne-doc__body padding 空白）→ 收起 */
        var ce = e.target.closest('[contenteditable="true"]');
        var isEditingTarget = false;
        if (ce) {
          /* 单元素 contenteditable（大纲节点/canvas 块/title input）：target === ce 也算 */
          var isSingleEditable = ce.tagName === 'INPUT' ||
                                 ce.classList.contains('ne-block__content') ||
                                 ce.classList.contains('ne-outline__node-text') ||
                                 ce.classList.contains('ne-reader__text-anno-body') ||
                                 ce.classList.contains('ne-doc__title');
          /* 容器型 contenteditable（.ne-doc__body）：只有 target 是子节点才算 */
          if (isSingleEditable) {
            isEditingTarget = true;
          } else if (e.target !== ce) {
            isEditingTarget = true;
          }
        }
        if (isEditingTarget) showKb();
        else if (!kb.hasAttribute('hidden')) hideKb();
      });
      /* 按键交互：execCommand 在光标处插入文字 */
      kb.addEventListener('mousedown', function (e) { e.preventDefault(); });
      if (tb) tb.addEventListener('mousedown', function (e) { e.preventDefault(); });
      kb.addEventListener('click', function (e) {
        var key = e.target.closest('.ne-key');
        if (!key) return;
        var special = key.getAttribute('data-ne-key');
        if (special === 'shift') {
          var upper = key.classList.toggle('is-on');
          kb.querySelectorAll('.ne-key').forEach(function (k) {
            if (k.type === 'button' && !k.getAttribute('data-ne-key')) {
              k.textContent = upper ? k.textContent.toUpperCase() : k.textContent.toLowerCase();
            }
          });
          return;
        }
        if (special === 'back') { document.execCommand('delete'); }
        else if (special === 'space') { document.execCommand('insertText', false, ' '); }
        else if (special === 'enter') { document.execCommand('insertHTML', false, '<br>'); }
        else { document.execCommand('insertText', false, key.textContent); }
        updateWordCount();
      });
    }
  }

  /* =====================================================================
   * 模板后处理（挂载后绑定各模板专属交互）
   * ===================================================================*/

  function afterMount() {
    updateWordCount();
    if (state.template === 'canvas') bindCanvas();
    if (state.template === 'dual') {
      bindReaderAnnotate();
      /* 文字标注 blur 自动保存 */
      var root = rootEl();
      root.addEventListener('blur', function (e) {
        var t = e.target;
        if (t && t.getAttribute && t.getAttribute('data-ne-textanno') != null) {
          var aid = t.getAttribute('data-ne-textanno');
          var anno = state.reader.annotations.find(function (a) { return a.id === aid; });
          if (anno) anno.text = t.textContent || '';
        }
      }, true);
    }
    /* Task 2.4：cols / grid 布局块子块长按拖拽重排（canvas 走既有 bindCanvas） */
    bindLayoutDrag();
    /* doc / outline 模板：长按正文空白区域 → 打开斜杠菜单加块 */
    bindDocLongPress();
    /* 聚焦正文 */
    setTimeout(function () {
      var focus = $('[data-ne-docbody]') || $('[data-ne-readertext]');
      if (focus) focus.focus();
    }, 200);
  }

  /* =====================================================================
   * 公共 API
   * ===================================================================*/
  function open(templateType, options) {
    options = options || {};
    var t = templateType || 'doc';
    if (t === 'reader') t = 'dual'; /* 兼容旧名 */
    if (['doc', 'dual', 'canvas', 'outline'].indexOf(t) < 0) t = 'doc';
    state.template = t;
    state.title = options.title || '无标题笔记';
    state.aiCo = false;
    state.noteBody = null;
    state._loadedCanvas = null;
    state._loadedLinks = null;
    state.outline = null;
    state.spec = null;                 /* Task 2.1：每次 open 重置 spec，由后续加载/兜底填充 */
    state.selectedSpecBlockId = null;
    state.reader.page = 0;
    state.reader.tool = null;
    state.reader.annotations = [];
    state.reader.bookmarks = [];
    state.reader.essays = {};
    /* Task 2.1：从 bridge.notes 加载已存笔记的 body/blocks/outline（替代旧只读 summary） */
    var loadedNote = null;
    if (options.noteId && window.ZX_BRIDGE && window.ZX_BRIDGE.getNoteById) {
      loadedNote = window.ZX_BRIDGE.getNoteById(options.noteId);
    }
    if (loadedNote) {
      state.currentNoteId = loadedNote.id;
      /* 模板以笔记记录为准（避免 noteId 与传入 template 不一致） */
      if (['doc', 'dual', 'canvas', 'outline'].indexOf(loadedNote.template) >= 0) t = loadedNote.template;
      state.template = t;
      if (!options.title) state.title = loadedNote.title;
      if (t === 'doc' || t === 'dual') {
        state.noteBody = loadedNote.body || loadedNote.summary || loadedNote.title;
      }
      if (t === 'canvas') {
        state._loadedCanvas = loadedNote.blocks && loadedNote.blocks.length ? loadedNote.blocks : null;
        state._loadedLinks = loadedNote.links || null;
      }
      if (t === 'outline') {
        state.outline = loadedNote.outline || null;
      }
      if (t === 'dual') {
        state.reader.annotations = loadedNote.annotations || [];
        state.reader.bookmarks = loadedNote.bookmarks || [];
        state.reader.essays = loadedNote.essays || {};
      }
      state.aiCo = !!loadedNote.aiCo;
      /* Task 2.1：优先用 note.spec；无 spec 时调 migrateLegacyNote 兜底（兼容旧笔记） */
      if (loadedNote.spec && loadedNote.spec.type) {
        state.spec = loadedNote.spec;
      } else if (window.ZX && typeof window.ZX.migrateLegacyNote === 'function') {
        try {
          var migrated = window.ZX.migrateLegacyNote(JSON.parse(JSON.stringify(loadedNote)));
          if (migrated && migrated.spec) state.spec = migrated.spec;
        } catch (e) { /* 静默，渲染层兜底 */ }
      }
    } else {
      /* Task 2.3：新建笔记即时生成 id 并 upsert 空白条目（后续 close 时覆盖同 id） */
      state.currentNoteId = options.noteId || ('n-' + Date.now());
    }
    state.suggestOn = true;
    state.suggestActive = false;
    removeSuggest();

    /* 若总览开着，先关掉（避免层叠） */
    if (window.ZX_OVERVIEW && window.ZX_OVERVIEW.isOpen && window.ZX_OVERVIEW.isOpen()) window.ZX_OVERVIEW.close();

    var root = ensureRoot();
    root.innerHTML =
      buildTopbar() +
      buildMain() +
      buildFoot();
    root.hidden = false;
    state.open = true;
    /* 底部导航栏淡出（点击屏幕显示） */
    document.body.classList.add('is-ne-open');
    bindEvents();
    afterMount();
  }

  /* Task 2.1：从 DOM/state 收集当前笔记内容（各模板字段） */
  function collectNote() {
    /* Task 2.2：close 前先把 DOM 编辑同步回 spec，避免下次 open 读到陈旧 spec */
    syncSpecFromDom();
    var note = {
      id: state.currentNoteId || ('n-' + Date.now()),
      title: state.title || '无标题笔记',
      template: state.template,
      aiCo: !!state.aiCo
    };
    /* Task 2.1：spec 是统一写回字段（与 legacy 字段并存，渲染器优先读 spec） */
    if (state.spec) {
      note.spec = state.spec;
    }
    if (state.template === 'doc' || state.template === 'dual') {
      var body = $('[data-ne-docbody]') || $('[data-ne-readertext]');
      note.body = body ? body.innerHTML : (state.noteBody || '');
    }
    if (state.template === 'canvas') {
      /* 深拷贝块（剥离 DOM 临时态） */
      note.blocks = state.canvas.blocks.map(function (b) {
        return { id: b.id, x: b.x, y: b.y, type: b.type, title: b.title || '', text: b.text, aiCo: !!b.aiCo };
      });
      note.links = state.canvas.links.map(function (l) { return { from: l.from, to: l.to }; });
    }
    if (state.template === 'outline') {
      captureOutlineText();
      note.outline = state.outline ? JSON.parse(JSON.stringify(stripAiFlags(state.outline))) : null;
    }
    return note;
  }

  /* Task 2.2：DOM → state.spec 同步（doc/dual 把 contenteditable 的编辑写回 spec）
   * canvas/outline 的 spec 由 state.canvas.blocks / state.outline 派生（已是权威源） */
  function syncSpecFromDom() {
    if (state.template === 'doc') {
      var docBody = $('[data-ne-docbody]');
      if (docBody && state.spec && state.spec.type === 'section') {
        state.spec.children = collectChildrenFromDom(docBody);
      }
    } else if (state.template === 'dual') {
      var leftBox = $('[data-ne-readertext]');
      var rightBox = $('[data-ne-attachbox]');
      if (state.spec && state.spec.type === 'cols' && state.spec.cols.length >= 2) {
        if (leftBox && state.spec.cols[0][0]) {
          state.spec.cols[0][0].children = collectChildrenFromDom(leftBox);
        }
        if (rightBox && state.spec.cols[1][0]) {
          /* 附件区跳过 .ne-attach__label（标签条非 spec 块） */
          var rightChildren = [];
          $all('.ne-attach__page, [data-type]', rightBox).forEach(function (node) {
            if (node.classList.contains('ne-attach__label')) return;
            if (node.parentElement !== rightBox) return; /* 只取直接子节点 */
            rightChildren.push(nodeToSpecBlock(node));
          });
          state.spec.cols[1][0].children = rightChildren;
        }
      }
    } else if (state.template === 'canvas') {
      state.spec = buildCanvasSpec();
    } else if (state.template === 'outline') {
      state.spec = buildOutlineSpec();
    }
  }

  /* 把容器的直接子节点（spec 块或裸 <p>/<h2>）收集为 spec 块数组 */
  function collectChildrenFromDom(container) {
    var out = [];
    for (var i = 0; i < container.children.length; i++) {
      var node = container.children[i];
      out.push(nodeToSpecBlock(node));
    }
    return out;
  }

  /* 单个 DOM 节点 → spec 块（保留 data-block/data-type；缺则新建 text 块） */
  function nodeToSpecBlock(node) {
    var existingId = node.getAttribute('data-block');
    var existingType = node.getAttribute('data-type');
    if (existingId && existingType) {
      var r = findSpecBlock(existingId);
      if (r && r.block) {
        /* 克隆后更新文本（避免引用旧对象） */
        var updated = JSON.parse(JSON.stringify(r.block));
        if (updated.type === 'text' || updated.type === 'outline-node') {
          updated.text = node.innerHTML;
        }
        return updated;
      }
    }
    /* 兜底：裸 <p>/<h2>/<blockquote>/<pre> 等 → 新 text 块 */
    return _textBlock(node.outerHTML);
  }

  /* 写回前剥离运行时 aiCo 标记（保留信息但避免循环污染） */
  function stripAiFlags(node) {
    if (!node) return node;
    var copy = { id: node.id, type: node.type, text: node.text, collapsed: node.collapsed, aiCo: !!node.aiCo };
    copy.children = (node.children || []).map(stripAiFlags);
    return copy;
  }

  function close() {
    /* Task 2.1：关闭前 autosave 到 bridge.notes（自动产生轻量版本） */
    if (window.ZX_BRIDGE && window.ZX_BRIDGE.upsertNote) {
      try { window.ZX_BRIDGE.upsertNote(collectNote()); } catch (e) { /* 静默，避免保存失败阻塞关闭 */ }
    }
    if (state.suggestTimer) { clearTimeout(state.suggestTimer); state.suggestTimer = null; }
    removeSuggest();
    hideInlineToolbar();
    closeInlineChat();
    closeAllMenus();
    /* Task 4.3：丢弃未决的 AI 块编排 delta，避免跨会话残留 */
    state._pendingBlockDelta = null;
    state._pendingBlockAccept = null;
    var root = rootEl();
    root.hidden = true;
    root.innerHTML = '';
    state.open = false;
    /* 恢复底部导航栏 */
    document.body.classList.remove('is-ne-open');
    /* 返回工作台：若 notebook 提供 popView 不可用，则回退提示 */
    var nbRoot = document.querySelector('[data-nb-root]');
    if (nbRoot) {
      /* 模拟返回：交给 notebook 的返回栈 —— 这里仅确保工作台可见 */
      var wb = nbRoot.querySelector('[data-view="workbench"]');
      if (wb) toast('已保存笔记', true);
    }
  }

  function isOpen() { return !!state.open; }

  /* ----------------------------- 导出 ----------------------------- */
  window.ZX_EDITOR = {
    open: open,
    close: close,
    isOpen: isOpen,
    /* Task 2.1：暴露给 Task 4（AI 编排）/ Task 5（桌面端同步）复用 */
    BlockRenderer: BlockRenderer,
    buildDocSpec: buildDocSpec,
    buildDualSpec: buildDualSpec,
    buildCanvasSpec: buildCanvasSpec,
    buildOutlineSpec: buildOutlineSpec
  };
})();
