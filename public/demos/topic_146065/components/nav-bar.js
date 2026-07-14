/* ========== nav-bar.js — 顶部导航栏组件（Stack 页用） ========== */

const NavBar = (() => {
  'use strict';

  // title: 标题, action: { text, callback } 或 null
  function render(title, action) {
    let actionHtml = '';
    if (action) {
      const disabled = action.disabled ? ' disabled' : '';
      actionHtml = `<div class="nav-action${disabled}" data-nav-action="${action.id || ''}">${action.text}</div>`;
    } else {
      actionHtml = '<div style="width:32px"></div>';
    }

    return `
      <div class="nav-bar">
        <div class="nav-back" data-nav-back>‹</div>
        <div class="nav-title">${FoodCard.escapeHtml(title)}</div>
        ${actionHtml}
      </div>`;
  }

  // 挂载并绑定事件
  function mount(container, title, action) {
    container.innerHTML = render(title, action);

    // 返回按钮
    const backBtn = container.querySelector('[data-nav-back]');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        Router.goBack();
      });
    }

    // 右侧操作按钮
    if (action && !action.disabled) {
      const actionBtn = container.querySelector('[data-nav-action]');
      if (actionBtn && action.callback) {
        actionBtn.addEventListener('click', action.callback);
      }
    }
  }

  return { render, mount };
})();
