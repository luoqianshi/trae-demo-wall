/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

/**
 * 注册/登录弹窗（适老友好）
 * 用法: openAuthModal({ redirectUrl: '../html/me/me_home.html' })
 * 功能: 弹出注册弹窗，输入手机号+验证码后跳转；也可点击"直接登录"跳转
 * 主题: 默认橙色（父母页），可通过覆盖 .auth-modal 上的 CSS 变量适配其他主题
 */
(function () {
  'use strict';

  var overlay = null;
  var countdownTimer = null;
  var countdownSeconds = 60;
  var redirectUrl = '../html/me/me_home.html';

  // 注入样式（仅注入一次）
  function injectStyles() {
    if (document.getElementById('auth-modal-styles')) return;
    var style = document.createElement('style');
    style.id = 'auth-modal-styles';
    style.textContent = [
      '/* ===== 注册弹窗遮罩 ===== */',
      '.auth-overlay {',
      '  position: fixed; top: 0; left: 0; right: 0; bottom: 0;',
      '  background: rgba(0, 0, 0, 0.55);',
      '  z-index: 9999;',
      '  display: flex; align-items: center; justify-content: center;',
      '  padding: 20px;',
      '  animation: authFadeIn 0.2s ease;',
      '}',
      '@keyframes authFadeIn { from { opacity: 0; } to { opacity: 1; } }',
      '/* ===== 弹窗主体（默认橙色主题，可通过 CSS 变量覆盖） ===== */',
      '.auth-modal {',
      '  position: relative;',
      '  background: #fff;',
      '  border-radius: 24px;',
      '  width: 100%; max-width: 380px;',
      '  padding: 36px 28px 24px;',
      '  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);',
      '  animation: authSlideUp 0.25s ease;',
      '  --auth-primary: #E06A35;',
      '  --auth-primary-dark: #C4451A;',
      '  --auth-primary-light: #FF7B42;',
      '  --auth-bg-soft: #FFFAF5;',
      '  --auth-border: #F0DCC8;',
      '  --auth-text: #3E2723;',
      '  --auth-text-light: #5D4037;',
      '  --auth-text-muted: #A89880;',
      '  --auth-btn-soft: #FFF0E8;',
      '}',
      '@keyframes authSlideUp { from { transform: translateY(20px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }',
      '/* ===== 关闭按钮 ===== */',
      '.auth-close {',
      '  position: absolute; top: 10px; right: 14px;',
      '  width: 40px; height: 40px;',
      '  border: none; background: transparent;',
      '  font-size: 30px; color: #999;',
      '  cursor: pointer; line-height: 1;',
      '  border-radius: 50%;',
      '}',
      '.auth-close:hover { color: #333; background: rgba(0, 0, 0, 0.05); }',
      '/* ===== 标题 ===== */',
      '.auth-title {',
      '  font-size: 22px; font-weight: 800;',
      '  color: var(--auth-primary-dark);',
      '  text-align: center;',
      '  margin-bottom: 24px; line-height: 1.4;',
      '}',
      '/* ===== 表单字段 ===== */',
      '.auth-field { margin-bottom: 16px; }',
      '.auth-field-code { display: flex; gap: 10px; align-items: stretch; }',
      '.auth-label {',
      '  display: block; font-size: 15px;',
      '  color: var(--auth-text-light);',
      '  margin-bottom: 8px; font-weight: 600;',
      '}',
      '.auth-input {',
      '  width: 100%; height: 56px;',
      '  border: 2px solid var(--auth-border);',
      '  border-radius: 14px;',
      '  padding: 0 16px; font-size: 18px;',
      '  color: var(--auth-text);',
      '  background: var(--auth-bg-soft);',
      '  outline: none; transition: border-color 0.2s;',
      '  -webkit-appearance: none;',
      '}',
      '.auth-input:focus { border-color: var(--auth-primary); }',
      '.auth-input::placeholder { color: var(--auth-text-muted); }',
      '.auth-code-input { flex: 1; min-width: 0; }',
      '/* ===== 获取验证码按钮 ===== */',
      '.auth-send-btn {',
      '  flex-shrink: 0; height: 56px; padding: 0 16px;',
      '  border: none; border-radius: 14px;',
      '  background: var(--auth-btn-soft);',
      '  color: var(--auth-primary);',
      '  font-size: 16px; font-weight: 700;',
      '  cursor: pointer; white-space: nowrap;',
      '  transition: background 0.2s, color 0.2s;',
      '}',
      '.auth-send-btn:hover:not(:disabled) { background: var(--auth-primary-light); color: #fff; }',
      '.auth-send-btn:disabled { color: var(--auth-text-muted); background: #F0EBE3; cursor: not-allowed; }',
      '/* ===== 开始体验按钮 ===== */',
      '.auth-submit-btn {',
      '  width: 100%; height: 56px;',
      '  border: none; border-radius: 14px;',
      '  background: linear-gradient(135deg, var(--auth-primary-light), var(--auth-primary));',
      '  color: #fff; font-size: 19px; font-weight: 700;',
      '  cursor: pointer; margin-top: 8px;',
      '  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);',
      '  transition: transform 0.15s, box-shadow 0.15s;',
      '}',
      '.auth-submit-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2); }',
      '/* ===== 底部提示与登录链接 ===== */',
      '.auth-tip {',
      '  text-align: center; font-size: 13px;',
      '  color: var(--auth-text-muted); margin-top: 14px;',
      '}',
      '.auth-login-link {',
      '  display: block; text-align: center;',
      '  font-size: 16px; color: var(--auth-primary);',
      '  text-decoration: none; margin-top: 12px;',
      '  font-weight: 600; cursor: pointer;',
      '}',
      '.auth-login-link:hover { text-decoration: underline; }'
    ].join('\n');
    document.head.appendChild(style);
  }

  // 限制输入框只接受数字
  function restrictNumeric(input, maxLen) {
    input.addEventListener('input', function () {
      var v = input.value.replace(/\D/g, '');
      if (v.length > maxLen) v = v.slice(0, maxLen);
      input.value = v;
    });
  }

  // 高亮输入框（校验失败时）
  function flashError(input) {
    input.focus();
    input.style.borderColor = '#E53E3E';
    setTimeout(function () { input.style.borderColor = ''; }, 1600);
  }

  // 构建弹窗 DOM 并绑定事件
  function buildModal() {
    overlay = document.createElement('div');
    overlay.className = 'auth-overlay';

    var modal = document.createElement('div');
    modal.className = 'auth-modal';
    modal.innerHTML =
      '<button type="button" class="auth-close" aria-label="关闭">×</button>' +
      '<h2 class="auth-title">免费体验银发就医小棉袄</h2>' +
      '<div class="auth-field">' +
      '  <label class="auth-label" for="auth-phone">手机号</label>' +
      '  <input type="tel" id="auth-phone" class="auth-input" placeholder="请输入11位手机号" maxlength="11" inputmode="numeric" autocomplete="tel">' +
      '</div>' +
      '<div class="auth-field auth-field-code">' +
      '  <input type="tel" id="auth-code" class="auth-input auth-code-input" placeholder="6位验证码" maxlength="6" inputmode="numeric" autocomplete="one-time-code">' +
      '  <button type="button" id="auth-send-code" class="auth-send-btn">获取验证码</button>' +
      '</div>' +
      '<button type="button" id="auth-submit" class="auth-submit-btn">开始体验</button>' +
      '<p class="auth-tip">Demo演示，不会真实发送短信</p>' +
      '<a id="auth-login-link" class="auth-login-link">已有账号？直接登录 →</a>';

    overlay.appendChild(modal);

    // 点击遮罩空白处关闭
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeModal();
    });

    // ✕ 关闭按钮
    modal.querySelector('.auth-close').addEventListener('click', closeModal);

    var phoneInput = modal.querySelector('#auth-phone');
    var codeInput = modal.querySelector('#auth-code');

    // 仅允许输入数字
    restrictNumeric(phoneInput, 11);
    restrictNumeric(codeInput, 6);

    // 获取验证码 + 60秒倒计时
    modal.querySelector('#auth-send-code').addEventListener('click', startCountdown);

    // 开始体验：校验通过后跳转
    modal.querySelector('#auth-submit').addEventListener('click', handleSubmit);

    // 直接登录：跳转
    modal.querySelector('#auth-login-link').addEventListener('click', function (e) {
      e.preventDefault();
      window.location.href = redirectUrl;
    });

    // ESC 关闭
    document.addEventListener('keydown', handleEsc);

    return overlay;
  }

  function handleEsc(e) {
    if (e.key === 'Escape' || e.keyCode === 27) closeModal();
  }

  // 启动验证码倒计时
  function startCountdown() {
    var phoneInput = document.getElementById('auth-phone');
    var phone = phoneInput.value.trim();
    // 校验手机号：以1开头共11位
    if (!/^1\d{10}$/.test(phone)) {
      flashError(phoneInput);
      return;
    }

    var btn = document.getElementById('auth-send-code');
    btn.disabled = true;
    countdownSeconds = 60;
    btn.textContent = countdownSeconds + '秒后重发';

    clearInterval(countdownTimer);
    countdownTimer = setInterval(function () {
      countdownSeconds--;
      if (countdownSeconds <= 0) {
        clearInterval(countdownTimer);
        countdownTimer = null;
        btn.disabled = false;
        btn.textContent = '获取验证码';
      } else {
        btn.textContent = countdownSeconds + '秒后重发';
      }
    }, 1000);
  }

  // 提交注册：校验手机号+验证码后跳转
  function handleSubmit() {
    var phoneInput = document.getElementById('auth-phone');
    var codeInput = document.getElementById('auth-code');
    var phone = phoneInput.value.trim();
    var code = codeInput.value.trim();

    if (!/^1\d{10}$/.test(phone)) {
      flashError(phoneInput);
      return;
    }
    if (!/^\d{6}$/.test(code)) {
      flashError(codeInput);
      return;
    }
    // 校验通过，跳转首页
    window.location.href = redirectUrl;
  }

  // 打开弹窗
  function openAuthModal(options) {
    options = options || {};
    redirectUrl = options.redirectUrl || '../html/me/me_home.html';

    injectStyles();
    buildModal();
    document.body.appendChild(overlay);
    document.body.style.overflow = 'hidden';

    // 自动聚焦手机号输入框
    setTimeout(function () {
      var phoneInput = document.getElementById('auth-phone');
      if (phoneInput) phoneInput.focus();
    }, 300);
  }

  // 关闭弹窗
  function closeModal() {
    if (overlay && overlay.parentNode) {
      overlay.parentNode.removeChild(overlay);
      overlay = null;
    }
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    document.body.style.overflow = '';
    document.removeEventListener('keydown', handleEsc);
  }

  // 暴露为全局方法
  window.openAuthModal = openAuthModal;

  // 绑定所有带 .auth-trigger 的元素：点击时拦截默认跳转，改为打开注册弹窗
  // 这样可保留原 href 作为降级（JS 未加载时仍可直接跳转）与跳转地址来源
  function bindTriggers() {
    var triggers = document.querySelectorAll('.auth-trigger');
    for (var i = 0; i < triggers.length; i++) {
      triggers[i].addEventListener('click', function (e) {
        e.preventDefault();
        var url = this.getAttribute('href') || '../html/me/me_home.html';
        openAuthModal({ redirectUrl: url });
      });
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bindTriggers);
  } else {
    bindTriggers();
  }
})();
