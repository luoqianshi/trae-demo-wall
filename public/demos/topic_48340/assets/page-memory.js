/* 思念回忆页：渲染 localStorage 里的所有条目 */
(function () {
  'use strict';
  if (!window.HML) return;

  var $timeline = document.getElementById('memoryTimeline');
  var $btnSeed = document.getElementById('btnSeed');
  var $btnClear = document.getElementById('btnClear');

  function horizonLabel(h) {
    if (h === 'month') return '一个月后';
    if (h === 'year') return '一年后';
    return '今天';
  }

  function render() {
    var items = HML.getMemoryList();
    if (!items.length) {
      $timeline.innerHTML = '<div class="time-item" style="background: color-mix(in srgb, var(--paper) 12%, transparent); color: color-mix(in srgb, var(--paper) 80%, transparent);">还没有记录。点上面的「载入示例回忆」看看完整效果，或去 <a href="./page-record.html" style="color: var(--accent2);">日常记录</a> 加一笔。</div>';
      return;
    }
    var html = items.map(function (it, idx) {
      var stamp = it.horizon === 'today' ? it.time : (it.horizon === 'month' ? HML.futureStamp(1) : HML.futureStamp(12));
      var animDelay = Math.min(idx, 6) * 0.06;
      return ''
        + '<div class="time-item" style="animation: fadeUp .55s ease ' + animDelay + 's both;">'
        +   '<div class="meta">' + HML.escapeHtml(stamp) + ' · ' + horizonLabel(it.horizon) + ' · 记录者：' + HML.escapeHtml(it.who) + '</div>'
        +   '<div class="body">' + HML.escapeHtml(it.raw) + '</div>'
        +   '<div class="ai-summary">AI 摘要：' + HML.escapeHtml(it.summary) + '</div>'
        +   '<div class="ai-summary future">未来回忆：' + HML.escapeHtml(it.future) + '</div>'
        + '</div>';
    }).join('');
    $timeline.innerHTML = html;
  }

  $btnSeed.addEventListener('click', function () {
    HML.addMemoryItem({
      time: '2025-12-12 19:30',
      who: '奶奶',
      raw: '今天我蒸了一锅红糖馒头，等孙女回家吃。她今晚没回来，我给她留了两个在锅里。',
      summary: '对方可能想知道：「她有没有按时吃饭、冷不冷、累不累」',
      future: '一年后，这条记录会变成「那锅没人吃的红糖馒头」，是奶奶一直在等的证据。',
      horizon: 'month'
    });
    HML.addMemoryItem({
      time: '2026-01-08 22:14',
      who: '我（孙女）',
      raw: '今天回家奶奶把上次留的馒头热给我吃，外面凉了，里面还是热的。她怕我冷，开了两台空调。',
      summary: '对方可能想知道：「孩子终于回来了，我做的她还记得」',
      future: '一年后，这条记录会变成「你终于吃上那锅红糖馒头的那个冬天」。',
      horizon: 'month'
    });
    HML.addMemoryItem({
      time: HML.futureStamp(12),
      who: '家庭时间线',
      raw: '过去一年里，奶奶和孙女一共交换了 23 条日常记录，4 张家庭对话卡，1 次「思念回忆」生成。',
      summary: 'AI 时间线摘要：这一年的变化是——奶奶从"不要玩手机"变成了"要不要和我说说"，孙女从"懒得解释"变成了"我先说给你听"。',
      future: '继续记录下去，五年后这会是一封很长很长的家书。',
      horizon: 'year'
    });
    if (window.__showToast) window.__showToast('已载入示例回忆');
    render();
  });

  $btnClear.addEventListener('click', function () {
    if (confirm('清空整个家庭时间线？')) {
      try { localStorage.removeItem(HML.STORAGE.memory); } catch (e) {}
      if (window.__showToast) window.__showToast('时间线已清空');
      render();
    }
  });

  render();
})();
