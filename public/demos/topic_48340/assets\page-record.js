/* 日常记录页 */
(function () {
  'use strict';
  if (!window.HML) return;

  var $recInput = document.getElementById('recordInput');
  var $btnAdd = document.getElementById('btnAdd');
  var $btnSeed = document.getElementById('btnSeed');
  var $recOutput = document.getElementById('recOutput');
  var $recLoader = document.getElementById('recLoader');
  var $recStatus = document.getElementById('recStatus');

  function showOutput(html) {
    $recOutput.classList.remove('placeholder');
    $recOutput.innerHTML = html;
  }

  function showPlaceholder() {
    $recOutput.classList.add('placeholder');
    $recOutput.innerHTML = '';
  }

  function addRecordFromInput() {
    var v = ($recInput.value || '').trim();
    if (!v) {
      if (window.__showToast) window.__showToast('请在框里写一句今天的小事');
      $recInput.focus();
      return;
    }
    var who = '家人';
    var body = v;
    var m = v.match(/^记录者[：:]\s*([^\n]+)\s*\n([\s\S]+)$/);
    if (m) { who = m[1].trim(); body = m[2].trim(); }

    $btnAdd.disabled = true;
    $recStatus.textContent = 'AI 正在写摘要…';
    $recLoader.classList.add('active');
    showOutput('<div style="display:grid;gap:.6rem">' +
      '<div style="height:14px;width:90%;background:color-mix(in srgb, var(--rule) 70%, transparent);border-radius:6px;animation:pulse 1.2s ease-in-out infinite"></div>' +
      '<div style="height:14px;width:75%;background:color-mix(in srgb, var(--rule) 70%, transparent);border-radius:6px;animation:pulse 1.2s ease-in-out infinite .15s"></div>' +
      '<div style="height:14px;width:85%;background:color-mix(in srgb, var(--rule) 70%, transparent);border-radius:6px;animation:pulse 1.2s ease-in-out infinite .3s"></div>' +
      '</div>');

    setTimeout(function () {
      var k = HML.extractKeywords(body);
      var summary = '对方可能想知道：「' + k.careBody + '」';
      var future = '一个月后，这条记录会变成「那天我们彼此多懂了一点」。';

      HML.addMemoryItem({
        time: HML.nowStamp(),
        who: who,
        raw: body,
        summary: summary,
        future: future,
        horizon: 'today'
      });

      $recLoader.classList.remove('active');
      var html = ''
        + '<div class="result-block" style="animation: fadeUp .55s ease both;">'
        +   '<span class="result-label">记录者</span>'
        +   '<div class="result-text">' + HML.escapeHtml(who) + '</div>'
        + '</div>'
        + '<div class="result-block" style="animation: fadeUp .55s ease .12s both;">'
        +   '<span class="result-label">原始记录</span>'
        +   '<div class="result-text">' + HML.escapeHtml(body) + '</div>'
        + '</div>'
        + '<div class="result-block" style="animation: fadeUp .55s ease .24s both;">'
        +   '<span class="result-label">AI 摘要 · 对方可能想知道</span>'
        +   '<div class="response-bubble">' + HML.escapeHtml(summary) + '<small>基于本地关键词识别（' + HML.escapeHtml(k.tags.join(' / ')) + '）</small></div>'
        + '</div>'
        + '<div class="result-block" style="animation: fadeUp .55s ease .36s both;">'
        +   '<span class="result-label">未来回忆</span>'
        +   '<div class="result-text serif quote-text">' + HML.escapeHtml(future) + '</div>'
        + '</div>'
        + '<div class="card-actions" style="animation: fadeUp .55s ease .48s both;">'
        +   '<a class="micro-btn primary" href="./page-memory.html">查看家庭时间线 →</a>'
        +   '<button class="micro-btn" data-act="more" type="button">继续记录</button>'
        + '</div>';
      showOutput(html);
      $recOutput.querySelector('[data-act="more"]').addEventListener('click', function () {
        $recInput.value = '';
        showPlaceholder();
        $recInput.focus();
        $recStatus.textContent = '就绪';
      });
      $btnAdd.disabled = false;
      $recStatus.textContent = '已加入家庭时间线';
    }, 900);
  }

  $btnAdd.addEventListener('click', addRecordFromInput);

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
    if (window.__showToast) window.__showToast('已载入示例回忆 · 跳转到时间线');
    setTimeout(function () { window.location.href = './page-memory.html'; }, 700);
  });

  showPlaceholder();
})();
