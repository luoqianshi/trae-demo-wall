/* page-family.js · 家人陪伴 */
(function () {
  'use strict';

  window.callFamily = function (role) {
    if (window.toast) window.toast('📹 正在呼叫' + role + '...');
  };

  window.endCall = function () {
    if (window.toast) window.toast('已挂断 · 已生成家庭时光记录');
  };

  window.subTitle = function () {
    if (window.toast) window.toast('字幕已开启');
  };
})();
