/* =========================================================================
 * 「知行」前端 Demo —— 共享图标库（Phase 0 / Task 0.7）
 * -------------------------------------------------------------------------
 * 设计原则：24×24 viewBox / stroke-width 1.6 / stroke=currentColor / fill=none
 *           圆角端点 stroke-linecap=round / stroke-linejoin=round
 *           —— 呼应「墨韵」：细、克制、有书法笔意，类 Lucide / Feather 风格
 * 挂载方式：
 *   <script src="../shared/icons.js"></script>
 *   el.innerHTML = ZX.icon('like');           // 默认 24px
 *   el.innerHTML = ZX.icon('graph', 32);      // 指定 32px
 * 失败兜底：未知 name 退回 spark（AI 四角星）。
 * 与 mock-data.js 共用 window.ZX 命名空间（mock-data.js 挂 ZX.mock，本文件挂 ZX.icon）。
 * 覆盖图标：like / dislike / comment / share / sediment / search / link / graph
 *           / voice / camera / url / clipboard / spark / arrow-up/down/left/right
 *           / close / plus / check / menu / back / vs / tree / list / template
 *           / publish / crown / fingerprint —— 共 29 个。
 * =======================================================================*/

(function () {
  'use strict';

  var ICONS = {

    like:        '<path d="M7 22V10"/><path d="M7 10l4-7c1.5 0 2.5 1 2.5 2.5V8h5.5a2 2 0 0 1 2 2.4l-1.4 8A2 2 0 0 1 17.6 20H7"/><path d="M3 10h4v12H3a1 1 0 0 1-1-1V11a1 1 0 0 1 1-1z"/>',

    dislike:     '<path d="M17 2v12"/><path d="M17 14l-4 7c-1.5 0-2.5-1-2.5-2.5V16H5a2 2 0 0 1-2-2.4l1.4-8A2 2 0 0 1 6.4 4H17"/><path d="M21 14h-4V2h4a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1z"/>',

    comment:     '<path d="M21 11.5a8.5 8.5 0 0 1-12.3 7.6L3 21l1.9-5.7A8.5 8.5 0 1 1 21 11.5z"/>',

    share:       '<path d="M14 4h6v6"/><path d="M20 4l-9 9"/><path d="M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/>',

    sediment:    '<path d="M4 4h16l-6 7v9l-4-2v-7z"/>',

    search:      '<circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/>',

    link:        '<path d="M9 15l6-6"/><path d="M10.5 6.5l1-1a4 4 0 0 1 6 6l-2 2"/><path d="M13.5 17.5l-1 1a4 4 0 0 1-6-6l2-2"/>',

    graph:       '<circle cx="6" cy="7" r="2.4"/><circle cx="18" cy="9" r="2.4"/><circle cx="12" cy="18" r="2.4"/><path d="M8.2 8.1l3.2 8M15.7 10.2l-3.3 6M8.1 7.4l7.6 1.3"/>',

    voice:       '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0"/><path d="M12 18v3"/>',

    camera:      '<path d="M3 8a2 2 0 0 1 2-2h2.2l1.6-2h6.4l1.6 2H19a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="13" r="3.4"/>',

    url:         '<circle cx="11" cy="11" r="7"/><path d="M4 11h14"/><path d="M11 4c1.8 2 2.8 4.5 2.8 7s-1 5-2.8 7c-1.8-2-2.8-4.5-2.8-7s1-5 2.8-7z"/><path d="m16.5 16.5 4 4"/>',

    clipboard:   '<rect x="6" y="4" width="12" height="18" rx="2"/><path d="M9 4V3a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v1"/><path d="M9 11h6"/><path d="M9 15h4"/>',

    spark:       '<path d="M12 3l1.7 6.3L20 11l-6.3 1.7L12 19l-1.7-6.3L4 11l6.3-1.7z"/>',

    'arrow-up':  '<path d="M12 19V5M6 11l6-6 6 6"/>',

    'arrow-down':'<path d="M12 5v14M6 13l6 6 6-6"/>',

    'arrow-left':'<path d="M19 12H5M11 6l-6 6 6 6"/>',

    'arrow-right':'<path d="M5 12h14M13 6l6 6-6 6"/>',

    close:       '<path d="M6 6l12 12M18 6L6 18"/>',

    plus:        '<path d="M12 5v14M5 12h14"/>',

    check:       '<path d="M4 12l5 5L20 6"/>',

    menu:        '<path d="M3 6h18M3 12h18M3 18h18"/>',

    back:        '<path d="M9 14L4 9V4"/><path d="M4 9h11a5 5 0 0 1 0 10h-3"/>',

    vs:          '<path d="M4 4l5 8-5 8z"/><path d="M20 4l-5 8 5 8z"/>',

    tree:        '<rect x="9" y="3" width="6" height="4" rx="1"/><rect x="2" y="17" width="6" height="4" rx="1"/><rect x="16" y="17" width="6" height="4" rx="1"/><path d="M12 7v4M6 17v-3h12v3M18 17v-3"/>',

    list:        '<path d="M8 6h12M8 12h12M8 18h12"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/>',

    template:    '<rect x="3" y="3" width="14" height="14" rx="1.5"/><path d="M7 21h14V7"/>',

    publish:     '<path d="M12 16V4M7 9l5-5 5 5"/><path d="M4 20h16"/>',

    crown:       '<path d="M3 8l4.5 3L12 4l4.5 7L21 8l-1.5 10h-15z"/><path d="M4.5 18h15"/>',

    fingerprint: '<path d="M12 11a2 2 0 0 1 2 2c0 3-1 5-1 5"/><path d="M8 13a4 4 0 0 1 8 0c0 4-2 7-2 7"/><path d="M5 11a7 7 0 0 1 14 0c0 5-2 9-2 9"/>'
  };

  function icon(name, size) {
    size = size || 24;
    var inner = ICONS[name] || ICONS.spark;
    return ''
      + '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" '
      + 'viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" '
      + 'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">'
      + inner
      + '</svg>';
  }

  window.ZX = window.ZX || {};
  window.ZX.icon = icon;
  window.ZX.icons = ICONS;
})();
