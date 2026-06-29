/* 翻译页交互 */
(function () {
  'use strict';
  if (!window.HML) return;

  var $caseTabs = document.getElementById('caseTabs');
  var $rolePicker = document.getElementById('rolePicker');
  var $userInput = document.getElementById('userInput');
  var $btnTranslate = document.getElementById('btnTranslate');
  var $btnClear = document.getElementById('btnClear');
  var $outputArea = document.getElementById('outputArea');
  var $loader = document.getElementById('loader');
  var $statusHint = document.getElementById('statusHint');

  var state = {
    caseIndex: 0,
    role: 'elder'
  };

  function applyCase(idx, opts) {
    opts = opts || {};
    state.caseIndex = idx;
    var c = HML.CASES[idx];
    if (!c) return;
    var tabs = $caseTabs.querySelectorAll('.case-tab');
    for (var i = 0; i < tabs.length; i++) {
      tabs[i].classList.toggle('active', String(i) === String(idx));
    }
    state.role = c.role;
    var chips = $rolePicker.querySelectorAll('.role-chip');
    for (var j = 0; j < chips.length; j++) {
      chips[j].classList.toggle('active', chips[j].getAttribute('data-role') === state.role);
    }
    if (opts.skipInput !== true) {
      $userInput.value = c.raw;
    }
    resetOutput();
    $statusHint.textContent = '已选案例 ' + (idx + 1) + ' / 5';
  }

  function resetOutput() {
    $outputArea.classList.add('placeholder');
    $outputArea.innerHTML = '';
  }

  $caseTabs.addEventListener('click', function (e) {
    var t = e.target.closest('.case-tab');
    if (!t) return;
    var idx = parseInt(t.getAttribute('data-case'), 10);
    if (!isNaN(idx)) applyCase(idx);
  });

  $rolePicker.addEventListener('click', function (e) {
    var t = e.target.closest('.role-chip');
    if (!t) return;
    var r = t.getAttribute('data-role');
    if (!r) return;
    state.role = r;
    var chips = $rolePicker.querySelectorAll('.role-chip');
    for (var i = 0; i < chips.length; i++) {
      chips[i].classList.toggle('active', chips[i] === t);
    }
  });

  $btnClear.addEventListener('click', function () {
    $userInput.value = '';
    resetOutput();
    $statusHint.textContent = '已清空';
  });

  $btnTranslate.addEventListener('click', function () {
    var text = ($userInput.value || '').trim();
    if (!text) {
      if (window.__showToast) window.__showToast('请输入一句家人的原话，或选择上方案例');
      $userInput.focus();
      return;
    }
    $btnTranslate.disabled = true;
    $statusHint.textContent = 'AI 正在理解…';
    $loader.classList.add('active');
    $outputArea.classList.remove('placeholder');
    $outputArea.innerHTML = '<div style="display:grid;gap:.6rem">' +
      '<div style="height:14px;width:90%;background:color-mix(in srgb, var(--rule) 70%, transparent);border-radius:6px;animation:pulse 1.2s ease-in-out infinite"></div>' +
      '<div style="height:14px;width:75%;background:color-mix(in srgb, var(--rule) 70%, transparent);border-radius:6px;animation:pulse 1.2s ease-in-out infinite .15s"></div>' +
      '<div style="height:14px;width:85%;background:color-mix(in srgb, var(--rule) 70%, transparent);border-radius:6px;animation:pulse 1.2s ease-in-out infinite .3s"></div>' +
      '</div>';

    setTimeout(function () {
      var r = HML.buildResult(state.caseIndex, state.role, text);
      HML.setCurrentCard(r);
      $loader.classList.remove('active');
      HML.renderResultInline($outputArea, r);
      $btnTranslate.disabled = false;
      $statusHint.textContent = '已生成 · 可跳转对话卡';
    }, 1100);
  });

  // 初始
  applyCase(0);
})();
