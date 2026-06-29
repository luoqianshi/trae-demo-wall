/* 家庭流页：渲染 HML.FEED，支持 HE/BE 风格切换 */
(function () {
  'use strict';
  if (!window.HML) return;

  var $list = document.getElementById('feedList');
  var $styleSwitch = document.getElementById('styleSwitch');
  var style = 'he';

  function mediaHtml(post) {
    if (post.type === 'photo') {
      return '<div class="feed-media photo" title="' + HML.escapeHtml(post.mediaCaption) + '">' + HML.escapeHtml(post.mediaCaption) + '</div>';
    }
    if (post.type === 'video') {
      return '<div class="feed-media video" title="' + HML.escapeHtml(post.mediaCaption) + '">' + HML.escapeHtml(post.mediaCaption) + '</div>';
    }
    return '<div class="feed-media text-only">"' + HML.escapeHtml(post.text) + '"</div>';
  }

  function render() {
    var items = HML.FEED;
    var filtered = items.filter(function (p) {
      if (style === 'he') return p.id !== 'p2' && p.id !== 'p4';
      return p.id === 'p2' || p.id === 'p4';
    });
    if (!filtered.length) {
      $list.innerHTML = '<div class="empty-state">这个风格下还没有内容，切换一下看看。</div>';
      return;
    }
    $list.innerHTML = filtered.map(function (p, idx) {
      return ''
        + '<div class="feed-card will-reveal in" style="animation: fadeUp .55s ease ' + (idx * 0.06) + 's both;">'
        +   '<div class="feed-head">'
        +     '<div class="feed-avatar">' + HML.escapeHtml(p.avatar) + '</div>'
        +     '<div class="meta">'
        +       '<span class="name">' + HML.escapeHtml(p.who) + '</span>'
        +       '<span class="time">' + HML.escapeHtml(p.time) + '</span>'
        +     '</div>'
        +     '<span class="ai-badge">AI</span>'
        +   '</div>'
        +   (p.type === 'text' ? mediaHtml(p) : mediaHtml(p))
        +   (p.type !== 'text' ? '<p class="feed-text">' + HML.escapeHtml(p.text) + '</p>' : '')
        +   '<div class="feed-foot">'
        +     '<span class="ai-summary">⚡ ' + HML.escapeHtml(p.aiSummary) + '</span>'
        +     '<span style="margin-left:auto;">' + p.tags.map(function (t) { return '<span style="color: var(--accent); margin-left: .3rem;">' + HML.escapeHtml(t) + '</span>'; }).join('') + '</span>'
        +   '</div>'
        + '</div>';
    }).join('');
  }

  $styleSwitch.addEventListener('click', function (e) {
    var b = e.target.closest('button[data-style]');
    if (!b) return;
    style = b.getAttribute('data-style');
    var btns = $styleSwitch.querySelectorAll('button');
    for (var i = 0; i < btns.length; i++) btns[i].classList.toggle('active', btns[i] === b);
    render();
  });

  render();
})();
