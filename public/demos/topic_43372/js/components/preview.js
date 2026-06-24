/* ============================================================
 * preview.js  数据预览组件
 * 调用：__PREVIEW.show('标题', [[表头],[数据行],[...]])
 * ============================================================ */
(function (global) {
  'use strict';

  function show(title, aoa, maxRows) {
    maxRows = maxRows || 100;
    var modal = document.getElementById('preview-modal');
    if (!modal) return;
    var tEl = document.getElementById('preview-title');
    var bodyEl = document.getElementById('preview-body');
    if (tEl) tEl.textContent = title || '数据预览';
    if (!bodyEl) return;

    var html = '';
    if (!aoa || !aoa.length) {
      html = '<p style="padding:20px;color:#999;">暂无数据</p>';
    } else {
      html = '<table class="preview-table"><thead><tr>';
      var header = aoa[0] || [];
      for (var c = 0; c < header.length; c++) html += '<th>' + escapeHTML(header[c]) + '</th>';
      html += '</tr></thead><tbody>';
      for (var r = 1; r < Math.min(aoa.length, maxRows + 1); r++) {
        html += '<tr>';
        for (var c2 = 0; c2 < header.length; c2++) {
          html += '<td>' + escapeHTML(aoa[r][c2] != null ? aoa[r][c2] : '') + '</td>';
        }
        html += '</tr>';
      }
      html += '</tbody></table>';
      if (aoa.length > maxRows + 1) {
        html += '<p style="color:#999;font-size:12px;margin-top:8px;">（仅显示前 ' + maxRows + ' 行预览，完整数据请下载查看）</p>';
      }
    }
    bodyEl.innerHTML = html;
    modal.classList.remove('hidden');
  }

  function escapeHTML(v) {
    return String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function hide() {
    var modal = document.getElementById('preview-modal');
    if (modal) modal.classList.add('hidden');
  }

  function init() {
    var closeBtn = document.getElementById('btn-preview-close');
    var modal = document.getElementById('preview-modal');
    if (closeBtn) closeBtn.addEventListener('click', hide);
    if (modal) {
      modal.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-mask')) hide();
      });
    }
  }

  document.addEventListener('DOMContentLoaded', init);
  global.__PREVIEW = { show: show, hide: hide };
})(window);
