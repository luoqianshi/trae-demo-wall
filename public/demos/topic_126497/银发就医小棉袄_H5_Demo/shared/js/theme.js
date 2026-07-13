/**
 * @trae-gen true
 * @trae-review-status reviewed
 * @trae-module shared-js
 */

function switchTheme(mode) {
  var className = mode === 'standard' ? 'theme-standard' : 'theme-accessible';
  // 用 classList 增删，避免擦除 body 其他 class（如 demo-banner）
  document.body.classList.remove('theme-standard', 'theme-accessible');
  document.body.classList.add(className);
  // 同步写父页面 body，让挂在父页面的浮动助手球也响应适老化
  try {
    if (window.top && window.top.document && window.top !== window) {
      window.top.document.body.classList.remove('theme-standard', 'theme-accessible');
      window.top.document.body.classList.add(className);
    }
  } catch (e) {
    // 跨域时无法访问父页面，静默降级
  }
  localStorage.setItem('theme_mode', mode);
  localStorage.setItem('theme_user_choice', mode);

  document.querySelectorAll('.theme-btn').forEach(btn => {
    const btnMode = btn.getAttribute('data-theme');
    if (btnMode === mode) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
}

function getCurrentTheme() {
  // 银发产品默认适老模式，让老人首开即看到大字
  if (localStorage.getItem('theme_user_choice')) {
    return localStorage.getItem('theme_mode') || 'accessible';
  }
  return 'accessible';
}

function initTheme() {
  var savedTheme = getCurrentTheme();
  var className = savedTheme === 'standard' ? 'theme-standard' : 'theme-accessible';
  document.body.classList.remove('theme-standard', 'theme-accessible');
  document.body.classList.add(className);
  try {
    if (window.top && window.top.document && window.top !== window) {
      window.top.document.body.classList.remove('theme-standard', 'theme-accessible');
      window.top.document.body.classList.add(className);
    }
  } catch (e) {
    // 跨域时无法访问父页面，静默降级
  }
}

document.addEventListener('DOMContentLoaded', initTheme);
