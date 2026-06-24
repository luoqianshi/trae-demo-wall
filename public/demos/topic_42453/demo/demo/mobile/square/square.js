/* =========================================================================
 * 「知行」App 本体 Demo —— Phase 2 / 广场页（双模式 Feed）逻辑（square.js）
 * -------------------------------------------------------------------------
 * 职责：
 *   1. 视图栈：feed（默认）→ detail / search / notif（皆右入），与 notebook 同款机制
 *   2. 双模式：xhs（图卡瀑布流，默认）/ zh（长文问答单列）
 *   3. 正反方讨论可视化：进度条 + 双 tab + 最热正/反方评论
 *   4. 搜索子页：热搜 chip + 历史 + 实时建议
 *   5. 通知子页：互动 / @我 / 关注更新
 *   6. 市场页：第二次点击广场 tab 进入，类 GitHub 的 AI 资源市场（智能体/工作流/设计/技能）
 * 依赖：../../demo/shared/icons.js（ZX.icon）、../../demo/shared/mock-data.js（ZX_MOCK）
 * 挂载：window.ZX_SQUARE
 * 约束：原生 JS + 事件委托，无框架，无 alert/prompt/confirm；不修改 shell / notebook
 * =======================================================================*/

(function () {
  'use strict';

  /* ----------------------------- 工具函数 ----------------------------- */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }
  function el(tag, cls, html) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }
  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }
  function svg(inner, size) {
    size = size || 22;
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" '
      + 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + inner + '</svg>';
  }
  function zicon(name, size) {
    return (window.ZX && typeof window.ZX.icon === 'function')
      ? window.ZX.icon(name, size || 22)
      : svg('', size);
  }

  /* 自绘 icon（共享库未覆盖部分） */
  var IC = {
    back: function (n) { return zicon('arrow-left', n || 22); },
    search: function (n) { return zicon('search', n || 22); },
    like: function (n) { return zicon('like', n || 16); },
    dislike: function (n) { return zicon('dislike', n || 16); },
    comment: function (n) { return zicon('comment', n || 16); },
    share: function (n) { return zicon('share', n || 16); },
    plus: function (n) { return zicon('plus', n || 13); },
    check: function (n) { return zicon('check', n || 13); },
    close: function (n) { return zicon('close', n || 13); },
    clock: function (n) { return svg('<circle cx="12" cy="12" r="8"/><path d="M12 8v4l3 2"/>', n); },
    bell: function (n) { return svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9z"/><path d="M10 21h4"/>', n); },
    more: function (n) { return svg('<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>', n); },
    bookmark: function (n) { return svg('<path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>', n); },
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

  /* ----------------------------- Mock 数据访问 ----------------------------- */
  function mock() {
    return window.ZX_MOCK || (window.ZX && window.ZX.mock) || { notes: [], debates: {}, users: [], feed: {} };
  }
  function noteById(id) {
    var n = mock().notes || [];
    for (var i = 0; i < n.length; i++) { if (n[i].id === id) return n[i]; }
    return null;
  }
  function userById(id) {
    var u = mock().users || [];
    for (var i = 0; i < u.length; i++) { if (u[i].id === id) return u[i]; }
    return { id: id, name: '未知', initials: '?', avatarColor: '#6B655C', authority: 0, domain: '', bio: '' };
  }
  function debateByNote(noteId) {
    var d = mock().debates || {};
    return d[noteId] || null;
  }

  /* 头像 HTML */
  function avatar(user, size) {
    size = size || 24;
    var fontSize = Math.max(9, Math.round(size * 0.46));
    return '<span class="sq-avatar" style="width:' + size + 'px;height:' + size + 'px;'
      + 'background:' + (user.avatarColor || '#1D5B7A') + ';'
      + 'font-size:' + fontSize + 'px">'
      + escapeHtml(user.initials || (user.name || '?').charAt(0))
      + '</span>';
  }

  /* 字符串 hash → 用于稳定的伪随机 */
  function hash(s) {
    var h = 0;
    for (var i = 0; i < s.length; i++) { h = (h * 31 + s.charCodeAt(i)) >>> 0; }
    return h;
  }

  function formatCount(n) {
    if (n >= 10000) return (n / 10000).toFixed(1) + 'w';
    if (n >= 1000) return (n / 1000).toFixed(1) + 'k';
    return String(n);
  }

  /* 计算笔记正反方人数（无 debate 数据时按 likes/dislikes 回退） */
  function debateStats(note) {
    var d = debateByNote(note.id);
    if (d) {
      var total = note.commentCount || (d.pros.length + d.cons.length) * 20;
      return {
        pro: Math.round(total * d.proPercent / 100),
        con: Math.round(total * d.conPercent / 100),
        proPercent: d.proPercent,
        conPercent: d.conPercent,
        hasDebate: true
      };
    }
    return {
      pro: note.likes || 0,
      con: note.dislikes || 0,
      proPercent: note.likes ? Math.round(note.likes * 100 / (note.likes + note.dislikes + 1)) : 50,
      conPercent: note.dislikes ? Math.round(note.dislikes * 100 / (note.likes + note.dislikes + 1)) : 50,
      hasDebate: false
    };
  }

  /* 信证状态派生：mock 无 trust 字段，基于 likes/dislikes/评论/沉淀量稳定推导。
   * stage ∈ candidate（候选）/ testing（考验中）/ converged（已收敛）/ refuted（存疑） */
  function deriveTrustStatus(note) {
    var likes = note.likes || 0;
    var dislikes = note.dislikes || 0;
    var comments = note.commentCount || 0;
    var sediment = note.sedimentCount || 0;
    var total = likes + dislikes;
    var ratio = total > 0 ? likes / total : 0.5;
    var conRatio = total > 0 ? dislikes / total : 0;
    var stage, label, pct;
    if (ratio >= 0.9 && sediment >= 100) {
      stage = 'converged'; label = '已收敛';
      pct = Math.min(96, Math.round(82 + ratio * 16));
    } else if (conRatio >= 0.35 || comments >= 120) {
      stage = 'testing'; label = '考验中';
      pct = Math.round(46 + ratio * 26);
    } else if (dislikes > likes) {
      stage = 'refuted'; label = '存疑';
      pct = Math.round(18 + ratio * 22);
    } else {
      stage = 'candidate'; label = '候选';
      pct = Math.round(28 + Math.min(42, comments / 3));
    }
    pct = Math.max(12, Math.min(96, pct));
    return { stage: stage, label: label, pct: pct };
  }

  /* ----------------------------- 状态 ----------------------------- */
  var rootEl = null;         // 广场根节点（init 时赋值，供 sheet/toast 挂载）
  var state = {
    stack: ['feed'],
    viewParams: {},
    commentStance: 'pro',    // 详情页评论输入框当前立场 pro | con
    followed: {},            // authorId -> bool
    likedNotes: {},          // noteId -> bool
    dislikedNotes: {},       // noteId -> bool
    likedComments: {},       // commentId -> bool
    dislikedComments: {},    // commentId -> bool
    bookmarked: {},          // noteId -> bool
    userComments: {},        // noteId -> { pro: [cmt], con: [cmt] } 我发表的评论
    expandedEval: {},        // commentId -> bool 是否展开二层评价
    allCommentsShown: {},    // noteId -> bool 是否展开当前方全部评论
    searchHistory: ['界面阻抗', 'LiNbO₃ 涂层', '钠枝晶'],
    searchKw: '',
    searchShowHistory: false,
    feedMode: 'xhs',         // 广场双视图：xhs（全屏翻页，默认）/ graph（知识星图）
    initialized: false
  };

  var MAX_STACK = 5;
  var AXIS = { feed: 'none', detail: 'right', search: 'right', notif: 'right', 'graph-timeline': 'right', 'graph-topic': 'right', 'graph-category': 'right' };
  var EXIT_BY_AXIS = { right: 'left', none: 'none' };

  var STREAM_META = {
    knowledge:  { tag: '知识' },
    creation:   { tag: '创作' },
    review:     { tag: '复盘' },
    discussion: { tag: '讨论' }
  };

  /* ----------------------------- 视图栈 ----------------------------- */
  function viewEl(name) { return $('.sq-view[data-view="' + name + '"]'); }

  function applyStack() {
    $all('.sq-view').forEach(function (v) {
      v.classList.remove('is-on', 'is-covered');
      v.removeAttribute('data-exit');
    });
    state.stack.forEach(function (name, i) {
      var v = viewEl(name);
      if (!v) return;
      if (i === state.stack.length - 1) v.classList.add('is-on');
      else v.classList.add('is-covered');
    });
    if (state.stack.length >= 2) {
      var top = state.stack[state.stack.length - 1];
      var under = viewEl(state.stack[state.stack.length - 2]);
      if (under) under.setAttribute('data-exit', EXIT_BY_AXIS[AXIS[top]] || 'none');
    }
    /* 进入子视图（stack 深度 > 1）时隐藏底部 tab 栏，营造沉浸氛围 */
    document.body.classList.toggle('is-square-immersive', state.stack.length > 1);
  }

  function pushView(name, params) {
    if (state.stack[state.stack.length - 1] === name && !params) return;
    if (state.stack.length >= MAX_STACK) {
      toast('页面栈已满，请先返回');
      return;
    }
    /* 离开 feed 进入子页时，若知识星图正在运行物理模拟，暂停以省 CPU */
    if (state.feedMode === 'graph' && name !== 'feed') stopGraphAnim();
    state.stack.push(name);
    state.viewParams[name] = params || null;
    applyStack();
    afterEnter(name, params);
  }

  function popView() {
    if (state.stack.length <= 1) return;
    var leaving = state.stack.pop();
    state.viewParams[leaving] = null;
    applyStack();
    var top = state.stack[state.stack.length - 1];
    /* 返回 feed 且在 graph 模式：重新渲染主图谱（节点数据可能被子页覆盖） */
    if (top === 'feed' && state.feedMode === 'graph') {
      renderFeed();
    }
    /* 返回 graph-category：重设 currentGraphSvg + 重启力导向 */
    else if (top === 'graph-category' && !graphAnim) {
      currentGraphSvg = $('[data-sq-gcat-scroll] .sq-graph__svg') || currentGraphSvg;
      graphAnim = requestAnimationFrame(graphTick);
    }
    /* 返回 graph-topic：重设 currentGraphSvg + 重启力导向 */
    else if (top === 'graph-topic' && !graphAnim) {
      currentGraphSvg = $('[data-sq-gtp-scroll] .sq-graph__svg') || currentGraphSvg;
      graphAnim = requestAnimationFrame(graphTick);
    }
  }

  function afterEnter(name, params) {
    if (name === 'detail') renderDetail(params && params.noteId);
    if (name === 'search') renderSearch();
    if (name === 'notif') renderNotif();
    if (name === 'graph-timeline') renderGraphTimeline(params && params.noteId);
    if (name === 'graph-topic') renderGraphTopic(params && params.topicId);
    if (name === 'graph-category') renderGraphCategory(params && params.catId);
  }

  /* ----------------------------- Toast ----------------------------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('[data-sq-toast]');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('is-show');
    if (toastTimer) clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('is-show'); }, 1800);
  }

  /* ----------------------------- Feed 顶栏 ----------------------------- */
  function renderFeedTop() {
    var top = $('[data-sq-feed-top]');
    if (!top) return;
    /* 顶栏：左 ☰ 菜单 / 右 🔍 搜索。
     * ⋮ 更多只在笔记详情页出现；🔔 通知已移除。
     * Feed ⇄ 市场 切换提示叠在底部「广场」tab 图标角标上，重复点击该 tab 循环切换。 */
    top.innerHTML =
      '<div class="sq-feed__top-left">'
      + '<button class="sq-iconbtn" data-action="menu" aria-label="功能菜单">' + svg('<path d="M4 7h16M4 12h16M4 17h16"/>', 22) + '</button>'
      + '</div>'
      + '<div class="sq-feed__top-right">'
      + '<button class="sq-iconbtn" data-action="open-search" aria-label="搜索">' + IC.search() + '</button>'
      + '</div>';
  }

  /* ----------------------------- Feed 列表 ----------------------------- */
  function feedNotes() {
    var m = mock();
    var notes = m.notes || [];
    // 闭环 ③：bridge 里「我」的发布置顶显示（带 _bridge 标记）
    var bridgeNotes = (window.ZX_BRIDGE && window.ZX_BRIDGE.getPublishedNotes()) || [];
    var ordered = bridgeNotes.slice();
    var seen = {};
    bridgeNotes.forEach(function (n) { seen[n.id] = true; });
    var feed = m.feed || {};
    ['discussion', 'knowledge', 'creation', 'review'].forEach(function (stream) {
      (feed[stream] || []).forEach(function (id) {
        if (seen[id]) return;
        seen[id] = true;
        for (var i = 0; i < notes.length; i++) {
          if (notes[i].id === id) { ordered.push(notes[i]); break; }
        }
      });
    });
    // 补齐未命中的（确保 6-8 条）
    notes.forEach(function (n) {
      if (ordered.length >= 8) return;
      if (!seen[n.id]) { seen[n.id] = true; ordered.push(n); }
    });
    return ordered.slice(0, 8);
  }

  /* 把 note.body 转成页数组：body 是数组则直接用，字符串则单页 */
  function notePages(note) {
    if (Array.isArray(note.body)) return note.body;
    if (typeof note.body === 'string' && note.body.trim()) return [note.body];
    if (note.summary) return ['<p>' + escapeHtml(note.summary) + '</p>'];
    return ['<p>（暂无内容）</p>'];
  }

  /* 安全取 featuredPage 索引 */
  function featuredPageIndex(note, pages) {
    var fp = note.featuredPage;
    if (typeof fp !== 'number' || fp < 0 || fp >= pages.length) return 0;
    return fp;
  }

  /* 渲染一篇笔记的整屏 section（含内层水平翻页 + 右下角赞踩） */
  function renderNoteSection(note) {
    var author = userById(note.authorId);
    var pages = notePages(note);
    var stream = note.stream || 'knowledge';
    var meta = STREAM_META[stream] || STREAM_META.knowledge;
    var liked = state.likedNotes[note.id];
    var disliked = state.dislikedNotes[note.id];

    var pagesHtml = pages.map(function (html, idx) {
      return '<article class="sq-feed__page" data-action="open-note" data-id="' + note.id + '" data-page="' + idx + '">'
        + '<div class="sq-feed__page-head">'
          + avatar(author, 28)
          + '<span class="sq-feed__page-name">' + escapeHtml(author.name) + '</span>'
          + '<span class="sq-feed__page-score">' + author.authority + '</span>'
          + '<span class="sq-feed__page-stream">' + escapeHtml(meta.tag) + '</span>'
        + '</div>'
        + '<div class="sq-feed__page-body">'
          + (idx === 0 ? '<h2 class="sq-feed__page-title">' + escapeHtml(note.title) + '</h2>' : '')
          + '<div class="sq-feed__page-text">' + html + '</div>'
        + '</div>'
      + '</article>';
    }).join('');

    var isSingle = pages.length <= 1;
    var dotsHtml = isSingle ? '' : '<div class="sq-feed__page-dots" data-sq-dots="' + note.id + '">1/' + pages.length + '</div>';

    /* 赞踩按钮固定在 note 右下角，不随翻页移动 */
    var actionsHtml = '<div class="sq-feed__note-actions">'
      + '<button class="sq-feed__act sq-feed__act--like' + (liked ? ' is-on' : '') + '" data-action="like-note" data-id="' + note.id + '" aria-label="赞同">'
        + IC.like(22) + '<span>' + formatCount((note.likes || 0) + (liked ? 1 : 0)) + '</span>'
      + '</button>'
      + '<button class="sq-feed__act sq-feed__act--dislike' + (disliked ? ' is-on' : '') + '" data-action="dislike-note" data-id="' + note.id + '" aria-label="反对">'
        + IC.dislike(22) + '<span>' + formatCount((note.dislikes || 0) + (disliked ? 1 : 0)) + '</span>'
      + '</button>'
    + '</div>';

    return '<section class="sq-feed__note" data-note-id="' + note.id + '" data-featured="' + featuredPageIndex(note, pages) + '">'
      + '<div class="sq-feed__note-pages' + (isSingle ? ' is-single' : '') + '" data-sq-pages="' + note.id + '">'
        + pagesHtml
      + '</div>'
      + dotsHtml
      + actionsHtml
    + '</section>';
  }

  /* JS 动态分页：把内容按可视高度切分成多页（参考小说软件左右翻页）
   *  - 创建隐藏测量 div，逐段测量高度
   *  - 按可用高度累加，超出则切到下一页
   *  - 返回页数组（每项是 html 字符串） */
  function paginateContent(htmlChunks, pageWidth, pageHeight, headHeight) {
    if (!pageWidth || !pageHeight) return htmlChunks;
    var measure = document.createElement('div');
    measure.style.cssText =
      'position:absolute;visibility:hidden;left:-9999px;' +
      'width:' + pageWidth + 'px;' +
      'padding:0 20px;' +
      'box-sizing:border-box;' +
      'font-family:var(--font-display);font-size:16px;line-height:1.8;' +
      'color:var(--ink-900);';
    document.body.appendChild(measure);

    /* 把所有 chunks 合并并按块级元素拆分 */
    var temp = document.createElement('div');
    htmlChunks.forEach(function (chunk) { temp.innerHTML += chunk; });
    var blocks = Array.prototype.slice.call(temp.children);
    /* 如果没有块级子元素（纯文本），整体作为一段 */
    if (!blocks.length) {
      temp.innerHTML = '<p>' + temp.innerHTML + '</p>';
      blocks = Array.prototype.slice.call(temp.children);
    }

    var available = pageHeight - headHeight - 16; /* 16 = body margin-top */
    var pages = [];
    var current = [];
    var currentH = 0;

    blocks.forEach(function (b) {
      measure.innerHTML = '';
      measure.appendChild(b.cloneNode(true));
      var h = measure.offsetHeight + 14; /* 14 = p margin-bottom */
      /* 单段就超长：硬切（按行高估算） */
      if (h > available && current.length === 0) {
        var text = (b.textContent || '').trim();
        var lineH = 16 * 1.8;
        var maxLines = Math.floor(available / lineH);
        var charsPerLine = Math.floor((pageWidth - 40) / 16);
        var perPage = Math.max(1, maxLines * charsPerLine);
        for (var i = 0; i < text.length; i += perPage) {
          var slice = text.slice(i, i + perPage);
          pages.push('<p>' + escapeHtml(slice) + '</p>');
        }
        return;
      }
      if (currentH + h > available && current.length > 0) {
        pages.push(current.join(''));
        current = [];
        currentH = 0;
      }
      current.push(b.outerHTML);
      currentH += h;
    });
    if (current.length) pages.push(current.join(''));

    document.body.removeChild(measure);
    return pages.length ? pages : htmlChunks;
  }

  /* 渲染后动态分页：遍历每个 note，测量并切分 */
  function paginateNotes() {
    $all('.sq-feed__note').forEach(function (section) {
      var noteId = section.getAttribute('data-note-id');
      var note = noteById(noteId);
      if (!note) return;
      var pagesEl = $('[data-sq-pages]', section);
      if (!pagesEl) return;

      var rect = pagesEl.getBoundingClientRect();
      var pageWidth = rect.width || section.clientWidth;
      var pageHeight = rect.height || section.clientHeight;
      if (!pageWidth || !pageHeight) return;

      /* 测量 head 高度（取第一页的 head） */
      var firstPage = $('.sq-feed__page', pagesEl);
      var headEl = firstPage ? $('.sq-feed__page-head', firstPage) : null;
      var headH = headEl ? headEl.offsetHeight + 18 : 60;

      var originalPages = notePages(note);
      var newPages = paginateContent(originalPages, pageWidth, pageHeight, headH);
      if (newPages.length === originalPages.length) return; /* 无需分页 */

      /* 重新渲染页 DOM */
      var author = userById(note.authorId);
      var stream = note.stream || 'knowledge';
      var meta = STREAM_META[stream] || STREAM_META.knowledge;

      pagesEl.innerHTML = newPages.map(function (html, idx) {
        return '<article class="sq-feed__page" data-action="open-note" data-id="' + note.id + '" data-page="' + idx + '">'
          + '<div class="sq-feed__page-head">'
            + avatar(author, 28)
            + '<span class="sq-feed__page-name">' + escapeHtml(author.name) + '</span>'
            + '<span class="sq-feed__page-score">' + author.authority + '</span>'
            + '<span class="sq-feed__page-stream">' + escapeHtml(meta.tag) + '</span>'
          + '</div>'
          + '<div class="sq-feed__page-body">'
            + (idx === 0 ? '<h2 class="sq-feed__page-title">' + escapeHtml(note.title) + '</h2>' : '')
            + '<div class="sq-feed__page-text">' + html + '</div>'
          + '</div>'
        + '</article>';
      }).join('');

      pagesEl.classList.toggle('is-single', newPages.length <= 1);

      /* 更新页码指示器 */
      var dotsEl = $('[data-sq-dots]', section);
      if (dotsEl) {
        if (newPages.length <= 1) {
          dotsEl.style.display = 'none';
        } else {
          dotsEl.style.display = '';
          dotsEl.textContent = '1/' + newPages.length;
        }
      } else if (newPages.length > 1) {
        /* 之前是单页，现在多页，需要补 dots */
        var d = el('div', 'sq-feed__page-dots');
        d.setAttribute('data-sq-dots', note.id);
        d.textContent = '1/' + newPages.length;
        section.appendChild(d);
      }

      /* 定位到 featuredPage */
      var fp = featuredPageIndex(note, newPages);
      if (fp > 0) {
        pagesEl.scrollLeft = fp * pagesEl.clientWidth;
        updateDots(section);
      }
    });
  }

  /* 同步页码指示器：根据内层 scrollLeft 计算当前页 */
  function updateDots(section) {
    var pagesEl = $('[data-sq-pages]', section);
    var dotsEl = $('[data-sq-dots]', section);
    if (!pagesEl || !dotsEl) return;
    var idx = Math.round(pagesEl.scrollLeft / pagesEl.clientWidth) + 1;
    var total = $all('.sq-feed__page', pagesEl).length;
    dotsEl.textContent = idx + '/' + total;
  }

  function renderFeed() {
    var scroller = $('[data-sq-feed-scroll]');
    if (!scroller) return;
    var notes = feedNotes();
    /* 知识星图模式：双层节点图谱 */
    if (state.feedMode === 'graph') {
      scroller.removeAttribute('data-mode');
      renderFeedGraph(scroller, notes);
      return;
    }
    /* 全屏翻页模式（默认） */
    scroller.setAttribute('data-mode', 'xhs');
    scroller.innerHTML = notes.map(renderNoteSection).join('');
    /* 定位每篇笔记到 featuredPage */
    $all('.sq-feed__note', scroller).forEach(function (section) {
      var fp = parseInt(section.getAttribute('data-featured'), 10) || 0;
      var pagesEl = $('[data-sq-pages]', section);
      if (pagesEl && fp > 0) {
        requestAnimationFrame(function () {
          pagesEl.scrollLeft = fp * pagesEl.clientWidth;
          updateDots(section);
        });
      }
    });
    /* JS 动态分页：文字超出时切分成多页（左右翻页查看） */
    requestAnimationFrame(paginateNotes);
  }

  /* ----------------------------- 详情子页 ----------------------------- */
  function renderDetail(noteId) {
    var top = $('[data-sq-detail-top]');
    var scroller = $('[data-sq-detail-scroll]');
    var foot = $('[data-sq-detail-foot]');
    if (!top || !scroller) return;
    var note = noteById(noteId);
    if (!note) {
      /* Bug 修复：note 查不到时仍要渲染顶栏（含返回按钮），否则用户卡死在详情页 */
      top.innerHTML =
        '<button class="sq-iconbtn" data-action="pop" aria-label="返回">' + IC.back() + '</button>'
        + '<h2 class="sq-detail__title">笔记不可见</h2>'
        + '<span class="sq-iconbtn" aria-hidden="true" style="visibility:hidden"></span>';
      scroller.innerHTML = '<div class="sq-empty">笔记不存在或已被作者删除</div>';
      if (foot) foot.innerHTML = '';
      return;
    }
    var author = userById(note.authorId);
    var followed = !!state.followed[note.authorId];

    top.innerHTML =
      '<button class="sq-iconbtn" data-action="pop" aria-label="返回">' + IC.back() + '</button>'
      + '<h2 class="sq-detail__title">' + escapeHtml(note.title) + '</h2>'
      + '<button class="sq-follow' + (followed ? ' is-on' : '') + '" data-action="follow" data-id="' + note.authorId + '">'
        + (followed ? IC.check(13) + '已关注' : IC.plus(13) + '关注')
      + '</button>'
      + '<button class="sq-iconbtn" data-action="more" aria-label="更多">' + IC.more() + '</button>';

    var tagsHtml = (note.tags || []).map(function (t) {
      return '<span class="sq-tag" data-action="tag-search" data-tag="' + escapeHtml(t) + '">#' + escapeHtml(t) + '</span>';
    }).join('');

    scroller.innerHTML =
      '<div class="sq-detail__author">'
        + avatar(author, 40)
        + '<div class="sq-detail__author-info">'
          + '<div class="sq-detail__author-row">'
            + '<span class="sq-detail__author-name">' + escapeHtml(author.name) + '</span>'
            + '<span class="sq-badge">' + author.authority + '</span>'
          + '</div>'
          + '<p class="sq-detail__author-bio">' + escapeHtml(author.bio || '') + '</p>'
        + '</div>'
      + '</div>'
      + '<h1 class="sq-detail__h">' + escapeHtml(note.title) + '</h1>'
      + '<div class="sq-detail__body">' + (note.body || ('<p>' + escapeHtml(note.summary || '') + '</p>')) + '</div>'
      + '<div class="sq-detail__tags">' + tagsHtml + '</div>'
      + renderDebate(note);

    var stance = state.commentStance || 'pro';
    foot.innerHTML =
      '<div class="sq-stance" data-sq-stance>'
        + '<button class="sq-stance__btn' + (stance === 'pro' ? ' is-active' : '') + '" data-action="set-stance" data-stance="pro"><span class="sq-dot sq-dot--pro"></span>支持</button>'
        + '<button class="sq-stance__btn' + (stance === 'con' ? ' is-active' : '') + '" data-action="set-stance" data-stance="con"><span class="sq-dot sq-dot--con"></span>反对</button>'
      + '</div>'
      + '<input class="sq-input" data-sq-comment-input type="text" placeholder="写下评论…" aria-label="评论">'
      + '<button class="sq-iconbtn sq-send" data-action="send-comment" aria-label="发送评论">' + zicon('arrow-up', 20) + '</button>';

    state.commentStance = 'pro';
  }

  /* 评论区可视化 */
  function renderDebate(note) {
    var st = debateStats(note);
    var total = note.commentCount || 0;

    var header =
      '<div class="sq-debate__head">'
        + '<span class="sq-debate__head-title">' + IC.comment(14) + '评论区</span>'
        + '<span class="sq-debate__head-count">' + total + ' 人参与</span>'
      + '</div>';

    var bar =
      '<div class="sq-debate__bar" title="支持 ' + st.proPercent + '% / 反对 ' + st.conPercent + '%">'
        + '<div class="sq-debate__bar-pro" style="flex: 0 0 ' + st.proPercent + '%">支持 ' + st.proPercent + '%</div>'
        + '<div class="sq-debate__bar-con" style="flex: 0 0 ' + st.conPercent + '%">' + st.conPercent + '% 反对</div>'
      + '</div>';

    var list = '<div class="sq-debate__list" data-sq-debate-list>' + renderDebateList(note) + '</div>';

    return '<section class="sq-debate" data-sq-debate>'
      + header + bar + list
    + '</section>';
  }

  function renderDebateList(note) {
    var d = debateByNote(note.id);
    var myPro = (state.userComments[note.id] && state.userComments[note.id].pro) || [];
    var myCon = (state.userComments[note.id] && state.userComments[note.id].con) || [];

    if (!d) {
      // 无讨论树：先展示我发表的，再补两条 mock 评论
      var mine = myPro.concat(myCon);
      return mine.map(function (c, idx) { return renderComment(c, c._side || 'pro', idx); }).join('')
        + renderMockComments(note, 'pro');
    }

    // 合并 pros + cons，标记 _side
    var pool = (d.pros || []).map(function (c) { c._side = 'pro'; return c; })
      .concat((d.cons || []).map(function (c) { c._side = 'con'; return c; }));
    myPro.forEach(function (c) { c._side = 'pro'; pool.push(c); });
    myCon.forEach(function (c) { c._side = 'con'; pool.push(c); });

    if (!pool.length) return '<div class="sq-empty">暂无评论，抢沙发</div>';

    // 按 likes 降序排序
    pool.sort(function (a, b) { return (b.likes || 0) - (a.likes || 0); });

    // 排列规则：1.绝对值最大 2.对立面绝对值最大 3.之后全部按绝对值降序
    var result = [];
    var first = pool.shift();
    result.push(first);

    if (pool.length > 0) {
      var oppositeSide = first._side === 'pro' ? 'con' : 'pro';
      var oppositeIdx = -1;
      for (var i = 0; i < pool.length; i++) {
        if (pool[i]._side === oppositeSide) { oppositeIdx = i; break; }
      }
      if (oppositeIdx >= 0) result.push(pool.splice(oppositeIdx, 1)[0]);
    }
    result = result.concat(pool);

    return result.map(function (c, idx) {
      return renderComment(c, c._side, idx);
    }).join('');
  }

  function renderComment(c, side, idx) {
    var u = userById(c.authorId);
    var liked = state.likedComments[c.id];
    var disliked = state.dislikedComments[c.id];
    var typeLabel = { support: '支持', refute: '反驳', correct: '纠错', extend: '延伸' }[c.type] || '评论';
    var sideLabel = side === 'pro' ? '支持方' : '反对方';
    var evals = c.evaluations || [];
    var hasEval = evals.length > 0;
    var expanded = !!state.expandedEval[c.id];
    var mineCls = c._mine ? ' sq-cmt--mine' : '';
    var expCls = (hasEval && expanded) ? ' is-expanded' : '';
    return '<div class="sq-cmt zx-reveal' + mineCls + expCls + '" data-side="' + side + '" style="--i:' + idx + '">'
      + '<div class="sq-cmt__head">'
        + avatar(u, 22)
        + '<span class="sq-cmt__name">' + escapeHtml(u.name) + '</span>'
        + (c._mine ? '<span class="sq-cmt__mine-tag">我</span>' : '<span class="sq-cmt__score">★' + u.authority + '</span>')
        + '<span class="sq-cmt__side" data-side="' + side + '">' + sideLabel + '</span>'
        + '<span class="sq-cmt__type" data-type="' + c.type + '">' + typeLabel + '</span>'
      + '</div>'
      + '<p class="sq-cmt__body">' + escapeHtml(c.body) + '</p>'
      + '<div class="sq-cmt__foot">'
        + '<button class="sq-cmt__eval-toggle" data-action="toggle-eval" data-id="' + c.id + '"'
          + (hasEval ? '' : ' disabled') + '>'
          + (hasEval ? evals.length + ' 条二层评价' : '回复')
          + (hasEval ? '<span class="sq-cmt__caret' + (expanded ? ' is-open' : '') + '">' + IC.caret(13) + '</span>' : '')
        + '</button>'
        + '<div class="sq-cmt__acts">'
          + '<button class="sq-cmt__dislike' + (disliked ? ' is-on' : '') + '" data-action="dislike-comment" data-id="' + c.id + '" aria-label="反对">'
            + IC.dislike(13)
          + '</button>'
          + '<button class="sq-cmt__like' + (liked ? ' is-on' : '') + '" data-action="like-comment" data-id="' + c.id + '" aria-label="赞同">'
            + IC.like(13) + '<span>' + formatCount((c.likes || 0) + (liked ? 1 : 0)) + '</span>'
          + '</button>'
        + '</div>'
      + '</div>'
      + (hasEval ? '<div class="sq-cmt__evals">' + evals.map(renderEvaluation).join('') + '</div>' : '')
    + '</div>';
  }

  /* 二层评价：对某条正/反方观点的「支持 / 反驳 / 纠错 / 延伸」 */
  function renderEvaluation(e) {
    var u = userById(e.authorId);
    var liked = state.likedComments[e.id];
    var disliked = state.dislikedComments[e.id];
    var typeLabel = { support: '支持', refute: '反驳', correct: '纠错', extend: '延伸' }[e.type] || '评价';
    var side = (e.type === 'refute' || e.type === 'correct') ? 'con' : 'pro';
    return '<div class="sq-eval" data-side="' + side + '">'
      + '<div class="sq-eval__head">'
        + avatar(u, 18)
        + '<span class="sq-eval__name">' + escapeHtml(u.name) + '</span>'
        + '<span class="sq-eval__type" data-type="' + e.type + '">' + typeLabel + '</span>'
      + '</div>'
      + '<p class="sq-eval__body">' + escapeHtml(e.body) + '</p>'
      + '<div class="sq-eval__foot">'
        + '<div class="sq-eval__acts">'
          + '<button class="sq-eval__dislike' + (disliked ? ' is-on' : '') + '" data-action="dislike-comment" data-id="' + e.id + '" aria-label="反对">'
            + IC.dislike(12)
          + '</button>'
          + '<button class="sq-eval__like' + (liked ? ' is-on' : '') + '" data-action="like-comment" data-id="' + e.id + '" aria-label="赞同">'
            + IC.like(12) + '<span>' + formatCount((e.likes || 0) + (liked ? 1 : 0)) + '</span>'
          + '</button>'
        + '</div>'
      + '</div>'
    + '</div>';
  }

  /* 无 debate 时造的两条 mock 评论 */
  function renderMockComments(note, side) {
    var pool = mock().users || [];
    var samples = side === 'pro'
      ? [
          { uid: 'u-zhangheng', text: '论点扎实。' + (note.summary || '').slice(0, 50) + '…我支持这个方向，关键变量抓得准。', likes: Math.max(40, (note.likes || 0) >> 3), type: 'support' },
          { uid: 'u-chenmb', text: '补充一组数据：相同方法学下复现，结论稳健。可作为该方向的参考。', likes: Math.max(20, (note.likes || 0) >> 4), type: 'extend' }
        ]
      : [
          { uid: 'u-shenyan', text: '对此持保留态度。样本量与测量窗口都偏小，长循环下结论可能反转。', likes: Math.max(15, (note.dislikes || 0) << 1), type: 'refute' },
          { uid: 'u-guci', text: '纠错一处：摘要中的数字单位需要复核，建议作者补充原始来源。', likes: Math.max(8, (note.dislikes || 0)), type: 'correct' }
        ];
    return samples.map(function (s, idx) {
      var user = null;
      for (var i = 0; i < pool.length; i++) { if (pool[i].id === s.uid) user = pool[i]; }
      if (!user) user = { id: s.uid, name: '匿名', initials: '?', avatarColor: '#6B655C', authority: 50 };
      return renderComment({
        id: note.id + '-' + side + '-' + idx,
        authorId: s.uid,
        body: s.text,
        likes: s.likes,
        type: s.type,
        evaluations: []
      }, side, idx);
    }).join('');
  }

  /* 局部刷新评论列表 */
  function refreshDebateList(note) {
    if (!note) return;
    var list = $('[data-sq-debate-list]');
    if (list) list.innerHTML = renderDebateList(note);
  }

  /* 底部「更多」动作面板 */
  function openSheet() {
    closeSheet();
    if (!rootEl) return;
    var wrap = el('div', 'sq-sheet-wrap');
    wrap.setAttribute('data-sq-sheet', '');
    wrap.innerHTML =
      '<div class="sq-sheet-mask" data-action="close-sheet"></div>'
      + '<div class="sq-sheet" role="dialog" aria-modal="true" aria-label="更多操作">'
        + '<div class="sq-sheet__handle"></div>'
        + '<button class="sq-sheet__item" data-action="sheet-share">' + IC.share(18) + '<span>分享链接</span></button>'
        + '<button class="sq-sheet__item" data-action="sheet-bookmark">' + IC.bookmark(18) + '<span>收藏这篇笔记</span></button>'
        + '<button class="sq-sheet__item" data-action="sheet-mute">' + IC.clock(18) + '<span>不感兴趣</span></button>'
        + '<button class="sq-sheet__item sq-sheet__item--warn" data-action="sheet-report">' + IC.flame(18) + '<span>举报内容</span></button>'
        + '<button class="sq-sheet__cancel" data-action="close-sheet">取消</button>'
      + '</div>';
    rootEl.appendChild(wrap);
    requestAnimationFrame(function () { wrap.classList.add('is-open'); });
  }
  function closeSheet() {
    var w = $('[data-sq-sheet]');
    if (w && w.parentNode) w.parentNode.removeChild(w);
  }

  /* 赞/踩原因弹窗：强制思考，不让情绪主导 */
  var reasonState = { action: null, noteId: null };
  function showReasonModal(action, noteId) {
    closeReasonModal();
    if (!rootEl) return;
    reasonState.action = action;
    reasonState.noteId = noteId;
    var isDislike = action === 'dislike-note';
    var title = isDislike ? '反对' : '赞同';
    var confirmLabel = isDislike ? '确认反对' : '确认赞同';
    var wrap = el('div', 'sq-reason-wrap');
    wrap.setAttribute('data-sq-reason', '');
    wrap.innerHTML =
      '<div class="sq-reason-mask" data-action="close-reason"></div>'
      + '<div class="sq-reason-modal" role="dialog" aria-modal="true" aria-label="' + title + '原因">'
        + '<h3 class="sq-reason__title">' + title + '</h3>'
        + '<p class="sq-reason__hint">请阅读完后说明原因哦</p>'
        + '<textarea class="sq-reason__textarea" data-sq-reason-input placeholder="写下你的理由…" maxlength="200"></textarea>'
        + '<div class="sq-reason__actions">'
          + '<button class="sq-reason__btn sq-reason__btn--cancel" data-action="close-reason">取消</button>'
          + '<button class="sq-reason__btn sq-reason__btn--confirm' + (isDislike ? ' is-dislike' : '') + '" data-action="submit-reason">' + confirmLabel + '</button>'
        + '</div>'
      + '</div>';
    rootEl.appendChild(wrap);
    requestAnimationFrame(function () {
      wrap.classList.add('is-open');
      var input = $('[data-sq-reason-input]', wrap);
      if (input) input.focus();
    });
  }
  function closeReasonModal() {
    var w = $('[data-sq-reason]');
    if (w && w.parentNode) w.parentNode.removeChild(w);
    reasonState.action = null;
    reasonState.noteId = null;
  }
  function submitReason() {
    var input = $('[data-sq-reason-input]');
    var text = input && input.value.trim();
    if (!text) { toast('请先写明原因'); return; }
    var action = reasonState.action;
    var targetId = reasonState.noteId;
    if (!targetId) { closeReasonModal(); return; }

    /* 笔记赞踩 */
    if (action === 'like-note') {
      state.likedNotes[targetId] = !state.likedNotes[targetId];
      if (state.likedNotes[targetId] && state.dislikedNotes[targetId]) state.dislikedNotes[targetId] = false;
      toast(state.likedNotes[targetId] ? '已赞同 · 理由已记录' : '已取消赞同');
    } else if (action === 'dislike-note') {
      state.dislikedNotes[targetId] = !state.dislikedNotes[targetId];
      if (state.dislikedNotes[targetId] && state.likedNotes[targetId]) state.likedNotes[targetId] = false;
      toast(state.dislikedNotes[targetId] ? '已反对 · 理由已记录' : '已取消反对');
    }
    /* 评论赞踩 */
    else if (action === 'like-comment') {
      state.likedComments[targetId] = !state.likedComments[targetId];
      if (state.likedComments[targetId] && state.dislikedComments[targetId]) state.dislikedComments[targetId] = false;
      toast(state.likedComments[targetId] ? '已赞同 · 理由已记录' : '已取消赞同');
    } else if (action === 'dislike-comment') {
      state.dislikedComments[targetId] = !state.dislikedComments[targetId];
      if (state.dislikedComments[targetId] && state.likedComments[targetId]) state.likedComments[targetId] = false;
      toast(state.dislikedComments[targetId] ? '已反对 · 理由已记录' : '已取消反对');
    }

    closeReasonModal();

    /* 局部刷新按钮状态 */
    if (action === 'like-note' || action === 'dislike-note') {
      var note = noteById(targetId);
      if (!note) return;
      var section = $('.sq-feed__note[data-note-id="' + targetId + '"]');
      if (!section) return;
      var likeBtn = $('.sq-feed__act--like', section);
      var dislikeBtn = $('.sq-feed__act--dislike', section);
      if (likeBtn) {
        likeBtn.classList.toggle('is-on', !!state.likedNotes[targetId]);
        var likeSpan = likeBtn.querySelector('span');
        if (likeSpan) likeSpan.textContent = formatCount((note.likes || 0) + (state.likedNotes[targetId] ? 1 : 0));
      }
      if (dislikeBtn) {
        dislikeBtn.classList.toggle('is-on', !!state.dislikedNotes[targetId]);
        var dislikeSpan = dislikeBtn.querySelector('span');
        if (dislikeSpan) dislikeSpan.textContent = formatCount((note.dislikes || 0) + (state.dislikedNotes[targetId] ? 1 : 0));
      }
    } else if (action === 'like-comment' || action === 'dislike-comment') {
      /* 刷新评论区的按钮状态 */
      var likeCmt = $('.sq-cmt__like[data-id="' + targetId + '"], .sq-eval__like[data-id="' + targetId + '"]');
      var dislikeCmt = $('.sq-cmt__dislike[data-id="' + targetId + '"], .sq-eval__dislike[data-id="' + targetId + '"]');
      if (likeCmt) likeCmt.classList.toggle('is-on', !!state.likedComments[targetId]);
      if (dislikeCmt) dislikeCmt.classList.toggle('is-on', !!state.dislikedComments[targetId]);
    }
  }

  /* ----------------------------- 搜索子页 ----------------------------- */
  var HOT_RANKING = [
    { kw: '固态电池界面阻抗', hot: '12.4w', tag: '热' },
    { kw: '硫化物 vs 氧化物', hot: '8.7w', tag: '新' },
    { kw: '宁德时代 17Ah 良率', hot: '6.2w', tag: '' },
    { kw: 'QuantumScape QSE-5', hot: '4.8w', tag: '' },
    { kw: '钠枝晶可重复性', hot: '3.1w', tag: '' }
  ];
  var HOT_SEARCH = [
    '界面阻抗', 'LiNbO₃ 涂层', '钠枝晶',
    'SEI 膜', '半固态', 'EIS 等效电路', 'LLZO 烧结', '锂金属负极'
  ];

  function renderSearch() {
    var top = $('[data-sq-search-top]');
    if (top) {
      top.innerHTML =
        '<button class="sq-iconbtn" data-action="pop" aria-label="返回">' + IC.back() + '</button>'
        + '<div class="sq-search__input-wrap">'
          + IC.search(16)
          + '<input class="sq-search__input" data-sq-search-input type="text" placeholder="搜索笔记 / 话题 / 作者" value="' + escapeHtml(state.searchKw) + '" autocomplete="off">'
          + (state.searchKw ? '<button class="sq-search__clear" data-action="clear-search" aria-label="清空">' + IC.close(11) + '</button>' : '')
        + '</div>';
    }
    renderSearchBody();
    var input = $('[data-sq-search-input]');
    if (input) { input.focus(); input.scrollTop = input.scrollHeight; }
  }

  function renderSearchBody() {
    var body = $('[data-sq-search-body]');
    if (!body) return;
    var kw = (state.searchKw || '').trim();

    /* 有搜索关键词：显示批量预览卡 */
    if (kw) {
      var notes = mock().notes || [];
      var klower = kw.toLowerCase();
      var matches = notes.filter(function (n) {
        var blob = (n.title + ' ' + (n.summary || '') + ' ' + (n.tags || []).join(' ')).toLowerCase();
        return blob.indexOf(klower) !== -1;
      });

      if (!matches.length) {
        body.innerHTML = '<div class="sq-empty">未找到与「' + escapeHtml(kw) + '」相关的内容</div>';
        return;
      }

      body.innerHTML = '<div class="sq-search__results">'
        + matches.map(function (n) {
            var u = userById(n.authorId);
            var stream = n.stream || 'knowledge';
            var meta = STREAM_META[stream] || STREAM_META.knowledge;
            var summary = n.summary || '';
            if (!summary && typeof n.body === 'string') summary = n.body.slice(0, 80);
            if (!summary && Array.isArray(n.body)) summary = (n.body[0] || '').replace(/<[^>]+>/g, '').slice(0, 80);
            return '<div class="sq-preview-card" data-action="open-note" data-id="' + n.id + '">'
              + '<span class="sq-preview-card__stream">' + escapeHtml(meta.tag) + '</span>'
              + '<h3 class="sq-preview-card__title">' + highlight(n.title, kw) + '</h3>'
              + '<p class="sq-preview-card__summary">' + highlight(summary, kw) + '</p>'
              + '<div class="sq-preview-card__foot">'
                + avatar(u, 18)
                + '<span>' + escapeHtml(u.name) + '</span>'
                + '<div class="sq-preview-card__stats">'
                  + '<span class="sq-preview-card__stat">' + IC.comment(12) + formatCount(n.commentCount || 0) + '</span>'
                  + '<span class="sq-preview-card__stat">' + IC.like(12) + formatCount(n.likes || 0) + '</span>'
                + '</div>'
              + '</div>'
            + '</div>';
          }).join('')
      + '</div>';
      return;
    }

    /* 无关键词：热搜排名 + 热门搜索 + 历史搜索（toggle） + 推荐阅读 */
    var rankHtml = HOT_RANKING.map(function (r, idx) {
      return '<div class="sq-rank__item" data-action="search-kw" data-kw="' + escapeHtml(r.kw) + '">'
        + '<span class="sq-rank__num">' + (idx + 1) + '</span>'
        + '<span class="sq-rank__text">' + escapeHtml(r.kw) + '</span>'
        + (r.tag ? '<span class="sq-rank__tag">' + r.tag + '</span>' : '')
        + '<span class="sq-rank__hot">' + r.hot + '</span>'
      + '</div>';
    }).join('');

    var chipsHtml = HOT_SEARCH.map(function (k) {
      return '<span class="sq-trend__chip" data-action="search-kw" data-kw="' + escapeHtml(k) + '">' + escapeHtml(k) + '</span>';
    }).join('');

    /* 历史搜索 toggle 按钮 */
    var showHist = state.searchShowHistory;
    var histToggleHtml = '<button class="sq-search__history-toggle' + (showHist ? ' is-active' : '') + '" data-action="toggle-history">'
      + IC.clock(14) + '历史搜索'
    + '</button>';

    /* 历史搜索面板（toggle 打开时覆盖下方内容） */
    var histPanelHtml = '';
    if (showHist) {
      var histItems = state.searchHistory.length
        ? state.searchHistory.map(function (h, idx) {
            return '<li class="sq-history__item" data-action="search-kw" data-kw="' + escapeHtml(h) + '">'
              + IC.clock(14)
              + '<span class="sq-history__text">' + escapeHtml(h) + '</span>'
              + '<button class="sq-history__del" data-action="del-history" data-idx="' + idx + '" aria-label="删除">' + IC.close(13) + '</button>'
            + '</li>';
          }).join('')
        : '';
      histPanelHtml = '<div class="sq-search__history-panel">'
        + (state.searchHistory.length
          ? '<ul class="sq-history">' + histItems + '</ul>'
            + '<button class="sq-history__clear" data-action="clear-history">清空历史</button>'
          : '<div class="sq-empty">暂无搜索历史</div>')
      + '</div>';
    }

    /* 推荐笔记 */
    var notes = mock().notes || [];
    var recommendNotes = notes.slice(0, 3);
    var recHtml = recommendNotes.map(function (n) {
      var u = userById(n.authorId);
      return '<div class="sq-recommend__item" data-action="open-note" data-id="' + n.id + '">'
        + '<div class="sq-recommend__info">'
          + '<p class="sq-recommend__title">' + escapeHtml(n.title) + '</p>'
          + '<div class="sq-recommend__meta">'
            + avatar(u, 16)
            + '<span>' + escapeHtml(u.name) + '</span>'
            + '<span>· ' + (n.commentCount || 0) + ' 评论</span>'
          + '</div>'
        + '</div>'
      + '</div>';
    }).join('');

    body.innerHTML =
      '<div class="sq-search__section">'
        + '<div class="sq-search__head-row">'
          + '<h4 class="sq-search__h">热搜排名</h4>'
          + histToggleHtml
        + '</div>'
        + (showHist
          ? histPanelHtml
          : '<div class="sq-rank">' + rankHtml + '</div>')
      + '</div>'
      + (showHist ? '' :
        '<div class="sq-search__section">'
          + '<h4 class="sq-search__h">热门搜索</h4>'
          + '<div class="sq-trend">' + chipsHtml + '</div>'
        + '</div>')
      + (showHist ? '' :
        '<div class="sq-search__section">'
          + '<h4 class="sq-search__h">推荐阅读</h4>'
          + '<div class="sq-recommend">' + recHtml + '</div>'
        + '</div>');
  }

  function highlight(text, kw) {
    if (!kw) return escapeHtml(text);
    var lower = text.toLowerCase();
    var klower = kw.toLowerCase();
    var idx = lower.indexOf(klower);
    if (idx === -1) return escapeHtml(text);
    return escapeHtml(text.slice(0, idx))
      + '<em>' + escapeHtml(text.slice(idx, idx + kw.length)) + '</em>'
      + escapeHtml(text.slice(idx + kw.length));
  }

  function pushHistory(kw) {
    kw = (kw || '').trim();
    if (!kw) return;
    var idx = state.searchHistory.indexOf(kw);
    if (idx !== -1) state.searchHistory.splice(idx, 1);
    state.searchHistory.unshift(kw);
    if (state.searchHistory.length > 5) state.searchHistory.length = 5;
  }

  /* ----------------------------- 通知子页 ----------------------------- */
  function buildNotifs() {
    var m = mock();
    var n1 = noteById('n-chicken-or-egg-first');
    var n2 = noteById('n-why-cant-stop-short-video');
    var n3 = noteById('n-2026-graduate-job-guide');
    return {
      '互动通知': [
        { userId: 'u-zhangheng', noteId: 'n-chicken-or-egg-first', html: '<strong>张衡</strong> 赞了你的评论「从生物学角度来说确实是先有蛋…」', preview: n1 ? n1.title : '', time: '12 分钟前', read: false },
        { userId: 'u-shenyan', noteId: 'n-why-cant-stop-short-video', html: '<strong>沈砚</strong> 在《' + (n2 ? n2.title : '') + '》中反驳了你的观点', preview: '短视频的即时反馈机制确实在利用多巴胺奖励回路，但把它叫做"绑架"过于简化了…', time: '1 小时前', read: false },
        { userId: 'u-jiangyue', noteId: 'n-why-cant-stop-short-video', html: '<strong>江月</strong> 邀请你参与话题「刷短视频是个人选择还是算法绑架？」', preview: n2 ? n2.summary.slice(0, 60) + '…' : '', time: '3 小时前', read: true }
      ],
      '@ 我': [
        { userId: 'u-suqing', noteId: 'n-moonlight-saver-ledger', html: '<strong>苏青</strong> @ 了你：存钱账本里那个 50/30/20 分配法，我按你说的试了一个月。', preview: '工资到账先扣 20% 存定期，剩下的再花。第一个月居然真存下了 2000…', time: '昨天', read: false },
        { userId: 'u-liqy', noteId: 'n-kaoyan-second-try-lessons', html: '<strong>李轻语</strong> @ 了你：考研二战那篇笔记的复盘方法能分享下吗？', preview: '第一年最大的问题是只顾刷题不复盘，二战我把每道错题都拆成三个问题…', time: '2 天前', read: true }
      ],
      '关注的更新': [
        { userId: 'u-wangshi', noteId: 'n-2026-graduate-job-guide', html: '<strong>王石</strong> 发布了新笔记《2026 大学生就业指南：别再海投简历了》', preview: n3 ? n3.summary.slice(0, 60) + '…' : '', time: '昨天', read: false },
        { userId: 'u-linzw', noteId: 'n-sulfide-vs-oxide', html: '<strong>林知微</strong> 更新了讨论树「硫化物 vs 氧化物」的反方论据', preview: '硫化物电导率高但怕水，氧化物稳定但烧结难…', time: '3 天前', read: true }
      ]
    };
  }

  function renderNotif() {
    var top = $('[data-sq-notif-top]');
    var body = $('[data-sq-notif-body]');
    if (top) {
      top.innerHTML =
        '<button class="sq-iconbtn" data-action="pop" aria-label="返回">' + IC.back() + '</button>'
        + '<h2 class="sq-notif__title">通知</h2>'
        + '<button class="sq-iconbtn" data-action="read-all" aria-label="全部已读">' + IC.check(18) + '</button>';
    }
    if (!body) return;
    var groups = buildNotifs();
    var html = '';
    Object.keys(groups).forEach(function (gname) {
      html += '<h3 class="sq-notif__group-h">' + gname + '</h3>';
      html += groups[gname].map(function (n) {
        var u = userById(n.userId);
        return '<div class="sq-notif__item" data-action="open-note" data-id="' + escapeHtml(n.noteId || '') + '" role="button" tabindex="0">'
          + avatar(u, 32)
          + '<div class="sq-notif__main">'
            + '<p class="sq-notif__row">' + n.html + '</p>'
            + (n.preview ? '<p class="sq-notif__preview">' + escapeHtml(n.preview) + '</p>' : '')
            + '<p class="sq-notif__time">' + escapeHtml(n.time) + '</p>'
          + '</div>'
          + '<span class="sq-notif__dot' + (n.read ? ' is-read' : '') + '"></span>'
        + '</div>';
      }).join('');
    });
    body.innerHTML = html;
  }

  /* ----------------------------- 事件委托 ----------------------------- */
  function onFeedClick(e) {
    var t = e.target instanceof Element ? e.target.closest('[data-action]') : null;
    if (!t) return;
    var action = t.getAttribute('data-action');
    var id = t.getAttribute('data-id');
    var mode = t.getAttribute('data-mode');
    var kw = t.getAttribute('data-kw');
    var tab = t.getAttribute('data-tab');
    var tag = t.getAttribute('data-tag');
    var idx = t.getAttribute('data-idx');

    switch (action) {
      case 'open-search':
        pushView('search');
        break;
      case 'open-notif': pushView('notif'); break;
      case 'graph-pick':
        pushView('graph-timeline', { noteId: id });
        break;
      case 'gtl-back':
        popView();
        break;
      case 'gtp-back':
        popView();
        break;
      case 'gcat-back':
        popView();
        break;
      case 'more': openSheet(); break;
      case 'open-note':
        // 不拦截 like / bookmark 等子按钮
        pushView('detail', { noteId: id });
        break;
      case 'like-note':
        e.preventDefault(); e.stopPropagation();
        showReasonModal('like-note', id);
        break;
      case 'dislike-note':
        e.preventDefault(); e.stopPropagation();
        showReasonModal('dislike-note', id);
        break;
      case 'close-reason':
        closeReasonModal();
        break;
      case 'submit-reason':
        submitReason();
        break;
      case 'bookmark-note':
        e.preventDefault(); e.stopPropagation();
        state.bookmarked[id] = !state.bookmarked[id];
        toast(state.bookmarked[id] ? '已收藏' : '已取消收藏');
        if (state.stack[state.stack.length - 1] === 'feed') renderFeed();
        break;
      case 'share-note':
        e.preventDefault(); e.stopPropagation();
        toast('链接已复制');
        break;
      case 'pop': popView(); break;
      case 'follow': {
        e.stopPropagation();
        state.followed[id] = !state.followed[id];
        var btn = t;
        btn.classList.toggle('is-on', state.followed[id]);
        btn.innerHTML = state.followed[id] ? IC.check(13) + '已关注' : IC.plus(13) + '关注';
        /* 闭环 ④：写入 bridge，好友页「我的伙伴」会出现该作者 */
        if (window.ZX_BRIDGE) {
          if (state.followed[id]) {
            window.ZX_BRIDGE.follow(id);
            toast('已关注 ' + userById(id).name + ' · 去好友页看看 TA');
          } else {
            window.ZX_BRIDGE.unfollow(id);
            toast('已取消关注');
          }
        } else {
          toast(state.followed[id] ? '已关注 ' + userById(id).name : '已取消关注');
        }
        break;
      }
      case 'like-comment':
        e.stopPropagation();
        showReasonModal('like-comment', id);
        break;
      case 'dislike-comment':
        e.stopPropagation();
        showReasonModal('dislike-comment', id);
        break;
      case 'tag-search':
        e.stopPropagation();
        state.searchKw = tag;
        pushHistory(tag);
        pushView('search');
        break;
      case 'clear-search':
        state.searchKw = '';
        renderSearch();
        break;
      case 'search-kw':
        state.searchKw = kw;
        state.searchShowHistory = false;
        pushHistory(kw);
        renderSearch();
        break;
      case 'del-history':
        e.stopPropagation();
        state.searchHistory.splice(parseInt(idx, 10), 1);
        renderSearchBody();
        break;
      case 'clear-history':
        state.searchHistory = [];
        renderSearchBody();
        break;
      case 'toggle-history':
        state.searchShowHistory = !state.searchShowHistory;
        renderSearchBody();
        break;
      case 'read-all':
        toast('已全部标为已读');
        $all('.sq-notif__dot').forEach(function (d) { d.classList.add('is-read'); });
        break;
      case 'send-comment': {
        var input = $('[data-sq-comment-input]');
        var text = input && input.value.trim();
        if (!text) { toast('请先写点什么'); break; }
        var nid = state.viewParams.detail && state.viewParams.detail.noteId;
        if (!nid) break;
        var st = state.commentStance || 'pro';
        state.userComments[nid] = state.userComments[nid] || { pro: [], con: [] };
        state.userComments[nid][st].unshift({
          id: 'uc-' + nid + '-' + st + '-' + Date.now(),
          authorId: 'u-me',
          body: text,
          likes: 0,
          type: st === 'pro' ? 'support' : 'refute',
          evaluations: [],
          _mine: true
        });
        if (input) input.value = '';
        /* 评论发送后刷新列表（按绝对值重排） */
        refreshDebateList(noteById(nid));
        toast('评论已加入' + (st === 'pro' ? '支持方' : '反对方') + '，等待社区审议');
        break;
      }
      case 'set-stance': {
        e.stopPropagation();
        state.commentStance = (t.getAttribute('data-stance') === 'con') ? 'con' : 'pro';
        $all('[data-sq-stance] .sq-stance__btn').forEach(function (b) {
          b.classList.toggle('is-active', b.getAttribute('data-stance') === state.commentStance);
        });
        break;
      }
      case 'toggle-eval': {
        e.stopPropagation();
        state.expandedEval[id] = !state.expandedEval[id];
        /* 外科式切换：只动 class + caret，不重渲列表，避免整列重新入场动画 */
        var cmtNode = t.closest('.sq-cmt');
        if (cmtNode) {
          cmtNode.classList.toggle('is-expanded', state.expandedEval[id]);
          var caretNode = cmtNode.querySelector('.sq-cmt__caret');
          if (caretNode) caretNode.classList.toggle('is-open', state.expandedEval[id]);
        }
        break;
      }
      case 'close-sheet': closeSheet(); break;
      case 'sheet-share': toast('链接已复制'); closeSheet(); break;
      case 'sheet-bookmark': toast('已收藏'); closeSheet(); break;
      case 'sheet-mute': toast('将减少推荐此类内容'); closeSheet(); break;
      case 'sheet-report': toast('举报已提交，感谢你的反馈'); closeSheet(); break;
      default: break;
    }
  }

  /* 搜索框实时输入 */
  function onSearchInput(e) {
    var t = e.target;
    if (!t || !t.matches || !t.matches('[data-sq-search-input]')) return;
    state.searchKw = t.value || '';
    // 仅在清除按钮存在性上做局部更新；body 全量重渲便宜
    var clear = $('[data-action="clear-search"]');
    if (state.searchKw && !clear) {
      var wrap = t.closest('.sq-search__input-wrap');
      if (wrap) {
        var btn = el('button', 'sq-search__clear', IC.close(11));
        btn.setAttribute('data-action', 'clear-search');
        btn.setAttribute('aria-label', '清空');
        wrap.appendChild(btn);
      }
    } else if (!state.searchKw && clear) {
      clear.parentNode.removeChild(clear);
    }
    renderSearchBody();
  }

  /* ----------------------------- 初始化 ----------------------------- */
  function init() {
    if (state.initialized) return;
    state.initialized = true;

    var root = $('[data-sq-root]');
    if (!root) return;
    rootEl = root;

    renderFeedTop();
    renderFeed();

    // 事件委托（绑在根，永久存活）
    root.addEventListener('click', onFeedClick);
    root.addEventListener('input', onSearchInput);
    // 内层水平翻页：scroll 时更新页码指示器（捕获阶段，scroll 不冒泡）
    root.addEventListener('scroll', function (e) {
      var t = e.target;
      if (!(t instanceof Element) || !t.classList.contains('sq-feed__note-pages')) return;
      var section = t.closest('.sq-feed__note');
      if (section) updateDots(section);
    }, true);
    // 键盘可达性：role="button" 元素响应 Enter/Space
    root.addEventListener('keydown', function (e) {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      var t = e.target instanceof Element ? e.target.closest('[role="button"][data-action]') : null;
      if (!t) return;
      e.preventDefault();
      t.click();
    });

    // 注入 toast 节点
    if (!$('[data-sq-toast]')) {
      var toastEl = el('div', 'sq-toast');
      toastEl.setAttribute('data-sq-toast', '');
      root.appendChild(toastEl);
    }
  }

  /* ----------------------------- 广场双视图切换 ----------------------------- */
  /* 双击广场 tab：在全屏翻页（xhs）与知识星图（graph）之间切换 */
  function toggleFeedMode() {
    var next = (state.feedMode === 'xhs') ? 'graph' : 'xhs';
    state.feedMode = next;
    setSquareTabIcon(next === 'graph');
    if (next === 'xhs') stopGraphAnim();   /* 切回 xhs 时停止物理模拟，释放 rAF */
    renderFeed();
  }

  /* 切换广场 tab 图标：xhs 用 graph，graph 用 list */
  function setSquareTabIcon(isGraph) {
    var slot = document.querySelector('[data-tab-icon="square"]');
    if (!slot) return;
    var swap = slot.querySelector('.zx-tab__swap');
    slot.innerHTML = isGraph ? IC.list(24) : IC.graph(24);
    if (swap) slot.appendChild(swap);
    var label = document.querySelector('.zx-tab[data-tab="square"] .zx-tab__label');
    if (label) label.textContent = '广场';
  }

  /* =======================================================================
   * 知识星图：多层级（范畴 → 学科 → 论点 → 细分 → 演化）
   * =====================================================================*/

  /* 第一层：范畴（大圆）—— 科学/技术/人文/日常/社会 */
  var GRAPH_CATEGORIES = [
    { id: 'science',  name: '科学', x: 22, y: 25, color: '#1D5B7A' },
    { id: 'tech',     name: '技术', x: 78, y: 25, color: '#C7A24A' },
    { id: 'humanity', name: '人文', x: 22, y: 75, color: '#C1272D' },
    { id: 'life',     name: '日常', x: 78, y: 75, color: '#6B655C' },
    { id: 'society',  name: '社会', x: 50, y: 50, color: '#0E0D0B' }
  ];

  /* 范畴间弱关联边（索引对） */
  var CATEGORY_LINKS = [[0,4],[1,4],[2,4],[3,4],[0,1],[2,3]];

  /* 3D 知识球：范畴在球面 fibonacci 五点分布（theta 经度，phi 纬度 0=北极 π=南极） */
  var SPHERE_CATS = [
    { id: 'science',  name: '科学', color: '#1D5B7A', theta: -Math.PI / 2,                phi: Math.PI * 0.30 },
    { id: 'tech',     name: '技术', color: '#C7A24A', theta: -Math.PI / 2 + Math.PI * 0.4, phi: Math.PI * 0.65 },
    { id: 'humanity', name: '人文', color: '#C1272D', theta: -Math.PI / 2 + Math.PI * 0.8, phi: Math.PI * 0.40 },
    { id: 'life',     name: '日常', color: '#6B655C', theta: -Math.PI / 2 + Math.PI * 1.2, phi: Math.PI * 0.72 },
    { id: 'society',  name: '社会', color: '#0E0D0B', theta: -Math.PI / 2 + Math.PI * 1.6, phi: Math.PI * 0.52 }
  ];

  /* 跨学科交叉链接（不同范畴学科间的真实关联，构成知识球内部网络） */
  var CROSS_LINKS = [
    ['physics','chemistry'],   ['chemistry','biology'],   ['physics','material'],     ['chemistry','material'],
    ['biology','material'],    ['biology','fitness'],
    ['ai','programming'],      ['ai','hardware'],         ['ai','design'],            ['programming','design'],
    ['philosophy','psychology'],['history','politics'],   ['literature','philosophy'],['art','literature'],
    ['art','design'],          ['art','history'],
    ['food','chemistry'],      ['fitness','food'],        ['travel','food'],
    ['parenting','psychology'],['parenting','education'],
    ['economy','politics'],    ['economy','psychology'],  ['economy','history'],
    ['education','psychology'],['education','history'],   ['education','ai'],
    ['politics','philosophy']
  ];

  /* 3D 球状态：用户旋转 + 自转 + 透视焦距 */
  var sphereState = {
    yaw: 0.4, pitch: -0.25, autoRot: 0.0035, focal: 2.6, dragging: false
  };

  /* 第二层：学科（每个范畴下的学科，[id, 名称]） */
  var GRAPH_DISCIPLINES = {
    science:  [['physics','物理'],['chemistry','化学'],['material','材料'],['biology','生物']],
    tech:     [['ai','AI'],['programming','编程'],['hardware','硬件'],['design','设计']],
    humanity: [['history','历史'],['philosophy','哲学'],['literature','文学'],['art','艺术']],
    life:     [['food','美食'],['travel','旅行'],['parenting','育儿'],['fitness','健身']],
    society:  [['economy','经济'],['psychology','心理'],['education','教育'],['politics','政治']]
  };

  /* 第三层：论点（每个学科下的论点；有 noteIds 的为真实笔记，无的为虚拟论点） */
  var GRAPH_CLAIMS = {
    material: [
      { id: 'impedance',  name: '界面阻抗是量产瓶颈',  noteIds: ['n-solid-battery-impedance','n-impedance-overestimated'] },
      { id: 'sulfide',    name: '硫化物将主导2026',    noteIds: ['n-sulfide-vs-oxide','n-2026-solid-mass-production','n-li-battery-paradigm'] },
      { id: 'paradigm',   name: '液态到固态是范式转移', noteIds: ['n-li-battery-paradigm','n-solid-vs-liquid-review'] },
      { id: 'sei',        name: 'SEI是界面问题钥匙',   noteIds: ['n-sei-explainer','n-solid-battery-impedance'] },
      { id: 'sodium',     name: '钠枝晶有可重复性危机', noteIds: ['n-na-dendrite-review'] },
      { id: 'transition', name: '半固态过渡至少5年',   noteIds: ['n-li-battery-paradigm','n-2026-solid-mass-production'] }
    ],
    physics: [
      { id: 'quantum',    name: '量子纠缠不超光速' },
      { id: 'darkmatter', name: '暗物质可能是轴子' },
      { id: 'fusion',     name: '聚变2035可商业化' },
      { id: 'gravity',    name: '引力波开启新天文学' }
    ],
    chemistry: [
      { id: 'catalyst',   name: '单原子催化是未来' },
      { id: 'co2',        name: 'CO2还原5年商业化' },
      { id: 'lisulfur',   name: '锂硫电池超500Wh/kg' }
    ],
    biology: [
      { id: 'crispr',     name: 'CRISPR可治愈遗传病' },
      { id: 'protein',    name: '蛋白质折叠已解决' },
      { id: 'aging',      name: '衰老可被部分逆转' }
    ],
    ai: [
      { id: 'agi',        name: 'AGI 5年内实现' },
      { id: 'llm',        name: 'LLM不是真正理解' },
      { id: 'alignment',  name: '对齐是AI最大风险' }
    ],
    programming: [
      { id: 'nocode',     name: 'AI取代低端编程' },
      { id: 'rust',       name: 'Rust取代C++' },
      { id: 'qprog',      name: '量子编程5年普及' }
    ],
    hardware: [
      { id: 'moore',      name: '摩尔定律已死' },
      { id: 'chiplet',    name: 'Chiplet是未来' },
      { id: 'riscv',      name: 'RISC-V挑战ARM' }
    ],
    design: [
      { id: 'minimal',    name: '极简主义已过时' },
      { id: 'aidesign',   name: 'AI取代设计师' }
    ],
    history: [
      { id: 'tang',       name: '安史之乱是唐转折点' },
      { id: 'modern',     name: '现代化不等于西方化' }
    ],
    philosophy: [
      { id: 'freewill',   name: '自由意志是幻觉' },
      { id: 'meaning',    name: '生命本无意义' }
    ],
    literature: [
      { id: 'classic',    name: '经典文学在消亡' },
      { id: 'aiwrite',    name: 'AI改变文学创作' }
    ],
    art: [
      { id: 'digital',    name: '数字艺术是真正艺术' },
      { id: 'aiart',      name: 'AI艺术不是创作' }
    ],
    food: [
      { id: 'vegan',      name: '素食可满足营养' },
      { id: 'ferment',    name: '发酵食品有益健康' }
    ],
    travel: [
      { id: 'slow',       name: '慢旅行更深度' },
      { id: 'local',      name: '本地旅行更可持续' }
    ],
    parenting: [
      { id: 'attach',     name: '亲密育儿利于发育' },
      { id: 'screen',     name: '屏幕时间应限1小时' }
    ],
    fitness: [
      { id: 'hiit',       name: 'HIIT比有氧高效' },
      { id: 'strength',   name: '力量训练优于有氧' }
    ],
    economy: [
      { id: 'ubi',        name: '全民基本收入可行' },
      { id: 'degrowth',   name: '去增长是未来' }
    ],
    psychology: [
      { id: 'cbt',        name: 'CBT最有效' },
      { id: 'trauma',     name: '创伤可治愈' }
    ],
    education: [
      { id: 'exam',       name: '应试教育阻碍创新' },
      { id: 'aiedu',      name: 'AI实现个性化教育' }
    ],
    politics: [
      { id: 'democracy',  name: '民主不是最优制度' },
      { id: 'digitalgov', name: '数字治理是未来' }
    ]
  };

  /* 学科 → 范畴 反向映射 */
  var DISCIPLINE_TO_CATEGORY = {};
  Object.keys(GRAPH_DISCIPLINES).forEach(function (catId) {
    GRAPH_DISCIPLINES[catId].forEach(function (d) { DISCIPLINE_TO_CATEGORY[d[0]] = catId; });
  });

  /* 信证状态颜色映射 */
  var TRUST_COLORS = {
    converged: { stroke: '#C7A24A', fill: 'rgba(199, 162, 74, 0.18)', label: '已收敛' },
    testing:   { stroke: '#C1272D', fill: 'rgba(193, 39, 45, 0.14)', label: '考验中' },
    candidate: { stroke: '#1D5B7A', fill: 'rgba(29, 91, 122, 0.12)', label: '候选' },
    refuted:   { stroke: '#6B655C', fill: 'rgba(107, 101, 92, 0.12)', label: '存疑' }
  };

  /* 论点细分数据（仅材料学科 6 个论点有真实数据，其他虚拟论点动态生成） */
  var GRAPH_TOPIC_DETAILS = {
    'impedance': {
      claim: '固-固界面阻抗是固态电池量产的真正瓶颈',
      summary: '硫化物本体电导率已达 10⁻² S/cm，但固-固界面副反应层让内阻飙升数倍。3nm LiNbO₃ 涂层能把界面阻抗从 1200 压到 80 Ω·cm²。',
      nodes: [
        { id: 'imp-f1', type: 'fact', label: 'LiNbO₃：1200→80 Ω·cm²', noteId: 'n-solid-battery-impedance', x: 30, y: 30 },
        { id: 'imp-f2', type: 'fact', label: '临界电流：0.6→1.7 mA/cm²', noteId: 'n-solid-battery-impedance', x: 68, y: 28 },
        { id: 'imp-p1', type: 'pro', label: '原位 XPS 证实互扩散', noteId: 'n-solid-vs-liquid-review', x: 28, y: 68 },
        { id: 'imp-p2', type: 'pro', label: 'Wang et al. 2024', noteId: 'n-li-battery-paradigm', x: 64, y: 70 },
        { id: 'imp-c1', type: 'con', label: '40% 结论无法复现', noteId: 'n-impedance-overestimated', x: 50, y: 80 },
        { id: 'imp-n1', type: 'note', label: '界面阻抗的真相', noteId: 'n-solid-battery-impedance', x: 72, y: 50 },
        { id: 'imp-n2', type: 'note', label: '界面阻抗被高估？', noteId: 'n-impedance-overestimated', x: 22, y: 50 }
      ],
      edges: [
        { source: 'imp-f1', target: 'imp-p1', type: 'strong' },
        { source: 'imp-f2', target: 'imp-p2', type: 'strong' },
        { source: 'imp-c1', target: 'imp-n2', type: 'strong' },
        { source: 'imp-n1', target: 'imp-f1', type: 'weak' },
        { source: 'imp-n2', target: 'imp-c1', type: 'weak' }
      ]
    },
    'sulfide': {
      claim: '硫化物路线将主导 2026 年固态电池量产',
      summary: '宁德时代 17Ah 良率破 80%，硫化物在中国大陆跑得最快。但氧化物路线在北美更稳，两条产业逻辑至今未收敛。',
      nodes: [
        { id: 'sul-f1', type: 'fact', label: '宁德 17Ah 良率破 80%', noteId: 'n-2026-solid-mass-production', x: 30, y: 28 },
        { id: 'sul-f2', type: 'fact', label: 'QS QSE-5 通过测试', noteId: 'n-sulfide-vs-oxide', x: 70, y: 30 },
        { id: 'sul-p1', type: 'pro', label: '电导率逼近液态', noteId: 'n-sulfide-vs-oxide', x: 26, y: 68 },
        { id: 'sul-c1', type: 'con', label: '遇水释放 H₂S', noteId: 'n-solid-vs-liquid-review', x: 50, y: 82 },
        { id: 'sul-c2', type: 'con', label: '氧化物北美更稳', noteId: 'n-sulfide-vs-oxide', x: 50, y: 20 },
        { id: 'sul-n1', type: 'note', label: '硫化物 vs 氧化物', noteId: 'n-sulfide-vs-oxide', x: 22, y: 50 },
        { id: 'sul-n2', type: 'note', label: '2026 量产元年', noteId: 'n-2026-solid-mass-production', x: 78, y: 50 }
      ],
      edges: [
        { source: 'sul-f1', target: 'sul-p1', type: 'strong' },
        { source: 'sul-f2', target: 'sul-c2', type: 'strong' },
        { source: 'sul-c1', target: 'sul-n1', type: 'weak' },
        { source: 'sul-n2', target: 'sul-f1', type: 'weak' }
      ]
    },
    'paradigm': {
      claim: '液态→固态是范式转移，非渐进改良',
      summary: '下一代范式是固态电解质+锂金属负极，理论能量密度可冲 500 Wh/kg，且彻底消除易燃问题。',
      nodes: [
        { id: 'par-f1', type: 'fact', label: '能量密度：300→500', noteId: 'n-li-battery-paradigm', x: 30, y: 28 },
        { id: 'par-f2', type: 'fact', label: '消除液态易燃', noteId: 'n-solid-vs-liquid-review', x: 70, y: 30 },
        { id: 'par-p1', type: 'pro', label: '离子传输机制不同', noteId: 'n-solid-vs-liquid-review', x: 28, y: 68 },
        { id: 'par-c1', type: 'con', label: '工艺要求高一个数量级', noteId: 'n-2026-solid-mass-production', x: 50, y: 82 },
        { id: 'par-n1', type: 'note', label: '范式转移路线图', noteId: 'n-li-battery-paradigm', x: 22, y: 50 },
        { id: 'par-n2', type: 'note', label: '固液核心差异', noteId: 'n-solid-vs-liquid-review', x: 78, y: 50 }
      ],
      edges: [
        { source: 'par-f1', target: 'par-p1', type: 'strong' },
        { source: 'par-c1', target: 'par-n2', type: 'weak' },
        { source: 'par-note-1', target: 'par-f1', type: 'weak' }
      ]
    },
    'sei': {
      claim: 'SEI 膜是理解一切电池界面问题的钥匙',
      summary: 'SEI 是电池第一次充电时在负极表面形成的纳米层。即使是全固态，固-固界面也会形成类似的钝化层。',
      nodes: [
        { id: 'sei-f1', type: 'fact', label: '纳米级，决定寿命', noteId: 'n-sei-explainer', x: 30, y: 28 },
        { id: 'sei-f2', type: 'fact', label: '固态也形成钝化层', noteId: 'n-solid-battery-impedance', x: 70, y: 30 },
        { id: 'sei-p1', type: 'pro', label: '离子通行无阻', noteId: 'n-sei-explainer', x: 28, y: 68 },
        { id: 'sei-c1', type: 'con', label: '太厚内阻大太薄老死', noteId: 'n-solid-battery-impedance', x: 50, y: 82 },
        { id: 'sei-n1', type: 'note', label: '三分钟看懂 SEI', noteId: 'n-sei-explainer', x: 22, y: 50 },
        { id: 'sei-n2', type: 'note', label: '界面阻抗的真相', noteId: 'n-solid-battery-impedance', x: 78, y: 50 }
      ],
      edges: [
        { source: 'sei-f1', target: 'sei-p1', type: 'strong' },
        { source: 'sei-c1', target: 'sei-n1', type: 'weak' },
        { source: 'sei-n2', target: 'sei-f2', type: 'weak' }
      ]
    },
    'sodium': {
      claim: '钠枝晶研究存在严重的可重复性危机',
      summary: '137 篇论文中几乎没有一篇能稳定复现另一篇的"长循环无枝晶"。临界电流密度报告值在 0.3-3.0 mA/cm² 漂移。',
      nodes: [
        { id: 'na-f1', type: 'fact', label: '137 篇，40% 无法复现', noteId: 'n-na-dendrite-review', x: 30, y: 28 },
        { id: 'na-f2', type: 'fact', label: '临界电流 0.3-3.0 漂移', noteId: 'n-na-dendrite-review', x: 70, y: 30 },
        { id: 'na-p1', type: 'pro', label: '钠更软，枝晶更难', noteId: 'n-na-dendrite-review', x: 28, y: 68 },
        { id: 'na-c1', type: 'con', label: 'EIS 拟合随意性大', noteId: 'n-solid-battery-impedance', x: 68, y: 70 },
        { id: 'na-c2', type: 'con', label: '研究范式有问题', noteId: 'n-impedance-overestimated', x: 50, y: 82 },
        { id: 'na-n1', type: 'note', label: '钠枝晶 137 篇综述', noteId: 'n-na-dendrite-review', x: 50, y: 50 }
      ],
      edges: [
        { source: 'na-f1', target: 'na-p1', type: 'strong' },
        { source: 'na-f2', target: 'na-c1', type: 'strong' },
        { source: 'na-c2', target: 'na-n1', type: 'weak' }
      ]
    },
    'transition': {
      claim: '半固态是至少 5 年的过渡方案',
      summary: '半固态 2024 上车，但这个"过渡"至少持续 5 年。固态对界面接触的工艺要求比液态高一个数量级。',
      nodes: [
        { id: 'tr-f1', type: 'fact', label: '2024 半固态上车', noteId: 'n-2026-solid-mass-production', x: 30, y: 28 },
        { id: 'tr-f2', type: 'fact', label: '2027 前仍占主流', noteId: 'n-2026-solid-mass-production', x: 70, y: 30 },
        { id: 'tr-p1', type: 'pro', label: '工艺要求高一个数量级', noteId: 'n-li-battery-paradigm', x: 28, y: 68 },
        { id: 'tr-c1', type: 'con', label: '半固态只是折中', noteId: 'n-solid-vs-liquid-review', x: 50, y: 82 },
        { id: 'tr-n1', type: 'note', label: '范式转移路线图', noteId: 'n-li-battery-paradigm', x: 22, y: 50 },
        { id: 'tr-n2', type: 'note', label: '2026 量产元年', noteId: 'n-2026-solid-mass-production', x: 78, y: 50 }
      ],
      edges: [
        { source: 'tr-f1', target: 'tr-n1', type: 'strong' },
        { source: 'tr-f2', target: 'tr-n2', type: 'strong' },
        { source: 'tr-p1', target: 'tr-c1', type: 'weak' }
      ]
    }
  };

  /* 细分节点类型颜色 */
  var TOPIC_NODE_COLORS = {
    claim: { stroke: '#0E0D0B', fill: 'rgba(14, 13, 11, 0.08)', label: '中心论断' },
    pro:   { stroke: '#1D5B7A', fill: 'rgba(29, 91, 122, 0.16)', label: '支持证据' },
    con:   { stroke: '#C1272D', fill: 'rgba(193, 39, 45, 0.14)', label: '反驳观点' },
    fact:  { stroke: '#C7A24A', fill: 'rgba(199, 162, 74, 0.18)', label: '关键事实' },
    note:  { stroke: '#6B655C', fill: 'rgba(107, 101, 92, 0.14)', label: '相关笔记' }
  };

  /* 为虚拟论点动态生成细分数据 */
  function ensureTopicDetail(claimId, claimName) {
    if (GRAPH_TOPIC_DETAILS[claimId]) return GRAPH_TOPIC_DETAILS[claimId];
    /* 基于 claimId 的 hash 生成稳定的伪随机细分节点 */
    var h = hash(claimId);
    var facts = [
      '有实验数据支持', '存在多方引用', '已有复现尝试', '存在测量数据'
    ];
    var pros = ['理论推导成立', '有案例验证', '逻辑自洽', '学界有人支持'];
    var cons = ['存在反例', '方法论有争议', '样本量不足', '可重复性存疑'];
    /* 可复用的笔记池（与 mock data 中的 note id 对应） */
    var notePool = [
      'n-solid-battery-impedance', 'n-sulfide-vs-oxide', 'n-li-battery-paradigm',
      'n-chicken-or-egg-first', 'n-2026-graduate-job-guide', 'n-gym-beginner-mistakes',
      'n-quantum-counterintuitive-facts', 'n-kaoyan-second-try-lessons',
      'n-lazy-weekly-cooking', 'n-moonlight-saver-ledger', 'n-why-cant-stop-short-video'
    ];
    var nodes = [];
    var edges = [];
    var types = ['fact', 'fact', 'pro', 'pro', 'con', 'con'];
    var labels = [facts[h % 4], facts[(h >> 2) % 4], pros[h % 4], pros[(h >> 2) % 4], cons[h % 4], cons[(h >> 2) % 4]];
    var positions = [[28,28],[72,28],[26,68],[72,68],[50,82],[50,18]];
    labels.forEach(function (lb, i) {
      var nid = claimId + '-n' + i;
      /* 从笔记池中稳定取一篇作为该节点的关联笔记 */
      var noteId = notePool[(h + i * 3) % notePool.length];
      nodes.push({ id: nid, type: types[i], label: lb, noteId: noteId, x: positions[i][0], y: positions[i][1] });
      edges.push({ source: 'claim-center', target: nid, type: 'weak' });
    });
    var detail = {
      claim: claimName,
      summary: '该论点尚未有完整笔记沉淀，以下为基于讨论生成的细分节点。',
      nodes: nodes,
      edges: edges
    };
    GRAPH_TOPIC_DETAILS[claimId] = detail;
    return detail;
  }

  /* 论点演化时间线：每个笔记的"凝结事实"历史 */
  var GRAPH_TIMELINES = {
    'n-solid-battery-impedance': [
      { time: '2024-08', label: '提出', detail: '在 3 人的会话中首次提出', consensus: 22 },
      { time: '2024-10', label: '扩散', detail: '在 48 人的会话中被引用讨论', consensus: 38 },
      { time: '2024-12', label: '考验', detail: '出现关键反驳，共识回落', consensus: 31 },
      { time: '2025-03', label: '凝结', detail: '在 387 人的会话中凝结为事实', consensus: 70 }
    ],
    'n-impedance-overestimated': [
      { time: '2025-01', label: '质疑', detail: '在物理学群提出复测数据', consensus: 15 },
      { time: '2025-02', label: '热议', detail: '72 小时讨论，129 人参与', consensus: 28 },
      { time: '2025-03', label: '分化', detail: '两派观点形成，共识未收敛', consensus: 35 }
    ],
    'n-sulfide-vs-oxide': [
      { time: '2024-06', label: '对立', detail: '两条路线正式形成对立', consensus: 50 },
      { time: '2024-09', label: '辩论', detail: '184 条评论，产线 vs 安全之争', consensus: 52 },
      { time: '2025-02', label: '并存', detail: '两条路线至今未收敛，并存发展', consensus: 50 }
    ],
    'n-li-battery-paradigm': [
      { time: '2024-07', label: '预判', detail: '在 12 人的会话中提出路线图', consensus: 30 },
      { time: '2024-11', label: '验证', detail: '半固态上车，预判被验证', consensus: 55 },
      { time: '2025-01', label: '凝结', detail: '在 245 人的会话中凝结为共识', consensus: 72 }
    ],
    'n-2026-solid-mass-production': [
      { time: '2025-01', label: '信号', detail: '产线数据出现关键信号', consensus: 25 },
      { time: '2025-03', label: '确认', detail: '宁德时代良率破 80%，234 人见证', consensus: 68 }
    ],
    'n-na-dendrite-review': [
      { time: '2024-09', label: '综述', detail: '137 篇论文整理完成', consensus: 20 },
      { time: '2024-12', label: '危机', detail: '可重复性问题被曝光', consensus: 18 },
      { time: '2025-02', label: '存疑', detail: '198 人标记为"存疑"', consensus: 15 }
    ],
    'n-sei-explainer': [
      { time: '2024-10', label: '科普', detail: 'AI 生成 3 分钟科普', consensus: 40 },
      { time: '2025-01', label: '沉淀', detail: '412 人沉淀，成为入门标准', consensus: 85 }
    ],
    'n-solid-vs-liquid-review': [
      { time: '2024-11', label: '整理', detail: '复习卡片制作完成', consensus: 35 },
      { time: '2025-02', label: '收敛', detail: '156 人沉淀，核心差异已收敛', consensus: 78 }
    ]
  };

  /* ===== 力导向模拟（Obsidian 式动态图谱） ===== */
  var graphAnim = null;
  var graphNodes = [];
  var graphEdges = [];
  var graphNodeMap = {};
  var currentGraphSvg = null;  /* 当前活跃的 SVG 元素，updateGraphSVG 在其内查询（修复多视图 DOM 冲突） */
  var currentDragCleanup = null;  /* 清理上一次 bindGraphDrag 的监听器 */

  function stopGraphAnim() {
    if (graphAnim) {
      cancelAnimationFrame(graphAnim);
      graphAnim = null;
    }
  }

  /* 每帧物理模拟：斥力 + 引力 + 中心力 + 阻尼（Obsidian 风格） */
  function graphTick() {
    var REPULSION = 16;        /* 节点间斥力 */
    var ATTRACTION = 0.018;    /* 连线弹簧刚度 */
    var LINK_DIST = 8;         /* 强连接目标距离 */
    var CENTER = 0.0035;       /* 中心聚拢力 */
    var DAMP = 0.78;           /* 阻尼（越大越滑，越小越稳） */

    /* 节点间斥力（库仑） */
    for (var i = 0; i < graphNodes.length; i++) {
      for (var j = i + 1; j < graphNodes.length; j++) {
        var a = graphNodes[i], b = graphNodes[j];
        var dx = a.x - b.x, dy = a.y - b.y;
        var d2 = dx * dx + dy * dy;
        if (d2 < 0.5) d2 = 0.5;
        var d = Math.sqrt(d2);
        var f = REPULSION / d2;
        a.vx += (dx / d) * f; a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
      }
    }

    /* 连线引力（胡克）：cross 边目标距离更长，让学科交叉自然展开 */
    graphEdges.forEach(function (e) {
      var a = graphNodeMap[e.source], b = graphNodeMap[e.target];
      if (!a || !b) return;
      var dx = b.x - a.x, dy = b.y - a.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 0.1;
      var target;
      if (e.type === 'cross') target = LINK_DIST * 2.0;       /* 学科交叉：长距离弱弹簧 */
      else if (e.type === 'weak') target = LINK_DIST * 1.4;
      else target = LINK_DIST;
      var f = (d - target) * ATTRACTION;
      a.vx += (dx / d) * f; a.vy += (dy / d) * f;
      b.vx -= (dx / d) * f; b.vy -= (dy / d) * f;
    });

    /* 中心力 + 阻尼 + 位置更新 */
    graphNodes.forEach(function (n) {
      if (n.fixed) return;
      n.vx += (50 - n.x) * CENTER;
      n.vy += (50 - n.y) * CENTER;
      n.vx *= DAMP; n.vy *= DAMP;
      n.x += n.vx; n.y += n.vy;
      n.x = Math.max(6, Math.min(94, n.x));
      n.y = Math.max(8, Math.min(92, n.y));
    });

    updateGraphSVG();
    graphAnim = requestAnimationFrame(graphTick);
  }

  /* 每帧更新 SVG 属性（通用：处理所有节点/边/标签/halo）
   * 关键：在 currentGraphSvg 内查询，避免多视图 DOM 冲突 */
  function updateGraphSVG() {
    var svg = currentGraphSvg;
    if (!svg) return;
    graphEdges.forEach(function (e, i) {
      var line = svg.querySelector('[data-edge="' + i + '"]');
      if (!line) return;
      var a = graphNodeMap[e.source], b = graphNodeMap[e.target];
      if (a && b) {
        line.setAttribute('x1', a.x.toFixed(2));
        line.setAttribute('y1', a.y.toFixed(2));
        line.setAttribute('x2', b.x.toFixed(2));
        line.setAttribute('y2', b.y.toFixed(2));
      }
    });
    graphNodes.forEach(function (n) {
      var circle = svg.querySelector('[data-node="' + n.id + '"]');
      if (circle) {
        circle.setAttribute('cx', n.x.toFixed(2));
        circle.setAttribute('cy', n.y.toFixed(2));
      }
      /* halo（节点光晕） */
      if (n.halo) {
        var halo = svg.querySelector('[data-node-halo="' + n.id + '"]');
        if (halo) {
          halo.setAttribute('cx', n.x.toFixed(2));
          halo.setAttribute('cy', n.y.toFixed(2));
        }
      }
      /* label（所有有标签的节点） */
      if (n.label != null) {
        var text = svg.querySelector('[data-label="' + n.id + '"]');
        if (text) {
          text.setAttribute('x', n.x.toFixed(2));
          /* 修复：labelOffset=0 是合法值（范畴文字居中），不能用 || 5 */
          var lo = (n.labelOffset != null) ? n.labelOffset : 5;
          text.setAttribute('y', (n.y + lo).toFixed(2));
        }
      }
    });
  }

  /* 拖拽 + 点击交互（Obsidian 风格：单击聚焦高亮邻居，再点导航节点进入下一层） */
  function bindGraphDrag(svg) {
    var dragNode = null;
    var dragStart = null;
    var dragMoved = false;
    var highlightedId = null;  /* 当前高亮的节点 id */

    function getPoint(touch) {
      var rect = svg.getBoundingClientRect();
      /* viewBox="0 0 100 100" + preserveAspectRatio="xMidYMid meet"
       * 内容按短边缩放并居中，上下/左右可能留白。
       * 必须扣除留白偏移后再换算，否则 Y 轴映射会严重偏移。 */
      var scale = Math.min(rect.width, rect.height) / 100;
      var offsetX = (rect.width - 100 * scale) / 2;
      var offsetY = (rect.height - 100 * scale) / 2;
      return {
        x: (touch.clientX - rect.left - offsetX) / scale,
        y: (touch.clientY - rect.top - offsetY) / scale
      };
    }

    /* 按节点实际半径命中（修复：范畴大圆不再吞掉旁边的学科小圆） */
    function findNode(pt) {
      var closest = null, minDist = Infinity;
      graphNodes.forEach(function (n) {
        var dx = n.x - pt.x, dy = n.y - pt.y;
        var d = Math.sqrt(dx * dx + dy * dy);
        var hitR = (n.r || 2) + 1.5;
        if (d < hitR && d < minDist) { minDist = d; closest = n; }
      });
      return closest;
    }

    /* 计算节点的直接邻居 id 集合 */
    function getNeighbors(nodeId) {
      var set = {};
      set[nodeId] = true;
      graphEdges.forEach(function (e) {
        if (e.source === nodeId) set[e.target] = true;
        else if (e.target === nodeId) set[e.source] = true;
      });
      return set;
    }

    /* 高亮节点 + 其邻居，其他节点/边变灰 */
    function highlight(nodeId) {
      clearHighlight();
      highlightedId = nodeId;
      var kept = getNeighbors(nodeId);
      /* 节点圆 + 文字 */
      graphNodes.forEach(function (n) {
        var circle = svg.querySelector('[data-node="' + n.id + '"]');
        var text = svg.querySelector('[data-label="' + n.id + '"]');
        var dim = !kept[n.id];
        if (circle) circle.classList.toggle('is-dim', dim);
        if (text) text.classList.toggle('is-dim', dim);
        if (!dim && circle) circle.classList.add('is-focus');
      });
      /* 边：仅保留连接到高亮节点的边高亮 */
      graphEdges.forEach(function (e, i) {
        var line = svg.querySelector('[data-edge="' + i + '"]');
        if (!line) return;
        var related = (e.source === nodeId || e.target === nodeId);
        line.classList.toggle('is-dim', !related);
        if (related) line.classList.add('is-focus');
      });
    }

    function clearHighlight() {
      highlightedId = null;
      svg.querySelectorAll('.is-dim').forEach(function (el) { el.classList.remove('is-dim'); });
      svg.querySelectorAll('.is-focus').forEach(function (el) { el.classList.remove('is-focus'); });
    }

    function onStart(e) {
      var touch = e.touches ? e.touches[0] : e;
      var pt = getPoint(touch);
      var node = findNode(pt);
      if (node) {
        dragNode = node;
        dragNode.fixed = true;
        dragStart = { x: pt.x, y: pt.y };
        dragMoved = false;
        e.preventDefault();
      } else {
        /* 点击空白区域：清除高亮 */
        clearHighlight();
      }
    }

    function onMove(e) {
      if (!dragNode) return;
      var touch = e.touches ? e.touches[0] : e;
      var pt = getPoint(touch);
      var dx = pt.x - dragStart.x;
      var dy = pt.y - dragStart.y;
      if (Math.abs(dx) > 2 || Math.abs(dy) > 2) dragMoved = true;
      dragNode.x = Math.max(6, Math.min(94, pt.x));
      dragNode.y = Math.max(8, Math.min(92, pt.y));
      dragNode.vx = 0; dragNode.vy = 0;
      e.preventDefault();
    }

    function onEnd(e) {
      if (!dragNode) return; /* 非拖拽产生的 mouseup/touchend 直接忽略（避免 window 级事件误清除高亮） */
      dragNode.fixed = false;
      if (!dragMoved) {
        /* 单击节点：
         * - 若该节点已高亮 且 支持导航 → 进入下一层
         * - 否则 → 高亮该节点 + 邻居（所有类型节点都可聚焦，含学科） */
        var wasHighlighted = (highlightedId === dragNode.id);
        if (wasHighlighted) {
          navigate(dragNode);
        } else {
          highlight(dragNode.id);
        }
      }
      dragNode = null;
      dragMoved = false;
    }

    /* 节点导航：仅范畴/论点/笔记支持进入下一层；学科节点不导航（已聚焦其论点） */
    function navigate(node) {
      clearHighlight();
      if (node.type === 'category') {
        if (node.id === 'cat-center') popView();
        else pushView('graph-category', { catId: node.id });
      } else if (node.type === 'discipline') {
        /* 学科节点：聚焦后再次点击 → 进入该学科第一个有真实笔记的论点细分 */
        var claims = GRAPH_CLAIMS[node.id] || [];
        var target = null;
        for (var i = 0; i < claims.length; i++) {
          if (claims[i].noteIds && claims[i].noteIds.length) { target = claims[i]; break; }
        }
        if (!target && claims.length) target = claims[0];
        if (target) pushView('graph-topic', { topicId: target.id });
      } else if (node.type === 'claim') {
        if (node.id === 'claim-center') popView();
        else pushView('graph-topic', { topicId: node.id });
      } else if (node.type === 'note') {
        pushView('graph-timeline', { noteId: node.noteId || node.id });
      } else if (node.type === 'fact' || node.type === 'pro' || node.type === 'con') {
        /* 有关联笔记的细分节点 → 进入笔记演化时间线；否则保持高亮 */
        if (node.noteId) pushView('graph-timeline', { noteId: node.noteId });
      }
    }

    /* 先清理上一次绑定到其他 SVG 的拖拽监听器（防止多次导航后监听器堆积） */
    if (currentDragCleanup) { currentDragCleanup(); currentDragCleanup = null; }

    /* start 绑在 svg 上（确定命中的节点）；move/end 绑在 window 上，
     * 这样鼠标/手指快速移出 svg 区域也不会中断拖拽（旧实现绑在 svg 上的
     * mouseleave 会在鼠标越界时误触发 onEnd，导致拖到一半拖不动） */
    svg.addEventListener('touchstart', onStart, { passive: false });
    svg.addEventListener('mousedown', onStart);
    window.addEventListener('touchmove', onMove, { passive: false });
    window.addEventListener('touchend', onEnd);
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onEnd);

    /* 返回清理函数：移除本次绑定的所有监听器 */
    currentDragCleanup = function () {
      svg.removeEventListener('touchstart', onStart);
      svg.removeEventListener('mousedown', onStart);
      window.removeEventListener('touchmove', onMove);
      window.removeEventListener('touchend', onEnd);
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onEnd);
    };
  }

  /* ===== 3D 知识球：球坐标 → 直角坐标 ===== */
  function sphereToCart(theta, phi) {
    return {
      x: Math.sin(phi) * Math.cos(theta),
      y: Math.cos(phi),
      z: Math.sin(phi) * Math.sin(theta)
    };
  }

  /* 构建 3D 节点：范畴在球面，学科略偏向范畴位置（半径 0.86，分布在范畴切平面上） */
  function buildSphereNodes() {
    var cats = [];
    var discs = [];
    SPHERE_CATS.forEach(function (cat) {
      var p = sphereToCart(cat.theta, cat.phi);
      cats.push({
        id: cat.id, type: 'category', name: cat.name, color: cat.color,
        x: p.x, y: p.y, z: p.z, r: 4.6
      });
      var disciplines = GRAPH_DISCIPLINES[cat.id] || [];
      var n = disciplines.length;
      /* 切向量 t1（与 y 轴和位置向量都垂直） */
      var t1x = -p.z, t1z = p.x;
      var t1l = Math.sqrt(t1x * t1x + t1z * t1z) || 1;
      t1x /= t1l; t1z /= t1l;
      /* 切向量 t2 = 位置 × t1 */
      var t2x = p.y * t1z - p.z * 0;
      var t2y = p.z * t1x - p.x * t1z;
      var t2z = p.x * 0 - p.y * t1x;
      disciplines.forEach(function (d, idx) {
        var angle = (idx / n) * 2 * Math.PI;
        var offMag = 0.22;
        var ca = Math.cos(angle), sa = Math.sin(angle);
        var dx = (t1x * ca + t2x * sa) * offMag;
        var dy = (0 * ca + t2y * sa) * offMag;
        var dz = (t1z * ca + t2z * sa) * offMag;
        var radius = 0.86;
        discs.push({
          id: d[0], type: 'discipline', name: d[1], color: cat.color,
          x: (p.x + dx) * radius,
          y: (p.y + dy) * radius,
          z: (p.z + dz) * radius,
          r: 1.9, catId: cat.id
        });
      });
    });
    return { cats: cats, discs: discs };
  }

  /* 3D 旋转（yaw 绕 Y，pitch 绕 X）+ 透视投影 → viewBox 0-100 屏幕坐标 */
  function project3D(p, focal) {
    var cy = Math.cos(sphereState.yaw), sy = Math.sin(sphereState.yaw);
    var x1 = p.x * cy + p.z * sy;
    var y1 = p.y;
    var z1 = -p.x * sy + p.z * cy;
    var cx = Math.cos(sphereState.pitch), sx = Math.sin(sphereState.pitch);
    var x2 = x1;
    var y2 = y1 * cx - z1 * sx;
    var z2 = y1 * sx + z1 * cx;
    var SPHERE_R = 38;
    var denom = focal + z2;
    if (denom < 0.4) denom = 0.4;
    var scale = focal / denom;
    return {
      sx: 50 + x2 * SPHERE_R * scale,
      sy: 50 + y2 * SPHERE_R * scale,
      scale: scale,
      z: z2
    };
  }

  /* 渲染知识星图第一层：3D 球形物理网络
   * - 范畴分布在球面，学科略偏向范畴位置（球内）
   * - 学科间有真实交叉链接（CROSS_LINKS）
   * - 拖拽旋转球体 + 自转
   * - 点击范畴节点进入第二层 */
  function renderFeedGraph(scroller, notes) {
    graphNodes = [];
    graphEdges = [];
    graphNodeMap = {};

    /* 范畴节点（大圆）：Obsidian 风格，节点根据连接数决定大小 */
    GRAPH_CATEGORIES.forEach(function (cat) {
      var node = {
        id: cat.id, type: 'category', name: cat.name,
        x: cat.x, y: cat.y, vx: 0, vy: 0, fixed: false,
        r: 3.6, color: cat.color,
        halo: true, label: cat.name, labelOffset: 0
      };
      graphNodes.push(node);
      graphNodeMap[cat.id] = node;
    });

    /* 学科节点（中圆）：围绕范畴分布，半径略小 */
    GRAPH_CATEGORIES.forEach(function (cat) {
      var disciplines = GRAPH_DISCIPLINES[cat.id] || [];
      var n = disciplines.length;
      disciplines.forEach(function (d, idx) {
        var angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
        var dist = 6.5;
        var node = {
          id: d[0], type: 'discipline', name: d[1],
          x: cat.x + dist * Math.cos(angle),
          y: cat.y + dist * Math.sin(angle),
          vx: 0, vy: 0, fixed: false,
          r: 1.6, color: cat.color, catId: cat.id,
          label: d[1], labelOffset: 3
        };
        graphNodes.push(node);
        graphNodeMap[d[0]] = node;
        graphEdges.push({ source: cat.id, target: d[0], type: 'strong' });
      });
    });

    /* 跨学科交叉链接（不同范畴学科间的真实关联） */
    CROSS_LINKS.forEach(function (pair) {
      if (graphNodeMap[pair[0]] && graphNodeMap[pair[1]]) {
        graphEdges.push({ source: pair[0], target: pair[1], type: 'cross' });
      }
    });

    /* 渲染 SVG 骨架 */
    var edgesHtml = graphEdges.map(function (e, i) {
      var cls = 'sq-graph__edge';
      if (e.type === 'cross') cls += ' sq-graph__edge--cross';
      else if (e.type === 'weak') cls += ' sq-graph__edge--topic';
      return '<line data-edge="' + i + '" class="' + cls + '" x1="50" y1="50" x2="50" y2="50" />';
    }).join('');

    var nodesHtml = graphNodes.map(function (n) {
      if (n.type === 'category') {
        return '<circle data-node="' + n.id + '" class="sq-graph__cat" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '" style="--cat-c:' + n.color + '"/>'
          + '<text data-label="' + n.id + '" class="sq-graph__cat-text" x="' + n.x + '" y="' + n.y + '" text-anchor="middle" dominant-baseline="middle">' + escapeHtml(n.name) + '</text>';
      }
      return '<circle data-node="' + n.id + '" class="sq-graph__node" cx="' + n.x.toFixed(1) + '" cy="' + n.y.toFixed(1) + '" r="' + n.r + '" style="--cat-c:' + n.color + '"/>'
        + '<text data-label="' + n.id + '" class="sq-graph__node-text" x="' + n.x.toFixed(1) + '" y="' + (n.y + n.labelOffset).toFixed(1) + '" text-anchor="middle">' + escapeHtml(n.name) + '</text>';
    }).join('');

    scroller.innerHTML =
      '<div class="sq-graph__wrap">'
      + '<div class="sq-graph__hint">知识图谱 · 拖拽节点重新布局 · 学科交叉已连 · 点击范畴进入</div>'
      + '<svg class="sq-graph__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">'
      + '<g class="sq-graph__edges">' + edgesHtml + '</g>'
      + '<g class="sq-graph__nodes">' + nodesHtml + '</g>'
      + '</svg>'
      + '<div class="sq-graph__legend">'
      + '<span class="sq-graph__legend-item"><i style="background:#1D5B7A"></i>科学</span>'
      + '<span class="sq-graph__legend-item"><i style="background:#C7A24A"></i>技术</span>'
      + '<span class="sq-graph__legend-item"><i style="background:#C1272D"></i>人文</span>'
      + '<span class="sq-graph__legend-item"><i style="background:#6B655C"></i>日常</span>'
      + '<span class="sq-graph__legend-item"><i style="background:#0E0D0B"></i>社会</span>'
      + '<span class="sq-graph__legend-item sq-graph__legend-item--cross"><i style="background:#C7A24A;opacity:0.6"></i>学科交叉</span>'
      + '</div>'
      + '</div>';

    stopGraphAnim();
    graphAnim = requestAnimationFrame(graphTick);
    var svg = scroller.querySelector('.sq-graph__svg');
    currentGraphSvg = svg;
    if (svg) bindGraphDrag(svg);
  }

  /* 渲染知识星图第二层：范畴内的学科 + 论点（点击范畴大圆进入）
   * - 无中心范畴节点（用户已经在范畴内，中心节点冗余）
   * - 学科节点之间用 cross 边互连（范畴内学科天然相关）
   * - 学科→论点 strong 边，论点围绕学科
   * - 全部自由物理模拟，延续 feed 图的 Obsidian 手感 */
  function renderGraphCategory(catId) {
    var cat = null;
    for (var i = 0; i < GRAPH_CATEGORIES.length; i++) {
      if (GRAPH_CATEGORIES[i].id === catId) { cat = GRAPH_CATEGORIES[i]; break; }
    }
    var top = $('[data-sq-gcat-top]');
    var scroll = $('[data-sq-gcat-scroll]');
    if (!top || !scroll) return;

    top.innerHTML =
      '<button class="sq-iconbtn" data-action="gcat-back" aria-label="返回">' + IC.back() + '</button>'
      + '<h1 class="sq-gcat__title">' + (cat ? escapeHtml(cat.name) : '范畴') + '</h1>'
      + '<span class="sq-gcat__spacer"></span>';

    if (!cat) {
      scroll.innerHTML = '<p class="sq-gcat__empty">未找到该范畴</p>';
      return;
    }

    graphNodes = [];
    graphEdges = [];
    graphNodeMap = {};

    /* 学科节点（中圆）：环形初始分布，参与物理模拟 */
    var disciplines = GRAPH_DISCIPLINES[catId] || [];
    var discIds = disciplines.map(function (d) { return d[0]; });
    var n = disciplines.length;
    disciplines.forEach(function (d, idx) {
      var angle = (idx / n) * Math.PI * 2 - Math.PI / 2;
      var dist = 14;
      var discNode = {
        id: d[0], type: 'discipline', name: d[1],
        x: 50 + dist * Math.cos(angle),
        y: 50 + dist * Math.sin(angle),
        vx: 0, vy: 0, fixed: false,
        r: 3, color: cat.color,
        label: d[1], labelOffset: 5.5
      };
      graphNodes.push(discNode);
      graphNodeMap[d[0]] = discNode;
    });

    /* 学科间 cross 边：范畴内学科环形互连 + CROSS_LINKS 中同范畴的学科对 */
    for (var i = 0; i < discIds.length; i++) {
      var next = (i + 1) % discIds.length;
      graphEdges.push({ source: discIds[i], target: discIds[next], type: 'cross' });
    }
    CROSS_LINKS.forEach(function (pair) {
      /* 只加两端都属于当前范畴的 cross 边（避免重复，用 Set 判断） */
      if (discIds.indexOf(pair[0]) >= 0 && discIds.indexOf(pair[1]) >= 0) {
        graphEdges.push({ source: pair[0], target: pair[1], type: 'cross' });
      }
    });

    /* 论点节点（小圆）：围绕各自学科分布 */
    disciplines.forEach(function (d) {
      var claims = GRAPH_CLAIMS[d[0]] || [];
      var discNode = graphNodeMap[d[0]];
      claims.forEach(function (cl, ci) {
        var cAngle = (ci / claims.length) * Math.PI * 2 - Math.PI / 2;
        var cDist = 6;
        var claimNode = {
          id: cl.id, type: 'claim', name: cl.name,
          x: discNode.x + cDist * Math.cos(cAngle),
          y: discNode.y + cDist * Math.sin(cAngle),
          vx: 0, vy: 0, fixed: false,
          r: 1.4, noteIds: cl.noteIds || null,
          label: cl.name, labelOffset: 3
        };
        graphNodes.push(claimNode);
        graphNodeMap[cl.id] = claimNode;
        graphEdges.push({ source: d[0], target: cl.id, type: 'strong' });
      });
    });

    /* 渲染 SVG */
    var edgesHtml = graphEdges.map(function (e, i) {
      var cls = 'sq-graph__edge';
      if (e.type === 'cross') cls += ' sq-graph__edge--cross';
      else if (e.type === 'weak') cls += ' sq-graph__edge--topic';
      return '<line data-edge="' + i + '" class="' + cls + '" x1="50" y1="50" x2="50" y2="50" />';
    }).join('');

    var nodesHtml = graphNodes.map(function (nd) {
      if (nd.type === 'discipline') {
        return '<circle data-node="' + nd.id + '" class="sq-graph__cat" cx="' + nd.x + '" cy="' + nd.y + '" r="' + nd.r + '" style="--cat-c:' + cat.color + '"/>'
          + '<text data-label="' + nd.id + '" class="sq-graph__cat-text" x="' + nd.x + '" y="' + nd.y + '" text-anchor="middle" dominant-baseline="middle">' + escapeHtml(nd.name) + '</text>';
      }
      /* claim 节点 */
      return '<circle data-node="' + nd.id + '" class="sq-graph__node' + (nd.noteIds ? ' is-real' : '') + '" cx="' + nd.x.toFixed(1) + '" cy="' + nd.y.toFixed(1) + '" r="' + nd.r + '" style="--cat-c:' + cat.color + '"/>'
        + '<text data-label="' + nd.id + '" class="sq-graph__node-text" x="' + nd.x.toFixed(1) + '" y="' + (nd.y + nd.labelOffset).toFixed(1) + '" text-anchor="middle">' + escapeHtml(nd.name) + '</text>';
    }).join('');

    scroll.innerHTML =
      '<div class="sq-graph__wrap">'
      + '<div class="sq-graph__hint">' + escapeHtml(cat.name) + ' · 拖拽重新布局 · 点击学科高亮 · 点击论点查看细分</div>'
      + '<svg class="sq-graph__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">'
      + '<g class="sq-graph__edges">' + edgesHtml + '</g>'
      + '<g class="sq-graph__nodes">' + nodesHtml + '</g>'
      + '</svg>'
      + '<div class="sq-graph__legend">'
      + '<span class="sq-graph__legend-item"><i style="background:' + cat.color + '"></i>' + escapeHtml(cat.name) + '学科</span>'
      + '<span class="sq-graph__legend-item sq-graph__legend-item--cross"><i style="background:#C7A24A;opacity:0.6"></i>学科关联</span>'
      + '<span class="sq-graph__legend-item"><i style="background:#C7A24A"></i>有笔记</span>'
      + '</div>'
      + '</div>';

    stopGraphAnim();
    graphAnim = requestAnimationFrame(graphTick);
    var svg = scroll.querySelector('.sq-graph__svg');
    currentGraphSvg = svg;
    if (svg) bindGraphDrag(svg);
  }

  /* 渲染论点细分图谱（点击论点小圆进入）：中心论断 + 支持/反驳/证据/事实节点 */
  function renderGraphTopic(topicId) {
    /* 从 GRAPH_CLAIMS 中查找论点（遍历所有学科） */
    var claim = null;
    Object.keys(GRAPH_CLAIMS).forEach(function (discId) {
      GRAPH_CLAIMS[discId].forEach(function (c) {
        if (c.id === topicId) claim = c;
      });
    });
    /* 用 ensureTopicDetail 获取或生成细分数据（真实论点用预置数据，虚拟论点动态生成） */
    var detail = ensureTopicDetail(topicId, claim ? claim.name : topicId);
    var top = $('[data-sq-gtp-top]');
    var scroll = $('[data-sq-gtp-scroll]');
    if (!top || !scroll) return;

    /* 顶栏 */
    top.innerHTML =
      '<button class="sq-iconbtn" data-action="gtp-back" aria-label="返回">' + IC.back() + '</button>'
      + '<h1 class="sq-gtp__title">' + (claim ? escapeHtml(claim.name) : '论点细分') + '</h1>'
      + '<span class="sq-gtp__spacer"></span>';

    if (!detail || !claim) {
      scroll.innerHTML = '<p class="sq-gtp__empty">未找到该论点</p>';
      return;
    }

    /* 初始化力导向节点（复用 graphNodes/graphEdges/graphNodeMap） */
    graphNodes = [];
    graphEdges = [];
    graphNodeMap = {};

    /* 中心论断节点（参与物理移动，让图谱自然平衡，Obsidian 风格） */
    var claimNode = {
      id: 'claim-center', type: 'claim',
      label: claim.name, labelOffset: 9,
      x: 50, y: 50, vx: 0, vy: 0, fixed: false,
      r: 5.5, halo: true
    };
    graphNodes.push(claimNode);
    graphNodeMap['claim-center'] = claimNode;

    /* 细分节点 */
    detail.nodes.forEach(function (n) {
      var c = TOPIC_NODE_COLORS[n.type] || TOPIC_NODE_COLORS.note;
      var r = n.type === 'fact' ? 3.5 : (n.type === 'note' ? 2.5 : 3);
      var node = {
        id: n.id, type: n.type, label: n.label, labelOffset: r + 3,
        x: n.x, y: n.y, vx: 0, vy: 0, fixed: false,
        r: r, stroke: c.stroke, fill: c.fill,
        noteId: n.noteId || null
      };
      graphNodes.push(node);
      graphNodeMap[n.id] = node;
    });

    /* 边：所有细分节点都连到中心 claim 节点 + 自定义边 */
    detail.nodes.forEach(function (n) {
      graphEdges.push({ source: 'claim-center', target: n.id, type: 'weak' });
    });
    detail.edges.forEach(function (e) {
      graphEdges.push({ source: e.source, target: e.target, type: e.type });
    });

    /* 渲染 SVG 骨架 */
    var edgesHtml = graphEdges.map(function (e, i) {
      var cls = e.type === 'weak' ? 'sq-graph__edge sq-graph__edge--topic' : 'sq-graph__edge';
      return '<line data-edge="' + i + '" class="' + cls + '" x1="50" y1="50" x2="50" y2="50" />';
    }).join('');

    var nodesHtml = graphNodes.map(function (n) {
      if (n.type === 'claim') {
        return '<circle data-node="' + n.id + '" class="sq-gtp__claim" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '" />'
          + '<text data-label="' + n.id + '" class="sq-gtp__claim-label" x="' + n.x + '" y="' + (n.y + n.labelOffset) + '" text-anchor="middle">' + escapeHtml(n.label) + '</text>';
      }
      return '<circle data-node="' + n.id + '" class="sq-gtp__node" cx="' + n.x + '" cy="' + n.y + '" r="' + n.r + '" '
        + 'style="--n-stroke:' + n.stroke + ';--n-fill:' + n.fill + '" />'
        + '<text data-label="' + n.id + '" class="sq-gtp__node-label" x="' + n.x + '" y="' + (n.y + n.labelOffset) + '" text-anchor="middle">' + escapeHtml(n.label) + '</text>';
    }).join('');

    /* 图例 */
    var legendHtml = Object.keys(TOPIC_NODE_COLORS).map(function (k) {
      var c = TOPIC_NODE_COLORS[k];
      return '<span class="sq-graph__legend-item"><i style="background:' + c.stroke + '"></i>' + c.label + '</span>';
    }).join('');

    scroll.innerHTML =
      '<div class="sq-gtp__claim-card">'
      + '<div class="sq-gtp__claim-tag">中心论断</div>'
      + '<p class="sq-gtp__claim-text">' + escapeHtml(detail.claim) + '</p>'
      + '<p class="sq-gtp__claim-summary">' + escapeHtml(detail.summary) + '</p>'
      + '</div>'
      + '<div class="sq-gtp__graph-wrap">'
      + '<div class="sq-graph__hint">论点细分 · 点击灰色节点查看笔记演化</div>'
      + '<svg class="sq-graph__svg" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">'
      + '<g class="sq-graph__edges">' + edgesHtml + '</g>'
      + '<g class="sq-graph__nodes">' + nodesHtml + '</g>'
      + '</svg>'
      + '<div class="sq-graph__legend">' + legendHtml + '</div>'
      + '</div>';

    /* 启动力导向 */
    stopGraphAnim();
    graphAnim = requestAnimationFrame(graphTick);

    /* 绑定拖拽 */
    var svg = scroll.querySelector('.sq-graph__svg');
    currentGraphSvg = svg;
    if (svg) bindGraphDrag(svg);
  }

  /* 渲染论点演化时间轴 */
  function renderGraphTimeline(noteId) {
    var note = noteById(noteId);
    var top = $('[data-sq-gtl-top]');
    var scroll = $('[data-sq-gtl-scroll]');
    if (!top || !scroll) return;

    top.innerHTML =
      '<button class="sq-iconbtn" data-action="gtl-back" aria-label="返回">' + IC.back() + '</button>'
      + '<h1 class="sq-gtl__title">' + (note ? escapeHtml(note.title.slice(0, 18)) + '…' : '论点演化') + '</h1>'
      + '<span class="sq-gtl__spacer"></span>';

    if (!note) {
      scroll.innerHTML = '<p class="sq-gtl__empty">未找到该笔记</p>';
      return;
    }

    var events = GRAPH_TIMELINES[noteId] || [];
    var trust = deriveTrustStatus(note);
    var stats = debateStats(note);
    var author = userById(note.authorId);
    var c = TRUST_COLORS[trust.stage] || TRUST_COLORS.candidate;

    /* 时间轴事件 */
    var eventsHtml = events.map(function (ev, idx) {
      var isLast = idx === events.length - 1;
      return '<div class="sq-gtl__event' + (isLast ? ' is-current' : '') + '">'
        + '<div class="sq-gtl__event-dot"' + (isLast ? ' style="--dot-c:' + c.stroke + '"' : '') + '></div>'
        + '<div class="sq-gtl__event-body">'
        + '<div class="sq-gtl__event-head">'
        + '<span class="sq-gtl__event-time">' + escapeHtml(ev.time) + '</span>'
        + '<span class="sq-gtl__event-label"' + (isLast ? ' style="color:' + c.stroke + '"' : '') + '>' + escapeHtml(ev.label) + '</span>'
        + '</div>'
        + '<p class="sq-gtl__event-detail">' + escapeHtml(ev.detail) + '</p>'
        + '<div class="sq-gtl__consensus">'
        + '<div class="sq-gtl__consensus-bar" style="width:' + ev.consensus + '%;background:' + c.stroke + '"></div>'
        + '<span class="sq-gtl__consensus-val">' + ev.consensus + '%</span>'
        + '</div>'
        + '</div>'
        + '</div>';
    }).join('');

    /* 当前状态卡片 */
    var currentCard = '<div class="sq-gtl__current" style="--trust-c:' + c.stroke + '">'
      + '<div class="sq-gtl__current-head">'
      + avatar(author, 32)
      + '<div class="sq-gtl__current-info">'
      + '<span class="sq-gtl__current-name">' + escapeHtml(author.name) + '</span>'
      + '</div>'
      + '</div>'
      + '<div class="sq-gtl__current-stats">'
      + '<div class="sq-gtl__stat"><span class="sq-gtl__stat-val">' + formatCount(note.likes || 0) + '</span><span class="sq-gtl__stat-label">赞同</span></div>'
      + '<div class="sq-gtl__stat"><span class="sq-gtl__stat-val">' + formatCount(note.commentCount || 0) + '</span><span class="sq-gtl__stat-label">讨论</span></div>'
      + '<div class="sq-gtl__stat"><span class="sq-gtl__stat-val">' + formatCount(note.sedimentCount || 0) + '</span><span class="sq-gtl__stat-label">沉淀</span></div>'
      + '</div>'
      + '<div class="sq-gtl__debate-bar">'
      + '<div class="sq-gtl__debate-pro" style="width:' + stats.proPercent + '%"></div>'
      + '<span class="sq-gtl__debate-label">正 ' + stats.proPercent + '%</span>'
      + '<span class="sq-gtl__debate-label sq-gtl__debate-label--con">反 ' + stats.conPercent + '%</span>'
      + '</div>'
      + '</div>';

    scroll.innerHTML =
      '<div class="sq-gtl__section-title">论点演化</div>'
      + '<div class="sq-gtl__hero">'
      + '<h2 class="sq-gtl__hero-title">' + escapeHtml(note.title) + '</h2>'
      + '<p class="sq-gtl__hero-summary">' + escapeHtml(note.summary || '') + '</p>'
      + '</div>'
      + currentCard
      + '<div class="sq-gtl__timeline">' + eventsHtml + '</div>'
      + '<button class="sq-gtl__read-btn" data-action="open-note" data-id="' + noteId + '">阅读全文</button>';
  }

  /* 暴露 API */
  window.ZX_SQUARE = {
    init: init,
    pushView: pushView,
    popView: popView,
    scrollToFirstNote: function () {
      var scroller = $('[data-sq-feed-scroll]');
      if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
    },
    toggleFeedMode: toggleFeedMode,
    state: state
  };

  /* 闭环：切回广场时刷新 Feed（让新发布/关注联动可见） */
  window.addEventListener('zx-tab-active', function (e) {
    if (e.detail && e.detail.tab === 'square') {
      /* 仅在 Feed 视图时刷新，避免市场视图被覆盖 */
      if (state.stack[state.stack.length - 1] === 'feed') {
        try { renderFeed(); } catch (x) {}
      }
    }
  });

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
