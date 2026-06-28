/* 过去的今天页 + 补录回忆 */
(function () {
  'use strict';
  if (!window.HML) return;

  var $pastList = document.getElementById('pastList');
  var $uploadedList = document.getElementById('uploadedList');
  var $uploadZone = document.getElementById('uploadZone');

  function renderPast() {
    var items = HML.PAST_TODAY;
    $pastList.innerHTML = items.map(function (p, idx) {
      return ''
        + '<div class="past-card will-reveal in" style="animation: fadeUp .55s ease ' + (idx * 0.08) + 's both;">'
        +   '<span class="ai-badge">AI</span>'
        +   '<h3>' + p.yearsAgo + ' 年前的今天 · ' + HML.escapeHtml(p.who) + '</h3>'
        +   '<p>原发布日期：' + p.matchDate + ' · 类型：' + (p.type === 'photo' ? '照片' : '视频') + '</p>'
        +   '<div class="past-quote">"' + HML.escapeHtml(p.text) + '"</div>'
        +   '<div class="past-meta">⚡ AI 唤起：' + HML.escapeHtml(p.aiEcho) + '</div>'
        +   '<div class="past-meta" style="margin-top:.35rem; font-style: italic; color: color-mix(in srgb, var(--muted) 80%, transparent);">'
        +     HML.escapeHtml(p.hint)
        +   '</div>'
        + '</div>';
    }).join('');
  }

  function renderUploaded() {
    var list = HML.getMemoryList().filter(function (m) { return m.uploaded === true; });
    if (!list.length) return;
    $uploadedList.innerHTML = '<div style="font-size:.85rem; color: var(--muted); margin-bottom:.4rem;">已补录：</div>' + list.map(function (u) {
      return ''
        + '<div class="feed-card will-reveal in" style="animation: fadeUp .5s ease both; padding:.9rem 1.1rem;">'
        +   '<div class="feed-head">'
        +     '<div class="feed-avatar">' + HML.escapeHtml(u.who ? u.who[0] : '我') + '</div>'
        +     '<div class="meta">'
        +       '<span class="name">' + HML.escapeHtml(u.who || '家人') + '</span>'
        +       '<span class="time">' + HML.escapeHtml(u.time) + '</span>'
        +     '</div>'
        +     '<span class="ai-badge">AI</span>'
        +   '</div>'
        +   '<p class="feed-text">' + HML.escapeHtml(u.raw) + '</p>'
        +   '<div class="feed-foot"><span class="ai-summary">⚡ ' + HML.escapeHtml(u.summary) + '</span></div>'
        + '</div>';
    }).join('');
  }

  $uploadZone.addEventListener('click', function () {
    var date = prompt('AI 识别中... \n为这张照片填一个时间（格式：YYYY-MM-DD）\n（演示中我们直接让你填，不调用 EXIF）', '2014-08-15');
    if (!date) return;
    var who = prompt('记录者是谁？', '奶奶');
    if (!who) return;
    var desc = prompt('这张照片背后的小事（一句话）', '我带着孙女第一次去公园，她在湖边扔面包给鸭子，笑得特别大声。');
    if (!desc) return;
    HML.addMemoryItem({
      time: date,
      who: who,
      raw: desc,
      summary: 'AI 补录：自动归到 ' + date + ' 的家庭时间线',
      future: '未来某天，「过去的今天」可能会唤醒这张照片。',
      horizon: 'today',
      uploaded: true
    });
    if (window.__showToast) window.__showToast('已补录到家庭时间线 · ' + date);
    renderUploaded();
  });

  renderPast();
  renderUploaded();
})();
