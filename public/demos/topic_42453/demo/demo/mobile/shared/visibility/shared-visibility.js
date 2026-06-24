/* app-demo/mobile/shared-visibility.js */
/* 笔记可见度三维叠加模型（profile/friends/note-editor/publish/notebook 共享） */
(function (global) {
  var VIS = {};

  /* 维度① 可见范围（从宽到严）*/
  VIS.SCOPE = {
    all:     { key: 'all',     label: '所有人', icon: 'globe', rank: 4 },
    friends: { key: 'friends', label: '仅好友', icon: 'friends', rank: 3 },
    group:   { key: 'group',   label: '指定分组', icon: 'group', rank: 2 },
    self:    { key: 'self',    label: '仅自己', icon: 'lock', rank: 1 }
  };
  /* 维度② 预览开放（从保守到暴露）*/
  VIS.PREVIEW = {
    hidden:  { key: 'hidden',  label: '完整隐藏', rank: 1 },
    summary: { key: 'summary', label: '仅摘要', rank: 2 },
    firstN:  { key: 'firstN',  label: '前 N 篇', rank: 3 },
    promote: { key: 'promote', label: '单篇破例', rank: 3 }
  };
  /* 维度③ 付费门 */
  VIS.PAYWALL = {
    free:         { key: 'free',         label: '免费' },
    single:       { key: 'single',       label: '单篇付费' },
    subscription: { key: 'subscription', label: '整本订阅' },
    coin:         { key: 'coin',         label: '平台币' }
  };

  /* 父集限制向下收束：子集 rank 必须 ≤ 父集 rank（scope/preview 通用）*/
  VIS.isAllowed = function (dim, childKey, parentKey) {
    var table = dim === 'scope' ? VIS.SCOPE : VIS.PREVIEW;
    var c = table[childKey], p = table[parentKey];
    if (!c || !p) return true;
    return c.rank <= p.rank;
  };

  /* 默认可见度工厂 */
  VIS.defaultVisibility = function () {
    return { scope: 'all', preview: 'summary', paywall: 'free', scopeGroups: [], previewConfig: { chars: 200 } };
  };

  /* 图标 SVG（16x16 stroke）*/
  VIS.IC = {
    globe:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3a14 14 0 0 1 0 18"/><path d="M12 3a14 14 0 0 0 0 18"/></svg>',
    friends: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6"/><path d="M16 11l2 2 4-4"/></svg>',
    group:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><circle cx="9" cy="8" r="3"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M16 5.5a3 3 0 0 1 0 5"/><path d="M18 20c0-2.5-1-4.5-2.5-5.5"/></svg>',
    lock:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" aria-hidden="true" focusable="false"><rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/></svg>'
  };

  /* 渲染可见度标签 chip（scope + preview + paywall 三色点）*/
  VIS.chipHTML = function (v) {
    v = v || VIS.defaultVisibility();
    var s = VIS.SCOPE[v.scope] || VIS.SCOPE.all;
    var p = VIS.PREVIEW[v.preview] || VIS.PREVIEW.summary;
    var pw = VIS.PAYWALL[v.paywall] || VIS.PAYWALL.free;
    var ic = VIS.IC[s.icon] || '';
    var payTag = pw.key === 'free' ? '' : '<span class="vis-chip__pay">' + pw.label + '</span>';
    return '<span class="vis-chip" data-scope="' + s.key + '">'
      + '<span class="vis-chip__icon">' + ic + '</span>'
      + '<span class="vis-chip__label">' + s.label + '</span>'
      + '<span class="vis-chip__sep">·</span>'
      + '<span class="vis-chip__preview">' + p.label + '</span>'
      + payTag
      + '</span>';
  };

  /* 选择器状态：当前编辑的可见度 + 父集限制 + 回调 */
  var pickerState = null;

  VIS.openPicker = function (container, current, parentVis, onChange) {
    VIS.closePicker();
    var scrim = document.createElement('div');
    scrim.className = 'vis-picker-scrim';
    scrim.onclick = VIS.closePicker;
    var panel = document.createElement('div');
    panel.className = 'vis-picker';
    panel.innerHTML = VIS._renderPickerHTML(current, parentVis);
    /* 挂载到 .zx-phone 内部（避免 fixed 定位脱离手机外壳） */
    var phone = document.querySelector('.zx-phone') || document.body;
    phone.appendChild(scrim);
    phone.appendChild(panel);
    pickerState = { scrim: scrim, panel: panel, current: current, onChange: onChange };
    /* 选项点击委托 */
    panel.addEventListener('click', function (e) {
      var opt = e.target.closest('[data-pick]');
      if (!opt || opt.classList.contains('is-disabled')) return;
      var dim = opt.getAttribute('data-dim');
      var key = opt.getAttribute('data-pick');
      pickerState.current[dim] = key;
      panel.innerHTML = VIS._renderPickerHTML(pickerState.current, parentVis);
      if (onChange) onChange(pickerState.current);
    });
  };
  VIS.closePicker = function () {
    if (!pickerState) return;
    if (pickerState.scrim) pickerState.scrim.remove();
    if (pickerState.panel) pickerState.panel.remove();
    pickerState = null;
  };

  VIS._renderPickerHTML = function (current, parentVis) {
    parentVis = parentVis || {};
    function optionsHTML(dim, table, labels) {
      return Object.keys(table).map(function (k) {
        var item = table[k];
        var disabled = parentVis[dim] && !VIS.isAllowed(dim, k, parentVis[dim]);
        var selected = current[dim] === k ? ' is-selected' : '';
        var disCls = disabled ? ' is-disabled' : '';
        var icon = item.icon ? '<span class="vis-picker__opt-icon">' + (VIS.IC[item.icon] || '') + '</span>' : '';
        var label = labels ? labels[k] : item.label;
        return '<button class="vis-picker__opt' + selected + disCls + '" data-dim="' + dim + '" data-pick="' + k + '">'
          + icon + '<span>' + label + '</span>'
          + '<span class="vis-picker__opt-check"></span></button>';
      }).join('');
    }
    return '<h3 class="vis-picker__title">可见度设置</h3>'
      + '<div class="vis-picker__group"><p class="vis-picker__group-label">谁能看到</p>'
      + '<div class="vis-picker__options">' + optionsHTML('scope', VIS.SCOPE) + '</div></div>'
      + '<div class="vis-picker__group"><p class="vis-picker__group-label">预览开放</p>'
      + '<div class="vis-picker__options">' + optionsHTML('preview', VIS.PREVIEW) + '</div></div>'
      + '<div class="vis-picker__group"><p class="vis-picker__group-label">付费门</p>'
      + '<div class="vis-picker__options">' + optionsHTML('paywall', VIS.PAYWALL) + '</div></div>';
  };

  global.VIS = VIS;
})(window);
