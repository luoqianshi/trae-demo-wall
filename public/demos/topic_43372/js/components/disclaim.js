/* ============================================================
 * disclaim.js  免责声明弹窗
 * 调用 __DISCLAIM.require().then(()=>{ ... })；用户勾选同意后才继续
 * ============================================================ */
(function (global) {
  'use strict';
  var STORAGE_KEY = 'bjsd_agree_v1';

  function showModal(resolver) {
    var modal = document.getElementById('disclaim-modal');
    if (!modal) { resolver(true); return; }
    modal.classList.remove('hidden');
    var agreeBox = document.getElementById('disclaim-agree');
    var okBtn = document.getElementById('btn-disclaim-ok');
    var cancelBtn = document.getElementById('btn-disclaim-cancel');
    agreeBox.checked = false;
    okBtn.disabled = true;

    function onCheck() { okBtn.disabled = !agreeBox.checked; }
    function onOk() {
      try { localStorage.setItem(STORAGE_KEY, '1'); } catch (e) {}
      cleanup();
      resolver(true);
    }
    function onCancel() {
      cleanup();
      global.__C.toast('您未同意免责声明，相关功能已取消', 'warning');
      resolver(false);
    }
    function onMask(e) { if (e.target.classList.contains('modal')) onCancel(); }
    function cleanup() {
      modal.classList.add('hidden');
      agreeBox.removeEventListener('change', onCheck);
      okBtn.removeEventListener('click', onOk);
      cancelBtn.removeEventListener('click', onCancel);
      modal.removeEventListener('click', onMask);
    }
    agreeBox.addEventListener('change', onCheck);
    okBtn.addEventListener('click', onOk);
    cancelBtn.addEventListener('click', onCancel);
    modal.addEventListener('click', onMask);
  }

  function require() {
    return new Promise(function (resolve) {
      var agreed;
      try { agreed = localStorage.getItem(STORAGE_KEY); } catch (e) {}
      if (agreed === '1') return resolve(true);
      showModal(resolve);
    });
  }

  function reset() {
    try { localStorage.removeItem(STORAGE_KEY); } catch (e) {}
  }

  global.__DISCLAIM = { require: require, reset: reset };
})(window);
