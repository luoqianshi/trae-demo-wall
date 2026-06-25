/* =========================================================================
 * 「知行」App 本体 Demo —— ZX_DISPATCH 共享调度渲染（zx-dispatch.js）
 * -------------------------------------------------------------------------
 * 职责：把 notebook 原有的 renderDispatch 抽成共享 helper，供 notebook 对话页
 *       与 note-editor（canvas/outline/dual）复用——林调用子智能体的鎏金色带、
 *       可展开的子会话结果，在 App 任何位置呈现一致。
 * 依赖：window.ZX_AGENTS（notebook 暴露）、window.ZX_AI（取材）
 * 契约：
 *   · render(m)  m={agentId, status:'pending'|'done', expanded, result?, _domId?} → HTML 串
 *   · result(agentId, query) → 内部调 ZX_AI.dispatch 返回 {query,duration,resultCount,items}
 * =======================================================================*/

(function () {
  'use strict';

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c];
    });
  }

  function agents() {
    return (window.ZX_AGENTS) || {
      search:   { id: 'search',   name: '搜索', icon: '🔍' },
      summary:  { id: 'summary',  name: '总结', icon: '📋' },
      research: { id: 'research', name: '研究', icon: '🔬' },
      reader:   { id: 'reader',   name: '陪读', icon: '📖' }
    };
  }

  function render(m) {
    if (!m) return '';
    if (!m._domId) m._domId = 'd' + Date.now() + Math.random().toString(36).slice(2, 6);
    var A = agents();
    var agent = A[m.agentId] || A.search;
    var icon = agent.icon || '✦';
    var isDone = m.status === 'done';
    var statusText = isDone ? '子智能体已完成' : '子智能体工作中…';
    var toggleText = m.expanded ? '收起 ▴' : '查看子会话 ▾';

    var head =
      '<div class="nb-dispatch__head">' +
      '<span class="nb-dispatch__icon">' + icon + '</span>' +
      '<div class="nb-dispatch__headtext">' +
      '<span class="nb-dispatch__call">林正在调用 <b>' + escapeHtml(agent.name) + '</b>智能体</span>' +
      '<span class="nb-dispatch__status">' + escapeHtml(statusText) + '</span>' +
      '</div>' +
      '<button class="nb-dispatch__toggle" data-action="toggle-dispatch" data-id="' + m._domId + '" aria-expanded="' + (m.expanded ? 'true' : 'false') + '">' + escapeHtml(toggleText) + '</button>' +
      '</div>';

    var body = '';
    if (m.expanded && isDone && m.result) {
      var r = m.result;
      var items = (r.items || []).map(function (it, idx) {
        return '<li class="nb-dispatch__item"><span class="nb-dispatch__no">' + (idx + 1) + '.</span><span>' + escapeHtml(it) + '</span></li>';
      }).join('');
      body =
        '<div class="nb-dispatch__body">' +
        '<div class="nb-dispatch__query">' + escapeHtml(icon + ' ' + agent.name + '：' + r.query) + '</div>' +
        '<div class="nb-dispatch__meta">找到 ' + r.resultCount + ' 条结果（耗时 ' + escapeHtml(r.duration) + '）</div>' +
        (items ? '<ol class="nb-dispatch__list">' + items + '</ol>' : '') +
        '<button class="nb-dispatch__full" data-action="noop">[完整结果]</button>' +
        '</div>';
    } else if (m.expanded && !isDone) {
      body = '<div class="nb-dispatch__body"><div class="nb-dispatch__pending">' + icon + ' 正在检索…</div></div>';
    }

    return '<div class="nb-msg nb-msg--dispatch" data-dispatch-id="' + m._domId + '">' +
      '<div class="nb-dispatch' + (m.expanded ? ' is-expanded' : '') + (isDone ? ' is-done' : '') + '">' +
      head + body +
      '</div></div>';
  }

  function result(agentId, query) {
    if (window.ZX_AI && typeof window.ZX_AI.dispatch === 'function') {
      return window.ZX_AI.dispatch(agentId, query);
    }
    return { query: query || '', duration: '1.0s', resultCount: 0, items: [] };
  }

  window.ZX_DISPATCH = { render: render, result: result };
})();
