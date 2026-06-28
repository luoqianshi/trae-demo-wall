/* 对话卡页：从 localStorage 读取当前翻译结果，展示为一张大对话卡 */
(function () {
  'use strict';
  if (!window.HML) return;

  var $empty = document.getElementById('emptyState');
  var $shell = document.getElementById('cardShell');
  var $title = document.getElementById('cardTitle');
  var $meta = document.getElementById('cardMeta');
  var $detail = document.getElementById('cardDetail');
  var $actCopy = document.getElementById('actCopy');
  var $actExport = document.getElementById('actExport');
  var $actMemory = document.getElementById('actMemory');

  var r = HML.getCurrentCard();

  function render() {
    if (!r) {
      $empty.style.display = 'block';
      $shell.style.display = 'none';
      return;
    }
    $empty.style.display = 'none';
    $shell.style.display = 'block';
    $title.textContent = '家庭对话卡 · ' + (r.title || '自由输入');
    $meta.textContent = (r.role === 'elder' ? '说话者：老人/父母' : '说话者：年轻人') + ' · 生成于 ' + HML.nowStamp();

    var html = ''
      + '<div class="row"><span class="k">原话</span><span class="v">' + HML.escapeHtml(r.raw) + '</span></div>'
      + '<div class="row"><span class="k">真实关心</span><span class="v"><mark class="key">' + HML.escapeHtml(r.care) + '</mark></span></div>'
      + '<div class="row"><span class="k">温柔改写</span><span class="v serif">' + HML.escapeHtml(r.gentle) + '</span></div>'
      + '<div class="row"><span class="k">推荐回应</span><span class="v">' + HML.escapeHtml(r.reply) + '</span></div>'
      + '<div class="row"><span class="k">日常记录</span><span class="v">' + HML.escapeHtml(r.memoryHook) + '</span></div>'
      + '<div class="row"><span class="k">未来回忆</span><span class="v serif">' + HML.escapeHtml(r.futureEcho) + '</span></div>';
    $detail.innerHTML = html;
  }

  $actCopy.addEventListener('click', function () {
    if (!r) return;
    var t = '【家庭对话卡】\n原话：' + r.raw + '\n真实关心：' + r.care + '\n温柔改写：' + r.gentle + '\n推荐回应：' + r.reply + '\n日常记录：' + r.memoryHook + '\n未来回忆：' + r.futureEcho;
    HML.copyText(t);
  });

  $actExport.addEventListener('click', function () {
    if (!r) return;
    var text = '《你好，我的思念》· 家庭对话卡\n\n原话：' + r.raw + '\n\n真实关心：' + r.care + '\n\n温柔改写：' + r.gentle + '\n\n推荐回应：' + r.reply + '\n\n日常记录：' + r.memoryHook + '\n\n未来回忆：' + r.futureEcho + '\n\n—— 由《你好，我的思念》Demo 生成';
    HML.exportText('family-card-' + Date.now() + '.txt', text);
    if (window.__showToast) window.__showToast('已导出为文本文件');
  });

  $actMemory.addEventListener('click', function () {
    if (!r) return;
    HML.addMemoryItem({
      time: HML.nowStamp(),
      who: r.role === 'elder' ? '家人' : '我',
      raw: r.raw,
      summary: (r.care || '') + ' / 温柔版：' + r.gentle,
      future: r.futureEcho,
      horizon: 'today'
    });
    if (window.__showToast) window.__showToast('已加入家庭时间线 · 跳转到回忆页');
    setTimeout(function () { window.location.href = './page-memory.html'; }, 700);
  });

  render();
})();
